import { useEffect, useRef } from 'react';
import { EditorView, basicSetup } from 'codemirror';
import { EditorState } from '@codemirror/state';
import { javascript } from '@codemirror/lang-javascript';
import { oneDark } from '@codemirror/theme-one-dark';
import { keymap } from '@codemirror/view';
import { defaultKeymap } from '@codemirror/commands';
import { useTheme } from './ui/theme-provider';

interface EditorPanelProps {
  content: string;
  onChange: (value: string) => void;
}

const EditorPanel = ({ content, onChange }: EditorPanelProps) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const editorViewRef = useRef<EditorView | null>(null);
  const { theme } = useTheme();

  useEffect(() => {
    if (!editorRef.current) return;
    
    // Create editor only once
    if (!editorViewRef.current) {
      const startState = EditorState.create({
        doc: content,
        extensions: [
          basicSetup,
          javascript(),
          theme === 'dark' ? oneDark : [],
          EditorView.updateListener.of((update) => {
            if (update.docChanged) {
              onChange(update.state.doc.toString());
            }
          }),
          keymap.of(defaultKeymap),
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
        basicSetup,
        javascript(),
        theme === 'dark' ? oneDark : [],
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            onChange(update.state.doc.toString());
          }
        }),
        keymap.of(defaultKeymap),
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
