/**
 * Landing Page Component
 * Purpose: Main landing page for EduTrack GH
 * 
 * Features:
 *   - Hero section with system overview
 *   - Authentication card
 *   - EduTrack GH branding and design
 *   - Mobile-responsive layout
 * 
 * Note: This is a public page (no authentication required)
 * Architecture: Page orchestrates components, no business logic
 */

import { Navbar, HeroSection, AuthCard, Footer } from '../../components/common';

const Landing = () => {
  return (
    <div className="min-h-screen lg:h-screen flex flex-col bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-300 lg:overflow-hidden">
      <Navbar />
      
      <div className="flex-1 flex items-center py-8 lg:py-0 overflow-y-auto lg:overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <HeroSection />
            <AuthCard />
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default Landing;
