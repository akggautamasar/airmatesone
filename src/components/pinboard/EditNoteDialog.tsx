
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { SharedNoteWithDetails } from '@/hooks/useSharedNotes';
import { Edit } from 'lucide-react';

interface EditNoteDialogProps {
  note: SharedNoteWithDetails;
  onUpdate: (id: string, updates: { title?: string; content: string; is_pinned: boolean; color_hex?: string }) => void;
}

export const EditNoteDialog = ({ note, onUpdate }: EditNoteDialogProps) => {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(note.title || '');
  const [content, setContent] = useState(note.content);
  const [isPinned, setIsPinned] = useState(note.is_pinned);
  const [colorHex, setColorHex] = useState(note.color_hex || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    onUpdate(note.id, {
      title: title.trim() || undefined,
      content: content.trim(),
      is_pinned: isPinned,
      color_hex: colorHex || undefined,
    });
    
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Edit className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Note</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Title (optional)</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Note title..."
            />
          </div>
          
          <div>
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What's on your mind?"
              className="min-h-[100px]"
              required
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="pinned"
              checked={isPinned}
              onCheckedChange={setIsPinned}
            />
            <Label htmlFor="pinned">Pin to top</Label>
          </div>
          
          <div>
            <Label htmlFor="color">Color (optional)</Label>
            <Input
              id="color"
              type="color"
              value={colorHex}
              onChange={(e) => setColorHex(e.target.value)}
              className="w-16 h-10"
            />
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Update Note</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
