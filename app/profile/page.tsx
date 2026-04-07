import ProfileCard from "@/app/components/profile/ProfileCard";
import GolfPassport from "@/app/components/profile/GolfPassport";
import YourGolfStats from "@/app/components/profile/YourGolfStats";
import PointsHistory from "@/app/components/profile/PointsHistory";
import ProfileActions from "@/app/components/profile/ProfileActions";

export default function ProfilePage() {
  return (
    <>
      {/* Header */}
      <div style={{ fontFamily: "var(--font-poppins), sans-serif", marginBottom: "24px" }}>
        <span style={{ color: "#E8C96A", fontSize: "clamp(18px, 2.5vw, 25px)", fontWeight: 400 }}>My Profile</span>
      </div>

      {/* Main layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-4 items-stretch">

        {/* Left - Profile card + Golf Passport */}
        <div className="flex flex-col gap-4">
          <ProfileCard />
          <GolfPassport />
        </div>

        {/* Right - Golf Stats + Points History + Actions - stretches to match left */}
        <div className="flex flex-col gap-4">
          <YourGolfStats />
          <div style={{ flex: 1 }}>
            <PointsHistory />
          </div>
          <ProfileActions />
        </div>

      </div>
    </>
  );
}
