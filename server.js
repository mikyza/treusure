require("dotenv").config();
const express = require("express");
const axios = require("axios");
const cors = require("cors");
const bodyParser = require("body-parser");
const base64 = require("base-64");

const app = express();
app.use(cors());
app.use(bodyParser.json());

const PORT = 5000;

// Replace with your M-Pesa details
const CONSUMER_KEY = process.env.CONSUMER_KEY;
const CONSUMER_SECRET = process.env.CONSUMER_SECRET;
const BUSINESS_SHORTCODE = "174379";
const PASSKEY = "RAIZdAKGshzj0G8EzaLjlbGXtswndhPYHGAVuHaOTT7RDFld";
const CALLBACK_URL = "https://mikyza.github.io/treusure/";

// Generate OAuth Token
async function getAccessToken() {
    const auth = base64.encode(`${CONSUMER_KEY}:${CONSUMER_SECRET}`);

    try {
        const response = await axios.get(
            "https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
            { headers: { Authorization: `Basic ${auth}` } }
        );
        return response.data.access_token;
    } catch (error) {
        console.error("Error getting access token:", error);
    }
}

// Handle Deposit
app.post("/mpesa/deposit", async (req, res) => {
    const { amount, phone } = req.body;
    const accessToken = await getAccessToken();

    const timestamp = new Date().toISOString().replace(/[^0-9]/g, "").slice(0, 14);
    const password = base64.encode(`${BUSINESS_SHORTCODE}${PASSKEY}${timestamp}`);

    const requestBody = {
        BusinessShortCode: BUSINESS_SHORTCODE,
        Password: password,
        Timestamp: timestamp,
        TransactionType: "CustomerPayBillOnline",
        Amount: amount,
        PartyA: phone,
        PartyB: BUSINESS_SHORTCODE,
        PhoneNumber: phone,
        CallBackURL: CALLBACK_URL,
        AccountReference: "Deposit",
        TransactionDesc: "Game Deposit",
    };

    try {
        const response = await axios.post(
            "https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
            requestBody,
            { headers: { Authorization: `Bearer ${accessToken}` } }
        );

        res.json({ success: true, message: "STK Push sent. Check your phone to complete payment." });
    } catch (error) {
        console.error("M-Pesa Error:", error);
        res.status(500).json({ success: false, message: "M-Pesa request failed." });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
