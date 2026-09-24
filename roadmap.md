# Organizer Roadmap

This roadmap breaks the remaining work into small, independently verifiable tasks. Complete the tasks in order within each phase; later UI work depends on the data and state contracts established earlier.

## Working agreements

- [x] Keep API calls in services and keep components responsible for presentation and user interaction.
- [ ] Add or update a focused unit test for every service operation, state transition, and non-trivial UI interaction.
- [ ] Show loading, empty, success, and error states for every server-backed workflow.
- [ ] Confirm destructive actions and handle partial failures without silently changing local state.
- [ ] Keep the existing Angular Material patterns and use accessible labels, focus handling, and keyboard support.

## Phase 1: Confirm the data and API contract

### 1.1 Inventory current models and endpoints

- [ ] Document the category endpoints and response shapes for fetch, create, update, and delete.
- [ ] Document the link endpoints and response shapes for fetch, create, update, delete, bulk delete, and link checking.
- [ ] Confirm how modules, categories, child categories, and links are related in API responses.
- [ ] Confirm whether category deletion recursively removes children and links, or whether the client must delete descendants first.
- [ ] Record the authentication and error response shapes used by the API.

### 1.2 Define shared domain types

- [ ] Extend `CategoryModel` with the fields actually returned by the API and make optional fields explicit.
- [ ] Extend `LinkItem` with username, password, long description, email, rating, last opened time, and last check result fields.
- [ ] Add typed request models for create and update instead of passing untyped partial objects throughout the UI.
- [ ] Add typed API response models for list, validation error, and link-check responses.
- [ ] Decide how passwords are masked in the UI and ensure they are never written to logs.

### 1.3 Establish shared request state

- [ ] Add a consistent loading/error state pattern to the category and link services.
- [ ] Decide whether service signals or observables own each state transition and use that choice consistently.
- [ ] Add a small notification/error-display path for failed mutations.
- [ ] Add tests for initial state, successful state updates, and failed requests.

## Phase 2: Finish category persistence and filtering

### 2.1 Connect category fetch to the database

- [ ] Replace the static category load in the dashboard with `CategoryService.fetchItems()`.
- [ ] Verify the configured category endpoint and normalize the API response into the tree shape.
- [ ] Preserve the selected category and expanded nodes when refreshed data arrives where possible.
- [ ] Add fetch success, loading, empty, and error states to the category view.
- [ ] Add service and dashboard tests for the database-backed fetch.

### 2.2 Connect category creation

- [ ] Submit the category edit form to `CategoryService.createItem()`.
- [ ] Send the selected module and parent category IDs with the request.
- [ ] Add the created category to the correct root or parent node using the API response.
- [ ] Close the dialog only after a successful response and display validation errors in the dialog.
- [ ] Add tests for root creation, child creation, failed creation, and cancelled creation.

### 2.3 Connect category updates

- [ ] Submit edits to `CategoryService.updateItem()` and use the returned category as the source of truth.
- [ ] Support moving a category to a different parent without losing its children.
- [ ] Preserve tree expansion and selection after a successful move or rename.
- [ ] Prevent duplicate submissions while an update is in progress.
- [ ] Add tests for rename, parent change, failed update, and stale/missing category IDs.

### 2.4 Connect category deletion

- [ ] Call `CategoryService.deleteItem()` only after confirmation.
- [ ] Send the API request before removing the category from the signal, or restore state if the request fails.
- [ ] Refresh or update the tree after recursive deletion according to the API contract.
- [ ] Clear the selected category when it or one of its ancestors is deleted.
- [ ] Add tests for confirmed deletion, cancelled deletion, failed deletion, and recursive descendants.

### 2.5 Filter categories by module name

- [ ] Make the module name in the category header clickable.
- [ ] Replace the module name with a focused text input while editing.
- [ ] Add an explicit way to commit and cancel the module filter, including Escape and blur behavior.
- [ ] Keep the input value separate from the committed filter value while the user is typing.
- [ ] Filter category trees by category name within the selected module without mutating service data.
- [ ] Decide whether matching a descendant keeps its ancestor path visible and implement that behavior.
- [ ] Add a clear-filter action and an empty-results state.
- [ ] Add component tests for enter, cancel, clear, case-insensitive matching, and ancestor visibility.

## Phase 3: Build the link editing workflow

### 3.1 Create the link form

- [ ] Define a typed reactive form for name, URL, category, description, email, username, password, and rating.
- [ ] Add required-field, URL, length, and rating-range validation.
- [ ] Populate the category selector from the current category state.
- [ ] Add a create-link action from the link view.
- [ ] Submit through `LinkService.createLink()` and update the list from the API response.
- [ ] Disable submission while saving and show field-level/server validation errors.
- [ ] Add tests for valid submission, invalid fields, missing category, and failed creation.

### 3.2 Edit an existing link

- [ ] Reuse the link form for edit mode and populate it from the selected link.
- [ ] Keep password fields masked and avoid replacing an existing password unless the user changes it.
- [ ] Submit changes through `LinkService.updateLink()`.
- [ ] Preserve the current list/filter/search state after a successful update.
- [ ] Add tests for form population, changed fields, unchanged password, and failed update.

### 3.3 Add advanced link fields as edit tabs

- [ ] Add tabs for the basic link information and advanced information.
- [ ] Put user, password, long description, and rating in the advanced tab.
- [ ] Preserve form values when switching tabs.
- [ ] Ensure keyboard navigation and accessible tab labels work.
- [ ] Add tests that advanced values are retained and included in create/update requests.

### 3.4 Delete a link

- [ ] Add a delete action to the link preview and edit view.
- [ ] Require confirmation and include the link name in the confirmation message.
- [ ] Call `LinkService.deleteLink()` and remove the link only after success.
- [ ] Clear the preview if the deleted link was selected.
- [ ] Add tests for confirmation, cancellation, successful deletion, and failure recovery.

## Phase 4: Link list selection and bulk actions

### 4.1 Add link checkboxes

- [ ] Add a checkbox to each link row/card and a select-all checkbox for the current result set.
- [ ] Track selected IDs independently from the rendered list so filtering does not corrupt selection.
- [ ] Define and implement select-all, deselect-all, and indeterminate states.
- [ ] Keep selection keyboard accessible and announce the selected count where appropriate.
- [ ] Add tests for individual selection, select-all, deselect-all, and filtered results.

### 4.2 Add bulk delete

- [ ] Add a bulk delete action that is disabled when no links are selected.
- [ ] Confirm the number of links that will be deleted.
- [ ] Call the API's bulk-delete endpoint if available; otherwise make controlled individual requests.
- [ ] Remove only successfully deleted links and report any failures.
- [ ] Clear selection after a fully successful operation.
- [ ] Add service and component tests for all-success, partial-failure, cancellation, and empty selection.

## Phase 5: Improve the link preview

### 5.1 Add preview metadata

- [ ] Display last opened time with a consistent local date/time format.
- [ ] Display the current rating with an accessible non-editing visual treatment.
- [ ] Display the last link-check result, including status, timestamp, and failure detail when available.
- [ ] Add an explicit `Check link` action with loading, success, and failure states.
- [ ] Update the selected link with the check response without losing unrelated fields.
- [ ] Add tests for missing metadata, successful checks, and failed checks.

### 5.2 Rework preview layout and actions

- [ ] Group identity, URL, metadata, description, credentials, and actions into a clear information hierarchy.
- [ ] Place primary actions consistently and keep destructive actions visually separated.
- [ ] Use icon buttons with tooltips where the action is familiar, and text plus icon for important commands.
- [ ] Make long URLs and descriptions wrap without changing the surrounding layout.
- [ ] Verify the layout at narrow, medium, and wide widths before moving on.

## Phase 6: Search and search settings

### 6.1 Implement link search

- [ ] Add a search input near the link list and bind it to a debounced search state.
- [ ] Define whether filtering is client-side, server-side, or hybrid based on the API contract.
- [ ] Search the configured fields without mutating the full link collection.
- [ ] Show result count, no-results state, loading state, and clear-search action.
- [ ] Preserve the selected link when it remains in the result set and clear it when it does not.
- [ ] Add tests for debounce, case-insensitive matching, clearing, and no results.

### 6.2 Add search scope settings

- [ ] Add a settings icon beside the search bar with an accessible tooltip and label.
- [ ] Add scope options: current selected category only, selected category plus all children, and all categories.
- [ ] Define behavior when no category is selected and make the default explicit.
- [ ] Add field options: link name, URL, description, and email.
- [ ] Allow selecting one or more fields and show the active scope/fields in the settings UI.
- [ ] Persist search settings for the session, and decide whether they should persist across sessions.
- [ ] Apply scope and field settings consistently to both local filtering and API requests.
- [ ] Add tests for each scope, each field, multiple fields, no selected category, and reset-to-default.

## Phase 7: Global account menu

- [ ] Add a menu icon in the top-right application header.
- [ ] Add menu actions for Profile, Settings, and Logout.
- [ ] Route Profile to a placeholder or profile screen with a clear follow-up task if the page does not exist yet.
- [ ] Route Settings to the settings screen or define the settings panel boundary used by search settings.
- [ ] Reuse the existing logout flow and navigate to login after successful logout.
- [ ] Ensure the menu closes on selection, Escape, and outside click.
- [ ] Add component tests for menu visibility, navigation, and logout.

## Phase 8: Rework the mobile view

### 8.1 Define mobile interaction model

- [ ] Choose the mobile navigation pattern for categories, link results, and link preview: stacked view, drawer, or route-based detail view.
- [ ] Define how users return from a link preview to the list.
- [ ] Define where search, search settings, create, and bulk actions live on small screens.
- [ ] Define minimum touch target sizes and keyboard/focus behavior.

### 8.2 Implement responsive layout

- [ ] Add responsive breakpoints for the application shell, category tree, link list, and preview.
- [ ] Collapse the category sidebar into a drawer or compact selector on narrow screens.
- [ ] Make the link list readable without horizontal scrolling and keep selection controls usable.
- [ ] Move preview actions into a stable mobile action area that does not cover content.
- [ ] Make forms and advanced tabs usable at narrow widths, including validation messages.
- [ ] Keep the top-right account menu and search controls reachable without overlap.

### 8.3 Verify mobile behavior

- [ ] Test the primary workflows at phone and tablet widths: login, category selection, search, create, edit, delete, and check link.
- [ ] Test orientation changes and viewport resizing.
- [ ] Check text wrapping, focus order, touch targets, and screen-reader labels.
- [ ] Add regression tests for responsive state changes where the component logic differs by viewport.

## Phase 9: Integration and release checklist

- [ ] Run the full unit test suite and fix only failures caused by the completed roadmap work.
- [ ] Run a production build and resolve type, template, and SSR errors.
- [ ] Verify authenticated and unauthenticated behavior for every new route and API request.
- [ ] Verify that secrets, passwords, and tokens do not appear in logs or rendered error messages.
- [ ] Test the complete desktop workflow with real database data.
- [ ] Test the complete mobile workflow with real database data.
- [ ] Update `README.md` with any new setup, API, or run instructions.
- [ ] Mark completed roadmap items with the completion date and note any API-dependent follow-up.

