const router = require('express').Router();
const userController = require('../controllers/user-controller');

router.get('/user', userController.getUser);
router.put('/user', userController.updateUser);
router.delete('/user', userController.deleteUser);

module.exports = router;
