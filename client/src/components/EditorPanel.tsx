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
  // Add a subtle glow to text
  ".cm-line": {
    textShadow: "0 0 0.5px hsla(var(--editor-text) / 0.1)",
    minHeight: "1.6rem",
    height: "1.6rem",
    paddingTop: "0.15rem",
    paddingBottom: "0.15rem",
    display: "flex",
    alignItems: "center"
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
          // Custom cursor styling
          EditorView.theme({
            ".cm-cursor": {
              borderLeftWidth: "3px",
              borderLeftColor: "hsl(var(--editor-cursor))",
              animation: "blink 1.2s step-end infinite",
              height: "1.6rem !important",
              minHeight: "1.6rem !important",
              boxShadow: "0 0 5px hsla(var(--editor-cursor) / 0.9)",
              position: "absolute",
              background: "hsla(var(--editor-cursor) / 0.15)",
              width: "4px",
              borderTopRightRadius: "2px",
              borderBottomRightRadius: "2px"
            },
            "@keyframes blink": {
              "from, to": { opacity: 1 },
              "50%": { opacity: 0 }
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
            // Custom handling for space key - insert space instead of newline
            { 
              key: "Space", 
              run: (view) => {
                const transaction = view.state.update({
                  changes: {
                    from: view.state.selection.main.from,
                    to: view.state.selection.main.to,
                    insert: " "
                  },
                  selection: { anchor: view.state.selection.main.from + 1 }
                });
                view.dispatch(transaction);
                return true;
              },
              preventDefault: true
            },
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
        // Custom cursor styling
        EditorView.theme({
          ".cm-cursor": {
            borderLeftWidth: "3px",
            borderLeftColor: "hsl(var(--editor-cursor))",
            animation: "blink 1.2s step-end infinite",
            height: "1.6rem !important",
            minHeight: "1.6rem !important",
            boxShadow: "0 0 5px hsla(var(--editor-cursor) / 0.9)",
            position: "absolute",
            background: "hsla(var(--editor-cursor) / 0.15)",
            width: "4px",
            borderTopRightRadius: "2px",
            borderBottomRightRadius: "2px"
          },
          "@keyframes blink": {
            "from, to": { opacity: 1 },
            "50%": { opacity: 0 }
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
