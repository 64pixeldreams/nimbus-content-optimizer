/**
 * Extraction Validator
 * Validates extracted content to ensure quality
 */

/**
 * Validate extracted content
 * @param {Object} extracted - Extracted content object
 * @returns {Object} Validation result with score and details
 */
export function validateExtraction(extracted) {
  const scores = {
    hasH1: extracted.h1 ? 1 : 0,
    hasButtons: extracted.buttons && extracted.buttons.length > 0 ? 1 : 0,
    hasContent: extracted.content && extracted.content.length > 0 ? 1 : 0,
    hasImages: extracted.images && extracted.images.length > 0 ? 0.5 : 0,
    hasSubheadings: (extracted.h2 && extracted.h2.length > 0) || 
                    (extracted.h3 && extracted.h3.length > 0) ? 0.5 : 0,
    containerFound: extracted.container && extracted.container.tag ? 0.5 : 0
  };
  
  // Calculate total score
  const totalScore = Object.values(scores).reduce((sum, score) => sum + score, 0);
  const maxScore = 4.5; // Maximum possible score
  const percentage = Math.round((totalScore / maxScore) * 100);
  
  // Determine if extraction is valid
  const isValid = totalScore >= 2.5; // At least H1 + content/buttons
  
  // Generate feedback
  const feedback = generateFeedback(scores, extracted);
  
  return {
    isValid,
    score: totalScore,
    maxScore,
    percentage,
    scores,
    feedback,
    quality: getQualityRating(percentage)
  };
}

/**
 * Generate feedback based on validation
 */
function generateFeedback(scores, extracted) {
  const feedback = [];
  
  if (!scores.hasH1) {
    feedback.push('Missing H1 heading');
  }
  
  if (!scores.hasButtons) {
    feedback.push('No call-to-action buttons found');
  } else if (extracted.buttons.length === 1) {
    feedback.push('Only one CTA button found');
  }
  
  if (!scores.hasContent) {
    feedback.push('No descriptive content found');
  } else if (extracted.content.length === 1) {
    feedback.push('Limited content (only one paragraph)');
  }
  
  if (!scores.hasImages) {
    feedback.push('No hero images detected');
  }
  
  if (!scores.containerFound) {
    feedback.push('No clear hero container identified');
  }
  
  // Add positive feedback too
  if (scores.hasH1 && scores.hasButtons && scores.hasContent) {
    feedback.push('✓ Core hero elements present');
  }
  
  return feedback;
}

/**
 * Get quality rating based on percentage
 */
function getQualityRating(percentage) {
  if (percentage >= 90) return 'excellent';
  if (percentage >= 75) return 'good';
  if (percentage >= 60) return 'fair';
  if (percentage >= 40) return 'poor';
  return 'insufficient';
}

/**
 * Validate specific content types
 */
export const validators = {
  /**
   * Validate button data
   */
  validateButton(button) {
    if (!button.text || button.text.length < 2) return false;
    if (button.text.length > 50) return false; // Too long for a button
    return true;
  },
  
  /**
   * Validate content paragraph
   */
  validateContent(content) {
    if (!content || content.length < 20) return false;
    if (content.length > 1000) return false; // Too long for hero content
    
    // Check for lorem ipsum
    if (/lorem\s+ipsum/i.test(content)) return false;
    
    return true;
  },
  
  /**
   * Validate image data
   */
  validateImage(image) {
    if (!image.src) return false;
    
    // Check for placeholder images
    const placeholders = ['placeholder', 'dummy', 'sample', 'temp'];
    if (placeholders.some(p => image.src.includes(p))) return false;
    
    return true;
  },
  
  /**
   * Validate heading
   */
  validateHeading(heading) {
    if (!heading || heading.length < 3) return false;
    if (heading.length > 200) return false; // Too long for a heading
    
    // Check for all caps (often not real content)
    if (heading === heading.toUpperCase() && heading.length > 10) return false;
    
    return true;
  }
};

