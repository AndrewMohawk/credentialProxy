/**
 * Utilities for working with IP addresses
 */

import { logger } from './logger';

/**
 * Check if an IP address is within a CIDR range
 * @param ip The IP address to check
 * @param cidr The CIDR range (e.g., "192.168.1.0/24" or single IP "192.168.1.1")
 * @returns True if the IP is in the range, false otherwise
 */
export function isInIPRange(ip: string, cidr: string): boolean {
  try {
    // Simple case: exact IP match
    if (!cidr.includes('/')) {
      return ip === cidr;
    }
    
    // CIDR case
    const [rangeIP, prefixStr] = cidr.split('/');
    const prefix = parseInt(prefixStr, 10);
    
    if (isNaN(prefix) || prefix < 0 || prefix > 32) {
      logger.warn(`Invalid CIDR prefix: ${prefixStr}`);
      return false;
    }
    
    // Convert IPs to numeric form
    const ipNum = ipToLong(ip);
    const rangeIPNum = ipToLong(rangeIP);
    
    if (ipNum === null || rangeIPNum === null) {
      return false;
    }
    
    // Create netmask
    const netmask = prefix === 32 ? 0xffffffff : ~(0xffffffff >>> prefix);
    
    // Check if IPs match within the netmask
    return (ipNum & netmask) === (rangeIPNum & netmask);
  } catch (error) {
    logger.error(`Error checking IP range: ${error}`);
    return false;
  }
}

/**
 * Convert an IP address to its numeric representation
 * @param ip The IP address to convert
 * @returns The numeric representation or null if invalid
 */
function ipToLong(ip: string): number | null {
  try {
    const parts = ip.split('.');
    
    if (parts.length !== 4) {
      logger.warn(`Invalid IP address format: ${ip}`);
      return null;
    }
    
    const octets = parts.map(part => parseInt(part, 10));
    
    for (const octet of octets) {
      if (isNaN(octet) || octet < 0 || octet > 255) {
        logger.warn(`Invalid IP address octet: ${ip}`);
        return null;
      }
    }
    
    return ((octets[0] << 24) >>> 0) +
      ((octets[1] << 16) >>> 0) +
      ((octets[2] << 8) >>> 0) +
      octets[3];
  } catch (error) {
    logger.error(`Error converting IP to numeric form: ${error}`);
    return null;
  }
} 