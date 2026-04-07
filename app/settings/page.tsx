import SecuritySection from '@/app/components/settings/SecuritySection';
import NotificationsSection from '@/app/components/settings/NotificationsSection';
import PrivacySection from '@/app/components/settings/PrivacySection';
import ConnectedBagSection from '@/app/components/settings/ConnectedBagSection';

export default function SettingsPage() {
  return (
    <div style={{ fontFamily: "var(--font-poppins), sans-serif" }}>
      {/* Header */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }} className="sm:flex-row sm:justify-between sm:items-center">
        <span style={{ color: "#E8C96A", fontSize: "clamp(18px, 2.5vw, 25px)", fontWeight: 400 }}>Settings</span>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button style={{ backgroundColor: '#13192A', color: '#E8C96A', padding: '10px 32px', borderRadius: '6px', border: '1px solid #E8C96A', fontSize: 'clamp(14px, 1.5vw, 16px)', fontWeight: 400, cursor: 'pointer', whiteSpace: 'nowrap' }}>
            Export Data
          </button>
          <button style={{ backgroundColor: 'transparent', color: '#E8C96A', padding: '10px 32px', borderRadius: '6px', border: '1px solid #E8C96A', fontSize: 'clamp(14px, 1.5vw, 16px)', fontWeight: 400, cursor: 'pointer', whiteSpace: 'nowrap' }}>
            Delete Account
          </button>
        </div>
      </div>

      {/* Main layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-4">
        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <SecuritySection />
          <ConnectedBagSection />
        </div>

        {/* Right Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <NotificationsSection />
          <PrivacySection />
        </div>
      </div>
    </div>
  );
}
