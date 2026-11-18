import test from 'node:test';
import assert from 'node:assert/strict';
import { DateTime } from 'luxon';
import { calculateDaysRemaining, getDocumentStatusMeta, SRI_LANKA_TZ } from '../src/utils/dateUtils.js';

test('Sri Lanka Timezone & Calendar Date Expiry Calculations', async (t) => {
  const baseDate = DateTime.fromISO('2026-06-01T10:00:00', { zone: SRI_LANKA_TZ });

  await t.test('calculates exactly 15 days before expiry', () => {
    const targetDate = DateTime.fromISO('2026-06-16T00:00:00', { zone: SRI_LANKA_TZ }).toJSDate();
    const days = calculateDaysRemaining(targetDate, baseDate);
    assert.equal(days, 15);
    const meta = getDocumentStatusMeta(days);
    assert.equal(meta.status, 'EXPIRING');
    assert.equal(meta.color, '#F59E0B');
  });

  await t.test('calculates milestones at 7, 3, 1 days', () => {
    const d7 = DateTime.fromISO('2026-06-08T00:00:00', { zone: SRI_LANKA_TZ }).toJSDate();
    const d3 = DateTime.fromISO('2026-06-04T00:00:00', { zone: SRI_LANKA_TZ }).toJSDate();
    const d1 = DateTime.fromISO('2026-06-02T00:00:00', { zone: SRI_LANKA_TZ }).toJSDate();

    assert.equal(calculateDaysRemaining(d7, baseDate), 7);
    assert.equal(calculateDaysRemaining(d3, baseDate), 3);
    assert.equal(calculateDaysRemaining(d1, baseDate), 1);
  });

  await t.test('identifies document expiring today (0 days)', () => {
    const todayTarget = DateTime.fromISO('2026-06-01T23:59:59', { zone: SRI_LANKA_TZ }).toJSDate();
    const days = calculateDaysRemaining(todayTarget, baseDate);
    assert.equal(days, 0);
    const meta = getDocumentStatusMeta(days);
    assert.equal(meta.status, 'EXPIRING');
    assert.equal(meta.label, 'Expires Today');
  });

  await t.test('identifies expired / overdue document with negative days', () => {
    const pastTarget = DateTime.fromISO('2026-05-25T00:00:00', { zone: SRI_LANKA_TZ }).toJSDate();
    const days = calculateDaysRemaining(pastTarget, baseDate);
    assert.equal(days, -7);
    const meta = getDocumentStatusMeta(days);
    assert.equal(meta.status, 'EXPIRED');
    assert.equal(meta.color, '#EF4444');
    assert.match(meta.label, /Expired \(7 days ago\)/);
  });

  await t.test('identifies valid document (>15 days)', () => {
    const validTarget = DateTime.fromISO('2026-08-01T00:00:00', { zone: SRI_LANKA_TZ }).toJSDate();
    const days = calculateDaysRemaining(validTarget, baseDate);
    assert.ok(days > 15);
    const meta = getDocumentStatusMeta(days);
    assert.equal(meta.status, 'VALID');
    assert.equal(meta.color, '#10B981');
  });
});
