/*
  # Character and Emotion Management Tables

  1. New Tables
    - characters: Store character sheets with personality, background, goals, etc.
    - emotions: Store emotional states with intensity, valence, arousal, dominance
    - character_emotions: Link characters to their emotional states
    - emotion_history: Track emotion changes over time
    - prompt_chains: Advanced multi-step prompt chains with conditions
    - chain_steps: Individual steps within prompt chains
    - chain_conditions: Conditional logic for chain execution
    - chain_variables: Variables used in prompt chains

  2. Security
    - Enable RLS on all new tables
    - Add policies for user access control
*/

-- Characters table
CREATE TABLE IF NOT EXISTS public.characters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  personality TEXT[] DEFAULT '{}',
  background TEXT,
  goals TEXT[] DEFAULT '{}',
  relationships JSONB DEFAULT '{}',
  strengths TEXT[] DEFAULT '{}',
  weaknesses TEXT[] DEFAULT '{}',
  quirks TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Emotions table
CREATE TABLE IF NOT EXISTS public.emotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  primary_emotion TEXT NOT NULL,
  intensity INTEGER CHECK (intensity >= 1 AND intensity <= 10),
  valence DECIMAL(3,2) CHECK (valence >= -1 AND valence <= 1),
  arousal DECIMAL(3,2) CHECK (arousal >= 0 AND arousal <= 1),
  dominance DECIMAL(3,2) CHECK (dominance >= 0 AND dominance <= 1),
  secondary_emotions TEXT[] DEFAULT '{}',
  context TEXT[] DEFAULT '{}',
  triggers TEXT[] DEFAULT '{}',
  responses TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Character emotions relationship table
CREATE TABLE IF NOT EXISTS public.character_emotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id UUID NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  emotion_id UUID NOT NULL REFERENCES public.emotions(id) ON DELETE CASCADE,
  is_current BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(character_id, emotion_id)
);

-- Emotion history table
CREATE TABLE IF NOT EXISTS public.emotion_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id UUID NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  emotion TEXT NOT NULL,
  context TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Prompt chains table
CREATE TABLE IF NOT EXISTS public.prompt_chains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  variables JSONB DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  category TEXT,
  difficulty TEXT CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  estimated_time INTEGER, -- minutes
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chain steps table
CREATE TABLE IF NOT EXISTS public.chain_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chain_id UUID NOT NULL REFERENCES public.prompt_chains(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  prompt TEXT NOT NULL,
  expected_output TEXT,
  next_steps TEXT[] DEFAULT '{}',
  timeout_seconds INTEGER,
  max_retries INTEGER DEFAULT 0,
  step_order INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chain conditions table
CREATE TABLE IF NOT EXISTS public.chain_conditions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  step_id UUID REFERENCES public.chain_steps(id) ON DELETE CASCADE,
  chain_id UUID REFERENCES public.prompt_chains(id) ON DELETE CASCADE,
  condition_type TEXT CHECK (condition_type IN ('contains', 'equals', 'regex', 'length', 'custom')),
  condition_value JSONB,
  action TEXT CHECK (action IN ('continue', 'skip', 'retry', 'branch')),
  target_step_id UUID REFERENCES public.chain_steps(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chain variables table
CREATE TABLE IF NOT EXISTS public.chain_variables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chain_id UUID NOT NULL REFERENCES public.prompt_chains(id) ON DELETE CASCADE,
  variable_name TEXT NOT NULL,
  variable_type TEXT NOT NULL,
  default_value JSONB,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(chain_id, variable_name)
);

-- Enable RLS on all new tables
ALTER TABLE public.characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.character_emotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emotion_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompt_chains ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chain_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chain_conditions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chain_variables ENABLE ROW LEVEL SECURITY;

-- RLS Policies for characters
CREATE POLICY "Users can manage their own characters" ON public.characters
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for emotions
CREATE POLICY "Users can manage their own emotions" ON public.emotions
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for character_emotions
CREATE POLICY "Users can manage their character emotions" ON public.character_emotions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.characters c 
      WHERE c.id = character_emotions.character_id 
      AND c.user_id = auth.uid()
    )
  );

-- RLS Policies for emotion_history
CREATE POLICY "Users can manage their emotion history" ON public.emotion_history
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.characters c 
      WHERE c.id = emotion_history.character_id 
      AND c.user_id = auth.uid()
    )
  );

-- RLS Policies for prompt_chains
CREATE POLICY "Users can manage their own prompt chains" ON public.prompt_chains
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for chain_steps
CREATE POLICY "Users can manage their chain steps" ON public.chain_steps
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.prompt_chains pc 
      WHERE pc.id = chain_steps.chain_id 
      AND pc.user_id = auth.uid()
    )
  );

-- RLS Policies for chain_conditions
CREATE POLICY "Users can manage their chain conditions" ON public.chain_conditions
  FOR ALL USING (
    (step_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.chain_steps cs
      JOIN public.prompt_chains pc ON pc.id = cs.chain_id
      WHERE cs.id = chain_conditions.step_id 
      AND pc.user_id = auth.uid()
    ))
    OR
    (chain_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.prompt_chains pc 
      WHERE pc.id = chain_conditions.chain_id 
      AND pc.user_id = auth.uid()
    ))
  );

-- RLS Policies for chain_variables
CREATE POLICY "Users can manage their chain variables" ON public.chain_variables
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.prompt_chains pc 
      WHERE pc.id = chain_variables.chain_id 
      AND pc.user_id = auth.uid()
    )
  );

-- Update triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_characters_updated_at
  BEFORE UPDATE ON public.characters
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_emotions_updated_at
  BEFORE UPDATE ON public.emotions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_prompt_chains_updated_at
  BEFORE UPDATE ON public.prompt_chains
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_characters_user_id ON public.characters(user_id);
CREATE INDEX IF NOT EXISTS idx_characters_name ON public.characters(name);
CREATE INDEX IF NOT EXISTS idx_emotions_user_id ON public.emotions(user_id);
CREATE INDEX IF NOT EXISTS idx_emotions_primary_emotion ON public.emotions(primary_emotion);
CREATE INDEX IF NOT EXISTS idx_character_emotions_character_id ON public.character_emotions(character_id);
CREATE INDEX IF NOT EXISTS idx_character_emotions_emotion_id ON public.character_emotions(emotion_id);
CREATE INDEX IF NOT EXISTS idx_emotion_history_character_id ON public.emotion_history(character_id);
CREATE INDEX IF NOT EXISTS idx_emotion_history_timestamp ON public.emotion_history(timestamp);
CREATE INDEX IF NOT EXISTS idx_prompt_chains_user_id ON public.prompt_chains(user_id);
CREATE INDEX IF NOT EXISTS idx_prompt_chains_category ON public.prompt_chains(category);
CREATE INDEX IF NOT EXISTS idx_chain_steps_chain_id ON public.chain_steps(chain_id);
CREATE INDEX IF NOT EXISTS idx_chain_steps_order ON public.chain_steps(step_order);
CREATE INDEX IF NOT EXISTS idx_chain_conditions_step_id ON public.chain_conditions(step_id);
CREATE INDEX IF NOT EXISTS idx_chain_conditions_chain_id ON public.chain_conditions(chain_id);
CREATE INDEX IF NOT EXISTS idx_chain_variables_chain_id ON public.chain_variables(chain_id);