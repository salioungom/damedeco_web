'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, useRef, Suspense } from 'react';
import { useCartWithProducts } from '@/hooks/useCartWithProducts';
import { useStore } from '@/store/useStore';
import { useAuth } from '@/contexts/AuthContext';
import { CheckoutHeader } from '@/components/checkout/CheckoutHeader';
import { CheckoutFinalize, OrderCheckoutData, CheckoutStage } from '@/components/checkout/CheckoutFinalize';
import { ApiErrorHandler } from '@/lib/error-handler';
import { isNonPayableOrder, resolvePaymentState } from '@/lib/payment-status';
import OrderService, { OrderResponse, OrderItem, ShippingAddress } from '@/services/order.service';
import { CartItemWithProduct } from '@/hooks/useCartWithProducts';
import { Product } from '@/lib/types';
import { Box, Button, CircularProgress, Typography } from '@mui/material';

function orderItemsToCartItems(order: OrderResponse): CartItemWithProduct[] {
  return (order.items || []).map((item: OrderItem) => {
    const product = item.product;
    return {
      id: item.id,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      price_type: 'retail' as const,
      created_at: order.created_at,
      updated_at: order.created_at,
      product: {
        id: String(product.id),
        name: product.name,
        slug: '',
        price: Number(item.unit_price),
        wholesale_price: Number(item.unit_price),
        sku: product.sku,
        inventory_quantity: 0,
        min_order_quantity: 1,
        status: 'active' as const,
        is_featured: false,
        is_new: false,
        category_id: 0,
        cover_image_url: product.cover_image_url,
        images: (product.images || []).map((img) => ({
          id: img.id,
          product_id: String(product.id),
          image_url: img.image_url,
          alt_text: img.alt_text ?? '',
          is_cover: img.is_cover,
          sort_order: 0,
          created_at: order.created_at,
        })),
        created_at: order.created_at,
        updated_at: order.created_at,
      } as Product,
    };
  });
}

function OrderLoadError({ message, onBackToOrders }: { message: string; onBackToOrders: () => void }) {
  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <Box sx={{ textAlign: 'center', maxWidth: 520 }}>
        <Typography variant="h6" fontWeight={700} color="error.main" gutterBottom>
          Commande indisponible
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3, lineHeight: 1.7 }}>
          {message}
        </Typography>
        <Button
          variant="contained"
          size="large"
          onClick={onBackToOrders}
          sx={{ borderRadius: 2, py: 1.2, px: 3, fontWeight: 700 }}
        >
          Retour à mes commandes
        </Button>
      </Box>
    </div>
  );
}

function OrderFinalStateDisplay({
  status,
  wasPaidConfirmed,
  onBackToOrders,
}: {
  status: 'cancelled' | 'refunded';
  wasPaidConfirmed?: boolean;
  onBackToOrders: () => void;
}) {
  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <Box sx={{ textAlign: 'center', maxWidth: 520 }}>
        <Typography variant="h6" fontWeight={700} color="error.main" gutterBottom>
          {status === 'refunded' ? 'Commande remboursée' : 'Commande annulée'}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
          {status === 'refunded'
            ? 'Cette commande a été remboursée et ne peut plus être payée.'
            : 'Cette commande a été annulée et ne peut plus être payée ni relancée.'}
        </Typography>
        {wasPaidConfirmed && (
          <Box
            sx={{
              mt: 2,
              borderRadius: 2,
              bgcolor: 'success.light',
              color: 'success.dark',
              p: 1.5,
              fontSize: '0.875rem',
              fontWeight: 600,
            }}
          >
            Paiement effectué : le montant réglé reste acquis à cette commande.
          </Box>
        )}
        <Button
          variant="contained"
          size="large"
          onClick={onBackToOrders}
          sx={{ borderRadius: 2, py: 1.2, px: 3, fontWeight: 700, mt: 3 }}
        >
          Retour à mes commandes
        </Button>
      </Box>
    </div>
  );
}

function PaymentInProgressDisplay({ orderNumber, onBackToOrders }: { orderNumber: string; onBackToOrders: () => void }) {
  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <Box sx={{ textAlign: 'center', maxWidth: 520 }}>
        <Typography variant="h6" fontWeight={700} color="warning.main" gutterBottom>
          Paiement en cours
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3, lineHeight: 1.7 }}>
          Une session de paiement est déjà en cours pour la commande <strong>{orderNumber}</strong>.
          Sa confirmation est en attente : vous n&apos;avez pas besoin d&apos;en relancer un ici.
        </Typography>
        <Button
          variant="contained"
          size="large"
          onClick={onBackToOrders}
          sx={{ borderRadius: 2, py: 1.2, px: 3, fontWeight: 700 }}
        >
          Retour à mes commandes
        </Button>
      </Box>
    </div>
  );
}

function CheckoutFinalizeInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawOrderId = searchParams.get('orderId');
  // Les identifiants de commande sont numériques ; un orderId invalide ne doit
  // pas être envoyé à l'API (supression du risque de crash / mauvaise commande).
  const hasInvalidOrderId = rawOrderId !== null && !/^\d+$/.test(rawOrderId);
  const orderId = hasInvalidOrderId ? null : rawOrderId;

  const storeCart = useStore((s) => s.cart);
  const { cart: cartWithProducts, loading } = useCartWithProducts();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [stage, setStage] = useState<CheckoutStage>('idle');
  const [error, setError] = useState<string | null>(null);
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  const redirectRef = useRef(false);
  // Garde synchrone : empêche toute double soumission avant le re-render de `isProcessing`.
  const submittingRef = useRef(false);

  const [orderItems, setOrderItems] = useState<CartItemWithProduct[] | null>(null);
  const [orderDetails, setOrderDetails] = useState<OrderResponse | null>(null);
  const [orderFinalState, setOrderFinalState] = useState<'cancelled' | 'refunded' | null>(null);
  const [orderLoading, setOrderLoading] = useState(false);
  // Une session PayTech est live (payment processing) : on ne relance pas de
  // paiement depuis ce formulaire.
  const [paymentBlocked, setPaymentBlocked] = useState(false);
  // Commande annulée/remboursée MAIS payée : afficher « Paiement effectué ».
  const [wasPaidConfirmed, setWasPaidConfirmed] = useState(false);

  const isOrderMode = !!orderId;
  const displayItems = isOrderMode ? (orderItems || []) : cartWithProducts;

  useEffect(() => {
    if (!loading && !initialLoadDone) {
      setInitialLoadDone(true);
    }
  }, [loading, initialLoadDone]);

  useEffect(() => {
    if (isOrderMode && initialLoadDone && !orderFinalState && !orderItems && !orderLoading && !paymentBlocked) {
      const fetchOrder = async () => {
        try {
          setOrderLoading(true);
          const order = await OrderService.getOrderDetails(orderId!);
          // Une commande annulée/remboursée n'est jamais payable : aucun
          // paiement ne doit être initié, aucun bouton de paiement affiché.
          if (isNonPayableOrder(order.status)) {
            setOrderDetails(order);
            setOrderFinalState(order.status === 'refunded' ? 'refunded' : 'cancelled');
            // §6 : commande annulée mais PAYÉE → « Paiement effectué »,
            // jamais « Remboursée » ni nouvelle tentative.
            setWasPaidConfirmed(
              resolvePaymentState({ orderStatus: order.status, paymentStatus: order.payment_status }).state === 'paid'
            );
            return;
          }
          const resolution = resolvePaymentState({ orderStatus: order.status, paymentStatus: order.payment_status });
          // Commande déjà réglée (paid/completed) : rediriger vers la page de retour.
          if (resolution.state === 'paid') {
            redirectRef.current = true;
            router.replace(`/checkout/success?orderId=${orderId}`);
            return;
          }
          // Session PayTech live : ne pas proposer de relancer le paiement.
          if (resolution.state === 'processing') {
            setOrderDetails(order);
            setPaymentBlocked(true);
            return;
          }
          setOrderDetails(order);
          setOrderItems(orderItemsToCartItems(order));
        } catch (err) {
          setError(ApiErrorHandler.getOrderError(err, 'load'));
        } finally {
          setOrderLoading(false);
        }
      };
      fetchOrder();
    }
  }, [isOrderMode, orderId, initialLoadDone, orderFinalState, orderItems, orderLoading, paymentBlocked, router]);

  useEffect(() => {
    if (redirectRef.current || authLoading || !initialLoadDone) return;
    if (!isAuthenticated) {
      redirectRef.current = true;
      router.push(`/login?redirect=/checkout/finalize${orderId ? `?orderId=${orderId}` : ''}`);
      return;
    }
    if (!isOrderMode && storeCart.length === 0) {
      redirectRef.current = true;
      router.push('/cart');
    }
  }, [initialLoadDone, isAuthenticated, authLoading, storeCart.length, router, isOrderMode, orderId]);

  const handlePlaceOrder = async (data: OrderCheckoutData) => {
    // Commande annulée/remboursée : aucun paiement ne peut être initié,
    // quel que soit le contenu du formulaire.
    if (orderFinalState) {
      return;
    }
    // Une session PayTech est déjà live : on ne lance jamais un second paiement.
    if (paymentBlocked) {
      setError('Un paiement est déjà en cours pour cette commande. Attendez sa confirmation avant d\'en relancer un.');
      return;
    }
    // Garde synchrone : deux clics dans la même frame ne créent jamais 2 commandes/paiements.
    if (submittingRef.current) {
      return;
    }
    submittingRef.current = true;
    setIsProcessing(true);
    setError(null);

    // Permet de contextualiser le message d'erreur selon l'étape en cours.
    let phase: 'creating_order' | 'initializing_payment' = 'creating_order';

    try {
      // Reprise d'une commande existante : synchroniser les informations de livraison avant le paiement.
      if (isOrderMode && orderDetails) {
        // Valider les champs obligatoires selon le mode actuel
        if (data.deliveryMode === 'home_delivery') {
          const normalizePhone = (val: string) => {
            let p = val.trim().replace(/\s+/g, '');
            if (!p) return '';
            if (p.startsWith('00221')) p = '+221' + p.slice(5);
            if (!p.startsWith('+221')) p = '+221' + p;
            return p.replace(/[^\d+]/g, '');
          };

          const phoneValid = /^(\+?221)?[73]\d{8}$/.test(data.phone.replace(/\s/g, ''));
          const firstNameValid = data.firstName.trim().length >= 2;
          const lastNameValid = data.lastName.trim().length >= 2;
          const cityValid = data.city.trim().length > 0;
          const addressValid = data.address.trim().length >= 10;

          if (!firstNameValid || !lastNameValid || !phoneValid || !cityValid || !addressValid) {
            setError('Veuillez remplir correctement tous les champs de livraison obligatoires.');
            submittingRef.current = false;
            setStage('idle');
            setIsProcessing(false);
            return;
          }
        }

        // Étape 1 : Synchroniser les informations de livraison avec le backend
        phase = 'initializing_payment';
        setStage('initializing_payment');

        const normalizePhone = (val: string) => {
          let p = val.trim().replace(/\s+/g, '');
          if (!p) return '';
          if (p.startsWith('00221')) p = '+221' + p.slice(5);
          if (!p.startsWith('+221')) p = '+221' + p;
          return p.replace(/[^\d+]/g, '');
        };

        const shippingAddressPayload = data.deliveryMode === 'home_delivery' ? {
          first_name: data.firstName.trim(),
          last_name: data.lastName.trim(),
          email: data.email.trim() || undefined,
          phone: normalizePhone(data.phone),
          city: data.city.trim(),
          address: data.address.trim(),
          instructions: data.instructions?.trim() || undefined,
        } : undefined;

        await OrderService.updateOrderDelivery(
          orderDetails.id,
          data.deliveryMode,
          shippingAddressPayload
        );

        // Étape 2 : Une fois la livraison synchronisée, lancer le paiement
        const paymentResp = await OrderService.initiatePayment(orderDetails.id);
        const redirectUrl = paymentResp?.redirect_url;
        if (!redirectUrl) {
          throw new Error(paymentResp?.message || 'Le paiement n\'a pas fourni d\'URL de redirection');
        }
        setStage('redirecting_to_paytech');
        redirectRef.current = true;
        window.location.href = redirectUrl;
        return;
      }

      if (displayItems.length === 0) {
        throw new Error('Aucun article à valider');
      }

      const normalizePhone = (val: string) => {
        let p = val.trim().replace(/\s+/g, '');
        if (!p) return '';
        if (p.startsWith('00221')) p = '+221' + p.slice(5);
        if (!p.startsWith('+221')) p = '+221' + p;
        return p.replace(/[^\d+]/g, '');
      };

      const mode = data.deliveryMode;

      // Adresse conforme au schéma backend ShippingAddress (first_name, last_name, phone, address).
      const shippingAddress: ShippingAddress = {
        first_name: (data.firstName || '').trim(),
        last_name: (data.lastName || '').trim(),
        phone: normalizePhone(data.phone || ''),
        address: [data.address?.trim(), data.city?.trim()].filter(Boolean).join(', '),
      };

      if (mode === 'home_delivery') {
        if (!shippingAddress.first_name || !shippingAddress.last_name || !shippingAddress.phone || !shippingAddress.address) {
          throw new Error('Veuillez remplir tous les champs de livraison');
        }
      }

      // payment_method est volontairement omis : PayTech détermine le moyen réel,
      // renseigné par le backend après IPN. shipping_address est omis en store_pickup.
      setStage('creating_order');
      const orderResult = await OrderService.createOrderFromCart(
        cartWithProducts,
        mode,
        mode === 'home_delivery' ? shippingAddress : undefined,
      );

      const createdOrderId = orderResult.id ?? orderResult.order_id;
      if (!createdOrderId) {
        throw new Error('Impossible de récupérer l\'identifiant de la commande');
      }

      // Le backend exige order_id et fournit l'URL de redirection PayTech.
      phase = 'initializing_payment';
      setStage('initializing_payment');
      const paymentResp = await OrderService.initiatePayment(createdOrderId);
      const redirectUrl = paymentResp?.redirect_url;
      if (!redirectUrl) {
        throw new Error(paymentResp?.message || 'Le paiement n\'a pas fourni d\'URL de redirection');
      }

      // Ne PAS vider le panier ici : il sera vidé après confirmation backend.
      setStage('redirecting_to_paytech');
      redirectRef.current = true;
      window.location.href = redirectUrl;
    } catch (err) {
      // 403/404 → messages distincts ; timeout/réseau → résultat inconnu (jamais « paiement échoué »).
      setError(ApiErrorHandler.getOrderError(err, phase === 'creating_order' ? 'create' : 'pay'));
      // On ne réarme la garde qu'en cas d'échec : en cas de redirection la page est déchargée.
      submittingRef.current = false;
      setStage('idle');
      setIsProcessing(false);
    }
  };

  if (hasInvalidOrderId) {
    return (
      <OrderLoadError
        message="La référence de commande est invalide. Vérifiez le lien utilisé."
        onBackToOrders={() => router.push('/account/orders')}
      />
    );
  }

  // En reprise de paiement, si la commande est introuvable ou le chargement a échoué,
  // on affiche une erreur claire plutôt qu'un récapitulatif vide.
  if (isOrderMode && !orderLoading && !orderItems && error) {
    return (
      <OrderLoadError
        message={error || 'Impossible de charger les détails de la commande.'}
        onBackToOrders={() => router.push('/account/orders')}
      />
    );
  }

  // Commande annulée/remboursée : jamais de parcours de paiement, juste un
  // état final lisible, sans bouton « Reprendre le paiement ».
  if (isOrderMode && !orderLoading && orderFinalState) {
    return (
      <OrderFinalStateDisplay
        status={orderFinalState}
        wasPaidConfirmed={wasPaidConfirmed}
        onBackToOrders={() => router.push('/account/orders')}
      />
    );
  }

  // Session PayTech live : on n'affiche pas de bouton de paiement.
  if (isOrderMode && !orderLoading && paymentBlocked) {
    return (
      <PaymentInProgressDisplay
        orderNumber={orderDetails?.order_number || ''}
        onBackToOrders={() => router.push(`/account/orders/${orderId}`)}
      />
    );
  }

  if (!initialLoadDone || (isOrderMode && orderLoading)) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress size={48} sx={{ mb: 2 }} />
          <Typography variant="body1" color="text.secondary">
            Chargement de la commande...
          </Typography>
        </Box>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <CheckoutHeader
        activeStep={1}
        onBack={() => isOrderMode ? router.push(`/account/orders/${orderId}`) : router.push('/checkout')}
      />
      <CheckoutFinalize
        items={displayItems}
        onPlaceOrder={handlePlaceOrder}
        isProcessing={isProcessing}
        stage={stage}
        orderMode={isOrderMode}
        error={error}
        serverTotal={isOrderMode && orderDetails ? Number(orderDetails.total_amount) || null : null}
        serverDeliveryFee={
          isOrderMode && orderDetails && orderDetails.shipping_amount != null
            ? Number(orderDetails.shipping_amount)
            : null
        }
        orderDetails={orderDetails}
      />
    </div>
  );
}

export default function CheckoutFinalizePage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress size={48} />
        </Box>
      </div>
    }>
      <CheckoutFinalizeInner />
    </Suspense>
  );
}
