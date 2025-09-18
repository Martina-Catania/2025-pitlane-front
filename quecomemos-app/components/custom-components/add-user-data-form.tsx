"use client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CustomCheckbox } from "@/components/custom-components/custom-checkbox";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
interface AddUserDataFormProps extends React.ComponentPropsWithoutRef<"div"> {
}

export function AddUserDataForm({
    className,
    ...props
}: AddUserDataFormProps) {
    const [preferences, setPreferences] = useState<any[]>([]);
    const [dietaryRestrictions, setDietaryRestrictions] = useState<any[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [user, setUser] = useState<any>(null);
    const supabase = createClient();

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
        };
        getUser();
    }, [supabase]);

    useEffect(() => {
        const getUserPreferences = async () => {
            if (!user) return;

            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.access_token) return;

            const response = await fetch(`http://localhost:3005/profile/${user.id}/full`, {
                headers: {
                    "Authorization": `Bearer ${session.access_token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setPreferences(data.Preference);
                setDietaryRestrictions(data.DietaryRestriction);
            }
        };

        getUserPreferences();
    }, [user, supabase]);

    const handleUpdateUserData = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        if (!user) {
            setError("User not authenticated");
            setIsLoading(false);
            return;
        }

        try {
            // Get the access token from Supabase session
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.access_token) {
                throw new Error("No valid session found");
            }


            // Use the preferences-and-restrictions endpoint
            const headers: HeadersInit = { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${session.access_token}`
            };

            // Use the profile ID from the authenticated user and the preferences-and-restrictions endpoint
            const response = await fetch(`http://localhost:3005/profile/${user.id}/preferences-and-restrictions`, {
                method: "PUT",
                headers,
                body: JSON.stringify({
                    preferences: preferences,
                    dietaryRestrictions: dietaryRestrictions,
                }),
            });
            
            
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Failed to update user preferences");
            }
            
            const result = await response.json();
            console.log("User preferences updated successfully", result);
            
            
        } catch (error: unknown) {
            console.error("Error updating preferences:", error);
            setError(error instanceof Error ? error.message : "An error occurred");
        } finally {
            setIsLoading(false);
        }
    };

    if (!user) {
        return (
            <div className={cn("max-w-md mx-auto", className)} {...props}>
                <Card>
                    <CardHeader>
                        <CardTitle>Authentication Required</CardTitle>
                        <CardDescription>Please log in to update your preferences</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-gray-600">You need to be logged in to access this feature.</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className={cn("max-w-md mx-auto", className)} {...props}>
            <Card>
                <CardHeader>
                    <CardTitle>Update Your Preferences</CardTitle>
                    <CardDescription>
                        Modify your food preferences and dietary restrictions
                        {user?.email && ` for ${user.email}`}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleUpdateUserData}>
                        <div className="grid gap-4">
                            <div>
                                <Label className="block mb-2">Preferences</Label>
                                <CustomCheckbox 
                                    initialOptions={preferences?.map(pref => pref.PreferenceID) || []}
                                    endpoint="preferences"
                                    onSelectionChange={setPreferences}
                                />
                            </div>
                            <div>
                                <Label className="block mb-2">Dietary Restrictions</Label>
                                <CustomCheckbox 
                                    initialOptions={dietaryRestrictions?.map(dr => dr.DietaryRestrictionID) || []}
                                    endpoint="dietary-restrictions"
                                    onSelectionChange={setDietaryRestrictions}
                                />
                            </div>
                        </div>
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mt-4">
                                {error}
                            </div>
                        )}
                        <Button type="submit" disabled={isLoading || !user} className="mt-4 w-full">
                            {isLoading ? "Updating..." : "Update Preferences"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}