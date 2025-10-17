import { Request, Response } from 'express';
import { TestRunner } from '../services/testRunner';
import { TestGenerator } from '../services/testGenerator';
import { TestFileParser } from '../services/testFileParser';
import { DevToolsAnalyzer } from '../services/devToolsAnalyzer';

export async function runTests(req: Request, res: Response) {
  try {
    const { url, username, password } = req.body;
    const testFile = req.file;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    // Validate URL format
    try {
      new URL(url);
    } catch (error) {
      return res.status(400).json({ error: 'Invalid URL format' });
    }

    console.log(`📝 Starting test run for: ${url}`);

    // Initialize test runner
    const testRunner = new TestRunner();

    // Launch browser and navigate to URL
    await testRunner.initialize();
    
    // Initialize DevTools Analyzer for enhanced monitoring
    const devToolsAnalyzer = new DevToolsAnalyzer(testRunner.getPage());
    await devToolsAnalyzer.startMonitoring();
    
    await testRunner.navigateToPage(url);

    // Handle authentication if credentials provided
    if (username && password) {
      console.log('🔐 Attempting login...');
      await testRunner.login(username, password);
    }

    // Generate or load test cases
    let testCases;
    let testSource = 'auto-generated';
    
    if (testFile) {
      console.log('📂 Loading custom test cases...');
      const parser = new TestFileParser();
      const parsed = await parser.parseTestFile(testFile.buffer, testFile.originalname);
      
      // Validate parsed tests
      const validation = parser.validateTests(parsed.tests);
      if (!validation.valid) {
        return res.status(400).json({
          error: 'Invalid test file',
          details: validation.errors,
        });
      }
      
      testCases = parsed.tests;
      testSource = `uploaded-${parsed.format}`;
      console.log(`✅ Loaded ${testCases.length} tests from ${parsed.format} file`);
    } else {
      console.log('🤖 Auto-generating test cases...');
      const testGenerator = new TestGenerator(testRunner.getPage());
      testCases = await testGenerator.generateTests();
      testSource = 'auto-generated';
    }

    // Execute tests
    console.log(`🧪 Executing ${testCases.length} test cases...`);
    const results = await testRunner.executeTests(testCases);

    // Collect performance metrics
    const performance = await testRunner.getPerformanceMetrics();
    
    // Get DevTools comprehensive report
    console.log('📊 Generating DevTools analysis report...');
    const devToolsReport = await devToolsAnalyzer.getReport();

    // Cleanup
    await testRunner.close();

    console.log('✅ Test run completed');

    // Send results
    res.json({
      success: results.every((r) => r.status === 'passed'),
      testsPassed: results.filter((r) => r.status === 'passed').length,
      testsFailed: results.filter((r) => r.status === 'failed').length,
      totalTests: results.length,
      testSource,
      details: results,
      performance,
      devTools: devToolsReport, // Enhanced DevTools analysis
      errors: results
        .filter((r) => r.status === 'failed' && r.message)
        .map((r) => r.message!),
    });
  } catch (error) {
    console.error('❌ Error running tests:', error);
    res.status(500).json({
      error: 'Failed to run tests',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

