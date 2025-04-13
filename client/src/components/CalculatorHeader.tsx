import { useTheme } from './ui/theme-provider';
import { MoonIcon, SunIcon, Settings, HelpCircle } from 'lucide-react';
import { Button } from './ui/button';

interface CalculatorHeaderProps {
  angleMode: 'DEG' | 'RAD';
  toggleAngleMode: () => void;
  onShowHelp: () => void;
}

const CalculatorHeader = ({ angleMode, toggleAngleMode, onShowHelp }: CalculatorHeaderProps) => {
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <header className="border-b border-gray-700 flex justify-between items-center p-2">
      <div className="flex items-center">
        <div className="flex space-x-2 mr-4">
          <span className="h-3 w-3 rounded-full bg-red-500"></span>
          <span className="h-3 w-3 rounded-full bg-yellow-500"></span>
          <span className="h-3 w-3 rounded-full bg-green-500"></span>
        </div>
        <h1 className="text-lg font-semibold">Bitwise</h1>
      </div>
      
      <div className="flex items-center space-x-3">
        <Button 
          variant="outline" 
          size="sm"
          className="px-2 py-1 text-xs rounded bg-[hsl(var(--editor-line))] hover:bg-opacity-80 border-0"
          onClick={toggleAngleMode}
        >
          {angleMode}
        </Button>
        
        <Button 
          variant="ghost" 
          size="icon"
          className="text-gray-400 hover:text-[hsl(var(--editor-text))]"
          onClick={toggleTheme}
        >
          {theme === 'dark' ? <SunIcon className="h-4 w-4" /> : <MoonIcon className="h-4 w-4" />}
        </Button>
        
        <Button 
          variant="ghost" 
          size="icon"
          className="text-gray-400 hover:text-[hsl(var(--editor-text))]"
          onClick={onShowHelp}
        >
          <HelpCircle className="h-4 w-4" />
        </Button>
        
        <Button 
          variant="ghost" 
          size="icon"
          className="text-gray-400 hover:text-[hsl(var(--editor-text))]"
        >
          <Settings className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
};

export default CalculatorHeader;
