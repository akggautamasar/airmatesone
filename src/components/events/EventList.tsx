
import React from 'react';
import { Event } from '@/types/events';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { MoreHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format, parseISO } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface EventListProps {
  events: Event[];
  onEdit: (event: Event) => void;
  onDelete: (eventId: string) => void;
}

export const EventList: React.FC<EventListProps> = ({ events, onEdit, onDelete }) => {
  const sortedEvents = [...events].sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime());
    
  if (sortedEvents.length === 0) {
    return <p className="text-center text-muted-foreground mt-8">No events scheduled for this month.</p>;
  }

  return (
    <Card>
        <CardHeader>
            <CardTitle>Events This Month</CardTitle>
        </CardHeader>
        <CardContent>
            <div className="rounded-md border">
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead className="w-[120px]">Date</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead>Added By</TableHead>
                    <TableHead className="text-right w-[80px]">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {sortedEvents.map((event) => (
                    <TableRow key={event.id}>
                        <TableCell>{format(parseISO(event.event_date), 'MMM dd, yyyy')}</TableCell>
                        <TableCell className="font-medium">{event.name}</TableCell>
                        <TableCell><Badge variant="secondary">{event.event_type}</Badge></TableCell>
                        <TableCell className="text-muted-foreground max-w-xs truncate">{event.notes}</TableCell>
                        <TableCell>{event.created_by_profile?.name || 'N/A'}</TableCell>
                        <TableCell className="text-right">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onEdit(event)}>
                                Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onDelete(event.id)} className="text-red-500 focus:text-red-500 focus:bg-red-50">
                                Delete
                            </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        </TableCell>
                    </TableRow>
                    ))}
                </TableBody>
                </Table>
            </div>
        </CardContent>
    </Card>
  );
};
