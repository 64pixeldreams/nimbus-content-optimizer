# 👤 User Management Specification

## 🎯 **Purpose**
Complete user lifecycle management - profile updates, password changes, email verification, and admin functions.

## 🏗️ **Architecture**

### **User Operations**
```javascript
USER.create(email, password)           // Creates user + auth
USER.update(userId, data)              // Update profile
USER.changePassword(userId, old, new)  // Password change
USER.delete(userId)                    // GDPR-compliant deletion
USER.verify(userId, token)             // Email verification
USER.forgotPassword(email)             // Password reset flow
USER.resetPassword(token, newPassword) // Complete reset
```

## 📧 **Email Verification Flow**
```
Signup → Generate Token → Send Email → User Clicks → Verify Token → Mark Verified
```

### **Verification Storage (KV)**
```javascript
// Key: verify:{token}
{
  user_id: 'user_12345',
  email: 'user@example.com',
  expires: '2024-01-02T00:00:00Z',
  type: 'email' | 'password_reset'
}
```

## 🔐 **Password Reset Flow**
```
Request → Validate Email → Generate Token → Send Email → Reset Form → Update Password
```

## 📊 **Extended User Schema**
```javascript
// Key: user:{user_id}
{
  user_id: 'user_12345',
  email: 'user@example.com',
  email_verified: false,
  created: '2024-01-01T00:00:00Z',
  updated: '2024-01-01T00:00:00Z',
  profile: {
    name: 'John Doe',
    company: 'Acme Corp',
    timezone: 'UTC'
  },
  settings: {
    notifications: true,
    newsletter: false
  },
  status: 'active' | 'suspended' | 'deleted'
}
```

## 🛡️ **Admin Functions**
```javascript
// List users with pagination
USER.list({ limit: 20, offset: 0, status: 'active' })

// Search by email
USER.findByEmail('user@example.com')

// Suspend/activate accounts
USER.suspend(userId, reason)
USER.activate(userId)

// View user activity
USER.getActivity(userId)
```

## 🗑️ **GDPR Compliance**
```javascript
// Soft delete (30 day grace period)
USER.delete(userId) → marks as 'deleted', anonymizes after 30 days

// Export user data
USER.export(userId) → returns all user data in JSON

// Immediate purge (on request)
USER.purge(userId) → immediate removal
```

## 🔌 **Integration Points**

### **With AUTH Module**
- USER.create() calls AUTH.hashPassword()
- Password changes invalidate all sessions
- Email verification required for login (optional)

### **With DATASTORE**
- All operations use authenticated datastore
- Automatic audit trail via _auth arrays
- Cascading deletes for user data

### **With API-KEY Module**
- User deletion revokes all API keys
- API keys inherit user status (suspended = keys disabled)

## 📁 **Implementation Structure**
```
/user/
  index.js          // Main exports
  create.js         // Signup logic
  update.js         // Profile updates
  delete.js         // GDPR deletion
  password.js       // Password operations
  verify.js         // Email verification
  admin.js          // Admin functions
  utils/
    email.js        // Email sending
    tokens.js       // Token generation
```

## ✅ **Complete Auth System**
With this module, you have:
- Full user lifecycle (create → verify → use → delete)
- Password security (change, reset, requirements)
- Email verification
- GDPR compliance
- Admin capabilities
- Clean modular structure
