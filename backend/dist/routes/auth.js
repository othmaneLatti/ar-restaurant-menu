"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const zod_1 = require("zod");
const server_1 = require("../server");
const validate_1 = require("../middleware/validate");
const router = (0, express_1.Router)();
const loginSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string().email(),
        password: zod_1.z.string().min(6),
    }),
});
const registerSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string().email(),
        password: zod_1.z.string().min(6),
        restaurant_name: zod_1.z.string().min(2),
        address: zod_1.z.string().min(5),
    }),
});
router.post('/login', (0, validate_1.validate)(loginSchema), async (req, res) => {
    try {
        const { email, password } = req.body;
        const admin = await server_1.prisma.adminUser.findUnique({
            where: { email },
            include: { restaurant: true },
        });
        if (!admin) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const isMatch = await bcryptjs_1.default.compare(password, admin.password_hash);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const token = jsonwebtoken_1.default.sign({ id: admin.id, restaurant_id: admin.restaurant_id }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '1d' });
        res.json({
            token,
            admin: {
                id: admin.id,
                email: admin.email,
                restaurant_id: admin.restaurant_id,
                restaurant_name: admin.restaurant?.name,
            },
        });
    }
    catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
router.post('/register', (0, validate_1.validate)(registerSchema), async (req, res) => {
    try {
        const { email, password, restaurant_name, address } = req.body;
        const existingAdmin = await server_1.prisma.adminUser.findUnique({ where: { email } });
        if (existingAdmin) {
            return res.status(400).json({ error: 'Email is already registered' });
        }
        const password_hash = await bcryptjs_1.default.hash(password, 10);
        const result = await server_1.prisma.$transaction(async (tx) => {
            const restaurant = await tx.restaurant.create({
                data: { name: restaurant_name, address, logo_url: '' },
            });
            const admin = await tx.adminUser.create({
                data: { email, password_hash, restaurant_id: restaurant.id },
            });
            return { restaurant, admin };
        });
        const token = jsonwebtoken_1.default.sign({ id: result.admin.id, restaurant_id: result.restaurant.id }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '1d' });
        res.status(201).json({
            token,
            admin: {
                id: result.admin.id,
                email: result.admin.email,
                restaurant_id: result.restaurant.id,
                restaurant_name: result.restaurant.name,
            },
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to register account' });
    }
});
exports.default = router;
