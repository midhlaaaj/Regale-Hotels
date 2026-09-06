<script setup lang="ts">
definePageMeta({ layout: "admin", superAdminOnly: true });

import type { Property, RoomType } from "~/types/admin-api";

const { request } = useAdminApi();
const { data: properties, pending, refresh: refreshProperties } = useAsyncData<Property[]>(
  "rooms-properties",
  () => request<Property[]>("/api/properties"),
  { lazy: true }
);

function extractErrorMessage(e: any, fallback: string): string {
  const detail = e?.data?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail) && detail.length) return detail.map((d: any) => d.msg).join(" ");
  return fallback;
}
function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const roomsByProperty = ref<Record<number, RoomType[]>>({});
const loadingRooms = ref<Set<number>>(new Set());
async function loadRooms(propertyId: number) {
  loadingRooms.value.add(propertyId);
  try {
    const detail = await request<Property & { room_types: RoomType[] }>(`/api/properties/${properties.value?.find((p) => p.id === propertyId)?.slug}`);
    roomsByProperty.value[propertyId] = detail.room_types;
  } finally {
    loadingRooms.value.delete(propertyId);
  }
}
watch(
  properties,
  async (props) => {
    for (const p of props ?? []) await loadRooms(p.id);
  },
  { immediate: true }
);

// ---------- Edit existing room type ----------
const editing = ref<Record<number, { name: string; base_price: number }>>({});
function startEdit(room: RoomType) {
  editing.value[room.id] = { name: room.name, base_price: room.base_price };
}
const saveError = ref<Record<number, string>>({});
async function saveEdit(room: RoomType) {
  const patch = editing.value[room.id];
  saveError.value[room.id] = "";
  if (!patch.name.trim()) {
    saveError.value[room.id] = "Name can't be blank.";
    return;
  }
  if (!(patch.base_price > 0)) {
    saveError.value[room.id] = "Price must be greater than 0.";
    return;
  }
  try {
    await request(`/api/admin/room-types/${room.id}`, {
      method: "PATCH",
      body: { name: patch.name.trim(), base_price: patch.base_price },
    });
    delete editing.value[room.id];
    await loadRooms(room.property_id);
  } catch (e: any) {
    saveError.value[room.id] = extractErrorMessage(e, "Could not save changes.");
  }
}

// ---------- New property ----------
const showNewProperty = ref(false);
// Kerala is the default since that's where we operate today, but the field
// stays free text — nothing here blocks onboarding a property in another
// state when the group expands.
const INDIAN_STATE_SUGGESTIONS = ["Kerala", "Goa", "Karnataka", "Tamil Nadu", "Delhi", "Maharashtra", "Rajasthan"];
const newProperty = ref({
  name: "",
  slug: "",
  city: "",
  state: "Kerala",
  description: "",
  cover_image_url: "",
  amenities: "",
});
const slugTouched = ref(false);
watch(
  () => newProperty.value.name,
  (name) => {
    if (!slugTouched.value) newProperty.value.slug = slugify(name);
  }
);
const newPropertyError = ref("");
const savingProperty = ref(false);

async function createProperty() {
  newPropertyError.value = "";
  const p = newProperty.value;
  if (!p.name.trim() || !p.slug.trim() || !p.city.trim() || !p.state.trim() || !p.description.trim() || !p.cover_image_url.trim()) {
    newPropertyError.value = "Fill in every field before creating the property.";
    return;
  }
  savingProperty.value = true;
  try {
    await request("/api/admin/properties", {
      method: "POST",
      body: {
        name: p.name.trim(),
        slug: p.slug.trim(),
        city: p.city.trim(),
        state: p.state.trim(),
        description: p.description.trim(),
        cover_image_url: p.cover_image_url.trim(),
        amenities: p.amenities
          .split(",")
          .map((a) => a.trim())
          .filter(Boolean),
      },
    });
    newProperty.value = { name: "", slug: "", city: "", state: "Kerala", description: "", cover_image_url: "", amenities: "" };
    slugTouched.value = false;
    showNewProperty.value = false;
    await refreshProperties();
  } catch (e: any) {
    newPropertyError.value = extractErrorMessage(e, "Could not create property.");
  } finally {
    savingProperty.value = false;
  }
}

// ---------- New room type ----------
const showNewRoom = ref<number | null>(null);
const newRoom = ref({ name: "", description: "", max_occupancy: 2, base_price: 5000, images: "" });
const newRoomError = ref("");
const savingRoom = ref(false);

function openNewRoom(propertyId: number) {
  showNewRoom.value = propertyId;
  newRoom.value = { name: "", description: "", max_occupancy: 2, base_price: 5000, images: "" };
  newRoomError.value = "";
}

// ---------- Delete ----------
const deleteBusy = ref<number | null>(null);
const deleteError = ref<Record<string, string>>({});

async function deleteProperty(p: Property) {
  if (!confirm(`Delete "${p.name}" and all of its room types? This cannot be undone.`)) return;
  deleteBusy.value = p.id;
  deleteError.value.property = "";
  try {
    await request(`/api/admin/properties/${p.id}`, { method: "DELETE" });
    await refreshProperties();
  } catch (e: any) {
    deleteError.value.property = extractErrorMessage(e, "Could not delete this property — it may have existing bookings.");
  } finally {
    deleteBusy.value = null;
  }
}

async function deleteRoomType(room: RoomType) {
  if (!confirm(`Delete "${room.name}"? This cannot be undone.`)) return;
  deleteBusy.value = room.id;
  deleteError.value[room.id] = "";
  try {
    await request(`/api/admin/room-types/${room.id}`, { method: "DELETE" });
    if (managing.value === room.id) managing.value = null;
    await loadRooms(room.property_id);
  } catch (e: any) {
    deleteError.value[room.id] = extractErrorMessage(e, "Could not delete this room type — it may have existing bookings.");
  } finally {
    deleteBusy.value = null;
  }
}

// ---------- Manage rate plans / availability ----------
const managing = ref<number | null>(null);

async function createRoomType(propertyId: number) {
  newRoomError.value = "";
  const r = newRoom.value;
  if (!r.name.trim() || !r.description.trim()) {
    newRoomError.value = "Name and description are required.";
    return;
  }
  if (!(r.max_occupancy > 0) || !(r.base_price > 0)) {
    newRoomError.value = "Occupancy and price must be greater than 0.";
    return;
  }
  savingRoom.value = true;
  try {
    await request("/api/admin/room-types", {
      method: "POST",
      body: {
        property_id: propertyId,
        name: r.name.trim(),
        description: r.description.trim(),
        max_occupancy: r.max_occupancy,
        base_price: r.base_price,
        images: r.images
          .split(",")
          .map((i) => i.trim())
          .filter(Boolean),
      },
    });
    showNewRoom.value = null;
    await loadRooms(propertyId);
  } catch (e: any) {
    newRoomError.value = extractErrorMessage(e, "Could not create room type.");
  } finally {
    savingRoom.value = false;
  }
}
</script>

<template>
  <div>
    <div class="flex justify-between items-start flex-wrap gap-4 mb-8">
      <div>
        <h1 class="font-display-lg text-headline-md text-on-background mb-1.5">Rooms & Rates</h1>
        <p class="text-body-md text-on-surface-variant">Room types and base pricing across all properties.</p>
      </div>
      <button
        class="bg-primary text-white border-none cursor-pointer px-5 py-2.5 rounded-sm font-label-ledger text-xs uppercase flex-shrink-0"
        @click="showNewProperty = !showNewProperty"
      >
        {{ showNewProperty ? "Cancel" : "+ New property" }}
      </button>
    </div>

    <div v-if="showNewProperty" class="border border-outline/20 bg-white p-6 mb-8 max-w-[640px]">
      <h2 class="font-label-ledger text-xs tracking-[0.1em] uppercase text-outline mb-4">New property</h2>
      <div class="grid gap-4 sm:grid-cols-2 mb-4">
        <input v-model="newProperty.name" placeholder="Property name" maxlength="150" class="border-b border-secondary bg-transparent py-2" />
        <input
          v-model="newProperty.slug"
          placeholder="url-slug"
          maxlength="150"
          class="border-b border-secondary bg-transparent py-2 font-label-ledger text-sm"
          @input="slugTouched = true"
        />
        <input v-model="newProperty.city" placeholder="City" maxlength="100" class="border-b border-secondary bg-transparent py-2" />
        <input
          v-model="newProperty.state"
          placeholder="State"
          maxlength="100"
          list="state-suggestions"
          class="border-b border-secondary bg-transparent py-2"
        />
        <datalist id="state-suggestions">
          <option v-for="s in INDIAN_STATE_SUGGESTIONS" :key="s" :value="s" />
        </datalist>
        <input
          v-model="newProperty.cover_image_url"
          placeholder="Cover image URL"
          maxlength="2000"
          class="border-b border-secondary bg-transparent py-2 sm:col-span-2"
        />
        <textarea
          v-model="newProperty.description"
          placeholder="Description"
          rows="3"
          maxlength="4000"
          class="border-b border-secondary bg-transparent py-2 sm:col-span-2 resize-y"
        />
        <input
          v-model="newProperty.amenities"
          placeholder="Amenities, comma separated (e.g. Pool, Breakfast, Spa)"
          class="border-b border-secondary bg-transparent py-2 sm:col-span-2"
        />
      </div>
      <button
        :disabled="savingProperty"
        class="bg-primary text-white border-none cursor-pointer px-5 py-2.5 rounded-sm font-label-ledger text-xs uppercase disabled:opacity-50"
        @click="createProperty"
      >
        {{ savingProperty ? "Creating…" : "Create property" }}
      </button>
      <p v-if="newPropertyError" class="text-error text-sm mt-3">{{ newPropertyError }}</p>
    </div>

    <div v-if="pending">
      <div v-for="i in 2" :key="i" class="mb-8">
        <Skeleton class="h-3 w-32 mb-3" />
        <div class="border border-outline/20 bg-white p-5">
          <Skeleton v-for="j in 2" :key="j" class="h-10 w-full mb-2" />
        </div>
      </div>
    </div>

    <template v-else>
      <div v-for="p in properties" :key="p.id" class="mb-10">
        <div class="flex justify-between items-center mb-3">
          <h2 class="font-label-ledger text-xs tracking-[0.1em] uppercase text-outline">{{ p.name }}</h2>
          <div class="flex items-center gap-2">
            <button
              class="text-xs font-label-ledger uppercase text-secondary border border-outline/25 rounded-sm px-2.5 py-1.5"
              @click="showNewRoom === p.id ? (showNewRoom = null) : openNewRoom(p.id)"
            >
              {{ showNewRoom === p.id ? "Cancel" : "+ Add room type" }}
            </button>
            <button
              :disabled="deleteBusy === p.id"
              class="text-xs font-label-ledger uppercase text-error border border-error/40 rounded-sm px-2.5 py-1.5 disabled:opacity-40"
              @click="deleteProperty(p)"
            >
              Delete property
            </button>
          </div>
        </div>
        <p v-if="deleteError.property" class="text-error text-xs mb-2">{{ deleteError.property }}</p>

        <div v-if="showNewRoom === p.id" class="border border-outline/20 bg-white p-5 mb-3">
          <div class="grid gap-4 sm:grid-cols-2 mb-4">
            <input v-model="newRoom.name" placeholder="Room name" maxlength="150" class="border-b border-secondary bg-transparent py-2" />
            <div class="flex items-center gap-2">
              <label class="font-label-ledger text-[11px] uppercase text-outline flex-shrink-0">Sleeps</label>
              <input v-model.number="newRoom.max_occupancy" type="number" min="1" max="20" class="border-b border-secondary bg-transparent py-2 w-full" />
            </div>
            <input
              v-model.number="newRoom.base_price"
              type="number"
              min="1"
              max="1000000"
              placeholder="Base price / night"
              class="border-b border-secondary bg-transparent py-2"
            />
            <input v-model="newRoom.images" placeholder="Image URLs, comma separated" class="border-b border-secondary bg-transparent py-2" />
            <textarea
              v-model="newRoom.description"
              placeholder="Description"
              rows="2"
              maxlength="4000"
              class="border-b border-secondary bg-transparent py-2 sm:col-span-2 resize-y"
            />
          </div>
          <button
            :disabled="savingRoom"
            class="bg-secondary text-white border-none cursor-pointer px-4 py-2 rounded-sm font-label-ledger text-xs uppercase disabled:opacity-50"
            @click="createRoomType(p.id)"
          >
            {{ savingRoom ? "Creating…" : "Create room type" }}
          </button>
          <p v-if="newRoomError" class="text-error text-sm mt-3">{{ newRoomError }}</p>
        </div>

        <div class="border border-outline/20 bg-white overflow-x-auto">
          <table class="w-full text-sm min-w-[560px]">
            <thead>
              <tr class="border-b border-outline/20 font-label-ledger text-[11px] uppercase text-outline">
                <th class="px-5 py-3 text-left">Room type</th>
                <th class="px-5 py-3 text-left">Sleeps</th>
                <th class="px-5 py-3 text-right">Base price / night</th>
                <th class="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody v-if="loadingRooms.has(p.id)">
              <tr v-for="j in 2" :key="j" class="border-b border-outline/10 last:border-0">
                <td class="px-5 py-3"><Skeleton class="h-4 w-32" /></td>
                <td class="px-5 py-3"><Skeleton class="h-4 w-8" /></td>
                <td class="px-5 py-3 text-right"><Skeleton class="h-4 w-16 ml-auto" /></td>
                <td class="px-5 py-3 text-right"><Skeleton class="h-6 w-12 ml-auto" /></td>
              </tr>
            </tbody>
            <tbody v-else>
              <template v-for="r in roomsByProperty[p.id]" :key="r.id">
                <tr class="border-b border-outline/10 last:border-0">
                  <td class="px-5 py-3">
                    <input v-if="editing[r.id]" v-model="editing[r.id].name" maxlength="150" class="border-b border-secondary bg-transparent" />
                    <span v-else>{{ r.name }}</span>
                  </td>
                  <td class="px-5 py-3">{{ r.max_occupancy }}</td>
                  <td class="px-5 py-3 text-right">
                    <input
                      v-if="editing[r.id]"
                      v-model.number="editing[r.id].base_price"
                      type="number"
                      min="1"
                      max="1000000"
                      step="1"
                      class="border-b border-secondary bg-transparent w-24 text-right"
                    />
                    <span v-else class="font-price-display">₹{{ r.base_price.toLocaleString("en-IN") }}</span>
                  </td>
                  <td class="px-5 py-3 text-right whitespace-nowrap">
                    <button
                      v-if="!editing[r.id]"
                      class="text-xs font-label-ledger uppercase text-secondary border border-outline/25 rounded-sm px-2.5 py-1.5 mr-1.5"
                      @click="startEdit(r)"
                    >
                      Edit
                    </button>
                    <button
                      v-else
                      class="text-xs font-label-ledger uppercase text-white bg-secondary border-none rounded-sm px-2.5 py-1.5 mr-1.5"
                      @click="saveEdit(r)"
                    >
                      Save
                    </button>
                    <button
                      class="text-xs font-label-ledger uppercase text-secondary border border-outline/25 rounded-sm px-2.5 py-1.5 mr-1.5"
                      @click="managing = managing === r.id ? null : r.id"
                    >
                      {{ managing === r.id ? "Close" : "Manage" }}
                    </button>
                    <button
                      :disabled="deleteBusy === r.id"
                      class="text-xs font-label-ledger uppercase text-error border border-error/40 rounded-sm px-2.5 py-1.5 disabled:opacity-40"
                      @click="deleteRoomType(r)"
                    >
                      Delete
                    </button>
                    <p v-if="saveError[r.id]" class="text-error text-xs mt-1.5">{{ saveError[r.id] }}</p>
                    <p v-if="deleteError[r.id]" class="text-error text-xs mt-1.5">{{ deleteError[r.id] }}</p>
                  </td>
                </tr>
                <tr v-if="managing === r.id" class="border-b border-outline/10 last:border-0 bg-surface-container-low">
                  <td colspan="4" class="px-5 py-5">
                    <div class="grid gap-6 lg:grid-cols-2">
                      <RatePlansPanel :room-type-id="r.id" />
                      <AvailabilityPanel :room-type-id="r.id" />
                    </div>
                  </td>
                </tr>
              </template>
              <tr v-if="roomsByProperty[p.id]?.length === 0">
                <td colspan="4" class="px-5 py-8 text-center text-on-surface-variant">No room types yet.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>
  </div>
</template>
