# 🚀 API Monetization with Stripe - Kong API Gateway POC

This project is a **Proof of Concept (POC)** for **API Monetization** using **Kong API Gateway, Stripe Payments, PostgreSQL, and Docker**. It enables **user authentication, rate limiting, and API access control**, allowing developers to **monetize APIs with Stripe and crypto payments (coming soon).**

---

## 📌 Features
- 🔑 **User Registration & Authentication** (API Key-based)
- ⏳ **Rate Limiting** (Based on subscription tier)
- 💳 **Stripe Payments Integration** (Upgrade & reset API usage)
- 📡 **Kong API Gateway** (Manages API access)
- 🐳 **Dockerized** (Easy deployment with Docker & Docker Compose)
- 🔄 **Planned:** Crypto Payments via **Sepolia Testnet**

![API Monetization with Stripe](https://github.com/user-attachments/assets/f605d7b6-ecb2-4c3d-bda2-b194417b240d)



## 📂 Project Structure
```
/kong-api-gateway-poc
│── backend/          # Node.js backend (Express API)
│── frontend/         # Simple HTML/JS frontend (Dashboard)
│── postgres/         # PostgreSQL database
│── kong/             # Kong API Gateway config
│── docker-compose.yml # Docker Compose setup
│── README.md         # Project Documentation
```

---

## 🚀 **Getting Started**
### **1️⃣ Clone the Repository**
```sh
git clone https://github.com/FahdSaif/APIMonetizationwithStripe.git
cd APIMonetizationwithStripe
```

### **2️⃣ Pull Pre-built Docker Images**
Instead of building everything locally, you can **pull the latest images from Docker Hub**:

```sh
docker pull fahdsaif/api-gateway-stripe:backend-v1
docker pull fahdsaif/api-gateway-stripe:frontend-v1
docker pull fahdsaif/api-gateway-stripe:database-v1
docker pull fahdsaif/api-gateway-stripe:kong-v1
```

### **3️⃣ Run the Application**
Now, start the project using **Docker Compose**:

```sh
docker-compose up -d
```

📌 **This will start the backend, frontend, database, and Kong API Gateway in detached mode.**  
Check running containers using:

```sh
docker ps
```

---

## 💳 **Stripe Test Payment Details**
To test **payments via Stripe**, use the following test card details:

- **Card Number:** `4242 4242 4242 4242`
- **Expiry Date:** Any future date (e.g., `12/26`)
- **CVC:** `123`
- **ZIP Code:** Any 5-digit number (e.g., `10001`)

After a **successful payment**, the API rate limit resets.

---

## 🔧 **Environment Variables**
Set the following variables in a **`.env` file** for local development:

```ini
STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key
STRIPE_SECRET_KEY=your-stripe-secret-key
DATABASE_URL=your-postgres-db-url
```

📌 **For production, use secure secrets management.**

---

## 🤝 **Contributing**
If you'd like to contribute:
1. **Fork the repository**
2. **Create a feature branch**
3. **Submit a Pull Request (PR)**

---

## 📜 **License**
This project is licensed under the **MIT License**.

---

### 🎯 **Next Steps**
🚀 **Future Enhancements:**
- 🪙 **Sepolia Testnet Payments** (Crypto payments with MetaMask)
- 🎛️ **OAuth 2.0 / JWT Authentication**
- ☁️ **Deploying the app to a cloud platform**

Let me know if you have any issues! Happy coding! 🚀🔥
