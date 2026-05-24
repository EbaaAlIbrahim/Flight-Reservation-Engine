import type { NotificationMsg } from '../App';

interface InboxViewProps {
  notifications: NotificationMsg[];
}

export default function InboxView({ notifications }: InboxViewProps) {
  return (
    <div style={{ padding: '24px 0', color: '#ffffff' }}>
      <h2 style={{ fontSize: '22px', color: '#ffffff', marginBottom: '20px', fontWeight: '700', letterSpacing: '0.5px' }}>
        Your Personal Electronic Messages Hub
      </h2>
      {notifications.length === 0 ? (
        <div style={{ background: '#090d16', padding: '40px', borderRadius: '14px', textAlign: 'center', color: '#94a3b8', border: '1px solid #1e293b' }}>
          Inbox empty. Real-time ticket confirmations and operational delays will stream here.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {notifications.map(n => (
            <div key={n.id} style={{ 
              background: '#090d16', 
              border: '1px solid #1e293b', 
              padding: '20px', 
              borderRadius: '12px', 
              borderLeft: `5px solid ${n.type === 'confirm' ? '#10b981' : n.type === 'cancel' ? '#ef4444' : '#f59e0b'}` 
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <strong style={{ fontSize: '16px', color: '#ffffff' }}>{n.title}</strong>
                <span style={{ fontSize: '12px', color: '#64748b', fontFamily: 'monospace' }}>{n.timestamp}</span>
              </div>
              <p style={{ margin: 0, fontSize: '14px', color: '#94a3b8', lineHeight: '1.5' }}>{n.details}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
