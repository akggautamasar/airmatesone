
-- Add new columns to the chores table for assignment type and weekly schedule
ALTER TABLE public.chores
ADD COLUMN assignment_type TEXT NOT NULL DEFAULT 'daily_rotation',
ADD COLUMN weekly_schedule JSONB NULL,
ADD COLUMN reminder_time TIME WITHOUT TIME ZONE NULL DEFAULT '08:00:00';

-- The `DEFAULT 'daily_rotation'` will apply to all existing rows,
-- setting them to the current assignment method.
