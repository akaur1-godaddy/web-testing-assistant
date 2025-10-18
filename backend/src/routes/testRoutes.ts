import express from 'express';
import multer from 'multer';
import { runTests } from '../controllers/testController';
import { EnhancedTestController } from '../controllers/enhancedTestController';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage });

// POST /api/tests/run - Original test runner (backward compatibility)
router.post('/run', upload.single('testFile'), runTests);

// POST /api/tests/ai-run - Enhanced AI-powered test runner
router.post('/ai-run', upload.single('testFile'), EnhancedTestController.runAITests);

// POST /api/tests/generate-nlp - Generate tests from natural language
router.post('/generate-nlp', EnhancedTestController.generateFromNLP);

// POST /api/tests/insights - Get AI insights for test results
router.post('/insights', EnhancedTestController.getAIInsights);

// GET /api/tests/health - AI services health check
router.get('/health', EnhancedTestController.healthCheck);

export default router;

