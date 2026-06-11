import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../server';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { uploadItemFiles } from '../middleware/upload';

const router = Router();

// Public route to get menu
router.get('/:restaurant_id', async (req, res) => {
  try {
    const categories = await prisma.menuCategory.findMany({
      where: { restaurant_id: req.params.restaurant_id },
      orderBy: { display_order: 'asc' },
    });
    
    const items = await prisma.menuItem.findMany({
      where: { category: { restaurant_id: req.params.restaurant_id } },
    });

    const parsedItems = items.map(item => ({
      ...item,
      ingredients: item.ingredients ? JSON.parse(item.ingredients) : [],
      allergens: item.allergens ? JSON.parse(item.allergens) : []
    }));

    res.json({ categories, items: parsedItems });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Category validation
const categorySchema = z.object({
  body: z.object({
    restaurant_id: z.string().uuid().optional(),
    name: z.string().min(1),
    display_order: z.number().int(),
  }),
});

router.post('/categories', authenticate, validate(categorySchema), async (req, res) => {
  try {
    const { restaurant_id, name, display_order } = req.body;
    // @ts-ignore
    const targetRestaurantId = restaurant_id || req.admin.restaurant_id;

    const category = await prisma.menuCategory.create({
      data: { restaurant_id: targetRestaurantId, name, display_order },
    });
    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.put('/categories/:id', authenticate, validate(categorySchema), async (req, res) => {
  try {
    const { name, display_order } = req.body;
    const category = await prisma.menuCategory.update({
      where: { id: req.params.id },
      data: { name, display_order },
    });
    res.json(category);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.delete('/categories/:id', authenticate, async (req, res) => {
  try {
    const itemCount = await prisma.menuItem.count({ where: { category_id: req.params.id } });
    if (itemCount > 0) {
      return res.status(400).json({ error: 'Remove all items from this category before deleting it' });
    }
    await prisma.menuCategory.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Items endpoints
const itemSchema = z.object({
  body: z.object({
    category_id: z.string().uuid(),
    name: z.string().min(1),
    description: z.string().min(1),
    price: z.string().refine(val => !isNaN(parseFloat(val)), { message: "Price must be a number" }),
    calories: z.string().optional().refine(val => !val || !isNaN(parseInt(val, 10)), { message: "Calories must be a number" }),
    ingredients: z.string().optional(),
    allergens: z.string().optional(),
  }),
});

router.post('/items', authenticate, uploadItemFiles.fields([
  { name: 'thumbnail', maxCount: 1 },
  { name: 'model', maxCount: 1 }
]), validate(itemSchema), async (req, res) => {
  try {
    const { category_id, name, description, price, calories, ingredients, allergens } = req.body;
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    
    if (!files.thumbnail) {
      return res.status(400).json({ error: 'Thumbnail is required' });
    }

    const item = await prisma.menuItem.create({
      data: {
        category_id,
        name,
        description,
        price: parseFloat(price),
        calories: calories ? parseInt(calories, 10) : null,
        ingredients: ingredients ? (typeof ingredients === 'string' ? ingredients : JSON.stringify(ingredients)) : '[]',
        allergens: allergens ? (typeof allergens === 'string' ? allergens : JSON.stringify(allergens)) : '[]',
        thumbnail_url: files.thumbnail[0].path,
        model_url: files.model ? files.model[0].path : null,
      },
    });

    res.status(201).json(item);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

const itemUpdateSchema = z.object({
  body: z.object({
    category_id: z.string().uuid().optional(),
    name: z.string().min(1).optional(),
    description: z.string().min(1).optional(),
    price: z.string().optional().refine(val => !val || !isNaN(parseFloat(val)), { message: "Price must be a number" }),
    calories: z.string().optional().refine(val => !val || !isNaN(parseInt(val, 10)), { message: "Calories must be a number" }),
    ingredients: z.string().optional(),
    allergens: z.string().optional(),
  }),
});

router.put('/items/:id', authenticate, uploadItemFiles.fields([
  { name: 'thumbnail', maxCount: 1 },
  { name: 'model', maxCount: 1 }
]), validate(itemUpdateSchema), async (req, res) => {
  try {
    const { category_id, name, description, price, calories, ingredients, allergens } = req.body;
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    const updateData: any = {
      category_id,
      name,
      description,
      price: price ? parseFloat(price) : undefined,
      calories: calories ? parseInt(calories, 10) : undefined,
      ingredients: ingredients ? (typeof ingredients === 'string' ? ingredients : JSON.stringify(ingredients)) : undefined,
      allergens: allergens ? (typeof allergens === 'string' ? allergens : JSON.stringify(allergens)) : undefined,
    };

    if (files?.thumbnail) {
      updateData.thumbnail_url = files.thumbnail[0].path;
    }
    if (files?.model) {
      updateData.model_url = files.model[0].path;
    }

    // Remove undefined values
    Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

    const item = await prisma.menuItem.update({
      where: { id: req.params.id },
      data: updateData,
    });

    res.json(item);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.delete('/items/:id', authenticate, async (req, res) => {
  try {
    await prisma.menuItem.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
