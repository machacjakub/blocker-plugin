# Solution design

## Overview

This solution adds a temporary pause feature to the BlockO'Clock browser extension, allowing users to temporarily disable blocking for specific websites with accountability. When users click the pause button, an inline form appears requiring them to select a duration (from predefined options: 5 minutes to 1 day) and provide a reason (minimum 15 characters). The system stores pause expiration timestamps and automatically resumes blocking when the duration expires. Pause reasons are logged to localStorage for accountability purposes.

## Architecture design

### rulesService.js

#### Purpose and responsibilities
Encapsulates all logic for generating, updating, and removing blocking rules, as well as time-based blocking checks and storage access.

#### Interfaces and communication
- Exports pure functions for rule generation, time checks, and Chrome API interactions:
  ```js
  export const shouldBeBlockedByTime: ({timeFrom, timeTo}) => boolean
  export const generateBlockingRules: (sites) => Rule[]
  export const getBlockedSites: () => Promise<{blockedSites: Site[]}>
  export const removeCurrentRules: () => Promise<void>
  export const setNewRules: (rules: Rule[]) => Promise<void>
```