
-- Create a table for shared notes (Pinboard)
CREATE TABLE public.shared_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  title TEXT,
  content TEXT NOT NULL,
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  is_done BOOLEAN NOT NULL DEFAULT false,
  done_by_user_id UUID,
  color_hex TEXT,
  CONSTRAINT shared_notes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT shared_notes_done_by_user_id_fkey FOREIGN KEY (done_by_user_id) REFERENCES public.profiles(id)
);

-- Add comments to tables and columns
COMMENT ON TABLE public.shared_notes IS 'Stores shared notes for the pinboard feature.';
COMMENT ON COLUMN public.shared_notes.is_pinned IS 'If true, the note is pinned to the top.';
COMMENT ON COLUMN public.shared_notes.is_archived IS 'If true, the note is archived and not shown in the main view.';
COMMENT ON COLUMN public.shared_notes.is_done IS 'If true, the note is marked as done.';
COMMENT ON COLUMN public.shared_notes.done_by_user_id IS 'The user who marked the note as done.';
COMMENT ON COLUMN public.shared_notes.color_hex IS 'Optional hex color code for the note card.';


-- Enable Row Level Security for shared_notes
ALTER TABLE public.shared_notes ENABLE ROW LEVEL SECURITY;

-- Policies for shared_notes
CREATE POLICY "Allow authenticated users to see all shared notes"
ON public.shared_notes FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can insert their own notes"
ON public.shared_notes FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notes"
ON public.shared_notes FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notes"
ON public.shared_notes FOR DELETE
TO authenticated
USING (auth.uid() = user_id);


-- Create a table for note reactions
CREATE TABLE public.note_reactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  note_id UUID NOT NULL REFERENCES public.shared_notes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  emoji TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT note_reactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT note_reactions_note_id_user_id_key UNIQUE (note_id, user_id)
);

-- Add comments to note_reactions table
COMMENT ON TABLE public.note_reactions IS 'Stores emoji reactions for shared notes.';
COMMENT ON CONSTRAINT note_reactions_note_id_user_id_key ON public.note_reactions IS 'Ensures a user can only have one reaction per note.';

-- Enable Row Level Security for note_reactions
ALTER TABLE public.note_reactions ENABLE ROW LEVEL SECURITY;

-- Policies for note_reactions
CREATE POLICY "Allow authenticated users to see all reactions"
ON public.note_reactions FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can insert their own reactions"
ON public.note_reactions FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reactions"
ON public.note_reactions FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reactions"
ON public.note_reactions FOR DELETE
TO authenticated
USING (auth.uid() = user_id);


-- Create a trigger to automatically update the 'updated_at' timestamp on note update
CREATE TRIGGER set_shared_notes_updated_at
BEFORE UPDATE ON public.shared_notes
FOR EACH ROW
EXECUTE FUNCTION public.trigger_set_timestamp();
