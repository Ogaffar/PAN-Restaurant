export type HoursEntry = {
  day: string;
  fullDay: string;
  open: string | null;
  close: string | null;
};

export const WEEK_HOURS: HoursEntry[] = [
  { day: 'Mon', fullDay: 'Monday',    open: '11:00 AM', close: '7:00 PM' },
  { day: 'Tue', fullDay: 'Tuesday',   open: '11:00 AM', close: '7:00 PM' },
  { day: 'Wed', fullDay: 'Wednesday', open: '11:00 AM', close: '7:00 PM' },
  { day: 'Thu', fullDay: 'Thursday',  open: '11:00 AM', close: '7:00 PM' },
  { day: 'Fri', fullDay: 'Friday',    open: '11:00 AM', close: '8:00 PM' },
  { day: 'Sat', fullDay: 'Saturday',  open: '10:00 AM', close: '5:00 PM' },
  { day: 'Sun', fullDay: 'Sunday',    open: null,        close: null },
];

// JS getDay(): 0=Sun…6=Sat → WEEK_HOURS index (Mon=0…Sun=6): (getDay()+6)%7
export function getTodayIndex(): number {
  return (new Date().getDay() + 6) % 7;
}

export function getTodayHours(): string {
  const entry = WEEK_HOURS[getTodayIndex()];
  if (!entry.open || !entry.close) return 'Closed today';
  return `Open today until ${entry.close}`;
}
