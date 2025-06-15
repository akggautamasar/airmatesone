
export interface ShoppingList {
  id: string;
  date: string;
  created_by: string;
  is_market_notification_sent: boolean;
  created_at: string;
  updated_at: string;
}

export interface ShoppingListItem {
  id: string;
  shopping_list_id: string;
  product_id: string | null;
  custom_product_name: string | null;
  quantity: string;
  added_by: string;
  is_purchased: boolean;
  purchased_by: string | null;
  purchased_at: string | null;
  created_at: string;
  updated_at: string;
  product?: {
    name: string;
    category: string | null;
    unit: string | null;
  } | null;
  added_by_profile?: {
    name?: string | null;
  } | null;
  purchased_by_profile?: {
    name?: string | null;
  } | null;
}

export interface AddItemData {
  product_id?: string;
  custom_product_name?: string;
  quantity: string;
  save_to_products?: boolean;
}
