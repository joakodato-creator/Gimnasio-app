import React, { useState, useEffect } from 'react';
import { db } from '../utils/mockData';
import { Calendar as CalendarIcon, Clock, Users, ShieldAlert, CheckCircle, XCircle } from 'lucide-react';

export default function BookingCalendar({ user, onUpdateUser, openConsentModal }) {
  const [classes, setClasses] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [selectedDayIdx, setSelectedDayIdx] = useState(1); // 1 = Lunes
  const [activeDate, setActiveDate] = useState(''); // Fecha actual para las reservas (YYYY-MM-DD)
  
  // Status message state
  const [statusMsg, setStatusMsg] = useState({ text: '', type: '' });

  const DAYS = [
    { name: 'Lunes', idx: 1 },
    { name: 'Martes', idx: 2 },
    { name: 'Miércoles', idx: 3 },
    { name: 'Jueves', idx: 4 },
    { name: 'Viernes', idx: 5 },
    { name: 'Sábado', idx: 6 }
  ];

  useEffect(() => {
    // Calcular la fecha para el día seleccionado en la semana en curso
    const today = new Date();
    const currentDay = today.getDay(); // 0 = Domingo, 1 = Lunes...
    const diff = today.getDate() - currentDay + selectedDayIdx;
    const targetDate = new Date(today.setDate(diff));
    setActiveDate(targetDate.toISOString().split('T')[0]);

    loadData();
  }, [selectedDayIdx]);

  const loadData = async () => {
    try {
      const cls = await db.getClasses();
      const bks = await db.getBookings();
      setClasses(cls);
      setBookings(bks);
    } catch (err) {
      showMsg(err.message, 'error');
    }
  };

  const handleBook = async (classId) => {
    // 1. Validar consentimiento médico
    if (!user.consent) {
      showMsg('Debes firmar el consentimiento de actividad física para reservar.', 'error');
      openConsentModal();
      return;
    }

    // 2. Validar créditos y vencimiento
    if (user.creditos_disponibles <= 0) {
      showMsg('No tienes créditos disponibles. Solicita una recarga al gestor.', 'error');
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    if (user.fecha_vencimiento_creditos < todayStr) {
      showMsg('Tus créditos han vencido. Solicita una recarga al gestor.', 'error');
      return;
    }

    try {
      const result = await db.createBooking(user.id, classId, activeDate);
      onUpdateUser(result.user);
      await loadData();
      showMsg('¡Turno reservado con éxito!', 'success');
    } catch (err) {
      showMsg(err.message, 'error');
    }
  };

  const handleCancel = async (bookingId) => {
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) return;

    const classItem = classes.find(c => c.id === booking.clase_id);

    // Evaluar la regla de 1 hora antes de la clase para mostrar confirmación
    const todayStr = new Date().toISOString().split('T')[0];
    let isWithinOneHour = false;

    if (booking.fecha === todayStr) {
      const now = new Date();
      const [classHour, classMinute] = classItem.hora_inicio.split(':').map(Number);
      const classTime = new Date();
      classTime.setHours(classHour, classMinute, 0, 0);

      const diffMs = classTime.getTime() - now.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);

      if (diffHours < 1 && diffHours >= 0) {
        isWithinOneHour = true;
      }
    }

    if (isWithinOneHour) {
      const confirmLoss = confirm(
        '¡ATENCIÓN! Falta menos de 1 hora para el inicio de la clase. Si cancelas ahora, PERDERÁS EL CRÉDITO. ¿Deseas cancelar de todos modos?'
      );
      if (!confirmLoss) return;
    } else {
      const confirmStandard = confirm('¿Deseas cancelar tu reserva para esta clase?');
      if (!confirmStandard) return;
    }

    try {
      const result = await db.cancelBooking(bookingId);
      if (result.user) {
        onUpdateUser(result.user);
      }
      await loadData();

      if (result.shouldRefund) {
        showMsg('Reserva cancelada. El crédito ha sido devuelto a tu cuenta.', 'success');
      } else {
        showMsg('Reserva cancelada sin reembolso de crédito (fuera de término).', 'warning');
      }
    } catch (err) {
      showMsg(err.message, 'error');
    }
  };

  const showMsg = (text, type) => {
    setStatusMsg({ text, type });
    setTimeout(() => setStatusMsg({ text: '', type: '' }), 5000);
  };

  // Filtrar clases del día seleccionado
  const filteredClasses = classes.filter(c => c.dia_semana === selectedDayIdx);

  // Obtener reservas activas del usuario actual
  const userDayBookings = bookings.filter(
    b => b.cliente_id === user.id && b.fecha === activeDate && b.estado === 'reservado'
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Resumen de créditos del Cliente */}
      <div className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Mis Créditos Activos</span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginTop: '0.25rem' }}>
            <span style={{ fontSize: '2.5rem', fontWeight: '800', color: user.creditos_disponibles <= 2 ? 'var(--color-danger)' : 'var(--color-primary)' }}>
              {user.creditos_disponibles}
            </span>
            <span style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>créditos disponibles</span>
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Fecha de Vencimiento</span>
          <p style={{ fontWeight: '600', fontSize: '1.1rem', marginTop: '0.25rem' }}>
            {user.fecha_vencimiento_creditos}
          </p>
          {user.creditos_disponibles <= 2 && (
            <span className="badge badge-danger" style={{ marginTop: '0.5rem' }}>
              Quedan pocos créditos. ¡Recarga pronto!
            </span>
          )}
        </div>
      </div>

      {statusMsg.text && (
        <div className={`badge badge-${statusMsg.type}`} style={{ padding: '0.75rem 1.25rem', width: '100%', fontSize: '0.95rem', justifyContent: 'center' }}>
          {statusMsg.text}
        </div>
      )}

      {/* Agenda Semanal */}
      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.5rem' }}>
            <CalendarIcon color="var(--color-primary)" /> Agenda de Clases
          </h2>
          <span style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', fontWeight: '500' }}>
            Semana del: <strong style={{ color: 'var(--color-text-main)' }}>{activeDate}</strong>
          </span>
        </div>

        {/* Pestañas de días de la semana */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
          {(() => {
            const shortDayNames = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
            return DAYS.map(day => (
              <button
                key={day.idx}
                className={`btn weekday-btn ${selectedDayIdx === day.idx ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setSelectedDayIdx(day.idx)}
              >
                <span className="tab-text-desktop">{day.name}</span>
                <span className="tab-text-mobile">{shortDayNames[day.idx - 1]}</span>
              </button>
            ));
          })()}
        </div>

        {/* Listado de turnos/horarios */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filteredClasses.length === 0 ? (
            <p style={{ textAlign: 'center', padding: '2rem 0' }}>No hay clases programadas para este día.</p>
          ) : (
            filteredClasses.map(classItem => {
              // Buscar si el cliente ya reservó esta clase específica en esta fecha
              const userBooking = userDayBookings.find(b => b.clase_id === classItem.id);
              
              // Contar cuántas reservas en total tiene esta clase en esta fecha
              const totalBooked = bookings.filter(
                b => b.clase_id === classItem.id && b.fecha === activeDate && b.estado === 'reservado'
              ).length;

              const isFull = totalBooked >= classItem.capacidad_maxima;
              const percentOccupied = (totalBooked / classItem.capacidad_maxima) * 100;

              return (
                <div 
                  key={classItem.id} 
                  className="glass-card-interactive"
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '1.25rem',
                    borderRadius: 'var(--radius-md)',
                    background: userBooking ? 'rgba(190, 242, 100, 0.03)' : 'rgba(255, 255, 255, 0.01)',
                    border: userBooking ? '1px solid rgba(190, 242, 100, 0.3)' : '1px solid var(--border-glass)',
                    flexWrap: 'wrap',
                    gap: '1rem'
                  }}
                >
                  {/* Horario */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div 
                      style={{ 
                        background: userBooking ? 'var(--color-primary)' : 'rgba(255, 255, 255, 0.05)', 
                        padding: '0.75rem', 
                        borderRadius: 'var(--radius-sm)',
                        color: userBooking ? 'var(--color-text-dark)' : 'var(--color-text-main)'
                      }}
                    >
                      <Clock size={20} />
                    </div>
                    <div>
                      <h4 style={{ fontSize: '1.15rem' }}>{classItem.hora_inicio} - {classItem.hora_fin} hs</h4>
                      <p style={{ fontSize: '0.85rem' }}>CrossFit & Acondicionamiento</p>
                    </div>
                  </div>

                  {/* Cupos */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', minWidth: '150px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                      <span>Cupos ocupados:</span>
                      <span style={{ fontWeight: '600', color: isFull ? 'var(--color-danger)' : 'var(--color-text-main)' }}>
                        {totalBooked} / {classItem.capacidad_maxima}
                      </span>
                    </div>
                    {/* Barra de progreso visual */}
                    <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                      <div 
                        style={{ 
                          height: '100%', 
                          width: `${percentOccupied}%`, 
                          background: isFull ? 'var(--color-danger)' : 'var(--color-primary)', 
                          borderRadius: 'var(--radius-full)',
                          transition: 'width 0.3s ease'
                        }}
                      ></div>
                    </div>
                  </div>

                  {/* Botones de acción */}
                  <div>
                    {userBooking ? (
                      <button 
                        onClick={() => handleCancel(userBooking.id)} 
                        className="btn btn-danger"
                        style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                      >
                        <XCircle size={16} /> Cancelar Reserva
                      </button>
                    ) : (
                      <button 
                        onClick={() => handleBook(classItem.id)} 
                        className={`btn ${isFull ? 'btn-disabled' : 'btn-primary'}`}
                        disabled={isFull}
                        style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem' }}
                      >
                        {isFull ? 'Completa' : 'Reservar'}
                      </button>
                    )}
                  </div>

                </div>
              );
            })
          )}
        </div>

        {/* Políticas de Turnos */}
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '2rem', padding: '1rem', background: 'rgba(255, 158, 11, 0.03)', border: '1px solid rgba(245, 158, 11, 0.1)', borderRadius: 'var(--radius-sm)' }}>
          <ShieldAlert size={20} color="var(--color-warning)" style={{ flexShrink: 0, marginTop: '0.1rem' }} />
          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
            <strong style={{ color: 'var(--color-warning)' }}>Políticas de reserva:</strong> Las cancelaciones de turnos se deben realizar con un mínimo de <strong>1 hora</strong> de anticipación para recuperar tu crédito. Las reservas consumen 1 crédito al ser creadas. Para entrenar debes haber firmado digitalmente el consentimiento físico obligatorio.
          </div>
        </div>

      </div>

    </div>
  );
}
