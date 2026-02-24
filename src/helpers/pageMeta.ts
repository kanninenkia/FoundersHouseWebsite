export interface PageMetaConfig {
  title: string
  description: string
  path: string
  image?: string
  robots?: string
  type?: string
}

const DEFAULT_SITE_URL = 'https://founders-house.fi'
const DEFAULT_OG_IMAGE = '/assets/images/events/The Legends Day.webp'

const resolveSiteUrl = (): string => {
  const envUrl = import.meta?.env?.VITE_SITE_URL
  if (typeof envUrl === 'string' && envUrl.length > 0) {
    return envUrl.replace(/\/+$/, '')
  }
  return DEFAULT_SITE_URL
}

const normalizeUrl = (siteUrl: string, pathOrUrl: string): string => {
  if (/^https?:\/\//i.test(pathOrUrl)) {
    return pathOrUrl
  }
  const path = pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`
  return `${siteUrl}${path}`
}

const upsertMetaTag = (attr: 'name' | 'property', key: string, content: string): void => {
  if (typeof document === 'undefined') return
  if (!content) return
  let tag = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`)
  if (!tag) {
    tag = document.createElement('meta')
    tag.setAttribute(attr, key)
    document.head.appendChild(tag)
  }
  tag.setAttribute('content', content)
}

const upsertLinkTag = (rel: string, href: string): void => {
  if (typeof document === 'undefined') return
  if (!href) return
  let tag = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`)
  if (!tag) {
    tag = document.createElement('link')
    tag.setAttribute('rel', rel)
    document.head.appendChild(tag)
  }
  tag.setAttribute('href', href)
}

export const applyPageMeta = (config: PageMetaConfig): void => {
  if (typeof document === 'undefined') return

  const siteUrl = resolveSiteUrl()
  const canonicalUrl = normalizeUrl(siteUrl, config.path)
  const ogImage = normalizeUrl(siteUrl, config.image ?? DEFAULT_OG_IMAGE)
  const robots = config.robots ?? 'index,follow'

  document.title = config.title

  upsertMetaTag('name', 'description', config.description)
  upsertMetaTag('name', 'robots', robots)

  upsertMetaTag('property', 'og:type', config.type ?? 'website')
  upsertMetaTag('property', 'og:title', config.title)
  upsertMetaTag('property', 'og:description', config.description)
  upsertMetaTag('property', 'og:url', canonicalUrl)
  upsertMetaTag('property', 'og:image', ogImage)

  upsertMetaTag('name', 'twitter:card', 'summary_large_image')
  upsertMetaTag('name', 'twitter:title', config.title)
  upsertMetaTag('name', 'twitter:description', config.description)
  upsertMetaTag('name', 'twitter:image', ogImage)

  upsertLinkTag('canonical', canonicalUrl)
}
