'use client';

import { useState, useEffect } from 'react';
import { shippingAPI } from '@/lib/shipping';
import type { ShippingZone } from '@/lib/types/shipping';
import { Button } from '@/components/ui/Button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import ShippingZoneForm from './ShippingZoneForm';

export default function ShippingZonesList() {
  const [zones, setZones] = useState<ShippingZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingZone, setEditingZone] = useState<ShippingZone | null>(null);

  const loadZones = async () => {
    setLoading(true);
    setError(null);
    const result = await shippingAPI.getZones();
    
    if (result.error) {
      setError(result.error.message || 'Erreur lors du chargement des zones');
    } else if (result.data) {
      setZones(result.data);
    }
    
    setLoading(false);
  };

  useEffect(() => {
    loadZones();
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette zone ?')) return;
    
    const result = await shippingAPI.deleteZone(id);
    if (result.error) {
      setError(result.error.message || 'Erreur lors de la suppression');
    } else {
      loadZones();
    }
  };

  const handleEdit = (zone: ShippingZone) => {
    setEditingZone(zone);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingZone(null);
    loadZones();
  };

  if (loading) {
    return <div>Chargement...</div>;
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
      
      <Button onClick={() => setShowForm(true)}>Nouvelle Zone</Button>
      
      {showForm && (
        <ShippingZoneForm
          zone={editingZone}
          onClose={handleFormClose}
        />
      )}
      
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nom</TableHead>
            <TableHead>Code</TableHead>
            <TableHead>Multiplicateur</TableHead>
            <TableHead>Coût base</TableHead>
            <TableHead>Délai</TableHead>
            <TableHead>Actif</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {zones.map((zone) => (
            <TableRow key={zone.id}>
              <TableCell>{zone.name}</TableCell>
              <TableCell>{zone.code}</TableCell>
              <TableCell>{zone.costMultiplier}</TableCell>
              <TableCell>{zone.baseCost}</TableCell>
              <TableCell>{zone.estimatedDaysMin}-{zone.estimatedDaysMax} jours</TableCell>
              <TableCell>{zone.isActive ? 'Oui' : 'Non'}</TableCell>
              <TableCell>
                <Button variant="outline" size="sm" onClick={() => handleEdit(zone)} className="mr-2">
                  Modifier
                </Button>
                <Button variant="destructive" size="sm" onClick={() => handleDelete(zone.id)}>
                  Supprimer
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
