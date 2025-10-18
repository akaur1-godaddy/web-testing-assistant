import { useState, FormEvent } from 'react'
import './TestForm.css'
import { TestResult } from '../App'

interface TestFormProps {
  onTestStart: () => void
  onTestComplete: (results: TestResult) => void
  aiOptions?: any
  nlpDescription?: string
}

function TestForm({ onTestStart, onTestComplete, aiOptions, nlpDescription }: TestFormProps) {
  const [url, setUrl] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [testFile, setTestFile] = useState<File | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    
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
      <h2>🧪 Configure Your Test</h2>
      <form onSubmit={handleSubmit} className="test-form">
        <div className="form-group">
          <label htmlFor="url">
            <span className="label-icon">🌐</span>
            Website URL *
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

        <div className="form-group">
          <label htmlFor="username">
            <span className="label-icon">👤</span>
            Username (optional)
          </label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter username for login"
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">
            <span className="label-icon">🔒</span>
            Password (optional)
          </label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password for login"
          />
        </div>

        <div className="form-group">
          <label htmlFor="testFile">
            <span className="label-icon">📁</span>
            Custom Test File (optional)
          </label>
          <input
            type="file"
            id="testFile"
            onChange={handleFileChange}
            accept=".json,.js,.txt"
          />
          {testFile && (
            <div className="file-info">
              Selected: {testFile.name} ({Math.round(testFile.size / 1024)}KB)
            </div>
          )}
          <small className="form-hint">
            Upload custom tests in JSON, JavaScript, or plain text format
          </small>
        </div>

        <button type="submit" className="submit-button">
          🚀 Run Tests
        </button>
      </form>
    </div>
  )
}

export default TestForm

