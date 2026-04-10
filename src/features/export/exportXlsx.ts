import ExcelJS from 'exceljs'
import { saveAs } from 'file-saver'
import type { DateKey, Entry } from '../../db/indexedDb'
import { formatWeekdayZh } from '../../utils/date'

function fileNameForRange(start: DateKey, end: DateKey) {
  const s = start.replaceAll('-', '')
  const e = end.replaceAll('-', '')
  return `weight-tracker_${s}-${e}.xlsx`
}

export async function downloadEntriesXlsx(
  start: DateKey,
  end: DateKey,
  entries: Entry[],
) {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'weight-tracker-pwa'
  wb.created = new Date()

  const ws = wb.addWorksheet('Records')
  ws.columns = [
    { header: 'Date', key: 'date', width: 14 },
    { header: 'Weekday', key: 'weekday', width: 12 },
    { header: 'WeightKg', key: 'weightKg', width: 10 },
    { header: 'Note', key: 'note', width: 40 },
    { header: 'ExerciseDone', key: 'exerciseDone', width: 14 },
    { header: 'ExerciseNote', key: 'exerciseNote', width: 36 },
  ]

  for (const e of entries) {
    ws.addRow({
      date: e.dateKey,
      weekday: formatWeekdayZh(e.dateKey),
      weightKg: e.weightKg ?? '',
      note: e.note ?? '',
      exerciseDone: e.exerciseDone ? 'TRUE' : 'FALSE',
      exerciseNote: e.exerciseNote ?? '',
    })
  }

  ws.getRow(1).font = { bold: true }
  ws.views = [{ state: 'frozen', ySplit: 1 }]
  ws.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: 6 },
  }

  const buf = await wb.xlsx.writeBuffer()
  const blob = new Blob([buf], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  saveAs(blob, fileNameForRange(start, end))
}

