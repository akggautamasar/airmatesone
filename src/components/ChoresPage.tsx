
import React from 'react';
import { AddChoreForm } from './chores/AddChoreForm';
import { ChoreList } from './chores/ChoreList';
import { useChores } from '@/hooks/useChores';
import { ClipboardList } from 'lucide-react';

export const ChoresPage = () => {
  const { chores, loading, refetch } = useChores();

  const handleChoreAdded = () => {
    refetch();
  };
  
  const handleChoreDeleted = () => {
    refetch();
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center space-x-3">
        <ClipboardList className="h-8 w-8 text-green-600" />
        <div>
            <h1 className="text-3xl font-bold">Chore Management</h1>
            <p className="text-gray-600">Assign and track daily rotating chores among roommates.</p>
        </div>
      </div>
      
      <AddChoreForm onChoreAdded={handleChoreAdded} />
      
      <ChoreList chores={chores} loading={loading} onChoreDeleted={handleChoreDeleted} />
    </div>
  );
};
