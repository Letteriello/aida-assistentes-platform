import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../database/database';

type ProductCatalog = Database['public']['Tables']['product_catalogs']['Row'];
type ProductCatalogInsert = Database['public']['Tables']['product_catalogs']['Insert'];
type ProductCatalogUpdate = Database['public']['Tables']['product_catalogs']['Update'];

export interface ProductSearchResult {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  similarity: number;
}

export interface ProductSearchOptions {
  query: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  limit?: number;
  threshold?: number;
}

export class ProductCatalogService {
  private supabase: SupabaseClient<Database>;

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient<Database>(supabaseUrl, supabaseKey);
  }

  /**
   * Create a new product in the catalog
   */
  async createProduct(
    instanceId: string,
    productData: Omit<ProductCatalogInsert, 'instance_id' | 'created_at' | 'updated_at'>
  ): Promise<{ success: boolean; product?: ProductCatalog; error?: string }> {
    try {
      const { data, error } = await this.supabase
        .from('product_catalogs')
        .insert({
          ...productData,
          instance_id: instanceId,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating product:', error);
        return { success: false, error: error.message };
      }

      return { success: true, product: data };
    } catch (error) {
      console.error('Error creating product:', error);
      return { success: false, error: 'Failed to create product' };
    }
  }

  /**
   * Update an existing product
   */
  async updateProduct(
    productId: string,
    instanceId: string,
    updates: ProductCatalogUpdate
  ): Promise<{ success: boolean; product?: ProductCatalog; error?: string }> {
    try {
      const { data, error } = await this.supabase
        .from('product_catalogs')
        .update(updates)
        .eq('id', productId)
        .eq('instance_id', instanceId)
        .select()
        .single();

      if (error) {
        console.error('Error updating product:', error);
        return { success: false, error: error.message };
      }

      return { success: true, product: data };
    } catch (error) {
      console.error('Error updating product:', error);
      return { success: false, error: 'Failed to update product' };
    }
  }

  /**
   * Delete a product from the catalog
   */
  async deleteProduct(
    productId: string,
    instanceId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase
        .from('product_catalogs')
        .delete()
        .eq('id', productId)
        .eq('instance_id', instanceId);

      if (error) {
        console.error('Error deleting product:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error deleting product:', error);
      return { success: false, error: 'Failed to delete product' };
    }
  }

  /**
   * Get a specific product by ID
   */
  async getProduct(
    productId: string,
    instanceId: string
  ): Promise<{ success: boolean; product?: ProductCatalog; error?: string }> {
    try {
      const { data, error } = await this.supabase
        .from('product_catalogs')
        .select('*')
        .eq('id', productId)
        .eq('instance_id', instanceId)
        .single();

      if (error) {
        console.error('Error getting product:', error);
        return { success: false, error: error.message };
      }

      return { success: true, product: data };
    } catch (error) {
      console.error('Error getting product:', error);
      return { success: false, error: 'Failed to get product' };
    }
  }

  /**
   * List all products for an instance
   */
  async listProducts(
    instanceId: string,
    options?: {
      category?: string;
      isActive?: boolean;
      limit?: number;
      offset?: number;
    }
  ): Promise<{ success: boolean; products?: ProductCatalog[]; total?: number; error?: string }> {
    try {
      let query = this.supabase
        .from('product_catalogs')
        .select('*', { count: 'exact' })
        .eq('instance_id', instanceId);

      if (options?.category) {
        query = query.eq('category', options.category);
      }

      if (options?.isActive !== undefined) {
        query = query.eq('is_active', options.isActive);
      }

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      if (options?.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 50) - 1);
      }

      const { data, error, count } = await query;

      if (error) {
        console.error('Error listing products:', error);
        return { success: false, error: error.message };
      }

      return { success: true, products: data || [], total: count || 0 };
    } catch (error) {
      console.error('Error listing products:', error);
      return { success: false, error: 'Failed to list products' };
    }
  }

  /**
   * Search products using vector similarity
   */
  async searchProducts(
    instanceId: string,
    options: ProductSearchOptions
  ): Promise<{ success: boolean; results?: ProductSearchResult[]; error?: string }> {
    try {
      // Use Supabase's vector search functionality
      const { data, error } = await this.supabase.rpc('search_products', {
        instance_id: instanceId,
        search_query: options.query,
        category_filter: options.category,
        min_price: options.minPrice,
        max_price: options.maxPrice,
        result_limit: options.limit || 10,
        similarity_threshold: options.threshold || 0.7,
      });

      if (error) {
        console.error('Error searching products:', error);
        return { success: false, error: error.message };
      }

      return { success: true, results: data || [] };
    } catch (error) {
      console.error('Error searching products:', error);
      return { success: false, error: 'Failed to search products' };
    }
  }

  /**
   * Get product categories for an instance
   */
  async getCategories(
    instanceId: string
  ): Promise<{ success: boolean; categories?: string[]; error?: string }> {
    try {
      const { data, error } = await this.supabase
        .from('product_catalogs')
        .select('category')
        .eq('instance_id', instanceId)
        .eq('is_active', true);

      if (error) {
        console.error('Error getting categories:', error);
        return { success: false, error: error.message };
      }

      const categories = [...new Set(data?.map(item => item.category).filter(Boolean))];
      return { success: true, categories };
    } catch (error) {
      console.error('Error getting categories:', error);
      return { success: false, error: 'Failed to get categories' };
    }
  }

  /**
   * Bulk import products from CSV or JSON
   */
  async bulkImportProducts(
    instanceId: string,
    products: Omit<ProductCatalogInsert, 'instance_id' | 'created_at' | 'updated_at'>[]
  ): Promise<{ success: boolean; imported?: number; errors?: string[]; error?: string }> {
    try {
      const productsToInsert = products.map(product => ({
        ...product,
        instance_id: instanceId,
      }));

      const { data, error } = await this.supabase
        .from('product_catalogs')
        .insert(productsToInsert)
        .select();

      if (error) {
        console.error('Error bulk importing products:', error);
        return { success: false, error: error.message };
      }

      return { success: true, imported: data?.length || 0 };
    } catch (error) {
      console.error('Error bulk importing products:', error);
      return { success: false, error: 'Failed to bulk import products' };
    }
  }

  /**
   * Toggle product active status
   */
  async toggleProductStatus(
    productId: string,
    instanceId: string
  ): Promise<{ success: boolean; product?: ProductCatalog; error?: string }> {
    try {
      // First get the current status
      const { data: currentProduct, error: getError } = await this.supabase
        .from('product_catalogs')
        .select('is_active')
        .eq('id', productId)
        .eq('instance_id', instanceId)
        .single();

      if (getError) {
        console.error('Error getting current product status:', getError);
        return { success: false, error: getError.message };
      }

      // Toggle the status
      const { data, error } = await this.supabase
        .from('product_catalogs')
        .update({ is_active: !currentProduct.is_active })
        .eq('id', productId)
        .eq('instance_id', instanceId)
        .select()
        .single();

      if (error) {
        console.error('Error toggling product status:', error);
        return { success: false, error: error.message };
      }

      return { success: true, product: data };
    } catch (error) {
      console.error('Error toggling product status:', error);
      return { success: false, error: 'Failed to toggle product status' };
    }
  }
}

/**
 * Factory function to create ProductCatalogService instance
 */
export function createProductCatalogService(
  supabaseUrl: string,
  supabaseKey: string
): ProductCatalogService {
  return new ProductCatalogService(supabaseUrl, supabaseKey);
}