import { useEffect, useRef } from 'react';
import { useStore } from '@/store/useStore';
import { cartService } from '@/services/cart.service';
import { cartLog, cartError } from '@/lib/cart-logger';

export function useCartSync() {
    const user = useStore((s) => s.user);
    const loadCart = useStore((s) => s.loadCart);
    const prevUserRef = useRef(user);

    useEffect(() => {
        const prevUser = prevUserRef.current;
        prevUserRef.current = user;

        const syncCart = async () => {
            if (typeof window === 'undefined') return;

            const justLoggedIn = !prevUser && user;
            if (!justLoggedIn) return;

            const guestSessionId = localStorage.getItem('guest_session_id');
            if (!guestSessionId) return;

            try {
                const { data, error } = await cartService.mergeGuestCart(guestSessionId);
                if (!error && data?.success) {
                    useStore.setState({ sessionId: '' });
                    localStorage.removeItem('guest_session_id');
                    cartLog('Merge guest cart successful', `${data.merged_items} item(s) merged`);
                    await loadCart();
                    await useStore.getState().initGuestSession();
                } else {
                    cartError('Merge guest cart failed', String(error || data?.message));
                }
            } catch (error) {
                cartError('Merge guest cart exception', String(error));
            }
        };

        syncCart();
    }, [user, loadCart]);

    const forceSync = async () => {
        await loadCart();
    };

    return { forceSync };
}
