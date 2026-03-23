export async function GET({ url }) {
	const rssUrl = url.searchParams.get('url');

	if (!rssUrl) {
		return new Response(JSON.stringify({ error: 'Missing url parameter' }), {
			status: 400,
			headers: { 'Content-Type': 'application/json' }
		});
	}

	try {
		const response = await fetch(rssUrl, {
			headers: {
				'User-Agent': 'JamCat News Bot/1.0'
			},
			cf: { cacheTtl: 300 }
		});

		if (!response.ok) {
			return new Response(
				JSON.stringify({ error: `RSS fetch failed: ${response.status}` }),
				{ status: 502, headers: { 'Content-Type': 'application/json' } }
			);
		}

		const xmlText = await response.text();
		const items = parseRSS(xmlText);

		return new Response(JSON.stringify({ status: 'ok', items }), {
			headers: { 'Content-Type': 'application/json' }
		});
	} catch (error) {
		return new Response(
			JSON.stringify({ error: error.message || 'Failed to fetch RSS' }),
			{ status: 500, headers: { 'Content-Type': 'application/json' } }
		);
	}
}

function parseRSS(xml) {
	const items = [];
	const itemRegex = /<item[^>]*>[\s\S]*?<\/item>/gi;
	const itemsMatch = xml.match(itemRegex);

	if (!itemsMatch) return items;

	for (const itemXml of itemsMatch.slice(0, 20)) {
		const item = {};

		item.title = extractTag(itemXml, 'title') || 'Untitled';
		item.link = extractTag(itemXml, 'link') || '';
		item.pubDate = extractTag(itemXml, 'pubDate') || new Date().toISOString();
		item.author = extractTag(itemXml, 'author') || extractTag(itemXml, 'dc:creator') || 'Network';
		item.description = extractTag(itemXml, 'description') || '';

		// Extract categories
		const categoryMatches = itemXml.match(/<category[^>]*>([^<]*)<\/category>/gi);
		item.categories = categoryMatches
			? categoryMatches.map((m) => m.replace(/<[^>]+>/g, ''))
			: [];

		// Extract thumbnail from enclosure or content
		const enclosureMatch = itemXml.match(/<enclosure[^>]+url="([^"]+)"/i);
		item.enclosure = enclosureMatch ? { link: enclosureMatch[1] } : null;

		// Extract image from content if no enclosure
		if (!item.enclosure && item.description) {
			const imgMatch = item.description.match(/src="([^"]+\.(?:jpg|jpeg|png|gif|webp))"/i);
			if (imgMatch) {
				item.enclosure = { link: imgMatch[1] };
			}
		}

		items.push(item);
	}

	return items;
}

function extractTag(xml, tag) {
	const regex = new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`, 'i');
	const match = xml.match(regex);
	return match ? match[1].trim() : '';
}
