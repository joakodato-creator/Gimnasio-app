import React, { useState, useEffect } from 'react';
import { db } from '../utils/mockData';
import { Users, FileSpreadsheet, PlusCircle, CreditCard, Send, CheckCircle2, XCircle, Trash2, Calendar, Landmark, BarChart3, TrendingUp, UserCheck, Percent, RefreshCw, Mail } from 'lucide-react';

export default function AdminPanel({ onUpdateUser }) {
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState('');
  const [creditsToLoad, setCreditsToLoad] = useState(12);
  const [expiryDate, setExpiryDate] = useState('');
  const [paymentAmount, setPaymentAmount] = useState(45000);
  const [paymentMethod, setPaymentMethod] = useState('Transferencia');

  // Logs / Metrics
  const [payments, setPayments] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [statusMsg, setStatusMsg] = useState({ text: '', type: '' });

  // Asistencias y Turnos States (Hito 6)
  const [bookings, setBookings] = useState([]);
  const [classes, setClasses] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Checkins & Tótem (Hito 10)
  const [activeAsistenciasView, setActiveAsistenciasView] = useState('grilla'); // 'grilla' o 'totem'
  const [checkinLogs, setCheckinLogs] = useState([]);
  const [selectedSimulateUser, setSelectedSimulateUser] = useState('');

  // Nuevo Cliente Form States
  const [regName, setRegName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('123');
  const [regCredits, setRegCredits] = useState(0);
  const [regExpiry, setRegExpiry] = useState('');
  const [regAmount, setRegAmount] = useState(0);
  const [regMethod, setRegMethod] = useState('Transferencia');

  // Pestaña de reportes y filtros
  const [subTab, setSubTab] = useState('caja'); // 'caja' o 'reportes'
  const [reportType, setReportType] = useState('mensual'); // 'mensual' o 'semanal'
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedWeek, setSelectedWeek] = useState('');
  const [selectedReportDate, setSelectedReportDate] = useState(new Date().toISOString().split('T')[0]);
  


  // Agrupación dinámica para selectores
  const getMonthsAvailable = (customPayments, customBookings) => {
    const activePayments = customPayments || payments;
    const activeBookings = customBookings || bookings;
    const months = new Set();
    activePayments.forEach(p => {
      if (p.fecha_pago) months.add(p.fecha_pago.substring(0, 7));
    });
    activeBookings.forEach(b => {
      if (b.fecha) months.add(b.fecha.substring(0, 7));
    });
    if (months.size === 0) {
      months.add(new Date().toISOString().substring(0, 7));
    }
    return Array.from(months).sort().reverse();
  };

  const getISOWeekNumber = (d) => {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    var yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    var weekNo = Math.ceil(( ( (d - yearStart) / 86400000) + 1) / 7);
    return weekNo;
  };

  const getWeekRangeString = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // lunes
    const monday = new Date(date.setDate(diff));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    
    const pad = (n) => n.toString().padStart(2, '0');
    return `${monday.getFullYear()}-W${getISOWeekNumber(monday)} (${pad(monday.getDate())}/${pad(monday.getMonth()+1)} a ${pad(sunday.getDate())}/${pad(sunday.getMonth()+1)})`;
  };

  const getWeeksAvailable = (customPayments, customBookings) => {
    const activePayments = customPayments || payments;
    const activeBookings = customBookings || bookings;
    const weeks = new Set();
    activePayments.forEach(p => {
      if (p.fecha_pago) weeks.add(getWeekRangeString(p.fecha_pago));
    });
    activeBookings.forEach(b => {
      if (b.fecha) weeks.add(getWeekRangeString(b.fecha));
    });
    if (weeks.size === 0) {
      weeks.add(getWeekRangeString(new Date().toISOString().split('T')[0]));
    }
    return Array.from(weeks).sort().reverse();
  };

  // Cómputo de estadísticas para el período seleccionado
  const getPeriodStats = () => {
    const allBookings = bookings;
    let filteredPayments = [];
    let filteredBookings = [];

    if (reportType === 'mensual') {
      filteredPayments = payments.filter(p => p.fecha_pago && p.fecha_pago.startsWith(selectedMonth));
      filteredBookings = allBookings.filter(b => b.fecha && b.fecha.startsWith(selectedMonth));
    } else {
      filteredPayments = payments.filter(p => p.fecha_pago && getWeekRangeString(p.fecha_pago) === selectedWeek);
      filteredBookings = allBookings.filter(b => b.fecha && getWeekRangeString(b.fecha) === selectedWeek);
    }

    // 1. Ingresos de Caja
    const totalCash = filteredPayments.reduce((acc, curr) => acc + curr.monto, 0);

    // 2. Personas únicas que asistieron con reserva activa
    const activeReservations = filteredBookings.filter(b => b.estado === 'reservado');
    const uniqueAttendees = new Set(activeReservations.map(b => b.cliente_id));
    const peopleCount = uniqueAttendees.size;

    // 3. Créditos otorgados
    const creditsGiven = filteredPayments.reduce((acc, curr) => acc + (curr.creditos_cargados || 0), 0);

    // 4. Créditos consumidos
    const creditsConsumed = activeReservations.length;

    // 5. Cancelaciones y personas que cancelaron
    const cancelledReservations = filteredBookings.filter(b => b.estado === 'cancelado');
    const cancellationsCount = cancelledReservations.length;
    const uniqueCancellers = new Set(cancelledReservations.map(b => b.cliente_id));
    const peopleCancelledCount = uniqueCancellers.size;

    // Desglose por método de pago
    const paymentsByMethod = filteredPayments.reduce((acc, curr) => {
      acc[curr.metodo_pago] = (acc[curr.metodo_pago] || 0) + curr.monto;
      return acc;
    }, {});

    return {
      totalCash,
      peopleCount,
      creditsGiven,
      creditsConsumed,
      cancellationsCount,
      peopleCancelledCount,
      paymentsByMethod,
      transactionsCount: filteredPayments.length,
      bookingsCount: filteredBookings.length,
      filteredBookings
    };
  };

  const stats = getPeriodStats();

  const handleDownloadCSV = () => {
    const periodLabel = reportType === 'mensual' ? selectedMonth : selectedWeek;
    let csvContent = "\uFEFF";
    
    csvContent += `Reporte de Estadísticas del Gimnasio - Período: ${periodLabel}\n`;
    csvContent += `Generado el: ${new Date().toLocaleDateString()}\n\n`;
    
    csvContent += "RESUMEN GENERAL\n";
    csvContent += `Métrica;Valor\n`;
    csvContent += `Ingresos de Caja;$${stats.totalCash}\n`;
    csvContent += `Atletas Únicos Asistidos;${stats.peopleCount}\n`;
    csvContent += `Créditos Otorgados;${stats.creditsGiven}\n`;
    csvContent += `Créditos Consumidos;${stats.creditsConsumed}\n`;
    csvContent += `Cancelaciones Concedidas;${stats.cancellationsCount}\n`;
    csvContent += `Tasa de Cancelación;${(stats.creditsConsumed + stats.cancellationsCount > 0 ? (stats.cancellationsCount / (stats.creditsConsumed + stats.cancellationsCount)) * 100 : 0).toFixed(1)}%\n\n`;
    
    csvContent += "INGRESOS POR MEDIO DE PAGO\n";
    csvContent += "Método de Pago;Monto Cobrado\n";
    csvContent += `Transferencia;$${stats.paymentsByMethod['Transferencia'] || 0}\n`;
    csvContent += `Efectivo;$${stats.paymentsByMethod['Efectivo'] || 0}\n`;
    csvContent += `Débito / Crédito;$${stats.paymentsByMethod['Débito / Crédito'] || 0}\n\n`;
    
    csvContent += "DETALLE DE PAGOS REGISTRADOS\n";
    csvContent += "Fecha;Atleta;Método;Monto;Créditos Cargados\n";
    
    let filteredPayments = [];
    if (reportType === 'mensual') {
      filteredPayments = payments.filter(p => p.fecha_pago && p.fecha_pago.startsWith(selectedMonth));
    } else {
      filteredPayments = payments.filter(p => p.fecha_pago && getWeekRangeString(p.fecha_pago) === selectedWeek);
    }
    
    filteredPayments.forEach(p => {
      const name = getClientName(p.cliente_id);
      csvContent += `${p.fecha_pago};${name};${p.metodo_pago};$${p.monto};${p.creditos_cargados || 0}\n`;
    });

    csvContent += "\nACTIVIDAD DE ATLETAS EN EL PERÍODO\n";
    csvContent += "Atleta;Usuario;Créditos Disponibles;Reservas Efectivas;Cancelaciones Concedidas\n";
    clients.forEach(c => {
      const activeBookings = (stats.filteredBookings || []).filter(b => b.cliente_id === c.id && b.estado === 'reservado').length;
      const cancelledBookings = (stats.filteredBookings || []).filter(b => b.cliente_id === c.id && b.estado === 'cancelado').length;
      csvContent += `${c.name};@${c.username};${c.creditos_disponibles};${activeBookings};${cancelledBookings}\n`;
    });

    csvContent += `\nREPORTE DIARIO DE ASISTENCIA Y PAGOS - FECHA: ${selectedReportDate}\n`;
    const dailyBookings = bookings.filter(b => b.fecha === selectedReportDate && b.estado === 'reservado');
    const totalDailyAttendees = new Set(dailyBookings.map(b => b.cliente_id)).size;
    csvContent += `Total de Clientes que asistieron hoy:;${totalDailyAttendees}\n`;
    csvContent += "Atleta;Usuario;Clase / Horario;Saldo Créditos Actual;Fecha Vencimiento Créditos;Pago Registrado Hoy (Monto / Método)\n";
    dailyBookings.forEach(b => {
      const c = clients.find(cl => cl.id === b.cliente_id);
      const cls = classes.find(cl => cl.id === b.clase_id);
      if (c && cls) {
        const pay = payments.find(p => p.cliente_id === c.id && p.fecha_pago === selectedReportDate);
        const payStr = pay ? `$${pay.monto} (${pay.metodo_pago})` : 'Sin pagos hoy';
        csvContent += `${c.name};@${c.username};${cls.hora_inicio} - ${cls.hora_fin};${c.creditos_disponibles};${c.fecha_vencimiento_creditos || 'Sin vencimiento'};${payStr}\n`;
      }
    });
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `reporte_gimnasio_${periodLabel.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    // Establecer fecha de vencimiento a 30 días a partir de hoy
    const defaultExpiry = new Date();
    defaultExpiry.setDate(defaultExpiry.getDate() + 30);
    const expiryStr = defaultExpiry.toISOString().split('T')[0];
    setExpiryDate(expiryStr);
    setRegExpiry(expiryStr);

    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    try {
      const allUsers = await db.getUsers();
      const clientsOnly = allUsers.filter(u => u.rol === 'cliente');
      setClients(clientsOnly);
      
      if (clientsOnly.length > 0 && !selectedClient) {
        setSelectedClient(clientsOnly[0].id);
      }

      const currentPayments = await db.getPayments();
      setPayments(currentPayments);
      
      const currentNotifications = await db.getNotifications();
      setNotifications(currentNotifications);
      
      const currentBookings = await db.getBookings();
      setBookings(currentBookings);
      
      const currentClasses = await db.getClasses();
      setClasses(currentClasses);
      
      const currentLogs = await db.getCheckinLogs();
      setCheckinLogs(currentLogs);

      if (clientsOnly.length > 0 && !selectedSimulateUser) {
        setSelectedSimulateUser(clientsOnly[0].id);
      }

      // Inicializar filtros de estadísticas
      const months = getMonthsAvailable(currentPayments, currentBookings);
      if (months.length > 0 && !selectedMonth) {
        setSelectedMonth(months[0]);
      }
      const weeks = getWeeksAvailable(currentPayments, currentBookings);
      if (weeks.length > 0 && !selectedWeek) {
        setSelectedWeek(weeks[0]);
      }
    } catch (err) {
      showMsg(err.message, 'error');
    }
  };


  const handleLoadCredits = async (e) => {
    e.preventDefault();
    if (!selectedClient) return;

    const targetUser = clients.find(c => c.id === selectedClient);
    if (!targetUser) return;

    try {
      const newCredits = Number(creditsToLoad);
      const resultUser = await db.updateUserCredits(
        selectedClient, 
        newCredits, 
        expiryDate, 
        Number(paymentAmount), 
        paymentMethod
      );

      // Si el usuario actualmente logueado es el modificado en esta sesión, actualiza su estado.
      if (onUpdateUser && resultUser) {
        // (En caso de simular cambios cruzados)
      }

      showMsg(`Cargados ${creditsToLoad} créditos a ${targetUser.name}.`, 'success');
      await loadAdminData();
    } catch (err) {
      showMsg(err.message, 'error');
    }
  };

  const handleRegisterClient = async (e) => {
    e.preventDefault();
    if (!regName || !regUsername) return;

    try {
      await db.registerUser({
        name: regName,
        username: regUsername,
        email: regEmail,
        telefono: regPhone,
        password: regPassword,
        creditos_disponibles: Number(regCredits),
        fecha_vencimiento_creditos: regCredits > 0 ? regExpiry : '',
        paymentAmount: Number(regAmount),
        paymentMethod: regMethod,
        consent: false
      });

      showMsg(`Atleta ${regName} registrado con éxito.`, 'success');
      
      setRegName('');
      setRegUsername('');
      setRegEmail('');
      setRegPhone('');
      setRegPassword('123');
      setRegCredits(0);
      setRegAmount(0);
      setRegMethod('Transferencia');
      
      const defaultExpiry = new Date();
      defaultExpiry.setDate(defaultExpiry.getDate() + 30);
      setRegExpiry(defaultExpiry.toISOString().split('T')[0]);

      await loadAdminData();
    } catch (err) {
      showMsg(err.message, 'error');
    }
  };

  const handleCancelBooking = async (bookingId) => {
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) return;

    const athlete = clients.find(u => u.id === booking.cliente_id);
    const athleteName = athlete ? athlete.name : 'el atleta';

    if (confirm(`¿Seguro que deseas cancelar el turno de ${athleteName}?`)) {
      try {
        const res = await db.cancelBooking(bookingId);
        if (res.errorMsg) {
          showMsg(`Turno cancelado. ${res.errorMsg}`, 'warning');
        } else {
          showMsg(`Turno de ${athleteName} cancelado con éxito (crédito devuelto).`, 'success');
        }
        await loadAdminData();
      } catch (err) {
        showMsg(err.message, 'error');
      }
    }
  };

  const handlePrevDay = () => {
    const d = new Date(selectedDate + 'T00:00:00');
    d.setDate(d.getDate() - 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate + 'T00:00:00');
    d.setDate(d.getDate() + 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };





  const showMsg = (text, type) => {
    setStatusMsg({ text, type });
    setTimeout(() => setStatusMsg({ text: '', type: '' }), 4000);
  };

  // Calcular ingresos totales
  const totalRevenue = payments.reduce((acc, curr) => acc + curr.monto, 0);

  // Obtener nombre del cliente para los pagos
  const getClientName = (id) => {
    const u = clients.find(user => user.id === id);
    if (u) return u.name;
    if (id === 'user-admin') return 'Entrenador Gestor';
    return 'Desconocido';
  };



  // Determinar quiénes tienen pago pendiente (0 créditos o vencidos)
  const todayStr = new Date().toISOString().split('T')[0];
  const pendingClients = clients.filter(c => c.creditos_disponibles <= 0 || c.fecha_vencimiento_creditos < todayStr);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {statusMsg.text && (
        <div 
          className={`badge badge-${statusMsg.type === 'error' || statusMsg.type === 'danger' ? 'danger' : statusMsg.type === 'warning' ? 'warning' : 'success'}`} 
          style={{ 
            position: 'fixed', 
            bottom: '2rem', 
            right: '2rem', 
            padding: '0.75rem 1.25rem', 
            fontSize: '0.95rem', 
            zIndex: 9999,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            borderRadius: '4px',
            border: '1px solid rgba(255,255,255,0.1)'
          }}
        >
          {statusMsg.text}
        </div>
      )}
      
      {/* Navegación de Subpestañas del Administrador */}
      <div style={{ display: 'flex', gap: '0.75rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.75rem', flexWrap: 'wrap' }}>
        <button 
          onClick={() => setSubTab('caja')} 
          className={`btn ${subTab === 'caja' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
        >
          <CreditCard size={16} /> <span className="tab-text-desktop">Caja & Carga de Créditos</span><span className="tab-text-mobile">Caja</span>
        </button>
        <button 
          onClick={() => setSubTab('asistencias')} 
          className={`btn ${subTab === 'asistencias' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
        >
          <Calendar size={16} /> <span className="tab-text-desktop">Control de Asistencias (Turnos)</span><span className="tab-text-mobile">Turnos</span>
        </button>
        <button 
          onClick={() => setSubTab('reportes')} 
          className={`btn ${subTab === 'reportes' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
        >
          <BarChart3 size={16} /> <span className="tab-text-desktop">Reportes & Estadísticas</span><span className="tab-text-mobile">Reportes</span>
        </button>
      </div>

      {subTab === 'caja' && (
        <>
          {/* Indicadores Financieros rápidos */}
          <div className="grid-3">
            <div className="glass-card" style={{ borderLeft: '4px solid var(--color-success)' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Caja Registrada (Total Histórico)</span>
              <h2 style={{ fontSize: '2rem', marginTop: '0.25rem', color: 'var(--color-success)' }}>
                ${totalRevenue.toLocaleString()}
              </h2>
            </div>
            <div className="glass-card" style={{ borderLeft: '4px solid var(--color-accent)' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Clientes Registrados</span>
              <h2 style={{ fontSize: '2rem', marginTop: '0.25rem', color: 'var(--color-accent)' }}>
                {clients.length} Atletas
              </h2>
            </div>
            <div className="glass-card" style={{ borderLeft: '4px solid var(--color-primary)' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Total Transacciones</span>
              <h2 style={{ fontSize: '2rem', marginTop: '0.25rem', color: 'var(--color-text-main)' }}>
                {payments.length} Pagos
              </h2>
            </div>
          </div>

          {/* Sección de Cuentas Inactivas / Pagos Pendientes */}
          <div className="glass-card" style={{ borderLeft: '4px solid var(--color-warning)' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--color-warning)' }}>
              <Landmark size={20} color="var(--color-warning)" /> Control de Cuentas Inactivas (Pagos Pendientes)
            </h3>
            <p style={{ fontSize: '0.85rem', marginBottom: '1rem' }}>
              Los siguientes atletas tienen 0 créditos o sus créditos mensuales se han vencido, por lo que no pueden reservar turnos hasta registrar un nuevo pago.
            </p>
            {pendingClients.length === 0 ? (
              <p style={{ fontSize: '0.9rem', color: 'var(--color-success)', fontWeight: '600' }}>✓ Todos los atletas tienen créditos activos vigentes. No hay cobros pendientes.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {pendingClients.map(c => {
                  const reason = c.creditos_disponibles <= 0 ? 'Sin créditos disponibles' : `Créditos vencidos el ${c.fecha_vencimiento_creditos}`;
                  return (
                    <div 
                      key={c.id} 
                      style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        padding: '0.75rem 1rem', 
                        background: 'rgba(245, 158, 11, 0.03)', 
                        border: '1px solid rgba(245, 158, 11, 0.1)', 
                        borderRadius: 'var(--radius-sm)',
                        flexWrap: 'wrap',
                        gap: '0.5rem'
                      }}
                    >
                      <div>
                        <strong style={{ color: '#fff' }}>{c.name}</strong>
                        <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginLeft: '1rem' }}>
                          Estado: <span style={{ color: 'var(--color-danger)', fontWeight: '600' }}>{reason}</span>
                        </span>
                      </div>
                      <button 
                        type="button" 
                        className="btn btn-primary" 
                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}
                        onClick={() => {
                          setSelectedClient(c.id);
                          setCreditsToLoad(12);
                          setPaymentAmount(25000);
                          document.getElementById('credits-form-section')?.scrollIntoView({ behavior: 'smooth' });
                        }}
                      >
                        Registrar Pago y Cargar
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>



          <div className="grid-2">
            {/* Gestor de Créditos y Cobros */}
            <div className="glass-card" id="credits-form-section">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', color: 'var(--color-primary)' }}>
                <CreditCard size={20} /> Carga de Créditos y Pagos
              </h3>
              <form onSubmit={handleLoadCredits} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Seleccionar Cliente</label>
                  <select 
                    className="form-select"
                    value={selectedClient}
                    onChange={(e) => setSelectedClient(e.target.value)}
                  >
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.creditos_disponibles} creds)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Planes / Packs Disponibles</label>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button type="button" className="btn btn-secondary" style={{ padding: '0.4rem 0.6rem', fontSize: '0.75rem' }} onClick={() => { setCreditsToLoad(30); setPaymentAmount(50000); }}>
                      30 Creds (Mensual Libre)
                    </button>
                    <button type="button" className="btn btn-secondary" style={{ padding: '0.4rem 0.6rem', fontSize: '0.75rem' }} onClick={() => { setCreditsToLoad(16); setPaymentAmount(30000); }}>
                      16 Creds (4/Sem)
                    </button>
                    <button type="button" className="btn btn-secondary" style={{ padding: '0.4rem 0.6rem', fontSize: '0.75rem' }} onClick={() => { setCreditsToLoad(12); setPaymentAmount(25000); }}>
                      12 Creds (3/Sem)
                    </button>
                    <button type="button" className="btn btn-secondary" style={{ padding: '0.4rem 0.6rem', fontSize: '0.75rem' }} onClick={() => { setCreditsToLoad(8); setPaymentAmount(18000); }}>
                      8 Creds (2/Sem)
                    </button>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Créditos a Cargar</label>
                    <input 
                      type="number" 
                      className="form-input" 
                      value={creditsToLoad}
                      onChange={(e) => setCreditsToLoad(e.target.value)}
                      min="1"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Monto Cobrado ($)</label>
                    <input 
                      type="number" 
                      className="form-input" 
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      min="0"
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Método de Pago</label>
                    <select 
                      className="form-select"
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    >
                      <option value="Transferencia">Transferencia Bancaria</option>
                      <option value="Efectivo">Efectivo</option>
                      <option value="Débito / Crédito">Débito / Crédito</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Fecha de Vencimiento</label>
                    <input 
                      type="date" 
                      className="form-input" 
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                  <PlusCircle size={18} /> Registrar Pago y Cargar Créditos
                </button>
              </form>
            </div>

            {/* Registrar Nuevo Atleta */}
            <div className="glass-card">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', color: 'var(--color-accent)' }}>
                <UserCheck size={20} color="var(--color-accent)" /> Registrar Nuevo Atleta
              </h3>
              <form onSubmit={handleRegisterClient} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Nombre Completo</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="Ej: Juan Perez"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Nombre de Usuario (Login)</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="Ej: juan.perez"
                      value={regUsername}
                      onChange={(e) => setRegUsername(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                   <div className="form-group">
                    <label className="form-label">Contraseña de Acceso</label>
                    <input 
                      type="password" 
                      className="form-input" 
                      placeholder="Por defecto: 123"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      required
                    />
                    <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: '0.25rem', display: 'block' }}>
                      (Clave temporal. Obligatorio cambiarla al ingresar).
                    </span>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input 
                      type="email" 
                      className="form-input" 
                      placeholder="juan@gmail.com"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Teléfono (WhatsApp)</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="+54911..."
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Créditos Iniciales</label>
                    <input 
                      type="number" 
                      className="form-input" 
                      min="0"
                      value={regCredits}
                      onChange={(e) => setRegCredits(e.target.value)}
                    />
                  </div>
                </div>

                {Number(regCredits) > 0 && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', background: 'rgba(255,255,255,0.01)', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border-glass)' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Monto Cobrado ($)</label>
                      <input 
                        type="number" 
                        className="form-input" 
                        min="0"
                        value={regAmount}
                        onChange={(e) => setRegAmount(e.target.value)}
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Fecha Vencimiento</label>
                      <input 
                        type="date" 
                        className="form-input" 
                        value={regExpiry}
                        onChange={(e) => setRegExpiry(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {Number(regCredits) > 0 && (
                  <div className="form-group">
                    <label className="form-label">Método de Pago</label>
                    <select 
                      className="form-select"
                      value={regMethod}
                      onChange={(e) => setRegMethod(e.target.value)}
                    >
                      <option value="Transferencia">Transferencia Bancaria</option>
                      <option value="Efectivo">Efectivo</option>
                      <option value="Débito / Crédito">Débito / Crédito</option>
                    </select>
                  </div>
                )}

                <button type="submit" className="btn btn-secondary" style={{ width: '100%', borderColor: 'var(--color-accent)', color: 'var(--color-accent)' }}>
                  <PlusCircle size={18} /> Crear Cuenta de Atleta
                </button>
              </form>
            </div>
          </div>

          {/* Listado de Clientes y Consentimientos */}
          <div className="glass-card">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', color: 'var(--color-text-main)' }}>
              <Users size={20} /> Listado de Atletas y Estado de Consentimiento Médico
            </h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border-glass)', textAlign: 'left' }}>
                    <th style={{ padding: '0.75rem 0.5rem', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>NOMBRE</th>
                    <th style={{ padding: '0.75rem 0.5rem', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>EMAIL / TEL</th>
                    <th style={{ padding: '0.75rem 0.5rem', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>CRÉDITOS</th>
                    <th style={{ padding: '0.75rem 0.5rem', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>VENCIMIENTO</th>
                    <th style={{ padding: '0.75rem 0.5rem', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>APTO MÉDICO (CONSENTIMIENTO)</th>
                  </tr>
                </thead>
                <tbody>
                  {clients.map(client => (
                    <tr key={client.id} style={{ borderBottom: '1px solid var(--border-glass)' }}>
                      <td style={{ padding: '0.75rem 0.5rem', fontWeight: '600' }}>{client.name}</td>
                      <td style={{ padding: '0.75rem 0.5rem', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                        {client.email}<br />{client.telefono}
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', fontWeight: '700', color: client.creditos_disponibles <= 2 ? 'var(--color-danger)' : 'var(--color-primary)' }}>
                        {client.creditos_disponibles}
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', fontSize: '0.9rem' }}>
                        {client.fecha_vencimiento_creditos}
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>
                        {client.consent ? (
                          <span className="badge badge-success" style={{ display: 'inline-flex', gap: '0.25rem', alignItems: 'center' }}>
                            <CheckCircle2 size={12} /> Aceptado
                          </span>
                        ) : (
                          <span className="badge badge-danger" style={{ display: 'inline-flex', gap: '0.25rem', alignItems: 'center' }}>
                            <XCircle size={12} /> Pendiente
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid-2">
            {/* Historial de Pagos Recientes */}
            <div className="glass-card">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', color: 'var(--color-text-main)' }}>
                <FileSpreadsheet size={20} /> Historial Financiero de Caja
              </h3>
              <div style={{ overflowY: 'auto', maxHeight: '300px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-glass)', textAlign: 'left' }}>
                      <th style={{ padding: '0.5rem', color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>FECHA</th>
                      <th style={{ padding: '0.5rem', color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>ATLETA</th>
                      <th style={{ padding: '0.5rem', color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>MÉTODO</th>
                      <th style={{ padding: '0.5rem', color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>MONTO</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map(pay => (
                      <tr key={pay.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                        <td style={{ padding: '0.5rem', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{pay.fecha_pago}</td>
                        <td style={{ padding: '0.5rem', fontSize: '0.85rem', fontWeight: '500' }}>{getClientName(pay.cliente_id)}</td>
                        <td style={{ padding: '0.5rem', fontSize: '0.85rem' }}>{pay.metodo_pago}</td>
                        <td style={{ padding: '0.5rem', fontSize: '0.85rem', fontWeight: '700', color: 'var(--color-success)' }}>
                          ${pay.monto.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Consola de Notificaciones Enviadas (In-App) */}
            <div className="glass-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-accent)', margin: 0 }}>
                  <Send size={20} color="var(--color-accent)" /> Consola de Notificaciones Generadas (In-App)
                </h3>
              </div>

              <p style={{ fontSize: '0.8rem', marginBottom: '1rem' }}>
                Registro en tiempo real de las alertas de abonos y créditos emitidas automáticamente por el sistema. Los atletas verán estas advertencias directamente en sus pantallas.
              </p>

              <div style={{ overflowY: 'auto', maxHeight: '350px', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {notifications.length === 0 ? (
                  <p style={{ fontStyle: 'italic' }}>No se han emitido notificaciones aún.</p>
                ) : (
                  notifications.map(not => (
                    <div 
                      key={not.id} 
                      style={{ 
                        padding: '0.75rem', 
                        background: 'rgba(255,255,255,0.02)', 
                        border: '1px solid var(--border-glass)',
                        borderRadius: '4px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '1rem',
                        flexWrap: 'wrap'
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                          <span className={`badge ${not.tipo === 'whatsapp' ? 'badge-success' : 'badge-primary'}`} style={{ fontSize: '0.65rem' }}>
                            {not.tipo.toUpperCase()}
                          </span>
                          <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>{not.fecha}</span>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>
                          Atleta: <strong style={{ color: 'var(--color-text-main)' }}>{not.destinatario}</strong>
                        </div>
                        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-main)', fontFamily: 'var(--font-secondary)' }}>
                          {not.mensaje}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
            </div>
          </>
        )}

      {subTab === 'asistencias' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Header y Control de Fecha */}
          <div className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1.4rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Calendar color="var(--color-primary)" /> Control de Asistencias y Turnos
              </h3>
              <p>Visualiza y gestiona las reservas de los atletas por día.</p>
            </div>

            {/* Selector de Vista Interno (Hito 10) */}
            <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(255,255,255,0.03)', padding: '0.2rem', borderRadius: '4px', border: '1px solid var(--border-glass)' }}>
              <button 
                type="button"
                onClick={() => setActiveAsistenciasView('grilla')}
                className={`btn ${activeAsistenciasView === 'grilla' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ border: 'none', padding: '0.35rem 0.75rem', fontSize: '0.8rem', borderRadius: '4px' }}
              >
                Vista de Clases
              </button>
              <button 
                type="button"
                onClick={() => setActiveAsistenciasView('totem')}
                className={`btn ${activeAsistenciasView === 'totem' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ border: 'none', padding: '0.35rem 0.75rem', fontSize: '0.8rem', borderRadius: '4px' }}
              >
                Tótem de Acceso QR
              </button>
            </div>
            
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', width: '100%', maxWidth: '360px' }}>
              <button 
                type="button"
                onClick={handlePrevDay} 
                className="btn btn-secondary"
                style={{ padding: '0.5rem 0.75rem', display: 'flex', alignItems: 'center', fontSize: '0.8rem', minWidth: '40px', justifyContent: 'center' }}
              >
                ← <span className="hide-mobile" style={{ marginLeft: '0.25rem' }}>Anterior</span>
              </button>
              <input 
                type="date" 
                className="form-input" 
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                style={{ flex: 1, minWidth: 0, padding: '0.4rem 0.75rem', textAlign: 'center' }}
              />
              <button 
                type="button"
                onClick={handleNextDay} 
                className="btn btn-secondary"
                style={{ padding: '0.5rem 0.75rem', display: 'flex', alignItems: 'center', fontSize: '0.8rem', minWidth: '40px', justifyContent: 'center' }}
              >
                <span className="hide-mobile" style={{ marginRight: '0.25rem' }}>Siguiente</span> →
              </button>
            </div>
          </div>

          {/* Render Condicional según Vista (Grilla vs Tótem) */}
          {activeAsistenciasView === 'totem' ? (
            <div className="responsive-grid-2">
              {/* Lado Izquierdo: QR de Entrada */}
              <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem 1.5rem', textAlign: 'center' }}>
                <h4 style={{ color: 'var(--color-text-main)', fontSize: '1.2rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Calendar size={20} color="var(--color-primary)" /> Punto de Acceso QR Activo
                </h4>
                
                {/* SVG QR Code Simulation */}
                <div style={{ padding: '1rem', background: '#fff', borderRadius: '12px', marginBottom: '1.5rem' }}>
                  <svg width="200" height="200" viewBox="0 0 29 29" shapeRendering="crispEdges">
                    <path d="M0,0 h7 v7 h-7 z M0,1 h5 v5 h-5 z M2,2 h3 v3 h-3 z" fill="#000" stroke="none" />
                    <path d="M22,0 h7 v7 h-7 z M22,1 h5 v5 h-5 z M24,2 h3 v3 h-3 z" fill="#000" stroke="none" />
                    <path d="M0,22 h7 v7 h-7 z M0,23 h5 v5 h-5 z M2,24 h3 v3 h-3 z" fill="#000" stroke="none" />
                    <path d="M8,1 h2 v2 h-2 z M12,0 h2 v3 h-2 z M16,1 h4 v2 h-4 z M16,4 h2 v2 h-2 z M10,5 h4 v2 h-4 z M20,6 h2 v2 h-2 z" fill="#000" stroke="none" />
                    <path d="M8,8 h4 v2 h-4 z M14,9 h2 v2 h-2 z M18,8 h4 v2 h-4 z M24,8 h2 v2 h-2 z" fill="#000" stroke="none" />
                    <path d="M1,8 h2 v4 h-2 z M5,9 h2 v3 h-2 z M8,12 h2 v2 h-2 z M12,12 h3 v3 h-3 z M16,13 h4 v2 h-4 z M22,12 h2 v2 h-2 z" fill="#000" stroke="none" />
                    <path d="M2,15 h4 v2 h-4 z M8,16 h4 v3 h-4 z M14,17 h4 v2 h-4 z M20,16 h2 v2 h-2 z M24,15 h3 v3 h-3 z" fill="#000" stroke="none" />
                    <path d="M0,19 h3 v3 h-3 z M5,18 h2 v4 h-2 z M9,20 h2 v2 h-2 z M13,19 h3 v3 h-3 z M18,20 h4 v2 h-4 z M23,19 h3 v3 h-3 z" fill="#000" stroke="none" />
                    <rect x="11" y="11" width="7" height="7" fill="#fff" stroke="none" />
                    <rect x="12" y="12" width="5" height="5" fill="var(--color-primary)" stroke="none" />
                    <circle cx="14.5" cy="14.5" r="1.5" fill="#fff" stroke="none" />
                  </svg>
                </div>
                
                <h5 style={{ fontSize: '1.05rem', color: '#fff', marginBottom: '0.25rem', fontWeight: '600' }}>Escanear para registrar Asistencia</h5>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', maxWidth: '280px', marginBottom: '0' }}>
                  El atleta debe apuntar con el lector de la app a este código al ingresar al gimnasio.
                </p>

                {/* Simulador rápido para Admin */}
                <div style={{ marginTop: '2rem', width: '100%', borderTop: '1px solid var(--border-glass)', paddingTop: '1.5rem' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.75rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Herramienta de Prueba del Administrador
                  </span>
                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <select
                      className="form-select"
                      value={selectedSimulateUser}
                      onChange={(e) => setSelectedSimulateUser(e.target.value)}
                      style={{ padding: '0.4rem 0.5rem', fontSize: '0.85rem', maxWidth: '200px' }}
                    >
                      <option value="" disabled>Seleccionar atleta...</option>
                      {clients.map(c => (
                        <option key={c.id} value={c.id}>{c.name} (@{c.username})</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={async () => {
                        if (!selectedSimulateUser) {
                          showMsg('Por favor selecciona un atleta.', 'error');
                          return;
                        }
                        try {
                          await db.registerCheckIn(selectedSimulateUser);
                          showMsg(`Check-in Exitoso para ${clients.find(c => c.id === selectedSimulateUser)?.name}.`, 'success');
                          await loadAdminData();
                        } catch (err) {
                          showMsg(err.message, 'error');
                          await loadAdminData();
                        }
                      }}
                      style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}
                    >
                      Simular Escaneo
                    </button>
                  </div>
                </div>
              </div>

              {/* Lado Derecho: Bitácora de Accesos */}
              <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%', minHeight: '400px' }}>
                <h4 style={{ color: 'var(--color-text-main)', fontSize: '1.1rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Users size={18} color="var(--color-primary)" /> Bitácora de Accesos de Hoy ({selectedDate})
                </h4>
                
                {(() => {
                  const dailyLogs = checkinLogs.filter(log => log.fecha === selectedDate);
                  
                  if (dailyLogs.length === 0) {
                    return (
                      <p style={{ fontStyle: 'italic', fontSize: '0.9rem', color: 'var(--color-text-muted)', textAlign: 'center', padding: '3rem 0', marginTop: 'auto', marginBottom: 'auto' }}>
                        No se registraron intentos de ingreso en la fecha seleccionada.
                      </p>
                    );
                  }

                  return (
                    <div style={{ overflowY: 'auto', maxHeight: '420px', display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingRight: '0.25rem' }}>
                      {dailyLogs.map(log => {
                        const client = clients.find(c => c.id === log.cliente_id);
                        const athleteName = client ? client.name : 'Atleta Desconocido';
                        const username = client ? `@${client.username}` : '';
                        
                        return (
                          <div 
                            key={log.id} 
                            style={{ 
                              display: 'flex', 
                              justifyContent: 'space-between', 
                              alignItems: 'center', 
                              padding: '0.75rem 1rem', 
                              background: log.estado === 'success' ? 'rgba(74, 222, 128, 0.03)' : 'rgba(239, 68, 68, 0.03)', 
                              border: `1px solid ${log.estado === 'success' ? 'rgba(74, 222, 128, 0.15)' : 'rgba(239, 68, 68, 0.15)'}`,
                              borderRadius: 'var(--radius-sm)',
                              gap: '1rem',
                              flexWrap: 'wrap'
                            }}
                          >
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: '600' }}>
                                  {log.timestamp}
                                </span>
                                <strong style={{ color: '#fff', fontSize: '0.9rem' }}>{athleteName}</strong>
                                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{username}</span>
                              </div>
                              <div style={{ fontSize: '0.8rem', color: log.estado === 'success' ? 'var(--color-success)' : 'var(--color-danger)', marginTop: '0.25rem', fontWeight: '500' }}>
                                {log.motivo}
                              </div>
                            </div>
                            
                            <div>
                              {log.estado === 'success' ? (
                                <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}>
                                  <CheckCircle2 size={12} /> Aprobado
                                </span>
                              ) : (
                                <span className="badge badge-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}>
                                  <XCircle size={12} /> Denegado
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            </div>
          ) : (
            (() => {
              const dateObj = new Date(selectedDate + 'T00:00:00');
              const dayOfWeek = dateObj.getDay(); // 0 = Domingo, 1 = Lunes, etc.
              
              if (dayOfWeek === 0) {
                return (
                  <div className="glass-card" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                    <Calendar size={48} color="var(--color-text-muted)" style={{ marginBottom: '1rem', opacity: 0.5, margin: '0 auto' }} />
                    <h3 style={{ color: 'var(--color-text-muted)' }}>Domingo - Gimnasio Cerrado</h3>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
                      No hay turnos ni clases programadas para este día de la semana.
                    </p>
                  </div>
                );
              }

              const dayClasses = classes
                .filter(cls => cls.dia_semana === dayOfWeek)
                .sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio));

              // Calcular estadísticas diarias de turnos
              let totalBookings = 0;
              let totalCapacity = 0;
              dayClasses.forEach(cls => {
                const classBookingsCount = bookings.filter(
                  b => b.clase_id === cls.id && b.fecha === selectedDate && b.estado === 'reservado'
                ).length;
                totalBookings += classBookingsCount;
                totalCapacity += cls.capacidad_maxima;
              });
              const totalFreeSlots = Math.max(0, totalCapacity - totalBookings);

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {/* Resumen Diario de Turnos */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    <div className="glass-card" style={{ padding: '0.8rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(59, 130, 246, 0.05)', borderLeft: '3px solid var(--color-primary)' }}>
                      <div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Turnos Ocupados / Dados</span>
                        <h4 style={{ fontSize: '1.4rem', margin: '0.2rem 0 0 0', color: 'var(--color-primary)' }}>{totalBookings}</h4>
                      </div>
                    </div>
                    <div className="glass-card" style={{ padding: '0.8rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(16, 185, 129, 0.05)', borderLeft: '3px solid var(--color-success)' }}>
                      <div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Turnos Libres / Disponibles</span>
                        <h4 style={{ fontSize: '1.4rem', margin: '0.2rem 0 0 0', color: 'var(--color-success)' }}>{totalFreeSlots}</h4>
                      </div>
                    </div>
                    <div className="glass-card" style={{ padding: '0.8rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', borderLeft: '3px solid var(--color-text-muted)' }}>
                      <div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Capacidad Total del Día</span>
                        <h4 style={{ fontSize: '1.4rem', margin: '0.2rem 0 0 0', color: '#fff' }}>{totalCapacity}</h4>
                      </div>
                    </div>
                  </div>

                  {dayClasses.map(cls => {
                    const classBookings = bookings.filter(
                      b => b.clase_id === cls.id && b.fecha === selectedDate && b.estado === 'reservado'
                    );
                    
                    return (
                      <div key={cls.id} className="glass-card" style={{ padding: '1.25rem' }}>
                        {/* Cabecera de la Clase */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <span style={{ 
                              background: 'rgba(255,255,255,0.05)', 
                              border: '1px solid var(--border-glass)', 
                              padding: '0.35rem 0.75rem', 
                              borderRadius: '4px',
                              fontWeight: '700',
                              color: 'var(--color-primary)',
                              fontSize: '0.95rem'
                            }}>
                              {cls.hora_inicio} - {cls.hora_fin}
                            </span>
                            <strong style={{ fontSize: '1.1rem' }}>Turno General de Crossfit</strong>
                          </div>
                          <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                            Capacidad: <strong style={{ color: classBookings.length >= cls.capacidad_maxima ? 'var(--color-danger)' : 'var(--color-success)' }}>{classBookings.length}</strong> / {cls.capacidad_maxima}
                          </span>
                        </div>

                        {/* Lista de Reservas de Atletas */}
                        {classBookings.length === 0 ? (
                          <p style={{ fontStyle: 'italic', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
                            No hay atletas anotados en este turno.
                          </p>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {classBookings.map(booking => {
                              const athlete = clients.find(c => c.id === booking.cliente_id);
                              const name = athlete ? athlete.name : 'Atleta Desconocido';
                              const username = athlete ? athlete.username : '';
                              const consent = athlete ? athlete.consent : false;
                              const credits = athlete ? athlete.creditos_disponibles : 0;
                              
                              return (
                                <div 
                                  key={booking.id}
                                  style={{ 
                                    display: 'flex', 
                                    justifyContent: 'space-between', 
                                    alignItems: 'center', 
                                    padding: '0.6rem 1rem', 
                                    background: 'rgba(255,255,255,0.01)', 
                                    border: '1px solid var(--border-glass)', 
                                    borderRadius: 'var(--radius-sm)',
                                    flexWrap: 'wrap',
                                    gap: '1rem'
                                  }}
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
                                    <div>
                                      <strong style={{ color: '#fff', fontSize: '0.95rem' }}>{name}</strong>
                                      <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginLeft: '0.5rem' }}>
                                        (@{username})
                                      </span>
                                    </div>
                                    
                                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                      {/* Badge Apto Médico */}
                                      {consent ? (
                                        <span className="badge badge-success" style={{ fontSize: '0.7rem', display: 'inline-flex', gap: '0.25rem', alignItems: 'center' }}>
                                          <CheckCircle2 size={10} /> Apto Médico
                                        </span>
                                      ) : (
                                        <span className="badge badge-danger" style={{ fontSize: '0.7rem', display: 'inline-flex', gap: '0.25rem', alignItems: 'center' }}>
                                          <XCircle size={10} /> Sin Apto
                                        </span>
                                      )}
                                      
                                      {/* Créditos */}
                                      <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                                        Créditos: <strong style={{ color: 'var(--color-primary)' }}>{credits}</strong>
                                      </span>
                                    </div>
                                  </div>

                                  <button 
                                    type="button"
                                    className="btn btn-secondary"
                                    style={{ 
                                      padding: '0.35rem 0.6rem', 
                                      borderColor: 'var(--color-danger)', 
                                      color: 'var(--color-danger)',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '0.25rem',
                                      fontSize: '0.75rem'
                                    }}
                                    onClick={() => handleCancelBooking(booking.id)}
                                  >
                                    <Trash2 size={12} /> Cancelar Turno
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Inscripción Manual de Atletas (Hito 8) */}
                        {classBookings.length < cls.capacidad_maxima && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem', borderTop: '1px solid var(--border-glass)', paddingTop: '0.75rem', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Inscribir Atleta Manualmente:</span>
                            <select 
                              id={`add-athlete-select-${cls.id}`}
                              className="form-select" 
                              style={{ padding: '0.2rem 0.5rem', fontSize: '0.8rem', width: '200px' }}
                              defaultValue=""
                            >
                              <option value="" disabled>Selecciona un atleta...</option>
                              {clients
                                .filter(c => !classBookings.some(cb => cb.cliente_id === c.id))
                                .map(c => (
                                  <option key={c.id} value={c.id}>{c.name} (@{c.username})</option>
                                ))}
                            </select>
                            <button 
                              type="button"
                              className="btn btn-secondary"
                              style={{ 
                                padding: '0.25rem 0.75rem', 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '0.25rem', 
                                fontSize: '0.8rem',
                                height: '32px'
                              }}
                              onClick={async () => {
                                const selectEl = document.getElementById(`add-athlete-select-${cls.id}`);
                                const userId = selectEl?.value;
                                if (!userId) {
                                  showMsg('Por favor selecciona un atleta.', 'error');
                                  return;
                                }
                                try {
                                  const targetUser = clients.find(u => u.id === userId);
                                  const targetUserName = targetUser ? targetUser.name : 'Atleta';
                                  await db.createBooking(userId, cls.id, selectedDate);
                                  showMsg(`Inscripción exitosa para ${targetUserName}.`, 'success');
                                  if (selectEl) selectEl.value = "";
                                  await loadAdminData();
                                } catch (err) {
                                  showMsg(err.message, 'error');
                                }
                              }}
                            >
                              <PlusCircle size={12} /> Inscribir
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })()
          )}
        </div>
      )}

      {subTab === 'reportes' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Selector de Período y Filtros */}
          <div className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1.4rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <TrendingUp color="var(--color-primary)" /> Panel de Analítica Comercial
              </h3>
              <p>Monitorea y analiza el comportamiento financiero y la asistencia del gimnasio.</p>
            </div>
            
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', background: 'rgba(255,255,255,0.03)', padding: '0.2rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-glass)' }}>
                <button 
                  onClick={() => setReportType('mensual')} 
                  className={`btn ${reportType === 'mensual' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ border: 'none', padding: '0.35rem 0.75rem', fontSize: '0.8rem', borderRadius: '4px' }}
                >
                  Mensual
                </button>
                <button 
                  onClick={() => setReportType('semanal')} 
                  className={`btn ${reportType === 'semanal' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ border: 'none', padding: '0.35rem 0.75rem', fontSize: '0.8rem', borderRadius: '4px' }}
                >
                  Semanal
                </button>
              </div>

              {reportType === 'mensual' ? (
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <select 
                    className="form-select"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}
                  >
                    {getMonthsAvailable().map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <select 
                    className="form-select"
                    value={selectedWeek}
                    onChange={(e) => setSelectedWeek(e.target.value)}
                    style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}
                  >
                    {getWeeksAvailable().map(w => (
                      <option key={w} value={w}>{w}</option>
                    ))}
                  </select>
                </div>
              )}

              <button 
                onClick={handleDownloadCSV} 
                className="btn btn-primary"
                style={{ padding: '0.4rem 1.1rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem', height: '36px' }}
                title="Descargar Estadísticas en Excel / CSV"
              >
                <FileSpreadsheet size={16} /> Exportar Excel
              </button>
            </div>
          </div>

          {/* KPIs Principales del Período */}
          <div className="grid-3">
            <div className="glass-card" style={{ borderLeft: '4px solid var(--color-success)' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Ingresos del Período</span>
              <h2 style={{ fontSize: '2.2rem', marginTop: '0.25rem', color: 'var(--color-success)' }}>
                ${stats.totalCash.toLocaleString()}
              </h2>
              <p style={{ fontSize: '0.75rem', marginTop: '0.5rem' }}>{stats.transactionsCount} cobros registrados</p>
            </div>
            
            <div className="glass-card" style={{ borderLeft: '4px solid var(--color-primary)' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Personas que Entrenaron</span>
              <h2 style={{ fontSize: '2.2rem', marginTop: '0.25rem', color: 'var(--color-primary)' }}>
                {stats.peopleCount} Atletas
              </h2>
              <p style={{ fontSize: '0.75rem', marginTop: '0.5rem' }}>Asistencias únicas registradas en turnos</p>
            </div>

            <div className="glass-card" style={{ borderLeft: '4px solid var(--color-accent)' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Cancelaciones del Período</span>
              <h2 style={{ fontSize: '2.2rem', marginTop: '0.25rem', color: 'var(--color-accent)' }}>
                {stats.cancellationsCount} Turnos
              </h2>
              <p style={{ fontSize: '0.75rem', marginTop: '0.5rem' }}>Por {stats.peopleCancelledCount} atletas diferentes</p>
            </div>
          </div>

          {/* Gráfico Comparativo: Créditos Cargados vs Consumidos */}
          <div className="grid-2">
            <div className="glass-card">
              <h4 style={{ marginBottom: '1.25rem', color: 'var(--color-text-main)', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Percent size={18} color="var(--color-primary)" /> Balance de Créditos
              </h4>
              <p style={{ fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                Comparativa entre los créditos inyectados (por pagos de abonos) y los créditos efectivamente consumidos (turnos tomados).
              </p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                
                {/* Créditos Cargados */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                    <span>Créditos Otorgados (Cargados)</span>
                    <strong style={{ color: 'var(--color-primary)' }}>{stats.creditsGiven} crs</strong>
                  </div>
                  <div style={{ height: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '6px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: stats.creditsGiven > 0 ? '100%' : '0%', background: 'var(--color-primary)', borderRadius: '6px' }}></div>
                  </div>
                </div>

                {/* Créditos Consumidos */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                    <span>Créditos Consumidos (Turnos Activos)</span>
                    <strong style={{ color: 'var(--color-accent)' }}>{stats.creditsConsumed} crs</strong>
                  </div>
                  <div style={{ height: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '6px', overflow: 'hidden' }}>
                    <div style={{ 
                      height: '100%', 
                      width: stats.creditsGiven > 0 ? `${Math.min(100, (stats.creditsConsumed / stats.creditsGiven) * 100)}%` : (stats.creditsConsumed > 0 ? '100%' : '0%'), 
                      background: 'var(--color-accent)', 
                      borderRadius: '6px' 
                    }}></div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.4rem' }}>
                    <span>Tasa de Conversión de Crédito</span>
                    <span>{stats.creditsGiven > 0 ? ((stats.creditsConsumed / stats.creditsGiven) * 100).toFixed(0) : 0}% de créditos usados</span>
                  </div>
                </div>

              </div>
            </div>

            {/* Desglose por Método de Pago */}
            <div className="glass-card">
              <h4 style={{ marginBottom: '1.25rem', color: 'var(--color-text-main)', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Landmark size={18} color="var(--color-success)" /> Distribución de Ingresos por Medio de Pago
              </h4>
              <p style={{ fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                Medios de pago preferidos por tus atletas durante el período seleccionado.
              </p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {['Transferencia', 'Efectivo', 'Débito / Crédito'].map(method => {
                  const val = stats.paymentsByMethod[method] || 0;
                  const pct = stats.totalCash > 0 ? (val / stats.totalCash) * 100 : 0;
                  
                  return (
                    <div key={method} style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                        <span>{method}</span>
                        <span><strong>${val.toLocaleString()}</strong> ({pct.toFixed(0)}%)</span>
                      </div>
                      <div style={{ height: '8px', background: 'rgba(255,255,255,0.03)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: 'var(--color-success)', borderRadius: '4px' }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Estadísticas de Cancelaciones y Comportamiento de Turnos */}
          <div className="glass-card">
            <h4 style={{ marginBottom: '1rem', color: 'var(--color-text-main)', fontSize: '1.1rem' }}>
              Comportamiento y Tasa de Retención de Clientes
            </h4>
            <div className="responsive-grid-4" style={{ textAlign: 'center' }}>
              <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-glass)', borderRadius: '8px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Turnos Solicitados</span>
                <h3 style={{ fontSize: '1.8rem', marginTop: '0.25rem' }}>{stats.creditsConsumed + stats.cancellationsCount}</h3>
              </div>
              <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-glass)', borderRadius: '8px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Reservas Efectivas</span>
                <h3 style={{ fontSize: '1.8rem', marginTop: '0.25rem', color: 'var(--color-success)' }}>{stats.creditsConsumed}</h3>
              </div>
              <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-glass)', borderRadius: '8px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Cancelaciones Concedidas</span>
                <h3 style={{ fontSize: '1.8rem', marginTop: '0.25rem', color: 'var(--color-warning)' }}>{stats.cancellationsCount}</h3>
              </div>
              <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-glass)', borderRadius: '8px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Tasa de Cancelación</span>
                <h3 style={{ fontSize: '1.8rem', marginTop: '0.25rem', color: 'var(--color-danger)' }}>
                  {stats.creditsConsumed + stats.cancellationsCount > 0 
                    ? ((stats.cancellationsCount / (stats.creditsConsumed + stats.cancellationsCount)) * 100).toFixed(1)
                    : 0}%
                </h3>
              </div>
            </div>
          </div>

          {/* Resumen de Actividad por Atleta (Hito 7) */}
          <div className="glass-card">
            <h4 style={{ marginBottom: '1.25rem', color: 'var(--color-text-main)', fontSize: '1.1rem' }}>
              Resumen de Actividad por Atleta
            </h4>
            <p style={{ fontSize: '0.85rem', marginBottom: '1rem' }}>
              Total de reservas efectivas y cancelaciones solicitadas por cada atleta en el período seleccionado.
            </p>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border-glass)', textAlign: 'left' }}>
                    <th style={{ padding: '0.75rem 0.5rem', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>ATLETA</th>
                    <th style={{ padding: '0.75rem 0.5rem', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>USUARIO</th>
                    <th style={{ padding: '0.75rem 0.5rem', color: 'var(--color-text-muted)', fontSize: '0.85rem', textAlign: 'center' }}>CRÉDITOS DISPONIBLES</th>
                    <th style={{ padding: '0.75rem 0.5rem', color: 'var(--color-text-muted)', fontSize: '0.85rem', textAlign: 'center' }}>RESERVAS EFECTIVAS</th>
                    <th style={{ padding: '0.75rem 0.5rem', color: 'var(--color-text-muted)', fontSize: '0.85rem', textAlign: 'center' }}>CANCELACIONES</th>
                  </tr>
                </thead>
                <tbody>
                  {clients.map(client => {
                    const activeBookings = (stats.filteredBookings || []).filter(b => b.cliente_id === client.id && b.estado === 'reservado').length;
                    const cancelledBookings = (stats.filteredBookings || []).filter(b => b.cliente_id === client.id && b.estado === 'cancelado').length;
                    
                    return (
                      <tr key={client.id} style={{ borderBottom: '1px solid var(--border-glass)' }}>
                        <td style={{ padding: '0.75rem 0.5rem', fontWeight: '600' }}>{client.name}</td>
                        <td style={{ padding: '0.75rem 0.5rem', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                          @{client.username}
                        </td>
                        <td style={{ padding: '0.75rem 0.5rem', fontWeight: '700', textAlign: 'center', color: client.creditos_disponibles <= 2 ? 'var(--color-danger)' : 'var(--color-primary)' }}>
                          {client.creditos_disponibles}
                        </td>
                        <td style={{ padding: '0.75rem 0.5rem', textAlign: 'center', fontWeight: '600', color: 'var(--color-success)' }}>
                          {activeBookings}
                        </td>
                        <td style={{ padding: '0.75rem 0.5rem', textAlign: 'center', fontWeight: '600', color: 'var(--color-warning)' }}>
                          {cancelledBookings}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Reporte Diario de Cierre: Asistencia y Situación de Pagos (Hito 9) */}
          {(() => {
            const dailyBookings = bookings.filter(b => b.fecha === selectedReportDate && b.estado === 'reservado');
            const totalDailyAttendees = new Set(dailyBookings.map(b => b.cliente_id)).size;
            
            return (
              <div className="glass-card" style={{ marginTop: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <h4 style={{ color: 'var(--color-text-main)', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <Calendar size={18} color="var(--color-primary)" /> Reporte Diario de Cierre: Asistencia y Pagos
                      {totalDailyAttendees > 0 && (
                        <span className="badge badge-success" style={{ fontSize: '0.8rem', padding: '0.25rem 0.6rem', borderRadius: '20px', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', background: 'rgba(74, 222, 128, 0.2)', color: '#4ade80', border: '1px solid rgba(74, 222, 128, 0.4)', fontWeight: '600' }}>
                          {totalDailyAttendees} {totalDailyAttendees === 1 ? 'cliente' : 'clientes'}
                        </span>
                      )}
                    </h4>
                    <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                      Detalle de visitas y estado financiero de los atletas que asistieron al gimnasio.
                    </p>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Fecha:</span>
                    <input 
                      type="date" 
                      className="form-input" 
                      value={selectedReportDate}
                      onChange={(e) => setSelectedReportDate(e.target.value)}
                      style={{ width: '150px', padding: '0.3rem 0.5rem', fontSize: '0.85rem', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-glass)', borderRadius: '4px', color: '#fff' }}
                    />
                  </div>
                </div>

                {dailyBookings.length === 0 ? (
                  <p style={{ fontStyle: 'italic', fontSize: '0.9rem', color: 'var(--color-text-muted)', padding: '1rem 0' }}>
                    No se registraron asistencias ni visitas de atletas en la fecha seleccionada.
                  </p>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid var(--border-glass)', textAlign: 'left' }}>
                          <th style={{ padding: '0.75rem 0.5rem', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>ATLETA</th>
                          <th style={{ padding: '0.75rem 0.5rem', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>TURNO/CLASE</th>
                          <th style={{ padding: '0.75rem 0.5rem', color: 'var(--color-text-muted)', fontSize: '0.85rem', textAlign: 'center' }}>CRÉDITOS RESTANTES</th>
                          <th style={{ padding: '0.75rem 0.5rem', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>VENCIMIENTO ABONO</th>
                          <th style={{ padding: '0.75rem 0.5rem', color: 'var(--color-text-muted)', fontSize: '0.85rem', textAlign: 'right' }}>ABONÓ HOY ($)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dailyBookings.map(b => {
                          const client = clients.find(cl => cl.id === b.cliente_id);
                          const cls = classes.find(cl => cl.id === b.clase_id);
                          if (!client || !cls) return null;
                          
                          const pay = payments.find(p => p.cliente_id === client.id && p.fecha_pago === selectedReportDate);

                          return (
                            <tr key={b.id} style={{ borderBottom: '1px solid var(--border-glass)' }}>
                              <td style={{ padding: '0.75rem 0.5rem' }}>
                                <strong style={{ color: '#fff' }}>{client.name}</strong>
                                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>@{client.username}</div>
                              </td>
                              <td style={{ padding: '0.75rem 0.5rem', fontSize: '0.9rem' }}>
                                <span className="badge badge-primary" style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}>
                                  {cls.hora_inicio} - {cls.hora_fin} hs
                                </span>
                              </td>
                              <td style={{ padding: '0.75rem 0.5rem', textAlign: 'center', fontWeight: '700', color: client.creditos_disponibles <= 2 ? 'var(--color-danger)' : 'var(--color-primary)' }}>
                                {client.creditos_disponibles}
                              </td>
                              <td style={{ padding: '0.75rem 0.5rem', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                                {client.fecha_vencimiento_creditos || 'Sin vencimiento'}
                              </td>
                              <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right', fontWeight: '600' }}>
                                {pay ? (
                                  <span style={{ color: 'var(--color-success)' }}>
                                    ${pay.monto.toLocaleString()} ({pay.metodo_pago})
                                  </span>
                                ) : (
                                  <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>-</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })()}

        </div>
      )}
    </div>
  );
}
