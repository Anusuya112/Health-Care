import React, { useState } from 'react';
import {
  AlertTriangle,
  BatteryCharging,
  CheckCircle2,
  Code,
  Cpu,
  Radio,
  RefreshCw,
  Send,
  ShieldAlert,
  Wifi,
  X,
} from 'lucide-react';
import { useHospital } from '../../context/HospitalContext.tsx';
import { AssistanceCategory } from '../../types.ts';

export const IotSimulatorModal: React.FC = () => {
  const {
    isIotSimulatorOpen,
    setIsIotSimulatorOpen,
    state,
    triggerEmergency,
    submitAssistance,
    updateEmergencyStatus,
    activeEmergencyForPatient,
  } = useHospital();

  const [selectedBedId, setSelectedBedId] = useState<string>('A-204');
  const [selectedDevice, setSelectedDevice] = useState<string>('ESP8266-BED-A204');
  const [assistanceType, setAssistanceType] = useState<AssistanceCategory>('Need Nurse');
  const [notes, setNotes] = useState<string>('Simulated IoT emergency button press via physical push switch.');
  const [isSending, setIsSending] = useState<boolean>(false);
  const [lastResponse, setLastResponse] = useState<any | null>(null);

  if (!isIotSimulatorOpen) return null;

  // Selected bed details
  const bedInfo = state.beds.find((b) => b.id === selectedBedId);
  const matchedDevice = state.iotDevices.find((d) => d.bed_id === selectedBedId) || state.iotDevices[0];

  // Generated JSON payload preview
  const simulatedPayload = {
    device_id: selectedDevice,
    patient_id: bedInfo?.patientId || 'P102',
    bed_id: selectedBedId,
    request_type: 'EMERGENCY',
    timestamp: new Date().toISOString(),
    signal_rssi: matchedDevice?.signal_rssi || -64,
    battery_level: matchedDevice?.battery_level || 98,
    firmware_version: matchedDevice?.firmware_version || 'v2.4.1',
    notes: notes,
  };

  const handleTriggerEmergency = async () => {
    setIsSending(true);
    try {
      const res = await triggerEmergency({
        bed_id: selectedBedId,
        patient_id: bedInfo?.patientId || 'P102',
        device_id: selectedDevice,
        notes: notes,
      });
      setLastResponse(res);
    } catch (err: any) {
      setLastResponse({ error: err.message });
    } finally {
      setIsSending(false);
    }
  };

  const handleTriggerAssistance = async () => {
    setIsSending(true);
    try {
      const res = await submitAssistance(assistanceType, notes);
      setLastResponse(res);
    } catch (err: any) {
      setLastResponse({ error: err.message });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
        onClick={() => setIsIotSimulatorOpen(false)}
      />

      <div className="relative bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 z-10 overflow-hidden space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] font-bold uppercase tracking-wider">
                <Radio className="w-3 h-3 text-indigo-600 animate-pulse" />
                <span>Hardware Testbench & Demo Suite</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mt-0.5">
                ESP8266 IoT Bedside Device Simulator
              </h3>
            </div>
          </div>
          <button
            onClick={() => setIsIotSimulatorOpen(false)}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Device Telemetry Card (RSSI, Battery, Ping) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-900 text-white p-4 rounded-2xl">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 uppercase font-semibold flex items-center space-x-1">
              <Wifi className="w-3 h-3 text-emerald-400" />
              <span>Wi-Fi / RSSI</span>
            </span>
            <div className="text-sm font-mono font-bold text-emerald-400">
              {matchedDevice?.signal_rssi || -64} dBm
            </div>
            <div className="text-[10px] text-slate-400">Excellent 2.4GHz link</div>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 uppercase font-semibold flex items-center space-x-1">
              <BatteryCharging className="w-3 h-3 text-sky-400" />
              <span>Power / Battery</span>
            </span>
            <div className="text-sm font-mono font-bold text-sky-400">
              {matchedDevice?.battery_level || 98}% (5V DC)
            </div>
            <div className="text-[10px] text-slate-400">Mains + Battery Backed</div>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Status</span>
            <div className="text-sm font-bold text-emerald-400 flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>ONLINE</span>
            </div>
            <div className="text-[10px] text-slate-400">Ping: 12ms</div>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Firmware</span>
            <div className="text-sm font-mono font-bold text-indigo-300">
              {matchedDevice?.firmware_version || 'v2.4.1'}
            </div>
            <div className="text-[10px] text-slate-400">NodeMCU ESP-12E</div>
          </div>
        </div>

        {/* Controls Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Select Bed / Station:
            </label>
            <select
              value={selectedBedId}
              onChange={(e) => {
                setSelectedBedId(e.target.value);
                const dev = state.iotDevices.find((d) => d.bed_id === e.target.value);
                if (dev) setSelectedDevice(dev.device_id);
              }}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {state.beds.map((b) => (
                <option key={b.id} value={b.id}>
                  Bed {b.id} — {b.ward} ({b.patientName || 'Vacant'})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              ESP8266 Microcontroller Device ID:
            </label>
            <input
              type="text"
              value={selectedDevice}
              onChange={(e) => setSelectedDevice(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-indigo-900"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <button
            id="iot-trigger-emergency-btn"
            disabled={isSending}
            onClick={handleTriggerEmergency}
            className="py-3.5 px-4 rounded-2xl bg-rose-600 hover:bg-rose-700 active:scale-[0.98] text-white font-bold text-xs shadow-md hover:shadow-lg transition-all flex items-center justify-center space-x-2"
          >
            <ShieldAlert className="w-4 h-4 animate-bounce" />
            <span>{isSending ? 'Transmitting...' : 'Send Emergency Alert [POST /api/emergency]'}</span>
          </button>

          <button
            disabled={isSending}
            onClick={handleTriggerAssistance}
            className="py-3.5 px-4 rounded-2xl bg-amber-500 hover:bg-amber-600 active:scale-[0.98] text-white font-bold text-xs shadow-md transition-all flex items-center justify-center space-x-2"
          >
            <Send className="w-4 h-4" />
            <span>Send Assistance Call ({assistanceType})</span>
          </button>
        </div>

        {/* JSON Payload Inspector */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 flex items-center space-x-1.5">
              <Code className="w-3.5 h-3.5 text-slate-500" />
              <span>Simulated Device HTTP POST Body (application/json):</span>
            </span>
            <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              HTTP/1.1 200 OK
            </span>
          </div>

          <pre className="p-3 bg-slate-900 text-indigo-300 font-mono text-[11px] rounded-2xl overflow-x-auto leading-relaxed border border-slate-800">
            {JSON.stringify(simulatedPayload, null, 2)}
          </pre>
        </div>

        {lastResponse && (
          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              Server Acknowledged: Request ID <strong>{lastResponse.request_id || 'OK'}</strong> broadcasted via SSE to Nurse Station.
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
