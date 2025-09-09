# 📧 Messaging Module Specification

## 🎯 **Purpose**
Reusable email module with template support, ready for auth flows and transactional emails across all projects.

## 🏗️ **Architecture**

### **Core Interface**
```javascript
// Direct email
MESSAGING.send({
  to: 'user@example.com',
  from: 'noreply@app.com',
  subject: 'Welcome!',
  html: '<h1>Welcome aboard!</h1>'
});

// Template-based
MESSAGING.sendTemplate('password-reset', {
  to: 'user@example.com',
  from: 'noreply@app.com',
  data: {
    name: 'John',
    resetLink: 'https://app.com/reset/abc123',
    expiresIn: '1 hour'
  }
});
```

## 📁 **Module Structure**
```
/messaging/
├── index.js              // Main exports
├── send.js               // Core send function
├── template.js           // Template rendering
├── /adapters/
│   ├── mailersend.js     // MailerSend adapter
│
├── /templates/
│   ├── base.js           // Base HTML layout
│   ├── welcome.js        // User signup
│   ├── password-reset.js // Password reset
│   ├── email-verify.js   // Email verification  
│   ├── api-key-created.js // New API key
│   ├── api-key-revoked.js // Key revoked
│   └── account-deleted.js // GDPR deletion
└── /utils/
    ├── renderer.js       // Template rendering
    └── validator.js      // Email validation
```

## 📨 **MailerSend Adapter**

### **Configuration**
```javascript
// In wrangler.toml
[vars]
MAILERSEND_API_KEY = "your-api-key"
DEFAULT_FROM_EMAIL = "noreply@yourdomain.com"
DEFAULT_FROM_NAME = "Your App"
```

### **Implementation**
```javascript
// /adapters/mailersend.js
export async function sendEmail(env, params) {
  const response = await fetch('https://api.mailersend.com/v1/email', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.MAILERSEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: {
        email: params.from || env.DEFAULT_FROM_EMAIL,
        name: params.fromName || env.DEFAULT_FROM_NAME
      },
      to: [{
        email: params.to,
        name: params.toName
      }],
      subject: params.subject,
      html: params.html,
      text: params.text
    })
  });
  
  return response.ok;
}
```

## 🎨 **Template System**

### **Base Template**
```javascript
// /templates/base.js
export function baseTemplate(content, data) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; }
          .container { max-width: 600px; margin: 0 auto; }
          .header { background: #4F46E5; color: white; padding: 20px; }
          .content { padding: 20px; }
          .button { 
            background: #4F46E5; 
            color: white; 
            padding: 12px 24px; 
            text-decoration: none; 
            border-radius: 6px; 
            display: inline-block;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${data.appName || 'Your App'}</h1>
          </div>
          <div class="content">
            ${content}
          </div>
        </div>
      </body>
    </html>
  `;
}
```

### **Password Reset Template**
```javascript
// /templates/password-reset.js
import { baseTemplate } from './base.js';

export function passwordResetTemplate(data) {
  const content = `
    <h2>Hi ${data.name || 'there'},</h2>
    <p>You requested a password reset. Click the button below to create a new password:</p>
    <p style="text-align: center; margin: 30px 0;">
      <a href="${data.resetLink}" class="button">Reset Password</a>
    </p>
    <p>This link will expire in ${data.expiresIn || '1 hour'}.</p>
    <p>If you didn't request this, please ignore this email.</p>
  `;
  
  return baseTemplate(content, data);
}
```

## 🔌 **Integration with Auth System**

### **User Module Integration**
```javascript
// In user/create.js
await MESSAGING.sendTemplate('welcome', {
  to: email,
  data: { name, verifyLink }
});

// In user/password/forgot.js
await MESSAGING.sendTemplate('password-reset', {
  to: email,
  data: { name, resetLink, expiresIn: '1 hour' }
});
```

### **API Key Module Integration**
```javascript
// In api-key/generate.js
await MESSAGING.sendTemplate('api-key-created', {
  to: user.email,
  data: { keyName, keyPrefix, createdAt }
});
```

## 🎯 **Template Registry**
```javascript
const TEMPLATES = {
  'welcome': welcomeTemplate,
  'password-reset': passwordResetTemplate,
  'email-verify': emailVerifyTemplate,
  'api-key-created': apiKeyCreatedTemplate,
  'api-key-revoked': apiKeyRevokedTemplate,
  'account-deleted': accountDeletedTemplate
};
```

## ⚡ **Usage Examples**

### **Simple Email**
```javascript
await MESSAGING.send({
  to: 'user@example.com',
  subject: 'Your report is ready',
  html: '<p>Your report is attached.</p>',
  attachments: [{ filename: 'report.pdf', content: base64Data }]
});
```

### **Template with Data**
```javascript
await MESSAGING.sendTemplate('welcome', {
  to: newUser.email,
  data: {
    name: newUser.name,
    verifyLink: `https://app.com/verify/${token}`,
    appName: 'NimbusAI'
  }
});
```

## ✅ **Benefits**
- Drop-in email module for any project
- Beautiful default templates
- Easy adapter switching (MailerSend → SendGrid)
- Integrated with auth flows
- Template inheritance (base layout)
- Type-safe template data
- Automatic text version generation
