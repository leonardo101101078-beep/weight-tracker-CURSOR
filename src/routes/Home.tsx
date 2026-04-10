import { useEffect, useMemo, useState } from 'react'
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { DateKey, Entry } from '../db/indexedDb'
import { getEntriesByDateKeys, getEntry, upsertEntry } from '../db/indexedDb'
import {
  dateKeyToday,
  dateKeyYesterday,
  formatDateZh,
  formatWeekdayZh,
  lastNDaysKeys,
} from '../utils/date'

type ChartRow = { dateKey: DateKey; label: string; weightKg: number | null }

function formatWeight(v: number | null | undefined): string {
  if (v === null || v === undefined || Number.isNaN(v)) return '—'
  return `${v.toFixed(1)} kg`
}

export function Home() {
  const todayKey = useMemo(() => dateKeyToday(), [])
  const yesterdayKey = useMemo(() => dateKeyYesterday(), [])
  const [todayWeightStr, setTodayWeightStr] = useState('')
  const [todayNote, setTodayNote] = useState('')
  const [todayExerciseDone, setTodayExerciseDone] = useState(false)
  const [todayExerciseNote, setTodayExerciseNote] = useState('')
  const [yesterday, setYesterday] = useState<Entry | undefined>()
  const [chartRows, setChartRows] = useState<ChartRow[]>([])
  const [saving, setSaving] = useState<'idle' | 'saving' | 'saved'>('idle')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const [t, y] = await Promise.all([getEntry(todayKey), getEntry(yesterdayKey)])
      if (cancelled) return
      setYesterday(y)
      setTodayWeightStr(t && t.weightKg != null ? String(t.weightKg) : '')
      setTodayNote(t?.note ?? '')
      setTodayExerciseDone(t?.exerciseDone ?? false)
      setTodayExerciseNote(t?.exerciseNote ?? '')

      const keys = lastNDaysKeys(7)
      const rows = await getEntriesByDateKeys(keys)
      if (cancelled) return
      const map = new Map(rows.map((r) => [r.dateKey, r]))
      setChartRows(
        keys.map((k) => ({
          dateKey: k,
          label: k.slice(5).replace('-', '/'),
          weightKg: map.get(k)?.weightKg ?? null,
        })),
      )
    })()
    return () => {
      cancelled = true
    }
  }, [todayKey, yesterdayKey])

  async function onSave() {
    const raw = todayWeightStr.trim()
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
    await upsertEntry(todayKey, {
      weightKg,
      note: todayNote,
      exerciseDone: todayExerciseDone,
      exerciseNote: todayExerciseNote,
    })
    setSaving('saved')
    setTimeout(() => setSaving('idle'), 800)

    const keys = lastNDaysKeys(7)
    const rows = await getEntriesByDateKeys(keys)
    const map = new Map(rows.map((r) => [r.dateKey, r]))
    setChartRows(
      keys.map((k) => ({
        dateKey: k,
        label: k.slice(5).replace('-', '/'),
        weightKg: map.get(k)?.weightKg ?? null,
      })),
    )
  }

  const todayLabel = `${formatDateZh(todayKey)}（${formatWeekdayZh(todayKey)}）`

  return (
    <div className="stack">
      <section className="card enter-1">
        <div className="rowBetween">
          <div>
            <div className="kicker">日期</div>
            <div className="title">{todayLabel}</div>
          </div>
          <button className="btn" onClick={onSave}>
            {saving === 'saving' ? '儲存中…' : saving === 'saved' ? '已儲存' : '儲存'}
          </button>
        </div>
      </section>

      <section className="card enter-2">
        <div className="grid2">
          <div>
            <div className="kicker">今日體重</div>
            <div className="row">
              <input
                inputMode="decimal"
                className="input"
                placeholder="例如 65.4"
                value={todayWeightStr}
                onChange={(e) => setTodayWeightStr(e.target.value)}
              />
              <div className="unit">kg</div>
            </div>
          </div>
          <div>
            <div className="kicker">飲食紀錄</div>
            <textarea
              className="textarea"
              placeholder="今天吃了什麼？（可留空）"
              value={todayNote}
              onChange={(e) => setTodayNote(e.target.value)}
              rows={3}
            />
          </div>
        </div>
        <div style={{ marginTop: 12 }}>
          <div className="kicker">運動</div>
          <label className="checkRow">
            <input
              type="checkbox"
              checked={todayExerciseDone}
              onChange={(e) => setTodayExerciseDone(e.target.checked)}
            />
            今天有運動
          </label>
          <textarea
            className="textarea"
            placeholder="運動筆記（例如：重訓 40 分鐘）"
            value={todayExerciseNote}
            onChange={(e) => setTodayExerciseNote(e.target.value)}
            rows={3}
          />
        </div>
      </section>

      <section className="card enter-3">
        <div className="rowBetween">
          <div>
            <div className="kicker">七日體重</div>
            <div className="muted">近 7 天漲跌（缺資料會斷點）</div>
          </div>
        </div>
        {chartRows.every((r) => r.weightKg == null) ? (
          <p className="muted" style={{ marginTop: 12 }}>
            目前近 7 天還沒有體重紀錄，先在上方輸入今日體重並儲存。
          </p>
        ) : null}
        <div className="chartWrap" style={{ height: 240, marginTop: 12 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartRows} margin={{ left: 6, right: 18, top: 10 }}>
              <XAxis dataKey="label" tickMargin={8} />
              <YAxis
                domain={['auto', 'auto']}
                width={40}
                tickMargin={8}
                tickFormatter={(v) => String(v)}
              />
              <Tooltip
                formatter={(value) =>
                  value == null ? ['—', '體重'] : [`${Number(value).toFixed(1)} kg`, '體重']
                }
                labelFormatter={(label) => `日期 ${label}`}
              />
              <Line
                type="monotone"
                dataKey="weightKg"
                stroke="var(--accent)"
                strokeWidth={3}
                dot={{ r: 3 }}
                connectNulls={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="card enter-4">
        <div className="kicker">體重對比</div>
        <div className="compare">
          <div className="panel">
            <div className="panelTitle">昨日</div>
            <div className="panelValue">{formatWeight(yesterday?.weightKg ?? null)}</div>
            <div className="muted">
              運動：{yesterday?.exerciseDone ? '有' : '無'}
              {yesterday?.exerciseNote?.trim() ? `（${yesterday.exerciseNote}）` : ''}
            </div>
            <div className="panelNote">{yesterday?.note?.trim() ? yesterday.note : '—'}</div>
          </div>
          <div className="panel">
            <div className="panelTitle">今日</div>
            <div className="panelValue">
              {formatWeight(todayWeightStr.trim() === '' ? null : Number(todayWeightStr))}
            </div>
            <div className="muted">
              運動：{todayExerciseDone ? '有' : '無'}
              {todayExerciseNote.trim() ? `（${todayExerciseNote}）` : ''}
            </div>
            <div className="panelNote">{todayNote.trim() ? todayNote : '—'}</div>
          </div>
        </div>
      </section>
    </div>
  )
}

