import { useState } from 'react';

// "Same data, different view": edit a row in the table and the calendar
// below re-renders from it, the way table-backed FullCalendar views work.

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] as const;
const HOURS = [18, 19, 20, 21, 22, 23];

interface Row {
  id: number;
  group: string;
  day: number;
  start: number;
  length: number;
  color: string;
}

const INITIAL: Row[] = [
  { id: 1, group: 'web-tier', day: 0, start: 19, length: 2, color: 'var(--signal)' },
  { id: 2, group: 'db-cluster', day: 2, start: 21, length: 2, color: 'var(--cyan)' },
  { id: 3, group: 'batch-nodes', day: 3, start: 18, length: 3, color: 'var(--pink)' },
];

export default function ScheduleDemo() {
  const [rows, setRows] = useState(INITIAL);
  const [hover, setHover] = useState<number | null>(null);
  const [flash, setFlash] = useState<number | null>(null);

  const update = (id: number, patch: Partial<Row>) => {
    setRows((rs) =>
      rs.map((r) => {
        if (r.id !== id) return r;
        const next = { ...r, ...patch };
        // Keep the window inside the visible evening range.
        next.length = Math.min(next.length, 24 - next.start);
        return next;
      }),
    );
    setFlash(id);
    setTimeout(() => setFlash((f) => (f === id ? null : f)), 700);
  };

  return (
    <div className="sched">
      <div className="sched__tablewrap">
        <table className="sched__table">
          <caption className="sched__cap">maintenance_windows · editable</caption>
          <thead>
            <tr>
              <th scope="col">group</th>
              <th scope="col">day</th>
              <th scope="col">start</th>
              <th scope="col">hrs</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr
                key={r.id}
                data-hover={hover === r.id}
                data-flash={flash === r.id}
                onMouseEnter={() => setHover(r.id)}
                onMouseLeave={() => setHover(null)}
              >
                <td>
                  <span className="sched__swatch" style={{ background: r.color }} />
                  {r.group}
                </td>
                <td>
                  <select aria-label={`${r.group} day`} value={r.day} onChange={(e) => update(r.id, { day: +e.target.value })}>
                    {DAYS.map((d, i) => <option key={d} value={i}>{d}</option>)}
                  </select>
                </td>
                <td>
                  <select aria-label={`${r.group} start hour`} value={r.start} onChange={(e) => update(r.id, { start: +e.target.value })}>
                    {HOURS.map((h) => <option key={h} value={h}>{h}:00</option>)}
                  </select>
                </td>
                <td>
                  <select aria-label={`${r.group} length`} value={r.length} onChange={(e) => update(r.id, { length: +e.target.value })}>
                    {[1, 2, 3, 4].map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="sched__cal" role="img" aria-label="Week view rendered from the table above">
        <div className="sched__corner" />
        {DAYS.flatMap((d, di) =>
          HOURS.map((h, hi) => <div key={`${d}${h}`} className="sched__cell" style={{ gridColumn: di + 2, gridRow: hi + 2 }} />),
        )}
        {DAYS.map((d, di) => <div key={d} className="sched__day" style={{ gridColumn: di + 2 }}>{d}</div>)}
        {HOURS.map((h, hi) => (
          <div key={h} className="sched__hour" style={{ gridRow: hi + 2 }}>{h}</div>
        ))}
        {rows.map((r) => (
          <div
            key={r.id}
            className="sched__event"
            data-hover={hover === r.id}
            data-flash={flash === r.id}
            onMouseEnter={() => setHover(r.id)}
            onMouseLeave={() => setHover(null)}
            style={{
              gridColumn: r.day + 2,
              gridRow: `${HOURS.indexOf(r.start) + 2} / span ${r.length}`,
              ['--c' as string]: r.color,
            }}
          >
            {r.group}
          </div>
        ))}
      </div>
      <style>{css}</style>
    </div>
  );
}

const css = `
.sched { display: grid; gap: 0.9rem; font-size: 0.85rem; }
.sched__tablewrap { overflow-x: auto; border: 1px solid var(--line); border-radius: 12px; background: var(--ink); }
.sched__table { width: 100%; border-collapse: collapse; font-family: var(--font-mono); }
.sched__cap { text-align: left; padding: 0.6rem 0.8rem; color: var(--muted); font-size: 0.75rem; border-bottom: 1px solid var(--line); }
.sched__table th { text-align: left; font-weight: 500; color: var(--muted); padding: 0.45rem clamp(0.4rem, 2vw, 0.8rem); font-size: 0.72rem; }
.sched__table td { padding: 0.35rem clamp(0.4rem, 2vw, 0.8rem); border-top: 1px solid var(--line); white-space: nowrap; }
.sched__table tr { transition: background 0.3s; }
.sched__table tr[data-hover="true"] { background: var(--ink-2); }
.sched__table tr[data-flash="true"] { background: rgb(198 244 50 / 0.12); }
.sched__swatch { display: inline-block; width: 0.55rem; height: 0.55rem; border-radius: 2px; margin-right: 0.5rem; }
.sched select { background: var(--surface); color: var(--text); border: 1px solid var(--line); border-radius: 6px; font: inherit; padding: 0.2rem 0.3rem; cursor: pointer; }
.sched select:hover { border-color: var(--signal); }
.sched__cal { display: grid; grid-template-columns: 2rem repeat(5, minmax(0, 1fr)); grid-template-rows: 1.6rem repeat(6, 1.75rem); gap: 2px; background: var(--ink); border: 1px solid var(--line); border-radius: 12px; padding: 0.5rem; }
.sched__corner { grid-area: 1 / 1; }
.sched__cell { border-radius: 4px; background: var(--ink-2); }
.sched__day { text-align: center; color: var(--muted); font: 0.72rem var(--font-mono); grid-row: 1; }
.sched__hour { color: var(--muted); font: 0.68rem var(--font-mono); grid-column: 1; }
.sched__event { margin: 1px 2px; border-radius: 6px; padding: 0.2rem 0.3rem; font: 600 0.64rem/1.25 var(--font-mono); overflow: hidden; overflow-wrap: anywhere;
  background: color-mix(in srgb, var(--c) 22%, transparent); border-left: 3px solid var(--c); color: var(--text); transition: transform 0.3s var(--ease), box-shadow 0.3s; }
.sched__event[data-hover="true"] { transform: scale(1.03); box-shadow: 0 0 0 1px var(--c); }
.sched__event[data-flash="true"] { animation: sched-pop 0.6s var(--ease); }
@keyframes sched-pop { 40% { transform: scale(1.08); box-shadow: 0 0 24px -4px var(--c); } }
`;
