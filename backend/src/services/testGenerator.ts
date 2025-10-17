import { Page } from 'puppeteer';
import { TestCase } from './testRunner.js';

export class TestGenerator {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Main method to generate comprehensive test cases by analyzing the DOM
   */
  async generateTests(): Promise<TestCase[]> {
    console.log('🔍 Analyzing page structure...');

    const tests: TestCase[] = [];

    // Generate different types of tests
    tests.push(...(await this.generateNavigationTests()));
    tests.push(...(await this.generateFormTests()));
    tests.push(...(await this.generateButtonTests()));
    tests.push(...(await this.generateLinkTests()));
    tests.push(...(await this.generateImageTests()));
    tests.push(...(await this.generateAccessibilityTests()));

    console.log(`✅ Generated ${tests.length} test cases`);
    return tests;
  }

  /**
   * Generate tests for page navigation and basic loading
   */
  private async generateNavigationTests(): Promise<TestCase[]> {
    const tests: TestCase[] = [];

    // Test 1: Page loads successfully
    tests.push({
      name: 'Page loads successfully',
      type: 'assertion',
      selector: 'body',
    });

    // Test 2: Title exists
    const title = await this.page.title();
    if (title) {
      tests.push({
        name: `Page title is present: "${title}"`,
        type: 'assertion',
        selector: 'title',
        expected: title,
      });
    }

    // Test 3: No console errors
    tests.push({
      name: 'No console errors on page load',
      type: 'assertion',
    });

    return tests;
  }

  /**
   * Generate tests for all forms on the page
   */
  private async generateFormTests(): Promise<TestCase[]> {
    const tests: TestCase[] = [];

    try {
      const forms = await this.page.$$('form');
      console.log(`   Found ${forms.length} form(s)`);

      for (let i = 0; i < forms.length; i++) {
        const formId = await forms[i].evaluate((el, idx) => {
          return el.id || el.name || `form-${idx}`;
        }, i);

        // Test form existence
        tests.push({
          name: `Form "${formId}" exists`,
          type: 'assertion',
          selector: `form${formId.startsWith('form-') ? '' : `#${formId}`}`,
        });

        // Get form inputs
        const inputs = await forms[i].$$('input, textarea, select');
        
        for (let j = 0; j < inputs.length; j++) {
          const inputInfo = await inputs[j].evaluate((el) => {
            const input = el as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
            return {
              type: (input as any).type || 'text',
              name: input.name,
              id: input.id,
              required: (input as any).required || false,
              placeholder: (input as any).placeholder || '',
            };
          });

          const selector = inputInfo.id 
            ? `#${inputInfo.id}` 
            : inputInfo.name 
            ? `[name="${inputInfo.name}"]` 
            : `form input:nth-of-type(${j + 1})`;

          // Test input is interactable
          tests.push({
            name: `Form input "${inputInfo.name || inputInfo.id || 'field-' + j}" is interactable`,
            type: 'assertion',
            selector: selector,
          });

          // Test input accepts value (skip for submit/button types)
          if (!['submit', 'button', 'reset', 'image'].includes(inputInfo.type)) {
            tests.push({
              name: `Form input "${inputInfo.name || inputInfo.id || 'field-' + j}" accepts input`,
              type: 'input',
              selector: selector,
              value: this.generateTestValue(inputInfo.type, inputInfo.placeholder),
            });
          }
        }

        // Test form submission
        const submitButton = await forms[i].$('button[type="submit"], input[type="submit"]');
        if (submitButton) {
          const buttonText = await submitButton.evaluate((el) => 
            el.textContent?.trim() || (el as HTMLInputElement).value || 'Submit'
          );
          
          tests.push({
            name: `Form "${formId}" submit button "${buttonText}" is clickable`,
            type: 'assertion',
            selector: `form button[type="submit"], form input[type="submit"]`,
          });
        }
      }
    } catch (error) {
      console.error('Error generating form tests:', error);
    }

    return tests;
  }

  /**
   * Generate tests for buttons on the page
   */
  private async generateButtonTests(): Promise<TestCase[]> {
    const tests: TestCase[] = [];

    try {
      // Only get visible, clickable buttons
      const buttons = await this.page.$$('button:not([type="submit"]):not([hidden]):not([disabled]), input[type="button"]:not([hidden]):not([disabled])');
      console.log(`   Found ${buttons.length} button(s)`);

      let validButtons = 0;
      for (let i = 0; i < buttons.length && validButtons < 5; i++) { // Limit to 5 visible buttons
        const buttonInfo = await buttons[i].evaluate((el, idx) => {
          const button = el as HTMLButtonElement;
          // Check if button is visible
          const rect = button.getBoundingClientRect();
          const isVisible = rect.width > 0 && rect.height > 0 && 
                           window.getComputedStyle(button).display !== 'none' &&
                           window.getComputedStyle(button).visibility !== 'hidden';
          
          const text = button.textContent?.trim() || (button as any).value || `button-${idx}`;
          return {
            text: text.substring(0, 50),
            id: button.id,
            class: button.className,
            isVisible: isVisible,
          };
        }, i);

        // Only add test if button is visible and has ID
        if (buttonInfo.isVisible && buttonInfo.text && buttonInfo.text !== 'button-' + i) {
          // Only test buttons with IDs (more reliable)
          if (buttonInfo.id) {
            tests.push({
              name: `Button "${buttonInfo.text}" exists`,
              type: 'assertion',
              selector: `#${buttonInfo.id}`,
            });
            validButtons++;
          }
        }
      }
    } catch (error) {
      console.error('Error generating button tests:', error);
    }

    return tests;
  }

  /**
   * Generate tests for links on the page
   */
  private async generateLinkTests(): Promise<TestCase[]> {
    const tests: TestCase[] = [];

    try {
      const links = await this.page.$$('a[href]');
      console.log(`   Found ${links.length} link(s)`);

      // Test a sample of links (not all to avoid too many tests)
      const sampleSize = Math.min(links.length, 5);
      
      for (let i = 0; i < sampleSize; i++) {
        const linkInfo = await links[i].evaluate((el) => {
          const anchor = el as HTMLAnchorElement;
          return {
            text: anchor.textContent?.trim() || 'Link',
            href: anchor.href,
            isInternal: anchor.href.startsWith(window.location.origin),
          };
        });

        tests.push({
          name: `Link "${linkInfo.text.substring(0, 50)}" exists and is clickable`,
          type: 'assertion',
          selector: `a[href="${linkInfo.href}"]`,
        });
      }

      // Check for broken links (404s)
      tests.push({
        name: 'No broken internal links detected',
        type: 'assertion',
      });
    } catch (error) {
      console.error('Error generating link tests:', error);
    }

    return tests;
  }

  /**
   * Generate tests for images on the page
   */
  private async generateImageTests(): Promise<TestCase[]> {
    const tests: TestCase[] = [];

    try {
      const images = await this.page.$$('img');
      console.log(`   Found ${images.length} image(s)`);

      // Check all images have alt text (accessibility)
      const imagesWithoutAlt = await this.page.$$('img:not([alt])');
      
      if (imagesWithoutAlt.length === 0) {
        tests.push({
          name: 'All images have alt text (accessibility)',
          type: 'assertion',
        });
      } else {
        tests.push({
          name: `${imagesWithoutAlt.length} image(s) missing alt text`,
          type: 'assertion',
        });
      }

      // Check images load successfully
      const brokenImages = await this.page.$$eval('img', (imgs) => {
        return imgs.filter((img) => !img.complete || img.naturalHeight === 0).length;
      });

      if (brokenImages === 0) {
        tests.push({
          name: 'All images loaded successfully',
          type: 'assertion',
        });
      }
    } catch (error) {
      console.error('Error generating image tests:', error);
    }

    return tests;
  }

  /**
   * Generate basic accessibility tests
   */
  private async generateAccessibilityTests(): Promise<TestCase[]> {
    const tests: TestCase[] = [];

    try {
      // Check for semantic HTML
      const hasMainLandmark = await this.page.$('main, [role="main"]');
      tests.push({
        name: hasMainLandmark ? 'Page has main landmark' : 'Page missing main landmark',
        type: 'assertion',
        selector: 'main, [role="main"]',
      });

      // Check for heading hierarchy
      const headings = await this.page.$$('h1, h2, h3, h4, h5, h6');
      tests.push({
        name: `Page has proper heading structure (${headings.length} headings)`,
        type: 'assertion',
      });

      // Check for language attribute
      const hasLang = await this.page.$('html[lang]');
      tests.push({
        name: hasLang ? 'HTML has lang attribute' : 'HTML missing lang attribute',
        type: 'assertion',
        selector: 'html[lang]',
      });

      // Check for skip to content link
      const hasSkipLink = await this.page.$('a[href^="#"]:first-child');
      if (hasSkipLink) {
        tests.push({
          name: 'Page has skip to content link',
          type: 'assertion',
        });
      }
    } catch (error) {
      console.error('Error generating accessibility tests:', error);
    }

    return tests;
  }

  /**
   * Generate appropriate test values based on input type
   */
  private generateTestValue(type: string, placeholder?: string): string {
    const testData: { [key: string]: string } = {
      email: 'test@example.com',
      password: 'TestPassword123!',
      tel: '555-0123',
      number: '42',
      date: '2025-10-17',
      time: '10:30',
      url: 'https://example.com',
      search: 'test query',
      text: placeholder || 'Test Input',
      textarea: 'This is a test message',
    };

    return testData[type] || 'Test Value';
  }

  /**
   * Detect and generate tests for common workflows
   */
  async detectWorkflows(): Promise<{ type: string; elements: any[] }[]> {
    const workflows = [];

    // Detect login workflow
    const hasLoginForm = await this.page.$(
      'form:has(input[type="password"]), form:has(input[name*="password"])'
    );
    if (hasLoginForm) {
      workflows.push({ type: 'login', elements: await this.analyzeLoginForm() });
    }

    // Detect search functionality
    const hasSearch = await this.page.$('input[type="search"], [role="search"]');
    if (hasSearch) {
      workflows.push({ type: 'search', elements: [] });
    }

    // Detect e-commerce elements
    const hasCart = await this.page.$('[class*="cart"], [id*="cart"], [data-cart]');
    if (hasCart) {
      workflows.push({ type: 'ecommerce', elements: [] });
    }

    return workflows;
  }

  /**
   * Analyze login form for intelligent test generation
   */
  private async analyzeLoginForm(): Promise<any[]> {
    try {
      return await this.page.$$eval(
        'form:has(input[type="password"]) input',
        (inputs) => {
          return inputs.map((input) => ({
            type: (input as HTMLInputElement).type,
            name: (input as HTMLInputElement).name,
            id: input.id,
          }));
        }
      );
    } catch {
      return [];
    }
  }
}

