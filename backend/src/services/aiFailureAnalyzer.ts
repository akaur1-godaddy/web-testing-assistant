import OpenAI from 'openai';
import { TestCase, TestResult } from './testRunner.js';

export class AIFailureAnalyzer {
  private openai: OpenAI | null = null;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey && apiKey !== 'sk-your-real-key-here') {
      this.openai = new OpenAI({ apiKey });
    }
  }

  /**
   * Analyze why a test failed and provide AI-powered explanation
   */
  async analyzeFailure(
    testCase: TestCase,
    testResult: TestResult
  ): Promise<{ reason: string; suggestion: string; confidence: 'high' | 'medium' | 'low' }> {
    // If OpenAI is not configured, return a basic explanation
    if (!this.openai) {
      return this.getBasicExplanation(testCase, testResult);
    }

    try {
      // Build context for AI
      const context = this.buildContext(testCase, testResult);

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `You are an expert QA engineer analyzing automated test failures. 
Provide concise, actionable explanations for why tests fail and how to fix them. 
Format your response as JSON with keys: "reason" (why it failed), "suggestion" (how to fix), and "confidence" (high/medium/low).
Keep explanations under 150 characters for reason and 200 characters for suggestion.`
          },
          {
            role: 'user',
            content: `Analyze this test failure:\n\n${context}`
          }
        ],
        temperature: 0.3,
        max_tokens: 300,
      });

      const responseText = completion.choices[0]?.message?.content || '';
      
      try {
        const parsed = JSON.parse(responseText);
        return {
          reason: parsed.reason || 'Unknown failure reason',
          suggestion: parsed.suggestion || 'Check the test configuration and element selectors',
          confidence: parsed.confidence || 'medium'
        };
      } catch (parseError) {
        // If JSON parsing fails, extract from text
        return this.extractFromText(responseText) || this.getBasicExplanation(testCase, testResult);
      }

    } catch (error) {
      console.warn('AI failure analysis failed:', error);
      return this.getBasicExplanation(testCase, testResult);
    }
  }

  /**
   * Build context string for AI analysis
   */
  private buildContext(testCase: TestCase, testResult: TestResult): string {
    const parts: string[] = [];

    parts.push(`Test Name: ${testCase.name}`);
    parts.push(`Test Type: ${testCase.type}`);
    
    if (testCase.selector) {
      parts.push(`Selector: ${testCase.selector}`);
    }
    
    if (testCase.value) {
      parts.push(`Expected Value: ${testCase.value}`);
    }

    if (testResult.message) {
      parts.push(`Error Message: ${testResult.message}`);
    }

    if (testResult.elementContext) {
      const ctx = testResult.elementContext;
      if (ctx.elementType) {
        parts.push(`Element Type: ${ctx.elementType}`);
      }
      if (ctx.elementText) {
        parts.push(`Element Text: ${ctx.elementText.substring(0, 100)}`);
      }
      if (ctx.pageUrl) {
        parts.push(`Page URL: ${ctx.pageUrl}`);
      }
    }

    if (testCase.apiTest) {
      parts.push(`API Method: ${testCase.apiTest.method}`);
      parts.push(`API URL: ${testCase.apiTest.url}`);
      if (testResult.apiResponse?.response?.status) {
        parts.push(`Response Status: ${testResult.apiResponse.response.status}`);
      }
    }

    return parts.join('\n');
  }

  /**
   * Extract reason and suggestion from text response
   */
  private extractFromText(text: string): { reason: string; suggestion: string; confidence: 'high' | 'medium' | 'low' } | null {
    try {
      const lines = text.split('\n').filter(l => l.trim());
      const reason = lines.find(l => l.toLowerCase().includes('reason'))?.split(':')[1]?.trim() || lines[0] || 'Unknown failure';
      const suggestion = lines.find(l => l.toLowerCase().includes('fix') || l.toLowerCase().includes('suggestion'))?.split(':')[1]?.trim() || lines[1] || 'Check configuration';
      
      return {
        reason: reason.substring(0, 150),
        suggestion: suggestion.substring(0, 200),
        confidence: 'medium'
      };
    } catch {
      return null;
    }
  }

  /**
   * Get basic explanation without AI (fallback)
   */
  private getBasicExplanation(
    testCase: TestCase,
    testResult: TestResult
  ): { reason: string; suggestion: string; confidence: 'high' | 'medium' | 'low' } {
    const errorMsg = testResult.message || '';

    // Timeout errors
    if (errorMsg.includes('timeout') || errorMsg.includes('Timeout')) {
      return {
        reason: 'Element took too long to appear or respond',
        suggestion: 'Increase timeout value or check if element selector is correct',
        confidence: 'high'
      };
    }

    // Element not found
    if (errorMsg.includes('not found') || errorMsg.includes('No node found') || errorMsg.includes('waiting for selector')) {
      return {
        reason: 'Element could not be found on the page',
        suggestion: 'Verify the selector is correct and element exists. Check page URL and wait for dynamic content to load',
        confidence: 'high'
      };
    }

    // Navigation errors
    if (errorMsg.includes('Navigation') || errorMsg.includes('net::')) {
      return {
        reason: 'Failed to navigate to the URL or load resources',
        suggestion: 'Check URL is accessible, network connection is stable, and page loads correctly',
        confidence: 'high'
      };
    }

    // API errors
    if (testCase.type === 'api' || testResult.apiResponse) {
      const status = testResult.apiResponse?.response?.status;
      if (status) {
        if (status >= 500) {
          return {
            reason: 'Server returned an error response',
            suggestion: 'Check API server health and logs. Verify endpoint is working correctly',
            confidence: 'high'
          };
        } else if (status >= 400) {
          return {
            reason: 'Bad request or unauthorized access',
            suggestion: 'Verify request parameters, headers, authentication tokens, and permissions',
            confidence: 'high'
          };
        }
      }
    }

    // Click errors
    if (testCase.type === 'click' && errorMsg.includes('click')) {
      return {
        reason: 'Unable to click the element',
        suggestion: 'Element might be hidden, covered by another element, or not clickable. Check element state and visibility',
        confidence: 'medium'
      };
    }

    // Input errors
    if (testCase.type === 'input') {
      return {
        reason: 'Could not input value into the field',
        suggestion: 'Verify field is enabled, not readonly, and accepts the input type. Check for JavaScript validation',
        confidence: 'medium'
      };
    }

    // Assertion errors
    if (testCase.type === 'assertion') {
      return {
        reason: 'Expected value did not match actual value',
        suggestion: 'Check if page content has changed. Verify expected value is correct and element contains the right data',
        confidence: 'medium'
      };
    }

    // Generic fallback
    return {
      reason: errorMsg.substring(0, 150) || 'Test execution failed',
      suggestion: 'Review test configuration, check browser console for errors, and verify page state matches test expectations',
      confidence: 'low'
    };
  }

  /**
   * Batch analyze multiple failures
   */
  async analyzeMultipleFailures(
    failures: Array<{ testCase: TestCase; testResult: TestResult }>
  ): Promise<Map<string, { reason: string; suggestion: string; confidence: 'high' | 'medium' | 'low' }>> {
    const results = new Map();

    // Process failures in parallel (limit to 5 at a time to avoid rate limits)
    const batches: Array<Array<{ testCase: TestCase; testResult: TestResult }>> = [];
    for (let i = 0; i < failures.length; i += 5) {
      batches.push(failures.slice(i, i + 5));
    }

    for (const batch of batches) {
      const promises = batch.map(async ({ testCase, testResult }) => {
        const analysis = await this.analyzeFailure(testCase, testResult);
        return { name: testCase.name, analysis };
      });

      const batchResults = await Promise.all(promises);
      batchResults.forEach(({ name, analysis }) => {
        results.set(name, analysis);
      });
    }

    return results;
  }
}

