import { useEffect, useRef, useState } from 'react';
import { terminalScripts } from '../../data/homelab';

// Replays abridged, sanitized output of the homelab's `update` CLI and
// Ansible runs. Starts when scrolled into view; tabs switch scripts.

export default function TerminalReplay() {
  const [scriptId, setScriptId] = useState(terminalScripts[0].id);
  const [typed, setTyped] = useState('');
  const [lines, setLines] = useState(0);
  const [started, setStarted] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const script = terminalScripts.find((s) => s.id === scriptId)!;

  useEffect(() => {
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        setStarted(true);
        io.disconnect();
      }
    }, { threshold: 0.4 });
    if (root.current) io.observe(root.current);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!started) return;
    let cancelled = false;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const sleep = (ms: number) => new Promise((r) => setTimeout(r, reduced ? 0 : ms));
    setTyped('');
    setLines(0);
    (async () => {
      await sleep(300);
      for (let i = 1; i <= script.cmd.length && !cancelled; i++) {
        setTyped(script.cmd.slice(0, i));
        await sleep(32);
      }
      await sleep(350);
      for (let i = 1; i <= script.out.length && !cancelled; i++) {
        setLines(i);
        await sleep(script.out[i - 1].startsWith('TASK') || script.out[i - 1].startsWith('PLAY') ? 380 : 160);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [scriptId, started]);

  const done = lines === script.out.length;

  return (
    <div className="term" ref={root}>
      <div className="term__bar">
        <span className="term__dots" aria-hidden="true"><i /><i /><i /></span>
        <div className="term__tabs" role="tablist" aria-label="Command to replay">
          {terminalScripts.map((s) => (
            <button
              key={s.id}
              type="button"
              role="tab"
              aria-selected={s.id === scriptId}
              className="term__tab"
              onClick={() => {
                setStarted(true);
                setScriptId(s.id);
              }}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>
      <pre className="term__screen" aria-label={`Replay of ${script.cmd}`}>
        <span className="term__ps">ansible@control:~$ </span>
        <span>{typed}</span>
        {!lines && <span className="term__cursor" />}
        {'\n'}
        {script.out.slice(0, lines).map((l, i) => (
          <span key={i} className={lineClass(l)}>{l + '\n'}</span>
        ))}
        {done && (
          <>
            <span className="term__ps">ansible@control:~$ </span>
            <span className="term__cursor" />
          </>
        )}
      </pre>
      <style>{css}</style>
    </div>
  );
}

function lineClass(l: string) {
  if (l.startsWith('TASK') || l.startsWith('PLAY [')) return 'term__task';
  if (l.startsWith('changed')) return 'term__changed';
  if (l.startsWith('ok')) return 'term__ok';
  if (l.startsWith('skip') || l.startsWith('reboot')) return 'term__warn';
  if (l.startsWith('PLAY RECAP')) return 'term__recap';
  return '';
}

const css = `
.term { border: 1px solid var(--line); border-radius: 14px; overflow: hidden; background: #07080b; box-shadow: 0 30px 60px -30px rgb(0 0 0 / 0.8); }
.term__bar { display: flex; align-items: center; gap: 1rem; padding: 0.6rem 0.9rem; border-bottom: 1px solid var(--line); background: var(--ink-2); flex-wrap: wrap; }
.term__dots { display: flex; gap: 6px; }
.term__dots i { width: 11px; height: 11px; border-radius: 50%; background: #2c3242; }
.term__dots i:first-child { background: var(--pink); }
.term__dots i:nth-child(2) { background: #f5c451; }
.term__dots i:last-child { background: var(--signal); }
.term__tabs { display: flex; gap: 0.25rem; flex-wrap: wrap; }
.term__tab { font: 0.78rem var(--font-mono); background: none; color: var(--muted); border: 1px solid transparent; border-radius: 6px; padding: 0.3rem 0.6rem; cursor: pointer; }
.term__tab:hover { color: var(--text); }
.term__tab[aria-selected="true"] { color: var(--text); border-color: var(--line); background: var(--ink); }
.term__screen { margin: 0; padding: 1.1rem 1.2rem; min-height: 21rem; font: 0.8rem/1.7 var(--font-mono); color: #c9cfdc; white-space: pre-wrap; word-break: break-word; overflow-x: auto; }
.term__ps { color: var(--signal); }
.term__cursor { display: inline-block; width: 0.55em; height: 1.1em; vertical-align: text-bottom; background: var(--signal); animation: term-blink 1s steps(1) infinite; }
@keyframes term-blink { 50% { opacity: 0; } }
.term__task { color: var(--muted); }
.term__ok { color: #7ee787; }
.term__changed { color: #f5c451; }
.term__warn { color: var(--cyan); }
.term__recap { color: var(--text); font-weight: 700; }
`;
