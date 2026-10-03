'use client';

import { useState, useEffect } from 'react';
import { shippingAPI } from '@/lib/shipping';
import type { ShippingMethod } from '@/lib/types/shipping';
import { Button } from '@/components/ui/Button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import ShippingMethodForm from '@/components/shipping/ShippingMethodForm';

export default function ShippingMethodsList() {
  const [methods, setMethods] = useState<ShippingMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingMethod, setEditingMethod] = useState<ShippingMethod | null>(null);

  const loadMethods = async () => {
    setLoading(true);
    setError(null);
    const result = await shippingAPI.getMethods();
    
    if (result.error) {
      setError(result.error.message || 'Erreur lors du chargement des méthodes');
    } else if (result.data) {
      setMethods(result.data);
    }
    
    setLoading(false);
  };

  useEffect(() => {
    loadMethods();
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette méthode ?')) return;
    
    const result = await shippingAPI.deleteMethod(id);
    if (result.error) {
      setError(result.error.message || 'Erreur lors de la suppression');
    } else {
      loadMethods();
    }
  };

  const handleEdit = (method: ShippingMethod) => {
    setEditingMethod(method);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingMethod(null);
    loadMethods();
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
      
      <Button onClick={() => setShowForm(true)}>Nouvelle Méthode</Button>
      
      {showForm && (
        <ShippingMethodForm
          method={editingMethod}
          onClose={handleFormClose}
        />
      )}
      
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nom</TableHead>
            <TableHead>Code</TableHead>
            <TableHead>Coût base</TableHead>
            <TableHead>Express</TableHead>
            <TableHead>Pickup</TableHead>
            <TableHead>Actif</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {methods.map((method) => (
            <TableRow key={method.id}>
              <TableCell>{method.name}</TableCell>
              <TableCell>{method.code}</TableCell>
              <TableCell>{method.baseCost}</TableCell>
              <TableCell>{method.isExpress ? 'Oui' : 'Non'}</TableCell>
              <TableCell>{method.isPickup ? 'Oui' : 'Non'}</TableCell>
              <TableCell>{method.isActive ? 'Oui' : 'Non'}</TableCell>
              <TableCell>
                <Button variant="outline" size="sm" onClick={() => handleEdit(method)} className="mr-2">
                  Modifier
                </Button>
                <Button variant="destructive" size="sm" onClick={() => handleDelete(method.id)}>
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
