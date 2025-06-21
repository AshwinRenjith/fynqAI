
import React, { useState, useRef } from 'react';
import { X, Upload, FileText, BookOpen, Plus, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { uploadFile } from '@/lib/api';

interface FileUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FileUploadModal: React.FC<FileUploadModalProps> = ({ isOpen, onClose }) => {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileUpload = (files: FileList | null) => {
    if (!files) return;
    
    const newFiles = Array.from(files).filter(file => 
      file.type === 'application/pdf' || file.type.startsWith('image/')
    );
    
    setUploadedFiles(prev => [...prev, ...newFiles]);
    
    if (newFiles.length > 0) {
      toast({
        title: "Files selected! 📚",
        description: `${newFiles.length} file(s) ready for upload. Click 'Save Resources' to finalize.`,
      });
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileUpload(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white/20 backdrop-blur-xl border border-white/30 rounded-3xl p-8 max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-2 rounded-2xl">
              <BookOpen className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Learning Resources</h2>
              <p className="text-gray-600 text-sm">Upload your notes, textbooks, and study materials</p>
            </div>
          </div>
          <Button
            onClick={onClose}
            className="bg-white/30 hover:bg-white/50 text-gray-700 rounded-2xl p-2 transition-all duration-300 hover:scale-105"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Upload Area */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`border-2 border-dashed rounded-3xl p-8 text-center transition-all duration-300 ${
            isDragging 
              ? 'border-purple-400 bg-purple-50/50' 
              : 'border-gray-300 bg-white/30'
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => handleFileUpload(e.target.files)}
            accept=".pdf,image/*"
            multiple
            className="hidden"
          />
          
          <div className="flex flex-col items-center space-y-4">
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-4 rounded-3xl">
              <Upload className="h-8 w-8 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Drag & drop your files here
              </h3>
              <p className="text-gray-600 mb-4">
                Support for PDFs, images (PNG, JPG, etc.)
              </p>
              <Button
                onClick={() => fileInputRef.current?.click()}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-2xl px-6 py-3 transition-all duration-300 hover:scale-105 shadow-lg"
              >
                <Plus className="h-4 w-4 mr-2" />
                Choose Files
              </Button>
            </div>
          </div>
        </div>

        {/* Uploaded Files */}
        {uploadedFiles.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <Check className="h-5 w-5 text-green-500 mr-2" />
              Uploaded Files ({uploadedFiles.length})
            </h3>
            <div className="space-y-3 max-h-40 overflow-y-auto">
              {uploadedFiles.map((file, index) => (
                <div key={index} className="bg-white/50 backdrop-blur-sm border border-white/30 rounded-2xl p-4 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-2 rounded-xl">
                      <FileText className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-800 truncate max-w-xs">
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={() => removeFile(index)}
                    className="bg-red-100 hover:bg-red-200 text-red-600 rounded-xl p-1 transition-all duration-300 hover:scale-105"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 mt-8">
          <Button
            onClick={onClose}
            className="bg-white/50 hover:bg-white/70 text-gray-700 rounded-2xl px-6 py-3 transition-all duration-300 hover:scale-105"
          >
            Cancel
          </Button>
          <Button
            onClick={async () => {
              if (uploadedFiles.length === 0) {
                toast({
                  title: "No files to save",
                  description: "Please select files before saving.",
                  variant: "destructive",
                });
                return;
              }
              
              let successCount = 0;
              let errorCount = 0;
              for (const file of uploadedFiles) {
                try {
                  await uploadFile(file);
                  successCount++;
                } catch (error) {
                  console.error(`Error uploading ${file.name}:`, error);
                  errorCount++;
                }
              }

              if (successCount > 0) {
                toast({
                  title: "Resources saved! 🎉",
                  description: `${successCount} file(s) uploaded successfully. fynqAI will now use your materials for personalized tutoring.`, 
                });
              }

              if (errorCount > 0) {
                toast({
                  title: "Upload failed for some files",
                  description: `${errorCount} file(s) could not be uploaded. Please check the console for details.`, 
                  variant: "destructive",
                });
              }
              onClose();
            }}
            className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white rounded-2xl px-6 py-3 transition-all duration-300 hover:scale-105 shadow-lg"
          >
            Save Resources
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FileUploadModal;
