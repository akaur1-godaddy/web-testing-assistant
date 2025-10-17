import { useState } from 'react'
import './TestResults.css'
import { TestResult } from '../App'

interface TestResultsProps {
  results: TestResult
}

function TestResults({ results }: TestResultsProps) {
  const [expandedScreenshot, setExpandedScreenshot] = useState<number | null>(null)
  const successRate = results.totalTests > 0 
    ? Math.round((results.testsPassed / results.totalTests) * 100) 
    : 0

  return (
    <div className="test-results-container">
      <div className="results-header">
        <h2>📊 Test Results</h2>
        <div className={`status-badge ${results.success ? 'success' : 'failure'}`}>
          {results.success ? '✅ All Tests Passed' : '❌ Some Tests Failed'}
        </div>
      </div>

      <div className="results-summary">
        <div className="summary-card">
          <div className="summary-number">{results.totalTests}</div>
          <div className="summary-label">Total Tests</div>
        </div>
        <div className="summary-card success">
          <div className="summary-number">{results.testsPassed}</div>
          <div className="summary-label">Passed</div>
        </div>
        <div className="summary-card failure">
          <div className="summary-number">{results.testsFailed}</div>
          <div className="summary-label">Failed</div>
        </div>
        <div className="summary-card">
          <div className="summary-number">{successRate}%</div>
          <div className="summary-label">Success Rate</div>
        </div>
      </div>

      {results.performance && (
        <div className="performance-section">
          <h3>⚡ Performance Metrics</h3>
          <div className="performance-grid">
            <div className="metric">
              <span className="metric-label">Load Time:</span>
              <span className="metric-value">{results.performance.loadTime}ms</span>
            </div>
            <div className="metric">
              <span className="metric-label">DOM Content Loaded:</span>
              <span className="metric-value">{results.performance.domContentLoaded}ms</span>
            </div>
          </div>
        </div>
      )}

      {results.devTools && (
        <div className="devtools-section">
          <h3>🔧 Chrome DevTools Analysis</h3>
          
          {/* Core Web Vitals */}
          {results.devTools.performance && (
            <div className="devtools-card">
              <h4>⚡ Core Web Vitals</h4>
              <div className="performance-grid">
                {results.devTools.performance.firstContentfulPaint && (
                  <div className="metric">
                    <span className="metric-label">First Contentful Paint:</span>
                    <span className="metric-value">{Math.round(results.devTools.performance.firstContentfulPaint)}ms</span>
                  </div>
                )}
                {results.devTools.performance.largestContentfulPaint && (
                  <div className="metric">
                    <span className="metric-label">Largest Contentful Paint:</span>
                    <span className="metric-value">{Math.round(results.devTools.performance.largestContentfulPaint)}ms</span>
                  </div>
                )}
                {results.devTools.performance.cumulativeLayoutShift !== undefined && (
                  <div className="metric">
                    <span className="metric-label">Cumulative Layout Shift:</span>
                    <span className="metric-value">{results.devTools.performance.cumulativeLayoutShift.toFixed(3)}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Accessibility */}
          {results.devTools.accessibility && (
            <div className="devtools-card">
              <h4>♿ Accessibility Score</h4>
              <div className="accessibility-score" style={{
                fontSize: '48px',
                fontWeight: 'bold',
                color: results.devTools.accessibility.score >= 90 ? '#28a745' :
                       results.devTools.accessibility.score >= 70 ? '#ffc107' : '#dc3545'
              }}>
                {results.devTools.accessibility.score}/100
              </div>
              {results.devTools.accessibility.issues.length > 0 && (
                <div className="accessibility-issues">
                  <h5>Issues Found:</h5>
                  <ul>
                    {results.devTools.accessibility.issues.map((issue, idx) => (
                      <li key={idx} className={`issue-${issue.impact}`}>
                        <span className="issue-impact">{issue.impact.toUpperCase()}</span>
                        <span className="issue-description">{issue.description}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Network */}
          {results.devTools.network && (
            <div className="devtools-card">
              <h4>🌐 Network Analysis</h4>
              <div className="performance-grid">
                <div className="metric">
                  <span className="metric-label">Total Requests:</span>
                  <span className="metric-value">{results.devTools.network.totalRequests}</span>
                </div>
                <div className="metric">
                  <span className="metric-label">Failed Requests:</span>
                  <span className="metric-value" style={{color: results.devTools.network.failedRequests > 0 ? '#dc3545' : '#28a745'}}>
                    {results.devTools.network.failedRequests}
                  </span>
                </div>
              </div>
              {results.devTools.network.slowestResource && (
                <div className="slowest-resource">
                  <p><strong>Slowest Resource:</strong></p>
                  <p style={{fontSize: '12px', wordBreak: 'break-all'}}>{results.devTools.network.slowestResource.url}</p>
                  <p>Duration: {results.devTools.network.slowestResource.duration}ms</p>
                </div>
              )}
            </div>
          )}

          {/* Console */}
          {results.devTools.console && (results.devTools.console.errors.length > 0 || results.devTools.console.warnings.length > 0) && (
            <div className="devtools-card">
              <h4>📋 Console Messages</h4>
              {results.devTools.console.errors.length > 0 && (
                <div className="console-errors">
                  <h5 style={{color: '#dc3545'}}>❌ Errors ({results.devTools.console.errors.length})</h5>
                  <ul>
                    {results.devTools.console.errors.slice(0, 5).map((error, idx) => (
                      <li key={idx} style={{fontSize: '12px', color: '#dc3545'}}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}
              {results.devTools.console.warnings.length > 0 && (
                <div className="console-warnings">
                  <h5 style={{color: '#ffc107'}}>⚠️ Warnings ({results.devTools.console.warnings.length})</h5>
                  <ul>
                    {results.devTools.console.warnings.slice(0, 5).map((warning, idx) => (
                      <li key={idx} style={{fontSize: '12px', color: '#856404'}}>{warning}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div className="test-details">
        <h3>📝 Test Details</h3>
        {results.details.length > 0 ? (
          <ul className="test-list">
            {results.details.map((test, index) => (
              <li key={index} className={`test-item ${test.status}`}>
                <div className="test-item-header">
                  <span className="test-icon">
                    {test.status === 'passed' ? '✅' : '❌'}
                  </span>
                  <span className="test-name">{test.name}</span>
                  {test.duration && (
                    <span className="test-duration">{test.duration}ms</span>
                  )}
                </div>
                {test.message && (
                  <div className="test-message">{test.message}</div>
                )}
                {test.screenshot && (
                  <div className="test-screenshot">
                    {expandedScreenshot === index ? (
                      <div className="screenshot-expanded" onClick={() => setExpandedScreenshot(null)}>
                        <img 
                          src={test.screenshot} 
                          alt="Screenshot of failure" 
                          style={{ 
                            maxWidth: '100%', 
                            marginTop: '10px', 
                            borderRadius: '4px', 
                            border: '3px solid #dc3545',
                            cursor: 'zoom-out'
                          }}
                        />
                        <p style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                          🔍 Click to collapse
                        </p>
                      </div>
                    ) : (
                      <div className="screenshot-thumbnail" onClick={() => setExpandedScreenshot(index)}>
                        <img 
                          src={test.screenshot} 
                          alt="Screenshot thumbnail" 
                          style={{ 
                            width: '150px', 
                            height: 'auto', 
                            marginTop: '10px', 
                            borderRadius: '4px', 
                            border: '2px solid #dc3545',
                            cursor: 'zoom-in',
                            transition: 'transform 0.2s'
                          }}
                          onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                          onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                        />
                        <p style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                          📸 Click to view full screenshot
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="no-details">No test details available</p>
        )}
      </div>

      {results.errors && results.errors.length > 0 && (
        <div className="errors-section">
          <h3>⚠️ Errors</h3>
          <ul className="error-list">
            {results.errors.map((error, index) => (
              <li key={index} className="error-item">{error}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export default TestResults

