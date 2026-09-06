<script setup lang="ts">
const { isOpen, initialMode, close } = useAuthModal();
const { request } = useApi();
const guestAuth = useGuestAuthStore();

const mode = ref<"login" | "signup">("login");
watch(isOpen, (open) => {
  if (open) {
    mode.value = initialMode.value;
    error.value = "";
    name.value = "";
    email.value = "";
    password.value = "";
  }
});

const name = ref("");
const email = ref("");
const password = ref("");
const error = ref("");
const loading = ref(false);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function extractErrorMessage(e: any, fallback: string): string {
  const detail = e?.data?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail) && detail.length) return detail.map((d: any) => d.msg).join(" ");
  return fallback;
}

async function submit() {
  error.value = "";
  if (!EMAIL_RE.test(email.value.trim())) {
    error.value = "Please enter a valid email address.";
    return;
  }
  if (password.value.length < 8) {
    error.value = "Password must be at least 8 characters.";
    return;
  }
  if (mode.value === "signup" && !name.value.trim()) {
    error.value = "Please enter your name.";
    return;
  }

  loading.value = true;
  try {
    const profile = await request<{ id: number; name: string; email: string; phone: string }>(
      mode.value === "signup" ? "/api/auth/signup" : "/api/auth/login",
      {
        method: "POST",
        body:
          mode.value === "signup"
            ? { name: name.value.trim(), email: email.value.trim(), password: password.value }
            : { email: email.value.trim(), password: password.value },
      }
    );
    guestAuth.setProfile(profile);
    close();
  } catch (e: any) {
    error.value = extractErrorMessage(
      e,
      mode.value === "signup" ? "Could not create an account. Please try again." : "Invalid email or password."
    );
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-[100] bg-ink-green/50 backdrop-blur-sm flex items-center justify-center px-margin-mobile"
    @click.self="close"
  >
    <div class="w-full max-w-[420px] bg-surface border border-outline/20 p-7 md:p-9 relative">
      <button
        class="absolute top-4 right-4 bg-transparent border-none cursor-pointer text-outline hover:text-on-background"
        aria-label="Close"
        @click="close"
      >
        <span class="material-symbols-outlined text-[22px]">close</span>
      </button>

      <h2 class="font-display-lg text-[28px] leading-tight text-on-background mb-1.5">
        {{ mode === "login" ? "Sign in" : "Create an account" }}
      </h2>
      <p class="text-body-md text-on-surface-variant mb-7">
        {{ mode === "login" ? "Access your bookings and profile." : "Save your details for faster checkout." }}
      </p>

      <form class="flex flex-col gap-5" @submit.prevent="submit">
        <div v-if="mode === 'signup'" class="flex flex-col gap-1.5">
          <label class="font-label-ledger text-[11px] tracking-[0.14em] uppercase text-secondary">Full name</label>
          <input v-model="name" maxlength="120" class="ledger-line bg-transparent py-2 text-body-md" />
        </div>
        <div class="flex flex-col gap-1.5">
          <label class="font-label-ledger text-[11px] tracking-[0.14em] uppercase text-secondary">Email</label>
          <input v-model="email" type="email" maxlength="254" autocomplete="username" class="ledger-line bg-transparent py-2 text-body-md" />
        </div>
        <div class="flex flex-col gap-1.5">
          <label class="font-label-ledger text-[11px] tracking-[0.14em] uppercase text-secondary">Password</label>
          <input
            v-model="password"
            type="password"
            maxlength="72"
            :autocomplete="mode === 'login' ? 'current-password' : 'new-password'"
            class="ledger-line bg-transparent py-2 text-body-md"
          />
        </div>

        <button
          type="submit"
          :disabled="loading"
          class="w-full mt-1 bg-primary text-on-primary border-none cursor-pointer py-3.5 rounded font-label-ledger text-[13px] tracking-[0.1em] uppercase hover:bg-primary-container transition-colors disabled:opacity-50"
        >
          {{ loading ? "Please wait…" : mode === "login" ? "Sign in" : "Create account" }}
        </button>
        <p v-if="error" class="text-error text-sm -mt-2">{{ error }}</p>
      </form>

      <p class="text-sm text-on-surface-variant mt-6 text-center">
        <template v-if="mode === 'login'">
          New here?
          <button class="bg-transparent border-none cursor-pointer text-primary underline p-0 font-inherit" @click="mode = 'signup'">
            Create an account
          </button>
        </template>
        <template v-else>
          Already have an account?
          <button class="bg-transparent border-none cursor-pointer text-primary underline p-0 font-inherit" @click="mode = 'login'">
            Sign in
          </button>
        </template>
      </p>
    </div>
  </div>
</template>
