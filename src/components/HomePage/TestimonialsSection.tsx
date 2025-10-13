'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ParallaxSection, Card } from '@/ui';
import { Star, Quote } from 'lucide-react';

const testimonials = [
  {
    name: 'Sarah Chen',
    role: 'VP of Sales, TechCorp',
    content: 'LeadFlow increased our meeting bookings by 300% in just 2 months. The automation is incredible.',
    rating: 5,
    avatar: 'SC',
    company: 'TechCorp',
  },
  {
    name: 'Mike Rodriguez',
    role: 'Founder, StartupXYZ',
    content: 'Finally, a tool that actually delivers qualified leads. Our pipeline has never been fuller.',
    rating: 5,
    avatar: 'MR',
    company: 'StartupXYZ',
  },
  {
    name: 'Emily Watson',
    role: 'Sales Director, GrowthCo',
    content: 'The AI-powered outreach feels so personal. Our response rates have tripled.',
    rating: 5,
    avatar: 'EW',
    company: 'GrowthCo',
  },
  {
    name: 'David Kim',
    role: 'CEO, InnovateLab',
    content: 'LeadFlow transformed our entire sales process. We went from manual prospecting to automated success.',
    rating: 5,
    avatar: 'DK',
    company: 'InnovateLab',
  },
  {
    name: 'Lisa Thompson',
    role: 'Marketing Manager, ScaleUp',
    content: 'The email validation feature alone saved us thousands in bounce costs. Game changer!',
    rating: 5,
    avatar: 'LT',
    company: 'ScaleUp',
  },
  {
    name: 'James Wilson',
    role: 'Sales Manager, ProActive',
    content: 'The analytics and reporting are outstanding. We can finally track ROI on our outreach efforts.',
    rating: 5,
    avatar: 'JW',
    company: 'ProActive',
  },
];

export const TestimonialsSection: React.FC = () => {
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
              What our customers say
            </h2>
            <p className="text-xl text-neutral-600 max-w-2xl mx-auto">
              Join hundreds of businesses already using LeadFlow to automate their sales pipeline
            </p>
          </motion.div>
        </ParallaxSection>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
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
                  <div className="space-y-6">
                    {/* Quote Icon */}
                    <div className="flex justify-start">
                      <div className="w-12 h-12 bg-primary-500/10 rounded-full flex items-center justify-center">
                        <Quote className="w-6 h-6 text-primary-500" />
                      </div>
                    </div>

                    {/* Rating */}
                    <div className="flex items-center space-x-1">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star
                          key={i}
                          className="w-5 h-5 text-yellow-400 fill-current"
                        />
                      ))}
                    </div>

                    {/* Content */}
                    <blockquote className="text-neutral-700 leading-relaxed italic">
                      &ldquo;{testimonial.content}&rdquo;
                    </blockquote>

                    {/* Author */}
                    <div className="flex items-center space-x-4 pt-4 border-t border-neutral-200">
                      {/* Avatar */}
                      <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center text-white font-semibold">
                        {testimonial.avatar}
                      </div>
                      
                      <div>
                        <div className="font-semibold text-dark-900">
                          {testimonial.name}
                        </div>
                        <div className="text-sm text-neutral-500">
                          {testimonial.role}
                        </div>
                        <div className="text-xs text-primary-500 font-medium">
                          {testimonial.company}
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            </ParallaxSection>
          ))}
        </div>

        {/* Bottom Stats */}
        <ParallaxSection speed={0.4} direction="up">
          <motion.div
            className="mt-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <div className="bg-gradient-to-r from-primary-500 to-primary-700 rounded-2xl p-8 text-white">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                {[
                  { label: 'Happy Customers', value: '500+' },
                  { label: 'Leads Generated', value: '50K+' },
                  { label: 'Meetings Booked', value: '2.5K+' },
                  { label: 'Response Rate', value: '25%' },
                ].map((stat, index) => (
                  <motion.div
                    key={index}
                    className="group"
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    viewport={{ once: true }}
                  >
                    <div className="text-3xl md:text-4xl font-bold mb-2 group-hover:scale-110 transition-transform duration-300">
                      {stat.value}
                    </div>
                    <div className="text-primary-100 text-sm font-medium">
                      {stat.label}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </ParallaxSection>
      </div>
    </section>
  );
};
