import { GRADE_SCALE, gradeColor } from '../grades'

// A quick grade picker for a test: tap a code (N0…E8) to record the result.
// `current` is the existing grade (or falsy); onPick(code) sets it, and the
// Clear button (shown only when already graded) removes it via onPick(null).
export default function GradeModal({ test, current, onPick, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>Grade this test</h3>
        <p className="modal-sub">{test?.title || 'How did it go?'}</p>

        <div className="grade-grid">
          {GRADE_SCALE.map((g) => (
            <button
              key={g.code}
              type="button"
              className={`grade-chip ${current === g.code ? 'selected' : ''}`}
              style={{ '--grade-color': gradeColor(g.code) }}
              onClick={() => {
                onPick(g.code)
                onClose()
              }}
            >
              <span className="grade-chip-code">{g.code}</span>
              <span className="grade-chip-band">{g.band}</span>
            </button>
          ))}
        </div>

        <div className="modal-actions">
          {current ? (
            <button
              type="button"
              className="ghost-btn danger"
              onClick={() => {
                onPick(null)
                onClose()
              }}
            >
              Clear grade
            </button>
          ) : (
            <span className="spacer" />
          )}
          <span className="spacer" />
          <button type="button" className="ghost-btn" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  )
}
