import React from 'react';

interface PageTitleProps {
  title: string;
  subtitle?: string;
}

export function PageTitle({ title, subtitle }: PageTitleProps) {
  return (
    <div className="space-y-1">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      {subtitle && (
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      )}
    </div>
  );
} 