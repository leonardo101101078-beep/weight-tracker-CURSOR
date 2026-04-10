import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from 'date-fns'
import { zhTW } from 'date-fns/locale'
import type { DateKey, Entry } from '../db/indexedDb'
import { toDateKey } from '../utils/date'

type Props = {
  selectedDateKey: DateKey
  monthDate: Date
  monthEntries: Entry[]
  onSelectDate: (dateKey: DateKey) => void
  onChangeMonth: (date: Date) => void
  onGoToday: () => void
}

function markerKinds(entry?: Entry): string[] {
  if (!entry) return []
  const kinds: string[] = []
  if (entry.weightKg != null) kinds.push('weight')
  if (entry.exerciseDone) kinds.push('exercise')
  if (entry.note.trim() || entry.exerciseNote.trim()) kinds.push('note')
  return kinds
}

export function MonthCalendar({
  selectedDateKey,
  monthDate,
  monthEntries,
  onSelectDate,
  onChangeMonth,
  onGoToday,
}: Props) {
  const monthStart = startOfMonth(monthDate)
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 })
  const gridEnd = endOfWeek(endOfMonth(monthDate), { weekStartsOn: 0 })
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd })
  const entryMap = new Map(monthEntries.map((e) => [e.dateKey, e]))

  return (
    <div className="calendar">
      <div className="calendarHeader">
        <div className="title">{format(monthDate, 'yyyy 年 MM 月', { locale: zhTW })}</div>
        <div className="row">
          <button className="btn" onClick={() => onChangeMonth(addMonths(monthDate, -1))}>
            上一月
          </button>
          <button className="btn" onClick={onGoToday}>
            今天
          </button>
          <button className="btn" onClick={() => onChangeMonth(addMonths(monthDate, 1))}>
            下一月
          </button>
        </div>
      </div>
      <div className="calendarWeekdays">
        {['日', '一', '二', '三', '四', '五', '六'].map((w) => (
          <div key={w} className="calendarWeekday">
            {w}
          </div>
        ))}
      </div>
      <div className="calendarGrid" key={format(monthDate, 'yyyy-MM')}>
        {days.map((day) => {
          const dateKey = toDateKey(day)
          const inMonth = isSameMonth(day, monthDate)
          const isSelected = dateKey === selectedDateKey
          const kinds = markerKinds(entryMap.get(dateKey))
          return (
            <button
              type="button"
              key={dateKey}
              className={`dayCell ${inMonth ? '' : 'dayCellMuted'} ${isSelected ? 'dayCellSelected' : ''}`}
              onClick={() => onSelectDate(dateKey)}
              aria-label={format(day, 'yyyy-MM-dd')}
            >
              <span>{format(day, 'd')}</span>
              <span className="dayDots">
                {kinds.includes('weight') ? <i className="dot dotWeight" /> : null}
                {kinds.includes('exercise') ? <i className="dot dotExercise" /> : null}
                {kinds.includes('note') ? <i className="dot dotNote" /> : null}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

