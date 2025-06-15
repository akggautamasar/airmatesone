
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth.tsx';
import { Tables } from '@/integrations/supabase/types';

export type EventType = Tables<'event_types'>;

const fetchEventTypes = async (): Promise<EventType[]> => {
    const { data, error } = await supabase
        .from('event_types')
        .select('*')
        .order('is_default', { ascending: false, nullsFirst: false })
        .order('name', { ascending: true });

    if (error) throw error;
    return data;
};

export const useEventTypes = () => {
    const queryClient = useQueryClient();
    const { user } = useAuth();

    const { data: eventTypes, isLoading, error } = useQuery({
        queryKey: ['eventTypes'],
        queryFn: fetchEventTypes,
        enabled: !!user,
    });

    const addEventTypeMutation = useMutation({
        mutationFn: async (newEventType: Pick<EventType, 'name' | 'created_by'>) => {
            const { data, error } = await supabase.from('event_types').insert(newEventType).select().single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['eventTypes'] });
        },
    });

    const updateEventTypeMutation = useMutation({
        mutationFn: async ({ id, ...updateData }: Partial<EventType> & { id: string }) => {
            const { data, error } = await supabase.from('event_types').update(updateData).eq('id', id).select().single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['eventTypes'] });
        },
    });

    const deleteEventTypeMutation = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from('event_types').delete().eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['eventTypes'] });
        },
    });

    return {
        eventTypes: eventTypes || [],
        isLoading,
        error,
        addEventType: addEventTypeMutation.mutateAsync,
        updateEventType: updateEventTypeMutation.mutateAsync,
        deleteEventType: deleteEventTypeMutation.mutateAsync,
    };
};
