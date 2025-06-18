'use client';

import Head from 'next/head';
import { useState, useEffect } from 'react';
import { 
  ChevronUpIcon,
  EnvelopeIcon,
  ChatBubbleLeftRightIcon,
  QuestionMarkCircleIcon,
  ExclamationTriangleIcon,
  AcademicCapIcon,
  CreditCardIcon
} from '@heroicons/react/24/outline';

export default function Contact() {
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    category: '',
    message: ''
  });

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    console.log('Form submitted:', formData);
    // Reset form
    setFormData({
      name: '',
      email: '',
      subject: '',
      category: '',
      message: ''
    });
    alert('Thank you for your message! We\'ll get back to you within 24 hours.');
  };

  const contactOptions = [
    {
      icon: <QuestionMarkCircleIcon className="h-8 w-8" />,
      title: 'General Support',
      description: 'Questions about our platform, features, or getting started.',
      email: 'support@itradecoach.com',
      responseTime: 'Usually responds within 6 hours'
    },
    {
      icon: <AcademicCapIcon className="h-8 w-8" />,
      title: 'Educational Inquiries',
      description: 'Questions about courses, coaching, or curriculum content.',
      email: 'education@itradecoach.com',
      responseTime: 'Usually responds within 12 hours'
    },
    {
      icon: <CreditCardIcon className="h-8 w-8" />,
      title: 'Billing & Payments',
      description: 'Issues with subscriptions, payments, or account billing.',
      email: 'billing@itradecoach.com',
      responseTime: 'Usually responds within 4 hours'
    },
    {
      icon: <ExclamationTriangleIcon className="h-8 w-8" />,
      title: 'Technical Issues',
      description: 'Platform bugs, technical problems, or account access issues.',
      email: 'tech@itradecoach.com',
      responseTime: 'Usually responds within 2 hours'
    }
  ];

  const faqs = [
    {
      question: 'How do I get started with iTradeCoach?',
      answer: 'Simply sign up for an account, choose your subscription plan, and you can immediately access our learning materials and book coaching sessions.'
    },
    {
      question: 'What experience level do I need?',
      answer: 'Our platform caters to all experience levels, from complete beginners to advanced traders looking to refine their strategies.'
    },
    {
      question: 'How does the coaching work?',
      answer: 'You can book one-on-one sessions with our certified coaches through the platform. Sessions are conducted via video call and can be scheduled based on your availability.'
    },
    {
      question: 'Can I cancel my subscription anytime?',
      answer: 'Yes, you can cancel your subscription at any time through your account settings. You\'ll retain access until the end of your billing period.'
    },
    {
      question: 'Do you offer refunds?',
      answer: 'We offer a 30-day money-back guarantee for new subscribers. Individual coaching sessions can be cancelled up to 24 hours in advance.'
    }
  ];

  return (
    <>
      <Head>
        <title>Contact Us - iTradeCoach</title>
        <meta 
          name="description" 
          content="Get in touch with iTradeCoach. We're here to help with questions about our trading education platform, technical support, and more." 
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
            <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-6">Get in Touch</h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto leading-relaxed">
              We're here to help! Whether you have questions about our platform, need technical support, or want to learn more about our coaching services, our team is ready to assist you.
            </p>
          </div>

          {/* Contact Options */}
          {/* <div className="grid md:grid-cols-2 gap-6 mb-16">
            {contactOptions.map((option, index) => (
              <div key={index} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-start gap-4">
                  <div className="text-blue-600 dark:text-blue-400 flex-shrink-0">
                    {option.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{option.title}</h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">{option.description}</p>
                    <div className="space-y-2">
                      <a 
                        href={`mailto:${option.email}`}
                        className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                      >
                        {option.email}
                      </a>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{option.responseTime}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div> */}

          {/* Contact Form */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 mb-16">
            <div className="flex items-center gap-3 mb-8">
              <EnvelopeIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Send us a Message</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors"
                    placeholder="Your full name"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors"
                    placeholder="your.email@example.com"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Category *
                </label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors"
                >
                  <option value="">Select a category</option>
                  <option value="general">General Support</option>
                  <option value="education">Educational Inquiries</option>
                  <option value="billing">Billing & Payments</option>
                  <option value="technical">Technical Issues</option>
                  <option value="partnership">Partnership Opportunities</option>
                  <option value="feedback">Feedback & Suggestions</option>
                </select>
              </div>

              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Subject *
                </label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors"
                  placeholder="Brief description of your inquiry"
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Message *
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  required
                  rows={6}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors resize-none"
                  placeholder="Please provide as much detail as possible to help us assist you better..."
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-medium transition-colors"
                >
                  Send Message
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ name: '', email: '', subject: '', category: '', message: '' })}
                  className="border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white py-3 px-6 rounded-lg font-medium transition-colors"
                >
                  Clear Form
                </button>
              </div>
            </form>
          </div>

          {/* Live Chat Option */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-200 dark:border-green-800 p-8 mb-16">
            <div className="text-center">
              <ChatBubbleLeftRightIcon className="h-12 w-12 text-green-600 dark:text-green-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Need Immediate Help?</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                Our support team is available during business hours (9 AM - 6 PM EST) for live chat assistance.
              </p>
              <button className="bg-green-600 hover:bg-green-700 text-white py-3 px-8 rounded-lg font-medium transition-colors">
                Start Live Chat
              </button>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-8">Frequently Asked Questions</h2>
            <div className="space-y-6">
              {faqs.map((faq, index) => (
                <div key={index} className="border-b border-gray-200 dark:border-gray-700 pb-6 last:border-b-0 last:pb-0">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">{faq.question}</h3>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{faq.answer}</p>
                </div>
              ))}
            </div>
            <div className="text-center mt-8">
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Don't see your question answered here?
              </p>
              <button className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
                View Complete FAQ
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}