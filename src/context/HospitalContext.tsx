import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  AssistanceCategory,
  AssistanceRequest,
  AssistanceStatus,
  Bed,
  BedStatus,
  Doctor,
  EmergencyRequest,
  EmergencyStatus,
  Facility,
  HospitalState,
  NotificationItem,
  Nurse,
  NurseTask,
  Patient,
  User,
  UserRole,
} from '../types.ts';
import { createInitialHospitalState, INITIAL_PATIENTS, INITIAL_USERS } from '../data/initialData.ts';
import { playChimeSound, playEmergencyAlertSound } from '../utils/audio.ts';

export interface ToastMessage {
  id: string;
  title: string;
  message: string;
  type: 'emergency' | 'assistance' | 'info' | 'success';
}

interface HospitalContextType {
  state: HospitalState;
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  currentUser: User;
  currentPatient: Patient;
  currentNurse: Nurse;
  muted: boolean;
  setMuted: React.Dispatch<React.SetStateAction<boolean>>;
  activeDestination: Facility | null;
  setActiveDestination: (dest: Facility | null) => void;
  isEmergencyDialogOpen: boolean;
  setIsEmergencyDialogOpen: (open: boolean) => void;
  isIotSimulatorOpen: boolean;
  setIsIotSimulatorOpen: (open: boolean) => void;
  isNotificationsOpen: boolean;
  setIsNotificationsOpen: (open: boolean) => void;
  toasts: ToastMessage[];
  dismissToast: (id: string) => void;
  sseConnected: boolean;
  loading: boolean;
  // Auth & Profile
  isAuthenticated: boolean;
  setIsAuthenticated: (val: boolean) => void;
  login: (payload: {
    role: UserRole;
    name: string;
    contact: string;
    patient_id?: string;
    bed_id?: string;
    ward_id?: string;
    age?: number;
    gender?: string;
    attendant_name?: string;
    attendant_phone?: string;
    primary_doctor?: string;
    condition_summary?: string;
    badgeNumber?: string;
  }) => void;
  logout: () => void;
  updatePatientBed: (bedId: string) => void;
  updatePatientProfile: (updatedData: Partial<Patient>) => void;
  // Actions
  triggerEmergency: (params?: { device_id?: string; bed_id?: string; patient_id?: string; notes?: string }) => Promise<any>;
  updateEmergencyStatus: (requestId: string, status: EmergencyStatus, nurseName?: string, notes?: string) => Promise<any>;
  submitAssistance: (type: AssistanceCategory, notes?: string) => Promise<any>;
  updateAssistanceStatus: (requestId: string, status: AssistanceStatus, nurseName?: string) => Promise<any>;
  updateBedStatus: (bedId: string, status: BedStatus, patientId?: string, patientName?: string) => Promise<any>;
  toggleTask: (taskId: string) => Promise<any>;
  createTask: (taskData: Partial<NurseTask>) => Promise<any>;
  saveFacility: (facility: Facility) => Promise<any>;
  deleteFacility: (facilityId: string) => Promise<any>;
  saveDoctor: (doctor: Doctor) => Promise<any>;
  deleteDoctor: (doctorId: string) => Promise<any>;
  markNotificationsAsRead: (notificationId?: string) => Promise<any>;
  resetDatabase: () => Promise<any>;
  // Computeds
  activeEmergencyForPatient: EmergencyRequest | undefined;
  liveEmergencies: EmergencyRequest[];
  pendingAssistanceRequests: AssistanceRequest[];
}

const HospitalContext = createContext<HospitalContextType | undefined>(undefined);

export const HospitalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<HospitalState>(createInitialHospitalState());
  const [currentRole, setCurrentRole] = useState<UserRole>('patient');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [muted, setMuted] = useState<boolean>(false);
  const [activeDestination, setActiveDestination] = useState<Facility | null>(null);
  const [isEmergencyDialogOpen, setIsEmergencyDialogOpen] = useState<boolean>(false);
  const [isIotSimulatorOpen, setIsIotSimulatorOpen] = useState<boolean>(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState<boolean>(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [sseConnected, setSseConnected] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  // Authenticated state entities
  const [loggedPatient, setLoggedPatient] = useState<Patient>(() => {
    return (
      INITIAL_PATIENTS.find((p) => p.patient_id === 'P102') || {
        patient_id: 'P102',
        user_id: 'P102',
        name: 'Johnathan Vance',
        age: 48,
        gender: 'Male',
        bed_id: 'A-204',
        ward_id: 'Ward A',
        admission_date: new Date(Date.now() - 172800000).toISOString().split('T')[0],
        primary_doctor: 'Dr. Evelyn Reed (Cardiology)',
        emergency_contact: '+1 (555) 234-9988',
        attendant_name: 'Clara Vance (Spouse)',
        attendant_phone: '+1 (555) 234-9988',
        condition_summary: 'Post-angioplasty recovery, stable telemetry vitals. Monitoring for 48h.',
        fall_risk: 'Medium',
        allergies: ['Penicillin'],
      }
    );
  });

  const [loggedUser, setLoggedUser] = useState<User>(() => INITIAL_USERS[0]);

  // Derived current user entities
  const currentUser: User =
    loggedUser.role === currentRole
      ? loggedUser
      : INITIAL_USERS.find((u) => u.role === currentRole) || INITIAL_USERS[0];

  const currentPatient: Patient = loggedPatient;

  const currentNurse: Nurse =
    state.nurses.find((n) => n.nurse_id === 'N201') || state.nurses[0];

  const addToast = useCallback(
    (title: string, message: string, type: 'emergency' | 'assistance' | 'info' | 'success') => {
      const id = `toast-${Date.now()}-${Math.random()}`;
      setToasts((prev) => [...prev, { id, title, message, type }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 6000);
    },
    []
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const login = useCallback(
    (payload: {
      role: UserRole;
      name: string;
      contact: string;
      patient_id?: string;
      bed_id?: string;
      ward_id?: string;
      age?: number;
      gender?: string;
      attendant_name?: string;
      attendant_phone?: string;
      primary_doctor?: string;
      condition_summary?: string;
      badgeNumber?: string;
    }) => {
      setCurrentRole(payload.role);
      setIsAuthenticated(true);

      const userId = `USR-${Date.now()}`;
      const newUser: User = {
        id: userId,
        name: payload.name,
        email: `${payload.name.toLowerCase().replace(/\s+/g, '.')}@smartcare.hospital`,
        role: payload.role,
        badgeNumber: payload.badgeNumber || (payload.role === 'nurse' ? 'RN-4421' : 'ADM-001'),
        ward: payload.ward_id || 'Ward A',
        contact: payload.contact,
        assignedBed: payload.bed_id,
      };
      setLoggedUser(newUser);

      if (payload.role === 'patient') {
        const assignedBedId = payload.bed_id || 'A-204';
        const assignedWard =
          payload.ward_id || (assignedBedId.startsWith('B') ? 'Ward B' : 'Ward A');
        const resolvedPatientId = payload.patient_id || 'P102';

        const newPatient: Patient = {
          patient_id: resolvedPatientId,
          user_id: userId,
          name: payload.name,
          age: payload.age || 48,
          gender: payload.gender || 'Male',
          bed_id: assignedBedId,
          ward_id: assignedWard,
          admission_date: new Date().toISOString().split('T')[0],
          primary_doctor: payload.primary_doctor || 'Dr. Evelyn Reed (Cardiology)',
          emergency_contact: payload.attendant_phone || payload.contact,
          attendant_name: payload.attendant_name || 'Family Attendant',
          attendant_phone: payload.attendant_phone || payload.contact,
          condition_summary:
            payload.condition_summary || 'Monitored inpatient care with bedside IoT gateway.',
          fall_risk: 'Medium',
          allergies: ['Penicillin'],
        };
        setLoggedPatient(newPatient);

        // Update bed occupancy in state.beds
        setState((prev) => {
          const updatedBeds = prev.beds.map((b) =>
            b.id === assignedBedId
              ? {
                  ...b,
                  status: 'Occupied' as BedStatus,
                  patientId: resolvedPatientId,
                  patientName: payload.name,
                }
              : b
          );
          const updatedPatients = [
            newPatient,
            ...prev.patients.filter((p) => p.patient_id !== resolvedPatientId),
          ];
          const loginNotif: NotificationItem = {
            notification_id: `NOTIF-${Date.now()}`,
            user_id: resolvedPatientId,
            target_role: 'all',
            title: `Bed ${assignedBedId} Assigned`,
            message: `Bed ${assignedBedId} in ${assignedWard} allocated to ${payload.name}. Bedside IoT gateway active.`,
            type: 'status_update',
            timestamp: new Date().toISOString(),
            read_status: false,
          };
          return {
            ...prev,
            beds: updatedBeds,
            patients: updatedPatients,
            notifications: [loginNotif, ...prev.notifications],
          };
        });

        addToast(
          'Login Successful',
          `Welcome, ${payload.name}! Bed ${assignedBedId} confirmed.`,
          'success'
        );
      } else {
        addToast(
          'Staff Login Successful',
          `Welcome, ${payload.name} (${payload.role.toUpperCase()})`,
          'success'
        );
      }
    },
    [addToast]
  );

  const logout = useCallback(() => {
    setIsAuthenticated(false);
    addToast('Logged Out', 'You have been logged out from SmartCare.', 'info');
  }, [addToast]);

  const updatePatientBed = useCallback(
    (newBedId: string) => {
      const matchedBed = state.beds.find((b) => b.id === newBedId);
      const newWard = matchedBed ? matchedBed.ward : newBedId.startsWith('B') ? 'Ward B' : 'Ward A';

      setLoggedPatient((prev) => ({
        ...prev,
        bed_id: newBedId,
        ward_id: newWard,
      }));

      // Update in state
      setState((prev) => {
        const updatedBeds = prev.beds.map((b) => {
          if (b.id === newBedId) {
            return {
              ...b,
              status: 'Occupied' as BedStatus,
              patientId: loggedPatient.patient_id,
              patientName: loggedPatient.name,
            };
          }
          if (b.id === loggedPatient.bed_id) {
            return {
              ...b,
              status: 'Available' as BedStatus,
              patientId: undefined,
              patientName: undefined,
            };
          }
          return b;
        });

        const updatedPatients = prev.patients.map((p) =>
          p.patient_id === loggedPatient.patient_id
            ? { ...p, bed_id: newBedId, ward_id: newWard }
            : p
        );

        const bedUpdateNotif: NotificationItem = {
          notification_id: `NOTIF-${Date.now()}`,
          user_id: loggedPatient.patient_id,
          target_role: 'all',
          title: 'Bed Assignment Updated',
          message: `Your assigned bed has been updated to Bed ${newBedId} (${newWard}). Navigation and telemetry updated.`,
          type: 'status_update',
          timestamp: new Date().toISOString(),
          read_status: false,
        };

        return {
          ...prev,
          beds: updatedBeds,
          patients: updatedPatients,
          notifications: [bedUpdateNotif, ...prev.notifications],
        };
      });

      // Synchronize with backend API
      fetch('/api/beds/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bed_id: newBedId,
          status: 'Occupied',
          patient_id: loggedPatient.patient_id,
          patient_name: loggedPatient.name,
        }),
      }).catch(console.error);

      addToast(
        'Bed Assignment Updated',
        `Assigned location is now Bed ${newBedId} (${newWard})`,
        'success'
      );
    },
    [state.beds, loggedPatient, addToast]
  );

  const updatePatientProfile = useCallback(
    (updatedData: Partial<Patient>) => {
      setLoggedPatient((prev) => ({
        ...prev,
        ...updatedData,
      }));

      setState((prev) => {
        const updatedPatients = prev.patients.map((p) =>
          p.patient_id === loggedPatient.patient_id ? { ...p, ...updatedData } : p
        );
        return { ...prev, patients: updatedPatients };
      });

      addToast('Profile Updated', 'Your profile details have been saved.', 'success');
    },
    [loggedPatient.patient_id, addToast]
  );

  // Fetch initial data from backend API
  const fetchState = useCallback(async () => {
    try {
      const res = await fetch('/api/data');
      if (res.ok) {
        const data: HospitalState = await res.json();
        setState(data);
      }
    } catch (err) {
      console.warn('Backend /api/data initial load using local fallback:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchState();
  }, [fetchState]);

  // Connect SSE for real-time live events across patient, nurse, and admin
  useEffect(() => {
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource('/api/events');

      eventSource.onopen = () => {
        setSseConnected(true);
      };

      eventSource.addEventListener('emergency_alert', (e) => {
        const payload = JSON.parse(e.data);
        const { emergency, bed, notification } = payload.data;
        setState((prev) => {
          const exists = prev.emergencyRequests.some((x) => x.request_id === emergency.request_id);
          const updatedRequests = exists
            ? prev.emergencyRequests.map((x) => (x.request_id === emergency.request_id ? emergency : x))
            : [emergency, ...prev.emergencyRequests];

          const updatedBeds = prev.beds.map((b) => (b.id === emergency.bed_id ? { ...b, status: 'Emergency' as BedStatus } : b));
          const updatedNotifs = notification ? [notification, ...prev.notifications] : prev.notifications;

          return {
            ...prev,
            emergencyRequests: updatedRequests,
            beds: updatedBeds,
            notifications: updatedNotifs,
          };
        });

        playEmergencyAlertSound(muted);
        addToast(
          `🚨 EMERGENCY: Bed ${emergency.bed_id}`,
          `Patient: ${emergency.patient_name} (${emergency.ward}) — Clinical team notified.`,
          'emergency'
        );
      });

      eventSource.addEventListener('emergency_update', (e) => {
        const payload = JSON.parse(e.data);
        const { emergency, notification, beds } = payload.data;
        setState((prev) => ({
          ...prev,
          emergencyRequests: prev.emergencyRequests.map((item) =>
            item.request_id === emergency.request_id ? emergency : item
          ),
          beds: beds || prev.beds,
          notifications: notification ? [notification, ...prev.notifications] : prev.notifications,
        }));

        playChimeSound(muted);
        addToast(
          `Emergency Status: ${emergency.status}`,
          `Bed ${emergency.bed_id}: Assigned to ${emergency.assigned_nurse || 'Clinical Staff'}`,
          'info'
        );
      });

      eventSource.addEventListener('assistance_new', (e) => {
        const payload = JSON.parse(e.data);
        const { request, notification } = payload.data;
        setState((prev) => ({
          ...prev,
          assistanceRequests: [request, ...prev.assistanceRequests],
          notifications: notification ? [notification, ...prev.notifications] : prev.notifications,
        }));

        playChimeSound(muted);
        addToast(
          `Assistance Request: ${request.type}`,
          `${request.patient_name} (Bed ${request.bed_id}, ${request.ward}) requested assistance.`,
          'assistance'
        );
      });

      eventSource.addEventListener('assistance_update', (e) => {
        const payload = JSON.parse(e.data);
        const { request } = payload.data;
        setState((prev) => ({
          ...prev,
          assistanceRequests: prev.assistanceRequests.map((r) =>
            r.request_id === request.request_id ? request : r
          ),
        }));
      });

      eventSource.addEventListener('bed_update', (e) => {
        const payload = JSON.parse(e.data);
        const { bed } = payload.data;
        setState((prev) => ({
          ...prev,
          beds: prev.beds.map((b) => (b.id === bed.id ? bed : b)),
        }));
      });

      eventSource.addEventListener('facilities_update', (e) => {
        const payload = JSON.parse(e.data);
        if (payload.data?.facilities) {
          setState((prev) => ({ ...prev, facilities: payload.data.facilities }));
        }
      });

      eventSource.addEventListener('doctors_update', (e) => {
        const payload = JSON.parse(e.data);
        if (payload.data?.doctors) {
          setState((prev) => ({ ...prev, doctors: payload.data.doctors }));
        }
      });

      eventSource.addEventListener('state_refresh', (e) => {
        const payload = JSON.parse(e.data);
        if (payload.data) {
          setState(payload.data);
        }
      });

      eventSource.onerror = () => {
        setSseConnected(false);
      };
    } catch (err) {
      console.warn('SSE connection failed, falling back to REST actions:', err);
    }

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [muted, addToast]);

  // Action: Trigger Emergency (Patient or IoT)
  const triggerEmergency = async (params?: { device_id?: string; bed_id?: string; patient_id?: string; notes?: string }) => {
    const bedId = params?.bed_id || currentPatient.bed_id;
    const body = {
      device_id: params?.device_id || `ESP8266-BED-${bedId.replace('-', '')}`,
      patient_id: params?.patient_id || currentPatient.patient_id,
      bed_id: bedId,
      request_type: params?.device_id ? 'IOT_ESP8266' : 'EMERGENCY',
      notes: params?.notes,
    };

    try {
      const res = await fetch('/api/emergency', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (!sseConnected) {
        // Optimistic local state update if SSE is buffering
        await fetchState();
      }
      return data;
    } catch (err) {
      console.error('Trigger emergency error:', err);
      // Fallback local state mutation
      const newEmergency: EmergencyRequest = {
        request_id: `EMG-${Math.floor(1000 + Math.random() * 9000)}`,
        patient_id: currentPatient.patient_id,
        patient_name: currentPatient.name,
        bed_id: bedId,
        ward: currentPatient.ward_id,
        request_type: 'EMERGENCY',
        created_at: new Date().toISOString(),
        status: 'Nurse Notified',
      };
      setState((prev) => ({
        ...prev,
        emergencyRequests: [newEmergency, ...prev.emergencyRequests],
        beds: prev.beds.map((b) => (b.id === bedId ? { ...b, status: 'Emergency' } : b)),
      }));
      playEmergencyAlertSound(muted);
      return { success: true, request_id: newEmergency.request_id };
    }
  };

  // Action: Update Emergency Status (Nurse Workflow)
  const updateEmergencyStatus = async (
    requestId: string,
    status: EmergencyStatus,
    nurseName?: string,
    notes?: string
  ) => {
    const resolvedNurse = nurseName || currentNurse.name;
    try {
      const res = await fetch('/api/emergency/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ request_id: requestId, status, nurse_name: resolvedNurse, notes }),
      });
      const data = await res.json();
      if (!sseConnected) {
        await fetchState();
      }
      return data;
    } catch (err) {
      console.error('Update emergency status error:', err);
      setState((prev) => ({
        ...prev,
        emergencyRequests: prev.emergencyRequests.map((e) =>
          e.request_id === requestId ? { ...e, status, assigned_nurse: resolvedNurse } : e
        ),
      }));
    }
  };

  // Action: Submit Patient Assistance
  const submitAssistance = async (type: AssistanceCategory, notes?: string) => {
    try {
      const res = await fetch('/api/assistance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: currentPatient.patient_id,
          bed_id: currentPatient.bed_id,
          type,
          notes,
        }),
      });
      const data = await res.json();
      if (!sseConnected) {
        await fetchState();
      }
      return data;
    } catch (err) {
      console.error('Submit assistance error:', err);
      const newReq: AssistanceRequest = {
        request_id: `AST-${Math.floor(1000 + Math.random() * 9000)}`,
        patient_id: currentPatient.patient_id,
        patient_name: currentPatient.name,
        bed_id: currentPatient.bed_id,
        ward: currentPatient.ward_id,
        type,
        status: 'Pending',
        created_at: new Date().toISOString(),
        notes,
      };
      setState((prev) => ({
        ...prev,
        assistanceRequests: [newReq, ...prev.assistanceRequests],
      }));
      return { success: true, request: newReq };
    }
  };

  // Action: Update Assistance Status
  const updateAssistanceStatus = async (requestId: string, status: AssistanceStatus, nurseName?: string) => {
    try {
      const res = await fetch('/api/assistance/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ request_id: requestId, status, nurse_name: nurseName || currentNurse.name }),
      });
      const data = await res.json();
      if (!sseConnected) {
        await fetchState();
      }
      return data;
    } catch (err) {
      console.error('Update assistance status error:', err);
      setState((prev) => ({
        ...prev,
        assistanceRequests: prev.assistanceRequests.map((a) =>
          a.request_id === requestId ? { ...a, status, assigned_nurse: nurseName || currentNurse.name } : a
        ),
      }));
    }
  };

  // Action: Bed Status
  const updateBedStatus = async (bedId: string, status: BedStatus, patientId?: string, patientName?: string) => {
    try {
      const res = await fetch('/api/beds/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bed_id: bedId, status, patient_id: patientId, patient_name: patientName }),
      });
      return await res.json();
    } catch (err) {
      console.error('Update bed status error:', err);
      setState((prev) => ({
        ...prev,
        beds: prev.beds.map((b) => (b.id === bedId ? { ...b, status, patientId, patientName } : b)),
      }));
    }
  };

  // Action: Toggle Nurse Task
  const toggleTask = async (taskId: string) => {
    try {
      const res = await fetch('/api/tasks/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task_id: taskId }),
      });
      return await res.json();
    } catch (err) {
      setState((prev) => ({
        ...prev,
        nurseTasks: prev.nurseTasks.map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t)),
      }));
    }
  };

  // Action: Create Nurse Task
  const createTask = async (taskData: Partial<NurseTask>) => {
    try {
      const res = await fetch('/api/tasks/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData),
      });
      return await res.json();
    } catch (err) {
      console.error('Create task error:', err);
    }
  };

  // Action: Save Facility
  const saveFacility = async (facility: Facility) => {
    try {
      const res = await fetch('/api/facilities/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(facility),
      });
      return await res.json();
    } catch (err) {
      console.error('Save facility error:', err);
    }
  };

  // Action: Delete Facility
  const deleteFacility = async (facilityId: string) => {
    try {
      const res = await fetch('/api/facilities/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ facility_id: facilityId }),
      });
      return await res.json();
    } catch (err) {
      console.error('Delete facility error:', err);
    }
  };

  // Action: Save Doctor
  const saveDoctor = async (doctor: Doctor) => {
    try {
      const res = await fetch('/api/doctors/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(doctor),
      });
      return await res.json();
    } catch (err) {
      console.error('Save doctor error:', err);
    }
  };

  // Action: Delete Doctor
  const deleteDoctor = async (doctorId: string) => {
    try {
      const res = await fetch('/api/doctors/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doctor_id: doctorId }),
      });
      return await res.json();
    } catch (err) {
      console.error('Delete doctor error:', err);
    }
  };

  // Action: Mark Notifications as read
  const markNotificationsAsRead = async (notificationId?: string) => {
    try {
      await fetch('/api/notifications/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notification_id: notificationId }),
      });
      setState((prev) => ({
        ...prev,
        notifications: prev.notifications.map((n) =>
          notificationId ? (n.notification_id === notificationId ? { ...n, read_status: true } : n) : { ...n, read_status: true }
        ),
      }));
    } catch (err) {
      console.error('Mark read notifications error:', err);
    }
  };

  // Action: Reset Database
  const resetDatabase = async () => {
    try {
      const res = await fetch('/api/reset', { method: 'POST' });
      const data = await res.json();
      await fetchState();
      addToast('Database Reset', 'SmartCare Hospital reset to initial demo clinical state.', 'info');
      return data;
    } catch (err) {
      console.error('Reset database error:', err);
    }
  };

  // Computeds
  const liveEmergencies = state.emergencyRequests.filter((e) => e.status !== 'Completed');
  const activeEmergencyForPatient = state.emergencyRequests.find(
    (e) => e.patient_id === currentPatient.patient_id && e.status !== 'Completed'
  );
  const pendingAssistanceRequests = state.assistanceRequests.filter((a) => a.status !== 'Completed');

  return (
    <HospitalContext.Provider
      value={{
        state,
        currentRole,
        setCurrentRole,
        currentUser,
        currentPatient,
        currentNurse,
        muted,
        setMuted,
        activeDestination,
        setActiveDestination,
        isEmergencyDialogOpen,
        setIsEmergencyDialogOpen,
        isIotSimulatorOpen,
        setIsIotSimulatorOpen,
        isNotificationsOpen,
        setIsNotificationsOpen,
        toasts,
        dismissToast,
        sseConnected,
        loading,
        triggerEmergency,
        updateEmergencyStatus,
        submitAssistance,
        updateAssistanceStatus,
        updateBedStatus,
        toggleTask,
        createTask,
        saveFacility,
        deleteFacility,
        saveDoctor,
        deleteDoctor,
        markNotificationsAsRead,
        resetDatabase,
        activeEmergencyForPatient,
        liveEmergencies,
        pendingAssistanceRequests,
        isAuthenticated,
        setIsAuthenticated,
        login,
        logout,
        updatePatientBed,
        updatePatientProfile,
      }}
    >
      {children}
    </HospitalContext.Provider>
  );
};

export const useHospital = () => {
  const context = useContext(HospitalContext);
  if (!context) {
    throw new Error('useHospital must be used within a HospitalProvider');
  }
  return context;
};
