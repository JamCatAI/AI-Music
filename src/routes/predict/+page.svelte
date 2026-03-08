<svelte:head>
	<title>Predict | JamCat Markets</title>
</svelte:head>

<script>
	import { onMount } from 'svelte';

	// ── Static market data ────────────────────────────────────────────────────────
	const CATEGORIES = ['All', 'Geopolitics', 'Crypto', 'Solana', 'Memes', 'AI', 'Politics', 'Sports'];

	const SORT_OPTIONS = ['Volume', 'Newest', 'Ending Soon'];

	const INITIAL_MARKETS = [
		// GEOPOLITICS — hottest category on Polymarket right now ($529M volume on Iran alone)
		{ id:  1, q: 'Will the US strike Iran before April 15, 2026?',              cat: 'Geopolitics', yes: 62, vol: 52900000, end: 'Apr 15', traders: 184200, hot: true  },
		{ id:  2, q: 'Will Khamenei remain Supreme Leader through March 2026?',     cat: 'Geopolitics', yes: 38, vol: 30600000, end: 'Mar 31', traders: 92400,  hot: true  },
		{ id:  3, q: 'Will Israel militarily strike Iran by June 30, 2026?',        cat: 'Geopolitics', yes: 48, vol: 22100000, end: 'Jun 30', traders: 74300,  hot: true  },
		{ id:  4, q: 'Will new US sanctions on Iran be imposed before April 1?',    cat: 'Geopolitics', yes: 75, vol: 18400000, end: 'Apr  1', traders: 61800,  hot: false },
		{ id:  5, q: 'Will there be a NATO military engagement with Russia in 2026?',cat:'Geopolitics', yes: 34, vol: 14200000, end: 'Dec 31', traders: 48900,  hot: false },
		{ id:  6, q: 'Will North Korea conduct a nuclear test before Dec 2026?',    cat: 'Geopolitics', yes: 28, vol:  8700000, end: 'Dec 31', traders: 29100,  hot: false },
		// CRYPTO
		{ id:  7, q: 'Will Bitcoin reach $150k by Dec 31, 2026?',                  cat: 'Crypto',      yes: 52, vol: 24100000, end: 'Dec 31', traders: 88200,  hot: true  },
		{ id:  8, q: 'Will Bitcoin fall below $67k before May 1, 2026?',           cat: 'Crypto',      yes: 41, vol: 11300000, end: 'May  1', traders: 42100,  hot: false },
		{ id:  9, q: 'Will Ethereum reach $7k by June 30, 2026?',                  cat: 'Crypto',      yes: 58, vol: 18900000, end: 'Jun 30', traders: 61400,  hot: true  },
		{ id: 10, q: 'Will a major US bank offer Bitcoin spot ETFs by May 2026?',  cat: 'Crypto',      yes: 89, vol:  9200000, end: 'May 31', traders: 31800,  hot: false },
		{ id: 11, q: 'Will stablecoin regulation pass US Congress by Dec 2026?',   cat: 'Politics',    yes: 73, vol: 12400000, end: 'Dec 31', traders: 44200,  hot: true  },
		// SOLANA ECOSYSTEM
		{ id: 12, q: 'Will Solana Alpenglow launch on mainnet by April 30, 2026?', cat: 'Solana',      yes: 72, vol:  7800000, end: 'Apr 30', traders: 28400,  hot: true  },
		{ id: 13, q: 'Will Solana (SOL) reach $250 by year-end 2026?',             cat: 'Solana',      yes: 46, vol:  6200000, end: 'Dec 31', traders: 22100,  hot: false },
		{ id: 14, q: 'Will Solana meme coin total mcap exceed $8B by June 2026?',  cat: 'Solana',      yes: 64, vol:  5400000, end: 'Jun 30', traders: 18700,  hot: false },
		{ id: 15, q: 'Will Pump.fun hit $3B daily volume in Q2 2026?',             cat: 'Solana',      yes: 41, vol:  4100000, end: 'Jun 30', traders: 14200,  hot: false },
		// MEMES
		{ id: 16, q: 'Will Official TRUMP coin stay top-5 Solana by June 2026?',  cat: 'Memes',       yes: 71, vol:  8900000, end: 'Jun 30', traders: 31200,  hot: true  },
		{ id: 17, q: 'Will an AI agent meme coin enter top-10 Solana by June?',   cat: 'Memes',       yes: 47, vol:  5600000, end: 'Jun 30', traders: 19800,  hot: true  },
		{ id: 18, q: 'Will BONK outperform Bitcoin in 2026?',                      cat: 'Memes',       yes: 33, vol:  4300000, end: 'Dec 31', traders: 14900,  hot: false },
		{ id: 19, q: 'Will WIF hit $5 before July 2026?',                          cat: 'Memes',       yes: 38, vol:  3700000, end: 'Jul  1', traders: 12800,  hot: false },
		{ id: 20, q: 'Will Fartcoin reach a $1B market cap in 2026?',              cat: 'Memes',       yes: 29, vol:  2900000, end: 'Dec 31', traders:  9800,  hot: false },
		// AI
		{ id: 21, q: 'Will a new AI model beat Claude Opus 4.6 on most benchmarks by Aug 2026?', cat: 'AI', yes: 44, vol: 9800000, end: 'Aug 31', traders: 34100, hot: true  },
		{ id: 22, q: 'Will Gemini 3.1 Pro hit 80%+ on ARC-AGI-2 benchmark?',      cat: 'AI',          yes: 71, vol:  6200000, end: 'Jun 30', traders: 21400,  hot: false },
		{ id: 23, q: 'Will Grok 4 benchmarks exceed GPT-5 on majority of tests?', cat: 'AI',          yes: 39, vol:  5100000, end: 'May 31', traders: 17800,  hot: false },
		{ id: 24, q: 'Will an AI agent autonomously manage a $10M hedge fund?',    cat: 'AI',          yes: 31, vol:  4400000, end: 'Dec 31', traders: 15200,  hot: false },
		// SPORTS
		{ id: 25, q: 'Will the 2026 FIFA World Cup be held as scheduled?',         cat: 'Sports',      yes: 91, vol:  7400000, end: 'Jun 30', traders: 26100,  hot: false },
		{ id: 26, q: 'Will an NBA player publicly shill a meme coin in Q2 2026?',  cat: 'Sports',      yes: 64, vol:  2100000, end: 'Jun 30', traders:  7400,  hot: false },
	];

	// ── Helpers ───────────────────────────────────────────────────────────────────
	const rand = (min, max) => Math.random() * (max - min) + min;
	const randInt = (min, max) => Math.floor(rand(min, max));
	const fmtVol = (n) => n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(1)}M` : `$${(n / 1_000).toFixed(0)}K`;
	const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));

	function makeProbHistory(yes, count = 30) {
		const pts = [];
		let p = clamp(yes + rand(-8, 8), 5, 95);
		for (let i = 0; i < count; i++) {
			p = clamp(p + rand(-2, 2), 5, 95);
			pts.push(+p.toFixed(1));
		}
		pts[pts.length - 1] = yes;
		return pts;
	}

	const ANONS = ['whale🐳', 'anon', 'degen', 'ape🦍', 'chad', 'ngmi', 'wagmi', 'fren', 'ser'];

	// ── State ─────────────────────────────────────────────────────────────────────
	let markets = $state(INITIAL_MARKETS.map(m => ({
		...m,
		history: makeProbHistory(m.yes),
	})));

	let activeCategory = $state('All');
	let activeSort = $state('Volume');
	let searchQuery = $state('');
	let selectedMarket = $state(null);
	let activity = $state([]);
	let walletConnected = $state(false);
	let walletAddr = $state('7xKX...mQp3');

	// Modal state
	let betSide = $state('yes');
	let betAmount = $state('100');
	let betLoading = $state(false);
	let betSuccess = $state(false);
	let toast = $state('');

	// Live News state
	let newsFeed = $state([]);
	let newsLoading = $state(true);

	// ── Derived ───────────────────────────────────────────────────────────────────
	let filtered = $derived(() => {
		let list = markets.filter(m => {
			const matchCat = activeCategory === 'All' || m.cat === activeCategory;
			const matchQ = m.q.toLowerCase().includes(searchQuery.toLowerCase());
			return matchCat && matchQ;
		});
		if (activeSort === 'Volume') list = [...list].sort((a, b) => b.vol - a.vol);
		else if (activeSort === 'Ending Soon') list = [...list].sort((a, b) => a.end.localeCompare(b.end));
		return list;
	});

	let featured = $derived(() => markets.filter(m => m.hot).slice(0, 2));

	let volumeLeaders = $derived(() =>
		[...markets].sort((a, b) => b.vol - a.vol).slice(0, 5)
	);

	// ── Positions (mock) ──────────────────────────────────────────────────────────
	let positions = $state([
		{ market: 'Will the US strike Iran before April 15, 2026?', side: 'YES', shares: 210, avgPrice: 0.58, current: 0 },
		{ market: 'Will Solana Alpenglow launch on mainnet by April 30, 2026?', side: 'YES', shares: 94, avgPrice: 0.67, current: 0 },
	]);

	// ── SVG chart helpers ─────────────────────────────────────────────────────────
	const CW = 480, CH = 140, PAD = 16;

	function chartPoints(history, key) {
		const vals = key === 'yes' ? history : history.map(v => 100 - v);
		const min = Math.min(...vals) - 2;
		const max = Math.max(...vals) + 2;
		const range = max - min || 1;
		const step = (CW - PAD * 2) / (vals.length - 1);
		return vals.map((v, i) => {
			const x = PAD + i * step;
			const y = PAD + ((max - v) / range) * (CH - PAD * 2);
			return `${x},${y}`;
		}).join(' ');
	}

	function potentialReturn() {
		const amt = parseFloat(betAmount) || 0;
		const prob = selectedMarket ? (betSide === 'yes' ? selectedMarket.yes : 100 - selectedMarket.yes) / 100 : 0.5;
		const payout = prob > 0 ? amt / prob : 0;
		const profit = payout - amt;
		return { payout: payout.toFixed(2), profit: profit.toFixed(2), pct: ((profit / (amt || 1)) * 100).toFixed(0) };
	}

	// ── Cat badge colours ─────────────────────────────────────────────────────────
	const CAT_COLORS = {
		Crypto:       'bg-orange-400/20 text-orange-300',
		Memes:        'bg-pink-400/20 text-pink-300',
		Solana:       'bg-purple-400/20 text-purple-300',
		AI:           'bg-cyan-400/20 text-cyan-300',
		Politics:     'bg-blue-400/20 text-blue-300',
		'Pop Culture':'bg-yellow-400/20 text-yellow-300',
		Sports:       'bg-green-400/20 text-green-300',
	};

	// ── Lifecycle ─────────────────────────────────────────────────────────────────
	onMount(() => {
		// Fetch Live News
		fetch('https://api.rss2json.com/v1/api.json?rss_url=https://cointelegraph.com/rss')
			.then(res => res.json())
			.then(data => {
				if (data.status === 'ok') {
					newsFeed = data.items.slice(0, 5).map(item => ({
						title: item.title,
						link: item.link,
						time: new Date(item.pubDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
						source: 'Cointelegraph'
					}));
				}
				newsLoading = false;
			})
			.catch(err => {
				console.error('Error fetching news:', err);
				newsLoading = false;
			});

		// Seed activity
		for (let i = 0; i < 12; i++) {
			const m = markets[randInt(0, markets.length)];
			const side = Math.random() > 0.5 ? 'YES' : 'NO';
			const amt = randInt(20, 800);
			activity.push({ id: i, user: ANONS[randInt(0, ANONS.length)], market: m.q.slice(0, 42) + '…', side, amt, ts: `${randInt(1, 59)}m ago` });
		}

		// Seed position current values
		positions = positions.map(p => {
			const m = markets.find(x => x.q === p.market);
			const price = m ? m.yes / 100 : p.avgPrice;
			return { ...p, current: +(p.shares * price).toFixed(2) };
		});

		const id = setInterval(() => {
			// Drift probabilities
			markets = markets.map(m => {
				const drift = rand(-0.6, 0.6);
				const newYes = clamp(m.yes + drift, 2, 98);
				const newHistory = [...m.history.slice(1), +newYes.toFixed(1)];
				const volBump = Math.random() < 0.3 ? randInt(200, 2000) : 0;
				return { ...m, yes: +newYes.toFixed(1), history: newHistory, vol: m.vol + volBump };
			});

			// Update position values
			positions = positions.map(p => {
				const m = markets.find(x => x.q === p.market);
				const price = m ? m.yes / 100 : p.avgPrice;
				return { ...p, current: +(p.shares * price).toFixed(2) };
			});

			// New activity entry
			const m = markets[randInt(0, markets.length)];
			const side = Math.random() > 0.5 ? 'YES' : 'NO';
			const amt = randInt(20, 1200);
			activity = [
				{ id: Date.now(), user: ANONS[randInt(0, ANONS.length)], market: m.q.slice(0, 42) + '…', side, amt, ts: 'just now' },
				...activity.slice(0, 19),
			];
		}, 2500);

		return () => clearInterval(id);
	});

	// ── Actions ───────────────────────────────────────────────────────────────────
	async function placeBet() {
		if (!betAmount || parseFloat(betAmount) <= 0) return;
		betLoading = true;
		await new Promise(r => setTimeout(r, 1800));
		betLoading = false;
		betSuccess = true;
		const ret = potentialReturn();
		showToast(`✅ Bought ${betSide.toUpperCase()} · potential $${ret.payout}`);
		await new Promise(r => setTimeout(r, 1800));
		betSuccess = false;
		selectedMarket = null;
		betAmount = '100';
	}

	function showToast(msg) {
		toast = msg;
		setTimeout(() => (toast = ''), 3000);
	}

	function openMarket(m) {
		selectedMarket = m;
		betSide = 'yes';
		betSuccess = false;
	}
</script>

<!-- ── Root ──────────────────────────────────────────────────────────────────── -->
<div class="min-h-screen bg-[#0f1011] text-white">
	<div class="mx-auto max-w-7xl px-4 pb-16 pt-6 sm:px-6 lg:px-8">

		<!-- ── Page header ────────────────────────────────────────────────────── -->
		<div class="mb-6 flex flex-wrap items-center gap-3">
			<div>
				<h1 class="text-2xl font-extrabold tracking-tight">🔮 Predict</h1>
				<p class="text-xs text-slate-500 mt-0.5">Bet on crypto, memes & culture. Powered by JamCat Markets.</p>
			</div>
			<div class="ml-auto flex items-center gap-3">
				<div class="hidden items-center rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 sm:flex">
					<input
						bind:value={searchQuery}
						placeholder="Search markets…"
						class="w-44 bg-transparent text-sm text-white placeholder-slate-500 outline-none"
					/>
					<span class="text-slate-500">🔍</span>
				</div>
				<button
					onclick={() => (walletConnected = !walletConnected)}
					class="rounded-xl px-4 py-2 text-sm font-bold transition-all
						{walletConnected
							? 'border border-[#4f7cff]/40 bg-[#4f7cff]/10 text-[#4f7cff]'
							: 'bg-[#4f7cff] text-white hover:bg-[#3d6aee]'}"
				>
					{walletConnected ? walletAddr : 'Connect Wallet'}
				</button>
			</div>
		</div>

		<!-- ── Category pills ─────────────────────────────────────────────────── -->
		<div class="mb-6 flex flex-wrap gap-2">
			{#each CATEGORIES as cat}
				<button
					onclick={() => (activeCategory = cat)}
					class="rounded-full border px-4 py-1.5 text-xs font-semibold transition-all
						{activeCategory === cat
							? 'border-[#4f7cff] bg-[#4f7cff] text-white shadow-md shadow-[#4f7cff]/30'
							: 'border-white/10 bg-white/5 text-slate-400 hover:border-[#4f7cff]/40 hover:text-white'}"
				>{cat}</button>
			{/each}
		</div>

		<!-- ── Main two-column ────────────────────────────────────────────────── -->
		<div class="flex flex-col gap-6 lg:flex-row">

			<!-- LEFT: main content -->
			<div class="min-w-0 flex-1">

				<!-- Featured markets -->
				{#if activeCategory === 'All' && !searchQuery}
					<div class="mb-8">
						<p class="mb-4 text-xs font-black uppercase tracking-widest text-[#4f7cff] drop-shadow-sm">🔥 Featured Markets</p>
						<div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
							{#each featured() as m (m.id)}
								<button
									onclick={() => openMarket(m)}
									class="group relative flex flex-col overflow-hidden rounded-[2rem] border border-[#4f7cff]/20 bg-white/5 p-6 text-left backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-[#4f7cff]/50 hover:shadow-[0_0_30px_rgba(79,124,255,0.15)]"
								>
									<div class="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-[#4f7cff]/10 blur-[40px] transition-all duration-500 group-hover:bg-[#4f7cff]/20"></div>
									
									<div class="relative z-10 mb-4 flex items-start justify-between">
										<span class="rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider shadow-sm {CAT_COLORS[m.cat] ?? 'bg-white/10 text-white'}">{m.cat}</span>
										<span class="flex items-center gap-1.5 rounded-full border border-orange-500/30 bg-orange-500/10 px-2.5 py-1 text-[10px] font-bold text-orange-400 backdrop-blur-sm">
											<span class="h-1.5 w-1.5 animate-pulse rounded-full bg-orange-500"></span>
											HOT · {fmtVol(m.vol)}
										</span>
									</div>
									<p class="relative z-10 mb-5 text-lg font-extrabold leading-tight text-white drop-shadow-sm group-hover:text-transparent group-hover:bg-gradient-to-br group-hover:from-white group-hover:to-gray-400 group-hover:bg-clip-text transition-colors">{m.q}</p>
									
									<!-- Probability bar -->
									<div class="relative z-10 mb-3 flex items-center gap-3 text-sm font-black">
										<span class="text-green-400 drop-shadow-[0_0_8px_rgba(74,222,128,0.4)]">{m.yes}%</span>
										<div class="relative flex-1 overflow-hidden rounded-full h-2.5 bg-black/40 shadow-inner">
											<div class="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-green-400 to-emerald-400 transition-all duration-700" style="width:{m.yes}%">
												<div class="absolute inset-0 bg-white/20 animate-pulse"></div>
											</div>
										</div>
										<span class="text-red-400 drop-shadow-[0_0_8px_rgba(248,113,113,0.4)]">{100 - m.yes}%</span>
									</div>
									
									<div class="relative z-10 flex gap-2 text-[10px] font-semibold text-slate-400">
										<span class="tracking-wider">YES · {m.yes}¢</span>
										<span>•</span>
										<span class="tracking-wider">NO · {100 - m.yes}¢</span>
									</div>
									
									<div class="relative z-10 mt-5 grid grid-cols-2 gap-3">
										<div class="flex items-center justify-center rounded-xl bg-gradient-to-b from-green-400/20 to-green-500/10 py-2.5 text-xs font-black tracking-wide text-green-400 border border-green-400/30 shadow-[0_4px_15px_rgba(74,222,128,0.1)] transition-all group-hover:bg-green-400/20 group-hover:scale-[1.03]">Buy YES</div>
										<div class="flex items-center justify-center rounded-xl bg-gradient-to-b from-red-400/20 to-red-500/10 py-2.5 text-xs font-black tracking-wide text-red-400 border border-red-400/30 shadow-[0_4px_15px_rgba(248,113,113,0.1)] transition-all group-hover:bg-red-400/20 group-hover:scale-[1.03]">Buy NO</div>
									</div>
								</button>
							{/each}
						</div>
					</div>
				{/if}

				<!-- Sort + count -->
				<div class="mb-4 flex items-center justify-between">
					<p class="text-xs text-slate-500">{filtered().length} markets</p>
					<div class="flex gap-1">
						{#each SORT_OPTIONS as s}
							<button
								onclick={() => (activeSort = s)}
								class="rounded-lg px-3 py-1 text-xs font-semibold transition-all
									{activeSort === s ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300'}"
							>{s}</button>
						{/each}
					</div>
				</div>

				<!-- Market grid -->
				<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
					{#each filtered() as m (m.id)}
						<button
							onclick={() => openMarket(m)}
							class="group relative flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-5 text-left backdrop-blur-lg transition-all duration-300 hover:-translate-y-1 hover:border-[#4f7cff]/40 hover:shadow-xl hover:shadow-[#4f7cff]/15"
						>
							<div class="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[#4f7cff]/5 blur-[30px] transition-all duration-500 group-hover:bg-[#4f7cff]/10"></div>
							
							<!-- Badge -->
							<div class="relative z-10 mb-3 flex items-center justify-between">
								<span class="rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-wider shadow-sm {CAT_COLORS[m.cat] ?? 'bg-white/10 text-white'}">{m.cat}</span>
								<span class="text-[9px] font-bold text-slate-500">ends <span class="text-slate-400">{m.end}</span></span>
							</div>
							<!-- Question -->
							<p class="relative z-10 mb-4 line-clamp-2 text-sm font-extrabold leading-snug text-white drop-shadow-sm transition-colors group-hover:text-transparent group-hover:bg-gradient-to-br group-hover:from-white group-hover:to-gray-300 group-hover:bg-clip-text">{m.q}</p>
							<!-- Prob bar -->
							<div class="relative z-10 mb-2 flex items-center gap-2 text-xs font-black">
								<span class="text-green-400 w-8 drop-shadow-[0_0_5px_rgba(74,222,128,0.3)]">{m.yes}%</span>
								<div class="relative flex-1 overflow-hidden rounded-full h-1.5 bg-black/50 shadow-inner">
									<div class="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-green-400 to-emerald-400 transition-all duration-700" style="width:{m.yes}%"></div>
								</div>
								<span class="text-red-400 w-8 text-right drop-shadow-[0_0_5px_rgba(248,113,113,0.3)]">{100 - m.yes}%</span>
							</div>
							<!-- Stats -->
							<div class="relative z-10 mb-5 flex justify-between border-b border-white/5 pb-3 text-[10px] font-medium text-slate-500">
								<span>Vol <span class="font-bold text-slate-300">{fmtVol(m.vol)}</span></span>
								<span><span class="font-bold text-slate-300">{m.traders.toLocaleString()}</span> traders</span>
							</div>
							<!-- Buttons -->
							<div class="relative z-10 mt-auto grid grid-cols-2 gap-2">
								<div class="rounded-xl border border-green-400/20 bg-green-400/10 py-1.5 text-center text-[10px] font-bold text-green-400 transition-all group-hover:bg-green-400/20">Yes {m.yes}¢</div>
								<div class="rounded-xl border border-red-400/20 bg-red-400/10 py-1.5 text-center text-[10px] font-bold text-red-400 transition-all group-hover:bg-red-400/20">No {100 - m.yes}¢</div>
							</div>
						</button>
					{/each}
				</div>
			</div>

			<!-- RIGHT: sidebar -->
			<div class="flex w-full flex-col gap-4 lg:w-72 lg:shrink-0">
				<div class="lg:sticky lg:top-20 flex flex-col gap-4">

					<!-- Volume Leaders -->
					<div class="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl shadow-xl">
						<div class="absolute -right-10 -top-10 h-24 w-24 rounded-full bg-[#4f7cff]/20 blur-[30px]"></div>
						<p class="relative z-10 mb-4 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
							<span class="text-base">📊</span> Volume Leaders
						</p>
						<div class="relative z-10 space-y-2.5">
							{#each volumeLeaders() as m, i}
								<button onclick={() => openMarket(m)} class="group flex w-full items-center gap-3 rounded-xl p-2 transition-all hover:bg-white/10 hover:shadow-lg">
									<span class="flex h-5 w-5 items-center justify-center rounded-full bg-[#4f7cff]/20 text-[10px] font-black text-[#4f7cff] shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]">#{i + 1}</span>
									<div class="min-w-0 flex-1 text-left">
										<p class="truncate text-[11px] font-semibold text-slate-300 transition-colors group-hover:text-white">{m.q}</p>
										<div class="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-black/40 shadow-inner">
											<div class="h-1 rounded-full bg-gradient-to-r from-[#4f7cff] to-cyan-400" style="width:{(m.vol / volumeLeaders()[0].vol * 100).toFixed(0)}%"></div>
										</div>
									</div>
									<span class="shrink-0 text-[10px] font-black text-[#4f7cff] drop-shadow-[0_0_5px_rgba(79,124,255,0.4)]">{fmtVol(m.vol)}</span>
								</button>
							{/each}
						</div>
					</div>

					<!-- Live News 📰 -->
					<div class="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl shadow-xl">
						<div class="absolute -left-10 -bottom-10 h-24 w-24 rounded-full bg-yellow-500/10 blur-[30px]"></div>
						<p class="relative z-10 mb-4 flex items-center justify-between text-xs font-black uppercase tracking-widest text-slate-400">
							<span class="flex items-center gap-2"><span class="text-base">📰</span> Latest News</span>
							{#if newsLoading}
								<span class="inline-block h-3 w-3 animate-spin rounded-full border-2 border-slate-500 border-t-white"></span>
							{/if}
						</p>
						<div class="relative z-10 space-y-3">
							{#each newsFeed as item}
								<a href={item.link} target="_blank" rel="noopener noreferrer" class="group block rounded-xl border border-white/5 bg-black/20 p-3 transition-all hover:-translate-y-0.5 hover:border-yellow-500/30 hover:bg-white/5 hover:shadow-[0_0_15px_rgba(234,179,8,0.1)]">
									<p class="mb-1.5 line-clamp-2 text-[11px] font-semibold leading-relaxed text-slate-200 group-hover:text-yellow-400 transition-colors">{item.title}</p>
									<div class="flex items-center justify-between text-[9px] font-medium text-slate-500">
										<span>{item.source}</span>
										<span>{item.time}</span>
									</div>
								</a>
							{/each}
						</div>
					</div>

					<!-- Your Positions -->
					<div class="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl shadow-xl">
						<div class="absolute -right-10 -bottom-10 h-24 w-24 rounded-full bg-emerald-500/10 blur-[30px]"></div>
						<p class="relative z-10 mb-4 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
							<span class="text-base">💼</span> Your Positions
						</p>
						<div class="relative z-10 space-y-3">
							{#each positions as pos}
								{@const m = markets.find(x => x.q === pos.market)}
								{@const pnl = pos.current - pos.shares * pos.avgPrice}
								<div class="rounded-xl border border-white/5 bg-black/20 p-3 transition-colors hover:bg-black/40">
									<p class="mb-1.5 text-[10px] font-semibold text-slate-300 line-clamp-1">{pos.market}</p>
									<div class="flex items-center justify-between border-b border-white/5 pb-2">
										<span class="rounded bg-green-400/20 px-1.5 py-0.5 text-[9px] font-black tracking-wider text-green-400 border border-green-400/30">{pos.side}</span>
										<span class="font-mono text-xs font-bold text-white shadow-sm">${pos.current.toFixed(2)}</span>
									</div>
									<div class="mt-2 flex justify-between text-[9px] font-medium">
										<span class="text-slate-500"><span class="font-bold text-slate-400">{pos.shares}</span> sh @ {pos.avgPrice}¢</span>
										<span class="{pnl >= 0 ? 'text-green-400' : 'text-red-400'} font-mono font-bold drop-shadow-sm">
											{pnl >= 0 ? '+' : ''}{pnl.toFixed(2)}
										</span>
									</div>
								</div>
							{/each}
						</div>
					</div>

					<!-- Live Activity -->
					<div class="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl shadow-xl">
						<p class="relative z-10 mb-4 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
							<span class="text-base">⚡</span> Live Activity
							<span class="flex h-1.5 w-1.5 relative ml-auto">
								<span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
								<span class="relative inline-flex h-1.5 w-1.5 rounded-full bg-green-500"></span>
							</span>
						</p>
						<div class="relative z-10 flex max-h-72 flex-col gap-2 overflow-y-auto pr-1">
							{#each activity as a (a.id)}
								<div class="group rounded-xl border border-white/5 bg-black/20 px-3 py-2.5 transition-colors hover:bg-white/5">
									<div class="flex items-center justify-between">
										<span class="text-[11px] font-bold text-slate-300">{a.user}</span>
										<span class="font-mono text-[10px] font-black {a.side === 'YES' ? 'text-green-400 drop-shadow-[0_0_5px_rgba(74,222,128,0.3)]' : 'text-red-400 drop-shadow-[0_0_5px_rgba(248,113,113,0.3)]'}">
											{a.side} · <span class="text-white">${a.amt}</span>
										</span>
									</div>
									<p class="mt-1 text-[10px] font-medium text-slate-500 line-clamp-1">{a.market}</p>
									<p class="mt-0.5 text-[9px] text-slate-600">{a.ts}</p>
								</div>
							{/each}
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>

<!-- ── Market Detail Modal ────────────────────────────────────────────────────── -->
{#if selectedMarket}
	<button
		class="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm"
		onclick={() => (selectedMarket = null)}
		aria-label="Close modal"
	></button>

	<div class="fixed inset-0 z-50 flex items-center justify-center p-4">
		<div class="relative flex w-full max-w-2xl flex-col rounded-3xl border border-white/10 bg-white/5 backdrop-blur-2xl shadow-2xl shadow-blue-900/20 overflow-hidden max-h-[90vh] overflow-y-auto">

			<div class="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#4f7cff]/20 blur-[80px] pointer-events-none"></div>

			<!-- Modal header -->
			<div class="relative z-10 border-b border-white/10 bg-black/40 p-6">
				<button onclick={() => (selectedMarket = null)} class="absolute right-5 top-5 text-slate-400 hover:text-white transition-colors text-xl" aria-label="Close modal">✕</button>
				<div class="mb-3 flex items-center gap-3">
					<span class="rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider shadow-sm {CAT_COLORS[selectedMarket.cat] ?? 'bg-white/10 text-white'}">{selectedMarket.cat}</span>
					<span class="text-[10px] font-bold text-slate-400">Ends {selectedMarket.end} <span class="mx-1">•</span> <span class="text-slate-300">{selectedMarket.traders.toLocaleString()}</span> traders</span>
				</div>
				<h2 class="text-xl font-black leading-tight text-white pr-8 drop-shadow-sm">{selectedMarket.q}</h2>
				<div class="mt-4 flex flex-wrap gap-5 text-xs text-slate-400 font-medium">
					<span class="flex items-center gap-1">Vol <span class="font-bold text-white tracking-wide">{fmtVol(selectedMarket.vol)}</span></span>
					<span class="flex items-center gap-1">YES <span class="font-bold text-green-400 drop-shadow-[0_0_5px_rgba(74,222,128,0.3)]">{selectedMarket.yes}¢</span></span>
					<span class="flex items-center gap-1">NO <span class="font-bold text-red-400 drop-shadow-[0_0_5px_rgba(248,113,113,0.3)]">{100 - selectedMarket.yes}¢</span></span>
				</div>
			</div>

			<!-- Probability chart -->
			<div class="relative z-10 border-b border-white/5 bg-black/20 p-6">
				<p class="mb-3 text-[10px] font-black uppercase tracking-widest text-slate-500">Probability Over Time</p>
				<svg viewBox="0 0 {CW} {CH}" class="w-full rounded-2xl bg-black/40 border border-white/5 shadow-inner" preserveAspectRatio="none">
					<!-- Grid -->
					{#each [0.25, 0.5, 0.75] as r}
						<line x1={PAD} y1={PAD + r*(CH-PAD*2)} x2={CW-PAD} y2={PAD + r*(CH-PAD*2)} stroke="rgba(255,255,255,0.03)" stroke-width="1"/>
					{/each}
					<!-- YES line -->
					<polyline
						points={chartPoints(selectedMarket.history, 'yes')}
						fill="none" stroke="#4ade80" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"
						style="filter: drop-shadow(0 0 4px rgba(74, 222, 128, 0.4));"
					/>
					<!-- NO line -->
					<polyline
						points={chartPoints(selectedMarket.history, 'no')}
						fill="none" stroke="#f87171" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"
						style="filter: drop-shadow(0 0 4px rgba(248, 113, 113, 0.4));"
					/>
					<!-- Legend -->
					<rect x={CW-80} y={12} width={8} height={8} rx="2" fill="#4ade80"/>
					<text x={CW-66} y={19} fill="rgba(255,255,255,0.7)" font-size="9" font-weight="bold">YES</text>
					<rect x={CW-80} y={26} width={8} height={8} rx="2" fill="#f87171"/>
					<text x={CW-66} y={33} fill="rgba(255,255,255,0.7)" font-size="9" font-weight="bold">NO</text>
				</svg>
			</div>

			<!-- Buy panel -->
			<div class="relative z-10 bg-black/40 p-6">
				{#if betSuccess}
					<div class="rounded-2xl border border-green-400/30 bg-gradient-to-br from-green-400/20 to-emerald-500/10 py-10 text-center shadow-[0_0_30px_rgba(74,222,128,0.1)]">
						<p class="text-4xl mb-3 animate-bounce">🎉</p>
						<p class="text-lg font-black tracking-tight text-green-400">Bet placed successfully!</p>
						<p class="text-sm font-medium text-slate-400 mt-2">Good luck, ser.</p>
					</div>
				{:else}
					<!-- YES / NO toggle -->
					<div class="mb-5 grid grid-cols-2 gap-3 rounded-2xl bg-black/50 p-1.5 border border-white/5 shadow-inner">
						<button
							onclick={() => (betSide = 'yes')}
							class="rounded-xl py-3 text-sm font-black transition-all duration-200
								{betSide === 'yes' ? 'bg-gradient-to-b from-green-400 to-green-600 text-white shadow-[0_0_15px_rgba(74,222,128,0.4)] scale-[1.02]' : 'bg-transparent text-slate-400 hover:bg-white/5 hover:text-green-300'}"
						>✅ YES <span class="opacity-80 ml-1">· {selectedMarket.yes}¢</span></button>
						<button
							onclick={() => (betSide = 'no')}
							class="rounded-xl py-3 text-sm font-black transition-all duration-200
								{betSide === 'no' ? 'bg-gradient-to-b from-red-400 to-red-600 text-white shadow-[0_0_15px_rgba(248,113,113,0.4)] scale-[1.02]' : 'bg-transparent text-slate-400 hover:bg-white/5 hover:text-red-300'}"
						>❌ NO <span class="opacity-80 ml-1">· {100 - selectedMarket.yes}¢</span></button>
					</div>

					<!-- Amount -->
					<div class="mb-4">
						<label for="bet-amount" class="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-400">Amount (USDC)</label>
						<div class="flex gap-2">
							<input
								id="bet-amount"
								bind:value={betAmount}
								type="number"
								class="flex-1 rounded-2xl border border-white/10 bg-black/40 px-5 py-3 text-base font-bold text-white outline-none transition-all focus:border-[#4f7cff] focus:bg-white/5 focus:shadow-[0_0_15px_rgba(79,124,255,0.2)]"
							/>
							<div class="flex gap-2">
								{#each [10, 50, 100, 500] as q}
									<button onclick={() => (betAmount = String(q))} class="rounded-xl border border-white/10 bg-white/5 px-3 text-xs font-bold text-slate-300 transition-colors hover:border-[#4f7cff]/50 hover:bg-[#4f7cff]/10 hover:text-white">${q}</button>
								{/each}
							</div>
						</div>
					</div>

					<!-- Potential return -->
					{#if parseFloat(betAmount) > 0}
						{@const ret = potentialReturn()}
						<div class="mb-5 rounded-2xl border border-white/5 bg-black/30 p-4 text-xs shadow-inner">
							<div class="flex justify-between items-center mb-1.5">
								<span class="text-slate-400 font-medium">Potential return</span>
								<span class="font-black text-white text-sm">${ret.payout} <span class="text-green-400 text-xs ml-0.5">(+{ret.pct}%)</span></span>
							</div>
							<div class="flex justify-between items-center mb-1.5">
								<span class="text-slate-400 font-medium">Profit if correct</span>
								<span class="font-bold text-green-400">+${ret.profit}</span>
							</div>
							<div class="flex justify-between items-center">
								<span class="text-slate-400 font-medium">Shares</span>
								<span class="font-mono text-slate-300 font-bold">{((parseFloat(betAmount) || 0) / (betSide === 'yes' ? selectedMarket.yes : 100 - selectedMarket.yes) * 100).toFixed(1)}</span>
							</div>
						</div>
					{/if}

					<button
						onclick={placeBet}
						disabled={!betAmount || parseFloat(betAmount) <= 0 || betLoading}
						class="group/btn relative w-full overflow-hidden rounded-2xl p-[2px] transition-all disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98]
							{betSide === 'yes'
								? 'bg-gradient-to-br from-green-300 to-green-600 shadow-[0_0_20px_rgba(74,222,128,0.3)] hover:shadow-[0_0_30px_rgba(74,222,128,0.4)]'
								: 'bg-gradient-to-br from-red-300 to-red-600 shadow-[0_0_20px_rgba(248,113,113,0.3)] hover:shadow-[0_0_30px_rgba(248,113,113,0.4)]'}"
					>
						<div class="relative flex items-center justify-center rounded-xl bg-black/20 px-4 py-3.5 backdrop-blur-sm transition-colors group-hover/btn:bg-transparent">
							<span class="text-base font-black text-white drop-shadow-md">
								{betLoading ? '⏳ Placing bet…' : `Place ${betSide.toUpperCase()} · $${betAmount || 0}`}
							</span>
						</div>
					</button>

					<p class="mt-4 text-center text-[10px] font-bold text-slate-500 uppercase tracking-widest">Resolves {selectedMarket.end} · JamCat Markets</p>
				{/if}
			</div>
		</div>
	</div>
{/if}

<!-- ── Toast ──────────────────────────────────────────────────────────────────── -->
{#if toast}
	<div class="fixed bottom-8 left-1/2 z-[60] -translate-x-1/2 rounded-full border border-white/20 bg-black/80 backdrop-blur-xl px-6 py-3 text-sm font-bold tracking-wide text-white shadow-[0_10px_40px_rgba(0,0,0,0.5)] flex items-center gap-2">
		{toast}
	</div>
{/if}
