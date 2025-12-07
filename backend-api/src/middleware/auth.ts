import { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';

dotenv.config();

const API_KEY = process.env.N8N_API_KEY;

export const verifyApiKey = (req: Request, res: Response, next: NextFunction) => {
    const providedKey = req.headers['x-api-key'];

    if (!providedKey || providedKey !== API_KEY) {
        return res.status(401).json({
            error: 'Unauthorized',
            message: 'Invalid or missing API Key'
        });
    }

    next();
};
