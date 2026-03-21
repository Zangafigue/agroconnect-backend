const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'AgroConnect BF API',
      version: '1.0.0',
      description: 'API de la plateforme agricole du Burkina Faso - CS27 Groupe 14',
    },
    servers: [
      { url: 'http://localhost:3000', description: 'Développement local' },
      { url: 'https://agroconnect-backend-production.up.railway.app', description: 'Production Railway' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }
      }
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./src/routes/*.js'],
};

module.exports = swaggerJsdoc(options);
