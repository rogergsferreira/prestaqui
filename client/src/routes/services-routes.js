const router = require('express').Router();
const servicesController = require('../controllers/services-controller');

router.get('/get-services/:customer_id', servicesController.getServicesByCustomerId);
router.delete('/delete-service/:id', servicesController.deleteServiceById);

module.exports = router;