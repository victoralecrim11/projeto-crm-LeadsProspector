import React, { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Info, X } from "lucide-react";
import { Lead } from "../../types";
import { isValidCoordinate } from "../../utils/coordinates";
import { hasPreciseOsmAddress, openLeadLocation, openOpenStreetMapLocation } from "../../utils/openGoogleMaps";

const tileUrl = import.meta.env.VITE_MAP_TILE_URL || "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const tileAttribution = import.meta.env.VITE_MAP_TILE_ATTRIBUTION || '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

const markerIcon = (color: string) => L.divIcon({
  className: "custom-leaflet-icon",
  html: `<div style="background:${color};width:24px;height:24px;border-radius:50%;border:2px solid white;box-shadow:0 2px 4px #0006"></div>`,
  iconSize: [24, 24], iconAnchor: [12, 12], popupAnchor: [0, -12],
});

interface Props {
  mapCenter: { lat: number; lng: number }; mapZoom: number; searchRadius: number; selectedCity: string;
  filteredLeads: Lead[]; lastScanSource: "real" | "expanded" | null; scanNotice: string | null;
  setScanNotice: (val: string | null) => void; radarPulse: boolean; activeMarkerLead: Lead | null;
  setActiveMarkerLead: (lead: Lead | null) => void;
  addLeadToCrm: (leadId: string) => void;
  onSelectLeadForModal: (lead: Lead) => void; realOsmCount: number; demoCount: number;
}

function button(label: string, action: () => void, css: string) {
  const el = document.createElement("button");
  el.type = "button"; el.textContent = label; el.style.cssText = css; el.addEventListener("click", action);
  return el;
}

function popupContent(lead: Lead, onAdd: () => void, onDetails: () => void) {
  const root = document.createElement("div");
  root.style.cssText = "display:flex;flex-direction:column;gap:7px;width:min(320px,calc(100vw - 64px));min-width:0";
  const header = document.createElement("div"); header.style.cssText = "display:flex;align-items:flex-start;gap:7px";
  const name = document.createElement("strong"); name.textContent = lead.name; name.style.cssText = "font-size:13px;flex:1"; header.append(name);
  const badge = document.createElement("span"); badge.style.cssText = "font-size:9px;font-weight:700;padding:2px 5px;border-radius:4px;white-space:nowrap";
  if (lead.dataSource === "real" && lead.osmType && lead.osmId) {
    badge.textContent = "✓ REAL OSM"; badge.title = "Registro obtido diretamente do OpenStreetMap. Isso confirma a procedência do registro, não que o negócio esteja ativo atualmente.";
    badge.style.background = "#d1fae5"; badge.style.color = "#065f46";
  } else { badge.textContent = "MANUAL / ORIGEM NÃO INFORMADA"; badge.style.background = "#f3f4f6"; badge.style.color = "#374151"; }
  header.append(badge); root.append(header);
  const facts = document.createElement("div");
  facts.textContent = `${lead.category} • ${typeof lead.rating === "number" ? `★ ${lead.rating} • ` : ""}${typeof lead.distanceKm === "number" ? `📍 ${lead.distanceKm} km do centro` : "Distância não informada"}`;
  facts.style.cssText = "font-size:11px;color:#475569"; root.append(facts);
  if (lead.address) { const address = document.createElement("span"); address.textContent = lead.address; address.style.cssText = "font-size:11px;color:#64748b"; root.append(address); }
  const actions = document.createElement("div"); actions.style.cssText = "display:flex;flex-direction:column;gap:5px;padding-top:7px;border-top:1px solid #e2e8f0";
  actions.append(button(lead.inCrm ? "✓ No CRM" : "+ Adicionar", onAdd, "padding:6px 8px;font-size:11px;font-weight:700;border:0;border-radius:8px;cursor:pointer;background:#4f46e5;color:white"));
  actions.append(button("Ver detalhes", onDetails, "padding:6px 8px;font-size:11px;border:0;border-radius:8px;cursor:pointer;background:#f1f5f9;color:#334155"));
  const locationLabel = hasPreciseOsmAddress(lead) ? "📍 Pesquisar empresa no Google Maps" : "📍 Abrir coordenada no Google Maps";
  actions.append(button(locationLabel, () => openLeadLocation(lead), "padding:6px 8px;font-size:11px;border:1px solid #bae6fd;border-radius:8px;cursor:pointer;background:#e0f2fe;color:#0369a1"));
  if (isValidCoordinate(lead.geoLat, lead.geoLng)) {
    actions.append(button("🗺 Ver ponto exato no OpenStreetMap", () => openOpenStreetMapLocation(lead), "padding:6px 8px;font-size:11px;font-weight:700;border:1px solid #86efac;border-radius:8px;cursor:pointer;background:#f0fdf4;color:#166534"));
  }
  if (lead.osmType && lead.osmId && isValidCoordinate(lead.geoLat, lead.geoLng)) {
    const osm = document.createElement("a"); osm.href = `https://www.openstreetmap.org/${lead.osmType}/${lead.osmId}`;
    osm.target = "_blank"; osm.rel = "noopener noreferrer"; osm.textContent = "↗ Ver origem no OpenStreetMap";
    osm.style.cssText = "display:flex;align-items:center;justify-content:center;padding:7px 9px;border:1px solid #6ee7b7;border-radius:8px;background:linear-gradient(135deg,#ecfdf5,#d1fae5);font-size:11px;font-weight:700;color:#047857;text-decoration:none;box-shadow:0 1px 2px #0478571a"; actions.append(osm);
  }
  root.append(actions); return root;
}

export const ProspectorMapArea: React.FC<Props> = (props) => {
  const elementRef = useRef<HTMLDivElement | null>(null); const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null); const circleRef = useRef<L.Circle | null>(null);

  useEffect(() => {
    if (!elementRef.current || mapRef.current) return;
    const map = L.map(elementRef.current).setView([props.mapCenter.lat, props.mapCenter.lng], props.mapZoom);
    L.tileLayer(tileUrl, { attribution: tileAttribution, maxZoom: 19 }).addTo(map);
    markersRef.current = L.layerGroup().addTo(map);
    circleRef.current = L.circle([props.mapCenter.lat, props.mapCenter.lng], { radius: props.searchRadius * 1000, fillColor: "#38bdf8", fillOpacity: .1, color: "#0284c7", weight: 1 }).addTo(map);
    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; markersRef.current = null; circleRef.current = null; };
  }, []);

  useEffect(() => {
    const map = mapRef.current; const markers = markersRef.current; const circle = circleRef.current;
    if (!map || !markers || !circle || !isValidCoordinate(props.mapCenter.lat, props.mapCenter.lng)) return;
    map.setView([props.mapCenter.lat, props.mapCenter.lng], props.mapZoom);
    circle.setLatLng([props.mapCenter.lat, props.mapCenter.lng]).setRadius(props.searchRadius * 1000); markers.clearLayers();
    props.filteredLeads.forEach((lead) => {
      if (!isValidCoordinate(lead.geoLat, lead.geoLng)) return;
      const color = !lead.hasWebsite ? "#ef4444" : lead.inCrm ? "#10b981" : "#f59e0b";
      const marker = L.marker([lead.geoLat, lead.geoLng], { icon: markerIcon(color) });
      marker.bindPopup(popupContent(lead, () => {
        if (!lead.inCrm) {
          props.addLeadToCrm(lead.id);
        }
        marker.closePopup();
      }, () => props.onSelectLeadForModal(lead)));
      marker.on("click", () => { props.setActiveMarkerLead(lead); marker.openPopup(); }); marker.on("popupclose", () => props.setActiveMarkerLead(null)); markers.addLayer(marker);
    });
  }, [props.mapCenter, props.mapZoom, props.searchRadius, props.filteredLeads, props.addLeadToCrm, props.setActiveMarkerLead, props.onSelectLeadForModal]);

  const scanLabel = props.lastScanSource === "expanded" ? "⟳ Expandido" : "✓ Real OSM";
  return <div className="xl:col-span-8 glass-panel p-2 rounded-2xl border border-white/10 relative min-h-[460px] flex flex-col">
    <div className="absolute top-4 left-4 right-4 z-[400] flex flex-col items-start gap-2 pointer-events-none">
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950/85 backdrop-blur-md border border-white/15 text-xs shadow-lg pointer-events-auto flex-wrap"><div className={`w-2.5 h-2.5 rounded-full ${props.radarPulse ? "bg-sky-400 animate-ping" : "bg-emerald-400"}`} /><span className="font-semibold text-white">{props.selectedCity}</span><span className="text-slate-400">|</span><span className="text-sky-300 font-medium">{props.filteredLeads.length} alvos reais OSM</span>{props.lastScanSource && <span className="px-1.5 py-0.5 rounded text-[10px] font-bold border bg-emerald-500/20 text-emerald-300 border-emerald-400/30">{scanLabel}</span>}</div>
      {props.scanNotice && <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-amber-500/90 border border-amber-400/50 text-slate-900 text-xs shadow-lg max-w-md pointer-events-auto"><Info className="w-4 h-4 mt-0.5 shrink-0" /><div className="flex-1 font-medium leading-snug">{props.scanNotice}</div><button onClick={() => props.setScanNotice(null)} aria-label="Fechar aviso"><X className="w-3.5 h-3.5" /></button></div>}
    </div>
    <div ref={elementRef} className="w-full flex-1 min-h-[440px] rounded-xl overflow-hidden relative bg-slate-900 z-10" />
    <div className="flex items-center justify-between px-3 py-2 text-[11px] text-slate-400 border-t border-white/10 mt-2"><span>OpenStreetMap / Overpass • clique em um marcador para ver a origem</span></div>
  </div>;
};
