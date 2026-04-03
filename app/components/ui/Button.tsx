interface ButtonProps {
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
  className?: string;
}

export default function Button({ children, href, onClick, className = "" }: ButtonProps) {
  const style = {
    width: "clamp(110px, 10vw, 150px)",
    height: "clamp(38px, 4vw, 50px)",
    backgroundColor: "#E8C96A",
    color: "#060D1F",
    fontSize: "clamp(12px, 1.1vw, 16px)",
    fontFamily: "var(--font-poppins), sans-serif",
    fontWeight: 500,
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    whiteSpace: "nowrap" as const,
    textDecoration: "none",
    flexShrink: 0,
  };

  if (href) {
    return (
      <a href={href} style={style} className={className}>
        {children}
      </a>
    );
  }

  return (
    <button onClick={onClick} style={style} className={className}>
      {children}
    </button>
  );
}
