import React, { useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { motion, AnimatePresence } from "framer-motion";
import HeroSection from "./components/HeroSection";
import UploadZone from "./components/UploadZone";
import FileSelectionPanel from "./components/FileSelectionPanel";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000";

async function readError(res: Response): Promise<string> {
  try {
    const data = await res.json();
    return (
      data?.detail || data?.error || `Request failed with status ${res.status}`
    );
  } catch {
    return `Request failed with status ${res.status}`;
  }
}

export default function App() {
  const [files, setFiles] = useState<string[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append("zipfile", file);

    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/list-files`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error(await readError(res));
      }
      const data = await res.json();

      const all = (data.files || []).map((f: any) => f.path).filter(Boolean);
      setFiles(all);
      setSelected(all);
      setSessionId(data.session_id || null);
      toast.success("Files loaded and all selected!");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Upload failed. Please try again.";
      setFiles([]);
      setSelected([]);
      setSessionId(null);
      toast.error(message);
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
    if (!sessionId) {
      toast.error("Please upload a ZIP before generating.");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/generate-md`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ files: selected, session_id: sessionId }),
      });

      if (!res.ok) {
        throw new Error(await readError(res));
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "output.md";
      a.click();
      toast.success("Markdown generated successfully!");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to generate markdown";
      toast.error(message);
      if (message.toLowerCase().includes("session")) {
        setSessionId(null);
        setFiles([]);
        setSelected([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = () => {
    setSelected(files);
  };

  const handleDeselectAll = () => {
    setSelected([]);
  };

  const handleBack = () => {
    setFiles([]);
    setSelected([]);
    setSessionId(null);
  };

  const hasFiles = files.length > 0;

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 overflow-hidden">
      {/* Subtle background gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 pointer-events-none" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-900/10 via-transparent to-transparent pointer-events-none" />

      {/* Main content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-6 lg:p-12">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-6xl"
        >
          <AnimatePresence mode="wait">
            {!hasFiles ? (
              /* Landing / Upload State */
              <motion.div
                key="landing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.4 }}
                className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center min-h-[600px]"
              >
                {/* Left: Hero Section */}
                <div className="order-1 lg:order-1 mx-auto">
                  <HeroSection />
                </div>

                {/* Right: Upload Zone */}
                <div className="order-2 lg:order-2">
                  <UploadZone onUpload={handleUpload} loading={loading} />
                </div>
              </motion.div>
            ) : (
              /* File Selection State */
              <motion.div
                key="selection"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="grid grid-cols-1 lg:grid-cols-1 gap-8 lg:gap-12 min-h-[600px]"
              >
                {/* Right: File Selection Panel */}
                <div className="lg:col-span-3 flex flex-col max-h-[630px]">
                  <FileSelectionPanel
                    files={files}
                    selected={selected}
                    setSelected={setSelected}
                    onGenerate={handleGenerate}
                    onBack={handleBack}
                    loading={loading}
                    onSelectAll={handleSelectAll}
                    onDeselectAll={handleDeselectAll}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      <ToastContainer position="bottom-right" theme="dark" />
    </div>
  );
}
