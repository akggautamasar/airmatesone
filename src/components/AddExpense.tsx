import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useRoommates } from "@/hooks/useRoommates";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";

interface AddExpenseProps {
  open: boolean;
  onClose: () => void;
  onAddExpense: (newExpenseData: { description: string; amount: number; paidBy: string; date: string; category: string; sharers: string[] }) => void;
}

export const AddExpense = ({ open, onClose, onAddExpense }: AddExpenseProps) => {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [paidBy, setPaidBy] = useState('');
  const [selectedRoommates, setSelectedRoommates] = useState<string[]>([]);
  const { toast } = useToast();
  const { roommates: roommatesListFromHook } = useRoommates();
  const { profile } = useProfile();
  const { user } = useAuth();

  const categories = ['Groceries', 'Utilities', 'Rent', 'Internet', 'Cleaning', 'Food', 'Other'];

  // Determine the current user's display name
  const currentUserDisplayName = profile?.name || user?.email?.split('@')[0] || 'You';

  // Filter the roommates list to exclude the current user, then get their names
  const otherRoommateNames = roommatesListFromHook
    .filter(r => r.email !== user?.email && r.name !== currentUserDisplayName) // Ensure current user is not duplicated if profile name matches a roommate name
    .map(r => r.name);

  // Combine the current user with other roommates to get a unique list of all people involved
  const uniqueAllPeopleForSelection = Array.from(new Set([currentUserDisplayName, ...otherRoommateNames]));

  const handleRoommateToggle = (roommateName: string) => {
    setSelectedRoommates(prev => 
      prev.includes(roommateName) 
        ? prev.filter(name => name !== roommateName)
        : [...prev, roommateName]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!description || !amount || !category || !paidBy) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    if (!uniqueAllPeopleForSelection.includes(paidBy)) {
        toast({
            title: "Invalid Payer",
            description: "The selected payer is not valid.",
            variant: "destructive",
        });
        return;
    }
    
    // Sharers are the unique set of the payer and those selected to split with.
    const sharersSet = new Set<string>();
    if (paidBy) { // Ensure paidBy is defined before adding
        sharersSet.add(paidBy);
    }
    selectedRoommates.forEach(name => sharersSet.add(name));
    const sharersArray = Array.from(sharersSet);

    if (sharersArray.length === 0) {
       toast({
         title: "No One to Share With",
         description: "Please select at least one person to share this expense with (this can include the payer if they are also sharing the cost).",
         variant: "destructive",
       });
       return;
    }

    const amountNum = parseFloat(amount);
    const totalPeople = sharersArray.length;
    
    if (totalPeople === 0) { // Should not happen if validation above is correct
        toast({ title: "Error", description: "Cannot split among zero people.", variant: "destructive" });
        return;
    }
    
    const splitAmount = amountNum / totalPeople;

    const newExpenseData = {
      description,
      amount: amountNum,
      paidBy,
      date: new Date().toLocaleDateString(), // Kept as is, Index.tsx handles conversion to ISOString
      category,
      sharers: sharersArray // Add the sharers array here
    };

    onAddExpense(newExpenseData);

    toast({
      title: "Expense Added!",
      description: `₹${amountNum.toFixed(2)} split among ${totalPeople} people (₹${splitAmount.toFixed(2)} each). Shared with: ${sharersArray.join(', ')}.`,
    });

    // Reset form and close dialog
    setDescription('');
    setAmount('');
    setCategory('');
    setPaidBy('');
    setSelectedRoommates([]);
    onClose();
  };

  const handleCancel = () => {
    // Reset form when canceling
    setDescription('');
    setAmount('');
    setCategory('');
    setPaidBy('');
    setSelectedRoommates([]);
    onClose();
  };

  const currentSharersSet = new Set<string>();
  if (paidBy) {
    currentSharersSet.add(paidBy);
  }
  selectedRoommates.forEach(name => currentSharersSet.add(name));
  const currentSharersArray = Array.from(currentSharersSet);
  const currentTotalPeople = currentSharersArray.length;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Expense</DialogTitle>
          <DialogDescription>
            Add a shared expense and select who to split it with.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              placeholder="e.g., Groceries, Electricity bill"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount (₹)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select onValueChange={setCategory} value={category} required>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="paidBy">Paid By</Label>
            <Select onValueChange={setPaidBy} value={paidBy} required>
              <SelectTrigger>
                <SelectValue placeholder="Who paid for this?" />
              </SelectTrigger>
              <SelectContent>
                {uniqueAllPeopleForSelection.map((person) => (
                  <SelectItem key={person} value={person}>
                    {person}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label>Split with (select all who share the cost):</Label>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {uniqueAllPeopleForSelection.map((person) => (
                <div key={person} className="flex items-center space-x-2">
                  <Checkbox
                    id={`split-${person}`}
                    checked={selectedRoommates.includes(person)}
                    onCheckedChange={() => handleRoommateToggle(person)}
                  />
                  <Label htmlFor={`split-${person}`} className="text-sm font-normal">
                    {person} {person === paidBy ? <span className="text-xs text-muted-foreground">(Payer is included by default)</span> : ""}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {amount && (parseFloat(amount) > 0) && currentTotalPeople > 0 && (
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Split Details:</strong> ₹{parseFloat(amount).toFixed(2)} ÷ {currentTotalPeople} people = ₹{(parseFloat(amount) / currentTotalPeople).toFixed(2)} per person
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Sharing with: {currentSharersArray.join(', ')}
              </p>
            </div>
          )}
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button 
              type="submit"
              className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
            >
              Add Expense
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
