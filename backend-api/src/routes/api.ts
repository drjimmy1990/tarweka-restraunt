import { Router } from 'express';
import { checkCoverage } from '../controllers/geoController';

const router = Router();

// Endpoint: POST /api/check-coverage
// Body: { "lat": 30.044, "lng": 31.235 }
router.post('/check-coverage', checkCoverage);

export default router;
