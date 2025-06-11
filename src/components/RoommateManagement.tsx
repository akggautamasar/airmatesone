
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Users, Plus, IndianRupee, Phone, Trash2, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Roommate {
  id: number;
  name: string;
  upiId: string;
  email: string;
  phone?: string;
  balance: number;
}

export const RoommateManagement = () => {
  const [roommates, setRoommates] = useState<Roommate[]>([
    { id: 1, name: "Rahul", upiId: "rahul@paytm", email: "rahul@example.com", phone: "+91 98765 43210", balance: -150 },
    { id: 2, name: "Priya", upiId: "priya@phonepe", email: "priya@example.com", phone: "+91 87654 32109", balance: 200 },
    { id: 3, name: "Arjun", upiId: "arjun@gpay", email: "arjun@example.com", phone: "+91 76543 21098", balance: -100 },
    { id: 4, name: "Sneha", upiId: "sneha@paytm", email: "sneha@example.com", phone: "+91 65432 10987", balance: 50 },
  ]);

  const [newRoommate, setNewRoommate] = useState({
    name: '',
    upiId: '',
    email: '',
    phone: ''
  });

  const { toast } = useToast();

  const addRoommate = () => {
    if (!newRoommate.name || !newRoommate.upiId || !newRoommate.email) {
      toast({
        title: "Missing Information",
        description: "Name, UPI ID, and Email are required.",
        variant: "destructive",
      });
      return;
    }

    const newId = Math.max(...roommates.map(r => r.id)) + 1;
    setRoommates([...roommates, {
      id: newId,
      ...newRoommate,
      balance: 0
    }]);

    setNewRoommate({ name: '', upiId: '', email: '', phone: '' });
    
    toast({
      title: "Roommate Added!",
      description: `${newRoommate.name} has been added to your group.`,
    });
  };

  const deleteRoommate = (roommateId: number) => {
    const roommate = roommates.find(r => r.id === roommateId);
    setRoommates(roommates.filter(r => r.id !== roommateId));
    
    toast({
      title: "Roommate Removed",
      description: `${roommate?.name} has been removed from your group.`,
    });
  };

  const handleUPIPayment = (upiId: string, amount: number) => {
    const paymentUrl = `https://quantxpay.vercel.app/${upiId}/${Math.abs(amount)}`;
    window.open(paymentUrl, '_blank');
  };

  const sendEmailRequest = async (roommate: Roommate) => {
    const emailData = {
      to: roommate.email,
      subject: "Payment Request from Airmates",
      message: `Hi ${roommate.name},\n\nYou have a pending payment request on Airmates.\n\nAmount: ₹${Math.abs(roommate.balance)}\n\nPlease settle this amount at your earliest convenience.\n\nBest regards,\nAirmates Team`
    };

    try {
      const response = await fetch('https://quantxsms.vercel.app/api/send-single', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(emailData)
      });

      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Request Sent!",
          description: `Payment request email sent to ${roommate.name}`,
        });
      } else {
        toast({
          title: "Failed to Send Request",
          description: "Could not send email. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Network Error",
        description: "Could not send email. Please check your connection.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Add Roommate */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Plus className="h-5 w-5" />
            <span>Add New Roommate</span>
          </CardTitle>
          <CardDescription>
            Add a roommate to your expense sharing group
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="Enter name"
                value={newRoommate.name}
                onChange={(e) => setNewRoommate({...newRoommate, name: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="upiId">UPI ID</Label>
              <Input
                id="upiId"
                placeholder="name@paytm"
                value={newRoommate.upiId}
                onChange={(e) => setNewRoommate({...newRoommate, upiId: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="email@example.com"
                value={newRoommate.email}
                onChange={(e) => setNewRoommate({...newRoommate, email: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone (Optional)</Label>
              <Input
                id="phone"
                placeholder="+91 xxxxx xxxxx"
                value={newRoommate.phone}
                onChange={(e) => setNewRoommate({...newRoommate, phone: e.target.value})}
              />
            </div>
          </div>
          <Button 
            onClick={addRoommate}
            className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Roommate
          </Button>
        </CardContent>
      </Card>

      {/* Roommates List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Your Roommates ({roommates.length})</span>
          </CardTitle>
          <CardDescription>
            Manage your roommate group and settle expenses
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {roommates.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No roommates added yet</p>
              <p className="text-sm">Add your first roommate to get started</p>
            </div>
          ) : (
            roommates.map((roommate) => (
              <div key={roommate.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="bg-gradient-to-r from-blue-600 to-green-600 rounded-full p-3">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{roommate.name}</h3>
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <IndianRupee className="h-3 w-3" />
                      <span>{roommate.upiId}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <Mail className="h-3 w-3" />
                      <span>{roommate.email}</span>
                    </div>
                    {roommate.phone && (
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        <span>{roommate.phone}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <p className={`font-semibold ${roommate.balance < 0 ? 'text-orange-600' : 'text-green-600'}`}>
                      {roommate.balance < 0 ? '-' : '+'}₹{Math.abs(roommate.balance)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {roommate.balance < 0 ? 'owes you' : 'you owe'}
                    </p>
                  </div>
                  
                  <div className="flex space-x-2">
                    {roommate.balance !== 0 && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleUPIPayment(roommate.upiId, roommate.balance)}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          Pay
                        </Button>
                        {roommate.balance < 0 && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => sendEmailRequest(roommate)}
                          >
                            Request
                          </Button>
                        )}
                      </>
                    )}
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remove Roommate</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to remove {roommate.name} from your group? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteRoommate(roommate.id)}>
                            Remove
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
};
