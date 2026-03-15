import { Router, Response } from 'express';
import prisma from '../lib/prisma';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticate, requireRole('SUPER_ADMIN'));

// GET /api/admin/stats — dashboard overview
router.get('/stats', async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [totalVehicles, totalDrivers, totalFleets, activeShifts, earningsAgg] = await Promise.all([
      prisma.vehicle.count(),
      prisma.user.count({ where: { role: 'DRIVER' } }),
      prisma.fleet.count(),
      prisma.shift.count({ where: { status: 'ACTIVE' } }),
      prisma.earnings.aggregate({ _sum: { grossAmount: true } }),
    ]);
    res.json({
      totalVehicles,
      totalDrivers,
      totalFleets,
      activeShifts,
      totalEarnings: earningsAgg._sum.grossAmount ?? 0,
    });
  } catch {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// GET /api/admin/fleets
router.get('/fleets', async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const fleets = await prisma.fleet.findMany({
      include: {
        owner: { select: { id: true, fullName: true, email: true } },
        _count: { select: { drivers: true, vehicles: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(fleets);
  } catch {
    res.status(500).json({ error: 'Failed to fetch fleets' });
  }
});

// GET /api/admin/drivers
router.get('/drivers', async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const drivers = await prisma.user.findMany({
      where: { role: 'DRIVER' },
      select: {
        id: true, fullName: true, email: true, phone: true, fleetId: true,
        fleet: { select: { name: true } },
        _count: { select: { shifts: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(drivers);
  } catch {
    res.status(500).json({ error: 'Failed to fetch drivers' });
  }
});

export default router;
