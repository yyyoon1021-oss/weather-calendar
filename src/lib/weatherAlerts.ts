import type { HourlyWeather } from './weather'

export type AlertKind = 'rain' | 'snow' | 'dust' | 'wind'

export interface WeatherAlert {
  kind: AlertKind
  icon: string
  title: string
  advice: string
  /** 겹치는 시간대, 예: "14–16시" */
  hours: string
}

export const WIND_STRONG = 10 // m/s
export const WIND_SEVERE = 14 // m/s
export const PM10_BAD = 81 // ㎍/㎥ (pm10Grade의 '나쁨' 시작)
export const PM10_VERY_BAD = 151
export const RAIN_PROBABILITY = 60 // %

const isSnow = (code: number) => (code >= 71 && code <= 77) || code === 85 || code === 86
const isRain = (code: number) => (code >= 51 && code <= 67) || (code >= 80 && code <= 82) || code >= 95
const isThunder = (code: number) => code >= 95

function hourRange(startMinute: number, endMinute: number) {
  const first = Math.max(0, Math.floor(startMinute / 60))
  const last = Math.min(23, Math.max(first, Math.ceil(endMinute / 60) - 1))
  return { first, last }
}

function label(hours: number[]) {
  const start = hours[0]
  const end = hours[hours.length - 1] + 1
  return end - start <= 1 ? `${start}시` : `${start}–${end}시`
}

/** 일정이 차지하는 시간(분 단위, 같은 날 기준)과 겹치는 시간대의 날씨 위험 요소를 알려준다. */
export function alertsForRange(hourly: HourlyWeather[] | undefined, startMinute: number, endMinute: number): WeatherAlert[] {
  if (!hourly?.length) return []
  const { first, last } = hourRange(startMinute, endMinute)
  const hours = hourly.slice(first, last + 1).map((hour, index) => ({ hour, at: first + index }))
  const alerts: WeatherAlert[] = []

  const snow = hours.filter(({ hour }) => isSnow(hour.code))
  if (snow.length) {
    alerts.push({ kind: 'snow', icon: '❄️', title: '눈 예보', advice: '길이 미끄러울 수 있어요. 실내 이동을 고려하고 이동 시간을 넉넉히 잡으세요.', hours: label(snow.map(({ at }) => at)) })
  }

  const wet = hours.filter(({ hour }) => !isSnow(hour.code) && (isRain(hour.code) || (hour.precipitationProbability ?? 0) >= RAIN_PROBABILITY))
  if (wet.length) {
    const thunder = wet.some(({ hour }) => isThunder(hour.code))
    alerts.push({ kind: 'rain', icon: thunder ? '⛈️' : '☔', title: thunder ? '천둥·번개 동반 비' : '비 예보', advice: thunder ? '우산을 챙기고, 야외 이동은 피해 실내 이동을 고려하세요.' : '우산 챙기기', hours: label(wet.map(({ at }) => at)) })
  }

  const windy = hours.filter(({ hour }) => hour.windSpeed >= WIND_STRONG)
  if (windy.length) {
    const severe = windy.some(({ hour }) => hour.windSpeed >= WIND_SEVERE)
    const peak = Math.round(Math.max(...windy.map(({ hour }) => hour.windSpeed)))
    alerts.push({ kind: 'wind', icon: '💨', title: `강풍 ${peak}m/s`, advice: severe ? '우산이 뒤집힐 수 있어요. 실내 이동을 고려하세요.' : '우산이 뒤집힐 수 있어요. 우비나 모자를 챙기세요.', hours: label(windy.map(({ at }) => at)) })
  }

  const dusty = hours.filter(({ hour }) => (hour.pm10 ?? 0) >= PM10_BAD)
  if (dusty.length) {
    const veryBad = dusty.some(({ hour }) => (hour.pm10 ?? 0) >= PM10_VERY_BAD)
    alerts.push({ kind: 'dust', icon: '😷', title: veryBad ? '미세먼지 매우나쁨' : '미세먼지 나쁨', advice: veryBad ? '마스크를 챙기고 실내 이동을 고려하세요.' : '마스크 챙기기', hours: label(dusty.map(({ at }) => at)) })
  }

  return alerts
}
