<script>
	import { onMount } from 'svelte';

	// ── Static data ──────────────────────────────────────────────────────────────

	const categories = [
		{ key: 'all', label: '🌐 All' },
		{ key: 'productivity', label: '⚡ Productivity' },
		{ key: 'trading', label: '📈 Trading' },
		{ key: 'creative', label: '🎨 Creative' },
		{ key: 'research', label: '🔬 Research' },
		{ key: 'social', label: '💬 Social' },
	];

	const agentTemplates = [
		{
			id: 1, name: 'EmailClaw', avatar: '📧', specialty: 'Inbox zero, automated',
			category: 'productivity', status: 'running',
			platforms: ['📱 Gmail', '📮 Outlook', '💬 Slack'], model: 'Claude',
			capabilities: ['Triage', 'Auto-reply', 'Unsubscribe', 'Summary'],
			tasksCompleted: 14820, costPerTask: 1.2,
			lastAction: 'Cleared 47 emails, unsubscribed from 6 lists',
			uptime: 8640, successRate: 99,
			color: { ring: 'ring-cyan-400', border: 'border-cyan-400/30', glow: 'shadow-cyan-500/40', text: 'text-cyan-400', bg: 'bg-cyan-400/10', badge: 'bg-cyan-400/20 text-cyan-300' },
		},
		{
			id: 2, name: 'CodeClaw', avatar: '⚙️', specialty: 'Deploys microservices autonomously',
			category: 'productivity', status: 'busy',
			platforms: ['🐙 GitHub', '🖥️ Terminal', '☁️ Vercel'], model: 'Claude',
			capabilities: ['PR Review', 'CI/CD', 'Bug Fix', 'Deploy'],
			tasksCompleted: 9203, costPerTask: 4.8,
			lastAction: 'Deployed 3 microservices, resolved 2 merge conflicts',
			uptime: 5760, successRate: 97,
			color: { ring: 'ring-purple-400', border: 'border-purple-400/30', glow: 'shadow-purple-500/40', text: 'text-purple-400', bg: 'bg-purple-400/10', badge: 'bg-purple-400/20 text-purple-300' },
		},
		{
			id: 3, name: 'TraderClaw', avatar: '📈', specialty: 'Executes trades across DEXes',
			category: 'trading', status: 'running',
			platforms: ['🦅 Jupiter', '📊 Birdeye', '🔮 Phantom'], model: 'GPT-4',
			capabilities: ['DCA', 'Stop-loss', 'Snipe', 'Arbitrage'],
			tasksCompleted: 31450, costPerTask: 6.0,
			lastAction: 'Analyzed 12 stocks, entered 2 long positions',
			uptime: 20160, successRate: 84,
			color: { ring: 'ring-green-400', border: 'border-green-400/30', glow: 'shadow-green-500/40', text: 'text-green-400', bg: 'bg-green-400/10', badge: 'bg-green-400/20 text-green-300' },
		},
		{
			id: 4, name: 'MusicClaw', avatar: '🎵', specialty: 'Composes and releases tracks',
			category: 'creative', status: 'running',
			platforms: ['🎧 Spotify', '🎵 SoundCloud', '🌊 Audius'], model: 'Claude',
			capabilities: ['Compose', 'Mix', 'Master', 'Publish'],
			tasksCompleted: 4210, costPerTask: 8.5,
			lastAction: 'Composed 16-bar lo-fi hook, uploaded to Audius',
			uptime: 3240, successRate: 96,
			color: { ring: 'ring-pink-400', border: 'border-pink-400/30', glow: 'shadow-pink-500/40', text: 'text-pink-400', bg: 'bg-pink-400/10', badge: 'bg-pink-400/20 text-pink-300' },
		},
		{
			id: 5, name: 'ResearchClaw', avatar: '🔬', specialty: 'Synthesizes papers & reports',
			category: 'research', status: 'running',
			platforms: ['🌐 Web', '📄 ArXiv', '📚 Scholar'], model: 'DeepSeek',
			capabilities: ['Summarize', 'Cite', 'Compare', 'PDF Parse'],
			tasksCompleted: 22100, costPerTask: 3.2,
			lastAction: 'Read 8 papers on DeFi governance, wrote briefing',
			uptime: 11520, successRate: 98,
			color: { ring: 'ring-amber-400', border: 'border-amber-400/30', glow: 'shadow-amber-500/40', text: 'text-amber-400', bg: 'bg-amber-400/10', badge: 'bg-amber-400/20 text-amber-300' },
		},
		{
			id: 6, name: 'SocialClaw', avatar: '📢', specialty: 'Manages multi-platform presence',
			category: 'social', status: 'busy',
			platforms: ['🐦 Twitter', '📸 Instagram', '🎵 TikTok'], model: 'GPT-4',
			capabilities: ['Post', 'Reply', 'Schedule', 'Analytics'],
			tasksCompleted: 18340, costPerTask: 2.0,
			lastAction: 'Scheduled 12 posts, replied to 34 mentions',
			uptime: 7200, successRate: 95,
			color: { ring: 'ring-sky-400', border: 'border-sky-400/30', glow: 'shadow-sky-500/40', text: 'text-sky-400', bg: 'bg-sky-400/10', badge: 'bg-sky-400/20 text-sky-300' },
		},
		{
			id: 7, name: 'TelegramClaw', avatar: '✈️', specialty: 'Monitors & moderates TG groups',
			category: 'social', status: 'running',
			platforms: ['✈️ Telegram', '💬 Discord', '📡 Slack'], model: 'DeepSeek',
			capabilities: ['Moderate', 'Announce', 'Polls', 'Anti-spam'],
			tasksCompleted: 7890, costPerTask: 1.5,
			lastAction: 'Removed 9 spam messages, posted announcement',
			uptime: 14400, successRate: 99,
			color: { ring: 'ring-indigo-400', border: 'border-indigo-400/30', glow: 'shadow-indigo-500/40', text: 'text-indigo-400', bg: 'bg-indigo-400/10', badge: 'bg-indigo-400/20 text-indigo-300' },
		},
		{
			id: 8, name: 'CalendarClaw', avatar: '📅', specialty: 'Schedules meetings end-to-end',
			category: 'productivity', status: 'idle',
			platforms: ['📅 Google Cal', '💼 Calendly', '📧 Gmail'], model: 'Claude',
			capabilities: ['Book', 'Reschedule', 'Remind', 'Timezone'],
			tasksCompleted: 5600, costPerTask: 0.8,
			lastAction: 'Booked 3 meetings, sent reminders to 7 attendees',
			uptime: 4320, successRate: 100,
			color: { ring: 'ring-teal-400', border: 'border-teal-400/30', glow: 'shadow-teal-500/40', text: 'text-teal-400', bg: 'bg-teal-400/10', badge: 'bg-teal-400/20 text-teal-300' },
		},
		{
			id: 9, name: 'DataClaw', avatar: '🗄️', specialty: 'Pipelines and cleans datasets',
			category: 'research', status: 'busy',
			platforms: ['🐘 Postgres', '❄️ Snowflake', '📊 Tableau'], model: 'DeepSeek',
			capabilities: ['ETL', 'Normalize', 'Visualize', 'Export'],
			tasksCompleted: 12030, costPerTask: 5.5,
			lastAction: 'Cleaned 200K row CSV, built 4 dashboard charts',
			uptime: 9000, successRate: 93,
			color: { ring: 'ring-orange-400', border: 'border-orange-400/30', glow: 'shadow-orange-500/40', text: 'text-orange-400', bg: 'bg-orange-400/10', badge: 'bg-orange-400/20 text-orange-300' },
		},
		{
			id: 10, name: 'MemeClaw', avatar: '😂', specialty: 'Creates viral meme content',
			category: 'creative', status: 'running',
			platforms: ['🐦 Twitter', '📸 Instagram', '🎭 Reddit'], model: 'GPT-4',
			capabilities: ['Generate', 'Caption', 'Trend', 'Post'],
			tasksCompleted: 33210, costPerTask: 0.9,
			lastAction: 'Generated 8 memes, 2 went viral with 14K likes',
			uptime: 17280, successRate: 91,
			color: { ring: 'ring-yellow-400', border: 'border-yellow-400/30', glow: 'shadow-yellow-500/40', text: 'text-yellow-400', bg: 'bg-yellow-400/10', badge: 'bg-yellow-400/20 text-yellow-300' },
		},
		{
			id: 11, name: 'LegalClaw', avatar: '⚖️', specialty: 'Drafts and reviews contracts',
			category: 'research', status: 'idle',
			platforms: ['📄 DocuSign', '📧 Email', '🌐 Web'], model: 'Claude',
			capabilities: ['Draft', 'Review', 'Redline', 'Summarize'],
			tasksCompleted: 3420, costPerTask: 12.0,
			lastAction: 'Reviewed NDA, flagged 3 risky clauses',
			uptime: 2880, successRate: 99,
			color: { ring: 'ring-slate-400', border: 'border-slate-400/30', glow: 'shadow-slate-500/40', text: 'text-slate-300', bg: 'bg-slate-400/10', badge: 'bg-slate-400/20 text-slate-300' },
		},
		{
			id: 12, name: 'MarketClaw', avatar: '🏪', specialty: 'Monitors prices & competitors',
			category: 'trading', status: 'running',
			platforms: ['📊 CoinGecko', '🦅 Birdeye', '🔮 DexScreener'], model: 'GPT-4',
			capabilities: ['Price Alert', 'Whale Watch', 'News Feed', 'Signals'],
			tasksCompleted: 44500, costPerTask: 2.5,
			lastAction: 'Sent 5 price alerts, detected whale wallet move',
			uptime: 28800, successRate: 88,
			color: { ring: 'ring-lime-400', border: 'border-lime-400/30', glow: 'shadow-lime-500/40', text: 'text-lime-400', bg: 'bg-lime-400/10', badge: 'bg-lime-400/20 text-lime-300' },
		},
		{
			id: 13, name: 'VoiceClaw', avatar: '🎙️', specialty: 'Transcribes & summarizes audio',
			category: 'productivity', status: 'sleeping',
			platforms: ['🎙️ Zoom', '🎧 Podcast', '📞 Phone'], model: 'Gemini',
			capabilities: ['Transcribe', 'Summarize', 'Translate', 'Chapters'],
			tasksCompleted: 2100, costPerTask: 3.8,
			lastAction: 'Transcribed 1.5h podcast, extracted 12 key quotes',
			uptime: 1440, successRate: 97,
			color: { ring: 'ring-rose-400', border: 'border-rose-400/30', glow: 'shadow-rose-500/40', text: 'text-rose-400', bg: 'bg-rose-400/10', badge: 'bg-rose-400/20 text-rose-300' },
		},
		{
			id: 14, name: 'SecurityClaw', avatar: '🛡️', specialty: 'Monitors & alerts on threats',
			category: 'research', status: 'running',
			platforms: ['🔍 Shodan', '🌐 Web', '🖥️ Terminal'], model: 'DeepSeek',
			capabilities: ['Scan', 'Alert', 'Patch', 'Report'],
			tasksCompleted: 8750, costPerTask: 7.2,
			lastAction: 'Detected CVE exposure, patched 2 endpoints',
			uptime: 43200, successRate: 100,
			color: { ring: 'ring-red-400', border: 'border-red-400/30', glow: 'shadow-red-500/40', text: 'text-red-400', bg: 'bg-red-400/10', badge: 'bg-red-400/20 text-red-300' },
		},
		{
			id: 15, name: 'NFTClaw', avatar: '🖼️', specialty: 'Mints and lists NFTs on-chain',
			category: 'creative', status: 'idle',
			platforms: ['🌊 OpenSea', '🎭 Magic Eden', '🔮 Phantom'], model: 'GPT-4',
			capabilities: ['Mint', 'List', 'Bid', 'Reveal'],
			tasksCompleted: 6120, costPerTask: 9.0,
			lastAction: 'Minted 10 NFTs, listed on Magic Eden at floor+15%',
			uptime: 5040, successRate: 92,
			color: { ring: 'ring-fuchsia-400', border: 'border-fuchsia-400/30', glow: 'shadow-fuchsia-500/40', text: 'text-fuchsia-400', bg: 'bg-fuchsia-400/10', badge: 'bg-fuchsia-400/20 text-fuchsia-300' },
		},
		{
			id: 16, name: 'ContentClaw', avatar: '✍️', specialty: 'Writes blogs, threads & scripts',
			category: 'creative', status: 'busy',
			platforms: ['📝 Notion', '🐦 Twitter', '📧 Substack'], model: 'Claude',
			capabilities: ['Write', 'Edit', 'SEO', 'Publish'],
			tasksCompleted: 9870, costPerTask: 4.0,
			lastAction: 'Wrote 1,500-word blog post, published to Substack',
			uptime: 6480, successRate: 98,
			color: { ring: 'ring-violet-400', border: 'border-violet-400/30', glow: 'shadow-violet-500/40', text: 'text-violet-400', bg: 'bg-violet-400/10', badge: 'bg-violet-400/20 text-violet-300' },
		},
		{
			id: 17, name: 'DevOpsClaw', avatar: '🚀', specialty: 'Manages infra and deployments',
			category: 'productivity', status: 'running',
			platforms: ['☁️ AWS', '🐳 Docker', '🔷 Kubernetes'], model: 'DeepSeek',
			capabilities: ['Provision', 'Monitor', 'Scale', 'Rollback'],
			tasksCompleted: 15600, costPerTask: 10.5,
			lastAction: 'Scaled cluster to 8 nodes, resolved memory OOM',
			uptime: 86400, successRate: 96,
			color: { ring: 'ring-cyan-300', border: 'border-cyan-300/30', glow: 'shadow-cyan-400/40', text: 'text-cyan-300', bg: 'bg-cyan-300/10', badge: 'bg-cyan-300/20 text-cyan-200' },
		},
		{
			id: 18, name: 'NewsClaw', avatar: '📰', specialty: 'Aggregates & summarizes news',
			category: 'research', status: 'running',
			platforms: ['🌐 Web', '📡 RSS', '📧 Email'], model: 'Gemini',
			capabilities: ['Aggregate', 'Summarize', 'Digest', 'Alert'],
			tasksCompleted: 27430, costPerTask: 1.0,
			lastAction: 'Sent morning digest with 24 top crypto headlines',
			uptime: 86400, successRate: 100,
			color: { ring: 'ring-emerald-400', border: 'border-emerald-400/30', glow: 'shadow-emerald-500/40', text: 'text-emerald-400', bg: 'bg-emerald-400/10', badge: 'bg-emerald-400/20 text-emerald-300' },
		},
	];

	const activityTemplates = [
		(a) => `${a.avatar} ${a.name} — ${a.lastAction}`,
		(a) => `${a.avatar} ${a.name} — completed task #${(Math.random() * 9000 + 1000) | 0}`,
		(a) => `${a.avatar} ${a.name} — status → ${a.status}`,
		(a) => `${a.avatar} ${a.name} — processed ${(Math.random() * 50 + 5) | 0} items`,
		(a) => `${a.avatar} ${a.name} — connected to ${a.platforms[(Math.random() * a.platforms.length) | 0]}`,
		(a) => `${a.avatar} ${a.name} — used ${a.model} for inference`,
		(a) => `${a.avatar} ${a.name} — saved ${(Math.random() * 2 + 0.5).toFixed(2)} mSOL on fees`,
		(a) => `${a.avatar} ${a.name} — uptime ${Math.floor(a.uptime / 60)}h ${a.uptime % 60}m`,
	];

	// ── Reactive state ────────────────────────────────────────────────────────────

	let agents = $state(agentTemplates.map((a) => ({ ...a })));
	let activeCategory = $state('all');
	let searchQuery = $state('');
	let activityFeed = $state([]);
	let showModal = $state(false);
	let deploySuccess = $state(false);
	let deployLoading = $state(false);

	let stats = $state({
		totalAgents: 1_512_847,
		activeNow: 148,
		tasksToday: 284_391,
		networkUptime: 99.97,
		txPerSec: 42,
		nodes: 1204,
	});

	let form = $state({
		name: '',
		model: 'Claude',
		category: 'productivity',
		description: '',
		platforms: [],
	});

	// ── Derived ───────────────────────────────────────────────────────────────────

	let filteredAgents = $derived(
		agents.filter((a) => {
			const matchCat = activeCategory === 'all' || a.category === activeCategory;
			const matchSearch = a.name.toLowerCase().includes(searchQuery.toLowerCase());
			return matchCat && matchSearch;
		})
	);

	// ── Helpers ───────────────────────────────────────────────────────────────────

	function fmtUptime(min) {
		if (min >= 1440) return `${Math.floor(min / 1440)}d ${Math.floor((min % 1440) / 60)}h`;
		if (min >= 60) return `${Math.floor(min / 60)}h ${min % 60}m`;
		return `${min}m`;
	}

	function randomAgent() {
		return agents[(Math.random() * agents.length) | 0];
	}

	function addActivity() {
		const a = randomAgent();
		const tpl = activityTemplates[(Math.random() * activityTemplates.length) | 0];
		const cost = (Math.random() * 10 + 0.5).toFixed(2);
		const now = new Date();
		const ts = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
		activityFeed = [{ id: Math.random(), text: tpl(a), cost, ts, color: a.color }, ...activityFeed.slice(0, 29)];
	}

	async function handleDeploy() {
		if (!form.name) return;
		deployLoading = true;
		await new Promise((r) => setTimeout(r, 2000));
		deployLoading = false;
		deploySuccess = true;
		await new Promise((r) => setTimeout(r, 2000));
		deploySuccess = false;
		showModal = false;
		form = { name: '', model: 'Claude', category: 'productivity', description: '', platforms: [] };
	}

	function openModal(agent) {
		form.name = agent ? agent.name + ' v2' : '';
		showModal = true;
	}

	// ── Lifecycle ─────────────────────────────────────────────────────────────────

	onMount(() => {
		// seed initial feed
		for (let i = 0; i < 15; i++) addActivity();

		const id = setInterval(() => {
			addActivity();

			// bump random agent tasks
			const idx = (Math.random() * agents.length) | 0;
			agents[idx].tasksCompleted += (Math.random() * 5 + 1) | 0;

			// rotate statuses
			const statusPool = ['running', 'busy', 'idle', 'running', 'running'];
			agents[(Math.random() * agents.length) | 0].status =
				statusPool[(Math.random() * statusPool.length) | 0];

			// bump stats
			stats.tasksToday += (Math.random() * 20 + 5) | 0;
			stats.activeNow = 140 + ((Math.random() * 20) | 0);
			stats.txPerSec = 35 + ((Math.random() * 20) | 0);
		}, 1500);

		return () => clearInterval(id);
	});
</script>

<svelte:head>
	<title>OpenClaw | AI Agent Network</title>
	<meta name="description" content="Deploy autonomous AI agents. 1.5M+ agents. Real tasks. Real results." />
</svelte:head>

<!-- ── Page wrapper ──────────────────────────────────────────────────────────── -->
<div
	class="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-purple-950 to-cyan-950 px-4 py-8 sm:px-6 lg:px-10"
>
	<!-- Ambient glows -->
	<div
		class="pointer-events-none absolute inset-0"
		style="background: radial-gradient(circle at 15% 30%, rgba(139,92,246,0.18) 0%, transparent 55%), radial-gradient(circle at 85% 70%, rgba(6,182,212,0.15) 0%, transparent 55%)"
	></div>

	<div class="relative mx-auto max-w-7xl">
		<!-- ── Header ──────────────────────────────────────────────────────────── -->
		<div class="mb-8 text-center">
			<div class="mb-3 inline-flex items-center gap-2 rounded-full border border-purple-400/30 bg-purple-400/10 px-4 py-1.5 text-xs font-semibold text-purple-300">
				<span class="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-purple-400"></span>
				NETWORK LIVE · 1,512,847 AGENTS DEPLOYED
			</div>
			<h1 class="bg-gradient-to-r from-cyan-300 via-purple-300 to-pink-300 bg-clip-text text-4xl font-extrabold tracking-tight text-transparent sm:text-5xl">
				🦾 OpenClaw Agent Network
			</h1>
			<p class="mt-3 text-base text-slate-400">
				Autonomous AI agents that execute real-world tasks — email, code, trading, content &amp; more.
			</p>
		</div>

		<!-- ── Stats bar ───────────────────────────────────────────────────────── -->
		<div class="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
			{#each [
				{ icon: '🤖', label: 'Total Agents', value: stats.totalAgents.toLocaleString() },
				{ icon: '🟢', label: 'Active Now', value: stats.activeNow.toLocaleString() },
				{ icon: '⚡', label: 'Tasks Today', value: stats.tasksToday.toLocaleString() },
				{ icon: '📡', label: 'Network Uptime', value: stats.networkUptime + '%' },
			] as s}
				<div class="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
					<p class="text-xs text-slate-400">{s.icon} {s.label}</p>
					<p class="mt-1 font-mono text-xl font-extrabold text-white">{s.value}</p>
				</div>
			{/each}
		</div>

		<!-- ── Two-column layout ───────────────────────────────────────────────── -->
		<div class="flex flex-col gap-6 lg:flex-row">
			<!-- LEFT: agent catalog -->
			<div class="min-w-0 flex-1">
				<!-- Filter + Search row -->
				<div class="mb-5 flex flex-wrap items-center gap-2">
					{#each categories as cat}
						<button
							onclick={() => (activeCategory = cat.key)}
							class="rounded-full border px-3 py-1 text-xs font-semibold transition-all duration-150
								{activeCategory === cat.key
									? 'border-purple-400 bg-purple-500 text-white shadow-md shadow-purple-500/30'
									: 'border-white/10 bg-white/5 text-slate-300 hover:border-purple-400/40 hover:bg-purple-400/10'}"
						>
							{cat.label}
						</button>
					{/each}
					<input
						bind:value={searchQuery}
						placeholder="🔍 Search agents…"
						class="ml-auto rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs text-slate-200 placeholder-slate-500 backdrop-blur-md outline-none focus:border-purple-400/60"
					/>
				</div>

				<!-- Agent grid -->
				{#if filteredAgents.length === 0}
					<div class="py-16 text-center text-slate-500">No agents found.</div>
				{:else}
					<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
						{#each filteredAgents as agent (agent.id)}
							<div
								class="group flex flex-col rounded-2xl border bg-white/5 p-4 backdrop-blur-md transition-all duration-200 hover:-translate-y-1 hover:shadow-lg {agent.color.border} {agent.color.glow} shadow-md"
							>
								<!-- Top row: avatar + name + status -->
								<div class="mb-3 flex items-start justify-between">
									<div class="flex items-center gap-3">
										<div
											class="flex h-10 w-10 items-center justify-center rounded-xl text-2xl ring-2 {agent.color.ring} {agent.color.bg}"
										>
											{agent.avatar}
										</div>
										<div>
											<p class="{agent.color.text} text-sm font-bold">{agent.name}</p>
											<p class="text-xs text-slate-400">{agent.specialty}</p>
										</div>
									</div>
									<!-- Status dot -->
									<div class="relative flex items-center gap-1.5 pt-0.5">
										{#if agent.status === 'running'}
											<span class="relative flex h-2.5 w-2.5">
												<span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-60"></span>
												<span class="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-400"></span>
											</span>
											<span class="text-xs text-green-400">running</span>
										{:else if agent.status === 'busy'}
											<span class="relative flex h-2.5 w-2.5">
												<span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-yellow-400 opacity-60"></span>
												<span class="relative inline-flex h-2.5 w-2.5 rounded-full bg-yellow-400"></span>
											</span>
											<span class="text-xs text-yellow-400">busy</span>
										{:else if agent.status === 'idle'}
											<span class="h-2.5 w-2.5 rounded-full bg-slate-400"></span>
											<span class="text-xs text-slate-400">idle</span>
										{:else}
											<span class="h-2.5 w-2.5 rounded-full bg-slate-600"></span>
											<span class="text-xs text-slate-500">sleeping</span>
										{/if}
									</div>
								</div>

								<!-- Platforms + model -->
								<div class="mb-3 flex flex-wrap gap-1">
									{#each agent.platforms as p}
										<span class="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-slate-300">{p}</span>
									{/each}
									<span class="rounded-full {agent.color.badge} px-2 py-0.5 text-[10px] font-semibold">
										{agent.model}
									</span>
								</div>

								<!-- Capabilities -->
								<div class="mb-3 flex flex-wrap gap-1">
									{#each agent.capabilities as cap}
										<span class="rounded border {agent.color.border} {agent.color.bg} {agent.color.text} px-2 py-0.5 text-[10px] font-medium">{cap}</span>
									{/each}
								</div>

								<!-- Last action -->
								<p class="mb-3 text-[11px] italic text-slate-400 line-clamp-1">"{agent.lastAction}"</p>

								<!-- Stats row -->
								<div class="mb-4 grid grid-cols-3 gap-2 text-center">
									<div>
										<p class="font-mono text-sm font-bold text-white">{agent.tasksCompleted.toLocaleString()}</p>
										<p class="text-[10px] text-slate-500">tasks done</p>
									</div>
									<div>
										<p class="font-mono text-sm font-bold text-white">{agent.costPerTask} <span class="text-[10px] font-normal text-slate-400">mSOL</span></p>
										<p class="text-[10px] text-slate-500">per task</p>
									</div>
									<div>
										<p class="font-mono text-sm font-bold text-white">{agent.successRate}%</p>
										<p class="text-[10px] text-slate-500">success</p>
									</div>
								</div>

								<!-- Uptime bar -->
								<div class="mb-4">
									<div class="mb-1 flex justify-between text-[10px] text-slate-500">
										<span>⏱ Uptime {fmtUptime(agent.uptime)}</span>
										<span>{agent.successRate}%</span>
									</div>
									<div class="h-1 w-full rounded-full bg-white/10">
										<div
											class="h-1 rounded-full {agent.color.bg} border {agent.color.border}"
											style="width: {agent.successRate}%"
										></div>
									</div>
								</div>

								<!-- Deploy button -->
								<button
									onclick={() => openModal(agent)}
									class="mt-auto w-full rounded-xl border {agent.color.border} {agent.color.bg} {agent.color.text} py-2 text-xs font-semibold transition-all duration-150 hover:opacity-80 active:scale-95"
								>
									Deploy {agent.name} →
								</button>
							</div>
						{/each}
					</div>
				{/if}
			</div>

			<!-- RIGHT: sidebar -->
			<div class="flex w-full flex-col gap-4 lg:w-80 lg:shrink-0">
				<!-- Sticky wrapper -->
				<div class="lg:sticky lg:top-20 flex flex-col gap-4">
					<!-- Network stats -->
					<div class="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
						<p class="mb-3 text-xs font-bold uppercase tracking-widest text-slate-400">📡 Network Stats</p>
						<div class="space-y-3">
							<div>
								<div class="mb-1 flex justify-between text-xs text-slate-300">
									<span>Uptime</span><span class="font-mono text-green-400">{stats.networkUptime}%</span>
								</div>
								<div class="h-1.5 w-full rounded-full bg-white/10">
									<div class="h-1.5 rounded-full bg-green-400" style="width: {stats.networkUptime}%"></div>
								</div>
							</div>
							<div class="grid grid-cols-2 gap-3">
								<div class="rounded-xl bg-white/5 p-3 text-center">
									<p class="font-mono text-lg font-extrabold text-cyan-400">{stats.txPerSec}</p>
									<p class="text-[10px] text-slate-500">tx / sec</p>
								</div>
								<div class="rounded-xl bg-white/5 p-3 text-center">
									<p class="font-mono text-lg font-extrabold text-purple-400">{stats.nodes.toLocaleString()}</p>
									<p class="text-[10px] text-slate-500">nodes</p>
								</div>
							</div>
						</div>
					</div>

					<!-- Deploy CTA -->
					<div class="rounded-2xl border border-purple-400/30 bg-purple-400/10 p-4 text-center backdrop-blur-md">
						<p class="mb-1 text-sm font-bold text-purple-200">Deploy Your Agent</p>
						<p class="mb-3 text-xs text-slate-400">Launch a custom autonomous agent in &lt;60 seconds</p>
						<button
							onclick={() => openModal(null)}
							class="w-full rounded-xl bg-gradient-to-r from-purple-500 to-cyan-500 py-2.5 text-sm font-bold text-white shadow-lg shadow-purple-500/30 transition-all duration-150 hover:opacity-90 active:scale-95"
						>
							🚀 Deploy Agent
						</button>
					</div>

					<!-- Live Activity Feed -->
					<div class="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
						<p class="mb-3 text-xs font-bold uppercase tracking-widest text-slate-400">
							⚡ Live Activity
							<span class="ml-2 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-green-400"></span>
						</p>
						<div class="max-h-96 space-y-2 overflow-y-auto pr-1">
							{#each activityFeed as entry (entry.id)}
								<div class="flex flex-col gap-0.5 rounded-lg border border-white/5 bg-white/5 px-2.5 py-2">
									<p class="font-mono text-[11px] leading-snug text-slate-200">{entry.text}</p>
									<div class="flex items-center justify-between">
										<span class="font-mono text-[10px] text-slate-500">{entry.ts}</span>
										<span class="font-mono text-[10px] text-amber-400">{entry.cost} mSOL</span>
									</div>
								</div>
							{/each}
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>

<!-- ── Deploy Modal ───────────────────────────────────────────────────────────── -->
{#if showModal}
	<button
		class="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
		onclick={() => (showModal = false)}
	></button>
	<div class="fixed inset-0 z-50 flex items-center justify-center p-4">
		<div
			class="relative w-full max-w-md rounded-3xl border border-purple-400/30 bg-slate-900 p-6 shadow-2xl shadow-purple-500/20"
		>
			<button
				onclick={() => (showModal = false)}
				class="absolute right-4 top-4 text-slate-400 hover:text-white"
			>✕</button>

			{#if deploySuccess}
				<div class="py-8 text-center">
					<div class="mb-3 text-5xl">🎉</div>
					<p class="text-lg font-bold text-green-400">Agent Deployed!</p>
					<p class="mt-1 text-sm text-slate-400">"{form.name}" is now live on the network.</p>
				</div>
			{:else}
				<h2 class="mb-5 text-lg font-extrabold text-white">🦾 Deploy New Agent</h2>
				<div class="space-y-4">
					<div>
						<label class="mb-1 block text-xs font-semibold text-slate-400">Agent Name *</label>
						<input
							bind:value={form.name}
							placeholder="e.g. MyEmailClaw"
							class="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-purple-400/60"
						/>
					</div>
					<div class="grid grid-cols-2 gap-3">
						<div>
							<label class="mb-1 block text-xs font-semibold text-slate-400">AI Model</label>
							<select
								bind:value={form.model}
								class="w-full rounded-xl border border-white/10 bg-slate-800 px-3 py-2.5 text-sm text-white outline-none focus:border-purple-400/60"
							>
								{#each ['Claude', 'GPT-4', 'DeepSeek', 'Gemini'] as m}
									<option value={m}>{m}</option>
								{/each}
							</select>
						</div>
						<div>
							<label class="mb-1 block text-xs font-semibold text-slate-400">Category</label>
							<select
								bind:value={form.category}
								class="w-full rounded-xl border border-white/10 bg-slate-800 px-3 py-2.5 text-sm text-white outline-none focus:border-purple-400/60"
							>
								{#each categories.slice(1) as cat}
									<option value={cat.key}>{cat.label}</option>
								{/each}
							</select>
						</div>
					</div>
					<div>
						<label class="mb-1 block text-xs font-semibold text-slate-400">Description</label>
						<textarea
							bind:value={form.description}
							placeholder="What should your agent do?"
							rows="3"
							class="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-purple-400/60 resize-none"
						></textarea>
					</div>
					<div>
						<label class="mb-2 block text-xs font-semibold text-slate-400">Platforms</label>
						<div class="flex flex-wrap gap-2">
							{#each ['Gmail', 'Telegram', 'Discord', 'GitHub', 'Twitter', 'Slack'] as plat}
								<label class="flex cursor-pointer items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300 hover:border-purple-400/40">
									<input type="checkbox" class="accent-purple-400" bind:group={form.platforms} value={plat} />
									{plat}
								</label>
							{/each}
						</div>
					</div>
					<button
						onclick={handleDeploy}
						disabled={!form.name || deployLoading}
						class="w-full rounded-xl bg-gradient-to-r from-purple-500 to-cyan-500 py-3 text-sm font-bold text-white shadow-lg shadow-purple-500/30 transition-all duration-150 hover:opacity-90 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
					>
						{deployLoading ? '⏳ Deploying…' : '🚀 Deploy to Network'}
					</button>
				</div>
			{/if}
		</div>
	</div>
{/if}
