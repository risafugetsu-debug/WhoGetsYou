CREATE TABLE IF NOT EXISTS public.messages (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  interest_id uuid NOT NULL REFERENCES public.interests(id) ON DELETE CASCADE,
  sender_id   uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body        text NOT NULL CHECK (char_length(body) > 0),
  created_at  timestamptz DEFAULT now(),
  read_at     timestamptz
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Both parties on an interest can read its messages
CREATE POLICY "Parties can read their messages"
  ON public.messages FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.interests
      WHERE interests.id = messages.interest_id
        AND (interests.pre_bride_id = auth.uid() OR interests.post_bride_id = auth.uid())
    )
  );

-- Both parties can send messages on their interest
CREATE POLICY "Parties can send messages"
  ON public.messages FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.interests
      WHERE interests.id = messages.interest_id
        AND (interests.pre_bride_id = auth.uid() OR interests.post_bride_id = auth.uid())
    )
  );

-- Recipients can mark messages as read
CREATE POLICY "Recipients can mark messages read"
  ON public.messages FOR UPDATE TO authenticated
  USING (
    sender_id != auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.interests
      WHERE interests.id = messages.interest_id
        AND (interests.pre_bride_id = auth.uid() OR interests.post_bride_id = auth.uid())
    )
  );

CREATE INDEX IF NOT EXISTS messages_interest_id_idx ON public.messages(interest_id);
CREATE INDEX IF NOT EXISTS messages_sender_id_idx ON public.messages(sender_id);
