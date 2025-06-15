import React, { useState } from 'react';
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

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters long."),
  description: z.string().optional(),
  start_date: z.date({
    required_error: "A start date is required.",
  }),
  participants: z.array(z.string()).min(1, "You must select at least one roommate."),
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
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user) return;

    try {
      await addChore({
        name: values.name,
        description: values.description,
        participants: values.participants,
        created_by: user.id,
        start_date: format(values.start_date, "yyyy-MM-dd"),
        frequency: 'daily',
      });
      toast({ title: "Success!", description: "New daily rotating chore has been added." });
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
            <div className="grid md:grid-cols-2 gap-6">
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
                          disabled={(date) => date < new Date(new Date().setDate(new Date().getDate() -1))}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
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
            </div>
            <Button type="submit" disabled={isAdding}>{isAdding ? "Adding..." : "Add Chore"}</Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
