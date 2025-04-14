import { useTheme } from './ui/theme-provider';
import { MoonIcon, SunIcon, Settings, HelpCircle, Download } from 'lucide-react';
import { Button } from './ui/button';
import slideLogo from '../assets/slide-logo.png';
import { PlatformBadge } from './PlatformSpecific';
import { PlatformSpecific } from './PlatformSpecific';

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
      <div className="flex items-center space-x-2">
        <img src={slideLogo} alt="Slide Logo" className="h-[2.25rem] w-auto" />
        <h1 className="text-xl font-semibold translate-y-[0.5px]">Slide</h1>
        <PlatformBadge />
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
        
        <PlatformSpecific webOnly>
          <Button 
            variant="ghost" 
            size="sm"
            className="text-gray-400 hover:text-[hsl(var(--editor-text))] flex items-center ml-2"
            onClick={() => window.open('https://github.com/user/scientific-calculator/releases', '_blank')}
          >
            <Download className="h-3.5 w-3.5 mr-1" />
            <span className="text-xs">Desktop App</span>
          </Button>
        </PlatformSpecific>
      </div>
    </header>
  );
};

export default CalculatorHeader;
