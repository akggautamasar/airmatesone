
-- Add a column to track the date of the last sent reminder
ALTER TABLE public.chores
ADD COLUMN last_reminder_sent_date DATE NULL;
