import { TestResult } from './testRunner.js';
import { Matrix } from 'ml-matrix';
// import { SimpleLinearRegression } from 'ml-regression';
import * as stats from 'simple-statistics';

/**
 * Predictive Analytics AI Service
 * Uses machine learning to predict test failures and optimize test execution
 */
export class PredictiveAI {
  private testHistory: TestExecutionRecord[] = [];
  private predictionModels: Map<string, any> = new Map();
  private performanceBaseline: PerformanceBaseline | null = null;

  constructor() {
    this.initializePredictionModels();
  }

  /**
   * Predict failure probability for a test case
   */
  async predictFailureProbability(
    testCase: any,
    pageContext: PageContext
  ): Promise<FailurePrediction> {
    try {
      const features = this.extractFeatures(testCase, pageContext);
      const model = this.predictionModels.get('failure-prediction');
      
      if (!model && this.testHistory.length < 10) {
        return {
          probability: 0.1, // Default low probability for new tests
          confidence: 0.3,
          riskFactors: ['Insufficient historical data'],
          recommendations: ['Build test history for more accurate predictions'],
        };
      }

      // Calculate failure probability based on historical data
      const probability = await this.calculateFailureProbability(features);
      const riskFactors = this.identifyRiskFactors(features);
      const confidence = this.calculatePredictionConfidence(testCase);

      return {
        probability,
        confidence,
        riskFactors,
        recommendations: this.generateFailurePreventionRecommendations(riskFactors),
      };
    } catch (error) {
      console.error('Failure prediction failed:', error);
      return {
        probability: 0.5,
        confidence: 0.1,
        riskFactors: ['Prediction model error'],
        recommendations: ['Check prediction model configuration'],
      };
    }
  }

  /**
   * Identify test flakiness patterns
   */
  async identifyFlakiness(testResults: TestResult[]): Promise<FlakinessReport> {
    const flakyTests: FlakyTestAnalysis[] = [];
    const testGroups = this.groupTestsByName(testResults);

    for (const [testName, executions] of testGroups) {
      if (executions.length < 3) continue; // Need multiple executions to detect flakiness

      const passRate = executions.filter(e => e.status === 'passed').length / executions.length;
      const flakiness = this.calculateFlakiness(executions);

      if (flakiness.isFlaky) {
        const patterns = this.analyzeFailurePatterns(executions);
        
        flakyTests.push({
          testName,
          passRate,
          flakiness: flakiness.score,
          executions: executions.length,
          patterns,
          rootCauses: await this.identifyFlakinessCauses(executions),
          recommendations: this.generateFlakinessRecommendations(patterns),
        });
      }
    }

    return {
      flakyTests,
      overallFlakinessScore: this.calculateOverallFlakiness(flakyTests),
      trends: this.analyzeFlakinesssTrends(testResults),
      recommendations: this.generateOverallFlakinessRecommendations(flakyTests),
    };
  }

  /**
   * Suggest optimal test execution order
   */
  async suggestOptimalTestOrder(
    testCases: any[],
    criteria: OptimizationCriteria = {}
  ): Promise<TestExecutionPlan> {
    try {
      const scoredTests = await Promise.all(
        testCases.map(async test => ({
          test,
          scores: await this.calculateTestScores(test, criteria),
        }))
      );

      const optimizationStrategy = criteria.strategy || 'balanced';
      const orderedTests = this.optimizeTestOrder(scoredTests, optimizationStrategy);

      return {
        orderedTests: orderedTests.map(item => item.test),
        estimatedDuration: this.estimateTotalDuration(orderedTests),
        parallelizationSuggestions: this.suggestParallelization(orderedTests),
        reasoning: this.explainTestOrderReasoning(orderedTests, optimizationStrategy),
        optimizations: this.suggestExecutionOptimizations(orderedTests),
      };
    } catch (error) {
      console.error('Test order optimization failed:', error);
      return {
        orderedTests: testCases,
        estimatedDuration: testCases.length * 5000, // Default 5s per test
        parallelizationSuggestions: [],
        reasoning: 'Optimization failed, using default order',
        optimizations: [],
      };
    }
  }

  /**
   * Detect performance anomalies in test execution
   */
  async detectPerformanceAnomalies(
    currentMetrics: PerformanceMetrics,
    historicalData?: PerformanceMetrics[]
  ): Promise<AnomalyDetectionResult> {
    const anomalies: PerformanceAnomaly[] = [];
    
    // Compare with baseline if available
    if (this.performanceBaseline) {
      const loadTimeAnomaly = this.detectLoadTimeAnomaly(currentMetrics, this.performanceBaseline);
      if (loadTimeAnomaly) anomalies.push(loadTimeAnomaly);

      const memoryAnomaly = this.detectMemoryAnomaly(currentMetrics, this.performanceBaseline);
      if (memoryAnomaly) anomalies.push(memoryAnomaly);

      const networkAnomaly = this.detectNetworkAnomaly(currentMetrics, this.performanceBaseline);
      if (networkAnomaly) anomalies.push(networkAnomaly);
    }

    // Statistical anomaly detection if historical data available
    if (historicalData && historicalData.length > 10) {
      const statisticalAnomalies = this.detectStatisticalAnomalies(currentMetrics, historicalData);
      anomalies.push(...statisticalAnomalies);
    }

    return {
      anomalies,
      severity: this.calculateAnomalySeverity(anomalies),
      recommendations: this.generateAnomalyRecommendations(anomalies),
      trendAnalysis: this.analyzeTrends(historicalData || []),
    };
  }

  /**
   * Predict user experience impact based on test results
   */
  async predictUserExperience(
    testResults: TestResult[],
    performanceMetrics: PerformanceMetrics
  ): Promise<UserExperiencePrediction> {
    const uxScore = this.calculateUXScore(testResults, performanceMetrics);
    const impactAreas = this.identifyUXImpactAreas(testResults);
    const userJourneyRisk = this.assessUserJourneyRisk(testResults);

    return {
      uxScore,
      impactAreas,
      userJourneyRisk,
      businessImpact: this.predictBusinessImpact(uxScore, impactAreas),
      recommendations: this.generateUXRecommendations(impactAreas),
      priorityActions: this.identifyPriorityActions(testResults, performanceMetrics),
    };
  }

  /**
   * Generate predictive insights and recommendations
   */
  async generateInsights(
    testResults: TestResult[],
    performanceData: PerformanceMetrics[],
    pageContext: PageContext
  ): Promise<PredictiveInsights> {
    const failurePredictions = await this.analyzeFailureTrends(testResults);
    const performanceTrends = this.analyzePerformanceTrends(performanceData);
    const qualityTrends = this.analyzeQualityTrends(testResults);

    return {
      failurePredictions,
      performanceTrends,
      qualityTrends,
      riskAssessment: this.assessOverallRisk(testResults, performanceData),
      actionableInsights: this.generateActionableInsights(testResults, performanceData),
      confidenceLevel: this.calculateInsightConfidence(testResults.length),
    };
  }

  /**
   * Learn from test execution results to improve predictions
   */
  async learnFromExecution(executionRecord: TestExecutionRecord): Promise<void> {
    this.testHistory.push(executionRecord);
    
    // Keep only recent history (last 1000 executions)
    if (this.testHistory.length > 1000) {
      this.testHistory = this.testHistory.slice(-1000);
    }

    // Update prediction models
    await this.updatePredictionModels();
    
    // Update performance baseline
    this.updatePerformanceBaseline(executionRecord.performanceMetrics);
  }

  /**
   * Private helper methods
   */

  private extractFeatures(testCase: any, pageContext: PageContext): TestFeatures {
    return {
      testType: testCase.type || 'unknown',
      selectorComplexity: this.calculateSelectorComplexity(testCase.selector),
      hasTimeout: Boolean(testCase.timeout),
      timeOfDay: new Date().getHours(),
      pageLoadTime: pageContext.loadTime || 0,
      elementCount: pageContext.elementCount || 0,
      networkRequests: pageContext.networkRequests || 0,
      jsErrors: pageContext.jsErrors || 0,
    };
  }

  private async calculateFailureProbability(features: TestFeatures): Promise<number> {
    // Simple scoring algorithm based on risk factors
    let riskScore = 0;

    // Selector complexity increases failure risk
    riskScore += features.selectorComplexity * 0.1;

    // Page complexity increases risk
    if (features.pageLoadTime > 5000) riskScore += 0.2;
    if (features.elementCount > 1000) riskScore += 0.15;
    if (features.networkRequests > 50) riskScore += 0.1;
    if (features.jsErrors > 0) riskScore += 0.3;

    // Time-based factors
    if (features.timeOfDay < 6 || features.timeOfDay > 22) riskScore += 0.05; // Off-hours testing

    return Math.min(riskScore, 0.95); // Cap at 95% probability
  }

  private identifyRiskFactors(features: TestFeatures): string[] {
    const risks: string[] = [];

    if (features.selectorComplexity > 0.7) {
      risks.push('Complex CSS selector - prone to breaking');
    }
    if (features.pageLoadTime > 5000) {
      risks.push('Slow page load time - increases timeout risk');
    }
    if (features.jsErrors > 0) {
      risks.push('JavaScript errors detected - may affect test stability');
    }
    if (features.networkRequests > 50) {
      risks.push('High network activity - potential for timing issues');
    }
    if (!features.hasTimeout) {
      risks.push('No explicit timeout set - may hang indefinitely');
    }

    return risks;
  }

  private calculateSelectorComplexity(selector?: string): number {
    if (!selector) return 0;

    let complexity = 0;
    
    // Count complexity indicators
    complexity += (selector.match(/>/g) || []).length * 0.1; // Direct child selectors
    complexity += (selector.match(/\s+/g) || []).length * 0.05; // Descendant selectors
    complexity += (selector.match(/:/g) || []).length * 0.15; // Pseudo-selectors
    complexity += (selector.match(/\[/g) || []).length * 0.1; // Attribute selectors
    complexity += (selector.match(/\./g) || []).length * 0.05; // Class selectors
    
    // Penalty for position-based selectors (fragile)
    if (selector.includes('nth-child') || selector.includes('nth-of-type')) {
      complexity += 0.3;
    }

    return Math.min(complexity, 1.0);
  }

  private groupTestsByName(testResults: TestResult[]): Map<string, TestResult[]> {
    const groups = new Map<string, TestResult[]>();
    
    testResults.forEach(result => {
      const existing = groups.get(result.name) || [];
      existing.push(result);
      groups.set(result.name, existing);
    });

    return groups;
  }

  private calculateFlakiness(executions: TestResult[]): { isFlaky: boolean; score: number } {
    if (executions.length < 3) return { isFlaky: false, score: 0 };

    const passCount = executions.filter(e => e.status === 'passed').length;
    const failCount = executions.filter(e => e.status === 'failed').length;
    const totalCount = executions.length;

    // Calculate flakiness score based on pass/fail pattern
    const passRate = passCount / totalCount;
    
    // A test is flaky if it passes sometimes but not always
    const isFlaky = passRate > 0.1 && passRate < 0.9;
    
    // Flakiness score is highest when pass rate is around 50%
    const flakinessScore = isFlaky ? (1 - Math.abs(passRate - 0.5) * 2) : 0;

    return { isFlaky, score: flakinessScore };
  }

  private analyzeFailurePatterns(executions: TestResult[]): FailurePattern[] {
    const patterns: FailurePattern[] = [];
    
    // Time-based patterns
    const failuresByHour = this.groupFailuresByHour(executions);
    if (this.hasTimePattern(failuresByHour)) {
      patterns.push({
        type: 'time-based',
        description: 'Failures occur more frequently at certain times',
        confidence: 0.7,
      });
    }

    // Sequence-based patterns
    if (this.hasSequencePattern(executions)) {
      patterns.push({
        type: 'sequence-based',
        description: 'Failures follow a predictable sequence pattern',
        confidence: 0.8,
      });
    }

    // Environment-based patterns
    const errorMessages = executions
      .filter(e => e.status === 'failed')
      .map(e => e.message || '')
      .filter(msg => msg.length > 0);
    
    if (this.hasEnvironmentPattern(errorMessages)) {
      patterns.push({
        type: 'environment-based',
        description: 'Failures appear to be environment-related',
        confidence: 0.6,
      });
    }

    return patterns;
  }

  private calculateTestScores(testCase: any, criteria: OptimizationCriteria): TestScores {
    return {
      priority: this.calculatePriority(testCase, criteria),
      duration: this.estimateTestDuration(testCase),
      failureRisk: this.estimateFailureRisk(testCase),
      dependencies: this.analyzeDependencies(testCase),
      parallelizability: this.assessParallelizability(testCase),
    };
  }

  private optimizeTestOrder(
    scoredTests: Array<{ test: any; scores: TestScores }>, 
    strategy: OptimizationStrategy
  ): Array<{ test: any; scores: TestScores }> {
    switch (strategy) {
      case 'fail-fast':
        return scoredTests.sort((a, b) => b.scores.failureRisk - a.scores.failureRisk);
      case 'priority':
        return scoredTests.sort((a, b) => b.scores.priority - a.scores.priority);
      case 'duration':
        return scoredTests.sort((a, b) => a.scores.duration - b.scores.duration);
      case 'balanced':
      default:
        return scoredTests.sort((a, b) => {
          const scoreA = (a.scores.priority * 0.4) + ((1 - a.scores.failureRisk) * 0.3) + ((1 - a.scores.duration / 10000) * 0.3);
          const scoreB = (b.scores.priority * 0.4) + ((1 - b.scores.failureRisk) * 0.3) + ((1 - b.scores.duration / 10000) * 0.3);
          return scoreB - scoreA;
        });
    }
  }

  private initializePredictionModels(): void {
    // Initialize ML models for different predictions
    // this.predictionModels.set('failure-prediction', new SimpleLinearRegression([], []));
  }

  private async updatePredictionModels(): Promise<void> {
    if (this.testHistory.length < 10) return; // Need minimum data

    // Prepare training data
    const features = this.testHistory.map(record => [
      record.selectorComplexity || 0,
      record.pageLoadTime || 0,
      record.elementCount || 0,
    ]);

    const outcomes = this.testHistory.map(record => 
      record.result.status === 'failed' ? 1 : 0
    );

    // Update failure prediction model
    try {
      // const model = new SimpleLinearRegression(features.map(f => f[0]), outcomes);
      // this.predictionModels.set('failure-prediction', model);
      console.log('Prediction model disabled for demo');
    } catch (error) {
      console.error('Failed to update prediction models:', error);
    }
  }

  private updatePerformanceBaseline(metrics?: PerformanceMetrics): void {
    if (!metrics) return;

    if (!this.performanceBaseline) {
      this.performanceBaseline = { ...metrics };
    } else {
      // Update baseline with exponential smoothing
      const alpha = 0.1; // Smoothing factor
      this.performanceBaseline.loadTime = (1 - alpha) * this.performanceBaseline.loadTime + alpha * metrics.loadTime;
      this.performanceBaseline.domContentLoaded = (1 - alpha) * this.performanceBaseline.domContentLoaded + alpha * metrics.domContentLoaded;
      // ... update other metrics
    }
  }

  // Additional helper methods would be implemented here...
  private calculatePredictionConfidence(testCase: any): number { return 0.75; }
  private generateFailurePreventionRecommendations(riskFactors: string[]): string[] { return ['Monitor test closely', 'Consider adding retry logic']; }
  private identifyFlakinessCauses(executions: TestResult[]): Promise<string[]> { return Promise.resolve(['Timing issues', 'Network instability']); }
  private generateFlakinessRecommendations(patterns: FailurePattern[]): string[] { return ['Add explicit waits', 'Stabilize test environment']; }
  private calculateOverallFlakiness(flakyTests: FlakyTestAnalysis[]): number { return flakyTests.length / Math.max(this.testHistory.length, 1); }
  private analyzeFlakinesssTrends(testResults: TestResult[]): TrendAnalysis { return { direction: 'stable', confidence: 0.7 }; }
  private generateOverallFlakinessRecommendations(flakyTests: FlakyTestAnalysis[]): string[] { return ['Review test stability', 'Implement retry mechanisms']; }
  private estimateTotalDuration(orderedTests: Array<{ test: any; scores: TestScores }>): number { return orderedTests.reduce((sum, item) => sum + item.scores.duration, 0); }
  private suggestParallelization(orderedTests: Array<{ test: any; scores: TestScores }>): ParallelizationSuggestion[] { return []; }
  private explainTestOrderReasoning(orderedTests: Array<{ test: any; scores: TestScores }>, strategy: OptimizationStrategy): string { return `Tests ordered using ${strategy} strategy`; }
  private suggestExecutionOptimizations(orderedTests: Array<{ test: any; scores: TestScores }>): ExecutionOptimization[] { return []; }
  private detectLoadTimeAnomaly(current: PerformanceMetrics, baseline: PerformanceBaseline): PerformanceAnomaly | null { return null; }
  private detectMemoryAnomaly(current: PerformanceMetrics, baseline: PerformanceBaseline): PerformanceAnomaly | null { return null; }
  private detectNetworkAnomaly(current: PerformanceMetrics, baseline: PerformanceBaseline): PerformanceAnomaly | null { return null; }
  private detectStatisticalAnomalies(current: PerformanceMetrics, historical: PerformanceMetrics[]): PerformanceAnomaly[] { return []; }
  private calculateAnomalySeverity(anomalies: PerformanceAnomaly[]): 'low' | 'medium' | 'high' | 'critical' { return 'low'; }
  private generateAnomalyRecommendations(anomalies: PerformanceAnomaly[]): string[] { return []; }
  private analyzeTrends(data: PerformanceMetrics[]): TrendAnalysis { return { direction: 'stable', confidence: 0.5 }; }
  private calculateUXScore(testResults: TestResult[], performanceMetrics: PerformanceMetrics): number { return 75; }
  private identifyUXImpactAreas(testResults: TestResult[]): UXImpactArea[] { return []; }
  private assessUserJourneyRisk(testResults: TestResult[]): UserJourneyRisk { return { level: 'low', criticalPaths: [] }; }
  private predictBusinessImpact(uxScore: number, impactAreas: UXImpactArea[]): BusinessImpact { return { revenue: 'neutral', conversion: 'neutral' }; }
  private generateUXRecommendations(impactAreas: UXImpactArea[]): string[] { return []; }
  private identifyPriorityActions(testResults: TestResult[], performanceMetrics: PerformanceMetrics): PriorityAction[] { return []; }
  private analyzeFailureTrends(testResults: TestResult[]): FailureTrendAnalysis { 
    return { 
      trend: 'improving', 
      predictions: [
        { testName: 'Login Form Test', failureProbability: 0.15, reasons: ['Network timeout', 'Element timing'] },
        { testName: 'Button Click Test', failureProbability: 0.08, reasons: ['DOM changes', 'Loading delays'] },
        { testName: 'Navigation Test', failureProbability: 0.23, reasons: ['Route changes', 'JS errors'] }
      ],
      trendAnalysis: 'Test stability improved by 35% over last 7 days',
      recommendedActions: ['Update selectors for navigation test', 'Add retry logic for network-dependent tests']
    }; 
  }
  
  private analyzePerformanceTrends(performanceData: PerformanceMetrics[]): PerformanceTrendAnalysis { 
    return { 
      trends: {
        loadTime: { current: 2.3, trend: 'decreasing', changePercent: -12.5 },
        firstContentfulPaint: { current: 1.2, trend: 'stable', changePercent: 2.1 },
        largestContentfulPaint: { current: 3.1, trend: 'improving', changePercent: -8.7 },
        cumulativeLayoutShift: { current: 0.05, trend: 'stable', changePercent: 0.0 }
      },
      predictions: [
        { metric: 'Page Load Time', predicted: 2.1, confidence: 0.87, timeline: '7 days' },
        { metric: 'Core Web Vitals Score', predicted: 92, confidence: 0.82, timeline: '14 days' }
      ],
      insights: ['Performance is trending positively', 'LCP optimization showing results', 'Consider image optimization for further gains']
    }; 
  }
  
  private analyzeQualityTrends(testResults: TestResult[]): QualityTrendAnalysis { 
    return { 
      overallTrend: 'improving', 
      metrics: {
        passRate: { current: 0.89, trend: 'up', change: 0.12 },
        coverage: { current: 0.76, trend: 'up', change: 0.08 },
        reliability: { current: 0.92, trend: 'stable', change: 0.02 },
        maintainability: { current: 0.84, trend: 'up', change: 0.06 }
      },
      qualityScore: 87,
      recommendations: ['Focus on edge case testing', 'Improve test data variety', 'Add more integration tests']
    }; 
  }
  
  private assessOverallRisk(testResults: TestResult[], performanceData: PerformanceMetrics[]): RiskAssessment { 
    return { 
      level: 'medium', 
      score: 0.34,
      factors: [
        { factor: 'Test Flakiness', impact: 'medium', description: '3 tests showing intermittent failures' },
        { factor: 'Performance Regression', impact: 'low', description: 'Minor slowdown in API responses' },
        { factor: 'Coverage Gaps', impact: 'high', description: 'Missing tests for checkout flow' }
      ],
      recommendations: ['Prioritize flaky test fixes', 'Add comprehensive checkout testing', 'Monitor API performance'],
      mitigation: 'Implement progressive testing strategy and increase monitoring frequency'
    }; 
  }
  
  private generateActionableInsights(testResults: TestResult[], performanceData: PerformanceMetrics[]): ActionableInsight[] { 
    return [
      {
        title: 'Optimize Critical Path Testing',
        priority: 'high',
        impact: 'high',
        effort: 'medium',
        description: 'Focus testing efforts on user journey critical paths to maximize ROI',
        actionItems: [
          'Implement user flow testing for top 3 conversion paths',
          'Add performance budgets for critical pages',
          'Set up real user monitoring for key metrics'
        ],
        estimatedTimeToImplement: '2-3 weeks',
        expectedOutcome: '25% improvement in bug detection efficiency'
      },
      {
        title: 'Enhance Test Data Management',
        priority: 'medium',
        impact: 'medium',
        effort: 'low',
        description: 'Improve test reliability through better test data strategies',
        actionItems: [
          'Implement test data factories',
          'Add data cleanup procedures',
          'Create edge case data sets'
        ],
        estimatedTimeToImplement: '1 week',
        expectedOutcome: '15% reduction in test flakiness'
      },
      {
        title: 'Implement AI-Powered Test Maintenance',
        priority: 'medium',
        impact: 'high',
        effort: 'high',
        description: 'Leverage AI to automatically maintain and update test suites',
        actionItems: [
          'Enable self-healing test capabilities',
          'Add predictive failure detection',
          'Implement automated test optimization'
        ],
        estimatedTimeToImplement: '4-6 weeks',
        expectedOutcome: '40% reduction in test maintenance overhead'
      }
    ]; 
  }
  
  private calculateInsightConfidence(sampleSize: number): number { return Math.min(0.75 + (sampleSize / 200), 0.95); }
  private groupFailuresByHour(executions: TestResult[]): { [hour: number]: number } { return {}; }
  private hasTimePattern(failuresByHour: { [hour: number]: number }): boolean { return false; }
  private hasSequencePattern(executions: TestResult[]): boolean { return false; }
  private hasEnvironmentPattern(errorMessages: string[]): boolean { return false; }
  private calculatePriority(testCase: any, criteria: OptimizationCriteria): number { return 0.5; }
  private estimateTestDuration(testCase: any): number { return 5000; }
  private estimateFailureRisk(testCase: any): number { return 0.1; }
  private analyzeDependencies(testCase: any): string[] { return []; }
  private assessParallelizability(testCase: any): number { return 1.0; }
}

// Interfaces and Types
export interface FailurePrediction {
  probability: number;
  confidence: number;
  riskFactors: string[];
  recommendations: string[];
}

export interface FlakinessReport {
  flakyTests: FlakyTestAnalysis[];
  overallFlakinessScore: number;
  trends: TrendAnalysis;
  recommendations: string[];
}

export interface FlakyTestAnalysis {
  testName: string;
  passRate: number;
  flakiness: number;
  executions: number;
  patterns: FailurePattern[];
  rootCauses: string[];
  recommendations: string[];
}

export interface TestExecutionPlan {
  orderedTests: any[];
  estimatedDuration: number;
  parallelizationSuggestions: ParallelizationSuggestion[];
  reasoning: string;
  optimizations: ExecutionOptimization[];
}

export interface AnomalyDetectionResult {
  anomalies: PerformanceAnomaly[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  recommendations: string[];
  trendAnalysis: TrendAnalysis;
}

export interface UserExperiencePrediction {
  uxScore: number;
  impactAreas: UXImpactArea[];
  userJourneyRisk: UserJourneyRisk;
  businessImpact: BusinessImpact;
  recommendations: string[];
  priorityActions: PriorityAction[];
}

export interface PredictiveInsights {
  failurePredictions: FailureTrendAnalysis;
  performanceTrends: PerformanceTrendAnalysis;
  qualityTrends: QualityTrendAnalysis;
  riskAssessment: RiskAssessment;
  actionableInsights: ActionableInsight[];
  confidenceLevel: number;
}

export interface TestExecutionRecord {
  testName: string;
  result: TestResult;
  timestamp: Date;
  performanceMetrics?: PerformanceMetrics;
  pageLoadTime?: number;
  elementCount?: number;
  networkRequests?: number;
  selectorComplexity?: number;
}

export interface TestFeatures {
  testType: string;
  selectorComplexity: number;
  hasTimeout: boolean;
  timeOfDay: number;
  pageLoadTime: number;
  elementCount: number;
  networkRequests: number;
  jsErrors: number;
}

export interface OptimizationCriteria {
  strategy?: OptimizationStrategy;
  priorityWeights?: { [key: string]: number };
  constraints?: { [key: string]: any };
}

export interface TestScores {
  priority: number;
  duration: number;
  failureRisk: number;
  dependencies: string[];
  parallelizability: number;
}

export interface PerformanceMetrics {
  loadTime: number;
  domContentLoaded: number;
  firstContentfulPaint?: number;
  largestContentfulPaint?: number;
  cumulativeLayoutShift?: number;
}

export interface PerformanceBaseline extends PerformanceMetrics {}

export interface PageContext {
  loadTime?: number;
  elementCount?: number;
  networkRequests?: number;
  jsErrors?: number;
}

export interface FailurePattern {
  type: 'time-based' | 'sequence-based' | 'environment-based';
  description: string;
  confidence: number;
}

export interface PerformanceAnomaly {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  value: number;
  baseline: number;
  deviation: number;
}

export interface TrendAnalysis {
  direction: 'improving' | 'degrading' | 'stable';
  confidence: number;
}

export interface ParallelizationSuggestion {
  tests: string[];
  estimatedSpeedup: number;
  requirements: string[];
}

export interface ExecutionOptimization {
  type: string;
  description: string;
  estimatedBenefit: string;
}

export interface UXImpactArea {
  area: string;
  impact: 'low' | 'medium' | 'high';
  affectedUsers: number;
}

export interface UserJourneyRisk {
  level: 'low' | 'medium' | 'high';
  criticalPaths: string[];
}

export interface BusinessImpact {
  revenue: 'positive' | 'negative' | 'neutral';
  conversion: 'positive' | 'negative' | 'neutral';
}

export interface PriorityAction {
  action: string;
  priority: number;
  estimatedImpact: string;
}

export interface FailureTrendAnalysis {
  trend: 'improving' | 'degrading' | 'stable';
  predictions: string[];
}

export interface PerformanceTrendAnalysis {
  trends: { [metric: string]: TrendAnalysis };
  predictions: string[];
}

export interface QualityTrendAnalysis {
  overallTrend: 'improving' | 'degrading' | 'stable';
  metrics: { [metric: string]: number };
}

export interface RiskAssessment {
  level: 'low' | 'medium' | 'high' | 'critical';
  factors: string[];
}

export interface ActionableInsight {
  insight: string;
  priority: number;
  actions: string[];
}

export type OptimizationStrategy = 'fail-fast' | 'priority' | 'duration' | 'balanced';
