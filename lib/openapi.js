/**
 * OpenAPI/Swagger Documentation Generator
 */

export const openAPISpec = {
  openapi: '3.0.0',
  info: {
    title: 'Kulture API',
    version: '1.0.0',
    description: 'Global K-Culture Community Platform API with 200+ language translation support',
    contact: {
      name: 'Kulture Team',
      email: 'api@kulture.com',
    },
  },
  servers: [
    { url: 'https://kulture.com/api', description: 'Production' },
    { url: 'http://localhost:3000/api', description: 'Development' },
  ],
  paths: {
    '/translate': {
      post: {
        summary: 'Translate text',
        tags: ['Translation'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  text: { type: 'string', example: 'Hello, World!' },
                  targetLang: { type: 'string', example: 'ko' },
                  sourceLang: { type: 'string', example: 'en', default: 'auto' },
                  context: { type: 'string' },
                },
                required: ['text', 'targetLang'],
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Successful translation',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    translatedText: { type: 'string' },
                    sourceLang: { type: 'string' },
                    targetLang: { type: 'string' },
                    provider: { type: 'string' },
                    cached: { type: 'boolean' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/translation/detect': {
      post: {
        summary: 'Detect language',
        tags: ['Translation'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  text: { type: 'string' },
                },
                required: ['text'],
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Language detected',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    detectedLanguage: { type: 'string' },
                    confidence: { type: 'number' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/admin/cost-monitor': {
      get: {
        summary: 'Get translation cost statistics',
        tags: ['Admin'],
        security: [{ BearerAuth: [] }],
        responses: {
          200: {
            description: 'Cost statistics',
          },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
      },
    },
  },
};

export default openAPISpec;
