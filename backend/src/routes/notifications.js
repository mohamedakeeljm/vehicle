import express from 'express';
import prisma from '../prisma.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/notifications
 * Fetch user's in-app notifications
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.id },
      include: {
        document: {
          include: {
            vehicle: true,
            documentType: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const unreadCount = await prisma.notification.count({
      where: { userId: req.user.id, isRead: false },
    });

    return res.json({
      success: true,
      unreadCount,
      data: notifications,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve notifications.',
    });
  }
});

/**
 * PUT /api/notifications/:id/read
 * Mark notification as read
 */
router.put('/:id/read', authenticateToken, async (req, res) => {
  try {
    await prisma.notification.updateMany({
      where: { id: req.params.id, userId: req.user.id },
      data: { isRead: true },
    });
    return res.json({ success: true, message: 'Notification marked as read.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update notification.' });
  }
});

/**
 * PUT /api/notifications/mark-all-read
 * Mark all notifications as read
 */
router.put('/mark-all-read', authenticateToken, async (req, res) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user.id, isRead: false },
      data: { isRead: true },
    });
    return res.json({ success: true, message: 'All notifications marked as read.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update notifications.' });
  }
});

/**
 * GET /api/notifications/preferences
 * Fetch user notification preferences
 */
router.get('/preferences', authenticateToken, async (req, res) => {
  try {
    let pref = await prisma.notificationPreference.findUnique({
      where: { userId: req.user.id },
    });

    if (!pref) {
      pref = await prisma.notificationPreference.create({
        data: {
          userId: req.user.id,
          emailEnabled: true,
          inAppEnabled: true,
          smsEnabled: false,
          whatsappEnabled: false,
          reminderDays: '15,7,3,1,0',
        },
      });
    }

    return res.json({ success: true, data: pref });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch preferences.' });
  }
});

/**
 * PUT /api/notifications/preferences
 * Update user notification preferences
 */
router.put('/preferences', authenticateToken, async (req, res) => {
  try {
    const { emailEnabled, inAppEnabled, smsEnabled, whatsappEnabled, reminderDays } = req.body;

    const pref = await prisma.notificationPreference.upsert({
      where: { userId: req.user.id },
      update: {
        ...(emailEnabled !== undefined ? { emailEnabled: Boolean(emailEnabled) } : {}),
        ...(inAppEnabled !== undefined ? { inAppEnabled: Boolean(inAppEnabled) } : {}),
        ...(smsEnabled !== undefined ? { smsEnabled: Boolean(smsEnabled) } : {}),
        ...(whatsappEnabled !== undefined ? { whatsappEnabled: Boolean(whatsappEnabled) } : {}),
        ...(reminderDays ? { reminderDays: reminderDays.toString() } : {}),
      },
      create: {
        userId: req.user.id,
        emailEnabled: emailEnabled !== undefined ? Boolean(emailEnabled) : true,
        inAppEnabled: inAppEnabled !== undefined ? Boolean(inAppEnabled) : true,
        smsEnabled: smsEnabled !== undefined ? Boolean(smsEnabled) : false,
        whatsappEnabled: whatsappEnabled !== undefined ? Boolean(whatsappEnabled) : false,
        reminderDays: reminderDays ? reminderDays.toString() : '15,7,3,1,0',
      },
    });

    return res.json({
      success: true,
      message: 'Notification preferences updated successfully.',
      data: pref,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update preferences.' });
  }
});

export default router;
