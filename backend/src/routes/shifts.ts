import { Router, Response } from 'express';
import prisma from '../lib/prisma';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticate);

// POST /api/shifts/start
router.post('/start', requireRole('DRIVER'), async (req: AuthRequest, res: Response): Promise<void> => {
  const { vehicleId, startKm } = req.body;
  if (!vehicleId || startKm === undefined) {
    res.status(400).json({ error: 'vehicleId and startKm are required' });
    return;
  }
  try {
    // Check no active shift exists
    const existing = await prisma.shift.findFirst({
      where: { driverId: req.user!.id, status: 'ACTIVE' },
    });
    if (existing) {
      res.status(409).json({ error: 'You already have an active shift' });
      return;
    }
    // Check vehicle available
    const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
    if (!vehicle || vehicle.status !== 'AVAILABLE') {
      res.status(409).json({ error: 'Vehicle is not available' });
      return;
    }
    const [shift] = await prisma.$transaction([
      prisma.shift.create({
        data: { driverId: req.user!.id, vehicleId, startKm: Number(startKm), startedAt: new Date() },
      }),
      prisma.vehicle.update({ where: { id: vehicleId }, data: { status: 'ON_SHIFT' } }),
    ]);
    res.status(201).json(shift);
  } catch {
    res.status(500).json({ error: 'Failed to start shift' });
  }
});

// PATCH /api/shifts/:id/end
router.patch('/:id/end', requireRole('DRIVER'), async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { endKm, grossEarnings } = req.body;
  if (!endKm) { res.status(400).json({ error: 'endKm is required' }); return; }
  try {
    const shift = await prisma.shift.findUnique({ where: { id } });
    if (!shift || shift.driverId !== req.user!.id) {
      res.status(404).json({ error: 'Shift not found' });
      return;
    }
    if (shift.status !== 'ACTIVE') {
      res.status(409).json({ error: 'Shift is not active' });
      return;
    }
    const totalKm = Number(endKm) - shift.startKm;
    const gross = Number(grossEarnings ?? 0);

    // Get fleet commission rates
    const driver = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: { fleet: true },
    });
    const platformCutBps = driver?.fleet?.platformCutBps ?? 1500;
    const fleetCutBps = driver?.fleet?.fleetCutBps ?? 1000;
    const platformCut = (gross * platformCutBps) / 10000;
    const fleetCut = (gross * fleetCutBps) / 10000;
    const driverNet = gross - platformCut - fleetCut;

    const [updatedShift] = await prisma.$transaction([
      prisma.shift.update({
        where: { id },
        data: { endKm: Number(endKm), totalKm, grossEarnings: gross, endedAt: new Date(), status: 'COMPLETED' },
      }),
      prisma.vehicle.update({ where: { id: shift.vehicleId }, data: { status: 'AVAILABLE', currentKm: Number(endKm) } }),
      prisma.earnings.create({
        data: {
          driverId: req.user!.id,
          fleetId: driver!.fleetId!,
          shiftId: id,
          platformCutBps, fleetCutBps,
          grossAmount: gross, platformCut, fleetCut, driverNet,
          periodDate: new Date(),
        },
      }),
    ]);
    res.json(updatedShift);
  } catch {
    res.status(500).json({ error: 'Failed to end shift' });
  }
});

// GET /api/shifts/active — driver's current shift
router.get('/active', requireRole('DRIVER'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const shift = await prisma.shift.findFirst({
      where: { driverId: req.user!.id, status: 'ACTIVE' },
      include: { vehicle: true },
    });
    res.json(shift);
  } catch {
    res.status(500).json({ error: 'Failed to fetch active shift' });
  }
});

// GET /api/shifts/my — driver's shift history
router.get('/my', requireRole('DRIVER'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const shifts = await prisma.shift.findMany({
      where: { driverId: req.user!.id },
      include: { vehicle: true, earnings: true },
      orderBy: { startedAt: 'desc' },
      take: 30,
    });
    res.json(shifts);
  } catch {
    res.status(500).json({ error: 'Failed to fetch shifts' });
  }
});

// PATCH /api/shifts/:id/location — GPS update from mobile
router.patch('/:id/location', requireRole('DRIVER'), async (req: AuthRequest, res: Response): Promise<void> => {
  const { lat, lng } = req.body;
  try {
    await prisma.shift.update({
      where: { id: req.params.id },
      data: { lastLat: lat, lastLng: lng, locationAt: new Date() },
    });
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: 'Failed to update location' });
  }
});

export default router;
