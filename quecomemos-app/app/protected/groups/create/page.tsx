'use client';

import React from 'react';
import CreateGroupForm from '@/components/groups/CreateGroupForm';
import { useUser } from '@/lib/contexts/UserContext';

export default function CreateGroupPage() {
  const { userData, loading } = useUser();

  // Mostrar estado mientras cargamos o si no hay usuario autenticado
  if (loading) {
    return <div className="container mx-auto p-6">Cargando usuario...</div>;
  }

  if (!userData?.profile) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center text-muted-foreground">Necesitas iniciar sesión para crear un grupo.</div>
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