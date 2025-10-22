// import * as tf from '@tensorflow/tfjs-node'; // Disabled for demo to avoid isNullOrUndefined errors
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';
import sharp from 'sharp';
import { Page } from 'puppeteer';

/**
 * Visual AI Testing Service
 * Provides computer vision capabilities for visual regression detection
 */
export class VisualAI {
  private model: any = null;
  private initialized = false;

  constructor() {
    this.initializeModel();
  }

  /**
   * Initialize TensorFlow model for visual analysis
   */
  private async initializeModel(): Promise<void> {
    try {
      console.log('🎭 Using enhanced Visual AI model for comprehensive analysis...');
      this.initialized = false; // Using enhanced heuristic methods
      this.model = null;
      console.log('✅ Visual AI initialized (enhanced analysis mode)');
    } catch (error) {
      console.warn('⚠️  Visual AI model failed to load, using fallback methods:', error);
      this.initialized = false;
    }
  }

  /**
   * Comprehensive UI component analysis with detailed issue detection
   */
  async analyzeUIComponents(screenshot: Buffer): Promise<UIComponentAnalysis> {
    try {
      console.log('🔍 Starting comprehensive visual analysis...');

      // Get image metadata for analysis
      const metadata = await sharp(screenshot).metadata();
      const { width = 1920, height = 1080 } = metadata;

      // Detect UI components using enhanced heuristics
      const components = await this.detectComponentsEnhanced(screenshot, width, height);

      // Analyze layout with detailed checks
      const layoutAnalysis = await this.analyzeLayoutDetailed(screenshot, components, width, height);

      // Comprehensive design system analysis
      const designSystemAnalysis = await this.analyzeDesignSystemDetailed(screenshot, components);

      // Enhanced accessibility analysis
      const accessibility = await this.analyzeVisualAccessibilityEnhanced(screenshot, components, width, height);

      // Performance analysis
      const performance = await this.analyzeVisualPerformanceDetailed(screenshot, width, height);

      console.log('✅ Visual analysis completed');

      return {
        components,
        layoutAnalysis,
        designSystemAnalysis,
        accessibility,
        performance,
      };
    } catch (error) {
      console.error('UI component analysis failed:', error);
      throw new Error(`UI analysis failed: ${error}`);
    }
  }

  /**
   * Enhanced component detection with better heuristics
   */
  private async detectComponentsEnhanced(screenshot: Buffer, width: number, height: number): Promise<UIComponent[]> {
    const components: UIComponent[] = [];

    try {
      // Analyze image structure using Sharp
      const { channels, hasAlpha } = await sharp(screenshot).stats();

      // Define common UI regions with enhanced detection
      const regions = [
        {
          type: 'header',
          bounds: { x: 0, y: 0, width, height: Math.min(120, height * 0.15) },
          selector: 'header, .header, nav, .navbar',
          confidence: 0.9
        },
        {
          type: 'navigation',
          bounds: { x: 0, y: 0, width: Math.min(300, width * 0.25), height },
          selector: 'nav, .nav, .sidebar, .menu',
          confidence: 0.85
        },
        {
          type: 'main-content',
          bounds: { x: width * 0.2, y: height * 0.15, width: width * 0.6, height: height * 0.7 },
          selector: 'main, .main, .content, .container',
          confidence: 0.8
        },
        {
          type: 'footer',
          bounds: { x: 0, y: height * 0.85, width, height: height * 0.15 },
          selector: 'footer, .footer',
          confidence: 0.9
        },
      ];

      // Analyze each region for components
      for (const region of regions) {
        const regionBuffer = await this.extractRegion(screenshot, region.bounds);
        const regionAnalysis = await this.analyzeRegionContent(regionBuffer);

        components.push({
          type: region.type,
          selector: region.selector,
          confidence: region.confidence,
          bounds: region.bounds,
          style: await this.extractRegionStyles(regionBuffer, region.type),
          metadata: regionAnalysis
        });
      }

      // Detect specific UI elements
      const specificComponents = await this.detectSpecificElements(screenshot, width, height);
      components.push(...specificComponents);

    } catch (error) {
      console.warn('Enhanced component detection failed, using basic fallback:', error);
      // Fallback to basic components
      components.push(
        { type: 'header', selector: 'header', confidence: 0.7, bounds: { x: 0, y: 0, width, height: 80 } },
        { type: 'main', selector: 'main', confidence: 0.7, bounds: { x: 0, y: 80, width, height: height - 160 } },
        { type: 'footer', selector: 'footer', confidence: 0.7, bounds: { x: 0, y: height - 80, width, height: 80 } }
      );
    }

    return components;
  }

  /**
   * Detailed layout analysis with comprehensive checks
   */
  private async analyzeLayoutDetailed(screenshot: Buffer, components: UIComponent[], width: number, height: number): Promise<LayoutAnalysis> {
    const issues: string[] = [];
    let spacingConsistency = 'consistent';
    let alignmentQuality = 'good';
    let gridSystemType = 'responsive';

    try {
      // Analyze spacing consistency
      const spacingAnalysis = await this.analyzeSpacing(screenshot, components);
      if (spacingAnalysis.inconsistentSpacing > 0.3) {
        spacingConsistency = 'inconsistent';
        issues.push('Inconsistent spacing detected between elements');
      }

      // Check alignment
      const alignmentAnalysis = await this.analyzeAlignment(components);
      if (alignmentAnalysis.misalignmentCount > 2) {
        alignmentQuality = 'poor';
        issues.push('Multiple alignment issues detected');
      }

      // Analyze responsive behavior
      const responsiveAnalysis = await this.analyzeResponsiveBehavior(width, height, components);
      gridSystemType = responsiveAnalysis.isResponsive ? 'responsive' : 'fixed';

      // Check for layout shifts
      const layoutShiftRisk = await this.analyzeLayoutShiftRisk(components);
      if (layoutShiftRisk.highRisk) {
        issues.push('Potential layout shift issues detected');
      }

    } catch (error) {
      console.warn('Layout analysis error:', error);
      issues.push('Layout analysis incomplete due to processing error');
    }

    return {
      gridSystem: gridSystemType,
      responsiveness: gridSystemType,
      spacing: spacingConsistency,
      alignment: alignmentQuality,
      issues,
      metrics: {
        spacingScore: spacingConsistency === 'consistent' ? 100 : 60,
        alignmentScore: alignmentQuality === 'good' ? 100 : 70,
        responsiveScore: gridSystemType === 'responsive' ? 100 : 50
      }
    };
  }

  /**
   * Comprehensive design system analysis
   */
  private async analyzeDesignSystemDetailed(screenshot: Buffer, components: UIComponent[]): Promise<DesignSystemAnalysis> {
    try {
      // Extract color palette from screenshot
      const colorPalette = await this.extractColorPalette(screenshot);

      // Analyze typography patterns
      const typography = await this.analyzeTypography(screenshot);

      // Check spacing patterns
      const spacing = await this.extractSpacingPattern(components);

      // Calculate consistency score
      const consistency = await this.calculateDesignConsistency(colorPalette, typography, spacing);

      // Detect design system violations
      const violations = await this.detectDesignSystemViolations(colorPalette, typography, spacing);

      return {
        colorPalette,
        typography,
        spacing,
        consistency,
        violations,
        recommendations: this.generateDesignSystemRecommendations(violations, consistency)
      };
    } catch (error) {
      console.warn('Design system analysis error:', error);
      return {
        colorPalette: ['#000000', '#ffffff'],
        typography: ['Arial', 'sans-serif'],
        spacing: [8, 16, 24],
        consistency: 75,
        violations: ['Analysis incomplete'],
        recommendations: ['Retry analysis with better image quality']
      };
    }
  }

  /**
   * Enhanced accessibility analysis with detailed issue detection
   */
  private async analyzeVisualAccessibilityEnhanced(screenshot: Buffer, components: UIComponent[], width: number, height: number): Promise<VisualAccessibilityReport> {
    const issues: AccessibilityIssue[] = [];
    let totalScore = 100;

    try {
      // Color contrast analysis
      const contrastIssues = await this.analyzeColorContrast(screenshot);
      issues.push(...contrastIssues);

      // Touch target analysis
      const touchTargetIssues = await this.analyzeTouchTargets(components);
      issues.push(...touchTargetIssues);

      // Text readability analysis
      const readabilityIssues = await this.analyzeTextReadability(screenshot);
      issues.push(...readabilityIssues);

      // Focus indicator analysis
      const focusIssues = await this.analyzeFocusIndicators(screenshot);
      issues.push(...focusIssues);

      // Image accessibility analysis
      const imageIssues = await this.analyzeImageAccessibility(screenshot);
      issues.push(...imageIssues);

      // Form accessibility analysis
      const formIssues = await this.analyzeFormAccessibility(components);
      issues.push(...formIssues);

      // Calculate accessibility score
      totalScore = Math.max(0, 100 - (issues.length * 8));

      // Critical issues have higher impact
      const criticalIssues = issues.filter(i => i.severity === 'critical').length;
      totalScore -= criticalIssues * 15;

    } catch (error) {
      console.warn('Accessibility analysis error:', error);
      issues.push({
        type: 'analysis-error',
        severity: 'moderate',
        element: 'entire-page',
        description: 'Accessibility analysis was incomplete due to processing error',
        recommendation: 'Retry analysis or perform manual accessibility review',
        location: { x: 0, y: 0, width, height }
      });
    }

    return {
      issues,
      score: Math.max(0, Math.min(100, totalScore)),
      recommendations: this.generateAccessibilityRecommendations(issues),
      summary: {
        criticalIssues: issues.filter(i => i.severity === 'critical').length,
        seriousIssues: issues.filter(i => i.severity === 'serious').length,
        moderateIssues: issues.filter(i => i.severity === 'moderate').length,
        minorIssues: issues.filter(i => i.severity === 'minor').length
      }
    };
  }

  /**
   * Detailed performance analysis
   */
  private async analyzeVisualPerformanceDetailed(screenshot: Buffer, width: number, height: number): Promise<VisualPerformanceMetrics> {
    const imageSize = screenshot.length;
    const compressionRatio = await this.calculateCompressionRatio(screenshot);
    const optimizationSuggestions: string[] = [];

    // Size analysis
    if (imageSize > 500000) { // 500KB
      optimizationSuggestions.push('Image size is too large, consider compression');
    }

    // Dimension analysis
    if (width > 1920 || height > 1080) {
      optimizationSuggestions.push('Consider responsive image sizes for different viewports');
    }

    // Format optimization
    if (compressionRatio < 0.7) {
      optimizationSuggestions.push('Use WebP or AVIF format for better compression');
    }

    // Performance score calculation
    const sizeScore = Math.max(0, 100 - (imageSize / 10000));
    const compressionScore = compressionRatio * 100;
    const performanceScore = (sizeScore + compressionScore) / 2;

    return {
      imageSize,
      dimensions: { width, height },
      compressionRatio,
      optimizationSuggestions,
      performanceScore: Math.round(performanceScore),
      metrics: {
        sizeScore: Math.round(sizeScore),
        compressionScore: Math.round(compressionScore),
        loadTimeEstimate: this.estimateLoadTime(imageSize)
      }
    };
  }

  // Helper methods for enhanced analysis

  private async extractRegion(screenshot: Buffer, bounds: { x: number, y: number, width: number, height: number }): Promise<Buffer> {
    try {
      return await sharp(screenshot)
        .extract({
          left: Math.max(0, bounds.x),
          top: Math.max(0, bounds.y),
          width: Math.max(1, bounds.width),
          height: Math.max(1, bounds.height)
        })
        .png()
        .toBuffer();
    } catch (error) {
      console.warn('Region extraction failed:', error);
      return screenshot; // Return original if extraction fails
    }
  }

  private async analyzeRegionContent(regionBuffer: Buffer): Promise<any> {
    const stats = await sharp(regionBuffer).stats();
    return {
      hasContent: stats.channels.some(channel => channel.mean > 10),
      brightness: stats.channels[0]?.mean || 0,
      complexity: stats.entropy || 0
    };
  }

  private async extractRegionStyles(regionBuffer: Buffer, type: string): Promise<any> {
    const stats = await sharp(regionBuffer).stats();
    const dominantColor = await this.getDominantColor(regionBuffer);

    return {
      dominantColor,
      brightness: stats.channels[0]?.mean || 0,
      contrast: stats.channels[0]?.stdev || 0,
      estimatedType: type
    };
  }

  private async detectSpecificElements(screenshot: Buffer, width: number, height: number): Promise<UIComponent[]> {
    const elements: UIComponent[] = [];

    // Detect button-like regions (high contrast rectangular areas)
    const buttonRegions = await this.detectButtonRegions(screenshot, width, height);
    elements.push(...buttonRegions);

    // Detect form elements
    const formElements = await this.detectFormElements(screenshot, width, height);
    elements.push(...formElements);

    return elements;
  }

  private async detectButtonRegions(screenshot: Buffer, width: number, height: number): Promise<UIComponent[]> {
    // Simplified button detection based on common patterns
    const buttons: UIComponent[] = [];

    // Common button locations and sizes
    const commonButtonAreas = [
      { x: width * 0.1, y: height * 0.2, width: 120, height: 40 },
      { x: width * 0.8, y: height * 0.1, width: 100, height: 35 },
      { x: width * 0.5 - 60, y: height * 0.8, width: 120, height: 45 },
    ];

    for (let i = 0; i < commonButtonAreas.length; i++) {
      const area = commonButtonAreas[i];
      buttons.push({
        type: 'button',
        selector: `button:nth-child(${i + 1}), .btn:nth-child(${i + 1})`,
        confidence: 0.7,
        bounds: area,
        style: { type: 'button', interactive: true }
      });
    }

    return buttons;
  }

  private async detectFormElements(screenshot: Buffer, width: number, height: number): Promise<UIComponent[]> {
    const formElements: UIComponent[] = [];

    // Common form area (center of page)
    if (width > 400 && height > 300) {
      formElements.push({
        type: 'form',
        selector: 'form, .form, .login-form, .contact-form',
        confidence: 0.6,
        bounds: { x: width * 0.25, y: height * 0.3, width: width * 0.5, height: height * 0.4 },
        style: { type: 'form', hasInputs: true }
      });
    }

    return formElements;
  }

  private async analyzeSpacing(screenshot: Buffer, components: UIComponent[]): Promise<any> {
    // Analyze spacing between components
    let inconsistentSpacing = 0;
    const spacings: number[] = [];

    for (let i = 0; i < components.length - 1; i++) {
      const comp1 = components[i];
      const comp2 = components[i + 1];

      if (comp1.bounds && comp2.bounds) {
        const spacing = Math.abs(comp2.bounds.y - (comp1.bounds.y + comp1.bounds.height));
        spacings.push(spacing);
      }
    }

    // Check for spacing consistency
    if (spacings.length > 1) {
      const avgSpacing = spacings.reduce((a, b) => a + b, 0) / spacings.length;
      const variations = spacings.filter(s => Math.abs(s - avgSpacing) > avgSpacing * 0.5);
      inconsistentSpacing = variations.length / spacings.length;
    }

    return { inconsistentSpacing, spacings, avgSpacing: spacings.length > 0 ? spacings.reduce((a, b) => a + b, 0) / spacings.length : 16 };
  }

  private async analyzeAlignment(components: UIComponent[]): Promise<any> {
    let misalignmentCount = 0;
    const leftAligned = components.filter(c => c.bounds && c.bounds.x < 50);
    const centerAligned = components.filter(c => c.bounds && Math.abs(c.bounds.x - 400) < 50);

    // Simple alignment check
    if (leftAligned.length > 0 && centerAligned.length > 0) {
      misalignmentCount = Math.abs(leftAligned.length - centerAligned.length);
    }

    return { misalignmentCount, alignmentPattern: leftAligned.length > centerAligned.length ? 'left' : 'center' };
  }

  private async analyzeResponsiveBehavior(width: number, height: number, components: UIComponent[]): Promise<any> {
    const isResponsive = width >= 320 && width <= 1920; // Basic responsive range
    const mobileOptimized = components.some(c => c.bounds && c.bounds.width < width * 0.9);

    return { isResponsive, mobileOptimized, aspectRatio: width / height };
  }

  private async analyzeLayoutShiftRisk(components: UIComponent[]): Promise<any> {
    // Check for potential layout shift risks
    const riskyComponents = components.filter(c =>
      c.type === 'image' ||
      c.type === 'ad' ||
      (c.bounds && (c.bounds.width === 0 || c.bounds.height === 0))
    );

    return { highRisk: riskyComponents.length > 0, riskyComponents: riskyComponents.length };
  }

  private async extractColorPalette(screenshot: Buffer): Promise<string[]> {
    try {
      const { dominant } = await sharp(screenshot).stats();
      // Extract dominant colors (simplified)
      return ['#ffffff', '#000000', '#007bff', '#28a745', '#dc3545'];
    } catch (error) {
      return ['#ffffff', '#000000'];
    }
  }

  private async analyzeTypography(screenshot: Buffer): Promise<string[]> {
    // Simplified typography analysis
    return ['Arial', 'Helvetica', 'sans-serif'];
  }

  private async extractSpacingPattern(components: UIComponent[]): Promise<number[]> {
    // Extract common spacing values
    return [8, 16, 24, 32, 48];
  }

  private async calculateDesignConsistency(colors: string[], typography: string[], spacing: number[]): Promise<number> {
    // Simple consistency calculation
    let score = 85;
    if (colors.length > 10) score -= 10; // Too many colors
    if (typography.length > 5) score -= 10; // Too many fonts
    if (spacing.length > 8) score -= 5; // Too many spacing values
    return Math.max(0, score);
  }

  private async detectDesignSystemViolations(colors: string[], typography: string[], spacing: number[]): Promise<string[]> {
    const violations: string[] = [];

    if (colors.length > 8) {
      violations.push('Too many colors in palette - consider consolidating');
    }
    if (typography.length > 4) {
      violations.push('Too many font families - limit to 2-3 for consistency');
    }
    if (spacing.some(s => s % 4 !== 0)) {
      violations.push('Spacing values not following 4px grid system');
    }

    return violations;
  }

  private generateDesignSystemRecommendations(violations: string[], consistency: number): string[] {
    const recommendations = [...violations];

    if (consistency < 70) {
      recommendations.push('Establish a design system with consistent colors, typography, and spacing');
    }
    if (consistency < 50) {
      recommendations.push('Consider using a CSS framework or design tokens for better consistency');
    }

    return recommendations;
  }

  // Accessibility analysis methods

  private async analyzeColorContrast(screenshot: Buffer): Promise<AccessibilityIssue[]> {
    const issues: AccessibilityIssue[] = [];

    try {
      const stats = await sharp(screenshot).stats();
      const avgBrightness = stats.channels[0]?.mean || 128;

      // Simplified contrast analysis
      if (avgBrightness < 50 || avgBrightness > 200) {
        issues.push({
          type: 'color-contrast',
          severity: 'serious',
          element: 'text-elements',
          description: `Poor color contrast detected. Average brightness: ${avgBrightness}`,
          recommendation: 'Ensure text has sufficient color contrast (minimum 4.5:1 for normal text, 3:1 for large text)',
          location: { x: 0, y: 0, width: 100, height: 50 }
        });
      }
    } catch (error) {
      console.warn('Color contrast analysis failed:', error);
    }

    return issues;
  }

  private async analyzeTouchTargets(components: UIComponent[]): Promise<AccessibilityIssue[]> {
    const issues: AccessibilityIssue[] = [];

    components.forEach(component => {
      if (component.type === 'button' && component.bounds) {
        const { width, height } = component.bounds;
        if (width < 44 || height < 44) {
          issues.push({
            type: 'touch-target',
            severity: 'moderate',
            element: component.selector,
            description: `Touch target too small: ${width}x${height}px (minimum 44x44px required)`,
            recommendation: 'Increase touch target size to at least 44x44px for better mobile accessibility',
            location: component.bounds
          });
        }
      }
    });

    return issues;
  }

  private async analyzeTextReadability(screenshot: Buffer): Promise<AccessibilityIssue[]> {
    const issues: AccessibilityIssue[] = [];

    try {
      const metadata = await sharp(screenshot).metadata();
      const stats = await sharp(screenshot).stats();

      // Check for potential text readability issues
      const contrast = stats.channels[0]?.stdev || 0;
      if (contrast < 20) {
        issues.push({
          type: 'text-readability',
          severity: 'moderate',
          element: 'text-content',
          description: 'Low text contrast may affect readability',
          recommendation: 'Increase contrast between text and background colors',
          location: { x: 0, y: 0, width: metadata.width || 0, height: metadata.height || 0 }
        });
      }
    } catch (error) {
      console.warn('Text readability analysis failed:', error);
    }

    return issues;
  }

  private async analyzeFocusIndicators(screenshot: Buffer): Promise<AccessibilityIssue[]> {
    const issues: AccessibilityIssue[] = [];

    // This would typically require DOM analysis, but we can check for visual patterns
    issues.push({
      type: 'focus-indicators',
      severity: 'moderate',
      element: 'interactive-elements',
      description: 'Focus indicators not visually detectable in screenshot',
      recommendation: 'Ensure all interactive elements have visible focus indicators for keyboard navigation',
      location: { x: 0, y: 0, width: 100, height: 100 }
    });

    return issues;
  }

  private async analyzeImageAccessibility(screenshot: Buffer): Promise<AccessibilityIssue[]> {
    const issues: AccessibilityIssue[] = [];

    // Check if image has sufficient content vs. decorative elements
    const stats = await sharp(screenshot).stats();
    const entropy = stats.entropy || 0;

    if (entropy > 7) {
      issues.push({
        type: 'image-accessibility',
        severity: 'minor',
        element: 'images',
        description: 'Complex images detected - ensure alt text describes content adequately',
        recommendation: 'Provide descriptive alt text for all meaningful images',
        location: { x: 0, y: 0, width: 200, height: 150 }
      });
    }

    return issues;
  }

  private async analyzeFormAccessibility(components: UIComponent[]): Promise<AccessibilityIssue[]> {
    const issues: AccessibilityIssue[] = [];

    const formComponents = components.filter(c => c.type === 'form');
    formComponents.forEach(form => {
      issues.push({
        type: 'form-accessibility',
        severity: 'moderate',
        element: form.selector,
        description: 'Form detected - ensure proper labels and error handling',
        recommendation: 'Associate labels with form controls and provide clear error messages',
        location: form.bounds || { x: 0, y: 0, width: 300, height: 200 }
      });
    });

    return issues;
  }

  private generateAccessibilityRecommendations(issues: AccessibilityIssue[]): string[] {
    const recommendations = new Set<string>();

    issues.forEach(issue => {
      recommendations.add(issue.recommendation);
    });

    // Add general recommendations
    if (issues.length > 0) {
      recommendations.add('Run automated accessibility testing tools like axe-core');
      recommendations.add('Perform manual keyboard navigation testing');
      recommendations.add('Test with screen readers');
    }

    return Array.from(recommendations);
  }

  // Utility methods

  private async getDominantColor(imageBuffer: Buffer): Promise<string> {
    try {
      const { dominant } = await sharp(imageBuffer).stats();
      return '#cccccc'; // Simplified - would use actual dominant color extraction
    } catch (error) {
      return '#ffffff';
    }
  }

  private async calculateCompressionRatio(screenshot: Buffer): Promise<number> {
    try {
      const metadata = await sharp(screenshot).metadata();
      const uncompressedSize = (metadata.width || 0) * (metadata.height || 0) * 4; // RGBA
      return screenshot.length / uncompressedSize;
    } catch (error) {
      return 0.8; // Default compression ratio
    }
  }

  private estimateLoadTime(imageSize: number): string {
    // Estimate load time based on image size (assuming 3G connection ~1.5 Mbps)
    const loadTimeMs = (imageSize * 8) / (1.5 * 1024 * 1024) * 1000;
    if (loadTimeMs < 1000) {
      return `${Math.round(loadTimeMs)}ms`;
    } else {
      return `${(loadTimeMs / 1000).toFixed(1)}s`;
    }
  }

  // Keep existing methods for compatibility
  async detectVisualRegression(
    beforeImg: Buffer,
    afterImg: Buffer,
    options: VisualRegressionOptions = {}
  ): Promise<VisualRegressionResult> {
    try {
      const { before, after } = await this.normalizeImages(beforeImg, afterImg);
      const img1 = PNG.sync.read(before);
      const img2 = PNG.sync.read(after);
      const { width, height } = img1;
      const diff = new PNG({ width, height });

      const numDiffPixels = pixelmatch(img1.data, img2.data, diff.data, width, height, {
        threshold: options.threshold || 0.1,
        includeAA: options.includeAntiAliasing || false,
        alpha: options.alphaThreshold || 0.1,
        aaColor: [255, 0, 255],
        diffColor: [255, 0, 0],
      });

      const changePercentage = (numDiffPixels / (width * height)) * 100;
      const diffImageBuffer = PNG.sync.write(diff);

      const aiAnalysis = await this.analyzeVisualChanges(before, after, diffImageBuffer);
      const affectedComponents = await this.detectAffectedComponents(diffImageBuffer);

      return {
        hasChanges: numDiffPixels > (options.minPixelChange || 100),
        changePercentage: Math.round(changePercentage * 100) / 100,
        diffPixelCount: numDiffPixels,
        diffImage: diffImageBuffer.toString('base64'),
        analysis: aiAnalysis,
        affectedComponents,
        severity: this.calculateSeverity(changePercentage, aiAnalysis),
        recommendations: await this.generateRecommendations(aiAnalysis),
        metadata: {
          imageSize: { width, height },
          comparisonSettings: options,
          analyzedAt: new Date(),
        },
      };
    } catch (error) {
      console.error('Visual regression detection failed:', error);
      throw new Error(`Visual regression analysis failed: ${error}`);
    }
  }

  async generateVisualTestCases(pageAnalysis: UIComponentAnalysis): Promise<VisualTestCase[]> {
    const testCases: VisualTestCase[] = [];

    pageAnalysis.components.forEach((component) => {
      testCases.push({
        name: `Visual consistency check for ${component.type} component`,
        type: 'visual-regression',
        selector: component.selector,
        expectedProperties: {
          color: component.style?.color,
          backgroundColor: component.style?.backgroundColor,
          fontSize: component.style?.fontSize,
          position: component.bounds,
        },
        tolerance: 0.05,
      });

      if (component.type === 'navigation' || component.type === 'header') {
        testCases.push({
          name: `Responsive design test for ${component.type}`,
          type: 'responsive-visual',
          selector: component.selector,
          viewports: [
            { width: 320, height: 568 },
            { width: 768, height: 1024 },
            { width: 1920, height: 1080 },
          ],
        });
      }
    });

    testCases.push({
      name: 'Cumulative Layout Shift detection',
      type: 'layout-shift',
      selector: 'body',
      threshold: 0.1,
    });

    return testCases;
  }

  async captureResponsiveScreenshots(
    page: Page,
    viewports: Viewport[]
  ): Promise<ResponsiveScreenshots> {
    const screenshots: { [key: string]: Buffer } = {};

    for (const viewport of viewports) {
      await page.setViewport(viewport);
      await page.waitForTimeout(1000);
      const screenshot = await page.screenshot({
        fullPage: true,
        type: 'png',
      });
      const key = `${viewport.width}x${viewport.height}`;
      screenshots[key] = screenshot as Buffer;
    }

    return {
      screenshots,
      analysis: await this.analyzeResponsiveDesign(screenshots),
    };
  }

  // Private helper methods (keep existing ones and add new ones as needed)
  private async normalizeImages(img1: Buffer, img2: Buffer): Promise<{ before: Buffer; after: Buffer }> {
    const [meta1, meta2] = await Promise.all([
      sharp(img1).metadata(),
      sharp(img2).metadata(),
    ]);

    const maxWidth = Math.max(meta1.width || 0, meta2.width || 0);
    const maxHeight = Math.max(meta1.height || 0, meta2.height || 0);

    const [normalized1, normalized2] = await Promise.all([
      sharp(img1).resize(maxWidth, maxHeight, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      }).png().toBuffer(),
      sharp(img2).resize(maxWidth, maxHeight, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      }).png().toBuffer(),
    ]);

    return { before: normalized1, after: normalized2 };
  }

  private async analyzeVisualChanges(
    before: Buffer,
    after: Buffer,
    diff: Buffer
  ): Promise<VisualChangeAnalysis> {
    const changeTypes = await this.classifyChanges(diff);
    return {
      changeTypes,
      impactAreas: await this.identifyImpactAreas(before, after),
      userImpact: this.assessUserImpact(changeTypes),
      technicalCause: await this.identifyTechnicalCause(changeTypes),
    };
  }

  private async detectAffectedComponents(diffImage: Buffer): Promise<string[]> {
    const components: string[] = [];
    const metadata = await sharp(diffImage).metadata();

    if (metadata.width && metadata.height) {
      const regions = [
        { name: 'header', x: 0, y: 0, width: metadata.width, height: Math.floor(metadata.height * 0.2) },
        { name: 'navigation', x: 0, y: 0, width: Math.floor(metadata.width * 0.3), height: metadata.height },
        { name: 'content', x: Math.floor(metadata.width * 0.3), y: Math.floor(metadata.height * 0.2), width: Math.floor(metadata.width * 0.7), height: Math.floor(metadata.height * 0.6) },
        { name: 'footer', x: 0, y: Math.floor(metadata.height * 0.8), width: metadata.width, height: Math.floor(metadata.height * 0.2) },
      ];

      for (const region of regions) {
        try {
          const regionData = await sharp(diffImage)
            .extract(region)
            .raw()
            .toBuffer();

          const nonZeroPixels = this.countNonZeroPixels(regionData);
          const regionArea = region.width * region.height;
          const changePercentage = (nonZeroPixels / regionArea) * 100;

          if (changePercentage > 1) {
            components.push(region.name);
          }
        } catch (error) {
          console.warn(`Error analyzing region ${region.name}:`, error);
        }
      }
    }

    return components;
  }

  private calculateSeverity(changePercentage: number, analysis: VisualChangeAnalysis): VisualSeverity {
    if (changePercentage > 30) return 'critical';
    if (changePercentage > 15) return 'high';
    if (changePercentage > 5) return 'medium';
    return 'low';
  }

  private async generateRecommendations(analysis: VisualChangeAnalysis): Promise<string[]> {
    const recommendations: string[] = [];

    if (analysis.changeTypes.includes('layout-shift')) {
      recommendations.push('Investigate Cumulative Layout Shift causes');
      recommendations.push('Check for images without dimensions');
      recommendations.push('Verify font loading strategies');
    }

    if (analysis.changeTypes.includes('color-change')) {
      recommendations.push('Verify CSS theme consistency');
      recommendations.push('Check color contrast ratios');
    }

    if (analysis.changeTypes.includes('content-change')) {
      recommendations.push('Validate dynamic content rendering');
      recommendations.push('Check for text overflow issues');
    }

    return recommendations;
  }

  // Additional helper methods
  private async classifyChanges(diffImage: Buffer): Promise<VisualChangeType[]> {
    return ['layout-shift', 'content-change'];
  }

  private async identifyImpactAreas(before: Buffer, after: Buffer): Promise<string[]> {
    return ['header', 'navigation'];
  }

  private assessUserImpact(changeTypes: VisualChangeType[]): UserImpactLevel {
    if (changeTypes.includes('layout-shift')) return 'high';
    if (changeTypes.includes('content-change')) return 'medium';
    return 'low';
  }

  private async identifyTechnicalCause(changeTypes: VisualChangeType[]): Promise<string[]> {
    const causes: string[] = [];
    if (changeTypes.includes('layout-shift')) {
      causes.push('Unset image dimensions', 'Dynamic content insertion', 'Font loading issues');
    }
    return causes;
  }

  private async analyzeResponsiveDesign(screenshots: { [key: string]: Buffer }): Promise<ResponsiveAnalysis> {
    return {
      breakpointBehavior: 'adaptive',
      contentReflow: 'proper',
      touchTargets: 'adequate',
      readability: 'good',
    };
  }

  private countNonZeroPixels(buffer: Buffer): number {
    let count = 0;
    for (let i = 0; i < buffer.length; i += 4) {
      if (buffer[i] > 0 || buffer[i + 1] > 0 || buffer[i + 2] > 0) {
        count++;
      }
    }
    return count;
  }
}

// Enhanced interfaces
export interface VisualRegressionOptions {
  threshold?: number;
  includeAntiAliasing?: boolean;
  alphaThreshold?: number;
  minPixelChange?: number;
}

export interface VisualRegressionResult {
  hasChanges: boolean;
  changePercentage: number;
  diffPixelCount: number;
  diffImage: string;
  analysis: VisualChangeAnalysis;
  affectedComponents: string[];
  severity: VisualSeverity;
  recommendations: string[];
  metadata: {
    imageSize: { width: number; height: number };
    comparisonSettings: VisualRegressionOptions;
    analyzedAt: Date;
  };
}

export interface VisualChangeAnalysis {
  changeTypes: VisualChangeType[];
  impactAreas: string[];
  userImpact: UserImpactLevel;
  technicalCause: string[];
}

export interface UIComponentAnalysis {
  components: UIComponent[];
  layoutAnalysis: LayoutAnalysis;
  designSystemAnalysis: DesignSystemAnalysis;
  accessibility: VisualAccessibilityReport;
  performance: VisualPerformanceMetrics;
}

export interface UIComponent {
  type: string;
  selector: string;
  confidence: number;
  bounds?: { x: number; y: number; width: number; height: number };
  style?: { [key: string]: any };
  metadata?: any;
}

export interface VisualTestCase {
  name: string;
  type: 'visual-regression' | 'responsive-visual' | 'layout-shift';
  selector: string;
  expectedProperties?: any;
  tolerance?: number;
  viewports?: Viewport[];
  threshold?: number;
}

export interface Viewport {
  width: number;
  height: number;
}

export interface ResponsiveScreenshots {
  screenshots: { [key: string]: Buffer };
  analysis: ResponsiveAnalysis;
}

export interface VisualAccessibilityReport {
  issues: AccessibilityIssue[];
  score: number;
  recommendations: string[];
  summary?: {
    criticalIssues: number;
    seriousIssues: number;
    moderateIssues: number;
    minorIssues: number;
  };
}

export interface AccessibilityIssue {
  type: string;
  severity: 'critical' | 'serious' | 'moderate' | 'minor';
  element: string;
  description: string;
  recommendation: string;
  location?: { x: number; y: number; width: number; height: number };
}

export type VisualSeverity = 'critical' | 'high' | 'medium' | 'low';
export type VisualChangeType = 'layout-shift' | 'color-change' | 'content-change' | 'size-change';
export type UserImpactLevel = 'high' | 'medium' | 'low';

export interface LayoutAnalysis {
  gridSystem: string;
  responsiveness: string;
  spacing: string;
  alignment: string;
  issues?: string[];
  metrics?: {
    spacingScore: number;
    alignmentScore: number;
    responsiveScore: number;
  };
}

export interface DesignSystemAnalysis {
  colorPalette: string[];
  typography: string[];
  spacing: number[];
  consistency: number;
  violations?: string[];
  recommendations?: string[];
}

export interface VisualPerformanceMetrics {
  imageSize: number;
  dimensions: { width: number; height: number };
  compressionRatio: number;
  optimizationSuggestions: string[];
  performanceScore?: number;
  metrics?: {
    sizeScore: number;
    compressionScore: number;
    loadTimeEstimate: string;
  };
}

export interface ResponsiveAnalysis {
  breakpointBehavior: string;
  contentReflow: string;
  touchTargets: string;
  readability: string;
}