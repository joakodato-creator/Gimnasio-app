import React, { useState, useEffect } from 'react';
import { db } from '../utils/mockData';
import { Medal, Trophy, Dumbbell, Flame, Trash2, Pencil, X, Save, AlertCircle } from 'lucide-react';

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

const HYROX_TESTS = [
  { id: 'run1k', name: 'Carrera 1K (Paso)', desc: 'Tiempo de carrera de 1K fresco' },
  { id: 'row1k', name: 'Remo 1K (Tiempo)', desc: 'Tiempo en máquina de remo en 1000m' },
  { id: 'sledPush', name: 'Sled Push 50m', desc: 'Tiempo de empuje de trineo en 50m' },
  { id: 'squat1rm', name: 'Sentadilla 1RM', desc: 'Repetición máxima en sentadilla' }
];

const TIMED_BENCHMARKS = ['Fran', 'Grace', 'Helen', 'Murph', 'Linda'];

// Helper to convert mm:ss to total seconds
const parseTimeToSeconds = (timeStr) => {
  if (!timeStr) return Infinity;
  const clean = timeStr.trim().toLowerCase();
  
  // Try to match MM:SS or H:MM:SS
  const timeMatch = clean.match(/(?:(\d+):)?(\d+):(\d+)/);
  if (timeMatch) {
    const hours = timeMatch[1] ? parseInt(timeMatch[1], 10) : 0;
    const minutes = parseInt(timeMatch[2], 10);
    const seconds = parseInt(timeMatch[3], 10);
    return hours * 3600 + minutes * 60 + seconds;
  }
  
  // Try to match just minutes (e.g. "5 min" or "5m")
  const minMatch = clean.match(/^(\d+(?:\.\d+)?)\s*(?:min|m|minutos)$/);
  if (minMatch) {
    return parseFloat(minMatch[1]) * 60;
  }

  // Try to match just seconds (e.g. "300 sec" or "300s")
  const secMatch = clean.match(/^(\d+)\s*(?:sec|s|seg|segundos)$/);
  if (secMatch) {
    return parseInt(secMatch[1], 10);
  }

  // Fallback: see if we can parse it as a number
  const num = parseInt(clean, 10);
  if (!isNaN(num)) return num;

  return Infinity;
};

// Helper to format seconds to MM:SS
const formatSecondsToTime = (totalSeconds) => {
  if (totalSeconds === Infinity || totalSeconds === null || totalSeconds === undefined || totalSeconds <= 0 || isNaN(totalSeconds)) return '';
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

// Helper to parse AMRAP rounds and reps
const parseAmrapReps = (scoreStr) => {
  if (!scoreStr) return -1;
  const clean = scoreStr.trim().toLowerCase();

  // Try to match "XX rounds + YY reps"
  const roundsRepsMatch = clean.match(/(\d+)\s*(?:rounds|rd|rnds|r|rondas)\s*\+?\s*(\d+)?/);
  if (roundsRepsMatch) {
    const rounds = parseInt(roundsRepsMatch[1], 10);
    const reps = roundsRepsMatch[2] ? parseInt(roundsRepsMatch[2], 10) : 0;
    return rounds * 100 + reps;
  }

  // Try to match "XX rounds"
  const roundsMatch = clean.match(/^(\d+)\s*(?:rounds|rd|rnds|r|rondas)/);
  if (roundsMatch) {
    return parseInt(roundsMatch[1], 10) * 100;
  }

  // Try to match "XX reps"
  const repsMatch = clean.match(/^(\d+)\s*(?:reps|rep|repeticiones)/);
  if (repsMatch) {
    return parseInt(repsMatch[1], 10);
  }

  // Fallback: see if we can parse it as a number
  const num = parseInt(clean, 10);
  if (!isNaN(num)) return num;

  return -1;
};

export default function Leaderboard({ currentUser, onReloadPRs }) {
  const [category, setCategory] = useState('fuerza'); // 'fuerza', 'crossfit', 'hyrox'
  const [selectedExercise, setSelectedExercise] = useState('Back Squat');
  const [selectedBenchmark, setSelectedBenchmark] = useState('Fran');
  const [selectedHyroxTest, setSelectedHyroxTest] = useState('run1k');

  const [users, setUsers] = useState([]);
  const [prs, setPrs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Modals state
  const [editingItem, setEditingItem] = useState(null); // { type: 'pr'|'hyrox', data: prObj|userObj }
  const [editForm, setEditForm] = useState({});
  const [modalError, setModalError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  // Update default exercise/benchmark when category changes
  useEffect(() => {
    if (category === 'fuerza') {
      setSelectedExercise(EXERCISES[0]);
    } else if (category === 'crossfit') {
      setSelectedBenchmark(BENCHMARKS[0].name);
    } else if (category === 'hyrox') {
      setSelectedHyroxTest(HYROX_TESTS[0].id);
    }
  }, [category]);

  const loadData = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const allUsers = await db.getUsers();
      const allPrs = await db.getPRs();
      setUsers(allUsers);
      setPrs(allPrs);
    } catch (err) {
      console.error('Error al cargar rankings:', err);
      setErrorMsg('No se pudieron cargar los datos de clasificación.');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyChanges = async () => {
    // Reload data in parent components if needed
    if (onReloadPRs) onReloadPRs();
    await loadData();
  };

  const handleDeletePR = async (prId) => {
    if (!window.confirm('¿Seguro que deseas eliminar esta marca personal de forma permanente?')) return;
    try {
      await db.deletePR(prId);
      await handleApplyChanges();
    } catch (err) {
      console.error(err);
      alert('Error al eliminar el registro.');
    }
  };

  const handleDeleteHyroxBaseline = async (userId) => {
    if (!window.confirm('¿Seguro que deseas reiniciar (borrar) el diagnóstico basales HYROX de este atleta?')) return;
    try {
      await db.saveHyroxBaseline(userId, null);
      await handleApplyChanges();
    } catch (err) {
      console.error(err);
      alert('Error al reiniciar el diagnóstico.');
    }
  };

  const openEditModal = (itemType, itemData) => {
    setEditingItem({ type: itemType, data: itemData });
    setModalError('');
    if (itemType === 'pr') {
      setEditForm({
        peso_maximo_kg: itemData.peso_maximo_kg !== undefined && itemData.peso_maximo_kg !== null ? String(itemData.peso_maximo_kg) : '',
        repeticiones: itemData.repeticiones !== undefined && itemData.repeticiones !== null ? String(itemData.repeticiones) : '',
        tiempo: itemData.tiempo || ''
      });
    } else if (itemType === 'hyrox') {
      const base = itemData.hyroxBaseline || {};
      setEditForm({
        gender: base.gender || 'male',
        category: base.category || 'open',
        run1k: formatSecondsToTime(base.run1kSeconds),
        row1k: formatSecondsToTime(base.row1kSeconds),
        sledPush: formatSecondsToTime(base.sledPushSeconds),
        squat1rm: base.squat1rmKg !== undefined && base.squat1rmKg !== null ? String(base.squat1rmKg) : ''
      });
    }
  };

  const closeEditModal = () => {
    setEditingItem(null);
    setEditForm({});
    setModalError('');
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setModalError('');
    setSaving(true);

    try {
      if (editingItem.type === 'pr') {
        const prId = editingItem.data.id;
        const updatedFields = {
          peso_maximo_kg: Number(editForm.peso_maximo_kg),
          repeticiones: Number(editForm.repeticiones),
          tiempo: editForm.tiempo
        };
        await db.updatePR(prId, updatedFields);
      } else if (editingItem.type === 'hyrox') {
        const userId = editingItem.data.id;
        
        // Parse time values
        const runSec = parseTimeToSeconds(editForm.run1k);
        const rowSec = parseTimeToSeconds(editForm.row1k);
        const sledSec = parseTimeToSeconds(editForm.sledPush);
        const squatKg = parseFloat(editForm.squat1rm);

        if (runSec < 0) {
          setModalError('Formato de Carrera 1K inválido. Debe ser Minutos:Segundos (Ej: 04:30).');
          setSaving(false);
          return;
        }
        if (rowSec < 0) {
          setModalError('Formato de Remo 1K inválido. Debe ser Minutos:Segundos (Ej: 04:15).');
          setSaving(false);
          return;
        }
        if (sledSec < 0) {
          setModalError('Formato de Sled Push 50m inválido. Debe ser Minutos:Segundos (Ej: 01:30).');
          setSaving(false);
          return;
        }
        if (isNaN(squatKg) || squatKg <= 0) {
          setModalError('Marca de sentadilla 1RM inválida.');
          setSaving(false);
          return;
        }

        const updatedBaseline = {
          gender: editForm.gender,
          category: editForm.category,
          run1kSeconds: runSec,
          row1kSeconds: rowSec,
          sledPushSeconds: sledSec,
          squat1rmKg: squatKg,
          createdAt: editingItem.data.hyroxBaseline?.createdAt || new Date().toISOString().split('T')[0]
        };

        await db.saveHyroxBaseline(userId, updatedBaseline);
      }

      await handleApplyChanges();
      closeEditModal();
    } catch (err) {
      console.error(err);
      setModalError('Ocurrió un error al guardar los cambios.');
    } finally {
      setSaving(false);
    }
  };

  // Compute leaderboard rows
  const getLeaderboardData = () => {
    if (loading) return [];

    if (category === 'fuerza') {
      // Find all strength records matching the selected exercise
      const matchedPrs = prs.filter(
        pr => pr.tipo === 'fuerza' && pr.ejercicio === selectedExercise
      );

      // Group by user and find the best (max weight, then max reps)
      const userBest = {};
      matchedPrs.forEach(pr => {
        const athlete = users.find(u => u.id === pr.cliente_id);
        if (!athlete) return;
        
        const existing = userBest[pr.cliente_id];
        const isBetter = !existing || 
          pr.peso_maximo_kg > existing.peso_maximo_kg || 
          (pr.peso_maximo_kg === existing.peso_maximo_kg && pr.repeticiones > existing.repeticiones);

        if (isBetter) {
          userBest[pr.cliente_id] = {
            id: pr.id,
            athleteName: athlete.name,
            username: athlete.username,
            scoreText: `${pr.peso_maximo_kg} kg (${pr.repeticiones} Rep)`,
            scoreValue: pr.peso_maximo_kg,
            repsValue: pr.repeticiones,
            date: pr.fecha,
            rawRecord: pr,
            rawAthlete: athlete
          };
        }
      });

      // Sort: Max weight desc, then reps desc
      return Object.values(userBest).sort((a, b) => {
        if (b.scoreValue !== a.scoreValue) return b.scoreValue - a.scoreValue;
        return b.repsValue - a.repsValue;
      });
    }

    if (category === 'crossfit') {
      const isTimed = TIMED_BENCHMARKS.includes(selectedBenchmark);
      const matchedPrs = prs.filter(
        pr => pr.tipo === 'benchmark_crossfit' && pr.ejercicio === selectedBenchmark
      );

      const userBest = {};
      matchedPrs.forEach(pr => {
        const athlete = users.find(u => u.id === pr.cliente_id);
        if (!athlete) return;

        const scoreStr = pr.tiempo || '';
        const parsedVal = isTimed ? parseTimeToSeconds(scoreStr) : parseAmrapReps(scoreStr);

        // Filter out bad/empty values
        if (isTimed && parsedVal === Infinity) return;
        if (!isTimed && parsedVal < 0) return;

        const existing = userBest[pr.cliente_id];
        let isBetter = false;

        if (!existing) {
          isBetter = true;
        } else {
          isBetter = isTimed ? (parsedVal < existing.parsedVal) : (parsedVal > existing.parsedVal);
        }

        if (isBetter) {
          userBest[pr.cliente_id] = {
            id: pr.id,
            athleteName: athlete.name,
            username: athlete.username,
            scoreText: pr.tiempo,
            parsedVal: parsedVal,
            date: pr.fecha,
            rawRecord: pr,
            rawAthlete: athlete
          };
        }
      });

      // Sort: Ascending for time, Descending for AMRAP
      return Object.values(userBest).sort((a, b) => {
        return isTimed ? (a.parsedVal - b.parsedVal) : (b.parsedVal - a.parsedVal);
      });
    }

    if (category === 'hyrox') {
      // Rankings for HYROX are loaded from the users' profiles (hyroxBaseline)
      const dataRows = [];
      
      users.forEach(athlete => {
        if (!athlete.hyroxBaseline) return;
        const base = athlete.hyroxBaseline;

        if (selectedHyroxTest === 'run1k' && base.run1kSeconds > 0) {
          dataRows.push({
            id: `hyrox-${athlete.id}-run`,
            athleteName: athlete.name,
            username: athlete.username,
            scoreText: `${formatSecondsToTime(base.run1kSeconds)} min`,
            scoreValue: base.run1kSeconds,
            date: base.createdAt || athlete.fecha_vencimiento_creditos || '---',
            rawAthlete: athlete
          });
        } else if (selectedHyroxTest === 'row1k' && base.row1kSeconds > 0) {
          dataRows.push({
            id: `hyrox-${athlete.id}-row`,
            athleteName: athlete.name,
            username: athlete.username,
            scoreText: `${formatSecondsToTime(base.row1kSeconds)} min`,
            scoreValue: base.row1kSeconds,
            date: base.createdAt || athlete.fecha_vencimiento_creditos || '---',
            rawAthlete: athlete
          });
        } else if (selectedHyroxTest === 'sledPush' && base.sledPushSeconds > 0) {
          dataRows.push({
            id: `hyrox-${athlete.id}-sled`,
            athleteName: athlete.name,
            username: athlete.username,
            scoreText: `${formatSecondsToTime(base.sledPushSeconds)} min`,
            scoreValue: base.sledPushSeconds,
            date: base.createdAt || athlete.fecha_vencimiento_creditos || '---',
            rawAthlete: athlete
          });
        } else if (selectedHyroxTest === 'squat1rm' && base.squat1rmKg > 0) {
          dataRows.push({
            id: `hyrox-${athlete.id}-squat`,
            athleteName: athlete.name,
            username: athlete.username,
            scoreText: `${base.squat1rmKg} kg`,
            scoreValue: base.squat1rmKg,
            date: base.createdAt || athlete.fecha_vencimiento_creditos || '---',
            rawAthlete: athlete
          });
        }
      });

      // Sort: Ascending for time tests (run, row, sled), Descending for weight (squat)
      const isWeight = selectedHyroxTest === 'squat1rm';
      return dataRows.sort((a, b) => {
        return isWeight ? (b.scoreValue - a.scoreValue) : (a.scoreValue - b.scoreValue);
      });
    }

    return [];
  };

  const rankingRows = getLeaderboardData();
  const isAdmin = currentUser && currentUser.rol === 'administrador';

  // Helper to render ranks with styled badges
  const renderRank = (index) => {
    if (index === 0) return <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '50%', background: '#fbbf24', color: '#000', fontWeight: '800' }}><Medal size={16} /></span>;
    if (index === 1) return <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '50%', background: '#94a3b8', color: '#000', fontWeight: '800' }}><Medal size={16} /></span>;
    if (index === 2) return <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '50%', background: '#b45309', color: '#fff', fontWeight: '800' }}><Medal size={16} /></span>;
    return <span style={{ color: 'var(--color-text-muted)', fontWeight: '600', paddingLeft: '8px' }}>{index + 1}</span>;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Cabecera del Panel de Clasificaciones */}
      <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-primary)', margin: 0 }}>
            <Trophy size={26} /> Tabla de Clasificación y Rankings
          </h2>
          <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
            Se actualiza automáticamente con los registros de los atletas.
          </span>
        </div>

        {errorMsg && (
          <div className="badge badge-danger" style={{ padding: '0.75rem', width: '100%', justifyContent: 'center' }}>
            {errorMsg}
          </div>
        )}

        {/* Botones de Categorías */}
        <div style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
          <button 
            onClick={() => setCategory('fuerza')}
            className={`btn ${category === 'fuerza' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
          >
            <Dumbbell size={16} /> Fuerza (RMs)
          </button>
          <button 
            onClick={() => setCategory('crossfit')}
            className={`btn ${category === 'crossfit' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
          >
            <Flame size={16} /> CrossFit Benchmarks
          </button>
          <button 
            onClick={() => setCategory('hyrox')}
            className={`btn ${category === 'hyrox' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '0.85rem', padding: '0.5rem 1rem', borderColor: category === 'hyrox' ? 'var(--color-hyrox)' : 'transparent' }}
          >
            <Trophy size={16} /> Pruebas HYROX
          </button>
        </div>

        {/* Fila de Filtros de Ejercicios específicos */}
        <div className="responsive-grid-2" style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
          {category === 'fuerza' && (
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Selecciona el Ejercicio de Fuerza</label>
              <select 
                className="form-select"
                value={selectedExercise}
                onChange={(e) => setSelectedExercise(e.target.value)}
              >
                {EXERCISES.map(ex => (
                  <option key={ex} value={ex}>{ex}</option>
                ))}
              </select>
            </div>
          )}

          {category === 'crossfit' && (
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Selecciona el Benchmark</label>
              <select 
                className="form-select"
                value={selectedBenchmark}
                onChange={(e) => setSelectedBenchmark(e.target.value)}
              >
                {BENCHMARKS.map(b => (
                  <option key={b.name} value={b.name}>{b.name} - ({b.description})</option>
                ))}
              </select>
            </div>
          )}

          {category === 'hyrox' && (
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Selecciona la Prueba HYROX</label>
              <select 
                className="form-select"
                value={selectedHyroxTest}
                onChange={(e) => setSelectedHyroxTest(e.target.value)}
              >
                {HYROX_TESTS.map(t => (
                  <option key={t.id} value={t.id}>{t.name} ({t.desc})</option>
                ))}
              </select>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
            {category === 'fuerza' && 'Calcula y ordena el máximo peso (kg) alcanzado en la base de datos.'}
            {category === 'crossfit' && (TIMED_BENCHMARKS.includes(selectedBenchmark) ? 'Ordena de menor a mayor tiempo (Ascendente).' : 'Ordena de mayor a menor número de Reps / Rondas (Descendente).')}
            {category === 'hyrox' && (selectedHyroxTest === 'squat1rm' ? 'Ordena por peso (kg) descendente.' : 'Ordena por tiempo (minutos/segundos) ascendente.')}
          </div>
        </div>
      </div>

      {/* Tabla del Leaderboard */}
      <div className="glass-card" style={{ padding: '1rem' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <p>Cargando clasificaciones...</p>
          </div>
        ) : rankingRows.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
            <p>No se encontraron registros de marcas para este ejercicio/prueba.</p>
            <p style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>Los atletas deben cargar sus resultados en su respectiva pestaña para verlos reflejados aquí.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '500px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-glass)', textAlign: 'left' }}>
                  <th style={{ padding: '1rem 0.75rem', width: '80px', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>POS</th>
                  <th style={{ padding: '1rem 0.75rem', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>ATLETA</th>
                  <th style={{ padding: '1rem 0.75rem', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>MARCA</th>
                  <th style={{ padding: '1rem 0.75rem', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>FECHA</th>
                  {isAdmin && <th style={{ padding: '1rem 0.75rem', textAlign: 'right', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>ACCIONES (MODERACIÓN)</th>}
                </tr>
              </thead>
              <tbody>
                {rankingRows.map((row, idx) => (
                  <tr 
                    key={row.id} 
                    style={{ 
                      borderBottom: '1px solid rgba(255,255,255,0.03)', 
                      background: currentUser && currentUser.username === row.username ? 'rgba(190, 242, 100, 0.03)' : 'transparent',
                      transition: 'background-color var(--transition-fast)'
                    }}
                  >
                    <td style={{ padding: '1rem 0.75rem' }}>
                      {renderRank(idx)}
                    </td>
                    <td style={{ padding: '1rem 0.75rem', fontWeight: '700' }}>
                      {row.athleteName} <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: '400' }}>@{row.username}</span>
                      {currentUser && currentUser.username === row.username && (
                        <span className="badge badge-primary" style={{ fontSize: '0.65rem', marginLeft: '0.5rem', padding: '0.1rem 0.4rem' }}>Tú</span>
                      )}
                    </td>
                    <td style={{ padding: '1rem 0.75rem', fontWeight: '800', fontSize: '1.1rem', color: category === 'hyrox' ? 'var(--color-hyrox)' : 'var(--color-primary)' }}>
                      {row.scoreText}
                    </td>
                    <td style={{ padding: '1rem 0.75rem', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                      {row.date}
                    </td>
                    {isAdmin && (
                      <td style={{ padding: '1rem 0.75rem', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                          <button
                            onClick={() => openEditModal(category === 'hyrox' ? 'hyrox' : 'pr', category === 'hyrox' ? row.rawAthlete : row.rawRecord)}
                            className="btn btn-secondary"
                            style={{ padding: '0.4rem', borderRadius: '4px', background: 'rgba(255,255,255,0.03)' }}
                            title="Editar Marca (Corregir mentira)"
                          >
                            <Pencil size={14} color="var(--color-accent)" />
                          </button>
                          <button
                            onClick={() => category === 'hyrox' ? handleDeleteHyroxBaseline(row.rawAthlete.id) : handleDeletePR(row.id)}
                            className="btn btn-secondary"
                            style={{ padding: '0.4rem', borderRadius: '4px', background: 'rgba(239, 68, 68, 0.05)' }}
                            title="Eliminar Marca"
                          >
                            <Trash2 size={14} color="var(--color-danger)" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL DE EDICIÓN DE MARCA (MODERACIÓN ADMIN) */}
      {editingItem && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '450px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, color: 'var(--color-primary)' }}>
                <Pencil size={20} /> Corregir Marca del Atleta
              </h3>
              <button 
                onClick={closeEditModal} 
                className="btn btn-secondary" 
                style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              {editingItem.type === 'pr' && editingItem.data.tipo === 'fuerza' && (
                <>
                  <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: '6px', fontSize: '0.85rem' }}>
                    <strong>Atleta:</strong> {users.find(u => u.id === editingItem.data.cliente_id)?.name} <br />
                    <strong>Ejercicio:</strong> {editingItem.data.ejercicio}
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Peso Máximo (kg)</label>
                    <input
                      type="number"
                      className="form-input"
                      value={editForm.peso_maximo_kg || ''}
                      onChange={(e) => setEditForm({ ...editForm, peso_maximo_kg: e.target.value.replace(/^0+(?=\d)/, '') })}
                      required
                      min="1"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Repeticiones</label>
                    <input
                      type="number"
                      className="form-input"
                      value={editForm.repeticiones || ''}
                      onChange={(e) => setEditForm({ ...editForm, repeticiones: e.target.value.replace(/^0+(?=\d)/, '') })}
                      required
                      min="1"
                      max="30"
                    />
                  </div>
                </>
              )}

              {editingItem.type === 'pr' && editingItem.data.tipo === 'benchmark_crossfit' && (
                <>
                  <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: '6px', fontSize: '0.85rem' }}>
                    <strong>Atleta:</strong> {users.find(u => u.id === editingItem.data.cliente_id)?.name} <br />
                    <strong>Benchmark WOD:</strong> {editingItem.data.ejercicio}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Puntuación / Tiempo Registrado</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Ej: 03:45 o 20 rounds"
                      value={editForm.tiempo || ''}
                      onChange={(e) => setEditForm({ ...editForm, tiempo: e.target.value })}
                      required
                    />
                    <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                      Para benchmarks de tiempo usa formato MM:SS (Ej: 04:15).
                    </span>
                  </div>
                </>
              )}

              {editingItem.type === 'hyrox' && (
                <>
                  <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: '6px', fontSize: '0.85rem', borderLeft: '3px solid var(--color-hyrox)' }}>
                    <strong>Atleta:</strong> {editingItem.data.name} <br />
                    <strong>Diagnóstico HYROX</strong>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div className="form-group">
                      <label className="form-label">Género</label>
                      <select
                        className="form-select"
                        value={editForm.gender || 'male'}
                        onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
                      >
                        <option value="male">Masculino</option>
                        <option value="female">Femenino</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Categoría</label>
                      <select
                        className="form-select"
                        value={editForm.category || 'open'}
                        onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                      >
                        <option value="open">OPEN</option>
                        <option value="pro">PRO</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div className="form-group">
                      <label className="form-label">Carrera 1K (MM:SS)</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Ej: 04:30"
                        value={editForm.run1k || ''}
                        onChange={(e) => setEditForm({ ...editForm, run1k: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Remo 1K (MM:SS)</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Ej: 04:15"
                        value={editForm.row1k || ''}
                        onChange={(e) => setEditForm({ ...editForm, row1k: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div className="form-group">
                      <label className="form-label">Sled Push 50m (MM:SS)</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Ej: 01:30"
                        value={editForm.sledPush || ''}
                        onChange={(e) => setEditForm({ ...editForm, sledPush: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Sentadilla 1RM (kg)</label>
                      <input
                        type="number"
                        className="form-input"
                        value={editForm.squat1rm || ''}
                        onChange={(e) => setEditForm({ ...editForm, squat1rm: e.target.value.replace(/^0+(?=\d)/, '') })}
                        required
                        min="1"
                      />
                    </div>
                  </div>
                </>
              )}

              {modalError && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--color-danger)', fontSize: '0.8rem', background: 'rgba(239, 68, 68, 0.05)', padding: '0.5rem', borderRadius: '4px' }}>
                  <AlertCircle size={14} />
                  <span>{modalError}</span>
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  style={{ flex: 1, padding: '0.6rem' }}
                  disabled={saving}
                >
                  <Save size={16} /> {saving ? 'Guardando...' : 'Guardar Cambios'}
                </button>
                <button 
                  type="button" 
                  onClick={closeEditModal} 
                  className="btn btn-secondary" 
                  style={{ flex: 1, padding: '0.6rem' }}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
