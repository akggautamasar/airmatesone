
import React, { useState } from 'react';
import { Dialog } from "@/components/ui/dialog";
import { useShoppingLists } from "@/hooks/useShoppingLists";
import { AddItemDialog } from "./AddItemDialog";
import { ShoppingListHeader } from "./ShoppingListHeader";
import { PendingItemsList } from "./PendingItemsList";
import { PurchasedItemsList } from "./PurchasedItemsList";

export const ShoppingListManager = () => {
  const { currentList, items, addItem, markAsPurchased, sendMarketNotification } = useShoppingLists();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  return (
    <div className="space-y-6">
      <ShoppingListHeader
        currentList={currentList}
        items={items}
        onSendMarketNotification={sendMarketNotification}
        onOpenAddDialog={() => setIsAddDialogOpen(true)}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PendingItemsList
          items={items}
          onMarkAsPurchased={markAsPurchased}
        />

        <PurchasedItemsList items={items} />
      </div>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <AddItemDialog
          isOpen={isAddDialogOpen}
          onOpenChange={setIsAddDialogOpen}
          onAddItem={addItem}
        />
      </Dialog>
    </div>
  );
};
