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
