// app/types/analytics.ts

// Tipos para Traffic Stats Response
export interface DailyTrafficItem {
  date: string;
  clicks: number;
}

export interface LocationStatsItem {
  countryCode: string;
  clicks: number;
  percentage: string;
}

export interface TrafficSourceItem {
  source: string;
  referrer: string;
  clicks: number;
  percentage: string;
}

export interface DeviceStats {
  devices: {
    mobile: number;
    desktop: number;
    tablet: number;
  };
  browsers: {
    chrome: number;
    firefox: number;
    safari: number;
    edge: number;
    other: number;
  };
  os: {
    windows: number;
    mac: number;
    linux: number;
    android: number;
    ios: number;
    other: number;
  };
}

export interface HourlyDistributionItem {
  hour: number;
  clicks: number;
}

export interface TrafficStatsResponse {
  timeframe: string;
  totalClicks: number;
  uniqueVisitors: number;
  dailyTraffic: DailyTrafficItem[];
  locationStats: LocationStatsItem[];
  trafficSources: TrafficSourceItem[];
  deviceStats: DeviceStats;
  hourlyDistribution: HourlyDistributionItem[];
  timestamp: string;
}

// Tipos para URL Details Response
export interface URLInfo {
  id: number;
  originalUrl: string;
  shortUrl: string;
  createdAt: Date | null;
  username: string;
  correlativo: string | null;
}

export interface URLStats {
  totalClicks: number;
  uniqueVisitors: number;
  topCountries: LocationStatsItem[];
}

export interface RecentClickItem {
  id: number;
  timestamp: Date;
  ip: string;
  country: string;
  referrer: string;
  userAgent: string;
}

export interface URLDetailsResponse {
  urlInfo: URLInfo;
  stats: URLStats;
  recentClicks: RecentClickItem[];
  timestamp: string;
}

// Types para uso interno en las funciones
export interface DailyStatsRecord {
  [date: string]: number;
}

export interface HourlyStatsRecord {
  [hour: number]: number;
}

// Tipos para componentes de UI
export interface CountryInfo {
  code: string;
  name: string;
  flag: string;
}

export interface ChartDataPoint {
  name: string;
  value: number;
  label?: string;
  color?: string;
}

export interface TimeframeSelectorProps {
  value: '7d' | '30d' | '90d';
  onChange: (timeframe: '7d' | '30d' | '90d') => void;
}

export interface AnalyticsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

// Mapeo de códigos de país a información
export const COUNTRY_INFO: Record<string, CountryInfo> = {
  'US': { code: 'US', name: 'Estados Unidos', flag: '🇺🇸' },
  'CL': { code: 'CL', name: 'Chile', flag: '🇨🇱' },
  'MX': { code: 'MX', name: 'México', flag: '🇲🇽' },
  'ES': { code: 'ES', name: 'España', flag: '🇪🇸' },
  'AR': { code: 'AR', name: 'Argentina', flag: '🇦🇷' },
  'PE': { code: 'PE', name: 'Perú', flag: '🇵🇪' },
  'CO': { code: 'CO', name: 'Colombia', flag: '🇨🇴' },
  'VE': { code: 'VE', name: 'Venezuela', flag: '🇻🇪' },
  'EC': { code: 'EC', name: 'Ecuador', flag: '🇪🇨' },
  'UY': { code: 'UY', name: 'Uruguay', flag: '🇺🇾' },
  'PY': { code: 'PY', name: 'Paraguay', flag: '🇵🇾' },
  'BO': { code: 'BO', name: 'Bolivia', flag: '🇧🇴' },
  'BR': { code: 'BR', name: 'Brasil', flag: '🇧🇷' },
  'CA': { code: 'CA', name: 'Canadá', flag: '🇨🇦' },
  'GB': { code: 'GB', name: 'Reino Unido', flag: '🇬🇧' },
  'FR': { code: 'FR', name: 'Francia', flag: '🇫🇷' },
  'DE': { code: 'DE', name: 'Alemania', flag: '🇩🇪' },
  'IT': { code: 'IT', name: 'Italia', flag: '🇮🇹' },
  'PT': { code: 'PT', name: 'Portugal', flag: '🇵🇹' },
  'IN': { code: 'IN', name: 'India', flag: '🇮🇳' },
  'CN': { code: 'CN', name: 'China', flag: '🇨🇳' },
  'JP': { code: 'JP', name: 'Japón', flag: '🇯🇵' },
  'KR': { code: 'KR', name: 'Corea del Sur', flag: '🇰🇷' },
  'AU': { code: 'AU', name: 'Australia', flag: '🇦🇺' },
  'NZ': { code: 'NZ', name: 'Nueva Zelanda', flag: '🇳🇿' },
  'ZA': { code: 'ZA', name: 'Sudáfrica', flag: '🇿🇦' },
  'EG': { code: 'EG', name: 'Egipto', flag: '🇪🇬' },
  'NG': { code: 'NG', name: 'Nigeria', flag: '🇳🇬' },
  'KE': { code: 'KE', name: 'Kenia', flag: '🇰🇪' },
  'GH': { code: 'GH', name: 'Ghana', flag: '🇬🇭' },
  'MA': { code: 'MA', name: 'Marruecos', flag: '🇲🇦' },
  'RU': { code: 'RU', name: 'Rusia', flag: '🇷🇺' },
  'UA': { code: 'UA', name: 'Ucrania', flag: '🇺🇦' },
  'PL': { code: 'PL', name: 'Polonia', flag: '🇵🇱' },
  'CZ': { code: 'CZ', name: 'República Checa', flag: '🇨🇿' },
  'SK': { code: 'SK', name: 'Eslovaquia', flag: '🇸🇰' },
  'HU': { code: 'HU', name: 'Hungría', flag: '🇭🇺' },
  'RO': { code: 'RO', name: 'Rumania', flag: '🇷🇴' },
  'BG': { code: 'BG', name: 'Bulgaria', flag: '🇧🇬' },
  'HR': { code: 'HR', name: 'Croacia', flag: '🇭🇷' },
  'SI': { code: 'SI', name: 'Eslovenia', flag: '🇸🇮' },
  'RS': { code: 'RS', name: 'Serbia', flag: '🇷🇸' },
  'BA': { code: 'BA', name: 'Bosnia y Herzegovina', flag: '🇧🇦' },
  'MK': { code: 'MK', name: 'Macedonia del Norte', flag: '🇲🇰' },
  'AL': { code: 'AL', name: 'Albania', flag: '🇦🇱' },
  'ME': { code: 'ME', name: 'Montenegro', flag: '🇲🇪' },
  'XK': { code: 'XK', name: 'Kosovo', flag: '🇽🇰' },
  'GR': { code: 'GR', name: 'Grecia', flag: '🇬🇷' },
  'TR': { code: 'TR', name: 'Turquía', flag: '🇹🇷' },
  'CY': { code: 'CY', name: 'Chipre', flag: '🇨🇾' },
  'MT': { code: 'MT', name: 'Malta', flag: '🇲🇹' },
  'IE': { code: 'IE', name: 'Irlanda', flag: '🇮🇪' },
  'IS': { code: 'IS', name: 'Islandia', flag: '🇮🇸' },
  'NO': { code: 'NO', name: 'Noruega', flag: '🇳🇴' },
  'SE': { code: 'SE', name: 'Suecia', flag: '🇸🇪' },
  'FI': { code: 'FI', name: 'Finlandia', flag: '🇫🇮' },
  'DK': { code: 'DK', name: 'Dinamarca', flag: '🇩🇰' },
  'NL': { code: 'NL', name: 'Países Bajos', flag: '🇳🇱' },
  'BE': { code: 'BE', name: 'Bélgica', flag: '🇧🇪' },
  'LU': { code: 'LU', name: 'Luxemburgo', flag: '🇱🇺' },
  'CH': { code: 'CH', name: 'Suiza', flag: '🇨🇭' },
  'AT': { code: 'AT', name: 'Austria', flag: '🇦🇹' },
  'LI': { code: 'LI', name: 'Liechtenstein', flag: '🇱🇮' },
  'MC': { code: 'MC', name: 'Mónaco', flag: '🇲🇨' },
  'AD': { code: 'AD', name: 'Andorra', flag: '🇦🇩' },
  'SM': { code: 'SM', name: 'San Marino', flag: '🇸🇲' },
  'VA': { code: 'VA', name: 'Ciudad del Vaticano', flag: '🇻🇦' },
  'IL': { code: 'IL', name: 'Israel', flag: '🇮🇱' },
  'PS': { code: 'PS', name: 'Palestina', flag: '🇵🇸' },
  'JO': { code: 'JO', name: 'Jordania', flag: '🇯🇴' },
  'LB': { code: 'LB', name: 'Líbano', flag: '🇱🇧' },
  'SY': { code: 'SY', name: 'Siria', flag: '🇸🇾' },
  'IQ': { code: 'IQ', name: 'Irak', flag: '🇮🇶' },
  'IR': { code: 'IR', name: 'Irán', flag: '🇮🇷' },
  'AF': { code: 'AF', name: 'Afganistán', flag: '🇦🇫' },
  'PK': { code: 'PK', name: 'Pakistán', flag: '🇵🇰' },
  'BD': { code: 'BD', name: 'Bangladesh', flag: '🇧🇩' },
  'LK': { code: 'LK', name: 'Sri Lanka', flag: '🇱🇰' },
  'MV': { code: 'MV', name: 'Maldivas', flag: '🇲🇻' },
  'NP': { code: 'NP', name: 'Nepal', flag: '🇳🇵' },
  'BT': { code: 'BT', name: 'Bután', flag: '🇧🇹' },
  'MM': { code: 'MM', name: 'Myanmar', flag: '🇲🇲' },
  'TH': { code: 'TH', name: 'Tailandia', flag: '🇹🇭' },
  'KH': { code: 'KH', name: 'Camboya', flag: '🇰🇭' },
  'LA': { code: 'LA', name: 'Laos', flag: '🇱🇦' },
  'VN': { code: 'VN', name: 'Vietnam', flag: '🇻🇳' },
  'MY': { code: 'MY', name: 'Malasia', flag: '🇲🇾' },
  'SG': { code: 'SG', name: 'Singapur', flag: '🇸🇬' },
  'BN': { code: 'BN', name: 'Brunéi', flag: '🇧🇳' },
  'ID': { code: 'ID', name: 'Indonesia', flag: '🇮🇩' },
  'TL': { code: 'TL', name: 'Timor Oriental', flag: '🇹🇱' },
  'PH': { code: 'PH', name: 'Filipinas', flag: '🇵🇭' },
  'TW': { code: 'TW', name: 'Taiwán', flag: '🇹🇼' },
  'HK': { code: 'HK', name: 'Hong Kong', flag: '🇭🇰' },
  'MO': { code: 'MO', name: 'Macao', flag: '🇲🇴' },
  'MN': { code: 'MN', name: 'Mongolia', flag: '🇲🇳' },
  'KZ': { code: 'KZ', name: 'Kazajistán', flag: '🇰🇿' },
  'KG': { code: 'KG', name: 'Kirguistán', flag: '🇰🇬' },
  'TJ': { code: 'TJ', name: 'Tayikistán', flag: '🇹🇯' },
  'UZ': { code: 'UZ', name: 'Uzbekistán', flag: '🇺🇿' },
  'TM': { code: 'TM', name: 'Turkmenistán', flag: '🇹🇲' }
};

// Helper para obtener información del país
export function getCountryInfo(countryCode: string): CountryInfo {
  return COUNTRY_INFO[countryCode] || { 
    code: countryCode, 
    name: countryCode || 'Desconocido', 
    flag: '🌍' 
  };
}

// Funciones de utilidad para formateo
export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

export function formatPercentage(percentage: string | number): string {
  const num = typeof percentage === 'string' ? parseFloat(percentage) : percentage;
  return num.toFixed(1) + '%';
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}