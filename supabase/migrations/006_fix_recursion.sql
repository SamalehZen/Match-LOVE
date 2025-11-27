-- Fix for infinite recursion in RLS policies
-- This migration addresses the infinite recursion error when querying room_members
-- by moving the membership check to a SECURITY DEFINER function that bypasses RLS.

-- 1. Create a secure function to check room membership
-- SECURITY DEFINER allows it to bypass RLS on the tables it queries, breaking the recursion loop
CREATE OR REPLACE FUNCTION public.is_room_member(_room_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM room_members
    WHERE room_id = _room_id
    AND user_id = auth.uid()
  );
$$;

-- 2. Drop the problematic recursive policy
DROP POLICY IF EXISTS "Users can view room members" ON public.room_members;

-- 3. Create the new non-recursive policy
CREATE POLICY "Users can view room members" ON public.room_members
FOR SELECT USING (
  -- Users can always see themselves
  auth.uid() = user_id 
  OR
  -- Users can see other members if they belong to the same room
  is_room_member(room_id)
);

-- Optional: We can also optimize the rooms policy to use this function, 
-- though it wasn't strictly causing the recursion on its own, it's cleaner.
DROP POLICY IF EXISTS "Users can view rooms they're in" ON public.rooms;

CREATE POLICY "Users can view rooms they're in" ON public.rooms 
FOR SELECT USING (
  creator_id = auth.uid()
  OR
  is_room_member(id)
);
