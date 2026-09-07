## ADDED Requirements
### Requirement: The system SHALL honor explicit model selection
The system SHALL honor explicit model selection according to the implementation design.
#### Scenario: Core workflow
- **WHEN** An explicit available model is selected
- **THEN** the system SHALL use that model or return an error without silently switching
