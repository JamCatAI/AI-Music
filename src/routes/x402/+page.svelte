<svelte:head>
	<title>x402 | AI Agent Micropayments</title>
	<meta name="description" content="Autonomous AI agents that pay their own way via x402 HTTP micropayments on Solana." />
</svelte:head>

<script>
	import { onMount } from 'svelte';

	const services = [
		{ name: 'LLM Inference',      cost: 0.0018, icon: '🧠', category: 'AI/ML' },
		{ name: 'Image Generation',   cost: 0.0024, icon: '🎨', category: 'AI/ML' },
		{ name: 'Music Synthesis',    cost: 0.0031, icon: '🎵', category: 'AI/ML' },
		{ name: 'Web Scrape',         cost: 0.0006, icon: '🕸️', category: 'Data' },
		{ name: 'Data Index',         cost: 0.0009, icon: '📊', category: 'Data' },
		{ name: 'Contract Audit',     cost: 0.0042, icon: '📝', category: 'Blockchain' },
		{ name: 'Vector Search',      cost: 0.0007, icon: '🔍', category: 'Data' },
		{ name: 'Code Execution',     cost: 0.0015, icon: '⚙️', category: 'AI/ML' },
		{ name: 'Sentiment Analysis', cost: 0.0005, icon: '📡', category: 'AI/ML' },
		{ name: 'On-chain Tx',        cost: 0.0008, icon: '⛓️', category: 'Blockchain' },
	];

	const taskPool = [
		'Composing a 16-bar hook via WaveNet',
		'Scraping top Solana memes for training',
		'Auditing $JAM liquidity pool contract',
		'Generating album art for Beat Drop token',
		'Indexing DexScreener price feed',
		'Analyzing sentiment on 1,240 tweets',
		'Fine-tuning music genre classifier',
		'Synthesizing lo-fi drum loop',
		'Fetching Birdeye price feeds',
		'Running A/B test on melody variants',
		'Embedding 4,800 lyrics into vector DB',
		'Deploying bonding curve parameters',
		'Downloading Spotify top-200 metadata',
		'Generating 50 social media captions',
		'Optimizing MIDI velocity curves',
		'Cross-referencing NFT holder wallets',
		'Training reward model on listen data',
		'Writing royalty-split smart contract',
		'Fetching Pump.fun new launches',
		'Summarizing whitepaper to agent memory',
	];

	const statusCycle = ['running','running','running','paying','running','running','waiting','running','running','paying'];

	const agentColors = [
		{ ring: 'ring-cyan-400',   text: 'text-cyan-400',   bg: 'bg-cyan-400/10',   border: 'border-cyan-400/30',   glow: 'shadow-[0_0_20px_rgba(34,211,238,0.3)]',   bar: 'bg-cyan-400'   },
		{ ring: 'ring-green-400',  text: 'text-green-400',  bg: 'bg-green-400/10',  border: 'border-green-400/30',  glow: 'shadow-[0_0_20px_rgba(74,222,128,0.3)]',   bar: 'bg-green-400'  },
		{ ring: 'ring-purple-400', text: 'text-purple-400', bg: 'bg-purple-400/10', border: 'border-purple-400/30', glow: 'shadow-[0_0_20px_rgba(192,132,252,0.3)]', bar: 'bg-purple-400' },
		{ ring: 'ring-pink-400',   text: 'text-pink-400',   bg: 'bg-pink-400/10',   border: 'border-pink-400/30',   glow: 'shadow-[0_0_20px_rgba(244,114,182,0.3)]',  bar: 'bg-pink-400'   },
		{ ring: 'ring-amber-400',  text: 'text-amber-400',  bg: 'bg-amber-400/10',  border: 'border-amber-400/30',  glow: 'shadow-[0_0_20px_rgba(251,191,36,0.3)]',   bar: 'bg-amber-400'  },
		{ ring: 'ring-sky-400',    text: 'text-sky-400',    bg: 'bg-sky-400/10',    border: 'border-sky-400/30',    glow: 'shadow-[0_0_20px_rgba(56,189,248,0.3)]',   bar: 'bg-sky-400'    },
		{ ring: 'ring-rose-400',   text: 'text-rose-400',   bg: 'bg-rose-400/10',   border: 'border-rose-400/30',   glow: 'shadow-[0_0_20px_rgba(251,113,133,0.3)]',  bar: 'bg-rose-400'   },
		{ ring: 'ring-teal-400',   text: 'text-teal-400',   bg: 'bg-teal-400/10',   border: 'border-teal-400/30',   glow: 'shadow-[0_0_20px_rgba(45,212,191,0.3)]',   bar: 'bg-teal-400'   },
	];

	const agentNames = ['NOVA','PULSE','ECHO','SURGE','DRIFT','FLUX','CIPHER','NEXUS'];

	const agentTraits = [
		{ name: 'Speed',    key: 'speed'   },
		{ name: 'Accuracy', key: 'accuracy'},
		{ name: 'Economy',  key: 'economy' },
	];

	const randAddr = () => {
		const c = '0123456789abcdef';
		return '0x' + Array.from({ length: 8 }, () => c[Math.floor(Math.random() * c.length)]).join('');
	};
	const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

	function makeAgent(name, i) {
		return {
			id: i + 1, name,
			color: agentColors[i % agentColors.length],
			wallet: randAddr(),
			status: pick(statusCycle),
			task: pick(taskPool),
			balance: +(Math.random() * 4 + 0.5).toFixed(4),
			earned:  +(Math.random() * 12).toFixed(4),
			spent:   +(Math.random() * 6).toFixed(4),
			txCount: Math.floor(Math.random() * 300) + 10,
			tasksCompleted: Math.floor(Math.random() * 140) + 5,
			uptime: Math.floor(Math.random() * 1380) + 5,
			statusTick: Math.floor(Math.random() * statusCycle.length),
			traits: {
				speed:    Math.floor(Math.random() * 40 + 60),
				accuracy: Math.floor(Math.random() * 30 + 70),
				economy:  Math.floor(Math.random() * 50 + 50),
			},
		};
	}

	let agents = $state(agentNames.map(makeAgent));

	let txFeed = $state(
		Array.from({ length: 8 }, (_, i) => {
			const svc = services[i % services.length];
			return { id: `initial-${i}`, agent: agentNames[i % 8], color: agentColors[i % agentColors.length],
				service: svc.name, icon: svc.icon, amount: svc.cost, time: `${(i+1)*3}s ago` };
		})
	);

	let stats = $state({ activeAgents: 8, totalTx: 14821, solSpent: 38.42, tasksDone: 9204 });

	// SOL Flow history for the sparkline
	let solFlowHistory = $state(Array.from({ length: 20 }, () => Math.random() * 80 + 10));

	let showDeploy = $state(false);
	let deployForm = $state({ name: '', mission: '', budget: '1.0' });
	let deploySuccess = $state(false);
	let deployLoading = $state(false);

	async function handleDeploy() {
		if (!deployForm.name) return;
		deployLoading = true;
		await new Promise(r => setTimeout(r, 1800));
		deployLoading = false;
		deploySuccess = true;
		setTimeout(() => { showDeploy = false; deploySuccess = false; deployForm = { name:'', mission:'', budget:'1.0' }; }, 2500);
	}

	let topAgent = $derived(agents.reduce((b,a) => a.tasksCompleted > b.tasksCompleted ? a : b, agents[0]));
	const fmtUp = (m) => { const h = Math.floor(m/60), mm = m%60; return h>0 ? `${h}h ${mm}m` : `${mm}m`; };

	let sparklineData = $state(Array.from({length: 12}, () => Math.random() * 100));

	let tick = $state(0);
	onMount(() => {
		const id = setInterval(() => {
			tick++;
			agents = agents.map(a => {
				const newTick = (a.statusTick + 1) % statusCycle.length;
				const newStatus = statusCycle[newTick];
				const svc = pick(services);
				const paid = newStatus === 'paying' ? svc.cost : 0;
				const earned = Math.random() < 0.2 ? +(Math.random() * 0.003).toFixed(5) : 0;
				return { ...a, statusTick: newTick, status: newStatus,
					task: Math.random() < 0.07 ? pick(taskPool) : a.task,
					balance: Math.max(0, +(a.balance - paid + earned).toFixed(4)),
					spent: +(a.spent + paid).toFixed(4),
					earned: +(a.earned + earned).toFixed(4),
					txCount: a.txCount + (paid > 0 ? 1 : 0),
					tasksCompleted: a.tasksCompleted + (Math.random() < 0.05 ? 1 : 0),
					uptime: a.uptime + 1,
				};
			});
			const ag = pick(agents);
			const svc = pick(services);
			txFeed = [{ id: `new-${tick}`, agent: ag.name, color: ag.color,
				service: svc.name, icon: svc.icon, amount: svc.cost, time: 'just now' },
				...txFeed.slice(0, 9)];
			stats.totalTx += Math.floor(Math.random() * 4) + 1;
			stats.solSpent = +(stats.solSpent + Math.random() * 0.02).toFixed(3);
			stats.tasksDone += Math.random() < 0.3 ? 1 : 0;
			if (tick % 12 === 0) agents = agents.map(a => a.balance < 0.1 ? { ...a, balance: +(a.balance + 2).toFixed(4) } : a);
			if (tick % 3 === 0) {
				sparklineData = sparklineData.map(() => Math.random() * 100);
				solFlowHistory = [...solFlowHistory.slice(1), Math.random() * 80 + 10];
			}
		}, 1000);
		return () => clearInterval(id);
	});

	const statusDot   = (s) => ({ running:'bg-green-400 animate-pulse', paying:'bg-yellow-300 animate-ping', waiting:'bg-slate-500' }[s] ?? 'bg-slate-500');
	const statusColor = (s) => ({ running:'text-green-400', paying:'text-yellow-300', waiting:'text-slate-500' }[s] ?? 'text-slate-500');
	const statusLabel = (s) => ({ running:'● Running', paying:'⚡ Paying', waiting:'○ Idle' }[s] ?? s);
	const statusBg    = (s) => ({ running:'bg-green-400/10 border-green-400/20', paying:'bg-yellow-400/10 border-yellow-400/20', waiting:'bg-slate-400/10 border-slate-400/20' }[s] ?? '');
</script>

<!-- Page wrapper with dark futuristic background -->
<div class="relative min-h-screen overflow-hidden bg-[#040d14] font-mono text-white">

	<!-- Ambient background glows -->
	<div class="pointer-events-none absolute inset-0 overflow-hidden">
		<div class="absolute -top-40 left-1/4 h-96 w-96 rounded-full bg-green-500/8 blur-[120px]"></div>
		<div class="absolute bottom-0 right-1/4 h-96 w-96 rounded-full bg-cyan-500/6 blur-[140px]"></div>
		<div class="absolute top-1/2 left-0 h-64 w-64 rounded-full bg-purple-500/5 blur-[100px]"></div>
	</div>

	<!-- Scanline overlay -->
	<div class="pointer-events-none absolute inset-0 opacity-[0.015]" style="background: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,100,0.5) 2px, rgba(0,255,100,0.5) 3px)"></div>

	<div class="relative mx-auto max-w-7xl px-4 pb-16 pt-8 sm:px-6 lg:px-10">

		<!-- ── Header ── -->
		<div class="mb-8 flex flex-wrap items-center justify-between gap-4">
			<div>
				<div class="flex items-center gap-3 flex-wrap">
					<h1 class="text-4xl font-black tracking-tight">
						<span class="text-green-400 drop-shadow-[0_0_15px_rgba(74,222,128,0.5)]">x402</span>
					</h1>
					<span class="rounded-md border border-green-400/30 bg-green-400/10 px-2 py-0.5 text-[10px] font-bold text-green-400 shadow-[0_0_10px_rgba(74,222,128,0.2)]">
						AI AGENT NETWORK
					</span>
					<span class="flex items-center gap-1.5 rounded-full border border-green-400/20 bg-green-400/5 px-3 py-1 text-xs text-green-400">
						<span class="h-1.5 w-1.5 animate-pulse rounded-full bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.8)]"></span>LIVE
					</span>
				</div>
				<p class="mt-1.5 text-xs text-green-400/40">
					Autonomous agents · HTTP 402 micropayments · Solana settlement
				</p>
			</div>
			<button
				onclick={() => (showDeploy = true)}
				class="group relative overflow-hidden rounded-xl border border-green-400/40 bg-green-400/10 px-5 py-2.5 text-sm font-bold text-green-400 shadow-lg shadow-green-500/20 transition-all hover:scale-105 hover:bg-green-400/20 hover:shadow-green-500/40"
			>
				<span class="relative z-10 flex items-center gap-2">
					<span class="text-base">⊕</span> Deploy Agent
				</span>
				<div class="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-green-400/10 to-transparent transition-transform duration-500 group-hover:translate-x-full"></div>
			</button>
		</div>

		<!-- ── Stats Bar ── -->
		<div class="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
			{#each [
				{ label: 'Active Agents', value: stats.activeAgents,              hi: true,  trend: '+2',   key: 'agents', icon: '🤖' },
				{ label: 'Total Txns',    value: stats.totalTx.toLocaleString(), trend: '+' + (Math.floor(tick * 3.2) || 142),  key: 'txns',  icon: '⚡' },
				{ label: 'SOL Spent',     value: `${stats.solSpent.toFixed(2)} SOL`, trend: '+0.24', key: 'sol',    icon: '◎' },
				{ label: 'Tasks Done',    value: stats.tasksDone.toLocaleString(), trend: '+8',    key: 'tasks',  icon: '✓' },
			] as s (s.key)}
				<div class="group relative overflow-hidden rounded-2xl border {s.hi ? 'border-green-400/30 bg-green-400/5' : 'border-white/5 bg-white/[0.02]'} p-4 transition-all hover:scale-[1.02] hover:shadow-xl hover:shadow-green-500/10 backdrop-blur-sm">
					<!-- glow corner top right -->
					<div class="absolute right-0 top-0 h-20 w-20 rounded-full bg-green-400/5 blur-2xl group-hover:bg-green-400/10 transition-all pointer-events-none"></div>
					<div class="flex justify-between items-start mb-2">
						<p class="text-[10px] uppercase tracking-widest text-slate-500">{s.icon} {s.label}</p>
						<span class="rounded-full bg-green-400/10 px-2 py-0.5 text-[9px] font-black text-green-400">{s.trend}</span>
					</div>
					<p class="text-2xl font-extrabold {s.hi ? 'text-green-400 drop-shadow-[0_0_10px_rgba(74,222,128,0.4)]' : 'text-white'}">{s.value}</p>
					<!-- Sparkline -->
					<div class="mt-3 h-7 flex items-end gap-0.5">
						{#each sparklineData as height, idx (idx)}
							<div class="flex-1 bg-gradient-to-t from-green-400/10 to-green-400/30 rounded-t transition-all" style="height: {height}%"></div>
						{/each}
					</div>
				</div>
			{/each}
		</div>

		<!-- ── Body ── -->
		<div class="flex flex-col gap-6 lg:flex-row">

			<!-- Left: Main Content -->
			<div class="flex-1 min-w-0 space-y-6">

				<!-- Top Agent Card -->
				{#if topAgent}
					<div class="relative overflow-hidden rounded-2xl border border-green-400/20 bg-gradient-to-br from-green-400/5 to-transparent p-5 shadow-xl shadow-green-500/10 backdrop-blur-sm">
						<!-- Background chart lines -->
						<div class="pointer-events-none absolute inset-0 overflow-hidden opacity-20">
							<div class="absolute bottom-0 left-0 right-0 h-16 flex items-end gap-0.5 px-4">
								{#each solFlowHistory as h, i (i)}
									<div class="flex-1 rounded-t bg-green-400/40 transition-all duration-300" style="height: {h}%"></div>
								{/each}
							</div>
						</div>

						<div class="relative z-10">
							<p class="mb-3 text-[10px] font-bold uppercase tracking-widest text-green-400 flex items-center gap-2">
								<span class="text-base">⭐</span> Top Performing Agent
							</p>
							<div class="flex items-center gap-4 flex-wrap">
								<div class="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border {topAgent.color.border} ring-2 {topAgent.color.ring} {topAgent.color.bg} {topAgent.color.glow}">
									<span class="text-2xl font-black {topAgent.color.text}">{topAgent.name[0]}</span>
									<span class="absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full {statusDot(topAgent.status)} border-2 border-[#040d14]"></span>
								</div>
								<div class="flex-1 min-w-0">
									<div class="flex flex-wrap items-center gap-2">
										<span class="text-lg font-extrabold {topAgent.color.text} drop-shadow-[0_0_8px_currentColor]">AGENT_{topAgent.name}</span>
										<span class="text-[10px] text-slate-600 font-mono">{topAgent.wallet}</span>
										<span class="rounded-full border {statusBg(topAgent.status)} px-2 py-0.5 text-[9px] font-bold {statusColor(topAgent.status)}">{statusLabel(topAgent.status)}</span>
									</div>
									<p class="mt-1 truncate text-xs text-slate-400">↳ {topAgent.task}</p>
								</div>
								<div class="hidden shrink-0 text-right sm:block">
									<p class="text-3xl font-extrabold text-white">{topAgent.tasksCompleted}</p>
									<p class="text-[10px] text-slate-500">tasks done</p>
								</div>
							</div>

							<!-- Stats row -->
							<div class="mt-4 grid grid-cols-4 gap-2 text-center text-[10px]">
								{#each [
									{ label: 'Balance', value: `${topAgent.balance} SOL`, key: 'balance' },
									{ label: 'Earned',  value: `${topAgent.earned} SOL`,  key: 'earned'  },
									{ label: 'Spent',   value: `${topAgent.spent} SOL`,   key: 'spent'   },
									{ label: 'Uptime',  value: fmtUp(topAgent.uptime),    key: 'uptime'  },
								] as m (m.key)}
									<div class="rounded-xl border border-white/5 bg-black/40 py-2.5 backdrop-blur-sm hover:border-green-400/20 transition-colors">
										<p class="font-bold text-white">{m.value}</p>
										<p class="text-slate-600 mt-0.5">{m.label}</p>
									</div>
								{/each}
							</div>
						</div>
					</div>
				{/if}

				<!-- ── Agent Grid ── -->
				<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
					{#each agents as agent (agent.id)}
						<div class="group relative overflow-hidden flex flex-col gap-3 rounded-2xl border {agent.color.border} bg-white/[0.015] p-4 transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/[0.035] hover:{agent.color.glow} backdrop-blur-sm">

							<!-- Subtle ambient background glow -->
							<div class="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full {agent.color.bg} blur-2xl opacity-0 transition-opacity group-hover:opacity-100"></div>

							<!-- Status ribbon for paying agents -->
							{#if agent.status === 'paying'}
								<div class="absolute top-0 right-0 rounded-tr-2xl rounded-bl-xl bg-yellow-400/20 px-2 py-0.5 text-[9px] font-black text-yellow-300 border-l border-b border-yellow-400/20">
									⚡ PAYING
								</div>
							{/if}
							{#if agent.tasksCompleted > 100}
								<div class="absolute top-0 left-0 rounded-tl-2xl rounded-br-xl bg-amber-400/20 px-2 py-0.5 text-[9px] font-black text-amber-300 border-r border-b border-amber-400/20">
									🏆 TOP
								</div>
							{/if}

							<!-- Agent header -->
							<div class="flex items-center gap-3 relative z-10 {agent.tasksCompleted > 100 ? 'mt-2' : ''}">
								<div class="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border {agent.color.border} ring-1 {agent.color.ring} {agent.color.bg} transition-transform duration-300 group-hover:scale-110">
									<span class="text-sm font-black {agent.color.text}">{agent.name[0]}</span>
									<span class="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full {statusDot(agent.status)} border-2 border-[#040d14]"></span>
								</div>
								<div class="min-w-0 flex-1">
									<div class="flex items-center gap-2 flex-wrap">
										<p class="text-sm font-bold {agent.color.text}">AGENT_{agent.name}</p>
										{#if agent.balance > 2}
											<span class="rounded bg-green-400/15 px-1.5 py-0.5 text-[8px] font-black text-green-400 border border-green-400/20">PROFITABLE</span>
										{/if}
									</div>
									<p class="text-[10px] text-slate-600 truncate">{agent.wallet}</p>
								</div>
							</div>

							<!-- Current task -->
							<div class="relative z-10 rounded-xl border border-white/5 bg-black/30 px-3 py-2">
								<p class="text-[9px] font-bold uppercase tracking-widest text-slate-600 mb-0.5">Current Task</p>
								<p class="truncate text-[11px] text-green-300/80">↳ {agent.task}</p>
							</div>

							<!-- Metrics row -->
							<div class="relative z-10 grid grid-cols-4 gap-1 text-center text-[10px]">
								{#each [
									{ v: agent.tasksCompleted, l: 'tasks', icon: '✓', key: 'tasks' },
									{ v: agent.txCount,        l: 'txns',  icon: '⚡', key: 'txns'  },
									{ v: agent.balance,        l: 'SOL',   icon: '◎', warn: agent.balance < 0.2, key: 'sol' },
									{ v: fmtUp(agent.uptime),  l: 'uptime',icon: '⏱', key: 'uptime' },
								] as m (m.key)}
									<div class="rounded-lg bg-black/30 py-1.5 hover:bg-black/50 transition-colors border border-white/[0.04]">
										<p class="font-bold {m.warn ? 'text-red-400' : 'text-white'}">{m.v}</p>
										<p class="text-slate-600">{m.l}</p>
									</div>
								{/each}
							</div>

							<!-- Ability bars (traits) -->
							<div class="relative z-10 space-y-1.5">
								{#each agentTraits as trait (trait.key)}
									<div class="flex items-center gap-2">
										<span class="w-14 text-[9px] text-slate-500 uppercase tracking-wider shrink-0">{trait.name}</span>
										<div class="flex-1 h-1 rounded-full bg-white/5 overflow-hidden">
											<div
												class="h-full rounded-full {agent.color.bar} transition-all duration-700 shadow-sm"
												style="width: {agent.traits[trait.key]}%; box-shadow: 0 0 4px currentColor;"
											></div>
										</div>
										<span class="text-[9px] font-bold {agent.color.text} w-7 text-right">{agent.traits[trait.key]}</span>
									</div>
								{/each}
							</div>
						</div>
					{/each}
				</div>
			</div>

			<!-- Right: Sidebar -->
			<div class="flex shrink-0 flex-col gap-4 lg:w-72 xl:w-80">

				<!-- Tx Feed -->
				<div class="overflow-hidden rounded-2xl border border-white/5 bg-white/[0.015] backdrop-blur-sm">
					<div class="flex items-center justify-between border-b border-white/5 bg-black/20 px-4 py-3">
						<div class="flex items-center gap-2">
							<p class="text-sm font-bold text-white">⚡ x402 Transactions</p>
							<span class="rounded-full bg-green-400/20 px-2 py-0.5 text-[9px] font-black text-green-400 shadow-[0_0_8px_rgba(74,222,128,0.3)]">LIVE</span>
						</div>
						<button class="text-[10px] text-slate-500 hover:text-white transition-colors">Clear All</button>
					</div>
					<ul class="max-h-72 divide-y divide-white/[0.04] overflow-y-auto">
						{#each txFeed as tx (tx.id)}
							<li class="group px-4 py-2.5 text-[11px] transition-colors hover:bg-white/[0.02]">
								<div class="flex items-center justify-between">
									<div class="flex items-center gap-2">
										<div class="h-6 w-6 rounded-full {tx.color.bg} border {tx.color.ring}/50 flex items-center justify-center shrink-0">
											<span class="text-[8px] font-black {tx.color.text}">{tx.agent[0]}</span>
										</div>
										<span class="font-bold {tx.color.text}">AGENT_{tx.agent}</span>
									</div>
									<span class="rounded-md bg-red-400/15 border border-red-400/20 px-1.5 py-0.5 font-bold text-red-400">−{tx.amount} SOL</span>
								</div>
								<div class="mt-1 flex items-center justify-between">
									<span class="text-slate-500">{tx.icon} {tx.service}</span>
									<span class="text-slate-600">{tx.time}</span>
								</div>
							</li>
						{/each}
					</ul>
				</div>

				<!-- SOL Flow Chart -->
				<div class="rounded-2xl border border-white/5 bg-white/[0.015] p-4 backdrop-blur-sm">
					<div class="flex items-center justify-between mb-3">
						<p class="text-xs font-bold text-white">◎ SOL Flow</p>
						<span class="text-[9px] text-slate-500 uppercase tracking-wider">Last 20s</span>
					</div>
					<div class="h-16 flex items-end gap-0.5">
						{#each solFlowHistory as h, i (i)}
							<div
								class="flex-1 rounded-t transition-all duration-300"
								style="height: {h}%; background: linear-gradient(to top, rgba(74,222,128,0.1), rgba(74,222,128,0.5)); box-shadow: 0 0 3px rgba(74,222,128,0.2);"
							></div>
						{/each}
					</div>
					<div class="mt-2 flex justify-between text-[9px] text-slate-600">
						<span>−{stats.solSpent.toFixed(2)} total</span>
						<span>↑ {((stats.solSpent / (stats.totalTx || 1)) * 1000).toFixed(2)}μSOL / tx</span>
					</div>
				</div>

				<!-- Service Catalog -->
				<div class="overflow-hidden rounded-2xl border border-white/5 bg-white/[0.015] backdrop-blur-sm">
					<div class="border-b border-white/5 bg-black/20 px-4 py-3">
						<div class="flex items-center justify-between">
							<div>
								<p class="text-sm font-bold text-white">🛒 Service Catalog</p>
								<p class="mt-0.5 text-[10px] text-slate-500">Auto-purchased via HTTP 402</p>
							</div>
						</div>
					</div>
					<ul class="divide-y divide-white/[0.04]">
						{#each services as svc (svc.name)}
							<li class="group flex items-center justify-between px-4 py-2.5 text-[11px] transition-colors hover:bg-white/[0.02]">
								<div class="flex items-center gap-2">
									<span class="text-base">{svc.icon}</span>
									<div>
										<span class="text-slate-300 font-medium">{svc.name}</span>
										<span class="ml-1.5 text-[9px] text-slate-600">{svc.category}</span>
									</div>
								</div>
								<span class="rounded-md bg-amber-400/10 border border-amber-400/15 px-2 py-0.5 font-bold text-amber-300">{svc.cost} SOL</span>
							</li>
						{/each}
					</ul>
				</div>

				<!-- How it works -->
				<div class="rounded-2xl border border-green-400/10 bg-green-400/[0.02] p-4 space-y-3 backdrop-blur-sm">
					<p class="text-xs font-bold text-green-400">⚙️ How x402 Works</p>
					{#each [
						['1', 'Agent requests a paid API endpoint', '→'],
						['2', 'Server returns HTTP 402 + payment address', '←'],
						['3', 'Agent signs & broadcasts micropayment', '◎'],
						['4', 'Server verifies on-chain, returns resource', '✓'],
						['5', 'Agent continues mission autonomously 🤖', '∞'],
					] as [n, txt, arrow] (n)}
						<div class="flex items-start gap-2 text-[11px]">
							<span class="mt-0.5 shrink-0 rounded bg-green-400/15 px-1.5 py-0.5 text-[9px] font-black text-green-400 border border-green-400/20">{n}</span>
							<p class="text-slate-400">{txt}</p>
						</div>
					{/each}
				</div>
			</div>
		</div>
	</div>
</div>

<!-- ── Deploy Modal ── -->
{#if showDeploy}
	<button class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm" onclick={() => (showDeploy=false)} aria-label="Close"></button>
	<div class="fixed inset-0 z-50 flex items-center justify-center p-4">
		<div class="relative w-full max-w-md rounded-3xl border border-green-400/20 bg-[#040d14] p-6 shadow-2xl shadow-green-500/20 font-mono backdrop-blur-xl">
			<!-- Inner glow -->
			<div class="pointer-events-none absolute inset-0 rounded-3xl bg-gradient-to-br from-green-400/5 to-transparent"></div>
			<button onclick={() => (showDeploy=false)} class="absolute right-4 top-4 text-slate-500 hover:text-white text-xl z-10">✕</button>

			<div class="relative z-10">
				<p class="mb-1 text-[10px] font-bold uppercase tracking-widest text-green-400">x402 · New Agent</p>
				<h2 class="mb-5 text-xl font-extrabold text-white">⊕ Deploy Agent</h2>

				{#if deploySuccess}
					<div class="rounded-2xl border border-green-400/20 bg-green-400/10 p-6 text-center">
						<p class="text-5xl mb-3">🤖</p>
						<p class="text-base font-bold text-green-400">Agent deployed!</p>
						<p class="text-xs text-slate-400 mt-1">Generating wallet · Joining network · Starting mission…</p>
					</div>
				{:else}
					<div class="space-y-4">
						<div>
							<label for="codename" class="mb-1 block text-[10px] font-bold uppercase tracking-widest text-slate-500">Codename *</label>
							<input id="codename" bind:value={deployForm.name} type="text" placeholder="e.g. ORION"
								class="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm uppercase font-bold text-green-400 placeholder-slate-700 focus:border-green-400/50 focus:outline-none focus:shadow-[0_0_15px_rgba(74,222,128,0.1)] transition-shadow" />
						</div>
						<div>
							<label for="mission" class="mb-1 block text-[10px] font-bold uppercase tracking-widest text-slate-500">Mission Brief</label>
							<textarea id="mission" bind:value={deployForm.mission} rows="3" placeholder="What should this agent do?"
								class="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-slate-700 focus:border-green-400/50 focus:outline-none resize-none transition-shadow"></textarea>
						</div>
						<div>
							<label for="budget" class="mb-1 block text-[10px] font-bold uppercase tracking-widest text-slate-500">Starting Budget (SOL)</label>
							<input id="budget" bind:value={deployForm.budget} type="number" min="0.1" step="0.1"
								class="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white focus:border-green-400/50 focus:outline-none transition-shadow" />
						</div>
						<div class="rounded-xl border border-white/5 bg-black/40 p-3 text-[11px] text-slate-500 space-y-1.5">
							<p>🔑 Auto-generates a Solana keypair on deploy</p>
							<p>⚡ x402 enabled — pays for API calls autonomously</p>
							<p>🧠 Powered by claude-sonnet with tool use</p>
							<p>🔄 Auto-refills wallet when balance drops below 0.1 SOL</p>
						</div>
						<button
							onclick={handleDeploy}
							disabled={!deployForm.name || deployLoading}
							class="group relative w-full overflow-hidden rounded-xl border border-green-400/40 bg-green-400/10 py-3 text-sm font-bold text-green-400 shadow-lg shadow-green-500/20 transition-all hover:bg-green-400/20 hover:scale-[1.02] hover:shadow-green-500/40 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
						>
							<span class="relative z-10">{deployLoading ? '⏳ Deploying…' : '⊕ Deploy to Network'}</span>
							<div class="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-green-400/10 to-transparent transition-transform duration-700 group-hover:translate-x-full"></div>
						</button>
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}
