import { useEffect, useRef, useState } from 'react';

// A generic self-service request moving through the systems a portal
// orchestrates. Illustrative only: no real ticket numbers or endpoints.

type Status = 'idle' | 'running' | 'done';

const STEPS = [
  { system: 'Backstage', text: 'Form submitted with validated inputs', ms: 500 },
  { system: 'n8n', text: 'Workflow triggered, request enriched', ms: 900 },
  { system: 'ServiceNow', text: 'Change request opened and linked', ms: 1000 },
  { system: 'AWX', text: 'Job template launched against targets', ms: 1500 },
  { system: 'SentinelOne', text: 'Agent health verified', ms: 800 },
  { system: 'OpsRamp', text: 'Monitoring enabled', ms: 800 },
  { system: 'Backstage', text: 'Status updated, team notified', ms: 500 },
];

export default function FlowDemo() {
  const [statuses, setStatuses] = useState<Status[]>(() => STEPS.map(() => 'idle'));
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const cancelled = useRef(false);

  useEffect(() => () => {
    cancelled.current = true;
  }, []);

  const run = async () => {
    if (running) return;
    setRunning(true);
    setElapsed(0);
    setStatuses(STEPS.map(() => 'idle'));
    const start = performance.now();
    const tick = setInterval(() => setElapsed(performance.now() - start), 100);
    for (let i = 0; i < STEPS.length; i++) {
      if (cancelled.current) break;
      setStatuses((s) => s.map((v, j) => (j === i ? 'running' : v)));
      await new Promise((r) => setTimeout(r, STEPS[i].ms));
      setStatuses((s) => s.map((v, j) => (j === i ? 'done' : v)));
    }
    clearInterval(tick);
    setElapsed(performance.now() - start);
    setRunning(false);
  };

  const finished = statuses.every((s) => s === 'done');

  return (
    <div className="flow">
      <div className="flow__bar">
        <span className="flow__title">
          <span className="flow__dot" data-state={running ? 'run' : finished ? 'ok' : 'idle'} />
          Request: provision a server group
        </span>
        <button className="flow__btn" onClick={run} disabled={running} type="button">
          {running ? 'Running…' : finished ? 'Run again' : 'Run workflow ▸'}
        </button>
      </div>
      <ol className="flow__steps">
        {STEPS.map((step, i) => (
          <li key={i} className="flow__step" data-state={statuses[i]}>
            <span className="flow__icon" aria-hidden="true">
              {statuses[i] === 'done' ? '✓' : statuses[i] === 'running' ? '' : i + 1}
            </span>
            <span className="flow__sys">{step.system}</span>
            <span className="flow__text">{step.text}</span>
          </li>
        ))}
      </ol>
      <div className="flow__foot" aria-live="polite">
        {finished
          ? `Done in ${(elapsed / 1000).toFixed(1)}s. It used to be a ticket queue and a few days of email.`
          : running
            ? `${(elapsed / 1000).toFixed(1)}s`
            : 'One form. Six systems. Zero tickets bounced between teams.'}
      </div>
      <style>{css}</style>
    </div>
  );
}

const css = `
.flow { background: var(--ink); border: 1px solid var(--line); border-radius: 12px; overflow: hidden; font-size: 0.92rem; }
.flow__bar { display: flex; flex-wrap: wrap; gap: 0.75rem; justify-content: space-between; align-items: center; padding: 0.8rem 1rem; border-bottom: 1px solid var(--line); background: var(--ink-2); }
.flow__title { display: inline-flex; align-items: center; gap: 0.55rem; font-weight: 600; }
.flow__dot { width: 0.55rem; height: 0.55rem; border-radius: 50%; background: var(--muted); }
.flow__dot[data-state="run"] { background: var(--cyan); animation: flow-blink 0.8s infinite; }
.flow__dot[data-state="ok"] { background: var(--signal); }
@keyframes flow-blink { 50% { opacity: 0.3; } }
.flow__btn { font: 600 0.85rem var(--font-display); padding: 0.5rem 0.9rem; border-radius: 999px; border: 0; background: var(--signal); color: var(--signal-ink); cursor: pointer; }
.flow__btn:disabled { background: var(--surface); color: var(--muted); cursor: progress; }
.flow__steps { list-style: none; margin: 0; padding: 0.5rem 0; }
.flow__step { display: grid; grid-template-columns: 1.6rem 6.5rem 1fr; gap: 0.75rem; align-items: center; padding: 0.45rem 1rem; color: var(--muted); transition: color 0.3s, background 0.3s; }
.flow__step[data-state="running"] { color: var(--text); background: rgb(90 209 255 / 0.06); }
.flow__step[data-state="done"] { color: var(--text); }
.flow__icon { width: 1.6rem; height: 1.6rem; border-radius: 50%; border: 1px solid var(--line); display: grid; place-items: center; font: 0.72rem var(--font-mono); }
.flow__step[data-state="done"] .flow__icon { background: var(--signal); border-color: var(--signal); color: var(--signal-ink); font-weight: 700; }
.flow__step[data-state="running"] .flow__icon { border-color: var(--cyan); border-top-color: transparent; animation: flow-spin 0.7s linear infinite; }
@keyframes flow-spin { to { transform: rotate(360deg); } }
.flow__sys { font: 600 0.8rem var(--font-mono); }
.flow__step[data-state="done"] .flow__sys { color: var(--signal); }
.flow__foot { padding: 0.75rem 1rem; border-top: 1px solid var(--line); font: 0.8rem var(--font-mono); color: var(--muted); min-height: 2.75rem; }
@media (max-width: 480px) { .flow__step { grid-template-columns: 1.6rem 1fr; } .flow__text { grid-column: 2; } }
`;
