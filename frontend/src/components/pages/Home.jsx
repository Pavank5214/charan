import React from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, FileText, Zap, LayoutDashboard, 
  Users, CreditCard, ShieldCheck, PieChart, Layers 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import dashboard from '../../assets/dashboard.png';

const Home = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-200 font-sans text-gray-900 selection:bg-blue-100 selection:text-blue-900">
      
      {/* --- Hero Section --- */}
      <section className="relative pt-24 pb-32 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 -z-10 h-full w-full bg-white bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)]"></div>
        
        <div className="container mx-auto px-4 text-center">
          
          {/* Badge */}
          {/* <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-bold uppercase tracking-wide mb-8 hover:bg-blue-100 transition-colors cursor-default">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            New: Inventory Tracking Added
          </div> */}

          {/* Headline */}
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-slate-900 mb-6 leading-[1.1]">
            Simplify your <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-violet-600">
              Business Finances
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed">
            Create professional invoices, track payments, and manage inventory in one unified platform. Built for speed and accuracy.
          </p>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {user ? (
              <Link 
                to="/dashboard" 
                className="group w-full sm:w-auto px-8 py-3.5 bg-slate-900 text-white rounded-lg font-semibold text-base hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 flex items-center justify-center gap-2"
              >
                Go to Dashboard 
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            ) : (
              <Link 
                to="/login" 
                className="group w-full sm:w-auto px-8 py-3.5 bg-blue-600 text-white rounded-lg font-semibold text-base hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 flex items-center justify-center gap-2"
              >
                Start for Free 
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            )}
            <a 
              href="#features" 
              className="w-full sm:w-auto px-8 py-3.5 bg-white text-slate-700 border border-slate-200 rounded-lg font-semibold text-base hover:bg-slate-50 transition-colors flex items-center justify-center"
            >
              How it works
            </a>
          </div>

          {/* Dashboard Preview Mockup */}
          <div className="mt-20 relative max-w-6xl mx-auto px-2 md:px-0">
            {/* Glow effect behind image */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-violet-500 rounded-2xl blur opacity-20"></div>
            
            <div className="relative bg-slate-900 rounded-xl shadow-2xl overflow-hidden border border-slate-800 ring-1 ring-white/10">
               {/* Browser Header */}
               <div className="h-10 bg-slate-800/50 border-b border-white/5 flex items-center px-4 gap-2 backdrop-blur-md">
                 <div className="flex gap-1.5">
                   <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                   <div className="w-3 h-3 rounded-full bg-amber-500/80"></div>
                   <div className="w-3 h-3 rounded-full bg-emerald-500/80"></div>
                 </div>
                 <div className="ml-4 px-3 py-1 bg-black/20 rounded-md text-[10px] text-slate-400 font-mono hidden sm:block">
                   billflow.app/dashboard
                 </div>
               </div>
               
               {/* Image Container */}
               <div className="relative aspect-[16/9] bg-slate-900">
                  <img 
                    src={dashboard}
                    alt="App Dashboard Interface"
                    className="w-full h-full object-contain"
                  />
                  {/* Subtle overlay to blend image if it has white bg */}
                  <div className="absolute inset-0 bg-slate-900/10 mix-blend-multiply pointer-events-none"></div>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- Workflow Section (Replacing Fake Stats) --- */}
      <section className="py-24 bg-slate-200">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-sm font-bold text-blue-600 uppercase tracking-wider mb-2">Workflow</h2>
            <h3 className="text-3xl font-bold text-slate-900">From Quote to Cash in 3 Steps</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
             {/* Connecting Line (Desktop) */}
             <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-gradient-to-r from-blue-100 via-blue-200 to-blue-100 -z-10"></div>

             {/* Step 1 */}
             <div className="flex flex-col items-center text-center">
               <div className="w-24 h-24 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 border border-blue-100 shadow-sm relative z-10">
                 <FileText className="w-10 h-10 text-blue-600" />
                 <div className="absolute -top-3 -right-3 w-8 h-8 bg-slate-900 text-white rounded-full flex items-center justify-center font-bold text-sm border-4 border-white">1</div>
               </div>
               <h4 className="text-xl font-bold text-slate-900 mb-2">Create Invoice</h4>
               <p className="text-slate-500 leading-relaxed">Select a client, add items from your inventory, and generate a PDF instantly.</p>
             </div>

             {/* Step 2 */}
             <div className="flex flex-col items-center text-center">
               <div className="w-24 h-24 bg-violet-50 rounded-2xl flex items-center justify-center mb-6 border border-violet-100 shadow-sm relative z-10">
                 <Layers className="w-10 h-10 text-violet-600" />
                 <div className="absolute -top-3 -right-3 w-8 h-8 bg-slate-900 text-white rounded-full flex items-center justify-center font-bold text-sm border-4 border-white">2</div>
               </div>
               <h4 className="text-xl font-bold text-slate-900 mb-2">Track Inventory</h4>
               <p className="text-slate-500 leading-relaxed">Stock levels update automatically. Set low-stock alerts to never run out.</p>
             </div>

             {/* Step 3 */}
             <div className="flex flex-col items-center text-center">
               <div className="w-24 h-24 bg-emerald-50 rounded-2xl flex items-center justify-center mb-6 border border-emerald-100 shadow-sm relative z-10">
                 <CreditCard className="w-10 h-10 text-emerald-600" />
                 <div className="absolute -top-3 -right-3 w-8 h-8 bg-slate-900 text-white rounded-full flex items-center justify-center font-bold text-sm border-4 border-white">3</div>
               </div>
               <h4 className="text-xl font-bold text-slate-900 mb-2">Get Paid</h4>
               <p className="text-slate-500 leading-relaxed">Record payments partially or fully. Track overdue invoices with ease.</p>
             </div>
          </div>
        </div>
      </section>

      {/* --- Features Grid --- */}
      <section id="features" className="py-24 bg-slate-200">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Everything you need</h2>
            <p className="text-slate-600 max-w-2xl mx-auto">Stop juggling multiple spreadsheets. Get a unified view of your operations.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard 
              icon={<Zap className="w-5 h-5 text-amber-600" />}
              title="Instant Invoicing"
              desc="Create GST-compliant invoices in under 30 seconds with pre-saved client details."
              color="bg-amber-50"
            />
            <FeatureCard 
              icon={<LayoutDashboard className="w-5 h-5 text-blue-600" />}
              title="Inventory Management"
              desc="Real-time tracking of product stock. Auto-deduct quantities as you sell."
              color="bg-blue-50"
            />
            <FeatureCard 
              icon={<PieChart className="w-5 h-5 text-violet-600" />}
              title="Financial Insights"
              desc="Visualize revenue, outstanding dues, and monthly growth with clear charts."
              color="bg-violet-50"
            />
            <FeatureCard 
              icon={<Users className="w-5 h-5 text-pink-600" />}
              title="Client Database"
              desc="Maintain a detailed directory of clients with their GSTIN and history."
              color="bg-pink-50"
            />
            <FeatureCard 
              icon={<CreditCard className="w-5 h-5 text-emerald-600" />}
              title="Payment Tracking"
              desc="Record partial payments and keep track of pending balances effortlessly."
              color="bg-emerald-50"
            />
            <FeatureCard 
              icon={<ShieldCheck className="w-5 h-5 text-slate-600" />}
              title="Secure Data"
              desc="Your financial data is encrypted and securely stored. Access it from anywhere."
              color="bg-slate-100"
            />
          </div>
        </div>
      </section>

      {/* --- CTA Section --- */}
      <section className="py-20 bg-slate-900 relative overflow-hidden">
        {/* Abstract shapes */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-violet-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        
        <div className="container mx-auto px-4 text-center relative z-10">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Ready to organize your business?</h2>
            <p className="text-slate-300 text-lg mb-10 max-w-xl mx-auto">Join smart businesses using BillFlow to streamline their accounting and operations today.</p>
            {user ? (
              <Link 
                to="/dashboard" 
                className="inline-flex items-center px-8 py-4 bg-white text-slate-900 rounded-lg font-bold text-lg hover:bg-slate-50 transition shadow-xl"
              >
                Go to Dashboard <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            ) : (
              <Link 
                to="/login" 
                className="inline-flex items-center px-8 py-4 bg-blue-600 text-white rounded-lg font-bold text-lg hover:bg-blue-500 transition shadow-xl shadow-blue-900/50"
              >
                Get Started Now <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            )}
        </div>
      </section>

      {/* --- Footer --- */}
      <footer className="bg-white py-12 border-t border-slate-100 ">
        <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center text-slate-500 text-sm">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">B</div>
                <span className="font-semibold text-slate-900 text-base">BillFlow Pro</span>
            </div>
            <p className="mb-4 md:mb-0">© {new Date().getFullYear()} BillFlow Pro. All rights reserved.</p>
            <div className="flex gap-6">
                <button className="hover:text-blue-600 transition-colors">Privacy</button>
                <button className="hover:text-blue-600 transition-colors">Terms</button>
                <button className="hover:text-blue-600 transition-colors">Support</button>
            </div>
        </div>
      </footer>
    </div>
  );
};

// Helper Component for Feature Cards
const FeatureCard = ({ icon, title, desc, color }) => (
  <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-all group hover:-translate-y-1">
    <div className={`w-12 h-12 ${color} rounded-lg flex items-center justify-center mb-4 transition-colors`}>
      {icon}
    </div>
    <h3 className="text-lg font-bold text-slate-900 mb-2">{title}</h3>
    <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
  </div>
);

export default Home;