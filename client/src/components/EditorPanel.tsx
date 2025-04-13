import { useEffect, useRef } from 'react';
import { EditorView, keymap, Decoration, DecorationSet } from '@codemirror/view';
import { EditorState, StateField, StateEffect } from '@codemirror/state';
import { basicSetup } from 'codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { oneDark } from '@codemirror/theme-one-dark';
import { defaultKeymap, history, historyKeymap, undo, redo } from '@codemirror/commands';
import { useTheme } from './ui/theme-provider';

interface EditorPanelProps {
  content: string;
  onChange: (value: string) => void;
  highlightedLine?: number | null;
}

// Define a highlight line effect
const highlightLineEffect = StateEffect.define<number | null>();

// Create a state field for line highlighting
const highlightState = StateField.define<DecorationSet>({
  create: () => Decoration.none,
  update(highlights, tr) {
    highlights = Decoration.none;
    
    for (let effect of tr.effects) {
      if (effect.is(highlightLineEffect) && effect.value !== null) {
        const line = effect.value;
        // Make sure the line exists in the document
        if (line >= 0 && line < tr.state.doc.lines) {
          const lineObj = tr.state.doc.line(line + 1);
          const deco = Decoration.line({
            attributes: { class: "highlighted-line" }
          });
          highlights = highlights.update({
            add: [deco.range(lineObj.from)]
          });
        }
      }
    }
    
    return highlights;
  },
  provide: (field) => EditorView.decorations.from(field)
});

// Enhanced editor theme with better cursor visibility
const editorTheme = EditorView.theme({
  // Base font settings for the editor
  "&": {
    fontFamily: "'Fira Code', 'JetBrains Mono', 'Roboto Mono', monospace",
    fontSize: "15px",
    lineHeight: "1.6",
    letterSpacing: "0.3px"
  },
  
  // Custom high-visibility cursor 
  ".cm-cursor": {
    borderLeftWidth: "2px",
    borderLeftColor: "hsl(var(--editor-cursor))",
    animation: "blink 1.2s step-end infinite",
    height: "1.6rem !important", 
    minHeight: "1.6rem !important",
    boxShadow: "0 0 8px hsla(var(--editor-cursor) / 0.9)",
    position: "absolute",
    background: "hsla(var(--editor-cursor) / 0.25)",
    width: "3px",
    borderTopRightRadius: "2px",
    borderBottomRightRadius: "2px",
    marginLeft: "0",
    zIndex: 10
  },
  
  // Keyframe animation for cursor blinking
  "@keyframes blink": {
    "from, to": { opacity: 1 },
    "50%": { opacity: 0.3 }
  },
  
  // Highlighted line styles
  ".highlighted-line": {
    backgroundColor: "hsla(var(--editor-selection) / 0.5)",
    transition: "background-color 0.2s ease"
  },
  
  // Line styling with empty-line cursor visibility fix using custom content
  ".cm-content": {
    padding: "4px 0",
    caretColor: "hsl(var(--editor-cursor))"
  },
  
  // Line rendering style
  ".cm-line": {
    position: "relative",
    textShadow: "0 0 0.5px hsla(var(--editor-text) / 0.1)",
    minHeight: "1.6rem",
    height: "1.6rem",
    paddingTop: "0.15rem",
    paddingBottom: "0.15rem",
    display: "flex",
    alignItems: "center"
  },
  
  // Gutter and line number styles
  ".cm-gutterElement": {
    color: "hsla(var(--editor-line-num) / 0.8)",
    fontSize: "12px",
    transition: "color 0.2s ease",
    paddingTop: "0.15rem"
  },
  
  // Active line gutter styling
  ".cm-activeLineGutter": {
    backgroundColor: "transparent",
    color: "hsl(var(--editor-text))",
    fontWeight: "bold"
  },
  
  // Active line highlight
  ".cm-activeLine": {
    backgroundColor: "hsla(var(--editor-line) / 0.15)",
    borderRadius: "3px"
  },
  
  // Scrollbar styling
  ".cm-scroller": {
    overflow: "auto",
    scrollbarWidth: "thin",
    scrollbarColor: "hsla(var(--editor-selection)/0.3) transparent"
  }
});

const EditorPanel = ({ content, onChange, highlightedLine }: EditorPanelProps) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const editorViewRef = useRef<EditorView | null>(null);
  const { theme } = useTheme();

  // Set up editor
  useEffect(() => {
    if (!editorRef.current) return;
    
    // Create editor only once
    if (!editorViewRef.current) {
      const startState = EditorState.create({
        doc: content,
        extensions: [
          // Use only specific parts of basicSetup to avoid auto-indent
          EditorState.tabSize.of(2),
          EditorState.allowMultipleSelections.of(true),
          EditorView.lineWrapping,
          javascript(),
          theme === 'dark' ? oneDark : [],
          highlightState,
          editorTheme,
          // Add history support for undo/redo
          history(),
          keymap.of([
            ...defaultKeymap,
            ...historyKeymap,
            // Additional keybindings for undo/redo with higher precedence
            { key: "Mod-z", run: undo, preventDefault: true },
            { key: "Mod-y", run: redo, preventDefault: true },
            { key: "Mod-Shift-z", run: redo, preventDefault: true },
          ]),
          EditorView.updateListener.of((update) => {
            if (update.docChanged) {
              onChange(update.state.doc.toString());
            }
          }),
        ],
      });
      
      editorViewRef.current = new EditorView({
        state: startState,
        parent: editorRef.current,
      });
    }
    
    // Cleanup on unmount
    return () => {
      if (editorViewRef.current) {
        editorViewRef.current.destroy();
        editorViewRef.current = null;
      }
    };
  }, []);
  
  // Update editor theme when theme changes
  useEffect(() => {
    if (!editorViewRef.current) return;
    
    const newState = EditorState.create({
      doc: editorViewRef.current.state.doc,
      extensions: [
        // Use only specific parts of basicSetup to avoid auto-indent
        EditorState.tabSize.of(2),
        EditorState.allowMultipleSelections.of(true),
        EditorView.lineWrapping,
        javascript(),
        theme === 'dark' ? oneDark : [],
        highlightState,
        editorTheme,
        // Add history support for undo/redo
        history(),
        keymap.of([
          ...defaultKeymap,
          ...historyKeymap,
          // Additional keybindings for undo/redo with higher precedence
          { key: "Mod-z", run: undo, preventDefault: true },
          { key: "Mod-y", run: redo, preventDefault: true },
          { key: "Mod-Shift-z", run: redo, preventDefault: true },
        ]),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            onChange(update.state.doc.toString());
          }
        }),
      ],
    });
    
    editorViewRef.current.setState(newState);
  }, [theme]);
  
  // Update editor content if it changes externally
  useEffect(() => {
    if (!editorViewRef.current) return;
    
    const currentContent = editorViewRef.current.state.doc.toString();
    if (content !== currentContent) {
      const transaction = editorViewRef.current.state.update({
        changes: { from: 0, to: currentContent.length, insert: content },
      });
      editorViewRef.current.dispatch(transaction);
    }
  }, [content]);
  
  // Update highlighted line when it changes
  useEffect(() => {
    if (!editorViewRef.current) return;
    
    editorViewRef.current.dispatch({
      effects: highlightLineEffect.of(highlightedLine ?? null)
    });
  }, [highlightedLine]);
  
  return (
    <div className="flex-1 border-r border-gray-700 flex flex-col overflow-hidden">
      <div 
        ref={editorRef} 
        className="editor-container flex-1 overflow-auto p-4 focus:outline-none"
      />
    </div>
  );
};

export default EditorPanel;
