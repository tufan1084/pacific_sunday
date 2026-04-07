import Image from "next/image";
import { BAG_DETAILS } from "@/app/lib/my-bag-data";

const dividerStyle = { height: "1px", backgroundColor: "rgba(255,255,255,0.08)", marginRight: "-24px" };

export default function BagDetails() {
  return (
    <div style={{ backgroundColor: "#13192A", borderRadius: "5px", padding: "24px", fontFamily: "var(--font-poppins), sans-serif", fontWeight: 400 }}>
      <div className="flex flex-col sm:flex-row gap-6" style={{ alignItems: "flex-start" }}>
        {/* Bag image */}
        <div style={{ flexShrink: 0, width: "100%", maxWidth: "300px", borderRadius: "5px", overflow: "hidden", margin: "0 auto" }}>
          <Image src="/Rectangle 21.png" alt="Golf Bag" width={300} height={400} style={{ width: "100%", height: "auto", display: "block", borderRadius: "5px" }} />
        </div>

        {/* Details */}
        <div style={{ flex: 1, minWidth: 0, width: "100%" }}>
          <div style={{ color: "#E8C96A", fontSize: "clamp(16px, 1.8vw, 20px)", fontWeight: 400, marginBottom: "16px" }}>
            Bag Details
          </div>
          <div style={{ height: "1px", backgroundColor: "rgba(255,255,255,0.08)", marginRight: "-24px" }} />

          {BAG_DETAILS.map((item, i) => (
            <div key={i}>
              <div className="flex items-center justify-between" style={{ paddingTop: "12px", paddingBottom: "12px", gap: "12px" }}>
                <span style={{ color: "#FFFFFF", fontSize: "clamp(13px, 1.3vw, 16px)", fontWeight: 400 }}>{item.label}</span>
                <span style={{ color: item.color, fontSize: "clamp(13px, 1.3vw, 16px)", fontWeight: 400, textAlign: "right" }}>{item.value}</span>
              </div>
              {i < BAG_DETAILS.length - 1 && <div style={dividerStyle} />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
