'use client';

import Head from 'next/head';
import { useState, useEffect } from 'react';
import { ChevronUpIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

export default function TermsOfService() {
  const [activeSection, setActiveSection] = useState('');
  const [showScrollTop, setShowScrollTop] = useState(false);

  const sections = [
    { id: 'acceptance', title: 'Acceptance of Terms' },
    { id: 'services', title: 'Description of Services' },
    { id: 'accounts', title: 'User Accounts' },
    { id: 'conduct', title: 'User Conduct' },
    { id: 'content', title: 'Content and Intellectual Property' },
    { id: 'payments', title: 'Payments and Subscriptions' },
    { id: 'disclaimers', title: 'Disclaimers and Risk Warnings' },
    { id: 'liability', title: 'Limitation of Liability' },
    { id: 'termination', title: 'Termination' },
    { id: 'privacy', title: 'Privacy' },
    { id: 'changes', title: 'Changes to Terms' },
    { id: 'contact', title: 'Contact Information' }
  ];

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
      
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
        <title>Terms of Service - iTradeCoach</title>
        <meta 
          name="description" 
          content="Terms of Service for iTradeCoach trading education platform. Read our terms and conditions for using our services." 
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
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-3">Terms of Service</h1>
              <p className="text-gray-600 dark:text-gray-400 text-lg">Last updated: March 15, 2024</p>
            </div>

            {/* Content */}
            <div className="p-8 space-y-16">
              {/* Acceptance */}
              <section id="acceptance" className="scroll-mt-20">
                <h2 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">1. Acceptance of Terms</h2>
                <div className="prose prose-gray dark:prose-invert max-w-none">
                  <p className="text-gray-600 dark:text-gray-300 mb-6 text-lg leading-relaxed">
                    Welcome to iTradeCoach ("we," "our," or "us"). These Terms of Service ("Terms") govern your use of the iTradeCoach website, mobile application, and related services (collectively, the "Service") operated by iTradeCoach Inc.
                  </p>
                  <p className="text-gray-600 dark:text-gray-300 mb-6 text-lg leading-relaxed">
                    By accessing or using our Service, you agree to be bound by these Terms. If you disagree with any part of these terms, then you may not access the Service.
                  </p>
                  <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed">
                    These Terms apply to all visitors, users, and others who access or use the Service, including but not limited to students, coaches, and content creators.
                  </p>
                </div>
              </section>

              {/* Services */}
              <section id="services" className="scroll-mt-20">
                <h2 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">2. Description of Services</h2>
                <p className="text-gray-600 dark:text-gray-300 mb-6 text-lg leading-relaxed">
                  iTradeCoach provides an online platform for trading education that includes:
                </p>
                <div className="grid md:grid-cols-2 gap-4 mb-6">
                  {[
                    'One-on-one coaching sessions with verified trading experts',
                    'Live group educational sessions',
                    'AI-powered personalized learning modules',
                    'Educational content including courses, articles, and videos',
                    'Community features and forums',
                    'Progress tracking and analytics'
                  ].map((service, index) => (
                    <div key={index} className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                        <p className="text-gray-700 dark:text-gray-300">{service}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-6">
                  <p className="text-yellow-800 dark:text-yellow-200 font-medium">
                    Our services are designed for educational purposes only and do not constitute financial advice, investment recommendations, or trading signals.
                  </p>
                </div>
              </section>

              {/* Risk Disclaimers - Special attention section */}
              <section id="disclaimers" className="scroll-mt-20">
                <h2 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">7. Disclaimers and Risk Warnings</h2>
                
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-8 mb-8">
                  <div className="flex items-start gap-4">
                    <ExclamationTriangleIcon className="h-8 w-8 text-red-600 dark:text-red-400 flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="text-xl font-bold text-red-800 dark:text-red-200 mb-3">⚠️ Important Risk Disclosure</h3>
                      <p className="text-red-700 dark:text-red-300 text-lg leading-relaxed">
                        Trading involves substantial risk of loss and is not suitable for all investors. Past performance does not guarantee future results. You should carefully consider whether trading is suitable for you in light of your circumstances, knowledge, and financial resources.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-8">
                  <div>
                    <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Educational Purpose Only</h3>
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                      All content provided through our Service is for educational purposes only and should not be considered as financial advice, investment recommendations, or trading signals. You should conduct your own research and consult with qualified financial advisors before making any trading decisions.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">No Guarantee of Results</h3>
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                      We make no representations or warranties about the effectiveness of our educational programs or any particular trading results you may achieve. Individual results may vary significantly, and there is no guarantee that you will achieve similar results.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Coach Disclaimers</h3>
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                      Individual coaches are independent contractors. Their views, advice, and trading strategies are their own and do not necessarily reflect the views of iTradeCoach. We do not endorse or guarantee the accuracy of any coach's advice or predictions.
                    </p>
                  </div>
                </div>
              </section>

              {/* Payments */}
              <section id="payments" className="scroll-mt-20">
                <h2 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">6. Payments and Subscriptions</h2>
                
                <div className="grid gap-6">
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                    <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Subscription Plans</h3>
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                      We offer various subscription plans with different features and pricing. All fees are charged in advance and are non-refundable except as expressly stated in our refund policy.
                    </p>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                    <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Auto-Renewal</h3>
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                      Subscriptions automatically renew unless cancelled before the renewal date. You can cancel your subscription at any time through your account settings or by contacting our support team.
                    </p>
                  </div>

                  <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-6 border border-green-200 dark:border-green-800">
                    <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Refund Policy</h3>
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                      We offer a 30-day money-back guarantee for new subscribers. Individual coaching sessions can be cancelled up to 24 hours in advance for a full refund.
                    </p>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
                    <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Price Changes</h3>
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                      We reserve the right to modify subscription prices with 30 days' notice to existing subscribers. Current subscribers will have the option to continue at their existing rate until their next renewal period.
                    </p>
                  </div>
                </div>
              </section>

              {/* Contact */}
              {/* <section id="contact" className="scroll-mt-20">
                <h2 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">12. Contact Information</h2>
                
                <p className="text-gray-600 dark:text-gray-300 mb-8 text-lg leading-relaxed">
                  If you have any questions about these Terms of Service, please contact us:
                </p>
                
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-semibold mb-4 text-gray-900 dark:text-white">Legal Team</h3>
                      <div className="space-y-2 text-gray-600 dark:text-gray-300">
                        <p><strong>Email:</strong> legal@itradecoach.com</p>
                        <p><strong>Phone:</strong> +1 (555) 123-4567</p>
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-4 text-gray-900 dark:text-white">Mailing Address</h3>
                      <p className="text-gray-600 dark:text-gray-300">
                        123 Trading Street<br />
                        New York, NY 10001<br />
                        United States
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
                  <h3 className="font-semibold mb-3 text-gray-900 dark:text-white">Business Hours</h3>
                  <p className="text-gray-600 dark:text-gray-300">Monday - Friday: 9:00 AM - 6:00 PM EST</p>
                  <p className="text-gray-600 dark:text-gray-300 text-sm mt-2">We typically respond to legal inquiries within 2-3 business days.</p>
                </div>
              </section> */}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}