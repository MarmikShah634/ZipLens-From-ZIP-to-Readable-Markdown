import { motion } from "framer-motion";
import { Shield, Zap, FileText } from "lucide-react";
import type { Variants } from "framer-motion";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, x: -30 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] },
  },
};

const benefits = [
  {
    icon: FileText,
    title: "Crystal Clear Output",
    description: "Structured Markdown preserving your folder hierarchy",
  },
  {
    icon: Zap,
    title: "Instant Processing",
    description: "No extraction needed — we read directly from memory",
  },
  {
    icon: Shield,
    title: "Privacy First",
    description: "Files stay temporary. Nothing stored permanently",
  },
];

export default function HeroSection() {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="flex flex-col justify-center h-full"
    >
      {/* Logo & Title */}
      <motion.div variants={itemVariants} className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-4xl">📦</span>
          <h1 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-indigo-400 via-purple-400 to-purple-500 bg-clip-text text-transparent">
            ZipLens
          </h1>
        </div>
        <p className="text-xl md:text-2xl text-gray-300 font-medium leading-relaxed">
          Transform any ZIP file into
          <span className="text-indigo-400"> beautiful, readable Markdown</span>
        </p>
      </motion.div>

      {/* Value Proposition */}
      <motion.p
        variants={itemVariants}
        className="text-gray-400 text-base md:text-lg mb-8 max-w-md leading-relaxed"
      >
        Stop copy-pasting files into AI prompts. Upload your ZIP and get a
        clean, structured Markdown file — perfect for sharing, documentation, or
        feeding into your favorite AI assistant.
      </motion.p>

      {/* Benefits */}
      <motion.div variants={itemVariants} className="space-y-4 mb-8">
        {benefits.map((benefit, index) => (
          <motion.div
            key={index}
            variants={itemVariants}
            className="flex items-start gap-4 group"
          >
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-600/20 to-purple-600/20 border border-indigo-500/30 flex items-center justify-center group-hover:border-indigo-400/50 transition-colors duration-300">
              <benefit.icon className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-gray-200 font-semibold text-sm md:text-base">
                {benefit.title}
              </h3>
              <p className="text-gray-500 text-sm">{benefit.description}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Trust Badge */}
      <motion.div
        variants={itemVariants}
        className="flex items-center gap-2 text-gray-500 text-sm"
      >
        <Shield className="w-4 h-4 text-emerald-500" />
        <span>
          100% client-side processing •{" "}
          <span className="text-emerald-500/80">No data stored</span>
        </span>
      </motion.div>
    </motion.div>
  );
}
