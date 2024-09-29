const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const User = require('../models/userModel');
const { validationResult } = require('express-validator');
const { validateEmail, validatePassword } = require('./customValidators');


// GET home page
router.get('/', function(req, res, next) {
  res.render('index', { message: null, error: [] });
});

// GET signup page
router.get('/signup', function(req, res, next) {
  res.render('signup', { message: null, errors: [] });
});

// POST route for handling form submission with validations
router.post('/signup', [
  validateEmail,
  validatePassword
], async function(req, res) {
  let errors = validationResult(req).array();
  if (req.validationErrors) {
    errors= errors.concat(req.validationErrors);
  }

  const { username, email, password, confirmPassword } = req.body;

  if (password !== confirmPassword) {
    errors.push({ msg: 'Password and Confirm Password do not match' });
  }

  const newUser = new User({
    username,
    email,
    password
  });

  const syncValidationErrors = newUser.validateSync();
  if (syncValidationErrors) {
    errors.push(...Object.values(syncValidationErrors.errors).map(err => ({ msg: err.message })));
  }

  if (errors.length > 0) {
    return res.render('signup', { message: null, errors:errors });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.render('signup', { message: 'Email already taken', errors: [] });
    }

    // Hash the password using bcrypt
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user
    const signupUser = new User({ username, email, password: hashedPassword });
    await signupUser.save();

    res.redirect('/login'); // Redirect to login page after successful signup
  } catch (error) {
    console.error(error)
    res.render('signup', { message: 'An error occurred during signup', errors: [] });
  }
});

 
router.get('/login', (req, res) => {
  res.render('login',{ errors: [],message:null })
});

router.post('/login', validateEmail, validatePassword, async (req, res) => {
  const { email, password } = req.body;
  const errors = req.validationErrors || [];

  if (errors.length > 0) {
    return res.render('login', { errors:errors });
  }

  else {
    let foundUser;
    User.findOne({ email })
    .then(user => {
      console.log(user)
      if (!user) {
        errors.push( {msg: 'Incorrect Email Address.'});
        return res.render('login',{errors: errors });
      }
      foundUser= user;
      return bcrypt.compare(password, user.password);
    })
    .then(isPasswordValid => {
      if (!isPasswordValid) {
        errors.push( {msg: 'Incorrect Password.'});
        return res.render('login', {errors: errors });
      }

      // Set user's ID and email in the session
      req.session.userId = foundUser._id;
      req.session.userEmail = foundUser.email;
      res.redirect('/weights/dashboard');
    })
    .catch(error => {
      console.error(error);
      res.redirect('/login');
    });
  }
});

router.get('/logout', (req,res)=>{
  req.session.destroy((err) =>{
    if (err){
      console.log(err);
    }else{
      res.redirect('/login')
    }
  });
  });

module.exports = router;
