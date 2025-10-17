import puppeteer, { Browser, Page } from 'puppeteer';

export interface TestCase {
  name: string;
  type: 'click' | 'input' | 'navigation' | 'assertion' | 'wait' | 'api';
  selector?: string;
  value?: string;
  expected?: string;
  timeout?: number;
  // API test specific fields
  apiTest?: {
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';
    url: string;
    headers?: Record<string, string>;
    body?: any;
    expectedStatus?: number;
    expectedResponse?: {
      contains?: string[];
      fields?: string[];
      schema?: Record<string, any>;
    };
  };
}

export interface TestResult {
  name: string;
  status: 'passed' | 'failed';
  message?: string;
  duration?: number;
  screenshot?: string;
  apiResponse?: {
    request: {
      method: string;
      url: string;
      headers?: Record<string, string>;
      body?: any;
    };
    response?: {
      status: number;
      statusText: string;
      headers: Record<string, string>;
      data: any;
      size: number;
    };
    validations?: {
      statusCode: boolean;
      responseContains: boolean;
      requiredFields: boolean;
      schemaMatch: boolean;
    };
  };
}

export class TestRunner {
  private browser: Browser | null = null;
  private page: Page | null = null;

  async initialize() {
    console.log('🌐 Launching browser...');
    this.browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
      ],
    });

    this.page = await this.browser.newPage();
    await this.page.setViewport({ width: 1920, height: 1080 });

    // Enable console logging
    this.page.on('console', (msg) => {
      console.log('Browser console:', msg.text());
    });

    // Capture errors
    this.page.on('pageerror', (error) => {
      console.error('Page error:', error.message);
    });
  }

  async navigateToPage(url: string) {
    if (!this.page) throw new Error('Browser not initialized');

    console.log(`📍 Navigating to: ${url}`);
    await this.page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });
    // Wait a bit for dynamic content
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  async login(username: string, password: string) {
    if (!this.page) throw new Error('Browser not initialized');

    try {
      // Try to find common login input selectors
      const usernameSelectors = [
        'input[name="username"]',
        'input[name="email"]',
        'input[type="email"]',
        'input[id*="username"]',
        'input[id*="email"]',
      ];

      const passwordSelectors = [
        'input[name="password"]',
        'input[type="password"]',
        'input[id*="password"]',
      ];

      let usernameInput = null;
      for (const selector of usernameSelectors) {
        usernameInput = await this.page.$(selector);
        if (usernameInput) break;
      }

      let passwordInput = null;
      for (const selector of passwordSelectors) {
        passwordInput = await this.page.$(selector);
        if (passwordInput) break;
      }

      if (usernameInput && passwordInput) {
        await usernameInput.type(username);
        await passwordInput.type(password);

        // Try to find and click submit button
        const submitButton = await this.page.$(
          'button[type="submit"], input[type="submit"], button:has-text("Login"), button:has-text("Sign in")'
        );

        if (submitButton) {
          await submitButton.click();
          await this.page.waitForNavigation({ timeout: 10000 }).catch(() => {});
          console.log('✅ Login successful');
        }
      } else {
        console.log('⚠️  Login form not found');
      }
    } catch (error) {
      console.error('❌ Login failed:', error);
    }
  }

  async executeTests(testCases: TestCase[]): Promise<TestResult[]> {
    if (!this.page) throw new Error('Browser not initialized');

    const results: TestResult[] = [];

    for (const testCase of testCases) {
      const startTime = Date.now();
      const result: TestResult = {
        name: testCase.name,
        status: 'passed',
        duration: 0,
      };

      try {
        await this.executeTestCase(testCase);
      } catch (error) {
        result.status = 'failed';
        result.message = error instanceof Error ? error.message : 'Unknown error';
        
        // Capture screenshot on failure
        try {
          const screenshot = await this.page.screenshot({ 
            encoding: 'base64',
            fullPage: false 
          });
          result.screenshot = `data:image/png;base64,${screenshot}`;
        } catch (screenshotError) {
          console.error('Failed to capture screenshot:', screenshotError);
        }
      }

      result.duration = Date.now() - startTime;
      results.push(result);
    }

    return results;
  }

  private async executeTestCase(testCase: TestCase) {
    if (!this.page) throw new Error('Browser not initialized');

    switch (testCase.type) {
      case 'click':
        if (testCase.selector) {
          await this.page.waitForSelector(testCase.selector, { timeout: 5000 });
          await this.page.click(testCase.selector);
        }
        break;

      case 'input':
        if (testCase.selector && testCase.value) {
          await this.page.waitForSelector(testCase.selector, { timeout: 5000 });
          await this.page.type(testCase.selector, testCase.value);
        }
        break;

      case 'navigation':
        if (testCase.value) {
          await this.page.goto(testCase.value, { waitUntil: 'networkidle2' });
        }
        break;

      case 'assertion':
        if (testCase.selector) {
          const element = await this.page.$(testCase.selector);
          if (!element) {
            throw new Error(`Element not found: ${testCase.selector}`);
          }

          if (testCase.expected) {
            const text = await element.evaluate((el) => el.textContent);
            if (text !== testCase.expected) {
              throw new Error(`Expected "${testCase.expected}", but got "${text}"`);
            }
          }
        }
        break;

      case 'wait':
        await new Promise(resolve => setTimeout(resolve, testCase.timeout || 1000));
        break;
    }
  }

  async getPerformanceMetrics() {
    if (!this.page) throw new Error('Browser not initialized');

    const performanceMetrics = await this.page.evaluate(() => {
      const perfData = window.performance.timing;
      return {
        loadTime: perfData.loadEventEnd - perfData.navigationStart,
        domContentLoaded: perfData.domContentLoadedEventEnd - perfData.navigationStart,
      };
    });

    return performanceMetrics;
  }

  getPage(): Page {
    if (!this.page) throw new Error('Browser not initialized');
    return this.page;
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      console.log('🔒 Browser closed');
    }
  }
}

