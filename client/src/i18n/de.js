export default {
  // ── Navbar / SlimHeader ───────────────────────────────
  nav: {
    messages:   'Nachrichten',
    login:      'Anmelden',
    getStarted: 'Loslegen',
    myOrders:   'Aufträge',
    browse:     'Erkunden',
    navDashboard: 'Dashboard',
    sellerDash: 'Verkäufer-Dashboard',
    adminPanel: 'Admin-Panel',
    logout:     'Abmelden',
  },

  // ── Hero ─────────────────────────────────────────────
  hero: {
    badge:             'Von Tausenden Einheimischen vertraut',
    headline1:         'Lokale Dienste finden,',
    headline2:         'richtig gemacht.',
    subline:           'Von Gartenarbeit bis Nachhilfe — buche vertrauenswürdige Einheimische für jeden Auftrag, mit sicheren Zahlungen und Echtzeit-Chat.',
    searchPlaceholder: 'Wobei brauchst du Hilfe?',
    search:            'Suchen',
    anywhere:          'Überall',
  },

  // ── Location picker ───────────────────────────────────
  location: {
    title:         'Deinen Standort wählen',
    placeholder:   'Stadt oder Stadtteil…',
    go:            'Los',
    useMyLocation: 'Meinen aktuellen Standort verwenden',
    searchWithin:  'Suchen im Umkreis von',
    clearLocation: '✕ Standort löschen',
    setTip:        'Standort setzen, um Dienste in der Nähe zu finden',
  },

  // ── Quick tags ────────────────────────────────────────
  tags: {
    gardening:   '🌱 Gartenarbeit',
    tutoring:    '📚 Nachhilfe',
    cleaning:    '🧹 Reinigung',
    petCare:     '🐾 Tierbetreuung',
    photography: '📷 Fotografie',
  },

  // ── Stats ─────────────────────────────────────────────
  stats: {
    servicesListed: 'Dienste gelistet',
    satisfaction:   'Zufriedenheitsrate',
    sellers:        'Verifizierte Anbieter',
  },

  // ── Home sections ─────────────────────────────────────
  categories: {
    label:    '✦ Kategorien durchsuchen',
    heading:  'Was brauchst du?',
    services: 'Dienste',
  },

  featured: {
    label:     '⭐ Top-Auswahl',
    heading:   'Beliebte Dienste',
    viewAll:   'Alle anzeigen →',
    empty:     'Noch keine Dienste',
    emptyHint: 'Sei der Erste, der einen einstellt!',
  },

  howItWorks: {
    label:   '💡 Einfacher Ablauf',
    heading: 'Wie Kaya funktioniert',
    steps: [
      { step: '01', title: 'Stöbern & entdecken',   desc: 'Dienste nach Kategorie, Standort, Preis und Bewertungen suchen.' },
      { step: '02', title: 'Verbinden & besprechen', desc: 'Direkt mit Anbietern chatten, bevor du bestellst.' },
      { step: '03', title: 'Sicher bezahlen',        desc: 'Gelder werden treuhänderisch gehalten — erst freigegeben, wenn du zufrieden bist.' },
    ],
  },

  cta: {
    label:   '💼 Für Anbieter',
    heading: 'Verdiene mit dem, was du liebst',
    subline: 'Schließe dich Hunderten lokaler Anbieter an. Starte mit 14 Tagen kostenlos — danach nur 7 $/Monat.',
    button:  'Jetzt anbieten',
  },

  // ── Explore page ──────────────────────────────────────
  explore: {
    filters:         'Filter',
    category:        'Kategorie',
    all:             'Alle',
    priceRange:      'Preisbereich',
    minPlaceholder:  'Min',
    maxPlaceholder:  'Max',
    remoteOnly:      'Nur Remote',
    location:        'Standort',
    within:          'Umkreis',
    useMyLocation:   'Meinen Standort verwenden',
    cityPlaceholder: 'Stadt oder Gebiet…',
    servicesFound:   '{{count}} Dienste gefunden',
    noServices:      'Keine Dienste gefunden',
    noServicesTip:   'Passe deine Filter oder Suchbegriffe an',
    noServicesGeo:   'Keine Dienste im Umkreis von {{radius}} km um {{location}}. Versuche einen größeren Radius.',
    nearLabel:       'in der Nähe von {{location}}',
    allServices:     'Alle Dienste',
    services:        'Dienste',
    resultsFor:      'Ergebnisse für "{{q}}"',
    page:            'Seite',
    of:              'von',
    prev:            '← Zurück',
    next:            'Weiter →',
    sort: {
      newest:    'Neueste',
      topRated:  'Bestbewertet',
      priceLow:  'Preis: Aufsteigend',
      priceHigh: 'Preis: Absteigend',
    },
  },

  // ── Subscribe ─────────────────────────────────────────
  subscribe: {
    plan:         '7 $ / Monat',
    manage:       'Abrechnung verwalten →',
    subscribeNow: 'Jetzt abonnieren',
  },

  // ── Auth ─────────────────────────────────────────────
  auth: {
    login: {
      title:         'Willkommen zurück',
      subtitle:      'Melde dich in deinem Konto an',
      email:         'E-Mail-Adresse',
      password:      'Passwort',
      forgot:        'Passwort vergessen?',
      submit:        'Anmelden',
      submitting:    'Anmelden…',
      noAccount:     'Noch kein Konto?',
      createFree:    'Kostenlos erstellen',
      panelHeadline: 'Deine Community,\ndein Marktplatz.',
      panelSubline:  'Verbinde dich mit vertrauenswürdigen lokalen Dienstleistern.',
      statServices:  'Dienste',
      statSatisfy:   'Zufriedenheit',
      statBrowse:    'Kostenlos stöbern',
      welcomeBack:   'Willkommen zurück!',
      invalidCreds:  'Ungültige E-Mail oder Passwort',
    },
    register: {
      title:              'Konto erstellen',
      subtitle:           'Schließe dich Tausenden von Käufern und Anbietern an',
      buyerLabel:         '🛒 Ich möchte einstellen',
      buyerSub:           'Dienste durchsuchen & kaufen',
      sellerLabel:        '💼 Ich möchte verkaufen',
      sellerSub:          'Deine Dienste anbieten',
      fullName:           'Vollständiger Name',
      email:              'E-Mail-Adresse',
      password:           'Passwort',
      pwPlaceholder:      'Mindestens 8 Zeichen',
      pwError:            'Das Passwort muss mindestens 8 Zeichen lang sein',
      sellerTrial:        '14-Tage kostenlose Testphase, danach nur 7 $/Monat. Jederzeit kündbar.',
      referralApplied:    'Empfehlungscode angewendet:',
      submit:             'Konto erstellen',
      submitting:         'Konto wird erstellt…',
      termsText:          'Mit der Registrierung stimmst du unseren',
      terms:              'Nutzungsbedingungen',
      and:                'und der',
      privacy:            'Datenschutzrichtlinie',
      haveAccount:        'Bereits ein Konto?',
      signIn:             'Anmelden',
      welcome:            'Willkommen bei Kaya! 🎉',
      failed:             'Registrierung fehlgeschlagen',
      features: [
        { icon: '🔒', title: 'Sichere Zahlungen',       desc: 'Treuhänderisch geschützt — zahle erst, wenn du zufrieden bist.' },
        { icon: '💬', title: 'Direktnachrichten',       desc: 'Chatte mit Anbietern, bevor du buchst.' },
        { icon: '⭐', title: 'Verifizierte Bewertungen', desc: 'Nur echte Käufer können Bewertungen hinterlassen.' },
      ],
    },
  },

  // ── Buyer Dashboard ───────────────────────────────────
  buyerDash: {
    title:         'Meine Bestellungen',
    browse:        'Dienste durchsuchen',
    all:           'Alle',
    seller:        'Anbieter:',
    amount:        'Betrag:',
    ordered:       'Bestellt:',
    due:           'Fällig:',
    chat:          '💬 Chat',
    accept:        '✓ Akzeptieren',
    dispute:       '⚠ Streitfall',
    disputePrompt: 'Grund für den Streitfall:',
    review:        '★ Bewerten',
    reviewed:      'Bewertet',
    empty:         'Noch keine Bestellungen',
    emptyHint:     'Dienste durchsuchen, um zu beginnen',
    reviewModal: {
      title:       'Bewertung hinterlassen',
      rating:      'Bewertung',
      placeholder: 'Teile deine Erfahrung…',
      cancel:      'Abbrechen',
      submit:      'Absenden',
    },
    toasts: {
      complete:     'Bestellung als abgeschlossen markiert! Zahlung an Anbieter freigegeben.',
      completeFail: 'Bestellung konnte nicht abgeschlossen werden',
      dispute:      'Streitfall eröffnet. Ein Admin wird ihn prüfen.',
      disputeFail:  'Streitfall konnte nicht geöffnet werden',
      review:       'Bewertung eingereicht!',
      reviewFail:   'Bewertung konnte nicht eingereicht werden',
    },
  },

  // ── Seller Dashboard ──────────────────────────────────
  sellerDash: {
    title:      'Verkäufer-Dashboard',
    newService: 'Neuer Dienst',
    stats: {
      activeOrders:  'Aktive Aufträge',
      totalEarnings: 'Einnahmen gesamt',
      services:      'Dienste',
    },
    tabs: {
      orders:       '📦 Bestellungen',
      services:     '🛠️ Meine Dienste',
      earnings:     '💰 Einnahmen',
      subscription: '⚡ Abonnement',
    },
    orders: {
      empty:         'Noch keine Bestellungen',
      buyer:         'Käufer:',
      earnings:      'Einnahmen:',
      due:           'Fällig:',
      na:            'N/A',
      chat:          '💬 Chat',
      markDelivered: 'Als geliefert markieren',
      delivered:     'Bestellung als geliefert markiert!',
    },
    services: {
      empty:       'Noch keine Dienste.',
      createFirst: 'Erstelle deinen ersten Dienst',
      orders:      'Bestellungen',
      from:        'Ab',
      view:        'Ansehen',
      pause:       'Pausieren',
      activate:    'Aktivieren',
      active:      'Aktiv',
      paused:      'Pausiert',
    },
    earnings: {
      total:    'Gesamt verdient',
      escrow:   'Im Treuhand',
      released: 'Freigegeben',
      note:     'Treuhandgelder werden automatisch freigegeben, wenn Käufer die Lieferung bestätigen.',
    },
    subscription: {
      title:      'Anbieter-Abonnement',
      status:     'Status',
      renewsEnds: 'Verlängert / Endet',
      trialEnds:  'Testphase endet',
      plan:       'Plan',
      planValue:  '7 $ / Monat',
      manage:     'Abrechnung verwalten →',
      subscribe:  'Jetzt abonnieren',
    },
  },

  // ── Chat ─────────────────────────────────────────────
  chat: {
    messages:           'Nachrichten',
    noConversations:    'Noch keine Gespräche',
    noMessages:         'Noch keine Nachrichten',
    typing:             '{{name}} tippt…',
    selectConversation: 'Wähle ein Gespräch',
    selectHint:         'Oder starte eines von einer Dienstseite',
    inputPlaceholder:   'Nachricht eingeben…',
    re:                 'zu:',
    viewFile:           'Datei anzeigen',
  },

  // ── Checkout ──────────────────────────────────────────
  checkout: {
    title:                'Kasse',
    orderSummary:         'Bestellübersicht',
    package:              'Paket',
    daysDelivery:         'Tage Lieferzeit',
    total:                'Gesamt',
    escrowNote:           '💰 Gelder werden treuhänderisch gehalten, bis du die Lieferung bestätigst.',
    requirementsLabel:    'Anforderungen für den Anbieter',
    requirementsOptional: '(optional)',
    requirementsPlaceholder: 'Beschreibe, was du brauchst, besondere Details oder Wünsche…',
    paymentDetails:       'Zahlungsdetails',
    pay:                  'Bezahlen',
    processing:           'Verarbeitung…',
    toasts: {
      placed:       'Bestellung aufgegeben! 🎉',
      paymentFailed:'Zahlung fehlgeschlagen. Bitte erneut versuchen.',
      createFailed: 'Bestellung konnte nicht erstellt werden',
    },
  },

  // ── Service Detail ────────────────────────────────────
  detail: {
    notFound:         'Dienst nicht gefunden',
    home:             'Startseite',
    aboutService:     'Über diesen Dienst',
    aboutSeller:      'Über den Anbieter',
    location:         'Standort',
    responseTime:     'Antwortzeit',
    ordersCompleted:  'Abgeschlossene Bestellungen',
    memberSince:      'Mitglied seit',
    notSpecified:     'Nicht angegeben',
    na:               'N/A',
    reviews:          'Bewertungen',
    sellerReply:      'Antwort des Anbieters',
    ownService:       'Das ist dein Dienst',
    contactSeller:    '💬 Anbieter kontaktieren',
    remote:           '🌐 Remote',
    inPerson:         'Vor Ort',
    availability:     'Verfügbarkeit',
    contactForDetails:'Für Details kontaktieren',
    days:             'Tag',
    daysPlural:       'Tage',
    revision:         'Revision',
    revisionsPlural:  'Revisionen',
    continue:         'Weiter',
    noConversation:   'Gespräch konnte nicht gestartet werden',
  },

  // ── Seller Profile ────────────────────────────────────
  profile: {
    notFound:       'Anbieter nicht gefunden',
    reviews:        'Bewertungen',
    orders:         'Bestellungen',
    completion:     'Abschlussrate',
    reviewsSection: 'Bewertungen',
    about:          'Über mich',
    skills:         'Fähigkeiten',
    languages:      'Sprachen',
    portfolio:      'Portfolio',
    services:       'Dienste',
  },

  // ── Footer ────────────────────────────────────────────
  footer: {
    tagline:         'Der lokale Dienstleistungsmarktplatz, der deine Community verbindet.',
    exploreTitle:    'Erkunden',
    sellersTitle:    'Anbieter',
    companyTitle:    'Unternehmen',
    becomeSeller:    'Anbieter werden',
    sellerDashboard: 'Anbieter-Dashboard',
    about:           'Über uns',
    privacy:         'Datenschutzrichtlinie',
    terms:           'Nutzungsbedingungen',
    copyright:       '© {{year}} Kaya Marketplace. Alle Rechte vorbehalten.',
    operational:     'Alle Systeme betriebsbereit',
    niches: {
      gardening:   '🌱 Gartenarbeit',
      tutoring:    '📚 Nachhilfe',
      babysitting: '👶 Babysitting',
      cleaning:    '🧹 Reinigung',
    },
  },

  // ── Service Card ──────────────────────────────────────
  card: {
    noReviews: 'Noch keine Bewertungen',
    from:      'Ab',
  },

  // ── Niche names (keyed by slug, hyphens → underscores) ─
  niches: {
    gardening:         'Gartenarbeit',
    craftwork:         'Handwerk',
    tutoring:          'Nachhilfe',
    babysitting:       'Babysitting',
    cleaning:          'Reinigung',
    pet_care:          'Tierbetreuung',
    photography:       'Fotografie',
    personal_training: 'Personal Training',
    home_repairs:      'Hausreparaturen',
    cooking:           'Kochen',
  },
};
