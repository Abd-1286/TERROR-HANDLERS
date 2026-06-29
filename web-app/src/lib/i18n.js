// Lightweight i18n. Translates the navigation, home dashboard, and settings
// chrome. Falls back to English for any missing key. Arabic renders right-to-left
// (handled in the settings provider, which sets <html dir>).

import { useSettings } from "./settings";

export const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "ar", label: "العربية" },
  { code: "es", label: "Español" },
];

export const RTL_LANGS = ["ar"];

const STRINGS = {
  en: {
    "app.name": "FinDesk",
    "app.local": "100% local · offline",
    "app.dataNote": "Your data never leaves this machine.",

    "nav.home": "Home",
    "nav.deductions": "Tax Deduction Finder",
    "nav.subscriptions": "Subscription Manager",
    "nav.cashflow": "Cash-Flow Forecaster",
    "nav.anomalies": "Spending Anomalies",
    "nav.whatif": "What-If Simulator",
    "nav.goals": "Smart Goals",
    "nav.settings": "Settings",
    "nav.soon": "soon",

    "dash.welcome": "Welcome to FinDesk",
    "dash.subtitle": "Your private finance toolkit — everything runs and stays on this device.",
    "dash.localBadge": "All data saved locally · no internet required",
    "dash.overview": "Overview",
    "dash.open": "Open",

    "card.deductions.empty": "Import a bank CSV to find business write-offs.",
    "card.subscriptions.empty": "Track all your subscriptions and total the cost.",
    "card.cashflow.empty": "Project your balance and avoid overdrafts.",
    "card.anomalies.empty": "Flag unusual charges against your normal pattern.",
    "card.whatif.empty": "Drag sliders to see your future balance change — instantly.",

    "set.title": "Settings",
    "set.subtitle": "Accessibility, theme, language, the local AI model, and your data — all on this device.",
    "set.a11y": "Accessibility",
    "set.textSize": "Text size",
    "set.textSizeHint": "Scales the whole interface.",
    "set.contrast": "High contrast",
    "set.contrastHint": "Brighten muted text and borders.",
    "set.motion": "Reduce motion",
    "set.motionHint": "Turn off animations and transitions.",
    "set.theme": "Theme",
    "set.mode": "Mode",
    "set.modeHint": "Switch between light and dark.",
    "set.light": "Light",
    "set.dark": "Dark",
    "set.accent": "Accent color",
    "set.accentHint": "Used for highlights, buttons, and charts.",
    "set.language": "Language",
    "set.languageLabel": "Display language",
    "set.languageHint": "Changes the interface language. Arabic switches to right-to-left.",
    "set.model": "Local AI model",
    "set.data": "Your data",
    "set.dataNote": "Everything you enter is saved only in this app on this device. Back it up or move it with export / import.",
    "set.export": "Export backup",
    "set.import": "Import backup",
    "set.clear": "Clear all data",
  },

  ar: {
    "app.name": "فِن‌دِسك",
    "app.local": "محلي ١٠٠٪ · بدون إنترنت",
    "app.dataNote": "بياناتك لا تغادر هذا الجهاز أبدًا.",

    "nav.home": "الرئيسية",
    "nav.deductions": "باحث الخصومات الضريبية",
    "nav.subscriptions": "مدير الاشتراكات",
    "nav.cashflow": "متنبئ التدفق النقدي",
    "nav.anomalies": "الإنفاق غير المعتاد",
    "nav.whatif": "محاكي الاحتمالات",
    "nav.goals": "الأهداف الذكية",
    "nav.settings": "الإعدادات",
    "nav.soon": "قريبًا",

    "dash.welcome": "مرحبًا بك في فِن‌دِسك",
    "dash.subtitle": "أدواتك المالية الخاصة — كل شيء يعمل ويبقى على هذا الجهاز.",
    "dash.localBadge": "كل البيانات محفوظة محليًا · لا حاجة للإنترنت",
    "dash.overview": "نظرة عامة",
    "dash.open": "فتح",

    "card.deductions.empty": "استورد كشف حساب بنكي للعثور على الخصومات.",
    "card.subscriptions.empty": "تتبّع كل اشتراكاتك واحسب التكلفة الإجمالية.",
    "card.cashflow.empty": "توقّع رصيدك وتجنّب السحب على المكشوف.",
    "card.anomalies.empty": "اكتشف الرسوم غير المعتادة مقارنةً بنمطك.",
    "card.whatif.empty": "حرّك المؤشرات لترى تغيّر رصيدك المستقبلي فورًا.",

    "set.title": "الإعدادات",
    "set.subtitle": "إمكانية الوصول، والمظهر، واللغة، ونموذج الذكاء الاصطناعي المحلي، وبياناتك — كلها على هذا الجهاز.",
    "set.a11y": "إمكانية الوصول",
    "set.textSize": "حجم النص",
    "set.textSizeHint": "يغيّر حجم الواجهة بالكامل.",
    "set.contrast": "تباين عالٍ",
    "set.contrastHint": "إبراز النصوص والحدود الباهتة.",
    "set.motion": "تقليل الحركة",
    "set.motionHint": "إيقاف الرسوم المتحركة والانتقالات.",
    "set.theme": "المظهر",
    "set.mode": "الوضع",
    "set.modeHint": "التبديل بين الفاتح والداكن.",
    "set.light": "فاتح",
    "set.dark": "داكن",
    "set.accent": "اللون المميّز",
    "set.accentHint": "يُستخدم للإبرازات والأزرار والرسوم البيانية.",
    "set.language": "اللغة",
    "set.languageLabel": "لغة العرض",
    "set.languageHint": "تغيّر لغة الواجهة. العربية تتحوّل إلى الاتجاه من اليمين إلى اليسار.",
    "set.model": "نموذج الذكاء الاصطناعي المحلي",
    "set.data": "بياناتك",
    "set.dataNote": "كل ما تُدخله يُحفظ فقط في هذا التطبيق على هذا الجهاز. انسخه احتياطيًا أو انقله عبر التصدير / الاستيراد.",
    "set.export": "تصدير نسخة احتياطية",
    "set.import": "استيراد نسخة احتياطية",
    "set.clear": "مسح كل البيانات",
  },

  es: {
    "app.name": "FinDesk",
    "app.local": "100% local · sin conexión",
    "app.dataNote": "Tus datos nunca salen de este equipo.",

    "nav.home": "Inicio",
    "nav.deductions": "Buscador de deducciones",
    "nav.subscriptions": "Gestor de suscripciones",
    "nav.cashflow": "Previsión de flujo de caja",
    "nav.anomalies": "Gastos inusuales",
    "nav.whatif": "Simulador de escenarios",
    "nav.goals": "Metas inteligentes",
    "nav.settings": "Ajustes",
    "nav.soon": "pronto",

    "dash.welcome": "Bienvenido a FinDesk",
    "dash.subtitle": "Tu kit de finanzas privado: todo se ejecuta y permanece en este equipo.",
    "dash.localBadge": "Todos los datos guardados localmente · sin internet",
    "dash.overview": "Resumen",
    "dash.open": "Abrir",

    "card.deductions.empty": "Importa un CSV bancario para encontrar deducciones.",
    "card.subscriptions.empty": "Controla tus suscripciones y suma el coste.",
    "card.cashflow.empty": "Proyecta tu saldo y evita descubiertos.",
    "card.anomalies.empty": "Detecta cargos inusuales frente a tu patrón normal.",
    "card.whatif.empty": "Mueve los controles y mira cambiar tu saldo futuro al instante.",

    "set.title": "Ajustes",
    "set.subtitle": "Accesibilidad, tema, idioma, el modelo de IA local y tus datos, todo en este equipo.",
    "set.a11y": "Accesibilidad",
    "set.textSize": "Tamaño del texto",
    "set.textSizeHint": "Escala toda la interfaz.",
    "set.contrast": "Alto contraste",
    "set.contrastHint": "Aclara el texto y los bordes tenues.",
    "set.motion": "Reducir movimiento",
    "set.motionHint": "Desactiva animaciones y transiciones.",
    "set.theme": "Tema",
    "set.mode": "Modo",
    "set.modeHint": "Cambia entre claro y oscuro.",
    "set.light": "Claro",
    "set.dark": "Oscuro",
    "set.accent": "Color de acento",
    "set.accentHint": "Se usa en resaltados, botones y gráficos.",
    "set.language": "Idioma",
    "set.languageLabel": "Idioma de la interfaz",
    "set.languageHint": "Cambia el idioma de la interfaz. El árabe pasa a derecha-a-izquierda.",
    "set.model": "Modelo de IA local",
    "set.data": "Tus datos",
    "set.dataNote": "Todo lo que introduces se guarda solo en esta app en este equipo. Haz copia o muévelo con exportar / importar.",
    "set.export": "Exportar copia",
    "set.import": "Importar copia",
    "set.clear": "Borrar todos los datos",
  },
};

export function translate(lang, key) {
  return STRINGS[lang]?.[key] ?? STRINGS.en[key] ?? key;
}

export function useT() {
  const { settings } = useSettings();
  const lang = settings.language || "en";
  return (key) => translate(lang, key);
}
