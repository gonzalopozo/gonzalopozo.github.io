'use client';

import { useActionState, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Plus, Save } from 'lucide-react';
import { ColorPickerField } from '@/components/admin/color-picker';
import { IconPickerSkeleton } from '@/components/admin/icon-picker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import type { SkillActionState } from '@/lib/actions/skills';
import type { SkillType } from '@/lib/types';

const IconPicker = dynamic(
	() => import('@/components/admin/icon-picker').then((mod) => mod.IconPicker),
	{ loading: () => <IconPickerSkeleton /> },
);

const DEFAULT_SKILL_COLOR = '#66696d';

interface SkillFormProps {
	action: (state: SkillActionState, formData: FormData) => Promise<SkillActionState>;
	initialValues?: {
		name: string;
		type: SkillType;
		icon: string | null;
		url: string | null;
		useColor: boolean;
		customColor: string | null;
	};
}

export function SkillForm({ action, initialValues }: SkillFormProps) {
	const [state, formAction, pending] = useActionState(action, { error: null });
	const [useColor, setUseColor] = useState(initialValues?.useColor ?? false);
	const [color, setColor] = useState(() => {
		const initialColor = initialValues?.customColor;
		return initialColor && /^#[0-9a-f]{6}$/i.test(initialColor)
			? initialColor.toLowerCase()
			: DEFAULT_SKILL_COLOR;
	});
	const editing = Boolean(initialValues);

	return (
		<form action={formAction} className="flex flex-col gap-6">
			<div className="flex flex-col gap-2">
				<Label htmlFor="name">Nombre</Label>
				<Input
					type="text"
					name="name"
					id="name"
					placeholder="Ej: TypeScript, React, PostgreSQL…"
					defaultValue={initialValues?.name}
					required
					autoComplete="off"
				/>
			</div>

			<div className="flex flex-col gap-2">
				<Label htmlFor="type">Categoría</Label>
				<select
					name="type"
					id="type"
					defaultValue={initialValues?.type ?? 'fullstack'}
					className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:bg-input/30"
					required
				>
					<option value="fullstack">Full Stack</option>
					<option value="frontend">Frontend</option>
					<option value="backend">Backend</option>
					<option value="database">Base de datos</option>
					<option value="devops">DevOps</option>
					<option value="practices">Buenas prácticas</option>
					<option value="tools">Herramientas</option>
					<option value="other">Otro</option>
				</select>
			</div>

			<div className="flex flex-col gap-2">
				<Label htmlFor="icon">Icono</Label>
				<IconPicker fullName={initialValues?.icon ?? undefined} />
			</div>

			<div className="flex flex-col gap-2">
				<Label htmlFor="url">URL</Label>
				<Input
					type="url"
					name="url"
					id="url"
					placeholder="https://…"
					defaultValue={initialValues?.url ?? ''}
					autoComplete="off"
				/>
				<p className="text-xs text-muted-foreground">
					Enlace a la documentación oficial o sitio web (opcional)
				</p>
			</div>

			<div className="flex items-center justify-between gap-4">
				<div className="flex flex-col gap-1">
					<Label htmlFor="useColor">Usar color personalizado</Label>
					<p className="text-xs text-muted-foreground">
						Colorea el icono en la tarjeta de experiencia al pasar el cursor.
					</p>
				</div>
				<Switch
					id="useColor"
					name="useColor"
					checked={useColor}
					onCheckedChange={setUseColor}
				/>
			</div>

			{useColor ? (
				<div className="flex flex-col gap-2">
					<Label htmlFor="customColor">Color del icono</Label>
					<ColorPickerField
						name="customColor"
						label="Seleccionar color del icono"
						value={color}
						onChange={setColor}
					/>
				</div>
			) : null}

			{state.error ? (
				<p role="alert" className="text-sm text-destructive">
					{state.error}
				</p>
			) : null}

			<div className="flex items-center gap-3 pt-4">
				<Button type="submit" disabled={pending}>
					{editing ? (
						<Save data-icon="inline-start" />
					) : (
						<Plus data-icon="inline-start" />
					)}
					{editing ? 'Guardar cambios' : 'Crear habilidad'}
				</Button>
				<Button type="button" variant="outline" asChild>
					<Link href="/dashboard/skills">Cancelar</Link>
				</Button>
			</div>
		</form>
	);
}
