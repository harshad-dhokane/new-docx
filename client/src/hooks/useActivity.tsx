import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';

import { useAuth } from './useAuth';

interface ActivityLog {
  id: string;
  created_at: string | null;
  user_id: string;
  action: string;
  resource_type: string | null;
  resource_id: string | null;
  metadata: Json;
}

interface LogActivityParams {
  action: string;
  resourceType?: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
}

export const useActivity = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: activityLogs, isLoading } = useQuery({
    queryKey: ['activity'],
    queryFn: async (): Promise<ActivityLog[]> => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Error fetching activity logs:', error);
        toast({
          title: 'Failed to Load Activity',
          description: 'Could not retrieve activity logs.',
          variant: 'destructive',
        });
        return [];
      }

      return data || [];
    },
  });

  const logActivityMutation = useMutation({
    mutationFn: async (params: LogActivityParams) => {
      if (!user) throw new Error('No user logged in');

      const { data, error } = await supabase
        .from('activity_logs')
        .insert({
          user_id: user.id,
          action: params.action,
          resource_type: params.resourceType,
          resource_id: params.resourceId,
          metadata: params.metadata,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activity'] });
    },
  });

  return {
    activityLogs,
    isLoading,
    logActivity: logActivityMutation.mutate,
    isLogging: logActivityMutation.isPending,
  };
};
