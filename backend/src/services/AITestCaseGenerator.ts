import OpenAI from 'openai';
import { TestCase } from './testRunner.js';
import { InteractiveElement } from './ElementDetector.js';

export interface PageAnalysis {
    url: string;
    title: string;
    forms: any[];
    buttons: InteractiveElement[];
    inputs: InteractiveElement[];
    hasAuth: boolean;
    pageType: string;
}

export interface AIGeneratedTestSuite {
    loginTests: TestCase[];
    formValidationTests: TestCase[];
    securityTests: TestCase[];
    userJourneyTests: TestCase[];
    accessibilityTests: TestCase[];
}

export class AITestCaseGenerator {
    private openai: OpenAI;

    constructor() {
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });
    }

    async generateContextualTests(pageAnalysis: PageAnalysis): Promise<AIGeneratedTestSuite> {
        try {
            // Check if we have a valid API key
            if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'test' || process.env.OPENAI_API_KEY === 'demo_mode') {
                console.log('🎭 AI test generation skipped: no valid OpenAI API key');
                return this.getDefaultTestSuite();
            }

            console.log('🤖 Generating contextual tests with AI...');

            const prompt = this.buildAnalysisPrompt(pageAnalysis);

            const response = await this.openai.chat.completions.create({
                model: 'gpt-4',
                messages: [
                    {
                        role: 'system',
                        content: 'You are an expert QA engineer. Analyze webpages and generate comprehensive, realistic test cases in JSON format. Return ONLY valid JSON.',
                    },
                    {
                        role: 'user',
                        content: prompt,
                    },
                ],
                temperature: 0.7,
                max_tokens: 2000,
            });

            const content = response.choices[0].message?.content || '{}';
            const testSuite = this.parseAndValidateTestSuite(content);

            return testSuite;
        } catch (error) {
            console.warn('AI test generation failed, using defaults:', error);
            return this.getDefaultTestSuite();
        }
    }

    private buildAnalysisPrompt(analysis: PageAnalysis): string {
        const formsSummary = analysis.forms.length > 0
            ? `Forms detected: ${analysis.forms.map((f: any) => f.name || 'unnamed').join(', ')}`
            : 'No forms detected';

        const buttonsSummary = analysis.buttons.length > 0
            ? `Buttons: ${analysis.buttons.slice(0, 5).map((b) => b.text || b.ariaLabel).join(', ')}`
            : 'No buttons detected';

        return `
    Analyze this webpage and generate comprehensive test cases:
    
    URL: ${analysis.url}
    Title: ${analysis.title}
    Page Type: ${analysis.pageType}
    Has Authentication: ${analysis.hasAuth}
    
    ${formsSummary}
    ${buttonsSummary}
    
    Generate test cases in this EXACT JSON format:
    {
      "loginTests": [
        {
          "name": "Valid login with correct credentials",
          "type": "click",
          "selector": "button[type=submit]",
          "steps": ["Fill email", "Fill password", "Click submit"]
        }
      ],
      "formValidationTests": [
        {
          "name": "Required field validation",
          "type": "input",
          "selector": "input[required]",
          "value": "",
          "expectedError": true
        }
      ],
      "securityTests": [
        {
          "name": "XSS prevention test",
          "type": "input",
          "selector": "input",
          "value": "<script>alert('xss')</script>",
          "expectedSafe": true
        }
      ],
      "userJourneyTests": [
        {
          "name": "Complete user flow",
          "type": "click",
          "selector": "button",
          "description": "Test complete user journey"
        }
      ],
      "accessibilityTests": [
        {
          "name": "Keyboard navigation test",
          "type": "assertion",
          "selector": "[role=button]",
          "expectedAccessible": true
        }
      ]
    }
    
    Prioritize:
    1. Login flows if authentication is detected
    2. Form validation with boundary conditions
    3. Security tests (XSS, SQL injection)
    4. Common user journeys
    5. Accessibility compliance
    
    Return ONLY the JSON object, no markdown or extra text.
    `;
    }

    private parseAndValidateTestSuite(content: string): AIGeneratedTestSuite {
        try {
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (!jsonMatch) throw new Error('No JSON found');

            const parsed = JSON.parse(jsonMatch[0]);

            return {
                loginTests: this.parseTestCases(parsed.loginTests || []),
                formValidationTests: this.parseTestCases(parsed.formValidationTests || []),
                securityTests: this.parseTestCases(parsed.securityTests || []),
                userJourneyTests: this.parseTestCases(parsed.userJourneyTests || []),
                accessibilityTests: this.parseTestCases(parsed.accessibilityTests || []),
            };
        } catch (error) {
            console.warn('Failed to parse AI test suite:', error);
            return this.getDefaultTestSuite();
        }
    }

    private parseTestCases(cases: any[]): TestCase[] {
        return (cases || [])
            .map((tc: any) => ({
                name: tc.name || 'Unnamed test',
                type: tc.type || 'assertion',
                selector: tc.selector,
                value: tc.value,
                expected: tc.expected,
                timeout: 5000,
            }))
            .filter((tc: TestCase) => tc.name && tc.type);
    }

    private getDefaultTestSuite(): AIGeneratedTestSuite {
        return {
            loginTests: [
                {
                    name: 'Login form visibility check',
                    type: 'assertion',
                    selector: 'form, [role="form"]',
                },
            ],
            formValidationTests: [
                {
                    name: 'Form field interactability',
                    type: 'assertion',
                    selector: 'input, textarea, select',
                },
            ],
            securityTests: [
                {
                    name: 'Basic security check',
                    type: 'assertion',
                    selector: 'body',
                },
            ],
            userJourneyTests: [],
            accessibilityTests: [
                {
                    name: 'Basic accessibility check',
                    type: 'assertion',
                    selector: '[role], [aria-label]',
                },
            ],
        };
    }
}
