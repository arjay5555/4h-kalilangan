import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Upload, X, Image as ImageIcon, Video, File, CheckCircle2, Search } from "lucide-react";
import { db, storage } from "../lib/firebase";
import { collection, onSnapshot, doc, setDoc, query, orderBy } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export type MediaItem = {
  id: string;
  url: string;
  type: string;
  name: string;
  createdAt: string;
};

interface MediaLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (media: MediaItem | MediaItem[]) => void;
  allowMultiple?: boolean;
  accept?: string;
}

export function MediaLibraryModal({ isOpen, onClose, onSelect, allowMultiple = false, accept = "image/*,video/*" }: MediaLibraryModalProps) {
  const [activeTab, setActiveTab] = useState<'upload' | 'gallery'>('upload');
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [selectedUrls, setSelectedUrls] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    if (!isOpen) return;
    const q = query(collection(db, "media"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const items: MediaItem[] = [];
      snap.forEach(d => items.push({ id: d.id, ...d.data() } as MediaItem));
      setMediaList(items);
    });
    return () => unsub();
  }, [isOpen]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);
    try {
      const addedItems: MediaItem[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileRef = ref(storage, `media/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`);
        await uploadBytes(fileRef, file);
        const downloadURL = await getDownloadURL(fileRef);
        
        const mediaDocRef = doc(collection(db, "media"));
        const newMediaObj: MediaItem = {
          id: mediaDocRef.id,
          url: downloadURL,
          type: file.type.startsWith('video/') ? 'video' : file.type.startsWith('image/') ? 'image' : 'document',
          name: file.name,
          createdAt: new Date().toISOString()
        };
        await setDoc(mediaDocRef, newMediaObj);
        addedItems.push(newMediaObj);
        setUploadProgress(Math.round(((i + 1) / files.length) * 100));
      }

      if (allowMultiple) {
        onSelect(addedItems);
      } else {
        onSelect(addedItems[0]);
      }
      onClose();
    } catch (error) {
      console.error("Upload failed", error);
      alert("Failed to upload media.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSelectConfirm = () => {
    if (selectedUrls.length === 0) return;
    const selectedItems = mediaList.filter(m => selectedUrls.includes(m.id));
    if (allowMultiple) {
      onSelect(selectedItems);
    } else {
      onSelect(selectedItems[0] || selectedItems[0]);
    }
    onClose();
  };

  const toggleSelection = (media: MediaItem) => {
    if (allowMultiple) {
      setSelectedUrls(prev => prev.includes(media.id) ? prev.filter(id => id !== media.id) : [...prev, media.id]);
    } else {
      setSelectedUrls([media.id]);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white dark:bg-[#151515] rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800 shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-xl font-bold font-display text-slate-900 dark:text-white">Media Library</h2>
          <button onClick={onClose} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex border-b border-slate-200 dark:border-slate-800 px-6 pt-2">
          <button onClick={() => setActiveTab('upload')} className={`px-4 py-3 font-bold border-b-2 text-sm transition-colors ${activeTab === 'upload' ? 'border-[var(--color-4h-green)] text-[var(--color-4h-green)]' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>Upload from Device</button>
          <button onClick={() => setActiveTab('gallery')} className={`px-4 py-3 font-bold border-b-2 text-sm transition-colors ${activeTab === 'gallery' ? 'border-[var(--color-4h-green)] text-[var(--color-4h-green)]' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>Media Gallery</button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 min-h-[400px]">
          {activeTab === 'upload' ? (
            <div className="h-full flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-10 bg-slate-50 dark:bg-[#1a1a1a]">
              {isUploading ? (
                <div className="text-center">
                  <div className="w-16 h-16 border-4 border-slate-200 border-t-[var(--color-4h-green)] rounded-full animate-spin mx-auto mb-4" />
                  <p className="font-bold text-slate-900 dark:text-white">Uploading...</p>
                  <p className="text-slate-500 text-sm mt-2">{uploadProgress}% complete</p>
                </div>
              ) : (
                <div className="text-center">
                  <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-400">
                    <Upload size={32} />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Drag and drop files here</h3>
                  <p className="text-slate-500 mb-8 max-w-sm mx-auto">Or browse your device to upload new media. They will be saved to your library.</p>
                  <label className="cursor-pointer inline-flex items-center gap-2 bg-[var(--color-4h-green)] hover:bg-green-700 text-white font-bold py-3 px-8 rounded-xl transition-colors">
                    <Upload size={18} /> Select Files
                    <input type="file" multiple={allowMultiple} accept={accept} className="hidden" onChange={handleFileUpload} disabled={isUploading} />
                  </label>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex flex-col">
              {mediaList.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-500 text-center">
                  <ImageIcon size={48} className="mb-4 opacity-50" />
                  <p className="font-bold text-lg text-slate-900 dark:text-white mb-2">No media found</p>
                  <p>Upload some files first to see them here.</p>
                  <button onClick={() => setActiveTab('upload')} className="mt-6 text-[var(--color-4h-green)] font-bold hover:underline">Go to Upload</button>
                </div>
              ) : (
                <div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {mediaList.map(media => {
                      const isSelected = selectedUrls.includes(media.id);
                      return (
                        <div key={media.id} onClick={() => toggleSelection(media)} className={`relative aspect-square rounded-xl overflow-hidden cursor-pointer border-2 transition-all group ${isSelected ? 'border-[var(--color-4h-green)]' : 'border-transparent hover:border-slate-300 dark:hover:border-slate-600'}`}>
                          {media.type === 'image' ? (
                            <img src={media.url} alt={media.name} className="w-full h-full object-cover bg-slate-100 dark:bg-slate-800" />
                          ) : media.type === 'video' ? (
                            <div className="w-full h-full bg-slate-900 flex items-center justify-center relative">
                              <video src={media.url} className="absolute inset-0 w-full h-full object-cover opacity-50" />
                              <Video size={32} className="text-white relative z-10" />
                            </div>
                          ) : (
                            <div className="w-full h-full bg-slate-100 dark:bg-slate-800 flex flex-col items-center justify-center text-slate-400">
                              <File size={32} className="mb-2" />
                              <span className="text-[10px] w-full px-2 truncate text-center">{media.name}</span>
                            </div>
                          )}
                          
                          {/* Selection indicator */}
                          <div className={`absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center transition-opacity ${isSelected ? 'bg-[var(--color-4h-green)] text-white opacity-100' : 'bg-black/20 text-white opacity-0 group-hover:opacity-100'}`}>
                            <CheckCircle2 size={16} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {activeTab === 'gallery' && selectedUrls.length > 0 && (
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#1a1a1a] flex justify-between items-center">
            <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">{selectedUrls.length} selected</p>
            <div className="flex gap-3">
              <button onClick={() => setSelectedUrls([])} className="px-5 py-2 rounded-xl text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-200 dark:hover:bg-slate-700 text-sm">Clear</button>
              <button onClick={handleSelectConfirm} className="px-6 py-2 rounded-xl bg-[var(--color-4h-green)] text-white font-bold hover:bg-green-700 text-sm">Select</button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
