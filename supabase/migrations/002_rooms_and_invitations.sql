-- Rooms table
CREATE TABLE public.rooms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT,
  creator_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'waiting' CHECK (status IN ('waiting', 'ready', 'selecting', 'comparing', 'matched')),
  current_round INTEGER DEFAULT 1,
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours') NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Room members
CREATE TABLE public.room_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID REFERENCES public.rooms(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'idle' CHECK (status IN ('idle', 'ready', 'selecting', 'validating')),
  joined_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(room_id, user_id)
);

-- Room invitations
CREATE TABLE public.room_invitations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID REFERENCES public.rooms(id) ON DELETE CASCADE NOT NULL,
  inviter_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  invited_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(room_id, invited_user_id)
);

-- Indexes
CREATE INDEX idx_rooms_creator ON public.rooms(creator_id);
CREATE INDEX idx_rooms_code ON public.rooms(code);
CREATE INDEX idx_room_members_room ON public.room_members(room_id);
CREATE INDEX idx_room_members_user ON public.room_members(user_id);
CREATE INDEX idx_room_invitations_invited ON public.room_invitations(invited_user_id);

-- RLS Policies
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view rooms they're in" ON public.rooms FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.room_members WHERE room_id = rooms.id AND user_id = auth.uid())
  OR creator_id = auth.uid()
);
CREATE POLICY "Users can create rooms" ON public.rooms FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Creators can update rooms" ON public.rooms FOR UPDATE USING (auth.uid() = creator_id);
CREATE POLICY "Creators can delete rooms" ON public.rooms FOR DELETE USING (auth.uid() = creator_id);

ALTER TABLE public.room_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view room members" ON public.room_members FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.room_members rm WHERE rm.room_id = room_members.room_id AND rm.user_id = auth.uid())
);
CREATE POLICY "Users can join rooms" ON public.room_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own status" ON public.room_members FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can leave rooms" ON public.room_members FOR DELETE USING (auth.uid() = user_id);

ALTER TABLE public.room_invitations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view invitations" ON public.room_invitations FOR SELECT
  USING (auth.uid() = invited_user_id OR auth.uid() = inviter_id);
CREATE POLICY "Users can create invitations" ON public.room_invitations FOR INSERT WITH CHECK (
  auth.uid() = inviter_id AND EXISTS (SELECT 1 FROM public.rooms WHERE id = room_id AND creator_id = auth.uid())
);
CREATE POLICY "Invited users can update" ON public.room_invitations FOR UPDATE USING (auth.uid() = invited_user_id);

-- Triggers
CREATE TRIGGER rooms_updated_at BEFORE UPDATE ON public.rooms
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER room_invitations_updated_at BEFORE UPDATE ON public.room_invitations
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
