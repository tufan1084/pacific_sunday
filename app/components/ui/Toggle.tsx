"use client";

interface ToggleProps {
  checked: boolean;
  onChange: () => void;
}

export default function Toggle({ checked, onChange }: ToggleProps) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className="relative shrink-0 cursor-pointer rounded-full border-2 transition-all duration-200"
      style={{
        width: "40px",
        height: "25px",
        backgroundColor: checked ? "transparent" : "#1A2235",
        borderColor: checked ? "#E8C96A" : "#FFFFFF",
      }}
    >
      <span
        className="absolute top-1/2 block rounded-full transition-all duration-200"
        style={{
          width: "12px",
          height: "12px",
          backgroundColor: checked ? "#E8C96A" : "#FFFFFF",
          transform: "translateY(-50%)",
          left: checked ? "22px" : "6px",
          boxShadow: checked
            ? "0 0 6px rgba(232, 201, 106, 0.4)"
            : "none",
        }}
      />
    </button>
  );
}
