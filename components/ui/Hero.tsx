"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import Link from "next/link";
import { InteractiveDemo } from "./InteractiveDemo";
import { ProductCatalog, isCatalogReady } from "./ProductCatalog";

export function HeroSectionOne() {
  const [showDemo, setShowDemo] = useState(false);
  const [catalogReady, setCatalogReady] = useState(false);

  useEffect(() => {
    // Check catalog status on mount and set up listener for changes
    const checkCatalogStatus = () => {
      setCatalogReady(isCatalogReady());
    };

    // Only run on client side
    if (typeof window !== 'undefined') {
      checkCatalogStatus();

      // Listen for storage changes to update button state
      const handleStorageChange = (e: StorageEvent) => {
        if (e.key === 'catalogInitialized') {
          checkCatalogStatus();
        }
      };

      window.addEventListener('storage', handleStorageChange);

      // Also check periodically in case of same-tab changes
      const interval = setInterval(checkCatalogStatus, 1000);

      return () => {
        window.removeEventListener('storage', handleStorageChange);
        clearInterval(interval);
      };
    }
  }, []);

  const handleTryToday = () => {
    setShowDemo(true);
  };

  const handleCloseDemo = () => {
    setShowDemo(false);
  };

  const handleAddProduct = () => {
    if (!catalogReady) {
      alert('Please upload your product catalog files first to enable this feature.');
      return;
    }
    setShowDemo(true);
  };

  return (
    <div className="relative mx-auto my-10 flex max-w-7xl flex-col items-center justify-center">
      <Navbar />
      <div className="absolute inset-y-0 left-0 h-full w-px bg-neutral-200/80 dark:bg-neutral-800/80">
        <div className="absolute top-0 h-40 w-px bg-gradient-to-b from-transparent via-blue-500 to-transparent" />
      </div>
      <div className="absolute inset-y-0 right-0 h-full w-px bg-neutral-200/80 dark:bg-neutral-800/80">
        <div className="absolute h-40 w-px bg-gradient-to-b from-transparent via-blue-500 to-transparent" />
      </div>
      <div className="absolute inset-x-0 bottom-0 h-px w-full bg-neutral-200/80 dark:bg-neutral-800/80">
        <div className="absolute mx-auto h-px w-40 bg-gradient-to-r from-transparent via-blue-500 to-transparent" />
      </div>
      <div className="px-4 py-10 md:py-20">
        <h1 className="relative z-10 mx-auto max-w-4xl text-center text-2xl font-bold text-slate-700 md:text-4xl lg:text-7xl dark:text-slate-300">
          {"Generate descriptions across your entire catalog"
            .split(" ")
            .map((word, index) => (
              <motion.span
                key={index}
                initial={{ opacity: 0, filter: "blur(4px)", y: 10 }}
                animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
                transition={{
                  duration: 0.3,
                  delay: index * 0.1,
                  ease: "easeInOut",
                }}
                className="mr-2 inline-block"
              >
                {word}
              </motion.span>
            ))}
        </h1>
        <motion.p
          initial={{
            opacity: 0,
          }}
          animate={{
            opacity: 1,
          }}
          transition={{
            duration: 0.3,
            delay: 0.8,
          }}
          className="relative z-10 mx-auto max-w-xl py-4 text-center text-lg font-normal text-neutral-600 dark:text-neutral-400"
        >
          Interact with your product catalog and generate optimized product descriptions with artificial intelligence
        </motion.p>
        <motion.div
          initial={{
            opacity: 0,
          }}
          animate={{
            opacity: 1,
          }}
          transition={{
            duration: 0.3,
            delay: 1,
          }}
          className="relative z-10 mt-8 flex flex-wrap items-center justify-center gap-4"
        >
          <button
            onClick={handleAddProduct}
            disabled={!catalogReady}
            className={`w-60 transform rounded-lg px-6 py-2 font-medium transition-all duration-300 ${
              catalogReady
                ? 'bg-black text-white hover:-translate-y-0.5 hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200'
                : 'bg-gray-400 text-gray-600 cursor-not-allowed dark:bg-gray-600 dark:text-gray-400'
            }`}
            title={catalogReady ? 'Add a new product to your catalog' : 'Upload your product catalog files first'}
          >
            {catalogReady ? 'Add new product' : 'Upload catalog first'}
          </button>
        </motion.div>
        <motion.div
          initial={{
            opacity: 0,
            y: 10,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.3,
            delay: 1.2,
          }}
          className="relative z-10 mt-20 rounded-3xl border border-neutral-200 bg-neutral-100 p-4 shadow-md dark:border-neutral-800 dark:bg-neutral-900"
        >
          {showDemo ? (
            <InteractiveDemo onClose={handleCloseDemo} />
          ) : (
            <ProductCatalog />
          )}
        </motion.div>
      </div>
    </div>
  );
}

const Navbar = () => {
  return (
    <nav className="flex w-full items-center justify-between border-t border-b border-neutral-200 px-4 py-4 dark:border-neutral-800">
      <div className="flex items-center gap-2">
        <div className="size-7 rounded-full bg-gradient-to-br from-violet-500 to-pink-500" />
        <h1 className="text-base font-bold md:text-2xl">Any Company Product Catalog</h1>
      </div>
    </nav>
  );
};
