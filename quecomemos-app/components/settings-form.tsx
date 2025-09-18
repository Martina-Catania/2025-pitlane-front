'use client';

import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { useUser } from '@/lib/contexts/UserContext';
import { createClient } from '@/lib/supabase/client';
import { Eye, EyeOff } from 'lucide-react';
import { AddUserDataForm } from './custom-components/add-user-data-form';


interface UserProfile {
  id: string;
  email: string;
  username?: string;
  role: string;
}

interface SettingsFormProps {
  initialProfile: UserProfile;
}

export function SettingsForm({ initialProfile }: SettingsFormProps) {
  const { updateProfile: updateUserProfile } = useUser();
  const [isUpdating, setIsUpdating] = useState(false);
  const [message, setMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authEmail, setAuthEmail] = useState('');
  const supabase = createClient();


  // Estados para cada sección
  const [profileData, setProfileData] = useState({
    username: initialProfile?.username || '',
    email: '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Fetch email from Supabase auth
  useEffect(() => {
    const fetchAuthEmail = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        const email = user.email;
        setAuthEmail(email);
        // Don't populate profileData.email - keep it empty for placeholder behavior
      }
    };

    fetchAuthEmail();
  }, [supabase]);

  // Sincronizar estado cuando cambie initialProfile
  useEffect(() => {
    setProfileData(prev => ({
      username: initialProfile?.username || '',
      email: prev.email, // Keep the current email value (empty or user-entered)
    }));
  }, [initialProfile]);

  const updateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    setMessage('');

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const jwt = sessionData.session?.access_token;

      // Actualizar username en el backend
      const response = await fetch(`http://localhost:3005/profile/${initialProfile.id}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${jwt}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: profileData.username.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }
      

      // Actualizar email en Supabase si cambió
      if (profileData.email && profileData.email !== authEmail) {
        const { error: emailError, data } = await supabase.auth.updateUser({
          email: profileData.email,
        });

        console.log('Email update response:', { data, emailError });
        if (emailError) {
          throw new Error('Failed to update email: ' + emailError.message);
        }
        
        // Update local auth email state after successful update
        setAuthEmail(profileData.email);
      }

      // Actualizar el perfil localmente en el contexto (sin refetch)
      updateUserProfile({ 
        username: profileData.username.trim(),
        email: profileData.email 
      });

      setMessage('Profile updated successfully!');

      // Opcional: pequeño delay para asegurar que los otros componentes se actualicen
      setTimeout(() => {
        setMessage('Profile updated successfully! Changes are reflected across the app.');
      }, 500);

    } catch (error) {
      setMessage('Error updating profile: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsUpdating(false);
    }
  };

  const updatePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setMessage('Password must be at least 6 characters long');
      return;
    }

    setIsUpdating(true);
    setMessage('');

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword,
      });

      if (error) {
        throw new Error('Failed to update password: ' + error.message);
      }

      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setMessage('Password updated successfully!');
    } catch (error) {
      setMessage('Error updating password: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-6">


        <div className="mt-6">
          <AddUserDataForm />
        </div>
      {/* Profile Information */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>
            Update your account's profile information and email address.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={updateProfile} className="space-y-4">
            <div>
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                value={profileData.username || ''}
                onChange={(e) => setProfileData(prev => ({ ...prev, username: e.target.value }))}
                placeholder="Enter username"
              />
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={profileData.email || ''}
                onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                placeholder={authEmail || 'Enter email'}
              />
            </div>

            <Button
              type="submit"
              disabled={isUpdating}
              className="w-full"
            >
              {isUpdating ? 'Updating...' : 'Update Profile'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Password Update */}
      <Card>
        <CardHeader>
          <CardTitle>Update Password</CardTitle>
          <CardDescription>
            Ensure your account is using a long, random password to stay secure.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={updatePassword} className="space-y-4">
            <div>
              <Label htmlFor="current-password">Current Password</Label>
              <Input
                id="current-password"
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                placeholder="Enter current password"
              />
            </div>

            <div>
              <Label htmlFor="new-password">New Password</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showPassword ? "text" : "password"}
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                  placeholder="Enter new password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div>
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <Input
                id="confirm-password"
                type={showPassword ? "text" : "password"}
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                placeholder="Confirm new password"
              />
            </div>

            <Button
              type="submit"
              disabled={isUpdating || !passwordData.newPassword || !passwordData.confirmPassword}
              className="w-full"
            >
              {isUpdating ? 'Updating...' : 'Update Password'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Messages */}
      {message && (
        <div className={`p-4 rounded-lg ${message.includes('Error') || message.includes('Failed')
            ? 'bg-red-50 text-red-700 border border-red-200'
            : 'bg-green-50 text-green-700 border border-green-200'
          }`}>
          {message}
        </div>
      )}
    </div>
  );
}