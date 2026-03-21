<script>
	import { onMount } from 'svelte';
	import { fly, fade } from 'svelte/transition';

	// ── GPU database ─────────────────────────────────────────────
	const GPUS = [
		// NVIDIA
		{ id:1,  brand:'NVIDIA', name:'RTX 5090',       msrp:1999,  vram:32,  tflops:209.4, gaming:100, rt:100, ai:100, tdp:575, tier:'S', avail:'Scarce',    use:['gaming','ai','creative'], node:'4nm TSMC',  arch:'Blackwell' },
		{ id:2,  brand:'NVIDIA', name:'RTX 5080',       msrp:999,   vram:16,  tflops:137.6, gaming:85,  rt:88,  ai:78,  tdp:360, tier:'A', avail:'Low',       use:['gaming','ai','creative'], node:'4nm TSMC',  arch:'Blackwell' },
		{ id:3,  brand:'NVIDIA', name:'RTX 4090',       msrp:1599,  vram:24,  tflops:82.6,  gaming:90,  rt:92,  ai:70,  tdp:450, tier:'S', avail:'Good',      use:['gaming','ai','creative'], node:'5nm TSMC',  arch:'Ada Lovelace' },
		{ id:4,  brand:'NVIDIA', name:'RTX 4080 Super', msrp:999,   vram:16,  tflops:52.2,  gaming:72,  rt:75,  ai:52,  tdp:320, tier:'A', avail:'Good',      use:['gaming','creative'],      node:'5nm TSMC',  arch:'Ada Lovelace' },
		{ id:5,  brand:'NVIDIA', name:'RTX 4070 Ti S',  msrp:799,   vram:16,  tflops:40.0,  gaming:65,  rt:68,  ai:44,  tdp:285, tier:'B', avail:'Good',      use:['gaming'],                  node:'5nm TSMC',  arch:'Ada Lovelace' },
		{ id:6,  brand:'NVIDIA', name:'RTX 4070 Super', msrp:599,   vram:12,  tflops:35.5,  gaming:58,  rt:60,  ai:38,  tdp:220, tier:'B', avail:'Good',      use:['gaming','value'],          node:'5nm TSMC',  arch:'Ada Lovelace' },
		// AMD
		{ id:7,  brand:'AMD',    name:'RX 9070 XT',     msrp:599,   vram:16,  tflops:50.3,  gaming:70,  rt:58,  ai:34,  tdp:304, tier:'A', avail:'Good',      use:['gaming','value'],          node:'4nm TSMC',  arch:'RDNA 4' },
		{ id:8,  brand:'AMD',    name:'RX 9070',        msrp:499,   vram:16,  tflops:40.5,  gaming:62,  rt:50,  ai:28,  tdp:220, tier:'B', avail:'Good',      use:['gaming','value'],          node:'4nm TSMC',  arch:'RDNA 4' },
		{ id:9,  brand:'AMD',    name:'RX 7900 XTX',    msrp:799,   vram:24,  tflops:61.4,  gaming:78,  rt:62,  ai:30,  tdp:355, tier:'A', avail:'Good',      use:['gaming','creative'],       node:'5nm TSMC',  arch:'RDNA 3' },
		{ id:10, brand:'AMD',    name:'RX 7900 XT',     msrp:699,   vram:20,  tflops:51.5,  gaming:70,  rt:55,  ai:26,  tdp:300, tier:'B', avail:'Good',      use:['gaming'],                  node:'5nm TSMC',  arch:'RDNA 3' },
		{ id:11, brand:'AMD',    name:'RX 7800 XT',     msrp:449,   vram:16,  tflops:37.3,  gaming:55,  rt:42,  ai:20,  tdp:263, tier:'B', avail:'Good',      use:['gaming','value'],          node:'5nm TSMC',  arch:'RDNA 3' },
		// Intel
		{ id:12, brand:'Intel',  name:'Arc B580',       msrp:249,   vram:12,  tflops:19.5,  gaming:42,  rt:40,  ai:22,  tdp:190, tier:'C', avail:'Good',      use:['gaming','value'],          node:'5nm TSMC',  arch:'Battlemage' },
		{ id:13, brand:'Intel',  name:'Arc B770',       msrp:349,   vram:16,  tflops:28.0,  gaming:52,  rt:48,  ai:30,  tdp:225, tier:'C', avail:'Soon',      use:['gaming','value'],          node:'5nm TSMC',  arch:'Battlemage' },
		{ id:14, brand:'Intel',  name:'Arc A770',       msrp:299,   vram:16,  tflops:17.2,  gaming:38,  rt:34,  ai:18,  tdp:225, tier:'C', avail:'Good',      use:['gaming','value'],          node:'6nm Intel', arch:'Alchemist' },
	];

	const BRAND_COLOR = { NVIDIA: '#76b900', AMD: '#ED1C24', Intel: '#0071C5' };
	const BRAND_BG    = { NVIDIA: 'rgba(118,185,0,.08)', AMD: 'rgba(237,28,36,.08)', Intel: 'rgba(0,113,197,.08)' };
	const BRAND_BORDER= { NVIDIA: 'rgba(118,185,0,.2)',  AMD: 'rgba(237,28,36,.2)',  Intel: 'rgba(0,113,197,.2)'  };
	const TIER_LABEL  = { S:'S-Tier', A:'A-Tier', B:'B-Tier', C:'C-Tier' };
	const TIER_COLOR  = { S:'text-yellow-400', A:'text-purple-400', B:'text-sky-400', C:'text-white/40' };

	// ── filters ──────────────────────────────────────────────────
	let brandFilter  = $state('All');
	let useFilter    = $state('all');
	let sortKey      = $state('gaming');
	const BRANDS = ['All', 'NVIDIA', 'AMD', 'Intel'];
	const USES   = [
		{ key:'all',      label:'All' },
		{ key:'gaming',   label:'🎮 Gaming' },
		{ key:'ai',       label:'🤖 AI/ML' },
		{ key:'creative', label:'🎨 Creative' },
		{ key:'value',    label:'💰 Value' }
	];
	const SORTS = [
		{ key:'gaming', label:'Gaming' },
		{ key:'msrp',   label:'Price ↑' },
		{ key:'vram',   label:'VRAM' },
		{ key:'tflops', label:'TFLOPS' },
		{ key:'ai',     label:'AI Score' }
	];

	let visible = $derived(
		GPUS
			.filter(g => brandFilter === 'All' || g.brand === brandFilter)
			.filter(g => useFilter === 'all' || g.use.includes(useFilter))
			.sort((a,b) => sortKey === 'msrp' ? a.msrp - b.msrp : b[sortKey] - a[sortKey])
	);

	// ── benchmark bars ───────────────────────────────────────────
	const BENCH_GPUS = ['RTX 5090','RTX 4090','RX 9070 XT','RTX 4080 Super','RX 7900 XTX','Arc B580'];
	let benchMetric = $state('gaming');
	const BENCH_METRICS = [
		{ key:'gaming', label:'1440p Gaming' },
		{ key:'tflops', label:'AI TFLOPS' },
		{ key:'rt',     label:'Ray Tracing' }
	];

	let benchData = $derived(
		BENCH_GPUS.map(n => {
			const g = GPUS.find(x => x.name === n);
			const raw = benchMetric === 'tflops' ? g.tflops : g[benchMetric];
			const maxVal = benchMetric === 'tflops' ? 210 : 100;
			return { ...g, raw, pct: Math.round((raw / maxVal) * 100) };
		}).sort((a,b) => b.raw - a.raw)
	);

	// ── best picks ───────────────────────────────────────────────
	const PICKS = [
		{ label:'Best Overall',   name:'RTX 5090',    reason:'Unreachable performance. Period.',        icon:'👑' },
		{ label:'Best Value',     name:'Arc B580',    reason:'$249 with 12GB VRAM — insane per-dollar.', icon:'💰' },
		{ label:'Best Mid-Range', name:'RX 9070 XT',  reason:'RDNA 4 trades blows with 4080 at $599.',  icon:'🔥' },
		{ label:'Best for AI',    name:'RTX 4090',    reason:'24GB VRAM, widely available, CUDA ecosystem.', icon:'🤖' }
	];

	// ── live price pulse ─────────────────────────────────────────
	let priceTick = $state(0);

	const TICKER = '🖥️ GPU COMPARISON · NVIDIA RTX · AMD RDNA 4 · INTEL BATTLEMAGE · BENCHMARK · VRAM · TFLOPS · GAMING · AI/ML · PRICE VS PERFORMANCE · ';

	onMount(() => {
		const iv = setInterval(() => { priceTick++; }, 3000);
		return () => clearInterval(iv);
	});
</script>

<svelte:head><title>GPU Compare | JamCat</title></svelte:head>

<!-- TICKER -->
<div class="overflow-hidden border-b border-white/5 bg-black/40 py-2.5 backdrop-blur-xl">
	<div class="flex whitespace-nowrap" style="animation:marquee 42s linear infinite">
		{#each [TICKER,TICKER] as t}
			<span class="mr-0 text-[10px] font-black uppercase tracking-[0.3em] text-white/30">{t}</span>
		{/each}
	</div>
</div>

<div class="relative min-h-screen bg-[#080808]">

	<!-- ambient -->
	<div class="pointer-events-none absolute inset-0 overflow-hidden">
		<div class="absolute -top-40 left-1/3 h-[600px] w-[600px] rounded-full opacity-[0.06] blur-[140px]"
			 style="background:radial-gradient(circle,#76b900,transparent 70%)"></div>
		<div class="absolute top-1/2 right-0 h-[400px] w-[400px] rounded-full opacity-[0.05] blur-[120px]"
			 style="background:radial-gradient(circle,#ED1C24,transparent 70%)"></div>
		<div class="absolute bottom-0 left-0 h-[300px] w-[300px] rounded-full opacity-[0.04] blur-[100px]"
			 style="background:radial-gradient(circle,#0071C5,transparent 70%)"></div>
	</div>

	<div class="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-10">

		<!-- ── HERO ─────────────────────────────────────────────── -->
		<div class="mb-10" in:fly={{ y: -20, duration: 500 }}>
			<p class="mb-2 text-[10px] font-black uppercase tracking-[0.3em] text-white/20">GPU Comparison · 2026</p>
			<h1 class="mb-3 text-5xl font-black tracking-tighter text-white sm:text-7xl">
				Find Your<br/><span class="bg-gradient-to-r from-[#76b900] via-white to-[#ED1C24] bg-clip-text text-transparent inline-block">Perfect GPU</span>
			</h1>
			<p class="max-w-lg text-sm text-white/30">
				NVIDIA · AMD · Intel — benchmarked, priced, compared. Gaming, AI/ML, creative. No fluff.
			</p>

			<!-- brand pills -->
			<div class="mt-6 flex flex-wrap gap-3">
				{#each [
					{ brand:'NVIDIA', models:6, color:'#76b900' },
					{ brand:'AMD',    models:5, color:'#ED1C24' },
					{ brand:'Intel',  models:3, color:'#0071C5' }
				] as b}
					<div class="flex items-center gap-2 rounded-full border px-4 py-1.5"
						 style="border-color:{b.color}30;background:{b.color}08">
						<div class="h-2 w-2 rounded-full" style="background:{b.color}"></div>
						<span class="text-xs font-black text-white/60">{b.brand}</span>
						<span class="text-[10px] text-white/25">{b.models} GPUs</span>
					</div>
				{/each}
			</div>
		</div>

		<!-- ── BEST PICKS ────────────────────────────────────────── -->
		<div class="mb-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4" in:fly={{ y: 16, duration: 450, delay: 80 }}>
			{#each PICKS as pick (pick.label)}
				{@const gpu = GPUS.find(g => g.name === pick.name)}
				<div class="rounded-2xl border border-white/6 bg-[#0f0f0f] p-4 transition-all hover:border-white/12">
					<div class="mb-2 flex items-center justify-between">
						<span class="text-[9px] font-black uppercase tracking-widest text-white/25">{pick.label}</span>
						<span class="text-lg">{pick.icon}</span>
					</div>
					<p class="mb-1 font-black text-white">{pick.name}</p>
					<p class="mb-2 text-[10px] text-white/35 leading-relaxed">{pick.reason}</p>
					<div class="flex items-center justify-between">
						<span class="text-sm font-black" style="color:{BRAND_COLOR[gpu.brand]}">${gpu.msrp.toLocaleString()}</span>
						<span class="rounded-full px-2 py-0.5 text-[8px] font-black {TIER_COLOR[gpu.tier]} border border-white/8">{TIER_LABEL[gpu.tier]}</span>
					</div>
				</div>
			{/each}
		</div>

		<!-- ── BENCHMARK CHART ───────────────────────────────────── -->
		<div class="mb-10 rounded-2xl border border-white/6 bg-[#0f0f0f] p-6" in:fly={{ y: 16, duration: 450, delay: 120 }}>
			<div class="mb-5 flex flex-wrap items-center justify-between gap-3">
				<div>
					<p class="text-[10px] font-black uppercase tracking-widest text-white/25">Benchmark Comparison</p>
					<p class="text-[10px] text-white/15">Top 6 GPUs · relative scores</p>
				</div>
				<div class="flex gap-1">
					{#each BENCH_METRICS as m (m.key)}
						<button onclick={() => benchMetric = m.key}
							class="rounded-full px-3 py-1 text-[10px] font-black transition-all
								   {benchMetric === m.key ? 'bg-white text-black' : 'border border-white/8 text-white/30 hover:text-white'}">
							{m.label}
						</button>
					{/each}
				</div>
			</div>

			<div class="space-y-3">
				{#each benchData as g, i (g.id)}
					<div class="flex items-center gap-4" in:fly={{ x: -16, duration: 300, delay: i*40 }}>
						<!-- label -->
						<div class="w-36 shrink-0 text-right">
							<p class="text-xs font-black text-white/70">{g.name}</p>
							<p class="text-[9px]" style="color:{BRAND_COLOR[g.brand]}">{g.brand}</p>
						</div>
						<!-- bar -->
						<div class="relative flex-1 h-8 overflow-hidden rounded-full bg-white/4">
							<div class="absolute inset-y-0 left-0 flex items-center rounded-full transition-all duration-700"
								 style="width:{g.pct}%;background:linear-gradient(90deg,{BRAND_COLOR[g.brand]}cc,{BRAND_COLOR[g.brand]})">
							</div>
							<!-- rank badge -->
							{#if i === 0}
								<div class="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-yellow-400 px-2 py-0.5 text-[8px] font-black text-black">🥇 #1</div>
							{/if}
						</div>
						<!-- value -->
						<div class="w-16 shrink-0">
							<p class="text-sm font-black" style="color:{BRAND_COLOR[g.brand]}">
								{benchMetric === 'tflops' ? g.tflops : g[benchMetric]}
								<span class="text-[9px] text-white/25">{benchMetric === 'tflops' ? 'TF' : '%'}</span>
							</p>
						</div>
					</div>
				{/each}
			</div>
		</div>

		<!-- ── FILTERS + GRID ────────────────────────────────────── -->
		<div class="mb-5 flex flex-wrap items-center gap-3" in:fly={{ y: 12, duration: 400, delay: 160 }}>
			<!-- brand -->
			<div class="flex gap-1">
				{#each BRANDS as b (b)}
					<button onclick={() => brandFilter = b}
						class="rounded-full border px-3 py-1 text-[10px] font-black transition-all
							   {brandFilter === b
							     ? b === 'All' ? 'bg-white text-black border-white' : ''
							     : 'border-white/8 text-white/30 hover:text-white'}"
						style={brandFilter === b && b !== 'All'
							? `background:${BRAND_COLOR[b]};border-color:${BRAND_COLOR[b]};color:${b === 'AMD' ? 'white' : 'black'}`
							: ''}>
						{b}
					</button>
				{/each}
			</div>

			<div class="h-4 w-px bg-white/10"></div>

			<!-- use case -->
			<div class="flex flex-wrap gap-1">
				{#each USES as u (u.key)}
					<button onclick={() => useFilter = u.key}
						class="rounded-full border px-3 py-1 text-[10px] font-black transition-all
							   {useFilter === u.key ? 'border-white/30 bg-white/10 text-white' : 'border-white/5 text-white/25 hover:text-white'}">
						{u.label}
					</button>
				{/each}
			</div>

			<div class="ml-auto flex items-center gap-2">
				<span class="text-[9px] text-white/20">Sort:</span>
				{#each SORTS as s (s.key)}
					<button onclick={() => sortKey = s.key}
						class="text-[9px] font-black transition-colors
							   {sortKey === s.key ? 'text-white' : 'text-white/20 hover:text-white/50'}">
						{s.label}
					</button>
				{/each}
			</div>
		</div>

		<p class="mb-4 text-[10px] text-white/15">{visible.length} GPU{visible.length !== 1 ? 's' : ''}</p>

		<!-- GPU CARDS GRID -->
		<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
			{#each visible as gpu, i (gpu.id)}
				<div class="group relative flex flex-col overflow-hidden rounded-2xl border bg-[#0f0f0f] transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
					 style="border-color:{BRAND_BORDER[gpu.brand]}"
					 in:fly={{ y: 20, duration: 300, delay: i*40 }}>

					<!-- brand color top bar -->
					<div class="h-[3px]" style="background:linear-gradient(90deg,transparent,{BRAND_COLOR[gpu.brand]},transparent)"></div>

					<!-- cover area -->
					<div class="relative flex h-36 flex-col items-center justify-center gap-1 overflow-hidden"
						 style="background:linear-gradient(145deg,{BRAND_BG[gpu.brand]},transparent)">

						<!-- big brand letter watermark -->
						<div class="absolute inset-0 flex items-center justify-center select-none pointer-events-none">
							<span class="text-[120px] font-black leading-none opacity-[0.04]" style="color:{BRAND_COLOR[gpu.brand]}">{gpu.brand[0]}</span>
						</div>

						<p class="relative text-[10px] font-black uppercase tracking-widest" style="color:{BRAND_COLOR[gpu.brand]}">{gpu.brand} · {gpu.arch}</p>
						<p class="relative text-xl font-black text-white">{gpu.name}</p>

						<!-- tier badge -->
						<span class="relative rounded-full border border-white/8 bg-black/40 px-2.5 py-0.5 text-[9px] font-black {TIER_COLOR[gpu.tier]} backdrop-blur-sm">
							{TIER_LABEL[gpu.tier]}
						</span>

						<!-- availability -->
						<div class="absolute top-3 right-3">
							<span class="rounded-full px-2 py-0.5 text-[8px] font-black
								{gpu.avail==='Good'    ? 'bg-[#76b900]/15 text-[#76b900]' :
								 gpu.avail==='Low'     ? 'bg-orange-500/15 text-orange-400' :
								 gpu.avail==='Scarce'  ? 'bg-red-500/15 text-red-400' :
								 gpu.avail==='Soon'    ? 'bg-sky-500/15 text-sky-400' :
								                         'bg-purple-500/15 text-purple-400'}">
								{gpu.avail}
							</span>
						</div>
					</div>

					<!-- specs -->
					<div class="flex-1 p-4">
						<!-- key specs row -->
						<div class="mb-4 grid grid-cols-3 gap-2">
							{#each [
								{ l:'VRAM',   v:`${gpu.vram}GB`                   },
								{ l:'TDP',    v:`${gpu.tdp}W`                      },
								{ l:'Node',   v:gpu.node.split(' ')[0]             }
							] as s (s.l)}
								<div class="rounded-lg border border-white/5 bg-white/3 p-2 text-center">
									<p class="text-[8px] uppercase tracking-widest text-white/20">{s.l}</p>
									<p class="text-[11px] font-black text-white">{s.v}</p>
								</div>
							{/each}
						</div>

						<!-- performance bars -->
						<div class="mb-4 space-y-2">
							{#each [
								{ l:'Gaming',   v:gpu.gaming },
								{ l:'AI/ML',    v:gpu.ai     },
								{ l:'RT',       v:gpu.rt     }
							] as bar (bar.l)}
								<div class="flex items-center gap-2">
									<span class="w-10 text-[9px] text-white/25">{bar.l}</span>
									<div class="h-1.5 flex-1 overflow-hidden rounded-full bg-white/5">
										<div class="h-full rounded-full transition-all duration-700"
											 style="width:{bar.v}%;background:{BRAND_COLOR[gpu.brand]}"></div>
									</div>
									<span class="w-7 text-right text-[9px] font-black text-white/40">{bar.v}</span>
								</div>
							{/each}
						</div>

						<!-- tflops -->
						<div class="mb-4 rounded-xl border border-white/5 bg-white/3 p-3 text-center">
							<p class="text-[8px] uppercase tracking-widest text-white/20">AI TFLOPS (FP8)</p>
							<p class="text-lg font-black" style="color:{BRAND_COLOR[gpu.brand]}">{gpu.tflops}</p>
						</div>

						<!-- price row -->
						<div class="flex items-center justify-between border-t border-white/5 pt-3">
							<div>
								<p class="text-[8px] uppercase tracking-widest text-white/20">MSRP</p>
								<p class="text-lg font-black text-white">${gpu.msrp.toLocaleString()}</p>
							</div>
							<!-- value score (perf/$) -->
							<div class="text-right">
								<p class="text-[8px] uppercase tracking-widest text-white/20">Value</p>
								<p class="text-sm font-black" style="color:{BRAND_COLOR[gpu.brand]}">
									{(gpu.gaming / (gpu.msrp / 100)).toFixed(1)}
									<span class="text-[8px] text-white/20">pts/$100</span>
								</p>
							</div>
						</div>
					</div>
				</div>
			{/each}
		</div>

		<!-- ── SPECS COMPARISON TABLE ─────────────────────────────── -->
		<div class="mt-10 overflow-hidden rounded-2xl border border-white/6 bg-[#0f0f0f]" in:fly={{ y: 20, duration: 450, delay: 200 }}>
			<div class="border-b border-white/5 px-6 py-4">
				<p class="text-[10px] font-black uppercase tracking-widest text-white/25">Full Specs Table</p>
			</div>
			<div class="overflow-x-auto">
				<table class="w-full text-xs">
					<thead>
						<tr class="border-b border-white/5">
							{#each ['GPU','Brand','MSRP','VRAM','TFLOPS','TDP','Gaming','AI','RT','Avail'] as col (col)}
								<th class="px-4 py-3 text-left text-[9px] font-black uppercase tracking-widest text-white/20">{col}</th>
							{/each}
						</tr>
					</thead>
					<tbody>
						{#each visible as g, i (g.id)}
							<tr class="border-b border-white/3 transition-colors hover:bg-white/2 {i % 2 === 0 ? '' : 'bg-white/[0.015]'}">
								<td class="px-4 py-3 font-black text-white">{g.name}</td>
								<td class="px-4 py-3 font-bold" style="color:{BRAND_COLOR[g.brand]}">{g.brand}</td>
								<td class="px-4 py-3 font-bold text-white">${g.msrp.toLocaleString()}</td>
								<td class="px-4 py-3 text-white/60">{g.vram} GB</td>
								<td class="px-4 py-3 font-bold" style="color:{BRAND_COLOR[g.brand]}">{g.tflops}</td>
								<td class="px-4 py-3 text-white/40">{g.tdp}W</td>
								<td class="px-4 py-3 text-white/60">{g.gaming}/100</td>
								<td class="px-4 py-3 text-white/60">{g.ai}/100</td>
								<td class="px-4 py-3 text-white/60">{g.rt}/100</td>
								<td class="px-4 py-3">
									<span class="rounded-full px-2 py-0.5 text-[8px] font-black
										{g.avail==='Good'    ? 'bg-[#76b900]/15 text-[#76b900]' :
										 g.avail==='Low'     ? 'bg-orange-500/15 text-orange-400' :
										 g.avail==='Scarce'  ? 'bg-red-500/15 text-red-400' :
										 g.avail==='Soon'    ? 'bg-sky-500/15 text-sky-400' :
										                       'bg-purple-500/15 text-purple-400'}">
										{g.avail}
									</span>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>

	</div>
</div>

<style>
	@keyframes marquee {
		from { transform: translateX(0); }
		to   { transform: translateX(-50%); }
	}
</style>
