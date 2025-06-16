'use client';

import Head from 'next/head';
import { useState } from 'react';
import { CogIcon, ChartBarIcon, UserIcon, MegaphoneIcon } from '@heroicons/react/24/outline';
import type { NextPage } from 'next';

// Type definitions
interface CookiePreferences {
  essential: boolean;
  performance: boolean;
  functionality: boolean;
  marketing: boolean;
}

type CookieType = keyof CookiePreferences;

interface CookieTypeInfo {
  id: CookieType;
  name: string;
  icon: React.ReactNode;
  description: string;
  required: boolean;
  examples: string[];
}

const CookiePolicy: NextPage = () => {
  const [cookiePreferences, setCookiePreferences] = useState<CookiePreferences>({
    essential: true,
    performance: true,
    functionality: true,
    marketing: false
  });

  const [showPreferences, setShowPreferences] = useState<boolean>(false);

  const cookieTypes: CookieTypeInfo[] = [
    {
      id: 'essential',
      name: 'Essential Cookies',
      icon: <CogIcon className="h-6 w-6" />,
      description: 'These cookies are necessary for the website to function and cannot be switched off.',
      required: true,
      examples: [
        'Authentication tokens',
        'Security settings',
        'Form submission data',
        'Shopping cart contents'
      ]
    },
    {
      id: 'performance',
      name: 'Performance Cookies',
      icon: <ChartBarIcon className="h-6 w-6" />,
      description: 'These cookies help us understand how visitors interact with our website.',
      required: false,
      examples: [
        'Google Analytics',
        'Page load times',
        'Error tracking',
        'Usage statistics'
      ]
    },
    {
      id: 'functionality',
      name: 'Functionality Cookies',
      icon: <UserIcon className="h-6 w-6" />,
      description: 'These cookies enable enhanced functionality and personalization.',
      required: false,
      examples: [
        'Language preferences',
        'Theme settings',
        'Video player settings',
        'Chat widget preferences'
      ]
    },
    {
      id: 'marketing',
      name: 'Marketing Cookies',
      icon: <MegaphoneIcon className="h-6 w-6" />,
      description: 'These cookies are used to deliver advertisements relevant to you.',
      required: false,
      examples: [
        'Google Ads',
        'Facebook Pixel',
        'LinkedIn Insights',
        'Retargeting pixels'
      ]
    }
  ];

  const handlePreferenceChange = (cookieType: CookieType): void => {
    if (cookieType === 'essential') return;
    
    setCookiePreferences(prev => ({
      ...prev,
      [cookieType]: !prev[cookieType]
    }));
  };

  const savePreferences = (): void => {
    localStorage.setItem('cookiePreferences', JSON.stringify(cookiePreferences));
    setShowPreferences(false);
    alert('Cookie preferences saved successfully!');
  };

  const acceptAllCookies = (): void => {
    const allAccepted: CookiePreferences = {
      essential: true,
      performance: true,
      functionality: true,
      marketing: true
    };
    setCookiePreferences(allAccepted);
    localStorage.setItem('cookiePreferences', JSON.stringify(allAccepted));
    alert('All cookies accepted!');
  };

  const rejectOptionalCookies = (): void => {
    const essentialOnly: CookiePreferences = {
      essential: true,
      performance: false,
      functionality: false,
      marketing: false
    };
    setCookiePreferences(essentialOnly);
    localStorage.setItem('cookiePreferences', JSON.stringify(essentialOnly));
    alert('Optional cookies rejected. Only essential cookies will be used.');
  };

  return (
    <>
      <Head>
        <title>Cookie Policy - iTradeCoach</title>
        <meta 
          name="description" 
          content="Cookie Policy for iTradeCoach. Learn about the cookies we use and manage your cookie preferences." 
        />
        <meta name="robots" content="index, follow" />
      </Head>

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 transition-colors">
            {/* Header */}
            <div className="border-b border-gray-200 dark:border-gray-700 px-8 py-8">
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-3">Cookie Policy</h1>
              <p className="text-gray-600 dark:text-gray-400 text-lg">Last updated: March 15, 2024</p>
            </div>

            {/* Quick Actions */}
            <div className="px-8 py-6 bg-blue-50 dark:bg-blue-900/20 border-b border-gray-200 dark:border-gray-700">
              <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
                <div className="flex-1">
                  <h2 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">Manage Your Cookie Preferences</h2>
                  <p className="text-gray-600 dark:text-gray-400">Choose which cookies you want to accept on our website.</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                  <button
                    onClick={() => setShowPreferences(true)}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
                  >
                    Manage Preferences
                  </button>
                  <button
                    onClick={acceptAllCookies}
                    className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium"
                  >
                    Accept All
                  </button>
                  <button
                    onClick={rejectOptionalCookies}
                    className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors font-medium"
                  >
                    Reject Optional
                  </button>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-8 space-y-12">
              {/* What are Cookies */}
              <section>
                <h2 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">What Are Cookies?</h2>
                <div className="prose prose-gray dark:prose-invert max-w-none">
                  <p className="text-gray-600 dark:text-gray-300 mb-6 text-lg leading-relaxed">
                    Cookies are small text files that are stored on your device (computer, tablet, or mobile) when you visit our website. 
                    They help us provide you with a better experience by remembering your preferences and understanding how you use our platform.
                  </p>
                  <p className="text-gray-600 dark:text-gray-300 mb-6 text-lg leading-relaxed">
                    Cookies can be "session" cookies (deleted when you close your browser) or "persistent" cookies (remain on your device 
                    until deleted or expired). We use both types to enhance your experience on iTradeCoach.
                  </p>
                </div>
              </section>

              {/* Types of Cookies */}
              <section>
                <h2 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">Types of Cookies We Use</h2>
                <div className="grid gap-6">
                  {cookieTypes.map((type) => (
                    <div key={type.id} className="border border-gray-200 dark:border-gray-700 rounded-xl p-6 bg-gray-50 dark:bg-gray-800/50 transition-colors">
                      <div className="flex items-start gap-6">
                        <div className="text-blue-600 dark:text-blue-400 mt-1 flex-shrink-0">{type.icon}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-4">
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{type.name}</h3>
                            {type.required && (
                              <span className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400 text-sm rounded-full font-medium">
                                Required
                              </span>
                            )}
                          </div>
                          <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">{type.description}</p>
                          <div>
                            <h4 className="font-semibold mb-3 text-gray-900 dark:text-white">Examples:</h4>
                            <ul className="list-disc pl-5 text-gray-600 dark:text-gray-300 space-y-2">
                              {type.examples.map((example, index) => (
                                <li key={index}>{example}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                        <div className="flex-shrink-0">
                          <label className="flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={cookiePreferences[type.id]}
                              onChange={() => handlePreferenceChange(type.id)}
                              disabled={type.required}
                              className="w-5 h-5 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 dark:focus:ring-blue-400 disabled:opacity-50 dark:bg-gray-700"
                            />
                            <span className="ml-3 text-sm text-gray-600 dark:text-gray-400 font-medium">
                              {type.required ? 'Always Active' : 'Toggle'}
                            </span>
                          </label>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Additional sections... */}
              <section>
                <h2 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">Managing Your Cookie Settings</h2>
                <div className="prose prose-gray dark:prose-invert max-w-none">
                  <p className="text-gray-600 dark:text-gray-300 mb-6 text-lg leading-relaxed">
                    You can control and manage cookies in various ways. You can use the preference center above, adjust your browser settings, 
                    or use third-party tools to manage cookies and tracking technologies.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">Contact Us</h2>
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    If you have any questions about our Cookie Policy, please contact us:
                  </p>
                  <div className="space-y-2 text-gray-900 dark:text-white">
                    <p><strong>Email:</strong> privacy@itradecoach.com</p>
                    <p><strong>Phone:</strong> +1 (555) 123-4567</p>
                    <p><strong>Address:</strong> 123 Trading Street, New York, NY 10001</p>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>

        {/* Cookie Preferences Modal */}
        {showPreferences && (
          <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Cookie Preferences</h2>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                  Choose which types of cookies you want to allow on our website.
                </p>
              </div>
              
              <div className="p-6 space-y-6">
                {cookieTypes.map((type) => (
                  <div key={type.id} className="flex items-start gap-4">
                    <div className="pt-1">
                      <input
                        type="checkbox"
                        id={`modal-${type.id}`}
                        checked={cookiePreferences[type.id]}
                        onChange={() => handlePreferenceChange(type.id)}
                        disabled={type.required}
                        className="w-5 h-5 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 dark:focus:ring-blue-400 disabled:opacity-50 dark:bg-gray-700"
                      />
                    </div>
                    <div className="flex-1">
                      <label htmlFor={`modal-${type.id}`} className="block font-semibold mb-2 cursor-pointer text-gray-900 dark:text-white">
                        {type.name}
                        {type.required && (
                          <span className="ml-2 px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400 text-xs rounded-full">
                            Required
                          </span>
                        )}
                      </label>
                      <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">{type.description}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex gap-3">
                <button
                  onClick={savePreferences}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg transition-colors font-medium"
                >
                  Save Preferences
                </button>
                <button
                  onClick={() => setShowPreferences(false)}
                  className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-900 dark:text-white font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default CookiePolicy;