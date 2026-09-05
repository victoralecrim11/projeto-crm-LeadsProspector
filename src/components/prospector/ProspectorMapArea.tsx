import React, { useEffect } from "react";
import {
  APIProvider,
  Map as GMap,
  AdvancedMarker,
  Pin,
  InfoWindow,
  useMap,
  useAdvancedMarkerRef,
} from "@vis.gl/react-google-maps";
import { MapPin, Info, X } from "lucide-react";
import { Lead } from "../../types";
import { openGoogleMapsPlace } from "../../utils/openGoogleMaps";

function MapUpdater({
  center,
  zoom,
}: {
  center: { lat: number; lng: number };
  zoom: number;
}) {
  const map = useMap();
  useEffect(() => {
    if (!map) return;
    map.panTo(center);
    map.setZoom(zoom);
  }, [map, center, zoom]);
  return null;
}

interface LeadMarkerProps {
  lead: Lead;
  isSelected: boolean;
  onSelect: (anchor: google.maps.marker.AdvancedMarkerElement) => void;
}

function LeadMarker({ lead, isSelected, onSelect }: LeadMarkerProps) {
  const [markerRef, marker] = useAdvancedMarkerRef();
  const pinColor = !lead.hasWebsite ? "#ef4444" : lead.inCrm ? "#10b981" : "#f59e0b";

  if (typeof lead.geoLat !== "number" || typeof lead.geoLng !== "number") {
    return null;
  }

  return (
    <AdvancedMarker
      position={{ lat: lead.geoLat, lng: lead.geoLng }}
      ref={markerRef}
      onClick={() => {
        if (marker) onSelect(marker);
      }}
      title={`${lead.name} (${lead.distanceKm ?? 0} km)`}
    >
      <Pin
        background={pinColor}
        borderColor="#ffffff"
        glyphColor="#ffffff"
        scale={isSelected ? 1.3 : 1.0}
      />
    </AdvancedMarker>
  );
}

interface ProspectorMapAreaProps {
  apiKey: string;
  mapCenter: { lat: number; lng: number };
  mapZoom: number;
  searchRadius: number;
  selectedCity: string;
  filteredLeads: Lead[];
  lastScanSource: "real" | "expanded" | "synthetic" | null;
  scanNotice: string | null;
  setScanNotice: (val: string | null) => void;
  radarPulse: boolean;
  activeMarkerLead: Lead | null;
  setActiveMarkerLead: (lead: Lead | null) => void;
  infoWindowAnchor: google.maps.marker.AdvancedMarkerElement | null;
  setInfoWindowAnchor: (anchor: google.maps.marker.AdvancedMarkerElement | null) => void;
  addCustomLead: (lead: Omit<Lead, "id" | "createdAt">) => void;
  addLeadToCrm: (leadId: string) => void;
  setPreviewLeads: React.Dispatch<React.SetStateAction<Lead[]>>;
  onSelectLeadForModal: (lead: Lead) => void;
  onNavigateToSettings: () => void;
  realOsmCount: number;
  demoCount: number;
}

export const ProspectorMapArea: React.FC<ProspectorMapAreaProps> = ({
  apiKey,
  mapCenter,
  mapZoom,
  searchRadius,
  selectedCity,
  filteredLeads,
  lastScanSource,
  scanNotice,
  setScanNotice,
  radarPulse,
  activeMarkerLead,
  setActiveMarkerLead,
  infoWindowAnchor,
  setInfoWindowAnchor,
  addCustomLead,
  addLeadToCrm,
  setPreviewLeads,
  onSelectLeadForModal,
  onNavigateToSettings,
  realOsmCount,
  demoCount,
}) => {
  return (
    <div className="xl:col-span-8 glass-panel p-2 rounded-2xl border border-white/10 relative min-h-[460px] flex flex-col">
      {/* Map Header Overlays (Status & Notice) */}
      <div className="absolute top-4 left-4 right-4 z-10 flex flex-col items-start gap-2 pointer-events-none">
        {/* Status Overlay */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950/85 backdrop-blur-md border border-white/15 text-xs shadow-lg pointer-events-auto flex-wrap">
          <div
            className={`w-2.5 h-2.5 rounded-full ${
              radarPulse ? "bg-sky-400 animate-ping" : "bg-emerald-400"
            }`}
          />
          <span className="font-semibold text-white">{selectedCity}</span>
          <span className="text-slate-400">|</span>
          <span className="text-sky-300 font-medium">
            {filteredLeads.length} alvos ({realOsmCount} OSM • {demoCount} Demo)
          </span>
          {lastScanSource && (
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${
                lastScanSource === "real"
                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-400/30"
                  : lastScanSource === "expanded"
                  ? "bg-amber-500/20 text-amber-300 border-amber-400/30"
                  : "bg-rose-500/20 text-rose-300 border-rose-400/30"
              }`}
              title={
                lastScanSource === "real"
                  ? "Dados reais do OpenStreetMap"
                  : lastScanSource === "expanded"
                  ? "Raio expandido (2x) - Dados reais do OpenStreetMap"
                  : "Dados demonstrativos (fallback)"
              }
            >
              {lastScanSource === "real"
                ? "✓ Real OSM"
                : lastScanSource === "expanded"
                ? "⟳ Expandido"
                : "⚠ Demo"}
            </span>
          )}
        </div>

        {/* Scan Notice */}
        {scanNotice && (
          <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-amber-500/90 backdrop-blur-md border border-amber-400/50 text-slate-900 text-xs shadow-lg max-w-md pointer-events-auto">
            <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <div className="flex-1 font-medium leading-snug">{scanNotice}</div>
            <button
              onClick={() => setScanNotice(null)}
              className="text-slate-700 hover:text-slate-900 transition-colors"
              aria-label="Fechar aviso"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Google Maps View */}
      <div className="w-full flex-1 min-h-[440px] rounded-xl overflow-hidden relative bg-slate-900">
        {apiKey ? (
          <APIProvider apiKey={apiKey}>
            <GMap
              defaultCenter={mapCenter}
              defaultZoom={mapZoom}
              mapId="DEMO_MAP_ID"
              internalUsageAttributionIds={["gmp_mcp_codeassist_v1_aistudio"]}
              className="w-full h-full"
              disableDefaultUI={false}
            >
              <MapUpdater center={mapCenter} zoom={mapZoom} />
              {filteredLeads.map((lead) => (
                <React.Fragment key={lead.id}>
                  <LeadMarker
                    lead={lead}
                    isSelected={activeMarkerLead?.id === lead.id}
                    onSelect={(anchor) => {
                      setActiveMarkerLead(lead);
                      setInfoWindowAnchor(anchor);
                    }}
                  />
                </React.Fragment>
              ))}

              {activeMarkerLead && infoWindowAnchor && (
                <InfoWindow
                  anchor={infoWindowAnchor}
                  onCloseClick={() => {
                    setActiveMarkerLead(null);
                    setInfoWindowAnchor(null);
                  }}
                  minWidth={280}
                  maxWidth={320}
                  pixelOffset={[0, -8]}
                >
                  <div
                    style={{
                      padding: "8px",
                      width: "280px",
                      color: "#0f172a",
                      fontFamily: "system-ui, -apple-system, sans-serif",
                      display: "flex",
                      flexDirection: "column",
                      gap: "6px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        justifyContent: "space-between",
                        gap: "8px",
                      }}
                    >
                      <h4
                        style={{
                          fontWeight: 700,
                          fontSize: "13px",
                          lineHeight: "1.25",
                          color: "#0f172a",
                          margin: 0,
                        }}
                      >
                        {activeMarkerLead.name}
                      </h4>
                      {activeMarkerLead.dataSource === "synthetic" ? (
                        <span
                          title="Lead de demonstração — não persistido no CRM"
                          style={{
                            fontSize: "9px",
                            fontWeight: 700,
                            color: "#9f1239",
                            background: "#fce7f3",
                            border: "1px solid #fbcfe8",
                            borderRadius: "4px",
                            padding: "1px 5px",
                            whiteSpace: "nowrap",
                            letterSpacing: "0.04em",
                          }}
                        >
                          ⚠ DEMO
                        </span>
                      ) : (
                        <span
                          title="Lead real do OpenStreetMap"
                          style={{
                            fontSize: "9px",
                            fontWeight: 700,
                            color: "#065f46",
                            background: "#d1fae5",
                            border: "1px solid #a7f3d0",
                            borderRadius: "4px",
                            padding: "1px 5px",
                            whiteSpace: "nowrap",
                            letterSpacing: "0.04em",
                          }}
                        >
                          ✓ REAL OSM
                        </span>
                      )}
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: 700,
                          color: "#d97706",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "2px",
                          whiteSpace: "nowrap",
                        }}
                      >
                        ★ {activeMarkerLead.rating}
                      </span>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        fontSize: "11px",
                        color: "#475569",
                      }}
                    >
                      <span style={{ fontWeight: 500 }}>
                        {activeMarkerLead.category}
                      </span>
                      <span>•</span>
                      <span>
                        📍 {activeMarkerLead.distanceKm ?? 2} km do centro
                      </span>
                    </div>

                    {activeMarkerLead.address && (
                      <p
                        style={{
                          fontSize: "11px",
                          color: "#64748b",
                          lineHeight: "1.35",
                          margin: 0,
                          wordBreak: "break-word",
                        }}
                      >
                        {activeMarkerLead.address}
                      </p>
                    )}

                    <div
                      style={{
                        marginTop: "6px",
                        paddingTop: "10px",
                        borderTop: "1px solid #e2e8f0",
                        display: "flex",
                        flexDirection: "column",
                        gap: "6px",
                      }}
                    >
                      {/* Row 1: + Adicionar / ✓ No CRM + Ver Detalhes */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        {!activeMarkerLead.inCrm ? (
                          <button
                            onClick={() => {
                              if (
                                activeMarkerLead.dataSource === "synthetic"
                              ) {
                                addCustomLead({
                                  ...activeMarkerLead,
                                  inCrm: true,
                                  crmStage: "novo",
                                  dataSource: "synthetic",
                                } as Omit<Lead, "id" | "createdAt">);
                                setPreviewLeads((prev) =>
                                  prev.filter(
                                    (p) => p.id !== activeMarkerLead.id
                                  )
                                );
                              } else {
                                addLeadToCrm(activeMarkerLead.id);
                              }
                              setActiveMarkerLead(null);
                              setInfoWindowAnchor(null);
                            }}
                            style={{
                              flex: 1,
                              padding: "6px 8px",
                              fontSize: "11px",
                              fontWeight: 700,
                              background: "#4f46e5",
                              color: "#ffffff",
                              border: "none",
                              borderRadius: "8px",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            + Adicionar
                          </button>
                        ) : (
                          <span
                            style={{
                              flex: 1,
                              padding: "6px 8px",
                              fontSize: "11px",
                              fontWeight: 600,
                              color: "#047857",
                              background: "#d1fae5",
                              borderRadius: "8px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            ✓ No CRM
                          </span>
                        )}
                        <button
                          onClick={() => {
                            onSelectLeadForModal(activeMarkerLead);
                          }}
                          style={{
                            flex: 1,
                            padding: "6px 8px",
                            fontSize: "11px",
                            fontWeight: 500,
                            background: "#f1f5f9",
                            color: "#334155",
                            border: "none",
                            borderRadius: "8px",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          Ver Detalhes
                        </button>
                      </div>

                      {/* Row 2: Ver no Maps (Utilizando busca contextualizada por nome e endereço) */}
                      <button
                        onClick={() => openGoogleMapsPlace(activeMarkerLead)}
                        style={{
                          width: "100%",
                          padding: "6px 8px",
                          fontSize: "11px",
                          fontWeight: 500,
                          background: "#e0f2fe",
                          color: "#0369a1",
                          border: "1px solid #bae6fd",
                          borderRadius: "8px",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "4px",
                        }}
                      >
                        📍 Ver localização no Maps
                      </button>
                    </div>
                  </div>
                </InfoWindow>
              )}
            </GMap>
          </APIProvider>
        ) : (
          /* High-fidelity interactive simulated Radar Map when API key is set to demo mode */
          <div className="w-full h-full min-h-[440px] bg-gradient-to-b from-slate-950 via-slate-900 to-indigo-950/40 p-4 flex flex-col justify-between relative overflow-hidden select-none">
            {/* Radar Grid Circles with Dynamic Range Labels */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-25">
              <div className="w-[140px] h-[140px] border border-sky-400/80 rounded-full flex items-start justify-center pt-1">
                <span className="text-[9px] font-mono text-sky-300 bg-slate-950/80 px-1 rounded">
                  {(searchRadius * 0.25).toFixed(1)} km
                </span>
              </div>
              <div className="absolute w-[260px] h-[260px] border border-sky-400/60 rounded-full flex items-start justify-center pt-1">
                <span className="text-[9px] font-mono text-sky-300 bg-slate-950/80 px-1 rounded">
                  {(searchRadius * 0.5).toFixed(1)} km
                </span>
              </div>
              <div className="absolute w-[380px] h-[380px] border border-sky-400/50 rounded-full flex items-start justify-center pt-1">
                <span className="text-[9px] font-mono text-sky-300 bg-slate-950/80 px-1 rounded">
                  {(searchRadius * 0.75).toFixed(1)} km
                </span>
              </div>
              <div className="absolute w-[500px] h-[500px] border-2 border-dashed border-sky-400/40 rounded-full flex items-start justify-center pt-1">
                <span className="text-[10px] font-bold font-mono text-sky-300 bg-sky-950/90 px-2 py-0.5 rounded border border-sky-400/40">
                  Limite {searchRadius} km
                </span>
              </div>
              <div className="absolute w-full h-[1px] bg-sky-400/20" />
              <div className="absolute h-full w-[1px] bg-sky-400/20" />
            </div>

            {/* Simulated Pins scattered accurately on radar by distance and angle */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="relative w-[480px] h-[480px]">
                {filteredLeads.map((lead, idx) => {
                  const distRatio = Math.min(
                    1,
                    Math.max(0.12, (lead.distanceKm ?? 5) / searchRadius)
                  );
                  const radiusPx = distRatio * 220;
                  const angleRad = (idx * 53.7 + 20) * (Math.PI / 180);
                  const topPos = 240 - Math.sin(angleRad) * radiusPx;
                  const leftPos = 240 + Math.cos(angleRad) * radiusPx;
                  const isSelected = activeMarkerLead?.id === lead.id;

                  return (
                    <div
                      key={lead.id}
                      onClick={() => setActiveMarkerLead(lead)}
                      style={{ top: `${topPos}px`, left: `${leftPos}px` }}
                      className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-transform hover:scale-125 z-20 pointer-events-auto group"
                    >
                      <div className="relative flex flex-col items-center">
                        <div
                          className={`p-1.5 rounded-full border shadow-lg flex items-center justify-center transition-all ${
                            isSelected ? "ring-4 ring-sky-400 scale-125" : ""
                          } ${
                            !lead.hasWebsite
                              ? "bg-rose-500 text-white border-white animate-pulse"
                              : lead.inCrm
                              ? "bg-emerald-500 text-white border-white"
                              : "bg-amber-500 text-white border-white"
                          }`}
                        >
                          <MapPin className="w-3.5 h-3.5" />
                        </div>

                        <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-12 px-2 py-1 rounded-md bg-slate-900 text-[10px] text-white whitespace-nowrap border border-white/20 shadow-xl pointer-events-none z-30 flex flex-col gap-0.5">
                          <div className="font-bold flex items-center gap-1">
                            {lead.name}{" "}
                            <span className="text-amber-400">
                              ({lead.rating}★)
                            </span>
                          </div>
                          <div className="text-slate-300 font-normal">
                            {lead.address || lead.category}
                          </div>
                          <div className="text-sky-300 font-bold">
                            {lead.distanceKm} km do centro
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footer Info Notice with API Key Setup helper */}
            <div className="mt-auto z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-3 rounded-xl bg-slate-950/90 backdrop-blur-md border border-white/15">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-sky-400 shrink-0" />
                <p className="text-[11px] text-slate-300">
                  Modo Radar Demo Ativo. <strong>Raio: {searchRadius} km</strong> |{" "}
                  {filteredLeads.length} negócios mapeados na zona.
                </p>
              </div>
              <button
                onClick={onNavigateToSettings}
                className="px-3 py-1 text-xs font-semibold text-sky-300 bg-sky-500/20 hover:bg-sky-500/30 border border-sky-400/30 rounded-lg transition-colors shrink-0"
              >
                Configurar API Key
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Map Legend */}
      <div className="flex items-center justify-between px-3 py-2 text-[11px] text-slate-400 border-t border-white/10 mt-2 bg-white/[0.02] rounded-lg">
        <div className="flex items-center gap-4 flex-wrap">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <span>Sem Website (Urgente)</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span>Site Lento / Antigo</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>Oportunidade no CRM</span>
          </span>
        </div>
        <span className="hidden sm:inline">
          Clique no marcador para auditar
        </span>
      </div>
    </div>
  );
};
