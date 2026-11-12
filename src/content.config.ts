import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

/**
 * Casos de clientes (solo con autorización escrita; si no, anónimos y con cifras agregadas, Ley 21.719).
 * Un archivo Markdown por caso en src/content/casos/. El cuerpo del archivo es el testimonio (opcional).
 */
const casos = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/casos' }),
  schema: z.object({
    title: z.string(),
    client: z.string().describe('Nombre del cliente o descripción anónima, p. ej. "Clínica dental en Viña del Mar"'),
    anonymous: z.boolean().default(false),
    service: z.string().describe('Plan o servicio contratado'),
    problem: z.string(),
    solution: z.string(),
    metrics: z.array(z.object({ label: z.string(), before: z.string(), after: z.string() })).default([]),
    testimonial: z.string().optional(),
    testimonialAuthor: z.string().optional(),
    date: z.coerce.date(),
    authorized: z.literal(true).describe('Debe ser true: hay autorización escrita para publicar'),
  }),
});

export const collections = { casos };
