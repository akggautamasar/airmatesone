import React, { useState } from 'react'; import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"; import { Button } from "@/components/ui/button"; import { Input } from "@/components/ui/input"; import { Label } from "@/components/ui/label"; import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger, } from "@/components/ui/alert-dialog"; import { Users, Plus, IndianRupee, Phone, Trash2, Mail, Crown, AlertTriangle, } from "lucide-react"; import { useRoommates } from "@/hooks/useRoommates"; import { useProfile } from "@/hooks/useProfile"; import { useAuth } from "@/hooks/useAuth";

export const RoommateManagement = () => { const { roommates, loading, addRoommate, deleteRoommate, deleteAllMyRoommates, sendEmailRequest } = useRoommates(); const { profile } = useProfile(); const { user } = useAuth(); const [newRoommate, setNewRoommate] = useState({ name: '', upi_id: '', email: '', phone: '' });

const handleAddRoommate = () => { if (!newRoommate.name || !newRoommate.upi_id || !newRoommate.email) return; addRoommate(newRoommate); setNewRoommate({ name: '', upi_id: '', email: '', phone: '' }); };

const handleUPIPayment = (upiId: string, amount: number) => { const paymentUrl = https://quantxpay.vercel.app/${upiId}/${Math.abs(amount)}; window.open(paymentUrl, '_blank'); };

const filteredRoommates = roommates.filter((r) => r.email !== (user?.email || '')); const allMembers = [ { id: 'current-user', name: profile?.name || user?.email?.split('@')[0] || 'You', upi_id: profile?.upi_id || 'Not set', email: user?.email || '', phone: profile?.full_name || '', balance: 0, isCurrentUser: true, user_id: user?.id || '' }, ...filteredRoommates.map(r => ({ ...r, isCurrentUser: false })) ];

if (loading) { return <div className="flex items-center justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>; }

return ( <div className="space-y-6 p-4"> <Card> <CardHeader> <CardTitle className="flex items-center space-x-2"> <Plus className="h-5 w-5" /> <span>Add New Roommate</span> </CardTitle> <CardDescription> Add a roommate to your expense sharing group. They must have an existing account on AirMates. </CardDescription> </CardHeader> <CardContent className="space-y-4"> <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"> {["name", "upi_id", "email", "phone"].map((field, idx) => ( <div className="space-y-2" key={idx}> <Label htmlFor={field}>{field === 'upi_id' ? 'UPI ID' : field.charAt(0).toUpperCase() + field.slice(1)}</Label> <Input id={field} placeholder={field === 'upi_id' ? 'name@paytm' : Enter ${field}} value={newRoommate[field]} onChange={(e) => setNewRoommate({ ...newRoommate, [field]: e.target.value })} type={field === 'email' ? 'email' : 'text'} /> </div> ))} </div> <Button onClick={handleAddRoommate} className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"> <Plus className="h-4 w-4 mr-2" /> Add Roommate </Button> </CardContent> </Card>

<Card>
    <CardHeader>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <CardTitle className="flex items-center space-x-2">
          <Users className="h-5 w-5" />
          <span>Group Members ({allMembers.length})</span>
        </CardTitle>
        {roommates.filter(r => r.user_id === user?.id).length > 0 && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash2 className="h-4 w-4 mr-2" /> Remove All My Roommates
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2 text-red-500" /> Confirm Removal
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to remove all roommates you've added? This cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={deleteAllMyRoommates} className="bg-red-600 hover:bg-red-700">
                  Yes, Remove All
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
      <CardDescription>
        Manage your roommate group and settle expenses.
      </CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
      {allMembers.length === 1 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No roommates added yet</p>
          <p className="text-sm">Add your first roommate to get started</p>
        </div>
      ) : (
        allMembers.map((member) => (
          <div key={member.id} className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg ${member.isCurrentUser ? 'bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200' : 'bg-gray-50'}`}>
            <div className="flex items-center space-x-4 min-w-0">
              <div className="rounded-full p-3 bg-gradient-to-r from-blue-600 to-green-600">
                {member.isCurrentUser ? <Crown className="h-5 w-5 text-white" /> : <Users className="h-5 w-5 text-white" />}
              </div>
              <div className="min-w-0 break-words">
                <div className="flex items-center space-x-2">
                  <h3 className="font-semibold truncate">{member.name}</h3>
                  {member.isCurrentUser && (
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">You</span>
                  )}
                </div>
                <div className="text-sm text-muted-foreground flex items-center space-x-2">
                  <IndianRupee className="h-3 w-3" /> <span>{member.upi_id}</span>
                </div>
                <div className="text-sm text-muted-foreground flex items-center space-x-2">
                  <Mail className="h-3 w-3" /> <span>{member.email}</span>
                </div>
                {member.phone && (
                  <div className="text-sm text-muted-foreground flex items-center space-x-2">
                    <Phone className="h-3 w-3" /> <span>{member.phone}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-end gap-2">
              <div className="text-right">
                <p className={`font-semibold ${member.balance < 0 ? 'text-orange-600' : member.balance > 0 ? 'text-green-600' : 'text-gray-600'}`}>
                  {member.balance === 0 ? '₹0' : (member.balance < 0 ? '-' : '+') + '₹' + Math.abs(member.balance)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {member.balance < 0 ? 'owes you' : member.balance > 0 ? 'you owe' : 'settled'}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {!member.isCurrentUser && member.balance !== 0 && (
                  <>
                    <Button size="sm" onClick={() => handleUPIPayment(member.upi_id, member.balance)} className="bg-blue-600 hover:bg-blue-700">Pay</Button>
                    {member.balance < 0 && (
                      <Button size="sm" variant="outline" onClick={() => sendEmailRequest(member)}>Request</Button>
                    )}
                  </>
                )}
                {!member.isCurrentUser && member.user_id === user?.id && (
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
                          Are you sure you want to remove {member.name} from your group? This cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteRoommate(member.id)}>Remove</AlertDialogAction>
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

); };
