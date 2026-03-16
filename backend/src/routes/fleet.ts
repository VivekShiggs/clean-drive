import { Router, Response } from 'express';
import multer from 'multer';
import * as XLSX from 'xlsx';
import bcrypt from 'bcryptjs';
import prisma from '../lib/prisma';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.use(authenticate, requireRole('FLEET_OWNER', 'SUPER_ADMIN'));

// GET /api/fleet/stats
router.get('/stats', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const fleetId = req.user!.fleetId!;
    const [totalDrivers, totalVehicles, pendingEarnings, totalEarnings] = await Promise.all([
      prisma.user.count({ where: { fleetId, role: 'DRIVER' } }),
      prisma.vehicle.count({ where: { fleetId } }),
      prisma.earnings.count({ where: { fleetId, status: 'PENDING' } }),
      prisma.earnings.aggregate({ where: { fleetId }, _sum: { driverNet: true } }),
    ]);
    res.json({ totalDrivers, totalVehicles, pendingEarnings, totalEarnings: totalEarnings._sum.driverNet ?? 0 });
  } catch {
    res.status(500).json({ error: 'Failed to fetch fleet stats' });
  }
});

// ─── DRIVERS ─────────────────────────────────────────────────────────────────

// GET /api/fleet/drivers
router.get('/drivers', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const drivers = await prisma.user.findMany({
      where: { fleetId: req.user!.fleetId!, role: 'DRIVER' },
      select: {
        id: true, fullName: true, email: true, phone: true,
        licenceNumber: true, licenceExpiry: true,
        shifts: { where: { status: 'COMPLETED' }, select: { grossEarnings: true } },
      },
      orderBy: { fullName: 'asc' },
    });
    const result = drivers.map(d => ({
      ...d,
      totalEarnings: d.shifts.reduce((sum, s) => sum + Number(s.grossEarnings ?? 0), 0),
      totalShifts: d.shifts.length,
      shifts: undefined,
    }));
    res.json(result);
  } catch {
    res.status(500).json({ error: 'Failed to fetch drivers' });
  }
});

// POST /api/fleet/drivers — add single driver
router.post('/drivers', async (req: AuthRequest, res: Response): Promise<void> => {
  const { fullName, email, password, phone, licenceNumber, licenceExpiry } = req.body;
  if (!fullName || !email || !password) {
    res.status(400).json({ error: 'fullName, email and password are required' });
    return;
  }
  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) { res.status(409).json({ error: 'Email already registered' }); return; }
    const passwordHash = await bcrypt.hash(password, 12);
    const driver = await prisma.user.create({
      data: {
        fullName, email, passwordHash,
        phone: phone ? String(phone) : null,
        licenceNumber: licenceNumber || null,
        licenceExpiry: licenceExpiry ? new Date(licenceExpiry) : null,
        role: 'DRIVER',
        fleetId: req.user!.fleetId!,
      },
      select: { id: true, fullName: true, email: true, phone: true, licenceNumber: true },
    });
    res.status(201).json(driver);
  } catch {
    res.status(500).json({ error: 'Failed to add driver' });
  }
});

// PATCH /api/fleet/drivers/:id — edit driver
router.patch('/drivers/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { fullName, email, phone, licenceNumber, licenceExpiry, password } = req.body;
  try {
    const driver = await prisma.user.findUnique({ where: { id } });
    if (!driver || driver.fleetId !== req.user!.fleetId!) {
      res.status(404).json({ error: 'Driver not found' }); return;
    }
    const data: any = {};
    if (fullName) data.fullName = fullName;
    if (email) data.email = email;
    if (phone !== undefined) data.phone = phone ? String(phone) : null;
    if (licenceNumber !== undefined) data.licenceNumber = licenceNumber || null;
    if (licenceExpiry !== undefined) data.licenceExpiry = licenceExpiry ? new Date(licenceExpiry) : null;
    if (password) data.passwordHash = await bcrypt.hash(password, 12);
    const updated = await prisma.user.update({
      where: { id }, data,
      select: { id: true, fullName: true, email: true, phone: true, licenceNumber: true },
    });
    res.json(updated);
  } catch {
    res.status(500).json({ error: 'Failed to update driver' });
  }
});

// DELETE /api/fleet/drivers/:id
router.delete('/drivers/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  try {
    const driver = await prisma.user.findUnique({ where: { id } });
    if (!driver || driver.fleetId !== req.user!.fleetId!) {
      res.status(404).json({ error: 'Driver not found' }); return;
    }
    const activeShift = await prisma.shift.findFirst({ where: { driverId: id, status: 'ACTIVE' } });
    if (activeShift) {
      res.status(409).json({ error: 'Cannot delete driver with an active shift' }); return;
    }
    await prisma.user.delete({ where: { id } });
    res.json({ message: 'Driver removed successfully' });
  } catch {
    res.status(500).json({ error: 'Failed to delete driver' });
  }
});

// ─── VEHICLES ────────────────────────────────────────────────────────────────

// GET /api/fleet/vehicles
router.get('/vehicles', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const vehicles = await prisma.vehicle.findMany({
      where: { fleetId: req.user!.fleetId! },
      orderBy: { plateNumber: 'asc' },
    });
    res.json(vehicles);
  } catch {
    res.status(500).json({ error: 'Failed to fetch vehicles' });
  }
});

// POST /api/fleet/vehicles — add vehicle
router.post('/vehicles', async (req: AuthRequest, res: Response): Promise<void> => {
  const { plateNumber, make, model, year, colour, currentKm } = req.body;
  if (!plateNumber || !make || !model || !year) {
    res.status(400).json({ error: 'plateNumber, make, model and year are required' });
    return;
  }
  try {
    const existing = await prisma.vehicle.findUnique({ where: { plateNumber } });
    if (existing) { res.status(409).json({ error: 'Plate number already exists' }); return; }
    const vehicle = await prisma.vehicle.create({
      data: {
        plateNumber, make, model,
        year: Number(year),
        colour: colour || null,
        currentKm: currentKm ? Number(currentKm) : 0,
        fleetId: req.user!.fleetId!,
      },
    });
    res.status(201).json(vehicle);
  } catch {
    res.status(500).json({ error: 'Failed to add vehicle' });
  }
});

// PATCH /api/fleet/vehicles/:id — edit vehicle
router.patch('/vehicles/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { plateNumber, make, model, year, colour, currentKm, status } = req.body;
  try {
    const vehicle = await prisma.vehicle.findUnique({ where: { id } });
    if (!vehicle || vehicle.fleetId !== req.user!.fleetId!) {
      res.status(404).json({ error: 'Vehicle not found' }); return;
    }
    const data: any = {};
    if (plateNumber) data.plateNumber = plateNumber;
    if (make) data.make = make;
    if (model) data.model = model;
    if (year) data.year = Number(year);
    if (colour !== undefined) data.colour = colour || null;
    if (currentKm !== undefined) data.currentKm = Number(currentKm);
    if (status) data.status = status;
    const updated = await prisma.vehicle.update({ where: { id }, data });
    res.json(updated);
  } catch {
    res.status(500).json({ error: 'Failed to update vehicle' });
  }
});

// DELETE /api/fleet/vehicles/:id
router.delete('/vehicles/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  try {
    const vehicle = await prisma.vehicle.findUnique({ where: { id } });
    if (!vehicle || vehicle.fleetId !== req.user!.fleetId!) {
      res.status(404).json({ error: 'Vehicle not found' }); return;
    }
    if (vehicle.status === 'ON_SHIFT') {
      res.status(409).json({ error: 'Cannot delete vehicle currently on a shift' }); return;
    }
    await prisma.vehicle.delete({ where: { id } });
    res.json({ message: 'Vehicle removed successfully' });
  } catch {
    res.status(500).json({ error: 'Failed to delete vehicle' });
  }
});

// ─── BULK UPLOAD ─────────────────────────────────────────────────────────────

router.post('/upload', upload.single('file'), async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.file) { res.status(400).json({ error: 'No file uploaded' }); return; }
  try {
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const results: { drivers: number; vehicles: number; errors: string[] } = { drivers: 0, vehicles: 0, errors: [] };
    const fleetId = req.user!.fleetId!;

    if (workbook.SheetNames.includes('Drivers')) {
      const sheet = XLSX.utils.sheet_to_json<any>(workbook.Sheets['Drivers']);
      for (const row of sheet) {
        try {
          const hash = await bcrypt.hash(row.password || 'CleanDrive123!', 12);
          await prisma.user.upsert({
            where: { email: row.email },
            update: {},
            create: {
              email: row.email, passwordHash: hash,
              fullName: row.fullName || row.full_name,
              phone: row.phone ? String(row.phone) : null,
              licenceNumber: row.licenceNumber || row.licence_number || null,
              role: 'DRIVER', fleetId,
            },
          });
          results.drivers++;
        } catch (e: any) {
          results.errors.push(`Driver ${row.email}: ${e.message}`);
        }
      }
    }

    if (workbook.SheetNames.includes('Vehicles')) {
      const sheet = XLSX.utils.sheet_to_json<any>(workbook.Sheets['Vehicles']);
      for (const row of sheet) {
        try {
          if (!fleetId) { results.errors.push(`Vehicle: No fleet associated`); continue; }
          await prisma.vehicle.upsert({
            where: { plateNumber: row.plateNumber || row.plate_number },
            update: {},
            create: {
              plateNumber: row.plateNumber || row.plate_number,
              make: row.make, model: row.model, year: Number(row.year),
              colour: row.colour || null, fleetId,
            },
          });
          results.vehicles++;
        } catch (e: any) {
          results.errors.push(`Vehicle ${row.plateNumber || row.plate_number}: ${e.message}`);
        }
      }
    }
    res.json({ message: 'Upload complete', ...results });
  } catch {
    res.status(500).json({ error: 'Upload failed' });
  }
});

// ─── EARNINGS & PAYSLIPS ─────────────────────────────────────────────────────

router.get('/earnings', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const earnings = await prisma.earnings.findMany({
      where: { fleetId: req.user!.fleetId! },
      include: {
        driver: { select: { fullName: true, email: true } },
        shift: { select: { startedAt: true, totalKm: true } },
      },
      orderBy: { periodDate: 'desc' },
    });
    res.json(earnings);
  } catch {
    res.status(500).json({ error: 'Failed to fetch earnings' });
  }
});

router.post('/payslip/:driverId', async (req: AuthRequest, res: Response): Promise<void> => {
  const { driverId } = req.params;
  const { periodFrom, periodTo } = req.body;
  try {
    const earnings = await prisma.earnings.findMany({
      where: {
        driverId, fleetId: req.user!.fleetId!,
        status: 'APPROVED',
        periodDate: { gte: new Date(periodFrom), lte: new Date(periodTo) },
        payslipId: null,
      },
    });
    if (!earnings.length) { res.status(404).json({ error: 'No approved earnings found for this period' }); return; }
    const totalGross = earnings.reduce((s, e) => s + Number(e.grossAmount), 0);
    const totalDeductions = earnings.reduce((s, e) => s + Number(e.platformCut) + Number(e.fleetCut), 0);
    const totalNet = earnings.reduce((s, e) => s + Number(e.driverNet), 0);
    const payslip = await prisma.payslip.create({
      data: {
        driverId, fleetId: req.user!.fleetId!,
        periodFrom: new Date(periodFrom), periodTo: new Date(periodTo),
        totalGross, totalDeductions, totalNet,
      },
    });
    await prisma.earnings.updateMany({
      where: { id: { in: earnings.map(e => e.id) } },
      data: { payslipId: payslip.id, status: 'PAID' },
    });
    res.status(201).json(payslip);
  } catch {
    res.status(500).json({ error: 'Failed to generate payslip' });
  }
});

export default router;
