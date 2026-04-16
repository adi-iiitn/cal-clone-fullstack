import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Calendar, Clock, Users, Menu } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="border-b bg-white sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
            <h1 className="text-lg sm:text-xl font-bold">Cal Clone</h1>
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden sm:flex gap-2 sm:gap-4">
            <Link href="/event-types">
              <Button variant="ghost" size="sm" className="text-sm sm:text-base">
                Event Types
              </Button>
            </Link>
            <Link href="/bookings">
              <Button variant="ghost" size="sm" className="text-sm sm:text-base">
                Bookings
              </Button>
            </Link>
          </nav>

          {/* Mobile Navigation */}
          <div className="flex sm:hidden gap-2">
            <Link href="/event-types">
              <Button variant="ghost" size="sm" className="text-xs px-2">
                Events
              </Button>
            </Link>
            <Link href="/bookings">
              <Button variant="ghost" size="sm" className="text-xs px-2">
                Bookings
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4 text-gray-900 leading-tight">
            Scheduling Made Simple
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-gray-600 mb-6 sm:mb-8 max-w-2xl mx-auto px-4">
            Connect with people seamlessly. Schedule meetings without the back-and-forth.
          </p>
          <Link href="/event-types">
            <Button 
              size="lg" 
              className="text-base sm:text-lg px-6 py-5 sm:px-8 sm:py-6 w-full sm:w-auto touch-target"
            >
              View Available Times
            </Button>
          </Link>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mt-12 sm:mt-16">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="p-4 sm:p-6">
              <Calendar className="h-10 w-10 sm:h-12 sm:w-12 text-blue-600 mb-3 sm:mb-4" />
              <CardTitle className="text-lg sm:text-xl mb-2">Easy Scheduling</CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Pick a time that works for you from available slots
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="p-4 sm:p-6">
              <Clock className="h-10 w-10 sm:h-12 sm:w-12 text-blue-600 mb-3 sm:mb-4" />
              <CardTitle className="text-lg sm:text-xl mb-2">Flexible Duration</CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Choose from 30-minute or 60-minute meeting options
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-shadow sm:col-span-2 lg:col-span-1">
            <CardHeader className="p-4 sm:p-6">
              <Users className="h-10 w-10 sm:h-12 sm:w-12 text-blue-600 mb-3 sm:mb-4" />
              <CardTitle className="text-lg sm:text-xl mb-2">Instant Confirmation</CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Get immediate booking confirmation via email
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="mt-12 sm:mt-16 text-center bg-blue-600 text-white rounded-lg p-6 sm:p-8 lg:p-12">
          <h3 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4">
            Ready to get started?
          </h3>
          <p className="text-base sm:text-lg lg:text-xl mb-6 sm:mb-8 opacity-90 max-w-2xl mx-auto">
            Browse available meeting types and book your slot now
          </p>
          <Link href="/event-types">
            <Button 
              size="lg" 
              variant="secondary" 
              className="text-base sm:text-lg px-6 py-5 sm:px-8 sm:py-6 w-full sm:w-auto touch-target"
            >
              Browse Event Types
            </Button>
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t mt-12 sm:mt-16 py-6 sm:py-8 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-600">
          <p className="text-sm sm:text-base">
            © 2026 Cal Clone. Built with Next.js & TypeScript.
          </p>
        </div>
      </footer>
    </div>
  );
}
