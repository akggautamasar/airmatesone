
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, User, Phone, Mail, IndianRupee } from "lucide-react";

interface RoommateFormProps {
  onAdd: (roommate: {
    name: string;
    email: string;
    upi_id: string;
    phone?: string;
  }) => Promise<void>;
  isAdding: boolean;
}

export const RoommateForm = ({ onAdd, isAdding }: RoommateFormProps) => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    upi_id: '',
    phone: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.upi_id.trim()) {
      return;
    }

    try {
      await onAdd({
        name: formData.name.trim(),
        email: formData.email.trim(),
        upi_id: formData.upi_id.trim(),
        phone: formData.phone.trim() || undefined
      });
      setFormData({ name: '', email: '', upi_id: '', phone: '' });
      setOpen(false);
    } catch (error) {
      // Error handling is done in the parent component
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700">
          <Plus className="h-4 w-4 mr-2" />
          Add Roommate
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>Add New Roommate</span>
          </DialogTitle>
          <DialogDescription>
            Enter your roommate's details. We'll try to fetch their profile information if they're already registered.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="flex items-center space-x-2">
              <User className="h-4 w-4" />
              <span>Full Name *</span>
            </Label>
            <Input
              id="name"
              placeholder="Enter full name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center space-x-2">
              <Mail className="h-4 w-4" />
              <span>Email Address *</span>
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter email address"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="upi_id" className="flex items-center space-x-2">
              <IndianRupee className="h-4 w-4" />
              <span>UPI ID *</span>
            </Label>
            <Input
              id="upi_id"
              placeholder="example@paytm or 9876543210@gpay"
              value={formData.upi_id}
              onChange={(e) => setFormData(prev => ({ ...prev, upi_id: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className="flex items-center space-x-2">
              <Phone className="h-4 w-4" />
              <span>Phone Number</span>
            </Label>
            <Input
              id="phone"
              placeholder="Enter phone number (optional)"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={!formData.name.trim() || !formData.email.trim() || !formData.upi_id.trim() || isAdding}
              className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
            >
              {isAdding ? 'Adding...' : 'Add Roommate'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
