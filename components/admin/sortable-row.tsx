"use client"

import { useDraggable } from "@dnd-kit/react";
import { ReactNode } from "react";
import { TableRow } from "@/components/ui/table";

export function SortableRow({ children, id }: { children: ReactNode; id: number }) {
    const { ref } = useDraggable({
        id,
    });

    return (
        <TableRow ref={ref}>
            {children}
        </TableRow>
    )
}