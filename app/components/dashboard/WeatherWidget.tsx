import Image from "next/image";
import type { WeatherData } from "@/app/types";

interface WeatherWidgetProps {
  weather: WeatherData;
}

export default function WeatherWidget({ weather }: WeatherWidgetProps) {
  return (
    <div style={{ backgroundColor: "#13192A", borderRadius: "5px", fontFamily: "var(--font-poppins), sans-serif", display: "flex", alignItems: "stretch" }}>

      {/* Left */}
      <div style={{ flex: "0 0 75%", padding: "20px 16px", display: "flex", alignItems: "center", gap: "16px" }}>
        <Image
          src="/icons/weather.svg"
          alt="Weather"
          width={50}
          height={50}
          style={{ flexShrink: 0, width: "clamp(32px, 4vw, 50px)", height: "clamp(32px, 4vw, 50px)" }}
        />
        <div>
          <div style={{ fontSize: "clamp(12px, 1.3vw, 14px)", color: "#FFFFFF", fontWeight: 400, marginBottom: "6px" }}>
            {weather.location} · <span>{weather.event}</span>
          </div>
          <div>
            <span style={{ fontSize: "clamp(16px, 2.2vw, 24px)", color: "#E8C96A", fontWeight: 600 }}>
              {weather.tempF}°F
            </span>
            <span style={{ fontSize: "clamp(12px, 1.3vw, 14px)", color: "#FFFFFF", marginLeft: "6px" }}>
              / {weather.tempC}°C
            </span>
            <div style={{ fontSize: "clamp(12px, 1.3vw, 14px)", color: "#FFFFFF", marginTop: "2px" }}>
              {weather.condition} · {weather.wind}
            </div>
          </div>
        </div>
      </div>

      {/* Vertical divider */}
      <div style={{ width: "1.5px", backgroundColor: "rgba(255,255,255,0.15)", flexShrink: 0 }} />

      {/* Right */}
      <div style={{ flex: "0 0 25%", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "flex-end", padding: "20px 16px 20px 12px" }}>
        <div style={{ fontSize: "clamp(12px, 1.3vw, 14px)", color: "#E8C96A", fontWeight: 500 }}>{weather.playingCondition}</div>
        <div style={{ fontSize: "clamp(12px, 1.3vw, 14px)", color: "#FFFFFF", fontWeight: 400 }}>Playing</div>
        <div style={{ fontSize: "clamp(12px, 1.3vw, 14px)", color: "#FFFFFF", fontWeight: 400 }}>Condition</div>
      </div>
    </div>
  );
}
