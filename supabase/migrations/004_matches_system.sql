-- Matches table
CREATE TABLE public.matches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID REFERENCES public.rooms(id) ON DELETE CASCADE NOT NULL,
  place_id UUID REFERENCES public.places(id) ON DELETE SET NULL,
  round_number INTEGER NOT NULL,
  matched_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  user_ids UUID[] NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  date_planned TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(room_id, round_number)
);

-- Match history
CREATE TABLE public.match_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id UUID REFERENCES public.matches(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  place_id UUID REFERENCES public.places(id) ON DELETE SET NULL,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  review TEXT,
  photos TEXT[],
  visited BOOLEAN DEFAULT FALSE,
  visited_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX idx_matches_room ON public.matches(room_id);
CREATE INDEX idx_match_history_user ON public.match_history(user_id);

-- RLS Policies
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their matches" ON public.matches FOR SELECT USING (
  auth.uid() = ANY(user_ids) OR
  EXISTS (SELECT 1 FROM public.room_members WHERE room_id = matches.room_id AND user_id = auth.uid())
);
CREATE POLICY "Users can update their matches" ON public.matches FOR UPDATE USING (auth.uid() = ANY(user_ids));

ALTER TABLE public.match_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own history" ON public.match_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own history" ON public.match_history FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own history" ON public.match_history FOR UPDATE USING (auth.uid() = user_id);

-- Function to check for matches
CREATE OR REPLACE FUNCTION public.check_room_match(p_room_id UUID, p_round_number INTEGER)
RETURNS TABLE(matched BOOLEAN, place_id UUID) AS $$
DECLARE
  v_selections RECORD;
  v_common_places UUID[];
  v_match_found BOOLEAN := FALSE;
  v_matched_place UUID;
BEGIN
  SELECT ARRAY_AGG(s.place_ids) INTO v_common_places
  FROM public.selections s
  WHERE s.room_id = p_room_id AND s.round_number = p_round_number AND s.validated = TRUE;
  
  IF ARRAY_LENGTH(v_common_places, 1) = 2 THEN
    v_common_places := v_common_places[1] && v_common_places[2];
    IF ARRAY_LENGTH(v_common_places, 1) > 0 THEN
      v_match_found := TRUE;
      v_matched_place := v_common_places[1];
    END IF;
  END IF;
  
  RETURN QUERY SELECT v_match_found, v_matched_place;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update stats on match
CREATE OR REPLACE FUNCTION public.update_user_stats_on_match()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.user_stats SET total_matches = total_matches + 1
  WHERE user_id = ANY(NEW.user_ids);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_match_created AFTER INSERT ON public.matches
  FOR EACH ROW EXECUTE FUNCTION public.update_user_stats_on_match();

-- Triggers
CREATE TRIGGER matches_updated_at BEFORE UPDATE ON public.matches
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER match_history_updated_at BEFORE UPDATE ON public.match_history
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
