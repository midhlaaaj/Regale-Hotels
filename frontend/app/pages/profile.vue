<script setup lang="ts">
useSeoMeta({ title: "My Profile — Regale Hotels" });

const guestAuth = useGuestAuthStore();
const { request } = useApi();
const { open: openAuthModal } = useAuthModal();

const name = ref("");
const phone = ref("");
const saving = ref(false);
const error = ref("");
const success = ref(false);

const PHONE_RE = /^\+?[0-9 \-()]{7,20}$/;

watch(
  () => guestAuth.profile,
  (p) => {
    if (p) {
      name.value = p.name;
      phone.value = p.phone;
    }
  },
  { immediate: true }
);

async function save() {
  error.value = "";
  success.value = false;
  if (!name.value.trim()) {
    error.value = "Please enter your name.";
    return;
  }
  if (!PHONE_RE.test(phone.value.trim())) {
    error.value = "Please enter a valid phone number.";
    return;
  }
  saving.value = true;
  try {
    const profile = await request<{ id: number; name: string; email: string; phone: string }>("/api/auth/me", {
      method: "PATCH",
      body: { name: name.value.trim(), phone: phone.value.trim() },
    });
    guestAuth.setProfile(profile);
    success.value = true;
  } catch {
    error.value = "Could not save your changes. Please try again.";
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <div class="max-w-[640px] mx-auto px-margin-mobile md:px-margin-desktop py-12 md:py-16">
    <p class="font-label-ledger text-xs tracking-[0.16em] uppercase mb-3" style="color: #c5a059">Guests</p>
    <h1 class="font-display-lg text-[clamp(36px,6vw,56px)] leading-tight text-on-background mb-8">My profile</h1>

    <div v-if="!guestAuth.isLoggedIn" class="border border-outline/20 bg-white p-6 md:p-8">
      <p class="text-body-md text-on-surface-variant mb-5">Sign in to view and edit your profile.</p>
      <button
        class="bg-primary text-on-primary border-none cursor-pointer px-7 py-3 rounded font-label-ledger text-xs tracking-[0.1em] uppercase hover:bg-primary-container transition-colors"
        @click="openAuthModal('login')"
      >
        Sign in
      </button>
    </div>

    <div v-else class="border border-outline/20 bg-white p-6 md:p-8 max-w-[480px]">
      <div class="flex flex-col gap-1.5 mb-6">
        <label class="font-label-ledger text-[11px] tracking-[0.14em] uppercase text-secondary">Email</label>
        <p class="text-body-md text-on-surface-variant">{{ guestAuth.profile!.email }}</p>
      </div>
      <form class="flex flex-col gap-6" @submit.prevent="save">
        <div class="flex flex-col gap-1.5">
          <label class="font-label-ledger text-[11px] tracking-[0.14em] uppercase text-secondary">Full name</label>
          <input v-model="name" maxlength="120" class="ledger-line bg-transparent py-2 text-body-md" />
        </div>
        <div class="flex flex-col gap-1.5">
          <label class="font-label-ledger text-[11px] tracking-[0.14em] uppercase text-secondary">Phone</label>
          <input v-model="phone" type="tel" maxlength="20" class="ledger-line bg-transparent py-2 text-body-md" />
        </div>
        <button
          type="submit"
          :disabled="saving"
          class="bg-primary text-on-primary border-none cursor-pointer px-7 py-3 rounded font-label-ledger text-xs tracking-[0.1em] uppercase hover:bg-primary-container transition-colors disabled:opacity-50 self-start"
        >
          {{ saving ? "Saving…" : "Save changes" }}
        </button>
        <p v-if="error" class="text-error text-sm -mt-3">{{ error }}</p>
        <p v-if="success" class="text-sm -mt-3" style="color: #2f6b3f">Saved.</p>
      </form>
    </div>
  </div>
</template>
