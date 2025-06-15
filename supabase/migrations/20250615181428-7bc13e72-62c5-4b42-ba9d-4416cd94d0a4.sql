
-- Enable pg_cron and pg_net extensions
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Grant usage to postgres role
GRANT USAGE ON SCHEMA cron TO postgres;
GRANT USAGE ON SCHEMA net TO postgres;

-- Grant all on cron.job table to postgres role
GRANT ALL ON TABLE cron.job TO postgres;

-- Schedule the function to run every minute
-- We are using every minute for testing purposes, we can change this later to a more reasonable schedule.
SELECT cron.schedule(
  'send-chore-reminders-job',
  '* * * * *', -- This runs every minute
  $$
  SELECT
    net.http_post(
        url:='https://eizcqhhwvephmrfxtghw.supabase.co/functions/v1/send-chore-reminders',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVpemNxaGh3dmVwaG1yZnh0Z2h3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk2NjIwNzMsImV4cCI6MjA2NTIzODA3M30.widSLABErkrBqge1o9cK4oSVdXNbDe7wj3vQn0ggFT4"}'::jsonb,
        body:='{}'::jsonb
    ) AS request_id;
  $$
);
