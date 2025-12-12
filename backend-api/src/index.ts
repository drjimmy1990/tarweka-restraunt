import dotenv from 'dotenv';
dotenv.config(); // Load env vars before other imports

import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import apiRoutes from './routes/api'; // <--- Import Routes

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Mount the API Routes
app.use('/api', apiRoutes); // <--- Use Routes

// Basic Health Check
app.get('/', (req, res) => {
    res.send('Geo-Aware RMS Backend is Running');
});

app.listen(PORT, () => {
    console.log(`🚀 Server listening on http://localhost:${PORT}`);
});
