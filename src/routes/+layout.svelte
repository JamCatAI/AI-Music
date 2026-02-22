<script>
	import '../app.css';
	import { page } from '$app/stores';

	let { children } = $props();

	const tabs = [
		{ label: '🏠 Home', href: '/' },
		{ label: '🚀 Jam.fun', href: '/jam' },
		{ label: '🎮 Play', href: '/play' },
	];
</script>

<nav class="sticky top-0 z-50 border-b border-white/40 bg-white/70 backdrop-blur-md shadow-sm">
	<div class="mx-auto flex max-w-7xl items-center gap-1 px-4 py-2">
		<span class="mr-4 text-lg font-extrabold text-pink-600">😺 JamCat</span>
		{#each tabs as tab}
			<a
				href={tab.href}
				class="rounded-full px-4 py-1.5 text-sm font-semibold transition-all duration-150
					{$page.url.pathname === tab.href
						? 'bg-pink-500 text-white shadow-md'
						: 'text-gray-600 hover:bg-pink-100 hover:text-pink-700'}"
			>
				{tab.label}
			</a>
		{/each}
	</div>
</nav>

{@render children()}
