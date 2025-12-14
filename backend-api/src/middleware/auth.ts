import { Request, Response, NextFunction } from 'express';

export const verifyApiKey = (req: Request, res: Response, next: NextFunction) => {
    // Read header (express automatically handles case-insensitivity)
    const providedKey = req.headers['x-api-key'];
    const expectedKey = process.env.N8N_API_KEY;

    if (!providedKey || providedKey !== expectedKey) {
        console.log(`❌ Auth Failed. Received: ${providedKey}`); // Debug log
        return res.status(401).json({
            error: 'Unauthorized',
            message: 'Invalid or missing API Key',
            debug_info: {
                received_key_length: providedKey ? String(providedKey).length : 0,
                expected_key_length: expectedKey ? expectedKey.length : 0
            }
        });
    }

    next();
};