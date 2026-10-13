export interface HourlyWeather {
  time: string
  temperature: number
  humidity: number
  code: number
  windSpeed: number
  windDirection: number
  precipitationProbability: number | null
  pm10: number | null
}

export interface DailyWeather {
  date: string
  code: number
  maxTemperature: number
  minTemperature: number
  precipitationProbability: number | null
  precipitation: number | null
  humidity: number | null
  windSpeed: number | null
  windDirection: number | null
  pm10: number | null
  uvIndex: number | null
  sunrise: string | null
  sunset: string | null
}

export interface WeatherData {
  latitude: number
  longitude: number
  locationName: string
  permissionFallback: boolean
  daily: Record<string, DailyWeather>
  hourly: Record<string, HourlyWeather[]>
}

export function weatherInfo(code: number, night = false) {
  if (code === 0) return { emoji: night ? '🌙' : '☀️', label: '맑음', group: 'sun' as const }
  if (code === 1 || code === 2) return { emoji: '⛅', label: '구름 조금', group: 'sun' as const }
  if (code === 3) return { emoji: '☁️', label: '흐림', group: 'cloud' as const }
  if (code === 45 || code === 48) return { emoji: '🌫️', label: '안개', group: 'cloud' as const }
  if (code >= 51 && code <= 57) return { emoji: '🌦️', label: '이슬비', group: 'rain' as const }
  if (code >= 61 && code <= 67) return { emoji: '🌧️', label: '비', group: 'rain' as const }
  if (code >= 71 && code <= 77) return { emoji: '❄️', label: '눈', group: 'rain' as const }
  if (code >= 80 && code <= 82) return { emoji: '🌦️', label: '소나기', group: 'rain' as const }
  if (code === 85 || code === 86) return { emoji: '🌨️', label: '눈', group: 'rain' as const }
  return { emoji: '⛈️', label: '뇌우', group: 'rain' as const }
}

export function windDirectionLabel(degrees: number | null) {
  if (degrees === null || Number.isNaN(degrees)) return '정보 없음'
  return ['북풍', '북동풍', '동풍', '남동풍', '남풍', '남서풍', '서풍', '북서풍'][Math.round(degrees / 45) % 8]
}

export function pm10Grade(value: number | null) {
  if (value === null) return { label: '정보 없음', color: '#5B6270' }
  if (value <= 30) return { label: '좋음', color: '#1F5FA8' }
  if (value <= 80) return { label: '보통', color: '#1F7A4D' }
  if (value <= 150) return { label: '나쁨', color: '#B45309' }
  return { label: '매우나쁨', color: '#B42318' }
}

export function uvGrade(value: number | null) {
  if (value === null) return '정보 없음'
  if (value <= 2) return '낮음'
  if (value <= 5) return '보통'
  if (value <= 7) return '높음'
  if (value <= 10) return '매우높음'
  return '위험'
}
