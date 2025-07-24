# Auth Service Installation and Setup

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or remote connection)

## Installation Steps

### 1. Navigate to auth-service directory

```bash
cd auth-service
```

### 2. Install dependencies

```bash
npm install
```

### 3. Environment Setup

Create a `.env` file in the auth-service root directory with the following variables:

```env
PORT=3002
MONGODB_URI=mongodb://localhost:27017/realtimechart_auth
JWT_SECRET=your-super-secret-jwt-key-here-change-this-in-production
NODE_ENV=development
```

**Important**: Replace `your-super-secret-jwt-key-here-change-this-in-production` with a strong, unique secret key.

### 4. MongoDB Setup

#### Option A: Local MongoDB

1. Install MongoDB locally
2. Start MongoDB service
3. Use the connection string: `mongodb://localhost:27017/realtimechart_auth`

#### Option B: MongoDB Atlas (Cloud)

1. Create a free account at https://www.mongodb.com/cloud/atlas
2. Create a new cluster
3. Get your connection string
4. Update MONGODB_URI in `.env` file:
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/realtimechart_auth?retryWrites=true&w=majority
   ```

### 5. Start the Auth Service

```bash
npm start
```

The auth service will start on port 3002.

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/verify` - Verify JWT token

### Users

- `GET /api/users/profile` - Get user profile (requires auth)
- `PUT /api/users/profile` - Update user profile (requires auth)

### Payments

- `GET /api/payments` - Get user payments (requires auth)
- `POST /api/payments` - Create payment record (requires auth)

## Database Schema

### User Model

```javascript
{
  username: String (required, unique)
  email: String (required, unique)
  password: String (required, hashed)
  role: String (default: 'user')
  createdAt: Date
  updatedAt: Date
}
```

### Payment Model

```javascript
{
  userId: ObjectId (reference to User)
  amount: Number (required)
  currency: String (default: 'USD')
  status: String (pending/completed/failed)
  paymentMethod: String
  description: String
  createdAt: Date
  updatedAt: Date
}
```

## Frontend Integration

The frontend has been updated with:

- `AuthContext` for authentication state management
- `LoginPage` and `RegisterPage` components
- Protected routes that require authentication
- User info display in header with logout functionality

### Frontend Auth Flow

1. User visits any protected route
2. If not authenticated, redirected to login/register page
3. After successful login/register, redirected to requested page
4. JWT token stored in localStorage and used for API calls
5. User can logout which clears token and redirects to auth page

## Security Features

- Password hashing with bcrypt
- JWT token authentication
- Rate limiting (100 requests per 15 minutes)
- CORS configuration
- Input validation with Joi
- Security headers with Helmet

## Development Notes

- Auth service runs on port 3002
- Frontend runs on port 5173
- All API calls from frontend go to http://localhost:3002
- Tokens expire after 24 hours

## Production Deployment

1. Set `NODE_ENV=production` in environment
2. Use a strong, unique JWT_SECRET
3. Configure proper MongoDB connection
4. Set up HTTPS
5. Configure proper CORS origins
6. Consider using environment-specific configurations
