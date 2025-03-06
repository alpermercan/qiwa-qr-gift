-- Drop existing policies
DROP POLICY IF EXISTS "Campaign participants are viewable by admin" ON campaign_participants;
DROP POLICY IF EXISTS "Campaign participants can be created by anyone" ON campaign_participants;

-- Create new policies for campaign_participants
CREATE POLICY "Campaign participants are viewable by everyone"
ON campaign_participants FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Campaign participants can be created by anyone"
ON campaign_participants FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Drop existing policies for participations
DROP POLICY IF EXISTS "Campaign participations are viewable by admin" ON campaign_participations;
DROP POLICY IF EXISTS "Campaign participations can be created by anyone" ON campaign_participations;

-- Create new policies for campaign_participations
CREATE POLICY "Campaign participations are viewable by everyone"
ON campaign_participations FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Campaign participations can be created by anyone"
ON campaign_participations FOR INSERT
TO anon, authenticated
WITH CHECK (true); 