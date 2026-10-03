import { create } from 'zustand';
import type { DeliveryMode, PaymentMethod } from '@/lib/delivery';

interface CheckoutState {
  deliveryMode: DeliveryMode;
  deliveryFee: number;
  estimatedDays: string;
  selectedAddressId: number | null;
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  city: string;
  specialInstructions: string;
  selectedPaymentMethod: PaymentMethod | null;

  setDeliveryMode: (mode: DeliveryMode) => void;
  setDeliveryFee: (fee: number) => void;
  setEstimatedDays: (days: string) => void;
  setSelectedAddressId: (id: number | null) => void;
  setShippingInfo: (info: Partial<Pick<CheckoutState, 'firstName' | 'lastName' | 'phone' | 'address' | 'city' | 'specialInstructions'>>) => void;
  setSelectedPaymentMethod: (method: PaymentMethod | null) => void;
  resetCheckout: () => void;
}

const initialState = {
  deliveryMode: 'home_delivery' as const,
  deliveryFee: 0,
  estimatedDays: '',
  selectedAddressId: null,
  firstName: '',
  lastName: '',
  phone: '',
  address: '',
  city: '',
  specialInstructions: '',
  selectedPaymentMethod: null,
};

export const useCheckoutStore = create<CheckoutState>()((set) => ({
  ...initialState,

  setDeliveryMode: (mode) => set({ deliveryMode: mode }),
  setDeliveryFee: (fee) => set({ deliveryFee: fee }),
  setEstimatedDays: (days) => set({ estimatedDays: days }),
  setSelectedAddressId: (id) => set({ selectedAddressId: id }),
  setShippingInfo: (info) => set((state) => ({ ...state, ...info })),
  setSelectedPaymentMethod: (method) => set({ selectedPaymentMethod: method }),
  resetCheckout: () => set(initialState),
}));
