import { z } from 'zod';

const EnvSchema = z.object({
  NEXT_PUBLIC_ONBOARDING_BYPASS: z
    .union([z.string(), z.boolean()])
    .default('false')
    .transform((value) =>
      typeof value === 'boolean' ? value : value.toLowerCase() === 'true'
    ),
});

const parsedEnv = EnvSchema.parse({
  NEXT_PUBLIC_ONBOARDING_BYPASS: process.env.NEXT_PUBLIC_ONBOARDING_BYPASS,
});

export const env = parsedEnv;
export const BYPASS_LIMITS = env.NEXT_PUBLIC_ONBOARDING_BYPASS;
