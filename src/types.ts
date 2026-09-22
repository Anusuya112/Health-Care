export type UserRole = 'patient' | 'nurse' | 'admin';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  contact: string;
  email?: string;
  badgeNumber?: string;
  avatarUrl?: string;
  ward?: string;
  assignedBed?: string;
}

export type BedStatus = 'Available' | 'Occupied' | 'Cleaning' | 'Maintenance' | 'Emergency';

export interface Bed {
  id: string; // e.g. "A-204"
  ward: string; // e.g. "Ward A"
  room: string; // e.g. "Room 204"
  floor: number; // e.g. 2
  block: string; // e.g. "Block B"
  status: BedStatus;
  patientId?: string;
  patientName?: string;
  iotDeviceId?: string;
}

export interface Patient {
  patient_id: string; // e.g. "P102"
  user_id: string;
  name: string;
  age: number;
  gender: string;
  bed_id: string;
  ward_id: string;
  attendant_name: string;
  attendant_phone: string;
  emergency_contact?: string;
  admission_date: string;
  primary_doctor: string;
  condition_summary: string;
  fall_risk?: string;
  allergies?: string[];
}

export interface Nurse {
  nurse_id: string;
  user_id: string;
  name: string;
  assigned_ward: string;
  shift: string;
  status: 'On Duty' | 'On Break' | 'Assisting';
  phone: string;
}

export type DoctorAvailability = 'Available' | 'In OPD' | 'On Break' | 'Emergency Duty';

export interface Doctor {
  doctor_id: string;
  name: string;
  department: string;
  specialization: string;
  room: string;
  floor: number;
  block: string;
  availability: DoctorAvailability;
  consultation_hours: string;
  avatar: string;
  experienceYears: number;
}

export type FacilityCategory =
  | 'doctor'
  | 'department'
  | 'ward'
  | 'nurse_station'
  | 'laboratory'
  | 'pharmacy'
  | 'water'
  | 'cafeteria'
  | 'restroom'
  | 'billing'
  | 'registration'
  | 'blood_bank'
  | 'xray'
  | 'exit'
  | 'parking';

export interface Facility {
  facility_id: string;
  name: string;
  category: FacilityCategory;
  building: string; // Block A, Block B, Block C
  floor: number; // 0 = Ground, 1 = 1st, 2 = 2nd, 3 = 3rd
  room?: string;
  description: string;
  opening_hours?: string;
  distance?: string;
  directions: string[]; // Step-by-step guidance
  coordinates: { x: number; y: number }; // Relative coordinates on the floor plan
}

export type EmergencyStatus =
  | 'Request Sent'
  | 'Nurse Notified'
  | 'Nurse Acknowledged'
  | 'Assistance in Progress'
  | 'Completed';

export interface EmergencyRequest {
  request_id: string;
  patient_id: string;
  patient_name: string;
  bed_id: string;
  ward: string;
  request_type: 'EMERGENCY' | 'IOT_ESP8266' | 'CALL_BUTTON';
  device_id?: string;
  created_at: string; // ISO timestamp
  acknowledged_at?: string;
  completed_at?: string;
  assigned_nurse?: string;
  status: EmergencyStatus;
  response_time_seconds?: number;
  notes?: string;
}

export type AssistanceCategory =
  | 'Need Nurse'
  | 'Need Water'
  | 'Need Wheelchair'
  | 'Need Help Finding Location'
  | 'Need Attendant Assistance'
  | 'Request Medicine'
  | 'Other';

export type AssistanceStatus = 'Pending' | 'Nurse Notified' | 'Acknowledged' | 'In Progress' | 'Completed';

export interface AssistanceRequest {
  request_id: string;
  patient_id: string;
  patient_name: string;
  bed_id: string;
  ward: string;
  type: AssistanceCategory;
  status: AssistanceStatus;
  created_at: string;
  acknowledged_at?: string;
  completed_at?: string;
  assigned_nurse?: string;
  notes?: string;
}

export interface NotificationItem {
  notification_id: string;
  user_id?: string;
  target_role?: UserRole | 'all';
  title: string;
  message: string;
  type: 'emergency' | 'assistance' | 'status_update' | 'announcement';
  timestamp: string;
  read_status: boolean;
  link_id?: string;
}

export interface NurseTask {
  id: string;
  nurse_id: string;
  bed_id: string;
  patient_name: string;
  task_title: string;
  due_time: string;
  priority: 'High' | 'Medium' | 'Routine';
  completed: boolean;
}

export interface IotDevice {
  device_id: string;
  bed_id: string;
  ward: string;
  status: 'online' | 'offline';
  ip_address: string;
  auth_token: string;
  last_heartbeat: string;
  signal_rssi?: number;
  battery_level?: number;
  firmware_version?: string;
}

export interface HospitalState {
  patients: Patient[];
  nurses: Nurse[];
  doctors: Doctor[];
  facilities: Facility[];
  beds: Bed[];
  emergencyRequests: EmergencyRequest[];
  assistanceRequests: AssistanceRequest[];
  notifications: NotificationItem[];
  nurseTasks: NurseTask[];
  iotDevices: IotDevice[];
}
