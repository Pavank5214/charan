import React from 'react'
import { ArrowRight, CheckCircle, FileText, CreditCard, TrendingUp } from 'lucide-react'

const Hero = () => {
  return (
    <div className="bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          {/* Badge */}
          <div className="inline-flex items-center bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <CheckCircle className="w-4 h-4 mr-2" />
            Trusted by 10,000+ Indian businesses
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Simple Billing for
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
              {' '}Indian Businesses
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto mb-10">
            Create GST-compliant invoices, track payments, manage subscriptions, and get paid faster — all in one platform.
            <span className="block mt-2 font-medium text-indigo-600">
              Built for India, loved by MSMEs.
            </span>
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <button className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200">
              Start Free Trial
              <ArrowRight className="ml-2 w-5 h-5" />
            </button>
            <button className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-gray-700 bg-white border-2 border-gray-300 rounded-xl hover:border-gray-400 hover:bg-gray-50 transition-all">
              Watch Demo
            </button>
          </div>

          {/* Trust Indicators */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-8 text-gray-600">
            <div className="flex items-center">
              <FileText className="w-6 h-6 text-green-600 mr-2" />
              <span className="text-sm">GST Ready</span>
            </div>
            <div className="flex items-center">
              <CreditCard className="w-6 h-6 text-blue-600 mr-2" />
              <span className="text-sm">UPI & Bank Payments</span>
            </div>
            <div className="flex items-center">
              <TrendingUp className="w-6 h-6 text-indigo-600 mr-2" />
              <span className="text-sm">₹50Cr+ Invoiced</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Hero