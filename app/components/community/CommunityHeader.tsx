"use client";

import { useState } from "react";
import Button from "@/app/components/ui/Button";
import NewPostModal from "@/app/components/community/NewPostModal";

interface CommunityHeaderProps {
  onPostCreated: () => void;
}

export default function CommunityHeader({ onPostCreated }: CommunityHeaderProps) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-8">
        <div>
          <div
            className="tracking-wide"
            style={{ fontSize: "clamp(18px, 2.5vw, 25px)", color: "#E8C96A", fontWeight: 400, fontFamily: "var(--font-poppins), sans-serif" }}
          >
            Owners Community
          </div>
          <div
            className="mt-1"
            style={{ fontSize: "clamp(13px, 1.5vw, 16px)", color: "#FFFFFF", fontWeight: 400, fontFamily: "var(--font-poppins), sans-serif" }}
          >
            Members-only · 847 verified bag owners
          </div>
        </div>
        <Button onClick={() => setShowModal(true)}>+ New Post</Button>
      </div>

      {showModal && <NewPostModal onClose={() => setShowModal(false)} onPostCreated={onPostCreated} />}
    </>
  );
}
