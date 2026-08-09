-- ============================================
-- ADMIN TOURNAMENT APP - SUPABASE SCHEMA
-- Copy-paste this entire file into Supabase SQL Editor
-- Click RUN and wait for completion
-- ============================================

-- Create ENUM types
CREATE TYPE user_role AS ENUM ('player', 'admin', 'super_admin');
CREATE TYPE tournament_status AS ENUM ('draft', 'upcoming', 'registration_open', 'registration_closed', 'live', 'completed', 'cancelled');
CREATE TYPE payment_status AS ENUM ('pending', 'verified', 'rejected', 'refunded');
CREATE TYPE verification_status AS ENUM ('pending', 'verified', 'rejected', 'removed');
CREATE TYPE ban_type AS ENUM ('24_hours', '7_days', '1_month', 'permanent');
CREATE TYPE payout_status AS ENUM ('awaiting_details', 'details_submitted', 'under_review', 'paid', 'rejected', 'correction_required');

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    name VARCHAR(255),
    role user_role DEFAULT 'player',
    status VARCHAR(50) DEFAULT 'active',
    profile_image_url TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- PLAYER PROFILES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS player_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    game_name VARCHAR(255),
    game_uid VARCHAR(100),
    upi_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- TOURNAMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS tournaments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    organizer VARCHAR(255),
    date DATE,
    start_time TIME,
    timezone VARCHAR(50),
    start_at TIMESTAMP,
    registration_start_at TIMESTAMP,
    registration_end_at TIMESTAMP,
    room_release_at TIMESTAMP,
    entry_fee DECIMAL(10, 2),
    prize_money DECIMAL(10, 2),
    total_slots INTEGER,
    joined_slots INTEGER DEFAULT 0,
    available_slots INTEGER,
    game_mode VARCHAR(100),
    map VARCHAR(100),
    match_type VARCHAR(100),
    rules TEXT,
    rules_version INTEGER DEFAULT 1,
    prize_distribution TEXT,
    payment_instructions TEXT,
    banner_url TEXT,
    status tournament_status DEFAULT 'draft',
    manual_status_override BOOLEAN DEFAULT FALSE,
    room_id VARCHAR(100),
    room_password VARCHAR(100),
    room_released BOOLEAN DEFAULT FALSE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- TOURNAMENT PLAYERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS tournament_players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    join_id VARCHAR(50) UNIQUE,
    slot_number INTEGER,
    game_name VARCHAR(255),
    game_uid VARCHAR(100),
    payment_status payment_status DEFAULT 'pending',
    verification_status verification_status DEFAULT 'pending',
    rules_accepted BOOLEAN DEFAULT FALSE,
    rules_version_accepted INTEGER,
    joined_at TIMESTAMP DEFAULT NOW(),
    reservation_expires_at TIMESTAMP,
    removed_at TIMESTAMP,
    removed_by UUID REFERENCES users(id),
    removal_reason TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(tournament_id, user_id)
);

-- ============================================
-- PAYMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    tournament_player_id UUID NOT NULL REFERENCES tournament_players(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2),
    player_upi_id VARCHAR(255),
    utr VARCHAR(50) UNIQUE,
    screenshot_url TEXT,
    submitted_payment_at TIMESTAMP,
    status payment_status DEFAULT 'pending',
    verified_by UUID REFERENCES users(id),
    verified_at TIMESTAMP,
    rejection_reason TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- BANS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS bans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    ban_type ban_type,
    reason TEXT,
    started_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP,
    created_by UUID REFERENCES users(id),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- WINNERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS winners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    tournament_player_id UUID NOT NULL REFERENCES tournament_players(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    position INTEGER,
    prize_amount DECIMAL(10, 2),
    published_at TIMESTAMP,
    published_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- PAYOUTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS payouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    winner_id UUID NOT NULL REFERENCES winners(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    upi_id VARCHAR(255),
    qr_code_url TEXT,
    status payout_status DEFAULT 'awaiting_details',
    transaction_reference VARCHAR(100),
    submitted_at TIMESTAMP,
    paid_at TIMESTAMP,
    processed_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- NOTIFICATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
    title VARCHAR(255),
    message TEXT,
    read_status BOOLEAN DEFAULT FALSE,
    notification_type VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- PAYMENT SETTINGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS payment_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    upi_id VARCHAR(255),
    qr_code_url TEXT,
    payment_name VARCHAR(255),
    instructions TEXT,
    updated_by UUID REFERENCES users(id),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- AUDIT LOGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES users(id),
    action VARCHAR(255),
    target_type VARCHAR(100),
    target_id UUID,
    previous_value JSONB,
    new_value JSONB,
    timestamp TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- CREATE INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX idx_tournament_players_tournament_id ON tournament_players(tournament_id);
CREATE INDEX idx_tournament_players_user_id ON tournament_players(user_id);
CREATE INDEX idx_payments_tournament_id ON payments(tournament_id);
CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_bans_user_id ON bans(user_id);
CREATE INDEX idx_bans_expires_at ON bans(expires_at);
CREATE INDEX idx_winners_tournament_id ON winners(tournament_id);
CREATE INDEX idx_winners_user_id ON winners(user_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_tournaments_status ON tournaments(status);
CREATE INDEX idx_tournaments_created_by ON tournaments(created_by);
CREATE INDEX idx_audit_logs_admin_id ON audit_logs(admin_id);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp);

-- ============================================
-- ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================

-- Users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own profile" ON users
    FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins can read all users" ON users
    FOR SELECT USING (
        auth.uid() IN (
            SELECT id FROM users WHERE role IN ('admin', 'super_admin')
        )
    );

-- Player profiles
ALTER TABLE player_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Players can read own profile" ON player_profiles
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can read all profiles" ON player_profiles
    FOR SELECT USING (
        auth.uid() IN (
            SELECT id FROM users WHERE role IN ('admin', 'super_admin')
        )
    );

-- Tournaments
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read tournaments" ON tournaments
    FOR SELECT USING (TRUE);
CREATE POLICY "Admins can manage tournaments" ON tournaments
    FOR ALL USING (
        auth.uid() IN (
            SELECT id FROM users WHERE role IN ('admin', 'super_admin')
        )
    );

-- Tournament players
ALTER TABLE tournament_players ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Players can read own registrations" ON tournament_players
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can read all registrations" ON tournament_players
    FOR SELECT USING (
        auth.uid() IN (
            SELECT id FROM users WHERE role IN ('admin', 'super_admin')
        )
    );

-- Payments
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Players can read own payments" ON payments
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage payments" ON payments
    FOR ALL USING (
        auth.uid() IN (
            SELECT id FROM users WHERE role IN ('admin', 'super_admin')
        )
    );

-- Bans
ALTER TABLE bans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage bans" ON bans
    FOR ALL USING (
        auth.uid() IN (
            SELECT id FROM users WHERE role IN ('admin', 'super_admin')
        )
    );

-- Winners
ALTER TABLE winners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read winners" ON winners
    FOR SELECT USING (TRUE);
CREATE POLICY "Admins can manage winners" ON winners
    FOR ALL USING (
        auth.uid() IN (
            SELECT id FROM users WHERE role IN ('admin', 'super_admin')
        )
    );

-- Payouts
ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Winners can read own payouts" ON payouts
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage payouts" ON payouts
    FOR ALL USING (
        auth.uid() IN (
            SELECT id FROM users WHERE role IN ('admin', 'super_admin')
        )
    );

-- Notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own notifications" ON notifications
    FOR SELECT USING (auth.uid() = user_id);

-- Audit logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can read audit logs" ON audit_logs
    FOR SELECT USING (
        auth.uid() IN (
            SELECT id FROM users WHERE role IN ('admin', 'super_admin')
        )
    );

-- ============================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- ============================================

-- Update tournament available_slots when players join/removed
CREATE OR REPLACE FUNCTION update_tournament_slots()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE tournaments
    SET 
        joined_slots = (SELECT COUNT(*) FROM tournament_players WHERE tournament_id = NEW.tournament_id AND removed_at IS NULL),
        available_slots = total_slots - (SELECT COUNT(*) FROM tournament_players WHERE tournament_id = NEW.tournament_id AND removed_at IS NULL)
    WHERE id = NEW.tournament_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_slots_after_player_join
AFTER INSERT ON tournament_players
FOR EACH ROW
EXECUTE FUNCTION update_tournament_slots();

CREATE TRIGGER update_slots_after_player_remove
AFTER UPDATE ON tournament_players
FOR EACH ROW
WHEN (OLD.removed_at IS NULL AND NEW.removed_at IS NOT NULL)
EXECUTE FUNCTION update_tournament_slots();

-- Auto-expire temporary bans
CREATE OR REPLACE FUNCTION check_expired_bans()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE bans
    SET status = 'expired'
    WHERE expires_at <= NOW() AND status = 'active';
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- SAMPLE DATA FOR TESTING (OPTIONAL)
-- ============================================

-- Create demo admin user
INSERT INTO users (id, email, name, role, status) VALUES
    ('550e8400-e29b-41d4-a716-446655440001', 'admin@tournament.app', 'Admin User', 'admin', 'active')
ON CONFLICT (email) DO NOTHING;

-- Create demo payment settings
INSERT INTO payment_settings (upi_id, payment_name, instructions) VALUES
    ('tournament@upi', 'Admin Tournament', 'Send payment to registered UPI ID and submit UTR')
ON CONFLICT DO NOTHING;

-- ============================================
-- Schema setup complete!
-- ============================================
