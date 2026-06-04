import React, { useState, useEffect } from 'react';
import { db } from '../utils/mockData';
import { Trophy, Calendar, CheckCircle2, Flame, HelpCircle, MessageSquare, Plus, Save } from 'lucide-react';
import HyroxOnboarding from './HyroxOnboarding';

const formatSecondsToTime = (totalSeconds) => {
  const mins = Math.floor(totalSeconds / 60);
  const secs = Math.round(totalSeconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')} min/km`;
};

const generateHyroxProgram = (baseline) => {
  if (!baseline) return null;
  const { gender, category, run1kSeconds, row1kSeconds, squat1rmKg } = baseline;

  const z2Seconds = run1kSeconds + 120;
  const raceSeconds = run1kSeconds + 45;
  const intSeconds = run1kSeconds - 10;

  const z2Pace = formatSecondsToTime(z2Seconds);
  const racePace = formatSecondsToTime(raceSeconds);
  const intPace = formatSecondsToTime(intSeconds);

  let standardSledPush = 102;
  if (gender === 'female') {
    standardSledPush = category === 'pro' ? 107 : 74;
  } else {
    standardSledPush = category === 'pro' ? 152 : 102;
  }

  let standardSledPull = 78;
  if (gender === 'female') {
    standardSledPull = category === 'pro' ? 78 : 53;
  } else {
    standardSledPull = category === 'pro' ? 103 : 78;
  }

  let standardFarmers = 24;
  if (gender === 'female') {
    standardFarmers = category === 'pro' ? 24 : 16;
  } else {
    standardFarmers = category === 'pro' ? 32 : 24;
  }

  let standardWB = 6;
  if (gender === 'female') {
    standardWB = category === 'pro' ? 6 : 4;
  } else {
    standardWB = category === 'pro' ? 9 : 6;
  }

  const squatWeight50 = Math.round(squat1rmKg * 0.50);
  const squatWeight65 = Math.round(squat1rmKg * 0.65);
  const squatWeight75 = Math.round(squat1rmKg * 0.75);

  const programWeeks = [];

  for (let w = 1; w <= 12; w++) {
    let scale = 0.60;
    let phaseName = "Fase de Base Aeróbica y Técnica";
    
    if (w >= 5 && w <= 8) {
      scale = 0.80;
      phaseName = "Fase de Desarrollo de Resistencia Especial";
    } else if (w >= 9 && w <= 11) {
      scale = 1.00;
      phaseName = "Fase de Máxima Intensidad y Simulación";
    } else if (w === 12) {
      scale = 0.60;
      phaseName = "Fase de Puesta a Punto (Taper)";
    }

    const sledPushW = Math.round(standardSledPush * scale);
    const sledPullW = Math.round(standardSledPull * scale);
    const farmersW = Math.round(standardFarmers * scale);
    const wbW = standardWB;

    let workouts = [];
    if (w <= 4) {
      workouts = [
        `Lunes (Carrera Base & Fuerza): 40 mins Carrera continua Z2 (Paso: ${z2Pace}). Luego 4 series de: 8 Sentadillas Frontales con ${squatWeight50} kg + 12 Ring Rows. Foco en la técnica y control de respiración.`,
        `Martes (Fuerza General): 4 series de: 8 Peso Muerto RDL con ${Math.round(squat1rmKg * 0.55)} kg + 10 Strict Press + 30s de Plank Hold. Trabajo técnico sin prisa.`,
        `Miércoles (Intervalos de Carrera y Estaciones): 5x 800m a ritmo de Intervalo (${intPace}) con 2 mins de recuperación. Luego 3 rondas suaves de: 15 Goblet Squats + 50m Sled Walk sin peso.`,
        `Jueves (Recuperación Activa): Trote cómodo de 30 mins en Zona 2 (${z2Pace}) + 15 mins de movilidad de cadera y tobillos. Core: 3 rondas de 12 AbMat Situps.`,
        `Viernes (Resistencia Estaciones): 4 rondas por tiempo (ritmo controlado) de: 500m Remo + 50m Sled Push con ${sledPushW} kg + 50m Farmers Carry con ${farmersW} kg por mano.`,
        `Sábado (Simulación de Carrera bajo Fatiga Corta): 2 rondas de: 1.5 km Carrera a ritmo medio (${racePace}) + 50m Sled Push (${sledPushW} kg) + 20 Wall Balls (${wbW} kg). Foco en mantener la zancada fluida.`
      ];
    } else if (w <= 8) {
      workouts = [
        `Lunes (Carrera de Base): 45 mins Carrera continua Z2 (Paso: ${z2Pace}). Fuerza: 4 series de: 8 Sentadillas con ${squatWeight65} kg + 10 Pull-ups / Band Assisted.`,
        `Martes (Fuerza de Empuje & Tracción): Peso Muerto (4x6 al 70% de 1RM: ${Math.round(squat1rmKg * 0.70)} kg) + 3 series de 50m de Zancadas con saco (Walking Lunges).`,
        `Miércoles (Intervalos y Transición): 6x 800m a ritmo de Intervalo (${intPace}) con 1:30 de descanso. Transición inmediata a 3 rondas de: 15 Burpee Broad Jumps + 15 Wall Balls (${wbW} kg).`,
        `Jueves (Recuperación): 35 mins Trote suave en Zona 2 (${z2Pace}). Core: 4 rondas de 15 AbMat Situps con disco de 5kg + 40s Plank.`,
        `Viernes (Fatiga Específica): AMRAP 20 mins: 1.000m Remo + 50m Sled Push (${sledPushW} kg) + 100m Farmers Carry (${farmersW} kg por mano) + 20 Zancadas.`,
        `Sábado (Simulación de Carrera): 3 rondas de: 1.5 km Carrera a ritmo objetivo (${racePace}) + 50m Sled Push (${sledPushW} kg) + 15 Wall Balls (${wbW} kg) + 400m Remo.`
      ];
    } else if (w <= 11) {
      workouts = [
        `Lunes (Carrera Base & Fuerza): 50 mins Carrera continua Z2 (Paso: ${z2Pace}). Fuerza: 3 series de 5 Sentadillas Pesadas con ${squatWeight75} kg + 12 Ring Rows con peso.`,
        `Martes (Potencia y Tracción): Peso Muerto (3x5 al 80% de 1RM: ${Math.round(squat1rmKg * 0.80)} kg) + 4 series de 50m Caminata de Oso + 15 Pushups.`,
        `Miércoles (Intervalos Lactácidos): 4x 1000m a ritmo de Intervalo (${intPace}) con 2 mins de descanso. Al finalizar cada serie, hacer 20 Wall Balls (${wbW} kg) a máxima velocidad.`,
        `Jueves (Recuperación): 30 mins Trote regenerativo (${z2Pace}). Core: 4 rondas de: 15 Hollow Rocks + 15 Arch Rocks + 45s Plank.`,
        `Viernes (Simulación Estaciones): Por tiempo (Ritmo Competencia): 1.000m Remo + 50m Sled Push (${sledPushW} kg) + 50m Sled Pull (${sledPullW} kg) + 100m Farmers Carry (${farmersW} kg por mano) + 100 Wall Balls (${wbW} kg).`,
        `Sábado (Simulación Completa): 4 rondas de: 1.5 km Carrera a paso objetivo (${racePace}) + 50m Sled Push (${sledPushW} kg) + 50m Farmers Carry (${farmersW} kg) + 400m Remo. Foco mental de competencia.`
      ];
    } else {
      workouts = [
        `Lunes (Taper Carrera): 30 mins Carrera suave Z2 (Paso: ${z2Pace}). Fuerza liviana: 3x8 Sentadillas con ${squatWeight50} kg (foco en velocidad de subida).`,
        `Martes (Movilidad & Core): 20 mins Movilidad articular activa + 3 rondas de core (30s Plank + 10 sit-ups suaves). Mantener el cuerpo activo sin fatiga.`,
        `Miércoles (Intervalos Cortos): 3x 500m a ritmo de carrera (${racePace}) con 2 mins de recuperación. Luego: 2x 50m Sled Push liviano (${sledPushW} kg). Foco en frescura de piernas.`,
        `Jueves (Descanso Absoluto): Descanso completo. Estiramiento pasivo o caminata suave.`,
        `Viernes (Activación Pre-Carrera): 15 mins Trote suave + 3 progresiones de 100m rápidas. 2 rondas sin fatiga de: 10 Wall Balls + 5 Burpees.`,
        `Sábado (Día de Competencia / Test de Control): Simulación final o Test PFT oficial: 1km Carrera + 50m Sled Push (${standardSledPush} kg oficial) + 50m Sled Pull (${standardSledPull} kg) + 100 Wall Balls (${standardWB} kg). ¡A por tu récord!`,
      ];
    }

    programWeeks.push({
      weekNumber: w,
      focus: `${phaseName} (Semana ${w})`,
      targetMetrics: {
        run1k: `Paso Z2: ${z2Pace} | Paso Carrera: ${racePace}`,
        sledPushWeight: `${sledPushW} kg (Reglamento: ${standardSledPush} kg)`
      },
      workouts
    });
  }

  return {
    id: 'hyrox-12w',
    title: `Plan HYROX Personalizado (${category.toUpperCase()} - ${gender === 'male' ? 'Masc.' : 'Fem.'})`,
    duration: '12 Semanas',
    description: `Rutina de 6 días a la semana adaptada dinámicamente según tus marcas basales (1K Run: ${formatSecondsToTime(run1kSeconds).replace(' min/km', '')}, Squat 1RM: ${squat1rmKg} kg).`,
    weeks: programWeeks
  };
};

export default function HyroxTraining({ user, onUpdateUser }) {
  const [template, setTemplate] = useState({});
  const [activeTab, setActiveTab] = useState('plan'); // 'plan', 'progress', 'logs'
  const [selectedWeek, setSelectedWeek] = useState(1);
  
  // Progress input form states
  const [run1k, setRun1k] = useState('');
  const [sledPush, setSledPush] = useState('');
  const [farmersCarry, setFarmersCarry] = useState('');
  const [notes, setNotes] = useState('');

  // Toast / Status state
  const [saveStatus, setSaveStatus] = useState('');
  const [pendingAdjustment, setPendingAdjustment] = useState(null);

  useEffect(() => {
    if (user.hyroxBaseline) {
      setTemplate(generateHyroxProgram(user.hyroxBaseline));
    } else {
      setTemplate(db.getHyroxTemplate());
    }
    // Auto-populate form if user already has data for selectedWeek
    loadWeekData(selectedWeek);
  }, [user, selectedWeek]);

  const loadWeekData = (weekNum) => {
    const currentProgress = user.hyroxProgress?.find(p => p.weekNumber === weekNum);
    if (currentProgress) {
      setRun1k(currentProgress.run1k || '');
      setSledPush(currentProgress.sledPush75kg || '');
      setFarmersCarry(currentProgress.farmersCarry24kg || '');
      setNotes(currentProgress.clientNotes || '');
    } else {
      setRun1k('');
      setSledPush('');
      setFarmersCarry('');
      setNotes('');
    }
  };

  const parseTimeToSeconds = (timeStr) => {
    const cleanStr = timeStr.trim();
    if (!cleanStr) return 0;
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
    return -1;
  };

  const handleAssignPlan = async () => {
    const updated = await db.assignHyroxPlan(user.id, 'hyrox-12w');
    onUpdateUser(updated);
    setSaveStatus('Plan HYROX asignado. ¡Comienza a entrenar!');
    setTimeout(() => setSaveStatus(''), 3000);
  };

  const handleSubmitProgress = async (e) => {
    e.preventDefault();
    const updated = await db.addHyroxProgress(
      user.id,
      selectedWeek,
      run1k,
      sledPush,
      farmersCarry,
      notes
    );

    // Dynamic progression check (Option B: Virtual Coach confirmation)
    const newRunSec = parseTimeToSeconds(run1k);
    if (user.hyroxBaseline && newRunSec > 0 && newRunSec < user.hyroxBaseline.run1kSeconds) {
      setPendingAdjustment({
        type: 'run1k',
        newValue: newRunSec,
        newValueStr: run1k,
        oldValueStr: formatSecondsToTime(user.hyroxBaseline.run1kSeconds).replace(' min/km', '')
      });
    }

    onUpdateUser(updated);
    setSaveStatus(`¡Semana ${selectedWeek} guardada con éxito!`);
    setTimeout(() => setSaveStatus(''), 3000);
  };

  const handleAcceptAdjustment = async () => {
    if (!pendingAdjustment || !user.hyroxBaseline) return;
    
    const updatedBaseline = {
      ...user.hyroxBaseline,
      run1kSeconds: pendingAdjustment.newValue
    };
    
    const updatedUser = await db.saveHyroxBaseline(user.id, updatedBaseline);
    onUpdateUser(updatedUser);
    setPendingAdjustment(null);
    setSaveStatus('¡Plan reajustado! Tu Coach Virtual recalculó los ritmos de las semanas restantes.');
    setTimeout(() => setSaveStatus(''), 4000);
  };

  const hasAssignedPlan = user.hyroxPlanId === 'hyrox-12w';
  const hasBaseline = !!user.hyroxBaseline;

  if (hasAssignedPlan && !hasBaseline) {
    return (
      <HyroxOnboarding 
        user={user} 
        onUpdateUser={onUpdateUser} 
        onBaselineSaved={() => {
          setSaveStatus('¡Diagnóstico completado con éxito! Tu plan de 12 semanas se ha generado automáticamente.');
          setTimeout(() => setSaveStatus(''), 4000);
        }}
      />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Header de HYROX */}
      <div 
        className="glass-card" 
        style={{ 
          backgroundImage: 'linear-gradient(135deg, rgba(255, 107, 0, 0.15) 0%, rgba(17, 24, 39, 0.9) 100%)', 
          borderLeft: '4px solid var(--color-hyrox)',
          padding: '2rem'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <span className="badge badge-hyrox" style={{ marginBottom: '0.5rem' }}>Especialidad HYROX</span>
            <h1 style={{ fontSize: '2.2rem', fontWeight: '800', letterSpacing: '-0.03em' }}>
              HYROX <span style={{ color: 'var(--color-hyrox)' }}>PERFORMANCE</span>
            </h1>
            <p style={{ marginTop: '0.25rem', maxWidth: '600px' }}>
              Planificación y periodización de mediano y largo plazo para competiciones de HYROX. Registra tus tiempos de carrera, estaciones y recibe feedback directo del coach.
            </p>
          </div>
          <div>
            {!hasAssignedPlan ? (
              <button onClick={handleAssignPlan} className="btn btn-hyrox">
                <Flame size={18} /> Activar Plan de 12 Semanas
              </button>
            ) : (
              <span className="badge badge-success" style={{ padding: '0.5rem 1rem', display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                <CheckCircle2 size={16} /> Plan Activo: 12W Prep
              </span>
            )}
          </div>
        </div>
      </div>

      {saveStatus && (
        <div className="badge badge-success" style={{ alignSelf: 'flex-start', padding: '0.75rem 1.25rem', width: '100%', fontSize: '0.95rem' }}>
          {saveStatus}
        </div>
      )}

      {hasAssignedPlan ? (
        <>
          {/* Alerta del Coach Virtual */}
          {pendingAdjustment && (
            <div 
              className="glass-card" 
              style={{ 
                borderLeft: '4px solid var(--color-hyrox)',
                background: 'linear-gradient(135deg, rgba(255, 107, 0, 0.12) 0%, rgba(17, 24, 39, 0.95) 100%)',
                padding: '1.5rem',
                marginBottom: '1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem'
              }}
            >
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <Flame size={24} color="var(--color-hyrox)" className="pulse" />
                <div>
                  <h4 style={{ color: 'var(--color-text-main)', fontSize: '1.1rem', fontWeight: '700' }}>
                    ¡Coach Virtual: Progresión Detectada!
                  </h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                    He detectado que tu tiempo en Carrera 1K (<strong>{pendingAdjustment.newValueStr}</strong>) es mejor que tu marca basal anterior (<strong>{pendingAdjustment.oldValueStr}</strong>).
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', alignSelf: 'flex-start' }}>
                <button onClick={handleAcceptAdjustment} className="btn btn-hyrox" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', fontWeight: '600' }}>
                  Reajustar Planificación
                </button>
                <button onClick={() => setPendingAdjustment(null)} className="btn btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                  Ignorar por ahora
                </button>
              </div>
            </div>
          )}

          {/* Navegación interna */}
          <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.5rem' }}>
            <button 
              className="btn" 
              style={{ 
                background: 'none', 
                borderBottom: activeTab === 'plan' ? '2px solid var(--color-hyrox)' : 'none',
                color: activeTab === 'plan' ? 'var(--color-hyrox)' : 'var(--color-text-muted)',
                borderRadius: 0,
                padding: '0.5rem 1rem'
              }}
              onClick={() => setActiveTab('plan')}
            >
              Planes y Rutinas
            </button>
            <button 
              className="btn" 
              style={{ 
                background: 'none', 
                borderBottom: activeTab === 'progress' ? '2px solid var(--color-hyrox)' : 'none',
                color: activeTab === 'progress' ? 'var(--color-hyrox)' : 'var(--color-text-muted)',
                borderRadius: 0,
                padding: '0.5rem 1rem'
              }}
              onClick={() => setActiveTab('progress')}
            >
              Subir Métricas y Notas
            </button>
            <button 
              className="btn" 
              style={{ 
                background: 'none', 
                borderBottom: activeTab === 'logs' ? '2px solid var(--color-hyrox)' : 'none',
                color: activeTab === 'logs' ? 'var(--color-hyrox)' : 'var(--color-text-muted)',
                borderRadius: 0,
                padding: '0.5rem 1rem'
              }}
              onClick={() => setActiveTab('logs')}
            >
              Mi Progreso del Ciclo
            </button>
          </div>

          {/* VISTA 1: Rutinas y Planes */}
          {activeTab === 'plan' && (
            <div className="grid-3" style={{ gridTemplateColumns: '2fr 1fr' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div className="glass-card">
                  <h3 style={{ marginBottom: '1rem', color: 'var(--color-text-main)', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <Calendar size={20} color="var(--color-hyrox)" /> Rutina Programada
                  </h3>
                  
                  {/* Selector de semanas del plan */}
                  <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.75rem', marginBottom: '1.5rem' }}>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(w => (
                      <button 
                        key={w}
                        className={`btn ${selectedWeek === w ? 'btn-hyrox' : 'btn-secondary'}`}
                        style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                        onClick={() => setSelectedWeek(w)}
                      >
                        Semana {w}
                      </button>
                    ))}
                  </div>

                  {/* Info de la semana seleccionada */}
                  {template.weeks && (
                    <div>
                      <h4 style={{ color: 'var(--color-hyrox)', fontSize: '1.1rem', marginBottom: '0.5rem' }}>
                        Enfoque: {template.weeks[selectedWeek - 1]?.focus || 'Trabajo de Base y Progresión Semanal'}
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                        {template.weeks[selectedWeek - 1] ? (
                          template.weeks[selectedWeek - 1].workouts.map((workout, idx) => (
                            <div key={idx} style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderLeft: '3px solid var(--border-glass)', borderRadius: '4px' }}>
                              <p style={{ color: 'var(--color-text-main)', fontFamily: 'var(--font-primary)', fontWeight: '500' }}>
                                {workout}
                              </p>
                            </div>
                          ))
                        ) : (
                          <div style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.01)', border: '1px dashed var(--border-glass)', borderRadius: '8px', textAlign: 'center' }}>
                            <p style={{ color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                              El coach aún no ha pre-programado rutinas específicas fijas para la Semana {selectedWeek} en el plan global.
                              Consulta los objetivos semanales personalizados que te asigne el coach y continúa registrando tu progreso.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Objetivos de la Semana */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div className="glass-card" style={{ borderLeft: '3px solid var(--color-accent)' }}>
                  <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--color-text-main)' }}>
                    Objetivos de la Semana {selectedWeek}
                  </h3>
                  {template.weeks && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {template.weeks[selectedWeek - 1] ? (
                        <>
                          <div>
                            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Carrera 1K Target:</span>
                            <p style={{ color: 'var(--color-accent)', fontWeight: '700', fontSize: '1.2rem' }}>
                              {template.weeks[selectedWeek - 1].targetMetrics?.run1k || 'N/A'}
                            </p>
                          </div>
                          <div>
                            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Métrica Estación Target:</span>
                            <p style={{ color: 'var(--color-text-main)', fontWeight: '600' }}>
                              {template.weeks[selectedWeek - 1].targetMetrics?.sledPush75kg || template.weeks[selectedWeek - 1].targetMetrics?.farmersCarry24kg || 'N/A'}
                            </p>
                          </div>
                        </>
                      ) : (
                        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                          Objetivos globales no definidos para esta semana. Enfócate en superar tus tiempos de la semana anterior.
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="glass-card" style={{ background: 'rgba(6, 182, 212, 0.03)' }}>
                  <h4 style={{ display: 'flex', gap: '0.25rem', alignItems: 'center', marginBottom: '0.5rem', color: 'var(--color-accent)' }}>
                    <HelpCircle size={16} /> ¿Qué es HYROX?
                  </h4>
                  <p style={{ fontSize: '0.8rem', lineHeight: '1.4' }}>
                    HYROX es la competencia de Fitness más grande del mundo. Combina 8 km de carrera y 8 estaciones de ejercicios funcionales en intervalos de 1km run + 1 workout. Requiere una altísima resistencia aeróbica y fuerza muscular.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* VISTA 2: Subir Progreso y Métricas */}
          {activeTab === 'progress' && (
            <div className="grid-2">
              <div className="glass-card">
                <h3 style={{ marginBottom: '1rem', color: 'var(--color-text-main)' }}>
                  Registrar Resultados - Semana {selectedWeek}
                </h3>
                <form onSubmit={handleSubmitProgress} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  
                  <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.5rem' }}>
                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      Cargando datos para la Semana:
                      <select 
                        className="form-select" 
                        value={selectedWeek} 
                        onChange={(e) => setSelectedWeek(Number(e.target.value))}
                        style={{ padding: '0.25rem 0.5rem', width: '100px' }}
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(w => (
                          <option key={w} value={w}>Semana {w}</option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Tiempo de Carrera de 1km (min:seg)</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="Ej: 4:32" 
                      value={run1k}
                      onChange={(e) => setRun1k(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Sled Push 75kg / Sled Pull 100kg (Notas/Tiempos)</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="Ej: 4 pasadas completadas, piernas fatigadas" 
                      value={sledPush}
                      onChange={(e) => setSledPush(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Farmers Carry 24kg / Sandbag Lunges (Notas/Tiempos)</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="Ej: 100m sin soltar el agarre" 
                      value={farmersCarry}
                      onChange={(e) => setFarmersCarry(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Notas del Atleta (Nivel de fatiga, molestias o sensaciones)</label>
                    <textarea 
                      className="form-textarea" 
                      rows="3" 
                      placeholder="Ej: Siento que en la carrera puedo acelerar más, pero las transiciones a las estaciones me están tomando mucho tiempo."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    ></textarea>
                  </div>

                  <button type="submit" className="btn btn-hyrox" style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                    <Save size={18} /> Guardar Registro Semanal
                  </button>
                </form>
              </div>

              {/* Indicaciones y Feedback del Coach */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div className="glass-card" style={{ borderLeft: '4px solid var(--color-primary)' }}>
                  <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--color-text-main)' }}>
                    <MessageSquare size={20} color="var(--color-primary)" /> Comentarios del Gestor/Coach
                  </h3>
                  
                  {user.hyroxProgress?.find(p => p.weekNumber === selectedWeek)?.feedbackGestor ? (
                    <div style={{ padding: '1rem', background: 'rgba(190, 242, 100, 0.05)', borderRadius: '8px' }}>
                      <p style={{ color: 'var(--color-text-main)', fontSize: '0.95rem', fontStyle: 'italic' }}>
                        "{user.hyroxProgress.find(p => p.weekNumber === selectedWeek).feedbackGestor}"
                      </p>
                      <span style={{ display: 'block', marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--color-primary)' }}>
                        ✓ Revisado por el administrador
                      </span>
                    </div>
                  ) : (
                    <p style={{ fontStyle: 'italic' }}>
                      Aún no tienes comentarios del coach para la Semana {selectedWeek}. Una vez cargues tus resultados, el gestor los revisará y te dejará sus observaciones.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* VISTA 3: Logs y Progresión Completa */}
          {activeTab === 'logs' && (
            <div className="glass-card">
              <h3 style={{ marginBottom: '1.5rem', color: 'var(--color-text-main)' }}>
                Ciclo de Progreso y Evaluación Semanal
              </h3>
              
              {(!user.hyroxProgress || user.hyroxProgress.length === 0) ? (
                <p>Aún no has registrado métricas de ninguna semana. Dirígete a la pestaña "Subir Métricas" para empezar a registrar.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {user.hyroxProgress.map(prog => (
                    <div 
                      key={prog.weekNumber}
                      style={{ 
                        padding: '1.25rem', 
                        background: 'rgba(255, 255, 255, 0.02)', 
                        border: '1px solid var(--border-glass)',
                        borderRadius: 'var(--radius-md)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.5rem', marginBottom: '0.75rem' }}>
                        <h4 style={{ color: 'var(--color-hyrox)' }}>Semana {prog.weekNumber}</h4>
                        <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Registrado el: {prog.date}</span>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
                        <div>
                          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Tiempo 1K Carrera</span>
                          <p style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--color-text-main)' }}>{prog.run1k || '-'}</p>
                        </div>
                        <div>
                          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Sled Workout</span>
                          <p style={{ fontSize: '0.95rem', fontWeight: '500', color: 'var(--color-text-main)' }}>{prog.sledPush75kg || '-'}</p>
                        </div>
                        <div>
                          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Weights Station</span>
                          <p style={{ fontSize: '0.95rem', fontWeight: '500', color: 'var(--color-text-main)' }}>{prog.farmersCarry24kg || '-'}</p>
                        </div>
                      </div>

                      {prog.clientNotes && (
                        <div style={{ marginBottom: '0.75rem' }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Mis sensaciones:</span>
                          <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', fontFamily: 'var(--font-secondary)' }}>
                            "{prog.clientNotes}"
                          </p>
                        </div>
                      )}

                      {prog.feedbackGestor && (
                        <div style={{ padding: '0.75rem 1rem', background: 'rgba(6, 182, 212, 0.05)', borderLeft: '3px solid var(--color-accent)', borderRadius: '4px' }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--color-accent)', fontWeight: '600' }}>Objetivos/Feedback del Coach:</span>
                          <p style={{ fontSize: '0.9rem', color: 'var(--color-text-main)', fontStyle: 'italic' }}>
                            "{prog.feedbackGestor}"
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        /* Estado Inactivo */
        <div className="glass-card" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
          <Trophy size={48} color="var(--color-hyrox)" style={{ margin: '0 auto 1rem auto' }} />
          <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Comienza tu Preparación HYROX</h3>
          <p style={{ maxWidth: '500px', margin: '0 auto 1.5rem auto' }}>
            ¿Tienes pensado competir en una carrera HYROX o quieres entrenar bajo esta modalidad aeróbica de alta intensidad? Activa tu planificación ahora mismo para recibir entrenamientos específicos semanales.
          </p>
          <button onClick={handleAssignPlan} className="btn btn-hyrox">
            Activar Planificación de 12 Semanas
          </button>
        </div>
      )}

    </div>
  );
}
