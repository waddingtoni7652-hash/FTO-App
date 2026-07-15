import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

interface Props {
  /** Shown in the on-screen toolbar only, not on the printed page. */
  title: string
  onClose: () => void
  children: ReactNode
}

/**
 * Full-screen print preview. The document (children) renders on a white sheet;
 * printing uses the browser's print dialog, where "Microsoft Print to PDF" /
 * "Save as PDF" produces a PDF with no network or extra libraries — this keeps
 * report output working in all three builds (PWA, portable file://, Electron).
 * While mounted, a `print-mode` class on <body> lets print CSS hide the app.
 */
export default function PrintView({ title, onClose, children }: Props) {
  useEffect(() => {
    document.body.classList.add('print-mode')
    return () => document.body.classList.remove('print-mode')
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return createPortal(
    <div className="print-overlay">
      <div className="print-toolbar no-print">
        <strong>{title}</strong>
        <div className="print-toolbar-buttons">
          <button onClick={() => window.print()}>Print / Save as PDF</button>
          <button className="secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
      <div className="print-sheet">{children}</div>
    </div>,
    document.body
  )
}
