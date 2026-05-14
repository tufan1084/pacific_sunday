'use client';
import { useState } from 'react';

export default function SecuritySection() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <div style={{ backgroundColor: '#13192A', borderRadius: '8px', padding: 'clamp(16px, 2vw, 20px) clamp(20px, 2.5vw, 24px)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#E8C96A" strokeWidth="2">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
        <span style={{ color: '#E8C96A', fontSize: '16px', fontWeight: 500 }}>Security</span>
      </div>
      <div style={{ height: '1px', backgroundColor: 'rgba(255, 255, 255, 0.08)', margin: '0 -24px 12px -24px' }} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '14px', marginBottom: '8px', display: 'block' }}>Current Password</label>
          <div style={{ position: 'relative' }}>
            <input
              type={showCurrent ? 'text' : 'password'}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••••"
              style={{ width: '100%', backgroundColor: '#1A2235', border: 'none', borderRadius: '6px', padding: '12px', color: '#FFFFFF', fontSize: '14px', paddingRight: '40px' }}
            />
            <button onClick={() => setShowCurrent(!showCurrent)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {showCurrent ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                  <line x1="1" y1="23" x2="23" y2="1" />
                </svg>
              )}
            </button>
          </div>
        </div>

        <div>
          <label style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '14px', marginBottom: '8px', display: 'block' }}>New Password</label>
          <div style={{ position: 'relative' }}>
            <input
              type={showNew ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••••"
              style={{ width: '100%', backgroundColor: '#1A2235', border: 'none', borderRadius: '6px', padding: '12px', color: '#FFFFFF', fontSize: '14px', paddingRight: '40px' }}
            />
            <button onClick={() => setShowNew(!showNew)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {showNew ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                  <line x1="1" y1="23" x2="23" y2="1" />
                </svg>
              )}
            </button>
          </div>
        </div>

        <div>
          <label style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '14px', marginBottom: '8px', display: 'block' }}>Confirm</label>
          <div style={{ position: 'relative' }}>
            <input
              type={showConfirm ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••••"
              style={{ width: '100%', backgroundColor: '#1A2235', border: 'none', borderRadius: '6px', padding: '12px', color: '#FFFFFF', fontSize: '14px', paddingRight: '40px' }}
            />
            <button onClick={() => setShowConfirm(!showConfirm)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {showConfirm ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                  <line x1="1" y1="23" x2="23" y2="1" />
                </svg>
              )}
            </button>
          </div>
        </div>

        <button style={{ backgroundColor: '#E8C96A', color: '#0A0F1E', padding: '12px', borderRadius: '6px', border: 'none', fontSize: '16px', fontWeight: 500, cursor: 'pointer', marginTop: '8px' }}>
          Update Password
        </button>
      </div>
    </div>
  );
}
