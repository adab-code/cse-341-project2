const router = require('express').Router();
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('../swagger.json');

// Serve the interactive API docs at /api-docs.
// This route is excluded from the generated specification itself.
router.use(
    '/',
    /*
    #swagger.ignore = true
    */
    swaggerUi.serve
);
router.get(
    '/',
    /*
    #swagger.ignore = true
    */
    swaggerUi.setup(swaggerDocument)
);

module.exports = router;
