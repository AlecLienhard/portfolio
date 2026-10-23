# lnrd.lol

Personal site and resume for Alec Lienhard, self-hosted on my homelab.

**Astro** (static output) with **React + TypeScript** islands for the interactive bits, served by a
non-root, read-only **nginx** container. **GitHub Actions** type-checks and builds it, scans the image
with Trivy, and publishes it to **GHCR**. The homelab pulls it with `update portfolio`.

## Develop

```bash
npm ci
npm run dev        # http://localhost:4321
npm run build      # astro check + static build into dist/
```

All content lives in `src/data/profile.ts` (about, experience, skills) and `src/data/homelab.ts`
(the sanitized homelab diagram, lessons and terminal replays). The home page and `/resume` both
render from them.

| Path | What |
|---|---|
| `src/components/*.astro` | Page sections (static HTML) |
| `src/components/islands/*.tsx` | Interactive React islands: command palette, hero field, workflow demo, table→calendar demo, topology diagram, terminal replay |
| `src/pages/resume.astro` | Printable resume (Print → Save as PDF) |
| `scripts/csp.mjs` | Post-build: hashes Astro's inline scripts into a strict nginx CSP |
| `deploy/` | nginx config + security headers |
| `.github/workflows/deploy.yml` | check → build → Trivy scan → push to GHCR |

## Ship

1. Push to `main`. CI publishes `ghcr.io/aleclienhard/portfolio:latest` (+ `sha-…`).
2. On the Ansible control node: `update portfolio`.

The first deploy is `ansible-playbook playbooks/deploy-portfolio.yml` in homelab-ansible.

## Rules

No internal IPs, hostnames, tunnel IDs or admin URLs on the public site. The homelab section
uses generic names on purpose.
