import React from 'react';
import {
  Activity,
  AlertTriangle,
  Bell,
  Cpu,
  LogOut,
  RotateCcw,
  Shield,
  Stethoscope,
  User,
  Volume2,
  VolumeX,
  Wifi,
} from 'lucide-react';
import { useHospital } from '../../context/HospitalContext.tsx';
import { UserRole } from '../../types.ts';

export const Header: React.FC = () => {
  const {
    currentRole,
    setCurrentRole,
    currentUser,
    currentPatient,
    currentNurse,
    muted,
    setMuted,
    setIsIotSimulatorOpen,
    isNotificationsOpen,
    setIsNotificationsOpen,
    state,
    liveEmergencies,
    resetDatabase,
    sseConnected,
    logout,
  } = useHospital();

  const unreadCount = state.notifications.filter((n) => !n.read_status).length;
  const activeEmergenciesCount = liveEmergencies.length;

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18">
          {/* Hospital Logo & Identity */}
          <div className="flex items-center space-x-3">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-teal-600 text-white shadow-xs">
              <Activity className="w-6 h-6 stroke-[2.5]" />
              {sseConnected && (
                <span
                  title="Real-time Telemetry Live"
                  className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full animate-pulse"
                />
              )}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-lg sm:text-xl font-bold tracking-tight text-slate-900">
                  SmartCare<span className="text-teal-600">Hospital</span>
                </span>
                <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-teal-50 text-teal-700 border border-teal-200">
                  IoT Connected
                </span>
              </div>
              <p className="text-[11px] text-slate-700 font-medium hidden sm:block">
                Patient Assistance, Indoor Navigation & Emergency Response
              </p>
            </div>
          </div>

          {/* User Role Switcher */}
          <div className="flex items-center bg-slate-100/90 p-1 rounded-xl border border-slate-200">
            <button
              id="role-patient-btn"
              onClick={() => setCurrentRole('patient')}
              className={`flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                currentRole === 'patient'
                  ? 'bg-white text-teal-800 shadow-xs'
                  : 'text-slate-800 hover:text-slate-900'
              }`}
              title="Switch to Patient Portal"
            >
              <User className="w-3.5 h-3.5" />
              <span>Patient</span>
              <span className="hidden lg:inline text-[10px] text-teal-800 font-medium">({currentPatient.patient_id})</span>
            </button>

            <button
              id="role-nurse-btn"
              onClick={() => setCurrentRole('nurse')}
              className={`relative flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                currentRole === 'nurse'
                  ? 'bg-white text-teal-800 shadow-xs'
                  : 'text-slate-800 hover:text-slate-900'
              }`}
              title="Switch to Nurse Station Console"
            >
              <Stethoscope className="w-3.5 h-3.5" />
              <span>Nurse</span>
              {activeEmergenciesCount > 0 && (
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-600" />
                </span>
              )}
            </button>

            <button
              id="role-admin-btn"
              onClick={() => setCurrentRole('admin')}
              className={`flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                currentRole === 'admin'
                  ? 'bg-white text-teal-800 shadow-xs'
                  : 'text-slate-800 hover:text-slate-900'
              }`}
              title="Switch to Admin Management Dashboard"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Admin</span>
            </button>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center space-x-1 sm:space-x-2">
            {/* Active Emergency Alert Badge (Global) */}
            {activeEmergenciesCount > 0 && (
              <div
                id="header-emergency-pill"
                onClick={() => setCurrentRole('nurse')}
                className="cursor-pointer flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 animate-pulse text-xs font-bold"
                title={`${activeEmergenciesCount} active emergency alert(s). Click to view in Nurse console.`}
              >
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                <span>{activeEmergenciesCount} Emergency</span>
              </div>
            )}

            {/* ESP8266 IoT Simulator Trigger */}
            <button
              id="open-iot-simulator-btn"
              onClick={() => setIsIotSimulatorOpen(true)}
              className="flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-medium transition-colors"
              title="Open ESP8266 IoT Hardware Simulator & API Testbench"
            >
              <Cpu className="w-3.5 h-3.5 text-indigo-600" />
              <span className="hidden sm:inline">ESP8266 IoT</span>
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
            </button>

            {/* Audio Toggle */}
            <button
              id="sound-toggle-btn"
              onClick={() => setMuted((prev) => !prev)}
              className="p-2 rounded-lg text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              title={muted ? 'Unmute alert sounds' : 'Mute alert sounds'}
              aria-label={muted ? 'Unmute alert chimes' : 'Mute alert chimes'}
            >
              {muted ? <VolumeX className="w-4 h-4 text-slate-500" /> : <Volume2 className="w-4 h-4 text-teal-600" />}
            </button>

            {/* Notifications Dropdown Toggle */}
            <button
              id="notifications-toggle-btn"
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className="relative p-2 rounded-lg text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              title="Notifications & Alerts"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-rose-600 rounded-full">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Reset Demo Button */}
            <button
              id="reset-demo-btn"
              onClick={resetDatabase}
              className="hidden lg:flex items-center space-x-1 px-2 py-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 text-xs transition-colors"
              title="Reset Hospital Database to Initial Demo State"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>

            {/* User Profile Capsule with Dynamic Info and Sign Out */}
            <div className="hidden sm:flex items-center pl-2 border-l border-slate-200 text-xs space-x-2">
              <div className="flex items-center">
                <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold mr-2 text-[11px]">
                  {currentRole === 'patient' ? 'P' : currentRole === 'nurse' ? 'RN' : 'AD'}
                </div>
                <div className="text-left leading-tight hidden xl:block">
                  <div className="font-semibold text-slate-900">
                    {currentRole === 'patient'
                      ? currentPatient.name
                      : currentRole === 'nurse'
                      ? currentNurse.name
                      : currentUser.name}
                  </div>
                  <div className="text-[10px] text-slate-700">
                    {currentRole === 'patient'
                      ? `Bed ${currentPatient.bed_id} • ${currentPatient.ward_id}`
                      : currentRole === 'nurse'
                      ? `${currentNurse.assigned_ward} • Station 1`
                      : 'System Administrator'}
                  </div>
                </div>
              </div>
              <button
                onClick={logout}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                title="Sign out / Switch account"
                aria-label="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
