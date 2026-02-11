<p align="center">
  <h1 align="center">🏙️ Civic Issue Reporting & Resolution System</h1>
  <p align="center"><strong>SIH 2025 Project</strong></p>
  <p align="center">
    A full-stack web platform empowering citizens, municipal authorities, and field workers to collaboratively report, track, and resolve civic issues in real-time.
  </p>
</p>

---

## 📋 Table of Contents

- [About](#-about)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [API Reference](#-api-reference)
- [Database Schema](#-database-schema)
- [Contributing](#-contributing)

---

## 🔍 About

The **Civic Issue Reporting & Resolution System** is a crowdsourced platform designed to bridge the gap between citizens and municipal authorities. Citizens can report issues like potholes, broken streetlights, or garbage overflow — complete with photos and GPS location. Admins can manage and assign these issues to field workers, who can then navigate to the location, resolve the problem, and upload proof of completion.

**Key Highlights:**
- Real-time notifications via Socket.io
- Intelligent duplicate detection within a 100m radius
- Gamification with leaderboard and points system
- Dual database architecture (MongoDB + MySQL)
- Offline support for field workers

---

## ✨ Features

### 👤 Citizens
| Feature | Description |
|---------|-------------|
| **Report Issues** | Submit civic issues with photos, GPS location, category, and severity |
| **Duplicate Detection** | Automatic 100m radius check to prevent duplicate reports |
| **Track Status** | Monitor the progress of reported issues in real-time |
| **Leaderboard** | Earn points for reporting issues and climb the leaderboard |

### 🛡️ Admin Panel
| Feature | Description |
|---------|-------------|
| **Dashboard** | Analytics overview with charts and statistics |
| **Issue Management** | View, assign, and update status of reported issues |
| **Worker Management** | Manage field workers and their assignments |
| **Department Routing** | Smart suggestions for routing issues to relevant departments |

### 🔧 Field Workers
| Feature | Description |
|---------|-------------|
| **Task Dashboard** | View all assigned tasks with priority and details |
| **Navigation** | Get directions to the issue location via Google Maps |
| **Proof of Work** | Upload before/after photos to mark issues as resolved |
| **Offline Support** | Continue working even without an internet connection |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | HTML5, CSS3, JavaScript, EJS Templates |
| **Backend** | Node.js, Express.js |
| **Primary Database** | MongoDB (Issues, Users, Notifications) |
| **Secondary Database** | MySQL (Department data) |
| **Real-time** | Socket.io |
| **Maps & Location** | Google Maps API |
| **Authentication** | Express Sessions + Bcrypt |
| **File Uploads** | Multer |

---

## 📁 Project Structure

```
project-for-civics/
├── config/
│   ├── db.js                  # MongoDB & MySQL connection setup
│   └── mysql_schema.sql       # MySQL schema for departments
├── middleware/
│   └── auth.js                # Authentication middleware
├── models/
│   ├── Issue.js               # Issue schema (MongoDB)
│   ├── User.js                # User schema (MongoDB)
│   └── Notification.js        # Notification schema (MongoDB)
├── public/
│   ├── css/                   # Stylesheets
│   ├── js/                    # Client-side JavaScript
│   ├── images/                # Static images
│   └── uploads/               # User-uploaded files
├── routes/
│   ├── authRoutes.js          # Login, Register, Logout
│   ├── issueRoutes.js         # Issue CRUD & API endpoints
│   ├── adminRoutes.js         # Admin dashboard & management
│   └── workerRoutes.js        # Worker tasks & completion
├── views/
│   ├── citizen/               # Citizen pages (home, report, track, leaderboard)
│   ├── admin/                 # Admin pages (dashboard, issues, workers)
│   ├── worker/                # Worker pages (dashboard, tasks, profile)
│   ├── partials/              # Reusable EJS partials (header, footer)
│   ├── login.ejs              # Login page
│   └── register.ejs           # Registration page
├── utils/                     # Utility functions
├── server.js                  # Main entry point
├── seed.js                    # Database seeder
├── package.json
└── .env                       # Environment variables (not in repo)
```

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v16 or higher)
- [MongoDB](https://www.mongodb.com/) (running locally or cloud URI)
- [MySQL](https://www.mysql.com/) (optional — for department features)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Aditya-Patil-63/project-for-civics.git
   cd project-for-civics
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**

   Create a `.env` file in the root directory:
   ```env
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/civic_reporting_db
   MYSQL_HOST=localhost
   MYSQL_USER=root
   MYSQL_PASSWORD=your_password
   MYSQL_DATABASE=civic_reporting_db
   SESSION_SECRET=your_secret_key_here
   GOOGLE_MAPS_API_KEY=your_google_maps_api_key
   ```

4. **Seed the database** (optional)
   ```bash
   node seed.js
   ```

5. **Start the server**
   ```bash
   npm start
   ```

6. **Open in browser**

   Navigate to [http://localhost:3000](http://localhost:3000)

---

## 📡 API Reference

**Base URL:** `http://localhost:3000`

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/auth/login` | User login |
| `POST` | `/auth/register` | User registration |
| `GET` | `/auth/logout` | User logout |

### Issues (Citizen)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/issues` | List all issues (JSON) |
| `POST` | `/api/issues` | Create a new issue (multipart form) |
| `GET` | `/api/issues/check-duplicate?lat=...&lng=...` | Check for duplicate issues nearby |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/admin/dashboard` | Admin dashboard with analytics |
| `POST` | `/admin/api/issues/:id/status` | Update issue status |

### Worker
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/worker/dashboard` | Worker task dashboard |
| `POST` | `/api/worker/tasks/:id/complete` | Mark task as complete (with photo) |

---

## 🗄️ Database Schema

### MongoDB Collections

**Users**
- `name`, `email`, `password`, `role` (citizen/admin/worker), `phone`, `points`

**Issues**
- `title`, `description`, `category`, `severity`, `location` (GeoJSON), `photos`, `status`, `reportedBy`, `assignedTo`, `createdAt`

**Notifications**
- `userId`, `message`, `type`, `read`, `createdAt`

### MySQL Tables
- **Departments** — Municipal department data for issue routing

---
