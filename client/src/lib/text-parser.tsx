import React from 'react';

// URL regex pattern that matches http/https URLs
const URL_REGEX = /(https?:\/\/[^\s]+)/g;

// Markdown-style formatting patterns
const BOLD_REGEX = /\*\*(.*?)\*\*/g;
const ITALIC_REGEX = /\*(.*?)\*/g;
const BOLD_ITALIC_REGEX = /\*\*\*(.*?)\*\*\*/g;

export function parseTextContent(text: string): React.ReactNode[] {
  const elements: React.ReactNode[] = [];
  let lastIndex = 0;
  let elementKey = 0;

  // First, handle URLs
  const urlMatches = Array.from(text.matchAll(URL_REGEX));
  
  for (const match of urlMatches) {
    const url = match[0];
    const startIndex = match.index!;
    
    // Add text before URL
    if (startIndex > lastIndex) {
      const beforeText = text.slice(lastIndex, startIndex);
      elements.push(...parseFormattedText(beforeText, elementKey));
      elementKey += 100; // Reserve space for nested elements
    }
    
    // Add clickable URL
    elements.push(
      <a
        key={elementKey++}
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 hover:text-blue-800 underline break-all"
      >
        {url}
      </a>
    );
    
    lastIndex = startIndex + url.length;
  }
  
  // Add remaining text after last URL
  if (lastIndex < text.length) {
    const remainingText = text.slice(lastIndex);
    elements.push(...parseFormattedText(remainingText, elementKey));
  }
  
  // If no URLs found, just parse for formatting
  if (urlMatches.length === 0) {
    return parseFormattedText(text, 0);
  }
  
  return elements;
}

function parseFormattedText(text: string, startKey: number): React.ReactNode[] {
  const result: React.ReactNode[] = [];
  let currentKey = startKey;
  let remainingText = text;
  
  // Process the text looking for formatting patterns
  const patterns = [
    { regex: BOLD_ITALIC_REGEX, className: "font-bold italic", tag: "strong" },
    { regex: BOLD_REGEX, className: "font-bold", tag: "strong" },
    { regex: ITALIC_REGEX, className: "italic", tag: "em" }
  ];
  
  while (remainingText.length > 0) {
    let earliestMatch: RegExpExecArray | null = null;
    let earliestIndex = remainingText.length;
    let patternIndex = -1;
    
    // Find the earliest formatting pattern
    patterns.forEach((pattern, idx) => {
      const match = pattern.regex.exec(remainingText);
      if (match && match.index !== undefined && match.index < earliestIndex) {
        earliestMatch = match;
        earliestIndex = match.index;
        patternIndex = idx;
        pattern.regex.lastIndex = 0; // Reset regex
      }
    });
    
    if (earliestMatch && patternIndex !== -1) {
      // Add text before the match
      if (earliestIndex > 0) {
        result.push(remainingText.slice(0, earliestIndex));
      }
      
      // Add the formatted element
      const pattern = patterns[patternIndex];
      const content = earliestMatch[1];
      
      if (pattern.tag === "strong") {
        result.push(
          <strong key={currentKey++} className={pattern.className}>
            {content}
          </strong>
        );
      } else {
        result.push(
          <em key={currentKey++} className={pattern.className}>
            {content}
          </em>
        );
      }
      
      // Continue with remaining text
      remainingText = remainingText.slice(earliestIndex + earliestMatch[0].length);
    } else {
      // No more patterns found, add remaining text
      if (remainingText) {
        result.push(remainingText);
      }
      break;
    }
  }
  
  return result.length > 0 ? result : [text];
}

// Helper function to apply formatting to selected text
export function applyFormatting(
  text: string,
  selectionStart: number,
  selectionEnd: number,
  format: 'bold' | 'italic' | 'bold-italic'
): { newText: string; newCursorPos: number } {
  const selectedText = text.slice(selectionStart, selectionEnd);
  
  let formattedText: string;
  let formatLength: number;
  
  switch (format) {
    case 'bold':
      formattedText = `**${selectedText}**`;
      formatLength = 4; // ** on each side
      break;
    case 'italic':
      formattedText = `*${selectedText}*`;
      formatLength = 2; // * on each side
      break;
    case 'bold-italic':
      formattedText = `***${selectedText}***`;
      formatLength = 6; // *** on each side
      break;
    default:
      return { newText: text, newCursorPos: selectionEnd };
  }
  
  const newText = text.slice(0, selectionStart) + formattedText + text.slice(selectionEnd);
  const newCursorPos = selectionEnd + formatLength;
  
  return { newText, newCursorPos };
}