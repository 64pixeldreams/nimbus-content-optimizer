/**
 * Image Extractor
 * Extracts hero/feature images from containers
 */

/**
 * Extract images from a container
 * @param {Element} container - Container element to search within
 * @param {Object} options - Extraction options
 * @returns {Array} Array of image objects
 */
export function extractImages(container, options = {}) {
  const {
    maxImages = 3,
    minWidth = 200,
    minHeight = 150,
    excludeIcons = true,
    excludeLogos = true
  } = options;
  
  const images = [];
  const imgElements = container.querySelectorAll('img');
  
  imgElements.forEach(img => {
    // Skip if no source
    if (!img.src) return;
    
    // Skip icons and logos if requested
    if (excludeIcons && isLikelyIcon(img)) return;
    if (excludeLogos && isLikelyLogo(img)) return;
    
    // Check dimensions if available
    if (!meetsMinimumSize(img, minWidth, minHeight)) return;
    
    const imageData = extractImageData(img);
    if (imageData) {
      images.push(imageData);
    }
    
    // Stop if we have enough
    if (images.length >= maxImages) return;
  });
  
  // Also check for background images on the container
  const bgImage = extractBackgroundImage(container);
  if (bgImage && images.length < maxImages) {
    images.push(bgImage);
  }
  
  return images;
}

/**
 * Extract data from an image element
 */
function extractImageData(img) {
  return {
    src: img.src,
    alt: img.alt || '',
    title: img.title || '',
    width: img.width || null,
    height: img.height || null,
    classes: img.className || '',
    loading: img.loading || 'auto',
    isHero: isLikelyHeroImage(img)
  };
}

/**
 * Check if image is likely an icon
 */
function isLikelyIcon(img) {
  const indicators = [
    'icon', 'ico', 'glyph', 'symbol',
    'fa-', 'fi-', 'material-'
  ];
  
  const checkString = [
    img.src,
    img.alt,
    img.className,
    img.id
  ].join(' ').toLowerCase();
  
  // Check indicators
  if (indicators.some(ind => checkString.includes(ind))) return true;
  
  // Check size (icons are usually small)
  if (img.width && img.width < 64) return true;
  if (img.height && img.height < 64) return true;
  
  // Check file name patterns
  if (/\/(icons?|sprites?)\//.test(img.src)) return true;
  if (/\.(svg)$/i.test(img.src) && img.width < 100) return true;
  
  return false;
}

/**
 * Check if image is likely a logo
 */
function isLikelyLogo(img) {
  const indicators = ['logo', 'brand', 'wordmark'];
  
  const checkString = [
    img.src,
    img.alt,
    img.className,
    img.id
  ].join(' ').toLowerCase();
  
  return indicators.some(ind => checkString.includes(ind));
}

/**
 * Check if image meets minimum size requirements
 */
function meetsMinimumSize(img, minWidth, minHeight) {
  // If dimensions are set as attributes
  if (img.width && img.height) {
    return img.width >= minWidth && img.height >= minHeight;
  }
  
  // If natural dimensions are available (image loaded)
  if (img.naturalWidth && img.naturalHeight) {
    return img.naturalWidth >= minWidth && img.naturalHeight >= minHeight;
  }
  
  // If no dimensions available, include it (will be filtered client-side)
  return true;
}

/**
 * Check if image is likely a hero image
 */
function isLikelyHeroImage(img) {
  const heroIndicators = [
    'hero', 'banner', 'feature', 'splash',
    'background', 'cover', 'main'
  ];
  
  const checkString = [
    img.className,
    img.id,
    img.parentElement?.className
  ].join(' ').toLowerCase();
  
  return heroIndicators.some(ind => checkString.includes(ind));
}

/**
 * Extract background image from element
 */
function extractBackgroundImage(element) {
  const style = element.style;
  const bgImage = style.backgroundImage;
  
  if (!bgImage || bgImage === 'none') return null;
  
  // Extract URL from background-image
  const match = bgImage.match(/url\(['"]?([^'"]+)['"]?\)/);
  if (!match) return null;
  
  return {
    src: match[1],
    alt: 'Background image',
    title: '',
    width: null,
    height: null,
    classes: element.className || '',
    loading: 'eager',
    isHero: true,
    isBackground: true
  };
}

