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
    const [debouncedQuery, setDebouncedQuery] = useState<string | null>();
    const [searchQuery, setSearchQuery] = useState<string | null>();

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
                    { selectedIcon ? `Icono seleccionado: ${selectedIcon}` : "Icon picker" }
                </Button>
            </PopoverTrigger>
            <PopoverContent align="center">
                <Command shouldFilter={false}>
                    <CommandInput placeholder="Escribe el nombre de tu skill..." value={searchQuery || ""} onValueChange={(input) => setSearchQuery(input) } />
                    <CommandList>
                        <CommandEmpty>
                            Iconos no encontrados...
                        </CommandEmpty>
                        <CommandGroup>
                            {
                                debouncedQuery && manifest.filter((icon) => {
                                    return icon.name.toLowerCase().includes(debouncedQuery.toLowerCase())
                                }).slice(0, 30).map(iconQuery => (
                                    <CommandItem key={`${iconQuery.name}-${iconQuery.pack}`} onSelect={() => {
                                        setSelectedIcon(`${iconQuery.name} | ${iconQuery.pack}`);
                                        setOpen(false);
                                    }}>
                                        {iconQuery.name} | {iconQuery.pack}
                                    </CommandItem>
                                ))
                            }
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}