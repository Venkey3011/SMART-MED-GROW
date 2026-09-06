import React, { useEffect, useMemo, useState } from 'react';
import { Camera, CheckCircle2, Droplets, Lightbulb, Loader2, Radio, RefreshCw, Save, Wifi, WifiOff } from 'lucide-react';
import { Device } from '../types';

interface Props { device: Device | null; token: string | null; onDeviceUpdated: () => void; userHistory?: { readings: any[]; logs: any[] }; }
type BoardStatus = { soilDigitalValue: number; soilStatus: 'DRY' | 'WET'; pump: 'ON' | 'OFF'; mode: 'AUTO' | 'MANUAL'; flash?: 'ON' | 'OFF'; stationIp?: string; accessPointIp?: string; wifiConnected?: boolean; };
const HOTSPOT_IP = '192.168.4.1';
const normaliseHost = (value: string) => value.trim().replace(/^https?:\/\//, '').replace(/\/$/, '');

export default function ESP32CamSetup({ device, token, onDeviceUpdated, userHistory }: Props) {
  const [host, setHost] = useState(device?.esp32CamIpAddress || HOTSPOT_IP);
  const [status, setStatus] = useState<BoardStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<{ kind: 'ok' | 'error' | 'info'; text: string } | null>(null);
  const [lastPhoto, setLastPhoto] = useState<string | null>(null);
  useEffect(() => setHost(device?.esp32CamIpAddress || HOTSPOT_IP), [device?.esp32CamIpAddress]);
  const baseUrl = useMemo(() => `http://${normaliseHost(host)}`, [host]);

  const saveDevice = async (ip: string, usePhysicalCam = true) => {
    if (!token) return;
    const clean = normaliseHost(ip);
    const response = await fetch('/api/devices/my-device', { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ esp32CamIpAddress: clean, esp32CamStreamUrl: `http://${clean}/stream`, usePhysicalCam }) });
    if (!response.ok) throw new Error('The app could not save this device address.');
    onDeviceUpdated();
  };
  const request = async <T,>(path: string): Promise<T> => {
    const controller = new AbortController(); const timeout = window.setTimeout(() => controller.abort(), 4500);
    try { const response = await fetch(`${baseUrl}${path}`, { cache: 'no-store', signal: controller.signal }); if (!response.ok) throw new Error(`ESP32-CAM returned ${response.status}`); return response.json() as Promise<T>; } finally { window.clearTimeout(timeout); }
  };
  const checkBoard = async (quiet = false) => {
    setLoading(true);
    try { const info = await request<BoardStatus>('/api/info'); const live = await request<BoardStatus>('/api/status'); setStatus({ ...live, ...info }); if (!quiet) setNotice({ kind: 'ok', text: `Connected to ESP32-CAM at ${normaliseHost(host)}.` }); return info; }
    catch (error: any) { if (!quiet) setNotice({ kind: 'error', text: error.name === 'AbortError' ? 'No response from the ESP32-CAM. Check power and network.' : error.message }); return null; }
    finally { setLoading(false); }
  };
  const discoverThroughHotspot = async () => {
    setLoading(true); setNotice({ kind: 'info', text: 'Looking for the ESP32-CAM setup hotspot…' });
    try {
      const response = await fetch(`http://${HOTSPOT_IP}/api/info`, { cache: 'no-store' }); if (!response.ok) throw new Error('ESP32-CAM hotspot did not respond.');
      const info = await response.json() as BoardStatus; const discovered = info.stationIp && info.stationIp !== '0.0.0.0' ? info.stationIp : HOTSPOT_IP;
      setHost(discovered); setStatus(info); await saveDevice(discovered);
      setNotice({ kind: 'ok', text: info.stationIp && info.stationIp !== '0.0.0.0' ? `IP received from ESP32-CAM: ${info.stationIp}. Rejoin your normal Wi‑Fi, then check connection.` : 'ESP32-CAM is in setup mode. Its hotspot address is 192.168.4.1.' });
    } catch (error: any) { setNotice({ kind: 'error', text: `${error.message} Join Wi‑Fi “SMARTMED” first, then try again.` }); } finally { setLoading(false); }
  };
  const sendControl = async (path: string, success: string) => { setLoading(true); try { await request(path); await checkBoard(true); setNotice({ kind: 'ok', text: success }); } catch (error: any) { setNotice({ kind: 'error', text: error.message }); } finally { setLoading(false); } };
  const capture = () => setLastPhoto(`${baseUrl}/capture?t=${Date.now()}`);

  return <div className="space-y-6">
    <section className="bg-white border border-zinc-100 rounded-xl p-5 shadow-sm"><h3 className="text-zinc-800 font-bold text-lg flex items-center gap-2"><Radio className="w-5 h-5 text-emerald-600" /> ESP32-CAM connection</h3><p className="mt-2 text-xs text-zinc-500 leading-relaxed">This screen connects directly to your board. It uses your actual wiring: GPIO 13 HIGH = dry, GPIO 14 LOW = pump on, and GPIO 4 = flash.</p>{device && <p className="mt-3 text-[11px] font-mono text-zinc-500">Device: {device.deviceId}</p>}</section>
    <section className="bg-emerald-50 border border-emerald-100 rounded-xl p-5 space-y-3"><div className="flex items-center gap-2 text-emerald-900 font-bold"><Wifi className="w-4 h-4" /> Get IP through ESP32-CAM hotspot</div><p className="text-xs text-emerald-900/75">1. Power the board. 2. Join Wi‑Fi <b>SMARTMED</b> (password <b>SMARTMED123</b>). 3. Tap the button. The app reads the board’s IP from <code>/api/info</code> and saves it.</p><button onClick={discoverThroughHotspot} disabled={loading} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-50"><RefreshCw className="w-3.5 h-3.5" /> Get IP from hotspot</button></section>
    <section className="bg-white border border-zinc-100 rounded-xl p-5 shadow-sm space-y-4"><div className="flex flex-col sm:flex-row gap-2"><input value={host} onChange={e => setHost(e.target.value)} placeholder="192.168.1.50" className="flex-1 rounded-lg border border-zinc-200 px-3 py-2 text-sm font-mono" /><button onClick={() => checkBoard()} disabled={loading} className="rounded-lg bg-zinc-900 px-3 py-2 text-xs font-bold text-white disabled:opacity-50">{loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Check connection'}</button><button onClick={async () => { try { await saveDevice(host); setNotice({ kind: 'ok', text: 'IP address saved.' }); } catch (e: any) { setNotice({ kind: 'error', text: e.message }); } }} className="rounded-lg border border-zinc-200 px-3 py-2 text-xs font-bold"><Save className="w-3.5 h-3.5 inline mr-1" /> Save</button></div>{notice && <div className={`rounded-lg px-3 py-2 text-xs ${notice.kind === 'error' ? 'bg-red-50 text-red-800' : notice.kind === 'ok' ? 'bg-emerald-50 text-emerald-800' : 'bg-blue-50 text-blue-800'}`}>{notice.text}</div>}{status ? <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center text-xs"><Stat label="Soil" value={status.soilStatus} icon={<Droplets className="w-4 h-4" />} /><Stat label="Pump" value={status.pump} icon={<Droplets className="w-4 h-4" />} /><Stat label="Mode" value={status.mode} icon={<CheckCircle2 className="w-4 h-4" />} /><Stat label="Wi‑Fi" value={status.wifiConnected ? (status.stationIp || 'Connected') : 'Setup AP'} icon={status.wifiConnected ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />} /></div> : <p className="text-xs text-zinc-400">No live board status yet.</p>}</section>
    <section className="grid grid-cols-1 lg:grid-cols-2 gap-6"><div className="bg-white border border-zinc-100 rounded-xl p-5 shadow-sm space-y-3"><h4 className="font-bold text-sm">Pump & light controls</h4><div className="grid grid-cols-2 gap-2"><button onClick={() => sendControl('/api/pump?state=on', 'Pump switched on; automatic mode is now paused.')} className="rounded-lg bg-blue-600 py-2 text-xs font-bold text-white">Pump ON</button><button onClick={() => sendControl('/api/pump?state=off', 'Pump switched off.')} className="rounded-lg bg-zinc-800 py-2 text-xs font-bold text-white">Pump OFF</button><button onClick={() => sendControl('/api/mode?value=auto', 'Automatic moisture control enabled.')} className="rounded-lg border border-emerald-200 bg-emerald-50 py-2 text-xs font-bold text-emerald-800">Enable AUTO</button><button onClick={() => sendControl(`/api/flash?state=${status?.flash === 'ON' ? 'off' : 'on'}`, 'Flash setting updated.')} className="rounded-lg border border-amber-200 bg-amber-50 py-2 text-xs font-bold text-amber-800"><Lightbulb className="w-3.5 h-3.5 inline mr-1" /> Flash</button></div></div><div className="bg-white border border-zinc-100 rounded-xl p-5 shadow-sm space-y-3"><div className="flex items-center justify-between"><h4 className="font-bold text-sm">Camera</h4><a href={`${baseUrl}/stream`} target="_blank" rel="noreferrer" className="text-xs font-bold text-emerald-700">Open live stream</a></div><div className="aspect-video bg-zinc-950 rounded-lg overflow-hidden flex items-center justify-center">{lastPhoto ? <img src={lastPhoto} className="w-full h-full object-cover" alt="ESP32-CAM capture" onError={() => setNotice({ kind: 'error', text: 'Could not capture an image from the camera.' })} /> : <Camera className="w-8 h-8 text-zinc-600" />}</div><button onClick={capture} className="w-full rounded-lg border border-zinc-200 py-2 text-xs font-bold"><Camera className="w-3.5 h-3.5 inline mr-1" /> Capture photo</button></div></section>
    {userHistory && (userHistory.readings.length > 0 || userHistory.logs.length > 0) && <p className="text-xs text-zinc-500">Cloud telemetry: {userHistory.readings.length} readings and {userHistory.logs.length} watering events recorded.</p>}
  </div>;
}
function Stat({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) { return <div className="rounded-lg bg-zinc-50 p-3"><div className="flex justify-center text-emerald-600">{icon}</div><div className="mt-1 text-[10px] uppercase text-zinc-400">{label}</div><div className="mt-1 font-mono font-bold text-zinc-800 truncate">{value}</div></div>; }
