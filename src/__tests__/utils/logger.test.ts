import { logger } from '../../utils/logger';
import winston from 'winston';

// Mock winston's createLogger to return a mock logger
jest.mock('winston', () => {
  const mockFormat = {
    combine: jest.fn(),
    timestamp: jest.fn(),
    colorize: jest.fn(),
    printf: jest.fn(),
  };
  
  const mockLogger = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  };
  
  return {
    format: mockFormat,
    createLogger: jest.fn(() => mockLogger),
    addColors: jest.fn(),
    transports: {
      Console: jest.fn(),
      File: jest.fn(),
    },
  };
});

describe('Logger', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should log info messages', () => {
    logger.info('Test info message');
    expect(logger.info).toHaveBeenCalledWith('Test info message');
  });
  
  test('should log warning messages', () => {
    logger.warn('Test warning message');
    expect(logger.warn).toHaveBeenCalledWith('Test warning message');
  });
  
  test('should log error messages', () => {
    logger.error('Test error message');
    expect(logger.error).toHaveBeenCalledWith('Test error message');
  });
  
  test('should log debug messages', () => {
    logger.debug('Test debug message');
    expect(logger.debug).toHaveBeenCalledWith('Test debug message');
  });
}); 