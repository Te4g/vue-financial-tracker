<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import type { FinancialEntry, Summary, TaxElement } from './types';
import FinancialList from './components/FinancialList.vue';
import CsvImport from "./components/CsvImport.vue";

const incomeEntries = ref<FinancialEntry[]>([]);
const expenseEntries = ref<FinancialEntry[]>([]);

const calculateMonthlyAmount = (entry: FinancialEntry): number => {
  switch (entry.frequency) {
    case 'daily':
      return entry.amount * 30;
    case 'weekly':
      return entry.amount * 4;
    case 'yearly':
      return entry.amount / 12;
    default:
      return entry.amount;
  }
};

const calculateTaxAmount = (monthlyAmount: number, taxes?: TaxElement[]): number => {
  if (!taxes || taxes.length === 0) return 0;
  return taxes.reduce((sum, tax) => sum + (monthlyAmount * tax.percentage / 100), 0);
};

const summary = computed<Summary>(() => {
  const incomeDetails = incomeEntries.value.reduce(
    (acc, entry) => {
      const monthlyAmount = calculateMonthlyAmount(entry);
      const taxAmount = calculateTaxAmount(monthlyAmount, entry.taxes);
      return {
        total: acc.total + monthlyAmount,
        taxes: acc.taxes + taxAmount
      };
    },
    { total: 0, taxes: 0 }
  );

  const totalExpenses = expenseEntries.value.reduce(
    (sum, entry) => sum + calculateMonthlyAmount(entry),
    0
  );

  return {
    totalIncome: incomeDetails.total,
    totalTaxes: incomeDetails.taxes,
    totalExpenses,
    netIncome: incomeDetails.total - incomeDetails.taxes,
    balance: incomeDetails.total - incomeDetails.taxes - totalExpenses
  };
});

const addIncome = (entry: FinancialEntry) => {
  incomeEntries.value.push(entry);
};

const addExpense = (entry: FinancialEntry) => {
  expenseEntries.value.push(entry);
};

const removeIncome = (id: string) => {
  incomeEntries.value = incomeEntries.value.filter(entry => entry.id !== id);
};

const removeExpense = (id: string) => {
  expenseEntries.value = expenseEntries.value.filter(entry => entry.id !== id);
};

const updateIncomeTaxes = (entryId: string, taxes: TaxElement[]) => {
  const entry = incomeEntries.value.find(entry => entry.id === entryId);
  if (entry) {
    entry.taxes = taxes;
  }
};

const updateIncomeFrequency = (entryId: string, frequency: FinancialEntry['frequency']) => {
  const entry = incomeEntries.value.find(entry => entry.id === entryId);
  if (entry) {
    entry.frequency = frequency;
  }
};

const updateExpenseFrequency = (entryId: string, frequency: FinancialEntry['frequency']) => {
  const entry = expenseEntries.value.find(entry => entry.id === entryId);
  if (entry) {
    entry.frequency = frequency;
  }
};

const updateIncomeDescription = (entryId: string, description: string) => {
  const entry = incomeEntries.value.find(entry => entry.id === entryId);
  if (entry) {
    entry.description = description;
  }
};

const updateIncomeAmount = (entryId: string, amount: number) => {
  const entry = incomeEntries.value.find(entry => entry.id === entryId);
  if (entry) {
    entry.amount = amount;
  }
};

const updateExpenseDescription = (entryId: string, description: string) => {
  const entry = expenseEntries.value.find(entry => entry.id === entryId);
  if (entry) {
    entry.description = description;
  }
};

const updateExpenseAmount = (entryId: string, amount: number) => {
  const entry = expenseEntries.value.find(entry => entry.id === entryId);
  if (entry) {
    entry.amount = amount;
  }
};

const exportData = () => {
  const data = {
    income: incomeEntries.value,
    expenses: expenseEntries.value
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `financial-data_${new Date().toISOString()}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const importData = (event: Event) => {
  const input = event.target as HTMLInputElement;
  if (!input.files?.length) return;

  const file = input.files[0];
  const reader = new FileReader();

  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target?.result as string);
      if (data.income && Array.isArray(data.income)) {
        incomeEntries.value = data.income;
      }
      if (data.expenses && Array.isArray(data.expenses)) {
        expenseEntries.value = data.expenses;
      }
    } catch (error) {
      console.error('Error importing data:', error);
      alert('Error importing data. Please check the file format.');
    }
  };

  reader.readAsText(file);
  input.value = ''; // Reset input
};

const saveToLocalStorage = () => {
  const data = {
    income: incomeEntries.value,
    expenses: expenseEntries.value
  };
  localStorage.setItem('financial-tracker-data', JSON.stringify(data));
};

const loadFromLocalStorage = () => {
  const savedData = localStorage.getItem('financial-tracker-data');
  if (savedData) {
    try {
      const data = JSON.parse(savedData);
      if (data.income && Array.isArray(data.income)) {
        incomeEntries.value = data.income;
      }
      if (data.expenses && Array.isArray(data.expenses)) {
        expenseEntries.value = data.expenses;
      }
    } catch (error) {
      console.error('Error loading data from localStorage:', error);
    }
  }
};

const removeData = () => {
  incomeEntries.value = [];
  expenseEntries.value = [];
  localStorage.removeItem('financial-tracker-data');
};

const handleCsvImport = (entries: FinancialEntry[]) => {
  const incomes = entries.filter(entry => entry.type === 'income');
  const expenses = entries.filter(entry => entry.type === 'expense');

  // Add these entries to your existing state
  incomes.forEach(entry => incomeEntries.value.push(entry));
  expenses.forEach(entry => expenseEntries.value.push(entry));
};

watch(
  [incomeEntries, expenseEntries],
  () => {
    saveToLocalStorage();
  },
  { deep: true }
);

onMounted(() => {
  loadFromLocalStorage();
});
</script>

<template>
  <div class="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-6xl mx-auto">
      <h1 class="text-4xl font-bold text-gray-800 text-center mb-10">Financial Tracker</h1>

      <div class="flex justify-center gap-4 mb-8">
        <CsvImport @import="handleCsvImport" />
        <button @click="exportData" class="px-4 py-2 bg-gray-800 text-white hover:bg-gray-700 focus:ring-gray-800 rounded-md font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2">
          Export Data
        </button>
        <label class="px-4 py-2 bg-gray-800 text-white hover:bg-gray-700 focus:ring-gray-800 rounded-md font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 cursor-pointer inline-flex items-center">
          Import Data
          <input
            type="file"
            accept=".json"
            class="hidden"
            @change="importData"
          >
        </label>
        <button @click="removeData" class="px-4 py-2 bg-red-500 text-white hover:bg-red-600 focus:ring-red-500 rounded-md font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2">
          Remove Data
        </button>
      </div>

      <div class="bg-white p-8 rounded-lg shadow-md mb-8">
        <div class="space-y-4">
          <div class="flex justify-between items-center py-3 border-b border-gray-100">
            <span class="text-lg">Total Monthly Income (Gross):</span>
            <span class="text-xl font-mono font-bold text-emerald-500">{{ summary.totalIncome.toFixed(2) }}</span>
          </div>
          <div class="flex justify-between items-center py-3 border-b border-gray-100">
            <span class="text-lg">Total Monthly Taxes:</span>
            <span class="text-xl font-mono font-bold text-indigo-500">{{ summary.totalTaxes.toFixed(2) }}</span>
          </div>
          <div class="flex justify-between items-center py-3 border-b border-gray-100">
            <span class="text-lg">Net Monthly Income:</span>
            <span class="text-xl font-mono font-bold text-green-600">{{ summary.netIncome.toFixed(2) }}</span>
          </div>
          <div class="flex justify-between items-center py-3 border-b border-gray-100">
            <span class="text-lg">Total Monthly Expenses:</span>
            <span class="text-xl font-mono font-bold text-red-500">{{ summary.totalExpenses.toFixed(2) }}</span>
          </div>
          <div class="flex justify-between items-center py-3">
            <span class="text-lg">Monthly Balance:</span>
            <span
              class="text-xl font-mono font-bold"
              :class="{ 'text-emerald-500': summary.balance >= 0, 'text-red-500': summary.balance < 0 }"
            >
              {{ summary.balance.toFixed(2) }}
            </span>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
        <FinancialList
          title="Income Sources"
          type="income"
          :entries="incomeEntries"
          @add="addIncome"
          @remove="removeIncome"
          @update-taxes="updateIncomeTaxes"
          @update-frequency="updateIncomeFrequency"
          @update-description="updateIncomeDescription"
          @update-amount="updateIncomeAmount"
        />
        <FinancialList
          title="Expenses"
          type="expense"
          :entries="expenseEntries"
          @add="addExpense"
          @remove="removeExpense"
          @update-frequency="updateExpenseFrequency"
          @update-description="updateExpenseDescription"
          @update-amount="updateExpenseAmount"
        />
      </div>
    </div>
  </div>
</template>

<style>
/* All styles have been replaced with Tailwind classes */
</style>
