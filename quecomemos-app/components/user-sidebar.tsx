'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { User, Settings, LogOut, X } from 'lucide-react';
import { Button } from './ui/button';
import { useUserProfile } from '@/lib/hooks/useUserProfile';

export function UserSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const { profile, loading, refetch } = useUserProfile();

  // Escuchar eventos de actualización de perfil
  useEffect(() => {
    const handleProfileUpdate = () => {
      refetch();
    };

    window.addEventListener('userProfileUpdated', handleProfileUpdate);

    return () => {
      window.removeEventListener('userProfileUpdated', handleProfileUpdate);
    };
  }, [refetch]);

  // Cerrar sidebar al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      // Prevenir scroll del body cuando el sidebar está abierto
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Cerrar sidebar con tecla ESC
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isOpen]);

  if (loading) {
    return (
      <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <>
      {/* Trigger Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="relative w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 p-0"
        aria-label="Open user menu"
      >
        <User className="w-4 h-4" />
      </Button>

      {/* Overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-25 z-40 transition-opacity" />
      )}

      {/* Sidebar */}
      <div
        ref={sidebarRef}
        className={`fixed top-0 right-0 h-full w-80 bg-neutral-900 shadow-xl z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold text-white">User Menu</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(false)}
            className="w-8 h-8 p-0 text-gray-300 hover:text-white hover:bg-gray-800"
            aria-label="Close menu"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* User Info */}
        <div className="p-4 border-b border-gray-700 bg-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-gray-200" />
            </div>
            <div>
              <div className="font-medium text-sm text-white">
                {profile.username || 'User'}
              </div>
              <div className="text-xs text-gray-300">{profile.email}</div>
              <div className="text-xs text-blue-400 capitalize font-medium">
                {profile.role}
              </div>
            </div>
          </div>
        </div>

        {/* Menu Items */}
        <div className="p-2">
          <Link
            href="/protected/settings"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 w-full p-3 text-left hover:bg-gray-800 rounded-lg transition-colors"
          >
            <Settings className="w-5 h-5 text-gray-300" />
            <div>
              <div className="font-medium text-sm text-white">Settings</div>
              <div className="text-xs text-gray-400">
                Update your profile and preferences
              </div>
            </div>
          </Link>

          <div className="mt-2 pt-2 border-t border-gray-700">
            <button 
              className="flex items-center gap-3 w-full p-3 text-left hover:bg-red-900 rounded-lg transition-colors text-red-400"
              onClick={() => {
                setIsOpen(false);
                // Llamar logout directamente
                import('@/lib/supabase/client').then(({ createClient }) => {
                  const supabase = createClient();
                  supabase.auth.signOut().then(() => {
                    window.location.href = '/auth/login';
                  });
                });
              }}
            >
              <LogOut className="w-5 h-5" />
              <div>
                <div className="font-medium text-sm">Sign Out</div>
                <div className="text-xs text-red-300">
                  Sign out of your account
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}