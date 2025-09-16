"use client";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Checkbox } from "../ui/checkbox";
import React from "react";
interface CustomCheckboxProps extends React.ComponentPropsWithoutRef<"div"> {
    endpoint: string;
    onSelectionChange?: (selectedIds: number[]) => void;
}

export function CustomCheckbox({
    endpoint,
    onSelectionChange,
    className,
    ...props
}: CustomCheckboxProps) {
    const [selectedOptions, setSelectedOptions] = useState<number[]>([]);
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
            console.log("Fetched options:", data);
        } catch (error: unknown) {
            setError(error instanceof Error ? error.message : "An error occurred");
        } finally {
            setIsLoading(false);
        }
    };
    React.useEffect(() => {
        console.log("Selected options:", selectedOptions);
    }, [selectedOptions]);

    React.useEffect(() => {
        handleEndpoint();
    }, [endpoint]);

    return (
        <div className={cn("relative", className)} {...props}>
                <div className="flex flex-col gap-2">
                    {options.map(option => {
                        const optionId = option.PreferenceID || option.DietaryRestrictionID;
                        return (
                            <label key={optionId || option.name} className="flex items-center gap-2">
                                <Checkbox
                                    checked={optionId ? selectedOptions.includes(optionId) : false}
                                    onCheckedChange={(checked: boolean) => {
                                        if (optionId) {
                                            const newSelection = checked
                                                ? [...selectedOptions, optionId]
                                                : selectedOptions.filter(o => o !== optionId);
                                            setSelectedOptions(newSelection);
                                            onSelectionChange?.(newSelection);
                                        }
                                    }}
                                />
                                {option.name}
                            </label>
                        );
                    })}
                </div>
            </div>
    );
}