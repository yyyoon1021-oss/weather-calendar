import { describe, expect, it } from 'vitest'
import type { HourlyWeather } from './weather'
import { alertsForRange } from './weatherAlerts'

function day(overrides: Record<number, Partial<HourlyWeather>> = {}): HourlyWeather[] {
  return Array.from({ length: 24 }, (_, hour) => ({
    time: `2026-10-13T${String(hour).padStart(2, '0')}:00`, temperature: 15, humidity: 50, code: 0,
    windSpeed: 2, windDirection: 0, precipitationProbability: 0, pm10: 20, ...overrides[hour],
  }))
}

describe('alertsForRange', () => {
  it('날씨가 좋으면 알림이 없다', () => {
    expect(alertsForRange(day(), 9 * 60, 18 * 60)).toEqual([])
  })

  it('예보가 없으면 알림이 없다', () => {
    expect(alertsForRange(undefined, 0, 60)).toEqual([])
  })

  it('일정과 겹치는 시간대의 비만 알린다', () => {
    const hourly = day({ 15: { code: 61 }, 16: { code: 61 } })
    const alerts = alertsForRange(hourly, 14 * 60, 16 * 60) // 14:00–16:00 → 14시, 15시
    expect(alerts).toHaveLength(1)
    expect(alerts[0]).toMatchObject({ kind: 'rain', advice: '우산 챙기기', hours: '15시' })
    expect(alertsForRange(hourly, 9 * 60, 11 * 60)).toEqual([])
  })

  it('강수확률이 높으면 코드가 맑음이어도 우산을 알린다', () => {
    const alerts = alertsForRange(day({ 10: { precipitationProbability: 70 } }), 10 * 60, 11 * 60)
    expect(alerts.map(alert => alert.kind)).toEqual(['rain'])
  })

  it('눈은 비와 구분해서 알린다', () => {
    const alerts = alertsForRange(day({ 8: { code: 73, precipitationProbability: 90 } }), 8 * 60, 9 * 60)
    expect(alerts.map(alert => alert.kind)).toEqual(['snow'])
  })

  it('강풍과 미세먼지를 함께 알린다', () => {
    const hourly = day({ 13: { windSpeed: 12, pm10: 160 }, 14: { windSpeed: 15, pm10: 90 } })
    const alerts = alertsForRange(hourly, 13 * 60, 15 * 60)
    expect(alerts.map(alert => alert.kind)).toEqual(['wind', 'dust'])
    expect(alerts[0]).toMatchObject({ title: '강풍 15m/s', hours: '13–15시' })
    expect(alerts[1].title).toBe('미세먼지 매우나쁨')
  })

  it('24:00에 끝나는 일정과 30분짜리 일정도 처리한다', () => {
    expect(alertsForRange(day({ 23: { code: 63 } }), 23 * 60, 1440)).toHaveLength(1)
    expect(alertsForRange(day({ 9: { code: 63 } }), 9 * 60 + 30, 10 * 60)).toHaveLength(1)
  })
})
