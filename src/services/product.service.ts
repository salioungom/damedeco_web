import axios from 'axios';
import {
    Product,
    ProductImage,
    ProductFilters,
    ProductPaginatedResponse,
    CreateProductData,
    UpdateProductData,
    ProductStatus
} from '../types/product';
import { safeApiCall } from '@/lib/error-handler';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || ''; // Utiliser le proxy Next.js

const getAuthHeader = () => {
    if (typeof window === 'undefined') {
        return { headers: { 'Content-Type': 'application/json' } };
    }
    
    const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
    return {
        headers: {
            'Authorization': token ? `Bearer ${token}` : '',
            'Content-Type': 'application/json',
        },
    };
};

const handleApiError = (error: unknown): never => {
    const axiosError = error as any;

    if (axiosError.response) {
        const { status, data } = axiosError.response;

        switch (status) {
            case 400:
                // Erreur spécifique pour la suppression avec contraintes
                const constraintError = data?.detail || data?.message;

                // Gérer les codes d'erreur spécifiques
                if (constraintError === 'ProductErrorCode.DELETION_FAILED' ||
                    constraintError?.includes('DELETION_FAILED')) {
                    throw new Error('Impossible de supprimer ce produit : il est référencé par d\'autres éléments (commandes, paniers, etc.)');
                }

                if (constraintError === 'ProductErrorCode.UPDATE_FAILED' ||
                    constraintError?.includes('UPDATE_FAILED')) {
                    throw new Error('Impossible de mettre à jour ce produit : vérifiez les données et réessayez');
                }

                if (constraintError?.includes('constraint') ||
                    constraintError?.includes('foreign key') ||
                    constraintError?.includes('cannot delete') ||
                    constraintError?.includes('associated')) {
                    throw new Error('Impossible de supprimer ce produit : il est référencé par d\'autres éléments (commandes, paniers, etc.)');
                }
                throw new Error('Données invalides : ' + (constraintError || 'erreur inconnue'));
            case 401:
                throw new Error('Non autorisé. Veuillez vous reconnecter.');
            case 403:
                throw new Error('Accès interdit. Permissions insuffisantes.');
            case 404:
                throw new Error('Produit non trouvé.');
            case 409:
                throw new Error('Un produit avec ce SKU ou ce slug existe déjà.');
            case 422:
                const validationError = data.detail && Array.isArray(data.detail)
                    ? data.detail.map((e: any) => e.msg).join(', ')
                    : 'Erreur de validation';
                throw new Error(validationError);
            default:
                const errorMessage = data?.message || data?.detail || 'Une erreur est survenue';
                throw new Error(errorMessage);
        }
    }

    throw new Error('Erreur de connexion au serveur');
};

export const productService = {
    // Récupérer les produits avec pagination et filtres
    async getProducts(params?: ProductFilters): Promise<{ data: ProductPaginatedResponse | null; error: any }> {
        return safeApiCall(async () => {
            // Construire les paramètres de manière sécurisée
            const requestParams: any = {};
            
            if (params?.limit) {
                requestParams.limit = Math.min(params.limit, 100); // Limiter à 100 pour éviter l'erreur 422
            }
            
            if (params?.search) {
                requestParams.search = params.search;
            }
            
            if (params?.category_id) {
                requestParams.category_id = params.category_id;
            }
            
            if (params?.status) {
                requestParams.status = params.status;
            }
            
            // Test: essayer avec include simple d'abord
            requestParams.include = 'category'; // Seulement la catégorie, pas les images pour le moment
            
            console.log('📡 Envoi de la requête produits:', {
                url: `${API_BASE_URL}/api/v1/products/`,
                params: requestParams
            });

            const response = await axios.get<ProductPaginatedResponse>(
                `${API_BASE_URL}/api/v1/products/`,
                {
                    ...getAuthHeader(),
                    params: requestParams,
                }
            );
            
            console.log('📥 Réponse reçue:', {
                status: response.status,
                data: response.data
            });
            
            return response.data;
        });
    },

    // Récupérer les produits actifs (pour le storefront public)
    async getActiveProducts(params?: ProductFilters): Promise<{ data: ProductPaginatedResponse | null; error: any }> {
        return safeApiCall(async () => {
            try {
                // On force le filtre status=PUBLISHED si l'API ne le fait pas par défaut sur cet endpoint,
                // ou on utilise l'endpoint générique avec filtre.
                // Supposons une route dédiée ou un filtre:
                const response = await axios.get<ProductPaginatedResponse>(
                    `${API_BASE_URL}/api/v1/products/public`, // Endpoint public hypothétique ou filtré
                    {
                        params: {
                            ...params,
                            status: ProductStatus.ACTIVE,
                            include: 'category,images' // Inclure les détails de la catégorie et les images
                        }
                    }
                );
                return response.data;
            } catch (error) {
                // Fallback on standard get if public endpoint doesn't exist yet
                const result = await this.getProducts({ ...params, status: ProductStatus.ACTIVE });
                if (result.error) {
                    throw result.error;
                }
                return result.data;
            }
        });
    },

    // Récupérer un produit par ID
    async getProductById(id: string): Promise<Product> {
        try {
            const response = await axios.get<Product>(
                `${API_BASE_URL}/api/v1/products/${id}`,
                {
                    ...getAuthHeader(),
                    params: { include: 'category,images' }
                }
            );
            return response.data;
        } catch (error) {
            return handleApiError(error);
        }
    },

    // Récupérer un produit par slug
    async getProductBySlug(slug: string): Promise<Product> {
        try {
            const response = await axios.get<Product>(
                `${API_BASE_URL}/api/v1/products/slug/${slug}`,
                getAuthHeader() // Auth facultatif si public ? Mieux vaut l'envoyer si dispo
            );
            return response.data;
        } catch (error) {
            return handleApiError(error);
        }
    },

    // Créer un nouveau produit
    async createProduct(data: CreateProductData): Promise<Product> {
        try {
            // Mapper les champs du frontend vers le format attendu par le backend
            const backendData = {
                name: data.name,
                slug: data.slug,
                description: data.description,
                short_description: data.short_description,
                sku: data.sku,
                price: data.price,
                compare_price: data.original_price, // Mapping: original_price -> compare_price
                cost_price: data.wholesale_price,  // Mapping: wholesale_price -> cost_price
                track_inventory: true,             // Champ requis par le backend
                inventory_quantity: data.inventory_quantity,
                weight: data.weight || 0,
                status: data.status,
                category_id: data.category_id,
                meta_title: data.meta_title,
                meta_description: data.meta_description,
                pieces: data.pieces,
                popular: data.is_featured || false, // Mapping: is_featured -> popular
                average_rating: 0,               // Valeur par défaut
                review_count: 0,                 // Valeur par défaut
            };

            const response = await axios.post<Product>(
                `${API_BASE_URL}/api/v1/products/`,
                backendData,
                getAuthHeader()
            );
            return response.data;
        } catch (error) {
            return handleApiError(error);
        }
    },

    // Mettre à jour un produit
    async updateProduct(id: string, data: Partial<UpdateProductData>): Promise<Product> {
        try {
            // Mapper les champs du frontend vers le format attendu par le backend
            const backendData: any = {
                name: data.name,
                slug: data.slug,
                description: data.description || '',
                short_description: data.short_description || '',
                sku: data.sku,
                price: Number(data.price) || 0,
                compare_price: Number(data.original_price) || 0, // Mapping: original_price -> compare_price
                cost_price: Number(data.wholesale_price) || 0,  // Mapping: wholesale_price -> cost_price
                track_inventory: true,             // Champ requis par le backend
                inventory_quantity: Number(data.inventory_quantity) || 0,
                weight: Number(data.weight) || 0,
                status: data.status || 'active',
                category_id: Number(data.category_id) || 0,
                meta_title: data.meta_title || '',
                meta_description: data.meta_description || '',
                pieces: Number(data.pieces) || 0,
                popular: Boolean(data.is_featured), // Mapping: is_featured -> popular
                average_rating: 0, // Valeurs par défaut requises
                review_count: 0,   // Valeurs par défaut requises
            };

            // S'assurer que les champs requis sont présents et valides
            if (!backendData.name || !backendData.sku || !backendData.category_id) {
                throw new Error('Champs requis manquants: name, sku, category_id');
            }

            console.log('🔄 Données envoyées pour mise à jour produit:', backendData);

            const response = await axios.put<Product>( // Utiliser PUT comme attendu par le backend
                `${API_BASE_URL}/api/v1/products/${id}`,
                backendData,
                getAuthHeader()
            );
            return response.data;
        } catch (error) {
            return handleApiError(error);
        }
    },

    // Supprimer un produit
    async deleteProduct(id: string): Promise<void> {
        try {
            await axios.delete(`${API_BASE_URL}/api/v1/products/${id}`, getAuthHeader());
        } catch (error) {
            return handleApiError(error);
        }
    },

    // Basculer le statut d'un produit (ou changer le statut)
    async updateProductStatus(id: string, status: ProductStatus): Promise<Product> {
        try {
            // Souvent un endpoint dédié ou via update classique
            const response = await axios.patch<Product>(
                `${API_BASE_URL}/api/v1/products/${id}/status`,
                { status },
                getAuthHeader()
            );
            return response.data;
        } catch (error) {
            // Fallback si endpoint dédié n'existe pas
            return this.updateProduct(id, { status } as any);
        }
    },

    // Téléverser ou remplacer une image de couverture
    async uploadCoverImage(id: string, file: File): Promise<Product> {
        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await axios.post<Product>(
                `${API_BASE_URL}/api/v1/products/${id}/image`,
                formData,
                {
                    headers: {
                        ...getAuthHeader().headers,
                        'Content-Type': 'multipart/form-data',
                    },
                }
            );

            return response.data;
        } catch (error) {
            return handleApiError(error);
        }
    },

    // Mettre à jour une image de couverture (NEW)
    async updateProductCoverImage(id: string, file: File): Promise<Product> {
        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await axios.put<Product>(
                `${API_BASE_URL}/api/v1/products/${id}/image`,
                formData,
                {
                    headers: {
                        ...getAuthHeader().headers,
                        'Content-Type': 'multipart/form-data',
                    },
                }
            );

            return response.data;
        } catch (error) {
            return handleApiError(error);
        }
    },

    // Ajouter une image à la galerie
    async uploadGalleryImage(id: string, file: File, sortOrder: number = 0): Promise<Product> {
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('sort_order', sortOrder.toString());

            const response = await axios.post<Product>(
                `${API_BASE_URL}/api/v1/products/${id}/images`,
                formData,
                {
                    headers: {
                        ...getAuthHeader().headers,
                        'Content-Type': 'multipart/form-data',
                    },
                }
            );
            return response.data;
        } catch (error) {
            return handleApiError(error);
        }
    },

    // Supprimer une image de la galerie
    async deleteProductImage(productId: string, imageId: number): Promise<void> {
        try {
            await axios.delete(
                `${API_BASE_URL}/api/v1/products/${productId}/images/${imageId}`,
                getAuthHeader()
            );
        } catch (error) {
            return handleApiError(error);
        }
    },

    // Récupérer les images de la galerie pour un produit
    async getProductImages(productId: string): Promise<ProductImage[]> {
        try {
            const response = await axios.get<{ images: ProductImage[] }>(
                `${API_BASE_URL}/api/v1/products/${productId}/images`,
                getAuthHeader()
            );
            return response.data.images || [];
        } catch (error) {
            console.error('Failed to fetch product images:', error);
            return []; // Return empty array on error
        }
    },

    // Supprimer l'image de couverture d'un produit
    async deleteProductCoverImage(id: string): Promise<Product> {
        try {
            const response = await axios.delete<Product>(
                `${API_BASE_URL}/api/v1/products/${id}/image`,
                getAuthHeader()
            );
            return response.data;
        } catch (error) {
            return handleApiError(error);
        }
    },
};
