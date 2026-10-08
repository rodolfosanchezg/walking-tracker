import type { Walk } from '../../types'

function validDate(value: string): boolean {
  if (!value) return true
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(0)
  date.setFullYear(year, month - 1, day)
  date.setHours(0, 0, 0, 0)
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
}

export function validDateRange(from: string, to: string): boolean {
  return validDate(from) && validDate(to) && (!from || !to || from <= to)
}

/** Día de calendario local, coherente con la fecha mostrada; no interpreta ISO como UTC. */
export function historyDate(timestamp: number | null): string | null {
  if (timestamp === null || !Number.isFinite(timestamp)) return null
  const date = new Date(timestamp)
  if (Number.isNaN(date.getTime())) return null
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function filterHistory(walks: readonly Walk[], name: string, from: string, to: string): Walk[] {
  if (!validDateRange(from, to)) return []
  const query = name.trim().toLocaleLowerCase()
  const timestamp = (walk: Walk) => historyDate(walk.startedAt) === null ? -Infinity : walk.startedAt!
  return walks.filter(walk => {
    const date = historyDate(walk.startedAt)
    return walk.name.toLocaleLowerCase().includes(query) &&
      ((!from && !to) || (date !== null && (!from || date >= from) && (!to || date <= to)))
  }).sort((a, b) => {
    const first = timestamp(a), second = timestamp(b)
    if (first !== second) return first > second ? -1 : 1
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0
  })
}
