import React, { useState, useEffect } from 'react';
import './ProgressBar.css';

interface ProgressBarProps {
    isVisible: boolean;
    duration?: number; // Expected duration in milliseconds
    onComplete?: () => void;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
    isVisible,
    duration = 30000, // Default 30 seconds
    onComplete
}) => {
    const [progress, setProgress] = useState(0);
    const [currentStep, setCurrentStep] = useState('');
    const [isComplete, setIsComplete] = useState(false);

    // Simulate realistic testing phases
    const testingPhases = [
        { name: 'Initializing AI Services', duration: 0.05, description: 'Starting comprehensive AI test suite' },
        { name: 'Navigating to Target URL', duration: 0.08, description: 'Loading page and analyzing structure' },
        { name: 'Aggressive Element Detection', duration: 0.12, description: 'Scanning for interactive elements' },
        { name: 'Login Flow Testing', duration: 0.15, description: 'Testing authentication and login forms' },
        { name: 'Form Validation Analysis', duration: 0.10, description: 'Validating form fields and inputs' },
        { name: 'Security Scanning', duration: 0.12, description: 'Checking for vulnerabilities' },
        { name: 'Accessibility Testing', duration: 0.10, description: 'Analyzing accessibility compliance' },
        { name: 'Visual AI Analysis', duration: 0.08, description: 'Detecting visual regressions' },
        { name: 'Performance Monitoring', duration: 0.10, description: 'Measuring page performance' },
        { name: 'Generating AI Insights', duration: 0.10, description: 'Creating comprehensive reports' }
    ];

    useEffect(() => {
        if (!isVisible) {
            setProgress(0);
            setCurrentStep('');
            setIsComplete(false);
            return;
        }

        let currentProgress = 0;
        let phaseIndex = 0;
        let phaseProgress = 0;
        let startTime = Date.now();

        const updateProgress = () => {
            const elapsed = Date.now() - startTime;
            const totalElapsed = Math.min(1, elapsed / duration);

            // Calculate progress with proper phase distribution
            const progress = totalElapsed;
            setProgress(progress);

            // Debug logging for the last phase
            if (progress >= 0.9) {
                console.log(`Progress: ${Math.round(progress * 100)}%, Phase: ${phaseIndex + 1}/${testingPhases.length}`);
            }

            // Determine current phase based on progress
            // Ensure all phases get animated, including the last one
            const phaseIndex = Math.min(
                Math.floor(progress * testingPhases.length),
                testingPhases.length - 1
            );

            // Special handling for the last phase to ensure it gets animated
            if (progress >= 0.9 && phaseIndex === testingPhases.length - 1) {
                setCurrentStep(testingPhases[testingPhases.length - 1].name);
            }

            // Always show the current phase, including the last one
            if (phaseIndex < testingPhases.length) {
                setCurrentStep(testingPhases[phaseIndex].name);
            }

            // Complete when we reach 100% or slightly before
            if (totalElapsed >= 0.99) {
                setProgress(1);
                setIsComplete(true);
                setCurrentStep('Test Complete');
                onComplete?.();
                return;
            }

            requestAnimationFrame(updateProgress);
        };

        updateProgress();

        const interval = setInterval(updateProgress, 100);
        return () => {
            clearInterval(interval);
        };
    }, [isVisible, duration, onComplete]);

    if (!isVisible) return null;

    const percentage = Math.round(progress * 100);
    const currentPhase = testingPhases.find((_, index) => {
        const cumulative = testingPhases.slice(0, index + 1).reduce((sum, phase) => sum + phase.duration, 0);
        return progress <= cumulative;
    });

    return (
        <div className="progress-container">
            <div className="progress-header">
                <h3>AI Testing in Progress</h3>
                <div className="progress-percentage">{percentage}%</div>
            </div>

            <div className="progress-bar-wrapper">
                <div className="progress-bar">
                    <div
                        className="progress-fill"
                        style={{ width: `${percentage}%` }}
                    />
                </div>
                <div className="progress-steps">
                    {testingPhases.map((phase, index) => {
                        const isActive = currentStep === phase.name;
                        const isCompleted = progress > index / testingPhases.length;

                        return (
                            <div
                                key={phase.name}
                                className={`progress-step ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
                            >
                                <div className="step-indicator">
                                    {isCompleted ? '✓' : index + 1}
                                </div>
                                <div className="step-content">
                                    <div className="step-name">{phase.name}</div>
                                    {isActive && (
                                        <div className="step-description">{phase.description}</div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {isComplete && (
                <div className="completion-message">
                    <div className="completion-icon">🎉</div>
                    <div className="completion-text">
                        <h4>Testing Complete!</h4>
                        <p>Generating comprehensive results...</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProgressBar;
