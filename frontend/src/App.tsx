import { useState } from 'react'
import './App.css'
import TestForm from './components/TestForm'
import TestResults from './components/TestResults'

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
}

function App() {
  const [results, setResults] = useState<TestResult | null>(null)
  const [loading, setLoading] = useState(false)

  const handleTestComplete = (testResults: TestResult) => {
    setResults(testResults)
    setLoading(false)
  }

  const handleTestStart = () => {
    setLoading(true)
    setResults(null)
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>🚀 AutoQA AI</h1>
        <p>Automated Web Testing Assistant</p>
      </header>

      <main className="app-main">
        <TestForm 
          onTestStart={handleTestStart}
          onTestComplete={handleTestComplete}
        />

        {loading && (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Running tests... This may take a moment.</p>
          </div>
        )}

        {results && !loading && (
          <TestResults results={results} />
        )}
      </main>

      <footer className="app-footer">
        <p>Powered by Cursor MCP + DevTools™</p>
      </footer>
    </div>
  )
}

export default App

