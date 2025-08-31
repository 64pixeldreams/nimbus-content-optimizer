# V2.5: Block Processing Fix - Send More Content Intelligently

## 🎯 Current Issue: Not Processing Enough Content

**Problem**: We're only processing 12/80 blocks, but when we try to send all 80, the AI fails with JSON errors.

**Root Cause**: Token limits and prompt complexity when sending all blocks at once.

## 🚀 Solution: Intelligent Block Batching Strategy

### **Strategy 1: Priority-Based Block Selection**
```javascript
// Send most important blocks first, up to token limits
const priorityBlocks = [
  // Tier 1: Critical content (always include)
  ...allBlocks.filter(b => b.type === 'h1'),                    // ALL H1s
  ...allBlocks.filter(b => b.type === 'h2'),                    // ALL H2s  
  ...allBlocks.filter(b => b.type === 'p' && b.i < 10),        // First 10 paragraphs
  
  // Tier 2: Important content (include if space)
  ...allBlocks.filter(b => b.type === 'li' && b.text && 
    (b.text.includes('guarantee') || b.text.includes('service'))), // Key service items
  ...allBlocks.filter(b => b.type === 'p' && b.text && 
    b.text.length > 100),                                      // Substantial paragraphs
    
  // Tier 3: Supporting content (include remaining space)
  ...allBlocks.filter(b => b.type === 'li').slice(0, 15),      // First 15 list items
  ...allBlocks.filter(b => b.type === 'blockquote')            // ALL quotes
];
```

### **Strategy 2: Multiple Content Prompts**
```javascript
// Split content into focused prompts
const contentBatches = {
  primary_content: {
    blocks: [...headings, ...firstParagraphs],
    focus: "main content optimization with location targeting"
  },
  service_content: {
    blocks: [...serviceListItems, ...serviceParagraphs],
    focus: "service descriptions with local context"
  },
  trust_content: {
    blocks: [...reviewContent, ...guaranteeContent],
    focus: "trust building with local authority"
  }
};
```

### **Strategy 3: Smart Block Filtering**
```javascript
// Filter blocks by content value and relevance
const valuableBlocks = allBlocks.filter(block => {
  if (!block.text) return false;
  
  // Include if substantial content
  if (block.text.length > 50) return true;
  
  // Include if contains key terms
  const keyTerms = ['repair', 'service', 'guarantee', 'review', 'expert'];
  if (keyTerms.some(term => block.text.toLowerCase().includes(term))) return true;
  
  // Include all headings
  if (['h1', 'h2', 'h3'].includes(block.type)) return true;
  
  return false;
});
```

## 📊 **Implementation Plan**

### **Phase 1: Increase Block Count Gradually**
```
Current: 12 blocks → Target: 25 blocks (test stability)
If stable: 25 blocks → Target: 40 blocks  
If stable: 40 blocks → Target: 60+ blocks
```

### **Phase 2: Optimize Block Selection**
- **Priority filtering**: Most important content first
- **Content value filtering**: Substantial, meaningful blocks
- **Token management**: Stay within prompt limits

### **Phase 3: Multiple Content Passes**
- **Pass 1**: Primary content (headings, key paragraphs)
- **Pass 2**: Service content (lists, service descriptions)  
- **Pass 3**: Trust content (reviews, guarantees, FAQs)

## 🎯 **Immediate Fix: Increase Block Count Safely**

**Let's start by doubling the block count from 12 to 25-30 blocks and test stability:**

```javascript
// V2.5: Safer block increase
const contentBlocks = [
  ...allBlocks.filter(b => ['h1', 'h2', 'h3'].includes(b.type)), // ALL headings
  ...allBlocks.filter(b => b.type === 'p').slice(0, 20),         // 20 paragraphs (vs 15)
  ...allBlocks.filter(b => b.type === 'li' && b.text && b.text.length > 20).slice(0, 15), // Substantial list items
  ...allBlocks.filter(b => b.type === 'blockquote')              // ALL quotes
];
```

**This should give us 30-40 blocks vs current 12, without overwhelming the AI.**

## 🚀 **Should I implement this safer block increase first, then work on geographic intelligence?**

