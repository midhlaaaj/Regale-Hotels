<script setup lang="ts">
import type { Property, RoomAvailability, RoomType } from "~/types/api";

const route = useRoute();
const router = useRouter();
const slug = route.params.slug as string;
const roomId = Number(route.params.roomId);
const { request } = useApi();

const { data: property, pending: propertyPending } = useAsyncData(
  `room-property-${slug}`,
  () => request<Property>(`/api/properties/${slug}`),
  { lazy: true }
);

const room = computed<RoomType | undefined>(() =>
  property.value?.room_types?.find((r) => r.id === roomId)
);
const notFound = computed(() => !propertyPending.value && (!property.value || !room.value));

useSeoMeta({
  title: () => `${room.value?.name} — ${property.value?.name}`,
  description: () => room.value?.description,
});

const today = new Date();
const in7 = new Date(today.getTime() + 7 * 86400000);
const in9 = new Date(today.getTime() + 9 * 86400000);
const toISO = (d: Date) => d.toISOString().slice(0, 10);

// Prefill from the guest's search (homepage/properties list) when they arrived with one.
const checkIn = ref((route.query.check_in as string) || toISO(in7));
const checkOut = ref((route.query.check_out as string) || toISO(in9));
const guestsCount = ref(Number(route.query.guests) || 2);

watchEffect(() => {
  if (room.value && guestsCount.value > room.value.max_occupancy) {
    guestsCount.value = room.value.max_occupancy;
  }
});

const { data: availability, pending: availabilityPending } = useAsyncData<RoomAvailability>(
  `room-availability-${roomId}`,
  () => request<RoomAvailability>(`/api/room-types/${roomId}/availability?checkin=${checkIn.value}&checkout=${checkOut.value}`),
  { lazy: true, watch: [checkIn, checkOut] }
);

const nights = computed(() => {
  const diff = new Date(checkOut.value).getTime() - new Date(checkIn.value).getTime();
  return Math.max(0, Math.round(diff / 86400000));
});

const selectedRatePlanId = ref<number | null>(null);
watchEffect(() => {
  if (availability.value?.rate_plans?.length && !selectedRatePlanId.value) {
    selectedRatePlanId.value = availability.value.rate_plans[0].id;
  }
});
const selectedRatePlan = computed(() =>
  availability.value?.rate_plans.find((r) => r.id === selectedRatePlanId.value)
);
const total = computed(() => (selectedRatePlan.value ? selectedRatePlan.value.fixed_price * nights.value : 0));
const minAvailable = computed(() =>
  availability.value?.days.length ? Math.min(...availability.value.days.map((d) => d.rooms_available)) : 0
);

const bookingStore = useBookingStore();
function proceed(method: "online" | "whatsapp") {
  if (!property.value || !room.value || !selectedRatePlan.value) return;
  bookingStore.startBooking({
    propertyId: property.value.id,
    propertySlug: property.value.slug,
    propertyName: property.value.name,
    roomType: room.value,
    ratePlan: selectedRatePlan.value,
    checkIn: checkIn.value,
    checkOut: checkOut.value,
    guestsCount: guestsCount.value,
  });
  bookingStore.paymentMethod = method;
  router.push("/booking/details");
}
</script>

<template>
  <div v-if="propertyPending" class="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop pt-8">
    <Skeleton class="h-4 w-64 mb-6" />
    <Skeleton rounded="rounded-none" class="h-[320px] w-full mb-10" />
    <div class="grid gap-8 md:gap-16 items-start" style="grid-template-columns: repeat(auto-fit, minmax(320px, 1fr))">
      <div>
        <Skeleton class="h-10 w-2/3 mb-5" />
        <Skeleton class="h-4 w-full mb-2" />
        <Skeleton class="h-4 w-5/6 mb-8" />
        <Skeleton class="h-20 w-full mb-8" />
        <Skeleton class="h-40 w-full" />
      </div>
      <Skeleton class="h-80" />
    </div>
  </div>
  <div v-else-if="notFound" class="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-24 text-center">
    <p class="font-display-lg text-headline-md text-on-background mb-3">Room not found</p>
    <NuxtLink to="/properties" class="text-primary font-label-ledger text-sm uppercase border-b border-primary pb-0.5"
      >Back to properties</NuxtLink
    >
  </div>
  <div v-else-if="property && room">
    <section class="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop pt-6">
      <NuxtLink :to="`/properties/${property.slug}`" class="font-label-ledger text-xs tracking-[0.12em] uppercase text-outline">
        ← {{ property.name }} / Rooms / {{ room.name }}
      </NuxtLink>
    </section>

    <section class="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop pt-5">
      <div class="flex gap-2 overflow-x-auto pb-2" style="scroll-snap-type: x mandatory">
        <img
          v-for="(img, i) in room.images.length ? room.images : [property.cover_image_url]"
          :key="i"
          :src="img"
          :alt="`${room.name} — photo ${i + 1}`"
          class="h-[clamp(240px,42vw,460px)] min-w-[82%] flex-1 object-cover block"
          style="scroll-snap-align: start"
        />
      </div>
    </section>

    <section class="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop pt-8 md:pt-14 grid gap-8 md:gap-16 items-start" style="grid-template-columns: repeat(auto-fit, minmax(320px, 1fr))">
      <div>
        <h1 class="font-display-lg text-[clamp(34px,5vw,48px)] leading-[1.1] text-on-background mb-5">{{ room.name }}</h1>
        <p class="text-body-lg text-on-surface-variant mb-8">{{ room.description }}</p>

        <div class="border-y border-outline/20 py-6 grid gap-6" style="grid-template-columns: repeat(auto-fit, minmax(140px, 1fr))">
          <div class="flex gap-2.5 items-start">
            <span class="material-symbols-outlined text-secondary text-xl">group</span>
            <div>
              <p class="font-label-ledger text-[11px] tracking-[0.12em] uppercase text-outline mb-1">Sleeps</p>
              <p class="text-[15px] text-on-background">{{ room.max_occupancy }} guests</p>
            </div>
          </div>
          <div class="flex gap-2.5 items-start">
            <span class="material-symbols-outlined text-secondary text-xl">calendar_month</span>
            <div>
              <p class="font-label-ledger text-[11px] tracking-[0.12em] uppercase text-outline mb-1">Nights</p>
              <p class="text-[15px] text-on-background">{{ nights }}</p>
            </div>
          </div>
          <div class="flex gap-2.5 items-start">
            <span class="material-symbols-outlined text-secondary text-xl">door_front</span>
            <div>
              <p class="font-label-ledger text-[11px] tracking-[0.12em] uppercase text-outline mb-1">Availability</p>
              <p class="text-[15px] text-on-background">{{ minAvailable }} rooms open</p>
            </div>
          </div>
        </div>

        <h2 class="font-display-lg text-headline-md text-on-background mt-11 mb-1.5">Rate plans</h2>
        <p class="text-[15px] text-on-surface-variant mb-5">{{ nights }} nights. Prices per stay, excluding 12% GST.</p>
        <div v-if="availabilityPending" class="border-t border-outline/20 py-5 flex flex-col gap-3">
          <Skeleton v-for="i in 2" :key="i" class="h-16 w-full" />
        </div>
        <div v-else class="border-t border-outline/20">
          <button
            v-for="r in availability?.rate_plans"
            :key="r.id"
            class="w-full text-left cursor-pointer border-b py-5 px-1 flex gap-4 items-start hover:bg-surface-container-low transition-colors"
            style="border-color: #4d6453"
            @click="selectedRatePlanId = r.id"
          >
            <span
              class="w-[18px] h-[18px] rounded-full flex-shrink-0 mt-1"
              :class="r.id === selectedRatePlanId ? 'border-[5px] border-primary bg-surface' : 'border border-outline'"
            />
            <div class="flex-1 min-w-[180px]">
              <p class="font-label-ledger text-sm tracking-[0.06em] uppercase text-on-background mb-1.5">{{ r.name }}</p>
              <div class="flex flex-wrap gap-1.5">
                <span v-if="r.includes_breakfast" class="bg-brass-tint text-secondary px-2 py-1 rounded-sm text-[11px] font-label-ledger">Breakfast</span>
                <span class="bg-brass-tint text-secondary px-2 py-1 rounded-sm text-[11px] font-label-ledger">{{
                  r.refundable ? "Free cancellation" : "Non-refundable"
                }}</span>
              </div>
            </div>
            <div class="text-right min-w-[120px]">
              <p class="font-price-display text-price-display text-on-background">₹{{ (r.fixed_price * nights).toLocaleString("en-IN") }}</p>
              <p class="font-label-ledger text-[11px] text-outline mt-1">₹{{ r.fixed_price.toLocaleString("en-IN") }} / night</p>
            </div>
          </button>
        </div>

        <h2 class="font-display-lg text-headline-md text-on-background mt-11 mb-1.5">Dates</h2>
        <div class="border border-outline/20 bg-white p-5 max-w-[440px] flex gap-4">
          <div class="flex flex-col gap-1.5 flex-1">
            <label class="font-label-ledger text-[11px] tracking-[0.14em] uppercase text-secondary">Check in</label>
            <input v-model="checkIn" type="date" class="border-b border-secondary bg-transparent py-1.5 text-body-md" />
          </div>
          <div class="flex flex-col gap-1.5 flex-1">
            <label class="font-label-ledger text-[11px] tracking-[0.14em] uppercase text-secondary">Check out</label>
            <input v-model="checkOut" type="date" class="border-b border-secondary bg-transparent py-1.5 text-body-md" />
          </div>
        </div>
      </div>

      <div class="border border-outline/20 bg-white shadow-[4px_4px_0px_rgba(27,48,34,0.05)] p-7 sticky top-[130px]">
        <p class="font-label-ledger text-[11px] tracking-[0.14em] uppercase text-outline mb-3.5">Your selection</p>
        <div class="flex flex-col gap-2.5 border-b border-outline/20 pb-4">
          <div class="flex justify-between gap-3 font-label-ledger text-[13px] text-on-surface-variant">
            <span>Room</span><span class="text-on-background text-right">{{ room.name }}</span>
          </div>
          <div class="flex justify-between gap-3 font-label-ledger text-[13px] text-on-surface-variant">
            <span>Dates</span><span class="text-on-background text-right">{{ checkIn }} → {{ checkOut }}</span>
          </div>
          <div class="flex justify-between gap-3 font-label-ledger text-[13px] text-on-surface-variant">
            <span>Guests</span>
            <span class="text-on-background text-right">
              <select v-model.number="guestsCount" class="bg-transparent text-right">
                <option v-for="n in room.max_occupancy" :key="n" :value="n">{{ n }}</option>
              </select>
            </span>
          </div>
          <div class="flex justify-between gap-3 font-label-ledger text-[13px] text-on-surface-variant">
            <span>Rate plan</span><span class="text-on-background text-right">{{ selectedRatePlan?.name }}</span>
          </div>
        </div>
        <div class="flex justify-between pt-4 font-label-ledger text-lg font-bold text-on-background">
          <span>TOTAL</span><span>₹{{ total.toLocaleString("en-IN") }}</span>
        </div>
        <div class="grid gap-2.5 mt-6" style="grid-template-columns: repeat(auto-fit, minmax(150px, 1fr))">
          <button
            :disabled="!selectedRatePlan || minAvailable < 1"
            class="bg-primary text-on-primary border border-primary cursor-pointer py-4 px-3 rounded font-label-ledger text-[13px] tracking-[0.08em] uppercase flex items-center justify-center gap-2 min-h-[54px] hover:bg-primary-container transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            @click="proceed('online')"
          >
            <span class="material-symbols-outlined text-[18px]">lock</span>Pay online
          </button>
          <button
            :disabled="!selectedRatePlan"
            class="text-[#1B3022] cursor-pointer py-4 px-3 rounded font-label-ledger text-[13px] tracking-[0.08em] uppercase flex items-center justify-center gap-2 min-h-[54px] hover:bg-[#e9dcc2] transition-colors disabled:opacity-40"
            style="background: #f2e8d5; border: 1px solid #c5a059"
            @click="proceed('whatsapp')"
          >
            <span class="material-symbols-outlined text-[18px]">forum</span>Inquire on WhatsApp
          </button>
        </div>
        <p class="text-[13px] leading-5 text-outline mt-3.5 text-center">
          Both routes reach the same on-site team. WhatsApp holds the room for 12 hours.
        </p>
        <p v-if="minAvailable < 1" class="text-[13px] text-error mt-2 text-center">No rooms available for these dates.</p>
      </div>
    </section>
    <div class="h-24" />
  </div>
</template>
