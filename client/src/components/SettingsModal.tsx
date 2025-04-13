import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from './ui/dialog';
import { X } from 'lucide-react';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Input } from './ui/input';
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
      <DialogContent className="bg-[hsl(var(--editor-line))] text-[hsl(var(--editor-text))] max-w-md w-full rounded-md border-[hsl(var(--editor-selection))] shadow-md" aria-describedby="settings-description">
        <DialogHeader className="flex justify-between items-start">
          <DialogTitle className="text-xl font-bold">Settings</DialogTitle>
          <DialogClose asChild>
            <Button variant="ghost" className="text-gray-400 hover:text-[hsl(var(--editor-text))]" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </DialogClose>
        </DialogHeader>
        
        <p id="settings-description" className="sr-only">
          Configure calculator settings such as decimal places.
        </p>
        
        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="decimal-places" className="font-medium">
              Decimal Places: {localDecimalPlaces}
            </Label>
            <div className="flex items-center gap-4">
              <Slider
                id="decimal-places"
                min={0}
                max={10}
                step={1}
                value={[localDecimalPlaces]}
                onValueChange={(value) => setLocalDecimalPlaces(value[0])}
                className="flex-1"
              />
              <Input
                type="number"
                id="decimal-places-input"
                value={localDecimalPlaces}
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  if (!isNaN(value) && value >= 0 && value <= 10) {
                    setLocalDecimalPlaces(value);
                  }
                }}
                className="w-16 text-center bg-[hsl(var(--editor-bg))]"
                min={0}
                max={10}
              />
            </div>
          </div>
          
          <div className="flex justify-end">
            <Button 
              variant="outline" 
              className="bg-[hsl(var(--editor-line))] hover:bg-opacity-80 border-0 mr-2"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button 
              className="bg-[hsl(var(--primary))] hover:bg-opacity-90"
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