export default {
  // ── Navbar / SlimHeader ───────────────────────────────
  nav: {
    messages:   'Mensajes',
    login:      'Iniciar sesión',
    getStarted: 'Comenzar',
    myOrders:   'Mis pedidos',
    browse:     'Explorar servicios',
    sellerDash: 'Panel de vendedor',
    adminPanel: 'Panel de admin',
    logout:     'Cerrar sesión',
  },

  // ── Hero ─────────────────────────────────────────────
  hero: {
    badge:             'De confianza para miles de locales',
    headline1:         'Encuentra servicios locales,',
    headline2:         'bien hechos.',
    subline:           'Desde jardinería hasta tutoría — contrata locales de confianza para cualquier tarea, con pagos seguros y chat en tiempo real.',
    searchPlaceholder: '¿En qué necesitas ayuda?',
    search:            'Buscar',
    anywhere:          'En cualquier lugar',
  },

  // ── Location picker ───────────────────────────────────
  location: {
    title:         'Elige tu ubicación',
    placeholder:   'Ciudad o barrio…',
    go:            'Ir',
    useMyLocation: 'Usar mi ubicación actual',
    searchWithin:  'Buscar en un radio de',
    clearLocation: '✕ Borrar ubicación',
    setTip:        'Establece tu ubicación para encontrar servicios cerca',
  },

  // ── Quick tags ────────────────────────────────────────
  tags: {
    gardening:   '🌱 Jardinería',
    tutoring:    '📚 Tutoría',
    cleaning:    '🧹 Limpieza',
    petCare:     '🐾 Cuidado de mascotas',
    photography: '📷 Fotografía',
  },

  // ── Stats ─────────────────────────────────────────────
  stats: {
    servicesListed: 'Servicios listados',
    satisfaction:   'Tasa de satisfacción',
    sellers:        'Vendedores verificados',
  },

  // ── Home sections ─────────────────────────────────────
  categories: {
    label:    '✦ Explorar categorías',
    heading:  '¿Qué necesitas?',
    services: 'servicios',
  },

  featured: {
    label:     '⭐ Mejores opciones',
    heading:   'Servicios populares',
    viewAll:   'Ver todos →',
    empty:     'Aún no hay servicios',
    emptyHint: '¡Sé el primero en publicar uno!',
  },

  howItWorks: {
    label:   '💡 Proceso simple',
    heading: 'Cómo funciona Kaya',
    steps: [
      { step: '01', title: 'Explorar y descubrir',   desc: 'Busca servicios por categoría, ubicación, precio y reseñas.' },
      { step: '02', title: 'Conectar y hablar',       desc: 'Chatea directamente con los vendedores antes de hacer tu pedido.' },
      { step: '03', title: 'Pagar de forma segura',   desc: 'Fondos retenidos en custodia — liberados solo cuando estés satisfecho.' },
    ],
  },

  cta: {
    label:   '💼 Para proveedores',
    heading: 'Gana haciendo lo que amas',
    subline: 'Únete a cientos de proveedores locales. Comienza con 14 días gratis — solo $7/mes después.',
    button:  'Empezar a vender',
  },

  // ── Explore page ──────────────────────────────────────
  explore: {
    filters:         'Filtros',
    category:        'Categoría',
    all:             'Todos',
    priceRange:      'Rango de precio',
    minPlaceholder:  'Mín',
    maxPlaceholder:  'Máx',
    remoteOnly:      'Solo remoto',
    location:        'Ubicación',
    within:          'En un radio de',
    useMyLocation:   'Usar mi ubicación',
    cityPlaceholder: 'Ciudad o área…',
    servicesFound:   '{{count}} servicios encontrados',
    noServices:      'No se encontraron servicios',
    noServicesTip:   'Ajusta tus filtros o término de búsqueda',
    noServicesGeo:   'No hay servicios en {{radius}} km de {{location}}. Prueba un radio mayor.',
    nearLabel:       'cerca de {{location}}',
    allServices:     'Todos los servicios',
    services:        'Servicios',
    resultsFor:      'Resultados para "{{q}}"',
    page:            'Página',
    of:              'de',
    prev:            '← Anterior',
    next:            'Siguiente →',
    sort: {
      newest:    'Más recientes',
      topRated:  'Mejor valorados',
      priceLow:  'Precio: Menor a mayor',
      priceHigh: 'Precio: Mayor a menor',
    },
  },

  // ── Subscribe ─────────────────────────────────────────
  subscribe: {
    plan:         '$7 / mes',
    manage:       'Gestionar facturación →',
    subscribeNow: 'Suscribirse ahora',
  },

  // ── Auth ─────────────────────────────────────────────
  auth: {
    login: {
      title:         'Bienvenido de nuevo',
      subtitle:      'Inicia sesión en tu cuenta',
      email:         'Correo electrónico',
      password:      'Contraseña',
      forgot:        '¿Olvidaste tu contraseña?',
      submit:        'Iniciar sesión',
      submitting:    'Iniciando sesión…',
      noAccount:     '¿No tienes cuenta?',
      createFree:    'Crear una gratis',
      panelHeadline: 'Tu comunidad,\ntu mercado.',
      panelSubline:  'Conecta con proveedores locales de confianza.',
      statServices:  'Servicios',
      statSatisfy:   'Satisfacción',
      statBrowse:    'Para explorar',
      welcomeBack:   '¡Bienvenido de nuevo!',
      invalidCreds:  'Correo o contraseña inválidos',
    },
    register: {
      title:              'Crear cuenta',
      subtitle:           'Únete a miles de compradores y vendedores',
      buyerLabel:         '🛒 Quiero contratar',
      buyerSub:           'Explorar y comprar servicios',
      sellerLabel:        '💼 Quiero vender',
      sellerSub:          'Publica tus servicios',
      fullName:           'Nombre completo',
      email:              'Correo electrónico',
      password:           'Contraseña',
      pwPlaceholder:      'Mínimo 8 caracteres',
      pwError:            'La contraseña debe tener al menos 8 caracteres',
      sellerTrial:        '14 días de prueba gratis, luego solo $7/mes. Cancela cuando quieras.',
      referralApplied:    'Código de referido aplicado:',
      submit:             'Crear cuenta',
      submitting:         'Creando cuenta…',
      termsText:          'Al registrarte, aceptas nuestros',
      terms:              'Términos',
      and:                'y la',
      privacy:            'Política de privacidad',
      haveAccount:        '¿Ya tienes cuenta?',
      signIn:             'Iniciar sesión',
      welcome:            '¡Bienvenido a Kaya! 🎉',
      failed:             'Error en el registro',
      features: [
        { icon: '🔒', title: 'Pagos seguros',          desc: 'Protegido con custodia — paga solo cuando estés satisfecho.' },
        { icon: '💬', title: 'Mensajería directa',     desc: 'Chatea con vendedores antes de comprometerte.' },
        { icon: '⭐', title: 'Reseñas verificadas',    desc: 'Solo compradores reales pueden dejar reseñas.' },
      ],
    },
  },

  // ── Buyer Dashboard ───────────────────────────────────
  buyerDash: {
    title:         'Mis pedidos',
    browse:        'Explorar servicios',
    all:           'Todos',
    seller:        'Vendedor:',
    amount:        'Importe:',
    ordered:       'Pedido:',
    due:           'Vence:',
    chat:          '💬 Chat',
    accept:        '✓ Aceptar',
    dispute:       '⚠ Disputar',
    disputePrompt: 'Motivo de la disputa:',
    review:        '★ Reseña',
    reviewed:      'Reseñado',
    empty:         'Aún no hay pedidos',
    emptyHint:     'Explora servicios para comenzar',
    reviewModal: {
      title:       'Dejar una reseña',
      rating:      'Calificación',
      placeholder: 'Comparte tu experiencia…',
      cancel:      'Cancelar',
      submit:      'Enviar',
    },
    toasts: {
      complete:     '¡Pedido marcado como completado! Pago liberado al vendedor.',
      completeFail: 'No se pudo completar el pedido',
      dispute:      'Disputa abierta. Un administrador la revisará.',
      disputeFail:  'No se pudo abrir la disputa',
      review:       '¡Reseña enviada!',
      reviewFail:   'No se pudo enviar la reseña',
    },
  },

  // ── Seller Dashboard ──────────────────────────────────
  sellerDash: {
    title:      'Panel de vendedor',
    newService: '+ Nuevo servicio',
    tabs: {
      orders:       '📦 Pedidos',
      services:     '🛠️ Mis servicios',
      earnings:     '💰 Ganancias',
      subscription: '⚡ Suscripción',
    },
    orders: {
      empty:         'Aún no hay pedidos',
      buyer:         'Comprador:',
      earnings:      'Ganancias:',
      due:           'Vence:',
      na:            'N/A',
      chat:          '💬 Chat',
      markDelivered: 'Marcar como entregado',
      delivered:     '¡Pedido marcado como entregado!',
    },
    services: {
      empty:       'Aún no hay servicios.',
      createFirst: 'Crea tu primer servicio',
      orders:      'pedidos',
      from:        'Desde',
      view:        'Ver',
      pause:       'Pausar',
      activate:    'Activar',
      active:      'Activo',
      paused:      'Pausado',
    },
    earnings: {
      total:    'Total ganado',
      escrow:   'En custodia',
      released: 'Liberado',
      note:     'Los fondos en custodia se liberan automáticamente cuando los compradores confirman la entrega.',
    },
    subscription: {
      title:      'Suscripción de vendedor',
      status:     'Estado',
      renewsEnds: 'Renueva / Vence',
      trialEnds:  'Prueba termina',
      plan:       'Plan',
      planValue:  '$7 / mes',
      manage:     'Gestionar facturación →',
      subscribe:  'Suscribirse ahora',
    },
  },

  // ── Chat ─────────────────────────────────────────────
  chat: {
    messages:           'Mensajes',
    noConversations:    'Aún no hay conversaciones',
    noMessages:         'Aún no hay mensajes',
    typing:             '{{name}} está escribiendo…',
    selectConversation: 'Selecciona una conversación',
    selectHint:         'O inicia una desde la página de un servicio',
    inputPlaceholder:   'Escribe un mensaje…',
    re:                 'sobre:',
    viewFile:           'Ver archivo',
  },

  // ── Checkout ──────────────────────────────────────────
  checkout: {
    title:                'Pago',
    orderSummary:         'Resumen del pedido',
    package:              'paquete',
    daysDelivery:         'días de entrega',
    total:                'Total',
    escrowNote:           '💰 Fondos retenidos en custodia hasta que confirmes la entrega.',
    requirementsLabel:    'Requisitos para el vendedor',
    requirementsOptional: '(opcional)',
    requirementsPlaceholder: 'Describe lo que necesitas, detalles específicos o preferencias…',
    paymentDetails:       'Datos de pago',
    pay:                  'Pagar',
    processing:           'Procesando…',
    toasts: {
      placed:       '¡Pedido realizado! 🎉',
      paymentFailed:'Pago fallido. Por favor intenta de nuevo.',
      createFailed: 'No se pudo crear el pedido',
    },
  },

  // ── Service Detail ────────────────────────────────────
  detail: {
    notFound:         'Servicio no encontrado',
    home:             'Inicio',
    aboutService:     'Sobre este servicio',
    aboutSeller:      'Sobre el vendedor',
    location:         'Ubicación',
    responseTime:     'Tiempo de respuesta',
    ordersCompleted:  'Pedidos completados',
    memberSince:      'Miembro desde',
    notSpecified:     'No especificado',
    na:               'N/A',
    reviews:          'Reseñas',
    sellerReply:      'Respuesta del vendedor',
    ownService:       'Este es tu servicio',
    contactSeller:    '💬 Contactar vendedor',
    remote:           '🌐 Remoto',
    inPerson:         'Presencial',
    availability:     'Disponibilidad',
    contactForDetails:'Contactar para detalles',
    days:             'día',
    daysPlural:       'días',
    revision:         'revisión',
    revisionsPlural:  'revisiones',
    continue:         'Continuar',
    noConversation:   'No se pudo iniciar la conversación',
  },

  // ── Seller Profile ────────────────────────────────────
  profile: {
    notFound:       'Vendedor no encontrado',
    reviews:        'reseñas',
    orders:         'Pedidos',
    completion:     'Completados',
    reviewsSection: 'Reseñas',
    about:          'Sobre mí',
    skills:         'Habilidades',
    languages:      'Idiomas',
    portfolio:      'Portafolio',
    services:       'Servicios',
  },

  // ── Footer ────────────────────────────────────────────
  footer: {
    tagline:         'El mercado local de servicios que conecta tu comunidad.',
    exploreTitle:    'Explorar',
    sellersTitle:    'Vendedores',
    companyTitle:    'Empresa',
    becomeSeller:    'Convertirse en vendedor',
    sellerDashboard: 'Panel de vendedor',
    about:           'Acerca de',
    privacy:         'Política de privacidad',
    terms:           'Términos de servicio',
    copyright:       '© {{year}} Kaya Marketplace. Todos los derechos reservados.',
    operational:     'Todos los sistemas operativos',
    niches: {
      gardening:   '🌱 Jardinería',
      tutoring:    '📚 Tutoría',
      babysitting: '👶 Cuidado de niños',
      cleaning:    '🧹 Limpieza',
    },
  },

  // ── Service Card ──────────────────────────────────────
  card: {
    noReviews: 'Aún sin reseñas',
    from:      'Desde',
  },

  // ── Niche names (keyed by slug, hyphens → underscores) ─
  niches: {
    gardening:         'Jardinería',
    craftwork:         'Artesanía',
    tutoring:          'Tutoría',
    babysitting:       'Cuidado de niños',
    cleaning:          'Limpieza',
    pet_care:          'Cuidado de mascotas',
    photography:       'Fotografía',
    personal_training: 'Entrenamiento personal',
    home_repairs:      'Reparaciones del hogar',
    cooking:           'Cocina',
  },
};
