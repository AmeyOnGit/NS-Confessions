import React, { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Bold, Italic, Type } from "lucide-react";
import { applyFormatting } from "@/lib/text-parser";

interface FormattedTextareaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  rows?: number;
  className?: string;
}

export function FormattedTextarea({
  value,
  onChange,
  placeholder = "Type your message...",
  maxLength = 500,
  rows = 3,
  className = ""
}: FormattedTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleFormatting = (format: 'bold' | 'italic' | 'bold-italic') => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const selectionStart = textarea.selectionStart;
    const selectionEnd = textarea.selectionEnd;

    if (selectionStart === selectionEnd) {
      // No text selected, show helper message
      return;
    }

    const { newText, newCursorPos } = applyFormatting(
      value,
      selectionStart,
      selectionEnd,
      format
    );

    onChange(newText);

    // Set cursor position after formatting
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };

  return (
    <div className="space-y-2">
      {/* Formatting Toolbar */}
      <div className="flex items-center space-x-2 p-2 bg-slate-50 rounded-t-lg border border-b-0 border-slate-300">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => handleFormatting('bold')}
          className="h-8 w-8 p-0 hover:bg-slate-200"
          title="Bold (select text first)"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => handleFormatting('italic')}
          className="h-8 w-8 p-0 hover:bg-slate-200"
          title="Italic (select text first)"
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => handleFormatting('bold-italic')}
          className="h-8 w-8 p-0 hover:bg-slate-200"
          title="Bold + Italic (select text first)"
        >
          <Type className="h-4 w-4" />
        </Button>
        <div className="flex-1" />
        <span className="text-xs text-slate-500">
          Select text and click formatting buttons
        </span>
      </div>

      {/* Textarea */}
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`rounded-t-none border-t-0 ${className}`}
        rows={rows}
        maxLength={maxLength}
      />

      {/* Character Count and Format Help */}
      <div className="flex justify-between items-center text-xs text-slate-500">
        <div className="space-x-4">
          <span>**bold**</span>
          <span>*italic*</span>
          <span>***bold+italic***</span>
          <span>URLs auto-link</span>
        </div>
        <span>{value.length}/{maxLength}</span>
      </div>
    </div>
  );
}