import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Bold, Italic, Underline } from "lucide-react";

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
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const [isBoldActive, setIsBoldActive] = useState(false);
  const [isItalicActive, setIsItalicActive] = useState(false);
  const [isUnderlineActive, setIsUnderlineActive] = useState(false);

  // Convert markdown to HTML for display
  const convertToHtml = (text: string): string => {
    return text
      .replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/__(.*?)__/g, '<u>$1</u>')
      .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 underline">$1</a>');
  };

  // Convert HTML back to markdown
  const convertToMarkdown = (html: string): string => {
    return html
      .replace(/<strong><em>(.*?)<\/em><\/strong>/g, '***$1***')
      .replace(/<strong>(.*?)<\/strong>/g, '**$1**')
      .replace(/<em>(.*?)<\/em>/g, '*$1*')
      .replace(/<u>(.*?)<\/u>/g, '__$1__')
      .replace(/<a[^>]*>(.*?)<\/a>/g, '$1')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ');
  };



  const handleFormatting = (format: 'bold' | 'italic' | 'underline') => {
    if (!editorRef.current) return;
    
    const textarea = editorRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    
    if (!selectedText) return;
    
    let formattedText = '';
    switch (format) {
      case 'bold':
        formattedText = `**${selectedText}**`;
        break;
      case 'italic':
        formattedText = `*${selectedText}*`;
        break;
      case 'underline':
        formattedText = `__${selectedText}__`;
        break;
    }
    
    const newValue = value.substring(0, start) + formattedText + value.substring(end);
    onChange(newValue);
    
    // Restore cursor position after formatting
    setTimeout(() => {
      if (textarea) {
        const newCursorPos = start + formattedText.length;
        textarea.setSelectionRange(newCursorPos, newCursorPos);
        textarea.focus();
      }
    }, 0);
  };

  const handleFocus = () => {
    // Simple focus handler - no special logic needed for textarea
  };

  const minHeight = rows * 24; // Approximate line height

  return (
    <div className="border border-slate-300 rounded-lg">
      {/* Rich Text Editor */}
      <textarea
        ref={editorRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={handleFocus}
        placeholder={placeholder}
        maxLength={maxLength}
        rows={rows}
        className={`w-full px-4 py-3 border-0 rounded-t-lg focus:outline-none resize-none transition-all duration-200 ${className}`}
        style={{ minHeight: `${minHeight}px` }}
      />

      {/* Formatting Toolbar */}
      <div className="flex items-center space-x-1 p-1 bg-slate-50 rounded-b-lg border-t border-slate-300">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => handleFormatting('bold')}
          className={`h-6 w-6 p-0 hover:bg-slate-200 ${isBoldActive ? 'bg-slate-200' : ''}`}
          title="Bold"
        >
          <Bold className="h-3 w-3" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => handleFormatting('italic')}
          className={`h-6 w-6 p-0 hover:bg-slate-200 ${isItalicActive ? 'bg-slate-200' : ''}`}
          title="Italic"
        >
          <Italic className="h-3 w-3" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => handleFormatting('underline')}
          className={`h-6 w-6 p-0 hover:bg-slate-200 ${isUnderlineActive ? 'bg-slate-200' : ''}`}
          title="Underline"
        >
          <Underline className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}