# 📄 Pages Module

Complete page management system for NimbusAI content optimization platform.

## 🎯 **Overview**

The Pages module provides CRUD operations for managing web pages through the NimbusAI optimization pipeline. It integrates with the DataModel framework for hybrid KV/D1 storage and supports the complete workflow from extraction to optimization.

## 🚀 **Functions**

### **page.create**
Creates a new page from extracted content data.

```javascript
POST /api/function
{
  "action": "page.create",
  "data": {
    "project_id": "project:xyz789",
    "url": "/watch-repairs-ashford.html", 
    "title": "Watch Repairs in Ashford",
    "content": "<html>...</html>",
    "extracted_data": { /* gulp extraction results */ },
    "metadata": { /* page metadata */ }
  }
}
```

### **page.get**
Retrieves a page by ID with full content.

```javascript
POST /api/function
{
  "action": "page.get",
  "data": {
    "page_id": "page:mf8y0hsj194812"
  }
}
```

### **page.list**
Lists pages with filtering and pagination.

```javascript
POST /api/function
{
  "action": "page.list",
  "data": {
    "project_id": "project:xyz789", // optional filter
    "status": "extracted",          // optional filter
    "limit": 50,                    // optional, max 100
    "offset": 0                     // optional pagination
  }
}
```

### **page.update**
Updates page content, status, or metadata.

```javascript
POST /api/function
{
  "action": "page.update",
  "data": {
    "page_id": "page:mf8y0hsj194812",
    "status": "optimized",
    "optimized_content": "<html>optimized...</html>",
    "processing_time_ms": 1500
  }
}
```

### **page.remove**
Soft deletes a page (marks as deleted).

```javascript
POST /api/function
{
  "action": "page.remove",
  "data": {
    "page_id": "page:mf8y0hsj194812"
  }
}
```

## 🏗️ **Data Model**

Pages use the hybrid KV/D1 storage model:

- **KV Storage**: Full content, extracted_data, optimized_content
- **D1 Storage**: Metadata for querying (page_id, project_id, status, etc.)
- **Auth Context**: User-scoped access control
- **Soft Delete**: Preserves data while marking as deleted

## 🔄 **Status Flow**

```
extracted → processing → optimized → published
     ↓
   failed (error state)
```

## 🧪 **Testing**

```bash
# Test page creation
curl -X POST https://your-worker.workers.dev/api/function \
  -H "Content-Type: application/json" \
  -d '{
    "action": "page.create",
    "data": {
      "project_id": "project:test123",
      "url": "/test-page.html",
      "title": "Test Page"
    }
  }'
```

## 🔗 **Integration**

The Pages module integrates with:
- **DataModel Framework** - ORM and storage
- **CloudFunction API** - Unified API endpoint
- **Auth System** - User authentication and authorization
- **Audit Logging** - Activity tracking
- **Project System** - Project-based organization


