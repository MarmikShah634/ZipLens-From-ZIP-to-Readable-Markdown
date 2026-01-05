import React from "react";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import { Upload } from "lucide-react";

interface Props {
  onFilesListed: (tree: any, base64: string) => void;
}

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000";

const ZipUploader: React.FC<Props> = ({ onFilesListed }) => {
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (
      file.type !== "application/x-zip-compressed" &&
      !file.name.endsWith(".zip")
    ) {
      toast.error("Please upload a valid ZIP file.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("ZIP file must be under 50MB.");
      return;
    }

    const formData = new FormData();
    formData.append("zipfile", file);

    try {
      const res = await fetch(`${API_BASE_URL}/upload`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (data.error) {
        toast.error(data.error);
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(",")[1];
        onFilesListed(data.files, base64);
        toast.success("Files listed successfully!");
        e.target.value = "";
      };
      reader.readAsDataURL(file);
    } catch {
      toast.error("Upload failed.");
    }
  };

  return (
    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
      <label className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-xl shadow-md cursor-pointer transition-all">
        <Upload className="w-5 h-5" />
        Upload ZIP
        <input
          type="file"
          className="hidden"
          accept=".zip"
          onChange={handleUpload}
        />
      </label>
    </motion.div>
  );
};

export default ZipUploader;
