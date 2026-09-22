import React, { useState } from 'react';
import {
  Activity,
  AlertTriangle,
  BedDouble,
  Building,
  CheckCircle2,
  Clock,
  Compass,
  Cpu,
  Edit2,
  Layers,
  MapPin,
  Plus,
  Radio,
  RotateCcw,
  Search,
  Settings,
  Shield,
  Stethoscope,
  Trash2,
  User,
  Users,
  Wifi,
  X,
} from 'lucide-react';
import { useHospital } from '../../context/HospitalContext.tsx';
import { Doctor, Facility, FacilityCategory } from '../../types.ts';
import { HospitalMap } from '../HospitalMap.tsx';

type AdminTab =
  | 'overview'
  | 'facilities'
  | 'doctors'
  | 'beds'
  | 'patients'
  | 'map'
  | 'logs'
  | 'iot';

export const AdminDashboard: React.FC = () => {
  const {
    state,
    saveFacility,
    deleteFacility,
    saveDoctor,
    deleteDoctor,
    updateBedStatus,
    resetDatabase,
    setIsIotSimulatorOpen,
  } = useHospital();

  const [activeTab, setActiveTab] = useState<AdminTab>('overview');

  // Facility Form Modal State
  const [facilityModalOpen, setFacilityModalOpen] = useState<boolean>(false);
  const [editingFacility, setEditingFacility] = useState<Partial<Facility>>({});

  // Doctor Form Modal State
  const [doctorModalOpen, setDoctorModalOpen] = useState<boolean>(false);
  const [editingDoctor, setEditingDoctor] = useState<Partial<Doctor>>({});

  const handleOpenFacilityModal = (fac?: Facility) => {
    if (fac) {
      setEditingFacility({ ...fac });
    } else {
      setEditingFacility({
        facility_id: `FAC-${Date.now()}`,
        name: '',
        category: 'water',
        building: 'Block A',
        floor: 0,
        room: '',
        description: '',
        opening_hours: '24 Hours',
        distance: '',
        directions: ['Enter through main entrance', 'Proceed to location'],
        coordinates: { x: 50, y: 50 },
      });
    }
    setFacilityModalOpen(true);
  };

  const handleSaveFacilitySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFacility.name) return;
    await saveFacility(editingFacility as Facility);
    setFacilityModalOpen(false);
  };

  const handleOpenDoctorModal = (doc?: Doctor) => {
    if (doc) {
      setEditingDoctor({ ...doc });
    } else {
      setEditingDoctor({
        doctor_id: `DOC-${Date.now()}`,
        name: 'Dr. ',
        department: 'General Medicine',
        specialization: '',
        room: 'Room 101',
        floor: 1,
        block: 'Block A',
        availability: 'Available',
        consultation_hours: '09:00 AM – 02:00 PM',
        avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=250',
        experienceYears: 10,
      });
    }
    setDoctorModalOpen(true);
  };

  const handleSaveDoctorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDoctor.name) return;
    await saveDoctor(editingDoctor as Doctor);
    setDoctorModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Sub-navigation Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-1.5 shadow-2xs overflow-x-auto scrollbar-none">
        <div className="flex items-center space-x-1 min-w-max">
          {[
            { id: 'overview', label: 'Overview', icon: Activity },
            { id: 'facilities', label: 'Facilities Manager', icon: Building },
            { id: 'doctors', label: 'Doctors Directory', icon: Stethoscope },
            { id: 'beds', label: 'Wards & Beds', icon: BedDouble },
            { id: 'patients', label: 'Patient Records', icon: Users },
            { id: 'map', label: 'Hospital Map Editor', icon: Compass },
            { id: 'logs', label: 'Emergency Logs', icon: Clock },
            { id: 'iot', label: 'ESP8266 IoT Hardware', icon: Cpu },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`admin-tab-${tab.id}`}
                onClick={() => setActiveTab(tab.id as AdminTab)}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ======================================================== */}
      {/* OVERVIEW / SYSTEM DASHBOARD */}
      {/* ======================================================== */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Top KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
              <span className="text-xs font-bold text-slate-500">Registered Facilities</span>
              <div className="text-2xl font-bold text-slate-900 mt-2">{state.facilities.length}</div>
              <div className="text-[11px] text-teal-700 mt-0.5">Navigable Waypoints</div>
            </div>
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
              <span className="text-xs font-bold text-slate-500">Doctors on Roster</span>
              <div className="text-2xl font-bold text-slate-900 mt-2">{state.doctors.length}</div>
              <div className="text-[11px] text-teal-700 mt-0.5">Across 8 Departments</div>
            </div>
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
              <span className="text-xs font-bold text-slate-500">Total Hospital Beds</span>
              <div className="text-2xl font-bold text-slate-900 mt-2">{state.beds.length}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                {state.beds.filter((b) => b.status === 'Available').length} Vacant
              </div>
            </div>
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
              <span className="text-xs font-bold text-slate-500">IoT ESP8266 Gateways</span>
              <div className="text-2xl font-bold text-indigo-700 mt-2">{state.iotDevices.length}</div>
              <div className="text-[11px] text-emerald-600 font-bold mt-0.5">● 100% Online Telemetry</div>
            </div>
          </div>

          {/* Quick Actions Panel */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900">Hospital Administration Quick Actions</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                onClick={() => handleOpenFacilityModal()}
                className="p-4 rounded-2xl bg-slate-50 hover:bg-teal-50 border border-slate-200 hover:border-teal-300 text-left transition-all"
              >
                <Building className="w-5 h-5 text-teal-600 mb-2" />
                <div className="text-xs font-bold text-slate-900">+ Add Hospital Facility</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Water points, pharmacy, clinic rooms</div>
              </button>

              <button
                onClick={() => handleOpenDoctorModal()}
                className="p-4 rounded-2xl bg-slate-50 hover:bg-teal-50 border border-slate-200 hover:border-teal-300 text-left transition-all"
              >
                <Stethoscope className="w-5 h-5 text-teal-600 mb-2" />
                <div className="text-xs font-bold text-slate-900">+ Add Doctor Specialist</div>
                <div className="text-[11px] text-slate-500 mt-0.5">OPD timings, consultation room</div>
              </button>

              <button
                onClick={() => setIsIotSimulatorOpen(true)}
                className="p-4 rounded-2xl bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 text-left transition-all"
              >
                <Cpu className="w-5 h-5 text-indigo-600 mb-2" />
                <div className="text-xs font-bold text-slate-900">Simulate ESP8266 IoT Hardware</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Test emergency button POST API</div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* FACILITIES MANAGEMENT (Add, Edit, Delete) */}
      {/* ======================================================== */}
      {activeTab === 'facilities' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Hospital Facilities & Navigation Waypoints</h3>
              <p className="text-xs text-slate-500">Manage indoor locations, rooms, opening hours, and step directions.</p>
            </div>
            <button
              onClick={() => handleOpenFacilityModal()}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl flex items-center space-x-1.5 shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Add Facility</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase font-bold text-[10px]">
                  <th className="p-3">Facility Name</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Building & Floor</th>
                  <th className="p-3">Room</th>
                  <th className="p-3">Hours</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {state.facilities.map((fac) => (
                  <tr key={fac.facility_id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 font-bold text-slate-900">{fac.name}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 uppercase">
                        {fac.category}
                      </span>
                    </td>
                    <td className="p-3 text-slate-700">{fac.building} • Floor {fac.floor === 0 ? 'Ground' : fac.floor}</td>
                    <td className="p-3 font-semibold text-teal-700">{fac.room || '—'}</td>
                    <td className="p-3 text-slate-500">{fac.opening_hours || '24 Hours'}</td>
                    <td className="p-3 text-right space-x-2">
                      <button
                        onClick={() => handleOpenFacilityModal(fac)}
                        className="p-1.5 text-slate-600 hover:text-teal-700 hover:bg-slate-100 rounded-lg"
                        title="Edit facility"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => deleteFacility(fac.facility_id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                        title="Delete facility"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* DOCTORS DIRECTORY (Add, Edit, Delete) */}
      {/* ======================================================== */}
      {activeTab === 'doctors' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Hospital Medical Specialists & Doctors</h3>
              <p className="text-xs text-slate-500">Configure physician roster, departments, and consultation room numbers.</p>
            </div>
            <button
              onClick={() => handleOpenDoctorModal()}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl flex items-center space-x-1.5 shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Add Doctor</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase font-bold text-[10px]">
                  <th className="p-3">Doctor</th>
                  <th className="p-3">Department</th>
                  <th className="p-3">Specialization</th>
                  <th className="p-3">Consultation Room</th>
                  <th className="p-3">Availability</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {state.doctors.map((doc) => (
                  <tr key={doc.doctor_id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 flex items-center space-x-2.5">
                      <img
                        src={doc.avatar}
                        alt={doc.name}
                        className="w-8 h-8 rounded-lg object-cover border"
                        referrerPolicy="no-referrer"
                      />
                      <span className="font-bold text-slate-900">{doc.name}</span>
                    </td>
                    <td className="p-3 font-semibold text-teal-700">{doc.department}</td>
                    <td className="p-3 text-slate-600">{doc.specialization}</td>
                    <td className="p-3 font-bold text-slate-800">{doc.room} ({doc.block}, Fl {doc.floor})</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {doc.availability}
                      </span>
                    </td>
                    <td className="p-3 text-right space-x-2">
                      <button
                        onClick={() => handleOpenDoctorModal(doc)}
                        className="p-1.5 text-slate-600 hover:text-teal-700 hover:bg-slate-100 rounded-lg"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => deleteDoctor(doc.doctor_id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* WARDS & BEDS MANAGEMENT */}
      {/* ======================================================== */}
      {activeTab === 'beds' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Hospital Beds & Ward Configuration</h3>
              <p className="text-xs text-slate-500">View 20 beds across 3 hospital wards with IoT device mappings.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {state.beds.map((b) => (
              <div key={b.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-900">Bed {b.id}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      b.status === 'Emergency'
                        ? 'bg-rose-100 text-rose-800 animate-pulse'
                        : b.status === 'Occupied'
                        ? 'bg-blue-100 text-blue-800'
                        : b.status === 'Available'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {b.status}
                  </span>
                </div>
                <div className="text-slate-600">
                  {b.ward} • {b.room} ({b.block}, Fl {b.floor})
                </div>
                <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">IoT Device:</span>
                  <span className="font-mono font-bold text-indigo-700">{b.iotDeviceId || 'Unmapped'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* PATIENTS REGISTRY */}
      {/* ======================================================== */}
      {activeTab === 'patients' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Inpatient Registry</h3>
              <p className="text-xs text-slate-500">Demographic and admission records linked to hospital bed stations.</p>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {state.patients.map((pt) => (
              <div key={pt.patient_id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-sm text-slate-900">{pt.name}</span>
                    <span className="font-mono text-[11px] font-bold text-slate-500">({pt.patient_id})</span>
                    <span className="font-bold text-teal-700">Bed {pt.bed_id}</span>
                  </div>
                  <p className="text-slate-600 mt-1">{pt.condition_summary}</p>
                  <div className="text-slate-400 mt-0.5">
                    Attendant: {pt.attendant_name} ({pt.attendant_phone}) • Admitted: {pt.admission_date}
                  </div>
                </div>
                <span className="px-3 py-1.5 rounded-xl bg-teal-50 text-teal-800 font-bold border border-teal-200 shrink-0">
                  {pt.primary_doctor}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MAP VIEWER */}
      {/* ======================================================== */}
      {activeTab === 'map' && (
        <div className="space-y-4">
          <HospitalMap />
        </div>
      )}

      {/* ======================================================== */}
      {/* EMERGENCY LOGS */}
      {/* ======================================================== */}
      {activeTab === 'logs' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-slate-900">Emergency & Call Audit Logs</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase font-bold text-[10px]">
                  <th className="p-3">ID</th>
                  <th className="p-3">Patient</th>
                  <th className="p-3">Bed</th>
                  <th className="p-3">Source</th>
                  <th className="p-3">Time</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {state.emergencyRequests.map((e) => (
                  <tr key={e.request_id} className="hover:bg-slate-50">
                    <td className="p-3 font-mono font-bold text-slate-900">{e.request_id}</td>
                    <td className="p-3 font-medium text-slate-800">{e.patient_name}</td>
                    <td className="p-3 font-bold text-teal-700">{e.bed_id}</td>
                    <td className="p-3 font-mono text-[11px] text-indigo-700">{e.request_type}</td>
                    <td className="p-3 text-slate-500">{new Date(e.created_at).toLocaleTimeString()}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800">
                        {e.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* ESP8266 IoT HARDWARE CONFIGURATION AREA (SECTION 8) */}
      {/* ======================================================== */}
      {activeTab === 'iot' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                  <Cpu className="w-5 h-5 text-indigo-600" />
                  <span>ESP8266 IoT Hardware Configuration & Gateway Architecture</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Bedside ESP8266 microcontroller modules communicate through Wi-Fi to the SmartCare backend REST API.
                </p>
              </div>
              <button
                onClick={() => setIsIotSimulatorOpen(true)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center space-x-2"
              >
                <Radio className="w-4 h-4" />
                <span>Open Hardware Testbench</span>
              </button>
            </div>

            {/* Configuration Area: API URL, Device ID, Auth Token (Section 8) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-5 rounded-2xl border border-slate-200">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                  Target Backend API Endpoint:
                </label>
                <div className="font-mono text-xs font-bold text-slate-900 bg-white p-2.5 rounded-xl border border-slate-200">
                  POST /api/emergency
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                  Default Demo Device ID:
                </label>
                <div className="font-mono text-xs font-bold text-indigo-700 bg-white p-2.5 rounded-xl border border-slate-200">
                  ESP8266-BED-A204
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                  Authentication Token:
                </label>
                <div className="font-mono text-xs font-bold text-emerald-700 bg-white p-2.5 rounded-xl border border-slate-200">
                  smartcare-iot-secure-key
                </div>
              </div>
            </div>

            {/* Arduino / C++ Firmware Code Snippet */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                ESP8266 Arduino C++ Firmware Template (Ready to Flash to NodeMCU / Wemos D1 Mini):
              </h4>
              <pre className="p-4 bg-slate-950 text-emerald-400 font-mono text-[11px] rounded-2xl overflow-x-auto leading-relaxed border border-slate-800">
{`#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClientSecure.h>

const char* ssid = "Hospital-Staff-WiFi";
const char* password = "WiFiPasswordHere";
const char* api_url = "https://<SMARTCARE_DOMAIN>/api/emergency";
const char* auth_token = "smartcare-iot-secure-key";

const int BUTTON_PIN = D2; // GPIO4 Bedside Emergency Push Button
const int STATUS_LED = D4; // GPIO2 Onboard Status LED

void setup() {
  pinMode(BUTTON_PIN, INPUT_PULLUP);
  pinMode(STATUS_LED, OUTPUT);
  Serial.begin(115200);
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) { delay(500); }
}

void triggerEmergency() {
  if (WiFi.status() == WL_CONNECTED) {
    WiFiClient client;
    HTTPClient http;
    http.begin(client, api_url);
    http.addHeader("Content-Type", "application/json");
    http.addHeader("Authorization", String("Bearer ") + auth_token);

    String payload = "{\\"device_id\\":\\"ESP8266-BED-A204\\",\\"patient_id\\":\\"P102\\",\\"bed_id\\":\\"A204\\",\\"request_type\\":\\"EMERGENCY\\"}";
    int httpCode = http.POST(payload);
    if (httpCode == 200) {
      digitalWrite(STATUS_LED, LOW); // Flash LED confirmation
    }
    http.end();
  }
}

void loop() {
  if (digitalRead(BUTTON_PIN) == LOW) { // Button pressed
    triggerEmergency();
    delay(2000); // Debounce
  }
}`}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* Facility Edit / Create Modal */}
      {facilityModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <form
            onSubmit={handleSaveFacilitySubmit}
            className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">
                {editingFacility.facility_id ? 'Edit Facility' : 'Add New Hospital Facility'}
              </h3>
              <button
                type="button"
                onClick={() => setFacilityModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Facility Name:</label>
              <input
                type="text"
                required
                value={editingFacility.name || ''}
                onChange={(e) => setEditingFacility({ ...editingFacility, name: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Category:</label>
                <select
                  value={editingFacility.category || 'water'}
                  onChange={(e) => setEditingFacility({ ...editingFacility, category: e.target.value as FacilityCategory })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                >
                  <option value="water">Drinking Water</option>
                  <option value="pharmacy">Pharmacy</option>
                  <option value="laboratory">Laboratory</option>
                  <option value="cafeteria">Cafeteria</option>
                  <option value="restroom">Restroom</option>
                  <option value="nurse_station">Nurse Station</option>
                  <option value="ward">Ward</option>
                  <option value="billing">Billing</option>
                  <option value="registration">Registration</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Building Block:</label>
                <select
                  value={editingFacility.building || 'Block A'}
                  onChange={(e) => setEditingFacility({ ...editingFacility, building: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                >
                  <option value="Block A">Block A</option>
                  <option value="Block B">Block B</option>
                  <option value="Block C">Block C</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Floor:</label>
                <select
                  value={editingFacility.floor ?? 0}
                  onChange={(e) => setEditingFacility({ ...editingFacility, floor: Number(e.target.value) })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                >
                  <option value={0}>Ground Floor</option>
                  <option value={1}>Floor 1</option>
                  <option value={2}>Floor 2</option>
                  <option value={3}>Floor 3</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Room Number:</label>
                <input
                  type="text"
                  placeholder="e.g. Room G-04"
                  value={editingFacility.room || ''}
                  onChange={(e) => setEditingFacility({ ...editingFacility, room: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Description:</label>
              <textarea
                rows={2}
                value={editingFacility.description || ''}
                onChange={(e) => setEditingFacility({ ...editingFacility, description: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </div>

            <div className="flex space-x-2 pt-2">
              <button
                type="submit"
                className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl"
              >
                Save Facility
              </button>
              <button
                type="button"
                onClick={() => setFacilityModalOpen(false)}
                className="px-4 py-2.5 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Doctor Edit / Create Modal */}
      {doctorModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <form
            onSubmit={handleSaveDoctorSubmit}
            className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">
                {editingDoctor.doctor_id ? 'Edit Doctor Record' : 'Add New Medical Specialist'}
              </h3>
              <button
                type="button"
                onClick={() => setDoctorModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Doctor Name & Credentials:</label>
              <input
                type="text"
                required
                placeholder="Dr. Evelyn Reed, MD"
                value={editingDoctor.name || ''}
                onChange={(e) => setEditingDoctor({ ...editingDoctor, name: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Department:</label>
                <input
                  type="text"
                  required
                  placeholder="Cardiology"
                  value={editingDoctor.department || ''}
                  onChange={(e) => setEditingDoctor({ ...editingDoctor, department: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Specialization:</label>
                <input
                  type="text"
                  placeholder="Cardiac Telemetry"
                  value={editingDoctor.specialization || ''}
                  onChange={(e) => setEditingDoctor({ ...editingDoctor, specialization: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Consultation Room:</label>
                <input
                  type="text"
                  placeholder="Room 204"
                  value={editingDoctor.room || ''}
                  onChange={(e) => setEditingDoctor({ ...editingDoctor, room: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Block:</label>
                <select
                  value={editingDoctor.block || 'Block B'}
                  onChange={(e) => setEditingDoctor({ ...editingDoctor, block: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                >
                  <option value="Block A">Block A</option>
                  <option value="Block B">Block B</option>
                  <option value="Block C">Block C</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Floor:</label>
                <select
                  value={editingDoctor.floor ?? 2}
                  onChange={(e) => setEditingDoctor({ ...editingDoctor, floor: Number(e.target.value) })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                >
                  <option value={0}>Ground</option>
                  <option value={1}>Floor 1</option>
                  <option value={2}>Floor 2</option>
                  <option value={3}>Floor 3</option>
                </select>
              </div>
            </div>

            <div className="flex space-x-2 pt-2">
              <button
                type="submit"
                className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl"
              >
                Save Doctor
              </button>
              <button
                type="button"
                onClick={() => setDoctorModalOpen(false)}
                className="px-4 py-2.5 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
