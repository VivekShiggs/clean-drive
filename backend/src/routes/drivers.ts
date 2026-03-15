import { Router, Response } from 'express';
import prisma from '../lib/prisma';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticate);

// GET /api/drivers/earnings/today — driver sees today's earnings
router.get('/earnings/today', requireRole('DRIVER'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const earnings = await prisma.earnings.findMany({
      where: { driverId: req.user!.id, periodDate: { gte: today } },
    });
    const total = earnings.reduce((s, e) => s + Number(e.driverNet), 0);
    res.json({ total, records: earnings });
  } catch {
    res.status(500).json({ error: 'Failed to fetch earnings' });
  }
});

// GET /api/drivers/vehicles/available — list available vehicles in fleet
router.get('/vehicles/available', requireRole('DRIVER'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const vehicles = await prisma.vehicle.findMany({
      where: { fleetId: req.user!.fleetId!, status: 'AVAILABLE' },
      select: { id: true, plateNumber: true, make: true, model: true, year: true, colour: true },
    });
    res.json(vehicles);
  } catch {
    res.status(500).json({ error: 'Failed to fetch vehicles' });
  }
});

export default router;
