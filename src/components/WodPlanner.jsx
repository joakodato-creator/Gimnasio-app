import React, { useState, useEffect } from 'react';
import { db } from '../utils/mockData';
import { Calendar, Play, Dumbbell, Flame, Save, Plus, Trash2, Video } from 'lucide-react';

export default function WodPlanner() {
  const [wodDate, setWodDate] = useState(new Date().toISOString().split('T')[0]);
  const [wodType, setWodType] = useState('crossfit'); // 'crossfit' o 'hyrox'
  const [wodTitle, setWodTitle] = useState('');

  // Bloques dinámicos
  const [warmupBlock, setWarmupBlock] = useState({ habilitado: true, descripcion: '', ejercicios: [] });
  const [strengthBlock, setStrengthBlock] = useState({ habilitado: true, descripcion: '', ejercicios: [] });
  const [conditioningBlock, setConditioningBlock] = useState({ habilitado: true, descripcion: '', ejercicios: [] });
  const [midlineBlock, setMidlineBlock] = useState({ habilitado: true, descripcion: '', ejercicios: [] });
  const [extraBlock, setExtraBlock] = useState({ habilitado: true, descripcion: '', ejercicios: [] });

  // Estados del Asistente Gemini IA
  const [geminiApiKey, setGeminiApiKey] = useState(localStorage.getItem('gemini_api_key') || '');
  const [showApiKey, setShowApiKey] = useState(false);
  const [activeMesocycle, setActiveMesocycle] = useState('fuerza'); // 'fuerza', 'volumen', 'vo2_max', 'deload', 'peaking'
  const [includeVo2Max, setIncludeVo2Max] = useState(false);
  const [cardioType, setCardioType] = useState('running'); // 'running', 'row', 'ski', 'bike', 'mixed'
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [generatedWodPreview, setGeneratedWodPreview] = useState(null);
  const [chatMessage, setChatMessage] = useState('');
  const [aiError, setAiError] = useState('');

  // Catálogo de Ejercicios
  const [exercisesCatalog, setExercisesCatalog] = useState([]);
  
  // States para agregar ejercicio temporal a un bloque
  const [selectedExForBlock, setSelectedExForBlock] = useState({ warmup: '', strength: '', conditioning: '', midline: '', extra: '' });
  const [strengthTempPct, setStrengthTempPct] = useState(75);
  const [strengthTempReps, setStrengthTempReps] = useState('5 sets x 3 reps');

  // Formulario de agregar nuevo ejercicio al catálogo
  const [newExName, setNewExName] = useState('');
  const [newExVideo, setNewExVideo] = useState('');
  const [showAddNewExForm, setShowAddNewExForm] = useState(false);

  // Status message
  const [statusMsg, setStatusMsg] = useState({ text: '', type: '' });
  const [wods, setWods] = useState([]);

  useEffect(() => {
    loadExercises();
    loadWods();
  }, [wodDate]);

  const loadExercises = async () => {
    try {
      const list = await db.getExercises();
      setExercisesCatalog(list);
    } catch (err) {
      showMsg(err.message, 'error');
    }
  };

  const loadWods = async () => {
    try {
      const list = await db.getWods();
      setWods(list);
      
      const existing = list.find(w => w.fecha === wodDate);
      if (existing) {
        setWodTitle(existing.titulo || '');
        setWodType(existing.tipo || 'crossfit');
        
        // Adaptación / Migración
        setWarmupBlock(
          typeof existing.warmup === 'object' && existing.warmup !== null 
            ? existing.warmup 
            : { habilitado: !!existing.warmup, descripcion: existing.warmup || '', ejercicios: [] }
        );
        
        setStrengthBlock(
          typeof existing.strength === 'object' && existing.strength !== null
            ? existing.strength
            : { 
                habilitado: !!existing.strength_exercise, 
                descripcion: existing.strength_desc || '', 
                ejercicios: existing.strength_exercise ? [{ nombre: existing.strength_exercise, porcentaje: existing.strength_pct || 75, reps: existing.strength_reps || '' }] : [] 
              }
        );
        
        setConditioningBlock(
          typeof existing.conditioning === 'object' && existing.conditioning !== null
            ? existing.conditioning
            : { habilitado: !!existing.conditioning, descripcion: existing.conditioning || '', ejercicios: [] }
        );
        
        setMidlineBlock(
          typeof existing.midline === 'object' && existing.midline !== null
            ? existing.midline
            : { habilitado: !!existing.midline, descripcion: existing.midline || '', ejercicios: [] }
        );
        
        setExtraBlock(
          typeof existing.extra === 'object' && existing.extra !== null
            ? existing.extra
            : { habilitado: !!existing.extra, descripcion: existing.extra || '', ejercicios: [] }
        );
      } else {
        // Limpiar formulario para nuevo WOD
        setWodTitle('');
        setWarmupBlock({ habilitado: true, descripcion: '', ejercicios: [] });
        setStrengthBlock({ habilitado: true, descripcion: '', ejercicios: [] });
        setConditioningBlock({ habilitado: true, descripcion: '', ejercicios: [] });
        setMidlineBlock({ habilitado: true, descripcion: '', ejercicios: [] });
        setExtraBlock({ habilitado: true, descripcion: '', ejercicios: [] });
      }
    } catch (err) {
      showMsg(err.message, 'error');
    }
  };

  // Funciones de Integración con Gemini IA
  const cleanGeminiJson = (text) => {
    let clean = text.trim();
    if (clean.startsWith('```')) {
      clean = clean.replace(/^```json\s*/i, '');
      clean = clean.replace(/^```\s*/, '');
      clean = clean.replace(/```$/, '');
    }
    return clean.trim();
  };

  const handleSaveApiKey = (key) => {
    setGeminiApiKey(key);
    localStorage.setItem('gemini_api_key', key);
    showMsg('API Key de Gemini guardada.', 'success');
  };

  const handleGenerateWod = async () => {
    setAiError('');
    if (!geminiApiKey) {
      setAiError('Por favor, ingresa tu API Key de Gemini en la configuración.');
      return;
    }
    setAiLoading(true);

    const catalogNames = exercisesCatalog.map(ex => ex.name).join(', ');

    const prompt = `Eres un Entrenador de CrossFit Certificado (Nivel 3/4) y Especialista en Preparación Física Avanzada, experto en periodización deportiva y mesociclos. Tu box cuenta con el siguiente catálogo de ejercicios técnicos oficiales: [${catalogNames}].
    Genera un entrenamiento estructurado para la fecha actual (tipo de WOD: ${wodType}) en base a las siguientes configuraciones de entrenamiento:
    - Mesociclo de periodización: ${activeMesocycle} (donde 'fuerza' es fuerza máxima con bajas repeticiones >= 80% 1RM; 'volumen' es cargas moderadas con 8-12 reps; 'vo2_max' es foco en acondicionamiento metabólico cardiovascular y resistencia; 'deload' es descarga de baja intensidad; y 'peaking' es puesta a punto de alta intensidad).
    - Incluir entrenamiento específico de VO2 Max: ${includeVo2Max ? 'Sí, enfocado en ' + cardioType : 'No'}.
    - Indicación personalizada del Coach: ${aiPrompt || 'Ninguna'}.
    
    INSTRUCCIONES CLAVE DE REDACCIÓN (EXIGE MÁXIMO DETALLE):
    1. warmup: Debe ser muy detallado. Divide la descripción en sub-secciones claras (por ejemplo, 'Fase 1: Movilidad articular activa', 'Fase 2: Activación general/cardio' y 'Fase 3: Calentamiento específico con barra vacía/aproximación'). Especifica repeticiones y tiempos exactos.
    2. strength: Explica con minuciosidad las series de aproximación (warmup sets) y las series efectivas (working sets). Proporciona consejos técnicos (cues) específicos para el movimiento (ej: mantener espalda neutra, rodillas hacia afuera, etc.).
    3. conditioning: Describe el WOD con lujo de detalles: especifica el formato (AMRAP/EMOM/RFT), la duración o límite de tiempo (Time Cap), los pesos sugeridos para hombres/mujeres (Rx y Scaled) y una estrategia recomendada de ritmo (pacing) para el atleta.
    4. midline: Detalla los ejercicios auxiliares del core de forma estructurada con sus rondas y reps correspondientes.
    5. extra: Si hay VO2 Max activo, describe un protocolo intervalado deportivo preciso (con distancias, tiempos de trabajo, zonas de esfuerzo e intervalos de descanso completo).
    
    Debes retornar un objeto JSON que siga EXACTAMENTE la siguiente estructura:
    {
      "titulo": "String corto y descriptivo del entrenamiento del día",
      "warmup": {
        "habilitado": true/false,
        "descripcion": "Instrucciones detalladas de entrada en calor en español, desglosadas por fases de movilidad, activación y calentamiento específico",
        "ejercicios": ["Nombres exactos del catálogo vinculados"]
      },
      "strength": {
        "habilitado": true/false,
        "descripcion": "Instrucciones detalladas del trabajo de fuerza o habilidad técnica en español. Si está habilitado, incluye series de aproximación, series efectivas, repeticiones y porcentajes sugeridos de RM con consejos técnicos.",
        "ejercicios": [
          { "nombre": "Nombre exacto del ejercicio que coincida con el catálogo (ej: 'Back Squat' o 'Snatch')", "porcentaje": 75, "reps": "5 sets x 3 reps" }
        ]
      },
      "conditioning": {
        "habilitado": true/false,
        "descripcion": "Instrucciones completas del acondicionamiento (WOD principal) en español (ej: AMRAP, EMOM, RFT, Chipper, indicando tiempos, movimientos, pesos Rx y Scaled, y la estrategia de pacing).",
        "ejercicios": []
      },
      "midline": {
        "habilitado": true/false,
        "descripcion": "Instrucciones de core, estabilidad abdominal y accesorios en español desglosados en sets y reps",
        "ejercicios": []
      },
      "extra": {
        "habilitado": true/false,
        "descripcion": "Instrucciones de trabajo extra/cardio en español (si se seleccionó VO2 Max, diseña AQUÍ un entrenamiento intervalado deportivo específico e intenso de VO2 Max con máquinas o running, detallando distancias, zonas de esfuerzo y descansos)",
        "ejercicios": []
      }
    }
    
    IMPORTANTE: La IA puede decidir libremente desactivar (habilitado: false) partes del WOD según el enfoque (por ejemplo, si el enfoque es puramente metabólico de VO2 Max largo, puede desactivar el bloque 'strength'). Responde ÚNICAMENTE con el objeto JSON válido. No uses bloques de código markdown como \`\`\`json ni agregues texto explicativo fuera del JSON.`;

    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error?.message || 'Error en la API de Gemini');
      }

      const data = await res.json();
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const cleanJsonStr = cleanGeminiJson(rawText);
      const parsedWod = JSON.parse(cleanJsonStr);
      setGeneratedWodPreview(parsedWod);
    } catch (err) {
      console.error(err);
      setAiError(`Error de generación: ${err.message}. Asegúrate de que la API Key sea correcta.`);
    } finally {
      setAiLoading(false);
    }
  };

  const handleModifyWod = async () => {
    if (!chatMessage.trim()) return;
    setAiError('');
    setAiLoading(true);

    const catalogNames = exercisesCatalog.map(ex => ex.name).join(', ');

    const prompt = `Tienes la siguiente propuesta de entrenamiento de CrossFit (WOD) en formato JSON:
    ${JSON.stringify(generatedWodPreview || {
      titulo: wodTitle,
      warmup: warmupBlock,
      strength: strengthBlock,
      conditioning: conditioningBlock,
      midline: midlineBlock,
      extra: extraBlock
    })}
    
    El catálogo oficial de ejercicios del box es: [${catalogNames}].
    
    El coach solicita realizar la siguiente modificación: "${chatMessage}"
    
    Aplica el cambio solicitado modificando la estructura del JSON y retorna el WOD completo modificado. Si el coach te pide agregar o quitar secciones, cambia el flag 'habilitado' (true/false) de la sección correspondiente. Si agrega un ejercicio de fuerza, intenta usar un nombre exacto del catálogo para que se calculen los % de RM.
    
    Responde ÚNICAMENTE con el objeto JSON modificado, sin bloques de código markdown y sin explicaciones externas.`;

    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error?.message || 'Error al modificar WOD con Gemini');
      }

      const data = await res.json();
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const cleanJsonStr = cleanGeminiJson(rawText);
      const parsedWod = JSON.parse(cleanJsonStr);
      setGeneratedWodPreview(parsedWod);
      setChatMessage('');
    } catch (err) {
      console.error(err);
      setAiError(`Error al modificar: ${err.message}`);
    } finally {
      setAiLoading(false);
    }
  };

  const mapExercisesFromNames = (names) => {
    if (!names) return [];
    return names.map(name => {
      const catalogEx = exercisesCatalog.find(c => c.name.toLowerCase() === name.toLowerCase());
      return {
        nombre: catalogEx ? catalogEx.name : name,
        videoUrl: catalogEx ? catalogEx.videoUrl : ''
      };
    });
  };

  const handleApplyWod = () => {
    if (!generatedWodPreview) return;
    setWodTitle(generatedWodPreview.titulo || '');
    
    if (generatedWodPreview.warmup) {
      setWarmupBlock({
        habilitado: !!generatedWodPreview.warmup.habilitado,
        descripcion: generatedWodPreview.warmup.descripcion || '',
        ejercicios: mapExercisesFromNames(generatedWodPreview.warmup.ejercicios || [])
      });
    }
    
    if (generatedWodPreview.strength) {
      setStrengthBlock({
        habilitado: !!generatedWodPreview.strength.habilitado,
        descripcion: generatedWodPreview.strength.descripcion || '',
        ejercicios: (generatedWodPreview.strength.ejercicios || []).map(ex => {
          const catalogEx = exercisesCatalog.find(c => c.name.toLowerCase() === ex.nombre.toLowerCase());
          return {
            nombre: catalogEx ? catalogEx.name : ex.nombre,
            videoUrl: catalogEx ? catalogEx.videoUrl : '',
            porcentaje: Number(ex.porcentaje) || 75,
            reps: ex.reps || '5x3'
          };
        })
      });
    }
    
    if (generatedWodPreview.conditioning) {
      setConditioningBlock({
        habilitado: !!generatedWodPreview.conditioning.habilitado,
        descripcion: generatedWodPreview.conditioning.descripcion || '',
        ejercicios: mapExercisesFromNames(generatedWodPreview.conditioning.ejercicios || [])
      });
    }
    
    if (generatedWodPreview.midline) {
      setMidlineBlock({
        habilitado: !!generatedWodPreview.midline.habilitado,
        descripcion: generatedWodPreview.midline.descripcion || '',
        ejercicios: mapExercisesFromNames(generatedWodPreview.midline.ejercicios || [])
      });
    }
    
    if (generatedWodPreview.extra) {
      setExtraBlock({
        habilitado: !!generatedWodPreview.extra.habilitado,
        descripcion: generatedWodPreview.extra.descripcion || '',
        ejercicios: mapExercisesFromNames(generatedWodPreview.extra.ejercicios || [])
      });
    }

    showMsg('Entrenamiento de la IA aplicado al planificador. Recuerda guardarlo.', 'success');
    setGeneratedWodPreview(null);
  };

  const handleAddExerciseToBlock = (blockName) => {
    const exerciseName = selectedExForBlock[blockName];
    if (!exerciseName) return;

    const catalogEx = exercisesCatalog.find(ex => ex.name === exerciseName);
    if (!catalogEx) return;

    if (blockName === 'warmup') {
      setWarmupBlock(prev => ({
        ...prev,
        ejercicios: [...prev.ejercicios, { nombre: catalogEx.name, videoUrl: catalogEx.videoUrl }]
      }));
    } else if (blockName === 'strength') {
      setStrengthBlock(prev => ({
        ...prev,
        ejercicios: [
          ...prev.ejercicios, 
          { 
            nombre: catalogEx.name, 
            videoUrl: catalogEx.videoUrl, 
            porcentaje: Number(strengthTempPct), 
            reps: strengthTempReps 
          }
        ]
      }));
    } else if (blockName === 'conditioning') {
      setConditioningBlock(prev => ({
        ...prev,
        ejercicios: [...prev.ejercicios, { nombre: catalogEx.name, videoUrl: catalogEx.videoUrl }]
      }));
    } else if (blockName === 'midline') {
      setMidlineBlock(prev => ({
        ...prev,
        ejercicios: [...prev.ejercicios, { nombre: catalogEx.name, videoUrl: catalogEx.videoUrl }]
      }));
    } else if (blockName === 'extra') {
      setExtraBlock(prev => ({
        ...prev,
        ejercicios: [...prev.ejercicios, { nombre: catalogEx.name, videoUrl: catalogEx.videoUrl }]
      }));
    }

    // Reset selector
    setSelectedExForBlock(prev => ({ ...prev, [blockName]: '' }));
  };

  const handleRemoveExerciseFromBlock = (blockName, idxToRemove) => {
    if (blockName === 'warmup') {
      setWarmupBlock(prev => ({ ...prev, ejercicios: prev.ejercicios.filter((_, idx) => idx !== idxToRemove) }));
    } else if (blockName === 'strength') {
      setStrengthBlock(prev => ({ ...prev, ejercicios: prev.ejercicios.filter((_, idx) => idx !== idxToRemove) }));
    } else if (blockName === 'conditioning') {
      setConditioningBlock(prev => ({ ...prev, ejercicios: prev.ejercicios.filter((_, idx) => idx !== idxToRemove) }));
    } else if (blockName === 'midline') {
      setMidlineBlock(prev => ({ ...prev, ejercicios: prev.ejercicios.filter((_, idx) => idx !== idxToRemove) }));
    } else if (blockName === 'extra') {
      setExtraBlock(prev => ({ ...prev, ejercicios: prev.ejercicios.filter((_, idx) => idx !== idxToRemove) }));
    }
  };

  const handleCreateNewExercise = async (e) => {
    e.preventDefault();
    if (!newExName) return;

    try {
      await db.addExercise({
        name: newExName,
        videoUrl: newExVideo
      });

      setNewExName('');
      setNewExVideo('');
      setShowAddNewExForm(false);
      showMsg('Ejercicio agregado al catálogo.', 'success');
      await loadExercises();
    } catch (err) {
      showMsg(err.message, 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!wodTitle) return;

    try {
      await db.upsertWod({
        fecha: wodDate,
        tipo: wodType,
        titulo: wodTitle,
        warmup: warmupBlock,
        strength: strengthBlock,
        conditioning: conditioningBlock,
        midline: midlineBlock,
        extra: extraBlock
      });

      showMsg(`Entrenamiento publicado con éxito para el ${wodDate}.`, 'success');
      await loadWods();
    } catch (err) {
      showMsg(err.message, 'error');
    }
  };

  const showMsg = (text, type) => {
    setStatusMsg({ text, type });
    setTimeout(() => setStatusMsg({ text: '', type: '' }), 4000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Header Programación */}
      <div 
        className="glass-card" 
        style={{ 
          backgroundImage: 'linear-gradient(135deg, rgba(6, 182, 212, 0.1) 0%, rgba(17, 24, 39, 0.9) 100%)', 
          borderLeft: '4px solid var(--color-accent)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <span className="badge badge-primary">Panel del Coach</span>
            <h2 style={{ fontSize: '1.8rem', marginTop: '0.25rem' }}>Programación Deportiva Diaria</h2>
            <p>Habilita los bloques deportivos del día y carga ejercicios técnicos con videos instructivos específicos.</p>
          </div>
          <div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button 
                onClick={() => { setWodType('crossfit'); }} 
                className={`btn ${wodType === 'crossfit' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
              >
                <Dumbbell size={16} /> Programar CrossFit
              </button>
              <button 
                onClick={() => { setWodType('hyrox'); }} 
                className={`btn ${wodType === 'hyrox' ? 'btn-hyrox' : 'btn-secondary'}`}
                style={{ fontSize: '0.85rem', padding: '0.5rem 1rem', borderColor: wodType === 'hyrox' ? 'var(--color-hyrox)' : 'var(--border-glass)' }}
              >
                <Flame size={16} /> Programar HYROX
              </button>
            </div>
          </div>
        </div>
      </div>

      {statusMsg.text && (
        <div className={`badge badge-${statusMsg.type}`} style={{ padding: '0.75rem', width: '100%', fontSize: '0.95rem', justifyContent: 'center' }}>
          {statusMsg.text}
        </div>
      )}

      <div className="responsive-split" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        
        {/* Formulario Estructurado */}
        <div className="glass-card">
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            <div className="responsive-split" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.25rem' }}>
              <div className="form-group">
                <label className="form-label">Título del Entrenamiento</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Ej: Sentadillas Pesadas & Metcon en Escalera"
                  value={wodTitle}
                  onChange={(e) => setWodTitle(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Fecha de Ejecución</label>
                <input 
                  type="date" 
                  className="form-input" 
                  value={wodDate}
                  onChange={(e) => setWodDate(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* 1. Entrada en Calor */}
            <div style={{ borderBottom: '1px solid var(--border-glass)', paddingBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <label className="form-label" style={{ fontWeight: '700', color: 'var(--color-text-main)', fontSize: '1.1rem', marginBottom: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input 
                    type="checkbox" 
                    checked={warmupBlock.habilitado}
                    onChange={(e) => setWarmupBlock(prev => ({ ...prev, habilitado: e.target.checked }))}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  1. Entrada en Calor (Warm-up)
                </label>
              </div>
              
              {warmupBlock.habilitado && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <textarea 
                    className="form-textarea" 
                    rows="3" 
                    placeholder="Describa el calentamiento articular y series de aproximación..."
                    value={warmupBlock.descripcion}
                    onChange={(e) => setWarmupBlock(prev => ({ ...prev, descripcion: e.target.value }))}
                    required
                  ></textarea>
                  
                  {/* Ejercicios asociados al bloque */}
                  {warmupBlock.ejercicios.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.25rem' }}>
                      {warmupBlock.ejercicios.map((ex, idx) => (
                        <span key={idx} className="badge badge-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}>
                          {ex.nombre}
                          <Trash2 size={12} style={{ cursor: 'pointer', color: 'var(--color-danger)' }} onClick={() => handleRemoveExerciseFromBlock('warmup', idx)} />
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Carga rápida de ejercicio */}
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.25rem' }}>
                    <select 
                      className="form-select" 
                      style={{ flex: 1, padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                      value={selectedExForBlock.warmup}
                      onChange={(e) => setSelectedExForBlock(prev => ({ ...prev, warmup: e.target.value }))}
                    >
                      <option value="">-- Vincular Ejercicio del Catálogo --</option>
                      {exercisesCatalog.map(ex => <option key={ex.name} value={ex.name}>{ex.name}</option>)}
                    </select>
                    <button type="button" className="btn btn-secondary" style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem' }} onClick={() => handleAddExerciseToBlock('warmup')}>
                      Vincular
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 2. Bloque de Fuerza */}
            <div style={{ borderBottom: '1px solid var(--border-glass)', paddingBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <label className="form-label" style={{ fontWeight: '700', color: 'var(--color-primary)', fontSize: '1.1rem', marginBottom: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input 
                    type="checkbox" 
                    checked={strengthBlock.habilitado}
                    onChange={(e) => setStrengthBlock(prev => ({ ...prev, habilitado: e.target.checked }))}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  2. Bloque de Fuerza / Habilidad (Strength)
                </label>
              </div>

              {strengthBlock.habilitado && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <textarea 
                    className="form-textarea" 
                    rows="3" 
                    placeholder="Instrucciones del bloque de fuerza, descansos, etc..."
                    value={strengthBlock.descripcion}
                    onChange={(e) => setStrengthBlock(prev => ({ ...prev, descripcion: e.target.value }))}
                  ></textarea>

                  {/* Ejercicios de Fuerza asociados */}
                  {strengthBlock.ejercicios.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', background: 'rgba(255,255,255,0.01)', padding: '0.5rem', borderRadius: '4px' }}>
                      {strengthBlock.ejercicios.map((ex, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '0.4rem 0.75rem', borderRadius: '3px' }}>
                          <span style={{ fontSize: '0.85rem' }}>
                            <strong>{ex.nombre}</strong> ({ex.reps} @ {ex.porcentaje}%)
                          </span>
                          <button type="button" className="btn btn-secondary" style={{ padding: '0.2rem', minWidth: 'auto', border: 'none' }} onClick={() => handleRemoveExerciseFromBlock('strength', idx)}>
                            <Trash2 size={14} color="var(--color-danger)" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Formulario rápido para añadir ejercicio de fuerza */}
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '0.5rem', alignItems: 'end', background: 'rgba(190, 242, 100, 0.02)', padding: '0.75rem', borderRadius: '4px', border: '1px solid rgba(190,242,100,0.1)' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.7rem' }}>Ejercicio</label>
                      <select 
                        className="form-select" 
                        style={{ padding: '0.35rem', fontSize: '0.8rem' }}
                        value={selectedExForBlock.strength}
                        onChange={(e) => setSelectedExForBlock(prev => ({ ...prev, strength: e.target.value }))}
                      >
                        <option value="">-- Ejercicio --</option>
                        {exercisesCatalog.map(ex => <option key={ex.name} value={ex.name}>{ex.name}</option>)}
                      </select>
                    </div>
                    
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.7rem' }}>Porcentaje %</label>
                      <input 
                        type="number" 
                        className="form-input" 
                        style={{ padding: '0.35rem', fontSize: '0.8rem' }}
                        min="10" 
                        max="110" 
                        value={strengthTempPct} 
                        onChange={(e) => setStrengthTempPct(e.target.value)} 
                      />
                    </div>
                    
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.7rem' }}>Series y Reps</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        style={{ padding: '0.35rem', fontSize: '0.8rem' }}
                        placeholder="5x3" 
                        value={strengthTempReps} 
                        onChange={(e) => setStrengthTempReps(e.target.value)} 
                      />
                    </div>

                    <button type="button" className="btn btn-primary" style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem' }} onClick={() => handleAddExerciseToBlock('strength')}>
                      Añadir
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 3. Acondicionamiento */}
            <div style={{ borderBottom: '1px solid var(--border-glass)', paddingBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <label className="form-label" style={{ fontWeight: '700', color: 'var(--color-text-main)', fontSize: '1.1rem', marginBottom: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input 
                    type="checkbox" 
                    checked={conditioningBlock.habilitado}
                    onChange={(e) => setConditioningBlock(prev => ({ ...prev, habilitado: e.target.checked }))}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  3. Acondicionamiento (Conditioning / WOD)
                </label>
              </div>

              {conditioningBlock.habilitado && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <textarea 
                    className="form-textarea" 
                    rows="4" 
                    placeholder="Describa el WOD principal, caps de tiempo, pesos y repeticiones..."
                    value={conditioningBlock.descripcion}
                    onChange={(e) => setConditioningBlock(prev => ({ ...prev, descripcion: e.target.value }))}
                    required
                  ></textarea>

                  {/* Ejercicios asociados */}
                  {conditioningBlock.ejercicios.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {conditioningBlock.ejercicios.map((ex, idx) => (
                        <span key={idx} className="badge badge-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}>
                          {ex.nombre}
                          <Trash2 size={12} style={{ cursor: 'pointer', color: 'var(--color-danger)' }} onClick={() => handleRemoveExerciseFromBlock('conditioning', idx)} />
                        </span>
                      ))}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <select 
                      className="form-select" 
                      style={{ flex: 1, padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                      value={selectedExForBlock.conditioning}
                      onChange={(e) => setSelectedExForBlock(prev => ({ ...prev, conditioning: e.target.value }))}
                    >
                      <option value="">-- Vincular Ejercicio del Catálogo --</option>
                      {exercisesCatalog.map(ex => <option key={ex.name} value={ex.name}>{ex.name}</option>)}
                    </select>
                    <button type="button" className="btn btn-secondary" style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem' }} onClick={() => handleAddExerciseToBlock('conditioning')}>
                      Vincular
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 4. Línea Media y Accesorios */}
            <div style={{ borderBottom: '1px solid var(--border-glass)', paddingBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <label className="form-label" style={{ fontWeight: '700', color: 'var(--color-text-main)', fontSize: '1.1rem', marginBottom: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input 
                    type="checkbox" 
                    checked={midlineBlock.habilitado}
                    onChange={(e) => setMidlineBlock(prev => ({ ...prev, habilitado: e.target.checked }))}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  4. Línea Media & Accesorios (Midline)
                </label>
              </div>

              {midlineBlock.habilitado && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <textarea 
                    className="form-textarea" 
                    rows="2" 
                    placeholder="Abdominales, estabilidad, core..."
                    value={midlineBlock.descripcion}
                    onChange={(e) => setMidlineBlock(prev => ({ ...prev, descripcion: e.target.value }))}
                  ></textarea>

                  {/* Ejercicios asociados */}
                  {midlineBlock.ejercicios.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {midlineBlock.ejercicios.map((ex, idx) => (
                        <span key={idx} className="badge badge-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}>
                          {ex.nombre}
                          <Trash2 size={12} style={{ cursor: 'pointer', color: 'var(--color-danger)' }} onClick={() => handleRemoveExerciseFromBlock('midline', idx)} />
                        </span>
                      ))}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <select 
                      className="form-select" 
                      style={{ flex: 1, padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                      value={selectedExForBlock.midline}
                      onChange={(e) => setSelectedExForBlock(prev => ({ ...prev, midline: e.target.value }))}
                    >
                      <option value="">-- Vincular Ejercicio del Catálogo --</option>
                      {exercisesCatalog.map(ex => <option key={ex.name} value={ex.name}>{ex.name}</option>)}
                    </select>
                    <button type="button" className="btn btn-secondary" style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem' }} onClick={() => handleAddExerciseToBlock('midline')}>
                      Vincular
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 5. Extra */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <label className="form-label" style={{ fontWeight: '700', color: 'var(--color-text-main)', fontSize: '1.1rem', marginBottom: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input 
                    type="checkbox" 
                    checked={extraBlock.habilitado}
                    onChange={(e) => setExtraBlock(prev => ({ ...prev, habilitado: e.target.checked }))}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  5. Trabajo Extra / Opcional (Machine Conditioning)
                </label>
              </div>

              {extraBlock.habilitado && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <textarea 
                    className="form-textarea" 
                    rows="2" 
                    placeholder="Machine conditioning, remo, bici..."
                    value={extraBlock.descripcion}
                    onChange={(e) => setExtraBlock(prev => ({ ...prev, descripcion: e.target.value }))}
                  ></textarea>

                  {/* Ejercicios asociados */}
                  {extraBlock.ejercicios.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {extraBlock.ejercicios.map((ex, idx) => (
                        <span key={idx} className="badge badge-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}>
                          {ex.nombre}
                          <Trash2 size={12} style={{ cursor: 'pointer', color: 'var(--color-danger)' }} onClick={() => handleRemoveExerciseFromBlock('extra', idx)} />
                        </span>
                      ))}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <select 
                      className="form-select" 
                      style={{ flex: 1, padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                      value={selectedExForBlock.extra}
                      onChange={(e) => setSelectedExForBlock(prev => ({ ...prev, extra: e.target.value }))}
                    >
                      <option value="">-- Vincular Ejercicio del Catálogo --</option>
                      {exercisesCatalog.map(ex => <option key={ex.name} value={ex.name}>{ex.name}</option>)}
                    </select>
                    <button type="button" className="btn btn-secondary" style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem' }} onClick={() => handleAddExerciseToBlock('extra')}>
                      Vincular
                    </button>
                  </div>
                </div>
              )}
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', gap: '0.5rem', marginTop: '1rem' }}>
              <Save size={18} /> Publicar Entrenamiento del Día
            </button>

          </form>
        </div>

        {/* Sidebar Informativo */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Asistente de Programación Gemini IA */}
          <div className="glass-card" style={{ borderLeft: '4px solid var(--color-accent)', backgroundImage: 'linear-gradient(135deg, rgba(6, 182, 212, 0.05) 0%, rgba(17, 24, 39, 0.95) 100%)' }}>
            <h4 style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.75rem', color: 'var(--color-accent)' }}>
              🤖 Asistente Gemini IA
            </h4>
            <p style={{ fontSize: '0.8rem', marginBottom: '1rem', color: 'var(--color-text-muted)' }}>
              Genera planificaciones de WOD adaptadas a mesociclos y objetivos de VO2 Max.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {/* API Key Input */}
              <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                <label className="form-label" style={{ fontSize: '0.75rem', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Gemini API Key</span>
                  <span 
                    style={{ cursor: 'pointer', color: 'var(--color-accent)', textDecoration: 'underline' }}
                    onClick={() => setShowApiKey(!showApiKey)}
                  >
                    {showApiKey ? 'Ocultar' : 'Ver'}
                  </span>
                </label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input 
                    type={showApiKey ? 'text' : 'password'} 
                    className="form-input" 
                    style={{ padding: '0.35rem', fontSize: '0.8rem', flex: 1 }}
                    placeholder="AIzaSy..."
                    value={geminiApiKey}
                    onChange={(e) => handleSaveApiKey(e.target.value)}
                  />
                </div>
              </div>

              {/* Mesocycle Focus */}
              <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                <label className="form-label" style={{ fontSize: '0.75rem' }}>Mesociclo Activo</label>
                <select 
                  className="form-select" 
                  style={{ padding: '0.35rem', fontSize: '0.8rem' }}
                  value={activeMesocycle}
                  onChange={(e) => setActiveMesocycle(e.target.value)}
                >
                  <option value="fuerza">Fuerza Máxima (Foco 1RM)</option>
                  <option value="volumen">Volumen / Hipertrofia (Cargas medias)</option>
                  <option value="vo2_max">Entrenamiento VO2 Max (Resistencia/Metabólico)</option>
                  <option value="deload">Descarga / Transición (Baja intensidad)</option>
                  <option value="peaking">Puesta a punto (Alta intensidad)</option>
                </select>
              </div>

              {/* VO2 Max Checkbox and machine */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', background: 'rgba(255,255,255,0.01)', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border-glass)', marginBottom: '0.5rem' }}>
                <label style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: 'var(--color-text-main)' }}>
                  <input 
                    type="checkbox" 
                    checked={includeVo2Max}
                    onChange={(e) => setIncludeVo2Max(e.target.checked)}
                    style={{ width: '15px', height: '15px' }}
                  />
                  Incluir Intervalos VO2 Max
                </label>

                {includeVo2Max && (
                  <div className="form-group" style={{ marginBottom: 0, marginTop: '0.25rem' }}>
                    <label className="form-label" style={{ fontSize: '0.7rem' }}>Máquina / Cardio Focus</label>
                    <select 
                      className="form-select" 
                      style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                      value={cardioType}
                      onChange={(e) => setCardioType(e.target.value)}
                    >
                      <option value="running">Running / Carrera de intervalos</option>
                      <option value="row">Remo (Rowing Ergometer)</option>
                      <option value="ski">SkiErg (Esquí de fondo)</option>
                      <option value="bike">Assault Bike / AirBike</option>
                      <option value="mixed">Mixto (Combinado de máquinas)</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Custom Prompt Instructions */}
              <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                <label className="form-label" style={{ fontSize: '0.75rem' }}>Indicaciones Especiales (Prompt)</label>
                <textarea 
                  className="form-textarea" 
                  rows="2" 
                  style={{ padding: '0.35rem', fontSize: '0.8rem' }}
                  placeholder="Ej: 'WOD largo de gimnasia', 'sentadilla frontal pesada', etc."
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                />
              </div>

              {aiError && (
                <div className="badge badge-danger" style={{ fontSize: '0.75rem', padding: '0.5rem', display: 'block', wordBreak: 'break-word', color: 'var(--color-danger)' }}>
                  {aiError}
                </div>
              )}

              <button 
                type="button" 
                className="btn btn-primary" 
                style={{ width: '100%', fontSize: '0.85rem', gap: '0.5rem' }}
                onClick={handleGenerateWod}
                disabled={aiLoading}
              >
                {aiLoading ? 'Generando...' : 'Generar WOD con Gemini'}
              </button>
            </div>

            {/* Generated WOD Preview and Chat */}
            {generatedWodPreview && (
              <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-glass)' }}>
                <h5 style={{ color: 'var(--color-accent)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                  Propuesta Generada:
                </h5>
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.75rem', borderRadius: '4px', fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '250px', overflowY: 'auto', marginBottom: '0.75rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <strong>Título: {generatedWodPreview.titulo}</strong>
                  {generatedWodPreview.warmup?.habilitado && (
                    <div>
                      <span style={{ color: 'var(--color-accent)', fontWeight: 'bold' }}>1. Calentamiento:</span>
                      <p style={{ margin: '0.1rem 0 0 0.5rem', whiteSpace: 'pre-line' }}>{generatedWodPreview.warmup.descripcion}</p>
                    </div>
                  )}
                  {generatedWodPreview.strength?.habilitado && (
                    <div>
                      <span style={{ color: 'var(--color-primary)', fontWeight: 'bold' }}>2. Fuerza/Habilidad:</span>
                      <p style={{ margin: '0.1rem 0 0 0.5rem', whiteSpace: 'pre-line' }}>{generatedWodPreview.strength.descripcion}</p>
                    </div>
                  )}
                  {generatedWodPreview.conditioning?.habilitado && (
                    <div>
                      <span style={{ color: 'var(--color-text-main)', fontWeight: 'bold' }}>3. Conditioning (WOD):</span>
                      <p style={{ margin: '0.1rem 0 0 0.5rem', whiteSpace: 'pre-line' }}>{generatedWodPreview.conditioning.descripcion}</p>
                    </div>
                  )}
                  {generatedWodPreview.midline?.habilitado && (
                    <div>
                      <span style={{ color: 'var(--color-text-main)', fontWeight: 'bold' }}>4. Core / Accesorios:</span>
                      <p style={{ margin: '0.1rem 0 0 0.5rem', whiteSpace: 'pre-line' }}>{generatedWodPreview.midline.descripcion}</p>
                    </div>
                  )}
                  {generatedWodPreview.extra?.habilitado && (
                    <div>
                      <span style={{ color: 'var(--color-hyrox)', fontWeight: 'bold' }}>5. Extra / VO2 Max:</span>
                      <p style={{ margin: '0.1rem 0 0 0.5rem', whiteSpace: 'pre-line' }}>{generatedWodPreview.extra.descripcion}</p>
                    </div>
                  )}
                </div>

                {/* Modificaciones chat input */}
                <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>¿Quieres hacer algún cambio? (Chatea con la IA)</label>
                  <div style={{ display: 'flex', gap: '0.35rem' }}>
                    <input 
                      type="text" 
                      className="form-input" 
                      style={{ padding: '0.35rem', fontSize: '0.8rem', flex: 1 }}
                      placeholder="Ej: 'Quita el bloque de core' o 'Cambia el ejercicio'"
                      value={chatMessage}
                      onChange={(e) => setChatMessage(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleModifyWod(); }}
                    />
                    <button 
                      type="button" 
                      className="btn btn-secondary" 
                      style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                      onClick={handleModifyWod}
                      disabled={aiLoading}
                    >
                      Modificar
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                  <button 
                    type="button" 
                    className="btn btn-primary" 
                    style={{ flex: 1, fontSize: '0.8rem', padding: '0.5rem' }}
                    onClick={handleApplyWod}
                  >
                    Aplicar al Planificador
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    style={{ fontSize: '0.8rem', padding: '0.5rem' }}
                    onClick={() => setGeneratedWodPreview(null)}
                  >
                    Descartar
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Botón para abrir el panel de nuevo ejercicio */}
          <div className="glass-card" style={{ background: 'rgba(6, 182, 212, 0.03)' }}>
            <h4 style={{ display: 'flex', gap: '0.25rem', alignItems: 'center', marginBottom: '0.5rem', color: 'var(--color-accent)' }}>
              <Plus size={16} /> Agregar al Catálogo
            </h4>
            <p style={{ fontSize: '0.8rem', marginBottom: '0.75rem' }}>
              Crea ejercicios nuevos con su respectiva URL de video para usarlos en la programación.
            </p>
            {!showAddNewExForm ? (
              <button type="button" className="btn btn-secondary" style={{ width: '100%', fontSize: '0.8rem' }} onClick={() => setShowAddNewExForm(true)}>
                Crear Nuevo Ejercicio
              </button>
            ) : (
              <form onSubmit={handleCreateNewExercise} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.75rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Nombre del Ejercicio</label>
                  <input type="text" className="form-input" style={{ padding: '0.35rem' }} placeholder="Ej: Overhead Squat" value={newExName} onChange={(e) => setNewExName(e.target.value)} required />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Video YouTube (Embed Link)</label>
                  <input type="text" className="form-input" style={{ padding: '0.35rem' }} placeholder="Ej: https://www.youtube.com/embed/..." value={newExVideo} onChange={(e) => setNewExVideo(e.target.value)} />
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1, fontSize: '0.75rem', padding: '0.4rem' }}>Guardar</button>
                  <button type="button" className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '0.4rem' }} onClick={() => setShowAddNewExForm(false)}>Cancelar</button>
                </div>
              </form>
            )}
          </div>

          <div className="glass-card" style={{ borderLeft: '3px solid var(--color-hyrox)' }}>
            <h4>Entrenamientos Guardados</h4>
            <p style={{ fontSize: '0.8rem', marginBottom: '1rem' }}>Lista de entrenamientos cargados por fecha.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', overflowY: 'auto', maxHeight: '350px' }}>
              {wods.map(w => (
                <div 
                  key={w.id} 
                  style={{ 
                    padding: '0.75rem', 
                    background: 'rgba(255,255,255,0.02)', 
                    border: '1px solid var(--border-glass)',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                  onClick={() => setWodDate(w.fecha)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem' }}>
                    <span className={w.tipo === 'hyrox' ? 'badge badge-hyrox' : 'badge badge-primary'} style={{ fontSize: '0.6rem' }}>
                      {w.tipo ? w.tipo.toUpperCase() : 'CROSSFIT'}
                    </span>
                    <strong>{w.fecha}</strong>
                  </div>
                  <h5 style={{ fontSize: '0.85rem', marginTop: '0.25rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{w.titulo}</h5>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
