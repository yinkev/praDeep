'use client'

import { motion } from 'framer-motion'
import { Sparkles, Zap, Code, Database, Brain, ArrowRight } from 'lucide-react'

export default function SamplePage() {
  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  }

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-emerald-950/20 to-gray-950">
      {/* Gradient Mesh Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-emerald-400/10 rounded-full blur-3xl animate-pulse delay-500" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-6 py-16">
        {/* Hero Section */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          className="text-center mb-24"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-6">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-medium text-emerald-300">Emerald Intelligence 2026</span>
          </div>

          <h1 className="text-7xl font-bold mb-6 bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500 bg-clip-text text-transparent">
            praDeep Rebrand
          </h1>

          <p className="text-2xl text-gray-400 max-w-3xl mx-auto mb-8">
            A stunning showcase of our new Emerald Intelligence design system
          </p>

          <div className="flex gap-4 justify-center">
            <button className="px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-semibold transition-all transform hover:scale-105 shadow-lg shadow-emerald-500/50 flex items-center gap-2">
              Get Started
              <ArrowRight className="w-5 h-5" />
            </button>
            <button className="px-8 py-4 bg-white/5 hover:bg-white/10 text-white rounded-lg font-semibold transition-all border border-emerald-500/30">
              Learn More
            </button>
          </div>
        </motion.div>

        {/* Typography Showcase */}
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
          className="mb-24"
        >
          <motion.h2 variants={fadeInUp} className="text-5xl font-bold text-white mb-8">
            Typography System
          </motion.h2>
          <div className="grid gap-4">
            <motion.div
              variants={fadeInUp}
              className="p-6 bg-white/5 backdrop-blur-sm rounded-xl border border-emerald-500/20"
            >
              <h1 className="text-6xl font-bold text-emerald-400">Heading 1 - 6xl Bold</h1>
            </motion.div>
            <motion.div
              variants={fadeInUp}
              className="p-6 bg-white/5 backdrop-blur-sm rounded-xl border border-emerald-500/20"
            >
              <h2 className="text-5xl font-bold text-emerald-400">Heading 2 - 5xl Bold</h2>
            </motion.div>
            <motion.div
              variants={fadeInUp}
              className="p-6 bg-white/5 backdrop-blur-sm rounded-xl border border-emerald-500/20"
            >
              <h3 className="text-4xl font-semibold text-emerald-400">Heading 3 - 4xl Semibold</h3>
            </motion.div>
            <motion.div
              variants={fadeInUp}
              className="p-6 bg-white/5 backdrop-blur-sm rounded-xl border border-emerald-500/20"
            >
              <h4 className="text-3xl font-semibold text-emerald-400">Heading 4 - 3xl Semibold</h4>
            </motion.div>
            <motion.div
              variants={fadeInUp}
              className="p-6 bg-white/5 backdrop-blur-sm rounded-xl border border-emerald-500/20"
            >
              <p className="text-xl text-gray-300">
                Body Text - xl Regular with excellent readability
              </p>
            </motion.div>
          </div>
        </motion.section>

        {/* Color Palette */}
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
          className="mb-24"
        >
          <motion.h2 variants={fadeInUp} className="text-5xl font-bold text-white mb-8">
            Emerald Color Palette
          </motion.h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <motion.div variants={fadeInUp} className="space-y-2">
              <div className="h-32 rounded-xl bg-emerald-500 shadow-lg shadow-emerald-500/50" />
              <p className="text-sm font-mono text-gray-400">#10B981</p>
              <p className="text-sm text-gray-300">Primary Emerald</p>
            </motion.div>
            <motion.div variants={fadeInUp} className="space-y-2">
              <div className="h-32 rounded-xl bg-teal-500 shadow-lg shadow-teal-500/50" />
              <p className="text-sm font-mono text-gray-400">#14B8A6</p>
              <p className="text-sm text-gray-300">Secondary Teal</p>
            </motion.div>
            <motion.div variants={fadeInUp} className="space-y-2">
              <div className="h-32 rounded-xl bg-emerald-400 shadow-lg shadow-emerald-400/50" />
              <p className="text-sm font-mono text-gray-400">#34D399</p>
              <p className="text-sm text-gray-300">Light Emerald</p>
            </motion.div>
            <motion.div variants={fadeInUp} className="space-y-2">
              <div className="h-32 rounded-xl bg-emerald-600 shadow-lg shadow-emerald-600/50" />
              <p className="text-sm font-mono text-gray-400">#059669</p>
              <p className="text-sm text-gray-300">Dark Emerald</p>
            </motion.div>
          </div>
        </motion.section>

        {/* Button Showcase */}
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
          className="mb-24"
        >
          <motion.h2 variants={fadeInUp} className="text-5xl font-bold text-white mb-8">
            Button Styles
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <motion.div
              variants={fadeInUp}
              className="p-8 bg-white/5 backdrop-blur-sm rounded-xl border border-emerald-500/20"
            >
              <h3 className="text-xl font-semibold text-white mb-4">Primary</h3>
              <button className="w-full px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-semibold transition-all transform hover:scale-105 shadow-lg shadow-emerald-500/50">
                Primary Button
              </button>
            </motion.div>
            <motion.div
              variants={fadeInUp}
              className="p-8 bg-white/5 backdrop-blur-sm rounded-xl border border-emerald-500/20"
            >
              <h3 className="text-xl font-semibold text-white mb-4">Secondary</h3>
              <button className="w-full px-6 py-3 bg-transparent hover:bg-emerald-500/10 text-emerald-400 rounded-lg font-semibold transition-all border-2 border-emerald-500">
                Secondary Button
              </button>
            </motion.div>
            <motion.div
              variants={fadeInUp}
              className="p-8 bg-white/5 backdrop-blur-sm rounded-xl border border-emerald-500/20"
            >
              <h3 className="text-xl font-semibold text-white mb-4">Ghost</h3>
              <button className="w-full px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-lg font-semibold transition-all border border-white/20">
                Ghost Button
              </button>
            </motion.div>
          </div>
        </motion.section>

        {/* Glass Cards */}
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
          className="mb-24"
        >
          <motion.h2 variants={fadeInUp} className="text-5xl font-bold text-white mb-8">
            Glass Effect Cards
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <motion.div
              variants={fadeInUp}
              whileHover={{ y: -8, transition: { duration: 0.2 } }}
              className="p-8 bg-white/5 backdrop-blur-xl rounded-2xl border border-emerald-500/20 shadow-xl hover:shadow-emerald-500/20 transition-all"
            >
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Fast Performance</h3>
              <p className="text-gray-400">
                Lightning-fast responses powered by cutting-edge AI technology
              </p>
            </motion.div>
            <motion.div
              variants={fadeInUp}
              whileHover={{ y: -8, transition: { duration: 0.2 } }}
              className="p-8 bg-white/5 backdrop-blur-xl rounded-2xl border border-emerald-500/20 shadow-xl hover:shadow-emerald-500/20 transition-all"
            >
              <div className="w-12 h-12 rounded-full bg-teal-500/20 flex items-center justify-center mb-4">
                <Brain className="w-6 h-6 text-teal-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Smart Intelligence</h3>
              <p className="text-gray-400">Advanced reasoning and problem-solving capabilities</p>
            </motion.div>
            <motion.div
              variants={fadeInUp}
              whileHover={{ y: -8, transition: { duration: 0.2 } }}
              className="p-8 bg-white/5 backdrop-blur-xl rounded-2xl border border-emerald-500/20 shadow-xl hover:shadow-emerald-500/20 transition-all"
            >
              <div className="w-12 h-12 rounded-full bg-emerald-400/20 flex items-center justify-center mb-4">
                <Database className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Data Integration</h3>
              <p className="text-gray-400">Seamlessly connect and analyze your data sources</p>
            </motion.div>
          </div>
        </motion.section>

        {/* Input Showcase */}
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
          className="mb-24"
        >
          <motion.h2 variants={fadeInUp} className="text-5xl font-bold text-white mb-8">
            Input Components
          </motion.h2>
          <div className="max-w-2xl mx-auto space-y-6">
            <motion.div variants={fadeInUp}>
              <label className="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
              <input
                type="email"
                placeholder="you@example.com"
                className="w-full px-4 py-3 bg-white/5 backdrop-blur-sm border-2 border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
              />
            </motion.div>
            <motion.div variants={fadeInUp}>
              <label className="block text-sm font-medium text-gray-300 mb-2">Message</label>
              <textarea
                placeholder="Tell us about your project..."
                rows={4}
                className="w-full px-4 py-3 bg-white/5 backdrop-blur-sm border-2 border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all resize-none"
              />
            </motion.div>
            <motion.div variants={fadeInUp} className="flex items-center gap-3">
              <input
                type="checkbox"
                id="terms"
                className="w-5 h-5 rounded border-2 border-white/10 bg-white/5 text-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:ring-offset-0 transition-all"
              />
              <label htmlFor="terms" className="text-sm text-gray-300">
                I agree to the terms and conditions
              </label>
            </motion.div>
            <motion.button
              variants={fadeInUp}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-lg font-semibold transition-all shadow-lg shadow-emerald-500/50"
            >
              Submit Form
            </motion.button>
          </div>
        </motion.section>

        {/* Footer */}
        <motion.footer
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
          className="text-center py-12 border-t border-white/10"
        >
          <p className="text-gray-400">
            Built with <span className="text-emerald-400">❤</span> using Emerald Intelligence
            Design System
          </p>
          <p className="text-sm text-gray-500 mt-2">praDeep 2026 Rebrand Showcase</p>
        </motion.footer>
      </div>
    </div>
  )
}
