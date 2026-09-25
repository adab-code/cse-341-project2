const router = require('express').Router();

router.use('/api-docs', require('./swagger'));

router.get('/', (req, res) => {
    /*
    #swagger.tags = ['Home']
    #swagger.summary = 'Welcome message'
    #swagger.description = 'Base route of the Plant Care API. Use /plants and /careLogs for the CRUD endpoints.'
    #swagger.produces['text/plain'] = { example: 'Welcome to the Plant Care API!' }
    #swagger.responses[200] = { description: 'OK - Returns a welcome message.' }
    */
    res.send('Welcome to the Plant Care API!');
});

router.use('/plants', require('./plants'));
router.use('/careLogs', require('./careLogs'));

module.exports = router;
