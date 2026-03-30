<svelte:head>
	<title>Cardano | JamCat</title>
</svelte:head>

<script>
	import { onMount } from 'svelte';

	const rand = (min, max) => Math.random() * (max - min) + min;
	const randInt = (min, max) => Math.floor(rand(min, max));
	const fmt = (n, d = 2) => n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
	const fmtB = (n) => n >= 1e9 ? `$${(n/1e9).toFixed(2)}B` : `$${(n/1e6).toFixed(0)}M`;

	// ── Market data ───────────────────────────────────────────────────────────────
	let adaPrice    = $state(0.7124);
	let adaChange   = $state(4.18);
	let marketCap   = $state(25_400_000_000);
	let dominance   = $state(1.28);
	let dailyVol    = $state(480_000_000);
	let ath         = $state(3.10);
	let tvl         = $state(420_000_000);
	let circSupply  = $state(35_700_000_000);
	let maxSupply   = 45_000_000_000;

	// ── Network stats ─────────────────────────────────────────────────────────────
	let epoch        = $state(514);
	let epochPct     = $state(62.4);
	let slot         = $state(132_842_110);
	let blockHeight  = $state(10_482_220);
	let tps          = $state(11.2);
	let stakePools   = $state(3_112);
	let delegators   = $state(1_240_000);
	let stakingAPY   = $state(3.14);
	let totalStaked  = $state(22_800_000_000); // ADA
	let activeAddrs  = $state(4_420_000);
	let txToday      = $state(84_200);

	// ── Price chart ───────────────────────────────────────────────────────────────
	const CW = 700, CH = 140;
	let priceHistory = $state([]);

	function makePriceHistory() {
		const pts = [];
		let p = 0.52;
		for (let i = 0; i < 120; i++) {
			p += rand(-0.018, 0.021);
			pts.push(Math.max(0.25, p));
		}
		pts.push(0.7124);
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

	// ── Eras / Roadmap ────────────────────────────────────────────────────────────
	const ERAS = [
		{ name: 'Byron',    subtitle: 'Foundation',    status: 'complete', color: '#0033AD', desc: 'Initial ledger, ADA transfers, federated consensus'             },
		{ name: 'Shelley',  subtitle: 'Decentralization', status: 'complete', color: '#0066CC', desc: 'Proof of Stake, stake pools, community governance begins'  },
		{ name: 'Goguen',   subtitle: 'Smart Contracts', status: 'complete', color: '#0099DD', desc: 'Plutus smart contracts, native tokens, NFTs on Cardano'       },
		{ name: 'Basho',    subtitle: 'Scaling',        status: 'active',   color: '#00BBEE', desc: 'Hydra L2, Mithril, sidechains, input endorsers'              },
		{ name: 'Voltaire', subtitle: 'Governance',     status: 'active',   color: '#00DDFF', desc: 'CIP-1694 on-chain governance, Project Catalyst, DReps'        },
	];

	// ── Ecosystem ─────────────────────────────────────────────────────────────────
	const CATEGORIES = ['All', 'DeFi', 'DEX', 'NFT', 'Staking', 'Gaming', 'Infra'];

	const ECOSYSTEM = [
		{ name: 'Minswap',     cat: 'DEX',     desc: 'Largest DEX on Cardano — multi-pool AMM',              logo: '🌾', color: '#4ADE80', stat: '$120M',  statLabel: 'TVL',   hot: true  },
		{ name: 'SundaeSwap',  cat: 'DEX',     desc: 'Classic AMM DEX, one of Cardano\'s originals',         logo: '🍦', color: '#FB923C', stat: '$38M',   statLabel: 'TVL',   hot: false },
		{ name: 'WingRiders',  cat: 'DEX',     desc: 'Automated market maker with yield farming',            logo: '🏄', color: '#60A5FA', stat: '$22M',   statLabel: 'TVL',   hot: false },
		{ name: 'Indigo',      cat: 'DeFi',    desc: 'Synthetic assets protocol — iUSD, iBTC, iETH',         logo: '💠', color: '#A78BFA', stat: '$48M',   statLabel: 'TVL',   hot: true  },
		{ name: 'Liqwid',      cat: 'DeFi',    desc: 'Decentralized lending and borrowing protocol',         logo: '💧', color: '#38BDF8', stat: '$64M',   statLabel: 'TVL',   hot: true  },
		{ name: 'DJED',        cat: 'DeFi',    desc: 'Algorithmic overcollateralized stablecoin',            logo: '🪙', color: '#F59E0B', stat: '$18M',   statLabel: 'Supply',hot: false },
		{ name: 'jpg.store',   cat: 'NFT',     desc: 'Largest NFT marketplace on Cardano',                  logo: '🖼️', color: '#EC4899', stat: '—',      statLabel: '—',     hot: true  },
		{ name: 'SpaceBudz',   cat: 'NFT',     desc: 'OG Cardano NFT collection, pioneered CNFTs',           logo: '🚀', color: '#8B5CF6', stat: '—',      statLabel: '—',     hot: false },
		{ name: 'Eternl',      cat: 'Infra',   desc: 'Most advanced Cardano browser wallet',                 logo: '♾️', color: '#0099DD', stat: '1.2M+',  statLabel: 'Users', hot: false },
		{ name: 'Hydra',       cat: 'Infra',   desc: 'Isomorphic L2 state channels — up to 1M TPS per head',logo: '🐙', color: '#14F195', stat: 'Mainnet',statLabel: 'Status',hot: true  },
		{ name: 'Mithril',     cat: 'Infra',   desc: 'Stake-based threshold multi-sig for fast sync',        logo: '🔐', color: '#6EE7B7', stat: 'Live',   statLabel: 'Status',hot: true  },
		{ name: 'Book.io',     cat: 'NFT',     desc: 'On-chain eBooks and digital content ownership',        logo: '📚', color: '#FCD34D', stat: '—',      statLabel: '—',     hot: true  },
	];

	let selectedCat = $state('All');
	let filtered = $derived(selectedCat === 'All' ? ECOSYSTEM : ECOSYSTEM.filter(p => p.cat === selectedCat));

	// ── Top stake pools ───────────────────────────────────────────────────────────
	const TOP_POOLS = [
		{ ticker: 'BLOOM', name: 'Bloom Pool',      pledge: '500K', delegators: 2840, apy: 3.24, sat: 82 },
		{ ticker: 'ADADEX',name: 'ADA DEX Pool',    pledge: '1M',   delegators: 1920, apy: 3.18, sat: 74 },
		{ ticker: 'SPACE', name: 'Space Pool',       pledge: '300K', delegators: 3210, apy: 3.31, sat: 91 },
		{ ticker: 'ANGEL', name: 'Angel Pool',       pledge: '750K', delegators: 1640, apy: 3.21, sat: 68 },
		{ ticker: 'EPOCH', name: 'Epoch Pool',       pledge: '2M',   delegators: 2180, apy: 3.15, sat: 79 },
		{ ticker: 'CLIO1', name: 'Clio1 Pool',       pledge: '400K', delegators: 1480, apy: 3.28, sat: 63 },
	];

	// ── Live tx feed ──────────────────────────────────────────────────────────────
	const TX_TYPES  = ['Transfer', 'Stake', 'Swap', 'Mint NFT', 'Delegate', 'Smart Contract', 'Withdraw', 'Governance'];
	const TX_LABELS = ['Minswap', 'Liqwid', 'jpg.store', 'Indigo', 'System', 'WingRiders', 'Eternal', 'Catalyst'];

	function randAddr() {
		const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
		return Array.from({ length: 4 }, () => chars[randInt(0, chars.length)]).join('') + '…' +
		       Array.from({ length: 4 }, () => chars[randInt(0, chars.length)]).join('');
	}

	function makeTx() {
		return {
			id: Math.random(),
			hash: randAddr(),
			type: TX_TYPES[randInt(0, TX_TYPES.length)],
			label: TX_LABELS[randInt(0, TX_LABELS.length)],
			ada: rand(10, 120000).toFixed(0),
			fee: rand(0.15, 0.5).toFixed(4),
			age: randInt(1, 20),
			status: Math.random() > 0.015 ? 'ok' : 'err',
		};
	}

	let txFeed = $state([]);

	onMount(() => {
		priceHistory = makePriceHistory();
		txFeed = Array.from({ length: 16 }, makeTx);

		const tickNet = setInterval(() => {
			adaPrice   = parseFloat((adaPrice * (1 + rand(-0.0006, 0.0008))).toFixed(4));
			adaChange  = parseFloat((adaChange + rand(-0.03, 0.03)).toFixed(2));
			tps        = parseFloat((tps + rand(-0.5, 0.6)).toFixed(1));
			epochPct   = Math.min(100, epochPct + 0.008);
			slot      += randInt(1, 2);
			blockHeight += randInt(0, 1);
			txToday   += randInt(20, 80);
			activeAddrs = randInt(4_200_000, 4_600_000);
		}, 1500);

		const tickTx = setInterval(() => {
			txFeed = [makeTx(), ...txFeed.slice(0, 15)];
		}, 1200);

		const tickChart = setInterval(() => {
			priceHistory = [...priceHistory.slice(1), adaPrice + rand(-0.005, 0.005)];
		}, 2500);

		return () => {
			clearInterval(tickNet);
			clearInterval(tickTx);
			clearInterval(tickChart);
		};
	});
</script>

<div class="min-h-screen" style="background: radial-gradient(ellipse at 20% 10%, #000d2e 0%, #050510 50%, #00050d 100%);">

	<!-- Header -->
	<div class="border-b border-white/10 bg-black/40 backdrop-blur-md px-6 py-4">
		<div class="mx-auto max-w-7xl flex items-center justify-between">
			<div class="flex items-center gap-3">
				<div class="flex h-10 w-10 items-center justify-center rounded-xl font-black text-white text-lg" style="background: linear-gradient(135deg, #0033AD, #00BBEE);">
					₳
				</div>
				<div>
					<h1 class="text-xl font-black text-white">Cardano</h1>
					<p class="text-xs text-white/40">Proof of Stake · Peer-reviewed · Basho + Voltaire era</p>
				</div>
			</div>
			<div class="flex items-center gap-4 text-xs font-mono">
				<div class="text-center">
					<p class="text-white/40">Epoch {epoch}</p>
					<div class="flex items-center gap-1.5 mt-0.5">
						<div class="h-1.5 w-20 rounded-full bg-white/10 overflow-hidden">
							<div class="h-full rounded-full transition-all" style="width:{epochPct.toFixed(1)}%; background: linear-gradient(90deg, #0033AD, #00BBEE)"></div>
						</div>
						<span class="text-white font-bold">{fmt(epochPct, 1)}%</span>
					</div>
				</div>
				<div class="text-center">
					<p class="text-white/40">Stake Pools</p>
					<p class="text-white font-bold">{stakePools.toLocaleString()}</p>
				</div>
				<div class="text-center">
					<p class="text-white/40">Delegators</p>
					<p class="text-white font-bold">{(delegators/1e6).toFixed(2)}M</p>
				</div>
				<div class="flex items-center gap-1.5">
					<span class="h-2 w-2 rounded-full animate-pulse" style="background:#00BBEE"></span>
					<span style="color:#00BBEE">Mainnet</span>
				</div>
			</div>
		</div>
	</div>

	<div class="mx-auto max-w-7xl px-6 py-6 space-y-6">

		<!-- Top stats -->
		<div class="grid grid-cols-2 gap-3 lg:grid-cols-4">
			{#each [
				{ label: 'ADA Price',    value: `$${fmt(adaPrice, 4)}`,              sub: `${adaChange >= 0 ? '+' : ''}${fmt(adaChange)}% 24h`,   up: adaChange >= 0 },
				{ label: 'Market Cap',   value: fmtB(marketCap),                     sub: `${fmt(dominance, 2)}% dominance`,                       up: true },
				{ label: 'Total TVL',    value: fmtB(tvl),                           sub: 'across DeFi',                                           up: true },
				{ label: 'Staked',       value: `${(totalStaked/1e9).toFixed(1)}B`,  sub: `${fmt(stakingAPY, 2)}% APY · ${fmt((totalStaked/circSupply)*100, 1)}% of supply`, up: true },
			] as s}
			<div class="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-4">
				<p class="text-xs text-white/40 mb-1">{s.label}</p>
				<p class="text-2xl font-black text-white font-mono leading-tight">{s.value}</p>
				<p class="text-xs mt-1 {s.up ? 'text-blue-400' : 'text-red-400'}">{s.sub}</p>
			</div>
			{/each}
		</div>

		<!-- Chart + Network -->
		<div class="grid grid-cols-1 gap-4 lg:grid-cols-3">

			<!-- Price chart -->
			<div class="lg:col-span-2 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-5">
				<div class="flex items-center justify-between mb-4">
					<div>
						<p class="text-white font-bold">ADA / USD</p>
						<p class="text-3xl font-black font-mono" style="color:#00BBEE">${fmt(adaPrice, 4)}</p>
						<p class="text-sm {adaChange >= 0 ? 'text-green-400' : 'text-red-400'}">{adaChange >= 0 ? '+' : ''}{fmt(adaChange)}% today · ATH ${fmt(ath)}</p>
					</div>
					<div class="flex gap-1">
						{#each TFS as tf}
						<button onclick={() => chartTf = tf}
							class="px-2.5 py-1 rounded-lg text-xs font-bold transition-all {chartTf === tf ? 'text-white' : 'text-white/40 hover:text-white/70'}"
							style={chartTf === tf ? 'background: #0033AD' : ''}
						>{tf}</button>
						{/each}
					</div>
				</div>

				{#if priceHistory.length > 0}
				<svg viewBox="0 0 {CW} {CH}" class="w-full" preserveAspectRatio="none" style="height:150px">
					<defs>
						<linearGradient id="adaGrad" x1="0" y1="0" x2="0" y2="1">
							<stop offset="0%" stop-color="#00BBEE" stop-opacity="0.4"/>
							<stop offset="100%" stop-color="#00BBEE" stop-opacity="0"/>
						</linearGradient>
					</defs>
					<path d={priceArea(priceHistory)} fill="url(#adaGrad)"/>
					<path d={pricePath(priceHistory)} fill="none" stroke="#00BBEE" stroke-width="2.5" stroke-linejoin="round"/>
				</svg>
				{/if}

				<div class="mt-3 grid grid-cols-3 gap-3 border-t border-white/10 pt-3">
					<div><p class="text-xs text-white/40">24h Volume</p><p class="text-sm font-bold text-white">{fmtB(dailyVol)}</p></div>
					<div><p class="text-xs text-white/40">Circulating</p><p class="text-sm font-bold text-white">{(circSupply/1e9).toFixed(1)}B ADA</p></div>
					<div><p class="text-xs text-white/40">Max Supply</p><p class="text-sm font-bold text-white">{(maxSupply/1e9).toFixed(0)}B ADA</p></div>
				</div>
			</div>

			<!-- Network stats -->
			<div class="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-5 space-y-4">
				<p class="text-white font-bold">Network Status</p>

				<div class="space-y-3">
					<div class="flex justify-between">
						<span class="text-white/50 text-sm">Block Height</span>
						<span class="text-white font-mono text-sm font-bold">{blockHeight.toLocaleString()}</span>
					</div>
					<div class="flex justify-between">
						<span class="text-white/50 text-sm">Slot</span>
						<span class="text-white font-mono text-sm font-bold">{slot.toLocaleString()}</span>
					</div>
					<div>
						<div class="flex justify-between text-sm mb-1">
							<span class="text-white/50">Epoch {epoch} Progress</span>
							<span class="text-white font-mono font-bold">{fmt(epochPct, 1)}%</span>
						</div>
						<div class="h-2 rounded-full bg-white/10 overflow-hidden">
							<div class="h-full rounded-full transition-all duration-700" style="width:{epochPct}%; background: linear-gradient(90deg, #0033AD, #00BBEE)"></div>
						</div>
					</div>
					<div class="flex justify-between">
						<span class="text-white/50 text-sm">TPS</span>
						<span class="text-white font-mono text-sm font-bold">{fmt(tps, 1)}</span>
					</div>
					<div class="flex justify-between">
						<span class="text-white/50 text-sm">Active Addresses</span>
						<span class="text-white font-mono text-sm font-bold">{(activeAddrs/1e6).toFixed(2)}M</span>
					</div>
					<div class="flex justify-between">
						<span class="text-white/50 text-sm">Txns Today</span>
						<span class="text-white font-mono text-sm font-bold">{txToday.toLocaleString()}</span>
					</div>
					<div class="flex justify-between">
						<span class="text-white/50 text-sm">Staking APY</span>
						<span class="text-green-400 font-mono text-sm font-bold">{fmt(stakingAPY, 2)}%</span>
					</div>
				</div>

				<!-- Supply bar -->
				<div>
					<div class="flex justify-between text-xs mb-1">
						<span class="text-white/50">Supply Issued</span>
						<span class="text-white font-mono font-bold">{((circSupply/maxSupply)*100).toFixed(1)}%</span>
					</div>
					<div class="h-2 rounded-full bg-white/10 overflow-hidden">
						<div class="h-full rounded-full" style="width:{((circSupply/maxSupply)*100).toFixed(1)}%; background: linear-gradient(90deg, #0033AD, #00BBEE)"></div>
					</div>
					<p class="text-xs text-white/30 mt-1">{(circSupply/1e9).toFixed(1)}B / {(maxSupply/1e9).toFixed(0)}B ADA</p>
				</div>
			</div>
		</div>

		<!-- Eras / Roadmap -->
		<div class="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-5">
			<p class="text-white font-bold text-lg mb-4">Development Eras</p>
			<div class="grid grid-cols-1 gap-3 sm:grid-cols-5">
				{#each ERAS as era, i}
				<div class="relative rounded-xl p-4 border transition-all {era.status === 'active' ? 'bg-white/10' : 'bg-white/5'}"
				     style="border-color: {era.color}44">
					{#if era.status === 'active'}
					<span class="absolute top-3 right-3 text-xs px-2 py-0.5 rounded-full font-bold text-white" style="background: {era.color}">Active</span>
					{:else if era.status === 'complete'}
					<span class="absolute top-3 right-3 text-xs px-2 py-0.5 rounded-full font-bold" style="background: {era.color}22; color: {era.color}">✓</span>
					{/if}
					<div class="flex items-center gap-2 mb-2">
						<span class="flex h-6 w-6 items-center justify-center rounded-full text-xs font-black text-white" style="background: {era.color}">{i+1}</span>
						<div>
							<p class="text-white font-black text-sm">{era.name}</p>
							<p class="text-xs" style="color: {era.color}">{era.subtitle}</p>
						</div>
					</div>
					<p class="text-white/50 text-xs leading-relaxed">{era.desc}</p>
				</div>
				{/each}
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
						style={selectedCat === cat ? 'background: linear-gradient(135deg, #0033AD, #00BBEE)' : ''}
					>{cat}</button>
					{/each}
				</div>
			</div>
			<div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
				{#each filtered as p}
				<div class="relative rounded-xl border bg-white/5 p-4 hover:bg-white/10 transition-all cursor-pointer"
				     style="border-color: {p.color}33">
					{#if p.hot}
					<span class="absolute top-3 right-3 text-xs px-2 py-0.5 rounded-full font-bold text-white" style="background: #0033AD">🔥</span>
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

		<!-- Bottom: Stake Pools + Live Txns -->
		<div class="grid grid-cols-1 gap-4 lg:grid-cols-2">

			<!-- Top Stake Pools -->
			<div class="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-5">
				<div class="flex items-center justify-between mb-4">
					<p class="text-white font-bold">Top Stake Pools</p>
					<span class="text-xs text-white/40 font-mono">{stakePools.toLocaleString()} pools total</span>
				</div>
				<div class="space-y-2">
					{#each TOP_POOLS as p, i}
					<div class="flex items-center gap-3 rounded-xl bg-white/5 border border-white/10 p-3">
						<span class="text-white/30 text-xs font-mono w-4 shrink-0">{i+1}</span>
						<div class="flex items-center gap-2 flex-1 min-w-0">
							<span class="font-black text-sm shrink-0 px-2 py-0.5 rounded-lg" style="background:#0033AD22; color:#00BBEE">[{p.ticker}]</span>
							<span class="text-white text-sm truncate">{p.name}</span>
						</div>
						<div class="flex items-center gap-4 shrink-0 text-xs">
							<div class="text-center">
								<p class="text-white/40">Sat.</p>
								<p class="font-mono font-bold {p.sat > 85 ? 'text-yellow-400' : 'text-green-400'}">{p.sat}%</p>
							</div>
							<div class="text-center">
								<p class="text-white/40">APY</p>
								<p class="text-green-400 font-mono font-bold">{p.apy}%</p>
							</div>
							<div class="text-center">
								<p class="text-white/40">Deleg.</p>
								<p class="text-white font-mono font-bold">{p.delegators.toLocaleString()}</p>
							</div>
						</div>
					</div>
					{/each}
				</div>
				<p class="text-xs text-white/30 mt-3 text-center">Pledge · Saturation · APY are approximate values</p>
			</div>

			<!-- Live Tx Feed -->
			<div class="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-5">
				<div class="flex items-center justify-between mb-4">
					<p class="text-white font-bold">Live Transactions</p>
					<span class="flex items-center gap-1 text-xs" style="color:#00BBEE">
						<span class="h-1.5 w-1.5 rounded-full animate-pulse" style="background:#00BBEE"></span>Mainnet
					</span>
				</div>
				<div class="space-y-1.5 overflow-hidden">
					{#each txFeed as tx (tx.id)}
					<div class="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2 text-xs">
						<span class="h-1.5 w-1.5 rounded-full shrink-0 {tx.status === 'ok' ? 'bg-green-400' : 'bg-red-400'}"></span>
						<span class="font-mono text-white/40 w-16 shrink-0">{tx.hash}</span>
						<span class="font-bold shrink-0" style="color:#00BBEE">{tx.type}</span>
						<span class="text-white/40 truncate flex-1">{tx.label}</span>
						<span class="text-white/50 font-mono shrink-0">₳{parseFloat(tx.ada).toLocaleString()}</span>
						<span class="text-white/30 shrink-0">{tx.age}s</span>
					</div>
					{/each}
				</div>
			</div>

		</div>
	</div>
</div>
