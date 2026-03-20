import { useState, useEffect, useRef } from "react";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://psvdtgjvognbmxfvqbaa.supabase.co";
const SUPABASE_KEY = "sb_publishable_RayW0wqgesNI6FYZ6i0CFQ_6YHaHELP";
const sb = createClient(SUPABASE_URL, SUPABASE_KEY);
const SUPERADMIN_KEY = "PortalTerceros2026";
const DONB_URL = "https://psvdtgjvognbmxfvqbaa.supabase.co/storage/v1/object/public/assets/Don_B1.jpeg";

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

function ViewCountry({ onSelect, busquedaCodigo, setBusquedaCodigo, buscarPostulacion, buscando, errorBusqueda, onAdmin }) {
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
        <div style={{background:"#f8f9fa",border:"1px solid #e4e7ec",borderRadius:14,padding:"20px 20px",marginBottom:16}}>
          <div style={{fontSize:14,fontWeight:700,color:"#1a1a1a",marginBottom:4}}>🔍 Consultar estado de postulación</div>
          <div style={{fontSize:12,color:"#888",marginBottom:14}}>Ingresa tu código para ver el estado e historial de tu postulación</div>
          <div style={{display:"flex",gap:8}}>
            <input
              value={busquedaCodigo}
              onChange={e=>setBusquedaCodigo(e.target.value.toUpperCase())}
              onKeyDown={e=>e.key==="Enter"&&buscarPostulacion()}
              placeholder="Ej: BT-K7M2X3"
              style={{flex:1,padding:"10px 14px",borderRadius:8,border:"1px solid #e4e7ec",fontSize:14,fontFamily:"monospace",fontWeight:700,letterSpacing:1,background:"#fff"}}
            />
            <button onClick={buscarPostulacion} disabled={buscando}
              style={{background:"#F47B20",color:"#fff",border:"none",borderRadius:8,padding:"10px 18px",fontSize:13,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap"}}>
              {buscando?"...":"Consultar"}
            </button>
          </div>
          {errorBusqueda&&<div style={{fontSize:12,color:"#EF4444",marginTop:8}}>{errorBusqueda}</div>}
        </div>
        <div style={{background:"#eef2ff",border:"1px solid #c7d7f9",borderRadius:14,padding:"20px 20px"}}>
          <div style={{fontSize:14,fontWeight:700,color:"#1a3a6b",marginBottom:4}}>📋 Formulario de incorporación</div>
          <div style={{fontSize:12,color:"#555",marginBottom:14}}>¿Tu propuesta fue aceptada? Completa tu formulario de incorporación a BigTicket</div>
          <button onClick={()=>window.location.href="?onboarding=1"}
            style={{background:"#1a3a6b",color:"#fff",border:"none",borderRadius:8,padding:"10px 18px",fontSize:13,fontWeight:700,cursor:"pointer",width:"100%"}}>
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
  "Aguascalientes","Baja California","Baja California Sur","Campeche","Chiapas",
  "Chihuahua","Ciudad de México","Coahuila","Colima","Durango","Guanajuato",
  "Guerrero","Hidalgo","Jalisco","México","Michoacán","Morelos","Nayarit",
  "Nuevo León","Oaxaca","Puebla","Querétaro","Quintana Roo","San Luis Potosí",
  "Sinaloa","Sonora","Tabasco","Tamaulipas","Tlaxcala","Veracruz","Yucatán","Zacatecas"
];

const PREFIJOS = { "Chile": "+569", "México": "+521" };

function ViewForm({ camp, canal, op, onBack, onSuccess }) {
  const [form,setForm]=useState({nombre:"",empresa:"",rut:"",telefono:PREFIJOS[op]||"+569",email:"",fuente_contacto:"",pais_form:op||"Chile",region_estado:""});
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
        canal,pais:form.pais_form||op,score,clasificacion,etapa:clasificacion==="Caliente"?"Propuesta Enviada":"Base Datos Leads",
        origen:isLibre?"Postulación libre":`Campaña: ${camp?.nombre||""}`,
        campana_id:camp?.id||null,fuente_contacto:form.fuente_contacto||null,
        tipo_postulacion:isLibre?"libre":"campaña",
        codigo_postulacion:codigo,
        region_estado:form.region_estado||null,
      }).select().single();
      if(le) throw le;
      await sb.from("postulaciones").insert({
        campana_id:camp?.id||null,lead_id:lead.id,
        tipo:isLibre?"libre":"campaña",canal,pais:op,
        score_calculado:score,respuestas,
      });

      // 2. Llamar a N8N para enviar WhatsApp
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
          }),
        });
      } catch(fetchErr) { console.log("N8N WhatsApp error:", fetchErr); }

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

          {/* Fila 2: RUT + Correo */}
          <div className="two-col">
            <div className="field-row"><span className="field-label">RUT / CURP</span><input value={form.rut} onChange={e=>setForm({...form,rut:e.target.value})} placeholder="Identificación"/></div>
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

// ─── BIGGI — ASISTENTE VIRTUAL ────────────────────────────────────────────────
const BIGGI_PROMPT = `Eres Biggy, el asistente virtual de BigTicket 🚛, una empresa de logística que conecta conductores terceros con campañas de reparto en Chile y México.

Tu rol es ayudar a prospectos y conductores activos con sus consultas de forma amable, clara y con emojis ocasionales.

INFORMACIÓN DE BIGTICKET:

REQUISITOS PARA POSTULAR:
- Los requisitos varían según la campaña (tipo de vehículo, zona, volumen)
- Lo más importante es poder emitir facturas y tener documentación al día
- Cada campaña tiene sus propios criterios de selección

OPERACIONES:
- Presencia en diferentes regiones de Chile y estados de México
- Campañas activas disponibles en el portal

MODALIDADES DE CONTRATO:
- Apoyo: soporte puntual según demanda
- Planta: contrato estable con ruta fija
- Temporada: contrato por período específico
- Cada modalidad tiene su propio flujo y forma de pago

PAGOS:
- Por cantidad de envíos: ganas según cuánto entregues
- Por ruta fija: valor fijo por ruta completada
- La documentación para pagos se solicita periódicamente

CONSULTAS FRECUENTES DE TERCEROS ACTIVOS:
- Certificación de flotas: proceso de verificación del vehículo
- Documentación para pagos: boletas, facturas, liquidaciones
- Carga y descarga de documentos: se hace a través del sistema
- Incidentes (choque/robo): reportar inmediatamente al coordinador

PORTAL:
- Los prospectos pueden postular en: https://bigticket-portal.vercel.app
- Pueden consultar el estado de su postulación con su código BT-XXXXXX

REGLAS:
- Si no sabes algo específico, sé honesto y deriva al equipo: +56957730804
- No inventes información sobre pagos, rutas o campañas específicas
- Siempre invita a postular si detectas que es un prospecto nuevo
- Responde en el idioma del usuario (español)
- Sé conciso — máximo 3-4 líneas por respuesta`;

function BiggiBubble({ paginaPrincipal=false }) {
  const [abierto,setAbierto]=useState(false);
  const [mensajes,setMensajes]=useState([{rol:"biggi",texto:"¡Hola! Soy Biggy 🚛 el asistente virtual de BigTicket. ¿En qué puedo ayudarte hoy?"}]);
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

      const res=await fetch("https://bigticket2026.app.n8n.cloud/webhook/biggi-chat",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          system:BIGGI_PROMPT,
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
      {/* Botón flotante */}
      {!abierto&&(
        <div onClick={()=>setAbierto(true)} style={{position:"fixed",bottom:24,right:24,zIndex:999,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:6}}>
          {paginaPrincipal&&(
            <div style={{background:"#1a3a6b",color:"#fff",borderRadius:12,padding:"8px 14px",fontSize:12,fontWeight:600,boxShadow:"0 4px 16px rgba(0,0,0,0.2)",whiteSpace:"nowrap",animation:"pulse 2s infinite"}}>
              💬 ¿Tienes dudas? ¡Pregúntale a Biggy!
            </div>
          )}
          <div style={{width:80,height:80,borderRadius:"50%",overflow:"hidden",boxShadow:"0 4px 20px rgba(244,123,32,0.5)",border:"3px solid #F47B20"}}>
            <img src={DONB_URL} alt="Biggy" style={{width:"100%",height:"100%",objectFit:"cover",objectPosition:"top"}}/>
          </div>
          <div style={{background:"#1a3a6b",color:"#fff",borderRadius:8,padding:"3px 10px",fontSize:11,fontWeight:700}}>Biggy</div>
        </div>
      )}

      {/* Ventana del chat */}
      {abierto&&(
        <div style={{position:"fixed",bottom:24,right:24,zIndex:999,width:340,height:480,background:"#fff",borderRadius:16,boxShadow:"0 8px 40px rgba(0,0,0,0.2)",display:"flex",flexDirection:"column",overflow:"hidden",border:"1px solid #e4e7ec"}}>
          {/* Header */}
          <div style={{background:"linear-gradient(135deg,#1a3a6b,#2a5a9b)",padding:"12px 16px",display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
            <BiggiFace size={48}/>
            <div style={{flex:1}}>
              <div style={{color:"#fff",fontSize:14,fontWeight:700}}>Biggy</div>
              <div style={{color:"#aac3e8",fontSize:11}}>Asistente Virtual BigTicket</div>
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


function ViewSuccess({ codigo, onVolver }) {
  const [copiado,setCopiado]=useState(false);
  const copiar=()=>{navigator.clipboard?.writeText(codigo||"");setCopiado(true);setTimeout(()=>setCopiado(false),2000);};
  return (
    <div>
      <div className="topbar"><span className="logo">Big<span>ticket</span></span></div>
      <div style={{maxWidth:440,margin:"60px auto",padding:"20px"}}>
        <div style={{background:"#fff",borderRadius:16,padding:"40px 32px",textAlign:"center",border:"0.5px solid #e4e7ec"}}>
          <div style={{width:56,height:56,background:"#dcfce7",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px",fontSize:24,color:"#166534"}}>✓</div>
          <div style={{fontSize:17,fontWeight:700,color:"#166534",marginBottom:8}}>¡Postulación enviada!</div>
          <div style={{fontSize:13,color:"#555",marginBottom:20}}>Tus datos fueron recibidos. Te contactaremos por WhatsApp a la brevedad.</div>
          {codigo&&(
            <div style={{background:"#f0f9ff",border:"1px solid #bae6fd",borderRadius:12,padding:"16px 20px",marginBottom:20}}>
              <div style={{fontSize:11,color:"#0369a1",fontWeight:700,letterSpacing:1,textTransform:"uppercase",marginBottom:8}}>Tu código de postulación</div>
              <div style={{fontSize:28,fontWeight:900,color:"#0369a1",letterSpacing:3,fontFamily:"monospace",marginBottom:10}}>{codigo}</div>
              <div style={{fontSize:12,color:"#555",marginBottom:12}}>Guarda este código — con él puedes consultar el estado de tu postulación en cualquier momento.</div>
              <button onClick={copiar} style={{background:copiado?"#dcfce7":"#e0f2fe",color:copiado?"#166534":"#0369a1",border:"none",borderRadius:8,padding:"8px 16px",fontSize:12,fontWeight:700,cursor:"pointer",width:"100%"}}>
                {copiado?"✓ Código copiado":"Copiar código"}
              </button>
            </div>
          )}
          <button className="btn-orange" style={{maxWidth:200,margin:"0 auto"}} onClick={onVolver}>Volver al inicio</button>
        </div>
      </div>
    </div>
  );
}

function ViewPostulacion({ data, onVolver }) {
  const {lead,historial}=data;
  const ETAPA_COLOR={"Nuevo Lead":"#3B82F6","Nuevo":"#3B82F6","Contactado":"#8B5CF6","Reunión Agendada":"#F59E0B","Propuesta Enviada":"#F97316","Negociación":"#EC4899","Ganado":"#10B981","Perdido":"#EF4444"};
  const ETAPA_ICON={"Nuevo Lead":"🎯","Nuevo":"🎯","Contactado":"📞","Reunión Agendada":"📅","Propuesta Enviada":"📄","Negociación":"🤝","Ganado":"✅","Perdido":"❌"};
  const etapaColor=ETAPA_COLOR[lead.etapa]||"#888";
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
        {historial.length>0&&(
          <div style={{background:"#fff",borderRadius:16,border:"0.5px solid #e4e7ec",padding:"20px 24px"}}>
            <div style={{fontSize:11,color:"#888",fontWeight:700,letterSpacing:1,textTransform:"uppercase",marginBottom:16}}>Historial de tu postulación</div>
            <div style={{position:"relative",paddingLeft:28}}>
              <div style={{position:"absolute",left:10,top:0,bottom:0,width:2,background:"#e4e7ec"}}/>
              {historial.map((h,i)=>(
                <div key={i} style={{marginBottom:16,position:"relative"}}>
                  <div style={{position:"absolute",left:-24,top:2,width:10,height:10,borderRadius:"50%",background:ETAPA_COLOR[h.etapa_nueva]||"#888",border:"2px solid #fff"}}/>
                  <div style={{fontSize:13,fontWeight:700,color:ETAPA_COLOR[h.etapa_nueva]||"#1a1a1a"}}>{ETAPA_ICON[h.etapa_nueva]||"📋"} {h.etapa_nueva}</div>
                  <div style={{fontSize:11,color:"#888",marginTop:2}}>{new Date(h.created_at).toLocaleDateString("es-CL",{day:"2-digit",month:"short",year:"numeric"})} · {new Date(h.created_at).toLocaleTimeString("es-CL",{hour:"2-digit",minute:"2-digit"})}</div>
                </div>
              ))}
            </div>
          </div>
        )}
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
  const [uploadingId,setUploadingId]=useState(null);

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
                        <button className="btn-danger" onClick={()=>deleteCamp(c.id)}>Eliminar</button>
                      </div>
                    </div>
                    {/* Propuesta PDF */}
                    <div style={{width:"100%",background:"#f8f9fa",borderRadius:10,padding:"12px 14px",border:"1px solid #e4e7ec"}}>
                      <div style={{fontSize:12,fontWeight:700,color:"#1a1a1a",marginBottom:8}}>📄 Propuesta económica</div>
                      {c.propuesta_url?(
                        <div style={{display:"flex",alignItems:"center",gap:10}}>
                          <span style={{fontSize:12,color:"#10B981"}}>✅ PDF cargado</span>
                          <a href={c.propuesta_url} target="_blank" style={{fontSize:12,color:"#1a3a6b",fontWeight:600}}>Ver PDF</a>
                          <label style={{fontSize:12,color:"#F47B20",fontWeight:600,cursor:"pointer"}}>
                            Reemplazar
                            <input type="file" accept=".pdf" style={{display:"none"}} onChange={e=>subirPropuesta(c,e.target.files[0])}/>
                          </label>
                        </div>
                      ):(
                        <label style={{display:"inline-flex",alignItems:"center",gap:8,background:"#F47B20",color:"#fff",borderRadius:8,padding:"8px 16px",fontSize:12,fontWeight:700,cursor:"pointer",opacity:uploadingId===c.id?0.6:1}}>
                          {uploadingId===c.id?"Subiendo...":"⬆ Subir propuesta PDF"}
                          <input type="file" accept=".pdf" style={{display:"none"}} disabled={uploadingId===c.id} onChange={e=>subirPropuesta(c,e.target.files[0])}/>
                        </label>
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

function OnboardingLogin({ onIngresar }) {
  const [codigo,setCodigo]=useState("");
  const [rut,setRut]=useState("");
  const [error,setError]=useState("");
  const [cargando,setCargando]=useState(false);

  const ingresar=async()=>{
    if(!codigo.trim()||!rut.trim()){setError("Ingresa tu código y RUT.");return;}
    setCargando(true);setError("");
    const {data,error:e}=await sb.from("leads").select("*")
      .eq("codigo_postulacion",codigo.trim().toUpperCase())
      .eq("rut",rut.trim().replace(/[.\-]/g,""))
      .single();
    if(e||!data){setError("Código o RUT incorrecto. Verifica tus datos.");setCargando(false);return;}
    if(!["Propuesta Aceptada","Contrato Firmado","Contrato No Firmado"].includes(data.etapa)){
      setError("Tu postulación aún no ha llegado a esta etapa.");setCargando(false);return;}
    onIngresar(data);
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
            <div style={{fontSize:13,color:"#666"}}>Ingresa con tu código de postulación y RUT para continuar</div>
          </div>
          <div className="field-row">
            <span className="field-label">Código de postulación</span>
            <input value={codigo} onChange={e=>setCodigo(e.target.value.toUpperCase())}
              placeholder="Ej: BT-K7M2X3" style={{fontFamily:"monospace",fontWeight:700,letterSpacing:1}}/>
          </div>
          <div className="field-row">
            <span className="field-label">RUT (sin puntos ni guión)</span>
            <input value={rut} onChange={e=>setRut(e.target.value)} placeholder="Ej: 12345678k"/>
          </div>
          {error&&<div style={{background:"#fee2e2",borderRadius:8,padding:"10px 14px",fontSize:13,color:"#c0392b",marginBottom:14}}>{error}</div>}
          <button className="btn-orange" onClick={ingresar} disabled={cargando}>
            {cargando?"Verificando...":"Ingresar →"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ViewOnboarding({ lead, onVolver }) {
  const [paso,setPaso]=useState(1);
  const [guardando,setGuardando]=useState(false);
  const [guardado,setGuardado]=useState(false);
  const [completado,setCompletado]=useState(false);
  const [showPrivacidad,setShowPrivacidad]=useState(false);
  const [form,setForm]=useState({
    trabaja_bigticket:null,
    tipos_vehiculo:[],
    nombre:lead.nombre||"",
    apellidos:"",
    rut:lead.rut||"",
    telefono:lead.telefono||"+569",
    email:lead.email||"",
    region:lead.region_estado||"",
    localidad:"",
    acepta_privacidad:false,
  });

  // Cargar progreso guardado
  useEffect(()=>{
    const cargar=async()=>{
      const {data}=await sb.from("onboarding_terceros").select("*").eq("lead_id",lead.id).single();
      if(data){
        setForm(f=>({...f,
          trabaja_bigticket:data.trabaja_bigticket,
          tipos_vehiculo:data.tipos_vehiculo||[],
          nombre:data.nombre||f.nombre,
          apellidos:data.apellidos||"",
          rut:data.rut||f.rut,
          telefono:data.telefono||f.telefono,
          email:data.email||f.email,
          region:data.region||f.region,
          localidad:data.localidad||"",
          acepta_privacidad:data.acepta_privacidad||false,
        }));
        if(data.paso_actual) setPaso(data.paso_actual);
        if(data.completado) setCompletado(true);
      }
    };
    cargar();
  },[lead.id]);

  const guardarProgreso=async(pasoActual=paso)=>{
    setGuardando(true);
    const payload={
      lead_id:lead.id, codigo_postulacion:lead.codigo_postulacion,
      rut:form.rut, nombre:form.nombre, apellidos:form.apellidos,
      telefono:form.telefono, email:form.email, region:form.region,
      localidad:form.localidad, trabaja_bigticket:form.trabaja_bigticket,
      tipos_vehiculo:form.tipos_vehiculo, acepta_privacidad:form.acepta_privacidad,
      paso_actual:pasoActual, updated_at:new Date().toISOString(),
    };
    const {data:existe}=await sb.from("onboarding_terceros").select("id").eq("lead_id",lead.id).single();
    if(existe){
      await sb.from("onboarding_terceros").update(payload).eq("lead_id",lead.id);
    } else {
      await sb.from("onboarding_terceros").insert(payload);
    }
    setGuardando(false);setGuardado(true);setTimeout(()=>setGuardado(false),2000);
  };

  const enviarFormulario=async()=>{
    if(!form.acepta_privacidad){alert("Debes aceptar las políticas de privacidad.");return;}
    if(!form.tipos_vehiculo.length){alert("Selecciona al menos un tipo de vehículo.");return;}
    if(!form.nombre||!form.rut||!form.telefono||!form.region||!form.localidad){
      alert("Completa todos los campos obligatorios.");return;}
    setGuardando(true);
    const payload={
      lead_id:lead.id, codigo_postulacion:lead.codigo_postulacion,
      rut:form.rut, nombre:form.nombre, apellidos:form.apellidos,
      telefono:form.telefono, email:form.email, region:form.region,
      localidad:form.localidad, trabaja_bigticket:form.trabaja_bigticket,
      tipos_vehiculo:form.tipos_vehiculo, acepta_privacidad:form.acepta_privacidad,
      paso_actual:3, completado:true, completado_at:new Date().toISOString(),
      updated_at:new Date().toISOString(),
    };
    const {data:existe}=await sb.from("onboarding_terceros").select("id").eq("lead_id",lead.id).single();
    if(existe){await sb.from("onboarding_terceros").update(payload).eq("lead_id",lead.id);}
    else{await sb.from("onboarding_terceros").insert(payload);}
    // Actualizar etapa del lead
    await sb.from("leads").update({etapa:"Contrato Firmado"}).eq("id",lead.id);
    // Notificar a N8N
    try{
      await fetch("https://bigticket2026.app.n8n.cloud/webhook/onboarding-completado",{
        method:"POST",mode:"no-cors",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({...payload,campana_nombre:lead.origen||"",pais:lead.pais||"Chile"}),
      });
    }catch(e){console.log("N8N error:",e);}
    setGuardando(false);setCompletado(true);
  };

  const toggleVehiculo=(tipo)=>{
    setForm(f=>({...f,tipos_vehiculo:
      f.tipos_vehiculo.includes(tipo)?f.tipos_vehiculo.filter(t=>t!==tipo):[...f.tipos_vehiculo,tipo]
    }));
  };

  const PASOS=[{n:1,label:"Vehículo"},{n:2,label:"Datos personales"},{n:3,label:"Confirmación"}];
  const pct=Math.round(((paso-1)/3)*100);

  if(completado) return(
    <div>
      <div className="topbar"><span className="logo">Big<span>ticket</span></span></div>
      <div style={{maxWidth:480,margin:"60px auto",padding:"0 20px"}}>
        <div style={{background:"#fff",borderRadius:16,border:"0.5px solid #e4e7ec",padding:"40px 32px",textAlign:"center"}}>
          <div style={{fontSize:48,marginBottom:16}}>🎉</div>
          <div style={{fontSize:20,fontWeight:700,color:"#166534",marginBottom:8}}>¡Formulario enviado!</div>
          <div style={{fontSize:13,color:"#555",marginBottom:24}}>Tu información fue recibida correctamente. Nuestro equipo la revisará y te contactará pronto por WhatsApp 🚛</div>
          <button className="btn-orange" onClick={onVolver}>Volver al portal</button>
        </div>
      </div>
    </div>
  );

  return(
    <div>
      <div className="topbar">
        <span className="logo">Big<span>ticket</span></span>
        <button className="btn-gw" onClick={onVolver}>← Volver</button>
      </div>
      <div style={{maxWidth:600,margin:"0 auto",padding:"20px 16px"}}>

        {/* Progreso */}
        <div style={{background:"#fff",borderRadius:12,border:"0.5px solid #e4e7ec",padding:"16px 20px",marginBottom:16}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
            <div style={{fontSize:13,fontWeight:700,color:"#1a1a1a"}}>Formulario de incorporación — Chile 🇨🇱</div>
            <div style={{display:"flex",gap:8,alignItems:"center"}}>
              {guardado&&<span style={{fontSize:11,color:"#10B981"}}>✓ Guardado</span>}
              <button onClick={()=>guardarProgreso()} disabled={guardando}
                style={{background:"#eef2ff",color:"#1a3a6b",border:"none",borderRadius:8,padding:"5px 12px",fontSize:11,fontWeight:700,cursor:"pointer"}}>
                {guardando?"Guardando...":"💾 Guardar avance"}
              </button>
            </div>
          </div>
          <div style={{display:"flex",gap:8,marginBottom:10}}>
            {PASOS.map(p=>(
              <div key={p.n} onClick={()=>setPaso(p.n)} style={{flex:1,textAlign:"center",padding:"6px",borderRadius:8,cursor:"pointer",
                background:paso===p.n?"#1a3a6b":paso>p.n?"#dcfce7":"#f0f2f5",
                color:paso===p.n?"#fff":paso>p.n?"#166534":"#888",fontSize:11,fontWeight:700}}>
                {paso>p.n?"✓ ":""}{p.label}
              </div>
            ))}
          </div>
          <div style={{height:4,background:"#f0f2f5",borderRadius:4}}>
            <div style={{height:"100%",width:`${pct}%`,background:"#1a3a6b",borderRadius:4,transition:"width .4s"}}/>
          </div>
        </div>

        {/* Paso 1 — Vehículo */}
        {paso===1&&(
          <div className="form-card">
            <div className="form-title">¿Actualmente trabajas en BigTicket?</div>
            <div style={{display:"flex",gap:12,marginBottom:20}}>
              {[["si","Sí, trabajo actualmente"],["no","No, es mi primera vez"]].map(([val,label])=>(
                <div key={val} onClick={()=>setForm(f=>({...f,trabaja_bigticket:val==="si"}))}
                  style={{flex:1,padding:"12px 16px",borderRadius:10,border:`2px solid ${form.trabaja_bigticket===(val==="si")?"#1a3a6b":"#e4e7ec"}`,
                    background:form.trabaja_bigticket===(val==="si")?"#eef2ff":"#fff",cursor:"pointer",textAlign:"center",fontSize:13,fontWeight:600,
                    color:form.trabaja_bigticket===(val==="si")?"#1a3a6b":"#555",transition:"all .15s"}}>
                  {label}
                </div>
              ))}
            </div>
            <div className="form-title">Tipo de vehículo (selecciona todos los que apliquen)</div>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {TIPOS_VEHICULO_CL.map(tipo=>(
                <label key={tipo} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",borderRadius:8,
                  border:`1.5px solid ${form.tipos_vehiculo.includes(tipo)?"#1a3a6b":"#e4e7ec"}`,
                  background:form.tipos_vehiculo.includes(tipo)?"#eef2ff":"#fff",cursor:"pointer",transition:"all .15s"}}>
                  <input type="checkbox" checked={form.tipos_vehiculo.includes(tipo)} onChange={()=>toggleVehiculo(tipo)}
                    style={{width:"auto",margin:0,accentColor:"#1a3a6b"}}/>
                  <span style={{fontSize:13,color:form.tipos_vehiculo.includes(tipo)?"#1a3a6b":"#555",fontWeight:form.tipos_vehiculo.includes(tipo)?600:400}}>{tipo}</span>
                </label>
              ))}
            </div>
            <button className="btn-orange" style={{marginTop:16}} onClick={()=>{guardarProgreso(2);setPaso(2);}}>
              Siguiente →
            </button>
          </div>
        )}

        {/* Paso 2 — Datos personales */}
        {paso===2&&(
          <div className="form-card">
            <div className="form-title">Datos personales</div>
            <div className="two-col">
              <div className="field-row"><span className="field-label">Nombre *</span>
                <input value={form.nombre} onChange={e=>setForm(f=>({...f,nombre:e.target.value}))} placeholder="Tu nombre"/></div>
              <div className="field-row"><span className="field-label">Apellidos *</span>
                <input value={form.apellidos} onChange={e=>setForm(f=>({...f,apellidos:e.target.value}))} placeholder="Tus apellidos"/></div>
            </div>
            <div className="two-col">
              <div className="field-row"><span className="field-label">RUT (sin puntos ni guión) *</span>
                <input value={form.rut} onChange={e=>setForm(f=>({...f,rut:e.target.value}))} placeholder="12345678k"/></div>
              <div className="field-row"><span className="field-label">Teléfono WhatsApp *</span>
                <input value={form.telefono} onChange={e=>setForm(f=>({...f,telefono:e.target.value}))} placeholder="+569..."/></div>
            </div>
            <div className="field-row"><span className="field-label">Correo electrónico</span>
              <input type="email" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} placeholder="correo@..."/></div>
            <div className="two-col">
              <div className="field-row"><span className="field-label">Región *</span>
                <select value={form.region} onChange={e=>setForm(f=>({...f,region:e.target.value}))}>
                  <option value="">-- Seleccionar --</option>
                  {REGIONES_CL.map(r=><option key={r}>{r}</option>)}
                </select>
              </div>
              <div className="field-row"><span className="field-label">Localidad a la que postula *</span>
                <input value={form.localidad} onChange={e=>setForm(f=>({...f,localidad:e.target.value}))} placeholder="Ej: Santiago Centro"/></div>
            </div>
            <div style={{display:"flex",gap:10,marginTop:8}}>
              <button style={{flex:1,background:"#f0f2f5",color:"#475569",border:"none",borderRadius:8,padding:"10px",fontSize:12,fontWeight:700,cursor:"pointer"}}
                onClick={()=>{guardarProgreso(1);setPaso(1);}}>← Anterior</button>
              <button className="btn-orange" style={{flex:2,marginTop:0}} onClick={()=>{guardarProgreso(3);setPaso(3);}}>Siguiente →</button>
            </div>
          </div>
        )}

        {/* Paso 3 — Confirmación */}
        {paso===3&&(
          <div className="form-card">
            <div className="form-title">Confirmación y políticas de privacidad</div>
            <div style={{background:"#f8f9fa",borderRadius:10,padding:"14px 16px",marginBottom:16,fontSize:13,color:"#555",lineHeight:1.6}}>
              <div style={{fontWeight:700,color:"#1a1a1a",marginBottom:8}}>Resumen de tu postulación:</div>
              <div>👤 <strong>{form.nombre} {form.apellidos}</strong></div>
              <div>🪪 RUT: {form.rut}</div>
              <div>📍 {form.region} — {form.localidad}</div>
              <div>🚛 {form.tipos_vehiculo.length} tipo(s) de vehículo seleccionado(s)</div>
              {form.trabaja_bigticket!==null&&<div>💼 {form.trabaja_bigticket?"Trabaja actualmente en BigTicket":"Primera vez en BigTicket"}</div>}
            </div>
            <label style={{display:"flex",alignItems:"flex-start",gap:10,padding:"12px 14px",borderRadius:10,
              border:`1.5px solid ${form.acepta_privacidad?"#1a3a6b":"#e4e7ec"}`,
              background:form.acepta_privacidad?"#eef2ff":"#fff",cursor:"pointer",marginBottom:16}}>
              <input type="checkbox" checked={form.acepta_privacidad} onChange={e=>setForm(f=>({...f,acepta_privacidad:e.target.checked}))}
                style={{width:"auto",margin:"2px 0 0",accentColor:"#1a3a6b",flexShrink:0}}/>
              <span style={{fontSize:13,color:"#555",lineHeight:1.5}}>
                Acepto las <button onClick={e=>{e.preventDefault();setShowPrivacidad(true)}}
                  style={{background:"none",border:"none",color:"#1a3a6b",fontWeight:700,cursor:"pointer",fontSize:13,padding:0,textDecoration:"underline"}}>
                  Políticas de Privacidad</button> de BigTicket
              </span>
            </label>
            <div style={{display:"flex",gap:10}}>
              <button style={{flex:1,background:"#f0f2f5",color:"#475569",border:"none",borderRadius:8,padding:"10px",fontSize:12,fontWeight:700,cursor:"pointer"}}
                onClick={()=>{guardarProgreso(2);setPaso(2);}}>← Anterior</button>
              <button className="btn-orange" style={{flex:2,marginTop:0}} onClick={enviarFormulario} disabled={guardando}>
                {guardando?"Enviando...":"✅ Enviar formulario"}
              </button>
            </div>
          </div>
        )}

        {/* Modal políticas */}
        {showPrivacidad&&(
          <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:500}}>
            <div style={{background:"#fff",borderRadius:14,width:560,maxHeight:"80vh",display:"flex",flexDirection:"column"}}>
              <div style={{padding:"16px 20px",borderBottom:"1px solid #e4e7ec",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div style={{fontSize:15,fontWeight:700}}>Políticas de Privacidad — BigTicket</div>
                <button onClick={()=>setShowPrivacidad(false)} style={{background:"#f0f2f5",border:"none",borderRadius:6,width:28,height:28,cursor:"pointer",fontSize:16}}>×</button>
              </div>
              <div style={{padding:"16px 20px",overflow:"auto",fontSize:13,color:"#555",lineHeight:1.7}}>
                <p style={{marginBottom:12}}>Conforme a lo dispuesto en el artículo 19 N° 4 de la Constitución Política de la República y a las normas pertinentes de la Ley N° 19.628 sobre protección de la vida privada y sus modificaciones posteriores, el tratamiento de datos personales que se realiza en BigTicket, se rige por las siguientes reglas:</p>
                <ul style={{paddingLeft:20,marginBottom:12,display:"flex",flexDirection:"column",gap:8}}>
                  <li>BigTicket asegura la confidencialidad de los datos personales de los usuarios que se registren como tales en el sitio Web mediante el o los formularios establecidos para esos efectos. Sin perjuicio de sus facultades legales, la empresa sólo efectuará tratamiento de datos personales respecto de aquéllos que han sido entregados voluntariamente por los usuarios en el referido formulario.</li>
                  <li>Los datos personales de los usuarios serán utilizados para el cumplimiento de los fines indicados en el formulario correspondiente y siempre dentro de las competencias y atribuciones de la empresa.</li>
                  <li>BigTicket podrá comunicar a otros organismos del Estado, los datos personales de sus usuarios, conforme a lo establecido en la Ley 19.628.</li>
                  <li>BigTicket podrá comunicar a terceros, sin el consentimiento expreso del titular, información estadística elaborada a partir de los datos personales de sus usuarios, cuando de dichos datos no sea posible identificar individualmente a los titulares.</li>
                  <li>El usuario podrá en todo momento ejercer los derechos otorgados por la Ley N° 19.628 y sus modificaciones posteriores.</li>
                </ul>
                <p style={{marginBottom:12}}>En específico, podrá:</p>
                <p style={{marginBottom:8}}>a. Solicitar información sobre los datos relativos a su persona, su procedencia y destinatario, el propósito del almacenamiento y la individualización de las personas u organismos a los cuales sus datos son transmitidos regularmente.</p>
                <p style={{marginBottom:8}}>b. Solicitar que se modifiquen sus datos personales cuando ellos no sean correctos o no estén actualizados, si fuere procedente.</p>
                <p style={{marginBottom:12}}>c. Solicitar la eliminación o cancelación de los datos entregados cuando así lo desee, en tanto fuere procedente.</p>
                <p style={{marginBottom:12}}>Respecto de la recolección y tratamiento de datos realizado mediante mecanismos automatizados con el objeto de generar registros de actividad de los visitantes y registros de audiencia, BigTicket sólo podrá utilizar dicha información para la elaboración de informes que cumplan con los objetivos señalados. En ningún caso podrá realizar operaciones que impliquen asociar dicha información a algún usuario identificado o identificable.</p>
                <p style={{fontWeight:600,color:"#1a3a6b"}}>Respecto del consentimiento uso de programa "Alto Checks" para obtención de datos personales:</p>
                <p style={{marginTop:8}}>Al hacer clic en "Acepto", otorgo mi consentimiento voluntario para que BigTicket utilice el programa "Alto Checks" y procese mis Datos Personales de acuerdo con lo establecido en la Ley N° 19.628.</p>
              </div>
              <div style={{padding:"12px 20px",borderTop:"1px solid #e4e7ec"}}>
                <button className="btn-orange" style={{maxWidth:200,margin:"0 auto"}} onClick={()=>setShowPrivacidad(false)}>Cerrar</button>
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
    setRespuesta(decision);
    setEnviado(true);
    setEnviando(false);
  };

  if(loading) return <div style={{padding:40,textAlign:"center",color:"#888"}}>Cargando propuesta...</div>;
  if(!lead) return <div style={{padding:40,textAlign:"center",color:"#888"}}>Propuesta no encontrada.</div>;

  return(
    <div>
      <div className="topbar">
        <span className="logo">Big<span>ticket</span></span>
        <span style={{fontSize:13,color:"#888"}}>Propuesta económica</span>
      </div>
      <div style={{maxWidth:700,margin:"0 auto",padding:"20px 16px"}}>
        <div style={{background:"#fff",borderRadius:16,border:"0.5px solid #e4e7ec",padding:"16px 20px",marginBottom:16}}>
          <div style={{fontSize:13,color:"#888",marginBottom:2}}>Hola, <strong style={{color:"#1a1a1a"}}>{lead.nombre}</strong></div>
          <div style={{fontSize:13,color:"#555"}}>A continuación encontrarás la propuesta económica para la campaña <strong>{campana?.nombre||"BigTicket"}</strong>. Por favor revísala y responde al final.</div>
        </div>

        {campana?.propuesta_url?(
          <div style={{background:"#fff",borderRadius:16,border:"0.5px solid #e4e7ec",overflow:"hidden",marginBottom:16}}>
            <iframe src={campana.propuesta_url} style={{width:"100%",height:600,border:"none"}} title="Propuesta económica"/>
          </div>
        ):(
          <div style={{background:"#fff",borderRadius:16,border:"0.5px solid #e4e7ec",padding:40,textAlign:"center",marginBottom:16,color:"#888"}}>
            La propuesta aún no ha sido cargada. Contacta al equipo BigTicket.
          </div>
        )}

        {enviado?(
          <div style={{background:respuesta==="si"?"#dcfce7":"#fee2e2",border:`1px solid ${respuesta==="si"?"#86efac":"#fca5a5"}`,borderRadius:16,padding:"20px 24px",textAlign:"center"}}>
            <div style={{fontSize:20,marginBottom:8}}>{respuesta==="si"?"✅":"❌"}</div>
            <div style={{fontSize:15,fontWeight:700,color:respuesta==="si"?"#166534":"#c0392b"}}>
              {respuesta==="si"?"¡Propuesta aceptada!":"Propuesta rechazada"}
            </div>
            <div style={{fontSize:13,color:"#555",marginTop:6}}>
              {respuesta==="si"?"Nuestro equipo se pondrá en contacto contigo para coordinar los siguientes pasos.":"Gracias por tu tiempo. Puedes postular a otras campañas disponibles."}
            </div>
          </div>
        ):respuesta?(
          <div style={{background:"#f0f9ff",border:"1px solid #bae6fd",borderRadius:16,padding:"20px 24px",textAlign:"center"}}>
            <div style={{fontSize:13,color:"#0369a1",fontWeight:600}}>Ya respondiste esta propuesta anteriormente: {respuesta==="si"?"Aceptada ✅":"Rechazada ❌"}</div>
          </div>
        ):(
          <div style={{background:"#fff",borderRadius:16,border:"0.5px solid #e4e7ec",padding:"20px 24px"}}>
            <div style={{fontSize:14,fontWeight:700,color:"#1a1a1a",marginBottom:6}}>¿Aceptas esta propuesta económica?</div>
            <div style={{fontSize:12,color:"#888",marginBottom:16}}>Tu respuesta actualizará automáticamente el estado de tu postulación.</div>
            <div style={{display:"flex",gap:12}}>
              <button onClick={()=>responder("si")} disabled={enviando}
                style={{flex:1,background:"#10B981",color:"#fff",border:"none",borderRadius:10,padding:"14px",fontSize:14,fontWeight:700,cursor:"pointer",opacity:enviando?0.6:1}}>
                ✅ Sí, acepto la propuesta
              </button>
              <button onClick={()=>responder("no")} disabled={enviando}
                style={{flex:1,background:"#EF4444",color:"#fff",border:"none",borderRadius:10,padding:"14px",fontSize:14,fontWeight:700,cursor:"pointer",opacity:enviando?0.6:1}}>
                ❌ No acepto
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
      {view==="success"&&<ViewSuccess codigo={successCodigo} onVolver={()=>{setView("portal");loadCampaigns();}}/>}
      <BiggiBubble paginaPrincipal={view==="country"}/>
    </>
  );
}

// App separado para onboarding (acceso por URL ?onboarding=1)
function OnboardingApp() {
  const [lead,setLead]=useState(null);
  return(
    <><style>{css}</style>
      {!lead
        ?<OnboardingLogin onIngresar={setLead}/>
        :<ViewOnboarding lead={lead} onVolver={()=>setLead(null)}/>
      }
      <BiggiBubble/>
    </>
  );
}
