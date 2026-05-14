"use client";

const dividerStyle = { height: "1px", backgroundColor: "rgba(255,255,255,0.08)" };

interface PointsHistoryProps {
  transactions?: any[];
}

export default function PointsHistory({ transactions = [] }: PointsHistoryProps) {

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatAmount = (amount: number) => {
    return amount > 0 ? `+${amount}` : amount.toString();
  };

  return (
    <div style={{ backgroundColor: "#13192A", borderRadius: "5px", padding: "20px", fontFamily: "var(--font-poppins), sans-serif", height: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ color: "#E8C96A", fontSize: "clamp(16px, 1.8vw, 20px)", fontWeight: 400, marginBottom: "16px" }}>Points History</div>

      {transactions.length === 0 ? (
        <div style={{ padding: "20px", textAlign: "center", color: "rgba(255,255,255,0.4)", fontSize: "14px" }}>
          No points history yet
        </div>
      ) : (
        <div style={{ overflowY: "auto", maxHeight: "400px", scrollbarWidth: "thin", scrollbarColor: "#999486 #313131", marginRight: "-20px", paddingRight: "20px" }}>
          {transactions.map((transaction, i) => (
            <div key={transaction.id}>
              <div className="flex items-center justify-between gap-2" style={{ paddingTop: "12px", paddingBottom: "12px" }}>
                <div className="flex items-center gap-2" style={{ minWidth: 0, flex: 1 }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#E8C96A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ color: "#E8C96A", fontSize: "clamp(12px, 1.3vw, 15px)", fontWeight: 400, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {transaction.description || transaction.type}
                    </div>
                    <div style={{ color: "#FFFFFF", fontSize: "clamp(11px, 1.1vw, 13px)", fontWeight: 400, marginTop: "2px" }}>
                      {formatDate(transaction.createdAt)}
                    </div>
                  </div>
                </div>
                <span style={{ color: transaction.amount > 0 ? "#4ADE80" : "#EF4444", fontSize: "clamp(13px, 1.3vw, 15px)", fontWeight: 500, flexShrink: 0 }}>
                  {formatAmount(transaction.amount)}
                </span>
              </div>
              {i < transactions.length - 1 && <div style={dividerStyle} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
