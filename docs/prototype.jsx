import { useState, useRef, useEffect, useCallback } from "react";

const T = {
  bg: "#0a0a0a",
  bg1: "#111111",
  bg2: "#1a1a1a",
  bg3: "#222222",
  bdr: "rgba(255,255,255,0.08)",
  bdr2: "rgba(255,255,255,0.05)",
  t: "#f0f0f0",
  t2: "#888",
  t3: "#444",
  t4: "#2a2a2a",
  m: "'Geist Mono',monospace",
  s: "'Geist',-apple-system,sans-serif",
  blu: "#3b82f6",
  grn: "#22c55e",
  amb: "#f59e0b",
  red: "#ef4444",
  pur: "#a855f7",
  cyn: "#06b6d4",
};
const SC = {
  active: T.blu,
  review: T.amb,
  done: T.grn,
  idle: T.t3,
  blocked: T.red,
};

/* ── Icons (Lucide style) ──────────────────────────────── */
const S = ({ children, size = 14, color = "currentColor", ...r }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ flexShrink: 0, verticalAlign: "middle" }}
    {...r}
  >
    {children}
  </svg>
);
const IC = {
  arrowUp: (p) => (
    <S {...p}>
      <path d="M12 19V5" />
      <path d="m5 12 7-7 7 7" />
    </S>
  ),
  arrowL: (p) => (
    <S {...p}>
      <path d="M19 12H5" />
      <path d="m12 19-7-7 7-7" />
    </S>
  ),
  plus: (p) => (
    <S {...p}>
      <path d="M12 5v14M5 12h14" />
    </S>
  ),
  x: (p) => (
    <S {...p}>
      <path d="M18 6 6 18M6 6l12 12" />
    </S>
  ),
  minus: (p) => (
    <S {...p}>
      <path d="M5 12h14" />
    </S>
  ),
  max: (p) => (
    <S {...p}>
      <path d="M8 3H5a2 2 0 00-2 2v3M21 8V5a2 2 0 00-2-2h-3M3 16v3a2 2 0 002 2h3M16 21h3a2 2 0 002-2v-3" />
    </S>
  ),
  folder: (p) => (
    <S {...p}>
      <path d="M20 20a2 2 0 002-2V8a2 2 0 00-2-2h-7.9a2 2 0 01-1.69-.9L9.6 3.9A2 2 0 007.93 3H4a2 2 0 00-2 2v13a2 2 0 002 2Z" />
    </S>
  ),
  git: (p) => (
    <S {...p}>
      <path d="M6 3v12" />
      <circle cx="18" cy="6" r="3" />
      <circle cx="6" cy="18" r="3" />
      <path d="M18 9a9 9 0 01-9 9" />
    </S>
  ),
  file: (p) => (
    <S {...p}>
      <path d="M14.5 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
      <path d="m10 13-2 2 2 2M14 17l2-2-2-2" />
    </S>
  ),
  term: (p) => (
    <S {...p}>
      <polyline points="4 17 10 11 4 5" />
      <line x1="12" x2="20" y1="19" y2="19" />
    </S>
  ),
  hex: (p) => (
    <S {...p}>
      <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
    </S>
  ),
  bot: (p) => (
    <S {...p}>
      <path d="M12 8V4H8" />
      <rect width="16" height="12" x="4" y="8" rx="2" />
      <path d="M2 14h2M20 14h2M15 13v2M9 13v2" />
    </S>
  ),
  user: (p) => (
    <S {...p}>
      <path d="M19 21v-2a4 4 0 00-4-4H9a4 4 0 00-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </S>
  ),
  zap: (p) => (
    <S {...p}>
      <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" />
    </S>
  ),
  shield: (p) => (
    <S {...p}>
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 01-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 011-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 011.52 0C14.51 3.81 17 5 19 5a1 1 0 011 1z" />
    </S>
  ),
  shieldOk: (p) => (
    <S {...p}>
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 01-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 011-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 011.52 0C14.51 3.81 17 5 19 5a1 1 0 011 1z" />
      <path d="m9 12 2 2 4-4" />
    </S>
  ),
  chkC: (p) => (
    <S {...p}>
      <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
      <path d="m9 11 3 3L22 4" />
    </S>
  ),
  circ: (p) => (
    <S {...p}>
      <circle cx="12" cy="12" r="10" />
    </S>
  ),
  load: (p) => (
    <S {...p}>
      <path d="M12 2v4M16.2 7.8l2.9-2.9M18 12h4M16.2 16.2l2.9 2.9M12 18v4M4.9 19.1l2.9-2.9M2 12h4M4.9 4.9l2.9 2.9" />
    </S>
  ),
  ban: (p) => (
    <S {...p}>
      <circle cx="12" cy="12" r="10" />
      <path d="m4.9 4.9 14.2 14.2" />
    </S>
  ),
  merge: (p) => (
    <S {...p}>
      <circle cx="18" cy="18" r="3" />
      <circle cx="6" cy="6" r="3" />
      <path d="M6 21V9a9 9 0 009 9" />
    </S>
  ),
  scan: (p) => (
    <S {...p}>
      <path d="M3 7V5a2 2 0 012-2h2M17 3h2a2 2 0 012 2v2M21 17v2a2 2 0 01-2 2h-2M7 21H5a2 2 0 01-2-2v-2" />
    </S>
  ),
  play: (p) => (
    <S {...p}>
      <polygon points="6 3 20 12 6 21 6 3" />
    </S>
  ),
  spark: (p) => (
    <S {...p}>
      <path d="m12 3-1.9 5.8a2 2 0 01-1.3 1.3L3 12l5.8 1.9a2 2 0 011.3 1.3L12 21l1.9-5.8a2 2 0 011.3-1.3L21 12l-5.8-1.9a2 2 0 01-1.3-1.3L12 3Z" />
    </S>
  ),
  wflow: (p) => (
    <S {...p}>
      <rect x="3" y="3" width="8" height="8" rx="2" />
      <path d="M7 11v4a2 2 0 002 2h4" />
      <rect x="13" y="13" width="8" height="8" rx="2" />
    </S>
  ),
  layers: (p) => (
    <S {...p}>
      <path d="m12.8 2.2a2 2 0 00-1.6 0L2.6 6.1a1 1 0 000 1.8l8.6 3.9a2 2 0 001.6 0l8.6-3.9a1 1 0 000-1.8Z" />
      <path d="m22 17.7-9.2 4.1a2 2 0 01-1.6 0L2 17.7" />
      <path d="m22 12.7-9.2 4.1a2 2 0 01-1.6 0L2 12.7" />
    </S>
  ),
  net: (p) => (
    <S {...p}>
      <rect x="16" y="16" width="6" height="6" rx="1" />
      <rect x="2" y="16" width="6" height="6" rx="1" />
      <rect x="9" y="2" width="6" height="6" rx="1" />
      <path d="M5 16v-3a1 1 0 011-1h12a1 1 0 011 1v3M12 12V8" />
    </S>
  ),
  eye: (p) => (
    <S {...p}>
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </S>
  ),
  clock: (p) => (
    <S {...p}>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </S>
  ),
  db: (p) => (
    <S {...p}>
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M3 5v14a9 3 0 0018 0V5" />
      <path d="M3 12a9 3 0 0018 0" />
    </S>
  ),
  srv: (p) => (
    <S {...p}>
      <rect width="20" height="8" x="2" y="2" rx="2" />
      <rect width="20" height="8" x="2" y="14" rx="2" />
      <line x1="6" x2="6.01" y1="6" y2="6" />
      <line x1="6" x2="6.01" y1="18" y2="18" />
    </S>
  ),
};

/* ── Data ──────────────────────────────────────────────── */
const PROJ = [
  {
    id: "p1",
    name: "Data Annotation Tool",
    repo: "github.com/team/data-annotator",
    st: "active",
    ag: 5,
    act: 3,
    br: 7,
    last: "2 min ago",
  },
  {
    id: "p2",
    name: "Analytics Dashboard",
    repo: "github.com/team/analytics-dash",
    st: "idle",
    ag: 3,
    act: 0,
    br: 4,
    last: "1h ago",
  },
  {
    id: "p3",
    name: "Mobile API Gateway",
    repo: "github.com/team/api-gateway",
    st: "idle",
    ag: 0,
    act: 0,
    br: 1,
    last: "3d ago",
  },
];
const NODES = [
  {
    id: "orch",
    ty: "orch",
    x: 420,
    y: 100,
    label: "Orchestrator",
    sub: "mistral-large · coordination",
    status: "active",
    tok: "14.2k",
    prog: null,
    task: "Decomposing mission into DAG. Generating contracts.",
    ch: ["fe", "be", "sec"],
    branch: null,
    skills: [],
    val: null,
    wt: null,
  },
  {
    id: "fe",
    ty: "parent",
    x: 80,
    y: 340,
    label: "Frontend Agent",
    sub: "vibe cli · devstral-2 · worktree",
    status: "active",
    tok: "9.1k",
    prog: 61,
    task: "Building React components. Reading api-schema.json.",
    ch: ["fa", "fd", "fm"],
    branch: "agent/frontend-001",
    skills: ["CodeStyle", "Zustand", "Tailwind"],
    val: { lv: 1, st: "pending", r: "npm build — pass" },
    wt: ".worktrees/agent-fe-001/",
  },
  {
    id: "be",
    ty: "parent",
    x: 500,
    y: 340,
    label: "Backend Agent",
    sub: "vibe cli · devstral-2 · worktree",
    status: "review",
    tok: "11.3k",
    prog: 89,
    task: "API complete. Wrote contract. Awaiting gate L2.",
    ch: ["ba", "bd"],
    branch: "agent/backend-002",
    skills: ["CodeStyle", "FastAPI", "PostgreSQL"],
    val: { lv: 2, st: "running", r: "pytest 14/14 pass" },
    wt: ".worktrees/agent-be-002/",
  },
  {
    id: "sec",
    ty: "sec",
    x: 900,
    y: 340,
    label: "Security Agent",
    sub: "vibe cli · transversal",
    status: "idle",
    tok: "1.8k",
    prog: null,
    task: "Standby. Invoke via Security Scan.",
    ch: [],
    branch: null,
    skills: ["OWASP", "SecretScan"],
    val: null,
    wt: null,
  },
  {
    id: "fa",
    ty: "child",
    x: 0,
    y: 580,
    label: "Auth UI",
    sub: "child of fe · worktree",
    status: "done",
    tok: "3.4k",
    prog: 100,
    task: "OAuth2 login + signup. Gate L2 passed. Merged.",
    ch: [],
    branch: "agent/fe-001/auth-ui",
    skills: ["Zustand"],
    val: { lv: 2, st: "pass", r: "npm test 8/8 · build OK" },
    wt: ".worktrees/fe-auth/",
  },
  {
    id: "fd",
    ty: "child",
    x: 220,
    y: 580,
    label: "Dashboard",
    sub: "child of fe · worktree",
    status: "active",
    tok: "5.1k",
    prog: 43,
    task: "Metric cards + sidebar. WebSocket in progress.",
    ch: [],
    branch: "agent/fe-001/dashboard",
    skills: ["Tailwind"],
    val: { lv: 1, st: "pending", r: "build pass" },
    wt: ".worktrees/fe-dash/",
  },
  {
    id: "fm",
    ty: "child",
    x: 440,
    y: 580,
    label: "Responsive",
    sub: "blocked — depends on dashboard",
    status: "blocked",
    tok: "—",
    prog: 0,
    task: "Blocked. Waiting for dashboard (DAG dep).",
    ch: [],
    branch: null,
    skills: ["Tailwind"],
    val: null,
    wt: null,
  },
  {
    id: "ba",
    ty: "child",
    x: 620,
    y: 580,
    label: "Auth API",
    sub: "child of be · worktree",
    status: "done",
    tok: "5.8k",
    prog: 100,
    task: "/auth/login + /auth/refresh. Gate L3 passed.",
    ch: [],
    branch: "agent/be-002/auth-api",
    skills: ["FastAPI", "JWT"],
    val: { lv: 3, st: "pass", r: "integration merge clean" },
    wt: ".worktrees/be-auth/",
  },
  {
    id: "bd",
    ty: "child",
    x: 840,
    y: 580,
    label: "DB Schema",
    sub: "child of be · worktree",
    status: "active",
    tok: "4.2k",
    prog: 58,
    task: "users, sessions, refresh_tokens. Alembic 60%.",
    ch: [],
    branch: "agent/be-002/db",
    skills: ["PostgreSQL"],
    val: { lv: 1, st: "pending", r: "pytest 6/6 pass" },
    wt: ".worktrees/be-db/",
  },
];
const EDGES = [
  { f: "orch", t: "fe" },
  { f: "orch", t: "be" },
  { f: "orch", t: "sec" },
  { f: "fe", t: "fa" },
  { f: "fe", t: "fd" },
  { f: "fe", t: "fm" },
  { f: "be", t: "ba" },
  { f: "be", t: "bd" },
];
const DAG = [
  { id: "t1", l: "Backend API schema", ag: "be", st: "done", d: [] },
  { id: "t2", l: "Auth API endpoints", ag: "ba", st: "done", d: ["t1"] },
  { id: "t3", l: "DB migrations", ag: "bd", st: "active", d: ["t1"] },
  { id: "t4", l: "Write contract", ag: "be", st: "done", d: ["t2"] },
  { id: "t5", l: "Frontend auth UI", ag: "fa", st: "done", d: ["t4"] },
  { id: "t6", l: "Dashboard", ag: "fd", st: "active", d: ["t4"] },
  { id: "t7", l: "Responsive", ag: "fm", st: "blocked", d: ["t6"] },
  { id: "t8", l: "Security audit", ag: "sec", st: "idle", d: ["t2", "t5"] },
];
const CTRS = [
  {
    f: "api-schema.json",
    by: "be",
    rd: ["fe", "fa", "fd"],
    ago: "2m",
    code: '{\n  "POST /auth/login": {\n    "body": {"email":"str","password":"str"},\n    "response": {"access_token":"str"}\n  }\n}',
  },
  {
    f: "types.d.ts",
    by: "orch",
    rd: ["fe", "be"],
    ago: "8m",
    code: "interface User {\n  id: string;\n  email: string;\n  name: string;\n}\ninterface Session {\n  token: string;\n  user_id: string;\n}",
  },
];
const WT = [
  { br: "main", st: "clean", ag: null },
  { br: "integration", st: "2 pending", ag: "orch" },
  { br: "agent/frontend-001", st: "+14 files", ag: "fe" },
  { br: "agent/backend-002", st: "+8 files", ag: "be" },
  { br: "agent/fe-001/auth-ui", st: "merged", ag: "fa" },
  { br: "agent/fe-001/dashboard", st: "+6 files", ag: "fd" },
  { br: "agent/be-002/auth-api", st: "merged", ag: "ba" },
  { br: "agent/be-002/db", st: "+3 files", ag: "bd" },
];
const MSGS = [
  { role: "sys", text: "Alchemistral v0.1 — Session started.", ts: "09:12:00" },
  {
    role: "rep",
    orig: "make auth work with google",
    ref: "Implement OAuth2 with Google. JWT + refresh rotation. Frontend login/signup. Backend /auth/login, /auth/refresh with PostgreSQL.",
    ts: "09:12:15",
  },
  {
    role: "orch",
    text: "Repository analyzed:\n— React 18 + Vite + TS\n— FastAPI + PostgreSQL\n— Monorepo\n\nDAG:\n  t1: Backend schema → no deps\n  t2: Auth API → t1\n  t4: Contract → t2\n  t5: FE auth → t4\n  t6: Dashboard → t4\n\nSpawning worktrees...",
    ts: "09:12:18",
  },
  {
    role: "orch",
    text: "Worktrees:\n  .worktrees/agent-fe-001/ → agent/frontend-001\n  .worktrees/agent-be-002/ → agent/backend-002\n\nContract: .alchemistral/contracts/types.d.ts\n\nVibe CLI launching...",
    ts: "09:12:22",
  },
  {
    role: "dev",
    text: "Use Zustand for state. Tailwind for styling.",
    ts: "09:13:20",
  },
  {
    role: "orch",
    text: "Global memory updated:\n— Zustand (no Redux)\n— Tailwind CSS\n— All FE agents inherit.\n\nSkills: CodeStyle + Zustand + Tailwind → fe agents",
    ts: "09:13:22",
  },
  {
    role: "val",
    agent: "ba",
    lv: 2,
    st: "pass",
    detail: "pytest 14/14 · build OK · no secrets",
    ts: "09:18:44",
  },
  {
    role: "val",
    agent: "fa",
    lv: 2,
    st: "pass",
    detail: "npm test 8/8 · build OK",
    ts: "09:19:02",
  },
  {
    role: "orch",
    text: "ba + fa passed Gate L2.\nMerging to parent branches.\nContract updated.\nfd can proceed.",
    ts: "09:19:10",
  },
];
const MEM = [
  "React 18 + TS (strict)",
  "Zustand — no Redux",
  "Tailwind CSS",
  "OAuth2 + JWT + refresh",
  "FastAPI + PostgreSQL",
  "PEP8 + pytest",
  "Alembic migrations",
  "Contracts in .alchemistral/contracts/",
];

/* ── Helpers ───────────────────────────────────────────── */
const Dot = ({ color, pulse, sz = 6 }) => (
  <div style={{ position: "relative", width: sz, height: sz, flexShrink: 0 }}>
    {pulse && (
      <div
        style={{
          position: "absolute",
          inset: -3,
          borderRadius: "50%",
          background: color,
          opacity: 0.25,
          animation: "pulse 1.6s ease-in-out infinite",
        }}
      />
    )}
    <div
      style={{ width: sz, height: sz, borderRadius: "50%", background: color }}
    />
  </div>
);
const Tag = ({ children, c }) => (
  <span
    style={{
      fontSize: 7.5,
      fontWeight: 600,
      letterSpacing: 0.8,
      color: c || T.t3,
      border: `1px solid ${c ? c + "33" : T.bdr2}`,
      padding: "1px 5px",
      borderRadius: 2,
      fontFamily: T.m,
    }}
  >
    {children}
  </span>
);
const Sk = ({ n }) => (
  <span
    style={{
      fontSize: 7,
      fontWeight: 500,
      color: T.cyn,
      background: T.cyn + "12",
      border: `1px solid ${T.cyn}22`,
      padding: "1px 4px",
      borderRadius: 2,
      fontFamily: T.m,
    }}
  >
    {n}
  </span>
);
const SH = ({ children }) => (
  <div
    style={{
      fontSize: 8,
      fontWeight: 600,
      letterSpacing: 2,
      color: T.t3,
      fontFamily: T.m,
      marginBottom: 8,
      textTransform: "uppercase",
      marginTop: 16,
    }}
  >
    {children}
  </div>
);
const StI = ({ s, sz = 10 }) => {
  const c = SC[s] || T.t3;
  return s === "done"
    ? IC.chkC({ size: sz, color: c })
    : s === "active"
      ? IC.load({ size: sz, color: c })
      : s === "review"
        ? IC.eye({ size: sz, color: c })
        : s === "blocked"
          ? IC.ban({ size: sz, color: c })
          : IC.circ({ size: sz, color: c });
};
const VB = ({ v }) => {
  if (!v) return null;
  const c = v.st === "pass" ? T.grn : v.st === "running" ? T.amb : T.t3;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 3,
        fontSize: 7,
        fontFamily: T.m,
        color: c,
      }}
    >
      {v.st === "pass"
        ? IC.chkC({ size: 9, color: c })
        : IC.load({ size: 9, color: c })}{" "}
      L{v.lv} <span style={{ color: T.t3 }}>{v.st.toUpperCase()}</span>
    </div>
  );
};

/* ── Canvas Node ───────────────────────────────────────── */
const NW = 240;
function CNode({ n, sel, onClick, onDrag, vp }) {
  const sc = SC[n.status] || T.t3,
    dr = useRef(false),
    sp = useRef({});
  const md = useCallback(
    (e) => {
      e.stopPropagation();
      dr.current = true;
      sp.current = { mx: e.clientX, my: e.clientY, nx: n.x, ny: n.y };
      const mm = (ev) => {
        if (!dr.current) return;
        onDrag(
          n.id,
          sp.current.nx + (ev.clientX - sp.current.mx) / vp.zoom,
          sp.current.ny + (ev.clientY - sp.current.my) / vp.zoom,
        );
      };
      const mu = () => {
        dr.current = false;
        window.removeEventListener("mousemove", mm);
        window.removeEventListener("mouseup", mu);
        onClick(n.id);
      };
      window.addEventListener("mousemove", mm);
      window.addEventListener("mouseup", mu);
    },
    [n.id, n.x, n.y, vp.zoom, onDrag, onClick],
  );
  return (
    <div
      onMouseDown={md}
      style={{
        position: "absolute",
        left: n.x,
        top: n.y,
        width: NW,
        cursor: "grab",
        userSelect: "none",
      }}
    >
      {n.ty === "orch" && (
        <div
          style={{
            textAlign: "center",
            fontSize: 7,
            letterSpacing: 3,
            color: T.t3,
            fontFamily: T.m,
            marginBottom: 4,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 4,
          }}
        >
          {IC.hex({ size: 10, color: T.t3 })} ORCHESTRATOR
        </div>
      )}
      <div
        style={{
          background: sel ? T.bg2 : T.bg1,
          border: `1px solid ${sel ? "rgba(255,255,255,.2)" : T.bdr}`,
          borderRadius: 6,
          overflow: "hidden",
          boxShadow: sel
            ? "0 0 0 1px rgba(255,255,255,.1),0 8px 24px rgba(0,0,0,.7)"
            : "0 2px 8px rgba(0,0,0,.4)",
        }}
      >
        <div
          style={{
            padding: "7px 10px",
            borderBottom: `1px solid ${T.bdr2}`,
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <Dot
            color={sc}
            pulse={n.status === "active" || n.status === "blocked"}
          />
          <span
            style={{
              flex: 1,
              fontSize: 11,
              fontWeight: 600,
              color: T.t,
              fontFamily: T.s,
            }}
          >
            {n.label}
          </span>
          <Tag c={sc}>{n.status.toUpperCase()}</Tag>
        </div>
        <div style={{ padding: "7px 10px" }}>
          <div
            style={{
              fontSize: 8,
              color: T.t3,
              fontFamily: T.m,
              marginBottom: 5,
            }}
          >
            {n.sub}
          </div>
          {n.skills?.length > 0 && (
            <div
              style={{
                display: "flex",
                gap: 3,
                flexWrap: "wrap",
                marginBottom: 5,
              }}
            >
              {n.skills.map((s) => (
                <Sk key={s} n={s} />
              ))}
            </div>
          )}
          <div
            style={{
              fontSize: 9,
              color: T.t2,
              lineHeight: 1.5,
              marginBottom: 5,
              minHeight: 20,
              overflow: "hidden",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
            }}
          >
            {n.task}
          </div>
          {n.prog !== null && n.prog > 0 && (
            <div
              style={{
                height: 1.5,
                background: T.bg3,
                borderRadius: 1,
                overflow: "hidden",
                marginBottom: 4,
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${n.prog}%`,
                  background: sc,
                  transition: "width .8s ease",
                }}
              />
            </div>
          )}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: 7.5,
              color: T.t3,
              fontFamily: T.m,
            }}
          >
            <span>{n.tok} tok</span>
            <VB v={n.val} />
            {n.wt && (
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  color: T.t4,
                  fontSize: 7,
                }}
              >
                {IC.git({ size: 8, color: T.t4 })} wt
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Edg({ nodes, edges }) {
  const nm = {};
  nodes.forEach((n) => (nm[n.id] = n));
  return (
    <svg
      style={{
        position: "absolute",
        inset: 0,
        overflow: "visible",
        pointerEvents: "none",
      }}
    >
      {edges.map((e, i) => {
        const f = nm[e.f],
          t = nm[e.t];
        if (!f || !t) return null;
        const fx = f.x + NW / 2,
          fy = f.y + 140,
          tx = t.x + NW / 2,
          ty = t.y,
          cy = (fy + ty) / 2;
        return (
          <path
            key={i}
            d={`M${fx},${fy} C${fx},${cy} ${tx},${cy} ${tx},${ty}`}
            fill="none"
            stroke="rgba(255,255,255,.06)"
            strokeWidth={1}
            strokeDasharray="3 5"
          />
        );
      })}
    </svg>
  );
}

/* ═══════════ PROJECTS ═══════════ */
function ProjView({ onSel }) {
  const [sh, setSh] = useState(false);
  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        fontFamily: T.s,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          maxWidth: 700,
          margin: "0 auto",
          width: "100%",
          padding: "40px 24px",
          overflowY: "auto",
          flex: 1,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 32,
          }}
        >
          <div>
            <div style={{ fontSize: 22, fontWeight: 600, color: T.t }}>
              Projects
            </div>
            <div style={{ fontSize: 12, color: T.t3, marginTop: 4 }}>
              Each project links to a repo. Agents work inside.
            </div>
          </div>
          <button
            onClick={() => setSh(!sh)}
            style={{
              padding: "8px 16px",
              background: T.t,
              color: T.bg,
              border: "none",
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: T.s,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            {IC.plus({ size: 14, color: T.bg })} New Project
          </button>
        </div>
        {sh && (
          <div
            style={{
              padding: 20,
              background: T.bg1,
              border: `1px solid ${T.bdr}`,
              borderRadius: 8,
              marginBottom: 20,
            }}
          >
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: T.t,
                marginBottom: 16,
              }}
            >
              Create Project
            </div>
            <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
              {[
                { l: "Clone repo", ic: IC.git, a: true },
                { l: "Local dir", ic: IC.folder, a: false },
                { l: "Init new", ic: IC.plus, a: false },
              ].map((o) => (
                <button
                  key={o.l}
                  style={{
                    flex: 1,
                    padding: 10,
                    background: o.a ? T.bg3 : T.bg2,
                    border: `1px solid ${o.a ? "rgba(255,255,255,.15)" : T.bdr}`,
                    borderRadius: 6,
                    color: o.a ? T.t : T.t3,
                    fontSize: 11,
                    cursor: "pointer",
                    fontFamily: T.s,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                  }}
                >
                  {o.ic({ size: 13, color: o.a ? T.t : T.t3 })} {o.l}
                </button>
              ))}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <input
                placeholder="Project name"
                style={{
                  padding: "9px 12px",
                  background: T.bg,
                  border: `1px solid ${T.bdr}`,
                  borderRadius: 5,
                  color: T.t,
                  fontFamily: T.s,
                  fontSize: 12,
                  outline: "none",
                }}
              />
              <input
                placeholder="https://github.com/user/repo.git"
                style={{
                  padding: "9px 12px",
                  background: T.bg,
                  border: `1px solid ${T.bdr}`,
                  borderRadius: 5,
                  color: T.t,
                  fontFamily: T.m,
                  fontSize: 11,
                  outline: "none",
                }}
              />
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span
                  style={{
                    fontSize: 10,
                    color: T.t3,
                    fontFamily: T.m,
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  {IC.term({ size: 11, color: T.t3 })} CLI:
                </span>
                {["Vibe CLI", "Claude Code", "Codex"].map((a, i) => (
                  <span
                    key={a}
                    style={{
                      padding: "3px 8px",
                      borderRadius: 3,
                      background: i === 0 ? T.blu + "20" : T.bg2,
                      border: `1px solid ${i === 0 ? T.blu + "44" : T.bdr}`,
                      color: i === 0 ? T.blu : T.t3,
                      fontSize: 9,
                      fontFamily: T.m,
                      opacity: i === 0 ? 1 : 0.4,
                    }}
                  >
                    {a}
                    {i > 0 && " (soon)"}
                  </span>
                ))}
              </div>
              <button
                style={{
                  padding: 10,
                  background: T.t,
                  color: T.bg,
                  border: "none",
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: T.s,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                }}
              >
                {IC.git({ size: 14, color: T.bg })} Clone & Create
              </button>
            </div>
          </div>
        )}
        {PROJ.map((p) => (
          <div
            key={p.id}
            onClick={() => onSel(p)}
            style={{
              padding: "16px 18px",
              background: T.bg1,
              border: `1px solid ${T.bdr}`,
              borderRadius: 8,
              marginBottom: 10,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 14,
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.borderColor = "rgba(255,255,255,.2)")
            }
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = T.bdr)}
          >
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 8,
                background: p.st === "active" ? T.blu + "15" : T.bg2,
                border: `1px solid ${p.st === "active" ? T.blu + "33" : T.bdr}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {p.st === "active"
                ? IC.zap({ size: 16, color: T.blu })
                : IC.folder({ size: 16, color: T.t3 })}
            </div>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: T.t,
                  marginBottom: 2,
                }}
              >
                {p.name}
              </div>
              <div style={{ fontSize: 10, color: T.t3, fontFamily: T.m }}>
                {p.repo}
              </div>
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-end",
                gap: 4,
              }}
            >
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  fontSize: 9,
                  fontFamily: T.m,
                }}
              >
                <span
                  style={{
                    color: p.act > 0 ? T.blu : T.t3,
                    display: "flex",
                    alignItems: "center",
                    gap: 3,
                  }}
                >
                  {IC.bot({ size: 10, color: p.act > 0 ? T.blu : T.t3 })} {p.ag}
                </span>
                <span
                  style={{
                    color: T.t3,
                    display: "flex",
                    alignItems: "center",
                    gap: 3,
                  }}
                >
                  {IC.git({ size: 10, color: T.t3 })} {p.br}
                </span>
              </div>
              <span
                style={{
                  fontSize: 8.5,
                  color: T.t3,
                  fontFamily: T.m,
                  display: "flex",
                  alignItems: "center",
                  gap: 3,
                }}
              >
                {IC.clock({ size: 9, color: T.t3 })} {p.last}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════ ROOM ═══════════ */
function RoomView({ onLab }) {
  const [inp, setInp] = useState("");
  const [rt, setRt] = useState("arch");
  const [ec, setEc] = useState(null);
  const br = useRef(null);
  useEffect(() => {
    br.current?.scrollIntoView({ behavior: "smooth" });
  }, []);
  const rM = (m, i) => {
    if (m.role === "rep")
      return (
        <div key={i} style={{ marginBottom: 20 }}>
          <div
            style={{
              padding: "10px 12px",
              background: T.pur + "08",
              border: `1px solid ${T.pur}22`,
              borderRadius: 6,
            }}
          >
            <div
              style={{
                fontSize: 8,
                fontFamily: T.m,
                color: T.pur,
                letterSpacing: 1,
                marginBottom: 6,
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              {IC.spark({ size: 10, color: T.pur })} REPROMPT ENGINE
            </div>
            <div
              style={{
                fontSize: 10,
                color: T.t3,
                marginBottom: 6,
                textDecoration: "line-through",
              }}
            >
              {m.orig}
            </div>
            <div style={{ fontSize: 11.5, color: T.t, lineHeight: 1.55 }}>
              {m.ref}
            </div>
          </div>
          <div
            style={{
              fontSize: 8.5,
              color: T.t3,
              fontFamily: T.m,
              marginTop: 3,
            }}
          >
            {m.ts}
          </div>
        </div>
      );
    if (m.role === "val") {
      const c = m.st === "pass" ? T.grn : T.red;
      return (
        <div key={i} style={{ marginBottom: 16 }}>
          <div
            style={{
              padding: "8px 12px",
              background: c + "08",
              border: `1px solid ${c}22`,
              borderRadius: 6,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            {m.st === "pass"
              ? IC.shieldOk({ size: 16, color: c })
              : IC.shield({ size: 16, color: c })}
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: 8,
                  fontFamily: T.m,
                  color: c,
                  letterSpacing: 1,
                  fontWeight: 600,
                }}
              >
                GATE L{m.lv} · {m.agent.toUpperCase()}
              </div>
              <div style={{ fontSize: 10, color: T.t2, marginTop: 2 }}>
                {m.detail}
              </div>
            </div>
            <Tag c={c}>{m.st.toUpperCase()}</Tag>
          </div>
        </div>
      );
    }
    return (
      <div
        key={i}
        style={{
          marginBottom: 18,
          display: "flex",
          flexDirection: m.role === "dev" ? "row-reverse" : "row",
          gap: 8,
          alignItems: "flex-start",
        }}
      >
        <div
          style={{
            width: 24,
            height: 24,
            borderRadius: "50%",
            flexShrink: 0,
            background: m.role === "dev" ? T.bg3 : T.bg2,
            border: `1px solid ${T.bdr}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {m.role === "dev"
            ? IC.user({ size: 12, color: T.t3 })
            : m.role === "sys"
              ? IC.srv({ size: 11, color: T.t3 })
              : IC.hex({ size: 12, color: T.t2 })}
        </div>
        <div style={{ maxWidth: "78%" }}>
          <div
            style={{
              padding: "9px 12px",
              background: m.role === "dev" ? T.bg2 : T.bg1,
              border: `1px solid ${T.bdr}`,
              borderRadius:
                m.role === "dev" ? "8px 2px 8px 8px" : "2px 8px 8px 8px",
              fontSize: 12,
              color: T.t,
              lineHeight: 1.6,
              fontFamily: T.s,
              whiteSpace: "pre-wrap",
            }}
          >
            {m.text}
          </div>
          <div
            style={{
              fontSize: 8.5,
              color: T.t3,
              fontFamily: T.m,
              marginTop: 3,
              textAlign: m.role === "dev" ? "right" : "left",
            }}
          >
            {m.ts}
          </div>
        </div>
      </div>
    );
  };
  return (
    <div
      style={{ flex: 1, display: "flex", fontFamily: T.s, overflow: "hidden" }}
    >
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          maxWidth: 720,
          margin: "0 auto",
        }}
      >
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
          {MSGS.map(rM)}
          <div ref={br} />
        </div>
        <div
          style={{
            padding: "14px 24px",
            borderTop: `1px solid ${T.bdr}`,
            flexShrink: 0,
          }}
        >
          <div
            style={{
              display: "flex",
              gap: 8,
              alignItems: "flex-end",
              background: T.bg1,
              border: `1px solid ${T.bdr}`,
              borderRadius: 8,
              padding: "10px 12px",
            }}
          >
            <textarea
              value={inp}
              onChange={(e) => setInp(e.target.value)}
              placeholder="Describe what you want to build..."
              rows={2}
              style={{
                flex: 1,
                background: "transparent",
                border: "none",
                color: T.t,
                fontFamily: T.s,
                fontSize: 12.5,
                resize: "none",
                outline: "none",
                lineHeight: 1.55,
              }}
            />
            <button
              style={{
                width: 30,
                height: 30,
                borderRadius: 6,
                background: inp.trim() ? T.t : T.bg3,
                border: "none",
                cursor: inp.trim() ? "pointer" : "default",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              {IC.arrowUp({ size: 14, color: T.bg })}
            </button>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: 5,
              fontSize: 8.5,
              color: T.t3,
              fontFamily: T.m,
            }}
          >
            <span>Reprompt engine active</span>
            <span
              style={{
                color: T.pur,
                display: "flex",
                alignItems: "center",
                gap: 3,
              }}
            >
              {IC.spark({ size: 9, color: T.pur })} Mistral Small
            </span>
          </div>
        </div>
      </div>
      <div
        style={{
          width: 300,
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          borderLeft: `1px solid ${T.bdr}`,
        }}
      >
        <div
          style={{
            display: "flex",
            borderBottom: `1px solid ${T.bdr}`,
            flexShrink: 0,
          }}
        >
          {[
            { id: "arch", ic: IC.layers },
            { id: "mem", ic: IC.db },
            { id: "ctr", ic: IC.file },
            { id: "dag", ic: IC.net },
          ].map((tb) => (
            <button
              key={tb.id}
              onClick={() => setRt(tb.id)}
              style={{
                flex: 1,
                padding: "10px 0",
                background: "transparent",
                border: "none",
                borderBottom:
                  rt === tb.id
                    ? `1.5px solid ${T.t}`
                    : "1.5px solid transparent",
                color: rt === tb.id ? T.t : T.t3,
                fontSize: 8.5,
                fontWeight: rt === tb.id ? 600 : 400,
                cursor: "pointer",
                fontFamily: T.m,
                textTransform: "uppercase",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 4,
              }}
            >
              {tb.ic({ size: 11, color: rt === tb.id ? T.t : T.t3 })} {tb.id}
            </button>
          ))}
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: 14 }}>
          {rt === "arch" && (
            <>
              <SH>Stack</SH>
              {[
                ["FE", "React 18+TS+Zustand+Tailwind"],
                ["BE", "FastAPI+PostgreSQL+Alembic"],
                ["Auth", "OAuth2+JWT refresh"],
                ["CLI", "Vibe CLI (Devstral 2)"],
              ].map(([k, v]) => (
                <div
                  key={k}
                  style={{
                    display: "flex",
                    gap: 8,
                    marginBottom: 5,
                    fontSize: 9.5,
                    fontFamily: T.m,
                  }}
                >
                  <span style={{ color: T.t3, width: 35, flexShrink: 0 }}>
                    {k}
                  </span>
                  <span style={{ color: T.t2 }}>{v}</span>
                </div>
              ))}
              <SH>Agent Tree</SH>
              <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                {[
                  { l: "Orchestrator", s: "active", d: 0, e: "Mistral Large" },
                  { l: "Frontend", s: "active", d: 1, e: "61%" },
                  { l: "fe/auth-ui", s: "done", d: 2, e: "merged" },
                  { l: "fe/dashboard", s: "active", d: 2, e: "43%" },
                  { l: "fe/responsive", s: "blocked", d: 2 },
                  { l: "Backend", s: "review", d: 1, e: "89%" },
                  { l: "be/auth-api", s: "done", d: 2, e: "merged" },
                  { l: "be/db-schema", s: "active", d: 2, e: "58%" },
                  { l: "Security", s: "idle", d: 1, e: "standby" },
                ].map((r, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                      paddingLeft: r.d * 14,
                      fontSize: 9.5,
                      fontFamily: T.m,
                    }}
                  >
                    <StI s={r.s} sz={10} />
                    <span style={{ color: SC[r.s] || T.t3 }}>{r.l}</span>
                    {r.e && (
                      <span style={{ color: T.t3, fontSize: 8 }}>{r.e}</span>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
          {rt === "mem" && (
            <>
              <SH>Global Memory</SH>
              {MEM.map((m, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    gap: 6,
                    marginBottom: 5,
                    fontSize: 9.5,
                    fontFamily: T.m,
                    alignItems: "flex-start",
                  }}
                >
                  {IC.minus({ size: 8, color: T.t3, style: { marginTop: 3 } })}
                  <span style={{ color: T.t2 }}>{m}</span>
                </div>
              ))}
              <SH>Agent Memories</SH>
              {["frontend.md", "backend.md", "security.md"].map((f) => (
                <div
                  key={f}
                  style={{
                    padding: "6px 8px",
                    marginBottom: 4,
                    background: T.bg,
                    border: `1px solid ${T.bdr}`,
                    borderRadius: 3,
                    fontSize: 9,
                    fontFamily: T.m,
                    color: T.t3,
                  }}
                >
                  .alchemistral/agents/{f}
                </div>
              ))}
            </>
          )}
          {rt === "ctr" && (
            <>
              <SH>Contracts</SH>
              <div
                style={{
                  fontSize: 9,
                  color: T.t3,
                  fontFamily: T.m,
                  marginBottom: 12,
                  lineHeight: 1.6,
                }}
              >
                Agents write interfaces. Dependents read first.
              </div>
              {CTRS.map((c, i) => (
                <div key={i} style={{ marginBottom: 12 }}>
                  <div
                    onClick={() => setEc(ec === i ? null : i)}
                    style={{
                      padding: "8px 10px",
                      background: T.bg1,
                      border: `1px solid ${T.bdr}`,
                      borderRadius: 4,
                      cursor: "pointer",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <span
                        style={{
                          fontSize: 10,
                          fontFamily: T.m,
                          color: T.cyn,
                          fontWeight: 500,
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        {IC.file({ size: 11, color: T.cyn })} {c.f}
                      </span>
                      <span
                        style={{ fontSize: 8, color: T.t3, fontFamily: T.m }}
                      >
                        {c.ago}
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: 8,
                        color: T.t3,
                        fontFamily: T.m,
                        marginTop: 3,
                      }}
                    >
                      by: <span style={{ color: T.t2 }}>{c.by}</span> · readers:{" "}
                      <span style={{ color: T.t2 }}>{c.rd.join(", ")}</span>
                    </div>
                  </div>
                  {ec === i && (
                    <pre
                      style={{
                        padding: "8px 10px",
                        background: T.bg,
                        border: `1px solid ${T.bdr}`,
                        borderTop: "none",
                        borderRadius: "0 0 4px 4px",
                        fontSize: 8.5,
                        fontFamily: T.m,
                        color: T.t2,
                        lineHeight: 1.5,
                        overflow: "auto",
                        margin: 0,
                      }}
                    >
                      {c.code}
                    </pre>
                  )}
                </div>
              ))}
            </>
          )}
          {rt === "dag" && (
            <>
              <SH>DAG</SH>
              {DAG.map((t) => {
                const c = SC[t.st] || T.t3;
                return (
                  <div
                    key={t.id}
                    style={{
                      padding: "7px 10px",
                      marginBottom: 4,
                      background: T.bg1,
                      border: `1px solid ${T.bdr}`,
                      borderRadius: 4,
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <StI s={t.st} sz={11} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 10, color: T.t }}>{t.l}</div>
                      <div
                        style={{
                          fontSize: 7.5,
                          color: T.t3,
                          fontFamily: T.m,
                          marginTop: 1,
                        }}
                      >
                        {t.ag}
                        {t.d.length > 0 && ` ← ${t.d.join(", ")}`}
                      </div>
                    </div>
                    <Tag c={c}>{t.st.toUpperCase()}</Tag>
                  </div>
                );
              })}
            </>
          )}
        </div>
        <div
          style={{
            padding: "12px 14px",
            borderTop: `1px solid ${T.bdr}`,
            flexShrink: 0,
          }}
        >
          <button
            onClick={onLab}
            style={{
              width: "100%",
              padding: 10,
              background: T.t,
              color: T.bg,
              border: "none",
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: T.s,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
            }}
          >
            {IC.wflow({ size: 14, color: T.bg })} Enter the Lab
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════ LAB ═══════════ */
function LabView({ onRoom }) {
  const [nodes, setN] = useState(NODES);
  const [sel, setSel] = useState(null);
  const [vp, setVp] = useState({ x: -20, y: -20, z: 0.85 });
  const [pan, setPan] = useState(false);
  const [lm, setLm] = useState({ x: 0, y: 0 });
  const [it, setIt] = useState("info");
  const ref = useRef(null);
  useEffect(() => {
    const iv = setInterval(() => {
      setN((p) =>
        p.map((n) =>
          n.status === "active" && n.prog !== null
            ? { ...n, prog: Math.min(n.prog + Math.random() * 1.2, 97) }
            : n,
        ),
      );
    }, 1100);
    return () => clearInterval(iv);
  }, []);
  const ow = useCallback((e) => {
    e.preventDefault();
    setVp((v) => ({
      ...v,
      z: Math.max(0.2, Math.min(2.5, v.z * (e.deltaY > 0 ? 0.92 : 1.08))),
    }));
  }, []);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.addEventListener("wheel", ow, { passive: false });
    return () => el.removeEventListener("wheel", ow);
  }, [ow]);
  const sn = nodes.find((n) => n.id === sel);
  return (
    <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
      <div
        ref={ref}
        onMouseDown={(e) => {
          if (e.target === ref.current || e.target.closest("[data-bg]")) {
            setPan(true);
            setLm({ x: e.clientX, y: e.clientY });
            setSel(null);
          }
        }}
        onMouseMove={(e) => {
          if (!pan) return;
          setVp((v) => ({
            ...v,
            x: v.x + (e.clientX - lm.x) / v.z,
            y: v.y + (e.clientY - lm.y) / v.z,
          }));
          setLm({ x: e.clientX, y: e.clientY });
        }}
        onMouseUp={() => setPan(false)}
        onMouseLeave={() => setPan(false)}
        style={{
          flex: 1,
          position: "relative",
          overflow: "hidden",
          cursor: pan ? "grabbing" : "grab",
          backgroundImage:
            "radial-gradient(circle,rgba(255,255,255,.025) 1px,transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      >
        <div
          data-bg="1"
          style={{
            position: "absolute",
            inset: 0,
            transform: `scale(${vp.z}) translate(${vp.x}px,${vp.y}px)`,
            transformOrigin: "0 0",
          }}
        >
          <Edg nodes={nodes} edges={EDGES} />
          {nodes.map((n) => (
            <CNode
              key={n.id}
              n={n}
              sel={sel === n.id}
              onClick={(id) => setSel(id)}
              onDrag={(id, x, y) =>
                setN((p) =>
                  p.map((nd) => (nd.id === id ? { ...nd, x, y } : nd)),
                )
              }
              vp={{ zoom: vp.z }}
            />
          ))}
        </div>
        <div
          style={{
            position: "absolute",
            bottom: 16,
            right: 16,
            width: 140,
            height: 70,
            background: "rgba(10,10,10,.95)",
            border: `1px solid ${T.bdr}`,
            borderRadius: 4,
            overflow: "hidden",
            zIndex: 40,
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 3,
              left: 5,
              fontSize: 6,
              letterSpacing: 2,
              color: T.t3,
              fontFamily: T.m,
            }}
          >
            MAP
          </div>
          {nodes.map((n) => (
            <div
              key={n.id}
              style={{
                position: "absolute",
                left: n.x * 0.08 + 4,
                top: n.y * 0.08 + 12,
                width: NW * 0.08,
                height: 4,
                background: SC[n.status] || T.bg3,
                borderRadius: 1,
                opacity: 0.6,
              }}
            />
          ))}
        </div>
        <div
          style={{
            position: "absolute",
            bottom: 16,
            left: 16,
            display: "flex",
            gap: 4,
            zIndex: 40,
          }}
        >
          {[
            {
              ic: IC.minus,
              fn: () => setVp((v) => ({ ...v, z: Math.max(0.2, v.z * 0.8) })),
            },
            { ic: IC.max, fn: () => setVp({ x: -20, y: -20, z: 0.85 }) },
            {
              ic: IC.plus,
              fn: () => setVp((v) => ({ ...v, z: Math.min(2.5, v.z * 1.2) })),
            },
          ].map((b, i) => (
            <button
              key={i}
              onClick={b.fn}
              style={{
                width: 28,
                height: 28,
                background: T.bg1,
                border: `1px solid ${T.bdr}`,
                borderRadius: 5,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {b.ic({ size: 13, color: T.t2 })}
            </button>
          ))}
          <div
            style={{
              padding: "0 8px",
              height: 28,
              background: T.bg1,
              border: `1px solid ${T.bdr}`,
              borderRadius: 5,
              display: "flex",
              alignItems: "center",
              fontSize: 9,
              color: T.t3,
              fontFamily: T.m,
            }}
          >
            {Math.round(vp.z * 100)}%
          </div>
        </div>
      </div>
      {/* Inspector */}
      <div
        style={{
          width: 290,
          background: T.bg1,
          borderLeft: `1px solid ${T.bdr}`,
          display: "flex",
          flexDirection: "column",
          fontFamily: T.s,
          flexShrink: 0,
        }}
      >
        <div
          style={{
            padding: "8px 14px",
            borderBottom: `1px solid ${T.bdr}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
          }}
        >
          <button
            onClick={onRoom}
            style={{
              background: "transparent",
              border: "none",
              color: T.t3,
              cursor: "pointer",
              fontSize: 10,
              fontFamily: T.m,
              padding: 0,
              display: "flex",
              alignItems: "center",
              gap: 3,
            }}
          >
            {IC.arrowL({ size: 12, color: T.t3 })} Room
          </button>
          <span
            style={{
              fontSize: 8,
              color: T.t3,
              fontFamily: T.m,
              letterSpacing: 1,
            }}
          >
            INSPECTOR
          </span>
        </div>
        {sn ? (
          <>
            <div
              style={{
                display: "flex",
                borderBottom: `1px solid ${T.bdr}`,
                flexShrink: 0,
              }}
            >
              {[
                { id: "info", ic: IC.bot },
                { id: "skills", ic: IC.layers },
                { id: "git", ic: IC.git },
                { id: "stream", ic: IC.term },
              ].map((tb) => (
                <button
                  key={tb.id}
                  onClick={() => setIt(tb.id)}
                  style={{
                    flex: 1,
                    padding: "8px 0",
                    background: "transparent",
                    border: "none",
                    borderBottom:
                      it === tb.id
                        ? `1.5px solid ${T.t}`
                        : "1.5px solid transparent",
                    color: it === tb.id ? T.t : T.t3,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 3,
                    fontSize: 8,
                    fontFamily: T.m,
                    textTransform: "uppercase",
                  }}
                >
                  {tb.ic({ size: 10, color: it === tb.id ? T.t : T.t3 })}{" "}
                  {tb.id}
                </button>
              ))}
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: "12px 14px" }}>
              {it === "info" && (
                <>
                  <div
                    style={{
                      fontSize: 8.5,
                      fontWeight: 600,
                      letterSpacing: 2,
                      color: SC[sn.status],
                      fontFamily: T.m,
                      marginBottom: 10,
                      textTransform: "uppercase",
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <StI s={sn.status} sz={11} />{" "}
                    {sn.ty === "orch"
                      ? "ORCHESTRATOR"
                      : sn.ty === "parent"
                        ? "PARENT AGENT"
                        : sn.ty === "sec"
                          ? "SECURITY"
                          : "CHILD"}
                  </div>
                  <div
                    style={{
                      fontSize: 15,
                      fontWeight: 600,
                      color: T.t,
                      marginBottom: 3,
                    }}
                  >
                    {sn.label}
                  </div>
                  <div
                    style={{
                      fontSize: 9,
                      color: T.t3,
                      fontFamily: T.m,
                      marginBottom: 12,
                    }}
                  >
                    {sn.sub}
                  </div>
                  <div
                    style={{
                      padding: "9px 10px",
                      background: T.bg,
                      border: `1px solid ${T.bdr}`,
                      borderRadius: 4,
                      fontSize: 10.5,
                      color: T.t2,
                      lineHeight: 1.6,
                      marginBottom: 12,
                    }}
                  >
                    {sn.task}
                  </div>
                  {[
                    {
                      k: "Status",
                      v: sn.status.toUpperCase(),
                      c: SC[sn.status],
                    },
                    { k: "Tokens", v: sn.tok },
                    { k: "Branch", v: sn.branch || "—" },
                    { k: "Worktree", v: sn.wt || "—" },
                    { k: "Children", v: String(sn.ch?.length || 0) },
                  ].map(({ k, v, c }) => (
                    <div
                      key={k}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        padding: "6px 0",
                        borderBottom: `1px solid ${T.bdr2}`,
                        fontSize: 10,
                        fontFamily: T.m,
                      }}
                    >
                      <span style={{ color: T.t3 }}>{k}</span>
                      <span
                        style={{
                          color: c || T.t,
                          fontWeight: 500,
                          fontSize: 9,
                          maxWidth: 155,
                          textAlign: "right",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {v}
                      </span>
                    </div>
                  ))}
                  {sn.val && (
                    <>
                      <SH>Validation Gate</SH>
                      <div
                        style={{
                          padding: "8px 10px",
                          background: T.bg,
                          border: `1px solid ${sn.val.st === "pass" ? T.grn + "33" : T.bdr}`,
                          borderRadius: 4,
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: 4,
                          }}
                        >
                          <span
                            style={{
                              fontSize: 9,
                              fontFamily: T.m,
                              color: T.t2,
                              display: "flex",
                              alignItems: "center",
                              gap: 3,
                            }}
                          >
                            {IC.shield({ size: 10, color: T.t2 })} Level{" "}
                            {sn.val.lv}
                          </span>
                          <Tag
                            c={
                              sn.val.st === "pass"
                                ? T.grn
                                : sn.val.st === "running"
                                  ? T.amb
                                  : T.t3
                            }
                          >
                            {sn.val.st.toUpperCase()}
                          </Tag>
                        </div>
                        <div
                          style={{
                            fontSize: 8.5,
                            fontFamily: T.m,
                            color: T.t3,
                            lineHeight: 1.5,
                          }}
                        >
                          {sn.val.r}
                        </div>
                      </div>
                    </>
                  )}
                  {sn.prog !== null && (
                    <div style={{ marginTop: 12 }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          fontSize: 8.5,
                          color: T.t3,
                          fontFamily: T.m,
                          marginBottom: 4,
                        }}
                      >
                        <span>PROGRESS</span>
                        <span>{Math.round(sn.prog)}%</span>
                      </div>
                      <div
                        style={{
                          height: 2,
                          background: T.bg3,
                          borderRadius: 1,
                        }}
                      >
                        <div
                          style={{
                            height: "100%",
                            width: `${sn.prog}%`,
                            background: SC[sn.status],
                            borderRadius: 1,
                            transition: "width .8s ease",
                          }}
                        />
                      </div>
                    </div>
                  )}
                </>
              )}
              {it === "skills" && (
                <>
                  <SH>Attached</SH>
                  {(sn.skills || []).length > 0 ? (
                    sn.skills.map((s) => (
                      <div
                        key={s}
                        style={{
                          padding: "8px 10px",
                          marginBottom: 4,
                          background: T.bg,
                          border: `1px solid ${T.cyn}15`,
                          borderRadius: 4,
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                          }}
                        >
                          <Sk n={s} />
                          <span style={{ fontSize: 9.5, color: T.t2 }}>
                            context
                          </span>
                        </div>
                        <button
                          style={{
                            background: "transparent",
                            border: "none",
                            cursor: "pointer",
                            display: "flex",
                          }}
                        >
                          {IC.x({ size: 12, color: T.t3 })}
                        </button>
                      </div>
                    ))
                  ) : (
                    <div style={{ fontSize: 10, color: T.t3, fontFamily: T.m }}>
                      None
                    </div>
                  )}
                  <SH>Available</SH>
                  {["Stripe", "Figma", "Docker", "Security"].map((s) => (
                    <div
                      key={s}
                      style={{
                        padding: "6px 10px",
                        marginBottom: 4,
                        background: T.bg,
                        border: `1px solid ${T.bdr}`,
                        borderRadius: 4,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <span
                        style={{ fontSize: 9.5, color: T.t3, fontFamily: T.m }}
                      >
                        {s}Skill
                      </span>
                      <button
                        style={{
                          padding: "2px 8px",
                          background: T.bg2,
                          border: `1px solid ${T.bdr}`,
                          borderRadius: 3,
                          color: T.t2,
                          cursor: "pointer",
                          fontSize: 8,
                          fontFamily: T.m,
                          display: "flex",
                          alignItems: "center",
                          gap: 3,
                        }}
                      >
                        {IC.plus({ size: 9, color: T.t2 })} Add
                      </button>
                    </div>
                  ))}
                </>
              )}
              {it === "git" && (
                <>
                  <SH>Worktree</SH>
                  {sn.wt ? (
                    <div
                      style={{
                        padding: 10,
                        background: T.bg,
                        border: `1px solid ${T.bdr}`,
                        borderRadius: 4,
                        fontFamily: T.m,
                        fontSize: 9,
                        color: T.t2,
                        lineHeight: 1.8,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        {IC.folder({ size: 10, color: T.t3 })} path: {sn.wt}
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        {IC.git({ size: 10, color: T.blu })} branch:{" "}
                        <span style={{ color: T.blu }}>{sn.branch}</span>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        {IC.chkC({ size: 10, color: T.grn })} isolated
                      </div>
                    </div>
                  ) : (
                    <div style={{ fontSize: 10, color: T.t3, fontFamily: T.m }}>
                      No worktree
                    </div>
                  )}
                  <SH>All Worktrees</SH>
                  {WT.map((w, i) => (
                    <div
                      key={i}
                      style={{
                        padding: "5px 8px",
                        marginBottom: 3,
                        background: w.ag === sn.id ? T.bg2 : T.bg,
                        border: `1px solid ${w.ag === sn.id ? "rgba(255,255,255,.12)" : T.bdr}`,
                        borderRadius: 3,
                        fontSize: 8,
                        fontFamily: T.m,
                        display: "flex",
                        alignItems: "center",
                        gap: 5,
                      }}
                    >
                      {IC.git({
                        size: 9,
                        color: w.st.includes("merged") ? T.grn : T.t3,
                      })}
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            color: w.st.includes("merged") ? T.grn : T.t2,
                          }}
                        >
                          {w.br}
                        </div>
                        <div style={{ color: T.t3, marginTop: 1 }}>{w.st}</div>
                      </div>
                    </div>
                  ))}
                </>
              )}
              {it === "stream" && (
                <>
                  <SH>Live Output</SH>
                  <div
                    style={{
                      padding: 10,
                      background: T.bg,
                      border: `1px solid ${T.bdr}`,
                      borderRadius: 4,
                      fontFamily: T.m,
                      fontSize: 8.5,
                      color: T.t3,
                      lineHeight: 1.8,
                      minHeight: 200,
                    }}
                  >
                    <div style={{ color: T.grn }}>
                      $ vibe --prompt "..." --auto-approve
                    </div>
                    <div>Reading project structure...</div>
                    <div>Found .alchemistral/contracts/api-schema.json</div>
                    <div style={{ color: T.cyn }}>
                      Creating src/components/AuthForm.tsx
                    </div>
                    <div style={{ color: T.t2 }}>
                      {"const { useState } = React"}
                    </div>
                    <div style={{ color: T.t2 }}>
                      {"const auth = useAuthStore()"}
                    </div>
                    <div>...</div>
                    <div style={{ color: T.grn }}>$ npm run build</div>
                    <div style={{ color: T.grn }}>Build passed</div>
                    <div style={{ color: T.grn }}>$ npm test — 8/8</div>
                    <div
                      style={{
                        color: T.amb,
                        marginTop: 6,
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      {IC.shieldOk({ size: 10, color: T.amb })} Self-test PASS
                    </div>
                  </div>
                </>
              )}
            </div>
            <div
              style={{
                padding: "10px 14px",
                borderTop: `1px solid ${T.bdr}`,
                flexShrink: 0,
                display: "flex",
                flexDirection: "column",
                gap: 5,
              }}
            >
              <button
                style={{
                  width: "100%",
                  padding: 8,
                  background: "transparent",
                  border: `1px solid ${T.amb}33`,
                  borderRadius: 5,
                  color: T.amb,
                  fontSize: 10,
                  fontWeight: 500,
                  cursor: "pointer",
                  fontFamily: T.s,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 5,
                }}
              >
                {IC.scan({ size: 13, color: T.amb })} Security Scan
              </button>
              {sn.status === "done" && (
                <button
                  style={{
                    width: "100%",
                    padding: 8,
                    background: T.grn + "15",
                    border: `1px solid ${T.grn}33`,
                    borderRadius: 5,
                    color: T.grn,
                    fontSize: 10,
                    fontWeight: 500,
                    cursor: "pointer",
                    fontFamily: T.s,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 5,
                  }}
                >
                  {IC.merge({ size: 13, color: T.grn })} Approve & Merge
                </button>
              )}
              {sn.ty === "parent" && (
                <button
                  style={{
                    width: "100%",
                    padding: 8,
                    background: "transparent",
                    border: `1px solid ${T.bdr}`,
                    borderRadius: 5,
                    color: T.t2,
                    fontSize: 10,
                    fontWeight: 500,
                    cursor: "pointer",
                    fontFamily: T.s,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 5,
                  }}
                >
                  {IC.bot({ size: 13, color: T.t2 })} Spawn Child
                </button>
              )}
            </div>
          </>
        ) : (
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: 20,
            }}
          >
            {IC.scan({ size: 24, color: T.t3 })}
            <div
              style={{
                fontSize: 11,
                color: T.t3,
                fontFamily: T.m,
                textAlign: "center",
                marginTop: 8,
                marginBottom: 20,
              }}
            >
              Select a node
            </div>
            <div
              style={{
                width: "100%",
                border: `1px solid ${T.bdr}`,
                borderRadius: 5,
                overflow: "hidden",
              }}
            >
              {[
                { k: "Agents", v: NODES.length, ic: IC.bot },
                {
                  k: "Active",
                  v: NODES.filter((n) => n.status === "active").length,
                  c: T.blu,
                  ic: IC.load,
                },
                {
                  k: "Review",
                  v: NODES.filter((n) => n.status === "review").length,
                  c: T.amb,
                  ic: IC.eye,
                },
                {
                  k: "Done",
                  v: NODES.filter((n) => n.status === "done").length,
                  c: T.grn,
                  ic: IC.chkC,
                },
                {
                  k: "Blocked",
                  v: NODES.filter((n) => n.status === "blocked").length,
                  c: T.red,
                  ic: IC.ban,
                },
                { k: "Worktrees", v: WT.length, c: T.pur, ic: IC.git },
              ].map(({ k, v, c, ic: I }, i) => (
                <div
                  key={k}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "8px 12px",
                    borderBottom: i < 5 ? `1px solid ${T.bdr2}` : "none",
                    fontSize: 10,
                    fontFamily: T.m,
                  }}
                >
                  <span
                    style={{
                      color: T.t3,
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                    }}
                  >
                    {I({ size: 11, color: c || T.t3 })} {k}
                  </span>
                  <span style={{ color: c || T.t, fontWeight: 600 }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════ APP ═══════════ */
export default function App() {
  const [view, setV] = useState("proj");
  const [proj, setP] = useState(null);
  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        background: T.bg,
        color: T.t,
        overflow: "hidden",
        fontFamily: T.s,
      }}
    >
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Geist+Mono:wght@300;400;500;600;700&family=Geist:wght@300;400;500;600&display=swap');*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}::-webkit-scrollbar{width:3px}::-webkit-scrollbar-thumb{background:${T.bdr};border-radius:2px}textarea,input{color-scheme:dark}textarea::placeholder,input::placeholder{color:${T.t3}}@keyframes pulse{0%,100%{transform:scale(1);opacity:.3}50%{transform:scale(2.2);opacity:0}}`}</style>
      <div
        style={{
          height: 42,
          display: "flex",
          alignItems: "center",
          padding: "0 16px",
          borderBottom: `1px solid ${T.bdr}`,
          background: T.bg,
          flexShrink: 0,
          zIndex: 100,
        }}
      >
        <div
          onClick={() => {
            setV("proj");
            setP(null);
          }}
          style={{
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: 2.5,
            color: T.t,
            fontFamily: T.m,
            marginRight: 16,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          {IC.hex({ size: 16, color: T.t })} ALCHEMISTRAL
        </div>
        <div
          style={{ width: 1, height: 16, background: T.bdr, marginRight: 12 }}
        />
        {proj ? (
          <>
            {["room", "lab"].map((tb) => (
              <button
                key={tb}
                onClick={() => setV(tb)}
                style={{
                  padding: "0 12px",
                  height: 42,
                  background: "transparent",
                  border: "none",
                  borderBottom:
                    view === tb
                      ? `1.5px solid ${T.t}`
                      : "1.5px solid transparent",
                  color: view === tb ? T.t : T.t3,
                  fontSize: 11,
                  fontWeight: view === tb ? 600 : 400,
                  cursor: "pointer",
                  fontFamily: T.s,
                  textTransform: "capitalize",
                }}
              >
                {tb === "room" ? "Room" : "Lab"}
              </button>
            ))}
            <div
              style={{
                width: 1,
                height: 16,
                background: T.bdr,
                margin: "0 12px",
              }}
            />
            <div
              style={{
                fontSize: 10,
                color: T.t2,
                fontFamily: T.m,
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              {IC.folder({ size: 11, color: T.t3 })} {proj.name}
            </div>
            <span
              style={{
                fontSize: 8,
                color: T.t3,
                fontFamily: T.m,
                marginLeft: 8,
                padding: "1px 5px",
                border: `1px solid ${T.bdr}`,
                borderRadius: 2,
                display: "flex",
                alignItems: "center",
                gap: 3,
              }}
            >
              {IC.term({ size: 8, color: T.t3 })} Vibe CLI
            </span>
          </>
        ) : (
          <span style={{ fontSize: 10, color: T.t3, fontFamily: T.m }}>
            SELECT A PROJECT
          </span>
        )}
        <div
          style={{
            marginLeft: "auto",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          {proj && (
            <>
              {[
                { l: `${NODES.length} agents`, ic: IC.bot },
                {
                  l: `${NODES.filter((n) => n.status === "active").length} active`,
                  c: T.blu,
                  ic: IC.load,
                },
                { l: `${WT.length} worktrees`, c: T.pur, ic: IC.git },
              ].map((s) => (
                <span
                  key={s.l}
                  style={{
                    fontSize: 9,
                    color: s.c || T.t3,
                    fontFamily: T.m,
                    display: "flex",
                    alignItems: "center",
                    gap: 3,
                  }}
                >
                  {s.ic({ size: 10, color: s.c || T.t3 })} {s.l}
                </span>
              ))}
              <div style={{ width: 1, height: 16, background: T.bdr }} />
            </>
          )}
          <div
            style={{
              padding: "3px 8px",
              borderRadius: 3,
              fontSize: 8,
              fontFamily: T.m,
              fontWeight: 600,
              letterSpacing: 0.8,
              background: T.grn + "15",
              border: `1px solid ${T.grn}33`,
              color: T.grn,
              display: "flex",
              alignItems: "center",
              gap: 3,
            }}
          >
            {IC.play({ size: 8, color: T.grn })} DEMO
          </div>
          <div
            style={{
              width: 24,
              height: 24,
              borderRadius: "50%",
              background: T.bg2,
              border: `1px solid ${T.bdr}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {IC.user({ size: 12, color: T.t3 })}
          </div>
        </div>
      </div>
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {!proj || view === "proj" ? (
          <ProjView
            onSel={(p) => {
              setP(p);
              setV("room");
            }}
          />
        ) : view === "room" ? (
          <RoomView onLab={() => setV("lab")} />
        ) : (
          <LabView onRoom={() => setV("room")} />
        )}
      </div>
    </div>
  );
}
