const express = require('express');
const router = express.Router();
const RewardsController = require('../controllers/Rewards');
const util = require('../utils/utils');

router
    .get('/all', util.authenticate.adminAuthenticate, RewardsController.getAllRewards)
    .get('/milestones', util.authenticate.adminAuthenticate, RewardsController.getMilestoneConfig)
    .get('/config', util.authenticate.adminAuthenticate, RewardsController.getMilestoneConfig)
    .get('/userprogress', util.authenticate.adminAuthenticate, RewardsController.getUserProgress)
    .post('/create', util.authenticate.adminAuthenticate, RewardsController.createReward)
    .post('/update', util.authenticate.adminAuthenticate, RewardsController.updateReward)
    .put('/:id', util.authenticate.adminAuthenticate, RewardsController.updateReward)
    .post('/delete', util.authenticate.adminAuthenticate, RewardsController.deleteReward)
    .delete('/:id', util.authenticate.adminAuthenticate, RewardsController.deleteReward);

router.get('/myMilestones', util.authenticate.userAuthenticate, RewardsController.getMyMilestones);
router.get('/myRewards', util.authenticate.userAuthenticate, RewardsController.getMyMilestones);

module.exports = router;
