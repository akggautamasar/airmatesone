
import { type Database } from '@/integrations/supabase/types';

export type Chore = Database['public']['Tables']['chores']['Row'];
export type ChoreInsert = Database['public']['Tables']['chores']['Insert'];
