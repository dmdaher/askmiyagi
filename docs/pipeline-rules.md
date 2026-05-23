# Pipeline Rules — Lessons Learned

These rules were derived from real failures across DeepMind 12 and CDJ-3000 builds. Each rule exists because violating it caused a specific, documented problem.

---

## 1. Sieve Extraction Strategy (Anti-Hallucination)

Manual-extractor must separate **Perception** (what is on the page) from **Cognition** (how to teach it).

**Process in 10-page buckets:**
1. **Sieve** — Read 10 pages. Output raw table of exact strings + page numbers. No interpretation.
2. **Verify** — Re-read same 10 pages. Find omissions/typos in the table.
3. **Anchor** — Cross-reference table against panel-constants.ts. Flag discrepancies.
4. **Checkpoint** — Write verified table. Do NOT proceed until checkpointed.

**Why:** Hallucination occurs when an agent reads and interprets simultaneously over large volumes. Context drift causes paraphrased parameter names and invented menu structures.

---

## 2. Agent Scope Isolation

Agents must not produce output outside their scope.

- **Curriculum agents** (extractor, auditor, builder): NO layout diagrams, ASCII art, or spatial descriptions
- **Panel agents** (gatekeeper, SI, PQ): NO curriculum opinions or tutorial content
- **Tutorial builder**: Only reads checkpoints from its pipeline chain (extractor → auditor → builder)

**Why:** Coverage auditor checkpoints containing layout descriptions anchor downstream agents. Panel builder should derive layout from hardware photos and manual diagrams ONLY.

---

## 3. Design Before Tutorials

Panel design + full QA pipeline + user approval BEFORE any tutorial work.

**Why:** The CDJ-3000 build went straight from panel to tutorials without QA. QA then found the panel scored 0.0/5.5. All 18 tutorials were built against a broken panel.

---

## 4. Enforce QA Pipeline (Never Skip Gates)

The full panel QA pipeline must run: Gatekeeper → SI + PQ → Critic. No exceptions.

**Why:** During the CDJ-3000 build, the orchestrating agent skipped all QA gates — going straight from panel build to tutorial building. The orchestrator agent exists but was never invoked.

**Root cause:** Prioritizing throughput over process. The agents exist, the SOULs define gates, but without enforcement the orchestrating agent optimizes for speed.

---

## 5. Boundary Containment (No CSS Overflow)

Any text or icon that overflows its container = (-1.0) Boundary Violation.

**Why:** PQ scored 10/10 on CDJ-3000 despite "BEAT SYNC/INST.DOUBLES" overflowing the 32px button face. It dismissed overflow as "still legible." Physical hardware never has text spilling outside a button.

**Fix options:** Resize container, reduce font, use `labelPosition="above"` (silkscreen style), or multi-line treatment.

---

## 6. Adversarial Blindness (PQ Independence)

PQ must generate its own position map from photos/manual BEFORE reading the Gatekeeper's template.

**Why:** In the DeepMind PROG section, all agents validated against a wrong Gatekeeper template. PQ scored 10/10 because it anchored to the Gatekeeper's layout instead of independently verifying. This is "circular validation" — once the Gatekeeper says it's right, nobody questions it.

---

## 7. Topology Before Styling

Agents must verify spatial relationships (Cardinal Neighbor Tables) before checking visual properties (font-size, color, padding).

**Why:** QA agents gravitate toward easy checks ("does the label match?") over hard checks ("is the button east of the slider?"). Three rounds of QA passed a section where 6 of 11 controls overflowed the section boundary — because agents checked labels first and never reached topology.

---

## 8. Two Sources of Truth

Gatekeeper uses manual text. PQ uses hardware photos. When they disagree, Critic resolves.

**Why:** Using the same source (manual p.14 diagram) for both agents creates a single point of failure. Independent sources create true adversarial verification.

---

## 9. Orchestrator as Root Process

No QA agent runs without the orchestrator managing phase transitions. Standalone runs are "draft only" and cannot vault sections.

**Why:** Manual orchestration led to skipping every gate in the pipeline. The orchestrator enforces phase transitions, priority inversion detection, and vault authorization.

---

## 10. PROG Blindspot (Circular Validation)

If the Gatekeeper's blueprint is wrong, all downstream agents will validate the wrong thing.

**Why:** Gatekeeper described the PROG rotary encoder below the LCD. All agents validated against this template. The encoder should have been to the RIGHT of the LCD. Three agents scored 10/10 on a fundamentally wrong layout.

**Fix:** Gatekeeper must produce ASCII map + coarse grid + cardinal neighbors. PQ must independently derive positions. Orchestrator cross-checks both before allowing vault.
