/**
 * Hero Section Component
 * Purpose: Main hero section with headline and features
 */

const HeroSection = () => {
  return (
    <div className="space-y-6">
      {/* Badge */}
      <div className="inline-flex items-center space-x-2 bg-green-100 dark:bg-green-900/30 border border-green-600 dark:border-green-700 rounded-full px-4 py-2">
        <div className="w-2 h-2 bg-green-500 dark:bg-green-400 rounded-full animate-pulse"></div>
        <span className="text-green-700 dark:text-green-400 text-sm font-medium">FOR BASIC SCHOOLS</span>
      </div>

      {/* Heading */}
      <div>
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white leading-tight">Digital Presence</h1>
        <h1 className="text-4xl md:text-5xl font-bold text-green-600 dark:text-green-400 leading-tight">Every Child Matters.</h1>
      </div>

      {/* Description */}
      <p className="text-gray-700 dark:text-gray-300 text-base leading-relaxed max-w-lg">
        Real-time attendance tracking. Parents always informed. Built for basic schools (P1–P6, JHS 1–3).
      </p>

      {/* Feature Pills */}
      <div className="flex flex-wrap gap-3">
        {['Daily Tracking', 'Smart Alerts', 'School Dashboards'].map((feature) => (
          <div key={feature} className="flex items-center space-x-2 text-green-600 dark:text-green-400">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-medium">{feature}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HeroSection;
