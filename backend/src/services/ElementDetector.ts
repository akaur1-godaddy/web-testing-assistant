import { Page, ElementHandle } from 'puppeteer';

export type ElementType = 'button' | 'link' | 'input' | 'select' | 'textarea' | 'form' | 'checkbox' | 'radio' | 'unknown';

export interface InteractiveElement {
    tag: string;
    type?: string;
    text?: string;
    selector?: string;
    xpathSelector?: string;
    ariaLabel?: string;
    placeholder?: string;
    name?: string;
    id?: string;
    visible: boolean;
    clickable: boolean;
    elementType: ElementType;
    classList: string[];
    position: { x: number; y: number; width: number; height: number };
    confidence: number;
}

export interface ElementContext {
    element: InteractiveElement;
    nearbyText: string;
    formParent?: string;
    role?: string;
}

export class ElementDetector {
    private page: Page;

    constructor(page: Page) {
        this.page = page;
    }

    /**
     * Detect all interactive elements on the page using multiple strategies
     */
    async detectAllInteractiveElements(): Promise<InteractiveElement[]> {
        const elements: InteractiveElement[] = [];

        // Strategy 1: CSS-based detection
        const cssElements = await this.detectByCssSelectors();
        elements.push(...cssElements);

        // Strategy 2: ARIA and accessibility markers
        const ariaElements = await this.detectByAriaAttributes();
        elements.push(...ariaElements.filter(e => !elements.some(ex => ex.selector === e.selector)));

        // Strategy 3: Event listeners and behavioral detection
        const behavioralElements = await this.detectByBehavior();
        elements.push(...behavioralElements.filter(e => !elements.some(ex => ex.selector === e.selector)));

        // Remove duplicates and score confidence
        const uniqueElements = this.deduplicateAndScore(elements);

        return uniqueElements.sort((a, b) => b.confidence - a.confidence);
    }

    /**
     * Detect elements using CSS selectors
     */
    private async detectByCssSelectors(): Promise<InteractiveElement[]> {
        const selectors = [
            'button:not([disabled])',
            'input[type="button"]:not([disabled])',
            'input[type="submit"]:not([disabled])',
            'a[href]:not([aria-disabled="true"])',
            '[role="button"]:not([aria-disabled="true"])',
            '[role="link"]:not([aria-disabled="true"])',
            'input[type="text"]',
            'input[type="email"]',
            'input[type="password"]',
            'input[type="number"]',
            'input[type="tel"]',
            'input[type="checkbox"]',
            'input[type="radio"]',
            'select',
            'textarea',
            'form',
            '[contenteditable="true"]',
            '[onclick]',
            '[data-testid]',
        ];

        const elements: InteractiveElement[] = [];

        for (const selector of selectors) {
            try {
                const handles = await this.page.$$(selector);
                for (const handle of handles) {
                    const element = await this.analyzeElement(handle, selector);
                    if (element) elements.push(element);
                }
            } catch (error) {
                // Silently skip unsupported selectors
            }
        }

        return elements;
    }

    /**
     * Detect elements by ARIA attributes
     */
    private async detectByAriaAttributes(): Promise<InteractiveElement[]> {
        const elements: InteractiveElement[] = [];
        const selectors = [
            '[aria-label][role="button"]',
            '[aria-label][role="link"]',
            '[aria-pressed]',
            '[aria-expanded]',
            '[aria-selected]',
        ];

        for (const selector of selectors) {
            try {
                const handles = await this.page.$$(selector);
                for (const handle of handles) {
                    const element = await this.analyzeElement(handle, selector);
                    if (element) elements.push(element);
                }
            } catch (error) {
                // Skip
            }
        }

        return elements;
    }

    /**
     * Detect elements by behavioral patterns
     */
    private async detectByBehavior(): Promise<InteractiveElement[]> {
        try {
            const elements = await this.page.evaluate(() => {
                const results: any[] = [];
                const allElements = document.querySelectorAll('*');

                allElements.forEach((el) => {
                    const rect = (el as HTMLElement).getBoundingClientRect();
                    const isVisible = rect.width > 0 && rect.height > 0 &&
                        window.getComputedStyle(el as HTMLElement).display !== 'none' &&
                        window.getComputedStyle(el as HTMLElement).visibility !== 'hidden';

                    if (!isVisible) return;

                    const hasPointerCursor = window.getComputedStyle(el as HTMLElement).cursor === 'pointer';

                    if (hasPointerCursor) {
                        results.push({
                            tag: (el as HTMLElement).tagName.toLowerCase(),
                            text: (el as HTMLElement).innerText?.trim().slice(0, 100),
                            id: (el as HTMLElement).id,
                            className: (el as HTMLElement).className,
                            ariaLabel: (el as HTMLElement).getAttribute('aria-label'),
                        });
                    }
                });

                return results;
            });

            const result: InteractiveElement[] = [];
            for (const data of elements) {
                const selector = data.id ? `#${data.id}` : data.tag;
                const handle = await this.page.$(selector);
                if (handle) {
                    const element = await this.analyzeElement(handle, selector);
                    if (element) result.push(element);
                }
            }

            return result;
        } catch (error) {
            return [];
        }
    }

    /**
     * Analyze a single element
     */
    private async analyzeElement(handle: ElementHandle<Element>, selector: string): Promise<InteractiveElement | null> {
        try {
            const elementData = await handle.evaluate((el) => {
                const rect = (el as HTMLElement).getBoundingClientRect();
                const style = window.getComputedStyle(el as HTMLElement);
                const isVisible = rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden';

                return {
                    tag: (el as HTMLElement).tagName.toLowerCase(),
                    type: (el as HTMLInputElement).type || undefined,
                    text: ((el as HTMLElement).innerText || (el as HTMLElement).textContent)?.trim().slice(0, 100),
                    ariaLabel: (el as HTMLElement).getAttribute('aria-label'),
                    placeholder: (el as HTMLInputElement).placeholder,
                    name: (el as HTMLInputElement).name,
                    id: (el as HTMLElement).id,
                    className: (el as HTMLElement).className,
                    role: (el as HTMLElement).getAttribute('role'),
                    visible: isVisible,
                    clickable: style.cursor === 'pointer' || isVisible,
                    position: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
                };
            });

            if (!elementData.visible) return null;

            const elementType = this.classifyElement(elementData);

            return {
                ...elementData,
                elementType,
                selector,
                classList: elementData.className.split(' ').filter(Boolean),
                xpathSelector: this.buildXPath(elementData),
                confidence: this.scoreConfidence(elementData, elementType),
            };
        } catch (error) {
            return null;
        }
    }

    /**
     * Classify element type
     */
    private classifyElement(data: any): ElementType {
        if (data.tag === 'button' || data.type === 'submit' || data.type === 'button') return 'button';
        if (data.tag === 'a') return 'link';
        if (data.tag === 'input') {
            if (data.type === 'checkbox') return 'checkbox';
            if (data.type === 'radio') return 'radio';
            return 'input';
        }
        if (data.tag === 'select') return 'select';
        if (data.tag === 'textarea') return 'textarea';
        if (data.tag === 'form') return 'form';
        if (data.role === 'button') return 'button';
        if (data.role === 'link') return 'link';
        return 'unknown';
    }

    /**
     * Build XPath selector
     */
    private buildXPath(data: any): string {
        if (data.id) return `//*[@id="${data.id}"]`;
        if (data.text) return `//${data.tag}[contains(text(), "${data.text.slice(0, 40)}")]`;
        if (data.ariaLabel) return `//${data.tag}[@aria-label="${data.ariaLabel}"]`;
        return `//${data.tag}`;
    }

    /**
     * Score confidence
     */
    private scoreConfidence(data: any, type: ElementType): number {
        let score = 0.5;
        if (data.id) score += 0.2;
        if (data.text) score += 0.15;
        if (data.ariaLabel) score += 0.15;
        if (data.name && (type === 'input' || type === 'select' || type === 'textarea')) score += 0.1;
        if (data.clickable) score += 0.1;
        return Math.min(score, 1);
    }

    /**
     * Deduplicate elements
     */
    private deduplicateAndScore(elements: InteractiveElement[]): InteractiveElement[] {
        const seen = new Map<string, InteractiveElement>();

        for (const elem of elements) {
            const key = elem.selector || elem.xpathSelector || `${elem.tag}-${elem.text}`;
            if (!seen.has(key) || (seen.get(key)!.confidence < elem.confidence)) {
                seen.set(key, elem);
            }
        }

        return Array.from(seen.values());
    }
}
