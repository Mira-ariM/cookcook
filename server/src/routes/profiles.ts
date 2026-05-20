// CoupleProfile routes
import { Router, Request, Response } from 'express';
import { pool } from '../index';
import type { PersonProfile, CoupleProfile } from '../../../shared/types';

export const profileRoutes = Router();

// POST /api/profiles — create or update couple profile
profileRoutes.post('/', async (req: Request, res: Response) => {
  try {
    const { partnerA, partnerB, sharedPreferences } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO couple_profiles (
        a_name, a_display_name, a_liked_flavors, a_disliked_flavors,
        a_allergies, a_dietary_restrictions, a_recent_aversions,
        a_cooking_skill, a_patience, a_is_primary_cook,
        b_name, b_display_name, b_liked_flavors, b_disliked_flavors,
        b_allergies, b_dietary_restrictions, b_recent_aversions,
        b_cooking_skill, b_patience, b_is_primary_cook,
        frequent_dishes, cooking_style
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,
        $11,$12,$13,$14,$15,$16,$17,$18,$19,$20,
        $21,$22
      ) RETURNING id`,
      [
        partnerA.name, partnerA.displayName, partnerA.likedFlavors, partnerA.dislikedFlavors,
        partnerA.allergies, partnerA.dietaryRestrictions, partnerA.recentAversions,
        partnerA.cookingSkill, partnerA.cookingPatience, partnerA.isPrimaryCook,
        partnerB.name, partnerB.displayName, partnerB.likedFlavors, partnerB.dislikedFlavors,
        partnerB.allergies, partnerB.dietaryRestrictions, partnerB.recentAversions,
        partnerB.cookingSkill, partnerB.cookingPatience, partnerB.isPrimaryCook,
        sharedPreferences?.frequentDishes || [], sharedPreferences?.cookingStyle || 'balanced',
      ]
    );
    res.json({ success: true, data: { id: rows[0].id } });
  } catch (err: any) {
    console.error('profiles error:', err);
    res.status(500).json({ success: false, error: err.message || String(err) });
  }
});

// GET /api/profiles/:id — get couple profile
profileRoutes.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { rows } = await pool.query('SELECT * FROM couple_profiles WHERE id = $1', [id]);
    if (!rows.length) {
      return res.status(404).json({ success: false, error: 'Profile not found' });
    }
    res.json({ success: true, data: rows[0] });
  } catch (err: any) {
    console.error('profiles error:', err);
    res.status(500).json({ success: false, error: err.message || String(err) });
  }
});
