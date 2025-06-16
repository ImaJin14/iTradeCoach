'use client';

import Head from 'next/head';
import { useState, useEffect } from 'react';
import { 
  ChevronUpIcon,
  MapPinIcon,
  ClockIcon,
  CurrencyDollarIcon,
  AcademicCapIcon,
  HeartIcon,
  CodeBracketIcon,
  ChartBarIcon,
  UsersIcon
} from '@heroicons/react/24/outline';

export default function Careers() {
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

  const benefits = [
    {
      icon: <MapPinIcon className="h-6 w-6" />,
      title: 'Remote-First Culture',
      description: 'Work from anywhere in the world with flexible schedules and async collaboration.'
    },
    {
      icon: <AcademicCapIcon className="h-6 w-6" />,
      title: 'Learning & Development',
      description: 'Continuous learning budget, conference attendance, and skill development opportunities.'
    },
    {
      icon: <HeartIcon className="h-6 w-6" />,
      title: 'Health & Wellness',
      description: 'Comprehensive health insurance, mental health support, and wellness stipends.'
    },
    {
      icon: <CurrencyDollarIcon className="h-6 w-6" />,
      title: 'Competitive Compensation',
      description: 'Market-rate salaries, equity participation, and performance-based bonuses.'
    },
    {
      icon: <ClockIcon className="h-6 w-6" />,
      title: 'Work-Life Balance',
      description: 'Flexible hours, unlimited PTO, and respect for personal time and boundaries.'
    },
    {
      icon: <UsersIcon className="h-6 w-6" />,
      title: 'Collaborative Environment',
      description: 'Work with passionate professionals who value innovation and mutual support.'
    }
  ];

  const openPositions = [
    {
      id: 1,
      title: 'Senior Full-Stack Developer',
      department: 'Engineering',
      type: 'Full-time',
      location: 'Remote',
      icon: <CodeBracketIcon className="h-6 w-6" />,
      description: 'Build and scale our educational platform using modern web technologies. Work on real-time features, AI integrations, and user experience optimization.',
      requirements: [
        '5+ years experience with React, Node.js, and TypeScript',
        'Experience with real-time applications and WebRTC',
        'Knowledge of cloud platforms (AWS/GCP)',
        'Passion for educational technology'
      ]
    },
    {
      id: 2,
      title: 'Senior Trading Coach',
      department: 'Education',
      type: 'Full-time',
      location: 'Remote',
      icon: <ChartBarIcon className="h-6 w-6" />,
      description: 'Mentor students through one-on-one coaching sessions and develop educational content. Share your trading expertise to help others succeed.',
      requirements: [
        '7+ years of professional trading experience',
        'Proven track record in forex, stocks, or crypto markets',
        'Teaching or mentoring experience preferred',
        'Strong communication and interpersonal skills'
      ]
    },
    {
      id: 3,
      title: 'Product Manager',
      department: 'Product',
      type: 'Full-time',
      location: 'Remote',
      icon: <AcademicCapIcon className="h-6 w-6" />,
      description: 'Drive product strategy and roadmap for our educational platform. Work closely with engineering, design, and education teams.',
      requirements: [
        '4+ years of product management experience',
        'Experience with educational or fintech products',
        'Strong analytical and user research skills',
        'Experience with agile development processes'
      ]
    },
    {
      id: 4,
      title: 'Content Creator & Curriculum Designer',
      department: 'Education',
      type: 'Full-time',
      location: 'Remote',
      icon: <AcademicCapIcon className="h-6 w-6" />,
      description: 'Design comprehensive trading curricula and create engaging educational content including videos, articles, and interactive materials.',
      requirements: [
        'Background in trading and financial markets',
        'Experience in instructional design or education',
        'Strong writing and video production skills',
        'Familiarity with learning management systems'
      ]
    }
  ];

  const values = [
    {
      title: 'Innovation',
      description: 'We embrace new technologies and approaches to solve complex educational challenges.'
    },
    {
      title: 'Transparency',
      description: 'We maintain open communication and honest feedback in all our interactions.'
    },
    {
      title: 'Growth Mindset',
      description: 'We believe in continuous learning and improvement, both personally and professionally.'
    },
    {
      title: 'Impact Focus',
      description: 'We measure success by the positive impact we have on our students\' lives.'
    }
  ];

  return (
    <>
      <Head>
        <title>Careers - iTradeCoach</title>
        <meta 
          name="description" 
          content="Join the iTradeCoach team and help democratize trading education. We're hiring talented individuals passionate about education and technology." 
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
            <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-6">Join Our Mission</h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto leading-relaxed">
              Help us democratize trading education and empower the next generation of successful traders. We're looking for passionate individuals who believe in the power of education to transform lives.
            </p>
          </div>

          {/* Why Join Us */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 mb-16">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-8">Why Join iTradeCoach?</h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 text-center mb-12 leading-relaxed">
              As a recently founded company, we offer unique opportunities to shape the future of trading education from the ground up. Every team member has a direct impact on our mission and the thousands of students we serve.
            </p>

            <div className="grid md:grid-cols-2 gap-6">
              {values.map((value, index) => (
                <div key={index} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">{value.title}</h3>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{value.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Benefits */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-12">Benefits & Perks</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {benefits.map((benefit, index) => (
                <div key={index} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                  <div className="text-blue-600 dark:text-blue-400 mb-4">{benefit.icon}</div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">{benefit.title}</h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">{benefit.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Open Positions */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-12">Open Positions</h2>
            <div className="space-y-6">
              {openPositions.map((position) => (
                <div key={position.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
                  <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                    <div className="flex-1">
                      <div className="flex items-start gap-4 mb-4">
                        <div className="text-blue-600 dark:text-blue-400 mt-1">{position.icon}</div>
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{position.title}</h3>
                          <div className="flex flex-wrap gap-3 mb-4">
                            <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 px-3 py-1 rounded-full text-sm font-medium">
                              {position.department}
                            </span>
                            <span className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 px-3 py-1 rounded-full text-sm font-medium">
                              {position.type}
                            </span>
                            <span className="bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400 px-3 py-1 rounded-full text-sm font-medium">
                              {position.location}
                            </span>
                          </div>
                          <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">{position.description}</p>
                        </div>
                      </div>

                      <div className="mb-6">
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Key Requirements:</h4>
                        <ul className="space-y-2">
                          {position.requirements.map((req, index) => (
                            <li key={index} className="flex items-start gap-3">
                              <div className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                              <span className="text-gray-600 dark:text-gray-300">{req}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="lg:w-48 flex-shrink-0">
                      <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-medium transition-colors">
                        Apply Now
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Application Process */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-800 p-8 mb-16">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-8">Our Hiring Process</h2>
            <div className="grid md:grid-cols-4 gap-6">
              {[
                { step: '1', title: 'Application', description: 'Submit your resume and cover letter' },
                { step: '2', title: 'Phone Screen', description: '30-minute conversation with our team' },
                { step: '3', title: 'Technical/Case Study', description: 'Role-specific assessment or project' },
                { step: '4', title: 'Final Interview', description: 'Meet the team and cultural fit discussion' }
              ].map((stage, index) => (
                <div key={index} className="text-center">
                  <div className="w-12 h-12 bg-blue-600 dark:bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-lg mx-auto mb-4">
                    {stage.step}
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{stage.title}</h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">{stage.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Don't See a Perfect Fit?</h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
              We're always looking for exceptional talent. If you're passionate about our mission and believe you can contribute to our team, we'd love to hear from you.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-blue-600 hover:bg-blue-700 text-white py-3 px-8 rounded-lg font-medium transition-colors">
                Send General Application
              </button>
              <button className="border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white py-3 px-8 rounded-lg font-medium transition-colors">
                Join Our Talent Pool
              </button>
            </div>
            <p className="text-gray-500 dark:text-gray-400 mt-6">
              Questions? Email us at <a href="mailto:careers@itradecoach.com" className="text-blue-600 dark:text-blue-400 hover:underline">careers@itradecoach.com</a>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}