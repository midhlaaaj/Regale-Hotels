<script setup lang="ts">
import type { Property, RatePlan, RoomAvailability, RoomType } from "~/types/api";

const route = useRoute();
const router = useRouter();
const slug = route.params.slug as string;
const { request } = useApi();
const bookingStore = useBookingStore();

const { data: property, pending } = useAsyncData(
  `property-${slug}`,
  () => request<Property>(`/api/properties/${slug}`),
  { lazy: true }
);

useSeoMeta({
  title: () => `Rooms — ${property.value?.name} — Regale Hotels`,
  description: () => `Browse room types at ${property.value?.name}.`,
});

const toISO = (d: Date) => d.toISOString().slice(0, 10);
const checkIn = ref((route.query.check_in as string) || toISO(new Date(Date.now() + 7 * 86400000)));
const checkOut = ref((route.query.check_out as string) || toISO(new Date(Date.now() + 9 * 86400000)));
const adultsCount = ref(Number(route.query.guests) || 2);
const childrenCount = ref(0);
const guestsCount = computed(() => adultsCount.value + childrenCount.value);

const nights = computed(() => {
  const diff = new Date(checkOut.value).getTime() - new Date(checkIn.value).getTime();
  return Math.max(0, Math.round(diff / 86400000));
});

const { data: availability, pending: availabilityPending } = useAsyncData(
  `property-${slug}-availability`,
  async () => {
    const rooms = property.value?.room_types ?? [];
    const results = await Promise.all(
      rooms.map((r) =>
        request<RoomAvailability>(
          `/api/room-types/${r.id}/availability?checkin=${checkIn.value}&checkout=${checkOut.value}`
        ).catch(() => null)
      )
    );
    return Object.fromEntries(rooms.map((r, i) => [r.id, results[i]])) as Record<number, RoomAvailability | null>;
  },
  { lazy: true, watch: [property, checkIn, checkOut] }
);

const selectedPlan = reactive<Record<number, number>>({});

function planFor(room: RoomType): RatePlan | undefined {
  const plans = availability.value?.[room.id]?.rate_plans ?? [];
  return plans.find((p) => p.id === selectedPlan[room.id]) ?? plans[0];
}
function minAvailable(room: RoomType): number | null {
  const days = availability.value?.[room.id]?.days;
  return days?.length ? Math.min(...days.map((d) => d.rooms_available)) : null;
}
function fits(room: RoomType) {
  return room.max_occupancy >= guestsCount.value;
}
function canReserve(room: RoomType) {
  const left = minAvailable(room);
  return fits(room) && nights.value > 0 && !!planFor(room) && left !== null && left > 0;
}

const detailQuery = computed(() => ({
  check_in: checkIn.value,
  check_out: checkOut.value,
  guests: String(guestsCount.value),
}));

function reserve(room: RoomType, method: "online" | "whatsapp") {
  const plan = planFor(room);
  if (!property.value || !plan || !canReserve(room)) return;
  bookingStore.startBooking({
    propertyId: property.value.id,
    propertySlug: property.value.slug,
    propertyName: property.value.name,
    roomType: room,
    ratePlan: plan,
    checkIn: checkIn.value,
    checkOut: checkOut.value,
    guestsCount: guestsCount.value,
  });
  bookingStore.paymentMethod = method;
  router.push("/booking/details");
}
</script>

<template>
  <div v-if="pending" class="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop pt-8">
    <Skeleton class="h-4 w-64 mb-6" />
    <Skeleton v-for="i in 3" :key="i" class="h-32 mb-3" />
  </div>
  <div v-else-if="!property" class="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-24 text-center">
    <p class="font-display-lg text-headline-md text-on-background mb-3">Property not found</p>
    <NuxtLink to="/properties" class="text-primary font-label-ledger text-sm uppercase border-b border-primary pb-0.5"
      >Back to properties</NuxtLink
    >
  </div>
  <div v-else>
    <section class="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop pt-6">
      <p class="font-label-ledger text-xs tracking-[0.12em] uppercase text-outline mb-5">
        <NuxtLink :to="`/properties/${property.slug}`" class="hover:text-primary">{{ property.name }}</NuxtLink>
        / Rooms
      </p>
      <h1 class="font-display-lg text-[clamp(28px,4vw,32px)] text-on-background mb-6">Rooms at {{ property.name }}</h1>

      <div class="border border-outline/20 bg-white p-5 flex flex-wrap gap-5 items-end mb-8">
        <div class="flex flex-col gap-1.5 flex-1 min-w-[140px]">
          <label class="font-label-ledger text-[11px] tracking-[0.14em] uppercase text-secondary">Check in</label>
          <input v-model="checkIn" type="date" class="border-b border-secondary bg-transparent py-1.5 text-body-md" />
        </div>
        <div class="flex flex-col gap-1.5 flex-1 min-w-[140px]">
          <label class="font-label-ledger text-[11px] tracking-[0.14em] uppercase text-secondary">Check out</label>
          <input v-model="checkOut" type="date" :min="checkIn" class="border-b border-secondary bg-transparent py-1.5 text-body-md" />
        </div>
        <div class="flex flex-col gap-1.5 flex-1 min-w-[180px]">
          <label class="font-label-ledger text-[11px] tracking-[0.14em] uppercase text-secondary">Guests</label>
          <div class="border-b border-secondary py-1.5">
            <GuestsPicker v-model:adults="adultsCount" v-model:children="childrenCount" />
          </div>
        </div>
        <p class="font-label-ledger text-xs tracking-[0.1em] uppercase text-outline pb-2">
          {{ nights }} {{ nights === 1 ? "night" : "nights" }}
        </p>
      </div>
    </section>

    <section class="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop pb-24">
      <p v-if="nights < 1" class="text-[13px] text-error mb-4">Check-out must be after check-in.</p>
      <div class="border-t border-outline/20">
        <div
          v-for="r in property.room_types"
          :key="r.id"
          class="border-b border-outline/15 py-6"
          :class="{ 'opacity-60': !fits(r) }"
        >
          <div class="flex flex-wrap gap-5 items-start">
            <img
              :src="r.images[0] || property.cover_image_url"
              :alt="r.name"
              loading="lazy"
              class="w-[168px] h-[118px] object-cover block flex-shrink-0"
            />
            <div class="flex-1 min-w-[220px]">
              <h2 class="font-display-lg text-headline-sm text-on-background mb-1.5">{{ r.name }}</h2>
              <p class="text-[15px] leading-[23px] text-on-surface-variant mb-2 max-w-[52ch]">{{ r.description }}</p>
              <p class="font-label-ledger text-[11px] tracking-[0.1em] uppercase text-outline mb-2">
                Sleeps {{ r.max_occupancy }}
              </p>
              <NuxtLink
                :to="{ path: `/properties/${property.slug}/rooms/${r.id}`, query: detailQuery }"
                class="font-label-ledger text-xs tracking-[0.08em] uppercase text-primary border-b border-primary pb-0.5"
                >View details</NuxtLink
              >
            </div>
            <div class="min-w-[200px] text-right">
              <p v-if="!fits(r)" class="font-label-ledger text-xs uppercase text-error">Too small for {{ guestsCount }} guests</p>
              <p v-else-if="availabilityPending || !availability" class="font-label-ledger text-xs uppercase text-outline">
                Checking availability…
              </p>
              <p v-else-if="minAvailable(r) === null" class="font-label-ledger text-xs uppercase text-outline">
                Unavailable for these dates
              </p>
              <p v-else-if="minAvailable(r)! < 1" class="font-label-ledger text-xs uppercase text-error">Sold out</p>
              <p v-else-if="minAvailable(r)! <= 3" class="font-label-ledger text-xs uppercase" style="color: #c5a059">
                Only {{ minAvailable(r) }} left
              </p>
              <p v-else class="font-label-ledger text-xs uppercase text-outline">Available</p>
            </div>
          </div>

          <div v-if="fits(r) && availability?.[r.id]?.rate_plans?.length" class="mt-5 border-t border-outline/10">
            <button
              v-for="p in availability[r.id]!.rate_plans"
              :key="p.id"
              type="button"
              class="w-full text-left cursor-pointer border-b border-outline/10 py-4 px-1 flex flex-wrap gap-4 items-center hover:bg-surface-container-low transition-colors"
              @click="selectedPlan[r.id] = p.id"
            >
              <span
                class="w-[18px] h-[18px] rounded-full flex-shrink-0"
                :class="planFor(r)?.id === p.id ? 'border-[5px] border-primary bg-surface' : 'border border-outline'"
              />
              <div class="flex-1 min-w-[160px]">
                <p class="font-label-ledger text-sm tracking-[0.06em] uppercase text-on-background mb-1.5">{{ p.name }}</p>
                <div class="flex flex-wrap gap-1.5">
                  <span v-if="p.includes_breakfast" class="bg-brass-tint text-secondary px-2 py-1 rounded-sm text-[11px] font-label-ledger">Breakfast</span>
                  <span class="bg-brass-tint text-secondary px-2 py-1 rounded-sm text-[11px] font-label-ledger">{{
                    p.refundable ? "Free cancellation" : "Non-refundable"
                  }}</span>
                </div>
              </div>
              <div class="text-right">
                <p class="font-price-display text-price-display text-on-background">₹{{ (p.fixed_price * nights).toLocaleString("en-IN") }}</p>
                <p class="font-label-ledger text-[11px] text-outline mt-1">₹{{ p.fixed_price.toLocaleString("en-IN") }} / night</p>
              </div>
            </button>

            <div class="grid gap-2.5 mt-4 max-w-[440px] ml-auto" style="grid-template-columns: repeat(auto-fit, minmax(150px, 1fr))">
              <button
                :disabled="!canReserve(r)"
                class="bg-primary text-on-primary border border-primary cursor-pointer py-3.5 px-3 rounded font-label-ledger text-[13px] tracking-[0.08em] uppercase flex items-center justify-center gap-2 hover:bg-primary-container transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                @click="reserve(r, 'online')"
              >
                <span class="material-symbols-outlined text-[18px]">lock</span>Reserve
              </button>
              <button
                :disabled="!canReserve(r)"
                class="text-[#1B3022] cursor-pointer py-3.5 px-3 rounded font-label-ledger text-[13px] tracking-[0.08em] uppercase flex items-center justify-center gap-2 hover:bg-[#e9dcc2] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                style="background: #f2e8d5; border: 1px solid #c5a059"
                @click="reserve(r, 'whatsapp')"
              >
                <span class="material-symbols-outlined text-[18px]">forum</span>Inquire
              </button>
            </div>
          </div>
          <div v-else-if="fits(r) && availabilityPending" class="mt-5 flex flex-col gap-3">
            <Skeleton v-for="i in 2" :key="i" class="h-14 w-full" />
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
