import React from "react";
import { useCrm } from "../hooks/useCrm";
import { useProspectorSearch } from "../hooks/useProspectorSearch";
import { Lead } from "../types";
import { BASE_CITY_NEIGHBORHOODS } from "../services/neighborhoodService";
import { ProspectorFiltersBar } from "./prospector/ProspectorFiltersBar";
import { ProspectorMapArea } from "./prospector/ProspectorMapArea";
import { ProspectorLeadList } from "./prospector/ProspectorLeadList";
import { AddNeighborhoodModal } from "./prospector/AddNeighborhoodModal";

// Centrais de coordenadas para capitais e cidades comuns
export const CITY_COORDINATES: Record<string, { lat: number; lng: number }> = {
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

// Bairros e regiões populares por cidade
export const CITY_NEIGHBORHOODS: Record<string, string[]> = BASE_CITY_NEIGHBORHOODS;

interface GoogleMapsProspectorProps {
  onSelectLeadForEmail?: (lead: Lead) => void;
}

export const GoogleMapsProspector: React.FC<GoogleMapsProspectorProps> = ({
  onSelectLeadForEmail,
}) => {
  const {
    addLeadToCrm,
    redesignLeadSite,
    setActivePage,
    setSelectedLeadForModal,
    crmSettings,
    addCustomLead,
  } = useCrm();

  const {
    selectedCity,
    handleCityChange,
    selectedNeighborhood,
    setSelectedNeighborhood,
    selectedNiche,
    setSelectedNiche,
    searchRadius,
    setSearchRadius,
    onlyWithoutWebsite,
    setOnlyWithoutWebsite,
    onlyHighRating,
    setOnlyHighRating,
    onlyRealLeads,
    setOnlyRealLeads,
    realOsmCount,
    demoCount,
    auditStatusFilter,
    setAuditStatusFilter,
    priceMin,
    setPriceMin,
    priceMax,
    setPriceMax,
    searchQuery,
    setSearchQuery,
    isScanning,
    lastScanSource,
    scanNotice,
    activeMarkerLead,
    setActiveMarkerLead,
    infoWindowAnchor,
    setInfoWindowAnchor,
    radarPulse,
    currentCityNeighborhoods,
    isSyncingNeighborhoods,
    showAddBairroModal,
    setShowAddBairroModal,
    newBairroInput,
    setNewBairroInput,
    apiSuggestions,
    isSearchingApi,
    handleAddCustomNeighborhood,
    refreshNeighborhoodsFromApi,
    mapCenter,
    mapZoom,
    filteredLeads,
    handleScan,
    setApiSuggestions,
    searchSuggestions,
    handleSelectSuggestion,
    setScanNotice,
    setPreviewLeads,
  } = useProspectorSearch(CITY_COORDINATES);

  const apiKey =
    crmSettings.googleMapsApiKey ||
    (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY ||
    "";

  return (
    <div className="space-y-6">
      {/* 1. Barra de Busca e Filtros Superiores */}
      <ProspectorFiltersBar
        selectedCity={selectedCity}
        handleCityChange={handleCityChange}
        cityCoordinates={CITY_COORDINATES}
        selectedNeighborhood={selectedNeighborhood}
        setSelectedNeighborhood={setSelectedNeighborhood}
        currentCityNeighborhoods={currentCityNeighborhoods}
        isSyncingNeighborhoods={isSyncingNeighborhoods}
        refreshNeighborhoodsFromApi={refreshNeighborhoodsFromApi}
        selectedNiche={selectedNiche}
        setSelectedNiche={setSelectedNiche}
        searchRadius={searchRadius}
        setSearchRadius={setSearchRadius}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        searchSuggestions={searchSuggestions}
        handleSelectSuggestion={handleSelectSuggestion}
        onlyWithoutWebsite={onlyWithoutWebsite}
        setOnlyWithoutWebsite={setOnlyWithoutWebsite}
        onlyHighRating={onlyHighRating}
        setOnlyHighRating={setOnlyHighRating}
        onlyRealLeads={onlyRealLeads}
        setOnlyRealLeads={setOnlyRealLeads}
        auditStatusFilter={auditStatusFilter}
        setAuditStatusFilter={setAuditStatusFilter}
        priceMin={priceMin}
        setPriceMin={setPriceMin}
        priceMax={priceMax}
        setPriceMax={setPriceMax}
        isScanning={isScanning}
        handleScan={handleScan}
        filteredCount={filteredLeads.length}
        realOsmCount={realOsmCount}
        demoCount={demoCount}
        onOpenAddBairroModal={() => {
          setNewBairroInput("");
          setApiSuggestions([]);
          setShowAddBairroModal(true);
        }}
      />

      {/* 2. Grid Principal: Área do Mapa e Lista Lateral de Leads */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <ProspectorMapArea
          apiKey={apiKey}
          mapCenter={mapCenter}
          mapZoom={mapZoom}
          searchRadius={searchRadius}
          selectedCity={selectedCity}
          filteredLeads={filteredLeads}
          lastScanSource={lastScanSource}
          scanNotice={scanNotice}
          setScanNotice={setScanNotice}
          radarPulse={radarPulse}
          activeMarkerLead={activeMarkerLead}
          setActiveMarkerLead={setActiveMarkerLead}
          infoWindowAnchor={infoWindowAnchor}
          setInfoWindowAnchor={setInfoWindowAnchor}
          addCustomLead={addCustomLead}
          addLeadToCrm={addLeadToCrm}
          setPreviewLeads={setPreviewLeads}
          onSelectLeadForModal={(lead) => setSelectedLeadForModal(lead)}
          onNavigateToSettings={() => setActivePage("configuracoes")}
          realOsmCount={realOsmCount}
          demoCount={demoCount}
        />

        <ProspectorLeadList
          activeMarkerLead={activeMarkerLead}
          setActiveMarkerLead={setActiveMarkerLead}
          filteredLeads={filteredLeads}
          searchQuery={searchQuery}
          selectedNeighborhood={selectedNeighborhood}
          isScanning={isScanning}
          handleScan={handleScan}
          addLeadToCrm={addLeadToCrm}
          redesignLeadSite={redesignLeadSite}
          setActivePage={setActivePage}
          onSelectLeadForEmail={onSelectLeadForEmail}
          onSelectLeadForModal={(lead) => setSelectedLeadForModal(lead)}
        />
      </div>

      {/* 3. Modal de Adicionar Novo Bairro */}
      <AddNeighborhoodModal
        isOpen={showAddBairroModal}
        onClose={() => setShowAddBairroModal(false)}
        selectedCity={selectedCity}
        newBairroInput={newBairroInput}
        setNewBairroInput={setNewBairroInput}
        isSearchingApi={isSearchingApi}
        apiSuggestions={apiSuggestions}
        onAddNeighborhood={(name) => handleAddCustomNeighborhood(name)}
      />
    </div>
  );
};
