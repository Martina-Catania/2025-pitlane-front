'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Users, 
  Calendar, 
  Settings, 
  UserPlus, 
  Activity,
  Crown,
  User
} from 'lucide-react';
import UserSearch from '@/components/groups/UserSearch';
import { API_BASE_URL } from '@/lib/config/api';

interface GroupMember {
  GroupMemberID: number;
  role: string;
  joinedAt: string;
  profile: {
    id: string;
    username: string;
    role: string;
  };
}

interface Group {
  GroupID: number;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  members: GroupMember[];
  creator: {
    id: string;
    username: string;
    role: string;
  };
  consumptions?: Array<{
    ConsumptionID: number;
    name: string;
    consumedAt: string;
  }>;
}

// TODO: Obtener userId del contexto de autenticación
const DUMMY_USER_ID = 'dummy-user-id';

export default function GroupDetailPage() {
  const params = useParams();
  const router = useRouter();
  const groupId = params.id as string;
  
  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showInviteSection, setShowInviteSection] = useState(false);
  const [currentUserId] = useState(DUMMY_USER_ID);

  const fetchGroup = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/groups/${groupId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Grupo no encontrado');
        }
        throw new Error('Error al cargar el grupo');
      }
      
      const data = await response.json();
      setGroup(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    fetchGroup();
  }, [fetchGroup]);

  const handleInviteUser = async (userId: string, username: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/groups/${groupId}/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          invitedUserId: userId,
          invitedById: currentUserId,
          message: `Te han invitado a unirte al grupo "${group?.name}"`
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al enviar invitación');
      }

      // Mostrar mensaje de éxito
      alert(`Invitación enviada a ${username} exitosamente`);
      
    } catch (error) {
      console.error('Error inviting user:', error);
      alert(error instanceof Error ? error.message : 'Error al enviar invitación');
      throw error; // Re-throw para que UserSearch pueda manejarlo
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const isUserAdmin = () => {
    if (!group || !currentUserId) return false;
    return group.createdBy === currentUserId || 
           group.members.some(member => 
             member.profile.id === currentUserId && member.role === 'admin'
           );
  };

  const isMember = () => {
    if (!group || !currentUserId) return false;
    return group.members.some(member => member.profile.id === currentUserId);
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="space-y-6">
          <div className="h-8 bg-muted animate-pulse rounded" />
          <div className="h-64 bg-muted animate-pulse rounded-lg" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-48 bg-muted animate-pulse rounded-lg" />
            <div className="h-48 bg-muted animate-pulse rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !group) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center space-x-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="p-2"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-2xl font-bold">Error</h1>
        </div>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <p className="text-destructive mb-4">{error}</p>
              <div className="space-x-2">
                <Button variant="outline" onClick={() => router.back()}>
                  Volver
                </Button>
                <Button onClick={fetchGroup}>
                  Reintentar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="p-2"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{group.name}</h1>
          {group.description && (
            <p className="text-muted-foreground mt-1">{group.description}</p>
          )}
        </div>
        
        {isUserAdmin() && (
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={() => setShowInviteSection(!showInviteSection)}
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Invitar usuarios
            </Button>
            <Button variant="ghost" size="sm">
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Información del grupo */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              Información
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Creado</p>
              <p className="font-medium">{formatDate(group.createdAt)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Creador</p>
              <div className="flex items-center space-x-2">
                <Crown className="w-4 h-4 text-yellow-500" />
                <p className="font-medium">{group.creator.username}</p>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Estado</p>
              <Badge variant={isMember() ? 'default' : 'secondary'}>
                {isMember() ? 'Miembro' : 'No miembro'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Miembros
              </div>
              <Badge variant="outline">
                {group.members.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {group.members.map((member) => (
                <div 
                  key={member.GroupMemberID}
                  className="flex items-center space-x-3"
                >
                  <div className="flex items-center justify-center w-8 h-8 bg-primary text-primary-foreground rounded-full text-sm font-medium">
                    {member.profile.username.charAt(0).toUpperCase()}
                  </div>
                  
                  <div className="flex-1">
                    <p className="font-medium">{member.profile.username}</p>
                    <div className="flex items-center space-x-2">
                      <Badge variant={member.role === 'admin' ? 'default' : 'outline'} className="text-xs">
                        {member.role === 'admin' ? (
                          <>
                            <Crown className="w-3 h-3 mr-1" />
                            Admin
                          </>
                        ) : (
                          <>
                            <User className="w-3 h-3 mr-1" />
                            Miembro
                          </>
                        )}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="w-5 h-5 mr-2" />
              Actividad Reciente
            </CardTitle>
          </CardHeader>
          <CardContent>
            {group.consumptions && group.consumptions.length > 0 ? (
              <div className="space-y-3">
                {group.consumptions.slice(0, 5).map((consumption) => (
                  <div key={consumption.ConsumptionID} className="text-sm">
                    <p className="font-medium">{consumption.name}</p>
                    <p className="text-muted-foreground">
                      {formatDate(consumption.consumedAt)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <Activity className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  No hay actividad reciente
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Sección de invitar usuarios */}
      {showInviteSection && isUserAdmin() && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Invitar Usuarios</h2>
          <UserSearch
            currentUserId={currentUserId}
            existingMemberIds={group.members.map(m => m.profile.id)}
            onInvite={handleInviteUser}
          />
        </div>
      )}
    </div>
  );
}