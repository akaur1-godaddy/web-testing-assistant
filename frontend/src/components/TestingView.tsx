import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import './TestingView.css'
import TestForm from './TestForm'
import TestResults from './TestResults'

interface AIOptions {
    useNLP: boolean
    generateEdgeCases: boolean
    generateTestData: boolean
    securityScan: boolean
    enhancedA11y: boolean
    visualAI: boolean
    predictiveAnalytics: boolean
    realtimeMonitoring: boolean
    selfHealing: boolean
}

interface TestingViewProps {
    nlpDescription: string
    onNlpDescriptionChange: (value: string) => void
    aiOptions: AIOptions | undefined
    aiEnabled: boolean
    loading: boolean
    results: any
    onTestStart: () => void
    onTestComplete: (results: any) => void
    onAIOptionToggle?: (option: keyof AIOptions) => void
}

export default function TestingView({
    nlpDescription,
    onNlpDescriptionChange,
    aiOptions,
    onAIOptionToggle,
    aiEnabled,
    loading,
    results,
    onTestStart,
    onTestComplete,
}: TestingViewProps) {
    const [aiOptionsExpanded, setAiOptionsExpanded] = useState(false)

    const enabledCount = aiOptions ? Object.values(aiOptions).filter(Boolean).length : 0
    const totalCount = aiOptions ? Object.keys(aiOptions).length : 0

    return (
        <div className="testing-view-container">
            {/* NLP Input Section */}
            {aiEnabled && (
                <motion.div
                    className="nlp-input-section"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    <div className="nlp-header">
                        <h3>
                            <span className="nlp-icon">✨</span>
                            Natural Language Test Generation
                        </h3>
                    </div>

                    <textarea
                        className="nlp-input"
                        placeholder="Describe your tests in plain English: 'Test the login flow with invalid credentials and check error messages'"
                        value={nlpDescription}
                        onChange={(e) => onNlpDescriptionChange(e.target.value)}
                        rows={3}
                    />

                    {/* Expandable AI Options Section */}
                    <motion.div className="ai-options-container">
                        <button
                            className="ai-options-toggle"
                            onClick={() => setAiOptionsExpanded(!aiOptionsExpanded)}
                        >
                            <span className="toggle-icon">
                                <motion.span
                                    animate={{ rotate: aiOptionsExpanded ? 180 : 0 }}
                                    transition={{ duration: 0.3 }}
                                    style={{ display: 'inline-block' }}
                                >
                                    ⚙️
                                </motion.span>
                            </span>
                            <span className="toggle-label">
                                AI Options ({enabledCount}/{totalCount})
                            </span>
                            <motion.span
                                className="expand-arrow"
                                animate={{ rotate: aiOptionsExpanded ? 180 : 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                ▼
                            </motion.span>
                        </button>

                        <AnimatePresence>
                            {aiOptionsExpanded && (
                                <motion.div
                                    className="ai-options-grid"
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    {Object.entries(aiOptions).map(([key, value]) => (
                                        <motion.button
                                            key={key}
                                            className={`ai-toggle-switch ${value ? 'enabled' : 'disabled'}`}
                                            onClick={() => onAIOptionToggle?.(key as keyof AIOptions)}
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                        >
                                            <span className="switch-track">
                                                <motion.span
                                                    className="switch-thumb"
                                                    animate={{ x: value ? '22px' : '2px' }}
                                                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                                />
                                            </span>
                                            <span className="switch-label">
                                                {key
                                                    .replace(/([A-Z])/g, ' $1')
                                                    .replace(/^./, (str) => str.toUpperCase())}
                                            </span>
                                        </motion.button>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                </motion.div>
            )}

            {/* Test Form Section */}
            <TestForm
                onTestStart={onTestStart}
                onTestComplete={onTestComplete}
                aiOptions={aiEnabled ? aiOptions : undefined}
                nlpDescription={nlpDescription}
            />

            {/* Loading State */}
            {loading && (
                <motion.div
                    className="loading-ai"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                >
                    <div className="ai-spinner"></div>
                    <div className="loading-status">🤖 AI Testing in Progress...</div>
                    <div className="loading-substatus">
                        Running comprehensive analysis with machine learning
                    </div>
                </motion.div>
            )}

            {/* Test Results Section */}
            {results && !loading && (
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <TestResults results={results} />
                </motion.div>
            )}
        </div>
    )
}
