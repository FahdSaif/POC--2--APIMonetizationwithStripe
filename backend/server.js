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
const apiUsage = {}; // Tracks API call counts per user

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
            success_url: `http://localhost:8080/dashboard.html?email=${encodeURIComponent(email)}`,
            cancel_url: "http://localhost:8080/dashboard.html"
        });

        res.json({ id: session.id, url: session.url });
    } catch (error) {
        console.error("Stripe Error:", error);
        res.status(500).json({ message: "Payment initiation failed" });
    }
});

// ✅ Reset API Usage After Payment
app.post("/reset-usage", (req, res) => {
    const { email } = req.body;

    if (!email || !users.find(user => user.email === email)) {
        return res.status(400).json({ message: "User not found" });
    }

    const user = users.find(user => user.email === email);
    apiUsage[email] = 0; // Reset API usage to 0
    res.json({ message: "API usage reset successfully", remainingHits: rateLimits[user.package] });
});

// ✅ User Registration
app.post("/register", async (req, res) => {
    const { username, email, password, package } = req.body;

    if (!username || !email || !password || !package) {
        return res.status(400).json({ message: "All fields are required" });
    }

    if (users.some(user => user.email === email)) {
        return res.status(400).json({ message: "User already exists" });
    }

    const apiKey = crypto.randomBytes(16).toString("hex");
    users.push({ username, email, password, package, apiKey });
    apiUsage[email] = 0; // Initialize API usage

    try {
        const kongUsername = `user_${Date.now()}`;

        // Register user in Kong
        await axios.post(`${kongAdminURL}/consumers`, { username: kongUsername });

        // Assign API Key in Kong
        await axios.post(`${kongAdminURL}/consumers/${kongUsername}/key-auth`, { key: apiKey });

        res.status(201).json({ message: "User registered successfully", apiKey });
    } catch (error) {
        console.error("Error registering user in Kong:", error.response ? error.response.data : error.message);
        res.status(500).json({ message: "Failed to register user in Kong" });
    }
});

// ✅ User Login
app.post("/login", (req, res) => {
    const { email, password } = req.body;
    const user = users.find(user => user.email === email && user.password === password);
    if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
    }
    res.json({ message: "Login successful", apiKey: user.apiKey, package: user.package, email });
});

// ✅ API Usage Tracking
app.get("/api/hit", (req, res) => {
    const apiKey = req.headers["apikey"];
    const user = users.find(user => user.apiKey === apiKey);

    if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    if (!apiUsage[user.email]) {
        apiUsage[user.email] = 0;
    }

    if (apiUsage[user.email] >= rateLimits[user.package]) {
        return res.status(403).json({ message: "Rate limit reached", remainingHits: 0 });
    }

    apiUsage[user.email] += 1;
    const remainingHits = rateLimits[user.package] - apiUsage[user.email];

    res.json({ message: "API call successful", remainingHits });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// Fahd Notes
// 1 Kong's rate limiting plugin stores usage data internally, making it difficult to reset a specific user's limit dynamically after payment.
// 2️ We needed a way to reset limits instantly after a Stripe payment, which is easier to manage in-memory (apiUsage[email] = 0) in server.js.
// 3️ Using Kong would require setting up a database-backed plugin (e.g., Redis for rate limiting), adding complexity, whereas our current approach is simpler for a Proof of Concept (POC). 