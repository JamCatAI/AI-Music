<script>
	import '../app.css';
	import { page } from '$app/stores';
	import { fly, fade } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';

	let { children } = $props();

	const PRIMARY = [
		{ label: 'NFT',       emoji: '🎵', href: '/drops'     },
		{ label: 'Jam.fun',   emoji: '🚀', href: '/jam'       },
		{ label: 'Play',      emoji: '🎮', href: '/play'      },
		{ label: 'Swap',      emoji: '🔄', href: '/swap'      },
		{ label: 'CoinGecko', emoji: '🦎', href: '/coingecko' },
		{ label: 'Coinbase',  emoji: '🔵', href: '/coinbase'  },
		{ label: 'DEX',       emoji: '📊', href: '/dex'       },
		{ label: 'AI',        emoji: '🧠', href: '/ai'        },
		{ label: 'LLM',       emoji: '💬', href: '/llm'       },
		{ label: 'GPU',       emoji: '🖥️', href: '/gpu'       },
	];

	const MORE_GROUPS = [
		{
			label: 'Platform',
			tabs: [
				{ label: 'Airdrop',   emoji: '🪂', href: '/airdrop'   },
				{ label: 'Memes',     emoji: '🔥', href: '/memes'     },
				{ label: 'News',      emoji: '📰', href: '/news'      },
			]
		},
		{
			label: 'Trading',
			tabs: [
				{ label: 'Perps',     emoji: '📈', href: '/perps'     },
				{ label: 'Predict',   emoji: '🔮', href: '/predict'   },
				{ label: 'Alpha',     emoji: '📡', href: '/alpha'     },
			]
		},
		{
			label: 'Tech',
			tabs: [
				{ label: 'Subagents', emoji: '🧬', href: '/subagents' },
				{ label: 'NVIDIA',    emoji: '🟢', href: '/nvidia'    },
				{ label: 'x402',      emoji: '🤖', href: '/x402'      },
				{ label: 'OpenClaw',  emoji: '🦾', href: '/openclaw'  },
			]
		},
	];

	const ALL_MORE = MORE_GROUPS.flatMap(g => g.tabs);

	let moreOpen = $state(false);

	let activeInMore = $derived(ALL_MORE.some(t => t.href === $page.url.pathname));
	let activeMoreTab = $derived(ALL_MORE.find(t => t.href === $page.url.pathname));

	function handleOutside(e) {
		if (!e.target.closest('[data-more]')) moreOpen = false;
	}
</script>

<svelte:window onclick={handleOutside} />

<div class="min-h-screen bg-[#020207] text-white">

	<nav class="sticky top-0 z-50 border-b border-white/[0.06] bg-black/80 backdrop-blur-2xl">
		<!-- subtle top accent line -->
		<div class="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>

		<div class="mx-auto flex max-w-7xl items-center px-4 py-2.5">

			<!-- ── Logo ── -->
			<a href="/"
				class="group mr-5 flex shrink-0 items-center gap-2 transition-opacity hover:opacity-80">
				<span class="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 text-sm shadow-lg shadow-pink-500/30">😺</span>
				<span class="text-[15px] font-black tracking-tight text-white">JamCat</span>
			</a>

			<!-- ── divider ── -->
			<div class="mr-4 h-5 w-px shrink-0 bg-white/10"></div>

			<!-- ── Primary tabs ── -->
			<div class="flex min-w-0 flex-1 items-center gap-0.5">
				{#each PRIMARY as tab (tab.href)}
					{@const active = $page.url.pathname === tab.href}
					<a href={tab.href}
						class="group relative flex items-center gap-1 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition-all duration-150
							{active
							? 'bg-white/10 text-white'
							: 'text-white/40 hover:bg-white/5 hover:text-white/80'}">
						<span class="text-[12px] leading-none">{tab.emoji}</span>
						<span>{tab.label}</span>
						{#if active}
							<span class="absolute inset-x-2 bottom-0 h-[2px] rounded-full bg-white/60"></span>
						{/if}
					</a>
				{/each}

				<!-- ── More button ── -->
				<div class="relative ml-1 shrink-0" data-more>
					<button
						onclick={() => moreOpen = !moreOpen}
						data-more
						class="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition-all duration-150
							{moreOpen || activeInMore
							? 'bg-white/10 text-white'
							: 'text-white/40 hover:bg-white/5 hover:text-white/80'}">
						{#if activeInMore && activeMoreTab}
							<span class="text-[12px]">{activeMoreTab.emoji}</span>
							<span>{activeMoreTab.label}</span>
						{:else}
							<span class="text-[12px]">···</span>
							<span>More</span>
						{/if}
						<!-- badge -->
						<span class="flex h-4 min-w-4 items-center justify-center rounded-full bg-white/10 px-1 text-[8px] font-black text-white/50
							{moreOpen ? 'rotate-180' : ''}">
							{ALL_MORE.length}
						</span>
					</button>

					<!-- ── Dropdown ── -->
					{#if moreOpen}
						<div
							class="absolute right-0 top-[calc(100%+8px)] w-64 overflow-hidden rounded-2xl border border-white/10 bg-[#0f0f17] shadow-2xl shadow-black/60"
							data-more
							in:fly={{ y: -6, duration: 180, easing: cubicOut }}
							out:fade={{ duration: 100 }}>

							<!-- dropdown top accent -->
							<div class="h-px bg-gradient-to-r from-transparent via-white/15 to-transparent"></div>

							<div class="p-2">
								{#each MORE_GROUPS as group, gi (group.label)}
									{#if gi > 0}
										<div class="my-1.5 h-px bg-white/5"></div>
									{/if}
									<p class="mb-1 px-2 pt-1 text-[9px] font-black uppercase tracking-widest text-white/20">{group.label}</p>
									<div class="grid grid-cols-2 gap-0.5">
										{#each group.tabs as tab (tab.href)}
											{@const active = $page.url.pathname === tab.href}
											<a href={tab.href}
												onclick={() => moreOpen = false}
												class="flex items-center gap-2 rounded-xl px-3 py-2 text-[11px] font-semibold transition-all
													{active
													? 'bg-white/10 text-white'
													: 'text-white/40 hover:bg-white/6 hover:text-white/80'}">
												<span class="text-[13px]">{tab.emoji}</span>
												<span>{tab.label}</span>
											</a>
										{/each}
									</div>
								{/each}
							</div>

							<div class="h-px bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
							<div class="px-3 py-2">
								<p class="text-[9px] text-white/15">{ALL_MORE.length} more pages · use More to navigate</p>
							</div>
						</div>
					{/if}
				</div>
			</div>
		</div>
	</nav>

	<main class="relative">
		{@render children()}
	</main>
</div>

<style>
	:global(body) {
		background-color: #020207;
		margin: 0;
	}
</style>
