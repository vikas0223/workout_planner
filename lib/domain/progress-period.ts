/**
 * Centralized Progress Period & Date Boundary Domain Engine
 *
 * Rules:
 * - Pure domain date calculations; zero React or UI dependencies.
 * - Consistent device-local calendar day boundary handling.
 * - Session timestamps are parsed and compared against local date boundaries.
 */

export type ProgressPeriod = '7d' | '30d' | '90d' | 'all' | 'custom';

export interface DateRange {
  startDate: Date | null;
  endDate: Date | null;
  startDateStr?: string; // YYYY-MM-DD
  endDateStr?: string;   // YYYY-MM-DD
}

export interface DayBucket {
  dateStr: string; // YYYY-MM-DD
  dayLabel: string; // Mon, Tue, etc.
  isToday: boolean;
}

export const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;
export type DayOfWeek = typeof DAYS_OF_WEEK[number];

export class ProgressPeriodService {
  /**
   * Returns the local calendar DateRange for a given period.
   * Uses referenceDate (default: new Date()) as the "today" anchor.
   */
  public static getDateRange(
    period: ProgressPeriod,
    customRange?: { startDate?: string | Date; endDate?: string | Date },
    referenceDate: Date = new Date()
  ): DateRange {
    // End of today in local timezone (23:59:59.999)
    const endOfToday = new Date(referenceDate);
    endOfToday.setHours(23, 59, 59, 999);

    if (period === 'all') {
      return {
        startDate: null,
        endDate: endOfToday,
      };
    }

    if (period === 'custom' && customRange) {
      const start = customRange.startDate ? new Date(customRange.startDate) : null;
      if (start) start.setHours(0, 0, 0, 0);

      const end = customRange.endDate ? new Date(customRange.endDate) : endOfToday;
      end.setHours(23, 59, 59, 999);

      return {
        startDate: start,
        endDate: end,
        startDateStr: start ? this.toLocalDateString(start) : undefined,
        endDateStr: this.toLocalDateString(end),
      };
    }

    const startOfPeriod = new Date(referenceDate);
    startOfPeriod.setHours(0, 0, 0, 0);

    let daysToSubtract = 6; // 7 days inclusive (today + 6 days prior)
    if (period === '30d') daysToSubtract = 29;
    if (period === '90d') daysToSubtract = 89;

    startOfPeriod.setDate(startOfPeriod.getDate() - daysToSubtract);

    return {
      startDate: startOfPeriod,
      endDate: endOfToday,
      startDateStr: this.toLocalDateString(startOfPeriod),
      endDateStr: this.toLocalDateString(endOfToday),
    };
  }

  /**
   * Checks if an ISO timestamp string or Date falls within a DateRange.
   */
  public static isDateInRange(dateInput: string | Date | null | undefined, range: DateRange): boolean {
    if (!dateInput) return false;
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return false;

    if (range.startDate && date < range.startDate) {
      return false;
    }
    if (range.endDate && date > range.endDate) {
      return false;
    }
    return true;
  }

  /**
   * Extracts local YYYY-MM-DD date string.
   */
  public static toLocalDateString(dateInput: string | Date): string {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return '';
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Gets start of current local week (Monday 00:00:00).
   */
  public static getStartOfCurrentWeek(referenceDate: Date = new Date()): Date {
    const d = new Date(referenceDate);
    d.setHours(0, 0, 0, 0);
    // Sunday is 0 in JS; convert to Monday=0, Sunday=6
    const day = d.getDay();
    const diff = (day === 0 ? -6 : 1) - day;
    d.setDate(d.getDate() + diff);
    return d;
  }

  /**
   * Gets end of current local week (Sunday 23:59:59.999).
   */
  public static getEndOfCurrentWeek(referenceDate: Date = new Date()): Date {
    const startOfWeek = this.getStartOfCurrentWeek(referenceDate);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    return endOfWeek;
  }

  /**
   * Returns a list of daily buckets for a date range (for chronological charts).
   */
  public static generateDayBuckets(startDate: Date, endDate: Date): DayBucket[] {
    const buckets: DayBucket[] = [];
    const current = new Date(startDate);
    current.setHours(0, 0, 0, 0);

    const todayStr = this.toLocalDateString(new Date());

    while (current <= endDate) {
      const dateStr = this.toLocalDateString(current);
      const dayOfWeekIndex = (current.getDay() + 6) % 7; // Monday = 0
      buckets.push({
        dateStr,
        dayLabel: DAYS_OF_WEEK[dayOfWeekIndex],
        isToday: dateStr === todayStr,
      });
      current.setDate(current.getDate() + 1);
    }

    return buckets;
  }

  /**
   * Generates ISO week identifier: YYYY-Www (e.g. 2026-W35)
   */
  public static getIsoWeekKey(dateInput: string | Date): string {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return 'unknown';

    // Thursday in current week determines year
    const target = new Date(d.valueOf());
    const dayNr = (d.getDay() + 6) % 7;
    target.setDate(target.getDate() - dayNr + 3);
    const firstThursday = target.valueOf();
    target.setMonth(0, 1);
    if (target.getDay() !== 4) {
      target.setMonth(0, 1 + ((4 - target.getDay() + 7) % 7));
    }
    const weekNum = 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
    return `${d.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
  }
}
