
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEventTypes, EventType } from '@/hooks/useEventTypes';
import { useAuth } from '@/hooks/useAuth.tsx';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Pencil, Trash2 } from 'lucide-react';
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
} from "@/components/ui/alert-dialog"

interface EventTypeManagerProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
}

const eventTypeSchema = z.object({
    name: z.string().min(1, 'Type name is required'),
});

type EventTypeFormValues = z.infer<typeof eventTypeSchema>;

export const EventTypeManager: React.FC<EventTypeManagerProps> = ({ isOpen, onOpenChange }) => {
    const { user } = useAuth();
    const { eventTypes, addEventType, updateEventType, deleteEventType, isLoading } = useEventTypes();
    const [eventTypeToEdit, setEventTypeToEdit] = useState<EventType | null>(null);

    const form = useForm<EventTypeFormValues>({
        resolver: zodResolver(eventTypeSchema),
    });

    React.useEffect(() => {
        if (eventTypeToEdit) {
            form.setValue('name', eventTypeToEdit.name);
        } else {
            form.reset({ name: '' });
        }
    }, [eventTypeToEdit, form]);

    const onSubmit = async (values: EventTypeFormValues) => {
        if (!user) return;

        try {
            if (eventTypeToEdit) {
                await updateEventType({ id: eventTypeToEdit.id, name: values.name });
                toast.success('Event type updated.');
            } else {
                await addEventType({ name: values.name, created_by: user.id });
                toast.success('Event type added.');
            }
            setEventTypeToEdit(null);
            form.reset({ name: '' });
        } catch (error: any) {
            toast.error(error.message || 'Failed to save event type.');
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await deleteEventType(id);
            toast.success('Event type deleted.');
        } catch (error: any) {
            toast.error(error.message || 'Failed to delete event type.');
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Manage Event Types</DialogTitle>
                    <DialogDescription>Add, edit, or delete your custom event types.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="flex items-end gap-2">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem className="flex-grow">
                                        <FormLabel className="sr-only">Type Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g., Team Outing" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button type="submit">{eventTypeToEdit ? 'Update' : 'Add'}</Button>
                            {eventTypeToEdit && (
                                <Button type="button" variant="ghost" onClick={() => setEventTypeToEdit(null)}>Cancel</Button>
                            )}
                        </form>
                    </Form>

                    <div className="space-y-2 max-h-60 overflow-y-auto p-1">
                        <h3 className="text-sm font-medium text-muted-foreground">Your Event Types</h3>
                        {isLoading && <p className="text-sm text-muted-foreground">Loading...</p>}
                        {eventTypes.filter(et => !et.is_default).map(eventType => (
                            <div key={eventType.id} className="flex items-center justify-between p-2 rounded-md hover:bg-accent">
                                <span>{eventType.name}</span>
                                <div className="flex items-center">
                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEventTypeToEdit(eventType)}>
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    This action cannot be undone. This will permanently delete the event type.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleDelete(eventType.id)}>Delete</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                            </div>
                        ))}
                         <h3 className="text-sm font-medium text-muted-foreground mt-4">Default Event Types</h3>
                         {eventTypes.filter(et => et.is_default).map(eventType => (
                            <div key={eventType.id} className="flex items-center justify-between p-2 rounded-md">
                                <span>{eventType.name}</span>
                            </div>
                        ))}
                    </div>
                </div>
                 <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
