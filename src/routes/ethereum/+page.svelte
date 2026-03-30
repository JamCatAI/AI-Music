<svelte:head>
	<title>Ethereum | JamCat</title>
</svelte:head>

<script>
	import { onMount } from 'svelte';

	const rand = (min, max) => Math.random() * (max - min) + min;
	const randInt = (min, max) => Math.floor(rand(min, max));
	const fmt = (n, d = 2) => n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
	const fmtB = (n) => n >= 1e12 ? `$${(n/1e12).toFixed(2)}T` : n >= 1e9 ? `$${(n/1e9).toFixed(1)}B` : `$${(n/1e6).toFixed(0)}M`;

	// ── Market data ───────────────────────────────────────────────────────────────
	let ethPrice    = $state(2_840);
	let ethChange   = $state(1.87);
	let marketCap   = $state(341_000_000_000);
	let dominance   = $state(17.4);
	let dailyVol    = $state(18_700_000_000);
	let ath         = $state(4_878);
	let tvl         = $state(52_400_000_000);

	// ── Network stats ─────────────────────────────────────────────────────────────
	let gasPrice    = $state(14.2);   // gwei
	let blockTime   = $state(12.04);  // seconds
	let blockNumber = $state(21_842_330);
	let validators  = $state(1_063_800);
	let stakingAPR  = $state(3.84);
	let totalStaked = $state(34_200_000); // ETH
	let burnedToday = $state(482.3);    // ETH
	let issuanceNet = $state(-124.7);   // ETH net (negative = deflationary)
	let totalBurned = $state(4_620_000); // all-time ETH burned

	// ── Gas tiers ─────────────────────────────────────────────────────────────────
	let gasSlow   = $derived(Math.max(8,  Math.round(gasPrice * 0.7)));
	let gasMed    = $derived(Math.round(gasPrice));
	let gasFast   = $derived(Math.round(gasPrice * 1.4));
	let gasRocket = $derived(Math.round(gasPrice * 2.1));

	// ── Price chart ───────────────────────────────────────────────────────────────
	const CW = 700, CH = 140;
	let priceHistory = $state([]);

	function makePriceHistory() {
		const pts = [];
		let p = 2400;
		for (let i = 0; i < 120; i++) {
			p += rand(-60, 70);
			pts.push(Math.max(1500, p));
		}
		pts.push(2840);
		return pts;
	}

	function pricePath(pts) {
		if (!pts.length) return '';
		const min = Math.min(...pts), max = Math.max(...pts);
		const range = max - min || 1;
		const x = (i) => (i / (pts.length - 1)) * CW;
		const y = (v) => CH - ((v - min) / range) * CH;
		return pts.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
	}
	function priceArea(pts) {
		if (!pts.length) return '';
		return pricePath(pts) + ` L${CW},${CH} L0,${CH} Z`;
	}

	let chartTf = $state('1D');
	const TFS = ['1H', '4H', '1D', '1W', '1M', 'ALL'];

	// ── Ecosystem ─────────────────────────────────────────────────────────────────
	const CATEGORIES = ['All', 'L2', 'DeFi', 'NFT', 'Staking', 'Infra', 'AI'];

	const ECOSYSTEM = [
		{ name: 'Uniswap',      cat: 'DeFi',    desc: 'Leading DEX with $5B+ TVL, v4 with hooks',         logo: '🦄', color: '#FF007A', stat: '$4.8B',   statLabel: 'TVL',    hot: true  },
		{ name: 'Aave',         cat: 'DeFi',    desc: 'Largest lending protocol on Ethereum',             logo: '👻', color: '#B6509E', stat: '$14.2B',  statLabel: 'TVL',    hot: true  },
		{ name: 'Lido',         cat: 'Staking', desc: 'Liquid staking — 29% of all staked ETH',           logo: '🌊', color: '#00A3FF', stat: '9.9M ETH', statLabel: 'Staked', hot: true  },
		{ name: 'EigenLayer',   cat: 'Infra',   desc: 'Restaking protocol for shared security',           logo: '⚡', color: '#6366F1', stat: '$12.1B',  statLabel: 'TVL',    hot: true  },
		{ name: 'Arbitrum',     cat: 'L2',      desc: 'Largest Optimistic Rollup by TVL',                 logo: '🔵', color: '#28A0F0', stat: '$18.4B',  statLabel: 'TVL',    hot: true  },
		{ name: 'Base',         cat: 'L2',      desc: 'Coinbase L2 — fastest growing chain',              logo: '🔷', color: '#0052FF', stat: '$11.2B',  statLabel: 'TVL',    hot: true  },
		{ name: 'Optimism',     cat: 'L2',      desc: 'OP Stack superchain, governance token',            logo: '🔴', color: '#FF0420', stat: '$6.8B',   statLabel: 'TVL',    hot: false },
		{ name: 'zkSync Era',   cat: 'L2',      desc: 'ZK rollup with native account abstraction',        logo: '⚡', color: '#8C8DFC', stat: '$4.1B',   statLabel: 'TVL',    hot: false },
		{ name: 'Scroll',       cat: 'L2',      desc: 'EVM-compatible ZK rollup',                         logo: '📜', color: '#FFDBB5', stat: '$1.3B',   statLabel: 'TVL',    hot: false },
		{ name: 'Blur',         cat: 'NFT',     desc: 'Pro NFT marketplace with 70%+ market share',      logo: '💨', color: '#FF8700', stat: '68%',     statLabel: 'Share',  hot: false },
		{ name: 'OpenSea',      cat: 'NFT',     desc: 'Original NFT marketplace, seaport protocol',      logo: '🌊', color: '#2081E2', stat: '28%',     statLabel: 'Share',  hot: false },
		{ name: 'Pendle',       cat: 'DeFi',    desc: 'Yield trading protocol — tokenize future yield',  logo: '🔮', color: '#3B82F6', stat: '$4.2B',   statLabel: 'TVL',    hot: true  },
		{ name: 'Ethena',       cat: 'DeFi',    desc: 'Synthetic dollar USDe backed by ETH delta hedge', logo: '💎', color: '#7C3AED', stat: '$5.1B',   statLabel: 'Supply', hot: true  },
		{ name: 'Gnosis',       cat: 'Infra',   desc: 'Smart wallet infrastructure & prediction markets', logo: '🦉', color: '#04795B', stat: '—',       statLabel: '—',      hot: false },
		{ name: 'Worldcoin',    cat: 'AI',      desc: 'Global identity protocol via iris biometrics',    logo: '🌐', color: '#000000', stat: '7.5M',    statLabel: 'Users',  hot: false },
		{ name: 'Bittensor',    cat: 'AI',      desc: 'Decentralized AI network with subnet system',     logo: '🧠', color: '#6EE7B7', stat: '—',       statLabel: '—',      hot: true  },
	];

	let selectedCat = $state('All');
	let filtered = $derived(selectedCat === 'All' ? ECOSYSTEM : ECOSYSTEM.filter(p => p.cat === selectedCat));

	// ── L2 TVL breakdown ──────────────────────────────────────────────────────────
	const L2S = [
		{ name: 'Arbitrum',   tvl: 18.4, color: '#28A0F0' },
		{ name: 'Base',       tvl: 11.2, color: '#0052FF' },
		{ name: 'Optimism',   tvl:  6.8, color: '#FF0420' },
		{ name: 'zkSync Era', tvl:  4.1, color: '#8C8DFC' },
		{ name: 'Scroll',     tvl:  1.3, color: '#FFDBB5' },
		{ name: 'Others',     tvl:  4.6, color: '#4A5568' },
	];

	function donutPaths(items, cx, cy, r, gap = 2) {
		const total = items.reduce((s, p) => s + p.tvl, 0);
		let angle = -Math.PI / 2;
		return items.map(p => {
			const sweep = (p.tvl / total) * (2 * Math.PI) - (gap * Math.PI / 180);
			const x1 = cx + r * Math.cos(angle);
			const y1 = cy + r * Math.sin(angle);
			const x2 = cx + r * Math.cos(angle + sweep);
			const y2 = cy + r * Math.sin(angle + sweep);
			const large = sweep > Math.PI ? 1 : 0;
			const d = `M${cx},${cy} L${x1.toFixed(2)},${y1.toFixed(2)} A${r},${r} 0 ${large},1 ${x2.toFixed(2)},${y2.toFixed(2)} Z`;
			angle += sweep + (gap * Math.PI / 180);
			return { ...p, d };
		});
	}

	let l2Slices = $derived(donutPaths(L2S, 80, 80, 68));
	let totalL2TVL = $derived(L2S.reduce((s, l) => s + l.tvl, 0).toFixed(1));

	// ── Upgrades ─────────────────────────────────────────────────────────────────
	const UPGRADES = [
		{ name: 'Pectra',        date: 'Apr 2025',  status: 'live',     desc: 'EIP-7702 AA, 2x blob throughput, validator improvements', color: '#627EEA' },
		{ name: 'Fusaka',        date: 'Q4 2025',   status: 'live',     desc: 'EOF + PeerDAS — full danksharding data availability',      color: '#A78BFA' },
		{ name: 'Glamsterdam',   date: 'Q2 2026',   status: 'upcoming', desc: 'Verkle trees + stateless clients, state expiry',           color: '#34D399' },
		{ name: 'Single Slot Finality', date: 'Q3 2026', status: 'upcoming', desc: 'Finality in one 12s slot vs current ~15 min',        color: '#F472B6' },
		{ name: 'EIP-4844 v2',   date: 'Q4 2026',   status: 'upcoming', desc: 'Full danksharding — 16 MB/s L2 data bandwidth',          color: '#60A5FA' },
	];

	// ── Recent blocks ─────────────────────────────────────────────────────────────
	const VALIDATORS_SAMPLE = ['Lido', 'Coinbase', 'Binance', 'Kraken', 'Figment', 'P2P.org', 'Unknown'];

	function makeBlock(number) {
		return {
			number,
			txCount: randInt(120, 380),
			gasUsed: randInt(60, 99),    // % of limit
			baseFee: rand(8, 22).toFixed(1),
			burned: rand(0.02, 0.18).toFixed(4),
			validator: VALIDATORS_SAMPLE[randInt(0, VALIDATORS_SAMPLE.length)],
			age: randInt(1, 4),
		};
	}

	let recentBlocks = $state([]);

	onMount(() => {
		priceHistory = makePriceHistory();
		recentBlocks = Array.from({ length: 8 }, (_, i) => makeBlock(blockNumber - i));

		const tickPrice = setInterval(() => {
			ethPrice = Math.round(ethPrice * (1 + rand(-0.0005, 0.0006)));
			ethChange = parseFloat((ethChange + rand(-0.02, 0.02)).toFixed(2));
			gasPrice = parseFloat(Math.max(3, gasPrice + rand(-1.2, 1.4)).toFixed(1));
			burnedToday = parseFloat((burnedToday + rand(-0.5, 0.6)).toFixed(1));
			issuanceNet = parseFloat((issuanceNet + rand(-0.2, 0.2)).toFixed(1));
		}, 1400);

		const tickBlock = setInterval(() => {
			blockNumber += 1;
			recentBlocks = [makeBlock(blockNumber), ...recentBlocks.slice(0, 7)];
		}, 4000); // 12s real → 4s demo

		const tickChart = setInterval(() => {
			priceHistory = [...priceHistory.slice(1), ethPrice + rand(-15, 15)];
		}, 2500);

		return () => {
			clearInterval(tickPrice);
			clearInterval(tickBlock);
			clearInterval(tickChart);
		};
	});
</script>

<div class="min-h-screen" style="background: radial-gradient(ellipse at 20% 10%, #0d0f2e 0%, #0a0a1a 50%, #0d1a0d 100%);">

	<!-- Header -->
	<div class="border-b border-white/10 bg-black/40 backdrop-blur-md px-6 py-4">
		<div class="mx-auto max-w-7xl flex items-center justify-between">
			<div class="flex items-center gap-3">
				<div class="flex h-10 w-10 items-center justify-center rounded-xl text-2xl font-black" style="background: linear-gradient(135deg, #627EEA, #A78BFA);">
					Ξ
				</div>
				<div>
					<h1 class="text-xl font-black text-white">Ethereum</h1>
					<p class="text-xs text-white/40">Mainnet · Post-Merge · Proof of Stake</p>
				</div>
			</div>
			<div class="flex items-center gap-4 text-xs font-mono">
				<div class="text-center">
					<p class="text-white/40">Net issuance</p>
					<p class="{issuanceNet < 0 ? 'text-green-400' : 'text-red-400'} font-bold">{issuanceNet > 0 ? '+' : ''}{fmt(issuanceNet, 1)} ETH/day</p>
				</div>
				<div class="text-center">
					<p class="text-white/40">Total burned</p>
					<p class="text-orange-400 font-bold">{(totalBurned/1e6).toFixed(3)}M ETH</p>
				</div>
				<div class="flex items-center gap-1.5">
					<span class="h-2 w-2 rounded-full animate-pulse" style="background:#627EEA"></span>
					<span style="color:#627EEA">Block {blockNumber.toLocaleString()}</span>
				</div>
			</div>
		</div>
	</div>

	<div class="mx-auto max-w-7xl px-6 py-6 space-y-6">

		<!-- Top stats -->
		<div class="grid grid-cols-2 gap-3 lg:grid-cols-4">
			{#each [
				{ label: 'ETH Price',     value: `$${fmt(ethPrice, 0)}`,                    sub: `${ethChange >= 0 ? '+' : ''}${fmt(ethChange)}% 24h`,  up: ethChange >= 0 },
				{ label: 'Market Cap',    value: fmtB(marketCap),                            sub: `${fmt(dominance, 1)}% dominance`,                      up: true  },
				{ label: 'Total TVL',     value: fmtB(tvl),                                  sub: 'DeFi locked value',                                    up: true  },
				{ label: 'Staked ETH',    value: `${(totalStaked/1e6).toFixed(1)}M ETH`,    sub: `${fmt(stakingAPR, 2)}% APR`,                           up: true  },
			] as s}
			<div class="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-4">
				<p class="text-xs text-white/40 mb-1">{s.label}</p>
				<p class="text-2xl font-black text-white font-mono leading-tight">{s.value}</p>
				<p class="text-xs mt-1 {s.up ? 'text-blue-400' : 'text-red-400'}">{s.sub}</p>
			</div>
			{/each}
		</div>

		<!-- Chart + Gas panel -->
		<div class="grid grid-cols-1 gap-4 lg:grid-cols-3">

			<!-- Price chart -->
			<div class="lg:col-span-2 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-5">
				<div class="flex items-center justify-between mb-4">
					<div>
						<p class="text-white font-bold">ETH / USD</p>
						<p class="text-3xl font-black font-mono" style="color: #627EEA">${fmt(ethPrice, 0)}</p>
						<p class="text-sm {ethChange >= 0 ? 'text-green-400' : 'text-red-400'}">{ethChange >= 0 ? '+' : ''}{fmt(ethChange)}% today · ATH ${fmt(ath, 0)}</p>
					</div>
					<div class="flex gap-1">
						{#each TFS as tf}
						<button onclick={() => chartTf = tf}
							class="px-2.5 py-1 rounded-lg text-xs font-bold transition-all {chartTf === tf ? 'text-white' : 'text-white/40 hover:text-white/70'}"
							style={chartTf === tf ? 'background: #627EEA' : ''}
						>{tf}</button>
						{/each}
					</div>
				</div>

				{#if priceHistory.length > 0}
				<svg viewBox="0 0 {CW} {CH}" class="w-full" preserveAspectRatio="none" style="height:150px">
					<defs>
						<linearGradient id="ethGrad" x1="0" y1="0" x2="0" y2="1">
							<stop offset="0%" stop-color="#627EEA" stop-opacity="0.4"/>
							<stop offset="100%" stop-color="#627EEA" stop-opacity="0"/>
						</linearGradient>
					</defs>
					<path d={priceArea(priceHistory)} fill="url(#ethGrad)"/>
					<path d={pricePath(priceHistory)} fill="none" stroke="#627EEA" stroke-width="2.5" stroke-linejoin="round"/>
				</svg>
				{/if}

				<div class="mt-3 grid grid-cols-3 gap-3 border-t border-white/10 pt-3">
					<div><p class="text-xs text-white/40">24h Volume</p><p class="text-sm font-bold text-white">{fmtB(dailyVol)}</p></div>
					<div><p class="text-xs text-white/40">Burned Today</p><p class="text-sm font-bold text-orange-400">{fmt(burnedToday, 1)} ETH</p></div>
					<div><p class="text-xs text-white/40">Net Issuance</p><p class="text-sm font-bold {issuanceNet < 0 ? 'text-green-400' : 'text-red-400'}">{issuanceNet > 0 ? '+' : ''}{fmt(issuanceNet, 1)} ETH</p></div>
				</div>
			</div>

			<!-- Gas + Network -->
			<div class="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-5 space-y-4">
				<p class="text-white font-bold">Gas & Network</p>

				<!-- Gas tracker -->
				<div class="grid grid-cols-2 gap-2">
					{#each [
						{ label: '🐢 Slow',    gwei: gasSlow,   time: '~5m',  color: '#718096' },
						{ label: '🚶 Normal',  gwei: gasMed,    time: '~30s', color: '#48BB78' },
						{ label: '🏃 Fast',    gwei: gasFast,   time: '~12s', color: '#ECC94B' },
						{ label: '🚀 Instant', gwei: gasRocket, time: '~1s',  color: '#627EEA' },
					] as g}
					<div class="rounded-xl bg-white/5 border border-white/10 p-2.5 text-center">
						<p class="text-xs text-white/40 mb-0.5">{g.label}</p>
						<p class="text-lg font-black font-mono" style="color:{g.color}">{g.gwei}</p>
						<p class="text-xs text-white/30">Gwei · {g.time}</p>
					</div>
					{/each}
				</div>

				<div class="space-y-2.5">
					<div class="flex justify-between">
						<span class="text-white/50 text-sm">Block Time</span>
						<span class="text-white font-mono text-sm font-bold">{fmt(blockTime, 2)}s</span>
					</div>
					<div class="flex justify-between">
						<span class="text-white/50 text-sm">Validators</span>
						<span class="text-white font-mono text-sm font-bold">{(validators/1000).toFixed(1)}K</span>
					</div>
					<div class="flex justify-between">
						<span class="text-white/50 text-sm">Staking APR</span>
						<span class="text-green-400 font-mono text-sm font-bold">{fmt(stakingAPR, 2)}%</span>
					</div>
					<div class="flex justify-between">
						<span class="text-white/50 text-sm">ETH Staked</span>
						<span class="text-white font-mono text-sm font-bold">{(totalStaked/1e6).toFixed(2)}M</span>
					</div>
					<div>
						<div class="flex justify-between text-sm mb-1">
							<span class="text-white/50">Staking %</span>
							<span class="text-white font-mono font-bold">{((totalStaked/120e6)*100).toFixed(1)}%</span>
						</div>
						<div class="h-2 rounded-full bg-white/10 overflow-hidden">
							<div class="h-full rounded-full transition-all" style="width:{((totalStaked/120e6)*100).toFixed(1)}%; background: linear-gradient(90deg, #627EEA, #A78BFA)"></div>
						</div>
					</div>
				</div>

				<!-- EIP-1559 burn -->
				<div class="rounded-xl bg-orange-500/10 border border-orange-500/20 p-3 text-center">
					<p class="text-xs text-orange-400/70 mb-1">All-Time Burned (EIP-1559)</p>
					<p class="text-2xl font-black font-mono text-orange-400">{(totalBurned/1e6).toFixed(3)}M</p>
					<p class="text-xs text-white/40 mt-1">ETH · ≈ ${fmtB(totalBurned * ethPrice)}</p>
				</div>
			</div>
		</div>

		<!-- Ecosystem -->
		<div class="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-5">
			<div class="flex items-center justify-between mb-4 flex-wrap gap-3">
				<p class="text-white font-bold text-lg">Ecosystem</p>
				<div class="flex flex-wrap gap-1">
					{#each CATEGORIES as cat}
					<button onclick={() => selectedCat = cat}
						class="px-3 py-1 rounded-full text-xs font-bold transition-all border {selectedCat === cat ? 'border-transparent text-white' : 'border-white/20 text-white/50 hover:text-white/80'}"
						style={selectedCat === cat ? 'background: linear-gradient(135deg, #627EEA, #A78BFA)' : ''}
					>{cat}</button>
					{/each}
				</div>
			</div>
			<div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
				{#each filtered as p}
				<div class="relative rounded-xl border bg-white/5 p-4 hover:bg-white/10 transition-all cursor-pointer"
				     style="border-color: {p.color}33">
					{#if p.hot}
					<span class="absolute top-3 right-3 text-xs px-2 py-0.5 rounded-full font-bold text-white" style="background: #627EEA">🔥</span>
					{/if}
					<div class="flex items-center gap-3 mb-2">
						<div class="flex h-10 w-10 items-center justify-center rounded-xl text-xl shrink-0"
						     style="background: {p.color}22; border: 1px solid {p.color}44">{p.logo}</div>
						<div>
							<p class="text-white font-bold text-sm">{p.name}</p>
							<span class="text-xs px-2 py-0.5 rounded-full" style="background: {p.color}22; color: {p.color}">{p.cat}</span>
						</div>
					</div>
					<p class="text-white/50 text-xs mb-3 leading-relaxed">{p.desc}</p>
					<div class="flex justify-between text-xs">
						<span class="text-white/30">{p.statLabel}</span>
						<span class="text-white font-mono font-bold">{p.stat}</span>
					</div>
				</div>
				{/each}
			</div>
		</div>

		<!-- Bottom: L2 donut + Upgrades + Recent blocks -->
		<div class="grid grid-cols-1 gap-4 lg:grid-cols-3">

			<!-- L2 TVL donut -->
			<div class="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-5">
				<p class="text-white font-bold mb-4">L2 TVL Breakdown</p>
				<div class="flex items-center gap-4">
					<svg viewBox="0 0 160 160" class="shrink-0" style="width:160px;height:160px">
						{#each l2Slices as s}
						<path d={s.d} fill={s.color} class="hover:opacity-80 transition-opacity cursor-pointer"/>
						{/each}
						<circle cx="80" cy="80" r="36" fill="#0a0a1a"/>
						<text x="80" y="75" text-anchor="middle" fill="white" font-size="9" font-family="monospace" fill-opacity="0.5">Total L2</text>
						<text x="80" y="89" text-anchor="middle" fill="white" font-size="12" font-family="monospace" font-weight="bold">${totalL2TVL}B</text>
					</svg>
					<div class="space-y-2 flex-1">
						{#each L2S as l}
						<div class="flex items-center justify-between text-xs">
							<div class="flex items-center gap-1.5">
								<span class="h-2 w-2 rounded-full shrink-0" style="background:{l.color}"></span>
								<span class="text-white/70">{l.name}</span>
							</div>
							<span class="text-white font-mono font-bold">${l.tvl}B</span>
						</div>
						{/each}
					</div>
				</div>
			</div>

			<!-- Upgrades -->
			<div class="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-5">
				<p class="text-white font-bold mb-4">Roadmap</p>
				<div class="relative pl-4 space-y-4">
					<div class="absolute left-[7px] top-2 bottom-2 w-px bg-white/10"></div>
					{#each UPGRADES as u}
					<div class="relative">
						<div class="absolute -left-4 top-1 h-3 w-3 rounded-full border-2 border-black"
						     style="background: {u.status === 'live' ? u.color : '#333'}"></div>
						<div class="flex items-start justify-between gap-2">
							<div>
								<p class="text-white text-sm font-bold">{u.name}</p>
								<p class="text-white/40 text-xs mt-0.5 leading-relaxed">{u.desc}</p>
							</div>
							<div class="shrink-0 text-right">
								<p class="text-xs font-mono text-white/50">{u.date}</p>
								<span class="text-xs px-2 py-0.5 rounded-full font-bold"
								      style={u.status === 'live'
								           ? `background: ${u.color}22; color: ${u.color}`
								           : 'background: #ffffff11; color: #ffffff44'}>
									{u.status === 'live' ? '● Live' : '○ Soon'}
								</span>
							</div>
						</div>
					</div>
					{/each}
				</div>
			</div>

			<!-- Recent blocks -->
			<div class="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-5">
				<div class="flex items-center justify-between mb-4">
					<p class="text-white font-bold">Recent Blocks</p>
					<span class="flex items-center gap-1 text-xs" style="color:#627EEA">
						<span class="h-1.5 w-1.5 rounded-full animate-pulse" style="background:#627EEA"></span>~12s
					</span>
				</div>
				<div class="space-y-2">
					{#each recentBlocks as b}
					<div class="rounded-xl bg-white/5 border border-white/10 p-3">
						<div class="flex items-center justify-between mb-1">
							<span class="font-mono font-bold text-sm" style="color:#627EEA">#{b.number.toLocaleString()}</span>
							<span class="text-white/40 text-xs">{b.age * 12}s ago</span>
						</div>
						<div class="flex items-center justify-between text-xs text-white/50 mb-1">
							<span>{b.txCount} txns · {b.baseFee} gwei base</span>
							<span class="text-orange-400 font-mono">🔥 {b.burned} ETH</span>
						</div>
						<div class="flex items-center justify-between text-xs">
							<div class="flex items-center gap-1.5">
								<span class="text-white/30">Gas</span>
								<div class="h-1.5 w-16 rounded-full bg-white/10 overflow-hidden">
									<div class="h-full rounded-full" style="width:{b.gasUsed}%; background: {b.gasUsed > 90 ? '#EF4444' : b.gasUsed > 70 ? '#F59E0B' : '#48BB78'}"></div>
								</div>
								<span class="text-white/40">{b.gasUsed}%</span>
							</div>
							<span class="text-white/30 truncate max-w-20">{b.validator}</span>
						</div>
					</div>
					{/each}
				</div>
			</div>

		</div>
	</div>
</div>
