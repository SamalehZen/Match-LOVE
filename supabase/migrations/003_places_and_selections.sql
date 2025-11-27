-- Places table (cache Serper results)
CREATE TABLE public.places (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  external_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  address TEXT,
  location JSONB,
  type TEXT,
  price_range TEXT,
  rating DECIMAL(2,1),
  total_ratings INTEGER,
  phone TEXT,
  website TEXT,
  opening_hours JSONB,
  photos TEXT[],
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- User selections
CREATE TABLE public.selections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID REFERENCES public.rooms(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  round_number INTEGER NOT NULL,
  place_ids UUID[] NOT NULL,
  validated BOOLEAN DEFAULT FALSE,
  validated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(room_id, user_id, round_number)
);

-- Burned places
CREATE TABLE public.burned_places (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID REFERENCES public.rooms(id) ON DELETE CASCADE NOT NULL,
  place_id UUID REFERENCES public.places(id) ON DELETE CASCADE NOT NULL,
  round_number INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(room_id, place_id)
);

-- Indexes
CREATE INDEX idx_places_external_id ON public.places(external_id);
CREATE INDEX idx_selections_room ON public.selections(room_id);
CREATE INDEX idx_selections_room_round ON public.selections(room_id, round_number);
CREATE INDEX idx_burned_places_room ON public.burned_places(room_id);

-- RLS Policies
ALTER TABLE public.places ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view places" ON public.places FOR SELECT USING (true);

ALTER TABLE public.selections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view selections in their rooms" ON public.selections FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.room_members WHERE room_id = selections.room_id AND user_id = auth.uid())
);
CREATE POLICY "Users can create own selections" ON public.selections FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own selections" ON public.selections FOR UPDATE USING (auth.uid() = user_id);

ALTER TABLE public.burned_places ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view burned places" ON public.burned_places FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.room_members WHERE room_id = burned_places.room_id AND user_id = auth.uid())
);

-- Triggers
CREATE TRIGGER places_updated_at BEFORE UPDATE ON public.places
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER selections_updated_at BEFORE UPDATE ON public.selections
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
