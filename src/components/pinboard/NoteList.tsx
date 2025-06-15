
import { useSharedNotes } from '@/hooks/useSharedNotes';
import { NoteCard } from './NoteCard';
import { Skeleton } from '@/components/ui/skeleton';
import { AddNoteForm } from './AddNoteForm';

export const NoteList = () => {
  const { notes, isLoading } = useSharedNotes();

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Shared Pinboard</h2>
        <AddNoteForm />
      </div>

      {isLoading && (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      )}
      
      {!isLoading && !notes?.length && (
        <div className="text-center py-12 text-muted-foreground">
          <p>No notes on the pinboard yet.</p>
          <p>Click "Add Note" to get started!</p>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {notes?.map((note) => (
          <NoteCard key={note.id} note={note} />
        ))}
      </div>
    </div>
  );
};
