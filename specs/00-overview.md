# 🚀 NimbusAI Cloudflare Executor - Architecture Overview

## 🎯 **Mission Statement**

Transform NimbusAI from a local optimization tool into a **scalable SaaS platform** by moving AI processing to Cloudflare Workers while keeping proven extraction logic local.

## 🏗️ **Architecture Overview**

### **Local (Gulp) - Extraction & Control**
- ✅ **Keeps all existing extraction logic**
- ✅ **Scans and extracts content with dimensions**
- ✅ **Uploads to Cloudflare**
- ✅ **Monitors and applies results**

### **Cloud (Cloudflare) - AI Processing**
- 🚀 **Stores extracted content**
- 🚀 **Executes AI optimization workflows**
- 🚀 **Manages batch processing**
- 🚀 **Provides status and audit logs**

## 📊 **Data Flow**

```
1. LOCAL EXTRACTION
   gulp → scan HTML → extract content → dimensions → JSON

2. CLOUD UPLOAD
   gulp → upload JSON → CF KV storage → assign batch_id

3. CLOUD PROCESSING
   CF Worker → dequeue → AI optimize → store results

4. LOCAL APPLICATION
   gulp → poll status → download results → apply to HTML
```

## 🔑 **Key Concepts**

### **Project-Based Architecture**
Every operation is tied to a `project_id`:
- Multiple projects per user
- API key authentication
- Isolated data storage
- Independent configurations
- Create unique page id using know positives - projectid,sitedomain,page_url - composited to a unique hash.

### **Batch Processing**
Flexible execution model:
- Process 1 page immediately
- Queue 1000 pages for batch processing
- Poll for completion
- Comprehensive audit logs

### **Modular Design**
Clean separation of concerns:
- Each module has single responsibility
- Configuration-driven behavior
- No hardcoded assumptions
- Extensible architecture

## 📁 **KV Namespace Structure**

```
user:{user_id}                    # User accounts
apikey:{api_key_hash}             # API key → user mapping
project:{project_id}              # Project configuration
page:{project_id}:{page_id}       # Extracted content
batch:{project_id}:{batch_id}     # Batch tracking
queue:{project_id}                # Processing queue
status:{project_id}:{page_id}     # Page status
logs:{project_id}:{page_id}       # Audit logs
```

## 🎯 **Design Principles**

1. **Cloud-First** - Offload heavy processing to Cloudflare
2. **Fault-Tolerant** - Resumable batches, comprehensive logging
3. **Scalable** - Handle 1 to 10,000+ pages per batch
4. **Transparent** - Full audit trail and status visibility
5. **Extensible** - Easy to add new AI workflows
6. **Secure** - API key authentication, project isolation

## 🚀 **Implementation Phases**

### **Phase 1: Foundation**
- Project initialization system
- Basic upload/download pipeline
- Simple batch tracking

### **Phase 2: AI Processing**
- Move progressive-optimizer logic to CF
- Implement workflow executor
- Add status management

### **Phase 3: Polish**
- Error handling and retries
- Performance optimization
- Comprehensive documentation

## 📊 **Success Metrics**

- **Scalability**: Process 10,000 pages without local memory issues
- **Performance**: <30s per page AI optimization
- **Reliability**: 99.9% success rate with automatic retries
- **Visibility**: Complete audit trail for every operation

## 🏆 **End Goal**

A **production-ready SaaS platform** where users can:
1. Initialize projects with API keys
2. Extract content locally with existing tools
3. Process at scale in the cloud
4. Monitor progress in real-time
5. Apply optimized results seamlessly

**This architecture enables NimbusAI to scale from a tool to a platform.**
