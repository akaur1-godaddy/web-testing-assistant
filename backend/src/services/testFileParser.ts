import { TestCase } from './testRunner.js';

export interface ParsedTestFile {
  tests: TestCase[];
  format: 'json' | 'javascript' | 'text';
  metadata?: {
    name?: string;
    description?: string;
    author?: string;
  };
}

export class TestFileParser {
  /**
   * Parse uploaded test file based on its content
   */
  async parseTestFile(fileBuffer: Buffer, filename: string): Promise<ParsedTestFile> {
    const content = fileBuffer.toString('utf-8');
    const extension = filename.split('.').pop()?.toLowerCase();

    console.log(`📄 Parsing test file: ${filename} (${extension})`);

    switch (extension) {
      case 'json':
        return this.parseJSON(content);
      case 'js':
      case 'mjs':
        return this.parseJavaScript(content);
      case 'txt':
      case 'md':
        return this.parseText(content);
      default:
        // Try to auto-detect format
        return this.autoDetectAndParse(content);
    }
  }

  /**
   * Parse JSON format test file
   */
  private parseJSON(content: string): ParsedTestFile {
    try {
      const data = JSON.parse(content);

      // Handle different JSON structures
      if (Array.isArray(data)) {
        return {
          tests: this.normalizeTestCases(data),
          format: 'json',
        };
      }

      if (data.tests && Array.isArray(data.tests)) {
        return {
          tests: this.normalizeTestCases(data.tests),
          format: 'json',
          metadata: data.metadata || {},
        };
      }

      throw new Error('Invalid JSON structure: expected array or object with "tests" property');
    } catch (error) {
      throw new Error(`Failed to parse JSON: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Parse JavaScript format test file
   */
  private parseJavaScript(content: string): ParsedTestFile {
    try {
      // Note: In production, you'd want to use a safer evaluation method
      // or a proper JavaScript parser like @babel/parser
      
      // For now, we'll convert common JavaScript patterns to JSON
      // This is a simplified version - you might want to use vm.runInContext
      
      // Remove module.exports and extract the array
      let cleaned = content
        .replace(/module\.exports\s*=\s*/, '')
        .replace(/export\s+default\s+/, '')
        .trim();

      // If it ends with semicolon, remove it
      if (cleaned.endsWith(';')) {
        cleaned = cleaned.slice(0, -1);
      }

      // Try to parse as JSON (many JS arrays can be parsed as JSON)
      try {
        const data = JSON.parse(cleaned);
        return {
          tests: this.normalizeTestCases(data),
          format: 'javascript',
        };
      } catch {
        // If JSON parsing fails, it might have functions
        // In this case, we'd need more sophisticated parsing
        // For now, return a placeholder test
        return {
          tests: [{
            name: 'JavaScript test parsing - manual review needed',
            type: 'assertion',
          }],
          format: 'javascript',
        };
      }
    } catch (error) {
      throw new Error(`Failed to parse JavaScript: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Parse plain text format test file
   */
  private parseText(content: string): ParsedTestFile {
    const tests: TestCase[] = [];
    const lines = content.split('\n');
    let currentTest: { name: string; steps: any[] } | null = null;

    for (const line of lines) {
      const trimmed = line.trim();
      
      if (!trimmed || trimmed.startsWith('#')) continue;

      // Detect test name
      if (trimmed.toLowerCase().startsWith('test:')) {
        if (currentTest) {
          tests.push(...this.convertTextTestToTestCases(currentTest));
        }
        currentTest = {
          name: trimmed.substring(5).trim(),
          steps: [],
        };
        continue;
      }

      // Parse steps
      if (currentTest) {
        const stepMatch = trimmed.match(/^(\d+)\.\s*(.+)/);
        if (stepMatch) {
          currentTest.steps.push(this.parseTextStep(stepMatch[2]));
        }
      }
    }

    // Add last test
    if (currentTest) {
      tests.push(...this.convertTextTestToTestCases(currentTest));
    }

    return {
      tests,
      format: 'text',
    };
  }

  /**
   * Parse a single text step into an action
   */
  private parseTextStep(step: string): any {
    const lower = step.toLowerCase();

    // Navigate
    if (lower.includes('navigate') || lower.includes('go to')) {
      const urlMatch = step.match(/to\s+(.+)/i);
      return {
        action: 'navigate',
        url: urlMatch ? urlMatch[1].trim() : '/',
      };
    }

    // Click
    if (lower.includes('click')) {
      const selectorMatch = step.match(/click\s+(?:on\s+)?(.+)/i);
      return {
        action: 'click',
        selector: selectorMatch ? selectorMatch[1].trim() : '',
      };
    }

    // Type
    if (lower.includes('type') || lower.includes('enter')) {
      const typeMatch = step.match(/type\s+(.+?)\s+(?:into|in)\s+(.+)/i);
      if (typeMatch) {
        return {
          action: 'type',
          value: typeMatch[1].trim(),
          selector: typeMatch[2].trim(),
        };
      }
    }

    // Verify/Assert
    if (lower.includes('verify') || lower.includes('check') || lower.includes('assert')) {
      const verifyMatch = step.match(/(?:verify|check|assert)\s+(.+?)\s+(?:exists|is visible|appears)/i);
      if (verifyMatch) {
        return {
          action: 'assert',
          selector: verifyMatch[1].trim(),
          expected: 'visible',
        };
      }
    }

    // Wait
    if (lower.includes('wait')) {
      const timeMatch = step.match(/(\d+)\s*(?:ms|milliseconds|seconds?)?/i);
      return {
        action: 'wait',
        timeout: timeMatch ? parseInt(timeMatch[1]) : 1000,
      };
    }

    // Default
    return {
      action: 'wait',
      timeout: 500,
    };
  }

  /**
   * Convert text test format to TestCase array
   */
  private convertTextTestToTestCases(test: { name: string; steps: any[] }): TestCase[] {
    return test.steps.map((step, index) => ({
      name: `${test.name} - Step ${index + 1}`,
      type: step.action as any,
      selector: step.selector,
      value: step.value,
      expected: step.expected,
      timeout: step.timeout,
    }));
  }

  /**
   * Auto-detect file format and parse accordingly
   */
  private autoDetectAndParse(content: string): ParsedTestFile {
    // Try JSON first
    try {
      return this.parseJSON(content);
    } catch {
      // Not JSON
    }

    // Check if it looks like text format
    if (content.toLowerCase().includes('test:')) {
      return this.parseText(content);
    }

    // Check if it looks like JavaScript
    if (content.includes('module.exports') || content.includes('export')) {
      return this.parseJavaScript(content);
    }

    throw new Error('Unable to auto-detect file format');
  }

  /**
   * Normalize various test case formats to standardized TestCase format
   */
  private normalizeTestCases(data: any[]): TestCase[] {
    return data.flatMap((item) => {
      // If it already matches our TestCase interface
      if (item.type && item.name) {
        return [item as TestCase];
      }

      // If it has a steps array (common format)
      if (item.steps && Array.isArray(item.steps)) {
        return this.convertStepsToTestCases(item);
      }

      // If it has action property (another common format)
      if (item.action) {
        return [{
          name: item.name || 'Unnamed test',
          type: this.mapActionToType(item.action),
          selector: item.selector,
          value: item.value,
          expected: item.expected,
          timeout: item.timeout,
        }];
      }

      // Default fallback
      return [{
        name: item.name || 'Unknown test',
        type: 'assertion',
        selector: item.selector,
      }];
    });
  }

  /**
   * Convert steps-based test to individual TestCases
   */
  private convertStepsToTestCases(test: any): TestCase[] {
    const testName = test.name || 'Unnamed test';
    return test.steps.map((step: any, index: number) => ({
      name: `${testName} - Step ${index + 1}: ${step.action || step.type}`,
      type: this.mapActionToType(step.action || step.type),
      selector: step.selector,
      value: step.value,
      expected: step.expected,
      timeout: step.timeout,
    }));
  }

  /**
   * Map various action names to our TestCase type
   */
  private mapActionToType(action: string): TestCase['type'] {
    const actionMap: { [key: string]: TestCase['type'] } = {
      click: 'click',
      type: 'input',
      input: 'input',
      enter: 'input',
      navigate: 'navigation',
      goto: 'navigation',
      visit: 'navigation',
      assert: 'assertion',
      verify: 'assertion',
      check: 'assertion',
      wait: 'wait',
      sleep: 'wait',
      delay: 'wait',
    };

    return actionMap[action.toLowerCase()] || 'assertion';
  }

  /**
   * Validate parsed tests for common issues
   */
  validateTests(tests: TestCase[]): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (tests.length === 0) {
      errors.push('No tests found in file');
    }

    tests.forEach((test, index) => {
      if (!test.name) {
        errors.push(`Test ${index + 1} is missing a name`);
      }

      if (!test.type) {
        errors.push(`Test "${test.name}" is missing a type`);
      }

      if (['click', 'input', 'assertion'].includes(test.type) && !test.selector) {
        errors.push(`Test "${test.name}" requires a selector for ${test.type} action`);
      }

      if (test.type === 'input' && !test.value) {
        errors.push(`Test "${test.name}" requires a value for input action`);
      }
    });

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

