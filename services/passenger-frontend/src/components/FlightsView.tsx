import { AlertTriangle } from 'lucide-react';
import type { Flight } from '../App';

interface FlightsViewProps {
  flights: Flight[];
  flightWarnings: { [key: string]: string };
  openSeatPicker: (flight: Flight) => void;
}

export default function FlightsView({ flights, flightWarnings, openSeatPicker }: FlightsViewProps) {
  return (
    <div style={{ padding: '24px 0', color: '#ffffff' }}>
      <h2 style={{ fontSize: '22px', color: '#ffffff', marginBottom: '20px', fontWeight: '700', letterSpacing: '0.5px' }}>
        Available Schedules & Global Routes
      </h2>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {flights.map(f => (
          <div key={f.flight_id} style={{ 
            background: '#090d16', 
            border: '1px solid #1e293b', 
            padding: '24px', 
            borderRadius: '12px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
          }}>
            {flightWarnings[f.flight_number] && (
              <div style={{ background: '#2c1a12', border: '1px solid #4a2b1b', color: '#f59e0b', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', fontSize: '13.5px', fontWeight: 'bold', display: 'flex', gap: '8px', alignItems: 'center' }}>
                <AlertTriangle size={16} color="#f59e0b" />
                <span>{flightWarnings[f.flight_number]}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '11px', background: '#1e293b', color: '#38bdf8', padding: '4px 10px', borderRadius: '4px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', fontFamily: 'monospace' }}>
                  ✈️ {f.airline_name}
                </span>
                <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '10px' }}>
                  Flight {f.flight_number}
                </span>
                <div style={{ fontSize: '14px', color: '#94a3b8', marginTop: '6px' }}>
                  Route Sector: <strong style={{ color: '#fff' }}>{f.origin}</strong> to <strong style={{ color: '#fff' }}>{f.destination}</strong>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ display: 'block', fontSize: '13px', color: '#10b981', fontWeight: 'bold', marginBottom: '10px' }}>
                  {f.available_seats} spots left
                </span>
                <button 
                  onClick={() => openSeatPicker(f)} 
                  style={{ padding: '10px 20px', background: '#38bdf8', color: '#0c101d', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13.5px' }}
                >
                  Choose Seat
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
