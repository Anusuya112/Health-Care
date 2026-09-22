import {
  AssistanceRequest,
  Bed,
  Doctor,
  EmergencyRequest,
  EmergencyStatus,
  Facility,
  HospitalState,
  NotificationItem,
  NurseTask,
  Patient,
} from '../types.ts';
import { createInitialHospitalState } from '../data/initialData.ts';

// Singleton in-memory state shared across serverless invocations / Node runtime
let globalState: HospitalState = createInitialHospitalState();

export function getHospitalState(): HospitalState {
  return globalState;
}

export function resetHospitalState(): HospitalState {
  globalState = createInitialHospitalState();
  return globalState;
}

export interface TriggerEmergencyParams {
  device_id?: string;
  patient_id?: string;
  bed_id?: string;
  request_type?: string;
  notes?: string;
}

export function processEmergencyRequest(params: TriggerEmergencyParams): {
  emergency: EmergencyRequest;
  bed?: Bed;
  notification: NotificationItem;
} {
  const { device_id, patient_id, bed_id, request_type, notes } = params;

  // Normalize bed ID (handle "A204" -> "A-204" or "b101" -> "B-101")
  let normalizedBedId = (bed_id || '').toUpperCase().trim();
  if (normalizedBedId && !normalizedBedId.includes('-') && normalizedBedId.length >= 4) {
    normalizedBedId = `${normalizedBedId[0]}-${normalizedBedId.slice(1)}`;
  }

  // Find bed and patient
  let bed = globalState.beds.find((b) => b.id.toUpperCase() === normalizedBedId);
  let patient = globalState.patients.find(
    (p) => p.patient_id === patient_id || (bed && p.bed_id === bed.id)
  );

  if (!bed && patient) {
    bed = globalState.beds.find((b) => b.id === patient?.bed_id);
  }

  const assignedBedId = bed ? bed.id : normalizedBedId || 'A-204';
  const wardName = bed ? bed.ward : 'Ward A';
  const patientName = patient ? patient.name : 'Emergency Patient';
  const resolvedPatientId = patient ? patient.patient_id : patient_id || 'P102';

  // Mark bed status as Emergency
  if (bed) {
    bed.status = 'Emergency';
  }

  const requestId = `EMG-${Math.floor(1000 + Math.random() * 9000)}`;
  const nowIso = new Date().toISOString();

  const emergencyRecord: EmergencyRequest = {
    request_id: requestId,
    patient_id: resolvedPatientId,
    patient_name: patientName,
    bed_id: assignedBedId,
    ward: wardName,
    request_type:
      request_type === 'CALL_BUTTON'
        ? 'CALL_BUTTON'
        : request_type === 'IOT_ESP8266' || device_id
        ? 'IOT_ESP8266'
        : 'EMERGENCY',
    device_id: device_id || `ESP8266-BED-${assignedBedId.replace('-', '')}`,
    created_at: nowIso,
    status: 'Nurse Notified',
    notes: notes || (device_id ? `Triggered via IoT Device: ${device_id}` : 'Patient Bedside Emergency Call'),
  };

  // Add to emergency log (latest first)
  globalState.emergencyRequests.unshift(emergencyRecord);

  // Add alert notification for clinical staff
  const newNotif: NotificationItem = {
    notification_id: `NOTIF-${Date.now()}`,
    target_role: 'all',
    title: `🚨 EMERGENCY ALERT: Bed ${assignedBedId}`,
    message: `Emergency signal received from Bed ${assignedBedId} (${wardName}) for patient ${patientName}. Immediate clinical response required.`,
    type: 'emergency',
    timestamp: nowIso,
    read_status: false,
    link_id: requestId,
  };
  globalState.notifications.unshift(newNotif);

  return {
    emergency: emergencyRecord,
    bed,
    notification: newNotif,
  };
}

export function updateEmergencyStatus(
  requestId: string,
  status: EmergencyStatus,
  nurseName?: string,
  notes?: string
): { success: boolean; emergency?: EmergencyRequest; notification?: NotificationItem } {
  const emergency = globalState.emergencyRequests.find((e) => e.request_id === requestId);
  if (!emergency) {
    return { success: false };
  }

  const now = new Date();
  const nowIso = now.toISOString();
  emergency.status = status;

  if (nurseName) emergency.assigned_nurse = nurseName;
  if (notes) emergency.notes = notes;

  if (status === 'Nurse Acknowledged' && !emergency.acknowledged_at) {
    emergency.acknowledged_at = nowIso;
  }

  if (status === 'Completed') {
    emergency.completed_at = nowIso;
    const startTime = new Date(emergency.created_at).getTime();
    const diffSecs = Math.max(1, Math.round((now.getTime() - startTime) / 1000));
    emergency.response_time_seconds = diffSecs;

    const bed = globalState.beds.find((b) => b.id === emergency.bed_id);
    if (bed && bed.status === 'Emergency') {
      bed.status = bed.patientId ? 'Occupied' : 'Available';
    }
  }

  const patientNotif: NotificationItem = {
    notification_id: `NOTIF-${Date.now()}`,
    user_id: emergency.patient_id,
    title: `Emergency Update: ${status}`,
    message: `Your emergency call for Bed ${emergency.bed_id} is now: ${status}${
      emergency.assigned_nurse ? ` by ${emergency.assigned_nurse}` : ''
    }.`,
    type: 'status_update',
    timestamp: nowIso,
    read_status: false,
    link_id: emergency.request_id,
  };
  globalState.notifications.unshift(patientNotif);

  return {
    success: true,
    emergency,
    notification: patientNotif,
  };
}
