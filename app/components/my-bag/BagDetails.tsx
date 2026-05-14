import Image from "next/image";

const dividerStyle = { height: "1px", backgroundColor: "rgba(255,255,255,0.08)", marginRight: "-24px" };

interface BagDetailsProps {
  bagsData?: any;
}

export default function BagDetails({ bagsData }: BagDetailsProps) {
  const firstBag = bagsData?.bags?.[0];
  const bagName = firstBag?.bagType?.name || "—";
  const uid = firstBag?.uid || "—";
  const tokenId = firstBag?.tokenId || "—";
  const collection = firstBag?.bagType?.collection || "—";

  const registeredDate = firstBag?.registeredAt
    ? new Date(firstBag.registeredAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : firstBag?.createdAt
    ? new Date(firstBag.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : "—";

  const lastTapped = firstBag?.lastTappedAt
    ? new Date(firstBag.lastTappedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : "Never";

  const details = [
    { label: "Model", value: bagName },
    { label: "Serial No", value: firstBag?.tokenId || "—" },
    { label: "NFC Token", value: uid },
    { label: "Collection", value: collection },
    { label: "Status", value: "Active Owner", color: "#4ADE80" },
  ];

  return (
    <div style={{ backgroundColor: "#13192A", borderRadius: "5px", padding: "clamp(16px, 3vw, 24px)", fontFamily: "var(--font-poppins), sans-serif", fontWeight: 400 }}>
      <div className="flex flex-col sm:flex-row gap-6" style={{ alignItems: "flex-start" }}>
        {/* Bag image */}
        <div style={{ flexShrink: 0, width: "100%", maxWidth: "300px", borderRadius: "5px", overflow: "hidden", margin: "0 auto" }} className="sm:margin-0">
          <Image src={firstBag?.bagType?.imageUrl || "/Rectangle 21.png"} alt={bagName} width={300} height={400} style={{ width: "100%", height: "auto", display: "block", borderRadius: "5px" }} />
        </div>

        {/* Details */}
        <div style={{ flex: 1, minWidth: 0, width: "100%" }}>
          <div style={{ color: "#E8C96A", fontSize: "clamp(16px, 1.8vw, 20px)", fontWeight: 400, marginBottom: "16px" }}>
            Bag Details
          </div>
          <div style={{ height: "1px", backgroundColor: "rgba(255,255,255,0.08)", marginLeft: "clamp(-16px, -3vw, -24px)", marginRight: "clamp(-16px, -3vw, -24px)" }} />

          {details.map((item, i) => (
            <div key={i}>
              <div
                className="flex flex-row items-center justify-between"
                style={{
                  paddingTop: "clamp(12px, 2vw, 16px)",
                  paddingBottom: "clamp(12px, 2vw, 16px)",
                  gap: "clamp(8px, 2vw, 16px)",
                }}
              >
                <span
                  style={{
                    color: "#FFFFFF",
                    fontSize: "clamp(12px, 1.4vw, 16px)",
                    fontWeight: 400,
                    flexShrink: 0,
                  }}
                >
                  {item.label}
                </span>
                <span
                  style={{
                    color: item.color || "#FFFFFF",
                    fontSize: "clamp(12px, 1.4vw, 16px)",
                    fontWeight: 500,
                    textAlign: "right",
                    wordBreak: "break-all",
                    minWidth: 0,
                    flexShrink: 1,
                  }}
                >
                  {item.value}
                </span>
              </div>
              {i < details.length - 1 && <div style={{ height: "1px", backgroundColor: "rgba(255,255,255,0.08)", marginLeft: "clamp(-16px, -3vw, -24px)", marginRight: "clamp(-16px, -3vw, -24px)" }} />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
