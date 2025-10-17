# 🚀 AutoQA AI - Web Testing Assistant

<img width="1567" height="874" alt="image" src="https://github.com/user-attachments/assets/476c6d22-cdd2-40c6-9a22-2b279e2b3445" />


**Automated web testing powered by Puppeteer + Chrome DevTools Protocol**

An intelligent web testing platform that automatically generates and executes test cases for any website. Just provide a URL and get comprehensive test results with performance metrics, accessibility analysis, and detailed reports.

![AutoQA AI Demo](https://via.placeholder.com/1200x600/7c3aed/ffffff?text=AutoQA+AI+-+Automated+Web+Testing)

---

## ✨ Features

### 🤖 **Auto Test Generation**
- Automatically analyzes DOM structure
- Generates comprehensive test cases
- Tests forms, buttons, links, and images
- No manual test writing required

### 🔧 **Chrome DevTools Integration**
- **Core Web Vitals**: FCP, LCP, CLS measurement
- **Accessibility Analysis**: WCAG compliance checking
- **Network Monitoring**: Track all API requests/responses
- **Console Monitoring**: Capture JavaScript errors and warnings
- **Performance Metrics**: Page load time, DOM parsing

### 📝 **Custom Test Support**
- Upload test files in JSON, JavaScript, or TXT format
- Flexible test syntax
- Reusable test suites

### 📊 **Detailed Reports**
- Pass/fail test results
- Screenshot on failure
- Performance metrics
- Accessibility score
- Console errors
- Network analysis

---

## 🎯 Tech Stack

**Frontend**: React, TypeScript, Vite  
**Backend**: Node.js, Express, TypeScript  
**Automation**: Puppeteer, Chrome DevTools Protocol  
**Testing**: DOM analysis, automatic test generation

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/akaur1-godaddy/web-testing-assistant.git
cd web-testing-assistant
```

2. **Install dependencies**
```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

3. **Start the application**

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

4. **Open in browser**
```
http://localhost:3000
```

---

## 📖 Usage

### Mode 1: Automatic Testing
1. Enter website URL
2. (Optional) Add login credentials
3. Click "Run Tests"
4. View comprehensive results

### Mode 2: Custom Tests
1. Create a test file (JSON/JS/TXT)
2. Upload the file
3. Enter website URL
4. Click "Run Tests"

### Example Test File (JSON)
```json
[
  {
    "name": "Homepage loads",
    "type": "navigation",
    "value": "/"
  },
  {
    "name": "Search button exists",
    "type": "assertion",
    "selector": "#search-btn"
  },
  {
    "name": "Click search",
    "type": "click",
    "selector": "#search-btn"
  }
]
```

---

## 📊 Test Results Include

- ✅ Pass/fail status for each test
- ⚡ Core Web Vitals (Google's performance metrics)
- ♿ Accessibility score and issues
- 🌐 Network requests and failures
- 📋 Console errors and warnings
- 📸 Screenshots on test failure
- ⏱️ Performance metrics

---

<img width="1228" height="672" alt="image" src="https://github.com/user-attachments/assets/0386a7cb-96b6-461b-8ac9-8379ffe1b747" />

<img width="1561" height="1030" alt="image" src="https://github.com/user-attachments/assets/112b1a0e-3f3b-4a04-ab3c-2cd7e94befd4" />
<img width="1258" height="978" alt="image" src="https://github.com/user-attachments/assets/05fe9f94-1565-4959-97ab-9c8165ed0f92" />

## 🏗️ Architecture

```
Frontend (React)  ←→  Backend (Express)  ←→  Puppeteer  ←→  Target Website
                                              ↓
                                    Chrome DevTools Protocol
                                              ↓
                                    Performance Analysis
                                    Accessibility Checks
                                    Network Monitoring
```

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 🐛 Troubleshooting

**Port already in use:**
```bash
lsof -ti:5001 | xargs kill -9  # Backend
lsof -ti:3000 | xargs kill -9  # Frontend
```

**Puppeteer installation issues:**
```bash
cd backend
rm -rf node_modules package-lock.json
npm install
```


---

**Repository**: https://github.com/akaur1-godaddy/web-testing-assistant

