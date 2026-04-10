import { endOfMonth, parseISO, startOfMonth } from 'date-fns'
import { useEffect, useMemo, useState } from 'react'
import { MonthCalendar } from '../components/MonthCalendar'
import type { DateKey, Entry } from '../db/indexedDb'
import {
  deleteEntry,
  getEntry,
  listEntriesInRange,
  upsertEntry,
} from '../db/indexedDb'
import { dateKeyToday, formatDateZh, formatWeekdayZh, toDateKey } from '../utils/date'

export function History() {
  const todayKey = useMemo(() => dateKeyToday(), [])
  const [selected, setSelected] = useState<DateKey>(todayKey)
  const [monthDate, setMonthDate] = useState<Date>(() => startOfMonth(parseISO(todayKey)))
  const [monthEntries, setMonthEntries] = useState<Entry[]>([])
  const [entry, setEntry] = useState<Entry | undefined>()
  const [weightStr, setWeightStr] = useState('')
  const [note, setNote] = useState('')
  const [exerciseDone, setExerciseDone] = useState(false)
  const [exerciseNote, setExerciseNote] = useState('')
  const [saving, setSaving] = useState<'idle' | 'saving' | 'saved'>('idle')

  async function loadMonthEntries(targetMonth: Date) {
    const start = startOfMonth(targetMonth)
    const end = endOfMonth(targetMonth)
    const entries = await listEntriesInRange(toDateKey(start), toDateKey(end))
    setMonthEntries(entries)
  }

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const e = await getEntry(selected)
      if (cancelled) return
      setEntry(e)
      setWeightStr(e && e.weightKg != null ? String(e.weightKg) : '')
      setNote(e?.note ?? '')
      setExerciseDone(e?.exerciseDone ?? false)
      setExerciseNote(e?.exerciseNote ?? '')
    })()
    return () => {
      cancelled = true
    }
  }, [selected])

  useEffect(() => {
    loadMonthEntries(monthDate)
  }, [monthDate])

  async function onSave() {
    const raw = weightStr.trim()
    const weightKg = raw === '' ? null : Number(raw)
    if (
      raw !== '' &&
      (!Number.isFinite(weightKg) || (weightKg !== null && weightKg <= 0))
    ) {
      alert('請輸入正確體重數字（例如 65 或 65.4）')
      return
    }
    if (weightKg !== null && (weightKg < 20 || weightKg > 300)) {
      alert('體重看起來不太合理（建議範圍 20–300 kg）')
      return
    }
    setSaving('saving')
    const next = await upsertEntry(selected, { weightKg, note, exerciseDone, exerciseNote })
    setEntry(next)
    setSaving('saved')
    setTimeout(() => setSaving('idle'), 800)
    await loadMonthEntries(monthDate)
  }

  async function onDelete() {
    if (!confirm('確定要刪除此日期的紀錄嗎？')) return
    await deleteEntry(selected)
    setEntry(undefined)
    setWeightStr('')
    setNote('')
    setExerciseDone(false)
    setExerciseNote('')
    await loadMonthEntries(monthDate)
  }

  const title = `${formatDateZh(selected)}（${formatWeekdayZh(selected)}）`

  return (
    <div className="stack">
      <section className="card enter-1">
        <div className="rowBetween">
          <div>
            <div className="kicker">體重紀錄</div>
            <div className="title">{title}</div>
          </div>
          <div className="row">
            <button className="btn" onClick={onSave}>
              {saving === 'saving' ? '儲存中…' : saving === 'saved' ? '已儲存' : '儲存'}
            </button>
            <button className="btn btnDanger" onClick={onDelete} disabled={!entry}>
              刪除
            </button>
          </div>
        </div>
        <div className="muted" style={{ marginTop: 8 }}>
          點月曆日期後可編輯當日體重、飲食與運動紀錄。
        </div>
      </section>

      <section className="card enter-2">
        <MonthCalendar
          selectedDateKey={selected}
          monthDate={monthDate}
          monthEntries={monthEntries}
          onSelectDate={setSelected}
          onChangeMonth={setMonthDate}
          onGoToday={() => {
            const now = parseISO(dateKeyToday())
            setMonthDate(startOfMonth(now))
            setSelected(dateKeyToday())
          }}
        />
      </section>

      <section className="card enter-3">
        <div className="grid2">
          <div>
            <div className="kicker">體重</div>
            <div className="row">
              <input
                inputMode="decimal"
                className="input"
                placeholder="例如 65.4"
                value={weightStr}
                onChange={(e) => setWeightStr(e.target.value)}
              />
              <div className="unit">kg</div>
            </div>
          </div>
          <div>
            <div className="kicker">飲食紀錄</div>
            <textarea
              className="textarea"
              placeholder="今天吃了什麼？（可留空）"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={5}
            />
          </div>
        </div>
        <div style={{ marginTop: 12 }}>
          <div className="kicker">運動</div>
          <label className="checkRow">
            <input
              type="checkbox"
              checked={exerciseDone}
              onChange={(e) => setExerciseDone(e.target.checked)}
            />
            今天有運動
          </label>
          <textarea
            className="textarea"
            placeholder="運動筆記（例如：快走 30 分鐘）"
            value={exerciseNote}
            onChange={(e) => setExerciseNote(e.target.value)}
            rows={3}
          />
        </div>
        {!entry ? (
          <p className="muted" style={{ marginTop: 12 }}>
            這天目前沒有紀錄；填寫後按「儲存」即可建立。
          </p>
        ) : null}
      </section>
    </div>
  )
}

