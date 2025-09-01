import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface FileTreeType {
  [key: string]: FileTreeType | null;
}

interface Props {
  fileTree: FileTreeType;
  selectedFiles: Set<string>;
  onToggleFile: (filePath: string) => void;
}

const SearchBar: React.FC<Props> = ({ fileTree, selectedFiles, onToggleFile }) => {
  const [query, setQuery] = useState("");

  const flattenFiles = (tree: FileTreeType, path = ""): string[] => {
    let files: string[] = [];
    Object.entries(tree).forEach(([name, child]) => {
      const currentPath = path ? `${path}/${name}` : name;
      if (child === null) files.push(currentPath);
      else files = files.concat(flattenFiles(child, currentPath));
    });
    return files;
  };

  const allFiles = flattenFiles(fileTree);
  const filtered = allFiles.filter((f) => f.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="mb-4">
      {/* Search Input */}
      <input
        type="text"
        placeholder="🔍 Search files..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full px-4 py-2 mb-3 rounded-lg border border-gray-700 bg-gray-900 text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:outline-none"
      />

      {/* Search Results */}
      <AnimatePresence>
        {query && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="bg-gray-800 border border-gray-700 rounded-lg p-3 max-h-60 overflow-y-auto shadow-lg"
          >
            {filtered.length > 0 ? (
              filtered.map((file) => (
                <label
                  key={file}
                  className="flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-700 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedFiles.has(file)}
                    onChange={() => onToggleFile(file)}
                    className="accent-purple-500"
                  />
                  <span className="text-gray-200 text-sm break-all">{file}</span>
                </label>
              ))
            ) : (
              <p className="text-gray-400 text-sm">No files found</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SearchBar;
