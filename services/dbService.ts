import { supabase } from './supabase';
import { Hostel, NewsItem, Event, Job, RoommateProfile, StudentDeal } from '../types';

// Generic CRUD factory for the Supabase database
const createCrudService = <T extends { id: string }>(tableName: string) => {
    return {
        async getAll(): Promise<T[]> {
            // Note: In a real app, you'd add .order() for consistent results
            const { data, error } = await supabase.from(tableName).select('*');
            if (error) {
                console.error(`Error fetching from ${tableName}:`, error);
                throw error;
            }
            return data as T[];
        },

        async getCounts(): Promise<number> {
            const { count, error } = await supabase.from(tableName).select('*', { count: 'exact', head: true });
            if (error) {
                console.error(`Error counting from ${tableName}:`, error);
                throw error;
            }
            return count || 0;
        },

        async add(item: Omit<T, 'id'>): Promise<T> {
            // Assumes 'id' column has a default UUID generation in Supabase
            const { data, error } = await supabase.from(tableName).insert([item]).select();
            if (error) {
                console.error(`Error adding to ${tableName}:`, error);
                throw error;
            }
            return data[0] as T;
        },

        async update(id: string, item: Partial<Omit<T, 'id'>>): Promise<void> {
            const { error } = await supabase.from(tableName).update(item).eq('id', id);
            if (error) {
                console.error(`Error updating ${tableName}:`, error);
                throw error;
            }
        },

        // For roommate profiles, which are "set" (upsert)
        async set(item: T): Promise<void> {
            const { error } = await supabase.from(tableName).upsert(item, { onConflict: 'id' });
            if (error) {
                console.error(`Error upserting to ${tableName}:`, error);
                throw error;
            }
        },

        async remove(id: string): Promise<void> {
            const { error } = await supabase.from(tableName).delete().eq('id', id);
            if (error) {
                console.error(`Error removing from ${tableName}:`, error);
                throw error;
            }
        },
    };
};

export const hostelService = createCrudService<Hostel>('hostels');
export const newsService = createCrudService<NewsItem>('news');
export const eventService = createCrudService<Event>('events');
export const jobService = createCrudService<Job>('jobs');
export const roommateProfileService = createCrudService<RoommateProfile>('profiles');

// Student spotlight service
interface StudentSpotlightRow {
    id: string;
    name: string;
    major?: string;
    bio?: string;
    imageUrl?: string;
    universityId?: string;
    date?: string;
    votes: number;
    gender?: 'male' | 'female' | 'other';
    isWinner: boolean;
    created_at?: string;
    updated_at?: string;
}

export const spotlightService = {
    async getAll(): Promise<StudentSpotlightRow[]> {
        const { data, error } = await supabase.from('student_spotlights').select('*').order('votes', { ascending: false });
        if (error) {
            console.error('Error fetching spotlights:', error);
            throw error;
        }
        return (data || []) as StudentSpotlightRow[];
    },

    async add(item: Omit<StudentSpotlightRow, 'id' | 'created_at' | 'updated_at'>): Promise<StudentSpotlightRow> {
        const payload = {
            ...item,
            votes: item.votes || 0,
            isWinner: item.isWinner || false,
            gender: item.gender || 'other'
        };
        const { data, error } = await supabase.from('student_spotlights').insert([payload]).select();
        if (error) {
            console.error('Error adding spotlight:', error);
            throw error;
        }
        return data[0] as StudentSpotlightRow;
    },

    async update(id: string, item: Partial<Omit<StudentSpotlightRow, 'id' | 'created_at'>>): Promise<void> {
        const { error } = await supabase.from('student_spotlights').update(item).eq('id', id);
        if (error) {
            console.error('Error updating spotlight:', error);
            throw error;
        }
    },

    async incrementVotes(id: string): Promise<void> {
        const { data: current } = await supabase.from('student_spotlights').select('votes').eq('id', id).single();
        if (current) {
            const { error } = await supabase.from('student_spotlights').update({ votes: (current.votes || 0) + 1 }).eq('id', id);
            if (error) throw error;
        }
    },

    async remove(id: string): Promise<void> {
        const { error } = await supabase.from('student_spotlights').delete().eq('id', id);
        if (error) {
            console.error('Error removing spotlight:', error);
            throw error;
        }
    },

    onSpotlightsChange: (callback: (payload: any) => void) => {
        const sub = supabase.channel('public:student_spotlights')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'student_spotlights' }, (payload) => callback(payload))
            .subscribe();
        return () => {
            supabase.removeChannel(sub);
        };
    }
};

// Adapter for components (used in App.tsx)
export const spotlightHandler = {
    add: async (item: Omit<StudentSpotlightRow, 'id' | 'created_at' | 'updated_at'>): Promise<void> => {
        await spotlightService.add(item);
    },
    update: async (item: StudentSpotlightRow): Promise<void> => {
        await spotlightService.update(item.id, item);
    },
    remove: async (id: string): Promise<void> => {
        await spotlightService.remove(id);
    },
    incrementVotes: async (id: string): Promise<void> => {
        await spotlightService.incrementVotes(id);
    },
    subscribeSpotlights: spotlightService.onSpotlightsChange,
};

// Student spotlight votes service
interface SpotlightVoteRow {
    id: string;
    student_spotlight_id: string;
    user_id: string;
    timestamp: string;
}

export const spotlightVoteService = {
    async checkUserHasVoted(spotlightId: string, userId: string): Promise<boolean> {
        try {
            const { data, error } = await supabase
                .from('spotlight_votes')
                .select('id', { count: 'exact', head: true })
                .eq('student_spotlight_id', spotlightId)
                .eq('user_id', userId);
            
            if (error) {
                // Table might not exist yet - return false to allow voting
                if (error.code === '42P01' || error.message?.includes('does not exist')) {
                    console.warn('spotlight_votes table does not exist yet');
                    return false;
                }
                console.error('Error checking vote status:', error);
                return false;
            }
            return (data?.length ?? 0) > 0;
        } catch (err) {
            console.error('Exception checking vote status:', err);
            return false;
        }
    },

    async hasUserVotedForAny(userId: string): Promise<boolean> {
        try {
            const { data, error } = await supabase
                .from('spotlight_votes')
                .select('id', { count: 'exact', head: true })
                .eq('user_id', userId);
            
            if (error) {
                // Table might not exist yet - return false to allow voting
                if (error.code === '42P01' || error.message?.includes('does not exist')) {
                    console.warn('spotlight_votes table does not exist yet');
                    return false;
                }
                console.error('Error checking if user has any votes:', error);
                return false;
            }
            return (data?.length ?? 0) > 0;
        } catch (err) {
            console.error('Exception checking if user has any votes:', err);
            return false;
        }
    },

    async addVote(spotlightId: string, userId: string): Promise<SpotlightVoteRow> {
        try {
            // First check if user already voted for this specific student
            const hasVoted = await this.checkUserHasVoted(spotlightId, userId);
            if (hasVoted) {
                throw new Error('User has already voted for this student');
            }

            // Add the vote
            const { data, error } = await supabase
                .from('spotlight_votes')
                .insert([{
                    student_spotlight_id: spotlightId,
                    user_id: userId,
                    timestamp: new Date().toISOString()
                }])
                .select();

            if (error) {
                // If table doesn't exist, just log and continue (vote won't be persisted but app won't crash)
                if (error.code === '42P01' || error.message?.includes('does not exist')) {
                    console.warn('spotlight_votes table does not exist. Please run the migration.');
                    // Continue without persisting - allow the vote to show locally
                    await spotlightService.incrementVotes(spotlightId);
                    return {
                        id: 'local-' + Date.now(),
                        student_spotlight_id: spotlightId,
                        user_id: userId,
                        timestamp: new Date().toISOString()
                    };
                }
                console.error('Error adding vote:', error);
                throw error;
            }

            // Increment the vote count on the student spotlight
            await spotlightService.incrementVotes(spotlightId);

            return data[0] as SpotlightVoteRow;
        } catch (err: any) {
            console.error('Exception adding vote:', err);
            throw err;
        }
    },

    async getUserVotes(userId: string): Promise<string[]> {
        try {
            const { data, error } = await supabase
                .from('spotlight_votes')
                .select('student_spotlight_id')
                .eq('user_id', userId);

            if (error) {
                // Table might not exist - return empty array
                if (error.code === '42P01' || error.message?.includes('does not exist')) {
                    console.warn('spotlight_votes table does not exist yet');
                    return [];
                }
                console.error('Error fetching user votes:', error);
                return [];
            }

            return (data || []).map(row => row.student_spotlight_id);
        } catch (err) {
            console.error('Exception fetching user votes:', err);
            return [];
        }
    },

    async getVoteCount(spotlightId: string): Promise<number> {
        try {
            const { count, error } = await supabase
                .from('spotlight_votes')
                .select('*', { count: 'exact', head: true })
                .eq('student_spotlight_id', spotlightId);

            if (error) {
                // Table might not exist - return 0
                if (error.code === '42P01' || error.message?.includes('does not exist')) {
                    console.warn('spotlight_votes table does not exist yet');
                    return 0;
                }
                console.error('Error getting vote count:', error);
                return 0;
            }

            return count || 0;
        } catch (err) {
            console.error('Exception getting vote count:', err);
            return 0;
        }
    },

    async removeVote(spotlightId: string, userId: string): Promise<void> {
        try {
            const { error } = await supabase
                .from('spotlight_votes')
                .delete()
                .eq('student_spotlight_id', spotlightId)
                .eq('user_id', userId);

            if (error) {
                // Table might not exist
                if (error.code === '42P01' || error.message?.includes('does not exist')) {
                    console.warn('spotlight_votes table does not exist yet');
                    return;
                }
                console.error('Error removing vote:', error);
                throw error;
            }

            // Decrement vote count (we need to update the spotlight)
            const currentVotes = await this.getVoteCount(spotlightId);
            await spotlightService.update(spotlightId, { votes: currentVotes });
        } catch (err) {
            console.error('Exception removing vote:', err);
            throw err;
        }
    }
};

// Anonymous confessions service
interface ConfessionRow {
    id: string;
    content: string;
    timestamp: string;
    likes: number;
    dislikes: number;
    is_approved?: boolean;
    approved_by?: string;
    approved_at?: string;
    rejection_reason?: string;
}

export const confessionService = {
    async getAll(): Promise<ConfessionRow[]> {
        const { data, error } = await supabase.from('confessions').select('*').order('timestamp', { ascending: false });
        if (error) {
            console.error('Error fetching confessions:', error);
            throw error;
        }
        // Ensure likes and dislikes are numbers
        return (data || []).map((item: any) => ({
            ...item,
            likes: Number(item.likes) || 0,
            dislikes: Number(item.dislikes) || 0
        })) as ConfessionRow[];
    },

    async add(content: string): Promise<ConfessionRow> {
        const base = { content, timestamp: new Date().toISOString() };

        // Try inserting numeric counts first (most common schema)
        // New confessions start as unapproved
        let payload: any = { ...base, likes: 0, dislikes: 0, is_approved: false };
        try {
            const { data, error } = await supabase.from('confessions').insert([payload]).select();
            if (error) throw error;
            return data[0] as ConfessionRow;
        } catch (err: any) {
            // If the DB expects arrays or JSON for the likes/dislikes columns, try fallbacks.
            const msg = err?.message || '';
            const hint = err?.hint || '';

            // If hint refers to dislikes expected JSON/array, retry with empty arrays and then with single-element arrays
            if (/dislikes/i.test(hint + msg) || /expected JSON array/i.test(hint + msg) || /expected array/i.test(hint + msg)) {
                // First fallback: use empty arrays (JSON/SQL arrays)
                try {
                    payload = { ...base, likes: [], dislikes: [], is_approved: false };
                    const { data, error } = await supabase.from('confessions').insert([payload]).select();
                    if (error) throw error;
                    return data[0] as ConfessionRow;
                } catch (err2: any) {
                    // Second fallback: use single-element numeric arrays
                    try {
                        payload = { ...base, likes: [0], dislikes: [0], is_approved: false };
                        const { data, error } = await supabase.from('confessions').insert([payload]).select();
                        if (error) throw error;
                        return data[0] as ConfessionRow;
                    } catch (err3: any) {
                        console.error('Error adding confession (fallbacks failed):', err3);
                        throw err3;
                    }
                }
            }

            console.error('Error adding confession:', err);
            throw err;
        }
    },

    async like(confessionId: string, currentStatus?: 'like' | 'dislike' | null, userId?: string) {
        // Use RPC-like updates: increment/decrement safely via single update
        // Strategy: adjust counts based on currentStatus
        const updates: any = {};
        if (currentStatus === 'like') {
            // remove like
            updates.likes = (supabase as any).rpc ? undefined : undefined; // placeholder - we'll fetch then update
        }

        // Simpler approach: fetch row, compute new counts, then update
        const { data, error } = await supabase.from('confessions').select('*').eq('id', confessionId).single();
        if (error) throw error;
        let { likes = 0, dislikes = 0 } = data as any;
        // Ensure likes and dislikes are numbers
        likes = Number(likes) || 0;
        dislikes = Number(dislikes) || 0;
        if (currentStatus === 'like') {
            // remove like
            likes = Math.max(0, likes - 1);
            currentStatus = null;
        } else if (currentStatus === 'dislike') {
            dislikes = Math.max(0, dislikes - 1);
            likes = likes + 1;
            currentStatus = 'like';
        } else {
            likes = likes + 1;
            currentStatus = 'like';
        }

        const { error: updErr } = await supabase.from('confessions').update({ likes, dislikes }).eq('id', confessionId);
        if (updErr) throw updErr;
        return { likes, dislikes, userLikeStatus: currentStatus };
    },

    async dislike(confessionId: string, currentStatus?: 'like' | 'dislike' | null) {
        const { data, error } = await supabase.from('confessions').select('*').eq('id', confessionId).single();
        if (error) throw error;
        let { likes = 0, dislikes = 0 } = data as any;
        // Ensure likes and dislikes are numbers
        likes = Number(likes) || 0;
        dislikes = Number(dislikes) || 0;
        if (currentStatus === 'dislike') {
            dislikes = Math.max(0, dislikes - 1);
            currentStatus = null;
        } else if (currentStatus === 'like') {
            likes = Math.max(0, likes - 1);
            dislikes = dislikes + 1;
            currentStatus = 'dislike';
        } else {
            dislikes = dislikes + 1;
            currentStatus = 'dislike';
        }

        const { error: updErr } = await supabase.from('confessions').update({ likes, dislikes }).eq('id', confessionId);
        if (updErr) throw updErr;
        return { likes, dislikes, userLikeStatus: currentStatus };
    },

    async addComment(confessionId: string, comment: { content: string; userName?: string }) {
        const payload = {
            confession_id: confessionId,
            content: comment.content,
            user_name: comment.userName || 'Anonymous',
            timestamp: new Date().toISOString(),
        };
        const { data, error } = await supabase.from('confession_comments').insert([payload]).select();
        if (error) {
            console.error('Error adding confession comment:', error);
            throw error;
        }
        return data[0];
    },

    // Get pending (unapproved) confessions for admin
    async getPending(): Promise<ConfessionRow[]> {
        const { data, error } = await supabase.from('confessions').select('*').eq('is_approved', false).order('timestamp', { ascending: true });
        if (error) {
            console.error('Error fetching pending confessions:', error);
            throw error;
        }
        return (data || []).map((item: any) => ({
            ...item,
            likes: Number(item.likes) || 0,
            dislikes: Number(item.dislikes) || 0
        })) as ConfessionRow[];
    },

    // Get approved confessions for public display
    async getApproved(): Promise<ConfessionRow[]> {
        const { data, error } = await supabase.from('confessions').select('*').eq('is_approved', true).order('timestamp', { ascending: false });
        if (error) {
            console.error('Error fetching approved confessions:', error);
            throw error;
        }
        return (data || []).map((item: any) => ({
            ...item,
            likes: Number(item.likes) || 0,
            dislikes: Number(item.dislikes) || 0
        })) as ConfessionRow[];
    },

    // Approve a confession
    async approve(confessionId: string, adminEmail: string): Promise<void> {
        const { error } = await supabase.from('confessions').update({
            is_approved: true,
            approved_by: adminEmail,
            approved_at: new Date().toISOString()
        }).eq('id', confessionId);
        if (error) {
            console.error('Error approving confession:', error);
            throw error;
        }
    },

    // Reject a confession
    async reject(confessionId: string, reason?: string): Promise<void> {
        const { error } = await supabase.from('confessions').delete().eq('id', confessionId);
        if (error) {
            console.error('Error rejecting confession:', error);
            throw error;
        }
    },

    // Realtime subscription helpers
    onConfessionsChange: (callback: (payload: any) => void) => {
        const sub = supabase.channel('public:confessions')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'confessions' }, (payload) => callback(payload))
            .subscribe();
        return () => {
            supabase.removeChannel(sub);
        };
    },

    onCommentsChange: (callback: (payload: any) => void) => {
        const sub = supabase.channel('public:confession_comments')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'confession_comments' }, (payload) => callback(payload))
            .subscribe();
        return () => {
            supabase.removeChannel(sub);
        };
    }
};

// Adapter for components (used in App.tsx)
export const confessionHandler = {
    add: async (content: string): Promise<void> => {
        await confessionService.add(content);
    },
    remove: async (id: string): Promise<void> => {
        const { error } = await supabase.from('confessions').delete().eq('id', id);
        if (error) throw error;
    },
    like: async (id: string, currentStatus?: 'like' | 'dislike' | null): Promise<void> => {
        await confessionService.like(id, currentStatus);
    },
    dislike: async (id: string, currentStatus?: 'like' | 'dislike' | null): Promise<void> => {
        await confessionService.dislike(id, currentStatus);
    },
    addComment: async (confessionId: string, comment: string, userName?: string): Promise<void> => {
        await confessionService.addComment(confessionId, { content: comment, userName });
    },
    getPending: async (): Promise<any[]> => {
        return await confessionService.getPending();
    },
    getApproved: async (): Promise<any[]> => {
        return await confessionService.getApproved();
    },
    approve: async (id: string, adminEmail: string): Promise<void> => {
        await confessionService.approve(id, adminEmail);
    },
    reject: async (id: string, reason?: string): Promise<void> => {
        await confessionService.reject(id, reason);
    },
    subscribeConfessions: confessionService.onConfessionsChange,
    subscribeComments: confessionService.onCommentsChange,
};

// The initDb function is no longer needed as seeding is handled by Supabase.

// Create handlers compatible with the AdminDashboard
const createAdaptedCrudHandler = (service) => ({
    add: async (item) => { await service.add(item); },
    update: async (item) => { await service.update(item.id, item); },
    remove: async (id) => { await service.remove(id); },
});

// Student Deals service
export const studentDealsService = createCrudService<StudentDeal>('student_deals');

export const hostelHandler = createAdaptedCrudHandler(hostelService);
export const newsHandler = createAdaptedCrudHandler(newsService);
export const eventHandler = createAdaptedCrudHandler(eventService);
export const jobHandler = createAdaptedCrudHandler(jobService);
export const studentDealsHandler = createAdaptedCrudHandler(studentDealsService);