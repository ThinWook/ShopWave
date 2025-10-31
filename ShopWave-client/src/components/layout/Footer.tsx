
export default function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto px-4 py-8 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} ShopWave. All rights reserved.</p>
        <p className="mt-1">
          Built with Next.js and Tailwind CSS. Designed by an expert.
        </p>
      </div>
    </footer>
  );
}
