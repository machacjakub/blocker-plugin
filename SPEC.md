# Specification

## Overview

Add a temporary pause feature to the BlockO'Clock browser extension that allows users to temporarily disable blocking for a specific website. When a user clicks the pause button for a blocked site, a form appears requiring them to specify how long to pause (in minutes) and provide a reason (minimum 15 characters). The pause will be temporary and the site will automatically resume blocking after the specified duration.

## Scope

### Options UI (options.html, options.js)
- Display a pause form inline below the site entry when the pause button is clicked.
- The form should contain: a dropdown for duration (5 minutes, 10 minutes, 30 minutes, 1 hour, 4 hours, 1 day) and a text input for reason (minimum 15 characters).
- Validate that the reason has at least 15 characters before accepting the form.
- If the user cancels the form, it closes without any state changes.
- Store the pause state, expiration timestamp, and reason with the blocked site data.
- Save pause reasons to localStorage under the key "reasons_to_pause" as an array (for accountability purposes).
- Display the remaining pause time in the UI for paused sites.

### Rules Service (rulesService.js)
- Update the logic to respect temporary pauses with expiration times.
- A paused site should not generate blocking rules until the pause expires.
- Check current timestamp against pause expiration to determine if a site should be blocked.

### Background Script (background.js)
- Check pause expiration times when updating rules.
- Automatically resume blocking when the pause duration expires.

## Out of scope

- Displaying pause history or logs of past pauses in the UI (reasons are saved to localStorage for accountability only).
- Allowing users to manually resume blocking before the pause duration expires.
- Allowing users to edit or extend an active pause.
- Complex scheduling or recurring pause patterns.
- Pausing all sites at once.

## References

- [options.js](options.js): Implements the options UI and handles pause button clicks.
- [options.html](options.html): Contains the UI structure for the options page.
- [rulesService.js](rulesService.js): Contains logic for generating blocking rules and checking pause states.
- [background.js](background.js): Handles periodic rule updates and can check for expired pauses.

## Acceptance criteria

- [ ] When a user clicks the pause button, a form appears inline below the site entry.
- [ ] The form contains a dropdown with duration options: 5 minutes, 10 minutes, 30 minutes, 1 hour, 4 hours, 1 day.
- [ ] The form contains a text input for the reason with validation requiring at least 15 characters.
- [ ] If the user cancels the form, it closes without changing any state.
- [ ] After submitting a valid form, the blocked site enters a paused state with an expiration timestamp.
- [ ] A paused site does not generate blocking rules during the pause period.
- [ ] After the pause duration expires, the site automatically resumes blocking.
- [ ] The UI displays the remaining pause time for paused sites.
- [ ] Pause reasons are saved to localStorage under the key "reasons_to_pause" as an array.