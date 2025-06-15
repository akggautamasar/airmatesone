
import React from 'react';
import { useFormContext } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface WeeklyDayAssignerProps {
  roommates: { email: string; name: string | null }[];
}

const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export const WeeklyDayAssigner = ({ roommates }: WeeklyDayAssignerProps) => {
  const { control, watch } = useFormContext();
  const selectedParticipantEmails = watch('participants') || [];
  
  const availableRoommates = roommates.filter(p => selectedParticipantEmails.includes(p.email));

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <div className="space-y-2">
        <h3 className="text-md font-medium">Assign Days to Roommates</h3>
        <p className="text-sm text-muted-foreground">
          For each day of the week, select a roommate from the participants list.
        </p>
      </div>
      <div className="space-y-2">
        {daysOfWeek.map((day) => (
          <FormField
            key={day}
            control={control}
            name={`weekly_schedule.${day}`}
            render={({ field }) => (
              <FormItem className="grid grid-cols-1 md:grid-cols-3 items-center gap-2 md:gap-4">
                <FormLabel className="capitalize">{day}</FormLabel>
                <div className="md:col-span-2">
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select roommate" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {availableRoommates.map(roommate => (
                        <SelectItem key={roommate.email} value={roommate.email}>
                          {roommate.name} ({roommate.email.split('@')[0]})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </FormItem>
            )}
          />
        ))}
        <FormField
            control={control}
            name="weekly_schedule"
            render={() => <FormMessage />}
        />
      </div>
    </div>
  );
};
