import { useEffect, useRef } from 'react';
import { EditorView, keymap, Decoration, DecorationSet, highlightSpecialChars } from '@codemirror/view';
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

// Editor styling themes
const editorTheme = EditorView.theme({
  // Highlighted line background
  ".highlighted-line": {
    backgroundColor: "hsla(var(--editor-selection) / 0.5)",
    transition: "background-color 0.2s ease"
  },
  // Better fonts
  "&": {
    fontFamily: "'Fira Code', 'JetBrains Mono', 'Roboto Mono', monospace",
    fontSize: "15px",
    lineHeight: "1.6",
    letterSpacing: "0.3px"
  },
  // Add a subtle glow to text and show spaces more clearly
  ".cm-line": {
    textShadow: "0 0 0.5px hsla(var(--editor-text) / 0.1)",
    minHeight: "1.6rem",
    height: "1.6rem",
    paddingTop: "0.15rem",
    paddingBottom: "0.15rem",
    display: "flex",
    alignItems: "center",
    whiteSpace: "pre",  // Preserve spaces exactly as typed
  },
  // Make spaces more visible
  ".cm-line span": {
    letterSpacing: "0.5px",  // Add letter-spacing to make spaces more noticeable
    fontVariantLigatures: "none",  // Disable ligatures for better character distinction
  },
  // Add some vibrancy to the line numbers
  ".cm-gutterElement": {
    color: "hsla(var(--editor-line-num) / 0.8)",
    fontSize: "12px",
    transition: "color 0.2s ease",
    paddingTop: "0.15rem"
  },
  ".cm-activeLineGutter": {
    backgroundColor: "transparent",
    color: "hsl(var(--editor-text))",
    fontWeight: "bold"
  },
  // Active line subtle highlight
  ".cm-activeLine": {
    backgroundColor: "hsla(var(--editor-line) / 0.15)"
  },
  // Make content area match the right panel
  ".cm-content": {
    padding: "4px 0"
  },
  // Make scrollbar match design
  ".cm-scroller": {
    overflow: "auto"
  }
});

const EditorPanel = ({ content, onChange, highlightedLine }: EditorPanelProps) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const editorViewRef = useRef<EditorView | null>(null);
  const { theme } = useTheme();

  // Auto-focus effect - runs once on mount
  useEffect(() => {
    // When component mounts, set a very short timeout to focus
    const timer = setTimeout(() => {
      if (editorRef.current) {
        editorRef.current.click();
        editorRef.current.focus();
      }
    }, 10);
    
    return () => clearTimeout(timer);
  }, []);

  // Create space character highlighter
  const showSpaces = highlightSpecialChars({
    render: () => {
      const span = document.createElement("span");
      span.textContent = "·";
      span.style.opacity = "0.6";
      span.style.pointerEvents = "none";
      return span;
    },
    // Using a RegExp instead of a function for type compatibility
    addSpecialChars: /\s/
  });
  
  // Set up editor
  useEffect(() => {
    if (!editorRef.current) return;
    
    // Create editor only once
    if (!editorViewRef.current) {
      const startState = EditorState.create({
        doc: content,
        extensions: [
          // Use more complete basicSetup for better editing capabilities
          basicSetup,
          EditorState.tabSize.of(2),
          EditorState.allowMultipleSelections.of(true),
          EditorView.lineWrapping,
          javascript(),
          theme === 'dark' ? oneDark : [],
          highlightState,
          editorTheme,
          // Show spaces with visible dots
          showSpaces,
          // Custom cursor styling
          EditorView.theme({
            ".cm-cursor": {
              borderLeftWidth: "3px",
              borderLeftColor: "hsl(var(--editor-cursor))",
              animation: "blink 1.2s step-end infinite",
              height: "auto !important",  // let CodeMirror choose
              minHeight: "1.2em",
              boxShadow: "0 0 8px hsla(var(--editor-cursor) / 1), 0 0 15px hsla(var(--editor-cursor) / 0.5)",
              position: "relative",
              width: "4px !important",
              borderTopRightRadius: "2px",
              borderBottomRightRadius: "2px",
              zIndex: "100 !important",
              backgroundColor: "hsla(var(--editor-cursor) / 0.3)",
            },
            // Special background for empty lines
            ".cm-line:empty::before": {
              content: "' '",
              position: "absolute",
              left: 0,
              right: 0,
              top: 0,
              bottom: 0,
              backgroundColor: "hsla(var(--editor-active-line) / 0.25)",
              borderRadius: "2px",
              pointerEvents: "none",
              zIndex: "0"
            },
            "@keyframes blink": {
              "from, to": { opacity: 1 },
              "50%": { opacity: 0.6 }
            }
          }),
          // Add history support for undo/redo
          history(),
          keymap.of([
            ...defaultKeymap,
            ...historyKeymap,
            // Additional keybindings for undo/redo with higher precedence
            { key: "Mod-z", run: undo, preventDefault: true },
            { key: "Mod-y", run: redo, preventDefault: true },
            { key: "Mod-Shift-z", run: redo, preventDefault: true },
            // REMOVED custom space handler - using normal spaces now
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
        // Use more complete basicSetup for better editing capabilities
        basicSetup,
        EditorState.tabSize.of(2),
        EditorState.allowMultipleSelections.of(true),
        EditorView.lineWrapping,
        javascript(),
        theme === 'dark' ? oneDark : [],
        highlightState,
        // Show spaces with visible dots
        showSpaces,
        // Custom cursor styling
        EditorView.theme({
          ".cm-cursor": {
            borderLeftWidth: "3px",
            borderLeftColor: "hsl(var(--editor-cursor))",
            animation: "blink 1.2s step-end infinite",
            height: "auto !important",  // let CodeMirror choose
            minHeight: "1.2em",
            boxShadow: "0 0 8px hsla(var(--editor-cursor) / 1), 0 0 15px hsla(var(--editor-cursor) / 0.5)",
            position: "relative",
            width: "4px !important",
            borderTopRightRadius: "2px",
            borderBottomRightRadius: "2px",
            zIndex: "100 !important",
            backgroundColor: "hsla(var(--editor-cursor) / 0.3)",
          },
          // Special background for empty lines
          ".cm-line:empty::before": {
            content: "' '",
            position: "absolute",
            left: 0,
            right: 0,
            top: 0,
            bottom: 0,
            backgroundColor: "hsla(var(--editor-active-line) / 0.25)",
            borderRadius: "2px",
            pointerEvents: "none",
            zIndex: "0"
          },
          "@keyframes blink": {
            "from, to": { opacity: 1 },
            "50%": { opacity: 0.6 }
          }
        }),
        // Add history support for undo/redo
        history(),
        keymap.of([
          ...defaultKeymap,
          ...historyKeymap,
          // Additional keybindings for undo/redo with higher precedence
          { key: "Mod-z", run: undo, preventDefault: true },
          { key: "Mod-y", run: redo, preventDefault: true },
          { key: "Mod-Shift-z", run: redo, preventDefault: true },
          // REMOVED custom space handler - using normal spaces now
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
    <div className="flex-1 flex flex-col overflow-hidden h-full">
      <div 
        ref={editorRef} 
        className="editor-container flex-1 h-full overflow-auto p-4 focus:outline-none"
      />
    </div>
  );
};

export default EditorPanel;
