'use client';
import { useState } from 'react';
import { api } from '@/app/services/api';

// Users authenticate with a 4-digit PIN (not a password). This screen lets a
// signed-in user change that PIN — verifies the current one server-side.
export default function SecuritySection() {
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Keep only digits, max 4.
  const onPinChange = (setter: (v: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setter(e.target.value.replace(/\D/g, '').slice(0, 4));

  const valid =
    /^\d{4}$/.test(currentPin) &&
    /^\d{4}$/.test(newPin) &&
    newPin === confirmPin &&
    newPin !== currentPin;

  const handleSubmit = async () => {
    setMessage(null);
    if (!/^\d{4}$/.test(currentPin)) return setMessage({ type: 'error', text: 'Enter your current 4-digit PIN.' });
    if (!/^\d{4}$/.test(newPin)) return setMessage({ type: 'error', text: 'New PIN must be exactly 4 digits.' });
    if (newPin !== confirmPin) return setMessage({ type: 'error', text: 'PINs do not match.' });
    if (newPin === currentPin) return setMessage({ type: 'error', text: 'New PIN must be different from the current one.' });

    setSubmitting(true);
    try {
      const res = await api.auth.changePin(currentPin, newPin);
      if (res.success) {
        setMessage({ type: 'success', text: res.message || 'Your PIN has been updated.' });
        setCurrentPin('');
        setNewPin('');
        setConfirmPin('');
      } else {
        setMessage({ type: 'error', text: res.message || 'Unable to update PIN.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Request failed.' });
    } finally {
      setSubmitting(false);
    }
  };

  const EyeButton = ({ shown, onClick }: { shown: boolean; onClick: () => void }) => (
    <button
      type="button"
      onClick={onClick}
      style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
        {!shown && <line x1="1" y1="23" x2="23" y2="1" />}
      </svg>
    </button>
  );

  const pinInputStyle: React.CSSProperties = {
    width: '100%', backgroundColor: '#1A2235', border: 'none', borderRadius: '6px',
    padding: '12px', color: '#FFFFFF', fontSize: '16px', paddingRight: '40px',
    letterSpacing: '6px', textAlign: 'center', outline: 'none',
  };

  const fields: { label: string; value: string; setter: (v: string) => void; shown: boolean; toggle: () => void }[] = [
    { label: 'Current PIN', value: currentPin, setter: setCurrentPin, shown: showCurrent, toggle: () => setShowCurrent((s) => !s) },
    { label: 'New PIN', value: newPin, setter: setNewPin, shown: showNew, toggle: () => setShowNew((s) => !s) },
    { label: 'Confirm New PIN', value: confirmPin, setter: setConfirmPin, shown: showConfirm, toggle: () => setShowConfirm((s) => !s) },
  ];

  return (
    <div style={{ backgroundColor: '#13192A', borderRadius: '8px', padding: 'clamp(16px, 2vw, 20px) clamp(20px, 2.5vw, 24px)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#E8C96A" strokeWidth="2">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
        <span style={{ color: '#E8C96A', fontSize: '16px', fontWeight: 500 }}>Security</span>
      </div>
      <div style={{ height: '1px', backgroundColor: 'rgba(255, 255, 255, 0.08)', margin: '0 -24px 12px -24px' }} />

      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', marginBottom: '16px' }}>
        Change the 4-digit PIN you use to sign in.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {fields.map((f) => (
          <div key={f.label}>
            <label style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '14px', marginBottom: '8px', display: 'block' }}>
              {f.label}
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={f.shown ? 'text' : 'password'}
                inputMode="numeric"
                value={f.value}
                onChange={onPinChange(f.setter)}
                placeholder="••••"
                maxLength={4}
                disabled={submitting}
                style={pinInputStyle}
              />
              <EyeButton shown={f.shown} onClick={f.toggle} />
            </div>
          </div>
        ))}

        {message && (
          <p style={{ fontSize: '13px', color: message.type === 'success' ? '#4ADE80' : '#EF4444', margin: 0 }}>
            {message.text}
          </p>
        )}

        <button
          onClick={handleSubmit}
          disabled={!valid || submitting}
          style={{
            backgroundColor: '#E8C96A', color: '#0A0F1E', padding: '12px', borderRadius: '6px',
            border: 'none', fontSize: '16px', fontWeight: 500,
            cursor: !valid || submitting ? 'not-allowed' : 'pointer',
            opacity: !valid || submitting ? 0.6 : 1, marginTop: '8px',
          }}
        >
          {submitting ? 'Updating…' : 'Update PIN'}
        </button>
      </div>
    </div>
  );
}
