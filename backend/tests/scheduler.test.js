import test from 'node:test';
import assert from 'node:assert/strict';
import prisma from '../src/prisma.js';
import { runReminderJob } from '../src/services/reminderScheduler.js';

test('Reminder Scheduler Engine & Duplicate Prevention', async (t) => {
  await t.test('executes scheduler run and prevents duplicate deliveries', async () => {
    // Run 1: Should scan documents and send reminders
    const result1 = await runReminderJob();
    assert.equal(result1.success, true);
    assert.ok(result1.scannedCount >= 0);

    const initialRemindersSent = result1.remindersSent;

    // Run 2 immediately after: Must NOT send duplicate reminders for the exact same event
    const result2 = await runReminderJob();
    assert.equal(result2.success, true);
    assert.equal(result2.remindersSent, 0, 'Duplicate notification prevention must prevent re-sending identical reminders on same day');
  });

  await t.test('verifies scheduled_job_runs table records metrics', async () => {
    const latestJob = await prisma.scheduledJobRun.findFirst({
      orderBy: { executionDate: 'desc' },
    });

    assert.ok(latestJob);
    assert.equal(latestJob.status, 'SUCCESS');
    assert.equal(latestJob.jobName, 'DOCUMENT_EXPIRY_REMINDER');
  });
});
