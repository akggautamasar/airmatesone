
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Event } from '@/types/events';
import { useAuth } from './useAuth.tsx';
import { startOfMonth, endOfMonth, formatISO, startOfToday, addDays } from 'date-fns';

const fetchEventsWithProfiles = async (startDate: string, endDate: string): Promise<Event[]> => {
    const { data: events, error } = await supabase
        .from('events')
        .select('*')
        .gte('event_date', startDate)
        .lte('event_date', endDate)
        .order('event_date', { ascending: true });

    if (error) throw error;
    if (!events) return [];

    const userIds = [...new Set(events.map(event => event.created_by).filter((id): id is string => !!id))];
    
    if (userIds.length === 0) {
        return events.map(event => ({ ...event, created_by_profile: null }));
    }
    
    const { data: profiles, error: profileError } = await supabase
      .rpc('get_users_details', { p_user_ids: userIds });

    if (profileError) {
      console.error("Failed to fetch profiles for events:", profileError);
      return events.map(event => ({ ...event, created_by_profile: null }));
    }

    const profilesById = new Map(profiles?.map(p => [p.id, { name: p.name, email: p.email }]));

    return events.map(event => ({
      ...event,
      created_by_profile: (event.created_by ? profilesById.get(event.created_by) : null) || null,
    }));
};

export const useEvents = (date: Date) => {
    const queryClient = useQueryClient();
    const { user } = useAuth();

    const startDate = formatISO(startOfMonth(date), { representation: 'date' });
    const endDate = formatISO(endOfMonth(date), { representation: 'date' });
    
    const { data: events, isLoading, error } = useQuery({
        queryKey: ['events', { month: date.getMonth(), year: date.getFullYear() }],
        queryFn: () => fetchEventsWithProfiles(startDate, endDate),
        enabled: !!user,
    });

    const addEventMutation = useMutation({
        mutationFn: async (newEvent: Omit<Event, 'id' | 'created_at' | 'updated_at' | 'created_by_profile'>) => {
            const { data, error } = await supabase.from('events').insert(newEvent).select().single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['events'] });
            queryClient.invalidateQueries({ queryKey: ['upcomingEvents'] });
        },
    });

    const updateEventMutation = useMutation({
        mutationFn: async ({ id, ...updateData }: Partial<Omit<Event, 'created_by_profile'>> & { id: string }) => {
            const { data, error } = await supabase.from('events').update(updateData).eq('id', id).select().single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['events'] });
            queryClient.invalidateQueries({ queryKey: ['upcomingEvents'] });
        },
    });

    const deleteEventMutation = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from('events').delete().eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['events'] });
            queryClient.invalidateQueries({ queryKey: ['upcomingEvents'] });
        },
    });

    return {
        events: events || [],
        isLoading,
        error,
        addEvent: addEventMutation.mutateAsync,
        updateEvent: updateEventMutation.mutateAsync,
        deleteEvent: deleteEventMutation.mutateAsync,
    };
};

export const useUpcomingEvents = (days: number) => {
    const { user } = useAuth();

    const { data: events, isLoading, error } = useQuery({
        queryKey: ['upcomingEvents', days],
        queryFn: async () => {
            const today = startOfToday();
            const futureDate = addDays(today, days);
    
            const startDate = formatISO(today, { representation: 'date' });
            const endDate = formatISO(futureDate, { representation: 'date' });
            
            return fetchEventsWithProfiles(startDate, endDate);
        },
        enabled: !!user,
    });

    return {
        upcomingEvents: events || [],
        isLoading,
        error,
    };
}
