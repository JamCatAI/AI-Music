<svelte:head>
	<title>Solana | JamCat</title>
</svelte:head>

<script>
	import { onMount } from 'svelte';

	const rand = (min, max) => Math.random() * (max - min) + min;
	const randInt = (min, max) => Math.floor(rand(min, max));
	const fmt = (n, d = 2) => n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
	const fmtB = (n) => n >= 1e9 ? `$${(n/1e9).toFixed(2)}B` : `$${(n/1e6).toFixed(0)}M`;
	const ago = (s) => s < 60 ? `${s}s ago` : `${Math.floor(s/60)}m ago`;

	// ── Network Stats ─────────────────────────────────────────────────────────────
	let tps         = $state(4812);
	let slot        = $state(318_204_771);
	let epoch       = $state(742);
	let epochPct    = $state(67.4);
	let validators  = $state(1_847);
	let solPrice    = $state(142.38);
	let solChange   = $state(3.21);
	let marketCap   = $state(65_800_000_000);
	let tvl         = $state(8_420_000_000);
	let dailyVol    = $state(3_100_000_000);
	let activeWallets = $state(2_340_000);

	// ── Price chart ───────────────────────────────────────────────────────────────
	const CHART_W = 600, CHART_H = 120;
	let priceHistory = $state([]);

	function makePriceHistory() {
		const pts = [];
		let p = 128;
		for (let i = 0; i < 96; i++) {
			p += rand(-2.5, 2.8);
			pts.push(Math.max(80, p));
		}
		// end near current
		pts.push(142.38);
		return pts;
	}

	function pricePath(pts) {
		if (!pts.length) return '';
		const minP = Math.min(...pts);
		const maxP = Math.max(...pts);
		const range = maxP - minP || 1;
		const x = (i) => (i / (pts.length - 1)) * CHART_W;
		const y = (v) => CHART_H - ((v - minP) / range) * CHART_H;
		return pts.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
	}

	function priceArea(pts) {
		if (!pts.length) return '';
		return pricePath(pts) + ` L${CHART_W},${CHART_H} L0,${CHART_H} Z`;
	}

	// ── Ecosystem projects ────────────────────────────────────────────────────────
	const CATEGORIES = ['All', 'DeFi', 'NFT', 'Gaming', 'Infra', 'AI', 'Memes', 'DEX'];

	const PROJECTS = [
		{ name: 'Jupiter', cat: 'DEX',    desc: 'Best swap aggregator on Solana',       tvl: '$2.1B',  users: '4.2M', logo: '🪐', color: '#E8B84B', hot: true  },
		{ name: 'Raydium',  cat: 'DEX',    desc: 'AMM & liquidity protocol',              tvl: '$1.4B',  users: '1.8M', logo: '⚡', color: '#6B5CE7', hot: false },
		{ name: 'Orca',     cat: 'DEX',    desc: 'Concentrated liquidity AMM',            tvl: '$890M',  users: '980K', logo: '🐋', color: '#00C2FF', hot: false },
		{ name: 'Drift',    cat: 'DeFi',   desc: 'Perps & spot DEX, order book model',   tvl: '$620M',  users: '310K', logo: '🌊', color: '#4ECDC4', hot: true  },
		{ name: 'Kamino',   cat: 'DeFi',   desc: 'Automated yield strategies & lending', tvl: '$1.1B',  users: '220K', logo: '🔮', color: '#A78BFA', hot: false },
		{ name: 'Marginfi', cat: 'DeFi',   desc: 'Permissionless lending protocol',      tvl: '$780M',  users: '190K', logo: '🏦', color: '#34D399', hot: false },
		{ name: 'Tensor',   cat: 'NFT',    desc: 'Pro NFT trading platform',             tvl: '—',      users: '420K', logo: '🎨', color: '#F472B6', hot: true  },
		{ name: 'Magic Eden',cat: 'NFT',   desc: 'Largest Solana NFT marketplace',       tvl: '—',      users: '2.1M', logo: '🪄', color: '#E879F9', hot: false },
		{ name: 'Star Atlas',cat: 'Gaming',desc: 'AAA space metaverse game',             tvl: '—',      users: '85K',  logo: '🚀', color: '#60A5FA', hot: false },
		{ name: 'Aurory',   cat: 'Gaming', desc: 'Play-to-earn RPG adventure',           tvl: '—',      users: '62K',  logo: '🦊', color: '#FCD34D', hot: false },
		{ name: 'Helium',   cat: 'Infra',  desc: 'Decentralized wireless network',       tvl: '—',      users: '94K',  logo: '📡', color: '#38BDF8', hot: false },
		{ name: 'Render',   cat: 'Infra',  desc: 'Distributed GPU rendering network',   tvl: '—',      users: '41K',  logo: '🖥️',  color: '#FB923C', hot: true  },
		{ name: 'io.net',   cat: 'AI',     desc: 'Decentralized GPU compute for AI',    tvl: '—',      users: '28K',  logo: '🤖', color: '#14F195', hot: true  },
		{ name: 'Nosana',   cat: 'AI',     desc: 'AI inference on Solana GPUs',          tvl: '—',      users: '15K',  logo: '🧠', color: '#9333EA', hot: false },
		{ name: 'Bonk',     cat: 'Memes',  desc: 'The OG Solana meme coin',              tvl: '—',      users: '3.8M', logo: '🐶', color: '#F59E0B', hot: true  },
		{ name: 'WIF',      cat: 'Memes',  desc: 'dogwifhat — top Solana meme',          tvl: '—',      users: '2.2M', logo: '🐕', color: '#EC4899', hot: true  },
		{ name: 'Firedancer',cat:'Infra',  desc: 'Jump Crypto validator client',         tvl: '—',      users: '—',    logo: '🔥', color: '#EF4444', hot: true  },
		{ name: 'Jito',     cat: 'Infra',  desc: 'MEV-aware staking & block engine',    tvl: '$2.8B',  users: '180K', logo: '⚡', color: '#FBBF24', hot: false },
	];

	let selectedCat = $state('All');
	let filteredProjects = $derived(
		selectedCat === 'All' ? PROJECTS : PROJECTS.filter(p => p.cat === selectedCat)
	);

	// ── Validators ────────────────────────────────────────────────────────────────
	const TOP_VALIDATORS = [
		{ name: 'Coinbase Cloud',  stake: '8.2M', pct: 4.4,  apy: 6.8,  commission: 8  },
		{ name: 'Jito Labs',       stake: '7.1M', pct: 3.8,  apy: 7.1,  commission: 5  },
		{ name: 'Everstake',       stake: '6.4M', pct: 3.5,  apy: 7.0,  commission: 7  },
		{ name: 'Binance Staking', stake: '5.9M', pct: 3.2,  apy: 6.5,  commission: 10 },
		{ name: 'Figment',         stake: '4.8M', pct: 2.6,  apy: 7.2,  commission: 5  },
		{ name: 'P2P Validator',   stake: '4.2M', pct: 2.3,  apy: 7.3,  commission: 5  },
	];

	// ── Upgrades / Timeline ───────────────────────────────────────────────────────
	const UPGRADES = [
		{ name: 'Alpenglow',    date: 'Apr 2026',  status: 'upcoming', desc: 'Turbine + Rotor consensus — sub-400ms finality', color: '#14F195' },
		{ name: 'Firedancer v1',date: 'Q2 2026',   status: 'upcoming', desc: 'Jump Crypto validator client goes mainnet',       color: '#EF4444' },
		{ name: 'SIMD-0096',    date: 'Mar 2026',  status: 'live',     desc: 'Reward full priority fee to validators',          color: '#60A5FA' },
		{ name: 'Token Extensions',date:'Jan 2026', status: 'live',     desc: 'Confidential transfers, interest-bearing tokens', color: '#A78BFA' },
		{ name: 'ZK Compression',date:'Dec 2025',  status: 'live',     desc: '1000x cheaper on-chain storage via ZK proofs',   color: '#F472B6' },
	];

	// ── Live tx feed ──────────────────────────────────────────────────────────────
	const TX_TYPES = ['Swap', 'Transfer', 'Stake', 'NFT Buy', 'Borrow', 'Repay', 'Mint', 'Vote'];
	const TX_PROGRAMS = ['Jupiter', 'Raydium', 'Orca', 'Kamino', 'Tensor', 'System', 'Jito', 'Drift'];

	function randAddr() {
		const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
		return Array.from({ length: 4 }, () => chars[randInt(0, chars.length)]).join('') + '…' +
		       Array.from({ length: 4 }, () => chars[randInt(0, chars.length)]).join('');
	}

	function makeTx() {
		return {
			id: Math.random(),
			sig: randAddr(),
			type: TX_TYPES[randInt(0, TX_TYPES.length)],
			program: TX_PROGRAMS[randInt(0, TX_PROGRAMS.length)],
			fee: (rand(0.000005, 0.001)).toFixed(6),
			age: randInt(1, 12),
			status: Math.random() > 0.03 ? 'ok' : 'err',
		};
	}

	let txFeed = $state([]);

	// ── Chart timeframe ───────────────────────────────────────────────────────────
	let chartTf = $state('1D');
	const TFS = ['1H', '4H', '1D', '1W', '1M'];

	onMount(() => {
		priceHistory = makePriceHistory();
		txFeed = Array.from({ length: 18 }, makeTx);

		const tickNet = setInterval(() => {
			tps = randInt(3200, 6800);
			slot += randInt(1, 3);
			epochPct = Math.min(100, epochPct + 0.01);
			solPrice = parseFloat((solPrice * (1 + rand(-0.0008, 0.0010))).toFixed(2));
			solChange = parseFloat((solChange + rand(-0.05, 0.05)).toFixed(2));
			activeWallets = randInt(2_200_000, 2_500_000);
		}, 1200);

		const tickTx = setInterval(() => {
			txFeed = [makeTx(), ...txFeed.slice(0, 17)];
		}, 800);

		const tickChart = setInterval(() => {
			priceHistory = [...priceHistory.slice(1), parseFloat((solPrice + rand(-0.5, 0.5)).toFixed(2))];
		}, 3000);

		return () => {
			clearInterval(tickNet);
			clearInterval(tickTx);
			clearInterval(tickChart);
		};
	});
</script>

<div class="min-h-screen" style="background: radial-gradient(ellipse at 20% 10%, #1a0533 0%, #0a0a1a 50%, #001a0d 100%);">

	<!-- Header -->
	<div class="border-b border-white/10 bg-black/30 backdrop-blur-md px-6 py-4">
		<div class="mx-auto max-w-7xl flex items-center justify-between">
			<div class="flex items-center gap-3">
				<div class="flex h-10 w-10 items-center justify-center rounded-xl" style="background: linear-gradient(135deg, #9945FF, #14F195);">
					<span class="text-lg font-black text-white">◎</span>
				</div>
				<div>
					<h1 class="text-xl font-black text-white">Solana Ecosystem</h1>
					<p class="text-xs text-white/40">Live network · 2026</p>
				</div>
			</div>
			<div class="flex items-center gap-2">
				<span class="h-2 w-2 rounded-full bg-green-400 animate-pulse"></span>
				<span class="text-xs text-green-400 font-mono">Mainnet Beta</span>
			</div>
		</div>
	</div>

	<div class="mx-auto max-w-7xl px-6 py-6 space-y-6">

		<!-- Top stats row -->
		<div class="grid grid-cols-2 gap-3 lg:grid-cols-4">
			{#each [
				{ label: 'SOL Price',      value: `$${fmt(solPrice)}`,                sub: `${solChange >= 0 ? '+' : ''}${fmt(solChange)}% 24h`, up: solChange >= 0 },
				{ label: 'TPS',            value: tps.toLocaleString(),               sub: 'transactions/sec',  up: true },
				{ label: 'Total TVL',      value: fmtB(tvl),                          sub: 'across DeFi',       up: true },
				{ label: 'Active Wallets', value: (activeWallets/1e6).toFixed(2)+'M', sub: 'last 24h',          up: true },
			] as s}
			<div class="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-4">
				<p class="text-xs text-white/40 mb-1">{s.label}</p>
				<p class="text-2xl font-black text-white font-mono">{s.value}</p>
				<p class="text-xs mt-1 {s.up ? 'text-green-400' : 'text-red-400'}">{s.sub}</p>
			</div>
			{/each}
		</div>

		<!-- SOL Chart + Network panel -->
		<div class="grid grid-cols-1 gap-4 lg:grid-cols-3">

			<!-- Price chart -->
			<div class="lg:col-span-2 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-5">
				<div class="flex items-center justify-between mb-4">
					<div>
						<p class="text-white font-bold text-lg">SOL / USD</p>
						<p class="text-3xl font-black font-mono {solChange >= 0 ? 'text-green-400' : 'text-red-400'}">${fmt(solPrice)}</p>
					</div>
					<div class="flex gap-1">
						{#each TFS as tf}
						<button
							onclick={() => chartTf = tf}
							class="px-3 py-1 rounded-lg text-xs font-bold transition-all {chartTf === tf ? 'text-black' : 'text-white/40 hover:text-white/70'}"
							style={chartTf === tf ? 'background: #14F195' : ''}
						>{tf}</button>
						{/each}
					</div>
				</div>

				{#if priceHistory.length > 0}
				<svg viewBox="0 0 {CHART_W} {CHART_H}" class="w-full" preserveAspectRatio="none" style="height:140px">
					<defs>
						<linearGradient id="solGrad" x1="0" y1="0" x2="0" y2="1">
							<stop offset="0%" stop-color="#14F195" stop-opacity="0.35"/>
							<stop offset="100%" stop-color="#14F195" stop-opacity="0"/>
						</linearGradient>
					</defs>
					<path d={priceArea(priceHistory)} fill="url(#solGrad)"/>
					<path d={pricePath(priceHistory)} fill="none" stroke="#14F195" stroke-width="2" stroke-linejoin="round"/>
				</svg>
				{/if}

				<div class="mt-3 grid grid-cols-3 gap-3 border-t border-white/10 pt-3">
					<div><p class="text-xs text-white/40">Market Cap</p><p class="text-sm font-bold text-white">{fmtB(marketCap)}</p></div>
					<div><p class="text-xs text-white/40">24h Volume</p><p class="text-sm font-bold text-white">{fmtB(dailyVol)}</p></div>
					<div><p class="text-xs text-white/40">Circulating</p><p class="text-sm font-bold text-white">463M SOL</p></div>
				</div>
			</div>

			<!-- Network panel -->
			<div class="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-5 space-y-4">
				<p class="text-white font-bold">Network Status</p>

				<div class="space-y-3">
					<div class="flex justify-between items-center">
						<span class="text-white/50 text-sm">Current Slot</span>
						<span class="text-white font-mono text-sm font-bold">{slot.toLocaleString()}</span>
					</div>
					<div class="flex justify-between items-center">
						<span class="text-white/50 text-sm">Epoch</span>
						<span class="text-white font-mono text-sm font-bold">{epoch}</span>
					</div>
					<div>
						<div class="flex justify-between text-sm mb-1">
							<span class="text-white/50">Epoch Progress</span>
							<span class="text-white font-mono font-bold">{fmt(epochPct, 1)}%</span>
						</div>
						<div class="h-2 rounded-full bg-white/10 overflow-hidden">
							<div class="h-full rounded-full transition-all duration-700" style="width:{epochPct}%; background: linear-gradient(90deg, #9945FF, #14F195)"></div>
						</div>
					</div>
					<div class="flex justify-between items-center">
						<span class="text-white/50 text-sm">Validators</span>
						<span class="text-white font-mono text-sm font-bold">{validators.toLocaleString()}</span>
					</div>
					<div class="flex justify-between items-center">
						<span class="text-white/50 text-sm">Nakamoto Coeff.</span>
						<span class="text-green-400 font-mono text-sm font-bold">31</span>
					</div>
					<div class="flex justify-between items-center">
						<span class="text-white/50 text-sm">Version</span>
						<span class="text-white font-mono text-sm font-bold">v1.18.26</span>
					</div>
				</div>

				<!-- TPS gauge -->
				<div class="rounded-xl bg-white/5 border border-white/10 p-3 text-center">
					<p class="text-xs text-white/40 mb-1">Live TPS</p>
					<p class="text-3xl font-black font-mono" style="color: #14F195">{tps.toLocaleString()}</p>
					<div class="mt-2 h-1.5 rounded-full bg-white/10 overflow-hidden">
						<div class="h-full rounded-full transition-all duration-500" style="width:{Math.min(100,(tps/8000)*100)}%; background:#14F195"></div>
					</div>
					<p class="text-xs text-white/30 mt-1">max ~65k theoretical</p>
				</div>
			</div>
		</div>

		<!-- Ecosystem Projects -->
		<div class="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-5">
			<div class="flex items-center justify-between mb-4 flex-wrap gap-3">
				<p class="text-white font-bold text-lg">Ecosystem</p>
				<div class="flex flex-wrap gap-1">
					{#each CATEGORIES as cat}
					<button
						onclick={() => selectedCat = cat}
						class="px-3 py-1 rounded-full text-xs font-bold transition-all border {selectedCat === cat ? 'border-transparent text-black' : 'border-white/20 text-white/50 hover:text-white/80 hover:border-white/40'}"
						style={selectedCat === cat ? 'background: linear-gradient(135deg, #9945FF, #14F195)' : ''}
					>{cat}</button>
					{/each}
				</div>
			</div>

			<div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
				{#each filteredProjects as p}
				<div class="group relative rounded-xl border bg-white/5 p-4 transition-all hover:bg-white/10 cursor-pointer"
				     style="border-color: {p.color}22">
					{#if p.hot}
					<span class="absolute top-3 right-3 text-xs px-2 py-0.5 rounded-full font-bold text-black" style="background: #14F195">🔥 Hot</span>
					{/if}
					<div class="flex items-center gap-3 mb-2">
						<div class="flex h-10 w-10 items-center justify-center rounded-xl text-xl shrink-0" style="background: {p.color}22; border: 1px solid {p.color}44">
							{p.logo}
						</div>
						<div>
							<p class="text-white font-bold text-sm">{p.name}</p>
							<span class="text-xs px-2 py-0.5 rounded-full" style="background: {p.color}22; color: {p.color}">{p.cat}</span>
						</div>
					</div>
					<p class="text-white/50 text-xs mb-3">{p.desc}</p>
					<div class="flex justify-between text-xs">
						{#if p.tvl !== '—'}
						<div><span class="text-white/30">TVL </span><span class="text-white font-mono font-bold">{p.tvl}</span></div>
						{:else}
						<div></div>
						{/if}
						<div><span class="text-white/30">Users </span><span class="text-white font-mono font-bold">{p.users}</span></div>
					</div>
				</div>
				{/each}
			</div>
		</div>

		<!-- Bottom row: Validators + Upgrades + Tx Feed -->
		<div class="grid grid-cols-1 gap-4 lg:grid-cols-3">

			<!-- Top Validators -->
			<div class="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-5">
				<p class="text-white font-bold mb-4">Top Validators</p>
				<div class="space-y-2">
					{#each TOP_VALIDATORS as v, i}
					<div class="flex items-center gap-3 rounded-xl bg-white/5 p-3">
						<span class="text-white/30 text-xs font-mono w-4">{i+1}</span>
						<div class="flex-1 min-w-0">
							<p class="text-white text-sm font-semibold truncate">{v.name}</p>
							<div class="mt-1 h-1 rounded-full bg-white/10 overflow-hidden">
								<div class="h-full rounded-full" style="width:{v.pct * 10}%; background: linear-gradient(90deg, #9945FF, #14F195)"></div>
							</div>
						</div>
						<div class="text-right shrink-0">
							<p class="text-xs text-green-400 font-mono font-bold">{v.apy}% APY</p>
							<p class="text-xs text-white/40">{v.commission}% fee</p>
						</div>
					</div>
					{/each}
				</div>
			</div>

			<!-- Upgrades / Roadmap -->
			<div class="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-5">
				<p class="text-white font-bold mb-4">Upgrades & Roadmap</p>
				<div class="relative pl-4 space-y-4">
					<div class="absolute left-[7px] top-2 bottom-2 w-px bg-white/10"></div>
					{#each UPGRADES as u}
					<div class="relative">
						<div class="absolute -left-4 top-1 h-3 w-3 rounded-full border-2 border-black"
						     style="background: {u.status === 'live' ? u.color : '#333'}"></div>
						<div class="flex items-start justify-between gap-2">
							<div>
								<p class="text-white text-sm font-bold">{u.name}</p>
								<p class="text-white/40 text-xs mt-0.5">{u.desc}</p>
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

			<!-- Live Tx Feed -->
			<div class="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-5">
				<div class="flex items-center justify-between mb-4">
					<p class="text-white font-bold">Live Transactions</p>
					<span class="flex items-center gap-1 text-xs text-green-400">
						<span class="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse"></span>Live
					</span>
				</div>
				<div class="space-y-1.5 overflow-hidden">
					{#each txFeed as tx (tx.id)}
					<div class="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2 text-xs transition-all">
						<span class="h-1.5 w-1.5 rounded-full shrink-0 {tx.status === 'ok' ? 'bg-green-400' : 'bg-red-400'}"></span>
						<span class="font-mono text-white/40 w-16 shrink-0">{tx.sig}</span>
						<span class="font-bold shrink-0" style="color: #9945FF">{tx.type}</span>
						<span class="text-white/40 truncate flex-1">{tx.program}</span>
						<span class="text-white/30 shrink-0">{tx.age}s</span>
					</div>
					{/each}
				</div>
			</div>
		</div>

	</div>
</div>
