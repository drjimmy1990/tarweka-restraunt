import express, { Request, Response } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';

// 1. Load Environment Variables
dotenv.config();

// 2. Initialize App
const app = express();
const PORT = process.env.PORT || 4000;

// 3. Middleware
app.use(cors()); // Allow Frontend to talk to Backend
app.use(express.json()); // Parse JSON bodies
app.use(morgan('dev')); // Log requests

// 4. Basic Test Route
app.get('/', (req: Request, res: Response) => {
    res.status(200).json({
        message: '✅ Geo-Aware RMS Backend is Running!',
        timestamp: new Date().toISOString(),
        env: process.env.NODE_ENV
    });
});

// 5. Start Server
app.listen(PORT, () => {
    console.log(`
  ################################################
  🚀 Server listening on http://localhost:${PORT}
  ################################################
  `);
});
