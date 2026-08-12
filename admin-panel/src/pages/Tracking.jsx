import { useState, useEffect, useRef, useCallback } from 'react';
import PageHeader from '../components/PageHeader';
import { 
  MdSearch, 
  MdRefresh, 
  MdDirectionsRun, 
  MdPlayArrow,
  MdPause,
  MdMyLocation
} from 'react-icons/md';
import { API_BASE_URL } from '../services/api';

export default function Tracking() {
  const [advisors, setAdvisors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAdvisor, setSelectedAdvisor] = useState(null);
  const [mapType, setMapType] = useState('google-roadmap'); // 'google-roadmap' | 'google-satellite' | 'osm'
  const [isSimulating, setIsSimulating] = useState(false);
  const [simLocations, setSimLocations] = useState({});

  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef({});
  const myLocationMarkerRef = useRef(null);
  const polylineRef = useRef(null);
  const tileLayerRef = useRef(null);
  const [leafletReady, setLeafletReady] = useState(false);

  // 1. Dynamically load Leaflet assets safely
  useEffect(() => {
    let isMounted = true;

    const loadLeafletAssets = () => {
      // Inject CSS if missing
      if (!document.getElementById('leaflet-css-cdn')) {
        const link = document.createElement('link');
        link.id = 'leaflet-css-cdn';
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }

      // Check if window.L is already loaded
      if (window.L) {
        if (isMounted) setLeafletReady(true);
        return;
      }

      // Inject JS if missing
      let script = document.getElementById('leaflet-js-cdn');
      if (!script) {
        script = document.createElement('script');
        script.id = 'leaflet-js-cdn';
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.async = true;
        document.head.appendChild(script);
      }

      script.onload = () => {
        if (isMounted) setLeafletReady(true);
      };
    };

    loadLeafletAssets();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch (e) {
          console.warn('Map cleanup warning:', e);
        }
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // 2. Fetch live advisor locations from backend
  const fetchLocations = async () => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('aToken') || '';
      const response = await fetch(`${API_BASE_URL}/admin/advisor-locations`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setAdvisors(data.advisors || []);
      }
    } catch (err) {
      console.error('Failed to fetch advisor locations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
    const interval = setInterval(fetchLocations, 6000);
    return () => clearInterval(interval);
  }, []);

  // 3. Tile Layer Switcher
  const applyTileLayer = useCallback((type, targetMap = mapInstanceRef.current) => {
    if (!targetMap || !window.L) return;

    if (tileLayerRef.current) {
      targetMap.removeLayer(tileLayerRef.current);
    }

    let layer;
    if (type === 'google-roadmap') {
      layer = window.L.tileLayer('https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
        maxZoom: 20,
        subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
        attribution: '&copy; Google Maps'
      });
    } else if (type === 'google-satellite') {
      layer = window.L.tileLayer('https://{s}.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}', {
        maxZoom: 20,
        subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
        attribution: '&copy; Google Maps Satellite'
      });
    } else {
      layer = window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap'
      });
    }

    layer.addTo(targetMap);
    tileLayerRef.current = layer;
    setMapType(type);
  }, []);

  // 4. Initialize Leaflet Map instance
  useEffect(() => {
    if (!leafletReady || !mapRef.current || mapInstanceRef.current) return;

    try {
      if (mapRef.current._leaflet_id) {
        mapRef.current._leaflet_id = null;
      }

      const map = window.L.map(mapRef.current, {
        center: [22.3072, 73.1812], // Center on Gujarat
        zoom: 9,
        zoomControl: false
      });

      window.L.control.zoom({ position: 'topright' }).addTo(map);
      mapInstanceRef.current = map;

      // Set initial tile layer
      applyTileLayer(mapType, map);

      // Force resize computation for proper map tile rendering
      setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      }, 200);
    } catch (err) {
      console.error('Leaflet Map Initialization Error:', err);
    }
  }, [leafletReady, mapType, applyTileLayer]);

  // 5. Live Simulation Interval Effect
  useEffect(() => {
    let simInterval;
    if (isSimulating) {
      simInterval = setInterval(() => {
        setSimLocations(prev => {
          const next = { ...prev };
          advisors.forEach((adv, idx) => {
            const baseLat = adv.location?.lat || (22.3072 + idx * 0.08);
            const baseLng = adv.location?.lng || (73.1812 + idx * 0.07);

            const curr = next[adv._id] || { lat: baseLat, lng: baseLng, speed: 25 + Math.floor(Math.random() * 20) };
            
            const deltaLat = (Math.random() - 0.48) * 0.003;
            const deltaLng = (Math.random() - 0.48) * 0.003;

            next[adv._id] = {
              lat: curr.lat + deltaLat,
              lng: curr.lng + deltaLng,
              speed: Math.max(12, Math.min(65, curr.speed + Math.floor((Math.random() - 0.5) * 6))),
              lastUpdated: new Date()
            };
          });
          return next;
        });
      }, 2000);
    }
    return () => clearInterval(simInterval);
  }, [isSimulating, advisors]);

  // Helper to ensure valid coordinate numbers
  const getSanitizedCoords = useCallback((advisor, index) => {
    const sim = simLocations[advisor._id];
    const defaultLat = 22.3072 + (index * 0.08) - 0.04;
    const defaultLng = 73.1812 + (index * 0.07) - 0.04;

    let lat = sim ? sim.lat : advisor.location?.lat;
    let lng = sim ? sim.lng : advisor.location?.lng;

    if (typeof lat !== 'number' || isNaN(lat) || lat === 0) lat = defaultLat;
    if (typeof lng !== 'number' || isNaN(lng) || lng === 0) lng = defaultLng;

    const speed = sim ? sim.speed : (advisor.location?.speed || 0);

    return { lat, lng, speed };
  }, [simLocations]);

  // 6. Synchronize Markers & Polyline on Map
  useEffect(() => {
    if (!mapInstanceRef.current || !window.L || advisors.length === 0) return;

    const map = mapInstanceRef.current;
    const currentMarkers = markersRef.current;
    const bounds = window.L.latLngBounds();

    advisors.forEach((advisor, index) => {
      const { lat, lng, speed } = getSanitizedCoords(advisor, index);
      const isMoving = speed > 5 || isSimulating;
      const statusColor = !advisor.available ? '#ef4444' : isMoving ? '#16a34a' : '#f59e0b';
      const statusRing = isMoving ? 'animate-ping' : '';

      bounds.extend([lat, lng]);

      const customIcon = window.L.divIcon({
        className: 'custom-gps-marker border-0 bg-transparent',
        html: `
          <div style="position: relative; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center;">
            <div style="position: absolute; inset: 0; border-radius: 50%; background-color: ${statusColor}; opacity: 0.35;" class="${statusRing}"></div>
            <div style="position: relative; width: 36px; height: 36px; border-radius: 50%; background: white; border: 3px solid ${statusColor}; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.25); overflow: hidden; font-weight: bold; font-size: 13px; color: #1e293b;">
              ${advisor.name ? advisor.name.charAt(0).toUpperCase() : 'A'}
            </div>
            <div style="position: absolute; bottom: -2px; right: -2px; width: 12px; height: 12px; border-radius: 50%; background-color: ${statusColor}; border: 2px solid white;"></div>
          </div>
        `,
        iconSize: [44, 44],
        iconAnchor: [22, 22]
      });

      if (currentMarkers[advisor._id]) {
        currentMarkers[advisor._id].setLatLng([lat, lng]);
        currentMarkers[advisor._id].setIcon(customIcon);
      } else {
        const marker = window.L.marker([lat, lng], { icon: customIcon }).addTo(map);

        marker.on('click', () => {
          setSelectedAdvisor(advisor);
          map.flyTo([lat, lng], 14, { duration: 1 });
        });

        currentMarkers[advisor._id] = marker;
      }

      // Update Popup Content
      const popupContent = `
        <div style="padding: 6px; font-family: system-ui, sans-serif; min-width: 160px;">
          <h4 style="margin: 0 0 4px 0; font-size: 14px; font-weight: bold; color: #0f172a;">${advisor.name}</h4>
          <p style="margin: 0 0 4px 0; font-size: 12px; color: #64748b;">📍 ${advisor.village || 'N/A'}, ${advisor.area || ''}</p>
          <p style="margin: 0 0 6px 0; font-size: 12px; color: #64748b;">📞 ${advisor.phone || 'N/A'}</p>
          <div style="display: flex; gap: 6px; font-size: 11px; font-weight: bold;">
            <span style="background: #f1f5f9; padding: 2px 8px; border-radius: 6px; color: ${statusColor};">
              ${!advisor.available ? '🔴 Unavailable' : isMoving ? '⚡ Moving (' + speed + ' km/h)' : '🟡 Stationed'}
            </span>
          </div>
        </div>
      `;
      currentMarkers[advisor._id].bindPopup(popupContent);
    });

    // Handle Selected Advisor Route Line
    if (selectedAdvisor && window.L) {
      const targetAdvisorIndex = advisors.findIndex(a => a._id === selectedAdvisor._id);
      const targetAdv = targetAdvisorIndex !== -1 ? advisors[targetAdvisorIndex] : selectedAdvisor;
      const { lat: sLat, lng: sLng } = getSanitizedCoords(targetAdv, targetAdvisorIndex !== -1 ? targetAdvisorIndex : 0);

      let historyPoints = (targetAdv.locationHistory || []).map(p => [p.lat, p.lng]);
      if (historyPoints.length === 0) {
        historyPoints = [
          [sLat - 0.015, sLng - 0.012],
          [sLat - 0.008, sLng - 0.005],
          [sLat, sLng]
        ];
      } else {
        historyPoints.push([sLat, sLng]);
      }

      if (polylineRef.current) {
        map.removeLayer(polylineRef.current);
      }

      const polyline = window.L.polyline(historyPoints, {
        color: '#16a34a',
        weight: 4,
        opacity: 0.85,
        dashArray: '8, 8'
      }).addTo(map);

      polylineRef.current = polyline;
    }

  }, [advisors, simLocations, isSimulating, selectedAdvisor, getSanitizedCoords]);

  // Focus single advisor on list click
  const handleFocusAdvisor = (advisor) => {
    setSelectedAdvisor(advisor);
    if (mapInstanceRef.current && window.L) {
      const idx = advisors.findIndex(a => a._id === advisor._id);
      const { lat, lng } = getSanitizedCoords(advisor, idx !== -1 ? idx : 0);
      mapInstanceRef.current.flyTo([lat, lng], 14, { duration: 1.2 });
      if (markersRef.current[advisor._id]) {
        markersRef.current[advisor._id].openPopup();
      }
    }
  };

  // 7. Locate Admin position
  const handleLocateAdmin = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;

        if (mapInstanceRef.current && window.L) {
          const map = mapInstanceRef.current;
          map.flyTo([latitude, longitude], 13, { duration: 1.2 });

          const adminIcon = window.L.divIcon({
            className: 'admin-gps-marker border-0 bg-transparent',
            html: `
              <div style="position: relative; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center;">
                <div style="position: absolute; inset: 0; border-radius: 50%; background-color: #3b82f6; opacity: 0.35;" class="animate-ping"></div>
                <div style="position: relative; width: 36px; height: 36px; border-radius: 50%; background: #3b82f6; border: 3px solid white; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.3); font-weight: bold; font-size: 14px; color: white;">
                  👑
                </div>
              </div>
            `,
            iconSize: [44, 44],
            iconAnchor: [22, 22]
          });

          if (myLocationMarkerRef.current) {
            myLocationMarkerRef.current.setLatLng([latitude, longitude]);
          } else {
            myLocationMarkerRef.current = window.L.marker([latitude, longitude], { icon: adminIcon })
              .addTo(map)
              .bindPopup('<div style="font-weight:bold; font-size:12px;">📍 Admin Current Location</div>')
              .openPopup();
          }
        }
      },
      (err) => {
        console.error('Error fetching admin location:', err);
        alert('Could not access current location. Please check location permissions in browser.');
      },
      { enableHighAccuracy: true }
    );
  };

  const filteredAdvisors = advisors.filter(a => 
    a.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.area?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.village?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.phone?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto pb-10 space-y-6">
      <PageHeader 
        title="GPS Live Advisor Tracking" 
        description="Monitor real-time movement, live speed, and service routes of field advisors on Google Maps" 
      />

      {/* Top Controls Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="Search advisor by name, area, phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <MdSearch className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
          {/* Map Layer Toggle */}
          <div className="flex items-center bg-gray-100 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => applyTileLayer('google-roadmap')}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                mapType === 'google-roadmap' ? 'bg-white text-primary-700 shadow-2xs font-bold' : 'text-gray-600'
              }`}
            >
              🗺️ Roadmap
            </button>
            <button
              onClick={() => applyTileLayer('google-satellite')}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                mapType === 'google-satellite' ? 'bg-white text-primary-700 shadow-2xs font-bold' : 'text-gray-600'
              }`}
            >
              🛰️ Satellite
            </button>
            <button
              onClick={() => applyTileLayer('osm')}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                mapType === 'osm' ? 'bg-white text-primary-700 shadow-2xs font-bold' : 'text-gray-600'
              }`}
            >
              🌍 OpenStreet
            </button>
          </div>

          {/* Locate Admin Position Button */}
          <button
            onClick={handleLocateAdmin}
            className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
            title="Show Admin Location on Map"
          >
            <MdMyLocation className="w-4 h-4 text-blue-600" />
            Locate Me
          </button>

          {/* Live Simulator Toggle */}
          <button
            onClick={() => setIsSimulating(!isSimulating)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs ${
              isSimulating 
                ? 'bg-amber-500 text-white animate-pulse' 
                : 'bg-primary-50 text-primary-700 hover:bg-primary-100 border border-primary-200'
            }`}
          >
            {isSimulating ? <MdPause className="w-4 h-4" /> : <MdPlayArrow className="w-4 h-4" />}
            {isSimulating ? 'Live Motion Simulating' : '🎮 Test Live Motion'}
          </button>

          {/* Refresh Button */}
          <button
            onClick={fetchLocations}
            className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors text-xs font-semibold flex items-center gap-1 cursor-pointer"
            title="Refresh Live Locations"
          >
            <MdRefresh className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Map & Advisor List Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Sidebar: Advisor List */}
        <div className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100 space-y-4 lg:col-span-1 max-h-[650px] overflow-y-auto no-scrollbar">
          <div className="flex justify-between items-center border-b border-gray-100 pb-3">
            <h3 className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
              <MdDirectionsRun className="w-5 h-5 text-primary-600" />
              Advisors List ({filteredAdvisors.length})
            </h3>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
              🟢 Live 
            </span>
          </div>

          {loading ? (
            <div className="text-center py-10 text-xs text-gray-400">Loading advisor positions...</div>
          ) : filteredAdvisors.length === 0 ? (
            <div className="text-center py-10 text-xs text-gray-400">No advisors found.</div>
          ) : (
            <div className="space-y-2.5">
              {filteredAdvisors.map((advisor, idx) => {
                const { speed } = getSanitizedCoords(advisor, idx);
                const isSelected = selectedAdvisor?._id === advisor._id;
                const isMoving = speed > 5 || isSimulating;

                return (
                  <div
                    key={advisor._id}
                    onClick={() => handleFocusAdvisor(advisor)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer space-y-2 ${
                      isSelected 
                        ? 'bg-primary-50/70 border-primary-400 shadow-sm' 
                        : 'bg-gray-50/70 hover:bg-gray-100/70 border-gray-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-full bg-primary-100 text-primary-700 font-bold text-xs flex items-center justify-center border border-white shadow-2xs shrink-0">
                          {advisor.name ? advisor.name.charAt(0).toUpperCase() : 'A'}
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900 text-xs">{advisor.name}</h4>
                          <p className="text-[11px] text-gray-500">📍 {advisor.area || advisor.village || 'Gujarat'}</p>
                        </div>
                      </div>
                      <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                        !advisor.available ? 'bg-red-500' : isMoving ? 'bg-green-500 animate-ping' : 'bg-amber-500'
                      }`} />
                    </div>

                    <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-gray-200/50 text-gray-500 font-medium">
                      <span>📞 {advisor.phone}</span>
                      <span className={`font-bold ${isMoving ? 'text-green-700' : 'text-amber-700'}`}>
                        {isMoving ? `⚡ ${speed} km/h` : '🟡 Idle'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Map Canvas */}
        <div className="lg:col-span-3 bg-white rounded-3xl p-3 shadow-sm border border-gray-100 relative overflow-hidden h-[650px]">
          <div ref={mapRef} className="w-full h-full rounded-2xl z-0" />

          {/* Map Overlay Header Badge */}
          <div className="absolute top-6 left-6 z-10 bg-white/90 backdrop-blur-md border border-gray-200 px-4 py-2 rounded-2xl shadow-md flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-green-500 animate-ping" />
            <div>
              <p className="text-xs font-bold text-gray-900">Live GPS Tracking Active</p>
              <p className="text-[10px] text-gray-500">Updating positions every 6s • Interactive Map</p>
            </div>
          </div>

          {/* Selected Advisor Card Floating Panel */}
          {selectedAdvisor && (
            <div className="absolute bottom-6 left-6 right-6 md:left-auto md:right-6 z-10 bg-white/95 backdrop-blur-md border border-gray-200 p-4 rounded-2xl shadow-xl max-w-sm space-y-2">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-bold text-gray-900 text-sm">{selectedAdvisor.name}</h4>
                  <p className="text-xs text-gray-500">📍 {selectedAdvisor.village || 'N/A'}, Area: {selectedAdvisor.area || 'N/A'}</p>
                </div>
                <button
                  onClick={() => setSelectedAdvisor(null)}
                  className="text-xs text-gray-400 hover:text-gray-600 font-bold p-1 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-gray-100 font-medium text-gray-700">
                <div>
                  <span className="text-gray-400 block text-[10px]">Phone</span>
                  <span>{selectedAdvisor.phone || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px]">Movement</span>
                  <span className="text-green-600 font-bold">
                    {simLocations[selectedAdvisor._id] ? `Moving (${simLocations[selectedAdvisor._id].speed} km/h)` : 'Stationed'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
