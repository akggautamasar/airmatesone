import React from 'react';
import { DateRange } from 'react-day-picker';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar as CalendarIcon, X } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { useCategories } from '@/hooks/useCategories';
import { useRoommates } from '@/hooks/useRoommates';

export interface ExpenseFiltersState {
  dateRange?: DateRange;
  category?: string;
  paidBy?: string;
  splitWith?: string;
  minAmount?: string;
  maxAmount?: string;
}

interface ExpenseFiltersProps {
  filters: ExpenseFiltersState;
  onFilterChange: (filters: ExpenseFiltersState) => void;
}

export const ExpenseFilters = ({ filters, onFilterChange }: ExpenseFiltersProps) => {
  const { categories } = useCategories();
  const { roommates } = useRoommates();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ ...filters, [e.target.name]: e.target.value });
  };

  const handleSelectChange = (name: string, value: string) => {
    onFilterChange({ ...filters, [name]: value === 'all' ? undefined : value });
  };

  const handleDateChange = (dateRange?: DateRange) => {
    onFilterChange({ ...filters, dateRange });
  };
  
  const clearFilters = () => {
    onFilterChange({});
  };

  return (
    <div className="p-4 border rounded-lg bg-card text-card-foreground shadow-sm space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Date Range</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filters.dateRange?.from ? (
                  filters.dateRange.to ? (
                    <>
                      {format(filters.dateRange.from, "LLL dd, y")} -{" "}
                      {format(filters.dateRange.to, "LLL dd, y")}
                    </>
                  ) : (
                    format(filters.dateRange.from, "LLL dd, y")
                  )
                ) : (
                  <span>Pick a date range</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="range"
                selected={filters.dateRange}
                onSelect={handleDateChange}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Category</label>
          <Select value={filters.category || 'all'} onValueChange={(value) => handleSelectChange('category', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((catName: string) => (
                <SelectItem key={catName} value={catName}>
                  {catName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
            <label className="text-sm font-medium">Paid By</label>
            <Select value={filters.paidBy || 'all'} onValueChange={(value) => handleSelectChange('paidBy', value)}>
                <SelectTrigger>
                    <SelectValue placeholder="Select who paid" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Anyone</SelectItem>
                    {roommates.map((r) => (
                        <SelectItem key={r.id} value={r.email}>
                            {r.name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>

        <div className="space-y-2">
            <label className="text-sm font-medium">Split With</label>
            <Select value={filters.splitWith || 'all'} onValueChange={(value) => handleSelectChange('splitWith', value)}>
                <SelectTrigger>
                    <SelectValue placeholder="Select a sharer" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Anyone</SelectItem>
                    {roommates.map((r) => (
                        <SelectItem key={r.id} value={r.email}>
                            {r.name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>

        <div className="space-y-2 col-span-1 md:col-span-2 lg:col-span-1">
          <label className="text-sm font-medium">Amount Range</label>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              name="minAmount"
              placeholder="Min"
              value={filters.minAmount || ''}
              onChange={handleInputChange}
              className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <span>-</span>
            <Input
              type="number"
              name="maxAmount"
              placeholder="Max"
              value={filters.maxAmount || ''}
              onChange={handleInputChange}
              className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          </div>
        </div>

        <div className="flex items-end">
            <Button onClick={clearFilters} variant="outline" className="w-full">
              <X className="mr-2 h-4 w-4" /> Clear Filters
            </Button>
        </div>
      </div>
    </div>
  );
};
