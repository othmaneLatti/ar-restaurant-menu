"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const server_1 = require("../server");
const auth_1 = require("../middleware/auth");
const validate_1 = require("../middleware/validate");
const upload_1 = require("../middleware/upload");
const router = (0, express_1.Router)();
// Public route to get menu
router.get('/:restaurant_id', async (req, res) => {
    try {
        const categories = await server_1.prisma.menuCategory.findMany({
            where: { restaurant_id: req.params.restaurant_id },
            orderBy: { display_order: 'asc' },
        });
        const items = await server_1.prisma.menuItem.findMany({
            where: { category: { restaurant_id: req.params.restaurant_id } },
        });
        const parsedItems = items.map(item => ({
            ...item,
            ingredients: item.ingredients ? JSON.parse(item.ingredients) : [],
            allergens: item.allergens ? JSON.parse(item.allergens) : []
        }));
        res.json({ categories, items: parsedItems });
    }
    catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
// Category validation
const categorySchema = zod_1.z.object({
    body: zod_1.z.object({
        restaurant_id: zod_1.z.string().uuid().optional(),
        name: zod_1.z.string().min(1),
        display_order: zod_1.z.number().int(),
    }),
});
router.post('/categories', auth_1.authenticate, (0, validate_1.validate)(categorySchema), async (req, res) => {
    try {
        const { restaurant_id, name, display_order } = req.body;
        // @ts-ignore
        const targetRestaurantId = restaurant_id || req.admin.restaurant_id;
        const category = await server_1.prisma.menuCategory.create({
            data: { restaurant_id: targetRestaurantId, name, display_order },
        });
        res.status(201).json(category);
    }
    catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
router.put('/categories/:id', auth_1.authenticate, (0, validate_1.validate)(categorySchema), async (req, res) => {
    try {
        const { name, display_order } = req.body;
        const category = await server_1.prisma.menuCategory.update({
            where: { id: req.params.id },
            data: { name, display_order },
        });
        res.json(category);
    }
    catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
router.delete('/categories/:id', auth_1.authenticate, async (req, res) => {
    try {
        const itemCount = await server_1.prisma.menuItem.count({ where: { category_id: req.params.id } });
        if (itemCount > 0) {
            return res.status(400).json({ error: 'Remove all items from this category before deleting it' });
        }
        await server_1.prisma.menuCategory.delete({ where: { id: req.params.id } });
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
// Items endpoints
const itemSchema = zod_1.z.object({
    body: zod_1.z.object({
        category_id: zod_1.z.string().uuid(),
        name: zod_1.z.string().min(1),
        description: zod_1.z.string().min(1),
        price: zod_1.z.string().refine(val => !isNaN(parseFloat(val)), { message: "Price must be a number" }),
        calories: zod_1.z.string().optional().refine(val => !val || !isNaN(parseInt(val, 10)), { message: "Calories must be a number" }),
        ingredients: zod_1.z.string().optional(),
        allergens: zod_1.z.string().optional(),
    }),
});
router.post('/items', auth_1.authenticate, upload_1.uploadItemFiles.fields([
    { name: 'thumbnail', maxCount: 1 },
    { name: 'model', maxCount: 1 }
]), (0, validate_1.validate)(itemSchema), async (req, res) => {
    try {
        const { category_id, name, description, price, calories, ingredients, allergens } = req.body;
        const files = req.files;
        if (!files.thumbnail) {
            return res.status(400).json({ error: 'Thumbnail is required' });
        }
        const item = await server_1.prisma.menuItem.create({
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
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
const itemUpdateSchema = zod_1.z.object({
    body: zod_1.z.object({
        category_id: zod_1.z.string().uuid().optional(),
        name: zod_1.z.string().min(1).optional(),
        description: zod_1.z.string().min(1).optional(),
        price: zod_1.z.string().optional().refine(val => !val || !isNaN(parseFloat(val)), { message: "Price must be a number" }),
        calories: zod_1.z.string().optional().refine(val => !val || !isNaN(parseInt(val, 10)), { message: "Calories must be a number" }),
        ingredients: zod_1.z.string().optional(),
        allergens: zod_1.z.string().optional(),
    }),
});
router.put('/items/:id', auth_1.authenticate, upload_1.uploadItemFiles.fields([
    { name: 'thumbnail', maxCount: 1 },
    { name: 'model', maxCount: 1 }
]), (0, validate_1.validate)(itemUpdateSchema), async (req, res) => {
    try {
        const { category_id, name, description, price, calories, ingredients, allergens } = req.body;
        const files = req.files;
        const updateData = {
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
        const item = await server_1.prisma.menuItem.update({
            where: { id: req.params.id },
            data: updateData,
        });
        res.json(item);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
router.delete('/items/:id', auth_1.authenticate, async (req, res) => {
    try {
        await server_1.prisma.menuItem.delete({ where: { id: req.params.id } });
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
exports.default = router;
