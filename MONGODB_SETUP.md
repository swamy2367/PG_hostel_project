# Hostel Management System - MongoDB Setup

## 🚀 Setup Instructions

### 1. Install MongoDB Compass
- Download and install MongoDB Compass from: https://www.mongodb.com/try/download/compass
- Open MongoDB Compass and connect to: `mongodb://localhost:27017`

### 2. Create Database
- In MongoDB Compass, create a new database named: `hostel_management`
- The collections (admins, students, rooms) will be created automatically when you register

### 3. Start the Backend Server
```bash
npm run server
```

The server will run on: http://localhost:5000

### 4. Start the Frontend (in a new terminal)
```bash
npm run dev
```

The frontend will run on: http://localhost:5173

## 📡 API Endpoints

### Authentication
- **POST** `/api/auth/register` - Register new admin
- **POST** `/api/auth/login` - Login admin
- **GET** `/api/auth/me` - Get current admin (requires token)

### Students
- **GET** `/api/students` - Get all students (requires token)
- **POST** `/api/students` - Add new student (requires token)
- **DELETE** `/api/students/:id` - Remove student (requires token)

### Rooms
- **GET** `/api/rooms` - Get all rooms (requires token)
- **GET** `/api/rooms/:type` - Get rooms by type (requires token)
- **PUT** `/api/rooms/:id` - Update room status (requires token)

### Fees
- **POST** `/api/fees/payment` - Add payment (requires token)
- **GET** `/api/fees/student/:studentId` - Get payment history (requires token)

## 🔐 Authentication Flow

1. **Register**: Admin registers with username, email, password, hostel details
2. **Login**: Admin logs in with username and password
3. **Token**: Server returns JWT token
4. **Protected Routes**: Include token in Authorization header: `Bearer <token>`

## 📊 Database Schema

### Admin Collection
```javascript
{
  username: String (unique),
  email: String (unique),
  password: String (hashed),
  hostelName: String,
  hostelLogo: String,
  roomConfig: {
    double: { count, startRoom },
    triple: { count, startRoom },
    four: { count, startRoom }
  },
  role: String,
  isActive: Boolean
}
```

### Student Collection
```javascript
{
  name: String,
  studentId: String (unique),
  email: String,
  phone: String,
  room: Number,
  roomType: String,
  monthlyFee: Number,
  totalPaid: Number,
  paymentHistory: Array,
  adminId: ObjectId (ref: Admin)
}
```

### Room Collection
```javascript
{
  number: Number,
  type: String,
  capacity: Number,
  status: String (available/occupied/reserved/maintenance),
  occupants: [ObjectId] (ref: Student),
  adminId: ObjectId (ref: Admin)
}
```

## 🔒 Security Features

- ✅ Password hashing with bcrypt
- ✅ JWT token-based authentication
- ✅ Protected API routes
- ✅ Admin isolation (each admin sees only their data)
- ✅ Input validation
- ✅ CORS enabled

## 🛠️ Environment Variables

Create a `.env` file in the root directory:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/hostel_management
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRE=7d
```

## 📝 Notes

- Make sure MongoDB is running before starting the server
- Default MongoDB port is 27017
- JWT tokens expire after 7 days (configurable)
- All student data is tied to admin accounts for security
