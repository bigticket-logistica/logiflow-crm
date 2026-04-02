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
          <button onClick={e=>{e.currentTarget.textContent="Cargando...";e.currentTarget.disabled=true;window.location.href="?onboarding=1";}}
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
const BIGGI_PROMPT = `Eres Biggy 🚛, el asistente virtual de BigTicket — empresa de logística que conecta conductores independientes con campañas de reparto en Chile y México.

## TU PERSONALIDAD
- Amable, directo y profesional
- Usas emojis ocasionalmente 🚛😊✅
- Respondes CUALQUIER pregunta relacionándola siempre con BigTicket
- Nunca dices "no sé" — siempre orientas o derivas al equipo
- Si te preguntan algo no relacionado con BigTicket, redirige amablemente

## ¿QUÉ ES BIGTICKET?
BigTicket es una empresa de logística de última milla que conecta conductores independientes (terceros) con campañas de reparto para grandes clientes como Mercado Libre, Amazon y otros. Operamos en Chile y México.

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
- Realizar certificación BigTicket para no tener problemas con el pago
- BigTicket puede retener el pago si no se acredita cumplimiento de obligaciones laborales, fiscales y de seguridad social

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
- BigTicket puede rotar operadores entre zonas según necesidades operativas

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
- BigTicket exige seguro de responsabilidad civil propio del conductor
- BigTicket cubre las mercancías transportadas

## REGLAS
- Si no sabes algo → "Para más detalles: +56957730804"
- Siempre invita a postular si es prospecto nuevo
- Siempre lleva al portal: https://bigticket-portal.vercel.app
- No inventes información fuera de este prompt
- Máximo 4 líneas por respuesta salvo cuando el usuario pide detalle
- Si preguntan algo no relacionado con BigTicket: "Mi especialidad es todo lo de BigTicket 🚛 ¿Tienes dudas sobre cómo trabajar con nosotros?"`;



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
  const ETAPA_COLOR={"Nuevo Lead":"#3B82F6","Nuevo":"#3B82F6","Contactado":"#8B5CF6","Reunión Agendada":"#F59E0B","Propuesta Enviada":"#F97316","Negociación":"#EC4899","Propuesta Aceptada":"#10B981","Propuesta Rechazada":"#EF4444","Contrato Firmado":"#10B981","Base Datos Leads":"#6B7280","Ganado":"#10B981","Perdido":"#EF4444"};
  const ETAPA_ICON={"Nuevo Lead":"🎯","Nuevo":"🎯","Contactado":"📞","Reunión Agendada":"📅","Propuesta Enviada":"📄","Negociación":"🤝","Propuesta Aceptada":"✅","Propuesta Rechazada":"❌","Contrato Firmado":"📝","Base Datos Leads":"🗃️","Ganado":"✅","Perdido":"❌"};
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
                  <div style={{fontSize:13,fontWeight:700,color:ETAPA_COLOR[h.etapa_nueva]||"#1a1a1a"}}>{ETAPA_ICON[h.etapa_nueva]||"📋"} {h.etapa_nueva}{i===historialCompleto.length-1&&<span style={{fontSize:10,background:"#F47B20",color:"#fff",borderRadius:10,padding:"1px 7px",marginLeft:6,fontWeight:600}}>Actual</span>}</div>
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
        {[["camps","Campañas"],["nueva","Nueva campaña"],["postulaciones","Postulaciones"],["vehiculos","🚗 Vehículos"],["canales","Canales"],["centros_mx","Centros México"],["biggy","🤖 Biggy"]].map(([k,l])=>(
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
                    {/* Propuesta */}
                    <div style={{width:"100%",background:"#f8f9fa",borderRadius:10,padding:"10px 14px",border:"1px solid #e4e7ec"}}>
                      <div style={{fontSize:12,fontWeight:700,color:"#1a1a1a",marginBottom:4}}>📄 Propuesta económica</div>
                      {c.propuesta_cedis?(
                        <span style={{fontSize:12,color:"#10B981"}}>✅ Propuesta incluida — {c.propuesta_cliente||"cliente"}</span>
                      ):(
                        <span style={{fontSize:12,color:"#c0392b"}}>⚠️ Sin propuesta — recrea la campaña para agregarla</span>
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
  const [codigo,setCodigo]=useState("");
  const [documento,setDocumento]=useState("");
  const [error,setError]=useState("");
  const [cargando,setCargando]=useState(false);
  const [leadParcial,setLeadParcial]=useState(null); // guardamos el lead tras validar código
  const [paso,setPaso]=useState(1); // paso 1: código, paso 2: RUT o CURP

  const validarCodigo=async()=>{
    if(!codigo.trim()){setError("Ingresa tu código de postulación.");return;}
    setCargando(true);setError("");
    const {data,error:e}=await sb.from("leads").select("*")
      .eq("codigo_postulacion",codigo.trim().toUpperCase())
      .single();
    if(e||!data){setError("Código no encontrado. Verifica tus datos.");setCargando(false);return;}
    if(!["Propuesta Aceptada","Contrato Firmado","Contrato No Firmado","Onboarding Pendiente","Entrevistas y Validaciones","Postulante Aprobado","Postulante No Calificado"].includes(data.etapa)){
      setError(`Tu postulación está en etapa "${data.etapa}". El formulario de incorporación se habilitará cuando el equipo BigTicket te lo indique.`);setCargando(false);return;}
    setLeadParcial(data);
    setPaso(2);
    setCargando(false);
  };

  const validarDocumento=async()=>{
    if(!documento.trim()){setError(`Ingresa tu ${leadParcial?.pais==="México"?"CURP":"RUT"}.`);return;}
    setCargando(true);setError("");
    const docLimpio=documento.trim().replace(/[.\-]/g,"").toUpperCase();
    const campoDoc=leadParcial?.pais==="México"?"curp":"rut";
    const {data,error:e}=await sb.from("leads").select("*")
      .eq("codigo_postulacion",codigo.trim().toUpperCase())
      .eq(campoDoc,docLimpio)
      .single();
    if(e||!data){setError(`${leadParcial?.pais==="México"?"CURP":"RUT"} incorrecto. Verifica tus datos.`);setCargando(false);return;}
    onIngresar(data);
    setCargando(false);
  };

  const esMexico=leadParcial?.pais==="México";

  return(
    <div>
      <div className="topbar"><span className="logo">Big<span>ticket</span></span></div>
      <div style={{maxWidth:440,margin:"60px auto",padding:"0 20px"}}>
        <div style={{background:"#fff",borderRadius:16,border:"0.5px solid #e4e7ec",padding:"32px 28px"}}>
          <div style={{textAlign:"center",marginBottom:24}}>
            <div style={{fontSize:32,marginBottom:8}}>📋</div>
            <div style={{fontSize:18,fontWeight:700,color:"#1a1a1a",marginBottom:6}}>Formulario de incorporación</div>
            <div style={{fontSize:13,color:"#666"}}>
              {paso===1?"Ingresa tu código de postulación para continuar":`Ingresa tu ${esMexico?"CURP":"RUT"} para verificar tu identidad`}
            </div>
          </div>
          {paso===1&&(
            <>
              <div className="field-row">
                <span className="field-label">Código de postulación</span>
                <input value={codigo} onChange={e=>setCodigo(e.target.value.toUpperCase())}
                  placeholder="Ej: BT-K7M2X3" style={{fontFamily:"monospace",fontWeight:700,letterSpacing:1}}/>
              </div>
              {error&&<div style={{background:"#fee2e2",borderRadius:8,padding:"10px 14px",fontSize:13,color:"#c0392b",marginBottom:14}}>{error}</div>}
              <button className="btn-orange" onClick={validarCodigo} disabled={cargando}>
                {cargando?"Verificando...":"Continuar →"}
              </button>
            </>
          )}
          {paso===2&&(
            <>
              <div className="field-row">
                <span className="field-label">{esMexico?"CURP":"RUT (sin puntos ni guión)"}</span>
                <input value={documento} onChange={e=>setDocumento(e.target.value)}
                  placeholder={esMexico?"Ej: ABCD123456HDFXXX00":"Ej: 12345678k"}/>
              </div>
              {error&&<div style={{background:"#fee2e2",borderRadius:8,padding:"10px 14px",fontSize:13,color:"#c0392b",marginBottom:14}}>{error}</div>}
              <button className="btn-orange" onClick={validarDocumento} disabled={cargando}>
                {cargando?"Verificando...":"Ingresar →"}
              </button>
              <button onClick={()=>{setPaso(1);setError("");setDocumento("");}} style={{width:"100%",marginTop:10,background:"none",border:"0.5px solid #d0d5dd",borderRadius:10,padding:"10px",fontSize:13,color:"#555",cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>
                ← Volver
              </button>
            </>
          )}
          {paso===1&&<button onClick={onVolver} style={{width:"100%",marginTop:10,background:"none",border:"0.5px solid #d0d5dd",borderRadius:10,padding:"10px",fontSize:13,color:"#555",cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>
            ← Volver al portal
          </button>}
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
      if (!formMX.colonia?.trim()) nuevosErrores.colonia = "Campo obligatorio";
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
              <TextField errores={errores} setErrores={setErrores} label="Colonia" campo="colonia" value={formMX.colonia} onChange={v => updMX("colonia", v)} placeholder="Tu colonia" required />
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
                Políticas de Privacidad</button> de BigTicket
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
                <div style={{ fontSize: 15, fontWeight: 700 }}>Políticas de Privacidad — BigTicket</div>
                <button onClick={() => setShowPrivacidad(false)} style={{ background: "#f0f2f5", border: "none", borderRadius: 6, width: 28, height: 28, cursor: "pointer", fontSize: 16 }}>×</button>
              </div>
              <div style={{ padding: "16px 20px", overflow: "auto", fontSize: 13, color: "#555", lineHeight: 1.7 }}>
                <p style={{ marginBottom: 12 }}>Conforme a lo dispuesto en el artículo 19 N° 4 de la Constitución Política de la República y a las normas pertinentes de la Ley N° 19.628 sobre protección de la vida privada, el tratamiento de datos personales que se realiza en BigTicket se rige por las siguientes reglas:</p>
                <ul style={{ paddingLeft: 20, marginBottom: 12, display: "flex", flexDirection: "column", gap: 8 }}>
                  <li>BigTicket asegura la confidencialidad de los datos personales de los usuarios.</li>
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
          }),
        });
      }catch(e){console.log("N8N onboarding error:",e);}
    }
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

        {campana?.propuesta_cedis?(
          <div style={{background:"#fff",borderRadius:16,border:"0.5px solid #e4e7ec",marginBottom:16,overflow:"hidden"}}>
            {/* Header */}
            <div style={{background:"#1a3a6b",padding:"20px 24px"}}>
              <div style={{color:"#F47B20",fontSize:11,fontWeight:700,letterSpacing:1,textTransform:"uppercase",marginBottom:4}}>Propuesta Económica</div>
              <div style={{color:"#fff",fontSize:20,fontWeight:800}}>{campana.propuesta_cliente||campana.nombre}</div>
              <div style={{color:"#aac3e8",fontSize:12,marginTop:2}}>Última Milla — Condiciones Generales y Específicas de Servicio</div>
            </div>
            {/* Contenido scrolleable */}
            <div style={{padding:"20px 24px",overflowY:"auto"}}>
              {/* Condiciones generales */}
              <div style={{marginBottom:20}}>
                <div style={{fontSize:14,fontWeight:700,color:"#1a3a6b",marginBottom:10,paddingBottom:6,borderBottom:"2px solid #F47B20"}}>Condiciones Generales de la Operación</div>
                {[["📍 Lugar de presentación (CEDIS)",campana.propuesta_cedis],["🕐 Horario de presentación",campana.propuesta_horario],["📦 Entregas estimadas por unidad",campana.propuesta_entregas],["🔄 Devolución de mercancía no entregada",campana.propuesta_devolucion]].map(([l,v])=>v&&(
                  <div key={l} style={{display:"flex",gap:12,padding:"8px 0",borderBottom:"1px solid #f4f5f7",flexWrap:"wrap"}}>
                    <span style={{fontSize:12,color:"#888",minWidth:200,flexShrink:0}}>{l}</span>
                    <span style={{fontSize:12,color:"#1a1a1a",fontWeight:600}}>{v}</span>
                  </div>
                ))}
              </div>
              {/* Tarifas */}
              {campana.propuesta_tarifas?.length>0&&(
                <div style={{marginBottom:20}}>
                  <div style={{fontSize:14,fontWeight:700,color:"#1a3a6b",marginBottom:10,paddingBottom:6,borderBottom:"2px solid #F47B20"}}>Tarifa del Servicio por Jornada</div>
                  <div style={{overflowX:"auto",marginBottom:8}}>
                    <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                      <thead>
                        <tr style={{background:"#1a3a6b",color:"#fff"}}>
                          {["Categoría","Zonif.","0-100 km","101-150","151-200","201-250","251+"].map(h=>(
                            <th key={h} style={{padding:"8px 10px",textAlign:"left",fontWeight:600,whiteSpace:"nowrap"}}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {campana.propuesta_tarifas.map((t,i)=>(
                          <tr key={i} style={{background:i%2===0?"#f8f9fa":"#fff"}}>
                            <td style={{padding:"8px 10px",fontWeight:700,color:"#1a3a6b"}}>{t.categoria}</td>
                            <td style={{padding:"8px 10px",color:"#555"}}>L3</td>
                            {["0-100","101-150","151-200","201-250","251+"].map(k=>(
                              <td key={k} style={{padding:"8px 10px",fontWeight:600}}>
                                {t.tramos?.[k]?`$ ${t.tramos[k]}`:"—"}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div style={{fontSize:11,color:"#888",fontStyle:"italic"}}>*Todos los valores expresados son netos + IVA.</div>
                  {campana.propuesta_auxiliar&&<div style={{fontSize:12,color:"#555",marginTop:6}}>💼 Tarifa auxiliar diario: <strong>{campana.propuesta_auxiliar}</strong></div>}
                </div>
              )}
              {/* Nivel de servicio */}
              <div style={{marginBottom:20}}>
                <div style={{fontSize:14,fontWeight:700,color:"#1a3a6b",marginBottom:10,paddingBottom:6,borderBottom:"2px solid #F47B20"}}>Nivel de Servicio</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
                  <div style={{background:"#eef2ff",borderRadius:8,padding:"10px 14px"}}>
                    <div style={{fontSize:10,color:"#888",fontWeight:700,marginBottom:2}}>CUMPLIMIENTO MÍNIMO</div>
                    <div style={{fontSize:18,fontWeight:800,color:"#1a3a6b"}}>{campana.propuesta_ns_minimo||"99.00%"}</div>
                    <div style={{fontSize:11,color:"#555"}}>efectividad de entregas</div>
                  </div>
                  <div style={{background:"#dcfce7",borderRadius:8,padding:"10px 14px"}}>
                    <div style={{fontSize:10,color:"#166534",fontWeight:700,marginBottom:2}}>NIVEL EXCELENTE 🏆</div>
                    <div style={{fontSize:18,fontWeight:800,color:"#166534"}}>{campana.propuesta_ns_excelente||"99.50%-100%"}</div>
                    <div style={{fontSize:11,color:"#166534"}}>Premio: {campana.propuesta_ns_premio||"5% sobre tarifa diaria"}</div>
                  </div>
                </div>
                <div style={{background:"#fff3e0",borderRadius:8,padding:"10px 14px",border:"1px solid #fde8cc"}}>
                  <div style={{fontSize:11,fontWeight:700,color:"#e65100",marginBottom:2}}>⚠️ Castigo por bajo desempeño</div>
                  <div style={{fontSize:12,color:"#555"}}>{campana.propuesta_ns_castigo||"3% sobre tarifa base"} — rutas con menos del 99.5% de domicilios visitados o nivel de servicio inferior al 95%</div>
                </div>
              </div>
              {/* Pagos */}
              <div style={{marginBottom:20}}>
                <div style={{fontSize:14,fontWeight:700,color:"#1a3a6b",marginBottom:10,paddingBottom:6,borderBottom:"2px solid #F47B20"}}>Condiciones de Pago</div>
                <div style={{fontSize:12,color:"#555",lineHeight:2}}>
                  <div>✅ Pago <strong>semanal</strong> — cada <strong>viernes</strong>, por la semana inmediata anterior</div>
                  <div>✅ Transferencia bancaria en MXN, previa emisión de <strong>CFDI</strong></div>
                  <div>✅ No se otorgan anticipos ni pagos en efectivo</div>
                  {campana.propuesta_semana_retenida&&<div>⚠️ Se retiene una semana al inicio como garantía operativa</div>}
                  <div>📋 Vigencia del contrato: <strong>{campana.propuesta_vigencia||"12 meses"}</strong></div>
                </div>
              </div>
              {/* Requisitos */}
              {campana.propuesta_requisitos&&(
                <div style={{marginBottom:20}}>
                  <div style={{fontSize:14,fontWeight:700,color:"#1a3a6b",marginBottom:10,paddingBottom:6,borderBottom:"2px solid #F47B20"}}>Requisitos del Prestador</div>
                  <div style={{fontSize:12,color:"#555",lineHeight:2}}>
                    {campana.propuesta_requisitos.split("\n").filter(Boolean).map((r,i)=>(
                      <div key={i}>✓ {r}</div>
                    ))}
                  </div>
                </div>
              )}
              {/* Notas */}
              {campana.propuesta_notas&&(
                <div style={{background:"#f0f9ff",borderRadius:10,padding:"12px 16px",border:"1px solid #bae6fd"}}>
                  <div style={{fontSize:12,fontWeight:700,color:"#0369a1",marginBottom:4}}>📌 Nota adicional</div>
                  <div style={{fontSize:12,color:"#555"}}>{campana.propuesta_notas}</div>
                </div>
              )}
            </div>
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
