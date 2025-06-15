
import { useState, useEffect } from 'react';

const defaultCategories = [
  'Vegetable',
  'Grocery',
  'Fruit',
  'Salary to Maid',
  'LPG',
  'Milk',
  'Rasgulla',
  'Saturday Special',
  'Food'
];

export const useCategories = () => {
  const [categories, setCategories] = useState<string[]>(defaultCategories);

  useEffect(() => {
    const savedCategories = localStorage.getItem('expenseCategories');
    if (savedCategories) {
      try {
        const parsed = JSON.parse(savedCategories);
        if (Array.isArray(parsed)) {
          setCategories(parsed);
        }
      } catch (error) {
        console.error('Error parsing saved categories:', error);
      }
    }
  }, []);

  const saveCategories = (newCategories: string[]) => {
    setCategories(newCategories);
    localStorage.setItem('expenseCategories', JSON.stringify(newCategories));
  };

  const addCategory = (category: string) => {
    const newCategories = [...categories, category];
    saveCategories(newCategories);
  };

  const editCategory = (oldCategory: string, newCategory: string) => {
    const newCategories = categories.map(cat => 
      cat === oldCategory ? newCategory : cat
    );
    saveCategories(newCategories);
  };

  const deleteCategory = (category: string) => {
    const newCategories = categories.filter(cat => cat !== category);
    saveCategories(newCategories);
  };

  const resetToDefaults = () => {
    saveCategories(defaultCategories);
  };

  return {
    categories,
    addCategory,
    editCategory,
    deleteCategory,
    resetToDefaults
  };
};
