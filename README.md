# 📦 ZipLens – From ZIP to Readable Markdown ✨

Tired of digging through endless folders in a ZIP file or copy-pasting code into AI tools?  
**ZipLens** is here to save you! 🚀  

With just a few clicks, you can turn any ZIP file into a clean, organized **Markdown file**.  
No manual copy-paste. No messy extractions. Just a neat view of your files, ready to share, read, or feed into your favorite AI assistant.  

---

## 🌟 Why ZipLens?

As developers (and creators in general), we often want to share project files or analyze them with AI tools. But:

- Copying and pasting dozens of files into a prompt is boring 😴  
- Unzipping and hunting through folders takes time ⏳  
- Large prompts eat up precious memory 🧠  

**ZipLens makes it easy.**  
You upload a ZIP → it extracts file content directly → and serves everything as a Markdown file.  
The AI (or any human reader) gets a **structured view** of your project without the clutter.

---

## ✨ Features

- 📂 **Preserves folder structure** – so your Markdown looks like the original project.  
- 📝 **Readable output** – each file’s content wrapped neatly in Markdown with headings.  
- 🧠 **AI-friendly** – perfect for dropping into prompts without breaking context limits.  
- ⚡ **No extraction needed** – we peek into the ZIP without unzipping it on disk.  
- 🛠️ **Works for any files** – not just code! Docs, configs, text files, you name it.  
- 🌍 **Web-based interface** – upload, pick your files, and generate Markdown instantly.  

---

## 🔄 How It Works (Technical Flow)

1. You upload a ZIP file via the web interface.  
2. The backend reads the ZIP **directly in memory** (no messy temp folders).  
3. You choose which files you want.  
4. ZipLens creates a single Markdown file:  
   - Keeps folder hierarchy  
   - Adds file headers  
   - Wraps file content in Markdown code blocks (if readable)  
   - Notes binary files (instead of dumping gibberish)  
5. The Markdown is returned to you as a downloadable file.  

---

## 🚀 Getting Started

1. Clone the repo:
```bash
git clone https://github.com/yourusername/ziplens.git
cd ziplens
```

2. Install dependencies (backend + frontend):
```bash
# Backend
pip install -r requirements.txt

# Frontend
cd frontend
npm install
```

3. Run the backend:
```bash
uvicorn app:app --reload
```

4. Run the frontend:
```bash
npm run dev
```

5. Open in browser → Upload a ZIP → Generate Markdown → 🎉

## **💡 Use Cases**

* Developers sharing their project with AI tools.

* Teachers turning student ZIP submissions into readable reports.

* Writers or researchers organizing text files.

* Anyone who’s tired of double-clicking through ZIPs!

## **🪄 Why "ZipLens"?**

Because it’s like putting on a lens 🔍 that lets you see clearly inside a ZIP — no unpacking, no hassle.

## 📁 Folder Structure of the Project:

```
└── 📁backend
    ├── app.py
    └── requirements.txt

└── 📁Zip-To-MD-Generator
    └── 📁public
        ├── vite.svg
    └── 📁src
        └── 📁assets
            ├── react.svg
        └── 📁components
            ├── CardWrapper.tsx
            ├── FileTree.tsx
            ├── SearchBar.tsx
            ├── ZipUploader.tsx
        ├── App.tsx
        ├── index.css
        ├── main.tsx
        ├── vite-env.d.ts
    ├── .gitignore
    ├── eslint.config.js
    ├── index.html
    ├── package-lock.json
    ├── package.json
    ├── README.md
    ├── tsconfig.app.json
    ├── tsconfig.json
    ├── tsconfig.node.json
    └── vite.config.ts
```