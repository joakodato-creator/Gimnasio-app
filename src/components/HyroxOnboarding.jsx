import React, { useState } from 'react';
import { Trophy, Flame, Activity, Info, ChevronRight } from 'lucide-react';
import { db } from '../utils/mockData';

export default function HyroxOnboarding({ user, onUpdateUser, onBaselineSaved }) {
  const [gender, setGender] = useState('male');
  const [category, setCategory] = useState('open');
  
  // Input states (strings for flexible parsing of mm:ss)
  const [run1k, setRun1k] = useState('04:30');
  const [row1k, setRow1k] = useState('04:15');
  const [sledPush, setSledPush] = useState('01:30');
  const [squat1rm, setSquat1rm] = useState('100');
  
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Helper to convert mm:ss to total seconds
  const parseTimeToSeconds = (timeStr) => {
    const cleanStr = timeStr.trim();
    if (!cleanStr) return 0;
    
    // Check format (m:ss or mm:ss)
    const parts = cleanStr.split(':');
    if (parts.length === 2) {
      const mins = parseInt(parts[0], 10);
      const secs = parseInt(parts[1], 10);
      if (!isNaN(mins) && !isNaN(secs) && secs >= 0 && secs < 60) {
        return mins * 60 + secs;
      }
    } else {
      const secs = parseInt(cleanStr, 10);
      if (!isNaN(secs)) return secs;
    }
    return -1; // Invalid format
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    
    const runSec = parseTimeToSeconds(run1k);
    const rowSec = parseTimeToSeconds(row1k);
    const sledSec = parseTimeToSeconds(sledPush);
    const squatKg = parseFloat(squat1rm);

    if (runSec <= 0) {
      setErrorMsg('Por favor ingresa un tiempo de carrera de 1K válido en formato mm:seg (Ej: 04:30).');
      return;
    }
    if (rowSec <= 0) {
      setErrorMsg('Por favor ingresa un tiempo de remo de 1K válido en formato mm:seg (Ej: 04:15).');
      return;
    }
    if (sledSec <= 0) {
      setErrorMsg('Por favor ingresa un tiempo de Sled Push de 50m válido en formato mm:seg (Ej: 01:30).');
      return;
    }
    if (isNaN(squatKg) || squatKg <= 0) {
      setErrorMsg('Por favor ingresa una marca de Sentadilla 1RM válida en kg (mayor a 0).');
      return;
    }

    setLoading(true);
    try {
      const baselineData = {
        gender,
        category,
        run1kSeconds: runSec,
        row1kSeconds: rowSec,
        sledPushSeconds: sledSec,
        squat1rmKg: squatKg,
        createdAt: new Date().toISOString().split('T')[0]
      };
      
      const updatedUser = await db.saveHyroxBaseline(user.id, baselineData);
      onUpdateUser(updatedUser);
      if (onBaselineSaved) {
        onBaselineSaved();
      }
    } catch (err) {
      console.error(err);
      const msg = err.message || err.toString();
      if (msg.includes('hyrox_baseline') || msg.includes('column') || msg.includes('PGRST204')) {
        setErrorMsg('Error: Falta la columna "hyrox_baseline" en la tabla "users" de Supabase. Ejecuta esta consulta SQL en Supabase: ALTER TABLE users ADD COLUMN IF NOT EXISTS hyrox_baseline JSONB;');
      } else {
        setErrorMsg(`Error al guardar el diagnóstico: ${msg}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '650px', margin: '0 auto', padding: '1rem' }}>
      <div 
        className="glass-card" 
        style={{ 
          padding: '2.5rem', 
          borderLeft: '4px solid var(--color-hyrox)',
          background: 'linear-gradient(135deg, rgba(255, 107, 0, 0.08) 0%, rgba(17, 24, 39, 0.95) 100%)'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <Trophy size={48} color="var(--color-hyrox)" style={{ marginBottom: '0.75rem' }} />
          <h2 style={{ fontSize: '1.8rem', fontWeight: '800', letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>
            Diagnóstico Inicial de Rendimiento
          </h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>
            Para estructurar tu rutina dinámica de 12 semanas y calcular tus pesos y ritmos de entrenamiento oficiales, necesitamos tus marcas de referencia basales.
          </p>
        </div>

        {errorMsg && (
          <div className="badge badge-danger" style={{ width: '100%', padding: '0.75rem', marginBottom: '1.5rem', justifyContent: 'center', height: 'auto', whiteSpace: 'normal', textAlign: 'center', textTransform: 'none', lineHeight: '1.4' }}>
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Fila 1: Género y Categoría */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
            <div className="form-group">
              <label className="form-label">Género del Atleta</label>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                <button
                  type="button"
                  className={`btn ${gender === 'male' ? 'btn-hyrox' : 'btn-secondary'}`}
                  style={{ flex: 1, padding: '0.6rem 1rem', fontSize: '0.85rem' }}
                  onClick={() => setGender('male')}
                >
                  Masculino
                </button>
                <button
                  type="button"
                  className={`btn ${gender === 'female' ? 'btn-hyrox' : 'btn-secondary'}`}
                  style={{ flex: 1, padding: '0.6rem 1rem', fontSize: '0.85rem' }}
                  onClick={() => setGender('female')}
                >
                  Femenino
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Categoría Competitiva</label>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                <button
                  type="button"
                  className={`btn ${category === 'open' ? 'btn-hyrox' : 'btn-secondary'}`}
                  style={{ flex: 1, padding: '0.6rem 1rem', fontSize: '0.85rem' }}
                  onClick={() => setCategory('open')}
                >
                  OPEN
                </button>
                <button
                  type="button"
                  className={`btn ${category === 'pro' ? 'btn-hyrox' : 'btn-secondary'}`}
                  style={{ flex: 1, padding: '0.6rem 1rem', fontSize: '0.85rem' }}
                  onClick={() => setCategory('pro')}
                >
                  PRO
                </button>
              </div>
            </div>
          </div>

          <div 
            style={{ 
              background: 'rgba(255, 107, 0, 0.04)', 
              border: '1px solid rgba(255, 107, 0, 0.15)', 
              padding: '0.75rem 1rem', 
              borderRadius: '6px', 
              display: 'flex', 
              gap: '0.5rem', 
              alignItems: 'center',
              fontSize: '0.8rem',
              color: 'var(--color-text-muted)'
            }}
          >
            <Info size={16} color="var(--color-hyrox)" style={{ flexShrink: 0 }} />
            <span>
              La categoría define tus cargas oficiales (Ej. Sled Push: Open Masculino 102kg, Pro 152kg; Femenino Open 74kg, Pro 107kg).
            </span>
          </div>

          <hr style={{ border: 'none', borderBottom: '1px solid var(--border-glass)', margin: '0.5rem 0' }} />

          {/* Fila 2: Carrera y Remo */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                Carrera 1K (Paso Referencia)
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="Minutos:Segundos (Ej: 04:30)"
                value={run1k}
                onChange={(e) => setRun1k(e.target.value)}
                required
              />
              <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', display: 'block', marginTop: '0.25rem' }}>
                Tu tiempo objetivo corriendo 1km fresco.
              </span>
            </div>

            <div className="form-group">
              <label className="form-label">
                Remo 1K (Tiempo Referencia)
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="Minutos:Segundos (Ej: 04:15)"
                value={row1k}
                onChange={(e) => setRow1k(e.target.value)}
                required
              />
              <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', display: 'block', marginTop: '0.25rem' }}>
                Tu mejor tiempo completando 1.000m en máquina.
              </span>
            </div>
          </div>

          {/* Fila 3: Sled Push y Sentadilla 1RM */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
            <div className="form-group">
              <label className="form-label">
                Sled Push 50m (Tiempo Referencia)
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="Minutos:Segundos (Ej: 01:30)"
                value={sledPush}
                onChange={(e) => setSledPush(e.target.value)}
                required
              />
              <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', display: 'block', marginTop: '0.25rem' }}>
                Tiempo de empuje de trineo en 50m con peso base.
              </span>
            </div>

            <div className="form-group">
              <label className="form-label">
                Sentadilla Frontal / Back (1RM)
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="number"
                  className="form-input"
                  placeholder="Peso en kg (Ej: 100)"
                  value={squat1rm}
                  onChange={(e) => setSquat1rm(e.target.value)}
                  required
                  style={{ paddingRight: '2.5rem' }}
                />
                <span style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                  kg
                </span>
              </div>
              <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', display: 'block', marginTop: '0.25rem' }}>
                Tu repetición máxima en sentadilla de fuerza.
              </span>
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-hyrox" 
            disabled={loading}
            style={{ 
              marginTop: '1rem', 
              padding: '0.85rem', 
              display: 'flex', 
              gap: '0.5rem', 
              justifyContent: 'center', 
              alignItems: 'center', 
              fontSize: '1rem', 
              fontWeight: '700' 
            }}
          >
            {loading ? 'Procesando Diagnóstico...' : 'Confirmar Diagnóstico y Generar Plan'}
            {!loading && <ChevronRight size={18} />}
          </button>
        </form>
      </div>
    </div>
  );
}
