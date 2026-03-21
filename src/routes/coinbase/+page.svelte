<script>
	import { onMount } from 'svelte';

	let rates = $state({});
	let loading = $state(true);
	let error = $state(null);
	let selectedCurrency = $state('USD');
	let searchQuery = $state('');
	let lastUpdated = $state(null);
	let hoveredCard = $state(null);
	let view = $state('grid');
	let flipCard = $state(null);
	let mouseX = $state(0);
	let mouseY = $state(0);
	let pulse = $state(false);
	let tick = $state(0);
	let selectedCategory = $state('all');

	const CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'CNY'];
	const FEATURED = ['BTC', 'ETH', 'SOL', 'DOGE', 'XRP', 'ADA', 'AVAX', 'DOT', 'LINK', 'MATIC', 'UNI', 'ATOM', 'ARB', 'OP', 'NEAR', 'APT', 'SUI', 'SEI'];
	const CATEGORIES = [
		{ key: 'all', label: 'All', emoji: '🌐' },
		{ key: 'layer1', label: 'L1s', emoji: '⛓️', coins: ['BTC','ETH','SOL','ADA','AVAX','DOT','ATOM','NEAR','APT','SUI','SEI'] },
		{ key: 'defi', label: 'DeFi', emoji: '🏦', coins: ['UNI','LINK','AAVE','MKR','CRV','LDO','SNX','COMP'] },
		{ key: 'meme', label: 'Memes', emoji: '🐸', coins: ['DOGE','SHIB','PEPE','BONK','FLOKI','WIF'] },
		{ key: 'l2', label: 'L2s', emoji: '🚀', coins: ['ARB','OP','MATIC','IMX','METIS'] }
	];

	const COIN_DATA = {
		BTC:  { color: '#F7931A', name: 'Bitcoin' },
		ETH:  { color: '#627EEA', name: 'Ethereum' },
		SOL:  { color: '#9945FF', name: 'Solana' },
		DOGE: { color: '#C3A634', name: 'Dogecoin' },
		XRP:  { color: '#00AAE4', name: 'Ripple' },
		ADA:  { color: '#0033AD', name: 'Cardano' },
		AVAX: { color: '#E84142', name: 'Avalanche' },
		DOT:  { color: '#E6007A', name: 'Polkadot' },
		LINK: { color: '#2A5ADA', name: 'Chainlink' },
		MATIC:{ color: '#8247E5', name: 'Polygon' },
		UNI:  { color: '#FF007A', name: 'Uniswap' },
		ATOM: { color: '#2E3148', name: 'Cosmos' },
		ARB:  { color: '#28A0F0', name: 'Arbitrum' },
		OP:   { color: '#FF0420', name: 'Optimism' },
		NEAR: { color: '#00C08B', name: 'NEAR' },
		APT:  { color: '#22D1EE', name: 'Aptos' },
		SUI:  { color: '#4DA2FF', name: 'Sui' },
		SEI:  { color: '#B843E1', name: 'Sei' },
		SHIB: { color: '#FFA409', name: 'Shiba Inu' },
		PEPE: { color: '#4B9E4B', name: 'Pepe' },
		BONK: { color: '#FF6B35', name: 'Bonk' },
		AAVE: { color: '#B6509E', name: 'Aave' },
		MKR:  { color: '#1AAB9B', name: 'Maker' },
		CRV:  { color: '#FCEE21', name: 'Curve' },
		LDO:  { color: '#00A3FF', name: 'Lido' },
		SNX:  { color: '#00D1FF', name: 'Synthetix' },
		COMP: { color: '#00D395', name: 'Compound' },
		DEFAULT: { color: '#0052FF', name: 'Crypto' }
	};

	function coinInfo(sym) { return COIN_DATA[sym] ?? COIN_DATA.DEFAULT; }

	async function fetchRates() {
		loading = true; error = null;
		try {
			const res = await fetch('https://api.coinbase.com/v2/exchange-rates?currency=USD');
			if (!res.ok) throw new Error(`Coinbase ${res.status}`);
			const data = await res.json();
			rates = data.data?.rates ?? {};
			lastUpdated = new Date();
			pulse = true;
			setTimeout(() => pulse = false, 600);
		} catch (e) {
			error = e.message;
		} finally {
			loading = false;
		}
	}

	function invertRate(rate) {
		const v = parseFloat(rate);
		if (!v || isNaN(v) || v === 0) return '0';
		return (1 / v).toString();
	}

	function convertRate(usdRate) {
		const inverted = invertRate(usdRate);
		if (selectedCurrency === 'USD') return inverted;
		const fx = rates[selectedCurrency];
		if (!fx) return inverted;
		// fx is "how many FX per 1 USD", so multiply inverted USD price by fx
		return (parseFloat(inverted) * parseFloat(fx)).toString();
	}

	function fmt(n) {
		const v = parseFloat(n);
		if (isNaN(v)) return '—';
		if (v >= 1e6) return (v / 1e6).toFixed(2) + 'M';
		if (v >= 1e3) return v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
		if (v >= 1) return v.toFixed(2);
		if (v >= 0.0001) return v.toFixed(6);
		return v.toExponential(2);
	}

	function fmtBig(n) {
		const v = parseFloat(n);
		if (isNaN(v)) return '—';
		if (v >= 1e6) return (v / 1e6).toFixed(2) + 'M';
		if (v >= 1e3) return v.toLocaleString();
		if (v >= 1) return v.toFixed(2);
		return v.toFixed(6);
	}

	function fakeSparkline(seed) {
		let s = seed.charCodeAt(0) + (seed.charCodeAt(1) || 0);
		const pts = [];
		for (let i = 0; i < 20; i++) {
			s = (s * 16807 + 7) % 2147483647;
			pts.push(30 + (s % 40));
		}
		return pts;
	}

	function sparkSvg(pts, color) {
		const w = 80, h = 32;
		const min = Math.min(...pts), max = Math.max(...pts);
		const range = max - min || 1;
		const d = pts.map((p, i) => {
			const x = (i / (pts.length - 1)) * w;
			const y = h - ((p - min) / range) * h;
			return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
		}).join(' ');
		const area = d + ` L${w},${h} L0,${h} Z`;
		return { line: d, area };
	}

	let filtered = $derived(
		Object.entries(rates)
			.filter(([sym]) => sym !== 'USD')
			.filter(([sym]) => {
				if (searchQuery) return sym.toLowerCase().includes(searchQuery.toLowerCase());
				if (selectedCategory === 'all') return true;
				const cat = CATEGORIES.find(c => c.key === selectedCategory);
				return cat?.coins?.includes(sym);
			})
			.sort((a, b) => {
				const ai = FEATURED.indexOf(a[0]), bi = FEATURED.indexOf(b[0]);
				if (ai !== -1 && bi !== -1) return ai - bi;
				if (ai !== -1) return -1;
				if (bi !== -1) return 1;
				return parseFloat(invertRate(b[1])) - parseFloat(invertRate(a[1]));
			})
	);

	let featuredRates = $derived(
		FEATURED.filter(sym => rates[sym]).map(sym => ({
			sym,
			usd: rates[sym],
			converted: convertRate(rates[sym]),
			info: coinInfo(sym),
			spark: fakeSparkline(sym)
		}))
	);

	const CURR_SYMBOLS = { USD:'$', EUR:'€', GBP:'£', JPY:'¥', AUD:'A$', CAD:'C$', CHF:'CHF ', CNY:'¥' };
	function currSym() { return CURR_SYMBOLS[selectedCurrency] ?? '$'; }

	const TICKER = '🔵 COINBASE · EXCHANGE RATES · BTC · ETH · SOL · LIVE CRYPTO PRICES · REAL-TIME RATES · DIGITAL ASSETS · BLOCKCHAIN · WEB3 · DEFI · ';

	function handleMouseMove(e) {
		const rect = e.currentTarget?.getBoundingClientRect();
		if (!rect) return;
		mouseX = ((e.clientX - rect.left) / rect.width - 0.5) * 10;
		mouseY = ((e.clientY - rect.top) / rect.height - 0.5) * 10;
	}

	onMount(() => {
		fetchRates();
		const iv = setInterval(fetchRates, 600_000);
		const tickIv = setInterval(() => tick++, 100);
		return () => { clearInterval(iv); clearInterval(tickIv); };
	});
</script>

<svelte:head><title>Coinbase | JamCat</title></svelte:head>

<!-- TICKER -->
<div class="overflow-hidden border-b border-white/5 bg-[#0052ff]/10 py-2 backdrop-blur-xl">
	<div class="flex whitespace-nowrap" style="animation:marquee 35s linear infinite">
		{#each [TICKER, TICKER, TICKER] as t}
			<span class="mr-0 text-[10px] font-black uppercase tracking-[0.3em]" style="color:#0052ff">{t}</span>
		{/each}
	</div>
</div>

<div class="relative min-h-screen overflow-hidden bg-[#060818]">

	<!-- animated mesh background -->
	<div class="pointer-events-none fixed inset-0" onmousemove={handleMouseMove}>
		<div class="absolute left-[-20%] top-[-10%] h-[700px] w-[700px] rounded-full opacity-[0.08] blur-[140px] transition-transform duration-[3s]"
			 style="background:radial-gradient(circle,#0052ff,transparent 70%);transform:translate({mouseX * 2}px,{mouseY * 2}px)"></div>
		<div class="absolute right-[-15%] bottom-[-20%] h-[600px] w-[600px] rounded-full opacity-[0.05] blur-[120px] transition-transform duration-[3s]"
			 style="background:radial-gradient(circle,#7c3aed,transparent 70%);transform:translate({-mouseX}px,{-mouseY}px)"></div>
		<div class="absolute left-1/3 top-2/3 h-[400px] w-[400px] rounded-full opacity-[0.04] blur-[100px]"
			 style="background:radial-gradient(circle,#06b6d4,transparent 70%)"></div>

		<!-- floating particles -->
		{#each Array(6) as _, i}
			<div class="absolute h-1 w-1 rounded-full bg-white/10"
				 style="left:{15 + i * 14}%;top:{20 + (i * 17) % 60}%;animation:float {4 + i}s ease-in-out infinite;animation-delay:{i * 0.7}s"></div>
		{/each}

		<!-- grid -->
		<div class="absolute inset-0 opacity-[0.025]"
			 style="background-image:linear-gradient(rgba(255,255,255,.15) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.15) 1px,transparent 1px);background-size:80px 80px"></div>
		<!-- radial vignette -->
		<div class="absolute inset-0" style="background:radial-gradient(ellipse at center,transparent 40%,#060818 100%)"></div>
	</div>

	<div class="relative mx-auto max-w-7xl px-5 py-10 sm:px-8">

		<!-- ═══ HERO ═══ -->
		<div class="mb-10 text-center">
			<div class="mb-5 inline-flex items-center gap-4">
				<div class="relative">
					<div class="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0052ff] to-[#0040cc] shadow-2xl shadow-[#0052ff]/40">
						<svg class="h-8 w-8" viewBox="0 0 1024 1024" fill="none">
							<path d="M516.4 760c-28.8 0-56.4-5.6-81.6-16.4-24-10.4-45.2-25.2-62.8-43.6-18-18.4-32.4-39.2-42.4-63.2-10.4-24.8-16-51.6-16-80 0-28.8 5.6-56 16-80.4 10-24 24.4-45.2 42.4-63.2 17.6-18.4 38.8-33.2 62.8-43.6 25.2-10.8 52.8-16.4 81.6-16.4 17.6 0 34.4 2.8 50.4 8 15.2 5.2 28.8 12.4 41.2 21.6l55.6-55.6c-19.6-16.4-42-29.2-66.4-38-25.6-9.2-52.4-14-80.8-14-43.2 0-84 8.4-121.6 25.2-36 16-67.6 38.4-93.6 66.4-26 28-46 60.8-59.2 98-13.6 38.8-20.4 80-20.4 124s6.8 85.2 20.4 124c13.2 37.2 33.2 70 59.2 98 26 28 57.6 50.4 93.6 66.4 37.6 16.8 78.4 25.2 121.6 25.2 28.4 0 55.2-4.8 80.8-14 24.4-8.8 46.8-21.6 66.4-38l-55.6-55.6c-12.4 9.2-26 16.4-41.2 21.6-16 5.2-32.8 8-50.4 8z" fill="white"/>
							<path d="M616 512c0 57.6-46.8 104-104 104s-104-46.4-104-104 46.8-104 104-104 104 46.4 104 104z" fill="white"/>
						</svg>
					</div>
					<div class="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-emerald-400 {pulse ? 'scale-150' : ''} transition-transform">
						<div class="absolute inset-0 animate-ping rounded-full bg-emerald-400/40"></div>
					</div>
				</div>
				<div class="text-left">
					<h1 class="text-4xl font-black tracking-tighter text-white sm:text-5xl lg:text-6xl" style="text-shadow:0 0 80px rgba(0,82,255,0.3)">Coinbase</h1>
					<p class="text-[11px] uppercase tracking-[0.3em] text-[#0052ff]/70">Exchange Rates · Live</p>
				</div>
			</div>

			<!-- live stats bar -->
			<div class="mx-auto flex max-w-lg flex-wrap items-center justify-center gap-x-6 gap-y-2 rounded-2xl border border-white/[0.04] bg-white/[0.02] px-6 py-3 backdrop-blur-sm">
				<div class="flex items-center gap-2">
					<div class="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
					<span class="text-[10px] font-bold text-white/30">LIVE</span>
				</div>
				<div class="h-3 w-px bg-white/10"></div>
				<span class="text-[10px] font-bold text-white/40">
					<span class="font-black text-white/70">{Object.keys(rates).length}</span> assets
				</span>
				<div class="h-3 w-px bg-white/10"></div>
				<span class="text-[10px] font-bold text-white/40">
					<span class="font-black text-white/70">{selectedCurrency}</span> base
				</span>
				<div class="h-3 w-px bg-white/10"></div>
				<span class="text-[10px] text-white/20">
					{#if lastUpdated}
						{lastUpdated.toLocaleTimeString()}
					{:else}
						loading…
					{/if}
				</span>
			</div>
		</div>

		<!-- ═══ CONTROLS ═══ -->
		<div class="mb-8 flex flex-wrap items-center gap-3">
			<!-- search -->
			<div class="relative">
				<input bind:value={searchQuery}
					placeholder="Search assets…"
					class="w-48 rounded-2xl border border-white/[0.06] bg-white/[0.02] py-2.5 pl-5 pr-10 text-sm text-white placeholder-white/15 outline-none backdrop-blur-sm transition-all focus:w-64 focus:border-[#0052ff]/30 focus:bg-white/[0.04] focus:shadow-lg focus:shadow-[#0052ff]/10" />
				<span class="absolute right-4 top-1/2 -translate-y-1/2 text-white/15 text-sm">⌕</span>
			</div>

			<!-- categories -->
			<div class="flex gap-1.5">
				{#each CATEGORIES as cat}
					<button onclick={() => { selectedCategory = cat.key; searchQuery = ''; }}
						class="flex items-center gap-1.5 rounded-xl border px-3 py-2 text-[10px] font-bold transition-all
							{selectedCategory === cat.key && !searchQuery
								? 'border-[#0052ff]/40 bg-[#0052ff]/15 text-[#0052ff] shadow-lg shadow-[#0052ff]/10'
								: 'border-white/[0.04] text-white/25 hover:border-white/10 hover:text-white/50'}">
						<span>{cat.emoji}</span>
						<span>{cat.label}</span>
					</button>
				{/each}
			</div>

			<div class="ml-auto flex items-center gap-3">
				<!-- currency selector -->
				<div class="flex gap-0.5 rounded-xl border border-white/[0.06] bg-white/[0.02] p-1 backdrop-blur-sm">
					{#each CURRENCIES as cur}
						<button onclick={() => selectedCurrency = cur}
							class="rounded-lg px-2.5 py-1 text-[10px] font-bold transition
								{selectedCurrency === cur ? 'bg-[#0052ff] text-white shadow-md shadow-[#0052ff]/30' : 'text-white/20 hover:text-white/50'}">
							{cur}
						</button>
					{/each}
				</div>

				<!-- view toggle -->
				<div class="flex gap-0.5 rounded-xl border border-white/[0.06] bg-white/[0.02] p-1 backdrop-blur-sm">
					<button onclick={() => view = 'grid'}
						class="rounded-lg px-2.5 py-1 text-[10px] font-bold transition
							{view === 'grid' ? 'bg-white/10 text-white' : 'text-white/20 hover:text-white/50'}">⊞</button>
					<button onclick={() => view = 'list'}
						class="rounded-lg px-2.5 py-1 text-[10px] font-bold transition
							{view === 'list' ? 'bg-white/10 text-white' : 'text-white/20 hover:text-white/50'}">☰</button>
				</div>

				<button onclick={fetchRates} disabled={loading}
					class="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-2 text-[10px] font-black text-white/30 backdrop-blur-sm transition hover:border-[#0052ff]/20 hover:text-white/60 disabled:opacity-20">
					{loading ? '⟳' : '↻'}
				</button>
			</div>
		</div>

		<!-- ═══ ERROR ═══ -->
		{#if error}
			<div class="mb-8 rounded-2xl border border-red-500/20 bg-red-500/[0.06] p-8 text-center backdrop-blur-sm">
				<p class="mb-2 text-4xl">⚡</p>
				<p class="text-sm font-black text-red-400">Connection Interrupted</p>
				<p class="mt-1 text-xs text-white/30">{error}</p>
				<button onclick={fetchRates}
					class="mt-4 rounded-xl border border-red-400/20 bg-red-400/10 px-6 py-2.5 text-xs font-black text-red-300 transition hover:bg-red-400/20">
					Try Again
				</button>
			</div>
		{/if}

		<!-- ═══ FEATURED CARDS ═══ -->
		{#if featuredRates.length && !searchQuery}
			<div class="mb-10">
				<div class="mb-4 flex items-center gap-3">
					<p class="text-[10px] font-black uppercase tracking-[0.3em] text-white/15">Featured</p>
					<div class="h-px flex-1 bg-gradient-to-r from-white/[0.06] to-transparent"></div>
				</div>
				<div class="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
					{#each featuredRates as coin, i (coin.sym)}
						{@const spark = sparkSvg(coin.spark, coin.info.color)}
						<button
							class="group relative overflow-hidden rounded-2xl border border-white/[0.04] bg-gradient-to-b from-white/[0.03] to-transparent p-4 text-left backdrop-blur-sm transition-all duration-300 hover:border-white/[0.08] hover:shadow-xl hover:shadow-black/20"
							style="animation:slideUp 0.5s cubic-bezier(.22,1,.36,1) {i * 40}ms both"
							onmouseenter={() => hoveredCard = coin.sym}
							onmouseleave={() => hoveredCard = null}
							onclick={() => flipCard = flipCard === coin.sym ? null : coin.sym}>

							<!-- top glow -->
							<div class="absolute -top-20 left-1/2 h-24 w-24 -translate-x-1/2 rounded-full opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-30"
								 style="background:{coin.info.color}"></div>

							<div class="relative">
								<!-- icon -->
								<div class="mb-3 flex h-11 w-11 items-center justify-center rounded-xl text-base font-black text-white shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3"
									 style="background:linear-gradient(135deg,{coin.info.color},{coin.info.color}aa);box-shadow:0 6px 24px {coin.info.color}30">
									{coin.sym[0]}
								</div>

								{#if flipCard === coin.sym}
									<!-- flipped: name view -->
									<div class="animate-[flipIn_0.3s_ease]">
										<p class="text-[10px] font-bold uppercase tracking-wider text-white/25">{coin.sym}</p>
										<p class="text-sm font-bold text-white/70">{coin.info.name}</p>
										<p class="mt-1 text-[9px] text-white/20">1 {coin.sym} =</p>
										<p class="text-xs font-black text-white">{currSym()}{fmtBig(coin.converted)}</p>
									</div>
								{:else}
									<!-- default: price view -->
									<p class="text-[10px] font-bold uppercase tracking-wider text-white/25">{coin.sym}</p>
									<p class="text-lg font-black tracking-tight text-white">{currSym()}{fmt(coin.converted)}</p>

									<!-- sparkline -->
									<svg viewBox="0 0 80 32" class="mt-2 h-6 w-full opacity-40 transition-opacity group-hover:opacity-70" preserveAspectRatio="none">
										<defs>
											<linearGradient id="g-{coin.sym}" x1="0" y1="0" x2="0" y2="1">
												<stop offset="0%" stop-color={coin.info.color} stop-opacity="0.3"/>
												<stop offset="100%" stop-color={coin.info.color} stop-opacity="0"/>
											</linearGradient>
										</defs>
										<path d={spark.area} fill="url(#g-{coin.sym})"/>
										<path d={spark.line} fill="none" stroke={coin.info.color} stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
									</svg>
								{/if}
							</div>
						</button>
					{/each}
				</div>
			</div>
		{/if}

		<!-- ═══ LOADING SKELETON ═══ -->
		{#if loading && !Object.keys(rates).length}
			<div class="space-y-6">
				<div class="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
					{#each Array(12) as _, i}
						<div class="h-36 animate-pulse rounded-2xl bg-white/[0.02]" style="animation-delay:{i * 50}ms"></div>
					{/each}
				</div>
			</div>
		{/if}

		<!-- ═══ ALL RATES ═══ -->
		{#if filtered.length}
			<div class="mb-6">
				<div class="mb-4 flex items-center justify-between">
					<div class="flex items-center gap-3">
						<p class="text-[10px] font-black uppercase tracking-[0.3em] text-white/15">
							{searchQuery ? 'Results' : CATEGORIES.find(c => c.key === selectedCategory)?.label ?? 'All'} Rates
						</p>
						<span class="rounded-full bg-white/[0.04] px-2 py-0.5 text-[9px] font-bold text-white/20">{filtered.length}</span>
					</div>
					<p class="text-[9px] text-white/10">click featured cards to flip</p>
				</div>

				{#if view === 'grid'}
					<div class="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
						{#each filtered.slice(0, 60) as [sym, usdRate], i (sym)}
							{@const info = coinInfo(sym)}
							{@const featured = FEATURED.includes(sym)}
							<div class="group relative overflow-hidden rounded-xl border border-white/[0.03] bg-white/[0.01] px-4 py-3 backdrop-blur-sm transition-all duration-200 hover:border-white/[0.06] hover:bg-white/[0.025] hover:shadow-lg hover:shadow-black/10"
								 style="animation:fadeIn 0.3s ease {Math.min(i * 12, 500)}ms both">
								<div class="flex items-center gap-3">
									<div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[10px] font-black transition-transform group-hover:scale-105"
										 style="background:{info.color}15;color:{info.color}">
										{sym.slice(0, 2)}
									</div>
									<div class="min-w-0 flex-1">
										<div class="flex items-center gap-1.5">
											<p class="truncate text-[11px] font-bold text-white/60">{sym}</p>
											{#if featured}
												<span class="h-1 w-1 rounded-full" style="background:{info.color}"></span>
											{/if}
										</div>
										<p class="truncate text-sm font-black text-white">{currSym()}{fmt(convertRate(usdRate))}</p>
									</div>
								</div>
								<!-- hover accent -->
								<div class="absolute bottom-0 left-0 h-px w-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transition-all duration-300 group-hover:w-full"></div>
							</div>
						{/each}
					</div>
				{:else}
					<div class="overflow-hidden rounded-2xl border border-white/[0.04] bg-white/[0.01] backdrop-blur-sm">
						<div class="grid grid-cols-[3rem_1fr_10rem_8rem] items-center gap-2 border-b border-white/[0.04] px-5 py-3 text-[9px] font-black uppercase tracking-[0.25em] text-white/12">
							<span>#</span>
							<span>Asset</span>
							<span class="text-right">Rate ({selectedCurrency})</span>
							<span class="text-right text-white/8">USD</span>
						</div>
						{#each filtered.slice(0, 80) as [sym, usdRate], i (sym)}
							{@const info = coinInfo(sym)}
							<div class="group grid grid-cols-[3rem_1fr_10rem_8rem] items-center gap-2 border-b border-white/[0.015] px-5 py-3 transition-colors last:border-0 hover:bg-white/[0.015]"
								 style="animation:slideRight 0.2s ease {Math.min(i * 8, 400)}ms both">
								<span class="text-[10px] font-black text-white/10">{i + 1}</span>
								<div class="flex items-center gap-3">
									<div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[9px] font-black"
										 style="background:{info.color}12;color:{info.color}">
										{sym.slice(0, 3)}
									</div>
									<div class="min-w-0">
										<p class="text-xs font-bold text-white/60">{sym}</p>
										<p class="text-[9px] text-white/15">{info.name}</p>
									</div>
								</div>
								<p class="text-right text-sm font-black text-white">{currSym()}{fmtBig(convertRate(usdRate))}</p>
								<p class="text-right text-[10px] text-white/15">${fmtBig(invertRate(usdRate))}</p>
							</div>
						{/each}
					</div>
				{/if}

				{#if filtered.length > 80}
					<p class="mt-4 text-center text-[10px] text-white/10">Showing 80 of {filtered.length} assets</p>
				{/if}
			</div>
		{:else if !loading && !error}
			<div class="rounded-2xl border border-white/[0.04] bg-white/[0.01] p-20 text-center backdrop-blur-sm">
				<p class="mb-3 text-5xl opacity-30">∅</p>
				<p class="text-sm font-black text-white/30">No assets found</p>
				<p class="mt-1 text-xs text-white/12">Try a different search or category</p>
			</div>
		{/if}

		<!-- ═══ FOOTER ═══ -->
		<div class="mt-14 border-t border-white/[0.03] pt-6">
			<div class="flex flex-wrap items-center justify-between gap-4">
				<div class="flex items-center gap-3">
					<div class="relative">
						<div class="h-2 w-2 rounded-full bg-emerald-400/60"></div>
						<div class="absolute inset-0 animate-ping rounded-full bg-emerald-400/20"></div>
					</div>
					<p class="text-[9px] text-white/12">
						Coinbase API · {Object.keys(rates).length} assets · 10min refresh
					</p>
				</div>
				<div class="flex gap-5">
					{#each ['Coinbase API', 'Status', 'Docs'] as link}
						<span class="cursor-pointer text-[9px] text-white/10 transition hover:text-white/25">{link}</span>
					{/each}
				</div>
			</div>
		</div>

	</div>
</div>

<style>
	@keyframes marquee {
		from { transform: translateX(0); }
		to   { transform: translateX(-33.33%); }
	}
	@keyframes slideUp {
		from { opacity: 0; transform: translateY(20px) scale(0.96); }
		to   { opacity: 1; transform: translateY(0) scale(1); }
	}
	@keyframes fadeIn {
		from { opacity: 0; }
		to   { opacity: 1; }
	}
	@keyframes slideRight {
		from { opacity: 0; transform: translateX(-8px); }
		to   { opacity: 1; transform: translateX(0); }
	}
	@keyframes float {
		0%, 100% { transform: translateY(0) scale(1); opacity: 0.15; }
		50% { transform: translateY(-20px) scale(1.5); opacity: 0.4; }
	}
	@keyframes flipIn {
		from { opacity: 0; transform: rotateY(90deg); }
		to   { opacity: 1; transform: rotateY(0); }
	}
</style>
