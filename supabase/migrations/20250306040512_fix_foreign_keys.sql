-- Verify foreign key relationships
DO $$ 
BEGIN
  -- Check and recreate foreign key for campaign_participations if needed
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_name = 'campaign_participations_qr_code_id_fkey'
  ) THEN
    ALTER TABLE campaign_participations
    ADD CONSTRAINT campaign_participations_qr_code_id_fkey
    FOREIGN KEY (qr_code_id) REFERENCES qr_codes(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_name = 'campaign_participations_participant_id_fkey'
  ) THEN
    ALTER TABLE campaign_participations
    ADD CONSTRAINT campaign_participations_participant_id_fkey
    FOREIGN KEY (participant_id) REFERENCES campaign_participants(id) ON DELETE CASCADE;
  END IF;

  -- Create indexes if they don't exist
  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE indexname = 'idx_campaign_participations_qr_code_id'
  ) THEN
    CREATE INDEX idx_campaign_participations_qr_code_id ON campaign_participations(qr_code_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE indexname = 'idx_campaign_participations_participant_id'
  ) THEN
    CREATE INDEX idx_campaign_participations_participant_id ON campaign_participations(participant_id);
  END IF;
END $$; 