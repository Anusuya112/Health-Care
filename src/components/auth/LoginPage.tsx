import React, { useState } from 'react';
import {
  Activity,
  ArrowRight,
  BedDouble,
  CheckCircle2,
  Lock,
  Phone,
  Shield,
  Stethoscope,
  User,
  Users,
} from 'lucide-react';
import { useHospital } from '../../context/HospitalContext.tsx';
import { UserRole } from '../../types.ts';

export const LoginPage: React.FC = () => {
  const { login, state } = useHospital();

  const [selectedRole, setSelectedRole] = useState<UserRole>('patient');

  // Patient form fields (Manual Entry)
  const [patientName, setPatientName] = useState<string>('');
  const [patientId, setPatientId] = useState<string>('');
  const [bedId, setBedId] = useState<string>('A-204');
  const [contact, setContact] = useState<string>('');
  const [age, setAge] = useState<string>('');
  const [gender, setGender] = useState<string>('Male');
  const [attendantName, setAttendantName] = useState<string>('');
  const [attendantPhone, setAttendantPhone] = useState<string>('');
  const [primaryDoctor, setPrimaryDoctor] = useState<string>(
    'Dr. Evelyn Reed (Cardiology)'
  );
  const [conditionSummary, setConditionSummary] = useState<string>('');

  // Staff form fields (Nurse / Admin)
  const [staffName, setStaffName] = useState<string>('Nurse Priya Sharma, RN');
  const [badgeNumber, setBadgeNumber] = useState<string>('RN-4421');
  const [staffWard, setStaffWard] = useState<string>('Ward A');

  const handleRoleChange = (role: UserRole) => {
    setSelectedRole(role);
    if (role === 'nurse') {
      setStaffName('Nurse Priya Sharma, RN');
      setBadgeNumber('RN-4421');
      setStaffWard('Ward A');
    } else if (role === 'admin') {
      setStaffName('Dr. Arthur Sterling (Admin)');
      setBadgeNumber('ADM-001');
      setStaffWard('Hospital Administration');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedRole === 'patient') {
      // Find ward from bed
      const matchedBed = state.beds.find((b) => b.id === bedId);
      const wardId = matchedBed ? matchedBed.ward : bedId.startsWith('B') ? 'Ward B' : 'Ward A';

      const resolvedName = patientName.trim() || 'Patient';
      const resolvedPatientId = patientId.trim() || `P${Math.floor(100 + Math.random() * 900)}`;
      const resolvedContact = contact.trim() || '+1 (555) 234-5678';
      const resolvedAttendant = attendantName.trim() || 'Family Attendant';
      const resolvedAttendantPhone = attendantPhone.trim() || resolvedContact;
      const resolvedAge = Number(age) || 45;

      login({
        role: 'patient',
        name: resolvedName,
        contact: resolvedContact,
        patient_id: resolvedPatientId,
        bed_id: bedId.trim() || 'A-204',
        ward_id: wardId,
        age: resolvedAge,
        gender,
        attendant_name: resolvedAttendant,
        attendant_phone: resolvedAttendantPhone,
        primary_doctor: primaryDoctor,
        condition_summary: conditionSummary.trim() || 'Inpatient admission, bedside telemetry monitoring active.',
        badgeNumber: `PT-${resolvedPatientId.replace(/\D/g, '') || '9041'}`,
      });
    } else {
      login({
        role: selectedRole,
        name: staffName.trim() || (selectedRole === 'nurse' ? 'Nurse' : 'Administrator'),
        contact: '+1 (555) 999-0000',
        badgeNumber: badgeNumber.trim() || (selectedRole === 'nurse' ? 'RN-4001' : 'ADM-001'),
        ward_id: staffWard,
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-teal-50/20 to-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Header Branding */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-teal-600 text-white shadow-sm mb-3">
          <Activity className="w-8 h-8 stroke-[2.5]" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
          SmartCare<span className="text-teal-600">Hospital</span>
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-slate-600">
          Patient Assistance, Indoor Navigation & Bedside IoT System
        </p>
      </div>

      {/* Main Login Card */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-8 shadow-md rounded-3xl border border-slate-200">
          {/* Role Tabs */}
          <div className="mb-6">
            <label className="text-xs font-bold text-slate-700 block mb-2">
              Select Portal Access Role:
            </label>
            <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 rounded-2xl border border-slate-200/80">
              <button
                type="button"
                id="login-role-patient"
                onClick={() => handleRoleChange('patient')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
                  selectedRole === 'patient'
                    ? 'bg-white text-teal-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>Patient</span>
              </button>

              <button
                type="button"
                id="login-role-nurse"
                onClick={() => handleRoleChange('nurse')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
                  selectedRole === 'nurse'
                    ? 'bg-white text-teal-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Stethoscope className="w-3.5 h-3.5" />
                <span>Nurse</span>
              </button>

              <button
                type="button"
                id="login-role-admin"
                onClick={() => handleRoleChange('admin')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
                  selectedRole === 'admin'
                    ? 'bg-white text-teal-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Admin</span>
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {selectedRole === 'patient' ? (
              <>
                {/* Patient Name */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Patient Full Name <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      id="login-patient-name"
                      type="text"
                      required
                      placeholder="e.g. Johnathan Vance"
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white"
                    />
                  </div>
                </div>

                {/* Bed Assignment & Patient ID (2-Columns) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Assigned Bed Number <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <BedDouble className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <select
                        id="login-patient-bed"
                        value={bedId}
                        onChange={(e) => setBedId(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-teal-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white"
                      >
                        {state.beds.map((b) => (
                          <option key={b.id} value={b.id}>
                            Bed {b.id} ({b.ward} • Fl {b.floor})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Patient ID <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="login-patient-id"
                      type="text"
                      required
                      placeholder="e.g. P102"
                      value={patientId}
                      onChange={(e) => setPatientId(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white"
                    />
                  </div>
                </div>

                {/* Contact & Gender */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Contact Number
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        id="login-patient-contact"
                        type="tel"
                        placeholder="+1 (555) 234-5678"
                        value={contact}
                        onChange={(e) => setContact(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Age</label>
                      <input
                        type="number"
                        min={1}
                        max={120}
                        placeholder="e.g. 48"
                        value={age}
                        onChange={(e) => setAge(e.target.value)}
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Gender</label>
                      <select
                        value={gender}
                        onChange={(e) => setGender(e.target.value)}
                        className="w-full px-2.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Attendant Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Attendant / Emergency Contact
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Clara Vance (Spouse)"
                      value={attendantName}
                      onChange={(e) => setAttendantName(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Attendant Phone
                    </label>
                    <input
                      type="tel"
                      placeholder="e.g. +1 (555) 234-9988"
                      value={attendantPhone}
                      onChange={(e) => setAttendantPhone(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>

                {/* Primary Doctor */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Primary Consulting Doctor
                  </label>
                  <select
                    value={primaryDoctor}
                    onChange={(e) => setPrimaryDoctor(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    {state.doctors.map((d) => (
                      <option key={d.doctor_id} value={`${d.name} (${d.department})`}>
                        {d.name} — {d.department} ({d.room})
                      </option>
                    ))}
                  </select>
                </div>
              </>
            ) : (
              <>
                {/* Staff Login Fields */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Staff Full Name <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      id="login-staff-name"
                      type="text"
                      required
                      value={staffName}
                      onChange={(e) => setStaffName(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Staff / Badge ID <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="login-staff-badge"
                      type="text"
                      required
                      value={badgeNumber}
                      onChange={(e) => setBadgeNumber(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Department / Ward
                    </label>
                    <input
                      type="text"
                      value={staffWard}
                      onChange={(e) => setStaffWard(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>

                <div className="p-3 bg-teal-50/70 border border-teal-200 rounded-xl text-xs text-teal-800 flex items-start space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                  <span>
                    Authenticated as clinical personnel. You will access the real-time telemetry console and bedside alerts.
                  </span>
                </div>
              </>
            )}

            {/* Login Action Submit Button */}
            <div className="pt-2">
              <button
                id="login-submit-btn"
                type="submit"
                className="w-full py-3.5 px-4 bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm rounded-xl shadow-xs transition-colors flex items-center justify-center space-x-2 group cursor-pointer"
              >
                <span>
                  {selectedRole === 'patient'
                    ? 'Enter Patient Bedside Portal'
                    : selectedRole === 'nurse'
                    ? 'Launch Nurse Clinical Station'
                    : 'Access Hospital Admin Console'}
                </span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </form>

          {/* Footer note */}
          <div className="mt-6 pt-4 border-t border-slate-100 text-center text-[11px] text-slate-500">
            SmartCare Hospital Telemetry • Bedside ESP8266 IoT Gateway Connected
          </div>
        </div>
      </div>
    </div>
  );
};
