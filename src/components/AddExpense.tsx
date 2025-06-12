
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

interface Expense {
  id: number;
  description: string;
  amount: number;
  paidBy: string;
  date: string;
  category: string;
}

interface AddExpenseProps {
  open: boolean;
  onClose: () => void;
  onAddExpense: (expense: Omit<Expense, 'id'>) => void;
  roommates: string[];
}

export const AddExpense = ({ open, onClose, onAddExpense, roommates }: AddExpenseProps) => {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [paidBy, setPaidBy] = useState('');
  const [selectedRoommates, setSelectedRoommates] = useState<string[]>([]);
  const { toast } = useToast();
  const { roommates: roommatesList } = useRoommates();
  const { profile } = useProfile();
  const { user } = useAuth();

  const categories = ['Groceries', 'Utilities', 'Rent', 'Internet', 'Cleaning', 'Food', 'Other'];

  // Create a list of all possible people who can be involved in expenses
  const allPeople = [
    profile?.name || user?.email?.split('@')[0] || 'You',
    ...roommatesList.map(r => r.name)
  ];

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

    if (selectedRoommates.length === 0) {
      toast({
        title: "No Roommates Selected",
        description: "Please select at least one roommate to share this expense with.",
        variant: "destructive",
      });
      return;
    }

    const amountNum = parseFloat(amount);
    const totalPeople = selectedRoommates.length + 1; // +1 for the person who paid
    const splitAmount = amountNum / totalPeople;

    const newExpense = {
      description,
      amount: amountNum,
      paidBy,
      date: new Date().toLocaleDateString(),
      category
    };

    onAddExpense(newExpense);

    toast({
      title: "Expense Added!",
      description: `₹${amountNum} split among ${totalPeople} people (₹${splitAmount.toFixed(2)} each)`,
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
                {allPeople.map((person) => (
                  <SelectItem key={person} value={person}>
                    {person}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label>Split with (select roommates):</Label>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {allPeople.map((person) => (
                <div key={person} className="flex items-center space-x-2">
                  <Checkbox
                    id={person}
                    checked={selectedRoommates.includes(person)}
                    onCheckedChange={() => handleRoommateToggle(person)}
                  />
                  <Label htmlFor={person} className="text-sm">
                    {person}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {amount && selectedRoommates.length > 0 && (
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Split Details:</strong> ₹{amount} ÷ {selectedRoommates.length + 1} people = ₹{(parseFloat(amount) / (selectedRoommates.length + 1)).toFixed(2)} per person
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Sharing with: {selectedRoommates.join(', ')}
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
