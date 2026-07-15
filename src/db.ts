import Dexie, { type Table } from 'dexie'
import { sha256 } from 'js-sha256'

export type Role = 'admin' | 'fto' | 'trainee'

export interface User {
  id?: number
  name: string
  badgeNo: string
  role: Role
  pinHash: string
  /**
   * Plaintext copy of the PIN so admins can view login details.
   * DELIBERATE, ACCEPTED weakness for the local-only baseline (user decision
   * 2026-07-14); must be removed when real auth ships (roadmap Phase D).
   * Accounts created before this field existed have no value until PIN reset.
   */
  pin?: string
  active: boolean
  createdAt: string
  /** For trainees: the FTO they are assigned to. Unassigned trainees are only visible to admins. */
  assignedFtoId?: number
}

export type TaskStatus = 'in_progress' | 'signed_off'

export interface TaskCompletion {
  id?: number
  traineeId: number
  taskId: string
  status: TaskStatus
  /** FTO note on this task (coaching points, context for the sign-off). */
  notes: string
  /** Flagged by an FTO as needing remedial / re-training attention. */
  remedial?: boolean
  signedByFtoId?: number
  signedAt?: string
}

export type DailyResult = 'pass' | 'needs_improvement'

/** Daily Observation Report */
export interface Dor {
  id?: number
  traineeId: number
  ftoId: number
  date: string
  phaseId: string
  ratings: Record<string, number>
  narrative: string
  mostSatisfactory: string
  leastSatisfactory: string
  /** Training hours credited for this day. */
  hoursCredited?: number
  /** Overall result for the day. */
  dailyResult?: DailyResult
  acknowledgedAt?: string
  createdAt: string
}

export type EvalType = 'weekly' | 'end_of_phase'
export type EvalRecommendation = 'progress' | 'remediate'

/** Weekly or end-of-phase evaluation — a step up from the daily DOR. */
export interface Evaluation {
  id?: number
  traineeId: number
  ftoId: number
  evalType: EvalType
  phaseId: string
  date: string
  /** Overall rating on the same 1–5 scale as DOR categories. */
  overallRating: number
  strengths: string
  improvementAreas: string
  narrative: string
  recommendation: EvalRecommendation
  acknowledgedAt?: string
  createdAt: string
}

export interface Setting {
  key: string
  value: string
}

class FtoDb extends Dexie {
  users!: Table<User, number>
  taskCompletions!: Table<TaskCompletion, number>
  dors!: Table<Dor, number>
  evaluations!: Table<Evaluation, number>
  settings!: Table<Setting, string>

  constructor() {
    super('fto-portal')
    this.version(1).stores({
      users: '++id, role, badgeNo',
      taskCompletions: '++id, traineeId, taskId, [traineeId+taskId]',
      dors: '++id, traineeId, ftoId, date'
    })
    // v2: admin role, trainee→FTO assignment, program settings.
    // The earliest FTO account becomes the administrator.
    this.version(2)
      .stores({
        users: '++id, role, badgeNo, assignedFtoId',
        settings: 'key'
      })
      .upgrade(async (tx) => {
        const users = tx.table('users')
        const firstFto = await users.orderBy('id').filter((u) => u.role === 'fto').first()
        if (firstFto) await users.update(firstFto.id, { role: 'admin' })
      })
    // v3: weekly / end-of-phase evaluations.
    this.version(3).stores({
      evaluations: '++id, traineeId, ftoId, date'
    })
  }
}

export const db = new FtoDb()

export const SETTING_REQUIRED_HOURS = 'requiredHours'
export const DEFAULT_REQUIRED_HOURS = 160
/** Agency / facility name shown on printed reports and certificates. */
export const SETTING_AGENCY_NAME = 'agencyName'

export async function getRequiredHours(): Promise<number> {
  const s = await db.settings.get(SETTING_REQUIRED_HOURS)
  const n = Number(s?.value)
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_REQUIRED_HOURS
}

/**
 * Local PIN hashing so raw PINs are never stored. Pure-JS SHA-256 (same output
 * as SubtleCrypto) so it also works in non-secure contexts, e.g. the portable
 * single-file build opened from a USB drive via file://. This is a convenience
 * gate for shared devices, NOT production-grade authentication — see docs/WORKFLOW.md.
 */
export async function hashPin(pin: string): Promise<string> {
  return sha256(`fto-portal:${pin}`)
}
