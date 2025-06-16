import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy - iTradeCoach',
  description: 'Privacy Policy for iTradeCoach. Learn how we collect, use, and protect your personal information.',
  keywords: 'privacy policy, data protection, iTradeCoach privacy',
  robots: 'index, follow',
};

export default function PrivacyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}