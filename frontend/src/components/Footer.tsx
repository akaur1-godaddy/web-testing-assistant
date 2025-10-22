import './Footer.css'

interface FooterProps {
    aiMetadata?: {
        confidenceScore: number
    }
}

function Footer({ aiMetadata }: FooterProps) {
    return (
        <footer className="footer">
            <div className="footer-container">
                <p>
                    🚀 Powered by Advanced AI & Machine Learning
                    {aiMetadata && (
                        <span className="footer-confidence"> • Confidence: {Math.round(aiMetadata.confidenceScore * 100)}%</span>
                    )}
                </p>
            </div>
        </footer>
    )
}

export default Footer
