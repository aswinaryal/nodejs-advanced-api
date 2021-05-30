const express = require('express');
const { protect, restrictTo } = require('../controllers/authController');
const tourController = require('../controllers/tourController');

const router = express.Router();

router.route('/tour-stats').get(tourController.getTourStats);

router
  .route('/top-4-cheap')
  .get(tourController.aliasTopTours, tourController.getAllTours);

router.route('/monthly-plan/:year').get(tourController.getMonthlyPlan);
router
  .route('/')
  .get(protect, tourController.getAllTours)
  .post(tourController.createTour);
router
  .route('/:id')
  .get(tourController.getTour)
  .patch(tourController.updateTour)
  .delete(
    protect,
    restrictTo('admin', 'lead-guide'),
    tourController.deleteTour
  );

module.exports = router;
