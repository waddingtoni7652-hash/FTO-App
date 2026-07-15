/**
 * Field training phases and tasks for county corrections officers.
 *
 * Topic areas are aligned to the TCOLE Basic County Corrections Course (BCCC)
 * and Texas Commission on Jail Standards (TCJS) minimum standards. This is a
 * BASELINE curriculum outline written for development purposes — before
 * operational use, every task and reference must be verified against the
 * agency's current policies and the official TCOLE/TCJS publications.
 * TDCJ (state corrections) standards are planned as a future, separate track.
 */

export interface TrainingTask {
  id: string
  title: string
  description: string
  /** Statute, standard, or curriculum area the task supports */
  reference: string
}

export interface TrainingPhase {
  id: string
  name: string
  summary: string
  tasks: TrainingTask[]
}

export const PHASES: TrainingPhase[] = [
  {
    id: 'phase-1',
    name: 'Phase 1 — Orientation & Facility Familiarization',
    summary:
      'Introduction to the facility, chain of command, and the regulatory framework (TCOLE / TCJS) that governs Texas county jails.',
    tasks: [
      {
        id: 'p1-facility-tour',
        title: 'Complete guided facility tour',
        description:
          'Walk all housing units, booking, medical, kitchen, laundry, recreation, and sally ports. Identify emergency exits and fire equipment locations.',
        reference: 'Agency policy / TCJS Ch. 263 (Life Safety)'
      },
      {
        id: 'p1-chain-of-command',
        title: 'Chain of command & post assignments',
        description: 'Identify supervisors, shift structure, and how post assignments and relief work.',
        reference: 'Agency policy'
      },
      {
        id: 'p1-keys-radio',
        title: 'Key, radio, and tool control',
        description: 'Demonstrate proper key control, radio procedures/codes, and tool & sharps accountability.',
        reference: 'TCJS §351 / Agency policy'
      },
      {
        id: 'p1-tcole-overview',
        title: 'TCOLE licensing & rules overview',
        description:
          'Review county jailer license requirements, continuing education obligations, and conduct rules.',
        reference: 'TCOLE Rules, Occupations Code Ch. 1701'
      },
      {
        id: 'p1-tcjs-overview',
        title: 'TCJS minimum standards overview',
        description: 'Review the Texas Commission on Jail Standards minimum jail standards and inspection process.',
        reference: 'TCJS Minimum Jail Standards (37 TAC Part 9)'
      },
      {
        id: 'p1-prea',
        title: 'PREA awareness',
        description: 'Review Prison Rape Elimination Act requirements, zero-tolerance policy, and reporting paths.',
        reference: 'PREA / Agency policy'
      }
    ]
  },
  {
    id: 'phase-2',
    name: 'Phase 2 — Booking & Intake',
    summary: 'Receiving, screening, and processing inmates into the facility.',
    tasks: [
      {
        id: 'p2-intake-search',
        title: 'Intake search procedures',
        description: 'Perform pat and property searches consistent with policy; document seized property.',
        reference: 'Agency policy / BCCC search procedures'
      },
      {
        id: 'p2-property',
        title: 'Property inventory & storage',
        description: 'Inventory, document, and secure inmate property with proper signatures.',
        reference: 'Agency policy'
      },
      {
        id: 'p2-health-screen',
        title: 'Health & mental health intake screening',
        description:
          'Complete the TCJS Screening Form for Suicide and Medical/Mental/Developmental Impairments and route referrals correctly.',
        reference: 'TCJS §273.5 / Sandra Bland Act'
      },
      {
        id: 'p2-suicide-flags',
        title: 'Suicide risk indicators at intake',
        description: 'Recognize risk indicators and initiate notification/observation procedures.',
        reference: 'TCJS / BCCC suicide detection & prevention'
      },
      {
        id: 'p2-records',
        title: 'Booking records & identification',
        description: 'Complete booking records, fingerprints, photographs, and warrant/hold checks.',
        reference: 'Agency policy / CCP requirements'
      },
      {
        id: 'p2-magistrate',
        title: 'Magistration process',
        description: 'Explain timelines and documentation for presenting arrestees to a magistrate.',
        reference: 'Code of Criminal Procedure Art. 15.17'
      },
      {
        id: 'p2-classification',
        title: 'Objective classification basics',
        description: 'Apply the classification instrument to determine custody level and housing assignment.',
        reference: 'TCJS §271 (Classification)'
      }
    ]
  },
  {
    id: 'phase-3',
    name: 'Phase 3 — Housing & Supervision',
    summary: 'Daily supervision of inmates in housing areas and required observation checks.',
    tasks: [
      {
        id: 'p3-observation',
        title: 'Face-to-face observation checks',
        description:
          'Conduct and document required observation rounds (60-minute general population; 30-minute or closer for at-risk inmates).',
        reference: 'TCJS §275.1 (Supervision)'
      },
      {
        id: 'p3-counts',
        title: 'Formal counts',
        description: 'Conduct and reconcile formal headcounts and emergency counts.',
        reference: 'Agency policy'
      },
      {
        id: 'p3-searches',
        title: 'Cell & area searches / contraband control',
        description: 'Perform systematic cell searches, identify contraband, and document findings.',
        reference: 'Agency policy / BCCC security procedures'
      },
      {
        id: 'p3-meals-med',
        title: 'Meal service & medication pass security',
        description: 'Supervise meal service and support medical staff during medication pass.',
        reference: 'TCJS §273 (Health Services)'
      },
      {
        id: 'p3-rights',
        title: 'Inmate rights & privileges',
        description:
          'Explain inmate rights (visitation, mail, telephone, recreation, religious practice) and privilege rules.',
        reference: 'TCJS §291 / BCCC inmate rights'
      },
      {
        id: 'p3-grievance',
        title: 'Grievance & request procedures',
        description: 'Process inmate requests and grievances within required timelines.',
        reference: 'TCJS §283 (Grievances)'
      },
      {
        id: 'p3-communication',
        title: 'Interpersonal communication & de-escalation',
        description: 'Demonstrate professional communication and verbal de-escalation with inmates.',
        reference: 'BCCC interpersonal communications'
      }
    ]
  },
  {
    id: 'phase-4',
    name: 'Phase 4 — Safety, Security & Emergencies',
    summary: 'Use of force, restraints, and response to fires, medical events, and other emergencies.',
    tasks: [
      {
        id: 'p4-uof-policy',
        title: 'Use of force policy & documentation',
        description: 'Explain the force continuum, legal limits, and complete a use-of-force report.',
        reference: 'Penal Code Ch. 9 / Agency policy / BCCC use of force'
      },
      {
        id: 'p4-restraints',
        title: 'Application of restraints',
        description: 'Demonstrate safe application of handcuffs and other approved restraint devices.',
        reference: 'Agency policy / TCJS restraint rules'
      },
      {
        id: 'p4-suicide-watch',
        title: 'Suicide watch operations',
        description: 'Initiate, staff, and document suicide watch and safety cell placements.',
        reference: 'TCJS §273.5-.6 / Agency policy'
      },
      {
        id: 'p4-fire',
        title: 'Fire & evacuation procedures',
        description: 'Locate fire panels/extinguishers, demonstrate SCBA familiarization, and walk evacuation routes.',
        reference: 'TCJS Ch. 263 (Life Safety)'
      },
      {
        id: 'p4-medical-emergency',
        title: 'Medical emergency response',
        description: 'Respond to a medical emergency drill including CPR/AED access and medical notification.',
        reference: 'TCJS §273 / Agency policy'
      },
      {
        id: 'p4-incident-command',
        title: 'Emergency plans & incident reporting',
        description: 'Review facility emergency plans (riot, escape, hostage, severe weather) and reporting duties.',
        reference: 'TCJS §351.15 / Agency emergency plans'
      }
    ]
  },
  {
    id: 'phase-5',
    name: 'Phase 5 — Legal, Reports & Professionalism',
    summary: 'Documentation, courtroom readiness, transports, and the shadow-to-solo evaluation.',
    tasks: [
      {
        id: 'p5-reports',
        title: 'Report writing',
        description: 'Write clear, factual incident and observation reports acceptable for review.',
        reference: 'BCCC report writing'
      },
      {
        id: 'p5-ethics',
        title: 'Ethics & professional conduct',
        description: 'Review ethics expectations, contraband introduction laws, and boundaries with inmates.',
        reference: 'TCOLE Rules / Penal Code §38.11 & §39.04'
      },
      {
        id: 'p5-transport',
        title: 'Inmate transport procedures',
        description: 'Demonstrate transport preparation, restraint use in vehicles, and court/medical transport security.',
        reference: 'Agency policy'
      },
      {
        id: 'p5-testimony',
        title: 'Courtroom & testimony basics',
        description: 'Review subpoena duties, testimony preparation, and courtroom demeanor.',
        reference: 'BCCC / Agency policy'
      },
      {
        id: 'p5-shadow',
        title: 'Shadow phase evaluation',
        description:
          'Perform all duties of an assigned post while the FTO observes without assistance. Final evaluation for solo readiness.',
        reference: 'Agency FTO program'
      }
    ]
  }
]

export const ALL_TASKS: TrainingTask[] = PHASES.flatMap((p) => p.tasks)

export interface DorCategory {
  id: string
  label: string
}

/** Rating categories for the Daily Observation Report (1–5 scale). */
export const DOR_CATEGORIES: DorCategory[] = [
  { id: 'appearance', label: 'Appearance & Bearing' },
  { id: 'attitude', label: 'Attitude & Acceptance of Feedback' },
  { id: 'knowledge', label: 'Knowledge of Policies / TCOLE / TCJS' },
  { id: 'safety', label: 'Officer Safety' },
  { id: 'communication', label: 'Communication with Inmates & Staff' },
  { id: 'reports', label: 'Report Writing & Documentation' },
  { id: 'performance', label: 'Task Performance & Reliability' }
]

export const RATING_LABELS: Record<number, string> = {
  1: 'Unacceptable',
  2: 'Needs Improvement',
  3: 'Acceptable',
  4: 'Above Standard',
  5: 'Excellent'
}
