'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ParallaxSection, Card } from '@/ui';
import { Target, Mail, BarChart3, Users, Zap, Shield } from 'lucide-react';

const features = [
  {
    icon: <Target className="w-8 h-8" />,
    title: "Smart Lead Discovery",
    description: "AI-powered prospect identification across multiple channels with advanced filtering and targeting capabilities.",
    color: "from-primary-500 to-primary-600",
  },
  {
    icon: <Mail className="w-8 h-8" />,
    title: "Automated Outreach",
    description: "Personalized email campaigns that convert with dynamic content and intelligent send timing.",
    color: "from-success-500 to-success-600",
  },
  {
    icon: <BarChart3 className="w-8 h-8" />,
    title: "Real-time Analytics",
    description: "Track performance and optimize your campaigns with comprehensive reporting and insights.",
    color: "from-accent-500 to-accent-600",
  },
  {
    icon: <Users className="w-8 h-8" />,
    title: "Meeting Management",
    description: "Seamless calendar integration and scheduling with automated follow-up sequences.",
    color: "from-info-500 to-info-600",
  },
  {
    icon: <Zap className="w-8 h-8" />,
    title: "Workflow Automation",
    description: "End-to-end pipeline management with n8n integration for complex automation workflows.",
    color: "from-warning-500 to-warning-600",
  },
  {
    icon: <Shield className="w-8 h-8" />,
    title: "Email Validation",
    description: "Advanced email verification to ensure high deliverability and maintain sender reputation.",
    color: "from-error-500 to-error-600",
  },
];

export const FeaturesSection: React.FC = () => {
  return (
    <section className="py-20 bg-gradient-to-b from-neutral-100 to-neutral-50">
      <div className="container-custom">
        {/* Section Header */}
        <ParallaxSection speed={0.3} direction="up">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-dark-900 mb-6">
              Everything you need to scale your outreach
            </h2>
            <p className="text-xl text-neutral-600 max-w-3xl mx-auto">
              From lead discovery to meeting scheduling, our platform handles 
              every step of your sales pipeline automatically.
            </p>
          </motion.div>
        </ParallaxSection>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <ParallaxSection
              key={index}
              speed={0.2}
              direction="up"
              offset={['start end', 'end start']}
            >
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card
                  variant="elevated"
                  hover
                  className="h-full group hover:scale-105 transition-all duration-300"
                >
                  <div className="text-center">
                    {/* Icon */}
                    <motion.div
                      className={`w-16 h-16 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center text-white mx-auto mb-6 group-hover:scale-110 transition-transform duration-300`}
                      whileHover={{ rotate: 5 }}
                    >
                      {feature.icon}
                    </motion.div>

                    {/* Content */}
                    <h3 className="text-xl font-semibold text-dark-900 mb-3">
                      {feature.title}
                    </h3>
                    <p className="text-neutral-600 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </Card>
              </motion.div>
            </ParallaxSection>
          ))}
        </div>

        {/* Bottom CTA */}
        <ParallaxSection speed={0.4} direction="up">
          <motion.div
            className="text-center mt-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <div className="bg-gradient-to-r from-primary-500 to-primary-700 rounded-2xl p-8 text-white">
              <h3 className="text-2xl font-bold mb-4">
                Ready to transform your lead generation?
              </h3>
              <p className="text-primary-100 mb-6 max-w-2xl mx-auto">
                Join hundreds of businesses already using LeadFlow to automate 
                their sales pipeline and book more meetings.
              </p>
              <motion.button
                className="bg-white text-primary-600 px-8 py-3 rounded-lg font-semibold hover:bg-primary-50 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Get Started Today
              </motion.button>
            </div>
          </motion.div>
        </ParallaxSection>
      </div>
    </section>
  );
};
