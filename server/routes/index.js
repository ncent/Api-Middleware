"use strict";

const challengesController = require('../controllers').challenges;
const userAccountsController = require('../controllers').userAccounts;
const jobApplicationsController = require('../controllers').jobApplications;

module.exports = (app) => {
    app.get('/api', (req, res) => res.status(200).send({
        message: 'Welcome to the nCent API Middleware!'
    }));

    //User Routes

    //creates a new user account
    app.post("/api/users", userAccountsController.createUser);

    //retrieves one user account
    app.get("/api/users/:userId", userAccountsController.findOneUser);

    //sends a one-time passcode to the user for login and also creates their account if they do not exist
    app.post("/api/users/verify", userAccountsController.verifyOrCreate);

    //sends a refferal link to the user
    app.patch("/api/users/email", userAccountsController.sendRefferalLinkEmail);

    //logs a user in and begins their session
    app.post("/api/users/login", userAccountsController.loginUser);

    //logs a user out and ends their session
    app.post("/api/users/logout", userAccountsController.logoutUser);

    //resets a user's account details
    app.patch("/api/users/reset", userAccountsController.resetUserAccount);

    //retrieves all challenge balances carried by a particular user
    app.get("/api/users/balances", userAccountsController.findAllBalancesForUser);

    //verifies user session
    app.get("/api/users/session/verify", userAccountsController.verifySession);




    //Challenge Routes

    //creates a new challenge (with the logged in user as the sponsor)
    app.post("/api/challenges", challengesController.createChallenge);

    //retrieves a single challenge by ID
    app.get("/api/challenges/:challengeId/chain", challengesController.findOneChallengeChain);

    //retrieves a single challenge by ID
    app.get("/api/challenges/:challengeId", challengesController.findOneChallenge);

    //finds all challenges stored at the API level
    app.get("/api/challenges", challengesController.findAllChallenges);

    //finds all user account balances for a single given challenge
    app.get("/api/challenges/balances/:challengeId", challengesController.findAllBalancesForChallenge);

    //shares a challenge from one user to another
    app.patch("/api/challenges/share", challengesController.shareChallenge);

    //redeems a challenge for a participant - triggered by the sponsor only
    app.patch("/api/challenges/redeem", challengesController.redeemChallenge);

    //completes a challenge by redeeming for a participant - triggered by the sponsor only
    app.patch("/api/challenges/complete", challengesController.completeChallenge);

    //creates a unique code for a user participating in a challenge
    app.post("/api/challenges/referralCode/:challengeId", challengesController.createReferralCode);

    //retrieve's a user's unique challenge referral code
    app.get("/api/challenges/referralCode/:challengeId", challengesController.retrieveReferralCode);




    //Application routes

    //sending job application from careers page
    app.post("/api/jobApplications", jobApplicationsController.sendJobApplication);


};