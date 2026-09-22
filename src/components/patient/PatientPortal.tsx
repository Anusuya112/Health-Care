import React, { useState } from 'react';
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  BedDouble,
  Building,
  Calendar,
  CheckCircle2,
  Clock,
  Compass,
  CreditCard,
  Droplet,
  FileCheck,
  FileText,
  Heart,
  HelpCircle,
  Info,
  LogOut,
  MapPin,
  MessageSquare,
  Navigation,
  ParkingCircle,
  Pill,
  Radio,
  Search,
  Send,
  Shield,
  Stethoscope,
  TestTube,
  User,
  UserCheck,
  Users,
  Utensils,
  Volume2,
  Wifi,
} from 'lucide-react';
import { useHospital } from '../../context/HospitalContext.tsx';
import { AssistanceCategory, Facility, FacilityCategory } from '../../types.ts';
import { HospitalMap } from '../HospitalMap.tsx';
import { EmergencyDialog } from './EmergencyDialog.tsx';

type PatientTab =
  | 'home'
  | 'find'
  | 'map'
  | 'doctors'
  | 'facilities'
  | 'assistance'
  | 'profile';

export const PatientPortal: React.FC = () => {
  const {
    currentPatient,
    currentUser,
    state,
    setIsEmergencyDialogOpen,
    activeEmergencyForPatient,
    setActiveDestination,
    submitAssistance,
    pendingAssistanceRequests,
    updatePatientBed,
    updatePatientProfile,
    logout,
  } = useHospital();

  const [activeTab, setActiveTab] = useState<PatientTab>('home');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<FacilityCategory | 'all'>('all');

  // Dynamic Bed Switcher State
  const [isBedSelectorOpen, setIsBedSelectorOpen] = useState<boolean>(false);

  // Doctor search state
  const [doctorSearch, setDoctorSearch] = useState<string>('');
  const [selectedDept, setSelectedDept] = useState<string>('all');

  // Assistance submission state
  const [assistanceType, setAssistanceType] = useState<AssistanceCategory>('Need Nurse');
  const [assistanceNotes, setAssistanceNotes] = useState<string>('');
  const [assistanceSubmitted, setAssistanceSubmitted] = useState<boolean>(false);
  const [submittingAssistance, setSubmittingAssistance] = useState<boolean>(false);

  // Selected doctor modal for details
  const [selectedDoctorDetail, setSelectedDoctorDetail] = useState<any | null>(null);

  // Profile edit state
  const [isEditingProfile, setIsEditingProfile] = useState<boolean>(false);
  const [profileForm, setProfileForm] = useState({
    name: currentPatient.name,
    emergency_contact: currentPatient.emergency_contact,
    attendant_name: currentPatient.attendant_name,
    condition_summary: currentPatient.condition_summary,
  });

  // Categories list
  const categoryFilters: { id: FacilityCategory; label: string; icon: any; color: string }[] = [
    { id: 'doctor', label: 'Doctor', icon: Stethoscope, color: 'text-blue-600 bg-blue-50 border-blue-200' },
    { id: 'department', label: 'Department', icon: Building, color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
    { id: 'ward', label: 'Ward', icon: BedDouble, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
    { id: 'nurse_station', label: 'Nurse Station', icon: Activity, color: 'text-teal-600 bg-teal-50 border-teal-200' },
    { id: 'laboratory', label: 'Laboratory', icon: TestTube, color: 'text-purple-600 bg-purple-50 border-purple-200' },
    { id: 'pharmacy', label: 'Pharmacy', icon: Pill, color: 'text-sky-600 bg-sky-50 border-sky-200' },
    { id: 'water', label: 'Drinking Water', icon: Droplet, color: 'text-cyan-600 bg-cyan-50 border-cyan-200' },
    { id: 'cafeteria', label: 'Cafeteria', icon: Utensils, color: 'text-amber-600 bg-amber-50 border-amber-200' },
    { id: 'restroom', label: 'Restroom', icon: User, color: 'text-violet-600 bg-violet-50 border-violet-200' },
    { id: 'billing', label: 'Billing', icon: CreditCard, color: 'text-blue-600 bg-blue-50 border-blue-200' },
    { id: 'registration', label: 'Registration', icon: FileCheck, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
    { id: 'blood_bank', label: 'Blood Bank', icon: Heart, color: 'text-rose-600 bg-rose-50 border-rose-200' },
    { id: 'xray', label: 'X-Ray / Scan', icon: Radio, color: 'text-amber-600 bg-amber-50 border-amber-200' },
    { id: 'exit', label: 'Exit', icon: LogOut, color: 'text-slate-600 bg-slate-100 border-slate-300' },
    { id: 'parking', label: 'Parking', icon: ParkingCircle, color: 'text-slate-600 bg-slate-100 border-slate-300' },
  ];

  // Filter facilities
  const filteredFacilities = state.facilities.filter((f) => {
    const matchesCategory = selectedCategory === 'all' || f.category === selectedCategory;
    const matchesSearch =
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.building.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (f.room && f.room.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  // Filter doctors
  const filteredDoctors = state.doctors.filter((doc) => {
    const matchesDept = selectedDept === 'all' || doc.department.toLowerCase() === selectedDept.toLowerCase();
    const matchesSearch =
      doc.name.toLowerCase().includes(doctorSearch.toLowerCase()) ||
      doc.specialization.toLowerCase().includes(doctorSearch.toLowerCase()) ||
      doc.department.toLowerCase().includes(doctorSearch.toLowerCase()) ||
      doc.room.toLowerCase().includes(doctorSearch.toLowerCase());
    return matchesDept && matchesSearch;
  });

  // Departments list for filter
  const departments = Array.from(new Set(state.doctors.map((d) => d.department)));

  const handleSelectFacilityRoute = (facility: Facility) => {
    setActiveDestination(facility);
    setActiveTab('map');
  };

  const handleRouteToDoctorRoom = (doctor: any) => {
    const syntheticFacility: Facility = {
      facility_id: `FAC-DOC-${doctor.doctor_id}`,
      name: `${doctor.name} (${doctor.department})`,
      category: 'doctor',
      building: doctor.block,
      floor: doctor.floor,
      room: doctor.room,
      description: `${doctor.specialization}. Consultation Hours: ${doctor.consultation_hours}.`,
      opening_hours: doctor.consultation_hours,
      distance: 'From Bed A-204',
      directions: [
        `Start at Bed A-204 (Block B, 2nd Floor)`,
        `Take Central Concourse toward ${doctor.block}`,
        `Use Elevator or stairs to Floor ${doctor.floor === 0 ? 'Ground' : doctor.floor}`,
        `Proceed down the corridor to ${doctor.room}`,
      ],
      coordinates: { x: 50, y: 40 },
    };
    setActiveDestination(syntheticFacility);
    setActiveTab('map');
  };

  const handleSubmitAssistance = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingAssistance(true);
    try {
      await submitAssistance(assistanceType, assistanceNotes);
      setAssistanceSubmitted(true);
      setAssistanceNotes('');
      setTimeout(() => setAssistanceSubmitted(false), 5000);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingAssistance(false);
    }
  };

  // Patient assistance categories
  const assistanceOptions: { type: AssistanceCategory; label: string; icon: any; desc: string }[] = [
    { type: 'Request Medicine', label: 'Request Medicine', icon: Pill, desc: 'Request prescribed medication dosage or refill from hospital pharmacy' },
    { type: 'Need Nurse', label: 'Need Nurse', icon: Stethoscope, desc: 'Call bedside duty nurse for assistance or vitals check' },
    { type: 'Need Water', label: 'Need Water', icon: Droplet, desc: 'Request fresh drinking water bottle or glass at bedside' },
    { type: 'Need Wheelchair', label: 'Need Wheelchair', icon: Users, desc: 'Request porter with wheelchair for room transfer or diagnostics' },
    { type: 'Need Help Finding Location', label: 'Find Location', icon: Compass, desc: 'Assistance navigating to lab, pharmacy or cafeteria' },
    { type: 'Need Attendant Assistance', label: 'Attendant Help', icon: HelpCircle, desc: 'Request helper for bed mobility or personal attendant' },
    { type: 'Other', label: 'Other Request', icon: MessageSquare, desc: 'Linen change, temperature check or room query' },
  ];

  const myAssistanceRequests = state.assistanceRequests.filter(
    (a) => a.patient_id === currentPatient.patient_id
  );

  return (
    <div className="space-y-6">
      {/* Patient Emergency Modal Tracker */}
      <EmergencyDialog />

      {/* Sub-navigation Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-1.5 shadow-2xs overflow-x-auto scrollbar-none">
        <div className="flex items-center space-x-1 min-w-max">
          {[
            { id: 'home', label: 'Home', icon: Activity },
            { id: 'find', label: 'Find Location', icon: Search },
            { id: 'map', label: 'Hospital Map', icon: Compass },
            { id: 'doctors', label: 'Doctors', icon: Stethoscope },
            { id: 'facilities', label: 'Facilities', icon: Building },
            { id: 'assistance', label: 'Requests & Help', icon: HelpCircle },
            { id: 'profile', label: 'Profile', icon: User },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`patient-tab-${tab.id}`}
                onClick={() => setActiveTab(tab.id as PatientTab)}
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
      {/* TAB 1: HOME */}
      {/* ======================================================== */}
      {activeTab === 'home' && (
        <div className="space-y-6">
          {/* Top Patient Welcome & Bed Info Card */}
          <div className="bg-gradient-to-r from-teal-800 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <div className="flex items-center space-x-2 text-teal-300 text-xs font-semibold uppercase tracking-wider mb-2">
                  <span>SmartCare Patient Portal</span>
                  <span>•</span>
                  <span>Inpatient Telemetry Active</span>
                </div>
                {/* Dynamically Bound Welcome Header with Bed Assignment */}
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex flex-wrap items-center gap-x-2.5 gap-y-2">
                  <span>Welcome, {currentPatient.name}</span>
                  <span className="text-teal-400/80 font-light">|</span>
                  <span className="inline-flex items-center space-x-1.5 bg-teal-500/25 backdrop-blur-md text-white text-lg sm:text-xl font-bold px-3 py-1 rounded-xl border border-teal-300/30 shadow-xs">
                    <BedDouble className="w-5 h-5 text-teal-300 inline" />
                    <span>Bed: {currentPatient.bed_id}</span>
                  </span>
                </h1>
                <p className="text-sm text-teal-100/90 mt-2 max-w-xl">
                  {currentPatient.condition_summary}
                </p>
              </div>

              {/* Dynamic Bed & Ward Badge with Interactive Bed Switcher */}
              <div className="flex items-center space-x-3 bg-white/10 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/15">
                <div className="w-10 h-10 rounded-xl bg-teal-500 text-white flex items-center justify-center font-bold">
                  <BedDouble className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] text-teal-200 uppercase font-semibold">Assigned Location</div>
                  <div className="text-base font-bold text-white flex items-center space-x-2">
                    <span>Bed {currentPatient.bed_id}</span>
                    <button
                      onClick={() => setIsBedSelectorOpen(true)}
                      className="text-[11px] font-semibold text-teal-200 hover:text-white underline bg-white/10 px-2 py-0.5 rounded-lg border border-white/20 transition-colors"
                      title="Change Assigned Bed"
                    >
                      Change Bed
                    </button>
                  </div>
                  <div className="text-xs text-teal-100/90">{currentPatient.ward_id} • Room 204</div>
                </div>
              </div>
            </div>

            {/* Quick Bed Reassignment Dialog */}
            {isBedSelectorOpen && (
              <div className="mt-4 pt-4 border-t border-teal-700/50 flex flex-wrap items-center gap-3 bg-black/20 p-3.5 rounded-2xl">
                <span className="text-xs font-semibold text-teal-200 flex items-center space-x-1">
                  <BedDouble className="w-4 h-4 text-teal-300" />
                  <span>Select New Inpatient Bed:</span>
                </span>
                <div className="flex flex-wrap gap-2">
                  {state.beds.map((b) => (
                    <button
                      key={b.id}
                      onClick={() => {
                        updatePatientBed(b.id);
                        setIsBedSelectorOpen(false);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                        currentPatient.bed_id === b.id
                          ? 'bg-teal-400 text-slate-900 shadow-xs'
                          : 'bg-white/15 text-white hover:bg-white/25 border border-white/10'
                      }`}
                    >
                      {b.id} ({b.ward})
                    </button>
                  ))}
                  <button
                    onClick={() => setIsBedSelectorOpen(false)}
                    className="px-2.5 py-1 rounded-lg text-xs text-teal-200 hover:text-white bg-transparent hover:bg-white/10"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* EMERGENCY SECTION - HIGHLY VISIBLE */}
          <div className="bg-white rounded-3xl border-2 border-rose-200 p-6 sm:p-8 shadow-xs relative overflow-hidden">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
              <div className="space-y-2 text-center lg:text-left">
                <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>24/7 Rapid Emergency Response</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                  Need Immediate Bedside Help?
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 max-w-lg">
                  Pressing the emergency button alerts Nurse Station A and dispatches medical personnel directly to Bed {currentPatient.bed_id}.
                </p>
              </div>

              {/* THE EMERGENCY BUTTON */}
              <button
                id="patient-emergency-btn"
                onClick={() => setIsEmergencyDialogOpen(true)}
                className="w-full sm:w-auto px-8 py-5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-base sm:text-lg font-bold shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center space-x-3 group"
              >
                <AlertTriangle className="w-6 h-6 stroke-[2.5] animate-bounce" />
                <span>🚨 EMERGENCY / REQUEST HELP</span>
              </button>
            </div>

            {/* If Emergency Is Currently Active for this Patient */}
            {activeEmergencyForPatient && (
              <div className="mt-6 pt-6 border-t border-rose-100 bg-rose-50/60 -mx-6 -mb-6 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center font-bold">
                    <Activity className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-rose-900">
                      Emergency Alert Active: {activeEmergencyForPatient.status}
                    </div>
                    <div className="text-xs text-rose-700">
                      Request ID: {activeEmergencyForPatient.request_id} • Bed {activeEmergencyForPatient.bed_id}
                      {activeEmergencyForPatient.assigned_nurse && ` • Assigned to ${activeEmergencyForPatient.assigned_nurse}`}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setIsEmergencyDialogOpen(true)}
                  className="px-4 py-2 bg-rose-600 text-white text-xs font-bold rounded-xl hover:bg-rose-700 shadow-xs"
                >
                  View Live Progress Tracker
                </button>
              </div>
            )}
          </div>

          {/* FIND A LOCATION PROMINENT SECTION */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
                  <Compass className="w-5 h-5 text-teal-600" />
                  <span>Find a Location in SmartCare</span>
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Search consultation rooms, wards, water points, pharmacy, lab, cafeteria and restrooms.
                </p>
              </div>
              <button
                onClick={() => setActiveTab('map')}
                className="inline-flex items-center space-x-1.5 text-xs font-bold text-teal-700 hover:text-teal-900 hover:underline"
              >
                <span>Open Interactive Map</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search doctors, pharmacy, drinking water, cafeteria, room 204..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => {
                  if (activeTab === 'home' && searchQuery) setActiveTab('find');
                }}
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all"
              />
            </div>

            {/* 15 Category Buttons Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
              {categoryFilters.map((cat) => {
                const Icon = cat.icon;
                return (
                  <button
                    key={cat.id}
                    id={`home-cat-${cat.id}`}
                    onClick={() => {
                      setSelectedCategory(cat.id);
                      setActiveTab('find');
                    }}
                    className={`flex items-center space-x-2.5 p-3 rounded-2xl border transition-all text-left group ${cat.color} hover:shadow-sm`}
                  >
                    <div className="p-2 rounded-xl bg-white/80 shadow-2xs shrink-0 group-hover:scale-105 transition-transform">
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-slate-800 leading-tight">
                      {cat.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Two-Column Grid: Quick Assistance & Care Team */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Quick Bedside Assistance */}
            <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                  <HelpCircle className="w-5 h-5 text-teal-600" />
                  <span>Request Bedside Assistance</span>
                </h3>
                <button
                  onClick={() => setActiveTab('assistance')}
                  className="text-xs font-semibold text-teal-700 hover:text-teal-900"
                >
                  View All ({myAssistanceRequests.length})
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {assistanceOptions.slice(0, 6).map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.type}
                      onClick={() => {
                        setAssistanceType(item.type);
                        setActiveTab('assistance');
                      }}
                      className="p-3.5 rounded-2xl border border-slate-200/80 bg-slate-50/70 hover:bg-teal-50 hover:border-teal-200 text-left transition-all group"
                    >
                      <div className="w-8 h-8 rounded-xl bg-white text-teal-700 flex items-center justify-center shadow-2xs mb-2 group-hover:bg-teal-600 group-hover:text-white transition-colors">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="text-xs font-bold text-slate-900">{item.label}</div>
                      <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{item.desc}</div>
                    </button>
                  );
                })}
              </div>

              {/* Recent Pending Requests Pill */}
              {pendingAssistanceRequests.length > 0 && (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2 text-amber-900">
                    <Clock className="w-4 h-4 text-amber-600" />
                    <span className="font-semibold">Active Assistance Request:</span>
                    <span>{pendingAssistanceRequests[0].type}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-amber-200/60 font-bold text-[10px] text-amber-900">
                    {pendingAssistanceRequests[0].status}
                  </span>
                </div>
              )}
            </div>

            {/* My Clinical Care Team & Primary Doctor */}
            <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <Stethoscope className="w-5 h-5 text-teal-600" />
                <span>Assigned Care Team</span>
              </h3>

              {/* Primary Doctor Card (Text-only, no profile image) */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-xl bg-teal-100 text-teal-800 border border-teal-200 flex items-center justify-center font-bold text-base shrink-0">
                    ER
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{currentPatient.primary_doctor}</h4>
                    <p className="text-xs text-teal-700 font-medium">Attending Cardiologist • Inpatient Care</p>
                    <p className="text-[11px] text-slate-500">Block B • 2nd Floor • Consultation Room 204</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-xs">
                  <span className="text-slate-500">Consultation Rounds:</span>
                  <span className="font-semibold text-slate-800">08:30 AM – 01:30 PM (Daily)</span>
                </div>

                <button
                  onClick={() => {
                    const doc = state.doctors.find((d) => d.name.includes('Reed')) || state.doctors[0];
                    if (doc) handleRouteToDoctorRoom(doc);
                  }}
                  className="w-full py-2 px-3 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-bold border border-teal-200 transition-colors flex items-center justify-center space-x-1.5"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>Navigate to Doctor Consultation Room</span>
                </button>
              </div>

              {/* Nurse Station Card (Text-only, no profile image) */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/90 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-800 border border-teal-200 flex items-center justify-center font-bold text-xs shrink-0">
                    NSA
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">Nurse Station A</div>
                    <div className="text-[11px] text-slate-600">Nurse Priya Sharma, RN (On Duty)</div>
                    <div className="text-[10px] text-slate-500">{currentPatient.ward_id} • Bedside Telemetry Station</div>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  15m from Bed
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: FIND A LOCATION & CATEGORY SEARCH */}
      {/* ======================================================== */}
      {activeTab === 'find' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Hospital Facility & Location Finder</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Browse departments, consultation rooms, drinking water points, cafeteria and restrooms.
                </p>
              </div>
              <div className="text-xs text-slate-500">
                Showing {filteredFacilities.length} locations
              </div>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search facility name, floor, room number or keyword..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white"
              />
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                  selectedCategory === 'all'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All Categories
              </button>
              {categoryFilters.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                    selectedCategory === cat.id
                      ? 'bg-teal-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Facilities Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredFacilities.map((fac) => (
              <div
                key={fac.facility_id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:border-teal-300 transition-all group"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-teal-50 text-teal-700 border border-teal-200 uppercase">
                      {fac.category.replace('_', ' ')}
                    </span>
                    <span className="text-xs font-semibold text-slate-600">
                      {fac.building} • Floor {fac.floor === 0 ? 'G' : fac.floor}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-900 group-hover:text-teal-700 transition-colors">
                      {fac.name}
                    </h3>
                    {fac.room && (
                      <p className="text-xs font-semibold text-teal-800 mt-0.5">
                        {fac.room}
                      </p>
                    )}
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      {fac.description}
                    </p>
                  </div>

                  {fac.opening_hours && (
                    <div className="text-[11px] text-slate-500 flex items-center space-x-1 pt-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{fac.opening_hours}</span>
                    </div>
                  )}
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-500 font-medium">
                    {fac.distance || 'Indoor Route Available'}
                  </span>
                  <button
                    onClick={() => handleSelectFacilityRoute(fac)}
                    className="px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-colors flex items-center space-x-1 shadow-xs"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>Find Route</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: HOSPITAL MAP & INDOOR WAYFINDING */}
      {/* ======================================================== */}
      {activeTab === 'map' && (
        <div className="space-y-4">
          <HospitalMap />
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 4: DOCTOR DIRECTORY */}
      {/* ======================================================== */}
      {activeTab === 'doctors' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Hospital Doctor Directory</h2>
                <p className="text-xs text-slate-500">
                  Search consultation specialists, check real-time OPD availability, and get indoor directions.
                </p>
              </div>
              <div className="text-xs text-slate-500 font-medium">
                {filteredDoctors.length} Doctors Available
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              <div className="sm:col-span-8 relative">
                <Search className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search doctor by name, specialty, department..."
                  value={doctorSearch}
                  onChange={(e) => setDoctorSearch(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="sm:col-span-4">
                <select
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                  className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
                >
                  <option value="all">All Departments</option>
                  {departments.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Doctor Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredDoctors.map((doc) => (
              <div
                key={doc.doctor_id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow"
              >
                <div className="space-y-4">
                  <div className="flex items-start space-x-3.5">
                    {/* Text-based Doctor Initials Badge (No photo) */}
                    <div className="w-14 h-14 rounded-2xl bg-teal-50 border border-teal-200/80 text-teal-800 flex items-center justify-center font-bold text-base shrink-0 shadow-2xs">
                      {doc.name.replace('Dr. ', '').split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center space-x-2">
                        <span
                          className={`inline-block w-2 h-2 rounded-full ${
                            doc.availability === 'Available'
                              ? 'bg-emerald-500'
                              : doc.availability === 'In OPD'
                              ? 'bg-blue-500'
                              : doc.availability === 'Emergency Duty'
                              ? 'bg-rose-500'
                              : 'bg-amber-500'
                          }`}
                        />
                        <span className="text-[11px] font-bold text-slate-600">
                          {doc.availability}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-slate-900 truncate mt-0.5">
                        {doc.name}
                      </h3>
                      <p className="text-xs font-semibold text-teal-700">{doc.department}</p>
                      <p className="text-[11px] text-slate-500 truncate">{doc.specialization}</p>
                    </div>
                  </div>

                  {/* Room & Consultation Info */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1">
                    <div className="flex items-center justify-between text-slate-700">
                      <span className="text-slate-500">Consultation Room:</span>
                      <span className="font-bold text-slate-900">{doc.room} ({doc.block}, Fl {doc.floor})</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-700">
                      <span className="text-slate-500">Hours:</span>
                      <span className="font-semibold text-slate-800">{doc.consultation_hours}</span>
                    </div>
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => setSelectedDoctorDetail(doc)}
                    className="py-2 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors"
                  >
                    View Details
                  </button>
                  <button
                    onClick={() => handleRouteToDoctorRoom(doc)}
                    className="py-2 px-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-colors flex items-center justify-center space-x-1 shadow-xs"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>Find Room</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Doctor Detail Modal */}
          {selectedDoctorDetail && (
            <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
              <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-14 h-14 rounded-2xl bg-teal-50 border border-teal-200 text-teal-800 flex items-center justify-center font-bold text-lg shrink-0">
                      {selectedDoctorDetail.name.replace('Dr. ', '').split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900">{selectedDoctorDetail.name}</h3>
                      <p className="text-xs font-semibold text-teal-700">{selectedDoctorDetail.department}</p>
                      <p className="text-xs text-slate-500">{selectedDoctorDetail.experienceYears} Years Clinical Experience</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedDoctorDetail(null)}
                    className="p-1 text-slate-400 hover:text-slate-600"
                  >
                    ×
                  </button>
                </div>

                <div className="space-y-2 text-xs text-slate-600 bg-slate-50 p-4 rounded-2xl">
                  <div>
                    <span className="font-semibold text-slate-900 block">Specialization:</span>
                    <span>{selectedDoctorDetail.specialization}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-900 block">Consultation Room:</span>
                    <span>{selectedDoctorDetail.room} ({selectedDoctorDetail.block}, Floor {selectedDoctorDetail.floor})</span>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-900 block">OPD Schedule:</span>
                    <span>{selectedDoctorDetail.consultation_hours}</span>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      const doc = selectedDoctorDetail;
                      setSelectedDoctorDetail(null);
                      handleRouteToDoctorRoom(doc);
                    }}
                    className="flex-1 py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-1.5"
                  >
                    <Navigation className="w-4 h-4" />
                    <span>Navigate to {selectedDoctorDetail.room}</span>
                  </button>
                  <button
                    onClick={() => setSelectedDoctorDetail(null)}
                    className="px-4 py-3 border border-slate-200 text-slate-700 font-semibold rounded-xl text-xs hover:bg-slate-50"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 5: FACILITY SEARCH (Drinking water, cafeteria, etc) */}
      {/* ======================================================== */}
      {activeTab === 'facilities' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
            <h2 className="text-xl font-bold text-slate-900">Hospital Facilities & Patient Amenities</h2>
            <p className="text-xs text-slate-500 mt-1">
              Locate drinking water points, 24/7 pharmacy, diagnostic labs, restrooms, cafeteria and billing desks.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {state.facilities.map((fac) => (
              <div
                key={fac.facility_id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:border-teal-300 transition-all"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-700 uppercase">
                      {fac.category}
                    </span>
                    <span className="text-xs font-semibold text-teal-700">
                      {fac.building} — Floor {fac.floor === 0 ? 'Ground' : fac.floor}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900">{fac.name}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{fac.description}</p>

                  {fac.opening_hours && (
                    <div className="text-xs text-slate-700 font-medium">
                      Opening hours: <span className="font-bold">{fac.opening_hours}</span>
                    </div>
                  )}
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-500">{fac.distance}</span>
                  <button
                    onClick={() => handleSelectFacilityRoute(fac)}
                    className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-xs"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>Find Route</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 6: PATIENT ASSISTANCE & REQUESTS */}
      {/* ======================================================== */}
      {activeTab === 'assistance' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Submit Request Form */}
            <div className="lg:col-span-6 bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
                  <HelpCircle className="w-5 h-5 text-teal-600" />
                  <span>Submit an Assistance Request</span>
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Requests are instantly transmitted to Nurse Station A for bedside attention.
                </p>
              </div>

              {assistanceSubmitted && (
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center space-x-3 text-emerald-900 animate-fadeIn">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold">Request successfully submitted.</h4>
                    <p className="text-[11px] text-emerald-700">
                      The nurse dashboard has received your assistance alert.
                    </p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmitAssistance} className="space-y-4">
                {/* Category Selection */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-2">
                    Select Request Category:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {assistanceOptions.map((opt) => (
                      <button
                        type="button"
                        key={opt.type}
                        onClick={() => setAssistanceType(opt.type)}
                        className={`p-3 rounded-xl border text-left text-xs font-bold transition-all flex items-center space-x-2.5 ${
                          assistanceType === opt.type
                            ? 'bg-teal-50 border-teal-600 text-teal-900 shadow-2xs'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <opt.icon className="w-4 h-4 text-teal-600 shrink-0" />
                        <span>{opt.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Inpatient Bed Confirmation */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex items-center justify-between">
                  <span className="text-slate-500">Requesting Bed:</span>
                  <span className="font-bold text-slate-900">Bed {currentPatient.bed_id} ({currentPatient.ward_id})</span>
                </div>

                {/* Additional Details Notes */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Additional Details / Notes (Optional):
                  </label>
                  <textarea
                    rows={3}
                    placeholder="e.g. Please bring an extra pillow, or assist with walking to restroom..."
                    value={assistanceNotes}
                    onChange={(e) => setAssistanceNotes(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingAssistance}
                  className="w-full py-3.5 px-4 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center space-x-2"
                >
                  <Send className="w-4 h-4" />
                  <span>{submittingAssistance ? 'Submitting Request...' : 'Send Assistance Request to Nurse'}</span>
                </button>
              </form>
            </div>

            {/* Live Status of Submitted Requests */}
            <div className="lg:col-span-6 bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <Clock className="w-5 h-5 text-teal-600" />
                <span>My Active Assistance Requests</span>
              </h3>

              {myAssistanceRequests.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">
                  No previous assistance requests. Use the form to submit one.
                </div>
              ) : (
                <div className="space-y-3">
                  {myAssistanceRequests.map((req) => (
                    <div
                      key={req.request_id}
                      className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-[11px] font-bold text-slate-700">
                            {req.request_id}
                          </span>
                          <span className="font-bold text-xs text-slate-900">{req.type}</span>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            req.status === 'Completed'
                              ? 'bg-emerald-100 text-emerald-800'
                              : req.status === 'In Progress'
                              ? 'bg-blue-100 text-blue-800'
                              : req.status === 'Acknowledged'
                              ? 'bg-teal-100 text-teal-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {req.status}
                        </span>
                      </div>

                      {req.notes && (
                        <p className="text-xs text-slate-600 italic">"{req.notes}"</p>
                      )}

                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-200/60">
                        <span>Submitted: {new Date(req.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        {req.assigned_nurse && (
                          <span className="font-medium text-teal-700">Assigned: {req.assigned_nurse}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 7: DYNAMIC PROFILE */}
      {/* ======================================================== */}
      {activeTab === 'profile' && (
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 rounded-2xl bg-teal-600 text-white flex items-center justify-center font-bold text-2xl shadow-xs shrink-0">
                  {currentPatient.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase()}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">{currentPatient.name}</h2>
                  <p className="text-xs text-teal-700 font-semibold">Patient ID: {currentPatient.patient_id}</p>
                  <p className="text-xs text-slate-500">
                    Bed: <span className="font-bold text-slate-800">{currentPatient.bed_id}</span> • {currentPatient.ward_id}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setIsEditingProfile(!isEditingProfile)}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors"
                >
                  {isEditingProfile ? 'Cancel Edit' : 'Edit Profile'}
                </button>
                <button
                  onClick={logout}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors flex items-center space-x-1"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>

            {/* Profile Edit Form */}
            {isEditingProfile ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  updatePatientProfile(profileForm);
                  setIsEditingProfile(false);
                }}
                className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-4 text-xs"
              >
                <h4 className="font-bold text-slate-900 text-sm">Edit Patient Details</h4>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-medium"
                    required
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Emergency Contact</label>
                    <input
                      type="text"
                      value={profileForm.emergency_contact}
                      onChange={(e) =>
                        setProfileForm({ ...profileForm, emergency_contact: e.target.value })
                      }
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-medium"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Attendant Name</label>
                    <input
                      type="text"
                      value={profileForm.attendant_name}
                      onChange={(e) =>
                        setProfileForm({ ...profileForm, attendant_name: e.target.value })
                      }
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-medium"
                    />
                  </div>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Clinical / Condition Summary</label>
                  <textarea
                    rows={2}
                    value={profileForm.condition_summary}
                    onChange={(e) =>
                      setProfileForm({ ...profileForm, condition_summary: e.target.value })
                    }
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-medium"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl transition-colors shadow-2xs"
                >
                  Save Profile Changes
                </button>
              </form>
            ) : null}

            {/* Dynamic Bed Reassignment in Profile */}
            <div className="p-4 rounded-2xl bg-teal-50/70 border border-teal-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold">
                  <BedDouble className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-teal-900 font-bold block">Dynamic Bed Assignment</span>
                  <span className="text-teal-700 text-[11px]">
                    Current Bed: <strong className="text-teal-950">{currentPatient.bed_id}</strong> ({currentPatient.ward_id})
                  </span>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <select
                  value={currentPatient.bed_id}
                  onChange={(e) => updatePatientBed(e.target.value)}
                  className="py-1.5 px-3 bg-white border border-teal-300 rounded-xl text-xs font-bold text-teal-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  {state.beds.map((b) => (
                    <option key={b.id} value={b.id}>
                      Bed {b.id} ({b.ward})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Dynamic Patient Details */}
            <div className="space-y-3 pt-2 text-xs">
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">Age & Gender:</span>
                <span className="font-bold text-slate-900">
                  {currentPatient.age} Years • {currentPatient.gender}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">Admission Date:</span>
                <span className="font-bold text-slate-900">{currentPatient.admission_date}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">Primary Attending Doctor:</span>
                <span className="font-bold text-slate-900">{currentPatient.primary_doctor}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">Primary Attendant:</span>
                <span className="font-bold text-slate-900">{currentPatient.attendant_name}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">Attendant Contact:</span>
                <span className="font-bold text-slate-900">{currentPatient.attendant_phone}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">Emergency Contact:</span>
                <span className="font-bold text-slate-900">{currentPatient.emergency_contact}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">Connected IoT Bed Unit:</span>
                <span className="font-mono font-bold text-teal-700">
                  ESP8266-BED-{currentPatient.bed_id.replace('-', '')}
                </span>
              </div>
              <div className="pt-2">
                <span className="text-slate-500 block mb-1">Clinical Notes:</span>
                <p className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-slate-700 leading-relaxed">
                  {currentPatient.condition_summary}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
