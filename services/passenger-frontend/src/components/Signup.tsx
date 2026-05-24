import { useState,useEffect, useRef } from 'react';

interface SignupProps {
  firstName: string;
  setFirstName: (val: string) => void;
  lastName: string;
  setLastName: (val: string) => void;
  email: string;
  setEmail: (val: string) => void;
  password: string;
  setPassword: (val: string) => void;
  handleSignup: (e: React.FormEvent) => Promise<void>;
  setView: (view: 'login' | 'signup' | 'flights' | 'my-bookings' | 'notifications' | 'seats' | 'admin') => void;
}

export default function Signup({
  firstName,
  setFirstName,
  lastName,
  setLastName,
  email,
  setEmail,
  password,
  setPassword,
  handleSignup,
  setView,
}: SignupProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const [activeRadarIndex, setActiveRadarIndex] = useState(0);

  useEffect(() => {
    const radarInterval = setInterval(() => {
      setActiveRadarIndex((prevIndex) => (prevIndex + 1) % 8);
    }, 3000); // 3000ms = 3 Seconds interval loop
    return () => clearInterval(radarInterval);
  }, []);

  const radarDataPool = [
    { id: 'APX102 / JFK', alt: '28,000 FT', lat: '40.6413 N', lon: '-73.7781 W' },
    { id: 'UA405 / EWR',  alt: '31,500 FT', lat: '40.6895 N', lon: '-74.1745 W' },
    { id: 'DL889 / LAX',  alt: '34,000 FT', lat: '33.9416 N', lon: '-118.4085 W' },
    { id: 'EY710 / DXB',  alt: '36,000 FT', lat: '25.2532 N', lon: '55.3657 E' },
    { id: 'QR283 / HND',  alt: '38,000 FT', lat: '35.5494 N', lon: '139.7798 E' },
    { id: 'EK842 / CDG',  alt: '39,000 FT', lat: '49.0097 N', lon: '2.5479 E' },
    { id: 'FZ659 / SIN',  alt: '35,000 FT', lat: '1.3644 N',  lon: '103.9915 E' },
    { id: 'BAW229 / LHR', alt: '41,000 FT', lat: '51.4700 N', lon: '-0.4543 W' }
  ];

  const currentPlane = radarDataPool[activeRadarIndex];

    useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    
    const resizeCanvas = () => {
      canvas.width = canvas.parentElement?.clientWidth || window.innerWidth * 0.55;
      canvas.height = canvas.parentElement?.clientHeight || window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const centerY = canvas.height * 0.4;
    const centerX = canvas.width * 0.5;

    const planes = [
      // Orbit 1 (Smallest): 1 Plane
      { cx: centerX, cy: centerY, rx: 90, ry: 45, angle: 0, speed: 0.006, label: 'APX102 / JFK', color: '#38bdf8' },
      
      // Orbit 2: 2 Planes (Staggered angles)
      { cx: centerX, cy: centerY, rx: 150, ry: 75, angle: 0, speed: 0.005, label: 'UA405 / EWR', color: '#10b981' },
      { cx: centerX, cy: centerY, rx: 150, ry: 75, angle: Math.PI, speed: 0.005, label: 'DL889 / LAX', color: '#10b981' },
      
      // Orbit 3: 3 Planes
      { cx: centerX, cy: centerY, rx: 220, ry: 110, angle: 0, speed: 0.004, label: 'EY710 / DXB', color: '#f59e0b' },
      { cx: centerX, cy: centerY, rx: 220, ry: 110, angle: (Math.PI * 2) / 3, speed: 0.004, label: 'QR283 / HND', color: '#f59e0b' },
      { cx: centerX, cy: centerY, rx: 220, ry: 110, angle: (Math.PI * 4) / 3, speed: 0.004, label: 'EK842 / CDG', color: '#f59e0b' },
      
      // Orbit 4: 1 Plane
      { cx: centerX, cy: centerY, rx: 300, ry: 150, angle: Math.PI * 0.5, speed: 0.003, label: 'FZ659 / SIN', color: '#a855f7' },
      
      // Orbit 5 (Largest): 1 Plane
      { cx: centerX, cy: centerY, rx: 380, ry: 190, angle: Math.PI * 1.5, speed: 0.002, label: 'BAW229 / LHR', color: '#ec4899' }
    ];

    const drawAirplane = (gc: CanvasRenderingContext2D, x: number, y: number, angle: number, color: string) => {
      gc.save();
      gc.translate(x, y);
      gc.rotate(angle);
      gc.fillStyle = color;
      
      gc.beginPath();
      gc.moveTo(0, -10);
      gc.lineTo(3, -3);
      gc.lineTo(12, 2);
      gc.lineTo(12, 4);
      gc.lineTo(3, 2);
      gc.lineTo(2, 8);
      gc.lineTo(6, 11);
      gc.lineTo(0, 10);
      gc.lineTo(-6, 11);
      gc.lineTo(-2, 8);
      gc.lineTo(-3, 2);
      gc.lineTo(-12, 4);
      gc.lineTo(-12, 2);
      gc.lineTo(-3, -3);
      gc.closePath();
      gc.fill();
      gc.restore();
    };

    const animate = () => {
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.strokeStyle = 'rgba(30, 41, 59, 0.4)';
      ctx.lineWidth = 1;
      for (let i = 0; i < canvas.width; i += 40) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, canvas.height); ctx.stroke();
      }
      for (let j = 0; j < canvas.height; j += 40) {
        ctx.beginPath(); ctx.moveTo(0, j); ctx.lineTo(canvas.width, j); ctx.stroke();
      }

      // Track configuration lists: Render the 5 discrete orbital path contours first
      const uniqueRadii = [
        { rx: 90, ry: 45 },
        { rx: 150, ry: 75 },
        { rx: 220, ry: 110 },
        { rx: 300, ry: 150 },
        { rx: 380, ry: 190 }
      ];
      
      uniqueRadii.forEach(orbit => {
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, orbit.rx, orbit.ry, 0, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(51, 65, 85, 0.2)';
        ctx.stroke();
      });

      // Update plane physics inside runtime frame loop
      planes.forEach(p => {
        p.angle += p.speed;
        const px = p.cx + p.rx * Math.cos(p.angle);
        const py = p.cy + p.ry * Math.sin(p.angle);

        // Clockwise direction heading calculation vector
        const dx = -p.rx * Math.sin(p.angle);
        const dy = p.ry * Math.cos(p.angle);
        const heading = Math.atan2(dy, dx) + Math.PI / 2;

        drawAirplane(ctx, px, py, heading, p.color);

        ctx.fillStyle = 'rgba(148, 163, 184, 0.7)';
        ctx.font = '10px monospace';
        ctx.fillText(p.label, px + 14, py + 4);
      });

      animationFrameId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);


    return (
    <div style={{
      width: '100vw',
      marginLeft: 'calc(-50vw + 50%)',
      marginRight: 'calc(-50vw + 50%)',
      minHeight: '100vh',
      backgroundColor: '#0c101d',
      color: '#ffffff',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      display: 'flex',
      flexDirection: 'column',
      boxSizing: 'border-box',
      overflowX: 'hidden'
    }}>
      
      {/* Top Application Header Bar */}
      <nav style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '20px 60px',
        borderBottom: '1px solid #1e293b',
        backgroundColor: '#0c101d',
        zIndex: 10
      }}>
        <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#fff' }}>
          <span>Apex <span style={{ color: '#38bdf8' }}>reservation engine</span></span>
        </div>
        <div style={{ display: 'flex', gap: '32px', fontSize: '14px', alignItems: 'center' }}>
          <span style={{ color: '#94a3b8', cursor: 'pointer' }}>Pricing</span>
          <span style={{ color: '#94a3b8', cursor: 'pointer' }}>Documentation</span>
          <span style={{ color: '#94a3b8', cursor: 'pointer' }}>FAQ</span>
          <button 
            onClick={() => setView('login')} 
            style={{ backgroundColor: 'transparent', color: '#94a3b8', border: '1px solid #334155', padding: '10px 20px', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}
          >
            Log In
          </button>
        </div>
      </nav>

      {/* Main Container Workspace Split Grid Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', flexGrow: 1, width: '100%' }}>
        
        {/* Left Orbital Canvas Panel Section */}
        <div style={{ backgroundColor: '#090d16', borderRight: '1px solid #1e293b', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '40px', position: 'relative' }}>
          <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 0, pointerEvents: 'none' }} />
          
                   {/* Live Telemetry Data Box Panel - Positioned Lower with 3-Second Variable Rotation */}
          <div style={{ 
            background: 'rgba(12, 16, 29, 0.75)', 
            backdropFilter: 'blur(8px)', 
            border: '1px solid #1e293b', 
            borderRadius: '8px', 
            padding: '24px', 
            width: '100%',
            maxWidth: '440px', 
            fontFamily: 'monospace', 
            position: 'absolute', 
            bottom: '24px',  
            left: '40px',
            zIndex: 5,
            boxSizing: 'border-box'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #1e293b', paddingBottom: '12px', marginBottom: '12px' }}>
              <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ animation: 'radarPulseFade 1.5s infinite', marginRight: '4px' }}>●</span> 
                LIVE TELEMETRY RADAR
              </span>
              <span style={{ color: '#64748b' }}>FREQ: 1090 MHz</span>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px' }}>
              <div>IDENTIFIER: <strong style={{ color: '#fff' }}>{currentPlane.id}</strong></div>
              <div>ALTITUDE: <strong style={{ color: '#f59e0b' }}>{currentPlane.alt}</strong></div>
              <div>LATITUDE: <strong style={{ color: '#38bdf8' }}>{currentPlane.lat}</strong></div>
              <div>LONGITUDE: <strong style={{ color: '#38bdf8' }}>{currentPlane.lon}</strong></div>
            </div>

            {/* Embedded pulse keyframe styling block for the blinking green radar indicator dot */}
            <style>{`
              @keyframes radarPulseFade {
                0% { opacity: 0.3; }
                50% { opacity: 1; }
                100% { opacity: 0.3; }
              }
            `}</style>
          </div>
        </div>


        {/* Right Input Form Control Signup Panel Section */}
        <div style={{ padding: '60px 80px', display: 'flex', flexDirection: 'column', justifyContent: 'center', backgroundColor: '#0c101d' }}>
          <div style={{ maxWidth: '400px', width: '100%' }}>

            <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '6px', fontWeight: '600', textTransform: 'uppercase' }}>First Name</label>
                  <input type="text" required placeholder="Ebaa" value={firstName} onChange={e => setFirstName(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '4px', background: '#111827', border: '1px solid #334155', color: '#fff', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '6px', fontWeight: '600', textTransform: 'uppercase' }}>Last Name</label>
                  <input type="text" required placeholder="Ibrahim" value={lastName} onChange={e => setLastName(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '4px', background: '#111827', border: '1px solid #334155', color: '#fff', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '6px', fontWeight: '600', textTransform: 'uppercase' }}>Account Email Address</label>
                <input type="email" required placeholder="ebaaibrahime@gmail.com" value={email} onChange={e => setEmail(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '4px', background: '#111827', border: '1px solid #334155', color: '#fff', fontSize: '14px', outline: 'none' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '6px', fontWeight: '600', textTransform: 'uppercase' }}>Account Access Password</label>
                <input type="password" required placeholder="••••••••••••" value={password} onChange={e => setPassword(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '4px', background: '#111827', border: '1px solid #334155', color: '#fff', fontSize: '14px', outline: 'none' }} />
              </div>

              <button type="submit" style={{ width: '100%', padding: '14px', backgroundColor: '#10b981', color: '#0c101d', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px', marginTop: '8px' }}>
                Create Account
              </button>
            </form>

            <p style={{ marginTop: '32px', fontSize: '14px', color: '#64748b' }}>
              Already holding active tracking credentials?{' '}
              <span onClick={() => setView('login')} style={{ color: '#10b981', fontWeight: 'bold', cursor: 'pointer', textDecoration: 'underline' }}>
                Sign In here
              </span>
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
