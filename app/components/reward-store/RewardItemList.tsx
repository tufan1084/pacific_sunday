import Image from "next/image";
import { REWARD_ITEMS } from "@/app/lib/reward-store-data";

export default function RewardItemList() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontFamily: "var(--font-poppins), sans-serif" }}>
      {REWARD_ITEMS.map((item) => (
        <div
          key={item.id}
          className="flex items-center gap-3"
          style={{ backgroundColor: "#13192A", borderRadius: "5px", padding: "14px 16px" }}
        >
          {/* Image */}
          <div style={{ width: "65px", height: "65px", borderRadius: "5px", backgroundColor: "#0D1526", flexShrink: 0, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Image src={item.image} alt={item.name} width={65} height={65} style={{ objectFit: "cover", width: "100%", height: "100%" }} />
          </div>

          {/* Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: "#FFFFFF", fontSize: "clamp(14px, 1.5vw, 18px)", fontWeight: 400, marginBottom: "4px" }}>
              {item.name}
            </div>
            <div style={{ color: "#888888", fontSize: "clamp(12px, 1.2vw, 16px)", fontWeight: 400, marginBottom: "6px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {item.description}
            </div>
            <div style={{ color: "#E8C96A", fontSize: "clamp(13px, 1.4vw, 18px)", fontWeight: 400 }}>
              {item.pts}
            </div>
          </div>

          {/* Redeem button */}
          <button
            style={{
              backgroundColor: "#E8C96A",
              color: "#060D1F",
              border: "none",
              borderRadius: "5px",
              padding: "8px clamp(12px, 1.5vw, 20px)",
              fontSize: "clamp(12px, 1.2vw, 14px)",
              fontWeight: 500,
              fontFamily: "var(--font-poppins), sans-serif",
              cursor: "pointer",
              flexShrink: 0,
              whiteSpace: "nowrap",
            }}
          >
            Redeem
          </button>
        </div>
      ))}
    </div>
  );
}
