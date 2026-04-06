"use client"

import manifest from "@/lib/react-icons-manifest.json";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { useEffect, useState } from "react";

export function IconPicker() {
    const [open, setOpen] = useState(false);
    const [selectedIcon, setSelectedIcon] = useState<string | null>();
    const [debouncedQuery, setDebouncedQuery] = useState("");
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        const id = setTimeout(() => {
            setDebouncedQuery(searchQuery)
            console.log("300 ms")
        }, 300);
        return () => clearTimeout(id);
    }, [searchQuery]);

    return (
        <Popover defaultOpen={false} open={open} onOpenChange={setOpen} >
            <PopoverTrigger asChild>
                <Button variant="outline">
                    Icon picker
                </Button>
            </PopoverTrigger>
            <PopoverContent align="center">
                <Command>
                    <CommandInput placeholder="Escribe el nombre de tu skill..." value={searchQuery} onValueChange={(input) => setSearchQuery(input) } />
                    <CommandList>
                        <CommandEmpty>
                            Iconos no encontrados...
                        </CommandEmpty>
                        <CommandGroup>
                            <CommandItem>
                                Hola...
                            </CommandItem>
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}