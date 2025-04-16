import React from 'react';
import { Button } from './ui/button';
import { Download, Settings, Trash2 } from 'lucide-react';

interface CalculatorFooterProps {
  angleMode: 'DEG' | 'RAD';
  toggleAngleMode: () => void;
  onExport: () => void;
  onShowSettings: () => void;
  onClear: () => void;
  totalLines: number;
}

const CalculatorFooter = ({ 
  angleMode,
  toggleAngleMode,
  onExport,
  onShowSettings,
  onClear,
  totalLines
}: CalculatorFooterProps) => {
  return (
    <footer className="flex-shrink-0 border-t border-gray-700/50 flex justify-between items-center px-3 py-0.5 text-xs text-gray-400">
      <div className="flex items-center space-x-2">
        <button
          onClick={onExport}
          className="flex items-center px-1 py-0 rounded text-gray-400 hover:bg-gray-700/50 hover:text-gray-200 transition-colors duration-150"
        >
          <Download className="h-2.5 w-2.5 mr-1" />
          <span className="text-[10px]">Export</span>
        </button>

        <button
          onClick={onShowSettings}
          className="flex items-center p-0.5 rounded text-gray-400 hover:bg-gray-700/50 hover:text-gray-200 transition-colors duration-150"
        >
          <Settings className="h-3 w-3" />
        </button>

        <button
          onClick={onClear}
          className="flex items-center p-0.5 rounded text-gray-400 hover:bg-red-800/50 hover:text-red-200 transition-colors duration-150"
          title="Clear All"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>

      <div className="flex items-center space-x-2">
        <span className="text-[10px] text-gray-500">Total: {totalLines}</span>

        <button 
          onClick={toggleAngleMode}
          className="px-1 py-0 rounded text-[10px] font-medium 
                    bg-transparent border border-transparent 
                    hover:bg-purple-600/30 hover:text-purple-200 hover:border-purple-600/50 
                    transition-colors duration-150
                    focus:outline-none focus:ring-1 focus:ring-purple-500"
        >
          {angleMode}
        </button>
      </div>
    </footer>
  );
};

export default CalculatorFooter;
