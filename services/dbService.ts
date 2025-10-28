import { supabase } from './supabase';
import { Hostel, NewsItem, Event, Job, RoommateProfile } from '../types';

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

// The initDb function is no longer needed as seeding is handled by Supabase.

// Create handlers compatible with the AdminDashboard
const createAdaptedCrudHandler = (service) => ({
    add: async (item) => { await service.add(item); },
    update: async (item) => { await service.update(item.id, item); },
    remove: async (id) => { await service.remove(id); },
});

export const hostelHandler = createAdaptedCrudHandler(hostelService);
export const newsHandler = createAdaptedCrudHandler(newsService);
export const eventHandler = createAdaptedCrudHandler(eventService);
export const jobHandler = createAdaptedCrudHandler(jobService);