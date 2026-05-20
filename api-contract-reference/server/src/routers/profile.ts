// tRPC Router: profile

import { z } from 'zod';
import { publicProcedure, router } from '../trpc';

const personPartial = z.object({
  nickname: z.string().optional(),
  displayName: z.string().optional(),
  preferences: z
    .object({
      likes: z.array(z.string()).optional(),
      dislikes: z.array(z.string()).optional(),
      allergies: z.array(z.string()).optional(),
      restrictions: z.array(z.string()).optional(),
      currentlyAvoiding: z.array(z.string()).optional(),
    })
    .optional(),
  cooking: z
    .object({
      skillLevel: z.union([z.literal(1), z.literal(2), z.literal(3)]).optional(),
      patience: z.union([z.literal(1), z.literal(2), z.literal(3)]).optional(),
      cooksMoreOften: z.boolean().optional(),
    })
    .optional(),
  frequentDishes: z.array(z.string()).optional(),
});

const getProfileInput = z.object({
  coupleId: z.string(),
});

const updateProfileInput = z.object({
  coupleId: z.string(),
  personA: personPartial.optional(),
  personB: personPartial.optional(),
});

export const profileRouter = router({
  get: publicProcedure
    .input(getProfileInput)
    .query(async ({ input, ctx }) => {
      throw new Error('Not implemented: getProfile');
    }),

  update: publicProcedure
    .input(updateProfileInput)
    .mutation(async ({ input, ctx }) => {
      throw new Error('Not implemented: updateProfile');
    }),
});
