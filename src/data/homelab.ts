// Public, sanitized description of the homelab. No IPs, internal hostnames,
// admin URLs or tunnel IDs: names here are generic on purpose. The source of
// truth is the private homelab-ansible repo.

export type NodeKind = 'external' | 'vm' | 'lxc';

export interface LabNode {
  id: string;
  label: string;
  sub: string;
  kind: NodeKind;
  x: number;
  y: number;
  runs: string[];
  notes: string;
}

export const nodes: LabNode[] = [
  {
    id: 'you', label: 'You', sub: 'reading this', kind: 'external', x: 90, y: 130,
    runs: ['A browser'],
    notes: 'Your request reached this page through Cloudflare and an outbound-only tunnel. No ports are open on the home network.',
  },
  {
    id: 'remote', label: 'Me, remote', sub: 'laptop / phone', kind: 'external', x: 90, y: 430,
    runs: ['Tailscale client'],
    notes: 'Admin access is only over Tailscale. Nothing administrative is exposed to the internet.',
  },
  {
    id: 'cf', label: 'Cloudflare', sub: 'edge + tunnels', kind: 'external', x: 265, y: 130,
    runs: ['DNS', 'TLS termination', 'Tunnels'],
    notes: 'Public hostnames route through Cloudflare Tunnels. cloudflared runs on two VMs, with config templated by an Ansible role and self-updated daily by a systemd timer.',
  },
  {
    id: 'ts', label: 'Tailscale', sub: 'subnet router', kind: 'external', x: 265, y: 430,
    runs: ['WireGuard mesh'],
    notes: 'The infra VM advertises the LAN to the tailnet, with IP forwarding set by Ansible through a sysctl drop-in.',
  },
  {
    id: 'apps', label: 'Apps VM', sub: 'general services', kind: 'vm', x: 500, y: 120,
    runs: ['This portfolio', 'n8n', 'Dashboard', 'Code Server', 'Audiobookshelf', 'PDF tools', '+ more'],
    notes: 'The busiest box. This site runs here as a static nginx container pulled from GHCR.',
  },
  {
    id: 'media', label: 'GPU VM', sub: 'GTX 1060 via VFIO', kind: 'vm', x: 700, y: 120,
    runs: ['Jellyfin', 'Immich', 'Ollama (Vulkan)'],
    notes: 'The "careful" box. The GPU is passed through with VFIO. Patch runs never auto-reboot it, and a verify playbook checks the driver, DKMS and container GPU access afterwards.',
  },
  {
    id: 'games', label: 'Games VM', sub: 'game servers', kind: 'vm', x: 900, y: 120,
    runs: ['Minecraft Java (Paper)', 'Minecraft Bedrock'],
    notes: 'Isolated from everything else so a modded server can misbehave without taking anything down with it.',
  },
  {
    id: 'infra', label: 'Infra VM', sub: 'DNS + reverse proxy', kind: 'vm', x: 500, y: 290,
    runs: ['Pi-hole', 'Unbound', 'Nginx Proxy Manager'],
    notes: 'Recursive DNS and the internal reverse proxy. These used to be separate LXCs and are now one Ansible-managed VM.',
  },
  {
    id: 'arr', label: 'Media mgmt VM', sub: 'VPN-bound', kind: 'vm', x: 700, y: 290,
    runs: ['Media library automation', 'VPN egress container'],
    notes: 'Outbound traffic is forced through a VPN container with a kill switch. Secrets come from Vault-encrypted .env files.',
  },
  {
    id: 'nas', label: 'NAS', sub: 'TrueNAS SCALE', kind: 'vm', x: 900, y: 290,
    runs: ['ZFS pools', 'NFS shares'],
    notes: 'Large libraries stay on the NAS and are NFS-mounted where needed, so nothing large had to be copied during the migration. A weekly job pulls its config over the API and stores it Vault-encrypted in git.',
  },
  {
    id: 'control', label: 'Control VM', sub: 'Ansible', kind: 'vm', x: 500, y: 460,
    runs: ['Ansible', 'the `update` CLI', 'Git (deploy key)'],
    notes: 'Everything is driven from here. Playbooks, roles and encrypted secrets live in git. This VM can be rebuilt from the repo plus two secrets kept in a password manager.',
  },
  {
    id: 'mon', label: 'Observability VM', sub: 'metrics + logs', kind: 'vm', x: 700, y: 460,
    runs: ['Grafana', 'Prometheus', 'Loki', '+ small tools'],
    notes: 'Every Docker VM runs a Grafana Alloy agent that ships logs to Loki and metrics to Prometheus.',
  },
  {
    id: 'pbs', label: 'Backup server', sub: 'Proxmox Backup Server', kind: 'lxc', x: 900, y: 460,
    runs: ['PBS datastore'],
    notes: 'App data on every VM is backed up nightly. Whole VMs are not: they are rebuilt from Ansible, then their app data is restored from PBS.',
  },
];

export type Lens = 'traffic' | 'management' | 'data' | 'observability';

export const lenses: { id: Lens; label: string; blurb: string }[] = [
  { id: 'traffic', label: 'Traffic', blurb: 'How requests get in: public traffic through Cloudflare Tunnels, admin traffic only over Tailscale.' },
  { id: 'management', label: 'Management', blurb: 'One control VM runs Ansible against every guest: patching, Docker stacks, rebuilds.' },
  { id: 'data', label: 'Data', blurb: 'Media lives on the NAS over NFS. App state is backed up nightly to Proxmox Backup Server.' },
  { id: 'observability', label: 'Observability', blurb: 'Alloy agents on every VM feed Prometheus and Loki, with Grafana on top.' },
];

export interface Edge {
  from: string;
  to: string;
  label?: string;
}

const dockerVms = ['apps', 'media', 'games', 'infra', 'arr'];

export const edges: Record<Lens, Edge[]> = {
  traffic: [
    { from: 'you', to: 'cf', label: 'HTTPS' },
    { from: 'cf', to: 'apps', label: 'tunnel' },
    { from: 'cf', to: 'media', label: 'tunnel' },
    { from: 'remote', to: 'ts', label: 'WireGuard' },
    { from: 'ts', to: 'infra', label: 'subnet route' },
    { from: 'infra', to: 'apps' },
    { from: 'infra', to: 'arr' },
  ],
  management: [...dockerVms, 'nas', 'mon', 'pbs'].map((to) => ({ from: 'control', to })),
  data: [
    { from: 'nas', to: 'apps', label: 'NFS' },
    { from: 'nas', to: 'media', label: 'NFS' },
    { from: 'nas', to: 'arr', label: 'NFS' },
    ...[...dockerVms, 'mon'].map((from) => ({ from, to: 'pbs' })),
  ],
  observability: [...dockerVms, 'control'].map((from) => ({ from, to: 'mon' })),
};

// The "trace this request" walk-through on the Traffic lens.
export const trace: { edge: [string, string]; text: string }[] = [
  { edge: ['you', 'cf'], text: 'TLS terminates at the Cloudflare edge. The home IP never appears in DNS.' },
  { edge: ['cf', 'apps'], text: 'cloudflared holds an outbound-only tunnel, so the router has no inbound ports open.' },
  { edge: ['apps', 'apps'], text: 'nginx (unprivileged, read-only container) serves prebuilt static HTML. There is nothing on this page to patch or leak.' },
];

export const labStats = [
  { value: '2', label: 'Proxmox nodes' },
  { value: '~20 → 8', label: 'LXCs → VMs' },
  { value: '11', label: 'Ansible roles' },
  { value: '0', label: 'open inbound ports' },
];

export const migration = {
  before: {
    title: 'LXC era',
    points: [
      'About 20 single-purpose LXCs across two nodes',
      'GPU shared into Jellyfin via LXC device passthrough',
      'Docker nested inside an LXC for the media stack',
      'Hand-configured, with Terraform for the containers only',
    ],
  },
  after: {
    title: 'VM + Ansible era',
    points: [
      'A handful of Debian VMs grouped by function, each running Compose stacks',
      'GTX 1060 moved to proper VFIO passthrough',
      'Every VM rebuildable from roles, verified with --check --diff showing changed=0',
      'Secrets in Ansible Vault, centralized logs and metrics, nightly backups',
    ],
  },
};

export const lessons = [
  {
    title: 'Silent failures are the worst failures',
    body: 'A backup job "ran" every night for days while doing nothing: the PBS client was stuck on an interactive fingerprint prompt under cron. Now fingerprints are pinned by Ansible, and logs from every box land in Loki where I actually look.',
  },
  {
    title: 'Prove idempotence against prod',
    body: 'The rebuild playbook was not done until running it in --check --diff against live VMs reported changed=0. That is what makes "rebuild from scratch" a plan instead of a hope.',
  },
  {
    title: "Don't back up what you can rebuild",
    body: 'The backup datastore is small, so whole-VM images were never an option. Rebuilding the system from code and restoring only app data turned out faster and cleaner anyway.',
  },
  {
    title: 'Two nodes means no quorum',
    body: 'Without a third vote, the Proxmox hosts are deliberately left out of every automated path and patched one at a time by hand. Knowing where not to automate is part of the job.',
  },
];

// Scripted replays for the terminal demo. Output is trimmed and sanitized.
export const terminalScripts: { id: string; label: string; cmd: string; out: string[] }[] = [
  {
    id: 'deploy',
    label: 'update portfolio',
    cmd: 'update portfolio',
    out: [
      '→ stack portfolio on apps-vm (/opt/apps/portfolio)',
      'TASK [Pull images] ************************************',
      'changed: [apps-vm] => ghcr.io/aleclienhard/portfolio:latest',
      'TASK [Recreate changed services] **********************',
      'changed: [apps-vm] => portfolio',
      'TASK [Prune unused images and build cache] ************',
      'ok: [apps-vm] => removed 1 images, reclaimed 41.2 MB',
      'PLAY RECAP  apps-vm : ok=6 changed=2 failed=0',
    ],
  },
  {
    id: 'rebuild',
    label: 'rebuild --check',
    cmd: 'ansible-playbook rebuild-vm.yml --limit apps-vm --check --diff',
    out: [
      'TASK [network : Static interface config] *************',
      'ok: [apps-vm]',
      'TASK [base : Packages, users, sysctl] ****************',
      'ok: [apps-vm]',
      'TASK [docker : Engine + compose plugin] **************',
      'ok: [apps-vm]',
      'TASK [truenas : NFS mounts] **************************',
      'ok: [apps-vm]',
      'TASK [cloudflared : Tunnel config] *******************',
      'ok: [apps-vm]',
      'TASK [pbs_backup : Nightly /opt/apps job] ************',
      'ok: [apps-vm]',
      'PLAY RECAP  apps-vm : ok=48 changed=0 failed=0   ✓ matches live',
    ],
  },
  {
    id: 'patch',
    label: 'update all',
    cmd: 'update all',
    out: [
      'PLAY [Patch LXCs] ************************************',
      'ok: [backup-server]',
      'PLAY [Patch VMs] *************************************',
      'changed: [apps-vm]  changed: [obs-vm]  changed: [dl-vm]',
      'reboot needed: apps-vm (new kernel) → rebooting one at a time',
      'skip reboot: gpu-vm (careful host, flagged for manual reboot)',
      'PLAY [Update Docker stacks] **************************',
      'changed: 6 stacks pulled newer images',
      'ok: unused images pruned, volumes untouched',
      'PLAY RECAP  9 hosts : failed=0 unreachable=0',
    ],
  },
];
