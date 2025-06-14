import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { NavBar } from "@/components/NavBar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ExpenseOverview } from "@/components/ExpenseOverview";
import { AddExpense } from "@/components/AddExpense";
import { RoommateManagement } from "@/components/RoommateManagement";
import { SettlementHistory, Settlement } from "@/components/SettlementHistory"; // Import Settlement type
import { Profile } from "@/components/Profile";
import { useExpenses } from "@/hooks/useExpenses";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { expenses, addExpense, deleteExpense } = useExpenses();
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [settlements, setSettlements] = useState<Settlement[]>([]); // Use imported Settlement type

  useEffect(() => {
    console.log('Index page - user:', user?.email, 'loading:', loading);
    if (!loading && !user) {
      console.log('Redirecting to auth page');
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  if (loading) {
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

  const formattedExpenses = expenses.map(expense => ({
    id: expense.id,
    description: expense.description,
    amount: expense.amount,
    paidBy: expense.paid_by,
    date: new Date(expense.date).toLocaleDateString(), // Consider keeping as ISO string or Date object for consistency
    category: expense.category,
    sharers: expense.sharers || []
  }));

  const handleAddExpense = (expense: any) => {
    addExpense({
      description: expense.description,
      amount: expense.amount,
      paid_by: expense.paidBy,
      category: expense.category,
      date: new Date().toISOString(),
      sharers: expense.sharers
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user.email}!</h1>
          <p className="text-gray-600">Manage your expenses and roommate settlements.</p>
        </div>
        
        <Tabs defaultValue="overview" className="space-y-8">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="expenses">Add Expense</TabsTrigger>
            <TabsTrigger value="roommates">Roommates</TabsTrigger>
            <TabsTrigger value="settlements">Settlements</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <ExpenseOverview 
              expenses={formattedExpenses}
              onExpenseUpdate={() => { /* Consider calling refetch from useExpenses here if needed */ }}
              settlements={settlements}
              onSettlementUpdate={setSettlements}
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
              onAddExpense={handleAddExpense}
            />
          </TabsContent>

          <TabsContent value="roommates" className="space-y-6">
            <RoommateManagement />
          </TabsContent>

          <TabsContent value="settlements" className="space-y-6">
            <SettlementHistory settlements={settlements} />
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
