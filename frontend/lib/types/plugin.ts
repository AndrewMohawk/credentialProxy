/**
 * Plugin type definitions
 */

export interface Plugin {
  id: string;
  name: string;
  type?: string;
  description?: string;
  version?: string;
  enabled?: boolean;
  isActive?: boolean;
  configData?: any;
  lastUsedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
} 