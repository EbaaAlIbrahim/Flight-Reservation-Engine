import { Shield, AlertTriangle } from 'lucide-react';
import type { NotificationMsg } from '../App';

interface AdminViewProps {
  setNotifications: React.Dispatch<React.SetStateAction<NotificationMsg[]>>;
  setToastMessage: (msg: string) => void;
  loadFlightsAndTelemetry: () => Promise<void>;
  setView: (view: 'login' | 'signup' | 'flights' | 'my-bookings' | 'notifications' | 'seats' | 'admin') => void;
}

export default function AdminView({ setNotifications, setToastMessage, loadFlightsAndTelemetry, setView }: AdminViewProps) {
  return (
    <div style={{ padding: '24px 0', color: '#ffffff' }}>
      <div style={{ background: '#090d16', padding: '32px', borderRadius: '16px', border: '1px solid #1e293b', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid #1e293b', paddingBottom: '16px', marginBottom: '24px' }}>
          <Shield size={26} color="#10b981" />
          <div>
            <h2 style={{ margin: 0, fontSize: '20px', color: '#ffffff', fontWeight: '700' }}>Operations Center Command Dashboard</h2>
            <span style={{ fontSize: '13px', color: '#64748b' }}>Calculate and evaluate flight disruption constraints</span>
          </div>
        </div>

        <div style={{ background: '#111827', border: '1px solid #1e293b', padding: '24px', borderRadius: '12px' }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', color: '#f59e0b', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={18} /> Predictive Analytics Module
          </h3>
          <p style={{ margin: '0 0 20px 0', fontSize: '14px', color: '#94a3b8', lineHeight: '1.6' }}>
            Here an AI agent can predict the landing delay duration of the flight based on real-time operational circumstances.
          </p>

          <button onClick={() => {
            const targetFlightCode = prompt("Enter the active Dubai flight number to evaluate:", "EK507") || "EK507";
            fetch('http://localhost:8000/predict-delay', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ flight_number: targetFlightCode.toUpperCase() })
            })
            .then(res => res.json())
            .then(data => {
              if (data.status === 'SUCCESS') {
                const delayAlert: NotificationMsg = {
                  id: Math.random().toString(),
                  title: '🕒 ML Operational Notice Issued',
                  timestamp: new Date().toLocaleTimeString(),
                  details: `Machine learning analysis flags Flight ${data.flight_number}. Predicted delay duration is +${data.predicted_delay_duration_minutes} minutes (${data.calculated_cancellation_probability} cancellation probability risk).`,
                  type: 'warning'
                };
                setNotifications(prev => [delayAlert, ...prev]);
                setToastMessage(`🧠 ML Forest Model Complete! Flight ${data.flight_number} delay predicted at +${data.predicted_delay_duration_minutes} minutes. Registered passengers notified.`);
                loadFlightsAndTelemetry();
                setView('flights');
              } else {
                setToastMessage(`❌ Prediction Denied: ${data.detail || 'Processing fault.'}`);
              }
            })
            .catch(() => {
              setToastMessage('❌ Failed to establish communication with Python Data Science analytics cluster.');
            });
          }} 
          style={{ background: '#f59e0b', color: '#090d16', border: 'none', padding: '12px 24px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13.5px' }}
          >
            Flight Delay Predictor
          </button>
        </div>
      </div>
    </div>
  );
}
