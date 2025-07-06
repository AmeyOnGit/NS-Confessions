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
  // Simplified approach to avoid TypeScript issues
  let processedText = text;
  let currentKey = startKey;
  const elements: React.ReactNode[] = [];
  
  // Replace bold+italic first
  processedText = processedText.replace(BOLD_ITALIC_REGEX, (match, content) => {
    elements.push(
      <strong key={currentKey++} className="font-bold italic">
        {content}
      </strong>
    );
    return `__ELEMENT_${elements.length - 1}__`;
  });
  
  // Replace bold
  processedText = processedText.replace(BOLD_REGEX, (match, content) => {
    elements.push(
      <strong key={currentKey++} className="font-bold">
        {content}
      </strong>
    );
    return `__ELEMENT_${elements.length - 1}__`;
  });
  
  // Replace italic
  processedText = processedText.replace(ITALIC_REGEX, (match, content) => {
    elements.push(
      <em key={currentKey++} className="italic">
        {content}
      </em>
    );
    return `__ELEMENT_${elements.length - 1}__`;
  });
  
  // Split and reconstruct
  const parts = processedText.split(/(__ELEMENT_\d+__)/);
  const result: React.ReactNode[] = [];
  
  parts.forEach(part => {
    if (part.startsWith('__ELEMENT_') && part.endsWith('__')) {
      const index = parseInt(part.match(/\d+/)?.[0] || '0');
      if (elements[index]) {
        result.push(elements[index]);
      }
    } else if (part) {
      result.push(part);
    }
  });
  
  return result.length > 0 ? result : [text];
}

// This function is no longer needed with the new rich text editor approach