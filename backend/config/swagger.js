const swaggerJsdoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'FinTracker API',
            version: '1.0.0',
            description: 'API для финансового трекера FinTracker',
            contact: {
                name: 'FinTracker Support'
            }
        },
        servers: [
            {
                url: 'http://localhost:5000/api',
                description: 'Сервер разработки'
            }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT'
                }
            }
        },
        security: [
            {
                bearerAuth: []
            }
        ]
    },
    apis: ['./routes/*.js']
};

module.exports = swaggerJsdoc(options);