# Hostel Management System Backend

This is the backend service for the Hostel Management System, built with **Node.js**, **Express.js**, and **MongoDB (Mongoose)**. It provides features like user registration, authentication via JSON Web Tokens (JWT), and role-based authorization for Student, Warden, and Admin users.

## Project Structure

```
backend/
├── config/
│   └── db.js                 # MongoDB connection
├── controllers/
│   └── authController.js     # Register & login controllers
├── middleware/
│   ├── authMiddleware.js     # JWT token validation
│   └── roleMiddleware.js     # Role-based access validation
├── models/
│   └── User.js               # Mongoose User model with pre-save hashing
├── routes/
│   ├── authRoutes.js         # Public auth endpoints
│   └── dashboardRoutes.js    # Protected role-based dashboard endpoints
├── .env                      # Environment configurations (local)
├── package.json              # Project scripts and dependencies
├── server.js                 # Application entry point
└── README.md                 # Project documentation
```

## Features

- **Model-View-Controller (MVC) architecture**.
- **Mongoose User Schema** containing `fullName`, `email`, `phoneNumber`, `department`, `year`, `gender`, `role`, `parentName`, `parentContact`, and `password`.
- **Password hashing** using `bcryptjs` via Mongoose hooks before saving to the database.
- **JWT token authentication** and session security.
- **Role-based authorization middleware** supporting `student`, `warden`, and `admin` access levels.
- **Async/await syntax** with try/catch global error handlers.

---

## Setup Instructions

### Prerequisites
- [Node.js](https://nodejs.org/) (v16+ recommended)
- [MongoDB](https://www.mongodb.com/) (Local installation or MongoDB Atlas cluster URI)

### 1. Install Dependencies
Navigate to the `backend` directory and run:
```bash
npm install
```

### 2. Configure Environment Variables
Create or update the `.env` file in the `backend` directory:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/hostel_management
JWT_SECRET=your_super_secret_jwt_key_12345
```

### 3. Start the Server
To run in **development mode** (with hot-reloading using nodemon):
```bash
npm run dev
```

To run in **production mode**:
```bash
npm start
```

---

## API Endpoints

### 1. Authentication (Public Routes)

#### Register User
- **URL**: `POST /api/auth/register`
- **Request Body**:
  ```json
  {
    "fullName": "Dharshini Balasubramaniam",
    "email": "dharshinibala001@gmail.com",
    "phoneNumber": "9629562900",
    "department": "Computer Science",
    "year": "2nd Year",
    "gender": "Female",
    "role": "student",
    "parentName": "Balasubramaniam",
    "parentContact": "9976399893",
    "password": "Dharshini@25"
  }
  ```
- **Responses**:
  - `201 Created` on success:
    ```json
    {
      "success": true,
      "message": "User registered successfully",
      "user": {
        "id": "603d3fbc9a80e123456789ab",
        "fullName": "Dharshini Balasubramaniam",
        "email": "dharshinibala001@gmail.com",
        "role": "student"
      }
    }
    ```
  - `400 Bad Request` if field is missing, password is too short, or email is duplicated.

#### Login User
- **URL**: `POST /api/auth/login`
- **Request Body**:
  ```json
  {
    "email": "dharshinibala001@gmail.com",
    "password": "Dharshini@25"
  }
  ```
- **Responses**:
  - `200 OK` on success, returns token:
    ```json
    {
      "success": true,
      "message": "Login successful",
      "token": "eyJhbGciOiJIUzI1NiIsIn...",
      "user": {
        "id": "603d3fbc9a80e123456789ab",
        "fullName": "Dharshini Balasubramaniam",
        "email": "dharshinibala001@gmail.com",
        "phoneNumber": "9629562900",
        "department": "Computer Science",
        "year": "2nd Year",
        "gender": "Female",
        "role": "student",
        "parentName": "Balasubramaniam",
        "parentContact": "9976399893"
      }
    }
    ```
  - `401 Unauthorized` for incorrect email or password.

---

### 2. Protected Routes (Requires JWT Token)

Include the header `Authorization: Bearer <your_jwt_token>` for all requests below:

#### Student Dashboard
- **URL**: `GET /api/student/dashboard`
- **Access**: `student` only
- **Response**: `200 OK` if role matches, otherwise `403 Forbidden`.

#### Warden Dashboard
- **URL**: `GET /api/warden/dashboard`
- **Access**: `warden` only
- **Response**: `200 OK` if role matches, otherwise `403 Forbidden`.

#### Admin Dashboard
- **URL**: `GET /api/admin/dashboard`
- **Access**: `admin` only
- **Response**: `200 OK` if role matches, otherwise `403 Forbidden`.

---

## Testing API Endpoints via curl

1. **Register**
   ```bash
   curl -X POST http://localhost:5000/api/auth/register \
     -H "Content-Type: application/json" \
     -d "{\"fullName\":\"Dharshini Balasubramaniam\",\"email\":\"dharshinibala001@gmail.com\",\"phoneNumber\":\"9629562900\",\"department\":\"Computer Science\",\"year\":\"2nd Year\",\"gender\":\"Female\",\"role\":\"student\",\"parentName\":\"Balasubramaniam\",\"parentContact\":\"9976399893\",\"password\":\"Dharshini@25\"}"
   ```

2. **Login**
   ```bash
   curl -X POST http://localhost:5000/api/auth/login \
     -H "Content-Type: application/json" \
     -d "{\"email\":\"dharshinibala001@gmail.com\",\"password\":\"Dharshini@25\"}"
   ```

3. **Get Dashboard** (using token from login response)
   ```bash
   curl -X GET http://localhost:5000/api/student/dashboard \
     -H "Authorization: Bearer <TOKEN_HERE>"
   ```
