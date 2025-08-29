# Simple Folder Configuration System

## 🎯 Goal: Simple Settings → Meaningful Results → More Dollars

### **Folder-Based Configuration**

**Each folder gets optional `_folder-config.yaml`:**

```
dist/local/_folder-config.yaml
dist/brands/_folder-config.yaml  
dist/information/_folder-config.yaml
```

## 📁 **Folder Config Examples**

### **Local Pages (Sales + Local SEO)**
```yaml
# dist/local/_folder-config.yaml
optimization_focus: "sales_local"
tone: "friendly_urgent"
priority: "conversion_first"

sales_approach:
  pain_points: ["nearest repair shop", "trusted local service", "convenient collection"]
  value_props: ["free collection", "local expertise", "quick turnaround"]
  urgency: ["limited slots", "same day collection", "24hr quotes"]
  trust_local: ["serving {{location}} since 2014", "{{location}}'s most trusted"]

content_style:
  - "Get your {{service}} sorted today in {{location}}"
  - "{{location}}'s premier watch repair experts"
  - "Free collection from your {{location}} door"
  - UK friendly: "brilliant service", "sorted", "proper job"
```

### **Brand Pages (Authority + Expertise)**
```yaml
# dist/brands/_folder-config.yaml
optimization_focus: "authority_expertise"
tone: "professional_confident"
priority: "expertise_first"

sales_approach:
  pain_points: ["protect investment", "authentic parts", "certified expertise"]
  value_props: ["brand specialists", "genuine parts", "preserve value"]
  authority: ["certified technicians", "official training", "brand partnerships"]
  trust_expertise: ["{{brand}} specialists", "movement experts", "investment protection"]

content_style:
  - "{{brand}} movement specialists"
  - "Preserve your {{brand}} investment"
  - "Certified {{brand}} repair expertise" 
  - Professional: "precision", "expertise", "certification"
```

### **Help/Information Pages (SEO + Trust)**
```yaml
# dist/information/_folder-config.yaml
optimization_focus: "seo_trust"
tone: "helpful_authoritative"
priority: "information_first"

sales_approach:
  pain_points: ["questions", "uncertainty", "need guidance"]
  value_props: ["expert advice", "clear answers", "transparent process"]
  trust_building: ["professional guidance", "honest advice", "no pressure"]
  
content_style:
  - "Professional guidance on {{topic}}"
  - "Everything you need to know about {{service}}"
  - Authoritative: "expertise", "guidance", "professional advice"
```

## 🎯 **How It Changes Results**

### **Local Page Optimization:**
```
Generic: "Watch repair service"
Local Config: "Get your watch sorted today in Abbots Langley by Hertfordshire's most trusted experts"

Generic CTA: "Contact us"
Local Config: "Free collection from your Abbots Langley door - book now"
```

### **Brand Page Optimization:**
```
Generic: "Rolex repair"
Brand Config: "Rolex movement specialists preserving your timepiece investment with certified expertise"

Generic: "Professional service"
Brand Config: "Certified Rolex technicians using genuine Swiss parts"
```

### **Help Page Optimization:**
```
Generic: "Watch repair information"
Help Config: "Professional guidance on watch repair costs, timescales, and what to expect"
```

## 🔧 **Implementation**

**Simple folder detection:**
```javascript
// Check for folder config
const folderConfigPath = path.join(folderPath, '_folder-config.yaml');
if (exists(folderConfigPath)) {
  const folderConfig = loadYaml(folderConfigPath);
  // Merge with page directive
  directive = { ...directive, ...folderConfig };
}
```

**AI prompts get enhanced context:**
```
OPTIMIZATION FOCUS: {{folder_config.optimization_focus}}
TONE: {{folder_config.tone}}  
SALES APPROACH: {{folder_config.sales_approach}}
CONTENT STYLE: {{folder_config.content_style}}
```

## 💰 **Expected Impact**

**Local pages**: +50% conversion (urgent, convenient, local trust)
**Brand pages**: +30% authority (expertise, investment protection)  
**Help pages**: +25% engagement (helpful, authoritative)

**Simple config → Meaningful results → More dollars!** 💰
