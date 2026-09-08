(() => {
  const $ = (id) => document.getElementById(id);
  const state = {
    live: null,
    map: null,
    markers: new Map(),
    selectedPlace: null,
    filter: 'all',
    duration: '240',
    customPlan: []
  };

  const FALLBACK_BASELINE = {
    generatedAt: null,
    river: { cfs: null, gageHeightFt: null, precipIn: null, observedAt: null, stats: null },
    weather: { tempF: null, windMph: null, shortForecast: 'Live weather unavailable', precipChance: null, cloudCover: null, qpf24In: null },
    daylight: { sunrise: null, sunset: null },
    alerts: [],
    decision: {
      score: null, label: 'Live data unavailable', state: 'mixed', confidence: 0,
      riverScore: null, trailScore: null, photoScore: null, safetyScore: null,
      percentile: null, flowContext: 'Gauge unavailable', reasons: ['Live sources could not be reached. No current waterfall score is being claimed.'],
      outlook: 'Refresh when connectivity returns.'
    },
    sourceHealth: { usgs: false, nws: false, openMeteo: false },
    sources: [
      { id: 'usgs', name: 'USGS Water Data · 04045500', live: false, url: 'https://waterdata.usgs.gov/monitoring-location/04045500/' },
      { id: 'nws', name: 'National Weather Service', live: false, url: 'https://forecast.weather.gov/MapClick.php?lat=46.5749&lon=-85.25659' },
      { id: 'open-meteo', name: 'Open-Meteo fallback / cloud + QPF', live: false, url: 'https://open-meteo.com/' },
      { id: 'dnr', name: 'Michigan DNR park database', live: true, url: 'https://www.michigan.gov/recsearch/parks/tahquamenonfalls' }
    ]
  };

  const itineraryPresets = {
    '90': {
      title: '90 minutes · choose one falls area',
      text: 'A tight visit should not waste time crossing the whole park. Start with Upper Falls unless Lower Falls or island access is the goal.',
      stops: [
        ['Upper Falls', 'Walk the new accessible approach and hit the main overlooks.', '45–55 min'],
        ['Camp 33 / Brewery', 'Use the Upper Falls-area food stop only if time remains.', '25–35 min']
      ]
    },
    '240': {
      title: 'Half day · both falls',
      text: 'This is the high-value first visit: Upper Falls, Lower Falls and the island, with one food stop if conditions cooperate.',
      stops: [
        ['Upper Falls', 'Start with the live river context, boardwalk and main overlooks.', '60–75 min'],
        ['Lower Falls + Island', 'Drive to Lower Falls, cross the Olson bridge and walk the island loop.', '75–90 min'],
        ['Brewery or Lower Falls Café', 'Choose the stop that fits your direction of travel.', '35–50 min']
      ]
    },
    '480': {
      title: 'Full day · park, river and sunset',
      text: 'Use the entire park instead of treating Tahquamenon like a roadside waterfall. Add trail mileage and finish where the river meets Lake Superior.',
      stops: [
        ['Upper Falls', 'Boardwalk, overlooks and live-flow context.', '60–75 min'],
        ['Lower Falls + Island', 'Boardwalk, island bridge and short island trail.', '75–90 min'],
        ['River Trail sample', 'Walk a selected out-and-back segment rather than committing to the whole point-to-point route.', '60–90 min'],
        ['Rivermouth', 'Boat access, fishing pier and river-to-Lake-Superior setting.', '45–60 min'],
        ['Rivermouth sunset', 'Use the live cloud/light panel to decide whether the extra wait is justified.', '30–60 min']
      ]
    },
    hike: {
      title: 'Hiker · Upper to Lower River Trail',
      text: 'The DNR trail map lists 5.1 miles one way between the Lower Falls and Upper Falls parking areas. Build the transport plan before committing.',
      stops: [
        ['Lower Falls trailhead', 'Start where logistics are simplest for your shuttle or second vehicle.', '10–15 min'],
        ['River Trail', 'Follow the signed North Country Trail corridor between the falls.', '2–3 hr'],
        ['Upper Falls', 'Finish with the main overlooks and refuel near Camp 33.', '45–60 min']
      ]
    }
  };

  const categoryGlyph = {
    falls: 'F', trail: 'T', camp: 'C', food: 'B', access: 'A', paddle: 'P', photo: '◐', info: 'i'
  };

  const formatTime = (value) => {
    if (!value) return '—';
    try {
      return new Intl.DateTimeFormat('en-US', { timeZone: 'America/Detroit', hour: 'numeric', minute: '2-digit' }).format(new Date(value));
    } catch { return '—'; }
  };

  const formatAgo = (value) => {
    if (!value) return 'age unknown';
    const mins = Math.max(0, Math.round((Date.now() - new Date(value).getTime()) / 60000));
    if (mins < 2) return 'just now';
    if (mins < 60) return `${mins} min ago`;
    const hours = Math.round(mins / 60);
    return `${hours} hr${hours === 1 ? '' : 's'} ago`;
  };

  const safe = (value, fallback = '—') => value === null || value === undefined || Number.isNaN(value) ? fallback : value;
  const scoreText = (value) => Number.isFinite(value) ? Math.round(value) : '—';

  function toast(message) {
    const node = $('toast');
    node.textContent = message;
    node.classList.add('show');
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => node.classList.remove('show'), 2200);
  }

  function sourceStateText(data) {
    const health = data?.sourceHealth || {};
    const liveCount = ['usgs', 'nws', 'openMeteo'].filter(k => health[k]).length;
    if (liveCount === 3) return { cls: 'live', text: 'Live river + weather connected' };
    if (liveCount > 0) return { cls: 'partial', text: 'Partial live data · fallback active' };
    return { cls: '', text: 'Live sources unavailable' };
  }

  function renderLive(data) {
    state.live = data;
    const d = data.decision || FALLBACK_BASELINE.decision;
    const river = data.river || {};
    const wx = data.weather || {};
    const sourceState = sourceStateText(data);

    $('liveDot').className = `live-dot ${sourceState.cls}`;
    $('freshnessText').textContent = sourceState.text;
    $('updatedBadge').textContent = data.generatedAt ? `Updated ${formatAgo(data.generatedAt)}` : 'Live refresh unavailable';

    const score = Number.isFinite(d.score) ? d.score : 0;
    $('scoreOrb').style.setProperty('--score', score);
    $('scoreNumber').textContent = Number.isFinite(d.score) ? Math.round(d.score) : '—';
    $('decisionLabel').textContent = d.label || 'Unavailable';
    $('confidencePill').textContent = `${safe(d.confidence, 0)} confidence`;
    $('decisionCard').classList.remove('loading-card');
    $('decisionSummary').textContent = buildDecisionSummary(data);
    $('riverComponent').textContent = scoreText(d.riverScore);
    $('trailComponent').textContent = scoreText(d.trailScore);
    $('photoComponent').textContent = scoreText(d.photoScore);
    $('safetyComponent').textContent = scoreText(d.safetyScore);

    $('cfsValue').textContent = Number.isFinite(river.cfs) ? `${Math.round(river.cfs)} cfs` : 'No reading';
    $('flowContext').textContent = d.flowContext || 'No flow context';
    $('flowPercentile').textContent = Number.isFinite(d.percentile) ? `~P${Math.round(d.percentile)}` : '—';
    $('flowBand').style.left = `${Number.isFinite(d.percentile) ? Math.max(1, Math.min(99, d.percentile)) : 0}%`;
    $('riverFootnote').textContent = `USGS 04045500 · ${river.observedAt ? formatAgo(river.observedAt) : 'freshness unknown'}${Number.isFinite(river.gageHeightFt) ? ` · ${river.gageHeightFt.toFixed(2)} ft stage` : ''}`;

    $('tempValue').textContent = Number.isFinite(wx.tempF) ? `${Math.round(wx.tempF)}°F` : 'Unavailable';
    $('weatherSummary').textContent = wx.shortForecast || 'Live weather';
    $('windValue').textContent = Number.isFinite(wx.windMph) ? `${Math.round(wx.windMph)} mph` : 'wind —';
    $('weatherFootnote').textContent = Number.isFinite(wx.precipChance) ? `${Math.round(wx.precipChance)}% precip chance · NWS/Open-Meteo` : 'NWS + Open-Meteo';

    $('photoValue').textContent = Number.isFinite(d.photoScore) ? `${Math.round(d.photoScore)}/100` : 'Unavailable';
    $('sunsetValue').textContent = `Sunset ${formatTime(data.daylight?.sunset)}`;
    $('cloudValue').textContent = Number.isFinite(wx.cloudCover) ? `Clouds ${Math.round(wx.cloudCover)}%` : 'Clouds —';

    const alerts = data.alerts || [];
    $('alertCard').classList.toggle('has-alert', alerts.length > 0);
    $('alertValue').textContent = alerts.length ? `${alerts.length} active` : 'None active';
    $('alertDetail').textContent = alerts.length ? alerts[0].event || alerts[0].headline || 'NWS alert' : 'No active NWS hazards returned';

    $('outlookText').textContent = d.outlook || 'Forecast precipitation is kept separate from current flow.';

    $('planRiver').textContent = scoreText(d.riverScore);
    $('planTrail').textContent = scoreText(d.trailScore);
    $('planLight').textContent = scoreText(d.photoScore);
    renderPlan();
    renderReasons();
    renderSources();
  }

  function buildDecisionSummary(data) {
    const d = data.decision || {};
    if (!Number.isFinite(d.score)) return 'No current score is being claimed until the live source stack reconnects.';
    const parts = [];
    if (Number.isFinite(data.river?.cfs)) parts.push(`${Math.round(data.river.cfs)} cfs is ${d.flowContext || 'the current flow'}`);
    if (Number.isFinite(data.weather?.tempF)) parts.push(`${Math.round(data.weather.tempF)}°F trail weather`);
    if ((data.alerts || []).length) parts.push(`${data.alerts.length} active hazard${data.alerts.length === 1 ? '' : 's'}`);
    else parts.push('no active NWS hazards');
    return `${parts.join(' · ')}.`;
  }

  function renderReasons() {
    const d = state.live?.decision || FALLBACK_BASELINE.decision;
    $('dialogDecision').textContent = d.label || '—';
    const items = [...(d.reasons || []), d.outlook].filter(Boolean);
    $('reasonList').innerHTML = items.map((reason, idx) => `<div class="reason"><b>${String(idx + 1).padStart(2, '0')}</b><span>${escapeHtml(reason)}</span></div>`).join('');
  }

  function renderSources() {
    const sources = state.live?.sources || FALLBACK_BASELINE.sources;
    $('sourcesList').innerHTML = sources.map(source => `
      <a class="source-row ${source.live ? '' : 'off'}" href="${escapeAttr(source.url)}" target="_blank" rel="noopener noreferrer">
        <i aria-hidden="true"></i><strong>${escapeHtml(source.name)}</strong><span>${source.live ? 'connected' : 'unavailable'}</span>
      </a>`).join('');
  }

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
  }
  function escapeAttr(value) { return escapeHtml(value); }

  function initMap() {
    if (!window.L || !Array.isArray(window.TAHQUAMENON_PLACES)) {
      $('parkMap').innerHTML = '<div style="padding:2rem;color:#b7c4be">Map library unavailable. Place intelligence remains available in the visit planner.</div>';
      return;
    }
    const map = L.map('parkMap', { zoomControl: false, scrollWheelZoom: true, preferCanvas: true }).setView([46.5905, -85.1700], 11);
    state.map = map;
    L.control.zoom({ position: 'bottomleft' }).addTo(map);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    const bounds = [];
    window.TAHQUAMENON_PLACES.forEach(place => {
      const marker = L.marker([place.lat, place.lng], { icon: markerIcon(place.category), title: place.name, keyboard: true });
      marker.on('click', () => selectPlace(place, true));
      marker.addTo(map);
      state.markers.set(place.id, marker);
      bounds.push([place.lat, place.lng]);
    });

    state.parkBounds = L.latLngBounds(bounds).pad(.08);
    map.fitBounds(state.parkBounds, { padding: [36, 36] });
    map.on('click', () => {
      if (window.innerWidth <= 640) $('placeDrawer').style.display = 'none';
    });

    const placeId = new URLSearchParams(location.search).get('place');
    const initial = window.TAHQUAMENON_PLACES.find(p => p.id === placeId);
    if (initial) setTimeout(() => selectPlace(initial, true), 250);
  }

  function markerIcon(category) {
    return L.divIcon({
      className: '',
      html: `<div class="poi-marker ${escapeAttr(category)}"><span>${escapeHtml(categoryGlyph[category] || '•')}</span></div>`,
      iconSize: [34, 34],
      iconAnchor: [17, 30]
    });
  }

  function selectPlace(place, pan = false) {
    state.selectedPlace = place;
    $('placeDrawer').style.display = 'block';
    $('drawerKicker').textContent = `${place.category.toUpperCase()} · ${place.kicker}`;
    $('drawerTitle').textContent = place.name;
    $('drawerDescription').textContent = place.description;
    $('drawerFacts').innerHTML = (place.facts || []).map(f => `<span>${escapeHtml(f)}</span>`).join('');
    const drawerLink = $('drawerLink');
    if (place.url) {
      drawerLink.href = escapeAttr(place.url);
      drawerLink.textContent = place.action || 'Learn more ↗';
      drawerLink.hidden = false;
    } else {
      drawerLink.hidden = true;
      drawerLink.removeAttribute('href');
    }
    $('drawerSource').textContent = `Source: ${place.source}`;
    $('addToPlanButton').disabled = false;
    $('focusButton').disabled = false;
    if (pan && state.map) state.map.flyTo([place.lat, place.lng], Math.max(state.map.getZoom(), 14), { duration: .65 });
    const url = new URL(location.href);
    url.searchParams.set('place', place.id);
    history.replaceState({}, '', url);
  }

  function applyMapFilter(filter) {
    state.filter = filter;
    document.querySelectorAll('.filter-chip').forEach(btn => btn.classList.toggle('active', btn.dataset.filter === filter));
    state.markers.forEach((marker, id) => {
      const place = window.TAHQUAMENON_PLACES.find(p => p.id === id);
      const show = filter === 'all' || place.category === filter;
      if (show && !state.map.hasLayer(marker)) marker.addTo(state.map);
      if (!show && state.map.hasLayer(marker)) marker.removeFrom(state.map);
    });
  }

  function dynamicPlanContext(preset) {
    const d = state.live?.decision;
    if (!d || !Number.isFinite(d.score)) return preset.text;
    const notes = [preset.text];
    if ((state.live.alerts || []).length) notes.push('Active NWS hazards are present; re-check official instructions before committing to exposed trails or river access.');
    else if (Number.isFinite(d.trailScore) && d.trailScore < 55) notes.push('Trail comfort is the weak link right now, so favor overlooks and shorter walks.');
    else if (Number.isFinite(d.riverScore) && d.riverScore >= 80) notes.push('River conditions are the standout signal, so give the Upper Falls overlooks enough time instead of rushing through.');
    if (Number.isFinite(d.photoScore) && d.photoScore >= 78 && state.duration === '480') notes.push('The live photo score supports keeping the Rivermouth sunset finish in the plan.');
    return notes.join(' ');
  }

  function renderPlan() {
    const preset = itineraryPresets[state.duration] || itineraryPresets['240'];
    const customStops = state.customPlan.map(place => [place.name, place.description, 'your stop']);
    const stops = customStops.length ? [...preset.stops, ...customStops] : preset.stops;
    $('planContextTitle').textContent = preset.title;
    $('planContextText').textContent = dynamicPlanContext(preset);
    $('planList').innerHTML = stops.map((stop, idx) => `
      <article class="plan-stop">
        <div class="stop-num">${String(idx + 1).padStart(2, '0')}</div>
        <div><h3>${escapeHtml(stop[0])}</h3><p>${escapeHtml(stop[1])}</p></div>
        <div class="stop-time">${escapeHtml(stop[2])}</div>
      </article>`).join('');
  }

  function planText() {
    const preset = itineraryPresets[state.duration] || itineraryPresets['240'];
    const custom = state.customPlan.map(p => p.name);
    const d = state.live?.decision;
    const header = `Tahquamenon Falls visit plan — ${preset.title}`;
    const conditions = d && Number.isFinite(d.score) ? `Live score ${d.score}/100 (${d.label}), river ${scoreText(d.riverScore)}, trail ${scoreText(d.trailScore)}, photo ${scoreText(d.photoScore)}.` : 'Live score unavailable; check conditions before leaving.';
    const stops = [...preset.stops.map(s => s[0]), ...custom].map((s, i) => `${i + 1}. ${s}`).join('\n');
    return `${header}\n${conditions}\n\n${stops}\n\nGenerated by Tahquamenon Falls Live.`;
  }

  async function copyText(text, successMessage) {
    try {
      await navigator.clipboard.writeText(text);
      toast(successMessage);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed'; textarea.style.opacity = '0';
      document.body.appendChild(textarea); textarea.select();
      document.execCommand('copy'); textarea.remove();
      toast(successMessage);
    }
  }

  function bindEvents() {
    document.querySelectorAll('[data-scroll]').forEach(btn => btn.addEventListener('click', () => document.querySelector(btn.dataset.scroll)?.scrollIntoView({ behavior: 'smooth' })));
    $('whyButton').addEventListener('click', () => $('whyDialog').showModal());
    $('sourcesButton').addEventListener('click', () => $('sourcesDialog').showModal());
    $('shareButton').addEventListener('click', async () => {
      const shareData = { title: 'Tahquamenon Falls Live', text: buildDecisionSummary(state.live || FALLBACK_BASELINE), url: location.href };
      if (navigator.share) {
        try { await navigator.share(shareData); return; } catch {}
      }
      copyText(location.href, 'Link copied');
    });
    $('filterRow').addEventListener('click', (event) => {
      const button = event.target.closest('[data-filter]');
      if (button && state.map) applyMapFilter(button.dataset.filter);
    });
    $('fitMapButton').addEventListener('click', () => state.map?.fitBounds(state.parkBounds, { padding: [36, 36] }));
    $('drawerClose').addEventListener('click', () => $('placeDrawer').style.display = 'none');
    $('focusButton').addEventListener('click', () => state.selectedPlace && state.map?.flyTo([state.selectedPlace.lat, state.selectedPlace.lng], 15));
    $('addToPlanButton').addEventListener('click', () => {
      if (!state.selectedPlace) return;
      if (!state.customPlan.some(p => p.id === state.selectedPlace.id)) state.customPlan.push(state.selectedPlace);
      renderPlan();
      toast(`${state.selectedPlace.name} added`);
      document.querySelector('#planSection')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    $('durationToggle').addEventListener('click', (event) => {
      const btn = event.target.closest('[data-duration]');
      if (!btn) return;
      state.duration = btn.dataset.duration;
      document.querySelectorAll('#durationToggle button').forEach(button => button.classList.toggle('active', button === btn));
      renderPlan();
    });
    $('copyPlanButton').addEventListener('click', () => copyText(planText(), 'Visit plan copied'));
  }

  async function loadLive() {
    try {
      const response = await fetch('/api/live', { headers: { Accept: 'application/json' } });
      if (!response.ok) throw new Error(`Live API ${response.status}`);
      const payload = await response.json();
      renderLive(payload);
    } catch (error) {
      console.warn('Live data unavailable:', error);
      renderLive(FALLBACK_BASELINE);
    }
  }

  function init() {
    bindEvents();
    renderPlan();
    initMap();
    loadLive();
    setInterval(loadLive, 5 * 60 * 1000);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
