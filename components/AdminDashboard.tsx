import React, { useState, useEffect } from 'react';
import { Hostel, NewsItem, Event, Job, University, RoommateProfile } from '../types';
import Spinner from './Spinner';
import { hostelService, newsService, eventService, jobService, roommateProfileService } from '../services/dbService';
import { storageService } from '../services/storageService.ts';
import { useNotifier } from '../hooks/useNotifier';

interface UploadedImage {
    file: File;
    previewUrl: string;
}

// --- Helper Components ---
// FIX: Add explicit types to helper components to prevent type inference issues.
const Input = (props: React.ComponentPropsWithoutRef<'input'>) => <input {...props} className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-unistay-yellow focus:border-unistay-yellow" />;
const Textarea = (props: React.ComponentPropsWithoutRef<'textarea'>) => <textarea {...props} rows={4} className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-unistay-yellow focus:border-unistay-yellow" />;
const Select = (props: React.ComponentPropsWithoutRef<'select'>) => <select {...props} className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-unistay-yellow focus:border-unistay-yellow" />;

interface ButtonProps {
    children: React.ReactNode;
    onClick?: React.MouseEventHandler<HTMLButtonElement>;
    className?: string;
    type?: 'button' | 'submit' | 'reset';
    disabled?: boolean;
    loading?: boolean;
}

const Button = ({ children, onClick, className = 'bg-unistay-navy text-white hover:bg-opacity-90', type = 'button', disabled = false, loading = false }: ButtonProps) => (
    <button type={type} onClick={onClick} disabled={disabled || loading} className={`px-4 py-2 font-semibold rounded-md transition-all duration-200 disabled:bg-opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${className}`}>
        {loading ? <Spinner color={className.includes('text-unistay-navy') ? 'navy' : 'white'} size="sm" /> : children}
    </button>
);

const ActionButton = ({ icon, onClick, colorClass = 'text-gray-500 hover:text-unistay-navy', loading = false }) => (
    <button onClick={onClick} disabled={loading} className={`p-1 ${colorClass} transition-colors disabled:text-gray-400 disabled:cursor-not-allowed w-6 h-6 flex items-center justify-center`}>
        {loading ? <Spinner color="navy" size="sm" /> : <i className={`fas ${icon}`}></i>}
    </button>
);

// --- NEW: Statistics Components ---
const StatCard = ({ icon, title, value }) => (
    <div className="bg-white p-6 rounded-2xl shadow-lg flex items-center gap-6 transform hover:-translate-y-1 transition-transform duration-300">
        <div className="bg-unistay-yellow/20 text-unistay-navy rounded-full h-16 w-16 flex items-center justify-center flex-shrink-0">
            <i className={`fas ${icon} text-3xl`}></i>
        </div>
        <div>
            <p className="text-gray-500 font-semibold">{title}</p>
            <p className="text-4xl font-extrabold text-unistay-navy">{value}</p>
        </div>
    </div>
);

const DashboardStats = ({ stats, isLoading }) => {
    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Spinner size="lg" />
            </div>
        );
    }

    const statItems = [
        { icon: 'fa-hotel', title: 'Total Hostels', value: stats.hostels },
        { icon: 'fa-users', title: 'Roommate Profiles', value: stats.roommateProfiles },
        { icon: 'fa-newspaper', title: 'News Articles', value: stats.news },
        { icon: 'fa-calendar-alt', title: 'Upcoming Events', value: stats.events },
        { icon: 'fa-briefcase', title: 'Job Listings', value: stats.jobs },
    ];

    return (
        <div>
            <h2 className="text-3xl font-bold text-unistay-navy mb-6">Dashboard Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {statItems.map((stat, index) => (
                    <div key={stat.title} className="animate-fade-in-up" style={{ animationDelay: `${index * 100}ms` }}>
                        <StatCard {...stat} />
                    </div>
                ))}
            </div>
        </div>
    );
};


// --- Form Components ---

interface NewsFormData {
    id?: string;
    title: string;
    description: string;
    source: string;
    images: UploadedImage[];
    imageUrl?: string;
}

interface NewsFormProps {
    item?: NewsFormData;
    onSubmit: (data: any) => void;
    onCancel: () => void;
    isSubmitting: boolean;
}

const NewsForm: React.FC<NewsFormProps> = ({ item, onSubmit, onCancel, isSubmitting }) => {
    const [formData, setFormData] = useState<NewsFormData>({
        title: item?.title || '',
        description: item?.description || '',
        source: item?.source || '',
        featured: item?.featured || false,
        images: item?.imageUrl ? [{ file: null as any, previewUrl: item.imageUrl }] : []
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        // Convert FileList to array and process each file
        Array.from(files).forEach((file: File) => {
            // Create a local URL for preview
            const imageUrl = URL.createObjectURL(file);
            setFormData(prev => ({
                ...prev,
                images: [...prev.images, { file, previewUrl: imageUrl }]
            }));
        });
    };

    const removeImage = (index: number) => {
        setFormData(prev => ({
            ...prev,
            images: prev.images.filter((_, i) => i !== index)
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (formData.images.length === 0) {
            alert('Please upload at least one image');
            return;
        }

        try {
            // Identify new images that need uploading
            const newImages = formData.images.filter(img => img.file);
            let imageUrl = item?.imageUrl;

            // Only upload if we have new images
            if (newImages.length > 0) {
                const files = newImages.map(img => img.file);
                const timestamp = new Date().getTime();
                const newsFolder = `${item?.id || timestamp}`;
                const uploadedUrls = await storageService.uploadMultipleImages(files, 'news', newsFolder);
                imageUrl = uploadedUrls[0]; // Use the first new image

                // Delete old image if we're replacing it
                if (item?.id && item.imageUrl) {
                    try {
                        await storageService.deleteImage(item.imageUrl, 'news');
                    } catch (error) {
                        console.warn('Failed to delete old news image:', error);
                    }
                }
            }

            // Submit with image URL (either existing or new)
            onSubmit({
                ...formData,
                imageUrl,
                timestamp: new Date().toISOString(), // Add current timestamp
                images: undefined // Remove the temporary images array
            });
        } catch (error) {
            console.error('Error uploading news images:', error);
            alert('Failed to upload images. Please try again.');
        }
    };
    return (
        <form onSubmit={handleSubmit} className="space-y-4 p-4 bg-gray-50 rounded-lg">
            <Input name="title" value={formData.title} onChange={handleChange} placeholder="Title" required />
            <Textarea name="description" value={formData.description} onChange={handleChange} placeholder="Description" required />
            
            {/* Image Upload Section */}
            <div className="space-y-4">
                <Input 
                    type="file" 
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="w-full"
                    required={formData.images.length === 0}
                />
                
                {/* Image Preview Grid */}
                {formData.images.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {formData.images.map((img, index) => (
                            <div key={index} className="relative group">
                                <img
                                    src={img.previewUrl}
                                    alt={`Preview ${index + 1}`}
                                    className="w-full h-32 object-cover rounded-lg"
                                />
                                <button
                                    type="button"
                                    onClick={() => removeImage(index)}
                                    className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <i className="fas fa-times" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <Input name="source" value={formData.source} onChange={handleChange} placeholder="Source" required />
            
            <div className="flex items-center my-4">
                <input
                    id="featured"
                    name="featured"
                    type="checkbox"
                    checked={formData.featured}
                    onChange={handleChange}
                    className="h-4 w-4 text-unistay-yellow focus:ring-unistay-yellow border-gray-300 rounded"
                />
                <label htmlFor="featured" className="ml-2 text-sm font-medium text-gray-700">
                    Set as Featured News
                </label>
            </div>
            
            <div className="flex gap-2 justify-end">
                <Button onClick={onCancel} className="bg-gray-200 text-gray-800 hover:bg-gray-300">Cancel</Button>
                <Button type="submit" loading={isSubmitting}>{item ? 'Update' : 'Add'} News</Button>
            </div>
        </form>
    );
};

interface EventFormData {
    id?: string;
    title: string;
    dateInput: string;
    location: string;
    images: UploadedImage[];
    date?: string;
    imageUrl?: string;
    price?: string;
    description?: string;
    contacts?: string[];
    phone?: string;
    email?: string;
    time?: string;
}

interface EventFormProps {
    item?: EventFormData;
    onSubmit: (data: any) => void;
    onCancel: () => void;
    isSubmitting: boolean;
}

const EventForm: React.FC<EventFormProps> = ({ item, onSubmit, onCancel, isSubmitting }) => {
    const toInputDate = (dateStr: string) => dateStr ? new Date(dateStr).toISOString().split('T')[0] : '';
    const [formData, setFormData] = useState<EventFormData>({
        title: item?.title || '',
        dateInput: item ? toInputDate(item.date) : '',
        location: item?.location || '',
        price: item?.price || 'Free Entry',
        description: item?.description || '',
        contacts: item?.contacts || [''],
        phone: item?.phone || '',
        email: item?.email || '',
        time: item?.time || '',
        images: item?.imageUrl ? [{ file: null as any, previewUrl: item.imageUrl }] : []
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        Array.from(files).forEach((file: File) => {
            const imageUrl = URL.createObjectURL(file);
            setFormData(prev => ({
                ...prev,
                images: [...prev.images, { file, previewUrl: imageUrl }]
            }));
        });
    };

    const removeImage = (index: number) => {
        setFormData(prev => ({
            ...prev,
            images: prev.images.filter((_, i) => i !== index)
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.images.length === 0) {
            alert('Please upload at least one image');
            return;
        }

        try {
            // Upload images to events bucket
            const files = formData.images.map(img => img.file);
            const timestamp = new Date().getTime();
            const eventFolder = `${item?.id || timestamp}`;
            const uploadedUrls = await storageService.uploadMultipleImages(files, 'events', eventFolder);

            // If updating, delete old images
            if (item?.id && item.imageUrl) {
                try {
                    await storageService.deleteImage(item.imageUrl, 'events');
                } catch (error) {
                    console.warn('Failed to delete old event image:', error);
                }
            }

            const eventDate = new Date(`${formData.dateInput}T12:00:00`);
            const processedEvent = {
                ...formData,
                date: eventDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
                day: eventDate.toLocaleDateString('en-US', { day: '2-digit' }),
                month: eventDate.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
                imageUrl: uploadedUrls[0], // Use first uploaded image as primary
                price: formData.price || 'Free Entry',
                description: formData.description?.trim(),
                contacts: formData.contacts?.filter(contact => contact.trim()),
                phone: formData.phone?.trim(),
                email: formData.email?.trim(),
                time: formData.time,
                images: undefined // Remove the temporary images array
            };
            delete processedEvent.dateInput;
            onSubmit(processedEvent);
        } catch (error) {
            console.error('Error uploading event images:', error);
            alert('Failed to upload images. Please try again.');
        }
    };

    const addContact = () => {
        setFormData(prev => ({
            ...prev,
            contacts: [...(prev.contacts || []), '']
        }));
    };

    const removeContact = (index: number) => {
        setFormData(prev => ({
            ...prev,
            contacts: prev.contacts?.filter((_, i) => i !== index) || []
        }));
    };

    const updateContact = (index: number, value: string) => {
        const newContacts = [...(formData.contacts || [])];
        newContacts[index] = value;
        setFormData(prev => ({
            ...prev,
            contacts: newContacts
        }));
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 p-4 bg-gray-50 rounded-lg">
            <Input name="title" value={formData.title} onChange={handleChange} placeholder="Title" required />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input name="dateInput" type="date" value={formData.dateInput} onChange={handleChange} required />
                <Input name="time" type="time" value={formData.time} onChange={handleChange} placeholder="Time" required />
            </div>

            <Input name="location" value={formData.location} onChange={handleChange} placeholder="Location" required />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                    <Input 
                        name="price" 
                        value={formData.price} 
                        onChange={handleChange} 
                        placeholder="Entrance Fee (e.g., 10000 or 'Free Entry')" 
                    />
                    <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, price: 'Free Entry' }))}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-unistay-yellow hover:text-unistay-navy"
                    >
                        Set as Free
                    </button>
                </div>
            </div>

            <Textarea 
                name="description" 
                value={formData.description} 
                onChange={handleChange} 
                placeholder="Event Description" 
                required 
            />

            {/* Contact Information */}
            <div className="space-y-4">
                <h3 className="font-semibold text-gray-700">Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input 
                        name="phone" 
                        value={formData.phone} 
                        onChange={handleChange} 
                        placeholder="Contact Phone" 
                    />
                    <Input 
                        name="email" 
                        type="email" 
                        value={formData.email} 
                        onChange={handleChange} 
                        placeholder="Contact Email" 
                    />
                </div>

                {/* Contact Persons */}
                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <label className="text-sm text-gray-700">Contact Persons</label>
                        <button
                            type="button"
                            onClick={addContact}
                            className="text-sm text-unistay-yellow hover:text-unistay-navy transition-colors"
                        >
                            <i className="fas fa-plus mr-1"></i>
                            Add Contact
                        </button>
                    </div>
                    {formData.contacts?.map((contact, index) => (
                        <div key={index} className="flex gap-2">
                            <Input
                                value={contact}
                                onChange={(e) => updateContact(index, e.target.value)}
                                placeholder="Contact Person Name"
                            />
                            <button
                                type="button"
                                onClick={() => removeContact(index)}
                                className="text-red-500 hover:text-red-700"
                            >
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Image Upload Section */}
            <div className="space-y-4">
                <Input 
                    type="file" 
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="w-full"
                    required={formData.images.length === 0}
                />
                
                {/* Image Preview Grid */}
                {formData.images.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {formData.images.map((img, index) => (
                            <div key={index} className="relative group">
                                <img
                                    src={img.previewUrl}
                                    alt={`Preview ${index + 1}`}
                                    className="w-full h-32 object-cover rounded-lg"
                                />
                                <button
                                    type="button"
                                    onClick={() => removeImage(index)}
                                    className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <i className="fas fa-times" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="flex gap-2 justify-end pt-4 border-t">
                <Button onClick={onCancel} className="bg-gray-200 text-gray-800 hover:bg-gray-300">Cancel</Button>
                <Button type="submit" loading={isSubmitting}>{item ? 'Update' : 'Add'} Event</Button>
            </div>
        </form>
    );
};

interface JobFormData {
    id?: string;
    title: string;
    deadline: string;
    company: string;
    images: UploadedImage[];
    imageUrl?: string;
}

interface JobFormProps {
    item?: JobFormData;
    onSubmit: (data: any) => void;
    onCancel: () => void;
    isSubmitting: boolean;
}

const JobForm: React.FC<JobFormProps> = ({ item, onSubmit, onCancel, isSubmitting }) => {
    const [formData, setFormData] = useState<JobFormData>({
        title: item?.title || '',
        deadline: item?.deadline || '',
        company: item?.company || '',
        images: []
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        Array.from(files).forEach((file: File) => {
            const imageUrl = URL.createObjectURL(file);
            setFormData(prev => ({
                ...prev,
                images: [...prev.images, { file, previewUrl: imageUrl }]
            }));
        });
    };

    const removeImage = (index: number) => {
        setFormData(prev => ({
            ...prev,
            images: prev.images.filter((_, i) => i !== index)
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.images.length === 0) {
            alert('Please upload at least one image');
            return;
        }

        try {
            // Upload images to jobs bucket
            const files = formData.images.map(img => img.file);
            const timestamp = new Date().getTime();
            const jobFolder = `${item?.id || timestamp}`;
            const uploadedUrls = await storageService.uploadMultipleImages(files, 'jobs', jobFolder);

            // If updating, delete old images
            if (item?.id && item.imageUrl) {
                try {
                    const oldImagePath = item.imageUrl.split('/').slice(-2).join('/');
                    await storageService.deleteImage(oldImagePath, 'jobs');
                } catch (error) {
                    console.warn('Failed to delete old job image:', error);
                }
            }

            // Submit with uploaded image URL
            onSubmit({
                ...formData,
                imageUrl: uploadedUrls[0], // Use first uploaded image as primary
                images: undefined // Remove the temporary images array
            });
        } catch (error) {
            console.error('Error uploading job images:', error);
            alert('Failed to upload images. Please try again.');
        }
    };
    return (
        <form onSubmit={handleSubmit} className="space-y-4 p-4 bg-gray-50 rounded-lg">
            <Input name="title" value={formData.title} onChange={handleChange} placeholder="Title" required />
            <Input name="deadline" value={formData.deadline} onChange={handleChange} placeholder="Deadline (e.g., July 15th)" required />
            <Input name="company" value={formData.company} onChange={handleChange} placeholder="Company" required />
            
            {/* Image Upload Section */}
            <div className="space-y-4">
                <Input 
                    type="file" 
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="w-full"
                    required={formData.images.length === 0}
                />
                
                {/* Image Preview Grid */}
                {formData.images.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {formData.images.map((img, index) => (
                            <div key={index} className="relative group">
                                <img
                                    src={img.previewUrl}
                                    alt={`Preview ${index + 1}`}
                                    className="w-full h-32 object-cover rounded-lg"
                                />
                                <button
                                    type="button"
                                    onClick={() => removeImage(index)}
                                    className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <i className="fas fa-times" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="flex gap-2 justify-end">
                <Button onClick={onCancel} className="bg-gray-200 text-gray-800 hover:bg-gray-300">Cancel</Button>
                <Button type="submit" loading={isSubmitting}>{item ? 'Update' : 'Add'} Job</Button>
            </div>
        </form>
    );
};

interface HostelFormData {
    id?: string;
    name: string;
    location: string;
    priceRange: string;
    images: UploadedImage[];
    imageUrls?: string[];
    rating: number;
    universityId: string;
    description: string;
    amenities: Array<{ name: string; icon: string }>;
    isRecommended: boolean;
}

interface HostelFormProps {
    item?: HostelFormData;
    onSubmit: (data: HostelFormData & { imageUrl: string; imageUrls: string[] }) => void;
    onCancel: () => void;
    universities: Array<{ id: string; name: string }>;
    isSubmitting: boolean;
}

// Replace your HostelForm component with this fixed version

const HostelForm: React.FC<HostelFormProps> = ({ item, onSubmit, onCancel, universities, isSubmitting }) => {
    // Ensure we always have a valid UUID for universityId
    const defaultUniversity = universities.find(u => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(u.id));
    const defaultUniversityId = defaultUniversity?.id || '123e4567-e89b-12d3-a456-426614174001';

    // FIX: Ensure images is always initialized as an array
    const [formData, setFormData] = useState<HostelFormData>({
        name: item?.name || '', 
        location: item?.location || '', 
        priceRange: item?.priceRange || '', 
        images: item?.images || [], // FIX: Add fallback to empty array
        rating: item?.rating || 4.0, 
        universityId: item?.universityId || defaultUniversityId,
        description: item?.description || '', 
        amenities: item?.amenities || [], // FIX: Add fallback to empty array
        isRecommended: item?.isRecommended || false
    });
    
    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        // Convert FileList to array and process each file
        Array.from(files).forEach((file: File) => {
            // Create a local URL for preview
            const imageUrl = URL.createObjectURL(file);
            setFormData(prev => ({
                ...prev,
                images: [...(prev.images || []), { file, previewUrl: imageUrl } as UploadedImage] // FIX: Add fallback
            }));
        });
    };

    const removeImage = (index: number) => {
        setFormData(prev => ({
            ...prev,
            images: (prev.images || []).filter((_, i) => i !== index) // FIX: Add fallback
        }));
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleAmenityChange = (index: number, field: 'name' | 'icon', value: string) => {
        const newAmenities = [...(formData.amenities || [])]; // FIX: Add fallback
        newAmenities[index][field] = value;
        setFormData(prev => ({ ...prev, amenities: newAmenities }));
    };

    const addAmenity = () => {
        setFormData(prev => ({ ...prev, amenities: [...(prev.amenities || []), { name: '', icon: 'fas fa-check' }] })); // FIX: Add fallback
    };

    const removeAmenity = (index: number) => {
        const newAmenities = (formData.amenities || []).filter((_, i) => i !== index); // FIX: Add fallback
        setFormData(prev => ({ ...prev, amenities: newAmenities }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // FIX: Add safe length check
        if (!formData.images || formData.images.length === 0) {
            alert('Please upload at least one image');
            return;
        }
        
        try {
            // Upload all images to Supabase storage in the hostels bucket
            const files = formData.images.map(img => img.file);
            
            // Create a unique folder for each hostel using timestamp
            const timestamp = new Date().getTime();
            const hostelFolder = `${item?.id || timestamp}`;
            
            const uploadedUrls = await storageService.uploadMultipleImages(files, 'hostels', hostelFolder);
            
            // If we're updating an existing hostel, delete old images if they've changed
            if (item?.id && item.imageUrls) {
                const oldUrls = new Set(item.imageUrls);
                const newUrls = new Set(uploadedUrls);
                const urlsToDelete = item.imageUrls.filter(url => !newUrls.has(url));
                
                // Delete old images that are no longer used
                await Promise.all(
                    urlsToDelete.map(async (url) => {
                        try {
                            await storageService.deleteImage(url, 'hostels');
                        } catch (error) {
                            console.warn('Failed to delete old image:', url, error);
                        }
                    })
                );
            }

            // Prepare the hostel data with both imageUrl and imageUrls
            const hostelData = {
                ...formData,
                rating: formData.rating,
                imageUrl: uploadedUrls[0],
                imageUrls: uploadedUrls,
                images: undefined
            };
            
            onSubmit(hostelData);
        } catch (error) {
            console.error('Error uploading images:', error);
            alert('Failed to upload images. Please try again.');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input name="name" value={formData.name} onChange={handleChange} placeholder="Hostel Name" required />
                <div className="space-y-4">
                    <Input 
                        type="file" 
                        multiple 
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="w-full"
                        required={(formData.images?.length || 0) === 0}
                    />
                    
                    {/* FIX: Add safe length check */}
                    {formData.images && formData.images.length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-4">
                            {formData.images.map((img, index) => (
                                <div key={index} className="relative group">
                                    <img
                                        src={img.previewUrl}
                                        alt={`Preview ${index + 1}`}
                                        className="w-full h-32 object-cover rounded-lg"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removeImage(index)}
                                        className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <i className="fas fa-times" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <Input name="location" value={formData.location} onChange={handleChange} placeholder="Location" required />
                <Input name="priceRange" value={formData.priceRange} onChange={handleChange} placeholder="Price Range (e.g., 800K - 1.4M)" required />
                <Input name="rating" type="number" step="0.1" min="0" max="5" value={formData.rating} onChange={handleChange} placeholder="Rating" required />
                <Select name="universityId" value={formData.universityId} onChange={handleChange}>
                    {universities.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </Select>
            </div>
            <Textarea name="description" value={formData.description} onChange={handleChange} placeholder="Description" required />
            <div>
                <h4 className="font-semibold mb-2">Amenities</h4>

                {/* Predefined amenity options */}
                <div className="mb-3">
                    {(() => {
                        const AMENITY_OPTIONS = [
                            { name: 'Wifi', icon: 'fas fa-wifi' },
                            { name: 'Swimming Pool', icon: 'fas fa-water' },
                            { name: 'Laundry', icon: 'fas fa-tshirt' },
                            { name: 'Parking', icon: 'fas fa-parking' },
                            { name: 'Canteen', icon: 'fa fa-shopping-bag' },
                            { name: 'Security', icon: 'fas fa-shield-alt' },
                            { name: 'Restaurant', icon: 'fas fa-utensils' },
                            { name: 'Study Area', icon: 'fas fa-book' },
                            { name: 'TV', icon: 'fas fa-tv' },
                            { name: 'Shuttle', icon: 'fas fa-bus' },
                            { name: 'Girls Only', icon: 'fa fa-female' },
                            { name: 'Boys Only', icon: 'fa fa-male' },
                            { name: 'Mixed', icon: 'fa fa-users' },
                            { name: 'Gym', icon: 'fa fa-dumbbell' },
                        ];

                        // FIX: Add safe check for amenities
                        const isSelected = (name) => (formData.amenities || []).some(a => a.name === name);
                        const toggleAmenityOption = (opt) => {
                            const amenities = formData.amenities || [];
                            const existsIndex = amenities.findIndex(a => a.name === opt.name);
                            if (existsIndex >= 0) {
                                const newAmenities = amenities.filter((_, i) => i !== existsIndex);
                                setFormData({ ...formData, amenities: newAmenities });
                            } else {
                                setFormData({ ...formData, amenities: [...amenities, { name: opt.name, icon: opt.icon }] });
                            }
                        };

                        return (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                                {AMENITY_OPTIONS.map(opt => (
                                    <button
                                        key={opt.name}
                                        type="button"
                                        onClick={() => toggleAmenityOption(opt)}
                                        className={`flex items-center gap-3 p-2 rounded-md border transition-colors text-sm text-gray-700 ${isSelected(opt.name) ? 'bg-unistay-yellow text-unistay-navy border-unistay-yellow' : 'bg-white hover:bg-gray-50'}`}
                                    >
                                        <i className={`${opt.icon} w-5 text-lg`} />
                                        <span>{opt.name}</span>
                                    </button>
                                ))}
                            </div>
                        );
                    })()}
                </div>

                {/* FIX: Add safe check for amenities */}
                <div className="flex flex-wrap gap-2 mb-2">
                    {(formData.amenities || []).map((amenity, index) => (
                        <div key={`${amenity.name}-${index}`} className="flex items-center gap-2 bg-white border rounded-full px-3 py-1 text-sm shadow-sm">
                            <i className={`${amenity.icon} text-sm`} />
                            <span className="whitespace-nowrap">{amenity.name}</span>
                            <button type="button" onClick={() => removeAmenity(index)} className="ml-1 text-red-500 hover:text-red-700">
                                <i className="fas fa-times" />
                            </button>
                        </div>
                    ))}
                </div>

                <div className="flex items-center gap-2">
                    <Input id="customAmenityName" placeholder="Custom amenity (e.g., Rooftop)" />
                    <Button onClick={() => {
                        const input = (document.getElementById('customAmenityName') as HTMLInputElement);
                        if (!input) return;
                        const val = input.value.trim();
                        if (!val) return;
                        setFormData({ ...formData, amenities: [...(formData.amenities || []), { name: val, icon: 'fas fa-check' }] });
                        input.value = '';
                    }} className="bg-unistay-yellow text-unistay-navy hover:bg-yellow-400"><i className="fas fa-plus mr-2"></i>Add Amenity</Button>
                </div>
            </div>
            <div className="flex items-center">
                <input id="isRecommended" name="isRecommended" type="checkbox" checked={formData.isRecommended} onChange={handleChange} className="h-4 w-4 text-unistay-yellow focus:ring-unistay-yellow border-gray-300 rounded" />
                <label htmlFor="isRecommended" className="ml-2 text-sm font-medium text-gray-700">Mark as Recommended</label>
            </div>
            <div className="flex gap-2 justify-end pt-4 border-t">
                <Button onClick={onCancel} className="bg-gray-200 text-gray-800 hover:bg-gray-300">Cancel</Button>
                <Button type="submit" loading={isSubmitting}>{item ? 'Update' : 'Add'} Hostel</Button>
            </div>
        </form>
    );
};

// --- Content Manager (Generic) ---

function ContentManager({ title, items, handler, columns, FormComponent, universities = [], onDataChange }) {
    const [editingItem, setEditingItem] = useState(null);
    const [isAdding, setIsAdding] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const { notify } = useNotifier();

    const handleEdit = (item) => {
        setEditingItem(item);
        setIsAdding(false);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this item?')) {
            setDeletingId(id);
            try {
                await handler.remove(id);
                notify({ message: 'Item deleted successfully!', type: 'success' });
                onDataChange();
            } catch (err) {
                notify({ message: err, type: 'error' });
            } finally {
                setDeletingId(null);
            }
        }
    };

    const handleAdd = () => {
        setEditingItem(null);
        setIsAdding(true);
    };

    const handleCancel = () => {
        setEditingItem(null);
        setIsAdding(false);
    };

    const handleSubmit = async (item) => {
        setIsSubmitting(true);
        try {
            // For hostels, the form component handles the image upload
            // so we just need to save the data
            if (item.id) {
                await handler.update(item.id, item);
                notify({ message: 'Item updated successfully!', type: 'success' });
            } else {
                await handler.add(item);
                notify({ message: 'Item added successfully!', type: 'success' });
            }
            onDataChange();
            handleCancel();
        } catch (err) {
            notify({ message: err, type: 'error' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const formProps = {
        onSubmit: handleSubmit,
        onCancel: handleCancel,
        item: editingItem,
        isSubmitting,
        ...(universities.length > 0 && { universities }) // Conditionally add universities prop
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-unistay-navy">{title}</h2>
                <Button onClick={handleAdd} className="bg-unistay-yellow text-unistay-navy hover:bg-yellow-400" disabled={isSubmitting || deletingId !== null}>
                    <i className="fas fa-plus mr-2"></i>Add New
                </Button>
            </div>
            {(isAdding || editingItem) && <FormComponent {...formProps} />}
            <div className="bg-white shadow rounded-lg overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            {columns.map(col => <th key={col.header} className="p-4 font-semibold text-sm">{col.header}</th>)}
                            <th className="p-4 font-semibold text-sm text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map(item => (
                            <tr key={item.id} className="border-b last:border-b-0 hover:bg-gray-50">
                                {columns.map(col => (
                                   <td key={col.accessor} className="p-4 text-sm text-gray-700 align-top">
                                       {typeof item[col.accessor] === 'boolean' ? 
                                           (item[col.accessor] ? 
                                               <span className="flex items-center justify-center"><i className="fas fa-star text-unistay-yellow"></i></span> :
                                               <span className="flex items-center justify-center"><i className="fas fa-minus text-gray-300"></i></span>) :
                                           item[col.accessor]
                                       }
                                   </td>
                                ))}
                                <td className="p-4 text-right">
                                    <div className="flex gap-3 justify-end">
                                        <ActionButton icon="fa-pencil-alt" onClick={() => handleEdit(item)} />
                                        <ActionButton icon="fa-trash" onClick={() => handleDelete(item.id)} colorClass="text-red-500 hover:text-red-700" loading={deletingId === item.id} />
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// --- Main Dashboard Component ---

type Section = 'Dashboard' | 'Hostels' | 'News' | 'Events' | 'Jobs';

interface AdminDashboardProps {
    onExitAdminMode: () => void;
    content: {
        hostels: { items: Hostel[]; handler: any; universities: University[] };
        news: { items: NewsItem[]; handler: any };
        events: { items: Event[]; handler: any };
        jobs: { items: Job[]; handler: any };
        roommateProfiles: { items: RoommateProfile[] };
    };
    onDataChange: () => void;
}


const AdminDashboard = ({ onExitAdminMode, content, onDataChange }: AdminDashboardProps) => {
    const [activeSection, setActiveSection] = useState<Section>('Dashboard');
    const [stats, setStats] = useState({ hostels: 0, news: 0, events: 0, jobs: 0, roommateProfiles: 0 });
    const [isLoadingStats, setIsLoadingStats] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            if (activeSection !== 'Dashboard') return;
            setIsLoadingStats(true);
            try {
                const [hostelsCount, newsCount, eventsCount, jobsCount, profilesCount] = await Promise.all([
                    hostelService.getCounts(),
                    newsService.getCounts(),
                    eventService.getCounts(),
                    jobService.getCounts(),
                    roommateProfileService.getCounts()
                ]);
                setStats({
                    hostels: hostelsCount,
                    news: newsCount,
                    events: eventsCount,
                    jobs: jobsCount,
                    roommateProfiles: profilesCount
                });
            } catch (error) {
                console.error("Failed to fetch dashboard stats", error);
                 setStats({ hostels: 0, news: 0, events: 0, jobs: 0, roommateProfiles: 0 });
            } finally {
                setIsLoadingStats(false);
            }
        };
        fetchStats();
    }, [activeSection]);


    const sections = {
        Hostels: {
            title: 'Manage Hostels',
            items: content.hostels.items,
            handler: content.hostels.handler,
            columns: [
                { header: 'Name', accessor: 'name' },
                { header: 'University', accessor: 'universityId' },
                { header: 'Price Range', accessor: 'priceRange' },
                { header: 'Recommended', accessor: 'isRecommended' },
            ],
            FormComponent: HostelForm,
            universities: content.hostels.universities,
        },
        News: {
            title: 'Manage News',
            items: content.news.items,
            handler: content.news.handler,
            columns: [
                { header: 'Title', accessor: 'title' },
                { header: 'Source', accessor: 'source' },
                { header: 'Featured', accessor: 'featured' },
            ],
            FormComponent: NewsForm,
        },
        Events: {
            title: 'Manage Events',
            items: content.events.items,
            handler: content.events.handler,
            columns: [
                { header: 'Title', accessor: 'title' },
                { header: 'Date', accessor: 'date' },
                { header: 'Location', accessor: 'location' },
            ],
            FormComponent: EventForm,
        },
        Jobs: {
            title: 'Manage Jobs',
            items: content.jobs.items,
            handler: content.jobs.handler,
            columns: [
                { header: 'Title', accessor: 'title' },
                { header: 'Company', accessor: 'company' },
                { header: 'Deadline', accessor: 'deadline' },
            ],
            FormComponent: JobForm,
        },
    };
    
    const icons = {
        Dashboard: 'fa-tachometer-alt',
        Hostels: 'fa-hotel',
        News: 'fa-newspaper',
        Events: 'fa-calendar-alt',
        Jobs: 'fa-briefcase',
    };
    
    const navItems: Section[] = ['Dashboard', 'Hostels', 'News', 'Events', 'Jobs'];

    return (
        <div className="flex min-h-screen bg-gray-100">
            <aside className="w-64 bg-unistay-navy text-white flex flex-col p-4">
                <div className="text-center py-4 mb-6">
                    <h1 className="text-3xl font-extrabold">Admin</h1>
                </div>
                <nav className="flex-grow">
                    {navItems.map(section => (
                        <button
                            key={section}
                            onClick={() => setActiveSection(section)}
                            className={`w-full text-left px-4 py-3 my-1 rounded-lg transition-colors flex items-center gap-3 ${
                                activeSection === section ? 'bg-unistay-yellow text-unistay-navy font-bold' : 'hover:bg-white/10'
                            }`}
                        >
                            <i className={`fas ${icons[section]} w-5`}></i>
                            {section}
                        </button>
                    ))}
                </nav>
                <div className="pt-4 border-t border-white/20">
                    <button
                        onClick={onExitAdminMode}
                        className="w-full text-left px-4 py-3 rounded-lg hover:bg-white/10 transition-colors flex items-center gap-3"
                    >
                        <i className="fas fa-arrow-left w-5"></i>
                        Back to Site
                    </button>
                </div>
            </aside>
            <main className="flex-1 p-8 overflow-y-auto">
                {activeSection === 'Dashboard' ? (
                     <DashboardStats 
                        stats={stats} 
                        isLoading={isLoadingStats} 
                     />
                ) : (
                    <ContentManager {...sections[activeSection]} onDataChange={onDataChange} />
                )}
            </main>
        </div>
    );
};

export default AdminDashboard;