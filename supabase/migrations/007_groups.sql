-- ---------------------------------------------------------------------------
-- 007_groups.sql
-- Adds private friend groups for Circa+ subscribers.
-- Members share daily scores within a group; invite codes control access.
-- ---------------------------------------------------------------------------

-- Groups table
CREATE TABLE groups (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL CHECK (char_length(name) BETWEEN 2 AND 40),
  owner_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invite_code  TEXT UNIQUE NOT NULL DEFAULT substring(replace(gen_random_uuid()::text, '-', ''), 1, 8),
  max_members  INTEGER NOT NULL DEFAULT 20,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Group membership (owner always has a row here too)
CREATE TABLE group_members (
  group_id     UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  joined_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (group_id, user_id)
);

CREATE INDEX group_members_group_idx ON group_members(group_id);
CREATE INDEX group_members_user_idx  ON group_members(user_id);

-- ---------------------------------------------------------------------------
-- Row-Level Security
-- ---------------------------------------------------------------------------

ALTER TABLE groups        ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;

-- Groups: any member (including owner) can read; only owner can insert/delete
CREATE POLICY "groups_member_read" ON groups FOR SELECT USING (
  auth.uid() = owner_id OR
  EXISTS (SELECT 1 FROM group_members WHERE group_id = id AND user_id = auth.uid())
);
CREATE POLICY "groups_owner_insert" ON groups FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "groups_owner_delete" ON groups FOR DELETE USING (auth.uid() = owner_id);

-- Members: users see their own memberships; owners see all members in their groups
CREATE POLICY "group_members_read" ON group_members FOR SELECT USING (
  user_id = auth.uid() OR
  EXISTS (SELECT 1 FROM groups WHERE id = group_id AND owner_id = auth.uid())
);
CREATE POLICY "group_members_join"  ON group_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "group_members_leave" ON group_members FOR DELETE USING (
  user_id = auth.uid() OR
  EXISTS (SELECT 1 FROM groups WHERE id = group_id AND owner_id = auth.uid())
);
