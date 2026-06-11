import { Router } from 'express';
import QRCode from 'qrcode';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import { prisma } from '../server';
import { authenticate } from '../middleware/auth';
import { v2 as cloudinary } from 'cloudinary';
import crypto from 'crypto';

const router = Router();

const qrGenerateSchema = z.object({
  body: z.object({
    restaurant_id: z.string().uuid().optional(),
    table_number: z.union([z.string().min(1), z.number()]).transform(String),
  }),
});

router.post('/generate', authenticate, validate(qrGenerateSchema), async (req, res) => {
  try {
    const { restaurant_id, table_number } = req.body;
    // @ts-ignore
    const targetRestaurantId = restaurant_id || req.admin.restaurant_id;
    
    // Create the DB record first to get the UUID for the table
    const tableId = crypto.randomUUID();
    const qrPayload = {
      restaurant_id: targetRestaurantId,
      table_id: tableId,
    };

    const qrDataUrl = await QRCode.toDataURL(JSON.stringify(qrPayload));
    
    // Upload the base64 QR code image to Cloudinary
    const uploadRes = await cloudinary.uploader.upload(qrDataUrl, {
      folder: 'ar-menu/qrcodes',
    });

    const tableQR = await prisma.tableQR.create({
      data: {
        id: tableId,
        restaurant_id: targetRestaurantId,
        table_number,
        qr_payload: JSON.stringify(qrPayload),
        qr_image_url: uploadRes.secure_url,
      },
    });

    res.status(201).json(tableQR);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get('/:restaurant_id', authenticate, async (req, res) => {
  try {
    const qrs = await prisma.tableQR.findMany({
      where: { restaurant_id: req.params.restaurant_id },
      orderBy: { table_number: 'asc' },
    });

    const parsedQrs = qrs.map(qr => ({
      ...qr,
      qr_payload: qr.qr_payload ? JSON.parse(qr.qr_payload) : {}
    }));

    res.json(parsedQrs);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
