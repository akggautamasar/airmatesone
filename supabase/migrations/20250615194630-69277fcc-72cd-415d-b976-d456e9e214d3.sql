
CREATE TABLE public.event_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    is_default BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Unique constraint for user-specific event types
CREATE UNIQUE INDEX event_types_user_name_unique ON public.event_types (created_by, name) WHERE created_by IS NOT NULL;
-- Unique constraint for default event types
CREATE UNIQUE INDEX event_types_default_name_unique ON public.event_types (name) WHERE is_default = true;

CREATE TRIGGER set_event_types_timestamp
BEFORE UPDATE ON public.event_types
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

ALTER TABLE public.event_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view default and their own event types"
ON public.event_types
FOR SELECT
USING (is_default = true OR auth.uid() = created_by);

CREATE POLICY "Users can insert their own event types"
ON public.event_types
FOR INSERT
WITH CHECK (auth.uid() = created_by AND is_default = false);

CREATE POLICY "Users can update their own event types"
ON public.event_types
FOR UPDATE
USING (auth.uid() = created_by AND is_default = false);

CREATE POLICY "Users can delete their own event types"
ON public.event_types
FOR DELETE
USING (auth.uid() = created_by AND is_default = false);

INSERT INTO public.event_types (name, is_default) VALUES
('General', true),
('Bill Due', true),
('Birthday', true),
('LPG Refill', true),
('Maid''s Off', true),
('Festival Plan', true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.event_types;
