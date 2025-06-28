import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function FAQPage() {
  return (
    <div className="container py-16 space-y-12">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">Frequently Asked Questions</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Find answers to common questions about iTradeCoach
        </p>
      </div>

      <div className="max-w-3xl mx-auto">
        <Accordion type="single" collapsible className="w-full space-y-4">
          {[
            {
              question: "How do I get started with iTradeCoach?",
              answer: "Getting started is easy! Simply sign up for an account, browse our verified coaches, and book your first session. You can choose a coach based on their expertise, experience, and student reviews."
            },
            {
              question: "What qualifications do your coaches have?",
              answer: "All our coaches go through a rigorous verification process. They must demonstrate their trading experience, expertise, and teaching ability. Many have professional certifications and years of market experience."
            },
            {
              question: "How much does coaching cost?",
              answer: "Coaching rates vary by coach and are set by individual coaches based on their experience and expertise. You can view each coach's hourly rate on their profile. We offer different subscription plans to make coaching more accessible."
            },
            {
              question: "Can I change my coach?",
              answer: "Yes, you can work with different coaches to find the best fit for your learning style and goals. There's no obligation to stick with one coach."
            },
            {
              question: "How do sessions work?",
              answer: "Sessions are conducted via video call through our platform. You'll receive a link to join your session at the scheduled time. Sessions typically last 60 minutes."
            },
            {
              question: "What is your refund policy?",
              answer: "We offer a satisfaction guarantee for your first session. If you're not satisfied, contact support within 24 hours of your session for a full refund."
            },
            {
              question: "How do I become a coach?",
              answer: "To become a coach, sign up and select 'Coach' as your role. You'll need to complete your profile, submit verification documents, and pass our review process."
            },
            {
              question: "What payment methods do you accept?",
              answer: "We accept all major credit cards and debit cards. Payments are processed securely through our platform."
            }
          ].map((faq, i) => (
            <AccordionItem key={i} value={`item-${i}`}>
              <AccordionTrigger className="text-left">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent>
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>

      <div className="text-center space-y-4">
        <h2 className="text-2xl font-bold">Still have questions?</h2>
        <p className="text-muted-foreground">
          Contact our support team and we'll get back to you as soon as possible.
        </p>
        <div className="flex justify-center gap-4">
          <a href="mailto:support@itradecoach.com" className="text-primary hover:underline">
            support@itradecoach.online
          </a>
        </div>
      </div>
    </div>
  );
}