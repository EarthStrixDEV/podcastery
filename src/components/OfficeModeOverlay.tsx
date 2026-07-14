const COLUMNS = ['Department', 'Q1', 'Q2', 'Q3', 'Total']

const ROWS: (string | number)[][] = [
  ['Sales & Marketing', 128400, 141200, 135900, 405500],
  ['Engineering', 214300, 219800, 227600, 661700],
  ['Customer Success', 76200, 79800, 81100, 237100],
  ['Operations', 54900, 58300, 56700, 169900],
  ['Finance', 41200, 42600, 43900, 127700],
  ['Human Resources', 33800, 34500, 35100, 103400],
  ['Product', 98700, 102300, 108900, 309900],
  ['IT Infrastructure', 62400, 64100, 65800, 192300],
  ['Legal', 27600, 28100, 28900, 84600],
  ['Procurement', 45300, 46800, 47200, 139300],
  ['R&D', 156800, 162400, 168200, 487400],
  ['Facilities', 21400, 21900, 22300, 65600],
  ['Business Development', 39700, 41100, 42800, 123600],
  ['Quality Assurance', 48900, 50200, 51600, 150700],
  ['Training & Development', 18600, 19200, 19800, 57600],
  ['Regional Office - North', 71300, 73900, 75200, 220400],
  ['Regional Office - South', 68200, 70100, 71800, 210100],
  ['Executive', 92100, 93400, 94700, 280200],
]

const COLUMN_LETTERS = ['A', 'B', 'C', 'D', 'E']

export function OfficeModeOverlay() {
  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col bg-[#f3f3f3] text-[#1a1a1a]"
      style={{ fontFamily: 'Calibri, Arial, sans-serif' }}
      role="presentation"
      aria-hidden="true"
    >
      {/* Title bar */}
      <div className="flex h-9 shrink-0 items-center justify-between bg-[#217346] px-3 text-[13px] text-white">
        <span>Q3_Budget_Report.xlsx - Excel</span>
        <span className="flex gap-3 text-white/80">
          <span>_</span>
          <span>▢</span>
          <span>✕</span>
        </span>
      </div>

      {/* Menu bar */}
      <div className="flex h-7 shrink-0 items-center gap-4 border-b border-[#d4d4d4] bg-white px-3 text-[13px] text-[#333]">
        <span>File</span>
        <span>Home</span>
        <span>Insert</span>
        <span>Page Layout</span>
        <span>Formulas</span>
        <span>Data</span>
        <span>Review</span>
        <span>View</span>
      </div>

      {/* Toolbar */}
      <div className="flex h-10 shrink-0 items-center gap-2 border-b border-[#d4d4d4] bg-[#f9f9f9] px-3">
        <div className="h-6 w-16 rounded-sm border border-[#c8c8c8] bg-white" />
        <div className="h-6 w-6 rounded-sm border border-[#c8c8c8] bg-white" />
        <div className="h-6 w-6 rounded-sm border border-[#c8c8c8] bg-white" />
        <div className="mx-2 h-6 w-px bg-[#d4d4d4]" />
        <div className="h-6 w-20 rounded-sm border border-[#c8c8c8] bg-white" />
        <div className="h-6 w-10 rounded-sm border border-[#c8c8c8] bg-white" />
      </div>

      {/* Formula bar */}
      <div className="flex h-7 shrink-0 items-center gap-2 border-b border-[#d4d4d4] bg-white px-3 text-[12px] text-[#555]">
        <span className="w-12 border-r border-[#d4d4d4] pr-2">A1</span>
        <span className="italic text-[#999]">fx</span>
        <span>Department</span>
      </div>

      {/* Sheet grid */}
      <div className="min-h-0 flex-1 overflow-auto bg-white">
        <table className="w-full border-collapse text-[13px]">
          <thead>
            <tr>
              <th className="sticky top-0 left-0 z-10 w-10 border border-[#d4d4d4] bg-[#f3f3f3] text-[#666]" />
              {COLUMN_LETTERS.map((letter) => (
                <th
                  key={letter}
                  className="sticky top-0 z-10 min-w-32 border border-[#d4d4d4] bg-[#f3f3f3] px-2 py-1 text-center font-normal text-[#666]"
                >
                  {letter}
                </th>
              ))}
            </tr>
            <tr>
              <th className="sticky left-0 z-10 border border-[#d4d4d4] bg-[#f3f3f3] text-center font-normal text-[#666]">
                1
              </th>
              {COLUMNS.map((col) => (
                <th
                  key={col}
                  className="border border-[#d4d4d4] bg-[#eaeaea] px-2 py-1 text-left font-semibold text-[#1a1a1a]"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row, rowIndex) => (
              <tr key={row[0] as string}>
                <td className="sticky left-0 z-10 border border-[#d4d4d4] bg-[#f3f3f3] text-center text-[#666]">
                  {rowIndex + 2}
                </td>
                {row.map((cell, cellIndex) => (
                  <td
                    key={cellIndex}
                    className={
                      cellIndex === 0
                        ? 'border border-[#e0e0e0] px-2 py-1 text-left text-[#1a1a1a]'
                        : 'border border-[#e0e0e0] px-2 py-1 text-right text-[#1a1a1a]'
                    }
                  >
                    {typeof cell === 'number' ? cell.toLocaleString('en-US') : cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Status bar */}
      <div className="flex h-6 shrink-0 items-center justify-between border-t border-[#d4d4d4] bg-[#217346] px-3 text-[11px] text-white">
        <span>Sheet1</span>
        <span>100%</span>
      </div>
    </div>
  )
}
