import React, { useState, useRef, useEffect } from 'react';
import { Upload, FileText, Sparkles, Loader2, CheckCircle } from 'lucide-react';
import { extractConcepts } from '../services/geminiService';
import { InputMode } from '../types';

interface ConceptInputProps {
  onConceptsUpdate: (concepts: string[]) => void;
}

export const ConceptInput: React.FC<ConceptInputProps> = ({ onConceptsUpdate }) => {
  const [mode, setMode] = useState<InputMode>(InputMode.MANUAL);
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Clear success message on input change
  useEffect(() => {
    if (successMsg) {
        const timer = setTimeout(() => setSuccessMsg(null), 3000);
        return () => clearTimeout(timer);
    }
  }, [inputText, successMsg]);

  const handleManualChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setInputText(text);
    // Basic split by newline for manual mode immediate feedback
    if (mode === InputMode.MANUAL) {
        const concepts = text.split('\n').map(s => s.trim()).filter(s => s.length > 0);
        onConceptsUpdate(concepts);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setInputText(text);
      if (mode === InputMode.MANUAL) {
        const concepts = text.split('\n').map(s => s.trim()).filter(s => s.length > 0);
        onConceptsUpdate(concepts);
      }
    };
    reader.readAsText(file);
  };

  const handleAiExtraction = async () => {
    if (!inputText.trim()) {
      setError("Voer eerst tekst in of upload een bestand.");
      return;
    }
    
    setIsProcessing(true);
    setError(null);
    setSuccessMsg(null);
    
    try {
      const extracted = await extractConcepts(inputText);
      
      // Update the input text with the found concepts (one per line)
      // and switch to manual mode so the user can review/edit them.
      const formattedList = extracted.join('\n');
      setInputText(formattedList);
      setMode(InputMode.MANUAL);
      onConceptsUpdate(extracted);
      setSuccessMsg(`Succes! ${extracted.length} begrippen gevonden. Controleer de lijst hieronder.`);
      
    } catch (err: any) {
      console.error("AI Extraction Error:", err);
      // Show the actual error message to help debugging in production
      const errorMsg = err?.message || "Onbekende fout";
      setError(`Fout: ${errorMsg}. Check Vercel logs/settings.`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <div className="flex gap-4 mb-4 border-b border-gray-100 pb-2">
        <button
          onClick={() => setMode(InputMode.MANUAL)}
          className={`pb-2 text-sm font-medium transition-colors ${
            mode === InputMode.MANUAL
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <FileText className="inline w-4 h-4 mr-2" />
          Kopieer & Plak Lijst
        </button>
        <button
          onClick={() => setMode(InputMode.AI_EXTRACT)}
          className={`pb-2 text-sm font-medium transition-colors ${
            mode === InputMode.AI_EXTRACT
              ? 'text-purple-600 border-b-2 border-purple-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Sparkles className="inline w-4 h-4 mr-2" />
          AI Extractie (Smart)
        </button>
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">
            {mode === InputMode.MANUAL ? "Begrippenlijst (één per regel)" : "Ruwe tekst voor analyse"}
            </label>
            <div className="flex gap-2">
                <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs flex items-center gap-1 text-gray-600 hover:text-blue-600 px-2 py-1 rounded bg-gray-50 hover:bg-gray-100 border border-gray-200"
                >
                    <Upload className="w-3 h-3" />
                    Upload Bestand (.txt, .csv)
                </button>
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept=".txt,.csv,.md,.json" 
                    onChange={handleFileUpload}
                />
            </div>
        </div>
        
        <textarea
          value={inputText}
          onChange={handleManualChange}
          placeholder={mode === InputMode.MANUAL ? "Appel\nPeer\nBanaan..." : "Plak hier een artikel, hoofdstuk of aantekeningen. De AI zal er geschikte begrippen uithalen."}
          className={`w-full h-48 p-3 border rounded-lg focus:ring-2 focus:border-blue-500 text-sm font-mono transition-colors ${
             successMsg ? 'border-green-300 ring-2 ring-green-100' : 'border-gray-300 focus:ring-blue-500'
          }`}
        />
        
        {mode === InputMode.MANUAL && (
            <div className="flex justify-between items-start mt-1">
                 <p className="text-xs text-gray-500">Elke nieuwe regel wordt als een nieuw begrip gezien.</p>
                 {successMsg && (
                    <span className="text-xs text-green-600 flex items-center gap-1 font-medium animate-pulse">
                        <CheckCircle className="w-3 h-3" />
                        {successMsg}
                    </span>
                 )}
            </div>
        )}
      </div>

      {mode === InputMode.AI_EXTRACT && (
        <div className="flex flex-col gap-2">
            <button
            onClick={handleAiExtraction}
            disabled={isProcessing || !inputText}
            className="w-full flex items-center justify-center gap-2 bg-purple-600 text-white py-2.5 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium shadow-sm"
            >
            {isProcessing ? (
                <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Analyseren...
                </>
            ) : (
                <>
                <Sparkles className="w-5 h-5" />
                Extraheer Begrippen met AI
                </>
            )}
            </button>
            {error && <p className="text-sm text-red-500 text-center">{error}</p>}
        </div>
      )}
    </div>
  );
};