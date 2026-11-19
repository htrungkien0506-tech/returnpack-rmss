'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  Package,
  QrCode,
  Store,
  CreditCard,
  Truck,
  Warehouse,
  Award,
  BarChart3,
  ShieldCheck,
  Search,
  Plus,
  Download,
  Printer,
  CheckCircle2,
  AlertTriangle,
  Clock,
  RefreshCw,
  ArrowRight,
  Lock,
  Unlock,
  FileSpreadsheet,
  MapPin,
  RotateCcw,
  History,
  Wrench,
  Recycle,
  X,
  Info,
  LogOut,
  Users,
  ScanLine,
  TrendingUp,
  AlertCircle,
  Copy,
  Camera,
  Ticket,
  PanelLeftClose,
  PanelLeftOpen,
  UserCheck,
  Sliders,
  Calendar,
  Edit3,
  Trash2,
  Eye,
  Ban,
  Sparkles
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

// ============================================================================
// 1. TYPES & CONSTANTS
// ============================================================================
type StakeholderRole = 'ADMIN' | 'SHOP' | 'CUSTOMER' | 'PARTNER';

type BagStatus =
  | 'AVAILABLE_AT_WAREHOUSE'
  | 'AT_SHOP'
  | 'IN_TRANSIT'
  | 'WAITING_RETURN'
  | 'PICKED_UP_BY_SHIPPER'
  | 'PENDING_INSPECTION'
  | 'CLEANING_MAINTENANCE'
  | 'LOCKED_DEFECTIVE'
  | 'RETIRED_WAITING_RECYCLE'
  | 'HANDED_OVER_RECYCLE'
  | 'LOST';

type ReturnRequestStatus =
  | 'RECEIVED'
  | 'MATCHING_ROUTE'
  | 'ASSIGNED_SHIPPER'
  | 'PICKED_UP'
  | 'COMPLETED_AT_WAREHOUSE'
  | 'FAILED_PICKUP'
  | 'CANCELLED';

interface BagRecord {
  id: string;
  bagCode: string;
  size: 'S (25x35cm)' | 'M (32x43cm)' | 'L (40x55cm)';
  batchCode: string;
  currentLocation: string;
  holdingShopId: string | null;
  holdingShopName: string | null;
  status: BagStatus;
  cyclesUsed: number;
  maxCycles: number;
  qualityGrade: 'A' | 'B' | 'C';
  lastInspectionResult: string;
  updatedAt: string;
}

interface ShopOrderRecord {
  id: string;
  shopId: string;
  orderCode: string;
  bagCode: string;
  packedAt: string;
  status: string;
}

interface ShopRecord {
  id: string;
  shopCode: string;
  shopName: string;
  ownerName: string;
  phone: string;
  email: string;
  address: string;
  district: string;
  planId: 'PLAN_BASIC' | 'PLAN_STANDARD' | 'PLAN_ENTERPRISE';
  planName: string;
  monthlyQuotaTurns: number;
  usedTurns: number;
  concurrentBagLimit: number;
  currentBagsHeld: number;
  packedOrdersCount: number;
  outstandingDebtVnd: number;
  subscriptionEnd: string;
  status: 'ACTIVE' | 'LOCKED';
}

interface PickupRouteRecord {
  id: string;
  routeCode: string;
  district: string;
  activeDays: string;
  activeWeekdays: number[]; // 0=CN, 1=T2, 2=T3, 3=T4, 4=T5, 5=T6, 6=T7
  timeSlots: string[];
  shipperName: string;
  shipperPhone: string;
  isActive: boolean;
}

interface ReturnTimelineLog {
  step: string;
  timestamp: string;
  note: string;
}

interface ReturnRequestRecord {
  id: string;
  requestCode: string;
  bagCode: string;
  usageCycleKey: string;
  customerName: string;
  customerPhone: string;
  pickupAddress: string;
  areaDistrict: string;
  routeCode: string;
  scheduledDateIso: string; // YYYY-MM-DD
  scheduledDateDisplay: string; // DD/MM/YYYY
  preferredTimeSlot: string;
  customerNote: string;
  status: ReturnRequestStatus;
  assignedShipperName: string | null;
  scheduledWindow: string;
  waitingHours: number;
  isOverdue: boolean;
  rewardGranted: boolean;
  createdAt: string; // DD/MM/YYYY HH:mm
  timelineLogs: ReturnTimelineLog[];
}

interface AllocationRecord {
  id: string;
  allocationCode: string;
  shopId: string;
  shopName: string;
  size: 'S (25x35cm)' | 'M (32x43cm)' | 'L (40x55cm)';
  quantity: number;
  status: 'PENDING' | 'APPROVED' | 'CONFIRMED' | 'REJECTED';
  rejectReason?: string;
  createdAt: string;
}

interface MaintenanceJobRecord {
  id: string;
  bagCode: string;
  jobType: 'Vệ sinh khử khuẩn' | 'Sửa khóa kéo' | 'Thay tem QR';
  status: 'IN_PROGRESS' | 'COMPLETED';
  assignedStaff: string;
  startedAt: string;
}

interface HubHandoverReceipt {
  id: string;
  receiptCode: string;
  partnerName: string;
  gradeACodes: string[];
  gradeCCodes: string[];
  status: 'PENDING_ADMIN_CONFIRM' | 'CONFIRMED_INBOUND' | 'REJECTED_RECOUNT';
  adminNote?: string;
  createdAt: string;
}

interface ShopVoucherOffer {
  id: string;
  shopId: string;
  shopName: string;
  title: string;
  discountLabel: string;
  promoCode: string;
  pointsRequired: number;
  stockRemaining: number;
  expiresAt: string;
  isActive: boolean;
}

interface RewardTransactionRecord {
  id: string;
  txCode: string;
  customerName: string;
  bagCode: string;
  usageCycleKey: string;
  txType: 'EARN_RETURN' | 'REDEEM_OFFER' | 'REVERSAL';
  pointsDelta: number;
  description: string;
  createdAt: string;
  isReversed?: boolean;
}

interface CustomerVoucher {
  id: string;
  code: string;
  qrPayload: string;
  title: string;
  discountLabel: string;
  sponsor: string;
  redeemedAt: string;
  expiresAt: string;
  autoIssued?: boolean;
  status: 'Sẵn sàng dùng' | 'Đã sử dụng';
}

interface SystemUserAccount {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  role: StakeholderRole;
  orgLabel: string;
  status: 'ACTIVE' | 'LOCKED';
  createdAt: string;
}

interface AuditLogRecord {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  entity: string;
  detail: string;
}

// Date Helpers
const WEEKDAY_VN: Record<number, string> = {
  0: 'Chủ nhật',
  1: 'Thứ 2',
  2: 'Thứ 3',
  3: 'Thứ 4',
  4: 'Thứ 5',
  5: 'Thứ 6',
  6: 'Thứ 7'
};

function formatDateIsoToVn(iso: string): string {
  if (!iso || !iso.includes('-')) return iso;
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

function getNowFullVn(): string {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, '0');
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const yyyy = now.getFullYear();
  const hh = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
}

function getWeekdayFromIso(iso: string): number {
  const d = new Date(`${iso}T00:00:00`);
  return isNaN(d.getTime()) ? 1 : d.getDay();
}

function findNextAvailableDateIso(activeWeekdays: number[], fromIso: string): string {
  if (!activeWeekdays || activeWeekdays.length === 0) return fromIso;
  const start = new Date(`${fromIso}T00:00:00`);
  if (isNaN(start.getTime())) return fromIso;
  for (let offset = 0; offset < 14; offset++) {
    const candidate = new Date(start.getTime() + offset * 86400000);
    if (activeWeekdays.includes(candidate.getDay())) {
      const y = candidate.getFullYear();
      const m = String(candidate.getMonth() + 1).padStart(2, '0');
      const d = String(candidate.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
  }
  return fromIso;
}

const BAG_STATUS_META: Record<
  BagStatus,
  { label: string; bg: string; text: string; dot: string }
> = {
  AVAILABLE_AT_WAREHOUSE: { label: 'Sẵn sàng tại kho', bg: 'bg-[#E5F7ED]', text: 'text-[#155C3B]', dot: 'bg-[#48B86C]' },
  AT_SHOP: { label: 'Đang tại Shop', bg: 'bg-sky-50', text: 'text-sky-800', dot: 'bg-[#61C6EC]' },
  IN_TRANSIT: { label: 'Đang giao hàng', bg: 'bg-blue-50', text: 'text-blue-800', dot: 'bg-blue-500' },
  WAITING_RETURN: { label: 'Chờ thu hồi', bg: 'bg-amber-50', text: 'text-amber-900', dot: 'bg-[#FFD866]' },
  PICKED_UP_BY_SHIPPER: { label: 'Shipper đã nhận', bg: 'bg-indigo-50', text: 'text-indigo-800', dot: 'bg-indigo-500' },
  PENDING_INSPECTION: { label: 'Chờ kiểm tra trạm', bg: 'bg-purple-50', text: 'text-purple-800', dot: 'bg-purple-500' },
  CLEANING_MAINTENANCE: { label: 'Đang vệ sinh', bg: 'bg-cyan-50', text: 'text-cyan-900', dot: 'bg-cyan-500' },
  LOCKED_DEFECTIVE: { label: 'Đã khóa hỏng', bg: 'bg-rose-50', text: 'text-rose-800', dot: 'bg-rose-500' },
  RETIRED_WAITING_RECYCLE: { label: 'Chờ tái chế (Loại C)', bg: 'bg-orange-50', text: 'text-orange-800', dot: 'bg-orange-500' },
  HANDED_OVER_RECYCLE: { label: 'Đã giao tái chế', bg: 'bg-stone-100', text: 'text-stone-700', dot: 'bg-stone-500' },
  LOST: { label: 'Thất lạc', bg: 'bg-red-50', text: 'text-red-800', dot: 'bg-red-600' }
};

const RETURN_STATUS_META: Record<
  ReturnRequestStatus,
  { label: string; badge: string; stepIndex: number }
> = {
  RECEIVED: { label: 'Đã tiếp nhận tuyến', badge: 'bg-amber-100 text-amber-900 border-amber-300', stepIndex: 1 },
  MATCHING_ROUTE: { label: 'Đang ghép chuyến', badge: 'bg-sky-100 text-sky-900 border-sky-300', stepIndex: 2 },
  ASSIGNED_SHIPPER: { label: 'Shipper đang tới tuyến', badge: 'bg-blue-100 text-blue-900 border-blue-300', stepIndex: 3 },
  PICKED_UP: { label: 'Đã thu hồi thành công', badge: 'bg-[#E5F7ED] text-[#155C3B] border-[#48B86C]', stepIndex: 4 },
  COMPLETED_AT_WAREHOUSE: { label: 'Hoàn tất về trạm', badge: 'bg-[#155C3B] text-white border-[#155C3B]', stepIndex: 5 },
  FAILED_PICKUP: { label: 'Hẹn lại tuyến sau', badge: 'bg-rose-100 text-rose-800 border-rose-300', stepIndex: 2 },
  CANCELLED: { label: 'Đã hủy lịch', badge: 'bg-stone-100 text-stone-600 border-stone-300', stepIndex: 0 }
};

// ============================================================================
// 2. CUSTOM SVG COMPONENTS
// ============================================================================
const EarthMascot3D: React.FC<{ pose?: 'wave' | 'thumb' | 'happy'; size?: number }> = ({ pose = 'wave', size = 80 }) => (
  <svg width={size} height={size} viewBox="0 0 140 140" fill="none" className="drop-shadow-md shrink-0">
    <defs>
      <radialGradient id="earthOcean3D" cx="32%" cy="28%" r="72%">
        <stop offset="0%" stopColor="#7AD3F6" />
        <stop offset="55%" stopColor="#3B9ECE" />
        <stop offset="100%" stopColor="#145374" />
      </radialGradient>
      <linearGradient id="leafGrad3D" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#A9E65A" />
        <stop offset="100%" stopColor="#155C3B" />
      </linearGradient>
    </defs>
    <ellipse cx="70" cy="129" rx="30" ry="5" fill="#0B1F17" fillOpacity="0.22" />
    <path d="M68 26 C65 12, 50 8, 46 17 C44 23, 57 28, 68 26 Z" fill="url(#leafGrad3D)" stroke="#0B1F17" strokeWidth="1.8" />
    <path d="M71 26 C75 10, 92 8, 95 18 C96 24, 83 28, 71 26 Z" fill="url(#leafGrad3D)" stroke="#0B1F17" strokeWidth="1.8" />
    <path d="M69.5 29 L69.5 22" stroke="#0B1F17" strokeWidth="2.2" strokeLinecap="round" />
    <rect x="54" y="106" width="10" height="16" rx="5" fill="#267BA6" stroke="#0B1F17" strokeWidth="1.8" />
    <rect x="76" y="106" width="10" height="16" rx="5" fill="#267BA6" stroke="#0B1F17" strokeWidth="1.8" />
    <path d="M29 68 C18 59, 15 48, 22 43 C27 40, 32 50, 34 58" fill="#3B9ECE" stroke="#0B1F17" strokeWidth="2" strokeLinecap="round" />
    {pose === 'thumb' ? (
      <g>
        <path d="M109 70 C120 66, 124 57, 118 52 C114 48, 109 57, 105 64" fill="#3B9ECE" stroke="#0B1F17" strokeWidth="2" />
        <circle cx="119" cy="50" r="4.5" fill="#D4AF37" stroke="#0B1F17" strokeWidth="1.6" />
      </g>
    ) : (
      <path d="M109 72 C119 75, 121 83, 114 87 C108 89, 105 82, 104 77" fill="#3B9ECE" stroke="#0B1F17" strokeWidth="2" />
    )}
    <circle cx="70" cy="72" r="42" fill="url(#earthOcean3D)" stroke="#0B1F17" strokeWidth="2.2" />
    <path d="M43 47 C52 43, 61 49, 58 58 C55 65, 44 67, 38 61 C34 55, 38 49, 43 47 Z" fill="#2DAF73" />
    <path d="M83 45 C93 46, 103 54, 100 66 C97 74, 88 72, 83 65 C78 57, 77 45, 83 45 Z" fill="#2DAF73" />
    <circle cx="57" cy="67" r="4.8" fill="#0B1F17" />
    <circle cx="55.5" cy="65" r="1.6" fill="#FFFFFF" />
    <circle cx="83" cy="67" r="4.8" fill="#0B1F17" />
    <circle cx="81.5" cy="65" r="1.6" fill="#FFFFFF" />
    <path d="M63 76 Q70 81 77 76" stroke="#0B1F17" strokeWidth="2.4" strokeLinecap="round" fill="none" />
  </svg>
);

const QrMatrixSvg: React.FC<{ value: string; size?: number }> = ({ value, size = 56 }) => {
  const cells: boolean[] = [];
  let hash = 2166136261;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  for (let r = 0; r < 7; r++) {
    for (let c = 0; c < 7; c++) {
      const isFinder = (r < 2 && c < 2) || (r < 2 && c > 4) || (r > 4 && c < 2);
      const bit = ((hash >>> ((r * 7 + c) % 24)) & 1) === 1;
      cells.push(isFinder || bit);
    }
  }
  return (
    <svg width={size} height={size} viewBox="0 0 70 70" className="bg-white p-1 rounded border border-[#155C3B]/30 shrink-0">
      {cells.map((filled, idx) => {
        if (!filled) return null;
        const r = Math.floor(idx / 7);
        const c = idx % 7;
        return <rect key={idx} x={c * 10 + 1} y={r * 10 + 1} width="8" height="8" rx="1" fill="#183A2A" />;
      })}
    </svg>
  );
};

// ============================================================================
// 3. INITIAL SEED DATA
// ============================================================================
const DEFAULT_PICKUP_ROUTES: PickupRouteRecord[] = [
  { id: 'RT-01', routeCode: 'TUYEN-Q10', district: 'Quận 10', activeDays: 'Thứ 2, Thứ 4, Thứ 6', activeWeekdays: [1, 3, 5], timeSlots: ['09:00 - 12:00', '14:00 - 17:00'], shipperName: 'Lê Hoàng Nam', shipperPhone: '0909 111 222', isActive: true },
  { id: 'RT-02', routeCode: 'TUYEN-BINHTHANH', district: 'Quận Bình Thạnh', activeDays: 'Thứ 2 - Thứ 7', activeWeekdays: [1, 2, 3, 4, 5, 6], timeSlots: ['09:00 - 12:00', '14:00 - 17:00', '18:00 - 20:30'], shipperName: 'Lê Hoàng Nam', shipperPhone: '0909 111 222', isActive: true },
  { id: 'RT-03', routeCode: 'TUYEN-Q3', district: 'Quận 3', activeDays: 'Thứ 3, Thứ 5, Thứ 7', activeWeekdays: [2, 4, 6], timeSlots: ['09:00 - 12:00', '18:00 - 20:30'], shipperName: 'Trần Minh Quân', shipperPhone: '0908 333 444', isActive: true },
  { id: 'RT-04', routeCode: 'TUYEN-Q1', district: 'Quận 1', activeDays: 'Hàng ngày (T2 - CN)', activeWeekdays: [0, 1, 2, 3, 4, 5, 6], timeSlots: ['10:00 - 13:00', '15:00 - 18:00'], shipperName: 'Trần Minh Quân', shipperPhone: '0908 333 444', isActive: true },
  { id: 'RT-05', routeCode: 'TUYEN-THUDUC', district: 'TP. Thủ Đức', activeDays: 'Thứ 2, Thứ 5, Chủ nhật', activeWeekdays: [1, 4, 0], timeSlots: ['14:00 - 17:00'], shipperName: 'Phạm Quốc Bảo', shipperPhone: '0907 555 666', isActive: true }
];

const DEFAULT_SHOPS: ShopRecord[] = [
  { id: 'SHOP-A', shopCode: 'SH-GREENSTYLE', shopName: 'GreenStyle Fashion', ownerName: 'Nguyễn Minh Thảo', phone: '0912345678', email: 'shop@greenstyle.vn', address: '128 Nguyễn Gia Trí, P.25', district: 'Quận Bình Thạnh', planId: 'PLAN_STANDARD', planName: 'Gói Tiêu chuẩn', monthlyQuotaTurns: 1000, usedTurns: 412, concurrentBagLimit: 250, currentBagsHeld: 3, packedOrdersCount: 412, outstandingDebtVnd: 0, subscriptionEnd: '30/11/2026', status: 'ACTIVE' },
  { id: 'SHOP-B', shopCode: 'SH-ECOCOSMETICS', shopName: 'EcoCosmetics VN', ownerName: 'Phạm Hoàng Yến', phone: '0987654321', email: 'sales@ecocosmetics.vn', address: '45 Lê Văn Sỹ, P.13', district: 'Quận 3', planId: 'PLAN_BASIC', planName: 'Gói Cơ bản', monthlyQuotaTurns: 500, usedTurns: 486, concurrentBagLimit: 150, currentBagsHeld: 1, packedOrdersCount: 486, outstandingDebtVnd: 235000, subscriptionEnd: '30/11/2026', status: 'ACTIVE' }
];

const DEFAULT_BAGS: BagRecord[] = [
  { id: 'BAG-1', bagCode: 'RP-000001', size: 'M (32x43cm)', batchCode: 'LOT-2610A', currentLocation: 'GreenStyle Fashion (Q. Bình Thạnh)', holdingShopId: 'SHOP-A', holdingShopName: 'GreenStyle Fashion', status: 'AT_SHOP', cyclesUsed: 3, maxCycles: 15, qualityGrade: 'A', lastInspectionResult: 'Đạt chuẩn Loại A', updatedAt: '19/11/2026 09:00' },
  { id: 'BAG-2', bagCode: 'RP-000002', size: 'M (32x43cm)', batchCode: 'LOT-2610A', currentLocation: 'GreenStyle Fashion (Q. Bình Thạnh)', holdingShopId: 'SHOP-A', holdingShopName: 'GreenStyle Fashion', status: 'AT_SHOP', cyclesUsed: 5, maxCycles: 15, qualityGrade: 'A', lastInspectionResult: 'Đạt chuẩn Loại A', updatedAt: '19/11/2026 09:15' },
  { id: 'BAG-3', bagCode: 'RP-000003', size: 'L (40x55cm)', batchCode: 'LOT-2610B', currentLocation: 'Đang giao khách (Quận 10)', holdingShopId: null, holdingShopName: null, status: 'IN_TRANSIT', cyclesUsed: 7, maxCycles: 15, qualityGrade: 'A', lastInspectionResult: 'Đạt chuẩn Loại A', updatedAt: '19/11/2026 10:20' },
  { id: 'BAG-4', bagCode: 'RP-000004', size: 'M (32x43cm)', batchCode: 'LOT-2610A', currentLocation: 'Chờ thu hồi (Q. Bình Thạnh)', holdingShopId: null, holdingShopName: null, status: 'WAITING_RETURN', cyclesUsed: 8, maxCycles: 15, qualityGrade: 'A', lastInspectionResult: 'Đạt chuẩn Loại A', updatedAt: '19/11/2026 10:05' },
  { id: 'BAG-5', bagCode: 'RP-000005', size: 'S (25x35cm)', batchCode: 'LOT-2609C', currentLocation: 'Chờ thu hồi (Quận 3)', holdingShopId: null, holdingShopName: null, status: 'WAITING_RETURN', cyclesUsed: 11, maxCycles: 15, qualityGrade: 'A', lastInspectionResult: 'Đạt chuẩn Loại A', updatedAt: '18/11/2026 18:30' },
  { id: 'BAG-6', bagCode: 'RP-000006', size: 'M (32x43cm)', batchCode: 'LOT-2610A', currentLocation: 'Shipper Lê Hoàng Nam', holdingShopId: null, holdingShopName: null, status: 'PICKED_UP_BY_SHIPPER', cyclesUsed: 4, maxCycles: 15, qualityGrade: 'A', lastInspectionResult: 'Đạt chuẩn Loại A', updatedAt: '19/11/2026 11:10' },
  { id: 'BAG-7', bagCode: 'RP-000007', size: 'M (32x43cm)', batchCode: 'LOT-2609C', currentLocation: 'Trạm 3PL - Khu vệ sinh', holdingShopId: null, holdingShopName: null, status: 'CLEANING_MAINTENANCE', cyclesUsed: 9, maxCycles: 15, qualityGrade: 'B', lastInspectionResult: 'Loại B - Cần vệ sinh', updatedAt: '19/11/2026 11:00' },
  { id: 'BAG-8', bagCode: 'RP-000008', size: 'L (40x55cm)', batchCode: 'LOT-2610B', currentLocation: 'Kho tổng Thủ Đức - Kệ A1', holdingShopId: null, holdingShopName: null, status: 'AVAILABLE_AT_WAREHOUSE', cyclesUsed: 2, maxCycles: 15, qualityGrade: 'A', lastInspectionResult: 'Đạt chuẩn Loại A', updatedAt: '19/11/2026 08:00' },
  { id: 'BAG-9', bagCode: 'RP-000009', size: 'M (32x43cm)', batchCode: 'LOT-2610A', currentLocation: 'Kho tổng Thủ Đức - Kệ A2', holdingShopId: null, holdingShopName: null, status: 'AVAILABLE_AT_WAREHOUSE', cyclesUsed: 14, maxCycles: 15, qualityGrade: 'A', lastInspectionResult: 'Sắp chạm ngưỡng 15 vòng', updatedAt: '19/11/2026 08:30' },
  { id: 'BAG-10', bagCode: 'RP-000010', size: 'S (25x35cm)', batchCode: 'LOT-2608A', currentLocation: 'Trạm 3PL - Khu Loại C', holdingShopId: null, holdingShopName: null, status: 'RETIRED_WAITING_RECYCLE', cyclesUsed: 15, maxCycles: 15, qualityGrade: 'C', lastInspectionResult: 'Hết giới hạn 15/15 vòng', updatedAt: '18/11/2026 17:20' },
  { id: 'BAG-11', bagCode: 'RP-000011', size: 'M (32x43cm)', batchCode: 'LOT-2610A', currentLocation: 'Trạm 3PL - Chờ QC', holdingShopId: null, holdingShopName: null, status: 'PENDING_INSPECTION', cyclesUsed: 6, maxCycles: 15, qualityGrade: 'A', lastInspectionResult: 'Chờ kiểm đếm đầu vào', updatedAt: '19/11/2026 11:45' },
  { id: 'BAG-12', bagCode: 'RP-000012', size: 'M (32x43cm)', batchCode: 'LOT-2610A', currentLocation: 'EcoCosmetics VN (Quận 3)', holdingShopId: 'SHOP-B', holdingShopName: 'EcoCosmetics VN', status: 'AT_SHOP', cyclesUsed: 4, maxCycles: 15, qualityGrade: 'A', lastInspectionResult: 'Đạt chuẩn Loại A', updatedAt: '19/11/2026 09:40' }
];

const DEFAULT_RETURN_REQUESTS: ReturnRequestRecord[] = [
  {
    id: 'RET-1',
    requestCode: 'YC-2026-101',
    bagCode: 'RP-000004',
    usageCycleKey: 'RP-000004-CYCLE-8',
    customerName: 'Hoàng Trung Kiên',
    customerPhone: '0905889900',
    pickupAddress: '215 Điện Biên Phủ, P.15, Quận Bình Thạnh',
    areaDistrict: 'Quận Bình Thạnh',
    routeCode: 'TUYEN-BINHTHANH',
    scheduledDateIso: '2026-11-20',
    scheduledDateDisplay: '20/11/2026',
    preferredTimeSlot: '14:00 - 17:00',
    customerNote: 'Gửi tại quầy lễ tân tòa nhà',
    status: 'ASSIGNED_SHIPPER',
    assignedShipperName: 'Lê Hoàng Nam',
    scheduledWindow: '20/11/2026 • 14:00 - 17:00 (TUYEN-BINHTHANH)',
    waitingHours: 4,
    isOverdue: false,
    rewardGranted: false,
    createdAt: '19/11/2026 09:30',
    timelineLogs: [
      { step: 'Tạo yêu cầu hoàn trả', timestamp: '19/11/2026 09:30', note: 'Khớp lịch tuyến TUYEN-BINHTHANH ngày 20/11/2026' },
      { step: 'Phân công Shipper', timestamp: '19/11/2026 09:32', note: 'Giao tự động cho Shipper Lê Hoàng Nam' }
    ]
  },
  {
    id: 'RET-2',
    requestCode: 'YC-2026-102',
    bagCode: 'RP-000005',
    usageCycleKey: 'RP-000005-CYCLE-11',
    customerName: 'Phạm Quốc Huy',
    customerPhone: '0938776655',
    pickupAddress: '102 Võ Văn Tần, P.6, Quận 3',
    areaDistrict: 'Quận 3',
    routeCode: 'TUYEN-Q3',
    scheduledDateIso: '2026-11-19',
    scheduledDateDisplay: '19/11/2026',
    preferredTimeSlot: '09:00 - 12:00',
    customerNote: 'Gọi trước 10 phút',
    status: 'MATCHING_ROUTE',
    assignedShipperName: 'Trần Minh Quân',
    scheduledWindow: '19/11/2026 • 09:00 - 12:00 (TUYEN-Q3)',
    waitingHours: 28,
    isOverdue: true,
    rewardGranted: false,
    createdAt: '18/11/2026 08:30',
    timelineLogs: [
      { step: 'Tạo yêu cầu hoàn trả', timestamp: '18/11/2026 08:30', note: 'Đăng ký tuyến TUYEN-Q3 ngày 19/11/2026' }
    ]
  },
  {
    id: 'RET-3',
    requestCode: 'YC-2026-103',
    bagCode: 'RP-000006',
    usageCycleKey: 'RP-000006-CYCLE-4',
    customerName: 'Hoàng Trung Kiên',
    customerPhone: '0905889900',
    pickupAddress: '279 Nguyễn Tri Phương, P.5, Quận 10',
    areaDistrict: 'Quận 10',
    routeCode: 'TUYEN-Q10',
    scheduledDateIso: '2026-11-18',
    scheduledDateDisplay: '18/11/2026',
    preferredTimeSlot: '09:00 - 12:00',
    customerNote: '',
    status: 'PICKED_UP',
    assignedShipperName: 'Lê Hoàng Nam',
    scheduledWindow: '18/11/2026 • Đã thu hồi 11:10',
    waitingHours: 2,
    isOverdue: false,
    rewardGranted: true,
    createdAt: '18/11/2026 09:00',
    timelineLogs: [
      { step: 'Tạo yêu cầu hoàn trả', timestamp: '18/11/2026 09:00', note: 'Khớp tuyến TUYEN-Q10 ngày 18/11/2026' },
      { step: 'Shipper quét QR thu hồi', timestamp: '18/11/2026 11:10', note: 'Lê Hoàng Nam xác nhận nhận túi & cộng +100 điểm xanh' }
    ]
  }
];

const DEFAULT_OFFERS: ShopVoucherOffer[] = [
  { id: 'OF-1', shopId: 'SHOP-A', shopName: 'GreenStyle Fashion', title: 'Giảm 20.000đ đơn từ 199K tại GreenStyle', discountLabel: 'Giảm 20.000đ', promoCode: 'GSGREEN20K', pointsRequired: 100, stockRemaining: 45, expiresAt: '31/12/2026', isActive: true },
  { id: 'OF-2', shopId: 'SHOP-B', shopName: 'EcoCosmetics VN', title: 'Giảm 35.000đ Mỹ phẩm thuần chay EcoCosmetics', discountLabel: 'Giảm 35.000đ', promoCode: 'ECO35KVIP', pointsRequired: 150, stockRemaining: 30, expiresAt: '31/12/2026', isActive: true }
];

// ============================================================================
// 4. MAIN APPLICATION COMPONENT
// ============================================================================
export default function App() {
  // Authentication & Session States
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authTab, setAuthTab] = useState<StakeholderRole>('CUSTOMER');
  const [loginEmail, setLoginEmail] = useState<string>('kien.hoang@gmail.com');
  const [loginPassword, setLoginPassword] = useState<string>('123456');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isRegisterMode, setIsRegisterMode] = useState<boolean>(false);

  // Registration Form States
  const [regFullName, setRegFullName] = useState<string>('');
  const [regPhone, setRegPhone] = useState<string>('');
  const [regShopName, setRegShopName] = useState<string>('');
  const [regShopOwner, setRegShopOwner] = useState<string>('');
  const [regShopDistrict, setRegShopDistrict] = useState<string>('Quận 1');
  const [regPartnerHubName, setRegPartnerHubName] = useState<string>('');

  const [loggedInUserId, setLoggedInUserId] = useState<string>('U-4');
  const [loggedInUserName, setLoggedInUserName] = useState<string>('Hoàng Trung Kiên');
  const [activeRole, setActiveRole] = useState<StakeholderRole>('CUSTOMER');
  const [activeShopId, setActiveShopId] = useState<string>('SHOP-A');
  const [currentRoute, setCurrentRoute] = useState<string>('/return/RP-000003');
  const [returnPortalToken, setReturnPortalToken] = useState<string>('RP-000003');
  const [trackingRequestCode, setTrackingRequestCode] = useState<string>('YC-2026-101');

  // Config
  const [maxAllowedCycles, setMaxAllowedCycles] = useState<number>(15);
  const [pointsPerReturn, setPointsPerReturn] = useState<number>(100);
  const [autoIssueQrEnabled, setAutoIssueQrEnabled] = useState<boolean>(true);

  // Core Data States
  const [bags, setBags] = useState<BagRecord[]>(DEFAULT_BAGS);
  const [shops, setShops] = useState<ShopRecord[]>(DEFAULT_SHOPS);
  const [pickupRoutes, setPickupRoutes] = useState<PickupRouteRecord[]>(DEFAULT_PICKUP_ROUTES);
  const [shopOrders, setShopOrders] = useState<ShopOrderRecord[]>([
    { id: 'SO-1', shopId: 'SHOP-A', orderCode: 'DH-8821', bagCode: 'RP-000003', packedAt: '19/11/2026 10:20', status: 'Đang giao' },
    { id: 'SO-2', shopId: 'SHOP-A', orderCode: 'DH-8790', bagCode: 'RP-000004', packedAt: '18/11/2026 16:45', status: 'Chờ thu hồi' }
  ]);
  const [returnRequests, setReturnRequests] = useState<ReturnRequestRecord[]>(DEFAULT_RETURN_REQUESTS);
  const [allocations, setAllocations] = useState<AllocationRecord[]>([
    { id: 'AL-1', allocationCode: 'AL-2026-089', shopId: 'SHOP-A', shopName: 'GreenStyle Fashion', size: 'M (32x43cm)', quantity: 15, status: 'CONFIRMED', createdAt: '18/11/2026 09:00' },
    { id: 'AL-2', allocationCode: 'AL-2026-090', shopId: 'SHOP-B', shopName: 'EcoCosmetics VN', size: 'M (32x43cm)', quantity: 20, status: 'PENDING', createdAt: '19/11/2026 11:00' }
  ]);
  const [maintenanceJobs, setMaintenanceJobs] = useState<MaintenanceJobRecord[]>([
    { id: 'MJ-1', bagCode: 'RP-000007', jobType: 'Vệ sinh khử khuẩn', status: 'IN_PROGRESS', assignedStaff: 'Trần Văn Khoa', startedAt: '19/11/2026 11:00' }
  ]);
  const [hubReceipts, setHubReceipts] = useState<HubHandoverReceipt[]>([
    { id: 'HB-1', receiptCode: 'BG-3PL-001', partnerName: 'Trạm Vệ Sinh & 3PL Quận 9', gradeACodes: ['RP-000008'], gradeCCodes: ['RP-000010'], status: 'PENDING_ADMIN_CONFIRM', createdAt: '19/11/2026 08:15' }
  ]);

  // Vouchers & Rewards
  const [shopOffers, setShopOffers] = useState<ShopVoucherOffer[]>(DEFAULT_OFFERS);
  const [customerRewardPoints, setCustomerRewardPoints] = useState<number>(350);
  const [customerTotalEarned, setCustomerTotalEarned] = useState<number>(450);
  const [customerSuccessfulReturns, setCustomerSuccessfulReturns] = useState<number>(4);
  const [customerVouchers, setCustomerVouchers] = useState<CustomerVoucher[]>([
    {
      id: 'VC-1',
      code: 'GSGREEN20K',
      qrPayload: 'RP-VOUCHER|GSGREEN20K|Giảm 20.000đ|GreenStyle Fashion',
      title: 'Giảm 20.000đ đơn từ 199K tại GreenStyle',
      discountLabel: 'Giảm 20.000đ',
      sponsor: 'GreenStyle Fashion',
      redeemedAt: '15/11/2026 19:20',
      expiresAt: '31/12/2026',
      autoIssued: true,
      status: 'Sẵn sàng dùng'
    }
  ]);
  const [rewardTransactions, setRewardTransactions] = useState<RewardTransactionRecord[]>([
    { id: 'RTX-1', txCode: 'GR-901', customerName: 'Hoàng Trung Kiên', bagCode: 'RP-000006', usageCycleKey: 'RP-000006-CYCLE-4', txType: 'EARN_RETURN', pointsDelta: 100, description: 'Hoàn trả túi RP-000006 thành công (Tuyến Q10)', createdAt: '18/11/2026 11:10' },
    { id: 'RTX-2', txCode: 'GR-880', customerName: 'Hoàng Trung Kiên', bagCode: 'VOUCHER', usageCycleKey: 'GSGREEN20K', txType: 'REDEEM_OFFER', pointsDelta: -100, description: 'Đổi Voucher GreenStyle Fashion (Giảm 20.000đ)', createdAt: '15/11/2026 19:20' }
  ]);

  // System Users (RBAC)
  const [systemUsers, setSystemUsers] = useState<SystemUserAccount[]>([
    { id: 'U-1', fullName: 'Quản trị viên Returnpack', email: 'admin@returnpack.id.vn', phone: '0901000111', role: 'ADMIN', orgLabel: 'RETURNPACK HQ', status: 'ACTIVE', createdAt: '01/10/2026' },
    { id: 'U-2', fullName: 'Nguyễn Minh Thảo', email: 'shop@greenstyle.vn', phone: '0912345678', role: 'SHOP', orgLabel: 'GreenStyle Fashion', status: 'ACTIVE', createdAt: '15/10/2026' },
    { id: 'U-3', fullName: 'Điều phối Trạm 3PL', email: 'hub@vanchuyen3pl.vn', phone: '0909111222', role: 'PARTNER', orgLabel: 'Đối tác Vận chuyển & Vệ sinh', status: 'ACTIVE', createdAt: '20/10/2026' },
    { id: 'U-4', fullName: 'Hoàng Trung Kiên', email: 'kien.hoang@gmail.com', phone: '0905889900', role: 'CUSTOMER', orgLabel: 'Khách hàng Thành viên', status: 'ACTIVE', createdAt: '01/11/2026' }
  ]);

  const [auditLogs, setAuditLogs] = useState<AuditLogRecord[]>([
    { id: 'AUD-1', timestamp: '18/11/2026 11:10', actor: 'Lê Hoàng Nam (Shipper)', action: 'Xác nhận thu hồi QR', entity: 'YC-2026-103 / RP-000006', detail: 'Quét nhận túi tại Quận 10 & cộng +100 điểm.' }
  ]);

  // Customer Default Profile State
  const [custProfileName, setCustProfileName] = useState<string>('Hoàng Trung Kiên');
  const [custProfilePhone, setCustProfilePhone] = useState<string>('0905889900');
  const [custProfileDistrict, setCustProfileDistrict] = useState<string>('Quận 10');
  const [custProfileAddress, setCustProfileAddress] = useState<string>('279 Nguyễn Tri Phương, P.5');

  // Form & UI States
  const [toast, setToast] = useState<{ type: 'success' | 'warning' | 'error' | 'info'; title: string; message: string } | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [showQrScannerModal, setShowQrScannerModal] = useState<{ open: boolean; target: 'SHOP' | 'WAREHOUSE' | 'SHIPPER' | 'CUSTOMER'; reqCode?: string }>({ open: false, target: 'CUSTOMER' });
  const [showPrintQrModal, setShowPrintQrModal] = useState<boolean>(false);
  const [activeQrVoucherModal, setActiveQrVoucherModal] = useState<CustomerVoucher | null>(null);
  const [selectedBagDetailModal, setSelectedBagDetailModal] = useState<BagRecord | null>(null);

  // Customer Return Form States (with Date Picker!)
  const [custReturnDistrict, setCustReturnDistrict] = useState<string>('Quận 10');
  const [custReturnDateIso, setCustReturnDateIso] = useState<string>('2026-11-20');
  const [custReturnAddress, setCustReturnAddress] = useState<string>('279 Nguyễn Tri Phương, P.5');
  const [custReturnTimeSlot, setCustReturnTimeSlot] = useState<string>('09:00 - 12:00');
  const [custReturnNote, setCustReturnNote] = useState<string>('');
  const [submittedReturnCode, setSubmittedReturnCode] = useState<string | null>(null);

  // Customer Track Reschedule / Edit States
  const [isRescheduling, setIsRescheduling] = useState<boolean>(false);
  const [rescheduleDateIso, setRescheduleDateIso] = useState<string>('2026-11-20');
  const [rescheduleSlot, setRescheduleSlot] = useState<string>('14:00 - 17:00');
  const [rescheduleNote, setRescheduleNote] = useState<string>('');

  // Shop Form States
  const [scanBagCodeInput, setScanBagCodeInput] = useState<string>('RP-000001');
  const [packingOrderCodeInput, setPackingOrderCodeInput] = useState<string>('DH-9005');
  const [shopBagFilter, setShopBagFilter] = useState<string>('ALL');
  const [reqBagSize, setReqBagSize] = useState<'S (25x35cm)' | 'M (32x43cm)' | 'L (40x55cm)'>('M (32x43cm)');
  const [reqBagQty, setReqBagQty] = useState<number>(20);
  const [newVoucherTitle, setNewVoucherTitle] = useState<string>('');
  const [newVoucherDiscount, setNewVoucherDiscount] = useState<string>('Giảm 25.000đ');
  const [newVoucherCode, setNewVoucherCode] = useState<string>('');
  const [newVoucherPoints, setNewVoucherPoints] = useState<number>(120);
  const [newVoucherStock, setNewVoucherStock] = useState<number>(50);

  // Partner Form States
  const [newRouteDistrict, setNewRouteDistrict] = useState<string>('Quận 7');
  const [newRouteWeekdays, setNewRouteWeekdays] = useState<number[]>([2, 4, 6]);
  const [newRouteShipper, setNewRouteShipper] = useState<string>('Nguyễn Văn Hùng');
  const [newRoutePhone, setNewRoutePhone] = useState<string>('0903 777 888');
  const [warehouseScanInput, setWarehouseScanInput] = useState<string>('RP-000011');
  const [selectedInspectGrade, setSelectedInspectGrade] = useState<'A' | 'B' | 'C'>('A');
  const [inspectNoteInput, setInspectNoteInput] = useState<string>('Khóa kéo, bề mặt và tem QR đạt chuẩn A.');

  // Admin Detailed Management States
  const [bagSearchQuery, setBagSearchQuery] = useState<string>('');
  const [bagStatusFilter, setBagStatusFilter] = useState<string>('ALL');
  const [bagGradeFilter, setBagGradeFilter] = useState<string>('ALL');
  const [batchSizeCreate, setBatchSizeCreate] = useState<'S (25x35cm)' | 'M (32x43cm)' | 'L (40x55cm)'>('M (32x43cm)');
  const [batchQtyCreate, setBatchQtyCreate] = useState<number>(5);
  const [adminShopSearch, setAdminShopSearch] = useState<string>('');
  const [adminReturnStatusFilter, setAdminReturnStatusFilter] = useState<string>('ALL');
  const [adminReturnOnlyOverdue, setAdminReturnOnlyOverdue] = useState<boolean>(false);
  const [adminRewardTxFilter, setAdminRewardTxFilter] = useState<string>('ALL');
  const [adminUserRoleFilter, setAdminUserRoleFilter] = useState<string>('ALL');
  const [adminAuditSearch, setAdminAuditSearch] = useState<string>('');
  const [newUserEmail, setNewUserEmail] = useState<string>('');
  const [newUserName, setNewUserName] = useState<string>('');
  const [newUserPhone, setNewUserPhone] = useState<string>('');
  const [newUserRole, setNewUserRole] = useState<StakeholderRole>('SHOP');

  const triggerToast = (type: 'success' | 'warning' | 'error' | 'info', title: string, message: string) => {
    setToast({ type, title, message });
  };

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4500);
    return () => clearTimeout(t);
  }, [toast]);

  const addAuditLog = (action: string, entity: string, detail: string) => {
    setAuditLogs((prev) => [
      { id: `AUD-${Date.now()}`, timestamp: getNowFullVn(), actor: loggedInUserName, action, entity, detail },
      ...prev
    ]);
  };

  const currentShop = useMemo(() => shops.find((s) => s.id === activeShopId) || shops[0], [shops, activeShopId]);

  const matchedCustomerRoute = useMemo(
    () => pickupRoutes.find((r) => r.district === custReturnDistrict && r.isActive),
    [pickupRoutes, custReturnDistrict]
  );

  // Check if the selected date actually has a shipper route running!
  const selectedWeekdayNum = useMemo(() => getWeekdayFromIso(custReturnDateIso), [custReturnDateIso]);
  const isRouteRunningOnSelectedDate = useMemo(() => {
    if (!matchedCustomerRoute) return false;
    return matchedCustomerRoute.activeWeekdays.includes(selectedWeekdayNum);
  }, [matchedCustomerRoute, selectedWeekdayNum]);

  useEffect(() => {
    if (matchedCustomerRoute && matchedCustomerRoute.timeSlots.length > 0) {
      if (!matchedCustomerRoute.timeSlots.includes(custReturnTimeSlot)) {
        setCustReturnTimeSlot(matchedCustomerRoute.timeSlots[0]);
      }
    }
  }, [matchedCustomerRoute, custReturnTimeSlot]);

  // Helper: Instant QR Voucher Issuance (used both for manual redeem & auto-issue when points >= threshold)
  const issueQrVoucherForOffer = (offer: ShopVoucherOffer, isAuto: boolean, currentPointsBalance: number): CustomerVoucher | null => {
    if (currentPointsBalance < offer.pointsRequired || offer.stockRemaining <= 0) return null;
    const uniqueSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const issuedCode = `${offer.promoCode}-${uniqueSuffix}`;
    const createdVoucher: CustomerVoucher = {
      id: `VC-${Date.now()}-${uniqueSuffix}`,
      code: issuedCode,
      qrPayload: `RP-VOUCHER|${issuedCode}|${offer.discountLabel}|${offer.shopName}`,
      title: offer.title,
      discountLabel: offer.discountLabel,
      sponsor: offer.shopName,
      redeemedAt: getNowFullVn(),
      expiresAt: offer.expiresAt,
      autoIssued: isAuto,
      status: 'Sẵn sàng dùng'
    };

    setCustomerRewardPoints((p) => Math.max(0, p - offer.pointsRequired));
    setShopOffers((prev) => prev.map((item) => (item.id === offer.id ? { ...item, stockRemaining: Math.max(0, item.stockRemaining - 1) } : item)));
    setCustomerVouchers((prev) => [createdVoucher, ...prev]);
    setRewardTransactions((prev) => [
      {
        id: `RTX-${Date.now()}-${uniqueSuffix}`,
        txCode: `GR-${Date.now().toString().slice(-4)}`,
        customerName: custProfileName,
        bagCode: 'QR-VOUCHER',
        usageCycleKey: issuedCode,
        txType: 'REDEEM_OFFER',
        pointsDelta: -offer.pointsRequired,
        description: `${isAuto ? '[Tự động gửi QR] ' : ''}Đổi ưu đãi ${offer.discountLabel} tại ${offer.shopName}`,
        createdAt: getNowFullVn()
      },
      ...prev
    ]);
    return createdVoucher;
  };

  const handleExportBagsCsv = () => {
    const headers = ['Ma_Tui', 'Kich_Thuoc', 'Lo_SX', 'Trang_Thai', 'Vi_Tri', 'Vong_Da_Dung', 'Phan_Loai', 'Cap_Nhat'];
    const rows = bags.map((b) => [b.bagCode, b.size, b.batchCode, BAG_STATUS_META[b.status].label, `"${b.currentLocation}"`, b.cyclesUsed, b.qualityGrade, b.updatedAt]);
    const csv = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const link = document.createElement('a');
    link.href = encodeURI(csv);
    link.download = `returnpack_bags_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerToast('success', 'Đã xuất file CSV', 'Danh sách vòng đời túi đã được tải xuống.');
  };

  // ==========================================================================
  // 5. NAVIGATION MENUS (STRICT 4-ROLE RBAC)
  // ==========================================================================
  const customerNav = [
    { path: `/return/${returnPortalToken}`, label: 'Quét QR & Đặt lịch tuyến', icon: QrCode },
    { path: `/track/${trackingRequestCode}`, label: 'Theo dõi thu hồi', icon: MapPin },
    { path: '/customer/history-profile', label: 'Lịch sử & Hồ sơ mặc định', icon: History },
    { path: '/rewards', label: 'Ví Green Rewards & QR Quà', icon: Award }
  ];

  const shopNav = [
    { path: '/shop/dashboard', label: 'Tổng quan Shop', icon: BarChart3 },
    { path: '/shop/scan', label: 'Quét QR Đóng gói', icon: ScanLine },
    { path: '/shop/inventory', label: 'Túi & Đơn đã đóng gói', icon: Package },
    { path: '/shop/plan-vouchers', label: 'Gói, Cấp túi & Voucher', icon: Ticket }
  ];

  const partnerNav = [
    { path: '/partner/routes', label: 'Tuyến Shipper & Lịch ngày', icon: MapPin },
    { path: '/partner/pickups', label: 'Nhiệm vụ Shipper (Mobile)', icon: Truck },
    { path: '/partner/cleaning', label: 'Trạm A/B/C & Bàn giao', icon: Wrench },
    { path: '/partner/settlement', label: 'Đối soát SLA tháng', icon: FileSpreadsheet }
  ];

  const adminNav = [
    { path: '/admin/dashboard', label: 'Tổng quan Hệ thống', icon: BarChart3 },
    { path: '/admin/bags', label: 'Quản lý Túi, QR & In tem', icon: Package },
    { path: '/admin/shops', label: 'Shop, Gói & Duyệt cấp túi', icon: Store },
    { path: '/admin/returns', label: 'Giám sát Thu hồi & SLA', icon: RefreshCw },
    { path: '/warehouse', label: 'Kho tổng & Nhập từ 3PL', icon: Warehouse },
    { path: '/admin/rewards-config', label: 'Quản trị Green Rewards', icon: Sliders },
    { path: '/admin/users-reports', label: 'Tài khoản, Báo cáo & Cài đặt', icon: Users }
  ];

  const activeNav =
    activeRole === 'CUSTOMER' ? customerNav : activeRole === 'SHOP' ? shopNav : activeRole === 'PARTNER' ? partnerNav : adminNav;

  // ==========================================================================
  // 6. CUSTOMER PORTAL VIEWS
  // ==========================================================================
  const renderCustomerReturnPortal = () => {
    const targetBag = bags.find((b) => b.bagCode === returnPortalToken);
    const canSubmit = Boolean(
      targetBag &&
        (targetBag.status === 'IN_TRANSIT' || targetBag.status === 'AT_SHOP') &&
        matchedCustomerRoute &&
        isRouteRunningOnSelectedDate
    );

    return (
      <div className="max-w-xl mx-auto space-y-5">
        <div className="rounded-2xl bg-gradient-to-br from-[#0B2418] via-[#123E29] to-[#155C3B] border border-[#D4AF37]/30 p-6 text-white text-center shadow-lg">
          <div className="flex justify-center mb-2">
            <EarthMascot3D pose={submittedReturnCode ? 'thumb' : 'wave'} size={76} />
          </div>
          <div className="inline-flex px-3 py-0.5 rounded-full bg-white/10 border border-[#D4AF37]/40 text-[11px] font-bold uppercase tracking-widest text-[#F3E5AB]">
            HOÀN TRẢ BAO BÌ THEO NGÀY & TUYẾN SHIPPER
          </div>
          <h1 className="text-xl font-bold mt-1.5">Quét QR & Đặt lịch Thu hồi Tận nơi</h1>
          <p className="text-xs text-[#D1E7DD] mt-1">
            Kiểm tra trực tiếp ngày bạn chọn có tuyến Shipper đi qua khu vực hay không trước khi xác nhận.
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-emerald-900/10 shadow-xs space-y-4">
          <div className="flex items-center justify-between gap-2 pb-3 border-b border-emerald-900/10">
            <div>
              <div className="text-xs font-bold text-[#3D554B]">Mã định danh túi QR</div>
              <div className="font-mono font-extrabold text-lg text-[#155C3B]">{returnPortalToken}</div>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={returnPortalToken}
                onChange={(e) => setReturnPortalToken(e.target.value)}
                className="px-2.5 py-2 rounded-xl border text-xs font-mono font-bold bg-[#F7FBF8]"
              >
                {bags.map((b) => (
                  <option key={b.id} value={b.bagCode}>
                    {b.bagCode} ({BAG_STATUS_META[b.status].label})
                  </option>
                ))}
              </select>
              <button
                onClick={() => setShowQrScannerModal({ open: true, target: 'CUSTOMER' })}
                className="px-3 py-2 rounded-xl bg-[#E5F7ED] text-[#155C3B] text-xs font-bold inline-flex items-center gap-1"
              >
                <Camera className="w-4 h-4" /> Quét QR
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block font-bold mb-1">Người gửi (Hồ sơ mặc định)</label>
              <input type="text" value={custProfileName} onChange={(e) => setCustProfileName(e.target.value)} className="w-full px-3 py-2 rounded-xl border" />
            </div>
            <div>
              <label className="block font-bold mb-1">Số điện thoại</label>
              <input type="text" value={custProfilePhone} onChange={(e) => setCustProfilePhone(e.target.value)} className="w-full px-3 py-2 rounded-xl border" />
            </div>
            <div>
              <label className="block font-bold mb-1">Quận / Huyện nhận túi</label>
              <select
                value={custReturnDistrict}
                onChange={(e) => setCustReturnDistrict(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border bg-white font-semibold"
              >
                {pickupRoutes.map((rt) => (
                  <option key={rt.id} value={rt.district}>
                    {rt.district} ({rt.routeCode})
                  </option>
                ))}
                <option value="Quận Bình Tân">Quận Bình Tân (Chưa mở tuyến)</option>
              </select>
            </div>
            <div>
              <label className="block font-bold mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-[#155C3B]" /> Chọn ngày thu hồi (DD/MM/YYYY)
              </label>
              <input
                type="date"
                value={custReturnDateIso}
                onChange={(e) => setCustReturnDateIso(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border bg-white font-semibold"
              />
            </div>

            {/* Route Availability Check Banner for the Chosen Date */}
            {!matchedCustomerRoute ? (
              <div className="sm:col-span-2 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 font-semibold">
                ✕ Khu vực <strong>{custReturnDistrict}</strong> hiện chưa mở tuyến thu hồi định kỳ từ đối tác vận chuyển.
              </div>
            ) : isRouteRunningOnSelectedDate ? (
              <div className="sm:col-span-2 p-3.5 rounded-xl bg-[#E5F7ED] border border-[#48B86C]/50 text-xs space-y-1">
                <div className="font-bold text-[#155C3B] flex flex-wrap items-center justify-between gap-1">
                  <span>✓ CÓ LỊCH CHẠY NGÀY {formatDateIsoToVn(custReturnDateIso)} ({WEEKDAY_VN[selectedWeekdayNum]})</span>
                  <span className="font-mono">{matchedCustomerRoute.routeCode}</span>
                </div>
                <div className="text-[#3D554B]">
                  Shipper phụ trách: <strong>{matchedCustomerRoute.shipperName}</strong> ({matchedCustomerRoute.shipperPhone}) • Lịch cố định: {matchedCustomerRoute.activeDays}
                </div>
              </div>
            ) : (
              <div className="sm:col-span-2 p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-xs space-y-2">
                <div className="font-bold text-amber-900">
                  ⚠ KHÔNG CÓ LỊCH SHIPPER NGÀY {formatDateIsoToVn(custReturnDateIso)} ({WEEKDAY_VN[selectedWeekdayNum]})
                </div>
                <div className="text-amber-800">
                  Tuyến <strong>{matchedCustomerRoute.routeCode}</strong> ({matchedCustomerRoute.district}) chỉ chạy vào: <strong>{matchedCustomerRoute.activeDays}</strong>.
                </div>
                <button
                  type="button"
                  onClick={() => setCustReturnDateIso(findNextAvailableDateIso(matchedCustomerRoute.activeWeekdays, custReturnDateIso))}
                  className="px-3 py-1.5 rounded-lg bg-amber-600 text-white font-bold hover:bg-amber-700"
                >
                  Chọn ngay ngày gần nhất có tuyến ({formatDateIsoToVn(findNextAvailableDateIso(matchedCustomerRoute.activeWeekdays, custReturnDateIso))})
                </button>
              </div>
            )}

            <div>
              <label className="block font-bold mb-1">Khung giờ tuyến đi qua</label>
              <select
                value={custReturnTimeSlot}
                onChange={(e) => setCustReturnTimeSlot(e.target.value)}
                disabled={!matchedCustomerRoute || !isRouteRunningOnSelectedDate}
                className="w-full px-3 py-2 rounded-xl border bg-white font-semibold disabled:bg-gray-100"
              >
                {matchedCustomerRoute ? (
                  matchedCustomerRoute.timeSlots.map((slot) => (
                    <option key={slot} value={slot}>
                      {slot}
                    </option>
                  ))
                ) : (
                  <option value="">Không có khung giờ khả dụng</option>
                )}
              </select>
            </div>
            <div>
              <label className="block font-bold mb-1">Ghi chú cho Shipper</label>
              <input type="text" value={custReturnNote} onChange={(e) => setCustReturnNote(e.target.value)} placeholder="VD: Gửi ở bảo vệ sảnh A..." className="w-full px-3 py-2 rounded-xl border" />
            </div>
            <div className="sm:col-span-2">
              <label className="block font-bold mb-1">Địa chỉ chi tiết</label>
              <input type="text" value={custReturnAddress} onChange={(e) => setCustReturnAddress(e.target.value)} className="w-full px-3 py-2 rounded-xl border" />
            </div>
          </div>

          <button
            disabled={!canSubmit}
            onClick={() => {
              if (!targetBag || !matchedCustomerRoute || !isRouteRunningOnSelectedDate) return;
              const reqCode = `YC-2026-${104 + returnRequests.length}`;
              const dateVn = formatDateIsoToVn(custReturnDateIso);
              const nowFull = getNowFullVn();
              const newReq: ReturnRequestRecord = {
                id: `RET-${Date.now()}`,
                requestCode: reqCode,
                bagCode: targetBag.bagCode,
                usageCycleKey: `${targetBag.bagCode}-CYCLE-${targetBag.cyclesUsed || 1}`,
                customerName: custProfileName,
                customerPhone: custProfilePhone,
                pickupAddress: `${custReturnAddress}, ${custReturnDistrict}`,
                areaDistrict: custReturnDistrict,
                routeCode: matchedCustomerRoute.routeCode,
                scheduledDateIso: custReturnDateIso,
                scheduledDateDisplay: dateVn,
                preferredTimeSlot: custReturnTimeSlot,
                customerNote: custReturnNote,
                status: 'ASSIGNED_SHIPPER',
                assignedShipperName: matchedCustomerRoute.shipperName,
                scheduledWindow: `${dateVn} • ${custReturnTimeSlot} (${matchedCustomerRoute.routeCode})`,
                waitingHours: 0,
                isOverdue: false,
                rewardGranted: false,
                createdAt: nowFull,
                timelineLogs: [
                  { step: 'Tạo yêu cầu hoàn trả', timestamp: nowFull, note: `Đặt lịch ngày ${dateVn} (${WEEKDAY_VN[selectedWeekdayNum]}), khung ${custReturnTimeSlot}` },
                  { step: 'Tự động khớp tuyến & gán Shipper', timestamp: nowFull, note: `Shipper ${matchedCustomerRoute.shipperName} (${matchedCustomerRoute.routeCode})` }
                ]
              };
              setReturnRequests((prev) => [newReq, ...prev]);
              setBags((prev) =>
                prev.map((b) =>
                  b.bagCode === targetBag.bagCode
                    ? { ...b, status: 'WAITING_RETURN', currentLocation: `Chờ thu hồi ngày ${dateVn} (${matchedCustomerRoute.routeCode})`, updatedAt: nowFull }
                    : b
                )
              );
              setSubmittedReturnCode(reqCode);
              setTrackingRequestCode(reqCode);
              addAuditLog('Khách đặt lịch thu hồi', `${reqCode} / ${targetBag.bagCode}`, `Ngày ${dateVn} (${custReturnTimeSlot}) - ${matchedCustomerRoute.routeCode}`);
              triggerToast('success', 'Đặt lịch thành công', `Mã phiếu ${reqCode} hẹn thu hồi ngày ${dateVn} (${custReturnTimeSlot}).`);
            }}
            className="w-full py-3.5 rounded-2xl bg-[#155C3B] text-white font-extrabold text-sm hover:bg-[#10462C] disabled:opacity-40"
          >
            XÁC NHẬN ĐẶT LỊCH THU HỒI NGÀY {formatDateIsoToVn(custReturnDateIso)}
          </button>

          {submittedReturnCode && (
            <div className="p-4 rounded-2xl bg-[#E5F7ED] border border-[#48B86C] text-center space-y-2 text-xs">
              <div className="font-extrabold text-[#155C3B]">Đã tạo phiếu thu hồi {submittedReturnCode}</div>
              <div>Ngày hẹn: <strong>{formatDateIsoToVn(custReturnDateIso)}</strong> • Tuyến <strong>{matchedCustomerRoute?.routeCode}</strong></div>
              <button onClick={() => setCurrentRoute(`/track/${submittedReturnCode}`)} className="px-4 py-1.5 rounded-xl bg-[#155C3B] text-white font-bold">
                Theo dõi & Quản lý lịch hẹn →
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderCustomerTrack = () => {
    const req = returnRequests.find((r) => r.requestCode === trackingRequestCode) || returnRequests[0];
    const stepIdx = req ? RETURN_STATUS_META[req.status].stepIndex : 1;
    const isCancelled = req?.status === 'CANCELLED';
    const isActivePending = req && ['RECEIVED', 'MATCHING_ROUTE', 'ASSIGNED_SHIPPER'].includes(req.status);
    const reqRoute = req ? pickupRoutes.find((rt) => rt.district === req.areaDistrict && rt.isActive) : null;
    const rescheduleWeekday = getWeekdayFromIso(rescheduleDateIso);
    const rescheduleValid = Boolean(reqRoute && reqRoute.activeWeekdays.includes(rescheduleWeekday));

    const steps = [
      '1. Đã tiếp nhận & Khớp lịch ngày tuyến Shipper',
      '2. Đã ghép vào lộ trình thu gom',
      '3. Shipper đang di chuyển trên tuyến',
      '4. Shipper đã quét nhận túi & Cộng điểm xanh',
      '5. Túi đã về trạm vệ sinh tuần hoàn'
    ];

    return (
      <div className="max-w-2xl mx-auto bg-white rounded-2xl p-6 border border-emerald-900/10 shadow-xs space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="text-lg font-bold text-[#0B1F17]">Theo dõi & Thao tác Lịch thu hồi</h1>
            <p className="text-xs text-[#3D554B]">Xem đầy đủ ngày tháng năm, đổi lịch tuyến, cập nhật ghi chú hoặc đặt lại lịch mới.</p>
          </div>
          <select
            value={trackingRequestCode}
            onChange={(e) => {
              setTrackingRequestCode(e.target.value);
              setIsRescheduling(false);
            }}
            className="px-3 py-1.5 rounded-xl border text-xs font-mono font-bold bg-[#F7FBF8]"
          >
            {returnRequests.map((r) => (
              <option key={r.id} value={r.requestCode}>
                {r.requestCode} ({r.bagCode}) - {RETURN_STATUS_META[r.status].label}
              </option>
            ))}
          </select>
        </div>

        {req ? (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-[#F7FBF8] border border-emerald-900/10 text-xs grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div><span className="text-[#3D554B]">Mã yêu cầu / Túi:</span> <strong className="font-mono text-[#155C3B]">{req.requestCode} • {req.bagCode}</strong></div>
              <div>
                <span className="text-[#3D554B]">Trạng thái:</span>{' '}
                <span className={`px-2 py-0.5 rounded-full font-bold border ${RETURN_STATUS_META[req.status].badge}`}>
                  {RETURN_STATUS_META[req.status].label}
                </span>
              </div>
              <div><span className="text-[#3D554B]">Ngày tạo đơn:</span> <strong>{req.createdAt}</strong></div>
              <div><span className="text-[#3D554B]">Ngày hẹn thu hồi:</span> <strong className="text-[#155C3B]">{req.scheduledDateDisplay} ({req.preferredTimeSlot})</strong></div>
              <div><span className="text-[#3D554B]">Tuyến & Shipper:</span> <strong>{req.routeCode} • {req.assignedShipperName || 'Đang ghép'}</strong></div>
              <div><span className="text-[#3D554B]">Ghi chú hiện tại:</span> <strong>{req.customerNote || 'Không có'}</strong></div>
              <div className="sm:col-span-2"><span className="text-[#3D554B]">Địa chỉ thu hồi:</span> <strong>{req.pickupAddress}</strong></div>
            </div>

            {isCancelled ? (
              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-300 text-xs space-y-3 text-center">
                <div className="font-bold text-stone-700 text-sm">Yêu cầu {req.requestCode} đã bị hủy</div>
                <p className="text-stone-600">Lịch sử đơn vẫn được lưu giữ để đối chiếu. Bạn có thể đặt lại lịch thu hồi mới cho túi <strong>{req.bagCode}</strong> ngay bên dưới.</p>
                <button
                  onClick={() => {
                    setReturnPortalToken(req.bagCode);
                    setCustReturnDistrict(req.areaDistrict);
                    setSubmittedReturnCode(null);
                    setCurrentRoute(`/return/${req.bagCode}`);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-[#155C3B] text-white font-bold hover:bg-[#10462C]"
                >
                  + Đặt lại lịch thu hồi mới cho túi {req.bagCode}
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {steps.map((label, i) => {
                  const done = stepIdx >= i + 1;
                  return (
                    <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border text-xs font-bold ${done ? 'bg-[#E5F7ED] border-[#48B86C] text-[#155C3B]' : 'bg-gray-50 text-gray-400'}`}>
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center ${done ? 'bg-[#155C3B] text-white' : 'bg-gray-200'}`}>
                        {done ? '✓' : i + 1}
                      </span>
                      {label}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Action Buttons: Reschedule, Cancel (without deleting!), or Rebook */}
            {isActivePending && (
              <div className="space-y-3 pt-2 border-t border-emerald-900/10">
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      setIsRescheduling(!isRescheduling);
                      setRescheduleDateIso(req.scheduledDateIso);
                      setRescheduleSlot(req.preferredTimeSlot);
                      setRescheduleNote(req.customerNote);
                    }}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-[#E5F7ED] text-[#155C3B] border border-[#48B86C]/40 text-xs font-bold inline-flex items-center justify-center gap-1.5"
                  >
                    <Edit3 className="w-3.5 h-3.5" /> {isRescheduling ? 'Đóng khung đổi lịch' : 'Đổi ngày / Khung giờ / Ghi chú'}
                  </button>
                  <button
                    onClick={() => {
                      const nowFull = getNowFullVn();
                      setReturnRequests((prev) =>
                        prev.map((r) =>
                          r.requestCode === req.requestCode
                            ? {
                                ...r,
                                status: 'CANCELLED',
                                scheduledWindow: `Đã hủy lúc ${nowFull}`,
                                timelineLogs: [
                                  { step: 'Khách hàng hủy lịch thu hồi', timestamp: nowFull, note: 'Trả trạng thái túi về sẵn sàng đặt lịch mới' },
                                  ...r.timelineLogs
                                ]
                              }
                            : r
                        )
                      );
                      setBags((prev) => prev.map((b) => (b.bagCode === req.bagCode ? { ...b, status: 'IN_TRANSIT', currentLocation: 'Khách đang giữ (Đã hủy lịch cũ)', updatedAt: nowFull } : b)));
                      setIsRescheduling(false);
                      addAuditLog('Khách hủy lịch thu hồi', req.requestCode, `Chuyển trạng thái sang Đã hủy, giữ nguyên lịch sử.`);
                      triggerToast('info', 'Đã hủy lịch hẹn', `Yêu cầu ${req.requestCode} chuyển sang trạng thái Đã hủy. Bạn có thể bấm "Đặt lại lịch mới" bất cứ lúc nào.`);
                    }}
                    className="py-2.5 px-4 rounded-xl border border-rose-200 bg-rose-50 text-rose-800 text-xs font-bold inline-flex items-center gap-1.5"
                  >
                    <Ban className="w-3.5 h-3.5" /> Hủy lịch hẹn
                  </button>
                </div>

                {isRescheduling && (
                  <div className="p-4 rounded-2xl bg-[#F7FBF8] border border-[#155C3B]/20 space-y-3 text-xs">
                    <div className="font-bold text-[#155C3B]">Cập nhật lịch thu hồi mới (Khớp tuyến {req.routeCode})</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="block font-bold mb-1">Ngày thu hồi mới</label>
                        <input type="date" value={rescheduleDateIso} onChange={(e) => setRescheduleDateIso(e.target.value)} className="w-full px-3 py-2 rounded-xl border bg-white" />
                      </div>
                      <div>
                        <label className="block font-bold mb-1">Khung giờ mới</label>
                        <select value={rescheduleSlot} onChange={(e) => setRescheduleSlot(e.target.value)} className="w-full px-3 py-2 rounded-xl border bg-white">
                          {(reqRoute?.timeSlots || ['09:00 - 12:00', '14:00 - 17:00']).map((sl) => (
                            <option key={sl} value={sl}>{sl}</option>
                          ))}
                        </select>
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block font-bold mb-1">Ghi chú cập nhật cho Shipper</label>
                        <input type="text" value={rescheduleNote} onChange={(e) => setRescheduleNote(e.target.value)} className="w-full px-3 py-2 rounded-xl border bg-white" />
                      </div>
                    </div>
                    {!rescheduleValid && reqRoute && (
                      <div className="text-rose-700 font-bold">
                        ⚠ Ngày {formatDateIsoToVn(rescheduleDateIso)} ({WEEKDAY_VN[rescheduleWeekday]}) tuyến {reqRoute.routeCode} không chạy (Lịch chạy: {reqRoute.activeDays}).
                      </div>
                    )}
                    <button
                      disabled={!rescheduleValid}
                      onClick={() => {
                        const newDateVn = formatDateIsoToVn(rescheduleDateIso);
                        const nowFull = getNowFullVn();
                        setReturnRequests((prev) =>
                          prev.map((r) =>
                            r.requestCode === req.requestCode
                              ? {
                                  ...r,
                                  scheduledDateIso: rescheduleDateIso,
                                  scheduledDateDisplay: newDateVn,
                                  preferredTimeSlot: rescheduleSlot,
                                  customerNote: rescheduleNote,
                                  scheduledWindow: `${newDateVn} • ${rescheduleSlot} (${r.routeCode})`,
                                  timelineLogs: [
                                    { step: 'Đổi lịch thu hồi', timestamp: nowFull, note: `Đổi sang ngày ${newDateVn} (${rescheduleSlot})` },
                                    ...r.timelineLogs
                                  ]
                                }
                              : r
                          )
                        );
                        setIsRescheduling(false);
                        triggerToast('success', 'Đã cập nhật lịch mới', `Đơn ${req.requestCode} đã dời sang ngày ${newDateVn} (${rescheduleSlot}).`);
                      }}
                      className="w-full py-2.5 rounded-xl bg-[#155C3B] text-white font-bold disabled:opacity-40"
                    >
                      Lưu lịch thu hồi mới
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Detailed Timestamped Timeline Logs */}
            <div className="pt-3 border-t border-emerald-900/10 space-y-2 text-xs">
              <div className="font-bold text-[#0B1F17]">Nhật ký mốc thời gian chi tiết (Ngày/Tháng/Năm):</div>
              {req.timelineLogs.map((lg, idx) => (
                <div key={idx} className="p-2.5 rounded-xl bg-[#F7FBF8] flex items-start justify-between gap-2">
                  <div>
                    <div className="font-bold text-[#155C3B]">{lg.step}</div>
                    <div className="text-[#3D554B]">{lg.note}</div>
                  </div>
                  <span className="font-mono text-[11px] text-[#3D554B] shrink-0">{lg.timestamp}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-6 text-xs text-[#3D554B]">Chưa có yêu cầu thu hồi nào.</div>
        )}
      </div>
    );
  };

  const renderCustomerHistoryAndProfile = () => {
    const plasticSavedKg = ((customerSuccessfulReturns * 28) / 1000).toFixed(2);
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-emerald-900/10 shadow-xs space-y-4">
          <h2 className="text-lg font-bold text-[#0B1F17] flex items-center gap-2">
            <Recycle className="w-5 h-5 text-[#155C3B]" /> Lịch sử trả túi & Đóng góp xanh
          </h2>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-4 rounded-2xl bg-[#E5F7ED] border border-[#48B86C]/30">
              <div className="text-[#155C3B] font-bold">Tổng túi đã hoàn trả</div>
              <div className="text-2xl font-extrabold text-[#0B1F17] mt-1">{customerSuccessfulReturns} túi</div>
            </div>
            <div className="p-4 rounded-2xl bg-[#F7FBF8] border border-emerald-900/10">
              <div className="text-[#3D554B] font-bold">Rác thải nhựa đã giảm</div>
              <div className="text-2xl font-extrabold text-[#155C3B] mt-1">{plasticSavedKg} kg</div>
            </div>
          </div>

          <div className="divide-y divide-emerald-900/5 text-xs">
            {returnRequests.map((r) => (
              <div key={r.id} className="py-3 flex items-center justify-between gap-2">
                <div>
                  <div className="font-mono font-bold text-[#155C3B]">{r.bagCode} • {r.requestCode}</div>
                  <div className="text-[#3D554B]">Ngày hẹn: <strong>{r.scheduledDateDisplay}</strong> ({r.preferredTimeSlot}) • Tạo: {r.createdAt}</div>
                </div>
                <button
                  onClick={() => {
                    setTrackingRequestCode(r.requestCode);
                    setCurrentRoute(`/track/${r.requestCode}`);
                  }}
                  className={`px-2.5 py-1 rounded-full font-bold border ${RETURN_STATUS_META[r.status].badge}`}
                >
                  {RETURN_STATUS_META[r.status].label}
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-emerald-900/10 shadow-xs space-y-4">
          <h2 className="text-lg font-bold text-[#0B1F17] flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-[#155C3B]" /> Hồ sơ & Địa chỉ thu hồi mặc định
          </h2>
          <p className="text-xs text-[#3D554B]">
            Lưu sẵn thông tin liên hệ và quận cư trú để tự động khớp tuyến Shipper mỗi khi bạn quét QR hoàn trả túi.
          </p>
          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-bold mb-1">Họ và tên</label>
              <input type="text" value={custProfileName} onChange={(e) => setCustProfileName(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border" />
            </div>
            <div>
              <label className="block font-bold mb-1">Số điện thoại nhận cuộc gọi từ Shipper</label>
              <input type="text" value={custProfilePhone} onChange={(e) => setCustProfilePhone(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border" />
            </div>
            <div>
              <label className="block font-bold mb-1">Quận / Huyện mặc định</label>
              <select
                value={custProfileDistrict}
                onChange={(e) => {
                  setCustProfileDistrict(e.target.value);
                  setCustReturnDistrict(e.target.value);
                }}
                className="w-full px-3.5 py-2.5 rounded-xl border bg-white"
              >
                {pickupRoutes.map((rt) => (
                  <option key={rt.id} value={rt.district}>{rt.district}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-bold mb-1">Địa chỉ chi tiết mặc định</label>
              <input
                type="text"
                value={custProfileAddress}
                onChange={(e) => {
                  setCustProfileAddress(e.target.value);
                  setCustReturnAddress(e.target.value);
                }}
                className="w-full px-3.5 py-2.5 rounded-xl border"
              />
            </div>
            <button
              onClick={() => triggerToast('success', 'Đã lưu hồ sơ mặc định', 'Thông tin sẽ tự động điền ở lần hoàn trả túi tiếp theo.')}
              className="w-full py-3 rounded-xl bg-[#155C3B] text-white font-bold text-xs hover:bg-[#10462C]"
            >
              Lưu thông tin mặc định
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderCustomerRewards = () => (
    <div className="space-y-6">
      <div className="rounded-2xl bg-gradient-to-br from-[#0F3D28] via-[#155C3B] to-[#1F7A4F] p-6 text-white shadow-lg border border-[#FFD866]/30 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-[#FFD866]/40 text-[#FFD866] text-xs font-semibold">
            <Award className="w-3.5 h-3.5" /> VÍ GREEN REWARDS & TỰ ĐỘNG PHÁT HÀNH QR VOUCHER
          </div>
          <div className="text-4xl font-extrabold tabular-nums">
            {customerRewardPoints} <span className="text-base font-semibold text-[#A9E65A]">điểm khả dụng</span>
          </div>
          <div className="text-xs text-[#E5F7ED]">
            Tổng tích lũy: <strong>{customerTotalEarned} điểm</strong> • <strong>{customerSuccessfulReturns} lượt</strong> trả túi thành công
          </div>
          <label className="inline-flex items-center gap-2 pt-1 text-xs cursor-pointer">
            <input
              type="checkbox"
              checked={autoIssueQrEnabled}
              onChange={(e) => setAutoIssueQrEnabled(e.target.checked)}
              className="rounded accent-[#D4AF37]"
            />
            <span className="text-[#F3E5AB] font-semibold">Tự động gửi mã QR ưu đãi ngay khi đủ điểm (không cần chờ duyệt)</span>
          </label>
        </div>
        <EarthMascot3D pose="thumb" size={84} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="bg-white rounded-2xl p-5 border border-emerald-900/10 shadow-xs space-y-3">
          <h2 className="text-base font-bold text-[#0B1F17]">Ưu đãi tài trợ từ Shop Đối tác</h2>
          {shopOffers.filter((o) => o.isActive && o.stockRemaining > 0).map((of) => (
            <div key={of.id} className="p-3.5 rounded-xl bg-[#F7FBF8] border border-emerald-900/10 flex items-center justify-between gap-2 text-xs">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-bold text-[#155C3B]">{of.shopName}</span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold text-[10px]">{of.discountLabel}</span>
                </div>
                <div className="font-bold text-[#0B1F17] mt-0.5">{of.title}</div>
                <div className="text-amber-700 font-bold mt-0.5">{of.pointsRequired} điểm • Còn {of.stockRemaining} mã</div>
              </div>
              <button
                onClick={() => {
                  if (customerRewardPoints < of.pointsRequired) {
                    triggerToast('error', 'Chưa đủ điểm', `Bạn cần ${of.pointsRequired} điểm để nhận QR ưu đãi ${of.discountLabel}.`);
                    return;
                  }
                  const issued = issueQrVoucherForOffer(of, false, customerRewardPoints);
                  if (issued) {
                    setActiveQrVoucherModal(issued);
                    triggerToast('success', 'Đã phát hành QR Voucher tức thì', `Mã ${issued.code} (${issued.discountLabel}) sẵn sàng quét sử dụng!`);
                  }
                }}
                className="px-3 py-2 rounded-xl bg-[#155C3B] text-white font-bold shrink-0"
              >
                Nhận QR ngay
              </button>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl p-5 border border-emerald-900/10 shadow-xs space-y-3">
          <h2 className="text-base font-bold text-[#0B1F17] flex items-center gap-2">
            <Ticket className="w-4 h-4 text-[#155C3B]" /> Ví Voucher QR của tôi ({customerVouchers.length})
          </h2>
          {customerVouchers.map((v) => (
            <div key={v.id} className="p-3.5 rounded-xl bg-[#E5F7ED]/60 border border-[#B8EF8B] text-xs flex items-center gap-3">
              <button onClick={() => setActiveQrVoucherModal(v)} title="Phóng to mã QR">
                <QrMatrixSvg value={v.qrPayload} size={54} />
              </button>
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[11px] font-bold text-[#155C3B] truncate">{v.sponsor}</span>
                  <span className="px-2 py-0.5 rounded bg-white text-[#155C3B] font-extrabold text-[10px] border border-[#155C3B]/20">{v.discountLabel}</span>
                </div>
                <div className="font-bold text-[#0B1F17] truncate">{v.title}</div>
                <div className="text-[10px] text-[#3D554B]">Cấp lúc: {v.redeemedAt} • HSD: {v.expiresAt}</div>
                <div className="flex items-center justify-between pt-0.5">
                  <span className="font-mono font-extrabold text-[#155C3B]">{v.code}</span>
                  <button onClick={() => setActiveQrVoucherModal(v)} className="text-[#155C3B] font-bold underline">
                    Mở mã QR
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl p-5 border border-emerald-900/10 shadow-xs space-y-3">
          <h2 className="text-base font-bold text-[#0B1F17]">Biến động điểm xanh</h2>
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {rewardTransactions.map((tx) => (
              <div key={tx.id} className="p-3 rounded-xl bg-[#F7FBF8] flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-[#0B1F17]">{tx.description}</div>
                  <div className="text-[#3D554B]">{tx.createdAt}</div>
                </div>
                <span className={`font-extrabold ${tx.pointsDelta > 0 ? 'text-[#155C3B]' : 'text-rose-700'}`}>
                  {tx.pointsDelta > 0 ? `+${tx.pointsDelta}` : tx.pointsDelta}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // ==========================================================================
  // 7. SHOP PARTNER PORTAL VIEWS
  // ==========================================================================
  const renderShopViews = () => {
    const myBagsAtShop = bags.filter((b) => b.holdingShopId === currentShop.id && b.status === 'AT_SHOP');
    const myOrders = shopOrders.filter((o) => o.shopId === currentShop.id);
    const myOffers = shopOffers.filter((o) => o.shopId === currentShop.id);
    const remainingTurns = currentShop.monthlyQuotaTurns - currentShop.usedTurns;

    if (currentRoute === '/shop/dashboard') {
      return (
        <div className="space-y-6">
          <div className="rounded-2xl bg-gradient-to-r from-[#0B2418] via-[#123E29] to-[#155C3B] border border-[#D4AF37]/30 p-6 text-white shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="inline-flex px-2.5 py-0.5 rounded-full bg-white/10 border border-[#D4AF37]/40 text-[11px] font-mono font-bold text-[#F3E5AB]">
                SHOP ĐỐI TÁC • {currentShop.shopCode}
              </span>
              <h1 className="text-2xl font-bold mt-1">{currentShop.shopName}</h1>
              <p className="text-xs text-[#D1E7DD]">{currentShop.address}, {currentShop.district}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setCurrentRoute('/shop/scan')} className="px-4 py-2.5 rounded-xl bg-[#D4AF37] text-[#0B1F17] text-xs font-bold inline-flex items-center gap-1.5">
                <ScanLine className="w-4 h-4" /> Quét QR đóng gói
              </button>
              <button onClick={() => setCurrentRoute('/shop/plan-vouchers')} className="px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white text-xs font-bold">
                + Tự phát hành Voucher QR
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-emerald-900/10">
              <div className="text-xs text-[#3D554B] font-bold">Túi sạch đang giữ</div>
              <div className="text-2xl font-extrabold text-[#155C3B] mt-1">{myBagsAtShop.length} / {currentShop.concurrentBagLimit}</div>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-emerald-900/10">
              <div className="text-xs text-[#3D554B] font-bold">Lượt gói còn lại</div>
              <div className="text-2xl font-extrabold text-[#0B1F17] mt-1">{remainingTurns}</div>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-emerald-900/10">
              <div className="text-xs text-[#3D554B] font-bold">Đơn đã đóng gói</div>
              <div className="text-2xl font-extrabold text-sky-700 mt-1">{currentShop.packedOrdersCount}</div>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-emerald-900/10">
              <div className="text-xs text-[#3D554B] font-bold">Voucher QR đang chạy</div>
              <div className="text-2xl font-extrabold text-amber-600 mt-1">{myOffers.filter((o) => o.isActive).length} mã</div>
            </div>
          </div>
        </div>
      );
    }

    if (currentRoute === '/shop/scan') {
      return (
        <div className="max-w-xl mx-auto bg-white rounded-2xl p-6 border border-emerald-900/10 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-bold text-[#0B1F17] flex items-center gap-2">
              <ScanLine className="w-5 h-5 text-[#155C3B]" /> Quét QR Đóng gói & Bàn giao
            </h1>
            <button onClick={() => setShowQrScannerModal({ open: true, target: 'SHOP' })} className="px-3 py-1.5 rounded-xl bg-[#E5F7ED] text-[#155C3B] text-xs font-bold inline-flex items-center gap-1">
              <Camera className="w-4 h-4" /> Camera QR
            </button>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-bold mb-1">Chọn nhanh túi sạch tại kho Shop ({myBagsAtShop.length})</label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {myBagsAtShop.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => setScanBagCodeInput(b.bagCode)}
                    className={`px-2.5 py-1 rounded-lg border font-mono font-bold ${scanBagCodeInput === b.bagCode ? 'bg-[#155C3B] text-white' : 'bg-[#F7FBF8] text-[#155C3B]'}`}
                  >
                    {b.bagCode}
                  </button>
                ))}
              </div>
              <input type="text" value={scanBagCodeInput} onChange={(e) => setScanBagCodeInput(e.target.value)} className="w-full px-3 py-2 rounded-xl border font-mono font-bold" />
            </div>

            <div>
              <label className="block font-bold mb-1">Mã vận đơn sàn (Shopee / TikTok / Web)</label>
              <input type="text" value={packingOrderCodeInput} onChange={(e) => setPackingOrderCodeInput(e.target.value)} className="w-full px-3 py-2 rounded-xl border font-mono font-bold" />
            </div>

            <button
              onClick={() => {
                const code = scanBagCodeInput.trim().toUpperCase();
                const ord = packingOrderCodeInput.trim().toUpperCase();
                const bag = myBagsAtShop.find((b) => b.bagCode === code);
                if (!bag) {
                  triggerToast('error', 'Túi không hợp lệ', `Túi ${code} không sẵn sàng trong kho của ${currentShop.shopName}.`);
                  return;
                }
                if (!ord) {
                  triggerToast('error', 'Thiếu mã đơn', 'Vui lòng nhập mã đơn hàng.');
                  return;
                }
                const nowFull = getNowFullVn();
                setBags((prev) => prev.map((b) => (b.bagCode === code ? { ...b, status: 'IN_TRANSIT', holdingShopId: null, holdingShopName: null, currentLocation: `Đang giao đơn ${ord}`, cyclesUsed: b.cyclesUsed + 1, updatedAt: nowFull } : b)));
                setShops((prev) => prev.map((s) => (s.id === currentShop.id ? { ...s, usedTurns: s.usedTurns + 1, currentBagsHeld: Math.max(0, s.currentBagsHeld - 1), packedOrdersCount: s.packedOrdersCount + 1 } : s)));
                setShopOrders((prev) => [{ id: `SO-${Date.now()}`, shopId: currentShop.id, orderCode: ord, bagCode: code, packedAt: nowFull, status: 'Đang giao' }, ...prev]);
                addAuditLog('Shop đóng gói xuất túi', `${ord} -> ${code}`, `${currentShop.shopName} bàn giao đơn.`);
                triggerToast('success', 'Bàn giao thành công', `Đã gắn túi ${code} với đơn ${ord} (-1 lượt gói).`);
              }}
              className="w-full py-3.5 rounded-2xl bg-[#155C3B] text-white font-extrabold text-sm hover:bg-[#10462C]"
            >
              Xác nhận xuất túi giao khách (-1 lượt)
            </button>
          </div>
        </div>
      );
    }

    if (currentRoute === '/shop/inventory') {
      const shopRelatedBags = bags.filter((b) => b.holdingShopId === currentShop.id || myOrders.some((o) => o.bagCode === b.bagCode));
      const filteredBags = shopBagFilter === 'ALL' ? shopRelatedBags : shopRelatedBags.filter((b) => b.status === shopBagFilter);

      return (
        <div className="space-y-5">
          <div className="bg-white rounded-2xl p-5 border border-emerald-900/10 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-base font-bold text-[#0B1F17]">Tồn kho túi thuộc {currentShop.shopName} (Cô lập dữ liệu)</h2>
              <select value={shopBagFilter} onChange={(e) => setShopBagFilter(e.target.value)} className="px-3 py-1.5 rounded-xl border text-xs font-bold bg-[#F7FBF8]">
                <option value="ALL">Tất cả túi của Shop ({shopRelatedBags.length})</option>
                <option value="AT_SHOP">Sẵn sàng đóng gói</option>
                <option value="IN_TRANSIT">Đang giao khách</option>
                <option value="WAITING_RETURN">Khách hẹn trả</option>
              </select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
              {filteredBags.map((b) => (
                <div key={b.id} className="p-3.5 rounded-xl bg-[#F7FBF8] border border-emerald-900/10 flex items-center justify-between">
                  <div>
                    <div className="font-mono font-extrabold text-[#155C3B]">{b.bagCode}</div>
                    <div className="text-[#3D554B]">{b.size} • {b.cyclesUsed}/{b.maxCycles} vòng</div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full font-bold ${BAG_STATUS_META[b.status].bg} ${BAG_STATUS_META[b.status].text}`}>
                    {BAG_STATUS_META[b.status].label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-emerald-900/10 shadow-xs space-y-3">
            <h2 className="text-base font-bold text-[#0B1F17]">Đơn hàng đã đóng gói ({myOrders.length})</h2>
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-[#F7FBF8] border-b text-[#3D554B]">
                  <th className="py-2.5 px-3">Mã đơn hàng</th>
                  <th className="py-2.5 px-3">Mã túi QR</th>
                  <th className="py-2.5 px-3">Ngày giờ bàn giao</th>
                  <th className="py-2.5 px-3">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {myOrders.map((o) => (
                  <tr key={o.id}>
                    <td className="py-2.5 px-3 font-mono font-bold">{o.orderCode}</td>
                    <td className="py-2.5 px-3 font-mono text-[#155C3B] font-bold">{o.bagCode}</td>
                    <td className="py-2.5 px-3 text-[#3D554B]">{o.packedAt}</td>
                    <td className="py-2.5 px-3 font-bold">{o.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-emerald-900/10 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-[#0B1F17]">Gói thuê bao & Yêu cầu cấp túi sạch</h2>
            <span className="px-2.5 py-1 rounded-full bg-[#E5F7ED] text-[#155C3B] text-xs font-bold">{currentShop.planName}</span>
          </div>
          <div className="p-3.5 rounded-xl bg-[#F7FBF8] text-xs flex justify-between">
            <span>Lượt đóng gói còn lại trong tháng:</span>
            <strong className="text-[#155C3B]">{remainingTurns} / {currentShop.monthlyQuotaTurns} lượt</strong>
          </div>

          <div className="grid grid-cols-2 gap-2.5 text-xs pt-2 border-t">
            <div>
              <label className="block font-bold mb-1">Kích thước túi cần nhập</label>
              <select value={reqBagSize} onChange={(e) => setReqBagSize(e.target.value as any)} className="w-full px-3 py-2 rounded-xl border bg-white">
                <option value="S (25x35cm)">S (25x35cm)</option>
                <option value="M (32x43cm)">M (32x43cm)</option>
                <option value="L (40x55cm)">L (40x55cm)</option>
              </select>
            </div>
            <div>
              <label className="block font-bold mb-1">Số lượng túi</label>
              <input type="number" value={reqBagQty} onChange={(e) => setReqBagQty(Number(e.target.value) || 10)} className="w-full px-3 py-2 rounded-xl border" />
            </div>
          </div>
          <button
            onClick={() => {
              const newAl: AllocationRecord = {
                id: `AL-${Date.now()}`,
                allocationCode: `AL-2026-0${91 + allocations.length}`,
                shopId: currentShop.id,
                shopName: currentShop.shopName,
                size: reqBagSize,
                quantity: reqBagQty,
                status: 'PENDING',
                createdAt: getNowFullVn()
              };
              setAllocations((prev) => [newAl, ...prev]);
              triggerToast('success', 'Đã gửi yêu cầu cấp túi', `Phiếu ${newAl.allocationCode} (${reqBagQty} túi ${reqBagSize}) đã gửi tới Admin Returnpack.`);
            }}
            className="w-full py-2.5 rounded-xl bg-[#155C3B] text-white text-xs font-bold"
          >
            + Gửi phiếu yêu cầu cấp túi
          </button>

          <div className="space-y-2 pt-2">
            <div className="text-xs font-bold text-[#3D554B]">Lịch sử phiếu yêu cầu của Shop:</div>
            {allocations.filter((a) => a.shopId === currentShop.id).map((al) => (
              <div key={al.id} className="p-2.5 rounded-xl bg-[#F7FBF8] flex justify-between items-center text-xs">
                <div>
                  <strong className="font-mono text-[#155C3B]">{al.allocationCode}</strong> • {al.quantity} túi {al.size}
                  <div className="text-[11px] text-[#3D554B]">{al.createdAt}{al.rejectReason ? ` • Lý do từ chối: ${al.rejectReason}` : ''}</div>
                </div>
                <span className={`px-2 py-0.5 rounded-full font-bold ${al.status === 'CONFIRMED' ? 'bg-[#E5F7ED] text-[#155C3B]' : al.status === 'REJECTED' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-900'}`}>
                  {al.status === 'PENDING' ? 'Chờ Admin duyệt' : al.status === 'REJECTED' ? 'Từ chối' : 'Đã xuất kho'}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-emerald-900/10 shadow-xs space-y-4">
          <div>
            <h2 className="text-base font-bold text-[#0B1F17] flex items-center gap-2">
              <Ticket className="w-4 h-4 text-[#155C3B]" /> Tự phát hành Voucher QR (Tự động cấp khi đủ điểm)
            </h2>
            <p className="text-xs text-[#3D554B] mt-0.5">
              Thiết lập sẵn mức giá giảm & điểm đổi. Khi khách đủ điểm, hệ thống tự động sinh mã QR gửi ngay cho khách không cần chờ đợi.
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!newVoucherTitle.trim() || !newVoucherCode.trim()) return;
              const created: ShopVoucherOffer = {
                id: `OF-${Date.now()}`,
                shopId: currentShop.id,
                shopName: currentShop.shopName,
                title: newVoucherTitle.trim(),
                discountLabel: newVoucherDiscount.trim() || 'Giảm 20.000đ',
                promoCode: newVoucherCode.trim().toUpperCase(),
                pointsRequired: Number(newVoucherPoints) || 100,
                stockRemaining: Number(newVoucherStock) || 50,
                expiresAt: '31/12/2026',
                isActive: true
              };
              setShopOffers((prev) => [created, ...prev]);
              setNewVoucherTitle('');
              setNewVoucherCode('');
              addAuditLog('Shop phát hành Voucher QR', created.promoCode, `${currentShop.shopName} thiết lập ưu đãi ${created.discountLabel} (${created.pointsRequired} điểm).`);
              triggerToast('success', 'Đã phát hành Voucher QR', `Mã ${created.promoCode} (${created.discountLabel}) sẽ tự động cấp QR khi khách đủ ${created.pointsRequired} điểm.`);
            }}
            className="space-y-2.5 text-xs bg-[#F7FBF8] p-4 rounded-2xl border border-emerald-900/10"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="block font-bold mb-1">Tên chương trình ưu đãi</label>
                <input type="text" value={newVoucherTitle} onChange={(e) => setNewVoucherTitle(e.target.value)} placeholder="VD: Giảm 25K đơn từ 249K" className="w-full px-3 py-2 rounded-xl border bg-white" />
              </div>
              <div>
                <label className="block font-bold mb-1">Mức giảm giá thiết lập sẵn</label>
                <input type="text" value={newVoucherDiscount} onChange={(e) => setNewVoucherDiscount(e.target.value)} placeholder="VD: Giảm 25.000đ hoặc 15%" className="w-full px-3 py-2 rounded-xl border bg-white font-bold text-[#155C3B]" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block font-bold mb-1">Mã gốc Shop</label>
                <input type="text" value={newVoucherCode} onChange={(e) => setNewVoucherCode(e.target.value)} placeholder="GS25K" className="w-full px-3 py-2 rounded-xl border bg-white font-mono uppercase" />
              </div>
              <div>
                <label className="block font-bold mb-1">Ngưỡng điểm tự gửi QR</label>
                <input type="number" value={newVoucherPoints} onChange={(e) => setNewVoucherPoints(Number(e.target.value))} className="w-full px-3 py-2 rounded-xl border bg-white" />
              </div>
              <div>
                <label className="block font-bold mb-1">Số lượng mã</label>
                <input type="number" value={newVoucherStock} onChange={(e) => setNewVoucherStock(Number(e.target.value))} className="w-full px-3 py-2 rounded-xl border bg-white" />
              </div>
            </div>
            <button type="submit" className="w-full py-2.5 rounded-xl bg-[#155C3B] text-white font-bold">
              + Phát hành ngay lên hệ thống tự động cấp QR
            </button>
          </form>

          <div className="space-y-2 text-xs">
            <div className="font-bold text-[#3D554B]">Voucher đang phát hành của {currentShop.shopName}:</div>
            {myOffers.map((of) => (
              <div key={of.id} className="p-3 rounded-xl border flex items-center justify-between gap-2">
                <div>
                  <div className="font-bold text-[#0B1F17]">{of.title} <span className="ml-1 px-2 py-0.5 rounded bg-[#E5F7ED] text-[#155C3B] text-[10px]">{of.discountLabel}</span></div>
                  <div className="text-[#3D554B]">Mã gốc: <strong className="font-mono text-[#155C3B]">{of.promoCode}</strong> • {of.pointsRequired} điểm • Còn {of.stockRemaining}</div>
                </div>
                <button
                  onClick={() => setShopOffers((prev) => prev.map((item) => (item.id === of.id ? { ...item, isActive: !item.isActive } : item)))}
                  className={`px-2.5 py-1 rounded-lg font-bold ${of.isActive ? 'bg-[#E5F7ED] text-[#155C3B]' : 'bg-gray-100 text-gray-500'}`}
                >
                  {of.isActive ? 'Đang bật' : 'Tạm tắt'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // ==========================================================================
  // 8. LOGISTICS & CLEANING PARTNER VIEWS (`PARTNER`)
  // ==========================================================================
  const renderPartnerViews = () => {
    if (currentRoute === '/partner/routes') {
      const toggleWeekday = (dayNum: number) => {
        setNewRouteWeekdays((prev) =>
          prev.includes(dayNum) ? prev.filter((d) => d !== dayNum) : [...prev, dayNum].sort()
        );
      };

      return (
        <div className="space-y-5">
          <div className="bg-white rounded-2xl p-5 border border-emerald-900/10 shadow-xs">
            <h1 className="text-lg font-bold text-[#0B1F17]">Cấu hình Tuyến thu hồi theo Ngày trong tuần & Shipper</h1>
            <p className="text-xs text-[#3D554B] mt-0.5">
              Khách hàng chọn ngày trên lịch sẽ được hệ thống đối chiếu trực tiếp với các Thứ mà tuyến đang mở dưới đây.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!newRouteDistrict.trim() || !newRouteShipper.trim() || newRouteWeekdays.length === 0) {
                  triggerToast('error', 'Thiếu thông tin tuyến', 'Vui lòng nhập quận, Shipper và chọn ít nhất 1 ngày chạy trong tuần.');
                  return;
                }
                const daysLabel = newRouteWeekdays.length === 7 ? 'Hàng ngày (T2 - CN)' : newRouteWeekdays.map((d) => WEEKDAY_VN[d]).join(', ');
                const created: PickupRouteRecord = {
                  id: `RT-${Date.now()}`,
                  routeCode: `TUYEN-${newRouteDistrict.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 8)}`,
                  district: newRouteDistrict.trim(),
                  activeDays: daysLabel,
                  activeWeekdays: newRouteWeekdays,
                  timeSlots: ['09:00 - 12:00', '14:00 - 17:00'],
                  shipperName: newRouteShipper.trim(),
                  shipperPhone: newRoutePhone.trim() || '0901 222 333',
                  isActive: true
                };
                setPickupRoutes((prev) => [created, ...prev]);
                triggerToast('success', 'Đã mở tuyến mới', `Tuyến ${created.routeCode} (${daysLabel}) đã đồng bộ sang lịch Khách hàng.`);
              }}
              className="bg-white rounded-2xl p-5 border border-emerald-900/10 shadow-xs space-y-3 text-xs"
            >
              <h2 className="text-sm font-bold text-[#0B1F17]">+ Mở tuyến thu hồi khu vực mới</h2>
              <div>
                <label className="block font-bold mb-1">Quận / Huyện phục vụ</label>
                <input type="text" value={newRouteDistrict} onChange={(e) => setNewRouteDistrict(e.target.value)} className="w-full px-3 py-2 rounded-xl border" />
              </div>
              <div>
                <label className="block font-bold mb-1">Chọn ngày tuyến chạy trong tuần</label>
                <div className="flex flex-wrap gap-1.5">
                  {[1, 2, 3, 4, 5, 6, 0].map((d) => (
                    <button
                      type="button"
                      key={d}
                      onClick={() => toggleWeekday(d)}
                      className={`px-2.5 py-1 rounded-lg border font-bold ${newRouteWeekdays.includes(d) ? 'bg-[#155C3B] text-white border-[#155C3B]' : 'bg-[#F7FBF8] text-[#3D554B]'}`}
                    >
                      {WEEKDAY_VN[d]}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block font-bold mb-1">Shipper phụ trách tuyến</label>
                <input type="text" value={newRouteShipper} onChange={(e) => setNewRouteShipper(e.target.value)} className="w-full px-3 py-2 rounded-xl border" />
              </div>
              <div>
                <label className="block font-bold mb-1">SĐT Shipper</label>
                <input type="text" value={newRoutePhone} onChange={(e) => setNewRoutePhone(e.target.value)} className="w-full px-3 py-2 rounded-xl border" />
              </div>
              <button type="submit" className="w-full py-2.5 rounded-xl bg-[#155C3B] text-white font-bold">
                Lưu & Đồng bộ lịch cho Khách
              </button>
            </form>

            <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-emerald-900/10 shadow-xs space-y-3">
              <h2 className="text-sm font-bold text-[#0B1F17]">Danh sách tuyến đang vận hành ({pickupRoutes.length})</h2>
              <div className="space-y-2.5 text-xs">
                {pickupRoutes.map((rt) => (
                  <div key={rt.id} className="p-3.5 rounded-xl bg-[#F7FBF8] border border-emerald-900/10 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="font-mono font-extrabold text-[#155C3B]">{rt.routeCode} • {rt.district}</div>
                      <div className="text-[#3D554B] mt-0.5">
                        Ngày chạy: <strong>{rt.activeDays}</strong> • Khung giờ: {rt.timeSlots.join(', ')}
                      </div>
                      <div className="text-[#0B1F17] mt-0.5">Shipper: <strong>{rt.shipperName}</strong> ({rt.shipperPhone})</div>
                    </div>
                    <button
                      onClick={() => setPickupRoutes((prev) => prev.map((item) => (item.id === rt.id ? { ...item, isActive: !item.isActive } : item)))}
                      className={`px-3 py-1.5 rounded-xl font-bold ${rt.isActive ? 'bg-[#E5F7ED] text-[#155C3B]' : 'bg-rose-50 text-rose-800'}`}
                    >
                      {rt.isActive ? 'Đang mở tuyến' : 'Tạm ngưng'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (currentRoute === '/partner/pickups') {
      return (
        <div className="max-w-2xl mx-auto space-y-4">
          <div className="rounded-2xl bg-[#0B2418] p-5 text-white flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold text-[#F3E5AB] uppercase">Ứng dụng Shipper Thu hồi</div>
              <h1 className="text-xl font-bold">Danh sách điểm gom túi theo tuyến</h1>
              <p className="text-xs text-[#D1E7DD]">Shipper quét QR xác nhận nhận túi → Hệ thống tự động cộng điểm & gửi QR Voucher cho khách nếu đủ điểm.</p>
            </div>
            <Truck className="w-9 h-9 text-[#D4AF37]" />
          </div>

          {returnRequests.filter((r) => r.status !== 'CANCELLED').map((t) => {
            const isDone = t.status === 'PICKED_UP' || t.status === 'COMPLETED_AT_WAREHOUSE';
            return (
              <div key={t.id} className="bg-white rounded-2xl p-5 border border-emerald-900/10 shadow-xs space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-mono font-bold text-[#3D554B]">{t.requestCode} • {t.routeCode} • Ngày {t.scheduledDateDisplay}</span>
                    <div className="text-base font-extrabold font-mono text-[#155C3B]">Túi {t.bagCode}</div>
                  </div>
                  <span className={`px-3 py-1 rounded-full font-bold border ${RETURN_STATUS_META[t.status].badge}`}>
                    {RETURN_STATUS_META[t.status].label}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-[#F7FBF8] space-y-1">
                  <div><strong>Địa chỉ:</strong> {t.pickupAddress}</div>
                  <div><strong>Khách:</strong> {t.customerName} ({t.customerPhone}) • <strong>Giờ hẹn:</strong> {t.preferredTimeSlot}</div>
                </div>
                {!isDone ? (
                  <button
                    onClick={() => setShowQrScannerModal({ open: true, target: 'SHIPPER', reqCode: t.requestCode })}
                    className="w-full py-3 rounded-xl bg-[#155C3B] text-white font-bold inline-flex items-center justify-center gap-1.5"
                  >
                    <Camera className="w-4 h-4" /> Quét QR nhận túi từ khách (+{pointsPerReturn} điểm)
                  </button>
                ) : (
                  <div className="p-2.5 rounded-xl bg-[#E5F7ED] text-[#155C3B] font-bold flex justify-between items-center">
                    <span>✓ Đã thu hồi & cộng điểm cho khách</span>
                    <button onClick={() => { setWarehouseScanInput(t.bagCode); setCurrentRoute('/partner/cleaning'); }} className="underline">
                      Nhập trạm vệ sinh →
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      );
    }

    if (currentRoute === '/partner/cleaning') {
      const readyToHandoverA = bags.filter((b) => b.qualityGrade === 'A' && b.status === 'PENDING_INSPECTION');
      const readyToHandoverC = bags.filter((b) => b.status === 'RETIRED_WAITING_RECYCLE');

      return (
        <div className="space-y-5">
          <div className="bg-white rounded-2xl p-5 border border-emerald-900/10 shadow-xs">
            <h1 className="text-lg font-bold text-[#0B1F17]">Trạm Nhận hàng, Vệ sinh A/B/C & Lập phiếu Bàn giao Kho tổng</h1>
            <p className="text-xs text-[#3D554B]">
              Bên Vận chuyển/Vệ sinh lập biên bản bàn giao túi sạch Loại A và túi hỏng Loại C về Kho tổng Returnpack để Admin duyệt nhập kho.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 text-xs">
            <div className="bg-white rounded-2xl p-5 border border-emerald-900/10 shadow-xs space-y-3">
              <h3 className="text-sm font-bold text-[#0B1F17]">1. Quét nhận trạm & Phân loại A/B/C</h3>
              <input type="text" value={warehouseScanInput} onChange={(e) => setWarehouseScanInput(e.target.value)} className="w-full px-3 py-2 rounded-xl border font-mono font-bold" />
              <div className="grid grid-cols-3 gap-2">
                {(['A', 'B', 'C'] as const).map((g) => (
                  <button
                    key={g}
                    onClick={() => setSelectedInspectGrade(g)}
                    className={`py-2 rounded-xl font-bold border ${selectedInspectGrade === g ? 'bg-[#155C3B] text-white' : 'bg-[#F7FBF8]'}`}
                  >
                    Loại {g}
                  </button>
                ))}
              </div>
              <input type="text" value={inspectNoteInput} onChange={(e) => setInspectNoteInput(e.target.value)} className="w-full px-3 py-2 rounded-xl border" />
              <button
                onClick={() => {
                  const code = warehouseScanInput.trim().toUpperCase();
                  const bag = bags.find((b) => b.bagCode === code);
                  if (!bag) return;
                  const nowFull = getNowFullVn();
                  if (selectedInspectGrade === 'B') {
                    setBags((prev) => prev.map((b) => (b.bagCode === code ? { ...b, status: 'CLEANING_MAINTENANCE', qualityGrade: 'B', currentLocation: 'Trạm 3PL - Khu vệ sinh', updatedAt: nowFull } : b)));
                    setMaintenanceJobs((prev) => [{ id: `MJ-${Date.now()}`, bagCode: code, jobType: 'Vệ sinh khử khuẩn', status: 'IN_PROGRESS', assignedStaff: 'Tổ vệ sinh 3PL', startedAt: nowFull }, ...prev]);
                  } else if (selectedInspectGrade === 'C') {
                    setBags((prev) => prev.map((b) => (b.bagCode === code ? { ...b, status: 'RETIRED_WAITING_RECYCLE', qualityGrade: 'C', currentLocation: 'Trạm 3PL - Chờ bàn giao Loại C', updatedAt: nowFull } : b)));
                  } else {
                    setBags((prev) => prev.map((b) => (b.bagCode === code ? { ...b, status: 'PENDING_INSPECTION', qualityGrade: 'A', currentLocation: 'Trạm 3PL - Sạch đạt Loại A', updatedAt: nowFull } : b)));
                  }
                  triggerToast('success', `Đã phân loại ${selectedInspectGrade}`, `Túi ${code} đã cập nhật kết quả kiểm định.`);
                }}
                className="w-full py-2.5 rounded-xl bg-[#155C3B] text-white font-bold"
              >
                Lưu phân loại ({selectedInspectGrade})
              </button>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-emerald-900/10 shadow-xs space-y-3">
              <h3 className="text-sm font-bold text-[#0B1F17]">2. Xử lý vệ sinh túi Loại B</h3>
              {maintenanceJobs.map((j) => (
                <div key={j.id} className="p-3 rounded-xl bg-[#F7FBF8] space-y-2">
                  <div className="flex justify-between font-bold">
                    <span className="font-mono text-[#155C3B]">{j.bagCode}</span>
                    <span>{j.status === 'COMPLETED' ? 'Đã sạch đạt A' : 'Đang giặt sấy'}</span>
                  </div>
                  <div className="text-[11px] text-[#3D554B]">Bắt đầu: {j.startedAt}</div>
                  {j.status !== 'COMPLETED' && (
                    <button
                      onClick={() => {
                        setMaintenanceJobs((prev) => prev.map((m) => (m.id === j.id ? { ...m, status: 'COMPLETED' } : m)));
                        setBags((prev) => prev.map((b) => (b.bagCode === j.bagCode ? { ...b, status: 'PENDING_INSPECTION', qualityGrade: 'A', currentLocation: 'Trạm 3PL - Sạch đạt Loại A', updatedAt: getNowFullVn() } : b)));
                        triggerToast('success', 'Hoàn tất vệ sinh', `Túi ${j.bagCode} đạt chuẩn A, sẵn sàng lập phiếu trả Returnpack.`);
                      }}
                      className="w-full py-2 rounded-xl bg-cyan-700 text-white font-bold"
                    >
                      Hoàn tất vệ sinh → Đạt Loại A
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="bg-white rounded-2xl p-5 border border-emerald-900/10 shadow-xs space-y-3">
              <h3 className="text-sm font-bold text-[#0B1F17]">3. Bàn giao túi sạch/hỏng về Returnpack</h3>
              <div className="p-3 rounded-xl bg-[#E5F7ED] space-y-1">
                <div>Túi sạch Loại A chờ giao: <strong>{readyToHandoverA.length} túi</strong></div>
                <div>Túi hỏng Loại C chờ giao: <strong>{readyToHandoverC.length} túi</strong></div>
              </div>
              <button
                onClick={() => {
                  const aCodes = readyToHandoverA.map((b) => b.bagCode);
                  const cCodes = readyToHandoverC.map((b) => b.bagCode);
                  if (aCodes.length === 0 && cCodes.length === 0) {
                    triggerToast('warning', 'Chưa có túi chờ bàn giao', 'Vui lòng hoàn tất phân loại A hoặc C trước.');
                    return;
                  }
                  const newRec: HubHandoverReceipt = {
                    id: `HB-${Date.now()}`,
                    receiptCode: `BG-3PL-00${hubReceipts.length + 1}`,
                    partnerName: 'Đối tác Vận chuyển & Vệ sinh 3PL',
                    gradeACodes: aCodes,
                    gradeCCodes: cCodes,
                    status: 'PENDING_ADMIN_CONFIRM',
                    createdAt: getNowFullVn()
                  };
                  setHubReceipts((prev) => [newRec, ...prev]);
                  triggerToast('success', 'Đã lập phiếu bàn giao', `Phiếu ${newRec.receiptCode} đã gửi sang Kho tổng Returnpack.`);
                }}
                className="w-full py-2.5 rounded-xl bg-[#155C3B] text-white font-bold"
              >
                Tạo phiếu bàn giao về Kho tổng
              </button>

              <div className="space-y-2 pt-2 border-t">
                {hubReceipts.map((rc) => (
                  <div key={rc.id} className="p-2.5 rounded-xl bg-[#F7FBF8] flex justify-between items-center">
                    <div>
                      <div className="font-mono font-bold text-[#155C3B]">{rc.receiptCode}</div>
                      <div className="text-[#3D554B]">Loại A: {rc.gradeACodes.length} • Loại C: {rc.gradeCCodes.length}</div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full font-bold ${rc.status === 'CONFIRMED_INBOUND' ? 'bg-[#E5F7ED] text-[#155C3B]' : rc.status === 'REJECTED_RECOUNT' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-900'}`}>
                      {rc.status === 'CONFIRMED_INBOUND' ? 'Admin đã nhập kho' : rc.status === 'REJECTED_RECOUNT' ? 'Yêu cầu kiểm lại' : 'Chờ Admin duyệt'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      );
    }

    const pickedCount = returnRequests.filter((r) => r.status === 'PICKED_UP' || r.status === 'COMPLETED_AT_WAREHOUSE').length;
    const cleanedCount = bags.filter((b) => b.status === 'AVAILABLE_AT_WAREHOUSE').length;
    const totalFee = pickedCount * 2500 + cleanedCount * 1200;

    return (
      <div className="bg-white rounded-2xl p-6 border border-emerald-900/10 shadow-xs space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-bold text-[#0B1F17]">Bảng Đối soát Sản lượng & SLA Cuối tháng</h1>
            <p className="text-xs text-[#3D554B]">Tự động tổng hợp phí thu hồi theo tuyến + phí vệ sinh đạt chuẩn Loại A.</p>
          </div>
          <div className="p-3.5 rounded-2xl bg-[#E5F7ED] text-right">
            <div className="text-xs text-[#155C3B] font-bold">Tổng phí đối soát tạm tính</div>
            <div className="text-2xl font-extrabold text-[#0B1F17]">{totalFee.toLocaleString('vi-VN')}đ</div>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-[#F7FBF8]">
            <div className="text-[#3D554B]">Lượt thu hồi đúng SLA</div>
            <div className="text-2xl font-extrabold mt-1">{pickedCount} lượt (× 2.500đ)</div>
          </div>
          <div className="p-4 rounded-2xl bg-[#F7FBF8]">
            <div className="text-[#3D554B]">Túi vệ sinh đạt chuẩn Loại A</div>
            <div className="text-2xl font-extrabold text-[#155C3B] mt-1">{cleanedCount} túi (× 1.200đ)</div>
          </div>
          <div className="p-4 rounded-2xl bg-[#F7FBF8]">
            <div className="text-[#3D554B]">Tỷ lệ thu hồi đúng khung giờ</div>
            <div className="text-2xl font-extrabold text-[#155C3B] mt-1">96.4% (Đạt SLA)</div>
          </div>
        </div>
      </div>
    );
  };

  // ==========================================================================
  // 9. ADMIN PORTAL VIEWS (`ADMIN` - STRICT & DETAILED MANAGEMENT)
  // ==========================================================================
  const renderAdminViews = () => {
    // 1. Tổng quan Hệ thống (/admin/dashboard)
    if (currentRoute === '/admin/dashboard') {
      const totalCycles = bags.reduce((s, b) => s + b.cyclesUsed, 0);
      const pendingAllocs = allocations.filter((a) => a.status === 'PENDING').length;
      const pendingReceipts = hubReceipts.filter((r) => r.status === 'PENDING_ADMIN_CONFIRM').length;
      const overdueReturns = returnRequests.filter((r) => r.isOverdue && r.status !== 'PICKED_UP' && r.status !== 'COMPLETED_AT_WAREHOUSE' && r.status !== 'CANCELLED');
      const chartData = [
        { name: 'Th08', luot: 980, thuHoi: 910 },
        { name: 'Th09', luot: 1420, thuHoi: 1330 },
        { name: 'Th10', luot: 1850, thuHoi: 1740 },
        { name: 'Th11', luot: shops.reduce((s, sh) => s + sh.usedTurns, 0), thuHoi: returnRequests.length * 180 }
      ];

      return (
        <div className="space-y-6">
          <div className="rounded-2xl bg-gradient-to-r from-[#0B2418] via-[#123E29] to-[#155C3B] border border-[#D4AF37]/30 p-6 text-white shadow-lg flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <span className="px-3 py-0.5 rounded-full bg-white/10 border border-[#D4AF37]/40 text-[11px] font-bold text-[#F3E5AB]">
                RETURNPACK COMMAND CENTER • QUẢN TRỊ CHẶT CHẼ
              </span>
              <h1 className="text-2xl font-bold mt-1.5">Trung tâm Kiểm soát Vòng đời Bao bì Tuần hoàn</h1>
              <p className="text-xs text-[#D1E7DD] mt-1">Giám sát SLA thu hồi, tồn kho tổng, hạn mức Shop và nhật ký kiểm toán theo thời gian thực.</p>
            </div>
            <EarthMascot3D pose="wave" size={76} />
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 text-xs">
            <div className="bg-white p-4 rounded-2xl border border-emerald-900/10">
              <div className="text-[#3D554B] font-bold">Tổng túi QR phát hành</div>
              <div className="text-2xl font-extrabold text-[#0B1F17] mt-1">{bags.length} túi</div>
              <div className="text-[11px] text-[#155C3B] mt-1">Kho tổng sẵn: {bags.filter((b) => b.status === 'AVAILABLE_AT_WAREHOUSE').length}</div>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-emerald-900/10">
              <div className="text-[#3D554B] font-bold">Tổng lượt luân chuyển</div>
              <div className="text-2xl font-extrabold text-[#155C3B] mt-1">{totalCycles} lượt</div>
              <div className="text-[11px] text-[#3D554B] mt-1">Giảm {((totalCycles * 28) / 1000).toFixed(2)} kg nhựa</div>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-emerald-900/10">
              <div className="text-[#3D554B] font-bold">Phiếu Shop chờ duyệt</div>
              <div className="text-2xl font-extrabold text-amber-600 mt-1">{pendingAllocs} phiếu</div>
              <button onClick={() => setCurrentRoute('/admin/shops')} className="text-[11px] font-bold text-[#155C3B] underline mt-1">Duyệt ngay →</button>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-emerald-900/10">
              <div className="text-[#3D554B] font-bold">Phiếu 3PL chờ nhập kho</div>
              <div className="text-2xl font-extrabold text-sky-700 mt-1">{pendingReceipts} biên bản</div>
              <button onClick={() => setCurrentRoute('/warehouse')} className="text-[11px] font-bold text-[#155C3B] underline mt-1">Đối chiếu kho →</button>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-rose-200">
              <div className="text-rose-700 font-bold">Cảnh báo trễ SLA</div>
              <div className="text-2xl font-extrabold text-rose-700 mt-1">{overdueReturns.length} đơn</div>
              <button onClick={() => { setAdminReturnOnlyOverdue(true); setCurrentRoute('/admin/returns'); }} className="text-[11px] font-bold text-rose-700 underline mt-1">Xử lý ngay →</button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-emerald-900/10 shadow-xs">
              <h2 className="text-sm font-bold text-[#0B1F17] mb-3">Biểu đồ tăng trưởng luân chuyển & thu hồi</h2>
              <div className="h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="luot" name="Lượt đóng gói" fill="#155C3B" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="thuHoi" name="Túi thu hồi" fill="#48B86C" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-emerald-900/10 shadow-xs space-y-3 text-xs">
              <h2 className="text-sm font-bold text-[#0B1F17] flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600" /> Việc cần Admin xử lý ngay
              </h2>
              {overdueReturns.map((r) => (
                <div key={r.id} className="p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-between gap-2">
                  <div>
                    <div className="font-bold text-rose-800">{r.requestCode} • {r.bagCode}</div>
                    <div className="text-rose-700">Trễ {r.waitingHours}h • {r.areaDistrict} ({r.scheduledDateDisplay})</div>
                  </div>
                  <button onClick={() => setCurrentRoute('/admin/returns')} className="px-2.5 py-1 rounded-lg bg-rose-700 text-white font-bold">Xem</button>
                </div>
              ))}
              {allocations.filter((a) => a.status === 'PENDING').map((al) => (
                <div key={al.id} className="p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between gap-2">
                  <div>
                    <div className="font-bold text-amber-900">{al.allocationCode} • {al.shopName}</div>
                    <div className="text-amber-800">Xin cấp {al.quantity} túi {al.size}</div>
                  </div>
                  <button onClick={() => setCurrentRoute('/admin/shops')} className="px-2.5 py-1 rounded-lg bg-[#155C3B] text-white font-bold">Duyệt</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    // 2. Quản lý Túi, QR & In tem hàng loạt (/admin/bags - Chi tiết & Khóa/Mở/Thất lạc)
    if (currentRoute === '/admin/bags') {
      const filtered = bags.filter(
        (b) =>
          (b.bagCode.toLowerCase().includes(bagSearchQuery.toLowerCase()) || b.currentLocation.toLowerCase().includes(bagSearchQuery.toLowerCase()) || b.batchCode.toLowerCase().includes(bagSearchQuery.toLowerCase())) &&
          (bagStatusFilter === 'ALL' || b.status === bagStatusFilter) &&
          (bagGradeFilter === 'ALL' || b.qualityGrade === bagGradeFilter)
      );
      return (
        <div className="space-y-5">
          <div className="bg-white rounded-2xl p-5 border border-emerald-900/10 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="text-lg font-bold text-[#0B1F17]">Quản lý Túi, Mã QR & Kiểm soát Vòng đời</h1>
                <p className="text-xs text-[#3D554B]">Khởi tạo lô QR mới theo size/số lượng, in tem hàng loạt, khóa túi hỏng hoặc đánh dấu thất lạc.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => setShowPrintQrModal(true)} className="px-3.5 py-2 rounded-xl bg-[#E5F7ED] text-[#155C3B] text-xs font-bold inline-flex items-center gap-1.5">
                  <Printer className="w-4 h-4" /> In tem QR hàng loạt
                </button>
                <button onClick={handleExportBagsCsv} className="px-3.5 py-2 rounded-xl border border-emerald-900/15 bg-white text-[#0B1F17] text-xs font-bold inline-flex items-center gap-1.5">
                  <Download className="w-4 h-4" /> Xuất CSV
                </button>
              </div>
            </div>

            {/* Batch Generator Bar */}
            <div className="p-3.5 rounded-2xl bg-[#F7FBF8] border border-emerald-900/10 flex flex-wrap items-end gap-3 text-xs">
              <div>
                <label className="block font-bold mb-1">Kích thước lô túi mới</label>
                <select value={batchSizeCreate} onChange={(e) => setBatchSizeCreate(e.target.value as any)} className="px-3 py-2 rounded-xl border bg-white font-semibold">
                  <option value="S (25x35cm)">S (25x35cm)</option>
                  <option value="M (32x43cm)">M (32x43cm)</option>
                  <option value="L (40x55cm)">L (40x55cm)</option>
                </select>
              </div>
              <div>
                <label className="block font-bold mb-1">Số lượng khởi tạo</label>
                <input type="number" min={1} max={50} value={batchQtyCreate} onChange={(e) => setBatchQtyCreate(Math.max(1, Math.min(50, Number(e.target.value) || 5)))} className="w-24 px-3 py-2 rounded-xl border bg-white font-bold" />
              </div>
              <button
                onClick={() => {
                  const base = bags.length + 1;
                  const nowFull = getNowFullVn();
                  const batchCode = `LOT-${new Date().toISOString().slice(2, 7).replace('-', '')}`;
                  const newBatch: BagRecord[] = Array.from({ length: batchQtyCreate }).map((_, i) => ({
                    id: `BAG-${Date.now()}-${i}`,
                    bagCode: `RP-${String(base + i).padStart(6, '0')}`,
                    size: batchSizeCreate,
                    batchCode,
                    currentLocation: 'Kho tổng Thủ Đức - Kệ A1',
                    holdingShopId: null,
                    holdingShopName: null,
                    status: 'AVAILABLE_AT_WAREHOUSE',
                    cyclesUsed: 0,
                    maxCycles: maxAllowedCycles,
                    qualityGrade: 'A',
                    lastInspectionResult: 'Túi mới - Đạt chuẩn A',
                    updatedAt: nowFull
                  }));
                  setBags((prev) => [...newBatch, ...prev]);
                  addAuditLog('Khởi tạo lô túi QR mới', batchCode, `Tạo ${batchQtyCreate} túi ${batchSizeCreate} (${newBatch[0].bagCode} → ${newBatch[newBatch.length - 1].bagCode}).`);
                  triggerToast('success', `Đã sinh ${batchQtyCreate} mã túi QR`, `${newBatch[0].bagCode} đến ${newBatch[newBatch.length - 1].bagCode}.`);
                }}
                className="px-4 py-2 rounded-xl bg-[#155C3B] text-white font-bold inline-flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Khởi tạo lô túi & Sinh QR
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-emerald-900/10 shadow-xs flex flex-wrap gap-3 text-xs">
            <input
              type="text"
              value={bagSearchQuery}
              onChange={(e) => setBagSearchQuery(e.target.value)}
              placeholder="Tìm mã túi (RP-000001), lô SX hoặc vị trí..."
              className="flex-1 min-w-[200px] px-3.5 py-2 rounded-xl border"
            />
            <select value={bagStatusFilter} onChange={(e) => setBagStatusFilter(e.target.value)} className="px-3 py-2 rounded-xl border font-bold bg-white">
              <option value="ALL">Tất cả trạng thái ({bags.length})</option>
              {Object.entries(BAG_STATUS_META).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
            <select value={bagGradeFilter} onChange={(e) => setBagGradeFilter(e.target.value)} className="px-3 py-2 rounded-xl border font-bold bg-white">
              <option value="ALL">Mọi phân loại A/B/C</option>
              <option value="A">Chỉ Loại A</option>
              <option value="B">Chỉ Loại B</option>
              <option value="C">Chỉ Loại C</option>
            </select>
          </div>

          <div className="bg-white rounded-2xl border border-emerald-900/10 shadow-xs overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-[#F7FBF8] border-b text-[#3D554B]">
                  <th className="py-3 px-4">Mã QR / Túi</th>
                  <th className="py-3 px-4">Kích thước / Lô</th>
                  <th className="py-3 px-4">Vị trí hiện tại</th>
                  <th className="py-3 px-4">Trạng thái</th>
                  <th className="py-3 px-4">Vòng đời</th>
                  <th className="py-3 px-4">Loại</th>
                  <th className="py-3 px-4 text-right">Kiểm soát</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((b) => (
                  <tr key={b.id} className="hover:bg-[#F7FBF8]">
                    <td className="py-3 px-4 flex items-center gap-2.5">
                      <QrMatrixSvg value={b.bagCode} size={32} />
                      <div>
                        <div className="font-mono font-extrabold text-[#155C3B]">{b.bagCode}</div>
                        <div className="text-[10px] text-[#3D554B]">{b.updatedAt}</div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold">{b.size}</div>
                      <div className="text-[11px] text-[#3D554B]">{b.batchCode}</div>
                    </td>
                    <td className="py-3 px-4">{b.currentLocation}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full font-bold ${BAG_STATUS_META[b.status].bg} ${BAG_STATUS_META[b.status].text}`}>
                        {BAG_STATUS_META[b.status].label}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold">{b.cyclesUsed} / {b.maxCycles}</td>
                    <td className="py-3 px-4 font-extrabold">Loại {b.qualityGrade}</td>
                    <td className="py-3 px-4 text-right space-x-1.5">
                      <button
                        onClick={() => setSelectedBagDetailModal(b)}
                        className="px-2.5 py-1 rounded-lg bg-[#E5F7ED] text-[#155C3B] font-bold inline-flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" /> Chi tiết
                      </button>
                      <button
                        onClick={() => {
                          const nextStatus: BagStatus = b.status === 'LOCKED_DEFECTIVE' ? 'AVAILABLE_AT_WAREHOUSE' : 'LOCKED_DEFECTIVE';
                          setBags((prev) => prev.map((item) => (item.id === b.id ? { ...item, status: nextStatus, updatedAt: getNowFullVn() } : item)));
                          addAuditLog(nextStatus === 'LOCKED_DEFECTIVE' ? 'Khóa túi hỏng' : 'Mở khóa túi', b.bagCode, `Đổi trạng thái sang ${BAG_STATUS_META[nextStatus].label}`);
                          triggerToast('info', 'Đã cập nhật trạng thái túi', `Túi ${b.bagCode} → ${BAG_STATUS_META[nextStatus].label}`);
                        }}
                        className="px-2 py-1 rounded-lg border text-[#3D554B] hover:text-rose-700"
                        title="Khóa / Mở khóa túi"
                      >
                        {b.status === 'LOCKED_DEFECTIVE' ? <Unlock className="w-3.5 h-3.5 inline" /> : <Lock className="w-3.5 h-3.5 inline" />}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    // 3. Shop, Gói & Duyệt cấp túi (/admin/shops - Quản lý chặt hạn mức, khóa shop, duyệt/từ chối phiếu)
    if (currentRoute === '/admin/shops') {
      const filteredShops = shops.filter(
        (s) => s.shopName.toLowerCase().includes(adminShopSearch.toLowerCase()) || s.shopCode.toLowerCase().includes(adminShopSearch.toLowerCase())
      );

      return (
        <div className="space-y-5 text-xs">
          <div className="bg-white rounded-2xl p-5 border border-emerald-900/10 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-lg font-bold text-[#0B1F17]">Quản lý Shop Đối tác, Gói thuê bao & Duyệt cấp phát túi</h1>
              <p className="text-[#3D554B]">Kiểm soát hạn mức giữ túi, khóa/mở gian hàng, nâng cấp gói và duyệt/từ chối phiếu xin cấp túi.</p>
            </div>
            <input
              type="text"
              value={adminShopSearch}
              onChange={(e) => setAdminShopSearch(e.target.value)}
              placeholder="Tìm tên hoặc mã Shop..."
              className="px-3.5 py-2 rounded-xl border w-64"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredShops.map((s) => (
              <div key={s.id} className="bg-white rounded-2xl p-5 border border-emerald-900/10 shadow-xs space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-mono text-[#3D554B]">{s.shopCode} • {s.email}</div>
                    <div className="text-base font-bold text-[#0B1F17]">{s.shopName}</div>
                    <div className="text-[#3D554B]">{s.ownerName} • {s.phone} • {s.district}</div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full font-bold ${s.status === 'ACTIVE' ? 'bg-[#E5F7ED] text-[#155C3B]' : 'bg-rose-100 text-rose-800'}`}>
                    {s.status === 'ACTIVE' ? 'Đang hoạt động' : 'Đã khóa'}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-[#F7FBF8] space-y-1.5">
                  <div className="flex justify-between"><span>Gói thuê bao ({s.planName}):</span><strong>Còn {s.monthlyQuotaTurns - s.usedTurns}/{s.monthlyQuotaTurns} lượt</strong></div>
                  <div className="flex justify-between"><span>Túi đang giữ / Hạn mức tối đa:</span><strong>{s.currentBagsHeld} / {s.concurrentBagLimit} túi</strong></div>
                  <div className="flex justify-between"><span>Công nợ hiện tại:</span><strong className="text-rose-700">{s.outstandingDebtVnd.toLocaleString('vi-VN')}đ</strong></div>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    onClick={() => {
                      setShops((prev) => prev.map((item) => (item.id === s.id ? { ...item, concurrentBagLimit: item.concurrentBagLimit + 50 } : item)));
                      addAuditLog('Tăng hạn mức giữ túi Shop', s.shopName, `Tăng hạn mức thêm +50 túi (lên ${s.concurrentBagLimit + 50}).`);
                      triggerToast('success', 'Đã nâng hạn mức', `${s.shopName} được giữ tối đa ${s.concurrentBagLimit + 50} túi.`);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-[#E5F7ED] text-[#155C3B] font-bold"
                  >
                    +50 hạn mức túi
                  </button>
                  <button
                    onClick={() => {
                      const nextSt = s.status === 'ACTIVE' ? 'LOCKED' : 'ACTIVE';
                      setShops((prev) => prev.map((item) => (item.id === s.id ? { ...item, status: nextSt } : item)));
                      addAuditLog(nextSt === 'LOCKED' ? 'Khóa gian hàng Shop' : 'Mở khóa gian hàng Shop', s.shopName, `Trạng thái mới: ${nextSt}`);
                      triggerToast('warning', nextSt === 'LOCKED' ? 'Đã khóa Shop' : 'Đã mở khóa Shop', `${s.shopName} → ${nextSt}`);
                    }}
                    className={`px-3 py-1.5 rounded-xl font-bold ${s.status === 'ACTIVE' ? 'bg-rose-50 text-rose-800 border border-rose-200' : 'bg-[#155C3B] text-white'}`}
                  >
                    {s.status === 'ACTIVE' ? 'Khóa gian hàng' : 'Mở khóa gian hàng'}
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl p-5 border border-emerald-900/10 shadow-xs space-y-3">
            <h2 className="text-sm font-bold text-[#0B1F17]">Phiếu yêu cầu cấp túi từ Shop (Duyệt / Từ chối)</h2>
            {allocations.map((al) => (
              <div key={al.id} className="p-3.5 rounded-xl bg-[#F7FBF8] flex flex-wrap items-center justify-between gap-2">
                <div>
                  <strong className="font-mono text-[#155C3B]">{al.allocationCode}</strong> • <strong>{al.shopName}</strong> yêu cầu <strong>{al.quantity} túi {al.size}</strong>
                  <div className="text-[11px] text-[#3D554B]">Ngày gửi: {al.createdAt}{al.rejectReason ? ` • Lý do từ chối: ${al.rejectReason}` : ''}</div>
                </div>
                {al.status === 'PENDING' ? (
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        const avail = bags.filter((b) => b.status === 'AVAILABLE_AT_WAREHOUSE');
                        if (avail.length === 0) {
                          triggerToast('error', 'Kho tổng hết túi Loại A', 'Cần duyệt nhập kho từ 3PL hoặc khởi tạo lô túi mới.');
                          return;
                        }
                        const dispatchCount = Math.min(al.quantity, avail.length);
                        const dispatchedCodes = avail.slice(0, dispatchCount).map((b) => b.bagCode);
                        const nowFull = getNowFullVn();
                        setBags((prev) => prev.map((b) => (dispatchedCodes.includes(b.bagCode) ? { ...b, status: 'AT_SHOP', holdingShopId: al.shopId, holdingShopName: al.shopName, currentLocation: al.shopName, updatedAt: nowFull } : b)));
                        setShops((prev) => prev.map((s) => (s.id === al.shopId ? { ...s, currentBagsHeld: s.currentBagsHeld + dispatchCount } : s)));
                        setAllocations((prev) => prev.map((item) => (item.id === al.id ? { ...item, status: 'CONFIRMED' } : item)));
                        addAuditLog('Duyệt & Xuất kho cho Shop', al.allocationCode, `Xuất ${dispatchCount} túi (${dispatchedCodes.join(', ')}) cho ${al.shopName}.`);
                        triggerToast('success', 'Đã duyệt & xuất kho tổng', `Đã cấp ${dispatchCount} túi cho ${al.shopName}.`);
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-[#155C3B] text-white font-bold"
                    >
                      Duyệt & Xuất kho
                    </button>
                    <button
                      onClick={() => {
                        setAllocations((prev) => prev.map((item) => (item.id === al.id ? { ...item, status: 'REJECTED', rejectReason: 'Shop cần hoàn tất đối soát công nợ / kho đang điều phối' } : item)));
                        addAuditLog('Từ chối phiếu cấp túi', al.allocationCode, `Từ chối yêu cầu của ${al.shopName}.`);
                        triggerToast('warning', 'Đã từ chối phiếu', `Phiếu ${al.allocationCode} đã chuyển trạng thái Từ chối.`);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 font-bold"
                    >
                      Từ chối
                    </button>
                  </div>
                ) : (
                  <span className={`px-2.5 py-0.5 rounded-full font-bold ${al.status === 'CONFIRMED' ? 'bg-[#E5F7ED] text-[#155C3B]' : 'bg-rose-100 text-rose-800'}`}>
                    {al.status === 'CONFIRMED' ? 'Đã cấp phát' : 'Đã từ chối'}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      );
    }

    // 4. Giám sát Thu hồi & SLA (/admin/returns - Bộ lọc SLA + Đổi Shipper điều phối, không quét thay)
    if (currentRoute === '/admin/returns') {
      const filteredReturns = returnRequests.filter(
        (r) =>
          (adminReturnStatusFilter === 'ALL' || r.status === adminReturnStatusFilter) &&
          (!adminReturnOnlyOverdue || r.isOverdue)
      );
      const uniqueShippers = Array.from(new Set(pickupRoutes.map((rt) => rt.shipperName)));

      return (
        <div className="space-y-4 text-xs">
          <div className="bg-white rounded-2xl p-5 border border-emerald-900/10 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-lg font-bold text-[#0B1F17]">Giám sát Thu hồi Toàn hệ thống & Điều phối SLA</h1>
              <p className="text-[#3D554B]">Theo dõi ngày hẹn, điều phối đổi Shipper khi trễ tuyến (Không cho phép Admin quét thay Shipper để chống gian lận).</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 font-bold cursor-pointer">
                <input type="checkbox" checked={adminReturnOnlyOverdue} onChange={(e) => setAdminReturnOnlyOverdue(e.target.checked)} />
                Chỉ xem đơn trễ SLA
              </label>
              <select value={adminReturnStatusFilter} onChange={(e) => setAdminReturnStatusFilter(e.target.value)} className="px-3 py-2 rounded-xl border bg-white font-bold">
                <option value="ALL">Tất cả trạng thái ({returnRequests.length})</option>
                {Object.entries(RETURN_STATUS_META).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-emerald-900/10 shadow-xs overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-[#F7FBF8] border-b text-[#3D554B]">
                  <th className="py-3 px-4">Mã YC / Túi</th>
                  <th className="py-3 px-4">Ngày hẹn & Tuyến</th>
                  <th className="py-3 px-4">Khách hàng</th>
                  <th className="py-3 px-4">Điều phối Shipper</th>
                  <th className="py-3 px-4">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredReturns.map((r) => (
                  <tr key={r.id} className={r.isOverdue ? 'bg-rose-50/40' : ''}>
                    <td className="py-3 px-4 font-mono font-bold">
                      <div>{r.requestCode}</div>
                      <div className="text-[#155C3B]">{r.bagCode}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-[#0B1F17]">{r.scheduledDateDisplay} ({r.preferredTimeSlot})</div>
                      <div className="text-[#3D554B]">{r.routeCode} • {r.areaDistrict}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold">{r.customerName}</div>
                      <div className="text-[#3D554B]">{r.customerPhone} • Tạo: {r.createdAt}</div>
                    </td>
                    <td className="py-3 px-4">
                      {['RECEIVED', 'MATCHING_ROUTE', 'ASSIGNED_SHIPPER'].includes(r.status) ? (
                        <select
                          value={r.assignedShipperName || ''}
                          onChange={(e) => {
                            const newShipper = e.target.value;
                            setReturnRequests((prev) =>
                              prev.map((item) =>
                                item.id === r.id
                                  ? {
                                      ...item,
                                      status: 'ASSIGNED_SHIPPER',
                                      assignedShipperName: newShipper,
                                      isOverdue: false,
                                      timelineLogs: [{ step: 'Admin điều phối Shipper', timestamp: getNowFullVn(), note: `Chuyển tuyến cho Shipper ${newShipper}` }, ...item.timelineLogs]
                                    }
                                  : item
                              )
                            );
                            addAuditLog('Điều phối Shipper', r.requestCode, `Giao đơn ${r.requestCode} cho ${newShipper}.`);
                            triggerToast('success', 'Đã điều phối Shipper', `Đơn ${r.requestCode} giao cho ${newShipper}.`);
                          }}
                          className="px-2.5 py-1.5 rounded-lg border bg-white font-bold"
                        >
                          <option value="">-- Chọn Shipper --</option>
                          {uniqueShippers.map((sh) => (
                            <option key={sh} value={sh}>{sh}</option>
                          ))}
                        </select>
                      ) : (
                        <span className="font-bold">{r.assignedShipperName || '—'}</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full font-bold border ${RETURN_STATUS_META[r.status].badge}`}>
                        {RETURN_STATUS_META[r.status].label}
                      </span>
                      {r.isOverdue && <div className="text-[10px] font-bold text-rose-700 mt-1">⚠ Trễ SLA ({r.waitingHours}h)</div>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    // 5. Kho tổng & Nhập từ 3PL (/warehouse - Duyệt / Yêu cầu kiểm lại + Cấp nhanh cho Shop)
    if (currentRoute === '/warehouse') {
      const stockA = bags.filter((b) => b.status === 'AVAILABLE_AT_WAREHOUSE');
      return (
        <div className="space-y-5 text-xs">
          <div className="bg-white rounded-2xl p-5 border border-emerald-900/10 shadow-xs">
            <h1 className="text-lg font-bold text-[#0B1F17]">Kho tổng Returnpack & Kiểm soát Nhập kho từ 3PL</h1>
            <p className="text-[#3D554B]">Duyệt nhập kho hoặc trả phiếu yêu cầu 3PL kiểm đếm lại; xuất trực tiếp túi Loại A cho Shop khi cần gấp.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-white rounded-2xl p-5 border border-emerald-900/10 shadow-xs space-y-3">
              <h2 className="text-sm font-bold text-[#0B1F17]">Phiếu bàn giao từ Đối tác Vận chuyển & Vệ sinh 3PL</h2>
              {hubReceipts.map((rc) => (
                <div key={rc.id} className="p-4 rounded-xl bg-[#F7FBF8] border border-emerald-900/10 space-y-2">
                  <div className="flex justify-between font-bold">
                    <span className="font-mono text-[#155C3B]">{rc.receiptCode}</span>
                    <span>{rc.createdAt}</span>
                  </div>
                  <div>Túi sạch Loại A ({rc.gradeACodes.length}): <strong>{rc.gradeACodes.join(', ') || 'Không có'}</strong></div>
                  <div>Túi hỏng Loại C ({rc.gradeCCodes.length}): <strong>{rc.gradeCCodes.join(', ') || 'Không có'}</strong></div>
                  {rc.status === 'PENDING_ADMIN_CONFIRM' ? (
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => {
                          const nowFull = getNowFullVn();
                          setBags((prev) =>
                            prev.map((b) => {
                              if (rc.gradeACodes.includes(b.bagCode)) return { ...b, status: 'AVAILABLE_AT_WAREHOUSE', currentLocation: 'Kho tổng Thủ Đức - Kệ A1', updatedAt: nowFull };
                              if (rc.gradeCCodes.includes(b.bagCode)) return { ...b, status: 'HANDED_OVER_RECYCLE', currentLocation: 'Đã chuyển đối tác tái chế', updatedAt: nowFull };
                              return b;
                            })
                          );
                          setHubReceipts((prev) => prev.map((item) => (item.id === rc.id ? { ...item, status: 'CONFIRMED_INBOUND' } : item)));
                          addAuditLog('Duyệt nhập kho tổng từ 3PL', rc.receiptCode, `Nhập ${rc.gradeACodes.length} Loại A, tái chế ${rc.gradeCCodes.length} Loại C.`);
                          triggerToast('success', 'Đã xác nhận nhập kho tổng', `Phiếu ${rc.receiptCode} đã cập nhật tồn kho sẵn sàng.`);
                        }}
                        className="flex-1 py-2.5 rounded-xl bg-[#155C3B] text-white font-bold"
                      >
                        Xác nhận nhập Kho tổng
                      </button>
                      <button
                        onClick={() => {
                          setHubReceipts((prev) => prev.map((item) => (item.id === rc.id ? { ...item, status: 'REJECTED_RECOUNT', adminNote: 'Số lượng thực tế chưa khớp biên bản' } : item)));
                          addAuditLog('Trả phiếu 3PL kiểm đếm lại', rc.receiptCode, 'Admin yêu cầu đối chiếu lại số lượng.');
                          triggerToast('warning', 'Đã trả phiếu kiểm lại', `Yêu cầu 3PL kiểm đếm lại phiếu ${rc.receiptCode}.`);
                        }}
                        className="px-3.5 py-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 font-bold"
                      >
                        Yêu cầu kiểm lại
                      </button>
                    </div>
                  ) : (
                    <div className={`font-bold ${rc.status === 'CONFIRMED_INBOUND' ? 'text-[#155C3B]' : 'text-rose-700'}`}>
                      {rc.status === 'CONFIRMED_INBOUND' ? '✓ Đã đối chiếu & nhập kho thành công' : `✕ Đã trả về yêu cầu kiểm đếm lại (${rc.adminNote || ''})`}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="bg-white rounded-2xl p-5 border border-emerald-900/10 shadow-xs space-y-3">
              <h2 className="text-sm font-bold text-[#0B1F17]">Tồn kho túi sạch Loại A sẵn sàng cấp Shop ({stockA.length} túi)</h2>
              <div className="space-y-2">
                {stockA.map((b) => (
                  <div key={b.id} className="p-3 rounded-xl bg-[#E5F7ED]/60 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="font-mono font-bold text-[#155C3B]">{b.bagCode}</span> ({b.size}) • {b.cyclesUsed}/{b.maxCycles} vòng
                    </div>
                    <div className="flex gap-1.5">
                      {shops.filter((s) => s.status === 'ACTIVE').map((sh) => (
                        <button
                          key={sh.id}
                          onClick={() => {
                            setBags((prev) => prev.map((item) => (item.id === b.id ? { ...item, status: 'AT_SHOP', holdingShopId: sh.id, holdingShopName: sh.shopName, currentLocation: sh.shopName, updatedAt: getNowFullVn() } : item)));
                            setShops((prev) => prev.map((item) => (item.id === sh.id ? { ...item, currentBagsHeld: item.currentBagsHeld + 1 } : item)));
                            addAuditLog('Cấp nhanh túi từ Kho tổng', `${b.bagCode} → ${sh.shopName}`, 'Xuất kho trực tiếp.');
                            triggerToast('success', 'Đã cấp túi cho Shop', `Túi ${b.bagCode} đã chuyển về ${sh.shopName}.`);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-[#155C3B] text-white font-bold"
                        >
                          Cấp {sh.shopCode.replace('SH-', '')}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      );
    }

    // 6. Quản trị Green Rewards (/admin/rewards-config - Cấu hình + Kiểm duyệt Voucher Shop + Hoàn tác điểm lỗi)
    if (currentRoute === '/admin/rewards-config') {
      const filteredTx = rewardTransactions.filter((t) => adminRewardTxFilter === 'ALL' || t.txType === adminRewardTxFilter);
      return (
        <div className="space-y-5 text-xs">
          <div className="bg-white rounded-2xl p-5 border border-emerald-900/10 shadow-xs grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h1 className="text-lg font-bold text-[#0B1F17]">Cấu hình Quy tắc Điểm & Tự động phát QR Voucher</h1>
              <div className="flex items-center gap-3">
                <label className="font-bold">Điểm thưởng mỗi lần trả túi:</label>
                <input type="number" value={pointsPerReturn} onChange={(e) => setPointsPerReturn(Number(e.target.value) || 100)} className="w-24 px-3 py-2 rounded-xl border font-bold" />
                <span className="font-bold text-[#155C3B]">điểm / túi</span>
              </div>
              <div className="flex items-center gap-3">
                <label className="font-bold">Vòng đời tối đa mỗi túi:</label>
                <input type="number" value={maxAllowedCycles} onChange={(e) => setMaxAllowedCycles(Number(e.target.value) || 15)} className="w-24 px-3 py-2 rounded-xl border font-bold" />
                <span className="font-bold text-[#3D554B]">vòng (tự chuyển Loại C)</span>
              </div>
              <label className="inline-flex items-center gap-2 font-bold text-[#155C3B] cursor-pointer">
                <input type="checkbox" checked={autoIssueQrEnabled} onChange={(e) => setAutoIssueQrEnabled(e.target.checked)} />
                Bật chế độ tự động cấp mã QR Voucher khi khách đủ điểm
              </label>
            </div>

            <div className="space-y-2.5">
              <div className="font-bold text-sm text-[#0B1F17]">Kiểm duyệt Voucher của các Shop ({shopOffers.length})</div>
              {shopOffers.map((of) => (
                <div key={of.id} className="p-3 rounded-xl bg-[#F7FBF8] border flex items-center justify-between gap-2">
                  <div>
                    <div className="font-bold">{of.shopName} • <span className="text-[#155C3B]">{of.discountLabel}</span></div>
                    <div className="text-[#3D554B]">Mã: {of.promoCode} • {of.pointsRequired} điểm • Còn {of.stockRemaining}</div>
                  </div>
                  <button
                    onClick={() => {
                      setShopOffers((prev) => prev.map((item) => (item.id === of.id ? { ...item, isActive: !item.isActive } : item)));
                      addAuditLog('Admin kiểm duyệt Voucher Shop', of.promoCode, `${of.isActive ? 'Tạm dừng' : 'Kích hoạt'} voucher của ${of.shopName}.`);
                    }}
                    className={`px-2.5 py-1 rounded-lg font-bold ${of.isActive ? 'bg-[#E5F7ED] text-[#155C3B]' : 'bg-rose-100 text-rose-800'}`}
                  >
                    {of.isActive ? 'Đang hiển thị' : 'Đã tạm khóa'}
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-emerald-900/10 shadow-xs space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-bold text-[#0B1F17]">Sổ cái Giao dịch điểm & Hoàn tác điểm lỗi (Rollback)</h2>
              <select value={adminRewardTxFilter} onChange={(e) => setAdminRewardTxFilter(e.target.value)} className="px-3 py-1.5 rounded-xl border bg-white font-bold">
                <option value="ALL">Tất cả giao dịch ({rewardTransactions.length})</option>
                <option value="EARN_RETURN">Cộng điểm trả túi</option>
                <option value="REDEEM_OFFER">Đổi QR Voucher</option>
                <option value="REVERSAL">Giao dịch hoàn tác</option>
              </select>
            </div>
            <div className="divide-y">
              {filteredTx.map((tx) => (
                <div key={tx.id} className="py-3 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="font-mono font-bold text-[#155C3B]">{tx.txCode}</span> • <strong>{tx.customerName}</strong> — {tx.description}
                    <div className="text-[#3D554B]">{tx.createdAt}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`font-extrabold ${tx.pointsDelta > 0 ? 'text-[#155C3B]' : 'text-rose-700'}`}>
                      {tx.pointsDelta > 0 ? `+${tx.pointsDelta}` : tx.pointsDelta} điểm
                    </span>
                    {tx.txType === 'EARN_RETURN' && !tx.isReversed && (
                      <button
                        onClick={() => {
                          setCustomerRewardPoints((p) => Math.max(0, p - tx.pointsDelta));
                          setRewardTransactions((prev) => [
                            { id: `RTX-${Date.now()}`, txCode: `REV-${Date.now().toString().slice(-3)}`, customerName: tx.customerName, bagCode: tx.bagCode, usageCycleKey: `${tx.usageCycleKey}-REV`, txType: 'REVERSAL', pointsDelta: -tx.pointsDelta, description: `Hoàn tác giao dịch lỗi ${tx.txCode}`, createdAt: getNowFullVn() },
                            ...prev.map((item) => (item.id === tx.id ? { ...item, isReversed: true } : item))
                          ]);
                          addAuditLog('Hoàn tác điểm Rewards', tx.txCode, `Thu hồi ${tx.pointsDelta} điểm lỗi từ ${tx.customerName}`);
                          triggerToast('warning', 'Đã hoàn tác điểm', `Đã thu hồi ${tx.pointsDelta} điểm từ giao dịch ${tx.txCode}.`);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 font-bold"
                      >
                        Hoàn tác điểm lỗi
                      </button>
                    )}
                    {tx.isReversed && <span className="text-gray-400 font-bold">Đã hoàn tác</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    // 7. Tài khoản (Users), RBAC, Báo cáo & Nhật ký kiểm toán (/admin/users-reports)
    const filteredUsers = systemUsers.filter((u) => adminUserRoleFilter === 'ALL' || u.role === adminUserRoleFilter);
    const filteredAudits = auditLogs.filter(
      (l) => l.action.toLowerCase().includes(adminAuditSearch.toLowerCase()) || l.detail.toLowerCase().includes(adminAuditSearch.toLowerCase()) || l.actor.toLowerCase().includes(adminAuditSearch.toLowerCase())
    );

    return (
      <div className="space-y-5 text-xs">
        <div className="bg-white rounded-2xl p-5 border border-emerald-900/10 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h1 className="text-lg font-bold text-[#0B1F17]">Quản trị Tài khoản (Users) & Phân quyền RBAC chặt chẽ</h1>
              <p className="text-[#3D554B]">Khách hàng/Shop/3PL có thể tự đăng ký ở cổng Đăng nhập; Admin có toàn quyền cấp mới, đổi vai trò, khóa hoặc xóa tài khoản.</p>
            </div>
            <select value={adminUserRoleFilter} onChange={(e) => setAdminUserRoleFilter(e.target.value)} className="px-3 py-2 rounded-xl border bg-white font-bold">
              <option value="ALL">Tất cả vai trò ({systemUsers.length})</option>
              <option value="CUSTOMER">Khách hàng (CUSTOMER)</option>
              <option value="SHOP">Shop Đối tác (SHOP)</option>
              <option value="PARTNER">Vận chuyển 3PL (PARTNER)</option>
              <option value="ADMIN">Quản trị viên (ADMIN)</option>
            </select>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!newUserName.trim() || !newUserEmail.trim()) return;
              if (systemUsers.some((u) => u.email.toLowerCase() === newUserEmail.trim().toLowerCase())) {
                triggerToast('error', 'Email đã tồn tại', 'Vui lòng sử dụng email khác.');
                return;
              }
              const created: SystemUserAccount = {
                id: `U-${Date.now()}`,
                fullName: newUserName.trim(),
                email: newUserEmail.trim().toLowerCase(),
                phone: newUserPhone.trim() || '0900000000',
                role: newUserRole,
                orgLabel: newUserRole === 'SHOP' ? 'Shop Đối tác mới' : newUserRole === 'PARTNER' ? 'Trạm 3PL' : newUserRole === 'CUSTOMER' ? 'Khách hàng Thành viên' : 'RETURNPACK HQ',
                status: 'ACTIVE',
                createdAt: formatDateIsoToVn(new Date().toISOString().slice(0, 10))
              };
              setSystemUsers((prev) => [created, ...prev]);
              setNewUserName('');
              setNewUserEmail('');
              setNewUserPhone('');
              addAuditLog('Admin tạo User mới', created.email, `Cấp quyền ${created.role}.`);
              triggerToast('success', 'Đã thêm tài khoản', `Tài khoản ${created.email} (${created.role}) đã sẵn sàng đăng nhập.`);
            }}
            className="grid grid-cols-1 sm:grid-cols-5 gap-2.5 bg-[#F7FBF8] p-4 rounded-2xl"
          >
            <input type="text" placeholder="Họ tên / Tên đơn vị" value={newUserName} onChange={(e) => setNewUserName(e.target.value)} className="px-3 py-2 rounded-xl border bg-white" />
            <input type="email" placeholder="Email đăng nhập" value={newUserEmail} onChange={(e) => setNewUserEmail(e.target.value)} className="px-3 py-2 rounded-xl border bg-white" />
            <input type="text" placeholder="Số điện thoại" value={newUserPhone} onChange={(e) => setNewUserPhone(e.target.value)} className="px-3 py-2 rounded-xl border bg-white" />
            <select value={newUserRole} onChange={(e) => setNewUserRole(e.target.value as StakeholderRole)} className="px-3 py-2 rounded-xl border bg-white font-bold">
              <option value="SHOP">SHOP (Đối tác)</option>
              <option value="PARTNER">PARTNER (3PL)</option>
              <option value="CUSTOMER">CUSTOMER (Khách)</option>
              <option value="ADMIN">ADMIN (Quản trị)</option>
            </select>
            <button type="submit" className="py-2 rounded-xl bg-[#155C3B] text-white font-bold">+ Thêm User</button>
          </form>

          <div className="divide-y">
            {filteredUsers.map((u) => (
              <div key={u.id} className="py-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="font-bold text-[#0B1F17]">{u.fullName} • <span className="text-[#3D554B]">{u.email}</span></div>
                  <div className="text-[#3D554B]">Đơn vị: {u.orgLabel} • SĐT: {u.phone || '—'} • Ngày tạo: {u.createdAt}</div>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={u.role}
                    onChange={(e) => {
                      const nextRole = e.target.value as StakeholderRole;
                      setSystemUsers((prev) => prev.map((item) => (item.id === u.id ? { ...item, role: nextRole } : item)));
                      addAuditLog('Đổi vai trò User', u.email, `${u.role} → ${nextRole}`);
                    }}
                    className="px-2 py-1 rounded-lg bg-[#E5F7ED] text-[#155C3B] font-bold border border-[#48B86C]/30"
                  >
                    <option value="CUSTOMER">CUSTOMER</option>
                    <option value="SHOP">SHOP</option>
                    <option value="PARTNER">PARTNER</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                  <button
                    onClick={() => {
                      const nextStatus = u.status === 'ACTIVE' ? 'LOCKED' : 'ACTIVE';
                      setSystemUsers((prev) => prev.map((item) => (item.id === u.id ? { ...item, status: nextStatus } : item)));
                      addAuditLog(nextStatus === 'LOCKED' ? 'Khóa tài khoản User' : 'Mở khóa User', u.email, `Trạng thái: ${nextStatus}`);
                    }}
                    className={`px-2.5 py-1 rounded-lg font-bold ${u.status === 'ACTIVE' ? 'bg-amber-50 text-amber-900 border border-amber-200' : 'bg-rose-100 text-rose-800'}`}
                  >
                    {u.status === 'ACTIVE' ? 'Khóa' : 'Mở khóa'}
                  </button>
                  {u.id !== loggedInUserId && (
                    <button
                      onClick={() => {
                        setSystemUsers((prev) => prev.filter((item) => item.id !== u.id));
                        addAuditLog('Xóa tài khoản User', u.email, 'Đã gỡ bỏ khỏi hệ thống.');
                        triggerToast('warning', 'Đã xóa tài khoản', u.email);
                      }}
                      className="p-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100"
                      title="Xóa tài khoản"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-emerald-900/10 shadow-xs space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-bold text-[#0B1F17]">Nhật ký kiểm toán hệ thống (Audit Logs - {filteredAudits.length})</h2>
            <input
              type="text"
              value={adminAuditSearch}
              onChange={(e) => setAdminAuditSearch(e.target.value)}
              placeholder="Lọc nhật ký theo hành động / người thực hiện..."
              className="px-3 py-1.5 rounded-xl border w-64"
            />
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {filteredAudits.map((l) => (
              <div key={l.id} className="p-3 rounded-xl bg-[#F7FBF8] flex justify-between gap-2">
                <div><strong>{l.action}</strong> ({l.actor}) • {l.entity} — <span className="text-[#3D554B]">{l.detail}</span></div>
                <span className="font-mono text-[#3D554B] shrink-0">{l.timestamp}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // ==========================================================================
  // 9B. AUTHENTICATION & SESSION PERSISTENCE LOGIC
  // ==========================================================================
  const SESSION_STORAGE_KEY = 'returnpack_auth_session_v6';

  useEffect(() => {
    try {
      const savedSession = localStorage.getItem(SESSION_STORAGE_KEY);
      if (savedSession) {
        const parsed = JSON.parse(savedSession);
        if (parsed && parsed.isAuthenticated && parsed.role) {
          setIsAuthenticated(true);
          setActiveRole(parsed.role);
          setLoggedInUserId(parsed.userId || '');
          setLoggedInUserName(parsed.userName || 'Người dùng');
          if (parsed.shopId) setActiveShopId(parsed.shopId);
          if (parsed.route) setCurrentRoute(parsed.route);
        }
      }
    } catch {
      // Ignore storage error
    }
  }, []);

  const persistSession = (payload: {
    isAuthenticated: boolean;
    role: StakeholderRole;
    userId: string;
    userName: string;
    shopId?: string;
    route: string;
  }) => {
    try {
      if (payload.isAuthenticated) {
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(payload));
      } else {
        localStorage.removeItem(SESSION_STORAGE_KEY);
      }
    } catch {
      // Ignore storage error
    }
  };

  const handleSelectAuthTab = (role: StakeholderRole) => {
    setAuthTab(role);
    setLoginError(null);
    if (role === 'ADMIN') setIsRegisterMode(false);
    if (role === 'ADMIN') {
      setLoginEmail('admin@returnpack.id.vn');
    } else if (role === 'SHOP') {
      setLoginEmail('shop@greenstyle.vn');
    } else if (role === 'PARTNER') {
      setLoginEmail('hub@vanchuyen3pl.vn');
    } else {
      setLoginEmail('kien.hoang@gmail.com');
    }
  };

  const handleLoginOrRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    const cleanEmail = loginEmail.trim().toLowerCase();

    if (!cleanEmail || !loginPassword.trim()) {
      setLoginError('Vui lòng nhập đầy đủ Email/Tài khoản và Mật khẩu.');
      return;
    }

    if (loginPassword.trim().length < 4) {
      setLoginError('Mật khẩu phải có tối thiểu 4 ký tự.');
      return;
    }

    // SELF-REGISTRATION FLOW (CUSTOMER, SHOP, PARTNER)
    if (isRegisterMode) {
      if (systemUsers.some((u) => u.email.toLowerCase() === cleanEmail)) {
        setLoginError('Email này đã tồn tại trên hệ thống. Vui lòng chuyển sang Đăng nhập.');
        return;
      }
      const todayVn = formatDateIsoToVn(new Date().toISOString().slice(0, 10));

      if (authTab === 'SHOP') {
        if (!regShopName.trim() || !regShopOwner.trim() || !regPhone.trim()) {
          setLoginError('Vui lòng nhập đầy đủ Tên Shop, Chủ Shop và Số điện thoại.');
          return;
        }
        const newShopId = `SHOP-${Date.now()}`;
        const createdShop: ShopRecord = {
          id: newShopId,
          shopCode: `SH-${regShopName.slice(0, 6).toUpperCase().replace(/[^A-Z0-9]/g, '') || 'NEW'}`,
          shopName: regShopName.trim(),
          ownerName: regShopOwner.trim(),
          phone: regPhone.trim(),
          email: cleanEmail,
          address: regShopDistrict,
          district: regShopDistrict,
          planId: 'PLAN_BASIC',
          planName: 'Gói Cơ bản',
          monthlyQuotaTurns: 500,
          usedTurns: 0,
          concurrentBagLimit: 150,
          currentBagsHeld: 0,
          packedOrdersCount: 0,
          outstandingDebtVnd: 0,
          subscriptionEnd: '31/12/2026',
          status: 'ACTIVE'
        };
        const newUserId = `U-${Date.now()}`;
        setShops((prev) => [...prev, createdShop]);
        setSystemUsers((prev) => [
          { id: newUserId, fullName: createdShop.ownerName, email: cleanEmail, phone: regPhone.trim(), role: 'SHOP', orgLabel: createdShop.shopName, status: 'ACTIVE', createdAt: todayVn },
          ...prev
        ]);
        setActiveShopId(newShopId);
        setActiveRole('SHOP');
        setLoggedInUserId(newUserId);
        setLoggedInUserName(createdShop.shopName);
        setCurrentRoute('/shop/dashboard');
        setIsRegisterMode(false);
        setIsAuthenticated(true);
        persistSession({ isAuthenticated: true, role: 'SHOP', userId: newUserId, userName: createdShop.shopName, shopId: newShopId, route: '/shop/dashboard' });
        addAuditLog('Shop tự đăng ký tài khoản', createdShop.shopName, `Email: ${cleanEmail}`);
        triggerToast('success', 'Đăng ký Shop thành công', `Chào mừng ${createdShop.shopName} đến với RETURNPACK!`);
        return;
      }

      if (authTab === 'PARTNER') {
        if (!regPartnerHubName.trim() || !regPhone.trim()) {
          setLoginError('Vui lòng nhập Tên đơn vị/Trạm vận chuyển và Số điện thoại.');
          return;
        }
        const newUserId = `U-${Date.now()}`;
        setSystemUsers((prev) => [
          { id: newUserId, fullName: regPartnerHubName.trim(), email: cleanEmail, phone: regPhone.trim(), role: 'PARTNER', orgLabel: regPartnerHubName.trim(), status: 'ACTIVE', createdAt: todayVn },
          ...prev
        ]);
        setActiveRole('PARTNER');
        setLoggedInUserId(newUserId);
        setLoggedInUserName(regPartnerHubName.trim());
        setCurrentRoute('/partner/routes');
        setIsRegisterMode(false);
        setIsAuthenticated(true);
        persistSession({ isAuthenticated: true, role: 'PARTNER', userId: newUserId, userName: regPartnerHubName.trim(), route: '/partner/routes' });
        addAuditLog('Đối tác 3PL tự đăng ký', regPartnerHubName.trim(), `Email: ${cleanEmail}`);
        triggerToast('success', 'Đăng ký đối tác thành công', `Đã kích hoạt trạm ${regPartnerHubName.trim()}.`);
        return;
      }

      if (authTab === 'CUSTOMER') {
        if (!regFullName.trim() || !regPhone.trim()) {
          setLoginError('Vui lòng nhập Họ tên và Số điện thoại.');
          return;
        }
        const newUserId = `U-${Date.now()}`;
        setSystemUsers((prev) => [
          { id: newUserId, fullName: regFullName.trim(), email: cleanEmail, phone: regPhone.trim(), role: 'CUSTOMER', orgLabel: 'Khách hàng Thành viên', status: 'ACTIVE', createdAt: todayVn },
          ...prev
        ]);
        setCustProfileName(regFullName.trim());
        setCustProfilePhone(regPhone.trim());
        setActiveRole('CUSTOMER');
        setLoggedInUserId(newUserId);
        setLoggedInUserName(regFullName.trim());
        setCurrentRoute(`/return/${returnPortalToken}`);
        setIsRegisterMode(false);
        setIsAuthenticated(true);
        persistSession({ isAuthenticated: true, role: 'CUSTOMER', userId: newUserId, userName: regFullName.trim(), route: `/return/${returnPortalToken}` });
        addAuditLog('Khách hàng tự đăng ký', regFullName.trim(), `Email: ${cleanEmail}`);
        triggerToast('success', 'Đăng ký thành công', `Chào mừng ${regFullName.trim()} tham gia RETURNPACK!`);
        return;
      }
    }

    // LOGIN FLOW WITH RBAC & LOCK VALIDATION
    const matchedUser = systemUsers.find((u) => u.email.toLowerCase() === cleanEmail);
    if (!matchedUser) {
      setLoginError(`Không tìm thấy tài khoản "${loginEmail}". Bạn có thể bấm "+ Đăng ký tài khoản" ở trên.`);
      return;
    }
    if (matchedUser.role !== authTab) {
      const roleNames: Record<StakeholderRole, string> = {
        ADMIN: 'Quản trị viên (ADMIN)',
        SHOP: 'Shop Đối tác (SHOP)',
        PARTNER: 'Vận chuyển & Vệ sinh (PARTNER)',
        CUSTOMER: 'Khách hàng (CUSTOMER)'
      };
      setLoginError(`Tài khoản này thuộc vai trò ${roleNames[matchedUser.role]}. Vui lòng chọn đúng tab vai trò ở trên.`);
      return;
    }
    if (matchedUser.status === 'LOCKED') {
      setLoginError('Tài khoản của bạn đã bị Quản trị viên tạm khóa. Vui lòng liên hệ bộ phận hỗ trợ.');
      return;
    }

    let resolvedShopId = activeShopId;
    let displayName = matchedUser.fullName;
    let initialRoute = '/admin/dashboard';

    if (matchedUser.role === 'SHOP') {
      const matchedShop = shops.find(
        (s) => s.email.toLowerCase() === cleanEmail || s.shopName.toLowerCase() === matchedUser.orgLabel.toLowerCase()
      ) || shops[0];
      if (matchedShop.status === 'LOCKED') {
        setLoginError(`Gian hàng ${matchedShop.shopName} hiện đang bị khóa hoạt động.`);
        return;
      }
      resolvedShopId = matchedShop.id;
      setActiveShopId(matchedShop.id);
      displayName = matchedShop.shopName;
      initialRoute = '/shop/dashboard';
    } else if (matchedUser.role === 'PARTNER') {
      displayName = matchedUser.orgLabel || matchedUser.fullName;
      initialRoute = '/partner/routes';
    } else if (matchedUser.role === 'CUSTOMER') {
      setCustProfileName(matchedUser.fullName);
      if (matchedUser.phone) setCustProfilePhone(matchedUser.phone);
      displayName = matchedUser.fullName;
      initialRoute = `/return/${returnPortalToken}`;
    }

    setActiveRole(matchedUser.role);
    setLoggedInUserId(matchedUser.id);
    setLoggedInUserName(displayName);
    setCurrentRoute(initialRoute);
    setIsAuthenticated(true);
    persistSession({
      isAuthenticated: true,
      role: matchedUser.role,
      userId: matchedUser.id,
      userName: displayName,
      shopId: resolvedShopId,
      route: initialRoute
    });
    addAuditLog('Đăng nhập hệ thống', matchedUser.email, `Truy cập cổng ${matchedUser.role}.`);
    triggerToast('success', 'Đăng nhập thành công', `Xin chào ${displayName}!`);
  };

  const handleLogout = () => {
    addAuditLog('Đăng xuất hệ thống', loggedInUserName, `Rời khỏi phiên làm việc ${activeRole}.`);
    setIsAuthenticated(false);
    setLoginError(null);
    persistSession({ isAuthenticated: false, role: activeRole, userId: '', userName: '', route: '/' });
    triggerToast('info', 'Đã đăng xuất', 'Phiên làm việc của bạn đã được đóng an toàn.');
  };

  // ==========================================================================
  // 9C. LOGIN & SELF-REGISTRATION SCREEN
  // ==========================================================================
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#F4F7F5] flex items-center justify-center p-4 md:p-8 font-sans">
        <div className="max-w-5xl w-full bg-white rounded-2xl shadow-[0_24px_60px_-15px_rgba(15,61,40,0.18)] border border-[#17382B]/10 overflow-hidden grid grid-cols-1 md:grid-cols-2">
          <div className="relative overflow-hidden bg-gradient-to-br from-[#0D3523] via-[#155C3B] to-[#1D734B] p-8 md:p-10 text-white flex flex-col justify-between">
            <div className="pointer-events-none absolute -top-20 -right-20 w-64 h-64 rounded-full bg-[#A9E65A]/15 blur-3xl" />
            <div>
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-white text-[#155C3B] flex items-center justify-center font-extrabold text-xl shadow">
                  R
                </div>
                <div>
                  <div className="font-extrabold text-xl tracking-tight">RETURNPACK</div>
                  <div className="text-xs text-[#B8EF8B]">Giao hàng xanh – Bao bì tuần hoàn</div>
                </div>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight mt-8 leading-snug">
                Hệ thống Quản trị Vòng đời Bao bì Tuần hoàn
              </h1>
              <p className="text-sm text-[#E5F7ED] mt-2">
                Đăng nhập đúng cổng vai trò hoặc tự đăng ký tài khoản Khách hàng / Shop / Đối tác Vận chuyển mới chỉ trong 30 giây.
              </p>
            </div>

            <div className="relative z-10 my-6 flex items-center justify-center">
              <div className="p-5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 shadow-inner">
                <EarthMascot3D pose="wave" size={112} />
              </div>
            </div>

            <div className="text-xs text-[#E5F7ED]/90 flex items-center justify-between border-t border-white/15 pt-4">
              <span>app.returnpack.id.vn</span>
              <span>© 2026 RETURNPACK</span>
            </div>
          </div>

          <div className="p-8 flex flex-col justify-center space-y-5">
            {/* Prominent Mode Toggle: Đăng nhập | Đăng ký mới */}
            <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-[#F4F7F5] border border-emerald-900/10 text-xs font-bold">
              <button
                type="button"
                onClick={() => { setIsRegisterMode(false); setLoginError(null); }}
                className={`py-2 rounded-lg transition ${!isRegisterMode ? 'bg-[#155C3B] text-white shadow' : 'text-[#3D554B]'}`}
              >
                Đăng nhập hệ thống
              </button>
              <button
                type="button"
                onClick={() => {
                  if (authTab === 'ADMIN') handleSelectAuthTab('CUSTOMER');
                  setIsRegisterMode(true);
                  setLoginError(null);
                }}
                className={`py-2 rounded-lg transition ${isRegisterMode ? 'bg-[#155C3B] text-white shadow' : 'text-[#3D554B]'}`}
              >
                + Tự đăng ký tài khoản
              </button>
            </div>

            {/* 4 Role Tabs */}
            <div className="grid grid-cols-4 gap-1.5 p-1.5 rounded-2xl bg-[#F7FBF8] border border-emerald-900/10">
              {([
                { id: 'CUSTOMER', label: 'Khách hàng', icon: QrCode },
                { id: 'SHOP', label: 'Shop Đối tác', icon: Store },
                { id: 'PARTNER', label: 'Vận chuyển', icon: Truck },
                { id: 'ADMIN', label: 'Admin', icon: ShieldCheck }
              ] as const).map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => handleSelectAuthTab(tab.id)}
                    className={`py-2.5 px-1.5 rounded-xl text-[11px] font-bold transition flex flex-col items-center gap-1 ${
                      authTab === tab.id ? 'bg-[#155C3B] text-white shadow' : 'text-[#3D554B] hover:text-[#0B1F17]'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <form onSubmit={handleLoginOrRegisterSubmit} className="space-y-3.5">
              {isRegisterMode && authTab === 'CUSTOMER' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <input type="text" placeholder="Họ và tên khách hàng" value={regFullName} onChange={(e) => setRegFullName(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border border-emerald-900/20 text-xs" />
                  <input type="text" placeholder="Số điện thoại" value={regPhone} onChange={(e) => setRegPhone(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border border-emerald-900/20 text-xs" />
                </div>
              )}

              {isRegisterMode && authTab === 'PARTNER' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <input type="text" placeholder="Tên đơn vị / Trạm vận chuyển" value={regPartnerHubName} onChange={(e) => setRegPartnerHubName(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border border-emerald-900/20 text-xs" />
                  <input type="text" placeholder="Số điện thoại liên hệ" value={regPhone} onChange={(e) => setRegPhone(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border border-emerald-900/20 text-xs" />
                </div>
              )}

              {isRegisterMode && authTab === 'SHOP' && (
                <div className="space-y-2.5">
                  <input type="text" placeholder="Tên Shop (VD: Bloom Eco Store)" value={regShopName} onChange={(e) => setRegShopName(e.target.value)} className="w-full px-3.5 py-2 rounded-xl border border-emerald-900/20 text-xs" />
                  <div className="grid grid-cols-2 gap-2">
                    <input type="text" placeholder="Họ tên chủ shop" value={regShopOwner} onChange={(e) => setRegShopOwner(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-emerald-900/20 text-xs" />
                    <input type="text" placeholder="Số điện thoại" value={regPhone} onChange={(e) => setRegPhone(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-emerald-900/20 text-xs" />
                  </div>
                  <select value={regShopDistrict} onChange={(e) => setRegShopDistrict(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-emerald-900/20 text-xs bg-white">
                    <option value="Quận 1">Quận 1, TP.HCM</option>
                    <option value="Quận Bình Thạnh">Quận Bình Thạnh, TP.HCM</option>
                    <option value="Quận 3">Quận 3, TP.HCM</option>
                    <option value="Quận 7">Quận 7, TP.HCM</option>
                    <option value="TP. Thủ Đức">TP. Thủ Đức, TP.HCM</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-[#0B1F17] mb-1">Email đăng nhập</label>
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="name@domain.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-emerald-900/20 text-sm focus:outline-none focus:ring-2 focus:ring-[#48B86C]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0B1F17] mb-1">Mật khẩu</label>
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-emerald-900/20 text-sm focus:outline-none focus:ring-2 focus:ring-[#48B86C]"
                />
              </div>

              {loginError && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-700">
                  {loginError}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3.5 rounded-2xl bg-[#155C3B] text-white font-extrabold text-sm shadow-lg hover:bg-[#10462C] transition flex items-center justify-center gap-2"
              >
                {isRegisterMode ? 'Hoàn tất đăng ký & Vào hệ thống' : `Đăng nhập cổng ${authTab === 'CUSTOMER' ? 'Khách hàng' : authTab === 'SHOP' ? 'Shop Đối tác' : authTab === 'PARTNER' ? 'Vận chuyển 3PL' : 'Quản trị'}`}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

          
          </div>
        </div>
      </div>
    );
  }

  // ==========================================================================
  // 10. MAIN LAYOUT SHELL (NO DEMO SWITCHER, CLEAN LOGOUT BUTTON)
  // ==========================================================================
  const renderMainContent = () => {
    if (activeRole === 'CUSTOMER') {
      if (currentRoute.startsWith('/track/')) return renderCustomerTrack();
      if (currentRoute === '/customer/history-profile') return renderCustomerHistoryAndProfile();
      if (currentRoute === '/rewards') return renderCustomerRewards();
      return renderCustomerReturnPortal();
    }
    if (activeRole === 'SHOP') return renderShopViews();
    if (activeRole === 'PARTNER') return renderPartnerViews();
    return renderAdminViews();
  };

  const roleTitle =
    activeRole === 'CUSTOMER' ? 'Khách hàng' : activeRole === 'SHOP' ? 'Shop Đối tác' : activeRole === 'PARTNER' ? 'Vận chuyển & Vệ sinh 3PL' : 'Quản trị Returnpack';

  return (
    <div className="min-h-screen bg-[#F4F7F5] text-[#0B1F17] flex flex-col lg:flex-row font-sans antialiased">
      <aside className={`bg-[#0B2418] text-white p-4 flex flex-col justify-between shrink-0 transition-all ${sidebarCollapsed ? 'lg:w-20' : 'lg:w-68'}`}>
        <div className="space-y-6">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#D4AF37] to-[#B89020] text-[#0B1F17] flex items-center justify-center font-extrabold">
                R
              </div>
              {!sidebarCollapsed && (
                <div>
                  <div className="font-extrabold text-sm tracking-wider">RETURNPACK</div>
                  <div className="text-[11px] text-[#A9E65A]">{roleTitle}</div>
                </div>
              )}
            </div>
            <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="hidden lg:inline-flex p-1.5 rounded-lg hover:bg-white/10">
              {sidebarCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
            </button>
          </div>

          <nav className="space-y-1">
            {activeNav.map((item) => {
              const Icon = item.icon;
              const isActive = currentRoute === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => setCurrentRoute(item.path)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                    isActive ? 'bg-[#155C3B] text-white border-l-4 border-[#D4AF37]' : 'text-[#D1E7DD]/80 hover:bg-white/10'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0 text-[#D4AF37]" />
                  {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="pt-4 border-t border-white/10">
          <button
            onClick={handleLogout}
            title="Đăng xuất khỏi hệ thống"
            className="w-full py-3 px-3.5 rounded-xl bg-rose-500/15 border border-rose-400/30 text-xs font-bold text-rose-200 hover:text-white hover:bg-rose-600 hover:border-rose-500 transition flex items-center justify-center gap-2 shadow-xs"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!sidebarCollapsed && <span>Đăng xuất</span>}
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-emerald-900/10 px-6 py-3.5 flex items-center justify-between">
          <div className="text-sm font-bold text-[#0B1F17]">
            {activeNav.find((n) => n.path === currentRoute)?.label || 'RETURNPACK RMS'}
          </div>
          <div className="flex items-center gap-2.5 text-xs">
            <span className="px-3 py-1 rounded-full bg-[#E5F7ED] text-[#155C3B] font-bold">{loggedInUserName}</span>
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-800 font-bold hover:bg-rose-100 inline-flex items-center gap-1.5 transition"
            >
              <LogOut className="w-3.5 h-3.5" /> Đăng xuất
            </button>
          </div>
        </header>

        {toast && (
          <div className="mx-6 mt-4 p-3.5 rounded-2xl bg-white border border-[#2DAF73] shadow-md flex items-center justify-between text-xs">
            <div>
              <strong className="text-[#155C3B]">{toast.title}:</strong> {toast.message}
            </div>
            <button onClick={() => setToast(null)}><X className="w-4 h-4" /></button>
          </div>
        )}

        <main className="p-6 flex-1">{renderMainContent()}</main>
      </div>

      {/* Modal Quét QR (Hỗ trợ tự động gửi QR Voucher khi khách đủ điểm!) */}
      {showQrScannerModal.open && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 text-center">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold">Quét mã QR trên túi</h3>
              <button onClick={() => setShowQrScannerModal({ ...showQrScannerModal, open: false })}><X className="w-5 h-5" /></button>
            </div>
            <div className="h-40 rounded-2xl bg-[#183A2A] flex items-center justify-center border-4 border-[#48B86C]">
              <QrCode className="w-16 h-16 text-white/40 animate-pulse" />
            </div>
            <div className="text-xs text-[#3D554B]">Chọn mã túi mô phỏng quét camera:</div>
            <div className="flex flex-wrap justify-center gap-2">
              {bags.slice(0, 6).map((b) => (
                <button
                  key={b.id}
                  onClick={() => {
                    if (showQrScannerModal.target === 'CUSTOMER') {
                      setReturnPortalToken(b.bagCode);
                    } else if (showQrScannerModal.target === 'SHOP') {
                      setScanBagCodeInput(b.bagCode);
                    } else if (showQrScannerModal.target === 'SHIPPER' && showQrScannerModal.reqCode) {
                      const req = returnRequests.find((r) => r.requestCode === showQrScannerModal.reqCode);
                      if (req && req.bagCode === b.bagCode) {
                        const nowFull = getNowFullVn();
                        const nextPoints = customerRewardPoints + pointsPerReturn;
                        setReturnRequests((prev) =>
                          prev.map((r) =>
                            r.requestCode === req.requestCode
                              ? {
                                  ...r,
                                  status: 'PICKED_UP',
                                  rewardGranted: true,
                                  scheduledWindow: `${r.scheduledDateDisplay} • Đã thu hồi lúc ${nowFull}`,
                                  timelineLogs: [{ step: 'Shipper quét QR thu hồi thành công', timestamp: nowFull, note: `Cộng +${pointsPerReturn} điểm Green Rewards cho khách` }, ...r.timelineLogs]
                                }
                              : r
                          )
                        );
                        setBags((prev) => prev.map((bg) => (bg.bagCode === b.bagCode ? { ...bg, status: 'PICKED_UP_BY_SHIPPER', currentLocation: 'Shipper đang giữ', updatedAt: nowFull } : bg)));
                        setCustomerRewardPoints(nextPoints);
                        setCustomerTotalEarned((p) => p + pointsPerReturn);
                        setCustomerSuccessfulReturns((c) => c + 1);
                        setRewardTransactions((prev) => [
                          { id: `RTX-${Date.now()}`, txCode: `GR-${Date.now().toString().slice(-3)}`, customerName: req.customerName, bagCode: b.bagCode, usageCycleKey: req.usageCycleKey, txType: 'EARN_RETURN', pointsDelta: pointsPerReturn, description: `Shipper quét nhận túi ${b.bagCode}`, createdAt: nowFull },
                          ...prev
                        ]);

                        // Auto-issue QR Voucher if enabled & points reach threshold
                        const eligibleOffer = autoIssueQrEnabled
                          ? shopOffers.find((of) => of.isActive && of.stockRemaining > 0 && nextPoints >= of.pointsRequired)
                          : null;
                        if (eligibleOffer) {
                          const autoVoucher = issueQrVoucherForOffer(eligibleOffer, true, nextPoints);
                          if (autoVoucher) {
                            triggerToast('success', 'Thu hồi & Tự động gửi QR Voucher', `Đã nhận túi ${b.bagCode} (+${pointsPerReturn} điểm) và tự động gửi QR ưu đãi ${autoVoucher.discountLabel} (${autoVoucher.code}) cho khách!`);
                          }
                        } else {
                          triggerToast('success', 'Thu hồi QR thành công', `Đã nhận túi ${b.bagCode} và cộng +${pointsPerReturn} điểm cho khách.`);
                        }
                      } else {
                        triggerToast('error', 'Sai mã túi', `Cần quét đúng mã ${req?.bagCode}.`);
                      }
                    }
                    setShowQrScannerModal({ ...showQrScannerModal, open: false });
                  }}
                  className="px-3 py-1.5 rounded-xl bg-[#E5F7ED] text-[#155C3B] text-xs font-mono font-bold"
                >
                  {b.bagCode}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal Hiển thị Mã QR Voucher tức thì */}
      {activeQrVoucherModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 text-center shadow-2xl">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1 text-xs font-bold text-[#155C3B]">
                <Sparkles className="w-4 h-4 text-[#D4AF37]" /> QR VOUCHER TỰ ĐỘNG
              </span>
              <button onClick={() => setActiveQrVoucherModal(null)}><X className="w-5 h-5" /></button>
            </div>
            <div className="p-4 rounded-2xl bg-[#F7FBF8] border border-[#48B86C]/40 flex flex-col items-center space-y-2.5">
              <div className="text-xs font-bold text-[#3D554B]">{activeQrVoucherModal.sponsor}</div>
              <div className="text-xl font-extrabold text-[#155C3B]">{activeQrVoucherModal.discountLabel}</div>
              <QrMatrixSvg value={activeQrVoucherModal.qrPayload} size={136} />
              <div className="font-mono font-extrabold text-sm text-[#0B1F17] bg-white px-3 py-1 rounded-lg border">{activeQrVoucherModal.code}</div>
              <div className="text-[11px] text-[#3D554B]">{activeQrVoucherModal.title}</div>
              <div className="text-[10px] text-[#3D554B]">Cấp lúc: {activeQrVoucherModal.redeemedAt} • HSD: {activeQrVoucherModal.expiresAt}</div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  navigator.clipboard?.writeText(activeQrVoucherModal.code);
                  triggerToast('info', 'Đã sao chép mã', activeQrVoucherModal.code);
                }}
                className="flex-1 py-2.5 rounded-xl bg-[#E5F7ED] text-[#155C3B] text-xs font-bold"
              >
                Sao chép mã
              </button>
              <button onClick={() => setActiveQrVoucherModal(null)} className="flex-1 py-2.5 rounded-xl bg-[#155C3B] text-white text-xs font-bold">
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Chi tiết Vòng đời Túi cho Admin */}
      {selectedBagDetailModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 text-xs shadow-2xl">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold font-mono text-[#155C3B]">Chi tiết túi {selectedBagDetailModal.bagCode}</h3>
              <button onClick={() => setSelectedBagDetailModal(null)}><X className="w-5 h-5" /></button>
            </div>
            <div className="flex items-center gap-4 bg-[#F7FBF8] p-3.5 rounded-xl">
              <QrMatrixSvg value={selectedBagDetailModal.bagCode} size={72} />
              <div className="space-y-1">
                <div><strong>Kích thước:</strong> {selectedBagDetailModal.size}</div>
                <div><strong>Lô sản xuất:</strong> {selectedBagDetailModal.batchCode}</div>
                <div><strong>Vòng đời:</strong> {selectedBagDetailModal.cyclesUsed}/{selectedBagDetailModal.maxCycles} • Loại {selectedBagDetailModal.qualityGrade}</div>
                <div><strong>Vị trí:</strong> {selectedBagDetailModal.currentLocation}</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  setBags((prev) => prev.map((b) => (b.id === selectedBagDetailModal.id ? { ...b, status: 'LOST', currentLocation: 'Đánh dấu thất lạc bởi Admin', updatedAt: getNowFullVn() } : b)));
                  addAuditLog('Đánh dấu túi thất lạc', selectedBagDetailModal.bagCode, 'Admin cập nhật trạng thái LOST.');
                  setSelectedBagDetailModal(null);
                  triggerToast('warning', 'Đã đánh dấu thất lạc', selectedBagDetailModal.bagCode);
                }}
                className="py-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 font-bold"
              >
                Đánh dấu thất lạc
              </button>
              <button
                onClick={() => {
                  setBags((prev) => prev.map((b) => (b.id === selectedBagDetailModal.id ? { ...b, status: 'RETIRED_WAITING_RECYCLE', qualityGrade: 'C', updatedAt: getNowFullVn() } : b)));
                  addAuditLog('Chuyển túi sang tái chế', selectedBagDetailModal.bagCode, 'Admin hạ cấp sang Loại C.');
                  setSelectedBagDetailModal(null);
                  triggerToast('info', 'Đã chuyển tái chế', selectedBagDetailModal.bagCode);
                }}
                className="py-2 rounded-xl bg-orange-50 border border-orange-200 text-orange-800 font-bold"
              >
                Chuyển tái chế (Loại C)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal In tem QR hàng loạt */}
      {showPrintQrModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold">In tem QR định danh túi hàng loạt</h3>
              <button onClick={() => setShowPrintQrModal(false)}><X className="w-5 h-5" /></button>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {bags.map((b) => (
                <div key={b.id} className="p-3 rounded-xl border border-dashed border-[#155C3B] flex flex-col items-center bg-[#F7FBF8]">
                  <QrMatrixSvg value={b.bagCode} size={54} />
                  <div className="font-mono font-extrabold text-xs text-[#155C3B] mt-1">{b.bagCode}</div>
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowPrintQrModal(false)} className="px-4 py-2 rounded-xl border text-xs font-bold">Đóng</button>
              <button onClick={() => window.print?.()} className="px-4 py-2 rounded-xl bg-[#155C3B] text-white text-xs font-bold inline-flex items-center gap-1">
                <Printer className="w-4 h-4" /> In ngay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
