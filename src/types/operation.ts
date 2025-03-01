/**
 * Result of an operation execution
 */
export interface OperationResult {
  success: boolean;
  data?: any;
  error?: string;
}

/**
 * Metadata about an operation
 */
export interface OperationMetadata {
  name: string;
  description: string;
  requiredParams: string[];
  optionalParams: string[];
} 