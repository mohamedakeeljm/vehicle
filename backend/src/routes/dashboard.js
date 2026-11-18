import express from 'express';
import prisma from '../prisma.js';
import { authenticateToken } from '../middleware/auth.js';
import { calculateDaysRemaining, getDocumentStatusMeta } from '../utils/dateUtils.js';

const router = express.Router();

/**
 * GET /api/dashboard/summary
 * Aggregate all key metrics for user dashboard:
 * - Total Vehicles
 * - Total Active Documents
 * - Expiring Within 15 Days
 * - Expired Documents
 * - Upcoming Renewals
 * - Document Status Breakdown
 * - Recent Notifications
 */
router.get('/summary', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // 1. Total vehicles
    const totalVehicles = await prisma.vehicle.count({
      where: { userId },
    });

    // 2. Fetch all documents for this user
    const documents = await prisma.vehicleDocument.findMany({
      where: {
        vehicle: { userId },
      },
      include: {
        vehicle: true,
        documentType: true,
      },
      orderBy: { expiryDate: 'asc' },
    });

    let totalActive = 0;
    let expiringWithin15 = 0;
    let expired = 0;
    let valid = 0;

    const upcomingExpiringList = [];

    documents.forEach((doc) => {
      const days = calculateDaysRemaining(doc.expiryDate);
      const meta = getDocumentStatusMeta(days);

      if (doc.renewalStatus === 'ACTIVE' || doc.renewalStatus === 'EXPIRED') {
        totalActive++;
      }

      if (meta.status === 'EXPIRED') {
        expired++;
      } else if (meta.status === 'EXPIRING') {
        expiringWithin15++;
      } else {
        valid++;
      }

      // Collect documents that are expiring within 30 days or overdue
      if (days <= 30) {
        upcomingExpiringList.push({
          id: doc.id,
          vehicleId: doc.vehicleId,
          vehicleNumber: doc.vehicle.registrationNumber,
          vehicleModel: `${doc.vehicle.brand} ${doc.vehicle.model}`,
          documentName: doc.customTypeName || doc.documentType?.name,
          category: doc.documentType?.category,
          expiryDate: doc.expiryDate,
          daysRemaining: days,
          statusMeta: meta,
        });
      }
    });

    // 3. Recent notifications (last 5)
    const recentNotifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    // 4. Renewal history (last 5)
    const recentRenewals = await prisma.documentRenewalHistory.findMany({
      where: {
        document: {
          vehicle: { userId },
        },
      },
      include: {
        document: {
          include: {
            vehicle: true,
            documentType: true,
          },
        },
      },
      orderBy: { renewedAt: 'desc' },
      take: 5,
    });

    return res.json({
      success: true,
      data: {
        metrics: {
          totalVehicles,
          totalDocuments: documents.length,
          totalActive,
          expiringWithin15,
          expired,
          valid,
        },
        chartData: [
          { name: 'Valid', count: valid, color: '#10B981' },
          { name: 'Expiring Soon (<=15d)', count: expiringWithin15, color: '#F59E0B' },
          { name: 'Expired', count: expired, color: '#EF4444' },
        ],
        upcomingExpiring: upcomingExpiringList.sort((a, b) => a.daysRemaining - b.daysRemaining),
        recentNotifications,
        recentRenewals,
      },
    });
  } catch (error) {
    console.error('Dashboard summary error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve dashboard analytics.',
    });
  }
});

export default router;
