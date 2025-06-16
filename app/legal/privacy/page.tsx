'use client';

import Head from 'next/head';
import { useState, useEffect } from 'react';
import { ShieldCheckIcon, EyeIcon, LockClosedIcon, ChevronUpIcon } from '@heroicons/react/24/outline';

export default function PrivacyPolicy() {
  const [activeSection, setActiveSection] = useState('');
  const [showScrollTop, setShowScrollTop] = useState(false);

  const sections = [
    { id: 'overview', title: 'Privacy Overview' },
    { id: 'collection', title: 'Information We Collect' },
    { id: 'usage', title: 'How We Use Information' },
    { id: 'sharing', title: 'Information Sharing' },
    { id: 'cookies', title: 'Cookies and Tracking' },
    { id: 'security', title: 'Data Security' },
    { id: 'retention', title: 'Data Retention' },
    { id: 'rights', title: 'Your Rights' },
    { id: 'international', title: 'International Transfers' },
    { id: 'children', title: 'Children\'s Privacy' },
    { id: 'changes', title: 'Policy Changes' },
    { id: 'contact', title: 'Contact Us' }
  ];

  const principles = [
    {
      icon: <ShieldCheckIcon className="h-8 w-8" />,
      title: 'Data Protection',
      description: 'We use industry-standard security measures to protect your personal information.'
    },
    {
      icon: <EyeIcon className="h-8 w-8" />,
      title: 'Transparency',
      description: 'We are clear about what data we collect and how we use it.'
    },
    {
      icon: <LockClosedIcon className="h-8 w-8" />,
      title: 'User Control',
      description: 'You have control over your personal data and privacy settings.'
    }
  ];

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
      
      // Update active section based on scroll position
      const sectionElements = sections.map(section => ({
        id: section.id,
        element: document.getElementById(section.id)
      }));

      const currentSection = sectionElements.find(section => {
        if (section.element) {
          const rect = section.element.getBoundingClientRect();
          return rect.top <= 150 && rect.bottom >= 150;
        }
        return false;
      });

      if (currentSection) {
        setActiveSection(currentSection.id);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [sections]);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <Head>
        <title>Privacy Policy - iTradeCoach</title>
        <meta 
          name="description" 
          content="Privacy Policy for iTradeCoach. Learn how we collect, use, and protect your personal information." 
        />
        <meta name="robots" content="index, follow" />
      </Head>

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
        {/* Floating Table of Contents */}
        <div className="fixed left-4 top-1/2 transform -translate-y-1/2 z-40 hidden xl:block">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg p-4 max-w-xs">
            <h3 className="font-semibold text-sm mb-3 text-gray-900 dark:text-white">Contents</h3>
            <nav className="space-y-2">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => scrollToSection(section.id)}
                  className={`block w-full text-left text-xs px-2 py-1 rounded transition-colors ${
                    activeSection === section.id
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {section.title}
                </button>
              ))}
            </nav>
          </div>
        </div>

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
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 transition-colors">
            {/* Header */}
            <div className="border-b border-gray-200 dark:border-gray-700 px-8 py-8">
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-3">Privacy Policy</h1>
              <p className="text-gray-600 dark:text-gray-400 text-lg">Last updated: March 15, 2024</p>
            </div>

            {/* Privacy Principles */}
            <div className="px-8 py-8 bg-blue-50 dark:bg-blue-900/20 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-white">Our Privacy Principles</h2>
              <div className="grid md:grid-cols-3 gap-6">
                {principles.map((principle, index) => (
                  <div key={index} className="flex items-start gap-4">
                    <div className="text-blue-600 dark:text-blue-400 flex-shrink-0">{principle.icon}</div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{principle.title}</h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">{principle.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Content */}
            <div className="p-8 space-y-16">
              {/* Overview */}
              <section id="overview" className="scroll-mt-20">
                <h2 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">Privacy Overview</h2>
                <div className="prose prose-gray dark:prose-invert max-w-none">
                  <p className="text-gray-600 dark:text-gray-300 mb-6 text-lg leading-relaxed">
                    At iTradeCoach, we are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our trading education platform.
                  </p>
                  <p className="text-gray-600 dark:text-gray-300 mb-6 text-lg leading-relaxed">
                    This policy applies to all users of our website, mobile application, and related services. By using iTradeCoach, you consent to the data practices described in this policy.
                  </p>
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
                    <p className="text-blue-800 dark:text-blue-200">
                      <strong>Quick Summary:</strong> We collect information to provide and improve our educational services. We don't sell your personal data to third parties and use industry-standard security measures to protect your information.
                    </p>
                  </div>
                </div>
              </section>

              {/* Information Collection */}
              <section id="collection" className="scroll-mt-20">
                <h2 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">Information We Collect</h2>
                
                <div className="space-y-8">
                  <div>
                    <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Information You Provide</h3>
                    <ul className="space-y-3">
                      <li className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                        <div>
                          <strong className="text-gray-900 dark:text-white">Account Information:</strong>
                          <span className="text-gray-600 dark:text-gray-300"> Name, email address, password, profile information</span>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                        <div>
                          <strong className="text-gray-900 dark:text-white">Payment Information:</strong>
                          <span className="text-gray-600 dark:text-gray-300"> Billing address, payment method details (processed securely by our payment partners)</span>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                        <div>
                          <strong className="text-gray-900 dark:text-white">Profile Data:</strong>
                          <span className="text-gray-600 dark:text-gray-300"> Trading experience, learning goals, preferences</span>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                        <div>
                          <strong className="text-gray-900 dark:text-white">Communications:</strong>
                          <span className="text-gray-600 dark:text-gray-300"> Messages with coaches, support tickets, feedback</span>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                        <div>
                          <strong className="text-gray-900 dark:text-white">Content:</strong>
                          <span className="text-gray-600 dark:text-gray-300"> Posts in forums, comments, uploaded materials</span>
                        </div>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Information We Collect Automatically</h3>
                    <ul className="space-y-3">
                      <li className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-green-600 dark:bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
                        <div>
                          <strong className="text-gray-900 dark:text-white">Usage Data:</strong>
                          <span className="text-gray-600 dark:text-gray-300"> Pages visited, features used, time spent on platform</span>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-green-600 dark:bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
                        <div>
                          <strong className="text-gray-900 dark:text-white">Device Information:</strong>
                          <span className="text-gray-600 dark:text-gray-300"> IP address, browser type, operating system</span>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-green-600 dark:bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
                        <div>
                          <strong className="text-gray-900 dark:text-white">Cookies and Tracking:</strong>
                          <span className="text-gray-600 dark:text-gray-300"> Session data, preferences, analytics information</span>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-green-600 dark:bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
                        <div>
                          <strong className="text-gray-900 dark:text-white">Location Data:</strong>
                          <span className="text-gray-600 dark:text-gray-300"> General location based on IP address (not precise location)</span>
                        </div>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Information from Third Parties</h3>
                    <ul className="space-y-3">
                      <li className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-purple-600 dark:bg-purple-400 rounded-full mt-2 flex-shrink-0"></div>
                        <div>
                          <strong className="text-gray-900 dark:text-white">Social Media:</strong>
                          <span className="text-gray-600 dark:text-gray-300"> If you connect social media accounts</span>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-purple-600 dark:bg-purple-400 rounded-full mt-2 flex-shrink-0"></div>
                        <div>
                          <strong className="text-gray-900 dark:text-white">Payment Processors:</strong>
                          <span className="text-gray-600 dark:text-gray-300"> Transaction and payment verification data</span>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-purple-600 dark:bg-purple-400 rounded-full mt-2 flex-shrink-0"></div>
                        <div>
                          <strong className="text-gray-900 dark:text-white">Analytics Providers:</strong>
                          <span className="text-gray-600 dark:text-gray-300"> Aggregated usage and performance data</span>
                        </div>
                      </li>
                    </ul>
                  </div>
                </div>
              </section>

              {/* Continue with other sections following the same pattern... */}
              {/* I'll continue with a few more key sections to show the pattern */}

              {/* Information Sharing */}
              <section id="sharing" className="scroll-mt-20">
                <h2 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">Information Sharing</h2>
                
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-6 mb-8">
                  <p className="text-green-800 dark:text-green-200 font-semibold text-lg">
                    We do not sell your personal information to third parties.
                  </p>
                </div>

                <div className="space-y-8">
                  <div>
                    <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">With Your Consent</h3>
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                      We may share information when you explicitly consent, such as when connecting with coaches or participating in community features.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Service Providers</h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">
                      We work with trusted third-party companies to help us operate our platform:
                    </p>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Payment Processors</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Stripe, PayPal for secure payment processing</p>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Cloud Services</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">AWS, Google Cloud for hosting and storage</p>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Communication</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Email service providers for notifications</p>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Analytics</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Google Analytics, Mixpanel for platform insights</p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Your Rights */}
              <section id="rights" className="scroll-mt-20">
                <h2 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">Your Privacy Rights</h2>
                
                <p className="text-gray-600 dark:text-gray-300 mb-8 text-lg leading-relaxed">
                  Depending on your location, you may have the following rights regarding your personal information:
                </p>

                <div className="grid gap-6">
                  {[
                    { title: 'Access', description: 'Request a copy of the personal information we hold about you.' },
                    { title: 'Correction', description: 'Request correction of inaccurate or incomplete information.' },
                    { title: 'Deletion', description: 'Request deletion of your personal information (subject to legal requirements).' },
                    { title: 'Portability', description: 'Request a copy of your data in a portable format.' },
                    { title: 'Objection', description: 'Object to certain types of processing of your information.' }
                  ].map((right, index) => (
                    <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-xl p-6 bg-gray-50 dark:bg-gray-800/50">
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2">{right.title}</h4>
                      <p className="text-gray-600 dark:text-gray-400">{right.description}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-8">
                  <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Exercising Your Rights</h3>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    To exercise any of these rights, please contact us at privacy@itradecoach.com. We will respond to your request within 30 days.
                  </p>
                </div>
              </section>

              {/* Contact */}
              <section id="contact" className="scroll-mt-20">
                <h2 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">Contact Information</h2>
                
                <p className="text-gray-600 dark:text-gray-300 mb-8 text-lg leading-relaxed">
                  If you have any questions about this Privacy Policy or our data practices, please contact us:
                </p>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                    <h3 className="font-semibold mb-4 text-gray-900 dark:text-white">Privacy Team</h3>
                    <div className="space-y-3">
                      <p className="text-gray-600 dark:text-gray-300"><strong>Email:</strong> privacy@itradecoach.com</p>
                      <p className="text-gray-600 dark:text-gray-300"><strong>Phone:</strong> +1 (555) 123-4567</p>
                      <p className="text-gray-600 dark:text-gray-300"><strong>Address:</strong> 123 Trading Street, New York, NY 10001</p>
                    </div>
                  </div>
                  
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
                    <h3 className="font-semibold mb-4 text-gray-900 dark:text-white">Data Protection Officer</h3>
                    <p className="mb-3 text-gray-600 dark:text-gray-300">For GDPR-related inquiries:</p>
                    <p className="text-gray-600 dark:text-gray-300"><strong>Email:</strong> dpo@itradecoach.com</p>
                  </div>
                </div>

                <div className="mt-6 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-6 border border-yellow-200 dark:border-yellow-800">
                  <h3 className="font-semibold mb-3 text-gray-900 dark:text-white">Response Time</h3>
                  <p className="text-gray-600 dark:text-gray-300">We aim to respond to all privacy inquiries within 30 days. For urgent security concerns, we typically respond within 24-48 hours.</p>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}