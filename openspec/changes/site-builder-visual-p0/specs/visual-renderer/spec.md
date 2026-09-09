## ADDED Requirements
### Requirement: Device preview SHALL share the export document
The system SHALL render the same HTML in device preview, fullscreen, new tab and export.
#### Scenario: Preview controls
- **WHEN** a user selects Desktop, Tablet or Mobile
- **THEN** the iframe SHALL use a 1440, 768 or 390 CSS pixel viewport scaled to fit
- **AND** fullscreen SHALL retain toolbar, scrolling, Escape and explicit exit
- **AND** opening a new tab SHALL use the same HTML as export with Blob URL lifecycle cleanup

### Requirement: Versioned visual blueprint SHALL preserve existing projects
The system SHALL migrate legacy content deterministically without deleting existing projects.
#### Scenario: Legacy project
- **WHEN** a v1 project is loaded
- **THEN** normalization SHALL produce v2 with deterministic template defaults without losing content or factual restrictions

### Requirement: Variants SHALL select distinct components
The renderer SHALL resolve supported variants to distinct components with responsive layouts.
#### Scenario: Structural diversity
- **WHEN** full-bleed, split or minimal hero is selected
- **THEN** different semantic component structures SHALL render
- **AND** two About and two Services compositions SHALL have explicit mobile behavior
- **AND** unsupported variants at rendering SHALL resolve to safe defaults

### Requirement: Later milestones SHALL remain deferred
Implementation SHALL stop before P1, P2 and P3 for user review.
#### Scenario: P0 completion
- **WHEN** P0 is validated
- **THEN** implementation SHALL stop for review before recipes, media intent, quality gate or media providers
