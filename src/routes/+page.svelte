<svelte:head>
  <title>{randomMeme ? `${randomMeme.name} | JamCat AI` : 'JamCat AI | GIF Memes'}</title>
  <meta name="description" content={randomMeme ? `Watch ${randomMeme.name} meme powered by AI` : 'Jam to AI-generated beats with JamCat'} />
</svelte:head>

<script>
import { onMount } from 'svelte';

let defaultTitle = 'JamCat AI | GIF Memes';
let intervalId;
let isPageHidden = false;

const messages = ['JamCat is live!', 'Come back to jam!', 'Beats waiting!'];
let i = 0;

onMount(() => {
  const handleVisibilityChange = () => {
    if (document.hidden) {
      isPageHidden = true;
      intervalId = setInterval(() => {
        document.title = messages[i % messages.length];
        i++;
      }, 100);
    } else {
      isPageHidden = false;
      clearInterval(intervalId);
      document.title = defaultTitle;
    }
  };

  document.addEventListener('visibilitychange', handleVisibilityChange);

  return () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    clearInterval(intervalId);
  };
});

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

let randomMeme = null;

function showRandomMeme() {
    const randomIndex = Math.floor(Math.random() * galleryGifs.length);
    randomMeme = galleryGifs[randomIndex];
}

let audio = null;

function playRandomTrack() {
    const tracks = ["music1.ogg", "music2.ogg", "music3.ogg"];
    const randomTrack = tracks[Math.floor(Math.random() * tracks.length)];

    if (audio) {
        audio.pause();
        audio.currentTime = 0;
    }

    audio = new Audio(`/${randomTrack}`);
    audio.play();
}

const gptMemes = Array.from({ length: 10 }, (_, i) => ({
    name: `GPT Meme #${i + 1}`,
    file: `gpt/${i + 1}.png`
}));

let randomGptMeme = null;

function showRandomGptMeme() {
    const randomIndex = Math.floor(Math.random() * gptMemes.length);
    randomGptMeme = gptMemes[randomIndex];
}

const avatarPics = Array.from({ length: 40 }, (_, i) => ({
  file: `/profile-pics/jamcat${i + 1}.png`,
  name: `JamCat Avatar #${i + 1}`,
  downloadName: `jamcat${i + 1}.png`
}));

</script>

<div class="min-h-screen bg-gradient-to-br from-pink-300 via-purple-200 to-cyan-100 flex flex-col justify-start items-center px-6 py-12 text-gray-800">

<div class="absolute inset-0 z-0 overflow-hidden pointer-events-none">
    <div class="cloud absolute top-10 left-[-20%] w-48 h-28 animate-cloud1 opacity-10"></div>
    <div class="cloud absolute top-[20%] left-[-30%] w-40 h-24 animate-cloud2 opacity-10"></div>
    <div class="cloud absolute top-[35%] left-[-25%] w-56 h-32 animate-cloud3 opacity-10"></div>
    <div class="cloud absolute top-[50%] left-[-35%] w-44 h-28 animate-cloud4 opacity-10"></div>
    <div class="cloud absolute top-[60%] left-[-15%] w-64 h-36 animate-cloud5 opacity-10"></div>
    <div class="cloud absolute top-[70%] left-[-40%] w-52 h-30 animate-cloud6 opacity-10"></div>
    <div class="cloud absolute top-[80%] left-[-22%] w-60 h-34 animate-cloud7 opacity-10"></div>
</div>

<div class="w-full flex justify-center md:justify-end items-center px-4 py-2 text-2xl">
    <div class="flex flex-wrap gap-3 text-white">
    <a href="https://x.com/JamCatCTO" target="_blank" aria-label="X / Twitter"
        class="bg-black hover:bg-gray-800 px-4 py-2 rounded-full shadow-lg transition transform hover:scale-105">
    🐦 X / Twitter
    </a>
    <a href="https://instagram.com/JamCatCTO" target="_blank" aria-label="Instagram"
        class="bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 px-4 py-2 rounded-full shadow-lg transition transform hover:scale-105">
    📸 Instagram
    </a>
    <a href="https://tiktok.com/@Jam.Cat.CTO" target="_blank" aria-label="TikTok"
        class="bg-black text-white px-4 py-2 rounded-full shadow-lg transition transform hover:scale-105">
    🎵 TikTok
    </a>
    <a href="https://www.coingecko.com/en/coins/jam-cat" target="_blank" aria-label="CoinGecko"
        class="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-full shadow-lg transition transform hover:scale-105">
    🦎 CoinGecko
    </a>
    <a href="https://dexscreener.com/solana/35jzmqqc6ewrw6pefwdlhmtxbkvnc9mxpbes4rbws1ww" target="_blank" aria-label="DexScreener"
        class="bg-purple-700 hover:bg-purple-800 px-4 py-2 rounded-full shadow-lg transition transform hover:scale-105">
    📊 DexScreener
    </a>
    <a href="https://t.me/JamCatOnSolana" target="_blank" aria-label="Telegram"
        class="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded-full shadow-lg transition transform hover:scale-105">
        💬 Telegram
    </a>
</div>
</div>
    

<h1 class="text-5xl md:text-6xl font-extrabold text-center mt-16 mb-4">
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

<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
    {#each avatarPics as avatar}
      <div class="flex flex-col items-center bg-white p-4 rounded-xl shadow-lg">
        <img
          src={avatar.file}
          alt={avatar.name}
          class="w-40 h-40 rounded-full border-4 border-pink-400 shadow-md mb-3 hover:scale-105 transition-transform duration-300"
        />
        <a
          href={avatar.file}
          download={avatar.downloadName}
          class="bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded-full shadow-md transition hover:scale-105"
        >
          ⬇️ Download
        </a>
      </div>
    {/each}
  </div>
  

<div class="w-full border-t-4 border-dashed border-pink-400 my-12"></div>

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

<div class="w-full border-t-4 border-dashed border-indigo-400 my-12"></div>

<div class="mt-4 text-center">
    <button
        class="bg-yellow-400 hover:bg-yellow-500 text-black px-6 py-3 rounded-lg text-lg font-bold transition shadow-md hover:scale-105"
        on:click={showRandomMeme}
    >
        🎲 Generate Random Meme!
    </button>

    {#if randomMeme}
        <div class="mt-8 flex flex-col items-center">
            <img
                src={`/${randomMeme.file}`}
                alt={randomMeme.name}
                class="w-72 h-auto rounded-lg shadow-lg border-4 border-yellow-300 transition-transform duration-300 hover:scale-105"
            />
            <p class="mt-2 text-xl font-semibold text-gray-700">🔥 {randomMeme.name} 🔥</p>
        </div>
    {/if}
</div>

<div class="mt-8 text-center">
    <button
        class="bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-3 rounded-lg text-lg font-bold transition shadow-md hover:scale-105"
        on:click={showRandomGptMeme}
    >
        🧠 Generate AI GPT Meme!
    </button>

    {#if randomGptMeme}
        <div class="mt-8 flex flex-col items-center">
            <img
                src={`/${randomGptMeme.file}`}
                alt={randomGptMeme.name}
                class="w-72 h-auto rounded-lg shadow-lg border-4 border-indigo-400 transition-transform duration-300 hover:scale-105"
            />
            <p class="mt-2 text-xl font-semibold text-gray-700">🤯 {randomGptMeme.name} 🔮</p>
            <p class="text-sm italic text-gray-500 mt-1">💡 100% Neural Net-powered ✨ – GPT meets Meme Mayhem 🧬🔥</p>
        </div>
    {/if}
</div>

<button
    class="mt-16 bg-pink-500 hover:bg-pink-600 text-white px-6 py-3 rounded-lg text-lg transition shadow-lg hover:scale-105"
    on:click={playRandomTrack}
>
    🚀 Start Jamming with AI Music
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

<div class="mt-12 flex flex-wrap justify-center gap-4">
<a
    href="https://www.coingecko.com/en/coins/jam-cat"
    target="_blank"
    class="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2 rounded-lg text-lg transition shadow-md"
>
    🦎 View on CoinGecko
</a>
<a
    href="https://dexscreener.com/solana/35jzmqqc6ewrw6pefwdlhmtxbkvnc9mxpbes4rbws1ww"
    target="_blank"
    class="bg-green-500 hover:bg-green-600 text-white px-5 py-2 rounded-lg text-lg transition shadow-md"
>
    📊 $JAM on DexScreener
</a>
<a
  href="/whitepaper.pdf"
  target="_blank"
  download
  class="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-lg transition shadow-md"
>
  📄 Download Whitepaper
</a>
</div>  

<footer class="mt-16 text-sm text-gray-500 text-center">
    🧠 Built with ❤️ by <strong>JamCat AI</strong> · 🚀 SvelteKit + Tailwind + Vibes<br/>
    👤 Follow <strong>@JamCatCTO</strong> on your fave platforms!
</footer>

</div>
    