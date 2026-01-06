/**
 * Badge Service
 * Handles checking and awarding badges based on game performance.
 */

export const BADGE_IDS = {
    PERFECT_ROUND: 'perfect_round',
    STREAK_MASTER: 'streak_master',
    MATH_HERO: 'math_hero',
    PHY_HERO: 'phy_hero'
};

/**
 * Checks for new badges and persists them to the database.
 * @param {object} supabase - Supabase client
 * @param {string} userId - User ID
 * @param {object} stats - Game statistics { correctCount, totalQuestions, streak, subject, outOfHearts }
 * @returns {Promise<string[]>} - List of NEWLY awarded badge IDs
 */
export async function checkAndAwardBadges(supabase, userId, stats) {
    const newBadges = [];

    // 1. Definition der Badge-Bedingungen
    const potentialBadges = [];

    // Badge: Perfekte Runde (100% richtig)
    if (stats.correctCount === stats.totalQuestions && stats.totalQuestions > 0) {
        potentialBadges.push(BADGE_IDS.PERFECT_ROUND);
    }

    // Badge: Streak Meister (Streak >= 3)
    if (stats.streak >= 3) {
        potentialBadges.push(BADGE_IDS.STREAK_MASTER);
    }

    // Badge: Mathe Held (nicht verloren & > 50% richtig in Mathe)
    if (!stats.outOfHearts &&
        stats.subject === 'Mathe' &&
        stats.correctCount >= Math.ceil(stats.totalQuestions / 2)) {
        potentialBadges.push(BADGE_IDS.MATH_HERO);
    }

    // Badge: Physik Profi
    if (!stats.outOfHearts &&
        stats.subject === 'Physik' &&
        stats.correctCount >= Math.ceil(stats.totalQuestions / 2)) {
        potentialBadges.push(BADGE_IDS.PHY_HERO);
    }

    if (potentialBadges.length === 0) return [];

    // 2. Prüfen, welche Badges der User schon hat
    // Wir nehmen an, es gibt eine Tabelle 'user_badges' (user_id, badge_id)
    // Falls nicht, muss diese erstellt werden.
    const { data: existingBadges, error } = await supabase
        .from('user_badges')
        .select('badge_id')
        .eq('user_id', userId)
        .in('badge_id', potentialBadges);

    if (error) {
        console.error('Fehler beim Laden der Badges:', error);
        return [];
    }

    const ownedBadgeIds = new Set(existingBadges?.map(b => b.badge_id) || []);

    // 3. Neue Badges speichern
    for (const badgeId of potentialBadges) {
        if (!ownedBadgeIds.has(badgeId)) {
            const { error: insertError } = await supabase
                .from('user_badges')
                .insert({ user_id: userId, badge_id: badgeId });

            if (!insertError) {
                newBadges.push(badgeId);
            } else {
                // Bei Duplicate-Fehler (Unique-Constraint) nicht abbrechen
                const msg = String(insertError?.message || '').toLowerCase();
                if (msg.includes('duplicate key') || msg.includes('unique')) {
                    // Badge existiert bereits – stillschweigend ignorieren
                    continue;
                }
                console.error(`Fehler beim Speichern von Badge ${badgeId}:`, insertError);
            }
        }
    }

    return newBadges;
}

/**
 * Get all badges for a user
 */
export async function getUserBadges(supabase, userId) {
    const { data, error } = await supabase
        .from('user_badges')
        .select('*')
        .eq('user_id', userId);

    if (error) {
        console.error('Check Badges Error', error);
        return [];
    }
    return data || [];
}
