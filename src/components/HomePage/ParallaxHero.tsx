'use client';

import React, { useRef, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ParallaxSection, ThreeDIcons, FloatingParticles } from '@/ui';
import { Button } from '@/ui';
import { ArrowRight, Play, Zap, Target, Mail, BarChart3, Users } from 'lucide-react';

export const ParallaxHero: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  });

  const y = useTransform(scrollYProgress, [0, 1], ['0%', '50%']);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  return (
    <section
      ref={containerRef}
      className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-neutral-100 via-neutral-50 to-primary-50"
    >
      {/* Background Elements */}
      <div className="absolute inset-0">
        {/* Gradient Orbs */}
        <motion.div
          className="absolute top-20 left-20 w-72 h-72 bg-primary-500/20 rounded-full blur-3xl"
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
          className="absolute bottom-20 right-20 w-96 h-96 bg-dark-900/10 rounded-full blur-3xl"
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

        {/* Floating Particles */}
        <div className="absolute inset-0">
          <ThreeDIcons className="w-full h-full" />
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 container-custom">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Text Content */}
          <motion.div
            className="space-y-8"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          >
            {/* Badge */}
            <motion.div
              className="inline-flex items-center px-4 py-2 rounded-full bg-primary-500/10 text-primary-700 text-sm font-medium border border-primary-200"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              <Zap className="w-4 h-4 mr-2" />
              Trusted by 100+ companies worldwide
            </motion.div>

            {/* Main Heading */}
            <motion.h1
              className="text-5xl md:text-7xl font-bold text-dark-900 leading-tight"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
            >
              Generate Leads on
              <span className="block bg-gradient-to-r from-primary-500 to-primary-700 bg-clip-text text-transparent">
                Autopilot
              </span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              className="text-xl md:text-2xl text-neutral-600 leading-relaxed max-w-2xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              Complete end-to-end solution for lead generation. Discover, verify, 
              and convert prospects into meetings with our AI-powered automation platform.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              className="flex flex-col sm:flex-row gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
            >
              <Button
                size="lg"
                className="text-base px-8 py-4 group hover:scale-105 transition-transform duration-200"
                icon={<Target className="w-5 h-5" />}
              >
                Create Your First Project
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
              
              <Button
                variant="outline"
                size="lg"
                className="text-base px-8 py-4 group hover:scale-105 transition-transform duration-200"
                icon={<Play className="w-4 h-4" />}
              >
                Watch Demo
              </Button>
            </motion.div>

            {/* Stats */}
            <motion.div
              className="grid grid-cols-2 md:grid-cols-4 gap-8 pt-8"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.8 }}
            >
              {[
                { label: 'Leads Generated', value: '10,000+', color: 'text-primary-600' },
                { label: 'Meetings Scheduled', value: '500+', color: 'text-success-600' },
                { label: 'Response Rate', value: '25%', color: 'text-accent-600' },
                { label: 'Active Users', value: '100+', color: 'text-secondary-600' },
              ].map((stat, index) => (
                <motion.div
                  key={index}
                  className="text-center group"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.7 + index * 0.1, duration: 0.5 }}
                >
                  <div className={`text-3xl md:text-4xl font-bold ${stat.color} mb-2 group-hover:scale-110 transition-transform duration-300`}>
                    {stat.value}
                  </div>
                  <div className="text-sm md:text-base text-neutral-600 font-medium">
                    {stat.label}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          {/* Right Column - 3D Icons */}
          <motion.div
            className="relative"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
          >
            <div className="relative w-full h-96 lg:h-[500px]">
              <ThreeDIcons className="w-full h-full" />
              
              {/* Floating Feature Cards */}
              <motion.div
                className="absolute top-10 -left-10 bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-white/20"
                animate={{
                  y: [0, -10, 0],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary-500 rounded-lg flex items-center justify-center">
                    <Target className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="font-semibold text-dark-900">Smart Discovery</div>
                    <div className="text-sm text-neutral-600">AI-powered leads</div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                className="absolute top-32 -right-10 bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-white/20"
                animate={{
                  y: [0, 10, 0],
                }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-success-500 rounded-lg flex items-center justify-center">
                    <Mail className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="font-semibold text-dark-900">Auto Outreach</div>
                    <div className="text-sm text-neutral-600">Personalized emails</div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                className="absolute bottom-20 left-10 bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-white/20"
                animate={{
                  y: [0, -15, 0],
                }}
                transition={{
                  duration: 6,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-accent-500 rounded-lg flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="font-semibold text-dark-900">Real-time Analytics</div>
                    <div className="text-sm text-neutral-600">Track performance</div>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
        animate={{
          y: [0, 10, 0],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        <div className="w-6 h-10 border-2 border-primary-500 rounded-full flex justify-center">
          <motion.div
            className="w-1 h-3 bg-primary-500 rounded-full mt-2"
            animate={{
              y: [0, 12, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        </div>
      </motion.div>
    </section>
  );
};
