'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Activity, Calendar } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface GroupMember {
  profile: {
    id: string;
    username: string;
  };
}

interface Group {
  GroupID: number;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  members: GroupMember[];
  _count: {
    consumptions: number;
  };
}

interface GroupCardProps {
  group: Group;
  showActivity?: boolean;
}

export function GroupCard({ group, showActivity = true }: GroupCardProps) {
  const router = useRouter();
  
const handleClick = () => {
    router.push(`/protected/groups/${group.GroupID}`);
};

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short'
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card 
      className="cursor-pointer hover:shadow-md transition-shadow duration-200"
      onClick={handleClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold truncate">
            {group.name}
          </CardTitle>
          {showActivity && (
            <Badge variant="secondary" className="ml-2">
              <Activity className="w-3 h-3 mr-1" />
              {group._count.consumptions}
            </Badge>
          )}
        </div>
        {group.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {group.description}
          </p>
        )}
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {group.members.length} miembro{group.members.length !== 1 ? 's' : ''}
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {formatDate(group.updatedAt)}
            </span>
          </div>
        </div>
        
        {/* Mostrar iniciales de algunos miembros */}
        <div className="flex items-center mt-3 space-x-1">
          {group.members.slice(0, 3).map((member) => (
            <div 
              key={member.profile.id} 
              className="flex items-center justify-center w-6 h-6 text-xs font-medium text-white bg-primary rounded-full border-2 border-background"
            >
              {getInitials(member.profile.username)}
            </div>
          ))}
          {group.members.length > 3 && (
            <div className="flex items-center justify-center w-6 h-6 text-xs text-muted-foreground bg-muted rounded-full">
              +{group.members.length - 3}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default GroupCard;