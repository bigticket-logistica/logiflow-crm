import { useState, useEffect, useRef } from "react";

// ─── CONFIGURACIÓN SUPABASE ───────────────────────────────────────────────────
// Reemplaza estos valores con los tuyos de Supabase
const SUPABASE_URL = "https://psvdtgjvognbmxfvqbaa.supabase.co";
const SUPABASE_KEY = "sb_publishable_RayW0wqgesNI6FYZ6i0CFQ_6YHaHELP";

// Cliente Supabase liviano (sin SDK, fetch directo)
const supabase = {
  from: (table) => ({
    select: async (cols = "*", opts = {}) => {
      let url = `${SUPABASE_URL}/rest/v1/${table}?select=${cols}`;
      if (opts.filter) url += `&${opts.filter}`;
      if (opts.order) url += `&order=${opts.order}`;
      const res = await fetch(url, {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
        },
      });
      return res.json();
    },
    update: async (data, filter) => {
      const url = `${SUPABASE_URL}/rest/v1/${table}?${filter}`;
      const res = await fetch(url, {
        method: "PATCH",
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
        body: JSON.stringify(data),
      });
      return res.json();
    },
    insert: async (data) => {
      const url = `${SUPABASE_URL}/rest/v1/${table}`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
        body: JSON.stringify(data),
      });
      return res.json();
    },
  }),
};

// ─── CONSTANTES ───────────────────────────────────────────────────────────────
const ETAPAS = ["Nuevo Lead", "Contactado", "Reunión Agendada", "Propuesta Enviada", "Negociación", "Ganado", "Perdido"];

const CANAL_CFG = {
  whatsapp:   { color: "#25D366", icon: "💬", label: "WhatsApp" },
  email:      { color: "#EA4335", icon: "📧", label: "Email" },
  facebook:   { color: "#1877F2", icon: "📘", label: "Facebook" },
  linkedin:   { color: "#0A66C2", icon: "💼", label: "LinkedIn" },
  referido:   { color: "#F97316", icon: "🤝", label: "Referido" },
  formulario: { color: "#8B5CF6", icon: "📝", label: "Formulario" },
};

const getCanalCfg = (canal) => {
  if (!canal) return { color: "#64748b", icon: "•", label: "Desconocido" };
  const key = canal.toLowerCase();
  return CANAL_CFG[key] || { color: "#64748b", icon: "•", label: canal };
};

const getScoreColor = (score) =>
  score >= 80 ? "#10B981" : score >= 60 ? "#F59E0B" : score >= 40 ? "#F97316" : "#EF4444";

const getClasificacionColor = (c) => {
  if (!c) return "#64748b";
  if (c.includes("Caliente")) return "#EF4444";
  if (c.includes("Candidato")) return "#F59E0B";
  if (c.includes("Prospecto")) return "#F97316";
  return "#64748b";
};

const formatFecha = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  const diff = (Date.now() - d) / 1000;
  if (diff < 3600) return `Hace ${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `Hace ${Math.floor(diff / 3600)}h`;
  if (diff < 604800) return `Hace ${Math.floor(diff / 86400)}d`;
  return d.toLocaleDateString("es-CL", { day: "2-digit", month: "short" });
};

// ─── COMPONENTES BASE ─────────────────────────────────────────────────────────
const ScoreDot = ({ score }) => {
  const c = getScoreColor(score || 0);
  const s = score || 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
      <svg width={36} height={36} viewBox="0 0 36 36">
        <circle cx={18} cy={18} r={15} fill="none" stroke="#1e293b" strokeWidth={3} />
        <circle cx={18} cy={18} r={15} fill="none" stroke={c} strokeWidth={3}
          strokeDasharray={`${s * 0.942} 94.2`} strokeLinecap="round"
          transform="rotate(-90 18 18)" style={{ transition: "stroke-dasharray .6s ease" }} />
        <text x={18} y={22} textAnchor="middle" fontSize={9} fill={c} fontWeight={700}>{s}</text>
      </svg>
    </div>
  );
};

const Tag = ({ label, color }) => (
  <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 20,
    background: color + "22", color, border: `1px solid ${color}44`, letterSpacing: .5 }}>
    {label}
  </span>
);

const CanalTag = ({ canal }) => {
  const cfg = getCanalCfg(canal);
  return <Tag label={`${cfg.icon} ${cfg.label}`} color={cfg.color} />;
};

const ClasifTag = ({ clasificacion, emoji }) => {
  const color = getClasificacionColor(clasificacion);
  return <Tag label={`${emoji || ""} ${clasificacion || "Sin clasificar"}`} color={color} />;
};

const Spinner = () => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 40 }}>
    <div style={{ width: 32, height: 32, border: "3px solid #1e3a5f", borderTopColor: "#3B82F6",
      borderRadius: "50%", animation: "spin 1s linear infinite" }} />
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

// ─── PANEL DETALLE LEAD ───────────────────────────────────────────────────────
const LeadPanel = ({ lead, onClose, onUpdate }) => {
  const [tab, setTab] = useState("info");
  const [etapa, setEtapa] = useState(lead.etapa || "Nuevo Lead");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleEtapaChange = async (newEtapa) => {
    setEtapa(newEtapa);
    setSaving(true);
    try {
      await supabase.from("leads").update({ etapa: newEtapa }, `id=eq.${lead.id}`);
      onUpdate && onUpdate({ ...lead, etapa: newEtapa });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const scoreColor = getScoreColor(lead.score || 0);

  return (
    <div style={{ position: "fixed", top: 0, right: 0, width: 480, height: "100vh",
      background: "#0b1426", borderLeft: "1px solid #1e3a5f", display: "flex",
      flexDirection: "column", zIndex: 100, boxShadow: "-30px 0 80px rgba(0,0,0,.7)" }}>

      {/* Header */}
      <div style={{ padding: "18px 20px", background: "linear-gradient(135deg,#0f1f3d,#0b1426)",
        borderBottom: "1px solid #1e3a5f", flexShrink: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#f1f5f9", letterSpacing: -.3 }}>
              {lead.nombre || "Sin nombre"}
            </div>
            <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
              {lead.cargo ? `${lead.cargo} · ` : ""}{lead.empresa || "Sin empresa"}
            </div>
            <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
              <CanalTag canal={lead.canal} />
              {lead.clasificacion && <ClasifTag clasificacion={lead.clasificacion} emoji={lead.emoji} />}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <ScoreDot score={lead.score} />
            <button onClick={onClose} style={{ background: "#1e293b", border: "1px solid #334155",
              color: "#94a3b8", borderRadius: 8, width: 32, height: 32, cursor: "pointer",
              fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
          </div>
        </div>

        {/* Selector etapa */}
        <div style={{ marginTop: 12, display: "flex", gap: 8, alignItems: "center" }}>
          <select value={etapa} onChange={e => handleEtapaChange(e.target.value)}
            style={{ flex: 1, background: "#0f172a", color: "#e2e8f0", border: "1px solid #1e3a5f",
              borderRadius: 8, padding: "7px 12px", fontSize: 12, cursor: "pointer", fontWeight: 600 }}>
            {ETAPAS.map(e => <option key={e}>{e}</option>)}
          </select>
          {saving && <span style={{ fontSize: 10, color: "#3B82F6" }}>Guardando...</span>}
          {saved && <span style={{ fontSize: 10, color: "#10B981" }}>✓ Guardado</span>}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", background: "#0b1426", borderBottom: "1px solid #1e3a5f", flexShrink: 0 }}>
        {[["info", "📋 Datos"], ["score", "⭐ Score"], ["timeline", "🕐 Historial"]].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} style={{ flex: 1, padding: "10px 0",
            background: "none", border: "none",
            borderBottom: tab === id ? "2px solid #3B82F6" : "2px solid transparent",
            color: tab === id ? "#3B82F6" : "#475569", fontSize: 11, fontWeight: 700,
            cursor: "pointer", transition: "all .2s", letterSpacing: .5 }}>
            {label}
          </button>
        ))}
      </div>

      {/* Contenido */}
      <div style={{ flex: 1, overflow: "auto", padding: 16 }}>

        {/* TAB: INFO */}
        {tab === "info" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ background: "#0f172a", border: "1px solid #1e3a5f", borderRadius: 10, padding: 14 }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: "#475569", letterSpacing: 1, marginBottom: 10, textTransform: "uppercase" }}>
                Datos de contacto
              </div>
              {[
                ["📞", "Teléfono", lead.telefono],
                ["📧", "Email", lead.email],
                ["📍", "Zona", lead.zona],
                ["📦", "Volumen", lead.volumen],
                ["🔗", "Canal", lead.canal],
                ["📅", "Captado", formatFecha(lead.created_at)],
                ["🔄", "Actualizado", formatFecha(lead.updated_at)],
              ].map(([icon, k, v]) => v && (
                <div key={k} style={{ display: "flex", justifyContent: "space-between",
                  padding: "7px 0", borderBottom: "1px solid #1e293b" }}>
                  <span style={{ fontSize: 12, color: "#475569" }}>{icon} {k}</span>
                  <span style={{ fontSize: 12, color: "#e2e8f0", fontWeight: 600 }}>{v}</span>
                </div>
              ))}
            </div>

            {lead.notas && (
              <div style={{ background: "#0f172a", border: "1px solid #1e3a5f", borderRadius: 10, padding: 14 }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: "#475569", letterSpacing: 1, marginBottom: 8, textTransform: "uppercase" }}>Notas</div>
                <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.6 }}>{lead.notas}</div>
              </div>
            )}
          </div>
        )}

        {/* TAB: SCORE */}
        {tab === "score" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ background: "#0f172a", border: `1px solid ${scoreColor}33`,
              borderRadius: 10, padding: 16, textAlign: "center" }}>
              <div style={{ fontSize: 48, fontWeight: 900, color: scoreColor, fontFamily: "monospace" }}>
                {lead.score || 0}
              </div>
              <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>Score total</div>
              {lead.clasificacion && (
                <div style={{ marginTop: 8 }}>
                  <ClasifTag clasificacion={lead.clasificacion} emoji={lead.emoji} />
                </div>
              )}
            </div>

            {lead.razones_score && (
              <div style={{ background: "#0f172a", border: "1px solid #1e3a5f", borderRadius: 10, padding: 14 }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: "#475569", letterSpacing: 1, marginBottom: 10, textTransform: "uppercase" }}>
                  Detalle del score
                </div>
                {lead.razones_score.split(" | ").map((r, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8,
                    padding: "6px 0", borderBottom: "1px solid #1e293b" }}>
                    <span style={{ color: "#10B981", fontSize: 12 }}>✓</span>
                    <span style={{ fontSize: 12, color: "#94a3b8" }}>{r}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB: TIMELINE */}
        {tab === "timeline" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {[
              { icon: "🎯", label: `Lead captado vía ${lead.canal || "desconocido"}`, fecha: formatFecha(lead.created_at), color: "#3B82F6" },
              lead.score > 0 && { icon: "⭐", label: `Score calculado: ${lead.score} pts → ${lead.clasificacion || ""}`, fecha: formatFecha(lead.updated_at), color: getScoreColor(lead.score) },
              lead.etapa !== "Nuevo Lead" && { icon: "📊", label: `Etapa actual: ${lead.etapa}`, fecha: formatFecha(lead.updated_at), color: "#F59E0B" },
            ].filter(Boolean).map((ev, i) => (
              <div key={i} style={{ display: "flex", gap: 12, padding: "12px 0",
                borderBottom: "1px solid #1e293b" }}>
                <div style={{ fontSize: 18 }}>{ev.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, color: "#e2e8f0", fontWeight: 600 }}>{ev.label}</div>
                  <div style={{ fontSize: 10, color: "#475569", marginTop: 2 }}>{ev.fecha}</div>
                </div>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: ev.color, marginTop: 6, flexShrink: 0 }} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── VISTA PIPELINE (KANBAN) ──────────────────────────────────────────────────
const Pipeline = ({ leads, onSelect }) => (
  <div style={{ overflowX: "auto", paddingBottom: 12 }}>
    <div style={{ display: "flex", gap: 10, minWidth: "fit-content" }}>
      {ETAPAS.slice(0, 5).map(etapa => {
        const ls = leads.filter(l => (l.etapa || "Nuevo Lead") === etapa);
        return (
          <div key={etapa} style={{ width: 248, flexShrink: 0 }}>
            <div style={{ padding: "8px 12px", background: "#0f172a",
              borderRadius: "10px 10px 0 0", borderBottom: "2px solid #1e3a5f",
              display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 10, fontWeight: 800, color: "#64748b",
                textTransform: "uppercase", letterSpacing: 1 }}>{etapa}</span>
              <span style={{ fontSize: 10, fontWeight: 800, background: "#1e293b",
                color: "#94a3b8", padding: "2px 8px", borderRadius: 20 }}>{ls.length}</span>
            </div>
            <div style={{ minHeight: 400, background: "#070e1a", borderRadius: "0 0 10px 10px",
              padding: 8, display: "flex", flexDirection: "column", gap: 7 }}>
              {ls.map(lead => (
                <div key={lead.id} onClick={() => onSelect(lead)}
                  style={{ background: "#0f172a", border: "1px solid #1e3a5f",
                    borderRadius: 10, padding: 12, cursor: "pointer", transition: "all .2s" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "#3B82F6"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "#1e3a5f"; e.currentTarget.style.transform = "translateY(0)"; }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 7 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#f1f5f9",
                        whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {lead.nombre || "Sin nombre"}
                      </div>
                      <div style={{ fontSize: 10, color: "#475569",
                        whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {lead.empresa || "Sin empresa"}
                      </div>
                    </div>
                    <ScoreDot score={lead.score} />
                  </div>
                  <div style={{ marginBottom: 6 }}><CanalTag canal={lead.canal} /></div>
                  {lead.volumen && <div style={{ fontSize: 10, color: "#475569" }}>📦 {lead.volumen}</div>}
                  <div style={{ fontSize: 10, color: "#334155", marginTop: 3 }}>
                    ⏱ {formatFecha(lead.updated_at)}
                  </div>
                  {lead.clasificacion && (
                    <div style={{ marginTop: 6 }}>
                      <ClasifTag clasificacion={lead.clasificacion} emoji={lead.emoji} />
                    </div>
                  )}
                </div>
              ))}
              {ls.length === 0 && (
                <div style={{ flex: 1, display: "flex", alignItems: "center",
                  justifyContent: "center", color: "#1e3a5f", fontSize: 12 }}>
                  Sin leads
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  </div>
);

// ─── VISTA TABLA ──────────────────────────────────────────────────────────────
const TablaLeads = ({ leads, onSelect }) => (
  <div style={{ background: "#0f172a", borderRadius: 12, border: "1px solid #1e3a5f", overflow: "hidden" }}>
    <table style={{ width: "100%", borderCollapse: "collapse" }}>
      <thead>
        <tr style={{ background: "#070e1a" }}>
          {["Prospecto", "Empresa", "Canal", "Etapa", "Score", "Clasificación", "Actualizado", ""].map(h => (
            <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 9,
              fontWeight: 800, color: "#334155", textTransform: "uppercase", letterSpacing: 1 }}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {leads.map((lead, i) => (
          <tr key={lead.id}
            style={{ borderTop: "1px solid #0f172a", background: i % 2 === 0 ? "#0f172a" : "#0b1426", cursor: "pointer" }}
            onClick={() => onSelect(lead)}
            onMouseEnter={e => e.currentTarget.style.background = "#0f2040"}
            onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? "#0f172a" : "#0b1426"}>
            <td style={{ padding: "10px 14px" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#f1f5f9" }}>{lead.nombre || "—"}</div>
              <div style={{ fontSize: 10, color: "#334155" }}>{lead.email || "—"}</div>
            </td>
            <td style={{ padding: "10px 14px", fontSize: 12, color: "#64748b" }}>{lead.empresa || "—"}</td>
            <td style={{ padding: "10px 14px" }}><CanalTag canal={lead.canal} /></td>
            <td style={{ padding: "10px 14px" }}>
              <span style={{ fontSize: 10, padding: "3px 9px", borderRadius: 20,
                background: "#1e293b", color: "#64748b" }}>{lead.etapa || "Nuevo Lead"}</span>
            </td>
            <td style={{ padding: "10px 14px" }}><ScoreDot score={lead.score} /></td>
            <td style={{ padding: "10px 14px" }}>
              {lead.clasificacion
                ? <ClasifTag clasificacion={lead.clasificacion} emoji={lead.emoji} />
                : <span style={{ color: "#334155", fontSize: 11 }}>Sin calcular</span>}
            </td>
            <td style={{ padding: "10px 14px", fontSize: 11, color: "#334155" }}>
              {formatFecha(lead.updated_at)}
            </td>
            <td style={{ padding: "10px 14px" }}>
              <button onClick={e => { e.stopPropagation(); onSelect(lead); }}
                style={{ background: "#1e3a5f", color: "#3B82F6", border: "none", borderRadius: 6,
                  padding: "5px 10px", fontSize: 11, cursor: "pointer", fontWeight: 700 }}>
                Ver →
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

// ─── DASHBOARD MÉTRICAS ───────────────────────────────────────────────────────
const DashboardMetrics = ({ leads }) => {
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  const nuevosHoy = leads.filter(l => l.created_at && new Date(l.created_at) >= hoy).length;
  const scorePromedio = leads.length ? Math.round(leads.reduce((a, l) => a + (l.score || 0), 0) / leads.length) : 0;
  const calientes = leads.filter(l => l.clasificacion?.includes("Caliente")).length;
  const candidatos = leads.filter(l => l.clasificacion?.includes("Candidato")).length;

  const canalData = Object.entries(
    leads.reduce((a, l) => { const c = l.canal?.toLowerCase() || "otro"; a[c] = (a[c] || 0) + 1; return a; }, {})
  ).sort((a, b) => b[1] - a[1]);

  const etapaData = ETAPAS.slice(0, 5).map(e => ({
    etapa: e, count: leads.filter(l => (l.etapa || "Nuevo Lead") === e).length
  }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        {[
          ["👥", "Total Leads", leads.length, "#3B82F6"],
          ["🆕", "Nuevos hoy", nuevosHoy, "#10B981"],
          ["⭐", "Score promedio", scorePromedio, "#F59E0B"],
          ["🔴", "Lead Caliente", calientes, "#EF4444"],
        ].map(([icon, label, val, color]) => (
          <div key={label} style={{ background: "#0f172a", border: `1px solid ${color}22`,
            borderRadius: 12, padding: 16 }}>
            <div style={{ fontSize: 24 }}>{icon}</div>
            <div style={{ fontSize: 30, fontWeight: 900, color, fontFamily: "monospace", marginTop: 6 }}>{val}</div>
            <div style={{ fontSize: 11, color: "#475569", fontWeight: 700, letterSpacing: .5, marginTop: 2 }}>{label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {/* Por canal */}
        <div style={{ background: "#0f172a", border: "1px solid #1e3a5f", borderRadius: 12, padding: 16 }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: "#475569", letterSpacing: 2,
            marginBottom: 14, textTransform: "uppercase" }}>Leads por canal</div>
          {canalData.map(([canal, count]) => {
            const cfg = getCanalCfg(canal);
            return (
              <div key={canal} style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                  <span style={{ fontSize: 12, color: "#94a3b8" }}>{cfg.icon} {cfg.label}</span>
                  <span style={{ fontSize: 12, fontWeight: 800, color: cfg.color }}>{count}</span>
                </div>
                <div style={{ height: 5, background: "#1e293b", borderRadius: 4 }}>
                  <div style={{ height: "100%", width: `${(count / leads.length) * 100}%`,
                    background: cfg.color, borderRadius: 4, transition: "width .8s ease" }} />
                </div>
              </div>
            );
          })}
          {leads.length === 0 && <div style={{ color: "#334155", fontSize: 12 }}>Sin datos aún</div>}
        </div>

        {/* Por etapa */}
        <div style={{ background: "#0f172a", border: "1px solid #1e3a5f", borderRadius: 12, padding: 16 }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: "#475569", letterSpacing: 2,
            marginBottom: 14, textTransform: "uppercase" }}>Pipeline por etapa</div>
          {etapaData.map(({ etapa, count }) => (
            <div key={etapa} style={{ display: "flex", justifyContent: "space-between",
              alignItems: "center", padding: "7px 0", borderBottom: "1px solid #1e293b" }}>
              <span style={{ fontSize: 11, color: "#64748b" }}>{etapa}</span>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <div style={{ height: 4, width: `${count * 12}px`, minWidth: 4, maxWidth: 80,
                  background: "#3B82F6", borderRadius: 4 }} />
                <span style={{ fontSize: 13, fontWeight: 800, color: "#3B82F6",
                  fontFamily: "monospace", minWidth: 20, textAlign: "right" }}>{count}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Leads recientes */}
      <div style={{ background: "#0f172a", border: "1px solid #1e3a5f", borderRadius: 12, padding: 16 }}>
        <div style={{ fontSize: 10, fontWeight: 800, color: "#475569", letterSpacing: 2,
          marginBottom: 12, textTransform: "uppercase" }}>Leads recientes</div>
        {leads.slice(0, 5).map(lead => (
          <div key={lead.id} style={{ display: "flex", alignItems: "center", gap: 12,
            padding: "9px 0", borderBottom: "1px solid #0f172a" }}>
            <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#1e293b",
              border: "1px solid #334155", display: "flex", alignItems: "center",
              justifyContent: "center", fontSize: 13, color: "#64748b",
              fontWeight: 700, flexShrink: 0 }}>
              {(lead.nombre || "?")[0].toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#f1f5f9",
                whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {lead.nombre} · {lead.empresa}
              </div>
              <div style={{ fontSize: 10, color: "#475569" }}>
                {lead.etapa || "Nuevo Lead"} · {formatFecha(lead.created_at)}
              </div>
            </div>
            <CanalTag canal={lead.canal} />
            <ScoreDot score={lead.score} />
          </div>
        ))}
        {leads.length === 0 && <div style={{ color: "#334155", fontSize: 12 }}>No hay leads aún</div>}
      </div>
    </div>
  );
};

// ─── APP PRINCIPAL ─────────────────────────────────────────────────────────────
export default function App() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [seccion, setSeccion] = useState("dashboard");
  const [selectedLead, setSelectedLead] = useState(null);
  const [busqueda, setBusqueda] = useState("");
  const [vista, setVista] = useState("pipeline");
  const [lastUpdate, setLastUpdate] = useState(null);
  const refreshInterval = useRef(null);

  const fetchLeads = async () => {
    try {
      const data = await supabase.from("leads").select("*", { order: "created_at.desc" });
      if (Array.isArray(data)) {
        setLeads(data);
        setLastUpdate(new Date());
        setError(null);
      } else {
        setError("Error al cargar leads");
      }
    } catch (e) {
      setError("Sin conexión a Supabase");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
    refreshInterval.current = setInterval(fetchLeads, 30000); // Auto-refresh cada 30s
    return () => clearInterval(refreshInterval.current);
  }, []);

  const handleLeadUpdate = (updatedLead) => {
    setLeads(prev => prev.map(l => l.id === updatedLead.id ? updatedLead : l));
    if (selectedLead?.id === updatedLead.id) setSelectedLead(updatedLead);
  };

  const filtered = leads.filter(l =>
    (l.nombre || "").toLowerCase().includes(busqueda.toLowerCase()) ||
    (l.empresa || "").toLowerCase().includes(busqueda.toLowerCase()) ||
    (l.email || "").toLowerCase().includes(busqueda.toLowerCase())
  );

  const NAV = [
    { id: "dashboard", icon: "◈", label: "Dashboard" },
    { id: "leads", icon: "◉", label: "Leads" },
  ];

  const isConfigured = SUPABASE_URL !== "https://TU_PROJECT.supabase.co";

  return (
    <div style={{ display: "flex", height: "100vh", background: "#070e1a",
      color: "#e2e8f0", overflow: "hidden", fontFamily: "'DM Mono', 'Fira Code', monospace" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Outfit:wght@400;600;700;800;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; height: 4px }
        ::-webkit-scrollbar-track { background: #070e1a }
        ::-webkit-scrollbar-thumb { background: #1e3a5f; border-radius: 4px }
        input, textarea, select { outline: none; font-family: inherit; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:.4 } }
      `}</style>

      {/* SIDEBAR */}
      <div style={{ width: 200, background: "#0b1426", borderRight: "1px solid #0f2040",
        display: "flex", flexDirection: "column", flexShrink: 0 }}>
        <div style={{ padding: "20px 16px", borderBottom: "1px solid #0f2040" }}>
          <div style={{ fontSize: 20, fontWeight: 900, letterSpacing: -1, fontFamily: "'Outfit', sans-serif" }}>
            <span style={{ color: "#3B82F6" }}>Logi</span>
            <span style={{ color: "#f1f5f9" }}>Flow</span>
          </div>
          <div style={{ fontSize: 9, color: "#25D366", fontWeight: 700, letterSpacing: 2, marginTop: 3 }}>
            CRM · SUPABASE LIVE
          </div>
        </div>

        <nav style={{ flex: 1, padding: "10px 10px" }}>
          {NAV.map(item => (
            <button key={item.id} onClick={() => setSeccion(item.id)}
              style={{ width: "100%", display: "flex", alignItems: "center", gap: 10,
                padding: "9px 12px", borderRadius: 8,
                background: seccion === item.id ? "#0f2040" : "none",
                border: seccion === item.id ? "1px solid #1e3a5f" : "1px solid transparent",
                color: seccion === item.id ? "#f1f5f9" : "#475569",
                cursor: "pointer", fontSize: 12, fontWeight: seccion === item.id ? 700 : 500,
                marginBottom: 3, transition: "all .2s", textAlign: "left",
                fontFamily: "'Outfit', sans-serif" }}>
              <span style={{ fontSize: 14, color: seccion === item.id ? "#3B82F6" : "inherit" }}>
                {item.icon}
              </span>
              {item.label}
              {item.id === "leads" && (
                <span style={{ marginLeft: "auto", background: "#3B82F622", color: "#3B82F6",
                  fontSize: 9, fontWeight: 800, padding: "1px 6px", borderRadius: 20 }}>
                  {leads.length}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div style={{ padding: 12, borderBottom: "1px solid #0f2040" }}>
          <button onClick={fetchLeads}
            style={{ width: "100%", background: "#0f2040", border: "1px solid #1e3a5f",
              color: "#64748b", borderRadius: 8, padding: "7px", fontSize: 11,
              cursor: "pointer", fontWeight: 600, fontFamily: "'Outfit', sans-serif" }}>
            🔄 Actualizar
          </button>
          {lastUpdate && (
            <div style={{ fontSize: 9, color: "#334155", textAlign: "center", marginTop: 4 }}>
              {lastUpdate.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })}
            </div>
          )}
        </div>

        <div style={{ padding: 12 }}>
          <div style={{ background: "#0f2040", border: "1px solid #1e3a5f",
            borderRadius: 8, padding: "8px 10px" }}>
            <div style={{ fontSize: 9, color: "#334155", fontWeight: 700, letterSpacing: 1 }}>
              ESTADO DB
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%",
                background: error ? "#EF4444" : "#10B981",
                animation: error ? "none" : "pulse 2s infinite" }} />
              <span style={{ fontSize: 10, color: error ? "#EF4444" : "#10B981", fontWeight: 700 }}>
                {error ? "Error" : "Conectado"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* TOPBAR */}
        <div style={{ height: 56, background: "#0b1426", borderBottom: "1px solid #0f2040",
          display: "flex", alignItems: "center", padding: "0 20px", gap: 12, flexShrink: 0 }}>
          <div style={{ flex: 1, display: "flex", gap: 10, alignItems: "center" }}>
            {seccion === "leads" && (
              <>
                <input value={busqueda} onChange={e => setBusqueda(e.target.value)}
                  placeholder="🔍 Buscar leads..."
                  style={{ background: "#0f172a", color: "#e2e8f0", border: "1px solid #1e3a5f",
                    borderRadius: 7, padding: "6px 12px", fontSize: 12, width: 220 }} />
                <div style={{ display: "flex", background: "#0f172a", border: "1px solid #1e3a5f",
                  borderRadius: 7, overflow: "hidden" }}>
                  {[["pipeline", "⬛"], ["lista", "☰"]].map(([v, icon]) => (
                    <button key={v} onClick={() => setVista(v)}
                      style={{ padding: "6px 12px", background: vista === v ? "#1e3a5f" : "none",
                        border: "none", color: vista === v ? "#f1f5f9" : "#475569",
                        cursor: "pointer", fontSize: 13 }}>{icon}</button>
                  ))}
                </div>
              </>
            )}
            <div style={{ fontSize: 11, color: "#1e3a5f" }}>
              {seccion === "dashboard" && "📊 Resumen en tiempo real"}
              {seccion === "leads" && `◉ ${filtered.length} leads · ${vista === "pipeline" ? "Vista Kanban" : "Vista Lista"}`}
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <div style={{ background: "#0d2b1a", border: "1px solid #25D36633",
              borderRadius: 7, padding: "5px 10px", fontSize: 10, color: "#25D366", fontWeight: 700 }}>
              ⚡ N8N Activo
            </div>
          </div>
        </div>

        {/* ALERTA CONFIGURACIÓN */}
        {!isConfigured && (
          <div style={{ background: "#1a1a0a", border: "1px solid #F59E0B33",
            borderLeft: "3px solid #F59E0B", margin: "12px 20px 0",
            borderRadius: 8, padding: "10px 14px" }}>
            <div style={{ fontSize: 11, color: "#F59E0B", fontWeight: 700, marginBottom: 4 }}>
              ⚠️ Configuración requerida
            </div>
            <div style={{ fontSize: 11, color: "#94a3b8" }}>
              Reemplaza <code style={{ background: "#0f172a", padding: "1px 4px", borderRadius: 3 }}>SUPABASE_URL</code> y{" "}
              <code style={{ background: "#0f172a", padding: "1px 4px", borderRadius: 3 }}>SUPABASE_KEY</code> en las líneas 8-9 del archivo con tus credenciales de Supabase.
            </div>
          </div>
        )}

        {/* CONTENT */}
        <div style={{ flex: 1, overflow: "auto", padding: 20 }}>
          {loading ? (
            <Spinner />
          ) : error ? (
            <div style={{ background: "#1a0a0a", border: "1px solid #EF444433",
              borderRadius: 12, padding: 24, textAlign: "center" }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>⚠️</div>
              <div style={{ fontSize: 14, color: "#EF4444", fontWeight: 700 }}>{error}</div>
              <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
                Verifica tu SUPABASE_URL y SUPABASE_KEY
              </div>
              <button onClick={fetchLeads}
                style={{ marginTop: 12, background: "#1e293b", color: "#94a3b8",
                  border: "1px solid #334155", borderRadius: 8, padding: "8px 16px",
                  fontSize: 12, cursor: "pointer" }}>
                Reintentar
              </button>
            </div>
          ) : (
            <>
              {seccion === "dashboard" && <DashboardMetrics leads={leads} />}
              {seccion === "leads" && (
                vista === "pipeline"
                  ? <Pipeline leads={filtered} onSelect={setSelectedLead} />
                  : <TablaLeads leads={filtered} onSelect={setSelectedLead} />
              )}
            </>
          )}
        </div>
      </div>

      {/* PANEL DETALLE */}
      {selectedLead && (
        <LeadPanel
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
          onUpdate={handleLeadUpdate}
        />
      )}
    </div>
  );
}
