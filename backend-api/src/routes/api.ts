import { Router } from 'express';
import { checkCoverage } from '../controllers/geoController';
import { createOrder, getOrder, updateOrderStatus } from '../controllers/orderController'; // Import new functions
import { verifyApiKey } from '../middleware/auth';

const router = Router();

// --- PUBLIC (Bot / n8n) ---

// 1. Check Coverage
router.post('/check-coverage', verifyApiKey, checkCoverage);

// 2. Create Order
router.post('/orders', verifyApiKey, createOrder);

// 3. Get Order Details (For "Track my Order")
router.get('/orders/:id', verifyApiKey, getOrder);

// 4. Update Order Status (For "Cancel Order" or Driver Bot)
router.patch('/orders/:id', verifyApiKey, updateOrderStatus);

export default router;