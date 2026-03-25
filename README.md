# Rajesh Hostel React App

This is a React (Vite) rewrite of the original static HTML hostel project. It preserves the same UI and localStorage-based functionality:

- Public pages: Home, Hostel Info, Menu
- Admin: Login/Registration, Dashboard
- Room Allocation: Double / Triple / Four (with image upload, occupant CRUD, room status)
- Fee Management: Aggregate students across room types and record payments with history

## Features

### New Admin Registration System
When a new admin registers, they can configure:
- Hostel name
- Number of double sharing rooms and starting room number
- Number of triple sharing rooms and starting room number
- Number of four sharing rooms and starting room number

This configuration is stored and used throughout the system. Existing admins simply login.

### Room Management
- Dynamic room allocation based on admin configuration
- Image upload for student profiles
- Room status tracking (available, occupied, maintenance)
- Student CRUD operations

### Fee Management
- Track payments per student
- Payment history
- Aggregated view across all room types

## Quick start

1. Move your images into the app's public folder so they are served statically:
   - Copy `../images/` to `./public/images/`
   - After copy, you should have files like `hostel-react/public/images/hostel1.png`.

2. Install dependencies and start the dev server:

```bash
npm install
npm run dev
```

3. Build for production:

```bash
npm run build
npm run preview
```

## First Time Setup

1. Navigate to `/login`
2. Click the "Register" tab
3. Fill in:
   - Hostel name (e.g., "Rajesh Hostel")
   - Admin username and password
   - Room configuration (counts and starting room numbers)
4. Click "Register & Setup"
5. The system will initialize all rooms based on your configuration

## Subsequent Logins

Once registered, simply use the "Login" tab with your credentials.

## Notes

- Admin auth uses `localStorage` token `adminToken`.
- Admin credentials and hostel config stored in `localStorage` keys `adminData` and `hostelConfig`.
- Dark mode preference is stored in `localStorage` key `theme` as `dark` or `light`.
- Room data is stored per room type:
  - `hostelRooms_Double`, `hostelRooms_Triple`, `hostelRooms_Four`
- Each occupant includes fields used by Fee Management: `name`, `studentId`, `college`, `parentName`, `parentPhone`, `address`, `room`, `roomType`, optional `profileImg`, and `payments` array.
- Fee Management currently provides a payments ledger per student and shows total paid. If you want monthly fee tracking/due calculations, we can extend it with a configurable fee table and calendar-based dues.
