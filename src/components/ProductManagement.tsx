import { useState, useEffect, useCallback } from 'react';
import {
  Add as Plus,
  Edit,
  Delete as Trash2,
  Visibility as Eye,
  CloudUpload as Upload,
  Close as X,
  Image as ImageIcon,
  Inventory as Package,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';
import {
  Button,
  TextField,
  Typography,
  Card,
  CardContent,
  CardActions,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  IconButton,
  Chip,
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  Alert,
  useTheme,
  useMediaQuery,
  Paper,
  InputAdornment,
  Select as MuiSelect,
  Pagination,
  Grid,
  Stack,
  Switch,
  FormControlLabel,
  CircularProgress,
  Divider
} from '@mui/material';
import { styled, alpha } from '@mui/material/styles';
import { enqueueSnackbar } from 'notistack';
import { productService } from '../services/product.service';
import { categoryService, Category } from '../services/category.service';
import { Product, ProductStatus, CreateProductData } from '../types/product';
import { ProductImage } from './ProductImage';
import { BRAND_BLUE } from '@/theme';
import { formatFcfa } from '@/lib/format';

const BRAND = {
  primary: BRAND_BLUE,
  dark: '#042C53',
  white: '#FFFFFF',
  light: '#E6F1FB',
  surface: '#F5F9FE',
  border: '#D4E8F7',
  muted: '#5F6B7A',
} as const;

const primaryBtnSx = {
  bgcolor: BRAND.primary,
  borderRadius: '12.5px',
  textTransform: 'none' as const,
  fontWeight: 600,
  boxShadow: 'none',
  '&:hover': { bgcolor: BRAND.dark, boxShadow: 'none' },
};

const StyledCard = styled(Card)(() => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  borderRadius: '20px',
  border: `1px solid ${BRAND.border}`,
  overflow: 'hidden',
  transition: 'box-shadow 0.25s ease, transform 0.25s ease',
  '&:hover': {
    transform: 'translateY(-3px)',
    boxShadow: `0 12px 28px ${alpha(BRAND.primary, 0.12)}`,
    '& .product-image-overlay': { opacity: 1 },
  },
}));

const ProductImageOverlay = styled(Box)(({ theme }: any) => ({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.7) 100%)',
  opacity: 0,
  transition: 'opacity 0.3s ease-in-out',
  display: 'flex',
  alignItems: 'flex-end',
  padding: theme.spacing(2),
}));

export function ProductManagement() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // State
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Validation state
  const [validationErrors, setValidationErrors] = useState<{
    sku?: string;
    name?: string;
  }>({});

  // Pagination & Filters
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(12);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({
    search: '',
    category_id: '' as string | number,
    status: '' as ProductStatus | '',
  });

  // Dialogs
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  // Form Data
  const [formData, setFormData] = useState<Partial<CreateProductData>>({
    name: '',
    sku: '',
    slug: '',
    description: '',
    short_description: '',
    price: 0,
    original_price: 0,
    wholesale_price: 0,
    inventory_quantity: 0,
    pieces: 1,
    status: ProductStatus.ACTIVE,
    category_id: 0,
    meta_title: '',
  });

  // Image Handling
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [galleryImages, setGalleryImages] = useState<File[]>([]);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch Data
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await productService.getProducts({
        search: filters.search || undefined,
        category_id: filters.category_id ? Number(filters.category_id) : undefined,
        status: filters.status || undefined,
        skip: (page - 1) * limit,
        limit,
      });
      
      // Gérer le nouveau format de retour { data, error }
      if (response.error) {
        console.error('Error fetching products:', response.error);
        setProducts([]);
        setTotal(0);
      } else {
        setProducts(response.data?.items || []);
        setTotal(response.data?.total || 0);
      }
    } catch (err: any) {
      setError(err.message);
      setProducts([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, limit, filters]);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await categoryService.getCategories({ limit: 100 });
      
      // Gérer le nouveau format de retour { data, error }
      if (response.error) {
        console.error('Error fetching categories:', response.error);
        setCategories([]);
      } else {
        setCategories(response.data?.items || []);
      }
    } catch (err) {
      console.error('Failed to fetch categories', err);
      setCategories([]);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Handlers
  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      sku: '',
      slug: '',
      description: '',
      short_description: '',
      price: 0,
      original_price: 0,
      wholesale_price: 0,
      inventory_quantity: 0,
      pieces: 1,
      category_id: 0,
      status: ProductStatus.ACTIVE,
      meta_title: '',
    });
    setCoverImage(null);
    setGalleryImages([]);
    setCoverPreview(null);
    setGalleryPreviews([]);
  };

  // Vérifier l'unicité du SKU et du nom
  const checkUniqueness = async (sku: string, name: string, excludeId?: string) => {
    try {
      const response = await productService.getProducts({ search: sku });
      
      // Gérer le nouveau format de retour { data, error }
      const skuItems = response.error ? [] : response.data?.items || [];
      const skuExists = skuItems.some(p =>
        p.sku.toLowerCase() === sku.toLowerCase() && (!excludeId || p.id !== excludeId)
      );

      const nameResponse = await productService.getProducts({ search: name });
      const nameItems = nameResponse.error ? [] : nameResponse.data?.items || [];
      const nameExists = nameItems.some(p =>
        p.name.toLowerCase() === name.toLowerCase() && (!excludeId || p.id !== excludeId)
      );

      return { skuExists, nameExists };
    } catch (error) {
      return { skuExists: false, nameExists: false };
    }
  };

  // Générer un SKU unique
  const generateUniqueSKU = (baseName: string) => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 4);
    const cleanName = baseName.toUpperCase().replace(/[^A-Z0-9]/g, '_').substr(0, 8);
    return `${cleanName}_${timestamp}_${random}`;
  };

  const openAddDialog = () => {
    resetForm();
    setIsAddDialogOpen(true);
  };

  const openEditDialog = async (product: Product) => {
    try {
      setLoading(true);
      // Récupérer les détails complets pour avoir les images de la galerie
      const fullProduct = await productService.getProductById(product.id);

      // S'assurer que les images sont chargées (soit via include, soit via fetch séparé)
      if (!fullProduct.images || fullProduct.images.length === 0) {
        const images = await productService.getProductImages(product.id);
        fullProduct.images = images || [];
      }

      setSelectedProduct(fullProduct);
      setFormData({
        name: fullProduct.name,
        sku: fullProduct.sku,
        slug: fullProduct.slug,
        description: fullProduct.description,
        short_description: fullProduct.short_description,
        price: fullProduct.price,
        original_price: fullProduct.compare_price || undefined,
        category_id: fullProduct.category_id,
        status: fullProduct.status,
        is_featured: fullProduct.popular || false,
        is_new: true,
        min_order_quantity: 1,
      });
      
      // Initialiser l'image de couverture existante
      setCoverPreview(fullProduct.cover_image_url || null);
      setCoverImage(null);
      setGalleryImages([]);
      setGalleryPreviews([]);
      
      setIsEditDialogOpen(true);
    } catch (err: any) {
      console.error('Erreur lors de la récupération du produit:', err);
      enqueueSnackbar('Erreur lors de la récupération des détails du produit', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const openViewDialog = async (product: Product) => {
    try {
      setLoading(true);
      const fullProduct = await productService.getProductById(product.id);

      // S'assurer que les images sont chargées
      if (!fullProduct.images || fullProduct.images.length === 0) {
        const images = await productService.getProductImages(product.id);
        fullProduct.images = images || [];
      }

      setSelectedProduct(fullProduct);
      setIsViewDialogOpen(true);
    } catch (err: any) {
      console.error('Erreur lors de la récupération du produit:', err);
      enqueueSnackbar('Erreur lors de la récupération des détails du produit', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: 'cover' | 'gallery') => {
    if (e.target.files && e.target.files.length > 0) {
      if (type === 'cover') {
        const file = e.target.files[0];
        setCoverImage(file);
        setCoverPreview(URL.createObjectURL(file));
      } else {
        const files = Array.from(e.target.files);
        setGalleryImages(prev => [...prev, ...files]);
        const newPreviews = files.map(f => URL.createObjectURL(f));
        setGalleryPreviews(prev => [...prev, ...newPreviews]);
      }
    }
  };

  const removeGalleryImage = (index: number) => {
    setGalleryImages(galleryImages.filter((_, i) => i !== index));
    setGalleryPreviews(galleryPreviews.filter((_, i) => i !== index));
  };

  const handleDeleteCoverImage = async () => {
    if (!selectedProduct) return;
    if (confirm('Voulez-vous supprimer l\'image de couverture de ce produit ?')) {
      try {
        await productService.deleteProductCoverImage(selectedProduct.id);
        setCoverPreview(null);
        setCoverImage(null);
        setSelectedProduct({ ...selectedProduct, cover_image_url: '' });
        enqueueSnackbar('Image de couverture supprimée', { variant: 'success' });
      } catch (err: any) {
        enqueueSnackbar('Erreur lors de la suppression de l\'image de couverture', { variant: 'error' });
      }
    }
  };

  const handleCreateProduct = async () => {
    if (!formData.name || !formData.price || !formData.category_id) {
      enqueueSnackbar('Veuillez remplir les champs obligatoires', { variant: 'error' });
      return;
    }

    try {
      setIsSubmitting(true);

      // Générer un SKU unique si non fourni
      const sku = formData.sku || generateUniqueSKU(formData.name);

      // Vérifier l'unicité
      const { skuExists, nameExists } = await checkUniqueness(sku, formData.name);

      if (skuExists) {
        enqueueSnackbar('Un produit avec ce SKU existe déjà', { variant: 'error' });
        return;
      }

      if (nameExists) {
        enqueueSnackbar('Un produit avec ce nom existe déjà', { variant: 'error' });
        return;
      }

      const data: CreateProductData = {
        name: formData.name!,
        sku,
        slug: formData.slug || formData.name!.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''),
        description: formData.description,
        short_description: formData.short_description,
        price: Number(formData.price),
        original_price: formData.original_price ? Number(formData.original_price) : undefined,
        wholesale_price: formData.wholesale_price ? Number(formData.wholesale_price) : undefined,
        inventory_quantity: Number(formData.inventory_quantity),
        pieces: Number(formData.pieces),
        category_id: Number(formData.category_id),
        status: formData.status,
        meta_title: formData.meta_title,
        is_featured: false,
        is_new: true,
        min_order_quantity: 1,
      };

      const newProduct = await productService.createProduct(data);

      if (coverImage) {
        await productService.uploadCoverImage(newProduct.id, coverImage);
      }

      for (let i = 0; i < galleryImages.length; i++) {
        await productService.uploadGalleryImage(newProduct.id, galleryImages[i], i);
      }

      enqueueSnackbar('Produit créé avec succès', { variant: 'success' });
      setIsAddDialogOpen(false);
      resetForm();
      fetchProducts();
    } catch (err: any) {
      console.error('Erreur création produit:', err);

      // Gérer les erreurs spécifiques
      if (err.status === 409) {
        enqueueSnackbar('Conflit de données : SKU ou nom déjà utilisé', { variant: 'error' });
      } else if (err.status === 400 && err.message?.includes('already exists')) {
        enqueueSnackbar('Ce produit existe déjà dans la base de données', { variant: 'error' });
      } else if (err.message?.includes('UPDATE_FAILED')) {
        enqueueSnackbar('Échec de la mise à jour : vérifiez que toutes les données sont valides', { variant: 'error' });
      } else {
        enqueueSnackbar(err.message || 'Erreur lors de la création', { variant: 'error' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateProduct = async () => {
    if (!selectedProduct) return;

    try {
      setIsSubmitting(true);

      // Vérifier l'unicité si SKU ou nom modifié
      if (formData.sku && formData.sku !== selectedProduct.sku || formData.name && formData.name !== selectedProduct.name) {
        const { skuExists, nameExists } = await checkUniqueness(
          formData.sku || selectedProduct.sku,
          formData.name || selectedProduct.name,
          selectedProduct.id
        );

        if (skuExists) {
          enqueueSnackbar('Un produit avec ce SKU existe déjà', { variant: 'error' });
          return;
        }

        if (nameExists) {
          enqueueSnackbar('Un produit avec ce nom existe déjà', { variant: 'error' });
          return;
        }
      }

      await productService.updateProduct(selectedProduct.id, {
        name: formData.name,
        sku: formData.sku,
        slug: formData.slug,
        description: formData.description,
        short_description: formData.short_description,
        price: Number(formData.price),
        original_price: formData.original_price ? Number(formData.original_price) : undefined,
        wholesale_price: formData.wholesale_price ? Number(formData.wholesale_price) : undefined,
        inventory_quantity: Number(formData.inventory_quantity),
        pieces: Number(formData.pieces),
        category_id: Number(formData.category_id),
        status: formData.status,
        meta_title: formData.meta_title,
      });

      if (coverImage) {
        await productService.uploadCoverImage(selectedProduct.id, coverImage);
      }

      for (let i = 0; i < galleryImages.length; i++) {
        await productService.uploadGalleryImage(selectedProduct.id, galleryImages[i], i);
      }

      enqueueSnackbar('Produit mis à jour', { variant: 'success' });
      setIsEditDialogOpen(false);
      setSelectedProduct(null);
      fetchProducts();
    } catch (err: any) {
      console.error('Erreur mise à jour produit:', err);

      // Gérer les erreurs 409 (Conflict) et 400 (Bad Request)
      if (err.status === 409) {
        enqueueSnackbar('Conflit de données : SKU ou nom déjà utilisé', { variant: 'error' });
      } else if (err.status === 400 && err.message?.includes('already exists')) {
        enqueueSnackbar('Ce produit existe déjà dans la base de données', { variant: 'error' });
      } else {
        enqueueSnackbar(err.message, { variant: 'error' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProduct = async () => {
    if (!productToDelete) return;
    try {
      await productService.deleteProduct(productToDelete.id);
      enqueueSnackbar('Produit supprimé', { variant: 'success' });
      setDeleteDialogOpen(false);
      setProductToDelete(null);
      fetchProducts();
    } catch (err: any) {
      console.error('Erreur suppression produit:', err);

      // Gérer les erreurs spécifiques de suppression
      if (err.message?.includes('référencé par d\'autres éléments')) {
        enqueueSnackbar('Impossible de supprimer ce produit : il est utilisé dans des commandes ou paniers', { variant: 'error' });
      } else if (err.message?.includes('DELETION_FAILED')) {
        enqueueSnackbar('Ce produit ne peut pas être supprimé car il est lié à des commandes ou autres données', { variant: 'error' });
      } else if (err.message?.includes('constraint') || err.message?.includes('foreign key')) {
        enqueueSnackbar('Ce produit ne peut pas être supprimé car il est lié à d\'autres données', { variant: 'error' });
      } else {
        enqueueSnackbar(err.message || 'Erreur lors de la suppression', { variant: 'error' });
      }
    }
  };

  const getCategoryName = (id: number) => {
    const cat = Array.isArray(categories) ? categories.find(c => c.id === id) : null;
    return cat ? cat.name : 'Inconnue';
  };

  const discountPercentage = (price: number, original?: number) => {
    if (!original || original <= price) return 0;
    return Math.round(((original - price) / original) * 100);
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Paper
        elevation={0}
        sx={{
          mb: 2.5,
          p: { xs: 2, sm: 2.5 },
          borderRadius: '20px',
          border: `1px solid ${BRAND.border}`,
          bgcolor: BRAND.light,
          display: 'flex',
          flexWrap: 'wrap',
          gap: 2,
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Box>
          <Typography sx={{ fontSize: { xs: 25, sm: 30 }, fontWeight: 700, color: BRAND.dark }}>
            Gestion des produits
          </Typography>
          <Typography sx={{ fontSize: 18, color: BRAND.muted, mt: 0.5 }}>
            Catalogue de {total} produit{total !== 1 ? 's' : ''}
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Plus />}
          onClick={openAddDialog}
          sx={{ ...primaryBtnSx, px: 2.5, py: 1.1 }}
        >
          Nouveau produit
        </Button>
      </Paper>

      <Paper
        elevation={0}
        sx={{
          mb: 2.5,
          borderRadius: '20px',
          border: `1px solid ${BRAND.border}`,
          bgcolor: BRAND.white,
          overflow: 'hidden',
        }}
      >
        <Box sx={{ px: 2.5, py: 2, borderBottom: `1px solid ${BRAND.border}`, bgcolor: BRAND.surface }}>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <FilterIcon sx={{ color: BRAND.primary, fontSize: 25 }} />
            <Typography sx={{ fontSize: 19, fontWeight: 700, color: BRAND.dark }}>
              Filtres et recherche
            </Typography>
          </Stack>
        </Box>
        <Box sx={{ p: 2.5 }}>
        <Grid container spacing={2} sx={{ alignItems: 'center' }}>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              placeholder="Rechercher un produit..."
              value={filters.search || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFilterChange('search', e.target.value)}
              slotProps={{
                input: {
                  startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />,
                },
              }}
              size="small"
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12.5px', bgcolor: BRAND.surface } }}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Catégorie</InputLabel>
              <MuiSelect
                value={filters.category_id || ''}
                label="Catégorie"
                onChange={(e: any) => handleFilterChange('category_id', e.target.value)}
              >
                <MenuItem value="">Toutes</MenuItem>
                {Array.isArray(categories) && categories.map(cat => (
                  <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>
                ))}
              </MuiSelect>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Statut</InputLabel>
              <MuiSelect
                value={filters.status || ''}
                label="Statut"
                onChange={(e: any) => handleFilterChange('status', e.target.value)}
              >
                <MenuItem value="">Tous</MenuItem>
                <MenuItem value={ProductStatus.ACTIVE}>Active</MenuItem>
                <MenuItem value={ProductStatus.DRAFT}>Brouillon</MenuItem>
                <MenuItem value={ProductStatus.ARCHIVED}>Archivé</MenuItem>
                <MenuItem value={ProductStatus.OUT_OF_STOCK}>Rupture</MenuItem>
              </MuiSelect>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, md: 2 }}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              fullWidth
              onClick={fetchProducts}
              sx={{
                borderRadius: '12.5px',
                textTransform: 'none',
                fontWeight: 600,
                borderColor: BRAND.border,
                color: BRAND.dark,
                py: 1,
                '&:hover': { borderColor: BRAND.primary, bgcolor: alpha(BRAND.primary, 0.04) },
              }}
            >
              Actualiser
            </Button>
          </Grid>
        </Grid>
        </Box>
      </Paper>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress sx={{ color: BRAND.primary }} />
        </Box>
      ) : error ? (
        <Alert severity="error" variant="outlined" sx={{ animation: 'slideUp 0.35s ease-out', '@keyframes slideUp': { from: { opacity: 0, transform: 'translateY(-8px)' }, to: { opacity: 1, transform: 'translateY(0)' } } }}>{error}</Alert>
      ) : !Array.isArray(products) || products.length === 0 ? (
        <Paper elevation={0} sx={{ p: 6, textAlign: 'center', borderRadius: '20px', border: `1px solid ${BRAND.border}` }}>
          <Package sx={{ fontSize: 70, color: BRAND.border, mb: 1 }} />
          <Typography sx={{ fontSize: 20, fontWeight: 600, color: BRAND.muted }}>Aucun produit trouvé</Typography>
        </Paper>
      ) : (
        <>
          <Grid container spacing={2.5}>
            {products.map((product) => (
              <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={product.id}>
                <StyledCard>
                  <Box sx={{ position: 'relative', pt: '100%', bgcolor: 'action.hover' }}>
                    <ProductImage
                      src={product.cover_image_url || undefined}
                      alt={product.name}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                    />
                    <ProductImageOverlay className="product-image-overlay">
                      <Typography variant="h6" color="white" fontWeight="bold">
                        {formatFcfa(product.price)}
                      </Typography>
                    </ProductImageOverlay>
                    <Box sx={{ position: 'absolute', top: 8, left: 8, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      {product.status !== ProductStatus.ACTIVE && (
                        <Chip label={product.status} color="default" size="small" />
                      )}
                      {discountPercentage(product.price, product.original_price) > 0 && (
                        <Chip
                          label={`-${discountPercentage(product.price, product.original_price)}%`}
                          color="error"
                          size="small"
                        />
                      )}
                    </Box>
                  </Box>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      {getCategoryName(product.category_id)}
                    </Typography>
                    <Typography variant="subtitle1" fontWeight={600} noWrap title={product.name}>
                      {product.name}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                      <Typography variant="h6" sx={{ color: BRAND.primary, fontWeight: 700 }}>
                        {formatFcfa(product.price)}
                      </Typography>
                      {product.original_price && product.original_price > product.price && (
                        <Typography variant="caption" sx={{ textDecoration: 'line-through', color: 'text.disabled' }}>
                          {formatFcfa(product.original_price)}
                        </Typography>
                      )}
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        Stock: {product.inventory_quantity}
                      </Typography>
                      {product.wholesale_price && (
                        <Typography variant="caption" color="success.main">
                          Grossiste: {formatFcfa(product.wholesale_price)}
                        </Typography>
                      )}
                    </Box>
                  </CardContent>
                  <CardActions sx={{ p: 1.5, pt: 0, borderTop: `1px solid ${BRAND.border}`, justifyContent: 'flex-end', gap: 0.5 }}>
                    <IconButton size="small" onClick={() => openViewDialog(product)} sx={{ color: BRAND.muted, '&:hover': { bgcolor: alpha(BRAND.primary, 0.08), color: BRAND.primary } }}>
                      <Eye fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => openEditDialog(product)} sx={{ color: BRAND.primary, '&:hover': { bgcolor: alpha(BRAND.primary, 0.1) } }}>
                      <Edit fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => { setProductToDelete(product); setDeleteDialogOpen(true); }} sx={{ color: '#DC2626', '&:hover': { bgcolor: alpha('#DC2626', 0.08) } }}>
                      <Trash2 fontSize="small" />
                    </IconButton>
                  </CardActions>
                </StyledCard>
              </Grid>
            ))}
          </Grid>

          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
            <Pagination
              count={Math.ceil(total / limit)}
              page={page}
              onChange={handlePageChange}
              sx={{
                '& .MuiPaginationItem-root.Mui-selected': {
                  bgcolor: BRAND.primary,
                  color: BRAND.white,
                  '&:hover': { bgcolor: BRAND.dark },
                },
              }}
            />
          </Box>
        </>
      )}

      <Dialog
        open={isAddDialogOpen || isEditDialogOpen}
        onClose={() => { setIsAddDialogOpen(false); setIsEditDialogOpen(false); }}
        maxWidth="md"
        fullWidth
        scroll="paper"
        slotProps={{
          paper: {
            sx: {
              borderRadius: '25px',
              overflow: 'hidden',
              border: `1px solid ${BRAND.border}`,
              boxShadow: `0 24px 64px ${alpha(BRAND.dark, 0.2)}`,
              maxHeight: '92vh',
              display: 'flex',
              flexDirection: 'column',
            },
          },
        }}
      >
        <Box
          sx={{
            px: 3,
            py: 2.5,
            bgcolor: BRAND.dark,
            color: BRAND.white,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
          }}
        >
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
            <Box
              sx={{
                width: 55,
                height: 55,
                borderRadius: '15px',
                bgcolor: alpha(BRAND.white, 0.12),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {isAddDialogOpen ? <Plus /> : <Edit />}
            </Box>
            <Box>
              <Typography sx={{ fontWeight: 800, fontSize: '1.15rem', letterSpacing: '-0.02em' }}>
                {isAddDialogOpen ? 'Nouveau produit' : 'Modifier le produit'}
              </Typography>
              <Typography sx={{ fontSize: 16, color: alpha(BRAND.white, 0.72) }}>
                {isAddDialogOpen ? 'Ajoutez une référence à votre catalogue' : formData.name || 'Mettre à jour les informations'}
              </Typography>
            </Box>
          </Stack>
          <IconButton
            onClick={() => { setIsAddDialogOpen(false); setIsEditDialogOpen(false); }}
            aria-label="Fermer"
            size="small"
            sx={{ color: alpha(BRAND.white, 0.85), '&:hover': { bgcolor: alpha(BRAND.white, 0.1) } }}
          >
            <X fontSize="small" />
          </IconButton>
        </Box>

        <DialogContent sx={{ p: { xs: 2.5, md: 4 }, bgcolor: BRAND.surface, flex: 1, overflowY: 'auto' }}>
          <Grid container spacing={4}>
            {/* SECTION: INFORMATIONS GÉNÉRALES */}
            <Grid size={{ xs: 12 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                <Box sx={{
                  width: 50,
                  height: 50,
                  borderRadius: 2,
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Package sx={{ color: 'primary.main', fontSize: 25 }} />
                </Box>
                <Box>
                  <Typography variant="subtitle1" fontWeight={700} color="text.primary">
                    Informations Générales
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Détails essentiels du produit
                  </Typography>
                </Box>
              </Box>
              <Divider sx={{ mb: 3 }} />
            </Grid>

            {/* Ligne 1: Nom & Catégorie */}
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Nom du produit"
                placeholder="Ex: iPhone 15 Pro"
                value={formData.name || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, name: e.target.value })}
                required
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: 'background.paper',
                    '&:hover': {
                      bgcolor: 'background.paper',
                    }
                  }
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth required>
                <InputLabel>Catégorie</InputLabel>
                <MuiSelect
                  value={formData.category_id || ''}
                  label="Catégorie"
                  onChange={(e: any) => setFormData({ ...formData, category_id: Number(e.target.value) })}
                  sx={{ bgcolor: 'background.paper' }}
                >
                  {Array.isArray(categories) && categories.map(cat => (
                    <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>
                  ))}
                </MuiSelect>
              </FormControl>
            </Grid>

            {/* Ligne 2: SKU & Slug */}
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="SKU"
                placeholder="Ex: IPHONE15PRO001"
                value={formData.sku || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, sku: e.target.value })}
                sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'background.paper' } }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Slug (URL)"
                placeholder="Ex: iphone-15-pro"
                value={formData.slug || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, slug: e.target.value })}
                sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'background.paper' } }}
              />
            </Grid>

            {/* Ligne 3: Stock & Pièces */}
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                type="number"
                label="Nombre de pièces"
                value={formData.pieces || 1}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, pieces: Number(e.target.value) })}
                sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'background.paper' } }}
              />
            </Grid>

            {/* Ligne 4: Statut & Meta Title */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Paper
                variant="outlined"
                sx={{
                  height: '56px',
                  display: 'flex',
                  alignItems: 'center',
                  px: 2,
                  bgcolor: formData.status === ProductStatus.ACTIVE
                    ? alpha(theme.palette.success.main, 0.05)
                    : alpha(theme.palette.grey[500], 0.05),
                  borderColor: formData.status === ProductStatus.ACTIVE
                    ? alpha(theme.palette.success.main, 0.3)
                    : 'divider',
                  transition: 'all 0.2s'
                }}
              >
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.status === ProductStatus.ACTIVE}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, status: e.target.checked ? ProductStatus.ACTIVE : ProductStatus.DRAFT })}
                      color="success"
                    />
                  }
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" fontWeight={600}>
                        {formData.status === ProductStatus.ACTIVE ? "Actif" : "Brouillon"}
                      </Typography>
                      <Chip
                        size="small"
                        label={formData.status === ProductStatus.ACTIVE ? "En ligne" : "Hors ligne"}
                        color={formData.status === ProductStatus.ACTIVE ? "success" : "default"}
                        sx={{ height: 20, fontSize: '0.65rem', fontWeight: 600 }}
                      />
                    </Box>
                  }
                />
              </Paper>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Titre Meta (SEO)"
                placeholder="Ex: Acheter iPhone 15 Pro au meilleur prix"
                value={formData.meta_title || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, meta_title: e.target.value })}
                sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'background.paper' } }}
              />
            </Grid>

            {/* Ligne 5: Short Description */}
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Description courte"
                placeholder="Ex: iPhone 15 Pro 256GB"
                value={formData.short_description || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, short_description: e.target.value })}
                sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'background.paper' } }}
              />
            </Grid>

            {/* Ligne 6: Description détaillée */}
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Description détaillée"
                placeholder="Spécifications techniques, processeur, écran..."
                value={formData.description || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, description: e.target.value })}
                sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'background.paper' } }}
              />
            </Grid>

            {/* SECTION: TARIFICATION */}
            <Grid size={{ xs: 12 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2, mt: 2 }}>
                <Box sx={{
                  width: 50,
                  height: 50,
                  borderRadius: 2,
                  bgcolor: alpha(theme.palette.success.main, 0.1),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Typography sx={{ color: 'success.main', fontSize: 25, fontWeight: 700 }}>FCFA</Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle1" fontWeight={700} color="text.primary">
                    Tarification
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Configuration des prix en Francs CFA
                  </Typography>
                </Box>
              </Box>
              <Divider sx={{ mb: 3 }} />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Card
                variant="outlined"
                sx={{
                  p: 3,
                  borderRadius: 2.5,
                  bgcolor: alpha(theme.palette.success.main, 0.02),
                  borderColor: alpha(theme.palette.success.main, 0.2),
                  boxShadow: `0 2px 8px ${alpha(theme.palette.success.main, 0.08)}`
                }}
              >
                <Grid container spacing={3}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Prix Public"
                      value={formData.price || 0}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, price: Number(e.target.value) })}
                      slotProps={{
                        input: {
                          endAdornment: <InputAdornment position="end"><Typography variant="body2" fontWeight={600} color="success.main">FCFA</Typography></InputAdornment>,
                        },
                      }}
                      required
                      sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'background.paper' } }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Prix Barré (Compare Price)"
                      placeholder="Ancien prix"
                      value={formData.original_price || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, original_price: Number(e.target.value) })}
                      slotProps={{
                        input: {
                          endAdornment: <InputAdornment position="end"><Typography variant="body2" fontWeight={600} color="text.secondary">FCFA</Typography></InputAdornment>,
                        },
                      }}
                      sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'background.paper' } }}
                    />
                  </Grid>
                </Grid>
              </Card>
            </Grid>

            {/* SECTION: MÉDIAS */}
            <Grid size={{ xs: 12 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2, mt: 2 }}>
                <Box sx={{
                  width: 50,
                  height: 50,
                  borderRadius: 2,
                  bgcolor: alpha(theme.palette.info.main, 0.1),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <ImageIcon sx={{ color: 'info.main', fontSize: 25 }} />
                </Box>
                <Box>
                  <Typography variant="subtitle1" fontWeight={700} color="text.primary">
                    Médias
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Images du produit
                  </Typography>
                </Box>
              </Box>
              <Divider sx={{ mb: 3 }} />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="body2" fontWeight={600} sx={{ mb: 1.5, color: 'text.secondary' }}>
                Image de couverture *
              </Typography>
              <Paper
                variant="outlined"
                sx={{
                  height: 250,
                  borderRadius: 2.5,
                  borderStyle: 'dashed',
                  borderWidth: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: alpha(theme.palette.action.hover, 0.3),
                  transition: 'all 0.2s',
                  '&:hover': {
                    borderColor: 'primary.main',
                    bgcolor: alpha(theme.palette.primary.main, 0.05)
                  }
                }}
              >
                {coverPreview ? (
                  <Box sx={{ width: '100%', height: '100%', position: 'relative', p: 1 }}>
                    <img src={coverPreview} alt="Cover" style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 8 }} />
                    <Box sx={{ position: 'absolute', top: 12, right: 12, display: 'flex', gap: 1 }}>
                      <IconButton
                        size="small"
                        component="label"
                        sx={{
                          bgcolor: 'background.paper',
                          color: 'primary.main',
                          boxShadow: theme.shadows[2],
                          '&:hover': { bgcolor: 'primary.light', color: 'white' }
                        }}
                      >
                        <Upload fontSize="small" />
                        <input type="file" hidden accept="image/*" onChange={async (e: any) => {
                          if (e.target.files && e.target.files[0]) {
                            const file = e.target.files[0];
                            if (selectedProduct?.cover_image_url) {
                              try {
                                await productService.updateProductCoverImage(selectedProduct.id, file);
                                const updatedProduct = await productService.getProductById(selectedProduct.id);
                                setSelectedProduct(updatedProduct);
                                setCoverPreview(updatedProduct.cover_image_url || null);
                                setCoverImage(null);
                                enqueueSnackbar('Image de couverture mise à jour', { variant: 'success' });
                              } catch (err: any) {
                                enqueueSnackbar('Erreur lors de la mise à jour de l\'image', { variant: 'error' });
                              }
                            } else {
                              handleFileSelect(e, 'cover');
                            }
                          }
                        }} />
                      </IconButton>
                      <IconButton
                        size="small"
                        sx={{
                          bgcolor: 'background.paper',
                          color: 'error.main',
                          boxShadow: theme.shadows[2],
                          '&:hover': { bgcolor: 'error.main', color: 'white' }
                        }}
                        onClick={() => selectedProduct?.cover_image_url ? handleDeleteCoverImage() : (setCoverImage(null), setCoverPreview(null))}
                      >
                        <Trash2 fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>
                ) : (
                  <Button
                    component="label"
                    sx={{
                      width: '100%',
                      height: '100%',
                      flexDirection: 'column',
                      gap: 1.5,
                      color: 'text.secondary',
                      '&:hover': { color: 'primary.main' }
                    }}
                  >
                    <Upload sx={{ fontSize: 50, opacity: 0.6 }} />
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="body2" fontWeight={600}>Cliquer pour uploader</Typography>
                      <Typography variant="caption" color="text.disabled">PNG, JPG jusqu'à 5MB</Typography>
                    </Box>
                    <input type="file" hidden accept="image/*" onChange={(e: any) => handleFileSelect(e, 'cover')} />
                  </Button>
                )}
              </Paper>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="body2" fontWeight={600} sx={{ mb: 1.5, color: 'text.secondary' }}>
                Galerie (Optionnel)
              </Typography>
              <Paper
                variant="outlined"
                sx={{
                  height: 250,
                  borderRadius: 2.5,
                  borderStyle: 'dashed',
                  borderWidth: 2,
                  p: 2,
                  overflowY: 'auto',
                  bgcolor: alpha(theme.palette.action.hover, 0.3),
                  '&:hover': {
                    borderColor: 'primary.main',
                    bgcolor: alpha(theme.palette.primary.main, 0.05)
                  }
                }}
              >
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                  <Button
                    component="label"
                    variant="outlined"
                    sx={{
                      width: 88,
                      height: 88,
                      borderRadius: 2,
                      borderStyle: 'dashed',
                      borderWidth: 2,
                      p: 0,
                      minWidth: 0,
                      bgcolor: 'background.paper',
                      '&:hover': {
                        borderColor: 'primary.main',
                        bgcolor: alpha(theme.palette.primary.main, 0.05)
                      }
                    }}
                  >
                    <Plus sx={{ fontSize: 30, opacity: 0.6 }} />
                    <input type="file" hidden multiple accept="image/*" onChange={(e: any) => handleFileSelect(e, 'gallery')} />
                  </Button>
                  {[...(selectedProduct?.images && Array.isArray(selectedProduct.images) ? selectedProduct.images : []), ...galleryPreviews.map((p, i) => ({ id: `new-${i}`, image_url: p, isNew: true }))].map((img: any, idx) => (
                    <Box
                      key={img.id}
                      sx={{
                        width: 88,
                        height: 88,
                        borderRadius: 2,
                        overflow: 'hidden',
                        position: 'relative',
                        border: `2px solid ${theme.palette.divider}`,
                        '&:hover': {
                          borderColor: 'primary.main'
                        }
                      }}
                    >
                      <ProductImage
                        src={img.image_url}
                        alt="Gallery"
                        width={70}
                        height={70}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      <IconButton
                        size="small"
                        sx={{
                          position: 'absolute',
                          top: 2,
                          right: 2,
                          p: 0.3,
                          bgcolor: 'rgba(0,0,0,0.7)',
                          color: 'white',
                          '&:hover': { bgcolor: 'error.main' }
                        }}
                        onClick={async () => {
                          if (img.isNew) {
                            removeGalleryImage(idx - (selectedProduct?.images && Array.isArray(selectedProduct.images) ? selectedProduct.images.length : 0));
                          } else {
                            if (confirm('Supprimer cette image de la galerie ?')) {
                              try {
                                await productService.deleteProductImage(selectedProduct!.id, img.id);
                                // Mettre à jour localement selectedProduct.images
                                if (selectedProduct) {
                                  const updatedImages = selectedProduct.images?.filter(i => i.id !== img.id) || [];
                                  setSelectedProduct({ ...selectedProduct, images: updatedImages });
                                }
                                enqueueSnackbar('Image supprimée de la galerie', { variant: 'success' });
                              } catch (err: any) {
                                enqueueSnackbar('Erreur lors de la suppression de l\'image', { variant: 'error' });
                              }
                            }
                          }
                        }}
                      >
                        <Trash2 sx={{ fontSize: 18 }} />
                      </IconButton>
                      {!img.isNew && (
                        <IconButton
                          size="small"
                          component="label"
                          sx={{
                            position: 'absolute',
                            bottom: 2,
                            right: 2,
                            p: 0.3,
                            bgcolor: 'rgba(25, 118, 210, 0.7)',
                            color: 'white',
                            '&:hover': { bgcolor: 'primary.main' }
                          }}
                        >
                          <Upload sx={{ fontSize: 18 }} />
                          <input type="file" hidden accept="image/*" onChange={async (e: any) => {
                            if (e.target.files && e.target.files[0] && selectedProduct) {
                              const file = e.target.files[0];
                              const previewUrl = URL.createObjectURL(file);
                              const oldId = img.id;

                              // 1. Mettre à jour localement immédiatement pour garder la position
                              const updatedImages: any[] = [...(selectedProduct.images || [])];
                              const targetIdx = updatedImages.findIndex(i => i.id === oldId);

                              if (targetIdx !== -1) {
                                // Garder l'objet à la même place mais changer l'URL et marquer comme "en cours"
                                updatedImages[targetIdx] = { ...updatedImages[targetIdx], image_url: previewUrl, isReplacing: true };
                                setSelectedProduct({ ...selectedProduct, images: updatedImages });
                              }

                              try {
                                // 2. Opérations serveur
                                // Supprimer l'ancienne image
                                await productService.deleteProductImage(selectedProduct.id, oldId);
                                // Upload la nouvelle avec le même index de tri
                                await productService.uploadGalleryImage(selectedProduct.id, file, targetIdx);

                                // 3. Rafraîchir les données pour tout synchroniser (IDs, URLs finales)
                                const updatedProduct = await productService.getProductById(selectedProduct.id);
                                setSelectedProduct(updatedProduct);
                                enqueueSnackbar('Image mise à jour', { variant: 'success' });
                              } catch (err: any) {
                                console.error('Erreur remplacement image:', err);
                                enqueueSnackbar('Erreur lors du remplacement de l\'image', { variant: 'error' });
                                // En cas d'erreur, on pourrait rafraîchir pour restaurer l'état précédent
                                const restoredProduct = await productService.getProductById(selectedProduct.id);
                                setSelectedProduct(restoredProduct);
                              }
                            }
                          }} />
                        </IconButton>
                      )}
                      {img.isReplacing && (
                        <Box sx={{
                          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                          bgcolor: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                          <CircularProgress size={20} />
                        </Box>
                      )}
                    </Box>
                  ))}
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions
          sx={{
            px: 3,
            py: 2.5,
            bgcolor: BRAND.white,
            borderTop: `1px solid ${BRAND.border}`,
            flexShrink: 0,
            gap: 1,
          }}
        >
          <Button
            onClick={() => { setIsAddDialogOpen(false); setIsEditDialogOpen(false); }}
            sx={{ textTransform: 'none', fontWeight: 600, color: BRAND.muted, borderRadius: '12.5px' }}
          >
            Annuler
          </Button>
          <Button
            variant="contained"
            onClick={isAddDialogOpen ? handleCreateProduct : handleUpdateProduct}
            disabled={isSubmitting}
            sx={{ ...primaryBtnSx, px: 4, py: 1.1, fontWeight: 700, fontSize: '0.95rem' }}
          >
            {isSubmitting ? (
              <CircularProgress size={22} color="inherit" />
            ) : isAddDialogOpen ? (
              'Publier le produit'
            ) : (
              'Enregistrer les modifications'
            )}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={isViewDialogOpen} onClose={() => setIsViewDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" fontWeight={700} component="span">
            {selectedProduct?.name}
          </Typography>
          <Chip label={selectedProduct?.status?.toUpperCase()} color={selectedProduct?.status === ProductStatus.ACTIVE ? "success" : "default"} size="small" />
        </DialogTitle>
        <DialogContent dividers>
          {selectedProduct && (
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 5 }}>
                <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
                  <img
                    src={selectedProduct.cover_image_url || undefined}
                    alt={selectedProduct.name}
                    style={{ width: '100%', height: 350, objectFit: 'contain', backgroundColor: alpha(theme.palette.background.default, 0.5) }}
                  />
                </Paper>
                {selectedProduct?.images && Array.isArray(selectedProduct.images) && selectedProduct.images.length > 0 && (
                  <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {selectedProduct.images.map((img, i) => (
                      <Paper key={i} variant="outlined" sx={{ width: 75, height: 75, borderRadius: 1.5, overflow: 'hidden' }}>
                        <ProductImage src={img.image_url} alt={`Gallery ${i}`} width={60} height={60} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </Paper>
                    ))}
                  </Box>
                )}
              </Grid>
              <Grid size={{ xs: 12, md: 7 }}>
                <Stack spacing={2.5}>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 700, letterSpacing: 1 }}>Description courte</Typography>
                    <Typography variant="body1">{selectedProduct.short_description || 'Aucune description courte'}</Typography>
                  </Box>

                  <Grid container spacing={2}>
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 700, letterSpacing: 1 }}>Prix Public</Typography>
                      <Typography variant="h6" color="primary.main" fontWeight={800}>{formatFcfa(selectedProduct.price)}</Typography>
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 700, letterSpacing: 1 }}>Catégorie</Typography>
                      <Typography variant="body1" fontWeight={600}>{selectedProduct.category_name || 'Sans catégorie'}</Typography>
                    </Grid>
                  </Grid>

                  <Divider />

                  <Grid container spacing={2}>
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 700, letterSpacing: 1 }}>SKU</Typography>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace', bgcolor: 'action.hover', px: 1, borderRadius: 0.5 }}>{selectedProduct.sku}</Typography>
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 700, letterSpacing: 1 }}>URL (Slug)</Typography>
                      <Typography variant="body2">{selectedProduct.slug}</Typography>
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 700, letterSpacing: 1 }}>Stock / Pièces</Typography>
                      <Typography variant="body2">{selectedProduct.inventory_quantity} en stock ({selectedProduct.pieces} pcs)</Typography>
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 700, letterSpacing: 1 }}>SEO Title</Typography>
                      <Typography variant="body2" noWrap>{selectedProduct.meta_title || '-'}</Typography>
                    </Grid>
                  </Grid>

                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 700, letterSpacing: 1 }}>Description détaillée</Typography>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', color: 'text.secondary' }}>{selectedProduct.description}</Typography>
                  </Box>
                </Stack>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, bgcolor: 'background.default' }}>
          <Button onClick={() => setIsViewDialogOpen(false)} variant="outlined">Fermer</Button>
          <Button onClick={() => { setIsViewDialogOpen(false); openEditDialog(selectedProduct!); }} variant="contained">Modifier</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirmer la suppression</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Voulez-vous vraiment supprimer le produit "{productToDelete?.name}" ? Cette action est irréversible.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Annuler</Button>
          <Button onClick={handleDeleteProduct} color="error" variant="contained">
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>
    </Box >
  );
}
