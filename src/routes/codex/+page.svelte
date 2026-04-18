<script>
	import { onMount } from 'svelte';

	const desks = [
		{ id: 'queue', label: 'Queue', icon: '📥' },
		{ id: 'patches', label: 'Patches', icon: '🩹' },
		{ id: 'runs', label: 'Runs', icon: '🧪' },
		{ id: 'notes', label: 'Notes', icon: '🗒️' }
	];

	const initialWork = [
		{
			id: 'w-1',
			desk: 'queue',
			priority: 'P1',
			title: 'Add “Codex” to secondary bar',
			desc: 'Wire route + navigation item; keep search results in sync.',
			status: 'done',
			eta: '0:03',
			owner: 'You',
			tags: ['nav', 'ui']
		},
		{
			id: 'w-2',
			desk: 'queue',
			priority: 'P1',
			title: 'Ship a News-style layout for Codex',
			desc: 'Two-column layout with right rail widgets + refresh behavior.',
			status: 'in progress',
			eta: '0:12',
			owner: 'Codex',
			tags: ['ux', 'layout']
		},
		{
			id: 'w-3',
			desk: 'patches',
			priority: 'P2',
			title: 'Tighten Prettier scope for lint',
			desc: 'Lint fails due to repo-wide formatting drift; add a targeted format flow.',
			status: 'queued',
			eta: '0:08',
			owner: 'Codex',
			tags: ['tooling']
		},
		{
			id: 'w-4',
			desk: 'runs',
			priority: 'P2',
			title: 'Run lint/build for touched files',
			desc: 'Prefer scoped checks so signal stays high.',
			status: 'queued',
			eta: '0:05',
			owner: 'Codex',
			tags: ['ci', 'quality']
		},
		{
			id: 'w-5',
			desk: 'notes',
			priority: 'P3',
			title: 'Capture UX standards',
			desc: 'Document the “market strip + editorial + rail” layout recipe.',
			status: 'queued',
			eta: '0:10',
			owner: 'You',
			tags: ['docs']
		}
	];

	const activityTemplates = [
		() => '🧩 Route mounted: /codex',
		() => '🧪 Scoped prettier run completed',
		() => '🧭 Secondary bar updated',
		() => '📦 Navigation index rebuilt',
		() => '⚡ Refresh pulse received',
		() => '🧠 Queue reprioritized',
		() => '🛡️ Lint signal: clean for touched files'
	];

	let activeDesk = $state(desks[0].id);
	let workItems = $state(initialWork.map((w) => ({ ...w })));

	let isRefreshing = $state(false);
	let showRefreshSuccess = $state(false);
	let updatedAt = $state('');

	let activityFeed = $state([]);
	let spark = $state(Array.from({ length: 14 }, () => Math.random() * 100));

	let query = $state('');
	let statusFilter = $state('all'); // all | queued | in progress | done

	let filteredWork = $derived(
		workItems
			.filter((w) => (activeDesk ? w.desk === activeDesk : true))
			.filter((w) => (statusFilter === 'all' ? true : w.status === statusFilter))
			.filter((w) => {
				const q = query.trim().toLowerCase();
				if (!q) return true;
				return (
					w.title.toLowerCase().includes(q) ||
					w.desc.toLowerCase().includes(q) ||
					w.owner.toLowerCase().includes(q) ||
					w.tags.some((t) => t.toLowerCase().includes(q))
				);
			})
	);
	let counts = $derived({
		queue: workItems.filter((w) => w.desk === 'queue').length,
		patches: workItems.filter((w) => w.desk === 'patches').length,
		runs: workItems.filter((w) => w.desk === 'runs').length,
		notes: workItems.filter((w) => w.desk === 'notes').length
	});

	let stats = $derived({
		open: workItems.filter((w) => w.status !== 'done').length,
		done: workItems.filter((w) => w.status === 'done').length,
		p1: workItems.filter((w) => w.priority === 'P1' && w.status !== 'done').length,
		pulse: updatedAt || '—'
	});

	function statusTone(status) {
		if (status === 'done') return 'border-emerald-400/25 bg-emerald-400/10 text-emerald-200';
		if (status === 'in progress') return 'border-amber-400/25 bg-amber-400/10 text-amber-200';
		return 'border-white/10 bg-white/[0.04] text-white/50';
	}

	function priorityTone(p) {
		if (p === 'P1') return 'text-fuchsia-300 bg-fuchsia-400/10 border-fuchsia-400/20';
		if (p === 'P2') return 'text-cyan-300 bg-cyan-400/10 border-cyan-400/20';
		return 'text-white/40 bg-white/[0.03] border-white/10';
	}

	function addActivity(text) {
		const now = new Date();
		const ts = now.toLocaleTimeString([], {
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit'
		});
		activityFeed = [{ id: `${now.getTime()}-${Math.random()}`, text, ts }, ...activityFeed].slice(
			0,
			18
		);
	}

	function pulse() {
		spark = spark.map(() => Math.random() * 100);
		updatedAt = new Date().toLocaleTimeString([], {
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit'
		});
	}

	async function handleRefresh() {
		if (isRefreshing) return;
		isRefreshing = true;
		showRefreshSuccess = false;
		addActivity('⚡ Refresh pulse received');
		await new Promise((r) => setTimeout(r, 650));

		// Lightweight “re-rank” effect: bubble one queued item up, flip one queued → in progress.
		const idxQueued = workItems.findIndex((w) => w.status === 'queued' && w.desk === activeDesk);
		if (idxQueued >= 0) {
			const item = workItems[idxQueued];
			workItems = [item, ...workItems.slice(0, idxQueued), ...workItems.slice(idxQueued + 1)];
			addActivity(`🧠 Reprioritized: ${item.title}`);
		}

		const idxAnyQueued = workItems.findIndex((w) => w.status === 'queued');
		if (idxAnyQueued >= 0) {
			workItems[idxAnyQueued].status = 'in progress';
			addActivity(`🧪 Started: ${workItems[idxAnyQueued].title}`);
		}

		pulse();
		isRefreshing = false;
		showRefreshSuccess = true;
		setTimeout(() => (showRefreshSuccess = false), 1200);
	}

	function markDone(id) {
		const i = workItems.findIndex((w) => w.id === id);
		if (i < 0) return;
		workItems[i].status = 'done';
		addActivity(`✅ Done: ${workItems[i].title}`);
		pulse();
	}

	function focusSearch() {
		const el = document.querySelector('[data-codex-search]');
		if (el instanceof HTMLInputElement) el.focus();
	}

	onMount(() => {
		pulse();
		addActivity('🧩 Route mounted: /codex');
		addActivity('🧭 Secondary bar updated');

		const iv = setInterval(() => {
			const tmpl = activityTemplates[(Math.random() * activityTemplates.length) | 0];
			addActivity(tmpl());
			if (Math.random() > 0.55) pulse();
		}, 2200);

		const onKey = (e) => {
			if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
				e.preventDefault();
				focusSearch();
			}
		};
		window.addEventListener('keydown', onKey);

		return () => {
			clearInterval(iv);
			window.removeEventListener('keydown', onKey);
		};
	});
</script>

<svelte:head>
	<title>Codex | JamCat</title>
	<meta
		name="description"
		content="Codex — a focused workspace for building, patching, and shipping small changes fast."
	/>
</svelte:head>

<div class="relative min-h-screen overflow-hidden bg-[#070812] text-white">
	<!-- Ambient glow -->
	<div class="pointer-events-none absolute inset-0 overflow-hidden">
		<div
			class="absolute -top-40 left-1/3 h-[520px] w-[520px] rounded-full bg-emerald-400/10 blur-[140px]"
		></div>
		<div
			class="absolute top-1/2 -right-24 h-[420px] w-[420px] rounded-full bg-cyan-400/8 blur-[120px]"
		></div>
		<div
			class="absolute -bottom-40 left-16 h-[360px] w-[360px] rounded-full bg-fuchsia-400/6 blur-[120px]"
		></div>
	</div>

	<!-- Subtle grid -->
	<div
		class="pointer-events-none absolute inset-0 opacity-[0.03]"
		style="background-image:linear-gradient(rgba(52,211,153,.7) 1px,transparent 1px),linear-gradient(90deg,rgba(52,211,153,.7) 1px,transparent 1px);background-size:44px 44px"
	></div>

	<div class="relative mx-auto max-w-7xl px-3 py-3 sm:px-6 sm:py-5 lg:px-10 lg:py-6">
		<!-- Masthead -->
		<header class="mb-3 border-b border-white/8 pb-2 sm:mb-4 sm:pb-3">
			<div
				class="mb-2.5 flex flex-col gap-2 sm:mb-3 sm:flex-row sm:items-end sm:justify-between sm:gap-4"
			>
				<div class="min-w-0">
					<p
						class="font-mono text-[9px] font-semibold tracking-[0.28em] text-emerald-300/80 uppercase sm:text-[10px] sm:tracking-[0.35em]"
					>
						JamCat · Build desk
					</p>
					<h1
						class="mt-0.5 text-[26px] leading-[1.05] font-black tracking-tight text-white sm:mt-1 sm:text-4xl"
					>
						Codex
						<span
							class="bg-gradient-to-r from-emerald-300 via-cyan-200 to-fuchsia-300 bg-clip-text text-transparent"
							>Workspace</span
						>
					</h1>
					<div
						class="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[10px] text-white/35 sm:mt-1.5 sm:gap-x-3 sm:text-xs"
					>
						<time datetime={new Date().toISOString()} class="line-clamp-1 text-white/60">
							{new Intl.DateTimeFormat('en-US', {
								weekday: 'long',
								month: 'long',
								day: 'numeric',
								year: 'numeric'
							}).format(new Date())}
						</time>
						<span class="hidden text-white/15 sm:inline">·</span>
						<a
							href="https://openai.com"
							target="_blank"
							rel="noreferrer"
							class="group inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[9px] font-black tracking-wide text-white/45 uppercase transition hover:border-emerald-400/30 hover:bg-emerald-400/10 hover:text-emerald-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/40"
						>
							<img src="/openai.svg" alt="" class="h-4 w-auto opacity-90 group-hover:opacity-100" />
							<span class="hidden sm:inline">Powered by OpenAI</span>
							<span class="sm:hidden">OpenAI</span>
						</a>
						<button
							type="button"
							onclick={handleRefresh}
							disabled={isRefreshing}
							class="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[9px] font-bold tracking-wide text-white/40 uppercase transition-all hover:border-white/20 hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/40 disabled:opacity-50"
						>
							{isRefreshing ? '⟳' : showRefreshSuccess ? '✓' : '↻'}
							{isRefreshing ? 'Refreshing...' : showRefreshSuccess ? 'Updated' : 'Refresh'}
						</button>
					</div>
				</div>
				<p class="hidden max-w-md font-sans text-sm leading-relaxed text-white/35 lg:block">
					Queue + rail widgets, tuned for tight iterations.
				</p>
			</div>

			<!-- Desk tabs -->
			<div
				class="flex items-center gap-1 overflow-x-auto pb-0.5 font-mono [-ms-overflow-style:none] [scrollbar-width:none] sm:flex-wrap sm:gap-1.5 sm:overflow-visible sm:pb-0 [&::-webkit-scrollbar]:hidden"
			>
				<span
					class="mr-0.5 shrink-0 text-[10px] font-bold tracking-widest text-white/30 uppercase sm:mr-1"
					>Desk</span
				>
				{#each desks as d (d.id)}
					<button
						type="button"
						onclick={() => (activeDesk = d.id)}
						class="group relative shrink-0 snap-start overflow-hidden rounded-lg border px-2 py-1 text-[10px] font-semibold transition-all duration-300 sm:px-2.5 sm:py-1.5 sm:text-[11px]
						{activeDesk === d.id
							? 'border-emerald-400/40 bg-emerald-400/10 text-white shadow-[0_0_20px_rgba(52,211,153,0.15)]'
							: 'border-white/10 bg-white/[0.03] text-white/45 hover:border-white/20 hover:bg-white/[0.06] hover:text-white/70'}"
					>
						{#if activeDesk === d.id}
							<div
								class="absolute inset-0 bg-gradient-to-r from-emerald-400/10 to-transparent"
							></div>
						{/if}
						<span class="relative z-10 flex items-center gap-1.5">
							<span aria-hidden="true">{d.icon}</span>
							{d.label}
							<span
								class="ml-1 rounded bg-white/5 px-1.5 py-0.5 text-[9px] font-black text-white/30"
							>
								{counts[d.id]}
							</span>
						</span>
					</button>
				{/each}
			</div>
		</header>

		<!-- Stats strip -->
		<div class="mb-3 font-mono sm:mb-4">
			<p
				class="mb-1.5 text-[9px] font-bold tracking-[0.2em] text-white/30 uppercase sm:mb-2.5 sm:text-[10px] sm:tracking-[0.25em]"
			>
				Session at a glance
			</p>
			<div class="grid grid-cols-4 gap-2 sm:gap-4">
				{#each [{ label: 'Open', value: stats.open.toString(), hi: true, trend: '●', key: 'open', icon: '📥' }, { label: 'Done', value: stats.done.toString(), trend: '↗', key: 'done', icon: '✅' }, { label: 'P1', value: stats.p1.toString(), trend: '⚡', key: 'p1', icon: '🧨' }, { label: 'Pulse', value: stats.pulse, trend: '●', key: 'pulse', icon: '⏱' }] as s (s.key)}
					<div
						class="group relative min-w-0 overflow-hidden rounded-xl border {s.hi
							? 'border-emerald-400/25 bg-gradient-to-br from-emerald-400/10 to-transparent'
							: 'border-white/8 bg-white/[0.02]'} p-2.5 backdrop-blur-sm transition-all duration-300 hover:border-white/15 hover:bg-white/[0.04] sm:p-3"
					>
						<div class="mb-1 flex items-center justify-between gap-2">
							<p
								class="truncate text-[8px] tracking-wide text-white/30 uppercase sm:text-[9px] sm:tracking-wider"
							>
								{s.icon}
								{s.label}
							</p>
							<span class="shrink-0 text-[9px] font-bold text-emerald-300/80 sm:text-[10px]"
								>{s.trend}</span
							>
						</div>
						<p
							class="truncate text-base font-bold tracking-tight sm:text-lg {s.hi
								? 'text-emerald-200'
								: 'text-white'}"
						>
							{s.value}
						</p>
						<div class="mt-1.5 hidden h-5 items-end gap-px lg:flex">
							{#each spark as height, idx (idx)}
								<div
									class="flex-1 rounded-sm bg-emerald-400/20 transition-all hover:bg-emerald-400/35"
									style="height: {height}%"
								></div>
							{/each}
						</div>
					</div>
				{/each}
			</div>
		</div>

		<!-- Body -->
		<div class="grid gap-3 lg:grid-cols-[1fr_320px] lg:items-start lg:gap-4">
			<!-- Main column -->
			<div class="flex min-w-0 flex-col gap-3 sm:gap-4">
				<!-- Lead card (News hero analogue) -->
				<article
					class="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent shadow-[0_24px_80px_-24px_rgba(0,0,0,0.7)] transition-all duration-500 hover:shadow-[0_32px_100px_-24px_rgba(0,0,0,0.8)] sm:rounded-3xl"
				>
					<div class="p-3 sm:p-4">
						<div
							class="mb-2.5 flex flex-wrap items-center gap-2 font-mono text-[9px] font-semibold tracking-wider text-emerald-300/80 uppercase sm:mb-3 sm:gap-3 sm:text-[10px]"
						>
							<span
								class="rounded-full bg-emerald-400/20 px-2 py-0.5 text-emerald-100 shadow-lg shadow-emerald-500/20 sm:px-2.5"
							>
								Lead task
							</span>
							<span
								class="rounded-full border border-white/15 bg-black/40 px-2 py-0.5 text-white/70 backdrop-blur-sm sm:px-2.5"
							>
								{activeDesk.toUpperCase()}
							</span>
						</div>
						<h2
							class="text-lg leading-snug font-black text-white sm:text-2xl md:text-3xl md:leading-[1.1]"
						>
							Keep changes small, verifiable, and shippable.
						</h2>
						<p
							class="mt-1.5 hidden max-w-3xl font-sans text-sm leading-relaxed text-white/40 lg:block"
						>
							Scan the queue, then use the rail to run checks and keep the session legible.
						</p>
						<div class="mt-2 flex flex-wrap gap-2">
							<a
								href="/subagents"
								class="rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-1.5 text-xs font-bold text-white/60 transition hover:border-emerald-400/30 hover:bg-emerald-400/10 hover:text-emerald-200"
								>🧬 Subagents</a
							>
							<a
								href="/ai-agent"
								class="rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-1.5 text-xs font-bold text-white/60 transition hover:border-cyan-400/30 hover:bg-cyan-400/10 hover:text-cyan-200"
								>🤖 AI Agent</a
							>
							<a
								href="/github"
								class="rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-1.5 text-xs font-bold text-white/60 transition hover:border-fuchsia-400/30 hover:bg-fuchsia-400/10 hover:text-fuchsia-200"
								>📦 GitHub</a
							>
						</div>
					</div>
				</article>

				<!-- Work queue -->
				<section aria-labelledby="work-queue">
					<div
						class="mb-2.5 flex flex-col gap-2 border-b border-white/10 pb-2 sm:flex-row sm:items-end sm:justify-between sm:gap-4"
					>
						<h2 id="work-queue" class="text-lg font-black text-white sm:text-xl">Work queue</h2>
						<div class="flex flex-wrap items-center gap-2">
							<div class="relative">
								<input
									data-codex-search
									bind:value={query}
									placeholder="Search…"
									class="w-[180px] rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[11px] font-semibold text-white/70 placeholder-white/25 transition outline-none focus:border-emerald-400/30 focus:ring-2 focus:ring-emerald-400/10 sm:w-[220px]"
								/>
								<span
									class="pointer-events-none absolute top-1/2 right-2 hidden -translate-y-1/2 items-center gap-1 rounded bg-white/5 px-1.5 py-0.5 text-[9px] font-black text-white/25 sm:flex"
								>
									<kbd class="font-mono">⌘</kbd><kbd class="font-mono">K</kbd>
								</span>
							</div>

							<div
								class="flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.02] p-0.5"
							>
								{#each ['all', 'queued', 'in progress', 'done'] as s (s)}
									<button
										type="button"
										onclick={() => (statusFilter = s)}
										class="rounded-md px-2.5 py-1 text-[10px] font-black uppercase transition
										{statusFilter === s ? 'bg-emerald-400/15 text-emerald-200' : 'text-white/35 hover:text-white/70'}"
									>
										{s === 'all' ? 'All' : s}
									</button>
								{/each}
							</div>

							<span class="font-mono text-[10px] tracking-widest text-white/30 uppercase">
								{filteredWork.length} items
							</span>
						</div>
					</div>

					<div class="space-y-2">
						{#if filteredWork.length === 0}
							<div class="rounded-2xl border border-white/10 bg-white/[0.02] p-6 text-center">
								<p class="text-sm font-black text-white/70">No matches</p>
								<p class="mt-1 text-xs text-white/35">
									Try clearing filters or a shorter search query.
								</p>
								<div class="mt-3 flex items-center justify-center gap-2">
									<button
										type="button"
										onclick={() => {
											query = '';
											statusFilter = 'all';
										}}
										class="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-[11px] font-black text-white/55 transition hover:border-white/20 hover:bg-white/[0.06] hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/40"
									>
										Clear
									</button>
								</div>
							</div>
						{:else}
							{#each filteredWork as item (item.id)}
								<div
									class="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] p-3 backdrop-blur-sm transition-all duration-300 focus-within:ring-2 focus-within:ring-emerald-400/15 hover:border-white/15 hover:bg-white/[0.04]"
								>
									<div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
										<div class="min-w-0">
											<div
												class="mb-2 flex flex-wrap items-center gap-2 font-mono text-[10px] font-semibold tracking-wide text-white/35 uppercase"
											>
												<span class="rounded border px-1.5 py-0.5 {priorityTone(item.priority)}"
													>{item.priority}</span
												>
												<span class="rounded border px-1.5 py-0.5 {statusTone(item.status)}"
													>{item.status}</span
												>
												<span class="text-white/20">·</span>
												<span class="text-white/40">ETA {item.eta}</span>
												<span class="text-white/20">·</span>
												<span class="text-white/40">Owner {item.owner}</span>
											</div>
											<p
												class="text-base font-black text-white transition-colors group-hover:text-emerald-200"
											>
												{item.title}
											</p>
											<p class="mt-1 line-clamp-2 text-sm text-white/40">{item.desc}</p>
											<div class="mt-2.5 flex flex-wrap gap-1.5">
												{#each item.tags as t (t)}
													<span
														class="rounded-lg border border-white/10 bg-white/[0.03] px-2 py-0.5 text-[10px] font-bold text-white/45"
													>
														#{t}
													</span>
												{/each}
											</div>
										</div>

										<div class="flex shrink-0 items-center gap-2">
											<button
												type="button"
												onclick={() => addActivity(`🔎 Opened: ${item.title}`)}
												class="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[11px] font-black text-white/55 transition hover:border-white/20 hover:bg-white/[0.06] hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/40"
											>
												Open
											</button>
											<button
												type="button"
												disabled={item.status === 'done'}
												onclick={() => markDone(item.id)}
												class="rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-[11px] font-black text-emerald-200 transition hover:border-emerald-400/40 hover:bg-emerald-400/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/40 disabled:cursor-not-allowed disabled:opacity-40"
											>
												Mark done
											</button>
										</div>
									</div>
								</div>
							{/each}
						{/if}
					</div>
				</section>
			</div>

			<!-- Right rail -->
			<div class="flex w-full shrink-0 flex-col gap-3 font-mono lg:sticky lg:top-20 lg:w-[320px]">
				<!-- Quick actions -->
				<div
					class="overflow-hidden rounded-2xl border border-white/5 bg-white/[0.015] backdrop-blur-sm"
				>
					<div
						class="flex items-center justify-between border-b border-white/5 bg-black/20 px-4 py-3"
					>
						<div class="flex items-center gap-2">
							<p class="text-sm font-bold text-white">⚡ Quick actions</p>
							<span
								class="rounded-sm bg-emerald-400/20 px-2 py-0.5 text-[9px] font-black tracking-wide text-emerald-100 uppercase shadow-[0_0_12px_rgba(52,211,153,0.25)]"
								>Live</span
							>
						</div>
						<span class="text-[10px] text-white/35">{updatedAt || '...'}</span>
					</div>
					<div class="p-2.5">
						<div class="grid grid-cols-2 gap-2">
							<button
								type="button"
								onclick={() => addActivity('🧪 Run: npm run lint (scoped)')}
								class="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[10px] font-black text-white/60 transition hover:border-emerald-400/30 hover:bg-emerald-400/10 hover:text-emerald-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/40"
							>
								🧪 Lint
							</button>
							<button
								type="button"
								onclick={() => addActivity('📦 Run: npm run build')}
								class="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[10px] font-black text-white/60 transition hover:border-cyan-400/30 hover:bg-cyan-400/10 hover:text-cyan-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/40"
							>
								📦 Build
							</button>
							<button
								type="button"
								onclick={() => addActivity('🩹 Patch queued: tidy formatting')}
								class="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[10px] font-black text-white/60 transition hover:border-fuchsia-400/30 hover:bg-fuchsia-400/10 hover:text-fuchsia-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/40"
							>
								🩹 Patch
							</button>
							<button
								type="button"
								onclick={() => addActivity('🗒️ Note captured: UX recipe')}
								class="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[10px] font-black text-white/60 transition hover:border-white/20 hover:bg-white/[0.06] hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/40"
							>
								🗒️ Note
							</button>
						</div>
					</div>
				</div>

				<!-- Recent runs -->
				<div
					class="overflow-hidden rounded-2xl border border-white/5 bg-white/[0.015] backdrop-blur-sm"
				>
					<div class="border-b border-white/5 bg-black/20 px-4 py-3">
						<div class="flex items-center gap-2">
							<p class="text-sm font-bold text-white">🧪 Recent runs</p>
						</div>
					</div>
					<ul class="divide-y divide-white/[0.04]">
						{#each [{ cmd: 'prettier --write src/routes/+layout.svelte src/routes/codex/+page.svelte', status: 'ok', dur: '1.69s' }, { cmd: 'npm run lint', status: 'warn', dur: '5.71s' }, { cmd: 'npm run dev', status: 'ok', dur: 'running' }] as run, i (run.cmd)}
							<li class="px-4 py-2.5 text-[11px] transition-colors hover:bg-white/[0.02]">
								<div class="flex items-start justify-between gap-3">
									<div class="min-w-0">
										<p class="truncate font-bold text-white/70">{run.cmd}</p>
										<p class="mt-0.5 text-[10px] text-white/30">Duration: {run.dur}</p>
									</div>
									<span
										class="shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-black uppercase
										{run.status === 'ok'
											? 'border-emerald-400/25 bg-emerald-400/10 text-emerald-200'
											: run.status === 'warn'
												? 'border-amber-400/25 bg-amber-400/10 text-amber-200'
												: 'border-red-400/25 bg-red-400/10 text-red-200'}">{run.status}</span
									>
								</div>
							</li>
						{/each}
					</ul>
				</div>

				<!-- Live activity -->
				<div class="rounded-2xl border border-white/8 bg-white/3 p-3.5 backdrop-blur-xl">
					<div class="mb-3 flex items-center gap-2">
						<span class="relative flex h-2 w-2">
							<span
								class="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"
							></span>
							<span class="relative inline-flex h-2 w-2 rounded-full bg-emerald-400"></span>
						</span>
						<p class="text-[10px] font-black tracking-widest text-white/30 uppercase">
							Live Activity
						</p>
					</div>
					<div class="max-h-64 space-y-1.5 overflow-y-auto pr-0.5">
						{#each activityFeed as entry (entry.id)}
							<div class="rounded-lg border border-white/4 bg-black/40 px-2.5 py-2">
								<p class="text-[10px] leading-snug text-white/55">{entry.text}</p>
								<div class="mt-0.5 flex justify-between">
									<span class="text-[9px] text-white/20">{entry.ts}</span>
									<span class="text-[9px] text-emerald-300/70">pulse</span>
								</div>
							</div>
						{/each}
					</div>
				</div>
			</div>
		</div>
	</div>
</div>

<style>
</style>
