import React, { useState, useEffect } from 'react';
import { db } from '../utils/mockData';
import { Trophy, Dumbbell, Calendar, Send, Award, Landmark, MessageSquare, Plus } from 'lucide-react';

export default function SportsMonitor() {
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState('');
  
  // RMs states
  const [clientPRs, setClientPRs] = useState([]);
  
  // HYROX states
  const [hyroxWeek, setHyroxWeek] = useState(1);
  const [coachFeedback, setCoachFeedback] = useState('');
  const [statusMsg, setStatusMsg] = useState({ text: '', type: '' });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedClient) {
      loadClientSportsData(selectedClient);
    }
  }, [selectedClient]);

  const loadData = async () => {
    try {
      const allUsers = await db.getUsers();
      const clientsOnly = allUsers.filter(u => u.rol === 'cliente');
      setClients(clientsOnly);
      
      if (clientsOnly.length > 0) {
        setSelectedClient(clientsOnly[0].id);
      }
    } catch (err) {
      showMsg(err.message, 'error');
    }
  };

  const loadClientSportsData = async (clientId) => {
    try {
      const allPRs = await db.getPRs();
      const prs = allPRs.filter(pr => pr.cliente_id === clientId);
      setClientPRs(prs);
    } catch (err) {
      showMsg(err.message, 'error');
    }
  };

  const handleHyroxFeedbackSubmit = async (e) => {
    e.preventDefault();
    if (!selectedClient || !coachFeedback) return;

    try {
      await db.addHyroxFeedbackFromGestor(selectedClient, hyroxWeek, coachFeedback);
      setCoachFeedback('');
      showMsg(`Objetivos semanales enviados al atleta para la Semana ${hyroxWeek}.`, 'success');
      await loadClientSportsData(selectedClient);
    } catch (err) {
      showMsg(err.message, 'error');
    }
  };

  const showMsg = (text, type) => {
    setStatusMsg({ text, type });
    setTimeout(() => setStatusMsg({ text: '', type: '' }), 4000);
  };

  const targetClientObj = clients.find(c => c.id === selectedClient);
  
  // HYROX progress info
  const currentHyroxProgress = targetClientObj?.hyroxProgress || [];
  const selectedWeekProgress = currentHyroxProgress.find(p => p.weekNumber === hyroxWeek);

  const forcePRs = clientPRs.filter(pr => pr.tipo === 'fuerza');
  const benchmarkPRs = clientPRs.filter(pr => pr.tipo === 'benchmark_crossfit');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Cabecera */}
      <div 
        className="glass-card" 
        style={{ 
          backgroundImage: 'linear-gradient(135deg, rgba(190, 242, 100, 0.08) 0%, rgba(17, 24, 39, 0.9) 100%)', 
          borderLeft: '4px solid var(--color-primary)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <span className="badge badge-primary">Panel de Rendimiento</span>
            <h2 style={{ fontSize: '1.8rem', marginTop: '0.25rem' }}>Seguimiento Deportivo (RMs & HYROX)</h2>
            <p>Monitorea marcas de fuerza, récords de CrossFit y gestiona la planificación semanal de tus atletas HYROX.</p>
          </div>
          <div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ color: 'var(--color-primary)' }}>Seleccionar Atleta a Monitorear</label>
              <select 
                className="form-select"
                value={selectedClient}
                onChange={(e) => setSelectedClient(e.target.value)}
                style={{ minWidth: '220px' }}
              >
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {statusMsg.text && (
        <div className={`badge badge-${statusMsg.type}`} style={{ padding: '0.75rem', width: '100%', fontSize: '0.95rem', justifyContent: 'center' }}>
          {statusMsg.text}
        </div>
      )}

      {selectedClient && targetClientObj && (
        <div className="responsive-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          
          {/* COLUMNA 1: CrossFit RMs y Marcas de Fuerza */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* RMs de Fuerza */}
            <div className="glass-card" style={{ flex: 1 }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', color: 'var(--color-primary)' }}>
                <Dumbbell size={20} /> Marcas de Fuerza (1RM)
              </h3>
              {forcePRs.length === 0 ? (
                <p style={{ fontStyle: 'italic', color: 'var(--color-text-muted)' }}>El atleta no ha cargado registros de fuerza en su aplicación.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {forcePRs.map(pr => (
                    <div 
                      key={pr.id} 
                      style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        padding: '0.75rem 1rem', 
                        background: 'rgba(255,255,255,0.02)', 
                        border: '1px solid var(--border-glass)', 
                        borderRadius: 'var(--radius-sm)' 
                      }}
                    >
                      <div>
                        <strong style={{ color: '#fff', fontSize: '1rem' }}>{pr.ejercicio}</strong>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginLeft: '1rem' }}>Fecha: {pr.fecha}</span>
                      </div>
                      <div className="badge badge-primary" style={{ fontSize: '1rem', padding: '0.4rem 0.8rem', fontWeight: '800' }}>
                        {pr.peso_maximo_kg} kg
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Benchmarks de CrossFit */}
            <div className="glass-card" style={{ flex: 1 }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', color: 'var(--color-accent)' }}>
                <Award size={20} color="var(--color-accent)" /> Benchmarks de CrossFit (Récords)
              </h3>
              {benchmarkPRs.length === 0 ? (
                <p style={{ fontStyle: 'italic', color: 'var(--color-text-muted)' }}>El atleta no ha registrado benchmarks aún.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {benchmarkPRs.map(pr => (
                    <div 
                      key={pr.id} 
                      style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        padding: '0.75rem 1rem', 
                        background: 'rgba(255,255,255,0.02)', 
                        border: '1px solid var(--border-glass)', 
                        borderRadius: 'var(--radius-sm)' 
                      }}
                    >
                      <div>
                        <strong style={{ color: '#fff', fontSize: '1rem' }}>{pr.ejercicio}</strong>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginLeft: '1rem' }}>Fecha: {pr.fecha}</span>
                      </div>
                      <div className="badge badge-accent" style={{ fontSize: '1rem', padding: '0.4rem 0.8rem', fontWeight: '800' }}>
                        ⏱ {pr.tiempo}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* COLUMNA 2: Monitorización HYROX */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {targetClientObj && targetClientObj.hyroxPlanId === 'hyrox-12w' ? (
              <>
                {/* Ficha de Diagnóstico Inicial (Baseline) */}
                <div className="glass-card">
                  <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--color-hyrox)' }}>
                    <Trophy size={20} color="var(--color-hyrox)" /> Diagnóstico Basal de Rendimiento
                  </h3>
                  {targetClientObj.hyroxBaseline ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', background: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: '4px' }}>
                        <div>
                          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Género:</span>
                          <p style={{ fontWeight: '600', color: '#fff' }}>{targetClientObj.hyroxBaseline.gender === 'male' ? 'Masculino' : 'Femenino'}</p>
                        </div>
                        <div>
                          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Categoría:</span>
                          <p style={{ fontWeight: '600', color: 'var(--color-hyrox)' }}>{targetClientObj.hyroxBaseline.category.toUpperCase()}</p>
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', background: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: '4px' }}>
                        <div>
                          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Carrera 1K:</span>
                          <p style={{ fontWeight: '700', color: 'var(--color-accent)' }}>
                            {Math.floor(targetClientObj.hyroxBaseline.run1kSeconds / 60)}:{(targetClientObj.hyroxBaseline.run1kSeconds % 60).toString().padStart(2, '0')} min
                          </p>
                        </div>
                        <div>
                          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Remo 1K:</span>
                          <p style={{ fontWeight: '600', color: '#fff' }}>
                            {Math.floor(targetClientObj.hyroxBaseline.row1kSeconds / 60)}:{(targetClientObj.hyroxBaseline.row1kSeconds % 60).toString().padStart(2, '0')} min
                          </p>
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', background: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: '4px' }}>
                        <div>
                          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Sled Push 50m:</span>
                          <p style={{ fontWeight: '600', color: '#fff' }}>
                            {Math.floor(targetClientObj.hyroxBaseline.sledPushSeconds / 60)}:{(targetClientObj.hyroxBaseline.sledPushSeconds % 60).toString().padStart(2, '0')} min
                          </p>
                        </div>
                        <div>
                          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Sentadilla 1RM:</span>
                          <p style={{ fontWeight: '700', color: '#fff' }}>{targetClientObj.hyroxBaseline.squat1rmKg} kg</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p style={{ fontStyle: 'italic', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                      El atleta aún no ha completado el diagnóstico inicial (Onboarding).
                    </p>
                  )}
                </div>

                {/* Monitor de Progreso Semanal e Feedback */}
                <div className="glass-card" style={{ flex: 1 }}>
                  <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', color: 'var(--color-hyrox)' }}>
                    <MessageSquare size={20} color="var(--color-hyrox)" /> Monitor Semanal de Progresión HYROX
                  </h3>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    
                    {/* Selector de Semana a evaluar */}
                    <div className="form-group" style={{ maxWidth: '200px' }}>
                      <label className="form-label">Semana a Evaluar</label>
                      <select 
                        className="form-select"
                        value={hyroxWeek}
                        onChange={(e) => setHyroxWeek(Number(e.target.value))}
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(w => (
                          <option key={w} value={w}>Semana {w}</option>
                        ))}
                      </select>
                    </div>

                    {/* Métricas reportadas por el atleta */}
                    <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)' }}>
                      <h4 style={{ color: 'var(--color-text-main)', marginBottom: '0.75rem', fontSize: '0.9rem', fontWeight: '700' }}>
                        Métricas del Atleta (Semana {hyroxWeek})
                      </h4>

                      {selectedWeekProgress && (selectedWeekProgress.run1k || selectedWeekProgress.clientNotes) ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', background: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: '4px' }}>
                            <div>
                              <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Carrera 1K:</span>
                              <p style={{ fontWeight: '700', fontSize: '1rem', color: 'var(--color-primary)' }}>{selectedWeekProgress.run1k || 'Sin registro'}</p>
                            </div>
                            <div>
                              <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Sled Push:</span>
                              <p style={{ fontSize: '0.8rem' }}>{selectedWeekProgress.sledPush75kg || 'Sin registro'}</p>
                            </div>
                            <div>
                              <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Estación 3:</span>
                              <p style={{ fontSize: '0.8rem' }}>{selectedWeekProgress.farmersCarry24kg || 'Sin registro'}</p>
                            </div>
                          </div>
                          {selectedWeekProgress.clientNotes && (
                            <div>
                              <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Comentarios del Atleta:</span>
                              <p style={{ fontSize: '0.85rem', fontStyle: 'italic', color: 'var(--color-text-muted)', marginTop: '0.15rem' }}>
                                "{selectedWeekProgress.clientNotes}"
                              </p>
                            </div>
                          )}
                          {selectedWeekProgress.feedbackGestor && (
                            <div style={{ padding: '0.5rem 0.75rem', background: 'rgba(6, 182, 212, 0.04)', borderRadius: '4px', borderLeft: '3px solid var(--color-accent)' }}>
                              <span style={{ fontSize: '0.7rem', color: 'var(--color-accent)', fontWeight: '600' }}>Objetivos ya enviados:</span>
                              <p style={{ fontSize: '0.85rem' }}>"{selectedWeekProgress.feedbackGestor}"</p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p style={{ fontStyle: 'italic', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                          El atleta aún no ha reportado métricas para la Semana {hyroxWeek}.
                        </p>
                      )}
                    </div>

                    {/* Formulario de Feedback / Objetivos del Coach */}
                    <form onSubmit={handleHyroxFeedbackSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Programar Objetivos de la Semana / Feedback de Progresión</label>
                        <textarea 
                          className="form-textarea" 
                          rows="4" 
                          placeholder="Ej: Mantén el ritmo de 4:35/km. En el Farmers Carry, concéntrate en mantener la espalda recta y contraer el core."
                          value={coachFeedback}
                          onChange={(e) => setCoachFeedback(e.target.value)}
                          required
                        ></textarea>
                      </div>
                      <button type="submit" className="btn btn-hyrox" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                        <Send size={16} /> Enviar Ajustes de Progresión
                      </button>
                    </form>

                  </div>
                </div>
              </>
            ) : (
              <div className="glass-card" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
                <Trophy size={40} color="var(--color-text-muted)" style={{ margin: '0 auto 1rem auto', opacity: 0.5 }} />
                <h4 style={{ color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>Plan HYROX Inactivo</h4>
                <p style={{ fontSize: '0.85rem', maxWidth: '300px', margin: '0 auto' }}>
                  El atleta seleccionado no tiene activada la preparación de HYROX en su cuenta.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
