"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const server_1 = require("../server");
const router = (0, express_1.Router)();
router.get('/:id', async (req, res) => {
    try {
        const restaurant = await server_1.prisma.restaurant.findUnique({
            where: { id: req.params.id },
            include: {
                categories: {
                    orderBy: { display_order: 'asc' },
                    include: {
                        items: {
                            where: { is_available: true },
                        },
                    },
                },
            },
        });
        if (!restaurant) {
            return res.status(404).json({ error: 'Restaurant not found' });
        }
        const parsedRestaurant = {
            ...restaurant,
            categories: restaurant.categories.map(cat => ({
                ...cat,
                items: cat.items.map(item => ({
                    ...item,
                    ingredients: item.ingredients ? JSON.parse(item.ingredients) : [],
                    allergens: item.allergens ? JSON.parse(item.allergens) : []
                }))
            }))
        };
        res.json(parsedRestaurant);
    }
    catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
exports.default = router;
