# V4.5: KV Cache Setup Instructions

## 🎯 **Quick Setup Steps**

### **1. Create KV Namespace**
```bash
# In the worker directory
cd worker
wrangler kv:namespace create "NIMBUS_CACHE"
```

This will output something like:
```
🌀 Creating namespace with title "nimbus-content-optimizer-NIMBUS_CACHE"
✨ Success!
Add the following to your configuration file in your kv_namespaces array:
{ binding = "NIMBUS_CACHE", id = "abc123def456" }
```

### **2. Update wrangler.toml**
Replace `your-kv-namespace-id` in `wrangler.toml` with the actual ID:

```toml
# V4.5: KV storage for AI result caching
kv_namespaces = [
  { binding = "NIMBUS_CACHE", id = "abc123def456" }
]
```

### **3. Deploy Worker**
```bash
wrangler deploy
```

### **4. Test Cache Performance**
```bash
# Check cache stats
curl https://nimbus-content-optimizer.martin-598.workers.dev/cache-stats

# Run the same optimization twice to see cache hit
gulp nimbus:propose:v2 --batch test --pages some-page
gulp nimbus:propose:v2 --batch test --pages some-page  # Should be cached
```

---

## 📊 **Cache Analytics**

### **Cache Stats Endpoint**
```bash
GET https://your-worker.workers.dev/cache-stats
```

**Response:**
```json
{
  "cache_hits": 45,
  "cache_misses": 12,
  "hit_rate": "78.9%",
  "version": "v4.5",
  "ttl_days": 7
}
```

### **Cache Behavior**
- **Cache Key**: SHA-256 hash of content + profile + directive + version
- **TTL**: 7 days (configurable)
- **Version Invalidation**: Changing `CACHE_VERSION` invalidates all cache
- **Error Handling**: Graceful fallback to AI if cache fails

---

## 🎯 **Expected Performance**

### **Development (High Cache Hit Rate)**
- **First run**: Cache miss → AI call → ~10-30s response
- **Subsequent runs**: Cache hit → ~100ms response
- **Cost reduction**: 90%+ on repeated content

### **Production (Mixed Workload)**
- **New content**: Cache miss → Full AI processing
- **Repeated content**: Cache hit → Instant response
- **Cost reduction**: 30-70% depending on content uniqueness

### **Cache Debugging**
- Console logs show: `Cache HIT` or `Cache MISS`
- Response includes: `cached: true` and `cache_key` for hits
- Stats endpoint tracks performance over time

---

## 🔧 **Troubleshooting**

### **KV Not Working**
```bash
# Check KV namespace exists
wrangler kv:namespace list

# Check binding is correct in wrangler.toml
wrangler whoami
```

### **Cache Not Hitting**
- Check cache stats: `/cache-stats`
- Verify content hasn't changed (different hash = different cache key)
- Check console logs for cache behavior

### **Performance Issues**
- Monitor cache hit rate via `/cache-stats`
- High miss rate = content changing frequently
- Low hit rate = good (means lots of unique optimizations)

---

## ✅ **Ready to Deploy!**

Once you've created the KV namespace and updated the ID in `wrangler.toml`, the cache system will be fully operational and ready to deliver massive performance improvements!
