/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Camera, 
  Clock, 
  Calendar, 
  Droplet, 
  Plus, 
  Image as ImageIcon, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Sparkles,
  Info,
  Check,
  Maximize2
} from 'lucide-react';
import { CultivationSnapshot } from '../types';

interface GrowthGalleryProps {
  cultivationId: string;
  token: string | null;
  activeMoisture: number;
  currentDay: number;
  usePhysicalCam?: boolean;
  streamUrl?: string;
  ipAddress?: string;
  cropName?: string;
}

export default function GrowthGallery({ 
  cultivationId, 
  token, 
  activeMoisture, 
  currentDay,
  usePhysicalCam,
  streamUrl,
  ipAddress,
  cropName = "Microgreens"
}: GrowthGalleryProps) {
  const [snapshots, setSnapshots] = useState<CultivationSnapshot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Time-lapse slider state
  const [timelineIndex, setTimelineIndex] = useState<number>(0);
  const [isTimeLapseMode, setIsTimeLapseMode] = useState(false);

  // Modal / Detailed viewer state
  const [selectedSnapshot, setSelectedSnapshot] = useState<CultivationSnapshot | null>(null);

  // Add snapshot form state
  const [isAddingSnapshot, setIsAddingSnapshot] = useState(false);
  const [newNotes, setNewNotes] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [selectedPresetImage, setSelectedPresetImage] = useState<string>('');
  const [newDayNumber, setNewDayNumber] = useState<number>(currentDay);
  const [newMoisture, setNewMoisture] = useState<number>(activeMoisture);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Preset growth progress images for simulation & presets
  const growthPresets = [
    { 
      dayRange: 'Day 1-2 (Germination/Sowing)', 
      url: 'https://images.unsplash.com/photo-1599599810769-bcde5a160d32?auto=format&fit=crop&q=80&w=600',
      label: 'Germination Stage'
    },
    { 
      dayRange: 'Day 3-4 (Blackout/Emerging)', 
      url: 'https://images.unsplash.com/photo-1515150144380-bca9f1650ed9?auto=format&fit=crop&q=80&w=600',
      label: 'Early Cotyledons'
    },
    { 
      dayRange: 'Day 5-7 (Vegetative Canopy)', 
      url: 'https://images.unsplash.com/photo-1530595467537-0b5996c41f2d?auto=format&fit=crop&q=80&w=600',
      label: 'Active Canopy'
    },
    { 
      dayRange: 'Day 8-10 (Leaf Expansion)', 
      url: 'https://images.unsplash.com/photo-1508500383102-13099939947e?auto=format&fit=crop&q=80&w=600',
      label: 'Secondary Leaves'
    },
    { 
      dayRange: 'Day 11+ (Ready to Harvest)', 
      url: 'https://images.unsplash.com/photo-1524179091875-bf99a9a6af57?auto=format&fit=crop&q=80&w=600',
      label: 'Peak Maturity'
    }
  ];

  const fetchSnapshots = async () => {
    if (!token || !cultivationId) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/snapshots/cultivation/${cultivationId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        // Sort chronologically by day number then timestamp
        const sorted = data.sort((a: CultivationSnapshot, b: CultivationSnapshot) => {
          if (a.dayNumber !== b.dayNumber) {
            return a.dayNumber - b.dayNumber;
          }
          return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
        });
        setSnapshots(sorted);
        if (sorted.length > 0) {
          setTimelineIndex(sorted.length - 1);
        }
      } else {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to load snapshots');
      }
    } catch (err: any) {
      setError(err.message || 'Error loading growth progression gallery');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSnapshots();
    // Pre-select preset based on current crop age
    if (currentDay <= 2) {
      setSelectedPresetImage(growthPresets[0].url);
    } else if (currentDay <= 4) {
      setSelectedPresetImage(growthPresets[1].url);
    } else if (currentDay <= 7) {
      setSelectedPresetImage(growthPresets[2].url);
    } else if (currentDay <= 10) {
      setSelectedPresetImage(growthPresets[3].url);
    } else {
      setSelectedPresetImage(growthPresets[4].url);
    }
    setNewDayNumber(currentDay);
    setNewMoisture(activeMoisture);
  }, [cultivationId, currentDay, activeMoisture]);

  const handleCreateSnapshot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setIsSubmitting(true);

    const imgToUse = newImageUrl.trim() || selectedPresetImage;

    try {
      const res = await fetch('/api/snapshots', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          cultivationId,
          imageUrl: imgToUse,
          notes: newNotes,
          soilMoistureAtCapture: newMoisture,
          dayNumber: newDayNumber
        })
      });

      if (res.ok) {
        setIsAddingSnapshot(false);
        setNewNotes('');
        setNewImageUrl('');
        await fetchSnapshots();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to capture snapshot');
      }
    } catch (err) {
      alert('Network error occurred while saving growth snapshot.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInstantCameraSnapshot = async () => {
    if (!token) return;
    setIsLoading(true);

    let imageUrlToSave = '';
    let description = '';

    if (usePhysicalCam && ipAddress) {
      // Direct ESP32-CAM snap URL
      imageUrlToSave = `http://${ipAddress}/capture?t=${Date.now()}`;
      description = `Direct snapshot captured live from physical ESP32-CAM module connected at ${ipAddress}.`;
    } else {
      // Simulated camera capture based on current day
      let stagePreset = growthPresets[0];
      if (currentDay > 2 && currentDay <= 4) stagePreset = growthPresets[1];
      else if (currentDay > 4 && currentDay <= 7) stagePreset = growthPresets[2];
      else if (currentDay > 7 && currentDay <= 10) stagePreset = growthPresets[3];
      else if (currentDay > 10) stagePreset = growthPresets[4];

      imageUrlToSave = stagePreset.url;
      description = `Simulated microgreen snapshot representing crop growth on Day ${currentDay} (${stagePreset.label}).`;
    }

    try {
      const res = await fetch('/api/snapshots', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          cultivationId,
          imageUrl: imageUrlToSave,
          notes: description,
          soilMoistureAtCapture: activeMoisture,
          dayNumber: currentDay
        })
      });

      if (res.ok) {
        await fetchSnapshots();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to capture automated snapshot');
      }
    } catch (err) {
      alert('Failed to connect to snapshot endpoint.');
    } finally {
      setIsLoading(false);
    }
  };

  const currentTimelineSnapshot = snapshots[timelineIndex];

  return (
    <div className="bg-white border border-zinc-100 rounded-xl p-5 shadow-sm space-y-6">
      {/* Header section with Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-zinc-100">
        <div>
          <h3 className="text-zinc-800 font-extrabold text-base flex items-center gap-1.5">
            <Camera className="w-5 h-5 text-emerald-600" /> Chronological Growth Gallery
          </h3>
          <p className="text-[11px] text-zinc-500 leading-relaxed">
            Visualize the vegetative development and canopy progress of your <strong>{cropName}</strong> over the active cultivation cycle.
          </p>
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={() => {
              setIsTimeLapseMode(!isTimeLapseMode);
              if (snapshots.length > 0) {
                setTimelineIndex(snapshots.length - 1);
              }
            }}
            disabled={snapshots.length < 2}
            className={`flex-1 sm:flex-initial text-xs font-bold px-3 py-2 rounded-lg border transition-all cursor-pointer ${
              isTimeLapseMode 
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                : 'bg-zinc-50 hover:bg-zinc-100 text-zinc-700 border-zinc-200 disabled:opacity-40'
            }`}
          >
            <Clock className="w-3.5 h-3.5 inline mr-1.5" />
            {isTimeLapseMode ? 'Exit Time-lapse' : 'Time-lapse Slider'}
          </button>

          <button
            onClick={handleInstantCameraSnapshot}
            disabled={isLoading}
            className="flex-1 sm:flex-initial bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
          >
            <Camera className="w-4 h-4" />
            {usePhysicalCam ? 'Capture CAM' : 'Simulate Capture'}
          </button>

          <button
            onClick={() => setIsAddingSnapshot(true)}
            className="bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-bold px-3 py-2 rounded-lg flex items-center justify-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Log Custom
          </button>
        </div>
      </div>

      {isLoading && snapshots.length === 0 ? (
        <div className="py-12 text-center text-xs text-zinc-400 italic">
          Fetching chronological snapshot database...
        </div>
      ) : error ? (
        <div className="p-4 bg-red-50 border border-red-100 text-red-800 rounded-lg text-xs font-medium">
          {error}
        </div>
      ) : snapshots.length === 0 ? (
        <div className="p-8 bg-zinc-50 border border-zinc-100/85 rounded-xl text-center space-y-3">
          <ImageIcon className="w-8 h-8 text-zinc-400 mx-auto" />
          <p className="text-xs text-zinc-500 font-bold">No snapshots on record yet</p>
          <p className="text-[10px] text-zinc-400 max-w-xs mx-auto leading-relaxed">
            Start logging crop growth! Click <strong>"Simulate Capture"</strong> above to record the initial sowing or germinating stage, or configure your physical ESP32-CAM to stream direct feeds.
          </p>
        </div>
      ) : isTimeLapseMode && currentTimelineSnapshot ? (
        /* TIME-LAPSE ACTIVE VIEW */
        <div className="space-y-4">
          <div className="relative bg-zinc-950 aspect-video max-w-2xl mx-auto rounded-xl overflow-hidden border border-zinc-900 group shadow-md">
            <img 
              src={currentTimelineSnapshot.imageUrl} 
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover transition-all duration-300"
              alt={`Crop progress day ${currentTimelineSnapshot.dayNumber}`}
            />

            {/* Overlays */}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-4 flex flex-col justify-end text-white">
              <span className="font-mono text-[10px] uppercase tracking-wider text-emerald-400 font-bold block mb-1">
                TIME-LAPSE COMPARISON MODE
              </span>
              <h4 className="font-extrabold text-base">Day {currentTimelineSnapshot.dayNumber} Progress</h4>
              {currentTimelineSnapshot.notes && (
                <p className="text-[11px] text-zinc-300 mt-1 max-w-xl truncate">{currentTimelineSnapshot.notes}</p>
              )}
            </div>

            <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded-md text-[10px] font-mono text-zinc-300 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-emerald-400" /> 
              {new Date(currentTimelineSnapshot.timestamp).toLocaleDateString()} at {new Date(currentTimelineSnapshot.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
            </div>

            <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded-md text-[10px] font-mono text-zinc-300 flex items-center gap-1">
              <Droplet className="w-3.5 h-3.5 text-blue-400" />
              Soil Moisture: {currentTimelineSnapshot.soilMoistureAtCapture}%
            </div>

            {/* Nav Arrows inside viewer */}
            <button 
              onClick={() => setTimelineIndex(prev => Math.max(0, prev - 1))}
              disabled={timelineIndex === 0}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 disabled:opacity-30 p-1.5 rounded-full text-white cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setTimelineIndex(prev => Math.min(snapshots.length - 1, prev + 1))}
              disabled={timelineIndex === snapshots.length - 1}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 disabled:opacity-30 p-1.5 rounded-full text-white cursor-pointer"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Range Slider for Growth Scrubbing */}
          <div className="max-w-2xl mx-auto space-y-2 px-1">
            <div className="flex justify-between items-center text-xs font-semibold text-zinc-500">
              <span>Day 1 (Sowing)</span>
              <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">Scrubbing: Day {currentTimelineSnapshot.dayNumber} Snapshot</span>
              <span>Latest (Day {snapshots[snapshots.length - 1].dayNumber})</span>
            </div>
            <input 
              type="range"
              min="0"
              max={snapshots.length - 1}
              value={timelineIndex}
              onChange={(e) => setTimelineIndex(parseInt(e.target.value))}
              className="w-full accent-emerald-600 h-2 bg-zinc-100 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-zinc-400 font-mono mt-1">
              {snapshots.map((s, index) => (
                <button 
                  key={s.id}
                  onClick={() => setTimelineIndex(index)}
                  className={`px-1.5 py-0.5 rounded ${timelineIndex === index ? 'bg-emerald-600 text-white font-bold' : 'hover:bg-zinc-100'}`}
                >
                  D{s.dayNumber}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* GRID GALLERY VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {snapshots.map((snap) => (
            <div 
              key={snap.id}
              className="group bg-zinc-50 hover:bg-white border border-zinc-150 hover:border-emerald-300 rounded-xl overflow-hidden shadow-sm transition-all duration-200 flex flex-col justify-between"
            >
              {/* Photo top */}
              <div className="relative aspect-video overflow-hidden bg-zinc-200">
                <img 
                  src={snap.imageUrl} 
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  alt={`Day ${snap.dayNumber}`}
                />
                
                {/* Float tag for day */}
                <div className="absolute top-2 left-2 bg-emerald-600 text-white font-mono font-black text-[10px] px-2 py-0.5 rounded shadow-sm">
                  DAY {snap.dayNumber}
                </div>

                {/* Quick inspect overlay button */}
                <button
                  onClick={() => setSelectedSnapshot(snap)}
                  className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity cursor-pointer"
                >
                  <Maximize2 className="w-5 h-5 drop-shadow-md" />
                </button>
              </div>

              {/* Specs & Logs bottom */}
              <div className="p-3.5 space-y-2 flex-1 flex flex-col justify-between">
                <p className="text-[11px] text-zinc-600 leading-normal line-clamp-2 italic">
                  "{snap.notes || 'No log details added.'}"
                </p>

                <div className="border-t border-zinc-100/80 pt-2 flex items-center justify-between text-[10px] text-zinc-400 font-mono">
                  <span className="flex items-center gap-1">
                    <Droplet className="w-3 h-3 text-blue-500" />
                    Moisture: <strong className="text-zinc-600">{snap.soilMoistureAtCapture || activeMoisture}%</strong>
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-zinc-400" />
                    {new Date(snap.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* POPUP: ADD CUSTOM SNAPSHOT LOG ENTRY */}
      {isAddingSnapshot && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4 border border-zinc-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center border-b border-zinc-100 pb-3">
              <h4 className="font-extrabold text-zinc-800 text-sm flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-emerald-600" /> Log Custom Growth Snapshot
              </h4>
              <button 
                onClick={() => setIsAddingSnapshot(false)} 
                className="text-zinc-400 hover:text-zinc-700 p-1 rounded-full cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSnapshot} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-500 font-bold uppercase tracking-wider text-[10px] mb-1">Crop Day Number</label>
                  <input 
                    type="number"
                    min="1"
                    max="30"
                    value={newDayNumber}
                    onChange={(e) => setNewDayNumber(parseInt(e.target.value) || 1)}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-xs font-semibold focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-zinc-500 font-bold uppercase tracking-wider text-[10px] mb-1">Soil Moisture at Log (%)</label>
                  <input 
                    type="number"
                    min="0"
                    max="100"
                    value={newMoisture}
                    onChange={(e) => setNewMoisture(parseInt(e.target.value) || 0)}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-xs font-semibold focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
              </div>

              {/* Presets vs Manual URL Selection */}
              <div>
                <label className="block text-zinc-500 font-bold uppercase tracking-wider text-[10px] mb-1.5">Select growth stage preset photo</label>
                <div className="grid grid-cols-5 gap-1.5 mb-2">
                  {growthPresets.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setSelectedPresetImage(preset.url);
                        setNewImageUrl(''); // clear custom
                      }}
                      className={`relative aspect-square rounded-lg overflow-hidden border-2 cursor-pointer transition-all ${
                        selectedPresetImage === preset.url && !newImageUrl 
                          ? 'border-emerald-600 ring-2 ring-emerald-500/20' 
                          : 'border-zinc-200 hover:border-zinc-300'
                      }`}
                    >
                      <img src={preset.url} alt={preset.label} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/35 flex items-end p-0.5 text-[8px] font-bold text-white text-center leading-tight">
                        <span className="w-full truncate">{preset.label.split(' ')[0]}</span>
                      </div>
                      {selectedPresetImage === preset.url && !newImageUrl && (
                        <div className="absolute top-1 right-1 bg-emerald-600 rounded-full p-0.5 text-white">
                          <Check className="w-2.5 h-2.5" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>

                <div className="text-center text-zinc-400 font-medium my-2">-- OR --</div>

                <div>
                  <label className="block text-zinc-500 font-bold uppercase tracking-wider text-[10px] mb-1">Custom Snapshot Image URL</label>
                  <input 
                    type="url"
                    placeholder="e.g., https://images.unsplash.com/your-custom-image"
                    value={newImageUrl}
                    onChange={(e) => {
                      setNewImageUrl(e.target.value);
                      setSelectedPresetImage('');
                    }}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-xs font-semibold focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-500 font-bold uppercase tracking-wider text-[10px] mb-1">Observation / Growth Log Notes</label>
                <textarea 
                  rows={3}
                  placeholder="Describe vegetative vigor, root development, leaf color, health anomalies, or general remarks..."
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-xs font-semibold focus:outline-none focus:border-emerald-500"
                ></textarea>
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button 
                  type="button"
                  onClick={() => setIsAddingSnapshot(false)}
                  className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  {isSubmitting ? 'Saving...' : 'Add Log Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* POPUP MODAL: DETAILED SNAPSHOT VIEWER */}
      {selectedSnapshot && (
        <div className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl border border-zinc-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="relative aspect-video bg-black">
              <img 
                src={selectedSnapshot.imageUrl} 
                referrerPolicy="no-referrer"
                className="w-full h-full object-contain" 
                alt={`Day ${selectedSnapshot.dayNumber}`}
              />
              <button 
                onClick={() => setSelectedSnapshot(null)}
                className="absolute top-3 right-3 bg-black/60 hover:bg-black/85 p-1.5 rounded-full text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="flex justify-between items-start border-b border-zinc-100 pb-3">
                <div>
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full font-mono uppercase">
                    Day {selectedSnapshot.dayNumber} Snapshot
                  </span>
                  <h4 className="font-extrabold text-zinc-900 text-sm mt-1 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-zinc-400" /> 
                    Recorded on {new Date(selectedSnapshot.timestamp).toLocaleDateString(undefined, {weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'})}
                  </h4>
                </div>

                <div className="text-right text-xs">
                  <span className="text-zinc-400 font-medium block uppercase text-[9px] font-mono">SOIL MOISTURE AT CAPTURE</span>
                  <span className="text-sm font-extrabold text-blue-600 flex items-center justify-end gap-0.5">
                    <Droplet className="w-4 h-4" /> {selectedSnapshot.soilMoistureAtCapture || activeMoisture}%
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="block text-zinc-400 uppercase tracking-wider text-[9px] font-bold">Observation Log Notes</span>
                <p className="text-xs text-zinc-700 leading-relaxed bg-zinc-50 p-3.5 rounded-xl border border-zinc-100 italic">
                  "{selectedSnapshot.notes || 'No observation notes logged for this snapshot.'}"
                </p>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  onClick={() => setSelectedSnapshot(null)}
                  className="bg-zinc-800 hover:bg-zinc-950 text-white text-xs font-bold px-4 py-2 rounded-lg cursor-pointer"
                >
                  Close Viewer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
