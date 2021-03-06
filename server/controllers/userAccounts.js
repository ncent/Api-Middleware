"use strict";

const UserAccount = require('../models').UserAccount;
const awsEmail = require("../helpers/awsEmail.js");
const bcrypt = require("bcrypt");
const otplib = require("otplib");
const apiEndpoint = process.env.API;
const axios = require("axios");
const axiosRetry = require("axios-retry");
const authHelper = require("../helpers/authHelper.js");
const emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
axiosRetry(axios, { retries: 3, retryDelay: axiosRetry.exponentialDelay });

async function verifyOrCreateHelper(user, res, email) {
    // const otpKey = otplib.authenticator.generateSecret();
    // const token = otplib.authenticator.generate(otpKey);
    // const otpExp = Date.now() + 300000;
    // const salt = bcrypt.genSaltSync();
    // const tokenHash = bcrypt.hashSync(token, salt);
    //
    // await user.updateAttributes({
    //     otpKey: tokenHash,
    //     otpExp: otpExp
    // });
    //
    // let response = await awsEmail.sendOTP(email, token);
    return res.status(200).send(user);
}

module.exports = {
    async sendRefferalLinkEmail(req, res) {
        console.log("\n\n\nhit sendRefferalLinkEmail in userAccounts.js in api\n\n\n");
        const { email, shortUrl } = req.body;
        let response = await awsEmail.sendRefferalLinkEmail(email, shortUrl);
        return res.status(200).send(eq.session.user);
    },
    async createUser(req, res) {
        console.log("\n\n\nhit createUser in userAccounts.js in api\n\n\n");
        const { email, firstname, lastname } = req.body;
        const createUserResponse = await axios.post(`${apiEndpoint}/user`, {
            email,
            firstname,
            lastname
        });

        const newUser = createUserResponse.data;
        await UserAccount.create({
            apiId: newUser.value.id,
            apiKey: newUser.value.apiCreds.apiKey,
            email: email,
            secretKey: newUser.secretKey,
            publicKey: newUser.value.cryptoKeyPair.publicKey,
            privateKey: newUser.privateKey,
            active: false
        });

        return res.status(createUserResponse.status).send(newUser.value);
    },

    async findOneUser(req, res) {
        console.log("\n\n\nhit findOneUser in userAccounts.js in api\n\n\n");
        const apiId = req.params.userId;
        const user = UserAccount.findOne({ where: { apiId } });

        if (!user) {
            return res.status(404).send({ error: "UserAccount not found." });
        }

        // const caller = await authHelper.findApiCaller(req.session.user.id);
        const caller = await authHelper.findApiCaller(180);
        if (!caller) {
            return res.status(caller.status).send({ error: caller.error });
        }

        const findOneUserResp = await axios.get(`${apiEndpoint}/user?userId=${apiId}&id=${apiId}`, {
            headers: {
                'Authorization': authHelper.getAuthString(caller.apiKey, caller.secretKey)
            }
        });

        return res.status(findOneUserResp.status).send(findOneUserResp.data);
    },

    async loginUser(req, res) {
        const apiId = req.params.userId;
        const confirmationCode = req.body.code;

        console.log("\n\n\nloginUser in userAccounts in api", apiId, confirmationCode, "\n\n\n");

        const user = await UserAccount.findOne({ where: { apiId } });

        if (!user) {
            return res.status(404).send({ error: "User not found." });
        }

        const expired = Date.now() > user.otpExp;
        const validCode = bcrypt.compareSync(confirmationCode, user.otpKey) && !expired;

        const findUserResp = await axios.get(`${apiEndpoint}/user?userId=${apiId}&id=${apiId}`, {
            headers: {
                'Authorization': authHelper.getAuthString(user.apiKey, user.secretKey)
            }
        });

        if (validCode) {
            await user.updateAttributes({ active: true });
            req.session.user = findUserResp.data;
            return res.status(200).send(user);
        }

        return res.status(403).send({ error: "Invalid code.\nYou can request another code if you like." });
    },

    async logoutUser(req, res) {
        console.log("\n\n\nhit logoutUser in userAccounts.js in api\n\n\n");
        console.log(req);
        if (req.session.user && req.cookies.session_token) {
            const user = await UserAccount.find({ where: { apiId: req.session.user.apiId } });
            await user.updateAttributes({ active: false });
            res.clearCookie("session_token");
            req.session.destroy();
            res.status(200).send({ message: "Logged out successfully." });
        } else {
            res.status(403).send({ error: "No user session detected." });
        }
    },

    async resetUserAccount(req, res) {
        console.log("\n\n\nhit resetUserAccount in userAccounts.js in api\n\n\n");

    },

    async findAllBalancesForUser(req, res) {
        console.log("\n\n\nhit findAllBalancesForUser in userAccounts.js in api\n\n\n");
        // const caller = await authHelper.findApiCaller(req.session.user.id);
        const caller = await authHelper.findApiCaller(180);
        if (!caller) {
            return res.status(caller.status).send({ error: caller.error });
        }

        const findAllBalancesForUserResp = await axios.get(`${apiEndpoint}/user/balances?userId=${req.session.user.id}`, {
            headers: {
                'Authorization': authHelper.getAuthString(caller.apiKey, caller.secretKey)
            }
        });

        return res.status(findAllBalancesForUserResp.status).send(findAllBalancesForUserResp.data);
    },

    async verifyOrCreate(req, res) {
        let user;
        const { email, firstname, lastname } = req.body;
        if(!emailRegex.test(String(email).toLowerCase())) {
            return res.status(400).send(user);
        }
        // const createUserResponse = await axios.post(`${apiEndpoint}/user`, {
        //         email,
        //         firstname,
        //         lastname
        //     }
        // );
        console.log("verifyOrCreate in userAccounts.js api", email, firstname, lastname);
        axios.post(`${apiEndpoint}/user`, { email, firstname, lastname })
            .then(async response => {
                // console.log("\n\n\n.then in post", response);
                console.log("\n\n\nif case scenario in userAccounts, verifyOrCreate, api\n\n\n");
                const newUser = response.data;
                user = await UserAccount.create({
                    apiId: newUser.value.id,
                    apiKey: newUser.value.apiCreds.apiKey,
                    email: email,
                    secretKey: newUser.secretKey,
                    publicKey: newUser.value.cryptoKeyPair.publicKey,
                    privateKey: newUser.privateKey,
                    active: true
                });
                req.session.user = user;
                return res.status(200).send(user);
            })
            .catch(async err => {
                // console.log("\n\n\n.catch in post", err);
                console.log("\n\n\nelse case scenario in userAccounts, verifyOrCreate, api\n", "email", email);
                user = await UserAccount.findOne({ where: { email } });
                if(user == null) {
                    try {
                        console.log("Finding user from API...");

                        const caller = await authHelper.findApiCaller(180);
                        if (!caller) {
                            return res.status(caller.status).send({ error: caller.error });
                        }

                        const apiUserResp = await axios.get(`${apiEndpoint}/user?userId=${caller.apiId}&id=${caller.apiId}&email=${email}`, {
                            headers: {
                                'Authorization': authHelper.getAuthString(caller.apiKey, caller.secretKey)
                            }
                        });
                        const apiUser = apiUserResp.data

                        user = await UserAccount.create({
                            apiId: apiUser.id,
                            apiKey: apiUser.apiCreds.apiKey,
                            email: email,
                            secretKey: "LEGACY",
                            publicKey: apiUser.cryptoKeyPair.publicKey,
                            privateKey: "LEGACY",
                            active: true
                        });
                    } catch(e) {
                        console.log("Failed to find user from the API");
                        console.log(e);
                        return res.status(400).send(user);
                    }
                }
                req.session.user = user;
                return res.status(200).send(user);
            });
    },

    async verifySession(req, res) {
        console.log("\n\n\ntop of verifySession", "session", req.session, "cookies", req.cookies, "\n\n");
        if (req.session.user && req.cookies.session_token) {
            console.log("\n\nverify on backend in session.js, req.session.user", req.session.user, "req.cookies.session_token", req.cookies.session_token);
            const user = await UserAccount.findOne({ where: { apiId: req.session.user.apiId } });
            return res.status(200).send({ sessionVerified: true, user });
        }

        return res.status(403).send({ sessionVerified: false });
    }
}