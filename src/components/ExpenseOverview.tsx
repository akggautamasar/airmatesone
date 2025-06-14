import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Calendar, Users, Trash2, IndianRupee, CreditCard, BadgeCheck } from "lucide-react";
import { useExpenses } from "@/hooks/useExpenses";
import { useRoommates } from "@/hooks/useRoommates";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { Settlement as DetailedSettlement } from "@/components/SettlementHistory";
import { useToast } from "@/components/ui/use-toast";

interface Expense {
  id: string;
  description: string;
  amount: number;
  paidBy: string;
  date: string; 
  category: string;
  sharers?: string[] | null;
}

interface ExpenseOverviewProps {
  expenses: Expense[];
  onExpenseUpdate: () => void;
  settlements: DetailedSettlement[]; 
  onAddSettlementPair: (
    currentUserInvolves: { name: string; email: string; upi_id: string; type: 'owes' | 'owed' },
    otherPartyInvolves: { name: string; email: string; upi_id: string; type: 'owes' | 'owed' },
    amount: number
  ) => Promise<DetailedSettlement | null>;
  currentUserId: string | undefined;
  onUpdateStatus: (transactionGroupId: string, status: string) => Promise<void>;
}

export const ExpenseOverview = ({ 
  expenses: propsExpenses, 
  onExpenseUpdate, 
  settlements, 
  onAddSettlementPair, 
  currentUserId,
  onUpdateStatus 
}: ExpenseOverviewProps) => {
  const { deleteExpense } = useExpenses();
  const { roommates } = useRoommates();
  const { user } = useAuth();
  const { profile } = useProfile();
  const { toast } = useToast();

  const currentUserDisplayName = useMemo(() => {
    return profile?.name || user?.email?.split('@')[0] || 'You';
  }, [profile, user]);

  const allParticipantNames = useMemo(() => {
    const names = new Set<string>([currentUserDisplayName]);
    roommates.forEach(r => names.add(r.name));
    propsExpenses.forEach(e => {
        if (e.paidBy !== currentUserDisplayName && !roommates.find(rm => rm.name === e.paidBy)) names.add(e.paidBy);
    });
    propsExpenses.forEach(e => e.sharers?.forEach(s => {
        if (s !== currentUserDisplayName && !roommates.find(rm => rm.name === s)) names.add(s);
    }));
    return Array.from(names);
  }, [currentUserDisplayName, roommates, propsExpenses]);

  const calculations = useMemo(() => {
    const totalExpenses = propsExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    
    const balanceMap = new Map<string, number>();
    allParticipantNames.forEach(name => balanceMap.set(name, 0));

    propsExpenses.forEach(expense => {
      const payerName = expense.paidBy === user?.email?.split('@')[0] || expense.paidBy === profile?.name ? currentUserDisplayName : expense.paidBy;
      balanceMap.set(payerName, (balanceMap.get(payerName) || 0) + expense.amount);
      
      const effectiveSharers = expense.sharers && expense.sharers.length > 0 
        ? expense.sharers.map(s => s === user?.email?.split('@')[0] || s === profile?.name ? currentUserDisplayName : s)
        : allParticipantNames;

      const numSharers = effectiveSharers.length;
      
      if (numSharers > 0) {
        const amountPerSharer = expense.amount / numSharers;
        effectiveSharers.forEach(sharerName => {
          balanceMap.set(sharerName, (balanceMap.get(sharerName) || 0) - amountPerSharer);
        });
      }
    });
    
    settlements.forEach(settlement => {
      if (settlement.status === 'settled') {
        let debtorName: string, creditorName: string;
        const settlementOwnerIsCurrentUser = settlement.user_id === currentUserId;
        
        if (settlementOwnerIsCurrentUser) {
            if (settlement.type === 'owes') { // Current user (debtor) paid settlement.name (creditor)
                debtorName = currentUserDisplayName;
                creditorName = settlement.name;
            } else { // settlement.type === 'owed', settlement.name (debtor) paid current user (creditor)
                debtorName = settlement.name;
                creditorName = currentUserDisplayName;
            }
        } else {
            const ownerProfile = roommates.find(r => r.user_id === settlement.user_id);
            const ownerDisplayName = ownerProfile?.name || `User ${settlement.user_id.substring(0,5)}`;

            if (settlement.type === 'owes') { // Owner (debtor) paid settlement.name (creditor)
                debtorName = ownerDisplayName;
                creditorName = settlement.name; // This name is relative to the owner. If it's current user, it's currentUserDisplayName
                if (creditorName === user?.email || creditorName === profile?.name) creditorName = currentUserDisplayName;

            } else { // settlement.type === 'owed', settlement.name (debtor) paid owner (creditor)
                debtorName = settlement.name; // This name is relative to the owner. If it's current user, it's currentUserDisplayName
                if (debtorName === user?.email || debtorName === profile?.name) debtorName = currentUserDisplayName;
                creditorName = ownerDisplayName;
            }
        }
        
        if (!balanceMap.has(debtorName) && allParticipantNames.includes(debtorName)) balanceMap.set(debtorName, 0);
        if (!balanceMap.has(creditorName) && allParticipantNames.includes(creditorName)) balanceMap.set(creditorName, 0);

        if (balanceMap.has(debtorName)) {
            balanceMap.set(debtorName, (balanceMap.get(debtorName) || 0) + settlement.amount); // Debt reduced for debtor
        }
        if (balanceMap.has(creditorName)) {
            balanceMap.set(creditorName, (balanceMap.get(creditorName) || 0) - settlement.amount); // Amount received by creditor
        }
      }
    });

    const finalBalances: { name: string; balance: number }[] = [];
    balanceMap.forEach((balance, name) => {
      finalBalances.push({ name, balance: parseFloat(balance.toFixed(2)) });
    });

    return {
      totalExpenses,
      finalBalances
    };
  }, [propsExpenses, allParticipantNames, currentUserDisplayName, settlements, roommates, profile, currentUserId, user]);

  const categoryData = useMemo(() => propsExpenses.reduce((acc, expense) => {
    const existing = acc.find(item => item.name === expense.category);
    if (existing) {
      existing.value += expense.amount;
    } else {
      acc.push({ name: expense.category, value: expense.amount });
    }
    return acc;
  }, [] as { name: string; value: number }[]), [propsExpenses]);

  const monthlyData = useMemo(() => propsExpenses.reduce((acc, expense) => {
    const dateObj = new Date(expense.date); 
    const month = !isNaN(dateObj.getTime()) ? dateObj.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : "Invalid Date";

    const existing = acc.find(item => item.month === month);
    if (existing) {
      existing.amount += expense.amount;
    } else {
      acc.push({ month, amount: expense.amount });
    }
    return acc;
  }, [] as { month: string; amount: number }[]), [propsExpenses]);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  const handleDeleteExpense = async (expenseId: string) => {
    try {
      await deleteExpense(expenseId);
      onExpenseUpdate(); 
    } catch (error) {
      console.error('Error deleting expense:', error);
    }
  };
  
  const initiateSettlementProcess = async (
    debtorName: string, 
    creditorName: string, 
    amountToSettle: number,
    settleImmediately: boolean = false
  ) => {
    const absAmount = Math.abs(amountToSettle);
    if (absAmount < 0.01) return;

    const currentUserIsDebtor = debtorName === currentUserDisplayName;
    const currentUserIsCreditor = creditorName === currentUserDisplayName;

    const debtorRoommate = roommates.find(r => r.name === debtorName);
    const creditorRoommate = roommates.find(r => r.name === creditorName);

    const currentUserProfileDetails = {
        name: currentUserDisplayName,
        email: user?.email || '',
        upi_id: profile?.upi_id || ''
    };

    let debtorDetails, creditorDetails;

    if (currentUserIsDebtor) {
        debtorDetails = currentUserProfileDetails;
        creditorDetails = creditorRoommate ? { name: creditorRoommate.name, email: creditorRoommate.email, upi_id: creditorRoommate.upi_id } : { name: creditorName, email: 'unknown', upi_id: ''};
    } else if (currentUserIsCreditor) {
        creditorDetails = currentUserProfileDetails;
        debtorDetails = debtorRoommate ? { name: debtorRoommate.name, email: debtorRoommate.email, upi_id: debtorRoommate.upi_id } : { name: debtorName, email: 'unknown', upi_id: ''};
    } else {
        if (!debtorRoommate || !creditorRoommate) {
            toast({
                title: "Settlement Error",
                description: `Cannot initiate settlement between ${debtorName} and ${creditorName} as one or both are not registered roommates with full details.`,
                variant: "destructive",
            });
            return;
        }
        debtorDetails = { name: debtorRoommate.name, email: debtorRoommate.email, upi_id: debtorRoommate.upi_id };
        creditorDetails = { name: creditorRoommate.name, email: creditorRoommate.email, upi_id: creditorRoommate.upi_id };
    }
    
    let currentUserPerspective, otherPartyPerspective;

    if (currentUserIsDebtor) {
        currentUserPerspective = { ...debtorDetails, type: 'owes' as const };
        otherPartyPerspective = { ...creditorDetails, type: 'owed' as const };
    } else if (currentUserIsCreditor) {
        currentUserPerspective = { ...creditorDetails, type: 'owed' as const };
        otherPartyPerspective = { ...debtorDetails, type: 'owes' as const };
    } else {
        console.warn("Settlement initiation between two other parties not fully supported by this UI path in ExpenseOverview. Ensure onAddSettlementPair can handle this or adjust UI flow.");
        toast({
            title: "Mediation Not Supported",
            description: "Directly settling between two other roommates from this screen is not fully supported yet. Please manage such settlements individually or via Settlement History if applicable.",
            variant: "warning"
         });
        return; 
    }
    
    const createdSettlement = await onAddSettlementPair(currentUserPerspective, otherPartyPerspective, absAmount);
    
    if (createdSettlement && settleImmediately && createdSettlement.transaction_group_id) {
      try {
        await onUpdateStatus(createdSettlement.transaction_group_id, 'settled');
        toast({
          title: "Balance Settled",
          description: `The balance with ${creditorName === currentUserDisplayName ? debtorName : creditorName} has been marked as settled.`,
        });
      } catch (error) {
        console.error("Error directly settling balance:", error);
        toast({
          title: "Settlement Error",
          description: "Could not immediately mark the balance as settled. Please check Settlement History.",
          variant: "destructive",
        });
      }
    } else if (createdSettlement && !settleImmediately) {
        toast({
          title: "Settlement Initiated",
          description: `A settlement process has been initiated with ${creditorName === currentUserDisplayName ? debtorName : creditorName}. Check Settlement History.`,
        });
    }
    onExpenseUpdate(); 
  };

  const handlePayClick = (upiId: string, amount: number) => {
    if (!upiId || amount <= 0) {
      console.error("Invalid UPI ID or amount for payment.");
      toast({ title: "Payment Error", description: "Invalid UPI ID or amount.", variant: "destructive" });
      return;
    }
    const paymentUrl = `https://quantxpay.vercel.app/${upiId}/${amount.toFixed(2)}`;
    window.open(paymentUrl, '_blank', 'noopener,noreferrer');
  };

  if (propsExpenses.length === 0 && settlements.filter(s => s.status !== 'settled').length === 0 && calculations.finalBalances.every(b => Math.abs(b.balance) < 0.01)) {
    return (
      <div className="text-center py-12">
        <IndianRupee className="h-16 w-16 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">All Clear!</h3>
        <p className="text-gray-500">No outstanding expenses or pending settlements. Add a new expense to get started.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <IndianRupee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{calculations.totalExpenses.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {propsExpenses.length} expense{propsExpenses.length !== 1 ? 's' : ''} recorded
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{propsExpenses.length > 0 ? new Date(propsExpenses.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].date).toLocaleDateString() : 'N/A'}</div>
            <p className="text-xs text-muted-foreground">Last expense added</p>
          </CardContent>
        </Card>
      </div>

      {/* Balances Section */}
      <Card>
        <CardHeader>
          <CardTitle>Current Balances</CardTitle>
          <CardDescription>Who owes what, reflecting shared expenses and settled transactions. Manage pending settlements in the 'Settlements' tab.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {calculations.finalBalances.map((person, index) => {
            const isViewingOwnBalance = person.name === currentUserDisplayName;
            const roommateInfo = roommates.find(r => r.name === person.name);

            const activeSettlementWithPerson = settlements.find(s => 
                s.status !== 'settled' &&
                ((s.name === person.name && s.user_id === currentUserId) || 
                 (s.name === currentUserDisplayName && person.name === (roommates.find(r => r.user_id === s.user_id)?.name || s.user_id))) // check against person's name or their original id if not in roommates
            );

            let actionContent = null;
            let additionalInfoBadge = null;

            if (!isViewingOwnBalance) {
                if (person.balance > 0.005) { // Current user owes this person (person.name)
                    const payButton = roommateInfo?.upi_id ? (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handlePayClick(roommateInfo.upi_id, person.balance)}
                          className="border-orange-300 text-orange-600 hover:bg-orange-50 hover:text-orange-700 w-full sm:w-auto"
                        >
                          Pay via UPI
                          <CreditCard className="ml-2 h-3 w-3" />
                        </Button>
                    ) : null;

                    const markAsPaidButton = (
                        <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => initiateSettlementProcess(currentUserDisplayName, person.name, person.balance, true)} 
                            className="border-green-400 text-green-600 hover:bg-green-50 hover:text-green-700 w-full sm:w-auto"
                        >
                            Mark as Paid
                            <BadgeCheck className="ml-2 h-3 w-3" />
                        </Button>
                    );
                    
                    actionContent = (
                        <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 space-y-2 sm:space-y-0 mt-1 w-full sm:w-auto justify-end">
                            {payButton}
                            {markAsPaidButton}
                        </div>
                    );

                    if (activeSettlementWithPerson) {
                        additionalInfoBadge = <Badge variant="outline" className="text-xs mt-1 sm:mt-0 sm:ml-2 self-center sm:self-auto">Note: A settlement is also pending</Badge>;
                    }

                } else if (person.balance < -0.005) { // Current user is owed by this person (person.name)
                    if (!activeSettlementWithPerson) {
                        actionContent = (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => initiateSettlementProcess(person.name, currentUserDisplayName, person.balance, false)} 
                              className="border-blue-300 text-blue-600 hover:bg-blue-50 hover:text-blue-700 w-full sm:w-auto"
                            >
                              Request Payment
                            </Button>
                        );
                    } else {
                        actionContent = <Badge variant="outline" className="text-xs">Settlement in progress</Badge>;
                    }
                }
            }

            return (
              <div key={index} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-lg bg-gray-50 space-y-2 sm:space-y-0">
                <div className="flex items-center space-x-3">
                  <div className={`rounded-full p-2 ${person.balance > 0.005 ? 'bg-green-100' : person.balance < -0.005 ? 'bg-red-100' : 'bg-gray-100'}`}>
                    <Users className={`h-4 w-4 ${person.balance > 0.005 ? 'text-green-600' : person.balance < -0.005 ? 'text-red-600' : 'text-gray-600'}`} />
                  </div>
                  <div>
                    <p className="font-medium">{person.name}{isViewingOwnBalance ? " (You)" : ""}</p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row items-end sm:items-center sm:space-x-2 space-y-2 sm:space-y-0 self-end sm:self-center w-full sm:w-auto justify-end">
                  <Badge variant={person.balance > 0.005 ? "default" : person.balance < -0.005 ? "destructive" : "secondary"} className={`${person.balance > 0.005 ? 'bg-green-500 hover:bg-green-600' : ''} whitespace-nowrap`}>
                    {person.balance === 0 || (person.balance < 0.005 && person.balance > -0.005) ? "Settled Up" : 
                     person.balance > 0 ? `Is Owed ₹${person.balance.toFixed(2)}` : 
                     `Owes ₹${Math.abs(person.balance).toFixed(2)}`}
                  </Badge>
                  {actionContent}
                  {additionalInfoBadge}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Expenses by Category</CardTitle>
            <CardDescription>Breakdown of spending categories</CardDescription>
          </CardHeader>
          <CardContent>
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryData.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Amount']} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No category data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Monthly Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Spending Trend</CardTitle>
            <CardDescription>Track your spending over time</CardDescription>
          </CardHeader>
          <CardContent>
            {monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(value) => `₹${value.toLocaleString('en-IN')}`} />
                  <Tooltip formatter={(value) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Amount']} />
                  <Legend />
                  <Bar dataKey="amount" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No monthly data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Expenses */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Expenses</CardTitle>
          <CardDescription>Your latest spending activity.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {propsExpenses.slice(0, 5).map((expense) => (
              <div key={expense.id} className="flex items-center justify-between p-4 rounded-lg border">
                <div className="flex items-center space-x-4">
                  <div className="rounded-full bg-blue-100 p-2">
                    <IndianRupee className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">{expense.description}</p>
                    <p className="text-sm text-muted-foreground">
                      Paid by {expense.paidBy === user?.email?.split('@')[0] || expense.paidBy === profile?.name ? currentUserDisplayName : expense.paidBy} • {new Date(expense.date).toLocaleDateString()} • {expense.category}
                      {expense.sharers && expense.sharers.length > 0 && expense.sharers.length < allParticipantNames.length ? (
                        <span className="block text-xs">Shared with: {expense.sharers.map(s => s === user?.email?.split('@')[0] || s === profile?.name ? currentUserDisplayName : s).join(', ')}</span>
                      ) : (
                        <span className="block text-xs">Shared with: All</span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="font-semibold">₹{expense.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Expense</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{expense.description}"? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDeleteExpense(expense.id)}>
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
            {propsExpenses.length === 0 && (
                 <div className="text-center py-8 text-muted-foreground">
                    <p>No recent expenses to show.</p>
                </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
