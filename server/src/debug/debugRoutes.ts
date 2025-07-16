// server/src/debug/debugRoutes.ts

import { Router } from 'express';
import { gameDebugger } from './GameDebugger';

const router = Router();

// List all available scenarios
router.get('/scenarios', (req, res) => {
  try {
    const scenarios = gameDebugger.listScenarios();
    res.json({
      success: true,
      scenarios
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: (error as Error).message
    });
  }
});

// Run a specific scenario
router.post('/scenarios/:id/run', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await gameDebugger.runScenario(id);
    
    res.json({
      success: true,
      result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: (error as Error).message
    });
  }
});

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Debug API is running',
    environment: process.env.NODE_ENV
  });
});

export default router;