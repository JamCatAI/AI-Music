<script>
	import { onMount } from 'svelte';

	// ── COLOR SYSTEM (Anthropic Orange/Red spectrum) ──
	const mythosColors = [
		{ ring: 'ring-orange-400', text: 'text-orange-400', bg: 'bg-orange-400/10', border: 'border-orange-400/30', glow: 'shadow-[0_0_20px_rgba(251,146,60,0.3)]', bar: 'bg-orange-400' },
		{ ring: 'ring-red-400', text: 'text-red-400', bg: 'bg-red-400/10', border: 'border-red-400/30', glow: 'shadow-[0_0_20px_rgba(248,113,113,0.3)]', bar: 'bg-red-400' },
		{ ring: 'ring-amber-400', text: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/30', glow: 'shadow-[0_0_20px_rgba(251,191,36,0.3)]', bar: 'bg-amber-400' },
		{ ring: 'ring-rose-400', text: 'text-rose-400', bg: 'bg-rose-400/10', border: 'border-rose-400/30', glow: 'shadow-[0_0_20px_rgba(251,113,133,0.3)]', bar: 'bg-rose-400' },
		{ ring: 'ring-pink-400', text: 'text-pink-400', bg: 'bg-pink-400/10', border: 'border-pink-400/30', glow: 'shadow-[0_0_20px_rgba(244,114,182,0.3)]', bar: 'bg-pink-400' },
	];

	// ── DUMMY DATA ──
	const vulnerabilities = [
		{ target: 'OpenBSD', type: 'Remote Crash', severity: 'Critical', age: '27 years', description: 'Allows attacker to remotely crash any machine by connecting to it', status: 'Patched' },
		{ target: 'FFmpeg', type: 'Buffer Overflow', severity: 'Critical', age: '16 years', description: 'Line of code hit 5M times by automated tools without detection', status: 'Patched' },
		{ target: 'Linux Kernel', type: 'Privilege Escalation', severity: 'Critical', age: 'Unknown', description: 'Chained vulnerabilities allowing user-to-root escalation', status: 'Patched' },
		{ target: 'Windows', type: 'Memory Corruption', severity: 'High', age: 'Unknown', description: 'Found in core kernel components', status: 'Patched' },
		{ target: 'Chrome', type: 'Use-After-Free', severity: 'High', age: 'Unknown', description: 'Renderer process vulnerability', status: 'Patched' },
		{ target: 'Firefox', type: 'Type Confusion', severity: 'High', age: 'Unknown', description: 'JavaScript engine flaw', status: 'Patched' },
		{ target: 'Safari', type: 'Arbitrary Code', severity: 'Critical', age: 'Unknown', description: 'WebKit browser engine issue', status: 'Patched' },
		{ target: 'Edge', type: 'Sandbox Escape', severity: 'Critical', age: 'Unknown', description: 'Chromium-based browser vulnerability', status: 'Patched' },
		{ target: 'macOS', type: 'Kernel', severity: 'High', age: 'Unknown', description: 'XNU kernel vulnerability', status: 'Patched' },
		{ target: 'Android', type: 'Privilege Escalation', severity: 'High', age: 'Unknown', description: 'Binder IPC vulnerability', status: 'Patched' },
		{ target: 'iOS', type: 'Sandbox', severity: 'Critical', age: 'Unknown', description: 'iOS kernel sandbox bypass', status: 'Patched' },
		{ target: 'OpenSSL', type: 'Crypto', severity: 'Critical', age: 'Unknown', description: 'TLS implementation flaw', status: 'Patched' },
	];

	const partners = [
		{ name: 'Amazon Web Services', type: 'Cloud', icon: '☁️' },
		{ name: 'Apple', type: 'Technology', icon: '🍎' },
		{ name: 'Broadcom', type: 'Technology', icon: '🔧' },
		{ name: 'Cisco', type: 'Networking', icon: '🌐' },
		{ name: 'CrowdStrike', type: 'Security', icon: '🛡️' },
		{ name: 'Google', type: 'Technology', icon: '🔍' },
		{ name: 'JPMorgan Chase', type: 'Finance', icon: '🏦' },
		{ name: 'Linux Foundation', type: 'Open Source', icon: '🐧' },
		{ name: 'Microsoft', type: 'Technology', icon: '💻' },
		{ name: 'NVIDIA', type: 'Hardware', icon: '🎮' },
		{ name: 'Palo Alto Networks', type: 'Security', icon: '🔐' },
	];

	// ── STATE ──
	let vulns = $state([]);
	let partnerList = $state([]);
	let selectedSeverity = $state('all');
	let viewMode = $state('grid');

	let stats = $state({
		totalVulns: 0,
		criticalVulns: 0,
		osAffected: 0,
		partners: 0
	});

	let sparklineData = $state(Array.from({ length: 12 }, () => Math.random() * 100));

	// ── DATA INITIALIZATION ──
	function initData() {
		vulns = vulnerabilities.map((vuln, i) => ({
			...vuln,
			color: mythosColors[i % mythosColors.length]
		}));
		partnerList = partners;
		stats.totalVulns = vulns.length;
		stats.criticalVulns = vulns.filter(v => v.severity === 'Critical').length;
		stats.osAffected = 8;
		stats.partners = partnerList.length;
	}

	// ── DERIVED STATE ──
	let filteredVulns = $derived(
		selectedSeverity === 'all' 
			? vulns 
			: vulns.filter(v => v.severity === selectedSeverity)
	);

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
		<div class="absolute -top-40 left-1/4 h-96 w-96 rounded-full bg-orange-500/8 blur-[120px]"></div>
		<div class="absolute bottom-0 right-1/4 h-96 w-96 rounded-full bg-red-500/6 blur-[140px]"></div>
		<div class="absolute top-1/2 left-0 h-64 w-64 rounded-full bg-amber-500/5 blur-[100px]"></div>
	</div>

	<div class="relative z-10 mx-auto max-w-7xl px-4 pb-16 pt-8 sm:px-6 lg:px-10">

		<!-- ── HEADER ── -->
		<header class="mb-8 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
			<div class="flex items-start gap-4">
				<div class="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500/20 to-red-500/10 text-3xl shadow-2xl shadow-orange-500/10 ring-1 ring-orange-500/20">
					🛡️
				</div>
				<div>
					<h1 class="text-4xl font-black tracking-tighter text-white sm:text-5xl lg:text-6xl">
						Claude
						<span class="bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">Mythos</span>
					</h1>
					<p class="mt-2 max-w-lg text-sm text-white/40">Anthropic's frontier AI model for cybersecurity vulnerability discovery and defense.</p>
					<div class="mt-3 flex items-center gap-4">
						<div class="flex items-center gap-2">
							<div class="h-2 w-2 animate-pulse rounded-full bg-orange-400"></div>
							<span class="text-[10px] font-bold uppercase tracking-wider text-orange-400/60">Project Glasswing</span>
						</div>
					</div>
				</div>
			</div>

			<div class="flex items-center gap-3">
				<button onclick={() => viewMode = 'grid'}
					class="rounded-xl border px-3 py-2 text-sm transition {viewMode === 'grid' ? 'border-orange-500/40 bg-orange-500/10 text-orange-400' : 'border-white/10 text-white/40 hover:text-white/70'}">
					⊞
				</button>
				<button onclick={() => viewMode = 'list'}
					class="rounded-xl border px-3 py-2 text-sm transition {viewMode === 'list' ? 'border-orange-500/40 bg-orange-500/10 text-orange-400' : 'border-white/10 text-white/40 hover:text-white/70'}">
					☰
				</button>
			</div>
		</header>

		<!-- ── STATS BAR ── -->
		<div class="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
			{#each [
				{ label: 'Vulnerabilities Found', value: stats.totalVulns, icon: '🔍', key: 'vulns' },
				{ label: 'Critical Severity', value: stats.criticalVulns, icon: '⚠️', key: 'critical' },
				{ label: 'OS Affected', value: stats.osAffected, icon: '💻', key: 'os' },
				{ label: 'Partners', value: stats.partners, icon: '🤝', key: 'partners' },
			] as stat (stat.key)}
				<div class="group relative overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02] p-4 backdrop-blur-sm transition-all hover:scale-[1.02] hover:shadow-xl hover:shadow-orange-500/10">
					<div class="flex justify-between items-start mb-2">
						<p class="text-[10px] uppercase tracking-widest text-white/30">{stat.icon} {stat.label}</p>
					</div>
					<p class="text-2xl font-extrabold text-white">{stat.value}</p>
					<div class="mt-3 h-6 flex items-end gap-0.5">
						{#each sparklineData as height, idx (idx)}
							<div class="flex-1 bg-gradient-to-t from-orange-400/10 to-orange-400/30 rounded-t transition-all" style="height: {height}%"></div>
						{/each}
					</div>
				</div>
			{/each}
		</div>

		<!-- ── SEVERITY FILTER ── -->
		<div class="mb-8">
			<div class="mb-4 flex items-center gap-3">
				<span class="text-[10px] font-bold uppercase tracking-widest text-white/30">Filter by Severity:</span>
			</div>
			<div class="flex gap-2 overflow-x-auto pb-2">
				<button onclick={() => selectedSeverity = 'all'}
					class="flex items-center gap-1.5 shrink-0 rounded-lg border px-3 py-1.5 text-xs font-bold transition {selectedSeverity === 'all' ? 'border-orange-500/40 bg-orange-500/10 text-orange-400' : 'border-white/10 text-white/40 hover:text-white/70'}">
					<span>All</span>
				</button>
				<button onclick={() => selectedSeverity = 'Critical'}
					class="flex items-center gap-1.5 shrink-0 rounded-lg border px-3 py-1.5 text-xs font-bold transition {selectedSeverity === 'Critical' ? 'border-orange-500/40 bg-orange-500/10 text-orange-400' : 'border-white/10 text-white/40 hover:text-white/70'}">
					<span>Critical</span>
				</button>
				<button onclick={() => selectedSeverity = 'High'}
					class="flex items-center gap-1.5 shrink-0 rounded-lg border px-3 py-1.5 text-xs font-bold transition {selectedSeverity === 'High' ? 'border-orange-500/40 bg-orange-500/10 text-orange-400' : 'border-white/10 text-white/40 hover:text-white/70'}">
					<span>High</span>
				</button>
			</div>
		</div>

		<!-- ── VULNERABILITY GRID ── -->
		<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{#each filteredVulns as vuln (vuln.target + vuln.type)}
				<div class="group relative overflow-hidden rounded-xl border {vuln.color.border} bg-white/[0.015] p-4 backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:{vuln.color.glow}">
					
					<!-- Ambient glow -->
					<div class="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full {vuln.color.bg} blur-2xl opacity-0 transition-opacity group-hover:opacity-100"></div>

					<!-- Header -->
					<div class="relative z-10 mb-4 flex items-start justify-between">
						<div class="flex-1">
							<h3 class="text-sm font-bold text-white group-hover:{vuln.color.text} transition-colors">
								{vuln.target}
							</h3>
							<p class="text-[10px] text-white/40 mt-1">{vuln.type}</p>
						</div>
						<span class="px-2 py-1 rounded-full text-[9px] font-bold {vuln.severity === 'Critical' ? 'bg-red-500/20 text-red-400' : 'bg-orange-500/20 text-orange-400'}">
							{vuln.severity}
						</span>
					</div>

					<!-- Description -->
					<p class="relative z-10 mb-4 line-clamp-2 text-xs text-white/60">
						{vuln.description}
					</p>

					<!-- Metadata -->
					<div class="relative z-10 mb-4 flex items-center gap-4 text-[10px]">
						<div class="flex items-center gap-1">
							<span class="text-white/50">📅</span>
							<span class="font-bold text-white">{vuln.age}</span>
						</div>
						<div class="flex items-center gap-1">
							<span class="text-white/50">✓</span>
							<span class="font-bold {vuln.color.text}">{vuln.status}</span>
						</div>
					</div>

					<!-- Action -->
					<div class="relative z-10 flex items-center justify-center rounded-lg {vuln.color.bg} border {vuln.color.border} py-2 text-[10px] font-bold {vuln.color.text}">
						<span>View Details</span>
					</div>
				</div>
			{/each}
		</div>

		<!-- ── PARTNERS SECTION ── -->
		<div class="mt-12">
			<h2 class="text-2xl font-black text-white mb-6">Project Glasswing Partners</h2>
			<div class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
				{#each partnerList as partner (partner.name)}
					<div class="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-4 backdrop-blur-sm">
						<span class="text-2xl">{partner.icon}</span>
						<div>
							<p class="text-sm font-bold text-white">{partner.name}</p>
							<p class="text-[10px] text-white/40">{partner.type}</p>
						</div>
					</div>
				{/each}
			</div>
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
