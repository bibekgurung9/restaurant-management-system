import swaggerJSDoc from "swagger-jsdoc";

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Restro Backend API",
      version: "1.0.0",
      description: "Restaurant management system API",
    },
    servers: [
      {
        url: "http://localhost:9000",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },

  // This is where the routes are scanned, if swagger is not working check here for location
  apis: ["./src/modules/**/*.ts", "./src/routes/**/*.ts"],
};

const swaggerSpec = swaggerJSDoc(options);

export default swaggerSpec;