'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { useCartWithProducts } from '@/hooks/useCartWithProducts';
import { useStore } from '@/store/useStore';
import { useAuth } from '@/contexts/AuthContext';
import { CheckoutHeader } from '@/components/checkout/CheckoutHeader';
import { CheckoutRecap } from '@/components/checkout/CheckoutRecap';

export default function CheckoutRecapPage() {
  const router = useRouter();
  const storeCart = useStore((s) => s.cart);
  const { cart: cartWithProducts, loading } = useCartWithProducts();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(false);
  const redirectRef = useRef(false);

  useEffect(() => {
    if (!loading && !initialLoadDone) {
      setInitialLoadDone(true);
    }
  }, [loading, initialLoadDone]);

  useEffect(() => {
    if (initialLoadDone && !redirectRef.current && storeCart.length === 0) {
      redirectRef.current = true;
      router.push('/cart');
    }
  }, [initialLoadDone, storeCart.length, router]);

  if (!initialLoadDone) {
    return null;
  }

  const handleContinue = () => {
    if (isAuthenticated) {
      router.push('/checkout/finalize');
    } else {
      setCheckingAuth(true);
      setTimeout(() => {
        router.push('/login?redirect=/checkout/finalize');
      }, 800);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <CheckoutHeader
        activeStep={0}
        onBack={() => router.push('/cart')}
      />
      <CheckoutRecap
        items={cartWithProducts}
        onContinue={handleContinue}
        onBackToCart={() => router.push('/cart')}
        shippingLoading={false}
        checkingAuth={checkingAuth}
      />
    </div>
  );
}
