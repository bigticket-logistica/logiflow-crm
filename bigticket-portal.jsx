import { useState, useEffect, useRef } from "react";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://psvdtgjvognbmxfvqbaa.supabase.co";
const SUPABASE_KEY = "sb_publishable_RayW0wqgesNI6FYZ6i0CFQ_6YHaHELP";
const sb = createClient(SUPABASE_URL, SUPABASE_KEY);
const SUPERADMIN_KEY = "PortalTerceros2026";
const DONB_URL = "https://psvdtgjvognbmxfvqbaa.supabase.co/storage/v1/object/public/assets/Don_B1.jpeg";

const CANALES = {
  whatsapp:  { label: "WhatsApp",       color: "#25D366", initial: "W" },
  facebook:  { label: "Facebook",       color: "#1877F2", initial: "f" },
  instagram: { label: "Instagram",      color: "#E1306C", initial: "I" },
  referidos: { label: "Referidos",      color: "#F59E0B", initial: "R" },
  web:       { label: "Formulario Web", color: "#7c3aed", initial: "W" },
  portal:    { label: "Portal web",     color: "#1a3a6b", initial: "P" },
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

function getFingerprint() {
  const nav = window.navigator;
  const screen = window.screen;
  const str = [
    nav.language, nav.platform, nav.hardwareConcurrency,
    screen.width, screen.height, screen.colorDepth,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
  ].join("|");
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

async function registrarVisita(canal) {
  if (canal === "portal") return; // no registrar visitas directas sin canal
  try {
    const fingerprint = getFingerprint();
    await sb.from("canal_visitas").insert({ canal, fingerprint });
  } catch(_) {}
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
  @import url('https://fonts.bunny.net/css?family=geist:400,500,600,700,800&display=swap');
  *{box-sizing:border-box;margin:0;padding:0;}
  body{font-family:'Geist',sans-serif;background:#f0f2f5;min-height:100vh;}
  .topbar{background:#1a3a6b;padding:12px 20px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:10;}
  .logo{color:#fff;font-size:16px;font-weight:600;}.logo span{color:#F47B20;}
  .tag-op{background:#F47B20;color:#fff;font-size:11px;padding:3px 10px;border-radius:20px;font-weight:500;}
  .canal-badge{font-size:11px;padding:3px 10px;border-radius:20px;background:rgba(255,255,255,0.15);color:#fff;}
  .btn-gw{background:transparent;color:#fff;border:0.5px solid rgba(255,255,255,0.3);border-radius:8px;padding:6px 12px;font-size:12px;cursor:pointer;font-family:'Geist',sans-serif;}
  .btn-gw:hover{background:rgba(255,255,255,0.1);}
  .pg{padding:20px;max-width:960px;margin:0 auto;padding-bottom:90px;} .pg-form{padding:20px;max-width:960px;margin:0 auto;padding-top:16px;padding-bottom:90px;}
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
  .btn-orange{background:#F47B20;color:#fff;border:none;border-radius:10px;padding:11px 20px;font-size:13px;font-weight:600;cursor:pointer;width:100%;margin-top:14px;font-family:'Geist',sans-serif;transition:background 0.15s;}
  .btn-orange:hover{background:#d96a10;}.btn-orange:disabled{background:#ccc;cursor:not-allowed;}
  .btn-blue{background:#1a3a6b;color:#fff;border:none;border-radius:10px;padding:11px 20px;font-size:13px;font-weight:600;cursor:pointer;font-family:'Geist',sans-serif;}
  .btn-blue:hover{background:#142d54;}
  .btn-back{background:transparent;border:none;cursor:pointer;font-size:13px;color:#1a3a6b;font-weight:600;font-family:'Geist',sans-serif;padding:0;}
  .btn-danger{background:transparent;color:#c0392b;border:0.5px solid #f5a7a7;border-radius:8px;padding:5px 10px;font-size:12px;cursor:pointer;font-family:'Geist',sans-serif;}
  .btn-danger:hover{background:#fff5f5;}
  .detail-header{background:#fff;border-bottom:0.5px solid #e4e7ec;padding:14px 20px;display:flex;align-items:center;gap:12px;position:sticky;top:0;z-index:9;}
  .form-card{background:#fff;border:0.5px solid #e4e7ec;border-radius:14px;padding:20px;margin-bottom:16px;}
  .form-title{font-size:14px;font-weight:600;color:#1a1a1a;margin-bottom:14px;}
  .field-row{margin-bottom:14px;}
  .field-label{font-size:12px;color:#555;margin-bottom:4px;display:block;font-weight:500;}
  input,select,textarea{width:100%;padding:9px 12px;border:0.5px solid #d0d5dd;border-radius:8px;font-size:13px;background:#fff;color:#1a1a1a;font-family:'Geist',sans-serif;outline:none;transition:border-color 0.15s;}
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
  .nav-btn{padding:7px 14px;font-size:13px;border-radius:8px;border:none;cursor:pointer;background:transparent;color:#666;font-family:'Geist',sans-serif;white-space:nowrap;}
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
  .add-opt-btn{font-size:11px;color:#1a3a6b;background:transparent;border:0.5px dashed #1a3a6b;border-radius:6px;padding:6px 12px;cursor:pointer;font-family:'Geist',sans-serif;margin-top:4px;}
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
  @media (max-width:600px){
    .pg{padding-bottom:80px!important;}
    .pg-form{padding-bottom:80px!important;}
    .biggy-fab{display:none!important;}
    .biggy-bar{display:flex!important;}
    .tarifas-mobile{display:block!important;}
    .tarifas-desktop{display:none!important;}
  }
  @media (min-width:601px){
    .biggy-fab{display:flex!important;}
    .biggy-bar{display:none!important;}
  }
  .biggy-bar{position:fixed;bottom:0;left:0;right:0;z-index:999;background:#1a3a6b;padding:8px 20px;align-items:center;justify-content:space-between;gap:12px;border-top:2px solid #F47B20;}
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

function ViewCountry({ onSelect, busqCorreo, setBusqCorreo, busqDoc, setBusqDoc, buscarPostulacion, buscando, errorBusqueda, onAdmin }) {
  return (
    <div>
      <div className="topbar">
        <span className="logo">Big<span>ticket</span></span>
        <button className="btn-gw" onClick={onAdmin}>Admin ⚙</button>
      </div>
      <div className="pg" style={{maxWidth:440,paddingTop:48}}>
        <div className="sec-title" style={{textAlign:"center",marginBottom:6}}>Selecciona tu operación</div>
        <div className="sec-sub" style={{textAlign:"center"}}>¿En qué país trabajarás?</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:32}}>
          {Object.entries(PAISES).map(([key,p])=>(
            <div key={key} className="country-card" onClick={()=>onSelect(key)}>
              <img src={p.bandera} alt={p.label} style={{width:64,height:44,objectFit:"cover",borderRadius:4,margin:"0 auto 12px",display:"block"}} onError={e=>{e.target.style.display="none";e.target.nextSibling.style.display="block";}}/>
              <span style={{fontSize:40,display:"none",marginBottom:8}}>{p.emoji}</span>
              <div style={{fontSize:15,fontWeight:600,color:"#1a1a1a"}}>{p.label}</div>
            </div>
          ))}
        </div>

        {/* Consultar estado */}
        <div style={{background:"#f8f9fa",border:"1px solid #e4e7ec",borderRadius:14,padding:"20px",marginBottom:16}}>
          <div style={{fontSize:14,fontWeight:700,color:"#1a1a1a",marginBottom:4}}>🔍 Consultar estado de postulación</div>
          <div style={{fontSize:12,color:"#888",marginBottom:14}}>Ingresa tu correo y RUT (Chile) o CURP (México)</div>
          <div style={{marginBottom:10}}>
            <input value={busqCorreo} onChange={e=>setBusqCorreo(e.target.value)}
              onKeyDown={e=>e.key==="Enter"&&buscarPostulacion()}
              placeholder="Tu correo electrónico" type="email"
              style={{width:"100%",padding:"10px 14px",borderRadius:8,border:"1px solid #e4e7ec",fontSize:13,background:"#fff",fontFamily:"'Geist',sans-serif",boxSizing:"border-box"}}/>
          </div>
          <div style={{display:"flex",gap:8}}>
            <input value={busqDoc} onChange={e=>setBusqDoc(e.target.value.toUpperCase())}
              onKeyDown={e=>e.key==="Enter"&&buscarPostulacion()}
              placeholder="RUT (ej: 12345678K) o CURP"
              style={{flex:1,padding:"10px 14px",borderRadius:8,border:"1px solid #e4e7ec",fontSize:13,background:"#fff",fontFamily:"'Geist',sans-serif"}}/>
            <button onClick={buscarPostulacion} disabled={buscando}
              style={{background:"#F47B20",color:"#fff",border:"none",borderRadius:8,padding:"10px 18px",fontSize:13,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap",fontFamily:"'Geist',sans-serif"}}>
              {buscando?"...":"Consultar"}
            </button>
          </div>
          {errorBusqueda&&<div style={{fontSize:12,color:"#EF4444",marginTop:8}}>{errorBusqueda}</div>}
        </div>

        {/* Onboarding */}
        <div style={{background:"#eef2ff",border:"1px solid #c7d7f9",borderRadius:14,padding:"20px"}}>
          <div style={{fontSize:14,fontWeight:700,color:"#1a3a6b",marginBottom:4}}>📋 Formulario de incorporación</div>
          <div style={{fontSize:12,color:"#555",marginBottom:14}}>¿Tu propuesta fue aceptada? Completa tu formulario de incorporación a Bigticket</div>
          <button onClick={e=>{e.currentTarget.textContent="Cargando...";e.currentTarget.disabled=true;window.location.href="?onboarding=1";}}
            style={{background:"#1a3a6b",color:"#fff",border:"none",borderRadius:8,padding:"10px 18px",fontSize:13,fontWeight:700,cursor:"pointer",width:"100%",fontFamily:"'Geist',sans-serif"}}>
            Completar formulario →
          </button>
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
        <span className="logo">Big<span>ticket</span> — Portal terceros</span>
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

const REGIONES_CHILE = [
  "Región de Arica y Parinacota","Región de Tarapacá","Región de Antofagasta",
  "Región de Atacama","Región de Coquimbo","Región de Valparaíso",
  "Región Metropolitana de Santiago","Región del Libertador Gral. Bernardo O'Higgins",
  "Región del Maule","Región de Ñuble","Región del Biobío",
  "Región de La Araucanía","Región de Los Ríos","Región de Los Lagos",
  "Región de Aysén del Gral. Carlos Ibáñez del Campo","Región de Magallanes y de la Antártica Chilena"
];

const ESTADOS_MEXICO = [
  "SMX1 San Jerónimo Tepetlacalco",
  "SMX2 Complejo Industrial Tecnológico/Iztapalapa",
  "SMX3 Lomas de Santo Domingo Reacomodo",
  "SMX4 Bondojito",
  "SMX5 Iztapalapa",
  "SMX6 Industrial Tlaxcoapan",
  "SMX7 Cuajimalpa",
  "SMX8 Los Héroes Tecámac / Ojo de agua",
  "SMX9  Granjas México, Iztacalco",
  "SMX10  Vallejo",
  "SMX11 Outlets Punta Norte",
  "SCQ1 Colima",
  "STX1 Tlaxcala",
  "SHP1 Pachuca",
  "SCY1 Celaya",
  "SLT1 Toluca",
  "SPV1 Puebla",
  "SVR1 Veracruz",
  "SVH1 Villahermosa",
  "SQR1 Querétaro",
];

const PREFIJOS = { "Chile": "+569", "México": "+521" };

function ViewForm({ camp, canal, op, onBack, onSuccess }) {
  const [form,setForm]=useState({nombre:"",empresa:"",rut:"",telefono:PREFIJOS[op]||"+569",email:"",fuente_contacto:"",pais_form:op||"Chile",region_estado:"",url_vehiculo:""});
  const [respuestas,setRespuestas]=useState({});
  const [vars,setVars]=useState([]);
  const [loading,setLoading]=useState(false);
  const isLibre=!camp;

  const handlePaisChange=(nuevoPais)=>{
    const prefijo=PREFIJOS[nuevoPais]||"+569";
    setForm(p=>({...p,pais_form:nuevoPais,region_estado:"",telefono:prefijo}));
  };

  const regionesOpciones=form.pais_form==="México"?ESTADOS_MEXICO:REGIONES_CHILE;

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
    if(!form.fuente_contacto){alert("Indica cómo nos conociste.");return;}
    setLoading(true);
    try {
      const score=isLibre?0:calcScoreRespuestas(vars,respuestas);
      const scoreMax=isLibre?0:(camp.score_max||0);
      const clasificacion=calcClasificacion(score,scoreMax);

      // Generar código único de postulación
      const chars="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
      const codigo="BT-"+Array.from({length:6},()=>chars[Math.floor(Math.random()*chars.length)]).join("");

      // Enviar al webhook de N8N
      const payload = {
        nombre: form.nombre,
        empresa: form.empresa||null,
        telefono: form.telefono,
        email: form.email||null,
        rut: form.rut||null,
        canal,
        pais: op,
        score,
        clasificacion,
        etapa: clasificacion==="Caliente"?"Propuesta Enviada":"Base Datos Leads",
        origen: isLibre?"Postulación libre":`Campaña: ${camp?.nombre||""}`,
        campana_id: camp?.id||null,
        campana_nombre: camp?.nombre||null,
        tipo_postulacion: isLibre?"libre":"campaña",
        fuente_contacto: form.fuente_contacto||null,
        codigo_postulacion: codigo,
        respuestas: isLibre?respuestas:Object.fromEntries(
          vars.map(v=>([v.pregunta, respuestas[v.id]||""]))
        ),
      };

      // 1. Guardar en Supabase
      const {data:lead,error:le}=await sb.from("leads").insert({
        nombre:form.nombre,empresa:form.empresa||null,telefono:form.telefono,email:form.email||null,
        rut: (form.pais_form||op)==='México' ? null : (form.rut||null),
        curp: (form.pais_form||op)==='México' ? (form.rut||null) : null,
        canal,pais:form.pais_form||op,score,clasificacion,etapa:clasificacion==="Caliente"?"Propuesta Enviada":"Base Datos Leads",
        origen:isLibre?"Postulación libre":`Campaña: ${camp?.nombre||""}`,
        campana_id:camp?.id||null,fuente_contacto:form.fuente_contacto||null,
        tipo_postulacion:isLibre?"libre":"campaña",
        codigo_postulacion:codigo,
        region_estado:form.region_estado||null,
        url_vehiculo:form.url_vehiculo||null,
      }).select().single();
      if(le) throw le;
      await sb.from("postulaciones").insert({
        campana_id:camp?.id||null,lead_id:lead.id,
        tipo:isLibre?"libre":"campaña",canal,pais:op,
        score_calculado:score,respuestas,
      });

      // 2. Llamar a N8N para enviar WhatsApp + correo
      try {
        await fetch("https://bigticket2026.app.n8n.cloud/webhook/confirmacion-postulacion", {
          method: "POST", mode: "no-cors",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nombre: form.nombre, telefono: form.telefono,
            email: form.email||null, canal, pais: op, score, clasificacion,
            campana_nombre: camp?.nombre||"Postulación libre",
            origen: isLibre?"Postulación libre":`Campaña: ${camp?.nombre||""}`,
            fuente_contacto: form.fuente_contacto||null,
            codigo_postulacion: codigo,
            fecha_postulacion: new Date().toLocaleDateString("es-CL",{day:"2-digit",month:"long",year:"numeric",hour:"2-digit",minute:"2-digit"}),
            rut: form.rut||null,
            empresa: form.empresa||null,
            region_estado: form.region_estado||null,
          }),
        });
      } catch(fetchErr) { console.log("N8N WhatsApp error:", fetchErr); }

      // 2b. Enviar correo de confirmación si tiene email
      if(form.email){
        try {
          await fetch("https://bigticket2026.app.n8n.cloud/webhook/correo-postulacion", {
            method: "POST", mode: "no-cors",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: form.email,
              nombre: form.nombre,
              empresa: form.empresa||null,
              rut: form.rut||null,
              telefono: form.telefono,
              canal,
              pais: op,
              region_estado: form.region_estado||null,
              score,
              clasificacion,
              campana_nombre: camp?.nombre||"Postulación libre",
              origen: isLibre?"Postulación libre":`Campaña: ${camp?.nombre||""}`,
              fuente_contacto: form.fuente_contacto||null,
              codigo_postulacion: codigo,
              fecha_postulacion: new Date().toLocaleString("es-CL",{day:"2-digit",month:"long",year:"numeric",hour:"2-digit",minute:"2-digit"}),
            }),
          });
        } catch(e){ console.log("N8N correo error:",e); }
      }

      // 3. Si es caliente, notificar a N8N para enviar WhatsApp de propuesta
      if(clasificacion==="Caliente"&&lead.id){
        try {
          await fetch("https://bigticket2026.app.n8n.cloud/webhook/propuesta-enviada", {
            method: "POST", mode: "no-cors",
            headers: {"Content-Type":"application/json"},
            body: JSON.stringify({
              lead_id: lead.id,
              nombre: form.nombre,
              telefono: form.telefono,
              campana_nombre: camp?.nombre||"",
              clasificacion,
            }),
          });
        } catch(e){ console.log("N8N propuesta error:",e); }
      }

      onSuccess(codigo);
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

          {/* Fila 1: Nombre + Empresa */}
          <div className="two-col">
            <div className="field-row"><span className="field-label">Nombre completo *</span><input value={form.nombre} onChange={e=>setForm({...form,nombre:e.target.value})} placeholder="Tu nombre"/></div>
            <div className="field-row"><span className="field-label">Empresa / Razón social</span><input value={form.empresa} onChange={e=>setForm({...form,empresa:e.target.value})} placeholder="Nombre de tu empresa (opcional)"/></div>
          </div>

          {/* Fila 2: RUT (Chile) / CURP (México) + Correo */}
          <div className="two-col">
            <div className="field-row">
              <span className="field-label">{form.pais_form==="México"?"CURP":"RUT"}</span>
              <input value={form.rut} onChange={e=>setForm({...form,rut:e.target.value})} placeholder={form.pais_form==="México"?"Ej: ABCD123456HDFXXX00":"Ej: 12345678k"}/>
            </div>
            <div className="field-row"><span className="field-label">Correo electrónico</span><input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="correo@..."/></div>
          </div>

          {/* Fila 3: País + Región (postulación libre) */}
          {isLibre&&(
            <div className="two-col">
              <div className="field-row">
                <span className="field-label">País *</span>
                <select value={form.pais_form} onChange={e=>handlePaisChange(e.target.value)}
                  style={{width:"100%",padding:"10px 12px",borderRadius:8,border:"1px solid #e4e7ec",background:"#f8f9fa",fontSize:14,cursor:"pointer"}}>
                  <option value="Chile">🇨🇱 Chile</option>
                  <option value="México">🇲🇽 México</option>
                </select>
              </div>
              <div className="field-row">
                <span className="field-label">{form.pais_form==="México"?"Estado *":"Región *"}</span>
                <select value={form.region_estado} onChange={e=>setForm({...form,region_estado:e.target.value})}
                  style={{width:"100%",padding:"10px 12px",borderRadius:8,border:"1px solid #e4e7ec",background:"#f8f9fa",fontSize:14,cursor:"pointer",color:form.region_estado?"#1a1a1a":"#888888"}}>
                  <option value="">-- Seleccionar --</option>
                  {regionesOpciones.map(r=><option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </div>
          )}

          {/* Fila 3 campaña: Región + Teléfono */}
          {!isLibre&&(
            <div className="two-col">
              <div className="field-row">
                <span className="field-label">{op==="México"?"Estado *":"Región *"}</span>
                <select value={form.region_estado} onChange={e=>setForm({...form,region_estado:e.target.value})}
                  style={{width:"100%",padding:"10px 12px",borderRadius:8,border:"1px solid #e4e7ec",background:"#f8f9fa",fontSize:14,cursor:"pointer",color:form.region_estado?"#1a1a1a":"#888888"}}>
                  <option value="">-- Seleccionar --</option>
                  {(op==="México"?ESTADOS_MEXICO:REGIONES_CHILE).map(r=><option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div className="field-row">
                <span className="field-label">Teléfono WhatsApp *</span>
                <input value={form.telefono} onChange={e=>setForm({...form,telefono:e.target.value})}
                  placeholder={op==="México"?"+521 ...":"+569 ..."}/>
              </div>
            </div>
          )}

          {/* Fila 4 libre: Teléfono + ¿Cómo nos conociste? */}
          {isLibre&&(
            <div className="two-col">
              <div className="field-row">
                <span className="field-label">Teléfono WhatsApp *</span>
                <input value={form.telefono} onChange={e=>setForm({...form,telefono:e.target.value})}
                  placeholder={form.pais_form==="México"?"+521 ...":"+569 ..."}/>
              </div>
              <div className="field-row">
                <span className="field-label">¿Cómo nos conociste? *</span>
                <select value={form.fuente_contacto} onChange={e=>setForm({...form,fuente_contacto:e.target.value})}
                  style={{width:"100%",padding:"10px 12px",borderRadius:8,border:"1px solid #e4e7ec",background:"#f8f9fa",fontSize:14,color:form.fuente_contacto?"#1a1a1a":"#888888",cursor:"pointer"}}>
                  <option value="">Selecciona una opción...</option>
                  <option value="Instagram">📸 Instagram</option>
                  <option value="Facebook">📘 Facebook</option>
                  <option value="WhatsApp">💬 WhatsApp</option>
                  <option value="Referido">🤝 Me lo recomendó alguien</option>
                  <option value="Google">🔍 Google / Búsqueda web</option>
                  <option value="Portal web">🌐 Entré directo al portal</option>
                  <option value="Otro">💬 Otro</option>
                </select>
              </div>
            </div>
          )}

          {/* ¿Cómo nos conociste? para campaña — fila completa */}
          {!isLibre&&(
            <div className="field-row">
              <span className="field-label">¿Cómo nos conociste? *</span>
              <select value={form.fuente_contacto} onChange={e=>setForm({...form,fuente_contacto:e.target.value})}
                style={{width:"100%",padding:"10px 12px",borderRadius:8,border:"1px solid #e4e7ec",background:"#f8f9fa",fontSize:14,color:form.fuente_contacto?"#1a1a1a":"#888888",cursor:"pointer"}}>
                <option value="">Selecciona una opción...</option>
                <option value="Instagram">📸 Instagram</option>
                <option value="Facebook">📘 Facebook</option>
                <option value="WhatsApp">💬 WhatsApp</option>
                <option value="Referido">🤝 Me lo recomendó alguien</option>
                <option value="Google">🔍 Google / Búsqueda web</option>
                <option value="Portal web">🌐 Entré directo al portal</option>
                <option value="Otro">💬 Otro</option>
              </select>
            </div>
          )}
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
                <select value={respuestas.vehiculo||""} onChange={e=>{
                  const tv=e.target.value;
                  const volAuto="1,9 m³"; const volSmall="2,3 - 5,4 m³"; const volLarge="5,5 - 12,9 m³";
                  const volAuto_v="1,9"; const volSmall_v="2,3 - 5,4"; const volLarge_v="5,5 - 12,9";
                  const autoVol=tv==="Auto"?volAuto_v:tv==="Small Van"?volSmall_v:tv==="Large Van"?volLarge_v:"";
                  setRespuestas({...respuestas,vehiculo:tv,volumen:autoVol});
                }}>
                  <option value="">-- Seleccionar --</option>
                  {["Auto","Small Van","Large Van"].map(v=><option key={v}>{v}</option>)}
                </select>
              </div>
              <div className="field-row"><span className="field-label">Volumen (m³)</span>
                <input value={respuestas.volumen||""} onChange={e=>setRespuestas({...respuestas,volumen:e.target.value})}
                  placeholder={respuestas.vehiculo==="Auto"?"1,9 m³":respuestas.vehiculo==="Small Van"?"2,3 - 5,4 m³":respuestas.vehiculo==="Large Van"?"5,5 - 12,9 m³":"Se autocompleta al elegir vehículo"}/>
                <span style={{fontSize:11,color:"#888",marginTop:3,display:"block"}}>
                  {respuestas.vehiculo==="Auto"?"Auto: 1,9 m³":respuestas.vehiculo==="Small Van"?"Small Van: 2,3 a 5,4 m³":respuestas.vehiculo==="Large Van"?"Large Van: 5,5 a 12,9 m³":""}
                </span>
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

// ─── BIGGI — ASISTENTE VIRTUAL ────────────────────────────────────────────────
const BIGGI_PROMPT = `Eres Biggy 🚛, el asistente virtual de Bigticket — empresa de logística que conecta conductores independientes con campañas de reparto en Chile y México.

## TU PERSONALIDAD
- Amable, directo y profesional
- Usas emojis ocasionalmente 🚛😊✅
- Respondes CUALQUIER pregunta relacionándola siempre con Bigticket
- Nunca dices "no sé" — siempre orientas o derivas al equipo
- Si te preguntan algo no relacionado con Bigticket, redirige amablemente

## ¿QUÉ ES BIGTICKET?
Bigticket es una empresa de logística de última milla que conecta conductores independientes (terceros) con campañas de reparto para grandes clientes como Mercado Libre, Amazon y otros. Operamos en Chile y México.

## VEHÍCULOS Y CAPACIDADES
- Auto / Car: Hasta 1,9 m³
- Small Van (SV): De 2,0 m³ a 5,4 m³. Ejemplos: Peugeot Partner, Nissan NV200, Ford Transit Connect, Chevrolet Express 1500, Volkswagen Transporter
- Large Van (LV): De 5,5 m³ a 12,9 m³. Ejemplos: Nissan Urvan Panel, Ford Transit Custom, RAM ProMaster, Mercedes-Benz Sprinter, Peugeot Manager, Fiat Ducato

## TARIFAS MÉXICO
- Large Van (LV): $2,056 MXN netos + IVA por jornada (tramo 0 a 100 km)
- Small Van (SV): $1,856 MXN netos + IVA por jornada (tramo 0 a 100 km)
- Auxiliar en entregas: $300 MXN por día (se puede solicitar)
- Estimado: entre 80 y 100 entregas por unidad por jornada

## TARIFAS CHILE
- Entre $8.000 y $15.000 CLP por ruta según vehículo y campaña

## PAGOS
- Frecuencia: semanal cada viernes
- México: transferencia bancaria previa emisión de CFDI
- Chile: requiere factura electrónica o boleta
- Realizar certificación Bigticket para no tener problemas con el pago
- Bigticket puede retener el pago si no se acredita cumplimiento de obligaciones laborales, fiscales y de seguridad social

## CEDIS MÉXICO
- SQR1 Querétaro: Prol. Av. Zaragoza 61, La Capilla, 76170 Santiago de Querétaro, Qro. Devoluciones hasta las 22:00 hrs.
- SMX6 San Martín Obispo
- SPY1 Playa del Carmen

## DOCUMENTOS REQUERIDOS MÉXICO
- Carta de no antecedentes penales vigente
- Historial de conductor
- Licencia de conducir vigente
- Permiso de paquetería (obligatorio)
- GPS instalado (obligatorio, con cargo al prestador + renta mensual)
- RFC activo, INE vigente, CURP

## DOCUMENTOS REQUERIDOS CHILE
- Licencia de conducir vigente
- Cédula de identidad
- RUT con inicio de actividades
- Documentación del vehículo al día
- Seguro de responsabilidad civil propio

## CASTIGOS POR BAJO DESEMPEÑO (MÉXICO)
- Menos del 99.5% de domicilios visitados → castigo del 3% sobre tarifa base
- Nivel de servicio inferior al 95% → castigo del 3% sobre tarifa base

## CONTRATO Y MODALIDADES
- Vigencia inicial: 12 meses, condicionada al cumplimiento de niveles de servicio
- Modalidades: Apoyo (demanda puntual), Planta (ruta fija estable), Temporada (período específico)
- Prestación de servicios como tercero independiente (no relación laboral)
- Bigticket puede rotar operadores entre zonas según necesidades operativas

## PROCESO PARA EMPEZAR
1. Postulas en el portal: https://bigticket-portal.vercel.app
2. El equipo revisa tu perfil (1-3 días hábiles)
3. Recibes propuesta económica por WhatsApp
4. Aceptas y completas formulario de incorporación
5. Verificación de documentos (2-5 días)
6. ¡Empiezas a recibir rutas!

## CAMPAÑA
Período de trabajo con cliente específico. Tiene fechas, zona, tipo de vehículo y tarifa definidos. Puedes postular a múltiples campañas simultáneamente.

## INCIDENTES Y SEGURO
- Reportar inmediatamente al coordinador ante cualquier incidente
- Bigticket exige seguro de responsabilidad civil propio del conductor
- Bigticket cubre las mercancías transportadas

## REGLAS
- Si no sabes algo → "Para más detalles: +56957730804"
- Siempre invita a postular si es prospecto nuevo
- Siempre lleva al portal: https://bigticket-portal.vercel.app
- No inventes información fuera de este prompt
- Máximo 4 líneas por respuesta salvo cuando el usuario pide detalle
- Si preguntan algo no relacionado con Bigticket: "Mi especialidad es todo lo de Bigticket 🚛 ¿Tienes dudas sobre cómo trabajar con nosotros?"`;



function BiggiBubble({ paginaPrincipal=false }) {
  const [abierto,setAbierto]=useState(false);
  const [mensajes,setMensajes]=useState([{rol:"biggi",texto:"¡Hola! Soy Biggy 🚛 el asistente virtual de Bigticket. ¿En qué puedo ayudarte hoy?"}]);
  const [input,setInput]=useState("");
  const [cargando,setCargando]=useState(false);
  const endRef=useRef(null);

  useEffect(()=>{endRef.current?.scrollIntoView({behavior:"smooth"});},[mensajes]);

  const enviar=async()=>{
    if(!input.trim()||cargando) return;
    const texto=input.trim();
    setInput("");
    setMensajes(p=>[...p,{rol:"usuario",texto}]);
    setCargando(true);

    try {
      const historial=mensajes
        .filter((m,i)=>m.rol!=="biggi" || i>0)
        .map(m=>({
          role:m.rol==="usuario"?"user":"assistant",
          content:m.texto
        }));

      // Cargar conocimiento dinámico de Supabase
      let conocimientoExtra = "";
      try {
        const {data:conocimiento} = await sb.from("biggy_conocimiento").select("categoria,pregunta,respuesta").eq("activo",true).order("categoria");
        if(conocimiento&&conocimiento.length>0) {
          conocimientoExtra = "\n\n## CONOCIMIENTO ADICIONAL\n" +
            conocimiento.map(k=>`[${k.categoria}] P: ${k.pregunta}\nR: ${k.respuesta}`).join("\n\n");
        }
      } catch(_) {}

      const res=await fetch("https://bigticket2026.app.n8n.cloud/webhook/biggi-chat",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          system:BIGGI_PROMPT + conocimientoExtra,
          messages:[...historial,{role:"user",content:texto}]
        })
      });

      if(!res.ok){
        throw new Error(`HTTP ${res.status}`);
      }

      const contentType = res.headers.get("content-type") || "";
      let respuesta = "";

      if(contentType.includes("application/json")){
        const data = await res.json();
        respuesta =
          data.respuesta ||
          data.content?.[0]?.text ||
          data.text ||
          "Lo siento, no pude procesar tu consulta. Contacta al equipo: +56957730804";
      } else {
        respuesta = await res.text();
      }

      setMensajes(p=>[...p,{rol:"biggi",texto:respuesta}]);
    } catch(e){
      console.error("Error Biggy:", e);
      setMensajes(p=>[...p,{rol:"biggi",texto:"Tuve un problema técnico. Por favor contacta al equipo: +56957730804 📞"}]);
    } finally {
      setCargando(false);
    }
  };

  const BiggiFace = ({ size = 54 }) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: "50%",
      position: "relative",
      overflow: "hidden",
      flexShrink: 0,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "radial-gradient(circle at 30% 30%, #1C5E97 0%, #0B3A63 70%)",
      border: "2px solid rgba(255,255,255,0.95)",
      boxShadow:
        "0 10px 24px rgba(11,58,99,0.30), 0 4px 14px rgba(244,123,32,0.22)",
    }}
  >
    <div
      style={{
        position: "absolute",
        inset: 0,
        borderRadius: "50%",
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.02) 40%, transparent 100%)",
        pointerEvents: "none",
      }}
    />
    <img
      src={DONB_URL}
      alt="Biggy"
      style={{
        width: "86%",
        height: "86%",
        objectFit: "contain",
        objectPosition: "center",
        display: "block",
      }}
    />
  </div>
);

  return(
    <>
      {/* Botón flotante — solo desktop */}
      {!abierto&&(
        <div className="biggy-fab" onClick={()=>setAbierto(true)} style={{position:"fixed",bottom:24,right:24,zIndex:999,cursor:"pointer",flexDirection:"column",alignItems:"center",gap:6}}>
          {paginaPrincipal&&(
            <div style={{background:"#1a3a6b",color:"#fff",borderRadius:12,padding:"8px 14px",fontSize:12,fontWeight:600,boxShadow:"0 4px 16px rgba(0,0,0,0.2)",whiteSpace:"nowrap",animation:"pulse 2s infinite"}}>
              💬 ¿Tienes dudas? ¡Pregúntale a Biggy!
            </div>
          )}
          <div style={{width:64,height:64,borderRadius:"50%",overflow:"hidden",boxShadow:"0 4px 20px rgba(244,123,32,0.5)",border:"3px solid #F47B20"}}>
            <img src={DONB_URL} alt="Biggy" style={{width:"100%",height:"100%",objectFit:"cover",objectPosition:"top"}}/>
          </div>
          <div style={{background:"#1a3a6b",color:"#fff",borderRadius:8,padding:"3px 10px",fontSize:11,fontWeight:700}}>Biggy</div>
        </div>
      )}

      {/* Barra inferior — solo móvil */}
      {!abierto&&(
        <div className="biggy-bar" onClick={()=>setAbierto(true)}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:36,height:36,borderRadius:"50%",overflow:"hidden",border:"2px solid #F47B20",flexShrink:0}}>
              <img src={DONB_URL} alt="Biggy" style={{width:"100%",height:"100%",objectFit:"cover",objectPosition:"top"}}/>
            </div>
            <div>
              <div style={{color:"#fff",fontSize:13,fontWeight:700}}>Biggy</div>
              <div style={{color:"#aac3e8",fontSize:11}}>Asistente Virtual Bigticket</div>
            </div>
          </div>
          <div style={{background:"#F47B20",color:"#fff",borderRadius:20,padding:"7px 16px",fontSize:12,fontWeight:700,whiteSpace:"nowrap"}}>
            💬 Preguntar
          </div>
        </div>
      )}

      {/* Ventana del chat */}
      {abierto&&(
        <div style={{position:"fixed",bottom:0,right:0,zIndex:999,width:"min(340px, 100vw)",height:"min(520px, 100vh)",background:"#fff",borderRadius:"16px 16px 0 0",boxShadow:"0 8px 40px rgba(0,0,0,0.2)",display:"flex",flexDirection:"column",overflow:"hidden",border:"1px solid #e4e7ec"}}>
          {/* Header */}
          <div style={{background:"linear-gradient(135deg,#1a3a6b,#2a5a9b)",padding:"12px 16px",display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
            <BiggiFace size={48}/>
            <div style={{flex:1}}>
              <div style={{color:"#fff",fontSize:14,fontWeight:700}}>Biggy</div>
              <div style={{color:"#aac3e8",fontSize:11}}>Asistente Virtual Bigticket</div>
            </div>
            <button onClick={()=>setAbierto(false)} style={{background:"rgba(255,255,255,0.15)",border:"none",color:"#fff",borderRadius:"50%",width:28,height:28,cursor:"pointer",fontSize:16,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
          </div>

          {/* Mensajes */}
          <div style={{flex:1,overflow:"auto",padding:12,display:"flex",flexDirection:"column",gap:10,background:"#f8f9fa"}}>
            {mensajes.map((m,i)=>(
              <div key={i} style={{display:"flex",gap:8,justifyContent:m.rol==="usuario"?"flex-end":"flex-start",alignItems:"flex-end"}}>
                {m.rol==="biggi"&&<BiggiFace size={40}/>}
                <div style={{maxWidth:"78%",background:m.rol==="usuario"?"#1a3a6b":"#fff",color:m.rol==="usuario"?"#fff":"#1a1a1a",borderRadius:m.rol==="usuario"?"12px 12px 2px 12px":"12px 12px 12px 2px",padding:"9px 12px",fontSize:12,lineHeight:1.5,border:m.rol==="usuario"?"none":"1px solid #e4e7ec",boxShadow:"0 1px 3px rgba(0,0,0,0.06)"}}>
                  {m.texto}
                </div>
              </div>
            ))}
            {cargando&&(
              <div style={{display:"flex",gap:8,alignItems:"flex-end"}}>
                <BiggiFace size={40}/>
                <div style={{background:"#fff",border:"1px solid #e4e7ec",borderRadius:"12px 12px 12px 2px",padding:"9px 12px",fontSize:12,color:"#888"}}>
                  <span style={{animation:"pulse 1s infinite"}}>Biggy está escribiendo...</span>
                </div>
              </div>
            )}
            <div ref={endRef}/>
          </div>

          {/* Input */}
          <div style={{padding:"10px 12px",background:"#fff",borderTop:"1px solid #e4e7ec",display:"flex",gap:8,flexShrink:0}}>
            <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&enviar()}
              placeholder="Escribe tu consulta..."
              style={{flex:1,padding:"8px 12px",borderRadius:20,border:"1px solid #e4e7ec",fontSize:12,outline:"none",background:"#f8f9fa"}}/>
            <button onClick={enviar} disabled={cargando||!input.trim()}
              style={{background:"#F47B20",color:"#fff",border:"none",borderRadius:"50%",width:34,height:34,cursor:"pointer",fontSize:16,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,opacity:cargando||!input.trim()?0.5:1}}>
              ↑
            </button>
          </div>
        </div>
      )}
    </>
  );
}


function ViewSuccess({ pais, onVolver }) {
  const esMexico = pais === "México";
  const docLabel = esMexico ? "CURP" : "RUT";
  return (
    <div>
      <div className="topbar"><span className="logo">Big<span>ticket</span></span></div>
      <div style={{maxWidth:440,margin:"60px auto",padding:"20px"}}>
        <div style={{background:"#fff",borderRadius:16,padding:"40px 32px",textAlign:"center",border:"0.5px solid #e4e7ec"}}>
          <div style={{width:56,height:56,background:"#dcfce7",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px",fontSize:24,color:"#166534"}}>✓</div>
          <div style={{fontSize:17,fontWeight:700,color:"#166534",marginBottom:8}}>¡Postulación enviada!</div>
          <div style={{fontSize:13,color:"#555",marginBottom:20}}>Tus datos fueron recibidos. Te contactaremos por WhatsApp a la brevedad.</div>
          <div style={{background:"#f0f9ff",border:"1px solid #bae6fd",borderRadius:12,padding:"16px 20px",marginBottom:20,textAlign:"left"}}>
            <div style={{fontSize:12,color:"#0369a1",fontWeight:700,marginBottom:8}}>📋 ¿Cómo consultar tu postulación?</div>
            <div style={{fontSize:13,color:"#555",lineHeight:1.7}}>
              Puedes revisar el estado de tu postulación en cualquier momento ingresando al portal con tu:
              <br/><br/>
              <strong>✉️ Correo electrónico</strong><br/>
              <strong>🪪 {docLabel}</strong>
            </div>
          </div>
          <button className="btn-orange" style={{maxWidth:200,margin:"0 auto"}} onClick={onVolver}>Volver al inicio</button>
        </div>
      </div>
    </div>
  );
}

function ViewPostulacion({ data, onVolver }) {
  const {lead,historial}=data;
  const ETAPA_COLOR={"Nuevo Lead":"#3B82F6","Nuevo":"#3B82F6","Contactado":"#8B5CF6","Reunión Agendada":"#F59E0B","Propuesta Enviada":"#F97316","Negociación":"#EC4899","Propuesta Aceptada":"#10B981","Propuesta Rechazada":"#EF4444","Contrato Firmado":"#10B981","Base Datos Leads":"#6B7280","Ganado":"#10B981","Perdido":"#EF4444"};
  const ETAPA_ICON={"Nuevo Lead":"🎯","Nuevo":"🎯","Contactado":"📞","Reunión Agendada":"📅","Propuesta Enviada":"📄","Negociación":"🤝","Propuesta Aceptada":"✅","Propuesta Rechazada":"❌","Contrato Firmado":"📝","Base Datos Leads":"🗃️","Ganado":"✅","Perdido":"❌"};
  const ETAPA_DISPLAY={"Entrevistas y Validaciones":"Validaciones","Postulante Aprobado":"Aprobado","Postulante No Calificado":"No Calificado","Onboarding Pendiente":"Onboarding Pendiente","Contrato No Firmado":"Contrato No Firmado"};
  const etapaLabel=(e)=>ETAPA_DISPLAY[e]||e;
  const etapaColor=ETAPA_COLOR[lead.etapa]||"#888";
  // Construir historial completo incluyendo etapa inicial
  const historialCompleto=[
    {etapa_nueva:"Postulación recibida",created_at:lead.created_at,etapa_anterior:null},
    ...historial,
    ...(lead.etapa&&!historial.find(h=>h.etapa_nueva===lead.etapa)?[{etapa_nueva:lead.etapa,created_at:lead.updated_at||lead.created_at,etapa_anterior:historial[historial.length-1]?.etapa_nueva||"Postulación recibida"}]:[]),
  ];
  return(
    <div>
      <div className="topbar"><span className="logo">Big<span>ticket</span></span></div>
      <div style={{maxWidth:480,margin:"0 auto",padding:"20px 16px"}}>
        <button onClick={onVolver} style={{background:"none",border:"none",color:"#888",fontSize:13,cursor:"pointer",marginBottom:16}}>← Volver</button>
        <div style={{background:"#fff",borderRadius:16,border:"0.5px solid #e4e7ec",padding:"20px 24px",marginBottom:16}}>
          <div style={{fontSize:11,color:"#888",fontWeight:700,letterSpacing:1,textTransform:"uppercase",marginBottom:4}}>Código</div>
          <div style={{fontSize:22,fontWeight:900,color:"#1a1a1a",letterSpacing:2,fontFamily:"monospace",marginBottom:16}}>{lead.codigo_postulacion}</div>
          <div style={{fontSize:16,fontWeight:700,color:"#1a1a1a",marginBottom:4}}>{lead.nombre}</div>
          {lead.empresa&&<div style={{fontSize:13,color:"#555",marginBottom:12}}>{lead.empresa}</div>}
          <div style={{display:"inline-flex",alignItems:"center",gap:8,background:etapaColor+"18",border:`1px solid ${etapaColor}44`,borderRadius:20,padding:"6px 14px"}}>
            <span style={{fontSize:16}}>{ETAPA_ICON[lead.etapa]||"📋"}</span>
            <span style={{fontSize:13,fontWeight:700,color:etapaColor}}>{lead.etapa||"En revisión"}</span>
          </div>
        </div>
        <div style={{background:"#fff",borderRadius:16,border:"0.5px solid #e4e7ec",padding:"20px 24px",marginBottom:16}}>
          <div style={{fontSize:11,color:"#888",fontWeight:700,letterSpacing:1,textTransform:"uppercase",marginBottom:16}}>Datos de tu postulación</div>
          {[["📅","Postulado el",new Date(lead.created_at).toLocaleDateString("es-CL",{day:"2-digit",month:"long",year:"numeric"})],["📋","Campaña",lead.origen],["📍","País",lead.pais],["📞","Teléfono",lead.telefono],["📧","Correo",lead.email]].filter(([,,v])=>v).map(([icon,k,v])=>(
            <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:"1px solid #f4f5f7"}}>
              <span style={{fontSize:13,color:"#888"}}>{icon} {k}</span>
              <span style={{fontSize:13,color:"#1a1a1a",fontWeight:600,textAlign:"right",maxWidth:"55%"}}>{v}</span>
            </div>
          ))}
        </div>
        <div style={{background:"#fff",borderRadius:16,border:"0.5px solid #e4e7ec",padding:"20px 24px"}}>
            <div style={{fontSize:11,color:"#888",fontWeight:700,letterSpacing:1,textTransform:"uppercase",marginBottom:16}}>Historial de tu postulación</div>
            <div style={{position:"relative",paddingLeft:28}}>
              <div style={{position:"absolute",left:10,top:0,bottom:0,width:2,background:"#e4e7ec"}}/>
              {historialCompleto.map((h,i)=>(
                <div key={i} style={{marginBottom:16,position:"relative"}}>
                  <div style={{position:"absolute",left:-24,top:2,width:10,height:10,borderRadius:"50%",background:ETAPA_COLOR[h.etapa_nueva]||"#F47B20",border:"2px solid #fff",boxShadow:i===historialCompleto.length-1?"0 0 0 3px "+((ETAPA_COLOR[h.etapa_nueva]||"#F47B20")+"33"):"none"}}/>
                  <div style={{fontSize:13,fontWeight:700,color:ETAPA_COLOR[h.etapa_nueva]||"#1a1a1a"}}>{ETAPA_ICON[h.etapa_nueva]||"📋"} {etapaLabel(h.etapa_nueva)}{i===historialCompleto.length-1&&<span style={{fontSize:10,background:"#F47B20",color:"#fff",borderRadius:10,padding:"1px 7px",marginLeft:6,fontWeight:600}}>Actual</span>}</div>
                  <div style={{fontSize:11,color:"#888",marginTop:2}}>{new Date(h.created_at).toLocaleDateString("es-CL",{day:"2-digit",month:"short",year:"numeric"})} · {new Date(h.created_at).toLocaleTimeString("es-CL",{hour:"2-digit",minute:"2-digit"})}</div>
                </div>
              ))}
            </div>
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
        <div style={{fontSize:13,color:"#888",textAlign:"center",marginBottom:24}}>Solo para personal autorizado Bigticket</div>
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
  const [uploadingId,setUploadingId]=useState(null);
  const [editandoPropuesta,setEditandoPropuesta]=useState(null); // campana completa
  const [previewPropuesta,setPreviewPropuesta]=useState(null); // campana completa
  const [editandoCampana,setEditandoCampana]=useState(null);
  const [verScoring,setVerScoring]=useState(null);

  const guardarCampana = async () => {
    if(!editandoCampana) return;
    if(!editandoCampana.nombre.trim()){alert("El nombre es obligatorio.");return;}
    try {
      const {error} = await sb.from("campanas").update({
        nombre: editandoCampana.nombre,
        pais: editandoCampana.pais,
        vehiculo: editandoCampana.vehiculo||null,
        volumen_m3: editandoCampana.volumen_m3||null,
        cantidad: parseInt(editandoCampana.cantidad)||null,
        zona: editandoCampana.zona||null,
        factura: editandoCampana.factura,
        modalidad_pago: editandoCampana.modalidad_pago,
        disponibilidad: editandoCampana.disponibilidad,
        experiencia_anios: parseInt(editandoCampana.experiencia_anios)||0,
        ingreso_rango: editandoCampana.ingreso_rango||null,
        descripcion: editandoCampana.descripcion||null,
        fecha_inicio: editandoCampana.fecha_inicio||null,
        fecha_fin: editandoCampana.fecha_fin||null,
        toggle_activo: editandoCampana.toggle_activo,
      }).eq("id", editandoCampana.id);
      if(error) throw error;
      setCampaigns(campaigns.map(c=>c.id===editandoCampana.id?{...c,...editandoCampana}:c));
      alert("✅ Campaña actualizada correctamente");
      setEditandoCampana(null);
    } catch(e){alert("Error: "+e.message);}
  };

  useEffect(()=>{if(tab==="postulaciones")loadPost();},[tab]);

  async function loadPost() {
    setLoadingPost(true);
    const {data}=await sb.from("postulaciones").select("*, leads(nombre,telefono,vehiculo_veredicto,vehiculo_score,vehiculo_comentario,url_vehiculo), campanas(nombre)").order("created_at",{ascending:false}).limit(50);
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
  async function subirPropuesta(camp, file) {
    if(!file) return;
    if(file.type!=="application/pdf"){alert("Solo se permiten archivos PDF.");return;}
    setUploadingId(camp.id);
    try {
      const path=`campana_${camp.id}.pdf`;
      const {error:upErr}=await sb.storage.from("propuestas").upload(path, file, {upsert:true, contentType:"application/pdf"});
      if(upErr) throw upErr;
      const {data:urlData}=sb.storage.from("propuestas").getPublicUrl(path);
      const url=urlData.publicUrl;
      await sb.from("campanas").update({propuesta_url:url}).eq("id",camp.id);
      setCampaigns(campaigns.map(c=>c.id===camp.id?{...c,propuesta_url:url}:c));
      alert("✅ Propuesta cargada correctamente.");
    } catch(e){alert("Error subiendo PDF: "+e.message);}
    finally{setUploadingId(null);}
  }

  const TRAMOS = ["0-100","101-150","151-200","201-250","251+"];

  const guardarPropuesta = async () => {
    if(!editandoPropuesta) return;
    try {
      const {error} = await sb.from("campanas").update({
        propuesta_cliente: editandoPropuesta.propuesta_cliente||"",
        propuesta_cedis: editandoPropuesta.propuesta_cedis||"",
        propuesta_horario: editandoPropuesta.propuesta_horario||"",
        propuesta_entregas: editandoPropuesta.propuesta_entregas||"",
        propuesta_devolucion: editandoPropuesta.propuesta_devolucion||"",
        propuesta_tarifas: editandoPropuesta.propuesta_tarifas,
        propuesta_auxiliar: editandoPropuesta.propuesta_auxiliar||"",
        propuesta_ns_minimo: editandoPropuesta.propuesta_ns_minimo||"",
        propuesta_ns_excelente: editandoPropuesta.propuesta_ns_excelente||"",
        propuesta_ns_premio: editandoPropuesta.propuesta_ns_premio||"",
        propuesta_ns_castigo: editandoPropuesta.propuesta_ns_castigo||"",
        propuesta_semana_retenida: editandoPropuesta.propuesta_semana_retenida,
        propuesta_vigencia: editandoPropuesta.propuesta_vigencia||"",
        propuesta_requisitos: editandoPropuesta.propuesta_requisitos||"",
        propuesta_notas: editandoPropuesta.propuesta_notas||"",
      }).eq("id", editandoPropuesta.id);
      if(error) throw error;
      setCampaigns(campaigns.map(c=>c.id===editandoPropuesta.id?{...c,...editandoPropuesta}:c));
      alert("✅ Propuesta actualizada correctamente");
      setEditandoPropuesta(null);
    } catch(e){alert("Error: "+e.message);}
  };

  const updEP = (k,v) => setEditandoPropuesta(p=>({...p,[k]:v}));
  const updTarifaEP = (ci,tramo,val) => setEditandoPropuesta(p=>{
    const t=[...p.propuesta_tarifas];
    t[ci]={...t[ci],tramos:{...t[ci].tramos,[tramo]:val}};
    return {...p,propuesta_tarifas:t};
  });

  return (
    <div>
      {/* Modal Scoring */}
      {verScoring&&(
        <ModalScoring campana={verScoring} onClose={()=>setVerScoring(null)}
          onGuardar={(campanaActualizada)=>{
            setCampaigns(campaigns.map(c=>c.id===campanaActualizada.id?campanaActualizada:c));
            setVerScoring(campanaActualizada);
          }}
        />
      )}

      {/* Modal Editar Campaña */}
      {editandoCampana&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",zIndex:200,overflowY:"auto",padding:"20px 16px"}}>
          <div style={{maxWidth:640,margin:"0 auto",background:"#fff",borderRadius:16,overflow:"hidden",boxShadow:"0 20px 60px rgba(0,0,0,0.3)"}}>
            <div style={{background:"#002f5d",padding:"16px 24px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <div>
                <div style={{color:"#F47B20",fontSize:11,fontWeight:700,letterSpacing:1,textTransform:"uppercase"}}>Editar campaña</div>
                <div style={{color:"#fff",fontSize:16,fontWeight:700,marginTop:2}}>{editandoCampana.nombre}</div>
              </div>
              <button onClick={()=>setEditandoCampana(null)}
                style={{background:"rgba(255,255,255,0.15)",border:"none",color:"#fff",borderRadius:"50%",width:32,height:32,cursor:"pointer",fontSize:18,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
            </div>
            <div style={{padding:"20px 24px",overflowY:"auto",maxHeight:"72vh",display:"flex",flexDirection:"column",gap:12}}>
              {/* Toggle activo */}
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 14px",background:"#f8f9fa",borderRadius:10}}>
                <span style={{fontSize:13,fontWeight:600,color:"#1a1a1a"}}>Estado de la campaña</span>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <span style={{fontSize:12,color:editandoCampana.toggle_activo?"#166534":"#c0392b",fontWeight:600}}>
                    {editandoCampana.toggle_activo?"Activa":"Inactiva"}
                  </span>
                  <Toggle on={editandoCampana.toggle_activo} onChange={()=>setEditandoCampana(p=>({...p,toggle_activo:!p.toggle_activo}))}/>
                </div>
              </div>
              {/* Info básica */}
              <div className="field-row"><span className="field-label">Nombre de la campaña *</span>
                <input value={editandoCampana.nombre||""} onChange={e=>setEditandoCampana(p=>({...p,nombre:e.target.value}))} placeholder="Nombre de la campaña"/>
              </div>
              <div className="two-col">
                <div className="field-row"><span className="field-label">País</span>
                  <select value={editandoCampana.pais||"Chile"} onChange={e=>setEditandoCampana(p=>({...p,pais:e.target.value}))}>
                    <option>Chile</option><option>México</option>
                  </select>
                </div>
                <div className="field-row"><span className="field-label">Tipo de vehículo</span>
                  <input value={editandoCampana.vehiculo||""} onChange={e=>setEditandoCampana(p=>({...p,vehiculo:e.target.value}))} placeholder="Ej: Large Van"/>
                </div>
              </div>
              <div className="two-col">
                <div className="field-row"><span className="field-label">Volumen (m³)</span>
                  <input value={editandoCampana.volumen_m3||""} onChange={e=>setEditandoCampana(p=>({...p,volumen_m3:e.target.value}))} placeholder="Ej: 5.5 - 12.9 m³"/>
                </div>
                <div className="field-row"><span className="field-label">Cantidad de vehículos</span>
                  <input type="number" value={editandoCampana.cantidad||""} onChange={e=>setEditandoCampana(p=>({...p,cantidad:e.target.value}))} placeholder="10"/>
                </div>
              </div>
              <div className="two-col">
                <div className="field-row"><span className="field-label">Zona de reparto</span>
                  <input value={editandoCampana.zona||""} onChange={e=>setEditandoCampana(p=>({...p,zona:e.target.value}))} placeholder="Ej: Querétaro"/>
                </div>
                <div className="field-row"><span className="field-label">Factura</span>
                  <select value={editandoCampana.factura||"Sí"} onChange={e=>setEditandoCampana(p=>({...p,factura:e.target.value}))}>
                    <option value="Sí">Sí requiere factura</option>
                    <option value="No">No requiere factura</option>
                  </select>
                </div>
              </div>
              <div className="two-col">
                <div className="field-row"><span className="field-label">Modalidad de pago</span>
                  <select value={editandoCampana.modalidad_pago||"Semanal"} onChange={e=>setEditandoCampana(p=>({...p,modalidad_pago:e.target.value}))}>
                    {["Semanal","Quincenal","Mensual"].map(v=><option key={v}>{v}</option>)}
                  </select>
                </div>
                <div className="field-row"><span className="field-label">Disponibilidad</span>
                  <select value={editandoCampana.disponibilidad||"Diurno"} onChange={e=>setEditandoCampana(p=>({...p,disponibilidad:e.target.value}))}>
                    {["Diurno","Nocturno","Mixto"].map(v=><option key={v}>{v}</option>)}
                  </select>
                </div>
              </div>
              <div className="two-col">
                <div className="field-row"><span className="field-label">Experiencia (años)</span>
                  <input type="number" value={editandoCampana.experiencia_anios||0} onChange={e=>setEditandoCampana(p=>({...p,experiencia_anios:e.target.value}))}/>
                </div>
                <div className="field-row"><span className="field-label">Rango de ingresos</span>
                  <input value={editandoCampana.ingreso_rango||""} onChange={e=>setEditandoCampana(p=>({...p,ingreso_rango:e.target.value}))} placeholder="Ej: $1,856 - $2,056 MXN"/>
                </div>
              </div>
              <div className="field-row"><span className="field-label">Descripción</span>
                <textarea value={editandoCampana.descripcion||""} onChange={e=>setEditandoCampana(p=>({...p,descripcion:e.target.value}))} placeholder="Detalles adicionales..."/>
              </div>
              <div className="two-col">
                <div className="field-row"><span className="field-label">Fecha de inicio</span>
                  <input type="date" value={editandoCampana.fecha_inicio||""} onChange={e=>setEditandoCampana(p=>({...p,fecha_inicio:e.target.value}))}/>
                </div>
                <div className="field-row"><span className="field-label">Fecha de cierre</span>
                  <input type="date" value={editandoCampana.fecha_fin||""} onChange={e=>setEditandoCampana(p=>({...p,fecha_fin:e.target.value}))}/>
                </div>
              </div>
            </div>
            <div style={{padding:"12px 24px",borderTop:"1px solid #e4e7ec",background:"#f8f9fa",display:"flex",gap:10}}>
              <button onClick={()=>setEditandoCampana(null)}
                style={{flex:1,background:"#f4f5f7",border:"none",borderRadius:10,padding:"11px",fontSize:13,cursor:"pointer",fontFamily:"'Geist',sans-serif"}}>
                Cancelar
              </button>
              <button onClick={guardarCampana} className="btn-blue" style={{flex:2}}>
                💾 Guardar cambios
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Preview */}
      {previewPropuesta&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",zIndex:200,overflowY:"auto",padding:"20px 16px"}}>
          <div style={{maxWidth:680,margin:"0 auto",background:"#fff",borderRadius:16,overflow:"hidden",boxShadow:"0 20px 60px rgba(0,0,0,0.3)"}}>
            {/* Header con logo */}
            <div style={{background:"#002f5d",padding:"14px 24px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <img src="https://psvdtgjvognbmxfvqbaa.supabase.co/storage/v1/object/public/assets/LOGO%20ENCUESTA%20Y%20PROPUESTA.png"
                alt="Bigticket" style={{height:34,objectFit:"contain"}}/>
              <div style={{display:"flex",alignItems:"center",gap:12}}>
                <span style={{color:"#fff",fontSize:11,fontWeight:600,letterSpacing:1,textTransform:"uppercase"}}>Vista del Conductor</span>
                <button onClick={()=>setPreviewPropuesta(null)}
                  style={{background:"rgba(255,255,255,0.15)",border:"none",color:"#fff",borderRadius:"50%",width:30,height:30,cursor:"pointer",fontSize:18,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
              </div>
            </div>
            <div style={{overflowY:"auto",maxHeight:"75vh"}}>
              {/* Título */}
              <div style={{padding:"24px 24px 16px"}}>
                <div style={{fontSize:22,fontWeight:800,color:"#1a1a1a",marginBottom:6}}>Propuesta Económica</div>
                <div style={{width:48,height:3,background:"#F47B20",borderRadius:2}}/>
              </div>
              {/* Condiciones generales */}
              <div style={{padding:"0 24px 20px"}}>
                <div style={{fontSize:14,fontWeight:700,color:"#1a3a6b",marginBottom:12,display:"flex",alignItems:"center",gap:8}}>
                  <div style={{width:4,height:18,background:"#F47B20",borderRadius:2}}/>
                  Condiciones Generales de la Operación
                </div>
                <div style={{background:"#f8f9fa",borderRadius:10,padding:"16px",display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,border:"0.5px solid #e4e7ec"}}>
                  {[["📍","Dirección CEDIS",previewPropuesta.propuesta_cedis,"#e74c3c"],
                    ["🕐","Horario",previewPropuesta.propuesta_horario,"#F47B20"],
                    ["📦","Entregas estimadas",previewPropuesta.propuesta_entregas,"#27ae60"],
                    ["🗓","Devolución",previewPropuesta.propuesta_devolucion,"#2980b9"],
                  ].filter(([,,,])=>true).map(([ic,l,v,c])=>v&&(
                    <div key={l}>
                      <div style={{fontSize:10,color:"#1a1a1a",fontWeight:700,textTransform:"uppercase",marginBottom:3}}>{ic} {l}</div>
                      <div style={{fontSize:13,fontWeight:400,color:"#1a1a1a"}}>{v}</div>
                    </div>
                  ))}
                </div>
              </div>
              {/* Tarifas */}
              {previewPropuesta.propuesta_tarifas?.length>0&&(
                <div style={{padding:"0 24px 20px"}}>
                  <div style={{fontSize:14,fontWeight:700,color:"#1a3a6b",marginBottom:12,display:"flex",alignItems:"center",gap:8}}>
                    <div style={{width:4,height:18,background:"#F47B20",borderRadius:2}}/>
                    Tarifas por Jornada
                  </div>
                  <div style={{overflowX:"auto",borderRadius:10,overflow:"hidden",border:"0.5px solid #e4e7ec"}}>
                    <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                      <thead>
                        <tr style={{background:"#1a3a6b",color:"#fff"}}>
                          <th style={{padding:"9px 12px",textAlign:"left"}}>Categoría</th>
                          {TRAMOS.map(t=><th key={t} style={{padding:"9px 8px",textAlign:"center"}}>{t} km</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        {previewPropuesta.propuesta_tarifas.map((t,i)=>(
                          <tr key={i} style={{background:i%2===0?"#f8f9fa":"#fff",borderBottom:"0.5px solid #e4e7ec"}}>
                            <td style={{padding:"9px 12px",fontWeight:700,color:"#1a1a1a"}}>{t.categoria}</td>
                            {TRAMOS.map(k=><td key={k} style={{padding:"9px 8px",textAlign:"center",fontWeight:600,color:"#1a1a1a"}}>{t.tramos?.[k]?`$ ${t.tramos[k]}`:"—"}</td>)}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div style={{fontSize:11,color:"#888",marginTop:6}}>*Valores netos + IVA{previewPropuesta.propuesta_auxiliar?` | Auxiliar: ${previewPropuesta.propuesta_auxiliar}`:""}</div>
                </div>
              )}
              {/* NS */}
              <div style={{padding:"0 24px 20px"}}>
                <div style={{fontSize:14,fontWeight:700,color:"#1a3a6b",marginBottom:12,display:"flex",alignItems:"center",gap:8}}>
                  <div style={{width:4,height:18,background:"#F47B20",borderRadius:2}}/>
                  Nivel de Servicio
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
                  <div style={{background:"#f0f2f5",borderRadius:10,padding:"14px",textAlign:"center"}}>
                    <div style={{fontSize:10,color:"#888",fontWeight:700,textTransform:"uppercase",marginBottom:6}}>Mínimo exigido</div>
                    <div style={{fontSize:22,fontWeight:800,color:"#1a3a6b"}}>{previewPropuesta.propuesta_ns_minimo||"99.00%"}</div>
                  </div>
                  <div style={{background:"#f0fdf4",borderRadius:10,padding:"14px",textAlign:"center",border:"1.5px solid #86efac"}}>
                    <div style={{fontSize:10,color:"#166534",fontWeight:700,textTransform:"uppercase",marginBottom:6}}>Excelente 🏆</div>
                    <div style={{fontSize:16,fontWeight:800,color:"#166534"}}>{previewPropuesta.propuesta_ns_excelente}</div>
                    <div style={{fontSize:11,color:"#166534",marginTop:4}}>Premio: {previewPropuesta.propuesta_ns_premio}</div>
                  </div>
                </div>
                <div style={{background:"#fffbeb",borderRadius:10,padding:"12px 16px",border:"1px solid #fde68a",display:"flex",gap:8,alignItems:"flex-start"}}>
                  <span style={{color:"#F47B20",flexShrink:0}}>⚠️</span>
                  <div style={{fontSize:12,color:"#92400e"}}><strong>Castigo:</strong> {previewPropuesta.propuesta_ns_castigo}</div>
                </div>
              </div>
              {/* Pagos */}
              <div style={{padding:"0 24px 20px"}}>
                <div style={{fontSize:14,fontWeight:700,color:"#1a3a6b",marginBottom:12,display:"flex",alignItems:"center",gap:8}}>
                  <div style={{width:4,height:18,background:"#F47B20",borderRadius:2}}/>
                  Condiciones de Pago
                </div>
                <div style={{fontSize:13,color:"#444",display:"flex",flexDirection:"column",gap:8}}>
                  {["Pago semanal cada viernes","Transferencia bancaria, previa emisión de CFDI",
                    previewPropuesta.propuesta_semana_retenida?"Semana retenida al inicio como garantía":null,
                    `Vigencia del contrato: ${previewPropuesta.propuesta_vigencia||"12 meses"} condicionado al cumplimiento de los niveles de servicio.`
                  ].filter(Boolean).map((item,i)=>(
                    <div key={i} style={{display:"flex",gap:8,alignItems:"flex-start"}}>
                      <span style={{color:"#27ae60",fontWeight:700,flexShrink:0}}>✓</span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
              {/* Requisitos */}
              {previewPropuesta.propuesta_requisitos&&(
                <div style={{padding:"0 24px 20px"}}>
                  <div style={{fontSize:14,fontWeight:700,color:"#1a3a6b",marginBottom:12,display:"flex",alignItems:"center",gap:8}}>
                    <div style={{width:4,height:18,background:"#F47B20",borderRadius:2}}/>
                    Requisitos del Prestador
                  </div>
                  <div style={{fontSize:13,color:"#444",display:"flex",flexDirection:"column",gap:8}}>
                    {previewPropuesta.propuesta_requisitos.split("\n").filter(Boolean).map((r,i)=>(
                      <div key={i} style={{display:"flex",gap:8,alignItems:"flex-start"}}>
                        <span style={{color:"#27ae60",fontWeight:700,flexShrink:0}}>✓</span>
                        <span>{r}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {previewPropuesta.propuesta_notas&&(
                <div style={{padding:"0 24px 20px"}}>
                  <div style={{background:"#f0f9ff",borderRadius:10,padding:"12px 16px",border:"1px solid #bae6fd",fontSize:12,color:"#0369a1"}}>
                    <strong>📌 Nota:</strong> {previewPropuesta.propuesta_notas}
                  </div>
                </div>
              )}
            </div>
            <div style={{padding:"12px 24px",borderTop:"1px solid #e4e7ec",background:"#f8f9fa"}}>
              <button onClick={()=>setPreviewPropuesta(null)} className="btn-blue" style={{width:"100%"}}>Cerrar preview</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar Propuesta */}
      {editandoPropuesta&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",zIndex:200,overflowY:"auto",padding:"20px 16px"}}>
          <div style={{maxWidth:680,margin:"0 auto",background:"#fff",borderRadius:16,overflow:"hidden",boxShadow:"0 20px 60px rgba(0,0,0,0.3)"}}>
            <div style={{background:"#002f5d",padding:"16px 24px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <div>
                <div style={{color:"#F47B20",fontSize:11,fontWeight:700,letterSpacing:1,textTransform:"uppercase"}}>Editar propuesta económica</div>
                <div style={{color:"#fff",fontSize:16,fontWeight:700,marginTop:2}}>{editandoPropuesta.nombre}</div>
              </div>
              <button onClick={()=>setEditandoPropuesta(null)}
                style={{background:"rgba(255,255,255,0.15)",border:"none",color:"#fff",borderRadius:"50%",width:32,height:32,cursor:"pointer",fontSize:18,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
            </div>
            <div style={{padding:"20px 24px",overflowY:"auto",maxHeight:"70vh",display:"flex",flexDirection:"column",gap:14}}>
              <div className="two-col">
                <div className="field-row"><span className="field-label">Cliente / Operación *</span><input value={editandoPropuesta.propuesta_cliente||""} onChange={e=>updEP("propuesta_cliente",e.target.value)} placeholder="Ej: MELI Querétaro"/></div>
                <div className="field-row"><span className="field-label">CEDIS *</span><input value={editandoPropuesta.propuesta_cedis||""} onChange={e=>updEP("propuesta_cedis",e.target.value)} placeholder="Ej: SQR1 | Av. Zaragoza 61"/></div>
              </div>
              <div className="two-col">
                <div className="field-row"><span className="field-label">Horario de presentación</span><input value={editandoPropuesta.propuesta_horario||""} onChange={e=>updEP("propuesta_horario",e.target.value)} placeholder="Por confirmar"/></div>
                <div className="field-row"><span className="field-label">Entregas estimadas</span><input value={editandoPropuesta.propuesta_entregas||""} onChange={e=>updEP("propuesta_entregas",e.target.value)} placeholder="80-100"/></div>
              </div>
              <div className="field-row"><span className="field-label">Devolución de mercancía no entregada</span><input value={editandoPropuesta.propuesta_devolucion||""} onChange={e=>updEP("propuesta_devolucion",e.target.value)} placeholder="Mismo SVC hasta las 22:00 hrs"/></div>

              {/* Tarifas */}
              <div>
                <span className="field-label" style={{fontSize:13,fontWeight:700,color:"#1a1a1a"}}>Tarifas por jornada *</span>
                <div style={{overflowX:"auto",marginTop:8}}>
                  <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                    <thead>
                      <tr style={{background:"#1a3a6b",color:"#fff"}}>
                        <th style={{padding:"8px 12px",textAlign:"left"}}>Categoría</th>
                        {TRAMOS.map(t=><th key={t} style={{padding:"8px 10px",textAlign:"center"}}>{t} km</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {(editandoPropuesta.propuesta_tarifas||[]).map((cat,ci)=>(
                        <tr key={ci} style={{background:ci%2===0?"#f8f9fa":"#fff"}}>
                          <td style={{padding:"8px 12px",fontWeight:700,color:"#1a3a6b"}}>{cat.categoria}</td>
                          {TRAMOS.map(t=>(
                            <td key={t} style={{padding:4}}>
                              <input value={cat.tramos?.[t]||""} onChange={e=>updTarifaEP(ci,t,e.target.value)}
                                placeholder="$0" style={{width:"100%",padding:"5px 6px",border:"0.5px solid #d0d5dd",borderRadius:6,fontSize:12,textAlign:"center"}}/>
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="field-row"><span className="field-label">Tarifa auxiliar diario</span><input value={editandoPropuesta.propuesta_auxiliar||""} onChange={e=>updEP("propuesta_auxiliar",e.target.value)} placeholder="$300 MXN por día"/></div>
              <div className="two-col">
                <div className="field-row"><span className="field-label">NS mínimo</span><input value={editandoPropuesta.propuesta_ns_minimo||""} onChange={e=>updEP("propuesta_ns_minimo",e.target.value)} placeholder="99.00%"/></div>
                <div className="field-row"><span className="field-label">NS excelente</span><input value={editandoPropuesta.propuesta_ns_excelente||""} onChange={e=>updEP("propuesta_ns_excelente",e.target.value)} placeholder="99.50% - 100%"/></div>
              </div>
              <div className="two-col">
                <div className="field-row"><span className="field-label">Premio NS excelente</span><input value={editandoPropuesta.propuesta_ns_premio||""} onChange={e=>updEP("propuesta_ns_premio",e.target.value)} placeholder="5% sobre tarifa diaria"/></div>
                <div className="field-row"><span className="field-label">Castigo bajo NS</span><input value={editandoPropuesta.propuesta_ns_castigo||""} onChange={e=>updEP("propuesta_ns_castigo",e.target.value)} placeholder="3% sobre tarifa base"/></div>
              </div>
              <div className="two-col">
                <div className="field-row"><span className="field-label">Vigencia del contrato</span><input value={editandoPropuesta.propuesta_vigencia||""} onChange={e=>updEP("propuesta_vigencia",e.target.value)} placeholder="12 meses"/></div>
                <div className="field-row" style={{display:"flex",alignItems:"center",paddingTop:20}}>
                  <label style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",fontSize:13}}>
                    <input type="checkbox" checked={editandoPropuesta.propuesta_semana_retenida||false} style={{width:"auto"}} onChange={e=>updEP("propuesta_semana_retenida",e.target.checked)}/>
                    Semana retenida como garantía
                  </label>
                </div>
              </div>
              <div className="field-row"><span className="field-label">Requisitos (uno por línea)</span>
                <textarea value={editandoPropuesta.propuesta_requisitos||""} onChange={e=>updEP("propuesta_requisitos",e.target.value)} style={{height:100}} placeholder="Carta de no antecedentes penales&#10;Licencia vigente..."/>
              </div>
              <div className="field-row"><span className="field-label">Notas adicionales</span>
                <textarea value={editandoPropuesta.propuesta_notas||""} onChange={e=>updEP("propuesta_notas",e.target.value)} style={{height:60}} placeholder="Condiciones especiales..."/>
              </div>
            </div>
            <div style={{padding:"12px 24px",borderTop:"1px solid #e4e7ec",background:"#f8f9fa",display:"flex",gap:10}}>
              <button onClick={()=>setEditandoPropuesta(null)}
                style={{flex:1,background:"#f4f5f7",border:"none",borderRadius:10,padding:"11px",fontSize:13,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>
                Cancelar
              </button>
              <button onClick={guardarPropuesta} className="btn-blue" style={{flex:2}}>
                💾 Guardar propuesta
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{background:"#1a3a6b",padding:"12px 20px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div>
          <div style={{color:"#fff",fontSize:15,fontWeight:600}}>Panel administrador</div>
          <div style={{color:"#aac3e8",fontSize:12}}>Bigticket — Gestión de campañas</div>
        </div>
        <button className="btn-gw" onClick={onClose}>Ver portal →</button>
      </div>
      <div className="admin-nav">
        {[["camps","Campañas"],["nueva","Nueva campaña"],["postulaciones","Postulaciones"],["vehiculos","🚗 Vehículos"],["canales","Canales"],["centros_mx","Centros México"],["biggy","🤖 Biggy"],["feedback","📋 Feedback"]].map(([k,l])=>(
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
                  <div key={c.id} className="camp-row" style={{flexDirection:"column",alignItems:"flex-start",gap:12}}>
                    <div style={{display:"flex",width:"100%",alignItems:"center",gap:10}}>
                      <div style={{flex:1}}>
                        <div style={{fontSize:14,fontWeight:600,color:"#1a1a1a"}}>{c.nombre}
                          <span style={{fontSize:11,padding:"2px 8px",borderRadius:20,marginLeft:8,background:active?"#dcfce7":"#fee2e2",color:active?"#166534":"#c0392b"}}>{active?"Activa":"Inactiva"}</span>
                        </div>
                        <div style={{fontSize:12,color:"#888",marginTop:2}}>{c.pais} · {c.vehiculo} · Score máx: {c.score_max} pts{c.fecha_inicio?` · ${c.fecha_inicio} → ${c.fecha_fin}`:""}</div>
                      </div>
                      <div style={{display:"flex",alignItems:"center",gap:10}}>
                        <Toggle on={c.toggle_activo} onChange={()=>toggleCamp(c)}/>
                        <button onClick={()=>setEditandoCampana({...c})}
                          style={{fontSize:11,padding:"4px 10px",borderRadius:6,border:"1px solid #bfdbfe",background:"#eff6ff",color:"#1d4ed8",cursor:"pointer",fontFamily:"'Geist',sans-serif",fontWeight:600}}>
                          ✏️ Editar
                        </button>
                        <button onClick={()=>setVerScoring(c)}
                          style={{fontSize:11,padding:"4px 10px",borderRadius:6,border:"1px solid #d8b4fe",background:"#faf5ff",color:"#7c3aed",cursor:"pointer",fontFamily:"'Geist',sans-serif",fontWeight:600}}>
                          ⭐ Scoring
                        </button>
                        <button className="btn-danger" onClick={()=>deleteCamp(c.id)}>Eliminar</button>
                      </div>
                    </div>
                    {/* Propuesta */}
                    <div style={{width:"100%",background:"#f8f9fa",borderRadius:10,padding:"10px 14px",border:"1px solid #e4e7ec"}}>
                      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
                        <div style={{fontSize:12,fontWeight:700,color:"#1a1a1a"}}>📄 Propuesta económica</div>
                        <div style={{display:"flex",gap:6}}>
                          {c.propuesta_cedis&&(
                            <button onClick={()=>setPreviewPropuesta(c)}
                              style={{fontSize:11,padding:"3px 10px",borderRadius:6,border:"1px solid #bfdbfe",background:"#eff6ff",color:"#1d4ed8",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontWeight:600}}>
                              👁 Preview
                            </button>
                          )}
                          <button onClick={()=>setEditandoPropuesta({...c,
                            propuesta_tarifas: c.propuesta_tarifas || [
                              {categoria:"Large Van",tramos:{"0-100":"","101-150":"","151-200":"","201-250":"","251+":""}},
                              {categoria:"Small Van",tramos:{"0-100":"","101-150":"","151-200":"","201-250":"","251+":""}},
                            ]
                          })}
                            style={{fontSize:11,padding:"3px 10px",borderRadius:6,border:"1px solid #fed7aa",background:"#fff7ed",color:"#c2410c",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontWeight:600}}>
                            ✏️ {c.propuesta_cedis?"Editar":"Agregar"} propuesta
                          </button>
                        </div>
                      </div>
                      {c.propuesta_cedis?(
                        <span style={{fontSize:12,color:"#10B981"}}>✅ Propuesta incluida — {c.propuesta_cliente||"cliente"}</span>
                      ):(
                        <span style={{fontSize:12,color:"#c0392b"}}>⚠️ Sin propuesta</span>
                      )}
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
                      {p.leads?.vehiculo_veredicto&&(()=>{
                        const v=p.leads.vehiculo_veredicto;
                        const color=v==="Aprobado"?"#166534":v==="Revisar"?"#92400e":"#c0392b";
                        const bg=v==="Aprobado"?"#dcfce7":v==="Revisar"?"#fef3c7":"#fee2e2";
                        const icon=v==="Aprobado"?"✅":v==="Revisar"?"⚠️":"❌";
                        return (
                          <div style={{marginTop:5,display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
                            <span style={{fontSize:11,padding:"2px 8px",borderRadius:20,background:bg,color,fontWeight:600}}>{icon} Vehículo: {v}</span>
                            {p.leads.vehiculo_score!=null&&<span style={{fontSize:11,color:"#888"}}>Score: {p.leads.vehiculo_score}/100</span>}
                            {p.leads.vehiculo_comentario&&<span style={{fontSize:11,color:"#888",fontStyle:"italic"}}>"{p.leads.vehiculo_comentario}"</span>}
                          </div>
                        );
                      })()}
                    </div>
                    <div style={{textAlign:"right"}}>
                      <div style={{fontSize:16,fontWeight:700,color:"#1a3a6b"}}>{p.score_calculado} pts</div>
                      {p.leads?.url_vehiculo&&<a href={p.leads.url_vehiculo} target="_blank" style={{fontSize:11,color:"#1a3a6b",display:"block",marginTop:4}}>📷 Ver foto</a>}
                    </div>
                  </div>
                );
              })
            }
          </div>
        )}
        {tab==="vehiculos"&&<VehiculosVerificacion/>}
        {tab==="canales"&&<CanalesView postulaciones={postulaciones} onLoad={loadPost}/>}
        {tab==="centros_mx"&&<CentrosMxAdmin/>}
        {tab==="biggy"&&<BiggyAdmin/>}
        {tab==="feedback"&&<FeedbackAdmin/>}
      </div>
    </div>
  );
}


function BiggyAdmin() {
  const CATEGORIAS = ["Tarifas México","Tarifas Chile","Pagos","CEDIS","Documentos México","Documentos Chile","Operaciones México","Operaciones Chile","Contrato","Desempeño","General"];
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [editando, setEditando] = useState(null);
  const [nuevo, setNuevo] = useState({categoria:"General", pregunta:"", respuesta:""});
  const [showForm, setShowForm] = useState(false);
  const [filtro, setFiltro] = useState("Todos");

  useEffect(() => { cargar(); }, []);

  const cargar = async () => {
    setLoading(true);
    const {data, error} = await sb.from("biggy_conocimiento").select("*").order("categoria").order("created_at", {ascending:true});
    if(error) console.error("Error cargando:", error);
    setItems(data||[]);
    setLoading(false);
  };

  const guardar = async () => {
    if(!nuevo.pregunta.trim()||!nuevo.respuesta.trim()) { alert("Completa pregunta y respuesta."); return; }
    setGuardando(true);
    try {
      const payload = {
        categoria: nuevo.categoria,
        pregunta: nuevo.pregunta,
        respuesta: nuevo.respuesta,
        activo: true,
        updated_at: new Date().toISOString()
      };
      console.log("Intentando guardar:", payload);
      const {data, error} = await sb.from("biggy_conocimiento").insert(payload).select();
      console.log("Resultado:", {data, error});
      if(error) throw new Error(error.message + " | Code: " + error.code + " | Details: " + JSON.stringify(error.details));
      setNuevo({categoria:"General", pregunta:"", respuesta:""});
      setShowForm(false);
      await cargar();
    } catch(e) { alert("Error al guardar: "+e.message); }
    finally { setGuardando(false); }
  };

  const actualizar = async () => {
    if(!editando.pregunta.trim()||!editando.respuesta.trim()) return;
    setGuardando(true);
    try {
      const {error} = await sb.from("biggy_conocimiento").update({
        categoria: editando.categoria,
        pregunta: editando.pregunta,
        respuesta: editando.respuesta,
        updated_at: new Date().toISOString()
      }).eq("id", editando.id);
      if(error) throw error;
      setEditando(null);
      await cargar();
    } catch(e) { alert("Error: "+e.message); }
    finally { setGuardando(false); }
  };

  const toggleActivo = async (item) => {
    const {error} = await sb.from("biggy_conocimiento").update({activo: !item.activo}).eq("id", item.id);
    if(error) { alert("Error: "+error.message); return; }
    setItems(prev => prev.map(i => i.id===item.id ? {...i, activo: !i.activo} : i));
  };

  const eliminar = async (id) => {
    if(!confirm("¿Eliminar este conocimiento?")) return;
    const {error} = await sb.from("biggy_conocimiento").delete().eq("id", id);
    if(error) { alert("Error: "+error.message); return; }
    setItems(prev => prev.filter(i => i.id!==id));
  };

  const categorias = ["Todos", ...CATEGORIAS];
  const filtrados = filtro==="Todos" ? items : items.filter(i=>i.categoria===filtro);
  const activos = items.filter(i=>i.activo).length;

  return (
    <div>
      <div className="sec-title" style={{marginBottom:4}}>🤖 Entrenamiento de Biggy</div>
      <div className="sec-sub">Agrega preguntas y respuestas para que Biggy responda mejor en WhatsApp y en el portal</div>

      {/* Stats */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:20,marginTop:16}}>
        {[["Total",items.length,"#1a3a6b"],["Activos",activos,"#10B981"],["Inactivos",items.length-activos,"#888"]].map(([l,v,c])=>(
          <div key={l} style={{background:"#fff",border:"0.5px solid #e4e7ec",borderRadius:10,padding:"12px 16px",textAlign:"center"}}>
            <div style={{fontSize:24,fontWeight:800,color:c}}>{v}</div>
            <div style={{fontSize:11,color:"#888",marginTop:2}}>{l}</div>
          </div>
        ))}
      </div>

      {/* Filtro por categoría */}
      <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:16}}>
        {categorias.map(c=>(
          <button key={c} onClick={()=>setFiltro(c)}
            style={{padding:"5px 12px",borderRadius:20,border:"1px solid #e4e7ec",fontSize:11,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",
              background:filtro===c?"#1a3a6b":"#fff",color:filtro===c?"#fff":"#555",fontWeight:filtro===c?700:400}}>
            {c}
          </button>
        ))}
      </div>

      {/* Botón agregar */}
      {!showForm&&(
        <button className="btn-orange" style={{marginBottom:16}} onClick={()=>setShowForm(true)}>
          + Agregar nuevo conocimiento
        </button>
      )}

      {/* Formulario nuevo */}
      {showForm&&(
        <div className="form-card" style={{marginBottom:16,border:"1px solid #F47B20"}}>
          <div className="form-title">➕ Nuevo conocimiento para Biggy</div>
          <div className="field-row">
            <span className="field-label">Categoría</span>
            <select value={nuevo.categoria} onChange={e=>setNuevo({...nuevo,categoria:e.target.value})}
              style={{width:"100%",padding:"9px 12px",borderRadius:8,border:"0.5px solid #d0d5dd",fontSize:13}}>
              {CATEGORIAS.map(c=><option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="field-row">
            <span className="field-label">Pregunta que podría hacer el usuario</span>
            <input value={nuevo.pregunta} onChange={e=>setNuevo({...nuevo,pregunta:e.target.value})}
              placeholder="Ej: ¿Cuánto paga la Large Van?"/>
          </div>
          <div className="field-row">
            <span className="field-label">Respuesta que debe dar Biggy</span>
            <textarea value={nuevo.respuesta} onChange={e=>setNuevo({...nuevo,respuesta:e.target.value})}
              placeholder="Ej: La tarifa es de $2,056 MXN netos + IVA por jornada..." style={{height:100}}/>
          </div>
          <div style={{display:"flex",gap:10}}>
            <button className="btn-orange" onClick={guardar} disabled={guardando} style={{flex:1}}>
              {guardando?"Guardando...":"💾 Guardar"}
            </button>
            <button onClick={()=>{setShowForm(false);setNuevo({categoria:"General",pregunta:"",respuesta:""});}}
              style={{flex:1,background:"#f4f5f7",border:"none",borderRadius:10,padding:"11px",fontSize:13,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Lista */}
      {loading ? <div className="loading">Cargando...</div> :
        filtrados.length===0 ? <div className="empty">No hay conocimiento en esta categoría aún.</div> :
        filtrados.map(item=>(
          <div key={item.id} style={{background:"#fff",border:`0.5px solid ${item.activo?"#e4e7ec":"#f0f0f0"}`,borderRadius:10,padding:"14px 16px",marginBottom:10,opacity:item.activo?1:0.6}}>
            {editando?.id===item.id ? (
              <div>
                <div className="field-row">
                  <span className="field-label">Categoría</span>
                  <select value={editando.categoria} onChange={e=>setEditando({...editando,categoria:e.target.value})}
                    style={{width:"100%",padding:"8px 12px",borderRadius:8,border:"0.5px solid #d0d5dd",fontSize:13}}>
                    {CATEGORIAS.map(c=><option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="field-row">
                  <span className="field-label">Pregunta</span>
                  <input value={editando.pregunta} onChange={e=>setEditando({...editando,pregunta:e.target.value})}/>
                </div>
                <div className="field-row">
                  <span className="field-label">Respuesta</span>
                  <textarea value={editando.respuesta} onChange={e=>setEditando({...editando,respuesta:e.target.value})} style={{height:80}}/>
                </div>
                <div style={{display:"flex",gap:8}}>
                  <button className="btn-orange" onClick={actualizar} disabled={guardando} style={{flex:1,padding:"8px"}}>
                    {guardando?"Guardando...":"✅ Guardar"}
                  </button>
                  <button onClick={()=>setEditando(null)}
                    style={{flex:1,background:"#f4f5f7",border:"none",borderRadius:8,padding:"8px",fontSize:13,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:10,marginBottom:6}}>
                  <div style={{flex:1}}>
                    <span style={{fontSize:10,padding:"2px 8px",borderRadius:20,background:"#eef2ff",color:"#1a3a6b",fontWeight:700,marginBottom:6,display:"inline-block"}}>
                      {item.categoria}
                    </span>
                    <div style={{fontSize:13,fontWeight:700,color:"#1a1a1a",marginBottom:4}}>❓ {item.pregunta}</div>
                    <div style={{fontSize:12,color:"#555",lineHeight:1.5}}>💬 {item.respuesta}</div>
                  </div>
                  <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4,flexShrink:0}}>
                    <Toggle on={item.activo} onChange={()=>toggleActivo(item)}/>
                    <span style={{fontSize:9,color:"#888"}}>{item.activo?"Activo":"Inactivo"}</span>
                  </div>
                </div>
                <div style={{display:"flex",gap:8,marginTop:8}}>
                  <button onClick={()=>setEditando({...item})}
                    style={{fontSize:11,color:"#1a3a6b",background:"#eef2ff",border:"none",borderRadius:6,padding:"4px 10px",cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>
                    ✏️ Editar
                  </button>
                  <button onClick={()=>eliminar(item.id)} className="btn-danger" style={{fontSize:11,padding:"4px 10px"}}>
                    🗑 Eliminar
                  </button>
                </div>
              </div>
            )}
          </div>
        ))
      }
    </div>
  );
}

function FeedbackForm({ onVolver }) {
  const LOGO = "https://psvdtgjvognbmxfvqbaa.supabase.co/storage/v1/object/public/assets/LOGO%20ENCUESTA%20Y%20PROPUESTA.png";
  const [f, setF] = useState({
    nombre:"", pais:"Chile", dispositivo:"Android",
    t1_facilidad:0, t2_propuesta_clara:0, t3_biggy:0,
    t3_recibio_confirmacion:"", nps:0, mejoras:""
  });
  const [enviado, setEnviado] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const upd = (k,v) => setF(p=>({...p,[k]:v}));

  const Estrellas = ({campo, valor, labels}) => (
    <div style={{display:"flex",flexDirection:"column",gap:6,marginTop:8}}>
      <div style={{display:"flex",gap:10}}>
        {[1,2,3,4,5].map(n=>(
          <button key={n} onClick={()=>upd(campo,n)}
            style={{fontSize:28,background:"none",border:"none",cursor:"pointer",
              opacity:valor>=n?1:0.25,transition:"opacity 0.15s",padding:0}}>★</button>
        ))}
      </div>
      {labels&&<div style={{display:"flex",justifyContent:"space-between"}}>
        <span style={{fontSize:10,color:"#999"}}>{labels[0]}</span>
        <span style={{fontSize:10,color:"#999"}}>{labels[1]}</span>
      </div>}
    </div>
  );

  const enviar = async () => {
    if(!f.nombre.trim()){alert("Ingresa tu nombre.");return;}
    if(!f.t1_facilidad||!f.t2_propuesta_clara||!f.t3_biggy){alert("Por favor responde las 3 preguntas de evaluación.");return;}
    setGuardando(true);
    try {
      const {error} = await sb.from("feedback_testing").insert({
        nombre: f.nombre, pais: f.pais, dispositivo: f.dispositivo,
        t1_facilidad: f.t1_facilidad,
        t6_informacion_clara: f.t2_propuesta_clara,
        t4_experiencia_fluida: f.t3_biggy,
        t3_recibio_confirmacion: f.t3_recibio_confirmacion,
        nps: f.nps, mejoras: f.mejoras,
      });
      if(error) throw error;
      setEnviado(true);
    } catch(e){alert("Error al enviar: "+e.message);}
    finally{setGuardando(false);}
  };

  if(enviado) return(
    <div style={{maxWidth:520,margin:"60px auto",padding:"0 20px"}}>
      <div style={{background:"#fff",borderRadius:16,padding:"40px 32px",textAlign:"center",border:"0.5px solid #e4e7ec"}}>
        <div style={{fontSize:48,marginBottom:16}}>🙏</div>
        <div style={{fontSize:20,fontWeight:700,color:"#1a3a6b",marginBottom:8}}>¡Gracias por tu feedback!</div>
        <div style={{fontSize:13,color:"#555",marginBottom:24}}>Tu opinión nos ayuda a mejorar Bigticket para todos los conductores 🚛</div>
        {onVolver&&<button className="btn-orange" onClick={onVolver} style={{width:"100%"}}>Volver al portal</button>}
      </div>
    </div>
  );

  return(
    <div style={{maxWidth:560,margin:"0 auto",padding:"0 0 40px"}}>
      {/* Header con logo */}
      <div style={{background:"#002f5d",padding:"16px 24px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <img src={LOGO} alt="Bigticket" style={{height:40,objectFit:"contain"}}/>
        <span style={{color:"#fff",fontSize:12,fontWeight:600,letterSpacing:1,textTransform:"uppercase"}}>Feedback de Innovación</span>
      </div>

      <div style={{background:"#fff",padding:"28px 24px 20px",borderBottom:"1px solid #f0f0f0"}}>
        <div style={{fontSize:20,fontWeight:700,color:"#1a1a1a",marginBottom:6}}>Evaluación del Nuevo Flujo de Prospección</div>
        <div style={{fontSize:13,color:"#888"}}>Tu opinión es fundamental para optimizar nuestro modelo de automatización. Solo te tomará 2 minutos.</div>
      </div>

      {/* Datos */}
      <div style={{background:"#fff",padding:"20px 24px",borderBottom:"1px solid #f0f0f0"}}>
        <div style={{fontSize:14,fontWeight:700,color:"#1a1a1a",marginBottom:14}}>Tus datos</div>
        <div className="two-col" style={{marginBottom:14}}>
          <div className="field-row"><span className="field-label">Nombre *</span>
            <input value={f.nombre} onChange={e=>upd("nombre",e.target.value)} placeholder="Tu nombre"/>
          </div>
          <div className="field-row"><span className="field-label">País</span>
            <select value={f.pais} onChange={e=>upd("pais",e.target.value)}>
              <option>Chile</option><option>México</option>
            </select>
          </div>
        </div>
        <div className="field-row"><span className="field-label">Dispositivo que usaste</span>
          <div style={{display:"flex",gap:8,marginTop:6}}>
            {[["Android","🤖"],["iPhone","🍎"],["Computador","💻"]].map(([d,ic])=>(
              <button key={d} onClick={()=>upd("dispositivo",d)}
                style={{flex:1,padding:"9px 8px",borderRadius:8,border:`1.5px solid ${f.dispositivo===d?"#1a3a6b":"#e4e7ec"}`,
                  fontSize:12,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",
                  background:f.dispositivo===d?"#1a3a6b":"#fff",
                  color:f.dispositivo===d?"#fff":"#555",fontWeight:f.dispositivo===d?700:400}}>
                {ic} {d}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Pregunta 1 */}
      <div style={{background:"#fff",padding:"24px 24px",borderBottom:"1px solid #f0f0f0"}}>
        <div style={{fontSize:15,fontWeight:700,color:"#1a1a1a",marginBottom:4}}>1. ¿Qué tan fácil fue completar todo el flujo?</div>
        <Estrellas campo="t1_facilidad" valor={f.t1_facilidad} labels={["1 estrella: Muy difícil","5 estrellas: Muy fácil"]}/>
      </div>

      {/* Pregunta 2 */}
      <div style={{background:"#fff",padding:"24px 24px",borderBottom:"1px solid #f0f0f0"}}>
        <div style={{fontSize:15,fontWeight:700,color:"#1a1a1a",marginBottom:4}}>2. ¿La propuesta económica con tarifas fue clara en tu dispositivo?</div>
        <Estrellas campo="t2_propuesta_clara" valor={f.t2_propuesta_clara} labels={["1 estrella: Muy confusa","5 estrellas: Muy clara"]}/>
      </div>

      {/* Pregunta 3 */}
      <div style={{background:"#fff",padding:"24px 24px",borderBottom:"1px solid #f0f0f0"}}>
        <div style={{fontSize:15,fontWeight:700,color:"#1a1a1a",marginBottom:4}}>3. ¿Recibiste correctamente tu código BT y las confirmaciones?</div>
        <div style={{display:"flex",gap:10,marginTop:10,flexWrap:"wrap"}}>
          {["Sí, todo correcto","Parcialmente","No recibí nada"].map(op=>(
            <button key={op} onClick={()=>upd("t3_recibio_confirmacion",op)}
              style={{padding:"9px 18px",borderRadius:20,border:`1.5px solid ${f.t3_recibio_confirmacion===op?"#1a3a6b":"#e4e7ec"}`,
                fontSize:13,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",
                background:f.t3_recibio_confirmacion===op?"#1a3a6b":"#fff",
                color:f.t3_recibio_confirmacion===op?"#fff":"#555",
                fontWeight:f.t3_recibio_confirmacion===op?700:400}}>
              {op}
            </button>
          ))}
        </div>
      </div>

      {/* Pregunta 4 — Biggy */}
      <div style={{background:"#fff",padding:"24px 24px",borderBottom:"1px solid #f0f0f0"}}>
        <div style={{fontSize:15,fontWeight:700,color:"#1a1a1a",marginBottom:4}}>4. ¿Cómo calificarías tu experiencia con el Asistente Virtual (Biggy) en el portal y WhatsApp?</div>
        <Estrellas campo="t3_biggy" valor={f.t3_biggy} labels={["1 estrella: Confusa/Lenta","5 estrellas: Fluida/Útil"]}/>
      </div>

      {/* Comentario */}
      <div style={{background:"#fff",padding:"24px 24px"}}>
        <div className="field-row"><span className="field-label">¿Tienes algún comentario adicional?</span>
          <textarea value={f.mejoras} onChange={e=>upd("mejoras",e.target.value)} placeholder="Escribe aquí tu comentario..." style={{height:80}}/>
        </div>
        <button className="btn-orange" onClick={enviar} disabled={guardando} style={{width:"100%",marginTop:8,padding:"14px",fontSize:14}}>
          {guardando?"Enviando...":"Enviar Feedback"}
        </button>
      </div>
    </div>
  );
}

function FeedbackAdmin() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(()=>{cargar();},[]);

  const cargar = async () => {
    setLoading(true);
    const {data} = await sb.from("feedback_testing").select("*").order("created_at",{ascending:false});
    setItems(data||[]);
    setLoading(false);
  };

  const eliminar = async (id) => {
    if(!confirm("¿Eliminar este feedback?")) return;
    await sb.from("feedback_testing").delete().eq("id",id);
    setItems(prev=>prev.filter(i=>i.id!==id));
    if(selected?.id===id) setSelected(null);
  };

  const promedio = (campo) => {
    const vals = items.map(i=>i[campo]).filter(v=>v>0);
    return vals.length ? (vals.reduce((a,b)=>a+b,0)/vals.length).toFixed(1) : "—";
  };

  const contar = (campo, valor) => items.filter(i=>i[campo]===valor).length;
  const pct = (n) => items.length ? Math.round(n/items.length*100)+"%" : "0%";

  const Barra = ({label, valor, max=5, color="#1a3a6b"}) => (
    <div style={{marginBottom:8}}>
      <div style={{display:"flex",justifyContent:"space-between",fontSize:11,marginBottom:3}}>
        <span style={{color:"#555"}}>{label}</span>
        <span style={{fontWeight:700,color}}>{valor} / {max}</span>
      </div>
      <div style={{height:6,background:"#f0f0f0",borderRadius:3}}>
        <div style={{height:"100%",width:`${(valor/max)*100}%`,background:color,borderRadius:3,transition:"width 0.5s"}}/>
      </div>
    </div>
  );

  if(selected) return(
    <div>
      <button onClick={()=>setSelected(null)} className="btn-back" style={{marginBottom:16}}>← Volver a la lista</button>
      <div style={{background:"#fff",borderRadius:12,border:"0.5px solid #e4e7ec",padding:"20px 24px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16}}>
          <div>
            <div style={{fontSize:16,fontWeight:700}}>{selected.nombre}</div>
            <div style={{fontSize:12,color:"#888"}}>{selected.pais} · {selected.dispositivo} · {new Date(selected.created_at).toLocaleDateString("es-CL")}</div>
          </div>
          <div style={{textAlign:"center",background:selected.nps>=9?"#dcfce7":selected.nps>=7?"#fef3c7":"#fee2e2",borderRadius:10,padding:"8px 16px"}}>
            <div style={{fontSize:24,fontWeight:900,color:selected.nps>=9?"#166534":selected.nps>=7?"#92400e":"#c0392b"}}>{selected.nps}</div>
            <div style={{fontSize:10,color:"#888"}}>NPS</div>
          </div>
        </div>
        {[
          ["📱 Portal — Facilidad","t1_facilidad",5],["💬 Biggy Portal — Respuesta","t2_respuesta_clara",5],
          ["📝 Formulario — Facilidad","t3_formulario_facil",5],["🚛 Biggy WA — Experiencia","t4_experiencia_fluida",5],
          ["📄 Propuesta — Claridad","t6_informacion_clara",5],
        ].map(([l,k,m])=><Barra key={k} label={l} valor={selected[k]||0} max={m}/>)}
        <div style={{marginTop:16,display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,fontSize:12}}>
          {[["Encontró Biggy",selected.t2_encontro_biggy],["Recibió confirmación",selected.t3_recibio_confirmacion],
            ["Guardó código",selected.t3_guardo_codigo],["Pre-filtro claro",selected.t4_prefiltro_claro],
            ["Digitar números",selected.t4_digitar_numeros],["Recuperó código",selected.t5_recupero_codigo],
            ["Propuesta legible",selected.t6_propuesta_legible],["Botón funcionó",selected.t6_boton_funciono]
          ].map(([l,v])=>(
            <div key={l} style={{padding:"6px 10px",background:"#f8f9fa",borderRadius:8}}>
              <span style={{color:"#888"}}>{l}: </span>
              <span style={{fontWeight:700,color:v==="Sí"?"#166534":v==="No"?"#c0392b":"#555"}}>{v||"—"}</span>
            </div>
          ))}
        </div>
        {selected.t1_problemas&&<div style={{marginTop:12,padding:"10px 14px",background:"#fff3e0",borderRadius:8}}><strong style={{fontSize:11}}>Problemas:</strong><p style={{fontSize:12,color:"#555",marginTop:4}}>{selected.t1_problemas}</p></div>}
        {selected.mejoras&&<div style={{marginTop:8,padding:"10px 14px",background:"#eef2ff",borderRadius:8}}><strong style={{fontSize:11}}>Mejoras:</strong><p style={{fontSize:12,color:"#555",marginTop:4}}>{selected.mejoras}</p></div>}
        {selected.comentario_libre&&<div style={{marginTop:8,padding:"10px 14px",background:"#f8f9fa",borderRadius:8}}><strong style={{fontSize:11}}>Comentario:</strong><p style={{fontSize:12,color:"#555",marginTop:4}}>{selected.comentario_libre}</p></div>}
        <button onClick={()=>eliminar(selected.id)} className="btn-danger" style={{marginTop:16,width:"100%"}}>🗑 Eliminar este feedback</button>
      </div>
    </div>
  );

  return(
    <div>
      <div className="sec-title" style={{marginBottom:4}}>📋 Feedback Testing</div>
      <div className="sec-sub">Respuestas del plan de testing del portal</div>

      {/* Link para compartir */}
      <div style={{background:"#eef2ff",borderRadius:10,padding:"12px 16px",marginBottom:20,marginTop:16}}>
        <div style={{fontSize:12,fontWeight:700,color:"#1a3a6b",marginBottom:4}}>🔗 Link para compartir con testers</div>
        <div style={{fontSize:12,color:"#555",fontFamily:"monospace",background:"#fff",padding:"6px 10px",borderRadius:6,border:"1px solid #c7d7f9"}}>
          https://bigticket-portal.vercel.app?feedback=1
        </div>
      </div>

      {loading ? <div className="loading">Cargando...</div> : items.length===0 ? <div className="empty">Aún no hay respuestas. Comparte el link con los testers 👆</div> : (
        <>
        {/* Resumen */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(130px,1fr))",gap:10,marginBottom:20}}>
          {[["Total respuestas",items.length,"#1a3a6b"],["NPS promedio",promedio("nps"),"#F47B20"],
            ["Portal ⭐",promedio("t1_facilidad"),"#10B981"],["Biggy WA ⭐",promedio("t4_experiencia_fluida"),"#8B5CF6"],
          ].map(([l,v,c])=>(
            <div key={l} style={{background:"#fff",border:"0.5px solid #e4e7ec",borderRadius:10,padding:"12px",textAlign:"center"}}>
              <div style={{fontSize:22,fontWeight:800,color:c}}>{v}</div>
              <div style={{fontSize:10,color:"#888",marginTop:2}}>{l}</div>
            </div>
          ))}
        </div>

        {/* Lista */}
        {items.map(item=>(
          <div key={item.id} className="camp-row" style={{cursor:"pointer"}} onClick={()=>setSelected(item)}>
            <div style={{flex:1}}>
              <div style={{fontSize:14,fontWeight:600,color:"#1a1a1a"}}>{item.nombre}</div>
              <div style={{fontSize:12,color:"#888"}}>{item.pais} · {item.dispositivo} · {new Date(item.created_at).toLocaleDateString("es-CL")}</div>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <div style={{textAlign:"center",background:item.nps>=9?"#dcfce7":item.nps>=7?"#fef3c7":"#fee2e2",borderRadius:8,padding:"4px 10px"}}>
                <span style={{fontSize:16,fontWeight:700,color:item.nps>=9?"#166534":item.nps>=7?"#92400e":"#c0392b"}}>{item.nps}</span>
                <span style={{fontSize:9,color:"#888",display:"block"}}>NPS</span>
              </div>
              <span style={{fontSize:18,color:"#888"}}>›</span>
            </div>
          </div>
        ))}
        </>
      )}
    </div>
  );
}

function ModalScoring({ campana, onClose, onGuardar }) {
  const [vars, setVars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [scoreFields, setScoreFields] = useState([]);
  const [modo, setModo] = useState("ver"); // ver | editar

  useEffect(()=>{ cargarVars(); },[campana.id]);

  const cargarVars = async () => {
    setLoading(true);
    const {data} = await sb.from("campana_variables").select("*").eq("campana_id", campana.id).order("orden");
    setVars(data||[]);
    // Convertir a formato scoreFields
    if(data&&data.length>0) {
      setScoreFields(data.map(v=>({
        _id: v.id,
        id: v.id,
        variable: v.variable,
        pregunta: v.pregunta,
        tipo: v.tipo,
        opciones: typeof v.opciones === "string" ? JSON.parse(v.opciones) : (v.opciones||[]),
        puntos: v.puntos,
        orden: v.orden,
      })));
    } else {
      setScoreFields([newField()]);
    }
    setLoading(false);
  };

  const guardar = async () => {
    setGuardando(true);
    try {
      // Eliminar variables existentes
      await sb.from("campana_variables").delete().eq("campana_id", campana.id);
      // Insertar nuevas
      const valid = scoreFields.filter(sf=>sf.variable&&sf.pregunta);
      if(valid.length > 0) {
        const toInsert = valid.map((sf,i)=>({
          campana_id: campana.id,
          variable: sf.variable,
          pregunta: sf.pregunta,
          tipo: sf.tipo,
          opciones: JSON.stringify(sf.opciones),
          puntos: maxScoreField(sf),
          orden: i,
        }));
        await sb.from("campana_variables").insert(toInsert);
      }
      const scoreMax = valid.reduce((s,sf)=>s+maxScoreField(sf),0);
      await sb.from("campanas").update({score_max:scoreMax}).eq("id",campana.id);
      onGuardar({...campana, score_max:scoreMax});
      alert("✅ Scoring guardado correctamente");
      setModo("ver");
      cargarVars();
    } catch(e){alert("Error: "+e.message);}
    finally{setGuardando(false);}
  };

  const usedVars = scoreFields.map(sf=>sf.variable).filter(Boolean);
  const total = scoreFields.reduce((s,sf)=>s+maxScoreField(sf),0);
  const scoreColor = total>100?"#c0392b":total>=80?"#e65100":"#166534";

  const TIPO_LABEL = {sino:"Sí/No",escala:"Escala",seleccion:"Selección",texto:"Texto"};
  const TIPO_COLOR = {sino:"#e8eef8",escala:"#fff3e0",seleccion:"#e8f5e9",texto:"#f3e8ff"};
  const TIPO_TEXT  = {sino:"#1a3a6b",escala:"#e65100",seleccion:"#1b5e20",texto:"#4a1080"};

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",zIndex:200,overflowY:"auto",padding:"20px 16px"}}>
      <div style={{maxWidth:700,margin:"0 auto",background:"#fff",borderRadius:16,overflow:"hidden",boxShadow:"0 20px 60px rgba(0,0,0,0.3)"}}>
        {/* Header */}
        <div style={{background:"#1a3a6b",padding:"16px 24px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div>
            <div style={{color:"#F47B20",fontSize:11,fontWeight:700,letterSpacing:1,textTransform:"uppercase"}}>Modelo de puntuación</div>
            <div style={{color:"#fff",fontSize:16,fontWeight:700,marginTop:2}}>{campana.nombre}</div>
          </div>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            {modo==="ver"&&(
              <button onClick={()=>setModo("editar")}
                style={{fontSize:12,padding:"6px 14px",borderRadius:8,border:"1px solid rgba(255,255,255,0.3)",background:"rgba(255,255,255,0.1)",color:"#fff",cursor:"pointer",fontFamily:"'Geist',sans-serif"}}>
                ✏️ Editar scoring
              </button>
            )}
            <button onClick={onClose}
              style={{background:"rgba(255,255,255,0.15)",border:"none",color:"#fff",borderRadius:"50%",width:32,height:32,cursor:"pointer",fontSize:18,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
          </div>
        </div>

        <div style={{padding:"20px 24px",overflowY:"auto",maxHeight:"70vh"}}>
          {loading ? <div style={{textAlign:"center",padding:40,color:"#888"}}>Cargando...</div> :

          modo === "ver" ? (
            // Vista de preguntas
            <>
              {vars.length === 0 ? (
                <div style={{textAlign:"center",padding:40,color:"#888"}}>
                  <div style={{fontSize:32,marginBottom:12}}>⭐</div>
                  <div style={{fontWeight:600,marginBottom:8}}>Sin preguntas de scoring</div>
                  <div style={{fontSize:12}}>Haz click en "Editar scoring" para agregar preguntas</div>
                </div>
              ) : vars.map((v,i)=>{
                const opts = typeof v.opciones === "string" ? JSON.parse(v.opciones||"[]") : (v.opciones||[]);
                return (
                  <div key={v.id} style={{background:"#f8f9fa",borderRadius:10,padding:"14px 16px",marginBottom:10,border:"0.5px solid #e4e7ec"}}>
                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
                      <div style={{display:"flex",alignItems:"center",gap:8}}>
                        <span style={{fontSize:11,fontWeight:700,color:"#888"}}>#{i+1}</span>
                        <span style={{fontSize:13,fontWeight:700,color:"#1a1a1a"}}>{v.variable}</span>
                        <span style={{fontSize:10,padding:"2px 8px",borderRadius:20,background:TIPO_COLOR[v.tipo],color:TIPO_TEXT[v.tipo],fontWeight:600}}>{TIPO_LABEL[v.tipo]}</span>
                      </div>
                      <span style={{fontSize:13,fontWeight:700,color:scoreColor}}>{v.puntos} pts</span>
                    </div>
                    <div style={{fontSize:12,color:"#555",marginBottom:8}}>📝 {v.pregunta}</div>
                    {opts.length>0 && v.tipo !== "texto" && (
                      <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                        {opts.map((o,j)=>(
                          <div key={j} style={{fontSize:11,padding:"3px 10px",borderRadius:20,background:"#fff",border:"0.5px solid #e4e7ec",display:"flex",gap:6,alignItems:"center"}}>
                            <span>{o.valor}</span>
                            <span style={{fontWeight:700,color:o.puntos>0?"#166534":"#888"}}>→ {o.puntos}pts</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
              {vars.length>0 && (
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",background:"#eef2ff",borderRadius:10,padding:"10px 14px",marginTop:4}}>
                  <span style={{fontSize:13,fontWeight:600,color:scoreColor}}>Score máximo posible</span>
                  <span style={{fontSize:20,fontWeight:700,color:scoreColor}}>{campana.score_max} pts</span>
                </div>
              )}
            </>
          ) : (
            // Editor de preguntas
            <>
              <div style={{fontSize:12,color:"#666",marginBottom:14}}>Define cada pregunta, tipo y puntos. El postulante no ve los puntajes.</div>
              {scoreFields.map((sf,idx)=>(
                <ScoreFieldBuilder key={sf._id} field={sf}
                  onUpdate={updated=>setScoreFields(scoreFields.map((x,i)=>i===idx?updated:x))}
                  onRemove={()=>setScoreFields(scoreFields.filter((_,i)=>i!==idx))}
                  usedVariables={usedVars.filter(v=>v!==sf.variable)}
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
            </>
          )}
        </div>

        <div style={{padding:"12px 24px",borderTop:"1px solid #e4e7ec",background:"#f8f9fa",display:"flex",gap:10}}>
          <button onClick={()=>modo==="editar"?setModo("ver"):onClose()}
            style={{flex:1,background:"#f4f5f7",border:"none",borderRadius:10,padding:"11px",fontSize:13,cursor:"pointer",fontFamily:"'Geist',sans-serif"}}>
            {modo==="editar"?"Cancelar":"Cerrar"}
          </button>
          {modo==="editar"&&(
            <button onClick={guardar} disabled={guardando} className="btn-blue" style={{flex:2}}>
              {guardando?"Guardando...":"💾 Guardar scoring"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function CentrosMxAdmin() {
  const CENTROS_DEFAULT = [
    "SMX1 San Jerónimo Tepetlacalco","SMX2 Complejo Industrial Tecnológico/Iztapalapa",
    "SMX3 Lomas de Santo Domingo Reacomodo","SMX4 Bondojito","SMX5 Iztapalapa",
    "SMX6 Industrial Tlaxcoapan","SMX7 Cuajimalpa","SMX8 Los Héroes Tecámac / Ojo de agua",
    "SMX9  Granjas México, Iztacalco","SMX10  Vallejo","SMX11 Outlets Punta Norte",
    "SCQ1 Colima","STX1 Tlaxcala","SHP1 Pachuca","SCY1 Celaya","SLT1 Toluca",
    "SPV1 Puebla","SVR1 Veracruz","SVH1 Villahermosa","SQR1 Querétaro",
  ];
  const [centros,setCentros]=useState(()=>{
    try{const s=localStorage.getItem("centros_mx");return s?JSON.parse(s):CENTROS_DEFAULT;}
    catch{return CENTROS_DEFAULT;}
  });
  const [nuevo,setNuevo]=useState("");
  const [error,setError]=useState("");

  const guardar=(lista)=>{
    setCentros(lista);
    try{localStorage.setItem("centros_mx",JSON.stringify(lista));}catch(e){}
  };
  const agregar=()=>{
    const val=nuevo.trim();
    if(!val){setError("Ingresa el nombre del centro.");return;}
    if(centros.includes(val)){setError("Ese centro ya existe.");return;}
    guardar([...centros,val]);
    setNuevo("");setError("");
  };
  const eliminar=(c)=>{
    if(!confirm(`¿Eliminar "${c}"?`))return;
    guardar(centros.filter(x=>x!==c));
  };

  return(
    <div>
      <div className="sec-title" style={{marginBottom:4}}>Centros de distribución México</div>
      <div className="sec-sub">Estos valores aparecen en el selector de Estado/Centro al postular desde México</div>
      <div style={{background:"#fff",borderRadius:12,border:"0.5px solid #e4e7ec",padding:"16px 20px",marginBottom:16,marginTop:16}}>
        <div style={{fontSize:13,fontWeight:700,color:"#1a1a1a",marginBottom:12}}>Agregar nuevo centro</div>
        <div style={{display:"flex",gap:8}}>
          <input value={nuevo} onChange={e=>{setNuevo(e.target.value);setError("");}}
            onKeyDown={e=>e.key==="Enter"&&agregar()}
            placeholder="Ej: SMX12 Nuevo Centro" style={{flex:1,padding:"9px 12px",borderRadius:8,border:"0.5px solid #d0d5dd",fontSize:13}}/>
          <button onClick={agregar} className="btn-orange" style={{width:"auto",padding:"9px 20px",marginTop:0}}>+ Agregar</button>
        </div>
        {error&&<div style={{fontSize:12,color:"#c0392b",marginTop:6}}>⚠ {error}</div>}
      </div>
      <div style={{background:"#fff",borderRadius:12,border:"0.5px solid #e4e7ec",padding:"16px 20px"}}>
        <div style={{fontSize:13,fontWeight:700,color:"#1a1a1a",marginBottom:12}}>Centros activos ({centros.length})</div>
        {centros.map((c,i)=>(
          <div key={i} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 0",borderBottom:"0.5px solid #f4f5f7"}}>
            <span style={{fontSize:13,color:"#1a1a1a"}}>{c}</span>
            <button onClick={()=>eliminar(c)} className="btn-danger">Eliminar</button>
          </div>
        ))}
      </div>
    </div>
  );
}

function newField() {
  return {_id:Date.now()+Math.random(),variable:"",tipo:"sino",pregunta:"",opciones:[{valor:"si",puntos:10}]};
}

function NuevaCampana({ campaigns, setCampaigns, onDone }) {
  const empty={nombre:"",pais:"Chile",vehiculos:[],volumen_m3:"",cantidad:"",zona:"",factura:"Sí requiere factura",modalidad_pago:"Semanal",disponibilidad:"Diurno",experiencia_anios:"0",ingreso_rango:"",descripcion:"",fecha_inicio:"",fecha_fin:""};
  const emptyPropuesta={
    cliente:"",cedis:"",horario:"Por confirmar",entregas:"80-100",
    devolucion:"Mismo SVC hasta las 22:00 hrs",
    tarifas:[
      {categoria:"Large Van",tramos:{"0-100":"","101-150":"","151-200":"","201-250":"","251+":""}},
      {categoria:"Small Van",tramos:{"0-100":"","101-150":"","151-200":"","201-250":"","251+":""}},
    ],
    auxiliar:"$300 MXN por día",
    ns_minimo:"99.00%",ns_excelente:"99.50% - 100%",
    ns_premio:"5% sobre tarifa diaria",ns_castigo:"3% sobre tarifa base",
    semana_retenida:true,vigencia:"12 meses",
    requisitos:"Carta de no antecedentes penales vigente\nHistorial de conductor\nLicencia de manejo vigente\nPermiso de Paquetería\nEquipo GPS (cargo al prestador)\nZapatos de seguridad\nTeléfono con plan de voz y datos",
    notas:""
  };
  const [f,setF]=useState(empty);
  const [propuesta,setPropuesta]=useState(emptyPropuesta);
  const [scoreFields,setScoreFields]=useState([newField()]);
  const [saving,setSaving]=useState(false);
  const [stepActual,setStepActual]=useState(0);

  function upd(k,v){setF(prev=>({...prev,[k]:v}));}
  function updP(k,v){setPropuesta(prev=>({...prev,[k]:v}));}
  function updTarifa(catIdx,tramo,val){
    setPropuesta(prev=>{
      const t=[...prev.tarifas];
      t[catIdx]={...t[catIdx],tramos:{...t[catIdx].tramos,[tramo]:val}};
      return {...prev,tarifas:t};
    });
  }
  function totalScore(){return scoreFields.reduce((s,sf)=>s+maxScoreField(sf),0);}
  function usedVars(){return scoreFields.map(sf=>sf.variable).filter(Boolean);}

  async function save() {
    if(!f.nombre){alert("Ingresa el nombre de la campaña.");return;}
    if(f.fecha_inicio&&f.fecha_fin&&f.fecha_inicio>f.fecha_fin){alert("Fecha inicio no puede ser mayor a fecha fin.");return;}
    if(!propuesta.cliente.trim()){alert("La propuesta es obligatoria. Ingresa el nombre del cliente.");setStepActual(2);return;}
    if(!propuesta.cedis.trim()){alert("La propuesta es obligatoria. Ingresa el CEDIS.");setStepActual(2);return;}
    const tarifasOk=propuesta.tarifas.every(t=>Object.values(t.tramos).some(v=>v.trim()));
    if(!tarifasOk){alert("Ingresa al menos una tarifa en la propuesta.");setStepActual(2);return;}
    setSaving(true);
    try {
      const autoOn=!f.fecha_inicio||new Date(f.fecha_inicio)<=new Date();
      const scoreMax=totalScore();
      const {data:camp,error}=await sb.from("campanas").insert({
        nombre:f.nombre,pais:f.pais,vehiculo:f.vehiculos.join(" / ")||null,
        volumen_m3:f.volumen_m3||null,cantidad:parseInt(f.cantidad)||null,
        zona:f.zona||null,factura:f.factura.includes("Sí")?"Sí":"No",
        modalidad_pago:f.modalidad_pago,disponibilidad:f.disponibilidad,
        experiencia_anios:parseInt(f.experiencia_anios)||0,
        ingreso_rango:f.ingreso_rango||null,descripcion:f.descripcion||null,
        toggle_activo:autoOn,fecha_inicio:f.fecha_inicio||null,
        fecha_fin:f.fecha_fin||null,score_max:scoreMax,
        propuesta_cliente:propuesta.cliente,propuesta_cedis:propuesta.cedis,
        propuesta_horario:propuesta.horario,propuesta_entregas:propuesta.entregas,
        propuesta_devolucion:propuesta.devolucion,propuesta_tarifas:propuesta.tarifas,
        propuesta_auxiliar:propuesta.auxiliar,propuesta_ns_minimo:propuesta.ns_minimo,
        propuesta_ns_excelente:propuesta.ns_excelente,propuesta_ns_premio:propuesta.ns_premio,
        propuesta_ns_castigo:propuesta.ns_castigo,propuesta_semana_retenida:propuesta.semana_retenida,
        propuesta_vigencia:propuesta.vigencia,propuesta_requisitos:propuesta.requisitos,
        propuesta_notas:propuesta.notas,
      }).select().single();
      if(error)throw error;
      const valid=scoreFields.filter(sf=>sf.variable&&sf.pregunta);
      if(valid.length>0){
        const varsToInsert=valid.map((sf,i)=>({campana_id:camp.id,variable:sf.variable,pregunta:sf.pregunta,tipo:sf.tipo,opciones:JSON.stringify(sf.opciones),puntos:maxScoreField(sf),orden:i}));
        const {error:ve}=await sb.from("campana_variables").insert(varsToInsert);
        if(ve){await sb.from("campanas").delete().eq("id",camp.id);throw new Error("Error guardando preguntas: "+ve.message);}
      }
      setCampaigns([...campaigns,camp]);
      alert(`Campaña "${f.nombre}" creada con propuesta incluida ✅`);
      onDone();
    } catch(e){alert("Error: "+e.message);}
    finally{setSaving(false);}
  }

  const total=totalScore();
  const scoreColor=total>100?"#c0392b":total>=80?"#e65100":"#166534";
  const TRAMOS=["0-100","101-150","151-200","201-250","251+"];
  const steps=[{label:"Información",icon:"📋"},{label:"Scoring",icon:"⭐"},{label:"Propuesta",icon:"📄"}];

  return (
    <div>
      <div className="sec-title" style={{marginBottom:4}}>Crear nueva campaña</div>
      <div className="sec-sub">Define los campos, scoring y propuesta económica</div>
      <div style={{display:"flex",gap:0,marginBottom:20,background:"#fff",borderRadius:12,border:"0.5px solid #e4e7ec",overflow:"hidden"}}>
        {steps.map((s,i)=>(
          <button key={i} onClick={()=>setStepActual(i)}
            style={{flex:1,padding:"12px 8px",border:"none",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",
              background:stepActual===i?"#1a3a6b":"#fff",color:stepActual===i?"#fff":"#666",
              fontWeight:stepActual===i?700:400,fontSize:13,borderRight:i<2?"0.5px solid #e4e7ec":"none"}}>
            {s.icon} {s.label}
            {i===2&&<span style={{marginLeft:6,fontSize:10,background:stepActual===2?"rgba(255,255,255,0.3)":"#fee2e2",color:stepActual===2?"#fff":"#c0392b",borderRadius:10,padding:"1px 6px"}}>Obligatoria</span>}
          </button>
        ))}
      </div>

      {stepActual===0&&(
        <>
        <div className="form-card">
          <div className="form-title">Información general</div>
          <div className="field-row"><span className="field-label">Nombre de la campaña</span><input value={f.nombre} onChange={e=>upd("nombre",e.target.value)} placeholder="Ej: MELI Querétaro Large Van"/></div>
          <div className="two-col">
            <div className="field-row"><span className="field-label">País</span><select value={f.pais} onChange={e=>upd("pais",e.target.value)}><option>Chile</option><option>México</option></select></div>
            <div className="field-row">
              <span className="field-label">Tipo(s) de vehículo</span>
              <div style={{display:"flex",flexDirection:"column",gap:6,marginTop:4}}>
                {["Auto","Small Van","Large Van"].map(vt=>{
                  const checked=f.vehiculos.includes(vt);
                  return (
                    <label key={vt} style={{display:"flex",alignItems:"center",gap:8,padding:"7px 10px",border:`1px solid ${checked?"#1a3a6b":"#e4e7ec"}`,borderRadius:8,cursor:"pointer",background:checked?"#eef2ff":"#fff",fontSize:13}}>
                      <input type="checkbox" checked={checked} style={{width:"auto",margin:0}} onChange={()=>{
                        const next=checked?f.vehiculos.filter(x=>x!==vt):[...f.vehiculos,vt];
                        const vols={"Auto":"1,9","Small Van":"2,3 - 5,4","Large Van":"5,5 - 12,9"};
                        const nextVol=next.length===1?vols[next[0]]+" m³":next.map(x=>vols[x]+" m³").join(" / ");
                        upd("vehiculos",next);upd("volumen_m3",next.length>0?nextVol:"");
                      }}/>
                      {vt}<span style={{fontSize:11,color:"#888",marginLeft:"auto"}}>{vt==="Auto"?"1,9 m³":vt==="Small Van"?"2,3-5,4 m³":"5,5-12,9 m³"}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="two-col">
            <div className="field-row"><span className="field-label">Volumen (m³)</span>
              <input value={f.volumen_m3} onChange={e=>upd("volumen_m3",e.target.value)} placeholder="Se autocompleta al elegir vehículo"/>
              <span style={{fontSize:11,color:"#888",marginTop:3,display:"block"}}>Puedes editar manualmente</span>
            </div>
            <div className="field-row"><span className="field-label">Cantidad de vehículos</span><input type="number" value={f.cantidad} onChange={e=>upd("cantidad",e.target.value)} placeholder="10"/></div>
          </div>
          <div className="two-col">
            <div className="field-row"><span className="field-label">Zona de reparto</span><input value={f.zona} onChange={e=>upd("zona",e.target.value)} placeholder="Ej: Querétaro"/></div>
            <div className="field-row"><span className="field-label">Factura</span><select value={f.factura} onChange={e=>upd("factura",e.target.value)}><option>Sí requiere factura</option><option>No requiere factura</option></select></div>
          </div>
          <div className="two-col">
            <div className="field-row"><span className="field-label">Modalidad de pago</span><select value={f.modalidad_pago} onChange={e=>upd("modalidad_pago",e.target.value)}>{["Semanal","Quincenal","Mensual"].map(v=><option key={v}>{v}</option>)}</select></div>
            <div className="field-row"><span className="field-label">Disponibilidad</span><select value={f.disponibilidad} onChange={e=>upd("disponibilidad",e.target.value)}>{["Diurno","Nocturno","Mixto"].map(v=><option key={v}>{v}</option>)}</select></div>
          </div>
          <div className="two-col">
            <div className="field-row"><span className="field-label">Experiencia (años)</span><input type="number" value={f.experiencia_anios} onChange={e=>upd("experiencia_anios",e.target.value)}/></div>
            <div className="field-row"><span className="field-label">Rango de ingresos</span><input value={f.ingreso_rango} onChange={e=>upd("ingreso_rango",e.target.value)} placeholder="Ej: $1,856 - $2,056 MXN"/></div>
          </div>
          <div className="field-row"><span className="field-label">Descripción</span><textarea value={f.descripcion} onChange={e=>upd("descripcion",e.target.value)} placeholder="Detalles adicionales..."/></div>
        </div>
        <div className="form-card">
          <div className="form-title">Vigencia de la campaña</div>
          <div style={{fontSize:12,color:"#666",marginBottom:14}}>Se activa automáticamente en la fecha inicio y se desactiva en la fecha fin.</div>
          <div className="two-col">
            <div className="field-row"><span className="field-label">Fecha de inicio</span><input type="date" value={f.fecha_inicio} onChange={e=>upd("fecha_inicio",e.target.value)}/></div>
            <div className="field-row"><span className="field-label">Fecha de cierre</span><input type="date" value={f.fecha_fin} onChange={e=>upd("fecha_fin",e.target.value)}/></div>
          </div>
        </div>
        <button className="btn-blue" onClick={()=>setStepActual(1)} style={{width:"100%"}}>Siguiente → Scoring ⭐</button>
        </>
      )}

      {stepActual===1&&(
        <>
        <div className="form-card">
          <div className="form-title">Modelo de puntuación (interno CRM)</div>
          <div style={{fontSize:12,color:"#666",marginBottom:14}}>Define cada pregunta, su tipo y los puntos de cada opción. El postulante no ve puntajes.</div>
          {scoreFields.map((sf,idx)=>(
            <ScoreFieldBuilder key={sf._id} field={sf}
              onUpdate={updated=>setScoreFields(scoreFields.map((x,i)=>i===idx?updated:x))}
              onRemove={()=>setScoreFields(scoreFields.filter((_,i)=>i!==idx))}
              usedVariables={usedVars().filter(v=>v!==sf.variable)}
            />
          ))}
          <button className="add-opt-btn" style={{width:"100%",padding:"9px",marginTop:4}} onClick={()=>setScoreFields([...scoreFields,newField()])}>+ Agregar pregunta de scoring</button>
          {total>100&&<div style={{fontSize:12,color:"#c0392b",marginTop:8}}>El score supera 100 puntos.</div>}
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",background:"#eef2ff",borderRadius:10,padding:"10px 14px",marginTop:12}}>
            <span style={{fontSize:13,fontWeight:600,color:scoreColor}}>Score máximo posible</span>
            <span style={{fontSize:20,fontWeight:700,color:scoreColor}}>{total} pts</span>
          </div>
        </div>
        <div style={{display:"flex",gap:10}}>
          <button onClick={()=>setStepActual(0)} style={{flex:1,background:"#f4f5f7",border:"none",borderRadius:10,padding:"11px",fontSize:13,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>← Volver</button>
          <button className="btn-blue" onClick={()=>setStepActual(2)} style={{flex:2}}>Siguiente → Propuesta económica 📄</button>
        </div>
        </>
      )}

      {stepActual===2&&(
        <>
        <div className="form-card" style={{border:"1px solid #F47B20"}}>
          <div className="form-title">📄 Propuesta económica <span style={{fontSize:11,color:"#c0392b",fontWeight:700}}>* Obligatoria</span></div>
          <div style={{fontSize:12,color:"#666",marginBottom:14}}>Esta propuesta será visible para el conductor al revisar la oferta en el portal.</div>
          <div className="two-col">
            <div className="field-row"><span className="field-label">Cliente / Operación *</span><input value={propuesta.cliente} onChange={e=>updP("cliente",e.target.value)} placeholder="Ej: MELI Querétaro"/></div>
            <div className="field-row"><span className="field-label">CEDIS / Lugar de presentación *</span><input value={propuesta.cedis} onChange={e=>updP("cedis",e.target.value)} placeholder="Ej: SQR1 | Prol. Av. Zaragoza 61"/></div>
          </div>
          <div className="two-col">
            <div className="field-row"><span className="field-label">Horario de presentación</span><input value={propuesta.horario} onChange={e=>updP("horario",e.target.value)} placeholder="Por confirmar"/></div>
            <div className="field-row"><span className="field-label">Entregas estimadas por unidad</span><input value={propuesta.entregas} onChange={e=>updP("entregas",e.target.value)} placeholder="80-100"/></div>
          </div>
          <div className="field-row"><span className="field-label">Lugar y hora de devolución de mercancía no entregada</span><input value={propuesta.devolucion} onChange={e=>updP("devolucion",e.target.value)} placeholder="Mismo SVC hasta las 22:00 hrs"/></div>
          <div style={{marginTop:16,marginBottom:8}}>
            <span className="field-label" style={{fontSize:13,fontWeight:700,color:"#1a1a1a"}}>Tarifas por jornada (netos + IVA) *</span>
            <div style={{fontSize:11,color:"#888",marginBottom:8}}>Valores en MXN o CLP según corresponda. Dejar en 0 si no aplica el tramo.</div>
            <div style={{overflowX:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                <thead>
                  <tr style={{background:"#1a3a6b",color:"#fff"}}>
                    <th style={{padding:"8px 12px",textAlign:"left"}}>Categoría</th>
                    {TRAMOS.map(t=><th key={t} style={{padding:"8px 10px",textAlign:"center"}}>{t} km</th>)}
                  </tr>
                </thead>
                <tbody>
                  {propuesta.tarifas.map((cat,ci)=>(
                    <tr key={ci} style={{background:ci%2===0?"#f8f9fa":"#fff"}}>
                      <td style={{padding:"8px 12px",fontWeight:700,color:"#1a3a6b"}}>{cat.categoria}</td>
                      {TRAMOS.map(t=>(
                        <td key={t} style={{padding:4}}>
                          <input value={cat.tramos[t]||""} onChange={e=>updTarifa(ci,t,e.target.value)}
                            placeholder="$0"
                            style={{width:"100%",padding:"6px 8px",border:"0.5px solid #d0d5dd",borderRadius:6,fontSize:12,textAlign:"center"}}/>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="field-row" style={{marginTop:12}}><span className="field-label">Tarifa auxiliar diario</span><input value={propuesta.auxiliar} onChange={e=>updP("auxiliar",e.target.value)} placeholder="$300 MXN por día"/></div>
          <div style={{marginTop:16,padding:"12px 14px",background:"#f8f9fa",borderRadius:10,marginBottom:8}}>
            <span className="field-label" style={{fontSize:13,fontWeight:700,color:"#1a1a1a",marginBottom:10,display:"block"}}>Nivel de servicio</span>
            <div className="two-col">
              <div className="field-row"><span className="field-label">NS mínimo exigido</span><input value={propuesta.ns_minimo} onChange={e=>updP("ns_minimo",e.target.value)} placeholder="99.00%"/></div>
              <div className="field-row"><span className="field-label">NS excelente</span><input value={propuesta.ns_excelente} onChange={e=>updP("ns_excelente",e.target.value)} placeholder="99.50% - 100%"/></div>
            </div>
            <div className="two-col">
              <div className="field-row"><span className="field-label">Premio por NS excelente</span><input value={propuesta.ns_premio} onChange={e=>updP("ns_premio",e.target.value)} placeholder="5% sobre tarifa diaria"/></div>
              <div className="field-row"><span className="field-label">Castigo por bajo NS</span><input value={propuesta.ns_castigo} onChange={e=>updP("ns_castigo",e.target.value)} placeholder="3% sobre tarifa base"/></div>
            </div>
          </div>
          <div style={{padding:"12px 14px",background:"#f8f9fa",borderRadius:10,marginBottom:8}}>
            <span className="field-label" style={{fontSize:13,fontWeight:700,color:"#1a1a1a",marginBottom:10,display:"block"}}>Condiciones de pago</span>
            <div className="two-col">
              <div className="field-row"><span className="field-label">Vigencia del contrato</span><input value={propuesta.vigencia} onChange={e=>updP("vigencia",e.target.value)} placeholder="12 meses"/></div>
              <div className="field-row" style={{display:"flex",alignItems:"center",gap:10,paddingTop:20}}>
                <label style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",fontSize:13}}>
                  <input type="checkbox" checked={propuesta.semana_retenida} style={{width:"auto"}} onChange={e=>updP("semana_retenida",e.target.checked)}/>
                  Semana retenida como garantía
                </label>
              </div>
            </div>
          </div>
          <div className="field-row"><span className="field-label">Requisitos del prestador (uno por línea)</span>
            <textarea value={propuesta.requisitos} onChange={e=>updP("requisitos",e.target.value)} style={{height:120}} placeholder="Carta de no antecedentes penales&#10;Licencia vigente..."/>
          </div>
          <div className="field-row"><span className="field-label">Notas adicionales</span>
            <textarea value={propuesta.notas} onChange={e=>updP("notas",e.target.value)} style={{height:60}} placeholder="Condiciones especiales de esta campaña..."/>
          </div>
        </div>
        <div style={{display:"flex",gap:10}}>
          <button onClick={()=>setStepActual(1)} style={{flex:1,background:"#f4f5f7",border:"none",borderRadius:10,padding:"11px",fontSize:13,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>← Volver</button>
          <button className="btn-blue" onClick={save} disabled={saving} style={{flex:2}}>{saving?"Guardando...":"✅ Crear campaña con propuesta"}</button>
        </div>
        </>
      )}
    </div>
  );
}

function VehiculosVerificacion() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargar = async () => {
      setLoading(true);
      const { data } = await sb.from("leads")
        .select("id,nombre,telefono,codigo_postulacion,url_vehiculo,vehiculo_veredicto,vehiculo_score,vehiculo_comentario,created_at")
        .not("url_vehiculo", "is", null)
        .order("created_at", { ascending: false })
        .limit(50);
      setLeads(data || []);
      setLoading(false);
    };
    cargar();
  }, []);

  const colorVeredicto = v => v === "Aprobado" ? "#166534" : v === "Revisar" ? "#92400e" : v === "Rechazado" ? "#c0392b" : "#888";
  const bgVeredicto   = v => v === "Aprobado" ? "#dcfce7" : v === "Revisar" ? "#fef3c7" : v === "Rechazado" ? "#fee2e2" : "#f4f5f7";
  const iconVeredicto = v => v === "Aprobado" ? "✅" : v === "Revisar" ? "⚠️" : v === "Rechazado" ? "❌" : "⏳";

  return (
    <div>
      <div className="sec-title" style={{marginBottom:4}}>Verificación de Vehículos</div>
      <div className="sec-sub">Resultados del análisis Claude Vision por cada lead con foto adjunta</div>
      {loading ? <div className="loading">Cargando...</div> :
        leads.length === 0 ? <div className="empty">No hay leads con foto de vehículo aún.</div> :
        leads.map(l => (
          <div key={l.id} style={{background:"#fff",border:"0.5px solid #e4e7ec",borderRadius:12,padding:"14px 16px",marginBottom:10,display:"flex",gap:14,alignItems:"flex-start"}}>
            {/* Foto */}
            <div style={{flexShrink:0}}>
              {l.url_vehiculo ? (
                <a href={l.url_vehiculo} target="_blank">
                  <img src={l.url_vehiculo} alt="vehículo"
                    style={{width:90,height:64,objectFit:"cover",borderRadius:8,border:"1px solid #e4e7ec",display:"block"}}
                    onError={e=>{e.target.style.display="none";}}/>
                </a>
              ) : <div style={{width:90,height:64,background:"#f4f5f7",borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>🚗</div>}
            </div>
            {/* Info */}
            <div style={{flex:1}}>
              <div style={{fontSize:14,fontWeight:700,color:"#1a1a1a"}}>{l.nombre}</div>
              <div style={{fontSize:12,color:"#888",marginBottom:6}}>{l.codigo_postulacion} · {new Date(l.created_at).toLocaleDateString("es-CL")}</div>
              {l.vehiculo_veredicto ? (
                <div style={{display:"flex",flexWrap:"wrap",gap:8,alignItems:"center"}}>
                  <span style={{fontSize:12,padding:"3px 10px",borderRadius:20,background:bgVeredicto(l.vehiculo_veredicto),color:colorVeredicto(l.vehiculo_veredicto),fontWeight:700}}>
                    {iconVeredicto(l.vehiculo_veredicto)} {l.vehiculo_veredicto}
                  </span>
                  {l.vehiculo_score != null && (
                    <span style={{fontSize:12,color:"#555",fontWeight:600}}>Score: {l.vehiculo_score}/100</span>
                  )}
                  {l.vehiculo_comentario && (
                    <span style={{fontSize:12,color:"#666",fontStyle:"italic"}}>"{l.vehiculo_comentario}"</span>
                  )}
                </div>
              ) : (
                <span style={{fontSize:12,color:"#F47B20",fontWeight:600}}>⏳ Pendiente verificación</span>
              )}
            </div>
          </div>
        ))
      }
    </div>
  );
}

function CanalesView({ postulaciones, onLoad }) {
  const [visitas, setVisitas] = useState([]);
  const [loadingV, setLoadingV] = useState(true);
  const [filtroCanal, setFiltroCanal] = useState("facebook");

  useEffect(()=>{
    onLoad();
    cargarVisitas();
  },[]);

  const cargarVisitas = async () => {
    setLoadingV(true);
    const {data} = await sb.from("canal_visitas").select("*").order("created_at",{ascending:false});
    setVisitas(data||[]);
    setLoadingV(false);
  };

  const stats={};
  postulaciones.forEach(p=>{stats[p.canal]=(stats[p.canal]||0)+1;});
  const total=postulaciones.length;

  // Stats de visitas por canal
  const visitasPorCanal = {};
  const visitasUnicasPorCanal = {};
  visitas.forEach(v => {
    visitasPorCanal[v.canal] = (visitasPorCanal[v.canal]||0) + 1;
    if (!visitasUnicasPorCanal[v.canal]) visitasUnicasPorCanal[v.canal] = new Set();
    if (v.fingerprint) visitasUnicasPorCanal[v.canal].add(v.fingerprint);
  });

  // Visitas del canal seleccionado por día/hora
  const visitasFiltradas = visitas.filter(v => v.canal === filtroCanal);
  const porDia = {};
  const porHora = {};
  visitasFiltradas.forEach(v => {
    const d = new Date(v.created_at);
    const dia = d.toLocaleDateString("es-CL",{weekday:"short",day:"numeric",month:"short"});
    const hora = `${d.getHours()}:00`;
    porDia[dia] = (porDia[dia]||0) + 1;
    porHora[hora] = (porHora[hora]||0) + 1;
  });
  const maxDia = Math.max(...Object.values(porDia), 1);
  const maxHora = Math.max(...Object.values(porHora), 1);

  const copiarURL = (canal) => {
    navigator.clipboard.writeText(`https://bigticket-portal.vercel.app?canal=${canal}`);
    alert("✅ URL copiada al portapapeles");
  };

  return (
    <div>
      <div className="sec-title" style={{marginBottom:4}}>Análisis de canales</div>
      <div className="sec-sub">Visitas y postulaciones por canal de captación</div>

      {/* Tabla comparativa canales */}
      <div className="form-card" style={{marginBottom:20}}>
        <div className="form-title">Resumen por canal</div>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
            <thead>
              <tr style={{background:"#1a3a6b",color:"#fff"}}>
                {["Canal","Visitas totales","Visitas únicas","Postulaciones","Conversión",""].map(h=>(
                  <th key={h} style={{padding:"10px 14px",textAlign:"left",fontWeight:600,whiteSpace:"nowrap"}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.entries(CANALES).filter(([k])=>k!=="portal").map(([k,c],i)=>{
                const vTotal = visitasPorCanal[k]||0;
                const vUnicas = visitasUnicasPorCanal[k]?.size||0;
                const posts = stats[k]||0;
                const conv = vTotal ? Math.round(posts/vTotal*100) : 0;
                return (
                  <tr key={k} style={{background:i%2===0?"#f8f9fa":"#fff",borderBottom:"1px solid #e4e7ec"}}>
                    <td style={{padding:"10px 14px"}}>
                      <div style={{display:"flex",alignItems:"center",gap:8}}>
                        <div style={{width:28,height:28,borderRadius:"50%",background:c.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:600,color:"#fff",flexShrink:0}}>{c.initial}</div>
                        <span style={{fontWeight:600}}>{c.label}</span>
                      </div>
                    </td>
                    <td style={{padding:"10px 14px",fontWeight:700,color:"#1a3a6b",fontSize:16}}>{vTotal}</td>
                    <td style={{padding:"10px 14px",color:"#555"}}>{vUnicas}</td>
                    <td style={{padding:"10px 14px",fontWeight:600}}>{posts}</td>
                    <td style={{padding:"10px 14px"}}>
                      <div style={{display:"flex",alignItems:"center",gap:8}}>
                        <div style={{width:60,height:6,background:"#f0f0f0",borderRadius:3}}>
                          <div style={{width:`${Math.min(conv,100)}%`,height:"100%",background:conv>=20?"#10B981":conv>=10?"#F59E0B":"#EF4444",borderRadius:3}}/>
                        </div>
                        <span style={{fontSize:12,fontWeight:600,color:conv>=20?"#166534":conv>=10?"#92400e":"#c0392b"}}>{conv}%</span>
                      </div>
                    </td>
                    <td style={{padding:"10px 14px"}}>
                      <button onClick={()=>setFiltroCanal(k)}
                        style={{fontSize:11,padding:"4px 10px",borderRadius:6,border:`1px solid ${filtroCanal===k?"#1a3a6b":"#e4e7ec"}`,
                          background:filtroCanal===k?"#1a3a6b":"#fff",color:filtroCanal===k?"#fff":"#555",
                          cursor:"pointer",fontFamily:"'Geist',sans-serif"}}>
                        Ver detalle
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detalle del canal seleccionado */}
      {filtroCanal && (
        <div className="form-card" style={{marginBottom:20}}>
          <div className="form-title" style={{display:"flex",alignItems:"center",gap:8}}>
            <div style={{width:24,height:24,borderRadius:"50%",background:CANALES[filtroCanal]?.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:600,color:"#fff"}}>{CANALES[filtroCanal]?.initial}</div>
            {CANALES[filtroCanal]?.label} — Detalle de visitas
          </div>

          {visitasFiltradas.length === 0 ? (
            <div style={{textAlign:"center",padding:"20px",color:"#888",fontSize:13}}>Sin visitas registradas aún para este canal</div>
          ) : (()=>{
            const diaMayor = Object.entries(porDia).sort((a,b)=>b[1]-a[1])[0];
            const horaMayor = Object.entries(porHora).sort((a,b)=>b[1]-a[1])[0];
            const totalVisitas = visitasFiltradas.length;
            const unicasCanal = visitasUnicasPorCanal[filtroCanal]?.size||0;
            const retorno = totalVisitas - unicasCanal;
            const diasEntradas = Object.keys(porDia).length;
            const promDia = diasEntradas ? (totalVisitas/diasEntradas).toFixed(1) : 0;

            // Heatmap: filas=horas(0-23), columnas=días únicos (últimos 14)
            const diasUnicos = [...new Set(visitasFiltradas.map(v=>{
              const d = new Date(v.created_at);
              return d.toLocaleDateString("es-CL",{weekday:"short",day:"numeric",month:"short"});
            }))].slice(-14);
            const heatData = {};
            visitasFiltradas.forEach(v=>{
              const d = new Date(v.created_at);
              const dia = d.toLocaleDateString("es-CL",{weekday:"short",day:"numeric",month:"short"});
              const hora = d.getHours();
              if(!heatData[hora]) heatData[hora]={};
              heatData[hora][dia] = (heatData[hora][dia]||0)+1;
            });
            const maxVal = Math.max(...Object.values(heatData).flatMap(h=>Object.values(h)),1);

            const getColor = (n) => {
              if(!n) return "#f0f0f0";
              const intensity = n/maxVal;
              if(intensity>0.75) return "#1a3a6b";
              if(intensity>0.5)  return "#2563eb";
              if(intensity>0.25) return "#60a5fa";
              return "#bfdbfe";
            };

            const cellW = Math.max(28, Math.min(50, Math.floor(520/Math.max(diasUnicos.length,1))));

            return (
              <div>
                {/* Insights */}
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(120px,1fr))",gap:10,marginBottom:20}}>
                  {[["Total visitas",totalVisitas,"#1a3a6b"],["Visitas únicas",unicasCanal,"#7c3aed"],
                    ["Revisitas",retorno,"#F47B20"],["Prom. por día",promDia,"#0369a1"]
                  ].map(([l,v,c])=>(
                    <div key={l} style={{background:"#f8f9fa",borderRadius:10,padding:"12px",textAlign:"center",border:"0.5px solid #e4e7ec"}}>
                      <div style={{fontSize:22,fontWeight:800,color:c}}>{v}</div>
                      <div style={{fontSize:10,color:"#888",marginTop:2}}>{l}</div>
                    </div>
                  ))}
                  {diaMayor&&(
                    <div style={{background:"#fff7ed",borderRadius:10,padding:"12px",textAlign:"center",border:"1px solid #fed7aa"}}>
                      <div style={{fontSize:10,color:"#c2410c",fontWeight:700,marginBottom:3}}>📅 Día pico</div>
                      <div style={{fontSize:11,fontWeight:700,color:"#92400e",marginBottom:2}}>{diaMayor[0]}</div>
                      <div style={{fontSize:18,fontWeight:800,color:"#c2410c"}}>{diaMayor[1]} vis.</div>
                    </div>
                  )}
                  {horaMayor&&(
                    <div style={{background:"#f0fdf4",borderRadius:10,padding:"12px",textAlign:"center",border:"1px solid #86efac"}}>
                      <div style={{fontSize:10,color:"#166534",fontWeight:700,marginBottom:3}}>🕐 Hora pico</div>
                      <div style={{fontSize:18,fontWeight:800,color:"#166534"}}>{horaMayor[0]}</div>
                      <div style={{fontSize:11,color:"#166534"}}>{horaMayor[1]} visitas</div>
                    </div>
                  )}
                </div>

                {/* Heatmap */}
                <div style={{fontSize:12,fontWeight:700,color:"#555",marginBottom:10}}>
                  Mapa de calor — Hora vs Día
                  <span style={{fontSize:10,fontWeight:400,color:"#888",marginLeft:8}}>Más oscuro = más visitas</span>
                </div>
                <div style={{overflowX:"auto"}}>
                  <table style={{borderCollapse:"separate",borderSpacing:3,fontSize:10}}>
                    <thead>
                      <tr>
                        <td style={{width:32,padding:"2px 4px",color:"#888",fontSize:9}}></td>
                        {diasUnicos.map(d=>(
                          <td key={d} style={{width:cellW,textAlign:"center",color:"#555",fontWeight:600,padding:"2px",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",maxWidth:cellW}}>
                            {d.split(" ").slice(0,2).join(" ")}
                          </td>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {Array.from({length:24},(_,h)=>(
                        <tr key={h}>
                          <td style={{fontSize:9,color:"#888",paddingRight:4,textAlign:"right",whiteSpace:"nowrap"}}>{h}:00</td>
                          {diasUnicos.map(d=>{
                            const n = heatData[h]?.[d]||0;
                            return (
                              <td key={d} title={`${d} ${h}:00 — ${n} visitas`}
                                style={{width:cellW,height:20,background:getColor(n),borderRadius:4,textAlign:"center",
                                  fontSize:9,color:n>maxVal*0.5?"#fff":"transparent",fontWeight:700,cursor:n?"default":"default"}}>
                                {n||""}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Leyenda */}
                <div style={{display:"flex",alignItems:"center",gap:6,marginTop:10}}>
                  <span style={{fontSize:10,color:"#888"}}>Menos</span>
                  {["#f0f0f0","#bfdbfe","#60a5fa","#2563eb","#1a3a6b"].map(c=>(
                    <div key={c} style={{width:16,height:16,background:c,borderRadius:3}}/>
                  ))}
                  <span style={{fontSize:10,color:"#888"}}>Más</span>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* URLs de captación */}
      <div className="form-card">
        <div className="form-title">URLs de captación por canal</div>
        <div style={{fontSize:12,color:"#666",marginBottom:12}}>Comparte estas URLs — cada visita queda registrada automáticamente</div>
        {Object.entries(CANALES).filter(([k])=>k!=="portal").map(([k,c])=>(
          <div key={k} className="url-row">
            <div style={{width:24,height:24,borderRadius:"50%",background:c.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,color:"#fff",flexShrink:0}}>{c.initial}</div>
            <div style={{flex:1}}>
              <div style={{fontSize:12,fontWeight:600,color:"#1a1a1a"}}>{c.label}</div>
              <div className="url-text">https://bigticket-portal.vercel.app?canal={k}</div>
            </div>
            <button onClick={()=>copiarURL(k)}
              style={{fontSize:11,padding:"4px 10px",borderRadius:6,border:"1px solid #e4e7ec",background:"#fff",cursor:"pointer",fontFamily:"'Geist',sans-serif",whiteSpace:"nowrap"}}>
              📋 Copiar
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── ONBOARDING TERCEROS ──────────────────────────────────────────────────────
const TIPOS_VEHICULO_CL = [
  "Camión de 28 a 30m³ | 5000 KG",
  "Camión de 25 a 28m³ | 5000 KG",
  "Camión de 25m³ | 2500 a 3000 KG",
  "Camión Plano 5000 KG",
  "Rampla 100m³ | 30 TON",
  "Furgón 4m³",
  "Furgón 6 a 8m³",
  "Furgón 10 a 12m³",
  "Furgón 13m³ (Big Vans)",
  "Vehículo Particular (Sedán, SUV o Hatchback)",
];

const REGIONES_CL = [
  "Región de Arica y Parinacota","Región de Tarapacá","Región de Antofagasta",
  "Región de Atacama","Región de Coquimbo","Región de Valparaíso",
  "Región Metropolitana de Santiago","Región del Libertador Gral. Bernardo O'Higgins",
  "Región del Maule","Región de Ñuble","Región del Biobío",
  "Región de La Araucanía","Región de Los Ríos","Región de Los Lagos",
  "Región de Aysén del Gral. Carlos Ibáñez del Campo",
  "Región de Magallanes y de la Antártica Chilena",
];


const COMUNAS_CL = [
  "Aisén","Algarrobo","Alhué","Alto Biobío","Alto del Carmen","Alto Hospicio",
  "Ancud","Andacollo","Angol","Antártica","Antofagasta","Antuco","Arauco","Arica",
  "Buin","Bulnes","Cabildo","Cabo de Hornos","Cabrero","Calama","Calbuco","Caldera",
  "Calera","Calera de Tango","Calle Larga","Camarones","Camiña","Canela","Cañete",
  "Carahue","Cartagena","Casablanca","Castro","Catemu","Cauquenes","Cerrillos",
  "Cerro Navia","Chaitén","Chañaral","Chanco","Chépica","Chiguayante","Chile Chico",
  "Chillán","Chillán Viejo","Chimbarongo","Cholchol","Chonchi","Cisnes","Cobquecura",
  "Cochamó","Cochrane","Codegua","Coelemu","Coihaique","Coihueco","Coinco","Colbún",
  "Colchane","Colina","Collipulli","Coltauco","Combarbalá","Concepción","Conchalí",
  "Concón","Constitución","Contulmo","Copiapó","Coquimbo","Coronel","Corral","Cunco",
  "Curacautín","Curacaví","Curaco de Vélez","Curanilahue","Curarrehue","Curepto",
  "Curicó","Dalcahue","Diego de Almagro","Doñihue","El Bosque","El Carmen","El Monte",
  "El Quisco","El Tabo","Empedrado","Ercilla","Estación Central","Florida","Freire",
  "Freirina","Fresia","Frutillar","Futaleufú","Futrono","Galvarino","General Lagos",
  "Gorbea","Graneros","Guaitecas","Hijuelas","Hualaihué","Hualañé","Hualpén","Hualqui",
  "Huara","Huasco","Huechuraba","Illapel","Independencia","Iquique","Isla de Maipo",
  "Isla de Pascua","Juan Fernández","La Cisterna","La Cruz","La Estrella","La Florida",
  "La Granja","La Higuera","La Ligua","La Pintana","La Reina","La Serena","La Unión",
  "Lago Ranco","Lago Verde","Laguna Blanca","Laja","Lampa","Lanco","Las Cabras",
  "Las Condes","Lautaro","Lebu","Licantén","Limache","Linares","Litueche","Llaillay",
  "Llanquihue","Lo Barnechea","Lo Espejo","Lo Prado","Lolol","Loncoche","Longaví",
  "Lonquimay","Los Álamos","Los Andes","Los Ángeles","Los Lagos","Los Muermos",
  "Los Sauces","Los Vilos","Lota","Lumaco","Machalí","Macul","Máfil","Maipú","Malloa",
  "Marchihue","María Elena","María Pinto","Mariquina","Maule","Maullín","Mejillones",
  "Melipeuco","Melipilla","Molina","Monte Patria","Mostazal","Mulchén","Nacimiento",
  "Nancagua","Natales","Navidad","Negrete","Ninhue","Ñiquén","Nogales","Nueva Imperial",
  "Ñuñoa","O'Higgins","Olivar","Ollagüe","Olmué","Osorno","Ovalle","Padre Hurtado",
  "Padre Las Casas","Paiguano","Paillaco","Paine","Palena","Palmilla","Panguipulli",
  "Panquehue","Papudo","Paredones","Parral","Pedro Aguirre Cerda","Pelarco","Pelluhue",
  "Pemuco","Peñaflor","Peñalolén","Pencahue","Penco","Peralillo","Perquenco","Petorca",
  "Peumo","Pica","Pichidegua","Pichilemu","Pinto","Pirque","Pitrufquén","Placilla",
  "Portezuelo","Porvenir","Pozo Almonte","Primavera","Providencia","Puchuncaví","Pucón",
  "Pudahuel","Puente Alto","Puerto Montt","Puerto Octay","Puerto Varas","Pumanque",
  "Punitaqui","Punta Arenas","Puqueldón","Purén","Purranque","Putaendo","Putre",
  "Puyehue","Queilén","Quellón","Quemchi","Quilaco","Quilicura","Quilleco","Quillón",
  "Quillota","Quilpué","Quinchao","Quinta de Tilcoco","Quinta Normal","Quintero",
  "Quirihue","Rancagua","Ránquil","Rauco","Recoleta","Renaico","Renca","Rengo",
  "Requínoa","Retiro","Rinconada","Río Bueno","Río Claro","Río Hurtado","Río Ibáñez",
  "Río Negro","Río Verde","Romeral","Saavedra","Sagrada Familia","Salamanca",
  "San Antonio","San Bernardo","San Carlos","San Clemente","San Esteban","San Fabián",
  "San Felipe","San Fernando","San Gregorio","San Ignacio","San Javier","San Joaquín",
  "San José de Maipo","San Juan de la Costa","San Miguel","San Nicolás","San Pablo",
  "San Pedro","San Pedro de Atacama","San Pedro de la Paz","San Rafael","San Ramón",
  "San Rosendo","San Vicente","Santa Bárbara","Santa Cruz","Santa Juana","Santa María",
  "Santiago","Santo Domingo","Sierra Gorda","Talagante","Talca","Talcahuano","Taltal",
  "Temuco","Teno","Teodoro Schmidt","Tierra Amarilla","Tiltil","Timaukel","Tirúa",
  "Tocopilla","Toltén","Tomé","Torres del Paine","Tortel","Traiguén","Treguaco",
  "Tucapel","Valdivia","Vallenar","Valparaíso","Vichuquén","Victoria","Vicuña","Vilcún",
  "Villa Alegre","Villa Alemana","Villarrica","Viña del Mar","Vitacura","Yerbas Buenas",
  "Yumbel","Yungay","Zapallar",
];

function OnboardingLogin({ onIngresar, onVolver }) {
  const [correo,setCorreo]=useState("");
  const [documento,setDocumento]=useState("");
  const [error,setError]=useState("");
  const [cargando,setCargando]=useState(false);

  const ingresar=async()=>{
    if(!correo.trim()||!documento.trim()){setError("Ingresa tu correo y RUT o CURP.");return;}
    setCargando(true);setError("");
    const docLimpio=documento.trim().replace(/[.\-]/g,"").toUpperCase();

    // Buscar por correo + rut O correo + curp
    const {data,error:e}=await sb.from("leads").select("*")
      .eq("email",correo.trim().toLowerCase())
      .or(`rut.eq.${docLimpio},curp.eq.${docLimpio}`)
      .order("created_at",{ascending:false});

    if(e||!data||data.length===0){
      setError("No encontramos una postulación con esos datos. Verifica tu correo y RUT/CURP.");
      setCargando(false);return;
    }

    // Buscar leads con etapa válida para onboarding
    const validos=data.filter(d=>["Propuesta Aceptada","Contrato Firmado","Contrato No Firmado","Onboarding Pendiente","Entrevistas y Validaciones","Postulante Aprobado","Postulante No Calificado"].includes(d.etapa));
    if(validos.length===0){
      setError(`Tu postulación está en etapa "${data[0].etapa}". El formulario se habilitará cuando el equipo Bigticket te lo indique.`);
      setCargando(false);return;
    }
    onIngresar(validos[0]);
    setCargando(false);
  };

  return(
    <div>
      <div className="topbar"><span className="logo">Big<span>ticket</span></span></div>
      <div style={{maxWidth:440,margin:"60px auto",padding:"0 20px"}}>
        <div style={{background:"#fff",borderRadius:16,border:"0.5px solid #e4e7ec",padding:"32px 28px"}}>
          <div style={{textAlign:"center",marginBottom:24}}>
            <div style={{fontSize:32,marginBottom:8}}>📋</div>
            <div style={{fontSize:18,fontWeight:700,color:"#1a1a1a",marginBottom:6}}>Formulario de incorporación</div>
            <div style={{fontSize:13,color:"#666"}}>Ingresa tu correo y RUT (Chile) o CURP (México)</div>
          </div>
          <div className="field-row">
            <span className="field-label">Correo electrónico</span>
            <input value={correo} onChange={e=>setCorreo(e.target.value)}
              type="email" placeholder="tucorreo@ejemplo.com"
              onKeyDown={e=>e.key==="Enter"&&ingresar()}/>
          </div>
          <div className="field-row">
            <span className="field-label">RUT (Chile) o CURP (México)</span>
            <input value={documento} onChange={e=>setDocumento(e.target.value.toUpperCase())}
              placeholder="Ej: 12345678K o ABCD123456HDFXXX00"
              onKeyDown={e=>e.key==="Enter"&&ingresar()}/>
          </div>
          {error&&<div style={{background:"#fee2e2",borderRadius:8,padding:"10px 14px",fontSize:13,color:"#c0392b",marginBottom:14}}>{error}</div>}
          <button className="btn-orange" onClick={ingresar} disabled={cargando} style={{width:"100%"}}>
            {cargando?"Verificando...":"Ingresar →"}
          </button>
          <button onClick={onVolver} style={{width:"100%",marginTop:10,background:"none",border:"0.5px solid #d0d5dd",borderRadius:10,padding:"10px",fontSize:13,color:"#555",cursor:"pointer",fontFamily:"'Geist',sans-serif"}}>
            ← Volver al portal
          </button>
        </div>
      </div>
    </div>
  );
}


const OPERACIONES_CL = [
  "ML_ARAUCO","ML_ARICA","ML_CORDILLERA","ML_MELIPILLA","ML_SALAMANCA",
  "ML_SAN_ANTONIO","ML_SERENA","ML_VIÑA","ML_CAÑETE","ML_PICHILEMU",
  "F_VIÑA","S_VIÑA","R_RM","R_VIÑA","BODEGA_VIÑA","BODEGA_RM",
];

const TIPOS_VEHICULO_MX = ["Small Van","Large Van","Small + Large Van"];

const IMAGENES_VEHICULO_MX = {
  "Small Van":         "https://psvdtgjvognbmxfvqbaa.supabase.co/storage/v1/object/public/assets/SMALL_VAN.jpeg",
  "Large Van":         "https://psvdtgjvognbmxfvqbaa.supabase.co/storage/v1/object/public/assets/LARGE_VAN.jpeg",
  "Small + Large Van": null,
};

const DESC_VEHICULO_MX = {
  "Small Van":         "De 2,0 m³ a 5,4 m³. Ejemplos: Peugeot Partner, Nissan NV200, Ford Transit Connect Carga, Chevrolet Express 1500, Volkswagen Transporter.",
  "Large Van":         "De 5,5 m³ a 12,9 m³. Ejemplos: Nissan Urvan Panel, Ford Transit Custom, RAM ProMaster, Mercedes-Benz Sprinter, Peugeot Manager, Fiat Ducato.",
  "Small + Large Van": "Tienes disponibilidad tanto en Small Van (2,0–5,4 m³) como en Large Van (5,5–12,9 m³).",
};
const PUESTOS_MX = ["Driver","Ayudante","Propietario"];

async function subirDocumento(file, leadId, nombre) {
  if (!file) return null;
  const ext = file.name.split('.').pop();
  const path = `${leadId}/${nombre}_${Date.now()}.${ext}`;
  const { error } = await sb.storage.from("documentos-terceros").upload(path, file, { upsert: true, contentType: file.type });
  if (error) { console.error("Error subiendo:", error); return null; }
  const { data } = sb.storage.from("documentos-terceros").getPublicUrl(path);
  return data.publicUrl;
}

function UploadField({ label, valor, onChange, uploading }) {
  return (
    <div className="field-row">
      <span className="field-label">{label}</span>
      <label style={{display:"flex",alignItems:"center",gap:10,padding:"9px 12px",borderRadius:8,
        border:"0.5px solid #d0d5dd",background:"#f8f9fa",cursor:"pointer",fontSize:13}}>
        <span style={{fontSize:16}}>📎</span>
        <span style={{color:valor?"#10B981":"#888",flex:1}}>{uploading?"Subiendo...":valor?"✅ Archivo cargado":"Seleccionar archivo"}</span>
        <input type="file" accept="image/*,.pdf" style={{display:"none"}} onChange={onChange} disabled={uploading}/>
      </label>
      {valor&&<a href={valor} target="_blank" style={{fontSize:11,color:"#1a3a6b",marginTop:3,display:"block"}}>Ver archivo →</a>}
    </div>
  );
}


function ErrMsg({ campo, errores }) {
  return errores[campo] ?
    <span style={{ fontSize: 11, color: "#EF4444", marginTop: 3, display: "block" }}>⚠ {errores[campo]}</span> : null;
}

function SelectField({ label, campo, opciones, value, onChange, required, errores, setErrores }) {
  return (
    <div className="field-row">
      <span className="field-label">{label}{required ? " *" : ""}</span>
      <select value={value} onChange={e => { onChange(e.target.value); setErrores(p => ({ ...p, [campo]: "" })); }}
        style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: `0.5px solid ${errores[campo] ? "#EF4444" : "#d0d5dd"}`, background: errores[campo] ? "#fff5f5" : "#fff", fontSize: 13, color: value ? "#1a1a1a" : "#888", cursor: "pointer" }}>
        <option value="">-- Seleccionar --</option>
        {opciones.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      <ErrMsg campo={campo} errores={errores} />
    </div>
  );
}

function TextField({ label, campo, value, onChange, placeholder, required, type="text", errores, setErrores }) {
  return (
    <div className="field-row">
      <span className="field-label">{label}{required ? " *" : ""}</span>
      <input type={type} value={value} placeholder={placeholder || ""}
        onChange={e => { onChange(e.target.value); setErrores(p => ({ ...p, [campo]: "" })); }}
        style={errores[campo] ? { borderColor: "#EF4444", background: "#fff5f5" } : {}} />
      <ErrMsg campo={campo} errores={errores} />
    </div>
  );
}

function ViewOnboarding({ lead, onVolver }) {
  const pais = lead.pais || "Chile";
  const esMexico = pais === "México";
  const [guardando, setGuardando] = useState(false);
  const [completado, setCompletado] = useState(false);
  const [yaCompletado, setYaCompletado] = useState(false);
  const [cargandoInicial, setCargandoInicial] = useState(true);
  const [uploading, setUploading] = useState({});
  const [showPrivacidad, setShowPrivacidad] = useState(false);
  const [errores, setErrores] = useState({});

  // Form Chile
  const [formCL, setFormCL] = useState({
    tipo_certificacion: "",
    posee_inicio_actividades: "",
    tipo_persona: "",
    razon_social: "",
    rut_empresa: "",
    direccion_empresa: "",
    nombre_representante: lead.nombre || "",
    rut_representante: lead.rut || "",
    correo: lead.email || "",
    telefono: lead.telefono || "",
    banco: "",
    formato_cuenta: "",
    tipo_cuenta: "",
    nombre_titular: "",
    rut_titular: "",
    operacion: "",
    supervisor: "",
    acepta_privacidad: false,
    url_carnet: "",
  });

  // Form México
  const [formMX, setFormMX] = useState({
    puesto: "",
    tipo_vehiculo: "",
    url_vehiculo: "",
    nombre: lead.nombre || "",
    apellidos: "",
    ine: lead.rut || "",
    curp: "",
    rfc: "",
    licencia: "",
    telefono: lead.telefono || "",
    email: lead.email || "",
    localidad: lead.region_estado || "",
    colonia: "",
    acepta_privacidad: false,
    url_ine: "",
    url_curp: "",
    url_rfc: "",
    url_licencia: "",
  });

  const [guardadoAvance, setGuardadoAvance] = useState(false);

  const upd = (setter) => (k, v) => setter(f => ({ ...f, [k]: v }));
  const updCL = upd(setFormCL);
  const updMX = upd(setFormMX);

  const guardarAvance = async () => {
    setGuardando(true);
    try {
      const payload = esMexico ? {
        pais: "México", lead_id: lead.id, codigo_postulacion: lead.codigo_postulacion,
        puesto: formMX.puesto, tipos_vehiculo: [formMX.tipo_vehiculo],
        nombre: formMX.nombre, apellidos: formMX.apellidos, rut: formMX.ine,
        curp: formMX.curp, rfc: formMX.rfc, licencia: formMX.licencia,
        telefono: formMX.telefono, email: formMX.email, localidad: formMX.localidad,
        colonia: formMX.colonia, url_ine: formMX.url_ine, url_curp: formMX.url_curp,
        url_rfc: formMX.url_rfc, url_licencia: formMX.url_licencia,
        url_vehiculo: formMX.url_vehiculo,
        acepta_privacidad: formMX.acepta_privacidad, completado: false,
        updated_at: new Date().toISOString(),
      } : {
        pais: "Chile", lead_id: lead.id, codigo_postulacion: lead.codigo_postulacion,
        tipo_certificacion: formCL.tipo_certificacion, posee_inicio_actividades: formCL.posee_inicio_actividades,
        tipo_persona: formCL.tipo_persona, razon_social: formCL.razon_social,
        rut_empresa: formCL.rut_empresa, direccion_empresa: formCL.direccion_empresa,
        nombre: formCL.nombre_representante, rut: formCL.rut_representante,
        correo: formCL.correo, telefono: formCL.telefono, banco: formCL.banco,
        formato_cuenta: formCL.formato_cuenta, tipo_cuenta: formCL.tipo_cuenta,
        nombre_titular: formCL.nombre_titular, rut_titular: formCL.rut_titular,
        operacion: formCL.operacion, supervisor: formCL.supervisor,
        url_carnet: formCL.url_carnet, acepta_privacidad: formCL.acepta_privacidad,
        completado: false, updated_at: new Date().toISOString(),
      };
      const { error } = await sb.from("onboarding_terceros")
        .upsert(payload, { onConflict: "codigo_postulacion" });
      if (error) throw error;
      setGuardadoAvance(true);
      setTimeout(() => setGuardadoAvance(false), 3000);
    } catch(e) { alert("Error al guardar: " + e.message); }
    finally { setGuardando(false); }
  };

  // Cargar progreso guardado
  useEffect(() => {
    const cargar = async () => {
      try {
        // Verificar en leads si onboarding_completado = true
        const { data: leadData } = await sb.from("leads").select("onboarding_completado").eq("id", lead.id).single();
        if (leadData?.onboarding_completado) { setYaCompletado(true); setCargandoInicial(false); return; }

        // Buscar avance guardado en onboarding_terceros
        try {
          const { data: saved } = await sb.from("onboarding_terceros").select("*").eq("codigo_postulacion", lead.codigo_postulacion).single();
          if (saved?.completado) { setYaCompletado(true); setCargandoInicial(false); return; }
          if (saved) {
            // Cargar avance guardado
            if (esMexico) {
              setFormMX(f => ({...f,
                puesto: saved.puesto || f.puesto,
                tipo_vehiculo: Array.isArray(saved.tipos_vehiculo) ? saved.tipos_vehiculo[0] : (saved.tipos_vehiculo || f.tipo_vehiculo),
                nombre: saved.nombre || f.nombre,
                apellidos: saved.apellidos || f.apellidos,
                ine: saved.rut || f.ine,
                curp: saved.curp || f.curp,
                rfc: saved.rfc || f.rfc,
                licencia: saved.licencia || f.licencia,
                telefono: saved.telefono || f.telefono,
                email: saved.email || f.email,
                localidad: saved.localidad || f.localidad,
                colonia: saved.colonia || f.colonia,
                url_ine: saved.url_ine || "",
                url_curp: saved.url_curp || "",
                url_rfc: saved.url_rfc || "",
                url_licencia: saved.url_licencia || "",
                url_vehiculo: saved.url_vehiculo || "",
                acepta_privacidad: saved.acepta_privacidad || false,
              }));
            } else {
              setFormCL(f => ({...f,
                tipo_certificacion: saved.tipo_certificacion || f.tipo_certificacion,
                posee_inicio_actividades: saved.posee_inicio_actividades || f.posee_inicio_actividades,
                tipo_persona: saved.tipo_persona || f.tipo_persona,
                razon_social: saved.razon_social || f.razon_social,
                rut_empresa: saved.rut_empresa || f.rut_empresa,
                direccion_empresa: saved.direccion_empresa || f.direccion_empresa,
                nombre_representante: saved.nombre || f.nombre_representante,
                rut_representante: saved.rut || f.rut_representante,
                correo: saved.correo || f.correo,
                telefono: saved.telefono || f.telefono,
                banco: saved.banco || f.banco,
                formato_cuenta: saved.formato_cuenta || f.formato_cuenta,
                tipo_cuenta: saved.tipo_cuenta || f.tipo_cuenta,
                nombre_titular: saved.nombre_titular || f.nombre_titular,
                rut_titular: saved.rut_titular || f.rut_titular,
                operacion: saved.operacion || f.operacion,
                supervisor: saved.supervisor || f.supervisor,
                url_carnet: saved.url_carnet || "",
                acepta_privacidad: saved.acepta_privacidad || false,
              }));
            }
          }
        } catch(_) {}
      } catch(_) {}
      finally { setCargandoInicial(false); }
    };
    cargar();
  }, [lead.id]);

  const handleUpload = async (field, file, setter, leadId) => {
    if (!file) return;
    setUploading(u => ({ ...u, [field]: true }));
    const url = await subirDocumento(file, leadId, field);
    if (url) setter(f => ({ ...f, [`url_${field}`]: url }));
    setUploading(u => ({ ...u, [field]: false }));
  };

  const enviar = async () => {
    const payload = esMexico ? {
      pais: "México",
      lead_id: lead.id,
      codigo_postulacion: lead.codigo_postulacion,
      puesto: formMX.puesto,
      tipos_vehiculo: [formMX.tipo_vehiculo],
      nombre: formMX.nombre,
      apellidos: formMX.apellidos,
      rut: formMX.ine,
      curp: formMX.curp,
      rfc: formMX.rfc,
      licencia: formMX.licencia,
      telefono: formMX.telefono,
      email: formMX.email,
      localidad: formMX.localidad,
      colonia: formMX.colonia,
      url_ine: formMX.url_ine,
      url_curp: formMX.url_curp,
      url_rfc: formMX.url_rfc,
      url_licencia: formMX.url_licencia,
      url_vehiculo: formMX.url_vehiculo,
      acepta_privacidad: formMX.acepta_privacidad,
      completado: true,
      completado_at: new Date().toISOString(),
    } : {
      pais: "Chile",
      lead_id: lead.id,
      codigo_postulacion: lead.codigo_postulacion,
      tipo_certificacion: formCL.tipo_certificacion,
      posee_inicio_actividades: formCL.posee_inicio_actividades,
      tipo_persona: formCL.tipo_persona,
      razon_social: formCL.razon_social,
      rut_empresa: formCL.rut_empresa,
      direccion_empresa: formCL.direccion_empresa,
      nombre: formCL.nombre_representante,
      apellidos: "",
      rut: formCL.rut_representante,
      correo: formCL.correo,
      telefono: formCL.telefono,
      banco: formCL.banco,
      formato_cuenta: formCL.formato_cuenta,
      tipo_cuenta: formCL.tipo_cuenta,
      nombre_titular: formCL.nombre_titular,
      rut_titular: formCL.rut_titular,
      operacion: formCL.operacion,
      supervisor: formCL.supervisor,
      url_carnet: formCL.url_carnet,
      acepta_privacidad: formCL.acepta_privacidad,
      completado: true,
      completado_at: new Date().toISOString(),
    };

    // Validar campos obligatorios
    const nuevosErrores = {};
    if (!payload.acepta_privacidad) nuevosErrores.acepta_privacidad = "Debes aceptar las políticas";
    if (esMexico) {
      if (!formMX.puesto) nuevosErrores.puesto = "Campo obligatorio";
      if (!formMX.tipo_vehiculo) nuevosErrores.tipo_vehiculo = "Campo obligatorio";
      if (!formMX.nombre?.trim()) nuevosErrores.nombre = "Campo obligatorio";
      if (!formMX.apellidos?.trim()) nuevosErrores.apellidos = "Campo obligatorio";
      if (!formMX.ine?.trim()) nuevosErrores.ine = "Campo obligatorio";
      if (!formMX.curp?.trim()) nuevosErrores.curp = "Campo obligatorio";
      if (!formMX.rfc?.trim()) nuevosErrores.rfc = "Campo obligatorio";
      if (!formMX.telefono?.trim()) nuevosErrores.telefono = "Campo obligatorio";
      if (!formMX.localidad) nuevosErrores.localidad = "Campo obligatorio";
      if (!formMX.url_ine) nuevosErrores.url_ine = "Debes adjuntar tu INE";
      if (!formMX.url_curp) nuevosErrores.url_curp = "Debes adjuntar tu CURP";
      if (!formMX.url_rfc) nuevosErrores.url_rfc = "Debes adjuntar tu RFC";
      if (!formMX.url_vehiculo) nuevosErrores.url_vehiculo = "Debes adjuntar una foto de tu vehículo";
      if (!formMX.email?.trim()) nuevosErrores.email = "Campo obligatorio";
      if (!formMX.colonia?.trim()) {}
      if (formMX.puesto !== 'Ayudante') {
        if (!formMX.licencia?.trim()) nuevosErrores.licencia = "Campo obligatorio";
        if (!formMX.url_licencia) nuevosErrores.url_licencia = "Debes adjuntar tu licencia";
      }
    } else {
      if (!formCL.tipo_certificacion) nuevosErrores.tipo_certificacion = "Campo obligatorio";
      if (!formCL.posee_inicio_actividades) nuevosErrores.posee_inicio_actividades = "Campo obligatorio";
      if (!formCL.nombre_representante?.trim()) nuevosErrores.nombre_representante = "Campo obligatorio";
      if (!formCL.rut_representante?.trim()) nuevosErrores.rut_representante = "Campo obligatorio";
      if (!formCL.correo?.trim()) nuevosErrores.correo = "Campo obligatorio";
      if (!formCL.telefono?.trim()) nuevosErrores.telefono = "Campo obligatorio";
      if (!formCL.banco?.trim()) nuevosErrores.banco = "Campo obligatorio";
      if (!formCL.formato_cuenta) nuevosErrores.formato_cuenta = "Campo obligatorio";
      if (!formCL.tipo_cuenta) nuevosErrores.tipo_cuenta = "Campo obligatorio";
      if (!formCL.nombre_titular?.trim()) nuevosErrores.nombre_titular = "Campo obligatorio";
      if (!formCL.rut_titular?.trim()) nuevosErrores.rut_titular = "Campo obligatorio";
      if (!formCL.operacion) nuevosErrores.operacion = "Campo obligatorio";
      if (!formCL.url_carnet) nuevosErrores.url_carnet = "Debes adjuntar tu cédula de identidad";
      if (!formCL.supervisor?.trim()) nuevosErrores.supervisor = "Campo obligatorio";
    }
    if (Object.keys(nuevosErrores).length > 0) {
      setErrores(nuevosErrores);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setErrores({});

    setGuardando(true);
    try {
      // Guardar en Supabase — manejamos el 406 por separado para no detener el flujo
      const dbPayload = { ...payload, updated_at: new Date().toISOString() };
      const { error: dbErr } = await sb.from("onboarding_terceros")
        .upsert(dbPayload, { onConflict: "codigo_postulacion" });
      if (dbErr) throw dbErr;
      await sb.from("leads").update({ etapa: "Entrevistas y Validaciones" }).eq("id", lead.id);
      // Notificar N8N
      try {
        await fetch("https://bigticket2026.app.n8n.cloud/webhook/onboarding-completado", {
          method: "POST", mode: "no-cors",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...payload, campana_nombre: lead.origen || "", pais: pais, lead_id: lead.id }),
        });
        // Flujo 10 — marca onboarding_completado = true en leads
        await fetch("https://bigticket2026.app.n8n.cloud/webhook/nboarding-completado-v2", {
          method: "POST", mode: "no-cors",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lead_id: lead.id, nombre: lead.nombre, telefono: lead.telefono, pais: pais, url_vehiculo: formMX.url_vehiculo || "" }),
        });
        // Flujo 13 — verificación vehículo con Claude Vision
        if(formMX.url_vehiculo){
          await fetch("https://bigticket2026.app.n8n.cloud/webhook/verificacion-vehiculo", {
            method: "POST", mode: "no-cors",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ lead_id: lead.id, url_vehiculo: formMX.url_vehiculo }),
          });
        }
      } catch (e) { console.log("N8N error:", e); }
      setCompletado(true);
    } catch (e) { alert("Error al enviar: " + e.message); }
    finally { setGuardando(false); }
  };

  if (cargandoInicial) return (
    <div>
      <div className="topbar"><span className="logo">Big<span>ticket</span></span></div>
      <div style={{minHeight:"60vh",display:"flex",alignItems:"center",justifyContent:"center"}}>
        <div style={{textAlign:"center"}}>
          <div style={{fontSize:32,marginBottom:12}}>🚛</div>
          <div style={{fontSize:14,color:"#888",fontFamily:"'DM Sans',sans-serif"}}>Cargando...</div>
        </div>
      </div>
    </div>
  );

  if (yaCompletado) return (
    <div>
      <div className="topbar"><span className="logo">Big<span>ticket</span></span></div>
      <div style={{ maxWidth: 480, margin: "60px auto", padding: "0 20px" }}>
        <div style={{ background: "#fff", borderRadius: 16, border: "0.5px solid #e4e7ec", padding: "40px 32px", textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#1a3a6b", marginBottom: 8 }}>Formulario ya completado</div>
          <div style={{ fontSize: 13, color: "#555", marginBottom: 8 }}>
            Hola <strong>{lead.nombre}</strong>, ya enviaste tu formulario de incorporación anteriormente.
          </div>
          <div style={{ fontSize: 13, color: "#555", marginBottom: 24 }}>
            Nuestro equipo está revisando tu información y te contactará pronto por WhatsApp 🚛
          </div>
          <div style={{ background: "#f0f9ff", borderRadius: 10, padding: "12px 16px", marginBottom: 24, display: "inline-block" }}>
            <div style={{ fontSize: 11, color: "#0369a1", fontWeight: 700, marginBottom: 4 }}>Tu código de postulación</div>
            <div style={{ fontSize: 20, fontWeight: 900, fontFamily: "monospace", color: "#0369a1", letterSpacing: 2 }}>{lead.codigo_postulacion}</div>
          </div>
          <br/>
          <button className="btn-orange" onClick={onVolver}>Volver al portal</button>
        </div>
      </div>
    </div>
  );

  if (completado) return (
    <div>
      <div className="topbar"><span className="logo">Big<span>ticket</span></span></div>
      <div style={{ maxWidth: 480, margin: "60px auto", padding: "0 20px" }}>
        <div style={{ background: "#fff", borderRadius: 16, border: "0.5px solid #e4e7ec", padding: "40px 32px", textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#166534", marginBottom: 8 }}>¡Formulario enviado!</div>
          <div style={{ fontSize: 13, color: "#555", marginBottom: 24 }}>Tu información fue recibida correctamente. Nuestro equipo la revisará y te contactará pronto por WhatsApp 🚛</div>
          <button className="btn-orange" onClick={onVolver}>Volver al portal</button>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <div className="topbar">
        <span className="logo">Big<span>ticket</span></span>
        <button className="btn-gw" onClick={onVolver}>Salir</button>
      </div>
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "20px 16px" }}>

        {/* Header */}
        <div style={{ background: "#fff", borderRadius: 12, border: "0.5px solid #e4e7ec", padding: "16px 20px", marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#1a1a1a" }}>
                Formulario de incorporación — {esMexico ? "México 🇲🇽" : "Chile 🇨🇱"}
              </div>
              <div style={{ fontSize: 12, color: "#888", marginTop: 4 }}>
                {lead.nombre} · Código: <strong style={{ fontFamily: "monospace" }}>{lead.codigo_postulacion}</strong>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {guardadoAvance && <span style={{ fontSize: 11, color: "#10B981", fontWeight: 600 }}>✓ Guardado</span>}
              <button onClick={guardarAvance} disabled={guardando}
                style={{ background: "#eef2ff", color: "#1a3a6b", border: "none", borderRadius: 8, padding: "6px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                {guardando ? "Guardando..." : "💾 Guardar avance"}
              </button>
            </div>
          </div>
        </div>

        {/* ─── FORMULARIO MÉXICO ─── */}
        {esMexico && (
          <div className="form-card">
            {Object.values(errores).some(e => e) && (
              <div style={{ background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: 8, padding: "10px 14px", marginBottom: 14, fontSize: 12, color: "#c0392b" }}>
                ⚠ Completa los campos obligatorios marcados con *
              </div>
            )}

            <SelectField errores={errores} setErrores={setErrores} label="Puesto al que postula" campo="puesto" opciones={PUESTOS_MX}
              value={formMX.puesto} onChange={v => updMX("puesto", v)} required />

            <SelectField errores={errores} setErrores={setErrores} label="Tipo de Vehículo" campo="tipo_vehiculo" opciones={TIPOS_VEHICULO_MX}
              value={formMX.tipo_vehiculo} onChange={v => updMX("tipo_vehiculo", v)} required />

            {/* Imagen de referencia del vehículo */}
            {formMX.tipo_vehiculo && (
              <div style={{background:"#f0f7ff",border:"1px solid #bfdbfe",borderRadius:12,marginBottom:14,overflow:"hidden"}}>
                {formMX.tipo_vehiculo === "Small + Large Van" ? (
                  <div>
                    <div style={{display:"flex",gap:0}}>
                      <div style={{flex:1,textAlign:"center",background:"#e8f5e9",padding:12}}>
                        <img src={IMAGENES_VEHICULO_MX["Small Van"]} alt="Small Van"
                          style={{width:"100%",height:160,objectFit:"contain",borderRadius:8,display:"block",margin:"0 auto"}}
                          onError={e=>e.target.style.display="none"}/>
                        <div style={{fontSize:12,fontWeight:700,color:"#166534",marginTop:6}}>Small Van</div>
                        <div style={{fontSize:11,color:"#166534"}}>2,0 – 5,4 m³</div>
                      </div>
                      <div style={{flex:1,textAlign:"center",background:"#dbeafe",padding:12}}>
                        <img src={IMAGENES_VEHICULO_MX["Large Van"]} alt="Large Van"
                          style={{width:"100%",height:160,objectFit:"contain",borderRadius:8,display:"block",margin:"0 auto"}}
                          onError={e=>e.target.style.display="none"}/>
                        <div style={{fontSize:12,fontWeight:700,color:"#1e40af",marginTop:6}}>Large Van</div>
                        <div style={{fontSize:11,color:"#1e40af"}}>5,5 – 12,9 m³</div>
                      </div>
                    </div>
                    <div style={{padding:"10px 14px",background:"#f0f7ff"}}>
                      <div style={{fontSize:12,fontWeight:700,color:"#1a3a6b",marginBottom:2}}>📸 Referencia: Small Van + Large Van</div>
                      <div style={{fontSize:12,color:"#555"}}>{DESC_VEHICULO_MX["Small + Large Van"]}</div>
                    </div>
                  </div>
                ) : (
                  <div>
                    {IMAGENES_VEHICULO_MX[formMX.tipo_vehiculo] && (
                      <img src={IMAGENES_VEHICULO_MX[formMX.tipo_vehiculo]} alt={formMX.tipo_vehiculo}
                        style={{width:"100%",height:200,objectFit:"contain",background:"#e8f0fb",display:"block"}}
                        onError={e=>e.target.style.display="none"}/>
                    )}
                    <div style={{padding:"10px 14px"}}>
                      <div style={{fontSize:13,fontWeight:700,color:"#1a3a6b",marginBottom:4}}>📸 Referencia: {formMX.tipo_vehiculo}</div>
                      <div style={{fontSize:12,color:"#555",marginBottom:4}}>{DESC_VEHICULO_MX[formMX.tipo_vehiculo]}</div>
                      <div style={{fontSize:11,color:"#F47B20",fontWeight:600}}>⚠ Tu vehículo debe ser similar al de la imagen</div>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="two-col">
              <TextField errores={errores} setErrores={setErrores} label="Nombres" campo="nombre" value={formMX.nombre} onChange={v => updMX("nombre", v)} placeholder="Tu nombre" required />
              <TextField errores={errores} setErrores={setErrores} label="Apellidos" campo="apellidos" value={formMX.apellidos} onChange={v => updMX("apellidos", v)} placeholder="Tus apellidos" required />
            </div>
            <div className="two-col">
              <TextField errores={errores} setErrores={setErrores} label="INE" campo="ine" value={formMX.ine} onChange={v => updMX("ine", v)} placeholder="Número de INE" required />
              <TextField errores={errores} setErrores={setErrores} label="CURP" campo="curp" value={formMX.curp} onChange={v => updMX("curp", v)} placeholder="CURP" required />
            </div>
            <div className="two-col">
              <TextField errores={errores} setErrores={setErrores} label="RFC" campo="rfc" value={formMX.rfc} onChange={v => updMX("rfc", v)} placeholder="RFC" required />
              {(formMX.puesto === "Driver" || formMX.puesto === "Propietario") && (
                <TextField errores={errores} setErrores={setErrores} label="Licencia de Conducir" campo="licencia" value={formMX.licencia} onChange={v => updMX("licencia", v)} placeholder="Número de licencia" required />
              )}
            </div>
            <div className="two-col">
              <TextField errores={errores} setErrores={setErrores} label="Teléfono" campo="telefono" value={formMX.telefono} onChange={v => updMX("telefono", v)} placeholder="+521..." required />
              <TextField errores={errores} setErrores={setErrores} label="Email" campo="email" type="email" value={formMX.email} onChange={v => updMX("email", v)} placeholder="correo@..." />
            </div>
            <div className="two-col">
              <SelectField errores={errores} setErrores={setErrores} label="Localidad (SVC)" campo="localidad" opciones={ESTADOS_MEXICO}
                value={formMX.localidad} onChange={v => updMX("localidad", v)} />
              <TextField errores={errores} setErrores={setErrores} label="Colonia" campo="colonia" value={formMX.colonia} onChange={v => updMX("colonia", v)} placeholder="Tu colonia" />
            </div>

            <div style={{ marginTop: 8, padding: "12px 14px", background: "#f8f9fa", borderRadius: 10, marginBottom: 8 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#1a1a1a", marginBottom: 10 }}>📎 Documentos requeridos</div>
              <UploadField label="📷 Foto de tu vehículo (frente con placas visibles) *" valor={formMX.url_vehiculo}
                uploading={uploading.vehiculo}
                onChange={e => handleUpload("vehiculo", e.target.files[0], setFormMX, lead.id)} />
              <UploadField label="Adjuntar INE (ambos lados)" valor={formMX.url_ine}
                uploading={uploading.ine}
                onChange={e => handleUpload("ine", e.target.files[0], setFormMX, lead.id)} />
              <UploadField label="Adjuntar CURP" valor={formMX.url_curp}
                uploading={uploading.curp}
                onChange={e => handleUpload("curp", e.target.files[0], setFormMX, lead.id)} />
              <UploadField label="Adjuntar RFC" valor={formMX.url_rfc}
                uploading={uploading.rfc}
                onChange={e => handleUpload("rfc", e.target.files[0], setFormMX, lead.id)} />
              {(formMX.puesto === "Driver" || formMX.puesto === "Propietario") && (
                <UploadField label="Adjuntar Licencia de Conducir" valor={formMX.url_licencia}
                  uploading={uploading.licencia}
                  onChange={e => handleUpload("licencia", e.target.files[0], setFormMX, lead.id)} />
              )}
            </div>
          </div>
        )}

        {/* ─── FORMULARIO CHILE ─── */}
        {!esMexico && (
          <div className="form-card">
            {Object.values(errores).some(e => e) && (
              <div style={{ background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: 8, padding: "10px 14px", marginBottom: 14, fontSize: 12, color: "#c0392b" }}>
                ⚠ Completa los campos obligatorios marcados con *
              </div>
            )}

            <SelectField errores={errores} setErrores={setErrores} label="Tipo de Certificación" campo="tipo_certificacion"
              opciones={["Apoyo", "Planta", "Por Temporada"]}
              value={formCL.tipo_certificacion} onChange={v => updCL("tipo_certificacion", v)} required />

            <SelectField errores={errores} setErrores={setErrores} label="¿Posee Inicio de Actividades?" campo="posee_inicio_actividades"
              opciones={["Si", "No"]}
              value={formCL.posee_inicio_actividades} onChange={v => updCL("posee_inicio_actividades", v)} required />

            {formCL.posee_inicio_actividades === "Si" && (
              <>
                <SelectField errores={errores} setErrores={setErrores} label="¿Persona Natural o Empresa?" campo="tipo_persona"
                  opciones={["Persona Natural", "Empresa"]}
                  value={formCL.tipo_persona} onChange={v => updCL("tipo_persona", v)} required />
                <div className="two-col">
                  <TextField errores={errores} setErrores={setErrores} label="Razón Social" campo="razon_social" value={formCL.razon_social} onChange={v => updCL("razon_social", v)} placeholder="Razón social" required />
                  <TextField errores={errores} setErrores={setErrores} label="RUT Empresa" campo="rut_empresa" value={formCL.rut_empresa} onChange={v => updCL("rut_empresa", v)} placeholder="RUT empresa" required />
                </div>
                <TextField errores={errores} setErrores={setErrores} label="Dirección Empresa" campo="direccion_empresa" value={formCL.direccion_empresa} onChange={v => updCL("direccion_empresa", v)} placeholder="Dirección" required />
              </>
            )}

            <div className="form-title" style={{ marginTop: 16 }}>Datos del Representante Legal</div>
            <div className="two-col">
              <TextField errores={errores} setErrores={setErrores} label="Nombre Completo" campo="nombre_representante" value={formCL.nombre_representante}
                onChange={v => updCL("nombre_representante", v)} placeholder="Nombre completo" required />
              <TextField errores={errores} setErrores={setErrores} label="RUT Representante Legal" campo="rut_representante" value={formCL.rut_representante}
                onChange={v => updCL("rut_representante", v)} placeholder="12345678k" required />
            </div>
            <div className="two-col">
              <TextField errores={errores} setErrores={setErrores} label="Correo de Contacto" campo="correo" type="email" value={formCL.correo}
                onChange={v => updCL("correo", v)} placeholder="correo@..." />
              <TextField errores={errores} setErrores={setErrores} label="Teléfono de Contacto" campo="telefono" value={formCL.telefono}
                onChange={v => updCL("telefono", v)} placeholder="+569..." required />
            </div>

            <div style={{ padding: "12px 14px", background: "#f8f9fa", borderRadius: 10, marginBottom: 8, marginTop: 8 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#1a1a1a", marginBottom: 10 }}>📎 Documentos</div>
              <UploadField label="Adjuntar Cédula de Identidad (ambas caras)" valor={formCL.url_carnet}
                uploading={uploading.carnet}
                onChange={e => handleUpload("carnet", e.target.files[0], setFormCL, lead.id)} />
            </div>

            <div className="form-title" style={{ marginTop: 16 }}>Datos Bancarios</div>
            <div className="two-col">
              <TextField errores={errores} setErrores={setErrores} label="Banco" campo="banco" value={formCL.banco} onChange={v => updCL("banco", v)} placeholder="Nombre del banco" required />
              <SelectField errores={errores} setErrores={setErrores} label="Formato de Cuenta" campo="formato_cuenta"
                opciones={["Persona Natural", "Empresa"]}
                value={formCL.formato_cuenta} onChange={v => updCL("formato_cuenta", v)} />
            </div>
            <div className="two-col">
              <SelectField errores={errores} setErrores={setErrores} label="Tipo de Cuenta" campo="tipo_cuenta"
                opciones={["Cuenta Corriente", "Cuenta Vista", "Cuenta de Ahorro", "Chequera Electronica"]}
                value={formCL.tipo_cuenta} onChange={v => updCL("tipo_cuenta", v)} />
              <TextField errores={errores} setErrores={setErrores} label="Nombre del Titular" campo="nombre_titular" value={formCL.nombre_titular} required
                onChange={v => updCL("nombre_titular", v)} placeholder="Nombre titular" />
            </div>
            <TextField errores={errores} setErrores={setErrores} label="RUT del Titular" campo="rut_titular" value={formCL.rut_titular} required
              onChange={v => updCL("rut_titular", v)} placeholder="RUT titular" />

            <div className="form-title" style={{ marginTop: 16 }}>Operación</div>
            <SelectField errores={errores} setErrores={setErrores} label="Operación donde prestará servicios" campo="operacion"
              opciones={OPERACIONES_CL}
              value={formCL.operacion} onChange={v => updCL("operacion", v)} required />
            <TextField errores={errores} setErrores={setErrores} label="Nombre del Supervisor a Cargo" campo="supervisor" value={formCL.supervisor} required
              onChange={v => updCL("supervisor", v)} placeholder="Nombre del supervisor" />
          </div>
        )}

        {/* Política de privacidad */}
        <div className="form-card">
          {errores.acepta_privacidad && (
            <div style={{ background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: 8, padding: "10px 14px", marginBottom: 12, fontSize: 12, color: "#c0392b" }}>
              ⚠ {errores.acepta_privacidad}
            </div>
          )}
          <label style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "12px 14px", borderRadius: 10,
            border: `1.5px solid ${errores.acepta_privacidad ? "#EF4444" : (esMexico ? formMX.acepta_privacidad : formCL.acepta_privacidad) ? "#1a3a6b" : "#e4e7ec"}`,
            background: (esMexico ? formMX.acepta_privacidad : formCL.acepta_privacidad) ? "#eef2ff" : "#fff", cursor: "pointer" }}>
            <input type="checkbox"
              checked={esMexico ? formMX.acepta_privacidad : formCL.acepta_privacidad}
              onChange={e => {
                if (esMexico) updMX("acepta_privacidad", e.target.checked);
                else updCL("acepta_privacidad", e.target.checked);
                setErrores(p => ({ ...p, acepta_privacidad: "" }));
              }}
              style={{ width: "auto", margin: "2px 0 0", accentColor: "#1a3a6b", flexShrink: 0 }} />
            <span style={{ fontSize: 13, color: "#555", lineHeight: 1.5 }}>
              Acepto las <button onClick={e => { e.preventDefault(); setShowPrivacidad(true); }}
                style={{ background: "none", border: "none", color: "#1a3a6b", fontWeight: 700, cursor: "pointer", fontSize: 13, padding: 0, textDecoration: "underline" }}>
                Políticas de Privacidad</button> de Bigticket
            </span>
          </label>

          <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
            <button style={{ flex: 1, background: "#f0f2f5", color: "#475569", border: "none", borderRadius: 8, padding: "10px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
              onClick={onVolver}>← Volver</button>
            <button className="btn-orange" style={{ flex: 2, marginTop: 0 }} onClick={enviar} disabled={guardando}>
              {guardando ? "Enviando..." : "✅ Enviar formulario"}
            </button>
          </div>
        </div>

        {/* Modal políticas */}
        {showPrivacidad && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 500 }}>
            <div style={{ background: "#fff", borderRadius: 14, width: 560, maxHeight: "80vh", display: "flex", flexDirection: "column" }}>
              <div style={{ padding: "16px 20px", borderBottom: "1px solid #e4e7ec", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontSize: 15, fontWeight: 700 }}>Políticas de Privacidad — Bigticket</div>
                <button onClick={() => setShowPrivacidad(false)} style={{ background: "#f0f2f5", border: "none", borderRadius: 6, width: 28, height: 28, cursor: "pointer", fontSize: 16 }}>×</button>
              </div>
              <div style={{ padding: "16px 20px", overflow: "auto", fontSize: 13, color: "#555", lineHeight: 1.7 }}>
                <p style={{ marginBottom: 12 }}>Conforme a lo dispuesto en el artículo 19 N° 4 de la Constitución Política de la República y a las normas pertinentes de la Ley N° 19.628 sobre protección de la vida privada, el tratamiento de datos personales que se realiza en Bigticket se rige por las siguientes reglas:</p>
                <ul style={{ paddingLeft: 20, marginBottom: 12, display: "flex", flexDirection: "column", gap: 8 }}>
                  <li>Bigticket asegura la confidencialidad de los datos personales de los usuarios.</li>
                  <li>Los datos serán utilizados para el cumplimiento de los fines indicados en el formulario.</li>
                  <li>El usuario podrá ejercer los derechos otorgados por la Ley N° 19.628 en cualquier momento.</li>
                </ul>
              </div>
              <div style={{ padding: "12px 20px", borderTop: "1px solid #e4e7ec" }}>
                <button className="btn-orange" style={{ maxWidth: 200, margin: "0 auto" }} onClick={() => setShowPrivacidad(false)}>Cerrar</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ViewPropuesta() {
  const [lead,setLead]=useState(null);
  const [campana,setCampana]=useState(null);
  const [loading,setLoading]=useState(true);
  const [enviando,setEnviando]=useState(false);
  const [respuesta,setRespuesta]=useState(null);
  const [enviado,setEnviado]=useState(false);

  useEffect(()=>{
    const params=new URLSearchParams(window.location.search);
    const leadId=params.get("lead");
    if(!leadId){setLoading(false);return;}
    const fetch=async()=>{
      const {data:l}=await sb.from("leads").select("*").eq("id",leadId).single();
      if(!l){setLoading(false);return;}
      setLead(l);
      if(l.respuesta_propuesta) setRespuesta(l.respuesta_propuesta);
      if(l.campana_id){
        const {data:c}=await sb.from("campanas").select("*").eq("id",l.campana_id).single();
        setCampana(c);
      }
      setLoading(false);
    };
    fetch();
  },[]);

  const responder=async(decision)=>{
    if(!lead) return;
    setEnviando(true);
    const nuevaEtapa=decision==="si"?"Propuesta Aceptada":"Propuesta Rechazada";
    await sb.from("leads").update({etapa:nuevaEtapa,respuesta_propuesta:decision}).eq("id",lead.id);
    await sb.from("lead_historial").insert({lead_id:lead.id,etapa_anterior:lead.etapa,etapa_nueva:nuevaEtapa});
    // Si acepta → notificar a N8N para enviar WhatsApp con link de onboarding
    if(decision==="si"){
      try{
        await fetch("https://bigticket2026.app.n8n.cloud/webhook/invitacion-onboarding",{
          method:"POST", mode:"no-cors",
          headers:{"Content-Type":"application/json"},
          body:JSON.stringify({
            lead_id: lead.id,
            nombre: lead.nombre,
            telefono: lead.telefono,
            codigo_postulacion: lead.codigo_postulacion,
            campana_nombre: campana?.nombre||"",
            link_onboarding: "https://bigticket-portal.vercel.app?onboarding=1",
            pais: lead.pais||"Chile",
          }),
        });
      }catch(e){console.log("N8N onboarding error:",e);}
    }
    setRespuesta(decision);
    setEnviado(true);
    setEnviando(false);
  };

  const LOGO = "https://psvdtgjvognbmxfvqbaa.supabase.co/storage/v1/object/public/assets/LOGO%20ENCUESTA%20Y%20PROPUESTA.png";

  if(loading) return <div style={{padding:40,textAlign:"center",color:"#888"}}>Cargando propuesta...</div>;
  if(!lead) return <div style={{padding:40,textAlign:"center",color:"#888"}}>Propuesta no encontrada.</div>;

  return(
    <div style={{background:"#f5f5f5",minHeight:"100vh"}}>
      {/* Header */}
      <div style={{background:"#002f5d",padding:"14px 24px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <img src={LOGO} alt="Bigticket" style={{height:38,objectFit:"contain"}}/>
        <span style={{color:"#fff",fontSize:12,fontWeight:600,letterSpacing:1,textTransform:"uppercase"}}>Vista del Conductor</span>
      </div>

      <div style={{maxWidth:680,margin:"0 auto",padding:"24px 16px"}}>
        {/* Saludo */}
        <div style={{background:"#fff",borderRadius:12,padding:"16px 20px",marginBottom:20,border:"0.5px solid #e4e7ec"}}>
          <div style={{fontSize:13,color:"#555"}}>Hola, <strong style={{color:"#1a1a1a"}}>{lead.nombre}</strong> — revisa tu propuesta y responde al final.</div>
        </div>

        {campana?.propuesta_cedis?(
          <div style={{background:"#fff",borderRadius:12,overflow:"hidden",marginBottom:20,border:"0.5px solid #e4e7ec"}}>

            {/* Título propuesta */}
            <div style={{padding:"28px 24px 20px"}}>
              <div style={{fontSize:26,fontWeight:800,color:"#1a1a1a",marginBottom:6}}>Propuesta Económica</div>
              <div style={{width:52,height:3,background:"#F47B20",borderRadius:2}}/>
            </div>

            {/* Condiciones generales */}
            <div style={{padding:"0 24px 24px"}}>
              <div style={{fontSize:14,fontWeight:700,color:"#1a3a6b",marginBottom:12,display:"flex",alignItems:"center",gap:8}}>
                <div style={{width:4,height:18,background:"#F47B20",borderRadius:2}}/>
                Condiciones Generales de la Operación
              </div>
              <div style={{background:"#f8f9fa",borderRadius:10,padding:"16px 20px",display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,border:"0.5px solid #e4e7ec"}}>
                {[
                  ["📍","Dirección CEDIS",campana.propuesta_cedis],
                  ["🕐","Horario de presentación",campana.propuesta_horario],
                  ["📦","Entregas estimadas",campana.propuesta_entregas],
                  ["🗓","Devolución",campana.propuesta_devolucion],
                ].filter(([,,v]) => v).map(([ic,l,v])=>(
                  <div key={l}>
                    <div style={{fontSize:10,color:"#1a1a1a",fontWeight:800,textTransform:"uppercase",marginBottom:4,display:"flex",alignItems:"center",gap:4}}>
                      <span>{ic}</span> {l}
                    </div>
                    <div style={{fontSize:14,fontWeight:400,color:"#1a1a1a"}}>{v}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tarifas */}
            {campana.propuesta_tarifas?.length>0&&(
              <div style={{padding:"0 24px 24px"}}>
                <div style={{fontSize:14,fontWeight:700,color:"#1a3a6b",marginBottom:12,display:"flex",alignItems:"center",gap:8}}>
                  <div style={{width:4,height:18,background:"#F47B20",borderRadius:2}}/>
                  Tarifas por Jornada
                </div>
                {/* En móvil: cards por categoría */}
                <div style={{display:"block"}} className="tarifas-cards">
                  {campana.propuesta_tarifas.map((t,i)=>(
                    <div key={i} style={{background:i%2===0?"#f8f9fa":"#fff",borderRadius:8,padding:"12px",marginBottom:8,border:"0.5px solid #e4e7ec"}}>
                      <div style={{fontWeight:700,color:"#1a3a6b",marginBottom:8,fontSize:13}}>{t.categoria}</div>
                      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:6}}>
                        {["0-100","101-150","151-200","201-250","251+"].map(k=>t.tramos?.[k]&&(
                          <div key={k} style={{background:"#fff",borderRadius:6,padding:"6px 8px",border:"0.5px solid #e4e7ec",textAlign:"center"}}>
                            <div style={{fontSize:9,color:"#888",fontWeight:600,marginBottom:2}}>{k} km</div>
                            <div style={{fontSize:13,fontWeight:700,color:"#1a1a1a"}}>$ {t.tramos[k]}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{fontSize:11,color:"#888",marginTop:8}}>
                  *Valores netos + IVA{campana.propuesta_auxiliar?<span> | <strong>Auxiliar: {campana.propuesta_auxiliar}</strong></span>:""}
                </div>
              </div>
            )}

            {/* Nivel de servicio */}
            <div style={{padding:"0 24px 24px"}}>
              <div style={{fontSize:14,fontWeight:700,color:"#1a3a6b",marginBottom:12,display:"flex",alignItems:"center",gap:8}}>
                <div style={{width:4,height:18,background:"#F47B20",borderRadius:2}}/>
                Nivel de Servicio
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
                <div style={{background:"#f0f2f5",borderRadius:10,padding:"16px",textAlign:"center"}}>
                  <div style={{fontSize:10,color:"#888",fontWeight:700,textTransform:"uppercase",marginBottom:8,letterSpacing:0.5}}>Mínimo exigido</div>
                  <div style={{fontSize:26,fontWeight:800,color:"#1a3a6b"}}>{campana.propuesta_ns_minimo||"99.00%"}</div>
                </div>
                <div style={{background:"#f0fdf4",borderRadius:10,padding:"16px",textAlign:"center",border:"1.5px solid #86efac"}}>
                  <div style={{fontSize:10,color:"#166534",fontWeight:700,textTransform:"uppercase",marginBottom:8,letterSpacing:0.5}}>Excelente 🏆</div>
                  <div style={{fontSize:20,fontWeight:800,color:"#166534"}}>{campana.propuesta_ns_excelente||"99.50% - 100%"}</div>
                  <div style={{fontSize:11,color:"#166534",marginTop:6}}>Premio: {campana.propuesta_ns_premio||"5% sobre tarifa diaria"}</div>
                </div>
              </div>
              <div style={{background:"#fffbeb",borderRadius:10,padding:"12px 16px",border:"1px solid #fde68a",display:"flex",gap:10,alignItems:"flex-start"}}>
                <span style={{color:"#F47B20",fontSize:16,flexShrink:0}}>⚠️</span>
                <div style={{fontSize:12,color:"#92400e"}}>
                  <strong>Castigo:</strong> Las rutas que posean un nivel de domicilios visitados inferior al 99,5% y un nivel de servicio inferior al 95%, tendrán un castigo del {campana.propuesta_ns_castigo||"3% sobre la tarifa base del viaje"}.
                </div>
              </div>
            </div>

            {/* Condiciones de pago */}
            <div style={{padding:"0 24px 24px"}}>
              <div style={{fontSize:14,fontWeight:700,color:"#1a3a6b",marginBottom:12,display:"flex",alignItems:"center",gap:8}}>
                <div style={{width:4,height:18,background:"#F47B20",borderRadius:2}}/>
                Condiciones de Pago
              </div>
              <div style={{fontSize:13,color:"#444",display:"flex",flexDirection:"column",gap:8}}>
                {[
                  ["Pago ", <strong>semanal</strong>, " cada ", <strong>viernes</strong>],
                  ["Transferencia bancaria, previa emisión de ", <strong>CFDI</strong>],
                  campana.propuesta_semana_retenida?["Semana retenida al inicio como garantía"]:null,
                  ["Vigencia del", <span style={{textDecoration:"underline"}}> contrato</span>, `: ${campana.propuesta_vigencia||"12 meses"} condicionado al cumplimiento de los niveles de servicio.`],
                ].filter(Boolean).map((parts,i)=>(
                  <div key={i} style={{display:"flex",alignItems:"flex-start",gap:8}}>
                    <span style={{color:"#27ae60",fontWeight:700,flexShrink:0,marginTop:1}}>✓</span>
                    <span>{Array.isArray(parts)?parts.map((p,j)=><span key={j}>{p}</span>):parts}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Requisitos */}
            {campana.propuesta_requisitos&&(
              <div style={{padding:"0 24px 24px"}}>
                <div style={{fontSize:14,fontWeight:700,color:"#1a3a6b",marginBottom:12,display:"flex",alignItems:"center",gap:8}}>
                  <div style={{width:4,height:18,background:"#F47B20",borderRadius:2}}/>
                  Requisitos del Prestador
                </div>
                <div style={{fontSize:13,color:"#444",display:"flex",flexDirection:"column",gap:8}}>
                  {campana.propuesta_requisitos.split("\n").filter(Boolean).map((r,i)=>(
                    <div key={i} style={{display:"flex",alignItems:"flex-start",gap:8}}>
                      <span style={{color:"#27ae60",fontWeight:700,flexShrink:0,marginTop:1}}>✓</span>
                      <span>{r}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {campana.propuesta_notas&&(
              <div style={{padding:"0 24px 24px"}}>
                <div style={{background:"#f0f9ff",borderRadius:10,padding:"12px 16px",border:"1px solid #bae6fd",fontSize:12,color:"#0369a1"}}>
                  <strong>📌 Nota:</strong> {campana.propuesta_notas}
                </div>
              </div>
            )}
          </div>
        ):(
          <div style={{background:"#fff",borderRadius:12,padding:40,textAlign:"center",marginBottom:20,color:"#888"}}>
            La propuesta aún no ha sido cargada. Contacta al equipo Bigticket.
          </div>
        )}

        {/* Botones aceptar/rechazar — SIN CAMBIOS FUNCIONALES */}
        {enviado?(
          <div style={{background:respuesta==="si"?"#dcfce7":"#fee2e2",border:`1px solid ${respuesta==="si"?"#86efac":"#fca5a5"}`,borderRadius:12,padding:"20px 24px",textAlign:"center"}}>
            <div style={{fontSize:20,marginBottom:8}}>{respuesta==="si"?"✅":"❌"}</div>
            <div style={{fontSize:15,fontWeight:700,color:respuesta==="si"?"#166534":"#c0392b"}}>
              {respuesta==="si"?"¡Propuesta aceptada!":"Propuesta rechazada"}
            </div>
            <div style={{fontSize:13,color:"#555",marginTop:6}}>
              {respuesta==="si"?"Nuestro equipo se pondrá en contacto contigo para coordinar los siguientes pasos.":"Gracias por tu tiempo. Puedes postular a otras campañas disponibles."}
            </div>
          </div>
        ):respuesta?(
          <div style={{background:"#f0f9ff",border:"1px solid #bae6fd",borderRadius:12,padding:"20px 24px",textAlign:"center"}}>
            <div style={{fontSize:13,color:"#0369a1",fontWeight:600}}>Ya respondiste esta propuesta anteriormente: {respuesta==="si"?"Aceptada ✅":"Rechazada ❌"}</div>
          </div>
        ):(
          <div style={{background:"#fff",borderRadius:12,border:"0.5px solid #e4e7ec",padding:"20px 24px"}}>
            <div style={{fontSize:14,fontWeight:700,color:"#1a1a1a",marginBottom:6}}>¿Aceptas esta propuesta económica?</div>
            <div style={{fontSize:12,color:"#888",marginBottom:16}}>Tu respuesta actualizará automáticamente el estado de tu postulación.</div>
            <div style={{display:"flex",gap:12}}>
              <button onClick={()=>responder("si")} disabled={enviando}
                style={{flex:1,background:"#F47B20",color:"#fff",border:"none",borderRadius:10,padding:"14px",fontSize:14,fontWeight:700,cursor:"pointer",opacity:enviando?0.6:1}}>
                Aceptar Propuesta
              </button>
              <button onClick={()=>responder("no")} disabled={enviando}
                style={{flex:1,background:"#1a3a6b",color:"#fff",border:"none",borderRadius:10,padding:"14px",fontSize:14,fontWeight:700,cursor:"pointer",opacity:enviando?0.6:1}}>
                No aceptar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function App() {
  // Detectar URL de propuesta
  const params=new URLSearchParams(window.location.search);
  if(params.get("lead")&&params.get("propuesta")==="1"){
    return <><style>{css}</style><ViewPropuesta/></>;
  }
  if(params.get("feedback")==="1"){
    return <><style>{css}</style><FeedbackForm onVolver={()=>window.location.href="https://bigticket-portal.vercel.app"}/></>;
  }
  // Detectar URL de onboarding
  if(params.get("onboarding")==="1"){
    return <><style>{css}</style><OnboardingApp/></>;
  }

  const [view,setView]=useState("country");
  const [op,setOp]=useState(null);
  const [canal]=useState(getCanal);
  const [campaigns,setCampaigns]=useState([]);
  const [loading,setLoading]=useState(true);
  const [selectedCamp,setSelectedCamp]=useState(null);
  const [formCamp,setFormCamp]=useState(null);
  const [showAdmin,setShowAdmin]=useState(false);
  const [adminAuth,setAdminAuth]=useState(!!sessionStorage.getItem("admin_auth"));
  const [successCodigo,setSuccessCodigo]=useState(null);
  const [busquedaCodigo,setBusquedaCodigo]=useState("");

  useEffect(()=>{ registrarVisita(canal); },[]);
  const [resultadoBusqueda,setResultadoBusqueda]=useState(null);
  const [buscando,setBuscando]=useState(false);
  const [errorBusqueda,setErrorBusqueda]=useState("");

  useEffect(()=>{loadCampaigns();},[]);

  async function loadCampaigns() {
    setLoading(true);
    const {data}=await sb.from("campanas").select("*").order("created_at",{ascending:false});
    setCampaigns(data||[]);setLoading(false);
  }

  async function buscarPostulacion() {
    const codigo=busquedaCodigo.trim().toUpperCase();
    if(!codigo){setErrorBusqueda("Ingresa tu código de postulación.");return;}
    setBuscando(true);setErrorBusqueda("");setResultadoBusqueda(null);
    const {data,error}=await sb.from("leads").select("*").eq("codigo_postulacion",codigo).single();
    if(error||!data){setErrorBusqueda("No encontramos una postulación con ese código.");setBuscando(false);return;}
    const {data:hist}=await sb.from("lead_historial").select("*").eq("lead_id",data.id).order("created_at",{ascending:true});
    setResultadoBusqueda({lead:data,historial:hist||[]});
    setBuscando(false);
  }

  if(showAdmin&&!adminAuth) return <><style>{css}</style><AdminLogin onSuccess={()=>setAdminAuth(true)} onClose={()=>setShowAdmin(false)}/></>;
  if(showAdmin&&adminAuth) return <><style>{css}</style><AdminPanel onClose={()=>setShowAdmin(false)} campaigns={campaigns} setCampaigns={setCampaigns}/></>;
  if(resultadoBusqueda) return <><style>{css}</style><ViewPostulacion data={resultadoBusqueda} onVolver={()=>setResultadoBusqueda(null)}/><BiggiBubble/></>;

  return (
    <><style>{css}</ style>
      {view==="country"&&<ViewCountry onSelect={c=>{setOp(c);setView("portal");}} busquedaCodigo={busquedaCodigo} setBusquedaCodigo={setBusquedaCodigo} buscarPostulacion={buscarPostulacion} buscando={buscando} errorBusqueda={errorBusqueda} onAdmin={()=>setShowAdmin(true)}/>}
      {view==="portal"&&op&&<ViewPortal op={op} canal={canal} campaigns={campaigns} loading={loading} onChangePais={()=>setView("country")} onDetail={c=>{setSelectedCamp(c);setView("detail");}} onLibre={()=>{setFormCamp(null);setView("form");}}/>}
      {view==="detail"&&selectedCamp&&<ViewDetail camp={selectedCamp} canal={canal} onBack={()=>setView("portal")} onPostular={()=>{setFormCamp(selectedCamp);setView("form");}}/>}
      {view==="form"&&<ViewForm camp={formCamp} canal={canal} op={op} onBack={()=>setView(formCamp?"detail":"portal")} onSuccess={(codigo)=>{setSuccessCodigo(codigo);setView("success");}}/>}
      {view==="success"&&<ViewSuccess pais={op} onVolver={()=>{setView("portal");loadCampaigns();}}/>}
      <BiggiBubble paginaPrincipal={view==="country"}/>
    </>
  );
}

// App separado para onboarding (acceso por URL ?onboarding=1)
function OnboardingApp() {
  const [lead,setLead]=useState(null);
  const [listo,setListo]=useState(false);
  useEffect(()=>{ setTimeout(()=>setListo(true),0); },[]);
  if(!listo) return(
    <><style>{css}</style>
      <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#f8f9fa"}}>
        <div style={{textAlign:"center"}}>
          <div style={{fontSize:32,marginBottom:12}}>🚛</div>
          <div style={{fontSize:14,color:"#888",fontFamily:"'DM Sans',sans-serif"}}>Cargando...</div>
        </div>
      </div>
    </>
  );
  return(
    <><style>{css}</style>
      {!lead
        ?<OnboardingLogin onIngresar={setLead} onVolver={()=>window.location.href="https://bigticket-portal.vercel.app"}/>
        :<ViewOnboarding lead={lead} onVolver={()=>setLead(null)}/>
      }
      <BiggiBubble/>
    </>
  );
}
