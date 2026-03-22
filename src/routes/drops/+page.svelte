<script>
	import { onMount } from 'svelte';
	import { fly, fade, scale } from 'svelte/transition';
	import { elasticOut } from 'svelte/easing';

	const DROPS = [
		{
			id: 1,
			title: 'Neon Genesis',
			artist: 'JamCat × HookLab',
			genre: 'Dark Trap',
			desc: 'An AI-generated dark trap anthem born from the bonding curve of $NEON. Limited to 69 editions. Each holder gets stems + lifetime royalties.',
			cover: { from: '#ff0080', via: '#7928ca', to: '#0070f3' },
			emoji: '🌌',
			price: 2.4,
			jamPrice: 12_000,
			edition: { total: 69,   sold: 61  },
			royalty: 8,  status: 'live',
			endsIn: 3 * 3600 + 22 * 60 + 14,
			plays: 18_420, bpm: 140, key: 'F# Min',
			stems: ['Drums', 'Bass', 'Synth', 'Vox'],
			preview: true, featured: true,
			floorChange: +14.2
		},
		{
			id: 2,
			title: 'Whisker Drift',
			artist: 'PurrFi & VisualSplice',
			genre: 'Lo-Fi Chill',
			desc: 'Melancholic lo-fi beats for diamond-pawed holders. Stems included. Perfect for late-night degen sessions.',
			cover: { from: '#f59e0b', via: '#d97706', to: '#92400e' },
			emoji: '🌙',
			price: 0.8,
			jamPrice: 4_200,
			edition: { total: 420,  sold: 387 },
			royalty: 5,  status: 'live',
			endsIn: 11 * 3600 + 7 * 60,
			plays: 42_100, bpm: 72, key: 'C Maj',
			stems: ['Piano', 'Drums', 'Bass'],
			preview: true, featured: false,
			floorChange: +3.1
		},
		{
			id: 3,
			title: 'Bored Cat Yacht Club',
			artist: 'BCYC Sound Labs',
			genre: 'Jazz Fusion',
			desc: 'Official soundtrack of the most exclusive cat club on Solana. Holders only. 10,000 unique traits, one legendary score.',
			cover: { from: '#1a1a2e', via: '#16213e', to: '#0f3460' },
			emoji: '🦧',
			price: 8.8,
			jamPrice: 44_000,
			edition: { total: 10_000, sold: 9_741 },
			royalty: 10, status: 'live',
			endsIn: 6 * 3600 + 14 * 60 + 33,
			plays: 210_000, bpm: 96, key: 'E♭ Maj',
			stems: ['Brass', 'Double Bass', 'Piano', 'Drums', 'Yacht FX'],
			preview: true, featured: false,
			floorChange: +28.6
		},
		{
			id: 4,
			title: 'Solana Sunrise',
			artist: 'SolDreamer',
			genre: 'Ambient House',
			desc: 'Sunrise vibes from the Solana mainnet. Long-form ambient with generative visuals.',
			cover: { from: '#06b6d4', via: '#0891b2', to: '#164e63' },
			emoji: '🌅',
			price: 3.2,
			jamPrice: 18_000,
			edition: { total: 33,   sold: 0   },
			royalty: 12, status: 'upcoming',
			endsIn: 26 * 3600,
			plays: 0, bpm: 124, key: 'A Maj',
			stems: ['Pad', 'Pluck', 'Kick', 'Arp', 'FX'],
			preview: false, featured: false,
			floorChange: 0
		},
		{
			id: 5,
			title: 'Moon Mission Vol. 2',
			artist: 'LamboFur Collective',
			genre: 'Phonk',
			desc: 'Aggressive phonk for aggressive trading sessions. Buy high, sell higher.',
			cover: { from: '#a855f7', via: '#7c3aed', to: '#4c1d95' },
			emoji: '🚀',
			price: 1.2,
			jamPrice: 6_500,
			edition: { total: 200,  sold: 144 },
			royalty: 7,  status: 'live',
			endsIn: 48 * 3600,
			plays: 31_200, bpm: 160, key: 'B Min',
			stems: ['808', 'Phonk Drums', 'Choir', 'Melody'],
			preview: true, featured: false,
			floorChange: -2.4
		},
		{
			id: 6,
			title: 'Diamond Paws',
			artist: 'WhiskerDAO',
			genre: 'Neo-Soul',
			desc: 'Smooth neo-soul for the most patient holders. 1-of-1. Never selling.',
			cover: { from: '#6ee7b7', via: '#34d399', to: '#065f46' },
			emoji: '💎',
			price: 12.0,
			jamPrice: 69_000,
			edition: { total: 1,    sold: 0   },
			royalty: 15, status: 'upcoming',
			endsIn: 72 * 3600,
			plays: 0, bpm: 88, key: 'G Maj',
			stems: ['Guitar', 'Rhodes', 'Bass', 'Drums', 'Strings', 'Brass'],
			preview: false, featured: false,
			floorChange: 0
		}
	];

	const BUYERS    = ['SolDegen','PinkPaw🐾','WhaleCat','MoonKitty','DegenApe','JamBandit','PounceFi','LamboFur','WhiskerDAO','PurrFi'];
	const SALE_DROPS = DROPS.filter(d => d.status !== 'upcoming');

	let salesFeed = $state(Array.from({ length: 10 }, (_, i) => {
		const d = SALE_DROPS[i % SALE_DROPS.length];
		return { id: Math.random(), buyer: BUYERS[i % BUYERS.length], drop: d.title, emoji: d.emoji, price: d.price, ago: Math.floor(Math.random() * 120) + 5 };
	}));

	function pushSale() {
		const d = SALE_DROPS[(Math.random() * SALE_DROPS.length) | 0];
		salesFeed = [
			{ id: Math.random(), buyer: BUYERS[(Math.random() * BUYERS.length) | 0], drop: d.title, emoji: d.emoji, price: d.price, ago: 0 },
			...salesFeed.slice(0, 14)
		];
	}

	let activeFilter  = $state('all');
	let searchQuery   = $state('');
	let sortBy        = $state('featured'); // featured | price-asc | price-desc | ending-soon | newest
	let selectedGenres = $state([]);
	let priceRange    = $state({ min: 0, max: 100 });
	const FILTERS = [
		{ key: 'all', label: 'All' }, { key: 'live', label: '🔴 Live' },
		{ key: 'upcoming', label: '⏳ Soon' }, { key: 'sold_out', label: '✅ Sold Out' }
	];
	const SORT_OPTIONS = [
		{ key: 'featured', label: '⭐ Featured' },
		{ key: 'price-asc', label: 'Price: Low to High' },
		{ key: 'price-desc', label: 'Price: High to Low' },
		{ key: 'ending-soon', label: '⏰ Ending Soon' },
		{ key: 'newest', label: '🆕 Newest' }
	];
	const GENRES = ['Dark Trap', 'Lo-Fi Chill', 'Jazz Fusion', 'Ambient House', 'Phonk', 'Neo-Soul'];

	// Derived filtered and sorted drops
	let filteredDrops = $derived.by(() => {
		let result = [...DROPS];
		
		// Status filter
		if (activeFilter !== 'all') {
			result = result.filter(d => d.status === activeFilter);
		}
		
		// Search filter
		if (searchQuery.trim()) {
			const q = searchQuery.toLowerCase();
			result = result.filter(d => 
				d.title.toLowerCase().includes(q) ||
				d.artist.toLowerCase().includes(q) ||
				d.genre.toLowerCase().includes(q)
			);
		}
		
		// Genre filter
		if (selectedGenres.length > 0) {
			result = result.filter(d => selectedGenres.includes(d.genre));
		}
		
		// Price range filter
		result = result.filter(d => d.price >= priceRange.min && d.price <= priceRange.max);
		
		return result;
	});
	
	// Sorted drops (after filtering)
	let visibleDrops = $derived.by(() => {
		const sorted = [...filteredDrops];
		switch (sortBy) {
			case 'price-asc':
				sorted.sort((a, b) => a.price - b.price);
				break;
			case 'price-desc':
				sorted.sort((a, b) => b.price - a.price);
				break;
			case 'ending-soon':
				sorted.sort((a, b) => timers[a.id - 1] - timers[b.id - 1]);
				break;
			case 'newest':
				sorted.sort((a, b) => b.id - a.id);
				break;
			default: // featured - keep original order with featured first
				sorted.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
				break;
		}
		return sorted;
	});
	
	// Non-featured drops for grid
	let gridDrops = $derived.by(() => visibleDrops.filter(d => !d.featured));
	
	// Active filter count for badge
	let activeFilterCount = $derived.by(() => {
		let count = 0;
		if (activeFilter !== 'all') count++;
		if (searchQuery.trim()) count++;
		if (selectedGenres.length > 0) count++;
		if (priceRange.min > 0 || priceRange.max < 100) count++;
		return count;
	});
	
	// Mobile states
	let showMobileFilters = $state(false);
	let isLoading = $state(false);

	function clearFilters() {
		activeFilter = 'all';
		searchQuery = '';
		selectedGenres = [];
		priceRange = { min: 0, max: 100 };
		sortBy = 'featured';
	}

	function toggleGenre(genre) {
		if (selectedGenres.includes(genre)) {
			selectedGenres = selectedGenres.filter(g => g !== genre);
		} else {
			selectedGenres = [...selectedGenres, genre];
		}
	}

	let playingId    = $state(null);
	function togglePlay(id) { playingId = playingId === id ? null : id; }

	let mintTarget   = $state(null);
	let mintStep     = $state('idle');
	let mintCurrency = $state('SOL');

	function openMint(drop) { if (drop.status !== 'live') return; mintTarget = drop; mintStep = 'idle'; }

	async function confirmMint() {
		mintStep = 'minting';
		await new Promise(r => setTimeout(r, 2200));
		mintStep = 'success';
		const d = DROPS.find(d => d.id === mintTarget.id);
		if (d) d.edition.sold = Math.min(d.edition.total, d.edition.sold + 1);
		await new Promise(r => setTimeout(r, 2000));
		mintTarget = null; mintStep = 'idle';
	}

	function fmtCountdown(secs) {
		if (secs <= 0) return 'Ended';
		const h = Math.floor(secs / 3600), m = Math.floor((secs % 3600) / 60), s = secs % 60;
		if (h > 0) return `${h}h ${String(m).padStart(2,'0')}m`;
		return `${String(m).padStart(2,'0')}m ${String(s).padStart(2,'0')}s`;
	}

	let timers    = $state(DROPS.map(d => d.endsIn));
	let totalVol  = $state(2_841.4);
	let totalMinted = $state(692);

	// collection stats
	let stats = $state({ floor: 0.8, vol24h: 142.6, owners: 1_204 });

	onMount(() => {
		const iv = setInterval(() => {
			timers = timers.map(t => Math.max(0, t - 1));
			if (Math.random() < 0.3) pushSale();
			totalVol    = +(totalVol + Math.random() * 1.8).toFixed(1);
			totalMinted += Math.random() < 0.08 ? 1 : 0;
			stats.vol24h = +(stats.vol24h + (Math.random() - 0.3) * 0.8).toFixed(1);
		}, 1000);
		return () => clearInterval(iv);
	});

	const TICKER  = '🎵 NFT MUSIC MARKETPLACE · AI-GENERATED STEMS · OWN THE TRACK · EARN ROYALTIES ON EVERY PLAY · LIMITED EDITIONS ON SOLANA · BORED CAT YACHT CLUB · ';
	const SS = { live: 'bg-red-500/15 text-red-400 border-red-500/25', upcoming: 'bg-sky-500/15 text-sky-400 border-sky-500/25', sold_out: 'bg-white/5 text-white/20 border-white/8' };
	const SL = { live: '● LIVE', upcoming: '◌ SOON', sold_out: '✓ SOLD OUT' };
</script>

<svelte:head><title>NFT Music | JamCat</title></svelte:head>

<!-- TICKER -->
<div class="overflow-hidden border-b border-white/5 bg-black/40 py-2.5 backdrop-blur-xl relative z-10">
	<div class="flex whitespace-nowrap" style="animation:marquee 38s linear infinite">
		{#each [TICKER,TICKER] as t}
			<span class="mr-0 text-[10px] font-black uppercase tracking-[0.3em] bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">{t}</span>
		{/each}
	</div>
</div>

<div class="relative min-h-screen overflow-hidden bg-[#080810]">

	<!-- Animated background orbs -->
	<div class="pointer-events-none fixed inset-0 overflow-hidden">
		<div class="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-purple-500/20 blur-[100px] animate-pulse"></div>
		<div class="absolute top-1/2 -right-20 h-80 w-80 rounded-full bg-pink-500/15 blur-[80px] animate-pulse" style="animation-delay:1s"></div>
		<div class="absolute -bottom-40 left-1/3 h-72 w-72 rounded-full bg-blue-500/10 blur-[90px] animate-pulse" style="animation-delay:2s"></div>
	</div>

	<!-- deep background gradient -->
	<div class="pointer-events-none absolute inset-0"
		 style="background:radial-gradient(ellipse 80% 50% at 50% -10%,rgba(168,85,247,.18),transparent),radial-gradient(ellipse 60% 40% at 80% 80%,rgba(236,72,153,.1),transparent)"></div>

	<!-- ══ FEATURED / HERO ══════════════════════════════════════ -->
	{#each DROPS.filter(d => d.featured) as drop (drop.id)}
		<div class="relative overflow-hidden" in:fade={{ duration: 600 }}>
			<!-- full-bleed gradient backdrop -->
			<div class="absolute inset-0 opacity-30"
				 style="background:linear-gradient(135deg,{drop.cover.from},{drop.cover.via},{drop.cover.to})"></div>
			<div class="absolute inset-0" style="background:linear-gradient(to top,#080810 0%,#080810 10%,transparent 60%)"></div>
			<!-- noise grain -->
			<div class="absolute inset-0 opacity-[0.03]" style="background-image:url('data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22200%22><filter id=%22n%22><feTurbulence type=%22fractalNoise%22 baseFrequency=%220.9%22 numOctaves=%224%22/></filter><rect width=%22200%22 height=%22200%22 filter=%22url(%23n)%22 opacity=%221%22/></svg>')"></div>

			<div class="relative mx-auto max-w-7xl px-4 pb-16 pt-12 sm:px-6 lg:px-10">
				<div class="grid items-center gap-10 lg:grid-cols-2">

					<!-- LEFT: info -->
					<div in:fly={{ x: -30, duration: 600, delay: 100 }}>
						<div class="mb-4 flex flex-wrap items-center gap-2">
							<span class="rounded-full bg-gradient-to-r from-purple-500 to-pink-500 px-3 py-1 text-[10px] font-black text-white shadow-lg shadow-purple-500/30">⭐ FEATURED DROP</span>
							<span class="rounded-full border px-2.5 py-1 text-[10px] font-black {SS[drop.status]}">{SL[drop.status]}</span>
						</div>

						<h1 class="mb-2 text-5xl font-black tracking-tighter text-white sm:text-6xl">{drop.title}</h1>
						<p class="mb-1 text-lg font-bold" style="color:{drop.cover.from}">by {drop.artist}</p>
						<p class="mb-1 text-[11px] font-black uppercase tracking-widest text-white/30">{drop.genre} · {drop.bpm} BPM · {drop.key}</p>

						<p class="mb-6 mt-4 max-w-md text-sm leading-relaxed text-white/50">{drop.desc}</p>

						<!-- stems -->
						<div class="mb-6 flex flex-wrap gap-2">
							{#each drop.stems as stem (stem)}
								<span class="rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-xs font-bold text-white/60 backdrop-blur-sm">🎚️ {stem}</span>
							{/each}
						</div>

						<!-- edition bar -->
						<div class="mb-6 max-w-sm">
							<div class="mb-2 flex justify-between text-xs">
								<span class="text-white/40">{drop.edition.sold} / {drop.edition.total} minted</span>
								<span class="font-black text-white">{Math.round((drop.edition.sold/drop.edition.total)*100)}% claimed</span>
							</div>
							<div class="h-2 overflow-hidden rounded-full bg-white/8">
								<div class="h-full rounded-full" style="width:{(drop.edition.sold/drop.edition.total)*100}%;background:linear-gradient(90deg,{drop.cover.from},{drop.cover.via})"></div>
							</div>
						</div>

						<!-- price + cta -->
						<div class="flex flex-wrap items-center gap-5">
							<div>
								<p class="text-[10px] text-white/30 uppercase tracking-widest">Price</p>
								<p class="text-4xl font-black text-white leading-none">{drop.price} <span class="text-2xl text-purple-300">SOL</span></p>
								<p class="text-xs text-white/30 mt-0.5">{drop.jamPrice.toLocaleString()} $JAM · {drop.royalty}% royalty</p>
							</div>
							<div class="flex flex-col gap-2">
								<button onclick={() => openMint(drop)}
									class="rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 px-8 py-3.5 text-sm font-black text-white shadow-xl shadow-purple-500/40 transition-all hover:scale-105 hover:shadow-purple-500/60 active:scale-95">
									🎵 Mint Now
								</button>
								<p class="text-center text-[10px] text-red-400 font-bold">⏳ {fmtCountdown(timers[drop.id-1])} left</p>
							</div>
						</div>
					</div>

					<!-- RIGHT: giant cover art -->
					<div class="flex justify-center" in:fly={{ x: 30, duration: 600, delay: 200 }}>
						<!-- card with float animation -->
						<div class="group relative" style="animation:float 6s ease-in-out infinite">
							<!-- outer glow ring -->
							<div class="absolute -inset-4 rounded-[2rem] opacity-40 blur-2xl transition-all duration-500 group-hover:opacity-70 group-hover:scale-105"
								 style="background:linear-gradient(135deg,{drop.cover.from},{drop.cover.via},{drop.cover.to});animation:pulse-glow 3s ease-in-out infinite"></div>

							<!-- card -->
							<div class="relative flex h-72 w-72 items-center justify-center overflow-hidden rounded-[2rem] sm:h-80 sm:w-80 transition-transform duration-500 group-hover:scale-[1.02]"
								 style="background:linear-gradient(145deg,{drop.cover.from},{drop.cover.via},{drop.cover.to});box-shadow:0 25px 50px -12px rgba(0,0,0,0.5)">
								<!-- inner noise -->
								<div class="absolute inset-0 opacity-10" style="background-image:url('data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%22100%22><filter id=%22n%22><feTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22/></filter><rect width=%22100%22 height=%22100%22 filter=%22url(%23n)%22/></svg>')"></div>
								<span class="relative z-10 text-[110px] drop-shadow-2xl transition-all duration-500 group-hover:scale-110 group-hover:rotate-3">{drop.emoji}</span>

								<!-- play button -->
								<button onclick={() => togglePlay(drop.id)}
									class="absolute bottom-4 right-4 flex h-12 w-12 items-center justify-center rounded-full bg-black/40 backdrop-blur-xl transition-all hover:scale-110 hover:bg-black/60 border border-white/20 hover:border-white/40">
									<span class="text-lg text-white">{playingId===drop.id?'⏸':'▶'}</span>
								</button>

								<!-- plays -->
								<div class="absolute top-4 left-4 rounded-full bg-black/40 px-3 py-1 backdrop-blur-xl border border-white/10">
									<span class="text-[10px] font-black text-white/70">▶ {drop.plays.toLocaleString()}</span>
								</div>

								<!-- playing wave -->
								{#if playingId === drop.id}
									<div class="absolute bottom-0 left-0 right-0 flex h-10 items-end justify-center gap-0.5 overflow-hidden bg-gradient-to-t from-black/70 to-transparent px-4 pb-2">
										{#each Array(20) as _, k}
											<div class="w-1 rounded-t bg-white/60"
												 style="height:{25+Math.sin(k*0.7)*20}%;animation:waveBar {0.35+k*0.04}s ease-in-out infinite alternate"></div>
										{/each}
									</div>
								{/if}
							</div>

							<!-- edition pill below card -->
							<div class="absolute -bottom-4 left-1/2 -translate-x-1/2 rounded-full border border-white/15 bg-black/70 px-4 py-1.5 backdrop-blur-xl whitespace-nowrap shadow-xl">
								<span class="text-[11px] font-black text-white">{drop.edition.sold}/{drop.edition.total}</span>
								<span class="text-[11px] text-white/40"> editions minted</span>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	{/each}

	<!-- ══ COLLECTION STATS BAR ═════════════════════════════════ -->
	<div class="border-y border-white/5 bg-black/20 backdrop-blur-2xl" in:fly={{ y: 10, duration: 400, delay: 300 }}>
		<div class="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-10">
			{#each [
				{ label: 'Floor Price', val: `${stats.floor} SOL`,           sub: '',          color: 'text-white',        icon: '📊' },
				{ label: '24h Volume',  val: `${stats.vol24h} SOL`,           sub: '+12.4%',    color: 'text-emerald-400',  icon: '📈' },
				{ label: 'Total Vol',   val: `${totalVol.toFixed(1)} SOL`,    sub: 'all-time',  color: 'text-white',        icon: '💎' },
				{ label: 'Items',       val: DROPS.reduce((s,d)=>s+d.edition.total,0).toLocaleString(), sub: 'total editions', color: 'text-white', icon: '🎵' },
				{ label: 'Minted',      val: totalMinted.toLocaleString(),    sub: 'holders',   color: 'text-purple-300',   icon: '👥' },
				{ label: 'Owners',      val: stats.owners.toLocaleString(),   sub: 'unique',    color: 'text-white',        icon: '🔥' }
			] as s}
				<div class="text-center group cursor-default">
					<p class="text-[10px] uppercase tracking-widest text-white/30 mb-1">{s.label}</p>
					<p class="text-sm font-black {s.color} transition-transform duration-200 group-hover:scale-110">
						<span class="mr-1 text-xs">{s.icon}</span>{s.val}
						{#if s.sub}<span class="text-[9px] text-white/25 font-normal ml-1">{s.sub}</span>{/if}
					</p>
				</div>
			{/each}
		</div>
	</div>

	<!-- ══ MARKETPLACE GRID ══════════════════════════════════════ -->
	<div class="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-10">
		<div class="flex flex-col gap-8 lg:flex-row">

			<!-- LEFT -->
			<div class="min-w-0 flex-1">

				<!-- Search & Filter Bar -->
				<div class="mb-6 space-y-4" in:fly={{ y: -20, duration: 400 }}>
					<!-- Search + Sort Row -->
					<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
						<!-- Search Input -->
						<div class="relative flex-1 max-w-md">
							<svg class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
							</svg>
							<input
								type="text"
								placeholder="Search drops, artists, genres..."
								bind:value={searchQuery}
								class="w-full rounded-xl border border-white/10 bg-white/5 pl-10 pr-4 py-2.5 text-sm text-white placeholder-white/30 outline-none transition-all focus:border-purple-500/50 focus:bg-white/8"
							/>
							{#if searchQuery}
								<button onclick={() => searchQuery = ''} class="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
									<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
									</svg>
								</button>
							{/if}
						</div>
						
						<!-- Sort Dropdown -->
						<div class="flex items-center gap-2">
							<select bind:value={sortBy} class="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-white/70 outline-none transition-all hover:border-white/20 focus:border-purple-500/50 cursor-pointer">
								{#each SORT_OPTIONS as opt}
									<option value={opt.key}>{opt.label}</option>
								{/each}
							</select>
							
							<!-- Mobile Filter Toggle -->
							<button onclick={() => showMobileFilters = !showMobileFilters} class="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-white/70 transition-all hover:border-white/20 lg:hidden">
								<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path>
								</svg>
								Filters {#if activeFilterCount > 0}<span class="ml-1 rounded-full bg-purple-500 px-1.5 py-0.5 text-[9px] text-white">{activeFilterCount}</span>{/if}
							</button>
						</div>
					</div>
					
					<!-- Filter Pills -->
					<div class="flex flex-wrap items-center gap-2">
						<!-- Status Filters -->
						{#each FILTERS as f (f.key)}
							<button onclick={() => activeFilter = f.key}
								class="rounded-full border px-3 py-1.5 text-xs font-black transition-all duration-150
									   {activeFilter===f.key
									     ? 'border-purple-400 bg-purple-400 text-black shadow-lg shadow-purple-400/25'
									     : 'border-white/8 bg-white/3 text-white/35 hover:border-purple-400/40 hover:text-purple-300'}">
								{f.label}
							</button>
						{/each}
						
						<div class="h-5 w-px bg-white/10 mx-1"></div>
						
						<!-- Genre Pills -->
						{#each GENRES as genre}
							<button onclick={() => toggleGenre(genre)}
								class="rounded-full border px-2.5 py-1 text-[11px] font-bold transition-all duration-150
									   {selectedGenres.includes(genre)
									     ? 'border-emerald-400/50 bg-emerald-400/15 text-emerald-300'
									     : 'border-white/8 bg-white/3 text-white/35 hover:border-white/20 hover:text-white/60'}">
								{genre}
							</button>
						{/each}
						
						<div class="flex-1"></div>
						
						<!-- Results Count -->
						<span class="text-xs text-white/30">{visibleDrops.length} drops</span>
						
						<!-- Clear Filters -->
						{#if activeFilterCount > 0}
							<button onclick={clearFilters} class="flex items-center gap-1 text-[11px] text-white/40 hover:text-white/70 transition-colors">
								<svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
								</svg>
								Clear
							</button>
						{/if}
					</div>
				</div>

				<!-- grid -->
				<div class="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
					{#if isLoading}
						<!-- Skeleton Loaders -->
						{#each Array(6) as _, i}
							<div class="flex flex-col overflow-hidden rounded-2xl border border-white/6 bg-[#0e0e18]">
								<div class="aspect-square animate-pulse bg-white/5"></div>
								<div class="p-4 space-y-3">
									<div class="h-4 w-3/4 animate-pulse rounded bg-white/5"></div>
									<div class="h-3 w-1/2 animate-pulse rounded bg-white/5"></div>
									<div class="h-2 w-full animate-pulse rounded bg-white/5"></div>
								</div>
							</div>
						{/each}
					{:else if gridDrops.length === 0}
						<!-- Empty State -->
						<div class="col-span-full flex flex-col items-center justify-center py-20 text-center">
							<div class="mb-4 text-6xl">🔍</div>
							<h3 class="mb-2 text-lg font-bold text-white">No drops found</h3>
							<p class="mb-6 max-w-sm text-sm text-white/40">
								Try adjusting your filters or search query to find what you're looking for.
							</p>
							<button onclick={clearFilters} class="rounded-xl bg-purple-500 px-6 py-2.5 text-sm font-bold text-white transition-all hover:bg-purple-400 hover:scale-105">
								Clear all filters
							</button>
						</div>
					{:else}
						{#each gridDrops as drop, i (drop.id)}
						<div class="group relative flex flex-col overflow-hidden rounded-2xl border border-white/6 bg-[#0e0e18]/80 transition-all duration-500 hover:-translate-y-2 hover:border-purple-500/30 hover:shadow-[0_20px_60px_rgba(168,85,247,.2)]"
							 style="transform-style:preserve-3d"
							 in:fly={{ y: 24, duration: 350, delay: i*55 }}>

							<!-- COVER -->
							<div class="relative aspect-square overflow-hidden"
								 style="background:linear-gradient(145deg,{drop.cover.from},{drop.cover.via},{drop.cover.to})">

								<!-- noise overlay -->
								<div class="absolute inset-0 opacity-[0.07]" style="background-image:url('data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%22100%22><filter id=%22n%22><feTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22/></filter><rect width=%22100%22 height=%22100%22 filter=%22url(%23n)%22/></svg>')"></div>

								<!-- emoji -->
								<div class="absolute inset-0 flex items-center justify-center">
									<span class="text-[72px] drop-shadow-xl transition-transform duration-500 group-hover:scale-110">{drop.emoji}</span>
								</div>

								<!-- hover overlay with quick info -->
								<div class="absolute inset-0 flex flex-col items-center justify-center bg-black/0 transition-all duration-300 group-hover:bg-black/50">
									<div class="flex translate-y-3 flex-col items-center gap-2 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
										{#if drop.status === 'live'}
											<button onclick={() => openMint(drop)}
												class="rounded-xl bg-white px-5 py-2 text-xs font-black text-black transition hover:scale-105">
												Mint {drop.price} SOL
											</button>
										{/if}
										{#if drop.preview}
											<button onclick={(e) => { e.stopPropagation(); togglePlay(drop.id); }}
												class="flex items-center gap-1.5 rounded-full border border-white/30 bg-white/10 px-4 py-1.5 text-xs font-bold text-white backdrop-blur-xl transition hover:bg-white/20">
												{playingId===drop.id ? '⏸ Stop' : '▶ Preview'}
											</button>
										{/if}
									</div>
								</div>

								<!-- top badges -->
								<div class="absolute top-2.5 left-2.5 flex flex-col gap-1">
									<span class="rounded-full border px-2 py-0.5 text-[9px] font-black {SS[drop.status]}">{SL[drop.status]}</span>
									{#if drop.edition.total === 1}
										<span class="rounded-full bg-gradient-to-r from-yellow-400 to-amber-500 px-2 py-0.5 text-[9px] font-black text-black">1 OF 1</span>
									{/if}
								</div>

								<!-- plays top right -->
								{#if drop.plays > 0}
									<div class="absolute top-2.5 right-2.5 rounded-full bg-black/50 px-2 py-0.5 backdrop-blur-xl">
										<span class="text-[9px] font-bold text-white/60">▶ {(drop.plays/1000).toFixed(0)}K</span>
									</div>
								{/if}

								<!-- playing waveform -->
								{#if playingId === drop.id}
									<div class="absolute bottom-0 left-0 right-0 flex h-8 items-end justify-center gap-0.5 overflow-hidden bg-gradient-to-t from-black/80 to-transparent px-3 pb-1">
										{#each Array(18) as _, k}
											<div class="w-0.5 rounded-t bg-white/70"
												 style="height:{20+Math.sin(k*0.7)*18}%;animation:waveBar {0.35+k*0.04}s ease-in-out infinite alternate"></div>
										{/each}
									</div>
								{/if}

								<!-- floor change badge -->
								{#if drop.floorChange !== 0}
									<div class="absolute bottom-2.5 right-2.5">
										<span class="rounded-full px-2 py-0.5 text-[9px] font-black
											   {drop.floorChange > 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}">
											{drop.floorChange > 0 ? '↑' : '↓'} {Math.abs(drop.floorChange)}%
										</span>
									</div>
								{/if}
							</div>

							<!-- BODY -->
							<div class="flex flex-1 flex-col p-4">
								<div class="mb-3">
									<div class="flex items-start justify-between gap-1">
										<h3 class="font-black leading-tight text-white">{drop.title}</h3>
										<span class="shrink-0 text-[9px] font-bold text-white/20">{drop.royalty}% roy.</span>
									</div>
									<p class="mt-0.5 text-xs text-white/35">{drop.artist}</p>
									<p class="mt-0.5 text-[9px] font-black uppercase tracking-widest text-white/20">{drop.genre} · {drop.bpm} BPM · {drop.key}</p>
								</div>

								<!-- stems mini -->
								<div class="mb-3 flex flex-wrap gap-1">
									{#each drop.stems.slice(0,3) as s (s)}
										<span class="rounded-md bg-white/4 px-1.5 py-0.5 text-[9px] text-white/30">{s}</span>
									{/each}
									{#if drop.stems.length > 3}
										<span class="rounded-md bg-white/4 px-1.5 py-0.5 text-[9px] text-white/20">+{drop.stems.length-3}</span>
									{/if}
								</div>

								<!-- edition progress -->
								<div class="mb-4">
									<div class="mb-1 flex justify-between text-[9px] text-white/25">
										<span>{drop.edition.sold.toLocaleString()} / {drop.edition.total.toLocaleString()}</span>
										{#if drop.status==='live'}
											<span class="font-black text-red-400">{fmtCountdown(timers[drop.id-1])}</span>
										{:else if drop.status==='upcoming'}
											<span class="text-sky-400">in {fmtCountdown(timers[drop.id-1])}</span>
										{/if}
									</div>
									<div class="h-1 overflow-hidden rounded-full bg-white/5">
										{#if drop.edition.sold > 0}
											<div class="h-full rounded-full transition-all duration-700"
												 style="width:{(drop.edition.sold/drop.edition.total)*100}%;background:linear-gradient(90deg,{drop.cover.from},{drop.cover.via})"></div>
										{/if}
									</div>
								</div>

								<!-- price row -->
								<div class="mt-auto flex items-center justify-between border-t border-white/5 pt-3">
									<div>
										<p class="text-[9px] uppercase tracking-widest text-white/25">Price</p>
										<p class="text-base font-black leading-none text-white">{drop.price} <span class="text-xs text-purple-300">SOL</span></p>
									</div>
									{#if drop.status==='live'}
										<button onclick={() => openMint(drop)}
											class="rounded-xl border border-purple-500/30 bg-purple-500/12 px-4 py-2 text-xs font-black text-purple-300 transition-all hover:bg-purple-500/25 hover:scale-105 active:scale-95">
											Mint →
										</button>
									{:else if drop.status==='upcoming'}
										<button class="rounded-xl border border-sky-500/25 bg-sky-500/8 px-4 py-2 text-xs font-black text-sky-400 transition hover:bg-sky-500/15">
											Notify
										</button>
									{:else}
										<span class="rounded-xl bg-white/4 px-4 py-2 text-xs font-black text-white/20">Sold Out</span>
									{/if}
								</div>
							</div>
						</div>
						{/each}
					{/if}
				</div>
			</div>

			<!-- RIGHT SIDEBAR -->
			<div class="w-full lg:w-64 lg:shrink-0">
				<div class="flex flex-col gap-4 lg:sticky lg:top-20">

					<!-- how it works -->
					<div class="rounded-2xl border border-white/6 bg-[#0e0e18] p-4" in:fly={{ x: 20, duration: 400, delay: 100 }}>
						<p class="mb-4 text-[10px] font-black uppercase tracking-widest text-white/25">How It Works</p>
						{#each [
							{ n:'01', t:'AI creates the track', d:'HookLab generates stems, mix & master.' },
							{ n:'02', t:'Limited editions drop', d:'Only X copies. First come, first served.' },
							{ n:'03', t:'Own the stems',         d:'Download & use commercially forever.' },
							{ n:'04', t:'Earn royalties',        d:'% of all future plays flows to holders.' }
						] as s}
							<div class="mb-3 flex gap-3 last:mb-0">
								<span class="mt-0.5 shrink-0 font-mono text-[10px] font-black text-purple-400/60">{s.n}</span>
								<div>
									<p class="text-xs font-bold text-white/60">{s.t}</p>
									<p class="text-[10px] text-white/25">{s.d}</p>
								</div>
							</div>
						{/each}
					</div>

					<!-- top collectors -->
					<div class="rounded-2xl border border-amber-400/12 bg-amber-400/4 p-4" in:fly={{ x: 20, duration: 400, delay: 160 }}>
						<p class="mb-3 text-[10px] font-black uppercase tracking-widest text-amber-400/70">🏆 Top Collectors</p>
						{#each [
							{ name:'WhaleCat',  held:14, spent:38.4 },
							{ name:'SolDegen',  held:9,  spent:21.6 },
							{ name:'PinkPaw🐾', held:7,  spent:18.2 },
							{ name:'MoonKitty', held:5,  spent:12.0 },
							{ name:'LamboFur',  held:4,  spent:9.6  }
						] as c, i}
							<div class="mb-2 flex items-center justify-between gap-2 last:mb-0">
								<div class="flex items-center gap-2">
									<span class="w-4 text-center font-mono text-[10px] font-black {i===0?'text-amber-400':i===1?'text-white/40':'text-white/15'}">{i+1}</span>
									<span class="text-xs font-bold text-white/50">{c.name}</span>
								</div>
								<div class="text-right">
									<p class="text-[11px] font-black text-white/70">{c.held} <span class="text-white/25 font-normal text-[9px]">nfts</span></p>
									<p class="text-[9px] text-white/20">{c.spent} SOL</p>
								</div>
							</div>
						{/each}
					</div>

					<!-- live sales -->
					<div class="rounded-2xl border border-white/6 bg-[#0e0e18] p-4" in:fly={{ x: 20, duration: 400, delay: 220 }}>
						<div class="mb-3 flex items-center gap-2">
							<span class="relative flex h-1.5 w-1.5">
								<span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-purple-400 opacity-75"></span>
								<span class="relative inline-flex h-1.5 w-1.5 rounded-full bg-purple-400"></span>
							</span>
							<p class="text-[10px] font-black uppercase tracking-widest text-white/25">Live Sales</p>
						</div>
						<div class="max-h-64 space-y-1.5 overflow-y-auto">
							{#each salesFeed as entry (entry.id)}
								<div class="flex items-center justify-between gap-2 rounded-xl border border-white/4 bg-white/2 px-3 py-2"
									 in:fly={{ x: 8, duration: 200 }}>
									<div class="flex items-center gap-1.5 min-w-0">
										<span class="text-sm shrink-0">{entry.emoji}</span>
										<div class="min-w-0">
											<p class="truncate text-[10px] font-bold text-white/50">{entry.buyer}</p>
											<p class="truncate text-[9px] text-white/20">"{entry.drop}"</p>
										</div>
									</div>
									<div class="shrink-0 text-right">
										<p class="text-[11px] font-black text-purple-300">{entry.price} SOL</p>
										<p class="text-[9px] text-white/15">{entry.ago===0?'now':`${entry.ago}s`}</p>
									</div>
								</div>
							{/each}
						</div>
					</div>

				</div>
			</div>
		</div>
	</div>
</div>

<!-- ══ MOBILE FILTER DRAWER ════════════════════════════════════ -->
{#if showMobileFilters}
	<button onclick={() => showMobileFilters = false}
		class="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm lg:hidden"
		in:fade={{ duration: 200 }} aria-label="Close filters"></button>
	
	<div class="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl border-t border-white/10 bg-[#0c0a1a] p-6 lg:hidden"
		 in:fly={{ y: 100, duration: 300, easing: cubicOut }}>
		<div class="mb-4 flex items-center justify-between">
			<h3 class="text-lg font-bold text-white">Filters</h3>
			<button onclick={() => showMobileFilters = false} class="rounded-full bg-white/5 p-2 text-white/50 transition hover:bg-white/10 hover:text-white">
				<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
				</svg>
			</button>
		</div>
		
		<!-- Mobile Status Filters -->
		<div class="mb-4">
			<p class="mb-2 text-xs font-bold uppercase tracking-wider text-white/30">Status</p>
			<div class="flex flex-wrap gap-2">
				{#each FILTERS as f}
					<button onclick={() => activeFilter = f.key}
						class="rounded-full border px-4 py-2 text-sm font-bold transition-all
							   {activeFilter===f.key
							     ? 'border-purple-400 bg-purple-400 text-black'
							     : 'border-white/10 bg-white/5 text-white/60'}">
						{f.label}
					</button>
				{/each}
			</div>
		</div>
		
		<!-- Mobile Genre Filters -->
		<div class="mb-4">
			<p class="mb-2 text-xs font-bold uppercase tracking-wider text-white/30">Genres</p>
			<div class="flex flex-wrap gap-2">
				{#each GENRES as genre}
					<button onclick={() => toggleGenre(genre)}
						class="rounded-full border px-3 py-1.5 text-xs font-bold transition-all
							   {selectedGenres.includes(genre)
							     ? 'border-emerald-400/50 bg-emerald-400/15 text-emerald-300'
							     : 'border-white/10 bg-white/5 text-white/50'}">
						{genre}
					</button>
				{/each}
			</div>
		</div>
		
		<!-- Mobile Sort -->
		<div class="mb-6">
			<p class="mb-2 text-xs font-bold uppercase tracking-wider text-white/30">Sort By</p>
			<select bind:value={sortBy} class="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-white outline-none">
				{#each SORT_OPTIONS as opt}
					<option value={opt.key}>{opt.label}</option>
				{/each}
			</select>
		</div>
		
		<div class="flex gap-3">
			<button onclick={clearFilters} class="flex-1 rounded-xl border border-white/10 bg-white/5 py-3 text-sm font-bold text-white/60 transition hover:bg-white/10">
				Clear All
			</button>
			<button onclick={() => showMobileFilters = false} class="flex-1 rounded-xl bg-purple-500 py-3 text-sm font-bold text-white transition hover:bg-purple-400">
				Show {visibleDrops.length} Results
			</button>
		</div>
	</div>
{/if}

<!-- ══ MINT MODAL ══════════════════════════════════════════════ -->
{#if mintTarget}
	<button onclick={() => { mintTarget=null; mintStep='idle'; }}
		class="fixed inset-0 z-50 bg-black/85 backdrop-blur-md"
		in:fade={{ duration: 150 }} aria-label="Close"></button>

	<div class="fixed inset-0 z-50 flex items-center justify-center p-4"
		 in:scale={{ duration: 350, easing: elasticOut, start: 0.9 }}>
		<div class="relative w-full max-w-sm overflow-hidden rounded-3xl border border-white/10 bg-[#0c0a1a] shadow-2xl shadow-purple-900/50">

			<!-- gradient top bar -->
			<div class="h-[3px]" style="background:linear-gradient(90deg,{mintTarget.cover.from},{mintTarget.cover.via},{mintTarget.cover.to})"></div>

			<div class="p-6">
				<button onclick={() => { mintTarget=null; mintStep='idle'; }}
					class="absolute top-4 right-4 flex h-7 w-7 items-center justify-center rounded-full bg-white/5 text-white/30 transition hover:bg-white/10 hover:text-white text-sm"
					aria-label="Close">✕</button>

				{#if mintStep === 'success'}
					<div class="py-10 text-center" in:scale={{ duration: 500, easing: elasticOut }}>
						<div class="mb-3 text-6xl">🎉</div>
						<p class="text-xl font-black text-white">{mintTarget.title}</p>
						<p class="mt-1 text-sm text-purple-300">Successfully minted!</p>
						<div class="mt-4 rounded-xl border border-white/8 bg-white/3 p-3 text-xs text-white/40">
							Your stems are now in your wallet.<br/>You'll earn <span class="font-black text-emerald-400">{mintTarget.royalty}%</span> on every future play.
						</div>
					</div>

				{:else if mintStep === 'minting'}
					<div class="py-10 text-center" in:fade>
						<div class="relative mx-auto mb-5 h-16 w-16">
							<div class="absolute inset-0 animate-spin rounded-full border-[3px] border-purple-500/20 border-t-purple-400"></div>
							<div class="absolute inset-2 animate-spin rounded-full border-[3px] border-pink-500/20 border-t-pink-400" style="animation-direction:reverse;animation-duration:0.7s"></div>
							<span class="absolute inset-0 flex items-center justify-center text-2xl">{mintTarget.emoji}</span>
						</div>
						<p class="text-sm font-black text-white">Minting on Solana…</p>
						<p class="mt-1 text-xs text-white/30">Signing transaction · Confirming block</p>
					</div>

				{:else}
					<!-- cover + title -->
					<div class="mb-5 flex gap-4 items-center">
						<div class="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-3xl shadow-xl"
							 style="background:linear-gradient(135deg,{mintTarget.cover.from},{mintTarget.cover.via})">
							{mintTarget.emoji}
						</div>
						<div>
							<p class="text-[9px] uppercase tracking-widest text-white/25">{mintTarget.genre} · {mintTarget.bpm} BPM</p>
							<p class="text-lg font-black text-white leading-tight">{mintTarget.title}</p>
							<p class="text-sm text-white/40">{mintTarget.artist}</p>
						</div>
					</div>

					<!-- details table -->
					<div class="mb-4 divide-y divide-white/5 rounded-2xl border border-white/8 bg-white/3 overflow-hidden">
						{#each [
							{ l:'Edition',  v:`#${mintTarget.edition.sold+1} of ${mintTarget.edition.total}`, c:'text-white'         },
							{ l:'Royalty',  v:`${mintTarget.royalty}% forever`,                               c:'text-emerald-400'   },
							{ l:'Stems',    v:mintTarget.stems.join(', '),                                    c:'text-white/60'      }
						] as row}
							<div class="flex justify-between px-4 py-2.5 text-xs">
								<span class="text-white/30">{row.l}</span>
								<span class="font-bold {row.c}">{row.v}</span>
							</div>
						{/each}
					</div>

					<!-- currency toggle -->
					<div class="mb-4 flex gap-1 rounded-xl border border-white/8 bg-white/3 p-1">
						{#each ['SOL','$JAM'] as c}
							<button onclick={() => mintCurrency = c}
								class="flex-1 rounded-lg py-2.5 text-xs font-black transition-all
									   {mintCurrency===c?'bg-purple-500 text-white shadow-lg':'text-white/30 hover:text-white'}">
								{c === 'SOL' ? `◎ ${mintTarget.price} SOL` : `💜 ${mintTarget.jamPrice.toLocaleString()} $JAM`}
							</button>
						{/each}
					</div>

					<button onclick={confirmMint}
						class="w-full rounded-2xl py-3.5 text-sm font-black text-white shadow-xl transition-all hover:scale-[1.02] hover:opacity-90 active:scale-95"
						style="background:linear-gradient(135deg,{mintTarget.cover.from},{mintTarget.cover.via},{mintTarget.cover.to});box-shadow:0 8px 32px {mintTarget.cover.from}50">
						🎵 Confirm Mint
					</button>
					<p class="mt-3 text-center text-[10px] text-white/15">Mock transaction · nothing real is spent</p>
				{/if}
			</div>
		</div>
	</div>
{/if}

<style>
	@keyframes waveBar {
		from { transform: scaleY(0.3); }
		to   { transform: scaleY(1);   }
	}
	@keyframes float {
		0%, 100% { transform: translateY(0px) rotate(0deg); }
		50% { transform: translateY(-20px) rotate(2deg); }
	}
	@keyframes pulse-glow {
		0%, 100% { box-shadow: 0 0 20px rgba(168, 85, 247, 0.3); }
		50% { box-shadow: 0 0 40px rgba(168, 85, 247, 0.6); }
	}
	@keyframes gradient-shift {
		0% { background-position: 0% 50%; }
		50% { background-position: 100% 50%; }
		100% { background-position: 0% 50%; }
	}
	@keyframes marquee {
		0% { transform: translateX(0); }
		100% { transform: translateX(-50%); }
	}
	:global(.animate-gradient) {
		background-size: 200% 200%;
		animation: gradient-shift 8s ease infinite;
	}
	:global(.glass) {
		background: rgba(255, 255, 255, 0.03);
		backdrop-filter: blur(20px);
		-webkit-backdrop-filter: blur(20px);
		border: 1px solid rgba(255, 255, 255, 0.08);
	}
	:global(.card-3d) {
		transform-style: preserve-3d;
		perspective: 1000px;
	}
	:global(.card-3d:hover) {
		transform: translateY(-8px) rotateX(5deg);
	}
</style>
