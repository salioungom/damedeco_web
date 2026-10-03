'use client';

import { useState, useEffect, useMemo } from 'react';
import type { SelectChangeEvent } from '@mui/material/Select';
import {
  Box,
  Container,
  Typography,
  Button,
  Checkbox,
  FormControlLabel,
  Slider,
  alpha,
  Drawer,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Stack,
  IconButton,
  useTheme,
  useMediaQuery,
  CircularProgress,
  Divider,
  Chip,
} from '@mui/material';
import {
  FilterList as FilterIcon,
  Close as CloseIcon,
  LocalShipping,
  Category as CategoryType,
  GridView as GridViewIcon,
  ViewList as ListViewIcon,
  Search as SearchIcon,
  Tune as TuneIcon,
} from '@mui/icons-material';
import ProductCard from './ProductCard';
import { productService } from '../services/product.service';
import { homeService } from '../services/home.service';
import { Product, Category } from '../lib/types';
import { tokens } from '@/theme/tokens';
import { formatFcfa } from '@/lib/format';
import { NAVBAR_HEIGHT } from './Navigation';

// ─── Palette ──────────────────────────────────────────────────────────────────
const C = {
  primary: tokens.colors.brand.main,
  dark:    tokens.colors.surfaces.inverse,
  light:   tokens.colors.brand.soft,
  surface: tokens.colors.surfaces.default,
  border:  tokens.colors.border.light,
  mid:     tokens.colors.brand.main,
  muted:   tokens.colors.text.secondary,
  text:    tokens.colors.text.primary,
  paper:   tokens.colors.surfaces.paper,
} as const;

// ─── FilterSidebar (extracted outside ShopPage to prevent Slider remount crash) ──
interface FilterSidebarProps {
  categories: Category[];
  selectedCategories: string[];
  toggleCategory: (id: string) => void;
  priceRange: number[];
  setPriceRange: (v: number[]) => void;
  activeFiltersCount: number;
  resetFilters: () => void;
}

const FilterSidebar = ({ categories, selectedCategories, toggleCategory, priceRange, setPriceRange, activeFiltersCount, resetFilters }: FilterSidebarProps) => (
  <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
    <Box sx={{ px: 3, py: 2.5, borderBottom: `1px solid ${C.border}` }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TuneIcon sx={{ fontSize: 21.25, color: C.primary }} />
          <Typography sx={{ fontSize: 16.25, fontWeight: 600, color: C.dark }}>
            Filtres
          </Typography>
          {activeFiltersCount > 0 && (
            <Box sx={{ width: 22.5, height: 22.5, borderRadius: '50%', bgcolor: C.primary, color: C.paper, fontSize: 12.5, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {activeFiltersCount}
            </Box>
          )}
        </Box>
        {activeFiltersCount > 0 && (
          <Typography
            onClick={resetFilters}
            sx={{ fontSize: 15, color: C.primary, cursor: 'pointer', fontWeight: 500, '&:hover': { color: C.dark } }}
          >
            Réinitialiser
          </Typography>
        )}
      </Box>
    </Box>
    <Box sx={{ flex: 1, overflowY: 'auto', px: 3, py: 2 }}>
      <Box sx={{ mb: 3.5 }}>
        <Typography sx={{ fontSize: 13.75, fontWeight: 600, color: C.muted, letterSpacing: '1px', textTransform: 'uppercase', mb: 2 }}>
          Catégories
        </Typography>
        <Stack spacing={0.25}>
          {categories.slice(0, 8).map((cat) => {
            const active = selectedCategories.includes(cat.id);
            return (
              <Box
                key={cat.id}
                onClick={() => toggleCategory(cat.id)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  px: 1.25,
                  py: 0.875,
                  borderRadius: '10px',
                  cursor: 'pointer',
                  bgcolor: active ? alpha(C.primary, 0.08) : 'transparent',
                  border: `1px solid ${active ? alpha(C.primary, 0.3) : 'transparent'}`,
                  transition: 'all 0.15s',
                  '&:hover': { bgcolor: active ? alpha(C.primary, 0.1) : alpha(C.primary, 0.04) },
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                  <Box
                    sx={{
                      width: 25, height: 25,
                      borderRadius: '6.25px',
                      border: `2px solid ${active ? C.primary : C.border}`,
                      bgcolor: active ? C.primary : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0, transition: 'all 0.15s',
                      '&:hover': { borderColor: C.primary },
                    }}
                  >
                    {active && (
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M2.5 6L5 8.5L9.5 3.5" stroke={C.paper} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </Box>
                  <Typography sx={{ fontSize: 16.25, color: active ? C.primary : C.text, fontWeight: active ? 600 : 500 }}>
                    {cat.name}
                  </Typography>
                </Box>
                {cat.product_count !== undefined && (
                  <Typography sx={{ fontSize: 13.75, color: C.muted }}>{cat.product_count}</Typography>
                )}
              </Box>
            );
          })}
        </Stack>
      </Box>
      <Divider sx={{ borderColor: C.border, mb: 3 }} />
      <Box>
        <Typography sx={{ fontSize: 13.75, fontWeight: 600, color: C.muted, letterSpacing: '1px', textTransform: 'uppercase', mb: 2 }}>
          Prix (F CFA)
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, gap: 1 }}>
          <Box sx={{ flex: 1 }}>
            <Typography sx={{ fontSize: 12.5, color: C.muted, mb: 0.25 }}>Min</Typography>
            <Box
              component="input"
              type="text"
              inputMode="numeric"
              value={priceRange[0].toLocaleString('fr-FR')}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                const raw = e.target.value.replace(/\D/g, '');
                const v = raw ? Math.min(Number(raw), priceRange[1]) : 0;
                setPriceRange([v, priceRange[1]]);
              }}
              sx={{
                width: '100%',
                border: `1px solid ${C.border}`,
                borderRadius: '8.75px',
                px: 1,
                py: 0.5,
                fontSize: 15,
                fontWeight: 600,
                color: C.dark,
                textAlign: 'center',
                outline: 'none',
                '&:focus': { borderColor: C.primary, boxShadow: `0 0 0 2px ${alpha(C.primary, 0.1)}` },
              }}
            />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography sx={{ fontSize: 12.5, color: C.muted, mb: 0.25 }}>Max</Typography>
            <Box
              component="input"
              type="text"
              inputMode="numeric"
              value={priceRange[1].toLocaleString('fr-FR')}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                const raw = e.target.value.replace(/\D/g, '');
                const v = raw ? Math.min(Math.max(Number(raw), priceRange[0]), 150000) : 0;
                setPriceRange([priceRange[0], v]);
              }}
              sx={{
                width: '100%',
                border: `1px solid ${C.border}`,
                borderRadius: '8.75px',
                px: 1,
                py: 0.5,
                fontSize: 15,
                fontWeight: 600,
                color: C.dark,
                textAlign: 'center',
                outline: 'none',
                '&:focus': { borderColor: C.primary, boxShadow: `0 0 0 2px ${alpha(C.primary, 0.1)}` },
              }}
            />
          </Box>
        </Box>
        <Slider
          min={0}
          max={150000}
          step={5000}
          value={priceRange}
          onChange={(_: Event, v: number | number[]) => setPriceRange(v as number[])}
          sx={{
            color: C.primary,
            '& .MuiSlider-thumb': { width: 20, height: 20, border: `2px solid ${C.primary}`, bgcolor: C.paper, '&:hover': { boxShadow: `0 0 0 6px ${alpha(C.primary, 0.12)}` } },
            '& .MuiSlider-track': { height: 3.75 },
            '& .MuiSlider-rail': { height: 3.75, bgcolor: C.border },
          }}
        />
      </Box>
    </Box>
  </Box>
);

// ─── Props ────────────────────────────────────────────────────────────────────
interface ShopPageProps {
  onAddToCart: (product: Product) => void;
  onViewProduct: (product: Product) => void;
  userType: 'retail' | 'wholesale';
  initialCategory?: string;
  searchQuery?: string;
  favorites: string[];
  onToggleFavorite: (productId: string) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────
export function ShopPage({
  onAddToCart,
  onViewProduct,
  userType,
  initialCategory,
  searchQuery,
  favorites,
  onToggleFavorite,
}: ShopPageProps) {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('lg'));

  const [products,           setProducts]           = useState<Product[]>([]);
  const [categories,         setCategories]         = useState<Category[]>([]);
  const [loading,            setLoading]            = useState(true);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [priceRange,         setPriceRange]         = useState<number[]>([0, 150000]);
  const [sortBy,             setSortBy]             = useState<string>('popular');
  const [mobileOpen,         setMobileOpen]         = useState(false);
  const [mounted,            setMounted]            = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!mounted) return;
    const fetchData = async () => {
      try {
        setLoading(true);
        const [cats, prods] = await Promise.all([
          homeService.getActiveCategories(),
          productService.getProducts({ limit: 100 }),
        ]);
        setCategories(cats.error ? [] : cats.data || []);
        setProducts(prods.error ? [] : prods.data?.items || []);
      } catch (err) {
        console.error('Error fetching shop data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [mounted]);

  useEffect(() => {
    if (initialCategory) setSelectedCategories([initialCategory]);
  }, [initialCategory]);

  const toggleCategory = (id: string) => {
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const resetFilters = () => {
    setSelectedCategories([]);
    setPriceRange([0, 150000]);
  };

  const activeFiltersCount = selectedCategories.length + (priceRange[0] > 0 || priceRange[1] < 150000 ? 1 : 0);

  const filteredProducts = useMemo(() => {
    if (!products.length) return [];
    const query = (searchQuery || '').trim().toLowerCase();
    return products.filter((p) => {
      if (query) {
        const hay = `${p.name} ${p.description || ''} ${p.short_description || ''} ${p.category_name || ''} ${p.sku}`.toLowerCase();
        if (!hay.includes(query)) return false;
      }
      if (selectedCategories.length > 0 && !selectedCategories.includes(p.category_id.toString())) return false;
      const price = userType === 'wholesale' && p.wholesale_price ? p.wholesale_price : p.price;
      if (price < priceRange[0] || price > priceRange[1]) return false;
      return true;
    });
  }, [products, selectedCategories, priceRange, userType, searchQuery]);

  const sortedProducts = useMemo(() => {
    return [...filteredProducts].sort((a, b) => {
      const pa = userType === 'wholesale' && a.wholesale_price ? a.wholesale_price : a.price;
      const pb = userType === 'wholesale' && b.wholesale_price ? b.wholesale_price : b.price;
      if (sortBy === 'price-asc')  return pa - pb;
      if (sortBy === 'price-desc') return pb - pa;
      if (sortBy === 'name')       return a.name.localeCompare(b.name);
      return (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0);
    });
  }, [filteredProducts, sortBy, userType]);

  // ── Sidebar filtre ────────────────────────────────────────────────────────

  // ── Loading initial ────────────────────────────────────────────────────────
  if (!mounted) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <CircularProgress sx={{ color: C.primary }} />
      </Box>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <Box sx={{ width: '100%', bgcolor: C.paper, minHeight: '100vh' }}>

      {/* ── Barre haut de page ── */}
      <Box sx={{ borderBottom: `1px solid ${C.border}`, bgcolor: C.paper, pt: { xs: `calc(${NAVBAR_HEIGHT.xs}px + 20px)` } }}>
        <Container maxWidth="xl" sx={{ px: { xs: 2, md: 4 } }}>
          <Box
            sx={{
              height: 80,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 2,
            }}
          >
            {/* Titre + compteur */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
              <Typography
                component="h1"
                sx={{ fontSize: { xs: 22.5, md: 27.5 }, fontWeight: 700, color: C.dark, letterSpacing: '-0.375px' }}
              >
                {searchQuery ? 'Résultats' : 'Boutique'}
              </Typography>
              {searchQuery && (
                <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, bgcolor: alpha(C.primary, 0.08), color: C.primary, px: 1.25, py: 0.25, borderRadius: '100px', fontSize: 15, fontWeight: 600 }}>
                  « {searchQuery} »
                </Box>
              )}
              {!loading && (
                <Typography sx={{ fontSize: 16.25, color: C.muted }}>
                  {sortedProducts.length} produit{sortedProducts.length > 1 ? 's' : ''}
                </Typography>
              )}
            </Box>

            {/* Droite : filtre mobile + tri */}
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
              {/* Bouton filtre mobile */}
              <Button
                onClick={() => setMobileOpen(true)}
                startIcon={<FilterIcon sx={{ fontSize: 20 }} />}
                sx={{
                  display: { lg: 'none' },
                  border: `1px solid ${C.border}`,
                  borderRadius: '10px',
                  color: C.text,
                  fontSize: 16.25,
                  fontWeight: 500,
                  textTransform: 'none',
                  px: 1.5,
                  py: 0.75,
                  '&:hover': { bgcolor: C.surface, borderColor: C.mid },
                }}
              >
                Filtres
                {activeFiltersCount > 0 && (
                  <Box sx={{ ml: 0.75, width: 22.5, height: 22.5, borderRadius: '50%', bgcolor: C.primary, color: C.paper, fontSize: 12.5, fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                    {activeFiltersCount}
                  </Box>
                )}
              </Button>

              {/* Sélecteur tri */}
              <FormControl size="small" sx={{ minWidth: 160 }}>
                <Select
                  value={sortBy}
                  onChange={(e: SelectChangeEvent) => setSortBy(e.target.value)}
                  displayEmpty
                  sx={{
                    fontSize: 16.25,
                    borderRadius: '10px',
                    color: C.text,
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: C.border },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: C.mid },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: C.primary },
                  }}
                >
                  <MenuItem value="popular"    sx={{ fontSize: 16.25 }}>Populaires</MenuItem>
                  <MenuItem value="price-asc"  sx={{ fontSize: 16.25 }}>Prix croissant</MenuItem>
                  <MenuItem value="price-desc" sx={{ fontSize: 16.25 }}>Prix décroissant</MenuItem>
                  <MenuItem value="name"       sx={{ fontSize: 16.25 }}>Nom A–Z</MenuItem>
                </Select>
              </FormControl>
            </Stack>
          </Box>

          {/* Chips filtres actifs */}
          {activeFiltersCount > 0 && (
            <Box sx={{ display: 'flex', gap: 0.75, pb: 1.5, flexWrap: 'wrap' }}>
              {selectedCategories.map((id) => {
                const cat = categories.find((c) => c.id === id);
                return cat ? (
                  <Chip
                    key={id}
                    label={cat.name}
                    size="small"
                    onDelete={() => toggleCategory(id)}
                    sx={{ bgcolor: C.light, color: C.primary, fontWeight: 500, fontSize: 15, height: 30, '& .MuiChip-deleteIcon': { color: C.mid, fontSize: 17.5 } }}
                  />
                ) : null;
              })}
              {(priceRange[0] > 0 || priceRange[1] < 150000) && (
                <Chip
                  label={`${formatFcfa(priceRange[0])} – ${formatFcfa(priceRange[1])}`}
                  size="small"
                  onDelete={() => setPriceRange([0, 150000])}
                  sx={{ bgcolor: C.light, color: C.primary, fontWeight: 500, fontSize: 15, height: 30, '& .MuiChip-deleteIcon': { color: C.mid, fontSize: 17.5 } }}
                />
              )}
            </Box>
          )}
        </Container>
      </Box>

      {/* ── Layout sidebar + grille ── */}
      <Box sx={{ display: 'flex', width: '100%' }}>

        {/* Sidebar desktop */}
        {isDesktop && (
          <Box
            sx={{
              width: 325,
              flexShrink: 0,
              position: 'sticky',
              top: 64,
              height: 'calc(100vh - 64px)',
              overflowY: 'auto',
              borderRight: `1px solid ${C.border}`,
              bgcolor: C.paper,
            }}
          >
            <FilterSidebar
              categories={categories}
              selectedCategories={selectedCategories}
              toggleCategory={toggleCategory}
              priceRange={priceRange}
              setPriceRange={setPriceRange}
              activeFiltersCount={activeFiltersCount}
              resetFilters={resetFilters}
            />
          </Box>
        )}

        {/* Grille produits */}
        <Box
          component="main"
          sx={{
            flex: 1,
            minWidth: 0,
            p: { xs: 2, sm: 3, md: 4 },
            bgcolor: C.surface,
          }}
        >
          {loading ? (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 500 }}>
              <CircularProgress sx={{ color: C.primary }} />
            </Box>
          ) : sortedProducts.length > 0 ? (
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: 'repeat(2, 1fr)',
                  sm: 'repeat(2, 1fr)',
                  md: 'repeat(2, 1fr)',
                  lg: 'repeat(3, 1fr)',
                  xl: 'repeat(4, 1fr)',
                },
                gap: { xs: 1.5, md: 2.5 },
              }}
            >
              {sortedProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={onAddToCart}
                  onViewDetails={onViewProduct}
                  userType={userType}
                  isFavorite={favorites.includes(product.id.toString())}
                  onToggleFavorite={onToggleFavorite}
                />
              ))}
            </Box>
          ) : (
            /* État vide */
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: 500,
                gap: 2,
              }}
            >
              <Box
                sx={{
                  width: 80, height: 80,
                  borderRadius: '20px',
                  bgcolor: C.light,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <SearchIcon sx={{ fontSize: 35, color: C.primary }} />
              </Box>
              <Typography sx={{ fontSize: 20, fontWeight: 600, color: C.dark }}>
                Aucun produit trouvé
              </Typography>
              <Typography sx={{ fontSize: 16.25, color: C.muted, textAlign: 'center', maxWidth: 375 }}>
                Essayez de modifier ou réinitialiser vos filtres pour voir plus de produits.
              </Typography>
              <Button
                variant="outlined"
                onClick={resetFilters}
                sx={{
                  borderColor: C.border, color: C.primary, borderRadius: '10px',
                  textTransform: 'none', fontWeight: 500, fontSize: 16.25,
                  '&:hover': { bgcolor: C.surface, borderColor: C.mid },
                }}
              >
                Réinitialiser les filtres
              </Button>
            </Box>
          )}
        </Box>
      </Box>

      {/* Drawer filtres mobile */}
      <Drawer
        anchor="left"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted: true }}
        slotProps={{
          paper: {
            sx: {
              width: 350,
              border: 'none',
              boxShadow: `4px 0 24px ${alpha(C.dark, 0.08)}`,
            },
          },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2.5, py: 2, borderBottom: `1px solid ${C.border}` }}>
          <Typography sx={{ fontSize: 17.5, fontWeight: 600, color: C.dark }}>Filtres</Typography>
          <IconButton
            size="small"
            onClick={() => setMobileOpen(false)}
            sx={{ border: `1px solid ${C.border}`, borderRadius: '8.75px', width: 37.5, height: 37.5 }}
          >
            <CloseIcon sx={{ fontSize: 18.75, color: C.text }} />
          </IconButton>
        </Box>
        <FilterSidebar
          categories={categories}
          selectedCategories={selectedCategories}
          toggleCategory={toggleCategory}
          priceRange={priceRange}
          setPriceRange={setPriceRange}
          activeFiltersCount={activeFiltersCount}
          resetFilters={resetFilters}
        />
      </Drawer>
    </Box>
  );
}