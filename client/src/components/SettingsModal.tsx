import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { X } from 'lucide-react';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { useState } from 'react';
import { Slider } from './ui/slider';

interface SettingsModalProps {
  onClose: () => void;
  decimalPlaces: number;
  onDecimalPlacesChange: (value: number) => void;
}

const SettingsModal = ({ onClose, decimalPlaces, onDecimalPlacesChange }: SettingsModalProps) => {
  const [localDecimalPlaces, setLocalDecimalPlaces] = useState(decimalPlaces);
  
  const handleSave = () => {
    onDecimalPlacesChange(localDecimalPlaces);
    onClose();
  };
  
  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent 
        className="bg-[hsl(var(--editor-bg))] border-[hsl(var(--editor-selection)/0.3)] 
                  text-[hsl(var(--editor-text))] max-w-md w-full rounded-lg 
                  shadow-lg backdrop-blur-sm"
        aria-describedby="settings-description"
      >
        <DialogHeader className="space-y-1.5">
          <div className="flex justify-between items-center">
            <DialogTitle className="text-2xl font-bold">Slide Settings</DialogTitle>
          </div>
          <DialogDescription className="text-sm text-[hsl(var(--editor-text)/0.7)]">
            Customize your Slide calculator display preferences
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="space-y-3">
            <Label htmlFor="decimal-places" className="font-medium text-base">
              Decimal Places: <span className="font-semibold text-[hsl(var(--editor-result))]">{localDecimalPlaces}</span>
            </Label>
            <div className="flex items-center gap-4 pt-1">
              <Slider
                id="decimal-places"
                min={0}
                max={10}
                step={1}
                value={[localDecimalPlaces]}
                onValueChange={(value) => setLocalDecimalPlaces(value[0])}
                className="flex-1"
              />
              <div className="w-12 h-12 flex items-center justify-center
                            rounded-md border border-[hsl(var(--editor-selection)/0.3)]
                            bg-[hsl(var(--editor-active-line)/0.3)] text-[hsl(var(--editor-result))]
                            text-center text-lg font-semibold">
                {localDecimalPlaces}
              </div>
            </div>
          </div>
          
          <div className="flex justify-end pt-2">
            <Button 
              className="bg-[hsl(var(--editor-result))] hover:bg-[hsl(var(--editor-result)/0.9)] w-24 text-[hsl(var(--editor-bg))]"
              onClick={handleSave}
            >
              Save
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsModal;