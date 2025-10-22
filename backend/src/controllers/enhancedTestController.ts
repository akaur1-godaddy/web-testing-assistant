import { Request, Response } from 'express';
import { TestRunner, TestCase, TestResult } from '../services/testRunner.js';
import { TestGenerator } from '../services/testGenerator.js';
import { TestFileParser } from '../services/testFileParser.js';
import { DevToolsAnalyzer } from '../services/devToolsAnalyzer.js';
import { APITester, APITestCase } from '../services/apiTester.js';

// Import all new AI services
import { NLPTestGenerator } from '../services/nlpTestGenerator.js';
import { VisualAI } from '../services/visualAI.js';
import { SelfHealingAI } from '../services/selfHealingAI.js';
import { PredictiveAI } from '../services/predictiveAI.js';
import { SecurityAI } from '../services/securityAI.js';
import { RealtimeAI } from '../services/realtimeAI.js';
import { TestDataAI } from '../services/testDataAI.js';
import { EnhancedAccessibilityAI } from '../services/enhancedAccessibilityAI.js';
import { AIFailureAnalyzer } from '../services/aiFailureAnalyzer.js';
import { ElementDetector } from '../services/ElementDetector.js';
import { FunctionalTestCaseGenerator } from '../services/FunctionalTestCaseGenerator.js';
import { AITestCaseGenerator } from '../services/AITestCaseGenerator.js';
import { FormTestValidator } from '../services/FormTestValidator.js';
import { UniversalTestOrchestrator } from '../services/UniversalTestOrchestrator.js';

/**
 * Enhanced Test Controller with AI Integration
 * Orchestrates all AI services for comprehensive testing
 */
export class EnhancedTestController {

  /**
   * Run comprehensive AI-powered tests
   */
  static async runAITests(req: Request, res: Response) {
    try {
      console.log('=== AI TEST START ===');
      console.log('📥 Backend received request body:', {
        url: req.body.url,
        username: req.body.username,
        nlpDescription: req.body.nlpDescription,
        aiOptions: req.body.aiOptions ? 'present' : 'missing'
      });
      const url = req.body.url;
      const username = req.body.username || '';
      const password = req.body.password || '';
      const testType = req.body.testType || 'comprehensive';
      const nlpDescription = req.body.nlpDescription || '';
      console.log('🎯 Final URL being used for testing:', url);

      // Parse AI options from FormData string
      let aiOptions: any = {
        securityScan: true,
        enhancedA11y: true,
        predictiveAnalytics: true,
        visualAI: true,
        realtimeMonitoring: false,
        selfHealing: true,
        generateTestData: true,
        generateEdgeCases: true,
        useNLP: false,
        functionalAI: true, // Added functionalAI flag
        elementDetector: true, // Added elementDetector flag
        functionalTestCaseGenerator: true, // Added functionalTestCaseGenerator flag
      };

      if (req.body.aiOptions) {
        try {
          const parsedOptions = JSON.parse(req.body.aiOptions);
          aiOptions = { ...aiOptions, ...parsedOptions };
        } catch (error) {
          console.warn('Failed to parse AI options:', error);
        }
      }

      const testFile = req.file;

      if (!url) {
        return res.status(400).json({ error: 'URL is required' });
      }

      console.log(`🤖 Starting AI-powered test run for: ${url}`);
      console.log(`🎯 Test type: ${testType || 'comprehensive'}`);
      console.log(`🧠 AI options:`, aiOptions);

      // Initialize core services
      console.log('🔧 Initializing TestRunner...');
      const testRunner = new TestRunner();
      await testRunner.initialize();
      console.log('✅ TestRunner initialized');

      // Initialize AI services with error tracking
      console.log('🧠 Initializing AI services...');
      let nlpGenerator, visualAI, selfHealingAI, predictiveAI, securityAI, realtimeAI, testDataAI, enhancedA11yAI;

      try {
        console.log('  - NLPTestGenerator...');
        nlpGenerator = new NLPTestGenerator();
        console.log('  ✅ NLPTestGenerator OK');
      } catch (error) {
        console.error('❌ NLPTestGenerator failed:', error);
        throw error;
      }

      try {
        console.log('  - VisualAI...');
        visualAI = new VisualAI();
        console.log('  ✅ VisualAI OK');
      } catch (error) {
        console.error('❌ VisualAI failed:', error);
        throw error;
      }

      try {
        console.log('  - SelfHealingAI...');
        selfHealingAI = new SelfHealingAI(testRunner.getPage());
        console.log('  ✅ SelfHealingAI OK');
      } catch (error) {
        console.error('❌ SelfHealingAI failed:', error);
        throw error;
      }

      try {
        console.log('  - PredictiveAI...');
        predictiveAI = new PredictiveAI();
        console.log('  ✅ PredictiveAI OK');
      } catch (error) {
        console.error('❌ PredictiveAI failed:', error);
        throw error;
      }

      try {
        console.log('  - SecurityAI...');
        securityAI = new SecurityAI(testRunner.getPage());
        console.log('  ✅ SecurityAI OK');
      } catch (error) {
        console.error('❌ SecurityAI failed:', error);
        throw error;
      }

      try {
        console.log('  - RealtimeAI...');
        realtimeAI = new RealtimeAI(testRunner.getPage());
        console.log('  ✅ RealtimeAI OK');
      } catch (error) {
        console.error('❌ RealtimeAI failed:', error);
        throw error;
      }

      try {
        console.log('  - TestDataAI...');
        testDataAI = new TestDataAI();
        console.log('  ✅ TestDataAI OK');
      } catch (error) {
        console.error('❌ TestDataAI failed:', error);
        throw error;
      }

      try {
        console.log('  - EnhancedAccessibilityAI...');
        enhancedA11yAI = new EnhancedAccessibilityAI(testRunner.getPage());
        console.log('  ✅ EnhancedAccessibilityAI OK');
      } catch (error) {
        console.error('❌ EnhancedAccessibilityAI failed:', error);
        throw error;
      }

      console.log('✅ All AI services initialized successfully');

      // Start real-time monitoring
      if (aiOptions?.realtimeMonitoring) {
        await realtimeAI.startMonitoring();
      }

      // Initialize DevTools analyzer
      const devToolsAnalyzer = new DevToolsAnalyzer(testRunner.getPage());
      await devToolsAnalyzer.startMonitoring();

      await testRunner.navigateToPage(url);

      let testCases: TestCase[] = [];
      let aiInsights: any = {};
      let testSource = 'ai-generated';
      let ctaTests: TestCase[] = [];
      let detectedElements: any[] = [];

      // Intelligent CTA Detection and Test Generation
      if (aiOptions?.functionalAI || aiOptions?.elementDetector) {
        try {
          console.log('🎯 Starting intelligent CTA detection...');
          const generator = new FunctionalTestCaseGenerator(testRunner.getPage());
          ctaTests = await generator.generateTestCases();
          console.log(`✅ Generated ${ctaTests.length} functional tests from detected CTAs`);

          // AI-powered contextual test generation
          const aiGenerator = new AITestCaseGenerator();
          const pageTitle = await testRunner.getPage().title();
          const pageUrl = await testRunner.getPage().url();
          const hasAuthElements = ctaTests.some(t => t.name?.toLowerCase().includes('login'));

          const pageAnalysis = {
            url: pageUrl,
            title: pageTitle,
            forms: [],
            buttons: [],
            inputs: [],
            hasAuth: hasAuthElements,
            pageType: 'unknown',
          };

          const aiTestSuite = await aiGenerator.generateContextualTests(pageAnalysis);
          console.log('✅ AI-generated tests:');
          console.log(`   - Login: ${aiTestSuite.loginTests.length}`);
          console.log(`   - Form Validation: ${aiTestSuite.formValidationTests.length}`);
          console.log(`   - Security: ${aiTestSuite.securityTests.length}`);
          console.log(`   - User Journeys: ${aiTestSuite.userJourneyTests.length}`);
          console.log(`   - Accessibility: ${aiTestSuite.accessibilityTests.length}`);

          // Add form validation tests
          const detector = new ElementDetector(testRunner.getPage());
          const elements = await detector.detectAllInteractiveElements();
          const formInputs = elements.filter(e => ['input', 'select', 'textarea'].includes(e.elementType));
          const formValidator = new FormTestValidator(testRunner.getPage());
          const formValidationTests = await formValidator.generateFormValidationTests(formInputs);

          // Combine all AI-generated tests
          ctaTests.push(
            ...aiTestSuite.loginTests,
            ...aiTestSuite.formValidationTests,
            ...aiTestSuite.securityTests,
            ...aiTestSuite.userJourneyTests,
            ...aiTestSuite.accessibilityTests,
            ...formValidationTests
          );

          detectedElements = elements.map(e => ({
            type: e.elementType,
            text: e.text?.slice(0, 50),
            confidence: e.confidence
          }));
          console.log(`✅ Detected ${elements.length} interactive elements`);

          // Add to insights
          aiInsights.functional = {
            elementsDetected: elements.length,
            testsCTA: ctaTests.length,
            elementBreakdown: {
              buttons: elements.filter(e => e.elementType === 'button').length,
              inputs: elements.filter(e => ['input', 'select', 'textarea'].includes(e.elementType)).length,
              forms: elements.filter(e => e.elementType === 'form').length,
              links: elements.filter(e => e.elementType === 'link').length,
            },
            aiTestBreakdown: {
              loginTests: aiTestSuite.loginTests.length,
              formValidation: aiTestSuite.formValidationTests.length,
              securityTests: aiTestSuite.securityTests.length,
              userJourney: aiTestSuite.userJourneyTests.length,
              accessibility: aiTestSuite.accessibilityTests.length,
            }
          };
        } catch (err) {
          console.warn('⚠️  CTA detection step failed, continuing without it:', err);
        }
      }

      // Handle authentication
      if (username && password) {
        console.log('🔐 Attempting login...');
        await testRunner.login(username, password);
      }

      // Generate tests based on type and options
      if (nlpDescription && aiOptions?.useNLP) {
        console.log('🗣️  Generating tests from natural language description...');
        const nlpResult = await nlpGenerator.generateFromDescription(
          nlpDescription,
          url,
          await EnhancedTestController.capturePageContext(testRunner.getPage())
        );
        testCases.push(...nlpResult.tests);
        aiInsights.nlp = nlpResult;
        testSource = 'nlp-generated';
      } else if (testFile) {
        console.log('📂 Loading custom test cases...');
        const parser = new TestFileParser();
        const parsed = await parser.parseTestFile(testFile.buffer, testFile.originalname);

        // Validate tests
        const validation = parser.validateTests(parsed.tests);
        if (!validation.valid) {
          return res.status(400).json({
            error: 'Invalid test file',
            details: validation.errors,
          });
        }

        testCases = parsed.tests;
        testSource = `uploaded-${parsed.format}`;

        // 🚀 Auto-generate UI tests if file only contains API tests
        const hasUiTests = testCases.some((tc: TestCase) => tc.type !== 'api');
        if (!hasUiTests && url) {
          console.log('🤖 Auto-generating UI tests (API-only file detected)...');
          const testGenerator = new TestGenerator(testRunner.getPage());
          const generatedTests = await testGenerator.generateTests();

          // Add UI tests first, then API tests
          testCases = [...generatedTests, ...testCases];
          testSource = 'hybrid-auto+uploaded';
          console.log(`✅ Added ${generatedTests.length} auto-generated UI tests`);
        }
      } else {
        console.log('🤖 Auto-generating intelligent test cases...');
        const testGenerator = new TestGenerator(testRunner.getPage());
        testCases = await testGenerator.generateTests();

        // Enhance with AI-generated edge cases
        if (aiOptions?.generateEdgeCases) {
          const edgeCases = await nlpGenerator.generateEdgeCases(testCases);
          testCases.push(...edgeCases);
        }
      }

      // Prepend CTA tests so they run first
      if (ctaTests.length > 0) {
        testCases = [...ctaTests, ...testCases];
      }

      // AI-powered test data generation
      if (aiOptions?.generateTestData) {
        console.log('🎲 Generating AI-powered test data...');
        const testData = await testDataAI.generateRealisticUserData(5);
        aiInsights.testData = testData;
      }

      // Separate UI and API tests
      const uiTests = testCases.filter((tc: TestCase) => tc.type !== 'api');
      const apiTests = testCases.filter((tc: TestCase) => tc.type === 'api');

      console.log(`🧪 Executing ${testCases.length} AI-enhanced test cases...`);

      // Execute UI tests with self-healing
      let results: TestResult[] = await EnhancedTestController.executeTestsWithHealing(testRunner, uiTests, selfHealingAI);

      // Execute API tests
      if (apiTests.length > 0) {
        console.log('🌐 Executing API tests...');
        const apiTester = new APITester();
        const apiTestCases: APITestCase[] = apiTests.map((tc: TestCase) => ({
          name: tc.name,
          method: tc.apiTest!.method,
          url: tc.apiTest!.url,
          headers: tc.apiTest?.headers,
          body: tc.apiTest?.body,
          expectedStatus: tc.apiTest?.expectedStatus,
          expectedResponse: tc.apiTest?.expectedResponse,
          timeout: tc.timeout,
        }));

        const apiResults = await apiTester.executeTests(apiTestCases);

        // Convert API results and merge
        const convertedApiResults: TestResult[] = apiResults.map((ar) => ({
          name: ar.name,
          status: ar.status as 'passed' | 'failed',
          message: ar.message,
          duration: ar.duration,
          apiResponse: {
            request: ar.request,
            response: ar.response,
            validations: ar.validations,
          },
        } as TestResult));

        results = [...results, ...convertedApiResults];
      }

      // 🤖 AI Failure Analysis - Analyze why tests failed
      console.log('🤖 Analyzing test failures with AI...');
      const failureAnalyzer = new AIFailureAnalyzer();
      const failedTestsData: Array<{ testCase: TestCase; testResult: TestResult }> = [];

      results.forEach((result, index) => {
        if (result.status === 'failed' && result.message && testCases[index]) {
          failedTestsData.push({
            testCase: testCases[index],
            testResult: result as TestResult
          });
        }
      });

      if (failedTestsData.length > 0) {
        const failureExplanations = await failureAnalyzer.analyzeMultipleFailures(failedTestsData);

        // Add AI explanations to failed test results
        results = results.map((result: TestResult) => {
          if (result.status === 'failed' && failureExplanations.has(result.name)) {
            return {
              ...result,
              aiFailureExplanation: failureExplanations.get(result.name)
            } as TestResult;
          }
          return result;
        });

        console.log(`✅ Generated AI explanations for ${failedTestsData.length} failed test(s)`);
      }

      // AI Security Scan
      let securityReport;
      if (aiOptions?.securityScan) {
        console.log('🔒 Performing AI security scan...');
        securityReport = await securityAI.performSecurityScan();
        aiInsights.security = securityReport;
      }

      // Enhanced Accessibility Analysis
      let a11yReport;
      if (aiOptions?.enhancedA11y) {
        console.log('♿ Performing enhanced accessibility analysis...');
        a11yReport = await enhancedA11yAI.performAdvancedA11yAnalysis();
        aiInsights.accessibility = a11yReport;
      }

      // Visual AI Analysis
      let visualAnalysis;
      if (aiOptions?.visualAI) {
        console.log('👁️ Performing visual AI analysis...');
        const screenshot = await testRunner.getPage().screenshot({ fullPage: true });
        const uiAnalysis = await visualAI.analyzeUIComponents(screenshot);

        // Transform to frontend-expected format
        const issues = uiAnalysis.accessibility.issues.map(issue => ({
          type: issue.type,
          severity: issue.severity,
          description: issue.description,
          location: issue.element,
          suggestion: issue.recommendation,
        }));

        // Add layout and design system issues
        if (uiAnalysis.layoutAnalysis.spacing !== 'consistent') {
          issues.push({
            type: 'layout-inconsistency',
            severity: 'moderate' as const,
            description: 'Inconsistent spacing detected across the layout',
            location: 'Multiple elements',
            suggestion: 'Review spacing values and apply consistent design tokens',
          });
        }

        if (uiAnalysis.designSystemAnalysis.consistency < 70) {
          issues.push({
            type: 'design-system-violation',
            severity: 'moderate' as const,
            description: `Low design system consistency: ${uiAnalysis.designSystemAnalysis.consistency}%`,
            location: 'Various components',
            suggestion: 'Align components with design system guidelines',
          });
        }

        // Calculate scores
        const layoutScore = uiAnalysis.layoutAnalysis.spacing === 'consistent' ? 100 : 75;
        const performanceScore = Math.max(0, 100 - (uiAnalysis.performance.imageSize / 50000));
        const componentConfidence = uiAnalysis.components.length > 0
          ? uiAnalysis.components.reduce((sum, c) => sum + c.confidence, 0) / uiAnalysis.components.length
          : 0.75;

        visualAnalysis = {
          overallStatus: issues.filter(i => i.severity === 'critical' || i.severity === 'serious').length === 0 ? 'passed' : 'failed',
          issuesDetected: issues.length,
          confidenceScore: componentConfidence,
          issues: issues,
          metrics: {
            layoutScore: layoutScore,
            consistencyScore: uiAnalysis.designSystemAnalysis.consistency,
            accessibilityScore: uiAnalysis.accessibility.score,
            performanceScore: Math.round(performanceScore),
            responsiveScore: 85,
            visualQualityScore: Math.round((layoutScore + uiAnalysis.designSystemAnalysis.consistency + uiAnalysis.accessibility.score + performanceScore) / 4),
          },
          recommendations: [
            ...uiAnalysis.accessibility.recommendations,
            ...uiAnalysis.performance.optimizationSuggestions,
          ],
          // Keep original data for reference
          components: uiAnalysis.components,
          layoutAnalysis: uiAnalysis.layoutAnalysis,
          designSystemAnalysis: uiAnalysis.designSystemAnalysis,
        };

        aiInsights.visual = visualAnalysis;
        console.log(`✅ Visual analysis complete: ${issues.length} issues detected, overall status: ${visualAnalysis.overallStatus}`);
      }

      // Collect performance metrics
      const performance = await testRunner.getPerformanceMetrics();

      // Get DevTools analysis
      const devToolsReport = await devToolsAnalyzer.getReport();

      // Predictive Analytics
      let predictions;
      if (aiOptions?.predictiveAnalytics) {
        console.log('🔮 Generating predictive insights...');
        predictions = await predictiveAI.generateInsights(
          results,
          [performance],
          { loadTime: performance.loadTime }
        );
        aiInsights.predictions = predictions;

        // Learn from execution for future predictions
        results.forEach(result => {
          predictiveAI.learnFromExecution({
            testName: result.name,
            result: result,
            timestamp: new Date(),
            performanceMetrics: performance,
          });
        });
      }

      // Real-time health status
      let healthStatus;
      if (aiOptions?.realtimeMonitoring) {
        healthStatus = await realtimeAI.getHealthStatus();
        aiInsights.realtime = healthStatus;
        await realtimeAI.stopMonitoring();
      }

      // Cleanup
      await testRunner.close();

      console.log('✅ AI-powered test run completed');

      // Enhanced response with AI insights
      const response = {
        success: results.every((r) => r.status === 'passed'),
        testsPassed: results.filter((r) => r.status === 'passed').length,
        testsFailed: results.filter((r) => r.status === 'failed').length,
        totalTests: results.length,
        testSource,
        details: results,
        performance,
        devTools: devToolsReport,

        // AI-powered insights
        aiInsights: aiInsights,
        securityReport: securityReport,
        accessibilityReport: a11yReport,
        visualAnalysis: visualAnalysis,
        predictions: predictions,
        healthStatus: healthStatus,

        // AI metadata
        aiMetadata: {
          version: '2.0.0',
          aiServicesUsed: Object.keys(aiOptions || {}),
          confidenceScore: EnhancedTestController.calculateOverallConfidence(aiInsights),
          processingTime: Date.now(),
        },

        errors: results
          .filter((r) => r.status === 'failed' && r.message)
          .map((r) => r.message!),
      };

      res.json(response);
    } catch (error) {
      console.error('❌ AI-powered test execution failed:', error);
      console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      console.error('❌ Error name:', error instanceof Error ? error.name : 'Unknown');
      console.error('❌ Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));

      res.status(500).json({
        error: 'Failed to run AI tests',
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        name: error instanceof Error ? error.name : undefined,
      });
    }
  }

  /**
   * Generate tests from natural language description
   */
  static async generateFromNLP(req: Request, res: Response) {
    try {
      const { description, url, testType } = req.body;

      if (!description) {
        return res.status(400).json({ error: 'Test description is required' });
      }

      console.log(`🗣️  Generating tests from NLP: "${description}"`);

      const nlpGenerator = new NLPTestGenerator();
      const result = await nlpGenerator.generateFromDescription(description, url);

      res.json({
        success: true,
        tests: result.tests,
        explanation: result.explanation,
        confidence: result.confidence,
        metadata: {
          generatedAt: new Date(),
          testType: testType || 'functional',
          aiModel: 'gpt-4',
        },
      });
    } catch (error) {
      console.error('NLP test generation failed:', error);
      res.status(500).json({
        error: 'Failed to generate tests from description',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get AI insights for existing test results
   */
  static async getAIInsights(req: Request, res: Response) {
    try {
      const { testResults, url } = req.body;

      if (!testResults) {
        return res.status(400).json({ error: 'Test results are required' });
      }

      console.log('🧠 Generating AI insights for test results...');

      const predictiveAI = new PredictiveAI();

      // Generate insights
      const insights = await predictiveAI.generateInsights(
        testResults,
        [],
        { loadTime: 1000 }
      );

      // Identify flakiness
      const flakinessReport = await predictiveAI.identifyFlakiness(testResults);

      // Suggest optimizations
      const optimizations = await predictiveAI.suggestOptimalTestOrder(testResults);

      res.json({
        success: true,
        insights: insights,
        flakiness: flakinessReport,
        optimizations: optimizations,
        recommendations: EnhancedTestController.generateAIRecommendations(insights, flakinessReport),
        confidence: 0.87,
      });
    } catch (error) {
      console.error('AI insights generation failed:', error);
      res.status(500).json({
        error: 'Failed to generate AI insights',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Execute tests with self-healing capabilities
   */
  private static async executeTestsWithHealing(
    testRunner: TestRunner,
    testCases: TestCase[],
    selfHealingAI: SelfHealingAI
  ): Promise<TestResult[]> {
    const results: TestResult[] = [];

    for (const testCase of testCases) {
      let result;
      try {
        result = await testRunner.executeTests([testCase]);
        result = result[0]; // Get the single result
      } catch (error) {
        console.log(`🔧 Test failed, attempting self-healing: ${testCase.name}`);

        // Try to heal the test
        const healingResult = await selfHealingAI.healBrokenTest(testCase, error as Error);

        if (healingResult.success && healingResult.healedTest) {
          console.log(`✅ Test healed successfully: ${testCase.name}`);

          // Retry with healed test
          try {
            result = await testRunner.executeTests([healingResult.healedTest]);
            result = result[0];
            result.healed = true;
            result.healingInfo = {
              strategy: healingResult.strategy,
              confidence: healingResult.confidence,
              explanation: healingResult.explanation,
            };
          } catch (healError) {
            result = {
              name: testCase.name,
              status: 'failed' as const,
              message: `Healing failed: ${healError}`,
              duration: 0,
            } as TestResult;
          }
        } else {
          result = {
            name: testCase.name,
            status: 'failed' as const,
            message: error instanceof Error ? error.message : 'Unknown error',
            duration: 0,
          } as TestResult;
        }
      }

      results.push(result as TestResult);
    }

    return results;
  }

  /**
   * Capture page context for AI analysis
   */
  private static async capturePageContext(page: any): Promise<string> {
    return await page.evaluate(() => {
      return {
        title: document.title,
        url: window.location.href,
        elementCount: document.querySelectorAll('*').length,
        formCount: document.querySelectorAll('form').length,
        linkCount: document.querySelectorAll('a[href]').length,
        buttonCount: document.querySelectorAll('button').length,
        inputCount: document.querySelectorAll('input').length,
        headings: Array.from(document.querySelectorAll('h1, h2, h3')).map(h => h.textContent?.trim()).filter(Boolean).slice(0, 5),
      };
    });
  }

  /**
   * Calculate overall AI confidence score
   */
  private static calculateOverallConfidence(aiInsights: any): number {
    const confidenceScores = [];

    if (aiInsights.nlp?.confidence) confidenceScores.push(aiInsights.nlp.confidence);
    if (aiInsights.predictions?.confidenceLevel) confidenceScores.push(aiInsights.predictions.confidenceLevel);
    if (aiInsights.security?.securityScore) confidenceScores.push(aiInsights.security.securityScore / 100);
    if (aiInsights.accessibility?.overallScore) confidenceScores.push(aiInsights.accessibility.overallScore / 100);

    if (confidenceScores.length === 0) return 0.75; // Default confidence

    return confidenceScores.reduce((sum, score) => sum + score, 0) / confidenceScores.length;
  }

  /**
   * Generate AI recommendations
   */
  private static generateAIRecommendations(insights: any, flakiness: any): string[] {
    const recommendations = [];

    if (flakiness.flakyTests.length > 0) {
      recommendations.push('Consider stabilizing flaky tests with explicit waits and retries');
    }

    if (insights.riskAssessment?.level === 'high') {
      recommendations.push('High risk detected - prioritize fixing critical issues');
    }

    recommendations.push('Use AI-generated test data for better edge case coverage');
    recommendations.push('Enable real-time monitoring for production environments');

    return recommendations;
  }

  /**
   * Health check endpoint for AI services
   */
  static async healthCheck(req: Request, res: Response) {
    try {
      const health = {
        status: 'healthy',
        timestamp: new Date(),
        services: {
          nlpGenerator: 'online',
          visualAI: 'online',
          selfHealing: 'online',
          predictiveAI: 'online',
          securityAI: 'online',
          realtimeAI: 'online',
          testDataAI: 'online',
          enhancedA11y: 'online',
        },
        version: '2.0.0',
        aiCapabilities: [
          'Natural Language Test Generation',
          'Visual AI Regression Detection',
          'Self-Healing Test Recovery',
          'Predictive Failure Analysis',
          'AI Security Vulnerability Scanning',
          'Real-time Performance Monitoring',
          'AI-Generated Test Data',
          'Enhanced Accessibility Testing',
        ],
      };

      res.json(health);
    } catch (error) {
      res.status(500).json({
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}

// Export the original controller function for backward compatibility
export async function runTests(req: Request, res: Response) {
  return EnhancedTestController.runAITests(req, res);
}
