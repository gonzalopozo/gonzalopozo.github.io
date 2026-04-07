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
import type { IconType } from "react-icons";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const PACK_LOADERS: Record<string, () => Promise<Record<string, any>>> = {
    fa:  () => import("react-icons/fa"),
    fa6: () => import("react-icons/fa6"),
    io5: () => import("react-icons/io5"),
    di:  () => import("react-icons/di"),
    ri:  () => import("react-icons/ri"),
    gr:  () => import("react-icons/gr"),
    si:  () => import("react-icons/si"),
    bi:  () => import("react-icons/bi"),
    tb:  () => import("react-icons/tb"),
    lia: () => import("react-icons/lia"),
};

interface IconPickerProps {
    fullName?: string;
}

class IconPicked implements IconPickerProps {
    constructor(public fullName: string) {}

    getIconName(): string {
        return this.fullName.split("|")[0].trim();
    }

    getIconPackage(): string {
        return this.fullName.split("|")[1].trim();
    }
}

interface IconPreviewProps {
    iconPackage: string;
    iconName: string;
}

function IconPreview({ iconName, iconPackage }: IconPreviewProps) {
    const [Icon, setIcon] = useState<IconType | null>(null);

    useEffect(() => {
        let cancelled = false;

        const loader = PACK_LOADERS[iconPackage];
        if (!loader) return;

        loader().then((mod) => {
            if (cancelled) return;
            const resolved = mod[iconName];
            if (typeof resolved === "function") {
                setIcon(() => resolved as IconType);
            } else {
                setIcon(null);
            }
        });

        return () => { cancelled = true; };
    }, [iconName, iconPackage]);

    if (!Icon) return <span>a</span>;

    return <Icon className="size-4" aria-hidden />;
}

export function IconPicker({ fullName }: IconPickerProps) {
    const [open, setOpen] = useState(false);
    const [selectedIcon, setSelectedIcon] = useState<string | null>(fullName ?? null);
    const [debouncedQuery, setDebouncedQuery] = useState<string | null>();
    const [searchQuery, setSearchQuery] = useState<string | null>();

    useEffect(() => {
        const id = setTimeout(() => {
            setDebouncedQuery(searchQuery)
            console.log("300 ms")
        }, 300);
        return () => clearTimeout(id);
    }, [searchQuery]);

    const selectedPicked = selectedIcon ? new IconPicked(selectedIcon) : null;

    return (
        <Popover defaultOpen={false} open={open} onOpenChange={setOpen} >
            <PopoverTrigger asChild>
                <Button variant="outline">
                    {selectedPicked ? (
                        <>
                            Icono seleccionado {selectedPicked.fullName} <IconPreview iconName={selectedPicked.getIconName()} iconPackage={selectedPicked.getIconPackage()} />
                        </>
                        ) :
                        (
                            "Icon picker"
                        ) }
                </Button>
            </PopoverTrigger>
            <PopoverContent align="center">
                <Command shouldFilter={false}>
                    <CommandInput placeholder="Escribe el nombre de tu skill..." value={searchQuery || ""} onValueChange={(input) => setSearchQuery(input)} />
                    <CommandList>
                        <CommandEmpty>
                            Iconos no encontrados...
                        </CommandEmpty>
                        <CommandGroup>
                            {
                                debouncedQuery && manifest.filter((icon) => {
                                    return icon.name.toLowerCase().includes(debouncedQuery.toLowerCase())
                                }).slice(0, 30).map(({ name, pack }) => (
                                    <CommandItem key={`${name}-${pack}`} value={`${name}-${pack}`} onSelect={() => {
                                        setSelectedIcon(`${name} | ${pack}`);
                                        setOpen(false);
                                    }}>
                                        {name} | {pack} | <IconPreview iconName={name} iconPackage={pack} />
                                    </CommandItem>
                                ))
                            }
                            <input type="hidden" name="icon" id="icon" value={selectedIcon ?? ""} />
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}