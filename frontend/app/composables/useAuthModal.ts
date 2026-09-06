const isOpen = ref(false);
const initialMode = ref<"login" | "signup">("login");

export function useAuthModal() {
  function open(mode: "login" | "signup" = "login") {
    initialMode.value = mode;
    isOpen.value = true;
  }
  function close() {
    isOpen.value = false;
  }
  return { isOpen, initialMode, open, close };
}
