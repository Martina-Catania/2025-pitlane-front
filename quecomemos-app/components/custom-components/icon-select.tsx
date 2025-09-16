"use client";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { Checkbox } from "../ui/checkbox";
import { createClient } from "@/lib/supabase/client";
import { FileObject } from "@supabase/storage-js";

interface IconSelectProps extends React.ComponentPropsWithoutRef<"div"> {
    onSelectionChange?: (selectedId: string) => void;
}
const supabase = createClient();
export function IconSelect({
    onSelectionChange,
    className,
    ...props
}: IconSelectProps) {
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [error, setError] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [data, setData] = useState<FileObject[] | null>(null);
    //bring images from supabase storage
    useEffect(() => {
        const fetchImages = async () => {
            const { data, error } = await supabase.storage.from('foodPhotos').list('', {
                limit: 100,
                offset: 0,
            });
            setData(data);
            setError(error);
        };

        fetchImages();
    }, []);
    console.log("data from supabase storage - ", data);

return (
    <div className={cn("grid grid-cols-4 gap-4", className)} {...props}>
        {isLoading && <p>Loading...</p>}
        {error && <p>Error: {error.message}</p>}
        {data?.map((file, index) => (
            <div key={file.id || index} className="flex flex-col items-center space-y-2">
                <Checkbox
                    checked={selectedOption === file.name}
                    onCheckedChange={(checked) => {
                        const newSelection = checked ? file.name : null;
                        setSelectedOption(newSelection);
                        onSelectionChange?.(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/foodPhotos/${newSelection}` || '');
                    }}
                />
                <span className="text-sm text-center">{file.name}</span>
            </div>
        ))}
    </div>
);
}
