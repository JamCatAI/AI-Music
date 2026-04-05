<script>
	import { onMount } from 'svelte';
	import { fly, fade, scale, slide } from 'svelte/transition';
	import { cubicOut, quintOut } from 'svelte/easing';

	// ═════════════════════════════════════════════════════════════════
	// CYBERPUNK THEME TOKENS
	// ═════════════════════════════════════════════════════════════════
	const NEON = {
		primary: '#00f0ff',   // Cyan
		secondary: '#ff006e', // Hot Pink
		accent: '#39ff14',    // Matrix Green
		warning: '#ffbe0b',   // Amber
		danger: '#ff2a2a',    // Red
		purple: '#bc13fe',    // Electric Purple
		gold: '#ffd700'       // Cyber Gold
	};

	// ═════════════════════════════════════════════════════════════════
	// MOCK NVDA STOCK
	// ═════════════════════════════════════════════════════════════════
	let nvdaPrice    = $state(177.42);
	let nvdaChange   = $state(+2.85);
	let nvdaChangePct = $state(+1.63);
	let nvdaHigh     = $state(179.85);
	let nvdaLow      = $state(174.20);
	let nvdaOpen     = $state(174.57);
	let nvdaMktCap   = $state(4.32);
	let pulseTick    = $state(false);

	// Sparkline points (last 30 ticks)
	let spark = $state(Array.from({ length: 40 }, (_, i) =>
		165 + i * 0.35 + Math.sin(i * 0.6) * 5 + Math.random() * 3
	));

	function sparkPath(pts) {
		const w = 280, h = 64;
		const min = Math.min(...pts), max = Math.max(...pts);
		const xs = pts.map((_, i) => (i / (pts.length - 1)) * w);
		const ys = pts.map(p => h - ((p - min) / (max - min || 1)) * h);
		return xs.map((x, i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${ys[i].toFixed(1)}`).join(' ');
	}

	// ═════════════════════════════════════════════════════════════════
	// GPU PRODUCT CARDS - CYBERPUNK STYLE
	// ═════════════════════════════════════════════════════════════════
	const GPUS = [
		{ name: 'RTX 5090',     msrp: 1_999, street: 3_500, vram: '32 GB',  tflops: 209.4, tdp: 575, tier: 'GOD',      glyph: '◆', color: '#ffd700', avail: 'LIMITED'    },
		{ name: 'RTX 5080',     msrp:   999, street: 1_299, vram: '16 GB',  tflops: 137.6, tdp: 360, tier: 'ELITE',    glyph: '▲', color: '#00f0ff', avail: 'IN STOCK' },
		{ name: 'RTX 4090',     msrp: 1_599, street: 1_549, vram: '24 GB',  tflops: 82.6,  tdp: 450, tier: 'PRO',      glyph: '■', color: '#bc13fe', avail: 'AVAILABLE' },
		{ name: 'RTX 4080 S',   msrp:   999, street:   949, vram: '16 GB',  tflops: 52.2,  tdp: 320, tier: 'PLUS',     glyph: '●', color: '#39ff14', avail: 'AVAILABLE' },
		{ name: 'RTX 5070 Ti',  msrp:   749, street:   829, vram: '16 GB',  tflops: 146.0, tdp: 300, tier: 'GAMER',    glyph: '◆', color: '#ff006e', avail: 'AVAILABLE' },
		{ name: 'H100 SXM',     msrp: 30_000, street: 28_000, vram: '80 GB', tflops: 989.5, tdp: 700, tier: 'HPC',      glyph: '◈', color: '#00f0ff', avail: 'IN STOCK' },
		{ name: 'H200',         msrp: 40_000, street: 38_000, vram: '141 GB', tflops: 1979,  tdp: 1000, tier: 'HPC',     glyph: '◈', color: '#39ff14', avail: 'IN STOCK' },
		{ name: 'GB300 NVL72',  msrp: 450_000, street: 500_000, vram: '1.3 TB', tflops: 18000, tdp: 120000, tier: 'CLUSTER', glyph: '◉', color: '#ffbe0b', avail: 'PRE-ORDER' }
	];

	// ═════════════════════════════════════════════════════════════════
	// AI REVENUE CHART (QUARTERLY)
	// ═════════════════════════════════════════════════════════════════
	const QUARTERS = [
		{ q: 'Q1 24', rev: 26.04 },
		{ q: 'Q2 24', rev: 30.04 },
		{ q: 'Q3 24', rev: 35.08 },
		{ q: 'Q4 24', rev: 39.33 },
		{ q: 'Q1 25', rev: 44.06 },
		{ q: 'Q2 25', rev: 49.20 },
		{ q: 'Q3 25', rev: 57.00 },
		{ q: 'Q4 25', rev: 62.50 },
		{ q: 'Q1 26', rev: 68.00 }
	];

	const BAR_MAX = Math.max(...QUARTERS.map(q => q.rev));

	// ═════════════════════════════════════════════════════════════════
	// JAMCAT PORTFOLIO CALCULATOR
	// ═════════════════════════════════════════════════════════════════
	let jamHoldings  = $state(420_000);
	let jamInNvda    = $derived((jamHoldings * 0.000042 / nvdaPrice).toFixed(4));
	let calcGlow     = $state(false);

	// ═════════════════════════════════════════════════════════════════
	// JENSEN QUOTES TERMINAL
	// ═════════════════════════════════════════════════════════════════
	const QUOTES = [
		{ text: 'THE MORE YOU BUY, THE MORE YOU SAVE', ctx: 'Jensen Huang, probably' },
		{ text: 'BLACKWELL IS IN FULL PRODUCTION',      ctx: 'Jensen Huang, every quarter' },
		{ text: 'THE NEXT WAVE OF AI IS PHYSICAL AI',   ctx: 'Jensen Huang, GTC 2025' },
		{ text: 'CUDA OR DIE',                          ctx: 'Every ML engineer' },
		{ text: 'ONE MORE THING... IT FITS IN A GB200', ctx: 'Jensen Huang' }
	];
	let quoteIdx = $state(0);

	// ═════════════════════════════════════════════════════════════════
	// NEWS FEED - TERMINAL STYLE
	// ═════════════════════════════════════════════════════════════════
	const NEWS = [
		{ glyph: '▲', title: 'GB300 NVL72 SYSTEMS NOW SHIPPING TO CSPs', time: '02:34 UTC',  tag: 'HARDWARE' },
		{ glyph: '◆', title: 'Q1 FY2027 GUIDANCE: $78B REVENUE', time: '04:12 UTC',  tag: 'EARNINGS' },
		{ glyph: '●', title: 'BLACKWELL ULTRA DEMAND OFF THE CHARTS', time: '06:45 UTC',  tag: 'AI' },
		{ glyph: '◈', title: 'NVIDIA PARTNERS WITH INDIA ON AI INFRASTRUCTURE', time: '14:22 UTC',  tag: 'GLOBAL' },
		{ glyph: '■', title: 'MARKET CAP REACHES $4.3 TRILLION', time: '22:08 UTC',  tag: 'MARKETS' },
		{ glyph: '◊', title: 'DLSS 4.5 ANNOUNCED WITH NEURAL RENDERING', time: '08:15 UTC',  tag: 'GAMING' }
	];

	// ═════════════════════════════════════════════════════════════════
	// LIVE ORDER BOOK
	// ═════════════════════════════════════════════════════════════════
	let orderFlow = $state([
		{ side: 'BID',  qty: 420,  price: 177.12, time: '14:23:08' },
		{ side: 'ASK',  qty: 150,  price: 177.35, time: '14:23:05' },
		{ side: 'BID',  qty: 1200, price: 176.85, time: '14:23:01' },
		{ side: 'BID',  qty: 88,   price: 177.28, time: '14:22:58' },
		{ side: 'ASK',  qty: 300,  price: 177.45, time: '14:22:52' },
		{ side: 'BID',  qty: 2400, price: 176.75, time: '14:22:48' },
		{ side: 'ASK',  qty: 75,   price: 177.52, time: '14:22:41' },
		{ side: 'BID',  qty: 512,  price: 176.92, time: '14:22:38' }
	]);

	function pushOrder() {
		const side  = Math.random() > 0.42 ? 'BID' : 'ASK';
		const price = +(nvdaPrice + (Math.random() - 0.5) * 1.2).toFixed(2);
		const qty   = Math.floor(Math.random() * 1400) + 10;
		const time  = new Date().toISOString().split('T')[1].split('.')[0];
		orderFlow = [{ side, qty, price, time }, ...orderFlow.slice(0, 11)];
	}

	// ═════════════════════════════════════════════════════════════════
	// SYSTEM METRICS
	// ═════════════════════════════════════════════════════════════════
	const SYS_METRICS = [
		{ label: 'CPU_LOAD', value: '42%', status: 'normal' },
		{ label: 'MEM_USAGE', value: '68%', status: 'normal' },
		{ label: 'NET_LATENCY', value: '12ms', status: 'good' },
		{ label: 'API_HEALTH', value: 'OK', status: 'good' }
	];

	// ═════════════════════════════════════════════════════════════════
	// TERMINAL TICKER
	// ═════════════════════════════════════════════════════════════════
	const TICKER_SEGMENTS = [
		{ text: 'NVDA', style: 'text-[#00f0ff]' },
		{ text: 'NVIDIA_CORP', style: 'text-white/40' },
		{ text: '●', style: 'text-[#39ff14] animate-pulse' },
		{ text: 'AI_INFRASTRUCTURE', style: 'text-[#39ff14]/60' },
		{ text: 'DATACENTER', style: 'text-white/40' },
		{ text: 'CUDA', style: 'text-[#00f0ff]/80' },
		{ text: 'BLACKWELL', style: 'text-[#bc13fe]' },
		{ text: 'GB300', style: 'text-[#ffbe0b]' },
		{ text: 'MARKET_CAP_$4.32T', style: 'text-[#ffd700]' },
		{ text: 'PRICE_$177.42', style: 'text-[#39ff14]' },
		{ text: 'CHANGE_+1.63%', style: 'text-[#39ff14]' }
	];

	// ═════════════════════════════════════════════════════════════════
	// ANIMATION STATES
	// ═════════════════════════════════════════════════════════════════
	let bootSequence = $state(true);

	onMount(() => {
		// Boot sequence
		setTimeout(() => { bootSequence = false; }, 1500);

		// Price ticker
		const iv = setInterval(() => {
			const delta   = (Math.random() - 0.46) * 3.2;
			nvdaPrice     = +(nvdaPrice + delta).toFixed(2);
			nvdaChange    = +(nvdaPrice - nvdaOpen).toFixed(2);
			nvdaChangePct = +((nvdaChange / nvdaOpen) * 100).toFixed(2);
			nvdaHigh      = Math.max(nvdaHigh, nvdaPrice);
			nvdaLow       = Math.min(nvdaLow, nvdaPrice);
			spark         = [...spark.slice(1), nvdaPrice];
			pulseTick     = true;
			setTimeout(() => pulseTick = false, 200);
			if (Math.random() < 0.4) pushOrder();
		}, 800);

		// Quote rotation
		const qiv = setInterval(() => {
			quoteIdx = (quoteIdx + 1) % QUOTES.length;
		}, 6000);

		// Calculator glow effect
		const cgv = setInterval(() => {
			calcGlow = !calcGlow;
		}, 3000);

		return () => { clearInterval(iv); clearInterval(qiv); clearInterval(cgv); };
	});

	const up = $derived(nvdaChange >= 0);
	const priceColor = $derived(up ? '#39ff14' : '#ff2a2a');
</script>

<svelte:head>
	<title>NVDA // TERMINAL v2.0.77</title>
	<style>
		@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700;800&family=Orbitron:wght@400;500;700;900&display=swap');
	</style>
</svelte:head>

{#if bootSequence}
<div class="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#050508]" out:fade={{ duration: 400 }}>
	<div class="text-center" style="font-family: 'Orbitron', sans-serif;">
		<div class="mb-4 text-6xl font-black text-[#00f0ff]" style="text-shadow: 0 0 30px #00f0ff, 0 0 60px #00f0ff50;">◈ NVDA</div>
		<div class="text-xs tracking-[0.5em] text-[#39ff14]/60 font-mono">SYSTEM INITIALIZING</div>
		<div class="mt-8 h-1 w-64 overflow-hidden rounded-full bg-white/10">
			<div class="h-full animate-pulse rounded-full bg-gradient-to-r from-[#00f0ff] via-[#bc13fe] to-[#39ff14]" style="width: 100%;"></div>
		</div>
		<div class="mt-4 text-[10px] text-white/30 font-mono">v2.0.77 // BUILD 20260405</div>
	</div>
</div>
{/if}

<div class="relative min-h-screen overflow-hidden bg-[#030305] text-white" style="font-family: 'JetBrains Mono', monospace;">
	
	<!-- BACKGROUND EFFECTS -->
	<div class="pointer-events-none fixed inset-0">
		<div class="absolute inset-0 opacity-[0.03]" style="background-image: linear-gradient(rgba(0,240,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(0,240,255,0.3) 1px, transparent 1px); background-size: 50px 50px;"></div>
		<div class="absolute -top-40 left-1/4 h-[600px] w-[600px] rounded-full opacity-20 blur-[150px]" style="background: radial-gradient(circle, #00f0ff, transparent 70%);"></div>
		<div class="absolute bottom-0 right-0 h-[500px] w-[500px] rounded-full opacity-15 blur-[120px]" style="background: radial-gradient(circle, #bc13fe, transparent 70%);"></div>
		<div class="absolute top-1/2 left-0 h-[300px] w-[300px] rounded-full opacity-10 blur-[100px]" style="background: radial-gradient(circle, #39ff14, transparent 70%);"></div>
		<div class="absolute inset-0 opacity-[0.02]" style="background: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,240,255,0.5) 2px, rgba(0,240,255,0.5) 3px);"></div>
		<div class="absolute inset-0" style="background: radial-gradient(ellipse at center, transparent 0%, rgba(3,3,5,0.8) 100%);"></div>
	</div>

	<!-- TOP STATUS BAR -->
	<div class="relative z-10 border-b border-white/10 bg-black/40 backdrop-blur-xl">
		<div class="mx-auto flex max-w-[1600px] items-center justify-between px-4 py-2">
			<div class="flex items-center gap-4">
				<div class="flex items-center gap-2">
					<span class="h-2 w-2 animate-pulse rounded-full bg-[#39ff14] shadow-[0_0_10px_#39ff14]"></span>
					<span class="text-[10px] font-bold tracking-wider text-[#39ff14]">SYSTEM ONLINE</span>
				</div>
				<div class="h-4 w-px bg-white/20"></div>
				<span class="text-[10px] text-white/40">TERMINAL_ID: NVDA-X77</span>
			</div>
			<div class="flex-1 overflow-hidden px-8">
				<div class="flex animate-marquee whitespace-nowrap gap-6">
					{#each Array(4) as _, i}
						{#each TICKER_SEGMENTS as seg}
							<span class="text-[11px] font-bold tracking-wider {seg.style}">{seg.text}</span>
							<span class="text-white/20">//</span>
						{/each}
					{/each}
				</div>
			</div>
			<div class="flex items-center gap-4 text-[10px]">
				{#each SYS_METRICS as metric}
					<div class="flex items-center gap-1.5">
						<span class="text-white/40">{metric.label}:</span>
						<span class="font-bold {metric.status === 'good' ? 'text-[#39ff14]' : 'text-[#00f0ff]'}" style="text-shadow: 0 0 5px currentColor;">{metric.value}</span>
					</div>
				{/each}
			</div>
		</div>
	</div>

	<!-- MAIN DASHBOARD -->
	<div class="relative z-10 mx-auto max-w-[1600px] p-4">
		
		<!-- Header Block -->
		<div class="mb-4 flex items-center justify-between">
			<div class="flex items-center gap-3">
				<div class="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg border border-[#00f0ff]/50 bg-black/60">
					<div class="absolute inset-0 bg-gradient-to-br from-[#00f0ff]/20 to-transparent"></div>
					<span class="relative text-lg font-black text-[#00f0ff]" style="text-shadow: 0 0 10px #00f0ff;">N</span>
				</div>
				<div>
					<h1 class="text-sm font-black tracking-[0.2em] text-white" style="font-family: 'Orbitron', sans-serif;">NVDA<span class="text-[#00f0ff]">.TERMINAL</span></h1>
					<p class="text-[10px] text-white/40">NASDAQ // AI_INFRASTRUCTURE // REALTIME</p>
				</div>
			</div>
			<div class="flex items-center gap-4">
				<div class="text-right">
					<div class="text-[10px] text-white/40">SESSION</div>
					<div class="text-xs font-bold text-[#39ff14]">LIVE</div>
				</div>
				<div class="text-right">
					<div class="text-[10px] text-white/40">UTC</div>
					<div class="text-xs font-mono text-white">{new Date().toISOString().split('T')[1].split('.')[0]}</div>
				</div>
			</div>
		</div>

		<!-- PRIMARY PRICE DISPLAY -->
		<div class="mb-4 grid grid-cols-12 gap-4">
			<div class="col-span-12 lg:col-span-4">
				<div class="relative overflow-hidden rounded-xl border border-[#00f0ff]/30 bg-black/60 p-5 backdrop-blur-xl" style="box-shadow: 0 0 40px rgba(0,240,255,0.1), inset 0 1px 0 rgba(255,255,255,0.1);">
					<div class="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none"></div>
					<div class="relative">
						<div class="mb-3 flex items-center justify-between">
							<span class="text-[10px] font-bold tracking-wider text-white/40">PRIMARY ASSET</span>
							<span class="flex items-center gap-1.5 text-[10px] font-bold text-[#39ff14]">
								<span class="h-1.5 w-1.5 animate-pulse rounded-full bg-[#39ff14] shadow-[0_0_8px_#39ff14]"></span>
								LIVE_FEED
							</span>
						</div>
						<div class="mb-4">
							<div class="flex items-baseline gap-1">
								<span class="text-5xl font-black tracking-tighter text-white" style="font-family: 'Orbitron', sans-serif; text-shadow: 0 0 20px rgba(255,255,255,0.3);">${nvdaPrice.toFixed(2)}</span>
								<span class="text-lg font-bold" style="color: {priceColor}; text-shadow: 0 0 10px currentColor;">{up ? '▲' : '▼'}</span>
							</div>
							<div class="mt-1 flex items-center gap-3">
								<span class="text-sm font-bold" style="color: {priceColor};">{up ? '+' : ''}{nvdaChange.toFixed(2)} ({nvdaChangePct.toFixed(2)}%)</span>
								<span class="text-[10px] text-white/30">TODAY</span>
							</div>
						</div>
						<div class="grid grid-cols-2 gap-2">
							{#each [{ l: 'OPEN', v: nvdaOpen.toFixed(2) }, { l: 'HIGH', v: nvdaHigh.toFixed(2) }, { l: 'LOW', v: nvdaLow.toFixed(2) }, { l: 'MKT_CAP', v: nvdaMktCap.toFixed(2) + 'T' }] as s}
								<div class="rounded-lg border border-white/10 bg-white/5 p-2.5 backdrop-blur-sm">
									<div class="text-[9px] font-bold tracking-wider text-white/30">{s.l}</div>
									<div class="text-sm font-bold text-white" style="font-family: 'Orbitron', sans-serif;">${s.v}</div>
								</div>
							{/each}
						</div>
					</div>
				</div>
			</div>
			<div class="col-span-12 lg:col-span-8">
				<div class="relative h-full overflow-hidden rounded-xl border border-[#bc13fe]/30 bg-black/60 p-4 backdrop-blur-xl" style="box-shadow: 0 0 40px rgba(188,19,254,0.1), inset 0 1px 0 rgba(255,255,255,0.1);">
					<div class="mb-3 flex items-center justify-between">
						<span class="text-[10px] font-bold tracking-wider text-white/40">PRICE_ACTION // 40_TICK_WINDOW</span>
						<div class="flex gap-2">
							<span class="rounded border border-[#00f0ff]/30 bg-[#00f0ff]/10 px-2 py-0.5 text-[9px] font-bold text-[#00f0ff]">1M</span>
							<span class="rounded border border-white/10 bg-white/5 px-2 py-0.5 text-[9px] text-white/40">5M</span>
							<span class="rounded border border-white/10 bg-white/5 px-2 py-0.5 text-[9px] text-white/40">1H</span>
						</div>
					</div>
					<div class="relative h-[120px] w-full overflow-hidden rounded-lg border border-white/10 bg-black/40">
						{#each [0.25, 0.5, 0.75] as pct}
							<div class="absolute left-0 right-0 border-t border-[#00f0ff]/10" style="top:{pct*100}%"></div>
						{/each}
						<svg class="absolute inset-0 h-full w-full" preserveAspectRatio="none" viewBox="0 0 280 64">
							<defs>
								<linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
									<stop offset="0%" stop-color="#00f0ff" stop-opacity="0.4"/>
									<stop offset="100%" stop-color="#00f0ff" stop-opacity="0"/>
								</linearGradient>
								<linearGradient id="sparkStroke" x1="0" y1="0" x2="1" y2="0">
									<stop offset="0%" stop-color="#bc13fe"/>
									<stop offset="50%" stop-color="#00f0ff"/>
									<stop offset="100%" stop-color="#39ff14"/>
								</linearGradient>
							</defs>
							{#key spark}
								<path d="{sparkPath(spark)} L280,64 L0,64 Z" fill="url(#sparkFill)" opacity="0.8"/>
								<path d={sparkPath(spark)} fill="none" stroke="url(#sparkStroke)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="filter: drop-shadow(0 0 4px rgba(0,240,255,0.5));"/>
							{/key}
						</svg>
						<div class="absolute right-4 top-3 rounded border border-[#00f0ff]/50 bg-black/80 px-2 py-1 backdrop-blur-sm" style="box-shadow: 0 0 15px rgba(0,240,255,0.3);">
							<span class="text-xs font-bold text-[#00f0ff]" style="font-family: 'Orbitron', sans-serif; text-shadow: 0 0 5px #00f0ff;">${nvdaPrice.toFixed(2)}</span>
						</div>
					</div>
					<div class="mt-3 rounded-lg border border-[#39ff14]/20 bg-[#39ff14]/5 p-3 backdrop-blur-sm">
						{#key quoteIdx}
							<div in:fly={{ y: 10, duration: 300 }}>
								<p class="text-xs font-bold tracking-wider text-[#39ff14]/80" style="text-shadow: 0 0 5px rgba(57,255,20,0.3);">> {QUOTES[quoteIdx].text}</p>
								<p class="mt-1 text-[10px] text-white/30">{QUOTES[quoteIdx].ctx}</p>
							</div>
						{/key}
					</div>
				</div>
			</div>
		</div>

		<!-- DENSE DASHBOARD GRID -->
		<div class="grid grid-cols-12 gap-4">
			<div class="col-span-12 lg:col-span-8 space-y-4">
				<div class="rounded-xl border border-white/10 bg-black/40 p-4 backdrop-blur-xl" style="box-shadow: inset 0 1px 0 rgba(255,255,255,0.05);">
					<div class="mb-3 flex items-center justify-between">
						<span class="text-[10px] font-bold tracking-wider text-white/40">HARDWARE_MATRIX // GPU_INVENTORY</span>
						<span class="text-[10px] text-white/30">8 UNITS DETECTED</span>
					</div>
					<div class="grid grid-cols-2 gap-3 md:grid-cols-4">
						{#each GPUS as gpu, i (gpu.name)}
							<div class="group relative overflow-hidden rounded-lg border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-3 transition-all duration-300 hover:border-[{gpu.color}]/50" style="--gpu-color: {gpu.color};">
								<div class="absolute left-0 right-0 top-0 h-0.5 transition-all duration-300 group-hover:h-1" style="background: {gpu.color}; box-shadow: 0 0 10px {gpu.color};"></div>
								<div class="relative">
									<div class="mb-2 flex items-center justify-between">
										<div class="flex items-center gap-2">
											<span class="text-lg" style="color: {gpu.color}; text-shadow: 0 0 10px {gpu.color};">{gpu.glyph}</span>
											<div>
												<p class="text-xs font-bold text-white">{gpu.name}</p>
												<p class="text-[9px] text-white/30">{gpu.vram} · {gpu.tdp}W</p>
											</div>
										</div>
										<span class="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 text-[8px] font-bold text-white/50">{gpu.tier}</span>
									</div>
									<div class="mb-2 grid grid-cols-2 gap-2">
										<div class="rounded bg-white/5 p-1.5">
											<p class="text-[8px] text-white/30">MSRP</p>
											<p class="text-xs font-bold text-white/70">${gpu.msrp.toLocaleString()}</p>
										</div>
										<div class="rounded border p-1.5 {gpu.street > gpu.msrp ? 'border-red-500/20 bg-red-500/10' : 'border-[#39ff14]/20 bg-[#39ff14]/10'}">
											<p class="text-[8px] text-white/30">STREET</p>
											<p class="text-xs font-bold {gpu.street > gpu.msrp ? 'text-red-400' : 'text-[#39ff14]'}">${gpu.street.toLocaleString()}</p>
										</div>
									</div>
									<div class="flex items-center justify-between">
										<div>
											<p class="text-[8px] text-white/30">AI_TFLOPS</p>
											<p class="text-xs font-bold text-white">{gpu.tflops.toLocaleString()}</p>
										</div>
										<span class="rounded border px-1.5 py-0.5 text-[8px] font-bold {gpu.avail === 'AVAILABLE' || gpu.avail === 'IN STOCK' ? 'border-[#39ff14]/30 text-[#39ff14] bg-[#39ff14]/10' : gpu.avail === 'LIMITED' ? 'border-[#ffbe0b]/30 text-[#ffbe0b] bg-[#ffbe0b]/10' : 'border-[#ff006e]/30 text-[#ff006e] bg-[#ff006e]/10'}">{gpu.avail}</span>
									</div>
								</div>
							</div>
						{/each}
					</div>
				</div>
				<div class="rounded-xl border border-[#39ff14]/20 bg-black/40 p-4 backdrop-blur-xl">
					<div class="mb-3 flex items-center justify-between">
						<span class="text-[10px] font-bold tracking-wider text-white/40">DATA_CENTER_REVENUE // $B_QUARTERLY</span>
						<div class="flex items-center gap-2">
							<span class="text-[10px] text-white/30">CAGR:</span>
							<span class="text-xs font-bold text-[#39ff14]">+161% YoY</span>
						</div>
					</div>
					<div class="relative h-[140px]">
						<div class="absolute left-0 top-0 bottom-0 flex flex-col justify-between py-2 text-[9px] text-white/20">
							<span>70B</span><span>35B</span><span>0</span>
						</div>
						<div class="ml-8 flex h-full items-end gap-1">
							{#each QUARTERS as q, i (q.q)}
								<div class="group relative flex flex-1 flex-col items-center">
									{#if i === QUARTERS.length - 1}
										<div class="absolute -top-5 text-[9px] font-bold text-[#39ff14]" style="text-shadow: 0 0 5px #39ff14;">${q.rev}B</div>
									{/if}
									<div class="relative w-full overflow-hidden rounded-t transition-all duration-500 group-hover:brightness-125" style="height:{Math.max(8,(q.rev/BAR_MAX)*100)}px;">
										<div class="absolute inset-0" style="background: {i === QUARTERS.length - 1 ? 'linear-gradient(180deg, #39ff14 0%, #00f0ff 100%)' : 'linear-gradient(180deg, rgba(57,255,20,0.5) 0%, rgba(0,240,255,0.2) 100%)'};"></div>
										{#if i === QUARTERS.length - 1}
											<div class="absolute inset-0 animate-pulse opacity-50" style="background: linear-gradient(180deg, #39ff14, transparent); filter: blur(10px);"></div>
										{/if}
									</div>
									<span class="mt-1 text-[8px] text-white/30 rotate-45 origin-left">{q.q}</span>
								</div>
							{/each}
						</div>
					</div>
				</div>
				<div class="rounded-xl border border-[#ffd700]/20 bg-gradient-to-br from-[#ffd700]/5 to-transparent p-4 backdrop-blur-xl" class:shadow-[0_0_30px_rgba(255,215,0,0.2)]={calcGlow}>
					<div class="mb-3 flex items-center gap-2">
						<span class="text-lg text-[#ffd700]">◈</span>
						<span class="text-[10px] font-bold tracking-wider text-[#ffd700]/80">PORTFOLIO_SIMULATOR // JAM_TO_NVDA</span>
					</div>
					<div class="grid grid-cols-1 gap-4 md:grid-cols-3">
						<div class="rounded-lg border border-white/10 bg-black/40 p-3">
							<p class="mb-1 text-[9px] font-bold tracking-wider text-white/30">JAM_HOLDINGS</p>
							<input type="number" bind:value={jamHoldings} min="0" class="w-full bg-transparent text-xl font-bold text-white outline-none placeholder-white/10" style="font-family: 'Orbitron', sans-serif;" />
						</div>
						<div class="flex items-center justify-center">
							<div class="text-center">
								<div class="text-2xl text-white/20">→</div>
								<div class="text-[9px] text-white/30">CONVERSION</div>
							</div>
						</div>
						<div class="rounded-lg border border-[#ffd700]/30 bg-[#ffd700]/10 p-3" style="box-shadow: 0 0 20px rgba(255,215,0,0.1);">
							<p class="mb-1 text-[9px] font-bold tracking-wider text-[#ffd700]/60">NVDA_SHARES</p>
							<p class="text-xl font-bold text-[#ffd700]" style="font-family: 'Orbitron', sans-serif; text-shadow: 0 0 10px rgba(255,215,0,0.5);">{jamInNvda}</p>
						</div>
					</div>
					<p class="mt-2 text-[9px] text-white/20">1_JAM = $0.000042_USD // MOCK_RATE // NOT_FINANCIAL_ADVICE</p>
				</div>
			</div>
			<div class="col-span-12 lg:col-span-4 space-y-4">
				<div class="rounded-xl border border-[#00f0ff]/20 bg-black/60 p-4 backdrop-blur-xl" style="box-shadow: 0 0 30px rgba(0,240,255,0.05);">
					<div class="mb-3 flex items-center justify-between">
						<span class="text-[10px] font-bold tracking-wider text-[#00f0ff]/80">ORDER_BOOK // LIVE</span>
						<span class="flex h-2 w-2 animate-pulse rounded-full bg-[#00f0ff] shadow-[0_0_8px_#00f0ff]"></span>
					</div>
					<div class="mb-2 grid grid-cols-4 gap-2 text-[9px] font-bold tracking-wider text-white/30">
						<span>TIME</span><span>SIDE</span><span class="text-right">QTY</span><span class="text-right">PRICE</span>
					</div>
					<div class="space-y-1">
						{#each orderFlow as order, i (order.time + i)}
							<div class="grid grid-cols-4 gap-2 rounded py-1.5 px-1 text-xs transition-colors {order.side === 'BID' ? 'bg-[#39ff14]/5' : 'bg-[#ff006e]/5'}" in:fly={{ x: order.side === 'BID' ? -10 : 10, duration: 200 }}>
								<span class="text-[9px] text-white/30">{order.time}</span>
								<span class="font-bold {order.side === 'BID' ? 'text-[#39ff14]' : 'text-[#ff006e]'}">{order.side}</span>
								<span class="text-right text-white/60">{order.qty.toLocaleString()}</span>
								<span class="text-right font-mono font-bold text-white" style="font-family: 'Orbitron', sans-serif;">${order.price.toFixed(2)}</span>
							</div>
						{/each}
					</div>
				</div>
				<div class="rounded-xl border border-[#bc13fe]/20 bg-black/60 p-4 backdrop-blur-xl">
					<div class="mb-3 flex items-center justify-between">
						<span class="text-[10px] font-bold tracking-wider text-[#bc13fe]/80">FINANCIAL_METRICS</span>
						<span class="text-[9px] text-white/30">Q1_FY26</span>
					</div>
					<div class="space-y-2">
						{#each [{ l: 'P/E_RATIO', v: '38.5x', n: 'FWD' }, { l: 'REVENUE_TTM', v: '$243B', n: '' }, { l: 'GROSS_MARGIN', v: '75.8%', n: '↑' }, { l: 'DATA_CENTER', v: '92%', n: 'REV' }, { l: 'R&D_SPEND', v: '$12.4B', n: 'YR' }, { l: 'FREE_CASH_FLOW', v: '$45.8B', n: 'TTM' }, { l: 'EMPLOYEES', v: '31.2K', n: '' }, { l: 'MARKET_CAP', v: '$4.32T', n: '' }] as m}
							<div class="flex items-center justify-between border-b border-white/5 py-1.5 last:border-0">
								<span class="text-[10px] font-bold text-white/40">{m.l}</span>
								<div class="flex items-center gap-2">
									<span class="text-sm font-bold text-white" style="font-family: 'Orbitron', sans-serif;">{m.v}</span>
									{#if m.n}<span class="text-[9px] {m.n === '↑' ? 'text-[#39ff14]' : 'text-white/20'}">{m.n}</span>{/if}
								</div>
							</div>
						{/each}
					</div>
				</div>
				<div class="rounded-xl border border-[#ffbe0b]/20 bg-black/60 p-4 backdrop-blur-xl">
					<div class="mb-3 flex items-center justify-between">
						<span class="text-[10px] font-bold tracking-wider text-[#ffbe0b]/80">NEWS_FEED // LIVE</span>
						<span class="rounded border border-[#ffbe0b]/30 bg-[#ffbe0b]/10 px-1.5 py-0.5 text-[9px] text-[#ffbe0b]">6 NEW</span>
					</div>
					<div class="space-y-3">
						{#each NEWS as n (n.title)}
							<div class="group flex gap-3 rounded-lg border border-transparent p-2 transition-all hover:border-white/10 hover:bg-white/5">
								<span class="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-white/5 text-xs text-[#00f0ff]">{n.glyph}</span>
								<div class="min-w-0">
									<p class="truncate text-[11px] font-bold leading-tight text-white/70 group-hover:text-white">{n.title}</p>
									<div class="mt-0.5 flex items-center gap-2">
										<span class="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 text-[8px] font-bold text-[#39ff14]/70">{n.tag}</span>
										<span class="text-[9px] text-white/30">{n.time}</span>
									</div>
								</div>
							</div>
						{/each}
					</div>
				</div>
			</div>
		</div>

		<!-- ARCHITECTURE ROADMAP -->
		<div class="mt-4 rounded-xl border border-white/10 bg-black/40 p-5 backdrop-blur-xl">
			<div class="mb-4 flex items-center justify-between">
				<span class="text-[10px] font-bold tracking-wider text-white/40">ARCHITECTURE_ROADMAP // GPU_TIMELINE</span>
				<div class="flex items-center gap-2">
					<span class="flex h-1.5 w-1.5 rounded-full bg-[#00f0ff] shadow-[0_0_8px_#00f0ff]"></span>
					<span class="text-[10px] text-white/40">CURRENT: BLACKWELL</span>
					<span class="flex h-1.5 w-1.5 rounded-full bg-[#ff006e]/50"></span>
					<span class="text-[10px] text-white/40">UPCOMING: VERA_RUBIN</span>
				</div>
			</div>
			<div class="relative">
				<div class="absolute left-0 right-0 top-4 h-0.5 bg-gradient-to-r from-[#00f0ff]/20 via-[#bc13fe]/50 to-[#ff006e]/20"></div>
				<div class="relative grid grid-cols-5 gap-4">
					{#each [{ arch: 'AMPERE', year: '2020', gpu: 'A100 / RTX 3090', status: 'DEPRECATED', color: '#ffffff' }, { arch: 'HOPPER', year: '2022', gpu: 'H100 / H200', status: 'ACTIVE', color: '#39ff14' }, { arch: 'ADA', year: '2022', gpu: 'RTX 4090', status: 'ACTIVE', color: '#39ff14' }, { arch: 'BLACKWELL', year: '2024', gpu: 'B200 / RTX 5090', status: 'CURRENT', color: '#00f0ff' }, { arch: 'VERA_RUBIN', year: '2026', gpu: 'R100', status: 'UPCOMING', color: '#ff006e' }] as node, i}
						<div class="text-center">
							<div class="relative mb-3 flex justify-center">
								<div class="h-3 w-3 rounded-full border-2 transition-all duration-300 hover:scale-125" style="background: {node.status === 'CURRENT' ? node.color : 'transparent'}; border-color: {node.color}; box-shadow: {node.status === 'CURRENT' ? `0 0 15px ${node.color}` : 'none'};"></div>
								{#if node.status === 'CURRENT'}
									<div class="absolute inset-0 flex justify-center">
										<div class="h-3 w-3 animate-ping rounded-full" style="background: {node.color}; opacity: 0.5;"></div>
									</div>
								{/if}
							</div>
							<p class="text-xs font-bold" style="color: {node.status === 'CURRENT' ? node.color : 'rgba(255,255,255,0.5)'}; text-shadow: {node.status === 'CURRENT' ? `0 0 10px ${node.color}` : 'none'};">{node.arch}</p>
							<p class="text-[9px] text-white/30">{node.year}</p>
							<p class="text-[9px] text-white/40">{node.gpu}</p>
							<span class="mt-1 inline-block rounded border px-1.5 py-0.5 text-[8px] font-bold" style="border-color: {node.color}40; color: {node.color}; background: {node.color}10;">{node.status}</span>
						</div>
					{/each}
				</div>
			</div>
		</div>

		<!-- Footer -->
		<div class="mt-4 flex items-center justify-between border-t border-white/10 pt-3 text-[9px] text-white/30">
			<div class="flex items-center gap-4">
				<span>NVDA_TERMINAL v2.0.77</span>
				<span class="text-white/20">|</span>
				<span>BUILD: 20260405.1</span>
				<span class="text-white/20">|</span>
				<span>LATENCY: 12ms</span>
			</div>
			<div class="flex items-center gap-4">
				<span class="text-[#39ff14]">● ENCRYPTED_CONNECTION</span>
				<span class="text-white/20">|</span>
				<span>DATA_FEED: BLOOMBERG_API</span>
			</div>
		</div>

	</div>
</div>

<style>
	@keyframes marquee {
		from { transform: translateX(0); }
		to   { transform: translateX(-50%); }
	}
	.animate-marquee {
		animation: marquee 30s linear infinite;
	}
	::-webkit-scrollbar {
		width: 6px;
		height: 6px;
	}
	::-webkit-scrollbar-track {
		background: rgba(0,0,0,0.3);
	}
	::-webkit-scrollbar-thumb {
		background: rgba(0,240,255,0.3);
		border-radius: 3px;
	}
	::-webkit-scrollbar-thumb:hover {
		background: rgba(0,240,255,0.5);
	}
</style>
