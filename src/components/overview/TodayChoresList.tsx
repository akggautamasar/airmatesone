import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { CheckSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { useChoresListWithFixedDate } from "@/hooks/useChoresListWithFixedDate";

export const TodayChoresList = () => {
  const [today, setToday] = useState(() => new Date());

  // Update the date at midnight
  useEffect(() => {
    const now = new Date();
    const msUntilMidnight =
      new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 1).getTime() - now.getTime();
    const timeout = setTimeout(() => setToday(new Date()), msUntilMidnight);
    return () => clearTimeout(timeout);
  }, [today]);

  const { chores, loading } = useChoresListWithFixedDate(today);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <CheckSquare className="h-5 w-5 text-green-600" />
          <span>Today&apos;s Chores</span>
        </CardTitle>
        <CardDescription>
          {format(today, "yyyy-MM-dd EEEE")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {loading ? (
          <div className="py-4 flex justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
          </div>
        ) : chores.length === 0 ? (
          <p className="text-gray-500 text-center">No chores scheduled for today.</p>
        ) : (
          <ul className="divide-y divide-gray-100 [&>li]:py-2">
            {chores.map((chore) => (
              <li key={chore.id} className="flex justify-between items-center">
                <div>
                  <span className="font-medium">{chore.title}</span>
                  {chore.assigned_to_name && (
                    <span className="text-sm text-muted-foreground ml-2">
                      ({chore.assigned_to_name})
                    </span>
                  )}
                </div>
                {chore.is_completed ? (
                  <span className="text-green-600 text-xs">Done</span>
                ) : (
                  <span className="text-orange-600 text-xs">Pending</span>
                )}
              </li>
            ))}
          </ul>
        )}
        <div className="pt-2 text-right">
          <Button asChild variant="link" size="sm">
            <a href="#/chores">Go to Chores</a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
