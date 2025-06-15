
-- Create a table to store chore information
CREATE TABLE public.chores (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    name text NOT NULL,
    description text NULL,
    created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    participants text[] NULL, -- Array of roommate emails
    frequency text NOT NULL DEFAULT 'daily'::text,
    start_date date NOT NULL,
    CONSTRAINT chores_pkey PRIMARY KEY (id)
);

-- Enable Row-Level Security
ALTER TABLE public.chores ENABLE ROW LEVEL SECURITY;

-- RLS Policies for chores table
CREATE POLICY "Users can view chores they are part of"
ON public.chores FOR SELECT
USING (
  auth.uid() = created_by OR
  get_current_user_email() = ANY(coalesce(participants, '{}'))
);

CREATE POLICY "Users can insert chores they create"
ON public.chores FOR INSERT
WITH CHECK (
  auth.uid() = created_by
);

CREATE POLICY "Users can update their own chores"
ON public.chores FOR UPDATE
USING (
  auth.uid() = created_by
);

CREATE POLICY "Users can delete their own chores"
ON public.chores FOR DELETE
USING (
  auth.uid() = created_by
);

-- Add chores table to the realtime publication for future updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.chores;

