import { useState, useEffect } from "react";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://psvdtgjvognbmxfvqbaa.supabase.co";
const SUPABASE_KEY = "sb_publishable_RayW0wqgesNI6FYZ6i0CFQ_6YHaHELP";
const sb = createClient(SUPABASE_URL, SUPABASE_KEY);
const SUPERADMIN_KEY = "PortalTerceros2026";

const CANALES = {
  whatsapp: { label: "WhatsApp", color: "#25D366", initial: "W" },
  facebook: { label: "Facebook", color: "#1877F2", initial: "f" },
  instagram: { label: "Instagram", color: "#E1306C", initial: "I" },
  portal:    { label: "Portal web", color: "#1a3a6b", initial: "P" },
};

const PAISES = {
  Chile:  { bandera: "https://flagcdn.com/w80/cl.png", emoji: "🇨🇱", label: "Chile" },
  México: { bandera: "https://flagcdn.com/w80/mx.png", emoji: "🇲🇽", label: "México" },
};

const TIPOS_PREGUNTA = [
  { value: "sino",      label: "Sí / No" },
  { value: "escala",    label: "Escala por rangos" },
  { value: "seleccion", label: "Selección con puntaje" },
  { value: "texto",     label: "Texto informativo" },
];

const VARIABLES_LIST = [
  "Tipo de vehículo","Volumen del vehículo (m³)","Cantidad de vehículos",
  "Zona de reparto","Facturación","Modalidad de pago","Disponibilidad",
  "Experiencia requerida","Rango de ingresos","Vehículo propio",
  "Licencia vigente","Disponibilidad inmediata","Conocimiento de zona",
];

function getCanal() {
  if (typeof window === "undefined") return "portal";
  return new URLSearchParams(window.location.search).get("canal") || "portal";
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
function calcClasificacion(score, scoreMax) {
  if (!scoreMax) return "Frío";
  const pct = (score / scoreMax) * 100;
  if (pct >= 70) return "Caliente";
  if (pct >= 40) return "Tibio";
  return "Frío";
}
function calcScoreRespuestas(vars, respuestas) {
  return vars.reduce((total, v) => {
    const r = respuestas[v.id];
    const opts = v.opciones || [];
    if (v.tipo === "sino") return total + (r === "si" ? (opts[0]?.puntos || 0) : 0);
    if (v.tipo === "escala" || v.tipo === "seleccion") {
      const opt = opts.find(o => o.valor === r);
      return total + (opt?.puntos || 0);
    }
    if (v.tipo === "texto") return total + (r && r.trim() ? (opts[0]?.puntos || 0) : 0);
    return total;
  }, 0);
}
function maxScoreField(sf) {
  const opts = sf.opciones || [];
  if (sf.tipo === "sino") return opts[0]?.puntos || 0;
  if (!opts.length) return 0;
  return Math.max(...opts.map(o => o.puntos || 0));
}

const css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=DM+Mono:wght@400;500&display=swap');
  *{box-sizing:border-box;margin:0;padding:0;}
  body{font-family:'DM Sans',sans-serif;background:#f0f2f5;min-height:100vh;}
  .topbar{background:#1a3a6b;padding:12px 20px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:10;}
  .logo{color:#fff;font-size:16px;font-weight:600;}.logo span{color:#F47B20;}
  .tag-op{background:#F47B20;color:#fff;font-size:11px;padding:3px 10px;border-radius:20px;font-weight:500;}
  .canal-badge{font-size:11px;padding:3px 10px;border-radius:20px;background:rgba(255,255,255,0.15);color:#fff;}
  .btn-gw{background:transparent;color:#fff;border:0.5px solid rgba(255,255,255,0.3);border-radius:8px;padding:6px 12px;font-size:12px;cursor:pointer;font-family:'DM Sans',sans-serif;}
  .btn-gw:hover{background:rgba(255,255,255,0.1);}
  .pg{padding:20px;max-width:960px;margin:0 auto;} .pg-form{padding:20px;max-width:960px;margin:0 auto;padding-top:16px;}
  .sec-title{font-size:20px;font-weight:600;color:#1a1a1a;margin-bottom:4px;}
  .sec-sub{font-size:13px;color:#666;margin-bottom:20px;}
  .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px;margin-bottom:28px;}
  .camp-card{background:#fff;border:0.5px solid #e4e7ec;border-radius:14px;padding:18px;transition:border-color 0.15s,transform 0.1s;}
  .camp-card:hover{border-color:#F47B20;transform:translateY(-1px);}
  .badge-active{font-size:11px;padding:3px 8px;border-radius:20px;background:#dcfce7;color:#166534;white-space:nowrap;}
  .badge-days{font-size:11px;padding:3px 8px;border-radius:20px;background:#dbeafe;color:#1e40af;white-space:nowrap;}
  .tags{display:flex;flex-wrap:wrap;gap:6px;margin:10px 0;}
  .ctag{font-size:11px;padding:3px 8px;border-radius:6px;background:#f4f5f7;color:#555;}
  .libre-card{background:#fff;border:1.5px dashed #d0d5dd;border-radius:14px;padding:24px;text-align:center;margin-bottom:28px;}
  .btn-orange{background:#F47B20;color:#fff;border:none;border-radius:10px;padding:11px 20px;font-size:13px;font-weight:600;cursor:pointer;width:100%;margin-top:14px;font-family:'DM Sans',sans-serif;transition:background 0.15s;}
  .btn-orange:hover{background:#d96a10;}.btn-orange:disabled{background:#ccc;cursor:not-allowed;}
  .btn-blue{background:#1a3a6b;color:#fff;border:none;border-radius:10px;padding:11px 20px;font-size:13px;font-weight:600;cursor:pointer;font-family:'DM Sans',sans-serif;}
  .btn-blue:hover{background:#142d54;}
  .btn-back{background:transparent;border:none;cursor:pointer;font-size:13px;color:#1a3a6b;font-weight:600;font-family:'DM Sans',sans-serif;padding:0;}
  .btn-danger{background:transparent;color:#c0392b;border:0.5px solid #f5a7a7;border-radius:8px;padding:5px 10px;font-size:12px;cursor:pointer;font-family:'DM Sans',sans-serif;}
  .btn-danger:hover{background:#fff5f5;}
  .detail-header{background:#fff;border-bottom:0.5px solid #e4e7ec;padding:14px 20px;display:flex;align-items:center;gap:12px;position:sticky;top:0;z-index:9;}
  .form-card{background:#fff;border:0.5px solid #e4e7ec;border-radius:14px;padding:20px;margin-bottom:16px;}
  .form-title{font-size:14px;font-weight:600;color:#1a1a1a;margin-bottom:14px;}
  .field-row{margin-bottom:14px;}
  .field-label{font-size:12px;color:#555;margin-bottom:4px;display:block;font-weight:500;}
  input,select,textarea{width:100%;padding:9px 12px;border:0.5px solid #d0d5dd;border-radius:8px;font-size:13px;background:#fff;color:#1a1a1a;font-family:'DM Sans',sans-serif;outline:none;transition:border-color 0.15s;}
  input:focus,select:focus,textarea:focus{border-color:#1a3a6b;}
  textarea{height:80px;resize:none;}
  .two-col{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:12px;}
  .canal-info{background:#eef2ff;border-radius:10px;padding:10px 14px;margin-bottom:16px;margin-top:0;display:flex;align-items:center;gap:10px;}
  .canal-icon{width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:600;color:#fff;flex-shrink:0;}
  .radio-group{display:flex;flex-direction:column;gap:8px;}
  .radio-opt{display:flex;align-items:center;gap:8px;padding:9px 12px;border:0.5px solid #e4e7ec;border-radius:8px;cursor:pointer;transition:border-color 0.15s;}
  .radio-opt:hover{border-color:#1a3a6b;}
  .radio-opt.sel{border-color:#1a3a6b;background:#eef2ff;}
  .radio-opt input[type=radio]{width:auto;margin:0;flex-shrink:0;}
  .success-wrap{max-width:440px;margin:60px auto;padding:20px;}
  .success-card{background:#fff;border-radius:16px;padding:40px 32px;text-align:center;border:0.5px solid #e4e7ec;}
  .login-wrap{min-height:100vh;display:flex;align-items:center;justify-content:center;background:#f0f2f5;padding:20px;}
  .login-card{background:#fff;border-radius:16px;padding:40px 32px;width:100%;max-width:380px;border:0.5px solid #e4e7ec;}
  .login-error{background:#fee2e2;border-radius:8px;padding:10px 14px;font-size:13px;color:#c0392b;margin-bottom:14px;text-align:center;}
  .input-wrap{position:relative;}.input-wrap input{padding-right:40px;}
  .eye-btn{position:absolute;right:10px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:#888;font-size:16px;padding:0;}
  .admin-nav{display:flex;gap:6px;padding:12px 20px;background:#fff;border-bottom:0.5px solid #e4e7ec;overflow-x:auto;}
  .nav-btn{padding:7px 14px;font-size:13px;border-radius:8px;border:none;cursor:pointer;background:transparent;color:#666;font-family:'DM Sans',sans-serif;white-space:nowrap;}
  .nav-btn.active{background:#eef2ff;color:#1a3a6b;font-weight:600;}
  .camp-row{background:#fff;border:0.5px solid #e4e7ec;border-radius:10px;padding:14px 16px;margin-bottom:10px;display:flex;align-items:center;justify-content:space-between;gap:12px;}
  .toggle{width:40px;height:22px;border-radius:11px;border:none;cursor:pointer;position:relative;flex-shrink:0;}
  .toggle.on{background:#2e7d32;}.toggle.off{background:#c0392b;}
  .toggle-dot{width:16px;height:16px;background:#fff;border-radius:50%;position:absolute;top:3px;transition:left 0.2s;}
  .toggle.on .toggle-dot{left:21px;}.toggle.off .toggle-dot{left:3px;}
  .score-block{background:#f8f9fa;border:0.5px solid #e4e7ec;border-radius:10px;padding:14px;margin-bottom:10px;}
  .score-block-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;}
  .tipo-badge{font-size:10px;padding:2px 8px;border-radius:20px;}
  .tipo-sino{background:#e8eef8;color:#1a3a6b;}.tipo-escala{background:#fff3e0;color:#e65100;}
  .tipo-seleccion{background:#e8f5e9;color:#1b5e20;}.tipo-texto{background:#f3e8ff;color:#4a1080;}
  .opt-row{display:flex;align-items:center;gap:8px;margin-bottom:6px;}
  .opt-row input{flex:1;padding:6px 10px;font-size:12px;}
  .opt-row input[type=number]{width:70px;flex:none;}
  .pts-label{font-size:11px;color:#888;white-space:nowrap;}
  .add-opt-btn{font-size:11px;color:#1a3a6b;background:transparent;border:0.5px dashed #1a3a6b;border-radius:6px;padding:6px 12px;cursor:pointer;font-family:'DM Sans',sans-serif;margin-top:4px;}
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

function CanalInfo({ canal }) {
  const c = CANALES[canal] || CANALES.portal;
  return (
    <div className="canal-info">
      <div className="canal-icon" style={{ background: c.color }}>{c.initial}</div>
      <div>
        <div style={{ fontSize: 12, fontWeight: 600, color: "#1a3a6b" }}>Canal: {c.label}</div>
        <div style={{ fontSize: 11, color: "#666" }}>Se registra automáticamente en CRM LogiFlow</div>
      </div>
    </div>
  );
}

function Toggle({ on, onChange }) {
  return <button className={`toggle ${on?"on":"off"}`} onClick={onChange}><div className="toggle-dot"/></button>;
}

function PreguntaDinamica({ variable: v, value, onChange }) {
  const opts = v.opciones || [];
  if (v.tipo === "sino") return (
    <div className="field-row">
      <span className="field-label">{v.pregunta}</span>
      <div className="radio-group">
        {[{valor:"si",label:"Sí"},{valor:"no",label:"No"}].map(o => (
          <label key={o.valor} className={`radio-opt ${value===o.valor?"sel":""}`}>
            <input type="radio" value={o.valor} checked={value===o.valor} onChange={()=>onChange(o.valor)} style={{width:"auto"}}/>
            <span style={{fontSize:13,flex:1}}>{o.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
  if (v.tipo === "escala" || v.tipo === "seleccion") return (
    <div className="field-row">
      <span className="field-label">{v.pregunta}</span>
      <div className="radio-group">
        {opts.map((o,i) => (
          <label key={i} className={`radio-opt ${value===o.valor?"sel":""}`}>
            <input type="radio" value={o.valor} checked={value===o.valor} onChange={()=>onChange(o.valor)} style={{width:"auto"}}/>
            <span style={{fontSize:13,flex:1}}>{o.valor}</span>
          </label>
        ))}
      </div>
    </div>
  );
  return (
    <div className="field-row">
      <span className="field-label">{v.pregunta}</span>
      <input type="text" value={value||""} onChange={e=>onChange(e.target.value)} placeholder="Tu respuesta"/>
    </div>
  );
}

function ScoreFieldBuilder({ field, onUpdate, onRemove, usedVariables }) {
  const opts = field.opciones || [];
  function addOpt() { onUpdate({...field, opciones:[...opts,{valor:"",puntos:0}]}); }
  function updOpt(i,k,v) { onUpdate({...field, opciones:opts.map((o,idx)=>idx===i?{...o,[k]:v}:o)}); }
  function rmOpt(i) { onUpdate({...field, opciones:opts.filter((_,idx)=>idx!==i)}); }

  return (
    <div className="score-block">
      <div className="score-block-header">
        <span style={{fontSize:13,fontWeight:600,color:"#1a1a1a"}}>{field.variable||"Nueva variable"}</span>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <span className={`tipo-badge tipo-${field.tipo}`}>{TIPOS_PREGUNTA.find(t=>t.value===field.tipo)?.label}</span>
          <button className="btn-danger" onClick={onRemove} style={{padding:"3px 8px",fontSize:11}}>×</button>
        </div>
      </div>
      <div className="two-col" style={{marginBottom:10}}>
        <div>
          <span className="field-label">Variable</span>
          <select value={field.variable} onChange={e=>onUpdate({...field,variable:e.target.value})}>
            <option value="">-- Seleccionar --</option>
            {VARIABLES_LIST.filter(v=>v===field.variable||!usedVariables.includes(v)).map(v=><option key={v}>{v}</option>)}
          </select>
        </div>
        <div>
          <span className="field-label">Tipo de pregunta</span>
          <select value={field.tipo} onChange={e=>{
            const t=e.target.value;
            let o=[];
            if(t==="sino") o=[{valor:"si",puntos:10}];
            else if(t==="escala") o=[{valor:"Sin experiencia",puntos:0},{valor:"1-2 años",puntos:10},{valor:"Más de 3 años",puntos:20}];
            else if(t==="seleccion") o=[{valor:"Opción 1",puntos:10},{valor:"Opción 2",puntos:20}];
            else if(t==="texto") o=[{valor:"respuesta",puntos:10}];
            onUpdate({...field,tipo:t,opciones:o});
          }}>
            {TIPOS_PREGUNTA.map(t=><option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
      </div>
      <div className="field-row">
        <span className="field-label">Pregunta al postulante</span>
        <input value={field.pregunta} onChange={e=>onUpdate({...field,pregunta:e.target.value})} placeholder="¿Cómo quieres preguntarle?"/>
      </div>
      {field.tipo==="sino" && (
        <div>
          <span className="field-label">Puntos si responde SÍ (No = 0 automático)</span>
          <div className="opt-row">
            <input type="number" value={opts[0]?.puntos||0} min={0} max={200} onChange={e=>updOpt(0,"puntos",parseInt(e.target.value)||0)} style={{maxWidth:80}}/>
            <span className="pts-label">pts</span>
          </div>
        </div>
      )}
      {field.tipo==="texto" && (
        <div>
          <span className="field-label">Puntos por responder</span>
          <div className="opt-row">
            <input type="number" value={opts[0]?.puntos||0} min={0} max={200} onChange={e=>updOpt(0,"puntos",parseInt(e.target.value)||0)} style={{maxWidth:80}}/>
            <span className="pts-label">pts si escribe algo</span>
          </div>
        </div>
      )}
      {(field.tipo==="escala"||field.tipo==="seleccion") && (
        <div>
          <span className="field-label" style={{marginBottom:6,display:"block"}}>
            {field.tipo==="escala"?"Tramos — define cada rango y sus puntos":"Opciones — cada una con sus puntos (valores libres)"}
          </span>
          {opts.map((o,i)=>(
            <div key={i} className="opt-row">
              <input value={o.valor} onChange={e=>updOpt(i,"valor",e.target.value)} placeholder={field.tipo==="escala"?"Ej: 1 a 3 años":"Ej: Furgón"}/>
              <input type="number" value={o.puntos} min={0} max={200} onChange={e=>updOpt(i,"puntos",parseInt(e.target.value)||0)} style={{maxWidth:70}}/>
              <span className="pts-label">pts</span>
              {opts.length>1 && <button className="btn-danger" onClick={()=>rmOpt(i)} style={{padding:"2px 7px",fontSize:12}}>×</button>}
            </div>
          ))}
          <button className="add-opt-btn" onClick={addOpt}>+ {field.tipo==="escala"?"Agregar tramo":"Agregar opción"}</button>
        </div>
      )}
    </div>
  );
}

function ViewCountry({ onSelect }) {
  return (
    <div>
      <div className="topbar"><span className="logo"><span>big</span>ticket</span></div>
      <div className="pg" style={{maxWidth:440,paddingTop:48}}>
        <div className="sec-title" style={{textAlign:"center",marginBottom:6}}>Selecciona tu operación</div>
        <div className="sec-sub" style={{textAlign:"center"}}>¿En qué país trabajarás?</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
          {Object.entries(PAISES).map(([key,p])=>(
            <div key={key} className="country-card" onClick={()=>onSelect(key)}>
              <img src={p.bandera} alt={p.label} style={{width:64,height:44,objectFit:"cover",borderRadius:4,margin:"0 auto 12px",display:"block"}} onError={e=>{e.target.style.display="none";e.target.nextSibling.style.display="block";}}/>
              <span style={{fontSize:40,display:"none",marginBottom:8}}>{p.emoji}</span>
              <div style={{fontSize:15,fontWeight:600,color:"#1a1a1a"}}>{p.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ViewPortal({ op, canal, campaigns, loading, onChangePais, onDetail, onLibre }) {
  const active = campaigns.filter(c=>isCampActive(c)&&c.pais===op);
  const ch = CANALES[canal]||CANALES.portal;
  return (
    <div>
      <div className="topbar">
        <span className="logo"><span>big</span>ticket — Portal terceros</span>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <span className="tag-op">{op}</span>
          <span className="canal-badge">{ch.label}</span>
          <button className="btn-gw" onClick={onChangePais}>Cambiar</button>
        </div>
      </div>
      <div className="pg">
        <div className="libre-card">
          <div style={{fontSize:15,fontWeight:600,color:"#1a1a1a",marginBottom:6}}>Postulación abierta permanente</div>
          <div style={{fontSize:13,color:"#666",marginBottom:16}}>¿No ves una campaña que se ajuste? Postula igual — te contactaremos cuando surja una oportunidad.</div>
          <button className="btn-orange" style={{maxWidth:220,margin:"0 auto"}} onClick={onLibre}>Postular ahora</button>
        </div>
        <div className="sec-title">Campañas activas</div>
        <div className="sec-sub">Selecciona una campaña para ver los detalles y postular</div>
        {loading ? <div className="loading">Cargando campañas...</div> :
          active.length===0 ? <div className="empty">No hay campañas activas para esta operación ahora mismo.</div> :
          <div className="grid">
            {active.map(c=>{
              const dias=getDiasRestantes(c.fecha_fin);
              return (
                <div key={c.id} className="camp-card">
                  <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:10}}>
                    <span style={{fontSize:14,fontWeight:600,color:"#1a1a1a",flex:1,marginRight:8}}>{c.nombre}</span>
                    {dias!==null?<span className="badge-days">{dias} días</span>:<span className="badge-active">Activa</span>}
                  </div>
                  <div className="tags">
                    {[c.vehiculo,c.volumen_m3,c.zona,c.disponibilidad].filter(Boolean).map((t,i)=><span key={i} className="ctag">{t}</span>)}
                  </div>
                  {c.fecha_fin && <div style={{fontSize:11,color:"#e65100",marginTop:6}}>Cierra el {c.fecha_fin}</div>}
                  <button className="btn-orange" onClick={()=>onDetail(c)}>Ver detalles y postular</button>
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
  const dias=getDiasRestantes(camp.fecha_fin);
  const rows=[
    ["Tipo de vehículo",camp.vehiculo],["Volumen del vehículo",camp.volumen_m3],
    ["Cantidad requerida",camp.cantidad?`${camp.cantidad} vehículos`:null],
    ["Zona de reparto",camp.zona],["Facturación",camp.factura],
    ["Modalidad de pago",camp.modalidad_pago],["Disponibilidad",camp.disponibilidad],
    ["Experiencia requerida",camp.experiencia_anios!=null?`${camp.experiencia_anios} año(s)`:null],
    ["Ingresos estimados",camp.ingreso_rango],
    camp.fecha_fin?["Cierre",`${camp.fecha_fin}${dias!==null?` (${dias} días)`:""}`]:null,
  ].filter(r=>r&&r[1]);
  return (
    <div>
      <div className="detail-header">
        <button className="btn-back" onClick={onBack}>← Volver</button>
        <span style={{fontSize:15,fontWeight:600,color:"#1a1a1a"}}>{camp.nombre}</span>
      </div>
      <div className="pg">
        <div className="form-card">
          <div className="form-title">Detalles de la campaña</div>
          <div className="two-col">
            {rows.map(([label,val])=>(
              <div key={label}><span className="field-label">{label}</span><p style={{fontSize:13,color:"#1a1a1a",marginTop:2}}>{val}</p></div>
            ))}
          </div>
          {camp.descripcion&&<div style={{marginTop:12}}><span className="field-label">Descripción</span><p style={{fontSize:13,color:"#1a1a1a",marginTop:2}}>{camp.descripcion}</p></div>}
        </div>
        <button className="btn-orange" onClick={onPostular}>Postular a esta campaña</button>
      </div>
    </div>
  );
}

function ViewForm({ camp, canal, op, onBack, onSuccess }) {
  const [form,setForm]=useState({nombre:"",rut:"",telefono:"",email:""});
  const [respuestas,setRespuestas]=useState({});
  const [vars,setVars]=useState([]);
  const [loading,setLoading]=useState(false);
  const isLibre=!camp;

  useEffect(()=>{if(camp)loadVars();},[camp]);

  async function loadVars() {
    const {data}=await sb.from("campana_variables").select("*").eq("campana_id",camp.id).order("orden");
    const parsed=(data||[]).map(v=>({
      ...v,
      opciones: typeof v.opciones==="string" ? JSON.parse(v.opciones) : (v.opciones||[])
    }));
    setVars(parsed);
  }

  async function submit() {
    if(!form.nombre||!form.telefono){alert("Completa nombre y teléfono.");return;}
    setLoading(true);
    try {
      const score=isLibre?0:calcScoreRespuestas(vars,respuestas);
      const scoreMax=isLibre?0:(camp.score_max||0);
      const clasificacion=calcClasificacion(score,scoreMax);

      // Enviar al webhook de N8N — N8N guarda en Supabase y envía WhatsApp
      const payload = {
        nombre: form.nombre,
        telefono: form.telefono,
        email: form.email||null,
        rut: form.rut||null,
        canal,
        pais: op,
        score,
        clasificacion,
        etapa: "Nuevo",
        origen: isLibre?"Postulación libre":`Campaña: ${camp?.nombre||""}`,
        campana_id: camp?.id||null,
        campana_nombre: camp?.nombre||null,
        tipo_postulacion: isLibre?"libre":"campaña",
        respuestas: isLibre?respuestas:Object.fromEntries(
          vars.map(v=>([v.pregunta, respuestas[v.id]||""]))
        ),
      };

      const res = await fetch("https://bigticket2026.app.n8n.cloud/webhook/nuevo-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if(!res.ok) {
        // Si N8N falla, guardar directo en Supabase como respaldo
        const {data:lead,error:le}=await sb.from("leads").insert({
          nombre:form.nombre,telefono:form.telefono,email:form.email||null,
          canal,pais:op,score,clasificacion,etapa:"Nuevo",
          origen:isLibre?"Postulación libre":`Campaña: ${camp?.nombre||""}`,
          campana_id:camp?.id||null,
        }).select().single();
        if(le) throw le;
        await sb.from("postulaciones").insert({
          campana_id:camp?.id||null,lead_id:lead.id,
          tipo:isLibre?"libre":"campaña",canal,pais:op,
          score_calculado:score,respuestas,
        });
      }

      onSuccess();
    } catch(e){alert("Error al enviar: "+e.message);}
    finally{setLoading(false);}
  }

  return (
    <div>
      <div className="detail-header">
        <button className="btn-back" onClick={onBack}>← Volver</button>
        <span style={{fontSize:15,fontWeight:600,color:"#1a1a1a"}}>{isLibre?"Postulación abierta":`Postular: ${camp.nombre}`}</span>
      </div>
      <div className="pg">
        <CanalInfo canal={canal}/>
        <div className="form-card">
          <div className="form-title">Datos personales</div>
          <div className="two-col">
            <div className="field-row"><span className="field-label">Nombre completo *</span><input value={form.nombre} onChange={e=>setForm({...form,nombre:e.target.value})} placeholder="Tu nombre"/></div>
            <div className="field-row"><span className="field-label">RUT / CURP</span><input value={form.rut} onChange={e=>setForm({...form,rut:e.target.value})} placeholder="Identificación"/></div>
          </div>
          <div className="two-col">
            <div className="field-row"><span className="field-label">Teléfono WhatsApp *</span><input value={form.telefono} onChange={e=>setForm({...form,telefono:e.target.value})} placeholder="+56 9..."/></div>
            <div className="field-row"><span className="field-label">Correo electrónico</span><input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="correo@..."/></div>
          </div>
        </div>
        {!isLibre && vars.length>0 && (
          <div className="form-card">
            <div className="form-title">Preguntas de la campaña</div>
            {vars.map(v=>(
              <PreguntaDinamica key={v.id} variable={v} value={respuestas[v.id]} onChange={val=>setRespuestas({...respuestas,[v.id]:val})}/>
            ))}
          </div>
        )}
        {isLibre && (
          <div className="form-card">
            <div className="form-title">Tu vehículo y disponibilidad</div>
            <div className="two-col">
              <div className="field-row"><span className="field-label">Tipo de vehículo</span>
                <select value={respuestas.vehiculo||""} onChange={e=>setRespuestas({...respuestas,vehiculo:e.target.value})}>
                  <option value="">-- Seleccionar --</option>
                  {["Moto","Auto","Furgón","Camión"].map(v=><option key={v}>{v}</option>)}
                </select>
              </div>
              <div className="field-row"><span className="field-label">Volumen (m³)</span>
                <select value={respuestas.volumen||""} onChange={e=>setRespuestas({...respuestas,volumen:e.target.value})}>
                  <option value="">-- Seleccionar --</option>
                  {["1 m³","2 m³","3 m³","4 m³","6 m³","8 m³","9 m³","12 m³","16 m³","20 m³","24 m³","Más de 24 m³"].map(v=><option key={v}>{v}</option>)}
                </select>
              </div>
            </div>
            <div className="two-col">
              <div className="field-row"><span className="field-label">Zona donde opera</span><input value={respuestas.zona||""} onChange={e=>setRespuestas({...respuestas,zona:e.target.value})} placeholder="Ej: Santiago Norte"/></div>
              <div className="field-row"><span className="field-label">Disponibilidad</span>
                <select value={respuestas.disp||""} onChange={e=>setRespuestas({...respuestas,disp:e.target.value})}>
                  <option value="">-- Seleccionar --</option>
                  {["Diurno","Nocturno","Mixto"].map(v=><option key={v}>{v}</option>)}
                </select>
              </div>
            </div>
            <div className="two-col">
              <div className="field-row"><span className="field-label">¿Vehículo propio?</span>
                <select value={respuestas.propio||""} onChange={e=>setRespuestas({...respuestas,propio:e.target.value})}>
                  <option value="">-- Seleccionar --</option>
                  <option>Sí, vehículo propio</option><option>No, arrendado</option>
                </select>
              </div>
              <div className="field-row"><span className="field-label">¿Emite factura?</span>
                <select value={respuestas.factura||""} onChange={e=>setRespuestas({...respuestas,factura:e.target.value})}>
                  <option value="">-- Seleccionar --</option>
                  <option>Sí, emito factura</option><option>No emito factura</option>
                </select>
              </div>
            </div>
            <div className="field-row"><span className="field-label">Experiencia en reparto</span>
              <select value={respuestas.exp||""} onChange={e=>setRespuestas({...respuestas,exp:e.target.value})}>
                <option value="">-- Seleccionar --</option>
                {["Sin experiencia","Menos de 1 año","1 a 2 años","3 a 5 años","Más de 5 años"].map(v=><option key={v}>{v}</option>)}
              </select>
            </div>
            <div className="field-row"><span className="field-label">Comentario (opcional)</span>
              <textarea value={respuestas.comentario||""} onChange={e=>setRespuestas({...respuestas,comentario:e.target.value})} placeholder="Cuéntanos algo más..."/>
            </div>
          </div>
        )}
        <button className="btn-orange" onClick={submit} disabled={loading}>{loading?"Enviando...":"Enviar postulación"}</button>
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
          <div style={{width:56,height:56,background:"#dcfce7",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px",fontSize:24,color:"#166534"}}>✓</div>
          <div style={{fontSize:17,fontWeight:700,color:"#166534",marginBottom:8}}>Postulación enviada</div>
          <div style={{fontSize:13,color:"#555",marginBottom:24}}>Tus datos fueron recibidos y registrados. Te contactaremos por WhatsApp a la brevedad.</div>
          <button className="btn-orange" style={{maxWidth:200,margin:"0 auto"}} onClick={onVolver}>Volver al inicio</button>
        </div>
      </div>
    </div>
  );
}

function AdminLogin({ onSuccess, onClose }) {
  const [clave,setClave]=useState("");
  const [error,setError]=useState("");
  const [show,setShow]=useState(false);
  function login() {
    if(clave===SUPERADMIN_KEY){sessionStorage.setItem("admin_auth","1");onSuccess();}
    else{setError("Clave incorrecta.");setClave("");}
  }
  return (
    <div className="login-wrap">
      <div className="login-card">
        <div style={{textAlign:"center",marginBottom:28}}>
          <div style={{background:"#1a3a6b",borderRadius:10,padding:"10px 20px",display:"inline-flex",alignItems:"center"}}>
            <span style={{color:"#F47B20",fontSize:20,fontWeight:700}}>big</span>
            <span style={{color:"#fff",fontSize:20,fontWeight:700}}>ticket</span>
          </div>
        </div>
        <div style={{fontSize:16,fontWeight:600,color:"#1a1a1a",marginBottom:6,textAlign:"center"}}>Acceso administrador</div>
        <div style={{fontSize:13,color:"#888",textAlign:"center",marginBottom:24}}>Solo para personal autorizado BigTicket</div>
        {error&&<div className="login-error">{error}</div>}
        <div className="field-row">
          <span className="field-label">Clave de acceso</span>
          <div className="input-wrap">
            <input type={show?"text":"password"} value={clave} onChange={e=>{setClave(e.target.value);setError("");}} onKeyDown={e=>e.key==="Enter"&&login()} placeholder="Ingresa tu clave" autoFocus/>
            <button className="eye-btn" onClick={()=>setShow(!show)}>{show?"🙈":"👁"}</button>
          </div>
        </div>
        <button className="btn-blue" onClick={login} style={{width:"100%",marginTop:8}}>Ingresar</button>
        <div style={{textAlign:"center",marginTop:16}}>
          <button className="btn-back" style={{fontSize:12,color:"#888"}} onClick={onClose}>← Volver al portal</button>
        </div>
      </div>
    </div>
  );
}

function AdminPanel({ onClose, campaigns, setCampaigns }) {
  const [tab,setTab]=useState("camps");
  const [postulaciones,setPostulaciones]=useState([]);
  const [loadingPost,setLoadingPost]=useState(false);

  useEffect(()=>{if(tab==="postulaciones")loadPost();},[tab]);

  async function loadPost() {
    setLoadingPost(true);
    const {data}=await sb.from("postulaciones").select("*, leads(nombre,telefono), campanas(nombre)").order("created_at",{ascending:false}).limit(50);
    setPostulaciones(data||[]);setLoadingPost(false);
  }
  async function toggleCamp(camp) {
    const v=!camp.toggle_activo;
    await sb.from("campanas").update({toggle_activo:v}).eq("id",camp.id);
    setCampaigns(campaigns.map(c=>c.id===camp.id?{...c,toggle_activo:v}:c));
  }
  async function deleteCamp(id) {
    if(!confirm("¿Eliminar esta campaña?"))return;
    await sb.from("campanas").delete().eq("id",id);
    setCampaigns(campaigns.filter(c=>c.id!==id));
  }

  return (
    <div>
      <div style={{background:"#1a3a6b",padding:"12px 20px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div>
          <div style={{color:"#fff",fontSize:15,fontWeight:600}}>Panel administrador</div>
          <div style={{color:"#aac3e8",fontSize:12}}>BigTicket — Gestión de campañas</div>
        </div>
        <button className="btn-gw" onClick={onClose}>Ver portal →</button>
      </div>
      <div className="admin-nav">
        {[["camps","Campañas"],["nueva","Nueva campaña"],["postulaciones","Postulaciones"],["canales","Canales"]].map(([k,l])=>(
          <button key={k} className={`nav-btn ${tab===k?"active":""}`} onClick={()=>setTab(k)}>{l}</button>
        ))}
      </div>
      <div className="pg">
        {tab==="camps"&&(
          <div>
            <div className="sec-title" style={{marginBottom:16}}>Campañas creadas</div>
            {campaigns.length===0?<div className="empty">No hay campañas aún.</div>:
              campaigns.map(c=>{
                const active=isCampActive(c);
                return (
                  <div key={c.id} className="camp-row">
                    <div style={{flex:1}}>
                      <div style={{fontSize:14,fontWeight:600,color:"#1a1a1a"}}>{c.nombre}
                        <span style={{fontSize:11,padding:"2px 8px",borderRadius:20,marginLeft:8,background:active?"#dcfce7":"#fee2e2",color:active?"#166534":"#c0392b"}}>{active?"Activa":"Inactiva"}</span>
                      </div>
                      <div style={{fontSize:12,color:"#888",marginTop:2}}>{c.pais} · {c.vehiculo} · Score máx: {c.score_max} pts{c.fecha_inicio?` · ${c.fecha_inicio} → ${c.fecha_fin}`:""}</div>
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <Toggle on={c.toggle_activo} onChange={()=>toggleCamp(c)}/>
                      <button className="btn-danger" onClick={()=>deleteCamp(c.id)}>Eliminar</button>
                    </div>
                  </div>
                );
              })
            }
          </div>
        )}
        {tab==="nueva"&&<NuevaCampana campaigns={campaigns} setCampaigns={setCampaigns} onDone={()=>setTab("camps")}/>}
        {tab==="postulaciones"&&(
          <div>
            <div className="sec-title" style={{marginBottom:4}}>Postulaciones recibidas</div>
            <div className="sec-sub">Todas migran automáticamente al pipeline de LogiFlow CRM</div>
            {loadingPost?<div className="loading">Cargando...</div>:
              postulaciones.length===0?<div className="empty">No hay postulaciones aún.</div>:
              postulaciones.map(p=>{
                const ch=CANALES[p.canal]||CANALES.portal;
                return (
                  <div key={p.id} className="post-row">
                    <div className="ch-dot" style={{background:ch.color}}>{ch.initial}</div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:14,fontWeight:600,color:"#1a1a1a"}}>{p.leads?.nombre||"Sin nombre"}</div>
                      <div style={{fontSize:12,color:"#888"}}>{p.campanas?.nombre||"Postulación libre"} · {ch.label} · {new Date(p.created_at).toLocaleDateString("es-CL")}</div>
                    </div>
                    <div style={{textAlign:"right"}}>
                      <div style={{fontSize:16,fontWeight:700,color:"#1a3a6b"}}>{p.score_calculado} pts</div>
                      <div style={{fontSize:11,color:"#888"}}>CRM LogiFlow</div>
                    </div>
                  </div>
                );
              })
            }
          </div>
        )}
        {tab==="canales"&&<CanalesView postulaciones={postulaciones} onLoad={loadPost}/>}
      </div>
    </div>
  );
}

function newField() {
  return {_id:Date.now()+Math.random(),variable:"",tipo:"sino",pregunta:"",opciones:[{valor:"si",puntos:10}]};
}

function NuevaCampana({ campaigns, setCampaigns, onDone }) {
  const empty={nombre:"",pais:"Chile",vehiculo:"Furgón",volumen_m3:"",cantidad:"",zona:"",factura:"Sí requiere factura",modalidad_pago:"Semanal",disponibilidad:"Diurno",experiencia_anios:"0",ingreso_rango:"",descripcion:"",fecha_inicio:"",fecha_fin:""};
  const [f,setF]=useState(empty);
  const [scoreFields,setScoreFields]=useState([newField()]);
  const [saving,setSaving]=useState(false);

  function upd(k,v){setF(prev=>({...prev,[k]:v}));}
  function totalScore(){return scoreFields.reduce((s,sf)=>s+maxScoreField(sf),0);}
  function usedVars(){return scoreFields.map(sf=>sf.variable).filter(Boolean);}

  async function save() {
    if(!f.nombre){alert("Ingresa el nombre de la campaña.");return;}
    if(f.fecha_inicio&&f.fecha_fin&&f.fecha_inicio>f.fecha_fin){alert("Fecha inicio no puede ser mayor a fecha fin.");return;}
    setSaving(true);
    try {
      const autoOn=!f.fecha_inicio||new Date(f.fecha_inicio)<=new Date();
      const scoreMax=totalScore();
      const {data:camp,error}=await sb.from("campanas").insert({
        nombre:f.nombre,pais:f.pais,vehiculo:f.vehiculo,
        volumen_m3:f.volumen_m3||null,cantidad:parseInt(f.cantidad)||null,
        zona:f.zona||null,factura:f.factura.includes("Sí")?"Sí":"No",
        modalidad_pago:f.modalidad_pago,disponibilidad:f.disponibilidad,
        experiencia_anios:parseInt(f.experiencia_anios)||0,
        ingreso_rango:f.ingreso_rango||null,descripcion:f.descripcion||null,
        toggle_activo:autoOn,fecha_inicio:f.fecha_inicio||null,
        fecha_fin:f.fecha_fin||null,score_max:scoreMax,
      }).select().single();
      if(error)throw error;
      const valid=scoreFields.filter(sf=>sf.variable&&sf.pregunta);
      if(valid.length>0){
        const varsToInsert=valid.map((sf,i)=>({
          campana_id:camp.id,
          variable:sf.variable,
          pregunta:sf.pregunta,
          tipo:sf.tipo,
          opciones:JSON.stringify(sf.opciones),
          puntos:maxScoreField(sf),
          orden:i,
        }));
        const {error:ve}=await sb.from("campana_variables").insert(varsToInsert);
        if(ve){
          await sb.from("campanas").delete().eq("id",camp.id);
          throw new Error("Error guardando preguntas: "+ve.message);
        }
      }
      setCampaigns([...campaigns,camp]);
      alert(`Campaña "${f.nombre}" creada con ${valid.length} pregunta(s) de scoring.`);
      onDone();
    } catch(e){alert("Error: "+e.message);}
    finally{setSaving(false);}
  }

  const total=totalScore();
  const scoreColor=total>100?"#c0392b":total>=80?"#e65100":"#166534";

  return (
    <div>
      <div className="sec-title" style={{marginBottom:4}}>Crear nueva campaña</div>
      <div className="sec-sub">Define los campos, fechas y modelo de puntuación</div>
      <div className="form-card">
        <div className="form-title">Información general</div>
        <div className="field-row"><span className="field-label">Nombre de la campaña</span><input value={f.nombre} onChange={e=>upd("nombre",e.target.value)} placeholder="Ej: Conductores zona norte"/></div>
        <div className="two-col">
          <div className="field-row"><span className="field-label">País</span><select value={f.pais} onChange={e=>upd("pais",e.target.value)}><option>Chile</option><option>México</option></select></div>
          <div className="field-row"><span className="field-label">Tipo de vehículo</span><select value={f.vehiculo} onChange={e=>upd("vehiculo",e.target.value)}>{["Moto","Auto","Furgón","Camión"].map(v=><option key={v}>{v}</option>)}</select></div>
        </div>
        <div className="two-col">
          <div className="field-row"><span className="field-label">Volumen (m³)</span>
            <select value={f.volumen_m3} onChange={e=>upd("volumen_m3",e.target.value)}>
              <option value="">-- Seleccionar --</option>
              {["1 m³","2 m³","3 m³","4 m³","6 m³","8 m³","9 m³","12 m³","16 m³","20 m³","24 m³","Más de 24 m³"].map(v=><option key={v}>{v}</option>)}
            </select>
          </div>
          <div className="field-row"><span className="field-label">Cantidad de vehículos</span><input type="number" value={f.cantidad} onChange={e=>upd("cantidad",e.target.value)} placeholder="10"/></div>
        </div>
        <div className="two-col">
          <div className="field-row"><span className="field-label">Zona de reparto</span><input value={f.zona} onChange={e=>upd("zona",e.target.value)} placeholder="Ej: RM Norte"/></div>
          <div className="field-row"><span className="field-label">Factura</span><select value={f.factura} onChange={e=>upd("factura",e.target.value)}><option>Sí requiere factura</option><option>No requiere factura</option></select></div>
        </div>
        <div className="two-col">
          <div className="field-row"><span className="field-label">Modalidad de pago</span><select value={f.modalidad_pago} onChange={e=>upd("modalidad_pago",e.target.value)}>{["Semanal","Quincenal","Mensual"].map(v=><option key={v}>{v}</option>)}</select></div>
          <div className="field-row"><span className="field-label">Disponibilidad</span><select value={f.disponibilidad} onChange={e=>upd("disponibilidad",e.target.value)}>{["Diurno","Nocturno","Mixto"].map(v=><option key={v}>{v}</option>)}</select></div>
        </div>
        <div className="two-col">
          <div className="field-row"><span className="field-label">Experiencia (años)</span><input type="number" value={f.experiencia_anios} onChange={e=>upd("experiencia_anios",e.target.value)}/></div>
          <div className="field-row"><span className="field-label">Rango de ingresos</span><input value={f.ingreso_rango} onChange={e=>upd("ingreso_rango",e.target.value)} placeholder="Ej: 600.000 - 900.000"/></div>
        </div>
        <div className="field-row"><span className="field-label">Descripción</span><textarea value={f.descripcion} onChange={e=>upd("descripcion",e.target.value)} placeholder="Detalles..."/></div>
      </div>
      <div className="form-card">
        <div className="form-title">Vigencia de la campaña</div>
        <div style={{fontSize:12,color:"#666",marginBottom:14}}>Se activa automáticamente en la fecha inicio y se desactiva en la fecha fin.</div>
        <div className="two-col">
          <div className="field-row"><span className="field-label">Fecha de inicio</span><input type="date" value={f.fecha_inicio} onChange={e=>upd("fecha_inicio",e.target.value)}/></div>
          <div className="field-row"><span className="field-label">Fecha de cierre</span><input type="date" value={f.fecha_fin} onChange={e=>upd("fecha_fin",e.target.value)}/></div>
        </div>
      </div>
      <div className="form-card">
        <div className="form-title">Modelo de puntuación (interno CRM)</div>
        <div style={{fontSize:12,color:"#666",marginBottom:14}}>Define cada pregunta, su tipo y los puntos de cada opción. El postulante no ve puntajes. Puedes asignar cualquier valor — una moto puede valer más que un camión si la campaña lo requiere.</div>
        {scoreFields.map((sf,idx)=>(
          <ScoreFieldBuilder key={sf._id} field={sf}
            onUpdate={updated=>setScoreFields(scoreFields.map((x,i)=>i===idx?updated:x))}
            onRemove={()=>setScoreFields(scoreFields.filter((_,i)=>i!==idx))}
            usedVariables={usedVars().filter(v=>v!==sf.variable)}
          />
        ))}
        <button className="add-opt-btn" style={{width:"100%",padding:"9px",marginTop:4}} onClick={()=>setScoreFields([...scoreFields,newField()])}>
          + Agregar pregunta de scoring
        </button>
        {total>100&&<div style={{fontSize:12,color:"#c0392b",marginTop:8}}>El score supera 100 puntos. Considera ajustar los valores.</div>}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",background:"#eef2ff",borderRadius:10,padding:"10px 14px",marginTop:12}}>
          <span style={{fontSize:13,fontWeight:600,color:scoreColor}}>Score máximo posible</span>
          <span style={{fontSize:20,fontWeight:700,color:scoreColor}}>{total} pts</span>
        </div>
      </div>
      <button className="btn-blue" onClick={save} disabled={saving} style={{width:"100%"}}>{saving?"Guardando...":"Crear y publicar campaña"}</button>
    </div>
  );
}

function CanalesView({ postulaciones, onLoad }) {
  useEffect(()=>{onLoad();},[]);
  const stats={};
  postulaciones.forEach(p=>{stats[p.canal]=(stats[p.canal]||0)+1;});
  const total=postulaciones.length;
  return (
    <div>
      <div className="sec-title" style={{marginBottom:4}}>Análisis de canales</div>
      <div className="sec-sub">Origen de todas las postulaciones recibidas</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))",gap:12,marginBottom:28}}>
        {Object.entries(CANALES).map(([k,c])=>{
          const count=stats[k]||0;const pct=total?Math.round(count/total*100):0;
          return (
            <div key={k} className="stat-card">
              <div style={{width:36,height:36,borderRadius:"50%",background:c.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:600,color:"#fff",margin:"0 auto 8px"}}>{c.initial}</div>
              <div style={{fontSize:13,fontWeight:600,color:"#1a1a1a"}}>{c.label}</div>
              <div className="stat-val">{count}</div>
              <div className="stat-label">{pct}% del total</div>
            </div>
          );
        })}
      </div>
      <div className="form-card">
        <div className="form-title">URLs de captación por canal</div>
        <div style={{fontSize:12,color:"#666",marginBottom:12}}>Comparte estas URLs para rastrear el origen automáticamente</div>
        {Object.entries(CANALES).map(([k,c])=>(
          <div key={k} className="url-row">
            <div style={{width:24,height:24,borderRadius:"50%",background:c.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,color:"#fff",flexShrink:0}}>{c.initial}</div>
            <div>
              <div style={{fontSize:12,fontWeight:600,color:"#1a1a1a"}}>{c.label}</div>
              <div className="url-text">https://bigticket-portal.vercel.app?canal={k}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  const [view,setView]=useState("country");
  const [op,setOp]=useState(null);
  const [canal]=useState(getCanal);
  const [campaigns,setCampaigns]=useState([]);
  const [loading,setLoading]=useState(true);
  const [selectedCamp,setSelectedCamp]=useState(null);
  const [formCamp,setFormCamp]=useState(null);
  const [showAdmin,setShowAdmin]=useState(false);
  const [adminAuth,setAdminAuth]=useState(!!sessionStorage.getItem("admin_auth"));

  useEffect(()=>{loadCampaigns();},[]);

  async function loadCampaigns() {
    setLoading(true);
    const {data}=await sb.from("campanas").select("*").order("created_at",{ascending:false});
    setCampaigns(data||[]);setLoading(false);
  }

  if(showAdmin&&!adminAuth) return <><style>{css}</style><AdminLogin onSuccess={()=>setAdminAuth(true)} onClose={()=>setShowAdmin(false)}/></>;
  if(showAdmin&&adminAuth) return <><style>{css}</style><AdminPanel onClose={()=>setShowAdmin(false)} campaigns={campaigns} setCampaigns={setCampaigns}/></>;

  return (
    <><style>{css}</ style>
      {view==="country"&&<ViewCountry onSelect={c=>{setOp(c);setView("portal");}}/>}
      {view==="portal"&&op&&<ViewPortal op={op} canal={canal} campaigns={campaigns} loading={loading} onChangePais={()=>setView("country")} onDetail={c=>{setSelectedCamp(c);setView("detail");}} onLibre={()=>{setFormCamp(null);setView("form");}}/>}
      {view==="detail"&&selectedCamp&&<ViewDetail camp={selectedCamp} canal={canal} onBack={()=>setView("portal")} onPostular={()=>{setFormCamp(selectedCamp);setView("form");}}/>}
      {view==="form"&&<ViewForm camp={formCamp} canal={canal} op={op} onBack={()=>setView(formCamp?"detail":"portal")} onSuccess={()=>setView("success")}/>}
      {view==="success"&&<ViewSuccess onVolver={()=>{setView("portal");loadCampaigns();}}/>}
      {view==="portal"&&(
        <div style={{position:"fixed",bottom:20,right:20,zIndex:99,display:"flex",flexDirection:"column",alignItems:"flex-end",gap:8}}>
          {adminAuth&&<button style={{background:"transparent",border:"none",cursor:"pointer",fontSize:11,color:"#888"}} onClick={()=>{sessionStorage.removeItem("admin_auth");setAdminAuth(false);}}>Cerrar sesión</button>}
          <button className="btn-blue" onClick={()=>setShowAdmin(true)}>Admin ⚙</button>
        </div>
      )}
    </>
  );
}
