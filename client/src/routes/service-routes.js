const router = require('express').Router();
const serviceController = require('../controllers/service-controller');

router.get('/get-services/:customer_id', serviceController.getServicesByCustomerId);
router.delete('/delete-service/:id', serviceController.deleteServiceById);

module.exports = router;