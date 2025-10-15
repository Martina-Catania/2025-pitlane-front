'use client';

import React from 'react';
import CreateGroupForm from '@/components/groups/CreateGroupForm';
import { useUser } from '@/lib/contexts/UserContext';

export default function CreateGroupPage() {
  const { userData, loading } = useUser();

  // Show loading state or if no authenticated user
  if (loading) {
    return <div className="container mx-auto p-6">Loading user...</div>;
  }

  if (!userData?.profile) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center text-muted-foreground">You need to log in to create a group.</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <CreateGroupForm 
        userId={userData.profile.id}
        onSuccess={(groupId) => {
          // Redirigir al grupo creado será manejado por el componente
          console.log('Group created with ID:', groupId);
        }}
      />
    </div>
  );
}