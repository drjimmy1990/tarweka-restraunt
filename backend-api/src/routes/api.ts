import { Router } from 'express';
import { checkCoverage } from '../controllers/geoController';
import { createOrder } from '../controllers/orderController';
import { verifyApiKey } from '../middleware/auth';

const router = Router();

// Public: Check Coverage (Used by n8n before ordering)
// We add API Key here too to prevent public abuse
router.post('/check-coverage', verifyApiKey, checkCoverage);

// Public: Create Order (Used by n8n)
// Protected by API Key
router.post('/orders', verifyApiKey, createOrder);

export default router;
