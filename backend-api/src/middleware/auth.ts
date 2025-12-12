import { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';

dotenv.config();


import fs from 'fs';
import path from 'path';

export const verifyApiKey = (req: Request, res: Response, next: NextFunction) => {
    // Read key inside function to ensure env vars are loaded
    const API_KEY = process.env.N8N_API_KEY || '';
    const providedKey = (req.headers['x-api-key'] as string) || '';

    // LOGGING TO FILE for debugging
    const logPath = path.join(__dirname, '../../debug_log.txt');
    const logData = `
[${new Date().toISOString()}] Request to ${req.path}
Headers: ${JSON.stringify(req.headers)}
Server Key: '${API_KEY}' (Length: ${API_KEY.length})
Client Key: '${providedKey}' (Length: ${providedKey.length})
Match: ${API_KEY === providedKey}
------------------------------------------------
`;
    fs.appendFileSync(logPath, logData);

    console.log(`[Auth] Server Key: '${API_KEY}'`);
    console.log(`[Auth] Client Key: '${providedKey}'`);

    if (!providedKey || providedKey !== API_KEY) {
        return res.status(401).json({
            error: 'Unauthorized',
            message: 'Invalid or missing API Key',
            debug_info: {
                received_key_length: providedKey.length,
                expected_key_length: API_KEY.length
            }
        });
    }

    next();
};
