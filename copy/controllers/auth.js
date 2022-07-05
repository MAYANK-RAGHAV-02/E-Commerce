const User = require('../models/user');
const bcrypt = require('bcryptjs')
const { validationResult } = require('express-validator')
// const nodemailer = require('nodemailer');
// const sendGridTransport = require('nodemailer-sendgrid-transport');

// const transporter = nodemailer.createTransport(sendGridTransport({
//   auth: {
//     api_key: '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'
//   }
// }));

exports.getLogin = (req, res, next) => {
 let message = req.flash('error')
 if(message.length >0 ){
   message = message;
 }
 else{
   message= null
 }
  res.render('auth/login', {
    path: '/login',
    pageTitle: 'Login',
    errorMessage: message,
    isAuthenticated: false

  });
};

exports.getSignup = (req, res, next) => {
  let message = req.flash('error')
  if(message.length >0 ){
    message = message;
  }
  else{
    message= null
  }
  res.render('auth/signup', {
    path: '/signup',
    pageTitle: 'Signup',
    errorMessage: message,
    isAuthenticated: false,
    oldInput: {
      email: '',
      password: '',
      confirmPassword: ''
    },
    validationErrors: '',
  });
};

exports.postLogin = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  User.findOne({ email: email })
    .then(user => {
      if (!user) {
        req.flash('error', 'Invalid password or Username')
        return res.redirect('/login')
      }
      bcrypt.compare(password, user.password)
        .then(doMatch => {
          if (doMatch) {
            req.session.isLoggedIn = true;
            req.session.user = user;
            return req.session.save(err => {
              console.log(err);
              res.redirect('/');
            });
          }
          req.flash('error', 'Invalid password or Username')
          res.redirect('/login')
        })

    })
    .catch(err => console.log(err));
};

exports.postSignup = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  const confirmPassword = req.body.confirm - password;
  const errors = validationResult(req);
  // console.log("errors.array()[0].msg",errors.array());
  if (!errors.isEmpty()) {
    // console.log(errors.array()[0].msg);
    return res.status(422).render('auth/signup', {
      path: '/signup',
      pageTitle: 'Signup',
      errorMessage: errors.array()[0].msg,
      validationErrors: errors.array(),
      oldInput: {
        email: email,
        password: password,
        confirmPassword: confirmPassword
      },
      isAuthenticated: false,
     
    });
  }

  User.findOne({ email: email })
    .then(userDoc => {
      if (userDoc) {
        req.flash('error', 'Email already registered')
       res.redirect('/signUp')
       return;
      }
      return bcrypt.hash(password, 12)
        .then(hashPassword => {
          const user = new User({
            email: email,
            password: hashPassword,
            cart: { items: [] },
          });
          return user.save()

        })
        .then(result => {
          res.redirect('/login')

        })
        .cart(err => {
          console.log(err);
        })

    })
    .catch(err => {
      console.log(err);
    })
};

exports.postLogout = (req, res, next) => {
  req.session.destroy(err => {
    console.log(err);
    res.redirect('/');
  });
};
