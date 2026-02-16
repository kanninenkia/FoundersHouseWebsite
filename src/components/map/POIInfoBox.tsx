import { motion, AnimatePresence } from 'framer-motion'
import type { PointOfInterest } from '../../constants/poi'
import './POIInfoBox.css'

interface POIInfoBoxProps {
  poi: PointOfInterest | null
  onClose: () => void
}

export const POIInfoBox = ({ poi, onClose }: POIInfoBoxProps) => {
  return (
    <AnimatePresence>
      {poi && (
        <motion.div
          className="poi-info-box"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{
            duration: 0.4,
            ease: [0.22, 1, 0.36, 1]
          }}
        >
          <div className="poi-info-content">
            <div className="poi-info-logo">
              <img
                src={`/assets/logos/POIs/${poi.id}.png`}
                alt={`${poi.name} logo`}
                onError={(e) => {
                  // Fallback to placeholder if logo doesn't exist
                  e.currentTarget.style.display = 'none'
                }}
              />
            </div>
            <div className="poi-info-text">
              <h3 className="poi-info-title">{poi.name}</h3>
              <p className="poi-info-description">{poi.description}</p>
              {poi.website && (
                <a
                  href={poi.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="poi-info-link"
                >
                  Visit Website →
                </a>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default POIInfoBox
