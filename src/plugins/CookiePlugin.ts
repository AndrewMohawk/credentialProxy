import { BaseCredentialPlugin } from './BaseCredentialPlugin';
import { OperationMetadata, RiskAssessment } from './CredentialPlugin';
import { PolicyType } from '../core/policies/policyEngine';
import { logger } from '../utils/logger';
import { OperationResult } from '../types/operation';

interface Cookie {
  name: string;
  value: string;
  domain?: string;
  path?: string;
  expires?: Date | string;
  secure?: boolean;
  httpOnly?: boolean;
  sameSite?: 'Strict' | 'Lax' | 'None';
}

interface CookieCredentialData {
  cookies: Cookie[];
}

export class CookiePlugin extends BaseCredentialPlugin {
  public readonly id = 'cookie-plugin';
  public readonly name = 'Cookie Plugin';
  public readonly description = 'Plugin for managing and using cookie credentials';
  public readonly version = '1.0.0';
  public readonly type = 'cookie';
  
  public readonly credentialSchema = {
    cookies: {
      type: 'array',
      required: true,
      description: 'Array of cookie objects or a string in cookie format'
    }
  };
  
  public readonly riskAssessment: RiskAssessment = {
    baseScore: 6, // Cookies can be high risk as they often contain session data
    contextualFactors: {
      networkRestrictions: true,
      timeRestrictions: true,
      dataAccess: 'read'
    },
    calculateRiskForOperation: (operation: string, context?: any) => {
      if (operation === 'get_cookies') {
        return 4; // Lower risk for read-only operation
      } else if (operation === 'add_cookies_to_request') {
        return 7; // Higher risk as it's being used in a request
      }
      return this.riskAssessment.baseScore;
    }
  };
  
  public readonly supportedOperations: OperationMetadata[] = [
    {
      name: 'get_cookies',
      description: 'Get all cookies in the credential',
      requiredParams: [],
      optionalParams: ['domain', 'path'],
      riskLevel: 4,
      applicablePolicies: [
        PolicyType.ALLOW_LIST,
        PolicyType.TIME_BASED
      ],
      recommendedPolicies: [PolicyType.ALLOW_LIST],
      suggestedRateLimits: {
        perMinute: 10,
        perHour: 100
      }
    },
    {
      name: 'add_cookies_to_request',
      description: 'Add cookies to a request as headers',
      requiredParams: ['headers'],
      optionalParams: ['domain', 'path'],
      riskLevel: 7,
      applicablePolicies: [
        PolicyType.ALLOW_LIST,
        PolicyType.DENY_LIST,
        PolicyType.TIME_BASED,
        PolicyType.COUNT_BASED,
        PolicyType.MANUAL_APPROVAL
      ],
      recommendedPolicies: [
        PolicyType.ALLOW_LIST,
        PolicyType.COUNT_BASED
      ],
      suggestedRateLimits: {
        perMinute: 5,
        perHour: 50,
        perDay: 200
      }
    }
  ];
  
  public readonly supportedPolicies = [
    {
      type: PolicyType.ALLOW_LIST,
      description: 'Allow specific operations with cookies',
      defaultConfig: {
        operations: ['get_cookies', 'add_cookies_to_request']
      }
    },
    {
      type: PolicyType.DENY_LIST,
      description: 'Deny specific operations with cookies',
      defaultConfig: {
        operations: []
      }
    },
    {
      type: PolicyType.TIME_BASED,
      description: 'Allow cookie operations only during specific times',
      defaultConfig: {
        startTime: '09:00',
        endTime: '17:00',
        daysOfWeek: [1, 2, 3, 4, 5] // Monday to Friday
      }
    },
    {
      type: PolicyType.COUNT_BASED,
      description: 'Limit the number of cookie operations in a time period',
      defaultConfig: {
        maxRequests: 50,
        timeWindowMinutes: 60
      }
    },
    {
      type: PolicyType.MANUAL_APPROVAL,
      description: 'Require manual approval for cookie operations',
      defaultConfig: {}
    }
  ];

  /**
   * Parse cookie string into cookie objects
   */
  private parseCookieString(cookieString: string): Cookie[] {
    try {
      const cookies: Cookie[] = [];
      
      // Split multiple cookies if they exist
      const cookieStrings = cookieString.split(/;\s*(?=[^=;]*=)/);
      
      for (const cookieStr of cookieStrings) {
        const parts = cookieStr.split(';');
        const [name, value] = parts[0].split('=').map(p => p.trim());
        
        const cookie: Cookie = { name, value };
        
        // Parse cookie attributes
        for (let i = 1; i < parts.length; i++) {
          const [attrName, attrValue] = parts[i].split('=').map(p => p.trim());
          
          switch (attrName.toLowerCase()) {
            case 'domain':
              cookie.domain = attrValue;
              break;
            case 'path':
              cookie.path = attrValue;
              break;
            case 'expires':
              cookie.expires = attrValue;
              break;
            case 'secure':
              cookie.secure = true;
              break;
            case 'httponly':
              cookie.httpOnly = true;
              break;
            case 'samesite':
              cookie.sameSite = attrValue as 'Strict' | 'Lax' | 'None';
              break;
          }
        }
        
        cookies.push(cookie);
      }
      
      return cookies;
    } catch (error) {
      logger.error(`Error parsing cookie string: ${error}`);
      throw new Error('Invalid cookie format');
    }
  }

  /**
   * Validate the credential data
   */
  public async validateCredential(credentialData: Record<string, any>): Promise<string | null> {
    try {
      if (typeof credentialData === 'string') {
        // If data is a string, try to parse it as a cookie string
        try {
          this.parseCookieString(credentialData);
          return null;
        } catch (error) {
          return 'Invalid cookie format';
        }
      } else if (Array.isArray(credentialData.cookies)) {
        // If data is an object with a cookies array, validate each cookie
        for (const cookie of credentialData.cookies) {
          if (!cookie.name || !cookie.value) {
            return 'All cookies must have a name and value';
          }
        }
        return null;
      }
      
      return 'Invalid credential data format';
    } catch (error: any) {
      logger.error(`Error validating cookie credential: ${error}`);
      return `Validation error: ${error.message}`;
    }
  }

  /**
   * Execute an operation using the credential
   */
  public async executeOperation(
    operation: string,
    parameters: Record<string, any>,
    credentialData: Record<string, any>
  ): Promise<OperationResult> {
    try {
      // Validate operation parameters
      const validationError = this.validateOperationParameters(operation, parameters);
      if (validationError) {
        return {
          success: false,
          error: validationError
        };
      }
      
      let cookies: Cookie[] = [];
      
      // Parse the credential data
      if (typeof credentialData === 'string') {
        cookies = this.parseCookieString(credentialData);
      } else if (credentialData.cookies) {
        cookies = credentialData.cookies;
      }
      
      switch (operation) {
        case 'get_cookies':
          // Return the cookies (with sensitive values masked)
          return {
            success: true,
            data: cookies.map(cookie => ({
              ...cookie,
              value: '********' // Mask the actual value
            }))
          };
          
        case 'add_cookies_to_request':
          // Add cookies to the request headers
          if (!parameters.headers) {
            parameters.headers = {};
          }
          
          // Format cookies for the Cookie header
          const cookieHeader = cookies
            .filter(cookie => {
              // Filter cookies based on domain and path if specified
              if (parameters.domain && cookie.domain && !parameters.domain.endsWith(cookie.domain)) {
                return false;
              }
              if (parameters.path && cookie.path && !parameters.path.startsWith(cookie.path)) {
                return false;
              }
              return true;
            })
            .map(cookie => `${cookie.name}=${cookie.value}`)
            .join('; ');
          
          parameters.headers['Cookie'] = cookieHeader;
          
          return {
            success: true,
            data: {
              headers: parameters.headers
            }
          };
          
        default:
          return {
            success: false,
            error: `Unsupported operation: ${operation}`
          };
      }
    } catch (error: any) {
      logger.error(`Error executing cookie operation: ${error.message}`);
      return {
        success: false,
        error: `Failed to execute operation: ${error.message}`
      };
    }
  }
} 