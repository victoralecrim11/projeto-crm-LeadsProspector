import React, {
  useState,
  useMemo,
  useEffect,
} from "react";
import {
  APIProvider,
  Map as GMap,
  AdvancedMarker,
  Pin,
  InfoWindow,
  useMap,
  useAdvancedMarkerRef,
} from "@vis.gl/react-google-maps";
import {
  MapPin,
  Search,
  Sparkles,
  Filter,
  Star,
  Globe,
  Phone,
  Plus,
  Check,
  ExternalLink,
  Layers,
  SlidersHorizontal,
  Compass,
  AlertTriangle,
  RefreshCw,
  Mail,
  Zap,
  Info,
  X,
  ShieldCheck,
  DollarSign,
} from "lucide-react";
import { useCrm, safeStorage } from "../context/CrmContext";
import { Lead } from "../types";
import { ResponsiveSelect } from "./common/ResponsiveSelect";
import {
  SearchAutocomplete,
  AutocompleteSuggestion,
} from "./common/SearchAutocomplete";
import {
  useCityNeighborhoods,
  BASE_CITY_NEIGHBORHOODS,
} from "../services/neighborhoodService";
import {
  matchesNiche,
  generateRealisticLeadsForLocation,
  NEIGHBORHOOD_CENTROIDS,
} from "../services/leadGeneratorService";
import { fetchLeadsFromOverpass } from "../services/overpassService";

type ScanSource = "real" | "expanded" | "synthetic" | null;
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

// Opens Google Maps in a new tab showing the real business listing.
// Strategy:
//   1. Drop a pin exactly at the coordinates (if available) using the Search API format
//   2. Fallback to name search if no coordinates are available
function openGoogleMapsPlace(
  lead: { name: string; address?: string; geoLat?: number; geoLng?: number }
) {
  const nameQuery = lead.name.trim();
  const hasCoords = !!(lead.geoLat && lead.geoLng);

  if (hasCoords) {
    // Drops a red pin at the exact coordinates.
    // If there is a real Google Place there, its icon will be right next to the pin.
    window.open(
      `https://www.google.com/maps/search/?api=1&query=${lead.geoLat},${lead.geoLng}`,
      '_blank',
      'noopener,noreferrer',
    );
    return;
  }

  // No coords at all: search by name only
  window.open(
    `https://www.google.com/maps/search/${encodeURIComponent(nameQuery)}`,
    '_blank',
    'noopener,noreferrer',
  );
}

// Sub-component: each marker owns its own useAdvancedMarkerRef
// This avoids the race condition where a shared ref is transferred
// between markers in the same render cycle, causing anchor to be stale.
interface LeadMarkerProps {
  lead: { id: string; geoLat: number; geoLng: number; distanceKm?: number; name: string; hasWebsite?: boolean; inCrm?: boolean; address?: string };
  isSelected: boolean;
  onSelect: (anchor: google.maps.marker.AdvancedMarkerElement) => void;
  onOpenMaps: () => void;
}
function LeadMarker({ lead, isSelected, onSelect, onOpenMaps }: LeadMarkerProps) {
  const [markerRef, marker] = useAdvancedMarkerRef();
  const pinColor = !lead.hasWebsite ? "#ef4444" : lead.inCrm ? "#10b981" : "#f59e0b";
  return (
    <AdvancedMarker
      position={{ lat: lead.geoLat, lng: lead.geoLng }}
      ref={markerRef}
      onClick={() => { if (marker) onSelect(marker); }}
      title={`${lead.name} (${lead.distanceKm} km)`}
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
// Centrais de coordenadas para cidades comuns
const CITY_COORDINATES: Record<string, { lat: number; lng: number }> = {
  "Belo Horizonte - MG": { lat: -19.9167, lng: -43.9345 },
  "São Paulo - SP": { lat: -23.5505, lng: -46.6333 },
  "Rio de Janeiro - RJ": { lat: -22.9068, lng: -43.1729 },
  "Curitiba - PR": { lat: -25.4284, lng: -49.2733 },
  "Porto Alegre - RS": { lat: -30.0346, lng: -51.2177 },
  "Salvador - BA": { lat: -12.9777, lng: -38.5016 },
  "Brasília - DF": { lat: -15.7975, lng: -47.8919 },
  "Goiânia - GO": { lat: -16.6869, lng: -49.2648 },
  "Campinas - SP": { lat: -22.9099, lng: -47.0626 },
  "Recife - PE": { lat: -8.0476, lng: -34.877 },
};

// Bairros e regiões populares por cidade (Consolidado a partir de catálogo curado + API IBGE)
export const CITY_NEIGHBORHOODS: Record<string, string[]> =
  BASE_CITY_NEIGHBORHOODS;

// Utilitário de normalização de texto sem acentos e minúsculo
export function normalizeStr(text: string): string {
  if (!text) return "";
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

interface GoogleMapsProspectorProps {
  onSelectLeadForEmail?: (lead: Lead) => void;
}

export const GoogleMapsProspector: React.FC<GoogleMapsProspectorProps> = ({
  onSelectLeadForEmail,
}) => {
  const {
    leads,
    addLeadToCrm,
    redesignLeadSite,
    setActivePage,
    setSelectedLeadForModal,
    crmSettings,
    addCustomLead,
  } = useCrm();

  const [selectedCity, setSelectedCity] = useState<string>(
    "Belo Horizonte - MG",
  );
  const [selectedNeighborhood, setSelectedNeighborhood] =
    useState<string>("Todos os Bairros");
  const [selectedNiche, setSelectedNiche] = useState<string>("Todos os Nichos");
  const [searchRadius, setSearchRadius] = useState<number>(15);
  const [onlyWithoutWebsite, setOnlyWithoutWebsite] = useState<boolean>(false);
  const [onlyHighRating, setOnlyHighRating] = useState<boolean>(false);
  const [auditStatusFilter, setAuditStatusFilter] = useState<string>("Todos");
  const [priceMin, setPriceMin] = useState<number>(0);
  const [priceMax, setPriceMax] = useState<number>(5000);
const [searchQuery, setSearchQuery] = useState<string>("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState<string>("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [lastScanSource, setLastScanSource] = useState<ScanSource>(null);
  const [scanNotice, setScanNotice] = useState<string | null>(null);
  const [activeMarkerLead, setActiveMarkerLead] = useState<Lead | null>(null);
  const [infoWindowAnchor, setInfoWindowAnchor] = useState<google.maps.marker.AdvancedMarkerElement | null>(null);

  // Synthetic (demo) leads stay in a separate ephemeral buffer so they show
  // on the map preview but are NEVER persisted to localStorage / CRM.
  // Only real OSM leads (dataSource === 'real') reach the CRM via addCustomLead.
  const [previewLeads, setPreviewLeads] = useState<Lead[]>([]);

  // Reverse Geocoding for InfoWindow
  useEffect(() => {
    if (!activeMarkerLead || !activeMarkerLead.geoLat || !activeMarkerLead.geoLng) return;
    
    // Only attempt geocoding if the address is missing or too generic (e.g., just the city name)
    const isMissingAddress = !activeMarkerLead.address || activeMarkerLead.address.length < 15 || !activeMarkerLead.address.includes(',');
    
    if (isMissingAddress && window.google?.maps?.Geocoder) {
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ location: { lat: activeMarkerLead.geoLat, lng: activeMarkerLead.geoLng } }, (results, status) => {
        if (status === 'OK' && results && results[0]) {
          const newAddress = results[0].formatted_address;
          setActiveMarkerLead(prev => prev ? { ...prev, address: newAddress } : null);
          
          if (activeMarkerLead.dataSource === 'synthetic') {
             setPreviewLeads(prev => prev.map(p => p.id === activeMarkerLead.id ? { ...p, address: newAddress } : p));
          } else {
             // For real OSM leads, we only update the local active marker. 
             // To persist to CRM, it will be added with the enriched address when "+ Adicionar" is clicked.
          }
        }
      });
    }
  }, [activeMarkerLead]);

  const [radarPulse, setRadarPulse] = useState<boolean>(false);

  // Dynamic neighborhoods powered by IBGE Localidades API, Curated baseline, CRM Leads & User additions
  const {
    neighborhoods: currentCityNeighborhoods,
    isSyncing: isSyncingNeighborhoods,
    addNeighborhood: addCustomNeighborhoodService,
    refreshFromApi: refreshNeighborhoodsFromApi,
    searchApi: searchNeighborhoodsApi,
  } = useCityNeighborhoods(selectedCity, leads);

  const [showAddBairroModal, setShowAddBairroModal] = useState<boolean>(false);
  const [newBairroInput, setNewBairroInput] = useState<string>("");
  const [apiSuggestions, setApiSuggestions] = useState<
    { name: string; type: string; fullAddress?: string }[]
  >([]);
  const [isSearchingApi, setIsSearchingApi] = useState<boolean>(false);

  // Live auto-complete search against Google Places API and OpenStreetMap when typing in modal
  useEffect(() => {
    if (!showAddBairroModal) {
      setApiSuggestions((prev) => (prev.length > 0 ? [] : prev));
      setIsSearchingApi(false);
      return;
    }
    const clean = newBairroInput.trim();
    if (clean.length < 2) {
      setApiSuggestions((prev) => (prev.length > 0 ? [] : prev));
      setIsSearchingApi(false);
      return;
    }

    let active = true;
    const timer = setTimeout(async () => {
      setIsSearchingApi(true);
      try {
        const res = await searchNeighborhoodsApi(clean);
        if (active) {
          setApiSuggestions(res);
        }
      } catch (err) {
        console.warn("[GoogleMapsProspector] Auto-complete error:", err);
      } finally {
        if (active) {
          setIsSearchingApi(false);
        }
      }
    }, 300);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [newBairroInput, showAddBairroModal, searchNeighborhoodsApi]);

  const handleAddCustomNeighborhood = (bairroName: string) => {
    const clean = bairroName.trim();
    if (!clean) return;
    addCustomNeighborhoodService(clean);
    setSelectedNeighborhood(clean);
    setShowAddBairroModal(false);
    setNewBairroInput("");
    setApiSuggestions([]);
  };

  // Reset neighborhood selection when city changes
  const handleCityChange = (newCity: string) => {
    setSelectedCity(newCity);
    setSelectedNeighborhood("Todos os Bairros");
  };

  // Derive coordinates based on selected city
  const mapCenter = useMemo(() => {
    return (
      CITY_COORDINATES[selectedCity] || CITY_COORDINATES["Belo Horizonte - MG"]
    );
  }, [selectedCity]);

  // Dynamic zoom for Google Map according to search radius in km
  const mapZoom = useMemo(() => {
    if (searchRadius <= 4) return 14;
    if (searchRadius <= 10) return 13;
    if (searchRadius <= 22) return 12;
    if (searchRadius <= 38) return 11;
    return 10;
  }, [searchRadius]);

  // Merge CRM leads with ephemeral synthetic preview leads so the map shows
  // every visible pin (real + demo). The dataSource field on each lead drives
  // the badge/InfoWindow color.
  const allVisibleLeads = useMemo(() => {
    // Avoid double-rendering: if a preview lead happens to match a CRM lead
    // by placeId, keep the CRM one (it has richer data).
    const crmPlaceIds = new Set(leads.map((l) => l.placeId).filter(Boolean));
    const dedupedPreviews = previewLeads.filter((p) => !p.placeId || !crmPlaceIds.has(p.placeId));
    return [...leads, ...dedupedPreviews];
  }, [leads, previewLeads]);

  // Generate coordinate offsets for leads based on city center for realistic geographic map placement
  const mappedLeads = useMemo(() => {
    return allVisibleLeads.map((lead, index) => {
      // Deterministic distance in km if not already specified on lead
      const distanceKm =
        lead.distanceKm ?? Number((1.2 + ((index * 3.7) % 46)).toFixed(1));

      // Calculate realistic geographic offset based on distanceKm
      const angle = (index * 53.7 + 15) * (Math.PI / 180);
      const deltaLat = (distanceKm / 111) * Math.sin(angle);
      const deltaLng = (distanceKm / 104) * Math.cos(angle);
      const lat = lead.geoLat ?? mapCenter.lat + deltaLat;
      const lng = lead.geoLng ?? mapCenter.lng + deltaLng;

      return {
        ...lead,
        distanceKm,
        geoLat: lat,
        geoLng: lng,
      };
    });
  }, [allVisibleLeads, mapCenter]);

  // Multi-token Accent-insensitive Query
  const searchSuggestions: AutocompleteSuggestion[] = useMemo(() => {
    const list: AutocompleteSuggestion[] = [];

    // 1. Lead names
    leads.forEach((lead) => {
      list.push({
        id: `lead-${lead.id}`,
        title: lead.name,
        subtitle: `${lead.category} • ${lead.neighborhood || lead.city}`,
        category: "empresa",
        badge: lead.inCrm ? "No Funil" : "Lead",
        payload: { type: "lead", id: lead.id, name: lead.name },
      });
    });

    // 2. Neighborhoods
    currentCityNeighborhoods.forEach((nb) => {
      if (nb !== "Todos os Bairros") {
        list.push({
          id: `nb-${nb}`,
          title: nb,
          subtitle: `Bairro em ${selectedCity}`,
          category: "bairro",
          badge: "Bairro",
          payload: { type: "neighborhood", name: nb },
        });
      }
    });

    // 3. Addresses
    const seenAddresses = new Set<string>();
    leads.forEach((lead) => {
      if (lead.address && !seenAddresses.has(lead.address)) {
        seenAddresses.add(lead.address);
        list.push({
          id: `addr-${lead.id}`,
          title: lead.address,
          subtitle: `Localização de ${lead.name}`,
          category: "endereco",
          badge: "Endereço",
          payload: { type: "address", address: lead.address },
        });
      }
    });

    return list;
  }, [leads, currentCityNeighborhoods, selectedCity]);

  const handleSelectSuggestion = (item: AutocompleteSuggestion) => {
    if (item.payload?.type === "neighborhood") {
      setSelectedNeighborhood(item.payload.name);
      setSearchQuery("");
    } else {
      setSearchQuery(item.title);
    }
  };

  const filteredLeads = useMemo(() => {
    return mappedLeads.filter((lead) => {
      const leadCityNorm = normalizeStr(lead.city);
      const selectedCitySimple = normalizeStr(selectedCity.split(" - ")[0]);

      // City filter (if lead has city specified and differs from current city)
      if (
        leadCityNorm &&
        selectedCitySimple &&
        !leadCityNorm.includes(selectedCitySimple) &&
        !selectedCitySimple.includes(leadCityNorm)
      ) {
        // If the lead was created for another city, skip unless matching custom query
        if (!searchQuery.trim()) {
          return false;
        }
      }

      // Neighborhood dropdown filter
      if (selectedNeighborhood !== "Todos os Bairros") {
        const targetBairroNorm = normalizeStr(selectedNeighborhood);
        const leadBairroNorm = normalizeStr(lead.neighborhood || "");
        const leadAddrNorm = normalizeStr(lead.address || "");
        if (
          !leadBairroNorm.includes(targetBairroNorm) &&
          !leadAddrNorm.includes(targetBairroNorm)
        ) {
          return false;
        }
      }

      // Niche filter (Flexible matching across category and niche)
      if (
        selectedNiche !== "Todos os Nichos" &&
        !matchesNiche(lead.category || "", selectedNiche) &&
        !matchesNiche(lead.niche || "", selectedNiche)
      ) {
        return false;
      }

      // Checkbox filters
      if (onlyWithoutWebsite && lead.hasWebsite) {
        return false;
      }
      if (onlyHighRating && lead.rating < 4.8) {
        return false;
      }

      // Advanced Filter: Audit Status (auditado / não auditado / no CRM)
      if (auditStatusFilter !== "Todos") {
        const isAudited = !!lead.audit;
        const inCrm = !!lead.inCrm;
        if (auditStatusFilter === "Auditados" && !isAudited) return false;
        if (auditStatusFilter === "NaoAuditados" && isAudited) return false;
        if (auditStatusFilter === "NoCRM" && !inCrm) return false;
        if (auditStatusFilter === "ForaCRM" && inCrm) return false;
      }

      // Advanced Filter: Estimated Price Range (dealValue in BRL)
      const leadPrice = lead.dealValue ?? 1800;
      if (leadPrice < priceMin || leadPrice > priceMax) {
        return false;
      }

      // Search Query filter (Multi-token, Accent-insensitive across Company Name, Neighborhood, Street Address, Niche, City, Phone)
      if (debouncedSearchQuery.trim()) {
        const queryNormalized = normalizeStr(debouncedSearchQuery);
        const tokens = queryNormalized.split(/\s+/).filter(Boolean);

        const searchableCorpus = normalizeStr(
          [
            lead.name || "",
            lead.category || "",
            lead.niche || "",
            lead.neighborhood || "",
            lead.address || "",
            lead.city || "",
            lead.state || "",
            lead.phone || "",
            lead.whatsapp || "",
          ].join(" "),
        );

        const matchesAllTokens = tokens.every((token) =>
          searchableCorpus.includes(token),
        );
        if (!matchesAllTokens) {
          return false;
        }
      }

      // Enforce search radius boundary across all leads consistently
      if (lead.distanceKm !== undefined && lead.distanceKm > searchRadius) {
        return false;
      }

      return true;
    });
  }, [
    mappedLeads,
    selectedCity,
    selectedNeighborhood,
    selectedNiche,
    onlyWithoutWebsite,
    onlyHighRating,
    debouncedSearchQuery,
    searchRadius,
  ]);

  // Dynamic Scan: Hybrid approach - Overpass API → Expanded radius → Synthetic fallback
  const handleScan = async (overrideQuery?: string | unknown) => {
    setIsScanning(true);
    setRadarPulse(true);
    setLastScanSource(null);
    setScanNotice(null);
    setPreviewLeads([]); // clear previous demo buffer before each new scan

    const activeQuery =
      typeof overrideQuery === "string" ? overrideQuery : searchQuery;
    const cleanQuery = (activeQuery || "").trim();

    try {
      const cityName = selectedCity.split(" - ")[0];
      const stateName = selectedCity.split(" - ")[1] || "MG";

      // Parse coordinates for Overpass search
      let coords = CITY_COORDINATES[selectedCity] || CITY_COORDINATES["Belo Horizonte - MG"];
      if (selectedNeighborhood !== "Todos os Bairros") {
        const normBairro = normalizeStr(selectedNeighborhood);
        if (NEIGHBORHOOD_CENTROIDS[normBairro]) {
          coords = NEIGHBORHOOD_CENTROIDS[normBairro];
        }
      }

      if (!coords) {
        throw new Error("City coordinates not found");
      }

      // Step 1: Try Overpass API with current radius
      const overpassLeads = await fetchLeadsFromOverpass(
        {
          lat: coords.lat,
          lng: coords.lng,
          radiusMeters: searchRadius * 1000,
          niche: selectedNiche !== "Todos os Nichos" ? selectedNiche : undefined,
          maxResults: 30
        },
        cityName,
        stateName
      );

      if (overpassLeads.length >= 8) {
        console.log(`[handleScan] Found ${overpassLeads.length} real leads via Overpass`);
        addCustomLeads(overpassLeads.map(l => ({
          ...l,
          neighborhood: l.neighborhood || (selectedNeighborhood !== "Todos os Bairros" ? selectedNeighborhood : ""),
          inCrm: false,
          temperature: 'quente' as const,
        })));
        setLastScanSource("real");
        setScanNotice(null);
        setIsScanning(false);
        setRadarPulse(false);
        return;
      }

      // Step 2: Try expanded radius (2x, max 50km)
      const expandedRadius = Math.min(searchRadius * 2, 50);
      if (expandedRadius > searchRadius) {
        const expandedLeads = await fetchLeadsFromOverpass(
          {
            lat: coords.lat,
            lng: coords.lng,
            radiusMeters: expandedRadius * 1000,
            niche: selectedNiche !== "Todos os Nichos" ? selectedNiche : undefined,
            maxResults: 50
          },
          cityName,
          stateName
        );

        if (expandedLeads.length >= 8) {
          console.log(`[handleScan] Found ${expandedLeads.length} leads with expanded radius (${expandedRadius}km)`);
          addCustomLeads(expandedLeads.map(l => ({
            ...l,
            neighborhood: l.neighborhood || (selectedNeighborhood !== "Todos os Bairros" ? selectedNeighborhood : ""),
            inCrm: false,
            temperature: 'morno' as const,
          })));
          setLastScanSource("expanded");
          setScanNotice(null);
          setIsScanning(false);
          setRadarPulse(false);
          return;
        }
      }

      // Step 3: Synthetic fallback
      console.log("[handleScan] Using synthetic lead generation as fallback");
      const syntheticLeads = generateRealisticLeadsForLocation({
        city: selectedCity,
        neighborhood: selectedNeighborhood !== "Todos os Bairros" ? selectedNeighborhood : "Centro",
        niche: selectedNiche !== "Todos os Nichos" ? selectedNiche : undefined,
        count: 3,
        query: cleanQuery || undefined,
      });

      addCustomLeads(syntheticLeads);
      setLastScanSource("synthetic");
      setScanNotice(
        "Nenhum negócio encontrado no OpenStreetMap para esta região. Exibindo leads de demonstração para fins de preview — escaneie outra área para dados reais."
      );
    } catch (err) {
      console.warn("[handleScan] Error during scan, falling back to synthetic:", err);
      // Fallback to synthetic on any error
      const syntheticLeads = generateRealisticLeadsForLocation({
        city: selectedCity,
        neighborhood: selectedNeighborhood !== "Todos os Bairros" ? selectedNeighborhood : "Centro",
        niche: selectedNiche !== "Todos os Nichos" ? selectedNiche : undefined,
        count: 3,
      });
      addCustomLeads(syntheticLeads);
      setLastScanSource("synthetic");
      setScanNotice(
        "Serviço OpenStreetMap indisponível no momento. Exibindo leads de demonstração — tente novamente em alguns minutos."
      );
    } finally {
      setIsScanning(false);
      setRadarPulse(false);
    }
  };

  // NOTE: a legacy `handleSimulateScan` random-name generator used to live here.
  // It was dead code (never wired to any button — `handleScan` above is the single
  // source of truth for lead generation) and has been removed so no code path can
  // ever inject leads without the user explicitly triggering a scan.

  // Routes a scanned lead to the right destination:
  //   - real OSM leads: persisted via addCustomLead (CRM / localStorage)
  //   - synthetic demo leads: pushed to the ephemeral previewLeads buffer
  //     so they appear on the map and InfoWindow but are NEVER saved.
  const addCustomLeads = (newLeads: Omit<Lead, 'id' | 'createdAt'>[]) => {
    newLeads.forEach((lead) => {
      if (lead.dataSource === 'synthetic') {
        const id = `preview-${lead.placeId || lead.name}-${Math.random().toString(36).slice(2, 8)}`;
        setPreviewLeads((prev) => {
          if (prev.some((p) => p.name.toLowerCase() === lead.name.toLowerCase())) {
            return prev;
          }
          return [
            ...prev,
            {
              ...lead,
              id,
              createdAt: new Date().toISOString(),
            } as Lead,
          ];
        });
      } else {
        addCustomLead(lead);
      }
    });
  };
  
  const apiKey =
    crmSettings.googleMapsApiKey ||
    (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY ||
    "";

  return (
    <div className="space-y-6">
      {/* Top Search & Filter Bar */}
      <div className="glass-panel p-5 rounded-2xl border border-white/10 space-y-4 relative z-40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white shadow-lg shadow-sky-500/20 border border-white/20 shrink-0">
              <Compass className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Radar Google Maps Platform
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 rounded-full shrink-0">
                  OpenStreetMap Real-Time
                </span>
              </div>
              <p className="text-xs text-slate-300 truncate sm:whitespace-normal">
                Auditoria geográfica em tempo real: busca negócios reais via
                OpenStreetMap e exibe no Google Maps — empresas com notas
                altas e sem site moderno
              </p>
            </div>
          </div>

          {/* Quick Scan Action */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              id="btn-scan-maps"
              onClick={() => handleScan()}
              disabled={isScanning}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 sm:py-2 text-xs font-semibold text-white bg-gradient-to-r from-sky-500 via-indigo-600 to-blue-600 hover:from-sky-400 hover:to-indigo-500 rounded-xl shadow-lg shadow-sky-500/25 border border-white/20 transition-all active:scale-[0.98]"
            >
              {isScanning ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Escaneando Raio de {searchRadius}km...</span>
                </>
              ) : (
                <>
                  <Zap className="w-3.5 h-3.5 fill-white text-white" />
                  <span>Escanear Google Maps Agora</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Filter Controls Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-2 border-t border-white/10">
          {/* City Selection */}
          <div className="min-w-0 flex flex-col justify-end">
            <label className="flex items-center justify-between text-[11px] font-semibold text-slate-300 mb-1.5 h-6">
              <span className="truncate">Cidade no Maps:</span>
              <span className="text-[10px] text-sky-400 font-normal shrink-0 ml-1">
                Base de Busca
              </span>
            </label>
            <ResponsiveSelect
              value={selectedCity}
              onChange={(val) => handleCityChange(val)}
              options={Object.keys(CITY_COORDINATES).map((city) => ({
                value: city,
                label: city,
              }))}
            />
          </div>

          {/* Neighborhood / Region Selection */}
          <div className="min-w-0 flex flex-col justify-end">
            <div className="flex items-center justify-between mb-1.5 gap-1.5 min-w-0 h-6">
              <label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1 min-w-0 truncate">
                <span className="truncate">📍 Bairro / Região:</span>
                {isSyncingNeighborhoods ? (
                  <span className="text-[10px] text-amber-400 font-normal flex items-center gap-0.5 animate-pulse shrink-0 ml-0.5">
                    <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                    <span className="hidden xl:inline">IBGE...</span>
                  </span>
                ) : (
                  <span
                    className="hidden 2xl:inline-flex text-[10px] text-emerald-400 font-normal items-center gap-0.5 shrink-0 ml-0.5"
                    title="Bairros sincronizados com a API do IBGE"
                  >
                    <Check className="w-2.5 h-2.5" />
                    <span>IBGE</span>
                  </span>
                )}
              </label>

              <div className="flex items-center gap-1 shrink-0 ml-auto">
                <button
                  type="button"
                  onClick={refreshNeighborhoodsFromApi}
                  disabled={isSyncingNeighborhoods}
                  className="p-1 text-slate-400 hover:text-white hover:bg-white/10 rounded-md transition-colors disabled:opacity-50 shrink-0"
                  title="Atualizar lista de bairros via API do IBGE"
                >
                  <RefreshCw
                    className={`w-3 h-3 ${isSyncingNeighborhoods ? "animate-spin text-amber-400" : ""}`}
                  />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setNewBairroInput("");
                    setApiSuggestions([]);
                    setShowAddBairroModal(true);
                  }}
                  className="group flex items-center gap-1 px-1.5 py-1 text-[10px] font-medium text-sky-400 hover:text-sky-200 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 hover:border-sky-400/60 rounded-lg transition-all active:scale-95 shadow-sm shadow-sky-500/10 shrink-0 whitespace-nowrap leading-none"
                  title="Buscar ou cadastrar outro bairro para esta cidade"
                >
                  <Plus className="w-3 h-3 text-sky-400 group-hover:rotate-90 transition-transform duration-200" />
                  <span>Novo Bairro</span>
                </button>
              </div>
            </div>
            <ResponsiveSelect
              value={selectedNeighborhood}
              onChange={(val) => setSelectedNeighborhood(val)}
              options={[
                { value: "Todos os Bairros", label: "Todos os Bairros" },
                ...currentCityNeighborhoods.map((bairro) => ({
                  value: bairro,
                  label: bairro,
                })),
              ]}
            />
          </div>

          {/* Niche Selection */}
          <div className="min-w-0 flex flex-col justify-end">
            <label className="flex items-center justify-between text-[11px] font-semibold text-slate-300 mb-1.5 h-6">
              <span className="truncate">Categoria do Negócio:</span>
              <span className="text-[10px] text-indigo-400 font-normal shrink-0 ml-1">
                Nicho
              </span>
            </label>
            <ResponsiveSelect
              value={selectedNiche}
              onChange={(val) => setSelectedNiche(val)}
              options={[
                { value: "Todos os Nichos", label: "Todos os Nichos" },
                { value: "Barbearia", label: "Barbearia & Salão" },
                {
                  value: "Clínica Odontológica",
                  label: "Clínica Odontológica",
                },
                { value: "Estética & Beleza", label: "Estética & Beleza" },
                {
                  value: "Restaurante & Pizzaria",
                  label: "Restaurante & Pizzaria",
                },
                { value: "Advocacia", label: "Escritório de Advocacia" },
                { value: "Contabilidade", label: "Contabilidade & Finanças" },
                {
                  value: "Pet Shop & Veterinária",
                  label: "Pet Shop & Veterinária",
                },
                { value: "Oficina Mecânica", label: "Oficina Mecânica" },
              ]}
            />
          </div>

          {/* Search Radius */}
          <div className="min-w-0 flex flex-col justify-end">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-300 mb-1.5 h-6">
              <span className="truncate">Raio de Prospecção:</span>
              <span className="font-bold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-400/20 shrink-0 ml-1 leading-none">
                {searchRadius} km
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="50"
              step="1"
              value={searchRadius}
              onChange={(e) => setSearchRadius(Number(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-400"
            />
            {/* Quick Presets */}
            <div className="flex flex-wrap items-center justify-between gap-1 mt-1 text-[10px] text-slate-400">
              {[5, 10, 15, 20, 30, 50].map((rad) => (
                <button
                  key={rad}
                  type="button"
                  onClick={() => setSearchRadius(rad)}
                  className={`px-1.5 py-0.5 rounded transition-all ${searchRadius === rad
                      ? "bg-sky-500 text-white font-bold shadow-sm"
                      : "hover:text-sky-300 hover:bg-white/5"
                    }`}
                >
                  {rad}km
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Explicit Keyword Search Bar (Nome da Empresa, Bairro ou Rua) */}
        <div className="pt-2 border-t border-white/10 space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px]">
            <div className="flex items-center gap-1.5 font-bold text-white">
              <Search className="w-3.5 h-3.5 text-sky-400" />
              <span>Buscar por Empresa, Bairro/Região ou Rua:</span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-slate-400">
              <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-slate-300">
                🏢 Nome da Empresa
              </span>
              <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-slate-300">
                📍 Bairro
              </span>
              <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-slate-300">
                🛣️ Logradouro / Rua
              </span>
            </div>
          </div>

          <div className="relative z-50">
            <SearchAutocomplete
              id="input-prospector-search"
              value={searchQuery}
              onChange={setSearchQuery}
              onSelect={handleSelectSuggestion}
              suggestions={searchSuggestions}
              placeholder="Digite o nome da empresa (ex: Boy Barbearia), bairro (ex: Savassi) ou rua..."
              onClear={() => setSearchQuery("")}
            />
          </div>
        </div>

        {/* Checkbox Quick Filters */}
        <div className="flex flex-wrap items-center justify-between gap-4 text-xs pt-1">
          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white">
              <input
                type="checkbox"
                checked={onlyWithoutWebsite}
                onChange={(e) => setOnlyWithoutWebsite(e.target.checked)}
                className="rounded bg-slate-800 border-white/20 text-sky-500 focus:ring-sky-400 w-4 h-4"
              />
              <span>
                Apenas empresas <strong>SEM WEBSITE</strong> (Alta Oportunidade)
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white">
              <input
                type="checkbox"
                checked={onlyHighRating}
                onChange={(e) => setOnlyHighRating(e.target.checked)}
                className="rounded bg-slate-800 border-white/20 text-sky-500 focus:ring-sky-400 w-4 h-4"
              />
              <span>
                Apenas notas <strong>4.8+ ⭐</strong> (Clientes Satisfeitos)
              </span>
            </label>
          </div>

          <div className="text-xs text-slate-300 flex items-center gap-2">
            <span>Resultados:</span>
            <span className="font-bold text-sky-300 bg-sky-500/20 px-2 py-0.5 rounded-full border border-sky-400/30">
              {filteredLeads.length} negócios mapeados
            </span>
          </div>
        </div>
      </div>

      {/* Advanced Filters: Audit Status & Estimated Price Range */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3.5 pt-2 border-t border-white/10">
        {/* Audit Status Filter */}
        <div className="lg:col-span-4 min-w-0 flex flex-col justify-end">
          <label className="flex items-center justify-between text-[11px] font-semibold text-slate-300 mb-1.5 h-6">
            <span className="truncate flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              Status de Auditoria:
            </span>
            <span className="text-[10px] text-emerald-400 font-normal shrink-0 ml-1">
              Avançado
            </span>
          </label>
          <ResponsiveSelect
            value={auditStatusFilter}
            onChange={(val) => setAuditStatusFilter(val)}
            options={[
              { value: "Todos", label: "🔍 Todos os Status" },
              { value: "Auditados", label: "✅ Auditados (com diagnóstico)" },
              { value: "NaoAuditados", label: "⚠️ Não Auditados" },
              { value: "NoCRM", label: "🎯 Já no CRM/Funil" },
              { value: "ForaCRM", label: "📤 Fora do CRM" },
            ]}
          />
        </div>

        {/* Estimated Price Range - Slider Min/Max */}
        <div className="lg:col-span-8 min-w-0 flex flex-col justify-end">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-300 mb-1.5 h-6">
            <span className="truncate flex items-center gap-1">
              <DollarSign className="w-3 h-3 text-emerald-400" />
              Faixa de Preço Estimada (Setup R$):
            </span>
            <span className="font-bold text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-400/30 shrink-0 ml-1 leading-none">
              R$ {priceMin.toLocaleString("pt-BR")} – R${" "}
              {priceMax.toLocaleString("pt-BR")}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-400 font-semibold shrink-0">
                Mín
              </span>
              <input
                type="range"
                min="0"
                max="5000"
                step="100"
                value={priceMin}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setPriceMin(Math.min(v, priceMax));
                }}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-400 font-semibold shrink-0">
                Máx
              </span>
              <input
                type="range"
                min="0"
                max="5000"
                step="100"
                value={priceMax}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setPriceMax(Math.max(v, priceMin));
                }}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
              />
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-1 mt-1 text-[10px] text-slate-400">
            {[
              { label: "Econômico", min: 0, max: 1500 },
              { label: "Padrão", min: 1500, max: 2500 },
              { label: "Premium", min: 2500, max: 5000 },
            ].map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => {
                  setPriceMin(preset.min);
                  setPriceMax(preset.max);
                }}
                className={`px-1.5 py-0.5 rounded transition-all ${priceMin === preset.min && priceMax === preset.max
                    ? "bg-emerald-500 text-white font-bold shadow-sm"
                    : "hover:text-emerald-300 hover:bg-white/5"
                  }`}
              >
                {preset.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                setPriceMin(0);
                setPriceMax(5000);
              }}
              className="px-1.5 py-0.5 rounded text-slate-500 hover:text-white hover:bg-white/5 transition-all"
            >
              ↻ Reset
            </button>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Map Container */}
        <div className="xl:col-span-8 glass-panel p-2 rounded-2xl border border-white/10 relative min-h-[460px] flex flex-col">
          {/* Map Header Overlays (Status & Notice) */}
          <div className="absolute top-4 left-4 right-4 z-10 flex flex-col items-start gap-2 pointer-events-none">
            {/* Status Overlay */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950/85 backdrop-blur-md border border-white/15 text-xs shadow-lg pointer-events-auto">
              <div
                className={`w-2.5 h-2.5 rounded-full ${radarPulse ? "bg-sky-400 animate-ping" : "bg-emerald-400"}`}
              />
              <span className="font-semibold text-white">{selectedCity}</span>
              <span className="text-slate-400">|</span>
              <span className="text-sky-300 font-medium">
                {filteredLeads.length} alvos ativos
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
                  internalUsageAttributionIds={[
                    "gmp_mcp_codeassist_v1_aistudio",
                  ]}
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
                        onOpenMaps={() => openGoogleMapsPlace(lead)}
                      />
                    </React.Fragment>
                  ))}

                  {activeMarkerLead && infoWindowAnchor && (
                    <InfoWindow
                      anchor={infoWindowAnchor}
                      onCloseClick={() => { setActiveMarkerLead(null); setInfoWindowAnchor(null); }}
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
                          {activeMarkerLead.dataSource === 'synthetic' && (
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
                        <div style={{ marginTop: "6px", paddingTop: "10px", borderTop: "1px solid #e2e8f0", display: "flex", flexDirection: "column", gap: "6px" }}>
                          {/* Row 1: + Adicionar / ✓ No CRM  +  Ver Detalhes */}
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            {!activeMarkerLead.inCrm ? (
                              <button
                                onClick={() => {
                                  if (activeMarkerLead.dataSource === 'synthetic') {
                                    // Promote demo lead to the real CRM with its full payload,
                                    // then drop it from the ephemeral preview buffer.
                                    addCustomLead({
                                      ...activeMarkerLead,
                                      inCrm: true,
                                      crmStage: 'novo',
                                      dataSource: 'synthetic',
                                    } as Omit<Lead, 'id' | 'createdAt'>);
                                    setPreviewLeads((prev) => prev.filter((p) => p.id !== activeMarkerLead.id));
                                  } else {
                                    addLeadToCrm(activeMarkerLead.id);
                                  }
                                  setActiveMarkerLead(null);
                                  setInfoWindowAnchor(null);
                                }}
                                style={{ flex: 1, padding: "6px 8px", fontSize: "11px", fontWeight: 700, background: "#4f46e5", color: "#ffffff", border: "none", borderRadius: "8px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                              >
                                + Adicionar
                              </button>
                            ) : (
                              <span style={{ flex: 1, padding: "6px 8px", fontSize: "11px", fontWeight: 600, color: "#047857", background: "#d1fae5", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                ✓ No CRM
                              </span>
                            )}
                            <button
                              onClick={() => {
                                setSelectedLeadForModal(activeMarkerLead);
                              }}
                              style={{ flex: 1, padding: "6px 8px", fontSize: "11px", fontWeight: 500, background: "#f1f5f9", color: "#334155", border: "none", borderRadius: "8px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                            >
                              Ver Detalhes
                            </button>
                          </div>
                          {/* Row 2: Ver no Maps */}
                          <button
                            onClick={() => openGoogleMapsPlace(activeMarkerLead)}
                            style={{ width: "100%", padding: "6px 8px", fontSize: "11px", fontWeight: 500, background: "#e0f2fe", color: "#0369a1", border: "1px solid #bae6fd", borderRadius: "8px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}
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
                      // Proportional distance from center (0 to 1)
                      const distRatio = Math.min(
                        1,
                        Math.max(0.12, (lead.distanceKm ?? 5) / searchRadius),
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
                              className={`p-1.5 rounded-full border shadow-lg flex items-center justify-center transition-all ${isSelected
                                  ? "ring-4 ring-sky-400 scale-125"
                                  : ""
                                } ${!lead.hasWebsite
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
                      Modo Radar Demo Ativo.{" "}
                      <strong>Raio: {searchRadius} km</strong> |{" "}
                      {filteredLeads.length} negócios mapeados na zona.
                    </p>
                  </div>
                  <button
                    onClick={() => setActivePage("configuracoes")}
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
            <div className="flex items-center gap-4">
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

        {/* Side Prospect Card / Selection Panel */}
        <div className="xl:col-span-4 flex flex-col gap-4">
          {activeMarkerLead ? (
            <div className="glass-panel p-5 rounded-2xl border border-sky-400/40 shadow-2xl space-y-4 animate-in fade-in duration-150">
              <div className="flex items-start justify-between">
                <div>
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-sky-500/20 text-sky-300 border border-sky-400/30 uppercase">
                    {activeMarkerLead.category}
                  </span>
                  <h3 className="text-base font-bold text-white mt-1.5 leading-snug">
                    {activeMarkerLead.name}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-300">
                    <span className="flex items-center text-amber-400 font-bold">
                      <Star className="w-3.5 h-3.5 fill-amber-400 inline mr-0.5" />
                      {activeMarkerLead.rating}
                    </span>
                    <span>
                      ({activeMarkerLead.reviewsCount} avaliações no Google)
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setActiveMarkerLead(null)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              {/* Diagnosis Badges */}
              <div className="p-3 rounded-xl bg-slate-900/80 border border-white/10 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Presença Web Atual:</span>
                  {activeMarkerLead.hasWebsite ? (
                    <span className="text-amber-400 font-semibold flex items-center gap-1">
                      <Globe className="w-3.5 h-3.5" /> Site Antigo
                    </span>
                  ) : (
                    <span className="text-rose-400 font-bold flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" /> Sem Website
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Bairro / Região:</span>
                  <span className="font-semibold text-emerald-300">
                    📍 {activeMarkerLead.neighborhood || activeMarkerLead.city}
                  </span>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-slate-400">
                    Logradouro / Rua:
                  </span>
                  <span className="font-medium text-slate-200 text-[11px] break-words">
                    {activeMarkerLead.address}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Score de Oportunidade:</span>
                  <span className="font-bold text-sky-400">
                    {activeMarkerLead.score}/100
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Distância do Centro:</span>
                  <span className="font-semibold text-sky-300">
                    📍 {activeMarkerLead.distanceKm ?? 2.5} km
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Telefone / WhatsApp:</span>
                  <span className="font-mono text-white">
                    {activeMarkerLead.phone}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                {!activeMarkerLead.inCrm ? (
                  <button
                    onClick={() => {
                      addLeadToCrm(activeMarkerLead.id);
                      setActiveMarkerLead({ ...activeMarkerLead, inCrm: true });
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 rounded-xl shadow-lg shadow-indigo-500/25 border border-white/15 transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Adicionar ao Funil CRM (R$ 1.800)</span>
                  </button>
                ) : (
                  <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-semibold flex items-center justify-center gap-2">
                    <Check className="w-4 h-4" />
                    <span>Lead já está no Funil CRM</span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      redesignLeadSite(activeMarkerLead.id);
                      setActivePage("redesenhar");
                    }}
                    className="flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-medium text-sky-300 bg-sky-500/15 hover:bg-sky-500/25 border border-sky-400/30 rounded-xl transition-all"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                    <span>Redesenhar IA</span>
                  </button>

                  <button
                    onClick={() => {
                      if (onSelectLeadForEmail) {
                        onSelectLeadForEmail(activeMarkerLead);
                      } else {
                        setSelectedLeadForModal(activeMarkerLead);
                      }
                    }}
                    className="flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-medium text-white bg-white/10 hover:bg-white/15 border border-white/15 rounded-xl transition-all"
                  >
                    <Mail className="w-3.5 h-3.5 text-indigo-300" />
                    <span>Enviar E-mail</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="glass-panel p-5 rounded-2xl border border-white/10 flex flex-col justify-center items-center text-center py-10 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400">
                <MapPin className="w-6 h-6 text-sky-400" />
              </div>
              <h4 className="font-bold text-sm text-white">
                Nenhuma empresa selecionada
              </h4>
              <p className="text-xs text-slate-400 max-w-xs">
                Clique em qualquer ponto do mapa ou da lista abaixo para auditar
                os detalhes e iniciar o contato.
              </p>
            </div>
          )}

          {/* Quick List of Top Opportunities */}
          <div className="glass-panel p-4 rounded-2xl border border-white/10 space-y-3 flex-1 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <h4 className="text-xs font-bold text-white tracking-tight">
                Oportunidades em Destaque
              </h4>
              <span className="text-[10px] text-sky-400 font-semibold">
                {filteredLeads.length} disponíveis
              </span>
            </div>

            {filteredLeads.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-900/80 border border-sky-400/20 text-center space-y-2.5 my-auto">
                <AlertTriangle className="w-6 h-6 text-amber-400 mx-auto" />
                <div>
                  <h5 className="text-xs font-bold text-white">
                    Nenhum resultado local
                  </h5>
                  <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
                    Não há negócios salvos para{" "}
                    {searchQuery
                      ? `"${searchQuery}"`
                      : selectedNeighborhood !== "Todos os Bairros"
                        ? `"${selectedNeighborhood}"`
                        : "os filtros selecionados"}
                    .
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleScan(searchQuery)}
                  disabled={isScanning}
                  className="w-full py-2 px-3 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 active:scale-[0.98]"
                >
                  <Zap className="w-3.5 h-3.5 fill-white" />
                  <span>Escanear Google Maps Agora</span>
                </button>
              </div>
            ) : (
              <div className="space-y-2 overflow-y-auto max-h-72 pr-1">
                {filteredLeads.map((lead) => (
                  <div
                    key={lead.id}
                    onClick={() => setActiveMarkerLead(lead)}
                    className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${activeMarkerLead?.id === lead.id
                        ? "bg-sky-500/20 border-sky-400/50 text-white shadow-md"
                        : "bg-white/[0.02] border-white/10 text-slate-300 hover:bg-white/[0.06]"
                      }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-semibold text-white truncate">
                        {lead.name}
                      </span>
                      <span className="text-amber-400 font-bold shrink-0">
                        ★ {lead.rating}
                      </span>
                    </div>

                    <div className="flex items-center justify-between mt-1 text-[11px] text-slate-400">
                      <span className="truncate">
                        <strong className="text-slate-300">
                          {lead.neighborhood || lead.city}
                        </strong>{" "}
                        • {lead.category}
                      </span>
                      <span
                        className={
                          lead.hasWebsite
                            ? "text-amber-400 font-medium shrink-0"
                            : "text-rose-400 font-bold shrink-0"
                        }
                      >
                        {lead.hasWebsite ? "Site lento" : "🚨 Sem site"}
                      </span>
                    </div>

                    <div className="mt-1 text-[10px] text-slate-500 truncate flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-sky-400 shrink-0" />
                      <span className="truncate">{lead.address}</span>
                      <span className="ml-auto font-mono text-slate-400 shrink-0">
                        ({lead.distanceKm ?? 2.5}km)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal to Add Custom Neighborhood */}
      {showAddBairroModal && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-white/15 rounded-2xl p-5 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-400">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Adicionar Bairro / Região
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Cidade: {selectedCity.split(" - ")[0]}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddBairroModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-medium text-slate-300">
                Nome do novo bairro ou setor:
              </label>
              <div className="relative">
                <input
                  type="text"
                  autoFocus
                  placeholder="Ex: Caiçaras, Alto Caiçaras, São Bento..."
                  value={newBairroInput}
                  onChange={(e) => setNewBairroInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddCustomNeighborhood(newBairroInput);
                    }
                  }}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-950 border border-white/20 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-sky-400 pr-9"
                />
                {isSearchingApi && (
                  <div className="absolute right-3 top-2.5">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-sky-400" />
                  </div>
                )}
              </div>

              {/* Dynamic API Live Autocomplete Suggestions */}
              {apiSuggestions.length > 0 && (
                <div className="mt-2 p-2 rounded-xl bg-slate-950/80 border border-white/10 space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] text-slate-400 px-1 font-semibold uppercase">
                    <span>
                      Sugestões da API ({selectedCity.split(" - ")[0]}):
                    </span>
                    <span className="text-sky-400 lowercase font-normal">
                      clique para selecionar
                    </span>
                  </div>
                  <div className="max-h-36 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                    {apiSuggestions.map((sug, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleAddCustomNeighborhood(sug.name)}
                        className="w-full text-left p-1.5 rounded-lg bg-white/5 hover:bg-sky-500/20 border border-white/5 hover:border-sky-400/40 transition-all flex items-center justify-between group"
                      >
                        <div className="min-w-0 pr-2">
                          <span className="text-xs font-medium text-white group-hover:text-sky-300 block truncate">
                            📍 {sug.name}
                          </span>
                          {sug.fullAddress && (
                            <span className="text-[10px] text-slate-400 block truncate">
                              {sug.fullAddress}
                            </span>
                          )}
                        </div>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30 shrink-0">
                          {sug.type}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <p className="text-[11px] text-slate-400">
                Bairros adicionados são sincronizados com a API e salvos no seu
                navegador para prospecções e filtros instantâneos.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setShowAddBairroModal(false)}
                className="px-3.5 py-2 text-xs font-medium text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-all"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={!newBairroInput.trim()}
                onClick={() => handleAddCustomNeighborhood(newBairroInput)}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 disabled:opacity-50 rounded-xl shadow-lg shadow-sky-500/20 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Salvar e Selecionar</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
