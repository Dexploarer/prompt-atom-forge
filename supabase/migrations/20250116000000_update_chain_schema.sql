/*
  # Update Chain Schema Migration
  
  This migration adds missing properties to the chain-related tables to align with the CLI's PromptChain interface.
  
  Changes:
  1. Add missing columns to prompt_chains table
  2. Add missing columns to chain_steps table
  3. Update chain_conditions table structure
  4. Add proper indexes for performance
*/

-- Add missing columns to prompt_chains table
ALTER TABLE public.prompt_chains 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Add missing columns to chain_steps table
ALTER TABLE public.chain_steps 
ADD COLUMN IF NOT EXISTS conditions JSONB DEFAULT '[]';

-- Update chain_conditions table to match CLI interface
ALTER TABLE public.chain_conditions 
ADD COLUMN IF NOT EXISTS condition_target TEXT;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_prompt_chains_user_id ON public.prompt_chains(user_id);
CREATE INDEX IF NOT EXISTS idx_prompt_chains_category ON public.prompt_chains(category);
CREATE INDEX IF NOT EXISTS idx_prompt_chains_difficulty ON public.prompt_chains(difficulty);
CREATE INDEX IF NOT EXISTS idx_prompt_chains_tags ON public.prompt_chains USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_prompt_chains_is_active ON public.prompt_chains(is_active);

CREATE INDEX IF NOT EXISTS idx_chain_steps_chain_id ON public.chain_steps(chain_id);
CREATE INDEX IF NOT EXISTS idx_chain_steps_order ON public.chain_steps(chain_id, step_order);

CREATE INDEX IF NOT EXISTS idx_chain_conditions_step_id ON public.chain_conditions(step_id);
CREATE INDEX IF NOT EXISTS idx_chain_conditions_chain_id ON public.chain_conditions(chain_id);
CREATE INDEX IF NOT EXISTS idx_chain_conditions_type ON public.chain_conditions(condition_type);

CREATE INDEX IF NOT EXISTS idx_chain_variables_chain_id ON public.chain_variables(chain_id);
CREATE INDEX IF NOT EXISTS idx_chain_variables_name ON public.chain_variables(chain_id, variable_name);

-- Add RLS policies for chain tables

-- Prompt chains policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'prompt_chains' AND policyname = 'Users can create their own chains'
  ) THEN
    CREATE POLICY "Users can create their own chains" ON public.prompt_chains
      FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'prompt_chains' AND policyname = 'Users can view their own chains'
  ) THEN
    CREATE POLICY "Users can view their own chains" ON public.prompt_chains
      FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'prompt_chains' AND policyname = 'Users can update their own chains'
  ) THEN
    CREATE POLICY "Users can update their own chains" ON public.prompt_chains
      FOR UPDATE
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'prompt_chains' AND policyname = 'Users can delete their own chains'
  ) THEN
    CREATE POLICY "Users can delete their own chains" ON public.prompt_chains
      FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Chain steps policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'chain_steps' AND policyname = 'Users can manage steps of their own chains'
  ) THEN
    CREATE POLICY "Users can manage steps of their own chains" ON public.chain_steps
      FOR ALL
      USING (EXISTS (
        SELECT 1 FROM public.prompt_chains 
        WHERE id = chain_steps.chain_id AND user_id = auth.uid()
      ));
  END IF;
END $$;

-- Chain conditions policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'chain_conditions' AND policyname = 'Users can manage conditions of their own chains'
  ) THEN
    CREATE POLICY "Users can manage conditions of their own chains" ON public.chain_conditions
      FOR ALL
      USING (EXISTS (
        SELECT 1 FROM public.prompt_chains 
        WHERE id = chain_conditions.chain_id AND user_id = auth.uid()
      ));
  END IF;
END $$;

-- Chain variables policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'chain_variables' AND policyname = 'Users can manage variables of their own chains'
  ) THEN
    CREATE POLICY "Users can manage variables of their own chains" ON public.chain_variables
      FOR ALL
      USING (EXISTS (
        SELECT 1 FROM public.prompt_chains 
        WHERE id = chain_variables.chain_id AND user_id = auth.uid()
      ));
  END IF;
END $$;

-- Enable RLS on chain tables
ALTER TABLE public.prompt_chains ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chain_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chain_conditions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chain_variables ENABLE ROW LEVEL SECURITY;

-- Add triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_prompt_chains_updated_at'
  ) THEN
    CREATE TRIGGER update_prompt_chains_updated_at
    BEFORE UPDATE ON public.prompt_chains
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;