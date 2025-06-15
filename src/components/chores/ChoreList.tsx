
import React from 'react';
import { Chore } from '@/types/chores';
import { ChoreCard } from './ChoreCard';
import { Skeleton } from '../ui/skeleton';

interface ChoreListProps {
  chores: Chore[];
  loading: boolean;
  onChoreDeleted: () => void;
}

export const ChoreList = ({ chores, loading, onChoreDeleted }: ChoreListProps) => {
  if (loading) {
    return (
        <div className="space-y-4">
            <h2 className="text-2xl font-bold">Your Chores</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-48 w-full" />)}
            </div>
      </div>
    );
  }

  if (chores.length === 0) {
    return (
      <div className="text-center text-gray-500 py-12 border-2 border-dashed rounded-lg">
        <h3 className="text-lg font-semibold">No Chores Yet!</h3>
        <p className="mt-1">Add a new chore to start assigning tasks.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Your Chores</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {chores.map((chore) => (
          <ChoreCard key={chore.id} chore={chore} onChoreDeleted={onChoreDeleted} />
        ))}
      </div>
    </div>
  );
};
