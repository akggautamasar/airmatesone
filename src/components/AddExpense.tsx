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
  onAddExpense: (newExpenseData: { description: string; amount: number; paidBy: string; date: string; category: string }) => void;
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
    .filter(r => r.email !== user?.email)
    .map(r => r.name);

  // Combine the current user with other roommates to get a unique list of all people involved
  const allPeopleForSelection = [currentUserDisplayName, ...otherRoommateNames];
  // Ensure allPeopleForSelection has unique names, in case profile.name is same as a roommate name but different email
  const uniqueAllPeopleForSelection = Array.from(new Set(allPeopleForSelection));

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

    // Ensure paidBy is one of the people in the unique list
    if (!uniqueAllPeopleForSelection.includes(paidBy)) {
        toast({
            title: "Invalid Payer",
            description: "The selected payer is not valid.",
            variant: "destructive",
        });
        return;
    }
    
    // Ensure selected roommates for splitting are also valid and don't include the payer if payer is self-selected
    // (This check is implicitly handled by how selectedRoommates is populated from the checkbox list which excludes payer logic for now)
    const validSelectedRoommates = selectedRoommates.filter(name => uniqueAllPeopleForSelection.includes(name) && name !== paidBy);
    // If paidBy is one of the selectedRoommates, it implies they are sharing with themselves, which is fine.
    // The `+1` for totalPeople handles the payer.
    // We need to ensure selectedRoommates list doesn't accidentally include the payer if the UI allowed it in a confusing way.
    // Current checkbox list populates from uniqueAllPeopleForSelection. If "Payer" is "A", and "A" is checked in split list, this is fine.

    if (selectedRoommates.length === 0 && !uniqueAllPeopleForSelection.some(p => p === paidBy && uniqueAllPeopleForSelection.length === 1) ) {
      // Special case: if only one person (the payer) and no selected roommates, it's a personal expense.
      // But we expect shared expenses here.
      // If paidBy is the only person in uniqueAllPeopleForSelection, and selectedRoommates is empty, it's okay.
      // otherwise, if more people, at least one must be selected.
      // The current logic is to split with selected roommates + payer.
      // If paidBy is 'You', and selectedRoommates is ['Roommate A'], total is 2.
      // If paidBy is 'You', and selectedRoommates is empty, it's not a shared expense in typical sense.
      // The original check was: selectedRoommates.length === 0. This means no one *else* is selected.
      // If paidBy is 'You', totalPeople becomes 0+1 = 1. This implies a personal expense, or split with only the payer.
      // This should be fine. The toast for "No Roommates Selected" might be too aggressive.
      // Let's re-evaluate: if you pay and select no one, it's your expense.
      // If someone else pays, and you select no one (not even yourself), it's their expense.
      // The current system implies sharing. The toast for "No Roommates Selected" makes sense if the intent is always to share.
      // For now, keep the original logic: if no one is selected to *share* with, it's an issue for a *shared* expense app.
       if (selectedRoommates.length === 0) {
         toast({
           title: "No One to Share With",
           description: "Please select at least one person to share this expense with (this can include the payer if they are also sharing the cost).",
           variant: "destructive",
         });
         return;
       }
    }

    const amountNum = parseFloat(amount);
    // Payer is one person. selectedRoommates are the *others* involved in the split.
    // If payer is 'A', and selected are 'B', 'C'. Total involved = A, B, C (3 people). selectedRoommates.length = 2. totalPeople = 2 + 1 = 3.
    // If payer is 'A', and selected is 'A', 'B', 'C'. Total involved = A, B, C (3 people). selectedRoommates.length = 3. totalPeople = 3 + 1 = 4. This is wrong.
    // selectedRoommates should be those who are sharing the cost *excluding* the payer if the payer is already counted.
    // Or, selectedRoommates includes everyone who shares, *including* the payer if they are also bearing a share.
    
    // Let's clarify `selectedRoommates`: these are the names checked in the "Split with" list.
    // This list *can* include the payer.
    // Example: Payer: A. Split with: A, B. Expense is split between A and B.
    // uniqueSharers should be `new Set([paidBy, ...selectedRoommates])`.
    const sharers = new Set([paidBy, ...selectedRoommates]);
    const totalPeople = sharers.size;

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
      category
    };

    onAddExpense(newExpenseData);

    toast({
      title: "Expense Added!",
      description: `₹${amountNum.toFixed(2)} split among ${totalPeople} people (₹${splitAmount.toFixed(2)} each)`,
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
                    id={`split-${person}`} // Ensure unique ID for checkbox
                    checked={selectedRoommates.includes(person)}
                    onCheckedChange={() => handleRoommateToggle(person)}
                  />
                  <Label htmlFor={`split-${person}`} className="text-sm font-normal"> {/* font-normal to match other labels */}
                    {person} {person === paidBy ? <span className="text-xs text-muted-foreground">(Payer)</span> : ""}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {amount && (parseFloat(amount) > 0) && new Set([paidBy, ...selectedRoommates]).size > 0 && (
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Split Details:</strong> ₹{parseFloat(amount).toFixed(2)} ÷ {new Set([paidBy, ...selectedRoommates]).size} people = ₹{(parseFloat(amount) / (new Set([paidBy, ...selectedRoommates]).size)).toFixed(2)} per person
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Sharing with: {Array.from(new Set([paidBy, ...selectedRoommates])).join(', ')}
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
