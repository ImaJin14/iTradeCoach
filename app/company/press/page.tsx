'use client';

import Head from 'next/head';
import { useState, useEffect } from 'react';
import { 
  ChevronUpIcon,
  DocumentTextIcon,
  PhotoIcon,
  UserGroupIcon,
  CalendarIcon,
  NewspaperIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';

export default function Press() {
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

  const pressReleases = [
    {
      date: 'June 15, 2025',
      title: 'iTradeCoach Launches Revolutionary Trading Education Platform',
      summary: 'New platform combines AI-powered personalized learning with expert one-on-one coaching to democratize trading education.',
      type: 'Company Launch'
    },
    {
      date: 'June 10, 2025',
      title: 'iTradeCoach Welcomes Founding Team of Expert Trading Coaches',
      summary: 'Eight seasoned trading professionals join the platform to provide personalized coaching and mentorship to aspiring traders.',
      type: 'Team Update'
    },
    {
      date: 'June 5, 2025',
      title: 'iTradeCoach Secures Initial Funding to Transform Trading Education',
      summary: 'Company raises funds to build innovative educational technology and expand coaching network.',
      type: 'Funding'
    }
  ];

  const mediaKit = [
    {
      title: 'Company Logo Package',
      description: 'High-resolution logos in various formats (PNG, SVG, EPS)',
      type: 'Images',
      size: '2.1 MB'
    },
    {
      title: 'Product Screenshots',
      description: 'Platform interface and feature screenshots',
      type: 'Images',
      size: '5.3 MB'
    },
    {
      title: 'Company Fact Sheet',
      description: 'Key company information, statistics, and background',
      type: 'PDF',
      size: '1.2 MB'
    },
    {
      title: 'Leadership Headshots',
      description: 'Professional photos of leadership team members',
      type: 'Images',
      size: '3.8 MB'
    }
  ];

  const companyStats = [
    { label: 'Founded', value: 'June 2025' },
    { label: 'Headquarters', value: 'Remote-First' },
    { label: 'Team Size', value: '23 Members' },
    { label: 'Active Coaches', value: '8 Experts' },
    { label: 'Students Served', value: '150+' },
    { label: 'Funding Stage', value: 'Seed' }
  ];

  const keyMessages = [
    {
      title: 'Democratizing Trading Education',
      description: 'Making high-quality trading education accessible to everyone, regardless of background or experience level.'
    },
    {
      title: 'Technology-Enhanced Learning',
      description: 'Combining AI-powered personalized learning paths with the human touch of expert coaching.'
    },
    {
      title: 'Community-Focused Approach',
      description: 'Building a supportive community where traders can learn, grow, and succeed together.'
    },
    {
      title: 'Transparency and Ethics',
      description: 'Maintaining the highest standards of transparency in all educational content and business practices.'
    }
  ];

  return (
    <>
      <Head>
        <title>Press - iTradeCoach</title>
        <meta 
          name="description" 
          content="Press resources, news, and media kit for iTradeCoach. Get the latest company updates and downloadable assets for media coverage." 
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
            <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-6">Press Center</h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto leading-relaxed">
              Find the latest news, press releases, and media resources about iTradeCoach. We're on a mission to democratize trading education through innovative technology and expert coaching.
            </p>
          </div>

          {/* Quick Company Facts */}
          {/* <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 mb-16">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-8">Company at a Glance</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {companyStats.map((stat, index) => (
                <div key={index} className="text-center">
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-2">{stat.value}</p>
                  <p className="text-gray-600 dark:text-gray-400 font-medium">{stat.label}</p>
                </div>
              ))}
            </div>
          </div> */}

          {/* Recent News */}
          {/* <div className="mb-16">
            <div className="flex items-center gap-3 mb-8">
              <NewspaperIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Recent News</h2>
            </div>
            <div className="space-y-6">
              {pressReleases.map((release, index) => (
                <div key={index} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                  <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 px-3 py-1 rounded-full text-sm font-medium">
                          {release.type}
                        </span>
                        <span className="text-gray-500 dark:text-gray-400 text-sm">{release.date}</span>
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">{release.title}</h3>
                      <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{release.summary}</p>
                    </div>
                    <div className="flex gap-3 lg:flex-col">
                      <button className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors text-sm">
                        Read Full Release
                      </button>
                      <button className="border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white py-2 px-4 rounded-lg font-medium transition-colors text-sm">
                        Download PDF
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div> */}

          {/* Media Kit */}
          {/* <div className="mb-16">
            <div className="flex items-center gap-3 mb-8">
              <ArrowDownTrayIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Media Kit</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              {mediaKit.map((item, index) => (
                <div key={index} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                  <div className="flex items-start gap-4">
                    <div className="text-blue-600 dark:text-blue-400 mt-1">
                      {item.type === 'Images' ? <PhotoIcon className="h-6 w-6" /> : <DocumentTextIcon className="h-6 w-6" />}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{item.title}</h3>
                      <p className="text-gray-600 dark:text-gray-300 text-sm mb-3">{item.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500 dark:text-gray-400 text-sm">{item.size}</span>
                        <button className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors text-sm">
                          Download
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div> */}

          {/* Key Messages */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 mb-16">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-8">Key Messages</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {keyMessages.map((message, index) => (
                <div key={index} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">{message.title}</h3>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{message.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Contact Information */}
          {/* <div className="grid md:grid-cols-2 gap-6 mb-16">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-start gap-3 mb-4">
                <UserGroupIcon className="h-6 w-6 text-blue-600 dark:text-blue-400 mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Media Inquiries</h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm mb-3">
                    For press releases, interviews, and media coverage opportunities.
                  </p>
                  <a 
                    href="mailto:press@itradecoach.com"
                    className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                  >
                    press@itradecoach.com
                  </a>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-start gap-3 mb-4">
                <CalendarIcon className="h-6 w-6 text-blue-600 dark:text-blue-400 mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Interview Requests</h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm mb-3">
                    To schedule interviews with our leadership team or subject matter experts.
                  </p>
                  <a 
                    href="mailto:interviews@itradecoach.com"
                    className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                  >
                    interviews@itradecoach.com
                  </a>
                </div>
              </div>
            </div>
          </div> */}

          {/* Press Guidelines */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-800 p-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-6">Press Guidelines</h2>
            <div className="prose prose-gray dark:prose-invert max-w-none">
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Brand Usage</h3>
                  <ul className="space-y-2 text-gray-600 dark:text-gray-300">
                    <li className="flex items-start gap-2">
                      <span className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full mt-2 flex-shrink-0"></span>
                      Use "iTradeCoach" (not "itradecoach" or "ITradeCoach")
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full mt-2 flex-shrink-0"></span>
                      Do not modify our logo or brand colors
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full mt-2 flex-shrink-0"></span>
                      Maintain clear space around logo usage
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Contact Policy</h3>
                  <ul className="space-y-2 text-gray-600 dark:text-gray-300">
                    <li className="flex items-start gap-2">
                      <span className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full mt-2 flex-shrink-0"></span>
                      Response within 24 hours for urgent requests
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full mt-2 flex-shrink-0"></span>
                      All interviews require advance scheduling
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full mt-2 flex-shrink-0"></span>
                      High-resolution assets available upon request
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}