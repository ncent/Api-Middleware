"use strict";

const UserAccount = require('../models').UserAccount;
const awsEmail = require("../helpers/awsEmail.js");
const bcrypt = require("bcrypt");
const otplib = require("otplib");
const apiEndpoint = process.env.API;
const axios = require("axios");
const axiosRetry = require("axios-retry");
axiosRetry(axios, {retries: 3, retryDelay: axiosRetry.exponentialDelay});

module.exports = {
    async createUser(req, res) {
        const {email, firstname, lastname} = req.body;
        const createUserResponse = await axios.post(`${apiEndpoint}/user`, {
            email,
            firstname,
            lastname
        });

        const newUser = createUserResponse.data;
        await UserAccount.create({
            apiId: newUser.value.id,
            apiKey: newUser.value.apiCreds.apiKey,
            secretKey: newUser.secretKey,
            publicKey: newUser.value.cryptoKeyPair.publicKey,
            privateKey: newUser.privateKey,
            active: false
        });

        return res.status(createUserResponse.status).send(newUser.value);
    },

    async findOneUser(req, res) {

    },

    async sendOTP(req, res) {
        const apiId = req.params.userId;
        const otpKey = otplib.authenticator.generateSecret();
        const token = otplib.authenticator.generate(otpKey);
        const otpExp = Date.now() + 300000;
        const salt = bcrypt.genSaltSync();
        const tokenHash = bcrypt.hashSync(token, salt);

        const user = await UserAccount.findOne({where: {apiId}});

        if (!user) {
            return res.status(404).send({error: "UserAccount not found."});
        }

        const findUserResp = await axios.get(`${apiEndpoint}/user?userId=${apiId}&id=${apiId}`);
        const email = findUserResp.data.userMetadata.email;

        await user.updateAttributes({
            otpKey: tokenHash,
            otpExp: otpExp
        });

        awsEmail.sendOTP(email, token);
        return res.status(200).send({message: "Passcode successfully sent to user"});
    },

    async loginUser(req, res) {

    },

    async logoutUser(req, res) {

    },

    async resetUserAccount(req, res) {

    },

    async findAllBalancesForUser(req, res) {

    }
};