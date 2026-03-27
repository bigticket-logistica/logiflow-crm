import { useState, useEffect, useRef } from "react";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ─── CONFIGURACIÓN SUPABASE ───────────────────────────────────────────────────
const SUPABASE_URL = "https://psvdtgjvognbmxfvqbaa.supabase.co";
const SUPABASE_KEY = "sb_publishable_RayW0wqgesNI6FYZ6i0CFQ_6YHaHELP";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// wrapper compatible con el código existente
const sb = {
  from: (table) => ({
    select: async (cols="*", opts={}) => {
      let q = supabase.from(table).select(cols);
      if (opts.order) { const parts=opts.order.split("."); q=q.order(parts[0],{ascending:parts[1]==="asc"}); }
      if (opts.filter) { const m=opts.filter.match(/^(\w+)=eq\.(.+)$/); if(m) q=q.eq(m[1],m[2]); }
      const {data,error}=await q; if(error) throw error; return data||[];
    },
    update: async (data, filter) => {
      const m=filter.match(/^(\w+)=eq\.(.+)$/);
      const {data:r,error}=await supabase.from(table).update(data).eq(m[1],m[2]).select();
      if(error) throw error; return r;
    },
    insert: async (data) => {
      const {data:r,error}=await supabase.from(table).insert(data).select();
      if(error) throw error; return r;
    },
    delete: async (filter) => {
      const m=filter.match(/^(\w+)=eq\.(.+)$/);
      const {error}=await supabase.from(table).delete().eq(m[1],m[2]);
      if(error) throw error; return true;
    },
  }),
};

// ─── CONSTANTES ───────────────────────────────────────────────────────────────
const ETAPAS_PIPELINE = ["Nuevo Lead","Propuesta Enviada","Propuesta Aceptada","Propuesta Rechazada","Entrevistas y Validaciones"];
const ETAPAS_CIERRE   = ["Postulante Aprobado","Postulante No Calificado"];
const ETAPAS_TODAS    = [...ETAPAS_PIPELINE, ...ETAPAS_CIERRE];
const ETAPAS_BASE_DATOS = ["Base Datos Leads"]; // leads tibios y fríos

const ETAPA_CFG = {
  "Nuevo Lead":          { color:"#3B82F6", icon:"🎯" },
  "Propuesta Enviada":   { color:"#F97316", icon:"📄" },
  "Propuesta Aceptada":  { color:"#10B981", icon:"✅" },
  "Propuesta Rechazada": { color:"#EF4444", icon:"❌" },
  "Entrevistas y Validaciones": { color:"#8B5CF6", icon:"🎤" },
  "Postulante Aprobado":  { color:"#059669", icon:"🏆" },
  "Postulante No Calificado": { color:"#DC2626", icon:"🚫" },
  "Base Datos Leads":    { color:"#8B5CF6", icon:"🗄️" },
};

const CANAL_CFG = {
  whatsapp:   { color:"#25D366", icon:"💬", label:"WhatsApp" },
  email:      { color:"#EA4335", icon:"📧", label:"Email" },
  facebook:   { color:"#1877F2", icon:"📘", label:"Facebook" },
  instagram:  { color:"#E1306C", icon:"📸", label:"Instagram" },
  linkedin:   { color:"#0A66C2", icon:"💼", label:"LinkedIn" },
  referido:   { color:"#F97316", icon:"🤝", label:"Referido" },
  formulario: { color:"#8B5CF6", icon:"📝", label:"Formulario" },
};

const CANALES_PLANTILLA = ["WhatsApp","Email","Facebook","Instagram","Todos"];

const getCanalCfg = (canal) => {
  if (!canal) return { color:"#888888", icon:"•", label:"Desconocido" };
  return CANAL_CFG[canal.toLowerCase()] || { color:"#888888", icon:"•", label:canal };
};

const getScoreColor = (s) => s>=80?"#10B981":s>=60?"#F59E0B":s>=40?"#F97316":"#EF4444";

const formatFecha = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  const now = new Date();
  const esHoy = d.toDateString() === now.toDateString();
  const ayer = new Date(now); ayer.setDate(now.getDate()-1);
  const esAyer = d.toDateString() === ayer.toDateString();
  const hora = d.toLocaleTimeString("es-CL",{hour:"2-digit",minute:"2-digit"});
  if (esHoy)  return `Hoy ${hora}`;
  if (esAyer) return `Ayer ${hora}`;
  return `${d.toLocaleDateString("es-CL",{day:"2-digit",month:"short"})} ${hora}`;
};

const diasEntre = (a,b) => (!a||!b)?null:Math.round(Math.abs(new Date(b)-new Date(a))/86400000);

// ─── COMPONENTES BASE ─────────────────────────────────────────────────────────
const ScoreDot = ({ score }) => {
  const c=getScoreColor(score||0), s=Math.min(score||0,100);
  return (
    <svg width={36} height={36} viewBox="0 0 36 36" style={{flexShrink:0}}>
      <circle cx={18} cy={18} r={15} fill="none" stroke="#f0f2f5" strokeWidth={3}/>
      <circle cx={18} cy={18} r={15} fill="none" stroke={c} strokeWidth={3}
        strokeDasharray={`${s*0.942} 94.2`} strokeLinecap="round"
        transform="rotate(-90 18 18)" style={{transition:"stroke-dasharray .6s ease"}}/>
      <text x={18} y={22} textAnchor="middle" fontSize={9} fill={c} fontWeight={700}>{s}</text>
    </svg>
  );
};

const Tag = ({ label, color }) => (
  <span style={{fontSize:10,fontWeight:700,padding:"2px 7px",borderRadius:20,
    background:color+"22",color,border:`1px solid ${color}44`,letterSpacing:.5}}>{label}</span>
);

const PAIS_CFG = {
  "Chile":  { bandera:"https://flagcdn.com/w40/cl.png", color:"#c0392b" },
  "México": { bandera:"https://flagcdn.com/w40/mx.png", color:"#27ae60" },
};

const CanalTag = ({ canal }) => { const cfg=getCanalCfg(canal); return <Tag label={`${cfg.icon} ${cfg.label}`} color={cfg.color}/>; };

const PaisFlag = ({ pais }) => {
  if(!pais) return null;
  const cfg=PAIS_CFG[pais];
  if(!cfg) return <span style={{fontSize:11,color:"#888"}}>{pais}</span>;
  return <img src={cfg.bandera} alt={pais} title={pais} style={{width:20,height:14,objectFit:"cover",borderRadius:2,display:"inline-block"}}/>;
};

const Spinner = () => (
  <div style={{display:"flex",alignItems:"center",justifyContent:"center",padding:60}}>
    <div style={{width:32,height:32,border:"3px solid #e4e7ec",borderTopColor:"#1a3a6b",borderRadius:"50%",animation:"spin 1s linear infinite"}}/>
  </div>
);

const Modal = ({ title, onClose, children }) => (
  <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200}}>
    <div style={{background:"#ffffff",border:"1px solid #e4e7ec",borderRadius:14,padding:28,width:560,maxHeight:"90vh",overflow:"auto"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <div style={{fontSize:16,fontWeight:900,color:"#1a1a1a",fontFamily:"'Outfit',sans-serif"}}>{title}</div>
        <button onClick={onClose} style={{background:"#eef2ff",border:"1px solid #dbeafe",color:"#666666",borderRadius:8,width:32,height:32,cursor:"pointer",fontSize:18,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
      </div>
      {children}
    </div>
  </div>
);

const Btn = ({ children, onClick, color="#3B82F6", outline=false, small=false }) => (
  <button onClick={onClick} style={{
    background:outline?"transparent":color, color:outline?color:"white",
    border:`1px solid ${color}`, borderRadius:8,
    padding:small?"5px 12px":"9px 18px", fontSize:small?11:12,
    cursor:"pointer", fontWeight:700, fontFamily:"'Outfit',sans-serif", transition:"all .2s"
  }}>{children}</button>
);

const Input = ({ value, onChange, placeholder, type="text", style={} }) => (
  <input type={type} value={value} onChange={onChange} placeholder={placeholder}
    style={{width:"100%",background:"#f0f2f5",color:"#1a1a1a",border:"1px solid #e4e7ec",
      borderRadius:8,padding:"9px 12px",fontSize:12,...style}}/>
);

const Textarea = ({ value, onChange, placeholder, rows=4 }) => (
  <textarea value={value} onChange={onChange} placeholder={placeholder} rows={rows}
    style={{width:"100%",background:"#f0f2f5",color:"#1a1a1a",border:"1px solid #e4e7ec",
      borderRadius:8,padding:"9px 12px",fontSize:12,resize:"vertical"}}/>
);

const Select = ({ value, onChange, children, style={} }) => (
  <select value={value} onChange={onChange}
    style={{width:"100%",background:"#f0f2f5",color:"#1a1a1a",border:"1px solid #e4e7ec",
      borderRadius:8,padding:"9px 12px",fontSize:12,cursor:"pointer",...style}}>
    {children}
  </select>
);

const Label = ({ children }) => (
  <div style={{fontSize:9,color:"#555555",fontWeight:800,letterSpacing:1,
    textTransform:"uppercase",marginBottom:6}}>{children}</div>
);

// ─── SECCIÓN: PLANTILLAS ──────────────────────────────────────────────────────
const PlantillasView = () => {
  const [plantillas, setPlantillas] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [modal, setModal]           = useState(false);
  const [editando, setEditando]     = useState(null);
  const [filtroCanal, setFiltroCanal] = useState("Todos");
  const [form, setForm] = useState({ nombre:"", canal:"WhatsApp", asunto:"", contenido:"", activa:true });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);

  const fetchPlantillas = async () => {
    setLoading(true);
    const data = await sb.from("plantillas").select("*", { order:"created_at.asc" });
    if (Array.isArray(data)) setPlantillas(data);
    setLoading(false);
  };

  useEffect(() => { fetchPlantillas(); }, []);

  const abrirNueva = () => {
    setEditando(null);
    setForm({ nombre:"", canal:"WhatsApp", asunto:"", contenido:"", activa:true });
    setModal(true);
  };

  const abrirEditar = (p) => {
    setEditando(p);
    setForm({ nombre:p.nombre, canal:p.canal, asunto:p.asunto||"", contenido:p.contenido, activa:p.activa });
    setModal(true);
  };

  const guardar = async () => {
    if (!form.nombre.trim() || !form.contenido.trim()) return;
    setSaving(true);
    try {
      if (editando) {
        await sb.from("plantillas").update({ ...form, updated_at: new Date().toISOString() }, `id=eq.${editando.id}`);
      } else {
        await sb.from("plantillas").insert({ ...form });
      }
      await fetchPlantillas();
      setModal(false);
      setSaved(true); setTimeout(()=>setSaved(false), 2000);
    } finally { setSaving(false); }
  };

  const eliminar = async (id) => {
    if (!confirm("¿Eliminar esta plantilla?")) return;
    await sb.from("plantillas").delete(`id=eq.${id}`);
    await fetchPlantillas();
  };

  const toggleActiva = async (p) => {
    await sb.from("plantillas").update({ activa:!p.activa }, `id=eq.${p.id}`);
    await fetchPlantillas();
  };

  const filtradas = filtroCanal==="Todos" ? plantillas : plantillas.filter(p=>p.canal===filtroCanal);

  const VARS = ["{nombre}","{empresa}","{telefono}","{zona}","{volumen}"];

  const canalColor = (c) => {
    const map = { WhatsApp:"#25D366", Email:"#EA4335", Facebook:"#1877F2", Instagram:"#E1306C", Todos:"#64748b" };
    return map[c] || "#64748b";
  };

  return (
    <div style={{display:"flex",flexDirection:"column",gap:16}}>

      {/* Header */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div>
          <div style={{fontSize:16,fontWeight:800,color:"#1a1a1a",fontFamily:"'Outfit',sans-serif"}}>
            Plantillas de Mensajes
          </div>
          <div style={{fontSize:11,color:"#555555",marginTop:2}}>
            Crea y gestiona plantillas para cada canal · Las variables se reemplazan automáticamente
          </div>
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          {saved && <span style={{fontSize:11,color:"#10B981"}}>✓ Guardado</span>}
          <Btn onClick={abrirNueva}>+ Nueva plantilla</Btn>
        </div>
      </div>

      {/* Filtro canal */}
      <div style={{display:"flex",gap:8}}>
        {CANALES_PLANTILLA.map(c=>(
          <button key={c} onClick={()=>setFiltroCanal(c)}
            style={{padding:"6px 14px",borderRadius:20,border:`1px solid ${filtroCanal===c?canalColor(c):"#e4e7ec"}`,
              background:filtroCanal===c?canalColor(c)+"22":"none",
              color:filtroCanal===c?canalColor(c):"#475569",
              cursor:"pointer",fontSize:11,fontWeight:700,transition:"all .2s"}}>
            {c}
          </button>
        ))}
      </div>

      {/* Lista plantillas */}
      {loading ? <Spinner/> : (
        <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:12}}>
          {filtradas.map(p=>{
            const color=canalColor(p.canal);
            return (
              <div key={p.id} style={{background:"#ffffff",border:`1px solid ${p.activa?color+"33":"#f4f5f7"}`,
                borderRadius:12,padding:16,opacity:p.activa?1:.6,transition:"all .2s"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
                  <div>
                    <div style={{fontSize:13,fontWeight:800,color:"#1a1a1a"}}>{p.nombre}</div>
                    <div style={{marginTop:4}}>
                      <Tag label={p.canal} color={color}/>
                    </div>
                  </div>
                  <div style={{display:"flex",gap:6,alignItems:"center"}}>
                    <button onClick={()=>toggleActiva(p)}
                      style={{background:p.activa?"#10B98122":"#f4f5f7",color:p.activa?"#10B981":"#475569",
                        border:`1px solid ${p.activa?"#10B98144":"#aaaaaa"}`,borderRadius:6,
                        padding:"3px 10px",fontSize:10,cursor:"pointer",fontWeight:700}}>
                      {p.activa?"Activa":"Inactiva"}
                    </button>
                  </div>
                </div>

                {p.asunto && (
                  <div style={{fontSize:11,color:"#555555",marginBottom:6}}>
                    <span style={{color:"#aaaaaa"}}>Asunto: </span>{p.asunto}
                  </div>
                )}

                <div style={{background:"#f0f2f5",borderRadius:8,padding:10,marginBottom:10,
                  fontSize:12,color:"#666666",lineHeight:1.6,
                  maxHeight:80,overflow:"hidden",textOverflow:"ellipsis"}}>
                  {p.contenido}
                </div>

                <div style={{display:"flex",gap:8}}>
                  <Btn onClick={()=>abrirEditar(p)} outline small>✏️ Editar</Btn>
                  <Btn onClick={()=>eliminar(p.id)} color="#EF4444" outline small>🗑 Eliminar</Btn>
                </div>
              </div>
            );
          })}

          {filtradas.length===0 && (
            <div style={{gridColumn:"1/-1",textAlign:"center",padding:40,color:"#aaaaaa",fontSize:13}}>
              No hay plantillas para este canal · Haz clic en "+ Nueva plantilla" para crear una
            </div>
          )}
        </div>
      )}

      {/* Variables disponibles */}
      <div style={{background:"#ffffff",border:"1px solid #e4e7ec",borderRadius:12,padding:14}}>
        <div style={{fontSize:10,fontWeight:800,color:"#555555",letterSpacing:1,marginBottom:8,textTransform:"uppercase"}}>
          Variables disponibles en plantillas
        </div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          {VARS.map(v=>(
            <span key={v} style={{background:"#f4f5f7",color:"#3B82F6",border:"1px solid #3B82F633",
              borderRadius:6,padding:"3px 10px",fontSize:11,fontFamily:"monospace"}}>{v}</span>
          ))}
        </div>
        <div style={{fontSize:10,color:"#aaaaaa",marginTop:6}}>
          Estas variables se reemplazan automáticamente con los datos del lead al enviar
        </div>
      </div>

      {/* Modal crear/editar */}
      {modal && (
        <Modal title={editando?"✏️ Editar plantilla":"➕ Nueva plantilla"} onClose={()=>setModal(false)}>
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            <div>
              <Label>Nombre de la plantilla</Label>
              <Input value={form.nombre} onChange={e=>setForm(p=>({...p,nombre:e.target.value}))}
                placeholder="Ej: Bienvenida WhatsApp"/>
            </div>

            <div>
              <Label>Canal</Label>
              <Select value={form.canal} onChange={e=>setForm(p=>({...p,canal:e.target.value}))}>
                {["WhatsApp","Email","Facebook","Instagram","Todos"].map(c=><option key={c}>{c}</option>)}
              </Select>
            </div>

            {form.canal==="Email" && (
              <div>
                <Label>Asunto del correo</Label>
                <Input value={form.asunto} onChange={e=>setForm(p=>({...p,asunto:e.target.value}))}
                  placeholder="Ej: Propuesta LogiFlow para {empresa}"/>
              </div>
            )}

            <div>
              <Label>Contenido del mensaje</Label>
              <Textarea value={form.contenido} onChange={e=>setForm(p=>({...p,contenido:e.target.value}))}
                placeholder={`Ej: Hola {nombre}! 👋 Somos LogiFlow...\n\nPuedes usar: ${VARS.join(", ")}`}
                rows={6}/>
              <div style={{display:"flex",gap:6,marginTop:6,flexWrap:"wrap"}}>
                {VARS.map(v=>(
                  <button key={v} onClick={()=>setForm(p=>({...p,contenido:p.contenido+v}))}
                    style={{background:"#f4f5f7",color:"#3B82F6",border:"1px solid #3B82F633",
                      borderRadius:6,padding:"3px 8px",fontSize:10,cursor:"pointer",fontFamily:"monospace"}}>
                    +{v}
                  </button>
                ))}
              </div>
            </div>

            <div style={{display:"flex",gap:8,marginTop:4}}>
              <Btn onClick={()=>setModal(false)} color="#475569" outline>Cancelar</Btn>
              <button onClick={guardar} disabled={saving}
                style={{flex:1,background:"#3B82F6",color:"white",border:"none",borderRadius:8,
                  padding:"10px",fontSize:12,cursor:"pointer",fontWeight:800,
                  fontFamily:"'Outfit',sans-serif",opacity:saving?.7:1}}>
                {saving?"Guardando...":editando?"💾 Guardar cambios":"✅ Crear plantilla"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

// ─── SECCIÓN: CONFIG SCORE ────────────────────────────────────────────────────
const ConfigScoreView = () => {
  const [dimensiones, setDimensiones]   = useState([]);
  const [loading, setLoading]           = useState(true);
  const [modalDim, setModalDim]         = useState(false);
  const [modalRegla, setModalRegla]     = useState(null);
  const [editandoDim, setEditandoDim]   = useState(null);
  const [formDim, setFormDim]           = useState({ nombre:"", dimension:"", descripcion:"" });
  const [formRegla, setFormRegla]       = useState({ etiqueta:"", palabras_clave:"", puntos:0 });
  const [editandoReglaIdx, setEditandoReglaIdx] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);

  const fetchDimensiones = async () => {
    setLoading(true);
    const data = await sb.from("config_score").select("*", { order:"orden.asc" });
    if (Array.isArray(data)) setDimensiones(data);
    setLoading(false);
  };

  useEffect(() => { fetchDimensiones(); }, []);

  const totalPuntos = dimensiones.reduce((total, dim) => {
    if (!dim.activa) return total;
    return total + (dim.reglas||[]).reduce((a,r) => Math.max(a, r.puntos||0), 0);
  }, 0);

  // Guardar dimensión completa
  const guardarReglas = async (dim, nuevasReglas) => {
    setSaving(true);
    try {
      await sb.from("config_score").update({ reglas:nuevasReglas, updated_at:new Date().toISOString() }, `id=eq.${dim.id}`);
      await fetchDimensiones();
      setSaved(true); setTimeout(()=>setSaved(false),2000);
    } finally { setSaving(false); }
  };

  // Toggle activa
  const toggleDim = async (dim) => {
    await sb.from("config_score").update({ activa:!dim.activa }, `id=eq.${dim.id}`);
    await fetchDimensiones();
  };

  // Eliminar dimensión
  const eliminarDim = async (id) => {
    if (!confirm("¿Eliminar esta dimensión del score?")) return;
    await sb.from("config_score").delete(`id=eq.${id}`);
    await fetchDimensiones();
  };

  // Nueva dimensión
  const guardarDim = async () => {
    if (!formDim.nombre.trim()) return;
    setSaving(true);
    try {
      const orden = dimensiones.length + 1;
      if (editandoDim) {
        await sb.from("config_score").update({ nombre:formDim.nombre, descripcion:formDim.descripcion, updated_at:new Date().toISOString() }, `id=eq.${editandoDim.id}`);
      } else {
        await sb.from("config_score").insert({ dimension:formDim.dimension||formDim.nombre.toLowerCase().replace(/\s+/g,"_"), nombre:formDim.nombre, descripcion:formDim.descripcion, orden, reglas:[], activa:true });
      }
      await fetchDimensiones();
      setModalDim(false);
    } finally { setSaving(false); }
  };

  // Reglas
  const abrirRegla = (dim, idx=null) => {
    setModalRegla(dim);
    if (idx!==null) {
      const r = dim.reglas[idx];
      setFormRegla({ etiqueta:r.etiqueta, palabras_clave:(r.palabras_clave||[]).join(", "), puntos:r.puntos });
      setEditandoReglaIdx(idx);
    } else {
      setFormRegla({ etiqueta:"", palabras_clave:"", puntos:0 });
      setEditandoReglaIdx(null);
    }
  };

  const guardarRegla = async () => {
    const nuevaRegla = {
      etiqueta: formRegla.etiqueta,
      palabras_clave: formRegla.palabras_clave.split(",").map(s=>s.trim().toLowerCase()).filter(Boolean),
      puntos: parseInt(formRegla.puntos)||0,
    };
    const reglas = [...(modalRegla.reglas||[])];
    if (editandoReglaIdx!==null) reglas[editandoReglaIdx]=nuevaRegla;
    else reglas.push(nuevaRegla);
    await guardarReglas(modalRegla, reglas);
    setModalRegla(null);
  };

  const eliminarRegla = async (dim, idx) => {
    const reglas = dim.reglas.filter((_,i)=>i!==idx);
    await guardarReglas(dim, reglas);
  };

  return (
    <div style={{display:"flex",flexDirection:"column",gap:16}}>

      {/* Header */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div>
          <div style={{fontSize:16,fontWeight:800,color:"#1a1a1a",fontFamily:"'Outfit',sans-serif"}}>
            Configuración del Score
          </div>
          <div style={{fontSize:11,color:"#555555",marginTop:2}}>
            Ajusta las dimensiones y puntajes · Los cambios aplican en el próximo cálculo de N8N
          </div>
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          {saved && <span style={{fontSize:11,color:"#10B981"}}>✓ Guardado en Supabase</span>}
          <Btn onClick={()=>{ setEditandoDim(null); setFormDim({nombre:"",dimension:"",descripcion:""}); setModalDim(true); }}>
            + Nueva dimensión
          </Btn>
        </div>
      </div>

      {/* Score total estimado */}
      <div style={{background:"linear-gradient(135deg,#1a3a6b,#1a3a6b)",border:"1px solid #e4e7ec",
        borderRadius:12,padding:16,display:"flex",gap:20,alignItems:"center"}}>
        <div>
          <div style={{fontSize:10,fontWeight:800,color:"#555555",letterSpacing:1,textTransform:"uppercase"}}>
            Puntaje máximo posible
          </div>
          <div style={{fontSize:40,fontWeight:900,color:getScoreColor(totalPuntos),fontFamily:"monospace"}}>
            {totalPuntos}
          </div>
        </div>
        <div style={{flex:1}}>
          <div style={{height:8,background:"#f4f5f7",borderRadius:4}}>
            <div style={{height:"100%",width:`${Math.min(totalPuntos,100)}%`,
              background:getScoreColor(totalPuntos),borderRadius:4,transition:"width .8s"}}/>
          </div>
          <div style={{fontSize:10,color:"#555555",marginTop:4}}>
            Umbrales: Lead Frío &lt;40 · Prospecto 41-70 · Candidato 71-85 · Lead Caliente &gt;86
          </div>
        </div>
      </div>

      {/* Dimensiones */}
      {loading ? <Spinner/> : (
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          {dimensiones.map(dim=>{
            const maxPts = (dim.reglas||[]).reduce((a,r)=>Math.max(a,r.puntos||0),0);
            return (
              <div key={dim.id} style={{background:"#ffffff",border:`1px solid ${dim.activa?"#e4e7ec":"#f4f5f7"}`,
                borderRadius:12,overflow:"hidden",opacity:dim.activa?1:.5,transition:"all .2s"}}>

                {/* Header dimensión */}
                <div style={{padding:"12px 16px",display:"flex",justifyContent:"space-between",alignItems:"center",
                  borderBottom:"1px solid #f4f5f7"}}>
                  <div>
                    <div style={{fontSize:13,fontWeight:800,color:"#1a1a1a"}}>{dim.nombre}</div>
                    {dim.descripcion && <div style={{fontSize:11,color:"#555555",marginTop:2}}>{dim.descripcion}</div>}
                  </div>
                  <div style={{display:"flex",gap:8,alignItems:"center"}}>
                    <div style={{textAlign:"center"}}>
                      <div style={{fontSize:18,fontWeight:900,color:getScoreColor(maxPts),fontFamily:"monospace"}}>{maxPts}</div>
                      <div style={{fontSize:8,color:"#aaaaaa"}}>MAX PTS</div>
                    </div>
                    <button onClick={()=>toggleDim(dim)}
                      style={{background:dim.activa?"#10B98122":"#f4f5f7",color:dim.activa?"#10B981":"#475569",
                        border:`1px solid ${dim.activa?"#10B98144":"#aaaaaa"}`,borderRadius:6,
                        padding:"4px 10px",fontSize:10,cursor:"pointer",fontWeight:700}}>
                      {dim.activa?"Activa":"Inactiva"}
                    </button>
                    <Btn onClick={()=>abrirRegla(dim)} color="#3B82F6" outline small>+ Regla</Btn>
                    <Btn onClick={()=>eliminarDim(dim.id)} color="#EF4444" outline small>🗑</Btn>
                  </div>
                </div>

                {/* Reglas */}
                <div style={{padding:12,display:"flex",flexDirection:"column",gap:6}}>
                  {(dim.reglas||[]).map((regla,idx)=>(
                    <div key={idx} style={{display:"flex",alignItems:"center",gap:10,
                      background:"#f0f2f5",borderRadius:8,padding:"8px 12px"}}>
                      <div style={{flex:1}}>
                        <div style={{fontSize:12,color:"#1a1a1a",fontWeight:600}}>{regla.etiqueta}</div>
                        {regla.palabras_clave?.length>0 && (
                          <div style={{display:"flex",gap:4,marginTop:4,flexWrap:"wrap"}}>
                            {regla.palabras_clave.map(k=>(
                              <span key={k} style={{background:"#f4f5f7",color:"#888888",border:"1px solid #aaaaaa",
                                borderRadius:4,padding:"1px 6px",fontSize:9,fontFamily:"monospace"}}>{k}</span>
                            ))}
                          </div>
                        )}
                        {regla.palabras_clave?.length===0 && (
                          <div style={{fontSize:9,color:"#aaaaaa",marginTop:2}}>Sin palabras clave (condición por defecto)</div>
                        )}
                      </div>
                      <div style={{display:"flex",gap:8,alignItems:"center"}}>
                        <div style={{textAlign:"center",minWidth:40}}>
                          <div style={{fontSize:16,fontWeight:900,color:getScoreColor(regla.puntos),fontFamily:"monospace"}}>
                            +{regla.puntos}
                          </div>
                          <div style={{fontSize:8,color:"#aaaaaa"}}>PTS</div>
                        </div>
                        <Btn onClick={()=>abrirRegla(dim,idx)} color="#F59E0B" outline small>✏️</Btn>
                        <Btn onClick={()=>eliminarRegla(dim,idx)} color="#EF4444" outline small>×</Btn>
                      </div>
                    </div>
                  ))}
                  {(dim.reglas||[]).length===0 && (
                    <div style={{textAlign:"center",color:"#aaaaaa",fontSize:11,padding:10}}>
                      Sin reglas · Haz clic en "+ Regla" para agregar
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal nueva dimensión */}
      {modalDim && (
        <Modal title={editandoDim?"Editar dimensión":"Nueva dimensión"} onClose={()=>setModalDim(false)}>
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            <div>
              <Label>Nombre</Label>
              <Input value={formDim.nombre} onChange={e=>setFormDim(p=>({...p,nombre:e.target.value}))}
                placeholder="Ej: Tipo de Vehículo"/>
            </div>
            <div>
              <Label>Descripción (opcional)</Label>
              <Input value={formDim.descripcion} onChange={e=>setFormDim(p=>({...p,descripcion:e.target.value}))}
                placeholder="Ej: Tipo de vehículo que necesita el prospecto"/>
            </div>
            <div style={{display:"flex",gap:8}}>
              <Btn onClick={()=>setModalDim(false)} color="#475569" outline>Cancelar</Btn>
              <button onClick={guardarDim} disabled={saving}
                style={{flex:1,background:"#3B82F6",color:"white",border:"none",borderRadius:8,
                  padding:"10px",fontSize:12,cursor:"pointer",fontWeight:800,
                  fontFamily:"'Outfit',sans-serif"}}>
                {saving?"Guardando...":"✅ Crear dimensión"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal nueva/editar regla */}
      {modalRegla && (
        <Modal title={editandoReglaIdx!==null?"Editar regla":"Nueva regla"} onClose={()=>setModalRegla(null)}>
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            <div style={{background:"#f0f2f5",borderRadius:8,padding:10,fontSize:11,color:"#555555"}}>
              Dimensión: <span style={{color:"#1a1a1a",fontWeight:700}}>{modalRegla.nombre}</span>
            </div>
            <div>
              <Label>Etiqueta de la regla</Label>
              <Input value={formRegla.etiqueta} onChange={e=>setFormRegla(p=>({...p,etiqueta:e.target.value}))}
                placeholder="Ej: Zona principal"/>
            </div>
            <div>
              <Label>Palabras clave (separadas por coma)</Label>
              <Input value={formRegla.palabras_clave} onChange={e=>setFormRegla(p=>({...p,palabras_clave:e.target.value}))}
                placeholder="Ej: santiago, providencia, las condes"/>
              <div style={{fontSize:9,color:"#aaaaaa",marginTop:4}}>
                Déjalo vacío para que sea la condición por defecto (cuando no coincide ninguna otra)
              </div>
            </div>
            <div>
              <Label>Puntos a otorgar</Label>
              <Input value={formRegla.puntos} onChange={e=>setFormRegla(p=>({...p,puntos:e.target.value}))}
                type="number" placeholder="Ej: 15"/>
            </div>
            <div style={{display:"flex",gap:8}}>
              <Btn onClick={()=>setModalRegla(null)} color="#475569" outline>Cancelar</Btn>
              <button onClick={guardarRegla} disabled={saving}
                style={{flex:1,background:"#3B82F6",color:"white",border:"none",borderRadius:8,
                  padding:"10px",fontSize:12,cursor:"pointer",fontWeight:800,
                  fontFamily:"'Outfit',sans-serif"}}>
                {saving?"Guardando...":"✅ Guardar regla"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

// ─── LEAD CARD ────────────────────────────────────────────────────────────────
const LeadCard = ({ lead, onSelect, onDragStart }) => {
  const cfg=ETAPA_CFG[lead.etapa]||{color:"#888888"};
  return (
    <div draggable onDragStart={(e)=>onDragStart(e,lead)} onClick={()=>onSelect(lead)}
      style={{background:"#ffffff",border:"1px solid #e4e7ec",borderRadius:10,
        padding:12,cursor:"grab",transition:"all .2s",userSelect:"none"}}
      onMouseEnter={e=>{e.currentTarget.style.borderColor=cfg.color;e.currentTarget.style.transform="translateY(-2px)";}}
      onMouseLeave={e=>{e.currentTarget.style.borderColor="#e4e7ec";e.currentTarget.style.transform="translateY(0)";}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:7}}>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:12,fontWeight:700,color:"#1a1a1a",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{lead.nombre||"Sin nombre"}</div>
          <div style={{fontSize:10,color:"#555555",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{lead.empresa||"Sin empresa"}</div>
        </div>
        <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:3}}>
          <ScoreDot score={lead.score}/>
          {lead.pais&&<PaisFlag pais={lead.pais}/>}
        </div>
      </div>
      <div style={{marginBottom:6}}><CanalTag canal={lead.canal}/></div>
      {lead.volumen&&<div style={{fontSize:10,color:"#555555"}}>📦 {lead.volumen}</div>}
      <div style={{fontSize:10,color:"#aaaaaa",marginTop:3}}>⏱ {formatFecha(lead.updated_at)}</div>
      {lead.clasificacion&&(
        <div style={{marginTop:6}}>
          <Tag label={`${lead.emoji||""} ${lead.clasificacion}`}
            color={lead.clasificacion?.includes("Caliente")?"#EF4444":lead.clasificacion?.includes("Candidato")?"#F59E0B":"#F97316"}/>
        </div>
      )}
    </div>
  );
};

const KanbanCol = ({ etapa, leads, onSelect, onDragStart, onDrop, isDragOver, setDragOver }) => {
  const cfg=ETAPA_CFG[etapa]||{color:"#888888",icon:"•"};
  return (
    <div style={{width:ETAPAS_CIERRE.includes(etapa)?280:etapa==="Nuevo Lead"?160:245,flexShrink:0,display:"flex",flexDirection:"column",height:"100%"}}
      onDragOver={e=>{e.preventDefault();setDragOver(etapa);}}
      onDragLeave={()=>setDragOver(null)}
      onDrop={e=>{onDrop(e,etapa);setDragOver(null);}}>
      <div style={{padding:"8px 12px",background:"#ffffff",borderRadius:"10px 10px 0 0",flexShrink:0,
        borderBottom:`2px solid ${isDragOver?cfg.color:"#888888"}`,
        display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <span style={{fontSize:10,fontWeight:800,color:isDragOver?cfg.color:"#888888",textTransform:"uppercase",letterSpacing:1}}>{cfg.icon} {etapa}</span>
        <span style={{fontSize:10,fontWeight:800,background:cfg.color+"22",color:cfg.color,padding:"2px 8px",borderRadius:20}}>{leads.length}</span>
      </div>
      <div style={{flex:1,overflowY:"auto",background:isDragOver?cfg.color+"08":"#f0f2f5",borderRadius:"0 0 10px 10px",
        padding:8,display:"flex",flexDirection:"column",gap:7,minHeight:120,
        border:isDragOver?`1px dashed ${cfg.color}44`:"1px solid transparent"}}>
        {leads.map(lead=><LeadCard key={lead.id} lead={lead} onSelect={onSelect} onDragStart={onDragStart}/>)}
        {leads.length===0&&(
          <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",
            color:isDragOver?cfg.color:"#888888",fontSize:12,minHeight:80}}>
            {isDragOver?"Soltar aquí":"Sin leads"}
          </div>
        )}
      </div>
    </div>
  );
};

const Pipeline = ({ leads, onSelect, onEtapaChange }) => {
  const [dragLead,setDragLead]=useState(null);
  const [dragOver,setDragOver]=useState(null);
  const handleDragStart=(e,lead)=>{setDragLead(lead);e.dataTransfer.effectAllowed="move";};
  const handleDrop=async(e,nuevaEtapa)=>{e.preventDefault();if(!dragLead||dragLead.etapa===nuevaEtapa)return;await onEtapaChange(dragLead,nuevaEtapa);setDragLead(null);};
  const normalizarEtapa=(e)=>{
    if(!e) return "Nuevo Lead";
    const mapa={"nuevo lead":"Nuevo Lead","nuevo":"Nuevo Lead","new":"Nuevo Lead","postulante":"Nuevo Lead","contactado":"Base Datos Leads","reunión agendada":"Base Datos Leads","reunion agendada":"Base Datos Leads","negociación":"Base Datos Leads","negociacion":"Base Datos Leads","propuesta enviada":"Propuesta Enviada","propuesta aceptada":"Propuesta Aceptada","propuesta rechazada":"Propuesta Rechazada","contrato firmado":"Postulante Aprobado","contrato no firmado":"Postulante No Calificado","ganado":"Postulante Aprobado","perdido":"Postulante No Calificado","postulante aprobado":"Postulante Aprobado","postulante no calificado":"Postulante No Calificado","entrevistas y validaciones":"Entrevistas y Validaciones","base datos leads":"Base Datos Leads"};
    return mapa[e.toLowerCase().trim()]||e;
  };
  const lpe=(etapa)=>leads.filter(l=>normalizarEtapa(l.etapa)===etapa);
  return (
    <div style={{display:"flex",flexDirection:"column",height:"100%"}}>
      <div style={{fontSize:10,color:"#aaaaaa",textAlign:"center",padding:"4px 0 8px",flexShrink:0}}>
        💡 Arrastra tarjetas entre columnas · O haz clic para abrir el detalle
      </div>
      <div style={{flex:1,overflowX:"auto",overflowY:"hidden"}}>
        <div style={{display:"flex",gap:10,minWidth:"fit-content",height:"100%"}}>
          {ETAPAS_PIPELINE.map(e=><KanbanCol key={e} etapa={e} leads={lpe(e)} onSelect={onSelect} onDragStart={handleDragStart} onDrop={handleDrop} isDragOver={dragOver===e} setDragOver={setDragOver}/>)}
          <div style={{width:2,background:"linear-gradient(to bottom,transparent,#aaaaaa,transparent)",borderRadius:4,flexShrink:0,margin:"0 4px"}}/>
          {ETAPAS_CIERRE.map(e=><KanbanCol key={e} etapa={e} leads={lpe(e)} onSelect={onSelect} onDragStart={handleDragStart} onDrop={handleDrop} isDragOver={dragOver===e} setDragOver={setDragOver}/>)}
        </div>
      </div>
    </div>
  );
};

// ─── KPIs ─────────────────────────────────────────────────────────────────────
const KPIsView = ({ leads }) => {
  const [descargando,setDescargando]=useState(false);
  const reporteRef=useRef(null);
  const norm=(e)=>{if(!e)return"Nuevo Lead";const m={"nuevo lead":"Nuevo Lead","nuevo":"Nuevo Lead","new":"Nuevo Lead","postulante":"Nuevo Lead","contactado":"Base Datos Leads","reunión agendada":"Base Datos Leads","reunion agendada":"Base Datos Leads","negociación":"Base Datos Leads","negociacion":"Base Datos Leads","propuesta enviada":"Propuesta Enviada","propuesta aceptada":"Propuesta Aceptada","propuesta rechazada":"Propuesta Rechazada","contrato firmado":"Postulante Aprobado","contrato no firmado":"Postulante No Calificado","ganado":"Postulante Aprobado","perdido":"Postulante No Calificado","postulante aprobado":"Postulante Aprobado","postulante no calificado":"Postulante No Calificado","entrevistas y validaciones":"Entrevistas y Validaciones","base datos leads":"Base Datos Leads"};return m[e.toLowerCase().trim()]||e;};

  const descargarPDF=async()=>{
    if(!reporteRef.current) return;
    setDescargando(true);
    try {
      if(!window.html2canvas){const s=document.createElement("script");s.src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";document.head.appendChild(s);await new Promise(r=>s.onload=r);}
      if(!window.jspdf){const s=document.createElement("script");s.src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";document.head.appendChild(s);await new Promise(r=>s.onload=r);}
      const canvas=await window.html2canvas(reporteRef.current,{scale:2,backgroundColor:"#f0f2f5",useCORS:true});
      const imgData=canvas.toDataURL("image/png");
      const {jsPDF}=window.jspdf;
      const pdf=new jsPDF({orientation:"portrait",unit:"mm",format:"a4"});
      const pdfW=pdf.internal.pageSize.getWidth();
      const pdfH=(canvas.height*pdfW)/canvas.width;
      pdf.addImage(imgData,"PNG",0,0,pdfW,pdfH);
      pdf.save(`BigTicket_KPIs_Generales_${new Date().toLocaleDateString("es-CL").replace(/\//g,"-")}.pdf`);
    } catch(e){alert("Error generando PDF: "+e.message);}
    finally{setDescargando(false);}
  };

  const ganados=leads.filter(l=>norm(l.etapa)==="Postulante Aprobado"),perdidos=leads.filter(l=>norm(l.etapa)==="Postulante No Calificado");
  const cerrados=ganados.length+perdidos.length;
  const tasaCierre=cerrados>0?Math.round((ganados.length/cerrados)*100):0;
  const tiempos=ganados.map(l=>diasEntre(l.created_at,l.updated_at)).filter(d=>d!==null);
  const tiempoPromedio=tiempos.length?Math.round(tiempos.reduce((a,b)=>a+b,0)/tiempos.length):null;
  const canales={};
  leads.forEach(l=>{const c=(l.fuente_contacto||l.canal||"desconocido").toLowerCase();if(!canales[c])canales[c]={total:0,ganados:0};canales[c].total++;if(norm(l.etapa)==="Postulante Aprobado")canales[c].ganados++;});
  const canalStats=Object.entries(canales).map(([canal,d])=>({canal,total:d.total,ganados:d.ganados,eficacia:d.total>0?Math.round((d.ganados/d.total)*100):0})).sort((a,b)=>b.eficacia-a.eficacia);
  const canalEficaz=canalStats[0],canalMenos=canalStats[canalStats.length-1],canalVol=[...canalStats].sort((a,b)=>b.total-a.total)[0];
  const scoreEtapa=ETAPAS_TODAS.map(e=>{const ls=leads.filter(l=>norm(l.etapa)===e);return{etapa:e,score:ls.length?Math.round(ls.reduce((a,l)=>a+(l.score||0),0)/ls.length):0,count:ls.length};}).filter(e=>e.count>0);
  return (
    <div style={{display:"flex",flexDirection:"column",gap:16}} ref={reporteRef}>
      <div style={{display:"flex",justifyContent:"flex-end"}}>
        <button onClick={descargarPDF} disabled={descargando}
          style={{background:"#1a3a6b",color:"white",border:"none",borderRadius:8,padding:"9px 18px",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"'Outfit',sans-serif",opacity:descargando?0.6:1}}>
          {descargando?"Generando...":"⬇ Descargar PDF"}
        </button>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
        {[["✅","Tasa de cierre",`${tasaCierre}%`,"#10B981",`${ganados.length} postulantes aprobados de ${cerrados}`],["⏱","Tiempo promedio",tiempoPromedio!==null?`${tiempoPromedio}d`:"—","#3B82F6","Días lead→Postulante Aprobado"],["📝","Postulantes Aprobados",ganados.length,"#10B981",`${perdidos.length} no calificados`],["🚫","Postulantes No Calificados",perdidos.length,"#EF4444",`${cerrados>0?Math.round((perdidos.length/cerrados)*100):0}% del total cerrado`]].map(([icon,label,val,color,sub])=>(
          <div key={label} style={{background:"#ffffff",border:`1px solid ${color}22`,borderRadius:12,padding:16}}>
            <div style={{fontSize:22}}>{icon}</div>
            <div style={{fontSize:28,fontWeight:900,color,fontFamily:"monospace",marginTop:6}}>{val}</div>
            <div style={{fontSize:11,color:"#555555",fontWeight:700,marginTop:2}}>{label}</div>
            <div style={{fontSize:10,color:"#aaaaaa",marginTop:3}}>{sub}</div>
          </div>
        ))}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12}}>
        {[["🏆","Canal más eficaz",canalEficaz,"#10B981"],["⚠️","Canal menos eficaz",canalMenos,"#EF4444"],["📊","Mayor volumen",canalVol,"#3B82F6"]].map(([icon,label,canal,color])=>{
          if(!canal)return null;
          const cfg=getCanalCfg(canal.canal);
          return(
            <div key={label} style={{background:"#ffffff",border:`1px solid ${color}22`,borderRadius:12,padding:16}}>
              <div style={{fontSize:11,fontWeight:800,color:"#555555",letterSpacing:1,textTransform:"uppercase",marginBottom:8}}>{icon} {label}</div>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
                <span style={{fontSize:24}}>{cfg.icon}</span>
                <div><div style={{fontSize:16,fontWeight:800,color:cfg.color}}>{cfg.label}</div><div style={{fontSize:11,color:"#555555"}}>{canal.total} leads</div></div>
              </div>
              <div style={{display:"flex",gap:16}}>
                <div style={{textAlign:"center"}}><div style={{fontSize:22,fontWeight:900,color,fontFamily:"monospace"}}>{canal.eficacia}%</div><div style={{fontSize:9,color:"#555555"}}>EFICACIA</div></div>
                <div style={{textAlign:"center"}}><div style={{fontSize:22,fontWeight:900,color:"#10B981",fontFamily:"monospace"}}>{canal.ganados}</div><div style={{fontSize:9,color:"#555555"}}>FIRMADOS</div></div>
              </div>
            </div>
          );
        })}
      </div>
      <div style={{background:"#ffffff",border:"1px solid #e4e7ec",borderRadius:12,padding:16}}>
        <div style={{fontSize:10,fontWeight:800,color:"#555555",letterSpacing:2,marginBottom:14,textTransform:"uppercase"}}>Tasa de conversión por canal</div>
        {canalStats.map(({canal,total,ganados:g,eficacia})=>{const cfg=getCanalCfg(canal);return(
          <div key={canal} style={{marginBottom:12}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
              <span style={{fontSize:12,color:"#666666"}}>{cfg.icon} {cfg.label}</span>
              <div style={{display:"flex",gap:12}}><span style={{fontSize:10,color:"#555555"}}>{total} leads · {g} firmados</span><span style={{fontSize:12,fontWeight:800,color:cfg.color}}>{eficacia}%</span></div>
            </div>
            <div style={{height:6,background:"#f4f5f7",borderRadius:4}}><div style={{height:"100%",width:`${eficacia}%`,background:cfg.color,borderRadius:4,transition:"width .8s ease"}}/></div>
          </div>
        );})}
      </div>
      <div style={{background:"#ffffff",border:"1px solid #e4e7ec",borderRadius:12,padding:16}}>
        <div style={{fontSize:10,fontWeight:800,color:"#555555",letterSpacing:2,marginBottom:14,textTransform:"uppercase"}}>Score promedio por etapa</div>
        {scoreEtapa.map(({etapa,score,count})=>{const cfg=ETAPA_CFG[etapa]||{color:"#888888",icon:"•"};return(
          <div key={etapa} style={{display:"flex",alignItems:"center",gap:12,marginBottom:8}}>
            <div style={{width:150,fontSize:11,color:"#888888",flexShrink:0}}>{cfg.icon} {etapa}</div>
            <div style={{flex:1,height:6,background:"#f4f5f7",borderRadius:4}}><div style={{height:"100%",width:`${score}%`,background:getScoreColor(score),borderRadius:4,transition:"width .8s ease"}}/></div>
            <div style={{width:65,display:"flex",justifyContent:"space-between",flexShrink:0}}>
              <span style={{fontSize:12,fontWeight:800,color:getScoreColor(score),fontFamily:"monospace"}}>{score}</span>
              <span style={{fontSize:10,color:"#aaaaaa"}}>({count})</span>
            </div>
          </div>
        );})}
      </div>
    </div>
  );
};

// ─── TIMELINE VIEW ────────────────────────────────────────────────────────────
const TimelineView = ({ lead }) => {
  const [historial,setHistorial]=useState([]);
  const [loading,setLoading]=useState(true);

  useEffect(()=>{
    const fetch=async()=>{
      const data=await sb.from("lead_historial").select("*",{filter:`lead_id=eq.${lead.id}`,order:"created_at.asc"});
      if(Array.isArray(data)) setHistorial(data);
      setLoading(false);
    };
    fetch();
  },[lead.id]);

  const eventos=[
    {icon:"🎯",label:`Captado vía ${lead.fuente_contacto||lead.canal||"desconocido"}`,fecha:lead.created_at,color:"#3B82F6"},
    lead.score>0&&{icon:"⭐",label:`Score calculado: ${lead.score} pts → ${lead.clasificacion||""}`,fecha:lead.created_at,color:getScoreColor(lead.score)},
    ...historial.map(h=>({
      icon:ETAPA_CFG[h.etapa_nueva]?.icon||"📊",
      label:`Cambio de etapa: ${h.etapa_anterior} → ${h.etapa_nueva}`,
      fecha:h.created_at,
      color:ETAPA_CFG[h.etapa_nueva]?.color||"#64748b"
    }))
  ].filter(Boolean).sort((a,b)=>new Date(a.fecha)-new Date(b.fecha));

  return(
    <div style={{display:"flex",flexDirection:"column",gap:0}}>
      <div style={{fontSize:10,fontWeight:800,color:"#555555",letterSpacing:1,marginBottom:12,textTransform:"uppercase"}}>Historia del lead</div>
      {loading?<div style={{color:"#aaaaaa",fontSize:12}}>Cargando historial...</div>:(
        <div style={{position:"relative"}}>
          <div style={{position:"absolute",left:15,top:0,bottom:0,width:2,background:"#e4e7ec"}}/>
          {eventos.map((ev,i)=>(
            <div key={i} style={{display:"flex",gap:14,paddingBottom:16,position:"relative"}}>
              <div style={{width:32,height:32,borderRadius:"50%",background:ev.color+"22",border:`2px solid ${ev.color}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,flexShrink:0,zIndex:1,background:"#ffffff"}}>
                {ev.icon}
              </div>
              <div style={{flex:1,paddingTop:4}}>
                <div style={{fontSize:12,fontWeight:700,color:"#1a1a1a",lineHeight:1.4}}>{ev.label}</div>
                <div style={{fontSize:10,color:"#888888",marginTop:3}}>{formatFecha(ev.fecha)}</div>
              </div>
            </div>
          ))}
          {eventos.length===0&&<div style={{color:"#aaaaaa",fontSize:12,paddingLeft:46}}>Sin movimientos aún</div>}
        </div>
      )}
    </div>
  );
};

// ─── PANEL DETALLE ────────────────────────────────────────────────────────────
const LeadPanel = ({ lead, onClose, onUpdate, onEtapaChangeRequest }) => {
  const [tab,setTab]=useState("info");
  const [etapa,setEtapa]=useState(lead.etapa||"Nuevo Lead");
  const [saving,setSaving]=useState(false);
  const [saved,setSaved]=useState(false);

  useEffect(()=>{ setEtapa(lead.etapa||"Nuevo Lead"); },[lead.etapa]);
  const handleEtapaChange=async(newEtapa)=>{
    const etapaActual=etapa;
    if(etapaActual===newEtapa) return;
    onEtapaChangeRequest&&onEtapaChangeRequest(lead,newEtapa);
  };
  const etapaCfg=ETAPA_CFG[etapa]||{color:"#888888"};
  const scoreColor=getScoreColor(lead.score||0);
  return (
    <div style={{position:"fixed",top:0,right:0,width:480,height:"100vh",background:"#1a3a6b",borderLeft:"1px solid #e4e7ec",display:"flex",flexDirection:"column",zIndex:100,boxShadow:"-30px 0 80px rgba(0,0,0,.7)"}}>
      <div style={{padding:"18px 20px",background:"linear-gradient(135deg,#0f1f3d,#1a3a6b)",borderBottom:"1px solid #e4e7ec",flexShrink:0}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
          <div style={{flex:1}}>
            <div style={{fontSize:18,fontWeight:800,color:"#1a1a1a"}}>{lead.nombre||"Sin nombre"}</div>
            <div style={{fontSize:12,color:"#888888",marginTop:2}}>{lead.cargo?`${lead.cargo} · `:""}{lead.empresa||"Sin empresa"}</div>
            <div style={{display:"flex",gap:6,marginTop:8,flexWrap:"wrap"}}>
              <CanalTag canal={lead.fuente_contacto||lead.canal}/>
              {lead.pais&&<div style={{display:"flex",alignItems:"center",gap:4,background:"#f0f2f5",borderRadius:20,padding:"2px 8px"}}><PaisFlag pais={lead.pais}/><span style={{fontSize:10,fontWeight:700,color:"#555"}}>{lead.pais}</span></div>}
              {lead.clasificacion&&<Tag label={`${lead.emoji||""} ${lead.clasificacion}`} color={lead.clasificacion?.includes("Caliente")?"#EF4444":lead.clasificacion?.includes("Candidato")?"#F59E0B":"#F97316"}/>}
            </div>
          </div>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <ScoreDot score={lead.score}/>
            <button onClick={onClose} style={{background:"#eef2ff",border:"1px solid #dbeafe",color:"#666666",borderRadius:8,width:32,height:32,cursor:"pointer",fontSize:18,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
          </div>
        </div>
        <div style={{marginTop:12,display:"flex",gap:8,alignItems:"center"}}>
          <select value={etapa} onChange={e=>handleEtapaChange(e.target.value)}
            style={{flex:1,background:"#ffffff",color:etapaCfg.color,border:`1px solid ${etapaCfg.color}44`,borderRadius:8,padding:"7px 12px",fontSize:12,cursor:"pointer",fontWeight:600}}>
            {ETAPAS_TODAS.map(e=><option key={e}>{e}</option>)}
          </select>
          {saving&&<span style={{fontSize:10,color:"#3B82F6"}}>Guardando...</span>}
          {saved&&<span style={{fontSize:10,color:"#10B981"}}>✓ Guardado</span>}
        </div>
      </div>
      <div style={{display:"flex",background:"#1a3a6b",borderBottom:"1px solid #e4e7ec",flexShrink:0}}>
        {[["info","📋 Datos"],["score","⭐ Score"],["timeline","🕐 Historial"]].map(([id,label])=>(
          <button key={id} onClick={()=>setTab(id)} style={{flex:1,padding:"10px 0",background:"none",border:"none",borderBottom:tab===id?"2px solid #3B82F6":"2px solid transparent",color:tab===id?"#3B82F6":"#475569",fontSize:11,fontWeight:700,cursor:"pointer",letterSpacing:.5}}>{label}</button>
        ))}
      </div>
      <div style={{flex:1,overflow:"auto",padding:16}}>
        {tab==="info"&&(
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            <div style={{background:"#ffffff",border:"1px solid #e4e7ec",borderRadius:10,padding:14}}>
              <div style={{fontSize:10,fontWeight:800,color:"#555555",letterSpacing:1,marginBottom:10,textTransform:"uppercase"}}>Datos de contacto</div>
              {lead.codigo_postulacion&&(
                <div style={{background:"#f0f9ff",border:"1px solid #bae6fd",borderRadius:8,padding:"10px 14px",marginBottom:10,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div>
                    <div style={{fontSize:9,color:"#0369a1",fontWeight:800,letterSpacing:1,textTransform:"uppercase",marginBottom:2}}>Código postulación</div>
                    <div style={{fontSize:16,fontWeight:900,color:"#0369a1",letterSpacing:2,fontFamily:"monospace"}}>{lead.codigo_postulacion}</div>
                  </div>
                  <button onClick={()=>navigator.clipboard?.writeText(lead.codigo_postulacion)}
                    style={{background:"#e0f2fe",color:"#0369a1",border:"none",borderRadius:6,padding:"5px 10px",fontSize:11,cursor:"pointer",fontWeight:700}}>
                    Copiar
                  </button>
                </div>
              )}
              {[["📞","Teléfono",lead.telefono],["📧","Email",lead.email],["📍","Zona",lead.zona],["📦","Volumen",lead.volumen],["🔗","Canal",lead.fuente_contacto||lead.canal],["📅","Captado",formatFecha(lead.created_at)],["🔄","Actualizado",formatFecha(lead.updated_at)]].filter(([,,v])=>v).map(([icon,k,v])=>(
                <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:"1px solid #f4f5f7"}}>
                  <span style={{fontSize:12,color:"#555555"}}>{icon} {k}</span>
                  <span style={{fontSize:12,color:"#1a1a1a",fontWeight:600}}>{v}</span>
                </div>
              ))}
              {lead.pais&&(
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 0",borderBottom:"1px solid #f4f5f7"}}>
                  <span style={{fontSize:12,color:"#555555"}}>🌎 País</span>
                  <div style={{display:"flex",alignItems:"center",gap:6}}>
                    <PaisFlag pais={lead.pais}/>
                    <span style={{fontSize:12,color:"#1a1a1a",fontWeight:600}}>{lead.pais}</span>
                  </div>
                </div>
              )}
            </div>
            {lead.notas&&<div style={{background:"#ffffff",border:"1px solid #e4e7ec",borderRadius:10,padding:14}}><div style={{fontSize:10,fontWeight:800,color:"#555555",letterSpacing:1,marginBottom:8,textTransform:"uppercase"}}>Notas</div><div style={{fontSize:12,color:"#666666",lineHeight:1.6}}>{lead.notas}</div></div>}
          </div>
        )}
        {tab==="score"&&(
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            <div style={{background:"#ffffff",border:`1px solid ${scoreColor}33`,borderRadius:10,padding:16,textAlign:"center"}}>
              <div style={{fontSize:52,fontWeight:900,color:scoreColor,fontFamily:"monospace"}}>{lead.score||0}</div>
              <div style={{fontSize:12,color:"#888888",marginTop:4}}>Score total / 100</div>
              {lead.clasificacion&&<div style={{marginTop:8}}><Tag label={`${lead.emoji||""} ${lead.clasificacion}`} color={lead.clasificacion?.includes("Caliente")?"#EF4444":lead.clasificacion?.includes("Candidato")?"#F59E0B":"#F97316"}/></div>}
            </div>
            {lead.razones_score&&<div style={{background:"#ffffff",border:"1px solid #e4e7ec",borderRadius:10,padding:14}}>
              <div style={{fontSize:10,fontWeight:800,color:"#555555",letterSpacing:1,marginBottom:10,textTransform:"uppercase"}}>Detalle del score</div>
              {lead.razones_score.split(" | ").map((r,i)=>(
                <div key={i} style={{display:"flex",alignItems:"flex-start",gap:8,padding:"6px 0",borderBottom:"1px solid #f4f5f7"}}>
                  <span style={{color:"#10B981"}}>✓</span><span style={{fontSize:12,color:"#666666"}}>{r}</span>
                </div>
              ))}
            </div>}
          </div>
        )}
        {tab==="timeline"&&<TimelineView lead={lead}/>}
      </div>
    </div>
  );
};

// ─── KPIs POR CAMPAÑA ─────────────────────────────────────────────────────────
const KPIsCampanaView = ({ leads }) => {
  const [campanaFiltro,setCampanaFiltro]=useState("todas");
  const [descargando,setDescargando]=useState(false);
  const reporteRef=useRef(null);
  const norm=(e)=>{if(!e)return"Nuevo Lead";const m={"nuevo lead":"Nuevo Lead","nuevo":"Nuevo Lead","new":"Nuevo Lead","postulante":"Nuevo Lead","contactado":"Base Datos Leads","reunión agendada":"Base Datos Leads","reunion agendada":"Base Datos Leads","negociación":"Base Datos Leads","negociacion":"Base Datos Leads","propuesta enviada":"Propuesta Enviada","propuesta aceptada":"Propuesta Aceptada","propuesta rechazada":"Propuesta Rechazada","contrato firmado":"Postulante Aprobado","contrato no firmado":"Postulante No Calificado","ganado":"Postulante Aprobado","perdido":"Postulante No Calificado","postulante aprobado":"Postulante Aprobado","postulante no calificado":"Postulante No Calificado","entrevistas y validaciones":"Entrevistas y Validaciones","base datos leads":"Base Datos Leads"};return m[e.toLowerCase().trim()]||e;};

  const descargarPDF=async()=>{
    if(!reporteRef.current) return;
    setDescargando(true);
    try {
      const script=document.createElement("script");
      script.src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";
      document.head.appendChild(script);
      await new Promise(r=>script.onload=r);
      const script2=document.createElement("script");
      script2.src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
      document.head.appendChild(script2);
      await new Promise(r=>script2.onload=r);
      const canvas=await window.html2canvas(reporteRef.current,{scale:2,backgroundColor:"#f0f2f5",useCORS:true});
      const imgData=canvas.toDataURL("image/png");
      const {jsPDF}=window.jspdf;
      const pdf=new jsPDF({orientation:"portrait",unit:"mm",format:"a4"});
      const pdfW=pdf.internal.pageSize.getWidth();
      const pdfH=(canvas.height*pdfW)/canvas.width;
      pdf.addImage(imgData,"PNG",0,0,pdfW,pdfH);
      const nombre=campanaFiltro==="todas"?"KPIs_Todas_Campanas":campanaFiltro.replace(/\s+/g,"_");
      pdf.save(`BigTicket_${nombre}_${new Date().toLocaleDateString("es-CL").replace(/\//g,"-")}.pdf`);
    } catch(e){alert("Error generando PDF: "+e.message);}
    finally{setDescargando(false);}
  };
  const campanas=[...new Set(leads.filter(l=>l.campana_id&&l.origen).map(l=>l.origen.replace("Campaña: ","")))].filter(Boolean).sort();

  const leadsFiltered=campanaFiltro==="todas"
    ? leads.filter(l=>l.campana_id)
    : leads.filter(l=>(l.origen||"").includes(campanaFiltro));

  const total=leadsFiltered.length;
  if(total===0) return(
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <select value={campanaFiltro} onChange={e=>setCampanaFiltro(e.target.value)}
        style={{background:"#ffffff",border:"1px solid #e4e7ec",borderRadius:8,padding:"9px 12px",fontSize:13,maxWidth:400}}>
        <option value="todas">Todas las campañas</option>
        {campanas.map(c=><option key={c} value={c}>{c}</option>)}
      </select>
      <div style={{background:"#ffffff",borderRadius:12,border:"1px solid #e4e7ec",padding:40,textAlign:"center",color:"#aaaaaa"}}>No hay leads de campaña para mostrar</div>
    </div>
  );

  const pct=(n)=>total>0?Math.round((n/total)*100):0;
  const propAceptadas=leadsFiltered.filter(l=>["Propuesta Aceptada","Entrevistas y Validaciones","Postulante Aprobado","Postulante No Calificado"].includes(norm(l.etapa))).length;
  const propRechazadas=leadsFiltered.filter(l=>norm(l.etapa)==="Propuesta Rechazada").length;
  const contratosFirmados=leadsFiltered.filter(l=>norm(l.etapa)==="Postulante Aprobado").length;
  const contratosNoFirmados=leadsFiltered.filter(l=>norm(l.etapa)==="Postulante No Calificado").length;
  const enProceso=leadsFiltered.filter(l=>!["Postulante Aprobado","Postulante No Calificado","Propuesta Rechazada","Base Datos Leads"].includes(norm(l.etapa))).length;

  // Canal con más ingresos
  const canalesMap={};
  leadsFiltered.forEach(l=>{const c=(l.fuente_contacto||l.canal||"Desconocido");canalesMap[c]=(canalesMap[c]||0)+1;});
  const canalTop=Object.entries(canalesMap).sort((a,b)=>b[1]-a[1]);

  // Tiempo promedio de cierre
  const tiempos=leadsFiltered.filter(l=>norm(l.etapa)==="Postulante Aprobado").map(l=>diasEntre(l.created_at,l.updated_at)).filter(d=>d!==null);
  const tiempoPromedio=tiempos.length?Math.round(tiempos.reduce((a,b)=>a+b,0)/tiempos.length):null;

  // Score promedio
  const scorePromedio=leadsFiltered.length?Math.round(leadsFiltered.reduce((a,l)=>a+(l.score||0),0)/leadsFiltered.length):0;

  // Leads calientes
  const calientes=leadsFiltered.filter(l=>(l.clasificacion||"").toLowerCase().includes("caliente")).length;

  const METRICAS=[
    ["📋","Total postulaciones",total,"#3B82F6","leads en esta campaña"],
    ["✅","Propuestas aceptadas",`${pct(propAceptadas)}%`,"#10B981",`${propAceptadas} de ${total}`],
    ["❌","Propuestas rechazadas",`${pct(propRechazadas)}%`,"#EF4444",`${propRechazadas} de ${total}`],
    ["📝","Postulantes Aprobados",`${pct(contratosFirmados)}%`,"#059669",`${contratosFirmados} de ${total}`],
    ["🚫","Postulantes No Calificados",`${pct(contratosNoFirmados)}%`,"#DC2626",`${contratosNoFirmados} de ${total}`],
    ["⏳","En proceso",enProceso,"#F59E0B","leads activos en pipeline"],
    ["⭐","Score promedio",scorePromedio,"#F59E0B","puntos promedio"],
    ["🔴","Leads calientes",`${pct(calientes)}%`,"#EF4444",`${calientes} calientes`],
    ["⏱","Tiempo prom. cierre",tiempoPromedio!==null?`${tiempoPromedio}d`:"—","#8B5CF6","días lead→contrato firmado"],
  ];

  return(
    <div style={{display:"flex",flexDirection:"column",gap:16}} ref={reporteRef}>
      {/* Filtro campaña */}
      <div style={{display:"flex",gap:12,alignItems:"center"}}>
        <select value={campanaFiltro} onChange={e=>setCampanaFiltro(e.target.value)}
          style={{background:"#ffffff",border:"1px solid #e4e7ec",borderRadius:8,padding:"9px 14px",fontSize:13,flex:1,maxWidth:400,cursor:"pointer"}}>
          <option value="todas">📊 Todas las campañas</option>
          {campanas.map(c=><option key={c} value={c}>{c}</option>)}
        </select>
        <div style={{fontSize:12,color:"#888888"}}>{total} leads {campanaFiltro!=="todas"?`en "${campanaFiltro}"`:"en total"}</div>
        <button onClick={descargarPDF} disabled={descargando}
          style={{background:"#1a3a6b",color:"white",border:"none",borderRadius:8,padding:"9px 18px",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"'Outfit',sans-serif",opacity:descargando?0.6:1,flexShrink:0}}>
          {descargando?"Generando...":"⬇ Descargar PDF"}
        </button>
      </div>

      {/* Métricas principales */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12}}>
        {METRICAS.map(([icon,label,val,color,sub])=>(
          <div key={label} style={{background:"#ffffff",border:`1px solid ${color}22`,borderRadius:12,padding:16}}>
            <div style={{fontSize:20}}>{icon}</div>
            <div style={{fontSize:26,fontWeight:900,color,fontFamily:"monospace",marginTop:6}}>{val}</div>
            <div style={{fontSize:11,color:"#555555",fontWeight:700,marginTop:2}}>{label}</div>
            <div style={{fontSize:10,color:"#aaaaaa",marginTop:2}}>{sub}</div>
          </div>
        ))}
      </div>

      {/* Canal con más ingresos */}
      <div style={{background:"#ffffff",border:"1px solid #e4e7ec",borderRadius:12,padding:16}}>
        <div style={{fontSize:10,fontWeight:800,color:"#555555",letterSpacing:2,marginBottom:14,textTransform:"uppercase"}}>Origen de leads</div>
        {canalTop.map(([canal,count])=>{const cfg=getCanalCfg(canal.toLowerCase());return(
          <div key={canal} style={{marginBottom:10}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
              <span style={{fontSize:12,color:"#666666"}}>{cfg.icon} {cfg.label||canal}</span>
              <div style={{display:"flex",gap:12}}>
                <span style={{fontSize:10,color:"#555555"}}>{count} leads</span>
                <span style={{fontSize:12,fontWeight:800,color:cfg.color}}>{pct(count)}%</span>
              </div>
            </div>
            <div style={{height:6,background:"#f4f5f7",borderRadius:4}}>
              <div style={{height:"100%",width:`${pct(count)}%`,background:cfg.color,borderRadius:4,transition:"width .8s ease"}}/>
            </div>
          </div>
        );})}
      </div>

      {/* Comparativa de campañas si se muestra "todas" */}
      {campanaFiltro==="todas"&&campanas.length>1&&(
        <div style={{background:"#ffffff",border:"1px solid #e4e7ec",borderRadius:12,padding:16}}>
          <div style={{fontSize:10,fontWeight:800,color:"#555555",letterSpacing:2,marginBottom:14,textTransform:"uppercase"}}>Comparativa de campañas</div>
          {campanas.map(c=>{
            const ls=leads.filter(l=>(l.origen||"").includes(c));
            const tot=ls.length;
            const firm=ls.filter(l=>norm(l.etapa)==="Postulante Aprobado").length;
            const tasa=tot>0?Math.round((firm/tot)*100):0;
            return(
              <div key={c} style={{marginBottom:12}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                  <span style={{fontSize:12,color:"#1a1a1a",fontWeight:600}}>{c}</span>
                  <div style={{display:"flex",gap:16}}>
                    <span style={{fontSize:10,color:"#555555"}}>{tot} postulaciones · {firm} firmados</span>
                    <span style={{fontSize:12,fontWeight:800,color:tasa>=50?"#10B981":tasa>=25?"#F59E0B":"#EF4444"}}>{tasa}%</span>
                  </div>
                </div>
                <div style={{height:6,background:"#f4f5f7",borderRadius:4}}>
                  <div style={{height:"100%",width:`${tasa}%`,background:tasa>=50?"#10B981":tasa>=25?"#F59E0B":"#EF4444",borderRadius:4,transition:"width .8s ease"}}/>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ─── EMBUDO DE CONVERSIÓN ─────────────────────────────────────────────────────
const EmbudoView = ({ leads }) => {
  const [campanaFiltro, setCampanaFiltro] = useState("todas");
  const [descargando, setDescargando] = useState(false);
  const reporteRef = useRef(null);

  const norm=(e)=>{if(!e)return"Nuevo Lead";const m={"nuevo lead":"Nuevo Lead","nuevo":"Nuevo Lead","new":"Nuevo Lead","postulante":"Nuevo Lead","contactado":"Base Datos Leads","reunión agendada":"Base Datos Leads","reunion agendada":"Base Datos Leads","negociación":"Base Datos Leads","negociacion":"Base Datos Leads","propuesta enviada":"Propuesta Enviada","propuesta aceptada":"Propuesta Aceptada","propuesta rechazada":"Propuesta Rechazada","contrato firmado":"Postulante Aprobado","contrato no firmado":"Postulante No Calificado","ganado":"Postulante Aprobado","perdido":"Postulante No Calificado","postulante aprobado":"Postulante Aprobado","postulante no calificado":"Postulante No Calificado","entrevistas y validaciones":"Entrevistas y Validaciones","base datos leads":"Base Datos Leads"};return m[e.toLowerCase().trim()]||e;};

  const campanas = [...new Set(leads.filter(l=>l.campana_id&&l.origen).map(l=>l.origen.replace("Campaña: ","")))].filter(Boolean).sort();

  const leadsFiltered = campanaFiltro === "todas"
    ? leads.filter(l => l.campana_id)
    : leads.filter(l => (l.origen||"").includes(campanaFiltro));

  // ── Cálculo de etapas del embudo ──
  const total        = leadsFiltered.length;
  const preCalif     = leadsFiltered.filter(l => {
    const e = norm(l.etapa);
    return (l.clasificacion||"").toLowerCase().includes("caliente") ||
      ["Propuesta Enviada","Propuesta Aceptada","Propuesta Rechazada","Postulante Aprobado","Postulante No Calificado"].includes(e);
  }).length;
  const potenciales  = leadsFiltered.filter(l => {
    const e = norm(l.etapa);
    return ["Propuesta Aceptada","Postulante Aprobado","Postulante No Calificado"].includes(e);
  }).length;
  const validacion   = leadsFiltered.filter(l => {
    const e = norm(l.etapa);
    return ["Postulante Aprobado","Postulante No Calificado","Entrevistas y Validaciones","Onboarding Pendiente"].includes(e) ||
      (l.onboarding_completado === true);
  }).length;
  const aprobados    = leadsFiltered.filter(l => norm(l.etapa) === "Postulante Aprobado").length;

  const pct = (n, base) => base > 0 ? Math.round((n / base) * 100) : 0;

  const ETAPAS = [
    { label: "Prospectos",            sub: "Total postulaciones",                    n: total,       color: "#3B82F6", icon: "👥", base: total },
    { label: "Pre-Calificados",       sub: "Leads calientes o propuesta enviada",    n: preCalif,    color: "#8B5CF6", icon: "⭐", base: total },
    { label: "Clientes Potenciales",  sub: "Aceptaron la propuesta económica",       n: potenciales, color: "#F59E0B", icon: "✅", base: total },
    { label: "Validación",            sub: "Completaron formulario de onboarding",   n: validacion,  color: "#10B981", icon: "📋", base: total },
    { label: "Aprobados",             sub: "Contrato firmado — activos",             n: aprobados,   color: "#059669", icon: "🏆", base: total },
  ];

  const maxN = total || 1;

  const descargarPDF = async () => {
    if (!reporteRef.current) return;
    setDescargando(true);
    try {
      if (!window.html2canvas) { const s=document.createElement("script"); s.src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"; document.head.appendChild(s); await new Promise(r=>s.onload=r); }
      if (!window.jspdf)       { const s=document.createElement("script"); s.src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";    document.head.appendChild(s); await new Promise(r=>s.onload=r); }
      const canvas   = await window.html2canvas(reporteRef.current, { scale: 2, backgroundColor: "#f0f2f5", useCORS: true });
      const imgData  = canvas.toDataURL("image/png");
      const { jsPDF } = window.jspdf;
      const pdf      = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pdfW     = pdf.internal.pageSize.getWidth();
      const pdfH     = (canvas.height * pdfW) / canvas.width;
      if (pdfH > pdf.internal.pageSize.getHeight()) {
        const ratio  = pdf.internal.pageSize.getHeight() / pdfH;
        pdf.addImage(imgData, "PNG", 0, 0, pdfW * ratio, pdf.internal.pageSize.getHeight());
      } else {
        pdf.addImage(imgData, "PNG", 0, 0, pdfW, pdfH);
      }
      const nombre = campanaFiltro === "todas" ? "Embudo_Todas" : campanaFiltro.replace(/\s+/g,"_");
      pdf.save(`BigTicket_Embudo_${nombre}_${new Date().toLocaleDateString("es-CL").replace(/\//g,"-")}.pdf`);
    } catch(e) { alert("Error generando PDF: "+e.message); }
    finally { setDescargando(false); }
  };

  return (
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      {/* Filtros y acciones */}
      <div style={{display:"flex",gap:12,alignItems:"center",flexWrap:"wrap"}}>
        <select value={campanaFiltro} onChange={e=>setCampanaFiltro(e.target.value)}
          style={{background:"#fff",border:"1px solid #e4e7ec",borderRadius:8,padding:"9px 14px",fontSize:13,flex:1,maxWidth:400,cursor:"pointer"}}>
          <option value="todas">📊 Todas las campañas</option>
          {campanas.map(c=><option key={c} value={c}>{c}</option>)}
        </select>
        <div style={{fontSize:12,color:"#888"}}>{total} leads {campanaFiltro!=="todas"?`en "${campanaFiltro}"`:"en total"}</div>
        <button onClick={descargarPDF} disabled={descargando}
          style={{background:"#1a3a6b",color:"#fff",border:"none",borderRadius:8,padding:"9px 18px",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"'Outfit',sans-serif",opacity:descargando?0.6:1,flexShrink:0}}>
          {descargando?"Generando...":"⬇ Descargar PDF"}
        </button>
      </div>

      {/* Reporte embudo */}
      <div ref={reporteRef} style={{background:"#f0f2f5",padding:24,borderRadius:16}}>

        {/* Header reporte */}
        <div style={{background:"#1a3a6b",borderRadius:12,padding:"20px 24px",marginBottom:24,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <div style={{fontSize:20,fontWeight:900,color:"#fff",fontFamily:"'Outfit',sans-serif"}}>📊 Embudo de Conversión</div>
            <div style={{fontSize:12,color:"#ffffff88",marginTop:4}}>
              {campanaFiltro==="todas"?"Todas las campañas":`Campaña: ${campanaFiltro}`} · {new Date().toLocaleDateString("es-CL",{day:"2-digit",month:"long",year:"numeric"})}
            </div>
          </div>
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:32,fontWeight:900,color:"#3B82F6",fontFamily:"monospace"}}>{total}</div>
            <div style={{fontSize:10,color:"#ffffff88",fontWeight:700,letterSpacing:1}}>TOTAL PROSPECTOS</div>
          </div>
        </div>

        {/* Embudo visual */}
        <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:24}}>
          {ETAPAS.map((et, i) => {
            const w = maxN > 0 ? Math.max(30, Math.round((et.n / maxN) * 100)) : 30;
            const convPrev = i > 0 ? pct(et.n, ETAPAS[i-1].n) : 100;
            return (
              <div key={et.label}>
                {/* Flecha de conversión entre etapas */}
                {i > 0 && (
                  <div style={{display:"flex",justifyContent:"center",alignItems:"center",gap:8,padding:"4px 0",marginBottom:4}}>
                    <div style={{height:1,flex:1,background:"#e4e7ec"}}/>
                    <div style={{fontSize:11,fontWeight:700,color: convPrev >= 50 ? "#10B981" : convPrev >= 25 ? "#F59E0B" : "#EF4444",
                      background:"#fff",border:`1px solid ${convPrev >= 50 ? "#10B98133" : convPrev >= 25 ? "#F59E0B33" : "#EF444433"}`,
                      borderRadius:20,padding:"2px 10px"}}>
                      ↓ {convPrev}% conversión
                    </div>
                    <div style={{height:1,flex:1,background:"#e4e7ec"}}/>
                  </div>
                )}
                {/* Barra del embudo */}
                <div style={{display:"flex",alignItems:"center",gap:12}}>
                  <div style={{width:32,textAlign:"center",fontSize:18,flexShrink:0}}>{et.icon}</div>
                  <div style={{flex:1}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:5,alignItems:"center"}}>
                      <div>
                        <span style={{fontSize:13,fontWeight:800,color:"#1a1a1a",fontFamily:"'Outfit',sans-serif"}}>{et.label}</span>
                        <span style={{fontSize:11,color:"#888",marginLeft:8}}>{et.sub}</span>
                      </div>
                      <div style={{display:"flex",gap:16,alignItems:"center",flexShrink:0}}>
                        <span style={{fontSize:22,fontWeight:900,color:et.color,fontFamily:"monospace"}}>{et.n}</span>
                        <span style={{fontSize:13,fontWeight:700,color:"#555",minWidth:40,textAlign:"right"}}>{pct(et.n, total)}%</span>
                      </div>
                    </div>
                    <div style={{height:28,background:"#e4e7ec",borderRadius:6,overflow:"hidden"}}>
                      <div style={{height:"100%",width:`${w}%`,background:`linear-gradient(90deg, ${et.color}, ${et.color}cc)`,
                        borderRadius:6,transition:"width 1s ease",display:"flex",alignItems:"center",justifyContent:"flex-end",paddingRight:8}}>
                        {et.n > 0 && <span style={{fontSize:10,fontWeight:800,color:"#fff"}}>{et.n}</span>}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Métricas clave */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:24}}>
          {[
            ["Tasa Pre-Calif.",    `${pct(preCalif,total)}%`,    "#8B5CF6", `${preCalif} de ${total}`],
            ["Tasa Potenciales",   `${pct(potenciales,total)}%`, "#F59E0B", `${potenciales} de ${preCalif} pre-calif.`],
            ["Tasa Onboarding",    `${pct(validacion,total)}%`,  "#10B981", `${validacion} de ${potenciales} potenciales`],
            ["Tasa Aprobación",    `${pct(aprobados,total)}%`,   "#059669", `${aprobados} de ${total} totales`],
          ].map(([label,val,color,sub])=>(
            <div key={label} style={{background:"#fff",borderRadius:10,padding:14,border:`1px solid ${color}33`}}>
              <div style={{fontSize:24,fontWeight:900,color,fontFamily:"monospace"}}>{val}</div>
              <div style={{fontSize:11,fontWeight:700,color:"#555",marginTop:4}}>{label}</div>
              <div style={{fontSize:10,color:"#aaa",marginTop:2}}>{sub}</div>
            </div>
          ))}
        </div>

        {/* Comparativa por campaña si es "todas" */}
        {campanaFiltro==="todas" && campanas.length > 1 && (
          <div style={{background:"#fff",borderRadius:12,padding:16,border:"1px solid #e4e7ec"}}>
            <div style={{fontSize:10,fontWeight:800,color:"#555",letterSpacing:2,marginBottom:14,textTransform:"uppercase"}}>Comparativa por campaña</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:10}}>
              {campanas.map(c => {
                const ls = leads.filter(l=>(l.origen||"").includes(c));
                const tot = ls.length;
                const aprov = ls.filter(l=>norm(l.etapa)==="Postulante Aprobado").length;
                const tasa = pct(aprov, tot);
                return (
                  <div key={c} style={{background:"#f8f9fa",borderRadius:8,padding:12,border:"1px solid #e4e7ec"}}>
                    <div style={{fontSize:12,fontWeight:700,color:"#1a1a1a",marginBottom:6,lineHeight:1.3}}>{c}</div>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                      <span style={{fontSize:10,color:"#888"}}>{tot} leads</span>
                      <span style={{fontSize:13,fontWeight:900,color:tasa>=50?"#059669":tasa>=25?"#F59E0B":"#EF4444"}}>{tasa}%</span>
                    </div>
                    <div style={{height:5,background:"#e4e7ec",borderRadius:3}}>
                      <div style={{height:"100%",width:`${tasa}%`,background:tasa>=50?"#059669":tasa>=25?"#F59E0B":"#EF4444",borderRadius:3}}/>
                    </div>
                    <div style={{fontSize:9,color:"#aaa",marginTop:4}}>{aprov} aprobados</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{marginTop:16,textAlign:"center",fontSize:10,color:"#aaa"}}>
          Generado por BIGPRO FLOTA CRM · {new Date().toLocaleString("es-CL")}
        </div>
      </div>
    </div>
  );
};

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
const DashboardMetrics = ({ leads }) => {
  const norm=(e)=>{if(!e)return"Nuevo Lead";const m={"nuevo lead":"Nuevo Lead","nuevo":"Nuevo Lead","new":"Nuevo Lead","postulante":"Nuevo Lead","contactado":"Base Datos Leads","reunión agendada":"Base Datos Leads","reunion agendada":"Base Datos Leads","negociación":"Base Datos Leads","negociacion":"Base Datos Leads","propuesta enviada":"Propuesta Enviada","propuesta aceptada":"Propuesta Aceptada","propuesta rechazada":"Propuesta Rechazada","contrato firmado":"Postulante Aprobado","contrato no firmado":"Postulante No Calificado","ganado":"Postulante Aprobado","perdido":"Postulante No Calificado","postulante aprobado":"Postulante Aprobado","postulante no calificado":"Postulante No Calificado","entrevistas y validaciones":"Entrevistas y Validaciones","base datos leads":"Base Datos Leads"};return m[e.toLowerCase().trim()]||e;};
  const hoy=new Date();hoy.setHours(0,0,0,0);
  const nuevosHoy=leads.filter(l=>l.created_at&&new Date(l.created_at)>=hoy).length;
  const scorePromedio=leads.length?Math.round(leads.reduce((a,l)=>a+(l.score||0),0)/leads.length):0;
  const ganados=leads.filter(l=>norm(l.etapa)==="Postulante Aprobado").length;
  const cerrados=ganados+leads.filter(l=>norm(l.etapa)==="Postulante No Calificado").length;
  const tasaCierre=cerrados>0?Math.round((ganados/cerrados)*100):0;
  const canalData=Object.entries(leads.reduce((a,l)=>{const c=(l.fuente_contacto||l.canal)?.toLowerCase()||"otro";a[c]=(a[c]||0)+1;return a},{})).sort((a,b)=>b[1]-a[1]);
  const etapaData=ETAPAS_TODAS.map(e=>({etapa:e,count:leads.filter(l=>norm(l.etapa)===e).length}));
  return (
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
        {[["👥","Total Leads",leads.length,"#3B82F6"],["🆕","Nuevos hoy",nuevosHoy,"#10B981"],["⭐","Score promedio",scorePromedio,"#F59E0B"],["✅","Tasa de cierre",`${tasaCierre}%`,"#10B981"]].map(([icon,label,val,color])=>(
          <div key={label} style={{background:"#ffffff",border:`1px solid ${color}22`,borderRadius:12,padding:16}}>
            <div style={{fontSize:24}}>{icon}</div>
            <div style={{fontSize:30,fontWeight:900,color,fontFamily:"monospace",marginTop:6}}>{val}</div>
            <div style={{fontSize:11,color:"#555555",fontWeight:700,marginTop:2}}>{label}</div>
          </div>
        ))}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        <div style={{background:"#ffffff",border:"1px solid #e4e7ec",borderRadius:12,padding:16}}>
          <div style={{fontSize:10,fontWeight:800,color:"#555555",letterSpacing:2,marginBottom:14,textTransform:"uppercase"}}>Leads por canal</div>
          {canalData.map(([canal,count])=>{const cfg=getCanalCfg(canal);return(
            <div key={canal} style={{marginBottom:10}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                <span style={{fontSize:12,color:"#666666"}}>{cfg.icon} {cfg.label}</span>
                <span style={{fontSize:12,fontWeight:800,color:cfg.color}}>{count}</span>
              </div>
              <div style={{height:5,background:"#f4f5f7",borderRadius:4}}><div style={{height:"100%",width:`${(count/leads.length)*100}%`,background:cfg.color,borderRadius:4,transition:"width .8s ease"}}/></div>
            </div>
          );})}
        </div>
        <div style={{background:"#ffffff",border:"1px solid #e4e7ec",borderRadius:12,padding:16}}>
          <div style={{fontSize:10,fontWeight:800,color:"#555555",letterSpacing:2,marginBottom:14,textTransform:"uppercase"}}>Pipeline por etapa</div>
          {etapaData.map(({etapa,count})=>{const cfg=ETAPA_CFG[etapa]||{color:"#888888"};return(
            <div key={etapa} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 0",borderBottom:"1px solid #f4f5f7"}}>
              <span style={{fontSize:11,color:"#888888"}}>{cfg.icon} {etapa}</span>
              <div style={{display:"flex",gap:8,alignItems:"center"}}>
                <div style={{height:4,width:`${Math.max(count*10,4)}px`,maxWidth:60,background:cfg.color,borderRadius:4}}/>
                <span style={{fontSize:12,fontWeight:800,color:cfg.color,fontFamily:"monospace",minWidth:20,textAlign:"right"}}>{count}</span>
              </div>
            </div>
          );})}
        </div>
      </div>
      <div style={{background:"#ffffff",border:"1px solid #e4e7ec",borderRadius:12,padding:16}}>
        <div style={{fontSize:10,fontWeight:800,color:"#555555",letterSpacing:2,marginBottom:12,textTransform:"uppercase"}}>Leads recientes</div>
        {leads.slice(0,5).map(lead=>(
          <div key={lead.id} style={{display:"flex",alignItems:"center",gap:12,padding:"9px 0",borderBottom:"1px solid #ffffff"}}>
            <div style={{width:34,height:34,borderRadius:"50%",background:"#eef2ff",border:"1px solid #dbeafe",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,color:"#888888",fontWeight:700,flexShrink:0}}>{(lead.nombre||"?")[0].toUpperCase()}</div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:12,fontWeight:700,color:"#1a1a1a",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{lead.nombre} · {lead.empresa}</div>
              <div style={{fontSize:10,color:"#555555"}}>{lead.etapa||"Nuevo Lead"} · {formatFecha(lead.created_at)}</div>
            </div>
            <CanalTag canal={lead.canal}/><ScoreDot score={lead.score}/>
          </div>
        ))}
        {leads.length===0&&<div style={{color:"#aaaaaa",fontSize:12}}>No hay leads aún</div>}
      </div>
    </div>
  );
};

// ─── TABLA ────────────────────────────────────────────────────────────────────
const TablaLeads = ({ leads, onSelect }) => (
  <div style={{background:"#ffffff",borderRadius:12,border:"1px solid #e4e7ec",overflow:"hidden"}}>
    <table style={{width:"100%",borderCollapse:"collapse"}}>
      <thead><tr style={{background:"#f0f2f5"}}>{["Prospecto","Empresa","Canal","País","Etapa","Score","Clasificación","Actualizado",""].map(h=><th key={h} style={{padding:"10px 14px",textAlign:"left",fontSize:9,fontWeight:800,color:"#aaaaaa",textTransform:"uppercase",letterSpacing:1}}>{h}</th>)}</tr></thead>
      <tbody>{leads.map((lead,i)=>{const cfg=ETAPA_CFG[lead.etapa]||{color:"#888888",icon:"•"};return(
        <tr key={lead.id} style={{borderTop:"1px solid #f0f2f5",background:i%2===0?"#ffffff":"#f8f9fa",cursor:"pointer"}}
          onClick={()=>onSelect(lead)} onMouseEnter={e=>e.currentTarget.style.background="#eef2ff"} onMouseLeave={e=>e.currentTarget.style.background=i%2===0?"#ffffff":"#f8f9fa"}>
          <td style={{padding:"10px 14px"}}><div style={{fontSize:12,fontWeight:700,color:"#1a1a1a"}}>{lead.nombre||"—"}</div><div style={{fontSize:10,color:"#aaaaaa"}}>{lead.email||"—"}</div></td>
          <td style={{padding:"10px 14px",fontSize:12,color:"#888888"}}>{lead.empresa||"—"}</td>
          <td style={{padding:"10px 14px"}}><CanalTag canal={lead.fuente_contacto||lead.canal}/></td>
          <td style={{padding:"10px 14px"}}><div style={{display:"flex",alignItems:"center",gap:6}}><PaisFlag pais={lead.pais}/><span style={{fontSize:12,color:"#888"}}>{lead.pais||"—"}</span></div></td>
          <td style={{padding:"10px 14px"}}><Tag label={`${cfg.icon} ${lead.etapa||"Nuevo Lead"}`} color={cfg.color}/></td>
          <td style={{padding:"10px 14px"}}><ScoreDot score={lead.score}/></td>
          <td style={{padding:"10px 14px"}}>{lead.clasificacion?<Tag label={`${lead.emoji||""} ${lead.clasificacion}`} color={lead.clasificacion?.includes("Caliente")?"#EF4444":lead.clasificacion?.includes("Candidato")?"#F59E0B":"#F97316"}/>:<span style={{color:"#aaaaaa",fontSize:11}}>—</span>}</td>
          <td style={{padding:"10px 14px",fontSize:11,color:"#aaaaaa"}}>{formatFecha(lead.updated_at)}</td>
          <td style={{padding:"10px 14px"}}><button onClick={e=>{e.stopPropagation();onSelect(lead);}} style={{background:"#eef2ff",color:"#1a3a6b",border:"none",borderRadius:6,padding:"5px 10px",fontSize:11,cursor:"pointer",fontWeight:700}}>Ver →</button></td>
        </tr>
      );})}</tbody>
    </table>
  </div>
);

// ─── APP ──────────────────────────────────────────────────────────────────────
const ETAPAS_MONITOR=["Nuevo Lead","Propuesta Enviada","Propuesta Aceptada","Propuesta Rechazada"];
const HORAS_OLVIDADO=24;
const HORAS_ESTANCADO=48;

const calcAlertas=(leads)=>{
  const norm=(e)=>{if(!e)return"Nuevo Lead";const m={"nuevo lead":"Nuevo Lead","nuevo":"Nuevo Lead","new":"Nuevo Lead","postulante":"Nuevo Lead","contactado":"Base Datos Leads","reunión agendada":"Base Datos Leads","reunion agendada":"Base Datos Leads","negociación":"Base Datos Leads","negociacion":"Base Datos Leads","propuesta enviada":"Propuesta Enviada","propuesta aceptada":"Propuesta Aceptada","propuesta rechazada":"Propuesta Rechazada","contrato firmado":"Postulante Aprobado","contrato no firmado":"Postulante No Calificado","ganado":"Postulante Aprobado","perdido":"Postulante No Calificado","postulante aprobado":"Postulante Aprobado","postulante no calificado":"Postulante No Calificado","entrevistas y validaciones":"Entrevistas y Validaciones","base datos leads":"Base Datos Leads"};return m[e.toLowerCase().trim()]||e;};
  const ahora=Date.now();
  const olvidados=[];
  const estancados=[];
  leads.forEach(l=>{
    if(!ETAPAS_MONITOR.includes(norm(l.etapa))) return;
    const hsSinTocar=(ahora-new Date(l.updated_at||l.created_at))/3600000;
    const hsEnEtapa =(ahora-new Date(l.created_at))/3600000;
    if(hsSinTocar>=HORAS_OLVIDADO)  olvidados.push({...l,horas:Math.floor(hsSinTocar)});
    else if(hsEnEtapa>=HORAS_ESTANCADO) estancados.push({...l,horas:Math.floor(hsEnEtapa)});
  });
  return{olvidados,estancados};
};

const AlertasPopup=({leads,onClose,onVerLead})=>{
  const {olvidados,estancados}=calcAlertas(leads);
  const total=olvidados.length+estancados.length;
  if(total===0) return null;
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.55)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:300}}>
      <div style={{background:"#ffffff",borderRadius:16,width:560,maxHeight:"80vh",display:"flex",flexDirection:"column",boxShadow:"0 20px 60px rgba(0,0,0,.3)"}}>
        {/* Header */}
        <div style={{padding:"20px 24px",borderBottom:"1px solid #f0f2f5",display:"flex",justifyContent:"space-between",alignItems:"center",flexShrink:0}}>
          <div>
            <div style={{fontSize:18,fontWeight:900,color:"#1a1a1a",fontFamily:"'Outfit',sans-serif"}}>
              🔔 Alertas del CRM
            </div>
            <div style={{fontSize:12,color:"#888888",marginTop:2}}>
              {total} lead{total!==1?"s":""} requiere{total===1?"":"n"} atención
            </div>
          </div>
          <button onClick={onClose} style={{background:"#f0f2f5",border:"none",borderRadius:8,width:34,height:34,cursor:"pointer",fontSize:18,display:"flex",alignItems:"center",justifyContent:"center",color:"#666666"}}>×</button>
        </div>
        {/* Contenido */}
        <div style={{overflow:"auto",padding:"16px 24px",display:"flex",flexDirection:"column",gap:16}}>
          {olvidados.length>0&&(
            <div>
              <div style={{fontSize:10,fontWeight:800,color:"#EF4444",letterSpacing:1.5,textTransform:"uppercase",marginBottom:10,display:"flex",alignItems:"center",gap:6}}>
                <div style={{width:8,height:8,borderRadius:"50%",background:"#EF4444"}}/>
                Leads olvidados — sin tocar hace más de {HORAS_OLVIDADO}h ({olvidados.length})
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                {olvidados.map(l=>(
                  <div key={l.id} onClick={()=>{onVerLead(l);onClose();}}
                    style={{background:"#fff5f5",border:"1px solid #fca5a5",borderRadius:10,padding:"10px 14px",cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center",transition:"all .15s"}}
                    onMouseOver={e=>e.currentTarget.style.background="#fee2e2"}
                    onMouseOut={e=>e.currentTarget.style.background="#fff5f5"}>
                    <div>
                      <div style={{fontSize:13,fontWeight:700,color:"#1a1a1a"}}>{l.nombre||"Sin nombre"}</div>
                      <div style={{fontSize:11,color:"#888888",marginTop:2}}>{l.empresa||"Sin empresa"} · {ETAPA_CFG[l.etapa||"Nuevo Lead"]?.icon} {l.etapa||"Nuevo Lead"}</div>
                    </div>
                    <div style={{textAlign:"right",flexShrink:0}}>
                      <div style={{fontSize:13,fontWeight:800,color:"#EF4444"}}>{l.horas}h</div>
                      <div style={{fontSize:10,color:"#888888"}}>sin gestión</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {estancados.length>0&&(
            <div>
              <div style={{fontSize:10,fontWeight:800,color:"#F59E0B",letterSpacing:1.5,textTransform:"uppercase",marginBottom:10,display:"flex",alignItems:"center",gap:6}}>
                <div style={{width:8,height:8,borderRadius:"50%",background:"#F59E0B"}}/>
                Leads estancados — más de {HORAS_ESTANCADO}h en la misma etapa ({estancados.length})
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                {estancados.map(l=>(
                  <div key={l.id} onClick={()=>{onVerLead(l);onClose();}}
                    style={{background:"#fffbeb",border:"1px solid #fde68a",borderRadius:10,padding:"10px 14px",cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center",transition:"all .15s"}}
                    onMouseOver={e=>e.currentTarget.style.background="#fef3c7"}
                    onMouseOut={e=>e.currentTarget.style.background="#fffbeb"}>
                    <div>
                      <div style={{fontSize:13,fontWeight:700,color:"#1a1a1a"}}>{l.nombre||"Sin nombre"}</div>
                      <div style={{fontSize:11,color:"#888888",marginTop:2}}>{l.empresa||"Sin empresa"} · {ETAPA_CFG[l.etapa||"Nuevo Lead"]?.icon} {l.etapa||"Nuevo Lead"}</div>
                    </div>
                    <div style={{textAlign:"right",flexShrink:0}}>
                      <div style={{fontSize:13,fontWeight:800,color:"#F59E0B"}}>{l.horas}h</div>
                      <div style={{fontSize:10,color:"#888888"}}>en esta etapa</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        {/* Footer */}
        <div style={{padding:"14px 24px",borderTop:"1px solid #f0f2f5",flexShrink:0,display:"flex",justifyContent:"flex-end"}}>
          <button onClick={onClose}
            style={{background:"#1a3a6b",color:"white",border:"none",borderRadius:8,padding:"9px 20px",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>
            Entendido, cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [leads,setLeads]=useState([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState(null);
  const [seccion,setSeccion]=useState("campana");
  const [selectedLead,setSelectedLead]=useState(null);
  const [busqueda,setBusqueda]=useState("");
  const [vista,setVista]=useState("pipeline");
  const [lastUpdate,setLastUpdate]=useState(null);
  const [showAlertas,setShowAlertas]=useState(false);
  const refreshInterval=useRef(null);
  const alertasMostradas=useRef(false);

  const fetchLeads=async()=>{
    const norm=(e)=>{if(!e)return"Nuevo Lead";const m={"nuevo lead":"Nuevo Lead","nuevo":"Nuevo Lead","new":"Nuevo Lead","postulante":"Nuevo Lead","contactado":"Base Datos Leads","reunión agendada":"Base Datos Leads","reunion agendada":"Base Datos Leads","negociación":"Base Datos Leads","negociacion":"Base Datos Leads","propuesta enviada":"Propuesta Enviada","propuesta aceptada":"Propuesta Aceptada","propuesta rechazada":"Propuesta Rechazada","contrato firmado":"Postulante Aprobado","contrato no firmado":"Postulante No Calificado","ganado":"Postulante Aprobado","perdido":"Postulante No Calificado","postulante aprobado":"Postulante Aprobado","postulante no calificado":"Postulante No Calificado","entrevistas y validaciones":"Entrevistas y Validaciones","base datos leads":"Base Datos Leads"};return m[e.toLowerCase().trim()]||e;};
    try{const data=await sb.from("leads").select("*",{order:"created_at.desc"});
      if(Array.isArray(data)){
        const normalized=data.map(l=>({...l,etapa:norm(l.etapa)}));
        setLeads(normalized);setLastUpdate(new Date());setError(null);
        if(!alertasMostradas.current){
          const {olvidados,estancados}=calcAlertas(normalized);
          if(olvidados.length+estancados.length>0){setShowAlertas(true);}
          alertasMostradas.current=true;
        }
      }
      else setError("Error al cargar leads");
    }catch{setError("Sin conexión a Supabase");}
    finally{setLoading(false);}
  };

  useEffect(()=>{fetchLeads();refreshInterval.current=setInterval(fetchLeads,30000);return()=>clearInterval(refreshInterval.current);},[]);

  const NORM=(e)=>{if(!e)return"Nuevo Lead";const m={"nuevo lead":"Nuevo Lead","nuevo":"Nuevo Lead","new":"Nuevo Lead","postulante":"Nuevo Lead","contactado":"Base Datos Leads","reunión agendada":"Base Datos Leads","reunion agendada":"Base Datos Leads","negociación":"Base Datos Leads","negociacion":"Base Datos Leads","propuesta enviada":"Propuesta Enviada","propuesta aceptada":"Propuesta Aceptada","propuesta rechazada":"Propuesta Rechazada","contrato firmado":"Postulante Aprobado","contrato no firmado":"Postulante No Calificado","ganado":"Postulante Aprobado","perdido":"Postulante No Calificado","postulante aprobado":"Postulante Aprobado","postulante no calificado":"Postulante No Calificado","entrevistas y validaciones":"Entrevistas y Validaciones","base datos leads":"Base Datos Leads"};return m[e.toLowerCase().trim()]||e;};

  const [confirmModal,setConfirmModal]=useState(null); // {lead, nuevaEtapa}

  const handleEtapaChange=(lead,nuevaEtapa)=>{
    const etapaActual=NORM(lead.etapa);
    if(etapaActual===nuevaEtapa) return;
    setConfirmModal({lead,nuevaEtapa,etapaActual});
  };

  const confirmarCambioEtapa=async()=>{
    if(!confirmModal) return;
    const {lead,nuevaEtapa,etapaActual}=confirmModal;
    setConfirmModal(null);
    try{
      await sb.from("leads").update({etapa:nuevaEtapa},`id=eq.${lead.id}`);
      await sb.from("lead_historial").insert({lead_id:lead.id,etapa_anterior:etapaActual,etapa_nueva:nuevaEtapa});
      setLeads(prev=>prev.map(l=>l.id===lead.id?{...l,etapa:nuevaEtapa}:l));
      if(selectedLead?.id===lead.id)setSelectedLead(p=>({...p,etapa:nuevaEtapa}));
    }catch(e){console.error(e);}
  };

  const handleLeadUpdate=(updated)=>{
    setLeads(prev=>prev.map(l=>l.id===updated.id?updated:l));
    if(selectedLead?.id===updated.id)setSelectedLead(updated);
  };

  const esCaliente=(l)=>(l.clasificacion||"").toLowerCase().includes("caliente");
  const esBaseDatos=(l)=>{
    const e=NORM(l.etapa);
    return e==="Base Datos Leads"||(!esCaliente(l)&&e==="Nuevo Lead"&&l.tipo_postulacion==="libre");
  };

  const scoreOrden=(l)=>{
    const c=(l.clasificacion||"").toLowerCase();
    if(c.includes("caliente")) return 0;
    if(c.includes("tibio"))    return 1;
    return 2;
  };

  const busquedaFilter=(l)=>(l.nombre||"").toLowerCase().includes(busqueda.toLowerCase())||(l.empresa||"").toLowerCase().includes(busqueda.toLowerCase())||(l.email||"").toLowerCase().includes(busqueda.toLowerCase());

  const leadsCampana=[...leads]
    .filter(l=>l.tipo_postulacion==="campaña"||(l.campana_id&&!l.tipo_postulacion))
    .filter(l=>NORM(l.etapa)!=="Base Datos Leads")
    .filter(busquedaFilter)
    .sort((a,b)=>{const d=new Date(b.created_at)-new Date(a.created_at);return d!==0?d:scoreOrden(a)-scoreOrden(b);});

  const leadsLibre=[...leads]
    .filter(l=>l.tipo_postulacion==="libre"||(!l.campana_id&&!l.tipo_postulacion))
    .filter(l=>NORM(l.etapa)!=="Base Datos Leads")
    .filter(busquedaFilter)
    .sort((a,b)=>new Date(b.created_at)-new Date(a.created_at));

  const leadsBaseDatos=[...leads]
    .filter(l=>NORM(l.etapa)==="Base Datos Leads"||
      NORM(l.etapa)==="Propuesta Rechazada"||
      NORM(l.etapa)==="Postulante No Calificado"||
      (!esCaliente(l)&&["Contactado","Reunión Agendada","Negociación"].includes(l.etapa)))
    .filter(busquedaFilter)
    .sort((a,b)=>new Date(b.created_at)-new Date(a.created_at));

  const NAV=[
    {id:"dashboard",   icon:"◈", label:"Dashboard"},
    {id:"campana",     icon:"🎯",label:"Leads Campaña",      count:leadsCampana.length},
    {id:"libre",       icon:"📋",label:"Leads Libre",         count:leadsLibre.length},
    {id:"basedatos",   icon:"🗄️",label:"Base Datos Leads",   count:leadsBaseDatos.length},
    {id:"kpis",        icon:"📊",label:"KPIs Generales"},
    {id:"kpiscampana", icon:"🎯",label:"KPIs por Campaña"},
    {id:"embudo",      icon:"🔻",label:"Embudo Conversión"},
  ];

  return (
    <div style={{display:"flex",height:"100vh",background:"#f0f2f5",color:"#1a1a1a",overflow:"hidden",fontFamily:"'DM Mono','Fira Code',monospace"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Outfit:wght@400;600;700;800;900&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        ::-webkit-scrollbar{width:4px;height:4px}::-webkit-scrollbar-track{background:#f0f2f5}::-webkit-scrollbar-thumb{background:#d0d5dd;border-radius:4px}
        input,textarea,select{outline:none;font-family:inherit;}
        @keyframes spin{to{transform:rotate(360deg)}}@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
      `}</style>

      {/* SIDEBAR */}
      <div style={{width:200,background:"#1a3a6b",borderRight:"1px solid #ffffff20",display:"flex",flexDirection:"column",flexShrink:0}}>
        <div style={{padding:"20px 16px",borderBottom:"1px solid #ffffff20"}}>
          <div style={{fontSize:20,fontWeight:900,letterSpacing:-1,fontFamily:"'Outfit',sans-serif"}}>
            <span style={{color:"#FF6B00"}}>BIGPRO</span><span style={{color:"#ffffff"}}> FLOTA</span>
          </div>
          <div style={{fontSize:9,color:"#ffffff88",fontWeight:700,letterSpacing:2,marginTop:3}}>BIGPRO · CRM LIVE</div>
        </div>
        <nav style={{flex:1,padding:"10px 10px"}}>
          {NAV.map(item=>(
            <button key={item.id} onClick={()=>setSeccion(item.id)}
              style={{width:"100%",display:"flex",alignItems:"center",gap:10,padding:"9px 12px",borderRadius:8,
                background:seccion===item.id?"#1a3a6b":"none",border:seccion===item.id?"1px solid #e4e7ec":"1px solid transparent",
                color:seccion===item.id?"#f1f5f9":"#475569",cursor:"pointer",fontSize:12,
                fontWeight:seccion===item.id?700:500,marginBottom:3,transition:"all .2s",textAlign:"left",fontFamily:"'Outfit',sans-serif"}}>
              <span style={{fontSize:14,color:seccion===item.id?"#ffffff":"#aac3e8"}}>{item.icon}</span>
              {item.label}
              {item.count!==undefined&&<span style={{marginLeft:"auto",background:"#3B82F622",color:"#3B82F6",fontSize:9,fontWeight:800,padding:"1px 6px",borderRadius:20}}>{item.count}</span>}
            </button>
          ))}
        </nav>
        <div style={{padding:12,borderBottom:"1px solid #ffffff20"}}>
          <button onClick={fetchLeads} style={{width:"100%",background:"#1a3a6b",border:"1px solid #e4e7ec",color:"#888888",borderRadius:8,padding:"7px",fontSize:11,cursor:"pointer",fontWeight:600,fontFamily:"'Outfit',sans-serif"}}>🔄 Actualizar</button>
          {lastUpdate&&<div style={{fontSize:9,color:"#aaaaaa",textAlign:"center",marginTop:4}}>{lastUpdate.toLocaleTimeString("es-CL",{hour:"2-digit",minute:"2-digit"})}</div>}
        </div>
        <div style={{padding:12}}>
          <div style={{background:"#1a3a6b",border:"1px solid #e4e7ec",borderRadius:8,padding:"8px 10px"}}>
            <div style={{fontSize:9,color:"#aaaaaa",fontWeight:700,letterSpacing:1}}>ESTADO DB</div>
            <div style={{display:"flex",alignItems:"center",gap:6,marginTop:4}}>
              <div style={{width:6,height:6,borderRadius:"50%",background:error?"#EF4444":"#10B981",animation:error?"none":"pulse 2s infinite"}}/>
              <span style={{fontSize:10,color:error?"#EF4444":"#10B981",fontWeight:700}}>{error?"Error":"Conectado"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN */}
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
        <div style={{height:56,background:"#1a3a6b",borderBottom:"1px solid #ffffff20",display:"flex",alignItems:"center",padding:"0 20px",gap:12,flexShrink:0}}>
          <div style={{flex:1,display:"flex",gap:10,alignItems:"center"}}>
            {(seccion==="campana"||seccion==="libre")&&(
              <>
                <input value={busqueda} onChange={e=>setBusqueda(e.target.value)} placeholder="🔍 Buscar leads..."
                  style={{background:"#ffffff",color:"#1a1a1a",border:"1px solid #e4e7ec",borderRadius:7,padding:"6px 12px",fontSize:12,width:220}}/>
                <div style={{display:"flex",background:"#ffffff",border:"1px solid #e4e7ec",borderRadius:7,overflow:"hidden"}}>
                  {[["pipeline","⬛ Kanban"],["lista","☰ Lista"]].map(([v,label])=>(
                    <button key={v} onClick={()=>setVista(v)} style={{padding:"6px 12px",background:vista===v?"#F47B20":"none",border:"none",color:vista===v?"#ffffff":"#ffffffaa",cursor:"pointer",fontSize:11,fontWeight:vista===v?700:400}}>{label}</button>
                  ))}
                </div>
              </>
            )}
            {seccion==="basedatos"&&(
              <input value={busqueda} onChange={e=>setBusqueda(e.target.value)} placeholder="🔍 Buscar leads..."
                style={{background:"#ffffff",color:"#1a1a1a",border:"1px solid #e4e7ec",borderRadius:7,padding:"6px 12px",fontSize:12,width:220}}/>
            )}
            <div style={{fontSize:11,color:"#888888"}}>
              {seccion==="dashboard"  &&"📊 Resumen en tiempo real"}
              {seccion==="campana"    &&`🎯 ${leadsCampana.length} leads de campaña · ordenados por fecha y puntaje`}
              {seccion==="libre"      &&`📋 ${leadsLibre.length} leads postulación libre · ordenados por fecha`}
              {seccion==="basedatos"  &&`🗄️ ${leadsBaseDatos.length} leads · tibios, fríos, rechazados y no calificados`}
              {seccion==="kpis"       &&"📊 KPIs Generales"}
              {seccion==="kpiscampana"&&"🎯 KPIs por Campaña"}
            </div>
          </div>
          <div style={{background:"#dcfce7",border:"1px solid #86efac",borderRadius:7,padding:"5px 10px",fontSize:10,color:"#166534",fontWeight:700}}>⚡ N8N Activo</div>
          {(()=>{const {olvidados,estancados}=calcAlertas(leads);const total=olvidados.length+estancados.length;return total>0?(
            <button onClick={()=>setShowAlertas(true)} style={{position:"relative",background:"#EF444422",border:"1px solid #EF444466",borderRadius:7,padding:"5px 10px",fontSize:13,cursor:"pointer",display:"flex",alignItems:"center",gap:4}}>
              🔔
              <span style={{position:"absolute",top:-5,right:-5,background:"#EF4444",color:"white",borderRadius:"50%",width:16,height:16,fontSize:9,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center"}}>{total}</span>
            </button>
          ):null;})()}
        </div>

        <div style={{flex:1,overflow:"auto",padding:20,display:"flex",flexDirection:"column"}}>
          {loading?<Spinner/>:error?(
            <div style={{background:"#fff5f5",border:"1px solid #fca5a5",borderRadius:12,padding:24,textAlign:"center"}}>
              <div style={{fontSize:24,marginBottom:8}}>⚠️</div>
              <div style={{fontSize:14,color:"#EF4444",fontWeight:700}}>{error}</div>
              <button onClick={fetchLeads} style={{marginTop:12,background:"#f4f5f7",color:"#666666",border:"1px solid #aaaaaa",borderRadius:8,padding:"8px 16px",fontSize:12,cursor:"pointer"}}>Reintentar</button>
            </div>
          ):(
            <div style={{flex:1,display:"flex",flexDirection:"column",minHeight:0}}>
              {seccion==="dashboard"  &&<DashboardMetrics leads={leads}/>}
              {seccion==="campana"    &&(vista==="pipeline"?<Pipeline leads={leadsCampana} onSelect={setSelectedLead} onEtapaChange={handleEtapaChange}/>:<TablaLeads leads={leadsCampana} onSelect={setSelectedLead}/>)}
              {seccion==="libre"      &&(vista==="pipeline"?<Pipeline leads={leadsLibre}   onSelect={setSelectedLead} onEtapaChange={handleEtapaChange}/>:<TablaLeads leads={leadsLibre}   onSelect={setSelectedLead}/>)}
              {seccion==="basedatos"  &&<TablaLeads leads={leadsBaseDatos} onSelect={setSelectedLead}/>}
              {seccion==="kpis"       &&<KPIsView leads={leads}/>}
              {seccion==="kpiscampana"&&<KPIsCampanaView leads={leads}/>}
              {seccion==="embudo"     &&<EmbudoView leads={leads}/>}
            </div>
          )}
        </div>
      </div>

      {selectedLead&&<LeadPanel lead={selectedLead} onClose={()=>setSelectedLead(null)} onUpdate={handleLeadUpdate} onEtapaChangeRequest={handleEtapaChange}/>}
      {showAlertas&&<AlertasPopup leads={leads} onClose={()=>setShowAlertas(false)} onVerLead={(lead)=>{setSelectedLead(lead);setSeccion(lead.tipo_postulacion==="libre"?"libre":"campana");}}/>}
      {confirmModal&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:400}}>
          <div style={{background:"#ffffff",borderRadius:14,padding:28,width:400,boxShadow:"0 20px 60px rgba(0,0,0,.3)"}}>
            <div style={{fontSize:16,fontWeight:900,color:"#1a1a1a",fontFamily:"'Outfit',sans-serif",marginBottom:6}}>¿Confirmar cambio de etapa?</div>
            <div style={{fontSize:12,color:"#555555",marginBottom:20}}>Lead: <strong>{confirmModal.lead.nombre||"Sin nombre"}</strong></div>
            <div style={{display:"flex",alignItems:"center",gap:12,background:"#f0f2f5",borderRadius:10,padding:"14px 16px",marginBottom:20}}>
              <div style={{flex:1,textAlign:"center"}}>
                <div style={{fontSize:10,color:"#888888",marginBottom:4}}>ETAPA ACTUAL</div>
                <div style={{fontSize:13,fontWeight:800,color:ETAPA_CFG[confirmModal.etapaActual]?.color||"#888888"}}>{ETAPA_CFG[confirmModal.etapaActual]?.icon} {confirmModal.etapaActual}</div>
              </div>
              <div style={{fontSize:20,color:"#aaaaaa"}}>→</div>
              <div style={{flex:1,textAlign:"center"}}>
                <div style={{fontSize:10,color:"#888888",marginBottom:4}}>NUEVA ETAPA</div>
                <div style={{fontSize:13,fontWeight:800,color:ETAPA_CFG[confirmModal.nuevaEtapa]?.color||"#888888"}}>{ETAPA_CFG[confirmModal.nuevaEtapa]?.icon} {confirmModal.nuevaEtapa}</div>
              </div>
            </div>
            <div style={{display:"flex",gap:10}}>
              <button onClick={()=>setConfirmModal(null)} style={{flex:1,background:"#f0f2f5",color:"#475569",border:"none",borderRadius:8,padding:"10px",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>Cancelar</button>
              <button onClick={confirmarCambioEtapa} style={{flex:1,background:"#1a3a6b",color:"white",border:"none",borderRadius:8,padding:"10px",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>✓ Confirmar cambio</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
