<script>
	import { onMount } from 'svelte';

	const categories = [
		{ id: 'latest', label: 'Latest', icon: '⚡', url: 'https://cointelegraph.com/rss' },
		{ id: 'crypto', label: 'Crypto', icon: '₿', url: 'https://cointelegraph.com/rss/tag/bitcoin' },
		{ id: 'ai', label: 'AI & Tech', icon: '🤖', url: 'https://cointelegraph.com/rss/tag/artificial-intelligence' },
		{ id: 'finance', label: 'Markets', icon: '📈', url: 'https://cointelegraph.com/rss/tag/finance' }
	];

	const MARKET_IDS = [
		'bitcoin',
		'ethereum',
		'solana',
		'artificial-superintelligence-alliance',
		'bittensor',
		'dogwifcoin'
	];

	// ── COLOR SYSTEM (x402 style) ──
	const newsColors = [
		{ ring: 'ring-cyan-400',   text: 'text-cyan-400',   bg: 'bg-cyan-400/10',   border: 'border-cyan-400/30',   glow: 'shadow-[0_0_20px_rgba(34,211,238,0.3)]',   bar: 'bg-cyan-400'   },
		{ ring: 'ring-red-600',  text: 'text-red-500',  bg: 'bg-red-600/10',  border: 'border-red-600/35',  glow: 'shadow-[0_0_20px_rgba(220,38,38,0.22)]',   bar: 'bg-red-600'  },
		{ ring: 'ring-purple-400', text: 'text-purple-400', bg: 'bg-purple-400/10', border: 'border-purple-400/30', glow: 'shadow-[0_0_20px_rgba(192,132,252,0.3)]', bar: 'bg-purple-400' },
		{ ring: 'ring-amber-400',  text: 'text-amber-400',  bg: 'bg-amber-400/10',  border: 'border-amber-400/30',  glow: 'shadow-[0_0_20px_rgba(251,191,36,0.3)]',   bar: 'bg-amber-400'  },
		{ ring: 'ring-pink-400',   text: 'text-pink-400',   bg: 'bg-pink-400/10',   border: 'border-pink-400/30',   glow: 'shadow-[0_0_20px_rgba(244,114,182,0.3)]',  bar: 'bg-pink-400'   },
	];

	let activeCategory = $state(categories[0].id);
	let newsFeed = $state([]);
	let loading = $state(true);
	let errorState = $state(false);

	let marketData = $state([]);
	let marketLoading = $state(true);
	let marketError = $state('');

	let globalStats = $state(null);
	let globalLoading = $state(true);
	let globalError = $state('');

	let trendingCoins = $state([]);
	let trendingLoading = $state(true);
	let trendingError = $state('');

	let sidebarUpdatedAt = $state('');
	let sparklineData = $state(Array.from({ length: 12 }, () => Math.random() * 100));
	let newsSparkline = $state(Array.from({ length: 20 }, () => Math.random() * 60 + 20));

	let featuredNews = $derived(newsFeed.length > 0 ? newsFeed[0] : null);
	let listNews = $derived(newsFeed.slice(1));
	let secondaryStories = $derived(listNews.slice(0, 3));
	let moreStories = $derived(listNews.slice(3));

	let editionDate = $derived(
		new Intl.DateTimeFormat('en-US', {
			weekday: 'long',
			month: 'long',
			day: 'numeric',
			year: 'numeric'
		}).format(new Date())
	);

	const getCatColor = (str) => newsColors[str.length % newsColors.length];

	// ── FETCH FUNCTIONS ──
	async function fetchNews(categoryId) {
		loading = true;
		errorState = false;
		newsFeed = [];

		const category = categories.find((item) => item.id === categoryId) ?? categories[0];

		try {
			const endpoint = `/api/news?url=${encodeURIComponent(category.url)}`;
			const response = await fetch(endpoint);
			if (!response.ok) throw new Error(`News request failed with ${response.status}`);

			const data = await response.json();
			if (data.status !== 'ok') throw new Error('News feed returned a non-ok status');

			const wordCount = (text) => text?.split(/\s+/).length || 0;
			const readTime = (text) => Math.max(1, Math.ceil(wordCount(text) / 200));

			newsFeed = data.items.map((item, index) => {
				let thumbnail = item.enclosure?.link || '';
				if (!thumbnail && item.content) {
					const match = item.content.match(/src="([^"]+)"/);
					if (match) thumbnail = match[1];
				}

				const cleanDesc = item.description.replace(/<[^>]*>?/gm, '').trim();
				const fullText = item.content?.replace(/<[^>]*>?/gm, '') || cleanDesc;

				const publishedAt = new Date(item.pubDate);
				const ageSec = Math.max(0, Math.floor((Date.now() - publishedAt.getTime()) / 1000));
				let relativeStr = 'Just now';
				if (ageSec >= 86400) relativeStr = `${Math.floor(ageSec / 86400)}d ago`;
				else if (ageSec >= 3600) relativeStr = `${Math.floor(ageSec / 3600)}h ago`;
				else if (ageSec >= 60) relativeStr = `${Math.floor(ageSec / 60)}m ago`;

				return {
					id: `${categoryId}-${index}`,
					title: item.title,
					link: item.link,
					publishedAt,
					date: publishedAt.toLocaleDateString([], {
						weekday: 'short',
						month: 'short',
						day: 'numeric',
						year: 'numeric'
					}),
					time: publishedAt.toLocaleTimeString([], {
						hour: '2-digit',
						minute: '2-digit'
					}),
					relativeStr,
					author: item.author || 'Staff',
					categories: item.categories || [],
					desc: cleanDesc
						? `${cleanDesc.substring(0, 180)}...`
						: 'Open the article for the full breakdown.',
					thumbnail: thumbnail || `https://picsum.photos/seed/jamcat-news-${index}/600/400`,
					readTime: readTime(fullText),
					color: newsColors[index % newsColors.length]
				};
			});
		} catch (error) {
			console.error('Failed to fetch news:', error);
			errorState = true;
		} finally {
			loading = false;
		}
	}

	async function fetchMarketMovers({ silent = false } = {}) {
		if (!silent) marketLoading = true;
		marketError = '';

		try {
			const endpoint =
				`https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${MARKET_IDS.join(',')}` +
				'&order=market_cap_desc&per_page=6&page=1&sparkline=false&price_change_percentage=24h';
			const response = await fetch(endpoint);
			if (!response.ok) throw new Error(`Market request failed with ${response.status}`);

			const data = await response.json();
			marketData = data.map((asset, i) => ({
				id: asset.id,
				symbol: asset.symbol.toUpperCase(),
				name: asset.name,
				price: asset.current_price,
				change: asset.price_change_percentage_24h,
				vol: asset.total_volume,
				marketCap: asset.market_cap,
				rank: asset.market_cap_rank,
				image: asset.image,
				color: newsColors[i % newsColors.length],
				sparkline: Array.from({ length: 10 }, () => Math.random() * 100)
			}));
		} catch (error) {
			console.error('Markets fetch failed:', error);
			marketError = 'Live prices are temporarily unavailable.';
		} finally {
			marketLoading = false;
		}
	}

	async function fetchGlobalStats({ silent = false } = {}) {
		if (!silent) globalLoading = true;
		globalError = '';

		try {
			const response = await fetch('https://api.coingecko.com/api/v3/global');
			if (!response.ok) throw new Error(`Global request failed with ${response.status}`);

			const payload = await response.json();
			globalStats = {
				marketCap: payload.data?.total_market_cap?.usd ?? null,
				volume: payload.data?.total_volume?.usd ?? null,
				btcDominance: payload.data?.market_cap_percentage?.btc ?? null,
				marketCapChange: payload.data?.market_cap_change_percentage_24h_usd ?? null,
				activeCryptos: payload.data?.active_cryptocurrencies ?? null
			};
		} catch (error) {
			console.error('Global market fetch failed:', error);
			globalError = 'Global market pulse is unavailable.';
		} finally {
			globalLoading = false;
		}
	}

	async function fetchTrendingCoins({ silent = false } = {}) {
		if (!silent) trendingLoading = true;
		trendingError = '';

		try {
			const response = await fetch('https://api.coingecko.com/api/v3/search/trending');
			if (!response.ok) throw new Error(`Trending request failed with ${response.status}`);

			const payload = await response.json();
			trendingCoins = (payload.coins || []).slice(0, 6).map(({ item }, index) => ({
				id: item.id || `${item.name}-${index}`,
				name: item.name,
				symbol: item.symbol?.toUpperCase() || '--',
				rank: item.market_cap_rank ?? item.data?.market_cap_rank ?? '--',
				price:
					typeof item.data?.price === 'number'
						? item.data.price
						: typeof item.data?.price === 'string'
							? Number(item.data.price.replace(/[^0-9.-]/g, ''))
							: null,
				priceBtc: item.price_btc ?? item.data?.price_btc ?? null,
				image: item.small || item.thumb || '',
				link: item.slug
					? `https://www.coingecko.com/en/coins/${item.slug}`
					: 'https://www.coingecko.com',
				color: newsColors[index % newsColors.length]
			}));
		} catch (error) {
			console.error('Trending fetch failed:', error);
			trendingError = 'Trending radar is unavailable.';
		} finally {
			trendingLoading = false;
		}
	}

	async function refreshSidebarData({ silent = false } = {}) {
		await Promise.allSettled([
			fetchMarketMovers({ silent }),
			fetchGlobalStats({ silent }),
			fetchTrendingCoins({ silent })
		]);

		sidebarUpdatedAt = new Date().toLocaleTimeString([], {
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit'
		});
		sparklineData = sparklineData.map(() => Math.random() * 100);
		newsSparkline = newsSparkline.map(() => Math.random() * 60 + 20);
	}

	onMount(() => {
		fetchNews(activeCategory);
		refreshSidebarData();

		const sidebarPollId = setInterval(() => {
			refreshSidebarData({ silent: true });
		}, 60000);

		return () => clearInterval(sidebarPollId);
	});

	function handleCategoryClick(id) {
		if (id !== activeCategory) {
			activeCategory = id;
			fetchNews(id);
		}
	}

	// ── FORMATTERS ──
	const fmtPrice = (price) => {
		if (price === null || Number.isNaN(price)) return '--';
		if (price >= 1000) {
			return price.toLocaleString('en-US', {
				style: 'currency',
				currency: 'USD',
				minimumFractionDigits: 0,
				maximumFractionDigits: 0
			});
		}
		if (price >= 1) {
			return price.toLocaleString('en-US', {
				style: 'currency',
				currency: 'USD',
				minimumFractionDigits: 2,
				maximumFractionDigits: 2
			});
		}
		return `$${price.toPrecision(4)}`;
	};

	const fmtCompact = (value) => {
		if (value === null || Number.isNaN(value)) return '--';
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
			notation: 'compact',
			maximumFractionDigits: 2
		}).format(value);
	};

	const fmtVol = (value) => {
		if (value === null || Number.isNaN(value)) return '--';
		if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
		if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
		if (value >= 1e3) return `$${(value / 1e3).toFixed(1)}K`;
		return `$${value.toFixed(0)}`;
	};

	const fmtChange = (value) => {
		if (value === null || Number.isNaN(value)) return '--';
		return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
	};

	const fmtDominance = (value) => {
		if (value === null || Number.isNaN(value)) return '--';
		return `${value.toFixed(1)}%`;
	};
</script>

<svelte:head>
	<title>News | JamCat</title>
	<meta
		name="description"
		content="Crypto Alpha — live crypto and tech headlines with market movers, global pulse, and trending assets."
	/>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,600;0,6..72,700;1,6..72,400&family=Source+Sans+3:wght@400;500;600&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<!-- Editorial front page + data sidebars -->
<div class="news-page relative min-h-screen overflow-hidden bg-[#0a0a0a] text-white">
	<!-- Ambient background glows (broadcast red + neutral) -->
	<div class="pointer-events-none absolute inset-0 overflow-hidden">
		<div class="absolute -top-40 left-1/4 h-96 w-96 rounded-full bg-red-600/10 blur-[120px]"></div>
		<div class="absolute bottom-0 right-1/4 h-96 w-96 rounded-full bg-red-900/15 blur-[140px]"></div>
		<div class="absolute top-1/2 left-0 h-64 w-64 rounded-full bg-white/[0.03] blur-[100px]"></div>
	</div>

	<!-- Scanline overlay -->
	<div class="pointer-events-none absolute inset-0 opacity-[0.02]" style="background: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(204,0,0,0.35) 2px, rgba(204,0,0,0.35) 3px)"></div>

	<div class="relative mx-auto max-w-7xl px-3 pb-12 pt-4 sm:px-6 sm:pb-16 sm:pt-8 lg:px-10">
		<!-- ── Masthead ── -->
		<header class="news-masthead mb-4 border-b border-red-900/40 pb-3 sm:mb-8 sm:pb-6">
			<div class="mb-3 flex flex-col gap-2 sm:mb-4 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
				<div class="min-w-0">
					<p class="news-kicker font-mono text-[9px] font-semibold uppercase tracking-[0.28em] text-red-500 sm:text-[10px] sm:tracking-[0.35em]">
						JamCat · Digital edition
					</p>
					<h1 class="news-masthead-title mt-0.5 text-3xl font-semibold leading-[1.05] tracking-tight text-white sm:mt-1 sm:text-5xl">
						Crypto Alpha
					</h1>
					<div class="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[11px] text-slate-400 sm:mt-3 sm:gap-x-3 sm:text-xs">
						<time datetime={new Date().toISOString()} class="line-clamp-1 text-slate-300">{editionDate}</time>
						<span class="hidden sm:inline text-slate-600">·</span>
						<span class="rounded-sm border border-red-600/40 bg-red-600 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white sm:text-[10px]">
							Live
						</span>
					</div>
				</div>
				<p class="news-dek hidden max-w-md font-sans text-sm leading-relaxed text-slate-400 sm:block">
					Headlines from the feed, with market context in the rail—updated through the session.
				</p>
			</div>
			<div class="flex items-center gap-1.5 overflow-x-auto pb-1 font-mono [-ms-overflow-style:none] [scrollbar-width:none] sm:flex-wrap sm:gap-2 sm:overflow-visible sm:pb-0 [&::-webkit-scrollbar]:hidden">
				<span class="mr-0.5 shrink-0 text-[10px] font-bold uppercase tracking-widest text-slate-500 sm:mr-1">Desk</span>
				{#each categories as cat (cat.id)}
					<button type="button" onclick={() => handleCategoryClick(cat.id)} disabled={loading}
						class="group relative shrink-0 snap-start overflow-hidden rounded-lg border px-2.5 py-1.5 text-[10px] font-semibold transition-all duration-300 sm:px-3 sm:py-2 sm:text-[11px]
						{activeCategory === cat.id ? 'border-red-600/60 bg-red-600/15 text-white' : 'border-white/10 bg-white/[0.03] text-slate-400 hover:border-white/20 hover:bg-white/[0.06] hover:text-slate-200 disabled:opacity-50'}">
						<span class="relative z-10 flex items-center gap-1.5">
							<span aria-hidden="true">{cat.icon}</span>{cat.label}
						</span>
					</button>
				{/each}
			</div>
		</header>

		{#if loading}
			<div class="news-skeleton space-y-4 py-2 sm:space-y-8 sm:py-4">
				<div class="grid gap-3 sm:gap-6 lg:grid-cols-3">
					<div class="space-y-3 rounded-xl border border-white/10 bg-white/[0.02] p-3 sm:space-y-4 sm:p-5 lg:col-span-2">
						<div class="h-3 w-20 animate-pulse rounded bg-white/10 sm:h-4 sm:w-24"></div>
						<div class="h-36 animate-pulse rounded-lg bg-white/10 sm:h-48 md:h-56"></div>
						<div class="h-6 max-w-xl animate-pulse rounded bg-white/10 sm:h-8" style="width: 83%"></div>
						<div class="hidden h-4 w-full animate-pulse rounded bg-white/5 sm:block"></div>
						<div class="hidden h-4 w-4/5 animate-pulse rounded bg-white/5 sm:block"></div>
					</div>
					<div class="hidden space-y-3 sm:block">
						{#each [1, 2, 3] as _}
							<div class="rounded-xl border border-white/10 bg-white/[0.02] p-4">
								<div class="mb-2 h-3 w-20 animate-pulse rounded bg-white/10"></div>
								<div class="h-16 animate-pulse rounded bg-white/10"></div>
							</div>
						{/each}
					</div>
				</div>
				<p class="text-center font-mono text-xs text-slate-500">Loading latest stories…</p>
			</div>
		{:else if errorState}
			<div class="relative overflow-hidden rounded-2xl border border-red-500/20 bg-red-500/10 p-12 text-center backdrop-blur-sm">
				<div class="pointer-events-none absolute -right-20 -top-20 h-40 w-40 rounded-full bg-red-500/10 blur-3xl"></div>
				<div class="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl border border-red-500/30 bg-red-500/20 text-3xl">⚠️</div>
				<h2 class="text-xl font-bold text-red-400">Feed temporarily unavailable</h2>
				<p class="mt-2 text-sm text-slate-400">Our news sources are experiencing issues. Please try again in a moment.</p>
				<button onclick={() => fetchNews(activeCategory)} class="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 px-6 py-2.5 text-sm font-bold text-red-400 transition hover:bg-red-500/20">↻ Retry</button>
			</div>
		{:else}
			<!-- ── Market strip (dateline style) ── -->
			<div class="mb-4 font-mono sm:mb-8">
				<p class="mb-1.5 text-[9px] font-bold uppercase tracking-[0.2em] text-slate-500 sm:mb-2 sm:text-[10px] sm:tracking-[0.25em]">
					Markets at a glance
				</p>
				<div class="grid grid-cols-4 gap-1.5 sm:gap-3">
					{#each [
						{ label: 'Stories', value: newsFeed.length.toString(), hi: true, trend: '●', key: 'articles', icon: '📰' },
						{ label: 'Mkt cap', value: globalStats ? fmtCompact(globalStats.marketCap) : '--', trend: fmtChange(globalStats?.marketCapChange), key: 'cap', icon: '💎' },
						{ label: 'BTC dom.', value: globalStats ? fmtDominance(globalStats.btcDominance) : '--', trend: '↗', key: 'btc', icon: '₿' },
						{ label: 'Wire time', value: sidebarUpdatedAt || '—', trend: '●', key: 'time', icon: '⏱' },
					] as s (s.key)}
						<div class="group relative min-w-0 overflow-hidden rounded-lg border {s.hi ? 'border-red-600/35 bg-red-600/[0.08]' : 'border-white/[0.06] bg-white/[0.02]'} p-2 backdrop-blur-sm transition hover:border-white/10 sm:rounded-xl sm:p-3">
							<div class="mb-0.5 flex items-center justify-between gap-1 sm:mb-1 sm:gap-2">
								<p class="truncate text-[7px] uppercase tracking-wide text-slate-500 sm:text-[9px] sm:tracking-wider">{s.icon} {s.label}</p>
								<span class="shrink-0 text-[8px] font-bold text-red-400 sm:text-[9px]">{s.trend}</span>
							</div>
							<p class="truncate text-sm font-bold tracking-tight sm:text-lg {s.hi ? 'text-red-400' : 'text-white'}">{s.value}</p>
							<div class="mt-1.5 hidden h-5 items-end gap-px sm:flex sm:mt-2">
								{#each newsSparkline as height, idx (idx)}
									<div class="flex-1 rounded-sm bg-red-600/35 transition-all" style="height: {height}%"></div>
								{/each}
							</div>
						</div>
					{/each}
				</div>
			</div>

			<!-- ── Body ── -->
			<div class="flex flex-col gap-5 sm:gap-8 lg:flex-row lg:items-start">
				<!-- Main: editorial column -->
				<div class="news-editorial flex min-w-0 flex-1 flex-col gap-5 sm:gap-10">
					{#if featuredNews}
						<article class="news-hero relative overflow-hidden rounded-xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent shadow-[0_24px_80px_-24px_rgba(0,0,0,0.7)] sm:rounded-2xl">
							<a href={featuredNews.link} target="_blank" rel="noopener noreferrer" class="group block">
								<div class="relative aspect-[5/4] w-full max-h-[min(52vh,22rem)] overflow-hidden sm:max-h-none sm:aspect-[21/9]">
									<img
										src={featuredNews.thumbnail}
										alt=""
										class="h-full w-full object-cover transition duration-700 group-hover:scale-[1.03]"
									/>
									<div class="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/40 to-transparent"></div>
									<div class="absolute bottom-0 left-0 right-0 p-3 sm:p-8">
										<div class="mb-2 flex flex-wrap items-center gap-1.5 font-mono text-[9px] font-semibold uppercase tracking-wider text-red-400 sm:mb-3 sm:gap-2 sm:text-[10px]">
											<span class="rounded bg-red-600/90 px-1.5 py-0.5 text-white shadow-sm sm:px-2">Lead story</span>
											{#each featuredNews.categories.slice(0, 2) as cat}
												{@const catColor = getCatColor(cat)}
												<span class="rounded border border-white/15 bg-black/40 px-1.5 py-0.5 text-white/90 backdrop-blur-sm sm:px-2"
													>{cat}</span
												>
											{/each}
										</div>
										<h2 class="news-headline text-lg font-semibold leading-snug text-white sm:text-3xl md:text-4xl md:leading-[1.1]">
											{featuredNews.title}
										</h2>
										<p class="news-lead mt-2 hidden max-w-3xl font-sans text-sm leading-relaxed text-slate-200/90 sm:mt-3 sm:block sm:text-base">
											{featuredNews.desc}
										</p>
										<div class="news-byline mt-2 flex flex-wrap items-center gap-x-2 gap-y-0.5 font-mono text-[10px] text-slate-400 sm:mt-4 sm:gap-x-3 sm:gap-y-1 sm:text-[11px]">
											<span class="text-slate-300">{featuredNews.relativeStr}</span>
											<span class="hidden text-slate-600 sm:inline">·</span>
											<span class="hidden sm:inline">{featuredNews.date}</span>
											<span class="text-slate-600">·</span>
											<span>{featuredNews.readTime} min</span>
										</div>
									</div>
								</div>
							</a>
						</article>
					{/if}

					{#if secondaryStories.length}
						<section class="hidden md:block" aria-labelledby="more-headlines">
							<div class="mb-4 flex items-end justify-between gap-4 border-b border-white/10 pb-2">
								<h2 id="more-headlines" class="news-section-title text-lg font-semibold text-white sm:text-xl">
									More headlines
								</h2>
								<span class="font-mono text-[10px] uppercase tracking-widest text-slate-500">Front page</span>
							</div>
							<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
								{#each secondaryStories as item, index (item.id)}
									{@const itemColor = item.color}
									<a
										href={item.link}
										target="_blank"
										rel="noopener noreferrer"
										class="news-card group flex flex-col overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.02] transition duration-300 hover:border-white/15 hover:bg-white/[0.04]"
										style={`animation: fadeUp 0.45s ease-out ${index * 0.06}s backwards;`}
									>
										<div class="relative aspect-[16/10] overflow-hidden">
											<img
												src={item.thumbnail}
												alt=""
												class="h-full w-full object-cover transition duration-500 group-hover:scale-105"
												loading="lazy"
											/>
											<div class="absolute inset-0 bg-gradient-to-t from-[#0a0a0a]/90 to-transparent opacity-80"></div>
										</div>
										<div class="flex flex-1 flex-col p-4">
											<div class="mb-2 flex flex-wrap items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-wide text-slate-500">
												<span class={itemColor.text}>{item.relativeStr}</span>
												{#if item.categories.length}
													{@const catColor = getCatColor(item.categories[0])}
													<span class="rounded border {catColor.border} {catColor.bg} px-1.5 py-0.5 normal-case {catColor.text}"
														>{item.categories[0]}</span
													>
												{/if}
											</div>
											<h3 class="news-headline text-base font-semibold leading-snug text-white group-hover:text-red-300">
												{item.title}
											</h3>
											<p class="news-dek mt-2 line-clamp-2 flex-1 font-sans text-xs leading-relaxed text-slate-400">
												{item.desc}
											</p>
											<p class="news-byline mt-3 font-mono text-[10px] text-slate-500">
												{item.author} · {item.readTime} min read
											</p>
										</div>
									</a>
								{/each}
							</div>
						</section>
					{/if}

					{#if listNews.length}
						<section class="md:hidden" aria-labelledby="latest-mobile">
							<div class="mb-2 flex items-end justify-between gap-2 border-b border-white/10 pb-2">
								<h2 id="latest-mobile" class="news-section-title text-base font-semibold text-white">Latest</h2>
								<span class="font-mono text-[9px] uppercase tracking-widest text-slate-500">Newest first</span>
							</div>
							<ul class="divide-y divide-white/[0.06] border-t border-white/[0.06]">
								{#each listNews as item, index (item.id)}
									{@const itemColor = item.color}
									<li>
										<a
											href={item.link}
											target="_blank"
											rel="noopener noreferrer"
											class="group flex gap-3 py-3 transition-colors hover:bg-white/[0.02]"
											style={`animation: fadeUp 0.35s ease-out ${index * 0.03}s backwards;`}
										>
											<div class="relative h-16 w-20 shrink-0 overflow-hidden rounded-md border border-white/10">
												<img
													src={item.thumbnail}
													alt=""
													class="h-full w-full object-cover transition duration-300 group-hover:scale-105"
													loading="lazy"
												/>
											</div>
											<div class="min-w-0 flex-1">
												<div class="mb-0.5 flex flex-wrap items-center gap-1.5 font-mono text-[9px] font-semibold uppercase tracking-wide text-slate-500">
													<span class={itemColor.text}>{item.relativeStr}</span>
													{#if item.categories.length}
														{@const catColor = getCatColor(item.categories[0])}
														<span class="rounded border {catColor.border} {catColor.bg} px-1 py-0.5 normal-case {catColor.text}"
															>{item.categories[0]}</span
														>
													{/if}
												</div>
												<h3 class="news-headline line-clamp-2 text-sm font-semibold leading-snug text-white group-hover:text-red-300">
													{item.title}
												</h3>
												<p class="news-byline mt-1 font-mono text-[9px] text-slate-500">
													{item.readTime} min read
												</p>
											</div>
										</a>
									</li>
								{/each}
							</ul>
						</section>
					{/if}

					{#if moreStories.length}
						<section class="hidden md:block" aria-labelledby="wire-list">
							<div class="mb-4 flex items-end justify-between gap-4 border-b border-white/10 pb-2">
								<h2 id="wire-list" class="news-section-title text-lg font-semibold text-white sm:text-xl">
									The wire
								</h2>
								<span class="font-mono text-[10px] uppercase tracking-widest text-slate-500">Newest first</span>
							</div>
							<ul class="divide-y divide-white/[0.06] border-t border-white/[0.06]">
								{#each moreStories as item, index (item.id)}
									{@const itemColor = item.color}
									<li>
										<a
											href={item.link}
											target="_blank"
											rel="noopener noreferrer"
											class="group flex gap-4 py-4 transition-colors hover:bg-white/[0.02] sm:gap-5 sm:py-5"
											style={`animation: fadeUp 0.4s ease-out ${index * 0.04}s backwards;`}
										>
											<div class="relative h-20 w-24 shrink-0 overflow-hidden rounded-lg border border-white/10 sm:h-24 sm:w-28">
												<img
													src={item.thumbnail}
													alt=""
													class="h-full w-full object-cover transition duration-300 group-hover:scale-105"
													loading="lazy"
												/>
											</div>
											<div class="min-w-0 flex-1">
												<div class="mb-1 flex flex-wrap items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-wide text-slate-500">
													<span class={itemColor.text}>{item.date}</span>
													<span class="text-slate-600">·</span>
													<span>{item.relativeStr}</span>
													{#if item.categories.length}
														{@const catColor = getCatColor(item.categories[0])}
														<span class="rounded border {catColor.border} {catColor.bg} px-1.5 py-0.5 normal-case {catColor.text}"
															>{item.categories[0]}</span
														>
													{/if}
												</div>
												<h3 class="news-headline text-base font-semibold leading-snug text-white group-hover:text-red-300 sm:text-lg">
													{item.title}
												</h3>
												<p class="news-dek mt-1 line-clamp-2 font-sans text-sm text-slate-400">
													{item.desc}
												</p>
												<p class="news-byline mt-2 font-mono text-[10px] text-slate-500">
													{item.author} · {item.readTime} min read
												</p>
											</div>
										</a>
									</li>
								{/each}
							</ul>
						</section>
					{/if}
				</div>

				<!-- Right: data rail -->
				<div class="flex w-full shrink-0 flex-col gap-4 font-mono lg:w-72 xl:w-80">
					<!-- Market Pulse -->
					<div class="overflow-hidden rounded-2xl border border-white/5 bg-white/[0.015] backdrop-blur-sm">
						<div class="flex items-center justify-between border-b border-white/5 bg-black/20 px-4 py-3">
							<div class="flex items-center gap-2">
								<p class="text-sm font-bold text-white">🌍 Market Pulse</p>
								<span class="rounded-sm bg-red-600 px-2 py-0.5 text-[9px] font-black uppercase tracking-wide text-white shadow-[0_0_12px_rgba(220,38,38,0.45)]">Live</span>
							</div>
							<span class="text-[10px] text-slate-500">{sidebarUpdatedAt || '...'}</span>
						</div>

						{#if globalError}
							<div class="p-4 text-sm text-red-400">{globalError}</div>
						{:else if globalLoading}
							<div class="grid grid-cols-2 gap-2 p-3">
								{#each [1,2,3,4] as i}
									<div class="rounded-xl bg-white/5 p-3">
										<div class="h-2.5 w-14 animate-pulse rounded bg-white/10"></div>
										<div class="mt-2 h-5 w-16 animate-pulse rounded bg-white/10"></div>
									</div>
								{/each}
							</div>
						{:else if globalStats}
							<div class="grid grid-cols-2 gap-2 p-3">
								{#each [
									{ label: 'Total Cap', value: fmtCompact(globalStats.marketCap), icon: '💎', color: newsColors[0] },
									{ label: '24H Volume', value: fmtCompact(globalStats.volume), icon: '📊', color: newsColors[1] },
									{ label: 'BTC Dom', value: fmtDominance(globalStats.btcDominance), icon: '₿', color: newsColors[2] },
									{ label: '24H Chg', value: fmtChange(globalStats.marketCapChange), icon: globalStats.marketCapChange >= 0 ? '📈' : '📉', isChange: true }
								] as stat}
									<div class="rounded-xl border border-white/[0.06] {stat.color ? stat.color.bg : (stat.isChange && globalStats.marketCapChange >= 0 ? 'bg-sky-500/10 border-sky-500/25' : 'bg-red-600/10 border-red-600/25')} p-3 transition hover:border-white/10">
										<div class="mb-1 flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase">
											<span>{stat.icon}</span>{stat.label}
										</div>
										<p class="font-mono text-base font-black {stat.color ? stat.color.text : (stat.isChange ? (globalStats.marketCapChange >= 0 ? 'text-sky-400' : 'text-red-400') : 'text-white')}">{stat.value}</p>
									</div>
								{/each}
							</div>
							<div class="px-3 pb-3">
								<div class="flex items-end gap-0.5 h-8">
									{#each sparklineData as h}
										<div class="flex-1 rounded-t bg-red-600/40 transition-all" style="height: {h}%"></div>
									{/each}
								</div>
							</div>
						{/if}
					</div>

					<!-- Market Movers -->
					<div class="overflow-hidden rounded-2xl border border-white/5 bg-white/[0.015] backdrop-blur-sm">
						<div class="flex items-center justify-between border-b border-white/5 bg-black/20 px-4 py-3">
							<div class="flex items-center gap-2">
								<p class="text-sm font-bold text-white">📈 Movers</p>
							</div>
							<div class="flex h-2 w-2 rounded-full {marketLoading ? 'animate-pulse bg-amber-400' : 'bg-red-600 shadow-[0_0_10px_rgba(220,38,38,0.85)]'}"></div>
						</div>

						{#if marketError}
							<div class="p-4 text-sm text-red-400">{marketError}</div>
						{:else}
							<ul class="max-h-72 divide-y divide-white/[0.04] overflow-y-auto">
								{#each marketData as asset (asset.id)}
									<li class="group px-4 py-2.5 text-[11px] transition-colors hover:bg-white/[0.02]">
										<div class="flex items-center justify-between">
											<div class="flex items-center gap-2">
												<div class="h-8 w-8 rounded-full {asset.color.bg} border {asset.color.border} flex items-center justify-center shrink-0">
													<img src={asset.image} alt={asset.name} class="h-6 w-6 rounded-full object-cover" />
												</div>
												<div>
													<div class="flex items-center gap-1.5">
														<span class="font-bold {asset.color.text}">{asset.name}</span>
														<span class="text-slate-600">#{asset.rank}</span>
													</div>
													<div class="mt-1 flex items-end gap-px h-3 w-16">
														{#each asset.sparkline as h}
															<div class="flex-1 rounded-t {asset.change >= 0 ? 'bg-sky-500' : 'bg-red-500'}" style="height: {h}%"></div>
														{/each}
													</div>
												</div>
											</div>
											<div class="text-right">
												<p class="font-bold text-white">{fmtPrice(asset.price)}</p>
												<p class="mt-0.5 flex items-center justify-end gap-0.5 text-[10px] font-bold {asset.change >= 0 ? 'text-sky-400' : 'text-red-400'}">
													{asset.change >= 0 ? '▲' : '▼'}{fmtChange(asset.change)}
												</p>
											</div>
										</div>
									</li>
								{/each}
							</ul>
						{/if}
					</div>

					<!-- Trending Radar -->
					<div class="overflow-hidden rounded-2xl border border-white/5 bg-white/[0.015] backdrop-blur-sm">
						<div class="border-b border-white/5 bg-black/20 px-4 py-3">
							<div class="flex items-center gap-2">
								<p class="text-sm font-bold text-white">🔥 Trending</p>
							</div>
						</div>

						{#if trendingError}
							<div class="p-4 text-sm text-red-400">{trendingError}</div>
						{:else if trendingLoading}
							<div class="space-y-1.5 p-2">
								{#each [1,2,3,4,5] as i}
									<div class="rounded-xl bg-white/5 p-3">
										<div class="h-2.5 w-20 animate-pulse rounded bg-white/10"></div>
										<div class="mt-2 h-4 w-28 animate-pulse rounded bg-white/10"></div>
									</div>
								{/each}
							</div>
						{:else}
							<div class="divide-y divide-white/[0.04]">
								{#each trendingCoins as coin, i (coin.id)}
									{@const coinColor = coin.color}
									<a href={coin.link} target="_blank" rel="noreferrer"
										class="group flex items-center justify-between px-4 py-2.5 text-[11px] transition-colors hover:bg-white/[0.02]">
										<div class="flex items-center gap-2">
											<div class="relative">
												<div class="h-8 w-8 rounded-full {coinColor.bg} border {coinColor.border} flex items-center justify-center">
													<img src={coin.image} alt={coin.name} class="h-6 w-6 rounded-full object-cover" />
												</div>
												<span class="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[8px] font-black text-white">{i + 1}</span>
											</div>
											<div>
												<span class="font-bold {coinColor.text}">{coin.name}</span>
												<span class="ml-1.5 rounded border border-white/10 bg-white/5 px-1 py-0.5 text-[9px] text-slate-400">{coin.symbol}</span>
												<p class="text-[10px] text-slate-500">Rank #{coin.rank}</p>
											</div>
										</div>
										<div class="text-right">
											<p class="font-bold {coinColor.text}">{coin.price !== null ? fmtPrice(coin.price) : '--'}</p>
										</div>
									</a>
								{/each}
							</div>
						{/if}
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>

<style>
	.news-masthead-title,
	.news-headline,
	.news-section-title {
		font-family: 'Newsreader', Georgia, 'Times New Roman', serif;
	}

	.news-page,
	.news-dek,
	.news-lead {
		font-family: 'Source Sans 3', system-ui, -apple-system, sans-serif;
	}

	@keyframes fadeUp {
		from {
			opacity: 0;
			transform: translateY(20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
</style>
