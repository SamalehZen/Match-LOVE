# Configuration Supabase

1. Créer un projet Supabase et récupérer URL + anon key + service role key.
2. Créer un bucket `avatars` en public dans Storage.
3. Appliquer les migrations du dossier `supabase/migrations`.
4. Générer les types TypeScript:

```
npx supabase gen types typescript --project-id VOTRE_PROJECT_ID > types/database.types.ts
```

5. Renseigner les variables dans `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```
