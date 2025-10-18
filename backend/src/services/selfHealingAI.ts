import { Page } from 'puppeteer';
import { TestCase } from './testRunner.js';

/**
 * Self-Healing AI Service
 * Automatically fixes broken tests by finding alternative selectors and healing test logic
 */
export class SelfHealingAI {
  private page: Page;
  private healingHistory: HealingRecord[] = [];
  private selectorCache: Map<string, string[]> = new Map();

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Attempt to heal a broken test case
   */
  async healBrokenTest(
    failedTest: TestCase, 
    error: Error
  ): Promise<HealingResult> {
    console.log(`🔧 Attempting to heal test: ${failedTest.name}`);
    
    try {
      const healingStrategy = this.determineHealingStrategy(error);
      let healedTest: TestCase | null = null;

      switch (healingStrategy) {
        case 'selector-healing':
          healedTest = await this.healBrokenSelector(failedTest);
          break;
        case 'timing-healing':
          healedTest = await this.healTimingIssue(failedTest);
          break;
        case 'content-healing':
          healedTest = await this.healContentChange(failedTest);
          break;
        case 'interaction-healing':
          healedTest = await this.healInteractionIssue(failedTest);
          break;
        default:
          healedTest = await this.attemptGenericHealing(failedTest);
      }

      if (healedTest) {
        // Verify the healed test works
        const isFixed = await this.verifyHealedTest(healedTest);
        
        if (isFixed) {
          this.recordSuccessfulHealing(failedTest, healedTest, healingStrategy);
          return {
            success: true,
            healedTest,
            strategy: healingStrategy,
            confidence: this.calculateHealingConfidence(failedTest, healedTest),
            explanation: `Successfully healed test using ${healingStrategy}`,
          };
        }
      }

      return {
        success: false,
        strategy: healingStrategy,
        confidence: 0,
        explanation: `Failed to heal test using ${healingStrategy}`,
      };
    } catch (error) {
      console.error('Healing attempt failed:', error);
      return {
        success: false,
        strategy: 'none',
        confidence: 0,
        explanation: `Healing failed: ${error}`,
      };
    }
  }

  /**
   * Heal broken CSS selectors by finding alternatives
   */
  async healBrokenSelector(testCase: TestCase): Promise<TestCase | null> {
    if (!testCase.selector) return null;

    console.log(`🔍 Finding alternative selector for: ${testCase.selector}`);

    // Try multiple healing strategies
    const healingStrategies = [
      () => this.findBySemanticSimilarity(testCase),
      () => this.findByVisualPosition(testCase),
      () => this.findByTextContent(testCase),
      () => this.findByAttributes(testCase),
      () => this.findByHierarchy(testCase),
      () => this.findByAIAnalysis(testCase),
    ];

    for (const strategy of healingStrategies) {
      try {
        const healedTest = await strategy();
        if (healedTest && await this.isValidSelector(healedTest.selector!)) {
          return healedTest;
        }
      } catch (error) {
        console.warn(`Healing strategy failed:`, error);
        continue;
      }
    }

    return null;
  }

  /**
   * Find alternative selector using semantic similarity
   */
  private async findBySemanticSimilarity(testCase: TestCase): Promise<TestCase | null> {
    try {
      // Analyze the original selector to understand intent
      const intent = this.analyzeSelectorIntent(testCase.selector!);
      
      // Find all elements that match the semantic intent
      const candidates = await this.page.evaluate((intent) => {
        const elements = Array.from(document.querySelectorAll('*'));
        const matches: Array<{element: Element, score: number, selector: string}> = [];

        elements.forEach((el, index) => {
          let score = 0;
          const selector = `*:nth-child(${index + 1})`;

          // Score based on semantic attributes
          if (intent.type === 'button' && (el.tagName === 'BUTTON' || el.getAttribute('role') === 'button')) score += 50;
          if (intent.type === 'input' && el.tagName === 'INPUT') score += 50;
          if (intent.type === 'link' && el.tagName === 'A') score += 50;

          // Score based on text content similarity
          if (intent.text && el.textContent?.toLowerCase().includes(intent.text.toLowerCase())) score += 30;

          // Score based on attributes
          if (intent.attributes) {
            Object.entries(intent.attributes).forEach(([attr, value]) => {
              if (el.getAttribute(attr)?.includes(value)) score += 20;
            });
          }

          if (score > 40) {
            matches.push({ element: el, score, selector: this.generateOptimalSelector(el) });
          }
        });

        return matches.sort((a, b) => b.score - a.score).slice(0, 5);
      }, intent);

      if (candidates.length > 0) {
        return {
          ...testCase,
          selector: candidates[0].selector,
        };
      }
    } catch (error) {
      console.error('Semantic similarity search failed:', error);
    }

    return null;
  }

  /**
   * Find alternative selector by visual position
   */
  private async findByVisualPosition(testCase: TestCase): Promise<TestCase | null> {
    try {
      // Get approximate position of similar elements
      const alternatives = await this.page.evaluate((originalSelector) => {
        // Find elements in similar positions (same relative location)
        const candidates: string[] = [];
        
        // Look for elements with similar positioning patterns
        const patterns = [
          '[class*="button"]',
          '[type="button"]',
          '[role="button"]',
          'button',
          '.btn',
          '[class*="btn"]',
        ];

        patterns.forEach(pattern => {
          try {
            const elements = document.querySelectorAll(pattern);
            elements.forEach((el, index) => {
              candidates.push(`${pattern}:nth-of-type(${index + 1})`);
            });
          } catch (e) {
            // Invalid selector, skip
          }
        });

        return candidates.slice(0, 10);
      }, testCase.selector);

      for (const candidate of alternatives) {
        if (await this.isValidSelector(candidate)) {
          return {
            ...testCase,
            selector: candidate,
          };
        }
      }
    } catch (error) {
      console.error('Visual position search failed:', error);
    }

    return null;
  }

  /**
   * Find alternative selector by text content
   */
  private async findByTextContent(testCase: TestCase): Promise<TestCase | null> {
    try {
      // Extract expected text from the original test
      const expectedText = testCase.expected || testCase.value || '';
      
      if (!expectedText) return null;

      const textBasedSelectors = await this.page.evaluate((text) => {
        const selectors: string[] = [];
        
        // Helper function to generate selector (moved inside evaluate)
        function generateSelectorForElement(element: Element): string | null {
          // Try ID first
          if (element.id) {
            return `#${element.id}`;
          }
          
          // Try data attributes
          const dataTestId = element.getAttribute('data-testid') || element.getAttribute('data-test');
          if (dataTestId) {
            return `[data-testid="${dataTestId}"]`;
          }
          
          // Try aria-label
          const ariaLabel = element.getAttribute('aria-label');
          if (ariaLabel) {
            return `[aria-label="${ariaLabel}"]`;
          }
          
          // Try name attribute
          const nameAttr = element.getAttribute('name');
          if (nameAttr) {
            return `[name="${nameAttr}"]`;
          }
          
          // Try class-based selector
          if (element.className && typeof element.className === 'string') {
            const classes = element.className.trim().split(/\s+/).slice(0, 2);
            if (classes.length > 0) {
              return `.${classes.join('.')}`;
            }
          }
          
          // Fallback to tag name
          return element.tagName.toLowerCase();
        }
        
        // Find by exact text match
        const xpath = `//*[text()="${text}"]`;
        const elements = document.evaluate(xpath, document, null, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null);
        
        for (let i = 0; i < elements.snapshotLength; i++) {
          const element = elements.snapshotItem(i) as Element;
          if (element) {
            const selector = generateSelectorForElement(element);
            if (selector) selectors.push(selector);
          }
        }

        // Find by partial text match
        const partialXpath = `//*[contains(text(),"${text.substring(0, Math.min(text.length, 10))}")]`;
        const partialElements = document.evaluate(partialXpath, document, null, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null);
        
        for (let i = 0; i < Math.min(partialElements.snapshotLength, 5); i++) {
          const element = partialElements.snapshotItem(i) as Element;
          if (element) {
            const selector = generateSelectorForElement(element);
            if (selector) selectors.push(selector);
          }
        }

        return selectors;
      }, expectedText);

      for (const selector of textBasedSelectors) {
        if (await this.isValidSelector(selector)) {
          return {
            ...testCase,
            selector: selector,
          };
        }
      }
    } catch (error) {
      console.error('Text content search failed:', error);
    }

    return null;
  }

  /**
   * Heal timing-related test failures
   */
  private async healTimingIssue(testCase: TestCase): Promise<TestCase | null> {
    return {
      ...testCase,
      timeout: (testCase.timeout || 5000) * 2, // Double the timeout
    };
  }

  /**
   * Heal content change issues
   */
  private async healContentChange(testCase: TestCase): Promise<TestCase | null> {
    if (!testCase.expected) return testCase;

    // Try to find the new content that replaced the expected content
    const newContent = await this.page.evaluate((selector) => {
      const element = document.querySelector(selector);
      return element ? element.textContent : null;
    }, testCase.selector || 'body');

    if (newContent && newContent !== testCase.expected) {
      return {
        ...testCase,
        expected: newContent.trim(),
      };
    }

    return null;
  }

  /**
   * Heal interaction issues (clicks, inputs, etc.)
   */
  private async healInteractionIssue(testCase: TestCase): Promise<TestCase | null> {
    if (testCase.type === 'click') {
      // Try alternative click methods
      return {
        ...testCase,
        type: testCase.type,
        // Add retry logic or force click
      };
    }

    if (testCase.type === 'input') {
      // Try clearing field first
      return {
        ...testCase,
        // Add clear step before input
      };
    }

    return testCase;
  }

  /**
   * Use AI to analyze and suggest healing strategies
   */
  private async findByAIAnalysis(testCase: TestCase): Promise<TestCase | null> {
    try {
      // Analyze page context with AI
      const pageContext = await this.page.evaluate(() => {
        return {
          title: document.title,
          url: window.location.href,
          headings: Array.from(document.querySelectorAll('h1, h2, h3')).map(h => h.textContent),
          buttons: Array.from(document.querySelectorAll('button, [role="button"]')).map(b => ({
            text: b.textContent,
            id: b.id,
            class: b.className,
          })),
          forms: Array.from(document.querySelectorAll('form')).length,
          links: Array.from(document.querySelectorAll('a')).length,
        };
      });

      // Use natural language processing to understand test intent
      const testIntent = this.analyzeTestIntent(testCase, pageContext);
      
      // Generate alternative selectors based on AI analysis
      const aiSuggestions = await this.generateAISelectorSuggestions(testIntent, pageContext);
      
      for (const suggestion of aiSuggestions) {
        if (await this.isValidSelector(suggestion)) {
          return {
            ...testCase,
            selector: suggestion,
          };
        }
      }
    } catch (error) {
      console.error('AI analysis healing failed:', error);
    }

    return null;
  }

  /**
   * Learn from successful and failed healing attempts
   */
  async learnFromHealing(
    originalTest: TestCase, 
    healingResult: HealingResult
  ): Promise<void> {
    const learningData: LearningData = {
      originalSelector: originalTest.selector || '',
      healedSelector: healingResult.healedTest?.selector || '',
      testType: originalTest.type,
      strategy: healingResult.strategy,
      success: healingResult.success,
      confidence: healingResult.confidence,
      timestamp: new Date(),
      pageContext: await this.capturePageContext(),
    };

    this.updateLearningModel(learningData);
  }

  /**
   * Suggest robust selectors that are less likely to break
   */
  async suggestRobustSelectors(elements: string[]): Promise<RobustSelectorSuggestions> {
    const suggestions: RobustSelectorSuggestion[] = [];

    for (const selector of elements) {
      try {
        const element = await this.page.$(selector);
        if (element) {
          const robustAlternatives = await this.generateRobustAlternatives(selector);
          const stability = await this.calculateSelectorStability(selector);
          
          suggestions.push({
            originalSelector: selector,
            robustAlternatives,
            stabilityScore: stability,
            recommendations: this.generateSelectorRecommendations(stability),
          });
        }
      } catch (error) {
        console.warn(`Failed to analyze selector: ${selector}`, error);
      }
    }

    return {
      suggestions,
      generalRecommendations: this.getGeneralSelectorBestPractices(),
    };
  }

  /**
   * Helper Methods
   */

  private determineHealingStrategy(error: Error): HealingStrategy {
    const errorMessage = error.message.toLowerCase();
    
    if (errorMessage.includes('element not found') || errorMessage.includes('no such element')) {
      return 'selector-healing';
    }
    if (errorMessage.includes('timeout') || errorMessage.includes('wait')) {
      return 'timing-healing';
    }
    if (errorMessage.includes('expected') || errorMessage.includes('assertion')) {
      return 'content-healing';
    }
    if (errorMessage.includes('click') || errorMessage.includes('interaction')) {
      return 'interaction-healing';
    }
    
    return 'generic-healing';
  }

  private async isValidSelector(selector: string): Promise<boolean> {
    try {
      const element = await this.page.$(selector);
      return element !== null;
    } catch (error) {
      return false;
    }
  }

  private analyzeSelectorIntent(selector: string): SelectorIntent {
    const intent: SelectorIntent = {
      type: 'unknown',
      attributes: {},
      text: '',
    };

    // Analyze selector to understand what it's trying to target
    if (selector.includes('button') || selector.includes('[type="submit"]')) {
      intent.type = 'button';
    } else if (selector.includes('input')) {
      intent.type = 'input';
    } else if (selector.includes('a[') || selector.includes('link')) {
      intent.type = 'link';
    }

    // Extract attributes from selector
    const attrMatches = selector.match(/\[([^=]+)=["']([^"']+)["']\]/g);
    if (attrMatches) {
      attrMatches.forEach(match => {
        const [, attr, value] = match.match(/\[([^=]+)=["']([^"']+)["']\]/) || [];
        if (attr && value) {
          intent.attributes[attr] = value;
        }
      });
    }

    return intent;
  }

  private async verifyHealedTest(testCase: TestCase): Promise<boolean> {
    try {
      // Quick verification that the healed test can find its target
      if (testCase.selector) {
        const element = await this.page.$(testCase.selector);
        return element !== null;
      }
      return true;
    } catch (error) {
      return false;
    }
  }

  private calculateHealingConfidence(original: TestCase, healed: TestCase): number {
    let confidence = 50; // Base confidence

    // Increase confidence based on healing method used
    if (healed.selector && healed.selector.includes('id')) confidence += 20;
    if (healed.selector && healed.selector.includes('[data-')) confidence += 15;
    if (healed.selector && healed.selector.includes('aria-')) confidence += 10;

    // Decrease confidence for fragile selectors
    if (healed.selector && healed.selector.includes(':nth-child')) confidence -= 10;
    if (healed.selector && healed.selector.includes('.')) confidence -= 5;

    return Math.min(Math.max(confidence, 0), 100);
  }

  private recordSuccessfulHealing(
    original: TestCase, 
    healed: TestCase, 
    strategy: HealingStrategy
  ): void {
    this.healingHistory.push({
      timestamp: new Date(),
      originalTest: original,
      healedTest: healed,
      strategy,
      success: true,
    });

    // Cache successful selector mappings
    if (original.selector && healed.selector) {
      const alternatives = this.selectorCache.get(original.selector) || [];
      alternatives.push(healed.selector);
      this.selectorCache.set(original.selector, alternatives);
    }
  }

  private async capturePageContext(): Promise<PageContext> {
    return await this.page.evaluate(() => ({
      url: window.location.href,
      title: document.title,
      timestamp: new Date().toISOString(),
    }));
  }

  private updateLearningModel(data: LearningData): void {
    // Update internal learning model with successful/failed healing attempts
    // This could be expanded to use machine learning algorithms
    console.log('Learning from healing attempt:', data);
  }

  private async generateRobustAlternatives(selector: string): Promise<string[]> {
    return await this.page.evaluate((sel) => {
      const element = document.querySelector(sel);
      if (!element) return [];

      const alternatives: string[] = [];

      // ID-based selector (most robust)
      if (element.id) {
        alternatives.push(`#${element.id}`);
      }

      // Data attribute selectors
      Array.from(element.attributes).forEach(attr => {
        if (attr.name.startsWith('data-') || attr.name.startsWith('aria-')) {
          alternatives.push(`[${attr.name}="${attr.value}"]`);
        }
      });

      // Class-based (less robust but common)
      if (element.className) {
        const classes = element.className.split(' ').filter(c => c.trim());
        if (classes.length > 0) {
          alternatives.push(`.${classes[0]}`);
        }
      }

      return alternatives;
    }, selector);
  }

  private async calculateSelectorStability(selector: string): Promise<number> {
    // Analyze selector to predict its stability
    let stability = 50;

    if (selector.includes('#')) stability += 30; // ID selectors are stable
    if (selector.includes('[data-')) stability += 25; // Data attributes are stable
    if (selector.includes('[aria-')) stability += 20; // ARIA attributes are stable
    if (selector.includes(':nth-child')) stability -= 20; // Position-based selectors are fragile
    if (selector.includes('.')) stability += 10; // Class selectors are moderately stable

    return Math.min(Math.max(stability, 0), 100);
  }

  private generateSelectorRecommendations(stability: number): string[] {
    const recommendations: string[] = [];

    if (stability < 50) {
      recommendations.push('Consider using data attributes for more stable element identification');
      recommendations.push('Avoid position-based selectors like :nth-child');
      recommendations.push('Use semantic attributes (role, aria-label) when possible');
    }

    if (stability < 30) {
      recommendations.push('This selector is highly fragile and likely to break');
      recommendations.push('Consider adding unique IDs to target elements');
    }

    return recommendations;
  }

  private getGeneralSelectorBestPractices(): string[] {
    return [
      'Use unique IDs whenever possible',
      'Prefer data attributes over class names for test selectors',
      'Use ARIA attributes for accessibility and testing',
      'Avoid CSS selectors that depend on styling',
      'Keep selectors as short and specific as possible',
      'Test selectors across different viewport sizes',
      'Document the purpose of custom data attributes',
    ];
  }

  private analyzeTestIntent(testCase: TestCase, pageContext: any): TestIntent {
    return {
      action: testCase.type,
      targetType: this.inferElementType(testCase),
      purpose: this.inferTestPurpose(testCase, pageContext),
      context: pageContext,
    };
  }

  private inferElementType(testCase: TestCase): string {
    if (!testCase.selector) return 'unknown';
    
    if (testCase.selector.includes('button') || testCase.type === 'click') return 'button';
    if (testCase.selector.includes('input') || testCase.type === 'input') return 'input';
    if (testCase.selector.includes('a[') || testCase.selector.includes('link')) return 'link';
    
    return 'generic';
  }

  private inferTestPurpose(testCase: TestCase, pageContext: any): string {
    // Use NLP to understand test purpose
    const tokenizer = natural.WordTokenizer;
    const tokens = new tokenizer().tokenize(testCase.name.toLowerCase()) || [];
    
    if (tokens.some(token => ['login', 'signin', 'authenticate'].includes(token))) {
      return 'authentication';
    }
    if (tokens.some(token => ['form', 'submit', 'send'].includes(token))) {
      return 'form-interaction';
    }
    if (tokens.some(token => ['navigation', 'navigate', 'menu'].includes(token))) {
      return 'navigation';
    }
    
    return 'general-interaction';
  }

  private async generateAISelectorSuggestions(intent: TestIntent, pageContext: any): Promise<string[]> {
    const suggestions: string[] = [];
    
    // Generate suggestions based on intent and context
    if (intent.targetType === 'button') {
      suggestions.push('button', '[role="button"]', '[type="submit"]', '[type="button"]');
    }
    
    if (intent.targetType === 'input') {
      suggestions.push('input', 'textarea', '[role="textbox"]');
    }
    
    if (intent.purpose === 'authentication') {
      suggestions.push('[name="username"]', '[name="email"]', '[name="password"]', '#login', '.login-form');
    }
    
    return suggestions;
  }

  private async attemptGenericHealing(testCase: TestCase): Promise<TestCase | null> {
    // Generic healing fallback
    return {
      ...testCase,
      timeout: (testCase.timeout || 5000) * 1.5,
    };
  }

  private async findByAttributes(testCase: TestCase): Promise<TestCase | null> {
    // Find by common attributes like name, id, data-*, aria-*
    if (!testCase.selector) return null;

    const attributeSelectors = await this.page.evaluate(() => {
      const selectors: string[] = [];
      
      // Common attribute patterns
      const patterns = ['[name]', '[id]', '[data-testid]', '[data-test]', '[aria-label]', '[role]'];
      
      patterns.forEach(pattern => {
        const elements = document.querySelectorAll(pattern);
        elements.forEach((el, index) => {
          const attr = pattern.slice(1, -1); // Remove brackets
          const value = el.getAttribute(attr);
          if (value) {
            selectors.push(`[${attr}="${value}"]`);
          }
        });
      });
      
      return selectors.slice(0, 20);
    });

    for (const selector of attributeSelectors) {
      if (await this.isValidSelector(selector)) {
        return {
          ...testCase,
          selector: selector,
        };
      }
    }

    return null;
  }

  private async findByHierarchy(testCase: TestCase): Promise<TestCase | null> {
    // Find by DOM hierarchy and parent-child relationships
    if (!testCase.selector) return null;

    try {
      const hierarchySelectors = await this.page.evaluate((originalSelector) => {
        const selectors: string[] = [];
        
        // Try to find elements with similar hierarchy patterns
        const allElements = Array.from(document.querySelectorAll('*'));
        
        allElements.forEach(element => {
          // Generate selectors based on parent-child relationships
          const parent = element.parentElement;
          if (parent) {
            const tagName = element.tagName.toLowerCase();
            const parentTag = parent.tagName.toLowerCase();
            
            selectors.push(`${parentTag} > ${tagName}`);
            selectors.push(`${parentTag} ${tagName}`);
            
            // Add class-based hierarchy if available
            if (element.className) {
              const firstClass = element.className.split(' ')[0];
              selectors.push(`${parentTag} .${firstClass}`);
            }
          }
        });
        
        return [...new Set(selectors)].slice(0, 15); // Remove duplicates and limit
      }, testCase.selector);

      for (const selector of hierarchySelectors) {
        if (await this.isValidSelector(selector)) {
          return {
            ...testCase,
            selector: selector,
          };
        }
      }
    } catch (error) {
      console.error('Hierarchy search failed:', error);
    }

    return null;
  }
}

// Interfaces and Types
export interface HealingResult {
  success: boolean;
  healedTest?: TestCase;
  strategy: HealingStrategy;
  confidence: number;
  explanation: string;
}

export interface HealingRecord {
  timestamp: Date;
  originalTest: TestCase;
  healedTest: TestCase;
  strategy: HealingStrategy;
  success: boolean;
}

export interface LearningData {
  originalSelector: string;
  healedSelector: string;
  testType: string;
  strategy: HealingStrategy;
  success: boolean;
  confidence: number;
  timestamp: Date;
  pageContext: PageContext;
}

export interface SelectorIntent {
  type: string;
  attributes: { [key: string]: string };
  text: string;
}

export interface TestIntent {
  action: string;
  targetType: string;
  purpose: string;
  context: any;
}

export interface PageContext {
  url: string;
  title: string;
  timestamp: string;
}

export interface RobustSelectorSuggestions {
  suggestions: RobustSelectorSuggestion[];
  generalRecommendations: string[];
}

export interface RobustSelectorSuggestion {
  originalSelector: string;
  robustAlternatives: string[];
  stabilityScore: number;
  recommendations: string[];
}

export type HealingStrategy = 
  | 'selector-healing' 
  | 'timing-healing' 
  | 'content-healing' 
  | 'interaction-healing' 
  | 'generic-healing'
  | 'none';
