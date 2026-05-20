// MealBuddy Server — Express + TypeScript + PostgreSQL
import express from 'express';
import cors from 'cors';
import { Pool } from 'pg';
import { mealPlanRoutes } from './routes/mealPlans';
import { recipeRoutes } from './routes/recipes';
import { profileRoutes } from './routes/profiles';

const PORT = process.env.PORT || 3001;
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://localhost:5432/mealbuddy';

export const pool = new Pool({ connectionString: DATABASE_URL });

const app = express();
app.use(cors());
app.use(express.json());

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
