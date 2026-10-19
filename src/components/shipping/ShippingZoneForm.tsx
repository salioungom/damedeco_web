'use client';

import { useState, useEffect } from 'react';
import { shippingAPI } from '@/lib/shipping';
import type { ShippingZone, ShippingZoneCreate, ShippingZoneUpdate } from '@/lib/types/shipping';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

interface Props {
  zone?: ShippingZone | null;
  onClose: () => void;
}

export default function ShippingZoneForm({ zone, onClose }: Props) {
  const [formData, setFormData] = useState<Partial<ShippingZone>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (zone) {
      setFormData(zone);
    }
  }, [zone]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    
    try {
      const result = zone
        ? await shippingAPI.updateZone(zone.id, formData)
        : await shippingAPI.createZone(formData as ShippingZoneCreate);
      
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
      <h3>{zone ? 'Modifier' : 'Nouvelle'} Zone</h3>
      
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
        <Label htmlFor="costMultiplier">Multiplicateur</Label>
        <Input
          id="costMultiplier"
          type="number"
          step="0.1"
          value={formData.costMultiplier || ''}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, costMultiplier: Number(e.target.value) })}
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
        <Label htmlFor="estimatedDaysMin">Délai min (jours)</Label>
        <Input
          id="estimatedDaysMin"
          type="number"
          value={formData.estimatedDaysMin || ''}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, estimatedDaysMin: Number(e.target.value) })}
        />
      </div>
      
      <div>
        <Label htmlFor="estimatedDaysMax">Délai max (jours)</Label>
        <Input
          id="estimatedDaysMax"
          type="number"
          value={formData.estimatedDaysMax || ''}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, estimatedDaysMax: Number(e.target.value) })}
        />
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
        <Button type="button" variant="outline" onClick={onClose}>
          Annuler
        </Button>
      </div>
    </form>
  );
}
