"use client";

import { Suspense, useEffect } from "react";
import MessagesContent from "@/app/components/chat/MessagesContent";

export default function MessagesPage() {
  return (
    <div style={{ height: "100%", overflow: "hidden" }}>
      <Suspense fallback={<div className="p-8">Loading...</div>}>
        <MessagesContent />
      </Suspense>
    </div>
  );
}
