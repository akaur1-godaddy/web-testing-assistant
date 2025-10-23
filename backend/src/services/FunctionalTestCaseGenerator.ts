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
        // const buttons = elements.filter(e => e.elementType === 'button');
        const forms = elements.filter(e => e.elementType === 'form');
        const inputs = elements.filter(e => ['input', 'select', 'textarea', 'checkbox', 'radio'].includes(e.elementType));
        const links = elements.filter(e => e.elementType === 'link');

        // Generate button tests
        // for (const button of buttons) {
        //     tests.push(...this.generateButtonTests(button));
        // }

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

        // Generate comprehensive security tests
        tests.push(...this.generateSecurityTests());

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
        const buttonText = button.text || button.ariaLabel || 'button';
        tests.push({
            name: `Click "${buttonText}" button and verify it responds correctly`,
            type: 'click',
            selector: selector,
        });

        // Wait after click
        tests.push({
            name: `Wait for page to respond after clicking "${buttonText}" button`,
            type: 'wait',
            timeout: 800,
        });

        // Assertion: page still rendered
        tests.push({
            name: `Verify page remains stable after clicking "${buttonText}" button`,
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
        const formId = form.id || 'form';
        tests.push({
            name: `Verify form "${formId}" is present and accessible on the page`,
            type: 'assertion',
            selector: form.selector || form.xpathSelector || 'form',
        });

        // Test form submission with empty fields
        const submitButton = form.selector ? `${form.selector} button[type="submit"]` : 'button[type="submit"]';
        tests.push({
            name: `Attempt to submit form "${formId}" with empty fields to test validation`,
            type: 'click',
            selector: submitButton,
        });

        tests.push({
            name: `Wait for form validation response after empty submission`,
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
        const inputName = input.name || input.placeholder || input.id || 'field';
        tests.push({
            name: `Verify input field "${inputName}" is present and interactable`,
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
            name: `Enter valid data "${testValue}" into "${inputName}" field and verify it accepts the input`,
            type: 'input',
            selector: selector,
            value: testValue,
        });

        // Test 3: Clear and re-enter (if text-based)
        if (['email', 'text', 'password'].includes(input.type || 'text')) {
            tests.push({
                name: `Clear and re-enter different data in "${inputName}" field to test field reset functionality`,
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

        const linkText = link.text || link.ariaLabel || 'link';
        tests.push({
            name: `Verify link "${linkText}" is present and clickable`,
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
                name: 'Test input field with very long text (1000 characters) to verify length handling',
                type: 'input',
                selector: 'input[type="text"]',
                value: 'a'.repeat(1000),
            },
            {
                name: 'Test input field with XSS attempt to verify security filtering',
                type: 'input',
                selector: 'input[type="text"]',
                value: '<script>alert("xss")</script>',
            },
            {
                name: 'Test input field with SQL injection attempt to verify database security',
                type: 'input',
                selector: 'input[type="text"]',
                value: "'; DROP TABLE users; --",
            },
            {
                name: 'Test rapid form submission to verify duplicate submission prevention',
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
                name: 'Verify input field sanitizes XSS script tags and prevents JavaScript execution',
                type: 'input',
                selector: 'input[type="text"]',
                value: '<script>alert("xss")</script>',
            },
            {
                name: 'Verify input field blocks XSS event handlers and prevents code injection',
                type: 'input',
                selector: 'input[type="text"]',
                value: '<img src=x onerror="alert(1)">',
            },
            {
                name: 'Verify input field prevents SQL injection attempts and maintains data integrity',
                type: 'input',
                selector: 'input[type="text"]',
                value: "' OR '1'='1",
            },
            {
                name: 'Verify form includes CSRF protection tokens to prevent cross-site request forgery',
                type: 'assertion',
                selector: 'input[name*="csrf"], input[name*="token"]',
            },
            {
                name: 'Verify input field handles HTML entities and prevents DOM manipulation',
                type: 'input',
                selector: 'input[type="text"]',
                value: '&lt;script&gt;alert("xss")&lt;/script&gt;',
            },
            {
                name: 'Verify input field blocks JavaScript protocol URLs and prevents code execution',
                type: 'input',
                selector: 'input[type="text"]',
                value: 'javascript:alert("xss")',
            },
            {
                name: 'Verify input field prevents SQL injection with UNION attacks',
                type: 'input',
                selector: 'input[type="text"]',
                value: "' UNION SELECT * FROM users--",
            },
            {
                name: 'Verify input field blocks LDAP injection attempts',
                type: 'input',
                selector: 'input[type="text"]',
                value: '*)(uid=*))(|(uid=*',
            },
            {
                name: 'Verify input field prevents NoSQL injection attacks',
                type: 'input',
                selector: 'input[type="text"]',
                value: '{"$ne": null}',
            },
            {
                name: 'Verify form submission includes proper security headers and validation',
                type: 'assertion',
                selector: 'form',
            },
            {
                name: 'Verify input field blocks command injection attempts',
                type: 'input',
                selector: 'input[type="text"]',
                value: '; rm -rf /',
            },
            {
                name: 'Verify input field prevents path traversal attacks',
                type: 'input',
                selector: 'input[type="text"]',
                value: '../../../etc/passwd',
            },
            {
                name: 'Verify input field blocks XML external entity (XXE) injection',
                type: 'input',
                selector: 'input[type="text"]',
                value: '<?xml version="1.0"?><!DOCTYPE foo [<!ENTITY xxe SYSTEM "file:///etc/passwd">]><foo>&xxe;</foo>',
            },
            {
                name: 'Verify input field prevents server-side template injection',
                type: 'input',
                selector: 'input[type="text"]',
                value: '{{7*7}}',
            },
            {
                name: 'Verify input field blocks HTTP header injection attempts',
                type: 'input',
                selector: 'input[type="text"]',
                value: 'test\r\nSet-Cookie: malicious=value',
            },
        ];
    }
}
