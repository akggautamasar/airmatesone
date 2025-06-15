
import { Tables } from '@/integrations/supabase/types';

export type Event = Tables<'events'> & {
    created_by_profile?: { name: string | null; email: string | null } | null;
};
