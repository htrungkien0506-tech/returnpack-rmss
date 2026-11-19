-- ============================================================================
-- RETURNPACK MANAGEMENT SYSTEM (RMS) - WORKSHOP FULL FEATURES MIGRATION (v3)
-- ============================================================================

-- 1. Tuyến thu hồi & khung giờ Shipper theo Quận/Phường (PARTNER quản lý)
CREATE TABLE IF NOT EXISTS partner_pickup_routes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    route_code VARCHAR(50) UNIQUE NOT NULL,
    partner_org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    area_district VARCHAR(100) NOT NULL,
    active_days VARCHAR(100) NOT NULL DEFAULT 'Thứ 2 - Thứ 7',
    time_slots TEXT[] NOT NULL DEFAULT ARRAY['09:00 - 12:00', '14:00 - 17:00'],
    assigned_shipper_id UUID REFERENCES users(id),
    assigned_shipper_name VARCHAR(255) NOT NULL,
    assigned_shipper_phone VARCHAR(50) NOT NULL,
    max_capacity_per_slot INT NOT NULL DEFAULT 30,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Mở rộng bảng reward_offers để SHOP tự phát hành Voucher không cần Admin duyệt
ALTER TABLE reward_offers
    ADD COLUMN IF NOT EXISTS shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
    ADD COLUMN IF NOT EXISTS promo_code VARCHAR(50),
    ADD COLUMN IF NOT EXISTS discount_label VARCHAR(100),
    ADD COLUMN IF NOT EXISTS expires_at DATE;

-- 3. Phiếu bàn giao túi sạch (Loại A) & túi hỏng (Loại C) từ 3PL về Kho tổng Returnpack
CREATE TABLE IF NOT EXISTS hub_handover_receipts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    receipt_code VARCHAR(50) UNIQUE NOT NULL,
    partner_name VARCHAR(255) NOT NULL,
    grade_a_count INT NOT NULL DEFAULT 0,
    grade_c_count INT NOT NULL DEFAULT 0,
    bag_codes TEXT[] NOT NULL,
    status VARCHAR(40) NOT NULL DEFAULT 'PENDING_ADMIN_CONFIRM'
        CHECK (status IN ('PENDING_ADMIN_CONFIRM', 'CONFIRMED_INBOUND')),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    confirmed_at TIMESTAMPTZ
);

-- 4. Bảng đối soát SLA & Phí vận hành 3PL cuối tháng
CREATE TABLE IF NOT EXISTS partner_sla_settlements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    settlement_code VARCHAR(50) UNIQUE NOT NULL,
    period_month VARCHAR(20) NOT NULL,
    partner_name VARCHAR(255) NOT NULL,
    picked_up_count INT NOT NULL DEFAULT 0,
    cleaned_grade_a_count INT NOT NULL DEFAULT 0,
    sla_on_time_rate NUMERIC(5,2) NOT NULL DEFAULT 100.00,
    total_fee_vnd NUMERIC(14,2) NOT NULL DEFAULT 0,
    status VARCHAR(30) NOT NULL DEFAULT 'SUBMITTED'
        CHECK (status IN ('DRAFT', 'SUBMITTED', 'APPROVED_PAID')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    approved_at TIMESTAMPTZ
);

-- 5. Bật RLS & phân quyền cho các bảng mở rộng
ALTER TABLE partner_pickup_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE hub_handover_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_sla_settlements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS public_read_active_routes ON partner_pickup_routes;
CREATE POLICY public_read_active_routes ON partner_pickup_routes
    FOR SELECT USING (is_active = TRUE);

DROP POLICY IF EXISTS shop_manage_own_offers ON reward_offers;
CREATE POLICY shop_manage_own_offers ON reward_offers
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN users u ON u.id = ur.user_id
            WHERE u.auth_user_id = auth.uid()
              AND (ur.role_code IN ('SUPER_ADMIN', 'RETURNPACK_ADMIN') OR ur.shop_id = reward_offers.shop_id)
        )
    );
