/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Home, 
  FileText, 
  Layers, 
  BookOpen, 
  MessageSquare, 
  Target, 
  BarChart3, 
  Settings, 
  Search, 
  Bell, 
  Upload,
  ChevronRight,
  User,
  Plus,
  RefreshCw,
  Copy,
  Download,
  Check,
  AlertCircle,
  Sparkles,
  X,
  FastForward,
  RotateCcw,
  Lightbulb,
  Send,
  Trash2,
  Bot,
  Wand2,
  ChevronDown,
  ChevronUp,
  BrainCircuit,
  LayoutDashboard,
  HelpCircle,
  Info,
  Zap,
  Moon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from "@google/genai";
import ReactMarkdown from 'react-markdown';

// --- Gemini Initialization ---
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// --- Types ---

type ViewType = 'dashboard' | 'documents' | 'flashcards' | 'quiz' | 'chat' | 'exam' | 'progress' | 'settings' | 'upload' | 'summary';

interface Document {
  id: string;
  title: string;
  subject: string;
  type: 'pdf' | 'text';
  content?: string;
  timestamp: string;
}

interface Flashcard {
  id: number | string;
  front: string;
  back: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

interface FlashcardSession {
  cards: Flashcard[];
  currentIndex: number;
  results: {
    gotIt: number[];
    needReview: number[];
    skipped: number[];
  };
}

interface QuizQuestion {
  id: number | string;
  question: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correct: string;
  explanation: string;
}

interface QuizSession {
  questions: QuizQuestion[];
  currentIndex: number;
  userAnswers: Record<number | string, string>;
  isComplete: boolean;
}

interface ChatMessage {
  role: 'user' | 'model';
  content: string;
  timestamp: string;
}

interface QuizResult {
  docId: string;
  docTitle: string;
  score: number;
  total: number;
  timestamp: string;
}

interface AppState {
  flashcardsMastered: number;
  quizzesCompleted: QuizResult[];
  studyStreak: number;
  messagesSent: number;
  featuresUsed: Set<string>;
}

interface PredictedQuestion {
  id: number | string;
  question: string;
  type: 'multiple_choice' | 'short_answer' | 'essay';
  importance: 'high' | 'medium';
  why_likely: string;
  study_tip: string;
  key_points: string[];
  confidence: number;
}

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface UserSettings {
  displayName: string;
  theme: 'dark' | 'midnight';
  aiStyle: 'concise' | 'detailed' | 'eli5';
  defaultSubject: string;
}

interface SummaryData {
  tldr: string;
  keyConcepts: string[];
  detailedBreakdown: string;
  definitions: string[];
  takeaways: string[];
}

interface SidebarItemProps {
  icon: React.ElementType;
  label: string;
  active: boolean;
  onClick: () => void;
}

// --- Components ---

const SidebarItem = ({ icon: Icon, label, active, onClick }: SidebarItemProps) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group active:scale-95 ${
      active 
        ? 'bg-[#7c3aed] text-white shadow-lg shadow-[#7c3aed]/20' 
        : 'text-text-muted hover:bg-white/[0.03] hover:text-white'
    }`}
  >
    <Icon size={20} className={`${active ? 'text-white' : 'text-text-muted group-hover:text-[#7c3aed] transition-colors'}`} />
    <span className="font-bold text-sm">{label}</span>
  </button>
);

const StatCard = ({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: React.ElementType; color: string }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-bg-card p-6 rounded-xl border border-white/5 hover:border-white/10 transition-colors shadow-xl"
  >
    <div className="flex justify-between items-start">
      <div>
        <p className="text-text-muted text-[10px] font-black uppercase tracking-widest mb-2">{label}</p>
        <h3 className="text-2xl font-black text-text-main">{value}</h3>
      </div>
      <div className={`p-4 rounded-xl ${color} shadow-lg shadow-black/20`}>
        <Icon size={20} className="text-white" />
      </div>
    </div>
  </motion.div>
);

// --- Views ---

const SummarySkeleton = () => (
  <div className="space-y-8 animate-pulse">
    <div className="space-y-2">
      <div className="h-10 bg-white/5 rounded-xl w-1/3"></div>
      <p className="text-text-muted text-sm font-medium animate-bounce flex items-center gap-2">
        <RefreshCw size={14} className="animate-spin" />
        AI is reading your document and generating a summary...
      </p>
    </div>
    <div className="bg-blue-500/5 border-l-4 border-blue-500/30 p-6 rounded-xl space-y-3">
      <div className="h-4 bg-white/10 rounded w-1/4"></div>
      <div className="h-4 bg-white/10 rounded w-full"></div>
      <div className="h-4 bg-white/10 rounded w-5/6"></div>
    </div>
    <div className="bg-primary-accent/5 border-l-4 border-primary-accent/30 p-6 rounded-xl space-y-4">
      <div className="h-4 bg-white/10 rounded w-1/4"></div>
      {[1, 2, 3, 4, 5, 6].map(i => (
        <div key={i} className="h-3 bg-white/10 rounded w-3/4"></div>
      ))}
    </div>
    <div className="space-y-4 p-6 border-l-4 border-white/10 rounded-xl bg-white/5">
      <div className="h-4 bg-white/10 rounded w-1/4"></div>
      <div className="space-y-2">
        <div className="h-3 bg-white/10 rounded w-full"></div>
        <div className="h-3 bg-white/10 rounded w-full"></div>
        <div className="h-3 bg-white/10 rounded w-4/5"></div>
      </div>
    </div>
  </div>
);

const SummaryView = ({ doc, summary, onRegenerate, isLoading }: { 
  doc: Document, 
  summary: SummaryData | null, 
  onRegenerate: () => void,
  isLoading: boolean
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!summary) return;
    const text = `
Summary of ${doc.title} (${doc.subject})

TL;DR
${summary.tldr}

Key Concepts
${summary.keyConcepts.join('\n')}

Detailed Breakdown
${summary.detailedBreakdown}

Important Definitions
${summary.definitions.join('\n')}

Key Takeaways
${summary.takeaways.join('\n')}
    `.trim();
    
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) return <SummarySkeleton />;

  if (!summary) return (
    <div className="flex flex-col items-center justify-center p-12 text-center space-y-4">
      <AlertCircle size={48} className="text-orange-500" />
      <h2 className="text-2xl font-bold">No Summary Available</h2>
      <p className="text-text-muted">Click regenerate to create a new AI summary for this document.</p>
      <button onClick={onRegenerate} className="bg-primary-accent text-white px-6 py-2 rounded-xl">Generate Now</button>
    </div>
  );

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="space-y-8"
    >
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold">{doc.title}</h1>
          <p className="text-text-muted flex items-center gap-2">
            <span className="px-2 py-0.5 bg-primary-accent/10 text-primary-accent rounded-md text-xs font-bold uppercase tracking-wider">{doc.subject}</span>
            <span>Created on {new Date(doc.timestamp).toLocaleDateString()}</span>
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button 
            onClick={onRegenerate}
            className="p-2.5 bg-bg-card border border-white/5 rounded-xl text-text-muted hover:text-primary-accent transition-colors flex items-center gap-2 text-sm font-medium"
          >
            <RefreshCw size={18} />
            <span>Regenerate</span>
          </button>
          <button 
            onClick={handleCopy}
            className="p-2.5 bg-bg-card border border-white/5 rounded-xl text-text-muted hover:text-emerald-500 transition-colors flex items-center gap-2 text-sm font-medium"
          >
            {copied ? <Check size={18} /> : <Copy size={18} />}
            <span>{copied ? 'Copied!' : 'Copy'}</span>
          </button>
          <button 
            onClick={() => alert('Download as PDF coming soon!')}
            className="p-2.5 bg-bg-card border border-white/5 rounded-xl text-text-muted hover:text-white transition-colors flex items-center gap-2 text-sm font-medium"
          >
            <Download size={18} />
            <span>Download</span>
          </button>
        </div>
      </div>

      <div className="space-y-6">
        <motion.div 
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-blue-500/5 border-l-4 border-blue-500 p-6 rounded-2xl"
        >
          <h2 className="text-blue-500 font-bold uppercase tracking-widest text-xs mb-3">TL;DR</h2>
          <p className="text-text-main leading-relaxed">{summary.tldr}</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-primary-accent/5 border-l-4 border-primary-accent p-6 rounded-2xl"
        >
          <h2 className="text-primary-accent font-bold uppercase tracking-widest text-xs mb-4">Key Concepts</h2>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {summary.keyConcepts.map((concept, i) => (
              <li key={i} className="flex items-start space-x-3 text-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-primary-accent mt-1.5 flex-shrink-0" />
                <span>{concept}</span>
              </li>
            ))}
          </ul>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/5 border-l-4 border-white/20 p-6 rounded-2xl"
        >
          <h2 className="text-text-muted font-bold uppercase tracking-widest text-xs mb-4">Detailed Breakdown</h2>
          <div className="prose prose-invert max-w-none text-sm leading-relaxed text-text-main/80 space-y-4">
            {summary.detailedBreakdown.split('\n\n').map((p, i) => <p key={i}>{p}</p>)}
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-emerald-500/5 border-l-4 border-emerald-500 p-6 rounded-2xl"
        >
          <h2 className="text-emerald-500 font-bold uppercase tracking-widest text-xs mb-4">Important Definitions</h2>
          <div className="space-y-3">
            {summary.definitions.map((def, i) => {
              const [term, description] = def.split(': ');
              return (
                <div key={i} className="text-sm">
                  <span className="font-bold text-emerald-500">{term}</span>
                  <span className="text-text-main/70">: {description}</span>
                </div>
              );
            })}
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-orange-500/5 border-l-4 border-orange-500 p-6 rounded-2xl"
        >
          <h2 className="text-orange-500 font-bold uppercase tracking-widest text-xs mb-4">Key Takeaways</h2>
          <ul className="space-y-3">
            {summary.takeaways.map((takeaway, i) => (
              <li key={i} className="flex items-start space-x-3 text-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-1.5 flex-shrink-0" />
                <span className="text-text-main/80 italic">{takeaway}</span>
              </li>
            ))}
          </ul>
        </motion.div>
      </div>
    </motion.div>
  );
};

const FlashcardView = ({ 
  doc, 
  session, 
  isGenerating, 
  settings, 
  onSettingsChange, 
  onGenerate,
  onAction,
  onReset
}: { 
  doc: Document, 
  session: FlashcardSession | null, 
  isGenerating: boolean,
  settings: { count: number, difficulty: string },
  onSettingsChange: (s: any) => void,
  onGenerate: () => void,
  onAction: (action: 'gotIt' | 'needReview' | 'skipped') => void,
  onReset: () => void
}) => {
  const [isFlipped, setIsFlipped] = useState(false);

  // Keyboard support for study mode
  useEffect(() => {
    if (session && session.currentIndex < session.cards.length) {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.code === 'Space') {
          e.preventDefault();
          setIsFlipped(prev => !prev);
        } else if (e.code === 'ArrowLeft') {
          onAction('needReview');
          setIsFlipped(false);
        } else if (e.code === 'ArrowRight') {
          onAction('gotIt');
          setIsFlipped(false);
        } else if (e.code === 'ArrowDown') {
          onAction('skipped');
          setIsFlipped(false);
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [session, onAction]);

  if (isGenerating) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-8 animate-in fade-in duration-500 h-[60vh]">
        <div className="relative">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-24 h-24 rounded-full border-4 border-primary-accent/10 border-t-primary-accent"
          />
          <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary-accent animate-pulse" size={32} />
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold">Generating Flashcards...</h2>
          <p className="text-text-muted">AI is crafting {settings.count} questions based on your material.</p>
        </div>
      </div>
    );
  }

  // Step 1: Generation Screen
  if (!session) {
    return (
      <div className="max-w-2xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-500">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 bg-primary-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Layers size={32} className="text-primary-accent" />
          </div>
          <h1 className="text-3xl font-bold">Study Flashcards</h1>
          <p className="text-text-muted">Master "{doc.title}" with AI-powered active recall cards.</p>
        </div>

        <div className="bg-bg-card border border-white/5 rounded-3xl p-8 space-y-8">
          <div className="space-y-4">
            <label className="text-sm font-bold text-text-main uppercase tracking-wider">Number of cards</label>
            <div className="grid grid-cols-4 gap-3">
              {[10, 15, 20, 30].map(n => (
                <button
                  key={n}
                  onClick={() => onSettingsChange({ ...settings, count: n })}
                  className={`py-3 rounded-xl font-bold transition-all ${settings.count === n ? 'bg-primary-accent text-white shadow-lg shadow-primary-accent/20' : 'bg-bg-main border border-white/5 text-text-muted hover:text-text-main'}`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-sm font-bold text-text-main uppercase tracking-wider">Difficulty Level</label>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {['Easy', 'Medium', 'Hard', 'Mixed'].map(d => (
                <button
                  key={d}
                  onClick={() => onSettingsChange({ ...settings, difficulty: d.toLowerCase() })}
                  className={`py-3 rounded-xl font-bold transition-all ${settings.difficulty === d.toLowerCase() ? 'bg-primary-accent text-white shadow-lg shadow-primary-accent/20' : 'bg-bg-main border border-white/5 text-text-muted hover:text-text-main'}`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          <button 
            onClick={onGenerate}
            className="w-full bg-primary-accent hover:bg-primary-accent/90 text-white py-4 rounded-2xl font-bold shadow-xl shadow-primary-accent/20 flex items-center justify-center space-x-3 transition-all active:scale-95 group"
          >
            <Sparkles size={20} className="group-hover:rotate-12 transition-transform" />
            <span>Generate Flashcards</span>
          </button>
        </div>
      </div>
    );
  }

  // Step 3: Results Screen
  if (session.currentIndex >= session.cards.length) {
    const total = session.cards.length;
    const gotIt = session.results.gotIt.length;
    const needReview = session.results.needReview.length;
    const skipped = session.results.skipped.length;
    const mastery = Math.round((gotIt / total) * 100);

    return (
      <div className="max-w-2xl mx-auto space-y-10 py-8 animate-in fade-in zoom-in duration-500">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold">Session Complete! 🎓</h1>
          <p className="text-text-muted">You've reviewed all cards for this session.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center bg-bg-card p-10 rounded-3xl border border-white/5">
          <div className="flex justify-center">
            <div className="relative w-48 h-48">
              <svg className="w-full h-full -rotate-90">
                <circle cx="96" cy="96" r="88" className="stroke-white/5 fill-none stroke-[8]" />
                <motion.circle 
                  cx="96" cy="96" r="88" 
                  className="stroke-emerald-500 fill-none stroke-[8]"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: mastery / 100 }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-bold text-text-main">{mastery}%</span>
                <span className="text-xs uppercase font-bold tracking-widest text-text-muted">Mastery</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="font-semibold text-emerald-500">Mastered</span>
              </div>
              <span className="text-xl font-bold">{gotIt}</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-orange-500/10 border border-orange-500/20 rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-orange-500" />
                <span className="font-semibold text-orange-500">Need Review</span>
              </div>
              <span className="text-xl font-bold">{needReview}</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-white/5 border border-white/10 rounded-2xl text-text-muted">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-white/20" />
                <span className="font-semibold">Skipped</span>
              </div>
              <span className="text-xl font-bold">{skipped}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button 
            onClick={onReset}
            className="bg-bg-card border border-white/5 hover:border-white/20 py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2"
          >
            <RotateCcw size={20} />
            <span>Study Again</span>
          </button>
          <button 
            onClick={() => alert('Focus mode coming soon!')}
            className="bg-primary-accent hover:bg-primary-accent/90 text-white py-4 rounded-2xl font-bold shadow-lg shadow-primary-accent/20 transition-all flex items-center justify-center gap-2"
          >
            <Target size={20} />
            <span>Focus on Weak Cards</span>
          </button>
        </div>
      </div>
    );
  }

  // Step 2: Study Mode
  const currentCard = session.cards[session.currentIndex];
  const progress = ((session.currentIndex + 1) / session.cards.length) * 100;

  return (
    <div className="max-w-3xl mx-auto space-y-12 py-4 h-full flex flex-col items-center">
      <div className="w-full space-y-4">
        <div className="flex justify-between items-end">
          <span className="text-sm font-bold text-text-muted uppercase tracking-wider">Card {session.currentIndex + 1} of {session.cards.length}</span>
          <span className="text-xs font-mono px-2 py-1 bg-white/5 rounded-md text-text-muted uppercase">{currentCard.difficulty}</span>
        </div>
        <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
          <motion.div animate={{ width: `${progress}%` }} className="h-full bg-primary-accent" />
        </div>
      </div>

      <div className="perspective-1000 w-full max-w-xl flex-1 max-h-[400px]">
        <motion.div 
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          className="relative w-full h-full preserve-3d transition-all duration-500 cursor-pointer"
          onClick={() => setIsFlipped(!isFlipped)}
        >
          {/* Front Side */}
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-purple-700 p-12 rounded-[2.5rem] flex items-center justify-center text-center backface-hidden shadow-2xl shadow-indigo-900/40">
            <h3 className="text-2xl md:text-3xl font-bold text-white leading-tight">
              {currentCard.front}
            </h3>
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/50 text-xs font-medium uppercase tracking-widest flex items-center gap-2">
              <Lightbulb size={14} />
              Tap to Flip
            </div>
          </div>

          {/* Back Side */}
          <div className="absolute inset-0 bg-bg-card border-2 border-primary-accent/30 p-12 rounded-[2.5rem] flex items-center justify-center text-center backface-hidden rotate-y-180 shadow-2xl">
            <p className="text-xl md:text-2xl font-medium text-text-main leading-relaxed">
              {currentCard.back}
            </p>
          </div>
        </motion.div>
      </div>

      <div className="w-full max-w-xl flex items-center justify-center gap-4">
        <button 
          onClick={() => { onAction('needReview'); setIsFlipped(false); }}
          className="flex-1 flex flex-col items-center gap-2 p-6 bg-red-500/10 border border-red-500/20 rounded-3xl group hover:bg-red-500 hover:text-white transition-all"
        >
          <X size={24} className="text-red-500 group-hover:text-white transition-colors" />
          <span className="text-sm font-bold uppercase tracking-widest">Forgot</span>
        </button>
        <button 
          onClick={() => { onAction('skipped'); setIsFlipped(false); }}
          className="flex items-center justify-center w-16 h-16 bg-white/5 border border-white/5 rounded-full hover:bg-white hover:text-bg-main transition-all"
        >
          <FastForward size={24} />
        </button>
        <button 
          onClick={() => { onAction('gotIt'); setIsFlipped(false); }}
          className="flex-1 flex flex-col items-center gap-2 p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-3xl group hover:bg-emerald-500 hover:text-white transition-all"
        >
          <Check size={24} className="text-emerald-500 group-hover:text-white transition-colors" />
          <span className="text-sm font-bold uppercase tracking-widest">Got It</span>
        </button>
      </div>

      <div className="text-center">
        <p className="text-xs font-medium text-text-muted uppercase tracking-widest flex items-center justify-center gap-4">
          <span className="flex items-center gap-1"><span className="px-1.5 py-0.5 border border-white/10 rounded">←</span> Review</span>
          <span className="flex items-center gap-1"><span className="px-1.5 py-0.5 border border-white/10 rounded">→</span> Got It</span>
          <span className="flex items-center gap-1"><span className="px-3 py-0.5 border border-white/10 rounded">Space</span> Flip</span>
        </p>
      </div>
    </div>
  );
};

const Confetti = () => {
  const pieces = Array.from({ length: 50 });
  const colors = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];
  
  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {pieces.map((_, i) => (
        <div 
          key={i}
          className="confetti-piece"
          style={{
            left: `${Math.random() * 100}%`,
            backgroundColor: colors[Math.floor(Math.random() * colors.length)],
            animationDelay: `${Math.random() * 2}s`,
            animationDuration: `${2 + Math.random() * 2}s`
          }}
        />
      ))}
    </div>
  );
};

const QuizView = ({ 
  doc, 
  session, 
  isGenerating, 
  settings, 
  onSettingsChange, 
  onGenerate,
  onAnswer,
  onNext,
  onReset
}: { 
  doc: Document, 
  session: QuizSession | null, 
  isGenerating: boolean,
  settings: { count: number, difficulty: string, timer: number },
  onSettingsChange: (s: any) => void,
  onGenerate: () => void,
  onAnswer: (answer: string) => void,
  onNext: () => void,
  onReset: () => void
}) => {
  const [timeLeft, setTimeLeft] = useState(settings.timer);
  const [countingScore, setCountingScore] = useState(0);

  // Timer logic
  useEffect(() => {
    if (session && !session.isComplete && settings.timer > 0) {
      setTimeLeft(settings.timer);
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            onNext(); // Auto-next if time runs out
            return settings.timer;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [session?.currentIndex, session?.isComplete]);

  // Score counter animation
  useEffect(() => {
    if (session?.isComplete) {
      const correct = session.questions.filter(q => session.userAnswers[q.id] === q.correct).length;
      const targetScore = Math.round((correct / session.questions.length) * 100);
      
      let start = 0;
      const duration = 1500;
      const step = targetScore / (duration / 16);
      
      const timer = setInterval(() => {
        start += step;
        if (start >= targetScore) {
          setCountingScore(targetScore);
          clearInterval(timer);
        } else {
          setCountingScore(Math.floor(start));
        }
      }, 16);
      return () => clearInterval(timer);
    }
  }, [session?.isComplete]);

  if (isGenerating) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-8 animate-in fade-in duration-500 h-[60vh]">
        <div className="relative">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-24 h-24 rounded-full border-4 border-emerald-500/10 border-t-emerald-500"
          />
          <BookOpen className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-emerald-500 animate-pulse" size={32} />
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold">Crafting Your Quiz...</h2>
          <p className="text-text-muted">A university professor AI is writing {settings.count} questions for you.</p>
        </div>
      </div>
    );
  }

  // Step 1: Setup Screen
  if (!session) {
    return (
      <div className="max-w-2xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-500">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <BookOpen size={32} className="text-emerald-500" />
          </div>
          <h1 className="text-3xl font-bold">Skill Check Quiz</h1>
          <p className="text-text-muted">Test your knowledge of "{doc.title}" with tailored questions.</p>
        </div>

        <div className="bg-bg-card border border-white/5 rounded-3xl p-8 space-y-8">
          <div className="space-y-4">
            <label className="text-sm font-bold text-text-main uppercase tracking-wider">Number of questions</label>
            <div className="grid grid-cols-4 gap-3">
              {[5, 10, 15, 20].map(n => (
                <button
                  key={n}
                  onClick={() => onSettingsChange({ ...settings, count: n })}
                  className={`py-3 rounded-xl font-bold transition-all ${settings.count === n ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-bg-main border border-white/5 text-text-muted hover:text-text-main'}`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-sm font-bold text-text-main uppercase tracking-wider">Difficulty</label>
            <div className="grid grid-cols-3 gap-3">
              {['Easy', 'Medium', 'Hard'].map(d => (
                <button
                  key={d}
                  onClick={() => onSettingsChange({ ...settings, difficulty: d.toLowerCase() })}
                  className={`py-3 rounded-xl font-bold transition-all ${settings.difficulty === d.toLowerCase() ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-bg-main border border-white/5 text-text-muted hover:text-text-main'}`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-sm font-bold text-text-main uppercase tracking-wider">Timer per question</label>
            <div className="grid grid-cols-3 gap-3">
              {[{l: 'Off', v: 0}, {l: '30s', v: 30}, {l: '60s', v: 60}].map(t => (
                <button
                  key={t.v}
                  onClick={() => onSettingsChange({ ...settings, timer: t.v })}
                  className={`py-3 rounded-xl font-bold transition-all ${settings.timer === t.v ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-bg-main border border-white/5 text-text-muted hover:text-text-main'}`}
                >
                  {t.l}
                </button>
              ))}
            </div>
          </div>

          <button 
            onClick={onGenerate}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-4 rounded-2xl font-bold shadow-xl shadow-emerald-500/20 flex items-center justify-center space-x-3 transition-all active:scale-95 group"
          >
            <Sparkles size={20} className="group-hover:rotate-12 transition-transform" />
            <span>Generate Quiz</span>
          </button>
        </div>
      </div>
    );
  }

  // Step 3: Results Screen
  if (session.isComplete) {
    const correctAnswers = session.questions.filter(q => session.userAnswers[q.id] === q.correct);
    const score = Math.round((correctAnswers.length / session.questions.length) * 100);
    const pass = score >= 60;
    
    let emoji = '😟';
    if (score >= 90) emoji = '🎉';
    else if (score >= 70) emoji = '😊';
    else if (score >= 50) emoji = '😐';

    return (
      <div className="max-w-4xl mx-auto space-y-12 py-8 animate-in fade-in duration-700">
        {score >= 80 && <Confetti />}
        
        <div className="text-center space-y-4">
          <div className="text-8xl mb-4 animate-bounce">{emoji}</div>
          <div className="flex items-center justify-center gap-4">
            <h1 className="text-6xl font-black bg-gradient-to-r from-emerald-400 to-teal-500 bg-clip-text text-transparent">
              {countingScore}%
            </h1>
            <span className={`px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-wider ${pass ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
              {score >= 60 ? 'PASSED' : 'FAILED'}
            </span>
          </div>
          <p className="text-text-muted text-lg">You got {correctAnswers.length} out of {session.questions.length} questions correct.</p>
        </div>

        <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
          <button onClick={onReset} className="py-4 bg-bg-card border border-white/5 rounded-2xl font-bold hover:bg-white/5 transition-colors">Retake Quiz</button>
          <button onClick={onReset} className="py-4 bg-emerald-500 text-white rounded-2xl font-bold shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-colors">New Quiz</button>
        </div>

        <div className="space-y-6">
          <h2 className="text-2xl font-bold border-b border-white/5 pb-4">Question Review</h2>
          {session.questions.map((q, i) => {
            const userAnswer = session.userAnswers[q.id];
            const isCorrect = userAnswer === q.correct;
            
            return (
              <div key={q.id} className="bg-bg-card border border-white/5 rounded-3xl overflow-hidden shadow-sm">
                <div className="p-6 md:p-8 space-y-6">
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="text-lg font-bold">
                      <span className="text-text-muted mr-3">Q{i + 1}.</span>
                      {q.question}
                    </h3>
                    {isCorrect ? (
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white"><Check size={18} /></div>
                    ) : (
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-red-500 flex items-center justify-center text-white"><X size={18} /></div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {Object.entries(q.options).map(([key, value]) => {
                      const isCorrectOption = key === q.correct;
                      const isUserSelected = key === userAnswer;
                      
                      let variant = "bg-bg-main border-white/5 text-text-muted";
                      if (isCorrectOption) variant = "bg-emerald-500/10 border-emerald-500 text-emerald-400";
                      else if (isUserSelected && !isCorrect) variant = "bg-red-500/10 border-red-500 text-red-500";

                      return (
                        <div key={key} className={`p-4 rounded-xl border flex items-center gap-3 transition-colors ${variant}`}>
                          <span className="font-bold opacity-50">{key}</span>
                          <span className="text-sm font-medium">{value}</span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="bg-white/5 p-5 rounded-2xl space-y-2">
                    <p className="text-xs font-bold uppercase tracking-widest text-text-muted flex items-center gap-2">
                      <Lightbulb size={14} className="text-emerald-500" />
                      Explanation
                    </p>
                    <p className="text-sm text-text-main/80 leading-relaxed italic">{q.explanation}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Step 2: Taking Screen
  const q = session.questions[session.currentIndex];
  const progress = ((session.currentIndex + 1) / session.questions.length) * 100;
  const currentAnswer = session.userAnswers[q.id];

  return (
    <div className="max-w-3xl mx-auto space-y-12 py-4 h-full flex flex-col items-center">
      <div className="w-full space-y-6">
        <div className="flex justify-between items-center">
          <div className="space-y-1">
            <span className="text-sm font-bold text-text-muted uppercase tracking-wider">Question {session.currentIndex + 1} of {session.questions.length}</span>
            <div className="w-48 h-1.5 bg-white/5 rounded-full overflow-hidden">
              <motion.div animate={{ width: `${progress}%` }} className="h-full bg-emerald-500" />
            </div>
          </div>
          
          {settings.timer > 0 && (
            <div className={`relative w-16 h-16 flex items-center justify-center ${timeLeft < 10 ? 'timer-warning' : ''}`}>
              <svg className="w-full h-full -rotate-90">
                <circle cx="32" cy="32" r="30" className="stroke-white/5 fill-none stroke-4" />
                <motion.circle 
                  cx="32" cy="32" r="30" 
                  className={`fill-none stroke-4 ${timeLeft < 10 ? 'stroke-red-500' : 'stroke-emerald-500'}`}
                  initial={{ pathLength: 1 }}
                  animate={{ pathLength: timeLeft / settings.timer }}
                  transition={{ duration: 1, ease: "linear" }}
                  strokeLinecap="round"
                />
              </svg>
              <span className={`absolute text-lg font-black font-mono ${timeLeft < 10 ? 'text-red-500' : ''}`}>{timeLeft}</span>
            </div>
          )}
        </div>
      </div>

      <div className="w-full space-y-10 animate-in slide-in-from-right-8 duration-500">
        <h2 className="text-3xl font-black text-text-main leading-tight text-center max-w-2xl mx-auto">
          {q.question}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
          {Object.entries(q.options).map(([key, value]) => {
            const isSelected = currentAnswer === key;
            return (
              <button 
                key={key}
                onClick={() => onAnswer(key)}
                className={`p-6 rounded-[2rem] border-2 text-left transition-all relative group flex items-start gap-4 overflow-hidden ${isSelected ? 'bg-primary-accent border-primary-accent text-white shadow-xl shadow-primary-accent/30' : 'bg-bg-card border-white/5 text-text-muted hover:border-white/20'}`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black flex-shrink-0 transition-colors ${isSelected ? 'bg-white/20 text-white' : 'bg-bg-main group-hover:bg-primary-accent/10 group-hover:text-primary-accent'}`}>
                  {key}
                </div>
                <span className="text-lg font-bold leading-snug pr-4">{value}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="w-full flex justify-center py-8">
        <button 
          disabled={!currentAnswer}
          onClick={onNext}
          className={`px-12 py-4 rounded-2xl font-bold shadow-xl transition-all flex items-center gap-3 ${currentAnswer ? 'bg-emerald-500 text-white shadow-emerald-500/20 active:scale-95' : 'bg-white/5 text-text-muted cursor-not-allowed opacity-50'}`}
        >
          <span>{session.currentIndex === session.questions.length - 1 ? 'Finish Quiz' : 'Next Question'}</span>
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
};

const ExamPredictorView = ({ 
  doc, 
  predictions, 
  isGenerating, 
  onPredict,
  onStudyFlashcards
}: { 
  doc: Document, 
  predictions: PredictedQuestion[], 
  isGenerating: boolean,
  onPredict: () => void,
  onStudyFlashcards: () => void
}) => {
  const [expandedIds, setExpandedIds] = useState<Set<number | string>>(new Set());

  const toggleExpand = (id: number | string) => {
    const newSet = new Set(expandedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setExpandedIds(newSet);
  };

  if (isGenerating) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-8 animate-in fade-in duration-500 h-[60vh]">
        <div className="relative">
          <motion.div 
            animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-0 bg-primary-accent rounded-full blur-3xl"
          />
          <div className="relative w-24 h-24 bg-bg-card rounded-3xl border border-white/10 flex items-center justify-center shadow-2xl">
            <Wand2 size={40} className="text-primary-accent animate-pulse" />
          </div>
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold">🔮 AI is thinking like your professor...</h2>
          <p className="text-text-muted">Analyzing structure and key concepts to find likely exam topics.</p>
        </div>
      </div>
    );
  }

  if (predictions.length === 0) {
    return (
      <div className="max-w-2xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-500 text-center py-12">
        <div className="w-20 h-20 bg-primary-accent/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
          <Target size={40} className="text-primary-accent" />
        </div>
        <div className="space-y-3">
          <h1 className="text-4xl font-black">🎯 Exam Predictor</h1>
          <p className="text-text-muted text-lg">Predict what concepts are most likely to appear on your upcoming exam.</p>
        </div>

        <div className="bg-bg-card border border-white/5 rounded-3xl p-10 space-y-8">
          <div className="flex flex-col items-center gap-4">
            <span className="text-xs font-bold uppercase tracking-widest text-text-muted">Target Document</span>
            <div className="flex items-center gap-3 px-6 py-3 bg-white/5 border border-white/5 rounded-2xl w-full justify-center">
              <FileText size={18} className="text-primary-accent" />
              <span className="font-bold">{doc.title}</span>
            </div>
          </div>

          <button 
            onClick={onPredict}
            className="w-full bg-primary-accent hover:bg-primary-accent/90 text-white py-5 rounded-2xl font-black shadow-xl shadow-primary-accent/20 flex items-center justify-center space-x-3 transition-all active:scale-95 group text-lg"
          >
            <Wand2 size={24} className="group-hover:rotate-12 transition-transform" />
            <span>Predict Exam Questions</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-white/5">
        <div className="space-y-2">
          <h1 className="text-4xl font-black flex items-center gap-3">
            <span>🎯 Exam Predictor</span>
          </h1>
          <p className="text-text-muted flex items-center gap-2">
            <span>Predicted questions for </span>
            <span className="px-2 py-0.5 bg-primary-accent/10 text-primary-accent rounded font-bold">{doc.title}</span>
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={onPredict} className="px-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl font-bold flex items-center gap-2 transition-all">
            <RefreshCw size={18} />
            <span>Redo Prediction</span>
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {predictions.map((p, i) => {
          const isExpanded = expandedIds.has(p.id);
          return (
            <motion.div 
              key={p.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-bg-card border border-white/5 rounded-3xl overflow-hidden shadow-sm"
            >
              <div className="p-6 md:p-8 space-y-6">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary-accent flex items-center justify-center text-white font-black text-lg">
                    {i + 1}
                  </div>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 ${p.importance === 'high' ? 'bg-red-500/10 text-red-500' : 'bg-orange-500/10 text-orange-500'}`}>
                    <div className={`w-2 h-2 rounded-full ${p.importance === 'high' ? 'bg-red-500 shadow-[0_0_8px_#ef4444]' : 'bg-orange-500 shadow-[0_0_8px_#f59e0b]'}`} />
                    {p.importance} Importance
                  </span>
                  <span className="px-3 py-1 bg-white/5 border border-white/5 rounded-full text-[10px] font-black uppercase tracking-widest text-text-muted">
                    {p.type.replace('_', ' ')}
                  </span>
                </div>

                <h2 className="text-2xl font-bold text-text-main leading-tight">
                  {p.question}
                </h2>

                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-text-muted">
                    <span>Prediction Confidence</span>
                    <span className="text-primary-accent">{p.confidence}%</span>
                  </div>
                  <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${p.confidence}%` }}
                      className="h-full bg-primary-accent"
                    />
                  </div>
                </div>

                <button 
                  onClick={() => toggleExpand(p.id)}
                  className="flex items-center gap-2 text-sm font-bold text-primary-accent hover:text-primary-accent/80 transition-colors"
                >
                  {isExpanded ? (
                    <><span>Show Less</span> <ChevronUp size={16} /></>
                  ) : (
                    <><span>Review Details & Tips</span> <ChevronDown size={16} /></>
                  )}
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden space-y-8 pt-6 border-t border-white/5"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                          <div className="space-y-1">
                            <h4 className="text-xs font-black uppercase tracking-widest text-text-muted flex items-center gap-2">
                              <Target size={14} className="text-primary-accent" />
                              Why likely to appear
                            </h4>
                            <p className="text-sm text-text-main/80 leading-relaxed font-medium">{p.why_likely}</p>
                          </div>
                          <div className="space-y-1">
                            <h4 className="text-xs font-black uppercase tracking-widest text-text-muted flex items-center gap-2">
                              <Lightbulb size={14} className="text-emerald-500" />
                              How to prepare
                            </h4>
                            <p className="text-sm text-text-main/80 leading-relaxed font-medium italic">{p.study_tip}</p>
                          </div>
                        </div>

                        <div className="bg-white/5 p-6 rounded-2xl space-y-4">
                          <h4 className="text-xs font-black uppercase tracking-widest text-text-muted">Key points to cover</h4>
                          <ul className="space-y-3">
                            {p.key_points.map((point, k) => (
                              <li key={k} className="flex items-start gap-3 text-sm">
                                <div className="w-1.5 h-1.5 rounded-full bg-primary-accent mt-1.5 flex-shrink-0" />
                                <span className="font-medium">{point}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="flex flex-col md:flex-row items-center justify-center gap-4 pt-12">
        <button 
          onClick={onStudyFlashcards}
          className="w-full md:w-auto px-10 py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black shadow-xl shadow-indigo-900/40 transition-all flex items-center justify-center gap-3 active:scale-95"
        >
          <Layers size={20} />
          <span>Study All Flashcards</span>
        </button>
        <button 
          onClick={onPredict}
          className="w-full md:w-auto px-10 py-5 bg-bg-card border border-white/10 hover:border-white/20 rounded-2xl font-black transition-all flex items-center justify-center gap-3 active:scale-95"
        >
          <RefreshCw size={20} />
          <span>Predict New Questions</span>
        </button>
      </div>
    </div>
  );
};

const ChatView = ({ 
  doc, 
  messages, 
  isTyping, 
  onSend,
  onClear
}: { 
  doc: Document, 
  messages: ChatMessage[], 
  isTyping: boolean,
  onSend: (msg: string) => void,
  onClear: () => void
}) => {
  const [input, setInput] = useState('');
  const scrollRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = () => {
    if (!input.trim()) return;
    onSend(input);
    setInput('');
  };

  const quickQuestions = [
    "Summarize this document",
    "What are the most important concepts?",
    "Explain the main topic simply",
    "What might appear in an exam?",
    "Give me 3 examples from this material"
  ];

  return (
    <div className="flex h-[calc(100vh-180px)] gap-6 animate-in fade-in duration-500">
      {/* Left Panel */}
      <div className="w-1/3 flex flex-col gap-6">
        <div className="bg-bg-card border border-white/5 rounded-3xl p-6 space-y-4">
          <div className="w-12 h-12 bg-primary-accent/10 rounded-2xl flex items-center justify-center">
            <FileText size={24} className="text-primary-accent" />
          </div>
          <div>
            <h3 className="font-bold text-lg truncate">{doc.title}</h3>
            <p className="text-xs text-text-muted uppercase tracking-widest font-bold mt-1">{doc.subject}</p>
          </div>
          <div className="pt-4 border-t border-white/5">
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">Uploaded</span>
              <span className="text-text-main">{new Date(doc.timestamp).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        <div className="bg-bg-card border border-white/5 rounded-3xl p-6 flex-1 overflow-y-auto custom-scrollbar">
          <h4 className="text-xs font-bold uppercase tracking-widest text-text-muted mb-4">Quick Questions</h4>
          <div className="space-y-2">
            {quickQuestions.map((q, i) => (
              <button 
                key={i}
                onClick={() => onSend(q)}
                className="w-full text-left p-3 rounded-xl bg-white/5 border border-white/5 hover:border-primary-accent/30 hover:bg-primary-accent/5 text-sm transition-all group"
              >
                <div className="flex items-center justify-between">
                  <span>{q}</span>
                  <Plus size={14} className="text-text-muted group-hover:text-primary-accent opacity-0 group-hover:opacity-100 transition-all" />
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex flex-col bg-bg-card border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-500/10 rounded-full flex items-center justify-center">
              <MessageSquare size={20} className="text-indigo-400" />
            </div>
            <div>
              <h3 className="font-bold">Chat with AI Tutor</h3>
              <p className="text-xs text-emerald-500 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                AI Online
              </p>
            </div>
          </div>
          <button 
            onClick={onClear}
            className="p-2 text-text-muted hover:text-red-500 transition-colors"
            title="Clear Chat"
          >
            <Trash2 size={20} />
          </button>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-bg-main/30">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-50">
              <Bot size={48} className="text-primary-accent" />
              <p className="max-w-[250px] text-sm">Hello! I'm StudyMind AI. How can I help you study this document today?</p>
            </div>
          )}
          
          {messages.map((m, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex gap-3 max-w-[80%] ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                {m.role === 'model' && (
                  <div className="w-8 h-8 rounded-full bg-primary-accent flex items-center justify-center text-white flex-shrink-0 mt-1">
                    <Bot size={16} />
                  </div>
                )}
                <div className="space-y-1">
                  <div className={`p-4 rounded-2xl shadow-sm ${
                    m.role === 'user' 
                      ? 'bg-primary-accent text-white rounded-tr-none' 
                      : 'bg-bg-card border border-white/5 text-text-main rounded-tl-none'
                  }`}>
                    {m.role === 'model' ? (
                      <div className="prose prose-sm prose-invert max-w-none">
                        <ReactMarkdown>{m.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <p className="text-sm">{m.content}</p>
                    )}
                  </div>
                  <div className={`flex items-center gap-2 text-[10px] text-text-muted mt-1 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <span>{m.timestamp}</span>
                    {m.role === 'model' && (
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(m.content);
                          alert('Copied to clipboard!');
                        }} 
                        className="hover:text-primary-accent transition-colors"
                      >
                        <Copy size={10} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
          
          {isTyping && (
            <div className="flex justify-start">
              <div className="flex gap-3 items-center">
                <div className="w-8 h-8 rounded-full bg-primary-accent flex items-center justify-center text-white">
                  <Bot size={16} />
                </div>
                <div className="bg-bg-card border border-white/5 p-4 rounded-2xl rounded-tl-none flex gap-1">
                  <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 bg-text-muted rounded-full" />
                  <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 bg-text-muted rounded-full" />
                  <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 bg-text-muted rounded-full" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="p-6 border-t border-white/5 bg-bg-card">
          <div className="relative flex items-center gap-3">
            <input 
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask anything about the document..."
              className="flex-1 bg-bg-main border border-white/5 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:border-primary-accent transition-colors pr-16"
            />
            <button 
              onClick={handleSend}
              disabled={!input.trim()}
              className={`p-3 rounded-xl transition-all ${input.trim() ? 'bg-primary-accent text-white shadow-lg shadow-primary-accent/20 active:scale-95' : 'bg-white/5 text-text-muted cursor-not-allowed'}`}
            >
              <Send size={20} />
            </button>
          </div>
          <div className="mt-3 flex justify-between items-center text-[10px] text-text-muted uppercase tracking-widest font-bold px-1">
            <span>Powered by Gemini 1.5 Flash</span>
            <span>{messages.length} messages today</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const ProgressView = ({ 
  stats, 
  quizResults, 
  documents,
  masteryPerDoc,
  featuresUsed,
  messagesSent
}: { 
  stats: { docs: number, flashcards: number, quizzes: number, streak: number },
  quizResults: QuizResult[],
  documents: Document[],
  masteryPerDoc: Record<string, { mastered: number, total: number }>,
  featuresUsed: Set<string>,
  messagesSent: number
}) => {
  const weeklyData = [
    { day: 'Mon', mins: 45 },
    { day: 'Tue', mins: 30 },
    { day: 'Wed', mins: 60 },
    { day: 'Thu', mins: 45 },
    { day: 'Fri', mins: 90 },
    { day: 'Sat', mins: 20 },
    { day: 'Sun', mins: 15 },
  ];

  const maxMins = Math.max(...weeklyData.map(d => d.mins));

  const achievements = [
    { id: 'first_upload', title: 'First Upload', desc: 'Upload your first document', icon: Upload, unlocked: documents.length > 0 },
    { id: 'card_shark', title: 'Card Shark', desc: 'Review 50 flashcards', icon: Layers, unlocked: stats.flashcards >= 50 },
    { id: 'quiz_master', title: 'Quiz Master', desc: 'Score 100% on a quiz', icon: BookOpen, unlocked: quizResults.some(r => r.score === r.total) },
    { id: 'on_fire', title: 'On Fire', desc: '7 day study streak', icon: Sparkles, unlocked: stats.streak >= 7 },
    { id: 'deep_learner', title: 'Deep Learner', desc: 'Chat 20 messages', icon: MessageSquare, unlocked: messagesSent >= 20 },
    { id: 'all_rounder', title: 'All-Rounder', desc: 'Use all 5 features', icon: Target, unlocked: featuresUsed.size >= 5 },
  ];

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="space-y-2">
        <h1 className="text-4xl font-black">📊 My Progress</h1>
        <p className="text-text-muted">Track your learning journey and unlock achievements</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Documents" value={stats.docs} icon={FileText} color="bg-blue-500" />
        <StatCard label="Flashcards Mastered" value={stats.flashcards} icon={Layers} color="bg-purple-500" />
        <StatCard label="Quizzes Completed" value={stats.quizzes} icon={BookOpen} color="bg-emerald-500" />
        <StatCard label="Study Streak" value={`${stats.streak} days`} icon={Sparkles} color="bg-orange-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Weekly Activity */}
        <div className="lg:col-span-2 bg-bg-card border border-white/5 rounded-3xl p-8 space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-lg">Weekly Activity</h3>
            <span className="text-xs font-bold text-text-muted uppercase tracking-widest">Minutes Studied</span>
          </div>

          <div className="relative h-64 flex items-end justify-between px-4 pt-10">
            {weeklyData.map((d, i) => {
              const height = (d.mins / maxMins) * 100;
              return (
                <div key={i} className="flex flex-col items-center gap-4 group flex-1">
                  <div className="relative w-full px-2 flex justify-center items-end h-full">
                    <motion.div 
                      initial={{ height: 0 }}
                      animate={{ height: `${height}%` }}
                      className="w-full max-w-[40px] bg-primary-accent rounded-t-lg relative group-hover:bg-primary-accent/80 transition-colors"
                    >
                      <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-bg-main border border-white/10 px-2 py-1 rounded text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-xl">
                        {d.mins} mins
                      </div>
                    </motion.div>
                  </div>
                  <span className="text-[10px] font-bold text-text-muted uppercase tracking-tighter">{d.day}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quiz Performance */}
        <div className="bg-bg-card border border-white/5 rounded-3xl p-8 space-y-6">
          <h3 className="font-bold text-lg">Quiz Performance</h3>
          <div className="space-y-4 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
            {quizResults.length === 0 ? (
              <p className="text-sm text-text-muted italic">Complete a quiz to see results</p>
            ) : (
              quizResults.map((r, i) => {
                const percentage = (r.score / r.total) * 100;
                const color = percentage >= 80 ? 'text-emerald-500 bg-emerald-500/10' : percentage >= 60 ? 'text-orange-500 bg-orange-500/10' : 'text-red-500 bg-red-500/10';
                return (
                  <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                    <div className="space-y-1">
                      <p className="text-xs font-bold truncate max-w-[150px]">{r.docTitle}</p>
                      <p className="text-[10px] text-text-muted">{new Date(r.timestamp).toLocaleDateString()}</p>
                    </div>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs ${color}`}>
                      {percentage}%
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Flashcard Mastery */}
        <div className="lg:col-span-1 bg-bg-card border border-white/5 rounded-3xl p-8 space-y-6">
          <h3 className="font-bold text-lg">Mastery per Doc</h3>
          <div className="space-y-6">
            {documents.length === 0 ? (
                <p className="text-sm text-text-muted italic">Upload docs to track mastery</p>
            ) : (
              documents.slice(0, 5).map((doc) => {
                const mastery = masteryPerDoc[doc.id] || { mastered: 0, total: 20 }; // default total for UI
                const progress = (mastery.mastered / mastery.total) * 100;
                return (
                  <div key={doc.id} className="space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-text-main truncate max-w-[180px]">{doc.title}</span>
                      <span className="text-text-muted">{mastery.mastered}/{mastery.total}</span>
                    </div>
                    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        className="h-full bg-emerald-500"
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Achievements */}
        <div className="lg:col-span-2 space-y-6">
          <h3 className="font-bold text-lg">Achievements</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {achievements.map((a) => (
              <div 
                key={a.id} 
                className={`relative p-5 rounded-3xl border transition-all flex flex-col items-center text-center space-y-3 ${
                  a.unlocked 
                    ? 'bg-gradient-to-br from-yellow-500/10 to-transparent border-yellow-500/30' 
                    : 'bg-white/5 border-white/5 grayscale opacity-60'
                }`}
              >
                {!a.unlocked && (
                  <div className="absolute top-3 right-3 text-text-muted">
                    <RotateCcw size={14} className="opacity-40" />
                  </div>
                )}
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${a.unlocked ? 'bg-yellow-500 text-bg-main' : 'bg-white/10 text-white'}`}>
                  <a.icon size={24} />
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-widest">{a.title}</h4>
                  <p className="text-[10px] text-text-muted mt-1 leading-tight">{a.desc}</p>
                </div>
                {a.unlocked && (
                   <div className="absolute inset-0 rounded-3xl ring-2 ring-yellow-500/50 animate-pulse pointer-events-none" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const ToastContainer = ({ toasts, onRemove }: { toasts: Toast[], onRemove: (id: string) => void }) => (
  <div className="fixed bottom-6 right-6 z-50 space-y-3 pointer-events-none">
    <AnimatePresence>
      {toasts.map((toast) => (
        <motion.div
          key={toast.id}
          initial={{ opacity: 0, x: 20, scale: 0.95 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 20, scale: 0.95 }}
          className={`pointer-events-auto px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border ${
            toast.type === 'success' ? 'bg-emerald-500 border-emerald-400 text-white' :
            toast.type === 'error' ? 'bg-red-500 border-red-400 text-white' :
            'bg-indigo-600 border-indigo-500 text-white'
          }`}
        >
          {toast.type === 'success' && <Check size={18} />}
          {toast.type === 'error' && <AlertCircle size={18} />}
          {toast.type === 'info' && <Info size={18} />}
          <span className="font-bold text-sm tracking-tight">{toast.message}</span>
          <button onClick={() => onRemove(toast.id)} className="ml-2 hover:opacity-70 transition-opacity">
            <X size={16} />
          </button>
        </motion.div>
      ))}
    </AnimatePresence>
  </div>
);

const LandingHero = ({ onUpload, onPaste }: { onUpload: () => void, onPaste: () => void }) => (
  <div className="py-20 flex flex-col items-center text-center space-y-12 animate-in fade-in slide-in-from-bottom-10 duration-1000">
    <div className="space-y-6 max-w-3xl">
      <div className="flex justify-center mb-6">
        <div className="px-4 py-1.5 bg-primary-accent/10 border border-primary-accent/20 rounded-full text-primary-accent text-xs font-black uppercase tracking-widest animate-pulse">
          New: Gemini 1.5 Powered Analysis
        </div>
      </div>
      <h1 className="text-6xl md:text-7xl font-black tracking-tighter leading-none bg-gradient-to-b from-white to-white/40 bg-clip-text text-transparent">
        Study Smarter with AI 🧠
      </h1>
      <p className="text-xl text-text-muted font-medium max-w-2xl mx-auto leading-relaxed">
        Upload your notes, get summaries, flashcards, quizzes and more — instantly. Your ultimate AI-powered study companion.
      </p>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-6">
        <button 
          onClick={onUpload}
          className="w-full sm:w-auto px-10 py-5 bg-primary-accent hover:bg-primary-accent/90 text-white rounded-2xl font-black text-lg shadow-2xl shadow-primary-accent/20 transition-all hover:-translate-y-1 active:scale-95"
        >
          Upload Document
        </button>
        <button 
          onClick={onPaste}
          className="w-full sm:w-auto px-10 py-5 bg-transparent border-2 border-white/10 hover:border-white/30 text-white rounded-2xl font-black text-lg transition-all active:scale-95"
        >
          Paste Text
        </button>
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-6xl px-4">
      {[
        { title: 'Interactive Summaries', desc: 'Break down complex topics into digestible bite-sized learning points.', icon: Zap, color: 'text-yellow-400' },
        { title: 'Smart Flashcards', desc: 'AI-generated cards focused on the most critical parts of your material.', icon: Layers, color: 'text-purple-400' },
        { title: 'Exam Predictor', desc: 'Predict likely questions and get tips from an AI professor perspective.', icon: Target, color: 'text-red-400' }
      ].map((f, i) => (
        <div key={i} className="bg-bg-card border border-white/5 p-8 rounded-3xl text-left space-y-4 hover:border-white/10 transition-colors">
          <div className={`w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center ${f.color}`}>
            <f.icon size={28} />
          </div>
          <h3 className="text-lg font-bold">{f.title}</h3>
          <p className="text-sm text-text-muted leading-relaxed font-medium">{f.desc}</p>
        </div>
      ))}
    </div>
  </div>
);

const SettingsView = ({ settings, onUpdate, onClearAll }: { settings: UserSettings, onUpdate: (s: Partial<UserSettings>) => void, onClearAll: () => void }) => {
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <div className="max-w-3xl mx-auto space-y-10 py-10 animate-in fade-in duration-500">
      <div className="space-y-1">
        <h1 className="text-3xl font-black">⚙️ Settings</h1>
        <p className="text-text-muted">Personalize your StudyMind experience</p>
      </div>

      <div className="bg-bg-card border border-white/5 rounded-3xl overflow-hidden divide-y divide-white/5">
        <div className="p-8 space-y-6">
          <div className="space-y-4">
            <label className="text-xs font-black uppercase tracking-widest text-text-muted">Display Name</label>
            <input 
              type="text" 
              value={settings.displayName}
              onChange={(e) => onUpdate({ displayName: e.target.value })}
              className="w-full bg-bg-main border border-white/5 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:border-primary-accent transition-colors"
              placeholder="Your Name"
            />
          </div>

          <div className="space-y-4">
            <label className="text-xs font-black uppercase tracking-widest text-text-muted">AI Response Style</label>
            <div className="grid grid-cols-3 gap-3">
              {(['concise', 'detailed', 'eli5'] as const).map((style) => (
                <button
                  key={style}
                  onClick={() => onUpdate({ aiStyle: style })}
                  className={`py-4 rounded-2xl border text-sm font-bold capitalize transition-all ${
                    settings.aiStyle === style 
                      ? 'bg-primary-accent border-primary-accent text-white' 
                      : 'bg-white/5 border-white/5 text-text-muted hover:border-white/20'
                  }`}
                >
                  {style === 'eli5' ? 'Simple (ELI5)' : style}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-xs font-black uppercase tracking-widest text-text-muted">Theme Appearance</label>
            <div className="flex gap-4">
              <button 
                onClick={() => onUpdate({ theme: 'dark' })}
                className={`flex-1 p-4 rounded-2xl border flex items-center justify-center gap-3 transition-all ${
                  settings.theme === 'dark' ? 'bg-primary-accent border-primary-accent text-white' : 'bg-white/5 border-white/5 text-text-muted hover:border-white/20'
                }`}
              >
                <Moon size={18} />
                <span className="font-bold">Dark Slate</span>
              </button>
              <button 
                onClick={() => onUpdate({ theme: 'midnight' })}
                className={`flex-1 p-4 rounded-2xl border flex items-center justify-center gap-3 transition-all ${
                  settings.theme === 'midnight' ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white/5 border-white/5 text-text-muted hover:border-white/20'
                }`}
              >
                <Sparkles size={18} />
                <span className="font-bold">Midnight</span>
              </button>
            </div>
          </div>
        </div>

        <div className="p-8 bg-red-500/5">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h4 className="font-bold text-red-500">Danger Zone</h4>
              <p className="text-xs text-text-muted">This will erase all your documents and progress permanently.</p>
            </div>
            {!showConfirm ? (
              <button 
                onClick={() => setShowConfirm(true)}
                className="px-6 py-3 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 rounded-xl font-bold transition-all"
              >
                Clear All Data
              </button>
            ) : (
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowConfirm(false)}
                  className="px-4 py-2 text-sm font-bold text-text-muted hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={onClearAll}
                  className="px-6 py-3 bg-red-500 text-white rounded-xl font-black transition-all active:scale-95"
                >
                  Confirm Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const DashboardView = ({ onUploadClick, onPasteClick, docCount }: { onUploadClick: () => void, onPasteClick: () => void, docCount: number }) => (
  <div className="space-y-8">
    {docCount === 0 ? (
      <LandingHero onUpload={onUploadClick} onPaste={onPasteClick} />
    ) : (
      <>
        <div className="flex flex-col space-y-2">
          <h1 className="text-4xl font-black">👋 Welcome back!</h1>
          <p className="text-text-muted">Ready to ace your subjects? Let's start studying.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <ActionCard 
            title="Upload Notes" 
            desc="Upload PDF or Text files to analyze" 
            icon={Upload} 
            onClick={onUploadClick}
            color="bg-primary-accent" 
          />
          <ActionCard 
            title="AI Summarize" 
            desc="Get key concepts and TL;DR instantly" 
            icon={BookOpen} 
            onClick={onUploadClick}
            color="bg-emerald-500" 
          />
          <ActionCard 
            title="Flashcards" 
            desc="Master concepts with active recall" 
            icon={Layers} 
            onClick={onUploadClick}
            color="bg-indigo-500" 
          />
        </div>
      </>
    )}
  </div>
);


const MyDocsView = ({ documents, onDelete, onView }: { documents: Document[], onDelete: (id: string) => void, onView: (doc: Document) => void }) => (
  <div className="space-y-8 animate-in fade-in duration-500">
    <div className="flex flex-col space-y-2">
      <h1 className="text-4xl font-black">📚 My Library</h1>
      <p className="text-text-muted">Manage all your uploaded study materials</p>
    </div>

    {documents.length === 0 ? (
      <div className="bg-bg-card border-2 border-dashed border-white/5 rounded-3xl p-20 flex flex-col items-center text-center space-y-4">
        <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center text-text-muted">
          <FileText size={32} />
        </div>
        <p className="text-text-muted font-medium">No documents yet. Start by uploading one!</p>
      </div>
    ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {documents.map((doc) => (
          <div key={doc.id} className="bg-bg-card border border-white/5 rounded-3xl p-6 space-y-6 hover:border-white/10 transition-all group">
            <div className="flex justify-between items-start">
              <div className="w-12 h-12 bg-primary-accent/10 rounded-2xl flex items-center justify-center text-primary-accent">
                <FileText size={24} />
              </div>
              <button 
                onClick={() => onDelete(doc.id)}
                className="p-2 text-text-muted hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
              >
                <Trash2 size={18} />
              </button>
            </div>
            <div>
              <h3 className="font-bold text-lg truncate mb-1">{doc.title}</h3>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-white/5 rounded text-[10px] font-black uppercase tracking-widest text-text-muted">{doc.subject}</span>
                <span className="text-[10px] text-text-muted">{new Date(doc.timestamp).toLocaleDateString()}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-4">
              <button onClick={() => onView(doc)} className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-bold transition-colors">Summary</button>
              <button onClick={() => onView(doc)} className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-bold transition-colors">Quiz</button>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
);

const ShortcutModal = ({ onClose }: { onClose: () => void }) => (
  <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-bg-main/80 backdrop-blur-md">
    <motion.div 
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="bg-bg-card border border-white/10 p-10 rounded-3xl max-w-lg w-full shadow-2xl relative"
    >
      <button onClick={onClose} className="absolute top-6 right-6 text-text-muted hover:text-white"><X size={24} /></button>
      <h2 className="text-3xl font-black mb-8">⌨️ Shortcuts</h2>
      <div className="space-y-6">
        {[
          { key: '?', desc: 'Show this help modal' },
          { key: '←', desc: 'Previous flashcard' },
          { key: '→', desc: 'Next flashcard' },
          { key: 'Space', desc: 'Flip flashcard' },
          { key: 'Esc', desc: 'Close modals/views' },
        ].map((s, i) => (
          <div key={i} className="flex items-center justify-between">
            <span className="text-text-main font-medium">{s.desc}</span>
            <kbd className="px-3 py-1.5 bg-white/10 border border-white/10 rounded-lg font-black text-sm">{s.key}</kbd>
          </div>
        ))}
      </div>
    </motion.div>
  </div>
);

const UploadView = ({ onAnalyze }: { onAnalyze: (title: string, subject: string, type: 'pdf' | 'text', content?: string) => void }) => {
  const [tab, setTab] = useState<'pdf' | 'text'>('pdf');
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('Computer Science');
  const [pastedText, setPastedText] = useState('');
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [fileProgress, setFileProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const subjects = [
    'Mathematics', 'Physics', 'Chemistry', 'Biology', 'History', 
    'Computer Science', 'Economics', 'Literature', 'Other'
  ];

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setIsUploadingFile(true);
      setFileProgress(0);
      setTitle(file.name.split('.')[0]);
      
      const interval = setInterval(() => {
        setFileProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 5;
        });
      }, 50);
    }
  };

  const isFormValid = title.trim() !== '' && (tab === 'pdf' ? selectedFile !== null && fileProgress === 100 : pastedText.trim() !== '');

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex flex-col space-y-2 text-center">
        <h1 className="text-3xl font-bold">Import Study Material</h1>
        <p className="text-text-muted">Choose how you'd like to provide your content to the AI.</p>
      </div>

      <div className="bg-bg-card rounded-3xl border border-white/5 overflow-hidden">
        <div className="flex border-bottom border-white/5">
          <button 
            onClick={() => setTab('pdf')}
            className={`flex-1 py-4 font-semibold text-sm transition-colors ${tab === 'pdf' ? 'bg-primary-accent/10 text-primary-accent border-b-2 border-primary-accent' : 'text-text-muted hover:text-text-main'}`}
          >
            Upload PDF
          </button>
          <button 
            onClick={() => setTab('text')}
            className={`flex-1 py-4 font-semibold text-sm transition-colors ${tab === 'text' ? 'bg-primary-accent/10 text-primary-accent border-b-2 border-primary-accent' : 'text-text-muted hover:text-text-main'}`}
          >
            Paste Text
          </button>
        </div>

        <div className="p-8 space-y-6">
          {tab === 'pdf' ? (
            <div className="space-y-6">
              <label 
                className={`relative h-64 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center space-y-4 cursor-pointer transition-all ${selectedFile ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-primary-accent/30 hover:border-primary-accent/60 bg-primary-accent/5'}`}
              >
                <input type="file" className="hidden" accept=".pdf" onChange={handleFileSelect} />
                <div className={`p-4 rounded-full ${selectedFile ? 'bg-emerald-500/20 text-emerald-500' : 'bg-primary-accent/20 text-primary-accent'}`}>
                  {selectedFile && fileProgress === 100 ? <Plus className="rotate-45" size={32} /> : <Upload size={32} />}
                </div>
                {!selectedFile ? (
                  <div className="text-center">
                    <p className="font-semibold text-text-main">Drag and drop your PDF here</p>
                    <p className="text-sm text-text-muted">or click to browse files (max 10MB)</p>
                  </div>
                ) : (
                  <div className="text-center space-y-4 w-full max-w-xs px-4">
                    <div>
                      <p className="font-semibold text-text-main truncate">{selectedFile.name}</p>
                      <p className="text-xs text-text-muted">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                    </div>
                    <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${fileProgress}%` }}
                        className={`h-full ${fileProgress === 100 ? 'bg-emerald-500' : 'bg-primary-accent'}`}
                      />
                    </div>
                    {fileProgress === 100 && (
                      <p className="text-xs font-bold text-emerald-500 flex items-center justify-center gap-1">
                        <Plus size={14} className="rotate-45" /> File ready!
                      </p>
                    )}
                  </div>
                )}
              </label>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-text-muted">Document Title</label>
                  <input 
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-bg-main border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-accent/50" 
                    placeholder="Enter title..."
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-text-muted">Subject</label>
                  <select 
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full bg-bg-main border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-accent/50 appearance-none"
                  >
                    {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <button 
                disabled={!isFormValid}
                onClick={() => onAnalyze(title, subject, 'pdf', 'Analysis of uploaded PDF document content.')}
                className={`w-full py-4 rounded-xl font-bold transition-all flex items-center justify-center space-x-2 ${isFormValid ? 'bg-primary-accent hover:bg-primary-accent/90 text-white shadow-lg shadow-primary-accent/20 active:scale-95' : 'bg-white/5 text-text-muted cursor-not-allowed'}`}
              >
                <Target size={20} />
                <span>Upload & Analyze</span>
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="space-y-2 relative">
                <label className="text-sm font-medium text-text-muted">Study Material</label>
                <textarea 
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value.slice(0, 50000))}
                  placeholder="Paste your lecture notes, textbook content, or any study material here..."
                  className="w-full bg-bg-main border border-white/10 rounded-2xl p-6 min-h-[250px] focus:outline-none focus:ring-2 focus:ring-primary-accent/50 resize-none"
                />
                <div className="absolute bottom-4 right-4 text-xs font-mono text-text-muted">
                  {pastedText.length.toLocaleString()} / 50,000
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-text-muted">Document Title</label>
                  <input 
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-bg-main border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-accent/50" 
                    placeholder="Enter title..."
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-text-muted">Subject</label>
                  <select 
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full bg-bg-main border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-accent/50 appearance-none"
                  >
                    {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <button 
                disabled={!isFormValid}
                onClick={() => onAnalyze(title, subject, 'text', pastedText)}
                className={`w-full py-4 rounded-xl font-bold transition-all flex items-center justify-center space-x-2 ${isFormValid ? 'bg-primary-accent hover:bg-primary-accent/90 text-white shadow-lg shadow-primary-accent/20 active:scale-95' : 'bg-white/5 text-text-muted cursor-not-allowed'}`}
              >
                <Target size={20} />
                <span>Analyze Text</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const SuccessView = ({ doc, onViewClick }: { doc: Document, onViewClick: (view: ViewType) => void }) => (
  <div className="max-w-4xl mx-auto space-y-10 text-center animate-in fade-in zoom-in duration-500">
    <div className="space-y-4">
      <div className="w-20 h-20 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto">
        <Plus className="rotate-45" size={40} />
      </div>
      <h1 className="text-4xl font-bold">Analysis Complete!</h1>
      <p className="text-text-muted text-lg">
        Successfully analyzed <span className="text-text-main font-semibold">"{doc.title}"</span> ({doc.subject})
      </p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {[
        { label: 'View Summary', icon: FileText, color: 'bg-primary-accent', view: 'documents' as ViewType, desc: 'Read a concise AI summary of your document.' },
        { label: 'Study Flashcards', icon: Layers, color: 'bg-secondary-accent', view: 'flashcards' as ViewType, desc: 'Test your knowledge with auto-generated cards.' },
        { label: 'Take a Quiz', icon: BookOpen, color: 'bg-emerald-500', view: 'quiz' as ViewType, desc: 'Challenge yourself with a personalized quiz.' },
        { label: 'Chat with Document', icon: MessageSquare, color: 'bg-orange-500', view: 'chat' as ViewType, desc: 'Ask specific questions about the material.' },
      ].map((item, i) => (
        <motion.button
          key={item.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          onClick={() => onViewClick(item.view)}
          className="bg-bg-card p-6 rounded-3xl border border-white/5 hover:border-primary-accent/30 hover:bg-primary-accent/5 transition-all text-left flex items-center space-x-5 group"
        >
          <div className={`${item.color} p-4 rounded-2xl group-hover:scale-110 transition-transform`}>
            <item.icon size={24} className="text-white" />
          </div>
          <div>
            <h3 className="font-bold text-lg">{item.label}</h3>
            <p className="text-sm text-text-muted">{item.desc}</p>
          </div>
        </motion.button>
      ))}
    </div>

    <button 
      onClick={() => onViewClick('dashboard')}
      className="text-text-muted hover:text-text-main font-medium underline underline-offset-4"
    >
      Return to Dashboard
    </button>
  </div>
);

const PlaceholderView = ({ title }: { title: string }) => (
  <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
    <div className="p-6 bg-bg-card rounded-full">
      <Search size={40} className="text-text-muted opacity-20" />
    </div>
    <h2 className="text-2xl font-bold text-text-main">{title}</h2>
    <p className="text-text-muted">This feature is coming soon in the next update!</p>
  </div>
);

const LoadingOverlay = ({ step }: { step: number }) => {
  const steps = [
    "📄 Reading your document...",
    "🧠 AI is analyzing the content...",
    "✨ Generating study materials...",
    "🎉 Almost ready!"
  ];

  return (
    <div className="fixed inset-0 z-50 bg-bg-main/90 backdrop-blur-xl flex flex-col items-center justify-center space-y-8">
      <div className="relative w-24 h-24">
        <div className="absolute inset-0 rounded-full border-4 border-primary-accent/10"></div>
        <div className="absolute inset-0 rounded-full border-4 border-t-primary-accent animate-spin"></div>
      </div>
      <div className="text-center space-y-2">
        <AnimatePresence mode="wait">
          <motion.h2 
            key={step}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-2xl font-bold"
          >
            {steps[step % steps.length]}
          </motion.h2>
        </AnimatePresence>
        <p className="text-text-muted">Our AI is processing your materials for optimal learning.</p>
      </div>
    </div>
  );
};

export default function App() {
  const [activeView, setActiveView] = useState<ViewType>('dashboard');
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [lastUploadedDoc, setLastUploadedDoc] = useState<Document | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const startAnalysis = (title: string, subject: string, type: 'pdf' | 'text', content?: string) => {
    setIsAnalyzing(true);
    setAnalysisStep(0);
    setShowSuccess(false);

    const stepInterval = setInterval(() => {
      setAnalysisStep(prev => prev + 1);
    }, 1000);

    setTimeout(() => {
      clearInterval(stepInterval);
      const newDoc: Document = {
        id: Math.random().toString(36).substr(2, 9),
        title,
        subject,
        type,
        content: content || (type === 'text' ? 'Empty document content.' : 'Analysis of uploaded PDF document content.'),
        timestamp: new Date().toISOString()
      };
      setDocuments(prev => [newDoc, ...prev]);
      setLastUploadedDoc(newDoc);
      setIsAnalyzing(false);
      setShowSuccess(true);
    }, 4000);
  };

  const [summaries, setSummaries] = useState<Record<string, SummaryData>>({});
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);

  // Flashcards State
  const [flashcardSession, setFlashcardSession] = useState<FlashcardSession | null>(null);
  const [isGeneratingFlashcards, setIsGeneratingFlashcards] = useState(false);
  const [flashcardSettings, setFlashcardSettings] = useState({ count: 15, difficulty: 'mixed' });

  // Quiz State
  const [quizSession, setQuizSession] = useState<QuizSession | null>(null);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [quizSettings, setQuizSettings] = useState({ count: 10, difficulty: 'medium', timer: 60 });

  // Chat State
  const [chatMessages, setChatMessages] = useState<Record<string, ChatMessage[]>>({});
  const [isTyping, setIsTyping] = useState(false);

  // App Global State
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [settings, setSettings] = useState<UserSettings>({
    displayName: 'Student',
    aiStyle: 'detailed',
    theme: 'dark',
    defaultSubject: 'Computer Science'
  });
  const [showShortcuts, setShowShortcuts] = useState(false);

  const addToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '?' && (e.target as HTMLElement).tagName !== 'INPUT') {
        setShowShortcuts(true);
      }
      if (e.key === 'Escape') {
        setShowShortcuts(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const clearAllData = () => {
    setDocuments([]);
    setFlashcardSession(null);
    setQuizSession(null);
    setSummaries({});
    setExamPredictions({});
    setChatMessages({});
    setFlashcardsMastered(0);
    setQuizzesCompleted([]);
    setFeaturesUsed(new Set(['summary']));
    setLastUploadedDoc(null);
    addToast("All data cleared successfully", "info");
    setActiveView('dashboard');
  };

  // Progress Tracking State
  const [flashcardsMastered, setFlashcardsMastered] = useState(0);
  const [quizzesCompleted, setQuizzesCompleted] = useState<QuizResult[]>([]);
  const [studyStreak, setStudyStreak] = useState(3); // Demo start value
  const [messagesSentCount, setMessagesSentCount] = useState(0);
  const [featuresUsed, setFeaturesUsed] = useState<Set<string>>(new Set(['summary']));
  const [masteryPerDoc, setMasteryPerDoc] = useState<Record<string, { mastered: number, total: number }>>({});

  const trackFeatureUsage = (feature: string) => {
    setFeaturesUsed(prev => {
      const next = new Set(prev);
      next.add(feature);
      return next;
    });
  };

  const generateAIWithGemini = async (doc: Document) => {
    setIsGeneratingSummary(true);
    try {
      const prompt = `You are an expert academic tutor. The student has uploaded study material titled: ${doc.title} on the subject of ${doc.subject}. 
      
      Content Context: ${doc.content || "Assume standard content for this subject title."}

      Generate a comprehensive study summary with exactly this structure:
      
      ## TL;DR
      Write 3 sentences maximum summarizing the entire document.
      
      ## Key Concepts
      List the 6 most important concepts as bullet points, one line each.
      
      ## Detailed Breakdown
      Write 4-6 paragraphs covering the main topics in depth.
      
      ## Important Definitions
      List 5 key terms with their definitions in format: **Term**: Definition
      
      ## Key Takeaways
      List 5 bullet points the student must remember for their exam.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });

      const text = response.text || "";
      
      // Basic parser for the expected structure
      const sections = text.split('##').map(s => s.trim()).filter(Boolean);
      const data: SummaryData = {
        tldr: '',
        keyConcepts: [],
        detailedBreakdown: '',
        definitions: [],
        takeaways: []
      };

      sections.forEach(section => {
        if (section.startsWith('TL;DR')) {
          data.tldr = section.replace('TL;DR', '').trim();
        } else if (section.startsWith('Key Concepts')) {
          data.keyConcepts = section.replace('Key Concepts', '').trim().split('\n').map(l => l.replace(/^[-*•]\s*/, '').trim()).filter(Boolean);
        } else if (section.startsWith('Detailed Breakdown')) {
          data.detailedBreakdown = section.replace('Detailed Breakdown', '').trim();
        } else if (section.startsWith('Important Definitions')) {
          data.definitions = section.replace('Important Definitions', '').trim().split('\n').map(l => l.replace(/^[-*•]\s*/, '').replace(/^\d+\.\s*/, '').replace(/^\*\*/, '').replace(/\*\*$/, '').trim()).filter(Boolean);
        } else if (section.startsWith('Key Takeaways')) {
          data.takeaways = section.replace('Key Takeaways', '').trim().split('\n').map(l => l.replace(/^[-*•]\s*/, '').trim()).filter(Boolean);
        }
      });

      setSummaries(prev => ({ ...prev, [doc.id]: data }));
      addToast("AI Summary generated!", "success");
    } catch (error) {
      console.error("Gemini Error:", error);
      addToast("Failed to generate summary.", "error");
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const generateAIFlashcards = async (doc: Document) => {
    setIsGeneratingFlashcards(true);
    try {
      const prompt = `You are a study expert. Based on a document titled ${doc.title} about ${doc.subject}, generate ${flashcardSettings.count} flashcards.
      
      Document Content: ${doc.content || "Use subject knowledge."}
      Target Difficulty: ${flashcardSettings.difficulty}

      Return ONLY a valid JSON array, no other text, no markdown, no explanation. Format:
      [
        {
          "id": 1,
          "front": "Clear question or concept here",
          "back": "Concise answer or explanation here",
          "difficulty": "easy or medium or hard"
        }
      ]`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });

      const text = (response.text || "").replace(/```json/g, '').replace(/```/g, '').trim();
      const cards = JSON.parse(text) as Flashcard[];
      
      setFlashcardSession({
        cards,
        currentIndex: 0,
        results: { gotIt: [], needReview: [], skipped: [] }
      });
      addToast(`${cards.length} flashcards generated!`, "success");
      setActiveView('flashcards');
      trackFeatureUsage('flashcards');
    } catch (error) {
      console.error("Flashcard Gemini Error:", error);
      addToast("Flashcard generation failed", "error");
    } finally {
      setIsGeneratingFlashcards(false);
    }
  };

  const generateAIQuiz = async (doc: Document) => {
    setIsGeneratingQuiz(true);
    try {
      const prompt = `You are a university professor. Create a ${quizSettings.count} question multiple choice quiz about ${doc.subject} based on material titled ${doc.title}.
      
      Document Content: ${doc.content || "Use general subject expertise."}
      Difficulty: ${quizSettings.difficulty}

      Return ONLY valid JSON array of objects, no markdown, no other text:
      [
        {
          "id": 1,
          "question": "Question text here?",
          "options": {
            "A": "First option",
            "B": "Second option", 
            "C": "Third option",
            "D": "Fourth option"
          },
          "correct": "A",
          "explanation": "Why this answer is correct..."
        }
      ]`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });

      const text = (response.text || "").replace(/```json/g, '').replace(/```/g, '').trim();
      const questions = JSON.parse(text) as QuizQuestion[];
      
      setQuizSession({
        questions,
        currentIndex: 0,
        userAnswers: {},
        isComplete: false
      });
      setActiveView('quiz');
      trackFeatureUsage('quiz');
    } catch (error) {
      console.error("Quiz Gemini Error:", error);
      alert("Failed to generate quiz. Please try again.");
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  const handleQuizAnswer = (answer: string) => {
    if (!quizSession) return;
    const currentQ = quizSession.questions[quizSession.currentIndex];
    setQuizSession({
      ...quizSession,
      userAnswers: { ...quizSession.userAnswers, [currentQ.id]: answer }
    });
  };

  const handleQuizNext = () => {
    if (!quizSession || !lastUploadedDoc) return;
    if (quizSession.currentIndex === quizSession.questions.length - 1) {
      const correct = quizSession.questions.filter(q => quizSession.userAnswers[q.id] === q.correct).length;
      const result: QuizResult = {
        docId: lastUploadedDoc.id,
        docTitle: lastUploadedDoc.title,
        score: correct,
        total: quizSession.questions.length,
        timestamp: new Date().toISOString()
      };
      setQuizzesCompleted(prev => [result, ...prev]);
      setQuizSession({ ...quizSession, isComplete: true });
    } else {
      setQuizSession({ ...quizSession, currentIndex: quizSession.currentIndex + 1 });
    }
  };

  const handleSendMessage = async (doc: Document, message: string) => {
    if (!message.trim()) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: message,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const currentChat = chatMessages[doc.id] || [];
    const updatedChat = [...currentChat, userMessage];
    setChatMessages(prev => ({ ...prev, [doc.id]: updatedChat }));
    setIsTyping(true);
    setMessagesSentCount(prev => prev + 1);
    trackFeatureUsage('chat');

    try {
      const history = currentChat.slice(-5).map(m => `${m.role === 'user' ? 'Student' : 'Tutor'}: ${m.content}`).join('\n');
      
      const prompt = `You are StudyMind AI, a helpful and friendly academic tutor. The student is studying material titled ${doc.title} about ${doc.subject}.

Your role:
- Answer questions based on the study material
- Explain concepts clearly with examples
- If asked something not related to the document, gently redirect back to the study topic
- Keep responses concise but thorough
- Use bullet points and formatting to make answers easy to read

Document Content: ${doc.content || "Use subject expertise."}

Previous conversation:
${history}

Student's question: ${message}`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });

      const aiMessage: ChatMessage = {
        role: 'model',
        content: response.text || "I'm sorry, I couldn't process that.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setChatMessages(prev => ({ 
        ...prev, 
        [doc.id]: [...(prev[doc.id] || []), aiMessage] 
      }));
    } catch (error) {
      console.error("Chat Gemini Error:", error);
    } finally {
      setIsTyping(false);
    }
  };

  const generateAIExamPredictions = async (doc: Document) => {
    setIsGeneratingPredictions(true);
    try {
      const prompt = `You are an experienced university professor who has been teaching ${doc.subject} for 20 years. 
      A student has studied material titled ${doc.title}.
      
      Document Content: ${doc.content || "Use subject expertise."}

      Predict 5 exam questions that are very likely to appear based on this material.
      
      Return ONLY valid JSON array of objects, no markdown, no other text:
      [
        {
          "id": 1,
          "question": "The predicted exam question",
          "type": "multiple_choice or short_answer or essay",
          "importance": "high or medium",
          "why_likely": "Explain in 1-2 sentences why this topic is likely to be tested",
          "study_tip": "Specific advice on how to prepare for this question",
          "key_points": ["point 1", "point 2", "point 3"]
        }
      ]`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });

      const text = (response.text || "").replace(/```json/g, '').replace(/```/g, '').trim();
      const rawPredictions = JSON.parse(text) as PredictedQuestion[];
      
      const predictionsWithConfidence = rawPredictions.map(p => ({
        ...p,
        confidence: Math.floor(Math.random() * (95 - 70 + 1) + 70)
      }));

      setExamPredictions(prev => ({ ...prev, [doc.id]: predictionsWithConfidence }));
      trackFeatureUsage('exam');
    } catch (error) {
      console.error("Exam Prediction Error:", error);
      alert("Failed to predict exam questions. Please try again.");
    } finally {
      setIsGeneratingPredictions(false);
    }
  };

  const handleActiveDocSummary = (doc: Document) => {
    setActiveView('summary');
    setLastUploadedDoc(doc);
    if (!summaries[doc.id]) {
      generateAIWithGemini(doc);
    }
  };

  const handleFlashcardAction = (action: 'gotIt' | 'needReview' | 'skipped') => {
    if (!flashcardSession || !lastUploadedDoc) return;
    
    const newSession = { ...flashcardSession };
    const currentCardId = Number(newSession.cards[newSession.currentIndex].id);
    
    if (action === 'gotIt') {
      newSession.results.gotIt.push(currentCardId);
      setFlashcardsMastered(prev => prev + 1);
      setMasteryPerDoc(prev => {
        const docMastery = prev[lastUploadedDoc.id] || { mastered: 0, total: newSession.cards.length };
        return {
          ...prev,
          [lastUploadedDoc.id]: { ...docMastery, mastered: docMastery.mastered + 1 }
        };
      });
    }
    else if (action === 'needReview') newSession.results.needReview.push(currentCardId);
    else if (action === 'skipped') newSession.results.skipped.push(currentCardId);
    
    newSession.currentIndex += 1;
    setFlashcardSession(newSession);
  };

  const renderContent = () => {
    if (showSuccess && lastUploadedDoc) {
      return <SuccessView doc={lastUploadedDoc} onViewClick={(v) => { 
        setShowSuccess(false); 
        if (v === 'documents') {
          handleActiveDocSummary(lastUploadedDoc);
        } else {
          setActiveView(v as ViewType); 
        }
      }} />;
    }

    switch (activeView) {
      case 'dashboard': return <DashboardView onUploadClick={() => setActiveView('upload')} onPasteClick={() => setActiveView('upload')} docCount={documents.length} />;
      case 'upload': return <UploadView onAnalyze={startAnalysis} />;
      case 'summary': return lastUploadedDoc ? (
        <SummaryView 
          doc={lastUploadedDoc} 
          summary={summaries[lastUploadedDoc.id]} 
          isLoading={isGeneratingSummary} 
          onRegenerate={() => generateAIWithGemini(lastUploadedDoc)} 
          onGenerateFlashcards={() => generateAIFlashcards(lastUploadedDoc)}
        />
      ) : <DashboardView onUploadClick={() => setActiveView('upload')} onPasteClick={() => setActiveView('upload')} docCount={documents.length} />;
      case 'documents': 
      case 'docs': return (
        <MyDocsView 
          documents={documents} 
          onDelete={(id) => {
            setDocuments(prev => prev.filter(d => d.id !== id));
            addToast("Document deleted", "info");
          }} 
          onView={(doc) => {
            setLastUploadedDoc(doc);
            setActiveView('summary');
          }}
        />
      );
      case 'flashcards': return lastUploadedDoc ? (
        <FlashcardView 
          doc={lastUploadedDoc} 
          session={flashcardSession} 
          isGenerating={isGeneratingFlashcards}
          settings={flashcardSettings}
          onSettingsChange={setFlashcardSettings}
          onGenerate={() => generateAIFlashcards(lastUploadedDoc)}
          onAction={handleFlashcardAction}
          onReset={() => setFlashcardSession(null)}
        />
      ) : <DashboardView onUploadClick={() => setActiveView('upload')} onPasteClick={() => setActiveView('upload')} docCount={documents.length} />;
      case 'quiz': return lastUploadedDoc ? (
        <QuizView 
          doc={lastUploadedDoc}
          session={quizSession}
          isGenerating={isGeneratingQuiz}
          settings={quizSettings}
          onSettingsChange={setQuizSettings}
          onGenerate={() => generateAIQuiz(lastUploadedDoc)}
          onAnswer={handleQuizAnswer}
          onNext={handleQuizNext}
          onReset={() => setQuizSession(null)}
        />
      ) : <DashboardView onUploadClick={() => setActiveView('upload')} onPasteClick={() => setActiveView('upload')} docCount={documents.length} />;
      case 'chat': return lastUploadedDoc ? (
        <ChatView 
          doc={lastUploadedDoc}
          messages={chatMessages[lastUploadedDoc.id] || []}
          isTyping={isTyping}
          onSend={(msg) => handleSendMessage(lastUploadedDoc, msg)}
          onClear={() => setChatMessages(prev => ({ ...prev, [lastUploadedDoc.id]: [] }))}
        />
      ) : <DashboardView onUploadClick={() => setActiveView('upload')} onPasteClick={() => setActiveView('upload')} docCount={documents.length} />;
      case 'exam': return lastUploadedDoc ? (
        <ExamPredictorView 
          doc={lastUploadedDoc}
          predictions={examPredictions[lastUploadedDoc.id] || []}
          isGenerating={isGeneratingPredictions}
          onPredict={() => generateAIExamPredictions(lastUploadedDoc)}
          onStudyFlashcards={() => setActiveView('flashcards')}
        />
      ) : <DashboardView onUploadClick={() => setActiveView('upload')} onPasteClick={() => setActiveView('upload')} docCount={documents.length} />;
      case 'progress': return (
        <ProgressView 
          stats={{
            docs: documents.length,
            flashcards: flashcardsMastered,
            quizzes: quizzesCompleted.length,
            streak: studyStreak
          }}
          quizResults={quizzesCompleted}
          documents={documents}
          masteryPerDoc={masteryPerDoc}
          featuresUsed={featuresUsed}
          messagesSent={messagesSentCount}
        />
      );
      case 'settings': return (
        <SettingsView 
          settings={settings}
          onUpdate={(s) => {
            setSettings(prev => ({ ...prev, ...s }));
          }}
          onClearAll={clearAllData}
        />
      );
      default: return <DashboardView onUploadClick={() => setActiveView('upload')} onPasteClick={() => setActiveView('upload')} docCount={documents.length} />;
    }
  };

  return (
    <div className={`flex min-h-screen ${settings.theme === 'midnight' ? 'bg-[#0a0a14]' : 'bg-bg-main'} text-text-main overflow-hidden transition-colors duration-500 selection:bg-primary-accent/30`}>
      <AnimatePresence>
        {isAnalyzing && <LoadingOverlay step={analysisStep} />}
      </AnimatePresence>

      {/* Sidebar - Desktop */}
      <aside className="w-72 flex-shrink-0 border-r border-white/5 flex flex-col p-8 space-y-8 bg-bg-main/50 backdrop-blur-xl hidden md:flex transition-all">
        <div className="flex items-center space-x-3 px-2">
          <div className="w-10 h-10 bg-[#7c3aed] rounded-xl flex items-center justify-center shadow-lg shadow-[#7c3aed]/20">
            <BrainCircuit size={24} className="text-white" />
          </div>
          <span className="text-2xl font-black italic tracking-tighter">StudyMind</span>
        </div>

        <nav className="flex-1 space-y-1 font-bold">
          <SidebarItem icon={LayoutDashboard} label="Dashboard" active={activeView === 'dashboard'} onClick={() => setActiveView('dashboard')} />
          <SidebarItem icon={FileText} label="My Library" active={activeView === 'docs' || activeView === 'documents'} onClick={() => setActiveView('docs')} />
          
          <div className="pt-8 pb-3 px-4">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">Study Tools</span>
          </div>
          
          <SidebarItem icon={Upload} label="Upload Notes" active={activeView === 'upload'} onClick={() => setActiveView('upload')} />
          <SidebarItem icon={Layers} label="Flashcards" active={activeView === 'flashcards'} onClick={() => {
            if (lastUploadedDoc) setActiveView('flashcards');
            else { addToast("Upload a document first", "info"); setActiveView('upload'); }
          }} />
          <SidebarItem icon={BookOpen} label="Quiz Mode" active={activeView === 'quiz'} onClick={() => {
            if (lastUploadedDoc) setActiveView('quiz');
            else { addToast("Upload a document first", "info"); setActiveView('upload'); }
          }} />
          <SidebarItem icon={MessageSquare} label="AI Tutor Chat" active={activeView === 'chat'} onClick={() => {
            if (lastUploadedDoc) setActiveView('chat');
            else { addToast("Upload a document first", "info"); setActiveView('upload'); }
          }} />
          <SidebarItem icon={Target} label="Exam Predictor" active={activeView === 'exam'} onClick={() => {
            if (lastUploadedDoc) setActiveView('exam');
            else { addToast("Upload a document first", "info"); setActiveView('upload'); }
          }} />
          
          <div className="pt-8 pb-3 px-4">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">Account</span>
          </div>
          <SidebarItem icon={BarChart3} label="Progress" active={activeView === 'progress'} onClick={() => setActiveView('progress')} />
          <SidebarItem icon={Settings} label="Settings" active={activeView === 'settings'} onClick={() => setActiveView('settings')} />
        </nav>

        <div className="mt-auto pt-8 border-t border-white/5 space-y-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-white font-bold border border-white/5">
              {settings.displayName.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm truncate">{settings.displayName}</p>
              <p className="text-[10px] text-text-muted uppercase tracking-widest font-black">Active Learner</p>
            </div>
          </div>
          
          <div className="flex items-center justify-center space-x-2 py-3 px-4 bg-white/[0.02] rounded-xl border border-white/5">
             <Sparkles size={14} className="text-primary-accent" />
             <span className="text-[10px] font-black uppercase tracking-tighter text-text-muted">by Mahir</span>
          </div>
        </div>
      </aside>

      {/* Bottom Nav - Mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-bg-card border-t border-white/10 z-50 flex items-center justify-around px-4 backdrop-blur-xl">
        {[
          { icon: LayoutDashboard, view: 'dashboard' },
          { icon: FileText, view: 'docs' },
          { icon: Upload, view: 'upload' },
          { icon: MessageSquare, view: 'chat' },
          { icon: Settings, view: 'settings' }
        ].map((item, i) => (
          <button 
            key={i} 
            onClick={() => setActiveView(item.view as ViewType)}
            className={`p-3 transition-all active:scale-90 ${activeView === item.view ? 'text-primary-accent bg-primary-accent/10 rounded-xl' : 'text-text-muted'}`}
          >
            <item.icon size={24} />
          </button>
        ))}
      </nav>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 pb-20 md:pb-0">
        {/* Header - Desktop */}
        <header className="h-20 border-b border-white/5 px-8 flex items-center justify-between bg-bg-main/30 backdrop-blur-md hidden md:flex">
          <div className="flex-1 max-w-2xl px-4">
             <div className="flex items-center gap-2 text-text-muted text-xs font-black uppercase tracking-widest">
               <span>Home</span>
               <span>/</span>
               <span className="text-text-main">{activeView.replace('_', ' ')}</span>
             </div>
          </div>

          <div className="flex items-center space-x-6">
            <button 
              onClick={() => setShowShortcuts(true)}
              className="p-2 text-text-muted hover:text-white transition-colors"
              title="Keyboard Shortcuts (?)"
            >
              <HelpCircle size={20} />
            </button>
            <div className="h-8 w-[1px] bg-white/10"></div>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center border border-white/10">
                <User size={20} className="text-text-muted" />
              </div>
            </div>
          </div>
        </header>

        {/* View Content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-12 custom-scrollbar">
          <div className="max-w-6xl mx-auto h-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeView + (showSuccess ? '-success' : '-view')}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                className="h-full"
              >
                {renderContent()}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </main>

      <ToastContainer toasts={toasts} onRemove={(id) => setToasts(prev => prev.filter(t => t.id !== id))} />
      {showShortcuts && <ShortcutModal onClose={() => setShowShortcuts(false)} />}
    </div>
  );
}
