// Lets a page hide the global floating WhatsApp button while one of its own
// sections already offers an equivalent WhatsApp action in view — on mobile
// the fixed bubble otherwise sits directly on top of that inline button.
export function useFabVisibility() {
  return useState("fab-visible", () => true);
}
