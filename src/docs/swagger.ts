import swaggerJSDoc from 'swagger-jsdoc';
import { config } from '../config';

/**
 * Swagger definition
 * This defines the structure of the OpenAPI documentation
 */
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Credential Proxy API',
      version: '1.0.0',
      description: 'API documentation for the Credential Proxy service',
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
      contact: {
        name: 'Support',
        url: 'https://github.com/username/credentialProxy',
        email: 'support@example.com',
      },
    },
    servers: [
      {
        url: `http://localhost:${config.app.port}`,
        description: 'Development Server',
      },
      {
        url: 'https://api.credentialproxy.com',
        description: 'Production Server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
        apiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'x-api-key',
        },
      },
      schemas: {
        Credential: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            name: {
              type: 'string',
            },
            type: {
              type: 'string',
              enum: ['API_KEY', 'OAUTH2', 'BASIC_AUTH'],
            },
            credentials: {
              type: 'object',
            },
            description: {
              type: 'string',
            },
            userId: {
              type: 'string',
              format: 'uuid',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            error: {
              type: 'string',
            },
            statusCode: {
              type: 'integer',
            },
          },
        },
        ProxyRequest: {
          type: 'object',
          required: ['credentialId', 'request'],
          properties: {
            credentialId: {
              type: 'string',
              format: 'uuid',
              description: 'ID of the credential to use',
            },
            request: {
              type: 'object',
              required: ['method', 'url'],
              properties: {
                method: {
                  type: 'string',
                  enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'],
                  description: 'HTTP method to use',
                },
                url: {
                  type: 'string',
                  description: 'URL to send the request to',
                },
                headers: {
                  type: 'object',
                  description: 'HTTP headers to send with the request',
                  additionalProperties: {
                    type: 'string',
                  },
                },
                body: {
                  type: 'object',
                  description: 'Request body (for POST, PUT, PATCH)',
                },
                query: {
                  type: 'object',
                  description: 'Query parameters to append to the URL',
                  additionalProperties: {
                    type: 'string',
                  },
                },
              },
            },
            options: {
              type: 'object',
              properties: {
                timeout: {
                  type: 'integer',
                  description: 'Request timeout in milliseconds',
                },
                followRedirects: {
                  type: 'boolean',
                  description: 'Whether to follow redirects',
                },
              },
            },
          },
        },
        ProxyResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
            },
            requestId: {
              type: 'string',
            },
            status: {
              type: 'string',
              enum: ['PROCESSING', 'COMPLETED', 'ERROR', 'DENIED'],
            },
            response: {
              type: 'object',
              properties: {
                statusCode: {
                  type: 'integer',
                },
                headers: {
                  type: 'object',
                  additionalProperties: {
                    type: 'string',
                  },
                },
                body: {
                  type: 'object',
                },
                timing: {
                  type: 'object',
                  properties: {
                    start: {
                      type: 'string',
                      format: 'date-time',
                    },
                    end: {
                      type: 'string',
                      format: 'date-time',
                    },
                    duration: {
                      type: 'number',
                    },
                  },
                },
              },
            },
            error: {
              type: 'string',
            },
          },
        },
      },
      responses: {
        UnauthorizedError: {
          description: 'Authentication information is missing or invalid',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                success: false,
                error: 'Unauthorized',
                statusCode: 401,
              },
            },
          },
        },
        BadRequestError: {
          description: 'Invalid request parameters',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                success: false,
                error: 'Invalid request parameters',
                statusCode: 400,
              },
            },
          },
        },
        NotFoundError: {
          description: 'The specified resource was not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                success: false,
                error: 'Resource not found',
                statusCode: 404,
              },
            },
          },
        },
        ServerError: {
          description: 'Internal server error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                success: false,
                error: 'Internal server error',
                statusCode: 500,
              },
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
    tags: [
      {
        name: 'Auth',
        description: 'Authentication operations',
      },
      {
        name: 'Credentials',
        description: 'Credential management endpoints',
      },
      {
        name: 'Policies',
        description: 'Policy management endpoints',
      },
      {
        name: 'Applications',
        description: 'Application management endpoints',
      },
      {
        name: 'Proxy',
        description: 'Proxy request endpoints',
      },
      {
        name: 'Admin',
        description: 'Administrative endpoints',
      },
    ],
  },
  apis: ['./src/docs/*.docs.ts'],
};

const swaggerSpec = swaggerJSDoc(swaggerOptions);

export default swaggerSpec; 