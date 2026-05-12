import { getCollection, type CollectionEntry } from 'astro:content';

export type MenuEntry = CollectionEntry<'menu'>;
export type MenuCategory = MenuEntry['data']['category'];

export type CategoryGroup = {
  category: MenuCategory;
  label: string;
  items: MenuEntry[];
};

/** Canonical display order for categories */
const CATEGORY_ORDER: MenuCategory[] = [
  'specialty-sandwich',
  'panini',
  'breakfast',
  'soup',
  'salad',
  'side',
  'dessert',
  'beverage',
  'retail',
];

export const CATEGORY_LABELS: Record<MenuCategory, string> = {
  'specialty-sandwich': 'Specialty Sandwiches',
  panini:              'Paninis',
  breakfast:           'Breakfast',
  soup:                'Soups',
  salad:               'Salads',
  side:                'Sides',
  dessert:             'Desserts',
  beverage:            'Beverages',
  retail:              'Retail',
};

export function getCategoryLabel(category: MenuCategory): string {
  return CATEGORY_LABELS[category];
}

/**
 * Returns all menu items grouped by category, each group sorted by `order`.
 * Only categories that have at least one item are included.
 */
export async function getMenuByCategory(): Promise<CategoryGroup[]> {
  const items = await getCollection('menu');

  const grouped: Partial<Record<MenuCategory, MenuEntry[]>> = {};
  for (const item of items) {
    const cat = item.data.category;
    (grouped[cat] ??= []).push(item);
  }

  for (const cat of CATEGORY_ORDER) {
    grouped[cat]?.sort((a, b) => a.data.order - b.data.order);
  }

  return CATEGORY_ORDER.filter((cat) => (grouped[cat]?.length ?? 0) > 0).map(
    (category) => ({
      category,
      label: CATEGORY_LABELS[category],
      items: grouped[category]!,
    })
  );
}

/** Returns only featured items, sorted by `order`. */
export async function getFeaturedMenu(): Promise<MenuEntry[]> {
  const items = await getCollection('menu', ({ data }) => data.featured);
  return items.sort((a, b) => a.data.order - b.data.order);
}

/** Formats price for display: null → "Ask" */
export function formatPrice(price: string | null): string {
  return price ?? 'Ask';
}
