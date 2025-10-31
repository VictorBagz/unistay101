import React, { useState, useRef } from 'react';
import { User, RoommateProfile, University, Hostel } from '../types';
import Spinner from './Spinner';
import { useNotifier } from '../hooks/useNotifier';
import { authService } from '../services/authService';

type AppView = 'main' | 'roommateFinder' | 'blog' | 'events' | 'jobs' | 'auth' | 'admin' | 'profile';

interface ProfilePageProps {
  user: User;
  onSignOut: () => void;
  savedHostels: Hostel[];
  onToggleSaveHostel: (hostelId: string) => void;
  profile?: RoommateProfile;
  universities: University[];
  onNavigate: (page: string) => void;
  onDataChange: () => void;
}

const ProfileStatCard = ({ icon, label, value }) => (
    <div className="bg-gray-50 rounded-lg p-4 flex items-center gap-4">
        <div className="bg-unistay-yellow/20 text-unistay-navy rounded-full h-12 w-12 flex items-center justify-center flex-shrink-0">
            <i className={`fas ${icon} text-xl`}></i>
        </div>
        <div>
            <p className="text-sm text-gray-500">{label}</p>
            <p className="text-lg font-bold text-unistay-navy truncate">{value}</p>
        </div>
    </div>
);


const ProfilePage = ({ 
    user, 
    savedHostels, 
    onSignOut, 
    onToggleSaveHostel,
    profile,
    universities,
    onNavigate,
    onDataChange
}: ProfilePageProps) => {
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { notify } = useNotifier();

    const getUniversityName = (uniId: string | undefined): string => {
        if (!uniId) return 'Not Set';
        const university = universities.find(u => u.id === uniId);
        return university ? university.name : 'Unknown University';
    };

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };
    
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;

        setIsUploading(true);
        try {
            await authService.updateProfilePhoto(user.id, file);
            notify({ message: 'Profile photo updated successfully!', type: 'success' });
            onDataChange(); // Refresh all app data to show the new photo
        } catch (err) {
            notify({ message: err, type: 'error' });
        } finally {
            setIsUploading(false);
            // Reset file input value to allow re-uploading the same file
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };
    
    return (
        <div className="bg-gray-100 min-h-screen">
             <header className="bg-white shadow-sm sticky top-0 z-40">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-20">
                    <h1 className="text-3xl font-bold text-unistay-navy">My Profile</h1>
                    <button onClick={() => onNavigate('main')} className="font-semibold text-unistay-navy hover:text-unistay-yellow transition-colors flex items-center gap-2">
                        <i className="fas fa-arrow-left"></i>
                        Back to Home
                    </button>
                </div>
            </header>

            <main className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 pt-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in-up">
                    {/* Left Column: Profile Card */}
                    <div className="lg:col-span-1 space-y-8">
                        <div className="bg-white rounded-2xl shadow-xl p-6 text-center">
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                className="hidden"
                                accept="image/png, image/jpeg"
                                disabled={isUploading}
                            />
                            <div className="relative w-32 h-32 mx-auto mb-4 group">
                                <button 
                                    onClick={handleAvatarClick}
                                    disabled={isUploading}
                                    className="w-full h-full rounded-full bg-unistay-yellow flex items-center justify-center font-bold text-unistay-navy text-5xl disabled:cursor-not-allowed"
                                    aria-label="Change profile photo"
                                >
                                    {profile?.imageUrl ? (
                                        <img src={profile.imageUrl} alt={user.name || ''} className="w-full h-full rounded-full object-cover" />
                                    ) : (
                                        user.name?.charAt(0).toUpperCase()
                                    )}
                                </button>
                                {isUploading ? (
                                    <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center">
                                        <Spinner color="white" size="lg" />
                                    </div>
                                ) : (
                                    <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" onClick={handleAvatarClick}>
                                        <i className="fas fa-camera text-white text-3xl"></i>
                                    </div>
                                )}
                            </div>
                            <h2 className="text-2xl font-bold text-unistay-navy">{user.name}</h2>
                            <p className="text-gray-500">{user.email}</p>
                            <button 
                                onClick={() => onNavigate('roommateFinder')}
                                className="mt-6 w-full bg-unistay-navy text-white font-bold py-2 px-6 rounded-full hover:bg-opacity-90 transition-colors"
                            >
                                {profile ? 'Edit Roommate Profile' : 'Create Roommate Profile'}
                            </button>
                        </div>

                         <div className="bg-white rounded-2xl shadow-xl p-6">
                            <h3 className="text-xl font-bold text-unistay-navy mb-4">Account</h3>
                             <button 
                                onClick={onSignOut}
                                className="w-full text-left px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-3"
                            >
                                <i className="fas fa-sign-out-alt w-5"></i>
                                Logout
                            </button>
                         </div>
                    </div>

                    {/* Right Column: Details & Activity */}
                    <div className="lg:col-span-2 space-y-8">
                         <div className="bg-white rounded-2xl shadow-xl p-6">
                            <h3 className="text-xl font-bold text-unistay-navy mb-4">My Student Details</h3>
                            {profile ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <ProfileStatCard icon="fa-university" label="University" value={getUniversityName(profile?.universityId)} />
                                    <ProfileStatCard icon="fa-book" label="Course" value={profile.course || 'Not Set'} />
                                    <ProfileStatCard icon="fa-calendar-day" label="Year of Study" value={profile.yearOfStudy?.toString() || 'Not Set'} />
                                    <ProfileStatCard icon="fa-wallet" label="Budget" value={`UGX ${profile.budget?.toLocaleString() || '0'}`} />
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <i className="fas fa-user-graduate text-4xl text-gray-300 mb-4"></i>
                                    <p className="text-gray-600">You haven't created a roommate profile yet.</p>
                                    <button onClick={() => onNavigate('roommateFinder')} className="mt-4 font-bold text-unistay-navy hover:text-unistay-yellow">
                                        Create one now to find matches!
                                    </button>
                                </div>
                            )}
                         </div>

                         <div className="bg-white rounded-2xl shadow-xl p-6">
                            <h3 className="text-xl font-bold text-unistay-navy mb-4">Quick Links</h3>
                            <div className="space-y-3">
                                <button onClick={() => onNavigate('roommateFinder')} className="flex items-center justify-between w-full p-4 rounded-lg hover:bg-gray-50 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <i className="fas fa-users text-unistay-navy"></i>
                                        <span className="font-semibold">My Roommate Matches</span>
                                    </div>
                                    <i className="fas fa-chevron-right text-gray-400"></i>
                                </button>
                                {savedHostels.length > 0 ? (
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between px-4">
                                            <div className="flex items-center gap-4">
                                                <i className="fas fa-heart text-unistay-navy"></i>
                                                <span className="font-semibold">Saved Hostels ({savedHostels.length})</span>
                                            </div>
                                        </div>
                                        <div className="space-y-2 px-4">
                                            {savedHostels.map(hostel => (
                                                <div key={hostel.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50">
                                                    <div>
                                                        <h4 className="font-semibold text-unistay-navy">{hostel.name}</h4>
                                                        <p className="text-sm text-gray-600">{hostel.priceRange}</p>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => onToggleSaveHostel(hostel.id)}
                                                            className="p-2 text-red-500 hover:bg-red-50 rounded-full"
                                                            title="Remove from saved"
                                                        >
                                                            <i className="fas fa-heart"></i>
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-between w-full p-4 rounded-lg hover:bg-gray-50 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <i className="far fa-heart text-unistay-navy"></i>
                                            <span className="font-semibold">No Saved Hostels</span>
                                        </div>
                                    </div>
                                )}
                                 <button className="flex items-center justify-between w-full p-4 rounded-lg hover:bg-gray-50 transition-colors cursor-not-allowed opacity-60">
                                    <div className="flex items-center gap-4">
                                        <i className="fas fa-file-alt text-unistay-navy"></i>
                                        <span className="font-semibold">My Job Applications</span>
                                    </div>
                                    <i className="fas fa-chevron-right text-gray-400"></i>
                                </button>
                            </div>
                         </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default ProfilePage;