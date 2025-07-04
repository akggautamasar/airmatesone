
import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { CheckSquare, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format, differenceInDays, parseISO } from "date-fns";
import { useChores } from "@/hooks/useChores";
import { useRoommates } from "@/hooks/useRoommates";
import { useAuth } from "@/hooks/useAuth";

export const TodayChoresList = () => {
  const [today, setToday] = useState(() => new Date());
  const { chores, loading } = useChores();
  const { roommates } = useRoommates();
  const { user } = useAuth();

  // Update the date at midnight
  useEffect(() => {
    const now = new Date();
    const msUntilMidnight =
      new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 1).getTime() - now.getTime();
    const timeout = setTimeout(() => setToday(new Date()), msUntilMidnight);
    return () => clearTimeout(timeout);
  }, [today]);

  // Get current user's email and all roommate emails
  const allEmails = [
    user?.email,
    ...roommates.map(r => r.email)
  ].filter(Boolean);

  // Filter chores that include current user or their roommates
  const visibleChores = chores.filter(chore => 
    chore.participants?.some(participant => allEmails.includes(participant))
  );

  const getTodayAssignment = (chore: any) => {
    if (!chore.participants || chore.participants.length === 0) {
      return 'No one assigned';
    }

    if (chore.assignment_type === 'weekly_rotation') {
      if (!chore.weekly_schedule) {
        return 'Not configured';
      }
      const dayOfWeek = format(today, 'eeee').toLowerCase();
      const schedule = chore.weekly_schedule as { [key: string]: string };
      const assignedEmail = schedule[dayOfWeek];

      if (!assignedEmail || assignedEmail === 'unassigned') {
        return 'No one for today';
      }
      
      return assignedEmail.split('@')[0];
    }
    
    // Default to daily rotation
    const startDate = parseISO(chore.start_date);
    const todayDate = new Date();
    todayDate.setHours(0,0,0,0);
    const daysSinceStart = differenceInDays(todayDate, startDate);

    if (daysSinceStart < 0) {
      return 'Starts soon';
    }

    const assignedIndex = daysSinceStart % chore.participants.length;
    const assignedEmail = chore.participants[assignedIndex];
    return assignedEmail.split('@')[0];
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CheckSquare className="h-5 w-5 text-green-600" />
            <span>Today's Chores</span>
          </CardTitle>
          <CardDescription>
            {format(today, "EEEE, MMMM d, yyyy")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="py-4 flex justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <CheckSquare className="h-5 w-5 text-green-600" />
          <span>Today's Chores</span>
        </CardTitle>
        <CardDescription>
          {format(today, "EEEE, MMMM d, yyyy")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {visibleChores.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No chores scheduled for today.</p>
        ) : (
          <ul className="divide-y divide-gray-100 [&>li]:py-3">
            {visibleChores.map((chore) => {
              const assignedPerson = getTodayAssignment(chore);
              return (
                <li key={chore.id} className="flex justify-between items-center">
                  <div className="flex items-center space-x-3">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <span className="font-medium">{chore.name}</span>
                      {chore.description && (
                        <p className="text-sm text-muted-foreground">{chore.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-medium text-blue-600">
                      {assignedPerson}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        <div className="pt-2 text-right">
          <Button asChild variant="link" size="sm">
            <a href="#" onClick={(e) => {
              e.preventDefault();
              // Navigate to chores tab
              const choreTab = document.querySelector('[value="chores"]') as HTMLElement;
              choreTab?.click();
            }}>
              Manage Chores
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
