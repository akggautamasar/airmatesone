
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { SharedNoteWithDetails } from '@/hooks/useSharedNotes';
import { formatDistanceToNow } from 'date-fns';
import { Pin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface NoteCardProps {
  note: SharedNoteWithDetails;
}

export const NoteCard = ({ note }: NoteCardProps) => {
  const authorName = note.user?.name || note.user?.email || 'Anonymous';
  const timeAgo = formatDistanceToNow(new Date(note.created_at), { addSuffix: true });

  return (
    <Card className={note.is_pinned ? 'border-primary' : ''}>
      <CardHeader>
        <div className="flex justify-between items-start">
            <div>
                <CardTitle>{note.title || 'Note'}</CardTitle>
                <CardDescription>
                    By {authorName} • {timeAgo}
                </CardDescription>
            </div>
            {note.is_pinned && <Pin className="h-5 w-5 text-primary" />}
        </div>
      </CardHeader>
      <CardContent>
        <p className="whitespace-pre-wrap">{note.content}</p>
      </CardContent>
      <CardFooter>
        {/* Actions like reactions, edit, delete will go here */}
      </CardFooter>
    </Card>
  );
};
