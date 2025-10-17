import { Page } from 'puppeteer';

export interface PerformanceMetrics {
  loadTime: number;
  domContentLoaded: number;
  firstContentfulPaint?: number;
  largestContentfulPaint?: number;
  cumulativeLayoutShift?: number;
  totalBlockingTime?: number;
}

export interface AccessibilityIssue {
  id: string;
  impact: 'critical' | 'serious' | 'moderate' | 'minor';
  description: string;
  selector?: string;
}

export interface NetworkAnalysis {
  totalRequests: number;
  failedRequests: number;
  totalSize: number;
  slowestResource?: {
    url: string;
    duration: number;
    size: number;
  };
}

export interface DevToolsReport {
  performance: PerformanceMetrics;
  accessibility: {
    score: number;
    issues: AccessibilityIssue[];
  };
  network: NetworkAnalysis;
  console: {
    errors: string[];
    warnings: string[];
  };
}

/**
 * Chrome DevTools Protocol Analyzer
 * Uses Puppeteer's CDP access for deep analysis
 */
export class DevToolsAnalyzer {
  private page: Page;
  private consoleErrors: string[] = [];
  private consoleWarnings: string[] = [];
  private networkRequests: any[] = [];

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Start monitoring console and network
   */
  async startMonitoring() {
    // Listen to console messages
    this.page.on('console', (msg) => {
      const type = msg.type();
      const text = msg.text();
      
      if (type === 'error') {
        this.consoleErrors.push(text);
      } else if (type === 'warn') {
        this.consoleWarnings.push(text);
      }
    });

    // Listen to network requests via CDP
    const client = await this.page.target().createCDPSession();
    await client.send('Network.enable');

    client.on('Network.responseReceived', (params) => {
      this.networkRequests.push({
        url: params.response.url,
        status: params.response.status,
        mimeType: params.response.mimeType,
        timing: params.response.timing,
      });
    });
  }

  /**
   * Get comprehensive DevTools report
   */
  async getReport(): Promise<DevToolsReport> {
    const performance = await this.getPerformanceMetrics();
    const accessibility = await this.getAccessibilityReport();
    const network = await this.getNetworkAnalysis();

    return {
      performance,
      accessibility,
      network,
      console: {
        errors: this.consoleErrors,
        warnings: this.consoleWarnings,
      },
    };
  }

  /**
   * Get performance metrics using Chrome DevTools Protocol
   */
  private async getPerformanceMetrics(): Promise<PerformanceMetrics> {
    const performanceTiming = JSON.parse(
      await this.page.evaluate(() => JSON.stringify(window.performance.timing))
    );

    const metrics = await this.page.evaluate(() => {
      const perfEntries = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const paintEntries = performance.getEntriesByType('paint');

      const fcp = paintEntries.find(entry => entry.name === 'first-contentful-paint');
      
      return {
        domContentLoaded: perfEntries?.domContentLoadedEventEnd - perfEntries?.domContentLoadedEventStart || 0,
        loadTime: perfEntries?.loadEventEnd - perfEntries?.fetchStart || 0,
        firstContentfulPaint: fcp?.startTime || 0,
      };
    });

    // Get Core Web Vitals using CDP
    const client = await this.page.target().createCDPSession();
    await client.send('Performance.enable');
    
    let lcp = 0;
    let cls = 0;

    try {
      // Get Largest Contentful Paint
      const lcpMetric = await this.page.evaluate(() => {
        return new Promise((resolve) => {
          new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1];
            resolve(lastEntry?.startTime || 0);
          }).observe({ entryTypes: ['largest-contentful-paint'] });

          // Timeout after 2 seconds
          setTimeout(() => resolve(0), 2000);
        });
      });
      lcp = lcpMetric as number;

      // Get Cumulative Layout Shift
      const clsMetric = await this.page.evaluate(() => {
        return new Promise((resolve) => {
          let clsValue = 0;
          new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              if (!(entry as any).hadRecentInput) {
                clsValue += (entry as any).value;
              }
            }
            resolve(clsValue);
          }).observe({ entryTypes: ['layout-shift'] });

          // Timeout after 2 seconds
          setTimeout(() => resolve(clsValue), 2000);
        });
      });
      cls = clsMetric as number;
    } catch (error) {
      console.log('Core Web Vitals collection failed:', error);
    }

    return {
      loadTime: metrics.loadTime,
      domContentLoaded: metrics.domContentLoaded,
      firstContentfulPaint: metrics.firstContentfulPaint,
      largestContentfulPaint: lcp,
      cumulativeLayoutShift: cls,
    };
  }

  /**
   * Get accessibility analysis using Chrome DevTools Protocol
   */
  private async getAccessibilityReport() {
    const issues: AccessibilityIssue[] = [];

    const a11yChecks = await this.page.evaluate(() => {
      const results = {
        missingAltText: 0,
        missingLabels: 0,
        lowContrast: 0,
        missingLandmarks: 0,
        emptyButtons: 0,
        emptyLinks: 0,
      };

      // Check images without alt text
      const imagesWithoutAlt = document.querySelectorAll('img:not([alt])');
      results.missingAltText = imagesWithoutAlt.length;

      // Check inputs without labels
      const inputs = document.querySelectorAll('input:not([type="hidden"])');
      inputs.forEach((input) => {
        if (!(input as HTMLInputElement).labels?.length && 
            !input.getAttribute('aria-label')) {
          results.missingLabels++;
        }
      });

      // Check for main landmark
      if (!document.querySelector('main, [role="main"]')) {
        results.missingLandmarks++;
      }

      // Check empty buttons
      const buttons = document.querySelectorAll('button');
      buttons.forEach((btn) => {
        if (!btn.textContent?.trim() && !btn.getAttribute('aria-label')) {
          results.emptyButtons++;
        }
      });

      // Check empty links
      const links = document.querySelectorAll('a');
      links.forEach((link) => {
        if (!link.textContent?.trim() && !link.getAttribute('aria-label')) {
          results.emptyLinks++;
        }
      });

      return results;
    });

    // Generate issues
    if (a11yChecks.missingAltText > 0) {
      issues.push({
        id: 'missing-alt-text',
        impact: 'critical',
        description: `${a11yChecks.missingAltText} images missing alt text`,
        selector: 'img:not([alt])',
      });
    }

    if (a11yChecks.missingLabels > 0) {
      issues.push({
        id: 'missing-form-labels',
        impact: 'serious',
        description: `${a11yChecks.missingLabels} form inputs without labels`,
      });
    }

    if (a11yChecks.missingLandmarks > 0) {
      issues.push({
        id: 'missing-landmarks',
        impact: 'moderate',
        description: 'Page missing main landmark',
      });
    }

    if (a11yChecks.emptyButtons > 0) {
      issues.push({
        id: 'empty-buttons',
        impact: 'serious',
        description: `${a11yChecks.emptyButtons} buttons without accessible text`,
      });
    }

    if (a11yChecks.emptyLinks > 0) {
      issues.push({
        id: 'empty-links',
        impact: 'serious',
        description: `${a11yChecks.emptyLinks} links without accessible text`,
      });
    }

    // Calculate score (100 - 10 points per issue, weighted by impact)
    const impactWeights = { critical: 15, serious: 10, moderate: 5, minor: 2 };
    const totalDeductions = issues.reduce((sum, issue) => sum + impactWeights[issue.impact], 0);
    const score = Math.max(0, 100 - totalDeductions);

    return {
      score,
      issues,
    };
  }

  /**
   * Get network analysis
   */
  private async getNetworkAnalysis(): Promise<NetworkAnalysis> {
    const totalRequests = this.networkRequests.length;
    const failedRequests = this.networkRequests.filter(r => r.status >= 400).length;

    // Find slowest resource
    let slowestResource: any = null;
    let maxDuration = 0;

    this.networkRequests.forEach((req) => {
      if (req.timing) {
        const duration = req.timing.receiveHeadersEnd - req.timing.requestTime;
        if (duration > maxDuration) {
          maxDuration = duration;
          slowestResource = {
            url: req.url,
            duration: Math.round(duration),
            size: 0, // Size not easily available without additional CDP calls
          };
        }
      }
    });

    return {
      totalRequests,
      failedRequests,
      totalSize: 0, // Would need additional CDP calls to get accurate size
      slowestResource: slowestResource || undefined,
    };
  }

  /**
   * Reset monitoring data
   */
  reset() {
    this.consoleErrors = [];
    this.consoleWarnings = [];
    this.networkRequests = [];
  }
}

