const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const User = require('../models/userModel');
const Weight = require('../models/weightModel');

// Define the isAuthenticated middleware
const isAuthenticated = (req, res, next) => {
    if (req.session && req.session.userId) {
      return next();
    }
    res.redirect('/login'); 
  };

router.get('/dashboard',isAuthenticated, function(req, res) {
    res.render("dashboard", {error:null, success:null});
  });
  
  
router.post('/add', isAuthenticated , async (req, res) => {
    const { weight } = req.body;
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    try {
        // Check if weight entry exists for today
        const existingWeight = await Weight.findOne({ userId: req.session.userId, date: { $gte: todayStart, $lte: todayEnd } });

        if (existingWeight) {
            return res.render('dashboard', { error: 'You can only add one weight per day.' , success:null});
        }

        // Create new weight entry
        const newWeight = new Weight({ userId: req.session.userId, weight });
        await newWeight.save();

        res.render('dashboard', { success: 'Weight added successfully!', error:null });
    } catch (error) {
        console.error('Error adding weight:', error);
        res.render('dashboard', { error: 'Something went wrong. Please try again.', success:null });
    }
});

router.get('/weight_list', isAuthenticated, (req, res) => {
    // Set default page and limit with validation
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 5;

    // Ensure page and limit are positive integers
    if (page < 1 || limit < 1) {
        return res.status(400).send('Page and limit must be positive integers.');
    }

    const options = {
        page,
        limit,
        sort: { date: -1 },
    };

    Weight.paginate({ userId: req.session.userId }, options)
        .then(result => {
            res.render('weight_list', { weights: result.docs, pagination: result });
        })
        .catch(error => {
            console.error(error);
            res.status(500).send('Internal Server Error');
        });
});

router.get('/update_weight/:id', isAuthenticated, (req , res) =>{
  const weightId = req.params.id;
 Weight.findById(weightId).lean().then(weight =>{
      res.render('update',{weight:weight,error: null})
  }).catch(error => {
      console.error(error);
    });
})

router.post('/update_weight/:id', isAuthenticated, (req, res) => {
    const weightId = req.params.id;
    const { weight, date } = req.body;
  
    const tempWeight = new Weight({ weight, date, userId: req.session.userId });
    const validationError = tempWeight.validateSync();
    if (validationError) {
        res.render('update', { weight: tempWeight, error: validationError.errors });
    } else {
        Weight.findByIdAndUpdate(
          weightId,
          { weight, date, userId: req.session.userId }
        )
        .then(() => {
          res.redirect('/weights/weight_list'); 
        })
        .catch(error => {
          console.error(error);
          res.status(500).send('Internal Server Error');
        });
      }
    })

router.get('/delete_weight/:id', isAuthenticated, (req , res) =>{
    const weightId = req.params.id;
   Weight.findById(weightId).lean().then(weight =>{
        res.render('delete',{weight:weight,error: null})
    }).catch(error => {
        console.error(error);
      });
  })

router.post('/delete_weight/:id', isAuthenticated, (req, res) =>{
    const weightId = req.params.id;
    Weight.findByIdAndDelete(weightId)
        .then(() => {
          res.redirect('/weights/weight_list'); // Redirect to the product list after deleting
        })
        .catch(error => {
          console.error(error);
        });
});

router.get('/weight_loss', isAuthenticated, (req, res) => {
    res.render('weight_loss', { error: null });
  });

  const getDayRange = (date) => {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
  
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
  
    return { start, end };
  };
  
  // Route to handle the AJAX request to calculate weight loss
  router.post('/weight_loss', isAuthenticated, async (req, res) => {
    const { startDate, endDate } = req.body;
    const userId = req.session.userId;
  
    try {
      const { start: startDayStart, end: startDayEnd } = getDayRange(startDate);
      const { start: endDayStart, end: endDayEnd } = getDayRange(endDate);
  
      const startWeight = await Weight.findOne({ userId, date: { $gte: startDayStart, $lte: startDayEnd } });
      const endWeight = await Weight.findOne({ userId, date: { $gte: endDayStart, $lte: endDayEnd } });
  
      if (!startWeight || !endWeight) {
        return res.status(400).json({ error: 'Invalid date range or no weight data found for the provided dates.' });
      }
  
      const WeightLoss = startWeight.weight - endWeight.weight;
      const weightLoss = WeightLoss.toFixed(2);
      res.json({ weightLoss });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });
  
  
module.exports = router;