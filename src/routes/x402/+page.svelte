<svelte:head>
	<title>x402 | AI Agent Network</title>
	<meta name="description" content="Autonomous AI agents that pay their own way via x402 micropayments." />
</svelte:head>

<script>
	import { onMount } from 'svelte';

	const services = [
		{ name: 'LLM Inference',      cost: 0.0018, icon: '🧠' },
		{ name: 'Image Generation',   cost: 0.0024, icon: '🎨' },
		{ name: 'Music Synthesis',    cost: 0.0031, icon: '🎵' },
		{ name: 'Web Scrape',         cost: 0.0006, icon: '🕸️' },
		{ name: 'Data Index',         cost: 0.0009, icon: '📊' },
		{ name: 'Contract Audit',     cost: 0.0042, icon: '📝' },
		{ name: 'Vector Search',      cost: 0.0007, icon: '🔍' },
		{ name: 'Code Execution',     cost: 0.0015, icon: '⚙️' },
		{ name: 'Sentiment Analysis', cost: 0.0005, icon: '📡' },
		{ name: 'On-chain Tx',        cost: 0.0008, icon: '⛓️' },
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
		{ ring: 'ring-cyan-400',   glow: 'shadow-cyan-500/40',   text: 'text-cyan-400',   bg: 'bg-cyan-400/10'   },
		{ ring: 'ring-green-400',  glow: 'shadow-green-500/40',  text: 'text-green-400',  bg: 'bg-green-400/10'  },
		{ ring: 'ring-purple-400', glow: 'shadow-purple-500/40', text: 'text-purple-400', bg: 'bg-purple-400/10' },
		{ ring: 'ring-pink-400',   glow: 'shadow-pink-500/40',   text: 'text-pink-400',   bg: 'bg-pink-400/10'   },
		{ ring: 'ring-amber-400',  glow: 'shadow-amber-500/40',  text: 'text-amber-400',  bg: 'bg-amber-400/10'  },
		{ ring: 'ring-sky-400',    glow: 'shadow-sky-500/40',    text: 'text-sky-400',    bg: 'bg-sky-400/10'    },
		{ ring: 'ring-rose-400',   glow: 'shadow-rose-500/40',   text: 'text-rose-400',   bg: 'bg-rose-400/10'   },
		{ ring: 'ring-teal-400',   glow: 'shadow-teal-500/40',   text: 'text-teal-400',   bg: 'bg-teal-400/10'   },
	];

	const agentNames = ['NOVA','PULSE','ECHO','SURGE','DRIFT','FLUX','CIPHER','NEXUS'];

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
			earned: +(Math.random() * 12).toFixed(4),
			spent: +(Math.random() * 6).toFixed(4),
			txCount: Math.floor(Math.random() * 300) + 10,
			tasksCompleted: Math.floor(Math.random() * 140) + 5,
			uptime: Math.floor(Math.random() * 1380) + 5,
			statusTick: Math.floor(Math.random() * statusCycle.length),
		};
	}

	let agents = $state(agentNames.map(makeAgent));

	let txFeed = $state(
		Array.from({ length: 8 }, (_, i) => {
			const svc = services[i % services.length];
			return { id: i, agent: agentNames[i % 8], color: agentColors[i % agentColors.length],
				service: svc.name, icon: svc.icon, amount: svc.cost, time: `${(i+1)*3}s ago` };
		})
	);

	let stats = $state({ activeAgents: 8, totalTx: 14821, solSpent: 38.42, tasksDone: 9204 });

	let showDeploy = $state(false);
	let deployForm = $state({ name: '', mission: '', budget: '1.0' });
	let deploySuccess = $state(false);

	function handleDeploy() {
		if (!deployForm.name) return;
		deploySuccess = true;
		setTimeout(() => { showDeploy = false; deploySuccess = false; deployForm = { name:'', mission:'', budget:'1.0' }; }, 2200);
	}

	let topAgent = $derived(agents.reduce((b,a) => a.tasksCompleted > b.tasksCompleted ? a : b, agents[0]));
	const fmtUp = (m) => { const h = Math.floor(m/60), mm = m%60; return h>0 ? `${h}h ${mm}m` : `${mm}m`; };

	let tick = 0;
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
			txFeed = [{ id: tick, agent: ag.name, color: ag.color,
				service: svc.name, icon: svc.icon, amount: svc.cost, time: 'just now' },
				...txFeed.slice(0, 9)];
			stats.totalTx += Math.floor(Math.random() * 4) + 1;
			stats.solSpent = +(stats.solSpent + Math.random() * 0.02).toFixed(3);
			stats.tasksDone += Math.random() < 0.3 ? 1 : 0;
			if (tick % 12 === 0) agents = agents.map(a => a.balance < 0.1 ? { ...a, balance: +(a.balance + 2).toFixed(4) } : a);
		}, 1000);
		return () => clearInterval(id);
	});

	const statusDot   = (s) => ({ running:'bg-green-400 animate-pulse', paying:'bg-yellow-300 animate-ping', waiting:'bg-gray-500' }[s] ?? 'bg-gray-500');
	const statusColor = (s) => ({ running:'text-green-400', paying:'text-yellow-300', waiting:'text-gray-500' }[s] ?? 'text-gray-500');
	const statusLabel = (s) => ({ running:'● Running', paying:'⚡ Paying', waiting:'○ Idle' }[s] ?? s);
</script>

<div class="min-h-screen bg-[#020c14] font-mono text-white">
	<div class="mx-auto max-w-7xl px-4 pb-16 pt-8 sm:px-6 lg:px-10">

		<!-- Header -->
		<div class="mb-8 flex flex-wrap items-center justify-between gap-4">
			<div>
				<div class="flex items-center gap-3">
					<h1 class="text-4xl font-black tracking-tight">
						<span class="text-green-400">x402</span>
					</h1>
					<span class="rounded-md border border-green-400/30 bg-green-400/10 px-2 py-0.5 text-[10px] font-bold text-green-400">
						AI AGENT NETWORK
					</span>
					<span class="flex items-center gap-1.5 text-xs text-green-400">
						<span class="h-2 w-2 animate-pulse rounded-full bg-green-400"></span>LIVE
					</span>
				</div>
				<p class="mt-1 text-xs text-green-400/40">Autonomous agents · HTTP 402 micropayments · Solana settlement</p>
			</div>
			<button onclick={() => (showDeploy = true)}
				class="rounded-xl border border-green-400/40 bg-green-400/10 px-5 py-2.5 text-sm font-bold text-green-400 shadow-lg shadow-green-500/20 transition hover:bg-green-400/20 hover:scale-105">
				⊕ Deploy Agent
			</button>
		</div>

		<!-- Stats -->
		<div class="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
			{#each [
				{ label: 'Active Agents',  value: stats.activeAgents,              hi: true  },
				{ label: 'Total Txns',     value: stats.totalTx.toLocaleString()             },
				{ label: 'SOL Spent',      value: `${stats.solSpent.toFixed(2)} SOL`         },
				{ label: 'Tasks Done',     value: stats.tasksDone.toLocaleString()            },
			] as s}
				<div class="rounded-xl border {s.hi ? 'border-green-400/30 bg-green-400/5' : 'border-white/5 bg-white/[0.03]'} p-4">
					<p class="text-[10px] text-gray-500 mb-1">{s.label}</p>
					<p class="text-2xl font-extrabold {s.hi ? 'text-green-400' : 'text-white'}">{s.value}</p>
				</div>
			{/each}
		</div>

		<!-- Body -->
		<div class="flex flex-col gap-6 lg:flex-row">

			<!-- Left -->
			<div class="flex-1 min-w-0 space-y-6">

				<!-- Top Agent -->
				{#if topAgent}
					<div class="rounded-2xl border border-green-400/20 bg-green-400/5 p-5 shadow-xl shadow-green-500/10">
						<p class="mb-3 text-[10px] font-bold uppercase tracking-widest text-green-400">⭐ Top Performing Agent</p>
						<div class="flex items-center gap-4">
							<div class="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border {topAgent.color.ring} ring-2 {topAgent.color.bg} shadow-lg {topAgent.color.glow}">
								<span class="text-xl font-black {topAgent.color.text}">{topAgent.name[0]}</span>
								<span class="absolute -bottom-1 -right-1 h-3 w-3 rounded-full {statusDot(topAgent.status)} border-2 border-[#020c14]"></span>
							</div>
							<div class="min-w-0 flex-1">
								<div class="flex flex-wrap items-center gap-2">
									<span class="text-lg font-extrabold {topAgent.color.text}">AGENT_{topAgent.name}</span>
									<span class="text-[10px] text-gray-600">{topAgent.wallet}</span>
								</div>
								<p class="mt-0.5 truncate text-xs text-gray-500">↳ {topAgent.task}</p>
							</div>
							<div class="hidden shrink-0 text-right sm:block">
								<p class="text-2xl font-extrabold text-white">{topAgent.tasksCompleted}</p>
								<p class="text-[10px] text-gray-500">tasks done</p>
							</div>
						</div>
						<div class="mt-4 grid grid-cols-4 gap-2 text-center text-[10px]">
							{#each [
								{ label: 'Balance', value: `${topAgent.balance} SOL` },
								{ label: 'Earned',  value: `${topAgent.earned} SOL`  },
								{ label: 'Spent',   value: `${topAgent.spent} SOL`   },
								{ label: 'Uptime',  value: fmtUp(topAgent.uptime)    },
							] as m}
								<div class="rounded-lg border border-white/5 bg-black/30 py-2">
									<p class="font-bold text-white">{m.value}</p>
									<p class="text-gray-600">{m.label}</p>
								</div>
							{/each}
						</div>
					</div>
				{/if}

				<!-- Agent Grid -->
				<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
					{#each agents as agent (agent.id)}
						<div class="flex flex-col gap-3 rounded-2xl border border-white/5 bg-white/[0.02] p-4 transition hover:border-green-400/20 hover:bg-green-400/[0.02]">
							<div class="flex items-center gap-3">
								<div class="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border {agent.color.ring} ring-1 {agent.color.bg}">
									<span class="text-sm font-black {agent.color.text}">{agent.name[0]}</span>
									<span class="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full {statusDot(agent.status)} border border-[#020c14]"></span>
								</div>
								<div class="min-w-0 flex-1">
									<p class="text-sm font-bold {agent.color.text}">AGENT_{agent.name}</p>
									<p class="text-[10px] text-gray-600">{agent.wallet}</p>
								</div>
								<span class="shrink-0 text-xs font-semibold {statusColor(agent.status)}">{statusLabel(agent.status)}</span>
							</div>

							<div class="rounded-lg border border-white/5 bg-black/30 px-3 py-2">
								<p class="text-[9px] font-bold uppercase tracking-widest text-gray-600 mb-0.5">Task</p>
								<p class="truncate text-[11px] text-green-300/80">↳ {agent.task}</p>
							</div>

							<div class="grid grid-cols-4 gap-1 text-center text-[10px]">
								{#each [
									{ v: agent.tasksCompleted, l: 'tasks' },
									{ v: agent.txCount,        l: 'txns'  },
									{ v: agent.balance,        l: 'SOL', warn: agent.balance < 0.2 },
									{ v: fmtUp(agent.uptime),  l: 'up'   },
								] as m}
									<div class="rounded-lg bg-black/20 py-1.5">
										<p class="font-bold {m.warn ? 'text-red-400' : 'text-white'}">{m.v}</p>
										<p class="text-gray-600">{m.l}</p>
									</div>
								{/each}
							</div>
						</div>
					{/each}
				</div>
			</div>

			<!-- Right -->
			<div class="flex shrink-0 flex-col gap-4 lg:w-68 xl:w-72">

				<!-- Tx Feed -->
				<div class="overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02]">
					<div class="flex items-center justify-between border-b border-white/5 px-4 py-3">
						<p class="text-sm font-bold text-white">⚡ x402 Transactions</p>
						<span class="flex items-center gap-1 text-[10px] text-green-400">
							<span class="h-1.5 w-1.5 animate-pulse rounded-full bg-green-400"></span>live
						</span>
					</div>
					<ul class="max-h-80 divide-y divide-white/[0.04] overflow-hidden">
						{#each txFeed as tx (tx.id)}
							<li class="px-4 py-2.5 text-[11px]">
								<div class="flex items-center justify-between">
									<span class="font-bold {tx.color.text}">AGENT_{tx.agent}</span>
									<span class="font-bold text-yellow-300">−{tx.amount} SOL</span>
								</div>
								<div class="mt-0.5 flex items-center justify-between">
									<span class="text-gray-500">{tx.icon} {tx.service}</span>
									<span class="text-gray-600">{tx.time}</span>
								</div>
							</li>
						{/each}
					</ul>
				</div>

				<!-- Service Catalog -->
				<div class="overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02]">
					<div class="border-b border-white/5 px-4 py-3">
						<p class="text-sm font-bold text-white">🛒 Service Catalog</p>
						<p class="mt-0.5 text-[10px] text-gray-500">Auto-purchased via HTTP 402</p>
					</div>
					<ul class="divide-y divide-white/[0.04]">
						{#each services as svc}
							<li class="flex items-center justify-between px-4 py-2 text-[12px]">
								<span class="text-gray-400">{svc.icon} {svc.name}</span>
								<span class="font-bold text-yellow-300">{svc.cost} SOL</span>
							</li>
						{/each}
					</ul>
				</div>

				<!-- How it works -->
				<div class="rounded-2xl border border-green-400/10 bg-green-400/[0.03] p-4 space-y-2">
					<p class="text-xs font-bold text-green-400">⚙️ How x402 Works</p>
					{#each [
						['1', 'Agent requests a paid API endpoint'],
						['2', 'Server returns HTTP 402 + payment address'],
						['3', 'Agent signs & broadcasts micropayment'],
						['4', 'Server verifies on-chain, returns resource'],
						['5', 'Agent continues mission autonomously 🤖'],
					] as [n, txt]}
						<div class="flex items-start gap-2 text-[11px]">
							<span class="mt-0.5 shrink-0 rounded bg-green-400/20 px-1.5 py-0.5 text-[9px] font-black text-green-400">{n}</span>
							<p class="text-gray-400">{txt}</p>
						</div>
					{/each}
				</div>
			</div>
		</div>
	</div>
</div>

<!-- Deploy Modal -->
{#if showDeploy}
	<button class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm" onclick={() => (showDeploy=false)} aria-label="Close"></button>
	<div class="fixed inset-0 z-50 flex items-center justify-center p-4">
		<div class="relative w-full max-w-md rounded-2xl border border-green-400/20 bg-[#030f18] p-6 shadow-2xl shadow-green-500/20 font-mono">
			<button onclick={() => (showDeploy=false)} class="absolute right-4 top-4 text-gray-500 hover:text-white text-xl">✕</button>
			<p class="mb-1 text-[10px] font-bold uppercase tracking-widest text-green-400">x402 · New Agent</p>
			<h2 class="mb-5 text-xl font-extrabold text-white">⊕ Deploy Agent</h2>

			{#if deploySuccess}
				<div class="rounded-xl border border-green-400/20 bg-green-400/10 p-6 text-center">
					<p class="text-4xl mb-2">🤖</p>
					<p class="text-base font-bold text-green-400">Agent deployed!</p>
					<p class="text-xs text-gray-400 mt-1">Generating wallet · Joining network · Starting mission…</p>
				</div>
			{:else}
				<div class="space-y-4">
					<div>
						<label class="mb-1 block text-[10px] font-bold uppercase tracking-widest text-gray-500">Codename *</label>
						<input bind:value={deployForm.name} type="text" placeholder="e.g. ORION"
							class="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm uppercase font-bold text-green-400 placeholder-gray-700 focus:border-green-400/50 focus:outline-none" />
					</div>
					<div>
						<label class="mb-1 block text-[10px] font-bold uppercase tracking-widest text-gray-500">Mission Brief</label>
						<textarea bind:value={deployForm.mission} rows="3" placeholder="What should this agent do?"
							class="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-gray-700 focus:border-green-400/50 focus:outline-none resize-none"></textarea>
					</div>
					<div>
						<label class="mb-1 block text-[10px] font-bold uppercase tracking-widest text-gray-500">Starting Budget (SOL)</label>
						<input bind:value={deployForm.budget} type="number" min="0.1" step="0.1"
							class="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white focus:border-green-400/50 focus:outline-none" />
					</div>
					<div class="rounded-xl border border-white/5 bg-black/30 p-3 text-[11px] text-gray-500 space-y-1.5">
						<p>🔑 Auto-generates a Solana keypair on deploy</p>
						<p>⚡ x402 enabled — pays for API calls autonomously</p>
						<p>🧠 Powered by claude-sonnet-4-6 with tool use</p>
						<p>🔄 Auto-refills wallet when balance drops below 0.1 SOL</p>
					</div>
					<button onclick={handleDeploy} disabled={!deployForm.name}
						class="w-full rounded-xl border border-green-400/40 bg-green-400/10 py-3 text-sm font-bold text-green-400 shadow-lg shadow-green-500/20 transition hover:bg-green-400/20 hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100">
						⊕ Deploy to Network
					</button>
				</div>
			{/if}
		</div>
	</div>
{/if}
