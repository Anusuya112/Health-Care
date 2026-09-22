import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  HeartPulse,
  PhoneCall,
  ShieldAlert,
  UserCheck,
  X,
} from 'lucide-react';
import { useHospital } from '../../context/HospitalContext.tsx';
import { EmergencyStatus } from '../../types.ts';

export const EmergencyDialog: React.FC = () => {
  const {
    isEmergencyDialogOpen,
    setIsEmergencyDialogOpen,
    currentPatient,
    triggerEmergency,
    activeEmergencyForPatient,
    updateEmergencyStatus,
  } = useHospital();

  const [confirming, setConfirming] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  // If there's an ongoing active emergency, jump straight to the tracker
  useEffect(() => {
    if (activeEmergencyForPatient) {
      setConfirming(false);
    } else {
      setConfirming(true);
    }
  }, [activeEmergencyForPatient, isEmergencyDialogOpen]);

  // Live timer for active emergency
  useEffect(() => {
    if (!activeEmergencyForPatient || activeEmergencyForPatient.status === 'Completed') {
      setElapsedSeconds(0);
      return;
    }

    const startTs = new Date(activeEmergencyForPatient.created_at).getTime();
    const updateElapsed = () => {
      const now = Date.now();
      const diff = Math.max(0, Math.floor((now - startTs) / 1000));
      setElapsedSeconds(diff);
    };

    updateElapsed();
    const timer = setInterval(updateElapsed, 1000);
    return () => clearInterval(timer);
  }, [activeEmergencyForPatient]);

  if (!isEmergencyDialogOpen) return null;

  const handleConfirmEmergency = async () => {
    setSubmitting(true);
    try {
      await triggerEmergency({
        bed_id: currentPatient.bed_id,
        notes: 'Emergency button triggered from Patient Portal UI.',
      });
      setConfirming(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const statusSteps: EmergencyStatus[] = [
    'Request Sent',
    'Nurse Notified',
    'Nurse Acknowledged',
    'Assistance in Progress',
    'Completed',
  ];

  const currentStatus = activeEmergencyForPatient?.status || 'Request Sent';
  const currentStepIndex = statusSteps.indexOf(currentStatus);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
      {/* Dimmed backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
        onClick={() => {
          if (!submitting) setIsEmergencyDialogOpen(false);
        }}
      />

      <div className="relative bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 z-10 overflow-hidden">
        {confirming ? (
          /* CONFIRMATION DIALOG */
          <div className="text-center space-y-5">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-rose-100 border border-rose-200 text-rose-600 flex items-center justify-center shadow-inner animate-pulse">
              <AlertTriangle className="w-9 h-9 stroke-[2.5]" />
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-slate-900 tracking-tight">
                Do you need immediate assistance?
              </h3>
              <p className="text-sm text-slate-600 max-w-sm mx-auto">
                Pressing confirm will immediately broadcast an urgent emergency alert to the Nurse Station for{' '}
                <span className="font-semibold text-slate-900">Bed {currentPatient.bed_id}</span> ({currentPatient.ward_id}).
              </p>
            </div>

            {/* Inpatient Summary Pill */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 text-xs text-slate-600 flex justify-around">
              <div>
                <span className="text-slate-500 block">Patient</span>
                <span className="font-semibold text-slate-900">{currentPatient.name}</span>
              </div>
              <div className="border-r border-slate-200" />
              <div>
                <span className="text-slate-500 block">Bed Number</span>
                <span className="font-semibold text-rose-600">{currentPatient.bed_id}</span>
              </div>
              <div className="border-r border-slate-200" />
              <div>
                <span className="text-slate-500 block">Ward Unit</span>
                <span className="font-semibold text-slate-900">{currentPatient.ward_id}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsEmergencyDialogOpen(false)}
                className="w-full py-3.5 px-4 rounded-xl border border-slate-300 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleConfirmEmergency}
                className="w-full py-3.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center space-x-2"
              >
                {submitting ? (
                  <span>Sending Alert...</span>
                ) : (
                  <>
                    <ShieldAlert className="w-4 h-4" />
                    <span>Confirm Emergency</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          /* ACTIVE EMERGENCY TRACKER */
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center">
                  <HeartPulse className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Emergency Alert Active
                  </h3>
                  <p className="text-xs text-rose-600 font-medium">
                    Your emergency request has been sent to the nurse station.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsEmergencyDialogOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Request Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
              <div>
                <span className="text-[10px] text-slate-600 uppercase font-semibold">Request ID</span>
                <p className="font-mono font-bold text-slate-900">
                  {activeEmergencyForPatient?.request_id || 'EMG-LIV'}
                </p>
              </div>
              <div>
                <span className="text-[10px] text-slate-600 uppercase font-semibold">Patient ID</span>
                <p className="font-semibold text-slate-900">{currentPatient.patient_id}</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-600 uppercase font-semibold">Bed Number</span>
                <p className="font-bold text-rose-600">{currentPatient.bed_id}</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-600 uppercase font-semibold">Elapsed Time</span>
                <p className="font-mono font-bold text-slate-900 flex items-center space-x-1">
                  <Clock className="w-3 h-3 text-rose-500" />
                  <span>{formatTimer(elapsedSeconds)}</span>
                </p>
              </div>
            </div>

            {/* Stepper Status Indicator */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                Current Status
              </h4>
              <div className="space-y-2.5">
                {statusSteps.map((step, idx) => {
                  const isDone = idx <= currentStepIndex;
                  const isCurrent = idx === currentStepIndex;

                  return (
                    <div
                      key={step}
                      className={`flex items-center space-x-3 p-2.5 rounded-xl transition-all ${
                        isCurrent
                          ? 'bg-rose-50 border border-rose-200 text-rose-950 font-bold shadow-2xs'
                          : isDone
                          ? 'bg-emerald-50/70 text-emerald-900 font-medium'
                          : 'bg-slate-50/50 text-slate-600'
                      }`}
                    >
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          isDone
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-200 text-slate-500'
                        }`}
                      >
                        {isDone ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                      </div>
                      <div className="flex-1 flex items-center justify-between">
                        <span className="text-xs">{step}</span>
                        {isCurrent && (
                          <span className="text-[11px] font-semibold text-rose-600 animate-pulse">
                            Active State
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Assigned Nurse Card if Acknowledged */}
            {activeEmergencyForPatient?.assigned_nurse && (
              <div className="p-3 bg-teal-50 rounded-xl border border-teal-200 flex items-center space-x-3">
                <div className="w-9 h-9 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold text-xs">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-teal-700">Responding Nurse</span>
                  <p className="text-xs font-bold text-slate-900">{activeEmergencyForPatient.assigned_nurse}</p>
                  <p className="text-[11px] text-teal-700">En route to Bed {currentPatient.bed_id}</p>
                </div>
              </div>
            )}

            {/* Assistance Completed Banner */}
            {currentStatus === 'Completed' ? (
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                <h4 className="text-sm font-bold text-emerald-950">Assistance Successfully Completed</h4>
                <p className="text-xs text-emerald-700">
                  Response logged in {activeEmergencyForPatient?.response_time_seconds || elapsedSeconds} seconds.
                </p>
                <button
                  onClick={() => setIsEmergencyDialogOpen(false)}
                  className="mt-2 px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700"
                >
                  Close Tracker
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between pt-2">
                <p className="text-xs text-slate-500">
                  Stay calm. Medical personnel have been summoned.
                </p>
                <button
                  onClick={() => setIsEmergencyDialogOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg hover:bg-slate-50"
                >
                  Minimize Window
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
