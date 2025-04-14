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
    // Start with an empty decoration set
    let decorations = [];
    
    // Check for highlight effects
    for (let effect of tr.effects) {
      if (effect.is(highlightLineEffect)) {
        // If null, don't highlight anything
        if (effect.value === null) {
          return Decoration.none;
        }
        
        // Get the line number (1-based in the UI, but 0-based internally)
        const lineNumber = effect.value;
        
        // Make sure the line exists in the document
        if (lineNumber >= 0 && lineNumber < tr.state.doc.lines) {
          try {
            // Get the line from the doc
            const line = tr.state.doc.line(lineNumber + 1);
            
            // Create a widget that appears behind text but doesn't interfere with clicking
            // This is CRUCIAL - using a widget with no DOM element allows clicks to pass through
            decorations.push(Decoration.widget({
              widget: {
                toDOM() {
                  const span = document.createElement('span');
                  span.className = 'error-line-marker';
                  span.style.display = 'none'; // Make it invisible
                  return span;
                },
                ignoreEvent() { return true; } // Ignore all events
              },
              side: -1
            }).range(line.from));
            
            // Also add a line background decoration 
            decorations.push(Decoration.line({
              attributes: { 
                class: "highlighted-line",
                "data-line-number": String(lineNumber + 1)
              }
            }).range(line.from));
          } catch (e) {
            console.error("Error highlighting line:", e);
          }
        }
      }
    }
    
    return Decoration.set(decorations);
  },
  provide: (field) => EditorView.decorations.from(field)
});

// Editor styling themes
const editorTheme = EditorView.theme({
  // Highlighted line background - ensure it doesn't block pointer events
  ".highlighted-line": {
    backgroundColor: "hsla(var(--editor-selection) / 0.5)",
    transition: "background-color 0.2s ease",
    pointerEvents: "none",
    position: "relative",
    zIndex: "1"
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
    // Removed fixed height to allow content to expand properly
    paddingTop: "0.15rem",
    paddingBottom: "0.15rem", 
    display: "flex",
    alignItems: "center",
    whiteSpace: "pre-wrap",  // Use pre-wrap for better space handling
    cursor: "text",     // Always show text cursor for better UX
    position: "relative",
    zIndex: "5", 
    wordBreak: "normal",
    overflowWrap: "normal"
  },
  // Add a subtle hover effect to make lines more interactive
  ".cm-line:hover": {
    backgroundColor: "hsla(var(--editor-selection) / 0.15)"
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
  // Make content area match the right panel with proper overflow handling
  ".cm-content": {
    padding: "4px 0",
    whiteSpace: "pre-wrap",  // Use pre-wrap to handle spaces better
    wordBreak: "normal",
    overflowWrap: "normal"
  },
  // Make scrollbar match design and handle horizontal overflow
  ".cm-scroller": {
    overflow: "auto",
    overflowX: "auto",
    overflowY: "auto"
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
          // Custom minimal setup with only what we need
          EditorState.tabSize.of(2),
          EditorState.allowMultipleSelections.of(true),
          // Enable line wrapping, but use pre-wrap to handle spaces correctly
          EditorView.lineWrapping,
          // Completely remove language features that might cause auto-brackets/auto-parentheses
          // javascript({ jsx: false }), - removed to prevent auto-parentheses
          // Hide gutters using CSS instead of direct configuration
          EditorView.theme({ 
            ".cm-gutters": { display: "none" },
            ".cm-content": { marginLeft: "4px" }
          }),
          theme === 'dark' ? oneDark : [],
          highlightState,
          editorTheme,
          // Show spaces with visible dots
          showSpaces,
          // Simpler, less glowy cursor with smooth transitions
          EditorView.theme({
            ".cm-cursor": {
              borderLeftWidth: "2px",
              borderLeftColor: "hsl(var(--editor-cursor))",
              animation: "blink 1.2s ease-in-out infinite",
              transition: "left 0.1s ease-out, top 0.1s ease-out",
              height: "auto !important",
              minHeight: "1.2em",
              boxShadow: "0 0 3px hsla(var(--editor-cursor) / 0.4)",
              position: "relative",
              zIndex: "10",
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
              "0%, 100%": { opacity: 1 },
              "50%": { opacity: 0.7 }
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
        // Custom minimal setup with only what we need
        EditorState.tabSize.of(2),
        EditorState.allowMultipleSelections.of(true),
        // Enable line wrapping, but use pre-wrap to handle spaces correctly
        EditorView.lineWrapping,
        // Completely remove language features that might cause auto-brackets/auto-parentheses
        // javascript({ jsx: false }), - removed to prevent auto-parentheses
        // Hide gutters using CSS instead of direct configuration
        EditorView.theme({ 
          ".cm-gutters": { display: "none" },
          ".cm-content": { marginLeft: "4px" }
        }),
        theme === 'dark' ? oneDark : [],
        highlightState,
        // Show spaces with visible dots
        showSpaces,
        // Simpler, less glowy cursor with smooth transitions
        EditorView.theme({
          ".cm-cursor": {
            borderLeftWidth: "2px",
            borderLeftColor: "hsl(var(--editor-cursor))",
            animation: "blink 1.2s ease-in-out infinite",
            transition: "left 0.1s ease-out, top 0.1s ease-out",
            height: "auto !important",
            minHeight: "1.2em",
            boxShadow: "0 0 3px hsla(var(--editor-cursor) / 0.4)",
            position: "relative",
            zIndex: "10",
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
            "0%, 100%": { opacity: 1 },
            "50%": { opacity: 0.7 }
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
