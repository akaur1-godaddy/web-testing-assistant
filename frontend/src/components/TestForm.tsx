import { useState, FormEvent } from 'react'
import './TestForm.css'
import { TestResult } from '../App'

interface TestFormProps {
  onTestStart: () => void
  onTestComplete: (results: TestResult) => void
  aiOptions?: any
  nlpDescription?: string
  onNlpChange?: (value: string) => void
  onAiOptionToggle?: (option: any) => void
  aiEnabled?: boolean
}

function TestForm({
  onTestStart,
  onTestComplete,
  aiOptions,
  nlpDescription,
  onNlpChange,
  onAiOptionToggle,
  aiEnabled
}: TestFormProps) {
  const [url, setUrl] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [testFile, setTestFile] = useState<File | null>(null)
  const [step1Expanded, setStep1Expanded] = useState(false)
  const [step2Expanded, setStep2Expanded] = useState(false)

  // AI option descriptions
  const aiOptionDescriptions: Record<string, string> = {
    useNLP: 'Uses Natural Language Processing to understand and generate tests from plain English descriptions',
    generateEdgeCases: 'Automatically generates edge cases and boundary conditions to test unusual scenarios',
    generateTestData: 'Creates realistic test data including mock users, inputs, and scenarios using AI',
    securityScan: 'Scans for common security vulnerabilities like XSS, CSRF, SQL injection, and more',
    enhancedA11y: 'Performs comprehensive accessibility testing beyond WCAG standards using AI analysis',
    visualAI: 'Uses computer vision to detect visual regressions and UI inconsistencies',
    predictiveAnalytics: 'Predicts potential failures and performance issues before they occur',
    realtimeMonitoring: 'Monitors test execution in real-time with live insights and recommendations',
    selfHealing: 'Automatically repairs broken tests by detecting and updating changed selectors'
  }

  const handleSubmit = async (e: FormEvent) => {

    e.preventDefault()
    setStep1Expanded(false)
    setStep2Expanded(false)
    if (!url) {
      alert('Please enter a URL')
      return
    }

    onTestStart()

    try {
      const formData = new FormData()
      formData.append('url', url)
      formData.append('username', username)
      formData.append('password', password)

      // Add AI options if provided
      if (aiOptions) {
        formData.append('aiOptions', JSON.stringify(aiOptions))
      }

      // Add NLP description if provided
      if (nlpDescription) {
        formData.append('nlpDescription', nlpDescription)
      }

      if (testFile) {
        formData.append('testFile', testFile)
      }

      // Use AI endpoint if AI options are provided, otherwise use original endpoint
      const endpoint = aiOptions ? '/api/tests/ai-run' : '/api/tests/run'

      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const results = await response.json()
      onTestComplete(results)
    } catch (error) {
      console.error('Error running tests:', error)
      onTestComplete({
        success: false,
        testsPassed: 0,
        testsFailed: 0,
        totalTests: 0,
        details: [],
        errors: [error instanceof Error ? error.message : 'Failed to run tests'],
      })
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      setTestFile(files[0])
    }
  }

  return (
    <div className="test-form-container">
      <div className="form-header">
        <h2>Configure Test</h2>
        <p>Set up your testing parameters and options</p>
      </div>

      <form onSubmit={handleSubmit} className="test-form">
        {/* Main Test Configuration */}
        <div className="form-section">
          {aiEnabled && (
            <div
              className="section-header clickable"
              onClick={() => setStep1Expanded(!step1Expanded)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  setStep1Expanded(!step1Expanded)
                }
              }}
              aria-expanded={step1Expanded}
            >
              <span className="step-badge">Step 1</span>
              <h3>Add Target Configuration</h3>
              <span className={`collapse-icon ${step1Expanded ? 'expanded' : ''}`}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </div>
          )}
          {(step1Expanded || !aiEnabled) && (
            <>
              <div className="form-group">
                <label htmlFor="url">
                  Website URL <span className="required">*</span>
                </label>
                <input
                  type="url"
                  id="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="username">Username (optional)</label>
                  <input
                    type="text"
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter username"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="password">Password (optional)</label>
                  <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="testFile">Custom Test File (optional)</label>
                <div className="file-input-wrapper">
                  <input
                    type="file"
                    id="testFile"
                    onChange={handleFileChange}
                    accept=".json,.js,.txt"
                    className="file-input"
                  />
                  <label htmlFor="testFile" className="file-input-label">
                    Choose a file or drag here
                  </label>
                </div>
                {testFile && (
                  <div className="file-info-container">
                    <div className="file-info">
                      <span className="file-details">
                        {testFile.name} ({Math.round(testFile.size / 1024)}KB)
                      </span>
                      <button
                        type="button"
                        className="file-remove-btn"
                        onClick={() => setTestFile(null)}
                        aria-label="Remove file"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                )}
                <small className="form-hint">
                  Select one file in JSON, JavaScript, or plain text format
                </small>
              </div>
            </>
          )}
        </div>

        {/* NLP Section - Integrated */}
        {aiEnabled && aiOptions && onNlpChange && onAiOptionToggle && (
          <div>
            <div
              className="section-header clickable"
              onClick={() => setStep2Expanded(!step2Expanded)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  setStep2Expanded(!step2Expanded)
                }
              }}
              aria-expanded={step2Expanded}
            >
              <span className="step-badge">Step 2</span>
              <h3>Add Natural Language Test Description</h3>
              <span className={`collapse-icon ${step2Expanded ? 'expanded' : ''}`}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </div>
            {step2Expanded && (
              <>
                <p className="options-label">Add Description</p>
                <div className="form-group">
                  <textarea
                    id="nlpInput"
                    className="nlp-textarea"
                    placeholder="Describe your tests in plain English: 'Test the login flow with invalid credentials and verify error messages appear correctly'"
                    value={nlpDescription || ''}
                    onChange={(e) => onNlpChange(e.target.value)}
                    rows={4}
                  />

                </div>
                <p className="options-label">Use AI Options</p>

                <div className="ai-options">
                  <div className="ai-options-grid">
                    {Object.entries(aiOptions).map(([key, value]) => (
                      <div key={key} className="ai-option-wrapper">
                        <button
                          type="button"
                          className={`ai-option-toggle ${value ? 'active' : ''}`}
                          onClick={() => onAiOptionToggle(key)}
                          aria-label={`${key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} - ${aiOptionDescriptions[key]}`}
                        >
                          <span className="toggle-indicator"></span>
                          <span className="toggle-label">
                            {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                          </span>
                          <span className="info-icon" aria-hidden="true">
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                              <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
                              <path d="M8 7V11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                              <circle cx="8" cy="5" r="0.5" fill="currentColor" />
                            </svg>
                          </span>
                        </button>
                        <div className="ai-option-tooltip" role="tooltip" aria-hidden="true">
                          {aiOptionDescriptions[key]}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Submit Button */}
        <button type="submit" className="submit-button">
          Run Tests
        </button>
      </form>
    </div>
  )
}

export default TestForm

