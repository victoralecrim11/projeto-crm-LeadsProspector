import { useState, useMemo, useEffect } from "react";
import { Lead } from "../types";
import { useLeadStore } from "../store/leadStore";
import {
  useCityNeighborhoods,
} from "../services/neighborhoodService";
import {
  matchesNiche,
  generateRealisticLeadsForLocation,
  NEIGHBORHOOD_CENTROIDS,
} from "../services/leadGeneratorService";
import { fetchLeadsFromOverpass } from "../services/overpassService";


// Utilitário de normalização de texto sem acentos e minúsculo
export function normalizeStr(text: string): string {
  if (!text) return "";
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

type ScanSource = "real" | "expanded" | "synthetic" | null;

export const useProspectorSearch = (CITY_COORDINATES: Record<string, { lat: number; lng: number }>) => {
  const leads = useLeadStore((state) => state.leads);
  const addCustomLead = useLeadStore((state) => state.addCustomLead);

  const [selectedCity, setSelectedCity] = useState<string>("Belo Horizonte - MG");
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<string>("Todos os Bairros");
  const [selectedNiche, setSelectedNiche] = useState<string>("Todos os Nichos");
  const [searchRadius, setSearchRadius] = useState<number>(15);
  const [onlyWithoutWebsite, setOnlyWithoutWebsite] = useState<boolean>(false);
  const [onlyHighRating, setOnlyHighRating] = useState<boolean>(false);
  const [onlyRealLeads, setOnlyRealLeads] = useState<boolean>(false);
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

  const [previewLeads, setPreviewLeads] = useState<Lead[]>([]);
  const [radarPulse, setRadarPulse] = useState<boolean>(false);

  useEffect(() => {
    // Geocoding reverso foi removido do fluxo para não depender do Google Maps API
  }, [activeMarkerLead]);

  const {
    neighborhoods: currentCityNeighborhoods,
    isSyncing: isSyncingNeighborhoods,
    addNeighborhood: addCustomNeighborhoodService,
    refreshFromApi: refreshNeighborhoodsFromApi,
    searchApi: searchNeighborhoodsApi,
  } = useCityNeighborhoods(selectedCity, leads);

  const [showAddBairroModal, setShowAddBairroModal] = useState<boolean>(false);
  const [newBairroInput, setNewBairroInput] = useState<string>("");
  const [apiSuggestions, setApiSuggestions] = useState<{ name: string; type: string; fullAddress?: string }[]>([]);
  const [isSearchingApi, setIsSearchingApi] = useState<boolean>(false);

  // Nominatim is intentionally never invoked while typing. Local neighborhood
  // sources remain instant; external OSM lookup requires an explicit action.
  const searchNeighborhoodsOnOpenStreetMap = async () => {
    const clean = newBairroInput.trim();
    if (clean.length < 2) {
      setApiSuggestions([]);
      return;
    }
    setIsSearchingApi(true);
    try {
      setApiSuggestions(await searchNeighborhoodsApi(clean));
    } catch (err) {
      console.warn("[Prospector] OpenStreetMap neighborhood lookup failed:", err);
    } finally {
      setIsSearchingApi(false);
    }
  };

  const handleAddCustomNeighborhood = (bairroName: string) => {
    const clean = bairroName.trim();
    if (!clean) return;
    addCustomNeighborhoodService(clean);
    setSelectedNeighborhood(clean);
    setShowAddBairroModal(false);
    setNewBairroInput("");
    setApiSuggestions([]);
  };

  const handleCityChange = (newCity: string) => {
    setSelectedCity(newCity);
    setSelectedNeighborhood("Todos os Bairros");
    setLastScanCenter(null);
  };

  const cityCenter = useMemo(() => {
    return CITY_COORDINATES[selectedCity] || CITY_COORDINATES["Belo Horizonte - MG"];
  }, [selectedCity, CITY_COORDINATES]);

  const [lastScanCenter, setLastScanCenter] = useState<{ lat: number; lng: number } | null>(null);
  const mapCenter = lastScanCenter || cityCenter;

  const mapZoom = useMemo(() => {
    if (searchRadius <= 4) return 14;
    if (searchRadius <= 10) return 13;
    if (searchRadius <= 22) return 12;
    if (searchRadius <= 38) return 11;
    return 10;
  }, [searchRadius]);

  const allVisibleLeads = useMemo(() => {
    const crmPlaceIds = new Set(leads.map((l) => l.placeId).filter(Boolean));
    const dedupedPreviews = previewLeads.filter((p) => !p.placeId || !crmPlaceIds.has(p.placeId));
    return [...leads, ...dedupedPreviews];
  }, [leads, previewLeads]);

  const mappedLeads = useMemo(() => {
    return allVisibleLeads.map((lead, index) => {
      // 1. Coordenadas reais ou leads reais que possuem coordenadas
      if (typeof lead.geoLat === "number" && typeof lead.geoLng === "number" && lead.dataSource !== 'synthetic') {
        const distanceKm = lead.distanceKm ?? Number(
          Math.sqrt(
            Math.pow((lead.geoLat - mapCenter.lat) * 111, 2) +
            Math.pow((lead.geoLng - mapCenter.lng) * 104, 2)
          ).toFixed(1)
        );
        return { ...lead, distanceKm };
      }

      // 2. Apenas para Synthetic/Demo: usar centróide e micro-dispersão
      if (lead.dataSource === 'synthetic') {
        const normBairro = normalizeStr(lead.neighborhood || "");
        const centroid = NEIGHBORHOOD_CENTROIDS[normBairro] || mapCenter;

        const distanceKm = lead.distanceKm ?? Number(
          Math.sqrt(
            Math.pow((centroid.lat - mapCenter.lat) * 111, 2) +
            Math.pow((centroid.lng - mapCenter.lng) * 104, 2)
          ).toFixed(1)
        );

        // Micro-dispersão de 150m no próprio bairro para não sobrepor alfinetes idênticos
        const angle = (index * 67.5) * (Math.PI / 180);
        const scatterOffsetKm = 0.15;
        const deltaLat = (scatterOffsetKm / 111) * Math.sin(angle);
        const deltaLng = (scatterOffsetKm / 104) * Math.cos(angle);

        return {
          ...lead,
          distanceKm,
          geoLat: centroid.lat + deltaLat,
          geoLng: centroid.lng + deltaLng,
        };
      }

      // Se for real mas não tem coordenada, manter como está (sem scatter)
      return lead;
    });
  }, [allVisibleLeads, mapCenter]);

  const filteredLeads = useMemo(() => {
    return mappedLeads.filter((lead) => {
      // Filtro para dados 100% reais (oculta sintéticos/demo se ativo)
      if (onlyRealLeads && lead.dataSource === "synthetic") {
        return false;
      }

      const leadCityNorm = normalizeStr(lead.city);
      const selectedCitySimple = normalizeStr(selectedCity.split(" - ")[0]);

      if (leadCityNorm && selectedCitySimple && !leadCityNorm.includes(selectedCitySimple) && !selectedCitySimple.includes(leadCityNorm)) {
        if (!debouncedSearchQuery.trim()) return false;
      }

      if (selectedNeighborhood !== "Todos os Bairros") {
        const targetBairroNorm = normalizeStr(selectedNeighborhood);
        const leadBairroNorm = normalizeStr(lead.neighborhood || "");
        const leadAddrNorm = normalizeStr(lead.address || "");
        if (!leadBairroNorm.includes(targetBairroNorm) && !leadAddrNorm.includes(targetBairroNorm)) return false;
      }

      if (selectedNiche !== "Todos os Nichos" && !matchesNiche(lead.category || "", selectedNiche) && !matchesNiche(lead.niche || "", selectedNiche)) {
        return false;
      }

      if (onlyWithoutWebsite && lead.hasWebsite) return false;
      if (onlyHighRating && (typeof lead.rating !== "number" || lead.rating < 4.8)) return false;

      if (auditStatusFilter !== "Todos") {
        const isAudited = !!lead.audit;
        const inCrm = !!lead.inCrm;
        if (auditStatusFilter === "Auditados" && !isAudited) return false;
        if (auditStatusFilter === "NaoAuditados" && isAudited) return false;
        if (auditStatusFilter === "NoCRM" && !inCrm) return false;
        if (auditStatusFilter === "ForaCRM" && inCrm) return false;
      }

      const leadPrice = lead.dealValue ?? 1800;
      if (leadPrice < priceMin || leadPrice > priceMax) return false;

      if (debouncedSearchQuery.trim()) {
        const queryNormalized = normalizeStr(debouncedSearchQuery);
        const tokens = queryNormalized.split(/\s+/).filter(Boolean);
        const searchableCorpus = normalizeStr(
          [lead.name || "", lead.category || "", lead.niche || "", lead.neighborhood || "", lead.address || "", lead.city || "", lead.state || "", lead.phone || "", lead.whatsapp || ""].join(" ")
        );
        const matchesAllTokens = tokens.every((token) => searchableCorpus.includes(token));
        if (!matchesAllTokens) return false;
      }

      if (lead.distanceKm !== undefined && lead.distanceKm > searchRadius) return false;

      return true;
    });
  }, [mappedLeads, selectedCity, selectedNeighborhood, selectedNiche, onlyWithoutWebsite, onlyHighRating, onlyRealLeads, debouncedSearchQuery, searchRadius, auditStatusFilter, priceMin, priceMax]);

  const addCustomLeads = (newLeads: Omit<Lead, 'id' | 'createdAt'>[]) => {
    const newlyAdded: Lead[] = [];
    newLeads.forEach((lead) => {
      if (lead.dataSource === 'synthetic') {
        const id = `preview-${lead.placeId || lead.name}-${Math.random().toString(36).slice(2, 8)}`;
        setPreviewLeads((prev) => {
          if (prev.some((p) => p.name.toLowerCase() === lead.name.toLowerCase())) return prev;
          return [...prev, { ...lead, id, createdAt: new Date().toISOString() } as Lead];
        });
      } else {
        const addedLead = addCustomLead(lead);
        if (addedLead) {
          newlyAdded.push(addedLead);
        }
      }
    });
  };

  const handleScan = async (overrideQuery?: string | unknown) => {
    setIsScanning(true);
    setRadarPulse(true);
    setLastScanSource(null);
    setScanNotice(null);
    setPreviewLeads([]); 

    const activeQuery = typeof overrideQuery === "string" ? overrideQuery : searchQuery;
    const cleanQuery = (activeQuery || "").trim();

    try {
      const cityName = selectedCity.split(" - ")[0];
      const stateName = selectedCity.split(" - ")[1] || "MG";

      let coords = CITY_COORDINATES[selectedCity] || CITY_COORDINATES["Belo Horizonte - MG"];
      if (selectedNeighborhood !== "Todos os Bairros") {
        const normBairro = normalizeStr(selectedNeighborhood);
        if (NEIGHBORHOOD_CENTROIDS[normBairro]) coords = NEIGHBORHOOD_CENTROIDS[normBairro];
      }
      if (!coords) throw new Error("City coordinates not found");
      setLastScanCenter(coords);

      const overpassLeads = await fetchLeadsFromOverpass(
        { lat: coords.lat, lng: coords.lng, radiusMeters: searchRadius * 1000, niche: selectedNiche !== "Todos os Nichos" ? selectedNiche : undefined, maxResults: 30 },
        cityName, stateName
      );

      if (overpassLeads.length >= 1) {
        addCustomLeads(overpassLeads.map(l => ({ ...l, inCrm: false, temperature: 'quente' as const })));
        setLastScanSource("real");
        setScanNotice(null);
        setIsScanning(false);
        setRadarPulse(false);
        return;
      }

      const expandedRadius = Math.min(searchRadius * 2, 50);
      if (expandedRadius > searchRadius) {
        const expandedLeads = await fetchLeadsFromOverpass(
          { lat: coords.lat, lng: coords.lng, radiusMeters: expandedRadius * 1000, niche: selectedNiche !== "Todos os Nichos" ? selectedNiche : undefined, maxResults: 50 },
          cityName, stateName
        );

        if (expandedLeads.length >= 1) {
          addCustomLeads(expandedLeads.map(l => ({ ...l, inCrm: false, temperature: 'morno' as const })));
          setLastScanSource("expanded");
          setScanNotice(null);
          setIsScanning(false);
          setRadarPulse(false);
          return;
        }
      }

      setLastScanSource(null);
      setScanNotice("Nenhum negócio encontrado no OpenStreetMap para esta região. Tente expandir o raio ou alterar o nicho.");
    } catch (err) {
      setLastScanSource(null);
      setScanNotice(`Falha na busca de dados: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsScanning(false);
      setRadarPulse(false);
    }
  };


  const searchSuggestions = useMemo(() => {
    const list: any[] = [];
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

  const handleSelectSuggestion = (item: any) => {
    if (item.payload?.type === "neighborhood") {
      setSelectedNeighborhood(item.payload.name);
      setSearchQuery("");
    } else {
      setSearchQuery(item.title);
    }
  };



  const realOsmCount = useMemo(() => {
    return filteredLeads.filter((l) => l.dataSource === "real").length;
  }, [filteredLeads]);

  const demoCount = useMemo(() => {
    return filteredLeads.filter((l) => l.dataSource === "synthetic").length;
  }, [filteredLeads]);

  return {
    setApiSuggestions, searchSuggestions, handleSelectSuggestion, setScanNotice, setPreviewLeads,

    selectedCity, handleCityChange,
    selectedNeighborhood, setSelectedNeighborhood,
    selectedNiche, setSelectedNiche,
    searchRadius, setSearchRadius,
    onlyWithoutWebsite, setOnlyWithoutWebsite,
    onlyHighRating, setOnlyHighRating,
    onlyRealLeads, setOnlyRealLeads,
    realOsmCount,
    demoCount,
    auditStatusFilter, setAuditStatusFilter,
    priceMin, setPriceMin,
    priceMax, setPriceMax,
    searchQuery, setSearchQuery,
    isScanning,
    lastScanSource,
    scanNotice,
    activeMarkerLead, setActiveMarkerLead,
    radarPulse,
    currentCityNeighborhoods,
    isSyncingNeighborhoods,
    showAddBairroModal, setShowAddBairroModal,
    newBairroInput, setNewBairroInput,
    apiSuggestions,
    isSearchingApi,
    searchNeighborhoodsOnOpenStreetMap,
    handleAddCustomNeighborhood,
    refreshNeighborhoodsFromApi,
    mapCenter,
    mapZoom,
    filteredLeads,
    handleScan,
  };
};
