"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { ArrowRight, MapPin, Mail, Check, Menu, X } from "lucide-react"

interface LandingPageProps {
  onGetStarted: () => void
  onStartGuestChat: (message: string) => void
  onGuestDashboard: () => void
}

export function LandingPage({ onGetStarted, onStartGuestChat, onGuestDashboard }: LandingPageProps) {
  const [currentPage, setCurrentPage] = useState("home")
  const [mounted, setMounted] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handlePageChange = (page: string) => {
    setCurrentPage(page)
    setIsMobileMenuOpen(false)
    scrollToTop()
  }

  // Shared Components
  const TopNavBar = () => (
    <nav className="fixed top-0 left-0 w-full z-50 h-20 bg-[#191919]/70 dark:bg-[#191919]/70 backdrop-blur-2xl shadow-[0_0_64px_rgba(0,0,0,0.5)] border-none">
      <div className="flex justify-between items-center w-full px-6 md:px-12 max-w-[1920px] mx-auto h-full">
        <button onClick={() => handlePageChange('home')} className="text-2xl font-black tracking-[-0.06em] text-[#c6c6c7] dark:text-white uppercase font-['Inter']">
          AI CHATBOT
        </button>
        <div className="hidden md:flex gap-8 items-center font-['Inter'] tracking-[-0.04em] text-sm uppercase">
          <button onClick={() => handlePageChange('home')} className={currentPage === 'home' ? "text-[#c6c6c7] dark:text-white border-b border-[#c6c6c7]/30 pb-1 hover:text-white hover:bg-white/5 rounded-md px-3 pt-1 transition-all duration-500 scale-95" : "text-[#ababab] dark:text-[#ababab] transition-colors hover:text-white hover:bg-white/5 rounded-md px-3 pt-1 transition-all duration-500 scale-95 hover:scale-100"}>Home</button>
          <button onClick={() => handlePageChange('features')} className={currentPage === 'features' ? "text-[#c6c6c7] dark:text-white border-b border-[#c6c6c7]/30 pb-1 hover:text-white hover:bg-white/5 rounded-md px-3 pt-1 transition-all duration-500 scale-95" : "text-[#ababab] dark:text-[#ababab] transition-colors hover:text-white hover:bg-white/5 rounded-md px-3 pt-1 transition-all duration-500 scale-95 hover:scale-100"}>Features</button>
          <button onClick={() => handlePageChange('pricing')} className={currentPage === 'pricing' ? "text-[#c6c6c7] dark:text-white border-b border-[#c6c6c7]/30 pb-1 hover:text-white hover:bg-white/5 rounded-md px-3 pt-1 transition-all duration-500 scale-95" : "text-[#ababab] dark:text-[#ababab] transition-colors hover:text-white hover:bg-white/5 rounded-md px-3 pt-1 transition-all duration-500 scale-95 hover:scale-100"}>Pricing</button>
          <button onClick={() => handlePageChange('contact')} className={currentPage === 'contact' ? "text-[#c6c6c7] dark:text-white border-b border-[#c6c6c7]/30 pb-1 hover:text-white hover:bg-white/5 rounded-md px-3 pt-1 transition-all duration-500 scale-95" : "text-[#ababab] dark:text-[#ababab] transition-colors hover:text-white hover:bg-white/5 rounded-md px-3 pt-1 transition-all duration-500 scale-95 hover:scale-100"}>Contact</button>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={onGetStarted} className="hidden md:flex items-center justify-center font-['Inter'] tracking-[-0.04em] text-sm uppercase px-6 py-2 rounded-md bg-[#c6c6c7] text-[#3f4041] hover:shadow-[0_0_20px_rgba(198,198,199,0.3)] transition-all duration-300 bg-gradient-to-r from-[#c6c6c7] to-[#b8b9b9]">
            Get Access
          </button>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="flex items-center justify-center w-10 h-10 rounded-md hover:bg-white/5 transition-colors text-[#c6c6c7] dark:text-[#c6c6c7] md:hidden">
            {isMobileMenuOpen ? (
              <X className="w-6 h-6 text-foreground" />
            ) : (
              <Menu className="w-6 h-6 text-foreground" />
            )}
          </button>
        </div>
      </div>
      
      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-20 left-0 w-full bg-[#191919]/95 backdrop-blur-2xl border-t border-[#484848]/20 flex flex-col p-6 shadow-2xl">
          <button onClick={() => handlePageChange('home')} className="text-left py-3 text-[#c6c6c7] font-['Inter'] text-sm tracking-[-0.04em] uppercase border-b border-[#484848]/20">Home</button>
          <button onClick={() => handlePageChange('features')} className="text-left py-3 text-[#c6c6c7] font-['Inter'] text-sm tracking-[-0.04em] uppercase border-b border-[#484848]/20">Features</button>
          <button onClick={() => handlePageChange('pricing')} className="text-left py-3 text-[#c6c6c7] font-['Inter'] text-sm tracking-[-0.04em] uppercase border-b border-[#484848]/20">Pricing</button>
          <button onClick={() => handlePageChange('contact')} className="text-left py-3 text-[#c6c6c7] font-['Inter'] text-sm tracking-[-0.04em] uppercase border-b border-[#484848]/20">Contact</button>
          <button onClick={onGetStarted} className="mt-6 bg-[#c6c6c7] text-[#3f4041] py-3 rounded-md font-['Inter'] text-sm uppercase font-semibold">Get Access</button>
        </div>
      )}
    </nav>
  )

  const Footer = () => (
    <footer className="w-full py-24 mt-auto bg-[#0e0e0e] dark:bg-[#0e0e0e] bg-gradient-to-t from-[#131313] to-transparent relative z-10 transition-colors">
      <div className="flex flex-col md:flex-row justify-between items-center gap-8 px-6 md:px-12 max-w-[1440px] mx-auto text-center md:text-left">
        <div className="text-lg font-bold tracking-tighter text-[#c6c6c7] font-['Inter'] uppercase">
          AI CHATBOT
        </div>
        <div className="flex flex-wrap justify-center gap-6 md:gap-12 font-['Inter'] tracking-[-0.01em] text-xs uppercase text-[#ababab]">
          <button className="text-[#484848] hover:text-[#c6c6c7] transition-colors duration-500 cursor-pointer">Privacy</button>
          <button className="text-[#484848] hover:text-[#c6c6c7] transition-colors duration-500 cursor-pointer">Terms</button>
          <button className="text-[#484848] hover:text-[#c6c6c7] transition-colors duration-500 cursor-pointer">Journal</button>
          <button className="text-[#484848] hover:text-[#c6c6c7] transition-colors duration-500 cursor-pointer">Studio</button>
        </div>
        <div className="font-['Inter'] tracking-[-0.01em] text-xs uppercase text-[#ababab]">
          © {new Date().getFullYear()} AI CHATBOT. ALL RIGHTS RESERVED.
        </div>
      </div>
    </footer>
  )

  const HomeView = () => (
    <main className="flex-grow flex flex-col justify-center items-center px-6 pt-32 pb-24 relative z-10 w-full max-w-[1920px] mx-auto min-h-screen">
      <section className="w-full flex flex-col items-center text-center max-w-[1000px] mx-auto my-auto py-12 md:py-24">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <h1 className="text-5xl sm:text-6xl md:text-8xl lg:text-9xl font-bold tracking-[-0.04em] text-[#c6c6c7] leading-tight mb-8">
            INTELLIGENT<br/>PARTNER
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-[#ababab] font-['Inter'] tracking-[-0.01em] max-w-2xl mx-auto mb-16 leading-relaxed">
            Experience an intelligent AI conversation partner featuring voice input, real-time translation, and seamless file uploads, entirely redefining productivity.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <button onClick={onGetStarted} className="hero-glow bg-[#c6c6c7] text-[#3f4041] px-8 py-4 rounded-md font-['Inter'] tracking-[-0.01em] text-sm uppercase font-semibold w-full sm:w-auto">
              Get Started
            </button>
            <button onClick={onGuestDashboard} className="ghost-border bg-transparent text-[#c6c6c7] px-8 py-4 rounded-md font-['Inter'] tracking-[-0.01em] text-sm uppercase font-medium w-full sm:w-auto hover:text-white">
              Try Dashboard
            </button>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, delay: 0.3 }} className="mt-24 w-full h-[400px] md:h-[600px] rounded-xl overflow-hidden relative border border-[#484848]/15 bg-[#131313] shadow-[0_0_64px_rgba(0,0,0,0.5)]">
          <img alt="Abstract dark minimalist geometry" className="w-full h-full object-cover opacity-80 mix-blend-luminosity" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAKp0uJ_y9ztubFz8N2KSUkbHbo5mlyhZEGPCaKUptP3vzMV4EgIzS3p-HleilfRELW5P9W4NtI5GCRjWyim2YLcj0Dd6rbYbkO_Fa4IhQZowEcsp-KWzNBClQvUKDKzozaQahp9Gig5q-RqE-lFipuGBDZlHTLLjZEYV3HnelzqHv0AKtN1v5lzsQ25CnkHfciZL1MQsOO_pnuBuzP30iSQCg_uQO2StZNCNK4kjz2_J0zUE4Z2Csu6grNiNiTTS-cbOHmLD0pyyFK"/>
        </motion.div>
      </section>

      <section className="w-full max-w-7xl mx-auto py-12 md:py-24 px-0 lg:px-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-[#131313] rounded-xl p-8 md:p-12 relative overflow-hidden group hover:bg-[#262626] transition-colors duration-500 border border-[#484848]/15 hover:border-[#484848]/40 flex flex-col justify-between min-h-[300px] md:min-h-[400px]">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#749aff]/10 blur-[100px] rounded-full group-hover:bg-[#749aff]/20 transition-all duration-700"></div>
            <div className="relative z-10">
              <span className="material-symbols-outlined text-[#c6c6c7] mb-6 text-4xl" style={{fontFamily: 'Material Symbols Outlined', fontVariationSettings: "'FILL' 1"}}>chat</span>
              <h3 className="text-2xl md:text-3xl font-bold tracking-[-0.04em] text-[#c6c6c7] mb-4">Intelligent Conversations</h3>
              <p className="text-[#ababab] tracking-[-0.01em] max-w-md">Engage in natural, context-aware dialogues powered by advanced AI technology, designed for elite performance.</p>
            </div>
          </div>

          <div className="bg-[#131313] rounded-xl p-8 group hover:bg-[#262626] transition-colors duration-500 border border-[#484848]/15 hover:border-[#484848]/40 flex flex-col">
            <span className="material-symbols-outlined text-[#c6c6c7] mb-6 text-3xl" style={{fontFamily: 'Material Symbols Outlined'}}>mic</span>
            <h3 className="text-xl font-bold tracking-[-0.04em] text-[#c6c6c7] mb-3">Voice Input</h3>
            <p className="text-[#ababab] tracking-[-0.01em] text-sm">Speak naturally and watch your words transform into text instantly.</p>
          </div>

          <div className="bg-[#131313] rounded-xl p-8 group hover:bg-[#262626] transition-colors duration-500 border border-[#484848]/15 hover:border-[#484848]/40 flex flex-col">
            <span className="material-symbols-outlined text-[#c6c6c7] mb-6 text-3xl" style={{fontFamily: 'Material Symbols Outlined'}}>translate</span>
            <h3 className="text-xl font-bold tracking-[-0.04em] text-[#c6c6c7] mb-3">Real-time Translation</h3>
            <p className="text-[#ababab] tracking-[-0.01em] text-sm">Break language barriers with instant, accurate multilingual translation.</p>
          </div>

          <div className="md:col-span-2 bg-[#131313] rounded-xl p-8 group hover:bg-[#262626] transition-colors duration-500 border border-[#484848]/15 hover:border-[#484848]/40 flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold tracking-[-0.04em] text-[#c6c6c7] mb-2">Seamless File Uploads</h3>
              <p className="text-[#ababab] tracking-[-0.01em] text-sm max-w-sm">Share documents, images, and context rich files to supercharge your AI's understanding.</p>
            </div>
            <button onClick={onGuestDashboard} className="hidden md:flex items-center justify-center w-12 h-12 rounded-full border border-[#484848]/20 text-[#c6c6c7] group-hover:bg-[#c6c6c7] group-hover:text-[#3f4041] transition-all duration-300 shrink-0 ml-4">
              <ArrowRight className="w-6 h-6" />
            </button>
          </div>
        </div>
      </section>
    </main>
  )

  const FeaturesView = () => (
    <main className="flex-grow pt-40 pb-48 px-6 md:px-12 lg:px-24 max-w-[1920px] mx-auto w-full relative z-10 min-h-screen">
      {/* Ambient Orbs specifically for Features */}
      <div className="fixed top-20 left-1/4 w-[600px] h-[600px] bg-[#749aff] opacity-5 blur-[150px] z-[-1] pointer-events-none rounded-full"></div>
      
      <header className="mb-32 md:mb-48 text-center md:text-left max-w-4xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <h1 className="text-6xl md:text-8xl lg:text-9xl font-bold tracking-[-0.04em] text-[#c6c6c7] leading-[0.85] mb-8">
            POWERFUL<br/>FEATURES
          </h1>
          <p className="text-xl md:text-2xl font-['Inter'] tracking-[-0.01em] text-[#ababab] font-light max-w-2xl">
            Features designed for the curated mind. A system that removes friction to reveal pure intent.
          </p>
        </motion.div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-16 lg:gap-32">
        <section className="md:col-span-7 flex flex-col justify-center">
          <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }} className="p-10 md:p-16 rounded-xl bg-[#131313] transition-colors duration-700 hover:bg-[#262626] group relative overflow-hidden border border-[#484848]/15">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#749aff]/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
            <span className="material-symbols-outlined text-4xl md:text-5xl text-[#c6c6c7] mb-8 block font-light" style={{fontFamily: 'Material Symbols Outlined'}}>chat</span>
            <h2 className="text-3xl md:text-4xl font-bold tracking-[-0.04em] text-[#c6c6c7] mb-6">Intelligent Conversations</h2>
            <p className="text-lg font-['Inter'] tracking-[-0.01em] text-[#ababab] leading-relaxed">
              Engage in natural, context-aware dialogues powered by advanced AI technology, designed for elite performance.
            </p>
            <div className="mt-12 h-px w-full bg-gradient-to-r from-[#484848]/30 to-transparent"></div>
          </motion.div>
        </section>

        <section className="md:col-span-5 flex flex-col justify-end md:mt-48">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7, delay: 0.2 }} className="p-10 rounded-xl bg-[#131313] transition-colors duration-700 hover:bg-[#262626] group border border-[#484848]/15">
            <span className="material-symbols-outlined text-3xl text-[#c6c6c7] mb-6 block font-light" style={{fontFamily: 'Material Symbols Outlined'}}>mic</span>
            <h3 className="text-2xl font-bold tracking-[-0.04em] text-[#c6c6c7] mb-4">Voice Input</h3>
            <p className="text-base font-['Inter'] tracking-[-0.01em] text-[#ababab] leading-relaxed">
              Speak naturally and watch your words transform into text instantly. Hands-free productivity seamlessly integrated.
            </p>
          </motion.div>
        </section>

        <section className="md:col-span-5 flex flex-col justify-start md:-mt-32">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }} className="p-10 rounded-xl bg-[#131313] transition-colors duration-700 hover:bg-[#262626] group border border-[#484848]/15">
            <span className="material-symbols-outlined text-3xl text-[#c6c6c7] mb-6 block font-light" style={{fontFamily: 'Material Symbols Outlined'}}>translate</span>
            <h3 className="text-2xl font-bold tracking-[-0.04em] text-[#c6c6c7] mb-4">Real-time Translation</h3>
            <p className="text-base font-['Inter'] tracking-[-0.01em] text-[#ababab] leading-relaxed">
              Break language barriers with instant, accurate multilingual translation. A global tool for global communication.
            </p>
          </motion.div>
        </section>

        <section className="md:col-span-7 flex flex-col justify-center">
          <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.7, delay: 0.2 }} className="p-10 md:p-16 rounded-xl bg-[#131313] transition-colors duration-700 hover:bg-[#262626] group relative overflow-hidden border border-[#484848]/15">
            <span className="material-symbols-outlined text-4xl md:text-5xl text-[#c6c6c7] mb-8 block font-light" style={{fontFamily: 'Material Symbols Outlined'}}>upload_file</span>
            <h2 className="text-3xl md:text-4xl font-bold tracking-[-0.04em] text-[#c6c6c7] mb-6">Seamless File Uploads</h2>
            <p className="text-lg font-['Inter'] tracking-[-0.01em] text-[#ababab] leading-relaxed">
              Share documents, images, and context rich files to supercharge your AI's understanding. Everything exists securely.
            </p>
            <div className="mt-12 h-px w-full bg-gradient-to-l from-[#484848]/30 to-transparent"></div>
          </motion.div>
        </section>

        <section className="col-span-1 md:col-span-12 mt-20 md:mt-32 mb-16">
          <motion.div initial={{ opacity: 0, scale: 0.98 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.9 }} className="w-full h-[400px] md:h-[614px] rounded-xl overflow-hidden relative border border-[#484848]/15">
            <img alt="Abstract dark geometric architecture" className="w-full h-full object-cover opacity-60 mix-blend-luminosity" src="https://lh3.googleusercontent.com/aida-public/AB6AXuB5_UgpHkpY-zdODNkiDhWtYGhWTWhMzt0qwFSUjFU6gbnfUnzMol3qpVoAHmHkmvDQZpak00JB2TEc1N0uQdkc3oHUJTmLLpZgnm-3jcFlhJ6tMjjWEjAV_bqxlD47YQtvrugJnuLnc33PgrRAkotcYm5m75nua7Xx43RiNFvDhY1WmThKcBeBqZXQUJB1ErkN-vslWeymmd8DPyVGuCX3Bq8STIF-yCBcL0lVXb8Sluz6uGcrs_bNUCZJt6NnhFaIqpnepeA-nlDb"/>
            <div className="absolute inset-0 bg-gradient-to-t from-[#0e0e0e] via-transparent to-[#0e0e0e] opacity-80"></div>
            <div className="absolute bottom-12 left-8 md:left-12 right-12 z-10">
              <h3 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-[-0.04em] text-[#c6c6c7] mb-4 max-w-3xl leading-tight">Design is not how it looks.<br/>It is how it works.</h3>
            </div>
          </motion.div>
        </section>
      </div>
    </main>
  )

  const PricingView = () => (
    <main className="flex-grow pt-40 md:pt-48 pb-32 px-6 md:px-12 w-full max-w-[1440px] mx-auto z-10 min-h-screen relative">
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-[#749aff]/5 rounded-full blur-[150px] pointer-events-none -z-10"></div>
      
      <header className="text-center md:text-left md:flex md:flex-col md:items-center max-w-3xl mx-auto mb-20 md:mb-32">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <h1 className="font-bold text-5xl md:text-7xl font-light text-[#c6c6c7] tracking-[-0.04em] mb-8 text-center">Access the Void</h1>
          <p className="font-['Inter'] text-lg md:text-xl text-[#ababab] font-light tracking-[-0.01em] leading-relaxed max-w-2xl mx-auto text-center">
            Curated tiers for the uncompromising digital architect. Select the stratum that aligns with your scale.
          </p>
        </motion.div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12 items-center">
        {/* Free Plan */}
        <motion.article initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }} className="flex flex-col bg-[#131313] rounded-xl p-8 md:p-10 h-full border border-[#484848]/15 hover:bg-[#262626] hover:border-[#484848]/40 transition-all duration-500 group relative overflow-hidden">
          <div className="mb-10 md:mb-12">
            <h2 className="font-bold text-lg font-medium text-[#ababab] tracking-[-0.04em] mb-4">Free Plan</h2>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="font-bold text-4xl text-[#c6c6c7] tracking-[-0.04em]">$0</span>
              <span className="font-['Inter'] text-sm text-[#ababab]">/ forever</span>
            </div>
            <p className="font-['Inter'] text-sm text-[#757575] mt-4 tracking-[-0.01em]">Perfect for getting started.</p>
          </div>
          <ul className="flex flex-col gap-4 mb-16 flex-grow">
            <li className="flex items-start gap-3">
              <Check className="w-4 h-4 text-[#c6c6c7] mt-0.5" />
              <span className="font-['Inter'] text-sm text-[#e5e5e5] tracking-[-0.01em]">5 Free Prompts per day</span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="w-4 h-4 text-[#c6c6c7] mt-0.5" />
              <span className="font-['Inter'] text-sm text-[#e5e5e5] tracking-[-0.01em]">Basic AI responses</span>
            </li>
            <li className="flex items-start gap-3 opacity-40">
              <Check className="w-4 h-4 text-[#757575] mt-0.5" />
              <span className="font-['Inter'] text-sm text-[#e5e5e5] tracking-[-0.01em]">Advanced Analytics</span>
            </li>
          </ul>
          <button onClick={onGetStarted} className="w-full py-4 px-6 rounded-md border border-[#484848]/20 bg-transparent text-[#c6c6c7] font-bold text-sm tracking-[-0.04em] hover:bg-[#191919] transition-colors duration-300">
            Get Started
          </button>
        </motion.article>

        {/* Pro Plan */}
        <motion.article initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }} className="flex flex-col bg-[#191919] rounded-xl p-8 md:p-12 h-full min-h-[500px] md:min-h-[600px] border border-[#c6c6c7]/20 relative shadow-[0_0_64px_rgba(0,0,0,0.5)] group z-10">
          <div className="absolute inset-0 rounded-xl ring-1 ring-[#c6c6c7]/50 pointer-events-none group-hover:ring-[#c6c6c7]/80 transition-all duration-500"></div>
          <div className="mb-10 md:mb-12 relative z-10">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-lg font-medium text-[#c6c6c7] tracking-[-0.04em]">Pro Plan</h2>
              <span className="text-[10px] uppercase tracking-widest text-[#0e0e0e] bg-[#c6c6c7] px-2 py-1 rounded-sm font-semibold">Standard</span>
            </div>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="font-bold text-5xl text-[#c6c6c7] tracking-[-0.04em]">$19</span>
              <span className="font-['Inter'] text-sm text-[#ababab]">/ month</span>
            </div>
            <p className="font-['Inter'] text-sm text-[#757575] mt-4 tracking-[-0.01em]">The definitive toolset for creators.</p>
          </div>
          <ul className="flex flex-col gap-4 mb-16 flex-grow relative z-10">
            <li className="flex items-start gap-3">
              <Check className="w-4 h-4 text-[#c6c6c7] mt-0.5" />
              <span className="font-['Inter'] text-sm text-[#e5e5e5] tracking-[-0.01em]">Unlimited Prompts</span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="w-4 h-4 text-[#c6c6c7] mt-0.5" />
              <span className="font-['Inter'] text-sm text-[#e5e5e5] tracking-[-0.01em]">Voice Input & Translation</span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="w-4 h-4 text-[#c6c6c7] mt-0.5" />
              <span className="font-['Inter'] text-sm text-[#e5e5e5] tracking-[-0.01em]">File Uploads & Context</span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="w-4 h-4 text-[#c6c6c7] mt-0.5" />
              <span className="font-['Inter'] text-sm text-[#e5e5e5] tracking-[-0.01em]">Priority Architecture Review</span>
            </li>
          </ul>
          <button onClick={onGetStarted} className="w-full py-4 px-6 rounded-md bg-gradient-to-r from-[#c6c6c7] to-[#b8b9b9] text-[#3f4041] font-bold text-sm uppercase tracking-[-0.04em] hover:shadow-[0_0_20px_rgba(198,198,199,0.3)] transition-all duration-300 relative z-10">
            Upgrade to Pro
          </button>
        </motion.article>

        {/* Enterprise Plan */}
        <motion.article initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }} className="flex flex-col bg-[#131313] rounded-xl p-8 md:p-10 h-full border border-[#484848]/15 hover:bg-[#262626] hover:border-[#484848]/40 transition-all duration-500 group">
          <div className="mb-10 md:mb-12">
            <h2 className="font-bold text-lg font-medium text-[#ababab] tracking-[-0.04em] mb-4">Enterprise</h2>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="font-bold text-4xl text-[#c6c6c7] tracking-[-0.04em]">Custom</span>
            </div>
            <p className="font-['Inter'] text-sm text-[#757575] mt-4 tracking-[-0.01em]">Bespoke scale for massive entities.</p>
          </div>
          <ul className="flex flex-col gap-4 mb-16 flex-grow">
            <li className="flex items-start gap-3">
              <Check className="w-4 h-4 text-[#ababab] mt-0.5" />
              <span className="font-['Inter'] text-sm text-[#e5e5e5] tracking-[-0.01em]">Dedicated Infrastructure</span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="w-4 h-4 text-[#ababab] mt-0.5" />
              <span className="font-['Inter'] text-sm text-[#e5e5e5] tracking-[-0.01em]">SLA Guarantee (99.99%)</span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="w-4 h-4 text-[#ababab] mt-0.5" />
              <span className="font-['Inter'] text-sm text-[#e5e5e5] tracking-[-0.01em]">Custom Security Policies</span>
            </li>
          </ul>
          <button onClick={onGetStarted} className="w-full py-4 px-6 rounded-md border border-[#484848]/20 bg-transparent text-[#c6c6c7] font-bold text-sm tracking-[-0.04em] hover:bg-[#191919] transition-colors duration-300">
            Contact Sales
          </button>
        </motion.article>
      </div>
      
      <div className="mt-24 md:mt-32 text-center border-t border-white/5 pt-12 md:pt-16">
        <p className="font-['Inter'] text-sm text-[#ababab] tracking-[-0.01em]">
          Questions regarding scale? <span className="text-[#c6c6c7] hover:text-white transition-colors underline decoration-white/20 underline-offset-4 cursor-pointer">Explore the Codex</span>.
        </p>
      </div>
    </main>
  )

  const ContactView = () => (
    <main className="flex-grow pt-40 md:pt-48 pb-32 px-6 md:px-12 w-full max-w-[1920px] mx-auto relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-8 items-start min-h-screen">
      <div className="lg:col-span-5 lg:sticky top-48 flex flex-col gap-12">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}>
          <h1 className="font-bold text-6xl md:text-8xl xl:text-9xl tracking-[-0.04em] text-[#c6c6c7] leading-[0.9]">
            INITIATE<br/>CONTACT
          </h1>
          <p className="mt-8 text-[#ababab] text-lg md:text-xl font-light leading-relaxed max-w-md font-['Inter']">
            For editorial commissions, structural inquiries, or to request access to the deeper framework, submit your coordinates below. We operate in the quiet spaces.
          </p>
        </motion.div>
        
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }} className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
          <div className="bg-[#131313] rounded-xl p-8 transition-colors duration-500 hover:bg-[#262626] group border border-[#484848]/15">
            <Mail className="text-[#ababab] mb-6 w-8 h-8 group-hover:text-[#c6c6c7] transition-colors duration-300" />
            <h3 className="font-bold text-sm uppercase tracking-[-0.04em] text-[#ababab] mb-2">Direct Channel</h3>
            <p className="text-[#e5e5e5] font-['Inter']">transmission@ai-chatbot.com</p>
          </div>
          <div className="bg-[#131313] rounded-xl p-8 transition-colors duration-500 hover:bg-[#262626] group border border-[#484848]/15">
            <MapPin className="text-[#ababab] mb-6 w-8 h-8 group-hover:text-[#c6c6c7] transition-colors duration-300" />
            <h3 className="font-bold text-sm uppercase tracking-[-0.04em] text-[#ababab] mb-2">Global HQ</h3>
            <p className="text-[#e5e5e5] font-['Inter']">Sector 4, AI Systems</p>
          </div>
        </motion.div>
      </div>

      <div className="lg:col-span-6 lg:col-start-7 pt-8 lg:pt-0">
        <motion.form initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.3 }} className="flex flex-col gap-16 w-full max-w-2xl ml-auto" onSubmit={(e) => { e.preventDefault(); }}>
          <div className="relative group">
            <label className="font-bold text-xs uppercase tracking-widest text-[#ababab] absolute -top-5 left-0 transition-opacity duration-300 opacity-50 group-focus-within:opacity-100 group-focus-within:text-[#749aff]">Name</label>
            <input className="w-full bg-transparent border-0 border-b border-[#484848]/30 py-4 px-0 text-[#e5e5e5] text-xl placeholder:text-[#ababab]/30 focus:ring-0 focus:border-[#749aff]/50 transition-colors duration-300 rounded-none appearance-none outline-none shadow-none font-['Inter']" placeholder="John Doe" type="text" />
          </div>
          
          <div className="relative group">
            <label className="font-bold text-xs uppercase tracking-widest text-[#ababab] absolute -top-5 left-0 transition-opacity duration-300 opacity-50 group-focus-within:opacity-100 group-focus-within:text-[#749aff]">Email</label>
            <input className="w-full bg-transparent border-0 border-b border-[#484848]/30 py-4 px-0 text-[#e5e5e5] text-xl placeholder:text-[#ababab]/30 focus:ring-0 focus:border-[#749aff]/50 transition-colors duration-300 rounded-none appearance-none outline-none shadow-none font-['Inter']" placeholder="john@example.com" type="email" />
          </div>
          
          <div className="relative group">
            <label className="font-bold text-xs uppercase tracking-widest text-[#ababab] absolute -top-5 left-0 transition-opacity duration-300 opacity-50 group-focus-within:opacity-100 group-focus-within:text-[#749aff]">Subject</label>
            <input className="w-full bg-transparent border-0 border-b border-[#484848]/30 py-4 px-0 text-[#e5e5e5] text-xl placeholder:text-[#ababab]/30 focus:ring-0 focus:border-[#749aff]/50 transition-colors duration-300 rounded-none appearance-none outline-none shadow-none font-['Inter']" placeholder="How can we help you?" type="text" />
          </div>
          
          <div className="relative group mt-4">
            <label className="font-bold text-xs uppercase tracking-widest text-[#ababab] absolute -top-5 left-0 transition-opacity duration-300 opacity-50 group-focus-within:opacity-100 group-focus-within:text-[#749aff]">Message</label>
            <textarea className="w-full bg-transparent border-0 border-b border-[#484848]/30 py-4 px-0 text-[#e5e5e5] text-xl placeholder:text-[#ababab]/30 focus:ring-0 focus:border-[#749aff]/50 transition-colors duration-300 rounded-none appearance-none resize-none outline-none shadow-none font-['Inter']" placeholder="Write your message here..." rows={4}></textarea>
          </div>
          
          <div className="pt-8 flex justify-end">
            <button className="bg-[#c6c6c7] text-[#3f4041] font-bold uppercase tracking-[-0.04em] text-sm px-10 py-5 rounded-md hover:shadow-[0_0_20px_rgba(198,198,199,0.3)] transition-all duration-300 flex items-center gap-3" type="button" onClick={onGetStarted}>
              Send Message
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </motion.form>
      </div>
    </main>
  )

  const renderCurrentPage = () => {
    switch (currentPage) {
      case "features":
        return <FeaturesView />
      case "pricing":
        return <PricingView />
      case "contact":
        return <ContactView />
      default:
        return <HomeView />
    }
  }

  return (
    <div className="min-h-screen bg-[#0e0e0e] text-[#e5e5e5] font-['Inter'] antialiased selection:bg-[#454747] selection:text-[#d0d0d0] relative flex flex-col">
      <style dangerouslySetInnerHTML={{__html: `
        .ambient-orb {
            position: fixed;
            top: 40%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 60vw;
            height: 60vw;
            max-width: 800px;
            max-height: 800px;
            background: radial-gradient(circle, rgba(116, 154, 255, 0.1) 0%, rgba(14, 14, 14, 0) 70%);
            border-radius: 50%;
            pointer-events: none;
            z-index: 0;
            filter: blur(150px);
        }
        .hero-glow {
            transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .hero-glow:hover {
            box-shadow: 0 0 20px rgba(198, 198, 199, 0.3);
            background: radial-gradient(circle at center, #c6c6c7 0%, #b8b9b9 100%);
            color: #0e0e0e;
        }
        .ghost-border {
            border: 1px solid rgba(72, 72, 72, 0.2);
            transition: all 0.3s ease;
        }
        .ghost-border:hover {
            border-color: rgba(72, 72, 72, 0.4);
        }
      `}} />
      <div className="ambient-orb"></div>
      <TopNavBar />
      {renderCurrentPage()}
      <Footer />
    </div>
  )
}
