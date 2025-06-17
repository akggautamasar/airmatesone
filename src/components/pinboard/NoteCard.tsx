
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SharedNoteWithDetails, useSharedNotes } from '@/hooks/useSharedNotes';
import { formatDistanceToNow } from 'date-fns';
import { Pin, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { EditNoteDialog } from './EditNoteDialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface NoteCardProps {
  note: SharedNoteWithDetails;
}

export const NoteCard = ({ note }: NoteCardProps) => {
  const { user } = useAuth();
  const { updateNote, deleteNote } = useSharedNotes();
  const authorName = note.user?.name || note.user?.email || 'Anonymous';
  const timeAgo = formatDistanceToNow(new Date(note.created_at), { addSuffix: true });
  const isOwner = user?.id === note.user_id;

  const handleDelete = () => {
    deleteNote(note.id);
  };

  const handleUpdate = (id: string, updates: any) => {
    updateNote({ id, updates });
  };

  return (
    <Card 
      className={note.is_pinned ? 'border-primary' : ''} 
      style={{ backgroundColor: note.color_hex ? `${note.color_hex}20` : undefined }}
    >
      <CardHeader>
        <div className="flex justify-between items-start">
            <div>
                <CardTitle>{note.title || 'Note'}</CardTitle>
                <CardDescription>
                    By {authorName} • {timeAgo}
                </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {note.is_pinned && <Pin className="h-5 w-5 text-primary" />}
              {isOwner && (
                <div className="flex gap-1">
                  <EditNoteDialog note={note} onUpdate={handleUpdate} />
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Note</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete this note? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}
            </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="whitespace-pre-wrap">{note.content}</p>
      </CardContent>
      <CardFooter>
        {/* Actions like reactions will go here */}
      </CardFooter>
    </Card>
  );
};
