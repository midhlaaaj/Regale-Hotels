<script setup lang="ts">
definePageMeta({ layout: "admin" });

import type { AdminBooking, DashboardData, Property } from "~/types/admin-api";

const { request } = useAdminApi();
const auth = useAdminAuthStore();

const { data: dashboard, pending: dashboardPending } = useAsyncData<DashboardData>(
  "dashboard",
  () => request<DashboardData>("/api/admin/dashboard"),
  { lazy: true }
);
const { data: recentBookings, pending: bookingsPending } = useAsyncData<AdminBooking[]>(
  "dashboard-bookings",
  () => request<AdminBooking[]>("/api/admin/bookings"),
  { lazy: true }
);
const { data: properties } = useAsyncData<Property[]>(
  "dashboard-properties",
  () => request<Property[]>("/api/properties"),
  { lazy: true }
);

const propertyName = (id: number) => properties.value?.find((p) => p.id === id)?.name || `#${id}`;

const statusColor: Record<string, string> = {
  confirmed: "bg-secondary-container text-ink-green",
  pending_payment: "bg-brass-tint text-secondary",
  pending_whatsapp: "bg-brass-tint text-secondary",
  cancelled: "bg-surface-container-highest text-on-surface-variant",
  refunded: "bg-surface-container-highest text-on-surface-variant",
};
</script>

<template>
  <div>
    <h1 class="font-display-lg text-headline-md text-on-background mb-6">
      {{ auth.isSuperAdmin ? "Group dashboard" : "Today at your property" }}
    </h1>

    <div class="grid gap-4 sm:grid-cols-3 mb-8">
      <div class="border border-outline/20 bg-white p-5">
        <p class="font-label-ledger text-[11px] tracking-[0.12em] uppercase text-outline mb-2">Today's confirmed stays</p>
        <Skeleton v-if="dashboardPending" class="h-9 w-16" />
        <p v-else class="font-price-display text-3xl text-on-background">{{ dashboard?.todays_bookings_count ?? "—" }}</p>
      </div>
      <div class="border border-outline/20 bg-white p-5">
        <p class="font-label-ledger text-[11px] tracking-[0.12em] uppercase text-outline mb-2">Pending WhatsApp inquiries</p>
        <Skeleton v-if="dashboardPending" class="h-9 w-16" />
        <p v-else class="font-price-display text-3xl text-on-background">{{ dashboard?.pending_whatsapp_count ?? "—" }}</p>
      </div>
      <div class="border border-outline/20 bg-white p-5">
        <p class="font-label-ledger text-[11px] tracking-[0.12em] uppercase text-outline mb-2">Confirmed revenue</p>
        <Skeleton v-if="dashboardPending" class="h-9 w-24" />
        <p v-else class="font-price-display text-3xl text-on-background">
          ₹{{ (dashboard?.confirmed_revenue ?? 0).toLocaleString("en-IN") }}
        </p>
      </div>
    </div>

    <div class="border border-outline/20 bg-white">
      <div class="border-b border-outline/20 px-5 py-4 flex justify-between items-center">
        <h2 class="font-label-ledger text-xs tracking-[0.1em] uppercase text-outline">Recent bookings</h2>
        <NuxtLink to="/admin/bookings" class="font-label-ledger text-xs uppercase text-primary">View all</NuxtLink>
      </div>
      <table class="w-full text-sm">
        <tbody v-if="bookingsPending">
          <tr v-for="i in 5" :key="i" class="border-b border-outline/10 last:border-0">
            <td class="px-5 py-3"><Skeleton class="h-4 w-10" /></td>
            <td class="px-5 py-3"><Skeleton class="h-4 w-32" /></td>
            <td class="px-5 py-3"><Skeleton class="h-4 w-28" /></td>
            <td class="px-5 py-3 text-right"><Skeleton class="h-5 w-20 ml-auto" /></td>
          </tr>
        </tbody>
        <tbody v-else>
          <tr v-for="b in recentBookings?.slice(0, 8)" :key="b.id" class="border-b border-outline/10 last:border-0">
            <td class="px-5 py-3 font-price-display">#{{ b.id }}</td>
            <td class="px-5 py-3">{{ propertyName(b.property_id) }}</td>
            <td class="px-5 py-3 font-label-ledger text-xs text-outline">{{ b.check_in }} → {{ b.check_out }}</td>
            <td class="px-5 py-3 text-right">
              <span class="px-2.5 py-1 rounded-sm font-label-ledger text-[11px] uppercase" :class="statusColor[b.status]">{{
                b.status.replace("_", " ")
              }}</span>
            </td>
          </tr>
          <tr v-if="recentBookings?.length === 0">
            <td class="px-5 py-8 text-center text-on-surface-variant" colspan="4">No bookings yet.</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
