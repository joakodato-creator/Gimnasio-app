import React, { useState, useEffect } from 'react';
import { db } from '../utils/mockData';
import { Dumbbell, Plus, Trash2, Percent, Trophy, Sparkles } from 'lucide-react';

const EXERCISES = [
  'Back Squat', 'Front Squat', 'Overhead Squat', 
  'Clean & Jerk', 'Snatch', 'Deadlift', 
  'Bench Press', 'Strict Press', 'Thruster', 
  'Power Clean', 'Power Snatch'
];

const BENCHMARKS = [
  { name: 'Fran', description: '21-15-9 reps of: Thrusters (95/65 lbs) & Pull-ups' },
  { name: 'Grace', description: '30 Clean & Jerks for time (135/95 lbs)' },
  { name: 'Helen', description: '3 rounds for time of: 400m Run, 21 Kettlebell Swings (1.5/1 pd), 12 Pull-ups' },
  { name: 'Murph', description: 'For time: 1 mile Run, 100 Pull-ups, 200 Push-ups, 300 Squats, 1 mile Run' },
  { name: 'Cindy', description: 'AMRAP in 20 min of: 5 Pull-ups, 10 Push-ups, 15 Air Squats' },
  { name: 'Chelsea', description: 'EMOM for 30 min of: 5 Pull-ups, 10 Push-ups, 15 Air Squats' },
  { name: 'Linda', description: '10-9-8-7-6-5-4-3-2-1 reps of: Deadlift (1.5x BW), Bench Press (BW), Clean (3/4 BW)' }
];

export default function CrossFitTools({ user, onReloadPRs }) {
  const [prs, setPrs] = useState([]);
  const [rmExercise, setRmExercise] = useState('Back Squat');
  const [rmWeight, setRmWeight] = useState(100);
  
  // States for new PR form
  const [newPrExercise, setNewPrExercise] = useState('Back Squat');
  const [newPrWeight, setNewPrWeight] = useState('');
  const [newPrReps, setNewPrReps] = useState(1);
  
  // States for Benchmarks
  const [newBenchName, setNewBenchName] = useState('Fran');
  const [newBenchTime, setNewBenchTime] = useState('');

  useEffect(() => {
    loadPRs();
  }, [user]);

  const loadPRs = async () => {
    try {
      const allPrs = await db.getPRs();
      const userPrs = allPrs.filter(pr => pr.cliente_id === user.id);
      setPrs(userPrs);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddPR = async (e) => {
    e.preventDefault();
    if (!newPrWeight || newPrWeight <= 0) return;

    try {
      await db.addPR({
        cliente_id: user.id,
        ejercicio: newPrExercise,
        peso_maximo_kg: Number(newPrWeight),
        repeticiones: Number(newPrReps),
        tipo: 'fuerza'
      });

      setNewPrWeight('');
      await loadPRs();
      if (onReloadPRs) onReloadPRs();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddBenchmark = async (e) => {
    e.preventDefault();
    if (!newBenchTime) return;

    try {
      await db.addPR({
        cliente_id: user.id,
        ejercicio: newBenchName,
        peso_maximo_kg: 0,
        tiempo: newBenchTime,
        tipo: 'benchmark_crossfit'
      });

      setNewBenchTime('');
      await loadPRs();
      if (onReloadPRs) onReloadPRs();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeletePR = async (id) => {
    if (confirm('¿Seguro que deseas eliminar esta marca personal?')) {
      try {
        await db.deletePR(id);
        await loadPRs();
        if (onReloadPRs) onReloadPRs();
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Helper to determine training zone info
  const getZoneInfo = (pct) => {
    if (pct >= 90) return { zone: 'Fuerza Máxima (RM)', desc: '1-3 repeticiones pesadas' };
    if (pct >= 80) return { zone: 'Fuerza / Hipertrofia', desc: '4-6 repeticiones pesadas' };
    if (pct >= 70) return { zone: 'Hipertrofia / Resistencia', desc: '8-12 repeticiones moderadas' };
    if (pct >= 60) return { zone: 'Potencia / Técnica', desc: 'Velocidad y técnica explosiva' };
    return { zone: 'Resistencia Aeróbica', desc: 'Alto volumen y velocidad constante' };
  };

  // Percentages grid (50% to 100% in 5% increments)
  const percentages = Array.from({ length: 11 }, (_, i) => 50 + i * 5);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Calculadora de Porcentajes de Fuerza */}
      <div className="glass-card">
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', color: 'var(--color-primary)' }}>
          <Percent size={24} /> Calculadora de Porcentajes de Fuerza (RM)
        </h2>
        <div className="responsive-grid-2" style={{ marginBottom: '1.5rem' }}>
          <div className="form-group">
            <label className="form-label">Ejercicio de Referencia</label>
            <select 
              className="form-select"
              value={rmExercise}
              onChange={(e) => setRmExercise(e.target.value)}
            >
              {EXERCISES.map(ex => (
                <option key={ex} value={ex}>{ex}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Peso Máximo Estimado (1RM) en kg</label>
            <input 
              type="number" 
              className="form-input" 
              value={rmWeight}
              min="1"
              onChange={(e) => setRmWeight(e.target.value.replace(/^0+(?=\d)/, ''))}
            />
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem', minWidth: '400px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border-glass)', textAlign: 'left' }}>
                <th style={{ padding: '0.75rem 0.5rem', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>PORCENTAJE</th>
                <th style={{ padding: '0.75rem 0.5rem', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>PESO SUGERIDO</th>
                <th style={{ padding: '0.75rem 0.5rem', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>ZONA DE TRABAJO</th>
                <th style={{ padding: '0.75rem 0.5rem', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>RANGO SUGERIDO</th>
              </tr>
            </thead>
            <tbody>
              {percentages.reverse().map(pct => {
                const weight = (rmWeight * pct) / 100;
                const zoneInfo = getZoneInfo(pct);
                return (
                  <tr key={pct} style={{ borderBottom: '1px solid var(--border-glass)', transition: 'background-color 0.2s' }}>
                    <td style={{ padding: '0.75rem 0.5rem', fontWeight: '700', color: pct === 100 ? 'var(--color-primary)' : 'var(--color-text-main)' }}>
                      {pct}%
                    </td>
                    <td style={{ padding: '0.75rem 0.5rem', fontSize: '1.1rem', fontWeight: '600' }}>
                      {weight.toFixed(1)} kg
                    </td>
                    <td style={{ padding: '0.75rem 0.5rem', color: 'var(--color-text-main)', fontSize: '0.9rem' }}>
                      {zoneInfo.zone}
                    </td>
                    <td style={{ padding: '0.75rem 0.5rem', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                      {zoneInfo.desc}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid-2">
        {/* Registro de RMs */}
        <div className="glass-card">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', color: 'var(--color-text-main)' }}>
            <Dumbbell size={20} /> Registrar Nueva Marca Personal
          </h3>
          <form onSubmit={handleAddPR} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Ejercicio de Fuerza</label>
              <select 
                className="form-select"
                value={newPrExercise}
                onChange={(e) => setNewPrExercise(e.target.value)}
              >
                {EXERCISES.map(ex => (
                  <option key={ex} value={ex}>{ex}</option>
                ))}
              </select>
            </div>
            
            <div className="responsive-grid-2" style={{ gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Peso (kg)</label>
                <input 
                  type="number" 
                  className="form-input" 
                  placeholder="Ej: 80"
                  value={newPrWeight}
                  required
                  min="1"
                  onChange={(e) => setNewPrWeight(e.target.value.replace(/^0+(?=\d)/, ''))}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Repeticiones</label>
                <input 
                  type="number" 
                  className="form-input" 
                  min="1"
                  max="20"
                  value={newPrReps}
                  required
                  onChange={(e) => setNewPrReps(e.target.value.replace(/^0+(?=\d)/, ''))}
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
              <Plus size={18} /> Guardar RM
            </button>
          </form>
        </div>

        {/* Registro de Benchmarks */}
        <div className="glass-card">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', color: 'var(--color-text-main)' }}>
            <Trophy size={20} /> Registrar Benchmark de CrossFit
          </h3>
          <form onSubmit={handleAddBenchmark} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">WOD Benchmark</label>
              <select 
                className="form-select"
                value={newBenchName}
                onChange={(e) => setNewBenchName(e.target.value)}
              >
                {BENCHMARKS.map(bench => (
                  <option key={bench.name} value={bench.name}>{bench.name}</option>
                ))}
              </select>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                {BENCHMARKS.find(b => b.name === newBenchName)?.description}
              </span>
            </div>

            <div className="form-group">
              <label className="form-label">Tiempo / Puntuación Obtenida</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="Ej: 3:45 o 150 reps"
                value={newBenchTime}
                required
                onChange={(e) => setNewBenchTime(e.target.value)}
              />
            </div>

            <button type="submit" className="btn btn-secondary" style={{ width: '100%' }}>
              <Plus size={18} /> Guardar Record de WOD
            </button>
          </form>
        </div>
      </div>

      {/* Historial de Records */}
      <div className="glass-card">
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--color-text-main)' }}>
          <Sparkles size={20} /> Mi Historial de RMs y Benchmarks
        </h3>

        {prs.length === 0 ? (
          <p style={{ padding: '1rem 0' }}>Aún no has registrado ninguna marca personal. ¡Empieza hoy mismo!</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-glass)', textAlign: 'left' }}>
                  <th style={{ padding: '0.75rem 0.5rem', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>FECHA</th>
                  <th style={{ padding: '0.75rem 0.5rem', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>TIPO</th>
                  <th style={{ padding: '0.75rem 0.5rem', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>EJERCICIO / WOD</th>
                  <th style={{ padding: '0.75rem 0.5rem', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>LOGRO</th>
                  <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>ACCIONES</th>
                </tr>
              </thead>
              <tbody>
                {prs.map(pr => (
                  <tr key={pr.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <td style={{ padding: '0.75rem 0.5rem', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                      {pr.fecha}
                    </td>
                    <td style={{ padding: '0.75rem 0.5rem' }}>
                      <span className={`badge ${pr.tipo === 'fuerza' ? 'badge-primary' : 'badge-hyrox'}`}>
                        {pr.tipo === 'fuerza' ? 'Fuerza' : 'CrossFit'}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 0.5rem', fontWeight: '600' }}>
                      {pr.ejercicio}
                    </td>
                    <td style={{ padding: '0.75rem 0.5rem', fontWeight: '700', fontSize: '1.05rem', color: pr.tipo === 'fuerza' ? 'var(--color-primary)' : 'var(--color-hyrox)' }}>
                      {pr.tipo === 'fuerza' ? `${pr.peso_maximo_kg} kg (${pr.repeticiones} Rep)` : pr.tiempo}
                    </td>
                    <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>
                      <button 
                        onClick={() => handleDeletePR(pr.id)}
                        style={{ background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer' }}
                        title="Eliminar registro"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
