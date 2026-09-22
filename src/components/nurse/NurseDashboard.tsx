import React, { useState, useEffect } from 'react';
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  BedDouble,
  Check,
  CheckCircle2,
  Clock,
  Filter,
  ListTodo,
  Plus,
  Radio,
  Search,
  ShieldAlert,
  Stethoscope,
  Timer,
  User,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
import { useHospital } from '../../context/HospitalContext.tsx';
import { Bed, BedStatus, EmergencyRequest, EmergencyStatus } from '../../types.ts';

type NurseTab = 'dashboard' | 'emergencies' | 'assistance' | 'beds' | 'tasks' | 'history';

export const NurseDashboard: React.FC = () => {
  const {
    state,
    currentNurse,
    liveEmergencies,
    pendingAssistanceRequests,
    updateEmergencyStatus,
    updateAssistanceStatus,
    updateBedStatus,
    toggleTask,
    createTask,
    setIsIotSimulatorOpen,
  } = useHospital();

  const [activeTab, setActiveTab] = useState<NurseTab>('dashboard');

  // Selected bed modal
  const [selectedBed, setSelectedBed] = useState<Bed | null>(null);

  // New task form state
  const [showNewTaskModal, setShowNewTaskModal] = useState<boolean>(false);
  const [newTaskTitle, setNewTaskTitle] = useState<string>('');
  const [newTaskBed, setNewTaskBed] = useState<string>('A-204');
  const [newTaskPatient, setNewTaskPatient] = useState<string>('Johnathan Vance');
  const [newTaskPriority, setNewTaskPriority] = useState<'High' | 'Medium' | 'Routine'>('High');
  const [newTaskTime, setNewTaskTime] = useState<string>('Immediate');

  // History filters
  const [historyPeriod, setHistoryPeriod] = useState<'today' | 'week' | 'month'>('today');
  const [historyType, setHistoryType] = useState<'all' | 'emergency' | 'assistance'>('all');

  // Live timer tick for waiting times
  const [now, setNow] = useState<number>(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Compute stats
  const activeEmergenciesCount = liveEmergencies.length;
  const pendingAssistanceCount = pendingAssistanceRequests.length;
  const activePatientsCount = state.beds.filter((b) => b.status === 'Occupied' || b.status === 'Emergency').length;
  const availableBedsCount = state.beds.filter((b) => b.status === 'Available').length;
  const pendingTasksCount = state.nurseTasks.filter((t) => !t.completed).length;

  const formatWaitingTimer = (createdAtIso: string) => {
    const start = new Date(createdAtIso).getTime();
    const diff = Math.max(0, Math.floor((now - start) / 1000));
    const mins = Math.floor(diff / 60);
    const secs = diff % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    await createTask({
      task_title: newTaskTitle,
      bed_id: newTaskBed,
      patient_name: newTaskPatient,
      priority: newTaskPriority,
      due_time: newTaskTime,
      nurse_id: currentNurse.nurse_id,
    });
    setNewTaskTitle('');
    setShowNewTaskModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Sub-navigation Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-1.5 shadow-2xs overflow-x-auto scrollbar-none">
        <div className="flex items-center space-x-1 min-w-max">
          {[
            { id: 'dashboard', label: 'Dashboard Console', icon: Activity, count: null },
            { id: 'emergencies', label: 'Active Emergencies', icon: AlertTriangle, count: activeEmergenciesCount },
            { id: 'assistance', label: 'Assistance Calls', icon: AlertCircle, count: pendingAssistanceCount },
            { id: 'beds', label: 'Bed Management', icon: BedDouble, count: null },
            { id: 'tasks', label: 'Clinical Tasks', icon: ListTodo, count: pendingTasksCount },
            { id: 'history', label: 'Emergency Logs', icon: Clock, count: null },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`nurse-tab-${tab.id}`}
                onClick={() => setActiveTab(tab.id as NurseTab)}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.count !== null && tab.count > 0 && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      isActive ? 'bg-white text-teal-800' : 'bg-rose-600 text-white'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* TOP CLINICAL STATISTICS (SECTION 9) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Active Emergencies */}
        <div
          onClick={() => setActiveTab('emergencies')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            activeEmergenciesCount > 0
              ? 'bg-rose-50 border-rose-300 shadow-sm animate-pulse'
              : 'bg-white border-slate-200/80 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-bold">
            <span className={activeEmergenciesCount > 0 ? 'text-rose-900' : 'text-slate-500'}>
              Active Emergencies
            </span>
            <AlertTriangle className={`w-4 h-4 ${activeEmergenciesCount > 0 ? 'text-rose-600' : 'text-slate-400'}`} />
          </div>
          <div className={`text-2xl font-bold mt-2 ${activeEmergenciesCount > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
            {activeEmergenciesCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {activeEmergenciesCount > 0 ? 'Immediate clinical action needed' : 'All wards stable'}
          </div>
        </div>

        {/* Pending Assistance */}
        <div
          onClick={() => setActiveTab('assistance')}
          className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs cursor-pointer hover:border-amber-300 transition-all"
        >
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>Pending Assistance</span>
            <AlertCircle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{pendingAssistanceCount}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Patient calls & requests</div>
        </div>

        {/* Active Patients */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>Active Patients</span>
            <Users className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{activePatientsCount}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Ward A, B & C combined</div>
        </div>

        {/* Available Beds */}
        <div
          onClick={() => setActiveTab('beds')}
          className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs cursor-pointer hover:border-emerald-300 transition-all"
        >
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>Available Beds</span>
            <BedDouble className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-700 mt-2">{availableBedsCount}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Ready for admission</div>
        </div>

        {/* Pending Tasks */}
        <div
          onClick={() => setActiveTab('tasks')}
          className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs cursor-pointer hover:border-blue-300 transition-all"
        >
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>Pending Tasks</span>
            <ListTodo className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{pendingTasksCount}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Nurse shift duties</div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* SECTION 9: EMERGENCY ALERTS CONSOLE & ACTION WORKFLOW */}
      {/* ======================================================== */}
      {(activeTab === 'dashboard' || activeTab === 'emergencies') && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <ShieldAlert className="w-5 h-5 text-rose-600" />
              <span>Emergency Alerts Console (ESP8266 IoT & Call Buttons)</span>
            </h3>
            <button
              onClick={() => setIsIotSimulatorOpen(true)}
              className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-lg border border-indigo-200 transition-colors"
            >
              Test IoT Simulator
            </button>
          </div>

          {liveEmergencies.length === 0 ? (
            <div className="p-8 bg-white rounded-3xl border border-slate-200 text-center space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
              <h4 className="text-sm font-bold text-slate-900">No Active Emergencies</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                All patient telemetry units and bedside IoT devices are normal. You can test an alert using the ESP8266 button.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {liveEmergencies.map((emg) => {
                const isSent = emg.status === 'Request Sent' || emg.status === 'Nurse Notified';
                const isAcked = emg.status === 'Nurse Acknowledged';
                const isInProgress = emg.status === 'Assistance in Progress';

                return (
                  <div
                    key={emg.request_id}
                    className="bg-white rounded-3xl border-2 border-rose-300 p-6 shadow-md relative overflow-hidden flex flex-col justify-between space-y-4"
                  >
                    {/* Top alert bar */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center animate-pulse">
                          <AlertTriangle className="w-5 h-5 stroke-[2.5]" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-rose-700 uppercase tracking-wide">
                            🚨 EMERGENCY ALERT
                          </div>
                          <div className="font-mono text-xs text-slate-500">
                            {emg.request_id} • {emg.device_id || 'CALL_BUTTON'}
                          </div>
                        </div>
                      </div>

                      {/* Live Waiting Timer */}
                      <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-bold font-mono">
                        <Timer className="w-3.5 h-3.5 text-rose-600" />
                        <span>Wait: {formatWaitingTimer(emg.created_at)}</span>
                      </div>
                    </div>

                    {/* Patient & Bed info grid */}
                    <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-100 text-xs">
                      <div>
                        <span className="text-slate-500 block text-[10px] uppercase font-semibold">Patient</span>
                        <span className="font-bold text-slate-900">{emg.patient_name}</span>
                        <span className="text-[10px] text-slate-500 block">({emg.patient_id})</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px] uppercase font-semibold">Bed / Ward</span>
                        <span className="font-bold text-rose-600 text-sm">{emg.bed_id}</span>
                        <span className="text-[10px] text-slate-500 block">{emg.ward}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px] uppercase font-semibold">Request Time</span>
                        <span className="font-semibold text-slate-800">
                          {new Date(emg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                      </div>
                    </div>

                    {/* Status & Assigned Staff Banner */}
                    {isAcked && (
                      <div className="p-3 rounded-xl bg-teal-50 border border-teal-200 text-xs text-teal-900 flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Check className="w-4 h-4 text-teal-600" />
                          <span><strong>✓ Nurse Acknowledged</strong> by {emg.assigned_nurse || currentNurse.name}</span>
                        </div>
                        <span className="text-[11px] text-teal-700">
                          {emg.acknowledged_at ? new Date(emg.acknowledged_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </div>
                    )}

                    {isInProgress && (
                      <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 flex items-center space-x-2">
                        <Activity className="w-4 h-4 text-blue-600 animate-spin" />
                        <span><strong>Assistance in Progress:</strong> Nurse responding at bedside.</span>
                      </div>
                    )}

                    {/* ACTION WORKFLOW BUTTONS (SECTION 9) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                      {isSent && (
                        <button
                          onClick={() => updateEmergencyStatus(emg.request_id, 'Nurse Acknowledged', currentNurse.name)}
                          className="w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center space-x-1.5"
                        >
                          <Check className="w-4 h-4" />
                          <span>[ ACKNOWLEDGE ]</span>
                        </button>
                      )}

                      {isAcked && (
                        <button
                          onClick={() => updateEmergencyStatus(emg.request_id, 'Assistance in Progress', currentNurse.name)}
                          className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center space-x-1.5"
                        >
                          <Activity className="w-4 h-4" />
                          <span>[ START ASSISTANCE ]</span>
                        </button>
                      )}

                      {(isAcked || isInProgress) && (
                        <button
                          onClick={() => updateEmergencyStatus(emg.request_id, 'Completed', currentNurse.name)}
                          className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center space-x-1.5 sm:col-span-2"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>[ MARK ASSISTANCE COMPLETED ]</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* SECTION 11: VISUAL BED MANAGEMENT PAGE */}
      {/* ======================================================== */}
      {(activeTab === 'dashboard' || activeTab === 'beds') && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <BedDouble className="w-5 h-5 text-teal-600" />
                <span>Visual Ward & Bed Management</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Real-time bed occupancy, cleaning, maintenance, and emergency indicators across Wards A, B & C.
              </p>
            </div>

            {/* Status Legend */}
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold text-slate-600">
              <span className="flex items-center space-x-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span>Available</span>
              </span>
              <span className="flex items-center space-x-1">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <span>Occupied</span>
              </span>
              <span className="flex items-center space-x-1">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span>Cleaning</span>
              </span>
              <span className="flex items-center space-x-1">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                <span>Maintenance</span>
              </span>
              <span className="flex items-center space-x-1">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-ping" />
                <span className="text-rose-600 font-bold">Emergency</span>
              </span>
            </div>
          </div>

          {/* Grouped by Wards */}
          {['Ward A', 'Ward B', 'Ward C'].map((wardName) => {
            const wardBeds = state.beds.filter((b) => b.ward === wardName);

            return (
              <div key={wardName} className="space-y-3">
                <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    {wardName}{' '}
                    <span className="text-[11px] font-normal text-slate-500">
                      ({wardName === 'Ward A' ? 'Cardiology & Acute' : wardName === 'Ward B' ? 'Surgical & Ortho' : 'General Medicine'})
                    </span>
                  </h4>
                  <span className="text-xs text-slate-500">
                    {wardBeds.filter((b) => b.status === 'Available').length} of {wardBeds.length} Available
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5">
                  {wardBeds.map((bed) => {
                    const isEmg = bed.status === 'Emergency';
                    const isOccupied = bed.status === 'Occupied';
                    const isAvail = bed.status === 'Available';
                    const isCleaning = bed.status === 'Cleaning';
                    const isMaint = bed.status === 'Maintenance';

                    return (
                      <button
                        key={bed.id}
                        id={`bed-card-${bed.id}`}
                        onClick={() => setSelectedBed(bed)}
                        className={`p-3 rounded-2xl border text-left transition-all relative flex flex-col justify-between h-24 hover:scale-[1.02] active:scale-[0.98] ${
                          isEmg
                            ? 'bg-rose-50 border-rose-400 text-rose-900 shadow-md ring-2 ring-rose-500 animate-pulse'
                            : isOccupied
                            ? 'bg-blue-50/70 border-blue-200 text-blue-900'
                            : isAvail
                            ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                            : isCleaning
                            ? 'bg-amber-50/70 border-amber-200 text-amber-900'
                            : 'bg-slate-50 border-slate-200 text-slate-600'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <span className="font-bold text-xs">{bed.id}</span>
                          <span
                            className={`w-2 h-2 rounded-full ${
                              isEmg
                                ? 'bg-rose-600 animate-ping'
                                : isOccupied
                                ? 'bg-blue-500'
                                : isAvail
                                ? 'bg-emerald-500'
                                : isCleaning
                                ? 'bg-amber-500'
                                : 'bg-slate-400'
                            }`}
                          />
                        </div>

                        <div>
                          <div className="text-[10px] font-bold uppercase tracking-wider">
                            {bed.status}
                          </div>
                          <div className="text-[11px] font-medium truncate">
                            {bed.patientName || 'Unassigned'}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ======================================================== */}
      {/* SECTION: PENDING ASSISTANCE REQUESTS */}
      {/* ======================================================== */}
      {(activeTab === 'dashboard' || activeTab === 'assistance') && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-amber-500" />
              <span>Patient Assistance Calls ({pendingAssistanceRequests.length})</span>
            </h3>
          </div>

          {pendingAssistanceRequests.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">
              No pending assistance calls.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {pendingAssistanceRequests.map((req) => (
                <div key={req.request_id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-[11px] font-bold text-slate-500">{req.request_id}</span>
                      <span className="text-xs font-bold text-slate-900">{req.type}</span>
                      <span className="text-xs font-semibold text-teal-700">Bed {req.bed_id} ({req.ward})</span>
                    </div>
                    <p className="text-xs text-slate-600">
                      Patient: <span className="font-semibold text-slate-800">{req.patient_name}</span>
                      {req.notes && ` • "${req.notes}"`}
                    </p>
                    <span className="text-[11px] text-slate-400">
                      Requested {new Date(req.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    {req.status === 'Pending' && (
                      <button
                        onClick={() => updateAssistanceStatus(req.request_id, 'Acknowledged', currentNurse.name)}
                        className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-xs font-bold rounded-lg transition-colors"
                      >
                        Acknowledge
                      </button>
                    )}
                    {req.status === 'Acknowledged' && (
                      <button
                        onClick={() => updateAssistanceStatus(req.request_id, 'In Progress', currentNurse.name)}
                        className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 text-xs font-bold rounded-lg transition-colors"
                      >
                        Start
                      </button>
                    )}
                    <button
                      onClick={() => updateAssistanceStatus(req.request_id, 'Completed', currentNurse.name)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors shadow-2xs"
                    >
                      Complete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* SECTION: NURSE TASKS CHECKLIST */}
      {/* ======================================================== */}
      {activeTab === 'tasks' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <ListTodo className="w-5 h-5 text-teal-600" />
                <span>Shift Clinical Tasks & Rounds</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Assigned duties for {currentNurse.name} ({currentNurse.assigned_ward})
              </p>
            </div>
            <button
              onClick={() => setShowNewTaskModal(true)}
              className="px-3 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl flex items-center space-x-1.5 shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Add Task</span>
            </button>
          </div>

          <div className="space-y-3">
            {state.nurseTasks.map((task) => (
              <div
                key={task.id}
                onClick={() => toggleTask(task.id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                  task.completed
                    ? 'bg-slate-50 border-slate-200 opacity-60'
                    : 'bg-white border-slate-200 hover:border-teal-300 shadow-2xs'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div
                    className={`w-5 h-5 rounded-md border flex items-center justify-center mt-0.5 transition-colors ${
                      task.completed ? 'bg-teal-600 border-teal-600 text-white' : 'border-slate-300 bg-white'
                    }`}
                  >
                    {task.completed && <Check className="w-3.5 h-3.5" />}
                  </div>
                  <div>
                    <h4 className={`text-xs font-bold ${task.completed ? 'line-through text-slate-500' : 'text-slate-900'}`}>
                      {task.task_title}
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Bed: <span className="font-semibold">{task.bed_id}</span> • Patient: {task.patient_name}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      task.priority === 'High'
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : task.priority === 'Medium'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {task.priority}
                  </span>
                  <span className="text-xs font-mono font-semibold text-slate-600">
                    {task.due_time}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SECTION 14: EMERGENCY HISTORY & LOGS */}
      {/* ======================================================== */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <Clock className="w-5 h-5 text-teal-600" />
                <span>Emergency History & Response Time Logs</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Audit trail of bedside calls, acknowledgment timestamps, and response times.
              </p>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold">
                {(['today', 'week', 'month'] as const).map((period) => (
                  <button
                    key={period}
                    onClick={() => setHistoryPeriod(period)}
                    className={`px-3 py-1 rounded-lg capitalize ${
                      historyPeriod === period ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                    }`}
                  >
                    {period === 'today' ? 'Today' : period === 'week' ? 'This Week' : 'This Month'}
                  </button>
                ))}
              </div>

              <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold">
                {(['all', 'emergency', 'assistance'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setHistoryType(t)}
                    className={`px-3 py-1 rounded-lg capitalize ${
                      historyType === t ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                    }`}
                  >
                    {t === 'all' ? 'All Logs' : t === 'emergency' ? 'Emergency Only' : 'Assistance Only'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Detailed History Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-bold uppercase text-[10px]">
                  <th className="p-3">Request ID</th>
                  <th className="p-3">Patient</th>
                  <th className="p-3">Bed / Ward</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Created Time</th>
                  <th className="p-3">Acknowledged</th>
                  <th className="p-3">Completed</th>
                  <th className="p-3">Nurse</th>
                  <th className="p-3">Response Time</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {state.emergencyRequests.map((emg) => (
                  <tr key={emg.request_id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 font-mono font-bold text-slate-900">{emg.request_id}</td>
                    <td className="p-3 font-medium text-slate-800">{emg.patient_name}</td>
                    <td className="p-3 font-bold text-teal-700">{emg.bed_id} ({emg.ward})</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                        {emg.request_type}
                      </span>
                    </td>
                    <td className="p-3 text-slate-500">
                      {new Date(emg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="p-3 text-slate-500">
                      {emg.acknowledged_at
                        ? new Date(emg.acknowledged_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : '—'}
                    </td>
                    <td className="p-3 text-slate-500">
                      {emg.completed_at
                        ? new Date(emg.completed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : 'In Progress'}
                    </td>
                    <td className="p-3 text-slate-800 font-medium">{emg.assigned_nurse || 'Unassigned'}</td>
                    <td className="p-3 font-mono font-bold text-emerald-700">
                      {emg.response_time_seconds
                        ? `${Math.floor(emg.response_time_seconds / 60)}m ${emg.response_time_seconds % 60}s`
                        : 'Active'}
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          emg.status === 'Completed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {emg.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Bed Detail & Status Change Modal */}
      {selectedBed && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold text-teal-700 uppercase">{selectedBed.ward}</span>
                <h3 className="text-xl font-bold text-slate-900">Bed {selectedBed.id}</h3>
                <p className="text-xs text-slate-500">{selectedBed.room} • {selectedBed.block}, Floor {selectedBed.floor}</p>
              </div>
              <button
                onClick={() => setSelectedBed(null)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Current Status:</span>
                <span className="font-bold text-slate-900 uppercase">{selectedBed.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Assigned Patient:</span>
                <span className="font-bold text-slate-900">{selectedBed.patientName || 'None (Vacant)'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">IoT Device ID:</span>
                <span className="font-mono text-indigo-700">{selectedBed.iotDeviceId || 'Unmapped'}</span>
              </div>
            </div>

            {/* Change Status Buttons */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-2">
                Update Bed Operational Status:
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(['Available', 'Occupied', 'Cleaning', 'Maintenance', 'Emergency'] as BedStatus[]).map((st) => (
                  <button
                    key={st}
                    onClick={async () => {
                      await updateBedStatus(selectedBed.id, st);
                      setSelectedBed(null);
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-colors ${
                      selectedBed.status === st
                        ? 'bg-teal-600 text-white border-teal-600'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    Set {st}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setSelectedBed(null)}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Task Modal */}
      {showNewTaskModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <form
            onSubmit={handleCreateTask}
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Add Nurse Duty Task</h3>
              <button
                type="button"
                onClick={() => setShowNewTaskModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Task Title:</label>
              <input
                type="text"
                required
                placeholder="e.g. Check vital signs and IV line"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Bed Number:</label>
                <input
                  type="text"
                  value={newTaskBed}
                  onChange={(e) => setNewTaskBed(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Due Time:</label>
                <input
                  type="text"
                  value={newTaskTime}
                  onChange={(e) => setNewTaskTime(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Priority:</label>
              <div className="grid grid-cols-3 gap-2">
                {(['High', 'Medium', 'Routine'] as const).map((p) => (
                  <button
                    type="button"
                    key={p}
                    onClick={() => setNewTaskPriority(p)}
                    className={`py-2 rounded-xl text-xs font-bold border ${
                      newTaskPriority === p
                        ? 'bg-teal-600 text-white border-teal-600'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex space-x-2 pt-2">
              <button
                type="submit"
                className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl"
              >
                Save Task
              </button>
              <button
                type="button"
                onClick={() => setShowNewTaskModal(false)}
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
