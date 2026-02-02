import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { Organization, OrgType } from '@/types/database';

export function useOrganization() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Create organization and assign user to it
  const createOrganization = useMutation({
    mutationFn: async (data: { name: string; type?: OrgType }) => {
      if (!user) throw new Error('Not authenticated');

      // Create organization
      const { data: newOrg, error: orgError } = await supabase
        .from('organizations')
        .insert(data)
        .select()
        .single();

      if (orgError) throw orgError;

      // Update user's profile to link to organization
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ organization_id: newOrg.id })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // Add admin role to creator
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({ user_id: user.id, role: 'admin' });

      // Ignore if role already exists (unique constraint)
      if (roleError && !roleError.message.includes('duplicate')) {
        throw roleError;
      }

      // Add vermieter role as well
      await supabase
        .from('user_roles')
        .insert({ user_id: user.id, role: 'vermieter' });

      return newOrg as Organization;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['buildings'] });
    },
  });

  // Update organization
  const updateOrganization = useMutation({
    mutationFn: async ({ id, ...data }: Partial<Organization> & { id: string }) => {
      const { data: updated, error } = await supabase
        .from('organizations')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return updated as Organization;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });

  return {
    createOrganization,
    updateOrganization,
  };
}
