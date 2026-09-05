/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Cpu, Droplet, Play, Power, AlertTriangle, Terminal, Info } from 'lucide-react';

interface IoTBucketSimulatorProps {
  deviceId: string;
  authToken: string;
  deviceName: string;
  currentMoisture: number;
  pumpStatus: 'ON' | 'OFF';
  onReadingSent?: () => void;
}

export default function IoTBucketSimulator({
  deviceId,
  authToken,
  deviceName,
  currentMoisture,
  pumpStatus,
  onReadingSent
}: IoTBucketSimulatorProps) {
  const [moisture, setMoisture] = useState<number>(currentMoisture || 55);
  const [isPumpActive, setIsPumpActive] = useState<boolean>(pumpStatus === 'ON');
  const [isAutoSim, setIsAutoSim] = useState<boolean>(true);
  const [logs, setLogs] = useState<string[]>([]);
  const [lastResponse, setLastResponse] = useState<any>(null);
  const [isSending, setIsSending] = useState<boolean>(false);

  // Sync with prop values if they change externally
  useEffect(() => {
    if (!isPumpActive && pumpStatus === 'ON') {
      addLog(`[Hardware] ESP32-CAM Relay closed: Water Pump turned ON`);
    } else if (isAutoSim && isPumpActive && pumpStatus === 'OFF') {
      addLog(`[Hardware] ESP32-CAM Relay opened: Water Pump turned OFF`);
    }
    setIsPumpActive(pumpStatus === 'ON');
  }, [pumpStatus]);

  useEffect(() => {
    setMoisture(currentMoisture);
  }, [currentMoisture]);

  // Log message helper
  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString();
    setLogs(prev => [`[${time}] ${msg}`, ...prev.slice(0, 24)]);
  };

  // Simulation loop: Soil moisture gradually decreases unless pump is ON
  useEffect(() => {
    if (!isAutoSim) return;

    const interval = setInterval(() => {
      setMoisture(prev => {
        let next = prev;
        if (isPumpActive) {
          // Pump is ON, moisture goes up rapidly
          next = Math.min(100, prev + 8);
          addLog(`[Watering] DC Pump supplying water... Moisture rising (+8%)`);
        } else {
          // Pump is OFF, moisture slowly decreases
          next = Math.max(10, prev - 1);
          if (next % 5 === 0) {
            addLog(`[Soil] Evapotranspiration occurring... Moisture slowly decreasing`);
          }
        }
        return next;
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [isPumpActive, isAutoSim]);

  // Trigger immediate sensor post to backend
  const sendSensorReading = async (val: number) => {
    setIsSending(true);
    addLog(`[Network] POST /api/iot/sensor-reading (moisture: ${val}%)`);
    try {
      const res = await fetch('/api/iot/sensor-reading', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId,
          moistureValue: val,
          token: authToken
        })
      });

      if (!res.ok) {
        throw new Error(`HTTP Error ${res.status}`);
      }

      const data = await res.json();
      setLastResponse(data);
      setIsSending(false);

      if (data.pumpStatus === 'ON' && !isPumpActive) {
        setIsPumpActive(true);
        addLog(`[Server Command] Trigger Pump: ON (Duration: ${data.moistureThresholds?.pumpDuration || 10}s)`);
      } else if (data.pumpStatus === 'OFF' && isPumpActive) {
        setIsPumpActive(false);
        addLog(`[Server Command] Trigger Pump: OFF (Target reached)`);
      }

      addLog(`[Network] Response Success: Pump status is ${data.pumpStatus}`);
      if (onReadingSent) onReadingSent();
    } catch (err: any) {
      setIsSending(false);
      addLog(`[Network] Error: ${err.message}`);
    }
  };

  // Post reading automatically when moisture changes
  useEffect(() => {
    const delay = setTimeout(() => {
      sendSensorReading(moisture);
    }, 800); // Debounce sending to backend
    return () => clearTimeout(delay);
  }, [moisture]);

  return (
    <div id="iot-simulator" className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 text-zinc-100 font-sans shadow-2xl relative overflow-hidden">
      {/* Glow highlight */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-2xl pointer-events-none"></div>

      <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <div className="bg-emerald-500/20 text-emerald-400 p-1.5 rounded-lg">
            <Cpu className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="font-bold text-sm tracking-wide text-zinc-200">ESP32-CAM IoT SIMULATOR</h3>
            <p className="text-xs text-zinc-400 font-mono">{deviceId} ({deviceName})</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-mono text-emerald-400 font-medium">ONLINE</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Hardware Controls */}
        <div className="bg-zinc-950 rounded-lg p-4 border border-zinc-800 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                <Droplet className="w-3.5 h-3.5 text-blue-400" /> Soil Moisture Sensor
              </span>
              <span className="font-mono text-xl text-blue-400 font-bold">{moisture}%</span>
            </div>
            
            <input 
              type="range" 
              min="0" 
              max="100" 
              value={moisture}
              onChange={(e) => setMoisture(Number(e.target.value))}
              className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500 mb-3"
            />

            <div className="flex gap-2 mb-3">
              <button 
                onClick={() => setMoisture(15)} 
                className="flex-1 bg-red-950/40 hover:bg-red-950/70 border border-red-900/50 text-red-400 text-xs py-1 px-2 rounded transition-colors font-mono"
              >
                Dry (15%)
              </button>
              <button 
                onClick={() => setMoisture(45)} 
                className="flex-1 bg-blue-950/40 hover:bg-blue-950/70 border border-blue-900/50 text-blue-400 text-xs py-1 px-2 rounded transition-colors font-mono"
              >
                Medium (45%)
              </button>
              <button 
                onClick={() => setMoisture(75)} 
                className="flex-1 bg-emerald-950/40 hover:bg-emerald-950/70 border border-emerald-900/50 text-emerald-400 text-xs py-1 px-2 rounded transition-colors font-mono"
              >
                Wet (75%)
              </button>
            </div>
          </div>

          <div className="pt-3 border-t border-zinc-900 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`p-2 rounded-full ${isPumpActive ? 'bg-blue-500/20 text-blue-400 animate-bounce' : 'bg-zinc-800 text-zinc-500'}`}>
                <Power className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[10px] text-zinc-400 font-bold uppercase">DC Water Pump</div>
                <div className={`text-xs font-mono font-bold ${isPumpActive ? 'text-blue-400' : 'text-zinc-500'}`}>
                  {isPumpActive ? 'ON (WATERING)' : 'OFF'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <label className="text-xs text-zinc-400 cursor-pointer" htmlFor="auto-sim-toggle">Auto Simulation</label>
              <input 
                id="auto-sim-toggle"
                type="checkbox" 
                checked={isAutoSim}
                onChange={(e) => {
                  setIsAutoSim(e.target.checked);
                  addLog(`[System] Auto evaporation simulation ${e.target.checked ? 'ENABLED' : 'DISABLED'}`);
                }}
                className="w-3.5 h-3.5 rounded bg-zinc-800 border-zinc-700 accent-emerald-500 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Console logs */}
        <div className="bg-zinc-950 rounded-lg p-3 border border-zinc-800 font-mono text-[11px] flex flex-col h-48">
          <div className="flex items-center justify-between pb-1.5 border-b border-zinc-900 mb-2">
            <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 flex items-center gap-1">
              <Terminal className="w-3 h-3 text-emerald-400" /> Device UART Log
            </span>
            <button 
              onClick={() => setLogs([])}
              className="text-[10px] text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              Clear
            </button>
          </div>
          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin scrollbar-thumb-zinc-800">
            {logs.length === 0 ? (
              <div className="text-zinc-600 italic text-center pt-8">No device log events... Move the slider to post readings.</div>
            ) : (
              logs.map((log, index) => (
                <div 
                  key={index} 
                  className={`leading-relaxed break-all ${
                    log.includes('[Network]') ? 'text-zinc-400' :
                    log.includes('[Server') ? 'text-amber-400 font-semibold' :
                    log.includes('[Watering]') ? 'text-blue-400' :
                    log.includes('[Hardware]') ? 'text-purple-400' : 'text-zinc-500'
                  }`}
                >
                  {log}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Threshold / Config helper */}
      {lastResponse?.moistureThresholds && (
        <div className="mt-3 bg-zinc-950/50 p-2.5 rounded-lg border border-zinc-800/40 text-xs font-mono text-zinc-400 flex items-start gap-2">
          <Info className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
          <div>
            <span className="text-emerald-400 font-bold">Active Threshold Rules:</span> Min {lastResponse.moistureThresholds.min}% | Target {lastResponse.moistureThresholds.target}% | Max {lastResponse.moistureThresholds.max}% | Pump Run: {lastResponse.moistureThresholds.pumpDuration}s
          </div>
        </div>
      )}
    </div>
  );
}
