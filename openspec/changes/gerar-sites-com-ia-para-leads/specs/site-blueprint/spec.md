## ADDED Requirements
### Requirement: The system SHALL preserve factual integrity
The system SHALL preserve factual integrity according to the implementation design.
#### Scenario: Core workflow
- **WHEN** Contact, prices, hours and reviews are absent
- **THEN** the system SHALL omit unsupported facts and mark every generated service as a suggestion
