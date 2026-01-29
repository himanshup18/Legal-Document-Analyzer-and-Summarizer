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
            // In a real app, you might want more robust fuzzy matching
            let start = -1;
            let searchIndex = 0;
            
            while ((start = text.indexOf(snippet, searchIndex)) !== -1) {
              callback(start, start + snippet.length);
              searchIndex = start + 1;
            }
          });
        },
        component: (props) => {
          // Find which highlight this corresponds to
          // We can match by text content
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

    const contentState = ContentState.createFromText(content || '');
    setEditorState(EditorState.createWithContent(contentState, compositeDecorator));
  }, [content, highlights, onHighlightClick]);

  return (
    <div className="rich-editor-container" style={{ border: '1px solid #ddd', padding: '10px', borderRadius: '4px', minHeight: '300px', maxHeight: '600px', overflowY: 'auto' }}>
      <Editor
        editorState={editorState}
        onChange={setEditorState}
        readOnly={true} // Read only for now, as we analyze uploaded docs
      />
    </div>
  );
};

export default RichTextEditor;
