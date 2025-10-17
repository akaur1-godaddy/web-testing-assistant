import axios, { AxiosRequestConfig, AxiosResponse, Method } from 'axios';

/**
 * API Test Case Interface
 */
export interface APITestCase {
  name: string;
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
  timeout?: number;
}

/**
 * API Test Result Interface
 */
export interface APITestResult {
  name: string;
  status: 'passed' | 'failed';
  message?: string;
  duration: number;
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
}

/**
 * API Tester Service
 * Executes API tests and validates responses
 */
export class APITester {
  private baseUrl?: string;
  private defaultHeaders: Record<string, string> = {};

  constructor(baseUrl?: string, defaultHeaders?: Record<string, string>) {
    this.baseUrl = baseUrl;
    if (defaultHeaders) {
      this.defaultHeaders = defaultHeaders;
    }
  }

  /**
   * Set default headers for all requests
   */
  setDefaultHeaders(headers: Record<string, string>) {
    this.defaultHeaders = { ...this.defaultHeaders, ...headers };
  }

  /**
   * Execute a single API test case
   */
  async executeTest(testCase: APITestCase): Promise<APITestResult> {
    const startTime = Date.now();
    
    try {
      // Build full URL
      const fullUrl = this.buildUrl(testCase.url);
      
      // Prepare request config
      const config: AxiosRequestConfig = {
        method: testCase.method as Method,
        url: fullUrl,
        headers: {
          ...this.defaultHeaders,
          ...testCase.headers,
        },
        timeout: testCase.timeout || 30000,
      };

      // Add body for methods that support it
      if (['POST', 'PUT', 'PATCH'].includes(testCase.method) && testCase.body) {
        config.data = testCase.body;
      }

      // Execute request
      const response: AxiosResponse = await axios(config);
      const duration = Date.now() - startTime;

      // Validate response
      const validations = this.validateResponse(testCase, response);
      const allValidationsPassed = Object.values(validations).every((v) => v);

      return {
        name: testCase.name,
        status: allValidationsPassed ? 'passed' : 'failed',
        message: allValidationsPassed 
          ? `API test passed (${duration}ms)` 
          : this.getValidationFailureMessage(validations),
        duration,
        request: {
          method: testCase.method,
          url: fullUrl,
          headers: config.headers as Record<string, string>,
          body: testCase.body,
        },
        response: {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers as Record<string, string>,
          data: response.data,
          size: JSON.stringify(response.data).length,
        },
        validations,
      };
    } catch (error: any) {
      const duration = Date.now() - startTime;
      
      // Handle axios error
      if (error.response) {
        // Server responded with error status
        const validations = this.validateResponse(testCase, error.response);
        const allValidationsPassed = Object.values(validations).every((v) => v);

        return {
          name: testCase.name,
          status: allValidationsPassed ? 'passed' : 'failed',
          message: allValidationsPassed
            ? `API test passed with expected error status (${duration}ms)`
            : `API returned ${error.response.status} ${error.response.statusText}`,
          duration,
          request: {
            method: testCase.method,
            url: this.buildUrl(testCase.url),
            headers: { ...this.defaultHeaders, ...testCase.headers },
            body: testCase.body,
          },
          response: {
            status: error.response.status,
            statusText: error.response.statusText,
            headers: error.response.headers,
            data: error.response.data,
            size: JSON.stringify(error.response.data).length,
          },
          validations,
        };
      } else if (error.request) {
        // Request made but no response
        return {
          name: testCase.name,
          status: 'failed',
          message: `No response received: ${error.message}`,
          duration,
          request: {
            method: testCase.method,
            url: this.buildUrl(testCase.url),
            headers: { ...this.defaultHeaders, ...testCase.headers },
            body: testCase.body,
          },
        };
      } else {
        // Error setting up request
        return {
          name: testCase.name,
          status: 'failed',
          message: `Request setup failed: ${error.message}`,
          duration,
          request: {
            method: testCase.method,
            url: this.buildUrl(testCase.url),
            headers: { ...this.defaultHeaders, ...testCase.headers },
            body: testCase.body,
          },
        };
      }
    }
  }

  /**
   * Execute multiple API test cases
   */
  async executeTests(testCases: APITestCase[]): Promise<APITestResult[]> {
    const results: APITestResult[] = [];

    for (const testCase of testCases) {
      console.log(`🔄 Executing API test: ${testCase.name}`);
      const result = await this.executeTest(testCase);
      results.push(result);
      console.log(`${result.status === 'passed' ? '✅' : '❌'} ${result.name}: ${result.message}`);
    }

    return results;
  }

  /**
   * Build full URL from base URL and path
   */
  private buildUrl(path: string): string {
    // If path is already a full URL, return it
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }

    // If base URL exists, combine with path
    if (this.baseUrl) {
      const base = this.baseUrl.endsWith('/') ? this.baseUrl.slice(0, -1) : this.baseUrl;
      const pathPart = path.startsWith('/') ? path : `/${path}`;
      return `${base}${pathPart}`;
    }

    // Otherwise return path as-is
    return path;
  }

  /**
   * Validate response against expected criteria
   */
  private validateResponse(
    testCase: APITestCase,
    response: AxiosResponse
  ): {
    statusCode: boolean;
    responseContains: boolean;
    requiredFields: boolean;
    schemaMatch: boolean;
  } {
    const validations = {
      statusCode: true,
      responseContains: true,
      requiredFields: true,
      schemaMatch: true,
    };

    // Validate status code
    if (testCase.expectedStatus !== undefined) {
      validations.statusCode = response.status === testCase.expectedStatus;
    }

    // Validate response content
    if (testCase.expectedResponse) {
      const responseData = response.data;
      const responseString = JSON.stringify(responseData);

      // Check if response contains expected strings
      if (testCase.expectedResponse.contains) {
        validations.responseContains = testCase.expectedResponse.contains.every(
          (str) => responseString.includes(str)
        );
      }

      // Check if response has required fields
      if (testCase.expectedResponse.fields) {
        validations.requiredFields = this.hasRequiredFields(
          responseData,
          testCase.expectedResponse.fields
        );
      }

      // Validate against schema (basic implementation)
      if (testCase.expectedResponse.schema) {
        validations.schemaMatch = this.matchesSchema(
          responseData,
          testCase.expectedResponse.schema
        );
      }
    }

    return validations;
  }

  /**
   * Check if object has all required fields
   */
  private hasRequiredFields(obj: any, fields: string[]): boolean {
    if (typeof obj !== 'object' || obj === null) {
      return false;
    }

    // If response is an array, check the first item
    const targetObj = Array.isArray(obj) && obj.length > 0 ? obj[0] : obj;

    if (typeof targetObj !== 'object' || targetObj === null) {
      return false;
    }

    return fields.every((field) => {
      // Support nested fields with dot notation (e.g., "user.email")
      const parts = field.split('.');
      let current = targetObj;

      for (const part of parts) {
        if (current && typeof current === 'object' && part in current) {
          current = current[part];
        } else {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * Basic schema validation
   */
  private matchesSchema(data: any, schema: Record<string, any>): boolean {
    if (typeof data !== 'object' || data === null) {
      return false;
    }

    for (const [key, expectedType] of Object.entries(schema)) {
      if (!(key in data)) {
        return false;
      }

      const actualType = typeof data[key];
      if (actualType !== expectedType && expectedType !== 'any') {
        return false;
      }
    }

    return true;
  }

  /**
   * Get validation failure message
   */
  private getValidationFailureMessage(validations: Record<string, boolean>): string {
    const failures: string[] = [];

    if (!validations.statusCode) failures.push('status code mismatch');
    if (!validations.responseContains) failures.push('expected content not found');
    if (!validations.requiredFields) failures.push('missing required fields');
    if (!validations.schemaMatch) failures.push('schema validation failed');

    return `Validation failed: ${failures.join(', ')}`;
  }
}

