<script>
	import { onMount } from 'svelte';
	import { fly, fade, scale } from 'svelte/transition';
	import { elasticOut, cubicOut } from 'svelte/easing';

	// ── countdown ──────────────────────────────────────────────
	let countdown = $state({ days: 0, hours: 0, mins: 0, secs: 0 });
	const TARGET = new Date('2026-04-20T00:00:00');

	function tick() {
		const diff = TARGET - Date.now();
		if (diff <= 0) { countdown = { days: 0, hours: 0, mins: 0, secs: 0 }; return; }
		countdown = {
			days:  Math.floor(diff / 86400000),
			hours: Math.floor((diff % 86400000) / 3600000),
			mins:  Math.floor((diff % 3600000)  / 60000),
			secs:  Math.floor((diff % 60000)    / 1000)
		};
	}

	// ── eligibility checker ────────────────────────────────────
	let wallet    = $state('');
	let checking  = $state(false);
	let result    = $state(null); // null | { eligible, amount, tier }
	let scanLine  = $state(0);

	const TIERS = [
		{ id: 'degen',   label: 'Degen',   emoji: '🥉', color: 'from-orange-500 to-amber-600',   glow: 'shadow-orange-500/30',  border: 'border-orange-500/40',  min: 1_000,    max: 9_999  },
		{ id: 'catoshi', label: 'Catoshi', emoji: '🥈', color: 'from-slate-300 to-slate-500',    glow: 'shadow-slate-400/30',   border: 'border-slate-400/40',   min: 10_000,   max: 99_999 },
		{ id: 'jamgod',  label: 'JamGod',  emoji: '🥇', color: 'from-yellow-400 to-amber-500',   glow: 'shadow-yellow-400/40',  border: 'border-yellow-400/40',  min: 100_000,  max: 999_999 }
	];

	async function checkEligibility() {
		if (!wallet.trim()) return;
		result   = null;
		checking = true;
		scanLine = 0;

		// fake scan animation
		const scanInterval = setInterval(() => { scanLine = (scanLine + 2) % 100; }, 30);
		await new Promise(r => setTimeout(r, 2200));
		clearInterval(scanInterval);
		checking = false;

		// deterministic mock: if address > 30 chars → eligible
		const eligible = wallet.trim().length >= 32;
		if (eligible) {
			const tierIdx = wallet.length % 3;
			const tier    = TIERS[tierIdx];
			const amount  = Math.floor(Math.random() * (tier.max - tier.min) + tier.min);
			result = { eligible: true, amount, tier };
		} else {
			result = { eligible: false };
		}
	}

	// ── tasks ──────────────────────────────────────────────────
	const TASKS = [
		{ id: 'twitter',  label: 'Follow @JamCatAI on X',          reward: 500,    emoji: '🐦', done: false },
		{ id: 'discord',  label: 'Join the JamCat Discord',         reward: 750,    emoji: '💬', done: false },
		{ id: 'launch',   label: 'Launch a token on Jam.fun',       reward: 5_000,  emoji: '🚀', done: false },
		{ id: 'play',     label: 'Score 1,000 pts in the tap game', reward: 1_500,  emoji: '🎮', done: false },
		{ id: 'refer',    label: 'Refer 3 frens',                   reward: 10_000, emoji: '🫂', done: false },
		{ id: 'hold',     label: 'Hold $JAM for 7 days',            reward: 2_500,  emoji: '💎', done: false }
	];

	let tasks = $state(TASKS.map(t => ({ ...t })));
	let taskToast = $state('');

	function toggleTask(id) {
		tasks = tasks.map(t => {
			if (t.id !== id) return t;
			const now = !t.done;
			taskToast = now ? `+${t.reward.toLocaleString()} $JAM earned! 🎉` : '';
			if (now) setTimeout(() => taskToast = '', 2500);
			return { ...t, done: now };
		});
	}

	let totalEarned = $derived(tasks.filter(t => t.done).reduce((s, t) => s + t.reward, 0));

	// ── referral ───────────────────────────────────────────────
	let refWallet  = $state('');
	let refLink    = $state('');
	let refCount   = $state(Math.floor(Math.random() * 8));
	let refBonus   = $derived(refCount * 2000);
	let copied     = $state(false);

	function generateRef() {
		if (!refWallet.trim()) return;
		refLink = `https://jamcat.ai/airdrop?ref=${btoa(refWallet.trim()).slice(0, 12)}`;
	}

	function copyRef() {
		if (!refLink) return;
		navigator.clipboard.writeText(refLink).catch(() => {});
		copied = true;
		setTimeout(() => copied = false, 2000);
	}

	// ── live feed ──────────────────────────────────────────────
	const NAMES   = ['SolDegen','PinkPaw','CatWif','JamBandit','MoonKitty','DegenApе','LamboFur','WhiskerDAO','PounceCat','PurrFi'];
	const AMOUNTS = [1_200, 5_000, 8_400, 12_500, 25_000, 3_750, 99_000, 420, 7_777, 50_000];

	let feed = $state(
		Array.from({ length: 8 }, () => ({
			name:   NAMES[Math.floor(Math.random() * NAMES.length)],
			amount: AMOUNTS[Math.floor(Math.random() * AMOUNTS.length)],
			ago:    Math.floor(Math.random() * 59) + 1,
			id:     Math.random()
		}))
	);

	function pushFeed() {
		feed = [
			{
				name:   NAMES[Math.floor(Math.random() * NAMES.length)],
				amount: AMOUNTS[Math.floor(Math.random() * AMOUNTS.length)],
				ago:    0,
				id:     Math.random()
			},
			...feed.slice(0, 9)
		];
	}

	// ── stats bar ──────────────────────────────────────────────
	let claimed     = $state(142_069_420);
	let claimers    = $state(38_441);
	let totalPool   = 420_000_000;
	let claimPct    = $derived(Math.round((claimed / totalPool) * 100));

	onMount(() => {
		tick();
		const intervals = [
			setInterval(tick, 1000),
			setInterval(pushFeed, 3000),
			setInterval(() => {
				const delta = Math.floor(Math.random() * 8000 + 2000);
				claimed  += delta;
				claimers += Math.floor(Math.random() * 3);
			}, 4000)
		];
		return () => intervals.forEach(clearInterval);
	});

	const ticker = '🪂 AIRDROP SEASON 1 IS LIVE · CLAIM BEFORE APRIL 20 · 420,000,000 $JAM TO DISTRIBUTE · TOP HOLDERS GET JAMGOD STATUS · WEN AIRDROP? NOW · ';
</script>

<!-- ═══════════════════════  TICKER  ═══════════════════════ -->
<div class="border-b border-white/5 bg-black/40 py-2.5 backdrop-blur-xl overflow-hidden">
	<div class="flex whitespace-nowrap" style="animation: marquee 35s linear infinite;">
		{#each [ticker, ticker] as t}
			<span class="mr-0 text-[10px] font-black uppercase tracking-[0.3em]"
				  style="color:#ff4ecd">{t}</span>
		{/each}
	</div>
</div>

<!-- ═══════════════════════  PAGE  ═══════════════════════ -->
<div class="relative min-h-screen overflow-hidden bg-[#09090f]">

	<!-- ambient orbs -->
	<div class="pointer-events-none absolute inset-0 overflow-hidden">
		<div class="absolute -top-40 left-1/4  h-[500px] w-[500px] rounded-full opacity-20 blur-[120px]"
			 style="background:radial-gradient(circle,#ff4ecd,transparent 70%)"></div>
		<div class="absolute top-1/3  right-0    h-[400px] w-[400px] rounded-full opacity-15 blur-[100px]"
			 style="background:radial-gradient(circle,#a855f7,transparent 70%)"></div>
		<div class="absolute bottom-20 left-0    h-[350px] w-[350px] rounded-full opacity-10 blur-[90px]"
			 style="background:radial-gradient(circle,#06b6d4,transparent 70%)"></div>
	</div>

	<div class="relative mx-auto max-w-7xl px-4 py-12">

		<!-- ──────────────── HERO ──────────────── -->
		<div class="mb-14 text-center" in:fly={{ y: -30, duration: 600 }}>
			<div class="mb-4 inline-flex items-center gap-2 rounded-full border border-pink-500/30 bg-pink-500/10 px-4 py-1.5">
				<span class="relative flex h-2 w-2">
					<span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-pink-400 opacity-75"></span>
					<span class="relative inline-flex h-2 w-2 rounded-full bg-pink-500"></span>
				</span>
				<span class="text-[11px] font-black uppercase tracking-widest text-pink-400">🪂 Season 1 · Live Now</span>
			</div>

			<h1 class="mb-3 text-6xl font-black tracking-tighter sm:text-8xl">
				<span class="bg-gradient-to-r from-[#ff4ecd] via-fuchsia-400 to-violet-400 bg-clip-text text-transparent">
					JamCat
				</span>
				<span class="text-white"> Airdrop</span>
			</h1>

			<p class="mx-auto mb-8 max-w-lg text-base text-white/50">
				420,000,000 <span class="font-black text-pink-400">$JAM</span> dropping to the most degenerate cats on Solana. wen claim? <span class="font-bold text-white">right meow.</span>
			</p>

			<!-- countdown -->
			<div class="mb-10 inline-flex gap-3">
				{#each [
					{ val: countdown.days,  label: 'days'  },
					{ val: countdown.hours, label: 'hours' },
					{ val: countdown.mins,  label: 'mins'  },
					{ val: countdown.secs,  label: 'secs'  }
				] as unit}
					<div class="flex flex-col items-center rounded-2xl border border-white/10 bg-white/5 px-5 py-3 backdrop-blur-xl min-w-[70px]">
						<span class="text-3xl font-black tabular-nums text-white">{String(unit.val).padStart(2,'0')}</span>
						<span class="text-[10px] font-bold uppercase tracking-widest text-white/30">{unit.label}</span>
					</div>
				{/each}
			</div>

			<!-- global progress bar -->
			<div class="mx-auto max-w-lg">
				<div class="mb-2 flex justify-between text-xs text-white/40">
					<span>🔥 {claimed.toLocaleString()} $JAM claimed</span>
					<span>{claimPct}% · {claimers.toLocaleString()} wallets</span>
				</div>
				<div class="h-3 overflow-hidden rounded-full bg-white/5 shadow-inner">
					<div class="h-full rounded-full transition-all duration-1000"
						 style="width:{claimPct}%;background:linear-gradient(90deg,#ff4ecd,#a855f7)"></div>
				</div>
				<p class="mt-1.5 text-[10px] text-white/25 uppercase tracking-widest">{totalPool.toLocaleString()} $JAM total pool · ends apr 20 2026</p>
			</div>
		</div>

		<!-- ──────────────── MAIN GRID ──────────────── -->
		<div class="grid gap-6 lg:grid-cols-3">

			<!-- LEFT COL (eligibility + tiers + tasks) -->
			<div class="space-y-6 lg:col-span-2">

				<!-- ELIGIBILITY CHECKER -->
				<div class="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl" in:fly={{ x: -30, duration: 500, delay: 100 }}>
					<h2 class="mb-1 text-lg font-black text-white">🔍 Check Your Eligibility</h2>
					<p class="mb-5 text-sm text-white/40">Paste your Solana wallet address to see if you qualify.</p>

					<div class="flex gap-3">
						<input
							bind:value={wallet}
							placeholder="Enter Solana wallet address..."
							onkeydown={(e) => e.key === 'Enter' && checkEligibility()}
							class="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/20 outline-none ring-0 transition focus:border-pink-500/50 focus:ring-1 focus:ring-pink-500/30"
						/>
						<button
							onclick={checkEligibility}
							disabled={checking || !wallet.trim()}
							class="rounded-xl px-5 py-3 text-sm font-black transition-all duration-200 disabled:opacity-40
								   bg-gradient-to-r from-pink-500 to-fuchsia-600 text-white shadow-lg shadow-pink-500/30
								   hover:scale-105 hover:shadow-pink-500/50 active:scale-95"
						>
							{checking ? '⏳ Scanning…' : 'Check →'}
						</button>
					</div>

					<!-- scan animation -->
					{#if checking}
						<div class="mt-4 overflow-hidden rounded-xl border border-pink-500/20 bg-black/30 p-4">
							<div class="mb-2 flex items-center gap-2">
								<span class="animate-spin text-sm">⚙️</span>
								<span class="text-xs font-black uppercase tracking-widest text-pink-400">Scanning on-chain data…</span>
							</div>
							<div class="h-1.5 overflow-hidden rounded-full bg-white/5">
								<div class="h-full rounded-full bg-gradient-to-r from-pink-500 to-fuchsia-500 transition-all duration-75"
									 style="width:{scanLine}%"></div>
							</div>
							<div class="mt-2 space-y-1">
								{#each ['Checking token holdings…','Verifying trade history…','Calculating reward tier…'] as step, i}
									<p class="text-[10px] text-white/30" style="animation-delay:{i*600}ms">
										<span class="text-pink-400">›</span> {step}
									</p>
								{/each}
							</div>
						</div>
					{/if}

					<!-- result -->
					{#if result}
						{#if result.eligible}
							<div class="mt-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5"
								 in:scale={{ duration: 400, easing: elasticOut }}>
								<div class="flex items-start justify-between gap-4">
									<div>
										<p class="text-xs font-black uppercase tracking-widest text-emerald-400">✅ Eligible!</p>
										<p class="mt-1 text-4xl font-black text-white">
											{result.amount.toLocaleString()}
											<span class="text-2xl text-pink-400">$JAM</span>
										</p>
										<p class="text-sm text-white/40">Your allocation for Season 1</p>
									</div>
									<div class="rounded-2xl border {result.tier.border} bg-gradient-to-br {result.tier.color} px-4 py-2 text-center shadow-xl {result.tier.glow}">
										<span class="text-2xl">{result.tier.emoji}</span>
										<p class="text-xs font-black text-white">{result.tier.label}</p>
									</div>
								</div>
								<button class="mt-4 w-full rounded-xl bg-gradient-to-r from-pink-500 to-fuchsia-600 py-3 text-sm font-black text-white shadow-lg shadow-pink-500/30 transition hover:scale-[1.02] hover:shadow-pink-500/50">
									🪂 Claim {result.amount.toLocaleString()} $JAM
								</button>
							</div>
						{:else}
							<div class="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 p-5"
								 in:scale={{ duration: 400, easing: elasticOut }}>
								<p class="text-sm font-black text-red-400">❌ Not eligible yet.</p>
								<p class="mt-1 text-xs text-white/40">This wallet doesn't qualify for Season 1. Complete tasks below to earn $JAM for Season 2!</p>
							</div>
						{/if}
					{/if}
				</div>

				<!-- TIERS -->
				<div in:fly={{ x: -30, duration: 500, delay: 200 }}>
					<h2 class="mb-4 text-lg font-black text-white">🏅 Reward Tiers</h2>
					<div class="grid gap-4 sm:grid-cols-3">
						{#each TIERS as tier}
							<div class="group relative overflow-hidden rounded-3xl border {tier.border} bg-white/5 p-5 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl {tier.glow}">
								<div class="absolute -right-4 -top-4 text-6xl opacity-10 transition-all duration-300 group-hover:scale-125 group-hover:opacity-20">{tier.emoji}</div>
								<div class="relative">
									<span class="text-3xl">{tier.emoji}</span>
									<p class="mt-2 text-lg font-black text-white">{tier.label}</p>
									<p class="text-xs text-white/40">{tier.min.toLocaleString()} – {tier.max.toLocaleString()} $JAM</p>
									<div class="mt-3 h-1 rounded-full bg-white/5">
										<div class="h-full rounded-full bg-gradient-to-r {tier.color}" style="width:{tier.id==='degen'?45:tier.id==='catoshi'?30:25}%"></div>
									</div>
									<p class="mt-1 text-[10px] text-white/20">{tier.id==='degen'?'45%':tier.id==='catoshi'?'30%':'25%'} of claimers</p>
								</div>
							</div>
						{/each}
					</div>
				</div>

				<!-- TASKS -->
				<div class="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl" in:fly={{ x: -30, duration: 500, delay: 300 }}>
					<div class="mb-5 flex items-center justify-between">
						<div>
							<h2 class="text-lg font-black text-white">⚡ Boost Your Allocation</h2>
							<p class="text-sm text-white/40">Complete tasks to earn more $JAM for Season 2</p>
						</div>
						{#if totalEarned > 0}
							<div class="rounded-xl border border-pink-500/30 bg-pink-500/10 px-3 py-1.5" in:scale={{ duration: 300 }}>
								<p class="text-[10px] font-black uppercase tracking-widest text-pink-400">earned</p>
								<p class="text-lg font-black text-white">+{totalEarned.toLocaleString()}</p>
							</div>
						{/if}
					</div>

					<div class="space-y-3">
						{#each tasks as task (task.id)}
							<button
								onclick={() => toggleTask(task.id)}
								class="group flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition-all duration-200
									   {task.done
									     ? 'border-pink-500/30 bg-pink-500/10 hover:bg-pink-500/15'
									     : 'border-white/5 bg-white/3 hover:border-white/10 hover:bg-white/5'}"
							>
								<span class="text-xl">{task.emoji}</span>
								<div class="flex-1">
									<p class="text-sm font-bold {task.done ? 'text-white line-through opacity-60' : 'text-white'}">{task.label}</p>
									<p class="text-xs text-white/30">+{task.reward.toLocaleString()} $JAM</p>
								</div>
								<div class="flex h-6 w-6 items-center justify-center rounded-full border-2 transition-all duration-200
									   {task.done ? 'border-pink-500 bg-pink-500' : 'border-white/20 group-hover:border-white/40'}">
									{#if task.done}
										<span class="text-[10px] text-white" in:scale={{ duration: 200 }}>✓</span>
									{/if}
								</div>
							</button>
						{/each}
					</div>
				</div>

			</div>

			<!-- RIGHT COL (referral + live feed) -->
			<div class="space-y-6">

				<!-- REFERRAL -->
				<div class="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl" in:fly={{ x: 30, duration: 500, delay: 150 }}>
					<h2 class="mb-1 text-lg font-black text-white">🫂 Refer Frens</h2>
					<p class="mb-5 text-xs text-white/40">Earn 2,000 $JAM per referral. No cap.</p>

					<input
						bind:value={refWallet}
						placeholder="Your wallet address…"
						oninput={generateRef}
						class="mb-3 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/20 outline-none focus:border-pink-500/50 focus:ring-1 focus:ring-pink-500/30"
					/>

					{#if refLink}
						<div class="mb-3 overflow-hidden rounded-xl border border-white/10 bg-black/40 p-3" in:fade>
							<p class="truncate text-xs text-pink-300">{refLink}</p>
						</div>
					{/if}

					<button
						onclick={copyRef}
						disabled={!refLink}
						class="w-full rounded-xl py-3 text-sm font-black transition-all duration-200 disabled:opacity-30
							   {copied
							     ? 'border border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
							     : 'bg-white/10 text-white hover:bg-white/15'}"
					>
						{copied ? '✅ Copied!' : '📋 Copy Link'}
					</button>

					<div class="mt-5 grid grid-cols-2 gap-3">
						<div class="rounded-2xl border border-white/5 bg-white/3 p-3 text-center">
							<p class="text-2xl font-black text-white">{refCount}</p>
							<p class="text-[10px] text-white/30 uppercase tracking-widest">refs</p>
						</div>
						<div class="rounded-2xl border border-pink-500/20 bg-pink-500/5 p-3 text-center">
							<p class="text-2xl font-black text-pink-400">{refBonus.toLocaleString()}</p>
							<p class="text-[10px] text-white/30 uppercase tracking-widest">$JAM bonus</p>
						</div>
					</div>
				</div>

				<!-- LIVE FEED -->
				<div class="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl" in:fly={{ x: 30, duration: 500, delay: 250 }}>
					<div class="mb-4 flex items-center gap-2">
						<span class="relative flex h-2 w-2">
							<span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-pink-400 opacity-75"></span>
							<span class="relative inline-flex h-2 w-2 rounded-full bg-pink-500"></span>
						</span>
						<h2 class="text-sm font-black uppercase tracking-widest text-white">Live Claims</h2>
					</div>

					<div class="space-y-2 overflow-hidden">
						{#each feed as entry (entry.id)}
							<div class="flex items-center justify-between rounded-xl border border-white/5 bg-white/3 px-3 py-2"
								 in:fly={{ x: 20, duration: 300 }}>
								<div class="flex items-center gap-2">
									<span class="text-sm">🐱</span>
									<span class="text-xs font-bold text-white/70">{entry.name}</span>
								</div>
								<div class="text-right">
									<p class="text-xs font-black text-pink-400">+{entry.amount.toLocaleString()} $JAM</p>
									<p class="text-[10px] text-white/20">{entry.ago === 0 ? 'just now' : `${entry.ago}s ago`}</p>
								</div>
							</div>
						{/each}
					</div>
				</div>

				<!-- FAQ -->
				<div class="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl" in:fly={{ x: 30, duration: 500, delay: 350 }}>
					<h2 class="mb-4 text-sm font-black uppercase tracking-widest text-white">❓ Quick FAQ</h2>
					<div class="space-y-3 text-xs text-white/40">
						<div>
							<p class="font-bold text-white/70">Wen claim?</p>
							<p>Claiming is live now. Window closes Apr 20 2026.</p>
						</div>
						<div>
							<p class="font-bold text-white/70">Which chain?</p>
							<p>Solana. You need a Phantom or Backpack wallet.</p>
						</div>
						<div>
							<p class="font-bold text-white/70">Unclaimed tokens?</p>
							<p>Unclaimed $JAM gets burned. Don't miss out fren 🔥</p>
						</div>
					</div>
				</div>

			</div>
		</div>
	</div>
</div>

<!-- TASK TOAST -->
{#if taskToast}
	<div class="fixed bottom-8 left-1/2 -translate-x-1/2 z-50"
		 in:fly={{ y: 20, duration: 300 }} out:fade>
		<div class="rounded-full border border-pink-500/30 bg-black/80 px-6 py-3 text-sm font-black text-pink-400 shadow-2xl backdrop-blur-xl">
			{taskToast}
		</div>
	</div>
{/if}
