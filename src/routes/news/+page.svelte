<script>
	import { onMount } from 'svelte';

	let newsFeed = $state([]);
	let loading = $state(true);
	let errorState = $state(false);

	// The first item will be featured
	let featuredNews = $derived(newsFeed.length > 0 ? newsFeed[0] : null);
	// The rest go into the grid
	let gridNews = $derived(newsFeed.slice(1));

	onMount(async () => {
		try {
			const res = await fetch('https://api.rss2json.com/v1/api.json?rss_url=https://cointelegraph.com/rss');
			const data = await res.json();
			if (data.status === 'ok') {
				// Parse and format the RSS items
				newsFeed = data.items.map(item => {
					// Extract thumbnail from enclosure or content
					let thumb = item.enclosure?.link || '';
					if (!thumb && item.content) {
						const match = item.content.match(/src="([^"]+)"/);
						if (match) thumb = match[1];
					}
					
					// Clean HTML from description
					const cleanDesc = item.description.replace(/<[^>]*>?/gm, '').substring(0, 180) + '...';

					return {
						title: item.title,
						link: item.link,
						date: new Date(item.pubDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }),
						time: new Date(item.pubDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
						author: item.author || 'Cointelegraph',
						categories: item.categories || [],
						desc: cleanDesc,
						thumbnail: thumb || 'https://picsum.photos/seed/' + Math.random() + '/600/400'
					};
				});
			} else {
				throw new Error('API returned non-ok status');
			}
		} catch (err) {
			console.error('Failed to fetch news:', err);
			errorState = true;
		} finally {
			loading = false;
		}
	});

	// Colors for dynamic category tags
	const catColors = ['text-pink-400 bg-pink-400/10 border-pink-400/20', 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20', 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20', 'text-green-400 bg-green-400/10 border-green-400/20', 'text-purple-400 bg-purple-400/10 border-purple-400/20'];
	const getCatColor = (str) => catColors[str.length % catColors.length];
</script>

<svelte:head>
	<title>News | JamCat</title>
</svelte:head>

<div class="min-h-screen bg-[#0f1011] text-white">
	<div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

		<!-- Header -->
		<div class="mb-10 text-center sm:text-left">
			<h1 class="text-4xl font-black tracking-tight drop-shadow-md sm:text-5xl">📰 <span class="bg-gradient-to-r from-pink-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">Latest Intel</span></h1>
			<p class="mt-3 text-sm font-semibold text-slate-400 sm:text-base">Degen news, AI agents, and market alpha aggregated round the clock.</p>
		</div>

		{#if loading}
			<div class="flex h-64 flex-col items-center justify-center space-y-4">
				<div class="h-12 w-12 animate-spin rounded-full border-4 border-slate-700 border-t-pink-500"></div>
				<p class="font-bold tracking-widest text-slate-500 uppercase">Fetching the alpha...</p>
			</div>
		{:else if errorState}
			<div class="rounded-3xl border border-red-500/20 bg-red-500/10 p-10 text-center">
				<p class="mb-2 text-4xl">⚠️</p>
				<h2 class="text-xl font-bold text-red-400">Unable to load the news feed.</h2>
				<p class="mt-2 text-sm text-slate-400">The matrix is glitching. Please try again later.</p>
			</div>
		{:else}

			<!-- Featured Article Hero -->
			{#if featuredNews}
				<a href={featuredNews.link} target="_blank" rel="noopener noreferrer" class="group relative mb-8 flex flex-col overflow-hidden rounded-[2.5rem] border border-white/10 bg-black/50 transition-all duration-500 hover:-translate-y-1 hover:border-pink-500/40 hover:shadow-[0_0_40px_rgba(236,72,153,0.2)] lg:h-[480px] lg:flex-row shadow-2xl">
					
					<!-- Background Ambient Glow -->
					<div class="absolute -inset-40 z-0 bg-pink-500/10 blur-[100px] transition-all duration-700 group-hover:bg-purple-500/20"></div>

					<!-- Image Section -->
					<div class="relative h-64 w-full overflow-hidden lg:h-full lg:w-3/5">
						<img src={featuredNews.thumbnail} alt={featuredNews.title} class="absolute inset-0 h-full w-full object-cover transition-transform duration-1000 group-hover:scale-105" />
						<!-- Inner shadow overlay -->
						<div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent lg:bg-gradient-to-r lg:from-transparent lg:to-[#0f1011]"></div>
					</div>

					<!-- Content Section -->
					<div class="relative z-10 flex w-full flex-col justify-center p-8 lg:w-2/5 lg:p-12 backdrop-blur-sm">
						<div class="mb-4 flex flex-wrap items-center gap-2">
							<span class="rounded-full border border-pink-500/50 bg-pink-500/20 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-pink-400 shadow-[0_0_15px_rgba(236,72,153,0.3)] backdrop-blur-md">
								<span class="mr-1.5 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-pink-500"></span>Top Story
							</span>
							{#if featuredNews.categories.length > 0}
								<span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{featuredNews.categories[0]}</span>
							{/if}
						</div>
						<h2 class="mb-4 text-2xl font-black leading-tight text-white drop-shadow-md sm:text-3xl lg:text-4xl transition-colors group-hover:text-pink-100">{featuredNews.title}</h2>
						<p class="mb-6 line-clamp-3 text-sm font-medium leading-relaxed text-slate-300">{featuredNews.desc}</p>
						<div class="mt-auto flex items-center justify-between text-xs font-semibold text-slate-400">
							<span class="flex items-center gap-2">
								<span class="h-6 w-6 rounded-full bg-slate-800 flex items-center justify-center text-xs">✍️</span>
								{featuredNews.author}
							</span>
							<span>{featuredNews.date} • {featuredNews.time}</span>
						</div>
					</div>
				</a>
			{/if}

			<!-- Masonry/Grid Feed -->
			<div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:gap-8 mt-12">
				{#each gridNews as item, i}
					<a href={item.link} target="_blank" rel="noopener noreferrer" class="group relative flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl transition-all duration-300 hover:-translate-y-2 hover:border-white/30 hover:shadow-2xl hover:shadow-cyan-500/10" style="animation: fadeUp 0.6s ease-out {i * 0.1}s backwards;">
						
						<!-- Ambient hover glow -->
						<div class="absolute -right-20 -top-20 z-0 h-40 w-40 rounded-full bg-cyan-400/0 blur-[40px] transition-all duration-500 group-hover:bg-cyan-400/10 pointer-events-none"></div>

						<div class="relative h-48 w-full overflow-hidden border-b border-white/10">
							<img src={item.thumbnail} alt={item.title} class="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" loading="lazy" />
						</div>

						<div class="relative z-10 flex flex-1 flex-col p-6">
							<!-- Tags -->
							{#if item.categories.length > 0}
								<div class="mb-4 flex flex-wrap gap-2">
									{#each item.categories.slice(0, 2) as cat}
										<span class="rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-widest {getCatColor(cat)}">{cat}</span>
									{/each}
								</div>
							{/if}

							<h3 class="mb-3 text-lg font-extrabold leading-snug text-white transition-colors group-hover:text-transparent group-hover:bg-gradient-to-br group-hover:from-white group-hover:to-cyan-200 group-hover:bg-clip-text drop-shadow-sm">{item.title}</h3>
							<p class="mb-6 line-clamp-3 text-xs leading-relaxed text-slate-400 font-medium">{item.desc}</p>
							
							<!-- Footer -->
							<div class="mt-auto flex items-center justify-between border-t border-white/10 pt-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
								<span>{item.time}</span>
								<span>{item.author}</span>
							</div>
						</div>
					</a>
				{/each}
			</div>

		{/if}
	</div>
</div>

<style>
	@keyframes fadeUp {
		from { opacity: 0; transform: translateY(20px); }
		to { opacity: 1; transform: translateY(0); }
	}
</style>
