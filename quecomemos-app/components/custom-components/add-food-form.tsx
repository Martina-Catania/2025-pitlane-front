"use client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CustomCheckbox } from "@/components/custom-components/custom-checkbox";
import { DropdownWrapper } from "@/components/custom-components/dropdown-wrapper";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function AddFoodForm({
	className,
	...props
}: React.ComponentPropsWithoutRef<"div">) {
	const [foodName, setFoodName] = useState("");
	const [preferences, setPreferences] = useState<number[]>([]);
	const [restrictions, setRestrictions] = useState<number[]>([]);
	const [error, setError] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const handleAddFood = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);
		setError(null);

		try {
			const response = await fetch("http://localhost:3005/foods", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					name: foodName,
					svgLink: "",
					preferences: preferences,
					dietaryRestrictions: restrictions
				}),
			});
			console.log("response - ", response);
			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.error || "Failed to add food");
			}
		} catch (error: unknown) {
			setError(error instanceof Error ? error.message : "An error occurred");
		} finally {
			setIsLoading(false);
		}
	};
	console.log({ foodName, preferences, restrictions });

	return (
		<div className={cn("max-w-md mx-auto", className)} {...props}>
			<Card>
				<CardHeader>
					<CardTitle>Add Food</CardTitle>
					<CardDescription>Add a new food item to the list</CardDescription>
				</CardHeader>
				<CardContent>
					<form onSubmit={handleAddFood}>
						<div className="grid gap-4">
							<div>
								<Label htmlFor="food-name">Food Name</Label>
								<Input
									id="food-name"
									value={foodName}
									onChange={(e) => setFoodName(e.target.value)}
									required
								/>
							</div>
							<DropdownWrapper label="Preferences">
								<CustomCheckbox 
									endpoint={"preferences"} 
									onSelectionChange={setPreferences}
								/>
							</DropdownWrapper>
							<DropdownWrapper label="Dietary Restrictions">
								<CustomCheckbox 
									endpoint={"dietary-restrictions"} 
									onSelectionChange={setRestrictions}
								/>
							</DropdownWrapper>
						</div>
						{error && <p className="text-red-500">{error}</p>}
						<Button type="submit" disabled={isLoading} className="mt-2">
							{isLoading ? "Adding..." : "Add Food"}
						</Button>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}