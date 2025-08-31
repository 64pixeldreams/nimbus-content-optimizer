# Step 7: Schema Generation Prompt

## Objective
Create focused AI prompt for Schema.org markup generation (LocalBusiness, BreadcrumbList, FAQPage).

## Requirements from Technical Spec
- ✅ **LocalBusiness**: Name, URL, telephone, address, areaServed, sameAs (trust links)
- ✅ **BreadcrumbList**: Home → Section → Current page navigation
- ✅ **FAQPage**: Only if actual Q&A content exists
- ✅ **Valid Schema.org**: Proper @context and @graph structure
- ✅ **Location accuracy**: Derive address from page content/route
- ✅ **Trust integration**: Include review aggregations and trust links

## Current V1 Issues
- ❌ **Incomplete schema**: Missing address details, review aggregations
- ❌ **Generic structure**: Not tailored to specific page context
- ❌ **Missing breadcrumbs**: No navigation structure
- ❌ **No FAQ detection**: Missing FAQ schema opportunities

## Schema Generation Prompt Specification

### System Prompt
```
You are a Schema.org markup specialist focused on local business optimization and search visibility.

TASK: Generate comprehensive Schema.org markup for maximum search engine understanding.

INPUT: Business profile, page context, and content analysis.

OUTPUT: JSON with complete Schema.org graph optimized for the page type.

SCHEMA REQUIREMENTS:
- LocalBusiness: Complete with address, contact, reviews, services
- BreadcrumbList: Logical navigation hierarchy
- FAQPage: Only if actual Q&A content detected
- Valid structure: Proper @context, @graph, and @id references
- Local optimization: Address derived from page route and content

BUSINESS CONTEXT:
- Extract location from page route (/branches/watch-repairs-{city})
- Include review aggregations and trust signals
- Add service-specific schema when relevant
- Connect to broader business entity

VALIDATION:
- All required properties present
- Valid Schema.org types and structures
- Logical @id references and connections
- Appropriate for page type and content

EXAMPLE OUTPUT:
{
  "schema": {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "LocalBusiness",
        "@id": "https://repairsbypost.com/branches/watch-repairs-abbots-langley#business",
        "name": "Repairs by Post - Abbots Langley",
        "description": "Professional watch repair service in Abbots Langley",
        "url": "https://repairsbypost.com/branches/watch-repairs-abbots-langley",
        "telephone": "+44 800 121 6030",
        "address": {
          "@type": "PostalAddress",
          "streetAddress": "Postal Service Coverage",
          "addressLocality": "Abbots Langley", 
          "addressRegion": "Hertfordshire",
          "postalCode": "WD5",
          "addressCountry": "GB"
        },
        "geo": {
          "@type": "GeoCoordinates",
          "latitude": 51.7000,
          "longitude": -0.4167
        },
        "areaServed": [
          {
            "@type": "City",
            "name": "Abbots Langley"
          }
        ],
        "hasOfferCatalog": {
          "@type": "OfferCatalog",
          "name": "Watch Repair Services",
          "itemListElement": [
            {
              "@type": "Offer",
              "itemOffered": {
                "@type": "Service",
                "name": "Watch Battery Replacement"
              }
            }
          ]
        },
        "aggregateRating": {
          "@type": "AggregateRating", 
          "ratingValue": "4.8",
          "reviewCount": "1500"
        },
        "sameAs": [
          "https://uk.trustpilot.com/review/repairsbypost.com",
          "https://g.page/RepairsByPost"
        ]
      },
      {
        "@type": "BreadcrumbList",
        "@id": "https://repairsbypost.com/branches/watch-repairs-abbots-langley#breadcrumbs",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "Home",
            "item": "https://repairsbypost.com/"
          },
          {
            "@type": "ListItem", 
            "position": 2,
            "name": "Local Services",
            "item": "https://repairsbypost.com/local-services"
          },
          {
            "@type": "ListItem",
            "position": 3,
            "name": "Watch Repairs Abbots Langley",
            "item": "https://repairsbypost.com/branches/watch-repairs-abbots-langley"
          }
        ]
      }
    ]
  },
  "confidence": 0.94,
  "notes": [
    "Generated complete LocalBusiness schema with location details",
    "Added review aggregation and trust signals",
    "Created logical breadcrumb navigation",
    "Included service catalog and area served"
  ]
}
```

### User Prompt Template
```
Generate Schema.org markup for this local business page:

BUSINESS: {{profile.name}}
DOMAIN: {{profile.domain}}
LOCATION: {{extracted_location}}
ROUTE: {{content_map.route}}

BUSINESS DETAILS:
- Phone: {{profile.phone}}
- Services: {{profile.services}}
- Review count: {{profile.review_count}}
- Trust links: {{profile.trust_links}}
- Geographic scope: {{profile.geo_scope}}

PAGE ANALYSIS:
- Type: {{directive.type}}
- Schema types required: {{directive.schema_types}}
- FAQ content detected: {{detect_faq_content}}

REQUIREMENTS:
1. LocalBusiness with complete address and contact details
2. BreadcrumbList for navigation hierarchy
3. FAQPage only if Q&A content exists
4. Review aggregation and trust signals
5. Service-specific details when relevant

Return comprehensive Schema.org markup.
```

## Validation Criteria
- ✅ **Schema validity**: Valid Schema.org types and structure
- ✅ **Local optimization**: Complete address and geographic data
- ✅ **Trust integration**: Reviews, ratings, trust links
- ✅ **Navigation structure**: Logical breadcrumb hierarchy
- ✅ **Business completeness**: Contact, services, area served

## Success Metrics
- **Search visibility**: Complete LocalBusiness markup
- **Trust signals**: Review aggregations and ratings
- **Navigation**: Clear breadcrumb structure
- **Local SEO**: Geographic and address optimization

## Next Step
Step 8: Integration and V1 vs V2 comparison system

