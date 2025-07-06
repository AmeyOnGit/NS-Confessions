import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Bold, Italic, Underline } from "lucide-react";

// Convert HTML to markdown format
function convertToMarkdown(html: string): string {
  let text = html;
  
  // Replace HTML tags with markdown - order matters for nested tags
  text = text.replace(/<(strong|b)[^>]*>(.*?)<\/(strong|b)>/gi, '**$2**');
  text = text.replace(/<(em|i)[^>]*>(.*?)<\/(em|i)>/gi, '*$2*');
  text = text.replace(/<u[^>]*>(.*?)<\/u>/gi, '__$1__');
  
  // Replace line breaks
  text = text.replace(/<br\s*\/?>/gi, '\n');
  text = text.replace(/<div[^>]*>/gi, '\n');
  text = text.replace(/<\/div>/gi, '');
  text = text.replace(/<p[^>]*>/gi, '');
  text = text.replace(/<\/p>/gi, '\n');
  
  // Clean up extra whitespace and newlines
  text = text.replace(/&nbsp;/g, ' ');
  text = text.replace(/\n\s*\n/g, '\n');
  text = text.trim();
  
  return text;
}

// Convert markdown to HTML format  
function convertToHtml(markdown: string): string {
  let html = markdown;
  
  // Handle bold+italic first (***text***)
  html = html.replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>');
  
  // Handle bold (**text**)
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // Handle italic (*text*)
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  
  // Handle underline (__text__)
  html = html.replace(/__(.*?)__/g, '<u>$1</u>');
  
  // Handle line breaks
  html = html.replace(/\n/g, '<br>');
  
  return html;
}

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



  const handleFormatting = (format: 'bold' | 'italic' | 'underline') => {
    if (!editorRef.current) return;
    
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    
    const range = selection.getRangeAt(0);
    if (!editorRef.current.contains(range.commonAncestorContainer)) return;
    
    const selectedText = selection.toString();
    if (!selectedText) return;
    
    // Apply formatting using execCommand for true WYSIWYG
    document.execCommand(format, false);
    
    // Update active states
    setIsBoldActive(document.queryCommandState('bold'));
    setIsItalicActive(document.queryCommandState('italic'));
    setIsUnderlineActive(document.queryCommandState('underline'));
    
    // Convert to markdown and update value
    setTimeout(() => {
      if (editorRef.current) {
        const markdownText = convertToMarkdown(editorRef.current.innerHTML);
        onChange(markdownText);
      }
    }, 0);
  };

  const handleInput = () => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      const markdownText = convertToMarkdown(html);
      console.log('HTML:', html);
      console.log('Markdown:', markdownText);
      
      // Test the regex directly
      const testResult = html.replace(/<(strong|b)[^>]*>(.*?)<\/(strong|b)>/gi, '**$2**');
      console.log('Regex test result:', testResult);
      
      if (markdownText.length <= maxLength) {
        onChange(markdownText);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Handle max length
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

  // Initialize and update editor content when value changes
  useEffect(() => {
    if (editorRef.current) {
      const currentHtml = editorRef.current.innerHTML;
      const expectedHtml = convertToHtml(value);
      
      // Only update if content is different to avoid cursor jumping
      if (currentHtml !== expectedHtml) {
        editorRef.current.innerHTML = expectedHtml;
      }
    }
  }, [value]);

  // Initialize content on mount
  useEffect(() => {
    if (editorRef.current && value) {
      editorRef.current.innerHTML = convertToHtml(value);
    }
  }, []);

  useEffect(() => {
    document.addEventListener('selectionchange', handleSelectionChange);
    return () => document.removeEventListener('selectionchange', handleSelectionChange);
  }, []);

  const minHeight = rows * 24; // Approximate line height

  return (
    <div className="border border-slate-300 rounded-lg">
      {/* Rich Text Editor */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        className={`w-full px-4 py-3 border-0 rounded-t-lg focus:outline-none resize-none transition-all duration-200 ${className}`}
        style={{ minHeight: `${minHeight}px` }}
        data-placeholder={placeholder}
        suppressContentEditableWarning={true}
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