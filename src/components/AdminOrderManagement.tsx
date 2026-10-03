'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  Tooltip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Snackbar,
  Alert,
  Stack,
  alpha,
  Grid,
  Divider,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material/Select';
import {
  Search as SearchIcon,
  Edit as EditIcon,
  ShoppingCart as ShoppingCartIcon,
  Visibility as VisibilityIcon,
  Person as PersonIcon,
  LocalShipping as LocalShippingIcon,
  ReceiptLong as ReceiptLongIcon,
  PictureAsPdf as PictureAsPdfIcon,
  Download as DownloadIcon,
  WhatsApp as WhatsAppIcon,
} from '@mui/icons-material';
import { getAdminOrders, updateOrderStatus } from '@/lib/api';
import { formatFcfa } from '@/lib/format';
import InvoiceService, {
  buildInvoiceWhatsappMessage,
  getInvoicePaymentBadge,
  getInvoicePaymentMethodLabel,
  getInvoicePdfFileName,
  getInvoiceStatusLabel,
  normalizeInvoicePhone,
} from '@/services/invoice.service';
import type { Invoice } from '@/services/invoice.service';
import { BRAND_BLUE } from '@/theme';

const BRAND = {
  primary: BRAND_BLUE,
  dark: '#042C53',
  white: '#FFFFFF',
  light: '#E6F1FB',
  surface: '#F5F9FE',
  border: '#D4E8F7',
  muted: '#5F6B7A',
} as const;

interface OrderItem {
  id: number;
  product_id: number;
  quantity: number;
  unit_price: number;
  total_price: number;
  product?: {
    name: string;
  };
}

interface Order {
  id: number;
  order_number: string;
  customer_id: number | null;
  status: string;
  payment_status: string;
  payment_method: string;
  mode: string;
  subtotal: number;
  tax_amount: number;
  shipping_amount: number;
  discount_amount: number;
  total_amount: number;
  currency: string;
  created_at: string;
  shipping_address: {
    first_name?: string;
    last_name?: string;
    full_name?: string;
    email?: string;
    phone?: string;
    city?: string;
    address?: string;
    instructions?: string;
  } | null;
  customer: {
    id: number;
    name: string;
    email: string | null;
    phone: string | null;
  } | null;
  items: OrderItem[];
}

interface AdminOrderManagementProps {
  initialCustomerId?: number | null;
}

export function AdminOrderManagement({ initialCustomerId }: AdminOrderManagementProps = {}) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters and Pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [customerFilter, setCustomerFilter] = useState<number | null>(initialCustomerId || null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Dialog State
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [newStatus, setNewStatus] = useState('');
  const [notes, setNotes] = useState('');
  const [submittingStatus, setSubmittingStatus] = useState(false);

  // Detail Dialog State
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [detailOrder, setDetailOrder] = useState<Order | null>(null);

  // Invoice Dialog State
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const [invoiceOrder, setInvoiceOrder] = useState<Order | null>(null);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [invoiceError, setInvoiceError] = useState<string | null>(null);
  const [pdfViewing, setPdfViewing] = useState(false);
  const [pdfDownloading, setPdfDownloading] = useState(false);
  const [whatsappSending, setWhatsappSending] = useState(false);

  // Snackbar Alert State
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch orders (API max limit is 100)
      const data = await getAdminOrders(0, 100) as any;
      setOrders(data || []);
    } catch (err: any) {
      console.error('Error fetching admin orders:', err);
      setError(err?.message || 'Impossible de charger les commandes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleOpenDialog = (order: Order) => {
    setSelectedOrder(order);
    setNewStatus(order.status);
    setNotes('');
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedOrder(null);
    setNotes('');
  };

  const handleOpenDetailDialog = (order: Order) => {
    setDetailOrder(order);
    setDetailDialogOpen(true);
  };

  const handleCloseDetailDialog = () => {
    setDetailDialogOpen(false);
    setDetailOrder(null);
  };

  const handleCloseInvoiceDialog = () => {
    setInvoiceDialogOpen(false);
    setInvoiceOrder(null);
    setInvoice(null);
    setInvoiceError(null);
  };

  const getInvoiceErrorMessage = (err: any, fallback: string) => {
    const status = Number(err?.status) || 0;
    if (status === 401) return 'Votre session a expiré. Veuillez vous reconnecter.';
    if (status === 403) return "Vous n'êtes pas autorisé à consulter cette facture.";
    if (status === 404) return 'Facture introuvable.';
    if (status >= 500) return 'Erreur serveur lors de la récupération de la facture.';
    return err?.message || fallback;
  };

  const handleOpenInvoiceDialog = async (order: Order) => {
    setInvoiceOrder(order);
    setInvoice(null);
    setInvoiceError(null);
    setInvoiceDialogOpen(true);
    setInvoiceLoading(true);
    try {
      let facture: Invoice;
      try {
        facture = await InvoiceService.getInvoiceByOrderId(order.id);
      } catch (err: any) {
        // 404 → aucune facture générée pour cette commande : on la génère (idempotent).
        if (Number(err?.status) === 404) {
          facture = await InvoiceService.createInvoice(order.id);
        } else {
          throw err;
        }
      }
      setInvoice(facture);
    } catch (err: any) {
      console.error('Error loading invoice:', err);
      setInvoiceError(getInvoiceErrorMessage(err, 'Impossible de charger la facture.'));
    } finally {
      setInvoiceLoading(false);
    }
  };

  const handleViewInvoicePdf = async () => {
    if (!invoice || pdfViewing) return;
    setPdfViewing(true);
    try {
      const blob = await InvoiceService.getInvoicePdf(invoice.id);
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank', 'noopener,noreferrer');
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (err: any) {
      console.error('Error viewing invoice pdf:', err);
      setSnackbar({
        open: true,
        message: getInvoiceErrorMessage(err, "Impossible d'afficher le PDF de la facture."),
        severity: 'error',
      });
    } finally {
      setPdfViewing(false);
    }
  };

  const handleDownloadInvoicePdf = async () => {
    if (!invoice || pdfDownloading) return;
    setPdfDownloading(true);
    try {
      const blob = await InvoiceService.getInvoicePdf(invoice.id);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = getInvoicePdfFileName(invoice.invoice_number);
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10000);
      setSnackbar({
        open: true,
        message: `Facture ${invoice.invoice_number} téléchargée.`,
        severity: 'success',
      });
    } catch (err: any) {
      console.error('Error downloading invoice pdf:', err);
      setSnackbar({
        open: true,
        message: getInvoiceErrorMessage(err, 'Impossible de télécharger le PDF de la facture.'),
        severity: 'error',
      });
    } finally {
      setPdfDownloading(false);
    }
  };

  const handleSendInvoiceWhatsapp = () => {
    if (!invoice || !invoiceOrder || whatsappSending) return;
    const phone = normalizeInvoicePhone(
      invoice.customer?.phone ||
      invoiceOrder.customer?.phone ||
      invoiceOrder.shipping_address?.phone
    );
    if (!phone) {
      setSnackbar({
        open: true,
        message: 'Aucun numéro de téléphone disponible pour ce client.',
        severity: 'error',
      });
      return;
    }
    setWhatsappSending(true);
    const message = buildInvoiceWhatsappMessage(invoice, getOrderCustomerName(invoiceOrder));
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
    setWhatsappSending(false);
    setSnackbar({
      open: true,
      message: 'Ouverture de WhatsApp...',
      severity: 'success',
    });
  };

  const handleConfirmStatusChange = async () => {
    if (!selectedOrder) return;
    setSubmittingStatus(true);
    try {
      await updateOrderStatus(selectedOrder.id, newStatus, notes);
      
      // Update local state immediately
      setOrders((prevOrders) =>
        prevOrders.map((o) =>
          o.id === selectedOrder.id ? { ...o, status: newStatus } : o
        )
      );

      setSnackbar({
        open: true,
        message: `Statut de la commande ${selectedOrder.order_number} mis à jour avec succès.`,
        severity: 'success',
      });
      handleCloseDialog();
    } catch (err: any) {
      console.error('Error updating order status:', err);
      setSnackbar({
        open: true,
        message: err?.message || 'Erreur lors de la mise à jour du statut.',
        severity: 'error',
      });
    } finally {
      setSubmittingStatus(false);
    }
  };

  // Helper to get Customer Name
  const getOrderCustomerName = (order: Order) => {
    if (order.customer?.name) return order.customer.name;
    if (order.shipping_address?.first_name) return `${order.shipping_address.first_name} ${order.shipping_address.last_name || ''}`.trim();
    return 'Client invité';
  };

  // Get customer name for filter display
  const getCustomerNameForFilter = () => {
    if (!customerFilter) return null;
    const customerOrder = orders.find(o => o.customer_id === customerFilter);
    return customerOrder?.customer?.name || `Client #${customerFilter}`;
  };

  // Chip Styling per Status
  const getStatusChipSx = (status: string) => {
    const colors: Record<string, { bg: string; color: string }> = {
      pending: { bg: alpha('#F59E0B', 0.12), color: '#B45309' }, // orange/warning
      confirmed: { bg: alpha('#0288D1', 0.12), color: '#0288D1' }, // bleu/info
      processing: { bg: alpha('#9C27B0', 0.12), color: '#9C27B0' }, // violet/secondaire
      shipped: { bg: alpha('#3F51B5', 0.12), color: '#3F51B5' }, // indigo/bleu foncé
      delivered: { bg: alpha('#2E7D32', 0.12), color: '#2E7D32' }, // vert/success
      cancelled: { bg: alpha('#D32F2F', 0.12), color: '#D32F2F' }, // rouge/error
      refunded: { bg: alpha('#757575', 0.15), color: '#757575' }, // gris/default
    };
    const c = colors[status] || { bg: alpha(BRAND.muted, 0.1), color: BRAND.muted };
    return {
      bgcolor: c.bg,
      color: c.color,
      fontWeight: 600,
      fontSize: 13,
      px: 1,
    };
  };

  // Filter and Search logic
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
      const matchesCustomer = customerFilter === null || order.customer_id === customerFilter;

      const search = searchQuery.toLowerCase().trim();
      const customerName = getOrderCustomerName(order).toLowerCase();
      const orderNumber = order.order_number.toLowerCase();
      const matchesSearch =
        !search ||
        orderNumber.includes(search) ||
        customerName.includes(search);

      return matchesStatus && matchesSearch && matchesCustomer;
    });
  }, [orders, statusFilter, searchQuery, customerFilter]);

  // Paginated data
  const paginatedOrders = useMemo(() => {
    const start = page * rowsPerPage;
    return filteredOrders.slice(start, start + rowsPerPage);
  }, [filteredOrders, page, rowsPerPage]);

  // Reset page on search or filter change
  useEffect(() => {
    setPage(0);
  }, [searchQuery, statusFilter, customerFilter]);

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: '20px',
        border: `1px solid ${BRAND.border}`,
        bgcolor: BRAND.white,
        overflow: 'hidden',
      }}
    >
      {/* Header Info */}
      <Box sx={{ px: 2.5, py: 2, bgcolor: BRAND.light, borderBottom: `1px solid ${BRAND.border}` }}>
        <Typography sx={{ fontSize: 22.5, fontWeight: 700, color: BRAND.dark }}>
          Gestion des commandes
        </Typography>
        <Typography sx={{ fontSize: 16.25, color: BRAND.muted }}>
          {filteredOrders.length} commande{filteredOrders.length !== 1 ? 's' : ''} trouvée{filteredOrders.length !== 1 ? 's' : ''} sur {orders.length} au total
        </Typography>
      </Box>

      {/* Toolbar Controls */}
      <Box
        sx={{
          px: 2.5,
          py: 2,
          borderBottom: `1px solid ${BRAND.border}`,
          display: 'flex',
          gap: 2,
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        <TextField
          size="small"
          placeholder="Rechercher une commande..."
          value={searchQuery}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
          sx={{ flex: 1, minWidth: 220 }}
          slotProps={{
            input: {
              startAdornment: <SearchIcon sx={{ color: BRAND.muted, mr: 1, fontSize: 20 }} />,
            },
          }}
        />

        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel sx={{ color: BRAND.muted }}>Filtrer par Statut</InputLabel>
          <Select
            value={statusFilter}
            label="Filtrer par Statut"
            onChange={(e: SelectChangeEvent) => setStatusFilter(e.target.value)}
            sx={{ borderRadius: '10px' }}
          >
            <MenuItem value="all">Tous les statuts</MenuItem>
            <MenuItem value="pending">En attente (pending)</MenuItem>
            <MenuItem value="processing">En préparation (processing)</MenuItem>
            <MenuItem value="shipped">Expédiée (shipped)</MenuItem>
            <MenuItem value="delivered">Livrée (delivered)</MenuItem>
          </Select>
        </FormControl>

        {customerFilter && (
          <Chip
            label={getCustomerNameForFilter()}
            onDelete={() => setCustomerFilter(null)}
            sx={{
              bgcolor: alpha(BRAND.primary, 0.1),
              color: BRAND.primary,
              fontWeight: 600,
            }}
          />
        )}
      </Box>

      {/* Table Content */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress sx={{ color: BRAND.primary }} />
        </Box>
      ) : error ? (
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <Alert severity="error" variant="outlined" sx={{ width: 'fit-content', mx: 'auto' }}>
            {error}
          </Alert>
        </Box>
      ) : filteredOrders.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <ShoppingCartIcon sx={{ fontSize: 60, color: BRAND.border, mb: 1 }} />
          <Typography sx={{ color: BRAND.muted }}>
            Aucune commande correspondante.
          </Typography>
        </Box>
      ) : (
        <>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow
                  sx={{
                    bgcolor: BRAND.dark,
                    '& th': {
                      color: BRAND.white,
                      fontWeight: 600,
                      fontSize: 15,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      py: 1.5,
                      borderBottom: 'none',
                    },
                  }}
                >
                  <TableCell>N° commande</TableCell>
                  <TableCell>Client</TableCell>
                  <TableCell>Total</TableCell>
                  <TableCell>Statut</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedOrders.map((order, i) => (
                  <TableRow
                    key={order.id}
                    hover
                    sx={{
                      bgcolor: i % 2 === 0 ? BRAND.white : BRAND.surface,
                      '& td': { borderColor: BRAND.border, py: 1.5 },
                    }}
                  >
                    <TableCell>
                      <Typography sx={{ fontSize: 16, fontWeight: 700, color: BRAND.primary }}>
                        {order.order_number}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontSize: 16.5, color: BRAND.dark }}>
                        {getOrderCustomerName(order)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontSize: 16.5, fontWeight: 600, color: BRAND.dark }}>
                        {formatFcfa(Number(order.total_amount) || 0)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={order.status.toUpperCase()}
                        size="small"
                        sx={getStatusChipSx(order.status)}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontSize: 15, color: BRAND.muted }}>
                        {new Date(order.created_at).toLocaleDateString('fr-FR')}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end' }}>
                        <Tooltip title="Voir les détails">
                          <IconButton
                            onClick={() => handleOpenDetailDialog(order)}
                            sx={{
                              color: BRAND.primary,
                              bgcolor: alpha(BRAND.primary, 0.08),
                              '&:hover': {
                                bgcolor: alpha(BRAND.primary, 0.15),
                              },
                            }}
                            size="small"
                          >
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Modifier le statut">
                          <IconButton
                            onClick={() => handleOpenDialog(order)}
                            sx={{
                              color: BRAND.primary,
                              bgcolor: alpha(BRAND.primary, 0.08),
                              '&:hover': {
                                bgcolor: alpha(BRAND.primary, 0.15),
                              },
                            }}
                            size="small"
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Facture">
                          <IconButton
                            onClick={() => handleOpenInvoiceDialog(order)}
                            sx={{
                              color: '#2E7D32',
                              bgcolor: alpha('#2E7D32', 0.08),
                              '&:hover': {
                                bgcolor: alpha('#2E7D32', 0.18),
                              },
                            }}
                            size="small"
                          >
                            <ReceiptLongIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            component="div"
            count={filteredOrders.length}
            page={page}
            onPageChange={(_: React.MouseEvent<HTMLButtonElement> | null, p: number) => setPage(p)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
              setRowsPerPage(Number(e.target.value));
              setPage(0);
            }}
            rowsPerPageOptions={[5, 10, 25, 50]}
            labelRowsPerPage="Lignes par page"
            labelDisplayedRows={({ from, to, count }: { from: number; to: number; count: number }) => `${from}–${to} sur ${count}`}
            sx={{
              borderTop: `1px solid ${BRAND.border}`,
              '& .MuiTablePagination-toolbar': { minHeight: 52 },
              '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                color: BRAND.muted,
                fontSize: 15,
              },
              '& .MuiIconButton-root': { color: BRAND.primary },
            }}
          />
        </>
      )}

      {/* Change Status Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="xs"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              borderRadius: '16px',
              p: 1.5,
            },
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
          Modifier le statut
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            {selectedOrder && (
              <Typography sx={{ color: BRAND.muted, fontSize: 15 }}>
                Commande : <strong>{selectedOrder.order_number}</strong> ({getOrderCustomerName(selectedOrder)})
              </Typography>
            )}

            <FormControl fullWidth size="small">
              <InputLabel>Nouveau Statut</InputLabel>
              <Select
                value={newStatus}
                label="Nouveau Statut"
                onChange={(e: SelectChangeEvent) => setNewStatus(e.target.value)}
              >
                <MenuItem value="pending">En attente (pending)</MenuItem>
                <MenuItem value="processing">En préparation (processing)</MenuItem>
                <MenuItem value="shipped">Expédiée (shipped)</MenuItem>
                <MenuItem value="delivered">Livrée (delivered)</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Notes / Réf (optionnel)"
              multiline
              rows={3}
              value={notes}
              onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setNotes(e.target.value)}
              placeholder="Ex: Raison du retour, informations de livraison..."
              fullWidth
              size="small"
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={handleCloseDialog}
            sx={{
              color: BRAND.muted,
              textTransform: 'none',
              fontWeight: 600,
            }}
          >
            Annuler
          </Button>
          <Button
            onClick={handleConfirmStatusChange}
            variant="contained"
            disabled={submittingStatus}
            sx={{
              bgcolor: BRAND.primary,
              textTransform: 'none',
              fontWeight: 600,
              borderRadius: '10px',
              px: 3,
              '&:hover': {
                bgcolor: BRAND.dark,
              },
            }}
          >
            {submittingStatus ? 'Mise à jour...' : 'Confirmer'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Order Detail Dialog */}
      <Dialog
        open={detailDialogOpen}
        onClose={handleCloseDetailDialog}
        maxWidth="md"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              borderRadius: '16px',
              p: 0,
            },
          },
        }}
      >
        {detailOrder && (
          <>
            <DialogTitle sx={{ fontWeight: 700, pb: 2, borderBottom: `1px solid ${BRAND.border}` }}>
              Détails de la commande {detailOrder.order_number}
            </DialogTitle>
            <DialogContent sx={{ p: 3 }}>
              <Stack spacing={3}>
                {/* Customer Information */}
                <Box>
                  <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', mb: 2 }}>
                    <PersonIcon sx={{ color: BRAND.primary, fontSize: 24 }} />
                    <Typography sx={{ fontSize: 18, fontWeight: 700, color: BRAND.dark }}>
                      Informations client
                    </Typography>
                  </Stack>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2.5,
                      borderRadius: '12px',
                      border: `1px solid ${BRAND.border}`,
                      bgcolor: BRAND.surface,
                    }}
                  >
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Typography sx={{ fontSize: 14, color: BRAND.muted, mb: 0.5 }}>Prénom</Typography>
                        <Typography sx={{ fontSize: 16, fontWeight: 600, color: BRAND.dark }}>
                          {detailOrder.shipping_address?.first_name || detailOrder.customer?.name?.split(' ')[0] || '—'}
                        </Typography>
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Typography sx={{ fontSize: 14, color: BRAND.muted, mb: 0.5 }}>Nom</Typography>
                        <Typography sx={{ fontSize: 16, fontWeight: 600, color: BRAND.dark }}>
                          {detailOrder.shipping_address?.last_name || detailOrder.customer?.name?.split(' ').slice(1).join(' ') || '—'}
                        </Typography>
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Typography sx={{ fontSize: 14, color: BRAND.muted, mb: 0.5 }}>Email</Typography>
                        <Typography sx={{ fontSize: 16, color: BRAND.dark }}>
                          {detailOrder.customer?.email || '—'}
                        </Typography>
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Typography sx={{ fontSize: 14, color: BRAND.muted, mb: 0.5 }}>Téléphone</Typography>
                        <Typography sx={{ fontSize: 16, color: BRAND.dark }}>
                          {detailOrder.shipping_address?.phone || detailOrder.customer?.phone || '—'}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Paper>
                </Box>

                {/* Delivery Information */}
                <Box>
                  <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', mb: 2 }}>
                    <LocalShippingIcon sx={{ color: BRAND.primary, fontSize: 24 }} />
                    <Typography sx={{ fontSize: 18, fontWeight: 700, color: BRAND.dark }}>
                      Informations de livraison
                    </Typography>
                  </Stack>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2.5,
                      borderRadius: '12px',
                      border: `1px solid ${BRAND.border}`,
                      bgcolor: BRAND.surface,
                    }}
                  >
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 12 }}>
                        <Typography sx={{ fontSize: 14, color: BRAND.muted, mb: 0.5 }}>Mode de livraison</Typography>
                        <Chip
                          label={detailOrder.mode === 'home_delivery' ? 'Livraison à la maison' : 'Retrait en boutique'}
                          size="small"
                          sx={{
                            bgcolor: alpha(BRAND.primary, 0.1),
                            color: BRAND.primary,
                            fontWeight: 600,
                            fontSize: 14,
                          }}
                        />
                      </Grid>
                      {detailOrder.mode === 'home_delivery' && detailOrder.shipping_address ? (
                        <>
                          <Grid size={{ xs: 12, sm: 6 }}>
                            <Typography sx={{ fontSize: 14, color: BRAND.muted, mb: 0.5 }}>Prénom</Typography>
                            <Typography sx={{ fontSize: 16, fontWeight: 600, color: BRAND.dark }}>
                              {detailOrder.shipping_address.first_name || (detailOrder.shipping_address.full_name?.split(' ')[0]) || '—'}
                            </Typography>
                          </Grid>
                          <Grid size={{ xs: 12, sm: 6 }}>
                            <Typography sx={{ fontSize: 14, color: BRAND.muted, mb: 0.5 }}>Nom</Typography>
                            <Typography sx={{ fontSize: 16, fontWeight: 600, color: BRAND.dark }}>
                              {detailOrder.shipping_address.last_name || (detailOrder.shipping_address.full_name?.split(' ').slice(1).join(' ')) || '—'}
                            </Typography>
                          </Grid>
                          <Grid size={{ xs: 12, sm: 6 }}>
                            <Typography sx={{ fontSize: 14, color: BRAND.muted, mb: 0.5 }}>Téléphone</Typography>
                            <Typography sx={{ fontSize: 16, color: BRAND.dark }}>
                              {detailOrder.shipping_address.phone || '—'}
                            </Typography>
                          </Grid>
                          <Grid size={{ xs: 12, sm: 6 }}>
                            <Typography sx={{ fontSize: 14, color: BRAND.muted, mb: 0.5 }}>Email</Typography>
                            <Typography sx={{ fontSize: 16, color: BRAND.dark }}>
                              {detailOrder.shipping_address.email || '—'}
                            </Typography>
                          </Grid>
                          <Grid size={{ xs: 12, sm: 6 }}>
                            <Typography sx={{ fontSize: 14, color: BRAND.muted, mb: 0.5 }}>Ville</Typography>
                            <Typography sx={{ fontSize: 16, color: BRAND.dark }}>
                              {detailOrder.shipping_address.city || '—'}
                            </Typography>
                          </Grid>
                          <Grid size={{ xs: 12 }}>
                            <Typography sx={{ fontSize: 14, color: BRAND.muted, mb: 0.5 }}>Adresse complète</Typography>
                            <Typography sx={{ fontSize: 16, color: BRAND.dark }}>
                              {detailOrder.shipping_address.address || '—'}
                            </Typography>
                          </Grid>
                          {detailOrder.shipping_address.instructions && (
                            <Grid size={{ xs: 12 }}>
                              <Typography sx={{ fontSize: 14, color: BRAND.muted, mb: 0.5 }}>Instructions</Typography>
                              <Typography sx={{ fontSize: 16, color: BRAND.dark }}>
                                {detailOrder.shipping_address.instructions}
                              </Typography>
                            </Grid>
                          )}
                        </>
                      ) : (
                        <Grid size={{ xs: 12 }}>
                          <Typography sx={{ fontSize: 16, color: BRAND.muted, fontStyle: 'italic' }}>
                            Retrait en boutique — aucune adresse de livraison requise
                          </Typography>
                        </Grid>
                      )}
                    </Grid>
                  </Paper>
                </Box>

                {/* Order Summary */}
                <Box>
                  <Typography sx={{ fontSize: 18, fontWeight: 700, color: BRAND.dark, mb: 2 }}>
                    Récapitulatif
                  </Typography>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2.5,
                      borderRadius: '12px',
                      border: `1px solid ${BRAND.border}`,
                      bgcolor: BRAND.surface,
                    }}
                  >
                    <Stack spacing={1.5}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography sx={{ fontSize: 15, color: BRAND.muted }}>Sous-total</Typography>
                        <Typography sx={{ fontSize: 16, fontWeight: 600, color: BRAND.dark }}>
                          {formatFcfa(Number(detailOrder.subtotal) || 0)}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography sx={{ fontSize: 15, color: BRAND.muted }}>Livraison</Typography>
                        <Typography sx={{ fontSize: 16, fontWeight: 600, color: BRAND.dark }}>
                          {formatFcfa(Number(detailOrder.shipping_amount) || 0)}
                        </Typography>
                      </Box>
                      <Divider sx={{ my: 1 }} />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography sx={{ fontSize: 16, fontWeight: 700, color: BRAND.dark }}>Total</Typography>
                        <Typography sx={{ fontSize: 18, fontWeight: 700, color: BRAND.primary }}>
                          {formatFcfa(Number(detailOrder.total_amount) || 0)}
                        </Typography>
                      </Box>
                    </Stack>
                  </Paper>
                </Box>
              </Stack>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 3, pt: 0 }}>
              <Button
                onClick={handleCloseDetailDialog}
                variant="contained"
                sx={{
                  bgcolor: BRAND.primary,
                  textTransform: 'none',
                  fontWeight: 600,
                  borderRadius: '10px',
                  px: 3,
                  '&:hover': {
                    bgcolor: BRAND.dark,
                  },
                }}
              >
                Fermer
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Invoice Dialog */}
      <Dialog
        open={invoiceDialogOpen}
        onClose={handleCloseInvoiceDialog}
        maxWidth="md"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              borderRadius: '16px',
              p: 0,
            },
          },
        }}
      >
        {invoiceLoading ? (
          <DialogContent sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress sx={{ color: BRAND.primary }} />
          </DialogContent>
        ) : invoiceError ? (
          <DialogContent sx={{ p: 4, textAlign: 'center' }}>
            <Alert severity="error" variant="outlined" sx={{ mb: 3 }}>
              {invoiceError}
            </Alert>
            <Button
              onClick={handleCloseInvoiceDialog}
              sx={{
                color: BRAND.muted,
                textTransform: 'none',
                fontWeight: 600,
              }}
            >
              Fermer
            </Button>
          </DialogContent>
        ) : invoice ? (
          <>
            <DialogTitle
              sx={{
                fontWeight: 700,
                pb: 2,
                borderBottom: `1px solid ${BRAND.border}`,
              }}
            >
              <Stack
                direction="row"
                spacing={1.5}
                sx={{ alignItems: 'center', justifyContent: 'space-between' }}
              >
                <Typography sx={{ fontSize: 20, fontWeight: 700, color: BRAND.dark }}>
                  Facture {invoice.invoice_number}
                </Typography>
                <Chip
                  label={getInvoiceStatusLabel(invoice.status)}
                  size="small"
                  sx={{
                    bgcolor: alpha('#2E7D32', 0.12),
                    color: '#2E7D32',
                    fontWeight: 600,
                    fontSize: 14,
                  }}
                />
              </Stack>
              {invoiceOrder && (
                <Typography sx={{ fontSize: 15, color: BRAND.muted, mt: 0.5 }}>
                  Commande {invoice.order_number || invoiceOrder.order_number} —{' '}
                  {getOrderCustomerName(invoiceOrder)}
                </Typography>
              )}
            </DialogTitle>
            <DialogContent sx={{ p: 3 }}>
              <Stack spacing={3}>
                {/* Informations client + facture */}
                <Paper
                  elevation={0}
                  sx={{
                    p: 2.5,
                    borderRadius: '12px',
                    border: `1px solid ${BRAND.border}`,
                    bgcolor: BRAND.surface,
                  }}
                >
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Typography sx={{ fontSize: 14, color: BRAND.muted, mb: 0.5 }}>Client</Typography>
                      <Typography sx={{ fontSize: 16, fontWeight: 600, color: BRAND.dark }}>
                        {invoice.customer?.full_name || (invoiceOrder ? getOrderCustomerName(invoiceOrder) : '—')}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Typography sx={{ fontSize: 14, color: BRAND.muted, mb: 0.5 }}>Date d'émission</Typography>
                      <Typography sx={{ fontSize: 16, color: BRAND.dark }}>
                        {invoice.issued_at
                          ? new Date(invoice.issued_at).toLocaleDateString('fr-FR')
                          : invoice.created_at
                            ? new Date(invoice.created_at).toLocaleDateString('fr-FR')
                            : '—'}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Typography sx={{ fontSize: 14, color: BRAND.muted, mb: 0.5 }}>Email</Typography>
                      <Typography sx={{ fontSize: 16, color: BRAND.dark }}>
                        {invoice.customer?.email || '—'}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Typography sx={{ fontSize: 14, color: BRAND.muted, mb: 0.5 }}>Téléphone</Typography>
                      <Typography sx={{ fontSize: 16, color: BRAND.dark }}>
                        {invoice.customer?.phone ||
                          invoiceOrder?.customer?.phone ||
                          invoiceOrder?.shipping_address?.phone ||
                          '—'}
                      </Typography>
                    </Grid>
                  </Grid>
                </Paper>

                {/* Adresse de livraison (jamais de JSON brut : champs affichés proprement) */}
                {invoiceOrder?.shipping_address && invoiceOrder.mode !== 'store_pickup' ? (
                  <Box>
                    <Typography sx={{ fontSize: 18, fontWeight: 700, color: BRAND.dark, mb: 2 }}>
                      Adresse de livraison
                    </Typography>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2.5,
                        borderRadius: '12px',
                        border: `1px solid ${BRAND.border}`,
                        bgcolor: BRAND.surface,
                      }}
                    >
                      <Stack spacing={1}>
                        <Typography sx={{ fontSize: 16, fontWeight: 600, color: BRAND.dark }}>
                          {invoiceOrder.shipping_address.first_name
                            ? `${invoiceOrder.shipping_address.first_name} ${invoiceOrder.shipping_address.last_name || ''}`.trim()
                            : invoiceOrder.shipping_address.full_name || ''}
                        </Typography>
                        {invoiceOrder.shipping_address.address && (
                          <Typography sx={{ fontSize: 16, color: BRAND.dark }}>
                            {invoiceOrder.shipping_address.address}
                          </Typography>
                        )}
                        {invoiceOrder.shipping_address.city && (
                          <Typography sx={{ fontSize: 16, color: BRAND.dark }}>
                            {invoiceOrder.shipping_address.city}
                          </Typography>
                        )}
                        {invoiceOrder.shipping_address.instructions && (
                          <Typography sx={{ fontSize: 15, color: BRAND.muted, fontStyle: 'italic' }}>
                            Instructions : {invoiceOrder.shipping_address.instructions}
                          </Typography>
                        )}
                      </Stack>
                    </Paper>
                  </Box>
                ) : (
                  <Box>
                    <Typography sx={{ fontSize: 18, fontWeight: 700, color: BRAND.dark, mb: 2 }}>
                      Adresse de livraison
                    </Typography>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2.5,
                        borderRadius: '12px',
                        border: `1px solid ${BRAND.border}`,
                        bgcolor: BRAND.surface,
                      }}
                    >
                      <Typography sx={{ fontSize: 16, color: BRAND.muted, fontStyle: 'italic' }}>
                        Retrait en boutique — aucune adresse de livraison requise.
                      </Typography>
                    </Paper>
                  </Box>
                )}

                {/* Articles */}
                {Array.isArray(invoice.items) && invoice.items.length > 0 && (
                  <Box>
                    <Typography sx={{ fontSize: 18, fontWeight: 700, color: BRAND.dark, mb: 2 }}>
                      Articles
                    </Typography>
                    <TableContainer
                      component={Paper}
                      elevation={0}
                      sx={{
                        borderRadius: '12px',
                        border: `1px solid ${BRAND.border}`,
                        overflowX: 'auto',
                      }}
                    >
                      <Table size="small" aria-label="Articles de la facture" sx={{ minWidth: 560 }}>
                        <TableHead>
                          <TableRow sx={{ bgcolor: BRAND.dark }}>
                            <TableCell sx={{ color: BRAND.white, fontWeight: 600 }}>Produit</TableCell>
                            <TableCell align="center" sx={{ color: BRAND.white, fontWeight: 600 }}>Qté</TableCell>
                            <TableCell align="right" sx={{ color: BRAND.white, fontWeight: 600 }}>PU</TableCell>
                            <TableCell align="right" sx={{ color: BRAND.white, fontWeight: 600 }}>Total</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {invoice.items.map((item, idx) => (
                            <TableRow
                              key={`${item.product_id}-${idx}`}
                              sx={{
                                bgcolor: idx % 2 === 0 ? BRAND.white : BRAND.surface,
                                '& td': { borderColor: BRAND.border },
                              }}
                            >
                              <TableCell sx={{ fontSize: 15, color: BRAND.dark }}>
                                {item.product_name || `Produit #${item.product_id}`}
                              </TableCell>
                              <TableCell align="center" sx={{ fontSize: 15, color: BRAND.dark }}>
                                {Number(item.quantity) || 0}
                              </TableCell>
                              <TableCell align="right" sx={{ fontSize: 15, color: BRAND.dark }}>
                                {formatFcfa(Number(item.unit_price) || 0)}
                              </TableCell>
                              <TableCell align="right" sx={{ fontSize: 15, fontWeight: 600, color: BRAND.dark }}>
                                {formatFcfa(Number(item.total_price) || 0)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>
                )}

                {/* Totaux */}
                <Box>
                  <Typography sx={{ fontSize: 18, fontWeight: 700, color: BRAND.dark, mb: 2 }}>
                    Récapitulatif
                  </Typography>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2.5,
                      borderRadius: '12px',
                      border: `1px solid ${BRAND.border}`,
                      bgcolor: BRAND.surface,
                    }}
                  >
                    <Stack spacing={1.5}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography sx={{ fontSize: 15, color: BRAND.muted }}>Sous-total</Typography>
                        <Typography sx={{ fontSize: 16, fontWeight: 600, color: BRAND.dark }}>
                          {formatFcfa(Number(invoice.subtotal) || 0)}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography sx={{ fontSize: 15, color: BRAND.muted }}>Livraison</Typography>
                        <Typography sx={{ fontSize: 16, fontWeight: 600, color: BRAND.dark }}>
                          {formatFcfa(Number(invoice.delivery_fee) || 0)}
                        </Typography>
                      </Box>
                      {Number(invoice.discount_amount) > 0 && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography sx={{ fontSize: 15, color: BRAND.muted }}>Remise</Typography>
                          <Typography sx={{ fontSize: 16, fontWeight: 600, color: BRAND.muted }}>
                            − {formatFcfa(Number(invoice.discount_amount) || 0)}
                          </Typography>
                        </Box>
                      )}
                      {Number(invoice.tax_amount) > 0 && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography sx={{ fontSize: 15, color: BRAND.muted }}>TVA</Typography>
                          <Typography sx={{ fontSize: 16, fontWeight: 600, color: BRAND.dark }}>
                            {formatFcfa(Number(invoice.tax_amount) || 0)}
                          </Typography>
                        </Box>
                      )}
                      <Divider sx={{ my: 1 }} />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography sx={{ fontSize: 16, fontWeight: 700, color: BRAND.dark }}>Total</Typography>
                        <Typography sx={{ fontSize: 18, fontWeight: 700, color: BRAND.primary }}>
                          {formatFcfa(Number(invoice.total) || 0)}
                        </Typography>
                      </Box>
                    </Stack>
                  </Paper>
                </Box>

                {/* Paiement */}
                {invoice.payment && (
                  <Box>
                    <Typography sx={{ fontSize: 18, fontWeight: 700, color: BRAND.dark, mb: 2 }}>
                      Paiement
                    </Typography>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2.5,
                        borderRadius: '12px',
                        border: `1px solid ${BRAND.border}`,
                        bgcolor: BRAND.surface,
                      }}
                    >
                      <Grid container spacing={2}>
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <Typography sx={{ fontSize: 14, color: BRAND.muted, mb: 0.5 }}>Statut</Typography>
                          {(() => {
                            const badge = getInvoicePaymentBadge(invoice.payment.status);
                            if (!badge) {
                              return <Typography sx={{ fontSize: 16, color: BRAND.dark }}>—</Typography>;
                            }
                            const c = {
                              success: { bg: alpha('#2E7D32', 0.12), color: '#2E7D32' },
                              warning: { bg: alpha('#F59E0B', 0.16), color: '#B45309' },
                              error: { bg: alpha('#D32F2F', 0.12), color: '#D32F2F' },
                            }[badge.tone];
                            return (
                              <Chip
                                size="small"
                                label={badge.label}
                                aria-label={`Statut du paiement : ${badge.label}`}
                                sx={{
                                  bgcolor: c.bg,
                                  color: c.color,
                                  fontWeight: 600,
                                  fontSize: 14,
                                }}
                              />
                            );
                          })()}
                        </Grid>
                        {invoice.payment.method && (
                          <Grid size={{ xs: 12, sm: 6 }}>
                            <Typography sx={{ fontSize: 14, color: BRAND.muted, mb: 0.5 }}>Moyen</Typography>
                            <Typography sx={{ fontSize: 16, color: BRAND.dark }}>
                              {getInvoicePaymentMethodLabel(invoice.payment.method)}
                            </Typography>
                          </Grid>
                        )}
                        {invoice.payment.transaction_reference && (
                          <Grid size={{ xs: 12, sm: 6 }}>
                            <Typography sx={{ fontSize: 14, color: BRAND.muted, mb: 0.5 }}>Référence</Typography>
                            <Typography sx={{ fontSize: 16, color: BRAND.dark }}>
                              {invoice.payment.transaction_reference}
                            </Typography>
                          </Grid>
                        )}
                        {Number(invoice.payment.paid_amount) > 0 && (
                          <Grid size={{ xs: 12, sm: 6 }}>
                            <Typography sx={{ fontSize: 14, color: BRAND.muted, mb: 0.5 }}>Montant payé</Typography>
                            <Typography sx={{ fontSize: 16, fontWeight: 600, color: BRAND.dark }}>
                              {formatFcfa(Number(invoice.payment.paid_amount) || 0)}
                            </Typography>
                          </Grid>
                        )}
                        {Number(invoice.payment.amount_remaining) > 0 && (
                          <Grid size={{ xs: 12, sm: 6 }}>
                            <Typography sx={{ fontSize: 14, color: BRAND.muted, mb: 0.5 }}>Reste à payer</Typography>
                            <Typography sx={{ fontSize: 16, fontWeight: 600, color: '#B45309' }}>
                              {formatFcfa(Number(invoice.payment.amount_remaining) || 0)}
                            </Typography>
                          </Grid>
                        )}
                      </Grid>
                    </Paper>
                  </Box>
                )}
              </Stack>
            </DialogContent>
            <DialogActions
              sx={{
                px: 3,
                pb: 3,
                pt: 0,
                display: 'flex',
                flexWrap: 'wrap',
                gap: 1.5,
                justifyContent: 'flex-end',
              }}
            >
              <Button
                onClick={handleCloseInvoiceDialog}
                sx={{
                  color: BRAND.muted,
                  textTransform: 'none',
                  fontWeight: 600,
                }}
              >
                Fermer
              </Button>
              <Button
                onClick={handleSendInvoiceWhatsapp}
                disabled={whatsappSending}
                startIcon={<WhatsAppIcon />}
                variant="outlined"
                sx={{
                  color: '#128C7E',
                  borderColor: '#128C7E',
                  textTransform: 'none',
                  fontWeight: 600,
                  borderRadius: '10px',
                  '&:hover': {
                    borderColor: '#075E54',
                    bgcolor: alpha('#128C7E', 0.08),
                  },
                }}
              >
                WhatsApp
              </Button>
              <Button
                onClick={handleViewInvoicePdf}
                loading={pdfViewing}
                loadingPosition="start"
                startIcon={<PictureAsPdfIcon />}
                sx={{
                  color: BRAND.primary,
                  textTransform: 'none',
                  fontWeight: 600,
                  borderRadius: '10px',
                }}
              >
                Voir le PDF
              </Button>
              <Button
                onClick={handleDownloadInvoicePdf}
                loading={pdfDownloading}
                loadingPosition="start"
                startIcon={<DownloadIcon />}
                variant="contained"
                sx={{
                  bgcolor: BRAND.primary,
                  textTransform: 'none',
                  fontWeight: 600,
                  borderRadius: '10px',
                  px: 3,
                  '&:hover': {
                    bgcolor: BRAND.dark,
                  },
                }}
              >
                Télécharger la facture (PDF)
              </Button>
            </DialogActions>
          </>
        ) : null}
      </Dialog>

      {/* Snackbar Alert */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%', borderRadius: '10px' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Paper>
  );
}
