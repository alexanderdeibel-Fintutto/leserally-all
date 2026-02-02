import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: authError } = await supabaseClient.auth.getClaims(token);
    if (authError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { image, meterType } = await req.json();
    
    if (!image) {
      throw new Error("No image provided");
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Get meter type context
    const meterTypeDescriptions: Record<string, string> = {
      electricity: "Stromzähler (kWh)",
      gas: "Gaszähler (m³)",
      cold_water: "Kaltwasserzähler (m³)",
      warm_water: "Warmwasserzähler (m³)",
      heating: "Heizungszähler (kWh)",
    };
    
    const meterContext = meterType && meterTypeDescriptions[meterType] 
      ? `Dies ist ein ${meterTypeDescriptions[meterType]}.` 
      : "Dies ist ein Verbrauchszähler.";

    const systemPrompt = `Du bist ein OCR-Spezialist für die Erkennung von Zählerständen. ${meterContext}

AUFGABE:
Analysiere das Bild und extrahiere den aktuellen Zählerstand.

REGELN:
1. Extrahiere NUR die Hauptanzeige des Zählers (die großen Zahlen)
2. Ignoriere Nachkommastellen in roter Farbe oder hinter einem Komma/Punkt (oft für Zehntel-Einheiten)
3. Gib den Wert als Ganzzahl zurück
4. Wenn du unsicher bist, schätze die Konfidenz niedriger ein
5. Bei unlesbaren Bildern, gib null zurück

WICHTIG: Antworte NUR mit einem JSON-Objekt im Format:
{"value": <zahl>, "confidence": <0-100>}

Beispiel für einen Zähler mit Anzeige "12345.6":
{"value": 12345, "confidence": 92}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: { url: image },
              },
              {
                type: "text",
                text: "Bitte lies den Zählerstand von diesem Bild ab.",
              },
            ],
          },
        ],
        max_tokens: 200,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit erreicht. Bitte versuchen Sie es später erneut." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Guthaben aufgebraucht. Bitte laden Sie Ihr Konto auf." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No response from AI");
    }

    // Parse the JSON response
    let result;
    try {
      // Extract JSON from the response (in case there's extra text)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("Failed to parse OCR response:", content);
      throw new Error("Invalid OCR response format");
    }

    if (result.value === null || result.value === undefined) {
      return new Response(
        JSON.stringify({ error: "Zählerstand konnte nicht erkannt werden" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        value: Number(result.value),
        confidence: Number(result.confidence) || 85,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("OCR error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "OCR-Verarbeitung fehlgeschlagen" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
