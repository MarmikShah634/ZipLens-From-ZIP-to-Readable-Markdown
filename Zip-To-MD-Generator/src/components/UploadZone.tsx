import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, FileArchive, Loader2 } from "lucide-react";

interface UploadZoneProps {
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  loading: boolean;
}

export default function UploadZone({ onUpload, loading }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0 && inputRef.current) {
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(files[0]);
      inputRef.current.files = dataTransfer.files;
      inputRef.current.dispatchEvent(new Event("change", { bubbles: true }));
    }
  };

  const handleClick = () => {
    if (!loading) {
      inputRef.current?.click();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 40, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
      className="flex flex-col items-center justify-center h-full"
    >
      <motion.div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        onClick={handleClick}
        animate={{
          scale: isDragging ? 1.02 : isHovering ? 1.01 : 1,
          borderColor: isDragging
            ? "rgb(129, 140, 248)"
            : isHovering
            ? "rgb(99, 102, 241)"
            : "rgb(75, 85, 99)",
        }}
        transition={{ duration: 0.2 }}
        className={`
          relative w-full max-w-md aspect-square
          rounded-2xl border-2 border-dashed
          bg-gradient-to-br from-gray-900/80 to-gray-800/60
          backdrop-blur-sm
          flex flex-col items-center justify-center
          cursor-pointer
          overflow-hidden
          group
        `}
      >
        {/* Animated background glow */}
        <motion.div
          animate={{
            opacity: isDragging ? 0.3 : isHovering ? 0.15 : 0,
          }}
          transition={{ duration: 0.3 }}
          className="absolute inset-0 bg-gradient-to-br from-indigo-600/30 via-purple-600/20 to-transparent"
        />

        {/* Pulsing ring effect when dragging */}
        <AnimatePresence>
          {isDragging && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              className="absolute inset-4 rounded-xl border-2 border-indigo-400/50"
            />
          )}
        </AnimatePresence>

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center text-center px-6">
          <motion.div
            animate={{
              y: isDragging ? -8 : 0,
              scale: isDragging ? 1.1 : 1,
            }}
            transition={{ duration: 0.2 }}
            className="mb-6"
          >
            {loading ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <Loader2 className="w-16 h-16 text-indigo-400" />
              </motion.div>
            ) : isDragging ? (
              <FileArchive className="w-16 h-16 text-indigo-400" />
            ) : (
              <Upload className="w-16 h-16 text-gray-500 group-hover:text-indigo-400 transition-colors duration-300" />
            )}
          </motion.div>

          <motion.h3
            animate={{
              color: isDragging
                ? "rgb(129, 140, 248)"
                : isHovering
                ? "rgb(199, 210, 254)"
                : "rgb(209, 213, 219)",
            }}
            className="text-xl font-semibold mb-2"
          >
            {loading
              ? "Processing your ZIP..."
              : isDragging
              ? "Drop it here!"
              : "Drop your ZIP file here"}
          </motion.h3>

          <p className="text-gray-500 text-sm mb-6">
            {loading ? "Analyzing file structure" : "or click to browse"}
          </p>

          {!loading && (
            <motion.div
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-shadow duration-300"
            >
              <span className="flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Select ZIP File
              </span>
            </motion.div>
          )}
        </div>

        <input
          ref={inputRef}
          type="file"
          accept=".zip"
          className="hidden"
          onChange={onUpload}
          disabled={loading}
        />
      </motion.div>

      {/* Bottom trust indicator */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="text-center text-xs text-gray-600 mt-6 max-w-xs"
      >
        Supports ZIP files up to 50MB • Your files are processed locally and
        never stored
      </motion.p>
    </motion.div>
  );
}
