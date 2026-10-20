# Accessibility evidence

RavelNest aims to support keyboard and assistive-technology use through semantic HTML, explicit control names, understandable feedback, and responsive layouts. WCAG conformance is not claimed solely from automated testing.

## Interface decisions and verification

| Decision                                                | Purpose                                                                       | Evidence                                                |
| ------------------------------------------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------- |
| Semantic navigation, headings, buttons, and form labels | Expose structure and names without relying on visual position.                | Component markup, keyboard browser journey, axe checks. |
| Visible keyboard focus                                  | Help keyboard users locate the active control.                                | CSS focus rules and manual keyboard checklist.          |
| Dialog labeling and focus management                    | Keep event creation usable without a pointer and restore context after close. | Dialog component and browser interaction tests.         |
| Text status/source notices                              | Communicate loading, errors, save results, and demo/Gemini provenance.        | Live-region/status markup and async tests.              |
| Text values beside visual budget indicators             | Convey costs without requiring color or chart interpretation.                 | Budget view markup and axe checks.                      |
| Responsive layouts and reduced-motion rules             | Support narrow screens and users who reduce animation.                        | Mobile browser assertions and CSS media queries.        |

## Automated checks

```bash
npm run test:e2e
```

The Chromium suite uses axe to reject **serious and critical** violations in the tested states and covers keyboard/mobile journeys. See [TESTING.md](TESTING.md) for the final run result. Passing axe does not establish screen-reader usability, complete contrast coverage, all WCAG criteria, or behavior in every browser.

The local Chromium run inspected all six workspace views, the event creation form, a generated mobile preview, and the final mobile event view. A keyboard journey checks repeated Tab navigation, reverse navigation, Escape, and return to the initiating control. The mobile journey uses a 390 × 844 viewport with reduced motion and checks for page-wide overflow. The screenshots in [docs/screenshots](docs/screenshots) show the inspected desktop and mobile sample workspace.

The final local run on **20 October 2026** passed all ten browser tests and found **zero serious/critical axe violations** in those audited states. The separate manual checklist below remains unverified; screenshots and automated assertions do not substitute for assistive-technology testing.

## Manual assistive-technology review

Record browser, operating system, assistive technology, date, and result when completing each item. Unchecked items remain unverified.

- [ ] With keyboard only, reach all navigation views, create an event, save a preview, edit a cost, complete a task, and change a vendor.
- [ ] Open and close dialogs using keyboard; confirm sensible initial focus, contained Tab/Shift+Tab, Escape behavior, and focus restoration.
- [ ] With VoiceOver/Safari or NVDA/Firefox, confirm headings, landmarks, labels, selected navigation, task state, and source notices are announced.
- [ ] Inspect 200% and 400% zoom without clipping content or hiding required controls.
- [ ] At a 320 CSS-pixel viewport, confirm reflow and usable controls without page-wide horizontal scrolling.
- [ ] Review text, control, chart-label, and focus contrast with a contrast tool.
- [ ] Enable reduced motion and confirm the interface does not depend on animation.
- [ ] Inspect long event names, error messages, large amounts, empty views, and browser storage failure.
- [ ] Inspect an RTL document direction and confirm logical layout and reading order.
- [ ] Test touch interaction and dialog scrolling on a physical mobile device.

No real screen-reader, full manual contrast, physical-device, zoom, or RTL conformance result is implied by a browser test unless its corresponding review is recorded.
