import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { X } from 'lucide-react';
import { Button } from './ui/button';

interface HelpModalProps {
  onClose: () => void;
}

const HelpModal = ({ onClose }: HelpModalProps) => {
  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent 
        className="bg-[hsl(var(--editor-bg))] border-[hsl(var(--editor-selection)/0.3)] 
                  text-[hsl(var(--editor-text))] max-w-2xl w-full max-h-[80vh] 
                  overflow-auto rounded-lg shadow-lg"
      >
        <DialogHeader className="space-y-1.5">
          <div className="flex justify-between items-center">
            <DialogTitle className="text-2xl font-bold">Calculator Help</DialogTitle>
            <Button 
              size="icon" 
              variant="ghost" 
              className="h-8 w-8 rounded-full
                      text-[hsl(var(--editor-text)/0.5)] hover:text-[hsl(var(--editor-text))]
                      hover:bg-[hsl(var(--editor-selection)/0.15)]" 
              onClick={onClose}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          </div>
          <DialogDescription className="text-sm text-[hsl(var(--editor-text)/0.7)]">
            Documentation for using the Bitwise Calculator
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">Basic Operations</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Addition: <code>1 + 2</code></li>
              <li>Subtraction: <code>5 - 3</code></li>
              <li>Multiplication: <code>4 * 5</code> or <code>4 × 5</code></li>
              <li>Division: <code>10 / 2</code></li>
              <li>Exponents: <code>2^3</code> or <code>2**3</code></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-2">Mathematical Functions</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Trigonometric: <code>sin(45)</code>, <code>cos(60)</code>, <code>tan(30)</code></li>
              <li>Inverse trig: <code>arcsin(0.5)</code>, <code>arccos(0.5)</code>, <code>arctan(1)</code></li>
              <li>Square root: <code>sqrt(16)</code></li>
              <li>Logarithms: <code>log(100)</code>, <code>ln(10)</code></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-2">Variables</h3>
            <p>Assign variables with <code>=</code> and use them in calculations:</p>
            <pre className="bg-[hsl(var(--editor-bg))] p-2 rounded"><code>x = 10
y = 20
x + y</code></pre>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-2">Unit Conversions</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li><code>5 km to miles</code></li>
              <li><code>100 kg to lbs</code></li>
              <li><code>32 °F to °C</code></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-2">Comments</h3>
            <p>Add comments using <code>//</code>:</p>
            <pre className="bg-[hsl(var(--editor-bg))] p-2 rounded"><code>// This is a comment
x = 5 // This is also a comment</code></pre>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default HelpModal;
