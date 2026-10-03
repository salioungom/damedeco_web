import { describe, it, expect } from 'vitest';
import OrderService from '../order.service';

describe('OrderService.getPaymentStatusLabel', () => {
  it('mappe les statuts de paiement connus', () => {
    expect(OrderService.getPaymentStatusLabel('pending')).toBe('En attente');
    expect(OrderService.getPaymentStatusLabel('processing')).toBe('En traitement');
    expect(OrderService.getPaymentStatusLabel('paid')).toBe('Payé');
    expect(OrderService.getPaymentStatusLabel('failed')).toBe('Échoué');
    expect(OrderService.getPaymentStatusLabel('refunded')).toBe('Remboursé');
  });

  it('couvre les statuts PayTech cancelled/completed/expired', () => {
    expect(OrderService.getPaymentStatusLabel('cancelled')).toBe('Annulé');
    expect(OrderService.getPaymentStatusLabel('completed')).toBe('Payé');
    expect(OrderService.getPaymentStatusLabel('expired')).toBe('Expiré');
  });

  it('retombe sur la valeur brute pour un statut inconnu', () => {
    expect(OrderService.getPaymentStatusLabel('mystery')).toBe('mystery');
  });
});
