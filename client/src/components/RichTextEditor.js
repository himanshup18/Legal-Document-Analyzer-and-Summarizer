import React, { useState, useEffect } from 'react';
import {
  Editor,
  EditorState,
  ContentState,
  CompositeDecorator
} from 'draft-js';
import 'draft-js/dist/Draft.css';

// Styles for the highlights
const styles = {
  highlight: {
    padding: '2px 0',
    borderRadius: '2px',
    cursor: 'pointer',
    position: 'relative',
    transition: 'background-color 0.2s',
  },
  high: {
    backgroundColor: 'rgba(239, 68, 68, 0.3)',
    borderBottom: '2px solid #ef4444',
  },
  medium: {
    backgroundColor: 'rgba(245, 158, 11, 0.3)',
    borderBottom: '2px solid #f59e0b',
  },
  low: {
    backgroundColor: 'rgba(59, 130, 246, 0.3)',
    borderBottom: '2px solid #3b82f6',
  },
  selected: {
    backgroundColor: 'rgba(255, 255, 0, 0.4)',
    outline: '2px solid rgba(0, 0, 0, 0.2)',
  }
};

const HighlightSpan = (props) => {
  const { severity, isSelected, onClick, note } = props;
  
  const style = {
    ...styles.highlight,
    ...styles[severity || 'medium'],
    ...(isSelected ? styles.selected : {}),
  };

  return (
    <span 
      style={style} 
      onClick={(e) => {
        e.stopPropagation();
        onClick && onClick(props);
      }}
      title={note || "Click to edit note"}
    >
      {props.children}
    </span>
  );
};

const RichTextEditor = ({ content, highlights = [], onHighlightClick }) => {
  const [editorState, setEditorState] = useState(EditorState.createEmpty());

  // Create decorator whenever highlights change
  useEffect(() => {
    const compositeDecorator = new CompositeDecorator([
      {
        strategy: (contentBlock, callback, contentState) => {
          const text = contentBlock.getText();
          if (!text) return;

          highlights.forEach((h, index) => {
            const snippet = h.snippet;
            if (!snippet) return;

            // Simple exact match finding
            let start = -1;
            let searchIndex = 0;
            
            while ((start = text.indexOf(snippet, searchIndex)) !== -1) {
              callback(start, start + snippet.length);
              searchIndex = start + 1;
            }
          });
        },
        component: (props) => {
          const text = props.contentState.getBlockForKey(props.blockKey).getText().slice(props.start, props.end);
          const highlight = highlights.find(h => h.snippet === text);
          
          return (
            <HighlightSpan 
              {...props} 
              severity={highlight?.severity} 
              note={highlight?.note}
              onClick={() => onHighlightClick && highlight && onHighlightClick(highlight)}
            />
          );
        },
      },
    ]);

    // Sanitize content: replace 3+ newlines with 2 to avoid huge gaps
    const cleanContent = (content || '').replace(/\n{3,}/g, '\n\n');
    const contentState = ContentState.createFromText(cleanContent);
    setEditorState(EditorState.createWithContent(contentState, compositeDecorator));
  }, [content, highlights, onHighlightClick]);

  return (
    <div className="rich-editor-container" style={{ 
      border: '1px solid #e0e0e0', 
      padding: '2rem', 
      borderRadius: '8px', 
      minHeight: '400px', 
      maxHeight: '600px', 
      overflowY: 'auto',
      backgroundColor: '#ffffff',
      boxShadow: 'inset 0 1px 4px rgba(0,0,0,0.05), 0 0 0 1px rgba(0,0,0,0.02)',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      fontSize: '0.95rem',
      lineHeight: '1.7',
      color: '#2d3748'
    }}>
      <Editor
        editorState={editorState}
        onChange={setEditorState}
        readOnly={true}
      />
    </div>
  );
};

export default RichTextEditor;
