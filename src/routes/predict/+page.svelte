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
					<div class="mb-6">
						<p class="mb-3 text-xs font-bold uppercase tracking-widest text-slate-500">🔥 Featured</p>
						<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
							{#each featured() as m (m.id)}
								<button
									onclick={() => openMarket(m)}
									class="group flex flex-col rounded-2xl border border-white/8 bg-[#1a1b1f] p-5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-[#4f7cff]/30 hover:shadow-lg hover:shadow-[#4f7cff]/10"
								>
									<div class="mb-3 flex items-start justify-between">
										<span class="rounded-full px-2 py-0.5 text-[10px] font-bold {CAT_COLORS[m.cat] ?? 'bg-white/10 text-white'}">{m.cat}</span>
										<span class="text-[10px] text-slate-500">🔥 Hot · {fmtVol(m.vol)}</span>
									</div>
									<p class="mb-4 text-sm font-bold leading-snug text-white">{m.q}</p>
									<!-- Probability bar -->
									<div class="mb-2 flex items-center gap-2 text-xs font-bold">
										<span class="text-green-400">{m.yes}%</span>
										<div class="relative flex-1 overflow-hidden rounded-full h-2 bg-red-500/30">
											<div class="absolute left-0 top-0 h-full rounded-full bg-green-400 transition-all duration-700" style="width:{m.yes}%"></div>
										</div>
										<span class="text-red-400">{100 - m.yes}%</span>
									</div>
									<div class="flex gap-2 text-[10px] text-slate-500">
										<span>YES · {m.yes}¢</span>
										<span>·</span>
										<span>NO · {100 - m.yes}¢</span>
									</div>
									<div class="mt-4 grid grid-cols-2 gap-2">
										<div class="rounded-xl border border-green-400/20 bg-green-400/10 py-1.5 text-center text-xs font-bold text-green-400 transition-colors group-hover:bg-green-400/15">Buy YES</div>
										<div class="rounded-xl border border-red-400/20 bg-red-400/10 py-1.5 text-center text-xs font-bold text-red-400 transition-colors group-hover:bg-red-400/15">Buy NO</div>
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
				<div class="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
					{#each filtered() as m (m.id)}
						<button
							onclick={() => openMarket(m)}
							class="group flex flex-col rounded-2xl border border-white/8 bg-[#1a1b1f] p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-[#4f7cff]/30 hover:shadow-md hover:shadow-[#4f7cff]/10"
						>
							<!-- Badge -->
							<div class="mb-2 flex items-center justify-between">
								<span class="rounded-full px-2 py-0.5 text-[9px] font-bold {CAT_COLORS[m.cat] ?? 'bg-white/10 text-white'}">{m.cat}</span>
								<span class="text-[9px] text-slate-600">ends {m.end}</span>
							</div>
							<!-- Question -->
							<p class="mb-3 line-clamp-2 text-xs font-semibold leading-snug text-white">{m.q}</p>
							<!-- Prob bar -->
							<div class="mb-1 flex items-center gap-1.5 text-[11px] font-bold">
								<span class="text-green-400 w-8">{m.yes}%</span>
								<div class="relative flex-1 overflow-hidden rounded-full h-1.5 bg-red-500/25">
									<div class="absolute left-0 top-0 h-full rounded-full bg-green-400 transition-all duration-700" style="width:{m.yes}%"></div>
								</div>
								<span class="text-red-400 w-8 text-right">{100 - m.yes}%</span>
							</div>
							<!-- Stats -->
							<div class="mb-3 flex gap-3 text-[9px] text-slate-500">
								<span>Vol {fmtVol(m.vol)}</span>
								<span>{m.traders.toLocaleString()} traders</span>
							</div>
							<!-- Buttons -->
							<div class="mt-auto grid grid-cols-2 gap-1.5">
								<div class="rounded-lg border border-green-400/20 bg-green-400/8 py-1 text-center text-[10px] font-bold text-green-400">Yes {m.yes}¢</div>
								<div class="rounded-lg border border-red-400/20 bg-red-400/8 py-1 text-center text-[10px] font-bold text-red-400">No {100 - m.yes}¢</div>
							</div>
						</button>
					{/each}
				</div>
			</div>

			<!-- RIGHT: sidebar -->
			<div class="flex w-full flex-col gap-4 lg:w-72 lg:shrink-0">
				<div class="lg:sticky lg:top-20 flex flex-col gap-4">

					<!-- Volume Leaders -->
					<div class="rounded-2xl border border-white/8 bg-[#1a1b1f] p-4">
						<p class="mb-3 text-xs font-bold uppercase tracking-widest text-slate-500">📊 Volume Leaders</p>
						<div class="space-y-2">
							{#each volumeLeaders() as m, i}
								<button onclick={() => openMarket(m)} class="group flex w-full items-center gap-2 rounded-lg p-1.5 transition-colors hover:bg-white/5">
									<span class="w-4 text-[10px] font-bold text-slate-600">#{i + 1}</span>
									<div class="min-w-0 flex-1">
										<p class="truncate text-[11px] text-slate-300 group-hover:text-white">{m.q.slice(0, 40)}…</p>
										<div class="mt-0.5 h-1 w-full overflow-hidden rounded-full bg-white/5">
											<div class="h-1 rounded-full bg-[#4f7cff]" style="width:{(m.vol / volumeLeaders()[0].vol * 100).toFixed(0)}%"></div>
										</div>
									</div>
									<span class="shrink-0 text-[10px] font-bold text-[#4f7cff]">{fmtVol(m.vol)}</span>
								</button>
							{/each}
						</div>
					</div>

					<!-- Your Positions -->
					<div class="rounded-2xl border border-white/8 bg-[#1a1b1f] p-4">
						<p class="mb-3 text-xs font-bold uppercase tracking-widest text-slate-500">💼 Your Positions</p>
						<div class="space-y-3">
							{#each positions as pos}
								{@const m = markets.find(x => x.q === pos.market)}
								{@const pnl = pos.current - pos.shares * pos.avgPrice}
								<div class="rounded-xl border border-white/5 bg-white/3 p-3">
									<p class="mb-1 text-[10px] text-slate-400 line-clamp-1">{pos.market.slice(0, 45)}…</p>
									<div class="flex items-center justify-between">
										<span class="rounded px-1.5 py-0.5 text-[9px] font-bold bg-green-400/20 text-green-400">{pos.side}</span>
										<span class="font-mono text-xs font-bold text-white">${pos.current.toFixed(2)}</span>
									</div>
									<div class="mt-1 flex justify-between text-[9px]">
										<span class="text-slate-500">{pos.shares} shares @ {pos.avgPrice}¢</span>
										<span class="{pnl >= 0 ? 'text-green-400' : 'text-red-400'} font-mono font-semibold">
											{pnl >= 0 ? '+' : ''}{pnl.toFixed(2)}
										</span>
									</div>
								</div>
							{/each}
						</div>
					</div>

					<!-- Live Activity -->
					<div class="rounded-2xl border border-white/8 bg-[#1a1b1f] p-4">
						<p class="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500">
							⚡ Live Activity
							<span class="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-green-400"></span>
						</p>
						<div class="max-h-72 space-y-2 overflow-y-auto pr-1">
							{#each activity as a (a.id)}
								<div class="rounded-lg border border-white/5 bg-white/3 px-2.5 py-2 text-[10px]">
									<div class="flex items-center justify-between">
										<span class="font-bold text-slate-300">{a.user}</span>
										<span class="font-mono font-bold {a.side === 'YES' ? 'text-green-400' : 'text-red-400'}">
											{a.side} · ${a.amt}
										</span>
									</div>
									<p class="mt-0.5 text-slate-500 line-clamp-1">{a.market}</p>
									<p class="mt-0.5 text-slate-600">{a.ts}</p>
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
	></button>

	<div class="fixed inset-0 z-50 flex items-center justify-center p-4">
		<div class="relative flex w-full max-w-2xl flex-col rounded-3xl border border-white/10 bg-[#15161b] shadow-2xl shadow-black/50 overflow-hidden max-h-[90vh] overflow-y-auto">

			<!-- Modal header -->
			<div class="border-b border-white/8 p-5">
				<button onclick={() => (selectedMarket = null)} class="absolute right-4 top-4 text-slate-400 hover:text-white text-lg">✕</button>
				<div class="mb-2 flex items-center gap-2">
					<span class="rounded-full px-2 py-0.5 text-[10px] font-bold {CAT_COLORS[selectedMarket.cat] ?? 'bg-white/10 text-white'}">{selectedMarket.cat}</span>
					<span class="text-[10px] text-slate-500">Ends {selectedMarket.end} · {selectedMarket.traders.toLocaleString()} traders</span>
				</div>
				<h2 class="text-base font-extrabold leading-snug text-white pr-6">{selectedMarket.q}</h2>
				<div class="mt-2 flex gap-4 text-xs text-slate-400">
					<span>Vol <span class="font-bold text-white">{fmtVol(selectedMarket.vol)}</span></span>
					<span>YES <span class="font-bold text-green-400">{selectedMarket.yes}¢</span></span>
					<span>NO <span class="font-bold text-red-400">{100 - selectedMarket.yes}¢</span></span>
				</div>
			</div>

			<!-- Probability chart -->
			<div class="border-b border-white/8 p-5">
				<p class="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">Probability Over Time</p>
				<svg viewBox="0 0 {CW} {CH}" class="w-full rounded-xl bg-black/20" preserveAspectRatio="none">
					<!-- Grid -->
					{#each [0.25, 0.5, 0.75] as r}
						<line x1={PAD} y1={PAD + r*(CH-PAD*2)} x2={CW-PAD} y2={PAD + r*(CH-PAD*2)} stroke="rgba(255,255,255,0.05)" stroke-width="1"/>
					{/each}
					<!-- YES line -->
					<polyline
						points={chartPoints(selectedMarket.history, 'yes')}
						fill="none" stroke="#4ade80" stroke-width="2" stroke-linejoin="round"
					/>
					<!-- NO line -->
					<polyline
						points={chartPoints(selectedMarket.history, 'no')}
						fill="none" stroke="#f87171" stroke-width="2" stroke-linejoin="round"
					/>
					<!-- Legend -->
					<rect x={CW-80} y={8} width={8} height={8} rx="2" fill="#4ade80"/>
					<text x={CW-68} y={16} fill="rgba(255,255,255,0.5)" font-size="9">YES</text>
					<rect x={CW-80} y={22} width={8} height={8} rx="2" fill="#f87171"/>
					<text x={CW-68} y={30} fill="rgba(255,255,255,0.5)" font-size="9">NO</text>
				</svg>
			</div>

			<!-- Buy panel -->
			<div class="p-5">
				{#if betSuccess}
					<div class="rounded-2xl border border-green-400/20 bg-green-400/10 py-8 text-center">
						<p class="text-3xl mb-2">🎉</p>
						<p class="font-bold text-green-400">Bet placed!</p>
						<p class="text-xs text-slate-400 mt-1">Good luck, ser.</p>
					</div>
				{:else}
					<!-- YES / NO toggle -->
					<div class="mb-4 grid grid-cols-2 gap-2 rounded-xl bg-black/30 p-1">
						<button
							onclick={() => (betSide = 'yes')}
							class="rounded-lg py-2.5 text-sm font-extrabold transition-all
								{betSide === 'yes' ? 'bg-green-500 text-white shadow-md shadow-green-500/30' : 'text-slate-400 hover:text-green-300'}"
						>✅ YES · {selectedMarket.yes}¢</button>
						<button
							onclick={() => (betSide = 'no')}
							class="rounded-lg py-2.5 text-sm font-extrabold transition-all
								{betSide === 'no' ? 'bg-red-500 text-white shadow-md shadow-red-500/30' : 'text-slate-400 hover:text-red-300'}"
						>❌ NO · {100 - selectedMarket.yes}¢</button>
					</div>

					<!-- Amount -->
					<div class="mb-3">
						<label class="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">Amount (USDC)</label>
						<div class="flex gap-2">
							<input
								bind:value={betAmount}
								type="number"
								class="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none focus:border-[#4f7cff]/60"
							/>
							{#each [10, 50, 100, 500] as q}
								<button onclick={() => (betAmount = String(q))} class="rounded-xl border border-white/10 bg-white/5 px-2 text-xs text-slate-400 hover:border-[#4f7cff]/40 hover:text-white">${q}</button>
							{/each}
						</div>
					</div>

					<!-- Potential return -->
					{#if parseFloat(betAmount) > 0}
						{@const ret = potentialReturn()}
						<div class="mb-4 rounded-xl border border-white/5 bg-black/20 p-3 text-xs">
							<div class="flex justify-between">
								<span class="text-slate-500">Potential return</span>
								<span class="font-bold text-white">${ret.payout} <span class="text-green-400">(+{ret.pct}%)</span></span>
							</div>
							<div class="mt-1 flex justify-between">
								<span class="text-slate-500">Profit if correct</span>
								<span class="font-bold text-green-400">+${ret.profit}</span>
							</div>
							<div class="mt-1 flex justify-between">
								<span class="text-slate-500">Shares</span>
								<span class="font-mono text-white">{((parseFloat(betAmount) || 0) / (betSide === 'yes' ? selectedMarket.yes : 100 - selectedMarket.yes) * 100).toFixed(1)}</span>
							</div>
						</div>
					{/if}

					<button
						onclick={placeBet}
						disabled={!betAmount || parseFloat(betAmount) <= 0 || betLoading}
						class="w-full rounded-xl py-3 text-sm font-extrabold transition-all disabled:cursor-not-allowed disabled:opacity-40 active:scale-95
							{betSide === 'yes'
								? 'bg-green-500 text-white shadow-lg shadow-green-500/30 hover:bg-green-400'
								: 'bg-red-500 text-white shadow-lg shadow-red-500/30 hover:bg-red-400'}"
					>
						{betLoading ? '⏳ Placing bet…' : `Place ${betSide.toUpperCase()} · $${betAmount || 0}`}
					</button>

					<p class="mt-2 text-center text-[10px] text-slate-600">Resolves {selectedMarket.end} · JamCat Markets</p>
				{/if}
			</div>
		</div>
	</div>
{/if}

<!-- ── Toast ──────────────────────────────────────────────────────────────────── -->
{#if toast}
	<div class="fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 rounded-xl border border-white/10 bg-[#1a1b1f] px-5 py-3 text-sm font-semibold text-white shadow-2xl">
		{toast}
	</div>
{/if}
