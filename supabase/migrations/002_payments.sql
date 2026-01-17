-- Payment Module Schema
-- Version 1.0

-- Payment settings per event (for now, global settings)
CREATE TABLE payment_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  amount_cents INTEGER NOT NULL DEFAULT 5000, -- €50.00
  amount_partner_cents INTEGER DEFAULT 4000,  -- €40.00 extra for partner
  description TEXT DEFAULT 'Deelname event',
  deadline DATE,
  tikkie_enabled BOOLEAN DEFAULT true,
  auto_reminder_days INTEGER DEFAULT 3,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Individual payment requests linked to registrations
CREATE TABLE payment_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  registration_id UUID REFERENCES registrations(id) ON DELETE CASCADE,

  -- Tikkie specific
  tikkie_payment_request_token TEXT UNIQUE,
  tikkie_url TEXT,

  -- Payment details
  amount_cents INTEGER NOT NULL,
  description TEXT,

  -- Status tracking
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'expired', 'cancelled')),
  paid_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,

  -- Reminders
  reminder_count INTEGER DEFAULT 0,
  last_reminder_at TIMESTAMPTZ,

  -- Meta
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Webhook events log for debugging and audit
CREATE TABLE payment_webhooks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tikkie_notification_token TEXT,
  payment_request_id UUID REFERENCES payment_requests(id),
  event_type TEXT, -- 'PAYMENT_RECEIVED', 'PAYMENT_REQUEST_EXPIRED', etc.
  payload JSONB,
  processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMPTZ,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_payment_requests_user_id ON payment_requests(user_id);
CREATE INDEX idx_payment_requests_status ON payment_requests(status);
CREATE INDEX idx_payment_requests_tikkie_token ON payment_requests(tikkie_payment_request_token);
CREATE INDEX idx_payment_webhooks_processed ON payment_webhooks(processed);

-- RLS Policies
ALTER TABLE payment_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_webhooks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all" ON payment_settings FOR ALL USING (true);
CREATE POLICY "Allow all" ON payment_requests FOR ALL USING (true);
CREATE POLICY "Allow all" ON payment_webhooks FOR ALL USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_payment_settings_updated_at
  BEFORE UPDATE ON payment_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_requests_updated_at
  BEFORE UPDATE ON payment_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default settings
INSERT INTO payment_settings (amount_cents, amount_partner_cents, description)
VALUES (5000, 4000, 'Bovenkamer Winterproef 2026');
