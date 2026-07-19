# 🚌 Smart Bus System

An AI-powered Smart Bus Management System built with the **MERN Stack** to modernize public transportation through digital ticketing, real-time tracking, intelligent route management, and AI-assisted passenger support.

The system supports **two operational modes**:

- **Mode A (Driver + Conductor):** QR-based ticket verification by the conductor for faster boarding and reduced manual workload.
- **Mode B (Driver Only):** No conductor required. The driver verifies digital tickets while passengers enjoy paperless travel, online payments, and live bus tracking.

The platform also features an **AI Chatbot powered by Groq LLM and MongoDB Atlas Vector Search**, enabling users to receive instant, context-aware assistance.

---

## ✨ Key Features

### 👤 Passenger

- Secure User Registration & Login
- Search Available Buses
- View Routes & Schedules
- Seat Selection
- Online Ticket Booking
- QR Code Paperless Ticket
- Secure Online Payment (Stripe)
- Live Bus Tracking
- Booking History
- AI Chatbot Assistance
- Ratings & Reviews
- Issue Reporting
- Notifications
- Offers & Coupons

---

### 🚌 Driver

- Driver Authentication
- Driver Dashboard
- Assigned Trips
- Live Bus Location Updates
- QR Ticket Verification
- Passenger Management

---

### 🎫 Conductor (Mode A)

- QR Ticket Scanner
- Passenger Verification
- Digital Ticket Validation
- Boarding Management
- Reduced Cash Handling
- Faster Passenger Flow

---

### 🛠️ Admin

- Dashboard
- User Management
- Bus Management
- Booking Management
- Revenue Analytics
- Offers & Coupons
- FAQ Management
- Notification Management
- Quotes Management
- Review Management
- Issue Resolution

---

# 🤖 AI Chatbot

The chatbot is powered by:

- Groq LLM
- MongoDB Atlas Vector Search
- Embedding-based Semantic Search
- Retrieval-Augmented Generation (RAG)

Users can ask questions about:

- Bus availability
- Routes
- Ticket booking
- Payment
- Refunds
- Offers
- FAQs
- Driver & Conductor Modes

---

# 🚍 Operational Modes

## 🟢 Mode A – Driver + Conductor

Designed for buses operating with a conductor.

### Benefits

- QR Ticket Verification
- Paperless Ticketing
- Online Payment
- Reduced Cash/Change (Khuchro) Problems
- Reduced Conductor Workload
- Faster Passenger Boarding
- Digital Ticket Validation

---

## 🔵 Mode B – Driver Only

Designed for buses operating without a conductor.

### Benefits

- No Conductor Required
- Driver Ticket Verification
- Live GPS Tracking
- Online Payment
- Paperless Ticket
- Easy Passenger Management
- Lower Operational Cost

---

# 🎯 Objectives

- Eliminate Paper Tickets
- Reduce Cash Handling
- Reduce Change (Khuchro) Problems
- Reduce Conductor Workload
- Enable Digital Ticket Verification
- Improve Passenger Experience
- Support AI-powered Passenger Assistance
- Provide Real-Time Bus Tracking
- Build a Smart & Eco-Friendly Transportation System

---

# 🛠 Tech Stack

## Frontend

- React.js
- Vite
- React Router DOM
- Axios
- React Leaflet
- Leaflet
- Recharts
- Socket.IO Client
- React Hot Toast
- React Icons
- Stripe

---

## Backend

- Node.js
- Express.js
- MongoDB Atlas
- Mongoose
- JWT Authentication
- Socket.IO
- Stripe API
- Cloudinary

---

## AI Stack

- Groq LLM
- MongoDB Atlas Vector Search
- Vector Embeddings
- Semantic Search
- Retrieval-Augmented Generation (RAG)

---

# 📂 Project Structure

```
SmartBusSystem
│
├── frontend
│   ├── src
│   │   ├── api
│   │   ├── components
│   │   ├── context
│   │   ├── hooks
│   │   ├── pages
│   │   ├── routes
│   │   └── utils
│   └── package.json
│
├── backend
│   ├── src
│   │   ├── config
│   │   ├── controllers
│   │   ├── middleware
│   │   ├── models
│   │   ├── routes
│   │   ├── services
│   │   ├── seed
│   │   └── utils
│   └── package.json
│
└── README.md
```

---

# 🚀 Installation

## Clone Repository

```bash
git clone https://github.com/Anindita531/SmartBusSystem.git

cd SmartBusSystem
```

---

## Backend

```bash
cd backend

npm install

npm run dev
```

---

## Frontend

```bash
cd frontend

npm install

npm run dev
```

---

# 🔐 Environment Variables

## Backend (.env)

```env
PORT=5000

MONGODB_URI=

JWT_SECRET=

STRIPE_SECRET_KEY=

GROQ_API_KEY=

CLIENT_URL=http://localhost:5173
```

---

## Frontend (.env)

```env
VITE_API_URL=http://localhost:5000

VITE_STRIPE_PUBLISHABLE_KEY=
```

---

# 📦 Major Modules

- Authentication
- Bus Management
- Ticket Booking
- QR Ticket Generation
- QR Verification
- Driver Dashboard
- Conductor Dashboard
- Admin Dashboard
- Revenue Analytics
- Coupons & Offers
- Ratings & Reviews
- Issue Reporting
- Notifications
- FAQ Management
- AI Chatbot
- Vector Search
- Seat Lock
- Waitlist
- Payment Gateway

---

# 🔮 Future Improvements

- Mobile Application
- AI Bus Arrival Prediction
- Voice Assistant
- Offline QR Verification
- Google Maps Traffic Integration
- Route Optimization
- Smart Fare Recommendation
- Push Notifications

---

# 👨‍💻 Author

**Anindita Ghosh**

GitHub: **https://github.com/Anindita531**

---

# 📜 License

This project is developed for educational, research, and learning purposes.

---

## ⭐ If you like this project, don't forget to give it a star on GitHub!
