import { useEffect, useRef } from "react";
import {
  EditorView,
  keymap,
  Decoration,
  DecorationSet,
  highlightSpecialChars,
  ViewUpdate,
} from "@codemirror/view";
import { EditorState, StateField, StateEffect } from "@codemirror/state";
import { basicSetup } from "codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { oneDark } from "@codemirror/theme-one-dark";
import {
  defaultKeymap,
  history,
  historyKeymap,
  undo,
  redo,
} from "@codemirror/commands";
import { useTheme } from "./ui/theme-provider";

// Type for wrap information (line index -> number of visual lines)
export interface LineWrapInfo {
  [lineIndex: number]: number;
}

interface EditorPanelProps {
  content: string;
  onChange: (value: string) => void;
  highlightedLine?: number | null;
  onWrapInfoChange: (wrapInfo: LineWrapInfo) => void;
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

          // Use a line background decoration instead of a line decoration
          // This allows clicking anywhere on the line to position the cursor
          const deco = Decoration.line({
            attributes: { class: "highlighted-line" },
            // Important: Set this to false to allow clicks to pass through to the editor
            inclusive: false,
          });

          highlights = highlights.update({
            add: [deco.range(lineObj.from)],
          });
        }
      }
    }

    return highlights;
  },
  provide: (field) => EditorView.decorations.from(field),
});

// Editor styling themes
const editorTheme = EditorView.theme({
  // Highlighted line background - ensure it doesn't block pointer events
  ".highlighted-line": {
    backgroundColor: "hsla(var(--editor-selection) / 0.5)",
    transition: "background-color 0.2s ease",
    pointerEvents: "none",
    position: "relative",
    zIndex: "1",
  },
  // Better fonts
  "&": {
    fontFamily: "'Fira Code', 'JetBrains Mono', 'Roboto Mono', monospace",
    fontSize: "15px",
    lineHeight: "1.6",
    letterSpacing: "0.3px",
  },
  // Add a subtle glow to text
  // NOTE: Don't use flex or margins on lines - CodeMirror needs precise height measurements
  ".cm-line": {
    textShadow: "0 0 0.5px hsla(var(--editor-text) / 0.1)",
    minHeight: "1.6rem",
    paddingTop: "0.15rem",
    paddingBottom: "0.15rem",
    cursor: "text", // Always show text cursor for better UX
    position: "relative",
    zIndex: "5",
  },
  // Add a subtle hover effect to make lines more interactive
  ".cm-line:hover": {
    backgroundColor: "hsla(var(--editor-selection) / 0.15)",
  },
  // Make spaces more visible
  ".cm-line span": {
    letterSpacing: "0.5px", // Add letter-spacing to make spaces more noticeable
    fontVariantLigatures: "none", // Disable ligatures for better character distinction
  },
  // Add some vibrancy to the line numbers
  ".cm-gutterElement": {
    color: "hsla(var(--editor-line-num) / 0.8)",
    fontSize: "12px",
    transition: "color 0.2s ease",
    paddingTop: "0.15rem",
  },
  ".cm-activeLineGutter": {
    backgroundColor: "transparent",
    color: "hsl(var(--editor-text))",
    fontWeight: "bold",
  },
  // Active line subtle highlight
  ".cm-activeLine": {
    backgroundColor: "hsla(var(--editor-line) / 0.15)",
  },
  // Make content area match the right panel with proper overflow handling
  ".cm-content": {
    padding: "4px 0",
    // Let CodeMirror handle its own whitespace - don't override
  },
  // Make scrollbar match design and handle horizontal overflow
  ".cm-scroller": {
    overflow: "auto",
    overflowX: "auto",
    overflowY: "auto",
  },

  // --- ADD CURSOR STYLES HERE ---
  ".cm-cursor": {
    borderLeftWidth: "4px", // Increased thickness further
    borderLeftColor: "hsl(var(--editor-cursor))",
    animation: "blink 1.1s cubic-bezier(0.5, 0, 0.5, 1) infinite",
    transition: "left 0.1s ease-out, top 0.1s ease-out",
    height: "1.8em !important", // Increased height further
    minHeight: "1.8em !important",
    boxShadow: "0 0 5px hsla(var(--editor-cursor) / 0.6)", // Slightly stronger shadow
    position: "relative",
    zIndex: "10",
  },
  // Special background for empty lines (can stay here or move, placement less critical)
  ".cm-line:empty::before": {
      content: "' '",
      position: "absolute",
      left: 0, right: 0, top: 0, bottom: 0,
      backgroundColor: "hsla(var(--editor-active-line) / 0.25)",
      borderRadius: "2px",
      pointerEvents: "none",
      zIndex: "0",
  },
  "@keyframes blink": {
    "0%, 100%": { opacity: 1 },
    "50%": { opacity: 0.7 },
  },
  // --- END CURSOR STYLES ---
});

const EditorPanel = ({
  content,
  onChange,
  highlightedLine,
  onWrapInfoChange,
}: EditorPanelProps) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const editorViewRef = useRef<EditorView | null>(null);
  const { theme } = useTheme();
  const lastReportedWrapInfo = useRef<LineWrapInfo>({});

  // Function to measure and report line heights/wraps
  const measureAndReportLineHeights = (view: EditorView) => {
    const wrapInfo: LineWrapInfo = {};
    let changed = false;
    const currentLines = view.state.doc.lines;

    if (currentLines === 0) {
        if (Object.keys(lastReportedWrapInfo.current).length !== 0) {
            changed = true; // Changed if previously had info but now empty
        } else {
             return; // No lines and no previous info, nothing to do
        }
    }
    else {
        const defaultLineHeight = view.defaultLineHeight;
        if (defaultLineHeight <= 0) return; // Avoid division by zero if editor not ready

        for (let i = 1; i <= currentLines; i++) {
          try {
            const lineBlock = view.lineBlockAt(view.state.doc.line(i).from);
            // Calculate visual lines, ensuring at least 1
            const visualLines = Math.max(1, Math.round(lineBlock.height / defaultLineHeight));
            wrapInfo[i - 1] = visualLines; // Store 0-indexed
            if (lastReportedWrapInfo.current[i - 1] !== visualLines) {
              changed = true;
            }
          } catch (e) {
            // Ignore errors if lineBlockAt fails transiently
            // console.warn(`Error getting line block for line ${i}:`, e);
            wrapInfo[i - 1] = 1; // Default to 1 line on error
             if (lastReportedWrapInfo.current[i - 1] !== 1) {
               changed = true;
             }
          }
        }
        // Check if the number of lines changed
        if (Object.keys(lastReportedWrapInfo.current).length !== currentLines) {
          changed = true;
        }
    }


    if (changed) {
    //   console.log("Reporting wrap info:", wrapInfo); // Debugging
      onWrapInfoChange(wrapInfo);
      lastReportedWrapInfo.current = wrapInfo; // Update cache
    }
  };

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
  // Only highlight non-breaking spaces and tabs (default behavior)
  // This avoids creating extra DOM nodes for every normal space
  const showSpaces = highlightSpecialChars();

  // Set up editor
  useEffect(() => {
    if (!editorRef.current) return;

    if (!editorViewRef.current) {
      const startState = EditorState.create({
        doc: content,
        extensions: [
          // Custom minimal setup with only what we need
          EditorState.tabSize.of(2),
          EditorState.allowMultipleSelections.of(true),
          // Enable line wrapping with default space handling
          EditorView.lineWrapping,
          // Keep auto-brackets for parentheses but disable most other auto features
          javascript({ jsx: false }),
          // Hide gutters using CSS instead of direct configuration
          EditorView.theme({
            ".cm-gutters": { display: "none" },
            ".cm-content": { marginLeft: "4px" },
          }),
          theme === "dark" ? oneDark : [],
          highlightState,
          editorTheme,
          // Show spaces with visible dots
          showSpaces,
          history(),
          keymap.of([
            ...defaultKeymap,
            ...historyKeymap,
            // Additional keybindings for undo/redo with higher precedence
            { key: "Mod-z", run: undo, preventDefault: true },
            { key: "Mod-y", run: redo, preventDefault: true },
            { key: "Mod-Shift-z", run: redo, preventDefault: true },
            // No custom space handler needed - CodeMirror's default works correctly
          ]),
          EditorView.updateListener.of((update: ViewUpdate) => {
            if (update.docChanged) {
              onChange(update.state.doc.toString());
            }
            
            // Measure and report heights if doc, geometry, or viewport changed
            if (update.docChanged || update.geometryChanged || update.viewportChanged) {
              measureAndReportLineHeights(update.view);
            }
          }),
        ],
      });

      editorViewRef.current = new EditorView({
        state: startState,
        parent: editorRef.current,
      });

      // Initial measurement after editor is created
      requestAnimationFrame(() => {
          if (editorViewRef.current) {
            measureAndReportLineHeights(editorViewRef.current);
          }
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
    // This effect RECREATES the state. It MUST include editorTheme
    // which now correctly contains the cursor styles.
    const newState = EditorState.create({
      doc: editorViewRef.current.state.doc,
      extensions: [
        // ... (Copy ALL necessary extensions from the initial setup here)
        EditorState.tabSize.of(2),
        EditorState.allowMultipleSelections.of(true),
        EditorView.lineWrapping,
        javascript({ jsx: false }),
        EditorView.theme({ ".cm-gutters": { display: "none" }, ".cm-content": { marginLeft: "4px" } }),
        theme === "dark" ? oneDark : [], // Apply correct theme
        highlightState,
        editorTheme, // Apply the main theme (contains cursor styles)
        showSpaces,
        history(),
        keymap.of([ ...defaultKeymap, ...historyKeymap, { key: "Mod-z", run: undo, preventDefault: true }, { key: "Mod-y", run: redo, preventDefault: true }, { key: "Mod-Shift-z", run: redo, preventDefault: true } ]), 
        EditorView.updateListener.of((update: ViewUpdate) => { 
            if (update.docChanged) { onChange(update.state.doc.toString()); } 
            if (update.docChanged || update.geometryChanged || update.viewportChanged) { measureAndReportLineHeights(update.view); } 
        }),
      ],
    });
    editorViewRef.current.setState(newState);
  }, [theme]); // This was the culprit - theme change overwrote styles!

  // Update editor content if it changes externally
  useEffect(() => {
    if (!editorViewRef.current) return;

    const currentContent = editorViewRef.current.state.doc.toString();
    if (content !== currentContent) {
      const transaction = editorViewRef.current.state.update({
        changes: { from: 0, to: currentContent.length, insert: content },
      });
      editorViewRef.current.dispatch(transaction);
      // Trigger measurement after external update
      requestAnimationFrame(() => {
        if (editorViewRef.current) {
          measureAndReportLineHeights(editorViewRef.current);
        }
      });
    }
  }, [content]);

  // Update highlighted line when it changes
  useEffect(() => {
    if (!editorViewRef.current) return;

    editorViewRef.current.dispatch({
      effects: highlightLineEffect.of(highlightedLine ?? null),
    });
  }, [highlightedLine]);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <div
        ref={editorRef}
        className="editor-container flex-1 h-full overflow-auto p-4 focus:outline-none"
        style={{ pointerEvents: 'auto' }}
      />
    </div>
  );
};

export default EditorPanel;
