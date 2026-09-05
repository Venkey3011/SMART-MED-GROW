/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ReferenceLine 
} from 'recharts';
import { SensorReading, Microgreen } from '../types';
import { Calendar, Filter, Droplet } from 'lucide-react';

interface SoilMoistureChartProps {
  readings: SensorReading[];
  microgreen: Microgreen | null;
}

export default function SoilMoistureChart({ readings, microgreen }: SoilMoistureChartProps) {
  const [filterRange, setFilterRange] = useState<'today' | '24h' | '7d' | 'full'>('24h');

  // Filter readings based on selection
  const getFilteredData = () => {
    if (!readings || readings.length === 0) return [];
    
    const now = new Date();
    const sorted = [...readings].sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime());

    let cutoffTime = new Date();
    if (filterRange === 'today') {
      cutoffTime.setHours(0, 0, 0, 0); // start of today
    } else if (filterRange === '24h') {
      cutoffTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    } else if (filterRange === '7d') {
      cutoffTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else {
      return sorted; // return all for full cultivation
    }

    return sorted.filter(r => new Date(r.recordedAt).getTime() >= cutoffTime.getTime());
  };

  const filteredData = getFilteredData();

  // Map data to simpler chart representation
  const chartData = filteredData.map(r => {
    const d = new Date(r.recordedAt);
    return {
      time: filterRange === '7d' || filterRange === 'full' 
        ? `${d.getMonth() + 1}/${d.getDate()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
        : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      'Moisture (%)': r.moistureValue,
      rawTime: d.getTime()
    };
  });

  return (
    <div className="bg-white border border-zinc-100 rounded-xl p-5 shadow-sm">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h3 className="text-zinc-800 font-bold text-lg flex items-center gap-2">
            <Droplet className="w-5 h-5 text-emerald-600" /> Soil Moisture vs Time
          </h3>
          <p className="text-xs text-zinc-500">Real-time and historic sensor readings</p>
        </div>

        {/* Time filters */}
        <div className="flex bg-zinc-50 border border-zinc-100 p-1 rounded-lg gap-1 w-full sm:w-auto">
          <button
            onClick={() => setFilterRange('today')}
            className={`flex-1 sm:flex-initial text-xs px-3 py-1.5 rounded-md font-medium transition-all ${
              filterRange === 'today' ? 'bg-white text-emerald-800 shadow-sm' : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            Today
          </button>
          <button
            onClick={() => setFilterRange('24h')}
            className={`flex-1 sm:flex-initial text-xs px-3 py-1.5 rounded-md font-medium transition-all ${
              filterRange === '24h' ? 'bg-white text-emerald-800 shadow-sm' : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            Last 24h
          </button>
          <button
            onClick={() => setFilterRange('7d')}
            className={`flex-1 sm:flex-initial text-xs px-3 py-1.5 rounded-md font-medium transition-all ${
              filterRange === '7d' ? 'bg-white text-emerald-800 shadow-sm' : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            7 Days
          </button>
          <button
            onClick={() => setFilterRange('full')}
            className={`flex-1 sm:flex-initial text-xs px-3 py-1.5 rounded-md font-medium transition-all ${
              filterRange === 'full' ? 'bg-white text-emerald-800 shadow-sm' : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            Full Cycle
          </button>
        </div>
      </div>

      <div className="h-72 w-full">
        {chartData.length === 0 ? (
          <div className="h-full flex flex-col justify-center items-center text-zinc-400 font-sans border-2 border-dashed border-zinc-100 rounded-lg">
            <Droplet className="w-8 h-8 text-zinc-300 animate-pulse mb-2" />
            <span className="text-sm">No soil moisture readings in this range</span>
            <span className="text-[10px] text-zinc-500">Wait for your smart bucket to report data or simulate moisture changes</span>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
              <XAxis 
                dataKey="time" 
                tick={{ fontSize: 10, fill: '#71717a' }}
                stroke="#e4e4e7" 
              />
              <YAxis 
                domain={[0, 100]} 
                tick={{ fontSize: 10, fill: '#71717a' }}
                stroke="#e4e4e7"
              />
              <Tooltip
                contentStyle={{ 
                  backgroundColor: '#ffffff', 
                  borderColor: '#f4f4f5',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)',
                  fontSize: '12px',
                  fontFamily: 'sans-serif'
                }}
                labelStyle={{ fontWeight: 'bold', color: '#18181b' }}
              />
              <Legend 
                wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
              />

              {/* Reference lines for configured thresholds */}
              {microgreen && (
                <ReferenceLine 
                  y={microgreen.minimumMoistureThreshold} 
                  stroke="#ef4444" 
                  strokeDasharray="4 4"
                  label={{ 
                    value: `Min: ${microgreen.minimumMoistureThreshold}%`, 
                    position: 'insideBottomRight',
                    fill: '#ef4444', 
                    fontSize: 10 
                  }} 
                />
              )}
              {microgreen && (
                <ReferenceLine 
                  y={microgreen.targetMoisture} 
                  stroke="#10b981" 
                  strokeDasharray="4 4"
                  label={{ 
                    value: `Target: ${microgreen.targetMoisture}%`, 
                    position: 'insideTopRight',
                    fill: '#10b981', 
                    fontSize: 10 
                  }} 
                />
              )}
              {microgreen && (
                <ReferenceLine 
                  y={microgreen.maximumMoisture} 
                  stroke="#3b82f6" 
                  strokeDasharray="4 4"
                  label={{ 
                    value: `Max: ${microgreen.maximumMoisture}%`, 
                    position: 'insideTopRight',
                    fill: '#3b82f6', 
                    fontSize: 10 
                  }} 
                />
              )}

              <Line 
                type="monotone" 
                dataKey="Moisture (%)" 
                stroke="#059669" 
                strokeWidth={2.5}
                activeDot={{ r: 6 }} 
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
