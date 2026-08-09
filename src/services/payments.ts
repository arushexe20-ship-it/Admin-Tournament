// src/services/payments.ts
// Handle payment operations

import { supabase } from './supabase';
import { formatErrorMessage } from './supabase';

// ============================================
// SUBMIT PAYMENT
// ============================================

export async function submitPayment(
  tournamentPlayerId: string,
  tournamentId: string,
  userId: string,
  amount: number,
  utrId: string,
  playerUpiId: string,
  screenshotUrl?: string
) {
  try {
    // Validate inputs
    if (!utrId || utrId.trim().length === 0) {
      return { success: false, error: 'UTR/Transaction ID is required' };
    }

    if (!playerUpiId || playerUpiId.trim().length === 0) {
      return { success: false, error: 'UPI ID is required' };
    }

    if (amount <= 0) {
      return { success: false, error: 'Amount must be greater than 0' };
    }

    // Check for duplicate UTR
    const { data: existingUtr } = await supabase
      .from('payments')
      .select('id')
      .eq('utr', utrId)
      .single();

    if (existingUtr) {
      return { success: false, error: 'This UTR/Transaction ID has already been used' };
    }

    // Create payment record
    const { data, error } = await supabase
      .from('payments')
      .insert([
        {
          tournament_id: tournamentId,
          tournament_player_id: tournamentPlayerId,
          user_id: userId,
          amount,
          utr: utrId,
          player_upi_id: playerUpiId,
          screenshot_url: screenshotUrl || null,
          submitted_payment_at: new Date().toISOString(),
          status: 'pending',
        },
      ])
      .select()
      .single();

    if (error) throw error;

    // Send notification
    await supabase.from('notifications').insert([
      {
        user_id: userId,
        tournament_id: tournamentId,
        title: 'Payment Submitted',
        message: 'Your payment has been submitted. Waiting for admin verification.',
        notification_type: 'payment_submitted',
      },
    ]);

    return { success: true, data };
  } catch (error: any) {
    return {
      success: false,
      error: formatErrorMessage(error),
      data: null,
    };
  }
}

// ============================================
// GET PAYMENTS FOR ADMIN VERIFICATION
// ============================================

export async function getPaymentsForVerification(
  status?: string,
  tournamentId?: string,
  limit: number = 50,
  offset: number = 0
) {
  try {
    let query = supabase
      .from('payments')
      .select(`
        *,
        users(name, email),
        tournament_players(join_id, slot_number),
        tournaments(name)
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    if (tournamentId) {
      query = query.eq('tournament_id', tournamentId);
    }

    const { data, error } = await query;

    if (error) throw error;

    return { success: true, data: data || [] };
  } catch (error: any) {
    return {
      success: false,
      error: formatErrorMessage(error),
      data: [],
    };
  }
}

// ============================================
// VERIFY PAYMENT (Admin)
// ============================================

export async function verifyPayment(
  paymentId: string,
  tournamentPlayerId: string,
  userId: string
) {
  try {
    // Get payment details for audit
    const { data: payment } = await supabase
      .from('payments')
      .select('*')
      .eq('id', paymentId)
      .single();

    if (!payment) {
      return { success: false, error: 'Payment not found' };
    }

    // Update payment status
    const { data: updatedPayment, error: paymentError } = await supabase
      .from('payments')
      .update({
        status: 'verified',
        verified_by: userId,
        verified_at: new Date().toISOString(),
      })
      .eq('id', paymentId)
      .select()
      .single();

    if (paymentError) throw paymentError;

    // Update tournament player verification status
    const { error: playerError } = await supabase
      .from('tournament_players')
      .update({
        payment_status: 'verified',
        verification_status: 'verified',
        updated_at: new Date().toISOString(),
      })
      .eq('id', tournamentPlayerId);

    if (playerError) throw playerError;

    // Send notification to player
    await supabase.from('notifications').insert([
      {
        user_id: payment.user_id,
        tournament_id: payment.tournament_id,
        title: 'Payment Verified! ✓',
        message: 'Your payment has been verified. You are now registered for the tournament.',
        notification_type: 'payment_verified',
      },
    ]);

    // Log audit
    await supabase.from('audit_logs').insert([
      {
        admin_id: userId,
        action: 'payment_verified',
        target_type: 'payment',
        target_id: paymentId,
        new_value: updatedPayment,
      },
    ]);

    return { success: true, data: updatedPayment };
  } catch (error: any) {
    return {
      success: false,
      error: formatErrorMessage(error),
      data: null,
    };
  }
}

// ============================================
// REJECT PAYMENT (Admin)
// ============================================

export async function rejectPayment(
  paymentId: string,
  tournamentPlayerId: string,
  userId: string,
  reason: string
) {
  try {
    if (!reason || reason.trim().length === 0) {
      return { success: false, error: 'Rejection reason is required' };
    }

    // Get payment details
    const { data: payment } = await supabase
      .from('payments')
      .select('*')
      .eq('id', paymentId)
      .single();

    if (!payment) {
      return { success: false, error: 'Payment not found' };
    }

    // Update payment status
    const { data: updatedPayment, error: paymentError } = await supabase
      .from('payments')
      .update({
        status: 'rejected',
        rejection_reason: reason,
        verified_by: userId,
        verified_at: new Date().toISOString(),
      })
      .eq('id', paymentId)
      .select()
      .single();

    if (paymentError) throw paymentError;

    // Update tournament player status
    await supabase
      .from('tournament_players')
      .update({
        payment_status: 'rejected',
        verification_status: 'rejected',
      })
      .eq('id', tournamentPlayerId);

    // Send notification to player
    await supabase.from('notifications').insert([
      {
        user_id: payment.user_id,
        tournament_id: payment.tournament_id,
        title: 'Payment Rejected',
        message: `Your payment was rejected. Reason: ${reason}. Please resubmit.`,
        notification_type: 'payment_rejected',
      },
    ]);

    // Log audit
    await supabase.from('audit_logs').insert([
      {
        admin_id: userId,
        action: 'payment_rejected',
        target_type: 'payment',
        target_id: paymentId,
        new_value: { reason },
      },
    ]);

    return { success: true, data: updatedPayment };
  } catch (error: any) {
    return {
      success: false,
      error: formatErrorMessage(error),
      data: null,
    };
  }
}

// ============================================
// GET PLAYER PAYMENT STATUS
// ============================================

export async function getPlayerPaymentStatus(
  tournamentId: string,
  userId: string
) {
  try {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('tournament_id', tournamentId)
      .eq('user_id', userId)
      .single();

    if (error && error.code === 'PGRST116') {
      // No payment found
      return { success: true, data: null };
    }

    if (error) throw error;

    return { success: true, data };
  } catch (error: any) {
    return {
      success: false,
      error: formatErrorMessage(error),
      data: null,
    };
  }
}

// ============================================
// GET PAYMENT SETTINGS
// ============================================

export async function getPaymentSettings() {
  try {
    const { data, error } = await supabase
      .from('payment_settings')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code === 'PGRST116') {
      // No settings found
      return { success: true, data: null };
    }

    if (error) throw error;

    return { success: true, data };
  } catch (error: any) {
    return {
      success: false,
      error: formatErrorMessage(error),
      data: null,
    };
  }
}

// ============================================
// UPDATE PAYMENT SETTINGS (Admin)
// ============================================

export async function updatePaymentSettings(
  upiId: string,
  paymentName: string,
  instructions: string,
  userId: string,
  qrCodeUrl?: string
) {
  try {
    if (!upiId || !paymentName || !instructions) {
      return { success: false, error: 'All fields are required' };
    }

    // Get existing settings
    const { data: existing } = await supabase
      .from('payment_settings')
      .select('id')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    let result;

    if (existing) {
      // Update existing
      const { data, error } = await supabase
        .from('payment_settings')
        .update({
          upi_id: upiId,
          payment_name: paymentName,
          instructions,
          qr_code_url: qrCodeUrl,
          updated_by: userId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;
      result = data;
    } else {
      // Create new
      const { data, error } = await supabase
        .from('payment_settings')
        .insert([
          {
            upi_id: upiId,
            payment_name: paymentName,
            instructions,
            qr_code_url: qrCodeUrl,
            updated_by: userId,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      result = data;
    }

    // Log audit
    await supabase.from('audit_logs').insert([
      {
        admin_id: userId,
        action: 'payment_settings_updated',
        target_type: 'payment_settings',
        target_id: result.id,
        new_value: result,
      },
    ]);

    return { success: true, data: result };
  } catch (error: any) {
    return {
      success: false,
      error: formatErrorMessage(error),
      data: null,
    };
  }
}

// ============================================
// GET PAYMENT STATISTICS (Admin)
// ============================================

export async function getPaymentStats() {
  try {
    // Count by status
    const statuses = ['pending', 'verified', 'rejected', 'refunded'];
    const stats: any = {};

    for (const status of statuses) {
      const { count } = await supabase
        .from('payments')
        .select('id', { count: 'exact', head: true })
        .eq('status', status);

      stats[status] = count || 0;
    }

    // Total collected
    const { data: verified } = await supabase
      .from('payments')
      .select('amount')
      .eq('status', 'verified');

    const totalCollected = (verified || []).reduce((sum, p) => sum + (p.amount || 0), 0);

    return {
      success: true,
      data: {
        ...stats,
        totalCollected,
      },
    };
  } catch (error: any) {
    return {
      success: false,
      error: formatErrorMessage(error),
      data: null,
    };
  }
}
