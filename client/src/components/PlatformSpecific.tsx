import React from 'react';
import usePlatform from '@/hooks/use-platform';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface PlatformSpecificProps {
  children?: React.ReactNode;
  webOnly?: boolean;
  electronOnly?: boolean;
}

/**
 * Component that renders content based on the current platform (web or Electron)
 */
export const PlatformSpecific: React.FC<PlatformSpecificProps> = ({
  children,
  webOnly = false,
  electronOnly = false,
}) => {
  const { isElectron, isWeb } = usePlatform();

  // If component should only show on web and we're not on web, don't render
  if (webOnly && !isWeb) return null;
  
  // If component should only show on electron and we're not on electron, don't render
  if (electronOnly && !isElectron) return null;
  
  // Otherwise render the children
  return <>{children}</>;
};

/**
 * Component that displays the current platform as a badge
 */
export const PlatformBadge: React.FC = () => {
  const { platformType } = usePlatform();
  
  return (
    <Badge variant="outline" className="ml-2">
      {platformType === 'electron' ? 'Desktop App' : 'Web App'}
    </Badge>
  );
};

export default PlatformSpecific;