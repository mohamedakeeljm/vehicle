import express from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import prisma from '../prisma.js';
import { generateToken, authenticateToken } from '../middleware/auth.js';
import { sendEmail } from '../services/emailService.js';

const router = express.Router();

/**
 * Sri Lankan Phone Number validation:
 * Supports +947XXXXXXXX, 07XXXXXXXX, 7XXXXXXXX
 */
function isValidSriLankanPhone(phone) {
  if (!phone) return false;
  const cleaned = phone.replace(/[\s\-]/g, '');
  return /^(\+94|0)?7[0-9]{8}$/.test(cleaned);
}

function normalizeSriLankanPhone(phone) {
  let cleaned = phone.replace(/[\s\-]/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '+94' + cleaned.substring(1);
  } else if (!cleaned.startsWith('+94')) {
    cleaned = '+94' + cleaned;
  }
  return cleaned;
}

/**
 * POST /api/auth/register
 */
router.post('/register', async (req, res) => {
  try {
    const { fullName, email, phoneNumber, password, confirmPassword } = req.body;

    if (!fullName || !email || !phoneNumber || !password) {
      return res.status(400).json({
        success: false,
        message: 'All registration fields are required.',
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Password and Confirm Password do not match.',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.',
      });
    }

    if (!isValidSriLankanPhone(phoneNumber)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid Sri Lankan mobile phone number (e.g. +94771234567 or 0771234567).',
      });
    }

    const normalizedPhone = normalizeSriLankanPhone(phoneNumber);
    const normalizedEmail = email.trim().toLowerCase();

    // Check existing email
    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists.',
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        fullName: fullName.trim(),
        email: normalizedEmail,
        phoneNumber: normalizedPhone,
        passwordHash,
        role: 'USER',
        notificationPreference: {
          create: {
            emailEnabled: true,
            inAppEnabled: true,
            smsEnabled: false,
            whatsappEnabled: false,
            reminderDays: '15,7,3,1,0',
          },
        },
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        phoneNumber: true,
        role: true,
        createdAt: true,
      },
    });

    const token = generateToken(user);

    return res.status(201).json({
      success: true,
      message: 'Registration successful! Welcome to VehicleGuard LK.',
      token,
      user,
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to register account.',
      error: error.message,
    });
  }
});

/**
 * POST /api/auth/login
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.',
      });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
      include: {
        notificationPreference: true,
      },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const token = generateToken(user);

    return res.json({
      success: true,
      message: 'Login successful.',
      token,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        role: user.role,
        avatarUrl: user.avatarUrl,
        notificationPreference: user.notificationPreference,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to login.',
      error: error.message,
    });
  }
});

/**
 * GET /api/auth/me
 */
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        notificationPreference: true,
      },
    });

    return res.json({
      success: true,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        role: user.role,
        avatarUrl: user.avatarUrl,
        notificationPreference: user.notificationPreference,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch user profile.',
    });
  }
});

/**
 * PUT /api/auth/profile
 */
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { fullName, phoneNumber, avatarUrl } = req.body;

    if (phoneNumber && !isValidSriLankanPhone(phoneNumber)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Sri Lankan phone number format.',
      });
    }

    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        ...(fullName ? { fullName: fullName.trim() } : {}),
        ...(phoneNumber ? { phoneNumber: normalizeSriLankanPhone(phoneNumber) } : {}),
        ...(avatarUrl !== undefined ? { avatarUrl } : {}),
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        phoneNumber: true,
        role: true,
        avatarUrl: true,
      },
    });

    return res.json({
      success: true,
      message: 'Profile updated successfully.',
      user: updated,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update profile.',
      error: error.message,
    });
  }
});

/**
 * PUT /api/auth/change-password
 */
router.put('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required.',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters.',
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password does not match our records.',
      });
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: req.user.id },
      data: { passwordHash: newHash },
    });

    return res.json({
      success: true,
      message: 'Password changed successfully.',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to change password.',
    });
  }
});

/**
 * POST /api/auth/forgot-password
 */
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email address is required.',
      });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });

    if (!user) {
      // Return success to avoid email enumeration
      return res.json({
        success: true,
        message: 'If an account exists with this email, a reset link has been dispatched.',
      });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    });

    const resetUrl = `${process.env.APP_URL || 'http://localhost:5173'}/reset-password?token=${token}`;

    try {
      await sendEmail({
        to: user.email,
        subject: 'Password Reset Request – VehicleGuard LK',
        text: `Hello ${user.fullName},\n\nYou requested to reset your password. Click the link below to set a new password:\n\n${resetUrl}\n\nThis link will expire in 1 hour.\n\nThank you,\nVehicleGuard LK Team`,
        html: `
          <div style="font-family: sans-serif; padding: 20px;">
            <h2>Reset Your Password</h2>
            <p>Dear ${user.fullName},</p>
            <p>You requested a password reset for your <strong>VehicleGuard LK</strong> account.</p>
            <p><a href="${resetUrl}" style="display:inline-block; padding:10px 20px; background:#1E3E62; color:#fff; text-decoration:none; border-radius:6px;">Reset Password</a></p>
            <p>Or copy this link to your browser: <br>${resetUrl}</p>
            <p>This link is valid for 1 hour.</p>
          </div>
        `,
      });
    } catch (e) {
      console.warn('Failed to dispatch reset email:', e.message);
    }

    return res.json({
      success: true,
      message: 'If an account exists with this email, a reset link has been dispatched.',
      // For easy local testing / demo without checking email server:
      debugToken: process.env.NODE_ENV === 'development' ? token : undefined,
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to process request.',
    });
  }
});

/**
 * POST /api/auth/reset-password
 */
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Token and new password are required.',
      });
    }

    const resetRecord = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!resetRecord || resetRecord.used || resetRecord.expiresAt < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired password reset token.',
      });
    }

    const newHash = await bcrypt.hash(newPassword, 10);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetRecord.userId },
        data: { passwordHash: newHash },
      }),
      prisma.passwordResetToken.update({
        where: { id: resetRecord.id },
        data: { used: true },
      }),
    ]);

    return res.json({
      success: true,
      message: 'Password reset successfully. You can now log in with your new password.',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to reset password.',
    });
  }
});

export default router;
