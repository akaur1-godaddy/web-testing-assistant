import OpenAI from 'openai';
import { TestCase } from './testRunner.js';

/**
 * Natural Language Processing Test Generator
 * Converts plain English descriptions into executable test cases
 */
export class NLPTestGenerator {
  private openai: OpenAI;
  
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  /**
   * Generate test cases from natural language description
   */
  async generateFromDescription(
    description: string, 
    url: string,
    pageContext?: string
  ): Promise<{
    tests: TestCase[];
    explanation: string;
    confidence: number;
  }> {
    try {
      // Check if we have a valid API key
      if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'test' || process.env.OPENAI_API_KEY === 'demo_mode' || process.env.OPENAI_API_KEY.includes('your_ope')) {
        console.log('🎭 Using mock NLP generation (no valid OpenAI API key)');
        return this.generateMockTests(description, url);
      }
      
      const prompt = this.buildPrompt(description, url, pageContext);
      
      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are an expert QA engineer and test automation specialist. Generate comprehensive, realistic test cases based on user descriptions."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.7,
      });

      const result = this.parseAIResponse(response.choices[0].message?.content || '');
      
      return {
        tests: result.tests,
        explanation: result.explanation,
        confidence: this.calculateConfidence(description, result.tests),
      };
    } catch (error) {
      console.warn('NLP Test Generation failed, using mock data:', error);
      return this.generateMockTests(description, url);
    }
  }

  /**
   * Generate edge cases for existing test scenarios
   */
  async generateEdgeCases(baseTests: TestCase[]): Promise<TestCase[]> {
    const prompt = `
    Given these base test cases:
    ${JSON.stringify(baseTests, null, 2)}
    
    Generate comprehensive edge cases and error scenarios that could break these tests.
    Focus on:
    - Boundary conditions (empty inputs, max lengths, special characters)
    - Network failures and timeouts
    - Race conditions and timing issues
    - Accessibility edge cases
    - Cross-browser compatibility issues
    - Performance under load
    
    Return only valid JSON array of TestCase objects.
    `;

    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 1500,
        temperature: 0.8,
      });

      return this.parseTestCases(response.choices[0].message?.content || '[]');
    } catch (error) {
      console.error('Edge case generation failed:', error);
      return [];
    }
  }

  /**
   * Generate accessibility-focused test scenarios
   */
  async generateAccessibilityTests(pageAnalysis: any): Promise<TestCase[]> {
    const prompt = `
    Based on this page analysis: ${JSON.stringify(pageAnalysis)}
    
    Generate comprehensive accessibility test cases covering:
    - Screen reader navigation
    - Keyboard-only interaction
    - Color contrast validation
    - Focus management
    - ARIA attributes verification
    - Alternative text for images
    - Form accessibility
    - Heading hierarchy
    
    Return JSON array of TestCase objects with type 'accessibility'.
    `;

    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 1200,
        temperature: 0.6,
      });

      return this.parseTestCases(response.choices[0].message?.content || '[]');
    } catch (error) {
      console.error('Accessibility test generation failed:', error);
      return [];
    }
  }

  /**
   * Generate performance test scenarios
   */
  async generatePerformanceTests(url: string): Promise<TestCase[]> {
    const prompt = `
    For website: ${url}
    
    Generate performance-focused test scenarios:
    - Core Web Vitals measurement (LCP, FID, CLS)
    - Resource loading optimization
    - Image lazy loading validation
    - JavaScript execution performance  
    - Memory leak detection
    - Network request optimization
    - Mobile performance testing
    
    Return JSON array of TestCase objects with type 'performance'.
    `;

    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 1000,
        temperature: 0.5,
      });

      return this.parseTestCases(response.choices[0].message?.content || '[]');
    } catch (error) {
      console.error('Performance test generation failed:', error);
      return [];
    }
  }

  /**
   * Build comprehensive prompt for test generation
   */
  private buildPrompt(description: string, url: string, pageContext?: string): string {
    return `
    Website URL: ${url}
    Test Description: "${description}"
    ${pageContext ? `Page Context: ${pageContext}` : ''}
    
    Generate comprehensive test cases that cover:
    1. Happy path scenarios
    2. Error handling and validation
    3. Edge cases and boundary conditions
    4. User experience flows
    5. Accessibility considerations
    6. Performance implications
    
    Return response in this EXACT JSON format:
    {
      "explanation": "Brief explanation of the generated tests",
      "tests": [
        {
          "name": "Test name",
          "type": "click|input|assertion|navigation|wait",
          "selector": "CSS selector (if applicable)", 
          "value": "Input value (if applicable)",
          "expected": "Expected result (if applicable)",
          "timeout": 5000
        }
      ]
    }
    
    Make tests realistic, actionable, and comprehensive. Include proper selectors and expected outcomes.
    `;
  }

  /**
   * Parse AI response and extract test cases
   */
  private parseAIResponse(content: string): { tests: TestCase[]; explanation: string } {
    try {
      // Clean the response to extract JSON
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in AI response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      return {
        tests: parsed.tests || [],
        explanation: parsed.explanation || 'AI generated comprehensive test suite',
      };
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      return {
        tests: [],
        explanation: 'Failed to parse AI response',
      };
    }
  }

  /**
   * Parse test cases from AI response
   */
  private parseTestCases(content: string): TestCase[] {
    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        return [];
      }
      
      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error('Failed to parse test cases:', error);
      return [];
    }
  }

  /**
   * Calculate confidence score for generated tests
   */
  private calculateConfidence(description: string, tests: TestCase[]): number {
    let confidence = 50; // Base confidence
    
    // Increase confidence based on description clarity
    if (description.length > 20) confidence += 10;
    if (description.includes('login')) confidence += 15;
    if (description.includes('form')) confidence += 10;
    if (description.includes('button')) confidence += 10;
    if (description.includes('click')) confidence += 10;
    
    // Increase confidence based on number of tests generated
    confidence += Math.min(tests.length * 5, 25);
    
    return Math.min(confidence, 95);
  }

  /**
   * Convert user story to test scenarios
   */
  async convertUserStoryToTests(userStory: string): Promise<TestCase[]> {
    const prompt = `
    Convert this user story to detailed test scenarios:
    "${userStory}"
    
    Break down into:
    - Preconditions
    - Test steps
    - Expected results
    - Acceptance criteria validation
    
    Return JSON array of TestCase objects.
    `;

    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 1500,
      });

      return this.parseTestCases(response.choices[0].message?.content || '[]');
    } catch (error) {
      console.error('User story conversion failed:', error);
      return [];
    }
  }

  /**
   * Generate mock tests when OpenAI API is not available
   */
  private generateMockTests(description: string, url: string): {
    tests: TestCase[];
    explanation: string;
    confidence: number;
  } {
    console.log('🎭 NLP generateMockTests called with URL:', url);
    console.log('🎭 NLP generateMockTests called with description:', description);
    
    const mockTests: TestCase[] = [
      {
        id: 'mock-test-1',
        name: `Test based on: ${description.substring(0, 50)}...`,
        description: `Mock test generated for: ${description}`,
        url: url,
        actions: [
          { type: 'navigate', target: url },
          { type: 'wait', target: '2000' },
          { type: 'click', target: 'button' },
          { type: 'type', target: 'input[type="text"]', value: 'test input' },
          { type: 'assert', target: 'body', expected: 'page loaded' }
        ],
        expected: {
          status: 200,
          contains: ['expected content'],
          doesNotContain: ['error', '404']
        },
        priority: 'medium',
        tags: ['mock', 'generated']
      },
      {
        id: 'mock-test-2', 
        name: `Validation test for: ${description.substring(0, 40)}...`,
        description: `Mock validation test: ${description}`,
        url: url,
        actions: [
          { type: 'navigate', target: url },
          { type: 'validate', target: 'form', expected: 'form exists' },
          { type: 'click', target: 'submit', expected: 'submission works' }
        ],
        expected: {
          status: 200,
          contains: ['success', 'valid'],
          doesNotContain: ['error', 'invalid']
        },
        priority: 'high',
        tags: ['validation', 'mock']
      }
    ];

    return {
      tests: mockTests,
      explanation: `Generated ${mockTests.length} mock test cases based on: "${description}". These are demonstration tests showing the system's capabilities.`,
      confidence: 0.85
    };
  }
}

export interface NLPTestRequest {
  description: string;
  url: string;
  testType?: 'functional' | 'accessibility' | 'performance' | 'security' | 'all';
  includeEdgeCases?: boolean;
  pageContext?: string;
}

export interface NLPTestResponse {
  tests: TestCase[];
  explanation: string;
  confidence: number;
  metadata: {
    generatedAt: Date;
    testType: string;
    aiModel: string;
    tokenUsage?: number;
  };
}

