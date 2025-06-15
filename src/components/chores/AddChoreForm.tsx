import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Check, ChevronsUpDown } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useRoommates } from '@/hooks/useRoommates';
import { useChores } from '@/hooks/useChores';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WeeklyDayAssigner } from "./WeeklyDayAssigner";
import { ChoreInsert } from '@/types/chores';

const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters long."),
  description: z.string().optional(),
  participants: z.array(z.string()).min(1, "You must select at least one roommate."),
  assignment_type: z.enum(['daily_rotation', 'weekly_rotation']).default('daily_rotation'),
  start_date: z.date().optional(),
  weekly_schedule: z.record(z.string().nullable()).optional(),
  reminder_time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format (HH:mm)").default('08:00'),
}).refine(data => {
  if (data.assignment_type === 'daily_rotation') {
    return !!data.start_date;
  }
  return true;
}, {
  message: "A start date is required for daily rotation.",
  path: ["start_date"],
}).refine(data => {
  if (data.assignment_type === 'weekly_rotation') {
    return data.weekly_schedule && Object.values(data.weekly_schedule).some(v => v && v !== 'unassigned');
  }
  return true;
}, {
  message: "You must assign at least one day in the weekly schedule.",
  path: ["weekly_schedule"],
});

interface AddChoreFormProps {
  onChoreAdded: () => void;
}

export const AddChoreForm = ({ onChoreAdded }: AddChoreFormProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { roommates } = useRoommates();
  const { addChore, isAdding } = useChores();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      participants: [],
      assignment_type: 'daily_rotation',
      weekly_schedule: daysOfWeek.reduce((acc, day) => ({ ...acc, [day]: 'unassigned' }), {}),
      reminder_time: '08:00',
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user) return;

    const payload: ChoreInsert = {
      name: values.name,
      description: values.description,
      participants: values.participants,
      created_by: user.id,
      assignment_type: values.assignment_type,
      start_date: format(new Date(), "yyyy-MM-dd"), // default for weekly, overwritten for daily
      reminder_time: `${values.reminder_time}:00`,
    };

    if (values.assignment_type === 'daily_rotation' && values.start_date) {
      payload.start_date = format(values.start_date, "yyyy-MM-dd");
      payload.frequency = 'daily';
    } else if (values.assignment_type === 'weekly_rotation') {
      const schedule = values.weekly_schedule;
      const finalSchedule = schedule ? Object.entries(schedule).reduce((acc, [day, email]) => {
        if (email && email !== 'unassigned') {
          acc[day] = email;
        }
        return acc;
      }, {} as Record<string, string>) : {};
      payload.weekly_schedule = finalSchedule;
      payload.frequency = 'weekly';
    }

    try {
      await addChore(payload);
      toast({ title: "Success!", description: "New chore has been added." });
      form.reset();
      onChoreAdded();
    } catch (error: any) {
      toast({ title: "Error adding chore", description: error.message, variant: "destructive" });
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Add a New Chore</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Chore Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Do the dishes" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Any details about the chore" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="participants"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Participants</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          className={cn(
                            "w-full justify-between",
                            !field.value.length && "text-muted-foreground"
                          )}
                        >
                          {field.value.length > 0 ? `${field.value.length} selected` : "Select roommates"}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                      <Command>
                        <CommandInput placeholder="Search roommates..." />
                        <CommandList>
                          <CommandEmpty>No results found.</CommandEmpty>
                          <CommandGroup>
                            {roommates.map((roommate) => (
                              <CommandItem
                                key={roommate.email}
                                onSelect={() => {
                                  const newSelection = field.value.includes(roommate.email)
                                    ? field.value.filter(email => email !== roommate.email)
                                    : [...field.value, roommate.email];
                                  field.onChange(newSelection);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    field.value.includes(roommate.email)
                                      ? "opacity-100"
                                      : "opacity-0"
                                  )}
                                />
                                {roommate.name} ({roommate.email.split('@')[0]})
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormDescription>These roommates will be in the daily rotation.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="assignment_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assignment Method</FormLabel>
                  <FormControl>
                    <Tabs
                      value={field.value}
                      onValueChange={(value) => {
                        field.onChange(value as 'daily_rotation' | 'weekly_rotation');
                      }}
                      className="w-full"
                    >
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="daily_rotation">Daily Rotation</TabsTrigger>
                        <TabsTrigger value="weekly_rotation">Weekly Rotation</TabsTrigger>
                      </TabsList>
                      <TabsContent value="daily_rotation" className="pt-4">
                        <FormField
                          control={form.control}
                          name="start_date"
                          render={({ field }) => (
                            <FormItem className="flex flex-col">
                              <FormLabel>Rotation Start Date</FormLabel>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <FormControl>
                                    <Button
                                      variant={"outline"}
                                      className={cn(
                                        "w-full pl-3 text-left font-normal",
                                        !field.value && "text-muted-foreground"
                                      )}
                                    >
                                      {field.value ? (
                                        format(field.value, "PPP")
                                      ) : (
                                        <span>Pick a date</span>
                                      )}
                                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                  </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                  <Calendar
                                    mode="single"
                                    selected={field.value}
                                    onSelect={field.onChange}
                                    disabled={(date) => date < new Date(new Date().setDate(new Date().getDate() - 1))}
                                    initialFocus
                                  />
                                </PopoverContent>
                              </Popover>
                              <FormDescription>The first day of the automated daily rotation.</FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </TabsContent>
                      <TabsContent value="weekly_rotation" className="pt-4">
                        <WeeklyDayAssigner roommates={roommates} />
                      </TabsContent>
                    </Tabs>
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="reminder_time"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reminder Time</FormLabel>
                  <FormControl>
                    <Input type="time" {...field} className="w-full md:w-1/3" />
                  </FormControl>
                  <FormDescription>The time of day a reminder will be sent to the assigned person.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isAdding}>{isAdding ? "Adding..." : "Add Chore"}</Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
