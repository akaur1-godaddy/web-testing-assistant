import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface VoiceInterfaceProps {
  onCommand: (command: VoiceCommand) => void;
  isEnabled?: boolean;
}

interface VoiceCommand {
  text: string;
  intent: string;
  entities: { [key: string]: string };
  confidence: number;
}

interface VoiceState {
  isListening: boolean;
  isProcessing: boolean;
  lastCommand: string;
  error?: string;
}

const VoiceInterface: React.FC<VoiceInterfaceProps> = ({ 
  onCommand, 
  isEnabled = true 
}) => {
  const [voiceState, setVoiceState] = useState<VoiceState>({
    isListening: false,
    isProcessing: false,
    lastCommand: '',
  });
  
  const [transcript, setTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(false);
  const [currentResponse, setCurrentResponse] = useState('');
  const [commandHistory, setCommandHistory] = useState<VoiceCommand[]>([]);
  
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const visualizerRef = useRef<HTMLCanvasElement>(null);

  // Voice commands mapping
  const commandPatterns = {
    'test website': {
      intent: 'run_test',
      pattern: /test\s+(website|site|page|url)\s*(.*)$/i,
    },
    'run tests': {
      intent: 'run_test', 
      pattern: /run\s+(tests?|testing)\s*(.*)$/i,
    },
    'show results': {
      intent: 'show_results',
      pattern: /show\s+(results?|report|dashboard)$/i,
    },
    'generate test': {
      intent: 'generate_test',
      pattern: /generate\s+(test|tests?)\s*(.*)$/i,
    },
    'explain': {
      intent: 'explain',
      pattern: /explain\s+(.*)$/i,
    },
    'help': {
      intent: 'help',
      pattern: /(help|what can you do|commands?)$/i,
    },
    'accessibility test': {
      intent: 'accessibility_test',
      pattern: /accessibility\s+(test|check|analysis)$/i,
    },
    'performance test': {
      intent: 'performance_test',
      pattern: /performance\s+(test|check|analysis)$/i,
    },
    'security scan': {
      intent: 'security_test',
      pattern: /security\s+(scan|test|check)$/i,
    },
    'visual regression': {
      intent: 'visual_test',
      pattern: /visual\s+(regression|test|comparison)$/i,
    },
    'stop': {
      intent: 'stop',
      pattern: /(stop|cancel|quit)$/i,
    },
  };

  useEffect(() => {
    initializeVoiceRecognition();
    initializeSpeechSynthesis();
    initializeAudioVisualizer();
    
    return () => {
      cleanup();
    };
  }, []);

  const initializeVoiceRecognition = () => {
    // Check for Web Speech API support
    const SpeechRecognition = (window as any).SpeechRecognition || 
                             (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setVoiceState(prev => ({ 
        ...prev, 
        error: 'Speech recognition not supported in this browser' 
      }));
      return;
    }

    setIsSupported(true);
    
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 3;

    recognition.onstart = () => {
      console.log('🎤 Voice recognition started');
      setVoiceState(prev => ({ ...prev, isListening: true, error: undefined }));
    };

    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      setTranscript(interimTranscript || finalTranscript);

      if (finalTranscript) {
        processVoiceCommand(finalTranscript.trim());
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Voice recognition error:', event.error);
      setVoiceState(prev => ({ 
        ...prev, 
        error: `Recognition error: ${event.error}`,
        isListening: false 
      }));
    };

    recognition.onend = () => {
      console.log('🎤 Voice recognition ended');
      setVoiceState(prev => ({ ...prev, isListening: false }));
    };

    recognitionRef.current = recognition;
  };

  const initializeSpeechSynthesis = () => {
    if ('speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
    }
  };

  const initializeAudioVisualizer = () => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
          const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
          const analyser = audioContext.createAnalyser();
          const source = audioContext.createMediaStreamSource(stream);
          
          analyser.fftSize = 256;
          source.connect(analyser);
          
          audioContextRef.current = audioContext;
          analyserRef.current = analyser;
          
          startVisualizer();
        })
        .catch(err => console.warn('Audio access denied:', err));
    }
  };

  const startVisualizer = () => {
    const canvas = visualizerRef.current;
    const analyser = analyserRef.current;
    
    if (!canvas || !analyser) return;

    const ctx = canvas.getContext('2d')!;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      if (!voiceState.isListening) return;

      requestAnimationFrame(draw);
      
      analyser.getByteFrequencyData(dataArray);
      
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      const barWidth = canvas.width / bufferLength * 2.5;
      let x = 0;
      
      for (let i = 0; i < bufferLength; i++) {
        const barHeight = dataArray[i] / 255 * canvas.height * 0.8;
        
        const r = barHeight + 25 * (i / bufferLength);
        const g = 250 * (i / bufferLength);
        const b = 50;
        
        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
        
        x += barWidth + 1;
      }
    };

    draw();
  };

  const processVoiceCommand = async (text: string) => {
    console.log('🗣️ Processing command:', text);
    
    setVoiceState(prev => ({ 
      ...prev, 
      isProcessing: true, 
      lastCommand: text 
    }));

    try {
      const command = parseCommand(text);
      
      if (command) {
        setCommandHistory(prev => [command, ...prev.slice(0, 9)]);
        
        // Provide immediate voice feedback
        const response = getQuickResponse(command);
        speakResponse(response); // Don't await - let it speak while processing
        
        // Execute command through parent component
        onCommand(command);
      }
    } catch (error) {
      console.error('Command processing error:', error);
      speakResponse("Processing your request");
      // Still try to execute something
      onCommand({
        text,
        intent: 'nlp_test',
        entities: { description: text, nlpDescription: text },
        confidence: 0.7,
      });
    } finally {
      setVoiceState(prev => ({ ...prev, isProcessing: false }));
      setTranscript('');
    }
  };

  const parseCommand = (text: string): VoiceCommand | null => {
    const normalizedText = text.toLowerCase().trim();
    
    // First check for specific command patterns
    for (const [commandName, config] of Object.entries(commandPatterns)) {
      const match = normalizedText.match(config.pattern);
      
      if (match) {
        return {
          text,
          intent: config.intent,
          entities: extractEntities(match, config.intent),
          confidence: calculateConfidence(text, commandName),
        };
      }
    }

    // If no specific pattern matches, treat as NLP test description
    // This enables production-like behavior where any text becomes a test instruction
    const extractedUrl = extractUrl(text);
    console.log('🎤 Voice parseCommand - extracted URL from text:', extractedUrl);
    console.log('🎤 Voice parseCommand - final entities.target will be:', extractedUrl || undefined);
    
    return {
      text,
      intent: 'nlp_test',
      entities: {
        description: text,
        nlpDescription: text,
        target: extractedUrl || undefined
      },
      confidence: Math.min(0.95, Math.max(0.7, text.length / 100 + 0.5)),
    };
  };

  const extractEntities = (match: RegExpMatchArray, intent: string): { [key: string]: string } => {
    const entities: { [key: string]: string } = {};

    switch (intent) {
      case 'run_test':
        if (match[2]) entities.target = match[2].trim();
        break;
      case 'generate_test':
        if (match[2]) entities.type = match[2].trim();
        break;
      case 'explain':
        if (match[1]) entities.topic = match[1].trim();
        break;
    }

    return entities;
  };

  const extractUrl = (text: string): string | null => {
    // Simple URL extraction from text
    const urlRegex = /(https?:\/\/[^\s]+)/gi;
    const match = text.match(urlRegex);
    return match ? match[0] : null;
  };

  const calculateConfidence = (text: string, commandName: string): number => {
    // Simple confidence scoring based on command clarity
    const baseConfidence = 0.8;
    const textLength = text.split(' ').length;
    
    // Shorter, clearer commands get higher confidence
    if (textLength <= 3) return Math.min(baseConfidence + 0.15, 1.0);
    if (textLength <= 5) return baseConfidence;
    
    return Math.max(baseConfidence - 0.1, 0.6);
  };

  const getQuickResponse = (command: VoiceCommand): string => {
    const quickResponses = {
      'run_test': 'Starting test',
      'accessibility_test': 'Running accessibility test',
      'performance_test': 'Checking performance', 
      'security_test': 'Security scan starting',
      'visual_test': 'Visual test starting',
      'show_results': 'Opening results',
      'generate_test': 'Generating tests',
      'nlp_test': 'Creating tests from your description',
      'help': 'Here to help',
      'stop': 'Stopping',
    };

    let response = quickResponses[command.intent as keyof typeof quickResponses] || 'Processing your request';

    // Add URL context if available
    if (command.entities.target) {
      response += ` on ${command.entities.target}`;
    }

    return response;
  };

  const generateResponse = (command: VoiceCommand): string => {
    const responses = {
      'run_test': [
        "Starting comprehensive test suite now",
        "Initiating test execution with AI analysis",
        "Running tests and generating insights",
      ],
      'show_results': [
        "Displaying test results and AI insights",
        "Here are your latest test results",
        "Showing comprehensive test dashboard",
      ],
      'generate_test': [
        "Generating AI-powered test cases",
        "Creating intelligent test scenarios",
        "Building custom test suite with machine learning",
      ],
      'accessibility_test': [
        "Running advanced accessibility analysis",
        "Checking compliance and user experience",
        "Analyzing accessibility with AI insights",
      ],
      'performance_test': [
        "Analyzing performance metrics",
        "Running Core Web Vitals assessment",
        "Measuring loading speeds and optimization opportunities",
      ],
      'security_test': [
        "Performing comprehensive security scan",
        "Checking for vulnerabilities and threats",
        "Analyzing security posture with AI detection",
      ],
      'visual_test': [
        "Running visual regression analysis",
        "Comparing UI changes with AI detection",
        "Analyzing visual consistency across viewports",
      ],
      'help': [
        "I can help you run tests, show results, generate test cases, and analyze accessibility, performance, and security. Just speak naturally!",
      ],
      'explain': [
        `Let me explain ${command.entities.topic || 'that concept'} for you`,
      ],
      'stop': [
        "Voice interface stopped",
        "Goodbye!",
      ],
    };

    const responseArray = responses[command.intent as keyof typeof responses] || ["Command received"];
    return responseArray[Math.floor(Math.random() * responseArray.length)];
  };

  const speakResponse = async (text: string): Promise<void> => {
    if (!synthRef.current) return;

    setCurrentResponse(text);

    return new Promise((resolve) => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1.0;
      utterance.volume = 0.8;
      
      utterance.onend = () => {
        setCurrentResponse('');
        resolve();
      };

      utterance.onerror = () => {
        setCurrentResponse('');
        resolve();
      };

      synthRef.current!.speak(utterance);
    });
  };

  const startListening = () => {
    if (!recognitionRef.current || !isSupported) return;
    
    try {
      recognitionRef.current.start();
      startVisualizer();
    } catch (error) {
      console.error('Failed to start recognition:', error);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setVoiceState(prev => ({ ...prev, isListening: false }));
  };

  const toggleListening = () => {
    if (voiceState.isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const cleanup = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    if (synthRef.current) {
      synthRef.current.cancel();
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
  };

  if (!isEnabled || !isSupported) {
    return null;
  }

  return (
    <div className="voice-interface">
      <style>{`
        .voice-interface {
          position: fixed;
          bottom: 20px;
          left: 20px;
          z-index: 1000;
        }
        
        .voice-control {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border: none;
          border-radius: 50%;
          width: 80px;
          height: 80px;
          color: white;
          font-size: 2rem;
          cursor: pointer;
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .voice-control:hover {
          transform: scale(1.1);
          box-shadow: 0 12px 35px rgba(0, 0, 0, 0.4);
        }
        
        .voice-control.listening {
          background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
          animation: pulse 1.5s infinite;
        }
        
        .voice-control.processing {
          background: linear-gradient(135deg, #feca57 0%, #ff9ff3 100%);
          animation: spin 2s linear infinite;
        }
        
        .voice-panel {
          position: absolute;
          bottom: 100px;
          left: 0;
          background: rgba(0, 0, 0, 0.9);
          color: white;
          padding: 20px;
          border-radius: 15px;
          min-width: 300px;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .voice-status {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 15px;
          font-weight: bold;
        }
        
        .status-indicator {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #00ff88;
        }
        
        .status-indicator.listening {
          animation: pulse 1s infinite;
        }
        
        .status-indicator.processing {
          background: #feca57;
        }
        
        .transcript-display {
          background: rgba(255, 255, 255, 0.1);
          padding: 10px;
          border-radius: 8px;
          margin-bottom: 15px;
          min-height: 40px;
          font-family: monospace;
        }
        
        .audio-visualizer {
          width: 100%;
          height: 60px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 8px;
          margin-bottom: 15px;
        }
        
        .command-history {
          max-height: 200px;
          overflow-y: auto;
        }
        
        .command-item {
          background: rgba(255, 255, 255, 0.05);
          padding: 8px;
          border-radius: 6px;
          margin-bottom: 5px;
          font-size: 0.9rem;
        }
        
        .command-intent {
          color: #00ff88;
          font-weight: bold;
        }
        
        .command-confidence {
          float: right;
          color: #feca57;
          font-size: 0.8rem;
        }
        
        .response-display {
          background: rgba(0, 255, 136, 0.1);
          border: 1px solid rgba(0, 255, 136, 0.3);
          padding: 10px;
          border-radius: 8px;
          margin-bottom: 15px;
        }
        
        .error-display {
          background: rgba(255, 0, 0, 0.1);
          border: 1px solid rgba(255, 0, 0, 0.3);
          padding: 10px;
          border-radius: 8px;
          margin-bottom: 15px;
          color: #ff6b6b;
        }
        
        .voice-commands {
          background: rgba(255, 255, 255, 0.05);
          padding: 15px;
          border-radius: 10px;
          margin-top: 15px;
        }
        
        .command-examples {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        
        .command-examples li {
          padding: 5px 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          font-size: 0.9rem;
        }
        
        .command-examples li:last-child {
          border-bottom: none;
        }
        
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.05); opacity: 0.8; }
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>

      <motion.button
        className={`voice-control ${
          voiceState.isListening ? 'listening' : 
          voiceState.isProcessing ? 'processing' : ''
        }`}
        onClick={toggleListening}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        {voiceState.isListening ? '🎤' : voiceState.isProcessing ? '⚙️' : '🔊'}
      </motion.button>

      <AnimatePresence>
        {(voiceState.isListening || voiceState.isProcessing || transcript || currentResponse) && (
          <motion.div
            className="voice-panel"
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ duration: 0.3 }}
          >
            <div className="voice-status">
              <div className={`status-indicator ${
                voiceState.isListening ? 'listening' : 
                voiceState.isProcessing ? 'processing' : ''
              }`}></div>
              {voiceState.isListening && 'Listening...'}
              {voiceState.isProcessing && 'Processing...'}
              {!voiceState.isListening && !voiceState.isProcessing && 'Ready'}
            </div>

            {voiceState.isListening && (
              <canvas 
                ref={visualizerRef}
                className="audio-visualizer"
                width={280}
                height={60}
              />
            )}

            {transcript && (
              <div className="transcript-display">
                <strong>You said:</strong> "{transcript}"
              </div>
            )}

            {currentResponse && (
              <motion.div 
                className="response-display"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <strong>AutoQA AI:</strong> {currentResponse}
              </motion.div>
            )}

            {voiceState.error && (
              <div className="error-display">
                <strong>Error:</strong> {voiceState.error}
              </div>
            )}

            {commandHistory.length > 0 && (
              <div>
                <strong>Recent Commands:</strong>
                <div className="command-history">
                  {commandHistory.slice(0, 3).map((cmd, index) => (
                    <motion.div
                      key={index}
                      className="command-item"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <span className="command-intent">{cmd.intent.replace('_', ' ')}</span>
                      <span className="command-confidence">
                        {Math.round(cmd.confidence * 100)}%
                      </span>
                      <div>{cmd.text}</div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            <div className="voice-commands">
              <strong>💡 Try saying:</strong>
              <ul className="command-examples">
                <li>"Test the login form with invalid credentials"</li>
                <li>"Check if buttons are accessible with keyboard navigation"</li>
                <li>"Verify the contact form validates email addresses"</li>
                <li>"Test the shopping cart checkout process"</li>
                <li>"Run security scan"</li>
                <li>"Show me the results"</li>
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VoiceInterface;

