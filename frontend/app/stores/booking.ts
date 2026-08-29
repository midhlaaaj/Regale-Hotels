import { defineStore } from "pinia";
import type { Booking, RatePlan, RoomType } from "~/types/api";

interface BookingDraft {
  propertyId: number | null;
  propertySlug: string | null;
  propertyName: string | null;
  roomType: RoomType | null;
  ratePlan: RatePlan | null;
  checkIn: string | null;
  checkOut: string | null;
  guestsCount: number;
  guest: { name: string; email: string; phone: string };
  paymentMethod: "online" | "whatsapp" | null;
  result: Booking | null;
}

export const useBookingStore = defineStore("booking", {
  state: (): BookingDraft => ({
    propertyId: null,
    propertySlug: null,
    propertyName: null,
    roomType: null,
    ratePlan: null,
    checkIn: null,
    checkOut: null,
    guestsCount: 2,
    guest: { name: "", email: "", phone: "" },
    paymentMethod: null,
    result: null,
  }),
  getters: {
    nights(state): number {
      if (!state.checkIn || !state.checkOut) return 0;
      const diff = new Date(state.checkOut).getTime() - new Date(state.checkIn).getTime();
      return Math.max(0, Math.round(diff / (1000 * 60 * 60 * 24)));
    },
    total(state): number {
      if (!state.ratePlan) return 0;
      const diff = this.nights;
      return state.ratePlan.fixed_price * diff;
    },
  },
  actions: {
    startBooking(opts: {
      propertyId: number;
      propertySlug: string;
      propertyName: string;
      roomType: RoomType;
      ratePlan: RatePlan;
      checkIn: string;
      checkOut: string;
      guestsCount: number;
    }) {
      this.propertyId = opts.propertyId;
      this.propertySlug = opts.propertySlug;
      this.propertyName = opts.propertyName;
      this.roomType = opts.roomType;
      this.ratePlan = opts.ratePlan;
      this.checkIn = opts.checkIn;
      this.checkOut = opts.checkOut;
      this.guestsCount = opts.guestsCount;
      this.result = null;
    },
    reset() {
      this.$reset();
    },
  },
});
