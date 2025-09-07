import React, { useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import FileTree from "./components/FileTree";
import { motion } from "framer-motion";
import { FaCheckCircle, FaTimesCircle } from "react-icons/fa";

export default function App() {
  const [files, setFiles] = useState<string[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append("zipfile", file);

    try {
      setLoading(true);
      const res = await fetch("http://127.0.0.1:8000/list-files", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();

      const all = (data.files || []).map((f: any) => f.path).filter(Boolean);
      setFiles(all);
      setSelected(all);
      toast.success("Files loaded and all selected!");
    } catch {
      toast.error("Upload failed. Please try again.");
    } finally {
      setLoading(false);
      e.target.value = "";
    }
  };

  const handleGenerate = async () => {
    if (selected.length === 0) {
      toast.warning("Please select at least one file!");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("http://127.0.0.1:8000/generate-md", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ files: selected }),
      });

      if (!res.ok) throw new Error("Failed to generate");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "output.md";
      a.click();
      toast.success("Markdown generated successfully!");
    } catch {
      toast.error("Failed to generate markdown");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = () => {
    setSelected(files);
    toast.info("All files selected");
  };

  const handleDeselectAll = () => {
    setSelected([]);
    toast.info("All files deselected");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 text-gray-100 p-6">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="w-[800px] h-9/10 bg-gray-900/70 rounded-2xl shadow-2xl p-8 border border-gray-800 flex flex-col"
      >
        <motion.h1
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="text-4xl font-extrabold text-center mb-6 bg-gradient-to-r from-indigo-400 to-purple-500 bg-clip-text text-transparent"
        >
          📦 ZipLens
        </motion.h1>

        {!files.length && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex justify-center mb-6"
          >
            <label className="cursor-pointer px-8 py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-700 text-white font-semibold shadow-lg hover:shadow-purple-500/40 hover:scale-105 transition-all duration-300">
              {loading ? "Uploading..." : "Upload ZIP"}
              <input
                type="file"
                accept=".zip"
                className="hidden"
                onChange={handleUpload}
                disabled={loading}
              />
            </label>
          </motion.div>
        )}

        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col flex-1 p-4 rounded-xl bg-gray-800/60 border border-gray-700 shadow-inner max-h-130 overflow-scroll"
          >
            <div className="flex justify-end gap-4 mb-4">
              <button
                onClick={handleSelectAll}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold shadow-md hover:scale-105 hover:shadow-emerald-500/30 transition-all duration-300"
              >
                <FaCheckCircle /> Select All
              </button>
              <button
                onClick={handleDeselectAll}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-red-500 to-pink-600 text-white font-semibold shadow-md hover:scale-105 hover:shadow-pink-500/30 transition-all duration-300"
              >
                <FaTimesCircle /> Deselect All
              </button>
            </div>

            <div className="overflow-y-auto flex-1 border border-gray-700 rounded p-2">
              <FileTree files={files} selected={selected} setSelected={setSelected} />
            </div>

            <div className="flex justify-center mt-6">
              <button
                onClick={handleGenerate}
                disabled={loading}
                className="px-8 py-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold shadow-lg hover:shadow-emerald-500/40 hover:scale-105 transition-all duration-300 disabled:opacity-50"
              >
                {loading ? "Processing..." : "✨ Generate Markdown"}
              </button>
            </div>
          </motion.div>
        )}
      </motion.div>

      <ToastContainer position="bottom-right" theme="dark" />
    </div>
  );
}
