import { InventoryItem } from '@/types';

let _id = 0;
const item = (name: string, category: string, parLevel: number, unit = 'units'): InventoryItem => ({
  id: `item-${++_id}`,
  name,
  category,
  parLevel,
  unit,
});

export const DEFAULT_INVENTORY: InventoryItem[] = [
  // Breakfast (14)
  item('Bacon', 'Breakfast', 30, 'strips'),
  item('Sausage Links', 'Breakfast', 24, 'links'),
  item('Sausage Patties', 'Breakfast', 20, 'patties'),
  item('Stuffed Waffles', 'Breakfast', 12),
  item('Pigs in Blanket', 'Breakfast', 18),
  item('Kolache', 'Breakfast', 24),
  item('Boudin', 'Breakfast', 15),
  item('Breakfast Burrito', 'Breakfast', 20),
  item('Biscuit Sandwich', 'Breakfast', 18),
  item('Hash Browns', 'Breakfast', 24),
  item('Pancakes', 'Breakfast', 15),
  item('French Toast', 'Breakfast', 12),
  item('Scrambled Eggs', 'Breakfast', 20, 'servings'),
  item('Fried Eggs', 'Breakfast', 15),

  // Roller/Hot Case (11)
  item('Egg Rolls', 'Roller/Hot Case', 18),
  item('Tornados', 'Roller/Hot Case', 24),
  item('Chicken Stick', 'Roller/Hot Case', 20),
  item('Corn Dog', 'Roller/Hot Case', 18),
  item('Hot Dog', 'Roller/Hot Case', 24),
  item('Crispitos', 'Roller/Hot Case', 20),
  item('Taquitos', 'Roller/Hot Case', 24),
  item('Hot Pockets', 'Roller/Hot Case', 12),
  item('Pizza Rolls', 'Roller/Hot Case', 30),
  item('Tacquito', 'Roller/Hot Case', 20),
  item('Mini Tacos', 'Roller/Hot Case', 24),

  // Deli (15)
  item('Hamburger', 'Deli', 15),
  item('Cheeseburger', 'Deli', 15),
  item('Chicken Wings', 'Deli', 30, 'pieces'),
  item('Pulled Pork Sandwich', 'Deli', 10),
  item('Brisket Sandwich', 'Deli', 10),
  item('Country Fried Steak', 'Deli', 8),
  item('Pork Chop', 'Deli', 10),
  item('Steak Fingers', 'Deli', 20),
  item('Chicken Tenders', 'Deli', 24),
  item('Chicken Sandwich', 'Deli', 12),
  item('BLT', 'Deli', 10),
  item('Club Sandwich', 'Deli', 8),
  item('Ham Sandwich', 'Deli', 10),
  item('Turkey Sandwich', 'Deli', 10),
  item('Meatballs', 'Deli', 20),

  // Bakery (9)
  item('Cinnamon Rolls', 'Bakery', 12),
  item('Cookies Large', 'Bakery', 18),
  item('Cookies Small', 'Bakery', 24),
  item('Muffins', 'Bakery', 12),
  item('Brownies', 'Bakery', 12),
  item('Danishes', 'Bakery', 12),
  item('Donuts Glazed', 'Bakery', 24),
  item('Donuts Filled', 'Bakery', 18),
  item('Cake Donuts', 'Bakery', 18),

  // Branded Pizza (8)
  item('Whole Pizza', 'Branded Pizza', 8),
  item('Pizza Slice', 'Branded Pizza', 24),
  item('Pizza Hunk', 'Branded Pizza', 18),
  item('Cheese Sticks', 'Branded Pizza', 20),
  item('Pizza Chicken Wings', 'Branded Pizza', 30, 'pieces'),
  item('Calzone', 'Branded Pizza', 8),
  item('Stromboli', 'Branded Pizza', 8),
  item('Garlic Knots', 'Branded Pizza', 24),

  // Sides (9)
  item('French Fries', 'Sides', 30, 'servings'),
  item('Onion Rings', 'Sides', 20, 'servings'),
  item('Mozzarella Sticks', 'Sides', 24),
  item('Jalapeno Poppers', 'Sides', 24),
  item('Fried Pickles', 'Sides', 18),
  item('Potato Wedges', 'Sides', 24, 'servings'),
  item('Tater Tots', 'Sides', 24, 'servings'),
  item('Nachos', 'Sides', 15, 'servings'),
  item('Chips', 'Sides', 30, 'bags'),

  // Wraps/Specialty (8)
  item('Breakfast Wrap', 'Wraps/Specialty', 12),
  item('Lunch Wrap', 'Wraps/Specialty', 12),
  item('Burrito', 'Wraps/Specialty', 15),
  item('Tamales', 'Wraps/Specialty', 18),
  item('Empanadas', 'Wraps/Specialty', 12),
  item('Spring Rolls', 'Wraps/Specialty', 18),
  item('Pot Stickers', 'Wraps/Specialty', 18),
  item('Quesadilla', 'Wraps/Specialty', 12),

  // Dairy (8)
  item('Whole Milk', 'Dairy', 10, 'gallons'),
  item('2% Milk', 'Dairy', 12, 'gallons'),
  item('Skim Milk', 'Dairy', 6, 'gallons'),
  item('Chocolate Milk', 'Dairy', 8, 'gallons'),
  item('Mozzarella Cheese', 'Dairy', 5, 'lbs'),
  item('Cheddar Cheese', 'Dairy', 5, 'lbs'),
  item('Cream Cheese', 'Dairy', 4, 'lbs'),
  item('Cheese Slices', 'Dairy', 100, 'slices'),

  // Produce (8)
  item('Lettuce', 'Produce', 8, 'heads'),
  item('Tomato', 'Produce', 15, 'lbs'),
  item('Onion', 'Produce', 10, 'lbs'),
  item('Pickle', 'Produce', 4, 'jars'),
  item('Bell Peppers', 'Produce', 8, 'lbs'),
  item('Jalapenos', 'Produce', 5, 'lbs'),
  item('Mushrooms', 'Produce', 4, 'lbs'),
  item('Avocado', 'Produce', 12),

  // Condiments (8)
  item('Ketchup', 'Condiments', 6, 'bottles'),
  item('Mustard', 'Condiments', 4, 'bottles'),
  item('Mayo', 'Condiments', 4, 'bottles'),
  item('BBQ Sauce', 'Condiments', 4, 'bottles'),
  item('Ranch Dressing', 'Condiments', 6, 'bottles'),
  item('Hot Sauce', 'Condiments', 4, 'bottles'),
  item('Salsa', 'Condiments', 4, 'jars'),
  item('Cheese Sauce', 'Condiments', 4, 'bags'),

  // Beverages (9)
  item('Fountain Soda', 'Beverages', 5, 'BIB'),
  item('Bottled Soda', 'Beverages', 48, 'bottles'),
  item('Coffee', 'Beverages', 5, 'lbs'),
  item('Iced Coffee', 'Beverages', 3, 'gallons'),
  item('Tea', 'Beverages', 3, 'gallons'),
  item('Energy Drinks', 'Beverages', 36),
  item('Bottled Water', 'Beverages', 48, 'bottles'),
  item('Juice', 'Beverages', 24, 'bottles'),
  item('Sports Drinks', 'Beverages', 36, 'bottles'),

  // Frozen Desserts (5)
  item('Ice Cream Cups', 'Frozen Desserts', 24),
  item('Ice Cream Sandwiches', 'Frozen Desserts', 24),
  item('Popsicles', 'Frozen Desserts', 24),
  item('Frozen Yogurt', 'Frozen Desserts', 12),
  item('Slushies', 'Frozen Desserts', 3, 'mixes'),

  // Bread/Buns (6)
  item('Hamburger Buns', 'Bread/Buns', 24),
  item('Hot Dog Buns', 'Bread/Buns', 24),
  item('White Bread', 'Bread/Buns', 10, 'loaves'),
  item('Wheat Bread', 'Bread/Buns', 8, 'loaves'),
  item('Tortillas', 'Bread/Buns', 50),
  item('Biscuits', 'Bread/Buns', 24),
];

export const CATEGORIES = [
  'Breakfast',
  'Roller/Hot Case',
  'Deli',
  'Bakery',
  'Branded Pizza',
  'Sides',
  'Wraps/Specialty',
  'Dairy',
  'Produce',
  'Condiments',
  'Beverages',
  'Frozen Desserts',
  'Bread/Buns',
];
