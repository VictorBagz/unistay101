



export interface University {
  id: string; // UUID format: 123e4567-e89b-12d3-a456-426614174000
  name: string;
  logoUrl: string;
}

export interface Hostel {
  id: string;
  name: string;
  location: string;
  priceRange: string;
  imageUrl: string; // Primary image (thumbnail)
  imageUrls: string[]; // All hostel images including the primary image
  rating: number;
  universityId: string;
  description: string;
  amenities: {
    name:string;
    icon: string; // font-awesome icon class
  }[];
  isRecommended: boolean;
}

export interface NewsItem {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  source: string;
  timestamp: string; // ISO date string
  featured: boolean; // Flag to mark featured news
}

export interface Event {
  id: string;
  title: string;
  date: string;
  day: string;
  month: string;
  location: string;
  imageUrl: string;
  time?: string;
  price?: string;
  contacts?: string[];
  phone?: string;
  email?: string;
  description?: string;
  registrationLink?: string;
}

export interface Job {
  id: string;
  title: string;
  deadline: string;
  company: string;
  imageUrl: string;
  location: string;
  type: 'Full-time' | 'Part-time' | 'Internship';
  description: string;
  responsibilities: string[];
  qualifications: string[];
  howToApply: string; // URL to the application page
}

export interface Service {
  id: string;
  name: string;
  icon: string; // Font Awesome class string
  description: string;
}

export interface RoommateProfile {
    id: string; // User ID (string for UID)
    name: string; // First name
    email: string;
    universityId: string;
    contactNumber: string;
    studentNumber: string;
    imageUrl: string;

    // Optional fields for progressive profile completion
    age?: number;
    gender?: 'Male' | 'Female';
    course?: string;
    yearOfStudy?: number;
    budget?: number; // UGX per month
    moveInDate?: string; // YYYY-MM-DD
    dateOfBirth?: string; // YYYY-MM-DD
    leaseDuration?: 'Semester' | 'Full Year' | 'Flexible';
    bio?: string;
    isSmoker?: boolean;
    drinksAlcohol?: 'Socially' | 'Rarely' | 'No';
    studySchedule?: 'Early Bird' | 'Night Owl' | 'Flexible';
    cleanliness?: 'Tidy' | 'Average' | 'Relaxed';
    guestFrequency?: 'Rarely' | 'Sometimes' | 'Often';
    hobbies?: string; // comma separated string
    seekingGender?: 'Male' | 'Female' | 'Any';
}


export interface User {
  id: string; // Supabase UID
  name: string | null;
  email: string | null;
}

export interface Notification {
  id: string;
  type: 'news' | 'job' | 'hostel' | 'roommate';
  message: string;
  timestamp: Date;
  read: boolean;
}