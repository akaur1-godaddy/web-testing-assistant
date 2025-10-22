import { TestCase } from './testRunner.js';
import { ElementDetector, InteractiveElement, ElementType } from './ElementDetector.js';
import { Page } from 'puppeteer';

export interface TestScenario {
    name: string;
    type: 'positive' | 'negative' | 'edge' | 'security';
    steps: TestCase[];
    description: string;
}

export class FunctionalTestCaseGenerator {
    private detector: ElementDetector;
    private page: Page;

    constructor(page: Page) {
        this.page = page;
        this.detector = new ElementDetector(page);
    }

    /**
     * Generate comprehensive test cases from detected elements
     */
    async generateTestCases(): Promise<TestCase[]> {
        const elements = await this.detector.detectAllInteractiveElements();
        const tests: TestCase[] = [];

        console.log(`🎯 Generating tests for ${elements.length} elements`);

        // Group elements by type
        const buttons = elements.filter(e => e.elementType === 'button');
        const forms = elements.filter(e => e.elementType === 'form');
        const inputs = elements.filter(e => ['input', 'select', 'textarea', 'checkbox', 'radio'].includes(e.elementType));
        const links = elements.filter(e => e.elementType === 'link');

        // Generate button tests
        for (const button of buttons) {
            tests.push(...this.generateButtonTests(button));
        }

        // Generate form tests
        for (const form of forms) {
            tests.push(...this.generateFormTests(form));
        }

        // Generate input validation tests
        for (const input of inputs) {
            tests.push(...this.generateInputValidationTests(input));
        }

        // Generate navigation tests
        for (const link of links) {
            tests.push(...this.generateLinkTests(link));
        }

        console.log(`✅ Generated ${tests.length} total test cases`);
        return tests;
    }

    /**
     * Generate tests for button elements
     */
    private generateButtonTests(button: InteractiveElement): TestCase[] {
        const tests: TestCase[] = [];
        const selector = button.selector || button.xpathSelector;

        if (!selector) return tests;

        // Positive test: button click
        tests.push({
            name: `Button Click: ${button.text || button.ariaLabel || 'button'}`,
            type: 'click',
            selector: selector,
        });

        // Wait after click
        tests.push({
            name: `Wait after button click`,
            type: 'wait',
            timeout: 800,
        });

        // Assertion: page still rendered
        tests.push({
            name: `Button interaction complete`,
            type: 'assertion',
            selector: 'body',
        });

        return tests;
    }

    /**
     * Generate tests for form elements
     */
    private generateFormTests(form: InteractiveElement): TestCase[] {
        const tests: TestCase[] = [];

        // Positive test: form exists
        tests.push({
            name: `Form exists: ${form.id || 'form'}`,
            type: 'assertion',
            selector: form.selector || form.xpathSelector || 'form',
        });

        // Test form submission with empty fields
        const submitButton = form.selector ? `${form.selector} button[type="submit"]` : 'button[type="submit"]';
        tests.push({
            name: `Form empty submission attempt`,
            type: 'click',
            selector: submitButton,
        });

        tests.push({
            name: `Wait for form response`,
            type: 'wait',
            timeout: 1000,
        });

        return tests;
    }

    /**
     * Generate input validation tests
     */
    private generateInputValidationTests(input: InteractiveElement): TestCase[] {
        const tests: TestCase[] = [];
        const selector = input.selector || input.xpathSelector;

        if (!selector || !['input', 'textarea', 'select'].includes(input.elementType)) return tests;

        // Test 1: Input element is interactable
        tests.push({
            name: `Input interactable: ${input.name || input.placeholder || input.id}`,
            type: 'assertion',
            selector: selector,
        });

        // Test 2: Type valid data based on input type
        let testValue = 'test';
        if (input.type === 'email' || input.placeholder?.includes('email')) {
            testValue = 'test@example.com';
        } else if (input.type === 'number' || input.placeholder?.includes('number')) {
            testValue = '42';
        } else if (input.type === 'password') {
            testValue = 'TestPassword123!';
        } else if (input.placeholder) {
            testValue = input.placeholder.slice(0, 20);
        }

        tests.push({
            name: `Input valid data: ${input.name || input.id || 'field'}`,
            type: 'input',
            selector: selector,
            value: testValue,
        });

        // Test 3: Clear and re-enter (if text-based)
        if (['email', 'text', 'password'].includes(input.type || 'text')) {
            tests.push({
                name: `Input clear and re-enter`,
                type: 'input',
                selector: selector,
                value: testValue + '2',
            });
        }

        return tests;
    }

    /**
     * Generate tests for links
     */
    private generateLinkTests(link: InteractiveElement): TestCase[] {
        const tests: TestCase[] = [];
        const selector = link.selector || link.xpathSelector;

        if (!selector) return tests;

        tests.push({
            name: `Link exists: ${link.text || link.ariaLabel}`,
            type: 'assertion',
            selector: selector,
        });

        return tests;
    }

    /**
     * Generate edge case tests
     */
    generateEdgeCaseTests(): TestCase[] {
        return [
            {
                name: 'Edge Case: Very long input text',
                type: 'input',
                selector: 'input[type="text"]',
                value: 'a'.repeat(1000),
            },
            {
                name: 'Edge Case: Special characters',
                type: 'input',
                selector: 'input[type="text"]',
                value: '<script>alert("xss")</script>',
            },
            {
                name: 'Edge Case: SQL injection attempt',
                type: 'input',
                selector: 'input[type="text"]',
                value: "'; DROP TABLE users; --",
            },
            {
                name: 'Edge Case: Rapid form submission',
                type: 'click',
                selector: 'button[type="submit"]',
            },
        ];
    }

    /**
     * Generate security tests
     */
    generateSecurityTests(): TestCase[] {
        return [
            {
                name: 'Security: XSS prevention - script tag',
                type: 'input',
                selector: 'input[type="text"]',
                value: '<script>alert("xss")</script>',
            },
            {
                name: 'Security: XSS prevention - event handler',
                type: 'input',
                selector: 'input[type="text"]',
                value: '<img src=x onerror="alert(1)">',
            },
            {
                name: 'Security: SQL injection - basic',
                type: 'input',
                selector: 'input[type="text"]',
                value: "' OR '1'='1",
            },
            {
                name: 'Security: CSRF token validation',
                type: 'assertion',
                selector: 'input[name*="csrf"], input[name*="token"]',
            },
        ];
    }
}
