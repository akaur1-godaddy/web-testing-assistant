import { Page } from 'puppeteer';
import { TestCase } from './testRunner.js';
import { InteractiveElement } from './ElementDetector.js';

export interface FormField {
    selector: string;
    type: string;
    name?: string;
    required: boolean;
    validation?: string;
}

export class FormTestValidator {
    constructor(private page: Page) { }

    /**
     * Generate comprehensive form validation tests
     */
    async generateFormValidationTests(formInputs: InteractiveElement[]): Promise<TestCase[]> {
        const tests: TestCase[] = [];

        for (const input of formInputs) {
            const selector = input.selector || input.xpathSelector;
            if (!selector) continue;

            // Test 1: Field is visible and interactable
            tests.push({
                name: `Form Field Visible: ${input.name || input.placeholder}`,
                type: 'assertion',
                selector: selector,
            });

            // Test 2: Type valid test data
            const testValue = this.generateTestDataForField(input);
            tests.push({
                name: `Form Field Input: ${input.name || input.placeholder}`,
                type: 'input',
                selector: selector,
                value: testValue,
            });

            // Test 3: Empty field submission (if required)
            if (input.required !== false) {
                tests.push({
                    name: `Form Field Required Validation: ${input.name || input.placeholder}`,
                    type: 'input',
                    selector: selector,
                    value: '',
                });
            }

            // Test 4: Invalid data for specific types
            if (input.type === 'email') {
                tests.push({
                    name: `Email Format Validation: ${input.name}`,
                    type: 'input',
                    selector: selector,
                    value: 'invalid-email',
                });
            }

            if (input.type === 'number') {
                tests.push({
                    name: `Number Type Validation: ${input.name}`,
                    type: 'input',
                    selector: selector,
                    value: 'not-a-number',
                });
            }

            // Test 5: Security tests
            tests.push({
                name: `XSS Prevention: ${input.name || input.placeholder}`,
                type: 'input',
                selector: selector,
                value: '<script>alert("xss")</script>',
            });

            tests.push({
                name: `SQL Injection Prevention: ${input.name || input.placeholder}`,
                type: 'input',
                selector: selector,
                value: "' OR '1'='1",
            });

            // Test 6: Boundary tests
            if (input.type === 'text' || input.type === 'password') {
                tests.push({
                    name: `Long Input Test: ${input.name || input.placeholder}`,
                    type: 'input',
                    selector: selector,
                    value: 'a'.repeat(1000),
                });

                tests.push({
                    name: `Special Characters Test: ${input.name || input.placeholder}`,
                    type: 'input',
                    selector: selector,
                    value: '!@#$%^&*()_+-=[]{}|;:,.<>?',
                });
            }
        }

        return tests;
    }

    /**
     * Generate form submission tests
     */
    generateFormSubmissionTests(formSelector: string): TestCase[] {
        const tests: TestCase[] = [];

        // Test 1: Form exists
        tests.push({
            name: 'Form Existence Check',
            type: 'assertion',
            selector: formSelector,
        });

        // Test 2: Submit button is clickable
        tests.push({
            name: 'Form Submit Button Visible',
            type: 'assertion',
            selector: `${formSelector} button[type="submit"], ${formSelector} input[type="submit"]`,
        });

        // Test 3: Empty form submission
        tests.push({
            name: 'Form Empty Submission Attempt',
            type: 'click',
            selector: `${formSelector} button[type="submit"]`,
        });

        tests.push({
            name: 'Wait for form response',
            type: 'wait',
            timeout: 1500,
        });

        return tests;
    }

    /**
     * Generate login-specific tests
     */
    generateLoginTests(emailSelector: string, passwordSelector: string, submitSelector: string): TestCase[] {
        const tests: TestCase[] = [];

        // Valid login attempt
        tests.push({
            name: 'Valid Login: Email Field',
            type: 'input',
            selector: emailSelector,
            value: 'test@example.com',
        });

        tests.push({
            name: 'Valid Login: Password Field',
            type: 'input',
            selector: passwordSelector,
            value: 'TestPassword123!',
        });

        tests.push({
            name: 'Valid Login: Submit',
            type: 'click',
            selector: submitSelector,
        });

        tests.push({
            name: 'Wait for login response',
            type: 'wait',
            timeout: 2000,
        });

        // Invalid credentials tests
        tests.push({
            name: 'Invalid Login: Wrong Password',
            type: 'input',
            selector: passwordSelector,
            value: 'WrongPassword123',
        });

        tests.push({
            name: 'Invalid Login: Submit',
            type: 'click',
            selector: submitSelector,
        });

        tests.push({
            name: 'Wait for error response',
            type: 'wait',
            timeout: 1500,
        });

        // Security tests
        tests.push({
            name: 'Security: SQL Injection in Email',
            type: 'input',
            selector: emailSelector,
            value: "admin' --",
        });

        tests.push({
            name: 'Security: XSS in Password',
            type: 'input',
            selector: passwordSelector,
            value: '<script>alert("xss")</script>',
        });

        return tests;
    }

    /**
     * Generate accessibility tests
     */
    generateAccessibilityTests(formInputs: InteractiveElement[]): TestCase[] {
        const tests: TestCase[] = [];

        // Check for labels
        for (const input of formInputs) {
            const selector = input.selector || input.xpathSelector;
            if (!selector) continue;

            tests.push({
                name: `Accessibility: Label Associated with ${input.name || 'field'}`,
                type: 'assertion',
                selector: `label[for="${input.id}"]`,
            });

            // Check for ARIA attributes
            if (!input.ariaLabel) {
                tests.push({
                    name: `Accessibility: ARIA Label for ${input.name || 'field'}`,
                    type: 'assertion',
                    selector: `${selector}[aria-label]`,
                });
            }
        }

        // Keyboard navigation test
        tests.push({
            name: 'Accessibility: Keyboard Navigation',
            type: 'assertion',
            selector: 'input[tabindex], button[tabindex], a[tabindex]',
        });

        return tests;
    }

    /**
     * Generate test data based on field type
     */
    private generateTestDataForField(input: InteractiveElement): string {
        if (input.type === 'email' || input.placeholder?.includes('email')) {
            return 'test@example.com';
        }
        if (input.type === 'password' || input.placeholder?.includes('password')) {
            return 'TestPassword123!';
        }
        if (input.type === 'number' || input.placeholder?.includes('number')) {
            return '42';
        }
        if (input.type === 'date' || input.placeholder?.includes('date')) {
            return '2025-10-22';
        }
        if (input.type === 'tel' || input.placeholder?.includes('phone')) {
            return '555-0123';
        }
        if (input.type === 'url' || input.placeholder?.includes('url')) {
            return 'https://example.com';
        }
        if (input.placeholder) {
            return input.placeholder.slice(0, 20);
        }
        return 'test data';
    }
}
