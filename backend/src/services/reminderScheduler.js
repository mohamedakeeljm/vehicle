import prisma from '../prisma.js';
import { calculateDaysRemaining, getSriLankaNow } from '../utils/dateUtils.js';
import { buildReminderEmailContent, sendEmail } from './emailService.js';

/**
 * Executes the automated reminder cycle for all active vehicle documents.
 * 
 * Rules:
 * - Timezone: Asia/Colombo
 * - Default trigger points: 15, 7, 3, 1, 0 days before expiry (and negative for overdue)
 * - Checks user notification preferences
 * - Prevents duplicate notifications for the same (documentId, channel, daysRemaining, targetExpiry)
 * - Records delivery log and creates in-app notification
 * - Safe error handling & retry logging
 * 
 * @param {Object} options
 * @param {Date} [options.mockCurrentDate] Optional date override for testing
 * @returns {Promise<Object>} Summary of run results
 */
export async function runReminderJob(options = {}) {
  const startTime = Date.now();
  const baseDate = options.mockCurrentDate ? getSriLankaNow().set({
    year: options.mockCurrentDate.getFullYear(),
    month: options.mockCurrentDate.getMonth() + 1,
    day: options.mockCurrentDate.getDate(),
  }) : getSriLankaNow();

  console.log(`\n⏰ [VehicleGuard Scheduler] Running Reminder Scan at ${baseDate.toISO()} (Asia/Colombo)`);

  const jobRun = await prisma.scheduledJobRun.create({
    data: {
      jobName: 'DOCUMENT_EXPIRY_REMINDER',
      executionDate: new Date(),
      status: 'RUNNING',
    },
  });

  let scannedCount = 0;
  let remindersSent = 0;
  let failuresCount = 0;
  const executionLogs = [];

  try {
    // 1. Fetch all ACTIVE documents with vehicle and user relationship
    const documents = await prisma.vehicleDocument.findMany({
      where: {
        renewalStatus: 'ACTIVE',
      },
      include: {
        vehicle: {
          include: {
            user: {
              include: {
                notificationPreference: true,
              },
            },
          },
        },
        documentType: true,
      },
    });

    scannedCount = documents.length;

    for (const doc of documents) {
      const user = doc.vehicle.user;
      const vehicle = doc.vehicle;
      const pref = user.notificationPreference || {
        emailEnabled: true,
        inAppEnabled: true,
        smsEnabled: false,
        whatsappEnabled: false,
        reminderDays: '15,7,3,1,0',
      };

      const daysRemaining = calculateDaysRemaining(doc.expiryDate, baseDate);
      const configuredDays = pref.reminderDays.split(',').map((s) => parseInt(s.trim(), 10));

      // Trigger condition:
      // A) Matches exact configured milestone (e.g. 15, 7, 3, 1, 0)
      // B) Or document is overdue (daysRemaining < 0)
      const isMilestone = configuredDays.includes(daysRemaining);
      const isOverdue = daysRemaining < 0;

      if (!isMilestone && !isOverdue) {
        continue;
      }

      const docName = doc.customTypeName || doc.documentType?.name || 'Vehicle Document';
      const targetExpiry = new Date(doc.expiryDate);

      // Handle IN_APP Notification
      if (pref.inAppEnabled) {
        const inAppKey = {
          documentId_channel_daysRemaining_targetExpiry: {
            documentId: doc.id,
            channel: 'IN_APP',
            daysRemaining,
            targetExpiry,
          },
        };

        const existingInAppLog = await prisma.notificationDeliveryLog.findUnique({
          where: inAppKey,
        });

        if (!existingInAppLog) {
          const title = daysRemaining < 0 
            ? `⚠️ OVERDUE: ${docName} expired`
            : daysRemaining === 0 
              ? `🚨 ${docName} expires TODAY` 
              : `🔔 ${docName} expires in ${daysRemaining} days`;

          const message = `Document ${docName} for vehicle ${vehicle.registrationNumber} (${vehicle.brand} ${vehicle.model}) expires on ${new Date(doc.expiryDate).toLocaleDateString('en-GB')}.`;

          await prisma.$transaction([
            prisma.notification.create({
              data: {
                userId: user.id,
                documentId: doc.id,
                title,
                message,
                daysRemaining,
                channel: 'IN_APP',
                isRead: false,
              },
            }),
            prisma.notificationDeliveryLog.create({
              data: {
                userId: user.id,
                documentId: doc.id,
                channel: 'IN_APP',
                daysRemaining,
                targetExpiry,
                recipient: user.email,
                status: 'SENT',
              },
            }),
          ]);

          remindersSent++;
          executionLogs.push(`In-App reminder created for ${user.email} (Doc: ${docName}, Days: ${daysRemaining})`);
        }
      }

      // Handle EMAIL Notification
      if (pref.emailEnabled && user.email) {
        const emailKey = {
          documentId_channel_daysRemaining_targetExpiry: {
            documentId: doc.id,
            channel: 'EMAIL',
            daysRemaining,
            targetExpiry,
          },
        };

        const existingEmailLog = await prisma.notificationDeliveryLog.findUnique({
          where: emailKey,
        });

        if (!existingEmailLog) {
          try {
            const emailContent = buildReminderEmailContent({
              ownerName: user.fullName || vehicle.ownerName,
              vehicleNumber: vehicle.registrationNumber,
              vehicleType: vehicle.vehicleType,
              documentType: docName,
              expiryDate: doc.expiryDate,
              daysRemaining,
            });

            await sendEmail({
              to: user.email,
              subject: emailContent.subject,
              text: emailContent.text,
              html: emailContent.html,
            });

            await prisma.notificationDeliveryLog.create({
              data: {
                userId: user.id,
                documentId: doc.id,
                channel: 'EMAIL',
                daysRemaining,
                targetExpiry,
                recipient: user.email,
                status: 'SENT',
              },
            });

            remindersSent++;
            executionLogs.push(`Email sent to ${user.email} for ${vehicle.registrationNumber} (${daysRemaining}d)`);
          } catch (err) {
            failuresCount++;
            console.error(`Failed to send email to ${user.email}:`, err.message);

            await prisma.notificationDeliveryLog.create({
              data: {
                userId: user.id,
                documentId: doc.id,
                channel: 'EMAIL',
                daysRemaining,
                targetExpiry,
                recipient: user.email,
                status: 'FAILED',
                errorMessage: err.message,
                retryCount: 1,
              },
            });
          }
        }
      }

      // Handle SMS Simulation / Delivery
      if (pref.smsEnabled && user.phoneNumber) {
        const smsKey = {
          documentId_channel_daysRemaining_targetExpiry: {
            documentId: doc.id,
            channel: 'SMS',
            daysRemaining,
            targetExpiry,
          },
        };

        const existingSmsLog = await prisma.notificationDeliveryLog.findUnique({
          where: smsKey,
        });

        if (!existingSmsLog) {
          await prisma.notificationDeliveryLog.create({
            data: {
              userId: user.id,
              documentId: doc.id,
              channel: 'SMS',
              daysRemaining,
              targetExpiry,
              recipient: user.phoneNumber,
              status: 'SENT',
            },
          });
          remindersSent++;
        }
      }

      // Handle WhatsApp Simulation / Delivery
      if (pref.whatsappEnabled && user.phoneNumber) {
        const waKey = {
          documentId_channel_daysRemaining_targetExpiry: {
            documentId: doc.id,
            channel: 'WHATSAPP',
            daysRemaining,
            targetExpiry,
          },
        };

        const existingWaLog = await prisma.notificationDeliveryLog.findUnique({
          where: waKey,
        });

        if (!existingWaLog) {
          await prisma.notificationDeliveryLog.create({
            data: {
              userId: user.id,
              documentId: doc.id,
              channel: 'WHATSAPP',
              daysRemaining,
              targetExpiry,
              recipient: user.phoneNumber,
              status: 'SENT',
            },
          });
          remindersSent++;
        }
      }
    }

    const durationMs = Date.now() - startTime;
    await prisma.scheduledJobRun.update({
      where: { id: jobRun.id },
      data: {
        status: 'SUCCESS',
        scannedCount,
        remindersSent,
        failuresCount,
        durationMs,
        details: JSON.stringify(executionLogs.slice(0, 50)),
      },
    });

    console.log(`✅ [VehicleGuard Scheduler] Completed in ${durationMs}ms. Scanned: ${scannedCount}, Reminders: ${remindersSent}, Failures: ${failuresCount}`);

    return {
      success: true,
      jobRunId: jobRun.id,
      scannedCount,
      remindersSent,
      failuresCount,
      durationMs,
    };
  } catch (error) {
    console.error('❌ Scheduler error:', error);
    await prisma.scheduledJobRun.update({
      where: { id: jobRun.id },
      data: {
        status: 'FAILED',
        details: error.stack || error.message,
        durationMs: Date.now() - startTime,
      },
    });

    return {
      success: false,
      error: error.message,
    };
  }
}
