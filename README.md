# 🚀 TestPilot.AI - AI-Powered Web Testing Assistant

**An intelligent testing platform that combines GPT-4, Puppeteer, and Chrome DevTools to automatically generate, execute, and analyze web tests.**

<img width="1693" height="1027" alt="image" src="https://github.com/user-attachments/assets/6f5189bf-8ae1-4851-9892-cc041d1de741" />
<img width="1703" height="1036" alt="image" src="https://github.com/user-attachments/assets/3f96896a-d568-492b-8afb-d13a58df5fc1" />


---

## 🎯 What It Does

TestPilot.AI revolutionizes web testing by using **AI to automatically generate comprehensive test suites** for any website. Simply enter a URL, and get:

- ✅ **Auto-generated UI tests** - AI analyzes page structure and creates tests
- 🤖 **GPT-4 powered edge cases** - Intelligent boundary and error scenario testing
- 🔧 **Chrome DevTools integration** - Performance, accessibility, network, console analysis
- 💡 **AI failure explanations** - Understands WHY tests fail and suggests fixes
- 🎤 **Voice commands** - Natural language test generation
- 📊 **Non-technical tooltips** - Makes metrics understandable for Product Owners

---<img width="1175" height="918" alt="image" src="https://github.com/user-attachments/assets/12118032-ec4f-41ac-afe4-dcc7b87a0761" />


## 🌟 Key AI Features

### 1. **Intelligent Test Generation**
- Automatically generates comprehensive test suite by analyzing DOM structure
- Creates edge cases using GPT-4 (boundary conditions, special characters, timeout scenarios)
- No manual test writing required

### 2. **Self-Healing Tests**
- AI automatically repairs broken selectors when UI changes
- Adapts to dynamic elements
- Reduces test maintenance by 70%

### 3. **AI-Powered Failure Analysis**
- GPT-4 analyzes failed tests and explains the root cause
- Provides actionable fix suggestions with confidence scores
- Helps developers understand issues faster

### 4. **Natural Language Processing**
- Convert plain English to executable tests
- Example: *"Test login with invalid email and verify error message"*
- Voice command support for hands-free testing

### 5. **Visual AI**
- Analyzes UI components from screenshots
- Detects visual regressions and layout issues
- Component-level analysis

### 6. **Security AI Scanner**
- Automatic XSS, CSRF, and SQL injection vulnerability detection
- AI-powered security recommendations
- Risk assessment for each finding

### 7. **Enhanced Accessibility AI**
- Beyond standard WCAG compliance checks
- AI analyzes color contrast, keyboard navigation, screen reader compatibility
- Business-impact assessment for accessibility issues

### 8. **Predictive Analytics**
- AI predicts potential test failures before they occur
- Performance bottleneck detection
- Risk scoring and trend analysis

---

## 🔧 Chrome DevTools Integration

### Core Web Vitals
- First Contentful Paint (FCP)
- Largest Contentful Paint (LCP)
- Cumulative Layout Shift (CLS)
- Load time and DOM metrics

### Accessibility Analysis
- WCAG compliance checking
- Accessibility score (0-100)
- Detailed issue reporting with remediation steps

### Network Analysis
- Total requests tracking
- Failed request detection
- Slowest resource identification

### Console Monitoring
- JavaScript error capture
- Warning detection
- Real-time monitoring

---

## 💡 User Experience Innovation

### Non-Technical Tooltips
Hover over any metric to see simple, business-friendly explanations:
- **Load Time**: *"How long it takes for your page to fully load. Under 3 seconds is good, over 5 seconds means users leave."*
- **Accessibility Score**: *"How easy your website is for people with disabilities to use. 90+ is excellent."*

### Dual Input Methods
1. **URL + Auto-Generate**: Enter any URL and let AI create tests
2. **Upload Custom Tests**: Upload JSON/JavaScript test files for custom scenarios

### Voice Commands
- *"Run test on godaddy.com"*
- *"Generate test for login flow with invalid credentials"*

---

<img width="1680" height="1040" alt="image" src="https://github.com/user-attachments/assets/829258ad-cbc8-4d2e-b613-6a951f05dbd9" />

<img width="1706" height="994" alt="image" src="https://github.com/user-attachments/assets/947a699b-44f7-417a-8a74-dd1d3e10b829" />
<img width="1702" height="1026" alt="image" src="https://github.com/user-attachments/assets/f7cb5a67-d2f9-42cd-ac19-17d5a900827c" />


## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- OpenAI API key (for AI features)

### Installation

```bash
# Clone repository
git clone https://github.com/akaur1-godaddy/web-testing-assistant.git
cd web-testing-assistant

# Install backend dependencies
cd backend
npm install
echo "OPENAI_API_KEY=your_key_here" > .env

# Install frontend dependencies
cd ../frontend
npm install

# Start backend (Terminal 1)
cd backend
npm run dev

# Start frontend (Terminal 2)
cd frontend
npm run dev

# Open browser
http://localhost:3000
```

---

## 📊 Demo Usage

### Test Any Website
1. Open http://localhost:3000
2. Enter URL: `https://godaddy.com`
3. Select AI options (Edge Cases, Security Scan, Visual AI)
4. Click "Run Tests"
5. View comprehensive results with AI insights

### Upload Custom Tests
1. Create a test file (see examples below)
2. Click "Upload Test File"
3. Enter target URL
4. Run and see results

### Example Test File
```json
[
  {
    "name": "Homepage loads successfully",
    "type": "navigation",
    "value": "/"
  },
  {
    "name": "Search button exists",
    "type": "assertion",
    "selector": "#search-btn"
  },
  {
    "name": "API Health Check",
    "method": "GET",
    "url": "https://api.example.com/health",
    "expectedStatus": 200
  }
]
```

---

## 🏗️ Architecture

```
Web UI (React) ↔ REST API ↔ AI Testing Engine
                              ↓
                    ┌─────────┴──────────┐
                    ↓                    ↓
              Puppeteer Engine      OpenAI GPT-4
                    ↓                    ↓
            Chrome DevTools         AI Services
          (Performance, A11y,    (Test Gen, Healing,
           Network, Console)      Analysis, Security)
```

---

## ⚙️ Technology Stack

**Frontend**: React, TypeScript, Vite, Framer Motion, D3.js  
**Backend**: Node.js, Express, TypeScript  
**AI/ML**: OpenAI GPT-4, NLP Processing  
**Testing**: Puppeteer, Chrome DevTools Protocol (CDP)  
**Real-time**: WebSocket for live updates

---

## 🎯 Future Enhancements

- **Deeper Functional Testing**: End-to-end workflow automation
- **Multi-Browser Support**: Firefox, Safari, Edge
- **CI/CD Integration**: GitHub Actions, Jenkins
- **Enterprise Features**: Team collaboration, historical analytics

---

## 👥 Team

- **Sagar Ganesh Bankar**
- **Ashutosh Kumar**
- **Amanpreet Kaur**
- **Harsh M. Taru**

---

## 📝 License

MIT License - See LICENSE file for details

---

## 🔗 Links

**Repository**: https://github.com/akaur1-godaddy/web-testing-assistant  
**Live Demo**: Available on request

---

*Built for Hackathon 2024 - Revolutionizing web testing with AI* 🚀
