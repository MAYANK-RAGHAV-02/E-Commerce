const express = require('express');
const { route } = require('./admin');
const router = express.Router();
const authController = require('../controllers/auth')
const { check, body } = require('express-validator')

router.get('/login', authController.getLogin);

router.get('/signup', authController.getSignup);

router.post('/login', authController.postLogin);

router.post('/signUp', [check('email')
.isEmail()
.withMessage("Please enter a valid email address"),
 body('password', 'Enter a password length more than a 8 character')
 .isLength({ min: 5 })
 .isAlphanumeric(),body('confirm-password').custom((value, {req})=>{
     if(value !== req.body.password){
         throw new Error("Password should have to match")
     }
     return true;
 })],
  authController.postSignup);

router.post('/logout', authController.postLogout);

module.exports = router;