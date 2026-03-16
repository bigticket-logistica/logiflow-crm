import { useState, useEffect } from "react";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://psvdtgjvognbmxfvqbaa.supabase.co";
const SUPABASE_KEY = "sb_publishable_RayW0wqgesNI6FYZ6i0CFQ_6YHaHELP";
const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

const CANALES = {
  whatsapp: { label: "WhatsApp", color: "#25D366", initial: "W" },
  facebook: { label: "Facebook", color: "#1877F2", initial: "f" },
  instagram: { label: "Instagram", color: "#E1306C", initial: "I" },
  portal: { label: "Portal web", color: "#1a3a6b", initial: "P" },
};

const VARIABLES = [
  "Tipo de vehículo","Volumen del vehículo (m³)","Cantidad de vehículos",
  "Zona de reparto","Facturación","Modalidad de pago","Disponibilidad",
  "Experiencia requerida","Rango de ingresos","Vehículo propio",
  "Licencia vigente","Disponibilidad inmediata","Conocimiento de zona",
];

function getCanal() {
  if (typeof window === "undefined") return "portal";
  const p = new URLSearchParams(window.location.search);
  return p.get("canal") || "portal";
}

function isCampActive(c) {
  if (!c.toggle_activo) return false;
  const now = new Date(); now.setHours(0,0,0,0);
  if (c.fecha_inicio && new Date(c.fecha_inicio) > now) return false;
  if (c.fecha_fin && new Date(c.fecha_fin + "T23:59:59") < now) return false;
  return true;
}

function getDiasRestantes(fechaFin) {
  if (!fechaFin) return null;
  const diff = Math.ceil((new Date(fechaFin) - new Date()) / (1000*60*60*24));
  return diff > 0 ? diff : 0;
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=DM+Mono:wght@400;500&display=swap');
  *{box-sizing:border-box;margin:0;padding:0;}
  body{font-family:'DM Sans',sans-serif;background:#f0f2f5;}
  .topbar{background:#1a3a6b;padding:12px 20px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:10;}
  .logo{color:#fff;font-size:16px;font-weight:600;letter-spacing:-0.3px;}
  .logo span{color:#F47B20;}
  .tag-op{background:#F47B20;color:#fff;font-size:11px;padding:3px 10px;border-radius:20px;font-weight:500;}
  .canal-badge{font-size:11px;padding:3px 10px;border-radius:20px;background:rgba(255,255,255,0.15);color:#fff;}
  .btn-ghost-white{background:transparent;color:#fff;border:0.5px solid rgba(255,255,255,0.3);border-radius:8px;padding:6px 12px;font-size:12px;cursor:pointer;font-family:'DM Sans',sans-serif;}
  .btn-ghost-white:hover{background:rgba(255,255,255,0.1);}
  .pg{padding:20px;max-width:960px;margin:0 auto;}
  .sec-title{font-size:20px;font-weight:600;color:#1a1a1a;margin-bottom:4px;}
  .sec-sub{font-size:13px;color:#666;margin-bottom:20px;}
  .libre-card{background:#fff;border:1.5px dashed #d0d5dd;border-radius:14px;padding:24px;text-align:center;margin-bottom:28px;}
  .libre-title{font-size:15px;font-weight:600;color:#1a1a1a;margin-bottom:6px;}
  .libre-sub{font-size:13px;color:#666;margin-bottom:16px;}
  .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px;margin-bottom:28px;}
  .camp-card{background:#fff;border:0.5px solid #e4e7ec;border-radius:14px;padding:18px;transition:border-color 0.15s,transform 0.1s;}
  .camp-card:hover{border-color:#F47B20;transform:translateY(-1px);}
  .camp-card-title{font-size:14px;font-weight:600;color:#1a1a1a;flex:1;margin-right:8px;}
  .badge-active{font-size:11px;padding:3px 8px;border-radius:20px;background:#dcfce7;color:#166534;white-space:nowrap;}
  .badge-days{font-size:11px;padding:3px 8px;border-radius:20px;background:#dbeafe;color:#1e40af;white-space:nowrap;}
  .tags{display:flex;flex-wrap:wrap;gap:6px;margin:10px 0;}
  .ctag{font-size:11px;padding:3px 8px;border-radius:6px;background:#f4f5f7;color:#555;}
  .date-note{font-size:11px;color:#e65100;margin-top:6px;}
  .btn-orange{background:#F47B20;color:#fff;border:none;border-radius:10px;padding:11px 20px;font-size:13px;font-weight:600;cursor:pointer;width:100%;margin-top:14px;font-family:'DM Sans',sans-serif;transition:background 0.15s;}
  .btn-orange:hover{background:#d96a10;}
  .btn-orange:disabled{background:#ccc;cursor:not-allowed;}
  .btn-blue{background:#1a3a6b;color:#fff;border:none;border-radius:10px;padding:11px 20px;font-size:13px;font-weight:600;cursor:pointer;font-family:'DM Sans',sans-serif;transition:background 0.15s;}
  .btn-blue:hover{background:#142d54;}
  .btn-back{background:transparent;border:none;cursor:pointer;font-size:13px;color:#1a3a6b;font-weight:600;font-family:'DM Sans',sans-serif;padding:0;display:flex;align-items:center;gap:4px;}
  .btn-danger{background:transparent;color:#c0392b;border:0.5px solid #f5a7a7;border-radius:8px;padding:5px 10px;font-size:12px;cursor:pointer;font-family:'DM Sans',sans-serif;}
  .btn-danger:hover{background:#fff5f5;}
  .detail-header{background:#fff;border-bottom:0.5px solid #e4e7ec;padding:14px 20px;display:flex;align-items:center;gap:12px;position:sticky;top:56px;z-index:9;}
  .form-card{background:#fff;border:0.5px solid #e4e7ec;border-radius:14px;padding:20px;margin-bottom:16px;}
  .form-title{font-size:14px;font-weight:600;color:#1a1a1a;margin-bottom:14px;}
  .field-row{margin-bottom:14px;}
  .field-label{font-size:12px;color:#555;margin-bottom:4px;display:block;font-weight:500;}
  input,select,textarea{width:100%;padding:9px 12px;border:0.5px solid #d0d5dd;border-radius:8px;font-size:13px;background:#fff;color:#1a1a1a;font-family:'DM Sans',sans-serif;outline:none;transition:border-color 0.15s;}
  input:focus,select:focus,textarea:focus{border-color:#1a3a6b;}
  textarea{height:80px;resize:none;}
  .two-col{display:grid;grid-template-columns:1fr 1fr;gap:12px;}
  .canal-info{background:#eef2ff;border-radius:10px;padding:10px 14px;margin-bottom:16px;display:flex;align-items:center;gap:10px;}
  .canal-icon{width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:600;color:#fff;flex-shrink:0;}
  .canal-label{font-size:12px;font-weight:600;color:#1a3a6b;}
  .canal-sub{font-size:11px;color:#666;}
  .success-wrap{max-width:440px;margin:60px auto;padding:20px;}
  .success-card{background:#fff;border-radius:16px;padding:40px 32px;text-align:center;border:0.5px solid #e4e7ec;}
  .success-icon{width:56px;height:56px;background:#dcfce7;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 16px;font-size:24px;color:#166534;}
  .admin-nav{display:flex;gap:6px;padding:12px 20px;background:#fff;border-bottom:0.5px solid #e4e7ec;overflow-x:auto;}
  .nav-btn{padding:7px 14px;font-size:13px;border-radius:8px;border:none;cursor:pointer;background:transparent;color:#666;font-family:'DM Sans',sans-serif;white-space:nowrap;}
  .nav-btn.active{background:#eef2ff;color:#1a3a6b;font-weight:600;}
  .camp-row{background:#fff;border:0.5px solid #e4e7ec;border-radius:10px;padding:14px 16px;margin-bottom:10px;display:flex;align-items:center;justify-content:space-between;gap:12px;}
  .camp-row-title{font-size:14px;font-weight:600;color:#1a1a1a;}
  .camp-row-meta{font-size:12px;color:#888;margin-top:2px;}
  .toggle{width:40px;height:22px;border-radius:11px;border:none;cursor:pointer;position:relative;flex-shrink:0;}
  .toggle.on{background:#2e7d32;}.toggle.off{background:#c0392b;}
  .toggle-dot{width:16px;height:16px;background:#fff;border-radius:50%;position:absolute;top:3px;transition:left 0.2s;}
  .toggle.on .toggle-dot{left:21px;}.toggle.off .toggle-dot{left:3px;}
  .fb-grid{display:grid;grid-template-columns:1fr 1fr 70px 32px;gap:8px;align-items:center;}
  .fb-row{background:#f8f9fa;border-radius:8px;padding:10px 12px;margin-bottom:8px;}
  .fb-remove{background:transparent;border:none;cursor:pointer;font-size:18px;color:#aaa;font-family:'DM Sans',sans-serif;}
  .fb-remove:hover{color:#c0392b;}
  .fb-header{display:grid;grid-template-columns:1fr 1fr 70px 32px;gap:8px;margin-bottom:6px;}
  .fb-header span{font-size:11px;color:#888;font-weight:500;}
  .add-field-btn{font-size:12px;color:#1a3a6b;background:transparent;border:1px dashed #1a3a6b;border-radius:8px;padding:8px 14px;cursor:pointer;width:100%;margin-top:4px;font-family:'DM Sans',sans-serif;}
  .score-bar{display:flex;align-items:center;justify-content:space-between;border-radius:10px;padding:10px 14px;margin-top:12px;}
  .score-ok{background:#dcfce7;}.score-warn{background:#fef3c7;}.score-over{background:#fee2e2;}
  .score-label{font-size:13px;font-weight:600;}
  .score-val{font-size:20px;font-weight:700;}
  .score-warn-msg{font-size:12px;color:#c0392b;margin-top:6px;display:none;}
  .post-row{background:#fff;border:0.5px solid #e4e7ec;border-radius:10px;padding:12px 16px;margin-bottom:8px;display:flex;align-items:center;gap:12px;}
  .ch-dot{width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:600;color:#fff;flex-shrink:0;}
  .stat-card{background:#fff;border:0.5px solid #e4e7ec;border-radius:12px;padding:16px;text-align:center;}
  .stat-val{font-size:26px;font-weight:700;color:#1a3a6b;}
  .stat-label{font-size:12px;color:#888;margin-top:4px;}
  .url-row{display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:0.5px solid #f0f0f0;}
  .url-text{font-size:11px;color:#888;font-family:'DM Mono',monospace;}
  .country-card{background:#fff;border:0.5px solid #e4e7ec;border-radius:14px;padding:28px 20px;text-align:center;cursor:pointer;transition:border-color 0.15s,transform 0.1s;}
  .country-card:hover{border-color:#F47B20;transform:translateY(-1px);}
  .loading{text-align:center;padding:40px;color:#888;font-size:14px;}
  .empty{text-align:center;padding:32px;color:#888;font-size:13px;background:#fff;border-radius:12px;border:0.5px dashed #e4e7ec;}
`;

// ─── COMPONENTS ───────────────────────────────────────────────────────────────

function CanalInfo({ canal }) {
  const c = CANALES[canal] || CANALES.portal;
  return (
    <div className="canal-info">
      <div className="canal-icon" style={{ background: c.color }}>{c.initial}</div>
      <div>
        <div className="canal-label">Canal: {c.label}</div>
        <div className="canal-sub">Se registra automáticamente en CRM LogiFlow</div>
      </div>
    </div>
  );
}

function Toggle({ on, onChange }) {
  return (
    <button className={`toggle ${on ? "on" : "off"}`} onClick={onChange}>
      <div className="toggle-dot" />
    </button>
  );
}

// ─── VIEWS ────────────────────────────────────────────────────────────────────

function ViewCountry({ op, onSelect }) {
  return (
    <div>
      <div className="topbar">
        <span className="logo"><span>big</span>ticket</span>
      </div>
      <div className="pg" style={{ maxWidth: 440, paddingTop: 48 }}>
        <div className="sec-title" style={{ textAlign: "center", marginBottom: 6 }}>Selecciona tu operación</div>
        <div className="sec-sub" style={{ textAlign: "center" }}>¿En qué país trabajarás?</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {["Chile", "México"].map(c => (
            <div key={c} className="country-card" onClick={() => onSelect(c)}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>{c === "Chile" ? "🇨🇱" : "🇲🇽"}</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: "#1a1a1a" }}>{c}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ViewPortal({ op, canal, campaigns, loading, onChangePais, onDetail, onLibre }) {
  const active = campaigns.filter(c => isCampActive(c) && c.pais === op);
  const ch = CANALES[canal] || CANALES.portal;
  return (
    <div>
      <div className="topbar">
        <span className="logo"><span>big</span>ticket — Portal terceros</span>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span className="tag-op">{op}</span>
          <span className="canal-badge">{ch.label}</span>
          <button className="btn-ghost-white" onClick={onChangePais}>Cambiar</button>
        </div>
      </div>
      <div className="pg">
        <div className="libre-card">
          <div className="libre-title">Postulación abierta permanente</div>
          <div className="libre-sub">¿No ves una campaña que se ajuste? Postula igual — te contactaremos cuando surja una oportunidad.</div>
          <button className="btn-orange" style={{ maxWidth: 220, margin: "0 auto" }} onClick={onLibre}>Postular ahora</button>
        </div>
        <div className="sec-title">Campañas activas</div>
        <div className="sec-sub">Selecciona una campaña para ver los detalles y postular</div>
        {loading ? <div className="loading">Cargando campañas...</div> :
          active.length === 0 ? <div className="empty">No hay campañas activas para esta operación ahora mismo.</div> :
          <div className="grid">
            {active.map(c => {
              const dias = getDiasRestantes(c.fecha_fin);
              return (
                <div key={c.id} className="camp-card">
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10 }}>
                    <span className="camp-card-title">{c.nombre}</span>
                    {dias !== null ? <span className="badge-days">{dias} días</span> : <span className="badge-active">Activa</span>}
                  </div>
                  <div className="tags">
                    {[c.vehiculo, c.volumen_m3, c.zona, c.disponibilidad].filter(Boolean).map((t, i) => <span key={i} className="ctag">{t}</span>)}
                  </div>
                  {c.fecha_fin && <div className="date-note">Cierra el {c.fecha_fin}</div>}
                  <button className="btn-orange" onClick={() => onDetail(c)}>Ver detalles y postular</button>
                </div>
              );
            })}
          </div>
        }
      </div>
    </div>
  );
}

function ViewDetail({ camp, canal, onBack, onPostular }) {
  const dias = getDiasRestantes(camp.fecha_fin);
  const rows = [
    ["Tipo de vehículo", camp.vehiculo],
    ["Volumen del vehículo", camp.volumen_m3],
    ["Cantidad requerida", camp.cantidad ? `${camp.cantidad} vehículos` : null],
    ["Zona de reparto", camp.zona],
    ["Facturación", camp.factura],
    ["Modalidad de pago", camp.modalidad_pago],
    ["Disponibilidad", camp.disponibilidad],
    ["Experiencia requerida", camp.experiencia_anios != null ? `${camp.experiencia_anios} año(s)` : null],
    ["Ingresos estimados", camp.ingreso_rango],
    camp.fecha_fin ? ["Cierre de campaña", `${camp.fecha_fin}${dias !== null ? ` (${dias} días restantes)` : ""}`] : null,
  ].filter(Boolean);
  return (
    <div>
      <div className="detail-header">
        <button className="btn-back" onClick={onBack}>← Volver</button>
        <span style={{ fontSize: 15, fontWeight: 600, color: "#1a1a1a" }}>{camp.nombre}</span>
      </div>
      <div className="pg">
        <div className="form-card">
          <div className="form-title">Detalles de la campaña</div>
          <div className="two-col">
            {rows.map(([label, val]) => val ? (
              <div key={label}>
                <span className="field-label">{label}</span>
                <p style={{ fontSize: 13, color: "#1a1a1a", marginTop: 2 }}>{val}</p>
              </div>
            ) : null)}
          </div>
          {camp.descripcion && (
            <div style={{ marginTop: 12 }}>
              <span className="field-label">Descripción</span>
              <p style={{ fontSize: 13, color: "#1a1a1a", marginTop: 2 }}>{camp.descripcion}</p>
            </div>
          )}
        </div>
        <button className="btn-orange" onClick={onPostular}>Postular a esta campaña</button>
      </div>
    </div>
  );
}

function ViewForm({ camp, canal, op, onBack, onSuccess }) {
  const [form, setForm] = useState({ nombre: "", rut: "", telefono: "", email: "" });
  const [respuestas, setRespuestas] = useState({});
  const [loading, setLoading] = useState(false);
  const [vars, setVars] = useState([]);
  const isLibre = !camp;

  useEffect(() => {
    if (camp) loadVars();
  }, [camp]);

  async function loadVars() {
    const { data } = await sb.from("campana_variables").select("*").eq("campana_id", camp.id).order("orden");
    setVars(data || []);
  }

  function calcScore() {
    if (isLibre) return 0;
    return vars.reduce((sum, v) => {
      const r = respuestas[v.id];
      return sum + (r && r.trim() ? v.puntos : 0);
    }, 0);
  }

  async function submit() {
    if (!form.nombre || !form.telefono) { alert("Completa nombre y teléfono."); return; }
    setLoading(true);
    try {
      const score = calcScore();
      const { data: lead, error: le } = await sb.from("leads").insert({
        nombre: form.nombre,
        telefono: form.telefono,
        email: form.email || null,
        canal,
        pais: op,
        score,
        clasificacion: score >= 70 ? "Caliente" : score >= 40 ? "Tibio" : "Frío",
        etapa: "Nuevo",
        origen: isLibre ? "Postulación libre" : `Campaña: ${camp.nombre}`,
        campana_id: camp?.id || null,
      }).select().single();
      if (le) throw le;
      await sb.from("postulaciones").insert({
        campana_id: camp?.id || null,
        lead_id: lead.id,
        tipo: isLibre ? "libre" : "campaña",
        canal,
        pais: op,
        score_calculado: score,
        respuestas: isLibre ? {} : respuestas,
      });
      onSuccess();
    } catch (e) {
      alert("Error al enviar: " + e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="detail-header">
        <button className="btn-back" onClick={onBack}>← Volver</button>
        <span style={{ fontSize: 15, fontWeight: 600, color: "#1a1a1a" }}>
          {isLibre ? "Postulación abierta" : `Postular: ${camp.nombre}`}
        </span>
      </div>
      <div className="pg">
        <CanalInfo canal={canal} />
        <div className="form-card">
          <div className="form-title">Datos personales</div>
          <div className="two-col">
            <div className="field-row"><span className="field-label">Nombre completo *</span><input value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} placeholder="Tu nombre" /></div>
            <div className="field-row"><span className="field-label">RUT / CURP</span><input value={form.rut} onChange={e => setForm({...form, rut: e.target.value})} placeholder="Identificación" /></div>
          </div>
          <div className="two-col">
            <div className="field-row"><span className="field-label">Teléfono WhatsApp *</span><input value={form.telefono} onChange={e => setForm({...form, telefono: e.target.value})} placeholder="+56 9..." /></div>
            <div className="field-row"><span className="field-label">Correo electrónico</span><input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="correo@..." /></div>
          </div>
        </div>
        {isLibre ? (
          <div className="form-card">
            <div className="form-title">Tu vehículo y disponibilidad</div>
            <div className="two-col">
              <div className="field-row"><span className="field-label">Tipo de vehículo</span>
                <select value={respuestas.vehiculo || ""} onChange={e => setRespuestas({...respuestas, vehiculo: e.target.value})}>
                  <option value="">-- Seleccionar --</option>
                  {["Moto","Auto","Furgón","Camión"].map(v => <option key={v}>{v}</option>)}
                </select>
              </div>
              <div className="field-row"><span className="field-label">Volumen (m³)</span>
                <select value={respuestas.volumen || ""} onChange={e => setRespuestas({...respuestas, volumen: e.target.value})}>
                  <option value="">-- Seleccionar --</option>
                  {["1 m³","2 m³","3 m³","4 m³","6 m³","8 m³","9 m³","12 m³","16 m³","20 m³","24 m³","Más de 24 m³"].map(v => <option key={v}>{v}</option>)}
                </select>
              </div>
            </div>
            <div className="two-col">
              <div className="field-row"><span className="field-label">Zona donde opera</span><input value={respuestas.zona || ""} onChange={e => setRespuestas({...respuestas, zona: e.target.value})} placeholder="Ej: Santiago Norte" /></div>
              <div className="field-row"><span className="field-label">Disponibilidad</span>
                <select value={respuestas.disp || ""} onChange={e => setRespuestas({...respuestas, disp: e.target.value})}>
                  <option value="">-- Seleccionar --</option>
                  {["Diurno","Nocturno","Mixto"].map(v => <option key={v}>{v}</option>)}
                </select>
              </div>
            </div>
            <div className="two-col">
              <div className="field-row"><span className="field-label">¿Vehículo propio?</span>
                <select value={respuestas.propio || ""} onChange={e => setRespuestas({...respuestas, propio: e.target.value})}>
                  <option value="">-- Seleccionar --</option>
                  <option>Sí, vehículo propio</option><option>No, arrendado</option>
                </select>
              </div>
              <div className="field-row"><span className="field-label">¿Emite factura?</span>
                <select value={respuestas.factura || ""} onChange={e => setRespuestas({...respuestas, factura: e.target.value})}>
                  <option value="">-- Seleccionar --</option>
                  <option>Sí, emito factura</option><option>No emito factura</option>
                </select>
              </div>
            </div>
            <div className="field-row"><span className="field-label">Experiencia en reparto</span>
              <select value={respuestas.exp || ""} onChange={e => setRespuestas({...respuestas, exp: e.target.value})}>
                <option value="">-- Seleccionar --</option>
                {["Sin experiencia","Menos de 1 año","1 a 2 años","3 a 5 años","Más de 5 años"].map(v => <option key={v}>{v}</option>)}
              </select>
            </div>
            <div className="field-row"><span className="field-label">Comentario (opcional)</span>
              <textarea value={respuestas.comentario || ""} onChange={e => setRespuestas({...respuestas, comentario: e.target.value})} placeholder="Cuéntanos algo más..." />
            </div>
          </div>
        ) : vars.length > 0 && (
          <div className="form-card">
            <div className="form-title">Preguntas de la campaña</div>
            {vars.map(v => (
              <div key={v.id} className="field-row">
                <span className="field-label">{v.pregunta}</span>
                <input value={respuestas[v.id] || ""} onChange={e => setRespuestas({...respuestas, [v.id]: e.target.value})} placeholder="Tu respuesta" />
              </div>
            ))}
          </div>
        )}
        <button className="btn-orange" onClick={submit} disabled={loading}>
          {loading ? "Enviando..." : "Enviar postulación"}
        </button>
      </div>
    </div>
  );
}

function ViewSuccess({ onVolver }) {
  return (
    <div>
      <div className="topbar"><span className="logo"><span>big</span>ticket</span></div>
      <div className="success-wrap">
        <div className="success-card">
          <div className="success-icon">✓</div>
          <div style={{ fontSize: 17, fontWeight: 700, color: "#166534", marginBottom: 8 }}>Postulación enviada</div>
          <div style={{ fontSize: 13, color: "#555", marginBottom: 24 }}>Tus datos fueron recibidos y registrados en nuestro sistema. Te contactaremos por WhatsApp a la brevedad.</div>
          <button className="btn-orange" style={{ maxWidth: 200, margin: "0 auto" }} onClick={onVolver}>Volver al inicio</button>
        </div>
      </div>
    </div>
  );
}

// ─── ADMIN ────────────────────────────────────────────────────────────────────

function AdminPanel({ onClose, campaigns, setCampaigns }) {
  const [tab, setTab] = useState("camps");
  const [postulaciones, setPostulaciones] = useState([]);
  const [loadingPost, setLoadingPost] = useState(false);

  useEffect(() => {
    if (tab === "postulaciones") loadPost();
  }, [tab]);

  async function loadPost() {
    setLoadingPost(true);
    const { data } = await sb.from("postulaciones").select("*, leads(nombre,telefono), campanas(nombre)").order("created_at", { ascending: false }).limit(50);
    setPostulaciones(data || []);
    setLoadingPost(false);
  }

  async function toggleCamp(camp) {
    const newVal = !camp.toggle_activo;
    await sb.from("campanas").update({ toggle_activo: newVal }).eq("id", camp.id);
    setCampaigns(campaigns.map(c => c.id === camp.id ? { ...c, toggle_activo: newVal } : c));
  }

  async function deleteCamp(id) {
    if (!confirm("¿Eliminar esta campaña? No se puede deshacer.")) return;
    await sb.from("campanas").delete().eq("id", id);
    setCampaigns(campaigns.filter(c => c.id !== id));
  }

  return (
    <div>
      <div className="admin-topbar" style={{ background: "#1a3a6b", padding: "12px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ color: "#fff", fontSize: 15, fontWeight: 600 }}>Panel administrador</div>
          <div style={{ color: "#aac3e8", fontSize: 12 }}>BigTicket — Gestión de campañas</div>
        </div>
        <button className="btn-ghost-white" onClick={onClose}>Ver portal →</button>
      </div>
      <div className="admin-nav">
        {[["camps","Campañas"],["nueva","Nueva campaña"],["postulaciones","Postulaciones"],["canales","Canales"]].map(([k,l]) => (
          <button key={k} className={`nav-btn ${tab===k?"active":""}`} onClick={() => setTab(k)}>{l}</button>
        ))}
      </div>
      <div className="pg">
        {tab === "camps" && (
          <div>
            <div className="sec-title" style={{ marginBottom: 16 }}>Campañas creadas</div>
            {campaigns.length === 0 ? <div className="empty">No hay campañas. Crea una desde la pestaña "Nueva campaña".</div> :
              campaigns.map(c => {
                const active = isCampActive(c);
                return (
                  <div key={c.id} className="camp-row">
                    <div style={{ flex: 1 }}>
                      <div className="camp-row-title">{c.nombre}
                        <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 20, marginLeft: 8, background: active ? "#dcfce7" : "#fee2e2", color: active ? "#166534" : "#c0392b" }}>
                          {active ? "Activa" : "Inactiva"}
                        </span>
                      </div>
                      <div className="camp-row-meta">{c.pais} · {c.vehiculo} · {c.volumen_m3} · Score: {c.score_max} pts{c.fecha_inicio ? ` · ${c.fecha_inicio} → ${c.fecha_fin}` : ""}</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <Toggle on={c.toggle_activo} onChange={() => toggleCamp(c)} />
                      <button className="btn-danger" onClick={() => deleteCamp(c.id)}>Eliminar</button>
                    </div>
                  </div>
                );
              })
            }
          </div>
        )}
        {tab === "nueva" && <NuevaCampana campaigns={campaigns} setCampaigns={setCampaigns} onDone={() => setTab("camps")} />}
        {tab === "postulaciones" && (
          <div>
            <div className="sec-title" style={{ marginBottom: 4 }}>Postulaciones recibidas</div>
            <div className="sec-sub">Todas migran automáticamente al pipeline de LogiFlow CRM</div>
            {loadingPost ? <div className="loading">Cargando...</div> :
              postulaciones.length === 0 ? <div className="empty">No hay postulaciones aún.</div> :
              postulaciones.map(p => {
                const ch = CANALES[p.canal] || CANALES.portal;
                return (
                  <div key={p.id} className="post-row">
                    <div className="ch-dot" style={{ background: ch.color }}>{ch.initial}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "#1a1a1a" }}>{p.leads?.nombre || "Sin nombre"}</div>
                      <div style={{ fontSize: 12, color: "#888" }}>{p.campanas?.nombre || "Postulación libre"} · {ch.label} · {new Date(p.created_at).toLocaleDateString("es-CL")}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 16, fontWeight: 700, color: "#1a3a6b" }}>{p.score_calculado} pts</div>
                      <div style={{ fontSize: 11, color: "#888" }}>CRM LogiFlow</div>
                    </div>
                  </div>
                );
              })
            }
          </div>
        )}
        {tab === "canales" && <CanalesView postulaciones={postulaciones} onLoad={loadPost} />}
      </div>
    </div>
  );
}

function NuevaCampana({ campaigns, setCampaigns, onDone }) {
  const empty = { nombre:"", pais:"Chile", vehiculo:"Furgón", volumen_m3:"", cantidad:"", zona:"", factura:"Sí requiere factura", modalidad_pago:"Semanal", disponibilidad:"Diurno", experiencia_anios:"0", ingreso_rango:"", descripcion:"", fecha_inicio:"", fecha_fin:"" };
  const [f, setF] = useState(empty);
  const [scoreFields, setScoreFields] = useState([{ id: Date.now(), variable: "", pregunta: "", puntos: 10 }]);
  const [saving, setSaving] = useState(false);

  function upd(k, v) { setF(prev => ({ ...prev, [k]: v })); }
  function totalScore() { return scoreFields.reduce((s, r) => s + (parseInt(r.puntos) || 0), 0); }
  function usedVars() { return scoreFields.map(r => r.variable).filter(Boolean); }

  function addField() {
    if (totalScore() >= 100) { alert("Ya alcanzaste 100 puntos."); return; }
    setScoreFields([...scoreFields, { id: Date.now(), variable: "", pregunta: "", puntos: 10 }]);
  }
  function removeField(id) { setScoreFields(scoreFields.filter(r => r.id !== id)); }
  function updateField(id, k, v) { setScoreFields(scoreFields.map(r => r.id === id ? { ...r, [k]: v } : r)); }

  async function save() {
    if (!f.nombre) { alert("Ingresa el nombre de la campaña."); return; }
    const total = totalScore();
    if (total > 100) { alert("El score supera 100 puntos."); return; }
    if (f.fecha_inicio && f.fecha_fin && f.fecha_inicio > f.fecha_fin) { alert("La fecha inicio no puede ser mayor a la fecha fin."); return; }
    setSaving(true);
    try {
      const autoOn = !f.fecha_inicio || new Date(f.fecha_inicio) <= new Date();
      const { data: camp, error } = await sb.from("campanas").insert({
        nombre: f.nombre, pais: f.pais, vehiculo: f.vehiculo,
        volumen_m3: f.volumen_m3 || null, cantidad: parseInt(f.cantidad) || null,
        zona: f.zona || null, factura: f.factura.includes("Sí") ? "Sí" : "No",
        modalidad_pago: f.modalidad_pago, disponibilidad: f.disponibilidad,
        experiencia_anios: parseInt(f.experiencia_anios) || 0,
        ingreso_rango: f.ingreso_rango || null, descripcion: f.descripcion || null,
        toggle_activo: autoOn, fecha_inicio: f.fecha_inicio || null,
        fecha_fin: f.fecha_fin || null, score_max: total,
      }).select().single();
      if (error) throw error;
      const validFields = scoreFields.filter(r => r.variable && r.pregunta);
      if (validFields.length > 0) {
        await sb.from("campana_variables").insert(
          validFields.map((r, i) => ({ campana_id: camp.id, variable: r.variable, pregunta: r.pregunta, puntos: parseInt(r.puntos) || 0, orden: i }))
        );
      }
      setCampaigns([...campaigns, camp]);
      alert(`Campaña "${f.nombre}" creada exitosamente.`);
      onDone();
    } catch (e) {
      alert("Error: " + e.message);
    } finally {
      setSaving(false);
    }
  }

  const total = totalScore();
  const scoreClass = total > 100 ? "score-bar score-over" : total >= 80 ? "score-bar score-warn" : "score-bar score-ok";
  const scoreColor = total > 100 ? "#c0392b" : total >= 80 ? "#e65100" : "#166534";

  return (
    <div>
      <div className="sec-title" style={{ marginBottom: 4 }}>Crear nueva campaña</div>
      <div className="sec-sub">Define los campos, fechas y puntaje interno — todo migra a CRM LogiFlow</div>
      <div className="form-card">
        <div className="form-title">Información general</div>
        <div className="field-row"><span className="field-label">Nombre de la campaña</span><input value={f.nombre} onChange={e => upd("nombre", e.target.value)} placeholder="Ej: Conductores zona norte" /></div>
        <div className="two-col">
          <div className="field-row"><span className="field-label">País</span><select value={f.pais} onChange={e => upd("pais", e.target.value)}><option>Chile</option><option>México</option></select></div>
          <div className="field-row"><span className="field-label">Tipo de vehículo</span><select value={f.vehiculo} onChange={e => upd("vehiculo", e.target.value)}>{["Moto","Auto","Furgón","Camión"].map(v => <option key={v}>{v}</option>)}</select></div>
        </div>
        <div className="two-col">
          <div className="field-row"><span className="field-label">Volumen del vehículo (m³)</span>
            <select value={f.volumen_m3} onChange={e => upd("volumen_m3", e.target.value)}>
              <option value="">-- Seleccionar --</option>
              {["1 m³","2 m³","3 m³","4 m³","6 m³","8 m³","9 m³","12 m³","16 m³","20 m³","24 m³","Más de 24 m³"].map(v => <option key={v}>{v}</option>)}
            </select>
          </div>
          <div className="field-row"><span className="field-label">Cantidad de vehículos</span><input type="number" value={f.cantidad} onChange={e => upd("cantidad", e.target.value)} placeholder="10" /></div>
        </div>
        <div className="two-col">
          <div className="field-row"><span className="field-label">Zona de reparto</span><input value={f.zona} onChange={e => upd("zona", e.target.value)} placeholder="Ej: RM Norte" /></div>
          <div className="field-row"><span className="field-label">Factura</span><select value={f.factura} onChange={e => upd("factura", e.target.value)}><option>Sí requiere factura</option><option>No requiere factura</option></select></div>
        </div>
        <div className="two-col">
          <div className="field-row"><span className="field-label">Modalidad de pago</span><select value={f.modalidad_pago} onChange={e => upd("modalidad_pago", e.target.value)}>{["Semanal","Quincenal","Mensual"].map(v => <option key={v}>{v}</option>)}</select></div>
          <div className="field-row"><span className="field-label">Disponibilidad</span><select value={f.disponibilidad} onChange={e => upd("disponibilidad", e.target.value)}>{["Diurno","Nocturno","Mixto"].map(v => <option key={v}>{v}</option>)}</select></div>
        </div>
        <div className="two-col">
          <div className="field-row"><span className="field-label">Experiencia (años)</span><input type="number" value={f.experiencia_anios} onChange={e => upd("experiencia_anios", e.target.value)} /></div>
          <div className="field-row"><span className="field-label">Rango de ingresos</span><input value={f.ingreso_rango} onChange={e => upd("ingreso_rango", e.target.value)} placeholder="Ej: 600.000 - 900.000" /></div>
        </div>
        <div className="field-row"><span className="field-label">Descripción</span><textarea value={f.descripcion} onChange={e => upd("descripcion", e.target.value)} placeholder="Detalles..." /></div>
      </div>
      <div className="form-card">
        <div className="form-title">Vigencia de la campaña</div>
        <div style={{ fontSize: 12, color: "#666", marginBottom: 14 }}>Se activa automáticamente en la fecha inicio y se desactiva en la fecha fin. El toggle permite control manual.</div>
        <div className="two-col">
          <div className="field-row"><span className="field-label">Fecha de inicio</span><input type="date" value={f.fecha_inicio} onChange={e => upd("fecha_inicio", e.target.value)} /></div>
          <div className="field-row"><span className="field-label">Fecha de cierre</span><input type="date" value={f.fecha_fin} onChange={e => upd("fecha_fin", e.target.value)} /></div>
        </div>
        <div style={{ background: "#eef2ff", borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "#1a3a6b" }}>Sin fechas, la campaña se controla solo con el toggle manual.</div>
      </div>
      <div className="form-card">
        <div className="form-title">Puntaje por variable (interno CRM)</div>
        <div style={{ fontSize: 12, color: "#666", marginBottom: 14 }}>Cada variable solo puede usarse una vez. Máximo 100 puntos. El postulante no ve estos puntajes.</div>
        <div className="fb-header"><span>Variable</span><span>Pregunta al postulante</span><span>Puntos</span><span></span></div>
        {scoreFields.map(r => (
          <div key={r.id} className="fb-row">
            <div className="fb-grid">
              <select value={r.variable} onChange={e => updateField(r.id, "variable", e.target.value)} style={{ fontSize: 12 }}>
                <option value="">-- Seleccionar --</option>
                {VARIABLES.filter(v => v === r.variable || !usedVars().includes(v)).map(v => <option key={v}>{v}</option>)}
              </select>
              <input value={r.pregunta} onChange={e => updateField(r.id, "pregunta", e.target.value)} placeholder="Pregunta" style={{ fontSize: 12 }} />
              <input type="number" value={r.puntos} min={1} max={100} onChange={e => updateField(r.id, "puntos", e.target.value)} style={{ fontSize: 12 }} />
              <button className="fb-remove" onClick={() => removeField(r.id)}>×</button>
            </div>
          </div>
        ))}
        <button className="add-field-btn" onClick={addField}>+ Agregar variable</button>
        {total > 100 && <div style={{ fontSize: 12, color: "#c0392b", marginTop: 6 }}>La suma supera 100 puntos. Ajusta los valores.</div>}
        <div className={scoreClass}>
          <span className="score-label" style={{ color: scoreColor }}>Score total — CRM LogiFlow</span>
          <span className="score-val" style={{ color: scoreColor }}>{total} / 100 pts</span>
        </div>
      </div>
      <button className="btn-blue" onClick={save} disabled={saving} style={{ width: "100%" }}>
        {saving ? "Guardando..." : "Crear y publicar campaña"}
      </button>
    </div>
  );
}

function CanalesView({ postulaciones, onLoad }) {
  useEffect(() => { onLoad(); }, []);
  const stats = {};
  postulaciones.forEach(p => { stats[p.canal] = (stats[p.canal] || 0) + 1; });
  const total = postulaciones.length;
  return (
    <div>
      <div className="sec-title" style={{ marginBottom: 4 }}>Análisis de canales</div>
      <div className="sec-sub">Origen de todas las postulaciones recibidas</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(140px,1fr))", gap: 12, marginBottom: 28 }}>
        {Object.entries(CANALES).map(([k, c]) => {
          const count = stats[k] || 0;
          const pct = total ? Math.round(count / total * 100) : 0;
          return (
            <div key={k} className="stat-card">
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: c.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 600, color: "#fff", margin: "0 auto 8px" }}>{c.initial}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#1a1a1a" }}>{c.label}</div>
              <div className="stat-val">{count}</div>
              <div className="stat-label">{pct}% del total</div>
            </div>
          );
        })}
      </div>
      <div className="form-card">
        <div className="form-title">URLs de captación por canal</div>
        <div style={{ fontSize: 12, color: "#666", marginBottom: 12 }}>Comparte estas URLs para rastrear el origen automáticamente</div>
        {Object.entries(CANALES).map(([k, c]) => (
          <div key={k} className="url-row">
            <div style={{ width: 24, height: 24, borderRadius: "50%", background: c.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#fff", flexShrink: 0 }}>{c.initial}</div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#1a1a1a" }}>{c.label}</div>
              <div className="url-text">https://portal.bigticket.com?canal={k}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── APP ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [view, setView] = useState("portal");
  const [op, setOp] = useState("Chile");
  const [canal] = useState(getCanal);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCamp, setSelectedCamp] = useState(null);
  const [formCamp, setFormCamp] = useState(null);
  const [showAdmin, setShowAdmin] = useState(false);

  useEffect(() => { loadCampaigns(); }, []);

  async function loadCampaigns() {
    setLoading(true);
    const { data } = await sb.from("campanas").select("*").order("created_at", { ascending: false });
    setCampaigns(data || []);
    setLoading(false);
  }

  if (showAdmin) return (
    <>
      <style>{css}</style>
      <AdminPanel onClose={() => setShowAdmin(false)} campaigns={campaigns} setCampaigns={setCampaigns} />
    </>
  );

  return (
    <>
      <style>{css}</style>
      {view === "country" && <ViewCountry op={op} onSelect={c => { setOp(c); setView("portal"); }} />}
      {view === "portal" && <ViewPortal op={op} canal={canal} campaigns={campaigns} loading={loading} onChangePais={() => setView("country")} onDetail={c => { setSelectedCamp(c); setView("detail"); }} onLibre={() => { setFormCamp(null); setView("form"); }} />}
      {view === "detail" && selectedCamp && <ViewDetail camp={selectedCamp} canal={canal} onBack={() => setView("portal")} onPostular={() => { setFormCamp(selectedCamp); setView("form"); }} />}
      {view === "form" && <ViewForm camp={formCamp} canal={canal} op={op} onBack={() => setView(formCamp ? "detail" : "portal")} onSuccess={() => setView("success")} />}
      {view === "success" && <ViewSuccess onVolver={() => { setView("portal"); loadCampaigns(); }} />}
      {view === "portal" && (
        <div style={{ position: "fixed", bottom: 20, right: 20, zIndex: 99 }}>
          <button className="btn-blue" onClick={() => setShowAdmin(true)}>Admin ⚙</button>
        </div>
      )}
    </>
  );
}
