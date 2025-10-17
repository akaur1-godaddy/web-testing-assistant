import express from 'express';
import multer from 'multer';
import { runTests } from '../controllers/testController';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage });

// POST /api/test/run - Run tests on a website
router.post('/run', upload.single('testFile'), runTests);

export default router;

