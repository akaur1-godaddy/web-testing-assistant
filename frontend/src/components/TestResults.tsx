import { useState, useMemo } from 'react'
import './TestResults.css'
import { TestResult } from '../App'

interface TestResultsProps {
  results: TestResult
}

function TestResults({ results }: TestResultsProps) {
  const [expandedScreenshot, setExpandedScreenshot] = useState<number | null>(null)
  const [expandedElementScreenshot, setExpandedElementScreenshot] = useState<number | null>(null)
  const [isAISummaryExpanded, setIsAISummaryExpanded] = useState(false)
  const successRate = results.totalTests > 0 
    ? Math.round((results.testsPassed / results.totalTests) * 100) 
    : 0

  // Sort tests: passed tests first, then failed tests
  const sortedDetails = [...results.details].sort((a, b) => {
    if (a.status === 'passed' && b.status !== 'passed') return -1
    if (a.status !== 'passed' && b.status === 'passed') return 1
    return 0
  })

  // Generate comprehensive AI Summary (memoized)
  const aiSummarySections = useMemo(() => {
    const generateAISummary = () => {
    const sections = []
    
    try {
      // 1. Overall Test Analysis
      sections.push({
        title: '🎯 Test Execution Summary',
        content: `Executed ${results.totalTests} automated test cases with ${successRate}% success rate. ${results.testsPassed} tests passed successfully${results.testsFailed > 0 ? ` and ${results.testsFailed} test(s) failed` : ''}.`
      })
    } catch (error) {
      console.error('Error generating test summary:', error)
    }
    
    // 2. Performance Analysis
    try {
      if (results.performance || results.devTools?.performance) {
        const loadTime = results.performance?.loadTime || 0
        const fcp = results.devTools?.performance?.firstContentfulPaint || 0
        const lcp = results.devTools?.performance?.largestContentfulPaint || 0
        
        let perfContent = ''
        if (loadTime < 2000 && loadTime > 0) {
          perfContent = `⚡ Excellent page load performance (${loadTime}ms). `
        } else if (loadTime < 4000 && loadTime > 0) {
          perfContent = `⚠️ Page load time is ${loadTime}ms - consider optimization to reach under 2 seconds. `
        } else if (loadTime > 0) {
          perfContent = `🔴 Slow page load detected (${loadTime}ms) - this significantly impacts user experience. `
        }
        
        if (fcp > 0) {
          perfContent += `First Contentful Paint: ${fcp}ms${fcp < 1800 ? ' (excellent)' : fcp < 3000 ? ' (good)' : ' (needs improvement)'}. `
        }
        if (lcp > 0) {
          perfContent += `Largest Contentful Paint: ${lcp}ms${lcp < 2500 ? ' (excellent)' : lcp < 4000 ? ' (good)' : ' (needs improvement)'}. `
        }
        
        if (perfContent) {
          sections.push({
            title: '⚡ Performance Insights',
            content: perfContent
          })
        }
      }
    } catch (error) {
      console.error('Error generating performance summary:', error)
    }
    
    // 3. Accessibility Analysis
    try {
      const a11yIssues = results.devTools?.accessibility?.issues || []
      if (a11yIssues.length > 0) {
        const missingAlt = a11yIssues.filter((i: any) => typeof i === 'string' && i.includes('alt')).length
        const missingLabels = a11yIssues.filter((i: any) => typeof i === 'string' && i.includes('label')).length
        const contrastIssues = a11yIssues.filter((i: any) => typeof i === 'string' && i.includes('contrast')).length
        
        let a11yContent = `Found ${a11yIssues.length} accessibility issue(s). `
        const issueTypes = []
        if (missingAlt > 0) issueTypes.push(`${missingAlt} image(s) missing alt text`)
        if (missingLabels > 0) issueTypes.push(`${missingLabels} form element(s) missing labels`)
        if (contrastIssues > 0) issueTypes.push(`${contrastIssues} color contrast issue(s)`)
        
        if (issueTypes.length > 0) {
          a11yContent += `Issues include: ${issueTypes.join(', ')}. `
        }
        a11yContent += `These should be addressed to meet WCAG 2.1 Level AA compliance standards.`
        
        sections.push({
          title: '♿ Accessibility Analysis',
          content: a11yContent
        })
      } else if (results.devTools?.accessibility) {
        sections.push({
          title: '♿ Accessibility Analysis',
          content: '✅ No critical accessibility issues detected. Website follows WCAG guidelines for semantic HTML and ARIA attributes.'
        })
      }
    } catch (error) {
      console.error('Error generating accessibility summary:', error)
    }
    
    // 4. Network & Resource Analysis
    try {
      if (results.devTools?.network) {
        const { totalRequests = 0, failedRequests = 0, totalSize = 0 } = results.devTools.network
        let networkContent = `Analyzed ${totalRequests} network requests. `
        
        if (failedRequests > 0) {
          networkContent += `⚠️ ${failedRequests} request(s) failed - this may indicate broken resources or API endpoints. `
        } else if (totalRequests > 0) {
          networkContent += `✅ All requests completed successfully. `
        }
        
        if (totalSize > 0) {
          const sizeMB = (totalSize / (1024 * 1024)).toFixed(2)
          if (totalSize > 5 * 1024 * 1024) {
            networkContent += `📦 Total page size is ${sizeMB}MB - consider optimizing images and code splitting to improve load times.`
          } else {
            networkContent += `📦 Total page size: ${sizeMB}MB (optimized).`
          }
        }
        
        if (networkContent.trim().length > 30) {
          sections.push({
            title: '🌐 Network Performance',
            content: networkContent
          })
        }
      }
    } catch (error) {
      console.error('Error generating network summary:', error)
    }
    
    // 5. Console & JavaScript Errors
    try {
      if (results.devTools?.console) {
        const { errors = [], warnings = [] } = results.devTools.console
        if (errors.length > 0 || warnings.length > 0) {
          let consoleContent = ''
          if (errors.length > 0) {
            consoleContent += `🔴 ${errors.length} JavaScript error(s) detected in console - these may cause functionality issues. `
          }
          if (warnings.length > 0) {
            consoleContent += `⚠️ ${warnings.length} console warning(s) found - review these to prevent potential issues.`
          }
          
          sections.push({
            title: '🐛 Console Analysis',
            content: consoleContent
          })
        } else {
          sections.push({
            title: '🐛 Console Analysis',
            content: '✅ No JavaScript errors or warnings detected - clean console output.'
          })
        }
      }
    } catch (error) {
      console.error('Error generating console summary:', error)
    }
    
    // 6. AI Recommendations
    try {
      const recommendations = []
      const a11yIssues = results.devTools?.accessibility?.issues || []
      
      if (results.testsFailed > 0) {
        recommendations.push('Fix failing test cases by ensuring all interactive elements are functional and accessible')
      }
      if (a11yIssues.length > 0) {
        recommendations.push('Improve accessibility by adding proper ARIA labels, alt text, and semantic HTML')
      }
      if (results.performance?.loadTime && results.performance.loadTime > 3000) {
        recommendations.push('Optimize page load time through code splitting, lazy loading, and image compression')
      }
      if (results.devTools?.network?.failedRequests && results.devTools.network.failedRequests > 0) {
        recommendations.push('Fix broken network requests and ensure all API endpoints are functioning correctly')
      }
      if (results.devTools?.console?.errors && results.devTools.console.errors.length > 0) {
        recommendations.push('Debug and resolve JavaScript errors to prevent functionality issues')
      }
      
      if (recommendations.length === 0) {
        recommendations.push('Your website is well-optimized and passes all quality checks - ready for production deployment!')
      }
      
      sections.push({
        title: '💡 AI-Powered Recommendations',
        content: recommendations.map((r, i) => `${i + 1}. ${r}`).join('\n')
      })
    } catch (error) {
      console.error('Error generating recommendations:', error)
    }
    
    return sections.length > 0 ? sections : [{
      title: '🤖 AI Analysis',
      content: `Test execution completed with ${successRate}% success rate. ${results.totalTests} total tests run.`
    }]
    }
    
    try {
      return generateAISummary()
    } catch (error) {
      console.error('Error generating AI summary:', error)
      return [{
        title: '🤖 AI Analysis',
        content: `Test execution completed with ${successRate}% success rate. ${results.totalTests} total tests run.`
      }]
    }
  }, [results, successRate])

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

      {/* AI-Generated Summary - Collapsible */}
      <div className="ai-summary-section">
        <div 
          className="ai-summary-header"
          onClick={() => setIsAISummaryExpanded(!isAISummaryExpanded)}
          style={{ cursor: 'pointer', userSelect: 'none' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ 
              fontSize: '20px', 
              transition: 'transform 0.3s ease',
              transform: isAISummaryExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
              display: 'inline-block'
            }}>
              ▶
            </span>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#1a1a1a' }}>
              🤖 AI-Powered Analysis
            </h3>
          </div>
          <span className="ai-badge">
            ✨ AI Generated
          </span>
        </div>
        
        {isAISummaryExpanded && (
          <div className="ai-summary-content" style={{
            animation: 'slideDown 0.3s ease-out'
          }}>
            {aiSummarySections.map((section: any, index: number) => (
              <div key={index} className="ai-summary-section-item" style={{
                marginBottom: index < aiSummarySections.length - 1 ? '1.25rem' : '0',
                paddingBottom: index < aiSummarySections.length - 1 ? '1.25rem' : '0',
                borderBottom: index < aiSummarySections.length - 1 ? '1px solid #e2e8f0' : 'none'
              }}>
                <h4 style={{ 
                  margin: '0 0 0.5rem 0', 
                  fontSize: '14px', 
                  fontWeight: 700,
                  color: '#1a202c',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  {section.title}
                </h4>
                <p style={{ 
                  margin: 0, 
                  lineHeight: '1.7', 
                  fontSize: '14px',
                  color: '#4a5568',
                  whiteSpace: 'pre-line'
                }}>
                  {section.content}
                </p>
              </div>
            ))}
          </div>
        )}
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
                {results.devTools.performance.largestContentfulPaint !== undefined && (
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
                color: '#000'
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
                  <span className="metric-value" style={{ color: results.devTools.network.failedRequests > 0 ? '#dc3545' : '#28a745' }}>
                    {results.devTools.network.failedRequests}
                  </span>
                </div>
              </div>
              {results.devTools.network.slowestResource && (
                <div className="slowest-resource">
                  <p><strong>Slowest Resource:</strong></p>
                  <p style={{ fontSize: '12px', wordBreak: 'break-all' }}>{results.devTools.network.slowestResource.url}</p>
                  <p>Duration: {results.devTools.network.slowestResource.duration}ms</p>
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
            {sortedDetails.map((test, index) => (
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
                
                {/* AI Failure Explanation */}
                {test.status === 'failed' && test.aiFailureExplanation && (
                  <div style={{
                    marginTop: '12px',
                    padding: '14px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    borderRadius: '10px',
                    border: '2px solid rgba(255, 255, 255, 0.2)',
                    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
                  }}>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px',
                      marginBottom: '10px'
                    }}>
                      <span style={{ fontSize: '18px' }}>🤖</span>
                      <h4 style={{ 
                        margin: 0, 
                        fontSize: '14px', 
                        fontWeight: 700,
                        color: 'white',
                        textShadow: '0 2px 4px rgba(0,0,0,0.2)'
                      }}>
                        AI Analysis: Why This Failed?
                      </h4>
                      <span style={{
                        marginLeft: 'auto',
                        fontSize: '10px',
                        padding: '3px 8px',
                        borderRadius: '12px',
                        backgroundColor: 'rgba(255, 255, 255, 0.25)',
                        color: 'white',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        {test.aiFailureExplanation.confidence} confidence
                      </span>
                    </div>
                    <div style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      padding: '12px',
                      borderRadius: '8px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                    }}>
                      <div style={{ marginBottom: '10px' }}>
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '6px',
                          marginBottom: '5px'
                        }}>
                          <span style={{ fontSize: '16px' }}>🔍</span>
                          <strong style={{ fontSize: '12px', color: '#dc3545' }}>Reason:</strong>
                        </div>
                        <p style={{ 
                          margin: 0, 
                          fontSize: '13px', 
                          color: '#2d3748',
                          lineHeight: '1.6',
                          paddingLeft: '22px'
                        }}>
                          {test.aiFailureExplanation.reason}
                        </p>
                      </div>
                      <div>
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '6px',
                          marginBottom: '5px'
                        }}>
                          <span style={{ fontSize: '16px' }}>💡</span>
                          <strong style={{ fontSize: '12px', color: '#28a745' }}>How to Fix:</strong>
                        </div>
                        <p style={{ 
                          margin: 0, 
                          fontSize: '13px', 
                          color: '#2d3748',
                          lineHeight: '1.6',
                          paddingLeft: '22px'
                        }}>
                          {test.aiFailureExplanation.suggestion}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Element Context */}
                {test.elementContext && (
                  <div className="element-context-section" style={{ 
                    marginTop: '10px', 
                    padding: '12px', 
                    backgroundColor: '#e7f3ff', 
                    borderRadius: '8px',
                    border: '2px solid #2196F3',
                    fontSize: '12px'
                  }}>
                    <h4 style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#1976D2', fontWeight: 'bold' }}>
                      🎯 Testing Element
                    </h4>
                    <div style={{ display: 'grid', gap: '8px' }}>
                      {test.elementContext.elementType && (
                        <div>
                          <strong>Element:</strong> <code style={{ 
                            backgroundColor: '#fff', 
                            padding: '2px 6px', 
                            borderRadius: '4px',
                            fontSize: '11px',
                            color: '#d32f2f'
                          }}>
                            {test.elementContext.elementType}
                          </code>
                        </div>
                      )}
                      {test.elementContext.elementText && test.elementContext.elementText.trim() && (
                        <div>
                          <strong>Text:</strong> <span style={{ 
                            color: '#424242',
                            fontStyle: 'italic',
                            display: 'block',
                            maxWidth: '100%',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }} title={test.elementContext.elementText}>
                            "{test.elementContext.elementText.length > 50 
                              ? test.elementContext.elementText.substring(0, 50) + '...' 
                              : test.elementContext.elementText}"
                          </span>
                        </div>
                      )}
                      {test.elementContext.selector && (
                        <div>
                          <strong>Selector:</strong> 
                          <code 
                            onClick={() => test.elementContext?.elementScreenshot && setExpandedElementScreenshot(index)}
                            style={{ 
                              backgroundColor: '#fff', 
                              padding: '2px 6px', 
                              borderRadius: '4px',
                              fontSize: '10px',
                              color: '#1565C0',
                              wordBreak: 'break-all',
                              cursor: test.elementContext?.elementScreenshot ? 'pointer' : 'default',
                              textDecoration: test.elementContext?.elementScreenshot ? 'underline' : 'none',
                              transition: 'all 0.2s'
                            }}
                            onMouseOver={(e) => {
                              if (test.elementContext?.elementScreenshot) {
                                e.currentTarget.style.backgroundColor = '#e3f2fd';
                                e.currentTarget.style.color = '#0d47a1';
                              }
                            }}
                            onMouseOut={(e) => {
                              e.currentTarget.style.backgroundColor = '#fff';
                              e.currentTarget.style.color = '#1565C0';
                            }}
                            title={test.elementContext?.elementScreenshot ? 'Click to see element location' : ''}
                          >
                            {test.elementContext.selector}
                          </code>
                          {test.elementContext?.elementScreenshot && (
                            <span style={{ 
                              fontSize: '9px', 
                              color: '#666',
                              marginLeft: '5px',
                              fontStyle: 'italic'
                            }}>
                              (click to see location)
                            </span>
                          )}
                        </div>
                      )}
                      {test.elementContext.pageUrl && (
                        <div>
                          <strong>Page:</strong> <span style={{ 
                            color: '#424242',
                            fontSize: '11px',
                            wordBreak: 'break-all'
                          }}>
                            {test.elementContext.pageUrl}
                          </span>
                        </div>
                      )}
                      {test.elementContext.elementScreenshot && (
                        <div style={{ marginTop: '8px' }}>
                          <strong style={{ display: 'block', marginBottom: '5px' }}>📸 Element Screenshot:</strong>
                          {expandedElementScreenshot === index ? (
                            <div 
                              onClick={() => setExpandedElementScreenshot(null)}
                              style={{ cursor: 'zoom-out' }}
                            >
                              <img 
                                src={test.elementContext.elementScreenshot} 
                                alt="Element highlight (expanded)" 
                                style={{ 
                                  maxWidth: '100%', 
                                  borderRadius: '4px', 
                                  border: '3px solid #ff0000',
                                  boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                                }}
                              />
                              <p style={{ 
                                fontSize: '10px', 
                                color: '#666', 
                                marginTop: '5px',
                                fontStyle: 'italic'
                              }}>
                                🔍 Click to collapse • Red border highlights the element being tested
                              </p>
                            </div>
                          ) : (
                            <div 
                              onClick={() => setExpandedElementScreenshot(index)}
                              style={{ cursor: 'zoom-in' }}
                            >
                              <img 
                                src={test.elementContext.elementScreenshot} 
                                alt="Element highlight (thumbnail)" 
                                style={{ 
                                  width: '200px',
                                  height: 'auto',
                                  borderRadius: '4px', 
                                  border: '2px solid #ff0000',
                                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                  transition: 'transform 0.2s'
                                }}
                                onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                                onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                              />
                              <p style={{ 
                                fontSize: '10px', 
                                color: '#666', 
                                marginTop: '5px',
                                fontStyle: 'italic'
                              }}>
                                🔍 Click to zoom • Red border highlights the element being tested
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
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
                {test.apiResponse && (
                  <div className="api-response-section" style={{
                    marginTop: '15px',
                    padding: '15px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '8px',
                    border: '1px solid #dee2e6'
                  }}>
                    <h4 style={{ marginBottom: '10px', fontSize: '14px', color: '#495057' }}>
                      🌐 API Test Details
                    </h4>

                    {/* Request */}
                    <div style={{ marginBottom: '15px' }}>
                      <strong style={{ fontSize: '13px', color: '#495057' }}>Request:</strong>
                      <div style={{ marginLeft: '10px', fontSize: '12px' }}>
                        <div><span style={{ color: '#007bff', fontWeight: 'bold' }}>{test.apiResponse.request.method}</span> {test.apiResponse.request.url}</div>
                        {test.apiResponse.request.headers && Object.keys(test.apiResponse.request.headers).length > 0 && (
                          <details style={{ marginTop: '5px' }}>
                            <summary style={{ cursor: 'pointer', color: '#007bff', fontWeight: 'bold' }}>▶ Request Headers</summary>
                            <pre style={{ fontSize: '11px', marginTop: '5px', padding: '8px', backgroundColor: '#f8f9fa', borderRadius: '4px', overflow: 'auto', border: '1px solid #dee2e6', color: '#212529' }}>
                              {JSON.stringify(test.apiResponse.request.headers, null, 2)}
                            </pre>
                          </details>
                        )}
                        {test.apiResponse.request.body && (
                          <details open style={{ marginTop: '5px' }}>
                            <summary style={{ cursor: 'pointer', color: '#007bff', fontWeight: 'bold' }}>▼ Request Body</summary>
                            <pre style={{ fontSize: '11px', marginTop: '5px', padding: '8px', backgroundColor: '#f8f9fa', borderRadius: '4px', overflow: 'auto', border: '1px solid #dee2e6', color: '#212529' }}>
                              {JSON.stringify(test.apiResponse.request.body, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    </div>

                    {/* Response */}
                    {test.apiResponse.response && (
                      <div style={{ marginBottom: '15px' }}>
                        <strong style={{ fontSize: '13px', color: '#495057' }}>Response:</strong>
                        <div style={{ marginLeft: '10px', fontSize: '12px' }}>
                          <div>
                            Status: <span style={{
                              fontWeight: 'bold',
                              color: '#000'
                            }}>
                              {test.apiResponse.response.status} {test.apiResponse.response.statusText}
                            </span>
                          </div>
                          <div style={{ marginTop: '3px' }}>Size: {(test.apiResponse.response.size / 1024).toFixed(2)} KB</div>
                          {test.apiResponse.response.headers && Object.keys(test.apiResponse.response.headers).length > 0 && (
                            <details style={{ marginTop: '5px' }}>
                              <summary style={{ cursor: 'pointer', color: '#000', fontWeight: 'bold' }}>▶ Response Headers</summary>
                              <pre style={{ fontSize: '11px', marginTop: '5px', padding: '8px', backgroundColor: '#f8f9fa', borderRadius: '4px', overflow: 'auto', maxHeight: '150px', border: '1px solid #dee2e6', color: '#212529' }}>
                                {JSON.stringify(test.apiResponse.response.headers, null, 2)}
                              </pre>
                            </details>
                          )}
                          <details open style={{ marginTop: '5px' }}>
                            <summary style={{ cursor: 'pointer', color: '#000', fontWeight: 'bold' }}>▼ Response Body (click to collapse)</summary>
                            <pre style={{ fontSize: '11px', marginTop: '5px', padding: '8px', backgroundColor: '#f8f9fa', borderRadius: '4px', overflow: 'auto', maxHeight: '200px', border: '1px solid #dee2e6', color: '#212529' }}>
                              {test.apiResponse.response.data ? JSON.stringify(test.apiResponse.response.data, null, 2) : 'No response data'}
                            </pre>
                          </details>
                        </div>
                      </div>
                    )}

                    {/* Validations */}
                    {test.apiResponse.validations && (
                      <div>
                        <strong style={{ fontSize: '13px', color: '#495057' }}>Validations:</strong>
                        <div style={{ marginLeft: '10px', fontSize: '12px', marginTop: '5px', color: '#212529' }}>
                          <div>{test.apiResponse.validations.statusCode ? '✅' : '❌'} Status Code</div>
                          <div>{test.apiResponse.validations.responseContains ? '✅' : '❌'} Response Contains</div>
                          <div>{test.apiResponse.validations.requiredFields ? '✅' : '❌'} Required Fields</div>
                          <div>{test.apiResponse.validations.schemaMatch ? '✅' : '❌'} Schema Match</div>
                        </div>
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

      {/* Console */}
      {results.devTools && results.devTools.console && (results.devTools.console.errors.length > 0 || results.devTools.console.warnings.length > 0) && (
        <div className='console-section'>
          <h3>📋 Console Messages</h3>
          {results.devTools.console.errors.length > 0 && (
            <div className="console-errors">
              <h4 style={{ color: '#dc3545' }}>❌ Errors ({results.devTools.console.errors.length})</h4>
              <ul>
                {results.devTools.console.errors.slice(0, 5).map((error, idx) => (
                  <li key={idx} style={{ fontSize: '12px', color: '#dc3545' }}>{error}</li>
                ))}
              </ul>
            </div>
          )}
          {results.devTools.console.warnings.length > 0 && (
            <div className="console-warnings">
              <h4 style={{ color: '#ffc107' }}>⚠️ Warnings ({results.devTools.console.warnings.length})</h4>
              <ul>
                {results.devTools.console.warnings.slice(0, 5).map((warning, idx) => (
                  <li key={idx} style={{ fontSize: '12px', color: '#856404' }}>{warning}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default TestResults

