/**
 * Stock utility helpers shared across the app.
 * Works with both size-based and size-less products.
 */

type StockProduct = {
  sizes: string[] | null;
  stock: Record<string, number> | { [key: string]: unknown } | null;
  quantity: number;
  gender?: string | null;
};

/** Returns the stock count for a specific size (falls back to 0 if not set). */
export function getSizeStock(product: StockProduct, size: string): number {
  if (!product.stock || typeof product.stock !== 'object') return 0;
  const val = (product.stock as Record<string, unknown>)[size];
  return typeof val === 'number' ? val : 0;
}

/**
 * Returns an array of sizes that are still in stock (stock > 0).
 * Used on customer-facing pages to hide sold-out sizes.
 */
export function getAvailableSizes(product: StockProduct): string[] {
  const sizes = product.sizes ?? [];
  if (!product.stock) {
    // No stock map set yet — treat all sizes as available (legacy data)
    return sizes;
  }
  return sizes.filter((s) => getSizeStock(product, s) > 0);
}

/**
 * Returns true if the product is fully out of stock.
 *
 * - Size-based products: all tracked sizes must be 0.
 *   If no stock map exists at all, product is considered in stock.
 * - Size-less products: quantity must be 0.
 */
export function isOutOfStock(product: StockProduct): boolean {
  const hasSizes =
    product.sizes && product.sizes.length > 0 && product.gender !== 'Accessories';

  if (hasSizes) {
    // If no stock map recorded yet, treat as in stock (edge case / legacy)
    if (!product.stock || Object.keys(product.stock).length === 0) return false;
    // Out of stock only when every size is 0
    return (product.sizes as string[]).every((s) => getSizeStock(product, s) === 0);
  }

  // Size-less or accessories
  return product.quantity <= 0;
}
