import RewardStoreHeader from "@/app/components/reward-store/RewardStoreHeader";
import PointsSummary from "@/app/components/reward-store/PointsSummary";
import RewardItemList from "@/app/components/reward-store/RewardItemList";
import MajorEventBonus from "@/app/components/reward-store/MajorEventBonus";
import HowToEarnPoints from "@/app/components/reward-store/HowToEarnPoints";

export default function RewardStorePage() {
  return (
    <>
      <RewardStoreHeader />

      {/* Main layout: Left (points + items) + Right (sidebar) */}
      <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-4 items-start">

        {/* Left */}
        <div>
          <PointsSummary />
          <RewardItemList />
        </div>

        {/* Right */}
        <div className="flex flex-col gap-4">
          <MajorEventBonus />
          <HowToEarnPoints />
        </div>

      </div>
    </>
  );
}
