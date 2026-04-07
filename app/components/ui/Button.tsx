interface ButtonProps {
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

export default function Button({ children, href, onClick, className = "", style: styleProp }: ButtonProps) {
  const style = {
    minWidth: "120px",
    width: "auto",
    height: "44px",
    padding: "0 clamp(20px, 3vw, 32px)",
    backgroundColor: "#E8C96A",
    color: "#060D1F",
    fontSize: "clamp(14px, 1.5vw, 16px)",
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
    ...styleProp,
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
