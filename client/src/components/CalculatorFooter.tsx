import { Button } from './ui/button';

interface CalculatorFooterProps {
  variableCount: number;
  angleMode: 'DEG' | 'RAD';
  onClear: () => void;
  onExport: () => void;
}

const CalculatorFooter = ({ variableCount, angleMode, onClear, onExport }: CalculatorFooterProps) => {
  return (
    <footer className="border-t border-gray-700 p-2 flex justify-between items-center text-xs text-gray-500">
      <div>
        <span className="mr-4">Memory: Variable count: {variableCount}</span>
        <span>Angle: {angleMode}</span>
      </div>
      
      <div className="flex items-center">
        <Button 
          variant="outline" 
          size="sm" 
          className="px-2 py-1 bg-[hsl(var(--editor-line))] rounded mr-2 hover:bg-opacity-80 border-0"
          onClick={onClear}
        >
          Clear All
        </Button>
        
        <Button 
          variant="outline" 
          size="sm" 
          className="px-2 py-1 bg-[hsl(var(--editor-line))] rounded hover:bg-opacity-80 border-0"
          onClick={onExport}
        >
          Export
        </Button>
      </div>
    </footer>
  );
};

export default CalculatorFooter;
