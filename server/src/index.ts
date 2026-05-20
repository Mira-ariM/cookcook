// MealBuddy Server — Express + TypeScript + PostgreSQL
import express from 'express';
import cors from 'cors';
import { Pool } from 'pg';
import * as path from 'path';
import * as fs from 'fs';
import { mealPlanRoutes } from './routes/mealPlans';
import { recipeRoutes } from './routes/recipes';
import { profileRoutes } from './routes/profiles';

const PORT = process.env.PORT || 3001;
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://localhost:5432/mealbuddy';

export const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: DATABASE_URL.includes('neon.tech') ? { rejectUnauthorized: false } : undefined,
});

// Verify DB connection on startup
pool.query('SELECT 1').then(() => console.log('DB connected')).catch(err => console.error('DB connection failed:', err.message));

const app = express();
app.use(cors());
app.use(express.json());
// Serve verification page
app.get('/verify', (_req, res) => {
  const filePath = path.join(__dirname, '..', 'public', 'verify.html');
  const html = fs.readFileSync(filePath, 'utf-8');
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(html);
});

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/meal-plans', mealPlanRoutes);
app.use('/api/recipes', recipeRoutes);
app.use('/api/profiles', profileRoutes);

app.listen(PORT, () => {
  console.log(`MealBuddy API running on http://localhost:${PORT}`);
});
