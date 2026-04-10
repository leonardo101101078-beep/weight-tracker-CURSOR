import { useMemo, useState } from 'react'
import type { DateKey } from '../db/indexedDb'
import { listEntriesInRange } from '../db/indexedDb'
import { downloadEntriesXlsx } from '../features/export/exportXlsx'
import { dateKeyAddDays, dateKeyToday } from '../utils/date'

function toDateKeyFromInput(v: string): DateKey {
  return v as DateKey
}

export function Export() {
  const today = useMemo(() => dateKeyToday(), [])
  const [start, setStart] = useState<DateKey>(() => dateKeyAddDays(today, -6))
  const [end, setEnd] = useState<DateKey>(today)
  const [busy, setBusy] = useState(false)

  async function onDownload() {
    if (start > end) {
      alert('起始日期不能晚於結束日期')
      return
    }
    setBusy(true)
    try {
      const entries = await listEntriesInRange(start, end)
      await downloadEntriesXlsx(start, end, entries)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="stack">
      <section className="card enter-1">
        <div className="kicker">導出記錄</div>
        <div className="title">下載 Excel（.xlsx）</div>
        <p className="muted" style={{ marginTop: 6 }}>
          資料只存在本機（IndexedDB）；清除瀏覽資料或系統回收可能導致遺失，建議定期匯出備份。
        </p>

        <div className="grid2" style={{ marginTop: 14 }}>
          <div>
            <div className="kicker">起始日期</div>
            <input
              className="input"
              type="date"
              value={start}
              onChange={(e) => setStart(toDateKeyFromInput(e.target.value))}
            />
          </div>
          <div>
            <div className="kicker">結束日期</div>
            <input
              className="input"
              type="date"
              value={end}
              onChange={(e) => setEnd(toDateKeyFromInput(e.target.value))}
            />
          </div>
        </div>

        <div className="row" style={{ marginTop: 14, justifyContent: 'flex-end' }}>
          <button className="btn" onClick={onDownload} disabled={busy}>
            {busy ? '產生中…' : '下載 Excel'}
          </button>
        </div>
      </section>
    </div>
  )
}

