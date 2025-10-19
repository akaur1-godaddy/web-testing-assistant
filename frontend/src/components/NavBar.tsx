import { motion } from 'framer-motion'
import './NavBar.css'

interface NavBarProps {
    currentView: 'testing' | 'dashboard'
    onViewChange: (view: 'testing' | 'dashboard') => void
    aiEnabled: boolean
    voiceEnabled: boolean
    onAiToggle: () => void
    onVoiceToggle: () => void
}

function NavBar({
    currentView,
    onViewChange,
    aiEnabled,
    voiceEnabled,
    onAiToggle,
    onVoiceToggle
}: NavBarProps) {
    return (
        <nav className="navbar">
            <div className="navbar-container">
                {/* Left Section: Logo & Brand */}
                <div className="navbar-left">
                    <motion.div
                        className="navbar-logo"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5 }}
                    >
                        🤖
                    </motion.div>

                    <motion.div
                        className="navbar-brand"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                    >
                        <h1 className="navbar-title">
                            AutoQA AI
                        </h1>
                    </motion.div>
                </div>

                {/* Center Section: Navigation Toggles */}
                <div className="navbar-center">
                    <button
                        className={`nav-toggle ${currentView === 'testing' ? 'active' : ''}`}
                        onClick={() => onViewChange('testing')}
                    >
                        <span className="nav-toggle-icon">🧪</span>
                        <span className="nav-toggle-text">Testing Suite</span>
                    </button>

                    <button
                        className={`nav-toggle ${currentView === 'dashboard' ? 'active' : ''}`}
                        onClick={() => onViewChange('dashboard')}
                    >
                        <span className="nav-toggle-icon">📊</span>
                        <span className="nav-toggle-text">AI Dashboard</span>
                    </button>
                </div>

                {/* Right Section: AI & Voice Toggles */}
                <div className="navbar-right">
                    <div className="toggle-group">
                        <div className="toggle-item">
                            <label className="toggle-switch">
                                <input
                                    type="checkbox"
                                    checked={aiEnabled}
                                    onChange={onAiToggle}
                                    aria-label="Toggle AI Mode"
                                />
                                <div className="toggle-track">
                                    <div className="toggle-thumb">
                                        <span>⚙️</span>
                                    </div>
                                </div>
                            </label>
                            <span className="toggle-name">AI Mode</span>
                        </div>

                        <div className="toggle-item">
                            <label className="toggle-switch">
                                <input
                                    type="checkbox"
                                    checked={voiceEnabled}
                                    onChange={onVoiceToggle}
                                    aria-label="Toggle Voice Control"
                                />
                                <div className="toggle-track">
                                    <div className="toggle-thumb">
                                        <span>🎙️</span>
                                    </div>
                                </div>
                            </label>
                            <span className="toggle-name">Voice</span>
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    )
}

export default NavBar

