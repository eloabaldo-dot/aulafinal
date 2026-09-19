import { SearchImageItem } from '../types';
import { CURATED_IMAGE_DATABASE } from '../data/imageSearchData';

export interface SearchOptions {
  query: string;
  category?: string;
  orientation?: 'all' | 'landscape' | 'portrait' | 'square';
  source?: 'all' | 'Unsplash' | 'Pexels';
}

/**
 * Searches the image catalog and dynamically discovers relevant travel imagery.
 */
export async function searchImages(options: SearchOptions): Promise<SearchImageItem[]> {
  const { query, category = 'all', orientation = 'all', source = 'all' } = options;
  const cleanQuery = query.trim().toLowerCase();

  // 1. Filter local curated database
  let results = CURATED_IMAGE_DATABASE.filter((item) => {
    // Orientation filter
    if (orientation !== 'all' && item.orientation !== orientation) {
      return false;
    }

    // Source filter
    if (source !== 'all' && item.source !== source) {
      return false;
    }

    // Category filter
    if (category !== 'all' && item.category !== category) {
      return false;
    }

    // Query filter
    if (!cleanQuery) {
      return true;
    }

    const matchesTitle = item.title.toLowerCase().includes(cleanQuery);
    const matchesDesc = item.description.toLowerCase().includes(cleanQuery);
    const matchesCategory = item.category.toLowerCase().includes(cleanQuery);
    const matchesAuthor = item.author.toLowerCase().includes(cleanQuery);
    const matchesTags = item.tags.some((tag) => tag.toLowerCase().includes(cleanQuery) || cleanQuery.includes(tag.toLowerCase()));

    return matchesTitle || matchesDesc || matchesCategory || matchesAuthor || matchesTags;
  });

  // If user searched for a specific term and we have few or no matches, try external public query or semantic tag expansion
  if (cleanQuery && results.length < 3) {
    try {
      // Dynamic live search via Wikimedia Commons Travel / Unsplash public API
      const liveItems = await fetchLiveTravelImages(cleanQuery, orientation);
      if (liveItems.length > 0) {
        // Merge without duplicates
        const existingUrls = new Set(results.map((r) => r.url));
        for (const item of liveItems) {
          if (!existingUrls.has(item.url)) {
            results.push(item);
          }
        }
      }
    } catch {
      // Fallback gracefully to nearest curated matches
    }
  }

  // If still empty and cleanQuery is non-empty, provide best curated recommendations rather than dead-end
  if (results.length === 0 && cleanQuery) {
    results = CURATED_IMAGE_DATABASE.slice(0, 6);
  }

  // Sort by popularity (likes)
  return results.sort((a, b) => (b.likes || 0) - (a.likes || 0));
}

/**
 * Live search fallback for custom user queries using public image APIs.
 */
async function fetchLiveTravelImages(
  query: string,
  orientation: 'all' | 'landscape' | 'portrait' | 'square'
): Promise<SearchImageItem[]> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4000);

  try {
    const encoded = encodeURIComponent(query);
    const endpoint = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encoded}+travel+view&gsrlimit=8&prop=imageinfo&iiprop=url|size|extmetadata&format=json&origin=*`;

    const res = await fetch(endpoint, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) return [];
    const data = await res.json();

    if (!data.query || !data.query.pages) return [];

    const pages = Object.values(data.query.pages) as any[];
    const items: SearchImageItem[] = [];

    for (const p of pages) {
      if (p.imageinfo && p.imageinfo[0]) {
        const info = p.imageinfo[0];
        const url = info.url;
        const w = info.width || 1600;
        const h = info.height || 1060;

        // Skip non-image or svg formats
        if (!url || url.endsWith('.svg') || url.endsWith('.tif')) continue;

        let detectedOrientation: 'landscape' | 'portrait' | 'square' = 'landscape';
        if (w > h * 1.15) detectedOrientation = 'landscape';
        else if (h > w * 1.15) detectedOrientation = 'portrait';
        else detectedOrientation = 'square';

        if (orientation !== 'all' && detectedOrientation !== orientation) continue;

        const titleRaw = (p.title || query).replace(/^File:/, '').replace(/\.[^/.]+$/, '').replace(/_/g, ' ');
        const author = info.extmetadata?.Artist?.value
          ? info.extmetadata.Artist.value.replace(/<[^>]*>?/gm, '').trim().slice(0, 40)
          : 'Acervo Cultural Livre';

        items.push({
          id: `live-${p.pageid || Math.random().toString(36).slice(2, 8)}`,
          title: titleRaw.length > 50 ? `${titleRaw.slice(0, 47)}...` : titleRaw,
          description: `Imagem documental de alta resolução capturada para "${query}".`,
          source: 'Wikimedia',
          author: author || 'Fotógrafo Colaborador',
          url: url,
          thumbnailUrl: info.thumburl || url,
          downloadUrl: url,
          width: w,
          height: h,
          orientation: detectedOrientation,
          category: 'Cidades',
          tags: [query, 'viagem', 'documental'],
          likes: Math.floor(Math.random() * 400) + 150,
        });
      }
    }

    return items;
  } catch {
    clearTimeout(timeoutId);
    return [];
  }
}
