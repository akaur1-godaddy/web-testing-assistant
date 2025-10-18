import { Page } from 'puppeteer';

/**
 * AI Security Testing Service
 * Automated security vulnerability detection and penetration testing
 */
export class SecurityAI {
  private page: Page;
  private vulnerabilities: SecurityVulnerability[] = [];
  private securityScanner: SecurityScanner;

  constructor(page: Page) {
    this.page = page;
    this.securityScanner = new SecurityScanner(page);
  }

  /**
   * Comprehensive security analysis of the web application
   */
  async performSecurityScan(): Promise<SecurityReport> {
    console.log('🔒 Starting comprehensive security scan...');

    const results = await Promise.all([
      this.detectXSSVulnerabilities(),
      this.testSQLInjection(),
      this.analyzeCookieSecurity(),
      this.detectSensitiveDataLeaks(),
      this.testCSRFProtection(),
      this.analyzeAuthenticationSecurity(),
      this.checkHTTPSSecurity(),
      this.testInputValidation(),
      this.analyzeContentSecurityPolicy(),
      this.detectClickjackingVulnerabilities(),
    ]);

    // Flatten all vulnerabilities
    const allVulnerabilities = results.flat();
    this.vulnerabilities = allVulnerabilities;

    const securityScore = this.calculateSecurityScore(allVulnerabilities);
    const riskAssessment = this.assessSecurityRisk(allVulnerabilities);

    return {
      securityScore,
      riskLevel: riskAssessment.level,
      vulnerabilities: allVulnerabilities,
      criticalIssues: allVulnerabilities.filter(v => v.severity === 'critical'),
      recommendations: this.generateSecurityRecommendations(allVulnerabilities),
      complianceStatus: await this.checkComplianceStandards(allVulnerabilities),
      remediationPlan: this.createRemediationPlan(allVulnerabilities),
    };
  }

  /**
   * Detect Cross-Site Scripting (XSS) vulnerabilities
   */
  async detectXSSVulnerabilities(): Promise<SecurityVulnerability[]> {
    console.log('🔍 Scanning for XSS vulnerabilities...');
    
    const vulnerabilities: SecurityVulnerability[] = [];
    
    try {
      // Get all input fields and forms
      const forms = await this.page.$$('form');
      const inputs = await this.page.$$('input[type="text"], input[type="search"], textarea');

      // XSS payloads to test
      const xssPayloads = [
        '<script>alert("XSS")</script>',
        '"><script>alert("XSS")</script>',
        "'><script>alert('XSS')</script>",
        'javascript:alert("XSS")',
        '<img src=x onerror=alert("XSS")>',
        '<svg onload=alert("XSS")>',
        '"><img src=x onerror=alert("XSS")>',
        '\"><script>alert(String.fromCharCode(88,83,83))</script>',
      ];

      // Test each input field
      for (const input of inputs) {
        const inputInfo = await input.evaluate(el => ({
          type: (el as HTMLInputElement).type,
          name: (el as HTMLInputElement).name,
          id: el.id,
          placeholder: (el as HTMLInputElement).placeholder,
        }));

        for (const payload of xssPayloads) {
          try {
            // Clear and input XSS payload
            await input.click();
            await input.evaluate(el => (el as HTMLInputElement).value = '');
            await input.type(payload);

            // Check if payload is reflected in the DOM
            const isReflected = await this.page.evaluate((testPayload) => {
              return document.documentElement.innerHTML.includes(testPayload);
            }, payload);

            if (isReflected) {
              // Check if it's actually executable (not just reflected)
              const isExecutable = await this.checkXSSExecutability(payload);
              
              vulnerabilities.push({
                type: 'xss',
                severity: isExecutable ? 'critical' : 'high',
                title: 'Cross-Site Scripting (XSS) Vulnerability',
                description: `Input field "${inputInfo.name || inputInfo.id}" is vulnerable to XSS attacks`,
                location: `Input: ${inputInfo.name || inputInfo.id}`,
                evidence: {
                  payload: payload,
                  reflected: isReflected,
                  executable: isExecutable,
                },
                impact: 'Attacker can execute arbitrary JavaScript code in user browsers',
                remediation: [
                  'Implement proper input sanitization',
                  'Use Content Security Policy (CSP)',
                  'Encode output data properly',
                  'Validate and escape user input',
                ],
                cwe: 'CWE-79',
                owasp: 'A03:2021 – Injection',
              });
            }
          } catch (error) {
            console.warn('XSS test failed for payload:', payload, error);
          }
        }
      }

      // Test URL-based XSS
      const urlXSSVulns = await this.testURLBasedXSS();
      vulnerabilities.push(...urlXSSVulns);

    } catch (error) {
      console.error('XSS detection failed:', error);
    }

    return vulnerabilities;
  }

  /**
   * Test for SQL Injection vulnerabilities
   */
  async testSQLInjection(): Promise<SecurityVulnerability[]> {
    console.log('🔍 Testing for SQL Injection vulnerabilities...');
    
    const vulnerabilities: SecurityVulnerability[] = [];

    try {
      const forms = await this.page.$$('form');
      
      // SQL injection payloads
      const sqlPayloads = [
        "' OR '1'='1",
        "' OR 1=1--",
        "' UNION SELECT NULL--",
        "'; DROP TABLE users; --",
        "' OR 1=1#",
        "admin'--",
        "' OR 'a'='a",
        "1'; WAITFOR DELAY '00:00:10'--",
        "' OR SLEEP(5)--",
      ];

      for (const form of forms) {
        const inputs = await form.$$('input[type="text"], input[type="email"], input[type="password"]');
        
        for (const input of inputs) {
          const inputInfo = await input.evaluate(el => ({
            name: (el as HTMLInputElement).name,
            type: (el as HTMLInputElement).type,
            id: el.id,
          }));

          for (const payload of sqlPayloads) {
            try {
              // Record baseline response time
              const baselineStart = Date.now();
              await this.page.reload();
              const baselineTime = Date.now() - baselineStart;

              // Input SQL injection payload
              await input.click();
              await input.evaluate(el => (el as HTMLInputElement).value = '');
              await input.type(payload);

              // Submit form and measure response
              const submitStart = Date.now();
              const submitButton = await form.$('button[type="submit"], input[type="submit"]');
              
              if (submitButton) {
                await Promise.race([
                  submitButton.click(),
                  this.page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 }),
                ]);
              }
              
              const responseTime = Date.now() - submitStart;

              // Analyze response for SQL injection indicators
              const pageContent = await this.page.content();
              const sqlErrors = this.detectSQLErrors(pageContent);
              const timeBasedIndicators = responseTime > (baselineTime + 5000); // 5 second delay

              if (sqlErrors.length > 0 || timeBasedIndicators) {
                vulnerabilities.push({
                  type: 'sql-injection',
                  severity: 'critical',
                  title: 'SQL Injection Vulnerability',
                  description: `Input field "${inputInfo.name || inputInfo.id}" is vulnerable to SQL injection`,
                  location: `Form input: ${inputInfo.name || inputInfo.id}`,
                  evidence: {
                    payload: payload,
                    sqlErrors: sqlErrors,
                    timeBased: timeBasedIndicators,
                    responseTime: responseTime,
                  },
                  impact: 'Attacker can read, modify, or delete database content',
                  remediation: [
                    'Use parameterized queries/prepared statements',
                    'Implement input validation and sanitization',
                    'Use least privilege database accounts',
                    'Apply Web Application Firewall (WAF)',
                  ],
                  cwe: 'CWE-89',
                  owasp: 'A03:2021 – Injection',
                });
              }

            } catch (error) {
              console.warn('SQL injection test failed:', error);
            }
          }
        }
      }

    } catch (error) {
      console.error('SQL Injection testing failed:', error);
    }

    return vulnerabilities;
  }

  /**
   * Analyze cookie security configuration
   */
  async analyzeCookieSecurity(): Promise<SecurityVulnerability[]> {
    console.log('🔍 Analyzing cookie security...');
    
    const vulnerabilities: SecurityVulnerability[] = [];

    try {
      const cookies = await this.page.cookies();
      
      for (const cookie of cookies) {
        // Check for missing Secure flag
        if (!cookie.secure && this.page.url().startsWith('https:')) {
          vulnerabilities.push({
            type: 'cookie-security',
            severity: 'medium',
            title: 'Cookie Missing Secure Flag',
            description: `Cookie "${cookie.name}" is transmitted over HTTPS but lacks the Secure flag`,
            location: `Cookie: ${cookie.name}`,
            evidence: { cookie: cookie },
            impact: 'Cookie may be transmitted over unencrypted connections',
            remediation: ['Set Secure flag on all cookies when using HTTPS'],
            cwe: 'CWE-614',
            owasp: 'A05:2021 – Security Misconfiguration',
          });
        }

        // Check for missing HttpOnly flag
        if (!cookie.httpOnly) {
          vulnerabilities.push({
            type: 'cookie-security',
            severity: 'medium',
            title: 'Cookie Missing HttpOnly Flag',
            description: `Cookie "${cookie.name}" is accessible via JavaScript`,
            location: `Cookie: ${cookie.name}`,
            evidence: { cookie: cookie },
            impact: 'Cookie can be accessed by malicious scripts (XSS attacks)',
            remediation: ['Set HttpOnly flag on authentication and session cookies'],
            cwe: 'CWE-1004',
            owasp: 'A05:2021 – Security Misconfiguration',
          });
        }

        // Check for missing SameSite attribute
        if (!cookie.sameSite || cookie.sameSite === 'none') {
          vulnerabilities.push({
            type: 'cookie-security',
            severity: 'low',
            title: 'Cookie Missing SameSite Protection',
            description: `Cookie "${cookie.name}" lacks proper SameSite protection`,
            location: `Cookie: ${cookie.name}`,
            evidence: { cookie: cookie },
            impact: 'Cookie may be vulnerable to CSRF attacks',
            remediation: ['Set SameSite attribute to "Strict" or "Lax"'],
            cwe: 'CWE-352',
            owasp: 'A01:2021 – Broken Access Control',
          });
        }
      }

    } catch (error) {
      console.error('Cookie security analysis failed:', error);
    }

    return vulnerabilities;
  }

  /**
   * Detect sensitive data leaks in responses
   */
  async detectSensitiveDataLeaks(): Promise<SecurityVulnerability[]> {
    console.log('🔍 Scanning for sensitive data leaks...');
    
    const vulnerabilities: SecurityVulnerability[] = [];

    try {
      // Get page source and network responses
      const pageSource = await this.page.content();
      
      // Patterns for sensitive data
      const sensitivePatterns = [
        { name: 'Credit Card', pattern: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, severity: 'critical' as SecuritySeverity },
        { name: 'Social Security Number', pattern: /\b\d{3}-\d{2}-\d{4}\b/g, severity: 'critical' as SecuritySeverity },
        { name: 'Email Address', pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, severity: 'low' as SecuritySeverity },
        { name: 'Phone Number', pattern: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, severity: 'low' as SecuritySeverity },
        { name: 'API Key', pattern: /[Aa][Pp][Ii][\s_-]?[Kk][Ee][Yy][\s]*[:=][\s]*['"]?[A-Za-z0-9]{20,}['"]?/g, severity: 'high' as SecuritySeverity },
        { name: 'Password', pattern: /[Pp]assword[\s]*[:=][\s]*['"]?[A-Za-z0-9!@#$%^&*()_+=-]{8,}['"]?/g, severity: 'critical' as SecuritySeverity },
        { name: 'JWT Token', pattern: /eyJ[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*/g, severity: 'high' as SecuritySeverity },
      ];

      for (const { name, pattern, severity } of sensitivePatterns) {
        const matches = pageSource.match(pattern);
        if (matches && matches.length > 0) {
          vulnerabilities.push({
            type: 'sensitive-data-leak',
            severity: severity,
            title: `${name} Exposed in Response`,
            description: `Sensitive ${name.toLowerCase()} information found in page content`,
            location: 'Page source',
            evidence: { 
              matches: matches.slice(0, 5), // Limit to first 5 matches
              count: matches.length 
            },
            impact: `Sensitive ${name.toLowerCase()} data exposed to attackers`,
            remediation: [
              'Remove sensitive data from client-side code',
              'Implement proper data masking',
              'Use server-side processing for sensitive operations',
            ],
            cwe: 'CWE-200',
            owasp: 'A01:2021 – Broken Access Control',
          });
        }
      }

      // Check for exposed configuration or debug information
      const debugPatterns = [
        'debug=true',
        'console.log',
        'printStackTrace',
        'error_reporting',
        'display_errors',
      ];

      for (const debugPattern of debugPatterns) {
        if (pageSource.toLowerCase().includes(debugPattern.toLowerCase())) {
          vulnerabilities.push({
            type: 'information-disclosure',
            severity: 'medium',
            title: 'Debug Information Exposed',
            description: `Debug information or configuration exposed: ${debugPattern}`,
            location: 'Page source',
            evidence: { pattern: debugPattern },
            impact: 'Application structure and debug information exposed to attackers',
            remediation: [
              'Disable debug mode in production',
              'Remove console.log statements',
              'Implement proper error handling',
            ],
            cwe: 'CWE-200',
            owasp: 'A05:2021 – Security Misconfiguration',
          });
        }
      }

    } catch (error) {
      console.error('Sensitive data leak detection failed:', error);
    }

    return vulnerabilities;
  }

  /**
   * Test CSRF protection mechanisms
   */
  async testCSRFProtection(): Promise<SecurityVulnerability[]> {
    console.log('🔍 Testing CSRF protection...');
    
    const vulnerabilities: SecurityVulnerability[] = [];

    try {
      const forms = await this.page.$$('form');

      for (const form of forms) {
        const action = await form.evaluate(f => (f as HTMLFormElement).action);
        const method = await form.evaluate(f => (f as HTMLFormElement).method.toLowerCase());

        // Check for CSRF tokens
        const csrfToken = await form.$('input[name*="csrf"], input[name*="token"], input[name="_token"]');
        
        if (method === 'post' && !csrfToken) {
          vulnerabilities.push({
            type: 'csrf',
            severity: 'high',
            title: 'Missing CSRF Protection',
            description: 'Form lacks CSRF token protection',
            location: `Form action: ${action}`,
            evidence: { 
              method: method,
              action: action,
              hasCSRFToken: false 
            },
            impact: 'Attacker can perform unauthorized actions on behalf of authenticated users',
            remediation: [
              'Implement CSRF tokens in all state-changing forms',
              'Verify CSRF tokens on server-side',
              'Use SameSite cookie attributes',
            ],
            cwe: 'CWE-352',
            owasp: 'A01:2021 – Broken Access Control',
          });
        }
      }

    } catch (error) {
      console.error('CSRF protection testing failed:', error);
    }

    return vulnerabilities;
  }

  /**
   * Analyze authentication security
   */
  async analyzeAuthenticationSecurity(): Promise<SecurityVulnerability[]> {
    console.log('🔍 Analyzing authentication security...');
    
    const vulnerabilities: SecurityVulnerability[] = [];

    try {
      // Look for login forms
      const loginForms = await this.page.$$('form:has(input[type="password"])');

      for (const form of loginForms) {
        const passwordInput = await form.$('input[type="password"]');
        
        if (passwordInput) {
          // Check if form is submitted over HTTPS
          const formAction = await form.evaluate(f => (f as HTMLFormElement).action);
          const currentURL = this.page.url();
          
          if (!currentURL.startsWith('https:') || (formAction && !formAction.startsWith('https:'))) {
            vulnerabilities.push({
              type: 'authentication',
              severity: 'critical',
              title: 'Login Form Over HTTP',
              description: 'Authentication credentials transmitted over unencrypted connection',
              location: `Form: ${formAction || currentURL}`,
              evidence: { 
                currentURL: currentURL,
                formAction: formAction,
                isHTTPS: false 
              },
              impact: 'Login credentials can be intercepted by attackers',
              remediation: [
                'Use HTTPS for all authentication pages',
                'Implement HSTS headers',
                'Redirect HTTP to HTTPS',
              ],
              cwe: 'CWE-319',
              owasp: 'A02:2021 – Cryptographic Failures',
            });
          }

          // Check for autocomplete on password fields
          const hasAutocomplete = await passwordInput.evaluate(input => 
            (input as HTMLInputElement).autocomplete !== 'off'
          );

          if (hasAutocomplete) {
            vulnerabilities.push({
              type: 'authentication',
              severity: 'low',
              title: 'Password Field Allows Autocomplete',
              description: 'Password field allows browser autocomplete',
              location: 'Password input field',
              evidence: { autocomplete: 'enabled' },
              impact: 'Passwords may be stored in browser autocomplete',
              remediation: ['Set autocomplete="off" on password fields'],
              cwe: 'CWE-522',
              owasp: 'A07:2021 – Identification and Authentication Failures',
            });
          }
        }
      }

    } catch (error) {
      console.error('Authentication security analysis failed:', error);
    }

    return vulnerabilities;
  }

  /**
   * Check HTTPS and TLS security
   */
  async checkHTTPSSecurity(): Promise<SecurityVulnerability[]> {
    console.log('🔍 Checking HTTPS and TLS security...');
    
    const vulnerabilities: SecurityVulnerability[] = [];

    try {
      const url = this.page.url();
      
      if (!url.startsWith('https:')) {
        vulnerabilities.push({
          type: 'transport-security',
          severity: 'high',
          title: 'Website Not Using HTTPS',
          description: 'Website is served over HTTP instead of HTTPS',
          location: url,
          evidence: { protocol: 'HTTP' },
          impact: 'All data transmitted between client and server can be intercepted',
          remediation: [
            'Implement SSL/TLS certificate',
            'Redirect all HTTP traffic to HTTPS',
            'Use HSTS headers',
          ],
          cwe: 'CWE-319',
          owasp: 'A02:2021 – Cryptographic Failures',
        });
      } else {
        // Check security headers
        const securityHeaders = await this.checkSecurityHeaders();
        vulnerabilities.push(...securityHeaders);
      }

    } catch (error) {
      console.error('HTTPS security check failed:', error);
    }

    return vulnerabilities;
  }

  /**
   * Test input validation mechanisms
   */
  async testInputValidation(): Promise<SecurityVulnerability[]> {
    console.log('🔍 Testing input validation...');
    
    const vulnerabilities: SecurityVulnerability[] = [];

    try {
      const inputs = await this.page.$$('input, textarea');
      
      // Malicious inputs to test
      const maliciousInputs = [
        { payload: 'A'.repeat(10000), name: 'Buffer Overflow Test' },
        { payload: '../../../etc/passwd', name: 'Path Traversal Test' },
        { payload: 'null\x00byte', name: 'Null Byte Injection' },
        { payload: '<script>alert(1)</script>', name: 'Script Injection' },
        { payload: '${7*7}', name: 'Expression Injection' },
      ];

      for (const input of inputs) {
        const inputType = await input.evaluate(el => (el as HTMLInputElement).type);
        
        for (const { payload, name } of maliciousInputs) {
          try {
            await input.click();
            await input.evaluate(el => (el as HTMLInputElement).value = '');
            await input.type(payload);
            
            // Check if malicious input was accepted
            const currentValue = await input.evaluate(el => (el as HTMLInputElement).value);
            
            if (currentValue === payload) {
              vulnerabilities.push({
                type: 'input-validation',
                severity: 'medium',
                title: `Insufficient Input Validation - ${name}`,
                description: `Input field accepts potentially malicious data: ${name}`,
                location: `Input type: ${inputType}`,
                evidence: { 
                  payload: payload,
                  accepted: true,
                  inputType: inputType 
                },
                impact: 'Application may be vulnerable to injection attacks',
                remediation: [
                  'Implement proper input validation',
                  'Use whitelist-based validation',
                  'Sanitize user inputs',
                  'Set maximum input lengths',
                ],
                cwe: 'CWE-20',
                owasp: 'A03:2021 – Injection',
              });
            }
          } catch (error) {
            console.warn('Input validation test failed:', error);
          }
        }
      }

    } catch (error) {
      console.error('Input validation testing failed:', error);
    }

    return vulnerabilities;
  }

  /**
   * Analyze Content Security Policy
   */
  async analyzeContentSecurityPolicy(): Promise<SecurityVulnerability[]> {
    console.log('🔍 Analyzing Content Security Policy...');
    
    const vulnerabilities: SecurityVulnerability[] = [];

    try {
      // Check for CSP header
      const cspHeader = await this.page.evaluate(() => {
        const meta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
        return meta ? (meta as HTMLMetaElement).content : null;
      });

      // Also check response headers (would need CDP for full header analysis)
      if (!cspHeader) {
        vulnerabilities.push({
          type: 'csp',
          severity: 'medium',
          title: 'Missing Content Security Policy',
          description: 'No Content Security Policy header detected',
          location: 'HTTP Headers',
          evidence: { csp: null },
          impact: 'Application vulnerable to XSS and data injection attacks',
          remediation: [
            'Implement Content Security Policy headers',
            'Use nonce or hash-based CSP for inline scripts',
            'Avoid unsafe-inline and unsafe-eval directives',
          ],
          cwe: 'CWE-79',
          owasp: 'A05:2021 – Security Misconfiguration',
        });
      } else {
        // Analyze CSP for weaknesses
        const cspWeaknesses = this.analyzeSCPWeaknesses(cspHeader);
        vulnerabilities.push(...cspWeaknesses);
      }

    } catch (error) {
      console.error('CSP analysis failed:', error);
    }

    return vulnerabilities;
  }

  /**
   * Detect clickjacking vulnerabilities
   */
  async detectClickjackingVulnerabilities(): Promise<SecurityVulnerability[]> {
    console.log('🔍 Testing for clickjacking vulnerabilities...');
    
    const vulnerabilities: SecurityVulnerability[] = [];

    try {
      // Check X-Frame-Options header
      const hasFrameProtection = await this.page.evaluate(() => {
        // Check for X-Frame-Options meta tag (less common)
        const meta = document.querySelector('meta[http-equiv="X-Frame-Options"]');
        return Boolean(meta);
      });

      if (!hasFrameProtection) {
        vulnerabilities.push({
          type: 'clickjacking',
          severity: 'medium',
          title: 'Missing Clickjacking Protection',
          description: 'No X-Frame-Options or CSP frame-ancestors directive detected',
          location: 'HTTP Headers',
          evidence: { frameOptions: null },
          impact: 'Page can be embedded in malicious frames for clickjacking attacks',
          remediation: [
            'Implement X-Frame-Options: DENY or SAMEORIGIN',
            'Use CSP frame-ancestors directive',
            'Implement JavaScript frame-busting code',
          ],
          cwe: 'CWE-1021',
          owasp: 'A05:2021 – Security Misconfiguration',
        });
      }

    } catch (error) {
      console.error('Clickjacking detection failed:', error);
    }

    return vulnerabilities;
  }

  /**
   * Helper Methods
   */

  private async checkXSSExecutability(payload: string): Promise<boolean> {
    try {
      // Set up alert detection
      let alertTriggered = false;
      
      this.page.on('dialog', async dialog => {
        alertTriggered = true;
        await dialog.accept();
      });

      // Wait briefly to see if alert is triggered
      await this.page.waitForTimeout(1000);
      
      return alertTriggered;
    } catch (error) {
      return false;
    }
  }

  private async testURLBasedXSS(): Promise<SecurityVulnerability[]> {
    const vulnerabilities: SecurityVulnerability[] = [];
    
    try {
      const baseURL = this.page.url();
      const xssPayloads = [
        '<script>alert("XSS")</script>',
        'javascript:alert("XSS")',
      ];

      for (const payload of xssPayloads) {
        const testURL = `${baseURL}?test=${encodeURIComponent(payload)}`;
        
        try {
          await this.page.goto(testURL);
          
          const pageContent = await this.page.content();
          if (pageContent.includes(payload)) {
            vulnerabilities.push({
              type: 'xss',
              severity: 'high',
              title: 'URL-based XSS Vulnerability',
              description: 'URL parameters are reflected without proper encoding',
              location: 'URL parameters',
              evidence: { payload: payload, url: testURL },
              impact: 'Attacker can craft malicious URLs to execute scripts',
              remediation: [
                'Encode URL parameters before outputting',
                'Validate and sanitize URL parameters',
                'Use Content Security Policy',
              ],
              cwe: 'CWE-79',
              owasp: 'A03:2021 – Injection',
            });
          }
        } catch (error) {
          console.warn('URL XSS test failed:', error);
        }
      }
    } catch (error) {
      console.error('URL-based XSS testing failed:', error);
    }

    return vulnerabilities;
  }

  private detectSQLErrors(content: string): string[] {
    const sqlErrorPatterns = [
      /mysql_fetch_array\(\)/gi,
      /ORA-\d{5}/gi,
      /Microsoft.*ODBC.*SQL Server/gi,
      /PostgreSQL.*ERROR/gi,
      /Warning.*mysql_/gi,
      /valid MySQL result/gi,
      /MySQLSyntaxErrorException/gi,
      /sqlite3\.OperationalError/gi,
    ];

    const errors: string[] = [];
    sqlErrorPatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        errors.push(...matches);
      }
    });

    return errors;
  }

  private async checkSecurityHeaders(): Promise<SecurityVulnerability[]> {
    const vulnerabilities: SecurityVulnerability[] = [];
    
    // This would typically use CDP to get actual response headers
    // For now, we'll check for meta tags and common indicators
    
    const securityChecks = [
      {
        name: 'Strict-Transport-Security',
        check: () => this.page.evaluate(() => Boolean(document.querySelector('meta[http-equiv="Strict-Transport-Security"]'))),
        severity: 'medium' as SecuritySeverity,
        title: 'Missing HSTS Header',
        description: 'HTTP Strict Transport Security header not detected',
      },
      {
        name: 'X-Content-Type-Options',
        check: () => this.page.evaluate(() => Boolean(document.querySelector('meta[http-equiv="X-Content-Type-Options"]'))),
        severity: 'low' as SecuritySeverity,
        title: 'Missing X-Content-Type-Options Header',
        description: 'X-Content-Type-Options header not detected',
      },
    ];

    for (const secCheck of securityChecks) {
      try {
        const hasHeader = await secCheck.check();
        if (!hasHeader) {
          vulnerabilities.push({
            type: 'security-headers',
            severity: secCheck.severity,
            title: secCheck.title,
            description: secCheck.description,
            location: 'HTTP Headers',
            evidence: { header: secCheck.name, present: false },
            impact: 'Reduced security posture',
            remediation: [`Implement ${secCheck.name} header`],
            cwe: 'CWE-693',
            owasp: 'A05:2021 – Security Misconfiguration',
          });
        }
      } catch (error) {
        console.warn(`Security header check failed for ${secCheck.name}:`, error);
      }
    }

    return vulnerabilities;
  }

  private analyzeSCPWeaknesses(csp: string): SecurityVulnerability[] {
    const vulnerabilities: SecurityVulnerability[] = [];

    if (csp.includes("'unsafe-inline'")) {
      vulnerabilities.push({
        type: 'csp',
        severity: 'medium',
        title: 'Weak CSP - unsafe-inline',
        description: 'Content Security Policy allows unsafe inline scripts',
        location: 'CSP Header',
        evidence: { csp: csp },
        impact: 'Inline scripts can be executed, reducing XSS protection',
        remediation: ['Use nonce or hash-based CSP', 'Remove unsafe-inline directive'],
        cwe: 'CWE-79',
        owasp: 'A05:2021 – Security Misconfiguration',
      });
    }

    if (csp.includes("'unsafe-eval'")) {
      vulnerabilities.push({
        type: 'csp',
        severity: 'medium',
        title: 'Weak CSP - unsafe-eval',
        description: 'Content Security Policy allows eval() functions',
        location: 'CSP Header',
        evidence: { csp: csp },
        impact: 'Dynamic code execution possible, reduces security',
        remediation: ['Remove unsafe-eval directive', 'Avoid eval() functions'],
        cwe: 'CWE-95',
        owasp: 'A05:2021 – Security Misconfiguration',
      });
    }

    return vulnerabilities;
  }

  private calculateSecurityScore(vulnerabilities: SecurityVulnerability[]): number {
    let score = 100;

    vulnerabilities.forEach(vuln => {
      switch (vuln.severity) {
        case 'critical': score -= 25; break;
        case 'high': score -= 15; break;
        case 'medium': score -= 8; break;
        case 'low': score -= 3; break;
      }
    });

    return Math.max(0, score);
  }

  private assessSecurityRisk(vulnerabilities: SecurityVulnerability[]): { level: SecurityRiskLevel } {
    const criticalCount = vulnerabilities.filter(v => v.severity === 'critical').length;
    const highCount = vulnerabilities.filter(v => v.severity === 'high').length;

    if (criticalCount > 0) return { level: 'critical' };
    if (highCount > 2) return { level: 'high' };
    if (highCount > 0 || vulnerabilities.length > 5) return { level: 'medium' };
    return { level: 'low' };
  }

  private generateSecurityRecommendations(vulnerabilities: SecurityVulnerability[]): string[] {
    const recommendations = new Set<string>();

    vulnerabilities.forEach(vuln => {
      vuln.remediation.forEach(rec => recommendations.add(rec));
    });

    return Array.from(recommendations).slice(0, 10); // Top 10 recommendations
  }

  private async checkComplianceStandards(vulnerabilities: SecurityVulnerability[]): Promise<ComplianceStatus> {
    return {
      owasp: this.checkOWASPCompliance(vulnerabilities),
      pci: this.checkPCICompliance(vulnerabilities),
      gdpr: this.checkGDPRCompliance(vulnerabilities),
    };
  }

  private checkOWASPCompliance(vulnerabilities: SecurityVulnerability[]): ComplianceResult {
    const owaspIssues = vulnerabilities.filter(v => v.owasp);
    return {
      compliant: owaspIssues.length === 0,
      issues: owaspIssues.length,
      recommendations: ['Address OWASP Top 10 vulnerabilities'],
    };
  }

  private checkPCICompliance(vulnerabilities: SecurityVulnerability[]): ComplianceResult {
    const pciRelated = vulnerabilities.filter(v => 
      v.type === 'transport-security' || v.type === 'authentication' || v.type === 'sensitive-data-leak'
    );
    return {
      compliant: pciRelated.length === 0,
      issues: pciRelated.length,
      recommendations: ['Encrypt cardholder data', 'Use secure transmission protocols'],
    };
  }

  private checkGDPRCompliance(vulnerabilities: SecurityVulnerability[]): ComplianceResult {
    const gdprRelated = vulnerabilities.filter(v => v.type === 'sensitive-data-leak');
    return {
      compliant: gdprRelated.length === 0,
      issues: gdprRelated.length,
      recommendations: ['Protect personal data', 'Implement data minimization'],
    };
  }

  private createRemediationPlan(vulnerabilities: SecurityVulnerability[]): RemediationPlan {
    const critical = vulnerabilities.filter(v => v.severity === 'critical');
    const high = vulnerabilities.filter(v => v.severity === 'high');
    const medium = vulnerabilities.filter(v => v.severity === 'medium');

    return {
      immediate: critical.map(v => ({ issue: v.title, action: v.remediation[0] })),
      shortTerm: high.map(v => ({ issue: v.title, action: v.remediation[0] })),
      longTerm: medium.map(v => ({ issue: v.title, action: v.remediation[0] })),
      estimatedEffort: this.calculateEffort(vulnerabilities),
    };
  }

  private calculateEffort(vulnerabilities: SecurityVulnerability[]): string {
    const total = vulnerabilities.length;
    if (total > 10) return 'High effort required (>40 hours)';
    if (total > 5) return 'Medium effort required (20-40 hours)';
    return 'Low effort required (<20 hours)';
  }
}

/**
 * Security Scanner Helper Class
 */
class SecurityScanner {
  constructor(private page: Page) {}

  async scanForCommonVulnerabilities(): Promise<SecurityVulnerability[]> {
    // Additional scanning methods would be implemented here
    return [];
  }
}

// Interfaces and Types
export interface SecurityReport {
  securityScore: number;
  riskLevel: SecurityRiskLevel;
  vulnerabilities: SecurityVulnerability[];
  criticalIssues: SecurityVulnerability[];
  recommendations: string[];
  complianceStatus: ComplianceStatus;
  remediationPlan: RemediationPlan;
}

export interface SecurityVulnerability {
  type: SecurityVulnerabilityType;
  severity: SecuritySeverity;
  title: string;
  description: string;
  location: string;
  evidence: any;
  impact: string;
  remediation: string[];
  cwe?: string;
  owasp?: string;
}

export interface ComplianceStatus {
  owasp: ComplianceResult;
  pci: ComplianceResult;
  gdpr: ComplianceResult;
}

export interface ComplianceResult {
  compliant: boolean;
  issues: number;
  recommendations: string[];
}

export interface RemediationPlan {
  immediate: Array<{ issue: string; action: string }>;
  shortTerm: Array<{ issue: string; action: string }>;
  longTerm: Array<{ issue: string; action: string }>;
  estimatedEffort: string;
}

export type SecurityVulnerabilityType = 
  | 'xss' 
  | 'sql-injection' 
  | 'csrf' 
  | 'authentication' 
  | 'transport-security'
  | 'cookie-security'
  | 'sensitive-data-leak'
  | 'input-validation'
  | 'csp'
  | 'clickjacking'
  | 'security-headers'
  | 'information-disclosure';

export type SecuritySeverity = 'critical' | 'high' | 'medium' | 'low';
export type SecurityRiskLevel = 'critical' | 'high' | 'medium' | 'low';

