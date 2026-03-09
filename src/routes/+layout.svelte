<script>
	import '../app.css';
	import { page } from '$app/stores';

	let { children } = $props();

	const tabs = [
		{ label: '🏠 Home', href: '/' },
		{ label: '🚀 Jam.fun', href: '/jam' },
		{ label: '🤖 x402', href: '/x402' },
		{ label: '🦾 OpenClaw', href: '/openclaw' },
		{ label: '🔄 Swap', href: '/swap' },
		{ label: '📊 Perps', href: '/perps' },
		{ label: '🔮 Predict', href: '/predict' },
		{ label: '🎮 Play', href: '/play' },
		{ label: '🔥 Memes', href: '/memes' },
		{ label: '📰 News', href: '/news' },
	];
</script>

<div class="min-h-screen bg-[#020207] text-white">
	<nav class="sticky top-0 z-50 border-b border-white/5 bg-black/60 backdrop-blur-xl shadow-2xl">
		<div class="mx-auto flex max-w-7xl items-center gap-1 px-4 py-2">
			<span class="mr-6 flex items-center gap-2 text-xl font-black tracking-tighter text-white">
				<span class="flex h-8 w-8 items-center justify-center rounded-lg bg-pink-500 text-sm shadow-lg shadow-pink-500/20">😺</span>
				JamCat
			</span>
			<div class="flex flex-1 items-center gap-1 overflow-x-auto no-scrollbar">
				{#each tabs as tab}
					<a
						href={tab.href}
						class="whitespace-nowrap rounded-full px-4 py-1.5 text-xs font-black uppercase tracking-widest transition-all duration-200
							{$page.url.pathname === tab.href
								? 'bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.2)]'
								: 'text-white/50 hover:bg-white/10 hover:text-white'}"
					>
						{tab.label}
					</a>
				{/each}
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
	.no-scrollbar::-webkit-scrollbar {
		display: none;
	}
	.no-scrollbar {
		-ms-overflow-style: none;
		scrollbar-width: none;
	}
</style>
