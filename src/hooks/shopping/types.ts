
export interface UseShoppingListsReturn {
  shoppingLists: any[];
  currentList: any | null;
  items: any[];
  loading: boolean;
  getOrCreateTodaysList: () => Promise<any>;
  addItem: (itemData: any) => Promise<void>;
  markAsPurchased: (itemId: string) => Promise<void>;
  sendMarketNotification: () => Promise<void>;
  refetch: () => Promise<void>;
}
