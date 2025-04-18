<script>
const features = [
    "🎵 AI-Generated Beats in Seconds",
    "😼 Jam with a Smart Cat – Real-time Co-creation",
    "🎧 Remix, Loop, & Evolve Tracks",
    "📡 Export as MP3, WAV, or MIDI",
    "📈 Real-time Music Visualizer",
    "🧠 Powered by GPT + WaveNet + GANs"
];

const allGifs = [
    { name: "Kittyjam Jamming", file: "kittyjam-jamming.gif" },
    { name: "Absolute Cinema", file: "absolute-cinema.gif" },
    { name: "Grand Theft Auto", file: "grand-theft-auto.gif" },
    { name: "Lana Del Rey", file: "lana-del-rey.gif" },
    { name: "Matrix", file: "matrix.gif" },
    { name: "Mourinho", file: "mourinho.gif" },
    { name: "Red Dead Redemption", file: "red-dead-redemption.gif" }
];

const galleryGifs = allGifs.filter(gif => gif.file !== "kittyjam-jamming.gif");
</script>

<div class="min-h-screen bg-gradient-to-br from-pink-300 via-purple-200 to-cyan-100 flex flex-col justify-start items-center px-6 py-12 text-gray-800">

<div class="w-full flex justify-end items-center px-4 py-2 text-2xl">
    <div class="flex gap-5 text-pink-700">
        <a href="https://x.com/JamCatCTO" target="_blank" aria-label="X / Twitter" class="hover:text-pink-900 transition">🐦</a>
        <a href="https://instagram.com/JamCatCTO" target="_blank" aria-label="Instagram" class="hover:text-pink-900 transition">📸</a>
        <a href="https://tiktok.com/@Jam.Cat.CTO" target="_blank" aria-label="TikTok" class="hover:text-pink-900 transition">🎵</a>
    </div>
</div>

<h1 class="text-5xl md:text-6xl font-extrabold text-center mb-4">
    🎶 Welcome to <span class="text-pink-600">JamCat AI</span> 😺
</h1>

<p class="text-xl text-center max-w-xl mb-6">
    Where <span class="font-semibold">AI 🤖 meets Music 🎧</span> to create <span class="font-semibold">sonic magic ✨</span>
</p>

<img
    src="/kittyjam-jamming.gif"
    alt="Kitty Jamming"
    class="w-64 md:w-80 h-auto mb-8 rounded-xl shadow-lg border-4 border-pink-400 hover:scale-105 transition-transform duration-300"
/>

<div class="max-w-6xl w-full">
    <h2 class="text-3xl font-extrabold text-center mb-8 text-purple-700">🎬 AI Music Meme Gallery 🎶</h2>
    
    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
        {#each galleryGifs as gif}
        <div class="flex flex-col items-center bg-white p-4 rounded-xl shadow-md hover:scale-105 transition-transform duration-300">
            <div class="w-full aspect-[1/1] overflow-hidden rounded-md border-4 border-purple-300">
            <img
                src={`/${gif.file}`}
                alt={gif.name}
                class="object-cover w-full h-full"
            />
            </div>
            <p class="mt-2 font-semibold text-center text-gray-700">{gif.name}</p>
        </div>
        {/each}      
    </div>
</div>

<button
    class="mt-16 bg-pink-500 hover:bg-pink-600 text-white px-6 py-3 rounded-lg text-lg transition"
    on:click={() => alert('Coming soon! 🚧🎸')}
>
    🚀 Start Jamming
</button>

<div class="mt-12 bg-white shadow-lg rounded-xl p-8 max-w-3xl w-full">
    <h2 class="text-2xl font-bold mb-4 text-center text-purple-600">✨ Why You'll Love It ✨</h2>
    <ul class="space-y-3 text-lg">
    {#each features as feature}
        <li class="flex items-center">
        <span class="text-pink-500 text-xl mr-2">💎</span> {feature}
        </li>
    {/each}
    </ul>
</div>

<footer class="mt-16 text-sm text-gray-500 text-center">
    🧠 Built with ❤️ by <strong>JamCat AI</strong> · 🚀 SvelteKit + Tailwind + Vibes<br/>
    👤 Follow <strong>@JamCatCTO</strong> on your fave platforms!
</footer>

</div>
    