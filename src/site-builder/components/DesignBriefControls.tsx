import type { DesignBrief } from "../types";

type Props = {
  value: DesignBrief;
  onChange: (value: DesignBrief) => void;
  disabled?: boolean;
};

export function DesignBriefControls({
  value,
  onChange,
  disabled = false,
}: Props) {
  const update = <Key extends keyof DesignBrief>(
    key: Key,
    next: DesignBrief[Key],
  ) => onChange({ ...value, [key]: next });

  return (
    <details className="design-brief">
      <summary>
        Direção de design <span>opcional</span>
      </summary>
      <div className="design-brief-content">
        <div className="design-brief-grid">
          <label>
            Paleta
            <select
              value={value.paletteMode}
              disabled={disabled}
              onChange={(event) =>
                update(
                  "paletteMode",
                  event.target.value as DesignBrief["paletteMode"],
                )
              }
            >
              <option value="recommended">Recomendada para o negócio</option>
              <option value="custom">Escolher duas cores</option>
              <option value="imported">Importar design system</option>
            </select>
          </label>
          <label>
            Movimento
            <select
              value={value.motion}
              disabled={disabled}
              onChange={(event) =>
                update(
                  "motion",
                  event.target.value as DesignBrief["motion"],
                )
              }
            >
              <option value="subtle">Sutil</option>
              <option value="cinematic">Cinematográfico</option>
              <option value="none">Sem animações</option>
            </select>
          </label>
        </div>

        {value.paletteMode === "custom" && (
          <div className="design-color-grid">
            <label>
              Cor principal
              <input
                type="color"
                value={value.primaryColor}
                disabled={disabled}
                onChange={(event) => update("primaryColor", event.target.value)}
              />
              <span>{value.primaryColor}</span>
            </label>
            <label>
              Cor de destaque
              <input
                type="color"
                value={value.accentColor}
                disabled={disabled}
                onChange={(event) => update("accentColor", event.target.value)}
              />
              <span>{value.accentColor}</span>
            </label>
          </div>
        )}

        {value.paletteMode === "imported" && (
          <label>
            Design system (JSON ou variáveis CSS)
            <textarea
              value={value.designSystemInput}
              maxLength={4000}
              rows={4}
              disabled={disabled}
              placeholder={'{"primary":"#153a50","accent":"#d8aa63"}'}
              onChange={(event) =>
                update("designSystemInput", event.target.value)
              }
            />
            <span className="design-field-help">
              Somente cores hexadecimais. URLs e CSS executável não são aceitos.
            </span>
          </label>
        )}

        <label>
          Referência visual
          <input
            value={value.referenceNotes}
            maxLength={600}
            disabled={disabled}
            placeholder="Ex.: editorial premium, sóbrio e com bastante respiro"
            onChange={(event) => update("referenceNotes", event.target.value)}
          />
        </label>
      </div>
    </details>
  );
}
