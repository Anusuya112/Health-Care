import React from 'react';
import { HospitalProvider, useHospital } from './context/HospitalContext.tsx';
import { Header } from './components/common/Header.tsx';
import { NotificationsDrawer } from './components/common/NotificationsDrawer.tsx';
import { IotSimulatorModal } from './components/common/IotSimulatorModal.tsx';
import { PatientPortal } from './components/patient/PatientPortal.tsx';
import { NurseDashboard } from './components/nurse/NurseDashboard.tsx';
import { AdminDashboard } from './components/admin/AdminDashboard.tsx';
import { LoginPage } from './components/auth/LoginPage.tsx';
import { AlertTriangle, ChevronRight } from 'lucide-react';

const HospitalMain: React.FC = () => {
  const { currentRole, liveEmergencies, setCurrentRole, isAuthenticated } = useHospital();

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen bg-slate-50/60 text-slate-800 flex flex-col font-sans selection:bg-teal-500 selection:text-white antialiased">
      {/* Universal Clinical Header */}
      <Header />

      {/* Global Critical Emergency Banner for Nurse & Admin Views */}
      {currentRole !== 'patient' && liveEmergencies.length > 0 && (
        <div className="bg-rose-600 text-white px-4 py-2.5 shadow-md flex items-center justify-between text-xs sm:text-sm font-bold animate-pulse sticky top-16 z-30">
          <div className="flex items-center space-x-2.5 max-w-4xl mx-auto w-full justify-between">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 animate-bounce shrink-0" />
              <span>
                CRITICAL ALERT: {liveEmergencies.length} Active Emergency Call
                {liveEmergencies.length > 1 ? 's' : ''} at Bed {liveEmergencies.map((e) => e.bed_id).join(', ')} ({liveEmergencies[0].ward})
              </span>
            </div>

            {currentRole === 'admin' && (
              <button
                onClick={() => setCurrentRole('nurse')}
                className="px-3 py-1 bg-white text-rose-700 rounded-lg text-xs font-bold hover:bg-rose-50 flex items-center space-x-1 shrink-0"
              >
                <span>Go to Nurse Station</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main Role Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {currentRole === 'patient' && <PatientPortal />}
        {currentRole === 'nurse' && <NurseDashboard />}
        {currentRole === 'admin' && <AdminDashboard />}
      </main>

      {/* Slide-out Drawers and Floating Modals */}
      <NotificationsDrawer />
      <IotSimulatorModal />

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200/80 bg-white py-4 px-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>
            SmartCare Hospital Patient Assistance & Navigation System • ESP8266 IoT Bedside Telemetry Integration
          </p>
          <p className="text-[11px] text-slate-400">
            For medical emergencies, immediate clinical assistance is dispatched to bedside units.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <HospitalProvider>
      <HospitalMain />
    </HospitalProvider>
  );
}
