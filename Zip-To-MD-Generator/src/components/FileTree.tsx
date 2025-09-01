import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaFolder, FaFolderOpen, FaFileAlt } from "react-icons/fa";

interface FileTreeProps {
  files: string[];
  selected: string[];
  setSelected: (files: string[]) => void;
}

interface FileNode {
  name: string;
  path: string;
  children?: FileNode[];
}

function buildTree(files: string[]): FileNode[] {
  const root: Record<string, any> = {};
  files.forEach((filePath) => {
    if (!filePath) return;
    const parts = filePath.replace(/\\/g, "/").split("/").filter(Boolean);
    let current = root;
    let currentPath = "";
    parts.forEach((part, i) => {
      currentPath = currentPath ? `${currentPath}/${part}` : part;
      if (!current[part]) {
        current[part] = {
          __node: {
            name: part,
            path: currentPath,
            children: i === parts.length - 1 ? undefined : {},
          },
        };
      }
      current = current[part].__node.children ?? {};
    });
  });
  
  function convert(node: Record<string, any>): FileNode[] {
    return Object.values(node)
      .map((entry: any) => {
        if (!entry?.__node) return null;
        const n: FileNode = { name: entry.__node.name, path: entry.__node.path };
        if (entry.__node.children && Object.keys(entry.__node.children).length > 0) {
          n.children = convert(entry.__node.children);
        }
        return n;
      })
      .filter((n): n is FileNode => n !== null);
  }
  return convert(root);
}

const FileTree: React.FC<FileTreeProps> = ({ files, selected, setSelected }) => {
  const [tree, setTree] = useState<FileNode[]>([]);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  useEffect(() => {
    const cleaned = files.filter(f => f.trim() !== "");
    const built = buildTree(cleaned);
    setTree(built);
    
    // Expand all folders initially
    const allFolders = new Set<string>();
    const collectFolders = (nodes: FileNode[]) => {
      nodes.forEach(n => {
        if (n.children?.length) {
          allFolders.add(n.path);
          collectFolders(n.children);
        }
      });
    };
    collectFolders(built);
    setExpanded(allFolders);
  }, [files]);

  // Get all descendant file paths (leaf nodes) of a folder
  const getAllDescendantFiles = (node: FileNode): string[] => {
    if (!node.children) return [node.path];
    return node.children.flatMap(child => getAllDescendantFiles(child));
  };

  // Check if all children of a folder are selected
  const areAllChildrenSelected = (node: FileNode): boolean => {
    if (!node.children) return selected.includes(node.path);
    const descendantFiles = getAllDescendantFiles(node);
    return descendantFiles.every(filePath => selected.includes(filePath));
  };

  // Update parent checkboxes based on children state
  const updateParentStates = (newSelected: string[]) => {
    const updatedSelected = [...newSelected];
    
    const processNode = (node: FileNode): boolean => {
      if (!node.children) {
        return updatedSelected.includes(node.path);
      }
      
      // Check children first (bottom-up)
      const childStates = node.children.map(child => processNode(child));
      const allChildrenSelected = childStates.every(state => state);
      
      if (allChildrenSelected) {
        // All children are selected, so parent should be selected
        if (!updatedSelected.includes(node.path)) {
          updatedSelected.push(node.path);
        }
      } else {
        // Not all children are selected, so parent should not be selected
        const index = updatedSelected.indexOf(node.path);
        if (index > -1) {
          updatedSelected.splice(index, 1);
        }
      }
      
      return allChildrenSelected;
    };
    
    tree.forEach(rootNode => processNode(rootNode));
    return updatedSelected;
  };

  // Handle file (leaf) checkbox toggle
  const toggleFile = (path: string) => {
    let newSelected: string[];
    if (selected.includes(path)) {
      newSelected = selected.filter(f => f !== path);
    } else {
      newSelected = [...selected, path];
    }
    
    // Update parent states based on children
    const finalSelected = updateParentStates(newSelected);
    setSelected(finalSelected);
  };

  // Handle folder checkbox toggle
  const toggleFolder = (node: FileNode) => {
    if (!node.children) return;
    
    const descendantFiles = getAllDescendantFiles(node);
    const isCurrentlySelected = areAllChildrenSelected(node);
    
    let newSelected: string[];
    if (isCurrentlySelected) {
      // Uncheck all descendants
      newSelected = selected.filter(f => !descendantFiles.includes(f));
    } else {
      // Check all descendants
      newSelected = [...new Set([...selected, ...descendantFiles])];
    }
    
    setSelected(newSelected);
  };

  const toggleExpand = (path: string) => {
    const newExpanded = new Set(expanded);
    newExpanded.has(path) ? newExpanded.delete(path) : newExpanded.add(path);
    setExpanded(newExpanded);
  };

  const renderTree = (nodes: FileNode[], depth = 0, prefix: boolean[] = []): React.ReactNode => {
    return nodes.map((node, idx) => {
      const isLast = idx === nodes.length - 1;
      const isFolder = !!node.children && node.children.length > 0;
      const isChecked = isFolder ? areAllChildrenSelected(node) : selected.includes(node.path);
      
      const linePrefix = prefix.map((p, i) =>
        p ? <span key={i} className="inline-block w-4 h-full border-l-2 border-gray-500" /> : <span key={i} className="inline-block w-4 h-full" />
      );

      return (
        <div key={node.path} className="font-mono text-base mb-1 relative">
          <div
            className={`flex items-center gap-2 py-1 px-2 rounded cursor-pointer transition-colors duration-150 ${
              isChecked ? "text-indigo-400 font-semibold" : "text-gray-300"
            }`}
          >
            {linePrefix}
            <span className="w-4">{isLast ? "└─" : "├─"}</span>
            <input
              type="checkbox"
              checked={isChecked}
              onChange={() => (isFolder ? toggleFolder(node) : toggleFile(node.path))}
              className="w-4 h-4 accent-indigo-400 cursor-pointer"
              onClick={e => e.stopPropagation()}
            />
            {isFolder ? (
              <motion.span
                onClick={() => toggleExpand(node.path)}
                className="flex items-center gap-1 select-none text-yellow-500 font-bold"
                whileHover={{ color: "#facc15" }}
                transition={{ duration: 0.2 }}
              >
                <motion.div
                  animate={{ rotate: expanded.has(node.path) ? 90 : 0 }}
                  className="inline-block text-yellow-500"
                >
                  {expanded.has(node.path) ? <FaFolderOpen size={20} /> : <FaFolder size={20} />}
                </motion.div>
                {node.name}
              </motion.span>
            ) : (
              <motion.span
                className="flex items-center gap-1 select-none text-gray-300"
                whileHover={{ color: "#3b82f6" }}
                transition={{ duration: 0.2 }}
                onClick={() => toggleFile(node.path)}
              >
                <FaFileAlt size={18} /> {node.name}
              </motion.span>
            )}
          </div>
          {isFolder && node.children && (
            <AnimatePresence>
              {expanded.has(node.path) && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="ml-5 pl-2"
                >
                  {renderTree(node.children, depth + 1, [...prefix, !isLast])}
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>
      );
    });
  };

  return <div>{renderTree(tree)}</div>;
};

export default FileTree;