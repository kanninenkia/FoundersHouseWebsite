/*
 * QuoteCard Component
 * Card with image background, name at bottom, quote above name
 * Animation now controlled by parent wrapper for 100% consistency
 */

import './QuoteCard.css'

interface QuoteCardProps {
  name: string
  quote: string
  imageUrl?: string
  nameColor?: 'white' | 'dark-red' | 'light-red'
}

export const QuoteCard = ({
  name,
  quote,
  imageUrl = '/images/LoadInImage-min.webp',
  nameColor = 'white'
}: QuoteCardProps) => {
  // Split name into first and last
  const nameParts = name.split(' ')
  const firstName = nameParts[0]
  const lastName = nameParts.slice(1).join(' ')

  // Determine color based on nameColor prop
  const getNameColor = () => {
    switch(nameColor) {
      case 'dark-red':
        return '#590D0F'
      case 'light-red':
        return '#9E1B1E'
      default:
        return '#FFFFFF'
    }
  }

  return (
    <div className="quote-card">
      {/* Image background */}
      <div
        className="quote-card-image"
        style={{ backgroundImage: `url(${imageUrl})` }}
      >
        {/* Dark overlay for text readability */}
        <div className="quote-card-overlay" />
      </div>

      {/* Content overlay */}
      <div className="quote-card-content">
        {/* Quote text - positioned above name */}
        <p className="quote-card-text">
          "{quote}"
        </p>

        {/* Name - bottom 18% of card, split into two lines */}
        <h3 className="quote-card-name" style={{ color: getNameColor() }}>
          <span className="name-first">{firstName}</span>
          <span className="name-last">{lastName}</span>
        </h3>
      </div>
    </div>
  )
}