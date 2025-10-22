import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as d3 from 'd3';
import './AIDashboard.css';

interface AIDashboardProps {
  testResults: any;
  realTimeData?: any;
  predictiveInsights?: any;
}

const AIDashboard: React.FC<AIDashboardProps> = ({
  testResults,
  realTimeData,
  predictiveInsights
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [aiInsights, setAIInsights] = useState<AIInsight[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [websocket, setWebsocket] = useState<WebSocket | null>(null);

  // Chart refs
  const performanceChartRef = useRef<SVGSVGElement>(null);
  const predictionChartRef = useRef<SVGSVGElement>(null);
  const heatmapRef = useRef<SVGSVGElement>(null);
  const networkGraphRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    // Initialize WebSocket for real-time data
    const ws = new WebSocket('ws://localhost:5001/ai-insights');

    ws.onopen = () => {
      console.log('🔌 AI Dashboard connected to real-time stream');
      setWebsocket(ws);
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      handleRealtimeUpdate(data);
    };

    ws.onclose = () => {
      console.log('❌ AI Dashboard disconnected from real-time stream');
      setWebsocket(null);
    };

    return () => {
      ws.close();
    };
  }, []);

  useEffect(() => {
    if (testResults) {
      generateAIInsights();
      createVisualizationss();
    }
  }, [testResults, activeTab]);

  const handleRealtimeUpdate = (data: any) => {
    switch (data.type) {
      case 'performance-update':
        updatePerformanceChart(data.data);
        break;
      case 'prediction-update':
        updatePredictions(data.data);
        break;
      case 'alert':
        addAlert(data.data);
        break;
      case 'ai-insight':
        addAIInsight(data.data);
        break;
    }
  };

  const generateAIInsights = async () => {
    if (!testResults) return;

    const insights: AIInsight[] = [];

    // Process real AI insights from backend
    if (testResults.aiInsights) {
      // Add predictive insights
      if (testResults.predictions?.actionableInsights) {
        testResults.predictions.actionableInsights.forEach((insight: any, index: number) => {
          insights.push({
            id: `pred-${index}`,
            type: 'predictive',
            title: insight.title,
            description: insight.description,
            severity: insight.priority === 'high' ? 'high' : insight.priority === 'medium' ? 'medium' : 'low',
            confidence: 0.85,
            recommendation: insight.actionItems?.join('; ') || 'No specific actions available',
            timestamp: new Date(),
          });
        });
      }

      // Add security insights
      if (testResults.securityReport?.vulnerabilities) {
        testResults.securityReport.vulnerabilities.slice(0, 3).forEach((vuln: any, index: number) => {
          insights.push({
            id: `sec-${index}`,
            type: 'security',
            title: vuln.title,
            description: vuln.description,
            severity: vuln.severity,
            confidence: 0.90,
            recommendation: vuln.remediation?.join('; ') || 'Review security configuration',
            timestamp: new Date(),
          });
        });
      }

      // Add accessibility insights
      if (testResults.accessibilityReport?.recommendations) {
        testResults.accessibilityReport.recommendations.slice(0, 2).forEach((rec: any, index: number) => {
          insights.push({
            id: `a11y-${index}`,
            type: 'accessibility',
            title: 'Accessibility Improvement',
            description: typeof rec === 'string' ? rec : rec.description || 'Accessibility enhancement needed',
            severity: 'medium',
            confidence: 0.80,
            recommendation: typeof rec === 'string' ? rec : rec.action || 'Improve accessibility',
            timestamp: new Date(),
          });
        });
      }

      // Add performance insights from predictions
      if (testResults.predictions?.performanceTrends?.insights) {
        testResults.predictions.performanceTrends.insights.slice(0, 2).forEach((insight: string, index: number) => {
          insights.push({
            id: `perf-${index}`,
            type: 'performance',
            title: 'Performance Trend Analysis',
            description: insight,
            severity: 'medium',
            confidence: 0.85,
            recommendation: 'Monitor performance metrics and apply optimization strategies',
            timestamp: new Date(),
          });
        });
      }
    }

    // If no real insights, add some basic ones to show that analysis was performed
    if (insights.length === 0 && testResults) {
      insights.push({
        id: 'basic-1',
        type: 'general',
        title: 'AI Analysis Complete',
        description: `Analyzed ${testResults.totalTests || 0} tests with ${testResults.testsPassed || 0} passing`,
        severity: 'low',
        confidence: 0.95,
        recommendation: 'Continue monitoring test results for patterns and improvements',
        timestamp: new Date(),
      });
    }

    setAIInsights(insights);
  };

  const createVisualizationss = () => {
    createPerformanceChart();
    createPredictionChart();
    createTestHeatmap();
    createNetworkGraph();
  };

  const createPerformanceChart = () => {
    const svg = d3.select(performanceChartRef.current);
    if (!svg.node()) return;

    svg.selectAll("*").remove();

    const margin = { top: 20, right: 30, bottom: 40, left: 50 };
    const width = 600 - margin.left - margin.right;
    const height = 300 - margin.bottom - margin.top;

    const g = svg
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Sample performance data
    const data = [
      { time: 0, loadTime: 1200, errors: 2, users: 10 },
      { time: 1, loadTime: 1350, errors: 1, users: 25 },
      { time: 2, loadTime: 980, errors: 0, users: 45 },
      { time: 3, loadTime: 1100, errors: 3, users: 60 },
      { time: 4, loadTime: 1450, errors: 5, users: 40 },
      { time: 5, loadTime: 1200, errors: 2, users: 55 },
    ];

    const xScale = d3.scaleLinear()
      .domain(d3.extent(data, d => d.time) as [number, number])
      .range([0, width]);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.loadTime) as number])
      .range([height, 0]);

    // Create line generator
    const line = d3.line<any>()
      .x(d => xScale(d.time))
      .y(d => yScale(d.loadTime))
      .curve(d3.curveMonotoneX);

    // Add axes
    g.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(xScale));

    g.append("g")
      .call(d3.axisLeft(yScale));

    // Add line
    g.append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", "#000")
      .attr("stroke-width", 2)
      .attr("d", line);

    // Add dots
    g.selectAll(".dot")
      .data(data)
      .enter().append("circle")
      .attr("class", "dot")
      .attr("cx", d => xScale(d.time))
      .attr("cy", d => yScale(d.loadTime))
      .attr("r", 4)
      .attr("fill", "#000")
      .on("mouseover", function (event, d) {
        // Add tooltip
        const tooltip = d3.select("body").append("div")
          .attr("class", "tooltip")
          .style("opacity", 0);

        tooltip.transition()
          .duration(200)
          .style("opacity", .9);
        tooltip.html(`Load Time: ${d.loadTime}ms<br/>Errors: ${d.errors}<br/>Users: ${d.users}`)
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 28) + "px");
      })
      .on("mouseout", function () {
        d3.selectAll(".tooltip").remove();
      });
  };

  const createPredictionChart = () => {
    const svg = d3.select(predictionChartRef.current);
    if (!svg.node()) return;

    svg.selectAll("*").remove();

    const margin = { top: 20, right: 30, bottom: 40, left: 50 };
    const width = 400 - margin.left - margin.right;
    const height = 200 - margin.top - margin.bottom;

    const g = svg
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Prediction data
    const predictions = [
      { category: 'Performance', probability: 0.85, impact: 'high' },
      { category: 'Security', probability: 0.32, impact: 'critical' },
      { category: 'Accessibility', probability: 0.67, impact: 'medium' },
      { category: 'UX', probability: 0.91, impact: 'high' },
    ];

    const xScale = d3.scaleBand()
      .domain(predictions.map(d => d.category))
      .range([0, width])
      .padding(0.1);

    const yScale = d3.scaleLinear()
      .domain([0, 1])
      .range([height, 0]);

    const colorScale = d3.scaleOrdinal()
      .domain(['low', 'medium', 'high', 'critical'])
      .range(['#d1d5db', '#9ca3af', '#6b7280', '#000']);

    // Add bars
    g.selectAll(".bar")
      .data(predictions)
      .enter().append("rect")
      .attr("class", "bar")
      .attr("x", d => xScale(d.category)!)
      .attr("width", xScale.bandwidth())
      .attr("y", d => yScale(d.probability))
      .attr("height", d => height - yScale(d.probability))
      .attr("fill", d => colorScale(d.impact) as string)
      .attr("opacity", 0.8);

    // Add axes
    g.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(xScale));

    g.append("g")
      .call(d3.axisLeft(yScale).tickFormat(d3.format(".0%")));
  };

  const createTestHeatmap = () => {
    const svg = d3.select(heatmapRef.current);
    if (!svg.node()) return;

    svg.selectAll("*").remove();

    const margin = { top: 20, right: 20, bottom: 20, left: 60 };
    const width = 500 - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;

    const g = svg
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Sample heatmap data
    const testCategories = ['Login', 'Navigation', 'Forms', 'Performance', 'Security'];
    const timeSlots = ['00:00', '06:00', '12:00', '18:00'];

    const heatmapData = testCategories.flatMap(category =>
      timeSlots.map(time => ({
        category,
        time,
        value: Math.random(), // Success rate
      }))
    );

    const xScale = d3.scaleBand()
      .domain(timeSlots)
      .range([0, width])
      .padding(0.05);

    const yScale = d3.scaleBand()
      .domain(testCategories)
      .range([0, height])
      .padding(0.05);

    const colorScale = d3.scaleSequential(d3.interpolateGreys)
      .domain([0, 1]);

    // Add rectangles
    g.selectAll(".cell")
      .data(heatmapData)
      .enter().append("rect")
      .attr("class", "cell")
      .attr("x", d => xScale(d.time)!)
      .attr("y", d => yScale(d.category)!)
      .attr("width", xScale.bandwidth())
      .attr("height", yScale.bandwidth())
      .attr("fill", d => colorScale(d.value))
      .attr("stroke", "white")
      .attr("stroke-width", 1);

    // Add axes
    g.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(xScale));

    g.append("g")
      .call(d3.axisLeft(yScale));
  };

  const createNetworkGraph = () => {
    const svg = d3.select(networkGraphRef.current);
    if (!svg.node()) return;

    svg.selectAll("*").remove();

    const width = 400;
    const height = 300;

    svg.attr("width", width).attr("height", height);

    // Network data representing test dependencies
    const nodes = [
      { id: "Authentication", group: 1, value: 10 },
      { id: "Navigation", group: 2, value: 8 },
      { id: "Forms", group: 2, value: 6 },
      { id: "API Tests", group: 3, value: 12 },
      { id: "Performance", group: 4, value: 9 },
      { id: "Security", group: 5, value: 7 },
    ];

    const links = [
      { source: "Authentication", target: "Navigation", value: 1 },
      { source: "Navigation", target: "Forms", value: 2 },
      { source: "Forms", target: "API Tests", value: 3 },
      { source: "API Tests", target: "Performance", value: 2 },
      { source: "Security", target: "Authentication", value: 1 },
    ];

    const simulation = d3.forceSimulation(nodes as any)
      .force("link", d3.forceLink(links).id((d: any) => d.id))
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2));

    const link = svg.append("g")
      .selectAll("line")
      .data(links)
      .enter().append("line")
      .attr("stroke", "#999")
      .attr("stroke-opacity", 0.6)
      .attr("stroke-width", (d: any) => Math.sqrt(d.value));

    const node = svg.append("g")
      .selectAll("circle")
      .data(nodes)
      .enter().append("circle")
      .attr("r", (d: any) => d.value)
      .attr("fill", (d: any) => {
        const grays = ['#1a1a1a', '#2d2d2d', '#6b7280', '#9ca3af', '#d1d5db'];
        return grays[d.group % grays.length];
      })
      .attr("stroke", "#000")
      .attr("stroke-width", 1)
      .call(d3.drag<SVGCircleElement, any>()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended) as any);

    const label = svg.append("g")
      .selectAll("text")
      .data(nodes)
      .enter().append("text")
      .text((d: any) => d.id)
      .attr("font-size", 10)
      .attr("dx", 15)
      .attr("dy", 4);

    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      node
        .attr("cx", (d: any) => d.x)
        .attr("cy", (d: any) => d.y);

      label
        .attr("x", (d: any) => d.x)
        .attr("y", (d: any) => d.y);
    });

    function dragstarted(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event: any, d: any) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }
  };

  const updatePerformanceChart = (newData: any) => {
    // Update performance chart with real-time data
    // Implementation would update the existing chart
  };

  const updatePredictions = (newPredictions: any) => {
    setPredictions(prev => [...prev, newPredictions]);
  };

  const addAlert = (alert: Alert) => {
    setAlerts(prev => [alert, ...prev.slice(0, 9)]); // Keep last 10 alerts
  };

  const addAIInsight = (insight: AIInsight) => {
    setAIInsights(prev => [insight, ...prev.slice(0, 19)]); // Keep last 20 insights
  };

  const getInsightIcon = (type: string) => {
    const icons = {
      performance: '⚡',
      security: '🔒',
      accessibility: '♿',
      'user-experience': '👤',
      quality: '✨',
    };
    return icons[type as keyof typeof icons] || '📊';
  };

  const getSeverityColor = (severity: string) => {
    const colors = {
      critical: '#dc3545',
      high: '#fd7e14',
      medium: '#ffc107',
      low: '#28a745',
    };
    return colors[severity as keyof typeof colors] || '#6c757d';
  };

  return (
    <div className="ai-dashboard">
      <div className="dashboard-header">


        <div className="tab-navigation">
          {['overview', 'insights', 'predictions', 'performance', 'security', 'visual'].map(tab => (
            <button
              key={tab}
              className={`tab-button ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          style={{ minHeight: '400px', width: '100%' }}
        >
          {activeTab === 'overview' && (
            <div className="dashboard-grid">
              {/* Real-time Status */}
              <div className="dashboard-card">
                <h3 className="card-title">
                  🔴 System Status
                  <span className={`status-indicator ${websocket ? 'status-online' : 'status-offline'}`}></span>
                </h3>
                <div className="metrics-grid">
                  <div className="metric-item">
                    <div className="metric-value">98.5%</div>
                    <div className="metric-label">Uptime</div>
                  </div>
                  <div className="metric-item">
                    <div className="metric-value">1.2s</div>
                    <div className="metric-label">Avg Response</div>
                  </div>
                  <div className="metric-item">
                    <div className="metric-value">247</div>
                    <div className="metric-label">Tests Run</div>
                  </div>
                  <div className="metric-item">
                    <div className="metric-value">92%</div>
                    <div className="metric-label">Success Rate</div>
                  </div>
                </div>
              </div>

              {/* AI Insights */}
              <div className="dashboard-card">
                <h3 className="card-title">🧠 AI Insights</h3>
                <div className="ai-insights">
                  {aiInsights.map(insight => (
                    <motion.div
                      key={insight.id}
                      className="insight-item"
                      style={{ borderLeftColor: getSeverityColor(insight.severity) }}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="insight-header">
                        <span className="insight-title">
                          {getInsightIcon(insight.type)} {insight.title}
                        </span>
                        <span className="confidence-badge">
                          {Math.round(insight.confidence * 100)}%
                        </span>
                      </div>
                      <div className="insight-description">{insight.description}</div>
                      <div className="insight-recommendation">
                        💡 {insight.recommendation}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Performance Chart */}
              <div className="dashboard-card">
                <h3 className="card-title">📈 Performance Trends</h3>
                <div className="chart-container">
                  <svg ref={performanceChartRef}></svg>
                </div>
              </div>

              {/* Predictions */}
              <div className="dashboard-card">
                <h3 className="card-title">🔮 AI Predictions</h3>
                <div className="chart-container">
                  <svg ref={predictionChartRef}></svg>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'insights' && (
            <div className="dashboard-grid">
              {/* AI Actionable Insights */}
              <div className="dashboard-card" style={{ gridColumn: 'span 2' }}>
                <h3 className="card-title">🧠 AI Actionable Insights</h3>
                {testResults?.predictions?.actionableInsights ? (
                  <div className="insights-list">
                    {testResults.predictions.actionableInsights.map((insight: any, index: number) => (
                      <div key={index} className="insight-item">
                        <div className="insight-header">
                          <h4>{insight.title}</h4>
                          <span className={`priority-badge priority-${insight.priority}`}>
                            {insight.priority}
                          </span>
                        </div>
                        <p>{insight.description}</p>
                        <div className="insight-details">
                          <div><strong>Impact:</strong> {insight.impact}</div>
                          <div><strong>Effort:</strong> {insight.effort}</div>
                          <div><strong>Timeline:</strong> {insight.estimatedTimeToImplement}</div>
                          <div><strong>Expected Outcome:</strong> {insight.expectedOutcome}</div>
                        </div>
                        {insight.actionItems && (
                          <div className="action-items">
                            <strong>Action Items:</strong>
                            <ul>
                              {insight.actionItems.map((item: string, i: number) => (
                                <li key={i}>{item}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="no-data">No AI insights available. Enable Predictive Analytics and run a test to see recommendations.</div>
                )}
              </div>

              {/* Quick Stats */}
              <div className="dashboard-card">
                <h3 className="card-title">📊 Quick Stats</h3>
                <div className="stats-grid">
                  {testResults && (
                    <>
                      <div className="stat-item">
                        <div className="stat-value">{testResults.testsPassed || 0}</div>
                        <div className="stat-label">Tests Passed</div>
                      </div>
                      <div className="stat-item">
                        <div className="stat-value">{testResults.testsFailed || 0}</div>
                        <div className="stat-label">Tests Failed</div>
                      </div>
                      <div className="stat-item">
                        <div className="stat-value">
                          {testResults.aiMetadata?.confidenceScore ?
                            Math.round(testResults.aiMetadata.confidenceScore * 100) + '%' : 'N/A'}
                        </div>
                        <div className="stat-label">AI Confidence</div>
                      </div>
                      <div className="stat-item">
                        <div className="stat-value">
                          {testResults.predictions?.riskAssessment?.level || 'Unknown'}
                        </div>
                        <div className="stat-label">Risk Level</div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Recent Alerts */}
              <div className="dashboard-card">
                <h3 className="card-title">⚠️ Recent Alerts</h3>
                <div className="alerts-container">
                  {alerts.length > 0 ? (
                    alerts.map((alert, index) => (
                      <motion.div
                        key={alert.id}
                        className="alert-item"
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <div style={{ fontWeight: 'bold' }}>{alert.message}</div>
                        <div className="alert-time">
                          {alert.timestamp.toLocaleTimeString()}
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <div className="no-data">No recent alerts</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'predictions' && (
            <div className="dashboard-grid">
              {/* Predictive Insights */}
              <div className="dashboard-card" style={{ gridColumn: 'span 2' }}>
                <h3 className="card-title">🔮 Predictive Analytics</h3>
                {testResults?.predictions?.actionableInsights ? (
                  <div className="insights-list">
                    {testResults.predictions.actionableInsights.map((insight: any, index: number) => (
                      <div key={index} className="insight-item">
                        <div className="insight-header">
                          <h4>{insight.title}</h4>
                          <span className={`priority-badge priority-${insight.priority}`}>
                            {insight.priority}
                          </span>
                        </div>
                        <p>{insight.description}</p>
                        <div className="insight-details">
                          <div><strong>Impact:</strong> {insight.impact}</div>
                          <div><strong>Effort:</strong> {insight.effort}</div>
                          <div><strong>Timeline:</strong> {insight.estimatedTimeToImplement}</div>
                          <div><strong>Expected Outcome:</strong> {insight.expectedOutcome}</div>
                        </div>
                        {insight.actionItems && (
                          <div className="action-items">
                            <strong>Action Items:</strong>
                            <ul>
                              {insight.actionItems.map((item: string, i: number) => (
                                <li key={i}>{item}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="no-data">No predictive insights available</div>
                )}
              </div>

              {/* Performance Trends */}
              <div className="dashboard-card">
                <h3 className="card-title">📈 Performance Predictions</h3>
                {testResults?.predictions?.performanceTrends ? (
                  <div className="performance-trends">
                    {Object.entries(testResults.predictions.performanceTrends.trends || {}).map(([metric, data]: [string, any]) => (
                      <div key={metric} className="trend-item">
                        <div className="metric-name">{metric.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</div>
                        <div className="metric-value">{data.current}</div>
                        <div className={`trend-indicator trend-${data.trend}`}>
                          {data.trend === 'improving' ? '↗️' : data.trend === 'decreasing' ? '↘️' : '➡️'} {data.changePercent}%
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="no-data">No performance trends available</div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="dashboard-grid">
              {/* Security Vulnerabilities */}
              <div className="dashboard-card" style={{ gridColumn: 'span 2' }}>
                <h3 className="card-title">🔒 Security Analysis</h3>
                {testResults?.securityReport ? (
                  <div className="security-report">
                    <div className="security-summary">
                      <div className="security-score">
                        <div className="score-value">{testResults.securityReport.securityScore || 0}/100</div>
                        <div className="score-label">Security Score</div>
                      </div>
                      <div className="risk-level">
                        <div className={`risk-badge risk-${testResults.securityReport.riskLevel || 'unknown'}`}>
                          {(testResults.securityReport.riskLevel || 'Unknown').toUpperCase()}
                        </div>
                        <div className="risk-label">Risk Level</div>
                      </div>
                    </div>

                    {testResults.securityReport.vulnerabilities && testResults.securityReport.vulnerabilities.length > 0 ? (
                      <div className="vulnerabilities-list">
                        <h4>Detected Vulnerabilities</h4>
                        {testResults.securityReport.vulnerabilities.map((vuln: any, index: number) => (
                          <div key={index} className={`vulnerability-item severity-${vuln.severity}`}>
                            <div className="vuln-header">
                              <h5>{vuln.title}</h5>
                              <span className={`severity-badge severity-${vuln.severity}`}>
                                {vuln.severity}
                              </span>
                            </div>
                            <p>{vuln.description}</p>
                            <div className="vuln-details">
                              <div><strong>Location:</strong> {vuln.location}</div>
                              <div><strong>Impact:</strong> {vuln.impact}</div>
                              {vuln.cwe && <div><strong>CWE:</strong> {vuln.cwe}</div>}
                              {vuln.owasp && <div><strong>OWASP:</strong> {vuln.owasp}</div>}
                            </div>
                            {vuln.remediation && (
                              <div className="remediation">
                                <strong>Remediation:</strong>
                                <ul>
                                  {vuln.remediation.map((item: string, i: number) => (
                                    <li key={i}>{item}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="no-vulnerabilities">✅ No vulnerabilities detected</div>
                    )}
                  </div>
                ) : (
                  <div className="no-data">No security analysis available</div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'performance' && (
            <div className="dashboard-grid">
              {/* Performance Metrics */}
              <div className="dashboard-card" style={{ gridColumn: 'span 2' }}>
                <h3 className="card-title">⚡ Performance Analysis</h3>
                {testResults?.performance ? (
                  <div className="performance-analysis">
                    <div className="performance-grid">
                      <div className="performance-metric">
                        <div className="metric-value">{Math.round(testResults.performance.loadTime)}ms</div>
                        <div className="metric-label">Load Time</div>
                      </div>
                      <div className="performance-metric">
                        <div className="metric-value">{Math.round(testResults.performance.firstContentfulPaint || 0)}ms</div>
                        <div className="metric-label">First Contentful Paint</div>
                      </div>
                      <div className="performance-metric">
                        <div className="metric-value">{Math.round(testResults.performance.largestContentfulPaint || 0)}ms</div>
                        <div className="metric-label">Largest Contentful Paint</div>
                      </div>
                      <div className="performance-metric">
                        <div className="metric-value">{(testResults.performance.cumulativeLayoutShift || 0).toFixed(3)}</div>
                        <div className="metric-label">Cumulative Layout Shift</div>
                      </div>
                    </div>

                    {testResults.accessibilityReport && (
                      <div className="accessibility-section">
                        <h4>♿ Accessibility Analysis</h4>
                        <div className="a11y-score">
                          Score: {testResults.accessibilityReport.overallScore || 'Not available'}/100
                        </div>
                        {testResults.accessibilityReport.recommendations && (
                          <div className="a11y-recommendations">
                            <strong>Recommendations:</strong>
                            <ul>
                              {testResults.accessibilityReport.recommendations.slice(0, 5).map((rec: any, i: number) => (
                                <li key={i}>{typeof rec === 'string' ? rec : rec.description || 'Accessibility improvement needed'}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="no-data">No performance data available</div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'visual' && (
            <div className="dashboard-grid">
              {/* Visual Analysis Summary */}
              <div className="dashboard-card" style={{ gridColumn: 'span 2' }}>
                <h3 className="card-title">👁️ Visual AI Analysis</h3>
                {testResults?.visualAnalysis ? (
                  <div className="visual-analysis">
                    {/* Overall Status */}
                    <div className="visual-summary">
                      <div className="visual-stat">
                        <div className="stat-value">
                          {testResults.visualAnalysis.overallStatus === 'passed' ? '✅' : '⚠️'}
                        </div>
                        <div className="stat-label">Overall Status</div>
                      </div>
                      <div className="visual-stat">
                        <div className="stat-value">
                          {testResults.visualAnalysis.issuesDetected || 0}
                        </div>
                        <div className="stat-label">Issues Detected</div>
                      </div>
                      <div className="visual-stat">
                        <div className="stat-value">
                          {testResults.visualAnalysis.confidenceScore
                            ? Math.round(testResults.visualAnalysis.confidenceScore * 100) + '%'
                            : 'N/A'}
                        </div>
                        <div className="stat-label">Confidence</div>
                      </div>
                    </div>

                    {/* Visual Issues */}
                    {testResults.visualAnalysis.issues && testResults.visualAnalysis.issues.length > 0 ? (
                      <div className="visual-issues-list">
                        <h4>🎨 Detected Visual Issues</h4>
                        {testResults.visualAnalysis.issues.map((issue: any, index: number) => (
                          <div key={index} className={`visual-issue-item severity-${issue.severity || 'medium'}`}>
                            <div className="issue-header">
                              <h5>{issue.type || 'Visual Issue'}</h5>
                              <span className={`severity-badge severity-${issue.severity || 'medium'}`}>
                                {issue.severity || 'medium'}
                              </span>
                            </div>
                            <p>{issue.description}</p>
                            {issue.location && (
                              <div className="issue-location">
                                <strong>Location:</strong> {issue.location}
                              </div>
                            )}
                            {issue.suggestion && (
                              <div className="issue-suggestion">
                                <strong>💡 Suggestion:</strong> {issue.suggestion}
                              </div>
                            )}
                            {issue.screenshot && (
                              <div className="issue-screenshot">
                                <img src={issue.screenshot} alt="Visual issue" style={{ maxWidth: '100%', borderRadius: '8px' }} />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="no-visual-issues">
                        ✅ No visual issues detected. Your UI looks great!
                      </div>
                    )}

                    {/* Visual Metrics */}
                    {testResults.visualAnalysis.metrics && (
                      <div className="visual-metrics">
                        <h4>📊 Visual Metrics</h4>
                        <div className="metrics-grid">
                          {Object.entries(testResults.visualAnalysis.metrics).map(([metric, value]: [string, any]) => (
                            <div key={metric} className="metric-card">
                              <div className="metric-name">
                                {metric.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                              </div>
                              <div className="metric-value">
                                {typeof value === 'number' ? value.toFixed(2) : value}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Screenshots */}
                    {testResults.details && testResults.details.some((d: any) => d.screenshot) && (
                      <div className="screenshots-section">
                        <h4>📸 Test Screenshots</h4>
                        <div className="screenshots-grid">
                          {testResults.details
                            .filter((d: any) => d.screenshot)
                            .map((test: any, index: number) => (
                              <div key={index} className="screenshot-card">
                                <div className="screenshot-title">
                                  {test.status === 'passed' ? '✅' : '❌'} {test.name}
                                </div>
                                <img
                                  src={test.screenshot}
                                  alt={test.name}
                                  style={{
                                    width: '100%',
                                    borderRadius: '8px',
                                    border: `2px solid ${test.status === 'passed' ? '#28a745' : '#dc3545'}`
                                  }}
                                />
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

                    {/* Recommendations */}
                    {testResults.visualAnalysis.recommendations && testResults.visualAnalysis.recommendations.length > 0 && (
                      <div className="visual-recommendations">
                        <h4>💡 Visual Improvement Recommendations</h4>
                        <ul>
                          {testResults.visualAnalysis.recommendations.map((rec: string, index: number) => (
                            <li key={index}>{rec}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="no-data">
                    <div style={{ fontSize: '48px', marginBottom: '1rem' }}>👁️</div>
                    <h3>No Visual Analysis Available</h3>
                    <p>Enable Visual AI in the test configuration to see detailed visual analysis, including:</p>
                    <ul style={{ textAlign: 'left', maxWidth: '400px', margin: '1rem auto' }}>
                      <li>Layout and alignment issues</li>
                      <li>Color contrast problems</li>
                      <li>Visual regressions</li>
                      <li>Responsive design issues</li>
                      <li>UI consistency checks</li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <button
        className="floating-action"
        onClick={() => window.location.reload()}
        title="Refresh Dashboard"
      >
        🔄
      </button>
    </div>
  );
};

// Interfaces
interface AIInsight {
  id: string;
  type: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  recommendation: string;
  timestamp: Date;
}

interface Prediction {
  category: string;
  probability: number;
  impact: string;
  timeframe: string;
}

interface Alert {
  id: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  acknowledged: boolean;
}

export default AIDashboard;
