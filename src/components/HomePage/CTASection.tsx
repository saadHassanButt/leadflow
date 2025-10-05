'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ParallaxSection, Button } from '@/ui';
import { ArrowRight, CheckCircle, Zap } from 'lucide-react';

const benefits = [
  'No more manual prospecting',
  'AI-powered lead verification',
  'Personalized email campaigns',
  'Real-time performance tracking',
  'Seamless calendar integration',
  '24/7 automated follow-ups',
];

export const CTASection: React.FC = () => {
  return (
    <section className="py-20 bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0">
        {/* Gradient Orbs */}
        <motion.div
          className="absolute top-20 right-20 w-96 h-96 bg-primary-500/20 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        
        <motion.div
          className="absolute bottom-20 left-20 w-72 h-72 bg-primary-500/10 rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        {/* Grid Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="h-full w-full bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
        </div>
      </div>

      <div className="container-custom relative z-10">
        <ParallaxSection speed={0.3} direction="up">
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            {/* Badge */}
            <motion.div
              className="inline-flex items-center px-4 py-2 rounded-full bg-primary-500/20 text-primary-300 text-sm font-medium border border-primary-500/30 mb-8"
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <Zap className="w-4 h-4 mr-2" />
              Limited Time Offer
            </motion.div>

            {/* Main Heading */}
            <h2 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
              Ready to 10x your
              <span className="block bg-gradient-to-r from-primary-400 to-primary-300 bg-clip-text text-transparent">
                lead generation?
              </span>
            </h2>

            {/* Subtitle */}
            <p className="text-xl text-neutral-300 mb-12 max-w-3xl mx-auto leading-relaxed">
              Join hundreds of businesses already using LeadFlow to automate 
              their sales pipeline and book more meetings.
            </p>

            {/* Benefits Grid */}
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto mb-12"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true }}
            >
              {benefits.map((benefit, index) => (
                <motion.div
                  key={index}
                  className="flex items-center text-left p-4 bg-white/5 rounded-xl border border-white/10 backdrop-blur-sm"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <CheckCircle className="w-5 h-5 text-primary-400 mr-3 flex-shrink-0" />
                  <span className="text-neutral-200 font-medium">{benefit}</span>
                </motion.div>
              ))}
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              className="flex flex-col sm:flex-row gap-4 justify-center"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              viewport={{ once: true }}
            >
              <Button
                size="lg"
                className="text-base px-8 py-4 group hover:scale-105 transition-transform duration-200 bg-primary-500 hover:bg-primary-600 text-white"
                icon={<Zap className="w-5 h-5" />}
              >
                Start Your Free Trial
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
              
              <Button
                variant="outline"
                size="lg"
                className="text-base px-8 py-4 group hover:scale-105 transition-transform duration-200 border-white/30 text-white hover:bg-white/10"
                icon={<CheckCircle className="w-5 h-5" />}
              >
                Schedule Demo
              </Button>
            </motion.div>

            {/* Trust Indicators */}
            <motion.div
              className="mt-12 pt-8 border-t border-white/10"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              viewport={{ once: true }}
            >
              <p className="text-neutral-400 text-sm mb-4">
                Trusted by leading companies worldwide
              </p>
              <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
                {['TechCorp', 'StartupXYZ', 'GrowthCo', 'InnovateLab', 'ScaleUp'].map((company, index) => (
                  <motion.div
                    key={index}
                    className="text-white font-semibold"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.8 + index * 0.1 }}
                    viewport={{ once: true }}
                  >
                    {company}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        </ParallaxSection>
      </div>
    </section>
  );
};
