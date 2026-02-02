# Beauty Parlor Management System - Backend

Backend API for the Beauty Parlor Management System built with Node.js, Express, and MySQL.

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Setup

Generate a baseline `.env` file (includes JWT secret placeholder) by running:

```bash
npm run setup
```

Then edit `backend/.env` to fill in `DB_PASSWORD` (and any other overrides). If you prefer to craft the file manually, use the template below.

### 3. Database Setup

1. Make sure MySQL is running on your system
2. Restore the full database (core + staff + ecommerce) from the unified dump:

```bash
mysql -u root -p < database/beauty_parlor_full_schema.sql
```

This script drops any existing `beauty_parlor` schema, recreates all tables, and seeds sample data so every module works immediately. You can also import it with MySQL Workbench or phpMyAdmin if you prefer a GUI.

> Legacy files (`schema.sql`, `schema_updates.sql`, `schema_final.sql`, `ecommerce_schema.sql`) are still available for reference, but the new `beauty_parlor_full_schema.sql` is the only file you need for a clean setup.

### 4. Environment Configuration

Create a `.env` file in the backend root directory:

```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=beauty_parlor
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRE=7d
NODE_ENV=development
```

### 4. Default Credentials / Admin Script (optional)

After importing `beauty_parlor_full_schema.sql`, you can log in immediately using:

- Admin: `admin@beautyparlor.com` / `admin123`
- Sample user: `jane@example.com` / `user123`

If you need to recreate the admin (for example after manual cleanup), run:

```bash
node scripts/createAdmin.js
```

**Important:** Change the admin password after first login!

### 5. Run database migrations (existing setups)

If you already had the project running before pulling the latest changes, align your schema with the new bulk-booking tables by running:

```bash
npm run migrate
```

Populate fresh availability slots anytime with:

```bash
npm run populate-availability
```

### 6. Start the Server

Development mode (with auto-reload):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

The server will run on `http://localhost:5000`

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration

### Services
- `GET /api/services` - Get all services
- `GET /api/services/:id` - Get single service
- `POST /api/services` - Create service (admin only)
- `PUT /api/services/:id` - Update service (admin only)
- `DELETE /api/services/:id` - Delete service (admin only)

### Availability
- `GET /api/availability/service/:serviceId` - Get availability for a service
- `POST /api/availability` - Set availability (admin only)

### Bookings
- `POST /api/bookings` - Create booking (authenticated)
- `GET /api/bookings/my-bookings` - Get user bookings
- `PUT /api/bookings/:id/cancel` - Cancel booking

### Admin
- `GET /api/admin/dashboard` - Get dashboard stats
- `GET /api/admin/appointments` - Get all appointments
- `GET /api/admin/booking-history` - Get booking history

## Authentication

All protected routes require a JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

## Database Schema

The database includes the following tables:
- `users` - User accounts (users and admins)
- `services` - Beauty parlor services
- `availability` - Service time slot availability
- `bookings` - User bookings

See `database/beauty_parlor_full_schema.sql` for the complete schema snapshot.

