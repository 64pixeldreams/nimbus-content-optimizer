# 🔐 Unified Auth Specification

## 🎯 **Purpose**
Single auth module for both API keys and user sessions, reusable across all projects.

## 🏗️ **Architecture**

### **Two Auth Modes**
1. **API Key Auth** - For programmatic access (CLI, CI/CD)
2. **User Auth** - For web sessions (email/password)

### **Unified Interface**
```javascript
// Both return same auth context
const auth = await AUTH.validateApiKey(request);
const auth = await AUTH.validateSession(request);

// auth = {
//   type: 'api' | 'user',
//   user_id: 'user_12345',
//   permissions: ['read', 'write'],
//   rate_limit: { requests: 1000, window: 3600 }
// }
```

## 🔑 **API Key Flow**
```
Request → Bearer Token → Hash → KV Lookup → Return Auth Context
```

## 👤 **User Auth Flow**
```
Login → Email/Password → Validate → Create Session → Set Cookie
Request → Session Cookie → KV Lookup → Return Auth Context
```

## 💾 **Storage Schema**

### **Sessions (KV)**
```javascript
// Key: session:{session_id}
{
  user_id: 'user_12345',
  email: 'user@example.com',
  created: '2024-01-01T00:00:00Z',
  expires: '2024-01-08T00:00:00Z',
  ip: '192.168.1.1',
  user_agent: 'Mozilla/5.0...'
}
```

### **Password Hashes (KV)**
```javascript
// Key: password:{email}
{
  user_id: 'user_12345',
  hash: 'argon2id$v=19$m=65536,t=3,p=4$...',
  updated: '2024-01-01T00:00:00Z'
}
```

## 🚀 **Implementation**

### **Middleware Pattern**
```javascript
// Works with any CF Worker
export async function withAuth(request, env, ctx, handler) {
  // Try API key first
  const apiAuth = await AUTH.validateApiKey(request, env);
  if (apiAuth) return handler(request, env, ctx, apiAuth);
  
  // Try session
  const sessionAuth = await AUTH.validateSession(request, env);
  if (sessionAuth) return handler(request, env, ctx, sessionAuth);
  
  // No auth
  return new Response('Unauthorized', { status: 401 });
}
```

### **Usage**
```javascript
export default {
  async fetch(request, env, ctx) {
    return withAuth(request, env, ctx, async (req, env, ctx, auth) => {
      // auth.user_id available here
      const db = DATASTORE.KV.auth(auth.user_id);
      // ... handle request
    });
  }
};
```

## 🔐 **Login/Signup Endpoints**

### **POST /auth/signup**
```javascript
{
  email: "user@example.com",
  password: "SecurePass123!"
}
// Returns: { user_id, session_token }
// Sets: HttpOnly session cookie
```

### **POST /auth/login**
```javascript
{
  email: "user@example.com",
  password: "SecurePass123!"
}
// Returns: { user_id, session_token }
// Sets: HttpOnly session cookie
```

### **POST /auth/logout**
```javascript
// Clears session cookie
// Deletes session from KV
```

### **GET /auth/me**
```javascript
// Returns current user info if authenticated
{
  user_id: "user_12345",
  email: "user@example.com",
  created: "2024-01-01T00:00:00Z"
}
```

## ✅ **Benefits**
- Single auth module for all projects
- Supports both API and user auth
- Same auth context interface
- Works with datastore auth
- Rate limiting built-in
- Session management included
- Full login/signup flow
- Secure password hashing (Argon2id)
- HttpOnly cookies for sessions
