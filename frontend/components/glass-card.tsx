import type React from 'react';
import { cn } from '@/lib/utils';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {}

export const GlassCard: React.FC<GlassCardProps> = ({ className, children, ...props }) => {
  return (
    <div
      className={cn(
        'rounded-lg bg-background/60 dark:bg-gray-800/60 backdrop-blur-md',
        'border border-border',
        'shadow-sm hover:shadow-md transition-shadow duration-200',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
};

