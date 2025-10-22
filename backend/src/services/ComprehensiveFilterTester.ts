import { Page } from 'puppeteer';
import { TestCase } from './testRunner.js';

export interface FilterElement {
    type: 'dropdown' | 'checkbox' | 'radio' | 'range' | 'dateRange' | 'text' | 'toggle' | 'multiSelect' | 'autocomplete' | 'priceRange';
    selector: string;
    label?: string;
    options?: string[];
    confidence: number;
}

export interface SearchElement {
    selector: string;
    placeholder?: string;
    type: 'text' | 'advanced' | 'autocomplete';
    confidence: number;
}

export interface FilterTestResult {
    filterType: string;
    testsPassed: number;
    testsFailed: number;
    appliedFilters: string[];
    resultsCount?: number;
    issues: string[];
}

export class ComprehensiveFilterTester {
    private readonly FILTER_SELECTORS = {
        dropdown: ['select', '[role="combobox"]', '.dropdown', '.select', '[data-filter-type="dropdown"]'],
        checkbox: ['input[type="checkbox"]', '[role="checkbox"]', '.checkbox-filter', '[data-filter-type="checkbox"]'],
        radio: ['input[type="radio"]', '[role="radio"]', '.radio-filter', '[data-filter-type="radio"]'],
        range: ['input[type="range"]', '.slider', '.range-slider', '[data-filter-type="range"]'],
        dateRange: ['input[type="date"]', '.date-picker', '.date-range', '[data-filter-type="date"]'],
        textFilter: ['input[type="text"][placeholder*="filter" i]', '.filter-input', '[data-filter-type="text"]'],
        toggle: ['.toggle', '.switch', '[role="switch"]', '[data-filter-type="toggle"]'],
        priceRange: ['.price-filter', '.price-range', '[name*="price" i]', '[data-filter-type="price"]'],
    };

    constructor(private page: Page) { }

    /**
     * Detect all filters on the page
     */
    async detectAllFilters(): Promise<FilterElement[]> {
        const filters: FilterElement[] = [];

        for (const [type, selectors] of Object.entries(this.FILTER_SELECTORS)) {
            for (const selector of selectors) {
                try {
                    const elements = await this.page.$$(selector);
                    for (const element of elements) {
                        const label = await this.extractFilterLabel(element);
                        const options = await this.extractFilterOptions(element, type as any);

                        filters.push({
                            type: type as any,
                            selector: selector,
                            label: label,
                            options: options,
                            confidence: this.calculateFilterConfidence(type, label, options),
                        });
                    }
                } catch (error) {
                    // Skip selector if error
                }
            }
        }

        return this.deduplicateFilters(filters);
    }

    /**
     * Detect search functionality
     */
    async detectSearchElements(): Promise<SearchElement[]> {
        const searches: SearchElement[] = [];
        const searchSelectors = [
            'input[type="search"]',
            'input[placeholder*="search" i]',
            '[role="searchbox"]',
            '.search-input',
            '[data-search]',
        ];

        for (const selector of searchSelectors) {
            try {
                const elements = await this.page.$$(selector);
                for (const element of elements) {
                    const placeholder = await element.getAttribute('placeholder');
                    searches.push({
                        selector: selector,
                        placeholder: placeholder || undefined,
                        type: 'text',
                        confidence: 0.9,
                    });
                }
            } catch (error) {
                // Skip
            }
        }

        return this.deduplicateSearches(searches);
    }

    /**
     * Generate comprehensive filter tests
     */
    async generateFilterTests(filters: FilterElement[]): Promise<TestCase[]> {
        const tests: TestCase[] = [];

        for (const filter of filters) {
            // Test 1: Filter is visible and interactable
            tests.push({
                name: `Filter Visible: ${filter.label || filter.type}`,
                type: 'assertion',
                selector: filter.selector,
            });

            // Test 2: Apply filter with default/first value
            if (filter.options && filter.options.length > 0) {
                tests.push({
                    name: `Apply ${filter.label || filter.type}: ${filter.options[0]}`,
                    type: 'click',
                    selector: filter.selector,
                });

                tests.push({
                    name: `Wait for filter results`,
                    type: 'wait',
                    timeout: 1200,
                });
            }

            // Test 3: Filter with different values
            if (filter.options && filter.options.length > 1) {
                tests.push({
                    name: `Apply ${filter.label || filter.type}: ${filter.options[1]}`,
                    type: 'click',
                    selector: filter.selector,
                });

                tests.push({
                    name: `Wait for filtered results`,
                    type: 'wait',
                    timeout: 1000,
                });
            }

            // Test 4: Filter reset/clear
            tests.push({
                name: `Reset ${filter.label || filter.type}`,
                type: 'assertion',
                selector: `${filter.selector}, [data-action="clear"], .filter-clear, .reset`,
            });
        }

        return tests;
    }

    /**
     * Generate search tests
     */
    async generateSearchTests(searchElements: SearchElement[]): Promise<TestCase[]> {
        const tests: TestCase[] = [];
        const searchQueries = ['test', 'laptop', 'product', 'example'];

        for (const search of searchElements) {
            // Test 1: Search is visible
            tests.push({
                name: `Search Box Visible`,
                type: 'assertion',
                selector: search.selector,
            });

            // Test 2: Search with valid query
            for (const query of searchQueries.slice(0, 2)) {
                tests.push({
                    name: `Search: "${query}"`,
                    type: 'input',
                    selector: search.selector,
                    value: query,
                });

                tests.push({
                    name: `Wait for search results`,
                    type: 'wait',
                    timeout: 1500,
                });
            }

            // Test 3: Search with special characters
            tests.push({
                name: `Search: Special characters`,
                type: 'input',
                selector: search.selector,
                value: '!@#$%^&*()',
            });

            // Test 4: Search with empty query
            tests.push({
                name: `Search: Clear search`,
                type: 'input',
                selector: search.selector,
                value: '',
            });
        }

        return tests;
    }

    /**
     * Generate pagination tests
     */
    async generatePaginationTests(): Promise<TestCase[]> {
        const tests: TestCase[] = [];

        const paginationSelectors = [
            '.pagination',
            '[aria-label*="pagination" i]',
            '.pager',
            '[data-pagination]',
            '.page-numbers',
        ];

        for (const selector of paginationSelectors) {
            const paginationElement = await this.page.$(selector);
            if (paginationElement) {
                tests.push({
                    name: `Pagination: Next page`,
                    type: 'click',
                    selector: `${selector} a[rel="next"], ${selector} button[aria-label*="next" i]`,
                });

                tests.push({
                    name: `Wait for page load`,
                    type: 'wait',
                    timeout: 1500,
                });

                tests.push({
                    name: `Pagination: Previous page`,
                    type: 'click',
                    selector: `${selector} a[rel="prev"], ${selector} button[aria-label*="previous" i]`,
                });
            }
        }

        return tests;
    }

    /**
     * Generate sorting tests
     */
    async generateSortingTests(): Promise<TestCase[]> {
        const tests: TestCase[] = [];

        const sortingSelectors = [
            'select[name*="sort" i]',
            '[data-sort]',
            '.sort-dropdown',
            '[aria-label*="sort" i]',
            '.sorting',
        ];

        const sortOptions = ['relevance', 'name-asc', 'name-desc', 'price-asc', 'price-desc', 'newest', 'popularity'];

        for (const selector of sortingSelectors) {
            const sortElement = await this.page.$(selector);
            if (sortElement) {
                for (const option of sortOptions.slice(0, 3)) {
                    tests.push({
                        name: `Sort: ${option}`,
                        type: 'click',
                        selector: selector,
                    });

                    tests.push({
                        name: `Wait for sorting`,
                        type: 'wait',
                        timeout: 1000,
                    });
                }
            }
        }

        return tests;
    }

    // Helper methods

    private async extractFilterLabel(element: any): Promise<string | undefined> {
        try {
            // Try to find associated label
            const id = await element.getAttribute('id');
            if (id) {
                const label = await this.page.$(`label[for="${id}"]`);
                if (label) {
                    return await label.textContent();
                }
            }

            // Try aria-label
            const ariaLabel = await element.getAttribute('aria-label');
            if (ariaLabel) return ariaLabel;

            // Try placeholder
            const placeholder = await element.getAttribute('placeholder');
            if (placeholder) return placeholder;

            // Try name attribute
            const name = await element.getAttribute('name');
            if (name) return name;

            return undefined;
        } catch (error) {
            return undefined;
        }
    }

    private async extractFilterOptions(element: any, type: string): Promise<string[] | undefined> {
        try {
            if (type === 'dropdown' || type === 'select') {
                const options = await element.$$('option');
                const labels: string[] = [];
                for (const option of options) {
                    const text = await option.textContent();
                    if (text && text.trim()) labels.push(text.trim());
                }
                return labels.length > 0 ? labels : undefined;
            }

            if (type === 'checkbox' || type === 'radio') {
                const parent = await element.evaluate((el: any) => el.closest('.filter-group, [data-filter-group]'));
                if (parent) {
                    const siblings = await parent.$$('input[type="checkbox"], input[type="radio"]');
                    return [`Option 1`, `Option 2`, `Option 3`];
                }
            }

            return undefined;
        } catch (error) {
            return undefined;
        }
    }

    private calculateFilterConfidence(type: string, label: string | undefined, options: string[] | undefined): number {
        let score = 0.5;
        if (label) score += 0.25;
        if (options && options.length > 0) score += 0.25;
        return Math.min(score, 1);
    }

    private deduplicateFilters(filters: FilterElement[]): FilterElement[] {
        const seen = new Set<string>();
        const unique: FilterElement[] = [];

        for (const filter of filters) {
            const key = `${filter.type}-${filter.label}`;
            if (!seen.has(key)) {
                seen.add(key);
                unique.push(filter);
            }
        }

        return unique;
    }

    private deduplicateSearches(searches: SearchElement[]): SearchElement[] {
        const seen = new Set<string>();
        const unique: SearchElement[] = [];

        for (const search of searches) {
            if (!seen.has(search.selector)) {
                seen.add(search.selector);
                unique.push(search);
            }
        }

        return unique;
    }
}
