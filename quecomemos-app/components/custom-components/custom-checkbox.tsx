"use client";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { Checkbox } from "../ui/checkbox";
import React from "react";
interface CustomCheckboxProps extends React.ComponentPropsWithoutRef<"div"> {
    endpoint: string;
}

export function CustomCheckbox({
    endpoint,
    className,
    ...props
}: CustomCheckboxProps) {
    const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const [options, setOptions] = useState<Array<{PreferenceID?: number, DietaryRestrictionID?: number, name: string}>>([]);

    const handleEndpoint = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch(`http://localhost:3005/${endpoint}`, {
                method: "GET",
                headers: { "Content-Type": "application/json" },
            });
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Failed to fetch options");
            }
            const data = await response.json();
            setOptions(Array.isArray(data) ? data : []);
        } catch (error: unknown) {
            setError(error instanceof Error ? error.message : "An error occurred");
        } finally {
            setIsLoading(false);
        }
    };

    React.useEffect(() => {
        handleEndpoint();
    }, [endpoint]);

    return (
        <div className={cn("relative", className)} {...props}>
                <div className="flex flex-col gap-2">
                    {options.map(option => (
                        <label key={option.PreferenceID || option.DietaryRestrictionID || option.name} className="flex items-center gap-2">
                            <Checkbox
                                checked={selectedOptions.includes(option.name)}
                                onCheckedChange={(checked: boolean) => {
                                    setSelectedOptions(prev =>
                                        checked
                                            ? [...prev, option.name]
                                            : prev.filter(o => o !== option.name)
                                    );
                                }}
                            />
                            {option.name}
                        </label>
                    ))}
                </div>
            </div>
    );
}