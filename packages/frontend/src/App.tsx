import { useState, useEffect, useCallback, useRef } from "react";
import {
  FolderOpen,
  Terminal,
  Bot,
  Loader2,
  GitBranch,
  Play,
  User,
  Settings,
  X,
  Eye,
  EyeOff,
  Sun,
  Moon,
} from "lucide-react";
import logoUrl from "../assets/alchimistral-logo.svg";
import { useTheme } from "./hooks/useTheme";
import { getKeys, updateKeys } from "./api/settings";
import { listAgents, type AgentInfo } from "./api/agents";
import { useWebSocket } from "./hooks/useWebSocket";
import Dot from "./components/Dot";
import AgentBar from "./components/AgentBar";
import Welcome from "./views/Welcome";
import Projects from "./views/Projects";
import Room, { type ChatMsg } from "./views/Room";
import Lab from "./views/Lab";
import type { ApiProject } from "./api/projects";
import type { OrchestratorTask } from "./api/orchestrator";

type View = "welcome" | "projects" | "room" | "lab";

function SettingsModal({ onClose }: { onClose: () => void }) {
  const { theme, mode, toggle } = useTheme();
  const [key, setKey] = useState("");
  const [masked, setMasked] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getKeys()
      .then((k) => setMasked(k.mistral_api_key))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  const handleSave = async () => {
    if (!key.trim()) return;
    setSaving(true);
    try {
      await updateKeys({ mistral_api_key: key });
      setMasked(key.slice(0, 8) + "...");
      setKey("");
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      // ignore
    }
    setSaving(false);
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{ zIndex: 1000, background: "rgba(0,0,0,.6)" }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 480,
          background: theme.bg1,
          border: `1px solid ${theme.bdr}`,
          borderRadius: 8,
          padding: 24,
        }}
      >
        <div className="flex items-center justify-between" style={{ marginBottom: 20 }}>
          <span className="font-mono" style={{ fontSize: 12, fontWeight: 600, color: theme.t, letterSpacing: 1 }}>
            SETTINGS
          </span>
          <button
            onClick={onClose}
            style={{ background: "transparent", border: "none", cursor: "pointer" }}
          >
            <X size={16} style={{ color: theme.t3 }} />
          </button>
        </div>

        {/* Theme toggle */}
        <div className="font-mono" style={{ fontSize: 9, color: theme.t3, letterSpacing: 1.5, marginBottom: 8 }}>
          APPEARANCE
        </div>
        <div
          className="flex items-center justify-between"
          style={{
            padding: "10px 12px",
            background: theme.bg,
            border: `1px solid ${theme.bdr}`,
            borderRadius: 6,
            marginBottom: 20,
          }}
        >
          <span className="font-mono" style={{ fontSize: 10, color: theme.t2 }}>
            Theme
          </span>
          <button
            onClick={toggle}
            className="flex items-center gap-2 font-mono"
            style={{
              padding: "4px 12px",
              background: theme.bg2,
              border: `1px solid ${theme.bdr}`,
              borderRadius: 4,
              color: theme.t,
              fontSize: 10,
              cursor: "pointer",
            }}
          >
            {mode === "dark" ? <Moon size={12} /> : <Sun size={12} />}
            {mode === "dark" ? "Dark" : "Light"}
          </button>
        </div>

        {/* CLI Status */}
        <div className="font-mono" style={{ fontSize: 9, color: theme.t3, letterSpacing: 1.5, marginBottom: 8 }}>
          CLI ADAPTER
        </div>
        <div
          className="flex items-center gap-3"
          style={{
            padding: "10px 12px",
            background: theme.bg,
            border: `1px solid ${theme.bdr}`,
            borderRadius: 6,
            marginBottom: 20,
          }}
        >
          <Terminal size={14} style={{ color: theme.t3 }} />
          <div>
            <div className="font-mono" style={{ fontSize: 10, color: theme.t }}>Vibe CLI</div>
            <div className="font-mono" style={{ fontSize: 8, color: theme.t3 }}>Devstral 2 (123B)</div>
          </div>
          <div className="ml-auto flex items-center gap-1">
            <Dot color={theme.grn} size={5} />
            <span className="font-mono" style={{ fontSize: 8, color: theme.grn }}>READY</span>
          </div>
        </div>

        {/* API Keys */}
        <div className="font-mono" style={{ fontSize: 9, color: theme.t3, letterSpacing: 1.5, marginBottom: 8 }}>
          API KEYS
        </div>

        <div style={{ marginBottom: 16 }}>
          <label className="font-mono" style={{ fontSize: 10, color: theme.t2, display: "block", marginBottom: 4 }}>
            Mistral API Key
          </label>
          {masked && !key && (
            <div className="font-mono" style={{ fontSize: 9, color: theme.t3, marginBottom: 4 }}>
              Current: {masked}
            </div>
          )}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <input
                type={showKey ? "text" : "password"}
                value={key}
                onChange={(e) => setKey(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleSave(); }}
                placeholder="Enter new key..."
                className="font-mono w-full"
                style={{
                  background: theme.bg,
                  border: `1px solid ${theme.bdr}`,
                  borderRadius: 4,
                  padding: "8px 32px 8px 10px",
                  color: theme.t,
                  fontSize: 11,
                  outline: "none",
                }}
              />
              <button
                onClick={() => setShowKey(!showKey)}
                className="absolute"
                style={{
                  right: 8,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                {showKey ? (
                  <EyeOff size={13} style={{ color: theme.t3 }} />
                ) : (
                  <Eye size={13} style={{ color: theme.t3 }} />
                )}
              </button>
            </div>
            <button
              onClick={handleSave}
              disabled={saving || !key.trim()}
              className="font-mono"
              style={{
                padding: "8px 16px",
                background: saved ? theme.grn + "20" : theme.bg2,
                border: `1px solid ${saved ? theme.grn + "44" : theme.bdr}`,
                borderRadius: 4,
                color: saved ? theme.grn : theme.t,
                fontSize: 10,
                cursor: key.trim() ? "pointer" : "default",
                opacity: key.trim() ? 1 : 0.5,
              }}
            >
              {saving ? "..." : saved ? "Saved" : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function fmtTs(iso?: string): string {
  const d = iso ? new Date(iso) : new Date();
  return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function dagSummary(dag: OrchestratorTask[]): string {
  const lines = dag.map((t) => {
    const deps = t.dependencies.length > 0 ? ` <- ${t.dependencies.join(", ")}` : "";
    return `  ${t.id}: ${t.label} [${t.agent_domain}]${deps}`;
  });
  return `DAG decomposed:\n${lines.join("\n")}`;
}

export default function App() {
  const { theme } = useTheme();
  const [view, setView] = useState<View>("welcome");
  const [project, setProject] = useState<ApiProject | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [liveAgents, setLiveAgents] = useState<AgentInfo[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const { connected, messages } = useWebSocket("ws://localhost:8000/ws");

  // ── App-level chat state (persists across view switches) ──────────────
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([]);
  const [dagTasks, setDagTasks] = useState<OrchestratorTask[]>([]);
  const processedRef = useRef(0);

  // Process WS events at App level — runs regardless of which view is active
  useEffect(() => {
    const newEvents = messages.slice(processedRef.current);
    processedRef.current = messages.length;
    if (newEvents.length === 0) return;

    const newMsgs: ChatMsg[] = [];

    for (const ev of newEvents) {
      const ts = fmtTs(ev.timestamp as string | undefined);

      if (ev.type === "reprompt") {
        newMsgs.push({
          role: "rep",
          orig: (ev.original as string) ?? "",
          refined: (ev.refined as string) ?? "",
          ts,
        });
      } else if (ev.type === "thinking" || ev.type === "ready") {
        newMsgs.push({ role: "orch", text: ev.text ?? "", ts });
      } else if (ev.type === "dag_update") {
        const dag = (ev.dag as OrchestratorTask[]) ?? [];
        setDagTasks(dag);
        if (dag.length > 0) {
          newMsgs.push({ role: "orch", text: dagSummary(dag), ts });
        }
      } else if (ev.type === "contract_update") {
        const file = (ev.file as string) ?? "contract";
        newMsgs.push({ role: "orch", text: `Contract written: ${file}`, ts });
      } else if (ev.type === "memory_update") {
        const additions = (ev.additions as string[]) ?? [];
        newMsgs.push({
          role: "orch",
          text: `Global memory updated:\n${additions.map((a) => `— ${a}`).join("\n")}`,
          ts,
        });
      } else if (ev.type === "assistant") {
        newMsgs.push({ role: "orch", text: ev.text ?? "", ts });
      } else if (ev.type === "error") {
        newMsgs.push({ role: "orch", text: `Error: ${ev.text ?? "Unknown error"}`, ts });
      }
    }

    if (newMsgs.length > 0) {
      setChatMessages((prev) => [...prev, ...newMsgs]);
    }
  }, [messages]);

  // Reset all state when switching projects
  useEffect(() => {
    setChatMessages([]);
    setDagTasks([]);
    setLiveAgents([]);
    setSelectedAgent(null);
    processedRef.current = messages.length;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project?.id]);

  // Poll live agents when a project is open (scoped by project_id)
  const pollAgents = useCallback(() => {
    if (!project) return;
    listAgents(project.id).then(setLiveAgents).catch(() => {});
  }, [project]);

  useEffect(() => {
    pollAgents();
    const iv = setInterval(pollAgents, 5000);
    return () => clearInterval(iv);
  }, [pollAgents]);

  // Welcome screen
  if (view === "welcome") {
    return <Welcome onEnter={() => setView("projects")} />;
  }

  return (
    <div
      className="h-screen flex flex-col overflow-hidden"
      style={{ background: theme.bg, color: theme.t, fontFamily: theme.sans }}
    >
      {/* Top Bar */}
      <div
        className="flex items-center flex-shrink-0"
        style={{
          height: 42,
          padding: "0 16px",
          borderBottom: `1px solid ${theme.bdr}`,
          background: theme.bg,
          zIndex: 100,
        }}
      >
        {/* Logo */}
        <div
          className="flex items-center gap-2 cursor-pointer"
          style={{ marginRight: 16 }}
          onClick={() => {
            setView("projects");
            setProject(null);
          }}
        >
          <img
            src={logoUrl}
            alt="Alchemistral"
            style={{ height: 20, width: 20, display: "block" }}
          />
          <span
            className="font-mono"
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: 2.5,
              color: theme.t,
            }}
          >
            Alchimistral
          </span>
        </div>

        <div
          style={{ width: 1, height: 16, background: theme.bdr, marginRight: 12 }}
        />

        {project ? (
          <>
            {(["room", "lab"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setView(tab)}
                style={{
                  padding: "0 12px",
                  height: 42,
                  background: "transparent",
                  border: "none",
                  borderBottom:
                    view === tab
                      ? `1.5px solid ${theme.t}`
                      : "1.5px solid transparent",
                  color: view === tab ? theme.t : theme.t3,
                  fontSize: 11,
                  fontWeight: view === tab ? 600 : 400,
                  cursor: "pointer",
                  fontFamily: theme.sans,
                  textTransform: "capitalize",
                }}
              >
                {tab === "room" ? "Room" : "Lab"}
              </button>
            ))}

            <div
              style={{
                width: 1,
                height: 16,
                background: theme.bdr,
                margin: "0 12px",
              }}
            />

            <div
              className="flex items-center gap-1 font-mono"
              style={{ fontSize: 10, color: theme.t2 }}
            >
              <FolderOpen size={11} style={{ color: theme.t3 }} /> {project.name}
            </div>
            <span
              className="flex items-center gap-1 font-mono"
              style={{
                fontSize: 8,
                color: theme.t3,
                marginLeft: 8,
                padding: "1px 5px",
                border: `1px solid ${theme.bdr}`,
                borderRadius: 2,
              }}
            >
              <Terminal size={8} style={{ color: theme.t3 }} />{" "}
              {project.cli_adapter}
            </span>
          </>
        ) : (
          <span className="font-mono" style={{ fontSize: 10, color: theme.t3 }}>
            SELECT A PROJECT
          </span>
        )}

        <div className="ml-auto flex items-center gap-2.5">
          {project && (
            <>
              {[
                {
                  label: `${liveAgents.length} agents`,
                  Icon: Bot,
                  c: undefined as string | undefined,
                },
                {
                  label: `${liveAgents.filter((a) => a.status === "active").length} active`,
                  Icon: Loader2,
                  c: theme.blu,
                },
                {
                  label: `${liveAgents.filter((a) => a.worktree_path).length} worktrees`,
                  Icon: GitBranch,
                  c: theme.pur,
                },
              ].map((s) => (
                <span
                  key={s.label}
                  className="flex items-center gap-1 font-mono"
                  style={{ fontSize: 9, color: s.c ?? theme.t3 }}
                >
                  <s.Icon size={10} style={{ color: s.c ?? theme.t3 }} /> {s.label}
                </span>
              ))}
              <div style={{ width: 1, height: 16, background: theme.bdr }} />
            </>
          )}

          {/* Connection status */}
          <div className="flex items-center gap-1.5">
            <Dot color={connected ? theme.grn : theme.red} pulse={connected} size={5} />
            <span className="font-mono" style={{ fontSize: 8, color: theme.t3 }}>
              {connected ? "CONNECTED" : "OFFLINE"}
            </span>
          </div>

          <button
            onClick={() => setShowSettings(true)}
            className="flex items-center justify-center"
            style={{
              width: 24,
              height: 24,
              background: "transparent",
              border: `1px solid ${theme.bdr}`,
              borderRadius: 4,
              cursor: "pointer",
            }}
          >
            <Settings size={12} style={{ color: theme.t3 }} />
          </button>

          <div
            className="flex items-center gap-1 font-mono"
            style={{
              padding: "3px 8px",
              borderRadius: 3,
              fontSize: 8,
              fontWeight: 600,
              letterSpacing: 0.8,
              background: theme.grn + "15",
              border: `1px solid ${theme.grn}33`,
              color: theme.grn,
            }}
          >
            <Play size={8} style={{ color: theme.grn }} /> DEMO
          </div>

          <div
            className="flex items-center justify-center"
            style={{
              width: 24,
              height: 24,
              borderRadius: "50%",
              background: theme.bg2,
              border: `1px solid ${theme.bdr}`,
            }}
          >
            <User size={12} style={{ color: theme.t3 }} />
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 flex overflow-hidden">
          {!project || view === "projects" ? (
            <Projects
              onSelect={(p) => {
                setProject(p);
                setView("room");
              }}
            />
          ) : view === "room" ? (
            <Room
              projectId={project.id}
              onLab={() => setView("lab")}
              chatMessages={chatMessages}
              setChatMessages={setChatMessages}
              dagTasks={dagTasks}
            />
          ) : (
            <Lab projectId={project.id} onRoom={() => setView("room")} wsMessages={messages} />
          )}
        </div>

        {/* Agent Status Bar — visible when a project is open */}
        {project && (view === "room" || view === "lab") && (
          <AgentBar
            agents={liveAgents}
            selectedAgent={selectedAgent}
            onSelectAgent={(id) => {
              setSelectedAgent(id);
              setView("lab");
            }}
          />
        )}
      </div>

      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </div>
  );
}
