'use client';

import { useState, useEffect } from 'react';
import { shippingAPI } from '@/lib/shipping';
import type { ShippingMethod, ShippingMethodCreate, ShippingMethodUpdate } from '@/lib/types/shipping';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

interface Props {
  method?: ShippingMethod | null;
  onClose: () => void;
}

export default function ShippingMethodForm({ method, onClose }: Props) {
  const [formData, setFormData] = useState<Partial<ShippingMethod>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (method) {
      setFormData(method);
    }
  }, [method]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    
    try {
      const result = method
        ? await shippingAPI.updateMethod(method.id, formData)
        : await shippingAPI.createMethod(formData as ShippingMethodCreate);
      
      if (result.error) {
        setError(result.error.message || 'Erreur lors de la sauvegarde');
      } else {
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Erreur inattendue');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl border p-4 rounded">
      <h3>{method ? 'Modifier' : 'Nouvelle'} Méthode</h3>
      
      {error && (
        <div
          className="px-4 py-3 rounded"
          style={{
            backgroundColor: 'var(--theme-error-light)',
            border: '1px solid var(--theme-error-border)',
            color: 'var(--theme-error-main)',
          }}
        >
          {error}
        </div>
      )}
      
      <div>
        <Label htmlFor="name">Nom</Label>
        <Input
          id="name"
          value={formData.name || ''}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </div>
      
      <div>
        <Label htmlFor="code">Code</Label>
        <Input
          id="code"
          value={formData.code || ''}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, code: e.target.value })}
          required
        />
      </div>
      
      <div>
        <Label htmlFor="description">Description</Label>
        <Input
          id="description"
          value={formData.description || ''}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, description: e.target.value })}
        />
      </div>
      
      <div>
        <Label htmlFor="baseCost">Coût base</Label>
        <Input
          id="baseCost"
          type="number"
          value={formData.baseCost || ''}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, baseCost: Number(e.target.value) })}
        />
      </div>
      
      <div>
        <Label htmlFor="costMultiplier">Multiplicateur</Label>
        <Input
          id="costMultiplier"
          type="number"
          slotProps={{ htmlInput: { step: '0.1' } }}
          value={formData.costMultiplier || ''}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, costMultiplier: Number(e.target.value) })}
        />
      </div>
      
      <div>
        <Label htmlFor="icon">Icône (truck, plane, pickup)</Label>
        <Input
          id="icon"
          value={formData.icon || ''}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, icon: e.target.value })}
        />
      </div>
      
      <div>
        <Label htmlFor="color">Couleur (hex)</Label>
        <Input
          id="color"
          value={formData.color || ''}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, color: e.target.value })}
        />
      </div>
      
      <div className="flex items-center space-x-2">
        <Switch
          id="isExpress"
          checked={formData.isExpress || false}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, isExpress: e.target.checked })}
        />
        <Label htmlFor="isExpress">Express</Label>
      </div>
      
      <div className="flex items-center space-x-2">
        <Switch
          id="isPickup"
          checked={formData.isPickup || false}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, isPickup: e.target.checked })}
        />
        <Label htmlFor="isPickup">Pickup</Label>
      </div>
      
      <div className="flex items-center space-x-2">
        <Switch
          id="requiresSignature"
          checked={formData.requiresSignature || false}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, requiresSignature: e.target.checked })}
        />
        <Label htmlFor="requiresSignature">Signature requise</Label>
      </div>
      
      <div className="flex items-center space-x-2">
        <Switch
          id="isActive"
          checked={formData.isActive || false}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, isActive: e.target.checked })}
        />
        <Label htmlFor="isActive">Actif</Label>
      </div>
      
      <div className="flex space-x-2">
        <Button type="submit" disabled={saving}>
          {saving ? 'Sauvegarde...' : 'Sauvegarder'}
        </Button>
        <Button type="button" variant="outlined" onClick={onClose}>
          Annuler
        </Button>
      </div>
    </form>
  );
}
