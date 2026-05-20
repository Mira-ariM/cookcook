// Recipe routes — query / manage curated recipe pool
import { Router, Request, Response } from 'express';
import { pool } from '../index';

export const recipeRoutes = Router();

// GET /api/recipes — list curated recipes, with optional filters
recipeRoutes.get('/', async (req: Request, res: Response) => {
  try {
    const { type, scenario, flavor, limit = '50' } = req.query;
    let query = 'SELECT * FROM recipes WHERE is_curated = true';
    const params: any[] = [];

    if (type) {
      params.push(type);
      query += ` AND type = $${params.length}`;
    }
    if (scenario) {
      params.push(scenario);
      query += ` AND $${params.length} = ANY(scenario_tags)`;
    }
    if (flavor) {
      params.push(flavor);
      query += ` AND $${params.length} = ANY(flavors)`;
    }
    query += ` LIMIT $${params.length + 1}`;
    params.push(Number(limit));

    const { rows } = await pool.query(query, params);
    res.json({ success: true, data: rows });
  } catch (err: any) {
    console.error('recipes error:', err);
    res.status(500).json({ success: false, error: err.message || String(err) });
  }
});

// GET /api/recipes/:id — single recipe with full detail (steps, ingredients)
recipeRoutes.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const recipeQuery = 'SELECT * FROM recipes WHERE id = $1';
    const ingredientsQuery = 'SELECT * FROM recipe_ingredients WHERE recipe_id = $1 ORDER BY id';
    const seasoningsQuery = 'SELECT * FROM recipe_seasonings WHERE recipe_id = $1 ORDER BY id';
    const stepsQuery = 'SELECT * FROM recipe_steps WHERE recipe_id = $1 ORDER BY step_order';
    const statsQuery = 'SELECT * FROM recipe_stats WHERE recipe_id = $1';

    const [recipe, ingredients, seasonings, steps, stats] = await Promise.all([
      pool.query(recipeQuery, [id]),
      pool.query(ingredientsQuery, [id]),
      pool.query(seasoningsQuery, [id]),
      pool.query(stepsQuery, [id]),
      pool.query(statsQuery, [id]),
    ]);

    res.json({
      success: true,
      data: {
        ...recipe.rows[0],
        ingredients: ingredients.rows,
        seasonings: seasonings.rows,
        steps: steps.rows,
        stats: stats.rows[0] || null,
      },
    });
  } catch (err: any) {
    console.error('recipes error:', err);
    res.status(500).json({ success: false, error: err.message || String(err) });
  }
});
