const router = require('express').Router();
const userController = require('../controllers/user-controller');

router.post('/user', userController.getUser);
router.post('/user', userController.updateUser);
router.post('/user', userController.deleteUser);

module.exports = router;
