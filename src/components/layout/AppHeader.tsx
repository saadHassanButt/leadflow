'use client';

import React, { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Zap, Menu, X, Home, BarChart3, Users, Mail, Settings } from 'lucide-react';
import { Button } from '@/components/ui';

interface AppHeaderProps {
  projectId?: string;
}

export const AppHeader: React.FC<AppHeaderProps> = ({ projectId }) => {
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isHomePage = pathname === '/';
  const isProjectPage = pathname.startsWith('/project/');

  // Navigation items for different contexts
  const homeNavItems = [
    { label: 'Features', href: '#features' },
    { label: 'How it Works', href: '#how-it-works' },
    { label: 'Testimonials', href: '#testimonials' },
  ];

  const projectNavItems = projectId ? [
    { 
      label: 'Dashboard', 
      href: `/project/${projectId}/dashboard`,
      icon: <BarChart3 className="w-4 h-4" />,
      active: pathname.includes('/dashboard')
    },
    { 
      label: 'Leads', 
      href: `/project/${projectId}/leads`,
      icon: <Users className="w-4 h-4" />,
      active: pathname.includes('/leads')
    },
    { 
      label: 'Template', 
      href: `/project/${projectId}/template`,
      icon: <Mail className="w-4 h-4" />,
      active: pathname.includes('/template')
    },
    { 
      label: 'Campaign', 
      href: `/project/${projectId}/campaign`,
      icon: <Settings className="w-4 h-4" />,
      active: pathname.includes('/campaign')
    },
  ] : [];

  const navItems = isProjectPage ? projectNavItems : homeNavItems;

  const handleNavigation = (href: string) => {
    if (href.startsWith('#')) {
      // Scroll to section for homepage
      const element = document.querySelector(href);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      // Navigate to page
      router.push(href);
    }
    setIsMobileMenuOpen(false);
  };

  const handleLogoClick = () => {
    router.push('/');
  };

  return (
    <header className="bg-neutral-800 shadow-lg border-b border-neutral-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div 
            className="flex items-center space-x-2 cursor-pointer"
            onClick={handleLogoClick}
          >
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">LeadFlow</span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            {!isProjectPage && (
              <Button
                onClick={() => router.push('/')}
                variant={isHomePage ? 'nav-active' : 'nav'}
                size="md"
                icon={<Home className="w-4 h-4" />}
              >
                Home
              </Button>
            )}
            
            {navItems.map((item) => (
              <Button
                key={item.label}
                onClick={() => handleNavigation(item.href)}
                variant={'active' in item && item.active ? 'nav-active' : 'nav'}
                size="md"
                icon={'icon' in item ? item.icon as React.ReactNode : undefined}
              >
                {item.label}
              </Button>
            ))}
          </nav>

          {/* Desktop CTA Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            <Button
              onClick={() => router.push('/dashboard')}
              className="bg-orange-500 hover:bg-orange-600 text-white"
              icon={<BarChart3 className="w-4 h-4" />}
            >
              Main Dashboard
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden p-2"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            icon={isMobileMenuOpen ? <X className="w-6 h-6 text-white" /> : <Menu className="w-6 h-6 text-white" />}
          />
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 space-y-2 border-t border-neutral-700">
            {!isProjectPage && (
              <Button
                onClick={() => handleNavigation('/')}
                variant={isHomePage ? 'nav-active' : 'nav'}
                size="md"
                className="w-full justify-start"
                icon={<Home className="w-4 h-4" />}
              >
                Home
              </Button>
            )}
            
            {navItems.map((item) => (
              <Button
                key={item.label}
                onClick={() => handleNavigation(item.href)}
                variant={'active' in item && item.active ? 'nav-active' : 'nav'}
                size="md"
                className="w-full justify-start"
                icon={'icon' in item ? item.icon as React.ReactNode : undefined}
              >
                {item.label}
              </Button>
            ))}
            
            <div className="px-4 pt-4 space-y-2 border-t border-neutral-700">
              <Button
                onClick={() => {
                  router.push('/dashboard');
                  setIsMobileMenuOpen(false);
                }}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                icon={<BarChart3 className="w-4 h-4" />}
              >
                Main Dashboard
              </Button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
