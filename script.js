const API_KEY = 'aba992a1f8573940202102d1fa36db79'
const currentEl = document.getElementById('current')
const forecastEl = document.getElementById('forecast')
const loadingEl = document.getElementById('loading')
const errorEl = document.getElementById('error')
const placeEl = document.getElementById('place')
const timeEl = document.getElementById('time')
const tempEl = document.getElementById('temp')
const descEl = document.getElementById('desc')
const iconEl = document.getElementById('icon')
const feelsEl = document.getElementById('feels')
const humidityEl = document.getElementById('humidity')
const windEl = document.getElementById('wind')
const qInput = document.getElementById('q')
const searchBtn = document.getElementById('searchBtn')
const geoBtn = document.getElementById('geoBtn')
const unitToggle = document.getElementById('unitToggle')
const STORAGE_KEY = 'ultra_weather_v1'
let units = localStorage.getItem(STORAGE_KEY + '_units') || 'metric'
unitToggle.checked = units === 'imperial'
function setUnits(u){units = u; localStorage.setItem(STORAGE_KEY + '_units', u)}
function showLoading(){loadingEl.hidden = false; currentEl.hidden = true; forecastEl.hidden = true; errorEl.hidden = true}
function showError(msg){errorEl.hidden = false; errorEl.textContent = msg; loadingEl.hidden = true; currentEl.hidden = true; forecastEl.hidden = true}
function clearError(){errorEl.hidden = true}
function showWeather(){loadingEl.hidden = true; currentEl.hidden = false; forecastEl.hidden = false; errorEl.hidden = true}
async function fetchJSON(url){const res = await fetch(url); if(!res.ok) throw new Error('Network error'); return res.json()}
function formatTime(dt, tz){const d = new Date(dt * 1000); return d.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit',timeZone:tz})}
function iconUrl(code){return `https://openweathermap.org/img/wn/${code}@2x.png`}
async function fetchByCoords(lat, lon){
  showLoading()
  clearError()
  try{
    const cur = await fetchJSON(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=${units}&appid=${API_KEY}`)
    const fc = await fetchJSON(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=${units}&appid=${API_KEY}`)
    render(cur, fc)
    localStorage.setItem(STORAGE_KEY + '_last', JSON.stringify({lat,lon}))
  }catch(e){showError('Unable to retrieve weather. Check API key or network.')}
}
async function fetchByCity(q){
  if(!q) return
  showLoading()
  clearError()
  try{
    const cur = await fetchJSON(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(q)}&units=${units}&appid=${API_KEY}`)
    const lat = cur.coord.lat, lon = cur.coord.lon
    const fc = await fetchJSON(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=${units}&appid=${API_KEY}`)
    render(cur, fc)
    localStorage.setItem(STORAGE_KEY + '_last', JSON.stringify({q}))
  }catch(e){showError('City not found or network error')}
}
function render(current, forecast){
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  placeEl.textContent = `${current.name}, ${current.sys.country}`
  timeEl.textContent = formatTime(current.dt, tz)
  const unitSym = units === 'metric' ? '°C' : '°F'
  tempEl.textContent = `${Math.round(current.main.temp)}${unitSym}`
  descEl.textContent = current.weather[0].description
  iconEl.src = iconUrl(current.weather[0].icon)
  iconEl.alt = current.weather[0].description
  iconEl.style.transform = 'scale(0.96)'
  setTimeout(()=>iconEl.style.transform = 'scale(1)', 100)
  feelsEl.textContent = `Feels: ${Math.round(current.main.feels_like)}${unitSym}`
  humidityEl.textContent = `${current.main.humidity}%`
  windEl.textContent = `${Math.round(current.wind.speed)} ${units === 'metric' ? 'm/s' : 'mph'}`
  renderForecast(forecast)
  showWeather()
}
function renderForecast(forecast){
  const list = forecast.list
  const days = {}
  list.forEach(item=>{
    const date = new Date(item.dt * 1000)
    const key = date.toISOString().slice(0,10)
    if(!days[key]) days[key] = []
    days[key].push(item)
  })
  const entries = Object.entries(days).slice(0,6)
  forecastEl.innerHTML = ''
  entries.forEach(([date, items], idx)=>{
    if(idx===0) return
    const temps = items.map(i=>i.main.temp)
    const avg = Math.round(temps.reduce((a,b)=>a+b,0)/temps.length)
    const icon = items[Math.floor(items.length/2)].weather[0].icon
    const d = new Date(date)
    const dayName = d.toLocaleDateString(undefined,{weekday:'short'})
    const unitSym = units === 'metric' ? '°C' : '°F'
    const div = document.createElement('div')
    div.className = 'day'
    div.innerHTML = `<div class="d">${dayName}</div>
                     <img src="${iconUrl(icon)}" alt="" width="48" height="48" />
                     <div class="t">${avg}${unitSym}</div>`
    forecastEl.appendChild(div)
  })
}
searchBtn.addEventListener('click', ()=>fetchByCity(qInput.value.trim()))
qInput.addEventListener('keydown', (e)=>{if(e.key==='Enter') fetchByCity(qInput.value.trim())})
geoBtn.addEventListener('click', ()=>{navigator.geolocation.getCurrentPosition(p=>fetchByCoords(p.coords.latitude,p.coords.longitude), ()=>showError('Unable to access location'))})
unitToggle.addEventListener('change', ()=>{
  setUnits(unitToggle.checked ? 'imperial' : 'metric')
  const last = JSON.parse(localStorage.getItem(STORAGE_KEY + '_last') || '{}')
  if(last.q) fetchByCity(last.q)
  else if(last.lat && last.lon) fetchByCoords(last.lat, last.lon)
})
async function init(){
  if(API_KEY === 'YOUR_API_KEY_HERE'){showError('Please add your OpenWeatherMap API key in script.js'); return}
  const last = JSON.parse(localStorage.getItem(STORAGE_KEY + '_last') || '{}')
  if(last.q) fetchByCity(last.q)
  else if(last.lat && last.lon) fetchByCoords(last.lat, last.lon)
  else if(navigator.geolocation) navigator.geolocation.getCurrentPosition(p=>fetchByCoords(p.coords.latitude,p.coords.longitude), ()=>fetchByCity('New York'))
}
init()