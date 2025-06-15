
import React from 'react';
import { Chore } from '@/types/chores';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, User, CalendarDays, Users } from 'lucide-react';
import { format, differenceInDays, parseISO } from 'date-fns';
import { useChores } from '@/hooks/useChores';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/hooks/useAuth';

interface ChoreCardProps {
  chore: Chore;
  onChoreDeleted: () => void;
}

export const ChoreCard = ({ chore, onChoreDeleted }: ChoreCardProps) => {
  const { deleteChore } = useChores();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const getAssignedRoommate = () => {
    if (!chore.participants || chore.participants.length === 0) {
      return 'No one assigned';
    }

    if (chore.assignment_type === 'weekly_rotation') {
      if (!chore.weekly_schedule) {
        return 'Not configured';
      }
      const today = new Date();
      const dayOfWeek = format(today, 'eeee').toLowerCase();
      const schedule = chore.weekly_schedule as { [key: string]: string };

      const assignedEmail = schedule[dayOfWeek];

      if (!assignedEmail || assignedEmail === 'unassigned') {
        return 'No one for today';
      }
      
      // The chore only stores the email, so we display the user part of it.
      return assignedEmail.split('@')[0];
    }
    
    // Default to daily rotation
    const startDate = parseISO(chore.start_date);
    const today = new Date();
    today.setHours(0,0,0,0);
    const daysSinceStart = differenceInDays(today, startDate);

    if (daysSinceStart < 0) {
        return `Starts soon`;
    }

    const assignedIndex = daysSinceStart % chore.participants.length;
    const assignedEmail = chore.participants[assignedIndex];
    return assignedEmail.split('@')[0];
  };
  
  const handleDelete = async () => {
    if(!confirm("Are you sure you want to delete this chore?")) return;
    try {
      await deleteChore(chore.id);
      toast({ title: "Chore deleted successfully!" });
      onChoreDeleted();
    } catch (error: any) {
        toast({ title: "Error deleting chore", description: error.message, variant: "destructive" });
    }
  }
  
  const assignedRoommate = getAssignedRoommate();

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle>{chore.name}</CardTitle>
        <CardDescription>{chore.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 flex-grow">
        <div className="flex items-center text-sm text-muted-foreground">
            <User className="mr-2 h-4 w-4" />
            <span>Today's turn: <strong>{assignedRoommate}</strong></span>
        </div>
        {chore.assignment_type === 'daily_rotation' && (
          <div className="flex items-center text-sm text-muted-foreground">
              <CalendarDays className="mr-2 h-4 w-4" />
              <span>Starts on: {chore.start_date}</span>
          </div>
        )}
        <div className="flex items-start text-sm text-muted-foreground">
            <Users className="mr-2 h-4 w-4 mt-1" />
            <div>
              <span>Participants:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {chore.participants?.map(p => <span key={p} className="text-xs bg-secondary text-secondary-foreground rounded-full px-2 py-0.5">{p.split('@')[0]}</span>)}
              </div>
            </div>
        </div>
      </CardContent>
      <CardFooter>
        {user?.id === chore.created_by && (
            <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={handleDelete}>
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </Button>
        )}
      </CardFooter>
    </Card>
  );
};
