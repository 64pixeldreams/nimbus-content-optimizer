# Project Analytics Charts Implementation

## 🎯 Goal
Add mini sparkline charts to project dashboard showing page activity trends with status filtering.

## 📊 Dashboard Layout

### Current Project Stats Cards
```
┌─────────────┬─────────────┬─────────────┐
│    Pages    │  Complete   │ Processing  │
│     96      │      0      │      0      │
│ [mini chart]│ [mini chart]│ [mini chart]│
└─────────────┴─────────────┴─────────────┘
```

### Chart Specifications
- **Size**: 200px width × 150px height (or 150px × 100px)
- **Type**: Line charts (sparklines)
- **Style**: No axes, no labels, just trend lines
- **Data**: Last 24 hours (hourly data points)
- **Colors**: Match AdminKit theme

## 🏗️ Implementation Plan

### 1. Analytics Engine Module
**File**: `cf-platform/src/modules/analytics/`

```javascript
// analytics-engine.js
export class AnalyticsEngine {
  constructor(env, logger) {
    this.engine = env.NIMBUS_ANALYTICS_ENGINE;
    this.logger = logger;
  }

  // Write page event
  async trackPageEvent(eventType, projectId, userId, pageId, status = null) {
    await this.engine.writeDataPoint({
      blobs: [eventType, projectId, userId, status].filter(Boolean),
      doubles: [1], // count
      indexes: [pageId]
    });
  }

  // Get project stats for charts
  async getProjectChartData(projectId, hours = 24) {
    const query = `
      SELECT 
        toStartOfHour(timestamp) as hour,
        blob4 as status,
        sum(double1) as count
      FROM NIMBUS_ANALYTICS_ENGINE 
      WHERE blob1 = 'page_event' 
        AND blob2 = '${projectId}'
        AND timestamp >= now() - interval ${hours} hour
      GROUP BY hour, status
      ORDER BY hour
    `;
    
    return await this.engine.prepare(query).all();
  }
}
```

### 2. Page Event Tracking
**Hook into existing page operations:**

```javascript
// In page.create CloudFunction
const analytics = new AnalyticsEngine(env, logger);
await analytics.trackPageEvent('page_uploaded', projectId, userId, pageId, 'created');

// In page.update CloudFunction  
await analytics.trackPageEvent('page_updated', projectId, userId, pageId, newStatus);
```

### 3. Frontend Chart Component
**File**: `www/app/project.html`

#### HTML Structure
```html
<!-- Add Chart.js -->
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>

<!-- Update existing stats cards -->
<div class="row">
  <div class="col-md-4">
    <div class="card">
      <div class="card-body text-center">
        <div class="row">
          <div class="col">
            <h2 class="h1 mb-1" id="total-pages">96</h2>
            <p class="text-muted mb-2">Pages</p>
            <canvas id="pages-chart" width="200" height="150"></canvas>
          </div>
        </div>
      </div>
    </div>
  </div>
  
  <div class="col-md-4">
    <div class="card">
      <div class="card-body text-center">
        <div class="row">
          <div class="col">
            <h2 class="h1 mb-1" id="complete-pages">0</h2>
            <p class="text-muted mb-2">Complete</p>
            <canvas id="complete-chart" width="200" height="150"></canvas>
          </div>
        </div>
      </div>
    </div>
  </div>
  
  <div class="col-md-4">
    <div class="card">
      <div class="card-body text-center">
        <div class="row">
          <div class="col">
            <h2 class="h1 mb-1" id="processing-pages">0</h2>
            <p class="text-muted mb-2">Processing</p>
            <canvas id="processing-chart" width="200" height="150"></canvas>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
```

#### JavaScript Chart Implementation
```javascript
// Chart configuration for sparklines
const sparklineConfig = {
  type: 'line',
  options: {
    responsive: false,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { enabled: false }
    },
    scales: {
      x: { display: false },
      y: { display: false }
    },
    elements: {
      point: { radius: 0 },
      line: { tension: 0.3 }
    }
  }
};

// Load project analytics data
async function loadProjectAnalytics(projectId) {
  try {
    const response = await cf.call('project.analytics', { 
      project_id: projectId,
      hours: 24 
    });
    
    if (response.success) {
      renderCharts(response.data);
    }
  } catch (error) {
    console.error('Failed to load analytics:', error);
  }
}

// Render mini charts
function renderCharts(data) {
  // Process data into hourly buckets
  const hours = Array.from({length: 24}, (_, i) => i);
  
  // Total pages uploaded
  const pagesData = processChartData(data, 'created');
  new Chart(document.getElementById('pages-chart'), {
    ...sparklineConfig,
    data: {
      labels: hours,
      datasets: [{
        data: pagesData,
        borderColor: '#007bff',
        borderWidth: 2,
        fill: false
      }]
    }
  });
  
  // Complete pages
  const completeData = processChartData(data, 'complete');
  new Chart(document.getElementById('complete-chart'), {
    ...sparklineConfig,
    data: {
      labels: hours,
      datasets: [{
        data: completeData,
        borderColor: '#28a745',
        borderWidth: 2,
        fill: false
      }]
    }
  });
  
  // Processing pages
  const processingData = processChartData(data, 'processing');
  new Chart(document.getElementById('processing-chart'), {
    ...sparklineConfig,
    data: {
      labels: hours,
      datasets: [{
        data: processingData,
        borderColor: '#ffc107',
        borderWidth: 2,
        fill: false
      }]
    }
  });
}

// Helper to process data into hourly buckets
function processChartData(data, status) {
  const hourlyData = new Array(24).fill(0);
  
  data.forEach(item => {
    if (item.status === status) {
      const hour = new Date(item.hour).getHours();
      hourlyData[hour] += item.count;
    }
  });
  
  return hourlyData;
}
```

### 4. Backend CloudFunction
**File**: `cf-platform/src/modules/projects/functions/analytics.js`

```javascript
import { AnalyticsEngine } from '../../analytics/analytics-engine.js';

export async function projectAnalytics(requestContext) {
  const { env, logger, payload, auth } = requestContext;
  const { project_id, hours = 24 } = payload;

  try {
    const analytics = new AnalyticsEngine(env, logger);
    const chartData = await analytics.getProjectChartData(project_id, hours);
    
    return {
      success: true,
      data: chartData.results || []
    };
  } catch (error) {
    logger.error('Failed to get project analytics', error);
    return {
      success: false,
      error: error.message
    };
  }
}

export const projectAnalyticsConfig = {
  auth: true,
  validation: {
    project_id: { type: 'string', required: true },
    hours: { type: 'number', default: 24 }
  }
};
```

### 5. Status Filtering (Future Enhancement)
```html
<!-- Add filter dropdown -->
<div class="row mb-3">
  <div class="col-auto">
    <select id="status-filter" class="form-select">
      <option value="all">All Pages</option>
      <option value="created">Created</option>
      <option value="processing">Processing</option>
      <option value="complete">Complete</option>
      <option value="error">Error</option>
    </select>
  </div>
  <div class="col-auto">
    <select id="time-filter" class="form-select">
      <option value="24">Last 24 Hours</option>
      <option value="168">Last 7 Days</option>
      <option value="720">Last 30 Days</option>
    </select>
  </div>
</div>
```

## 🚀 Implementation Steps

1. **Deploy Analytics Engine binding** (already done ✅)
2. **Create analytics module** in CF platform
3. **Add event tracking** to page operations
4. **Create project.analytics CloudFunction**
5. **Update project.html** with charts
6. **Test with sample data**
7. **Add filtering capabilities**

## 📈 Chart Examples

### Mini Sparkline Appearance
```
Pages: 96     Complete: 0    Processing: 0
    /\            ___            /\_
   /  \__        /   \__        /   \
  /     \       /      \       /     \__
```

### Color Scheme
- **Pages**: `#007bff` (blue)
- **Complete**: `#28a745` (green) 
- **Processing**: `#ffc107` (yellow)
- **Error**: `#dc3545` (red)

## 🎯 Success Metrics
- Visual trends show page upload patterns
- Status filtering works smoothly
- Charts load in <500ms
- Mobile responsive design
- Matches AdminKit aesthetic

Ready to implement! 🚀
