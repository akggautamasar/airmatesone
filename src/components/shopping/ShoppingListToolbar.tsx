
import React from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { ShoppingListItem } from '@/types/shopping';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import papaparse from 'papaparse';

interface ShoppingListToolbarProps {
  selectedDate: Date;
  onDateChange: (date?: Date) => void;
  items: ShoppingListItem[];
}

export const ShoppingListToolbar = ({ selectedDate, onDateChange, items }: ShoppingListToolbarProps) => {

  const handleExportCSV = () => {
    const data = items.map(item => ({
      Name: item.product?.name || item.custom_product_name,
      Quantity: item.quantity,
      Category: item.product?.category || '',
      'Added By': item.added_by_profile?.name || item.added_by_profile?.email || 'Unknown',
      Status: item.is_purchased ? 'Purchased' : 'Pending',
      'Purchased By': item.is_purchased ? (item.purchased_by_profile?.name || item.purchased_by_profile?.email || 'Unknown') : '',
    }));
    const csv = papaparse.unparse(data);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `shopping-list-${format(selectedDate, 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.text(`Shopping List - ${format(selectedDate, 'yyyy-MM-dd')}`, 14, 15);
    autoTable(doc, {
      head: [['Name', 'Quantity', 'Category', 'Added By', 'Status', 'Purchased By']],
      body: items.map(item => [
        item.product?.name || item.custom_product_name || '',
        item.quantity,
        item.product?.category || '',
        item.added_by_profile?.name || item.added_by_profile?.email || 'Unknown',
        item.is_purchased ? 'Purchased' : 'Pending',
        item.is_purchased ? (item.purchased_by_profile?.name || item.purchased_by_profile?.email || 'Unknown') : '',
      ]),
      startY: 20,
    });
    doc.save(`shopping-list-${format(selectedDate, 'yyyy-MM-dd')}.pdf`);
  };

  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border bg-card text-card-foreground shadow-sm p-4">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={"outline"}
            className={cn(
              "w-[280px] justify-start text-left font-normal",
              !selectedDate && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={onDateChange}
            initialFocus
          />
        </PopoverContent>
      </Popover>
      <div className="flex gap-2">
        <Button onClick={handleExportCSV} variant="outline" size="sm" disabled={items.length === 0}>
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
        <Button onClick={handleExportPDF} variant="outline" size="sm" disabled={items.length === 0}>
          <Download className="mr-2 h-4 w-4" />
          Export PDF
        </Button>
      </div>
    </div>
  );
};
