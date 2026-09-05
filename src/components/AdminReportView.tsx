/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  FileText, 
  Settings, 
  Activity, 
  Cpu, 
  Calendar, 
  TrendingUp, 
  FileSpreadsheet, 
  CheckCircle,
  Printer,
  Download,
  Clock,
  Sprout
} from 'lucide-react';

interface AdminReportViewProps {
  token: string;
}

export default function AdminReportView({ token }: AdminReportViewProps) {
  const [reportType, setReportType] = useState<'cultivation' | 'iot' | 'summary'>('summary');
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/reports/generate', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error('Failed to generate report');
      const data = await res.json();
      setReportData(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchReport();
  }, [token]);

  if (loading) {
    return (
      <div className="bg-white border border-zinc-100 rounded-xl p-8 text-center">
        <Activity className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-3" />
        <p className="text-sm text-zinc-500 font-medium">Generating encrypted wellness and IoT reports...</p>
      </div>
    );
  }

  if (error || !reportData) {
    return (
      <div className="bg-white border border-zinc-100 rounded-xl p-8 text-center">
        <p className="text-red-500 text-sm mb-4">Error loading report: {error || 'No data'}</p>
        <button 
          onClick={fetchReport} 
          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold py-2 px-4 rounded transition-colors"
        >
          Retry Generation
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white border border-zinc-100 rounded-xl p-6 shadow-sm space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-zinc-100">
        <div>
          <h3 className="text-zinc-800 font-bold text-lg flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-600" /> Operational Report Center
          </h3>
          <p className="text-xs text-zinc-500">
            Manager Assignment: <strong className="text-zinc-700">{reportData.manager}</strong> | Generated: {new Date(reportData.generatedAt).toLocaleString()}
          </p>
        </div>

        <div className="flex gap-2">
          <button 
            onClick={() => window.print()}
            className="p-1.5 text-zinc-500 hover:text-zinc-800 border border-zinc-200 rounded-lg bg-white hover:bg-zinc-50 transition-colors cursor-pointer"
            title="Print Report"
          >
            <Printer className="w-4 h-4" />
          </button>
          <button 
            onClick={fetchReport}
            className="bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-semibold px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer"
          >
            Refresh Logs
          </button>
        </div>
      </div>

      {/* Select Report View */}
      <div className="flex bg-zinc-50 p-1 border border-zinc-100 rounded-lg gap-1">
        <button
          onClick={() => setReportType('summary')}
          className={`flex-1 text-xs py-2 rounded-md font-bold transition-all ${
            reportType === 'summary' ? 'bg-white text-emerald-800 shadow-sm' : 'text-zinc-500 hover:text-zinc-800'
          }`}
        >
          Comprehensive Summary
        </button>
        <button
          onClick={() => setReportType('cultivation')}
          className={`flex-1 text-xs py-2 rounded-md font-bold transition-all ${
            reportType === 'cultivation' ? 'bg-white text-emerald-800 shadow-sm' : 'text-zinc-500 hover:text-zinc-800'
          }`}
        >
          Cultivation Lifecycle Report
        </button>
        <button
          onClick={() => setReportType('iot')}
          className={`flex-1 text-xs py-2 rounded-md font-bold transition-all ${
            reportType === 'iot' ? 'bg-white text-emerald-800 shadow-sm' : 'text-zinc-500 hover:text-zinc-800'
          }`}
        >
          IoT Telemetry & Pump Logs
        </button>
      </div>

      {/* Report Summary */}
      {reportType === 'summary' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-zinc-50/50 p-4 border border-zinc-100 rounded-lg">
              <span className="text-[10px] uppercase text-zinc-400 font-bold tracking-wider">Device Online Health</span>
              <div className="text-xl font-bold text-zinc-800 mt-1">
                {reportData.iotStats.online} / {reportData.iotStats.monitoredDevices} Online
              </div>
              <p className="text-xs text-zinc-500 mt-1">
                {reportData.iotStats.offline} devices currently offline.
              </p>
            </div>

            <div className="bg-zinc-50/50 p-4 border border-zinc-100 rounded-lg">
              <span className="text-[10px] uppercase text-zinc-400 font-bold tracking-wider">Watering Events Recorded</span>
              <div className="text-xl font-bold text-zinc-800 mt-1">
                {reportData.iotStats.totalWateringEvents} Events
              </div>
              <p className="text-xs text-zinc-500 mt-1">
                Total pump runtime: {reportData.iotStats.totalPumpDurationSeconds}s.
              </p>
            </div>

            <div className="bg-zinc-50/50 p-4 border border-zinc-100 rounded-lg">
              <span className="text-[10px] uppercase text-zinc-400 font-bold tracking-wider">Yield Readiness</span>
              <div className="text-xl font-bold text-zinc-800 mt-1">
                {reportData.cultivationStats.readyToHarvest} Ready to Harvest
              </div>
              <p className="text-xs text-zinc-500 mt-1">
                {reportData.cultivationStats.active} cycles in growing state.
              </p>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">Popular Microgreens Distribution</h4>
            {reportData.microgreenDistribution.length === 0 ? (
              <p className="text-xs text-zinc-500 italic">No active microgreens mapped.</p>
            ) : (
              <div className="space-y-2">
                {reportData.microgreenDistribution.map((item: any, i: number) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="w-24 text-xs font-medium text-zinc-600 truncate">{item.name}</span>
                    <div className="flex-1 h-2 bg-zinc-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-emerald-500 rounded-full" 
                        style={{ width: `${(item.count / reportData.cultivationStats.totalAssigned) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-xs font-bold text-zinc-800 w-6 text-right">{item.count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Cultivation Report details */}
      {reportType === 'cultivation' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-zinc-800 font-bold text-sm">
            <Sprout className="w-4 h-4 text-emerald-600" /> Active Cultivation Lifecycle Insights
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-zinc-50 p-3 rounded-lg border border-zinc-100 text-center">
              <span className="text-[10px] text-zinc-400 font-bold">Total Assigned</span>
              <div className="text-lg font-bold text-zinc-800">{reportData.cultivationStats.totalAssigned}</div>
            </div>
            <div className="bg-zinc-50 p-3 rounded-lg border border-zinc-100 text-center">
              <span className="text-[10px] text-zinc-400 font-bold">Growing</span>
              <div className="text-lg font-bold text-emerald-700">{reportData.cultivationStats.active}</div>
            </div>
            <div className="bg-zinc-50 p-3 rounded-lg border border-zinc-100 text-center">
              <span className="text-[10px] text-zinc-400 font-bold">Ready</span>
              <div className="text-lg font-bold text-amber-700">{reportData.cultivationStats.readyToHarvest}</div>
            </div>
            <div className="bg-zinc-50 p-3 rounded-lg border border-zinc-100 text-center">
              <span className="text-[10px] text-zinc-400 font-bold">Completed</span>
              <div className="text-lg font-bold text-zinc-700">{reportData.cultivationStats.completed}</div>
            </div>
          </div>

          <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-lg text-xs leading-relaxed text-emerald-800">
            <strong>Dietary Compliance Note:</strong> Recheck that recommended species dosage parameters are strictly presented to users as dataset-based daily limit suggestions (e.g. 50g for adult females, 20g for children) in full accordance with medical safety boundaries.
          </div>
        </div>
      )}

      {/* IoT report details */}
      {reportType === 'iot' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-zinc-800 font-bold text-sm">
            <Cpu className="w-4 h-4 text-emerald-600" /> Smart Bucket Telemetry Health
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center text-xs pb-2 border-b border-zinc-100">
              <span className="text-zinc-500 font-medium">Monitored Smart Buckets</span>
              <span className="font-bold text-zinc-800">{reportData.iotStats.monitoredDevices} devices</span>
            </div>
            <div className="flex justify-between items-center text-xs pb-2 border-b border-zinc-100">
              <span className="text-zinc-500 font-medium">Device Connection Ratio</span>
              <span className="font-bold text-emerald-700">
                {Math.round((reportData.iotStats.online / reportData.iotStats.monitoredDevices) * 100 || 0)}% Online
              </span>
            </div>
            <div className="flex justify-between items-center text-xs pb-2 border-b border-zinc-100">
              <span className="text-zinc-500 font-medium">Active Warning States</span>
              <span className={`font-bold ${reportData.iotStats.warnings > 0 ? 'text-amber-600' : 'text-zinc-500'}`}>
                {reportData.iotStats.warnings} Warnings
              </span>
            </div>
            <div className="flex justify-between items-center text-xs pb-2 border-b border-zinc-100">
              <span className="text-zinc-500 font-medium">Soil Moisture Solenoid Activations</span>
              <span className="font-bold text-zinc-800">{reportData.iotStats.totalWateringEvents} cycles</span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
