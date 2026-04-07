'use client';
import { useState } from 'react';
import Toggle from '@/app/components/ui/Toggle';

export default function PrivacySection() {
  const [privacy, setPrivacy] = useState({
    visibleOnLeaderboard: false,
    acceptH2HChallenges: true,
  });

  const toggle = (key: keyof typeof privacy) => {
    setPrivacy(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const privacyItems = [
    { key: 'visibleOnLeaderboard', title: 'Visible on Leaderboard', desc: 'Show your name publicly' },
    { key: 'acceptH2HChallenges', title: 'Accept H2H Challenges', desc: 'Allow others to challenge you' },
  ];

  return (
    <div style={{ backgroundColor: '#13192A', borderRadius: '8px', padding: 'clamp(16px, 2vw, 20px) clamp(20px, 2.5vw, 24px)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M20.53 16.25C20.44 16.25 18.42 15.89 18.42 10C18.42 5.84 16 3.25 12 3.25C8 3.25 5.58 5.84 5.58 10C5.58 16 3.49 16.25 3.5 16.25C3.30109 16.25 3.11032 16.329 2.96967 16.4697C2.82902 16.6103 2.75 16.8011 2.75 17C2.75 17.1989 2.82902 17.3897 2.96967 17.5303C3.11032 17.671 3.30109 17.75 3.5 17.75H8.33C8.49694 18.6007 8.95423 19.367 9.62366 19.9178C10.2931 20.4686 11.1331 20.7698 12 20.7698C12.8669 20.7698 13.7069 20.4686 14.3763 19.9178C15.0458 19.367 15.5031 18.6007 15.67 17.75H20.51C20.7089 17.75 20.8997 17.671 21.0403 17.5303C21.181 17.3897 21.26 17.1989 21.26 17C21.26 16.8011 21.181 16.6103 21.0403 16.4697C20.8997 16.329 20.7089 16.25 20.51 16.25H20.53ZM12 19.25C11.5363 19.2491 11.0843 19.1044 10.7064 18.8357C10.3284 18.567 10.0432 18.1877 9.89 17.75H14.11C13.9568 18.1877 13.6716 18.567 13.2936 18.8357C12.9157 19.1044 12.4637 19.2491 12 19.25ZM5.76 16.25C6.48 15.16 7.08 13.25 7.08 10C7.08 6.75 8.88 4.75 12 4.75C15.12 4.75 16.92 6.66 16.92 10C16.92 13.34 17.52 15.16 18.24 16.25H5.76Z" fill="#E8C96A"/>
        </svg>
        <span style={{ color: '#E8C96A', fontSize: '16px', fontWeight: 500 }}>Privacy</span>
      </div>
      <div style={{ height: '1px', backgroundColor: 'rgba(255, 255, 255, 0.08)', margin: '0 -24px 12px -24px' }} />

      <div>
        {privacyItems.map(({ key, title, desc }, index) => (
          <div key={key}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: index === 0 ? '0' : '10px', paddingBottom: index === privacyItems.length - 1 ? '0' : '10px' }}>
              <div>
                <div style={{ color: '#FFFFFF', fontSize: '16px', fontWeight: 400 }}>{title}</div>
                <div style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '14px', marginTop: '2px' }}>{desc}</div>
              </div>
              <Toggle
                checked={privacy[key as keyof typeof privacy]}
                onChange={() => toggle(key as keyof typeof privacy)}
              />
            </div>
            {index < privacyItems.length - 1 && (
              <div style={{ height: '1px', backgroundColor: 'rgba(255, 255, 255, 0.08)', margin: '0 -24px' }} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
