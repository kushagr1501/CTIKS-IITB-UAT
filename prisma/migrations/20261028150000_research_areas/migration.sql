CREATE TABLE "research_areas" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL DEFAULT '',
  "imageUrl" TEXT NOT NULL DEFAULT '',
  "professorNames" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "displayOrder" INTEGER NOT NULL DEFAULT 0,
  "visible" BOOLEAN NOT NULL DEFAULT TRUE,
  "version" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ(3) NOT NULL
);
CREATE INDEX "research_areas_visible_displayOrder_id_idx" ON "research_areas"("visible", "displayOrder", "id");
INSERT INTO "research_areas" ("id", "title", "description", "imageUrl", "professorNames", "displayOrder", "visible", "version", "createdAt", "updatedAt") VALUES
(gen_random_uuid(), 'Indian Mathematics & Astronomy', 'Textual & Critical Studies of Primary Sources, Computational Techniques (including Vakya system), Pedagogy & Knowledge Transmission, Kerala School & Late Medieval Developments, Planetary Models & Observational Astronomy, Astronomical Instruments (including masonry) & Observation', '/assets/research/mathematics.webp', ARRAY['Prof. K. Ramasubramanian', 'Prof. Ashish Karn', 'Prof. V. S. S. Pavan Kumar Hari']::TEXT[], 0, TRUE, 1, NOW(), NOW()),
(gen_random_uuid(), 'Linguistics & Language Technology', 'Mathematical modeling of Paninian grammar, Shabdabodha in view of the indivisibility of the sentence, Discourse Analysis, Yogyata Relations and Automatic Script Generator, Accent generator, Wordnet of Indian Languages, Any other relevant topic in the field of Vyakarana', '/assets/research/language.webp', ARRAY['Prof. Nagendra Pavana', 'Prof. Malhar Kulkarni', 'Prof. G. Siva Kumar', 'Prof. Girish Dalvi']::TEXT[], 1, TRUE, 1, NOW(), NOW()),
(gen_random_uuid(), 'AI for IKS and IKS for AI', '', '/assets/research/ai.webp', ARRAY[]::TEXT[], 2, TRUE, 1, NOW(), NOW()),
(gen_random_uuid(), 'Ancient Water Management', 'Sustainable Water Management drawing inferences from various inscriptional sources, Community-based sustainable large-scale rainwater harvesting, temple tanks and their heritage, Management of Tank-Irrigation Systems – a socio-hydrological approach, Stepwells and their contribution in water management, Water management in the Forts of 12 UNESCO heritage sites in Maharashtra and Tamil Nadu', '/assets/research/water.webp', ARRAY['Prof. V. Jothiprakash', 'Prof. Vijayaraghavan M. Chariar']::TEXT[], 3, TRUE, 1, NOW(), NOW()),
(gen_random_uuid(), 'Yoga & Wellness Science', 'Language and Wellness, Psychological aspects of Yoga based practices at individual and organizational level, Study of classical texts in Yoga, Cultural, Social & Historical Studies of Yoga, Application of Yoga in different domains such as therapy, sports and management.', '/assets/research/yoga.webp', ARRAY['Prof. K. Ramasubramanian', 'Prof. Ashish Pandey', 'Prof. Sundeep Kapila']::TEXT[], 4, TRUE, 1, NOW(), NOW()),
(gen_random_uuid(), 'Heritage & Artisanal Skills', 'Analysis of jointless structures in temples and temple tanks, Heritage Impact assessment, Characterization of ancient construction materials and methods, Interventions to existing heritage structures', '/assets/research/heritage.webp', ARRAY['Prof. Swathy Manohar', 'Prof. Vijayaraghavan M. Chariar']::TEXT[], 5, TRUE, 1, NOW(), NOW()),
(gen_random_uuid(), 'Indian Financial & Business Models', 'Traditional Indian foundations of Business, Commerce, Finance and Economics, Arthashastra & Ancient Economic and Business Thought, Indigenous Financial, Banking and Business Systems, Accounting, Measurement & Wealth Reporting, Sustainable Business and Circular Economy, Behavioral Finance, Family Business, Intergenerational Capital, Entrepreneurship and Innovation, Corporate Governance and Leadership, Ethics, Trust & Informal Governance, MSMEs & Informal Economy', '/assets/research/business.webp', ARRAY['Prof. Varadraj Bapat']::TEXT[], 6, TRUE, 1, NOW(), NOW()),
(gen_random_uuid(), 'Music & Organology', '', '/assets/research/music.webp', ARRAY[]::TEXT[], 7, TRUE, 1, NOW(), NOW());
