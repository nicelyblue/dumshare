const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;

function ordinalSuffix(day: number): string {
  const mod100 = day % 100;
  if (mod100 >= 11 && mod100 <= 13) {
    return 'th';
  }

  const mod10 = day % 10;
  if (mod10 === 1) {
    return 'st';
  }
  if (mod10 === 2) {
    return 'nd';
  }
  if (mod10 === 3) {
    return 'rd';
  }
  return 'th';
}

function toTwelveHour(hour24: number): { hour: number; period: 'am' | 'pm' } {
  if (hour24 === 0) {
    return { hour: 12, period: 'am' };
  }
  if (hour24 < 12) {
    return { hour: hour24, period: 'am' };
  }
  if (hour24 === 12) {
    return { hour: 12, period: 'pm' };
  }
  return { hour: hour24 - 12, period: 'pm' };
}

export function formatDateTimeLabel(input: string | Date): string {
  const date = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(date.getTime())) {
    return String(input);
  }

  const month = MONTH_NAMES[date.getMonth()] ?? 'Jan';
  const day = date.getDate();
  const suffix = ordinalSuffix(day);
  const year = date.getFullYear();
  const { hour, period } = toTwelveHour(date.getHours());
  const minute = String(date.getMinutes()).padStart(2, '0');
  return `${month} ${day}${suffix} ${year} ${hour}:${minute}${period}`;
}
