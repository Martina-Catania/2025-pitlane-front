'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  ArrowLeft, 
  Users, 
  Settings, 
  UserMinus, 
  UserPlus,
  Activity,
  Clock,
  Crown,
  User,
  Trash2,
  LogOut,
  Edit2,
  Save,
  X
} from 'lucide-react';
import UserSearch from '@/components/groups/UserSearch';
import { GroupPreferencesBarChart } from '@/components/dashboard';
import { useUser } from '@/lib/contexts/UserContext';
import { useGlobalNotification } from '@/lib/contexts/NotificationContext';
import { useConfirmation } from '@/lib/hooks/useConfirmation';
import { ConfirmationModal } from '@/components/ui/confirmation-modal';
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
}

export default function GroupInfoPage() {
  const params = useParams();
  const router = useRouter();
  const groupId = params.id as string;
  const { userData } = useUser();
  
  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', description: '' });
  const [saving, setSaving] = useState(false);
  const currentUserId = userData?.profile?.id;

  const fetchGroup = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/groups/${groupId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Group not found');
        }
        throw new Error('Error loading group');
      }
      
      const data = await response.json();
      setGroup(data);
      setEditForm({ name: data.name, description: data.description || '' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    fetchGroup();
  }, [fetchGroup]);

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

  const handleSaveGroup = async () => {
    if (!group || !currentUserId) return;
    
    try {
      setSaving(true);
      const response = await fetch(`${API_BASE_URL}/groups/${groupId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editForm.name.trim(),
          description: editForm.description.trim() || undefined,
          userId: currentUserId
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error updating group');
      }

      await fetchGroup(); // Refresh group data
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating group:', error);
      showError('Error updating group', error instanceof Error ? error.message : 'Error updating the group');
    } finally {
      setSaving(false);
    }
  };

  const { confirmation, showConfirmation, handleConfirm, closeConfirmation } = useConfirmation();
  const { showSuccess, showError } = useGlobalNotification();

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (!currentUserId) return;

    showConfirmation({
      type: 'danger',
      title: 'Remove member',
      message: `Are you sure you want to remove ${memberName} from the group? This action cannot be undone.`,
      confirmText: 'Remove',
      cancelText: 'Cancel'
    }, async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/groups/${groupId}/members/${memberId}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ invitedById: currentUserId })
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          throw new Error((errorData && errorData.error) || 'Error removing member');
        }

        await fetchGroup();
                showSuccess('Member removed', `${memberName} was removed from the group.`);
      } catch (err) {
        console.error('Error removing member:', err);
        showError('Error removing member', err instanceof Error ? err.message : 'Error removing member');
        throw err;
      }
    });
  };

  const handleLeaveGroup = async () => {
    if (!currentUserId) return;

    showConfirmation({
      type: 'question',
      title: 'Leave group',
      message: `Are you sure you want to leave the group "${group?.name}"? You will need to be invited again to rejoin.`,
      confirmText: 'Leave',
      cancelText: 'Cancel'
    }, async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/groups/${groupId}/members/${currentUserId}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ requesterId: currentUserId })
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          throw new Error((errorData && errorData.error) || 'Error leaving group');
        }

        router.push('/protected/groups');
      } catch (err) {
        console.error('Error leaving group:', err);
        showError('Error leaving group', err instanceof Error ? err.message : 'Error leaving group');
        throw err;
      }
    });
  };

  const handleDeleteGroup = async () => {
    if (!currentUserId) return;

    showConfirmation({
      type: 'danger',
      title: 'Delete group',
      message: `Are you sure you want to delete the group "${group?.name}"? This action cannot be undone and all group data will be lost.`,
      confirmText: 'Delete',
      cancelText: 'Cancel'
    }, async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/groups/${groupId}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: currentUserId })
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          throw new Error((errorData && errorData.error) || 'Error deleting group');
        }

        router.push('/protected/groups');
      } catch (err) {
        console.error('Error deleting group:', err);
        showError('Error deleting group', err instanceof Error ? err.message : 'Error deleting the group');
        throw err;
      }
    });
  };

  // Invite section state & handler
  const [showInviteSection, setShowInviteSection] = useState(false);

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
          message: `You've been invited to join "${group?.name}"`
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error sending invitation');
      }

      // Show success message
      alert(`Invitation sent to ${username} successfully`);

    } catch (error) {
      console.error('Error inviting user:', error);
      alert(error instanceof Error ? error.message : 'Error sending invitation');
      throw error; // Re-throw para que UserSearch pueda manejarlo
    }
  };


  // Dashboard & history state
  interface GroupStats {
    totalMeals?: number;
    avgKcal?: number;
    totalConsumptionKcal?: number;
  }

  interface HistoryEntry {
    id: string | number;
    type: string;
    description?: string;
    date: string;
    user?: { id: string; username: string };
  }

  const [stats, setStats] = useState<GroupStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const fetchStats = useCallback(async () => {
    if (!group) return;
    try {
      setStatsLoading(true);
      const res = await fetch(`${API_BASE_URL}/groups/${groupId}/stats`);
      if (!res.ok) {
        // Endpoint may not exist yet - ignore gracefully
        setStats(null);
        return;
      }
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.debug('Could not fetch stats:', err);
      setStats(null);
    } finally {
      setStatsLoading(false);
    }
  }, [group, groupId]);

  const fetchHistory = useCallback(async () => {
    if (!group) return;
    try {
      setHistoryLoading(true);
      const res = await fetch(`${API_BASE_URL}/groups/${groupId}/history?limit=5`);
      if (!res.ok) {
        setHistory([]);
        return;
      }
      const data = await res.json();
      setHistory(data || []);
    } catch (err) {
      console.debug('Could not fetch history:', err);
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  }, [group, groupId]);

  useEffect(() => {
    if (group) {
      fetchStats();
      fetchHistory();
    }
  }, [group, fetchStats, fetchHistory]);

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="space-y-6">
          <div className="h-8 bg-muted animate-pulse rounded" />
          <div className="h-64 bg-muted animate-pulse rounded-lg" />
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
                  Back
                </Button>
                <Button onClick={fetchGroup}>
                  Retry
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
          <h1 className="text-3xl font-bold">Group Information</h1>
          <p className="text-muted-foreground mt-1">
            Manage group details and members
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Group Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <Settings className="w-5 h-5 mr-2" />
                Group Details
              </div>
              {isUserAdmin() && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (isEditing) {
                      setEditForm({ name: group.name, description: group.description || '' });
                      setIsEditing(false);
                    } else {
                      setIsEditing(true);
                    }
                  }}
                >
                  {isEditing ? <X className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Group name</label>
                  <Input
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    placeholder="Group name"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Description</label>
                  <Textarea
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    placeholder="Group description (optional)"
                    rows={3}
                  />
                </div>
                <div className="flex space-x-2">
                  <Button 
                    onClick={handleSaveGroup}
                    disabled={saving || !editForm.name.trim()}
                    className="flex-1"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {saving ? 'Saving...' : 'Save'}
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setEditForm({ name: group.name, description: group.description || '' });
                      setIsEditing(false);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium text-lg">{group.name}</p>
                </div>
                {group.description && (
                  <div>
                    <p className="text-sm text-muted-foreground">Description</p>
                    <p className="text-sm">{group.description}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">Created</p>
                  <p className="font-medium">{formatDate(group.createdAt)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Creator</p>
                  <div className="flex items-center space-x-2">
                    <Crown className="w-4 h-4 text-yellow-500" />
                    <p className="font-medium">{group.creator.username}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Your status</p>
                  <Badge variant={isMember() ? 'default' : 'secondary'}>
                    {isMember() ? 'Member' : 'Not a member'}
                  </Badge>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Members Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Group Members
              </div>
              <div className="flex items-center space-x-2">
                {isUserAdmin() && (
                  <Button variant="ghost" size="sm" onClick={() => setShowInviteSection(v => !v)}>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Invite
                  </Button>
                )}
                <Badge variant="outline">{group.members.length}</Badge>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {group.members.map((member) => (
                <div 
                  key={member.GroupMemberID}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-primary text-primary-foreground rounded-full text-sm font-medium">
                      {member.profile.username.charAt(0).toUpperCase()}
                    </div>
                    
                    <div>
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
                              Member
                            </>
                          )}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          Since {formatDate(member.joinedAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Remove member button - only for admins and not for the creator */}
                  {isUserAdmin() && member.profile.id !== group.createdBy && member.profile.id !== currentUserId && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-destructive"
                      onClick={() => handleRemoveMember(member.profile.id, member.profile.username)}
                    >
                      <UserMinus className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            {/* Sección de invitar usuarios */}
            {showInviteSection && isUserAdmin() && (
              <div className="mt-4">
                <h2 className="text-xl font-semibold">Invite Users</h2>
                <div className="mt-3">
                  <UserSearch
                    currentUserId={currentUserId || ''}
                    existingMemberIds={group.members.map(m => m.profile.id)}
                    onInvite={handleInviteUser}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      

      {/* Dashboard & History - new sections above Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
              <CardTitle className="flex items-center space-x-2">
              <Activity className="w-5 h-5 mr-2" />
              Group Dashboard
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="text-center py-8">Loading statistics...</div>
            ) : stats ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-3 border rounded">
                  <p className="text-sm text-muted-foreground">Total meals</p>
                  <p className="text-lg font-medium">{stats.totalMeals ?? '—'}</p>
                </div>
                <div className="p-3 border rounded">
                  <p className="text-sm text-muted-foreground">Average kcal</p>
                  <p className="text-lg font-medium">{stats.avgKcal ?? '—'}</p>
                </div>
                <div className="p-3 border rounded">
                  <p className="text-sm text-muted-foreground">Kcal consumed</p>
                  <p className="text-lg font-medium">{stats.totalConsumptionKcal ?? '—'}</p>
                </div>
              </div>
            ) : (
              <div className="text-muted-foreground">No statistics available yet.</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
              <CardTitle className="flex items-center space-x-2">
              <Clock className="w-5 h-5 mr-2" />
              Group History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {historyLoading ? (
              <div className="text-center py-8">Loading history...</div>
            ) : history && history.length > 0 ? (
              <div className="space-y-3">
                {history.map((h) => (
                  <div key={h.id} className="p-2 border rounded">
                    <p className="text-sm font-medium">{h.type}</p>
                    <p className="text-xs text-muted-foreground">{h.description}</p>
                    <p className="text-xs text-muted-foreground">{new Date(h.date).toLocaleString()}</p>
                  </div>
                ))}
                <div>
                  <Button variant="ghost" size="sm" onClick={() => router.push(`/protected/groups/${groupId}/history`)}>
                    View full history
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-muted-foreground">No recent activity.</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Group Preferences Bar Chart */}
      <GroupPreferencesBarChart groupId={groupId} members={group.members} />

      {/* Action Buttons */}
      {isMember() && (
        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Leave Group - for non-creators */}
              {currentUserId !== group.createdBy && (
                <Button 
                  variant="outline" 
                  className="text-orange-600 hover:text-orange-700"
                  onClick={handleLeaveGroup}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Leave group
                </Button>
              )}

              {/* Delete Group - only for creators */}
              {isUserAdmin() && currentUserId === group.createdBy && (
                <Button 
                  variant="destructive"
                  onClick={handleDeleteGroup}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete group
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
        {/* Confirmation modal injected globally for this page */}
        <ConfirmationModal
          isOpen={confirmation.isOpen}
          onClose={closeConfirmation}
          onConfirm={handleConfirm}
          type={confirmation.type}
          title={confirmation.title}
          message={confirmation.message}
          confirmText={confirmation.confirmText}
          cancelText={confirmation.cancelText}
          isLoading={confirmation.isLoading}
          customIcon={confirmation.customIcon}
        />
      </div>
    );
  }