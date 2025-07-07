
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useRoommates } from '@/hooks/useRoommates';

interface WeeklyDayAssignerProps {
  weeklySchedule: { [key: string]: string };
  onScheduleChange: (schedule: { [key: string]: string }) => void;
}

const daysOfWeek = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' },
];

export const WeeklyDayAssigner = ({ weeklySchedule, onScheduleChange }: WeeklyDayAssignerProps) => {
  const { roommates } = useRoommates();

  const handleDayChange = (day: string, email: string) => {
    onScheduleChange({
      ...weeklySchedule,
      [day]: email
    });
  };

  const getDisplayName = (email: string) => {
    return email.split('@')[0];
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Weekly Schedule Assignment</CardTitle>
        <CardDescription>
          Assign specific roommates to each day of the week for this chore.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {daysOfWeek.map((day) => (
          <div key={day.key} className="grid grid-cols-1 md:grid-cols-3 items-center gap-2 md:gap-4">
            <Label className="capitalize font-medium">{day.label}</Label>
            <div className="md:col-span-2">
              <Select 
                value={weeklySchedule[day.key] || 'unassigned'} 
                onValueChange={(value) => handleDayChange(day.key, value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select roommate" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {roommates.map(roommate => (
                    <SelectItem key={roommate.email} value={roommate.email}>
                      {roommate.name} ({getDisplayName(roommate.email)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
