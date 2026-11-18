import express from 'express';
import prisma from '../prisma.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import { runReminderJob } from '../services/reminderScheduler.js';
import { calculateDaysRemaining, getDocumentStatusMeta } from '../utils/dateUtils.js';

const router = express.Router();

// Apply auth + requireAdmin to all admin endpoints
router.use(authenticateToken, requireAdmin);

/**
 * GET /api/admin/stats
 * View high-level system statistics (users, vehicles, active/expiring/expired documents, logs)
 */
router.get('/stats', async (req, res) => {
  try {
    const totalUsers = await prisma.user.count();
    const totalVehicles = await prisma.vehicle.count();
    const totalDocuments = await prisma.vehicleDocument.count();
    const totalJobRuns = await prisma.scheduledJobRun.count();

    const documents = await prisma.vehicleDocument.findMany({
      select: { expiryDate: true },
    });

    let validCount = 0;
    let expiringCount = 0;
    let expiredCount = 0;

    documents.forEach((d) => {
      const days = calculateDaysRemaining(d.expiryDate);
      const meta = getDocumentStatusMeta(days);
      if (meta.status === 'EXPIRED') expiredCount++;
      else if (meta.status === 'EXPIRING') expiringCount++;
      else validCount++;
    });

    const recentDeliveries = await prisma.notificationDeliveryLog.count();
    const failedDeliveries = await prisma.notificationDeliveryLog.count({
      where: { status: 'FAILED' },
    });

    return res.json({
      success: true,
      data: {
        totalUsers,
        totalVehicles,
        totalDocuments,
        totalJobRuns,
        documentBreakdown: {
          valid: validCount,
          expiring: expiringCount,
          expired: expiredCount,
        },
        deliveryStats: {
          total: recentDeliveries,
          failed: failedDeliveries,
          success: recentDeliveries - failedDeliveries,
        },
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch admin stats.' });
  }
});

/**
 * GET /api/admin/users
 * Manage user accounts (metadata only; privacy-protected)
 */
router.get('/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        fullName: true,
        email: true,
        phoneNumber: true,
        role: true,
        createdAt: true,
        _count: {
          select: {
            vehicles: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ success: true, data: users });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch users.' });
  }
});

/**
 * GET /api/admin/expiring-documents
 * Monitor all documents across all users that are expiring or expired
 */
router.get('/expiring-documents', async (req, res) => {
  try {
    const documents = await prisma.vehicleDocument.findMany({
      include: {
        vehicle: {
          include: {
            user: {
              select: { id: true, fullName: true, email: true, phoneNumber: true },
            },
          },
        },
        documentType: true,
      },
      orderBy: { expiryDate: 'asc' },
    });

    const enriched = documents
      .map((doc) => {
        const daysRemaining = calculateDaysRemaining(doc.expiryDate);
        return {
          id: doc.id,
          registrationNumber: doc.vehicle.registrationNumber,
          vehicleType: doc.vehicle.vehicleType,
          brandModel: `${doc.vehicle.brand} ${doc.vehicle.model}`,
          ownerName: doc.vehicle.ownerName,
          ownerEmail: doc.vehicle.user.email,
          documentName: doc.customTypeName || doc.documentType?.name,
          category: doc.documentType?.category,
          expiryDate: doc.expiryDate,
          daysRemaining,
          statusMeta: getDocumentStatusMeta(daysRemaining),
        };
      })
      .filter((d) => d.daysRemaining <= 15); // Expiring or expired

    return res.json({ success: true, data: enriched });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch expiring documents.' });
  }
});

/**
 * GET /api/admin/delivery-logs
 * View notification delivery audit logs
 */
router.get('/delivery-logs', async (req, res) => {
  try {
    const logs = await prisma.notificationDeliveryLog.findMany({
      include: {
        user: { select: { fullName: true, email: true } },
        document: {
          include: {
            vehicle: { select: { registrationNumber: true } },
            documentType: true,
          },
        },
      },
      orderBy: { sentAt: 'desc' },
      take: 100,
    });

    return res.json({ success: true, data: logs });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch delivery logs.' });
  }
});

/**
 * GET /api/admin/job-runs
 * View scheduled job execution history
 */
router.get('/job-runs', async (req, res) => {
  try {
    const jobs = await prisma.scheduledJobRun.findMany({
      orderBy: { executionDate: 'desc' },
      take: 30,
    });

    return res.json({ success: true, data: jobs });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch job runs.' });
  }
});

/**
 * POST /api/admin/trigger-scheduler
 * Manually trigger the background scheduler job on demand
 */
router.post('/trigger-scheduler', async (req, res) => {
  try {
    const result = await runReminderJob();
    return res.json({
      success: true,
      message: 'Background reminder job executed successfully.',
      result,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to execute reminder job.',
      error: error.message,
    });
  }
});

export default router;
