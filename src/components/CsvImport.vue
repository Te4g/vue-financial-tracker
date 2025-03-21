<script setup lang="ts">
import type { FinancialEntry } from '../types';

const emit = defineEmits<{
  (e: 'import', entries: FinancialEntry[]): void;
}>();

const parseCSV = (file: File) => {
  const reader = new FileReader();

  reader.onload = (e) => {
    const text = e.target?.result as string;
    const lines = text.split('\n');

    const entries: FinancialEntry[] = lines
        .slice(1)
        .filter(line => line.trim())
        .map(line => {
          const values = line.split(';');

          const debit = values[8] ? parseFloat(values[8]) : 0;
          const credit = values[9] ? parseFloat(values[9]) : 0;
          const type = debit ? ('expense' as const) : ('income' as const);
          const amount = Math.abs(debit || credit);

          return {
            id: crypto.randomUUID(),
            description: values[2],
            amount,
            frequency: 'monthly' as const,
            taxes: [],
            type,
            date: new Date(values[0].split('/').reverse().join('-'))
          };
        }).filter(entry => entry.amount > 0);

    emit('import', entries);
  };

  reader.readAsText(file, 'utf-8');
};

const handleFileUpload = (event: Event) => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];

  if (file) {
    parseCSV(file);
  }
};
</script>

<template>
  <div class="mb-6">
    <input
        type="file"
        accept=".csv"
        @change="handleFileUpload"
        class="block w-full text-sm text-gray-500
        file:mr-4 file:py-2 file:px-4
        file:rounded-md file:border-0
        file:text-sm file:font-semibold
        file:bg-emerald-500 file:text-white
        hover:file:bg-emerald-600"
    />
  </div>
</template>
