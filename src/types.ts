export interface TaxElement {
  id: string;
  name: string;
  percentage: number;
}

export interface FinancialEntry {
  id: string;
  description: string;
  amount: number;
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  taxes?: TaxElement[];
}

export interface Summary {
  totalIncome: number;
  totalExpenses: number;
  totalTaxes: number;
  netIncome: number;
  balance: number;
}