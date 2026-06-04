import React, { useState, useEffect } from 'react';
import { db } from './utils/mockData';
import BookingCalendar from './components/BookingCalendar';
import CrossFitTools from './components/CrossFitTools';
import HyroxTraining from './components/HyroxTraining';
import AdminPanel from './components/AdminPanel';
import WodPlanner from './components/WodPlanner';
import SportsMonitor from './components/SportsMonitor';
import { 
  Dumbbell, Calendar, Percent, Trophy, Users, LogOut, Bell, 
  ShieldAlert, FileText, CheckCircle, Flame, MessageSquare, Info, Video, QrCode
} from 'lucide-react';


const getLocalDateString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatLocalDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('wod'); // 'wod', 'booking', 'crossfit', 'hyrox', 'admin'
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [wods, setWods] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [prs, setPrs] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [classes, setClasses] = useState([]);

  // Checkin & Scanner (Hito 10)
  const [showCheckinModal, setShowCheckinModal] = useState(false);
  const [checkinResult, setCheckinResult] = useState(null);
  
  // Hito 2: Selector de WOD y Videos
  const [selectedWodDate, setSelectedWodDate] = useState(getLocalDateString());
  const [activeVideoUrl, setActiveVideoUrl] = useState(null);
  const [sliderPercentage, setSliderPercentage] = useState(75);

  // Login form states
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Self-Registration form states
  const [isRegistering, setIsRegistering] = useState(false);
  const [regName, setRegName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');

  // Reset Password states (Hito 5)
  const [newPassVal, setNewPassVal] = useState('');
  const [confirmPassVal, setConfirmPassVal] = useState('');
  const [resetPassError, setResetPassError] = useState('');

  useEffect(() => {
    const initApp = async () => {
      try {
        await db.init();
        const loadedWods = await db.getWods();
        setWods(loadedWods);
        const loadedNots = await db.getNotifications();
        setNotifications(loadedNots);
        const loadedPRs = await db.getPRs();
        setPrs(loadedPRs);
        const loadedBookings = await db.getBookings();
        setBookings(loadedBookings);
        const loadedClasses = await db.getClasses();
        setClasses(loadedClasses);

      } catch (err) {
        console.error("Error initializing app:", err);
      }
    };
    initApp();
  }, []);

  // URL Hash Routing (Hito 13 - Solución a navegación e historial)
  useEffect(() => {
    if (!currentUser) {
      if (window.location.hash) {
        window.location.hash = '';
      }
      return;
    }

    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      const allowedClientTabs = ['wod', 'booking', 'crossfit', 'hyrox', 'checkin'];
      const allowedAdminTabs = ['admin', 'wod_planner', 'sports_monitor'];

      if (currentUser.rol === 'cliente') {
        if (allowedClientTabs.includes(hash)) {
          setActiveTab(hash);
        } else {
          window.location.hash = 'wod';
          setActiveTab('wod');
        }
      } else if (currentUser.rol === 'administrador') {
        if (allowedAdminTabs.includes(hash)) {
          setActiveTab(hash);
        } else {
          window.location.hash = 'admin';
          setActiveTab('admin');
        }
      }
    };

    handleHashChange();

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [currentUser]);

  // Sincronizar activeTab con window.location.hash
  useEffect(() => {
    if (currentUser && activeTab) {
      if (window.location.hash.replace('#', '') !== activeTab) {
        window.location.hash = activeTab;
      }
    }
  }, [activeTab, currentUser]);

  const loadUserPRs = async () => {
    try {
      const loadedPRs = await db.getPRs();
      setPrs(loadedPRs);
    } catch (err) {
      console.error("Error reloading PRs:", err);
    }
  };

  const loadAppBookings = async () => {
    try {
      const loadedBks = await db.getBookings();
      setBookings(loadedBks);
      const loadedCls = await db.getClasses();
      setClasses(loadedCls);
    } catch (err) {
      console.error("Error loading app bookings/classes:", err);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const allUsers = await db.getUsers();
      const user = allUsers.find(u => u.username === username.toLowerCase() && u.password === password);
      
      if (user) {
        setCurrentUser(user);
        setLoginError('');
        
        // Si es administrador, mandarlo al panel admin
        if (user.rol === 'administrador') {
          setActiveTab('admin');
        } else {
          setActiveTab('wod');
          // Si no ha aceptado el consentimiento físico, abrir modal obligatorio
          if (!user.consent) {
            setShowConsentModal(true);
          }
        }
        
        // Recargar notificaciones, PRs, bookings
        const loadedNots = await db.getNotifications();
        setNotifications(loadedNots);
        const loadedPRs = await db.getPRs();
        setPrs(loadedPRs);
        await loadAppBookings();
      } else {
        setLoginError('Usuario o contraseña incorrectos. Intenta con gestor, lucas o sofia (clave: 123).');
      }
    } catch (err) {
      setLoginError(err.message);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!regName || !regUsername || !regPassword) return;

    try {
      const newUser = await db.registerUser({
        name: regName,
        username: regUsername,
        password: regPassword,
        email: regEmail,
        telefono: regPhone,
        creditos_disponibles: 0,
        fecha_vencimiento_creditos: '',
        consent: false,
        mustChangePassword: false
      });

      setRegName('');
      setRegUsername('');
      setRegPassword('');
      setRegEmail('');
      setRegPhone('');
      setIsRegistering(false);

      setCurrentUser(newUser);
      setActiveTab('wod');
      setShowConsentModal(true);
      setLoginError('');
      
      const loadedNots = await db.getNotifications();
      setNotifications(loadedNots);
      const loadedPRs = await db.getPRs();
      setPrs(loadedPRs);
      await loadAppBookings();
    } catch (err) {
      setLoginError(err.message);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!newPassVal || !confirmPassVal) {
      setResetPassError('Por favor completa ambos campos.');
      return;
    }
    if (newPassVal !== confirmPassVal) {
      setResetPassError('Las contraseñas no coinciden.');
      return;
    }
    if (newPassVal.length < 3) {
      setResetPassError('La contraseña debe tener al menos 3 caracteres.');
      return;
    }
    try {
      const updatedUser = await db.updateUserPassword(currentUser.id, newPassVal);
      setCurrentUser(updatedUser);
      setNewPassVal('');
      setConfirmPassVal('');
      setResetPassError('');
      
      // Auto-open consent modal if not accepted
      if (!updatedUser.consent) {
        setShowConsentModal(true);
      }
    } catch (err) {
      setResetPassError(err.message);
    }
  };


  const handleLogout = () => {
    setCurrentUser(null);
    setUsername('');
    setPassword('');
    setActiveTab('wod');
  };

  const handleConsentAccept = async (accepted) => {
    try {
      const updated = await db.updateUserConsent(currentUser.id, accepted);
      setCurrentUser(updated);
      setShowConsentModal(false);
      
      // Registrar notificación en el historial
      await db.sendNotification(
        currentUser.id,
        'email',
        currentUser.email,
        `Has ${accepted ? 'ACEPTADO' : 'RECHAZADO'} el Consentimiento de Actividad Física. Estado actual: ${accepted ? 'Apto para entrenar' : 'No apto para reservar clases'}.`
      );
      
      const loadedNots = await db.getNotifications();
      setNotifications(loadedNots);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateUser = async (updatedUser) => {
    // Si el usuario modificado es el actual, actualizamos estado
    if (updatedUser && updatedUser.id === currentUser.id) {
      setCurrentUser(updatedUser);
    }
    try {
      const loadedNots = await db.getNotifications();
      setNotifications(loadedNots);
      await loadAppBookings();
    } catch (err) {
      console.error(err);
    }
  };

  // Filtrar notificaciones para el usuario actual (o todas si es admin)
  const userNotifications = currentUser?.rol === 'administrador' 
    ? notifications 
    : notifications.filter(n => n.cliente_id === currentUser?.id);

  // WOD de hoy
  const todayStr = getLocalDateString();
  const todayWod = wods.find(w => w.fecha === todayStr) || wods[0]; // fallback al último cargado

  if (!currentUser) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
        <div className="glass-card" style={{ maxWidth: '450px', width: '100%', padding: '2.5rem' }}>
          
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ display: 'inline-flex', background: 'var(--color-primary)', padding: '1rem', borderRadius: '50%', color: 'var(--color-text-dark)', marginBottom: '1rem', boxShadow: 'var(--shadow-neon)' }}>
              <Dumbbell size={32} />
            </div>
            <h1 style={{ fontSize: '2rem', fontWeight: '800' }}>GIMNASIO APP</h1>
            <p style={{ fontSize: '0.9rem' }}>Control de Turnos, CrossFit y Progresión HYROX</p>
          </div>

          {loginError && (
            <div className="badge badge-danger" style={{ width: '100%', padding: '0.75rem', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
              {loginError}
            </div>
          )}

          {!isRegistering ? (
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="form-group">
                <label className="form-label">Nombre</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Ingresa tu nombre de usuario" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Contraseña</label>
                <input 
                  type="password" 
                  className="form-input" 
                  placeholder="Ingresa tu contraseña" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
                Iniciar Sesión
              </button>
              
              <p style={{ fontSize: '0.85rem', textAlign: 'center', marginTop: '0.5rem' }}>
                ¿Eres nuevo atleta?{' '}
                <button type="button" onClick={() => { setIsRegistering(true); setLoginError(''); }} style={{ background: 'none', border: 'none', color: 'var(--color-primary)', textDecoration: 'underline', cursor: 'pointer', fontWeight: 'bold' }}>
                  Crear una Cuenta
                </button>
              </p>
            </form>
          ) : (
            <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
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
              <div className="form-group">
                <label className="form-label">Contraseña</label>
                <input 
                  type="password" 
                  className="form-input" 
                  placeholder="Ingresa tu contraseña" 
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input 
                  type="email" 
                  className="form-input" 
                  placeholder="juan@example.com" 
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                />
              </div>
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

              <button type="submit" className="btn btn-secondary" style={{ width: '100%', marginTop: '0.5rem', borderColor: 'var(--color-accent)', color: 'var(--color-accent)' }}>
                Registrarme y Comenzar
              </button>
              
              <p style={{ fontSize: '0.85rem', textAlign: 'center', marginTop: '0.5rem' }}>
                ¿Ya tienes usuario?{' '}
                <button type="button" onClick={() => { setIsRegistering(false); setLoginError(''); }} style={{ background: 'none', border: 'none', color: 'var(--color-primary)', textDecoration: 'underline', cursor: 'pointer', fontWeight: 'bold' }}>
                  Iniciar Sesión
                </button>
              </p>
            </form>
          )}


        </div>
      </div>
    );
  }

  // FORCE PASSWORD CHANGE (Hito 5)
  if (currentUser && currentUser.rol === 'cliente' && currentUser.mustChangePassword) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
        <div className="glass-card" style={{ maxWidth: '450px', width: '100%', padding: '2.5rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ display: 'inline-flex', background: 'var(--color-primary)', padding: '1rem', borderRadius: '50%', color: 'var(--color-text-dark)', marginBottom: '1rem', boxShadow: 'var(--shadow-neon)' }}>
              <ShieldAlert size={32} />
            </div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: '800' }}>CAMBIO DE CLAVE</h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
              Tu cuenta fue registrada por el administrador. Por seguridad, debes establecer una nueva contraseña personal.
            </p>
          </div>

          {resetPassError && (
            <div className="badge badge-danger" style={{ width: '100%', padding: '0.75rem', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
              {resetPassError}
            </div>
          )}

          <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="form-group">
              <label className="form-label">Nueva Contraseña</label>
              <input 
                type="password" 
                className="form-input" 
                placeholder="Mínimo 3 caracteres" 
                value={newPassVal}
                onChange={(e) => setNewPassVal(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Confirmar Contraseña</label>
              <input 
                type="password" 
                className="form-input" 
                placeholder="Repite la nueva clave" 
                value={confirmPassVal}
                onChange={(e) => setConfirmPassVal(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
              Actualizar y Continuar
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      
      {/* Header / Navbar */}
      <header 
        style={{ 
          background: 'var(--bg-glass)', 
          backdropFilter: 'blur(10px)', 
          borderBottom: '1px solid var(--border-glass)',
          position: 'sticky',
          top: 0,
          zIndex: 100
        }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }} onClick={() => setActiveTab(currentUser.rol === 'administrador' ? 'admin' : 'wod')}>
            <Dumbbell color="var(--color-primary)" size={24} />
            <span style={{ fontWeight: '800', fontSize: '1.25rem', letterSpacing: '-0.02em' }}>GIMNASIO</span>
          </div>

          {/* Estado del usuario logueado */}
          <div className="header-user-status">
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', fontSize: '0.85rem' }}>
              <span style={{ fontWeight: '600' }} className="hide-mobile">{currentUser.name}</span>
              {currentUser.rol === 'cliente' ? (
                <span style={{ color: 'var(--color-primary)', fontSize: '0.75rem', fontWeight: '500' }}>
                  {currentUser.creditos_disponibles} Créditos disp.
                </span>
              ) : (
                <span className="badge badge-primary" style={{ fontSize: '0.65rem', padding: '0.1rem 0.5rem' }}>ADMINISTRADOR</span>
              )}
            </div>

            {/* Centro de notificaciones */}
            <div style={{ position: 'relative' }}>
              <button 
                onClick={() => setShowNotifications(!showNotifications)} 
                className="btn btn-secondary" 
                style={{ padding: '0.5rem', borderRadius: '50%', border: 'none', position: 'relative' }}
              >
                <Bell size={18} />
                {userNotifications.length > 0 && (
                  <span 
                    style={{ 
                      position: 'absolute', 
                      top: '-2px', 
                      right: '-2px', 
                      background: 'var(--color-danger)', 
                      width: '8px', 
                      height: '8px', 
                      borderRadius: '50%' 
                    }}
                  ></span>
                )}
              </button>

              {/* Caja de notificaciones desplegable */}
              {showNotifications && (
                <div 
                  className="glass-card"
                  style={{ 
                    position: 'absolute', 
                    top: '45px', 
                    right: 0, 
                    width: '320px', 
                    maxHeight: '400px', 
                    overflowY: 'auto', 
                    zIndex: 200,
                    padding: '1rem',
                    border: '1px solid var(--border-glass-hover)',
                    background: 'var(--bg-surface-elevated)',
                    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)'
                  }}
                >
                  <h4 style={{ marginBottom: '0.75rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.5rem' }}>
                    Notificaciones Recibidas
                  </h4>
                  {userNotifications.length === 0 ? (
                    <p style={{ fontSize: '0.8rem', fontStyle: 'italic' }}>No tienes notificaciones pendientes.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {userNotifications.slice(0, 5).map(n => (
                        <div key={n.id} style={{ fontSize: '0.8rem', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '0.5rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                            <span className={`badge ${n.tipo === 'whatsapp' ? 'badge-success' : 'badge-primary'}`} style={{ fontSize: '0.6rem', padding: '0.1rem 0.25rem' }}>
                              {n.tipo.toUpperCase()}
                            </span>
                            <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>{n.fecha}</span>
                          </div>
                          <p style={{ color: 'var(--color-text-main)' }}>{n.mensaje}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Apto médico aviso */}
            {currentUser.rol === 'cliente' && (
              <button 
                onClick={() => setShowConsentModal(true)} 
                className="btn btn-secondary" 
                style={{ padding: '0.5rem 0.75rem', fontSize: '0.75rem', display: 'flex', gap: '0.25rem', alignItems: 'center' }}
              >
                {currentUser.consent ? (
                  <>
                    <CheckCircle size={14} color="var(--color-success)" />
                    <span style={{ color: 'var(--color-success)' }}>Apto Médico</span>
                  </>
                ) : (
                  <>
                    <ShieldAlert size={14} color="var(--color-danger)" />
                    <span style={{ color: 'var(--color-danger)' }}>Sin Apto</span>
                  </>
                )}
              </button>
            )}

            {/* Logout */}
            <button onClick={handleLogout} className="btn btn-secondary" style={{ padding: '0.5rem', borderRadius: '50%', border: 'none' }} title="Cerrar sesión">
              <LogOut size={18} />
            </button>
          </div>

        </div>
      </header>

      {/* Main Container */}
      <main style={{ flex: 1, maxWidth: '1200px', width: '100%', margin: '0 auto', padding: '2rem 1.5rem' }}>
        
        {/* Navegación por Pestañas del Administrador */}
        {currentUser.rol === 'administrador' && (
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '2rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
            <button 
              onClick={() => setActiveTab('admin')} 
              className={`btn ${activeTab === 'admin' ? 'btn-primary' : 'btn-secondary'}`}
            >
              <span className="tab-text-desktop">Gestión Administrativa (Clientes & Caja)</span>
              <span className="tab-text-mobile">Admin</span>
            </button>
            <button 
              onClick={() => setActiveTab('wod_planner')} 
              className={`btn ${activeTab === 'wod_planner' ? 'btn-primary' : 'btn-secondary'}`}
            >
              <span className="tab-text-desktop">Programación Deportiva (WODs)</span>
              <span className="tab-text-mobile">WODs</span>
            </button>
            <button 
              onClick={() => setActiveTab('sports_monitor')} 
              className={`btn ${activeTab === 'sports_monitor' ? 'btn-primary' : 'btn-secondary'}`}
            >
              <span className="tab-text-desktop">Seguimiento Deportivo (RMs & HYROX)</span>
              <span className="tab-text-mobile">Seguimiento</span>
            </button>
          </div>
        )}

        {/* Navegación por Pestañas del Cliente */}
        {currentUser.rol === 'cliente' && (
          <div className="client-tabs" style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
            <button onClick={() => setActiveTab('wod')} className={`btn ${activeTab === 'wod' ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
              <span className="tab-text-desktop">WOD Diario</span><span className="tab-text-mobile">WOD</span>
            </button>
            <button onClick={() => setActiveTab('booking')} className={`btn ${activeTab === 'booking' ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
              <span className="tab-text-desktop">Reservar Turno</span><span className="tab-text-mobile">Reservar</span>
            </button>
            <button onClick={() => setActiveTab('crossfit')} className={`btn ${activeTab === 'crossfit' ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
              <span className="tab-text-desktop">CrossFit / RMs</span><span className="tab-text-mobile">RMs</span>
            </button>
            <button onClick={() => setActiveTab('hyrox')} className={`btn ${activeTab === 'hyrox' ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', borderColor: activeTab === 'hyrox' ? 'var(--color-hyrox)' : 'transparent', whiteSpace: 'nowrap' }}>
              <span className="tab-text-desktop">Preparación HYROX</span><span className="tab-text-mobile">HYROX</span>
            </button>
            <button onClick={() => setActiveTab('checkin')} className={`btn ${activeTab === 'checkin' ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
              <span className="tab-text-desktop">Check-In QR</span><span className="tab-text-mobile">Check-In</span>
            </button>
          </div>
        )}

        {/* CONTENIDOS DE LAS PESTAÑAS */}

        {/* 1. WOD de Hoy (Solo Cliente) */}
        {currentUser.rol === 'cliente' && activeTab === 'wod' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Mensajes de bienvenida y alerta */}
            {!currentUser.consent && (
              <div 
                className="glass-card" 
                style={{ 
                  borderLeft: '4px solid var(--color-danger)', 
                  background: 'rgba(239, 68, 68, 0.05)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '1rem'
                }}
              >
                <div>
                  <h4 style={{ color: 'var(--color-danger)', fontSize: '1.1rem' }}>Falta Aceptación de Aptitud Física Obligatoria</h4>
                  <p style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>
                    Para poder reservar turnos y entrenar en el gimnasio, es obligatorio que leas y aceptes el consentimiento médico digital.
                  </p>
                </div>
                <button onClick={() => setShowConsentModal(true)} className="btn btn-danger" style={{ fontSize: '0.85rem' }}>
                  Firmar Consentimiento
                </button>
              </div>
            )}

            {/* Selector de días de la semana actual */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
              {(() => {
                const today = new Date();
                const currentDay = today.getDay(); // 0 = Dom, 1 = Lun...
                const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;
                const monday = new Date(today);
                monday.setDate(today.getDate() + mondayOffset);
                
                const dayNames = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
                const shortDayNames = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
                return dayNames.map((name, i) => {
                  const shortName = shortDayNames[i];
                  const d = new Date(monday);
                  d.setDate(monday.getDate() + i);
                  const dateStr = formatLocalDate(d);
                  const esHoy = dateStr === getLocalDateString();
                  return (
                    <button
                      key={dateStr}
                      onClick={() => { setSelectedWodDate(dateStr); setSliderPercentage(75); }}
                      className={`btn weekday-btn ${selectedWodDate === dateStr ? 'btn-primary' : 'btn-secondary'}`}
                      style={{
                        border: esHoy && selectedWodDate !== dateStr ? '1px solid var(--color-primary)' : undefined,
                      }}
                    >
                      <div style={{ fontWeight: '700' }}>
                        <span className="tab-text-desktop">{name}</span>
                        <span className="tab-text-mobile">{shortName}</span>
                      </div>
                      <div style={{ fontSize: '0.7rem', opacity: 0.8 }}>{dateStr.substring(5)}</div>
                    </button>
                  );
                });
              })()}
            </div>

            {(() => {
              const currentWod = wods.find(w => w.fecha === selectedWodDate);
              
              if (!currentWod) {
                return (
                  <div className="glass-card" style={{ textAlign: 'center', padding: '3rem', borderLeft: '4px solid var(--color-warning)' }}>
                    <div style={{ display: 'inline-flex', background: 'rgba(245, 158, 11, 0.1)', padding: '1rem', borderRadius: '50%', color: 'var(--color-warning)', marginBottom: '1rem' }}>
                      <Calendar size={32} />
                    </div>
                    <h3>Sin planificación</h3>
                    <p style={{ color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>
                      No hay entrenamiento publicado por el Coach para el día {selectedWodDate}.
                    </p>
                  </div>
                );
              }

              // Adaptar bloques
              const warmup = typeof currentWod.warmup === 'object' && currentWod.warmup !== null ? currentWod.warmup : { habilitado: !!currentWod.warmup, descripcion: currentWod.warmup || '', ejercicios: [] };
              const strength = typeof currentWod.strength === 'object' && currentWod.strength !== null ? currentWod.strength : { 
                habilitado: !!currentWod.strength_exercise, 
                descripcion: currentWod.strength_desc || '', 
                ejercicios: currentWod.strength_exercise ? [{ nombre: currentWod.strength_exercise, porcentaje: currentWod.strength_pct || 75, reps: currentWod.strength_reps || '' }] : [] 
              };
              const conditioning = typeof currentWod.conditioning === 'object' && currentWod.conditioning !== null ? currentWod.conditioning : { habilitado: !!currentWod.conditioning, descripcion: currentWod.conditioning || '', ejercicios: [] };
              const midline = typeof currentWod.midline === 'object' && currentWod.midline !== null ? currentWod.midline : { habilitado: !!currentWod.midline, descripcion: currentWod.midline || '', ejercicios: [] };
              const extra = typeof currentWod.extra === 'object' && currentWod.extra !== null ? currentWod.extra : { habilitado: !!currentWod.extra, descripcion: currentWod.extra || '', ejercicios: [] };

              return (
                <div className="responsive-split" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
                  <div className="glass-card" style={{ borderLeft: '4px solid var(--color-primary)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-glass)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
                      <div>
                        <span className={`badge ${currentWod.tipo === 'hyrox' ? 'badge-hyrox' : 'badge-primary'}`} style={{ marginBottom: '0.5rem' }}>
                          {currentWod.tipo === 'hyrox' ? 'HYROX' : 'CrossFit'}
                        </span>
                        <h2 style={{ fontSize: '1.8rem' }}>{currentWod.titulo}</h2>
                      </div>
                      <div style={{ textAlign: 'right', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                        Fecha: <strong>{currentWod.fecha}</strong>
                      </div>
                    </div>

                    {/* 1. Calentamiento */}
                    {warmup.habilitado && (
                      <div style={{ marginBottom: '1.5rem' }}>
                        <h4 style={{ color: 'var(--color-text-main)', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '0.25rem', marginBottom: '0.5rem' }}>
                          1. Entrada en Calor (Warm-up)
                        </h4>
                        <p style={{ whiteSpace: 'pre-wrap', color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>{warmup.descripcion}</p>
                        
                        {warmup.ejercicios && warmup.ejercicios.length > 0 && (
                          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
                            {warmup.ejercicios.map((ex, idx) => (
                              <span key={idx} className="badge badge-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}>
                                {ex.nombre}
                                {ex.videoUrl && (
                                  <Video size={13} color="var(--color-accent)" style={{ cursor: 'pointer' }} onClick={() => setActiveVideoUrl(ex.videoUrl)} />
                                )}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* 2. Fuerza */}
                    {strength.habilitado && (
                      <div style={{ marginBottom: '1.5rem', padding: '1.25rem', background: 'rgba(190, 242, 100, 0.01)', border: '1px solid rgba(190, 242, 100, 0.08)', borderRadius: '6px' }}>
                        <h4 style={{ color: 'var(--color-primary)', borderBottom: '1px solid rgba(190,242,100,0.1)', paddingBottom: '0.25rem', marginBottom: '0.5rem' }}>
                          2. Bloque de Fuerza / Habilidad
                        </h4>
                        {strength.descripcion && (
                          <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', fontStyle: 'italic', marginBottom: '0.75rem' }}>
                            {strength.descripcion}
                          </p>
                        )}
                        
                        {strength.ejercicios && strength.ejercicios.length > 0 ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {strength.ejercicios.map((ex, idx) => {
                              const userPrs = prs.filter(pr => pr.cliente_id === currentUser.id);
                              const matchedPR = userPrs.find(pr => pr.ejercicio.toLowerCase() === ex.nombre.toLowerCase() && pr.tipo === 'fuerza');
                              const targetPct = ex.porcentaje || 75;
                              const weight = matchedPR ? ((matchedPR.peso_maximo_kg * targetPct) / 100).toFixed(1) : null;
                              
                              return (
                                <div key={idx} style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-glass)', borderRadius: '4px' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                    <strong style={{ color: '#fff', fontSize: '1rem' }}>{ex.nombre}</strong>
                                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                      <span className="badge badge-primary" style={{ fontSize: '0.75rem' }}>
                                        {ex.reps} @ {targetPct}%
                                      </span>
                                      {ex.videoUrl && (
                                        <button 
                                          onClick={() => setActiveVideoUrl(ex.videoUrl)} 
                                          className="btn btn-secondary" 
                                          style={{ padding: '0.2rem 0.4rem', border: 'none', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '0.25rem', cursor: 'pointer' }}
                                        >
                                          <Video size={12} color="var(--color-accent)" /> Técnica
                                        </button>
                                      )}
                                    </div>
                                  </div>

                                  {matchedPR ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.03)' }}>
                                      <p style={{ fontSize: '0.85rem' }}>
                                        🏋 Peso Sugerido: <strong style={{ color: 'var(--color-primary)', fontSize: '1.05rem' }}>{weight} kg</strong> (1RM: {matchedPR.peso_maximo_kg} kg)
                                      </p>
                                      
                                      {/* Desglose de Porcentajes */}
                                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.25rem', textAlign: 'center', margin: '0.25rem 0' }}>
                                        {[60, 70, 80, 90, 100].map(pct => (
                                          <div key={pct} style={{ padding: '0.25rem', background: pct === targetPct ? 'rgba(190, 242, 100, 0.08)' : 'rgba(255,255,255,0.02)', border: pct === targetPct ? '1px solid var(--color-primary)' : '1px solid transparent', borderRadius: '3px' }}>
                                            <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>{pct}%</div>
                                            <div style={{ fontSize: '0.75rem', fontWeight: '700', color: pct === targetPct ? 'var(--color-primary)' : '#fff' }}>
                                              {((matchedPR.peso_maximo_kg * pct) / 100).toFixed(0)}k
                                            </div>
                                          </div>
                                        ))}
                                      </div>

                                      {/* Slider interactivo */}
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.25rem' }}>
                                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                          <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>Calcular %:</span>
                                          <input 
                                            type="range" 
                                            min="40" 
                                            max="110" 
                                            value={sliderPercentage} 
                                            onChange={(e) => setSliderPercentage(Number(e.target.value))} 
                                            style={{ flex: 1, height: '4px', cursor: 'pointer' }}
                                          />
                                        </div>
                                        <span className="badge badge-secondary" style={{ fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                                          {sliderPercentage}% = {((matchedPR.peso_maximo_kg * sliderPercentage) / 100).toFixed(1)} kg
                                        </span>
                                      </div>
                                    </div>
                                  ) : (
                                    <p style={{ fontSize: '0.8rem', color: 'var(--color-warning)', fontStyle: 'italic', marginTop: '0.5rem' }}>
                                      🏋 Registrar RM de {ex.nombre} para calcular sugerencias de pesos.
                                    </p>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <p style={{ fontStyle: 'italic', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>No hay ejercicios específicos vinculados para este bloque.</p>
                        )}
                      </div>
                    )}

                    {/* 3. Acondicionamiento */}
                    {conditioning.habilitado && (
                      <div style={{ marginBottom: '1.5rem' }}>
                        <h4 style={{ color: 'var(--color-text-main)', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '0.25rem', marginBottom: '0.5rem' }}>
                          3. Acondicionamiento (Conditioning / WOD)
                        </h4>
                        <p style={{ whiteSpace: 'pre-wrap', color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>{conditioning.descripcion}</p>
                        
                        {conditioning.ejercicios && conditioning.ejercicios.length > 0 && (
                          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
                            {conditioning.ejercicios.map((ex, idx) => (
                              <span key={idx} className="badge badge-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}>
                                {ex.nombre}
                                {ex.videoUrl && (
                                  <Video size={13} color="var(--color-accent)" style={{ cursor: 'pointer' }} onClick={() => setActiveVideoUrl(ex.videoUrl)} />
                                )}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* 4. Línea Media */}
                    {midline.habilitado && (
                      <div style={{ marginBottom: '1.5rem' }}>
                        <h4 style={{ color: 'var(--color-text-main)', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '0.25rem', marginBottom: '0.5rem' }}>
                          4. Línea Media & Accesorios (Midline)
                        </h4>
                        <p style={{ whiteSpace: 'pre-wrap', color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>{midline.descripcion}</p>
                        
                        {midline.ejercicios && midline.ejercicios.length > 0 && (
                          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
                            {midline.ejercicios.map((ex, idx) => (
                              <span key={idx} className="badge badge-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}>
                                {ex.nombre}
                                {ex.videoUrl && (
                                  <Video size={13} color="var(--color-accent)" style={{ cursor: 'pointer' }} onClick={() => setActiveVideoUrl(ex.videoUrl)} />
                                )}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* 5. Extra */}
                    {extra.habilitado && (
                      <div style={{ marginBottom: '1.5rem' }}>
                        <h4 style={{ color: 'var(--color-text-main)', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '0.25rem', marginBottom: '0.5rem' }}>
                          5. Trabajo Extra / Opcional (Machine Conditioning)
                        </h4>
                        <p style={{ whiteSpace: 'pre-wrap', color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>{extra.descripcion}</p>
                        
                        {extra.ejercicios && extra.ejercicios.length > 0 && (
                          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
                            {extra.ejercicios.map((ex, idx) => (
                              <span key={idx} className="badge badge-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}>
                                {ex.nombre}
                                {ex.videoUrl && (
                                  <Video size={13} color="var(--color-accent)" style={{ cursor: 'pointer' }} onClick={() => setActiveVideoUrl(ex.videoUrl)} />
                                )}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                  </div>

                  {/* Barra lateral informativa del atleta */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div className="glass-card" style={{ textAlign: 'center', background: 'rgba(190, 242, 100, 0.02)' }}>
                      <h4 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>Reservar clase hoy</h4>
                      <p style={{ fontSize: '0.8rem', marginBottom: '1rem' }}>¿Vienes a entrenar? Asegura tu cupo en la agenda semanal.</p>
                      <button onClick={() => setActiveTab('booking')} className="btn btn-primary" style={{ width: '100%', fontSize: '0.85rem' }}>
                        Ver Horarios Disponibles
                      </button>
                    </div>

                    <div className="glass-card" style={{ borderLeft: '3px solid var(--color-accent)' }}>
                      <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '1rem', marginBottom: '0.5rem' }}>
                        <Info size={16} color="var(--color-accent)" /> Tip del Coach
                      </h4>
                      <p style={{ fontSize: '0.8rem', lineHeight: '1.4' }}>
                        Recuerda calentar bien la articulación de los hombros. Mantén un ritmo de carrera constante que puedas sostener y no arranques al 100% en el primer tramo.
                      </p>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* 2. Calendario de Reservas (Solo Cliente) */}
        {currentUser.rol === 'cliente' && activeTab === 'booking' && (
          <BookingCalendar 
            user={currentUser} 
            onUpdateUser={handleUpdateUser} 
            openConsentModal={() => setShowConsentModal(true)} 
          />
        )}

        {/* 3. CrossFit Tools / RMs (Solo Cliente) */}
        {currentUser.rol === 'cliente' && activeTab === 'crossfit' && (
          <CrossFitTools user={currentUser} onReloadPRs={loadUserPRs} />
        )}

        {/* 4. HYROX Performance (Solo Cliente) */}
        {currentUser.rol === 'cliente' && activeTab === 'hyrox' && (
          <HyroxTraining user={currentUser} onUpdateUser={handleUpdateUser} />
        )}

        {/* Check-In QR (Solo Cliente) (Hito 10) */}
        {currentUser.rol === 'cliente' && activeTab === 'checkin' && (
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '600px', margin: '0 auto', textAlign: 'center', padding: '2rem 1.5rem' }}>
            <h3 style={{ color: 'var(--color-text-main)', fontSize: '1.3rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              <Calendar size={22} color="var(--color-primary)" /> Check-In de Acceso QR
            </h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', maxWidth: '400px', margin: '0 auto' }}>
              Registra tu asistencia escaneando el código QR en la tableta colocada en la recepción del gimnasio.
            </p>

            {/* Tarjeta de estado de reservas */}
            {(() => {
              // Se leen del estado local bookings y classes
              
              const now = new Date();
              const localYear = now.getFullYear();
              const localMonth = String(now.getMonth() + 1).padStart(2, '0');
              const localDate = String(now.getDate()).padStart(2, '0');
              const dateStr = `${localYear}-${localMonth}-${localDate}`;
              
              const todayBookings = bookings.filter(
                b => b.cliente_id === currentUser.id && b.fecha === dateStr && b.estado === 'reservado'
              );

              if (todayBookings.length === 0) {
                return (
                  <div style={{ background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '1rem', borderRadius: '8px', color: 'var(--color-danger)', fontSize: '0.85rem' }}>
                    <strong>No tienes turnos agendados para hoy ({dateStr}).</strong><br />
                    Recuerda que debes reservar una clase en la pestaña "Reservar Turno" antes de ingresar al gimnasio.
                  </div>
                );
              }

              // Buscar si hay alguna clase cercana (en hora)
              let upcomingBooking = null;
              let upcomingClass = null;

              for (const b of todayBookings) {
                const cls = classes.find(c => c.id === b.clase_id);
                if (cls) {
                  const [startH, startM] = cls.hora_inicio.split(':').map(Number);
                  const [endH, endM] = cls.hora_fin.split(':').map(Number);

                  const classStart = new Date(now.getTime());
                  classStart.setHours(startH, startM, 0, 0);
                  const classEnd = new Date(now.getTime());
                  classEnd.setHours(endH, endM, 0, 0);

                  const accessStart = classStart.getTime() - 15 * 60 * 1000;
                  const accessEnd = classEnd.getTime() - 15 * 60 * 1000;

                  if (now.getTime() >= accessStart && now.getTime() <= accessEnd) {
                    upcomingBooking = b;
                    upcomingClass = cls;
                    break;
                  }
                }
              }

              if (upcomingBooking && upcomingClass) {
                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ background: 'rgba(74, 222, 128, 0.05)', border: '1px solid rgba(74, 222, 128, 0.2)', padding: '1rem', borderRadius: '8px', color: 'var(--color-success)', fontSize: '0.85rem' }}>
                      <strong>¡Tienes un turno activo listo para ingresar!</strong><br />
                      Clase: {upcomingClass.hora_inicio} - {upcomingClass.hora_fin} hs. Estado de Asistencia: {upcomingBooking.asistencia === 'presente' ? 'PRESENTE ✓' : 'PENDIENTE'}
                    </div>

                    {upcomingBooking.asistencia !== 'presente' ? (
                      <button
                        onClick={() => {
                          setShowCheckinModal(true);
                          setCheckinResult(null);
                        }}
                        className="btn btn-primary"
                        style={{ padding: '0.6rem 1.5rem', alignSelf: 'center', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                      >
                        Escanear QR de Entrada
                      </button>
                    ) : (
                      <div style={{ color: 'var(--color-success)', fontWeight: '600', fontSize: '0.9rem' }}>
                        ✓ Ya registraste tu ingreso para este turno. ¡Buen entrenamiento!
                      </div>
                    )}
                  </div>
                );
              }

              // Si tiene reservas hoy pero ninguna está en hora
              const firstClassId = todayBookings[0].clase_id;
              const firstClass = classes.find(c => c.id === firstClassId);
              const timeRangeText = firstClass ? `${firstClass.hora_inicio} - ${firstClass.hora_fin} hs` : '';

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ background: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.2)', padding: '1rem', borderRadius: '8px', color: 'var(--color-warning)', fontSize: '0.85rem' }}>
                    <strong>Tienes una reserva para hoy ({timeRangeText}) pero estás fuera del horario de acceso.</strong><br />
                    Puedes ingresar desde 15 minutos antes de la clase y hasta 15 minutos antes de que finalice.
                  </div>
                  <button
                    onClick={() => {
                      setShowCheckinModal(true);
                      setCheckinResult(null);
                    }}
                    className="btn btn-secondary"
                    style={{ padding: '0.6rem 1.5rem', alignSelf: 'center', opacity: 0.8 }}
                  >
                    Intentar Escanear QR
                  </button>
                </div>
              );
            })()}
          </div>
        )}

        {/* 5. Panel de Administración / Gestor (Solo Admin) */}
        {currentUser.rol === 'administrador' && activeTab === 'admin' && (
          <AdminPanel onUpdateUser={handleUpdateUser} />
        )}

        {/* 6. Panel de Programación Deportiva (Solo Admin) */}
        {currentUser.rol === 'administrador' && activeTab === 'wod_planner' && (
          <WodPlanner />
        )}

        {/* 7. Seguimiento Deportivo (RMs & HYROX) (Solo Admin) */}
        {currentUser.rol === 'administrador' && activeTab === 'sports_monitor' && (
          <SportsMonitor />
        )}


      </main>

      {/* MODAL OBLIGATORIO DE CONSENTIMIENTO MÉDICO / ACTIVIDAD FÍSICA */}
      {showConsentModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '1rem', marginBottom: '1.5rem', color: 'var(--color-primary)' }}>
              <FileText size={24} />
              <h2 style={{ fontSize: '1.5rem' }}>Declaración de Aptitud y Consentimiento Físico</h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.9rem', color: 'var(--color-text-muted)', maxHeight: '350px', overflowY: 'auto', paddingRight: '0.5rem', marginBottom: '1.5rem' }}>
              <p style={{ color: 'var(--color-text-main)', fontWeight: '600' }}>
                Por favor lee atentamente y acepta los siguientes términos antes de continuar utilizando la aplicación y reservar turnos en el gimnasio:
              </p>
              
              <p>
                1. <strong>Declaración de Salud:</strong> Declaro que me encuentro en buenas condiciones físicas y de salud para realizar entrenamientos de CrossFit, fuerza, resistencia funcional y HYROX. No poseo prescripción médica alguna que limite o impida mi participación en actividades de alta intensidad.
              </p>
              <p>
                2. <strong>Asunción de Riesgo:</strong> Comprendo y acepto que el entrenamiento deportivo de alta intensidad involucra esfuerzos cardiovasculares y de fuerza física extremos, los cuales conllevan un riesgo de lesión o fatiga física severa. Asumo voluntariamente dichos riesgos al realizar las rutinas propuestas.
              </p>
              <p>
                3. <strong>Supervisión de Carga:</strong> Me comprometo a regular las cargas de peso, ritmos de carrera e intensidad del ejercicio de acuerdo con mis capacidades y marcas personales registradas (RMs), priorizando la técnica del movimiento por sobre el peso levantado.
              </p>
              <p>
                4. <strong>Autorización de Datos:</strong> Acepto que el gimnasio cargue mis créditos mensuales, supervise mis marcas de fuerza y gestione mi planificación de HYROX en esta aplicación para su optimización deportiva.
              </p>
              
              <div style={{ display: 'flex', gap: '0.5rem', padding: '0.75rem', background: 'rgba(239, 68, 68, 0.03)', border: '1px solid rgba(239, 68, 68, 0.1)', borderRadius: '4px', marginTop: '0.5rem' }}>
                <ShieldAlert size={18} color="var(--color-danger)" style={{ flexShrink: 0, marginTop: '0.1rem' }} />
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                  <strong>Importante:</strong> Si rechazas este consentimiento, podrás navegar las calculadoras de RM y ver los WODs de hoy, pero no se te permitirá reservar turnos en la agenda horaria por regulaciones de aptitud médica del establecimiento.
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button 
                onClick={() => handleConsentAccept(false)} 
                className="btn btn-secondary"
                style={{ color: 'var(--color-danger)', borderColor: 'rgba(239,68,68,0.2)' }}
              >
                Rechazar Consentimiento
              </button>
              <button 
                onClick={() => handleConsentAccept(true)} 
                className="btn btn-primary"
              >
                Aceptar y Continuar
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL PARA LA REPRODUCCIÓN DEL VIDEO INSTRUCTIVO DE EJERCICIOS */}
      {activeVideoUrl && (
        <div className="modal-overlay" onClick={() => setActiveVideoUrl(null)}>
          <div className="modal-content" style={{ maxWidth: '600px', width: '100%', padding: '1.5rem', background: 'var(--bg-surface)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.5rem' }}>
              <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-accent)' }}><Video size={18} /> Demostración Técnica de Movimiento</h4>
              <button className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} onClick={() => setActiveVideoUrl(null)}>Cerrar</button>
            </div>
            <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
              <iframe 
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 0 }}
                src={activeVideoUrl} 
                title="Video Tutorial" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowFullScreen
              ></iframe>
            </div>
          </div>
        </div>
      )}

      {/* MODAL SIMULADOR DE ESCÁNER DE CÓDIGO QR (Hito 10) */}
      {showCheckinModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '450px', width: '100%', padding: '1.5rem', background: 'var(--bg-surface)', textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.5rem' }}>
              <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#fff' }}>
                <Dumbbell size={18} color="var(--color-primary)" /> Lector QR de Acceso
              </h4>
              <button 
                className="btn btn-secondary" 
                style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} 
                onClick={() => setShowCheckinModal(false)}
              >
                Cerrar
              </button>
            </div>

            {checkinResult === null ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', alignItems: 'center' }}>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
                  Apunta tu cámara hacia el código QR del gimnasio que se encuentra en recepción.
                </p>

                {/* Simulated Camera Viewfinder with laser animation */}
                <div style={{ 
                  position: 'relative', 
                  width: '240px', 
                  height: '240px', 
                  background: '#0a0d14', 
                  border: '2px solid rgba(255,255,255,0.05)', 
                  borderRadius: '16px',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: 'inset 0 0 20px rgba(0,0,0,0.8)'
                }}>
                  {/* Target frame corners */}
                  <div style={{ position: 'absolute', top: '15px', left: '15px', width: '25px', height: '25px', borderTop: '3px solid var(--color-primary)', borderLeft: '3px solid var(--color-primary)' }}></div>
                  <div style={{ position: 'absolute', top: '15px', right: '15px', width: '25px', height: '25px', borderTop: '3px solid var(--color-primary)', borderRight: '3px solid var(--color-primary)' }}></div>
                  <div style={{ position: 'absolute', bottom: '15px', left: '15px', width: '25px', height: '25px', borderBottom: '3px solid var(--color-primary)', borderLeft: '3px solid var(--color-primary)' }}></div>
                  <div style={{ position: 'absolute', bottom: '15px', right: '15px', width: '25px', height: '25px', borderBottom: '3px solid var(--color-primary)', borderRight: '3px solid var(--color-primary)' }}></div>

                  {/* QR graphic mockup inside */}
                  <svg width="100" height="100" viewBox="0 0 29 29" opacity="0.3" shapeRendering="crispEdges">
                    <path d="M0,0 h7 v7 h-7 z M0,1 h5 v5 h-5 z" fill="#fff" />
                    <path d="M22,0 h7 v7 h-7 z M22,1 h5 v5 h-5 z" fill="#fff" />
                    <path d="M0,22 h7 v7 h-7 z M0,23 h5 v5 h-5 z" fill="#fff" />
                    <path d="M8,8 h4 v2 h-4 z M14,14 h3 v3 h-3 z" fill="#fff" />
                  </svg>

                  {/* Laser Line Animation */}
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '2px',
                    background: 'var(--color-danger)',
                    boxShadow: '0 0 8px var(--color-danger)',
                    animation: 'laserSweep 2.5s infinite linear'
                  }}></div>
                  
                  {/* Injecting CSS Keyframes directly via inline stylesheet */}
                  <style>{`
                    @keyframes laserSweep {
                      0% { top: 15px; }
                      50% { top: 225px; }
                      100% { top: 15px; }
                    }
                  `}</style>
                </div>

                <button
                  onClick={async () => {
                    try {
                      const res = await db.registerCheckIn(currentUser.id);
                      setCheckinResult({
                        status: 'success',
                        message: `¡Check-In Exitoso!\nAcceso autorizado a la clase de las ${res.class.hora_inicio} hs.`
                      });
                      // Recargar la info en caliente en App.jsx
                      const loadedWods = await db.getWods();
                      setWods(loadedWods);
                      await loadAppBookings();
                    } catch (err) {
                      setCheckinResult({
                        status: 'error',
                        message: err.message
                      });
                    }
                  }}
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '0.65rem', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                >
                  Confirmar Lectura de QR
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', alignItems: 'center', padding: '1rem 0' }}>
                {checkinResult.status === 'success' ? (
                  <>
                    <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(74, 222, 128, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-success)', marginBottom: '0.5rem' }}>
                      <CheckCircle size={36} />
                    </div>
                    <h5 style={{ color: 'var(--color-success)', fontSize: '1.2rem', fontWeight: '600' }}>Acceso Concedido</h5>
                    <p style={{ fontSize: '0.9rem', color: '#fff', whiteSpace: 'pre-line' }}>{checkinResult.message}</p>
                  </>
                ) : (
                  <>
                    <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-danger)', marginBottom: '0.5rem' }}>
                      <ShieldAlert size={36} />
                    </div>
                    <h5 style={{ color: 'var(--color-danger)', fontSize: '1.2rem', fontWeight: '600' }}>Acceso Denegado</h5>
                    <p style={{ fontSize: '0.9rem', color: '#fff' }}>{checkinResult.message}</p>
                  </>
                )}

                <button
                  onClick={() => {
                    setShowCheckinModal(false);
                    setCheckinResult(null);
                  }}
                  className="btn btn-secondary"
                  style={{ marginTop: '1rem', width: '100%', padding: '0.6rem' }}
                >
                  Entendido
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer 
        style={{ 
          background: 'rgba(9, 13, 22, 0.9)', 
          borderTop: '1px solid var(--border-glass)',
          padding: '1.5rem',
          textAlign: 'center',
          fontSize: '0.8rem',
          color: 'var(--color-text-muted)'
        }}
      >
        <p>© 2026 Gimnasio Performance S.A. | Todos los derechos reservados. Desarrollado en modo LocalStorage.</p>
      </footer>



    </div>
  );
}
