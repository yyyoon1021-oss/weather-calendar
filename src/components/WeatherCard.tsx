import { format, isToday } from 'date-fns'
import { ko } from 'date-fns/locale'
import type { DailyWeather } from '../lib/weather'
import { pm10Grade, uvGrade, weatherInfo, windDirectionLabel } from '../lib/weather'

function clock(value: string | null) { return value ? value.slice(11, 16) : '정보 없음' }
function value(value: number | null, unit = '') { return value === null ? '정보 없음' : `${Math.round(value)}${unit}` }

export function WeatherCard({ date, weather }: { date: Date; weather?: DailyWeather }) {
  if (!weather) return <section className="px-1 py-1"><h1 className="text-[27px] font-bold tracking-[-0.04em]">{format(date, 'M월 d일 EEEE', { locale: ko })}</h1><p className="mt-2 text-[16px] text-[#5B6270]">이 날짜는 아직 날씨 예보가 없어요</p></section>
  const info = weatherInfo(weather.code)
  const pm10 = pm10Grade(weather.pm10)
  const card = info.group === 'sun' ? 'border-[#F3E2AE] bg-[#FFF3CF]' : info.group === 'cloud' ? 'border-[#DDE1E7] bg-[#EEF0F3]' : 'border-[#C9DAF2] bg-[#E4EEFA]'
  return <section className={`rounded-3xl border px-6 py-6 ${card}`}>
    <div className="flex items-start justify-between gap-3"><div><h1 className="text-[27px] font-bold tracking-[-0.04em]">{format(date, 'M월 d일 EEEE', { locale: ko })}</h1><p className="mt-2 text-[17px] text-[#5B6270]">{isToday(date) ? '오늘 날씨' : '날씨'} {info.label}</p></div><div className="grid grid-cols-[auto_auto] items-center gap-x-2"><span className="text-[47px]">{info.emoji}</span><div><span className="text-[37px] font-bold leading-none">{Math.round(weather.maxTemperature)}°</span><span className="ml-1 text-[23px] font-semibold text-[#5B6270]">{Math.round(weather.minTemperature)}°</span><p className="mt-1 text-right text-[13px] text-[#5B6270]">최고 / 최저</p></div></div></div>
    <div className="my-6 h-px bg-black/10" />
    <div className="grid grid-cols-3 gap-y-6"><Metric title="강수확률" primary={value(weather.precipitationProbability, '%')} /><Metric title="강수량" primary={value(weather.precipitation, ' mm')} /><Metric title="습도" primary={value(weather.humidity, '%')} /><Metric title="바람" primary={value(weather.windSpeed, ' m/s')} secondary={windDirectionLabel(weather.windDirection)} /><Metric title="미세먼지" primary={pm10.label} primaryColor={pm10.color} secondary={weather.pm10 === null ? undefined : `${Math.round(weather.pm10)} ㎍/㎥`} /><Metric title="자외선" primary={uvGrade(weather.uvIndex)} secondary={weather.uvIndex === null ? undefined : `지수 ${Math.round(weather.uvIndex)}`} /></div>
    <div className="my-6 h-px bg-black/10" /><div className="flex gap-10 text-[16px]"><span className="text-[#5B6270]">일출 <b className="ml-1 text-[#17191C]">{clock(weather.sunrise)}</b></span><span className="text-[#5B6270]">일몰 <b className="ml-1 text-[#17191C]">{clock(weather.sunset)}</b></span></div>
  </section>
}

function Metric({ title, primary, secondary, primaryColor }: { title: string; primary: string; secondary?: string; primaryColor?: string }) { return <div><p className="text-[15px] text-[#5B6270]">{title}</p><p className="mt-1 text-[21px] font-bold" style={{ color: primaryColor }}>{primary}</p>{secondary && <p className="mt-1 text-[14px] text-[#5B6270]">{secondary}</p>}</div> }
