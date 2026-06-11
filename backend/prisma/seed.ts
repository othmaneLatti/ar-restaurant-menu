import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Create a test restaurant
  const restaurant = await prisma.restaurant.create({
    data: {
      name: 'AR Burger Joint',
      address: '123 Tech Street, Silicon Valley',
      logo_url: 'https://res.cloudinary.com/demo/image/upload/sample.jpg', // Placeholder
    },
  });

  // 2. Create an admin user
  const password_hash = await bcrypt.hash('admin123', 10);
  await prisma.adminUser.create({
    data: {
      email: 'admin@arburger.com',
      password_hash,
      restaurant_id: restaurant.id,
    },
  });

  // 3. Create categories
  const categories = await Promise.all([
    prisma.menuCategory.create({
      data: { restaurant_id: restaurant.id, name: 'Burgers', display_order: 1 },
    }),
    prisma.menuCategory.create({
      data: { restaurant_id: restaurant.id, name: 'Sides', display_order: 2 },
    }),
    prisma.menuCategory.create({
      data: { restaurant_id: restaurant.id, name: 'Drinks', display_order: 3 },
    }),
  ]);

  // 4. Create menu items
  const [burgers, sides, drinks] = categories;

  await prisma.menuItem.createMany({
    data: [
      {
        category_id: burgers.id,
        name: 'Classic Cheeseburger',
        description: 'Juicy beef patty with cheddar cheese, lettuce, and tomato.',
        price: 9.99,
        calories: 650,
        ingredients: JSON.stringify(['Beef', 'Cheddar', 'Lettuce', 'Tomato', 'Bun']),
        allergens: JSON.stringify(['Dairy', 'Gluten']),
        thumbnail_url: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
      },
      {
        category_id: burgers.id,
        name: 'Double Bacon Smash',
        description: 'Two smashed patties with crispy bacon and special sauce.',
        price: 13.99,
        calories: 950,
        ingredients: JSON.stringify(['Beef', 'Bacon', 'Cheese', 'Sauce', 'Bun']),
        allergens: JSON.stringify(['Dairy', 'Gluten', 'Eggs']),
        thumbnail_url: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
      },
      {
        category_id: sides.id,
        name: 'French Fries',
        description: 'Crispy golden shoestring fries.',
        price: 4.99,
        calories: 380,
        ingredients: JSON.stringify(['Potatoes', 'Salt', 'Oil']),
        allergens: JSON.stringify([]),
        thumbnail_url: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
      },
      {
        category_id: sides.id,
        name: 'Onion Rings',
        description: 'Beer-battered thick-cut onion rings.',
        price: 5.99,
        calories: 420,
        ingredients: JSON.stringify(['Onion', 'Flour', 'Beer', 'Oil']),
        allergens: JSON.stringify(['Gluten']),
        thumbnail_url: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
      },
      {
        category_id: drinks.id,
        name: 'Cola',
        description: 'Ice cold classic cola.',
        price: 2.49,
        calories: 150,
        ingredients: JSON.stringify(['Carbonated Water', 'Sugar', 'Caramel Color']),
        allergens: JSON.stringify([]),
        thumbnail_url: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
      },
      {
        category_id: drinks.id,
        name: 'Vanilla Milkshake',
        description: 'Thick and creamy vanilla bean milkshake.',
        price: 4.99,
        calories: 550,
        ingredients: JSON.stringify(['Milk', 'Vanilla Ice Cream', 'Sugar']),
        allergens: JSON.stringify(['Dairy']),
        thumbnail_url: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
      },
    ],
  });

  // 5. Create a QR Code for Table 1
  const tableId = crypto.randomUUID();
  await prisma.tableQR.create({
    data: {
      id: tableId,
      restaurant_id: restaurant.id,
      table_number: 1,
      qr_payload: JSON.stringify({
        restaurant_id: restaurant.id,
        table_id: tableId,
      }),
      qr_image_url: 'https://res.cloudinary.com/demo/image/upload/sample.jpg', // Placeholder
    },
  });

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
