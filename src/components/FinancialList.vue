<script setup lang="ts">
import { ref } from 'vue';
import { defineEmits } from 'vue';
import type { FinancialEntry, TaxElement } from '../types';

defineProps<{
  title: string;
  type: 'income' | 'expense';
  entries: FinancialEntry[];
}>();

const emit = defineEmits<{
  (e: 'add', entry: FinancialEntry): void;
  (e: 'remove', id: string): void;
  (e: 'updateTaxes', entryId: string, taxes: TaxElement[]): void;
  (e: 'updateFrequency', entryId: string, frequency: FinancialEntry['frequency']): void;
  (e: 'updateAmount', entryId: string, amount: FinancialEntry['amount']): void;
  (e: 'updateDescription', entryId: string, description: FinancialEntry['description']): void;
}>();

const description = ref('');
const amount = ref('');
const frequency = ref<FinancialEntry['frequency']>('monthly');

// Tax management
const showTaxModal = ref(false);
const selectedEntryId = ref<string | null>(null);
const taxName = ref('');
const taxPercentage = ref('');
const currentTaxes = ref<TaxElement[]>([]);

// Frequency editing
const editingFrequencyId = ref<string | null>(null);

// Add these new refs for editing states
const editingDescriptionId = ref<string | null>(null);
const editingAmountId = ref<string | null>(null);
const editingDescription = ref('');
const editingAmount = ref('');

const addEntry = () => {
  if (!description.value || !amount.value) return;

  emit('add', {
    id: crypto.randomUUID(),
    description: description.value,
    amount: Number(amount.value),
    frequency: frequency.value,
    taxes: []
  });

  description.value = '';
  amount.value = '';
  frequency.value = 'monthly';
};

const openTaxModal = (entry: FinancialEntry) => {
  selectedEntryId.value = entry.id;
  currentTaxes.value = [...(entry.taxes || [])];
  showTaxModal.value = true;
};

const addTax = () => {
  if (!taxName.value || !taxPercentage.value) return;

  currentTaxes.value.push({
    id: crypto.randomUUID(),
    name: taxName.value,
    percentage: Number(taxPercentage.value)
  });

  taxName.value = '';
  taxPercentage.value = '';
};

const removeTax = (taxId: string) => {
  currentTaxes.value = currentTaxes.value.filter(tax => tax.id !== taxId);
};

const saveTaxes = () => {
  if (selectedEntryId.value) {
    emit('updateTaxes', selectedEntryId.value, currentTaxes.value);
  }
  showTaxModal.value = false;
  selectedEntryId.value = null;
  currentTaxes.value = [];
};

const calculateTotalTaxPercentage = (taxes?: TaxElement[]) => {
  if (!taxes || taxes.length === 0) return 0;
  return taxes.reduce((sum, tax) => sum + tax.percentage, 0);
};

const startEditingFrequency = (entryId: string) => {
  editingFrequencyId.value = entryId;
};

const updateFrequency = (id: string, event: Event) => {
  const select = event.target as HTMLSelectElement;
  emit('updateFrequency', id, select.value as FinancialEntry['frequency']);
};

// Add these new functions for description editing
const startEditingDescription = (entry: FinancialEntry) => {
  editingDescriptionId.value = entry.id;
  editingDescription.value = entry.description;
};

const saveDescription = (id: string) => {
  if (editingDescription.value.trim()) {
    emit('updateDescription', id, editingDescription.value);
  }
  editingDescriptionId.value = null;
};

// Add these new functions for amount editing
const startEditingAmount = (entry: FinancialEntry) => {
  editingAmountId.value = entry.id;
  editingAmount.value = entry.amount.toString();
};

const saveAmount = (id: string) => {
  const amount = Number(editingAmount.value);
  if (!isNaN(amount)) {
    emit('updateAmount', id, amount);
  }
  editingAmountId.value = null;
};
</script>

<template>
  <div class="bg-white p-6 rounded-lg shadow-md">
    <h2 class="text-2xl font-semibold text-gray-800 mb-6">{{ title }}</h2>

    <div class="grid grid-cols-[2fr_1fr_1fr_auto] gap-4 mb-6">
      <input
        v-model="description"
        type="text"
        placeholder="Description"
        class="text-base"
      />
      <input
        v-model="amount"
        type="number"
        placeholder="Amount"
        class="text-base"
      />
      <select v-model="frequency" class="text-base bg-white">
        <option value="daily">Daily</option>
        <option value="weekly">Weekly</option>
        <option value="monthly">Monthly</option>
        <option value="yearly">Yearly</option>
      </select>
      <button @click="addEntry" class="bg-emerald-500 text-white hover:bg-emerald-600 focus:ring-emerald-500 min-w-[80px]">
        Add
      </button>
    </div>

    <ul class="space-y-3">
      <li v-for="entry in entries" :key="entry.id" class="border-b border-gray-100 pb-3 last:border-b-0">
        <div class="grid grid-cols-[2fr_1fr_1fr_auto] gap-4 items-center">
          <!-- Description (editable) -->
          <span
            class="font-medium text-gray-700 cursor-pointer p-2 rounded hover:bg-gray-50"
            @click="startEditingDescription(entry)"
          >
            <template v-if="editingDescriptionId === entry.id">
              <input
                v-model="editingDescription"
                type="text"
                class="w-full bg-white"
                @blur="saveDescription(entry.id)"
                @keyup.enter="saveDescription(entry.id)"
                ref="descriptionInput"
              />
            </template>
            <template v-else>
              {{ entry.description }}
            </template>
          </span>

          <!-- Amount (editable) -->
          <span
            class="text-right font-mono font-medium cursor-pointer p-2 rounded hover:bg-gray-50"
            @click="startEditingAmount(entry)"
          >
            <template v-if="editingAmountId === entry.id">
              <input
                v-model="editingAmount"
                type="number"
                class="w-full bg-white text-right"
                @blur="saveAmount(entry.id)"
                @keyup.enter="saveAmount(entry.id)"
                ref="amountInput"
              />
            </template>
            <template v-else>
              {{ entry.amount.toFixed(2) }}
            </template>
          </span>

          <!-- Frequency (existing) -->
          <span
            class="text-gray-600 cursor-pointer p-2 rounded hover:bg-gray-50"
            @click="startEditingFrequency(entry.id)"
          >
            <template v-if="editingFrequencyId === entry.id">
              <select
                :value="entry.frequency"
                class="w-full bg-white"
                @change="updateFrequency(entry.id, $event)"
                @blur="editingFrequencyId = null"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </template>
            <template v-else>
              {{ entry.frequency }}
            </template>
          </span>

          <!-- Actions (existing) -->
          <div class="flex gap-2">
            <button
              v-if="type === 'income'"
              @click="openTaxModal(entry)"
              class="px-3 py-1.5 text-sm rounded-md text-white focus:ring-blue-500"
              :class="[entry.taxes?.length ? 'bg-blue-500 hover:bg-blue-600' : 'bg-indigo-500 hover:bg-indigo-600']"
            >
              {{ calculateTotalTaxPercentage(entry.taxes) }}%
            </button>
            <button
              @click="emit('remove', entry.id)"
              class="bg-red-500 hover:bg-red-600 text-white w-8 h-8 rounded-md flex items-center justify-center focus:ring-red-500"
            >
              ×
            </button>
          </div>
        </div>
        <div v-if="entry.taxes?.length" class="text-sm text-gray-600 mt-2 pl-2">
          Taxes: {{ entry.taxes.map(tax => `${tax.name} (${tax.percentage}%)`).join(', ') }}
        </div>
      </li>
    </ul>

    <!-- Tax Modal -->
    <div v-if="showTaxModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white p-8 rounded-lg w-[90%] max-w-lg">
        <h3 class="text-xl font-semibold mb-6">Manage Taxes</h3>

        <div class="grid grid-cols-[2fr_1fr_auto] gap-4 mb-6">
          <input
            v-model="taxName"
            type="text"
            placeholder="Tax name"
            class="text-base"
          />
          <input
            v-model="taxPercentage"
            type="number"
            placeholder="Percentage"
            min="0"
            max="100"
            step="0.1"
            class="text-base"
          />
          <button @click="addTax" class="bg-emerald-500 text-white hover:bg-emerald-600 focus:ring-emerald-500 min-w-[100px]">
            Add Tax
          </button>
        </div>

        <ul class="space-y-3 mb-6">
          <li v-for="tax in currentTaxes" :key="tax.id" class="flex justify-between items-center p-3 bg-gray-50 rounded-md">
            <span class="font-medium">{{ tax.name }}: {{ tax.percentage }}%</span>
            <button
              @click="removeTax(tax.id)"
              class="bg-red-500 hover:bg-red-600 text-white w-8 h-8 rounded-md flex items-center justify-center focus:ring-red-500"
            >
              ×
            </button>
          </li>
        </ul>

        <div class="flex justify-end gap-3">
          <button
            @click="saveTaxes"
            class="bg-emerald-500 text-white hover:bg-emerald-600 focus:ring-emerald-500"
          >
            Save
          </button>
          <button
            @click="showTaxModal = false"
            class="bg-gray-500 text-white hover:bg-gray-600 focus:ring-gray-500"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
/* All styles have been replaced with Tailwind classes */
</style>
