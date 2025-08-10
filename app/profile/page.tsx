'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

interface User {
    name: string;
    email: string;
    avatar: string;
    role: string;
    createdAt: string;
}

interface ProfileResponse {
    status: string;
    data: User;
}

export default function ProfilePage() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                // Get token from localStorage
                let token = localStorage.getItem('auth_token');
                
                // If token is stored in JSON format, parse it
                if (token?.startsWith('j:')) {
                    try {
                        token = JSON.parse(token.slice(2)).access_token;
                    } catch (err) {
                        console.error('Failed to parse token:', err);
                        setError('Invalid token format');
                        setLoading(false);
                        return;
                    }
                }

                if (!token) {
                    setError('No token found. Please login.');
                    setLoading(false);
                    return;
                }

                console.log('Token:', token);
                
                const response = await fetch('https://api-avalink.portos.cloud/api/user/me', {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                });

                if (!response.ok) {
                    setError(`Failed to fetch profile. Status: ${response.status}`);
                    setLoading(false);
                    return;
                }

                const data: ProfileResponse = await response.json();
                setUser(data.data);
            } catch (err) {
                setError('An error occurred while fetching profile');
                console.error('Profile fetch error:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, []);

    if (loading) {
        return <div className="text-center mt-8">Loading...</div>;
    }

    if (error) {
        return <div className="text-red-500 text-center mt-8">{error}</div>;
    }

    if (!user) {
        return <div className="text-red-500 text-center mt-8">No user data found</div>;
    }

    const handleLogout = () => {
        // Clear token from localStorage
        localStorage.removeItem('auth_token');
        // Redirect to login or home page
        window.location.href = '/login';
    };

    const handleBackToHome = () => {
        window.location.href = '/';
    };

    return (
        <div className="max-w-2xl mx-auto p-6 bg-white shadow-lg rounded-lg mt-8">
            <div className="flex items-center space-x-4 mb-6">
                <Image
                    src={user.avatar}
                    alt={user.name}
                    width={64}
                    height={64}
                    className="rounded-full object-cover"
                    priority
                />
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">{user.name}</h1>
                    <p className="text-gray-600">{user.email}</p>
                </div>
            </div>

            <div className="space-y-4">

                <div className="flex justify-between items-center py-2 border-b">
                    <span className="font-semibold text-gray-700">Role:</span>
                    <span className="text-gray-600 capitalize">{user.role}</span>
                </div>

                <div className="flex justify-between items-center py-2 border-b">
                    <span className="font-semibold text-gray-700">Member Since:</span>
                    <span className="text-gray-600">
                        {new Date(user.createdAt).toLocaleDateString()}
                    </span>
                </div>
            </div>

            <div className="mt-6 flex space-x-4">
                <button
                    onClick={handleBackToHome}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                >
                    Back to Home
                </button>
                <button
                    onClick={handleLogout}
                    className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                >
                    Logout
                </button>
            </div>
        </div>
    );
}
