// Everything the site says about Alec lives here. The home page and the
// printable /resume page both render from this file, so edit once.

export const profile = {
  name: 'Alec Lienhard',
  shortName: 'Alec',
  location: 'Denver metro, Colorado',
  headline: 'DevOps engineer building internal platforms on Backstage, and the automation behind them.',
  roles: ['internal portals', 'self-service automation', 'API integrations', 'infrastructure as code', 'a homelab'],
  summary:
    'I build the internal web portals teams use to get work done: React + TypeScript on Backstage, ' +
    'backed by n8n and AWX workflows that do the heavy lifting. Before that I spent years on the ops side, ' +
    'running VMware, AWS and Active Directory at enterprise scale and automating patching end to end, ' +
    'so I build tools for the people I used to be.',
  email: 'alienhard01@gmail.com',
  links: {
    github: 'https://github.com/AlecLienhard',
    linkedin: 'https://www.linkedin.com/in/alec-lienhard',
  },
} as const;

export interface Stat {
  value: string;
  label: string;
}

export const stats: Stat[] = [
  { value: '7,000+', label: 'VMs managed in VMware' },
  { value: '150+', label: 'AWS accounts operated' },
  { value: '500+', label: 'AD domains administered' },
  { value: '90%', label: 'manual work automated away' },
];

export interface Role {
  title: string;
  org: string;
  period: string;
  highlights: string[];
  stack: string[];
}

// TODO(Alec): confirm the Associate role was at Epsilon too (the old resume
// left it as "Company Name").
export const experience: Role[] = [
  {
    title: 'Systems Administrator – DevOps (L4)',
    org: 'Epsilon',
    period: 'Aug 2025 – Present',
    highlights: [
      'Build internal web portals on Backstage (React + TypeScript) that several teams use as their front door for infrastructure and operations work.',
      'Turn complicated, multi-step business processes into self-service flows: n8n and AWX do the work, and Backstage gives it a UI with validation and live status.',
      'Design data-heavy UIs, including inline-editable database tables and calendar and schedule views (FullCalendar) built on the same data.',
      'Integrate a wide API surface into single views: SentinelOne, OpsRamp, AWX, Kibana, AWS, ServiceNow and more.',
      'Built and extended an in-house patch orchestration platform (Python, JavaScript, MySQL, PowerShell) with automated scheduling, real-time monitoring and self-healing.',
    ],
    stack: ['Backstage', 'React', 'TypeScript', 'n8n', 'AWX', 'Python', 'REST APIs'],
  },
  {
    title: 'Systems Administrator',
    org: 'Epsilon',
    period: 'Jul 2024 – Aug 2025',
    highlights: [
      'Managed VMware environments hosting 7,000+ client systems and AWS operations across 150+ accounts.',
      'Administered Active Directory across 500+ domains and 300 forests, including GPOs and security policy.',
      'Wrote PowerShell automation that removed 90% of manual tasks, and built the first version of the patching platform.',
      'Promoted twice, to Systems Administrator 2 and then to DevOps L4.',
    ],
    stack: ['VMware', 'AWS', 'Active Directory', 'DNS', 'PowerShell'],
  },
  {
    title: 'Associate Systems Administrator',
    org: 'Epsilon',
    period: 'Jun 2023 – Jul 2024',
    highlights: [
      'Handled incident, problem and change management under ITIL, working with vendors and internal support.',
      'Did hardware and software upgrades, server installs and VMware-based infrastructure work for enterprise clients.',
    ],
    stack: ['VMware', 'Windows Server', 'ITIL'],
  },
];

export const education = {
  degree: 'B.S. Computer Science',
  school: 'West Virginia University',
  period: '2019 – 2023',
};

export interface SkillGroup {
  name: string;
  items: string[];
}

export const skills: SkillGroup[] = [
  { name: 'Frontend', items: ['React', 'TypeScript', 'Backstage', 'Astro', 'FullCalendar', 'UI/UX for data'] },
  { name: 'Automation', items: ['n8n', 'Ansible', 'AWX', 'PowerShell', 'Python', 'Bash'] },
  { name: 'Integrations', items: ['ServiceNow', 'SentinelOne', 'OpsRamp', 'Kibana', 'Sumo Logic', 'AWS APIs'] },
  { name: 'Infrastructure', items: ['Proxmox', 'VMware', 'Docker Compose', 'AWS', 'Active Directory', 'Cloudflare'] },
  { name: 'Ops', items: ['Grafana', 'Loki', 'Prometheus', 'GitHub Actions', 'ITIL change mgmt', 'Agile/Scrum'] },
];

// The APIs orbiting the "integrations" visual on the home page.
export const integrations = ['ServiceNow', 'SentinelOne', 'OpsRamp', 'AWX', 'Kibana', 'AWS', 'n8n', 'Sumo Logic'];
