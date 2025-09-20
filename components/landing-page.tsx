"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  MessageSquare,
  Mic,
  Globe,
  Upload,
  Sparkles,
  Zap,
  Shield,
  Moon,
  Sun,
  Menu,
  X,
  Users,
  Award,
  TrendingUp,
  Star,
} from "lucide-react"
import { useTheme } from "next-themes"

interface LandingPageProps {
  onGetStarted: () => void
  onStartGuestChat: (message: string) => void
  onGuestDashboard: () => void
}

export function LandingPage({ onGetStarted, onStartGuestChat, onGuestDashboard }: LandingPageProps) {
  const [promptCount, setPromptCount] = useState(0)
  const [currentPrompt, setCurrentPrompt] = useState("")
  const [showLimitModal, setShowLimitModal] = useState(false)
  const [currentPage, setCurrentPage] = useState("home")
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

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

  const handlePromptSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentPrompt.trim()) return

    if (promptCount >= 2) {
      setShowLimitModal(true)
      return
    }

    setPromptCount((prev) => prev + 1)
    onStartGuestChat(currentPrompt.trim())
  }

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  const features = [
    {
      icon: MessageSquare,
      title: "Intelligent Conversations",
      description: "Engage in natural, context-aware conversations powered by advanced AI technology.",
    },
    {
      icon: Mic,
      title: "Voice Input",
      description: "Speak naturally and watch your words transform into text with our speech recognition.",
    },
    {
      icon: Globe,
      title: "Real-time Translation",
      description: "Break language barriers with instant translation capabilities in multiple languages.",
    },
    {
      icon: Upload,
      title: "File Upload",
      description: "Share documents, images, and files to enhance your conversations with rich context.",
    },
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "Get instant responses with our optimized AI engine designed for speed and accuracy.",
    },
    {
      icon: Shield,
      title: "Secure & Private",
      description: "Your conversations are protected with enterprise-grade security and privacy measures.",
    },
  ]

  const expandedFeatures = [
    ...features,
    {
      icon: Users,
      title: "Trusted by 100,000+ Users",
      description:
        "Join a growing community of professionals, students, and creators who rely on our AI for daily tasks.",
    },
    {
      icon: Award,
      title: "99.9% Uptime Reliability",
      description: "Enterprise-grade infrastructure ensures our AI is always available when you need it most.",
    },
    {
      icon: TrendingUp,
      title: "Continuous Learning",
      description: "Our AI models are constantly updated with the latest knowledge and capabilities.",
    },
    {
      icon: Star,
      title: "4.9/5 User Rating",
      description: "Consistently rated as the most helpful and accurate AI assistant by our user community.",
    },
  ]

  const pricingPlans = [
    {
      name: "Free Plan",
      price: "$0",
      period: "/month",
      features: ["5 Free Prompts per day", "Basic AI responses", "Standard support"],
      popular: false,
    },
    {
      name: "Pro Plan",
      price: "$19",
      period: "/month",
      features: [
        "Unlimited prompts",
        "Advanced AI features",
        "Voice input & translation",
        "File uploads",
        "Priority support",
      ],
      popular: true,
    },
    {
      name: "Pro Plus Plan",
      price: "$49",
      period: "/month",
      features: [
        "Everything in Pro",
        "Custom AI training",
        "API access",
        "Team collaboration",
        "24/7 dedicated support",
      ],
      popular: false,
    },
  ]

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Marketing Manager",
      content: "This AI has transformed how I create content. The voice input feature saves me hours every week.",
      rating: 5,
    },
    {
      name: "David Chen",
      role: "Software Developer",
      content:
        "The translation capabilities are incredible. I can now communicate with international clients seamlessly.",
      rating: 5,
    },
    {
      name: "Maria Rodriguez",
      role: "Student",
      content: "Perfect for research and writing. The AI understands context better than any other tool I've used.",
      rating: 5,
    },
  ]

  const Navigation = () => (
    <nav className="bg-background/95 backdrop-blur-sm border-b border-border sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-foreground font-[var(--font-heading)]">AI Chatbot</h1>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <button
              onClick={() => handlePageChange("home")}
              className={`text-sm font-medium transition-colors ${currentPage === "home" ? "text-accent" : "text-muted-foreground hover:text-foreground"}`}
            >
              Dashboard
            </button>
            <button
              onClick={() => handlePageChange("features")}
              className={`text-sm font-medium transition-colors ${currentPage === "features" ? "text-accent" : "text-muted-foreground hover:text-foreground"}`}
            >
              Features
            </button>
            <button
              onClick={() => handlePageChange("pricing")}
              className={`text-sm font-medium transition-colors ${currentPage === "pricing" ? "text-accent" : "text-muted-foreground hover:text-foreground"}`}
            >
              Pricing
            </button>
            <button
              onClick={() => handlePageChange("contact")}
              className={`text-sm font-medium transition-colors ${currentPage === "contact" ? "text-accent" : "text-muted-foreground hover:text-foreground"}`}
            >
              Contact
            </button>
            <Button onClick={onGetStarted} size="sm">
              Login / Signup
            </Button>
            {mounted && (
              <button onClick={toggleTheme} className="p-2 rounded-md hover:bg-muted transition-colors">
                {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-2">
            {mounted && (
              <button onClick={toggleTheme} className="p-2 rounded-md hover:bg-muted transition-colors">
                {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
            )}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-md hover:bg-muted transition-colors"
            >
              {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-border py-4">
            <div className="flex flex-col space-y-4">
              <button
                onClick={() => handlePageChange("home")}
                className={`text-left text-sm font-medium transition-colors ${currentPage === "home" ? "text-accent" : "text-muted-foreground hover:text-foreground"}`}
              >
                Dashboard
              </button>
              <button
                onClick={() => handlePageChange("features")}
                className={`text-left text-sm font-medium transition-colors ${currentPage === "features" ? "text-accent" : "text-muted-foreground hover:text-foreground"}`}
              >
                Features
              </button>
              <button
                onClick={() => handlePageChange("pricing")}
                className={`text-left text-sm font-medium transition-colors ${currentPage === "pricing" ? "text-accent" : "text-muted-foreground hover:text-foreground"}`}
              >
                Pricing
              </button>
              <button
                onClick={() => handlePageChange("contact")}
                className={`text-left text-sm font-medium transition-colors ${currentPage === "contact" ? "text-accent" : "text-muted-foreground hover:text-foreground"}`}
              >
                Contact
              </button>
              <Button onClick={onGetStarted} size="sm" className="w-fit">
                Login / Signup
              </Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  )

  const HomePage = () => (
    <div className="min-h-screen bg-background">
      <section className="relative overflow-hidden bg-gradient-to-br from-background via-muted/30 to-background">
        <div className="container mx-auto px-4 py-20 lg:py-32">
          <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mb-8"
            >
              <div className="inline-flex items-center gap-2 bg-accent/10 text-accent px-4 py-2 rounded-full text-sm font-medium mb-6">
                <Sparkles className="w-4 h-4" />
                Powered by Advanced AI
              </div>
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 font-[var(--font-heading)]">
                Your Intelligent
                <span className="text-accent block">Conversation Partner</span>
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl font-[var(--font-body)]">
                Experience the future of AI conversation with voice input, real-time translation, and intelligent
                responses.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <Button
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-6 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                onClick={onGetStarted}
              >
                Unlock Full Access
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="px-8 py-6 text-lg font-semibold bg-white/10 backdrop-blur-sm border-2 border-gray-300 hover:border-blue-500 hover:bg-blue-50 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                onClick={onGuestDashboard}
              >
                Try Dashboard
              </Button>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6 font-[var(--font-heading)]">
              Powerful Features for
              <span className="text-accent block">Every Conversation</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto font-[var(--font-body)]">
              Discover the advanced capabilities that make our AI chatbot the perfect companion for all your
              communication needs.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow duration-300 border-border">
                  <CardContent className="p-8 text-center md:text-left">
                    <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-6 mx-auto md:mx-0">
                      <feature.icon className="w-6 h-6 text-accent" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground mb-4 font-[var(--font-heading)]">
                      {feature.title}
                    </h3>
                    <p className="text-muted-foreground font-[var(--font-body)]">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )

  const FeaturesPage = () => (
    <div className="min-h-screen bg-background py-20">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6 font-[var(--font-heading)]">
            Powerful Features
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto font-[var(--font-body)]">
            Explore all the advanced capabilities that make our AI chatbot exceptional.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
          {expandedFeatures.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <Card className="h-full border-border hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-8">
                  <div className="w-16 h-16 bg-accent/10 rounded-xl flex items-center justify-center mb-6">
                    <feature.icon className="w-8 h-8 text-accent" />
                  </div>
                  <h3 className="text-2xl font-semibold text-foreground mb-4 font-[var(--font-heading)]">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground text-lg font-[var(--font-body)]">{feature.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <section className="py-20 bg-muted/30 rounded-3xl">
          <div className="container mx-auto px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6 font-[var(--font-heading)]">
                What Our Users Say
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto font-[var(--font-body)]">
                Join thousands of satisfied users who trust our AI for their daily tasks.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {testimonials.map((testimonial, index) => (
                <motion.div
                  key={testimonial.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <Card className="h-full border-border">
                    <CardContent className="p-8">
                      <div className="flex mb-4">
                        {[...Array(testimonial.rating)].map((_, i) => (
                          <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                        ))}
                      </div>
                      <p className="text-muted-foreground mb-6 font-[var(--font-body)]">"{testimonial.content}"</p>
                      <div>
                        <h4 className="font-semibold text-foreground font-[var(--font-heading)]">{testimonial.name}</h4>
                        <p className="text-sm text-muted-foreground font-[var(--font-body)]">{testimonial.role}</p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6 font-[var(--font-heading)]">
                Trusted Performance
              </h2>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {[
                { number: "100,000+", label: "Active Users" },
                { number: "99.9%", label: "Uptime" },
                { number: "4.9/5", label: "User Rating" },
                { number: "50+", label: "Languages" },
              ].map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="text-center"
                >
                  <div className="text-4xl md:text-5xl font-bold text-accent mb-2 font-[var(--font-heading)]">
                    {stat.number}
                  </div>
                  <div className="text-muted-foreground font-[var(--font-body)]">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  )

  const PricingPage = () => (
    <div className="min-h-screen bg-background py-20">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 font-[var(--font-heading)]">
            Choose Your Plan
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto font-[var(--font-body)]">
            Select the perfect plan for your AI conversation needs.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {pricingPlans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <Card className={`h-full relative ${plan.popular ? "border-accent border-2" : "border-border"}`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-accent text-accent-foreground px-4 py-1 rounded-full text-sm font-medium">
                      Most Popular
                    </span>
                  </div>
                )}
                <CardContent className="p-8">
                  <h3 className="text-2xl font-bold text-foreground mb-2 font-[var(--font-heading)]">{plan.name}</h3>
                  <div className="mb-6">
                    <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                    <span className="text-muted-foreground">{plan.period}</span>
                  </div>
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center text-muted-foreground">
                        <div className="w-2 h-2 bg-accent rounded-full mr-3"></div>
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button
                    className={`w-full ${plan.popular ? "bg-accent hover:bg-accent/90" : ""}`}
                    variant={plan.popular ? "default" : "outline"}
                    onClick={onGetStarted}
                  >
                    Get Started
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )

  const ContactPage = () => {
    const [formData, setFormData] = useState({ name: "", email: "", message: "" })

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault()
      console.log("Contact form submitted:", formData)
      setFormData({ name: "", email: "", message: "" })
    }

    const faqs = [
      {
        question: "How does the free plan work?",
        answer: "The free plan allows you to try 5 prompts per session to experience our AI capabilities.",
      },
      {
        question: "Can I upgrade or downgrade my plan?",
        answer: "Yes, you can change your plan at any time from your account settings.",
      },
      {
        question: "Is my data secure?",
        answer: "Absolutely. We use enterprise-grade security measures to protect your conversations and data.",
      },
      {
        question: "Do you offer refunds?",
        answer: "Yes, we offer a 30-day money-back guarantee for all paid plans.",
      },
    ]

    return (
      <div className="min-h-screen bg-background py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 font-[var(--font-heading)]">
              Contact Us
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl font-[var(--font-body)]">
              Have questions? We'd love to hear from you.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Card className="border-border">
                <CardContent className="p-8">
                  <h2 className="text-2xl font-bold text-foreground mb-6 font-[var(--font-heading)]">
                    Send us a message
                  </h2>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Name</label>
                      <Input
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Your name"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Email</label>
                      <Input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="your@email.com"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Message</label>
                      <textarea
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        placeholder="Tell us how we can help..."
                        rows={5}
                        className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-accent"
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full">
                      Send Message
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <h2 className="text-2xl font-bold text-foreground mb-6 font-[var(--font-heading)]">
                Frequently Asked Questions
              </h2>
              <div className="space-y-4">
                {faqs.map((faq, index) => (
                  <Card key={index} className="border-border">
                    <CardContent className="p-6">
                      <h3 className="font-semibold text-foreground mb-2 font-[var(--font-heading)]">{faq.question}</h3>
                      <p className="text-muted-foreground font-[var(--font-body)]">{faq.answer}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    )
  }

  const renderCurrentPage = () => {
    switch (currentPage) {
      case "features":
        return <FeaturesPage />
      case "pricing":
        return <PricingPage />
      case "contact":
        return <ContactPage />
      default:
        return <HomePage />
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      {renderCurrentPage()}

      <footer className="bg-sidebar border-t border-sidebar-border py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <h3 className="text-xl font-bold text-sidebar-foreground font-[var(--font-heading)]">AI Chatbot</h3>
              <p className="text-muted-foreground font-[var(--font-body)]">Your intelligent conversation partner</p>
            </div>
            <div className="flex gap-6 text-muted-foreground">
              <a href="#" className="hover:text-sidebar-foreground transition-colors">
                Privacy
              </a>
              <a href="#" className="hover:text-sidebar-foreground transition-colors">
                Terms
              </a>
              <a href="#" className="hover:text-sidebar-foreground transition-colors">
                Support
              </a>
            </div>
          </div>
        </div>
      </footer>

      <Dialog open={showLimitModal} onOpenChange={setShowLimitModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Free Limit Reached</DialogTitle>
            <DialogDescription>To continue chatting, please login.</DialogDescription>
          </DialogHeader>
          <div className="flex gap-4 mt-6">
            <Button onClick={onGetStarted} className="flex-1">
              Login
            </Button>
            <Button variant="outline" onClick={() => setShowLimitModal(false)} className="flex-1">
              Maybe Later
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
