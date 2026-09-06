<script setup lang="ts">
import type { AvailabilityDay } from "~/types/admin-api";

const props = defineProps<{ roomTypeId: number }>();
const { request } = useAdminApi();

const RANGE_DAYS = 14;

function toIso(d: Date) {
  return d.toISOString().slice(0, 10);
}
const rangeStart = ref(new Date());
const rangeFrom = computed(() => toIso(rangeStart.value));
const rangeTo = computed(() => {
  const d = new Date(rangeStart.value);
  d.setDate(d.getDate() + RANGE_DAYS);
  return toIso(d);
});

const days = ref<AvailabilityDay[]>([]);
const loading = ref(false);
const error = ref("");

async function load() {
  loading.value = true;
  error.value = "";
  try {
    days.value = await request<AvailabilityDay[]>(
      `/api/admin/room-types/${props.roomTypeId}/availability?date_from=${rangeFrom.value}&date_to=${rangeTo.value}`
    );
  } catch {
    error.value = "Could not load availability.";
  } finally {
    loading.value = false;
  }
}
watch(rangeStart, load, { immediate: true });

function shiftRange(deltaDays: number) {
  const d = new Date(rangeStart.value);
  d.setDate(d.getDate() + deltaDays);
  if (d < new Date(new Date().toDateString())) return;
  rangeStart.value = d;
}

const saving = ref(false);
async function save() {
  saving.value = true;
  error.value = "";
  try {
    await request(`/api/admin/room-types/${props.roomTypeId}/availability`, {
      method: "PUT",
      body: { days: days.value },
    });
  } catch {
    error.value = "Could not save availability.";
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <div>
    <div class="flex justify-between items-center mb-3">
      <p class="font-label-ledger text-[11px] uppercase text-outline">Availability (rooms open per night)</p>
      <div class="flex items-center gap-2">
        <button class="text-xs font-label-ledger uppercase text-secondary border border-outline/25 rounded-sm px-2 py-1" @click="shiftRange(-RANGE_DAYS)">‹ Prev</button>
        <span class="font-label-ledger text-xs text-outline">{{ rangeFrom }} → {{ rangeTo }}</span>
        <button class="text-xs font-label-ledger uppercase text-secondary border border-outline/25 rounded-sm px-2 py-1" @click="shiftRange(RANGE_DAYS)">Next ›</button>
      </div>
    </div>

    <div v-if="loading" class="text-sm text-outline">Loading…</div>
    <div v-else class="border border-outline/20 bg-white overflow-x-auto">
      <div class="flex min-w-max">
        <div v-for="d in days" :key="d.date" class="border-r border-outline/10 last:border-0 px-3 py-3 text-center w-[86px] flex-shrink-0">
          <p class="text-[11px] text-outline mb-1.5">{{ d.date.slice(5) }}</p>
          <input
            v-model.number="d.rooms_available"
            type="number"
            min="0"
            max="50"
            class="w-full text-center border-b border-secondary bg-transparent py-1 text-sm"
          />
        </div>
      </div>
    </div>

    <button
      :disabled="saving || loading"
      class="mt-3 bg-primary text-white border-none cursor-pointer px-4 py-2 rounded-sm font-label-ledger text-xs uppercase disabled:opacity-50"
      @click="save"
    >
      {{ saving ? "Saving…" : "Save availability" }}
    </button>
    <p v-if="error" class="text-error text-xs mt-2">{{ error }}</p>
  </div>
</template>
