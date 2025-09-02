// Nimbus AI Content Optimization Worker
// Cloudflare Worker that processes content optimization requests

export default {
  async fetch(request, env, ctx) {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    // Only allow POST requests
    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    try {
      // Parse request body
      const requestData = await request.json();
      const { profile, directive, content_map } = requestData;

      // Validate required fields
      if (!profile || !directive || !content_map) {
        return new Response(JSON.stringify({ 
          error: 'Missing required fields: profile, directive, content_map' 
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      console.log(`Processing optimization for: ${content_map.route}`);

      // Generate AI proposal
      const proposal = await generateOptimizationProposal(profile, directive, content_map, env);

      // Return successful response
      return new Response(JSON.stringify(proposal), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });

    } catch (error) {
      console.error('Worker error:', error);
      
      return new Response(JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
};

async function generateOptimizationProposal(profile, directive, contentMap, env) {
  // For now, return a mock proposal
  // TODO: Replace with actual AI API call
  
  const mockProposal = generateMockProposal(profile, directive, contentMap);
  
  // Simulate AI processing time
  await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
  
  return mockProposal;
}

function generateMockProposal(profile, directive, contentMap) {
  const { route, head, blocks } = contentMap;
  const { type, tone, trust_signals } = directive;
  
  // Generate location-specific content if it's a local page
  const isLocal = type === 'local';
  const location = isLocal ? extractLocation(route) : null;
  
  const proposal = {
    head: generateHeadProposal(head, profile, directive, location),
    blocks: generateBlockProposals(blocks, profile, directive, location),
    links: generateLinkProposals(blocks, profile, directive),
    alts: generateAltProposals(blocks, profile, directive, location),
    schema: generateSchemaProposal(profile, directive, location, route),
    confidence: 0.75 + Math.random() * 0.2, // Random confidence between 0.75-0.95
    notes: generateOptimizationNotes(directive, location, trust_signals)
  };
  
  return proposal;
}

function extractLocation(route) {
  // Extract location from route like /branches/watch-repairs-abbots-langley
  const match = route.match(/\/branches\/watch-repairs-(.+)/);
  if (match) {
    return match[1].replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }
  return null;
}

function generateHeadProposal(head, profile, directive, location) {
  const { tone, type } = directive;
  const { name, guarantee, review_count } = profile;
  
  let newTitle = head.title;
  let newDescription = head.metaDescription;
  
  if (type === 'local' && location) {
    newTitle = `Professional Watch Repairs in ${location} | Free Collection & ${guarantee}`;
    newDescription = `Expert watch repair service in ${location}. Rolex, Omega, TAG Heuer specialists. Free UK collection, ${guarantee}, ${review_count} reviews. Quote in 2 mins.`;
  } else if (type === 'brand') {
    const brand = extractBrandFromRoute(head.title);
    if (brand) {
      newTitle = `${brand} Watch Repair Service | ${guarantee} | ${name}`;
      newDescription = `Professional ${brand} watch repair service. Certified technicians, genuine parts, ${guarantee}. ${review_count} satisfied customers. Free quote.`;
    }
  } else if (type === 'landing') {
    newTitle = `UK's #1 Watch Repair Service | ${guarantee} | Free Collection`;
    newDescription = `Britain's leading postal watch repair service. Rolex, Omega, TAG Heuer specialists. ${guarantee}, ${review_count} reviews, free collection & return.`;
  }
  
  return {
    title: newTitle,
    metaDescription: newDescription
  };
}

function generateBlockProposals(blocks, profile, directive, location) {
  const proposals = [];
  const { tone, type, trust_signals } = directive;
  const { guarantee, phone, review_count } = profile;
  
  // Find and optimize key blocks
  for (const block of blocks) {
    if (block.type === 'h1' && type === 'local' && location) {
      proposals.push({
        selector: block.selector,
        new_text: `Professional Watch Repairs in ${location}`
      });
    } else if (block.type === 'h2' && block.text.includes('Watch Repairs')) {
      if (type === 'local' && location) {
        proposals.push({
          selector: block.selector,
          new_text: `Expert Watch Repair Service in ${location} - ${guarantee}`
        });
      }
    } else if (block.type === 'p' && block.i < 3) {
      // Optimize first few paragraphs
      let optimizedText = block.text;
      
      if (type === 'local' && location) {
        optimizedText = `Need expert watch repairs in ${location}? ${profile.name} is your trusted local choice. Our certified technicians repair all major brands with a ${guarantee} and ${review_count} satisfied customers.`;
      }
      
      if (optimizedText !== block.text) {
        proposals.push({
          selector: block.selector,
          new_text: optimizedText
        });
      }
    }
  }
  
  return proposals;
}

function generateLinkProposals(blocks, profile, directive) {
  const proposals = [];
  const { tone, cta_priority } = directive;
  
  // Find CTA links and optimize them
  for (const block of blocks) {
    if (block.type === 'a' && block.href && block.href.includes('start-repair')) {
      let newAnchor = block.anchor;
      
      if (cta_priority === 'high') {
        newAnchor = 'GET FREE QUOTE (2 MINS)';
      } else if (cta_priority === 'medium') {
        newAnchor = 'Free Quote';
      }
      
      if (newAnchor !== block.anchor) {
        proposals.push({
          selector: block.selector,
          new_anchor: newAnchor,
          new_href: block.href
        });
      }
    }
  }
  
  return proposals;
}

function generateAltProposals(blocks, profile, directive, location) {
  const proposals = [];
  const { type } = directive;
  
  // Find images with missing or poor alt text
  for (const block of blocks) {
    if (block.type === 'img' && (!block.alt || block.alt.length < 10)) {
      let newAlt = '';
      
      if (block.src.includes('watch_repair')) {
        if (type === 'local' && location) {
          newAlt = `Professional watch repair service in ${location} - Rolex, Omega, TAG Heuer specialists`;
        } else {
          newAlt = 'Professional watch repair service - certified technicians and genuine parts';
        }
      } else if (block.src.includes('brands')) {
        newAlt = 'Luxury watch brands repaired - Rolex, Omega, Breitling, TAG Heuer';
      } else if (block.src.includes('google')) {
        newAlt = 'Google reviews - 5-star rated watch repair service';
      }
      
      if (newAlt) {
        proposals.push({
          selector: block.selector,
          new_alt: newAlt
        });
      }
    }
  }
  
  return proposals;
}

function generateSchemaProposal(profile, directive, location, route) {
  const { type, schema_types } = directive;
  const { name, phone, guarantee, domain } = profile;
  
  const schema = {
    '@context': 'https://schema.org',
    '@graph': []
  };
  
  // Add appropriate schema based on directive
  if (schema_types.includes('LocalBusiness') && location) {
    schema['@graph'].push({
      '@type': 'LocalBusiness',
      '@id': `https://${domain}${route}#business`,
      'name': `${name} - ${location}`,
      'description': `Professional watch repair service in ${location}`,
      'telephone': phone,
      'url': `https://${domain}${route}`,
      'address': {
        '@type': 'PostalAddress',
        'addressLocality': location,
        'addressCountry': 'GB'
      },
      'serviceArea': {
        '@type': 'GeoCircle',
        'geoMidpoint': {
          '@type': 'GeoCoordinates',
          'addressLocality': location
        }
      }
    });
  }
  
  if (schema_types.includes('Service')) {
    schema['@graph'].push({
      '@type': 'Service',
      '@id': `https://${domain}${route}#service`,
      'name': 'Watch Repair Service',
      'description': 'Professional watch repair and servicing',
      'provider': {
        '@type': 'Organization',
        'name': name
      },
      'serviceType': 'Watch Repair'
    });
  }
  
  if (schema_types.includes('BreadcrumbList')) {
    const breadcrumbs = generateBreadcrumbs(route, location);
    schema['@graph'].push({
      '@type': 'BreadcrumbList',
      '@id': `https://${domain}${route}#breadcrumbs`,
      'itemListElement': breadcrumbs
    });
  }
  
  return schema;
}

function generateBreadcrumbs(route, location) {
  const breadcrumbs = [
    {
      '@type': 'ListItem',
      'position': 1,
      'name': 'Home',
      'item': 'https://www.repairsbypost.com/'
    }
  ];
  
  if (route.startsWith('/branches/') && location) {
    breadcrumbs.push({
      '@type': 'ListItem',
      'position': 2,
      'name': 'Local Services',
      'item': 'https://www.repairsbypost.com/local-services'
    });
    breadcrumbs.push({
      '@type': 'ListItem',
      'position': 3,
      'name': `Watch Repairs ${location}`,
      'item': `https://www.repairsbypost.com${route}`
    });
  } else if (route.startsWith('/brands/')) {
    breadcrumbs.push({
      '@type': 'ListItem',
      'position': 2,
      'name': 'Watch Brands',
      'item': 'https://www.repairsbypost.com/watch-brands'
    });
  }
  
  return breadcrumbs;
}

function generateOptimizationNotes(directive, location, trustSignals) {
  const notes = [];
  const { type, tone } = directive;
  
  if (type === 'local' && location) {
    notes.push(`Enhanced title and content with location-specific targeting for ${location}`);
    notes.push('Added LocalBusiness schema for local SEO optimization');
  }
  
  if (tone === 'urgent') {
    notes.push('Strengthened CTAs with urgency and time-sensitive language');
  } else if (tone === 'friendly') {
    notes.push('Adopted friendly, approachable tone while maintaining professionalism');
  }
  
  if (trustSignals.includes('reviews')) {
    notes.push('Incorporated review count and ratings for trust building');
  }
  
  if (trustSignals.includes('guarantee')) {
    notes.push('Highlighted guarantee prominently for confidence building');
  }
  
  notes.push('Optimized meta description for higher click-through rates');
  notes.push('Added comprehensive alt text for better accessibility and SEO');
  
  return notes;
}

function extractBrandFromRoute(title) {
  const brands = ['Rolex', 'Omega', 'TAG Heuer', 'Breitling', 'Audemars Piguet', 'Movado', 'Hugo Boss', 'DKNY'];
  for (const brand of brands) {
    if (title.toLowerCase().includes(brand.toLowerCase())) {
      return brand;
    }
  }
  return null;
}
