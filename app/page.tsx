import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export default function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10">
      <div className="text-center px-4">
        <h1 className="text-6xl font-bold text-text mb-4">
          Zane Center
        </h1>
        <p className="text-xl text-text-secondary mb-8">
          Book appointments at beauty salons, barbers, and wellness centers
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/demo">
            <Button size="lg">View Demo Store</Button>
          </Link>
          <Link href="/demo/dashboard/login">
            <Button size="lg" variant="outline">Store Owner Login</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
