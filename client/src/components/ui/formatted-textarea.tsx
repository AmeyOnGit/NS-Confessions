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
  const editorRef = useRef<HTMLDivElement>(null);
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

  // Update editor content when value changes
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== convertToHtml(value)) {
      const selection = window.getSelection();
      const range = selection?.getRangeAt(0);
      const cursorPosition = range?.startOffset || 0;
      
      editorRef.current.innerHTML = convertToHtml(value);
      
      // Restore cursor position
      if (selection && range) {
        try {
          const textNode = editorRef.current.firstChild;
          if (textNode) {
            range.setStart(textNode, Math.min(cursorPosition, textNode.textContent?.length || 0));
            range.collapse(true);
            selection.removeAllRanges();
            selection.addRange(range);
          }
        } catch (e) {
          // Ignore cursor positioning errors
        }
      }
    }
  }, [value]);

  const handleInput = () => {
    if (editorRef.current) {
      const markdownText = convertToMarkdown(editorRef.current.innerHTML);
      if (markdownText.length <= maxLength) {
        onChange(markdownText);
      }
    }
  };

  const handleFormatting = (format: 'bold' | 'italic' | 'underline') => {
    document.execCommand(format, false);
    
    // Update active states
    setIsBoldActive(document.queryCommandState('bold'));
    setIsItalicActive(document.queryCommandState('italic'));
    setIsUnderlineActive(document.queryCommandState('underline'));
    
    // Update the value
    handleInput();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Handle space key explicitly
    if (e.key === ' ') {
      // Check max length before allowing space
      if (editorRef.current && editorRef.current.textContent && 
          editorRef.current.textContent.length >= maxLength) {
        e.preventDefault();
        return;
      }
      // Allow space to be inserted normally
      return;
    }

    // Handle max length - allow navigation keys
    if (editorRef.current && editorRef.current.textContent && 
        editorRef.current.textContent.length >= maxLength && 
        !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
      e.preventDefault();
      return;
    }

    // Handle Enter key to prevent excessive line breaks
    if (e.key === 'Enter' && rows <= 2) {
      e.preventDefault();
      return;
    }
  };

  const handleFocus = () => {
    // Update button states when editor gains focus
    setIsBoldActive(document.queryCommandState('bold'));
    setIsItalicActive(document.queryCommandState('italic'));
    setIsUnderlineActive(document.queryCommandState('underline'));
  };

  const handleSelectionChange = () => {
    // Update button states when selection changes
    if (editorRef.current?.contains(document.activeElement)) {
      setIsBoldActive(document.queryCommandState('bold'));
      setIsItalicActive(document.queryCommandState('italic'));
      setIsUnderlineActive(document.queryCommandState('underline'));
    }
  };

  useEffect(() => {
    document.addEventListener('selectionchange', handleSelectionChange);
    return () => document.removeEventListener('selectionchange', handleSelectionChange);
  }, []);

  const minHeight = rows * 24; // Approximate line height

  return (
    <div>
      {/* Rich Text Editor */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        className={`w-full px-4 py-3 border border-slate-300 rounded-t-lg focus:outline-none resize-none transition-all duration-200 ${className}`}
        style={{ minHeight: `${minHeight}px` }}
        data-placeholder={placeholder}
        suppressContentEditableWarning={true}
      />

      {/* Formatting Toolbar */}
      <div className="flex items-center space-x-1 p-1 bg-slate-50 rounded-b-lg border border-t-0 border-slate-300">
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