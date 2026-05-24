import { XCircle } from 'lucide-react';
import type { UserBooking } from '../App';

interface MyBookingsViewProps {
  userBookings: UserBooking[];
  handleCancelBooking: (bookingId: number, flightNumber: string) => Promise<void>;
}

export default function MyBookingsView({ userBookings, handleCancelBooking }: MyBookingsViewProps) {
  return (
    <div style={{ padding: '24px 0', color: '#ffffff' }}>
      <h2 style={{ fontSize: '22px', color: '#ffffff', marginBottom: '20px', fontWeight: '700', letterSpacing: '0.5px' }}>
        Your Active Flight Travel Profiles
      </h2>
      {userBookings.length === 0 ? (
        <div style={{ background: '#090d16', padding: '40px', borderRadius: '14px', textAlign: 'center', color: '#94a3b8', border: '1px solid #1e293b' }}>
          No active reservations logged. Select schedules to reserve a ticket.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {userBookings.map(b => (
            <div key={b.booking_id} style={{ background: '#090d16', border: '1px solid #1e293b', padding: '24px', borderRadius: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '11px', background: '#1e293b', color: '#38bdf8', padding: '4px 8px', borderRadius: '4px', fontWeight: 'bold', fontFamily: 'monospace' }}>
                  {b.airline_name}
                </span>
                <div style={{ fontWeight: 'bold', fontSize: '18px', color: '#ffffff', marginTop: '10px' }}>Flight {b.flight_number}</div>
                <div style={{ fontSize: '14px', color: '#94a3b8', marginTop: '6px' }}>Route Vector: <strong style={{ color: '#fff' }}>{b.origin} ➔ {b.destination}</strong></div>
                <div style={{ fontSize: '14px', color: '#94a3b8', marginTop: '4px' }}>Assigned Coordinate: <strong style={{ color: '#10b981' }}>{b.seat_number}</strong></div>
                <span style={{ display: 'inline-block', marginTop: '10px', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold', background: b.status === 'DISRUPTED' ? '#2c1a12' : '#112420', color: b.status === 'DISRUPTED' ? '#ef4444' : '#10b981' }}>
                  Status: {b.status}
                </span>
              </div>
              <button 
                onClick={() => handleCancelBooking(b.booking_id, b.flight_number)} 
                style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13.5px', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <XCircle size={16} /> Drop Reservation
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
