import { useState, useEffect } from 'react';
import { Plane, Bell, Trash2, LogOut } from 'lucide-react';
import { API_BASE_URL } from './config';

// View Component Imports
import Login from './components/Login';
import Signup from './components/Signup';
import FlightsView from './components/FlightsView';
import MyBookingsView from './components/MyBookingsView';
import NotificationsView from './components/NotificationsView';
import SeatPickerView from './components/SeatPickerView';
import AdminView from './components/AdminView';

export interface Flight {
  flight_id: number;
  flight_number: string;
  airline_name: string;
  origin: string;
  destination: string;
  departure_time: string;
  arrival_time: string;
  available_seats: number;
  predictive_delay_probability?: string | number;
}

export interface Seat {
  seat_id: number;
  seat_number: string;
  is_booked: boolean;
}

export interface UserBooking {
  booking_id: number;
  flight_id: number;
  flight_number: string;
  airline_name: string;
  origin: string;
  destination: string;
  seat_number: string;
  status: string;
}

export interface NotificationMsg {
  id: string;
  title: string;
  timestamp: string;
  details: string;
  type: 'confirm' | 'cancel' | 'warning';
}

export default function App() {
  const [view, setView] = useState<'login' | 'signup' | 'flights' | 'my-bookings' | 'notifications' | 'seats' | 'admin'>('login');
  
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [user, setUser] = useState<{ id: number; name: string; email: string; tier: string } | null>(null);
  const [flights, setFlights] = useState<Flight[]>([]);
  const [selectedFlight, setSelectedFlight] = useState<Flight | null>(null);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [selectedSeat, setSelectedSeat] = useState<string | null>(null);
  const [userBookings, setUserBookings] = useState<UserBooking[]>([]);
  
  const [notifications, setNotifications] = useState<NotificationMsg[]>([]);
  const [toastMessage, setToastMessage] = useState('');
  const [flightWarnings, setFlightWarnings] = useState<{ [key: string]: string }>({});
  const [paymentLoading, setPaymentLoading] = useState(false);

  useEffect(() => {
    if (toastMessage) {
      const dismissTimer = setTimeout(() => {
        setToastMessage('');
      }, 3000); // 3000ms = 3 Seconds
      return () => clearTimeout(dismissTimer);
    }
  }, [toastMessage]);

  const loadFlightsAndTelemetry = async () => {
  try {
    const res = await fetch(`${API_BASE_URL}/api/flights`);
      if (res.ok) {
        const data = await res.json();
        setFlights(data);
        const warningsMap: { [key: string]: string } = {};
        
        data.forEach((f: Flight) => {
          const prob = parseFloat(f.predictive_delay_probability as string || '0');
          if (prob >= 0.70) {
            warningsMap[f.flight_number] = ` AI Delay Warning: Flight ${f.flight_number} has a ${(prob * 100).toFixed(0)}% cancellation risk profile due to weather constraints.`;
            setNotifications(prev => {
              if (prev.some(n => n.details.includes(f.flight_number) && n.type === 'warning')) return prev;
              return [{
                id: `warn-${f.flight_id}`,
                title: 'High Disruption Risk Radar Warning',
                timestamp: new Date().toLocaleTimeString(),
                details: `AI model simulation flags Flight ${f.flight_number} with elevated cancellation traits.`,
                type: 'warning'
              }, ...prev];
            });
          }
        });
        setFlightWarnings(warningsMap);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const refreshPassengerTrips = async (id: number) => {
  try {
    const res = await fetch(`${API_BASE_URL}/api/passengers/${id}/trips`);
      if (res.ok) {
        const data = await res.json();
        setUserBookings(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (user) {
      loadFlightsAndTelemetry();
      refreshPassengerTrips(user.id);
    }
  }, [view, user]);

// --- App.tsx Content Fixes ---

const handleSignup = async (e: React.FormEvent) => {
  e.preventDefault();
  try {
    const res = await fetch(`${API_BASE_URL}/api/passengers/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ firstName, lastName, email, password })
    });
    const result = await res.json();
    
    if (res.ok) {
      setToastMessage(`🎉 Account Created for ${firstName}! Proceed to sign in.`);
      setView('login');
      setFirstName('');
      setLastName('');
      setEmail('');
      setPassword('');
    } else {
      // 🟢 FIX: Correctly extract custom error message returned from the backend check
      setToastMessage(`❌ Registration Denied: ${result.error || 'Duplicate profile credentials found.'}`);
    }
  } catch {
    setToastMessage('❌ Server connectivity breakdown.');
  }
};

const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault();
  try {
    const res = await fetch(`${API_BASE_URL}/api/passengers/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const result = await res.json();
    
    if (res.ok && result.success) {
      setUser(result.passenger);
      setToastMessage(`🚀 Welcome back, ${result.passenger.name}! Loading schedules...`);
      setView('flights');
      setPassword('');
    } else {
      // 🟢 FIX: Read explicit response string for wrong combination profiles
      setToastMessage(`❌ Authentication Failed: ${result.error || 'Wrong email or password configuration.'}`);
    }
  } catch {
    setToastMessage('❌ Server communication failed.');
  }
};

const handleCancelBooking = async (bookingId: number, flightNumber: string) => {
  if (!user) return;
  if (confirm(`Are you certain you wish to cancel reservation seat on ${flightNumber}?`)) {
    try {
      const res = await fetch(`${API_BASE_URL}/api/passengers/${user.id}/trips/${bookingId}`, { method: 'DELETE' });
      const result = await res.json();
      if (res.ok && result.success) {
        const cancelMsg = `Flight ${flightNumber} seat itinerary registration has been dissolved.`;
        setToastMessage(`🗑️ Cancellation Processed! ${cancelMsg}`);
        
        // 🟢 FIX: Instant frontend filter to purge the canceled item from state array mapping instantly
        setUserBookings(prev => prev.filter(b => b.booking_id !== bookingId));
        
        setNotifications(prev => [{
          id: Math.random().toString(),
          title: 'Reservation Cancellation Notice',
          timestamp: new Date().toLocaleTimeString(),
          details: cancelMsg,
          type: 'cancel'
        }, ...prev]);
      } else {
        setToastMessage(`❌ Cancellation Aborted: ${result.error}`);
      }
    } catch {
      setToastMessage('❌ Error processing cancellation request.');
    }
  }
};

const handleLogOut = () => {
  // 🟢 FIX: Standard window prompt fires cleanly before system state properties drop out
  alert('ℹ️ Session closed securely. You have logged out cleanly from Apex Flight Systems.');
  
  setUser(null);
  setUserBookings([]);
  setSelectedFlight(null);
  setSelectedSeat(null);
  setNotifications([]);
  setToastMessage('Logged out cleanly. Session closed.');
  setView('login');
};

   const executeSecureBooking = async () => {
  if (!user || !selectedFlight || !selectedSeat) return;
  setPaymentLoading(true);
  try {
    const res = await fetch(`${API_BASE_URL}/api/flights/book`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ passengerId: user.id, flightId: selectedFlight.flight_id, seatNumber: selectedSeat })
    });
      const result = await res.json();
      if (res.ok && result.success) {
        const confirmMsg = `Ticket issued for Seat ${selectedSeat} on Flight ${selectedFlight.flight_number}. Total Fare Paid: $249.00.`;
        setToastMessage(` TRANSACTION SUCCESSFUL! ${confirmMsg}`);
        setNotifications(prev => [{
          id: Math.random().toString(),
          title: 'Booking Confirmation Notice',
          timestamp: new Date().toLocaleTimeString(),
          details: confirmMsg,
          type: 'confirm'
        }, ...prev]);
        refreshPassengerTrips(user.id);
        setView('my-bookings');
      } else {
        setToastMessage(` Payment Transaction Aborted: ${result.error}`);
      }
    } catch {
      setToastMessage(' Payment terminal network error.');
    } finally {
      setPaymentLoading(false);
    }
  };

 const handleDeleteAccount = async () => {
  if (!user) return;
  if (confirm('Proceed?')) {
    try {
      const res = await fetch(`${API_BASE_URL}/api/passengers/${user.id}`, { method: 'DELETE' });
        if (res.ok) {
          alert('Profile permanently deleted from flight database registers.');
          handleLogOut();
        } else {
          setToastMessage(' Error executing request.');
        }
      } catch {
        setToastMessage(' Server erasure transaction failure.');
      }
    }
  };

  const openSeatPicker = async (flight: Flight) => {
  setSelectedFlight(flight);
  setSelectedSeat(null);
  try {
    const res = await fetch(`${API_BASE_URL}/api/flights/${flight.flight_id}/seats`);
      if (res.ok) {
        const data = await res.json();
        setSeats(data.seats);
        setView('seats');
      }
    } catch (err) {
      console.error(err);
    }
  };

    const isAuthView = view === 'login' || view === 'signup';

    return (
    <>
      {/* Global CSS style */}
      <style>{`
        html, body, #root {
          margin: 0 !important;
          padding: 0 !important;
          width: 100% !important;
          min-height: 100vh !important;
          background-color: #0c101d !important;
          overflow-x: hidden !important;
        }
      `}</style>

      {/* Main Structural Application Element Layer */}
      <div style={{ 
        fontFamily: 'Segoe UI, sans-serif', 
        backgroundColor: '#0c101d',
        minHeight: '100vh', 
        width: '100vw',
        padding: isAuthView ? '0px' : '20px', 
        boxSizing: 'border-box'
      }}>
        
        {/* Infinite Wide Single-Line Navbar Header */}
        {!isAuthView && (
          <header style={{ 
            width: '100%', 
            margin: '0 auto 24px auto', 
            background: '#0f172a', 
            padding: '22px 32px', 
            borderRadius: '16px', 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            color: '#fff', 
            boxShadow: '0 6px 16px rgba(0,0,0,0.15)',
            boxSizing: 'border-box',
            whiteSpace: 'nowrap'
          }}>
            {/* Logo Brand */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', flexShrink: 0 }} onClick={() => user ? setView('flights') : setView('login')}>
              <Plane size={24} color="#38bdf8" />
              <span style={{ fontWeight: 'bold', fontSize: '20px', letterSpacing: '0.5px' }}>Apex Global Engine</span>
            </div>
            
            {/* Menu Items Container */}
            {user && (
              <div style={{ 
                display: 'flex', 
                gap: '20px', 
                alignItems: 'center', 
                flexGrow: 1, 
                justifyContent: 'flex-end', 
                paddingLeft: '24px',
                flexWrap: 'nowrap', 
                whiteSpace: 'nowrap', 
                overflow: 'visible'
              }}>
                <button onClick={() => setView('flights')} style={{ background: 'none', border: 'none', color: view === 'flights' ? '#38bdf8' : '#94a3b8', fontWeight: 'bold', cursor: 'pointer', fontSize: '15px', flexShrink: 0 }}>Schedules</button>
                <button onClick={() => setView('my-bookings')} style={{ background: 'none', border: 'none', color: view === 'my-bookings' ? '#38bdf8' : '#94a3b8', fontWeight: 'bold', cursor: 'pointer', fontSize: '15px', flexShrink: 0 }}>My Trips ({userBookings.length})</button>
                <button onClick={() => setView('notifications')} style={{ background: 'none', border: 'none', color: view === 'notifications' ? '#38bdf8' : '#94a3b8', fontWeight: 'bold', cursor: 'pointer', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                  <Bell size={18} /> Inbox ({notifications.length})
                </button>
                <span style={{ fontSize: '13px', background: '#1e293b', border: '1px solid #334155', padding: '8px 14px', borderRadius: '20px', color: '#38bdf8', fontWeight: 'bold', flexShrink: 0 }}>
                  {user.tier} Tier
                </span>
                <button onClick={() => setView('admin')} style={{ background: '#1e293b', color: '#10b981', border: '1px solid #334155', padding: '8px 14px', borderRadius: '6px', fontSize: '14px', cursor: 'pointer', fontWeight: 'bold', flexShrink: 0 }}>Gate Ops</button>
                <button onClick={handleDeleteAccount} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', flexShrink: 0 }} title="Delete Permanent Profile">
                  <Trash2 size={18} />
                </button>
                <button onClick={handleLogOut} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '15px', fontWeight: 'bold', flexShrink: 0 }} title="Log Out">
                  <LogOut size={18} /> Log Out
                </button>
              </div>
            )}
          </header>
        )}

        {/* Main Workspace Frame */}
        <main style={{ maxWidth: isAuthView ? '100vw' : '850px', margin: '0 auto', position: 'relative' }}>
          
          {/* Transparent Notification Alert Panel */}
          {!isAuthView && toastMessage && (
            <div style={{
              position: 'absolute',
              top: '10px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '90%',
              maxWidth: '520px',
              background: 'rgba(15, 23, 42, 0.85)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              borderLeft: '5px solid #38bdf8',
              color: '#fff',
              padding: '14px 20px',
              borderRadius: '8px',
              fontWeight: '600',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              boxShadow: '0 8px 20px rgba(0,0,0,0.2)',
              zIndex: 9999
            }}>
              <Bell size={16} color="#38bdf8" />
              <span>{toastMessage}</span>
              <button onClick={() => setToastMessage('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>✕</button>
            </div>
          )}

          {/* Component Views Router Switch Tree */}
          {view === 'login' && (
            <Login email={email} setEmail={setEmail} password={password} setPassword={setPassword} handleLogin={handleLogin} setView={setView} />
          )}
          {view === 'signup' && (
            <Signup firstName={firstName} setFirstName={setFirstName} lastName={lastName} setLastName={setLastName} email={email} setEmail={setEmail} password={password} setPassword={setPassword} handleSignup={handleSignup} setView={setView} />
          )}
          {view === 'flights' && (
            <FlightsView flights={flights} flightWarnings={flightWarnings} openSeatPicker={openSeatPicker} />
          )}
          {view === 'my-bookings' && (
            <MyBookingsView userBookings={userBookings} handleCancelBooking={handleCancelBooking} />
          )}
          {view === 'notifications' && (
            <NotificationsView notifications={notifications} />
          )}
          {view === 'seats' && selectedFlight && (
            <SeatPickerView selectedFlight={selectedFlight} seats={seats} selectedSeat={selectedSeat} setSelectedSeat={setSelectedSeat} paymentLoading={paymentLoading} executeSecureBooking={executeSecureBooking} />
          )}
          {view === 'admin' && (
            <AdminView setNotifications={setNotifications} setToastMessage={setToastMessage} loadFlightsAndTelemetry={loadFlightsAndTelemetry} setView={setView} />
          )}
        </main>
      </div>
    </>
  );
}

