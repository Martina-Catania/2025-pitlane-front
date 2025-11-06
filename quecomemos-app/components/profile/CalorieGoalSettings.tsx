'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

interface CalorieGoalSettingsProps {
  currentGoal: number
  onGoalUpdated?: (newGoal: number) => void
  onUpdate?: (newGoal: number) => Promise<boolean>
}

const PRESET_GOALS = [
  { label: 'Light', value: 1500, description: 'For light activity' },
  { label: 'Moderate', value: 2000, description: 'For moderate activity' },
  { label: 'Active', value: 2500, description: 'For intense activity' },
  { label: 'Athletic', value: 3200, description: 'For athletes and very high activity' }
]

export default function CalorieGoalSettings({ currentGoal, onGoalUpdated, onUpdate }: CalorieGoalSettingsProps) {
  const [goal, setGoal] = useState(currentGoal)
  const [isLoading, setIsLoading] = useState(false)

  const handleSave = async () => {
    try {
      setIsLoading(true)
      
      // Use the onUpdate prop if provided (preferred), otherwise fallback to API call
      if (onUpdate) {
        const success = await onUpdate(goal)
        if (success) {
          onGoalUpdated?.(goal)
          toast.success('Personal goal updated! 🎯')
        } else {
          toast.error('Error updating goal')
        }
        return
      }

      // Fallback to direct API call (requires onUpdate to be provided)
      toast.error('Update function not available')
    } catch (error) {
      console.error('Error updating calorie goal:', error)
      toast.error('Error updating goal')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center gap-2 justify-center">
          🎯 Customize Your Goal
        </CardTitle>
        <CardDescription>
          Adjust your daily caloric target according to your needs and lifestyle
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Presets rápidos */}
        <div>
          <Label className="text-sm font-medium mb-3 block">Quick Selection</Label>
          <div className="grid grid-cols-2 gap-2">
            {PRESET_GOALS.map((preset) => (
              <Button
                key={preset.value}
                variant={goal === preset.value ? "default" : "outline"}
                size="sm"
                onClick={() => setGoal(preset.value)}
                className="h-auto p-3 text-left flex flex-col items-start"
              >
                <span className="font-medium">{preset.label}</span>
                <span className="text-xs opacity-70">{preset.value} kcal</span>
              </Button>
            ))}
          </div>
        </div>

        {/* Slider personalizado */}
        <div className="space-y-4">
          <Label className="text-sm font-medium">Custom</Label>
          
          <div className="space-y-4">
            <Slider
              value={[goal]}
              onValueChange={(value) => setGoal(value[0])}
              min={1200}
              max={3500}
              step={50}
              className="w-full"
            />
            
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>1200 kcal</span>
              <Badge variant="secondary" className="text-base font-semibold">
                {goal.toLocaleString()} kcal
              </Badge>
              <span>3500 kcal</span>
            </div>
          </div>

          {/* Input directo */}
          <div className="flex items-center gap-2">
            <Label htmlFor="goal-input" className="text-sm">
              Or type directly:
            </Label>
            <Input
              id="goal-input"
              type="number"
              value={goal}
              onChange={(e) => setGoal(Math.max(1200, Math.min(3500, parseInt(e.target.value) || 2000)))}
              min={1200}
              max={3500}
              className="w-24"
            />
            <span className="text-sm text-muted-foreground">kcal</span>
          </div>
        </div>

        {/* Información contextual positiva */}
        <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950/20 dark:to-blue-950/20 p-4 rounded-lg border border-green-100 dark:border-green-800/30">
          <p className="text-sm text-green-700 dark:text-green-300 leading-relaxed">
            🌟 <strong>Remember:</strong> Your goal is a flexible guide that you can adjust according to your lifestyle, 
            activity level, and daily needs. The important thing is to maintain a balance that makes you feel good!
          </p>
        </div>

        {/* Botón guardar */}
        <Button 
          onClick={handleSave} 
          disabled={isLoading || goal === currentGoal}
          className="w-full"
        >
          {isLoading ? 'Saving...' : 'Save Goal'}
        </Button>
      </CardContent>
    </Card>
  )
}