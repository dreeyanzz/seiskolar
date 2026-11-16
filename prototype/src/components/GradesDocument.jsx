import React from 'react'

// Scanned document preview ported from 04-high-fidelity/_app.js.
// Supports "grades" (complete scan), "grades-cut" (bottom-right corner cut off),
// and "registration" (Study Load scan).
export function GradesDocument({
  kind = 'grades',
  scholarName = 'Santiago, Bea',
  lines,
}) {
  const defaultRows = [
    { code: 'CS 311', units: '3', grade: '4.50' },
    { code: 'CS 312', units: '3', grade: '4.20' },
    { code: 'MATH 301', units: '3', grade: '4.80' },
    { code: 'GE 105', units: '3', grade: '4.00' },
  ]
  const rows = (lines && lines.length ? lines : defaultRows).slice(0, 6)

  if (kind === 'registration') {
    return (
      <svg
        viewBox="0 0 600 780"
        role="img"
        aria-label="Scan of a Study Load"
        fontFamily="Georgia, serif"
        fill="#2a2f36"
      >
        <rect x="20" y="20" width="560" height="740" fill="#fff" stroke="#d8dde4" />
        <circle cx="80" cy="80" r="26" fill="none" stroke="#800000" strokeWidth="4" />
        <text x="122" y="74" fontSize="15" fontWeight="700">
          Office of the University Registrar
        </text>
        <rect x="122" y="84" width="180" height="8" rx="3" fill="#d9dde3" />
        <text
          x="300"
          y="150"
          fontSize="20"
          fontWeight="700"
          textAnchor="middle"
          letterSpacing="1"
        >
          OFFICIAL STUDY LOAD
        </text>
        <text x="56" y="196" fontSize="14">
          Name: {scholarName}
        </text>
        <text x="330" y="196" fontSize="14">
          1st Sem, AY 2026–2027
        </text>
        <g fontSize="12" fontWeight="700" fill="#5a6472">
          <text x="56" y="236">
            SUBJECT
          </text>
          <text x="420" y="236" textAnchor="end">
            SECTION
          </text>
          <text x="540" y="236" textAnchor="end">
            UNITS
          </text>
        </g>
        <path d="M56 244h484" stroke="#2a2f36" strokeWidth="1.5" />
        <g fontSize="15">
          {rows.map((r, i) => {
            const y = 272 + i * 36
            return (
              <g key={i}>
                <text x="56" y={y}>
                  {r.code || 'SUBJ'}
                </text>
                <rect x="150" y={y - 11} width="180" height="10" rx="3" fill="#d9dde3" />
                <text x="420" y={y} textAnchor="end">
                  G0{i + 1}
                </text>
                <text x="540" y={y} textAnchor="end">
                  {r.units || '3'}
                </text>
              </g>
            )
          })}
        </g>
        <path d="M56 500h484" stroke="#d8dde4" />
        <text x="56" y="534" fontSize="14" fontWeight="700">
          Status: Officially Enrolled
        </text>
        <circle cx="250" cy="610" r="46" fill="none" stroke="#c9ced6" strokeWidth="3" />
        <path
          d="M66 620c18-26 30 8 46-14s22 12 40-6 20 4 34-8"
          fill="none"
          stroke="#1f3b73"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path d="M60 640h150" stroke="#2a2f36" />
        <text x="60" y="660" fontSize="12">
          University Registrar
        </text>
      </svg>
    )
  }

  const isCut = kind === 'grades-cut'
  return (
    <svg
      viewBox="0 0 600 780"
      role="img"
      aria-label={
        'Scan of a Certified True Copy of Grades' +
        (isCut ? ', with its bottom-right corner cut off' : '')
      }
      fontFamily="Georgia, serif"
      fill="#2a2f36"
    >
      <rect x="20" y="20" width="560" height="740" fill="#fff" stroke="#d8dde4" />
      <circle cx="80" cy="80" r="26" fill="none" stroke="#800000" strokeWidth="4" />
      <text x="122" y="74" fontSize="15" fontWeight="700">
        Office of the Registrar
      </text>
      <rect x="122" y="84" width="180" height="8" rx="3" fill="#d9dde3" />
      <text
        x="300"
        y="150"
        fontSize="20"
        fontWeight="700"
        textAnchor="middle"
        letterSpacing="1"
      >
        CERTIFIED TRUE COPY OF GRADES
      </text>
      <text x="56" y="196" fontSize="14">
        Name: {scholarName}
      </text>
      <text x="330" y="196" fontSize="14">
        BS Computer Science
      </text>
      <g fontSize="12" fontWeight="700" fill="#5a6472">
        <text x="56" y="236">
          SUBJECT
        </text>
        <text x="420" y="236" textAnchor="end">
          UNITS
        </text>
        <text x="540" y="236" textAnchor="end">
          GRADE
        </text>
      </g>
      <path d="M56 244h484" stroke="#2a2f36" strokeWidth="1.5" />
      <g fontSize="15">
        {rows.map((row, i) => {
          const y = 268 + i * 36
          return (
            <g key={i}>
              <text x="56" y={y}>
                {row.code || 'SUBJ'}
              </text>
              <rect x="150" y={y - 11} width="210" height="10" rx="3" fill="#d9dde3" />
              <text x="420" y={y} textAnchor="end">
                {row.units || '3'}
              </text>
              <text x="540" y={y} textAnchor="end">
                {row.grade || '–'}
              </text>
            </g>
          )
        })}
      </g>
      <path d="M56 490h484" stroke="#d8dde4" />
      <circle cx="250" cy="600" r="46" fill="none" stroke="#c9ced6" strokeWidth="3" />
      <circle
        cx="250"
        cy="600"
        r="36"
        fill="none"
        stroke="#dde1e6"
        strokeWidth="2"
        strokeDasharray="4 4"
      />
      <path
        d="M66 620c18-26 30 8 46-14s22 12 40-6 20 4 34-8"
        fill="none"
        stroke="#1f3b73"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path d="M60 640h150" stroke="#2a2f36" />
      <text x="60" y="660" fontSize="12">
        University Registrar
      </text>
      {isCut && (
        <>
          <path d="M452 318 600 312V780H280z" fill="#e9ecf0" />
          <path
            d="M452 318 280 780"
            stroke="#b4bcc7"
            strokeWidth="2"
            strokeDasharray="6 5"
          />
        </>
      )}
    </svg>
  )
}
