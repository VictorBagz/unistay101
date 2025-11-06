import React, { useState, useEffect } from 'react';
import { Analytics } from '@vercel/analytics/react';

import Header from './components/Header';
import Hero from './components/Hero';
import FeaturedContent from './components/FeaturedContent';
import CommunityHub from './components/CommunityHub';
import Services from './components/Services';
import Footer from './components/Footer';
import HostelDetailModal from './components/HostelDetailModal';
import RoommateFinder from './components/RoommateFinder';
import BlogPage from './components/BlogPage';
import EventsPage from './components/EventsPage';
import JobsPage from './components/JobsPage';
import AuthPage from './components/AuthPage';
import AdminDashboard from './components/AdminDashboard';
import ProfilePage from './components/ProfilePage';
import Spinner from './components/Spinner';
import Notifier from './components/Notifier';
import { NotificationProvider } from './hooks/useNotifier';

import { 
    UNIVERSITIES, 
    SERVICES
} from './constants';
import { University, Hostel, NewsItem, Job, Event, User, RoommateProfile, Notification } from './types';

import { supabase } from './services/supabase';
import { authService, formatUser } from './services/authService';
// Switch from mockDbService to live dbService
import { hostelService, newsService, eventService, jobService, roommateProfileService, hostelHandler, newsHandler, eventHandler, jobHandler } from './services/dbService';

type AppView = 'main' | 'roommateFinder' | 'blog' | 'events' | 'jobs' | 'auth' | 'admin' | 'profile';


const App = () => {
  // --- State Management ---
  const [currentView, setCurrentView] = useState<AppView>('main');
  const [selectedUniversity, setSelectedUniversity] = useState<University>(UNIVERSITIES[0]);
  const [viewingHostel, setViewingHostel] = useState<Hostel | null>(null);
  
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [savedHostels, setSavedHostels] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('unistay_saved_hostels');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch (error) {
      console.error("Failed to parse saved hostels from localStorage", error);
      return new Set();
    }
  });
  const [notifications, setNotifications] = useState<Notification[]>([]);


  // Data state
  const [hostels, setHostels] = useState<Hostel[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [roommateProfiles, setRoommateProfiles] = useState<RoommateProfile[]>([]);
  
  // --- Effects ---
  // Listen to auth state changes and load initial data
  useEffect(() => {
    let isSubscribed = true;

    const initializeApp = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const user = formatUser(session?.user || null);
        
        if (isSubscribed) {
          setCurrentUser(user);
          setIsAdmin(user?.email === 'admin@unistay.com' || user?.email === 'victorbaguma34@gmail.com');
          
          if (!user) {
            setSavedHostels(new Set());
            setNotifications([]);
          }
          
          await refreshAllData();
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Failed to initialize app:', error);
        if (isSubscribed) {
          setIsLoading(false);
        }
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const user = formatUser(session?.user || null);
      if (isSubscribed) {
        setCurrentUser(user);
        setIsAdmin(user?.email === 'admin@unistay.com' || user?.email === 'victorbaguma34@gmail.com' || user?.email === 'drilebaroy33@gmail.com');
        
        if (!user) {
          setSavedHostels(new Set());
          setNotifications([]);
        }
      }
    });

    initializeApp();

    return () => {
      isSubscribed = false;
      subscription.unsubscribe();
    };
  }, []);

  // Persist saved hostels to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('unistay_saved_hostels', JSON.stringify(Array.from(savedHostels)));
    } catch (error) {
      console.error("Failed to save hostels to localStorage", error);
    }
  }, [savedHostels]);

  // Generate mock notifications when user logs in and data is available
  useEffect(() => {
    if (currentUser && !isLoading && notifications.length === 0) {
      const currentUserProfile = roommateProfiles.find(p => p.id === currentUser?.id);
      const newNotifs: Notification[] = [];
      if (news.length > 0) {
          newNotifs.push({
              id: `notif-news-${news[0].id}`, type: 'news',
              message: `New article posted: "${news[0].title}"`,
              timestamp: new Date(new Date().getTime() - 1000 * 60 * 3), // 3 mins ago
              read: false,
          });
      }
      if (jobs.length > 0) {
          newNotifs.push({
              id: `notif-job-${jobs[0].id}`, type: 'job',
              message: `New opportunity: ${jobs[0].title} at ${jobs[0].company}`,
              timestamp: new Date(new Date().getTime() - 1000 * 60 * 60 * 1), // 1 hour ago
              read: false,
          });
      }
      if (roommateProfiles.length > 1 && currentUserProfile) {
           newNotifs.push({
              id: `notif-roommate-${Date.now()}`, type: 'roommate',
              message: `You have new potential roommate matches!`,
              timestamp: new Date(new Date().getTime() - 1000 * 60 * 60 * 5), // 5 hours ago
              read: false,
          });
      }
      setNotifications(newNotifs.sort((a,b) => b.timestamp.getTime() - a.timestamp.getTime()));
    }
  }, [currentUser, isLoading, news, jobs, roommateProfiles]);


  const refreshAllData = async () => {
    // Re-fetch all data to reflect changes made in the admin panel
    const [hostelsData, newsData, eventsData, jobsData, profilesData] = await Promise.all([
        hostelService.getAll(),
        newsService.getAll(),
        eventService.getAll(),
        jobService.getAll(),
        roommateProfileService.getAll()
    ]);
    setHostels(hostelsData);
    setNews(newsData);
    setEvents(eventsData);
    setJobs(jobsData);
    setRoommateProfiles(profilesData);
  };

  // --- Modal Handlers ---
  const handleViewHostel = (hostel: Hostel) => setViewingHostel(hostel);
  const handleCloseModal = () => setViewingHostel(null);
  
  // --- Profile Update Handler ---
  const handleProfileUpdate = async (profileData: RoommateProfile): Promise<void> => {
    await roommateProfileService.set(profileData);
    const updatedProfiles = await roommateProfileService.getAll();
    setRoommateProfiles(updatedProfiles);
  };
  
  // --- Navigation ---
  const handleNavigation = (view: AppView) => {
    if (view === 'admin' && isAdmin) {
        setCurrentView('admin');
    } else if (view !== 'admin') {
        setCurrentView(view);
    }
    window.scrollTo(0, 0);
  };

  // --- Save Hostel Handler ---
  const handleToggleSaveHostel = (hostelId: string) => {
    if (!currentUser) {
        handleNavigation('auth');
        return;
    }
    setSavedHostels(prevSaved => {
        const newSaved = new Set(prevSaved);
        if (newSaved.has(hostelId)) {
            newSaved.delete(hostelId);
        } else {
            newSaved.add(hostelId);
        }
        return newSaved;
    });
  };
  
  const handleAuthSuccess = () => {
      // The onAuthStateChange listener handles setting the user.
      // We just need to navigate away from the auth page.
      handleNavigation('main');
  }
  
  const handleLogout = async () => {
      await authService.logout();
      // The onAuthStateChange listener will handle state cleanup.
      handleNavigation('auth');
  }
  
  const handleMarkNotificationsAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  // --- Page Content ---
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-unistay-bg">
        <Spinner size="lg" />
      </div>
    );
  }

  // Determine if top padding is needed based on the current view, as some views have their own headers.
  const requiresPadding = currentView === 'main';

  return (
    <NotificationProvider>
      <div className={`bg-white font-sans antialiased ${requiresPadding ? 'pt-20' : ''}`}>
        <Analytics />
        <Notifier />
        <Header
          onNavigate={handleNavigation}
          currentView={currentView}
          user={currentUser}
          isAdmin={isAdmin}
          onLogout={handleLogout}
          notifications={notifications}
          onMarkNotificationsAsRead={handleMarkNotificationsAsRead}
        />

        <main>
          {currentView === 'main' && (
            <>
              <Hero 
                hostels={hostels}
                onHostelSelect={handleViewHostel}
              />
              <FeaturedContent
                universities={UNIVERSITIES}
                selectedUniversity={selectedUniversity}
                onSelectUniversity={setSelectedUniversity}
                hostels={hostels}
                onViewHostel={handleViewHostel}
                savedHostelIds={savedHostels}
                onToggleSave={handleToggleSaveHostel}
              />
              <CommunityHub
                news={news}
                events={events}
                jobs={jobs}
                universities={UNIVERSITIES}
                onNavigateToBlog={() => handleNavigation('blog')}
                onNavigateToEvents={() => handleNavigation('events')}
                onNavigateToJobs={() => handleNavigation('jobs')}
                user={currentUser}
                onNavigate={handleNavigation}
              />
              <Services services={SERVICES} selectedUniversity={selectedUniversity} />
            </>
          )}
          
          {currentView === 'blog' && <BlogPage news={news} onNavigateHome={() => handleNavigation('main')} />}
          {currentView === 'events' && <EventsPage events={events} onNavigateHome={() => handleNavigation('main')} />}
          {currentView === 'jobs' && <JobsPage jobs={jobs} onNavigateHome={() => handleNavigation('main')} />}
          
          {currentView === 'roommateFinder' && currentUser && (
            <RoommateFinder
              currentUser={currentUser}
              currentUserProfile={roommateProfiles.find(p => p.id === currentUser.id) || null}
              onProfileUpdate={handleProfileUpdate}
              profiles={roommateProfiles}
              universities={UNIVERSITIES}
              onNavigateHome={() => handleNavigation('main')}
            />
          )}
          
          {currentView === 'auth' && <AuthPage onAuthSuccess={handleAuthSuccess} onNavigateHome={() => handleNavigation('main')} />}
          
          {currentView === 'admin' && isAdmin && (
            <AdminDashboard
              onExitAdminMode={() => handleNavigation('main')}
              content={{
                hostels: { items: hostels, handler: hostelHandler, universities: UNIVERSITIES },
                news: { items: news, handler: newsHandler },
                events: { items: events, handler: eventHandler },
                jobs: { items: jobs, handler: jobHandler },
                roommateProfiles: { items: roommateProfiles }
              }}
              onDataChange={refreshAllData}
            />
          )}

          {currentView === 'profile' && currentUser && (
              <ProfilePage
                  user={currentUser}
                  profile={roommateProfiles.find(p => p.id === currentUser.id)}
                  onNavigate={handleNavigation}
                  onSignOut={handleLogout}
                  universities={UNIVERSITIES}
                  onDataChange={refreshAllData}
                  savedHostels={Array.from(savedHostels).map(id => hostels.find(h => h.id === id)).filter(Boolean) as Hostel[]}
                  onToggleSaveHostel={handleToggleSaveHostel}
              />
          )}

        </main>

        {viewingHostel && <HostelDetailModal hostel={viewingHostel} onClose={handleCloseModal} />}
        
        {currentView !== 'admin' && currentView !== 'auth' && currentView !== 'roommateFinder' && currentView !== 'profile' && (
          <Footer
            onNavigateToRoommateFinder={() => handleNavigation('roommateFinder')}
            onNavigateToBlog={() => handleNavigation('blog')}
            onNavigateToAuth={() => handleNavigation('auth')}
            user={currentUser}
          />
        )}
      </div>
    </NotificationProvider>
  );
};

export default App;