export default function PublicLayout({ children }: { children: React.ReactNode }) {
	return (
		<div className="bg-background">
			{/* <IconContext.Provider value={{ color: "#123", className: "" }}> */}
			{children}
			{/* </IconContext.Provider> */}
		</div>
	);
}
