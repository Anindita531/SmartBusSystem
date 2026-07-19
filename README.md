<div align="center">

# 🚌 Smart Bus System

### AI-Powered Smart Bus Management System

A modern full-stack **MERN** application that digitizes public transportation through **paperless ticketing, QR code verification, AI-powered passenger assistance, real-time bus tracking, secure online payments, and role-based dashboards.**

[![Live Demo](https://img.shields.io/badge/🚀_Live_Demo-Open-success?style=for-the-badge)](https://smartbussystem-1.onrender.com)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://react.dev)
[![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![MongoDB Atlas](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/atlas)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-Realtime-black?style=for-the-badge&logo=socket.io)](https://socket.io)
[![Stripe](https://img.shields.io/badge/Stripe-Payments-635BFF?style=for-the-badge&logo=stripe&logoColor=white)](https://stripe.com)
[![Groq](https://img.shields.io/badge/Groq-LLM-orange?style=for-the-badge)](https://groq.com)

### 🌐 Live Demo

https://smartbussystem-1.onrender.com

</div>

---

# 📖 Overview

Smart Bus System is an AI-powered public transportation platform built using the **MERN Stack**. It modernizes conventional bus transportation by replacing traditional paper tickets with secure digital QR tickets while offering real-time tracking, online payments, and intelligent passenger assistance.

The platform supports two operational modes:

- 🟢 **Mode A — Driver + Conductor**
- 🔵 **Mode B — Driver Only**

An integrated AI chatbot powered by **Groq LLM** and **MongoDB Atlas Vector Search** provides intelligent, context-aware responses using Retrieval-Augmented Generation (RAG).

---

# 📑 Table of Contents

- Features
- AI Chatbot
- Operational Modes
- Objectives
- System Architecture
- Technology Stack
- Project Structure
- Installation
- Environment Variables
- API Overview
- Core Modules
- Project Highlights
- Future Enhancements
- Screenshots
- Live Demo
- Author
- License

---

# ✨ Features

## 👤 Passenger

- Secure Registration & Login
- JWT Authentication
- Search Available Buses
- Route & Schedule Information
- Seat Selection
- Online Ticket Booking
- QR Code Paperless Ticket
- Stripe Payment Integration
- Live Bus Tracking
- Booking History
- Waitlist Management
- Ratings & Reviews
- AI Chatbot
- Notifications
- Offers & Coupons
- Issue Reporting

---

## 🚌 Driver

- Driver Authentication
- Driver Dashboard
- Assigned Trips
- Live Bus Location Updates
- Passenger Verification
- QR Ticket Verification
- Trip Management

---

## 🎫 Conductor (Mode A)

- QR Ticket Scanner
- Passenger Verification
- Boarding Management
- Digital Ticket Validation
- Faster Boarding
- Reduced Manual Workload

---

## 🛠 Admin

- Dashboard
- User Management
- Bus Management
- Booking Management
- Revenue Analytics
- Offers & Coupons
- FAQ Management
- Notification Management
- Review Management
- Quotes Management
- Statistics Dashboard
- Issue Resolution

---

# 🤖 AI Chatbot

### AI Technologies Used

- Groq LLM
- MongoDB Atlas Vector Search
- Embedding-Based Semantic Search
- Retrieval-Augmented Generation (RAG)

### Chatbot Capabilities

- Bus Search Assistance
- Route Information
- Ticket Booking Help
- Payment Guidance
- Refund Information
- Cancellation Support
- Offers & Coupons
- Frequently Asked Questions
- Smart Bus Information

---

# 🚍 Operational Modes

## 🟢 Mode A — Driver + Conductor

Designed for buses operating with both a driver and a conductor.

### Benefits

- QR Ticket Verification
- Paperless Ticketing
- Online Payment
- Reduced Cash Handling
- Reduced Change (Khuchro) Problems
- Reduced Conductor Workload
- Faster Passenger Boarding

---

## 🔵 Mode B — Driver Only

Designed for buses operating without a conductor.

### Benefits

- No Conductor Required
- Driver Verifies Tickets
- Real-Time Bus Tracking
- Paperless Ticketing
- Online Payments
- Easy Passenger Management
- Lower Operational Cost

---

# 🎯 Objectives

- Eliminate Paper Tickets
- Reduce Cash Handling
- Reduce Change (Khuchro) Problems
- Improve Passenger Experience
- Digital Ticket Verification
- AI-powered Passenger Assistance
- Smart Public Transportation
- Eco-Friendly Transportation

---

# 🏗 System Architecture

```text
                     Passenger
                         │
                         ▼
               React + Vite Frontend
                         │
                REST API + Socket.IO
                         │
                  Express.js Backend
                         │
      ┌──────────────────┼──────────────────┐
      │                  │                  │
 Authentication      Booking System     AI Chatbot
      │                  │          (Groq + Vector Search)
      └──────────────────┼──────────────────┘
                         │
                  MongoDB Atlas
                         │
        ┌────────────────┴────────────────┐
        │                                 │
 Application Database             Vector Search Index
```

---

# 🛠 Technology Stack

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

## Backend

- Node.js
- Express.js
- MongoDB Atlas
- Mongoose
- JWT Authentication
- Socket.IO
- Stripe API
- Cloudinary

## AI Stack

- Groq LLM
- MongoDB Atlas Vector Search
- Embeddings
- Semantic Search
- Retrieval-Augmented Generation (RAG)

---

# 📂 Project Structure

```text
SmartBusSystem
│
├── frontend
│   ├── src
│   │   ├── api
│   │   ├── assets
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

## Backend

```bash
cd backend

npm install

npm run dev
```

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

## Frontend (.env)

```env
VITE_API_URL=http://localhost:5000

VITE_STRIPE_PUBLISHABLE_KEY=
```

---

# 🔗 API Overview

| Method | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/auth/register` | Register User |
| POST | `/api/auth/login` | Login |
| GET | `/api/buses` | Get All Buses |
| POST | `/api/bookings` | Book Ticket |
| GET | `/api/tickets` | Get Ticket |
| POST | `/api/payment/create-intent` | Stripe Payment |
| POST | `/api/chatbot` | AI Chatbot |

---

# 📦 Core Modules

- Authentication & Authorization
- Bus Management
- Ticket Booking
- QR Ticket Generation
- QR Verification
- Driver Dashboard
- Conductor Dashboard
- Admin Dashboard
- AI Chatbot
- Vector Search
- Seat Lock
- Waitlist
- Stripe Payment Gateway
- Revenue Analytics
- Notifications
- Ratings & Reviews
- FAQ Management

---

# 📊 Project Highlights

- 🚍 24+ Seeded Bus Routes
- 🤖 AI Chatbot using Groq LLM
- 🔍 MongoDB Atlas Vector Search
- 🎟 QR Code Paperless Ticketing
- 💳 Stripe Payment Integration
- 📍 Real-Time Bus Tracking
- ⚡ Socket.IO Real-Time Communication
- 🔐 JWT Authentication
- 👥 Role-Based Authorization
- 🌍 MERN Stack Architecture

---

# 🔮 Future Enhancements

- 📱 Android & iOS Mobile Application
- 🤖 AI Bus Arrival Prediction
- 🎙 Voice Assistant
- 🗺 Google Maps Traffic Integration
- 🧠 Smart Route Optimization
- 🔔 Push Notifications
- 📶 Offline QR Verification

---

# 📸 Screenshots

> Add screenshots inside a `screenshots/` folder.

| Home | Search Bus |
|------|------------|
| ![](screenshots/home.png) | ![](screenshots/search.png) |

| Seat Selection | QR Ticket |
|---------------|-----------|
| ![](screenshots/seat.png) | ![](screenshots/qr.png) |

| AI Chatbot | Admin Dashboard |
|------------|-----------------|
| ![](screenshots/chatbot.png) | ![](screenshots/admin.png) |

---

# 🌐 Live Demo

**Frontend**

https://smartbussystem-1.onrender.com

---

# 👩‍💻 Author

**Anindita Ghosh**

- GitHub: https://github.com/Anindita531

---

# 📜 License

This project is developed for **educational, research, and portfolio purposes**.

---

<div align="center">

## ⭐ If you found this project useful, please give it a Star!

Made with ❤️ using React, Node.js, Express, MongoDB Atlas, Groq AI, Socket.IO, and Stripe.

</div>
