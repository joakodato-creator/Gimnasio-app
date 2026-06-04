import { supabase } from './supabaseClient';

const EXERCISES_DEFAULT = [
  { name: 'Back Squat', video_url: 'https://www.youtube.com/embed/ultWZbUMPL8' },
  { name: 'Front Squat', video_url: 'https://www.youtube.com/embed/vXMRzFdU_oU' },
  { name: 'Overhead Squat', video_url: 'https://www.youtube.com/embed/RD_vUnV47vM' },
  { name: 'Clean & Jerk', video_url: 'https://www.youtube.com/embed/8miqQQJEsDY' },
  { name: 'Snatch', video_url: 'https://www.youtube.com/embed/9xQMC2xH5MY' },
  { name: 'Deadlift', video_url: 'https://www.youtube.com/embed/op9kVnSso6Q' },
  { name: 'Bench Press', video_url: 'https://www.youtube.com/embed/rT7DgCr-3pg' },
  { name: 'Strict Press', video_url: 'https://www.youtube.com/embed/2yjwHev9jGM' },
  { name: 'Thruster', video_url: 'https://www.youtube.com/embed/L219ltL15y0' },
  { name: 'Power Clean', video_url: 'https://www.youtube.com/embed/KyVmq-HBHHA' },
  { name: 'Power Snatch', video_url: 'https://www.youtube.com/embed/R31J5A03gL0' }
];

const BENCHMARKS_DEFAULT = [
  { name: 'Fran', description: '21-15-9 reps of: Thrusters (95/65 lbs) & Pull-ups' },
  { name: 'Grace', description: '30 Clean & Jerks for time (135/95 lbs)' },
  { name: 'Helen', description: '3 rounds for time of: 400m Run, 21 Kettlebell Swings (1.5/1 pd), 12 Pull-ups' },
  { name: 'Murph', description: 'For time: 1 mile Run, 100 Pull-ups, 200 Push-ups, 300 Squats, 1 mile Run (with 20 lb vest)' },
  { name: 'Cindy', description: 'AMRAP in 20 min of: 5 Pull-ups, 10 Push-ups, 15 Air Squats' },
  { name: 'Chelsea', description: 'EMOM for 30 min of: 5 Pull-ups, 10 Push-ups, 15 Air Squats' },
  { name: 'Linda', description: '10-9-8-7-6-5-4-3-2-1 reps of: Deadlift (1.5x BW), Bench Press (BW), Clean (3/4 BW)' }
];

const HYROX_TEMPLATE_PLAN = {
  id: 'hyrox-12w',
  title: 'HYROX Prep 12 Semanas (Intermedio)',
  duration: '12 Semanas',
  description: 'Plan enfocado en la mejora de la carrera de 1km bajo fatiga y en la eficiencia de las 8 estaciones de HYROX (Sled, Burpees, Wall Balls, etc.).',
  weeks: [
    {
      weekNumber: 1,
      focus: 'Fase de Base Aeróbica y Fuerza General',
      workouts: [
        'Lunes: 40 mins Carrera Z2 + 4 rondas de: 15 Goblet Squats, 10 Burpee Broad Jumps, 50m Farmers Carry',
        'Miércoles: Intervalos de carrera (5x 800m a ritmo objetivo de carrera, 2 mins descanso) + Core',
        'Viernes: Test de Sled Push (4x 50m con peso creciente) + 30 mins Remo a ritmo constante'
      ],
      targetMetrics: { run1k: 'Sub 4:45', sledPush75kg: 'Eficiencia en empuje constante' }
    },
    {
      weekNumber: 2,
      focus: 'Volumen Aeróbico y Fuerza Muscular',
      workouts: [
        'Lunes: 45 mins Carrera Z2 + 4 rondas de: 15 Wall Balls (6/9 kg), 10 Lunges con saco (15/20 kg)',
        'Miércoles: 5x 1000m remo (1:30 de descanso) + Fuerza: Peso muerto (3x8 @70%)',
        'Viernes: Simulación de Fatiga (3 rondas: 1km Carrera + 100m Farmers Carry + 20 Wall Balls)'
      ],
      targetMetrics: { run1k: 'Sostener ritmo de Z2', farmersCarry24kg: 'Agarre firme sin soltar en 100m' }
    },
    {
      weekNumber: 3,
      focus: 'Intensidad Específica y Resistencia',
      workouts: [
        'Lunes: HIIT Hyrox (EMOM 30 mins: 1. Remo 150m, 2. 15 Sandbag Lunges, 3. 12 Burpees, 4. 20 Wall Balls, 5. Descanso)',
        'Miércoles: Carrera 8km (Últimos 2km a ritmo de competencia) + Fuerza de tren inferior',
        'Viernes: Sled Pull & Push (Fuerza excéntrica) + Tramos de carrera cortos rápidos'
      ],
      targetMetrics: { run1k: 'Sub 4:35', sledPull100kg: 'Mantener técnica de cadera en retroceso' }
    }
  ]
};

const INITIAL_USERS = [
  {
    id: 'user-admin',
    username: 'gestor',
    password: '123',
    name: 'Entrenador Gestor',
    rol: 'administrador',
    email: 'gestor@gimnasio.com',
    telefono: '+5491100000000',
    creditos_disponibles: 999,
    fecha_vencimiento_creditos: '2030-12-31',
    consent: true
  },
  {
    id: 'user-lucas',
    username: 'lucas',
    password: '123',
    name: 'Lucas Gomez',
    rol: 'cliente',
    email: 'lucas.gomez@gmail.com',
    telefono: '+5491122334455',
    creditos_disponibles: 12,
    fecha_vencimiento_creditos: '2026-07-04',
    consent: true,
    hyroxPlanId: 'hyrox-12w',
    hyroxProgress: [
      { weekNumber: 1, run1k: '4:42', sledPush75kg: 'Logrado, piernas cargadas', clientNotes: 'Me sentí muy bien en la carrera, pero el sled push al final me quemó los cuádriceps.', feedbackGestor: 'Excelente tiempo de carrera. Para el Sled Push de la semana 2, intenta pasos más cortos pero más rápidos.', date: '2026-05-28' },
      { weekNumber: 2, run1k: '4:45 (promedio)', farmersCarry24kg: 'Logrado sin soltar', clientNotes: 'El Farmers Carry no se me cayó, pero sentí bastante fatiga en los antebrazos. La simulación al final fue dura.', feedbackGestor: '', date: '2026-06-03' }
    ]
  },
  {
    id: 'user-sofia',
    username: 'sofia',
    password: '123',
    name: 'Sofia Rodriguez',
    rol: 'cliente',
    email: 'sofia.rod@gmail.com',
    telefono: '+5491199887766',
    creditos_disponibles: 2,
    fecha_vencimiento_creditos: '2026-06-15',
    consent: false,
    hyroxPlanId: '',
    hyroxProgress: []
  }
];

const INITIAL_CLASSES = [
  ...['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'].flatMap((dia, diaIdx) => {
    const horas = [8, 9, 10, 11, 14, 15, 16, 17, 18, 19, 20];
    return horas.map((hora) => ({
      id: `class-${diaIdx + 1}-${hora}`,
      dia_semana: diaIdx + 1,
      dia_nombre: dia,
      hora_inicio: `${hora.toString().padStart(2, '0')}:00`,
      hora_fin: `${(hora + 1).toString().padStart(2, '0')}:00`,
      capacidad_maxima: 15
    }));
  })
];

const INITIAL_BOOKINGS = [
  {
    id: 'booking-1',
    cliente_id: 'user-lucas',
    clase_id: 'class-4-9',
    fecha: '2026-06-04',
    estado: 'reservado',
    asistencia: 'pendiente'
  },
  {
    id: 'booking-2',
    cliente_id: 'user-sofia',
    clase_id: 'class-4-19',
    fecha: '2026-06-04',
    estado: 'reservado',
    asistencia: 'pendiente'
  }
];

const INITIAL_WODS = [
  {
    id: 'wod-today',
    fecha: '2026-06-04',
    titulo: 'Fuerza de Sentadilla y Acondicionamiento de CrossFit',
    tipo: 'crossfit',
    warmup: {
      habilitado: true,
      descripcion: "3 rondas:\n- 200m Trote / Remo suave\n- 10 Air Squats (pausa de 2s abajo)\n- 10 Goblet Squats con carga liviana\n- 5 Inverted Rows en anillas",
      ejercicios: []
    },
    strength: {
      habilitado: true,
      descripcion: "Enfocarse en la velocidad y estabilidad en la fase concéntrica (subida explosiva). Descansar 2 mins entre sets.",
      ejercicios: [
        { nombre: 'Back Squat', porcentaje: 75, reps: '5 sets x 3 reps' }
      ]
    },
    conditioning: {
      habilitado: true,
      descripcion: "AMRAP 15 Minutos:\n- 15 Kettlebell Swings (24/16 kg)\n- 12 Box Jumps (24/20 in)\n- 9 Thrusters (95/65 lbs)",
      ejercicios: [
        { nombre: 'Thruster' }
      ]
    },
    midline: {
      habilitado: true,
      descripcion: "3 rondas:\n- 15 AbMat Sit-ups con peso (5kg)\n- 30 segundos de Plank Hold activo\n- 10 Arch Rocks",
      ejercicios: []
    },
    extra: {
      habilitado: true,
      descripcion: "Machine Conditioning Opcional:\n- 2000m Remo a ritmo constante (Zona 2 aeróbica)\n- Mantener parcial de carrera constante.",
      ejercicios: []
    }
  },
  {
    id: 'wod-yesterday',
    fecha: '2026-06-03',
    titulo: 'Snatch Técnico e Intervalos Intensos',
    tipo: 'crossfit',
    warmup: {
      habilitado: true,
      descripcion: "Tabata (4 mins):\n- Kettlebell Halos\n- Snatch balance con bastón\n- Jumping Jacks",
      ejercicios: []
    },
    strength: {
      habilitado: true,
      descripcion: "Trabajo de potencia partiendo de colgante (Hang Power Snatch). Foco en la extensión completa de cadera.",
      ejercicios: [
        { nombre: 'Snatch', porcentaje: 80, reps: '6 sets x 2 reps' }
      ]
    },
    conditioning: {
      habilitado: true,
      descripcion: "Por tiempo:\n- 21 Pull-ups / Ring Rows\n- 21 Thrusters (95/65 lbs)\n- 15 Pull-ups\n- 15 Thrusters\n- 9 Pull-ups\n- 9 Thrusters",
      ejercicios: [
        { nombre: 'Thruster' }
      ]
    },
    midline: {
      habilitado: true,
      descripcion: "4 sets:\n- 15 Hanging Knees-to-Chest / V-Ups\n- 12 Kettlebell Windmills por lado",
      ejercicios: []
    },
    extra: {
      habilitado: true,
      descripcion: "Accesorio de hombros:\n- 3 sets of 12 Dumbbell Lateral Raises\n- 12 Facepulls con banda elástica",
      ejercicios: []
    }
  }
];

const INITIAL_PRS = [
  { id: 'pr-1', cliente_id: 'user-lucas', ejercicio: 'Back Squat', peso_maximo_kg: 130, repeticiones: 1, tipo: 'fuerza', fecha: '2026-05-15' },
  { id: 'pr-2', cliente_id: 'user-lucas', ejercicio: 'Clean & Jerk', peso_maximo_kg: 95, repeticiones: 1, tipo: 'fuerza', fecha: '2026-05-20' },
  { id: 'pr-3', cliente_id: 'user-lucas', ejercicio: 'Snatch', peso_maximo_kg: 75, repeticiones: 1, tipo: 'fuerza', fecha: '2026-05-22' },
  { id: 'pr-4', cliente_id: 'user-lucas', ejercicio: 'Fran', peso_maximo_kg: 0, tiempo: '4:15', tipo: 'benchmark_crossfit', fecha: '2026-04-10' },
  { id: 'pr-5', cliente_id: 'user-lucas', ejercicio: 'Murph', peso_maximo_kg: 0, tiempo: '38:40', tipo: 'benchmark_crossfit', fecha: '2026-05-30' },
  { id: 'pr-6', cliente_id: 'user-sofia', ejercicio: 'Back Squat', peso_maximo_kg: 85, repeticiones: 1, tipo: 'fuerza', fecha: '2026-05-10' },
  { id: 'pr-7', cliente_id: 'user-sofia', ejercicio: 'Clean & Jerk', peso_maximo_kg: 55, repeticiones: 1, tipo: 'fuerza', fecha: '2026-05-12' },
  { id: 'pr-8', cliente_id: 'user-sofia', ejercicio: 'Fran', peso_maximo_kg: 0, tiempo: '6:05', tipo: 'benchmark_crossfit', fecha: '2026-03-15' }
];

const INITIAL_PAYMENTS = [
  { id: 'pay-1', cliente_id: 'user-lucas', monto: 45000, creditos_cargados: 12, fecha_pago: '2026-06-04', metodo_pago: 'Transferencia' },
  { id: 'pay-2', cliente_id: 'user-sofia', monto: 12000, creditos_cargados: 2, fecha_pago: '2026-05-15', metodo_pago: 'Efectivo' }
];

const INITIAL_NOTIFICATIONS = [
  { id: 'not-1', cliente_id: 'user-lucas', tipo: 'email', destinatario: 'lucas.gomez@gmail.com', mensaje: 'Hola Lucas, tu pago fue registrado con éxito. Se cargaron 12 créditos.', fecha: '2026-06-04 10:15' },
  { id: 'not-2', cliente_id: 'user-sofia', tipo: 'whatsapp', destinatario: '+5491199887766', mensaje: 'Gimnasio: Te quedan pocos créditos (2 disponibles). Recuerda cargar para no perder tus turnos.', fecha: '2026-06-02 18:00' }
];

// Mapeadores para compatibilidad de base de datos snake_case a frontend camelCase
const mapUserFromDb = (u) => {
  if (!u) return null;
  return {
    id: u.id,
    username: u.username,
    password: u.password,
    name: u.name,
    rol: u.rol,
    email: u.email,
    telefono: u.telefono,
    creditos_disponibles: u.creditos_disponibles,
    fecha_vencimiento_creditos: u.fecha_vencimiento_creditos,
    consent: u.consent,
    mustChangePassword: u.must_change_password,
    hyroxPlanId: u.hyrox_plan_id,
    hyroxProgress: typeof u.hyrox_progress === 'string' ? JSON.parse(u.hyrox_progress) : u.hyrox_progress,
    hyroxBaseline: typeof u.hyrox_baseline === 'string' ? JSON.parse(u.hyrox_baseline) : (u.hyrox_baseline || null)
  };
};

const mapUserToDb = (u) => {
  if (!u) return null;
  return {
    id: u.id,
    username: u.username,
    password: u.password,
    name: u.name,
    rol: u.rol,
    email: u.email || '',
    telefono: u.telefono || '',
    creditos_disponibles: u.creditos_disponibles || 0,
    fecha_vencimiento_creditos: u.fecha_vencimiento_creditos || '',
    consent: !!u.consent,
    must_change_password: u.mustChangePassword !== undefined ? u.mustChangePassword : true,
    hyrox_plan_id: u.hyroxPlanId || '',
    hyrox_progress: u.hyroxProgress || [],
    hyrox_baseline: u.hyroxBaseline || null
  };
};

export const db = {
  // Inicialización (Seeding) de Supabase
  init: async () => {
    try {
      // 1. Sembrar Usuarios
      const { data: users, error: uErr } = await supabase.from('users').select('id');
      if (!uErr && (!users || users.length === 0)) {
        const dbUsers = INITIAL_USERS.map(mapUserToDb);
        await supabase.from('users').insert(dbUsers);
      }

      // 2. Sembrar Clases
      const { data: classes, error: cErr } = await supabase.from('classes').select('id');
      if (!cErr && (!classes || classes.length === 0)) {
        await supabase.from('classes').insert(INITIAL_CLASSES);
      }

      // 3. Sembrar Ejercicios
      const { data: exercises, error: eErr } = await supabase.from('exercises').select('name');
      if (!eErr && (!exercises || exercises.length === 0)) {
        await supabase.from('exercises').insert(EXERCISES_DEFAULT);
      }

      // 4. Sembrar Reservas
      const { data: bookings, error: bErr } = await supabase.from('bookings').select('id');
      if (!bErr && (!bookings || bookings.length === 0)) {
        await supabase.from('bookings').insert(INITIAL_BOOKINGS);
      }

      // 5. Sembrar WODs
      const { data: wods, error: wErr } = await supabase.from('wods').select('id');
      if (!wErr && (!wods || wods.length === 0)) {
        await supabase.from('wods').insert(INITIAL_WODS);
      }

      // 6. Sembrar PRs
      const { data: prs, error: pErr } = await supabase.from('prs').select('id');
      if (!pErr && (!prs || prs.length === 0)) {
        await supabase.from('prs').insert(INITIAL_PRS);
      }

      // 7. Sembrar Pagos
      const { data: payments, error: payErr } = await supabase.from('payments').select('id');
      if (!payErr && (!payments || payments.length === 0)) {
        await supabase.from('payments').insert(INITIAL_PAYMENTS);
      }

      // 8. Sembrar Notificaciones
      const { data: notifications, error: nErr } = await supabase.from('notifications').select('id');
      if (!nErr && (!notifications || notifications.length === 0)) {
        await supabase.from('notifications').insert(INITIAL_NOTIFICATIONS);
      }
    } catch (err) {
      console.error('Error seeding database:', err);
    }
  },

  // Usuarios
  getUsers: async () => {
    const { data, error } = await supabase.from('users').select('*');
    if (error) throw error;
    return (data || []).map(mapUserFromDb);
  },

  saveUsers: async (users) => {
    // Al usar base de datos relacional directa, esta función es obsoleta para guardado masivo,
    // pero mantenemos la interfaz actualizando cada registro si fuese necesario.
    for (const u of users) {
      const dbU = mapUserToDb(u);
      await supabase.from('users').upsert(dbU);
    }
  },

  registerUser: async (userData) => {
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('username', userData.username.toLowerCase());
      
    if (existing && existing.length > 0) {
      throw new Error('El nombre de usuario ya está registrado.');
    }

    const newUser = {
      id: `user-${Date.now()}`,
      username: userData.username.toLowerCase(),
      password: userData.password || '123',
      name: userData.name,
      rol: userData.rol || 'cliente',
      email: userData.email || '',
      telefono: userData.telefono || '',
      creditos_disponibles: Number(userData.creditos_disponibles) || 0,
      fecha_vencimiento_creditos: userData.fecha_vencimiento_creditos || '',
      consent: !!userData.consent,
      mustChangePassword: userData.mustChangePassword !== undefined ? userData.mustChangePassword : true,
      hyroxPlanId: '',
      hyroxProgress: []
    };

    const { error } = await supabase.from('users').insert(mapUserToDb(newUser));
    if (error) throw error;

    if (newUser.creditos_disponibles > 0 && userData.paymentAmount > 0) {
      await supabase.from('payments').insert({
        id: `pay-${Date.now()}`,
        cliente_id: newUser.id,
        monto: Number(userData.paymentAmount),
        creditos_cargados: Number(newUser.creditos_disponibles),
        fecha_pago: new Date().toISOString().split('T')[0],
        metodo_pago: userData.paymentMethod || 'Efectivo'
      });

      await db.sendNotification(
        newUser.id,
        'email',
        newUser.email,
        `¡Bienvenido, ${newUser.name}! Tu usuario ha sido registrado y se cargaron ${newUser.creditos_disponibles} créditos (vence el ${newUser.fecha_vencimiento_creditos}).`
      );
    } else {
      await db.sendNotification(
        newUser.id,
        'email',
        newUser.email,
        `¡Bienvenido, ${newUser.name}! Tu usuario ha sido registrado con éxito. Pídele al administrador que te cargue créditos para comenzar a entrenar.`
      );
    }

    return newUser;
  },

  updateUserPassword: async (userId, newPassword) => {
    const { error } = await supabase
      .from('users')
      .update({ password: newPassword, must_change_password: false })
      .eq('id', userId);
    if (error) throw error;

    const { data } = await supabase.from('users').select('*').eq('id', userId).single();
    return mapUserFromDb(data);
  },

  updateUserConsent: async (userId, consentStatus) => {
    const { error } = await supabase
      .from('users')
      .update({ consent: consentStatus })
      .eq('id', userId);
    if (error) throw error;

    const { data } = await supabase.from('users').select('*').eq('id', userId).single();
    return mapUserFromDb(data);
  },

  updateUserCredits: async (userId, credits, newExpiry, paymentAmount, paymentMethod) => {
    const { error } = await supabase
      .from('users')
      .update({ creditos_disponibles: credits, fecha_vencimiento_creditos: newExpiry })
      .eq('id', userId);
    if (error) throw error;

    if (paymentAmount && paymentAmount > 0) {
      await supabase.from('payments').insert({
        id: `pay-${Date.now()}`,
        cliente_id: userId,
        monto: Number(paymentAmount),
        creditos_cargados: Number(credits),
        fecha_pago: new Date().toISOString().split('T')[0],
        metodo_pago: paymentMethod || 'Efectivo'
      });
    }

    const { data: userRow } = await supabase.from('users').select('*').eq('id', userId).single();
    const updatedUser = mapUserFromDb(userRow);

    if (updatedUser) {
      await db.sendNotification(
        userId, 
        'email', 
        updatedUser.email, 
        `Se han cargado ${credits} créditos en tu cuenta. Expiran el ${newExpiry}. ¡Que tengas un buen entrenamiento!`
      );
      await db.sendNotification(
        userId, 
        'whatsapp', 
        updatedUser.telefono, 
        `Gimnasio: Se cargaron ${credits} créditos. Tu nuevo saldo es de ${credits} créditos (vence el ${newExpiry}).`
      );
    }

    return updatedUser;
  },

  // Clases
  getClasses: async () => {
    const { data, error } = await supabase.from('classes').select('*');
    if (error) throw error;
    return data || [];
  },

  // Reservas/Turnos
  getBookings: async () => {
    const { data, error } = await supabase.from('bookings').select('*');
    if (error) throw error;
    return data || [];
  },

  saveBookings: async (bookings) => {
    for (const b of bookings) {
      await supabase.from('bookings').upsert(b);
    }
  },

  createBooking: async (userId, classId, date) => {
    const { data: userRow, error: uErr } = await supabase.from('users').select('*').eq('id', userId).single();
    if (uErr || !userRow) throw new Error('Usuario no encontrado');
    const user = mapUserFromDb(userRow);

    if (user.rol === 'administrador') throw new Error('Los administradores no pueden reservar turnos.');
    if (!user.consent) throw new Error('Debes aceptar el consentimiento de actividad física para reservar un turno.');
    if (user.creditos_disponibles <= 0) throw new Error('No tienes créditos disponibles. Debes realizar una recarga en el gimnasio.');
    
    const today = new Date().toISOString().split('T')[0];
    if (user.fecha_vencimiento_creditos < today) {
      throw new Error('Tus créditos han vencido. Debes realizar una nueva carga.');
    }

    const { data: bookings } = await supabase.from('bookings').select('*');
    const { data: classRow } = await supabase.from('classes').select('*').eq('id', classId).single();
    if (!classRow) throw new Error('Clase no encontrada');

    const classBookingsCount = (bookings || []).filter(
      b => b.clase_id === classId && b.fecha === date && b.estado === 'reservado'
    ).length;

    if (classBookingsCount >= classRow.capacidad_maxima) {
      throw new Error('La clase está llena. Elige otro horario.');
    }

    // Descontar crédito
    const newCredits = user.creditos_disponibles - 1;
    await supabase.from('users').update({ creditos_disponibles: newCredits }).eq('id', userId);

    const newBooking = {
      id: `booking-${Date.now()}`,
      cliente_id: userId,
      clase_id: classId,
      fecha: date,
      estado: 'reservado',
      asistencia: 'pendiente'
    };
    await supabase.from('bookings').insert(newBooking);

    user.creditos_disponibles = newCredits;

    if (newCredits <= 2) {
      await db.sendNotification(
        userId, 
        'whatsapp', 
        user.telefono, 
        `Gimnasio Alerta: Te quedan solo ${newCredits} créditos. ¡Recuerda recargar antes de quedarte sin cupo!`
      );
    } else {
      await db.sendNotification(
        userId,
        'email',
        user.email,
        `Reserva confirmada para la clase del ${date} a las ${classRow.hora_inicio} hs. Créditos restantes: ${newCredits}.`
      );
    }

    return { booking: newBooking, user };
  },

  cancelBooking: async (bookingId) => {
    const { data: bookings } = await supabase.from('bookings').select('*');
    const booking = (bookings || []).find(b => b.id === bookingId);
    if (!booking) throw new Error('Reserva no encontrada');

    const { data: classRow } = await supabase.from('classes').select('*').eq('id', booking.clase_id).single();
    if (!classRow) throw new Error('Clase no encontrada');

    const todayStr = new Date().toISOString().split('T')[0];
    let shouldRefund = true;
    let timeErrorMsg = "";

    if (booking.fecha === todayStr) {
      const now = new Date();
      const [classHour, classMinute] = classRow.hora_inicio.split(':').map(Number);
      const classTime = new Date();
      classTime.setHours(classHour, classMinute, 0, 0);

      const diffMs = classTime.getTime() - now.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);

      if (diffHours < 1) {
        shouldRefund = false;
        timeErrorMsg = "Falta menos de 1 hora para la clase. El turno se canceló pero NO se devolvió el crédito.";
      }
    } else if (booking.fecha < todayStr) {
      shouldRefund = false;
      timeErrorMsg = "No se pueden cancelar turnos de fechas pasadas.";
    }

    await supabase.from('bookings').update({ estado: 'cancelado' }).eq('id', bookingId);
    booking.estado = 'cancelado';

    let updatedUser = null;
    if (shouldRefund) {
      const { data: userRow } = await supabase.from('users').select('*').eq('id', booking.cliente_id).single();
      if (userRow) {
        const newCredits = userRow.creditos_disponibles + 1;
        await supabase.from('users').update({ creditos_disponibles: newCredits }).eq('id', booking.cliente_id);
        
        userRow.creditos_disponibles = newCredits;
        updatedUser = mapUserFromDb(userRow);

        await db.sendNotification(
          booking.cliente_id,
          'email',
          updatedUser.email,
          `Tu reserva para el ${booking.fecha} a las ${classRow.hora_inicio} fue cancelada. Se te ha devuelto 1 crédito.`
        );
      }
    } else {
      const { data: userRow } = await supabase.from('users').select('*').eq('id', booking.cliente_id).single();
      if (userRow) {
        updatedUser = mapUserFromDb(userRow);
      }
    }

    return { booking, shouldRefund, errorMsg: timeErrorMsg, user: updatedUser };
  },

  // WODs
  getWods: async () => {
    const { data, error } = await supabase.from('wods').select('*').order('fecha', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  saveWods: async (wods) => {
    for (const w of wods) {
      await supabase.from('wods').upsert(w);
    }
  },

  // Ejercicios y Videos
  getExercises: async () => {
    const { data, error } = await supabase.from('exercises').select('*');
    if (error) throw error;
    return (data || []).map(ex => ({ name: ex.name, videoUrl: ex.video_url }));
  },

  saveExercises: async (exercises) => {
    for (const ex of exercises) {
      await supabase.from('exercises').upsert({ name: ex.name, video_url: ex.videoUrl });
    }
  },

  addExercise: async (exerciseData) => {
    const { data: existing } = await supabase
      .from('exercises')
      .select('name')
      .eq('name', exerciseData.name);
      
    if (existing && existing.length > 0) {
      const { data: item } = await supabase.from('exercises').select('*').eq('name', exerciseData.name).single();
      return { name: item.name, videoUrl: item.video_url };
    }

    const newEx = {
      name: exerciseData.name,
      video_url: exerciseData.videoUrl || ''
    };

    const { error } = await supabase.from('exercises').insert(newEx);
    if (error) throw error;
    return { name: newEx.name, videoUrl: newEx.video_url };
  },

  upsertWod: async (wodData) => {
    const { data: existing } = await supabase.from('wods').select('id').eq('fecha', wodData.fecha);
    
    if (existing && existing.length > 0) {
      const { error } = await supabase.from('wods').update(wodData).eq('fecha', wodData.fecha);
      if (error) throw error;
    } else {
      const { error } = await supabase.from('wods').insert({
        id: `wod-${Date.now()}`,
        ...wodData
      });
      if (error) throw error;
    }
    return db.getWods();
  },

  // RMs
  getPRs: async () => {
    const { data, error } = await supabase.from('prs').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  savePRs: async (prs) => {
    for (const pr of prs) {
      await supabase.from('prs').upsert(pr);
    }
  },

  addPR: async (prData) => {
    const newPr = {
      id: `pr-${Date.now()}`,
      fecha: new Date().toISOString().split('T')[0],
      ...prData
    };
    const { error } = await supabase.from('prs').insert(newPr);
    if (error) throw error;
    return newPr;
  },

  deletePR: async (prId) => {
    const { error } = await supabase.from('prs').delete().eq('id', prId);
    if (error) throw error;
    return db.getPRs();
  },

  // Pagos
  getPayments: async () => {
    const { data, error } = await supabase.from('payments').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  savePayments: async (payments) => {
    for (const pay of payments) {
      await supabase.from('payments').upsert(pay);
    }
  },

  // Notificaciones
  getNotifications: async () => {
    const { data, error } = await supabase.from('notifications').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  saveNotifications: async (nots) => {
    for (const not of nots) {
      await supabase.from('notifications').upsert(not);
    }
  },

  sendNotification: async (userId, type, recipient, message) => {
    const newNot = {
      id: `not-${Date.now()}`,
      cliente_id: userId,
      tipo: type,
      destinatario: recipient,
      mensaje: message,
      fecha: new Date().toISOString().replace('T', ' ').substring(0, 16)
    };
    const { error } = await supabase.from('notifications').insert(newNot);
    if (error) throw error;
    return newNot;
  },

  // HYROX
  getHyroxTemplate: () => {
    return HYROX_TEMPLATE_PLAN;
  },

  assignHyroxPlan: async (userId, planId) => {
    const { error } = await supabase
      .from('users')
      .update({ hyrox_plan_id: planId, hyrox_progress: [] })
      .eq('id', userId);
      
    if (error) throw error;
    const { data } = await supabase.from('users').select('*').eq('id', userId).single();
    return mapUserFromDb(data);
  },

  saveHyroxBaseline: async (userId, baselineData) => {
    const { error } = await supabase
      .from('users')
      .update({ hyrox_baseline: baselineData })
      .eq('id', userId);
      
    if (error) throw error;
    const { data } = await supabase.from('users').select('*').eq('id', userId).single();
    return mapUserFromDb(data);
  },

  addHyroxProgress: async (userId, weekNumber, run1k, sledPush75kg, farmersCarry24kg, clientNotes) => {
    const { data: userRow } = await supabase.from('users').select('*').eq('id', userId).single();
    if (!userRow) throw new Error('Usuario no encontrado');

    const progress = userRow.hyrox_progress || [];
    const existingIdx = progress.findIndex(p => p.weekNumber === weekNumber);

    const newProgressItem = {
      weekNumber,
      run1k,
      sledPush75kg: sledPush75kg || '',
      farmersCarry24kg: farmersCarry24kg || '',
      clientNotes,
      feedbackGestor: existingIdx !== -1 ? progress[existingIdx].feedbackGestor : '',
      date: new Date().toISOString().split('T')[0]
    };

    if (existingIdx !== -1) {
      progress[existingIdx] = newProgressItem;
    } else {
      progress.push(newProgressItem);
    }

    const { error } = await supabase.from('users').update({ hyrox_progress: progress }).eq('id', userId);
    if (error) throw error;

    const { data: updatedRow } = await supabase.from('users').select('*').eq('id', userId).single();
    return mapUserFromDb(updatedRow);
  },

  addHyroxFeedbackFromGestor: async (userId, weekNumber, feedbackGestor) => {
    const { data: userRow } = await supabase.from('users').select('*').eq('id', userId).single();
    if (!userRow) throw new Error('Usuario no encontrado');

    const progress = userRow.hyrox_progress || [];
    const item = progress.find(p => p.weekNumber === weekNumber);
    if (item) {
      item.feedbackGestor = feedbackGestor;
    } else {
      progress.push({
        weekNumber,
        run1k: '',
        sledPush75kg: '',
        farmersCarry24kg: '',
        clientNotes: '',
        feedbackGestor,
        date: new Date().toISOString().split('T')[0]
      });
    }

    const { error } = await supabase.from('users').update({ hyrox_progress: progress }).eq('id', userId);
    if (error) throw error;

    const { data: updatedRow } = await supabase.from('users').select('*').eq('id', userId).single();
    const updatedUser = mapUserFromDb(updatedRow);

    if (updatedUser) {
      await db.sendNotification(
        userId,
        'whatsapp',
        updatedUser.telefono,
        `Gimnasio: El coach ha cargado el feedback y objetivos de la Semana ${weekNumber} de tu plan HYROX. ¡Míralo en la app!`
      );
    }

    return updatedUser;
  },

  // Checkins y Control de Acceso
  getCheckinLogs: async () => {
    const { data, error } = await supabase.from('checkin_logs').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  saveCheckinLogs: async (logs) => {
    for (const log of logs) {
      await supabase.from('checkin_logs').upsert(log);
    }
  },

  registerCheckIn: async (userId) => {
    const { data: userRow } = await supabase.from('users').select('*').eq('id', userId).single();
    if (!userRow) throw new Error('Usuario no encontrado');
    const user = mapUserFromDb(userRow);

    const now = new Date();
    const localYear = now.getFullYear();
    const localMonth = String(now.getMonth() + 1).padStart(2, '0');
    const localDate = String(now.getDate()).padStart(2, '0');
    const dateStr = `${localYear}-${localMonth}-${localDate}`;
    const timeStr = now.toTimeString().substring(0, 5);
    const timestampStr = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

    // 1. Apto Médico
    if (!user.consent) {
      const newLog = {
        id: `checkin-${Date.now()}`,
        cliente_id: userId,
        timestamp: timestampStr,
        fecha: dateStr,
        hora: timeStr,
        estado: 'denied',
        motivo: 'Falta Apto Médico',
        clase_id: null
      };
      await supabase.from('checkin_logs').insert(newLog);
      throw new Error('Acceso Denegado: Debes firmar el consentimiento de aptitud física (Apto Médico).');
    }

    // 2. Buscar reservas activas para hoy
    const { data: bookings } = await supabase
      .from('bookings')
      .select('*')
      .eq('cliente_id', userId)
      .eq('fecha', dateStr)
      .eq('estado', 'reservado');
      
    const { data: classes } = await supabase.from('classes').select('*');

    let matchingBooking = null;
    let matchingClass = null;

    for (const b of (bookings || [])) {
      const cls = (classes || []).find(c => c.id === b.clase_id);
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
          matchingBooking = b;
          matchingClass = cls;
          break;
        }
      }
    }

    if (!matchingBooking) {
      const newLog = {
        id: `checkin-${Date.now()}`,
        cliente_id: userId,
        timestamp: timestampStr,
        fecha: dateStr,
        hora: timeStr,
        estado: 'denied',
        motivo: 'Sin reserva activa para este horario',
        clase_id: null
      };
      await supabase.from('checkin_logs').insert(newLog);
      throw new Error('Acceso Denegado: No tienes una reserva registrada para el turno actual o estás fuera del horario permitido.');
    }

    // 3. Registrar check-in exitoso
    await supabase.from('bookings').update({ asistencia: 'presente' }).eq('id', matchingBooking.id);
    
    const newLog = {
      id: `checkin-${Date.now()}`,
      cliente_id: userId,
      timestamp: timestampStr,
      fecha: dateStr,
      hora: timeStr,
      estado: 'success',
      motivo: 'Acceso autorizado',
      clase_id: matchingBooking.clase_id
    };
    await supabase.from('checkin_logs').insert(newLog);

    return { booking: matchingBooking, class: matchingClass };
  }
};

export default db;
