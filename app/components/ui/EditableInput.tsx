"use client";

import { useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from "react";

export interface EditableInputHandle {
  focus: () => void;
  blur: () => void;
  clear: () => void;
}

interface EditableInputProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
  multiline?: boolean;
  onEnter?: () => void;
  onImagePaste?: (file: File) => void;
  className?: string;
  style?: React.CSSProperties;
  autoFocus?: boolean;
  maxLength?: number;
  ariaLabel?: string;
  // Called when a GIF or image is inserted from the keyboard (Android/iOS)
  onGifInsert?: (file: File) => void;
}

const EditableInput = forwardRef<EditableInputHandle, EditableInputProps>(function EditableInput(
  {
    value, onChange, placeholder, disabled, multiline, onEnter, onImagePaste,
    className, style, autoFocus, maxLength, ariaLabel, onGifInsert,
  },
  ref
) {
  const elRef = useRef<HTMLDivElement>(null);
  // Refs to keep latest callbacks reachable from the native paste listener
  // without having to re-attach the listener on every render.
  const onChangeRef = useRef(onChange);
  const onImagePasteRef = useRef(onImagePaste);
  useEffect(() => { onChangeRef.current = onChange; }, [onChange]);
  useEffect(() => { onImagePasteRef.current = onImagePaste; }, [onImagePaste]);

  useImperativeHandle(ref, () => ({
    focus: () => elRef.current?.focus(),
    blur: () => elRef.current?.blur(),
    clear: () => { if (elRef.current) elRef.current.textContent = ""; onChange(""); },
  }), [onChange]);

  // Sync external value into the DOM only when it differs from current
  // textContent — prevents the caret from jumping while the user is typing.
  useEffect(() => {
    const el = elRef.current;
    if (!el) return;
    if (el.textContent !== value) {
      el.textContent = value;
    }
  }, [value]);

  useEffect(() => {
    if (autoFocus) elRef.current?.focus();
  }, [autoFocus]);

  const onGifInsertRef = useRef(onGifInsert);
  useEffect(() => { onGifInsertRef.current = onGifInsert; }, [onGifInsert]);

  // Native paste listener — handles:
  // 1. Images/GIFs pasted from clipboard
  // 2. GIFs inserted from Gboard / iOS keyboard GIF picker (delivered as paste events)
  // 3. Plain text paste (strips HTML)
  //
  // The native listener (not React synthetic) is required because:
  // - Android Gboard GIF picker fires a real DOM paste event with image/gif
  // - iOS keyboard GIF picker does the same
  // - React's synthetic delegation can miss these on some mobile browsers
  useEffect(() => {
    const el = elRef.current;
    if (!el) return;
    const handler = (e: ClipboardEvent) => {
      const dt = e.clipboardData;
      if (!dt) return;
      const items = Array.from(dt.items || []);

      // Check for any image type — includes image/gif from keyboard GIF pickers
      const imageItem = items.find(i => i.type.startsWith("image/"));
      if (imageItem) {
        const file = imageItem.getAsFile();
        if (file) {
          e.preventDefault();
          // Route GIFs to onGifInsert if provided, otherwise fall back to onImagePaste
          if (file.type === "image/gif" && onGifInsertRef.current) {
            onGifInsertRef.current(file);
          } else if (onImagePasteRef.current) {
            onImagePasteRef.current(file);
          }
          return;
        }
      }

      // Plain-text paste — strip HTML formatting
      const text = dt.getData("text/plain");
      if (text) {
        e.preventDefault();
        document.execCommand("insertText", false, text);
      }
    };
    el.addEventListener("paste", handler);
    return () => el.removeEventListener("paste", handler);
  }, []);

  const handleInput = useCallback((e: React.FormEvent<HTMLDivElement>) => {
    let text = e.currentTarget.textContent || "";
    if (maxLength && text.length > maxLength) {
      text = text.slice(0, maxLength);
      e.currentTarget.textContent = text;
      const sel = window.getSelection();
      if (sel && elRef.current) {
        const range = document.createRange();
        range.selectNodeContents(elRef.current);
        range.collapse(false);
        sel.removeAllRanges();
        sel.addRange(range);
      }
    }
    onChange(text);
  }, [onChange, maxLength]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !multiline && onEnter) {
      e.preventDefault();
      onEnter();
    }
  }, [multiline, onEnter]);

  return (
    <div
      ref={elRef}
      contentEditable={!disabled}
      suppressContentEditableWarning
      aria-label={ariaLabel}
      aria-multiline="true"
      data-placeholder={placeholder}
      // inputMode="text" ensures the standard keyboard opens (with emoji + GIF keys)
      // enterKeyHint="send" shows a Send key on mobile keyboards
      inputMode="text"
      // @ts-ignore — enterkeyhint is valid HTML but not in React's types yet
      enterkeyhint={multiline ? "enter" : "send"}
      onInput={handleInput}
      onKeyDown={handleKeyDown}
      className={`editable-input ${className || ""}`}
      style={{
        outline: "none",
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
        overflowWrap: "anywhere",
        // fontSize >= 16px prevents iOS auto-zoom on focus
        fontSize: style?.fontSize ?? "16px",
        ...style,
      }}
    />
  );
});

export default EditableInput;
