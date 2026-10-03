'use client';

import { ShopPage } from '@/components/ShopPage';
import { useStore } from '@/store/useStore';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function ShopContent() {
    const addToCart = useStore((s) => s.addToCart);
    const userType = useStore((s) => s.userType);
    const favorites = useStore((s) => s.favorites);
    const toggleFavorite = useStore((s) => s.toggleFavorite);
    const router = useRouter();
    const searchParams = useSearchParams();
    const initialCategory = searchParams.get('category') || undefined;
    const searchQuery = searchParams.get('q') || undefined;

    return (
        <ShopPage
            onAddToCart={addToCart}
            onViewProduct={(product) => router.push(`/product/${product.id}`)}
            userType={userType}
            initialCategory={initialCategory}
            searchQuery={searchQuery}
            favorites={favorites}
            onToggleFavorite={toggleFavorite}
        />
    );
}

export default function Page() {
    return (
        <Suspense fallback={<div>Chargement...</div>}>
            <ShopContent />
        </Suspense>
    );
}
