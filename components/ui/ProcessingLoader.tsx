"use client";

import { motion } from "motion/react";
import { useEffect, useState } from "react";

interface ProcessingLoaderProps {
  onComplete: () => void;
  uploadedFiles: File[];
}

export function ProcessingLoader({ onComplete, uploadedFiles }: ProcessingLoaderProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);

  const steps = [
    { 
      id: 'upload', 
      label: 'Uploading files', 
      description: 'Securely transferring your catalog files...',
      icon: '📤'
    },
    { 
      id: 'parse', 
      label: 'Parsing data', 
      description: 'Analyzing product information and structure...',
      icon: '🔍'
    },
    { 
      id: 'validate', 
      label: 'Validating products', 
      description: 'Checking data integrity and formatting...',
      icon: '✅'
    },
    { 
      id: 'process', 
      label: 'Processing catalog', 
      description: 'Organizing products and generating metadata...',
      icon: '⚙️'
    },
    { 
      id: 'complete', 
      label: 'Finalizing setup', 
      description: 'Preparing your product catalog for use...',
      icon: '🎉'
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(timer);
          setTimeout(() => onComplete(), 500);
          return 100;
        }
        return prev + Math.random() * 15 + 5; // Random progress increment
      });
    }, 800);

    return () => clearInterval(timer);
  }, [onComplete]);

  useEffect(() => {
    const stepTimer = setInterval(() => {
      setCurrentStep(prev => {
        if (prev < steps.length - 1) {
          return prev + 1;
        }
        clearInterval(stepTimer);
        return prev;
      });
    }, 1600);

    return () => clearInterval(stepTimer);
  }, [steps.length]);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Main loading animation */}
        <div className="text-center mb-8">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"
          />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Processing Your Catalog
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Please wait while we set up your product inventory
          </p>
        </div>

        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
            <span>Progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <motion.div
              className="bg-blue-600 h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(progress, 100)}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
        </div>

        {/* Steps */}
        <div className="space-y-4 mb-8">
          {steps.map((step, index) => (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ 
                opacity: index <= currentStep ? 1 : 0.5,
                x: 0 
              }}
              transition={{ delay: index * 0.1 }}
              className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                index === currentStep 
                  ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700' 
                  : index < currentStep
                  ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700'
                  : 'bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
              }`}
            >
              <div className={`text-2xl ${
                index === currentStep ? 'animate-pulse' : ''
              }`}>
                {index < currentStep ? '✅' : step.icon}
              </div>
              <div className="flex-1">
                <div className={`font-medium ${
                  index === currentStep 
                    ? 'text-blue-900 dark:text-blue-100' 
                    : index < currentStep
                    ? 'text-green-900 dark:text-green-100'
                    : 'text-gray-700 dark:text-gray-300'
                }`}>
                  {step.label}
                </div>
                <div className={`text-sm ${
                  index === currentStep 
                    ? 'text-blue-700 dark:text-blue-300' 
                    : index < currentStep
                    ? 'text-green-700 dark:text-green-300'
                    : 'text-gray-500 dark:text-gray-400'
                }`}>
                  {step.description}
                </div>
              </div>
              {index === currentStep && (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"
                />
              )}
              {index < currentStep && (
                <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Uploaded files */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Processing Files ({uploadedFiles.length})
          </h4>
          <div className="space-y-2">
            {uploadedFiles.map((file, index) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                <span className="text-gray-600 dark:text-gray-400">{file.name}</span>
                <span className="text-gray-500 dark:text-gray-500">
                  ({(file.size / 1024).toFixed(1)} KB)
                </span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
