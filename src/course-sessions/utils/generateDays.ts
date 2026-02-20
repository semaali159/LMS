export const weekDaysMap = {
  SUN: 0,
  MON: 1,
  TUE: 2,
  WED: 3,
  THU: 4,
  FRI: 5,
  SAT: 6,
};

export function getFirstDateOnOrAfter(start: Date, weekDay: string): string {
//   const start = new Date(startDateIso + 'T00:00:00Z');
  const dayIndex = weekDaysMap[weekDay as keyof typeof weekDaysMap];
  const diff = (dayIndex - start.getUTCDay() + 7) % 7;
  const result = new Date(start);
  result.setUTCDate(start.getUTCDate() + diff);
  return result.toISOString().slice(0, 10);
}

export function addWeeks(dateIso: string, weeks: number): string {
  const d = new Date(dateIso + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + weeks * 7);
  return d.toISOString().slice(0, 10);
}
