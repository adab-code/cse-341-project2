const express = require('express');
const router = express.Router();

const plantsController = require('../controllers/plants');

router.get('/', (req, res, next) => {
    /*
    #swagger.tags = ['Plants']
    #swagger.summary = 'Get all plants'
    #swagger.description = 'Returns every plant in the plants collection, sorted by name. Optionally filter with category or lightRequirement.'
    #swagger.produces = ['application/json']
    #swagger.parameters['category'] = { in: 'query', description: 'Filter by plant category', required: false, type: 'string', enum: ['Succulent','Tropical','Fern','Orchid','Cactus','Palm','Herb','Other'] }
    #swagger.parameters['lightRequirement'] = { in: 'query', description: 'Filter by light requirement', required: false, type: 'string', enum: ['Low Light','Medium Light','Bright Indirect','Direct Sun'] }
    #swagger.responses[200] = { description: 'OK - Returns an array of plants.', schema: { $ref: '#/definitions/PlantList' } }
    #swagger.responses[500] = { description: 'Internal Server Error' }
    */
    plantsController.getAllPlants(req, res, next);
});

router.get('/:id', (req, res, next) => {
    /*
    #swagger.tags = ['Plants']
    #swagger.summary = 'Get a plant by id'
    #swagger.description = 'Returns a single plant matching the provided id.'
    #swagger.produces = ['application/json']
    #swagger.parameters['id'] = { in: 'path', description: 'MongoDB ObjectId of the plant', required: true, type: 'string' }
    #swagger.responses[200] = { description: 'OK - Returns the requested plant.', schema: { $ref: '#/definitions/Plant' } }
    #swagger.responses[400] = { description: 'Bad Request - The id is not a valid ObjectId.' }
    #swagger.responses[404] = { description: 'Not Found - No plant exists with that id.' }
    #swagger.responses[500] = { description: 'Internal Server Error' }
    */
    plantsController.getPlantById(req, res, next);
});

router.post('/', (req, res, next) => {
    /*
    #swagger.tags = ['Plants']
    #swagger.summary = 'Create a new plant'
    #swagger.description = 'Creates a plant in MongoDB. All nine fields are required. Do not send an _id, MongoDB assigns it.'
    #swagger.consumes = ['application/json']
    #swagger.produces = ['application/json']
    #swagger.parameters['body'] = {
        in: 'body',
        description: 'The plant to create. All nine fields are required.',
        required: true,
        schema: { $ref: '#/definitions/PlantInput' },
        example: {
            name: 'Monstera',
            species: 'Monstera deliciosa',
            category: 'Tropical',
            nickname: 'Delilah',
            location: 'Living room window',
            lightRequirement: 'Bright Indirect',
            wateringIntervalDays: 7,
            acquiredDate: '2024-03-15',
            notes: 'Leaves started splitting after moving it closer to the window.'
        }
    }
    #swagger.responses[201] = { description: 'Created - Returns the id of the newly created plant.', schema: { $ref: '#/definitions/IdResponse' } }
    #swagger.responses[400] = { description: 'Bad Request - One or more fields are missing or invalid.', schema: { $ref: '#/definitions/ValidationError' } }
    #swagger.responses[500] = { description: 'Internal Server Error' }
    */
    plantsController.createPlant(req, res, next);
});

router.put('/:id', (req, res, next) => {
    /*
    #swagger.tags = ['Plants']
    #swagger.summary = 'Update an existing plant'
    #swagger.description = 'Replaces the plant matching the provided id. All nine fields are required because this is a full replacement.'
    #swagger.consumes = ['application/json']
    #swagger.produces = ['application/json']
    #swagger.parameters['id'] = { in: 'path', description: 'MongoDB ObjectId of the plant to update', required: true, type: 'string' }
    #swagger.parameters['body'] = {
        in: 'body',
        description: 'The new values for the plant. All nine fields are required. Do not send an _id.',
        required: true,
        schema: { $ref: '#/definitions/PlantInput' },
        example: {
            name: 'Monstera',
            species: 'Monstera deliciosa',
            category: 'Tropical',
            nickname: 'Delilah',
            location: 'Bedroom',
            lightRequirement: 'Medium Light',
            wateringIntervalDays: 10,
            acquiredDate: '2024-03-15',
            notes: 'Moved away from the draft.'
        }
    }
    #swagger.responses[200] = { description: 'OK - The plant was updated.', schema: { $ref: '#/definitions/MessageResponse' } }
    #swagger.responses[400] = { description: 'Bad Request - Invalid id, or one or more fields are missing or invalid.', schema: { $ref: '#/definitions/ValidationError' } }
    #swagger.responses[404] = { description: 'Not Found - No plant exists with that id.' }
    #swagger.responses[500] = { description: 'Internal Server Error' }
    */
    plantsController.updatePlant(req, res, next);
});

router.delete('/:id', (req, res, next) => {
    /*
    #swagger.tags = ['Plants']
    #swagger.summary = 'Delete a plant'
    #swagger.description = 'Removes the plant matching the provided id. A plant that still has care logs returns 409.'
    #swagger.produces = ['application/json']
    #swagger.parameters['id'] = { in: 'path', description: 'MongoDB ObjectId of the plant to delete', required: true, type: 'string' }
    #swagger.responses[200] = { description: 'OK - The plant was deleted.', schema: { $ref: '#/definitions/MessageResponse' } }
    #swagger.responses[400] = { description: 'Bad Request - The id is not a valid ObjectId.' }
    #swagger.responses[404] = { description: 'Not Found - No plant exists with that id.' }
    #swagger.responses[409] = { description: 'Conflict - The plant still has care logs attached.' }
    #swagger.responses[500] = { description: 'Internal Server Error' }
    */
    plantsController.deletePlant(req, res, next);
});

module.exports = router;
