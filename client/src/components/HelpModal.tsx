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
                   text-[hsl(var(--editor-text))] max-w-3xl w-full max-h-[85vh] 
                   overflow-auto rounded-lg shadow-lg"
      >
        <DialogHeader className="sticky top-0 z-10 bg-[hsl(var(--editor-bg))] pb-2 border-b border-[hsl(var(--editor-selection)/0.3)]">
          <div className="flex justify-between items-center">
            <DialogTitle className="text-2xl font-bold text-[hsl(var(--editor-function))]">Calculator Help</DialogTitle>
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
            Documentation for using the scientific calculator
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 mt-4 px-1">
          <div className="bg-[hsl(var(--editor-selection)/0.15)] p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-3 text-[hsl(var(--editor-keyword))]">Basic Operations</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li className="whitespace-normal">Addition: <code className="bg-[hsl(var(--editor-active-line))] px-1.5 py-0.5 rounded">1 + 2</code></li>
              <li className="whitespace-normal">Subtraction: <code className="bg-[hsl(var(--editor-active-line))] px-1.5 py-0.5 rounded">5 - 3</code></li>
              <li className="whitespace-normal">Multiplication: <code className="bg-[hsl(var(--editor-active-line))] px-1.5 py-0.5 rounded">4 * 5</code> or <code className="bg-[hsl(var(--editor-active-line))] px-1.5 py-0.5 rounded">4 × 5</code></li>
              <li className="whitespace-normal">Division: <code className="bg-[hsl(var(--editor-active-line))] px-1.5 py-0.5 rounded">10 / 2</code></li>
              <li className="whitespace-normal">Exponents: <code className="bg-[hsl(var(--editor-active-line))] px-1.5 py-0.5 rounded">2^3</code> or <code className="bg-[hsl(var(--editor-active-line))] px-1.5 py-0.5 rounded">2**3</code></li>
              <li className="whitespace-normal">Parallel Resistors: <code className="bg-[hsl(var(--editor-active-line))] px-1.5 py-0.5 rounded">10 || 20</code> or <code className="bg-[hsl(var(--editor-active-line))] px-1.5 py-0.5 rounded">parallel(10, 20)</code> (calculates 1/(1/10 + 1/20))</li>
            </ul>
          </div>
          
          <div className="bg-[hsl(var(--editor-selection)/0.15)] p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-3 text-[hsl(var(--editor-keyword))]">Mathematical Functions</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li className="whitespace-normal">Trigonometric: <code className="bg-[hsl(var(--editor-active-line))] px-1.5 py-0.5 rounded">sin(45)</code>, <code className="bg-[hsl(var(--editor-active-line))] px-1.5 py-0.5 rounded">cos(60)</code>, <code className="bg-[hsl(var(--editor-active-line))] px-1.5 py-0.5 rounded">tan(30)</code></li>
              <li className="whitespace-normal">Inverse trig: <code className="bg-[hsl(var(--editor-active-line))] px-1.5 py-0.5 rounded">arcsin(0.5)</code>, <code className="bg-[hsl(var(--editor-active-line))] px-1.5 py-0.5 rounded">arccos(0.5)</code>, <code className="bg-[hsl(var(--editor-active-line))] px-1.5 py-0.5 rounded">arctan(1)</code></li>
              <li className="whitespace-normal">Square root: <code className="bg-[hsl(var(--editor-active-line))] px-1.5 py-0.5 rounded">sqrt(16)</code></li>
              <li className="whitespace-normal">Logarithms: <code className="bg-[hsl(var(--editor-active-line))] px-1.5 py-0.5 rounded">log(100)</code>, <code className="bg-[hsl(var(--editor-active-line))] px-1.5 py-0.5 rounded">ln(10)</code></li>
            </ul>
          </div>
          
          <div className="bg-[hsl(var(--editor-selection)/0.15)] p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-3 text-[hsl(var(--editor-keyword))]">Variables</h3>
            <p className="mb-2">Assign variables with <code className="bg-[hsl(var(--editor-active-line))] px-1.5 py-0.5 rounded">=</code> and use them in calculations:</p>
            <pre className="bg-[hsl(var(--editor-bg))] p-3 rounded-md border border-[hsl(var(--editor-selection)/0.3)] overflow-x-auto whitespace-pre-wrap"><code className="text-[hsl(var(--editor-variable))]">x = 10
y = 20
x + y</code></pre>
          </div>
          
          <div className="bg-[hsl(var(--editor-selection)/0.15)] p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-3 text-[hsl(var(--editor-keyword))]">Unit Conversions</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li className="whitespace-normal"><code className="bg-[hsl(var(--editor-active-line))] px-1.5 py-0.5 rounded">5 km to miles</code></li>
              <li className="whitespace-normal"><code className="bg-[hsl(var(--editor-active-line))] px-1.5 py-0.5 rounded">100 kg to lbs</code></li>
              <li className="whitespace-normal"><code className="bg-[hsl(var(--editor-active-line))] px-1.5 py-0.5 rounded">32 °F to °C</code></li>
            </ul>
          </div>
          
          <div className="bg-[hsl(var(--editor-selection)/0.15)] p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-3 text-[hsl(var(--editor-keyword))]">Comments</h3>
            <p className="mb-2">Add comments using <code className="bg-[hsl(var(--editor-active-line))] px-1.5 py-0.5 rounded">//</code>:</p>
            <pre className="bg-[hsl(var(--editor-bg))] p-3 rounded-md border border-[hsl(var(--editor-selection)/0.3)] overflow-x-auto whitespace-pre-wrap"><code><span className="text-[hsl(var(--editor-comment))]">// This is a comment</span>
x = 5 <span className="text-[hsl(var(--editor-comment))]">// This is also a comment</span></code></pre>
          </div>
          
          <div className="bg-[hsl(var(--editor-selection)/0.15)] p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-3 text-[hsl(var(--editor-keyword))]">Engineering Features</h3>
            <p className="mb-3">Use either || symbol or parallel() function for circuit calculations:</p>
            <pre className="bg-[hsl(var(--editor-bg))] p-3 rounded-md border border-[hsl(var(--editor-selection)/0.3)] mb-3 overflow-x-auto whitespace-pre-wrap"><code><span className="text-[hsl(var(--editor-comment))]">// Parallel resistors using || symbol (engineering notation)</span>
<span className="text-[hsl(var(--editor-number))]">10</span> || <span className="text-[hsl(var(--editor-number))]">20</span>           <span className="text-[hsl(var(--editor-comment))]">// Result: 6.667 ohms</span>

<span className="text-[hsl(var(--editor-comment))]">// Or using the parallel() function</span>
<span className="text-[hsl(var(--editor-function))]">parallel</span>(<span className="text-[hsl(var(--editor-number))]">10</span>, <span className="text-[hsl(var(--editor-number))]">20</span>)   <span className="text-[hsl(var(--editor-comment))]">// Same result: 6.667 ohms</span>

<span className="text-[hsl(var(--editor-comment))]">// Works with variables</span>
r1 = <span className="text-[hsl(var(--editor-number))]">100</span>
r2 = <span className="text-[hsl(var(--editor-number))]">200</span>
r1 || r2           <span className="text-[hsl(var(--editor-comment))]">// Result: 66.667 ohms</span>

<span className="text-[hsl(var(--editor-comment))]">// Works with complex numbers (impedance)</span>
z1 = <span className="text-[hsl(var(--editor-number))]">10</span> + <span className="text-[hsl(var(--editor-number))]">5</span>i
z2 = <span className="text-[hsl(var(--editor-number))]">20</span> - <span className="text-[hsl(var(--editor-number))]">10</span>i
z1 || z2           <span className="text-[hsl(var(--editor-comment))]">// Parallel impedance calculation</span></code></pre>
            <p className="text-sm text-[hsl(var(--editor-text)/0.8)]">Both methods calculate <code className="bg-[hsl(var(--editor-active-line))] px-1.5 py-0.5 rounded">1/(1/a + 1/b)</code>, which is the formula for resistors in parallel.</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default HelpModal;
