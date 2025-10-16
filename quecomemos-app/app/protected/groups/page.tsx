'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Users, Filter } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/lib/contexts/UserContext';
import { useMeals } from '@/lib/contexts/MealsContext';
import { useGlobalNotification } from '@/lib/contexts/NotificationContext';
import GroupCard from '@/components/groups/GroupCard';
import GroupInvitations from '@/components/groups/GroupInvitations';
import { RegisterMealModal } from '@/components/ui/registerMealModal';
import { API_BASE_URL } from '@/lib/config/api';

interface Group {
  GroupID: number;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  members: Array<{
    profile: {
      id: string;
      username: string;
    };
  }>;
  _count: {
    members: number;
    consumptions: number;
  };
}

export default function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [filteredGroups, setFilteredGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'mine' | 'member'>('all');
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [isRegisterMealModalOpen, setIsRegisterMealModalOpen] = useState(false);
  const [selectedGroupForMeal, setSelectedGroupForMeal] = useState<Group | null>(null);
  const router = useRouter();

  // Get the userId from the authentication context
  const { userData } = useUser();
  const { getMealById } = useMeals();
  const { showSuccess, showError } = useGlobalNotification();

  useEffect(() => {
    if (userData?.profile?.id) {
      setCurrentUserId(userData.profile.id);
    }
  }, [userData]);

  const fetchGroups = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/groups`);
      
      if (!response.ok) {
        throw new Error('Error loading groups');
      }
      
      const data = await response.json();
      setGroups(data);
      setFilteredGroups(data);
    } catch (error) {
      console.error('Error fetching groups:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  // Filtrar grupos basado en búsqueda y tipo
  useEffect(() => {
    let filtered = groups;

    // Filtrar por texto de búsqueda
    if (searchQuery) {
      filtered = filtered.filter(group =>
        group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (group.description && group.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Filtrar por tipo
    if (filterType !== 'all' && currentUserId) {
      filtered = filtered.filter(group => {
        const isMember = group.members.some(member => member.profile.id === currentUserId);
        if (filterType === 'mine') {
          // Grupos que he creado (necesitarías agregar createdBy al response)
          return isMember; // Por ahora usar isMember como proxy
        } else if (filterType === 'member') {
          return isMember;
        }
        return true;
      });
    }

    setFilteredGroups(filtered);
  }, [groups, searchQuery, filterType, currentUserId]);

  const handleCreateGroup = () => {
    router.push(`/protected/groups/create`);
  };

  const getFilterLabel = (type: string) => {
    switch (type) {
      case 'all': return 'All';
      case 'mine': return 'My groups';
      case 'member': return 'I\'m a member';
      default: return 'All';
    }
  };

  const openRegisterMealModal = (group: Group) => {
    setSelectedGroupForMeal(group);
    setIsRegisterMealModalOpen(true);
  };

  const closeRegisterMealModal = () => {
    setIsRegisterMealModalOpen(false);
    setSelectedGroupForMeal(null);
  };

  const handleRegisterGroupMeal = async (mealData: { mealId: number; date: string }) => {
    try {
      if (!userData?.profile) {
        showError('Authentication Required', 'Please make sure you are logged in to register a meal.');
        return;
      }

      if (!selectedGroupForMeal) {
        showError('Group Selection Required', 'Please select a group first.');
        return;
      }

      // Get the meal information from context
      const meal = getMealById(mealData.mealId);
      const mealName = meal?.name || `Meal #${mealData.mealId}`;

      const consumptionData = {
        name: mealName,
        description: `Group meal consumed on ${mealData.date}`,
        meals: [{
          mealId: mealData.mealId,
          quantity: 1
        }],
        profileId: userData.profile.id,
        groupId: selectedGroupForMeal.GroupID,
        consumedAt: mealData.date
      };

      const response = await fetch('http://localhost:3005/consumptions/group', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(consumptionData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to register group meal consumption');
      }

      const consumption = await response.json();
      console.log('Group meal consumption registered successfully:', consumption);
      
      showSuccess(
        'Group Meal Registered Successfully!', 
        `"${mealName}" has been recorded for ${selectedGroupForMeal.name} on ${mealData.date}.`
      );
      
      closeRegisterMealModal();
      
      // Refresh groups to update consumption count
      await fetchGroups();
      
    } catch (error) {
      console.error('Error registering group meal consumption:', error);
      showError(
        'Registration Failed',
        error instanceof Error ? error.message : 'An unexpected error occurred while registering the group meal. Please try again.'
      );
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Groups</h1>
          <Button disabled>
            <Plus className="w-4 h-4 mr-2" />
            Create Group
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div>
            <div className="h-64 bg-muted animate-pulse rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Groups</h1>
          <p className="text-muted-foreground">
            Manage your food groups and collaborate with other users
          </p>
        </div>
        <Button onClick={handleCreateGroup}>
          <Plus className="w-4 h-4 mr-2" />
          Create Group
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de grupos */}
        <div className="lg:col-span-2 space-y-6">
          {/* Búsqueda y filtros */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search groups..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <div className="flex space-x-2">
                  {(['all', 'mine', 'member'] as const).map((type) => (
                    <Button
                      key={type}
                      variant={filterType === type ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFilterType(type)}
                    >
                      <Filter className="w-3 h-3 mr-1" />
                      {getFilterLabel(type)}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Resultados */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  Groups
                </div>
                <Badge variant="secondary">
                  {filteredGroups.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            
            <CardContent>
              {filteredGroups.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  {searchQuery ? (
                    <>
                      <h3 className="text-lg font-medium mb-2">
                        No groups found
                      </h3>
                      <p className="text-muted-foreground mb-4">
                        No groups match your search &quot;{searchQuery}&quot;
                      </p>
                      <Button variant="outline" onClick={() => setSearchQuery('')}>
                        Clear search
                      </Button>
                    </>
                  ) : (
                    <>
                      <h3 className="text-lg font-medium mb-2">
                        No groups available
                      </h3>
                      <p className="text-muted-foreground mb-4">
                        Be the first to create a group to manage team meals
                      </p>
                      <Button onClick={handleCreateGroup}>
                        <Plus className="w-4 h-4 mr-2" />
                        Create my first group
                      </Button>
                    </>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredGroups.map((group) => (
                    <GroupCard 
                      key={group.GroupID} 
                      group={group} 
                      showActivity={false}
                      onRegisterMeal={openRegisterMealModal}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar con invitaciones */}
        <div className="space-y-6">
          {currentUserId && (
            <GroupInvitations userId={currentUserId} />
          )}
          
          {/* Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total groups</span>
                  <Badge variant="outline">{groups.length}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Results shown</span>
                  <Badge variant="outline">{filteredGroups.length}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Register Meal Modal */}
      <RegisterMealModal
        isOpen={isRegisterMealModalOpen}
        onClose={closeRegisterMealModal}
        onSubmit={handleRegisterGroupMeal}
      />
    </div>
  );
}