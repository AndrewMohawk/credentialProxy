/**
 * Credential type definitions
 */

export interface Credential {
  id: string;
  name: string;
  type?: string;
  description?: string;
  isActive?: boolean;
  data?: any;
  isEnabled?: boolean;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
} 