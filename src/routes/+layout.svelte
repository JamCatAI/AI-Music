<script>
	import '../app.css';
	import { page } from '$app/stores';
	import { fly, fade, scale } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { onMount, tick } from 'svelte';

	let { children } = $props();

	// ── Navigation Data ──
	const PRIMARY = [
		{ label: 'Jam.fun', emoji: '🚀', href: '/jam', category: 'Platform' },
		{ label: 'Swap', emoji: '🔄', href: '/swap', category: 'DeFi' },
		{ label: 'Portfolio', emoji: '💼', href: '/portfolio', category: 'Account' },
		{ label: 'CoinGecko', emoji: '🦎', href: '/coingecko', category: 'Market' },
		{ label: 'Coinbase', emoji: '🔵', href: '/coinbase', category: 'Market' },
		{
			label: 'Binance',
			emoji: '🟡',
			href: '/binance',
			category: 'Market',
			highlight: true,
			badge: 'TOP'
		},
		{
			label: 'Hyperliquid',
			emoji: '🟢',
			href: '/hyperliquid',
			category: 'Market',
			highlight: true,
			badge: 'HOT'
		}
	];

	const SECONDARY = [
		{ label: 'Solana', emoji: '◎', href: '/solana', category: 'Chain', highlight: true },
		{ label: 'Bitcoin', emoji: '₿', href: '/bitcoin', category: 'Chain', highlight: true },
		{ label: 'PendleFi', emoji: '⚡', href: '/pendle', category: 'DeFi', highlight: true },
		{ label: 'DEX', emoji: '📊', href: '/dex', category: 'DeFi' },
		{
			label: 'GeckoTerminal',
			emoji: '🦎',
			href: '/geckoterminal',
			category: 'DeFi',
			highlight: true,
			badge: 'NEW'
		},
		{ label: 'AI', emoji: '🧠', href: '/ai', category: 'Tech', highlight: true },
		{
			label: 'Codex',
			emoji: '🧩',
			href: '/codex',
			category: 'Tech',
			highlight: true,
			badge: 'NEW'
		},
		{
			label: 'GitHub',
			emoji: '📦',
			href: '/github',
			category: 'Tech',
			highlight: true,
			badge: 'NEW'
		},
		{
			label: 'Mythos',
			emoji: '🛡️',
			href: '/claude-mythos',
			category: 'Tech',
			highlight: true,
			badge: 'NEW'
		},
		{ label: 'x402', emoji: '🤖', href: '/x402', category: 'Tech', highlight: true, badge: 'NEW' },
		{ label: 'Claude', emoji: '🧪', href: '/claude', category: 'Tech', highlight: true },
		{ label: 'OpenAI', emoji: '🧠', href: '/openai', category: 'Tech', highlight: true },
		{
			label: 'OpenClaw',
			emoji: '⚡',
			href: '/openclaw',
			category: 'Tech',
			highlight: true,
			badge: 'NEW'
		},
		{ label: 'News', emoji: '📰', href: '/news', category: 'Fun', highlight: true },
		{ label: 'NFT', emoji: '🎵', href: '/drops', category: 'Platform' }
	];

	const MORE_GROUPS = [
		{
			label: 'Chains',
			color: 'from-violet-500/20 to-purple-500/20',
			icon: '⛓️',
			items: [
				{ label: 'Solana', emoji: '◎', href: '/solana' },
				{ label: 'Bitcoin', emoji: '₿', href: '/bitcoin' },
				{ label: 'Ethereum', emoji: 'Ξ', href: '/ethereum' },
				{ label: 'Avalanche', emoji: '▲', href: '/avax' },
				{ label: 'Cardano', emoji: '₳', href: '/cardano' }
			]
		},
		{
			label: 'More',
			color: 'from-emerald-500/20 to-cyan-500/20',
			icon: '✨',
			items: [
				{ label: 'Rewards', emoji: '🎁', href: '/rewards' },
				{ label: 'Bridge', emoji: '🌉', href: '/bridge' },
				{ label: 'Analytics', emoji: '📈', href: '/analytics' },
				{ label: 'Forbes', emoji: '🔴', href: '/forbes' },
				{ label: 'GPU', emoji: '🖥️', href: '/gpu' },
				{ label: 'Subagents', emoji: '🧬', href: '/subagents', highlight: true, badge: 'NEW' },
				{ label: 'Play', emoji: '🎮', href: '/play' },
				{ label: 'Games', emoji: '🎲', href: '/games' }
			]
		}
	];

	const MORE_ITEMS = MORE_GROUPS.flatMap((g) => g.items);
	const ALL_NAV_ITEMS = [...PRIMARY, ...SECONDARY, ...MORE_ITEMS];

	// ── State ──
	let moreOpen = $state(false);
	let searchOpen = $state(false);
	let mobileMenuOpen = $state(false);
	let searchQuery = $state('');
	let selectedIndex = $state(0);
	let secondaryVisible = $state(true);
	let lastScrollY = $state(0);
	let searchInputEl = $state(null);
	let isAtTop = $state(true);

	// ── Derived ──
	let activeInMore = $derived(MORE_ITEMS.some((t) => t.href === $page.url.pathname));
	let activeMoreTab = $derived(MORE_ITEMS.find((t) => t.href === $page.url.pathname));

	let filteredItems = $derived(
		searchQuery.trim() === ''
			? ALL_NAV_ITEMS
			: ALL_NAV_ITEMS.filter((item) => item.label.toLowerCase().includes(searchQuery.toLowerCase()))
	);

	// ── Event Handlers ──
	function handleOutside(e) {
		if (!e.target.closest('[data-more]')) moreOpen = false;
	}

	function handleKeydown(e) {
		if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
			e.preventDefault();
			searchOpen = true;
			tick().then(() => searchInputEl?.focus());
		}
		if (e.key === 'Escape') {
			searchOpen = false;
			mobileMenuOpen = false;
			moreOpen = false;
		}
		if (searchOpen) {
			if (e.key === 'ArrowDown') {
				e.preventDefault();
				selectedIndex = (selectedIndex + 1) % filteredItems.length;
			}
			if (e.key === 'ArrowUp') {
				e.preventDefault();
				selectedIndex = (selectedIndex - 1 + filteredItems.length) % filteredItems.length;
			}
			if (e.key === 'Enter' && filteredItems[selectedIndex]) {
				e.preventDefault();
				window.location.href = filteredItems[selectedIndex].href;
				searchOpen = false;
			}
		}
	}

	let rafId = $state(0);
	const HIDE_DELTA = 6;
	const SHOW_OFFSET = 14;

	function handleScroll() {
		if (rafId) return;
		rafId = requestAnimationFrame(() => {
			rafId = 0;
			const currentScrollY = window.scrollY;
			const delta = currentScrollY - lastScrollY;
			isAtTop = currentScrollY <= SHOW_OFFSET;

			if (currentScrollY <= 0) {
				secondaryVisible = true;
				lastScrollY = 0;
				return;
			}

			if (delta > HIDE_DELTA && currentScrollY > SHOW_OFFSET) {
				secondaryVisible = false;
			} else if (delta < -HIDE_DELTA || isAtTop) {
				secondaryVisible = true;
			}

			lastScrollY = Math.max(0, currentScrollY);
		});
	}

	onMount(() => {
		lastScrollY = window.scrollY;
		window.addEventListener('scroll', handleScroll, { passive: true });
		return () => {
			if (rafId) {
				cancelAnimationFrame(rafId);
				rafId = 0;
			}
			window.removeEventListener('scroll', handleScroll);
		};
	});
</script>

<svelte:window onclick={handleOutside} onkeydown={handleKeydown} />

<div class="min-h-screen bg-[#020207] text-white">
	<!-- ── Primary Navbar ── -->
	<nav class="sticky top-0 z-50 border-b border-white/[0.06] bg-black/80 backdrop-blur-2xl">
		<div
			class="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"
		></div>

		<div class="mx-auto flex max-w-7xl items-center px-4 py-3">
			<!-- Logo -->
			<a
				href="/"
				class="group mr-5 flex shrink-0 items-center gap-2.5 transition-all duration-300 hover:scale-[1.02]"
			>
				<span
					class="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500 via-rose-500 to-purple-600 text-sm shadow-lg shadow-pink-500/30 transition-shadow duration-300 group-hover:shadow-pink-500/50"
					>😺</span
				>
				<span class="text-[16px] font-black tracking-tight text-white">JamCat</span>
			</a>

			<!-- Divider -->
			<div class="mr-4 h-6 w-px shrink-0 bg-white/10"></div>

			<!-- Primary Tabs (Desktop) -->
			<div class="hidden min-w-0 flex-1 items-center gap-1 md:flex">
				{#each PRIMARY as tab (tab.href)}
					{@const active = $page.url.pathname === tab.href}
					<a
						href={tab.href}
						class="group relative flex items-center gap-1.5 rounded-xl px-3 py-2 text-[12px] font-semibold whitespace-nowrap transition-all duration-200
							{active
							? tab.highlight
								? 'border border-amber-500/30 bg-amber-500/20 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
								: 'bg-white/[0.08] text-white shadow-[0_0_20px_rgba(255,255,255,0.1)]'
							: tab.highlight
								? 'text-amber-400 hover:bg-amber-500/15 hover:text-amber-300'
								: 'text-white/50 hover:bg-white/[0.04] hover:text-white/90'}"
					>
						<span
							class="text-[13px] leading-none transition-transform duration-200 group-hover:scale-110"
							>{tab.emoji}</span
						>
						<span>{tab.label}</span>
						{#if tab.badge}
							<span
								class="ml-1 flex h-4 items-center justify-center rounded bg-amber-500/20 px-1.5 text-[8px] font-black text-amber-400"
								>{tab.badge}</span
							>
						{/if}
						{#if active && !tab.highlight}
							<span
								class="absolute inset-x-3 -bottom-px h-[2px] rounded-full bg-gradient-to-r from-transparent via-white/60 to-transparent"
							></span>
						{/if}
					</a>
				{/each}

				<!-- More Button -->
				<div class="relative ml-2 shrink-0" data-more>
					<button
						onclick={() => (moreOpen = !moreOpen)}
						data-more
						class="flex items-center gap-2 rounded-xl px-3 py-2 text-[12px] font-semibold transition-all duration-200
							{moreOpen || activeInMore
							? 'bg-white/[0.08] text-white'
							: 'text-white/50 hover:bg-white/[0.04] hover:text-white/90'}"
					>
						{#if activeInMore && activeMoreTab}
							<span class="text-[13px]">{activeMoreTab.emoji}</span>
							<span>{activeMoreTab.label}</span>
						{:else}
							<span class="text-[13px]">···</span>
							<span>More</span>
						{/if}
						<span
							class="ml-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-white/[0.08] px-1.5 text-[9px] font-bold text-white/60 transition-all duration-200 {moreOpen
								? 'scale-110 bg-white/15 text-white/80'
								: ''}"
						>
							{MORE_ITEMS.length}
						</span>
					</button>

					<!-- More Dropdown -->
					{#if moreOpen}
						<div
							class="absolute top-[calc(100%+12px)] right-0 w-72 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0a0a12]/98 shadow-2xl shadow-black/80 backdrop-blur-xl"
							data-more
							in:fly={{ y: -8, duration: 200, easing: cubicOut }}
							out:fade={{ duration: 100 }}
						>
							<div class="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>

							<div class="p-2">
								<!-- Header -->
								<div class="mb-2 flex items-center justify-between px-3 py-2">
									<span
										class="flex items-center gap-2 text-[11px] font-bold tracking-wider text-white/40 uppercase"
									>
										<span
											class="flex h-5 w-5 items-center justify-center rounded-md bg-white/5 text-[12px]"
											>📦</span
										>
										More Apps
									</span>
									<span class="flex items-center gap-1 text-[10px] text-white/20">
										<kbd class="rounded bg-white/5 px-1.5 py-0.5 font-mono text-[9px]">⌘</kbd>
										<kbd class="rounded bg-white/5 px-1.5 py-0.5 font-mono text-[9px]">K</kbd>
									</span>
								</div>

								<!-- Grouped Items -->
								<div class="space-y-2">
									{#each MORE_GROUPS as group (group.label)}
										<div class="rounded-xl bg-white/[0.02] p-1.5">
											<!-- Group Header -->
											<div class="mb-1 flex items-center gap-2 px-2 py-1.5">
												<div
													class="flex h-5 w-5 items-center justify-center rounded-md bg-gradient-to-br {group.color} text-[11px]"
												>
													{group.icon}
												</div>
												<span
													class="text-[10px] font-semibold tracking-wider text-white/50 uppercase"
													>{group.label}</span
												>
												<div class="flex-1"></div>
												<span
													class="rounded-full bg-white/5 px-1.5 py-0.5 text-[9px] font-medium text-white/30"
													>{group.items.length}</span
												>
											</div>

											<!-- Items Grid -->
											<div class="grid grid-cols-2 gap-1">
												{#each group.items as tab (tab.href)}
													{@const active = $page.url.pathname === tab.href}
													<a
														href={tab.href}
														onclick={() => (moreOpen = false)}
														class="group flex items-center gap-2 rounded-lg px-2.5 py-2 text-[12px] font-medium transition-all duration-150
															{active
															? 'bg-white/[0.08] text-white shadow-[0_0_10px_rgba(255,255,255,0.05)]'
															: 'text-white/50 hover:bg-white/[0.04] hover:text-white/90'}"
													>
														<span
															class="flex h-6 w-6 items-center justify-center rounded-md bg-white/[0.04] text-[13px] transition-transform duration-200 group-hover:scale-110"
														>
															{tab.emoji}
														</span>
														<span class="truncate">{tab.label}</span>
														{#if active}
															<svg
																class="ml-auto h-3.5 w-3.5 text-emerald-400"
																fill="none"
																stroke="currentColor"
																viewBox="0 0 24 24"
															>
																<path
																	stroke-linecap="round"
																	stroke-linejoin="round"
																	stroke-width="2.5"
																	d="M5 13l4 4L19 7"
																></path>
															</svg>
														{/if}
													</a>
												{/each}
											</div>
										</div>
									{/each}
								</div>

								<!-- Search CTA -->
								<button
									onclick={() => {
										moreOpen = false;
										searchOpen = true;
									}}
									class="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5 text-[12px] font-medium text-white/40 transition-all duration-200 hover:border-white/[0.12] hover:bg-white/[0.04] hover:text-white/70"
								>
									<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
										></path>
									</svg>
									<span>Open Full Search</span>
									<svg
										class="h-3.5 w-3.5 opacity-50"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M9 5l7 7-7 7"
										></path>
									</svg>
								</button>
							</div>
						</div>
					{/if}
				</div>

				<!-- Spacer -->
				<div class="flex-1"></div>

				<!-- Search Trigger -->
				<button
					onclick={() => {
						searchOpen = true;
						tick().then(() => searchInputEl?.focus());
					}}
					class="group ml-4 flex items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-2 text-[12px] text-white/40 transition-all duration-200 hover:border-white/[0.12] hover:bg-white/[0.04] hover:text-white/70"
				>
					<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
						></path>
					</svg>
					<span class="hidden lg:inline">Search...</span>
					<span class="hidden items-center gap-1 lg:flex">
						<kbd class="ml-2 rounded bg-white/[0.06] px-1.5 py-0.5 font-mono text-[10px]">⌘</kbd>
						<kbd class="rounded bg-white/[0.06] px-1.5 py-0.5 font-mono text-[10px]">K</kbd>
					</span>
				</button>
			</div>

			<!-- Mobile: Search + Hamburger -->
			<div class="flex items-center gap-2 md:hidden">
				<button
					onclick={() => {
						searchOpen = true;
						tick().then(() => searchInputEl?.focus());
					}}
					class="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.02] text-white/50 transition-colors hover:bg-white/[0.04]"
					aria-label="Search"
				>
					<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
						></path>
					</svg>
				</button>
				<button
					onclick={() => (mobileMenuOpen = !mobileMenuOpen)}
					class="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.02] text-white/50 transition-colors hover:bg-white/[0.04]"
					aria-label="Menu"
				>
					<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						{#if mobileMenuOpen}
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M6 18L18 6M6 6l12 12"
							></path>
						{:else}
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M4 6h16M4 12h16M4 18h16"
							></path>
						{/if}
					</svg>
				</button>
			</div>
		</div>

		<!-- ── Secondary Navbar (Desktop) ── -->
		<div
			class="hidden overflow-hidden border-t border-white/[0.04] bg-black/40 transition-all duration-300 md:block {secondaryVisible
				? 'max-h-16 translate-y-0 opacity-100'
				: 'max-h-0 -translate-y-full opacity-0 pointer-events-none'}"
		>
			<div class="mx-auto flex max-w-7xl items-center gap-1 px-3 py-1.5">
				{#each SECONDARY as tab (tab.href)}
					{@const active = $page.url.pathname === tab.href}
					<a
						href={tab.href}
						class="group relative flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-medium whitespace-nowrap transition-all duration-200
							{active
							? tab.highlight
								? 'border border-pink-500/30 bg-pink-500/20 text-pink-300'
								: 'bg-white/[0.06] text-white'
							: tab.highlight
								? 'text-pink-400 hover:bg-pink-500/15 hover:text-pink-300'
								: 'text-white/40 hover:bg-white/[0.03] hover:text-white/80'}"
					>
						<span class="text-[11px] transition-transform duration-200 group-hover:scale-110"
							>{tab.emoji}</span
						>
						<span>{tab.label}</span>
						{#if tab.badge}
							<span
								class="ml-1 flex h-3 items-center justify-center rounded bg-pink-500/20 px-0.5 text-[7px] font-black text-pink-400"
								>{tab.badge}</span
							>
						{/if}
					</a>
				{/each}
			</div>
		</div>
	</nav>

	<!-- ── Search Modal ── -->
	{#if searchOpen}
		<div
			class="fixed inset-0 z-[100] flex items-start justify-center bg-black/60 pt-[15vh] backdrop-blur-sm"
			transition:fade={{ duration: 150 }}
			onclick={(e) => {
				if (e.target === e.currentTarget) searchOpen = false;
			}}
		>
			<div
				class="w-full max-w-xl overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0a0a12] shadow-2xl"
				in:scale={{ start: 0.95, duration: 200, easing: cubicOut }}
				out:fade={{ duration: 100 }}
			>
				<!-- Search Input -->
				<div class="flex items-center gap-3 border-b border-white/[0.06] px-4 py-4">
					<svg class="h-5 w-5 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
						></path>
					</svg>
					<input
						bind:this={searchInputEl}
						bind:value={searchQuery}
						type="text"
						placeholder="Search pages..."
						class="flex-1 bg-transparent text-[15px] text-white placeholder-white/30 outline-none"
					/>
					<span class="flex items-center gap-1 text-[11px] text-white/30">
						<kbd class="rounded bg-white/[0.06] px-1.5 py-0.5 font-mono">↑↓</kbd>
						<span>to navigate</span>
						<kbd class="ml-2 rounded bg-white/[0.06] px-1.5 py-0.5 font-mono">Enter</kbd>
						<span>to select</span>
					</span>
				</div>

				<!-- Results -->
				<div class="max-h-[50vh] overflow-y-auto py-2">
					{#if filteredItems.length === 0}
						<div class="px-4 py-8 text-center text-[13px] text-white/30">
							No pages found matching "{searchQuery}"
						</div>
					{:else}
						{#each filteredItems as item, i (item.href)}
							<a
								href={item.href}
								onclick={() => (searchOpen = false)}
								onmouseenter={() => (selectedIndex = i)}
								class="group mx-2 flex items-center justify-between rounded-xl px-3 py-3 text-[13px] transition-all duration-150
									{selectedIndex === i
									? 'bg-white/[0.08] text-white'
									: 'text-white/60 hover:bg-white/[0.04] hover:text-white/90'}"
							>
								<div class="flex items-center gap-3">
									<span
										class="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.04] text-[15px]"
									>
										{item.emoji}
									</span>
									<div class="flex flex-col">
										<span class="font-medium">{item.label}</span>
									</div>
								</div>
								{#if $page.url.pathname === item.href}
									<span class="h-2 w-2 rounded-full bg-emerald-400"></span>
								{/if}
							</a>
						{/each}
					{/if}
				</div>

				<!-- Footer -->
				<div class="border-t border-white/[0.06] px-4 py-3">
					<div class="flex items-center justify-between text-[11px] text-white/20">
						<span>{filteredItems.length} pages available</span>
						<button
							onclick={() => (searchOpen = false)}
							class="rounded px-2 py-1 transition-colors hover:bg-white/[0.04] hover:text-white/50"
						>
							Press ESC to close
						</button>
					</div>
				</div>
			</div>
		</div>
	{/if}

	<!-- ── Mobile Menu (Bottom Sheet Style) ── -->
	{#if mobileMenuOpen}
		<!-- Backdrop -->
		<div
			class="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm md:hidden"
			transition:fade={{ duration: 200 }}
			onclick={() => (mobileMenuOpen = false)}
		></div>

		<!-- Bottom Sheet -->
		<div
			class="fixed right-0 bottom-0 left-0 z-50 max-h-[85vh] overflow-hidden rounded-t-3xl border-t border-white/[0.08] bg-[#0a0a12] shadow-2xl shadow-black md:hidden"
			in:fly={{ y: 100, duration: 300, easing: cubicOut }}
			out:fly={{ y: 100, duration: 200 }}
		>
			<!-- Drag Handle -->
			<button
				class="flex w-full justify-center pt-3 pb-2"
				onclick={() => (mobileMenuOpen = false)}
				aria-label="Close menu"
			>
				<div class="h-1.5 w-12 rounded-full bg-white/20"></div>
			</button>

			<!-- Header -->
			<div class="flex items-center justify-between border-b border-white/[0.06] px-5 py-3">
				<div class="flex items-center gap-3">
					<span
						class="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 text-lg"
						>😺</span
					>
					<div>
						<p class="text-sm font-bold text-white">JamCat</p>
						<p class="text-[10px] text-white/40">Navigation</p>
					</div>
				</div>
				<div class="flex items-center gap-2">
					<button
						onclick={() => {
							mobileMenuOpen = false;
							searchOpen = true;
							tick().then(() => searchInputEl?.focus());
						}}
						class="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.06] text-white/60 transition hover:bg-white/[0.1] hover:text-white"
					>
						<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
							></path>
						</svg>
					</button>
					<button
						onclick={() => (mobileMenuOpen = false)}
						class="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.06] text-white/60 transition hover:bg-white/[0.1] hover:text-white"
					>
						<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M6 18L18 6M6 6l12 12"
							></path>
						</svg>
					</button>
				</div>
			</div>

			<!-- Scrollable Content -->
			<div class="max-h-[60vh] overflow-y-auto px-3 py-4">
				<!-- Quick Actions Row -->
				<div class="mb-6 grid grid-cols-4 gap-2">
					{#each [{ label: 'Swap', emoji: '🔄', href: '/swap', color: 'from-emerald-500/20 to-teal-500/20' }, { label: 'Portfolio', emoji: '💼', href: '/portfolio', color: 'from-blue-500/20 to-cyan-500/20' }, { label: 'News', emoji: '📰', href: '/news', color: 'from-violet-500/20 to-purple-500/20' }, { label: 'Dex', emoji: '📊', href: '/dex', color: 'from-orange-500/20 to-red-500/20' }] as quick}
						{@const active = $page.url.pathname === quick.href}
						<a
							href={quick.href}
							onclick={() => (mobileMenuOpen = false)}
							class="flex flex-col items-center gap-1.5 rounded-xl border border-white/[0.06] bg-gradient-to-br {quick.color} p-3 transition-all active:scale-95 {active
								? 'ring-1 ring-white/20'
								: ''}"
						>
							<span class="text-xl">{quick.emoji}</span>
							<span class="text-[10px] font-bold text-white/80">{quick.label}</span>
						</a>
					{/each}
				</div>

				<!-- Markets Section -->
				<div class="mb-4">
					<p
						class="mb-2 flex items-center gap-2 px-2 text-[11px] font-black tracking-wider text-white/30 uppercase"
					>
						<span class="h-1 w-1 rounded-full bg-emerald-400"></span>
						Markets
					</p>
					<div class="grid grid-cols-2 gap-2">
						{#each PRIMARY.filter((t) => t.category === 'Market') as tab}
							{@const active = $page.url.pathname === tab.href}
							<a
								href={tab.href}
								onclick={() => (mobileMenuOpen = false)}
								class="group flex items-center gap-3 rounded-xl border border-white/[0.05] bg-white/[0.02] px-3 py-2.5 transition-all active:scale-95 {active
									? 'border-emerald-500/30 bg-emerald-500/10'
									: 'hover:bg-white/[0.04]'}"
							>
								<span
									class="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.05] text-lg group-active:scale-95"
									>{tab.emoji}</span
								>
								<div class="min-w-0 flex-1">
									<p class="truncate text-sm font-bold {active ? 'text-white' : 'text-white/70'}">
										{tab.label}
									</p>
								</div>
								{#if tab.badge}
									<span
										class="rounded bg-amber-500/20 px-1.5 py-0.5 text-[8px] font-black text-amber-400"
										>{tab.badge}</span
									>
								{/if}
								{#if active}
									<span class="h-2 w-2 rounded-full bg-emerald-400"></span>
								{/if}
							</a>
						{/each}
					</div>
				</div>

				<!-- DeFi Section -->
				<div class="mb-4">
					<p
						class="mb-2 flex items-center gap-2 px-2 text-[11px] font-black tracking-wider text-white/30 uppercase"
					>
						<span class="h-1 w-1 rounded-full bg-blue-400"></span>
						DeFi & Trading
					</p>
					<div class="grid grid-cols-2 gap-2">
						{#each SECONDARY.filter((t) => t.category === 'DeFi') as tab}
							{@const active = $page.url.pathname === tab.href}
							<a
								href={tab.href}
								onclick={() => (mobileMenuOpen = false)}
								class="group flex items-center gap-3 rounded-xl border border-white/[0.05] bg-white/[0.02] px-3 py-2.5 transition-all active:scale-95 {active
									? 'border-blue-500/30 bg-blue-500/10'
									: 'hover:bg-white/[0.04]'}"
							>
								<span
									class="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.05] text-lg group-active:scale-95"
									>{tab.emoji}</span
								>
								<div class="min-w-0 flex-1">
									<p class="truncate text-sm font-bold {active ? 'text-white' : 'text-white/70'}">
										{tab.label}
									</p>
								</div>
								{#if active}
									<span class="h-2 w-2 rounded-full bg-blue-400"></span>
								{/if}
							</a>
						{/each}
					</div>
				</div>

				<!-- Chains Section -->
				<div class="mb-4">
					<p
						class="mb-2 flex items-center gap-2 px-2 text-[11px] font-black tracking-wider text-white/30 uppercase"
					>
						<span class="h-1 w-1 rounded-full bg-violet-400"></span>
						Chains
					</p>
					<div class="grid grid-cols-2 gap-2">
						{#each SECONDARY.filter((t) => t.category === 'Chain') as tab}
							{@const active = $page.url.pathname === tab.href}
							<a
								href={tab.href}
								onclick={() => (mobileMenuOpen = false)}
								class="group flex items-center gap-3 rounded-xl border border-white/[0.05] bg-white/[0.02] px-3 py-2.5 transition-all active:scale-95 {active
									? 'border-violet-500/30 bg-violet-500/10'
									: 'hover:bg-white/[0.04]'}"
							>
								<span
									class="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.05] text-lg group-active:scale-95"
									>{tab.emoji}</span
								>
								<div class="min-w-0 flex-1">
									<p class="truncate text-sm font-bold {active ? 'text-white' : 'text-white/70'}">
										{tab.label}
									</p>
								</div>
								{#if tab.highlight}
									<span class="h-1.5 w-1.5 rounded-full bg-pink-400"></span>
								{/if}
								{#if active}
									<span class="h-2 w-2 rounded-full bg-violet-400"></span>
								{/if}
							</a>
						{/each}
					</div>
				</div>

				<!-- Tech Section -->
				<div class="mb-4">
					<p
						class="mb-2 flex items-center gap-2 px-2 text-[11px] font-black tracking-wider text-white/30 uppercase"
					>
						<span class="h-1 w-1 rounded-full bg-pink-400"></span>
						Tech & AI
					</p>
					<div class="grid grid-cols-2 gap-2">
						{#each SECONDARY.filter((t) => t.category === 'Tech') as tab}
							{@const active = $page.url.pathname === tab.href}
							<a
								href={tab.href}
								onclick={() => (mobileMenuOpen = false)}
								class="group flex items-center gap-3 rounded-xl border border-white/[0.05] bg-white/[0.02] px-3 py-2.5 transition-all active:scale-95 {active
									? 'border-pink-500/30 bg-pink-500/10'
									: 'hover:bg-white/[0.04]'}"
							>
								<span
									class="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.05] text-lg group-active:scale-95"
									>{tab.emoji}</span
								>
								<div class="min-w-0 flex-1">
									<p class="truncate text-sm font-bold {active ? 'text-white' : 'text-white/70'}">
										{tab.label}
									</p>
								</div>
								{#if tab.badge}
									<span
										class="rounded bg-pink-500/20 px-1.5 py-0.5 text-[8px] font-black text-pink-400"
										>{tab.badge}</span
									>
								{/if}
								{#if active}
									<span class="h-2 w-2 rounded-full bg-pink-400"></span>
								{/if}
							</a>
						{/each}
					</div>
				</div>

				<!-- More Items -->
				<div class="mb-4">
					<p
						class="mb-2 flex items-center gap-2 px-2 text-[11px] font-black tracking-wider text-white/30 uppercase"
					>
						<span class="h-1 w-1 rounded-full bg-white/40"></span>
						More
					</p>
					<div class="grid grid-cols-2 gap-2">
						{#each [...SECONDARY.filter((t) => !['DeFi', 'Chain', 'Tech'].includes(t.category)), ...MORE_ITEMS] as tab}
							{@const active = $page.url.pathname === tab.href}
							<a
								href={tab.href}
								onclick={() => (mobileMenuOpen = false)}
								class="group flex items-center gap-3 rounded-xl border border-white/[0.05] bg-white/[0.02] px-3 py-2.5 transition-all active:scale-95 {active
									? 'border-white/20 bg-white/[0.06]'
									: 'hover:bg-white/[0.04]'}"
							>
								<span
									class="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.05] text-lg group-active:scale-95"
									>{tab.emoji}</span
								>
								<div class="min-w-0 flex-1">
									<p class="truncate text-sm font-bold {active ? 'text-white' : 'text-white/70'}">
										{tab.label}
									</p>
								</div>
								{#if active}
									<span class="h-2 w-2 rounded-full bg-white/60"></span>
								{/if}
							</a>
						{/each}
					</div>
				</div>
			</div>

			<!-- Footer -->
			<div class="border-t border-white/[0.06] px-5 py-4">
				<div class="flex items-center justify-between">
					<span class="text-[10px] text-white/30">v2.0 • JamCat</span>
					<button
						onclick={() => (mobileMenuOpen = false)}
						class="flex items-center gap-2 rounded-lg bg-white/[0.06] px-4 py-2 text-xs font-bold text-white/70 transition hover:bg-white/[0.1] hover:text-white"
					>
						<span>Close</span>
						<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M19 9l-7 7-7-7"
							></path>
						</svg>
					</button>
				</div>
			</div>
		</div>
	{/if}

	<main class="relative">
		{@render children()}
	</main>
</div>

<style>
	:global(body) {
		background-color: #020207;
		margin: 0;
	}

	/* Custom scrollbar for search modal */
	::-webkit-scrollbar {
		width: 6px;
	}

	::-webkit-scrollbar-track {
		background: transparent;
	}

	::-webkit-scrollbar-thumb {
		background: rgba(255, 255, 255, 0.1);
		border-radius: 3px;
	}

	::-webkit-scrollbar-thumb:hover {
		background: rgba(255, 255, 255, 0.2);
	}
</style>
