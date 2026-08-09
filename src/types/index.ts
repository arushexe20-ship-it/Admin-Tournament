// src/types/index.ts
// All TypeScript types and interfaces

// ============================================
// USER TYPES
// ============================================

export type UserRole = 'player' | 'admin' | 'super_admin';
export type UserStatus = 'active' | 'inactive' | 'banned';

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: UserRole;
  status: UserStatus;
  profileImageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PlayerProfile {
  id: string;
  userId: string;
  gameName: string;
  gameUid: string;
  upiId: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// TOURNAMENT TYPES
// ============================================

export type TournamentStatus =
  | 'draft'
  | 'upcoming'
  | 'registration_open'
  | 'registration_closed'
  | 'live'
  | 'completed'
  | 'cancelled';

export interface Tournament {
  id: string;
  name: string;
  description?: string;
  organizer: string;
  date: string;
  startTime: string;
  timezone: string;
  startAt: string;
  registrationStartAt: string;
  registrationEndAt: string;
  roomReleaseAt: string;
  entryFee: number;
  prizeMoney: number;
  totalSlots: number;
  joinedSlots: number;
  availableSlots: number;
  gameMode: string;
  map: string;
  matchType: string;
  rules: string;
  rulesVersion: number;
  prizeDistribution: string;
  paymentInstructions: string;
  bannerUrl?: string;
  status: TournamentStatus;
  manualStatusOverride: boolean;
  roomId?: string;
  roomPassword?: string;
  roomReleased: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// TOURNAMENT PLAYER TYPES
// ============================================

export type VerificationStatus = 'pending' | 'verified' | 'rejected' | 'removed';
export type PaymentStatus = 'pending' | 'verified' | 'rejected' | 'refunded';

export interface TournamentPlayer {
  id: string;
  tournamentId: string;
  userId: string;
  joinId: string;
  slotNumber: number;
  gameName: string;
  gameUid: string;
  paymentStatus: PaymentStatus;
  verificationStatus: VerificationStatus;
  rulesAccepted: boolean;
  rulesVersionAccepted: number;
  joinedAt: string;
  reservationExpiresAt: string;
  removedAt?: string;
  removedBy?: string;
  removalReason?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// PAYMENT TYPES
// ============================================

export interface Payment {
  id: string;
  tournamentId: string;
  tournamentPlayerId: string;
  userId: string;
  amount: number;
  playerUpiId: string;
  utr: string;
  screenshotUrl?: string;
  submittedPaymentAt: string;
  status: PaymentStatus;
  verifiedBy?: string;
  verifiedAt?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// BAN TYPES
// ============================================

export type BanType = '24_hours' | '7_days' | '1_month' | 'permanent';

export interface Ban {
  id: string;
  userId: string;
  banType: BanType;
  reason: string;
  startedAt: string;
  expiresAt?: string;
  createdBy: string;
  status: 'active' | 'expired';
  createdAt: string;
}

// ============================================
// WINNER TYPES
// ============================================

export interface Winner {
  id: string;
  tournamentId: string;
  tournamentPlayerId: string;
  userId: string;
  position: number;
  prizeAmount: number;
  publishedAt?: string;
  publishedBy?: string;
  createdAt: string;
}

// ============================================
// PAYOUT TYPES
// ============================================

export type PayoutStatus =
  | 'awaiting_details'
  | 'details_submitted'
  | 'under_review'
  | 'paid'
  | 'rejected'
  | 'correction_required';

export interface Payout {
  id: string;
  tournamentId: string;
  winnerId: string;
  userId: string;
  upiId: string;
  qrCodeUrl: string;
  status: PayoutStatus;
  transactionReference?: string;
  submittedAt: string;
  paidAt?: string;
  processedBy?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// NOTIFICATION TYPES
// ============================================

export interface Notification {
  id: string;
  userId: string;
  tournamentId?: string;
  title: string;
  message: string;
  readStatus: boolean;
  notificationType: string;
  createdAt: string;
}

// ============================================
// PAYMENT SETTINGS TYPES
// ============================================

export interface PaymentSettings {
  id: string;
  upiId: string;
  qrCodeUrl?: string;
  paymentName: string;
  instructions: string;
  updatedBy: string;
  updatedAt: string;
}

// ============================================
// AUDIT LOG TYPES
// ============================================

export interface AuditLog {
  id: string;
  adminId: string;
  action: string;
  targetType: string;
  targetId: string;
  previousValue?: any;
  newValue?: any;
  timestamp: string;
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface ApiListResponse<T> {
  success: boolean;
  data: T[];
  error?: string;
  total?: number;
}

// ============================================
// FORM INPUT TYPES
// ============================================

export interface LoginFormInput {
  email: string;
  password: string;
}

export interface SignupFormInput {
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
}

export interface CreateTournamentInput {
  name: string;
  description: string;
  organizer: string;
  date: string;
  startTime: string;
  timezone: string;
  entryFee: number;
  prizeMoney: number;
  totalSlots: number;
  gameMode: string;
  map: string;
  matchType: string;
  rules: string;
  prizeDistribution: string;
  paymentInstructions: string;
  registrationStartTime: string;
  registrationEndTime: string;
  roomReleaseTime: string;
}

// ============================================
// STATE MANAGEMENT TYPES
// ============================================

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

export interface AppState {
  tournaments: Tournament[];
  selectedTournament: Tournament | null;
  myTournaments: TournamentPlayer[];
  notifications: Notification[];
  isLoading: boolean;
  error: string | null;
}

// ============================================
// RESPONSE HANDLER TYPES
// ============================================

export interface HandledApiResponse<T> {
  success: boolean;
  data: T | null;
  error: string | null;
}
