
CREATE TABLE public.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    event_date DATE NOT NULL,
    notes TEXT,
    event_type TEXT
);

CREATE INDEX events_created_by_idx ON public.events (created_by);
CREATE INDEX events_event_date_idx ON public.events (event_date);

COMMENT ON COLUMN public.events.event_type IS 'e.g., Bill Due, Birthday, General';

CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_events_timestamp
BEFORE UPDATE ON public.events
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all users to view events"
ON public.events
FOR SELECT
USING (true);

CREATE POLICY "Allow users to insert their own events"
ON public.events
FOR INSERT
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Allow users to update their own events"
ON public.events
FOR UPDATE
USING (auth.uid() = created_by);

CREATE POLICY "Allow users to delete their own events"
ON public.events
FOR DELETE
USING (auth.uid() = created_by);

-- Add events table to realtime
ALTER TABLE public.events REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.events;
