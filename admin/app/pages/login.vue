<script setup lang="ts">
definePageMeta({ layout: false });

interface LoginResponse {
  access_token: string;
  role: "super_admin" | "property_manager";
  property_id: number | null;
  name: string;
}

const { request } = useApi();
const auth = useAuthStore();
const router = useRouter();

const email = ref("superadmin@regale.in");
const password = ref("regale123");
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
    auth.setSession(res);
    router.push("/");
  } catch {
    error.value = "Invalid email or password.";
  } finally {
    loading.value = false;
  }
}

function fillDemo(role: "super" | "manager") {
  if (role === "super") {
    email.value = "superadmin@regale.in";
  } else {
    email.value = "manager.alleppey@regale.in";
  }
  password.value = "regale123";
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
        <p class="font-label-ledger text-[10px] tracking-[0.12em] uppercase" style="color: #8fa896">Alleppey · Munnar · Delhi · Goa</p>
      </div>
    </div>

    <div class="flex-1 flex items-center justify-center p-8 md:p-12">
      <div class="w-full max-w-[372px]">
        <h1 class="font-display-lg text-[clamp(28px,3.4vw,36px)] leading-tight text-on-background mb-2.5">Sign in</h1>
        <p class="text-body-md text-on-surface-variant mb-10">Your access is scoped to your role.</p>

        <div class="flex flex-col gap-7">
          <div class="flex flex-col gap-1.5">
            <label class="font-label-ledger text-[10px] tracking-[0.16em] uppercase text-outline">Work email</label>
            <input
              v-model="email"
              type="email"
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
              maxlength="72"
              autocomplete="current-password"
              class="w-full bg-transparent border-none border-b border-secondary py-2 font-label-ledger text-base tracking-[0.24em]"
            />
          </div>

          <button
            :disabled="loading"
            class="w-full bg-primary text-on-primary border-none cursor-pointer py-3.5 rounded font-label-ledger text-[13px] tracking-[0.1em] uppercase hover:bg-primary-container transition-colors disabled:opacity-50"
            @click="submit"
          >
            {{ loading ? "Signing in…" : "Sign in" }}
          </button>
          <p v-if="error" class="text-error text-sm -mt-4">{{ error }}</p>

          <div class="border-t border-outline/20 pt-5">
            <p class="font-label-ledger text-[10px] tracking-[0.14em] uppercase text-outline mb-2.5">Demo accounts</p>
            <div class="flex gap-2">
              <button class="flex-1 border border-outline/30 rounded-sm py-2 font-label-ledger text-[11px] uppercase hover:bg-surface-container" @click="fillDemo('super')">
                Super admin
              </button>
              <button class="flex-1 border border-outline/30 rounded-sm py-2 font-label-ledger text-[11px] uppercase hover:bg-surface-container" @click="fillDemo('manager')">
                Property manager
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
