import { useState, useEffect, useRef } from "react";

// ─── CONFIGURACIÓN SUPABASE ───────────────────────────────────────────────────
const SUPABASE_URL = "https://psvdtgjvognbmxfvqbaa.supabase.co";
const SUPABASE_KEY = "sb_publishable_RayW0wqgesNI6FYZ6i0CFQ_6YHaHELP";

const sb = {
  from: (table) => ({
    select: async (cols = "*", opts = {}) => {
      let url = `${SUPABASE_URL}/rest/v1/${table}?select=${cols}`;
      if (opts.filter) url += `&${opts.filter}`;
      if (opts.order) url += `&order=${opts.order}`;
      const r = await fetch(url, { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } });
      return r.json();
    },
    update: async (data, filter) => {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${filter}`, {
        method: "PATCH",
        headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json", Prefer: "return=representation" },
        body: JSON.stringify(data),
      });
      return r.json();
    },
    insert: async (data) => {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
        method: "POST",
        headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json", Prefer: "return=representation" },
        body: JSON.stringify(data),
      });
      return r.json();
    },
    delete: async (filter) => {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${filter}`, {
        method: "DELETE",
        headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
      });
      return r.ok;
    },
  }),
};

// ─── CONSTANTES ───────────────────────────────────────────────────────────────
const ETAPAS_PIPELINE = ["Nuevo Lead","Contactado","Reunión Agendada","Propuesta Enviada","Negociación"];
const ETAPAS_CIERRE   = ["Ganado","Perdido"];
const ETAPAS_TODAS    = [...ETAPAS_PIPELINE, ...ETAPAS_CIERRE];

const ETAPA_CFG = {
  "Nuevo Lead":        { color:"#3B82F6", icon:"🎯" },
  "Contactado":        { color:"#8B5CF6", icon:"📞" },
  "Reunión Agendada":  { color:"#F59E0B", icon:"📅" },
  "Propuesta Enviada": { color:"#F97316", icon:"📄" },
  "Negociación":       { color:"#EC4899", icon:"🤝" },
  "Ganado":            { color:"#10B981", icon:"✅" },
  "Perdido":           { color:"#EF4444", icon:"❌" },
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
  const d = new Date(iso), diff = (Date.now()-d)/1000;
  if (diff<3600)   return `Hace ${Math.floor(diff/60)}m`;
  if (diff<86400)  return `Hace ${Math.floor(diff/3600)}h`;
  if (diff<604800) return `Hace ${Math.floor(diff/86400)}d`;
  return d.toLocaleDateString("es-CL",{day:"2-digit",month:"short"});
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

const CanalTag = ({ canal }) => { const cfg=getCanalCfg(canal); return <Tag label={`${cfg.icon} ${cfg.label}`} color={cfg.color}/>; };

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
        <ScoreDot score={lead.score}/>
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
    <div style={{width:ETAPAS_CIERRE.includes(etapa)?220:245,flexShrink:0}}
      onDragOver={e=>{e.preventDefault();setDragOver(etapa);}}
      onDragLeave={()=>setDragOver(null)}
      onDrop={e=>{onDrop(e,etapa);setDragOver(null);}}>
      <div style={{padding:"8px 12px",background:"#ffffff",borderRadius:"10px 10px 0 0",
        borderBottom:`2px solid ${isDragOver?cfg.color:"#888888"}`,
        display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <span style={{fontSize:10,fontWeight:800,color:isDragOver?cfg.color:"#888888",textTransform:"uppercase",letterSpacing:1}}>{cfg.icon} {etapa}</span>
        <span style={{fontSize:10,fontWeight:800,background:cfg.color+"22",color:cfg.color,padding:"2px 8px",borderRadius:20}}>{leads.length}</span>
      </div>
      <div style={{minHeight:400,background:isDragOver?cfg.color+"08":"#f0f2f5",borderRadius:"0 0 10px 10px",
        padding:8,display:"flex",flexDirection:"column",gap:7,
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
    const mapa={"nuevo lead":"Nuevo Lead","nuevo":"Nuevo Lead","new":"Nuevo Lead","postulante":"Nuevo Lead","contactado":"Contactado","reunión agendada":"Reunión Agendada","reunion agendada":"Reunión Agendada","propuesta enviada":"Propuesta Enviada","negociación":"Negociación","negociacion":"Negociación","ganado":"Ganado","perdido":"Perdido"};
    return mapa[e.toLowerCase().trim()]||e;
  };
  const lpe=(etapa)=>leads.filter(l=>normalizarEtapa(l.etapa)===etapa);
  return (
    <div style={{overflowX:"auto",paddingBottom:12}}>
      <div style={{display:"flex",gap:10,minWidth:"fit-content"}}>
        {ETAPAS_PIPELINE.map(e=><KanbanCol key={e} etapa={e} leads={lpe(e)} onSelect={onSelect} onDragStart={handleDragStart} onDrop={handleDrop} isDragOver={dragOver===e} setDragOver={setDragOver}/>)}
        <div style={{width:2,background:"linear-gradient(to bottom,transparent,#aaaaaa,transparent)",borderRadius:4,flexShrink:0,margin:"0 4px"}}/>
        {ETAPAS_CIERRE.map(e=><KanbanCol key={e} etapa={e} leads={lpe(e)} onSelect={onSelect} onDragStart={handleDragStart} onDrop={handleDrop} isDragOver={dragOver===e} setDragOver={setDragOver}/>)}
      </div>
      <div style={{marginTop:10,fontSize:10,color:"#aaaaaa",textAlign:"center"}}>
        💡 Arrastra tarjetas entre columnas · O haz clic para abrir el detalle
      </div>
    </div>
  );
};

// ─── KPIs ─────────────────────────────────────────────────────────────────────
const KPIsView = ({ leads }) => {
  const ganados=leads.filter(l=>l.etapa==="Ganado"),perdidos=leads.filter(l=>l.etapa==="Perdido");
  const cerrados=ganados.length+perdidos.length;
  const tasaCierre=cerrados>0?Math.round((ganados.length/cerrados)*100):0;
  const tiempos=ganados.map(l=>diasEntre(l.created_at,l.updated_at)).filter(d=>d!==null);
  const tiempoPromedio=tiempos.length?Math.round(tiempos.reduce((a,b)=>a+b,0)/tiempos.length):null;
  const canales={};
  leads.forEach(l=>{const c=(l.canal||"desconocido").toLowerCase();if(!canales[c])canales[c]={total:0,ganados:0};canales[c].total++;if(l.etapa==="Ganado")canales[c].ganados++;});
  const canalStats=Object.entries(canales).map(([canal,d])=>({canal,total:d.total,ganados:d.ganados,eficacia:d.total>0?Math.round((d.ganados/d.total)*100):0})).sort((a,b)=>b.eficacia-a.eficacia);
  const canalEficaz=canalStats[0],canalMenos=canalStats[canalStats.length-1],canalVol=[...canalStats].sort((a,b)=>b.total-a.total)[0];
  const scoreEtapa=ETAPAS_TODAS.map(e=>{const ls=leads.filter(l=>(l.etapa||"Nuevo Lead")===e);return{etapa:e,score:ls.length?Math.round(ls.reduce((a,l)=>a+(l.score||0),0)/ls.length):0,count:ls.length};}).filter(e=>e.count>0);
  return (
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
        {[["✅","Tasa de cierre",`${tasaCierre}%`,"#10B981",`${ganados.length} ganados de ${cerrados}`],["⏱","Tiempo promedio",tiempoPromedio!==null?`${tiempoPromedio}d`:"—","#3B82F6","Días lead→Ganado"],["📈","Leads ganados",ganados.length,"#10B981",`${perdidos.length} perdidos`],["📉","Leads perdidos",perdidos.length,"#EF4444",`${cerrados>0?Math.round((perdidos.length/cerrados)*100):0}% del cerrado`]].map(([icon,label,val,color,sub])=>(
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
                <div style={{textAlign:"center"}}><div style={{fontSize:22,fontWeight:900,color:"#10B981",fontFamily:"monospace"}}>{canal.ganados}</div><div style={{fontSize:9,color:"#555555"}}>GANADOS</div></div>
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
              <div style={{display:"flex",gap:12}}><span style={{fontSize:10,color:"#555555"}}>{total} leads · {g} ganados</span><span style={{fontSize:12,fontWeight:800,color:cfg.color}}>{eficacia}%</span></div>
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

// ─── PANEL DETALLE ────────────────────────────────────────────────────────────
const LeadPanel = ({ lead, onClose, onUpdate }) => {
  const [tab,setTab]=useState("info");
  const [etapa,setEtapa]=useState(lead.etapa||"Nuevo Lead");
  const [saving,setSaving]=useState(false);
  const [saved,setSaved]=useState(false);
  const handleEtapaChange=async(newEtapa)=>{setEtapa(newEtapa);setSaving(true);try{await sb.from("leads").update({etapa:newEtapa},`id=eq.${lead.id}`);onUpdate&&onUpdate({...lead,etapa:newEtapa});setSaved(true);setTimeout(()=>setSaved(false),2000);}finally{setSaving(false);}};
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
              <CanalTag canal={lead.canal}/>
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
              {[["📞","Teléfono",lead.telefono],["📧","Email",lead.email],["📍","Zona",lead.zona],["📦","Volumen",lead.volumen],["🔗","Canal",lead.canal],["📅","Captado",formatFecha(lead.created_at)],["🔄","Actualizado",formatFecha(lead.updated_at)]].filter(([,,v])=>v).map(([icon,k,v])=>(
                <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:"1px solid #f4f5f7"}}>
                  <span style={{fontSize:12,color:"#555555"}}>{icon} {k}</span>
                  <span style={{fontSize:12,color:"#1a1a1a",fontWeight:600}}>{v}</span>
                </div>
              ))}
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
        {tab==="timeline"&&(
          <div>
            {[{icon:"🎯",label:`Captado vía ${lead.canal||"desconocido"}`,fecha:formatFecha(lead.created_at),color:"#3B82F6"},
              lead.score>0&&{icon:"⭐",label:`Score: ${lead.score} pts → ${lead.clasificacion||""}`,fecha:formatFecha(lead.updated_at),color:getScoreColor(lead.score)},
              lead.etapa!=="Nuevo Lead"&&{icon:ETAPA_CFG[lead.etapa]?.icon||"📊",label:`Etapa: ${lead.etapa}`,fecha:formatFecha(lead.updated_at),color:ETAPA_CFG[lead.etapa]?.color||"#64748b"}
            ].filter(Boolean).map((ev,i)=>(
              <div key={i} style={{display:"flex",gap:12,padding:"12px 0",borderBottom:"1px solid #f4f5f7"}}>
                <div style={{fontSize:18}}>{ev.icon}</div>
                <div style={{flex:1}}><div style={{fontSize:12,color:"#1a1a1a",fontWeight:600}}>{ev.label}</div><div style={{fontSize:10,color:"#555555",marginTop:2}}>{ev.fecha}</div></div>
                <div style={{width:8,height:8,borderRadius:"50%",background:ev.color,marginTop:6,flexShrink:0}}/>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
const DashboardMetrics = ({ leads }) => {
  const hoy=new Date();hoy.setHours(0,0,0,0);
  const nuevosHoy=leads.filter(l=>l.created_at&&new Date(l.created_at)>=hoy).length;
  const scorePromedio=leads.length?Math.round(leads.reduce((a,l)=>a+(l.score||0),0)/leads.length):0;
  const ganados=leads.filter(l=>l.etapa==="Ganado").length;
  const cerrados=ganados+leads.filter(l=>l.etapa==="Perdido").length;
  const tasaCierre=cerrados>0?Math.round((ganados/cerrados)*100):0;
  const canalData=Object.entries(leads.reduce((a,l)=>{const c=l.canal?.toLowerCase()||"otro";a[c]=(a[c]||0)+1;return a},{})).sort((a,b)=>b[1]-a[1]);
  const etapaData=ETAPAS_TODAS.map(e=>({etapa:e,count:leads.filter(l=>(l.etapa||"Nuevo Lead")===e).length}));
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
      <thead><tr style={{background:"#f0f2f5"}}>{["Prospecto","Empresa","Canal","Etapa","Score","Clasificación","Actualizado",""].map(h=><th key={h} style={{padding:"10px 14px",textAlign:"left",fontSize:9,fontWeight:800,color:"#aaaaaa",textTransform:"uppercase",letterSpacing:1}}>{h}</th>)}</tr></thead>
      <tbody>{leads.map((lead,i)=>{const cfg=ETAPA_CFG[lead.etapa]||{color:"#888888",icon:"•"};return(
        <tr key={lead.id} style={{borderTop:"1px solid #f0f2f5",background:i%2===0?"#ffffff":"#f8f9fa",cursor:"pointer"}}
          onClick={()=>onSelect(lead)} onMouseEnter={e=>e.currentTarget.style.background="#eef2ff"} onMouseLeave={e=>e.currentTarget.style.background=i%2===0?"#ffffff":"#f8f9fa"}>
          <td style={{padding:"10px 14px"}}><div style={{fontSize:12,fontWeight:700,color:"#1a1a1a"}}>{lead.nombre||"—"}</div><div style={{fontSize:10,color:"#aaaaaa"}}>{lead.email||"—"}</div></td>
          <td style={{padding:"10px 14px",fontSize:12,color:"#888888"}}>{lead.empresa||"—"}</td>
          <td style={{padding:"10px 14px"}}><CanalTag canal={lead.canal}/></td>
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
export default function App() {
  const [leads,setLeads]=useState([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState(null);
  const [seccion,setSeccion]=useState("leads");
  const [selectedLead,setSelectedLead]=useState(null);
  const [busqueda,setBusqueda]=useState("");
  const [vista,setVista]=useState("pipeline");
  const [lastUpdate,setLastUpdate]=useState(null);
  const refreshInterval=useRef(null);

  const fetchLeads=async()=>{
    try{const data=await sb.from("leads").select("*",{order:"created_at.desc"});
      if(Array.isArray(data)){setLeads(data);setLastUpdate(new Date());setError(null);}
      else setError("Error al cargar leads");
    }catch{setError("Sin conexión a Supabase");}
    finally{setLoading(false);}
  };

  useEffect(()=>{fetchLeads();refreshInterval.current=setInterval(fetchLeads,30000);return()=>clearInterval(refreshInterval.current);},[]);

  const handleEtapaChange=async(lead,nuevaEtapa)=>{
    try{await sb.from("leads").update({etapa:nuevaEtapa},`id=eq.${lead.id}`);
      setLeads(prev=>prev.map(l=>l.id===lead.id?{...l,etapa:nuevaEtapa}:l));
      if(selectedLead?.id===lead.id)setSelectedLead(p=>({...p,etapa:nuevaEtapa}));
    }catch(e){console.error(e);}
  };

  const handleLeadUpdate=(updated)=>{
    setLeads(prev=>prev.map(l=>l.id===updated.id?updated:l));
    if(selectedLead?.id===updated.id)setSelectedLead(updated);
  };

  const scoreOrden=(l)=>{
    const c=(l.clasificacion||"").toLowerCase();
    if(c.includes("caliente")) return 0;
    if(c.includes("tibio"))    return 1;
    return 2;
  };

  const leadsCampana=[...leads]
    .filter(l=>l.tipo_postulacion==="campaña"||(l.campana_id&&!l.tipo_postulacion))
    .filter(l=>(l.nombre||"").toLowerCase().includes(busqueda.toLowerCase())||(l.empresa||"").toLowerCase().includes(busqueda.toLowerCase())||(l.email||"").toLowerCase().includes(busqueda.toLowerCase()))
    .sort((a,b)=>{
      const fechaDiff=new Date(b.created_at)-new Date(a.created_at);
      if(fechaDiff!==0) return fechaDiff;
      return scoreOrden(a)-scoreOrden(b);
    });

  const leadsLibre=[...leads]
    .filter(l=>l.tipo_postulacion==="libre"||(!l.campana_id&&!l.tipo_postulacion))
    .filter(l=>(l.nombre||"").toLowerCase().includes(busqueda.toLowerCase())||(l.empresa||"").toLowerCase().includes(busqueda.toLowerCase())||(l.email||"").toLowerCase().includes(busqueda.toLowerCase()))
    .sort((a,b)=>new Date(b.created_at)-new Date(a.created_at));

  const NAV=[
    {id:"dashboard",    icon:"◈", label:"Dashboard"},
    {id:"campana",      icon:"🎯",label:"Leads Campaña",    count:leadsCampana.length},
    {id:"libre",        icon:"📋",label:"Leads Libre",       count:leadsLibre.length},
    {id:"kpis",         icon:"📊",label:"KPIs"},
    {id:"plantillas",   icon:"💬",label:"Plantillas"},
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
            <span style={{color:"#3B82F6"}}>Logi</span><span style={{color:"#1a1a1a"}}>Flow</span>
          </div>
          <div style={{fontSize:9,color:"#ffffff88",fontWeight:700,letterSpacing:2,marginTop:3}}>CRM · LIVE</div>
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
            <div style={{fontSize:11,color:"#888888"}}>
              {seccion==="dashboard" &&"📊 Resumen en tiempo real"}
              {seccion==="campana"  &&`🎯 ${leadsCampana.length} leads de campaña · ordenados por fecha y puntaje`}
              {seccion==="libre"    &&`📋 ${leadsLibre.length} leads postulación libre · ordenados por fecha`}
              {seccion==="kpis"     &&"📊 Análisis de performance"}
              {seccion==="plantillas"&&"💬 Plantillas de mensajes"}
            </div>
          </div>
          <div style={{background:"#dcfce7",border:"1px solid #86efac",borderRadius:7,padding:"5px 10px",fontSize:10,color:"#166534",fontWeight:700}}>⚡ N8N Activo</div>
        </div>

        <div style={{flex:1,overflow:"auto",padding:20}}>
          {loading?<Spinner/>:error?(
            <div style={{background:"#fff5f5",border:"1px solid #fca5a5",borderRadius:12,padding:24,textAlign:"center"}}>
              <div style={{fontSize:24,marginBottom:8}}>⚠️</div>
              <div style={{fontSize:14,color:"#EF4444",fontWeight:700}}>{error}</div>
              <button onClick={fetchLeads} style={{marginTop:12,background:"#f4f5f7",color:"#666666",border:"1px solid #aaaaaa",borderRadius:8,padding:"8px 16px",fontSize:12,cursor:"pointer"}}>Reintentar</button>
            </div>
          ):(
            <>
              {seccion==="dashboard" &&<DashboardMetrics leads={leads}/>}
              {seccion==="campana"  &&(vista==="pipeline"?<Pipeline leads={leadsCampana} onSelect={setSelectedLead} onEtapaChange={handleEtapaChange}/>:<TablaLeads leads={leadsCampana} onSelect={setSelectedLead}/>)}
              {seccion==="libre"    &&(vista==="pipeline"?<Pipeline leads={leadsLibre}   onSelect={setSelectedLead} onEtapaChange={handleEtapaChange}/>:<TablaLeads leads={leadsLibre}   onSelect={setSelectedLead}/>)}
              {seccion==="kpis"     &&<KPIsView leads={leads}/>}
              {seccion==="plantillas"&&<PlantillasView/>}
            </>
          )}
        </div>
      </div>

      {selectedLead&&<LeadPanel lead={selectedLead} onClose={()=>setSelectedLead(null)} onUpdate={handleLeadUpdate}/>}
    </div>
  );
}
