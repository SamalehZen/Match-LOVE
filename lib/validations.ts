import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
})

export const registerSchema = z
  .object({
    email: z.string().email('Email invalide'),
    password: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
    confirmPassword: z.string(),
    name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmPassword'],
  })

export const profileSchema = z.object({
  name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  avatar_url: z.string().url().optional().or(z.literal('')),
})

export const selectionSchema = z.object({
  room_id: z.string().uuid(),
  place_ids: z.array(z.string()).min(1).max(3, 'Maximum 3 lieux par sélection'),
  round_number: z.number().int().positive(),
})

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type ProfileInput = z.infer<typeof profileSchema>
export type SelectionInput = z.infer<typeof selectionSchema>
