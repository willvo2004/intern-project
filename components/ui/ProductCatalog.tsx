"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { FileUploadZone } from "./FileUploadZone";
import { ProcessingLoader } from "./ProcessingLoader";

interface TechnicalSpec {
  name: string;
  value: string;
}

interface Product {
  item_id: string;
  product_name: string;
  price: number;
  key_features: string;
  technical_specs: TechnicalSpec[];
  description: string;
  created_at?: string;
  updated_at?: string;
}

type CatalogState = 'upload' | 'processing' | 'ready' | 'loading' | 'error';

// Export function to check if catalog is ready
export const isCatalogReady = (): boolean => {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('catalogInitialized') === 'true';
};

// Export function to get catalog state
export const getCatalogState = (): CatalogState => {
  if (typeof window === 'undefined') return 'upload';
  const hasExistingCatalog = localStorage.getItem('catalogInitialized');
  return hasExistingCatalog ? 'ready' : 'upload';
};

export function ProductCatalog() {
  const [products, setProducts] = useState<Product[]>([]);
  const [catalogState, setCatalogState] = useState<CatalogState>('upload');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedSpecs, setExpandedSpecs] = useState<Set<string>>(new Set());
  const [editingDescription, setEditingDescription] = useState<string | null>(null);
  const [newDescription, setNewDescription] = useState("");
  const [generatingDescription, setGeneratingDescription] = useState<string | null>(null);
  const [updatingProduct, setUpdatingProduct] = useState<string | null>(null);
  const [selectingDemographic, setSelectingDemographic] = useState<string | null>(null);
  const [selectedDemographic, setSelectedDemographic] = useState("");

  const demographics = [
    {
      id: "students",
      name: "Students",
      description: "Budget-friendly, practical solutions",
      icon: "🎓",
      color: "bg-blue-100 border-blue-300 text-blue-800 dark:bg-blue-900/20 dark:border-blue-600 dark:text-blue-300"
    },
    {
      id: "budget-conscious",
      name: "Budget-Conscious Consumers",
      description: "Value-focused, cost-effective options",
      icon: "💰",
      color: "bg-green-100 border-green-300 text-green-800 dark:bg-green-900/20 dark:border-green-600 dark:text-green-300"
    },
    {
      id: "gamers",
      name: "Gamers",
      description: "Performance-driven, cutting-edge tech",
      icon: "🎮",
      color: "bg-purple-100 border-purple-300 text-purple-800 dark:bg-purple-900/20 dark:border-purple-600 dark:text-purple-300"
    },
    {
      id: "professionals",
      name: "Business Professionals",
      description: "Productivity-focused, reliable solutions",
      icon: "💼",
      color: "bg-gray-100 border-gray-300 text-gray-800 dark:bg-gray-900/20 dark:border-gray-600 dark:text-gray-300"
    },
    {
      id: "tech-enthusiasts",
      name: "Tech Enthusiasts",
      description: "Innovation-focused, premium features",
      icon: "⚡",
      color: "bg-yellow-100 border-yellow-300 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-600 dark:text-yellow-300"
    },
    {
      id: "families",
      name: "Families",
      description: "Safety-focused, user-friendly design",
      icon: "👨‍👩‍👧‍👦",
      color: "bg-pink-100 border-pink-300 text-pink-800 dark:bg-pink-900/20 dark:border-pink-600 dark:text-pink-300"
    }
  ];

  useEffect(() => {
    // Check if we have existing products in localStorage or should show upload
    if (typeof window !== 'undefined') {
      const hasExistingCatalog = localStorage.getItem('catalogInitialized');
      if (hasExistingCatalog) {
        fetchProducts();
      } else {
        setCatalogState('upload');
      }
    } else {
      setCatalogState('upload');
    }
  }, []);

  const handleFilesUploaded = (files: File[]) => {
    setUploadedFiles(files);
    setCatalogState('processing');
  };

  const handleProcessingComplete = () => {
    // Mark catalog as initialized
    if (typeof window !== 'undefined') {
      localStorage.setItem('catalogInitialized', 'true');
    }
    setCatalogState('ready');
    fetchProducts();
  };

  const fetchProducts = async () => {
    try {
      setCatalogState('loading');

      // Import API configuration
      const { API_ENDPOINTS, apiCall } = await import('../../lib/api-config');

      // Fetch data from API Gateway
      const products = await apiCall(API_ENDPOINTS.PRODUCTS);
      setProducts(products);
      setError(null);
      setCatalogState('ready');
    } catch (err) {
      setError('Failed to fetch products from API Gateway');
      console.error('Error fetching products:', err);
      setCatalogState('error');
    }
  };

  const filteredProducts = products.filter(product =>
    product.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.key_features.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortProducts = (products: Product[]) => {
    return [...products].sort((a, b) => {
      // Primary sort: updated_at (most recent first)
      const aUpdated = a.updated_at ? new Date(a.updated_at).getTime() : 0;
      const bUpdated = b.updated_at ? new Date(b.updated_at).getTime() : 0;

      if (aUpdated !== bUpdated) {
        return bUpdated - aUpdated; // Descending order (most recent first)
      }

      // Secondary sort: created_at (most recent first)
      const aCreated = a.created_at ? new Date(a.created_at).getTime() : 0;
      const bCreated = b.created_at ? new Date(b.created_at).getTime() : 0;

      if (aCreated !== bCreated) {
        return bCreated - aCreated; // Descending order (most recent first)
      }

      // Tertiary sort: item_id (descending order - highest first)
      const aId = parseInt(a.item_id) || 0;
      const bId = parseInt(b.item_id) || 0;
      return bId - aId;
    });
  };

  const sortedProducts = sortProducts(filteredProducts);

  const toggleSpecs = (productId: string) => {
    const newExpandedSpecs = new Set(expandedSpecs);
    if (newExpandedSpecs.has(productId)) {
      newExpandedSpecs.delete(productId);
    } else {
      newExpandedSpecs.add(productId);
    }
    setExpandedSpecs(newExpandedSpecs);
  };

  const cleanProductTitle = (title: string) => {
    return title.replace(/‚Ä./g, '-');
  };

  const generateDescription = async (product: Product, demographic: string) => {
    setGeneratingDescription(product.item_id);
    setSelectingDemographic(null);

    // Generate unique request ID for polling
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Prepare JSON payload for API Gateway -> SQS
    const payload = {
      requestId: requestId,
      title: product.product_name,
      price: product.price.toString(),
      technicalSpecifications: product.technical_specs
        .filter(spec => spec.name.trim() && spec.value.trim())
        .reduce((acc, spec) => {
          acc[spec.name] = spec.value;
          return acc;
        }, {} as Record<string, string>),
      targetAudience: demographic,
      keyFeatures: product.key_features
    };

    try {
      // Send to API Gateway endpoint that connects to SQS
      const response = await fetch('https://rkykcujva2.execute-api.us-east-1.amazonaws.com/stage2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Origin': window.location.origin
        },
        mode: 'cors',
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      // Start polling for results
      await pollForResult(requestId, product.item_id);

    } catch (error) {
      console.error('Generation failed:', error);
      setGeneratingDescription(null);
      alert('Failed to generate description. Please try again.');
    }
  };

  const startDemographicSelection = (productId: string) => {
    setSelectingDemographic(productId);
    setSelectedDemographic("");
  };

  const cancelDemographicSelection = () => {
    setSelectingDemographic(null);
    setSelectedDemographic("");
  };

  const pollForResult = async (requestId: string, productId: string, maxAttempts: number = 30) => {
    let attempts = 0;

    const poll = async (): Promise<void> => {
      try {
        attempts++;

        const response = await fetch(`https://rkykcujva2.execute-api.us-east-1.amazonaws.com/stage2/status/${requestId}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json'
          }
        });

        if (!response.ok) {
          if (attempts >= maxAttempts) {
            throw new Error('Polling timeout - please try again');
          }
          setTimeout(poll, 2000);
          return;
        }

        const result = await response.json();

        if (result.status === 'completed') {
          setNewDescription(result.generatedDescription);
          setEditingDescription(productId);
          setGeneratingDescription(null);
        } else if (result.status === 'error') {
          throw new Error(result.error || 'Generation failed');
        } else if (result.status === 'processing' || result.status === 'queued') {
          if (attempts >= maxAttempts) {
            throw new Error('Request timeout - please try again');
          }
          setTimeout(poll, 2000);
        } else {
          if (attempts >= maxAttempts) {
            throw new Error('Request timeout - please try again');
          }
          setTimeout(poll, 2000);
        }

      } catch (error) {
        console.error('Polling error:', error);
        setGeneratingDescription(null);
        alert('Sorry, there was an error generating your description. Please try again.');
      }
    };

    poll();
  };

  const updateProductDescription = async (productId: string, description: string) => {
    setUpdatingProduct(productId);
    try {
      // Import API configuration
      const { API_ENDPOINTS, apiCall } = await import('../../lib/api-config');

      const result = await apiCall(API_ENDPOINTS.UPDATE_PRODUCT, {
        method: 'PUT',
        body: JSON.stringify({
          item_id: productId,
          description: description,
        }),
      });

      // Update local state
      setProducts(prevProducts =>
        prevProducts.map(product =>
          product.item_id === productId
            ? { ...product, description, updated_at: new Date().toISOString() }
            : product
        )
      );

      setEditingDescription(null);
      setNewDescription("");
    } catch (err) {
      console.error('Error updating product:', err);
      alert('Failed to update product. Please try again.');
    } finally {
      setUpdatingProduct(null);
    }
  };

  const cancelEdit = () => {
    setEditingDescription(null);
    setNewDescription("");
  };

  // Early returns for different states
  if (catalogState === 'upload') {
    return (
      <div className="w-full h-full">
        <FileUploadZone 
          onFilesUploaded={handleFilesUploaded}
          isProcessing={false}
        />
      </div>
    );
  }

  if (catalogState === 'processing') {
    return (
      <div className="w-full h-full">
        <ProcessingLoader 
          onComplete={handleProcessingComplete}
          uploadedFiles={uploadedFiles}
        />
      </div>
    );
  }

  if (catalogState === 'loading') {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (catalogState === 'error') {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-red-500 text-center">
          <p className="text-lg font-semibold">Error loading products</p>
          <p className="text-sm">{error}</p>
          <div className="mt-4 space-x-4">
            <button
              onClick={fetchProducts}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Retry
            </button>
            <button
              onClick={() => {
                if (typeof window !== 'undefined') {
                  localStorage.removeItem('catalogInitialized');
                }
                setCatalogState('upload');
              }}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Upload New Files
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main catalog view (catalogState === 'ready')
  return (
    <div className="w-full h-full">
      {/* Search Bar and Action Buttons */}
      <div className="mb-6 sticky top-0 bg-white dark:bg-neutral-900 z-10 pb-4">
        <div className="flex gap-3 items-center">
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-neutral-800 dark:text-white"
          />
          <button
            onClick={fetchProducts}
            disabled={catalogState === 'loading'}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            title="Refresh products"
          >
            <svg
              className={`w-4 h-4 ${catalogState === 'loading' ? 'animate-spin' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            {catalogState === 'loading' ? 'Refreshing...' : 'Refresh'}
          </button>
          <button
            onClick={() => {
              if (typeof window !== 'undefined') {
                localStorage.removeItem('catalogInitialized');
              }
              setCatalogState('upload');
            }}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
            title="Upload new catalog files"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            Upload New Files
          </button>
        </div>
      </div>

      {/* Products Grid */}
      <div className="h-[600px] overflow-y-auto pr-2 space-y-4">
        {sortedProducts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">No products found</p>
          </div>
        ) : (
          sortedProducts.map((product, index) => (
            <motion.div
              key={product.item_id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm hover:shadow-md transition-shadow"
            >
              {/* Product Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 mr-4">
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white line-clamp-1 mb-1">
                    {cleanProductTitle(product.product_name)}
                  </h3>
                </div>
                <span className="text-lg font-bold text-green-600 dark:text-green-400 whitespace-nowrap">
                  ${product.price.toFixed(2)}
                </span>
              </div>

              {/* Technical Specifications Toggle */}
              <div>
                <button
                  onClick={() => toggleSpecs(product.item_id)}
                  className="flex items-center justify-between w-full text-left text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors py-2"
                >
                  <span>Technical Specifications ({product.technical_specs.length})</span>
                  <svg
                    className={`w-4 h-4 transition-transform ${expandedSpecs.has(product.item_id) ? 'rotate-180' : ''
                      }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Collapsible Technical Specifications */}
                {expandedSpecs.has(product.item_id) && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="mt-2 border-t border-gray-100 dark:border-gray-700 pt-3"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                      {product.technical_specs.map((spec, specIndex) => (
                        <div
                          key={specIndex}
                          className="flex justify-between items-start py-1 text-xs"
                        >
                          <span className="font-medium text-gray-500 dark:text-gray-400 mr-2 flex-shrink-0">
                            {spec.name}:
                          </span>
                          <span className="text-gray-700 dark:text-gray-300 text-right">
                            {spec.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Description Section */}
              <div className="mt-4 border-t border-gray-100 dark:border-gray-700 pt-3">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Product Description
                  </h4>
                  <button
                    onClick={() => startDemographicSelection(product.item_id)}
                    disabled={generatingDescription === product.item_id || selectingDemographic === product.item_id}
                    className="px-3 py-1 text-xs rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:from-blue-600 hover:to-purple-700 transition-all"
                  >
                    {generatingDescription === product.item_id ? (
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                        Generating...
                      </div>
                    ) : (
                      "Generate New"
                    )}
                  </button>
                </div>

                {/* Demographic Selection */}
                {selectingDemographic === product.item_id && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg"
                  >
                    <h5 className="text-xs font-medium text-blue-800 dark:text-blue-300 mb-3">
                      Select Target Demographic:
                    </h5>
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      {demographics.map((demo) => (
                        <button
                          key={demo.id}
                          onClick={() => setSelectedDemographic(demo.id)}
                          className={`p-2 rounded-lg border text-left transition-all text-xs ${selectedDemographic === demo.id
                            ? demo.color
                            : "border-gray-300 hover:border-gray-400 dark:border-gray-600 dark:hover:border-gray-500"
                            }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm">{demo.icon}</span>
                            <span className="font-medium">{demo.name}</span>
                          </div>
                          <p className="text-xs opacity-80">{demo.description}</p>
                        </button>
                      ))}
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => generateDescription(product, selectedDemographic)}
                        disabled={!selectedDemographic}
                        className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Generate Description
                      </button>
                      <button
                        onClick={cancelDemographicSelection}
                        className="px-3 py-1 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors text-xs"
                      >
                        Cancel
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* Current Description */}
                {editingDescription !== product.item_id && selectingDemographic !== product.item_id && (
                  <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                    {product.description || "No description available"}
                  </p>
                )}

                {/* Generated Description Editor */}
                {editingDescription === product.item_id && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-3"
                  >
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-3">
                      <h5 className="text-xs font-medium text-green-800 dark:text-green-300 mb-2">
                        Generated Description:
                      </h5>
                      <div className="prose prose-xs dark:prose-invert">
                        <p className="text-green-700 dark:text-green-200 leading-relaxed text-xs">
                          {newDescription}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => updateProductDescription(product.item_id, newDescription)}
                        disabled={updatingProduct === product.item_id}
                        className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-xs disabled:opacity-50"
                      >
                        {updatingProduct === product.item_id ? 'Updating...' : 'Use This Description'}
                      </button>
                      <button
                        onClick={() => startDemographicSelection(product.item_id)}
                        disabled={generatingDescription === product.item_id}
                        className="px-3 py-1 border border-green-600 text-green-600 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/30 transition-colors text-xs"
                      >
                        Regenerate
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="px-3 py-1 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors text-xs"
                      >
                        Cancel
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* Timestamp */}
                {product.updated_at && (
                  <p className="text-xs text-gray-400 mt-2">
                    Last updated: {new Date(product.updated_at).toLocaleDateString()}
                  </p>
                )}
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
        Showing {sortedProducts.length} of {products.length} products
      </div>
    </div>
  );
}
