'use client';

import Head from 'next/head';
import { useState, useEffect } from 'react';
import { 
  ChevronUpIcon, 
  AcademicCapIcon, 
  LightBulbIcon, 
  UsersIcon,
  TrophyIcon,
  ShieldCheckIcon,
  RocketLaunchIcon
} from '@heroicons/react/24/outline';

export default function AboutUs() {
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const values = [
    {
      icon: <AcademicCapIcon className="h-8 w-8" />,
      title: 'Education First',
      description: 'We believe in empowering traders through comprehensive, accessible education that builds real skills and confidence.'
    },
    {
      icon: <ShieldCheckIcon className="h-8 w-8" />,
      title: 'Transparency',
      description: 'We maintain complete transparency in our teaching methods, market approaches, and business practices.'
    },
    {
      icon: <UsersIcon className="h-8 w-8" />,
      title: 'Community Focus',
      description: 'We foster a supportive community where traders at all levels can learn, grow, and succeed together.'
    },
    {
      icon: <LightBulbIcon className="h-8 w-8" />,
      title: 'Innovation',
      description: 'We leverage cutting-edge technology and AI to create personalized, effective learning experiences.'
    }
  ];

  const milestones = [
    {
      date: 'June 2025',
      title: 'Company Founded',
      description: 'iTradeCoach was established with the mission to democratize trading education through technology and expert guidance.'
    },
    {
      date: 'June 2025',
      title: 'Platform Launch',
      description: 'Launched our beta platform with core features including one-on-one coaching and AI-powered learning modules.'
    },
    {
      date: 'June 2025',
      title: 'First Coaches Onboarded',
      description: 'Welcomed our founding team of experienced trading educators and market professionals.'
    }
  ];

  const team = [
    {
      name: 'Leadership Team',
      description: 'Our founding team brings together decades of experience in trading, education, and technology.',
      count: '4 members'
    },
    {
      name: 'Trading Coaches',
      description: 'Certified professionals with proven track records in various trading strategies and market conditions.',
      count: '8 coaches'
    },
    {
      name: 'Technology Team',
      description: 'Engineers and developers focused on creating innovative educational tools and seamless user experiences.',
      count: '6 developers'
    },
    {
      name: 'Content Creators',
      description: 'Educational content specialists who develop comprehensive learning materials and course curricula.',
      count: '5 creators'
    }
  ];

  return (
    <>
      <Head>
        <title>About Us - iTradeCoach</title>
        <meta 
          name="description" 
          content="Learn about iTradeCoach's mission to democratize trading education through expert coaching and innovative technology." 
        />
        <meta name="robots" content="index, follow" />
      </Head>

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
        {/* Scroll to top button */}
        {showScrollTop && (
          <button
            onClick={scrollToTop}
            className="fixed right-6 bottom-6 z-50 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg transition-colors"
            aria-label="Scroll to top"
          >
            <ChevronUpIcon className="h-6 w-6" />
          </button>
        )}

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-6">About iTradeCoach</h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto leading-relaxed">
              We're on a mission to democratize trading education by connecting aspiring traders with expert coaches and cutting-edge learning technology.
            </p>
          </div>

          {/* Mission Section */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 mb-16">
            <div className="text-center mb-8">
              <RocketLaunchIcon className="h-12 w-12 text-blue-600 dark:text-blue-400 mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Our Mission</h2>
            </div>
            <div className="prose prose-gray dark:prose-invert max-w-none">
              <p className="text-lg text-gray-600 dark:text-gray-300 text-center leading-relaxed mb-6">
                Founded in June 2025, iTradeCoach was born from a simple observation: while trading markets offer tremendous opportunities, most educational resources are either too generic, too expensive, or too difficult to access.
              </p>
              <p className="text-lg text-gray-600 dark:text-gray-300 text-center leading-relaxed">
                We believe everyone deserves access to high-quality trading education. Our platform combines the personalized attention of expert coaches with the scalability of modern technology to create learning experiences that are both effective and accessible.
              </p>
            </div>
          </div>

          {/* Values Section */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-12">Our Core Values</h2>
            <div className="grid md:grid-cols-2 gap-8">
              {values.map((value, index) => (
                <div key={index} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                  <div className="flex items-start gap-4">
                    <div className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-1">
                      {value.icon}
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">{value.title}</h3>
                      <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{value.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Timeline Section */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 mb-16">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-12">Our Journey</h2>
            <div className="space-y-8">
              {milestones.map((milestone, index) => (
                <div key={index} className="flex gap-6">
                  <div className="flex-shrink-0">
                    <div className="w-4 h-4 bg-blue-600 dark:bg-blue-400 rounded-full mt-2"></div>
                    {index < milestones.length - 1 && (
                      <div className="w-0.5 h-16 bg-gray-300 dark:bg-gray-600 ml-2 mt-2"></div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-6">
                      <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-2">{milestone.date}</p>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">{milestone.title}</h3>
                      <p className="text-gray-600 dark:text-gray-300">{milestone.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Team Section */}
          {/* <div className="mb-16">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-12">Our Team</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {team.map((department, index) => (
                <div key={index} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{department.name}</h3>
                    <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 px-3 py-1 rounded-full text-sm font-medium">
                      {department.count}
                    </span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{department.description}</p>
                </div>
              ))}
            </div>
          </div> */}

          {/* Vision Section */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-800 p-8 text-center">
            <TrophyIcon className="h-12 w-12 text-blue-600 dark:text-blue-400 mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Looking Forward</h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed mb-6">
              As we grow, our commitment remains unchanged: to provide world-class trading education that's accessible, effective, and transformative. We're building the future of financial education, one student at a time.
            </p>
            <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
              Join us on this journey as we empower the next generation of successful traders.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}