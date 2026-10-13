import { useEffect, useState } from 'react'
import type { DailyWeather, HourlyWeather, WeatherData } from '../lib/weather'

const cacheKey = 'weather-calendar-weather-v2'
const cacheHour = 60 * 60 * 1000
type Cached = { savedAt: number; data: WeatherData }

function cachedWeather() {
  try { return JSON.parse(localStorage.getItem(cacheKey) ?? 'null') as Cached | null } catch { return null }
}
function average(values: (number | null | undefined)[]) {
  const valid = values.filter((value): value is number => typeof value === 'number')
  return valid.length ? valid.reduce((sum, value) => sum + value, 0) / valid.length : null
}

async function getLocationName(latitude: number, longitude: number) {
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&zoom=10&accept-language=ko`
  const result = await fetch(url, { headers: { Accept: 'application/json' } })
  if (!result.ok) throw new Error('reverse geocoding failed')
  const address = (await result.json()).address ?? {}
  return address.borough ?? address.city_district ?? address.county ?? address.city ?? '현재 위치'
}

async function fetchWeather(latitude: number, longitude: number, permissionFallback: boolean): Promise<WeatherData> {
  const common = `latitude=${latitude}&longitude=${longitude}&timezone=auto&forecast_days=14`
  const forecastUrl = `https://api.open-meteo.com/v1/forecast?${common}&wind_speed_unit=ms&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum,sunrise,sunset,uv_index_max&hourly=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,wind_direction_10m,precipitation_probability`
  // Air Quality API currently provides up to 7 forecast days; remaining weather days show PM10 as "정보 없음".
  const airUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${latitude}&longitude=${longitude}&timezone=auto&forecast_days=7&hourly=pm10`
  const [forecastResponse, airResponse, locationName] = await Promise.all([
    fetch(forecastUrl).then(response => { if (!response.ok) throw new Error('forecast failed'); return response.json() }),
    fetch(airUrl).then(response => { if (!response.ok) throw new Error('air quality failed'); return response.json() }),
    getLocationName(latitude, longitude).catch(() => permissionFallback ? '서울' : '현재 위치'),
  ])
  const pm10ByDate: Record<string, number[]> = {}
  const pm10ByTime: Record<string, number> = {}
  airResponse.hourly.time.forEach((time: string, index: number) => {
    const value = airResponse.hourly.pm10[index]
    if (typeof value === 'number') pm10ByTime[time] = value
    if (typeof value === 'number') (pm10ByDate[time.slice(0, 10)] ??= []).push(value)
  })
  const hourly: Record<string, HourlyWeather[]> = {}
  forecastResponse.hourly.time.forEach((time: string, index: number) => {
    const date = time.slice(0, 10)
    ;(hourly[date] ??= []).push({ time, temperature: forecastResponse.hourly.temperature_2m[index], humidity: forecastResponse.hourly.relative_humidity_2m[index], code: forecastResponse.hourly.weather_code[index], windSpeed: forecastResponse.hourly.wind_speed_10m[index], windDirection: forecastResponse.hourly.wind_direction_10m[index], precipitationProbability: forecastResponse.hourly.precipitation_probability?.[index] ?? null, pm10: pm10ByTime[time] ?? null })
  })
  const daily: Record<string, DailyWeather> = {}
  forecastResponse.daily.time.forEach((date: string, index: number) => {
    const hours = hourly[date] ?? []
    daily[date] = {
      date, code: forecastResponse.daily.weather_code[index], maxTemperature: forecastResponse.daily.temperature_2m_max[index], minTemperature: forecastResponse.daily.temperature_2m_min[index], precipitationProbability: forecastResponse.daily.precipitation_probability_max[index] ?? null, precipitation: forecastResponse.daily.precipitation_sum[index] ?? null,
      humidity: average(hours.map(hour => hour.humidity)), windSpeed: average(hours.map(hour => hour.windSpeed)), windDirection: average(hours.map(hour => hour.windDirection)), pm10: average(pm10ByDate[date] ?? []), uvIndex: forecastResponse.daily.uv_index_max[index] ?? null, sunrise: forecastResponse.daily.sunrise[index] ?? null, sunset: forecastResponse.daily.sunset[index] ?? null,
    }
  })
  return { latitude, longitude, locationName, permissionFallback, daily, hourly }
}

export function useWeather() {
  const initial = cachedWeather()
  const [data, setData] = useState<WeatherData | null>(initial?.data ?? null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async (latitude: number, longitude: number, fallback: boolean) => {
      const cache = cachedWeather()
      const matches = cache && Math.abs(cache.data.latitude - latitude) < 0.02 && Math.abs(cache.data.longitude - longitude) < 0.02
      if (matches && Date.now() - cache.savedAt < cacheHour) { setData(cache.data); setLoading(false); return }
      try {
        const next = await fetchWeather(latitude, longitude, fallback)
        localStorage.setItem(cacheKey, JSON.stringify({ savedAt: Date.now(), data: next }))
        setData(next)
      } catch { if (cache) setData(cache.data) }
      finally { setLoading(false) }
    }
    if (!navigator.geolocation) { void load(37.5665, 126.978, true); return }
    navigator.geolocation.getCurrentPosition(
      position => void load(position.coords.latitude, position.coords.longitude, false),
      () => void load(37.5665, 126.978, true),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: cacheHour },
    )
  }, [])
  return { weather: data, loading }
}
