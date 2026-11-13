var TvWeb = TvWeb || {};
document.querySelectorAll('img[data-artwork]').forEach(function (image) {
  const fallback = image.dataset.artwork === 'landscape' ? '/images/film-placeholder-wide.svg' : '/images/film-placeholder.svg';
  image.addEventListener('error', function () {
    if (image.src.endsWith(fallback)) return;
    image.src = fallback;
  });
  async function chooseArtwork() {
    if (image.src.endsWith(fallback)) return;
    const targetRatio = image.dataset.artwork === 'portrait' ? 2 / 3 : 16 / 9;
    const currentRatio = image.naturalWidth / image.naturalHeight;
    if (image.naturalWidth && Math.abs(currentRatio - targetRatio) < 0.25) return;
    const alternative = new Image();
    if (image.dataset.alternative) {
      alternative.src = image.dataset.alternative;
      try { await alternative.decode(); } catch { }
    }
    if (alternative.naturalWidth && (!image.naturalWidth ||
        Math.abs(alternative.naturalWidth / alternative.naturalHeight - targetRatio) < Math.abs(currentRatio - targetRatio))) {
      image.src = alternative.src;
    } else if (!image.naturalWidth) {
      image.src = fallback;
    }
  }
  if (image.complete) void chooseArtwork();
  else {
    image.addEventListener('load', chooseArtwork, { once: true });
    image.addEventListener('error', chooseArtwork, { once: true });
  }
});
const playerPoster = document.querySelector('video#player');
if (playerPoster && !playerPoster.poster) {
  playerPoster.poster = '/images/film-placeholder-wide.svg';
  window.videojs?.getPlayer('player')?.poster('/images/film-placeholder-wide.svg');
} else if (playerPoster) {
  const poster = new Image();
  poster.onerror = function () {
    playerPoster.poster = '/images/film-placeholder-wide.svg';
    window.videojs?.getPlayer('player')?.poster('/images/film-placeholder-wide.svg');
  };
  poster.src = playerPoster.poster;
}
TvWeb.rememberEp = function (slug, server, ep) {
  try { localStorage.setItem("tv_" + slug, JSON.stringify({ server: server, ep: ep })); } catch (e) {}
  // auto-focus current episode for TV remotes
  $(function () {
    var cur = $('.ep-list a[data-ep="' + ep + '"]');
    if (cur.length && document.body.classList.contains('tv-mode')) {
      cur.get(0).focus({ preventScroll: true });
    }
  });
};
// D-pad / keyboard navigation for TV: arrows move between focusable cards/buttons
$(document).on("keydown", function (e) {
  if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) return;
  var items = $("a.film-card, .ep-btn, .btn, .tv-search").filter(":visible");
  if (!items.length) return;
  var idx = items.index(document.activeElement);
  var cols = Math.max(1, Math.round($(window).width() / 220));
  var next = idx;
  if (e.key === "ArrowRight") next = Math.min(items.length - 1, idx + 1);
  if (e.key === "ArrowLeft") next = Math.max(0, idx - 1);
  if (e.key === "ArrowDown") next = Math.min(items.length - 1, idx + cols);
  if (e.key === "ArrowUp") next = Math.max(0, idx - cols);
  if (next !== idx || idx === -1) { e.preventDefault(); $(items.get(Math.max(0, next))).focus(); }
});
const playbackVideo = document.querySelector('video#player, #player video');
if (playbackVideo) {
  const openedAt = performance.now();
  let requestedAt;
  TvWeb.playbackMetrics = { source: playbackVideo.querySelector('source')?.src };
  playbackVideo.addEventListener('loadedmetadata', function () {
    TvWeb.playbackMetrics.metadataMs = Math.round(performance.now() - openedAt);
  });
  playbackVideo.addEventListener('play', function () {
    requestedAt = performance.now();
  });
  playbackVideo.addEventListener('playing', function () {
    TvWeb.playbackMetrics.playingMs = requestedAt === undefined ? null : Math.round(performance.now() - requestedAt);
    TvWeb.playbackMetrics.visibility = document.visibilityState;
    console.info('Playback startup', TvWeb.playbackMetrics);
  });
  playbackVideo.addEventListener('waiting', function () {
    console.info('Playback buffering', { time: playbackVideo.currentTime, readyState: playbackVideo.readyState });
  });
}
