import { Page } from 'puppeteer';
import { TestCase, TestResult } from './testRunner.js';
import { ElementDetector, InteractiveElement } from './ElementDetector.js';
import { FunctionalTestCaseGenerator } from './FunctionalTestCaseGenerator.js';
import { AITestCaseGenerator, PageAnalysis } from './AITestCaseGenerator.js';
import { FormTestValidator } from './FormTestValidator.js';
import { ComprehensiveFilterTester } from './ComprehensiveFilterTester.js';

export interface UniversalTestConfig {
    includeFilters?: boolean;
    includeSearch?: boolean;
    includePagination?: boolean;
    includeSorting?: boolean;
    includeFormValidation?: boolean;
    includeSecurityTests?: boolean;
    includeAccessibilityTests?: boolean;
    includeAIGeneration?: boolean;
}

export interface ComprehensiveTestSummary {
    totalTests: number;
    passedTests: number;
    failedTests: number;
    skippedTests: number;
    executionTime: number;
    categories: {
        functionalTests: number;
        filterTests: number;
        searchTests: number;
        paginationTests: number;
        sortingTests: number;
        formValidationTests: number;
        securityTests: number;
        accessibilityTests: number;
        aiGeneratedTests: number;
    };
    elementsDetected: {
        buttons: number;
        inputs: number;
        forms: number;
        filters: number;
        searchElements: number;
        links: number;
    };
    issues: Array<{ category: string; description: string; severity: 'critical' | 'high' | 'medium' | 'low' }>;
}

export class UniversalTestOrchestrator {
    private elementDetector: ElementDetector;
    private functionalGenerator: FunctionalTestCaseGenerator;
    private aiGenerator: AITestCaseGenerator;
    private formValidator: FormTestValidator;
    private filterTester: ComprehensiveFilterTester;

    constructor(private page: Page) {
        this.elementDetector = new ElementDetector(page);
        this.functionalGenerator = new FunctionalTestCaseGenerator(page);
        this.aiGenerator = new AITestCaseGenerator();
        this.formValidator = new FormTestValidator(page);
        this.filterTester = new ComprehensiveFilterTester(page);
    }

    /**
     * Generate comprehensive test suite covering all functionality
     */
    async generateUniversalTestSuite(config: UniversalTestConfig = {}): Promise<TestCase[]> {
        const tests: TestCase[] = [];
        console.log('🚀 Generating Comprehensive Universal Test Suite...');

        try {
            // 1. Functional CTA Tests
            console.log('\n📋 Generating Functional Tests...');
            const functionalTests = await this.functionalGenerator.generateTestCases();
            tests.push(...functionalTests);
            console.log(`✅ Generated ${functionalTests.length} functional tests`);

            // 2. Filter Tests
            if (config.includeFilters !== false) {
                console.log('\n🔍 Detecting and Testing Filters...');
                const filters = await this.filterTester.detectAllFilters();
                if (filters.length > 0) {
                    const filterTests = await this.filterTester.generateFilterTests(filters);
                    tests.push(...filterTests);
                    console.log(`✅ Generated ${filterTests.length} filter tests for ${filters.length} filters`);
                } else {
                    console.log('ℹ️ No filters detected on page');
                }
            }

            // 3. Search Tests
            if (config.includeSearch !== false) {
                console.log('\n🔎 Detecting and Testing Search...');
                const searchElements = await this.filterTester.detectSearchElements();
                if (searchElements.length > 0) {
                    const searchTests = await this.filterTester.generateSearchTests(searchElements);
                    tests.push(...searchTests);
                    console.log(`✅ Generated ${searchTests.length} search tests`);
                } else {
                    console.log('ℹ️ No search functionality detected');
                }
            }

            // 4. Pagination Tests
            if (config.includePagination !== false) {
                console.log('\n📄 Testing Pagination...');
                const paginationTests = await this.filterTester.generatePaginationTests();
                if (paginationTests.length > 0) {
                    tests.push(...paginationTests);
                    console.log(`✅ Generated ${paginationTests.length} pagination tests`);
                }
            }

            // 5. Sorting Tests
            if (config.includeSorting !== false) {
                console.log('\n↕️ Testing Sorting...');
                const sortingTests = await this.filterTester.generateSortingTests();
                if (sortingTests.length > 0) {
                    tests.push(...sortingTests);
                    console.log(`✅ Generated ${sortingTests.length} sorting tests`);
                }
            }

            // 6. Form Validation Tests
            if (config.includeFormValidation !== false) {
                console.log('\n✏️ Generating Form Validation Tests...');
                const elements = await this.elementDetector.detectAllInteractiveElements();
                const formInputs = elements.filter(e => ['input', 'select', 'textarea'].includes(e.elementType));
                if (formInputs.length > 0) {
                    const formTests = await this.formValidator.generateFormValidationTests(formInputs);
                    tests.push(...formTests);
                    console.log(`✅ Generated ${formTests.length} form validation tests`);
                }
            }

            // 7. AI-Generated Tests
            if (config.includeAIGeneration !== false) {
                console.log('\n🤖 Generating AI-Powered Tests...');
                const pageUrl = await this.page.url();
                const pageTitle = await this.page.title();
                const pageAnalysis: PageAnalysis = {
                    url: pageUrl,
                    title: pageTitle,
                    forms: [],
                    buttons: [],
                    inputs: [],
                    hasAuth: tests.some(t => t.name?.toLowerCase().includes('login')),
                    pageType: 'unknown',
                };

                const aiTestSuite = await this.aiGenerator.generateContextualTests(pageAnalysis);
                const allAITests = [
                    ...aiTestSuite.loginTests,
                    ...aiTestSuite.formValidationTests,
                    ...aiTestSuite.securityTests,
                    ...aiTestSuite.userJourneyTests,
                    ...aiTestSuite.accessibilityTests,
                ];

                tests.push(...allAITests);
                console.log(`✅ Generated ${allAITests.length} AI-powered tests`);
            }
        } catch (error) {
            console.error('⚠️ Error generating universal test suite:', error);
        }

        console.log(`\n📊 Total Tests Generated: ${tests.length}`);
        return tests;
    }

    /**
     * Generate comprehensive analysis and summary
     */
    async generateComprehensiveSummary(
        testResults: TestResult[],
        generatedTests: TestCase[]
    ): Promise<ComprehensiveTestSummary> {
        const startTime = Date.now();
        const elements = await this.elementDetector.detectAllInteractiveElements();
        const filters = await this.filterTester.detectAllFilters();
        const searches = await this.filterTester.detectSearchElements();

        const summary: ComprehensiveTestSummary = {
            totalTests: testResults.length,
            passedTests: testResults.filter(t => t.status === 'passed').length,
            failedTests: testResults.filter(t => t.status === 'failed').length,
            skippedTests: 0,
            executionTime: Date.now() - startTime,
            categories: {
                functionalTests: generatedTests.filter(t => t.name?.includes('Button') || t.name?.includes('Click')).length,
                filterTests: generatedTests.filter(t => t.name?.includes('Filter')).length,
                searchTests: generatedTests.filter(t => t.name?.includes('Search')).length,
                paginationTests: generatedTests.filter(t => t.name?.includes('Pagination')).length,
                sortingTests: generatedTests.filter(t => t.name?.includes('Sort')).length,
                formValidationTests: generatedTests.filter(t => t.name?.includes('Form') || t.name?.includes('Input')).length,
                securityTests: generatedTests.filter(t => t.name?.toLowerCase().includes('xss') || t.name?.toLowerCase().includes('injection')).length,
                accessibilityTests: generatedTests.filter(t => t.name?.toLowerCase().includes('accessibility') || t.name?.toLowerCase().includes('aria')).length,
                aiGeneratedTests: generatedTests.filter(t => t.name?.includes('AI') || t.name?.includes('Contextual')).length,
            },
            elementsDetected: {
                buttons: elements.filter(e => e.elementType === 'button').length,
                inputs: elements.filter(e => e.elementType === 'input').length,
                forms: elements.filter(e => e.elementType === 'form').length,
                filters: filters.length,
                searchElements: searches.length,
                links: elements.filter(e => e.elementType === 'link').length,
            },
            issues: this.identifyIssues(testResults),
        };

        return summary;
    }

    /**
     * Identify and categorize issues
     */
    private identifyIssues(
        testResults: TestResult[]
    ): Array<{ category: string; description: string; severity: 'critical' | 'high' | 'medium' | 'low' }> {
        const issues: Array<{ category: string; description: string; severity: 'critical' | 'high' | 'medium' | 'low' }> = [];

        const failedTests = testResults.filter(t => t.status === 'failed');
        const failuresByCategory = new Map<string, number>();

        failedTests.forEach(t => {
            const category = t.name?.split(':')[0] || 'Unknown';
            failuresByCategory.set(category, (failuresByCategory.get(category) || 0) + 1);
        });

        failuresByCategory.forEach((count, category) => {
            let severity: 'critical' | 'high' | 'medium' | 'low' = 'medium';
            if (count > 5) severity = 'critical';
            else if (count > 3) severity = 'high';
            else if (count > 1) severity = 'medium';
            else severity = 'low';

            issues.push({
                category,
                description: `${count} test failures in ${category}`,
                severity,
            });
        });

        return issues.sort((a, b) => {
            const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
            return severityOrder[a.severity] - severityOrder[b.severity];
        });
    }

    /**
     * Print comprehensive test report
     */
    printComprehensiveReport(summary: ComprehensiveTestSummary): void {
        console.log('\n' + '='.repeat(70));
        console.log('📊 UNIVERSAL COMPREHENSIVE TEST RESULTS');
        console.log('='.repeat(70));

        const passRate = ((summary.passedTests / summary.totalTests) * 100).toFixed(1);
        const failRate = ((summary.failedTests / summary.totalTests) * 100).toFixed(1);

        console.log(`\n⏱️  Execution Time: ${(summary.executionTime / 1000).toFixed(2)}s`);
        console.log(`📈 Total Tests: ${summary.totalTests}`);
        console.log(`✅ Passed: ${summary.passedTests} (${passRate}%)`);
        console.log(`❌ Failed: ${summary.failedTests} (${failRate}%)`);
        console.log(`⏭️  Skipped: ${summary.skippedTests}`);

        console.log('\n🔍 Elements Detected:');
        console.log(`  - Buttons: ${summary.elementsDetected.buttons}`);
        console.log(`  - Input Fields: ${summary.elementsDetected.inputs}`);
        console.log(`  - Forms: ${summary.elementsDetected.forms}`);
        console.log(`  - Filters: ${summary.elementsDetected.filters}`);
        console.log(`  - Search Elements: ${summary.elementsDetected.searchElements}`);
        console.log(`  - Links: ${summary.elementsDetected.links}`);

        console.log('\n📋 Tests Generated by Category:');
        console.log(`  - Functional: ${summary.categories.functionalTests}`);
        console.log(`  - Filter: ${summary.categories.filterTests}`);
        console.log(`  - Search: ${summary.categories.searchTests}`);
        console.log(`  - Pagination: ${summary.categories.paginationTests}`);
        console.log(`  - Sorting: ${summary.categories.sortingTests}`);
        console.log(`  - Form Validation: ${summary.categories.formValidationTests}`);
        console.log(`  - Security: ${summary.categories.securityTests}`);
        console.log(`  - Accessibility: ${summary.categories.accessibilityTests}`);
        console.log(`  - AI-Generated: ${summary.categories.aiGeneratedTests}`);

        if (summary.issues.length > 0) {
            console.log('\n⚠️  Issues Detected:');
            summary.issues.forEach((issue, idx) => {
                const severityEmoji = {
                    critical: '🔴',
                    high: '🟠',
                    medium: '🟡',
                    low: '🟢',
                }[issue.severity];
                console.log(`  ${severityEmoji} ${issue.category}: ${issue.description}`);
            });
        }

        console.log('\n' + '='.repeat(70));
    }
}
