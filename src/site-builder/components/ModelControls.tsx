import React, { useEffect, useState } from "react";
import type { CrmSettingsConfig } from "../../types";
import {
  getSiteModels,
  setSiteAccessToken,
} from "../../services/siteGenerationService";
import type { AiModelDefinition, ModelSelection } from "../types";
export function ModelControls({
  settings,
  value,
  onChange,
  disabled = false,
}: {
  settings: CrmSettingsConfig;
  value: ModelSelection;
  onChange: (s: ModelSelection) => void;
  disabled?: boolean;
}) {
  const [models, setModels] = useState<AiModelDefinition[]>([]);
  const [message, setMessage] = useState("Consultando modelos…");
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    let active = true;
    setMessage("Consultando modelos…");
    getSiteModels(settings)
      .then((data) => {
        if (active) {
          setModels(data.models);
          setMessage(
            data.warnings.join(" ") ||
              data.models.length + " modelos disponíveis.",
          );
        }
      })
      .catch((e) => {
        if (active) {
          setModels([]);
          setMessage(e.message);
        }
      });
    return () => {
      active = false;
    };
  }, [settings, refresh]);
  return (
    <fieldset disabled={disabled} className="space-y-2 min-w-0">
      <label className="block text-sm">
        Modelo de IA
        <select
          className="w-full bg-slate-800 rounded-lg p-2 mt-1"
          value={value.mode}
          onChange={(e) =>
            onChange({
              mode: e.target.value as ModelSelection["mode"],
              modelId: null,
            })
          }
        >
          <option value="auto">Automático</option>
          <option value="fast">Rápido</option>
          <option value="quality">Qualidade</option>
          <option value="premium">Premium</option>
          <option value="local">Local</option>
          <option value="explicit">Escolher modelo específico</option>
        </select>
      </label>
      {value.mode === "explicit" && (
        <label className="block text-sm">
          Modelo disponível
          <select
            className="w-full bg-slate-800 p-2 rounded-lg"
            value={value.modelId || ""}
            onChange={(e) =>
              onChange({ mode: "explicit", modelId: e.target.value })
            }
          >
            <option value="">Selecione</option>
            {models.map((m) => (
              <option key={m.id} value={m.id} disabled={!m.enabled}>
                {m.provider} · {m.label}
                {!m.enabled ? " (desabilitado)" : ""}
              </option>
            ))}
          </select>
        </label>
      )}
      <p className="text-xs text-slate-300" role="status">
        {message}
      </p>
      <details className="text-xs">
        <summary>Conexão avançada</summary>
        <label>
          Token de acesso do servidor (somente nesta sessão)
          <input
            type="password"
            autoComplete="off"
            className="w-full p-2 bg-slate-800"
            onChange={(e) => setSiteAccessToken(e.target.value)}
          />
        </label>
        <button
          type="button"
          className="underline p-2"
          onClick={() => setRefresh((n) => n + 1)}
        >
          Atualizar modelos
        </button>
      </details>
    </fieldset>
  );
}
