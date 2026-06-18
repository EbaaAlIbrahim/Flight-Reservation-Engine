import { useState } from 'react';
import { Shield, AlertTriangle } from 'lucide-react';
import type { NotificationMsg } from '../App';
import { API_BASE_URL } from '../config'; // 🟢 Import your global API connection prefix URL string

interface AdminViewProps {
  setNotifications: React.Dispatch<React.SetStateAction<NotificationMsg[]>>;
  setToastMessage: (msg: string) => void;
  loadFlightsAndTelemetry: () => Promise<void>;
  setView: (view: 'login' | 'signup' | 'flights' | 'my-bookings' | 'notifications' | 'seats' | 'admin') => void;
}

export default function AdminView({ setNotifications, setToastMessage, loadFlightsAndTelemetry, setView }: AdminViewProps) {
  const [loading, setLoading] = useState(false);

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
            Evaluate live weather circumstances and airfield congestion constraints to predict delay risks and update passenger timelines.
          </p>

          <button 
            disabled={loading}
            onClick={() => {
              // 🟢 Default prompt updated to target your seeded flight numbers (e.g., AA102, UA405, DL889)
              const targetFlightCode = prompt("Enter the active flight number to evaluate (e.g., AA102):", "AA102") || "AA102";
              
              setLoading(true);
              setToastMessage('🧠 AI Core simulating airfield congestion matrices...');

              // 🟢 FIXED: Target your Express deployment api base URL instead of localhost
              fetch(`${API_BASE_URL}/api/flights/predict-delay`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                  flightNumber: targetFlightCode.toUpperCase().trim(),
                  circumstances: {
                    weatherCondition: 'SNOW', // Triggers +90 delay mins and elevated cancellation odds
                    runwayBacklogCount: 12     // Triggers +60 compounding delay minutes
                  }
                })
              })
              .then(async (res) => {
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'Server predictive model evaluation crash.');
                return data;
              })
              .then(data => {
                const delayAlert: NotificationMsg = {
                  id: Math.random().toString(),
                  title: '🕒 ML Operational Status Update',
                  timestamp: new Date().toLocaleTimeString(),
                  details: `AI Model analysis flags Flight ${data.flight_number}. Predicted delay duration is +${data.calculated_delay_minutes} minutes (${data.calculated_cancellation_probability} cancellation probability profile risk).`,
                  type: 'warning'
                };
                setNotifications(prev => [delayAlert, ...prev]);
                setToastMessage(`🧠 AI Analysis Complete! Flight ${data.flight_number} updated to +${data.calculated_delay_minutes} mins delay. Impacts saved to live Postgres schemas.`);
                loadFlightsAndTelemetry();
                setView('flights');
              })
              .catch((err) => {
                setToastMessage(`❌ Prediction Fault: ${err.message}`);
              })
              .finally(() => {
                setLoading(false);
              });
            }} 
            style={{ 
              background: loading ? '#4b5563' : '#f59e0b', 
              color: '#090d16', 
              border: 'none', 
              padding: '12px 24px', 
              borderRadius: '6px', 
              fontWeight: 'bold', 
              cursor: loading ? 'not-allowed' : 'pointer', 
              fontSize: '14px' 
            }}
          >
            {loading ? 'Evaluating Core Vectors...' : 'Run Disruption Prediction'}
          </button>
        </div>
      </div>
    </div>
  );
}
