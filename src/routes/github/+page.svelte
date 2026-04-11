<script>
	import { onMount } from 'svelte';

	// ── COLOR SYSTEM (GitHub Green spectrum) ──
	const githubColors = [
		{ ring: 'ring-green-400', text: 'text-green-400', bg: 'bg-green-400/10', border: 'border-green-400/30', glow: 'shadow-[0_0_20px_rgba(74,222,128,0.3)]', bar: 'bg-green-400' },
		{ ring: 'ring-emerald-400', text: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/30', glow: 'shadow-[0_0_20px_rgba(52,211,153,0.3)]', bar: 'bg-emerald-400' },
		{ ring: 'ring-teal-400', text: 'text-teal-400', bg: 'bg-teal-400/10', border: 'border-teal-400/30', glow: 'shadow-[0_0_20px_rgba(45,212,191,0.3)]', bar: 'bg-teal-400' },
		{ ring: 'ring-cyan-400', text: 'text-cyan-400', bg: 'bg-cyan-400/10', border: 'border-cyan-400/30', glow: 'shadow-[0_0_20px_rgba(34,211,238,0.3)]', bar: 'bg-cyan-400' },
		{ ring: 'ring-lime-400', text: 'text-lime-400', bg: 'bg-lime-400/10', border: 'border-lime-400/30', glow: 'shadow-[0_0_20px_rgba(163,230,53,0.3)]', bar: 'bg-lime-400' },
	];

	// ── DUMMY DATA ──
	const dummyRepos = [
		{ author: 'facebook', name: 'react', description: 'A declarative, efficient, and flexible JavaScript library for building user interfaces.', language: 'JavaScript', languageColor: '#f1e05a', stars: 213000, forks: 45000, currentPeriodStars: 234, url: 'https://github.com/facebook/react' },
		{ author: 'python', name: 'cpython', description: 'The Python programming language', language: 'Python', languageColor: '#3572A5', stars: 58000, forks: 29000, currentPeriodStars: 156, url: 'https://github.com/python/cpython' },
		{ author: 'microsoft', name: 'vscode', description: 'Visual Studio Code', language: 'TypeScript', languageColor: '#3178c6', stars: 159000, forks: 27000, currentPeriodStars: 189, url: 'https://github.com/microsoft/vscode' },
		{ author: 'rust-lang', name: 'rust', description: 'Empowering everyone to build reliable and efficient software.', language: 'Rust', languageColor: '#dea584', stars: 91000, forks: 12000, currentPeriodStars: 145, url: 'https://github.com/rust-lang/rust' },
		{ author: 'golang', name: 'go', description: 'The Go programming language', language: 'Go', languageColor: '#00ADD8', stars: 118000, forks: 16000, currentPeriodStars: 178, url: 'https://github.com/golang/go' },
		{ author: 'vercel', name: 'next.js', description: 'The React Framework', language: 'JavaScript', languageColor: '#f1e05a', stars: 115000, forks: 24000, currentPeriodStars: 267, url: 'https://github.com/vercel/next.js' },
		{ author: 'tensorflow', name: 'tensorflow', description: 'An Open Source Machine Learning Framework for Everyone', language: 'C++', languageColor: '#f34b7d', stars: 182000, forks: 89000, currentPeriodStars: 198, url: 'https://github.com/tensorflow/tensorflow' },
		{ author: 'apache', name: 'airflow', description: 'Apache Airflow - A platform to programmatically author, schedule and monitor workflows', language: 'Python', languageColor: '#3572A5', stars: 33000, forks: 13000, currentPeriodStars: 89, url: 'https://github.com/apache/airflow' },
		{ author: 'openai', name: 'gym', description: 'A toolkit for developing and comparing reinforcement learning algorithms.', language: 'Python', languageColor: '#3572A5', stars: 34000, forks: 8300, currentPeriodStars: 67, url: 'https://github.com/openai/gym' },
		{ author: 'facebook', name: 'pytorch', description: 'Tensors and Dynamic neural networks in Python with strong GPU acceleration', language: 'Python', languageColor: '#3572A5', stars: 77000, forks: 20000, currentPeriodStars: 234, url: 'https://github.com/pytorch/pytorch' },
		{ author: 'hashicorp', name: 'terraform', description: 'Terraform enables you to safely and predictably create, change, and improve infrastructure.', language: 'Go', languageColor: '#00ADD8', stars: 41000, forks: 9500, currentPeriodStars: 112, url: 'https://github.com/hashicorp/terraform' },
		{ author: 'dotnet', name: 'runtime', description: '.NET is a cross-platform runtime for cloud, mobile, desktop, and IoT apps.', language: 'C#', languageColor: '#178600', stars: 13000, forks: 2800, currentPeriodStars: 45, url: 'https://github.com/dotnet/runtime' },
	];

	const dummyLanguages = [
		{ name: 'JavaScript', count: 3 },
		{ name: 'Python', count: 4 },
		{ name: 'TypeScript', count: 1 },
		{ name: 'Rust', count: 1 },
		{ name: 'Go', count: 2 },
		{ name: 'C++', count: 1 },
	];

	// ── STATE ──
	let repos = $state([]);
	let languages = $state([]);
	let selectedLanguage = $state('all');
	let viewMode = $state('grid');
	let timeRange = $state('daily');

	let stats = $state({
		trendingRepos: 0,
		totalStarsToday: 0,
		activeContributors: 0,
		languagesTracked: 0
	});

	let sparklineData = $state(Array.from({ length: 12 }, () => Math.random() * 100));

	// ── DATA INITIALIZATION ──
	function initData() {
		repos = dummyRepos.map((repo, i) => ({
			...repo,
			color: githubColors[i % githubColors.length]
		}));
		languages = dummyLanguages;
		stats.trendingRepos = repos.length;
		stats.totalStarsToday = repos.reduce((sum, r) => sum + r.currentPeriodStars, 0);
		stats.activeContributors = repos.length * 15;
		stats.languagesTracked = languages.length;
	}

	// ── DERIVED STATE ──
	let filteredRepos = $derived(
		selectedLanguage === 'all' 
			? repos 
			: repos.filter(r => r.language === selectedLanguage)
	);

	// ── FORMATTERS ──
	const fmtNum = (n) => n.toLocaleString();
	const fmtStars = (n) => n >= 1000 ? (n / 1000).toFixed(1) + 'k' : n;

	onMount(() => {
		initData();

		// Update sparklines periodically
		const interval = setInterval(() => {
			sparklineData = sparklineData.map(() => Math.random() * 100);
		}, 3000);

		return () => clearInterval(interval);
	});
</script>

<div class="relative min-h-screen overflow-hidden bg-[#0d1117] text-white font-sans">

	<!-- Ambient background glows -->
	<div class="pointer-events-none absolute inset-0 overflow-hidden">
		<div class="absolute -top-40 left-1/4 h-96 w-96 rounded-full bg-green-500/8 blur-[120px]"></div>
		<div class="absolute bottom-0 right-1/4 h-96 w-96 rounded-full bg-emerald-500/6 blur-[140px]"></div>
		<div class="absolute top-1/2 left-0 h-64 w-64 rounded-full bg-teal-500/5 blur-[100px]"></div>
	</div>

	<div class="relative z-10 mx-auto max-w-7xl px-4 pb-16 pt-8 sm:px-6 lg:px-10">

		<!-- ── HEADER ── -->
		<header class="mb-8 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
			<div class="flex items-start gap-4">
				<div class="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-500/10 text-3xl shadow-2xl shadow-green-500/10 ring-1 ring-green-500/20">
					📦
				</div>
				<div>
					<h1 class="text-4xl font-black tracking-tighter text-white sm:text-5xl lg:text-6xl">
						GitHub
						<span class="bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">Trending</span>
					</h1>
					<p class="mt-2 max-w-lg text-sm text-white/40">Discover trending repositories across all languages with real-time metrics.</p>
					<div class="mt-3 flex items-center gap-4">
						<div class="flex items-center gap-2">
							<div class="h-2 w-2 animate-pulse rounded-full bg-green-400"></div>
							<span class="text-[10px] font-bold uppercase tracking-wider text-green-400/60">Live</span>
						</div>
					</div>
				</div>
			</div>

			<div class="flex items-center gap-3">
				<button onclick={() => viewMode = 'grid'}
					class="rounded-xl border px-3 py-2 text-sm transition {viewMode === 'grid' ? 'border-green-500/40 bg-green-500/10 text-green-400' : 'border-white/10 text-white/40 hover:text-white/70'}">
					⊞
				</button>
				<button onclick={() => viewMode = 'list'}
					class="rounded-xl border px-3 py-2 text-sm transition {viewMode === 'list' ? 'border-green-500/40 bg-green-500/10 text-green-400' : 'border-white/10 text-white/40 hover:text-white/70'}">
					☰
				</button>
			</div>
		</header>

		<!-- ── STATS BAR ── -->
		<div class="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
			{#each [
				{ label: 'Trending Repos', value: stats.trendingRepos, icon: '📦', key: 'repos' },
				{ label: 'Stars Today', value: fmtNum(stats.totalStarsToday), icon: '⭐', key: 'stars' },
				{ label: 'Contributors', value: fmtNum(stats.activeContributors), icon: '👥', key: 'contributors' },
				{ label: 'Languages', value: stats.languagesTracked, icon: '🌐', key: 'languages' },
			] as stat (stat.key)}
				<div class="group relative overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02] p-4 backdrop-blur-sm transition-all hover:scale-[1.02] hover:shadow-xl hover:shadow-green-500/10">
					<div class="flex justify-between items-start mb-2">
						<p class="text-[10px] uppercase tracking-widest text-white/30">{stat.icon} {stat.label}</p>
					</div>
					<p class="text-2xl font-extrabold text-white">{stat.value}</p>
					<div class="mt-3 h-6 flex items-end gap-0.5">
						{#each sparklineData as height, idx (idx)}
							<div class="flex-1 bg-gradient-to-t from-green-400/10 to-green-400/30 rounded-t transition-all" style="height: {height}%"></div>
						{/each}
					</div>
				</div>
			{/each}
		</div>

		<!-- ── TIME RANGE TOGGLE ── -->
		<div class="mb-6 flex items-center gap-2">
			<span class="text-[10px] font-bold uppercase tracking-widest text-white/30">Time Range:</span>
			{#each ['daily', 'weekly', 'monthly'] as range (range)}
				<button onclick={() => timeRange = range}
					class="rounded-lg border px-3 py-1.5 text-xs font-bold transition {timeRange === range ? 'border-green-500/40 bg-green-500/10 text-green-400' : 'border-white/10 text-white/40 hover:text-white/70'}">
					{range.charAt(0).toUpperCase() + range.slice(1)}
				</button>
			{/each}
		</div>

		<!-- ── LANGUAGE FILTER STRIP ── -->
		<div class="mb-8">
			<div class="mb-4 flex items-center gap-3">
				<span class="text-[10px] font-bold uppercase tracking-widest text-white/30">Filter by Language:</span>
			</div>
			<div class="flex gap-2 overflow-x-auto pb-2">
				<button onclick={() => selectedLanguage = 'all'}
					class="flex items-center gap-1.5 shrink-0 rounded-lg border px-3 py-1.5 text-xs font-bold transition {selectedLanguage === 'all' ? 'border-green-500/40 bg-green-500/10 text-green-400' : 'border-white/10 text-white/40 hover:text-white/70'}">
					<span>All</span>
				</button>
				{#each languages as lang (lang.name)}
					<button onclick={() => selectedLanguage = lang.name}
						class="flex items-center gap-1.5 shrink-0 rounded-lg border px-3 py-1.5 text-xs font-bold transition {selectedLanguage === lang.name ? 'border-green-500/40 bg-green-500/10 text-green-400' : 'border-white/10 text-white/40 hover:text-white/70'}">
						<span>{lang.name}</span>
					</button>
				{/each}
			</div>
		</div>

		<!-- ── REPO GRID ── -->
		<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{#each filteredRepos as repo (repo.author + '/' + repo.name)}
				<div class="group relative overflow-hidden rounded-xl border {repo.color.border} bg-white/[0.015] p-4 backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:{repo.color.glow}">
					
					<!-- Ambient glow -->
					<div class="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full {repo.color.bg} blur-2xl opacity-0 transition-opacity group-hover:opacity-100"></div>

					<!-- Header -->
					<div class="relative z-10 mb-4 flex items-start gap-3">
						<div class="h-10 w-10 rounded-full {repo.color.bg} flex items-center justify-center text-lg">
							{repo.author.charAt(0).toUpperCase()}
						</div>
						<div class="min-w-0 flex-1">
							<a href={repo.url} target="_blank" rel="noopener" class="text-sm font-bold text-white group-hover:{repo.color.text} transition-colors hover:underline block truncate">
								{repo.author}/{repo.name}
							</a>
							{#if repo.language}
								<span class="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[9px] font-bold mt-1" style="background:{repo.languageColor}22;color:{repo.languageColor}">
									<span class="h-1.5 w-1.5 rounded-full" style="background:{repo.languageColor}"></span>
									{repo.language}
								</span>
							{/if}
						</div>
					</div>

					<!-- Description -->
					<p class="relative z-10 mb-4 line-clamp-2 text-xs text-white/60">
						{repo.description}
					</p>

					<!-- Metrics -->
					<div class="relative z-10 mb-4 flex items-center gap-4 text-[10px]">
						<div class="flex items-center gap-1">
							<span class="text-white/50">⭐</span>
							<span class="font-bold text-white">{fmtStars(repo.stars)}</span>
						</div>
						<div class="flex items-center gap-1">
							<span class="text-white/50">🍴</span>
							<span class="font-bold text-white">{fmtStars(repo.forks)}</span>
						</div>
						{#if repo.currentPeriodStars > 0}
							<div class="flex items-center gap-1">
								<span class="{repo.color.text}">⭐</span>
								<span class="font-bold {repo.color.text}">+{fmtStars(repo.currentPeriodStars)} {timeRange}</span>
							</div>
						{/if}
					</div>

					<!-- Action -->
					<a href={repo.url} target="_blank" rel="noopener"
						class="relative z-10 flex items-center justify-center gap-2 rounded-lg {repo.color.bg} border {repo.color.border} py-2 text-[10px] font-bold {repo.color.text} transition hover:{repo.color.bg}">
						<span>View Repository</span>
						<span>→</span>
					</a>
				</div>
			{/each}
		</div>

	</div>
</div>

<style>
	.line-clamp-2 {
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
</style>
