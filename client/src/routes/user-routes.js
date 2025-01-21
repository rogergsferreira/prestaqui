const router = require('express').Router();
const userController = require('../controllers/user-controller');

router.get('/get-users', userController.getUsers);
router.get('/get-user/:id', userController.getUserById);
router.put('/update-user/:id', userController.updateUser);
router.delete('/delete-user/:id', userController.deleteUser);

module.exports = router;
