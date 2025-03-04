# Credential Proxy Setup Guide

This guide will help you set up and run the Credential Proxy system, including the passkey authentication functionality using `credentialproxy.andrewmohawk.xyz`.

## Prerequisites

- Node.js (v18+)
- PostgreSQL
- Redis (for BullMQ queue)
- A domain with HTTPS configured (for WebAuthn/passkey support)

## Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd credential-proxy
```

### 2. Install Dependencies

```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..
```

### 3. Set Up Environment Variables

Create a `.env` file in the root directory with the following variables:

```
# Server Configuration
PORT=3000
NODE_ENV=development

# Auth Configuration
JWT_SECRET=replace_with_a_secure_random_string_in_production

# WebAuthn/Passkey Configuration
PASSKEY_RP_ID=credentialproxy.andrewmohawk.xyz
PASSKEY_RP_NAME=Credential Proxy
PASSKEY_ORIGIN=https://credentialproxy.andrewmohawk.xyz

# Database Configuration
DATABASE_URL="postgresql://username:password@<DB_HOST>:5432/credential_proxy?schema=public"
```

Replace the database connection string with your actual PostgreSQL credentials. The default `<DB_HOST>` is `localhost` if not specified otherwise.

### 4. Set Up the Database

```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations to set up the database schema
npm run prisma:migrate
```

### 5. Development Setup

#### Option 1: Using a Reverse Proxy (Recommended for Production)

1. Configure your reverse proxy (Nginx, Apache, etc.) to forward traffic from `https://credentialproxy.andrewmohawk.xyz` to `http://<HOST>:<FRONTEND_PORT>`
2. Start the development servers:

```bash
npm run dev
```

Where:
- `<HOST>` is the configured host (defaults to 'localhost')
- `<FRONTEND_PORT>` is the configured frontend port (defaults to 3000)

#### Option 2: Local Development with Domain

1. Update your hosts file (`/etc/hosts` on macOS/Linux, `C:\Windows\System32\drivers\etc\hosts` on Windows):

```
127.0.0.1 credentialproxy.andrewmohawk.xyz
```

2. Start the development servers:

```bash
npm run dev
```

## Using the Cookie Plugin

The Cookie Plugin allows you to securely store and use browser cookies as credentials without exposing them to third-party applications.

### Example: Adding a Cookie Credential

1. Log in to the Credential Proxy
2. Navigate to the Credentials page
3. Click "Add Credential"
4. Select "Cookie" as the type
5. Enter a name for the credential
6. Enter the cookie data in the format:
   ```
   session=abc123; domain=example.com; path=/; secure; httpOnly
   ```
7. Click "Save Credential"

### Example: Using the Cookie Plugin in Code

```javascript
// Third-party application code
const proxyRequest = {
  applicationId: 'your-app-id',
  credentialId: 'credential-id',
  operation: 'add_cookies_to_request',
  parameters: {
    headers: { 'User-Agent': 'Example App' },
    domain: 'example.com',
    path: '/'
  },
  timestamp: Date.now(),
  signature: '...' // Signed with your application's private key
};

// Send to proxy
const result = await fetch('https://credentialproxy.andrewmohawk.xyz/api/v1/proxy', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(proxyRequest)
});

// Use the headers with cookies
const apiResponse = await fetch('https://example.com/api', {
  headers: result.data.headers
});
```

## Using Passkey Authentication

### Registering a Passkey

1. Log in to the Credential Proxy using your username and password
2. Navigate to the Dashboard
3. Click "Register New Passkey"
4. Follow the browser's prompts to register your device (TouchID, FaceID, Windows Hello, etc.)

### Logging in with a Passkey

1. Enter your username on the login page
2. Click "Use Passkey"
3. Follow the browser's prompts to authenticate with your device

## Running in Production

For production deployment:

1. Build the application:
   ```bash
   npm run build
   ```

2. Start the server:
   ```bash
   npm start
   ```

## Troubleshooting

### WebAuthn/Passkey Issues

- WebAuthn requires HTTPS in production environments
- Make sure the domain name matches the `PASSKEY_RP_ID` in your environment variables
- Check browser compatibility (all modern browsers support WebAuthn)

### Reverse Proxy Configuration

If you're using a reverse proxy, ensure it's properly configured to:

1. Pass the correct host headers
2. Forward both HTTP and WS (WebSocket) traffic
3. Set the `X-Forwarded-Proto` header to `https` for proper HTTPS detection 