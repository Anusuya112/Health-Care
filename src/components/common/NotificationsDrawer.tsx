import React from 'react';
import { AlertCircle, AlertTriangle, Bell, Check, CheckCheck, Clock, Info, X } from 'lucide-react';
import { useHospital } from '../../context/HospitalContext.tsx';

export const NotificationsDrawer: React.FC = () => {
  const { isNotificationsOpen, setIsNotificationsOpen, state, markNotificationsAsRead } = useHospital();

  if (!isNotificationsOpen) return null;

  return (
    <div className="fixed inset-0 z-40 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/30 backdrop-blur-xs transition-opacity"
        onClick={() => setIsNotificationsOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-xl flex flex-col">
          {/* Header */}
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Bell className="w-5 h-5 text-teal-600" />
              <h2 className="text-base font-bold text-slate-900">Hospital Notifications & Alerts</h2>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => markNotificationsAsRead()}
                className="text-xs text-teal-700 hover:text-teal-900 font-medium flex items-center space-x-1"
                title="Mark all notifications as read"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark all read</span>
              </button>
              <button
                onClick={() => setIsNotificationsOpen(false)}
                className="p-1 rounded-md text-slate-500 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* List of Notifications */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-4 space-y-3">
            {state.notifications.length === 0 ? (
              <div className="text-center py-12 text-slate-600 text-sm">
                <Bell className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                No new notifications
              </div>
            ) : (
              state.notifications.map((notif) => {
                const isEmergency = notif.type === 'emergency';
                const isAssistance = notif.type === 'assistance';

                return (
                  <div
                    key={notif.notification_id}
                    onClick={() => markNotificationsAsRead(notif.notification_id)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                      !notif.read_status
                        ? isEmergency
                          ? 'bg-rose-50/80 border-rose-200 shadow-xs'
                          : isAssistance
                          ? 'bg-amber-50/80 border-amber-200 shadow-xs'
                          : 'bg-teal-50/60 border-teal-200'
                        : 'bg-white border-slate-100 opacity-80 hover:opacity-100'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="mt-0.5 shrink-0">
                        {isEmergency ? (
                          <div className="w-7 h-7 rounded-lg bg-rose-600 text-white flex items-center justify-center">
                            <AlertTriangle className="w-4 h-4" />
                          </div>
                        ) : isAssistance ? (
                          <div className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center">
                            <AlertCircle className="w-4 h-4" />
                          </div>
                        ) : (
                          <div className="w-7 h-7 rounded-lg bg-teal-600 text-white flex items-center justify-center">
                            <Info className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4
                            className={`text-xs font-bold truncate ${
                              isEmergency ? 'text-rose-900' : isAssistance ? 'text-amber-900' : 'text-slate-900'
                            }`}
                          >
                            {notif.title}
                          </h4>
                          <span className="text-[10px] text-slate-600 flex items-center space-x-1 shrink-0 ml-2">
                            <Clock className="w-3 h-3" />
                            <span>{new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </span>
                        </div>
                        <p className="text-xs text-slate-700 mt-1 leading-relaxed">{notif.message}</p>
                        {!notif.read_status && (
                          <div className="mt-2 flex items-center text-[11px] text-teal-700 font-medium">
                            <Check className="w-3 h-3 mr-1" /> Tap to mark read
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 text-center text-xs text-slate-700">
            SmartCare Hospital Real-time Telemetry • Powered by IoT ESP8266 Gateway
          </div>
        </div>
      </div>
    </div>
  );
};
