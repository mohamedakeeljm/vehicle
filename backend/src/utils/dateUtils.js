import { DateTime } from 'luxon';

export const SRI_LANKA_TZ = 'Asia/Colombo';

/**
 * Get current DateTime in Sri Lanka Standard Time (Asia/Colombo)
 * @returns {DateTime}
 */
export function getSriLankaNow() {
  return DateTime.now().setZone(SRI_LANKA_TZ);
}

/**
 * Calculates calendar day difference between target date and current Sri Lanka date.
 * Positive number = days until expiry.
 * Zero = expires today.
 * Negative number = already expired.
 *
 * @param {Date|string} dateInput - The target expiry date
 * @param {DateTime} [baseDate] - Optional base date for deterministic testing
 * @returns {number} Days remaining (rounded calendar days)
 */
export function calculateDaysRemaining(dateInput, baseDate = null) {
  if (!dateInput) return 0;
  const current = baseDate ? baseDate.setZone(SRI_LANKA_TZ).startOf('day') : getSriLankaNow().startOf('day');
  
  const target = (dateInput instanceof Date 
    ? DateTime.fromJSDate(dateInput) 
    : DateTime.fromISO(new Date(dateInput).toISOString())
  ).setZone(SRI_LANKA_TZ).startOf('day');

  const diff = target.diff(current, 'days').days;
  return Math.round(diff);
}

/**
 * Determine document status label & theme color based on days remaining:
 * - VALID (Green): > 15 days
 * - EXPIRING (Yellow/Amber): 0 to 15 days
 * - EXPIRED (Red): < 0 days
 *
 * @param {number} daysRemaining 
 * @returns {{status: 'VALID' | 'EXPIRING' | 'EXPIRED', color: string, badgeClass: string, label: string}}
 */
export function getDocumentStatusMeta(daysRemaining) {
  if (daysRemaining < 0) {
    return {
      status: 'EXPIRED',
      color: '#EF4444',
      badgeClass: 'bg-red-100 text-red-800 border-red-200',
      label: `Expired (${Math.abs(daysRemaining)} days ago)`,
    };
  }
  if (daysRemaining <= 15) {
    return {
      status: 'EXPIRING',
      color: '#F59E0B',
      badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
      label: daysRemaining === 0 ? 'Expires Today' : `Expires in ${daysRemaining} day${daysRemaining > 1 ? 's' : ''}`,
    };
  }
  return {
    status: 'VALID',
    color: '#10B981',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    label: `Valid (${daysRemaining} days left)`,
  };
}

/**
 * Format date for Sri Lankan vehicle documents display (e.g. "15 Jun 2026")
 */
export function formatSriLankaDate(dateInput) {
  if (!dateInput) return 'N/A';
  const dt = dateInput instanceof Date ? DateTime.fromJSDate(dateInput) : DateTime.fromISO(new Date(dateInput).toISOString());
  return dt.setZone(SRI_LANKA_TZ).toFormat('dd LLL yyyy');
}
