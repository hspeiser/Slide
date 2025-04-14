import { useTheme } from './ui/theme-provider';
import { MoonIcon, SunIcon, Settings, HelpCircle } from 'lucide-react';
import { Button } from './ui/button';
import bitwiseLogo from '../assets/bitwise-logo.png';

interface CalculatorHeaderProps {
  angleMode: 'DEG' | 'RAD';
  toggleAngleMode: () => void;
  onShowHelp: () => void;
  onShowSettings: () => void;
}

const CalculatorHeader = ({ angleMode, toggleAngleMode, onShowHelp, onShowSettings }: CalculatorHeaderProps) => {
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <header className="border-b border-gray-700 flex justify-between items-center p-3 sticky top-0 bg-[hsl(var(--editor-bg))] z-10">
      <div className="flex items-center space-x-3">
        <img src={bitwiseLogo} alt="Bitwise Logo" className="h-12 w-auto" />
        <h1 className="text-xl font-semibold">Bitwise</h1>
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
          onClick={onShowSettings}
        >
          <Settings className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
};

export default CalculatorHeader;
