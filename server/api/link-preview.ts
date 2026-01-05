export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const url = query.url as string

  if (!url) {
    throw createError({
      statusCode: 400,
      message: 'URL parameter is required'
    })
  }

  try {
    // Fetch the page
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; KatachiBot/1.0)'
      }
    })

    if (!response.ok) {
      throw new Error('Failed to fetch URL')
    }

    const html = await response.text()

    // Extract metadata using regex (simple approach)
    const metadata: any = {
      url,
      title: '',
      description: '',
      image: '',
      siteName: ''
    }

    // Open Graph tags
    const ogTitle = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']*)["']/i)
    const ogDescription = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']*)["']/i)
    const ogImage = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']*)["']/i)
    const ogSiteName = html.match(/<meta[^>]*property=["']og:site_name["'][^>]*content=["']([^"']*)["']/i)

    // Twitter Card tags (fallback)
    const twitterTitle = html.match(/<meta[^>]*name=["']twitter:title["'][^>]*content=["']([^"']*)["']/i)
    const twitterDescription = html.match(/<meta[^>]*name=["']twitter:description["'][^>]*content=["']([^"']*)["']/i)
    const twitterImage = html.match(/<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']*)["']/i)

    // Regular meta tags (fallback)
    const metaDescription = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i)
    const titleTag = html.match(/<title[^>]*>([^<]*)<\/title>/i)

    metadata.title = ogTitle?.[1] || twitterTitle?.[1] || titleTag?.[1] || 'No title'
    metadata.description = ogDescription?.[1] || twitterDescription?.[1] || metaDescription?.[1] || ''
    metadata.image = ogImage?.[1] || twitterImage?.[1] || ''
    metadata.siteName = ogSiteName?.[1] || new URL(url).hostname

    // Make image URL absolute if relative
    if (metadata.image && !metadata.image.startsWith('http')) {
      const urlObj = new URL(url)
      metadata.image = new URL(metadata.image, urlObj.origin).href
    }

    return metadata
  } catch (error) {
    console.error('Link preview error:', error)

    // Return basic metadata on error
    const urlObj = new URL(url)
    return {
      url,
      title: urlObj.hostname,
      description: 'Link preview unavailable',
      image: '',
      siteName: urlObj.hostname
    }
  }
})
