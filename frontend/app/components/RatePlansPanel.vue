<script setup lang="ts">
import type { RatePlan } from "~/types/admin-api";

// The availability endpoint's rate_plans only carry this subset of RatePlan.
type RatePlanSummary = Pick<RatePlan, "id" | "name" | "fixed_price" | "refundable" | "includes_breakfast">;

const props = defineProps<{ roomTypeId: number }>();
const { request } = useAdminApi();

function extractErrorMessage(e: any, fallback: string): string {
  const detail = e?.data?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail) && detail.length) return detail.map((d: any) => d.msg).join(" ");
  return fallback;
}

// The public availability endpoint only returns rate plans valid for a given
// date range (capped at 60 days by the API), and there's no plain "list all
// rate plans" endpoint — so we ask for tomorrow..+59d, which surfaces any plan
// whose validity window overlaps the near future (new plans below default to
// a full year, so they'll show up here).
const today = new Date().toISOString().slice(0, 10);
const farFuture = new Date(Date.now() + 59 * 86400000).toISOString().slice(0, 10);
const oneYearOut = new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10);
const { data: fetchedPlans, pending: loading, refresh: reload } = useAsyncData<RatePlanSummary[]>(
  `rate-plans-list-${props.roomTypeId}`,
  () =>
    request<{ rate_plans: RatePlanSummary[] }>(`/api/room-types/${props.roomTypeId}/availability?checkin=${today}&checkout=${farFuture}`).then(
      (r) => r.rate_plans
    ),
  { lazy: true }
);

const showNew = ref(false);
const newPlan = ref({ name: "", fixed_price: 0, refundable: true, includes_breakfast: false, valid_from: today, valid_to: oneYearOut });
const newPlanError = ref("");
const saving = ref(false);

async function createPlan() {
  newPlanError.value = "";
  const p = newPlan.value;
  if (!p.name.trim() || !(p.fixed_price > 0)) {
    newPlanError.value = "Name and a price above 0 are required.";
    return;
  }
  saving.value = true;
  try {
    await request("/api/admin/rate-plans", {
      method: "POST",
      body: { room_type_id: props.roomTypeId, ...p, name: p.name.trim() },
    });
    newPlan.value = { name: "", fixed_price: 0, refundable: true, includes_breakfast: false, valid_from: today, valid_to: oneYearOut };
    showNew.value = false;
    await reload();
  } catch (e: any) {
    newPlanError.value = extractErrorMessage(e, "Could not create rate plan.");
  } finally {
    saving.value = false;
  }
}

const deleteBusy = ref<number | null>(null);
const deleteError = ref("");
async function deletePlan(id: number) {
  if (!confirm("Delete this rate plan?")) return;
  deleteBusy.value = id;
  deleteError.value = "";
  try {
    await request(`/api/admin/rate-plans/${id}`, { method: "DELETE" });
    await reload();
  } catch (e: any) {
    deleteError.value = extractErrorMessage(e, "Could not delete this rate plan — it may have existing bookings.");
  } finally {
    deleteBusy.value = null;
  }
}
</script>

<template>
  <div>
    <div class="flex justify-between items-center mb-3">
      <p class="font-label-ledger text-[11px] uppercase text-outline">Rate plans</p>
      <button class="text-xs font-label-ledger uppercase text-secondary border border-outline/25 rounded-sm px-2.5 py-1" @click="showNew = !showNew">
        {{ showNew ? "Cancel" : "+ Add rate plan" }}
      </button>
    </div>

    <div v-if="showNew" class="border border-outline/20 bg-surface-container-low p-4 mb-3">
      <div class="grid gap-3 sm:grid-cols-2 mb-3">
        <input v-model="newPlan.name" placeholder="Plan name (e.g. Flexible)" maxlength="100" class="border-b border-secondary bg-transparent py-1.5 text-sm" />
        <input v-model.number="newPlan.fixed_price" type="number" min="1" placeholder="Price / night" class="border-b border-secondary bg-transparent py-1.5 text-sm" />
        <label class="flex items-center gap-2 text-sm"><input v-model="newPlan.refundable" type="checkbox" /> Refundable</label>
        <label class="flex items-center gap-2 text-sm"><input v-model="newPlan.includes_breakfast" type="checkbox" /> Includes breakfast</label>
        <div class="flex flex-col gap-1">
          <label class="text-[11px] uppercase text-outline">Valid from</label>
          <input v-model="newPlan.valid_from" type="date" class="border-b border-secondary bg-transparent py-1.5 text-sm" />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-[11px] uppercase text-outline">Valid to</label>
          <input v-model="newPlan.valid_to" type="date" class="border-b border-secondary bg-transparent py-1.5 text-sm" />
        </div>
      </div>
      <button :disabled="saving" class="bg-secondary text-white border-none cursor-pointer px-3.5 py-1.5 rounded-sm font-label-ledger text-xs uppercase disabled:opacity-50" @click="createPlan">
        {{ saving ? "Creating…" : "Create rate plan" }}
      </button>
      <p v-if="newPlanError" class="text-error text-xs mt-2">{{ newPlanError }}</p>
    </div>

    <div v-if="loading" class="text-sm text-outline">Loading rate plans…</div>
    <div v-else class="border border-outline/20 bg-white">
      <div v-for="p in fetchedPlans" :key="p.id" class="border-b border-outline/10 last:border-0 px-4 py-2.5 flex justify-between items-center text-sm">
        <div>
          <span class="font-label-ledger">{{ p.name }}</span>
          <span class="text-outline text-xs ml-2">{{ p.refundable ? "Refundable" : "Non-refundable" }}{{ p.includes_breakfast ? " · Breakfast" : "" }}</span>
        </div>
        <div class="flex items-center gap-3">
          <span class="font-price-display">₹{{ p.fixed_price.toLocaleString("en-IN") }}</span>
          <button
            :disabled="deleteBusy === p.id"
            class="text-xs font-label-ledger uppercase text-error border border-error/40 rounded-sm px-2 py-1 disabled:opacity-40"
            @click="deletePlan(p.id)"
          >
            Delete
          </button>
        </div>
      </div>
      <p v-if="fetchedPlans?.length === 0" class="px-4 py-4 text-center text-sm text-on-surface-variant">No rate plans yet.</p>
    </div>
    <p v-if="deleteError" class="text-error text-xs mt-2">{{ deleteError }}</p>
  </div>
</template>
