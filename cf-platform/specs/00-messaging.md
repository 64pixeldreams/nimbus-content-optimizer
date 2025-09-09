# MESSAGING Module Specification

## Overview
The MESSAGING module provides messaging capabilities for the platform supporting both email (via MailerSend) and Slack notifications. It includes template management for common transactional messages.

## Core Features
- **Multi-Channel Support**: Email via MailerSend, notifications via Slack
- **Template Support**: Pre-built templates for common scenarios
- **Direct Send**: Raw message sending capability
- **Channel Selection**: Send to email, Slack, or both
- **Error Handling**: Graceful failures with detailed logging
- **Rate Limiting**: Built-in protection against API limits

## Architecture

### Module Structure
```
src/modules/messaging/
├── core/
│   └── messenger.js         # Main Messenger class
├── adapters/
│   ├── mailersend.js       # MailerSend email adapter
│   └── slack.js            # Slack notification adapter
├── templates/
│   ├── password-reset.js   # Password reset template
│   ├── welcome.js          # Welcome email template
│   ├── verification.js     # Email verification template
│   ├── api-key.js         # API key created template
│   └── slack/              # Slack-specific templates
│       ├── alert.js        # Alert notification template
│       ├── success.js      # Success notification template
│       └── error.js        # Error notification template
├── utils/
│   ├── validator.js        # Email/channel validation utilities
│   └── formatter.js        # Template formatting helpers
├── index.js               # Module exports
└── README.md             # Module documentation
```

## API Design

### Main Messenger Class
```javascript
export class Messenger {
  constructor(env, logger) {
    this.env = env;
    this.logger = logger?.init('MESSAGING') || null;
    this.adapters = {};
    this._initAdapters();
  }

  // Initialize adapters
  _initAdapters() {
    // Initialize MailerSend if configured
    if (this.env.MAILERSEND_API_KEY) {
      this.adapters.email = new MailerSendAdapter(
        this.env.MAILERSEND_API_KEY, 
        this.logger
      );
    }

    // Initialize Slack if configured
    if (this.env.SLACK_WEBHOOK_URL || this.env.SLACK_BOT_TOKEN) {
      this.adapters.slack = new SlackAdapter(
        this.env, 
        this.logger
      );
    }
  }

  // Send message via specified channel(s)
  async send(params) {
    const { channel = 'email', ...messageParams } = params;
    
    // Support multiple channels
    const channels = Array.isArray(channel) ? channel : [channel];
    const results = {};

    for (const ch of channels) {
      if (!this.adapters[ch]) {
        results[ch] = { 
          success: false, 
          error: `${ch} adapter not configured` 
        };
        continue;
      }

      results[ch] = await this.adapters[ch].send(messageParams);
    }

    return results;
  }

  // Send templated message
  async sendTemplate(templateName, params) {
    // Load template
    // Merge data
    // Call send()
  }

  // Channel-specific convenience methods
  async sendEmail(to, from, subject, html, text) {
    return this.send({
      channel: 'email',
      to, from, subject, html, text
    });
  }

  async sendSlack(channel, text, attachments) {
    return this.send({
      channel: 'slack',
      slackChannel: channel,
      text,
      attachments
    });
  }
}
```

### MailerSend Adapter
```javascript
export class MailerSendAdapter {
  constructor(apiKey, logger) {
    this.apiKey = apiKey;
    this.logger = logger;
    this.baseUrl = 'https://api.mailersend.com/v1';
  }

  async send({ to, from, subject, html, text }) {
    // Format for MailerSend API
    // Make HTTP request
    // Handle response
    // Return standardized result
  }

  async validateApiKey() {
    // Test API key validity
  }
}
```

### Slack Adapter
```javascript
export class SlackAdapter {
  constructor(env, logger) {
    this.env = env;
    this.logger = logger;
    this.webhookUrl = env.SLACK_WEBHOOK_URL;
    this.botToken = env.SLACK_BOT_TOKEN;
  }

  async send({ slackChannel, text, attachments, blocks }) {
    // Determine method (webhook vs API)
    if (this.webhookUrl && !slackChannel) {
      return this._sendWebhook({ text, attachments, blocks });
    } else if (this.botToken && slackChannel) {
      return this._sendAPI({ channel: slackChannel, text, attachments, blocks });
    }
    
    throw new Error('Slack configuration missing');
  }

  async _sendWebhook(payload) {
    // Send via webhook (simpler, limited features)
    // POST to webhook URL
  }

  async _sendAPI(payload) {
    // Send via Bot API (full features)
    // POST to https://slack.com/api/chat.postMessage
  }
}
```

## Template System

### Template Structure
```javascript
export const passwordResetTemplate = {
  name: 'password-reset',
  subject: 'Reset Your Password',
  from: {
    email: '{{FROM_EMAIL}}',
    name: '{{FROM_NAME}}'
  },
  html: `
    <h1>Reset Your Password</h1>
    <p>Hi {{name}},</p>
    <p>Click the link below to reset your password:</p>
    <a href="{{resetLink}}" style="...">Reset Password</a>
    <p>This link expires in {{expiryHours}} hours.</p>
  `,
  text: `
    Reset Your Password
    
    Hi {{name}},
    
    Click the link below to reset your password:
    {{resetLink}}
    
    This link expires in {{expiryHours}} hours.
  `,
  requiredData: ['name', 'resetLink'],
  defaultData: {
    expiryHours: 24
  }
};
```

## Usage Examples

### Basic Email Send
```javascript
const messenger = new Messenger(env, logger);

// Send simple email
const result = await messenger.sendEmail(
  'user@example.com',
  'noreply@yourapp.com',
  'Welcome!',
  '<h1>Welcome to our platform</h1>'
);
```

### Slack Notifications
```javascript
// Send to default webhook channel
await messenger.sendSlack(null, 'Deployment completed successfully! 🚀');

// Send to specific channel with formatting
await messenger.sendSlack('#alerts', null, null, [{
  type: 'section',
  text: {
    type: 'mrkdwn',
    text: '*API Error Detected*\nEndpoint: `/api/users`\nStatus: `500`'
  }
}]);

// Send to multiple channels
await messenger.send({
  channel: ['email', 'slack'],
  // Email params
  to: 'admin@example.com',
  from: 'alerts@app.com',
  subject: 'Critical Error',
  html: '<p>Error details...</p>',
  // Slack params
  slackChannel: '#critical',
  text: '🚨 Critical error detected!'
});
```

### Template Email
```javascript
// Send password reset
await messenger.sendTemplate('password-reset', 'user@example.com', {
  name: 'John Doe',
  resetLink: 'https://app.com/reset?token=xyz'
});

// Send welcome email
await messenger.sendTemplate('welcome', 'user@example.com', {
  name: 'Jane Smith',
  activationLink: 'https://app.com/activate?token=abc'
});
```

### With Options
```javascript
await messenger.sendTemplate('api-key', 'user@example.com', {
  keyName: 'Production API Key',
  keyHint: 'sk_live_...xyz'
}, {
  from: 'security@yourapp.com',  // Override default from
  replyTo: 'support@yourapp.com'
});
```

## Environment Configuration

### Required Environment Variables
```toml
# wrangler.toml
[vars]
# Email Configuration
MAILERSEND_API_KEY = "your_api_key_here"
DEFAULT_FROM_EMAIL = "noreply@yourapp.com"
DEFAULT_FROM_NAME = "Your App"

# Slack Configuration (choose one or both)
SLACK_WEBHOOK_URL = "https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX"
SLACK_BOT_TOKEN = "xoxb-your-token"  # For advanced features
```

### Optional Configuration
```toml
[vars]
EMAIL_RATE_LIMIT = "100"  # Per hour
EMAIL_RETRY_ATTEMPTS = "3"
EMAIL_TIMEOUT_MS = "5000"
SLACK_DEFAULT_CHANNEL = "#general"
```

## Error Handling

### Error Types
- `ValidationError`: Invalid email format or missing required data
- `TemplateError`: Template not found or invalid
- `MailerSendError`: MailerSend API errors
- `RateLimitError`: Too many requests
- `ConfigurationError`: Missing API keys or config

### Error Response Format
```javascript
{
  success: false,
  error: {
    type: 'ValidationError',
    message: 'Invalid email address',
    details: {
      field: 'to',
      value: 'invalid-email'
    }
  },
  logs: [...] // If logger provided
}
```

## Integration with Other Modules

### With AUTH Module
```javascript
// In auth/utils/password-reset.js
async function sendPasswordResetEmail(user, resetToken, messenger) {
  const resetLink = `https://app.com/reset?token=${resetToken}`;
  
  await messenger.sendTemplate('password-reset', user.email, {
    name: user.name,
    resetLink
  });
}
```

### With API Key Module
```javascript
// In api-key/endpoints/create.js
if (sendEmail) {
  await messenger.sendTemplate('api-key', user.email, {
    keyName: name,
    keyHint: `${prefix}_...${key.slice(-4)}`
  });
}
```

## Testing Strategy

### Mock MailerSend Client
```javascript
export class MockMailerSendClient {
  constructor() {
    this.sentEmails = [];
  }

  async send(email) {
    this.sentEmails.push(email);
    return {
      success: true,
      messageId: `mock_${Date.now()}`
    };
  }
}
```

### Test Environment
```javascript
// In tests
const messenger = new Messenger({
  MAILERSEND_API_KEY: 'test_key',
  USE_MOCK_CLIENT: true  // Use mock in tests
}, logger);
```

## Security Considerations

1. **API Key Protection**: Never log or expose API keys
2. **Input Validation**: Validate all email addresses and content
3. **Template Injection**: Sanitize template variables
4. **Rate Limiting**: Prevent email bombing
5. **SPF/DKIM**: Configure domain authentication

## Performance Optimization

1. **Async Operations**: All email sends are non-blocking
2. **Retry Logic**: Automatic retries with exponential backoff
3. **Batch Sending**: Group multiple emails when possible
4. **Template Caching**: Cache compiled templates

## Future Enhancements

1. **Email Tracking**: Open/click tracking via MailerSend
2. **Attachments**: File attachment support
3. **Scheduling**: Delayed send capability via MailerSend
4. **Webhooks**: Delivery status notifications from MailerSend
5. **Bulk Sending**: Utilize MailerSend's bulk email API
