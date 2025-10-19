import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import './App.css'
import TestForm from './components/TestForm'
import TestResults from './components/TestResults'
import AIDashboard from './components/AIDashboard'
import VoiceInterface from './components/VoiceInterface'
import NavBar from './components/NavBar'
import Footer from './components/Footer'

export interface TestResult {
  success: boolean
  testsPassed: number
  testsFailed: number
  totalTests: number
  details: Array<{
    name: string
    status: 'passed' | 'failed'
    message?: string
    duration?: number
    screenshot?: string
    healed?: boolean
    healingInfo?: {
      strategy: string
      confidence: number
      explanation: string
    }
    apiResponse?: {
      request: {
        method: string
        url: string
        headers?: Record<string, string>
        body?: any
      }
      response?: {
        status: number
        statusText: string
        headers: Record<string, string>
        data: any
        size: number
      }
      validations?: {
        statusCode: boolean
        responseContains: boolean
        requiredFields: boolean
        schemaMatch: boolean
      }
    }
  }>
  errors?: string[]
  performance?: {
    loadTime: number
    domContentLoaded: number
  }
  devTools?: {
    performance: {
      loadTime: number
      domContentLoaded: number
      firstContentfulPaint?: number
      largestContentfulPaint?: number
      cumulativeLayoutShift?: number
    }
    accessibility: {
      score: number
      issues: Array<{
        id: string
        impact: 'critical' | 'serious' | 'moderate' | 'minor'
        description: string
        selector?: string
      }>
    }
    network: {
      totalRequests: number
      failedRequests: number
      totalSize: number
      slowestResource?: {
        url: string
        duration: number
      }
    }
    console: {
      errors: string[]
      warnings: string[]
    }
  }
  // Enhanced AI Features
  aiInsights?: any
  securityReport?: any
  accessibilityReport?: any
  visualAnalysis?: any
  predictions?: any
  healthStatus?: any
  aiMetadata?: {
    version: string
    aiServicesUsed: string[]
    confidenceScore: number
    processingTime: number
  }
}

interface VoiceCommand {
  text: string
  intent: string
  entities: { [key: string]: string }
  confidence: number
}

function App() {
  const [results, setResults] = useState<TestResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [currentView, setCurrentView] = useState<'testing' | 'dashboard'>('testing')
  const [aiEnabled, setAiEnabled] = useState(true)
  const [voiceEnabled, setVoiceEnabled] = useState(true)
  const [nlpDescription, setNlpDescription] = useState('')
  const [aiOptions, setAiOptions] = useState({
    useNLP: false,
    generateEdgeCases: true,
    generateTestData: true,
    securityScan: true,
    enhancedA11y: true,
    visualAI: true,
    predictiveAnalytics: true,
    realtimeMonitoring: true,
    selfHealing: true,
  })

  useEffect(() => {
    // Initialize AI services health check
    checkAIServicesHealth()
  }, [])

  const checkAIServicesHealth = async () => {
    try {
      const response = await fetch('/api/tests/health')
      const health = await response.json()
      console.log('🤖 AI Services Health:', health)
    } catch (error) {
      console.warn('⚠️ AI Services health check failed:', error)
    }
  }

  const handleTestComplete = (testResults: TestResult) => {
    setResults(testResults)
    setLoading(false)

    // Announce results via voice if enabled
    if (voiceEnabled && testResults.aiMetadata?.confidenceScore) {
      const confidence = Math.round(testResults.aiMetadata.confidenceScore * 100)
      speakResult(`Test completed with ${confidence}% AI confidence. ${testResults.testsPassed} tests passed, ${testResults.testsFailed} tests failed.`)
    }
  }

  const handleTestStart = () => {
    setLoading(true)
    setResults(null)

    if (voiceEnabled) {
      speakResult('Starting comprehensive AI test suite')
    }
  }

  const handleVoiceCommand = async (command: VoiceCommand) => {
    console.log('🎤 Voice command received:', command)

    switch (command.intent) {
      case 'run_test':
        if (command.entities.target) {
          // Run test on specific target
          await runAITest(command.entities.target)
        } else {
          // Show test form
          setCurrentView('testing')
        }
        break

      case 'show_results':
        setCurrentView('dashboard')
        break

      case 'generate_test':
        const testType = command.entities.type || 'comprehensive'
        setNlpDescription(`Generate ${testType} tests`)
        setAiOptions(prev => ({ ...prev, useNLP: true }))
        break

      case 'accessibility_test':
        setAiOptions(prev => ({
          ...prev,
          enhancedA11y: true,
          securityScan: false,
          visualAI: false
        }))
        break

      case 'performance_test':
        setAiOptions(prev => ({
          ...prev,
          predictiveAnalytics: true,
          realtimeMonitoring: true
        }))
        break

      case 'security_test':
        setAiOptions(prev => ({
          ...prev,
          securityScan: true,
          enhancedA11y: false
        }))
        break

      case 'visual_test':
        setAiOptions(prev => ({
          ...prev,
          visualAI: true
        }))
        break

      case 'help':
        setCurrentView('testing')
        break
    }
  }

  const runAITest = async (url: string) => {
    setLoading(true)
    setResults(null)

    try {
      const formData = new FormData()
      formData.append('url', url)
      formData.append('aiOptions', JSON.stringify(aiOptions))
      if (nlpDescription) {
        formData.append('nlpDescription', nlpDescription)
      }

      const response = await fetch('/api/tests/ai-run', {
        method: 'POST',
        body: formData,
      })

      const results = await response.json()
      setResults(results)
    } catch (error) {
      console.error('AI test execution failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const speakResult = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 0.9
      utterance.pitch = 1.0
      window.speechSynthesis.speak(utterance)
    }
  }

  const toggleAIOption = (option: keyof typeof aiOptions) => {
    setAiOptions(prev => ({
      ...prev,
      [option]: !prev[option]
    }))
  }

  return (
    <>
      <NavBar
        currentView={currentView}
        onViewChange={setCurrentView}
        aiEnabled={aiEnabled}
        voiceEnabled={voiceEnabled}
        onAiToggle={() => setAiEnabled(!aiEnabled)}
        onVoiceToggle={() => setVoiceEnabled(!voiceEnabled)}
      />

      <main className="app-main">
        <AnimatePresence mode="wait">
          {currentView === 'testing' && (
            <motion.div
              key="testing"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              transition={{ duration: 0.3 }}
            >
              {aiEnabled && (
                <div className="nlp-input-section">
                  <h3>🗣️ Natural Language Test Generation</h3>
                  <textarea
                    className="nlp-input"
                    placeholder="Describe your tests in plain English: 'Test the login flow with invalid credentials and check error messages'"
                    value={nlpDescription}
                    onChange={(e) => setNlpDescription(e.target.value)}
                    rows={3}
                  />

                  <div className="ai-options-grid">
                    {Object.entries(aiOptions).map(([key, value]) => (
                      <button
                        key={key}
                        className={`ai-toggle ${value ? 'enabled' : ''}`}
                        onClick={() => toggleAIOption(key as keyof typeof aiOptions)}
                      >
                        {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}: {value ? 'ON' : 'OFF'}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <TestForm
                onTestStart={handleTestStart}
                onTestComplete={handleTestComplete}
                aiOptions={aiEnabled ? aiOptions : undefined}
                nlpDescription={nlpDescription}
              />

              {loading && (
                <motion.div
                  className="loading-ai"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <div className="ai-spinner"></div>
                  <div className="loading-status">
                    🤖 AI Testing in Progress...
                  </div>
                  <div className="loading-substatus">
                    Running comprehensive analysis with machine learning
                  </div>
                </motion.div>
              )}

              {results && !loading && (
                <motion.div
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <TestResults results={results} />
                </motion.div>
              )}
            </motion.div>
          )}

          {currentView === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
            >
              <AIDashboard
                testResults={results}
                predictiveInsights={results?.predictions}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <Footer aiMetadata={results?.aiMetadata} />

      {/* Voice Interface */}
      {voiceEnabled && (
        <VoiceInterface
          onCommand={handleVoiceCommand}
          isEnabled={voiceEnabled}
        />
      )}
    </>
  )
}

export default App

