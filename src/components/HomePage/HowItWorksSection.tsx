'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ParallaxSection, Card } from '@/ui';
import { ArrowRight, CheckCircle } from 'lucide-react';

const steps = [
  {
    number: '01',
    title: 'Create Project',
    description: 'Set up your campaign with target criteria and goals',
    details: [
      'Define your target audience',
      'Set campaign objectives',
      'Configure lead generation settings',
    ],
  },
  {
    number: '02',
    title: 'Discover Leads',
    description: 'AI finds and verifies prospects matching your criteria',
    details: [
      'AI-powered lead discovery',
      'Email validation and verification',
      'Contact information enrichment',
    ],
  },
  {
    number: '03',
    title: 'Launch Campaign',
    description: 'Automated personalized outreach at scale',
    details: [
      'Personalized email templates',
      'Automated sending sequences',
      'A/B testing and optimization',
    ],
  },
  {
    number: '04',
    title: 'Book Meetings',
    description: 'Convert responses into qualified meetings',
    details: [
      'Response tracking and management',
      'Calendar integration',
      'Meeting scheduling automation',
    ],
  },
];

export const HowItWorksSection: React.FC = () => {
  return (
    <section className="py-20 bg-gradient-to-b from-neutral-50 to-neutral-100">
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
              How it works
            </h2>
            <p className="text-xl text-neutral-600 max-w-2xl mx-auto">
              Get started in minutes with our simple 4-step process
            </p>
          </motion.div>
        </ParallaxSection>

        {/* Steps */}
        <div className="space-y-16">
          {steps.map((step, index) => (
            <ParallaxSection
              key={index}
              speed={0.2}
              direction={index % 2 === 0 ? 'left' : 'right'}
              offset={['start end', 'end start']}
            >
              <motion.div
                className={`flex flex-col lg:flex-row items-center gap-12 ${
                  index % 2 === 1 ? 'lg:flex-row-reverse' : ''
                }`}
                initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: index * 0.2 }}
                viewport={{ once: true }}
              >
                {/* Step Number and Icon */}
                <div className="flex-shrink-0">
                  <motion.div
                    className="relative"
                    whileHover={{ scale: 1.1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="w-32 h-32 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center text-white text-4xl font-bold shadow-2xl">
                      {step.number}
                    </div>
                    
                    {/* Connecting Line */}
                    {index < steps.length - 1 && (
                      <div className="hidden lg:block absolute top-1/2 -right-16 w-32 h-0.5 bg-gradient-to-r from-primary-500 to-transparent" />
                    )}
                  </motion.div>
                </div>

                {/* Step Content */}
                <div className="flex-1">
                  <Card variant="elevated" className="p-8">
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-2xl font-bold text-dark-900 mb-3">
                          {step.title}
                        </h3>
                        <p className="text-lg text-neutral-600">
                          {step.description}
                        </p>
                      </div>

                      {/* Step Details */}
                      <div className="space-y-3">
                        {step.details.map((detail, detailIndex) => (
                          <motion.div
                            key={detailIndex}
                            className="flex items-center space-x-3"
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ 
                              duration: 0.5, 
                              delay: detailIndex * 0.1 
                            }}
                            viewport={{ once: true }}
                          >
                            <CheckCircle className="w-5 h-5 text-primary-500 flex-shrink-0" />
                            <span className="text-neutral-700">{detail}</span>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </Card>
                </div>
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
            <div className="bg-dark-900 rounded-2xl p-12 text-white">
              <h3 className="text-3xl font-bold mb-4">
                Ready to get started?
              </h3>
              <p className="text-neutral-300 mb-8 max-w-2xl mx-auto">
                Join thousands of businesses already using LeadFlow to automate 
                their sales pipeline and generate more qualified leads.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <motion.button
                  className="bg-primary-500 text-white px-8 py-4 rounded-lg font-semibold hover:bg-primary-600 transition-colors flex items-center justify-center"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Start Your Free Trial
                  <ArrowRight className="w-5 h-5 ml-2" />
                </motion.button>
                <motion.button
                  className="border border-neutral-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-neutral-800 transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Schedule Demo
                </motion.button>
              </div>
            </div>
          </motion.div>
        </ParallaxSection>
      </div>
    </section>
  );
};
