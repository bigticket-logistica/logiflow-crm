import { useState, useEffect, useRef } from "react";

// ─── CONFIGURACIÓN SUPABASE ───────────────────────────────────────────────────
const SUPABASE_URL = "https://psvdtgjvognbmxfvqbaa.supabase.co";
const SUPABASE_KEY = "sb_publishable_RayW0wqgesNI6FYZ6i0CFQ_6YHaHELP";

const supabase = {
  from: (table) => ({
    select: async (cols = "*", opts = {}) => {
      let url = `${SUPABASE_URL}/rest/v1/${table}?select=${cols}`;
      if (opts.filter) url += `&${opts.filter}`;
      if (opts.order) url += `&order=${opts.order}`;
      const res = await fetch(url, {
        headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
      });
      return res.json();
    },
    update: async (data, filter) => {
      const url = `${SUPABASE_URL}/rest/v1/${table}?${filter}`;
      const res = await fetch(url, {
        method: "PATCH",
        headers: {
          apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`,
          "Content-Type": "application/json", Prefer: "return=representation",
        },
        body: JSON.stringify(data),
      });
      return res.json();
    },
  }),
};

// ─── CONSTANTES ───────────────────────────────────────────────────────────────
const ETAPAS_PIPELINE = ["Nuevo Lead","Contactado","Reunión Agendada","Propuesta Enviada","Negociación"];
const ETAPAS_CIERRE   = ["Ganado","Perdido"];
const ETAPAS_TODAS    = [...ETAPAS_PIPELINE, ...ETAPAS_CIERRE];

const ETAPA_CFG = {
  "Nuevo Lead":        { color: "#3B82F6", icon: "🎯" },
  "Contactado":        { color: "#8B5CF6", icon: "📞" },
  "Reunión Agendada":  { color: "#F59E0B", icon: "📅" },
  "Propuesta Enviada": { color: "#F97316", icon: "📄" },
  "Negociación":       { color: "#EC4899", icon: "🤝" },
  "Ganado":            { color: "#10B981", icon: "✅" },
  "Perdido":           { color: "#EF4444", icon: "❌" },
};

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
  return CANAL_CFG[canal.toLowerCase()] || { color: "#64748b", icon: "•", label: canal };
};

const getScoreColor = (s) => s >= 80 ? "#10B981" : s >= 60 ? "#F59E0B" : s >= 40 ? "#F97316" : "#EF4444";

const formatFecha = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  const diff = (Date.now() - d) / 1000;
  if (diff < 3600)   return `Hace ${Math.floor(diff/60)}m`;
  if (diff < 86400)  return `Hace ${Math.floor(diff/3600)}h`;
  if (diff < 604800) return `Hace ${Math.floor(diff/86400)}d`;
  return d.toLocaleDateString("es-CL", { day:"2-digit", month:"short" });
};

const diasEntre = (iso1, iso2) => {
  if (!iso1 || !iso2) return null;
  return Math.round(Math.abs(new Date(iso2) - new Date(iso1)) / 86400000);
};

// ─── COMPONENTES BASE ─────────────────────────────────────────────────────────
const ScoreDot = ({ score }) => {
  const c = getScoreColor(score || 0);
  const s = Math.min(score || 0, 100);
  return (
    <svg width={36} height={36} viewBox="0 0 36 36" style={{ flexShrink:0 }}>
      <circle cx={18} cy={18} r={15} fill="none" stroke="#1e293b" strokeWidth={3}/>
      <circle cx={18} cy={18} r={15} fill="none" stroke={c} strokeWidth={3}
        strokeDasharray={`${s*0.942} 94.2`} strokeLinecap="round"
        transform="rotate(-90 18 18)" style={{ transition:"stroke-dasharray .6s ease" }}/>
      <text x={18} y={22} textAnchor="middle" fontSize={9} fill={c} fontWeight={700}>{s}</text>
    </svg>
  );
};

const Tag = ({ label, color }) => (
  <span style={{ fontSize:10, fontWeight:700, padding:"2px 7px", borderRadius:20,
    background:color+"22", color, border:`1px solid ${color}44`, letterSpacing:.5 }}>
    {label}
  </span>
);

const CanalTag = ({ canal }) => {
  const cfg = getCanalCfg(canal);
  return <Tag label={`${cfg.icon} ${cfg.label}`} color={cfg.color}/>;
};

const Spinner = () => (
  <div style={{ display:"flex", alignItems:"center", justifyContent:"center", padding:60 }}>
    <div style={{ width:32, height:32, border:"3px solid #1e3a5f", borderTopColor:"#3B82F6",
      borderRadius:"50%", animation:"spin 1s linear infinite" }}/>
  </div>
);

// ─── LEAD CARD ────────────────────────────────────────────────────────────────
const LeadCard = ({ lead, onSelect, onDragStart }) => {
  const cfg = ETAPA_CFG[lead.etapa] || { color:"#64748b" };
  return (
    <div draggable onDragStart={(e) => onDragStart(e, lead)} onClick={() => onSelect(lead)}
      style={{ background:"#0f172a", border:"1px solid #1e3a5f", borderRadius:10,
        padding:12, cursor:"grab", transition:"all .2s", userSelect:"none" }}
      onMouseEnter={e => { e.currentTarget.style.borderColor=cfg.color; e.currentTarget.style.transform="translateY(-2px)"; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor="#1e3a5f"; e.currentTarget.style.transform="translateY(0)"; }}>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:7 }}>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:12, fontWeight:700, color:"#f1f5f9",
            whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
            {lead.nombre || "Sin nombre"}
          </div>
          <div style={{ fontSize:10, color:"#475569",
            whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
            {lead.empresa || "Sin empresa"}
          </div>
        </div>
        <ScoreDot score={lead.score}/>
      </div>
      <div style={{ marginBottom:6 }}><CanalTag canal={lead.canal}/></div>
      {lead.volumen && <div style={{ fontSize:10, color:"#475569" }}>📦 {lead.volumen}</div>}
      <div style={{ fontSize:10, color:"#334155", marginTop:3 }}>⏱ {formatFecha(lead.updated_at)}</div>
      {lead.clasificacion && (
        <div style={{ marginTop:6 }}>
          <Tag label={`${lead.emoji||""} ${lead.clasificacion}`}
            color={lead.clasificacion?.includes("Caliente")?"#EF4444":
                   lead.clasificacion?.includes("Candidato")?"#F59E0B":"#F97316"}/>
        </div>
      )}
    </div>
  );
};

// ─── COLUMNA KANBAN ───────────────────────────────────────────────────────────
const KanbanCol = ({ etapa, leads, onSelect, onDragStart, onDrop, isDragOver, setDragOver }) => {
  const cfg = ETAPA_CFG[etapa] || { color:"#64748b", icon:"•" };
  const esCierre = ETAPAS_CIERRE.includes(etapa);
  return (
    <div style={{ width:esCierre?220:245, flexShrink:0 }}
      onDragOver={e => { e.preventDefault(); setDragOver(etapa); }}
      onDragLeave={() => setDragOver(null)}
      onDrop={e => { onDrop(e, etapa); setDragOver(null); }}>
      <div style={{ padding:"8px 12px", background:"#0f172a", borderRadius:"10px 10px 0 0",
        borderBottom:`2px solid ${isDragOver?cfg.color:"#1e3a5f"}`,
        display:"flex", justifyContent:"space-between", alignItems:"center", transition:"border-color .2s" }}>
        <span style={{ fontSize:10, fontWeight:800, color:isDragOver?cfg.color:"#64748b",
          textTransform:"uppercase", letterSpacing:1 }}>{cfg.icon} {etapa}</span>
        <span style={{ fontSize:10, fontWeight:800, background:cfg.color+"22",
          color:cfg.color, padding:"2px 8px", borderRadius:20 }}>{leads.length}</span>
      </div>
      <div style={{ minHeight:400, background:isDragOver?cfg.color+"08":"#070e1a",
        borderRadius:"0 0 10px 10px", padding:8, display:"flex", flexDirection:"column", gap:7,
        border:isDragOver?`1px dashed ${cfg.color}44`:"1px solid transparent", transition:"all .2s" }}>
        {leads.map(lead => (
          <LeadCard key={lead.id} lead={lead} onSelect={onSelect} onDragStart={onDragStart}/>
        ))}
        {leads.length===0 && (
          <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center",
            color:isDragOver?cfg.color:"#1e3a5f", fontSize:12, minHeight:80 }}>
            {isDragOver ? "Soltar aquí" : "Sin leads"}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── PIPELINE KANBAN ──────────────────────────────────────────────────────────
const Pipeline = ({ leads, onSelect, onEtapaChange }) => {
  const [dragLead, setDragLead] = useState(null);
  const [dragOver, setDragOver] = useState(null);

  const handleDragStart = (e, lead) => { setDragLead(lead); e.dataTransfer.effectAllowed="move"; };
  const handleDrop = async (e, nuevaEtapa) => {
    e.preventDefault();
    if (!dragLead || dragLead.etapa === nuevaEtapa) return;
    await onEtapaChange(dragLead, nuevaEtapa);
    setDragLead(null);
  };
  const leadsPorEtapa = (etapa) => leads.filter(l => (l.etapa||"Nuevo Lead") === etapa);

  return (
    <div style={{ overflowX:"auto", paddingBottom:12 }}>
      <div style={{ display:"flex", gap:10, minWidth:"fit-content" }}>
        {ETAPAS_PIPELINE.map(etapa => (
          <KanbanCol key={etapa} etapa={etapa} leads={leadsPorEtapa(etapa)}
            onSelect={onSelect} onDragStart={handleDragStart}
            onDrop={handleDrop} isDragOver={dragOver===etapa} setDragOver={setDragOver}/>
        ))}
        <div style={{ width:2, background:"linear-gradient(to bottom,transparent,#334155,transparent)",
          borderRadius:4, flexShrink:0, margin:"0 4px" }}/>
        {ETAPAS_CIERRE.map(etapa => (
          <KanbanCol key={etapa} etapa={etapa} leads={leadsPorEtapa(etapa)}
            onSelect={onSelect} onDragStart={handleDragStart}
            onDrop={handleDrop} isDragOver={dragOver===etapa} setDragOver={setDragOver}/>
        ))}
      </div>
      <div style={{ marginTop:10, fontSize:10, color:"#334155", textAlign:"center" }}>
        💡 Arrastra tarjetas entre columnas · O haz clic para abrir el detalle y cambiar etapa manualmente
      </div>
    </div>
  );
};

// ─── KPIs ─────────────────────────────────────────────────────────────────────
const KPIsView = ({ leads }) => {
  const ganados  = leads.filter(l => l.etapa==="Ganado");
  const perdidos = leads.filter(l => l.etapa==="Perdido");
  const cerrados = ganados.length + perdidos.length;
  const tasaCierre = cerrados>0 ? Math.round((ganados.length/cerrados)*100) : 0;

  const tiemposCierre = ganados
    .map(l => diasEntre(l.created_at, l.updated_at)).filter(d => d!==null);
  const tiempoPromedio = tiemposCierre.length
    ? Math.round(tiemposCierre.reduce((a,b)=>a+b,0)/tiemposCierre.length) : null;

  const canales = {};
  leads.forEach(l => {
    const c = (l.canal||"desconocido").toLowerCase();
    if (!canales[c]) canales[c] = { total:0, ganados:0 };
    canales[c].total++;
    if (l.etapa==="Ganado") canales[c].ganados++;
  });
  const canalStats = Object.entries(canales)
    .map(([canal,d]) => ({ canal, total:d.total, ganados:d.ganados,
      eficacia: d.total>0 ? Math.round((d.ganados/d.total)*100) : 0 }))
    .sort((a,b) => b.eficacia-a.eficacia);

  const canalEficaz      = canalStats[0];
  const canalMenosEficaz = canalStats[canalStats.length-1];
  const canalVolumen     = [...canalStats].sort((a,b)=>b.total-a.total)[0];

  const scoreEtapa = ETAPAS_TODAS.map(e => {
    const ls = leads.filter(l => (l.etapa||"Nuevo Lead")===e);
    return { etapa:e, score: ls.length ? Math.round(ls.reduce((a,l)=>a+(l.score||0),0)/ls.length):0, count:ls.length };
  }).filter(e => e.count>0);

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

      {/* KPIs principales */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12 }}>
        {[
          ["✅","Tasa de cierre",`${tasaCierre}%`,"#10B981",`${ganados.length} ganados de ${cerrados} cerrados`],
          ["⏱","Tiempo promedio",tiempoPromedio!==null?`${tiempoPromedio}d`:"—","#3B82F6","Días desde lead hasta Ganado"],
          ["📈","Leads ganados",ganados.length,"#10B981",`${perdidos.length} perdidos`],
          ["📉","Leads perdidos",perdidos.length,"#EF4444",`${cerrados>0?Math.round((perdidos.length/cerrados)*100):0}% del cerrado`],
        ].map(([icon,label,val,color,sub]) => (
          <div key={label} style={{ background:"#0f172a", border:`1px solid ${color}22`, borderRadius:12, padding:16 }}>
            <div style={{ fontSize:22 }}>{icon}</div>
            <div style={{ fontSize:30, fontWeight:900, color, fontFamily:"monospace", marginTop:6 }}>{val}</div>
            <div style={{ fontSize:11, color:"#475569", fontWeight:700, marginTop:2 }}>{label}</div>
            <div style={{ fontSize:10, color:"#334155", marginTop:3 }}>{sub}</div>
          </div>
        ))}
      </div>

      {/* Canales destacados */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12 }}>
        {[
          ["🏆","Canal más eficaz",canalEficaz,"#10B981"],
          ["⚠️","Canal menos eficaz",canalMenosEficaz,"#EF4444"],
          ["📊","Mayor volumen",canalVolumen,"#3B82F6"],
        ].map(([icon,label,canal,color]) => {
          if (!canal) return null;
          const cfg = getCanalCfg(canal.canal);
          return (
            <div key={label} style={{ background:"#0f172a", border:`1px solid ${color}22`, borderRadius:12, padding:16 }}>
              <div style={{ fontSize:11, fontWeight:800, color:"#475569", letterSpacing:1,
                textTransform:"uppercase", marginBottom:8 }}>{icon} {label}</div>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
                <span style={{ fontSize:24 }}>{cfg.icon}</span>
                <div>
                  <div style={{ fontSize:16, fontWeight:800, color:cfg.color }}>{cfg.label}</div>
                  <div style={{ fontSize:11, color:"#475569" }}>{canal.total} leads</div>
                </div>
              </div>
              <div style={{ display:"flex", gap:16 }}>
                <div style={{ textAlign:"center" }}>
                  <div style={{ fontSize:24, fontWeight:900, color, fontFamily:"monospace" }}>{canal.eficacia}%</div>
                  <div style={{ fontSize:9, color:"#475569" }}>EFICACIA</div>
                </div>
                <div style={{ textAlign:"center" }}>
                  <div style={{ fontSize:24, fontWeight:900, color:"#10B981", fontFamily:"monospace" }}>{canal.ganados}</div>
                  <div style={{ fontSize:9, color:"#475569" }}>GANADOS</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tasa conversión por canal */}
      <div style={{ background:"#0f172a", border:"1px solid #1e3a5f", borderRadius:12, padding:16 }}>
        <div style={{ fontSize:10, fontWeight:800, color:"#475569", letterSpacing:2,
          marginBottom:14, textTransform:"uppercase" }}>Tasa de conversión por canal</div>
        {canalStats.map(({ canal, total, ganados:g, eficacia }) => {
          const cfg = getCanalCfg(canal);
          return (
            <div key={canal} style={{ marginBottom:12 }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                <span style={{ fontSize:12, color:"#94a3b8" }}>{cfg.icon} {cfg.label}</span>
                <div style={{ display:"flex", gap:12 }}>
                  <span style={{ fontSize:10, color:"#475569" }}>{total} leads · {g} ganados</span>
                  <span style={{ fontSize:12, fontWeight:800, color:cfg.color }}>{eficacia}%</span>
                </div>
              </div>
              <div style={{ height:6, background:"#1e293b", borderRadius:4 }}>
                <div style={{ height:"100%", width:`${eficacia}%`, background:cfg.color,
                  borderRadius:4, transition:"width .8s ease" }}/>
              </div>
            </div>
          );
        })}
        {canalStats.length===0 && <div style={{ color:"#334155", fontSize:12 }}>Sin datos suficientes aún</div>}
      </div>

      {/* Score promedio por etapa */}
      <div style={{ background:"#0f172a", border:"1px solid #1e3a5f", borderRadius:12, padding:16 }}>
        <div style={{ fontSize:10, fontWeight:800, color:"#475569", letterSpacing:2,
          marginBottom:14, textTransform:"uppercase" }}>Score promedio por etapa</div>
        {scoreEtapa.map(({ etapa, score, count }) => {
          const cfg = ETAPA_CFG[etapa]||{ color:"#64748b", icon:"•" };
          return (
            <div key={etapa} style={{ display:"flex", alignItems:"center", gap:12, marginBottom:8 }}>
              <div style={{ width:150, fontSize:11, color:"#64748b", flexShrink:0 }}>
                {cfg.icon} {etapa}
              </div>
              <div style={{ flex:1, height:6, background:"#1e293b", borderRadius:4 }}>
                <div style={{ height:"100%", width:`${score}%`, background:getScoreColor(score),
                  borderRadius:4, transition:"width .8s ease" }}/>
              </div>
              <div style={{ width:65, display:"flex", justifyContent:"space-between", flexShrink:0 }}>
                <span style={{ fontSize:12, fontWeight:800, color:getScoreColor(score), fontFamily:"monospace" }}>{score}</span>
                <span style={{ fontSize:10, color:"#334155" }}>({count})</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Ganados vs Perdidos */}
      <div style={{ background:"#0f172a", border:"1px solid #1e3a5f", borderRadius:12, padding:16 }}>
        <div style={{ fontSize:10, fontWeight:800, color:"#475569", letterSpacing:2,
          marginBottom:14, textTransform:"uppercase" }}>Ganados vs Perdidos</div>
        {cerrados>0 ? (
          <>
            <div style={{ display:"flex", height:24, borderRadius:10, overflow:"hidden", marginBottom:10 }}>
              <div style={{ width:`${tasaCierre}%`, background:"#10B981", transition:"width .8s ease",
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:10, fontWeight:800, color:"white" }}>
                {tasaCierre>15?`${tasaCierre}%`:""}
              </div>
              <div style={{ flex:1, background:"#EF4444", display:"flex", alignItems:"center",
                justifyContent:"center", fontSize:10, fontWeight:800, color:"white" }}>
                {100-tasaCierre>15?`${100-tasaCierre}%`:""}
              </div>
            </div>
            <div style={{ display:"flex", justifyContent:"space-between" }}>
              <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                <div style={{ width:10, height:10, borderRadius:2, background:"#10B981" }}/>
                <span style={{ fontSize:12, color:"#94a3b8" }}>Ganados: <strong style={{ color:"#10B981" }}>{ganados.length}</strong></span>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                <div style={{ width:10, height:10, borderRadius:2, background:"#EF4444" }}/>
                <span style={{ fontSize:12, color:"#94a3b8" }}>Perdidos: <strong style={{ color:"#EF4444" }}>{perdidos.length}</strong></span>
              </div>
            </div>
          </>
        ) : (
          <div style={{ color:"#334155", fontSize:12 }}>Aún no hay leads cerrados. Mueve un lead a Ganado o Perdido para ver estadísticas.</div>
        )}
      </div>
    </div>
  );
};

// ─── PANEL DETALLE LEAD ───────────────────────────────────────────────────────
const LeadPanel = ({ lead, onClose, onUpdate }) => {
  const [tab, setTab]       = useState("info");
  const [etapa, setEtapa]   = useState(lead.etapa||"Nuevo Lead");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);

  const handleEtapaChange = async (newEtapa) => {
    setEtapa(newEtapa);
    setSaving(true);
    try {
      await supabase.from("leads").update({ etapa:newEtapa }, `id=eq.${lead.id}`);
      onUpdate && onUpdate({ ...lead, etapa:newEtapa });
      setSaved(true); setTimeout(()=>setSaved(false), 2000);
    } finally { setSaving(false); }
  };

  const etapaCfg   = ETAPA_CFG[etapa]||{ color:"#64748b" };
  const scoreColor = getScoreColor(lead.score||0);

  return (
    <div style={{ position:"fixed", top:0, right:0, width:480, height:"100vh",
      background:"#0b1426", borderLeft:"1px solid #1e3a5f", display:"flex",
      flexDirection:"column", zIndex:100, boxShadow:"-30px 0 80px rgba(0,0,0,.7)" }}>

      <div style={{ padding:"18px 20px", background:"linear-gradient(135deg,#0f1f3d,#0b1426)",
        borderBottom:"1px solid #1e3a5f", flexShrink:0 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:18, fontWeight:800, color:"#f1f5f9" }}>{lead.nombre||"Sin nombre"}</div>
            <div style={{ fontSize:12, color:"#64748b", marginTop:2 }}>
              {lead.cargo?`${lead.cargo} · `:""}{lead.empresa||"Sin empresa"}
            </div>
            <div style={{ display:"flex", gap:6, marginTop:8, flexWrap:"wrap" }}>
              <CanalTag canal={lead.canal}/>
              {lead.clasificacion && (
                <Tag label={`${lead.emoji||""} ${lead.clasificacion}`}
                  color={lead.clasificacion?.includes("Caliente")?"#EF4444":
                         lead.clasificacion?.includes("Candidato")?"#F59E0B":"#F97316"}/>
              )}
            </div>
          </div>
          <div style={{ display:"flex", gap:8, alignItems:"center" }}>
            <ScoreDot score={lead.score}/>
            <button onClick={onClose} style={{ background:"#1e293b", border:"1px solid #334155",
              color:"#94a3b8", borderRadius:8, width:32, height:32, cursor:"pointer",
              fontSize:18, display:"flex", alignItems:"center", justifyContent:"center" }}>×</button>
          </div>
        </div>
        <div style={{ marginTop:12, display:"flex", gap:8, alignItems:"center" }}>
          <select value={etapa} onChange={e=>handleEtapaChange(e.target.value)}
            style={{ flex:1, background:"#0f172a", color:etapaCfg.color,
              border:`1px solid ${etapaCfg.color}44`, borderRadius:8,
              padding:"7px 12px", fontSize:12, cursor:"pointer", fontWeight:600 }}>
            {ETAPAS_TODAS.map(e=><option key={e}>{e}</option>)}
          </select>
          {saving && <span style={{ fontSize:10, color:"#3B82F6" }}>Guardando...</span>}
          {saved  && <span style={{ fontSize:10, color:"#10B981" }}>✓ Guardado</span>}
        </div>
      </div>

      <div style={{ display:"flex", background:"#0b1426", borderBottom:"1px solid #1e3a5f", flexShrink:0 }}>
        {[["info","📋 Datos"],["score","⭐ Score"],["timeline","🕐 Historial"]].map(([id,label])=>(
          <button key={id} onClick={()=>setTab(id)}
            style={{ flex:1, padding:"10px 0", background:"none", border:"none",
              borderBottom:tab===id?"2px solid #3B82F6":"2px solid transparent",
              color:tab===id?"#3B82F6":"#475569", fontSize:11, fontWeight:700,
              cursor:"pointer", letterSpacing:.5 }}>{label}</button>
        ))}
      </div>

      <div style={{ flex:1, overflow:"auto", padding:16 }}>
        {tab==="info" && (
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            <div style={{ background:"#0f172a", border:"1px solid #1e3a5f", borderRadius:10, padding:14 }}>
              <div style={{ fontSize:10, fontWeight:800, color:"#475569", letterSpacing:1,
                marginBottom:10, textTransform:"uppercase" }}>Datos de contacto</div>
              {[["📞","Teléfono",lead.telefono],["📧","Email",lead.email],
                ["📍","Zona",lead.zona],["📦","Volumen",lead.volumen],
                ["🔗","Canal",lead.canal],["📅","Captado",formatFecha(lead.created_at)],
                ["🔄","Actualizado",formatFecha(lead.updated_at)],
              ].filter(([,,v])=>v).map(([icon,k,v])=>(
                <div key={k} style={{ display:"flex", justifyContent:"space-between",
                  padding:"7px 0", borderBottom:"1px solid #1e293b" }}>
                  <span style={{ fontSize:12, color:"#475569" }}>{icon} {k}</span>
                  <span style={{ fontSize:12, color:"#e2e8f0", fontWeight:600 }}>{v}</span>
                </div>
              ))}
            </div>
            {lead.notas && (
              <div style={{ background:"#0f172a", border:"1px solid #1e3a5f", borderRadius:10, padding:14 }}>
                <div style={{ fontSize:10, fontWeight:800, color:"#475569", letterSpacing:1,
                  marginBottom:8, textTransform:"uppercase" }}>Notas</div>
                <div style={{ fontSize:12, color:"#94a3b8", lineHeight:1.6 }}>{lead.notas}</div>
              </div>
            )}
          </div>
        )}

        {tab==="score" && (
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            <div style={{ background:"#0f172a", border:`1px solid ${scoreColor}33`,
              borderRadius:10, padding:16, textAlign:"center" }}>
              <div style={{ fontSize:52, fontWeight:900, color:scoreColor, fontFamily:"monospace" }}>
                {lead.score||0}
              </div>
              <div style={{ fontSize:12, color:"#64748b", marginTop:4 }}>Score total / 100</div>
              {lead.clasificacion && (
                <div style={{ marginTop:8 }}>
                  <Tag label={`${lead.emoji||""} ${lead.clasificacion}`}
                    color={lead.clasificacion?.includes("Caliente")?"#EF4444":
                           lead.clasificacion?.includes("Candidato")?"#F59E0B":"#F97316"}/>
                </div>
              )}
            </div>
            {lead.razones_score && (
              <div style={{ background:"#0f172a", border:"1px solid #1e3a5f", borderRadius:10, padding:14 }}>
                <div style={{ fontSize:10, fontWeight:800, color:"#475569", letterSpacing:1,
                  marginBottom:10, textTransform:"uppercase" }}>Detalle del score</div>
                {lead.razones_score.split(" | ").map((r,i)=>(
                  <div key={i} style={{ display:"flex", alignItems:"flex-start", gap:8,
                    padding:"6px 0", borderBottom:"1px solid #1e293b" }}>
                    <span style={{ color:"#10B981" }}>✓</span>
                    <span style={{ fontSize:12, color:"#94a3b8" }}>{r}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab==="timeline" && (
          <div>
            {[
              { icon:"🎯", label:`Captado vía ${lead.canal||"desconocido"}`, fecha:formatFecha(lead.created_at), color:"#3B82F6" },
              lead.score>0 && { icon:"⭐", label:`Score: ${lead.score} pts → ${lead.clasificacion||""}`, fecha:formatFecha(lead.updated_at), color:getScoreColor(lead.score) },
              lead.etapa!=="Nuevo Lead" && { icon:ETAPA_CFG[lead.etapa]?.icon||"📊", label:`Etapa actual: ${lead.etapa}`, fecha:formatFecha(lead.updated_at), color:ETAPA_CFG[lead.etapa]?.color||"#64748b" },
            ].filter(Boolean).map((ev,i)=>(
              <div key={i} style={{ display:"flex", gap:12, padding:"12px 0", borderBottom:"1px solid #1e293b" }}>
                <div style={{ fontSize:18 }}>{ev.icon}</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:12, color:"#e2e8f0", fontWeight:600 }}>{ev.label}</div>
                  <div style={{ fontSize:10, color:"#475569", marginTop:2 }}>{ev.fecha}</div>
                </div>
                <div style={{ width:8, height:8, borderRadius:"50%", background:ev.color, marginTop:6, flexShrink:0 }}/>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── DASHBOARD MÉTRICAS ───────────────────────────────────────────────────────
const DashboardMetrics = ({ leads }) => {
  const hoy = new Date(); hoy.setHours(0,0,0,0);
  const nuevosHoy     = leads.filter(l=>l.created_at && new Date(l.created_at)>=hoy).length;
  const scorePromedio = leads.length ? Math.round(leads.reduce((a,l)=>a+(l.score||0),0)/leads.length) : 0;
  const ganados       = leads.filter(l=>l.etapa==="Ganado").length;
  const cerrados      = ganados + leads.filter(l=>l.etapa==="Perdido").length;
  const tasaCierre    = cerrados>0 ? Math.round((ganados/cerrados)*100) : 0;

  const canalData = Object.entries(
    leads.reduce((a,l)=>{ const c=l.canal?.toLowerCase()||"otro"; a[c]=(a[c]||0)+1; return a; },{})
  ).sort((a,b)=>b[1]-a[1]);

  const etapaData = ETAPAS_TODAS.map(e=>({
    etapa:e, count:leads.filter(l=>(l.etapa||"Nuevo Lead")===e).length,
  }));

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12 }}>
        {[
          ["👥","Total Leads",leads.length,"#3B82F6"],
          ["🆕","Nuevos hoy",nuevosHoy,"#10B981"],
          ["⭐","Score promedio",scorePromedio,"#F59E0B"],
          ["✅","Tasa de cierre",`${tasaCierre}%`,"#10B981"],
        ].map(([icon,label,val,color])=>(
          <div key={label} style={{ background:"#0f172a", border:`1px solid ${color}22`, borderRadius:12, padding:16 }}>
            <div style={{ fontSize:24 }}>{icon}</div>
            <div style={{ fontSize:30, fontWeight:900, color, fontFamily:"monospace", marginTop:6 }}>{val}</div>
            <div style={{ fontSize:11, color:"#475569", fontWeight:700, marginTop:2 }}>{label}</div>
          </div>
        ))}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
        <div style={{ background:"#0f172a", border:"1px solid #1e3a5f", borderRadius:12, padding:16 }}>
          <div style={{ fontSize:10, fontWeight:800, color:"#475569", letterSpacing:2,
            marginBottom:14, textTransform:"uppercase" }}>Leads por canal</div>
          {canalData.map(([canal,count])=>{
            const cfg=getCanalCfg(canal);
            return (
              <div key={canal} style={{ marginBottom:10 }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
                  <span style={{ fontSize:12, color:"#94a3b8" }}>{cfg.icon} {cfg.label}</span>
                  <span style={{ fontSize:12, fontWeight:800, color:cfg.color }}>{count}</span>
                </div>
                <div style={{ height:5, background:"#1e293b", borderRadius:4 }}>
                  <div style={{ height:"100%", width:`${(count/leads.length)*100}%`,
                    background:cfg.color, borderRadius:4, transition:"width .8s ease" }}/>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ background:"#0f172a", border:"1px solid #1e3a5f", borderRadius:12, padding:16 }}>
          <div style={{ fontSize:10, fontWeight:800, color:"#475569", letterSpacing:2,
            marginBottom:14, textTransform:"uppercase" }}>Pipeline por etapa</div>
          {etapaData.map(({ etapa, count })=>{
            const cfg=ETAPA_CFG[etapa]||{ color:"#64748b" };
            return (
              <div key={etapa} style={{ display:"flex", justifyContent:"space-between",
                alignItems:"center", padding:"6px 0", borderBottom:"1px solid #1e293b" }}>
                <span style={{ fontSize:11, color:"#64748b" }}>{cfg.icon} {etapa}</span>
                <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                  <div style={{ height:4, width:`${Math.max(count*10,4)}px`, maxWidth:60,
                    background:cfg.color, borderRadius:4 }}/>
                  <span style={{ fontSize:12, fontWeight:800, color:cfg.color,
                    fontFamily:"monospace", minWidth:20, textAlign:"right" }}>{count}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ background:"#0f172a", border:"1px solid #1e3a5f", borderRadius:12, padding:16 }}>
        <div style={{ fontSize:10, fontWeight:800, color:"#475569", letterSpacing:2,
          marginBottom:12, textTransform:"uppercase" }}>Leads recientes</div>
        {leads.slice(0,5).map(lead=>(
          <div key={lead.id} style={{ display:"flex", alignItems:"center", gap:12,
            padding:"9px 0", borderBottom:"1px solid #0f172a" }}>
            <div style={{ width:34, height:34, borderRadius:"50%", background:"#1e293b",
              border:"1px solid #334155", display:"flex", alignItems:"center",
              justifyContent:"center", fontSize:13, color:"#64748b", fontWeight:700, flexShrink:0 }}>
              {(lead.nombre||"?")[0].toUpperCase()}
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:12, fontWeight:700, color:"#f1f5f9",
                whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                {lead.nombre} · {lead.empresa}
              </div>
              <div style={{ fontSize:10, color:"#475569" }}>
                {lead.etapa||"Nuevo Lead"} · {formatFecha(lead.created_at)}
              </div>
            </div>
            <CanalTag canal={lead.canal}/>
            <ScoreDot score={lead.score}/>
          </div>
        ))}
        {leads.length===0 && <div style={{ color:"#334155", fontSize:12 }}>No hay leads aún</div>}
      </div>
    </div>
  );
};

// ─── TABLA LEADS ──────────────────────────────────────────────────────────────
const TablaLeads = ({ leads, onSelect }) => (
  <div style={{ background:"#0f172a", borderRadius:12, border:"1px solid #1e3a5f", overflow:"hidden" }}>
    <table style={{ width:"100%", borderCollapse:"collapse" }}>
      <thead>
        <tr style={{ background:"#070e1a" }}>
          {["Prospecto","Empresa","Canal","Etapa","Score","Clasificación","Actualizado",""].map(h=>(
            <th key={h} style={{ padding:"10px 14px", textAlign:"left", fontSize:9,
              fontWeight:800, color:"#334155", textTransform:"uppercase", letterSpacing:1 }}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {leads.map((lead,i)=>{
          const cfg=ETAPA_CFG[lead.etapa]||{ color:"#64748b", icon:"•" };
          return (
            <tr key={lead.id}
              style={{ borderTop:"1px solid #0f172a", background:i%2===0?"#0f172a":"#0b1426", cursor:"pointer" }}
              onClick={()=>onSelect(lead)}
              onMouseEnter={e=>e.currentTarget.style.background="#0f2040"}
              onMouseLeave={e=>e.currentTarget.style.background=i%2===0?"#0f172a":"#0b1426"}>
              <td style={{ padding:"10px 14px" }}>
                <div style={{ fontSize:12, fontWeight:700, color:"#f1f5f9" }}>{lead.nombre||"—"}</div>
                <div style={{ fontSize:10, color:"#334155" }}>{lead.email||"—"}</div>
              </td>
              <td style={{ padding:"10px 14px", fontSize:12, color:"#64748b" }}>{lead.empresa||"—"}</td>
              <td style={{ padding:"10px 14px" }}><CanalTag canal={lead.canal}/></td>
              <td style={{ padding:"10px 14px" }}>
                <Tag label={`${cfg.icon} ${lead.etapa||"Nuevo Lead"}`} color={cfg.color}/>
              </td>
              <td style={{ padding:"10px 14px" }}><ScoreDot score={lead.score}/></td>
              <td style={{ padding:"10px 14px" }}>
                {lead.clasificacion
                  ? <Tag label={`${lead.emoji||""} ${lead.clasificacion}`}
                      color={lead.clasificacion?.includes("Caliente")?"#EF4444":
                             lead.clasificacion?.includes("Candidato")?"#F59E0B":"#F97316"}/>
                  : <span style={{ color:"#334155", fontSize:11 }}>—</span>}
              </td>
              <td style={{ padding:"10px 14px", fontSize:11, color:"#334155" }}>{formatFecha(lead.updated_at)}</td>
              <td style={{ padding:"10px 14px" }}>
                <button onClick={e=>{ e.stopPropagation(); onSelect(lead); }}
                  style={{ background:"#1e3a5f", color:"#3B82F6", border:"none", borderRadius:6,
                    padding:"5px 10px", fontSize:11, cursor:"pointer", fontWeight:700 }}>Ver →</button>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
);

// ─── APP PRINCIPAL ─────────────────────────────────────────────────────────────
export default function App() {
  const [leads, setLeads]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [seccion, setSeccion]       = useState("dashboard");
  const [selectedLead, setSelectedLead] = useState(null);
  const [busqueda, setBusqueda]     = useState("");
  const [vista, setVista]           = useState("pipeline");
  const [lastUpdate, setLastUpdate] = useState(null);
  const refreshInterval             = useRef(null);

  const fetchLeads = async () => {
    try {
      const data = await supabase.from("leads").select("*", { order:"created_at.desc" });
      if (Array.isArray(data)) { setLeads(data); setLastUpdate(new Date()); setError(null); }
      else setError("Error al cargar leads");
    } catch { setError("Sin conexión a Supabase"); }
    finally { setLoading(false); }
  };

  useEffect(()=>{
    fetchLeads();
    refreshInterval.current = setInterval(fetchLeads, 30000);
    return () => clearInterval(refreshInterval.current);
  },[]);

  const handleEtapaChange = async (lead, nuevaEtapa) => {
    try {
      await supabase.from("leads").update({ etapa:nuevaEtapa }, `id=eq.${lead.id}`);
      setLeads(prev => prev.map(l => l.id===lead.id ? { ...l, etapa:nuevaEtapa } : l));
      if (selectedLead?.id===lead.id) setSelectedLead(p=>({ ...p, etapa:nuevaEtapa }));
    } catch(e) { console.error(e); }
  };

  const handleLeadUpdate = (updated) => {
    setLeads(prev => prev.map(l => l.id===updated.id ? updated : l));
    if (selectedLead?.id===updated.id) setSelectedLead(updated);
  };

  const filtered = leads.filter(l =>
    (l.nombre||"").toLowerCase().includes(busqueda.toLowerCase()) ||
    (l.empresa||"").toLowerCase().includes(busqueda.toLowerCase()) ||
    (l.email||"").toLowerCase().includes(busqueda.toLowerCase())
  );

  const NAV = [
    { id:"dashboard", icon:"◈", label:"Dashboard" },
    { id:"leads",     icon:"◉", label:"Leads" },
    { id:"kpis",      icon:"📊", label:"KPIs" },
  ];

  return (
    <div style={{ display:"flex", height:"100vh", background:"#070e1a",
      color:"#e2e8f0", overflow:"hidden", fontFamily:"'DM Mono','Fira Code',monospace" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Outfit:wght@400;600;700;800;900&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        ::-webkit-scrollbar{width:4px;height:4px}
        ::-webkit-scrollbar-track{background:#070e1a}
        ::-webkit-scrollbar-thumb{background:#1e3a5f;border-radius:4px}
        input,textarea,select{outline:none;font-family:inherit;}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
      `}</style>

      {/* SIDEBAR */}
      <div style={{ width:200, background:"#0b1426", borderRight:"1px solid #0f2040",
        display:"flex", flexDirection:"column", flexShrink:0 }}>
        <div style={{ padding:"20px 16px", borderBottom:"1px solid #0f2040" }}>
          <div style={{ fontSize:20, fontWeight:900, letterSpacing:-1, fontFamily:"'Outfit',sans-serif" }}>
            <span style={{ color:"#3B82F6" }}>Logi</span><span style={{ color:"#f1f5f9" }}>Flow</span>
          </div>
          <div style={{ fontSize:9, color:"#25D366", fontWeight:700, letterSpacing:2, marginTop:3 }}>CRM · LIVE</div>
        </div>

        <nav style={{ flex:1, padding:"10px 10px" }}>
          {NAV.map(item=>(
            <button key={item.id} onClick={()=>setSeccion(item.id)}
              style={{ width:"100%", display:"flex", alignItems:"center", gap:10,
                padding:"9px 12px", borderRadius:8,
                background:seccion===item.id?"#0f2040":"none",
                border:seccion===item.id?"1px solid #1e3a5f":"1px solid transparent",
                color:seccion===item.id?"#f1f5f9":"#475569",
                cursor:"pointer", fontSize:12, fontWeight:seccion===item.id?700:500,
                marginBottom:3, transition:"all .2s", textAlign:"left",
                fontFamily:"'Outfit',sans-serif" }}>
              <span style={{ fontSize:14, color:seccion===item.id?"#3B82F6":"inherit" }}>{item.icon}</span>
              {item.label}
              {item.id==="leads" && (
                <span style={{ marginLeft:"auto", background:"#3B82F622", color:"#3B82F6",
                  fontSize:9, fontWeight:800, padding:"1px 6px", borderRadius:20 }}>{leads.length}</span>
              )}
            </button>
          ))}
        </nav>

        <div style={{ padding:12, borderBottom:"1px solid #0f2040" }}>
          <button onClick={fetchLeads}
            style={{ width:"100%", background:"#0f2040", border:"1px solid #1e3a5f",
              color:"#64748b", borderRadius:8, padding:"7px", fontSize:11,
              cursor:"pointer", fontWeight:600, fontFamily:"'Outfit',sans-serif" }}>
            🔄 Actualizar
          </button>
          {lastUpdate && (
            <div style={{ fontSize:9, color:"#334155", textAlign:"center", marginTop:4 }}>
              {lastUpdate.toLocaleTimeString("es-CL",{hour:"2-digit",minute:"2-digit"})}
            </div>
          )}
        </div>

        <div style={{ padding:12 }}>
          <div style={{ background:"#0f2040", border:"1px solid #1e3a5f", borderRadius:8, padding:"8px 10px" }}>
            <div style={{ fontSize:9, color:"#334155", fontWeight:700, letterSpacing:1 }}>ESTADO DB</div>
            <div style={{ display:"flex", alignItems:"center", gap:6, marginTop:4 }}>
              <div style={{ width:6, height:6, borderRadius:"50%",
                background:error?"#EF4444":"#10B981",
                animation:error?"none":"pulse 2s infinite" }}/>
              <span style={{ fontSize:10, color:error?"#EF4444":"#10B981", fontWeight:700 }}>
                {error?"Error":"Conectado"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
        <div style={{ height:56, background:"#0b1426", borderBottom:"1px solid #0f2040",
          display:"flex", alignItems:"center", padding:"0 20px", gap:12, flexShrink:0 }}>
          <div style={{ flex:1, display:"flex", gap:10, alignItems:"center" }}>
            {seccion==="leads" && (
              <>
                <input value={busqueda} onChange={e=>setBusqueda(e.target.value)}
                  placeholder="🔍 Buscar leads..."
                  style={{ background:"#0f172a", color:"#e2e8f0", border:"1px solid #1e3a5f",
                    borderRadius:7, padding:"6px 12px", fontSize:12, width:220 }}/>
                <div style={{ display:"flex", background:"#0f172a", border:"1px solid #1e3a5f",
                  borderRadius:7, overflow:"hidden" }}>
                  {[["pipeline","⬛ Kanban"],["lista","☰ Lista"]].map(([v,label])=>(
                    <button key={v} onClick={()=>setVista(v)}
                      style={{ padding:"6px 12px", background:vista===v?"#1e3a5f":"none",
                        border:"none", color:vista===v?"#f1f5f9":"#475569",
                        cursor:"pointer", fontSize:11, fontWeight:vista===v?700:400 }}>
                      {label}
                    </button>
                  ))}
                </div>
              </>
            )}
            <div style={{ fontSize:11, color:"#1e3a5f" }}>
              {seccion==="dashboard" && "📊 Resumen en tiempo real"}
              {seccion==="leads"     && `${filtered.length} leads`}
              {seccion==="kpis"      && "📊 Análisis de performance"}
            </div>
          </div>
          <div style={{ background:"#0d2b1a", border:"1px solid #25D36633",
            borderRadius:7, padding:"5px 10px", fontSize:10, color:"#25D366", fontWeight:700 }}>
            ⚡ N8N Activo
          </div>
        </div>

        <div style={{ flex:1, overflow:"auto", padding:20 }}>
          {loading ? <Spinner/> : error ? (
            <div style={{ background:"#1a0a0a", border:"1px solid #EF444433",
              borderRadius:12, padding:24, textAlign:"center" }}>
              <div style={{ fontSize:24, marginBottom:8 }}>⚠️</div>
              <div style={{ fontSize:14, color:"#EF4444", fontWeight:700 }}>{error}</div>
              <button onClick={fetchLeads}
                style={{ marginTop:12, background:"#1e293b", color:"#94a3b8",
                  border:"1px solid #334155", borderRadius:8, padding:"8px 16px",
                  fontSize:12, cursor:"pointer" }}>Reintentar</button>
            </div>
          ) : (
            <>
              {seccion==="dashboard" && <DashboardMetrics leads={leads}/>}
              {seccion==="leads" && (
                vista==="pipeline"
                  ? <Pipeline leads={filtered} onSelect={setSelectedLead} onEtapaChange={handleEtapaChange}/>
                  : <TablaLeads leads={filtered} onSelect={setSelectedLead}/>
              )}
              {seccion==="kpis" && <KPIsView leads={leads}/>}
            </>
          )}
        </div>
      </div>

      {selectedLead && (
        <LeadPanel lead={selectedLead} onClose={()=>setSelectedLead(null)} onUpdate={handleLeadUpdate}/>
      )}
    </div>
  );
}
