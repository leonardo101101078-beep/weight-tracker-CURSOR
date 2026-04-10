import { openDB, type DBSchema, type IDBPDatabase } from 'idb'

export type DateKey = `${number}-${number}-${number}` // YYYY-MM-DD

export type Entry = {
  dateKey: DateKey
  weightKg: number | null
  note: string
  exerciseDone: boolean
  exerciseNote: string
  createdAt: number
  updatedAt: number
}

export type EntryInput = {
  weightKg: number | null
  note: string
  exerciseDone: boolean
  exerciseNote: string
}

interface WeightTrackerDB extends DBSchema {
  entries: {
    key: DateKey
    value: Entry
  }
}

let dbPromise: Promise<IDBPDatabase<WeightTrackerDB>> | null = null

function getDb() {
  if (!dbPromise) {
    dbPromise = openDB<WeightTrackerDB>('weight-tracker-pwa', 2, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('entries')) {
          db.createObjectStore('entries', { keyPath: 'dateKey' })
        }
      },
    })
  }
  return dbPromise
}

function normalizeEntry(entry: Entry): Entry {
  return {
    ...entry,
    exerciseDone: entry.exerciseDone ?? false,
    exerciseNote: entry.exerciseNote ?? '',
  }
}

export async function getEntry(dateKey: DateKey): Promise<Entry | undefined> {
  const db = await getDb()
  const entry = await db.get('entries', dateKey)
  return entry ? normalizeEntry(entry) : undefined
}

export async function getEntriesByDateKeys(dateKeys: DateKey[]): Promise<Entry[]> {
  if (dateKeys.length === 0) return []
  const db = await getDb()
  return Promise.all(dateKeys.map((k) => db.get('entries', k))).then((rows) =>
    (rows.filter(Boolean) as Entry[]).map(normalizeEntry),
  )
}

export async function upsertEntry(dateKey: DateKey, input: EntryInput): Promise<Entry> {
  const db = await getDb()
  const existing = await db.get('entries', dateKey)
  const now = Date.now()
  const next: Entry = existing
    ? normalizeEntry({ ...existing, ...input, updatedAt: now })
    : normalizeEntry({ dateKey, ...input, createdAt: now, updatedAt: now })

  await db.put('entries', next)
  return next
}

export async function deleteEntry(dateKey: DateKey): Promise<void> {
  const db = await getDb()
  await db.delete('entries', dateKey)
}

export async function listEntriesInRange(start: DateKey, end: DateKey): Promise<Entry[]> {
  const db = await getDb()
  const range = IDBKeyRange.bound(start, end)
  const all = await db.getAll('entries', range)
  return all
    .map(normalizeEntry)
    .sort((a, b) => (a.dateKey < b.dateKey ? -1 : a.dateKey > b.dateKey ? 1 : 0))
}

