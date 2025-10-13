'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Users, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { API_BASE_URL } from '@/lib/config/api';

interface CreateGroupFormProps {
  userId: string;
  onSuccess?: (groupId: number) => void;
}

export function CreateGroupForm({ userId, onSuccess }: CreateGroupFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('El nombre del grupo es requerido');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const url = `${API_BASE_URL}/groups`;
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        createdBy: userId
      };
      console.debug('[DEBUG] CreateGroupForm.handleSubmit - request', { url, payload });

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const text = await response.text().catch(() => null);
        let errorData = null;
  try { errorData = text ? JSON.parse(text) : null; } catch { /* ignore parse errors */ }
        console.error('[DEBUG] CreateGroupForm.handleSubmit - failed', { status: response.status, statusText: response.statusText, body: text, parsed: errorData });
        throw new Error((errorData && errorData.error) || 'Error al crear el grupo');
      }

      const newGroup = await response.json();
      console.debug('[DEBUG] CreateGroupForm.handleSubmit - result', { newGroup });
      
      // Llamar callback de éxito si se proporciona
      if (onSuccess) {
        onSuccess(newGroup.GroupID);
      } else {
        // Redirigir al grupo creado
        router.push(`protected/groups/${newGroup.GroupID}`);
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Limpiar error cuando el usuario empiece a escribir
    if (error) {
      setError(null);
    }
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center space-x-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBack}
          className="p-2"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h1 className="text-2xl font-bold">Crear Nuevo Grupo</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="w-5 h-5 mr-2" />
            Información del Grupo
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre del Grupo *</Label>
              <Input
                id="name"
                type="text"
                placeholder="Ej: Familia González, Oficina Marketing, etc."
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                maxLength={100}
                required
              />
              <p className="text-sm text-muted-foreground">
                Elige un nombre descriptivo para tu grupo
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción (Opcional)</Label>
              <Textarea
                id="description"
                placeholder="Describe el propósito del grupo, tipo de comidas que comparten, etc."
                value={formData.description}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleChange('description', e.target.value)}
                maxLength={500}
                rows={4}
              />
              <p className="text-sm text-muted-foreground">
                Ayuda a los miembros a entender el propósito del grupo
              </p>
            </div>

            {error && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded">
                {error}
              </div>
            )}

            <div className="flex space-x-3">
              <Button
                type="submit"
                disabled={loading || !formData.name.trim()}
                className="flex-1"
              >
                {loading ? 'Creando...' : 'Crear Grupo'}
              </Button>
              
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                disabled={loading}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <h3 className="font-medium">¿Qué sucede después?</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start">
                <span className="w-2 h-2 bg-primary rounded-full mt-2 mr-3 flex-shrink-0" />
                Serás automáticamente el administrador del grupo
              </li>
              <li className="flex items-start">
                <span className="w-2 h-2 bg-primary rounded-full mt-2 mr-3 flex-shrink-0" />
                Podrás invitar a otros usuarios a unirse
              </li>
              <li className="flex items-start">
                <span className="w-2 h-2 bg-primary rounded-full mt-2 mr-3 flex-shrink-0" />
                Los miembros podrán registrar consumos grupales
              </li>
              <li className="flex items-start">
                <span className="w-2 h-2 bg-primary rounded-full mt-2 mr-3 flex-shrink-0" />
                El sistema filtrará alimentos según las restricciones de todos los miembros
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default CreateGroupForm;