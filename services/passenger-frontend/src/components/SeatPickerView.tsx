import { Grid, CreditCard } from 'lucide-react';
import type { Flight, Seat } from '../App';

interface SeatPickerViewProps {
  selectedFlight: Flight;
  seats: Seat[];
  selectedSeat: string | null;
  setSelectedSeat: (seatNumber: string | null) => void;
  paymentLoading: boolean;
  executeSecureBooking: () => Promise<void>;
}

export default function SeatPickerView({ selectedFlight, seats, selectedSeat, setSelectedSeat, paymentLoading, executeSecureBooking }: SeatPickerViewProps) {
  return (
    <div style={{ padding: '24px 0', color: '#ffffff', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
      
      {/* LEFT PANEL: Seating Matrix */}
      <div style={{ background: '#090d16', padding: '24px', borderRadius: '12px', border: '1px solid #1e293b' }}>
        <h3 style={{ margin: '0 0 6px 0', fontSize: '16px', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Grid size={18} color="#38bdf8" /> Interactive Seating Array
        </h3>
        <p style={{ margin: '0 0 20px 0', fontSize: '13px', color: '#94a3b8' }}>Select an open grid square location coordinates</p>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 65px)', gap: '14px', justifyContent: 'center', background: '#111827', padding: '28px', borderRadius: '12px', border: '1px solid #1e293b' }}>
          {seats.map(s => (
            <button 
              key={s.seat_id} 
              disabled={s.is_booked} 
              onClick={() => setSelectedSeat(s.seat_number)} 
              style={{ 
                height: '52px', 
                borderRadius: '8px', 
                fontWeight: 'bold', 
                fontSize: '14px', 
                cursor: s.is_booked ? 'not-allowed' : 'pointer', 
                background: s.is_booked ? '#1e293b' : selectedSeat === s.seat_number ? '#10b981' : '#334155', 
                color: s.is_booked ? '#475569' : '#ffffff', 
                border: selectedSeat === s.seat_number ? '2px solid #10b981' : '1px solid #1e293b' 
              }}
            >
              {s.seat_number}
            </button>
          ))}
        </div>
      </div>

      {/* RIGHT PANEL: Billing & Invoice */}
      <div style={{ background: '#090d16', padding: '24px', borderRadius: '12px', border: '1px solid #1e293b', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#ffffff' }}>Billing Invoice Summary</h3>
          <div style={{ fontSize: '14px', color: '#94a3b8', display: 'flex', flexDirection: 'column', gap: '10px', background: '#111827', padding: '16px', borderRadius: '8px', border: '1px solid #1e293b' }}>
            <div>Carrier: <strong style={{ color: '#fff' }}>{selectedFlight.airline_name}</strong></div>
            <div>Target Route: <strong style={{ color: '#fff' }}>{selectedFlight.flight_number} ({selectedFlight.origin} ➔ {selectedFlight.destination})</strong></div>
            <div>Coordinate Lock Matrix: <strong style={{ color: '#10b981' }}>{selectedSeat || 'Not picked yet'}</strong></div>
            <div style={{ borderTop: '1px solid #1e293b', paddingTop: '10px', fontWeight: 'bold', color: '#ffffff', fontSize: '15px' }}>Fare Bill Total: $249.00</div>
          </div>

          {selectedSeat && (
            <div style={{ marginTop: '20px' }}>
              <label style={{ marginBottom: '8px', fontSize: '12px', fontWeight: 'bold', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px', textTransform: 'uppercase', fontFamily: 'monospace' }}>
                <CreditCard size={14} color="#38bdf8" /> Credit Card Routing Network
              </label>
              <input type="text" disabled placeholder="4111 •••• •••• 9984" style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #1e293b', background: '#111827', color: '#475569', outline: 'none' }} />
            </div>
          )}
        </div>

        <button 
          disabled={!selectedSeat || paymentLoading} 
          onClick={executeSecureBooking} 
          style={{ width: '100%', padding: '14px', background: '#10b981', color: '#0c101d', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: !selectedSeat || paymentLoading ? 'not-allowed' : 'pointer', fontSize: '14px', marginTop: '20px' }}
        >
          {paymentLoading ? 'Processing Secure Card Payout Transaction...' : 'Confirm Booking & Pay Bill'}
        </button>
      </div>

    </div>
  );
}
