import { z } from 'zod';

export const ZoomResponseSchema = z.object({
    count: z.number(),
    added_count: z.number(),
    message: z.string(),
});

export const CelestialBodiesPosition = z.object({
    alt: z.string(),
    az: z.string(),
    degrees: z.string(),
    distance_au: z.number(),
});

export const CelestialBodiesSchema = z.object({
    name: z.string(),
    magnitude: z.number(),
    position: CelestialBodiesPosition
})


