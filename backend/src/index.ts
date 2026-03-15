import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRouter from './routes/auth';
import adminRouter from './routes/admin';
import fleetRouter from './routes/fleet';
import shiftsRouter from './routes/shifts';
import driversRouter from './routes/drivers';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));
app.use(express.json());

// Health check — used by Railway
app.get('/health', (_, res) => {
  res.json({ status: 'ok', app: 'Clean Drive API', timestamp: new Date() });
});

// Routes
app.use('/api/auth', authRouter);
app.use('/api/admin', adminRouter);
app.use('/api/fleet', fleetRouter);
app.use('/api/shifts', shiftsRouter);
app.use('/api/drivers', driversRouter);

// 404 handler
app.use((_, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`✅ Clean Drive API running on http://localhost:${PORT}`);
});

export default app;
