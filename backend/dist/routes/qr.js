"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const qrcode_1 = __importDefault(require("qrcode"));
const zod_1 = require("zod");
const validate_1 = require("../middleware/validate");
const server_1 = require("../server");
const auth_1 = require("../middleware/auth");
const cloudinary_1 = require("cloudinary");
const crypto_1 = __importDefault(require("crypto"));
const router = (0, express_1.Router)();
const qrGenerateSchema = zod_1.z.object({
    body: zod_1.z.object({
        restaurant_id: zod_1.z.string().uuid().optional(),
        table_number: zod_1.z.union([zod_1.z.string().min(1), zod_1.z.number()]).transform(String),
    }),
});
router.post('/generate', auth_1.authenticate, (0, validate_1.validate)(qrGenerateSchema), async (req, res) => {
    try {
        const { restaurant_id, table_number } = req.body;
        // @ts-ignore
        const targetRestaurantId = restaurant_id || req.admin.restaurant_id;
        // Create the DB record first to get the UUID for the table
        const tableId = crypto_1.default.randomUUID();
        const qrPayload = {
            restaurant_id: targetRestaurantId,
            table_id: tableId,
        };
        const qrDataUrl = await qrcode_1.default.toDataURL(JSON.stringify(qrPayload));
        // Upload the base64 QR code image to Cloudinary
        const uploadRes = await cloudinary_1.v2.uploader.upload(qrDataUrl, {
            folder: 'ar-menu/qrcodes',
        });
        const tableQR = await server_1.prisma.tableQR.create({
            data: {
                id: tableId,
                restaurant_id: targetRestaurantId,
                table_number,
                qr_payload: JSON.stringify(qrPayload),
                qr_image_url: uploadRes.secure_url,
            },
        });
        res.status(201).json(tableQR);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
router.get('/:restaurant_id', auth_1.authenticate, async (req, res) => {
    try {
        const qrs = await server_1.prisma.tableQR.findMany({
            where: { restaurant_id: req.params.restaurant_id },
            orderBy: { table_number: 'asc' },
        });
        const parsedQrs = qrs.map(qr => ({
            ...qr,
            qr_payload: qr.qr_payload ? JSON.parse(qr.qr_payload) : {}
        }));
        res.json(parsedQrs);
    }
    catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
exports.default = router;
