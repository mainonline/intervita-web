import React, { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { parseResume } from "@/pages/api/parser";
import { Upload, X } from "lucide-react";

interface ResumeUploadProps {
  onResumeProcessed: (resumeData: any) => void;
}

export const ResumeUpload: React.FC<ResumeUploadProps> = ({
  onResumeProcessed,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);

    // Simulate progress while waiting for the actual API response
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        const newProgress = prev + Math.random() * 5;
        return newProgress >= 95 ? 95 : newProgress;
      });
    }, 400);

    try {
      const resumeData = await parseResume(file);
      clearInterval(progressInterval);
      setUploadProgress(100);

      // Wait a moment at 100% for better UX
      setTimeout(() => {
        // Make sure we have valid resume data before proceeding
        if (!resumeData || Object.keys(resumeData).length === 0) {
          throw new Error("Resume parsing failed or returned empty data");
        }

        onResumeProcessed(resumeData);
      }, 500);
    } catch (error) {
      console.error("Error parsing resume:", error);
      clearInterval(progressInterval);
      setUploadProgress(0);
      setIsUploading(false);

      // Show error to user
      // Here you could add a toast or alert component to show errors
    }
  };

  return (
    <Dialog.Root open={true}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-zinc-900 border border-zinc-800 rounded-lg p-6 w-[90vw] max-w-md shadow-xl focus:outline-none">
          <Dialog.Title className="text-xl font-semibold text-white mb-4">
            Upload your resume/CV
          </Dialog.Title>
          <Dialog.Description className="text-sm text-white mb-6">
            Please upload your resume/CV as a PDF file to get started with
            Intervita AI.
          </Dialog.Description>

          <div className="mb-6">
            {!isUploading ? (
              <div className="border-2 bg-gray-900 border-dashed border-green-400 rounded-lg p-8 text-center hover:border-green-500 transition-colors relative">
                {file && (
                  <button
                    className="absolute top-2 right-2 p-1 rounded-md bg-gray-800 border border-white text-white  hover:bg-gray-900 hover:text-white transition-colors outline-none"
                    onClick={() => setFile(null)}
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  className="hidden"
                  id="resume-upload"
                />
                <label
                  htmlFor="resume-upload"
                  className="cursor-pointer flex flex-col items-center"
                >
                  <Upload className="h-10 w-10 text-white mb-3" />
                  <span className="text-white font-medium">
                    {file ? file.name : "Click to select file"}
                  </span>
                  {!file && (
                    <span className="text-xs text-white mt-1">
                      (PDF files only)
                    </span>
                  )}
                </label>
              </div>
            ) : (
              <div className="p-8">
                <div className="mb-2 flex justify-between text-sm text-white">
                  <span>Processing your resume...</span>
                  <span>{Math.round(uploadProgress)}%</span>
                </div>
                <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-green-400"
                    initial={{ width: 0 }}
                    animate={{ width: `${uploadProgress}%` }}
                    transition={{ type: "spring", damping: 10, stiffness: 100 }}
                  />
                </div>
                <div className="mt-6 flex items-center justify-center">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  >
                    <svg
                      className="w-8 h-8 text-green-400"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                  </motion.div>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <button
              onClick={handleUpload}
              disabled={!file || isUploading}
              className={`px-4 py-2 rounded-md font-medium text-sm ${
                !file || isUploading
                  ? "bg-zinc-700 text-zinc-400 cursor-not-allowed"
                  : "bg-gray-800 text-white hover:bg-gray-900 transition-colors"
              }`}
            >
              {isUploading ? "Processing..." : "Upload & Continue"}
            </button>
          </div>

          <Dialog.Close asChild>
            <button
              className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1 rounded-full focus:outline-none"
              aria-label="Close"
              disabled={isUploading}
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 15 15"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M11.7816 4.03157C12.0062 3.80702 12.0062 3.44295 11.7816 3.2184C11.5571 2.99385 11.193 2.99385 10.9685 3.2184L7.50005 6.68682L4.03164 3.2184C3.80708 2.99385 3.44301 2.99385 3.21846 3.2184C2.99391 3.44295 2.99391 3.80702 3.21846 4.03157L6.68688 7.49999L3.21846 10.9684C2.99391 11.193 2.99391 11.557 3.21846 11.7816C3.44301 12.0061 3.80708 12.0061 4.03164 11.7816L7.50005 8.31316L10.9685 11.7816C11.193 12.0061 11.5571 12.0061 11.7816 11.7816C12.0062 11.557 12.0062 11.193 11.7816 10.9684L8.31322 7.49999L11.7816 4.03157Z"
                  fill="currentColor"
                />
              </svg>
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
