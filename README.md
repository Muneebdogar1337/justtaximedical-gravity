# Just Taxi Medicals UK — High-Performance Web Platform

A production-grade, clinically verified medical booking and compliance platform tailored for UK Taxi & Private Hire Drivers, Hackney Carriages, Uber, Bolt, and HGV/PCV commercial drivers.

- **Domain:** `justtaximedicals.co.uk`
- **Framework:** Astro 7 + `@astrojs/cloudflare`
- **Deployment:** Cloudflare Pages (Static Edge SSG + Edge Functions)
- **Clinical Governance:** GMC-Registered Doctors (Dr Ayyaz Sultan GMC #6049394 & Dr Ali Hassan Cheema GMC #8022686)

---

## 🚀 Quick Start & Development

```bash
# Install dependencies
npm install

# Run Astro development server
npm run dev

# Build for Cloudflare Pages production
npm run build

# Preview production build locally
npm run preview
```

---

## 💎 Key Features Built

### 1. Flat Permalinks (`domain.com/{slug}`)
Zero directory nesting for maximum crawl velocity and PageRank flow:
- `/wolverhampton-taxi-medical`
- `/london-tfl-medical`
- `/birmingham-taxi-medical`
- `/manchester-taxi-medical`
- `/leeds-taxi-medical`
- `/group-2-medical-standards`
- `/driver-eye-test-standards`
- `/blood-pressure-driving-limits`
- `/summary-care-record-guide`
- `/gdpr-medical-records-letter`
- `/what-to-bring-taxi-medical`
- `/d4-hgv-medical`
- `/pricing`
- `/our-doctors`
- `/book`
- `/admin`

### 2. Clinical E-E-A-T & Statutory Standards
- **GMC Doctors:** Dr Ayyaz Sultan (GMC #6049394) & Dr Ali Hassan Cheema (GMC #8022686) from First Medical Consultants.
- **YMYL Citations:** Direct contextual linking to DVLA (`gov.uk`), NHS (`nhs.uk`), GMC (`gmc-uk.org`), and ICO (`ico.org.uk`).
- **Care Quality Commission (CQC) Clarity:** Formally cites Schedule 1, Paragraph 4 statutory licensing exemption.

### 3. Senior SEO & Anti-Slop Safeguards
- Passed 6-stage automated QA fact-checking audit.
- 0% synthetic AI buzzwords; human British driver tone calibrated to Flesch-Kincaid Grade 7–8.
- Mobile Sticky Driver Drawer (1-Tap Call `0330 058 9690`, WhatsApp instant dispatch, and Pay-on-Arrival booking).

### 4. Cloudflare Pages Deployment
- **Framework Preset:** Astro
- **Build command:** `npm run build`
- **Build output directory:** `dist`
- **Edge D1 DB:** Bound as `DB` for serverless SQLite booking persistence.
