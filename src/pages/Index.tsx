import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { NavBar } from "@/components/NavBar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ExpenseOverview } from "@/components/ExpenseOverview";
import { AddExpense } from "@/components/AddExpense";
import { RoommateManagement } from "@/components/RoommateManagement";
import { SettlementHistory } from "@/components/SettlementHistory";
import { Settlement } from "@/types";
import { Profile } from "@/components/Profile";
import { useExpenses } from "@/hooks/useExpenses";
import { useSettlements } from "@/hooks/useSettlements";
import { useRoommates } from "@/hooks/useRoommates";
import { useProfile } from "@/hooks/useProfile";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useExpenseSettlements } from "@/hooks/useExpenseSettlements";
import { getCurrentUserDisplayName } from "@/utils/userDisplay";

const Index = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { expenses, addExpense, deleteExpense, loading: expensesLoading, refetch: refetchExpenses } = useExpenses();
  const { roommates } = useRoommates();
  const { profile } = useProfile();
  const { 
    settlements, 
    loading: settlementsLoading, 
    addSettlementPair, 
    addUniversalSettlementPair,
    updateSettlementStatusByGroupId,
    deleteSettlementGroup,
    refetchSettlements 
  } = useSettlements();
  const { createSettlementsForExpense } = useExpenseSettlements();
  const [showAddExpense, setShowAddExpense] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    console.log('Index page - user:', user?.email, 'authLoading:', authLoading);
    if (!authLoading && !user) {
      console.log('Redirecting to auth page');
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  const overallLoading = authLoading || expensesLoading || settlementsLoading;

  if (overallLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-green-50">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
            Welcome to AirMates
          </h1>
          <p className="text-gray-600 max-w-md">
            Your smart roommate expense manager. Track shared expenses, manage settlements, and keep everyone happy.
          </p>
          <Button asChild className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700">
            <Link to="/auth">Get Started</Link>
          </Button>
        </div>
      </div>
    );
  }

  const currentUserDisplayName = getCurrentUserDisplayName(profile, user);

  const formattedExpenses = expenses.map(expense => ({
    id: expense.id,
    description: expense.description,
    amount: expense.amount,
    paidBy: expense.paid_by,
    date: new Date(expense.date).toISOString(),
    category: expense.category,
    sharers: expense.sharers || []
  }));
  
  const hasActiveExpenses = formattedExpenses.length > 0;

  const handleAddExpenseSubmit = async (expense: any) => {
    try {
      await addExpense({
        description: expense.description,
        amount: expense.amount,
        paid_by: expense.paidBy,
        category: expense.category,
        date: new Date().toISOString(),
        sharers: expense.sharers
      });

      // Refactored settlement creation into custom hook
      await createSettlementsForExpense({
        expense,
        user,
        profile,
        roommates,
        addSettlementPair: addUniversalSettlementPair,
      });

      setShowAddExpense(false);
      handleExpenseUpdate();

      toast({ 
        title: "Expense Added", 
        description: "Expense added and settlements created automatically."
      });
    } catch (error) {
      console.error('Error adding expense:', error);
      toast({ 
        title: "Error", 
        description: "Failed to add expense.", 
        variant: "destructive" 
      });
    }
  };

  const handleExpenseUpdate = () => {
    refetchExpenses();
    refetchSettlements();
  };

  const handleSettlementStatusUpdate = async (
    transaction_group_id: string,
    newStatus: "pending" | "debtor_paid" | "settled"
  ) => {
    await updateSettlementStatusByGroupId(transaction_group_id, newStatus);
    refetchSettlements();
    refetchExpenses();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user.email && user.email.split('@')[0]}!</h1>
          <p className="text-gray-600">Manage your expenses and settlements.</p>
        </div>
        
        <Tabs defaultValue="overview" className="space-y-8">
          <TabsList className="grid w-full grid-cols-3 gap-2 sm:grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="expenses">Add Expense</TabsTrigger>
            <TabsTrigger value="roommates">Roommates</TabsTrigger>
            <TabsTrigger value="settlements">Settlements</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <ExpenseOverview 
              expenses={formattedExpenses}
              onExpenseUpdate={handleExpenseUpdate}
              settlements={settlements}
              onAddSettlementPair={addSettlementPair}
              currentUserId={user.id}
              onUpdateStatus={handleSettlementStatusUpdate} 
              onDeleteSettlementGroup={deleteSettlementGroup}
            />
          </TabsContent>

          <TabsContent value="expenses" className="space-y-6">
            <div className="flex justify-center">
              <Button 
                onClick={() => setShowAddExpense(true)}
                className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
                size="lg"
              >
                <Plus className="h-5 w-5 mr-2" />
                Add New Expense
              </Button>
            </div>
            
            <AddExpense 
              open={showAddExpense}
              onClose={() => setShowAddExpense(false)}
              onAddExpense={handleAddExpenseSubmit}
            />
          </TabsContent>

          <TabsContent value="roommates" className="space-y-6">
            <RoommateManagement />
          </TabsContent>

          <TabsContent value="settlements" className="space-y-6">
            <SettlementHistory 
              settlements={settlements} 
              onUpdateStatus={handleSettlementStatusUpdate}
              onDeleteSettlementGroup={deleteSettlementGroup}
              hasActiveExpenses={hasActiveExpenses}
            />
          </TabsContent>

          <TabsContent value="profile" className="space-y-6">
            <Profile />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
