# 📊 Logging Module Specification

## 🎯 **Purpose**
Centralized, context-aware logging for debugging, audit trails, and AI operation tracking across all projects.

## 🏗️ **Architecture**

### **Core Interface**
```javascript
// Initialize with module context
const logger = LOGS.init('DATASTORE.put');

// Log with automatic context (only if enabled)
logger.log('Storing user data', { userId: '123' });
// Output: [DATASTORE.put] Storing user data {userId: '123'}

// Error with stack trace (always logged)
logger.error('KV write failed', err);
// Output: [DATASTORE.put] ERROR: KV write failed
//         Stack: Error at line 42...

// Performance control
LOGS.off();          // Disable all except errors
LOGS.errorsOnly();   // Only log errors and fatals
LOGS.on();           // Enable all logging
LOGS.setLevel('warn'); // Log warn and above

// Create persistent log for specific operations
const savedLog = LOGS.saved(DATASTORE, auth, pageId);
savedLog.log('AI Optimization Started');
savedLog.log('Prompt sent to GPT-4', { tokens: 1500 });
savedLog.log('Response received: 200', { duration: '2.3s' });
await savedLog.persist(); // Saves to datastore
```

## 📝 **Log Levels**

```javascript
logger.debug('Detailed info for development');    // Only in dev
logger.log('Normal operation info');             // Always
logger.warn('Something suspicious');             // Always
logger.error('Something failed', error);         // Always + stack
logger.fatal('System is broken', error);         // Always + alert
```

## 🎯 **Smart Features**

### **1. Automatic Request Context**
```javascript
// Set once at request start
LOGS.setRequest({
  requestId: crypto.randomUUID(),
  userId: auth.user_id,
  projectId: request.params.projectId,
  url: request.url,
  method: request.method
});

// All logs automatically include context
logger.log('Processing page');
// Output: [req:abc123][user:cust_456][PAGE.process] Processing page
```

### **2. AI Operation Tracking**
```javascript
const aiLogger = logger.init('AI.optimize');

// Track prompt/response
aiLogger.log('Sending prompt', {
  model: 'gpt-4',
  promptTokens: 1500,
  prompt: prompt.substring(0, 100) + '...' // Truncate for logs
});

aiLogger.log('AI response received', {
  responseTokens: 500,
  duration: '2.3s',
  success: true
});

// Built-in timing
const timer = aiLogger.timer('optimization');
// ... do work ...
timer.end(); // Logs: [AI.optimize] optimization took 2.34s
```

### **3. Structured Output**
```javascript
// Returns logs as structured data
const logs = LOGS.getStructured();
/*
[
  {
    timestamp: '2024-01-01T12:00:00Z',
    level: 'info',
    context: 'DATASTORE.put',
    message: 'Storing user data',
    data: { userId: '123' },
    request: { id: 'abc123', userId: 'cust_456' }
  }
]
*/
```

## 💾 **Persistence Options**

### **1. Return in Error Responses**
```javascript
try {
  // ... operation ...
} catch (err) {
  logger.error('Operation failed', err);
  return new Response(JSON.stringify({
    error: err.message,
    logs: LOGS.getRecent(10), // Last 10 log entries
    requestId: LOGS.getRequestId()
  }), { status: 500 });
}
```

### **2. Save to D1 for Audit**
```javascript
// At end of request
await LOGS.persist(env.NIMBUS_DB, {
  table: 'audit_logs',
  retention: '30d',
  level: 'info' // Only save info and above
});
```

### **3. Stream to External Service**
```javascript
// For production monitoring
await LOGS.stream({
  service: 'datadog', // or 'logtail', 'axiom'
  apiKey: env.LOG_API_KEY,
  batch: true
});
```

## 🔧 **Implementation Pattern**

```javascript
// /modules/logs/index.js
class Logger {
  constructor(context = '') {
    this.context = context;
    this.logs = [];
    this.requestContext = {};
    this.level = 'info'; // Default level
    this.enabled = true;
  }
  
  // Performance controls
  static off() { 
    this.enabled = false; 
    this.level = 'error'; 
  }
  
  static on() { 
    this.enabled = true; 
    this.level = 'debug'; 
  }
  
  static errorsOnly() { 
    this.enabled = true; 
    this.level = 'error'; 
  }
  
  static setLevel(level) {
    this.level = level;
    this.enabled = true;
  }
  
  init(subContext) {
    const newContext = this.context 
      ? `${this.context}.${subContext}` 
      : subContext;
    const subLogger = new Logger(newContext);
    subLogger.logs = this.logs; // Share log array
    subLogger.requestContext = this.requestContext;
    subLogger.level = Logger.level;
    subLogger.enabled = Logger.enabled;
    return subLogger;
  }
  
  log(message, data = {}) {
    // Skip if disabled or below threshold
    if (!Logger.enabled || !this.shouldLog('info')) return;
    
    const entry = {
      timestamp: new Date().toISOString(),
      level: 'info',
      context: this.context,
      message,
      data,
      ...this.requestContext
    };
    
    this.logs.push(entry);
    if (Logger.consoleEnabled) console.log(this.format(entry));
  }
  
  error(message, error) {
    // ALWAYS log errors
    const entry = {
      timestamp: new Date().toISOString(),
      level: 'error',
      context: this.context,
      message,
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name
      },
      ...this.requestContext
    };
    
    this.logs.push(entry);
    console.error(this.format(entry));
  }
  
  shouldLog(level) {
    const levels = { debug: 0, info: 1, warn: 2, error: 3, fatal: 4 };
    return levels[level] >= levels[Logger.level];
  }
  
  format(entry) {
    const ctx = entry.requestId ? `[${entry.requestId}]` : '';
    const user = entry.userId ? `[${entry.userId}]` : '';
    const module = entry.context ? `[${entry.context}]` : '';
    
    return `${ctx}${user}${module} ${entry.message}`;
  }
  
  // Create a saved log for persistent storage
  static saved(datastore, auth, entityId) {
    return new SavedLogger(datastore, auth, entityId);
  }
}

// Saved logger for persistent audit trails
class SavedLogger {
  constructor(datastore, auth, entityId) {
    this.datastore = datastore.auth(auth.user_id);
    this.entityId = entityId;
    this.entries = [];
    this.startTime = Date.now();
  }
  
  log(message, data = {}) {
    this.entries.push({
      timestamp: new Date().toISOString(),
      message,
      data,
      elapsed: Date.now() - this.startTime
    });
  }
  
  async persist() {
    const logId = `${this.entityId}:${Date.now()}`;
    await this.datastore.put('LOG', logId, {
      entityId: this.entityId,
      type: 'ai_optimization',
      startTime: new Date(this.startTime).toISOString(),
      duration: Date.now() - this.startTime,
      entries: this.entries,
      summary: this.generateSummary()
    });
  }
  
  generateSummary() {
    return {
      total_steps: this.entries.length,
      duration_ms: Date.now() - this.startTime,
      success: !this.entries.some(e => e.message.includes('ERROR'))
    };
  }
}

// Static methods
Logger.level = 'info';
Logger.enabled = true;
Logger.consoleEnabled = true;

// Singleton instance
export const LOGS = new Logger();
```

## 🎯 **Usage Examples**

### **In Route Handler**
```javascript
export async function createProject(request, env, ctx, auth) {
  const logger = LOGS.init('PROJECT.create');
  
  logger.log('Creating project', { userId: auth.user_id });
  
  try {
    const data = await request.json();
    logger.debug('Request data', data);
    
    const db = DATASTORE.init(env, logger); // Pass logger!
    const project = await db.put('PROJECT', id, data);
    
    logger.log('Project created', { projectId: id });
    return response.json({ project });
    
  } catch (err) {
    logger.error('Failed to create project', err);
    return response.error('Creation failed', 500, {
      logs: LOGS.getRecent(20),
      requestId: LOGS.getRequestId()
    });
  }
}
```

### **In Datastore Module**
```javascript
class KVAdapter {
  constructor(env, logger) {
    this.env = env;
    this.logger = logger.init('KV');
  }
  
  async get(class, id) {
    const timer = this.logger.timer('get');
    
    try {
      this.logger.debug(`Getting ${class}:${id}`);
      const data = await this.kv.get(key);
      
      timer.end();
      return data;
      
    } catch (err) {
      this.logger.error(`Failed to get ${class}:${id}`, err);
      timer.end();
      throw err;
    }
  }
}
```

## 💾 **Saved Logs Example - AI Optimization**

```javascript
// In AI optimization route
export async function optimizePage(request, env, ctx, auth) {
  const { pageId } = await request.json();
  
  // Create saved log for this optimization
  const auditLog = LOGS.saved(DATASTORE.init(env), auth, pageId);
  
  try {
    auditLog.log('Optimization started', { 
      model: 'gpt-4',
      pageId 
    });
    
    // Extract content
    const content = await extractContent(pageId);
    auditLog.log('Content extracted', { 
      contentLength: content.length 
    });
    
    // Send to AI
    const prompt = buildPrompt(content);
    auditLog.log('Sending prompt to AI', { 
      promptTokens: countTokens(prompt),
      model: 'gpt-4'
    });
    
    const aiResponse = await callOpenAI(prompt);
    auditLog.log('AI response received: 200', { 
      responseTokens: aiResponse.usage.completion_tokens,
      duration: '2.3s'
    });
    
    // Apply optimizations
    const result = await applyOptimizations(pageId, aiResponse);
    auditLog.log('Optimizations applied', { 
      changes: result.changeCount 
    });
    
    // Persist the audit trail
    await auditLog.persist();
    
    return response.json({ success: true, pageId });
    
  } catch (err) {
    auditLog.log('ERROR: ' + err.message, { 
      stack: err.stack 
    });
    await auditLog.persist();
    throw err;
  }
}

// Later, retrieve the log
const logs = await db.get('LOG', `${pageId}:${timestamp}`);
/* Returns:
{
  entityId: 'page_123',
  type: 'ai_optimization',
  duration: 3250,
  entries: [
    { message: 'Optimization started', elapsed: 0 },
    { message: 'Content extracted', elapsed: 120 },
    { message: 'Sending prompt to AI', elapsed: 150 },
    { message: 'AI response received: 200', elapsed: 2450 },
    { message: 'Optimizations applied', elapsed: 3200 }
  ],
  summary: {
    total_steps: 5,
    duration_ms: 3250,
    success: true
  }
}
*/
```

## ✅ **Benefits**

1. **Fast Debugging** - Error responses include relevant logs
2. **Context Preservation** - Know exactly where errors occur
3. **AI Operation Visibility** - Track prompts, responses, timing
4. **Performance Monitoring** - Built-in timers
5. **Audit Trail** - Persist important operations
6. **Zero External Dependencies** - Works everywhere
7. **Minimal Performance Impact** - Only strings in memory
8. **Production Ready** - Turn off/on based on environment
9. **Saved Logs** - Persistent audit trails for important operations

## 🚀 **Advanced Features**

### **Log Sampling**
```javascript
// In production, only log 10% of requests
LOGS.setSampling(0.1);
```

### **Sensitive Data Masking**
```javascript
logger.log('User login', {
  email: 'user@example.com',
  password: '[REDACTED]' // Auto-masked
});
```

### **Log Correlation**
```javascript
// Correlate logs across services
LOGS.setCorrelationId(request.headers.get('X-Correlation-ID'));
```

This logging system will save HOURS of debugging time! 🎯
