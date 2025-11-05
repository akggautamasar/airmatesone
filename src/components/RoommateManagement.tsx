import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Users, IndianRupee, Phone, Trash2, Mail, Crown, AlertTriangle } from "lucide-react";
import { useRoommates } from "@/hooks/useRoommates";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";
import { RoommateForm } from "./RoommateForm";

export const RoommateManagement = () => {
  const { roommates, loading, addRoommate, deleteRoommate, deleteAllMyRoommates, sendEmailRequest } = useRoommates();
  const { profile } = useProfile();
  const { user } = useAuth();
  const [isAdding, setIsAdding] = useState(false);

  const handleAddRoommate = async (roommateData: {
    name: string;
    email: string;
    upi_id: string;
    phone?: string;
  }) => {
    setIsAdding(true);
    try {
      await addRoommate(roommateData.email, roommateData);
    } finally {
      setIsAdding(false);
    }
  };

  const handleUPIPayment = (upiId: string, amount: number) => {
    const paymentUrl = `https://quantxpay.vercel.app/${upiId}/${Math.abs(amount)}`;
    window.open(paymentUrl, '_blank');
  };

  // Filter out the current user from the fetched roommates list
  const filteredRoommates = roommates.filter(
    (roommate) => roommate.email !== (user?.email || '')
  );

  // Create a combined list that includes the current user as the first entry
  const allMembers = [
    // Current user as the owner
    {
      id: 'current-user',
      name: profile?.name || user?.email?.split('@')[0] || 'You',
      upi_id: profile?.upi_id || 'Not set',
      email: user?.email || '',
      phone: profile?.mobile_number || '',
      balance: 0,
      isCurrentUser: true,
      user_id: user?.id || ''
    },
    // Other roommates (filtered)
    ...filteredRoommates.map(r => ({ ...r, isCurrentUser: false }))
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Add Roommate Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
            <span className="flex items-center space-x-2 text-lg sm:text-xl">
              <Users className="h-4 w-4 sm:h-5 sm:w-5" />
              <span>Add New Roommate</span>
            </span>
            <RoommateForm onAdd={handleAddRoommate} isAdding={isAdding} />
          </CardTitle>
          <CardDescription className="text-sm">
            Add roommates to your group by filling in their details. If they're already registered, we'll sync their profile information.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Roommates List */}  
      <Card>  
        <CardHeader>  
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-3 sm:space-y-0">  
            <CardTitle className="flex items-center space-x-2 text-lg sm:text-xl">  
              <Users className="h-4 w-4 sm:h-5 sm:w-5" />  
              <span>Group Members ({allMembers.length})</span>  
            </CardTitle>  
            {/* Only show "Remove All" if there are roommates added by the current user */}  
            {roommates.filter(r => r.user_id === user?.id).length > 0 && (  
               <AlertDialog>  
                <AlertDialogTrigger asChild>  
                  <Button variant="destructive" size="sm" className="w-full sm:w-auto text-xs sm:text-sm">  
                    <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />  
                    Remove All My Roommates  
                  </Button>  
                </AlertDialogTrigger>  
                <AlertDialogContent>  
                  <AlertDialogHeader>  
                    <AlertDialogTitle className="flex items-center">  
                      <AlertTriangle className="h-5 w-5 mr-2 text-red-500" />  
                      Confirm Removal  
                    </AlertDialogTitle>  
                    <AlertDialogDescription>  
                      Are you sure you want to remove all roommates you've added? This action will remove them from your list and cannot be undone.  
                    </AlertDialogDescription>  
                  </AlertDialogHeader>  
                  <AlertDialogFooter>  
                    <AlertDialogCancel>Cancel</AlertDialogCancel>  
                    <AlertDialogAction  
                      onClick={deleteAllMyRoommates}  
                      className="bg-red-600 hover:bg-red-700"  
                    >  
                      Yes, Remove All  
                    </AlertDialogAction>  
                  </AlertDialogFooter>  
                </AlertDialogContent>  
              </AlertDialog>  
            )}  
          </div>  
          <CardDescription className="text-sm">  
            Manage your roommate group and settle expenses. Roommates you add are specific to your list.  
          </CardDescription>  
        </CardHeader>  
        <CardContent className="space-y-3 sm:space-y-4">  
          {allMembers.length === 1 ? (  
            <div className="text-center py-8 text-muted-foreground">  
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />  
              <p>No roommates added yet</p>  
              <p className="text-sm">Add your first roommate to get started</p>  
            </div>  
          ) : (  
            allMembers.map((member) => (  
              <div key={member.id} className={`flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 rounded-lg space-y-3 sm:space-y-0 ${member.isCurrentUser ? 'bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200' : 'bg-muted/50'}`}>  
                <div className="flex items-center space-x-3 sm:space-x-4">  
                  <div className={`rounded-full p-2 sm:p-3 flex-shrink-0 ${member.isCurrentUser ? 'bg-gradient-to-r from-blue-600 to-green-600' : 'bg-gradient-to-r from-blue-600 to-green-600'}`}>  
                    {member.isCurrentUser ? (  
                      <Crown className="h-4 w-4 sm:h-5 sm:w-5 text-white" />  
                    ) : (  
                      <Users className="h-4 w-4 sm:h-5 sm:w-5 text-white" />  
                    )}  
                  </div>  
                  <div className="min-w-0 flex-1">  
                    <div className="flex items-center space-x-2">  
                      <h3 className="font-semibold text-sm sm:text-base truncate">{member.name}</h3>  
                      {member.isCurrentUser && (  
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full flex-shrink-0">You</span>  
                      )}  
                    </div>  
                    <div className="flex items-center space-x-2 text-xs sm:text-sm text-muted-foreground">  
                      <IndianRupee className="h-3 w-3 flex-shrink-0" />  
                      <span className="truncate">{member.upi_id}</span>  
                    </div>  
                    <div className="flex items-center space-x-2 text-xs sm:text-sm text-muted-foreground">  
                      <Mail className="h-3 w-3 flex-shrink-0" />  
                      <span className="truncate">{member.email}</span>  
                    </div>  
                    {member.phone && (  
                      <div className="flex items-center space-x-2 text-xs sm:text-sm text-muted-foreground">  
                        <Phone className="h-3 w-3 flex-shrink-0" />  
                        <span>{member.phone}</span>  
                      </div>  
                    )}  
                  </div>  
                </div>  
                  
                <div className="flex items-center justify-between sm:justify-end space-x-3 sm:ml-4">  
                  <div className="text-left sm:text-right">  
                    <p className={`font-semibold text-sm sm:text-base ${member.balance < 0 ? 'text-orange-600' : member.balance > 0 ? 'text-green-600' : 'text-muted-foreground'}`}>  
                      {member.balance === 0 ? '₹0' : (member.balance < 0 ? '-' : '+') + '₹' + Math.abs(member.balance)}  
                    </p>  
                    <p className="text-xs text-muted-foreground">  
                      {member.balance < 0 ? 'owes you' : member.balance > 0 ? 'you owe' : 'settled'}  
                    </p>  
                  </div>  
                    
                  <div className="flex space-x-2">  
                    {!member.isCurrentUser && member.balance !== 0 && (  
                      <>  
                        <Button  
                          size="sm"  
                          onClick={() => handleUPIPayment(member.upi_id, member.balance)}  
                          className="bg-primary hover:bg-primary/90 text-xs sm:text-sm"  
                        >  
                          Pay  
                        </Button>  
                        {member.balance < 0 && (  
                          <Button  
                            size="sm"  
                            variant="outline"  
                            onClick={() => sendEmailRequest(member)}  
                            className="text-xs sm:text-sm"  
                          >  
                            Request  
                          </Button>  
                        )}  
                      </>  
                    )}  
                      
                    {/* Only allow deleting roommates that were added by the current user */}  
                    {!member.isCurrentUser && member.user_id === user?.id && (  
                      <AlertDialog>  
                        <AlertDialogTrigger asChild>  
                          <Button variant="outline" size="sm" className="h-8 w-8 sm:h-9 sm:w-9 p-0">  
                            <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />  
                          </Button>  
                        </AlertDialogTrigger>  
                        <AlertDialogContent>  
                          <AlertDialogHeader>  
                            <AlertDialogTitle>Remove Roommate</AlertDialogTitle>  
                            <AlertDialogDescription>  
                              Are you sure you want to remove {member.name} from your group? This action cannot be undone.  
                            </AlertDialogDescription>  
                          </AlertDialogHeader>  
                          <AlertDialogFooter>  
                            <AlertDialogCancel>Cancel</AlertDialogCancel>  
                            <AlertDialogAction onClick={() => deleteRoommate(member.id)}>  
                              Remove  
                            </AlertDialogAction>  
                          </AlertDialogFooter>  
                        </AlertDialogContent>  
                      </AlertDialog>  
                    )}  
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
