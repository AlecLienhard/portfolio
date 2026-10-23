import { useEffect, useMemo, useRef, useState } from 'react';

interface Props {
  email: string;
  links: { github: string; linkedin: string };
}

interface Action {
  id: string;
  label: string;
  hint: string;
  run: () => void | Promise<void>;
}

// Any element can open the palette with: window.dispatchEvent(new Event('palette:open'))
export const OPEN_EVENT = 'palette:open';

function go(hash: string) {
  if (location.pathname !== '/') location.href = `/${hash}`;
  else document.querySelector(hash)?.scrollIntoView({ behavior: 'smooth' });
}

export default function CommandPalette({ email, links }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const [toast, setToast] = useState('');

  const actions: Action[] = useMemo(
    () => [
      { id: 'work', label: 'Go to Work', hint: 'section', run: () => go('#work') },
      { id: 'experience', label: 'Go to Experience', hint: 'section', run: () => go('#experience') },
      { id: 'homelab', label: 'Go to Homelab', hint: 'section', run: () => go('#homelab') },
      { id: 'contact', label: 'Go to Contact', hint: 'section', run: () => go('#contact') },
      { id: 'resume', label: 'Open printable resume', hint: '/resume', run: () => { location.href = '/resume'; } },
      {
        id: 'email',
        label: 'Copy email address',
        hint: 'clipboard',
        run: async () => {
          await navigator.clipboard.writeText(email);
          setToast('Email copied');
        },
      },
      { id: 'github', label: 'Open GitHub', hint: 'external', run: () => { window.open(links.github, '_blank', 'noopener'); } },
      { id: 'linkedin', label: 'Open LinkedIn', hint: 'external', run: () => { window.open(links.linkedin, '_blank', 'noopener'); } },
      { id: 'top', label: 'Back to top', hint: 'scroll', run: () => window.scrollTo({ top: 0, behavior: 'smooth' }) },
    ],
    [email, links],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return actions;
    // Subsequence match, so "gh" finds "Open GitHub".
    return actions.filter((a) => {
      const label = a.label.toLowerCase();
      let i = 0;
      for (const ch of label) if (ch === q[i]) i++;
      return i === q.length;
    });
  }, [query, actions]);

  const open = () => {
    if (dialog.current?.open) return;
    setQuery('');
    setActive(0);
    dialog.current?.showModal();
    requestAnimationFrame(() => input.current?.focus());
  };
  const close = () => dialog.current?.close();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (dialog.current?.open) close();
        else open();
      }
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener(OPEN_EVENT, open);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener(OPEN_EVENT, open);
    };
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 1800);
    return () => clearTimeout(t);
  }, [toast]);

  const runAt = async (i: number) => {
    const action = filtered[i];
    if (!action) return;
    close();
    try {
      await action.run();
    } catch {
      setToast('That did not work in this browser');
    }
  };

  const onInputKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      void runAt(active);
    }
  };

  return (
    <>
      <dialog
        ref={dialog}
        className="cp"
        aria-label="Command palette"
        onClick={(e) => e.target === dialog.current && close()}
      >
        <div className="cp__box">
          <div className="cp__search">
            <span className="cp__prompt" aria-hidden="true">›</span>
            <input
              ref={input}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActive(0);
              }}
              onKeyDown={onInputKey}
              placeholder="Type a command…"
              aria-label="Search commands"
              aria-controls="cp-list"
              aria-activedescendant={filtered[active] ? `cp-${filtered[active].id}` : undefined}
              role="combobox"
              aria-expanded="true"
              autoComplete="off"
              spellCheck={false}
            />
            <kbd>esc</kbd>
          </div>
          <ul id="cp-list" role="listbox" className="cp__list">
            {filtered.map((a, i) => (
              <li
                key={a.id}
                id={`cp-${a.id}`}
                role="option"
                aria-selected={i === active}
                className="cp__item"
                onMouseMove={() => setActive(i)}
                onClick={() => void runAt(i)}
              >
                <span>{a.label}</span>
                <span className="cp__hint">{a.hint}</span>
              </li>
            ))}
            {filtered.length === 0 && <li className="cp__empty">No matches. Try “home” or “mail”.</li>}
          </ul>
        </div>
      </dialog>
      <div className={`cp-toast${toast ? ' is-on' : ''}`} role="status" aria-live="polite">
        {toast}
      </div>
      <style>{css}</style>
    </>
  );
}

const css = `
.cp {
  padding: 0; border: 0; background: transparent; color: var(--text);
  width: min(36rem, calc(100vw - 2rem)); margin: 14vh auto auto;
}
.cp::backdrop { background: rgb(5 6 9 / 0.7); backdrop-filter: blur(6px); }
.cp[open] .cp__box { animation: cp-in 0.22s var(--ease); }
@keyframes cp-in { from { opacity: 0; transform: translateY(-8px) scale(0.98); } }
.cp__box {
  background: var(--ink-2); border: 1px solid var(--line); border-radius: var(--radius);
  box-shadow: 0 30px 80px -20px rgb(0 0 0 / 0.8), 0 0 0 1px rgb(198 244 50 / 0.06);
  overflow: hidden;
}
.cp__search { display: flex; align-items: center; gap: 0.75rem; padding: 1rem 1.1rem; border-bottom: 1px solid var(--line); }
.cp__prompt { color: var(--signal); font: 700 1.2rem var(--font-mono); }
.cp__search input {
  flex: 1; min-width: 0; background: none; border: 0; outline: 0; color: var(--text);
  font: 1.05rem var(--font-mono);
}
.cp__list { list-style: none; margin: 0; padding: 0.4rem; max-height: 50vh; overflow-y: auto; }
.cp__item {
  display: flex; justify-content: space-between; gap: 1rem; padding: 0.7rem 0.8rem;
  border-radius: 10px; cursor: pointer;
}
.cp__item[aria-selected="true"] { background: var(--surface); box-shadow: inset 2px 0 0 var(--signal); }
.cp__hint, .cp__empty { font: 0.8rem var(--font-mono); color: var(--muted); }
.cp__empty { padding: 0.9rem; }
.cp-toast {
  position: fixed; left: 50%; bottom: calc(1.5rem + env(safe-area-inset-bottom, 0px));
  transform: translate(-50%, 1rem); opacity: 0; pointer-events: none;
  background: var(--signal); color: var(--signal-ink); font: 600 0.9rem var(--font-display);
  padding: 0.6rem 1rem; border-radius: 999px; transition: 0.25s var(--ease); z-index: 60;
}
.cp-toast.is-on { opacity: 1; transform: translate(-50%, 0); }
`;
