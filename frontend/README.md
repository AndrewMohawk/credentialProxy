# Credential Proxy Frontend

This is the frontend application for the Credential Proxy system, built with Next.js, React, and TypeScript.

## API Client

The application uses a centralized API client for making requests to the backend. This ensures consistent handling of authentication, error management, and response formatting.

### Key Features

- **Centralized Authentication**: Token management is handled in one place
- **Consistent Error Handling**: All API errors are processed uniformly
- **Type Safety**: TypeScript interfaces for API responses
- **Simplified API Calls**: Wrapper methods for common HTTP methods

### Usage

```typescript
import apiClient from "@/lib/api-client";

// GET request
const getData = async () => {
  try {
    const response = await apiClient.get('/endpoint');
    if (response.success) {
      // Handle successful response
      return response.data;
    }
  } catch (error) {
    // Error is already formatted with a meaningful message
    console.error(error.message);
  }
};

// POST request
const createItem = async (data) => {
  try {
    const response = await apiClient.post('/endpoint', data);
    return response.success;
  } catch (error) {
    console.error(error.message);
    return false;
  }
};
```

### Authentication

The API client automatically handles authentication tokens:

1. On login/registration, the token is stored and set in the client
2. All subsequent requests include the token
3. On logout, the token is cleared

### Error Handling

The client provides consistent error handling across all API requests:

- Network errors
- API errors (400, 500 responses)
- Validation errors
- Authentication errors

### Response Handling

The API client handles different response formats:

1. **Standard API Response**: If the backend returns a response with a `success` property, it's passed through as is:
   ```json
   {
     "success": true,
     "data": { ... }
   }
   ```

2. **Success Response with Root Properties**: If the backend returns a response with a `success` property but without a `data` property, it automatically collects all non-metadata properties into the `data` property:
   ```json
   // API returns:
   {
     "success": true,
     "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   }
   
   // Client transforms to:
   {
     "success": true,
     "data": {
       "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
     }
   }
   ```

3. **Direct Data Response**: If the backend returns data without the standard wrapper, the client automatically wraps it:
   ```json
   // API returns:
   { "id": 1, "name": "Example" }
   
   // Client transforms to:
   {
     "success": true,
     "data": { "id": 1, "name": "Example" }
   }
   ```

4. **Primitive Response**: For string or other primitive responses, the client wraps them:
   ```json
   // API returns:
   "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   
   // Client transforms to:
   {
     "success": true,
     "data": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   }
   ```

This ensures consistent response handling throughout the application, regardless of the API endpoint's response format.

## Project Structure

- `/app`: Next.js app router pages
- `/components`: Reusable React components
- `/hooks`: Custom React hooks
- `/lib`: Utility functions and services
  - `/api-client.ts`: Centralized API client
- `/styles`: Global styles and theme configuration

## Development

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Build for production:
```bash
npm run build
```

## Environment Variables

Create a `.env.local` file with the following variables:

```
NEXT_PUBLIC_API_URL=http://localhost:4242/api/v1
NEXT_PUBLIC_FRONTEND_URL=http://localhost:3000
``` 