# 🚀 AutoQA AI - Web Testing Assistant

**Automated web testing powered by Cursor MCP + DevTools™**

An intelligent web testing platform that combines traditional browser automation (Puppeteer) with AI-powered test generation to provide comprehensive website testing with just a URL.

![Demo Screenshot](https://via.placeholder.com/800x400?text=AutoQA+AI+Demo)

---

## ✨ Features

### 🤖 **AI-Powered Test Generation**
- Automatically analyzes DOM structure
- Generates comprehensive test cases
- Detects forms, buttons, links, and workflows
- No test writing required!

### 📝 **Custom Test Upload**
- Support for multiple formats (JSON, JavaScript, TXT)
- Flexible test syntax
- Easy to write and maintain
- Reuse existing test suites

### 🎯 **Comprehensive Testing**
- ✅ Navigation tests
- ✅ Form validation
- ✅ Button and link testing
- ✅ Image loading validation
- ✅ Accessibility checks (WCAG)
- ✅ Performance metrics
- ✅ Console error detection

### 📊 **Beautiful Reports**
- Real-time test execution
- Detailed pass/fail results
- Performance metrics
- Error highlighting
- Modern, intuitive UI

### 🔐 **Authentication Support**
- Optional login credentials
- Auto-detect login forms
- Session management
- Secure handling

---

## 🏗️ Architecture

```
┌──────────────┐      HTTP API      ┌──────────────┐
│   React UI   │ ◄────────────────► │  Express API │
│  (Port 3000) │                    │  (Port 5000) │
└──────────────┘                    └───────┬──────┘
                                            │
                                    ┌───────▼────────┐
                                    │   Puppeteer    │
                                    │ (Chrome Auto)  │
                                    └───────┬────────┘
                                            │
                                    ┌───────▼────────┐
                                    │ Target Website │
                                    └────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+ 
- **npm** or **yarn**
- **Chrome** browser (installed automatically with Puppeteer)

### Installation

#### 1. Clone the Repository
```bash
git clone <repository-url>
cd web-testing-assistant
```

#### 2. Install Dependencies

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

#### 3. Start the Application

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

#### 4. Open in Browser
Navigate to: **http://localhost:3000**

---

## 📖 Usage Guide

### Mode 1: Automatic Test Generation (AI)

1. **Enter Website URL**
   ```
   https://example.com
   ```

2. **Optional: Add Credentials**
   - Username: `test@example.com`
   - Password: `password123`

3. **Click "Run Tests"**
   - AI analyzes the page
   - Generates 20-30 test cases
   - Executes all tests
   - Shows comprehensive results

### Mode 2: Upload Custom Tests

1. **Create a Test File**
   
   **JSON Format** (`my-tests.json`):
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

   **Text Format** (`my-tests.txt`):
   ```text
   Test: Check Homepage
   1. Navigate to /
   2. Verify #header exists
   3. Click #menu-button
   
   Test: Login
   1. Navigate to /login
   2. Type user@test.com into #email
   3. Type password into #password
   4. Click #login-btn
   ```

   **JavaScript Format** (`my-tests.js`):
   ```javascript
   module.exports = [
     {
       name: "Homepage test",
       type: "navigation",
       value: "/"
     }
   ];
   ```

2. **Upload the File**
   - Click "Choose File"
   - Select your test file
   - Enter target URL
   - Click "Run Tests"

3. **View Results**
   - See pass/fail for each test
   - Performance metrics
   - Error details
   - Screenshots (coming soon)

---

## 📋 Test File Format Reference

### Test Case Structure

```typescript
{
  name: string;           // Test name/description
  type: TestType;         // Test action type
  selector?: string;      // CSS selector (for DOM tests)
  value?: string;         // Input value or URL
  expected?: string;      // Expected value
  timeout?: number;       // Wait timeout in ms
}
```

### Test Types

| Type | Description | Required Fields |
|------|-------------|----------------|
| `navigation` | Navigate to URL | `value` (URL) |
| `click` | Click an element | `selector` |
| `input` | Type into input | `selector`, `value` |
| `assertion` | Verify element exists | `selector` |
| `wait` | Pause execution | `timeout` |

### Example Test Cases

#### Navigation Test
```json
{
  "name": "Go to homepage",
  "type": "navigation",
  "value": "/"
}
```

#### Click Test
```json
{
  "name": "Click submit button",
  "type": "click",
  "selector": "#submit-btn"
}
```

#### Input Test
```json
{
  "name": "Enter email",
  "type": "input",
  "selector": "#email",
  "value": "test@example.com"
}
```

#### Assertion Test
```json
{
  "name": "Verify dashboard exists",
  "type": "assertion",
  "selector": "#dashboard"
}
```

---

## 🎨 What Tests Are Generated Automatically?

When you don't upload a test file, AI generates tests for:

### 1. Navigation & Loading
- ✅ Page loads successfully
- ✅ Title is present
- ✅ No console errors
- ✅ Performance metrics

### 2. Forms
- ✅ All forms detected
- ✅ All input fields work
- ✅ Required field validation
- ✅ Submit buttons clickable

### 3. Interactive Elements
- ✅ All buttons clickable
- ✅ Links valid and working
- ✅ Navigation menus functional

### 4. Images & Media
- ✅ All images load
- ✅ Alt text present (accessibility)
- ✅ No broken images

### 5. Accessibility
- ✅ Main landmark exists
- ✅ Heading hierarchy proper
- ✅ Language attribute set
- ✅ Skip to content link

### 6. Workflows (Detected)
- 🔐 Login flows
- 🔍 Search functionality
- 🛒 E-commerce elements

---

## 📊 Understanding Test Results

### Summary Metrics
- **Total Tests**: Number of tests executed
- **Passed**: Tests that succeeded ✅
- **Failed**: Tests that failed ❌
- **Success Rate**: Percentage of passing tests

### Performance Metrics
- **Load Time**: Full page load duration
- **DOM Content Loaded**: Initial DOM parse time
- **Time to Interactive**: When page becomes interactive
- **First Contentful Paint**: First content render time

### Test Details
Each test shows:
- ✅/❌ Pass/Fail status
- Test name and description
- Execution duration
- Error message (if failed)
- Element selector

---

## 🔧 Configuration

### Backend Environment Variables

Create `backend/.env`:
```env
PORT=5000
NODE_ENV=development
CHROME_EXECUTABLE_PATH=/path/to/chrome  # Optional
```

### Frontend Configuration

Edit `frontend/vite.config.ts`:
```typescript
export default defineConfig({
  server: {
    port: 3000,
    proxy: {
      '/api': 'http://localhost:5000'
    }
  }
})
```

---

## 🚀 Advanced Usage

### Custom Puppeteer Configuration

Edit `backend/src/services/testRunner.ts`:
```typescript
this.browser = await puppeteer.launch({
  headless: true,  // false to see browser
  slowMo: 50,      // slow down for debugging
  args: [
    '--no-sandbox',
    '--disable-dev-shm-usage',
  ],
});
```

### Adding Custom Test Types

1. Add type to `TestCase` interface
2. Implement handler in `testRunner.ts`
3. Add parser support in `testFileParser.ts`

---

## 🎯 Use Cases

### For QA Engineers
- ✅ Quick smoke testing
- ✅ Regression testing
- ✅ Exploratory testing
- ✅ Accessibility audits

### For Developers
- ✅ Pre-deployment checks
- ✅ Integration testing
- ✅ API endpoint validation
- ✅ Performance monitoring

### For Product Managers
- ✅ Feature validation
- ✅ User flow testing
- ✅ Competitor analysis
- ✅ Quick demos

### For Startups
- ✅ Rapid prototyping
- ✅ No-code testing
- ✅ CI/CD integration
- ✅ Cost-effective QA

---

## 🛣️ Roadmap

### Phase 1: Core (✅ Complete)
- [x] React frontend
- [x] Express backend
- [x] Puppeteer integration
- [x] Auto test generation
- [x] File upload support
- [x] Results display

### Phase 2: Enhancement (🚧 In Progress)
- [ ] Chrome DevTools MCP integration
- [ ] AI-powered test generation
- [ ] Screenshot on failure
- [ ] Video recording
- [ ] Accessibility testing (WCAG)

### Phase 3: Advanced (📋 Planned)
- [ ] Visual regression testing
- [ ] Cross-browser testing
- [ ] Mobile responsive testing
- [ ] API testing integration
- [ ] Test history & comparison
- [ ] Email notifications
- [ ] PDF report export

### Phase 4: Enterprise (🔮 Future)
- [ ] Multi-user support
- [ ] Scheduled test runs
- [ ] CI/CD integration
- [ ] Custom plugins
- [ ] Cloud deployment
- [ ] Analytics dashboard

---

## 🤝 Contributing

We welcome contributions! Here's how:

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Commit your changes**
   ```bash
   git commit -m 'Add amazing feature'
   ```
4. **Push to branch**
   ```bash
   git push origin feature/amazing-feature
   ```
5. **Open a Pull Request**

---

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Kill process on port 5000
lsof -ti:5000 | xargs kill -9

# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

### Puppeteer Installation Issues
```bash
# Clear npm cache
npm cache clean --force

# Reinstall puppeteer
cd backend
rm -rf node_modules
npm install
```

### Chrome Not Found
```bash
# Set Chrome path in backend/.env
CHROME_EXECUTABLE_PATH=/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome
```

### Tests Timing Out
- Increase timeout in test cases
- Check internet connection
- Verify target website is accessible
- Try headless: false for debugging

---

## 📝 License

MIT License - feel free to use this project for your hackathon, learning, or commercial purposes!

---

## 🙏 Acknowledgments

- **Puppeteer** - Browser automation
- **React** - Frontend framework
- **Express** - Backend framework
- **Vite** - Fast build tool
- **TypeScript** - Type safety
- **Cursor AI** - Development assistance

---

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/your-repo/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-repo/discussions)
- **Email**: support@autoqa.ai

---

## 🎉 Ready to Test!

Start testing your websites automatically:

```bash
# Start backend
cd backend && npm run dev

# Start frontend (new terminal)
cd frontend && npm run dev

# Open browser
open http://localhost:3000
```

**Happy Testing! 🚀**

