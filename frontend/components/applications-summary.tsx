import React from 'react';
import { AppWindow } from 'lucide-react';

export function ApplicationsSummary() {
  return (
    <div className="rounded-lg border border-border bg-card dark:bg-gray-800/80 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-card-foreground dark:text-gray-200">Registered Applications</h3>
          <p className="text-sm text-muted-foreground dark:text-gray-400">Total registered applications</p>
        </div>
        <AppWindow className="h-4 w-4 text-muted-foreground dark:text-gray-400" />
      </div>
      <div className="mt-3">
        <div className="text-2xl font-bold text-card-foreground dark:text-gray-200">18</div>
        <p className="text-sm text-muted-foreground dark:text-gray-400">+2 from last month</p>
      </div>
      <div className="mt-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-card-foreground dark:text-gray-200">Active</span>
          <span className="font-medium text-card-foreground dark:text-gray-200">16</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-card-foreground dark:text-gray-200">Inactive</span>
          <span className="font-medium text-card-foreground dark:text-gray-200">2</span>
        </div>
      </div>
    </div>
  );
}

