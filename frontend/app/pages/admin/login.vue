<script setup lang="ts">
definePageMeta({ layout: false });

interface LoginResponse {
  role: "super_admin" | "property_manager";
  property_id: number | null;
  name: string;
}

const { request } = useAdminApi();
const adminAuth = useAdminAuthStore();
const router = useRouter();

const email = ref("");
const password = ref("");
const error = ref("");
const loading = ref(false);

async function submit() {
  loading.value = true;
  error.value = "";
  try {
    const res = await request<LoginResponse>("/api/admin/login", {
      method: "POST",
      body: { email: email.value, password: password.value },
    });
    adminAuth.setSession(res);
    router.push("/admin");
  } catch {
    error.value = "Invalid email or password.";
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="min-h-screen flex items-stretch bg-surface">
    <div class="w-[34%] min-w-[280px] bg-ink-green relative flex flex-col justify-between p-8 hidden md:flex">
      <div>
        <p class="font-display-lg text-[34px] text-surface">Regale</p>
        <p class="font-label-ledger text-[10px] tracking-[0.2em] uppercase mt-1.5" style="color: #c5a059">Operations</p>
      </div>
      <div>
        <p class="font-display-lg text-[22px] italic text-surface-variant mb-5 max-w-[22ch]">Four houses. One ledger.</p>
        <p class="font-label-ledger text-[10px] tracking-[0.12em] uppercase" style="color: #8fa896">Alleppey · Munnar · Kochi · Varkala</p>
      </div>
    </div>

    <div class="flex-1 flex items-center justify-center p-8 md:p-12">
      <div class="w-full max-w-[372px]">
        <h1 class="font-display-lg text-[clamp(28px,3.4vw,36px)] leading-tight text-on-background mb-2.5">Sign in</h1>
        <p class="text-body-md text-on-surface-variant mb-10">Your access is scoped to your role.</p>

        <form class="flex flex-col gap-7" @submit.prevent="submit">
          <div class="flex flex-col gap-1.5">
            <label class="font-label-ledger text-[10px] tracking-[0.16em] uppercase text-outline">Work email</label>
            <input
              v-model="email"
              type="email"
              required
              maxlength="254"
              autocomplete="username"
              class="w-full bg-transparent border-none border-b border-secondary py-2 text-body-md"
            />
          </div>
          <div class="flex flex-col gap-1.5">
            <label class="font-label-ledger text-[10px] tracking-[0.16em] uppercase text-outline">Password</label>
            <input
              v-model="password"
              type="password"
              required
              maxlength="72"
              autocomplete="current-password"
              class="w-full bg-transparent border-none border-b border-secondary py-2 font-label-ledger text-base tracking-[0.24em]"
            />
          </div>

          <button
            type="submit"
            :disabled="loading"
            class="w-full bg-primary text-on-primary border-none cursor-pointer py-3.5 rounded font-label-ledger text-[13px] tracking-[0.1em] uppercase hover:bg-primary-container transition-colors disabled:opacity-50"
          >
            {{ loading ? "Signing in…" : "Sign in" }}
          </button>
          <p v-if="error" class="text-error text-sm -mt-4">{{ error }}</p>
        </form>
      </div>
    </div>
  </div>
</template>
