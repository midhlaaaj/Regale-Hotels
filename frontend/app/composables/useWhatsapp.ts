export function useWhatsapp() {
  const config = useRuntimeConfig();

  function link(message?: string): string {
    const number = config.public.whatsappNumber as string;
    return message ? `https://wa.me/${number}?text=${encodeURIComponent(message)}` : `https://wa.me/${number}`;
  }

  return { link };
}
