export function generateWeekDays(startDate: Date) {
  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    days.push(d);
  }
  return days;
}

export function formatDate(date: Date) {
  return date.toISOString().split('T')[0];
}

