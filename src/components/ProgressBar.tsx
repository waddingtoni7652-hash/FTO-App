export default function ProgressBar({ done, total }: { done: number; total: number }) {
  const pct = total === 0 ? 0 : Math.round((done / total) * 100)
  return (
    <div className="progress" title={`${done} of ${total} tasks signed off`}>
      <div className="progress-fill" style={{ width: `${pct}%` }} />
      <span className="progress-label">
        {done}/{total} ({pct}%)
      </span>
    </div>
  )
}
