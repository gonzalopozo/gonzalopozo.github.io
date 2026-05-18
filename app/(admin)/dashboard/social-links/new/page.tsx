import { createSocialLink } from '@/lib/actions/social-links';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { ArrowLeft, Plus } from 'lucide-react';

export default async function NewSocialLinkDashboardPage() {
	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center gap-4">
				<Button variant="ghost" size="icon" asChild>
					<Link href="/dashboard/social-links">
						<ArrowLeft className="size-4" />
					</Link>
				</Button>
				<div>
					<h1 className="text-3xl font-semibold tracking-tight">Nuevo Enlace Social</h1>
					<p className="mt-1 text-muted-foreground">
						Añade un nuevo enlace a tus redes sociales
					</p>
				</div>
			</div>

			{/* Form Card */}
			<Card className="max-w-2xl">
				<CardHeader>
					<CardTitle>Información del enlace</CardTitle>
					<CardDescription>Completa los datos del nuevo enlace social</CardDescription>
				</CardHeader>
				<CardContent>
					<form action={createSocialLink} className="space-y-6">
						{/* Name Field */}
						<div className="space-y-2">
							<Label htmlFor="name">Nombre</Label>
							<Input
								type="text"
								name="name"
								id="name"
								placeholder="Ej: GitHub, LinkedIn, Twitter..."
								required
							/>
						</div>

						{/* URL Field */}
						<div className="space-y-2">
							<Label htmlFor="url">URL</Label>
							<Input type="url" name="url" id="url" placeholder="https://..." />
							<p className="text-xs text-muted-foreground">
								Enlace a tu perfil en la red social
							</p>
						</div>

						{/* Icon Field */}
						<div className="space-y-2">
							<Label htmlFor="icon">Icono</Label>
							<Input
								type="text"
								name="icon"
								id="icon"
								placeholder="Ej: github, linkedin, twitter..."
							/>
							<p className="text-xs text-muted-foreground">
								Nombre del icono para mostrar (opcional)
							</p>
						</div>

						{/* Actions */}
						<div className="flex items-center gap-3 pt-4">
							<Button type="submit" className="gap-2">
								<Plus className="size-4" />
								Crear enlace
							</Button>
							<Button type="button" variant="outline" asChild>
								<Link href="/dashboard/social-links">Cancelar</Link>
							</Button>
						</div>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}
