const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const User = require('./models/user');
const app = express();
const session = require('express-session')
const MongoDbStore = require('connect-mongodb-session')(session);
const multer = require('multer')
const MONGODB_URI = 'mongodb+srv://Mayank:E8gnGF79zLQIDvJM@cluster0.rk5n6.mongodb.net/myFirstDatabase';
const flash = require('connect-flash');
const store = new MongoDbStore({
  uri: MONGODB_URI,
  collection: 'sessions'
})

const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'images');
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname)
  }
})
const fileFilter = (req , file , cb)=>{
  if(
    file.mimetype === 'image/png'||
    file.mimetype === 'image/jpg'||
    file.mimetype === 'image/jpeg'
  ){
    cb(null,true)
  }else{
    cb(null, false)
  }
}
app.set('view engine', 'ejs');
app.set('views', 'views');


const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');
const authRoutes = require('./routes/auth');
const errorController = require('./controllers/error');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(multer({ storage: fileStorage, fileFilter: fileFilter }).single('image'))
app.use(express.static(path.join(__dirname, 'public')));
app.use('/images',express.static( path.join(__dirname, 'images')));
app.use(session({ secret: 'my secret', resave: false, saveUninitialized: false, store: store }));
app.use(flash());
app.use((req, res, next) => {
  if (!req.session.user) {
    return next();
  }

  User.findById(req.session.user._id)
    .then(user => {
      req.user = user;
      next();
    })
    .catch(err => {
      console.log(err);
    })
})

// app.use((req, res, next) => {
//   User.findById('614f5534e4db1fa95d996e74')
//     .then(user => {
//       req.user = user;
//       next();
//     })
//     .catch(err => console.log(err));
// });
app.use((req,res,next)=>{
  res.locals.isAuthenticated= req.session.isLoggedIn;
  next()
})
app.use('/admin', adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);

app.use(errorController.get404);

mongoose
  .connect(
    MONGODB_URI
  )
  .then(result => {
    app.listen(3000, () => {
      console.log("connected");
    })
  })
  .catch(err => {
    console.log(err);
  });

