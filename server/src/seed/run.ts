// Seed data runner — inserts 30-50 curated recipes
// Run: npm run db:seed
import { Pool } from 'pg';
import { seedRecipes } from './recipes';

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://localhost:5432/mealbuddy';

async function seed() {
  const pool = new Pool({ connectionString: DATABASE_URL });
  const client = await pool.connect();

  try {
    console.log(`Seeding ${seedRecipes.length} curated recipes...`);

    for (const recipe of seedRecipes) {
      // Insert recipe
      const { rows: [r] } = await client.query(
        `INSERT INTO recipes (source, is_curated, name, type, tags, scenario_tags, flavors, primary_flavor, equipment_needed, total_time_minutes, difficulty, servings)
         VALUES ('system', true, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING id`,
        [recipe.name, recipe.type, recipe.tags, recipe.scenarioTags, recipe.flavors, recipe.primaryFlavor, recipe.equipmentNeeded, recipe.totalTimeMinutes, recipe.difficulty, recipe.servings]
      );
      const recipeId = r.id;

      // Insert ingredients
      for (const ing of recipe.ingredients) {
        await client.query(
          `INSERT INTO recipe_ingredients (recipe_id, name, amount, category, is_staple) VALUES ($1,$2,$3,$4,$5)`,
          [recipeId, ing.name, ing.amount, ing.category, ing.isStaple]
        );
      }

      // Insert seasonings
      for (const s of recipe.seasonings) {
        await client.query(
          `INSERT INTO recipe_seasonings (recipe_id, name, amount, is_staple) VALUES ($1,$2,$3,$4)`,
          [recipeId, s.name, s.amount, s.isStaple]
        );
      }

      // Insert steps
      for (const step of recipe.steps) {
        await client.query(
          `INSERT INTO recipe_steps (recipe_id, step_order, description, duration_minutes, fire_hint, warning, assigned_to)
           VALUES ($1,$2,$3,$4,$5,$6,$7)`,
          [recipeId, step.order, step.description, step.durationMinutes, step.fireHint, step.warning, step.assignedTo]
        );
      }

      // Insert stats placeholder
      await client.query(
        `INSERT INTO recipe_stats (recipe_id) VALUES ($1)`,
        [recipeId]
      );
    }

    console.log(`Seeded ${seedRecipes.length} recipes successfully.`);
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
