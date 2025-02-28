require('dotenv').config();
const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const axios = require('axios');

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

// Use the correct Kong Admin API URL inside Docker
const kongAdminURL = "http://kong:8001"; 

app.get("/", (req, res) => {
    res.send("Backend API is running!");
});

// User registration
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
        // Ensure the username is unique for Kong
        const kongUsername = `user_${Date.now()}`; // Unique username to prevent conflicts

        // Register user in Kong
        const consumerResponse = await axios.post(`${kongAdminURL}/consumers`, {
            username: kongUsername
        });

        if (consumerResponse.status !== 201) {
            console.error("Failed to create Kong consumer:", consumerResponse.data);
            return res.status(500).json({ message: "Failed to register user in Kong" });
        }

        // Assign API Key in Kong
        const keyAuthResponse = await axios.post(`${kongAdminURL}/consumers/${kongUsername}/key-auth`, {
            key: apiKey
        });

        if (keyAuthResponse.status !== 201) {
            console.error("Failed to assign API key in Kong:", keyAuthResponse.data);
            return res.status(500).json({ message: "Failed to assign API key in Kong" });
        }

        res.status(201).json({ message: "User registered successfully", apiKey });
    } catch (error) {
        console.error("Error registering user in Kong:", error.response ? error.response.data : error.message);
        res.status(500).json({ message: "Failed to register user in Kong", error: error.response ? error.response.data : error.message });
    }
});

// User login
app.post("/login", (req, res) => {
    const { email, password } = req.body;

    const user = users.find(user => user.email === email && user.password === password);
    if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
    }

    res.json({ message: "Login successful", apiKey: user.apiKey, package: user.package, email });
});

// API usage tracking
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

// Endpoint to check stored users
app.get("/users", (req, res) => {
    res.json(users);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
