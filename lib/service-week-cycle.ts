export type ServiceWeekCycle = 'a' | 'b' | null

// Sunday, August 30, 2026 begins an A week. Weeks run Sunday through Saturday.
const A_WEEK_ANCHOR_UTC = Date.UTC(2026, 7, 30)
const DAYS_PER_WEEK = 7
const MILLISECONDS_PER_DAY = 86_400_000

function localDateAsUtc(date: Date) {
  return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
}

export function serviceWeekForDate(date: Date): Exclude<ServiceWeekCycle, null> {
  const sunday = new Date(date.getFullYear(), date.getMonth(), date.getDate() - date.getDay())
  const weeksFromAnchor = Math.floor(
    (localDateAsUtc(sunday) - A_WEEK_ANCHOR_UTC) / (DAYS_PER_WEEK * MILLISECONDS_PER_DAY),
  )
  return ((weeksFromAnchor % 2) + 2) % 2 === 0 ? 'a' : 'b'
}

export function daysUntilService(date: Date, dayOfWeek: number, weekCycle: ServiceWeekCycle) {
  for (let offset = 0; offset < 14; offset += 1) {
    const candidate = new Date(date.getFullYear(), date.getMonth(), date.getDate() + offset)
    if (candidate.getDay() !== dayOfWeek) continue
    if (!weekCycle || serviceWeekForDate(candidate) === weekCycle) return offset
  }
  return null
}

export function serviceWeekLabel(weekCycle: ServiceWeekCycle) {
  if (weekCycle === 'a') return 'A Week'
  if (weekCycle === 'b') return 'B Week'
  return 'Every Week'
}
