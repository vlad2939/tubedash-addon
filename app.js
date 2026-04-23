// Stocare date în memorie extrase din data.json
let store = {
    playlists: [],
    videos: []
};

// Încărcare date din data.json
async function initApp() {
    try {
        const response = await fetch('data.json?v=' + new Date().getTime()); // Evitare cache browser pt a vedea actualizarile
        if (!response.ok) throw new Error('Nu s-a putut încărca fișierul de date');
        
        const data = await response.json();
        
        // Curățare date anterioare
        store.playlists = [];
        store.videos = [];
        
        // Mapare structură JSON în memoria aplicației
        if(data && data.playlists) {
            data.playlists.forEach((pl, i) => {
                const plId = 'pl-id-' + i; // Generam ID de referinta intern
                store.playlists.push({ id: plId, name: pl.title });
                
                if(pl.videos) {
                    pl.videos.forEach((vid, j) => {
                        const yid = parseYT(vid.url);
                        if(yid) {
                            store.videos.push({
                                id: 'vid-' + i + '-' + j,
                                playlistId: plId,
                                title: vid.title,
                                url: vid.url,
                                youtubeId: yid,
                                thumbnail: `https://img.youtube.com/vi/${yid}/hqdefault.jpg`
                            });
                        }
                    });
                }
            });
        }
        
        // Randare interfață după încărcare
        renderSidebar();
        if (store.playlists.length > 0) {
            renderPlaylist(store.playlists[0].id);
        } else {
            showEmptyState("Fișierul data.json a fost citit, dar nu conține playlist-uri.");
        }
        
    } catch(err) {
        console.error("Eroare initializare:", err);
        showEmptyState("Eroare critică! Fișierul <strong>data.json</strong> nu a fost găsit sau formatul acestuia este invalid.");
    }
}

// Afisare mesaj in cazul in care fisierul e gol sau are erori
function showEmptyState(msg) {
    const main = document.getElementById('app-container');
    main.innerHTML = `
        <div class="flex flex-col items-center justify-center h-[70vh] animate-fade-in text-center max-w-lg mx-auto">
            <span class="material-icons text-5xl text-zinc-600 mb-6 border border-white/10 p-4 rounded-3xl bg-white/5 ring-1 ring-white/5">code_off</span>
            <h2 class="text-xl font-semibold tracking-tight text-white mb-2">Lipsă sursă date</h2>
            <p class="text-zinc-500 font-medium text-sm leading-relaxed">${msg}</p>
        </div>
    `;
}

// Citire ID videoclip din orice format link de Youtube
function parseYT(input) {
    if (!input) return null;
    const cleanInput = input.trim();
    if (/^[a-zA-Z0-9_-]{11}$/.test(cleanInput)) return cleanInput;
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
    const match = cleanInput.match(regex);
    return match ? match[1] : null;
}

// ----- UI CONTROLLERS (Stiluri exact din V3) -----

function renderSidebar() {
    const plDiv = document.getElementById('sidebar-playlists');
    plDiv.innerHTML = '';
    
    store.playlists.forEach(pl => {
        const btn = document.createElement('button');
        btn.className = "w-full flex items-center gap-3 px-3 py-2 rounded-xl text-zinc-400 hover:bg-white/[0.04] hover:text-white transition-all group text-sm font-medium border border-transparent hover:border-white/[0.04]";
        btn.innerHTML = `<span class="material-icons text-[16px] opacity-50 group-hover:opacity-100 transition-opacity">folder</span> <span class="truncate">${pl.name}</span>`;
        btn.onclick = () => renderPlaylist(pl.id);
        plDiv.appendChild(btn);
    });
}

function renderPlaylist(id) {
    const pl = store.playlists.find(p => p.id === id);
    if(!pl) return;
    
    const vids = store.videos.filter(v => v.playlistId === id);
    const main = document.getElementById('app-container');
    
    let html = `
        <div class="w-full max-w-[1400px] flex flex-col mx-auto animate-fade-in">
            <div class="flex items-end justify-between mb-10 pb-6 border-b border-white/5">
                <div class="flex flex-col gap-1.5">
                    <span class="text-[11px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5"><span class="material-icons text-[14px]">play_circle_outline</span> Playlist Deschis</span>
                    <h2 class="text-3xl md:text-4xl font-bold tracking-tight text-white">${pl.name}</h2>
                </div>
                <div class="px-4 py-1.5 rounded-full bg-white/5 border border-white/5 text-zinc-300 text-xs font-semibold shadow-sm backdrop-blur-sm">${vids.length} clipuri</div>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">`;
    
    if(vids.length === 0) {
        html += `<div class="col-span-full py-24 flex flex-col items-center justify-center text-center border border-dashed border-white/10 rounded-2xl bg-white/[0.01]">
                    <div class="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-6 shadow-inner ring-1 ring-white/5">
                        <span class="material-icons text-3xl text-zinc-500">video_library</span>
                    </div>
                    <h3 class="text-lg font-medium text-white mb-2">Acest playlist este gol</h3>
                    <p class="text-zinc-500 font-normal max-w-sm text-sm">Adaugă videoclipuri în fișierul <strong>data.json</strong> pentru a popula această colecție.</p>
                 </div>`;
    } else {
        vids.forEach(v => {
            html += `
            <div class="bg-surface border border-white/5 flex flex-col rounded-2xl overflow-hidden group cursor-pointer hover:border-white/20 hover:bg-white/[0.02] transition-all duration-300 shadow-xl shadow-black/50" onclick="playVideo('${v.youtubeId}', '${pl.id}')">
                <div class="aspect-video relative bg-zinc-900 w-full overflow-hidden">
                    <img src="${v.thumbnail}" loading="lazy" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
                    <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-300"></div>
                    <div class="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <div class="w-14 h-14 rounded-full bg-black/40 flex items-center justify-center backdrop-blur-md border border-white/20 transform scale-90 group-hover:scale-100 transition-all duration-300 shadow-2xl">
                             <span class="material-icons text-white text-[28px] translate-x-[2px]">play_arrow</span>
                        </div>
                    </div>
                </div>
                <div class="p-5 flex flex-1 flex-col justify-center items-start gap-3 relative">
                    <h3 class="font-medium text-sm text-zinc-100 leading-relaxed line-clamp-2">${v.title}</h3>
                </div>
            </div>`;
        });
    }
    
    html += `</div></div>`;
    main.innerHTML = html;
}

function playVideo(ytId, plId) {
     const main = document.getElementById('app-container');
     main.innerHTML = `
        <div class="w-full max-w-[1200px] flex flex-col mx-auto h-[80vh] min-h-[500px] animate-fade-in relative z-10">
             <button onclick="renderPlaylist('${plId}')" class="self-start flex items-center justify-center gap-2 text-zinc-400 hover:text-white mb-6 transition-all px-3 py-1.5 rounded-lg hover:bg-white/10 text-sm font-medium border border-transparent hover:border-white/10">
                 <span class="material-icons text-[16px]">arrow_back</span> Întoarce-te la galerie
             </button>
             <div class="w-full h-full bg-black rounded-2xl overflow-hidden shadow-2xl border border-white/10 ring-1 ring-white/5 relative group">
                 <div class="absolute inset-0 flex items-center justify-center bg-zinc-900 -z-10 animate-pulse">
                     <span class="material-icons text-white/20 text-5xl">smart_display</span>
                 </div>
                 <iframe class="w-full h-full relative z-10" 
                         src="https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0" 
                         title="YouTube video player" 
                         frameborder="0" 
                         allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                         referrerpolicy="strict-origin-when-cross-origin" 
                         allowfullscreen>
                 </iframe>
             </div>
        </div>
     `;
}

// ---- README POPUP ----
function openReadmePopup() {
    const modal = document.getElementById('readme-modal');
    const content = document.getElementById('readme-content');
    modal.classList.remove('hidden');
    
    // Setăm opțiuni pentru a păstra forțat enter-urile ca "break/br"
    marked.setOptions({ breaks: true });
    
    fetch('README.md')
        .then(response => response.text())
        .then(text => {
            content.innerHTML = marked.parse(text);
        })
        .catch(err => {
            content.innerHTML = '<p class="text-red-400 text-sm font-medium">Nu se poate încărca fișierul README.md</p>';
        });
}

function closeReadmePopup() {
    document.getElementById('readme-modal').classList.add('hidden');
}

// Pornire Aplicație
initApp();
