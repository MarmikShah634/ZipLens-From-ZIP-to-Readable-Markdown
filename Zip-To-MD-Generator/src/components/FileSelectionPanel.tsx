import { motion } from "framer-motion";
import type { Variants } from "framer-motion";
import { FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import { Download, ArrowLeft, Loader2 } from "lucide-react";
import FileTree from "./FileTree";

interface FileSelectionPanelProps {
  files: string[];
  selected: string[];
  setSelected: (files: string[]) => void;
  onGenerate: () => void;
  onBack: () => void;
  loading: boolean;
  onSelectAll: () => void;
  onDeselectAll: () => void;
}

const containerVariants: Variants = {
  hidden: { opacity: 0, x: 40 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] },
  },
};

export default function FileSelectionPanel({
  files,
  selected,
  setSelected,
  onGenerate,
  onBack,
  loading,
  onSelectAll,
  onDeselectAll,
}: FileSelectionPanelProps) {
  const selectedCount = selected.filter((s) =>
    files.some((f) => f === s && !f.endsWith("/"))
  ).length;
  const totalFiles = files.filter((f) => !f.endsWith("/")).length;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="flex flex-col h-full"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onBack}
          className="flex items-center gap-2 text-gray-400 hover:text-gray-200 transition-colors duration-200"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Upload different file</span>
        </motion.button>

        <div className="text-sm text-gray-500">
          <span className="text-indigo-400 font-semibold">{selectedCount}</span>
          <span> of {totalFiles} files selected</span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 mb-4">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onSelectAll}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 text-sm font-medium hover:bg-emerald-600/30 hover:border-emerald-500/50 transition-all duration-200"
        >
          <FaCheckCircle className="w-3.5 h-3.5" /> Select All
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onDeselectAll}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600/20 border border-red-500/30 text-red-400 text-sm font-medium hover:bg-red-600/30 hover:border-red-500/50 transition-all duration-200"
        >
          <FaTimesCircle className="w-3.5 h-3.5" /> Deselect All
        </motion.button>
      </div>

      {/* File tree */}
      <div className="flex-1 overflow-hidden rounded-xl bg-gray-800/40 border border-gray-700/50 backdrop-blur-sm">
        <div className="h-full overflow-y-auto p-4 custom-scrollbar">
          <FileTree files={files} selected={selected} setSelected={setSelected} />
        </div>
      </div>

      {/* Generate button */}
      <div className="mt-6">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onGenerate}
          disabled={loading || selected.length === 0}
          className={`
            w-full py-4 rounded-xl font-bold text-lg
            flex items-center justify-center gap-3
            transition-all duration-300
            ${
              loading || selected.length === 0
                ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                : "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40"
            }
          `}
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Generating Markdown...
            </>
          ) : (
            <>
              <Download className="w-5 h-5" />
              Generate Markdown
            </>
          )}
        </motion.button>

        {selected.length === 0 && !loading && (
          <p className="text-center text-red-400/70 text-sm mt-2">
            Select at least one file to continue
          </p>
        )}
      </div>
    </motion.div>
  );
}
