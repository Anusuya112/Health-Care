import express, { Request, Response } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
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
} from './src/types.ts';
import { createInitialHospitalState } from './src/data/initialData.ts';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // CORS Middleware for external IoT devices, ESP8266, postman, and frontend cross-origin requests
  app.use((req: Request, res: Response, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // In-memory clinical state with database persistence logic
  let state: HospitalState = createInitialHospitalState();

  // SSE client connections for real-time alerts
  const sseClients: Response[] = [];

  function broadcastEvent(eventType: string, payload: any) {
    const data = JSON.stringify({ type: eventType, data: payload, timestamp: new Date().toISOString() });
    for (let i = sseClients.length - 1; i >= 0; i--) {
      try {
        sseClients[i].write(`event: ${eventType}\ndata: ${data}\n\n`);
      } catch (err) {
        sseClients.splice(i, 1);
      }
    }
  }

  // API ROUTES
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({
      status: 'ok',
      service: 'SmartCare Hospital IoT & Patient Assistance Backend',
      timestamp: new Date().toISOString(),
      activeEmergencies: state.emergencyRequests.filter((e) => e.status !== 'Completed').length,
      connectedSseClients: sseClients.length,
    });
  });

  // Full state retrieval
  app.get('/api/data', (req: Request, res: Response) => {
    res.json(state);
  });

  // Reset to initial demo state
  app.post('/api/reset', (req: Request, res: Response) => {
    state = createInitialHospitalState();
    broadcastEvent('state_refresh', state);
    res.json({ success: true, message: 'Hospital database reset to initial demonstration state.' });
  });

  // Real-time SSE stream
  app.get('/api/events', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    res.write(`data: ${JSON.stringify({ type: 'connected', message: 'SmartCare Telemetry Stream Connected' })}\n\n`);
    sseClients.push(res);

    const heartbeat = setInterval(() => {
      try {
        res.write(': heartbeat\n\n');
      } catch {
        clearInterval(heartbeat);
      }
    }, 20000);

    req.on('close', () => {
      clearInterval(heartbeat);
      const index = sseClients.indexOf(res);
      if (index !== -1) sseClients.splice(index, 1);
    });
  });

  // ESP8266 IoT EMERGENCY ENDPOINT
  // Supported formats:
  // GET /api/emergency (Status, Instructions, Live Emergencies list)
  // POST /api/emergency { device_id, patient_id, bed_id, request_type, notes }
  app.get('/api/emergency', (req: Request, res: Response) => {
    const activeEmergencies = state.emergencyRequests.filter((e) => e.status !== 'Completed');
    res.json({
      status: 'online',
      service: 'SmartCare Hospital Bedside IoT ESP8266 Emergency Gateway',
      endpoint: '/api/emergency',
      supported_methods: ['POST', 'GET', 'OPTIONS'],
      active_emergencies_count: activeEmergencies.length,
      recent_emergencies: state.emergencyRequests.slice(0, 5),
      instructions: {
        description:
          'Trigger an immediate emergency alert by sending an HTTP POST request with a JSON payload.',
        sample_curl_command: `curl -X POST https://${req.headers.host || 'smart-care-hospital-taupe.vercel.app'}/api/emergency -H "Content-Type: application/json" -d '{"device_id":"ESP8266-BED-A204","bed_id":"A-204","patient_id":"P102","request_type":"IOT_ESP8266"}'`,
        expected_json_payload: {
          device_id: 'ESP8266-BED-A204',
          patient_id: 'P102',
          bed_id: 'A-204',
          request_type: 'IOT_ESP8266',
          notes: 'Bedside emergency trigger',
        },
      },
    });
  });

  app.post('/api/emergency', (req: Request, res: Response) => {
    const { device_id, patient_id, bed_id, request_type, notes } = req.body;

    // Normalize bed ID (handle "A204" -> "A-204")
    let normalizedBedId = bed_id || '';
    if (normalizedBedId && !normalizedBedId.includes('-') && normalizedBedId.length >= 4) {
      normalizedBedId = `${normalizedBedId[0]}-${normalizedBedId.slice(1)}`;
    }

    // Find bed and patient
    let bed = state.beds.find((b) => b.id.toLowerCase() === normalizedBedId.toLowerCase());
    let patient = state.patients.find(
      (p) => p.patient_id === patient_id || (bed && p.bed_id === bed.id)
    );

    if (!bed && patient) {
      bed = state.beds.find((b) => b.id === patient?.bed_id);
    }

    const assignedBedId = bed ? bed.id : normalizedBedId || 'A-204';
    const wardName = bed ? bed.ward : 'Ward A';
    const patientName = patient ? patient.name : 'Emergency Patient';
    const resolvedPatientId = patient ? patient.patient_id : patient_id || 'P102';

    // Mark bed as Emergency
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
      request_type: request_type || (device_id ? 'IOT_ESP8266' : 'EMERGENCY'),
      device_id: device_id || `ESP8266-BED-${assignedBedId.replace('-', '')}`,
      created_at: nowIso,
      status: 'Nurse Notified',
      notes: notes || (device_id ? `Triggered via IoT Device: ${device_id}` : 'Patient Bedside Emergency Call'),
    };

    // Prepend to emergency requests
    state.emergencyRequests.unshift(emergencyRecord);

    // Add alert notification for nurses & administrators
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
    state.notifications.unshift(newNotif);

    // Broadcast to all active clients (Nurse dashboard, patient portal, admin)
    broadcastEvent('emergency_alert', {
      emergency: emergencyRecord,
      bed: bed,
      notification: newNotif,
    });

    console.log(`[SmartCare IoT API] Emergency created: ${requestId} for Bed ${assignedBedId} (Device: ${emergencyRecord.device_id})`);

    res.status(200).json({
      success: true,
      request_id: requestId,
      patient_id: resolvedPatientId,
      patient_name: patientName,
      bed_id: assignedBedId,
      ward: wardName,
      status: emergencyRecord.status,
      timestamp: nowIso,
      message: 'Emergency request registered. Nurse Station notified immediately.',
      device_id: emergencyRecord.device_id,
    });
  });

  // Emergency status transitions (Nurse workflow)
  app.post('/api/emergency/status', (req: Request, res: Response) => {
    const { request_id, status, nurse_name, notes } = req.body as {
      request_id: string;
      status: EmergencyStatus;
      nurse_name?: string;
      notes?: string;
    };

    const emergency = state.emergencyRequests.find((e) => e.request_id === request_id);
    if (!emergency) {
      return res.status(404).json({ success: false, error: 'Emergency record not found' });
    }

    const now = new Date();
    const nowIso = now.toISOString();
    emergency.status = status;

    if (nurse_name) {
      emergency.assigned_nurse = nurse_name;
    }
    if (notes) {
      emergency.notes = notes;
    }

    if (status === 'Nurse Acknowledged' && !emergency.acknowledged_at) {
      emergency.acknowledged_at = nowIso;
    }

    if (status === 'Completed') {
      emergency.completed_at = nowIso;
      const startTime = new Date(emergency.created_at).getTime();
      const diffSecs = Math.max(1, Math.round((now.getTime() - startTime) / 1000));
      emergency.response_time_seconds = diffSecs;

      // Restore bed status from Emergency to Occupied (or Available)
      const bed = state.beds.find((b) => b.id === emergency.bed_id);
      if (bed && bed.status === 'Emergency') {
        bed.status = bed.patientId ? 'Occupied' : 'Available';
      }
    }

    // Create notification for patient
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
    state.notifications.unshift(patientNotif);

    broadcastEvent('emergency_update', {
      emergency,
      notification: patientNotif,
      beds: state.beds,
    });

    res.json({
      success: true,
      emergency,
      message: `Emergency status updated to "${status}"`,
    });
  });

  // Patient Assistance Request
  app.post('/api/assistance', (req: Request, res: Response) => {
    const { patient_id, bed_id, type, notes } = req.body;

    const patient = state.patients.find((p) => p.patient_id === patient_id);
    const bed = state.beds.find((b) => b.id === bed_id) || state.beds.find((b) => b.id === patient?.bed_id);

    const assignedBed = bed?.id || 'A-204';
    const wardName = bed?.ward || 'Ward A';
    const patientName = patient?.name || 'Johnathan Vance';
    const nowIso = new Date().toISOString();

    const newRequest: AssistanceRequest = {
      request_id: `AST-${Math.floor(1000 + Math.random() * 9000)}`,
      patient_id: patient?.patient_id || patient_id || 'P102',
      patient_name: patientName,
      bed_id: assignedBed,
      ward: wardName,
      type: type || 'Need Nurse',
      status: 'Pending',
      created_at: nowIso,
      notes: notes || '',
    };

    state.assistanceRequests.unshift(newRequest);

    const nurseNotif: NotificationItem = {
      notification_id: `NOTIF-${Date.now()}`,
      target_role: 'nurse',
      title: `Assistance Request: ${newRequest.type}`,
      message: `${patientName} (Bed ${assignedBed}, ${wardName}) requested: ${newRequest.type}.`,
      type: 'assistance',
      timestamp: nowIso,
      read_status: false,
      link_id: newRequest.request_id,
    };
    state.notifications.unshift(nurseNotif);

    if (newRequest.type === 'Request Medicine') {
      const patientMedNotif: NotificationItem = {
        notification_id: `NOTIF-${Date.now() + 1}`,
        user_id: newRequest.patient_id,
        target_role: 'patient',
        title: 'Medicine Request Submitted',
        message: `Your medicine request for Bed ${assignedBed} is being routed to Pharmacy & Nurse Station.`,
        type: 'assistance',
        timestamp: nowIso,
        read_status: false,
        link_id: newRequest.request_id,
      };
      state.notifications.unshift(patientMedNotif);
    }

    broadcastEvent('assistance_new', { request: newRequest, notification: nurseNotif });

    res.json({
      success: true,
      request: newRequest,
      message: 'Request successfully submitted.',
    });
  });

  // Assistance Status Update
  app.post('/api/assistance/status', (req: Request, res: Response) => {
    const { request_id, status, nurse_name } = req.body;
    const reqItem = state.assistanceRequests.find((a) => a.request_id === request_id);
    if (!reqItem) {
      return res.status(404).json({ success: false, error: 'Assistance request not found' });
    }

    const nowIso = new Date().toISOString();
    reqItem.status = status;
    if (nurse_name) reqItem.assigned_nurse = nurse_name;
    if (status === 'Acknowledged' && !reqItem.acknowledged_at) reqItem.acknowledged_at = nowIso;
    if (status === 'Completed' && !reqItem.completed_at) reqItem.completed_at = nowIso;

    // Notify patient about assistance/medicine status update
    const updateNotif: NotificationItem = {
      notification_id: `NOTIF-${Date.now()}`,
      user_id: reqItem.patient_id,
      target_role: 'patient',
      title: `${reqItem.type}: ${status}`,
      message: `${reqItem.type} for Bed ${reqItem.bed_id} is now ${status}${
        nurse_name ? ` by ${nurse_name}` : ''
      }.`,
      type: 'status_update',
      timestamp: nowIso,
      read_status: false,
      link_id: reqItem.request_id,
    };
    state.notifications.unshift(updateNotif);

    broadcastEvent('assistance_update', { request: reqItem, notification: updateNotif });
    res.json({ success: true, request: reqItem });
  });

  // Bed Status Management
  app.post('/api/beds/status', (req: Request, res: Response) => {
    const { bed_id, status, patient_id, patient_name } = req.body;
    const bed = state.beds.find((b) => b.id === bed_id);
    if (!bed) {
      return res.status(404).json({ success: false, error: 'Bed not found' });
    }

    bed.status = status;
    if (patient_id !== undefined) bed.patientId = patient_id;
    if (patient_name !== undefined) bed.patientName = patient_name;

    // Notify patient and team about bed assignment update
    const bedNotif: NotificationItem = {
      notification_id: `NOTIF-${Date.now()}`,
      target_role: 'all',
      title: `Bed ${bed.id} Status Updated`,
      message: `Bed ${bed.id} (${bed.ward}, Floor ${bed.floor}) status updated to ${status}${
        patient_name ? ` for ${patient_name}` : ''
      }.`,
      type: 'status_update',
      timestamp: new Date().toISOString(),
      read_status: false,
    };
    state.notifications.unshift(bedNotif);

    broadcastEvent('bed_update', { bed, notification: bedNotif });
    res.json({ success: true, bed });
  });

  // Nurse Tasks management
  app.post('/api/tasks/toggle', (req: Request, res: Response) => {
    const { task_id } = req.body;
    const task = state.nurseTasks.find((t) => t.id === task_id);
    if (!task) return res.status(404).json({ success: false, error: 'Task not found' });
    task.completed = !task.completed;
    broadcastEvent('task_update', { task });
    res.json({ success: true, task });
  });

  app.post('/api/tasks/create', (req: Request, res: Response) => {
    const { task_title, bed_id, patient_name, priority, due_time, nurse_id } = req.body;
    const newTask: NurseTask = {
      id: `TSK-${Math.floor(100 + Math.random() * 900)}`,
      nurse_id: nurse_id || 'N201',
      bed_id: bed_id || 'General',
      patient_name: patient_name || 'Ward Task',
      task_title,
      due_time: due_time || 'Next Round',
      priority: priority || 'Medium',
      completed: false,
    };
    state.nurseTasks.push(newTask);
    broadcastEvent('task_update', { task: newTask });
    res.json({ success: true, task: newTask });
  });

  // Facilities management (Admin)
  app.post('/api/facilities/save', (req: Request, res: Response) => {
    const facility = req.body as Facility;
    const index = state.facilities.findIndex((f) => f.facility_id === facility.facility_id);
    if (index >= 0) {
      state.facilities[index] = facility;
    } else {
      facility.facility_id = facility.facility_id || `FAC-${Date.now()}`;
      state.facilities.push(facility);
    }
    broadcastEvent('facilities_update', { facilities: state.facilities });
    res.json({ success: true, facility });
  });

  app.post('/api/facilities/delete', (req: Request, res: Response) => {
    const { facility_id } = req.body;
    state.facilities = state.facilities.filter((f) => f.facility_id !== facility_id);
    broadcastEvent('facilities_update', { facilities: state.facilities });
    res.json({ success: true });
  });

  // Doctors management (Admin)
  app.post('/api/doctors/save', (req: Request, res: Response) => {
    const doctor = req.body as Doctor;
    const index = state.doctors.findIndex((d) => d.doctor_id === doctor.doctor_id);
    if (index >= 0) {
      state.doctors[index] = doctor;
    } else {
      doctor.doctor_id = doctor.doctor_id || `DOC-${Date.now()}`;
      state.doctors.push(doctor);
    }
    broadcastEvent('doctors_update', { doctors: state.doctors });
    res.json({ success: true, doctor });
  });

  app.post('/api/doctors/delete', (req: Request, res: Response) => {
    const { doctor_id } = req.body;
    state.doctors = state.doctors.filter((d) => d.doctor_id !== doctor_id);
    broadcastEvent('doctors_update', { doctors: state.doctors });
    res.json({ success: true });
  });

  // Notifications mark as read
  app.post('/api/notifications/read', (req: Request, res: Response) => {
    const { notification_id } = req.body;
    if (notification_id) {
      const n = state.notifications.find((notif) => notif.notification_id === notification_id);
      if (n) n.read_status = true;
    } else {
      state.notifications.forEach((n) => (n.read_status = true));
    }
    res.json({ success: true });
  });

  // VITE MIDDLEWARE SETUP
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SmartCare Hospital server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start SmartCare Hospital server:', err);
  process.exit(1);
});
