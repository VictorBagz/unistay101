import { University, Service, RoommateProfile } from './types';

// Core feature constants
export const UNIVERSITIES: University[] = [
  { id: '123e4567-e89b-12d3-a456-426614174001', name: 'Makerere', logoUrl: '/images/hostels/makerere.jpg' },
  { id: '123e4567-e89b-12d3-a456-426614174002', name: 'Kyambogo', logoUrl: '/images/hostels/kyambogo.jpg' },
  { id: '123e4567-e89b-12d3-a456-426614174003', name: 'MUBS', logoUrl: '/images/hostels/mubs.jpg' },
  { id: '123e4567-e89b-12d3-a456-426614174004', name: 'UCU', logoUrl: '/images/hostels/ucu.png' },
  { id: '123e4567-e89b-12d3-a456-426614174005', name: 'UMU Nkozi', logoUrl: '/images/hostels/umu.png' },
  { id: '123e4567-e89b-12d3-a456-426614174006', name: 'KIU', logoUrl: '/images/hostels/kiu.jpg' },
  { id: '123e4567-e89b-12d3-a456-426614174007', name: 'MUST', logoUrl: '/images/hostels/must.jpg' },
  { id: '123e4567-e89b-12d3-a456-426614174008', name: 'Aga Khan', logoUrl: '/images/hostels/agaKhan.jpg' },
  { id: '123e4567-e89b-12d3-a456-426614174009', name: 'Gulu', logoUrl: '/images/hostels/gulu.png' },
  { id: '123e4567-e89b-12d3-a456-426614174010', name: 'Lira', logoUrl: '/images/hostels/lira.png' },
  { id: '123e4567-e89b-12d3-a456-426614174011', name: 'IUEA', logoUrl: '/images/hostels/iuea.jpg' },
];

export const SERVICES: Service[] = [
  { id: 'food', name: 'Food', icon: 'fas fa-utensils', description: 'Best & affordable food spots.' },
  { id: 'transport', name: 'Transport', icon: 'fas fa-motorcycle', description: 'Easy ways to get around campus.' },
  { id: 'shopping', name: 'Shopping', icon: 'fas fa-shopping-bag', description: 'Your essentials and retail therapy.' },
  { id: 'stationery', name: 'Stationery', icon: 'fas fa-book-open', description: 'All your academic supplies.' },
  { id: 'laundry', name: 'Laundry', icon: 'fas fa-tshirt', description: 'Quick & convenient laundry services.' },
  { id: 'entertainment', name: 'Entertainment', icon: 'fas fa-ticket-alt', description: 'Fun activities and hangout joints.' },
  { id: 'internet', name: 'Internet', icon: 'fas fa-wifi', description: 'Reliable internet for study & fun.' },
  { id: 'health', name: 'Health', icon: 'fas fa-heartbeat', description: 'Clinics, pharmacies & wellness.' },
];

export const AMENITIES_LIST: { name: string; icon: string }[] = [
  { name: 'WiFi', icon: 'fas fa-wifi' },
  { name: 'Shuttle', icon: 'fas fa-bus' },
  { name: 'Security', icon: 'fas fa-shield-alt' },
  { name: 'DSTV', icon: 'fas fa-tv' },
  { name: 'Pool', icon: 'fas fa-swimmer' },
  { name: 'Gym', icon: 'fas fa-dumbbell' },
  { name: 'Restaurant', icon: 'fas fa-utensils' },
  { name: 'Water', icon: 'fas fa-shower' },
];

// Roommate form constants
export const GENDERS: RoommateProfile['gender'][] = ['Male', 'Female'];
export const SEEKING_GENDERS: RoommateProfile['seekingGender'][] = ['Male', 'Female', 'Any'];
export const LEASE_DURATIONS: RoommateProfile['leaseDuration'][] = ['Semester', 'Full Year', 'Flexible'];
export const STUDY_SCHEDULES: RoommateProfile['studySchedule'][] = ['Early Bird', 'Night Owl', 'Flexible'];
export const CLEANLINESS_LEVELS: RoommateProfile['cleanliness'][] = ['Tidy', 'Average', 'Relaxed'];
export const GUEST_FREQUENCIES: RoommateProfile['guestFrequency'][] = ['Rarely', 'Sometimes', 'Often'];
export const DRINKING_HABITS: RoommateProfile['drinksAlcohol'][] = ['Socially', 'Rarely', 'No'];