
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useChores } from '@/hooks/useChores';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { ChoreRotationForm } from './ChoreRotationForm';
import { WeeklyDayAssigner } from './WeeklyDayAssigner';

interface AddChoreFormProps {
  onChoreAdded: () => void;
}

export const AddChoreForm = ({ onChoreAdded }: AddChoreFormProps) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [assignmentType, setAssignmentType] = useState<'daily_rotation' | 'weekly_rotation'>('daily_rotation');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [participants, setParticipants] = useState<string[]>([]);
  const [weeklySchedule, setWeeklySchedule] = useState<{ [key: string]: string }>({});
  
  const { addChore, isAdding } = useChores();
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({ title: "Error", description: "You must be logged in to create chores", variant: "destructive" });
      return;
    }

    if (!name.trim()) {
      toast({ title: "Error", description: "Please enter a chore name", variant: "destructive" });
      return;
    }

    if (participants.length === 0) {
      toast({ title: "Error", description: "Please add at least one participant", variant: "destructive" });
      return;
    }

    try {
      await addChore({
        name: name.trim(),
        description: description.trim() || null,
        created_by: user.id,
        start_date: startDate,
        participants,
        assignment_type: assignmentType,
        frequency: 'daily',
        weekly_schedule: assignmentType === 'weekly_rotation' ? weeklySchedule : null,
      });

      // Reset form
      setName('');
      setDescription('');
      setParticipants([]);
      setWeeklySchedule({});
      setStartDate(new Date().toISOString().split('T')[0]);
      
      onChoreAdded();
      toast({ title: "Success", description: "Chore created successfully!" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Add New Chore</CardTitle>
          <CardDescription>Create a new chore and assign it to roommates with rotation.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Chore Name *</Label>
              <Input
                id="name"
                type="text"
                placeholder="e.g., Wash dishes, Take out trash"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Additional details about the chore..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="assignment-type">Assignment Type</Label>
              <Select value={assignmentType} onValueChange={(value: 'daily_rotation' | 'weekly_rotation') => setAssignmentType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily_rotation">Daily Rotation</SelectItem>
                  <SelectItem value="weekly_rotation">Weekly Schedule</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {assignmentType === 'daily_rotation' && (
              <div className="space-y-2">
                <Label htmlFor="start-date">Start Date</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
              </div>
            )}

            <Button type="submit" disabled={isAdding} className="w-full">
              {isAdding ? 'Creating...' : 'Create Chore'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {assignmentType === 'daily_rotation' ? (
        <ChoreRotationForm
          participants={participants}
          onOrderChange={setParticipants}
        />
      ) : (
        <WeeklyDayAssigner
          weeklySchedule={weeklySchedule}
          onScheduleChange={setWeeklySchedule}
        />
      )}
    </div>
  );
};
