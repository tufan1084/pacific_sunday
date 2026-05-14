export default function ConnectedBagSection() {
  return (
    <div style={{ backgroundColor: '#13192A', borderRadius: '8px', padding: 'clamp(16px, 2vw, 20px) clamp(20px, 2.5vw, 24px)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M8.0008 10H24.0008C26.0008 10 27.6675 12 28.0008 14L30.0008 26C30.3343 28.0011 28.0008 30 26.0008 30H6.0008C4.0008 30 1.6673 28.0011 2.0008 26L4.0008 14C4.33414 12 6.0008 10 8.0008 10Z" stroke="#E8C96A" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M10 14V7.97675" stroke="#E8C96A" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M22 8V14" stroke="#E8C96A" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M2.38672 23.9148H29.6142" stroke="#E8C96A" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M22 8C22 6 20.8376 3.86838 18.9884 2.80073C17.1392 1.73309 14.8608 1.73309 13.0116 2.80073C11.1624 3.86838 10 6 10 8" stroke="#E8C96A" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span style={{ color: '#E8C96A', fontSize: '16px', fontWeight: 500 }}>Connected Bag</span>
      </div>
      <div style={{ height: '1px', backgroundColor: 'rgba(255, 255, 255, 0.08)', margin: '0 -24px 12px -24px' }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
        <div>
          <div style={{ color: '#FFFFFF', fontSize: '14px', fontWeight: 400 }}>Team Canada #006</div>
          <div style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '14px', marginTop: '2px' }}>TC-2025-006 · NFC Verified</div>
        </div>
        <span style={{ color: '#4CAF50', fontSize: '13px', fontWeight: 500 }}>Active</span>
      </div>

      <button style={{ width: '100%', backgroundColor: '#E8C96A', color: '#0A0F1E', padding: '12px', borderRadius: '6px', border: 'none', fontSize: '15px', fontWeight: 500, cursor: 'pointer' }}>
        Request owner Transfer
      </button>
    </div>
  );
}
