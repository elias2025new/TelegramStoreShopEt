
export const CATEGORIES = [
    { name: 'All', icon: 'sparkling-diamond' },
    { name: 'Men', image: 'https://images.unsplash.com/photo-1488161628813-04466f872be2?q=80&w=200&auto=format&fit=crop', icon: 'male' },
    { name: 'Women', image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=200&auto=format&fit=crop', icon: 'female' },
    { name: 'Accessories', image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=200&auto=format&fit=crop', icon: 'shopping-bag' }
];

export const CATEGORY_SUBCATEGORIES: Record<string, string[]> = {
    'Men': ['Shoes', 'Jackets & Coats', 'T-shirts', 'Trousers'],
    'Women': ['Dresses', 'Tops', 'Shoes', 'Bags'],
    'Accessories': ['Watches', 'Sunglasses', 'Belts', 'Jewelry'],
    'Footwear': ['Sneakers', 'Boots', 'Sandals', 'Formal']
};

export const ALL_DISPLAY_CATEGORIES = [
    { name: 'Men Pants', gender: 'Men', category: 'Trousers' },
    { name: 'Women Pants', gender: 'Women', category: 'Trousers' },
    { name: 'Women Outdoor', gender: 'Women', category: 'Jackets & Coats' },
    { name: 'Women Sports', gender: 'Women', category: 'Tops' },
    { name: 'Plus Size', gender: 'Women', category: 'Dresses' },
    { name: 'Suit Pants', gender: 'Women', category: 'Trousers' },
    { name: 'Kitchen Tools', gender: 'Accessories', category: 'Home' },
    { name: 'Cellphones', gender: 'Accessories', category: 'Electronics' },
    { name: 'Foundation', gender: 'Women', category: 'Beauty' },
    { name: 'Young Girls', gender: 'Women', category: 'Tops' },
    { name: 'Young Boys', gender: 'Men', category: 'T-shirts' },
    { name: 'Thermal', gender: 'Women', category: 'Dresses' },
    { name: 'Curling Tongs', gender: 'Women', category: 'Beauty' },
    { name: 'Teen Girls', gender: 'Women', category: 'Trousers' },
    { name: 'Blush', gender: 'Women', category: 'Beauty' }
];
