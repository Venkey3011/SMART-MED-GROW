/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Microgreen } from '../types';
import { 
  ShieldCheck, 
  AlertTriangle, 
  Info, 
  Search, 
  HelpCircle, 
  Sprout, 
  FileText, 
  Flame, 
  Sparkles,
  Award
} from 'lucide-react';

interface GrowingGuideProps {
  microgreens: Microgreen[];
}

export default function GrowingGuide({ microgreens }: GrowingGuideProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('All');

  const filteredMicrogreens = microgreens.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          m.growingNotes.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDifficulty = selectedDifficulty === 'All' || m.difficulty === selectedDifficulty;
    return matchesSearch && matchesDifficulty;
  });

  return (
    <div className="space-y-8 font-sans">
      
      {/* Food Safety & Guidelines Panel (Page 25 - Required) */}
      <div className="bg-amber-50/70 border border-amber-200/60 rounded-xl p-6 shadow-sm">
        <h3 className="text-amber-800 font-bold text-lg flex items-center gap-2 mb-4">
          <ShieldCheck className="w-5 h-5 text-amber-700" /> Crucial Cultivation & Food Safety Information
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-sm text-zinc-700">
          
          <div className="bg-white/80 p-4 rounded-lg border border-amber-100">
            <h4 className="font-bold text-amber-900 flex items-center gap-1.5 mb-1.5">
              <Award className="w-4 h-4 text-amber-700" /> Certified Sprouting Seeds Only
            </h4>
            <p className="text-xs leading-relaxed text-zinc-600">
              SmartMedGrow strongly recommends using seed specifically labelled for sprouting or microgreens. This is especially vital for individuals experiencing pregnancy, anemia, or preparing meals for young children, to ensure minimal pathogenetic risks.
            </p>
          </div>

          <div className="bg-white/80 p-4 rounded-lg border border-amber-100">
            <h4 className="font-bold text-amber-900 flex items-center gap-1.5 mb-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-600" /> Contamination Mitigation
            </h4>
            <p className="text-xs leading-relaxed text-zinc-600">
              Warning: High humidity growing trays are prone to microbial and bacterial contamination. Ensure thorough sanitization of all growing trays, maintain correct soil moisture thresholds, and bottom-water where appropriate rather than spraying the canopy in hot, humid weather.
            </p>
          </div>

          <div className="bg-white/80 p-4 rounded-lg border border-amber-100">
            <h4 className="font-bold text-amber-900 flex items-center gap-1.5 mb-1.5">
              <Flame className="w-4 h-4 text-amber-600" /> Prohibited Seedlings List
            </h4>
            <p className="text-xs leading-relaxed text-zinc-600">
              <span className="font-semibold text-red-700">STRICTLY PROHIBITED:</span> Seedlings of <span className="font-semibold">tomato, potato, chilli, eggplant, and brinjal</span> must never be used as microgreens. They contain toxic alkaloids. Buckwheat is also excluded from the permitted microgreen dataset.
            </p>
          </div>

        </div>

        <div className="mt-4 p-3 bg-white/50 border border-amber-100 rounded-lg text-xs flex gap-2 items-start">
          <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <p className="text-zinc-600 leading-relaxed">
            <span className="font-semibold text-zinc-800">Dietary Planning Disclaimer:</span> Microgreens should be integrated as fresh dietary supplements. SmartMedGrow recommendations are based on dataset specifications and do not constitute direct medical prescriptions or guaranteed disease-curing claims.
          </p>
        </div>
      </div>

      {/* Catalog Search & Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white border border-zinc-100 p-4 rounded-xl shadow-sm">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search microgreens by name or notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-4 py-2 w-full bg-zinc-50 border border-zinc-200 rounded-lg text-sm text-zinc-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
          />
        </div>

        <div className="flex gap-2 w-full md:w-auto overflow-x-auto">
          {['All', 'Easiest', 'Easy', 'One quirk'].map(difficulty => (
            <button
              key={difficulty}
              onClick={() => setSelectedDifficulty(difficulty)}
              className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-all cursor-pointer ${
                selectedDifficulty === difficulty 
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800 shadow-sm'
                  : 'bg-white border-zinc-200 text-zinc-600 hover:text-zinc-900'
              }`}
            >
              {difficulty === 'All' ? 'All Difficulties' : difficulty}
            </button>
          ))}
        </div>
      </div>

      {/* Microgreen Catalog Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMicrogreens.length === 0 ? (
          <div className="col-span-full py-12 text-center text-zinc-400">
            <Sprout className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
            <p className="text-sm">No microgreens matched your filters</p>
          </div>
        ) : (
          filteredMicrogreens.map(mg => (
            <div 
              key={mg.id} 
              className="bg-white border border-zinc-100 rounded-xl overflow-hidden hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div className="p-5 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-zinc-800 text-lg flex items-center gap-1.5">
                      <Sprout className="w-5 h-5 text-emerald-600" /> {mg.name}
                    </h3>
                    <span className={`inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full font-bold tracking-wider uppercase ${
                      mg.difficulty === 'Easiest' ? 'bg-emerald-100 text-emerald-800' :
                      mg.difficulty === 'Easy' ? 'bg-blue-100 text-blue-800' :
                      'bg-amber-100 text-amber-800'
                    }`}>
                      {mg.difficulty === 'One quirk' ? 'Specific Handling' : mg.difficulty}
                    </span>
                  </div>

                  <div className="text-right">
                    <div className="text-xs text-zinc-400 font-medium">Harvest in</div>
                    <div className="text-lg font-bold text-emerald-700">{mg.daysToHarvest} days</div>
                  </div>
                </div>

                <div className="space-y-2 border-y border-zinc-50 py-3 text-xs text-zinc-600">
                  <div className="flex justify-between">
                    <span className="font-medium text-zinc-400">Recommended Seed:</span>
                    <span className="text-zinc-800 font-medium text-right">{mg.seedQuantityPerTray}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-zinc-400">Soaking:</span>
                    <span className="text-zinc-800 font-medium">{mg.soakRequired ? `Required (${mg.soakDuration})` : 'None required'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-zinc-400">Expected Yield:</span>
                    <span className="text-zinc-800 font-medium">{mg.freshYield}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Nutritional Strengths</h4>
                    <div className="flex flex-wrap gap-1.5">
                      <span className="bg-zinc-50 border border-zinc-100 px-2 py-1 rounded text-[10px] text-zinc-600">
                        Vitamin C: <strong className="text-zinc-800">{mg.vitaminCLevel}</strong>
                      </span>
                      <span className="bg-zinc-50 border border-zinc-100 px-2 py-1 rounded text-[10px] text-zinc-600">
                        Nitrates: <strong className="text-zinc-800">{mg.nitrateValue}</strong>
                      </span>
                      <span className="bg-zinc-50 border border-zinc-100 px-2 py-1 rounded text-[10px] text-zinc-600">
                        Iron: <strong className="text-zinc-800">{mg.ironMgPer100g} mg/100g</strong>
                      </span>
                      <span className="bg-zinc-50 border border-zinc-100 px-2 py-1 rounded text-[10px] text-zinc-600">
                        Zinc: <strong className="text-zinc-800">{mg.zincMgPer100g} mg/100g</strong>
                      </span>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Growing Guidance</h4>
                    <p className="text-xs text-zinc-600 leading-relaxed bg-zinc-50 border border-zinc-100/50 p-2.5 rounded-lg italic">
                      "{mg.growingNotes}"
                    </p>
                  </div>
                </div>
              </div>

              {mg.preparationNotes && (
                <div className="bg-zinc-50/50 p-4 border-t border-zinc-100 text-xs">
                  <span className="font-bold text-zinc-500 uppercase tracking-wider text-[10px] block mb-1">Preparation & Eating</span>
                  <p className="text-zinc-600 leading-relaxed">{mg.preparationNotes}</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
