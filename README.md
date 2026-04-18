# HostelHub

HostelHub is a full-stack platform designed to bridge the gap between student accommodations and hostel owners. Built on the MERN stack, it provides a centralized system for discovering hostels, handling secure bookings, and managing day-to-day operations like rent tracking and maintenance complaints.

## Core Features

**For Students:**
* **Location-Based Search:** Find and filter hostels by city, rent, room capacity, and amenities.
* **Smart Booking System:** Transparent room availability and instant booking requests.
* **Escrow Payments:** Integrated wallet and checkout flow.
* **Support System:** Raise and track issues/complaints directly with your hostel owner.
* **Real-time Notifications:** Instant alerts on booking status and chat updates.

**For Hostel Owners:**
* **Property Management:** Add hostels, configure room capacities (single to four-person), and track real-time occupancy.
* **Booking Pipeline:** Accept or reject student booking requests.
* **Financial Dashboard:** Track monthly rent collection, dues, and view analytics.
* **Complaint Resolution:** Manage and resolve student tickets, or escalate them to platform administrators.

**For Administrators:**
* **Global Overview:** Monitor platform-wide stats, active users, and hostel verifications.
* **Ticket Mediation:** Handle disputes or requests escalated by hostel owners.

## Technology Stack

* **Frontend:** React (Vite), React Router v6, custom CSS design system using native variables.
* **Backend:** Node.js, Express.js.
* **Database:** MongoDB & Mongoose.
* **Real-time:** Socket.io (for push notifications and chat integrations).
* **Payment Gateway:** Razorpay (Test mode implemented).

## Getting Started

### Prerequisites
* Node.js (v18 or higher)
* MongoDB (running locally on port 27017 or an Atlas URI)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Rajesh-bandi/hostel_booking_website.git
   cd hostel_booking_website
   ```

2. **Install dependencies**
   ```bash
   npm install        # Installs frontend dependencies
   cd server
   npm install        # Installs backend dependencies
   ```

3. **Configure Environment Variables**
   Create a `.env` file in the `/server` directory and add the following:
   ```env
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/hostel_management
   JWT_SECRET=your_super_secret_jwt_key
   JWT_EXPIRE=7d

   CLIENT_URL=http://localhost:5173

   EMAIL_SERVICE=gmail
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASSWORD=your_app_password
   EMAIL_FROM=HostelHub <noreply@hostelhub.com>

   RAZORPAY_KEY_ID=rzp_test_your_key
   RAZORPAY_KEY_SECRET=your_secret
   ```

### Running the Application

Open two separate terminals:

**Terminal 1: Start the Backend server**
```bash
cd server
npm run server
```

**Terminal 2: Start the Frontend Vite server**
```bash
# From the root directory
npm run dev
```

The application will be accessible at `http://localhost:5173`.

## Deployment

The application is configured to run easily on an AWS EC2 Ubuntu instance using Nginx as a reverse proxy for the static frontend build and PM2 to daemonize the Node.js backend. 

* **Frontend Build:** `npm run build`
* **Route Proxying:** Nginx proxies `/api` and `/socket.io` directly to the backend running on port 5000.

## License

This project is licensed under the MIT License.
