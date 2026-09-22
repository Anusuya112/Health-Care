import React, { useState, useEffect } from 'react';
import {
  Compass,
  CornerDownRight,
  Layers,
  MapPin,
  Maximize2,
  Navigation,
  Sparkles,
  Volume2,
  X,
  Info,
} from 'lucide-react';
import { useHospital } from '../context/HospitalContext.tsx';
import { Facility } from '../types.ts';

interface HospitalMapProps {
  initialFloor?: number;
  highlightFacility?: Facility | null;
  onSelectFacility?: (facility: Facility) => void;
  showDirectionsPanel?: boolean;
}

export const HospitalMap: React.FC<HospitalMapProps> = ({
  initialFloor = 2, // Default to Ward A floor for patient
  highlightFacility,
  onSelectFacility,
  showDirectionsPanel = true,
}) => {
  const { state, currentPatient, activeDestination, setActiveDestination } = useHospital();
  const selectedDest = highlightFacility || activeDestination;

  // Selected floor state (0, 1, 2, 3)
  const [selectedFloor, setSelectedFloor] = useState<number>(() => {
    if (selectedDest && typeof selectedDest.floor === 'number') {
      return selectedDest.floor;
    }
    // Match floor of patient's bed if known
    if (currentPatient?.bed_id?.startsWith('B') || currentPatient?.bed_id?.startsWith('C')) {
      return 1;
    }
    return initialFloor;
  });

  // Ensure map opens directly in the route view with an active destination
  useEffect(() => {
    if (!selectedDest && state.facilities.length > 0) {
      // Find facility on current floor or nurse station
      const defaultFacility =
        state.facilities.find((f) => f.facility_id === 'FAC-NS-A') ||
        state.facilities.find((f) => f.floor === selectedFloor) ||
        state.facilities[0];
      if (defaultFacility) {
        setActiveDestination(defaultFacility);
      }
    }
  }, [selectedDest, state.facilities, selectedFloor, setActiveDestination]);

  // Sync floor if active destination changes
  useEffect(() => {
    if (selectedDest && typeof selectedDest.floor === 'number') {
      setSelectedFloor(selectedDest.floor);
    }
  }, [selectedDest]);

  const handleFacilityClick = (facility: Facility) => {
    setActiveDestination(facility);
    if (onSelectFacility) {
      onSelectFacility(facility);
    }
  };

  const facilitiesOnCurrentFloor = state.facilities.filter((f) => f.floor === selectedFloor);

  // Calculate dynamic start point and route path
  const patientBed = currentPatient.bed_id || 'A-204';
  const patientBedFloor =
    patientBed.startsWith('B') || patientBed.startsWith('C') ? 1 : 2;
  const isPatientBedFloor = selectedFloor === patientBedFloor;

  let startX = 560; // Central Elevator corridor hub
  let startY = 300;
  let startLabel = `Start: Central Elevator (L${selectedFloor === 0 ? 'G' : selectedFloor})`;

  if (isPatientBedFloor) {
    startX = 490;
    startY = patientBed.startsWith('B') ? 205 : 350;
    startLabel = `You (Bed ${patientBed})`;
  } else if (selectedFloor === 0) {
    startX = 170;
    startY = 490;
    startLabel = 'Start: Main Hospital Entrance';
  }

  const destX = selectedDest?.coordinates?.x ? selectedDest.coordinates.x * 10 : 632;
  const destY = selectedDest?.coordinates?.y ? selectedDest.coordinates.y * 6 : 300;

  // Compute accurate orthogonal corridor path
  let dynamicRoutePathD = '';
  if (selectedDest && selectedDest.floor === selectedFloor) {
    if (startX === destX && startY === destY) {
      dynamicRoutePathD = `M ${startX} ${startY} L ${destX} ${destY}`;
    } else {
      // Route: From room/bed (startX, startY) to central corridor (startX, 300) -> along corridor to (destX, 300) -> into destination room (destX, destY)
      dynamicRoutePathD = `M ${startX} ${startY} L ${startX} 300 L ${destX} 300 L ${destX} ${destY}`;
    }
  }

  // Floor metadata
  const floorDetails: Record<number, { title: string; subtitle: string; blocks: string }> = {
    0: {
      title: 'Ground Floor',
      subtitle: 'Main Atrium, Emergency, Registration, Pharmacy & Cafeteria',
      blocks: 'Block A (Main Lobby) • Block B (Radiology & ER) • Block C (Cafeteria)',
    },
    1: {
      title: '1st Floor',
      subtitle: 'Ward B (Surgical), Clinical Pathology Lab & OPD Clinics',
      blocks: 'Block A (Internal Med OPD) • Block B (Ward B) • Block C (Labs)',
    },
    2: {
      title: '2nd Floor',
      subtitle: 'Ward A (Cardiology & Acute Care), Cardiac Telemetry & Nurse Station A',
      blocks: 'Block A (Consultations) • Block B (Ward A & Bed A-204) • Block C (Pediatrics)',
    },
    3: {
      title: '3rd Floor',
      subtitle: 'Neurology, Oncology, Executive Health & Hospital Administration',
      blocks: 'Block A (Admin Suites) • Block B (Neurology Wing) • Block C (Oncology Infusion)',
    },
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
      {/* Map Control Bar */}
      <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-xs">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <span>Interactive Indoor Navigation</span>
              <span className="text-[11px] font-medium text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                Floor {selectedFloor === 0 ? 'G' : selectedFloor}
              </span>
            </h3>
            <p className="text-xs text-slate-700">
              {floorDetails[selectedFloor]?.subtitle}
            </p>
          </div>
        </div>

        {/* Floor Switcher Buttons */}
        <div className="flex items-center bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-600 px-2 flex items-center">
            <Layers className="w-3.5 h-3.5 mr-1 text-slate-600" /> Floor:
          </span>
          {[0, 1, 2, 3].map((floor) => (
            <button
              key={floor}
              onClick={() => setSelectedFloor(floor)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                selectedFloor === floor
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'text-slate-800 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {floor === 0 ? 'Ground' : `L${floor}`}
            </button>
          ))}
        </div>
      </div>

      {/* Main Map Stage and Wayfinding Details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[460px]">
        {/* SVG Interactive Architectural Map */}
        <div className="lg:col-span-8 p-4 bg-slate-900/5 relative flex items-center justify-center overflow-hidden">
          {/* Map Canvas Background Container */}
          <div className="w-full max-w-2xl aspect-[16/10] bg-white rounded-xl border border-slate-200/90 shadow-sm relative p-4 select-none">
            {/* Compass Rose */}
            <div className="absolute top-3 right-3 flex items-center space-x-1 text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded border border-slate-200">
              <span>N</span>
              <Navigation className="w-3 h-3 text-teal-600 rotate-45" />
            </div>

            {/* Architectural Layout SVG */}
            <svg
              viewBox="0 0 1000 600"
              className="w-full h-full"
              style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.04))' }}
            >
              {/* Grid Lines subtle */}
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#f1f5f9" strokeWidth="1" />
                </pattern>
                {/* Route Glow Filter */}
                <filter id="routeGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              <rect width="1000" height="600" fill="url(#grid)" />

              {/* Building Blocks */}
              {/* Block A - Left Wing */}
              <rect x="40" y="60" width="260" height="480" rx="12" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="2" />
              <text x="60" y="95" fill="#475569" fontSize="16" fontWeight="bold">BLOCK A</text>
              <text x="60" y="115" fill="#94a3b8" fontSize="11">
                {selectedFloor === 0 ? 'Main Lobby & Billing' : selectedFloor === 1 ? 'Outpatient Specialty' : 'Consulting Suites'}
              </text>

              {/* Central Concourse / Skyway */}
              <rect x="300" y="240" width="120" height="120" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="4 2" />
              <text x="360" y="305" fill="#94a3b8" fontSize="10" textAnchor="middle" fontWeight="bold">CENTRAL SKYWAY</text>

              {/* Block B - Center High-Rise (Wards & Diagnostics) */}
              <rect x="420" y="60" width="280" height="480" rx="12" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="2" />
              <text x="440" y="95" fill="#475569" fontSize="16" fontWeight="bold">BLOCK B</text>
              <text x="440" y="115" fill="#94a3b8" fontSize="11">
                {selectedFloor === 0 ? 'Diagnostic Imaging & ER' : selectedFloor === 1 ? 'Ward B (Surgical)' : 'Ward A (Cardiology Telemetry)'}
              </text>

              {/* Concourse B to C */}
              <rect x="700" y="240" width="80" height="120" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="4 2" />

              {/* Block C - East Pavilion */}
              <rect x="780" y="60" width="180" height="480" rx="12" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="2" />
              <text x="800" y="95" fill="#475569" fontSize="16" fontWeight="bold">BLOCK C</text>
              <text x="800" y="115" fill="#94a3b8" fontSize="11">
                {selectedFloor === 0 ? 'Cafeteria & Garden' : selectedFloor === 1 ? 'Pathology Lab' : 'Pediatric Wing'}
              </text>

              {/* Internal Corridors */}
              <path d="M 170 140 L 170 500" stroke="#e2e8f0" strokeWidth="24" strokeLinecap="round" />
              <path d="M 560 140 L 560 500" stroke="#e2e8f0" strokeWidth="24" strokeLinecap="round" />
              <path d="M 870 140 L 870 500" stroke="#e2e8f0" strokeWidth="24" strokeLinecap="round" />
              <path d="M 170 300 L 870 300" stroke="#e2e8f0" strokeWidth="28" strokeLinecap="round" />

              {/* Rooms & Bays in Block B */}
              {selectedFloor === 2 && (
                <>
                  {/* Ward A Rooms */}
                  <rect x="440" y="150" width="100" height="70" rx="6" fill="#ecfdf5" stroke="#6ee7b7" strokeWidth="1.5" />
                  <text x="490" y="180" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#065f46">Room 201</text>
                  <text x="490" y="196" textAnchor="middle" fontSize="9" fill="#047857">Bed A-201</text>

                  <rect x="440" y="230" width="100" height="70" rx="6" fill="#f0fdfa" stroke="#5eead4" strokeWidth="1.5" />
                  <text x="490" y="260" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#0f766e">Room 203</text>
                  <text x="490" y="276" textAnchor="middle" fontSize="9" fill="#0f766e">Cleaning</text>

                  {/* Bed A-204 (Patient Vance's Room) */}
                  <rect
                    x="440"
                    y="310"
                    width="100"
                    height="75"
                    rx="6"
                    fill="#e0f2fe"
                    stroke="#0284c7"
                    strokeWidth="2.5"
                    className="transition-all"
                  />
                  <text x="490" y="340" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#0369a1">Room 204</text>
                  <text x="490" y="358" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#0284c7">Bed A-204 ★</text>

                  <rect x="440" y="395" width="100" height="70" rx="6" fill="#ecfdf5" stroke="#6ee7b7" strokeWidth="1.5" />
                  <text x="490" y="425" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#065f46">Room 205</text>
                  <text x="490" y="441" textAnchor="middle" fontSize="9" fill="#047857">Bed A-205</text>

                  {/* Nurse Station A (Center) */}
                  <rect x="580" y="260" width="105" height="80" rx="8" fill="#f0fdf4" stroke="#16a34a" strokeWidth="2" />
                  <text x="632" y="295" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#15803d">Nurse Station A</text>
                  <text x="632" y="312" textAnchor="middle" fontSize="9" fill="#166534">Active Duty</text>

                  {/* Elevator Bank B */}
                  <rect x="580" y="160" width="80" height="60" rx="6" fill="#f8fafc" stroke="#94a3b8" strokeWidth="1.5" />
                  <text x="620" y="195" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#475569">Elevator B</text>
                </>
              )}

              {/* Ground Floor Rooms */}
              {selectedFloor === 0 && (
                <>
                  {/* Main Entrance */}
                  <rect x="110" y="490" width="120" height="40" rx="6" fill="#f0fdf4" stroke="#22c55e" strokeWidth="2" />
                  <text x="170" y="515" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#15803d">MAIN ENTRANCE</text>

                  {/* Billing Desk */}
                  <rect x="70" y="360" width="85" height="90" rx="6" fill="#eff6ff" stroke="#3b82f6" strokeWidth="1.5" />
                  <text x="112" y="405" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#1d4ed8">Billing Desk</text>
                  <text x="112" y="420" textAnchor="middle" fontSize="9" fill="#2563eb">Counters 1-6</text>

                  {/* Registration */}
                  <rect x="70" y="230" width="85" height="90" rx="6" fill="#f5f3ff" stroke="#8b5cf6" strokeWidth="1.5" />
                  <text x="112" y="275" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#6d28d9">Reception</text>
                  <text x="112" y="290" textAnchor="middle" fontSize="9" fill="#7c3aed">Check-in</text>

                  {/* Pharmacy */}
                  <rect x="440" y="340" width="110" height="100" rx="8" fill="#f0fdf4" stroke="#16a34a" strokeWidth="2" />
                  <text x="495" y="390" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#15803d">24/7 Pharmacy</text>
                  <text x="495" y="408" textAnchor="middle" fontSize="9" fill="#166534">Room G-04</text>

                  {/* Cafeteria Block C */}
                  <rect x="800" y="200" width="140" height="240" rx="10" fill="#fffbeb" stroke="#f59e0b" strokeWidth="2" />
                  <text x="870" y="310" textAnchor="middle" fontSize="13" fontWeight="bold" fill="#b45309">Cafeteria</text>
                  <text x="870" y="330" textAnchor="middle" fontSize="10" fill="#d97706">Garden Dining</text>
                </>
              )}

              {/* 1st Floor Rooms */}
              {selectedFloor === 1 && (
                <>
                  {/* Lab */}
                  <rect x="800" y="180" width="140" height="150" rx="8" fill="#f5f3ff" stroke="#a855f7" strokeWidth="2" />
                  <text x="870" y="250" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#7e22ce">Pathology Lab</text>
                  <text x="870" y="268" textAnchor="middle" fontSize="9" fill="#9333ea">Sample Collection</text>

                  {/* Ward B */}
                  <rect x="440" y="160" width="100" height="90" rx="6" fill="#ecfdf5" stroke="#6ee7b7" strokeWidth="1.5" />
                  <text x="490" y="205" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#065f46">Ward B</text>
                  <text x="490" y="222" textAnchor="middle" fontSize="9" fill="#047857">Bed B-101</text>
                </>
              )}

              {/* ROUTE HIGHLIGHT POLYLINE (Dynamic Wayfinding path) */}
              {selectedDest && selectedDest.floor === selectedFloor && (
                <g>
                  {/* Dynamic path calculated based on exact start and destination coordinates */}
                  <path
                    d={dynamicRoutePathD}
                    fill="none"
                    stroke="#0d9488"
                    strokeWidth="5"
                    strokeDasharray="8 4"
                    strokeLinecap="round"
                    filter="url(#routeGlow)"
                    className="animate-[dash_20s_linear_infinite]"
                  />

                  {/* Start Point Pin */}
                  <circle
                    cx={startX}
                    cy={startY}
                    r="8"
                    fill="#0284c7"
                    stroke="#ffffff"
                    strokeWidth="3"
                  />
                  <text
                    cx={startX}
                    cy={startY > 400 ? startY - 15 : startY + 25}
                    fontSize="10"
                    fontWeight="bold"
                    fill="#0369a1"
                    textAnchor="middle"
                  >
                    {startLabel}
                  </text>

                  {/* Destination Marker Ring and Pin */}
                  <circle
                    cx={destX}
                    cy={destY}
                    r="14"
                    fill="#0d9488"
                    fillOpacity="0.2"
                    className="animate-ping"
                  />
                  <circle
                    cx={destX}
                    cy={destY}
                    r="9"
                    fill="#0f766e"
                    stroke="#ffffff"
                    strokeWidth="3"
                  />
                  <text
                    cx={destX}
                    cy={destY > 300 ? destY + 22 : destY - 14}
                    fontSize="10"
                    fontWeight="bold"
                    fill="#0f766e"
                    textAnchor="middle"
                  >
                    {selectedDest.name.split('—')[0]}
                  </text>
                </g>
              )}

              {/* Point-of-Interest Markers on this floor */}
              {facilitiesOnCurrentFloor.map((fac) => {
                const cx = fac.coordinates?.x ? fac.coordinates.x * 10 : 500;
                const cy = fac.coordinates?.y ? fac.coordinates.y * 6 : 300;
                const isSelected = selectedDest?.facility_id === fac.facility_id;

                return (
                  <g
                    key={fac.facility_id}
                    onClick={() => handleFacilityClick(fac)}
                    className="cursor-pointer group"
                  >
                    <circle
                      cx={cx}
                      cy={cy}
                      r={isSelected ? 10 : 7}
                      fill={
                        fac.category === 'nurse_station'
                          ? '#16a34a'
                          : fac.category === 'pharmacy'
                          ? '#0284c7'
                          : fac.category === 'water'
                          ? '#06b6d4'
                          : fac.category === 'cafeteria'
                          ? '#d97706'
                          : fac.category === 'restroom'
                          ? '#8b5cf6'
                          : '#0d9488'
                      }
                      stroke="#ffffff"
                      strokeWidth="2.5"
                    />
                    <text
                      x={cx}
                      y={cy - 12}
                      fontSize="10"
                      fontWeight="bold"
                      textAnchor="middle"
                      fill="#1e293b"
                      className="opacity-90 group-hover:opacity-100 transition-opacity bg-white"
                    >
                      {fac.name.split('—')[0].split('(')[0].trim()}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Map Legend */}
            <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-xs p-2 rounded-lg border border-slate-200 shadow-xs flex flex-wrap items-center gap-3 text-[10px] text-slate-600">
              <span className="flex items-center space-x-1">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-600 inline-block" />
                <span>Destination</span>
              </span>
              <span className="flex items-center space-x-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" />
                <span>Nurse Station</span>
              </span>
              <span className="flex items-center space-x-1">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 inline-block" />
                <span>Water Point</span>
              </span>
              <span className="flex items-center space-x-1">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
                <span>Cafeteria</span>
              </span>
              <span className="flex items-center space-x-1">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block" />
                <span>Your Bed</span>
              </span>
            </div>
          </div>
        </div>

        {/* Right Side: Step-by-Step Wayfinding & Destination Card */}
        {showDirectionsPanel && (
          <div className="lg:col-span-4 p-5 bg-white border-t lg:border-t-0 lg:border-l border-slate-200 flex flex-col justify-between">
            {selectedDest ? (
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
                      Destination Selected
                    </span>
                    <h4 className="text-base font-bold text-slate-900 mt-1">{selectedDest.name}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {selectedDest.building} • Floor {selectedDest.floor === 0 ? 'G' : selectedDest.floor}
                      {selectedDest.room ? ` • ${selectedDest.room}` : ''}
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveDestination(null)}
                    className="p-1 rounded-md text-slate-400 hover:text-slate-600"
                    title="Clear destination"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Floor Notice if Destination is on different floor */}
                {selectedDest.floor !== selectedFloor && (
                  <div className="p-2.5 bg-teal-50 rounded-xl border border-teal-200 text-xs text-teal-900 flex items-center justify-between">
                    <span>Target location is on Floor {selectedDest.floor === 0 ? 'G' : selectedDest.floor}.</span>
                    <button
                      onClick={() => setSelectedFloor(selectedDest.floor)}
                      className="px-2.5 py-1 bg-teal-600 text-white rounded-lg font-bold text-[11px] hover:bg-teal-700 transition-colors"
                    >
                      View Floor {selectedDest.floor === 0 ? 'G' : selectedDest.floor} Map
                    </button>
                  </div>
                )}

                {/* Facility Info Card */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs text-slate-600 space-y-1.5">
                  <p className="leading-relaxed">{selectedDest.description}</p>
                  {selectedDest.opening_hours && (
                    <div className="flex items-center space-x-1.5 text-slate-700 font-medium pt-1 border-t border-slate-200/60">
                      <span className="text-[11px] text-slate-500">Hours:</span>
                      <span>{selectedDest.opening_hours}</span>
                    </div>
                  )}
                  {selectedDest.distance && (
                    <div className="flex items-center space-x-1.5 text-teal-700 font-medium">
                      <span className="text-[11px] text-slate-500">Estimated distance:</span>
                      <span>{selectedDest.distance}</span>
                    </div>
                  )}
                </div>

                {/* Step-by-Step Indoor Directions */}
                <div>
                  <h5 className="text-xs font-bold text-slate-900 flex items-center space-x-1.5 mb-2">
                    <Navigation className="w-3.5 h-3.5 text-teal-600" />
                    <span>Step-by-Step Indoor Directions</span>
                  </h5>
                  <div className="space-y-2">
                    {selectedDest.directions && selectedDest.directions.length > 0 ? (
                      selectedDest.directions.map((step, idx) => (
                        <div key={idx} className="flex items-start space-x-2.5 text-xs text-slate-700">
                          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-teal-100 text-teal-800 font-bold text-[10px] shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <span className="leading-snug">{step}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-500">
                        Proceed along the central concourse toward {selectedDest.building}.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center py-10 space-y-3">
                <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-teal-600" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Select a Location to Navigate</h4>
                  <p className="text-xs text-slate-500 max-w-xs mt-1">
                    Click any point-of-interest pin on the floor plan or choose a category below to trace your route from Bed A-204.
                  </p>
                </div>
              </div>
            )}

            {/* Quick Floor Facilities Chips */}
            <div className="pt-4 border-t border-slate-100">
              <span className="text-[11px] font-semibold text-slate-500 block mb-2">
                Points of Interest on Floor {selectedFloor === 0 ? 'Ground' : selectedFloor}:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {facilitiesOnCurrentFloor.slice(0, 6).map((fac) => (
                  <button
                    key={fac.facility_id}
                    onClick={() => handleFacilityClick(fac)}
                    className={`px-2 py-1 rounded-md text-[11px] font-medium border transition-colors ${
                      selectedDest?.facility_id === fac.facility_id
                        ? 'bg-teal-600 text-white border-teal-600'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    {fac.name.split('—')[0]}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
