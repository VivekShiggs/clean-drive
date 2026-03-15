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

// GET /api/fleet/drivers
router.get('/drivers', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const drivers = await prisma.user.findMany({
      where: { fleetId: req.user!.fleetId!, role: 'DRIVER' },
      select: {
        id: true, fullName: true, email: true, phone: true, licenceNumber: true,
        shifts: {
          where: { status: 'COMPLETED' },
          select: { grossEarnings: true },
        },
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

// POST /api/fleet/upload — bulk import via .xlsx
router.post('/upload', upload.single('file'), async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.file) { res.status(400).json({ error: 'No file uploaded' }); return; }
  try {
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const results: { drivers: number; vehicles: number; errors: string[] } = {
      drivers: 0, vehicles: 0, errors: [],
    };
    const fleetId = req.user!.fleetId!;

    // Expect a sheet named "Drivers"
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
              phone: row.phone || null,
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

    // Expect a sheet named "Vehicles"
    if (workbook.SheetNames.includes('Vehicles')) {
      const sheet = XLSX.utils.sheet_to_json<any>(workbook.Sheets['Vehicles']);
      for (const row of sheet) {
        try {
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
          results.errors.push(`Vehicle ${row.plateNumber}: ${e.message}`);
        }
      }
    }
    res.json({ message: 'Upload complete', ...results });
  } catch {
    res.status(500).json({ error: 'Upload failed' });
  }
});

// GET /api/fleet/earnings
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

// POST /api/fleet/payslip/:driverId
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
    if (!earnings.length) {
      res.status(404).json({ error: 'No approved earnings found for this period' });
      return;
    }
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
