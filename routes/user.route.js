const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const auth = require('../middleware/auth')

router.post('/login',userController.loginUser);

router.get('/get-users',auth.auth, userController.getUser);

router.post('/register',auth.auth,userController.registerUser);

router.put('/reset-password',userController.updateUserPassword);

router.put('/edit-user/:id',auth.auth,userController.editUser);

router.post('/reset-request',userController.resetRequest);

router.delete('/delete-user/:id',auth.auth,userController.deleteUser);

module.exports = router;
