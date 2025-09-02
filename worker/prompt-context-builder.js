// Contextual Prompt Builder Module
// Provides intelligent context without constraining AI creativity

import { getToneProfile } from './tone/index.js';



// Context Builders
function getToneContext(toneName, country = 'UK') {
  const tone = getToneProfile(toneName || 'friendly', country);
  
  return `TONE CONTEXT: ${tone.personality}
TARGET STYLE: ${tone.language}
VOICE APPROACH: ${tone.formality}`;
}

// Safe services builder
function buildServicesContent(services) {
  if (!services || !Array.isArray(services) || services.length === 0) {
    return ''; // Return empty string to skip this line entirely
  }
  return `- Services: ${services.join(', ')}`;
}

// Safe trust signals builder
function buildTrustSignalsContent(profile) {
  const signals = [];
  
  // Try structured reviews first, fallback to simple count
  if (profile.reviews && typeof profile.reviews === 'object') {
    const { count, site, rating, url } = profile.reviews;
    
    // Only add if we have the essential data
    if (count && site) {
      const ratingText = rating ? ` (${rating}★)` : '';
      const urlText = url ? ` [URL: ${url}]` : '';
      signals.push(`${count} reviews on ${site}${ratingText}${urlText}`);
    }
  } else if (profile.review_count) {
    // Fallback to simple count if structured data is missing
    signals.push(`${profile.review_count} reviews`);
  }
  
  if (profile.guarantee) {
    signals.push(profile.guarantee);
  }
  
  if (signals.length === 0) {
    return ''; // Return empty string to skip this line entirely
  }
  
  return `- Trust Signals: ${signals.join(', ')}`;
}

// Safe contact builder
function buildContactContent(profile) {
  const contactParts = [];
  
  if (profile.phone) {
    contactParts.push(profile.phone);
  }
  
  if (profile.hours) {
    contactParts.push(profile.hours);
  }
  
  if (contactParts.length === 0) {
    return ''; // Return empty string to skip this line entirely
  }
  
  return `- Contact: ${contactParts.join(' (')}${contactParts.length > 1 ? ')' : ''}`;
}

// Safe geographic scope builder
function buildGeographicScopeContent(geoScope) {
  if (!geoScope || !Array.isArray(geoScope) || geoScope.length === 0) {
    return ''; // Return empty string to skip this line entirely
  }
  return `- Geographic Scope: ${geoScope.join(', ')}`;
}

function getBusinessContext(profile) {
  const businessLines = [
    `- Company: ${profile.name || 'Business'}`,
    `- Domain: ${profile.domain || 'website.com'}`
  ];
  
  // Add optional services (only if available)
  const servicesLine = buildServicesContent(profile.services);
  if (servicesLine) businessLines.push(servicesLine);
  
  // Add optional geographic scope (only if available)
  const geoScopeLine = buildGeographicScopeContent(profile.geo_scope);
  if (geoScopeLine) businessLines.push(geoScopeLine);
  
  // Add optional trust signals (only if available)
  const trustSignalsLine = buildTrustSignalsContent(profile);
  if (trustSignalsLine) businessLines.push(trustSignalsLine);
  
  // Add optional contact (only if available)
  const contactLine = buildContactContent(profile);
  if (contactLine) businessLines.push(contactLine);
  
  return `BUSINESS CONTEXT:\n${businessLines.join('\n')}`;
}

function getPageContext(pageType, pageContext = {}) {
  const { brand, location, service, product } = pageContext;
  const contexts = [];
  
  // Build additive context based on what's present
  if (brand) {
    contexts.push(`BRAND: ${brand} - Consider brand positioning and reputation. Use wording commonly associated with this brand.`);
  }
  
  if (product) {
    contexts.push(`PRODUCT: ${product} - Focus on specific known product benefits and features.`);
  }
  
  if (service) {
    contexts.push(`SERVICE: ${service} - Highlight expertise and service-specific value propositions.`);
  }
  
  if (location) {
    contexts.push(`LOCATION: ${location} - Consider local culture and geographic relevance for SEO such as landmarks and important place names.`);
  }
  
  // Add page type context
  contexts.push(`PAGE TYPE: ${pageType} page - Optimize for typical ${pageType} user intent.`);
  
  return `PAGE CONTEXT:\n${contexts.join('\n')}`;
}

function getLocalizationContext(country = 'UK') {
  switch(country) {
    case 'UK':
      return `LOCALIZATION: UK market - use VAT, postcodes, counties, British spelling, and UK-specific terminology.`;
    
    case 'US':
      return `LOCALIZATION: US market - use tax, ZIP codes, states, American spelling, and US-specific terminology.`;
    
    case 'CA':
      return `LOCALIZATION: Canadian market - use GST/PST, postal codes, provinces, Canadian spelling and terminology.`;
      
    default:
      return `LOCALIZATION: International market - use neutral geographic terms and global best practices.`;
  }
}

// Main Context Builder Function
function buildContextualPrompt(profile, directive, pageConfig) {
  const { pageType, brand, location, service, product } = pageConfig;
  
  const contexts = [
    getToneContext(directive?.tone, profile?.country),
    getBusinessContext(profile),
    getPageContext(pageType || 'general', { brand, location, service, product }),
    getLocalizationContext(profile?.country)
  ];
  
  // Filter out any empty contexts (failed gracefully)
  const validContexts = contexts.filter(context => context !== '');
  
  return {
    pageType: pageType || 'general',
    brand,
    location, 
    service,
    product,
    contextBlocks: validContexts,
    fullContext: validContexts.join('\n\n')
  };
}

// Export for use in worker
export {
  getToneContext,
  getBusinessContext,
  getPageContext,
  getLocalizationContext,
  buildContextualPrompt,
  // Export the new builder functions for testing
  buildServicesContent,
  buildTrustSignalsContent,
  buildContactContent,
  buildGeographicScopeContent
};
