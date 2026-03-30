<svelte:head>
	<title>Avalanche | JamCat</title>
</svelte:head>

<script>
	import { onMount } from 'svelte';

	const rand = (min, max) => Math.random() * (max - min) + min;
	const randInt = (min, max) => Math.floor(rand(min, max));
	const fmt = (n, d = 2) => n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
	const fmtB = (n) => n >= 1e9 ? `$${(n/1e9).toFixed(2)}B` : `$${(n/1e6).toFixed(0)}M`;

	// ── Market data ───────────────────────────────────────────────────────────────
	let avaxPrice   = $state(28.74);
	let avaxChange  = $state(3.42);
	let marketCap   = $state(12_100_000_000);
	let dominance   = $state(0.62);
	let dailyVol    = $state(620_000_000);
	let ath         = $state(144.96);
	let tvl         = $state(1_240_000_000);

	// ── Network stats ─────────────────────────────────────────────────────────────
	let tps          = $state(4_312);
	let validators   = $state(1_742);
	let subnets      = $state(84);
	let blockchains  = $state(248);
	let stakingAPR   = $state(8.12);
	let totalStaked  = $state(248_000_000); // AVAX
	let finality     = $state(1.2);         // seconds
	let txToday      = $state(1_420_000);
	let activeAddrs  = $state(142_000);

	// ── Price chart ───────────────────────────────────────────────────────────────
	const CW = 700, CH = 140;
	let priceHistory = $state([]);

	function makePriceHistory() {
		const pts = [];
		let p = 22;
		for (let i = 0; i < 120; i++) {
			p += rand(-1.2, 1.4);
			pts.push(Math.max(10, p));
		}
		pts.push(28.74);
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

	// ── Three chains ─────────────────────────────────────────────────────────────
	const CHAINS = [
		{
			id: 'C',
			name: 'C-Chain',
			desc: 'EVM-compatible smart contracts chain. Runs Solidity, compatible with MetaMask and all Ethereum tools.',
			color: '#E84142',
			tps: 4500,
			gasPrice: 25,  // nAVAX
			txs: '1.2M/day',
			use: 'DeFi · NFTs · dApps',
		},
		{
			id: 'P',
			name: 'P-Chain',
			desc: 'Platform chain for validators and subnet management. Handles staking and subnet creation.',
			color: '#FF6B35',
			tps: 500,
			gasPrice: 0,
			txs: '12K/day',
			use: 'Staking · Governance',
		},
		{
			id: 'X',
			name: 'X-Chain',
			desc: 'Exchange chain using DAG architecture. Ultra-fast AVAX transfers with near-zero fees.',
			color: '#FF9F1C',
			tps: 6500,
			gasPrice: 0,
			txs: '80K/day',
			use: 'Transfers · Swaps',
		},
	];

	let selectedChain = $state('C');
	let activeChain = $derived(CHAINS.find(c => c.id === selectedChain));

	// ── Subnets ───────────────────────────────────────────────────────────────────
	const TOP_SUBNETS = [
		{ name: 'DFK Chain',      desc: 'DeFi Kingdoms gaming subnet',               tvl: '$180M',  tps: 500,  color: '#6366F1', hot: true  },
		{ name: 'Dexalot',        desc: 'On-chain CLOB order book exchange',          tvl: '$42M',   tps: 200,  color: '#F59E0B', hot: false },
		{ name: 'Shrapnel',       desc: 'AAA extraction shooter with blockchain',     tvl: '—',      tps: 1000, color: '#EF4444', hot: true  },
		{ name: 'Beam',           desc: 'Gaming subnet powering Merit Circle',        tvl: '$95M',   tps: 800,  color: '#3B82F6', hot: true  },
		{ name: 'Loco Legends',   desc: 'Mobile gaming with asset ownership',         tvl: '—',      tps: 600,  color: '#10B981', hot: false },
		{ name: 'PLAYA3ULL',      desc: 'P3ULL token gaming ecosystem',               tvl: '—',      tps: 400,  color: '#8B5CF6', hot: false },
	];

	// ── Ecosystem ─────────────────────────────────────────────────────────────────
	const CATEGORIES = ['All', 'DeFi', 'DEX', 'Gaming', 'NFT', 'Infra', 'Bridge'];

	const ECOSYSTEM = [
		{ name: 'Trader Joe',   cat: 'DEX',    desc: 'Leading DEX on Avalanche — Liquidity Book AMM',    logo: '🎃', color: '#FF6B35', stat: '$280M',  statLabel: 'TVL',  hot: true  },
		{ name: 'AAVE v3',      cat: 'DeFi',   desc: 'Lending protocol deployed on Avalanche C-Chain',   logo: '👻', color: '#B6509E', stat: '$420M',  statLabel: 'TVL',  hot: false },
		{ name: 'Benqi',        cat: 'DeFi',   desc: 'Liquid staking + lending native to Avalanche',     logo: '💧', color: '#00C2FF', stat: '$340M',  statLabel: 'TVL',  hot: true  },
		{ name: 'GMX',          cat: 'DeFi',   desc: 'Perps DEX with real yield to stakers',             logo: '📈', color: '#4ECDC4', stat: '$190M',  statLabel: 'TVL',  hot: true  },
		{ name: 'Pharaoh',      cat: 'DEX',    desc: 've(3,3) DEX native to Avalanche',                  logo: '⚱️',  color: '#F59E0B', stat: '$85M',   statLabel: 'TVL',  hot: false },
		{ name: 'Joepegs',      cat: 'NFT',    desc: 'Primary NFT marketplace on Avalanche',             logo: '🎨', color: '#EC4899', stat: '—',      statLabel: '—',    hot: false },
		{ name: 'DFK Chain',    cat: 'Gaming', desc: 'DeFi Kingdoms — JRPG with on-chain economy',       logo: '⚔️',  color: '#6366F1', stat: '$180M',  statLabel: 'TVL',  hot: true  },
		{ name: 'Shrapnel',     cat: 'Gaming', desc: 'AAA extraction FPS shooter on custom subnet',      logo: '💥', color: '#EF4444', stat: '—',      statLabel: '—',    hot: true  },
		{ name: 'LayerZero',    cat: 'Bridge', desc: 'Omnichain messaging protocol',                     logo: '🌐', color: '#60A5FA', stat: '—',      statLabel: '—',    hot: true  },
		{ name: 'Stargate',     cat: 'Bridge', desc: 'Cross-chain liquidity bridge via LayerZero',       logo: '⭐', color: '#A78BFA', stat: '$120M',  statLabel: 'TVL',  hot: false },
		{ name: 'Warp Messaging',cat: 'Infra', desc: 'Native subnet-to-subnet communication protocol',  logo: '🔗', color: '#34D399', stat: '—',      statLabel: '—',    hot: true  },
		{ name: 'Ava Cloud',    cat: 'Infra',  desc: 'Ava Labs managed infra for subnet deployment',     logo: '☁️',  color: '#E84142', stat: '—',      statLabel: '—',    hot: false },
	];

	let selectedCat = $state('All');
	let filtered = $derived(selectedCat === 'All' ? ECOSYSTEM : ECOSYSTEM.filter(p => p.cat === selectedCat));

	// ── Upgrades ─────────────────────────────────────────────────────────────────
	const UPGRADES = [
		{ name: 'Avalanche9000',     date: 'Dec 2024',  status: 'live',     desc: 'Etna upgrade: 99.9% cheaper subnet launch fees', color: '#E84142' },
		{ name: 'ACP-77 (Subnet reform)', date: 'Jan 2025', status: 'live', desc: 'L1 subnets no longer need 5 primary validators', color: '#FF6B35' },
		{ name: 'ICM (Interchain)',  date: 'Q1 2025',   status: 'live',     desc: 'Teleporter — native cross-subnet messaging',      color: '#FF9F1C' },
		{ name: 'HyperSDK v1',       date: 'Q2 2025',   status: 'live',     desc: '100k+ TPS custom VM framework for subnets',      color: '#34D399' },
		{ name: 'FROST Signatures',  date: 'Q3 2026',   status: 'upcoming', desc: 'Threshold signatures for BTC bridging',           color: '#A78BFA' },
	];

	// ── Live tx feed ──────────────────────────────────────────────────────────────
	const TX_TYPES = ['Swap', 'Transfer', 'Stake', 'Add LP', 'Borrow', 'NFT Buy', 'Bridge', 'Deploy'];
	const TX_PROTOCOLS = ['Trader Joe', 'AAVE', 'Benqi', 'GMX', 'Joepegs', 'Stargate', 'Pharaoh', 'System'];

	function randAddr() {
		const chars = '0123456789abcdef';
		return '0x' + Array.from({ length: 4 }, () => chars[randInt(0, 16)]).join('') + '…' +
		       Array.from({ length: 4 }, () => chars[randInt(0, 16)]).join('');
	}

	function makeTx() {
		return {
			id: Math.random(),
			hash: randAddr(),
			type: TX_TYPES[randInt(0, TX_TYPES.length)],
			protocol: TX_PROTOCOLS[randInt(0, TX_PROTOCOLS.length)],
			value: rand(10, 50000).toFixed(2),
			fee: rand(0.001, 0.05).toFixed(4),
			age: randInt(1, 15),
			status: Math.random() > 0.02 ? 'ok' : 'err',
		};
	}

	let txFeed = $state([]);

	onMount(() => {
		priceHistory = makePriceHistory();
		txFeed = Array.from({ length: 16 }, makeTx);

		const tickNet = setInterval(() => {
			avaxPrice = parseFloat((avaxPrice * (1 + rand(-0.0007, 0.0009))).toFixed(2));
			avaxChange = parseFloat((avaxChange + rand(-0.04, 0.04)).toFixed(2));
			tps = randInt(3000, 6000);
			txToday += randInt(100, 400);
			activeAddrs = randInt(130_000, 160_000);
			finality = parseFloat((1.2 + rand(-0.1, 0.1)).toFixed(2));
		}, 1300);

		const tickTx = setInterval(() => {
			txFeed = [makeTx(), ...txFeed.slice(0, 15)];
		}, 900);

		const tickChart = setInterval(() => {
			priceHistory = [...priceHistory.slice(1), avaxPrice + rand(-0.3, 0.3)];
		}, 2500);

		return () => {
			clearInterval(tickNet);
			clearInterval(tickTx);
			clearInterval(tickChart);
		};
	});
</script>

<div class="min-h-screen" style="background: radial-gradient(ellipse at 20% 10%, #2a0505 0%, #0d0d0d 50%, #1a0a00 100%);">

	<!-- Header -->
	<div class="border-b border-white/10 bg-black/40 backdrop-blur-md px-6 py-4">
		<div class="mx-auto max-w-7xl flex items-center justify-between">
			<div class="flex items-center gap-3">
				<div class="flex h-10 w-10 items-center justify-center rounded-xl font-black text-white text-xl" style="background: linear-gradient(135deg, #E84142, #FF9F1C);">
					▲
				</div>
				<div>
					<h1 class="text-xl font-black text-white">Avalanche</h1>
					<p class="text-xs text-white/40">Multi-chain · Subnets · EVM + Native</p>
				</div>
			</div>
			<div class="flex items-center gap-4 text-xs font-mono">
				<div class="text-center">
					<p class="text-white/40">Finality</p>
					<p class="font-bold" style="color:#E84142">&lt;{fmt(finality, 1)}s</p>
				</div>
				<div class="text-center">
					<p class="text-white/40">Subnets</p>
					<p class="text-white font-bold">{subnets}</p>
				</div>
				<div class="text-center">
					<p class="text-white/40">Blockchains</p>
					<p class="text-white font-bold">{blockchains}</p>
				</div>
				<div class="flex items-center gap-1.5">
					<span class="h-2 w-2 rounded-full animate-pulse" style="background:#E84142"></span>
					<span style="color:#E84142">Mainnet</span>
				</div>
			</div>
		</div>
	</div>

	<div class="mx-auto max-w-7xl px-6 py-6 space-y-6">

		<!-- Top stats -->
		<div class="grid grid-cols-2 gap-3 lg:grid-cols-4">
			{#each [
				{ label: 'AVAX Price',    value: `$${fmt(avaxPrice)}`,                sub: `${avaxChange >= 0 ? '+' : ''}${fmt(avaxChange)}% 24h`,   up: avaxChange >= 0 },
				{ label: 'Market Cap',    value: fmtB(marketCap),                     sub: `${fmt(dominance, 2)}% dominance`,                         up: true },
				{ label: 'TPS',           value: tps.toLocaleString(),                sub: 'real-time throughput',                                    up: true },
				{ label: 'Staked',        value: `${(totalStaked/1e6).toFixed(0)}M`,  sub: `${fmt(stakingAPR, 2)}% APR`,                             up: true },
			] as s}
			<div class="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-4">
				<p class="text-xs text-white/40 mb-1">{s.label}</p>
				<p class="text-2xl font-black text-white font-mono leading-tight">{s.value}</p>
				<p class="text-xs mt-1 {s.up ? 'text-red-400' : 'text-red-500'}">{s.sub}</p>
			</div>
			{/each}
		</div>

		<!-- Price chart + Three chains -->
		<div class="grid grid-cols-1 gap-4 lg:grid-cols-3">

			<!-- Price chart -->
			<div class="lg:col-span-2 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-5">
				<div class="flex items-center justify-between mb-4">
					<div>
						<p class="text-white font-bold">AVAX / USD</p>
						<p class="text-3xl font-black font-mono" style="color: #E84142">${fmt(avaxPrice)}</p>
						<p class="text-sm {avaxChange >= 0 ? 'text-green-400' : 'text-red-400'}">{avaxChange >= 0 ? '+' : ''}{fmt(avaxChange)}% today · ATH ${fmt(ath)}</p>
					</div>
					<div class="flex gap-1">
						{#each TFS as tf}
						<button onclick={() => chartTf = tf}
							class="px-2.5 py-1 rounded-lg text-xs font-bold transition-all {chartTf === tf ? 'text-white' : 'text-white/40 hover:text-white/70'}"
							style={chartTf === tf ? 'background: #E84142' : ''}
						>{tf}</button>
						{/each}
					</div>
				</div>

				{#if priceHistory.length > 0}
				<svg viewBox="0 0 {CW} {CH}" class="w-full" preserveAspectRatio="none" style="height:150px">
					<defs>
						<linearGradient id="avaxGrad" x1="0" y1="0" x2="0" y2="1">
							<stop offset="0%" stop-color="#E84142" stop-opacity="0.4"/>
							<stop offset="100%" stop-color="#E84142" stop-opacity="0"/>
						</linearGradient>
					</defs>
					<path d={priceArea(priceHistory)} fill="url(#avaxGrad)"/>
					<path d={pricePath(priceHistory)} fill="none" stroke="#E84142" stroke-width="2.5" stroke-linejoin="round"/>
				</svg>
				{/if}

				<div class="mt-3 grid grid-cols-3 gap-3 border-t border-white/10 pt-3">
					<div><p class="text-xs text-white/40">Market Cap</p><p class="text-sm font-bold text-white">{fmtB(marketCap)}</p></div>
					<div><p class="text-xs text-white/40">24h Volume</p><p class="text-sm font-bold text-white">{fmtB(dailyVol)}</p></div>
					<div><p class="text-xs text-white/40">Total TVL</p><p class="text-sm font-bold text-white">{fmtB(tvl)}</p></div>
				</div>
			</div>

			<!-- Three chains -->
			<div class="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-5">
				<p class="text-white font-bold mb-3">Three-Chain Architecture</p>
				<div class="flex gap-1 mb-4">
					{#each CHAINS as c}
					<button onclick={() => selectedChain = c.id}
						class="flex-1 rounded-xl py-2 text-xs font-black transition-all border {selectedChain === c.id ? 'text-white border-transparent' : 'border-white/20 text-white/40 hover:text-white/70'}"
						style={selectedChain === c.id ? `background: ${c.color}` : ''}
					>{c.id}-Chain</button>
					{/each}
				</div>

				{#if activeChain}
				<div class="space-y-3">
					<div class="rounded-xl p-3 border" style="background: {activeChain.color}11; border-color: {activeChain.color}33">
						<p class="font-black text-white text-sm mb-1">{activeChain.name}</p>
						<p class="text-white/50 text-xs leading-relaxed">{activeChain.desc}</p>
					</div>
					<div class="grid grid-cols-2 gap-2">
						<div class="rounded-lg bg-white/5 p-2.5 text-center">
							<p class="text-xs text-white/40">Max TPS</p>
							<p class="text-lg font-black font-mono" style="color:{activeChain.color}">{activeChain.tps.toLocaleString()}</p>
						</div>
						<div class="rounded-lg bg-white/5 p-2.5 text-center">
							<p class="text-xs text-white/40">Use Case</p>
							<p class="text-xs font-bold text-white mt-1 leading-tight">{activeChain.use}</p>
						</div>
					</div>
					<div class="rounded-lg bg-white/5 p-2.5 flex justify-between">
						<span class="text-xs text-white/40">Daily Txns</span>
						<span class="text-xs text-white font-mono font-bold">{activeChain.txs}</span>
					</div>
					{#if activeChain.gasPrice > 0}
					<div class="rounded-lg bg-white/5 p-2.5 flex justify-between">
						<span class="text-xs text-white/40">Base Fee</span>
						<span class="text-xs font-mono font-bold" style="color:{activeChain.color}">{activeChain.gasPrice} nAVAX</span>
					</div>
					{:else}
					<div class="rounded-lg bg-white/5 p-2.5 flex justify-between">
						<span class="text-xs text-white/40">Fees</span>
						<span class="text-xs font-mono font-bold text-green-400">Fixed low fee</span>
					</div>
					{/if}
				</div>
				{/if}

				<!-- Network stats -->
				<div class="mt-4 space-y-2 border-t border-white/10 pt-4">
					<div class="flex justify-between text-xs">
						<span class="text-white/40">Validators</span>
						<span class="text-white font-mono font-bold">{validators.toLocaleString()}</span>
					</div>
					<div class="flex justify-between text-xs">
						<span class="text-white/40">Subnets</span>
						<span class="text-white font-mono font-bold">{subnets}</span>
					</div>
					<div class="flex justify-between text-xs">
						<span class="text-white/40">Finality</span>
						<span class="font-mono font-bold" style="color:#E84142">&lt;{fmt(finality, 1)}s</span>
					</div>
					<div class="flex justify-between text-xs">
						<span class="text-white/40">Tx Today</span>
						<span class="text-white font-mono font-bold">{txToday.toLocaleString()}</span>
					</div>
					<div class="flex justify-between text-xs">
						<span class="text-white/40">Active Addrs</span>
						<span class="text-white font-mono font-bold">{activeAddrs.toLocaleString()}</span>
					</div>
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
						style={selectedCat === cat ? 'background: linear-gradient(135deg, #E84142, #FF9F1C)' : ''}
					>{cat}</button>
					{/each}
				</div>
			</div>
			<div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
				{#each filtered as p}
				<div class="relative rounded-xl border bg-white/5 p-4 hover:bg-white/10 transition-all cursor-pointer"
				     style="border-color: {p.color}33">
					{#if p.hot}
					<span class="absolute top-3 right-3 text-xs px-2 py-0.5 rounded-full font-bold text-white" style="background: #E84142">🔥</span>
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

		<!-- Bottom: Top Subnets + Upgrades + Live Txns -->
		<div class="grid grid-cols-1 gap-4 lg:grid-cols-3">

			<!-- Top Subnets -->
			<div class="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-5">
				<div class="flex items-center justify-between mb-4">
					<p class="text-white font-bold">Top Subnets</p>
					<span class="text-xs text-white/40 font-mono">{subnets} total</span>
				</div>
				<div class="space-y-2">
					{#each TOP_SUBNETS as s}
					<div class="rounded-xl bg-white/5 border border-white/10 p-3 hover:bg-white/10 transition-all cursor-pointer">
						<div class="flex items-center justify-between mb-1">
							<div class="flex items-center gap-2">
								<span class="h-2 w-2 rounded-full" style="background:{s.color}"></span>
								<span class="text-white font-semibold text-sm">{s.name}</span>
								{#if s.hot}<span class="text-xs px-1.5 py-0.5 rounded-full font-bold text-white" style="background:#E84142">🔥</span>{/if}
							</div>
							<span class="text-xs font-mono text-white/50">{s.tps} TPS</span>
						</div>
						<p class="text-white/40 text-xs">{s.desc}</p>
						{#if s.tvl !== '—'}
						<p class="text-xs mt-1"><span class="text-white/30">TVL </span><span class="text-white font-mono font-bold">{s.tvl}</span></p>
						{/if}
					</div>
					{/each}
				</div>
			</div>

			<!-- Upgrades -->
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

			<!-- Live Tx Feed -->
			<div class="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-5">
				<div class="flex items-center justify-between mb-4">
					<p class="text-white font-bold">Live Transactions</p>
					<span class="flex items-center gap-1 text-xs" style="color:#E84142">
						<span class="h-1.5 w-1.5 rounded-full animate-pulse" style="background:#E84142"></span>C-Chain
					</span>
				</div>
				<div class="space-y-1.5 overflow-hidden">
					{#each txFeed as tx (tx.id)}
					<div class="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2 text-xs">
						<span class="h-1.5 w-1.5 rounded-full shrink-0 {tx.status === 'ok' ? 'bg-green-400' : 'bg-red-400'}"></span>
						<span class="font-mono text-white/40 w-16 shrink-0">{tx.hash}</span>
						<span class="font-bold shrink-0" style="color:#E84142">{tx.type}</span>
						<span class="text-white/40 truncate flex-1">{tx.protocol}</span>
						<span class="text-white/50 font-mono shrink-0">${parseFloat(tx.value).toLocaleString('en-US', {maximumFractionDigits:0})}</span>
					</div>
					{/each}
				</div>
			</div>
		</div>

	</div>
</div>
