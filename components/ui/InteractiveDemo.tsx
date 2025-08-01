"use client";

import { useState } from "react";
import { motion } from "motion/react";

interface InteractiveDemoProps {
  onClose: () => void;
}

export function InteractiveDemo({ onClose }: InteractiveDemoProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedDemographic, setSelectedDemographic] = useState("");
  const [productName, setProductName] = useState("");
  const [productPrice, setProductPrice] = useState("");
  const [productSpecs, setProductSpecs] = useState([
    { name: "", value: "" }
  ]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedDescription, setGeneratedDescription] = useState("");
  const [isDisabled, setIsDisabled] = useState(false);

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

  const handleGenerate = async () => {
    setIsGenerating(true);

    // Generate unique request ID for polling
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Prepare JSON payload for API Gateway -> SQS
    const payload = {
      requestId: requestId,
      title: productName,
      price: productPrice,
      technicalSpecifications: productSpecs
        .filter(spec => spec.name.trim() && spec.value.trim())
        .reduce((acc, spec) => {
          acc[spec.name] = spec.value;
          return acc;
        }, {} as Record<string, string>),
      targetAudience: selectedDemographic
    };

    console.log('API Payload:', JSON.stringify(payload, null, 2));

    try {
      const { API_ENDPOINTS, apiCall } = await import('../../lib/api-config');
      // Send to your API Gateway endpoint that connects to SQS
      const response = await apiCall(API_ENDPOINTS.GENERATE, {
        method: 'POST',
        headers: { 'Origin': window.location.origin },
        body: JSON.stringify(payload)
      })
      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));


      const responseData = await response.text();
      console.log('API Response:', responseData);
      console.log('Request sent to SQS successfully');

      // Start polling for results
      await pollForResult(requestId);

    } catch (error) {
      console.error('Generation failed:', error);
      setIsGenerating(false);

      // More specific error messages
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        setGeneratedDescription('Network error: Unable to connect to the API. This might be a CORS issue or the API Gateway is not accessible. Please check the browser console for more details.');
      } else {
        setGeneratedDescription(`Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`);
      }
    }
  };

  const pollForResult = async (requestId: string, maxAttempts: number = 30) => {
    let attempts = 0;

    const poll = async (): Promise<void> => {
      try {
        attempts++;

        const { API_ENDPOINTS, apiCall } = await import('../../lib/api-config');
        const result = await apiCall(`${API_ENDPOINTS.POLLING}${requestId}`, {
          method: 'GET',
          headers: { 'Accept': 'application/json' }
        })

        console.log('Polling result:', result);

        if (result.status === 'completed') {
          if (result.generatedDescription == "error") {
            setGeneratedDescription(result.generatedDescription);
            setIsGenerating(false);
            setIsDisabled(true);
          }
          else {
            setGeneratedDescription(result.generatedDescription);
            setIsGenerating(false);
            setIsDisabled(false);
          }
        } else if (result.status === 'error') {
          throw new Error(result.error || 'Generation failed');
        } else if (result.status === 'processing' || result.status === 'queued') {
          if (attempts >= maxAttempts) {
            throw new Error('Request timeout - please try again');
          }
          // Continue polling every 2 seconds
          setTimeout(poll, 2000);
        } else {
          // Unknown status, continue polling
          if (attempts >= maxAttempts) {
            throw new Error('Request timeout - please try again');
          }
          setTimeout(poll, 2000);
        }

      } catch (error) {
        console.error('Polling error:', error);
        setIsGenerating(false);
        setGeneratedDescription('Sorry, there was an error generating your description. Please try again.');
      }
    };

    // Start polling immediately
    poll();
  };

  const saveProductToCatalog = async () => {
    try {
      // Import API configuration
      const { API_ENDPOINTS, apiCall } = await import('../../lib/api-config');

      const result = await apiCall(API_ENDPOINTS.SAVE_PRODUCT, {
        method: 'POST',
        body: JSON.stringify({
          product_name: productName,
          price: parseFloat(productPrice),
          key_features: productSpecs
            .filter(spec => spec.name.trim() && spec.value.trim())
            .map(spec => `${spec.name}: ${spec.value}`)
            .join(', '),
          technical_specs: productSpecs
            .filter(spec => spec.name.trim() && spec.value.trim())
            .map(spec => ({
              name: spec.name,
              value: spec.value
            })),
          description: generatedDescription,
          target_audience: selectedDemographic,
          created_at: new Date().toISOString()
        }),
      });

      alert(`Product saved successfully with ID: ${result.item_id}`);

      // Optionally close the demo or reset the form
      onClose();

    } catch (error) {
      console.error('Error saving product:', error);
      alert('Failed to save product. Please try again.');
    }
  };

  const canGenerate = () => {
    return productName.trim() && productPrice.trim() && productSpecs.some(spec => spec.name.trim() && spec.value.trim());
  };

  const addSpec = () => {
    setProductSpecs([...productSpecs, { name: "", value: "" }]);
  };

  const removeSpec = (index: number) => {
    if (productSpecs.length > 1) {
      setProductSpecs(productSpecs.filter((_, i) => i !== index));
    }
  };

  const updateSpec = (index: number, field: 'name' | 'value', value: string) => {
    const updatedSpecs = productSpecs.map((spec, i) =>
      i === index ? { ...spec, [field]: value } : spec
    );
    setProductSpecs(updatedSpecs);
  };

  const steps = [
    {
      title: "Select Your Target Demographic",
      subtitle: "Choose who you want to optimize your product descriptions for",
      component: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {demographics.map((demo) => (
            <button
              key={demo.id}
              onClick={() => setSelectedDemographic(demo.id)}
              className={`p-4 rounded-lg border-2 text-left transition-all hover:scale-105 ${selectedDemographic === demo.id
                ? demo.color
                : "border-gray-300 hover:border-gray-400 dark:border-gray-600 dark:hover:border-gray-500"
                }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">{demo.icon}</span>
                <h3 className="font-semibold text-lg">{demo.name}</h3>
              </div>
              <p className="text-sm opacity-80">{demo.description}</p>
            </button>
          ))}
        </div>
      ),
    },
    {
      title: "AI Product Description Generator",
      subtitle: "Powered by AWS Bedrock - Enter your product details",
      component: (
        <div className="space-y-6">
          {/* Selected demographic display */}
          <div className="p-4 rounded-lg bg-blue-50 border border-blue-200 dark:bg-blue-900/20 dark:border-blue-700">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">
                {demographics.find(d => d.id === selectedDemographic)?.icon}
              </span>
              <span className="font-medium">
                Optimizing for: {demographics.find(d => d.id === selectedDemographic)?.name}
              </span>
            </div>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              {demographics.find(d => d.id === selectedDemographic)?.description}
            </p>
          </div>

          {/* Product input form */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Product Name</label>
              <input
                type="text"
                placeholder="e.g., Wireless Gaming Headset Pro"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Price</label>
              <input
                type="text"
                placeholder="e.g., $149.99"
                value={productPrice}
                onChange={(e) => setProductPrice(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Technical Specifications</label>
              <div className="space-y-3">
                {productSpecs.map((spec, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <input
                      type="text"
                      placeholder="Spec name (e.g., Battery Life)"
                      value={spec.name}
                      onChange={(e) => updateSpec(index, 'name', e.target.value)}
                      className="flex-1 rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                    />
                    <input
                      type="text"
                      placeholder="Value (e.g., 20 hours)"
                      value={spec.value}
                      onChange={(e) => updateSpec(index, 'value', e.target.value)}
                      className="flex-1 rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() => removeSpec(index)}
                      disabled={productSpecs.length === 1}
                      className="p-2 rounded-lg border border-red-300 text-red-600 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-red-600 dark:text-red-400 dark:hover:bg-red-900/20"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                      </svg>
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addSpec}
                  className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors dark:border-gray-600 dark:text-gray-400 dark:hover:border-blue-500 dark:hover:text-blue-400"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add Specification
                </button>
              </div>
            </div>
          </div>

          {/* Generate button */}
          <button
            onClick={handleGenerate}
            disabled={!canGenerate() || isGenerating}
            className="w-full rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-3 font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed hover:from-blue-600 hover:to-purple-700 transition-all"
          >
            {isGenerating ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Generating with AWS Bedrock...
              </div>
            ) : (
              "Generate Optimized Description"
            )}
          </button>

          {/* Generated description */}
          {generatedDescription && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6 rounded-lg border-2 border-green-300 bg-green-50 dark:border-green-600 dark:bg-green-900/20"
            >
              <h4 className="font-semibold text-green-800 dark:text-green-300 mb-3 flex items-center gap-2">
                <span>✨</span>
                AI-Generated Product Description
              </h4>
              <div className="prose prose-sm dark:prose-invert">
                <p className="text-green-700 dark:text-green-200 leading-relaxed">
                  {generatedDescription}
                </p>
              </div>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={saveProductToCatalog}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    isDisabled 
                      ? 'bg-gray-400 text-gray-200 cursor-not-allowed opacity-60' 
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                  disabled={isDisabled}
                >
                  Use This Description
                </button>
                <button
                  onClick={handleGenerate}
                  className="px-4 py-2 border border-green-600 text-green-600 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/30 transition-colors"
                >
                  Regenerate
                </button>
              </div>
            </motion.div>
          )}
        </div>
      ),
    },
  ];

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return selectedDemographic !== "";
      default:
        return true;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="relative rounded-3xl border border-neutral-200 bg-white p-8 shadow-xl dark:border-neutral-800 dark:bg-neutral-900 max-h-[80vh] overflow-y-auto"
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute right-4 top-4 rounded-full p-2 hover:bg-gray-100 dark:hover:bg-gray-800 z-10"
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
          <span>Step {currentStep + 1} of {steps.length}</span>
          <span>{Math.round(((currentStep + 1) / steps.length) * 100)}% Complete</span>
        </div>
        <div className="mt-2 h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
          <motion.div
            className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-600"
            initial={{ width: 0 }}
            animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Step content */}
      <div className="mb-8">
        <h2 className="mb-2 text-2xl font-bold text-center">{steps[currentStep].title}</h2>
        <p className="mb-6 text-center text-gray-600 dark:text-gray-400">{steps[currentStep].subtitle}</p>
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          {steps[currentStep].component}
        </motion.div>
      </div>

      {/* Navigation buttons */}
      {currentStep === 0 && (
        <div className="flex justify-between">
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-6 py-2 font-medium hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800"
          >
            Cancel
          </button>
          <button
            onClick={nextStep}
            disabled={!canProceed()}
            className="rounded-lg bg-blue-500 px-6 py-2 font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-600"
          >
            Continue to AI Generator
          </button>
        </div>
      )}

      {currentStep === 1 && (
        <div className="flex justify-between">
          <button
            onClick={prevStep}
            className="rounded-lg border border-gray-300 px-6 py-2 font-medium hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800"
          >
            Back to Demographics
          </button>
          <button
            onClick={onClose}
            className="rounded-lg bg-green-500 px-6 py-2 font-medium text-white hover:bg-green-600"
          >
            Done
          </button>
        </div>
      )}
    </motion.div>
  );
}
