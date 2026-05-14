"use client";

import { useState, useRef, useEffect } from "react";
import { SendIcon, ImageIcon, EmojiIcon, CloseIcon } from "@/app/components/ui/Icons";
import { emitTyping } from "@/app/services/socket";

interface MessageInputProps {
  onSend: (content: string, mediaFiles?: File[])=> void;
  conversationId?: number;
}

const EMOJI_LIST = ["😀", "😂", "😍", "🥰", "😎", "🤔", "👍", "👏", "🔥", "❤️", "⛳", "🏌️"];

export default function MessageInput({ onSend, conversationId }: MessageInputProps) {
  const [content, setContent] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const handleSend = () => {
    if (content.trim() || selectedFiles.length > 0) {
      onSend(content, selectedFiles.length > 0 ? selectedFiles : undefined);
      setContent("");
      setSelectedFiles([]);
      setPreviewUrls([]);
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    // Auto-resize
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
    
    // Typing indicator
    if (conversationId) {
      const userId = parseInt(localStorage.getItem("ps_user_id") || "0");
      
      if (!isTyping) {
        setIsTyping(true);
        emitTyping(conversationId, userId, true);
      }
      
      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Set new timeout to stop typing after 2 seconds
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        emitTyping(conversationId, userId, false);
      }, 2000);
    }
  };

  const handleEmojiClick = (emoji: string) => {
    setContent((prev) => prev + emoji);
    setShowEmojiPicker(false);
    textareaRef.current?.focus();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Limit to 5 files
    const newFiles = files.slice(0, 5 - selectedFiles.length);
    setSelectedFiles((prev) => [...prev, ...newFiles]);

    // Create preview URLs
    newFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrls((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviewUrls((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div
      className="border-t px-4 py-3"
      style={{ 
        borderColor: "rgba(232, 201, 106, 0.1)",
        backgroundColor: "#1A2332",
        boxShadow: "0 -2px 10px rgba(0, 0, 0, 0.2)"
      }}
    >
      {/* File Previews */}
      {previewUrls.length > 0 && (
        <div className="flex gap-2 mb-2 overflow-x-auto pb-2">
          {previewUrls.map((url, idx) => (
            <div key={idx} className="relative flex-shrink-0 group">
              <img
                src={url}
                alt={`Preview ${idx + 1}`}
                className="w-16 h-16 object-cover rounded-lg"
                style={{ border: "2px solid #E8C96A" }}
              />
              <button
                onClick={() => removeFile(idx)}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-all"
                style={{ backgroundColor: "#EF4444", color: "#FFF" }}
              >
                <CloseIcon size={10} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input Area */}
      <div className="flex items-center gap-2">
        {/* Emoji Picker Button */}
        <div className="relative">
          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="p-2 rounded-full hover:bg-white/10 transition-all"
            style={{ color: "#E8C96A" }}
          >
            <EmojiIcon size={20} />
          </button>

          {showEmojiPicker && (
            <div
              className="absolute bottom-full left-0 mb-2 p-2 rounded-lg shadow-xl grid grid-cols-6 gap-1.5"
              style={{
                backgroundColor: "#0F1629",
                border: "1px solid rgba(232, 201, 106, 0.2)"
              }}
            >
              {EMOJI_LIST.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handleEmojiClick(emoji)}
                  className="text-xl hover:scale-110 transition-transform p-1"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Image Upload Button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="p-2 rounded-full hover:bg-white/10 transition-all"
          style={{ color: "#E8C96A" }}
          disabled={selectedFiles.length >= 5}
        >
          <ImageIcon size={20} />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Text Input */}
        <div className="flex-1 flex items-center rounded-full" style={{ backgroundColor: "#0F1629", border: "1px solid rgba(232, 201, 106, 0.15)" }}>
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={1}
            className="flex-1 px-4 py-2.5 bg-transparent outline-none resize-none"
            style={{
              color: "#E8C96A",
              maxHeight: "100px",
              fontSize: "14px"
            }}
          />
          
          {/* Send Button */}
          <button
            onClick={handleSend}
            disabled={!content.trim() && selectedFiles.length === 0}
            className="mr-1.5 p-2 rounded-full transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105 disabled:hover:scale-100"
            style={{
              backgroundColor: "#E8C96A",
              color: "#01050D"
            }}
          >
            <SendIcon size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
