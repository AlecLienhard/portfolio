import { useEffect, useMemo, useState } from 'react';
import { edges, lenses, nodes, trace, type Edge, type Lens } from '../../data/homelab';

const W = 150;
const H = 60;
const byId = Object.fromEntries(nodes.map((n) => [n.id, n]));

function pathFor(e: Edge) {
  const a = byId[e.from];
  const b = byId[e.to];
  // A gentle bend so parallel edges don't sit on top of each other.
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const bend = 0.12;
  return `M${a.x},${a.y} Q${mx - dy * bend},${my + dx * bend} ${b.x},${b.y}`;
}

const midpoint = (e: Edge) => {
  const a = byId[e.from];
  const b = byId[e.to];
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  // Point at t=0.5 on the quadratic above.
  return { x: (a.x + b.x) / 2 - dy * 0.06, y: (a.y + b.y) / 2 + dx * 0.06 };
};

const LENS_COLOR: Record<Lens, string> = {
  traffic: 'var(--signal)',
  management: 'var(--cyan)',
  data: 'var(--pink)',
  observability: '#b18cff',
};

export default function Topology() {
  const [lens, setLens] = useState<Lens>('traffic');
  const [selected, setSelected] = useState<string>('apps');
  const [step, setStep] = useState(-1);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    setReduced(matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);

  useEffect(() => {
    if (step < 0) return;
    if (step >= trace.length) return;
    const t = setTimeout(() => setStep((s) => s + 1), 2400);
    return () => clearTimeout(t);
  }, [step]);

  const active = edges[lens];
  const color = LENS_COLOR[lens];
  const tracing = step >= 0;
  const traceEdge = tracing && step < trace.length ? trace[step].edge : null;

  const related = useMemo(
    () => new Set(active.flatMap((e) => (e.from === selected || e.to === selected ? [e.from, e.to] : []))),
    [active, selected],
  );

  const isLit = (e: Edge) =>
    traceEdge ? e.from === traceEdge[0] && e.to === traceEdge[1] : e.from === selected || e.to === selected;

  const focused = !!traceEdge || active.some((e) => e.from === selected || e.to === selected);
  const node = byId[selected];
  const lensInfo = lenses.find((l) => l.id === lens)!;

  const startTrace = () => {
    setLens('traffic');
    setSelected('you');
    setStep(0);
  };

  useEffect(() => {
    if (traceEdge) setSelected(traceEdge[1]);
  }, [step]);

  return (
    <div className="topo" style={{ ['--lens' as string]: color }}>
      <div className="topo__toolbar">
        <div className="topo__lenses" role="tablist" aria-label="Diagram lens">
          {lenses.map((l) => (
            <button
              key={l.id}
              role="tab"
              type="button"
              aria-selected={lens === l.id}
              className="topo__lens"
              style={{ ['--c' as string]: LENS_COLOR[l.id] }}
              onClick={() => {
                setLens(l.id);
                setStep(-1);
              }}
            >
              {l.label}
            </button>
          ))}
        </div>
        <button type="button" className="topo__trace" onClick={startTrace} disabled={tracing && step < trace.length}>
          {tracing && step < trace.length ? 'Tracing…' : '▸ Trace this page’s request'}
        </button>
      </div>
      <p className="topo__blurb">{lensInfo.blurb}</p>

      <div className="topo__body">
        <div className="topo__canvas">
          <p className="topo__swipe mono" aria-hidden="true">← swipe to explore →</p>
          <svg viewBox="0 0 1000 560" role="group" aria-label="Homelab architecture diagram">
            <defs>
              <pattern id="topo-grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <circle cx="1" cy="1" r="1" fill="#262c3a" />
              </pattern>
            </defs>
            <rect x="0" y="0" width="1000" height="560" fill="url(#topo-grid)" />
            <rect x="395" y="45" width="590" height="490" rx="22" className="topo__cluster" />
            <text x="415" y="72" className="topo__cluster-label">2-node Proxmox cluster · Debian VMs · Docker Compose</text>
            <line x1="178" y1="280" x2="380" y2="280" className="topo__divider" />
            <text x="180" y="268" className="topo__zone">internet</text>
            <text x="180" y="302" className="topo__zone">private</text>

            <g key={lens}>
              {active.map((e) => {
                const d = pathFor(e);
                const lit = isLit(e);
                const m = midpoint(e);
                return (
                  <g key={`${e.from}-${e.to}`} className="topo__edge" data-lit={lit} data-dim={focused && !lit}>
                    <path d={d} className="topo__wire" />
                    {!reduced && (
                      <circle r={lit ? 4 : 2.5} className="topo__packet">
                        <animateMotion dur={lit ? '1.4s' : '3.2s'} repeatCount="indefinite" path={d} />
                      </circle>
                    )}
                    {e.label && lit && (
                      <text x={m.x} y={m.y - 8} className="topo__elabel" textAnchor="middle">
                        {e.label}
                      </text>
                    )}
                  </g>
                );
              })}
            </g>

            {nodes.map((n) => {
              const on = n.id === selected;
              const near = related.has(n.id);
              return (
                <g
                  key={n.id}
                  className="topo__node"
                  data-kind={n.kind}
                  data-on={on}
                  data-near={near}
                  transform={`translate(${n.x - W / 2},${n.y - H / 2})`}
                  tabIndex={0}
                  role="button"
                  aria-pressed={on}
                  aria-label={`${n.label}: ${n.sub}`}
                  onClick={() => {
                    setSelected(n.id);
                    setStep(-1);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelected(n.id);
                      setStep(-1);
                    }
                  }}
                >
                  <rect width={W} height={H} rx="12" />
                  <text x="14" y="26" className="topo__nlabel">{n.label}</text>
                  <text x="14" y="45" className="topo__nsub">{n.sub}</text>
                  {n.kind !== 'external' && <circle cx={W - 14} cy="14" r="3.5" className="topo__led" />}
                </g>
              );
            })}
          </svg>
        </div>

        <aside className="topo__panel" aria-live="polite">
          {tracing ? (
            <>
              <h3 className="topo__ptitle">Request trace</h3>
              <ol className="topo__log">
                {trace.slice(0, Math.min(step + 1, trace.length)).map((t, i) => (
                  <li key={i} data-current={i === step}>
                    <span className="mono">
                      {byId[t.edge[0]].label} → {byId[t.edge[1]].label}
                    </span>
                    {t.text}
                  </li>
                ))}
              </ol>
              {step >= trace.length && (
                <button type="button" className="topo__reset" onClick={() => setStep(-1)}>
                  Done · back to explore
                </button>
              )}
            </>
          ) : (
            <>
              <span className="topo__kind mono">{node.kind === 'lxc' ? 'LXC' : node.kind === 'vm' ? 'VM' : 'external'}</span>
              <h3 className="topo__ptitle">{node.label}</h3>
              <p className="topo__psub">{node.sub}</p>
              <ul className="topo__runs">
                {node.runs.map((r) => <li key={r} className="chip">{r}</li>)}
              </ul>
              <p className="topo__notes">{node.notes}</p>
              <p className="topo__hint mono">Click any box · switch lenses above</p>
            </>
          )}
        </aside>
      </div>
      <style>{css}</style>
    </div>
  );
}

const css = `
.topo { border: 1px solid var(--line); border-radius: calc(var(--radius) + 6px); background: var(--ink-2); overflow: hidden; }
.topo__toolbar { display: flex; flex-wrap: wrap; gap: 0.75rem; justify-content: space-between; align-items: center; padding: 1rem 1.25rem 0; }
.topo__lenses { display: flex; flex-wrap: wrap; gap: 0.35rem; background: var(--ink); border: 1px solid var(--line); border-radius: 999px; padding: 0.25rem; }
.topo__lens { font: 500 0.85rem var(--font-display); color: var(--muted); background: none; border: 0; padding: 0.45rem 0.9rem; border-radius: 999px; cursor: pointer; transition: 0.2s; }
.topo__lens:hover { color: var(--text); }
.topo__lens[aria-selected="true"] { background: var(--c); color: var(--signal-ink); font-weight: 600; }
.topo__trace { font: 600 0.85rem var(--font-display); background: none; color: var(--signal); border: 1px solid var(--signal); border-radius: 999px; padding: 0.5rem 1rem; cursor: pointer; transition: 0.2s; }
.topo__trace:hover:not(:disabled) { background: var(--signal); color: var(--signal-ink); }
.topo__trace:disabled { opacity: 0.6; cursor: progress; }
.topo__blurb { color: var(--muted); margin: 0.9rem 1.25rem 0; font-size: 0.95rem; }
.topo__swipe { display: none; margin: 0.25rem 0.5rem; font-size: 0.72rem; color: var(--muted); position: sticky; left: 0; }
.topo__body { display: grid; grid-template-columns: minmax(0, 1fr) 19rem; }
.topo__canvas { overflow-x: auto; padding: 0.5rem; }
.topo__canvas svg { display: block; width: 100%; min-width: 680px; height: auto; font-family: var(--font-display); }
.topo__cluster { fill: rgb(255 255 255 / 0.015); stroke: var(--line); stroke-dasharray: 6 6; }
.topo__cluster-label, .topo__zone { fill: var(--muted); font: 12px var(--font-mono); }
.topo__divider { stroke: var(--line); stroke-dasharray: 3 5; }
.topo__wire { fill: none; stroke: var(--lens); stroke-width: 1.5; opacity: 0.35; transition: opacity 0.3s, stroke-width 0.3s; }
.topo__packet { fill: var(--lens); }
.topo__edge[data-dim="true"] .topo__wire { opacity: 0.12; }
.topo__edge[data-dim="true"] .topo__packet { opacity: 0.25; }
.topo__edge[data-lit="true"] .topo__wire { opacity: 1; stroke-width: 2.5; filter: drop-shadow(0 0 6px var(--lens)); }
.topo__elabel { fill: var(--text); font: 600 12px var(--font-mono); paint-order: stroke; stroke: var(--ink-2); stroke-width: 5px; }
.topo__node { cursor: pointer; outline: none; }
.topo__node rect { fill: var(--surface); stroke: var(--line); stroke-width: 1.5; transition: 0.25s; }
.topo__node[data-kind="external"] rect { fill: var(--ink); stroke-dasharray: 4 4; }
.topo__node:hover rect, .topo__node:focus-visible rect { stroke: var(--text); }
.topo__node[data-near="true"] rect { stroke: var(--lens); }
.topo__node[data-on="true"] rect { stroke: var(--lens); stroke-width: 2.5; fill: color-mix(in srgb, var(--lens) 12%, var(--surface)); }
.topo__nlabel { fill: var(--text); font-size: 15px; font-weight: 600; pointer-events: none; }
.topo__nsub { fill: var(--muted); font: 11px var(--font-mono); pointer-events: none; }
.topo__led { fill: var(--signal); animation: topo-led 2.4s infinite; }
@keyframes topo-led { 50% { opacity: 0.35; } }
.topo__panel { border-left: 1px solid var(--line); padding: 1.25rem; background: var(--ink); min-height: 22rem; }
.topo__kind { font-size: 0.72rem; color: var(--lens); text-transform: uppercase; letter-spacing: 0.1em; }
.topo__ptitle { font-size: 1.4rem; margin: 0.25rem 0 0.15rem; letter-spacing: -0.02em; }
.topo__psub { color: var(--muted); margin: 0 0 1rem; font-size: 0.9rem; }
.topo__runs { list-style: none; padding: 0; margin: 0 0 1rem; display: flex; flex-wrap: wrap; gap: 0.35rem; }
.topo__notes { font-size: 0.93rem; margin: 0 0 1.25rem; }
.topo__hint { font-size: 0.72rem; color: var(--muted); margin: 0; }
.topo__log { list-style: none; padding: 0; margin: 0.75rem 0 1rem; display: grid; gap: 0.9rem; font-size: 0.92rem; }
.topo__log li { color: var(--muted); padding-left: 0.9rem; border-left: 2px solid var(--line); animation: topo-in 0.4s var(--ease); }
.topo__log li[data-current="true"] { color: var(--text); border-color: var(--signal); }
.topo__log .mono { display: block; font-size: 0.75rem; color: var(--signal); margin-bottom: 0.2rem; }
@keyframes topo-in { from { opacity: 0; transform: translateX(-6px); } }
.topo__reset { font: 600 0.85rem var(--font-display); background: var(--surface); color: var(--text); border: 1px solid var(--line); border-radius: 999px; padding: 0.5rem 0.9rem; cursor: pointer; }
@media (max-width: 960px) {
  .topo__body { grid-template-columns: 1fr; }
  .topo__panel { border-left: 0; border-top: 1px solid var(--line); min-height: 0; }
}
@media (max-width: 720px) {
  .topo__swipe { display: block; }
}
`;
