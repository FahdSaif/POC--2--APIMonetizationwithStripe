require('dotenv').config();
const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const axios = require('axios');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const app = express();
app.use(express.json());
app.use(cors());

const users = []; // Temporary in-memory storage
const apiUsage = {}; // Stores API call counts per user

const rateLimits = {
    basic: 10,
    intermediate: 20,
    enterprise: 30
};

const packagePrices = {
    basic: 1500, // $15.00
    intermediate: 2000, // $20.00
    enterprise: 2500 // $25.00
};

// Kong Admin API
const kongAdminURL = "http://kong:8001";

app.get("/", (req, res) => {
    res.send("Backend API is running!");
});

// ✅ Stripe Payment - Resets Rate Limit Based on User Package
app.post("/create-checkout-session", async (req, res) => {
    const { package, email } = req.body;

    if (!packagePrices[package]) {
        return res.status(400).json({ message: "Invalid package selection" });
    }

    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: [
                {
                    price_data: {
                        currency: "aud",
                        product_data: { name: `${package} API Package` },
                        unit_amount: packagePrices[package]
                    },
                    quantity: 1
                }
            ],
            mode: "payment",
            success_url: `http://localhost:8080/payment-success.html?email=${encodeURIComponent(email)}`,
            cancel_url: "http://localhost:8080/dashboard.html"
        });

        res.json({ id: session.id, url: session.url });
    } catch (error) {
        console.error("Stripe Error:", error);
        res.status(500).json({ message: "Payment initiation failed" });
    }
});

// added 26 feb 2025: Reset API Usage After Payment (Triggered from Frontend)
app.post("/reset-usage", (req, res) => {
    const { email } = req.body;

    if (!email || !users.find(user => user.email === email)) {
        return res.status(400).json({ message: "User not found" });
    }

    const user = users.find(user => user.email === email);
    apiUsage[email] = 0; // Reset API usage
    res.json({ message: "API usage reset successfully", remainingHits: rateLimits[user.package] });
});

// Other routes (User registration, login, API tracking) remain unchanged

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
