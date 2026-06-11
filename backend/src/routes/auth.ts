import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../server';
import { validate } from '../middleware/validate';

const router = Router();

const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(6),
  }),
});

const registerSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(6),
    restaurant_name: z.string().min(2),
    address: z.string().min(5),
  }),
});

router.post('/login', validate(loginSchema), async (req, res) => {
  try {
    const { email, password } = req.body;
    const admin = await prisma.adminUser.findUnique({
      where: { email },
      include: { restaurant: true },
    });

    if (!admin) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, admin.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: admin.id, restaurant_id: admin.restaurant_id },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '1d' }
    );

    res.json({
      token,
      admin: {
        id: admin.id,
        email: admin.email,
        restaurant_id: admin.restaurant_id,
        restaurant_name: admin.restaurant?.name,
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.post('/register', validate(registerSchema), async (req, res) => {
  try {
    const { email, password, restaurant_name, address } = req.body;

    const existingAdmin = await prisma.adminUser.findUnique({ where: { email } });
    if (existingAdmin) {
      return res.status(400).json({ error: 'Email is already registered' });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const result = await prisma.$transaction(async (tx) => {
      const restaurant = await tx.restaurant.create({
        data: { name: restaurant_name, address, logo_url: '' },
      });
      const admin = await tx.adminUser.create({
        data: { email, password_hash, restaurant_id: restaurant.id },
      });
      return { restaurant, admin };
    });

    const token = jwt.sign(
      { id: result.admin.id, restaurant_id: result.restaurant.id },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '1d' }
    );

    res.status(201).json({
      token,
      admin: {
        id: result.admin.id,
        email: result.admin.email,
        restaurant_id: result.restaurant.id,
        restaurant_name: result.restaurant.name,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to register account' });
  }
});

export default router;
