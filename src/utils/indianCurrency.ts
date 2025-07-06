
// Utility functions for Indian currency formatting
export const formatIndianCurrency = (amount: number): string => {
  if (isNaN(amount)) return '₹0';
  
  const formatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
  
  return formatter.format(amount);
};

export const formatIndianNumber = (num: number): string => {
  if (isNaN(num)) return '0';
  return new Intl.NumberFormat('en-IN').format(num);
};

export const parseIndianCurrency = (value: string): number => {
  // Remove currency symbol and commas, then parse
  const cleaned = value.replace(/[₹,\s]/g, '');
  return parseFloat(cleaned) || 0;
};

export const formatIndianDate = (date: Date): string => {
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};
