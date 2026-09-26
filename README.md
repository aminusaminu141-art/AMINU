# Bichi Academy - School Portal System

Bichi Portal is a premium school management application designed to handle student grading, attendance tracking, official report cards, transcripts, graduation certificates, and principal reviews for **Bichi Academy**. The application features custom portals tailored for four distinct roles: Students, Class Masters, Exams Officers, and the School Principal.

---

## 🚀 Key Features
 
* **Student Portal:** View attendance history, finalized academic report cards, class position rankings, view outstanding school fees balance, and initiate online card/transfer payments via the Remita sandbox gateway.
* **Bursar Portal:** Configures term-based fee amount per class, views expected vs collected metrics, monitors deficit reports, and generates class-wide financial logs.
* **Class Master Portal:** Log daily attendance, record class marks (Test 1, Test 2, Other C.A., Exam), and issue term behavior reviews/remarks.
* **Exams Officer Portal:** Manage curriculum objects (Classes and Subjects), review grade sheets submitted by teachers, and officially publish results to student portals.
* **Principal Portal:** Manage staff profiles, assign teachers to subjects/classes, submit official reviews, and generate printed transcripts, graduation certificates, and testimonials.
 
---
 
## 🛠️ Prerequisites
 
Ensure you have the following installed on your machine:
* **Node.js** (v16.x or newer)
* **NPM** (v8.x or newer)
* **XAMPP** (or any local MySQL database server)
 
---
 
## 🗄️ Database Installation & Seeding
 
1. Open your **XAMPP Control Panel** and start the **MySQL** service.
2. Open your database administration tool (such as [phpMyAdmin](http://localhost/phpmyadmin)) and create a new database named `amsuf_db`:
   ```sql
   CREATE DATABASE amsuf_db;
   ```
3. Locate the `server/.env` file and verify your MySQL credentials and Remita Merchant Keys. The default configuration is:
   ```env
   PORT=5000
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=
   DB_NAME=amsuf_db
   JWT_SECRET=super_secret_jwt_key_123
   
   REMITA_MERCHANT_ID=2547916
   REMITA_SERVICE_TYPE_ID=4430731
   REMITA_API_KEY=1946
   REMITA_BASE_URL=https://remitademo.net
   REMITA_CHECKOUT_URL=https://remitademo.net/remita/ecomm/finalize.web
   ```
4. Navigate to the `server/` directory and run the database setup, seeding script, and the new payments migration script:
   ```bash
   cd server
   npm install
   node seed.js
   node migrate_payments.js
   ```
 
---
 
## 🟢 Running the Application
 
To run the application locally, you must start both the backend server and the frontend client.
 
### 1. Start the Backend Server (Express)
1. Open a terminal and navigate to the `server/` directory.
2. Install dependencies (if not already done) and start the server:
   ```bash
   cd server
   npm install
   node index.js
   ```
   *The server will run on port `5000`.*
 
### 2. Start the Frontend Client (Vite + React)
1. Open a new terminal window/tab and navigate to the `client/` directory.
2. Install dependencies and launch the developer server:
   ```bash
   cd client
   npm install
   npm run dev
   ```
   *The client will run on port `5173`. Open [http://localhost:5173/](http://localhost:5173/) to access the portal.*
 
---
 
## 🔑 Test Credentials
 
The database seeding process creates default accounts for testing. All accounts share the password **`password123`**:
 
| Role | Login ID | Password | Access Details |
| :--- | :--- | :--- | :--- |
| **Student** | `STU001` | `password123` | Assigned to class JSS 1 |
| **Bursar** | `BUR001` | `password123` | Full financial, fee config, and collections control |
| **Class Master** | `MAS001` | `password123` | Assigned to class JSS 1 |
| **Exams Officer** | `EXM001` | `password123` | Full curriculum & publishing control |
| **Principal** | `PRN001` | `password123` | Staff oversight & document generation |

---

## 📁 Project Architecture

```
myproject/
├── client/                 # React & Vite frontend code
│   ├── src/
│   │   ├── components/     # Layout wrappers and navigation
│   │   ├── pages/          # Login, Register, and Dashboards
│   │   ├── index.css       # Core design system tokens and variables
│   │   └── App.jsx         # Client routing
│   └── vite.config.js      # Dev server with proxy settings to backend
├── server/                 # Express backend API
│   ├── controllers/        # Route controllers handling business logic
│   ├── middleware/         # JWT Authentication & role protection
│   ├── routes/             # API Endpoints
│   ├── schema.sql          # Base database structure
│   ├── seed.js             # Initial database seed script
│   └── index.js            # Main entry point
└── README.md               # Setup and usage guide
```
