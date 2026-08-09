// src/services/tournaments.ts
// Handle tournament operations

import { supabase } from './supabase';
import { formatErrorMessage } from './supabase';

// ============================================
// GET ALL TOURNAMENTS
// ============================================

export async function getTournaments(
  status?: string,
  limit: number = 50,
  offset: number = 0
) {
  try {
    let query = supabase
      .from('tournaments')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
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
// GET TOURNAMENT BY ID
// ============================================

export async function getTournamentById(tournamentId: string) {
  try {
    const { data, error } = await supabase
      .from('tournaments')
      .select('*')
      .eq('id', tournamentId)
      .single();

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
// GET ACTIVE TOURNAMENTS (For Players)
// ============================================

export async function getActiveTournaments() {
  try {
    const { data, error } = await supabase
      .from('tournaments')
      .select('*')
      .in('status', ['registration_open', 'upcoming', 'live'])
      .order('start_at', { ascending: true });

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
// CREATE TOURNAMENT (Admin Only)
// ============================================

export async function createTournament(
  tournamentData: {
    name: string;
    description?: string;
    organizer: string;
    date: string; // YYYY-MM-DD
    startTime: string; // HH:mm
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
  },
  userId: string
) {
  try {
    // Combine date and time
    const startAtDateTime = new Date(`${tournamentData.date}T${tournamentData.startTime}`);
    const registrationStartAt = new Date(`${tournamentData.date}T${tournamentData.registrationStartTime}`);
    const registrationEndAt = new Date(`${tournamentData.date}T${tournamentData.registrationEndTime}`);
    const roomReleaseAt = new Date(`${tournamentData.date}T${tournamentData.roomReleaseTime}`);

    const { data, error } = await supabase
      .from('tournaments')
      .insert([
        {
          name: tournamentData.name,
          description: tournamentData.description,
          organizer: tournamentData.organizer,
          date: tournamentData.date,
          start_time: tournamentData.startTime,
          timezone: tournamentData.timezone,
          start_at: startAtDateTime.toISOString(),
          registration_start_at: registrationStartAt.toISOString(),
          registration_end_at: registrationEndAt.toISOString(),
          room_release_at: roomReleaseAt.toISOString(),
          entry_fee: tournamentData.entryFee,
          prize_money: tournamentData.prizeMoney,
          total_slots: tournamentData.totalSlots,
          available_slots: tournamentData.totalSlots,
          joined_slots: 0,
          game_mode: tournamentData.gameMode,
          map: tournamentData.map,
          match_type: tournamentData.matchType,
          rules: tournamentData.rules,
          prize_distribution: tournamentData.prizeDistribution,
          payment_instructions: tournamentData.paymentInstructions,
          status: 'draft',
          created_by: userId,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    // Log audit
    await supabase.from('audit_logs').insert([
      {
        admin_id: userId,
        action: 'tournament_created',
        target_type: 'tournament',
        target_id: data.id,
        new_value: data,
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
// UPDATE TOURNAMENT (Admin Only)
// ============================================

export async function updateTournament(
  tournamentId: string,
  updates: any,
  userId: string
) {
  try {
    // Get existing tournament for audit log
    const { data: existingTournament } = await supabase
      .from('tournaments')
      .select('*')
      .eq('id', tournamentId)
      .single();

    const { data, error } = await supabase
      .from('tournaments')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', tournamentId)
      .select()
      .single();

    if (error) throw error;

    // Log audit
    await supabase.from('audit_logs').insert([
      {
        admin_id: userId,
        action: 'tournament_updated',
        target_type: 'tournament',
        target_id: tournamentId,
        previous_value: existingTournament,
        new_value: data,
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
// UPDATE TOURNAMENT STATUS
// ============================================

export async function updateTournamentStatus(
  tournamentId: string,
  newStatus: string,
  userId: string
) {
  return updateTournament(
    tournamentId,
    { status: newStatus, manual_status_override: true },
    userId
  );
}

// ============================================
// RELEASE ROOM CREDENTIALS
// ============================================

export async function releaseRoom(
  tournamentId: string,
  roomId: string,
  roomPassword: string,
  userId: string
) {
  try {
    const { data, error } = await supabase
      .from('tournaments')
      .update({
        room_id: roomId,
        room_password: roomPassword,
        room_released: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', tournamentId)
      .select()
      .single();

    if (error) throw error;

    // Log audit
    await supabase.from('audit_logs').insert([
      {
        admin_id: userId,
        action: 'room_released',
        target_type: 'tournament',
        target_id: tournamentId,
        new_value: { room_id: roomId },
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
// GET TOURNAMENT PLAYERS
// ============================================

export async function getTournamentPlayers(
  tournamentId: string,
  status?: string
) {
  try {
    let query = supabase
      .from('tournament_players')
      .select('*, users(name, email), player_profiles(game_name, game_uid)')
      .eq('tournament_id', tournamentId);

    if (status) {
      query = query.eq('verification_status', status);
    }

    const { data, error } = await query.order('joined_at');

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
// CHECK IF PLAYER ALREADY JOINED
// ============================================

export async function checkIfPlayerJoined(
  tournamentId: string,
  userId: string
) {
  try {
    const { data, error } = await supabase
      .from('tournament_players')
      .select('id')
      .eq('tournament_id', tournamentId)
      .eq('user_id', userId)
      .single();

    if (error && error.code === 'PGRST116') {
      // Not found
      return { success: true, joined: false, data: null };
    }

    if (error) throw error;

    return { success: true, joined: true, data };
  } catch (error: any) {
    return {
      success: false,
      error: formatErrorMessage(error),
      joined: false,
    };
  }
}

// ============================================
// GENERATE UNIQUE JOIN ID
// ============================================

function generateJoinId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'TNT-';
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// ============================================
// GET NEXT AVAILABLE SLOT
// ============================================

async function getNextAvailableSlot(tournamentId: string) {
  try {
    const { data: tournament } = await supabase
      .from('tournaments')
      .select('total_slots')
      .eq('id', tournamentId)
      .single();

    if (!tournament) return null;

    // Get all used slots
    const { data: usedSlots } = await supabase
      .from('tournament_players')
      .select('slot_number')
      .eq('tournament_id', tournamentId)
      .not('slot_number', 'is', null);

    const usedSlotNumbers = (usedSlots || []).map(s => s.slot_number);

    // Find first available slot
    for (let i = 1; i <= tournament.total_slots; i++) {
      if (!usedSlotNumbers.includes(i)) {
        return i;
      }
    }

    return null; // No available slots
  } catch (error) {
    console.error('Error getting next available slot:', error);
    return null;
  }
}

// ============================================
// JOIN TOURNAMENT
// ============================================

export async function joinTournament(
  tournamentId: string,
  userId: string,
  gameName: string,
  gameUid: string
) {
  try {
    // Check if already joined
    const { joined } = await checkIfPlayerJoined(tournamentId, userId);
    if (joined) {
      return {
        success: false,
        error: 'You have already joined this tournament',
        data: null,
      };
    }

    // Check if tournament is full
    const { data: tournament } = await supabase
      .from('tournaments')
      .select('total_slots, joined_slots, status')
      .eq('id', tournamentId)
      .single();

    if (!tournament) {
      return { success: false, error: 'Tournament not found', data: null };
    }

    if (tournament.status !== 'registration_open') {
      return { success: false, error: 'Registration is not open', data: null };
    }

    if (tournament.joined_slots >= tournament.total_slots) {
      return { success: false, error: 'Tournament is full', data: null };
    }

    // Get next available slot
    const slot = await getNextAvailableSlot(tournamentId);
    if (!slot) {
      return { success: false, error: 'No slots available', data: null };
    }

    // Create join ID
    const joinId = generateJoinId();

    // Insert tournament player record
    const { data, error } = await supabase
      .from('tournament_players')
      .insert([
        {
          tournament_id: tournamentId,
          user_id: userId,
          join_id: joinId,
          slot_number: slot,
          game_name: gameName,
          game_uid: gameUid,
          payment_status: 'pending',
          verification_status: 'pending',
          rules_accepted: true,
          joined_at: new Date().toISOString(),
          reservation_expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 min timeout
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
        title: 'Successfully Joined!',
        message: `You have joined the tournament. Your join ID: ${joinId}`,
        notification_type: 'tournament_joined',
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
// GET MY TOURNAMENTS (Player)
// ============================================

export async function getMyTournaments(userId: string) {
  try {
    const { data, error } = await supabase
      .from('tournament_players')
      .select('*, tournaments(*)')
      .eq('user_id', userId)
      .order('joined_at', { ascending: false });

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
// REMOVE PLAYER FROM TOURNAMENT
// ============================================

export async function removePlayerFromTournament(
  tournamentPlayerId: string,
  userId: string,
  reason: string
) {
  try {
    const { data, error } = await supabase
      .from('tournament_players')
      .update({
        removed_at: new Date().toISOString(),
        removed_by: userId,
        removal_reason: reason,
        verification_status: 'removed',
      })
      .eq('id', tournamentPlayerId)
      .select()
      .single();

    if (error) throw error;

    // Log audit
    await supabase.from('audit_logs').insert([
      {
        admin_id: userId,
        action: 'player_removed',
        target_type: 'tournament_player',
        target_id: tournamentPlayerId,
        new_value: { reason },
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
