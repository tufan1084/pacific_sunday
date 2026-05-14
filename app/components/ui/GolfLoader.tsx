"use client";

import type { CSSProperties } from "react";

interface GolfLoaderProps {
  text?: string;
  fullScreen?: boolean;
  size?: "sm" | "md" | "lg";
}

const SIZE = {
  sm: { width: "clamp(160px, 36vw, 220px)", text: "12px", gap: "12px" },
  md: { width: "clamp(220px, 46vw, 300px)", text: "14px", gap: "16px" },
  lg: { width: "clamp(280px, 60vw, 380px)", text: "16px", gap: "20px" },
};

export default function GolfLoader({
  text = "Loading...",
  fullScreen = false,
  size = "md",
}: GolfLoaderProps) {
  const s = SIZE[size];

  const wrapper: CSSProperties = fullScreen
    ? {
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background:
          "radial-gradient(ellipse at center, #0a1430 0%, #060D1F 60%, #03081a 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        fontFamily: "var(--font-poppins), sans-serif",
      }
    : {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "clamp(20px, 4vw, 60px) 16px",
        fontFamily: "var(--font-poppins), sans-serif",
        width: "100%",
      };

  return (
    <div style={wrapper}>
      <div style={{ width: s.width, maxWidth: "100%" }} className="gl-float">
        <svg
          viewBox="0 0 320 200"
          width="100%"
          height="auto"
          preserveAspectRatio="xMidYMid meet"
          style={{ display: "block", overflow: "visible" }}
          aria-hidden="true"
        >
          <defs>
            {/* Soft green fairway haze on the horizon */}
            <linearGradient id="gl-horizon" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(74,222,128,0)" />
              <stop offset="60%" stopColor="rgba(74,222,128,0.07)" />
              <stop offset="100%" stopColor="rgba(74,222,128,0.13)" />
            </linearGradient>

            {/* Ground spotlights — fade fully transparent at outer ring so there's no visible edge */}
            <radialGradient id="gl-spot-gold" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(232,201,106,0.42)" />
              <stop offset="65%" stopColor="rgba(232,201,106,0.07)" />
              <stop offset="100%" stopColor="rgba(232,201,106,0)" />
            </radialGradient>
            <radialGradient id="gl-spot-white" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.28)" />
              <stop offset="65%" stopColor="rgba(255,255,255,0.05)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0)" />
            </radialGradient>

            {/* Flag gradient — luxury red */}
            <linearGradient id="gl-flag" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#EF4444" />
              <stop offset="60%" stopColor="#DC2626" />
              <stop offset="100%" stopColor="#B91C1C" />
            </linearGradient>

            {/* Torso gradient */}
            <linearGradient id="gl-torso" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2a3656" />
              <stop offset="100%" stopColor="#131c33" />
            </linearGradient>

            {/* Ball gradient */}
            <radialGradient id="gl-ball-grad" cx="35%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="80%" stopColor="#f0f0f0" />
              <stop offset="100%" stopColor="#b8b8b8" />
            </radialGradient>

            {/* Trail gradient — flows from impact (left) toward hole (right) */}
            <linearGradient id="gl-trail-grad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="rgba(232,201,106,0)" />
              <stop offset="30%" stopColor="rgba(232,201,106,0.75)" />
              <stop offset="70%" stopColor="rgba(255,255,255,0.55)" />
              <stop offset="100%" stopColor="rgba(232,201,106,0)" />
            </linearGradient>

            {/* Soft glow filter for the ball in flight */}
            <filter id="gl-ball-glow" x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur stdDeviation="1.6" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Distant fairway haze */}
            <rect x="0" y="120" width="320" height="50" fill="url(#gl-horizon)" />

            {/* Drifting dust motes */}
            <g fill="rgba(232,201,106,0.5)">
              <circle className="gl-p1" cx="40"  cy="90"  r="0.9" />
              <circle className="gl-p2" cx="120" cy="60"  r="0.7" />
              <circle className="gl-p3" cx="200" cy="80"  r="0.8" />
              <circle className="gl-p4" cx="260" cy="50"  r="0.6" />
              <circle className="gl-p5" cx="160" cy="110" r="0.7" />
            </g>

            {/* Ground spotlights */}
            <ellipse className="gl-spot-golfer" cx="58"  cy="172" rx="42" ry="9" fill="url(#gl-spot-gold)" />
            <ellipse className="gl-spot-hole"   cx="280" cy="172" rx="38" ry="8" fill="url(#gl-spot-white)" />

            {/* Distant ridge */}
            <path
              d="M0 168 Q60 160 110 165 T220 162 T320 168 L320 170 L0 170 Z"
              fill="rgba(74,222,128,0.07)"
            />

            {/* Ground line — softer, gradient end so it doesn't terminate sharply */}
            <line
              x1="6" y1="168" x2="314" y2="168"
              stroke="rgba(232,201,106,0.35)"
              strokeWidth="1"
              strokeLinecap="round"
            />

            {/* Grass tufts (mixed gold + green) */}
            <g strokeWidth="1" strokeLinecap="round" fill="none">
              <path d="M24 168 L25 163 M28 168 L30 164" stroke="rgba(232,201,106,0.5)" />
              <path d="M110 168 L112 164 M115 168 L116 163" stroke="rgba(74,222,128,0.4)" />
              <path d="M168 168 L170 163 M172 168 L174 164" stroke="rgba(232,201,106,0.5)" />
              <path d="M232 168 L234 164 M237 168 L238 163" stroke="rgba(74,222,128,0.4)" />
            </g>

            {/* Glowing trail — gradient stroke draws on after impact */}
            <path
              className="gl-trail"
              d="M82 162 Q170 24 278 160"
              fill="none"
              stroke="url(#gl-trail-grad)"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeDasharray="320"
            />

            {/* Flag + hole */}
            <g transform="translate(280, 168)">
              <ellipse cx="0" cy="3" rx="13" ry="3" fill="rgba(0,0,0,0.55)" />
              <ellipse cx="0" cy="1.5" rx="6" ry="1.6" fill="rgba(0,0,0,0.85)" />
              <circle className="gl-hole-pulse" cx="0" cy="1" r="6" fill="none"
                stroke="rgba(232,201,106,0.55)" strokeWidth="1" />
              <line x1="0" y1="0" x2="0" y2="-52" stroke="#d4d4d4" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="0.4" y1="0" x2="0.4" y2="-52" stroke="rgba(255,255,255,0.35)" strokeWidth="0.4" />
              <circle cx="0" cy="-52" r="1.9" fill="#E8C96A" />
              <g className="gl-flag">
                <path
                  d="M0 -52 Q8 -54 16 -50 Q22 -47 24 -42 Q22 -39 16 -41 Q8 -43 0 -41 Z"
                  fill="url(#gl-flag)"
                />
                <path
                  d="M2 -48 Q12 -49 22 -45"
                  stroke="rgba(255,255,255,0.22)"
                  strokeWidth="0.4"
                  fill="none"
                />
              </g>
            </g>

            {/* Tee */}
            <g transform="translate(82, 168)">
              <ellipse cx="0" cy="0" rx="4" ry="1.4" fill="rgba(0,0,0,0.45)" />
              <path d="M-1.5 0 L1.5 0 L1 -4 L-1 -4 Z" fill="rgba(232,201,106,0.7)" />
            </g>

            {/* Impact burst */}
            <g className="gl-burst">
              <circle cx="0" cy="0" r="2.6" fill="rgba(255,255,255,0.95)" />
              <line x1="-3" y1="-3" x2="-8" y2="-8"  stroke="rgba(232,201,106,0.9)" strokeWidth="1.1" strokeLinecap="round" />
              <line x1="3"  y1="-3" x2="8"  y2="-8"  stroke="rgba(232,201,106,0.9)" strokeWidth="1.1" strokeLinecap="round" />
              <line x1="-4.5" y1="0" x2="-10" y2="0" stroke="rgba(232,201,106,0.9)" strokeWidth="1.1" strokeLinecap="round" />
              <line x1="0" y1="-4.5" x2="0" y2="-10" stroke="rgba(232,201,106,0.9)" strokeWidth="1.1" strokeLinecap="round" />
              <line x1="3"  y1="3" x2="7"  y2="7"  stroke="rgba(232,201,106,0.7)" strokeWidth="0.9" strokeLinecap="round" />
              <line x1="-3" y1="3" x2="-7" y2="7"  stroke="rgba(232,201,106,0.7)" strokeWidth="0.9" strokeLinecap="round" />
            </g>

            {/* Ball shadow */}
            <ellipse className="gl-ball-shadow" cx="0" cy="0" rx="4" ry="1.3" fill="rgba(0,0,0,0.5)" />

            {/* Ball with glow filter */}
            <g className="gl-ball" filter="url(#gl-ball-glow)">
              <circle cx="0" cy="0" r="3.8" fill="url(#gl-ball-grad)" />
              <circle cx="-1.2" cy="-1"  r="0.7"  fill="rgba(0,0,0,0.18)" />
              <circle cx="1.1"  cy="-1.2" r="0.6" fill="rgba(0,0,0,0.15)" />
              <circle cx="0.3"  cy="1.2"  r="0.55" fill="rgba(0,0,0,0.15)" />
            </g>

            {/* Golfer body */}
            <g transform="translate(58, 168)">
              <g className="gl-body">
                {/* Legs */}
                <path
                  d="M-6 -28 L-9 0 M6 -28 L9 0"
                  stroke="#2a3a5f"
                  strokeWidth="6.5"
                  strokeLinecap="round"
                />
                <ellipse cx="-9" cy="0" rx="6" ry="2.5" fill="#0e1422" />
                <ellipse cx="9"  cy="0" rx="6" ry="2.5" fill="#0e1422" />

                {/* Torso */}
                <path
                  d="M-11 -28 Q-12.5 -50 -8 -58 L8 -58 Q12.5 -50 11 -28 Z"
                  fill="url(#gl-torso)"
                />
                <path
                  d="M-9 -55 Q-10 -42 -9.5 -30"
                  stroke="rgba(232,201,106,0.22)"
                  strokeWidth="0.6"
                  fill="none"
                />
                <path d="M-4 -58 L4 -58 L3 -53 L-3 -53 Z" fill="#E8C96A" />
                <circle cx="0" cy="-50" r="0.6" fill="#E8C96A" />
                <circle cx="0" cy="-45" r="0.6" fill="#E8C96A" />

                {/* Head & cap */}
                <circle cx="0" cy="-65" r="7" fill="#E8C96A" />
                <circle cx="-6.5" cy="-64" r="1.2" fill="#c9a64f" />
                <ellipse cx="2.5" cy="-66" rx="8" ry="2" fill="#1a2540" />
                <path d="M-6 -68 Q0 -76 6 -68 Z" fill="#1a2540" />
                <circle cx="0" cy="-74.6" r="0.9" fill="#E8C96A" />
              </g>
            </g>

            {/* Swing group — kept in source coords, mirrored by the parent transform */}
            <g className="gl-swing">
              <path d="M51 116 Q49 124 56 130" stroke="#c9a64f" strokeWidth="4" strokeLinecap="round" fill="none" />
              <path d="M65 116 Q67 124 60 130" stroke="#E8C96A" strokeWidth="4" strokeLinecap="round" fill="none" />
              <circle cx="58" cy="132" r="3.4" fill="#E8C96A" stroke="#9a8246" strokeWidth="0.5" />
              <line x1="58" y1="132" x2="80" y2="164" stroke="#d4d4d4" strokeWidth="1.6" strokeLinecap="round" />
              <line x1="59" y1="133" x2="80" y2="163" stroke="rgba(255,255,255,0.5)" strokeWidth="0.5" />
              <path d="M77 166 L89 159 L91 164 L79 171 Z" fill="#E8C96A" stroke="#9a8246" strokeWidth="0.5" />
              <path d="M80 167 L87 163" stroke="#9a8246" strokeWidth="0.4" />
            </g>

          <style>{`
            .gl-float {
              animation: glFloat 6.4s ease-in-out infinite;
              will-change: transform;
            }
            .gl-swing {
              transform-origin: 58px 116px;
              animation: glSwing 3.6s cubic-bezier(0.42, 0, 0.58, 1) infinite;
              will-change: transform;
            }
            .gl-body {
              animation: glBob 3.6s ease-in-out infinite;
            }
            .gl-ball {
              animation: glBall 3.6s cubic-bezier(0.42, 0, 0.58, 1) infinite;
              will-change: transform, opacity;
            }
            .gl-ball-shadow {
              animation: glBallShadow 3.6s cubic-bezier(0.42, 0, 0.58, 1) infinite;
              opacity: 0;
            }
            .gl-trail {
              animation: glTrail 3.6s cubic-bezier(0.35, 0, 0.45, 1) infinite;
              opacity: 0;
              stroke-dashoffset: 320;
            }
            .gl-burst {
              animation: glBurst 3.6s ease-out infinite;
              opacity: 0;
            }
            .gl-flag {
              transform-origin: 0px -47px;
              animation: glFlag 2.2s ease-in-out infinite;
            }
            .gl-spot-golfer {
              animation: glSpotGolfer 3.6s ease-in-out infinite;
              transform-box: fill-box;
              transform-origin: 50% 50%;
            }
            .gl-spot-hole {
              animation: glSpotHole 3.6s ease-in-out infinite;
              transform-box: fill-box;
              transform-origin: 50% 50%;
            }
            .gl-hole-pulse {
              transform-box: fill-box;
              transform-origin: 50% 50%;
              animation: glHolePulse 3.6s ease-out infinite;
              opacity: 0;
            }
            .gl-p1 { animation: glDust 7.2s ease-in-out infinite;        opacity: 0.5; }
            .gl-p2 { animation: glDust 8.4s ease-in-out -1.6s infinite; opacity: 0.4; }
            .gl-p3 { animation: glDust 9.0s ease-in-out -3.2s infinite; opacity: 0.5; }
            .gl-p4 { animation: glDust 8.0s ease-in-out -4.8s infinite; opacity: 0.35; }
            .gl-p5 { animation: glDust 7.8s ease-in-out -2.4s infinite; opacity: 0.45; }

            @keyframes glFloat {
              0%, 100% { transform: translateY(0); }
              50%      { transform: translateY(-3px); }
            }

            @keyframes glSwing {
              /* Rotations reversed so at impact (50%, crossing 0deg from a positive
                 backswing) the club head's velocity is rightward — consistent with
                 the ball flying right toward the hole. */
              0%   { transform: rotate(-8deg); }
              8%   { transform: rotate(18deg); }
              26%  { transform: rotate(160deg); }
              36%  { transform: rotate(170deg); }
              44%  { transform: rotate(160deg); }
              50%  { transform: rotate(0deg); }
              58%  { transform: rotate(-70deg); }
              68%  { transform: rotate(-95deg); }
              82%  { transform: rotate(-60deg); }
              92%  { transform: rotate(-20deg); }
              100% { transform: rotate(-8deg); }
            }
            @keyframes glBob {
              0%, 100% { transform: translateY(0); }
              28%      { transform: translateY(-1.4px); }
              50%      { transform: translateY(0.6px); }
              70%      { transform: translateY(0); }
            }
            @keyframes glBall {
              0%, 48%   { transform: translate(82px, 165px) scale(1);    opacity: 1; }
              52%       { transform: translate(92px, 158px) scale(1.1);  opacity: 1; }
              60%       { transform: translate(135px, 90px) scale(0.85); opacity: 1; }
              70%       { transform: translate(180px, 42px) scale(0.7);  opacity: 1; }
              80%       { transform: translate(235px, 90px) scale(0.85); opacity: 1; }
              88%       { transform: translate(276px, 158px) scale(1);   opacity: 1; }
              92%       { transform: translate(280px, 165px) scale(0.55); opacity: 0.35; }
              95%, 100% { transform: translate(82px, 165px) scale(1);    opacity: 0; }
            }
            @keyframes glBallShadow {
              0%, 48%   { transform: translate(82px, 169px)  scaleX(1);    opacity: 0.4; }
              60%       { transform: translate(135px, 169px) scaleX(0.32); opacity: 0.10; }
              70%       { transform: translate(180px, 169px) scaleX(0.22); opacity: 0.06; }
              80%       { transform: translate(235px, 169px) scaleX(0.55); opacity: 0.2; }
              88%       { transform: translate(276px, 169px) scaleX(1);    opacity: 0.4; }
              95%, 100% { opacity: 0; transform: translate(82px, 169px) scaleX(1); }
            }
            @keyframes glTrail {
              0%, 50%  { opacity: 0;    stroke-dashoffset: 320; }
              58%      { opacity: 0.85; stroke-dashoffset: 200; }
              72%      { opacity: 0.85; stroke-dashoffset: 60; }
              84%      { opacity: 0.7;  stroke-dashoffset: 0; }
              92%      { opacity: 0; }
              100%     { opacity: 0;    stroke-dashoffset: 320; }
            }
            @keyframes glBurst {
              0%, 48%   { opacity: 0; transform: translate(82px, 164px) scale(0.4); }
              51%       { opacity: 1; transform: translate(82px, 164px) scale(1); }
              57%       { opacity: 0; transform: translate(82px, 164px) scale(1.8); }
              100%      { opacity: 0; transform: translate(82px, 164px) scale(0.4); }
            }
            @keyframes glFlag {
              0%, 100% { transform: skewX(-4deg) scaleY(1); }
              25%      { transform: skewX(6deg)  scaleY(0.97); }
              50%      { transform: skewX(-2deg) scaleY(1.02); }
              75%      { transform: skewX(8deg)  scaleY(0.96); }
            }
            @keyframes glSpotGolfer {
              0%, 100% { transform: scale(1);    opacity: 0.85; }
              30%      { transform: scale(1.15); opacity: 1; }
              50%      { transform: scale(0.92); opacity: 0.65; }
              80%      { transform: scale(1);    opacity: 0.85; }
            }
            @keyframes glSpotHole {
              0%, 70%  { transform: scale(0.95); opacity: 0.6; }
              82%      { transform: scale(1.3);  opacity: 1; }
              92%      { transform: scale(1.05); opacity: 0.75; }
              100%     { transform: scale(0.95); opacity: 0.6; }
            }
            @keyframes glHolePulse {
              0%, 80%  { opacity: 0;   transform: scale(1); }
              85%      { opacity: 0.9; transform: scale(1); }
              95%      { opacity: 0;   transform: scale(2.6); }
              100%     { opacity: 0;   transform: scale(2.6); }
            }
            @keyframes glDust {
              0%   { transform: translateY(0)     translateX(0); opacity: 0; }
              15%  { opacity: 0.55; }
              50%  { transform: translateY(-14px) translateX(4px); opacity: 0.45; }
              85%  { opacity: 0.25; }
              100% { transform: translateY(-28px) translateX(-2px); opacity: 0; }
            }

            @media (prefers-reduced-motion: reduce) {
              .gl-float, .gl-swing, .gl-body, .gl-ball, .gl-ball-shadow,
              .gl-trail, .gl-burst, .gl-flag, .gl-spot-golfer, .gl-spot-hole,
              .gl-hole-pulse, .gl-p1, .gl-p2, .gl-p3, .gl-p4, .gl-p5 {
                animation-duration: 8s !important;
              }
            }
          `}</style>
        </svg>

        <div
          style={{
            marginTop: s.gap,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <div
            className="gl-text"
            style={{
              color: "#E8C96A",
              fontSize: s.text,
              fontWeight: 500,
              letterSpacing: "1.4px",
              textTransform: "uppercase",
              textAlign: "center",
              backgroundImage:
                "linear-gradient(90deg, rgba(232,201,106,0.55) 0%, #ffffff 50%, rgba(232,201,106,0.55) 100%)",
              backgroundSize: "200% 100%",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            {text}
          </div>

          <div
            style={{
              display: "flex",
              gap: "7px",
              justifyContent: "center",
            }}
          >
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  backgroundColor: "#E8C96A",
                  boxShadow: "0 0 6px rgba(232,201,106,0.6)",
                  animation: `glPulse 1.4s ease-in-out ${i * 0.2}s infinite`,
                }}
              />
            ))}
          </div>
        </div>

        <style>{`
          .gl-text {
            animation: glShimmer 3.6s linear infinite;
          }
          @keyframes glShimmer {
            0%   { background-position: 200% 0; }
            100% { background-position: -200% 0; }
          }
          @keyframes glPulse {
            0%, 100% { opacity: 0.25; transform: scale(0.7); }
            50%      { opacity: 1;    transform: scale(1.3); }
          }
          @media (prefers-reduced-motion: reduce) {
            .gl-text { animation-duration: 10s !important; }
          }
        `}</style>
      </div>
    </div>
  );
}
