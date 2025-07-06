
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { X, Plus, ArrowUp, ArrowDown } from 'lucide-react';
import { useRoommates } from '@/hooks/useRoommates';

interface ChoreRotationFormProps {
  participants: string[];
  onOrderChange: (newOrder: string[]) => void;
  disabled?: boolean;
}

export const ChoreRotationForm: React.FC<ChoreRotationFormProps> = ({ 
  participants, 
  onOrderChange, 
  disabled = false 
}) => {
  const { roommates } = useRoommates();
  const [availableEmails, setAvailableEmails] = useState<string[]>([]);
  const [newEmail, setNewEmail] = useState('');

  // Get all available emails (roommates + current user email if available)
  React.useEffect(() => {
    const allEmails = roommates.map(r => r.email);
    setAvailableEmails(allEmails);
  }, [roommates]);

  const moveUp = (index: number) => {
    if (index === 0) return;
    const newOrder = [...participants];
    [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
    onOrderChange(newOrder);
  };

  const moveDown = (index: number) => {
    if (index === participants.length - 1) return;
    const newOrder = [...participants];
    [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    onOrderChange(newOrder);
  };

  const removeParticipant = (index: number) => {
    const newOrder = participants.filter((_, i) => i !== index);
    onOrderChange(newOrder);
  };

  const addParticipant = () => {
    if (newEmail && !participants.includes(newEmail)) {
      onOrderChange([...participants, newEmail]);
      setNewEmail('');
    }
  };

  const getDisplayName = (email: string) => {
    return email.split('@')[0];
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Chore Rotation Order</CardTitle>
        <CardDescription>
          Set the order in which roommates will rotate for this chore. Day 1 will be the first person, Day 2 the second, and so on.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Rotation Order */}
        <div className="space-y-2">
          <Label>Rotation Order</Label>
          {participants.length === 0 ? (
            <p className="text-sm text-muted-foreground">No participants added yet</p>
          ) : (
            <div className="space-y-2">
              {participants.map((email, index) => (
                <div key={email} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">Day {((index) % participants.length) + 1}</Badge>
                    <span className="font-medium">{getDisplayName(email)}</span>
                    <span className="text-sm text-muted-foreground">({email})</span>
                  </div>
                  {!disabled && (
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => moveUp(index)}
                        disabled={index === 0}
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => moveDown(index)}
                        disabled={index === participants.length - 1}
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeParticipant(index)}
                        className="text-red-500 hover:text-red-600"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add New Participant */}
        {!disabled && (
          <div className="space-y-2">
            <Label>Add Participant</Label>
            <div className="flex gap-2">
              <div className="flex-1">
                <select
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="">Select roommate...</option>
                  {availableEmails
                    .filter(email => !participants.includes(email))
                    .map(email => (
                      <option key={email} value={email}>
                        {getDisplayName(email)} ({email})
                      </option>
                    ))}
                </select>
              </div>
              <Button onClick={addParticipant} disabled={!newEmail}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Rotation Preview */}
        {participants.length > 0 && (
          <div className="p-3 bg-muted rounded-lg">
            <Label className="text-sm font-medium">Rotation Preview (Next 7 Days)</Label>
            <div className="mt-2 grid grid-cols-7 gap-2 text-sm">
              {Array.from({ length: 7 }, (_, i) => {
                const participantIndex = i % participants.length;
                const participant = participants[participantIndex];
                return (
                  <div key={i} className="text-center">
                    <div className="font-medium">Day {i + 1}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {getDisplayName(participant)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
