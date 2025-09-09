# 🏗️ Implementation Guide - Enforcing Modular Architecture

## 🎯 **Core Principles**

### **1. File Size Limits**
- **HARD LIMIT**: 150 lines per file
- **IDEAL**: 50-100 lines per file
- **Exception**: Test files can be longer

### **2. Single Responsibility**
```javascript
// ❌ BAD: user.js (500 lines doing everything)
export function createUser() { ... }
export function updateUser() { ... }
export function deleteUser() { ... }
export function sendWelcomeEmail() { ... }

// ✅ GOOD: Separate files
// user/create.js (50 lines)
import { Datastore } from '../datastore';
import { MESSAGING } from '../messaging';

export async function createUser(email, password, env) {
  // Initialize datastore with env
  const DATASTORE = new Datastore(env);
  const db = DATASTORE.auth(userId);
  
  // Just creates user
  const user = await db.put('USER', id, data);
  await MESSAGING.sendTemplate('welcome', { to: email });
  return user;
}
```

## 📁 **Mandatory Structure**

### **Module Checklist**
Every module MUST have:
```
/module-name/
├── index.js          # Public API only (< 20 lines)
├── README.md         # Usage examples
├── /core/            # Core business logic
├── /utils/           # Shared utilities
└── /tests/           # Unit tests
```

### **index.js Pattern**
```javascript
// ✅ CORRECT: index.js only exports, no logic
export { createUser } from './core/create.js';
export { updateUser } from './core/update.js';
export { deleteUser } from './core/delete.js';

// ❌ WRONG: Logic in index.js
export function createUser() {
  // 200 lines of code here
}
```

## 🚫 **Anti-Patterns to Avoid**

### **1. Direct External Calls**
```javascript
// ❌ NEVER DO THIS
async function resetPassword(email) {
  // Hardcoded email sending
  await fetch('https://api.mailersend.com/v1/email', {
    // ... hardcoded email logic
  });
}

// ✅ ALWAYS DO THIS
import { MESSAGING } from '../messaging';
async function resetPassword(email) {
  await MESSAGING.sendTemplate('password-reset', {
    to: email,
    data: { resetLink }
  });
}
```

### **2. Mixed Concerns**
```javascript
// ❌ BAD: Auth logic mixed with user logic
async function createUser(email, password) {
  const hash = await bcrypt.hash(password); // Auth concern!
  const user = await db.put(...);
  await sendEmail(...); // Messaging concern!
}

// ✅ GOOD: Clean separation
import { Datastore } from '../datastore';
import { AUTH } from '../auth';
import { MESSAGING } from '../messaging';

async function createUser(email, password, env, userId) {
  const DATASTORE = new Datastore(env);
  const db = DATASTORE.auth(userId);
  
  const hash = await AUTH.hashPassword(password);
  const user = await db.put('USER', id, { email, hash });
  await MESSAGING.sendTemplate('welcome', { to: email });
  return user;
}
```

## 🔌 **Module Initialization Pattern**

### **All modules receive `env` from Cloudflare Worker**
```javascript
// In your route handler
export async function handleRequest(request, env, ctx, auth) {
  // Initialize modules with env
  const DATASTORE = new Datastore(env);
  const db = DATASTORE.auth(auth.user_id);
  
  // Modules that need env
  const logger = LOGS.init('MODULE.function');
  const messaging = new Messaging(env);
  
  // Use the initialized modules
  await db.put('USER', userId, userData);
  logger.log('User created');
  await messaging.sendTemplate('welcome', { to: email });
}
```

### **Never access env.KV directly**
```javascript
// ❌ WRONG: Direct KV access
const user = await env.NIMBUS_USERS.get(`user:${id}`);

// ✅ CORRECT: Through DATASTORE
const db = new Datastore(env);
const user = await db.get('USER', id);
```

## 📋 **Pre-Implementation Checklist**

Before writing ANY code:

- [ ] Is there a spec for this module?
- [ ] Will any file exceed 150 lines?
- [ ] Are concerns properly separated?
- [ ] Are you using existing modules (AUTH, DATASTORE, MESSAGING)?
- [ ] Is the folder structure correct?
- [ ] Do you know how to pass `env` to modules that need it?

## 🔍 **Code Review Rules**

### **Automatic Rejection Criteria**
1. Any file > 150 lines
2. Hardcoded external service calls
3. Missing index.js exports
4. Logic in index.js
5. No tests for new functions

### **Import Hierarchy**
```javascript
// ✅ CORRECT: Using module interfaces
import { Datastore } from '../datastore';
import { AUTH } from '../auth';
import { MESSAGING } from '../messaging';
import { LOGS } from '../logs';

// ❌ WRONG: Reaching into module internals
import { hashPassword } from '../auth/utils/hash.js';
import { sendEmail } from '../messaging/adapters/mailersend.js';
import { KVAdapter } from '../datastore/adapters/kv.js';
```

## 🧪 **Testing Requirements**

### **Each Module Must Have**
```javascript
// /module/tests/create.test.js
import { createUser } from '../core/create.js';

test('creates user with valid data', async () => {
  const user = await createUser('test@example.com', 'password');
  expect(user.email).toBe('test@example.com');
});
```

## 📝 **Documentation Pattern**

### **Every Exported Function**
```javascript
/**
 * Creates a new user with email verification
 * @param {string} email - User email
 * @param {string} password - Plain text password
 * @returns {Promise<User>} Created user object
 * @throws {ValidationError} If email invalid
 * @example
 * const user = await createUser('user@example.com', 'SecurePass123');
 */
export async function createUser(email, password) {
  // Implementation
}
```

## 🚀 **Enforcement Strategy**

### **1. Linting Rules**
```javascript
// .eslintrc.js
module.exports = {
  rules: {
    'max-lines': ['error', { max: 150 }],
    'max-lines-per-function': ['error', { max: 50 }],
    'no-restricted-imports': ['error', {
      patterns: [
        '*/internal/*',
        '*/adapters/*'
      ]
    }]
  }
};
```

### **2. Pre-commit Hooks**
```bash
# Check file sizes
find . -name "*.js" -not -path "*/tests/*" -exec wc -l {} + | awk '$1 > 150'
```

### **3. Module Interface Contract**
```javascript
// Each module must export this structure
export default {
  // Module info
  name: 'auth',
  version: '1.0.0',
  
  // Public API
  api: {
    validateApiKey,
    validateSession,
    createSession
  },
  
  // Dependencies
  requires: ['datastore', 'messaging']
};
```

## ✅ **Benefits of This Approach**

1. **Debugging** - Small files = easy to find issues
2. **Testing** - Single responsibility = simple tests
3. **Reusability** - Clean interfaces = drop into any project
4. **Maintenance** - Clear structure = anyone can contribute
5. **Scalability** - Modular = easy to extend

## 🔑 **Key Naming Patterns**

### **Always use consistent KV key patterns**
```javascript
// ✅ CORRECT: Singular for entities
'user:user_12345'
'project:proj_abc123'
'page:proj_123:page_456'
'apikey:sha256_hash'

// ✅ CORRECT: Plural for lists
'projects:user_12345'  // Array of project IDs
'apikeys:user_12345'   // Array of API key hashes

// ❌ WRONG: Inconsistent patterns
'users:user_12345'     // Should be 'user:'
'project:user_12345'   // Should be 'projects:' for list
```

### **Composite keys use colons**
```javascript
// For page belonging to project
const pageKey = `page:${projectId}:${pageId}`;

// For status of a page
const statusKey = `status:${projectId}:${pageId}`;
```

## 🎯 **The Golden Rule**

> "If you can't explain what a file does in one sentence, it's doing too much."

Follow this guide and you'll have a codebase that's a joy to work with, not a nightmare to maintain!
