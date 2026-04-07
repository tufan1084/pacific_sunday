import BagOwnerCard from "@/app/components/my-bag/BagOwnerCard";
import BagDetails from "@/app/components/my-bag/BagDetails";
import NFCScanHistory from "@/app/components/my-bag/NFCScanHistory";

export default function MyBagPage() {
  return (
    <>
      {/* Header */}
      <div style={{ fontFamily: "var(--font-poppins), sans-serif" }}>
        <span style={{ color: "#E8C96A", fontSize: "clamp(18px, 2.5vw, 25px)", fontWeight: 400 }}>My Bag</span>
      </div>

      {/* Owner stats card */}
      <BagOwnerCard />

      {/* Bottom layout: Bag Details (left) + NFC Scan History (right) */}
      <div className="grid grid-cols-1 lg:grid-cols-[4fr_2fr] gap-6 items-stretch" style={{ marginTop: "20px" }}>
        <BagDetails />
        <NFCScanHistory />
      </div>
    </>
  );
}
