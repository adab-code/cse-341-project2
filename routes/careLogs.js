const express = require('express');
const router = express.Router();

const careLogsController = require('../controllers/careLogs');
const { requireAuth } = require('../auth/middleware');

router.get('/', (req, res, next) => {
    /*
    #swagger.tags = ['Care Logs']
    #swagger.summary = 'Get all care logs'
    #swagger.description = 'Returns every care log, newest first. Optionally filter by plantId or taskType.'
    #swagger.produces = ['application/json']
    #swagger.parameters['plantId'] = { in: 'query', description: 'Only return care logs for this plant', required: false, type: 'string' }
    #swagger.parameters['taskType'] = { in: 'query', description: 'Filter by task type', required: false, type: 'string', enum: ['Watering','Fertilizing','Repotting','Pruning','Pest Treatment','Repositioning'] }
    #swagger.responses[200] = { description: 'OK - Returns an array of care logs.', schema: { $ref: '#/definitions/CareLogList' } }
    #swagger.responses[400] = { description: 'Bad Request - The plantId query parameter is malformed.' }
    #swagger.responses[500] = { description: 'Internal Server Error' }
    */
    careLogsController.getAllCareLogs(req, res, next);
});

router.get('/:id', (req, res, next) => {
    /*
    #swagger.tags = ['Care Logs']
    #swagger.summary = 'Get a care log by id'
    #swagger.description = 'Returns a single care log matching the provided id.'
    #swagger.produces = ['application/json']
    #swagger.parameters['id'] = { in: 'path', description: 'MongoDB ObjectId of the care log', required: true, type: 'string' }
    #swagger.responses[200] = { description: 'OK - Returns the requested care log.', schema: { $ref: '#/definitions/CareLog' } }
    #swagger.responses[400] = { description: 'Bad Request - The id is not a valid ObjectId.' }
    #swagger.responses[404] = { description: 'Not Found - No care log exists with that id.' }
    #swagger.responses[500] = { description: 'Internal Server Error' }
    */
    careLogsController.getCareLogById(req, res, next);
});

router.post('/', requireAuth, (req, res, next) => {
    /*
    #swagger.tags = ['Care Logs']
    #swagger.summary = 'Create a new care log'
    #swagger.description = 'Creates a care log in MongoDB. All five fields are required and plantId must reference an existing plant. Requires a session, log in with GitHub first.'
    #swagger.consumes = ['application/json']
    #swagger.produces = ['application/json']
    #swagger.security = [{ sessionCookie: [] }]
    #swagger.parameters['body'] = {
        in: 'body',
        description: 'The care log to create. All five fields are required.',
        required: true,
        schema: { $ref: '#/definitions/CareLogInput' },
        example: {
            plantId: '66a1b2c3d4e5f60718293a4b',
            taskType: 'Watering',
            performedDate: '2024-06-01',
            durationMinutes: 12,
            notes: 'Top watered until drainage came out.'
        }
    }
    #swagger.responses[201] = { description: 'Created - Returns the id of the newly created care log.', schema: { $ref: '#/definitions/IdResponse' } }
    #swagger.responses[400] = { description: 'Bad Request - One or more fields are missing or invalid.', schema: { $ref: '#/definitions/ValidationError' } }
    #swagger.responses[401] = { description: 'Unauthorized - There is no active session.', schema: { $ref: '#/definitions/AuthError' } }
    #swagger.responses[404] = { description: 'Not Found - The plantId does not match an existing plant.' }
    #swagger.responses[500] = { description: 'Internal Server Error' }
    */
    careLogsController.createCareLog(req, res, next);
});

router.put('/:id', requireAuth, (req, res, next) => {
    /*
    #swagger.tags = ['Care Logs']
    #swagger.summary = 'Update an existing care log'
    #swagger.description = 'Replaces the care log matching the provided id. All five fields are required because this is a full replacement. Requires a session, log in with GitHub first.'
    #swagger.consumes = ['application/json']
    #swagger.produces = ['application/json']
    #swagger.security = [{ sessionCookie: [] }]
    #swagger.parameters['id'] = { in: 'path', description: 'MongoDB ObjectId of the care log to update', required: true, type: 'string' }
    #swagger.parameters['body'] = {
        in: 'body',
        description: 'The new values for the care log. All five fields are required. Do not send an _id.',
        required: true,
        schema: { $ref: '#/definitions/CareLogInput' },
        example: {
            plantId: '66a1b2c3d4e5f60718293a4b',
            taskType: 'Fertilizing',
            performedDate: '2024-06-03',
            durationMinutes: 8,
            notes: 'Used half strength liquid fertilizer.'
        }
    }
    #swagger.responses[200] = { description: 'OK - The care log was updated.', schema: { $ref: '#/definitions/MessageResponse' } }
    #swagger.responses[400] = { description: 'Bad Request - Invalid id, or one or more fields are missing or invalid.', schema: { $ref: '#/definitions/ValidationError' } }
    #swagger.responses[401] = { description: 'Unauthorized - There is no active session.', schema: { $ref: '#/definitions/AuthError' } }
    #swagger.responses[404] = { description: 'Not Found - No care log exists with that id, or plantId is unknown.' }
    #swagger.responses[500] = { description: 'Internal Server Error' }
    */
    careLogsController.updateCareLog(req, res, next);
});

router.delete('/:id', requireAuth, (req, res, next) => {
    /*
    #swagger.tags = ['Care Logs']
    #swagger.summary = 'Delete a care log'
    #swagger.description = 'Removes the care log matching the provided id. Requires a session, log in with GitHub first.'
    #swagger.produces = ['application/json']
    #swagger.security = [{ sessionCookie: [] }]
    #swagger.parameters['id'] = { in: 'path', description: 'MongoDB ObjectId of the care log to delete', required: true, type: 'string' }
    #swagger.responses[200] = { description: 'OK - The care log was deleted.', schema: { $ref: '#/definitions/MessageResponse' } }
    #swagger.responses[400] = { description: 'Bad Request - The id is not a valid ObjectId.' }
    #swagger.responses[401] = { description: 'Unauthorized - There is no active session.', schema: { $ref: '#/definitions/AuthError' } }
    #swagger.responses[404] = { description: 'Not Found - No care log exists with that id.' }
    #swagger.responses[500] = { description: 'Internal Server Error' }
    */
    careLogsController.deleteCareLog(req, res, next);
});

module.exports = router;
