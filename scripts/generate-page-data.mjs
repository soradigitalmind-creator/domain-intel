/**
 * Pre-build script: reads site-data/ once and writes per-page JSON to page-data/.
 *
 * Run this before `next build`. Each Next.js page then reads only its own small
 * JSON file instead of the full web-bundle.json (1.6–4.2 MB per domain).
 *
 * Usage: node scripts/generate-page-data.mjs
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const NEXT_APP_ROOT = path.join(__dirname, "..");

// site-data/ is inside the repo on Vercel, one level up in the local workspace
const SITE_DATA_ROOT = process.env.NEXT_SITE_DATA_ROOT ?? await (async () => {
  for (const candidate of [
    path.join(NEXT_APP_ROOT, "site-data"),       // deploy repo (Vercel)
    path.join(NEXT_APP_ROOT, "..", "site-data"),  // local dev workspace
  ]) {
    try { await fs.access(candidate); return candidate; } catch { /* try next */ }
  }
  throw new Error("site-data directory not found");
})();

const PAGE_DATA_ROOT = path.join(NEXT_APP_ROOT, "page-data");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function readJson(filePath) {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function writeJson(filePath, data) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(data), "utf8");
}

function titleizeSlug(slug) {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function encodeSourceId(sourceId) {
  return sourceId.split("/").pop() ?? sourceId;
}

function computeTrendScore(years) {
  if (!years) return 0;
  const current = (years["2026"] ?? 0) + (years["2025"] ?? 0);
  const previous = (years["2024"] ?? 0) + (years["2023"] ?? 0);
  if (previous <= 0) return current > 0 ? 1 : 0;
  return (current - previous) / previous;
}

function extractTopicSummary(slug, payload) {
  if (!payload) return null;
  return payload[slug] ?? Object.values(payload)[0] ?? null;
}

function buildSourceMaps(bundle) {
  const sourceById = new Map(bundle.sources.map((s) => [s.source_id, s]));
  const assignmentById = new Map(
    (bundle.paper_assignments ?? []).map((a) => [a.source_id, a])
  );
  // claims: source_id → claim[]
  const claimsBySource = new Map();
  for (const claim of bundle.claims ?? []) {
    const list = claimsBySource.get(claim.source_id) ?? [];
    list.push(claim);
    claimsBySource.set(claim.source_id, list);
  }
  // entities: source_id → entity[] (entities store source_ids, invert)
  const entitiesBySource = new Map();
  for (const entity of bundle.entities ?? []) {
    for (const sid of entity.source_ids ?? []) {
      const list = entitiesBySource.get(sid) ?? [];
      list.push(entity);
      entitiesBySource.set(sid, list);
    }
  }
  // Inverted indices for related-paper scoring
  // entity canonical_id → Set<source_id>
  const sourcesByEntity = new Map();
  for (const entity of bundle.entities ?? []) {
    sourcesByEntity.set(entity.canonical_id, new Set(entity.source_ids ?? []));
  }
  // concept → Set<source_id>
  const sourcesByConcept = new Map();
  for (const source of bundle.sources) {
    for (const concept of source.concepts ?? []) {
      const set = sourcesByConcept.get(concept) ?? new Set();
      set.add(source.source_id);
      sourcesByConcept.set(concept, set);
    }
  }

  // Per-topic fingerprints: Set of entity ids + concepts derived from its papers
  const topicFingerprints = new Map();
  for (const topic of bundle.subgenres ?? []) {
    const fp = new Set();
    for (const pid of topic.paper_ids ?? []) {
      const src = sourceById.get(pid);
      if (src) {
        for (const c of src.concepts ?? []) fp.add("c:" + c);
      }
      for (const ent of entitiesBySource.get(pid) ?? []) {
        fp.add("e:" + ent.canonical_id);
      }
    }
    topicFingerprints.set(topic.subgenre_id, fp);
  }

  // Per-paper fingerprints: entity canonical_ids + concepts
  const paperFingerprints = new Map();
  for (const source of bundle.sources) {
    const fp = new Set();
    for (const c of source.concepts ?? []) fp.add("c:" + c);
    for (const ent of entitiesBySource.get(source.source_id) ?? []) fp.add("e:" + ent.canonical_id);
    paperFingerprints.set(source.source_id, fp);
  }

  return { sourceById, assignmentById, claimsBySource, entitiesBySource, sourcesByEntity, sourcesByConcept, topicFingerprints, paperFingerprints };
}

function mapTopicPaper(sourceId, sourceById, assignmentById) {
  const source = sourceById.get(sourceId);
  if (!source) return null;
  const assignment = assignmentById.get(sourceId);
  return {
    source_id: sourceId,
    title: source.title,
    year: source.year ?? null,
    url: source.url ?? source.doi ?? "#",
    doi: source.doi ?? null,
    short_summary: source.short_summary ?? "",
    cited_by_count: source.cited_by_count ?? 0,
    adjusted_cited_by_count: source.adjusted_cited_by_count ?? 0,
    concepts: source.concepts?.slice(0, 8) ?? [],
    assignment: assignment
      ? {
          confidence: assignment.confidence,
          score: assignment.score,
          matched_terms: assignment.matched_terms,
          secondary_subgenre_ids: assignment.secondary_subgenre_ids,
        }
      : null,
  };
}

// ---------------------------------------------------------------------------
// DomainSummary builder
// ---------------------------------------------------------------------------

function buildDomainSummary(slug, bundle, siteDomainData, portalData) {
  const topicSummaryPayload = bundle?.topic_summary ?? null;
  const overviewPayload = bundle?.overview_partition_summary ?? null;
  const subgenresPayload = bundle?.subgenres ?? null;

  const topicSummary = extractTopicSummary(slug, topicSummaryPayload);
  const topicCount = subgenresPayload?.length ?? 0;
  const siteOverview = siteDomainData?.overview?.partition_summary;
  const siteSnapshot = siteDomainData?.snapshot;
  const portalDomain = portalData?.domains?.find((d) => d.slug === slug);
  const portalOverview = portalDomain?.overview_partition_summary;

  return {
    slug,
    title:
      portalDomain?.title ??
      (siteDomainData?.title ? titleizeSlug(siteDomainData.title) : titleizeSlug(slug)),
    sources:
      portalDomain?.sources ?? siteSnapshot?.papers ?? topicSummary?.counts?.sources ?? 0,
    entities:
      portalDomain?.entities ?? siteSnapshot?.entities ?? topicSummary?.counts?.entities ?? 0,
    claims:
      portalDomain?.claims ?? siteSnapshot?.claims ?? topicSummary?.counts?.claims ?? 0,
    topicCount:
      portalDomain?.parent_subgenres ?? siteSnapshot?.topics ?? topicCount,
    topConcepts: topicSummary?.top_concepts?.slice(0, 5) ?? [],
    overviewPapers:
      portalOverview?.overview_papers ??
      siteOverview?.overview_papers ??
      overviewPayload?.overview_papers ??
      0,
    topicalPapers:
      portalOverview?.topical_papers ??
      siteOverview?.topical_papers ??
      overviewPayload?.topical_papers ??
      topicSummary?.counts?.sources ??
      0,
    facetCounts:
      portalOverview?.facet_counts ??
      siteOverview?.facet_counts ??
      overviewPayload?.facet_counts ??
      {},
    hasDetail: Boolean(topicSummaryPayload && subgenresPayload?.length),
    abstractionLabel:
      portalDomain?.abstraction_label ?? siteDomainData?.abstraction?.label,
    relatedDomains: buildRelatedDomains(slug, portalData),
  };
}

function capitalizeFirst(s) {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function sanitizeTopicSummary(summary) {
  if (typeof summary !== "string" || summary.length === 0) {
    return "";
  }

  return summary
    .replace(/,?\s*\d+\s+prominent entities?,\s*\d+\s+prominent properties?\./gi, ".")
    .replace(/\s+\./g, ".")
    .replace(/\.\s*\./g, ".")
    .trim();
}

// ---------------------------------------------------------------------------
// Per-page data builders
// ---------------------------------------------------------------------------

/** domain.json — for /domains/[slug] */
function buildDomainPageData(slug, bundle, siteDomainData, domainSummary) {
  return {
    ...domainSummary,
    subgenres: bundle.subgenres,
    roleProfiles: siteDomainData?.role_profiles ?? [],
    risingTopics: siteDomainData?.rising_topics ?? [],
    hierarchy:
      siteDomainData?.hierarchy ?? bundle.subgenre_hierarchy_summary ?? {},
  };
}

/** topics-index.json — for /domains/[slug]/topics */
function buildTopicsIndexData(slug, bundle, siteDomainData, domainSummary, maps) {
  const { sourceById, assignmentById } = maps;
  const topicYearCounts = siteDomainData?.topic_year_counts;
  const hierarchySummary =
    siteDomainData?.hierarchy ?? bundle.subgenre_hierarchy_summary;
  const subgenres = bundle.subgenres;

  const rootTopics = subgenres.filter((t) => t.parent_id === null);
  const topics = rootTopics
    .map((topic) => {
      const children = subgenres.filter((t) => t.parent_id === topic.subgenre_id);
      // Effective paper count: root own papers + all descendant papers (deduped).
      // Concentrated roots may have 0 own paper_ids after demotion to children.
      const effectivePaperIds = [...new Set([
        ...topic.paper_ids,
        ...children.flatMap((c) => c.paper_ids),
      ])];
      const trendScore = computeTrendScore(topicYearCounts?.[topic.label]);
      const featuredPapers = effectivePaperIds
        .map((id) => mapTopicPaper(id, sourceById, assignmentById))
        .filter(Boolean)
        .sort((a, b) => b.cited_by_count - a.cited_by_count)
        .slice(0, 3);

      return {
        subgenre_id: topic.subgenre_id,
        label: capitalizeFirst(topic.label),
        summary: sanitizeTopicSummary(topic.summary),
        paperCount: effectivePaperIds.length,
        subtopicCount: children.length,
        tags: topic.member_terms.slice(0, 4),
        trendScore,
        trendLabel: trendScore > -0.12 ? "rising" : "steady",
        children: children
          .map((c) => ({
            subgenre_id: c.subgenre_id,
            label: capitalizeFirst(c.label),
            paperCount: c.paper_ids.length,
          }))
          .sort((a, b) => b.paperCount - a.paperCount)
          .slice(0, 6),
        featuredPapers,
      };
    })
    .sort((a, b) => b.trendScore - a.trendScore || b.paperCount - a.paperCount);

  return {
    domain: domainSummary,
    hierarchy: {
      maxDepth: hierarchySummary?.max_depth ?? 0,
      rootTopics: hierarchySummary?.root_topics ?? rootTopics.length,
      descendantTopics: hierarchySummary?.descendant_topics ?? 0,
      leafTopics: hierarchySummary?.leaf_topics ?? 0,
    },
    topics,
  };
}

/** Find sibling domains in the same portal category. */
function buildRelatedDomains(slug, portalData) {
  if (!portalData?.categories) return [];
  const category = portalData.categories.find((cat) =>
    cat.domains?.some((d) => d.slug === slug)
  );
  if (!category) return [];
  return category.domains
    .filter((d) => d.slug !== slug)
    .map((d) => ({ slug: d.slug, title: d.title }));
}

/** papers-index.json — for /domains/[slug]/papers */
function buildPapersIndexData(slug, bundle, domainSummary, maps) {
  const { sourceById, assignmentById } = maps;
  const subgenres = bundle.subgenres;
  const topicMap = new Map(subgenres.map((t) => [t.subgenre_id, t]));
  const rootTopics = subgenres.filter((t) => t.parent_id === null);

  const shelves = rootTopics
    .map((topic) => ({
      topicId: topic.subgenre_id,
      topicLabel: topic.label,
      papers: topic.paper_ids
        .map((id) => mapTopicPaper(id, sourceById, assignmentById))
        .filter(Boolean)
        .sort((a, b) => b.cited_by_count - a.cited_by_count)
        .slice(0, 6),
    }))
    .filter((shelf) => shelf.papers.length > 0)
    .sort((a, b) => b.papers[0].cited_by_count - a.papers[0].cited_by_count);

  const archive = Array.from(sourceById.values())
    .map((source) => {
      const paper = mapTopicPaper(source.source_id, sourceById, assignmentById);
      if (!paper) return null;
      const assignment = assignmentById.get(source.source_id);
      const primaryTopic = assignment?.primary_subgenre_id
        ? topicMap.get(assignment.primary_subgenre_id) ?? null
        : null;
      return {
        ...paper,
        primaryTopicId: primaryTopic?.subgenre_id ?? null,
        primaryTopicLabel: primaryTopic?.label ?? null,
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.cited_by_count - a.cited_by_count)
    .slice(0, 120);

  return { domain: domainSummary, shelves, archive };
}

/**
 * topics/{topicId}.json — for /domains/[slug]/topics/[topicId]
 *
 * Pre-computes ancestorTrail and grandchildren so the page component
 * does not need the full allSubgenres array.
 */
function buildTopicPageData(slug, topic, bundle, domainSummary, maps) {
  const { sourceById, assignmentById } = maps;
  const subgenres = bundle.subgenres;
  const topicById = new Map(subgenres.map((t) => [t.subgenre_id, t]));

  // Ancestor breadcrumb trail (excludes current topic; page appends itself)
  const ancestorTrail = [];
  let currentParentId = topic.parent_id;
  while (currentParentId) {
    const parent = topicById.get(currentParentId);
    if (!parent) break;
    ancestorTrail.unshift({
      href: `/domains/${slug}/topics/${parent.subgenre_id}`,
      label: capitalizeFirst(parent.label),
    });
    currentParentId = parent.parent_id;
  }

  // Children of current topic — include descendant papers in count
  const children = subgenres
    .filter((t) => t.parent_id === topic.subgenre_id)
    .map((c) => {
      const grandKids = subgenres.filter((t) => t.parent_id === c.subgenre_id);
      const effectiveIds = new Set([...c.paper_ids, ...grandKids.flatMap((g) => g.paper_ids)]);
      return { subgenre_id: c.subgenre_id, label: capitalizeFirst(c.label), paperCount: effectiveIds.size };
    });

  // Grandchildren keyed by child id (for display in child cards)
  const grandchildren = {};
  for (const child of children) {
    grandchildren[child.subgenre_id] = subgenres
      .filter((t) => t.parent_id === child.subgenre_id)
      .map((t) => ({ subgenre_id: t.subgenre_id, label: capitalizeFirst(t.label) }));
  }

  // Related topics: siblings ranked by entity/concept Jaccard similarity
  const { topicFingerprints } = maps;
  const selfFp = topicFingerprints.get(topic.subgenre_id) ?? new Set();
  const siblingTopics = subgenres
    .filter(
      (t) =>
        t.parent_id === topic.parent_id &&
        t.subgenre_id !== topic.subgenre_id
    )
    .map((t) => {
      const otherFp = topicFingerprints.get(t.subgenre_id) ?? new Set();
      let intersection = 0;
      for (const key of selfFp) {
        if (otherFp.has(key)) intersection++;
      }
      const union = selfFp.size + otherFp.size - intersection;
      const similarity = union > 0 ? Math.round((intersection / union) * 100) : 0;
      const tChildren = subgenres.filter((c) => c.parent_id === t.subgenre_id);
      const tEffective = new Set([...t.paper_ids, ...tChildren.flatMap((c) => c.paper_ids)]);
      return {
        subgenre_id: t.subgenre_id,
        label: capitalizeFirst(t.label),
        paperCount: tEffective.size,
        subtopicCount: tChildren.length,
        similarity,
      };
    })
    .sort((a, b) => b.similarity - a.similarity || b.paperCount - a.paperCount)
    .slice(0, 12);

  // Top papers for this topic — concentrated roots may have 0 direct paper_ids
  // after demotion to children, so aggregate descendants (children + grandchildren).
  const directChildren = subgenres.filter((t) => t.parent_id === topic.subgenre_id);
  const grandKidsAll = directChildren.flatMap((c) =>
    subgenres.filter((t) => t.parent_id === c.subgenre_id)
  );
  const effectivePaperIds = [...new Set([
    ...topic.paper_ids,
    ...directChildren.flatMap((c) => c.paper_ids),
    ...grandKidsAll.flatMap((g) => g.paper_ids),
  ])];
  const papers = effectivePaperIds
    .map((id) => mapTopicPaper(id, sourceById, assignmentById))
    .filter(Boolean)
    .sort((a, b) => b.adjusted_cited_by_count - a.adjusted_cited_by_count)
    .slice(0, 30);

  return {
    domain: domainSummary,
    topic: {
      subgenre_id: topic.subgenre_id,
      label: capitalizeFirst(topic.label),
      summary: sanitizeTopicSummary(topic.summary),
      paper_ids: topic.paper_ids,
      parent_id: topic.parent_id,
      level: topic.level,
      member_terms: topic.member_terms,
      top_entities: topic.top_entities,
      top_properties: topic.top_properties,
    },
    children,
    ancestorTrail,
    grandchildren,
    siblingTopics,
    papers,
  };
}

/** Compute related papers by Jaccard similarity on entity + concept fingerprints. */
function buildRelatedPapers(source, maps, limit = 8) {
  const { sourceById, sourcesByEntity, sourcesByConcept, entitiesBySource, paperFingerprints } = maps;
  const sid = source.source_id;
  const selfFp = paperFingerprints.get(sid) ?? new Set();
  const candidates = new Set();

  // Collect candidate papers via shared entities and concepts
  for (const entity of entitiesBySource.get(sid) ?? []) {
    for (const peerId of sourcesByEntity.get(entity.canonical_id) ?? []) {
      if (peerId !== sid) candidates.add(peerId);
    }
  }
  for (const concept of source.concepts ?? []) {
    for (const peerId of sourcesByConcept.get(concept) ?? []) {
      if (peerId !== sid) candidates.add(peerId);
    }
  }

  return Array.from(candidates)
    .map((peerId) => {
      const peer = sourceById.get(peerId);
      if (!peer) return null;
      const otherFp = paperFingerprints.get(peerId) ?? new Set();
      let intersection = 0;
      for (const key of selfFp) if (otherFp.has(key)) intersection++;
      const union = selfFp.size + otherFp.size - intersection;
      const similarity = union > 0 ? Math.round((intersection / union) * 100) : 0;
      return {
        source_id: peerId,
        title: peer.title,
        year: peer.year ?? null,
        cited_by_count: peer.cited_by_count ?? 0,
        similarity,
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.similarity - a.similarity || b.cited_by_count - a.cited_by_count)
    .slice(0, limit);
}

/** papers/{paperId}.json — for /domains/[slug]/papers/[paperId] */
function buildPaperPageData(slug, source, bundle, domainSummary, maps) {
  const { assignmentById, claimsBySource, entitiesBySource } = maps;
  const subgenres = bundle.subgenres;
  const topicById = new Map(subgenres.map((t) => [t.subgenre_id, t]));
  const assignment = assignmentById.get(source.source_id);

  const relatedPapers = buildRelatedPapers(source, maps);

  const claims = (claimsBySource.get(source.source_id) ?? []).map((c) => ({
    property_name: c.property_name,
    value_text: c.value_text,
    unit: c.unit ?? "",
    evidence_text: c.evidence_text ?? "",
    confidence: c.confidence ?? 0,
    polarity: c.polarity ?? "neutral",
    qualifiers: c.qualifiers ?? [],
  }));

  const entities = (entitiesBySource.get(source.source_id) ?? [])
    .sort((a, b) => b.evidence_count - a.evidence_count)
    .slice(0, 16)
    .map((e) => ({
      canonical_id: e.canonical_id,
      canonical_name: e.canonical_name,
      entity_type: e.entity_type,
      evidence_count: e.evidence_count,
    }));

  return {
    domain: domainSummary,
    paper: {
      source_id: source.source_id,
      title: source.title,
      year: source.year ?? null,
      url: source.url ?? source.doi ?? "#",
      doi: source.doi ?? null,
      short_summary: source.short_summary ?? "",
      cited_by_count: source.cited_by_count ?? 0,
      adjusted_cited_by_count: source.adjusted_cited_by_count ?? 0,
      concepts: source.concepts?.slice(0, 16) ?? [],
      assignment: assignment
        ? {
            confidence: assignment.confidence,
            score: assignment.score,
            matched_terms: assignment.matched_terms,
            secondary_subgenre_ids: assignment.secondary_subgenre_ids,
          }
        : null,
      authors: source.authors ?? [],
      claims,
      entities,
      primaryTopicId: assignment?.primary_subgenre_id ?? null,
      primaryTopicLabel: assignment?.primary_subgenre_id
        ? (topicById.get(assignment.primary_subgenre_id)?.label ??
          assignment.primary_subgenre_id)
        : null,
      secondaryTopicIds: assignment?.secondary_subgenre_ids ?? [],
      secondaryTopicLabels:
        assignment?.secondary_subgenre_ids?.map(
          (id) => topicById.get(id)?.label ?? id
        ) ?? [],
      relatedPapers,
    },
  };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

// Module-level domain fingerprints: slug → Set<string> (topic labels + entity ids)
const domainFingerprints = new Map();

async function processDomain(slug, portalData) {
  const bundlePath = path.join(SITE_DATA_ROOT, slug, "web-bundle.json");
  const sitePath = path.join(SITE_DATA_ROOT, slug, "site-data.json");

  const [bundle, siteDomainData] = await Promise.all([
    readJson(bundlePath),
    readJson(sitePath),
  ]);

  if (!bundle?.subgenres?.length) {
    console.warn(`  [skip] ${slug}: no subgenres in web-bundle.json`);
    return { topics: 0, papers: 0 };
  }

  // Build domain fingerprint for cross-domain similarity
  const domainFp = new Set();
  for (const sg of bundle.subgenres ?? []) domainFp.add("t:" + sg.label.toLowerCase());
  for (const ent of (bundle.entities ?? []).slice(0, 200)) domainFp.add("e:" + ent.canonical_id);
  domainFingerprints.set(slug, domainFp);

  const domainSummary = buildDomainSummary(slug, bundle, siteDomainData, portalData);
  const maps = buildSourceMaps(bundle);
  const domainDir = path.join(PAGE_DATA_ROOT, slug);
  const topicsDir = path.join(domainDir, "topics");
  const papersDir = path.join(domainDir, "papers");

  // All writes are independent — do them all in one pass
  await Promise.all([
    writeJson(path.join(domainDir, "summary.json"), domainSummary),
    writeJson(
      path.join(domainDir, "domain.json"),
      buildDomainPageData(slug, bundle, siteDomainData, domainSummary)
    ),
    writeJson(
      path.join(domainDir, "topics-index.json"),
      buildTopicsIndexData(slug, bundle, siteDomainData, domainSummary, maps)
    ),
    writeJson(
      path.join(domainDir, "papers-index.json"),
      buildPapersIndexData(slug, bundle, domainSummary, maps)
    ),
    ...bundle.subgenres.map((topic) =>
      writeJson(
        path.join(topicsDir, `${topic.subgenre_id}.json`),
        buildTopicPageData(slug, topic, bundle, domainSummary, maps)
      )
    ),
    ...bundle.sources.map((source) =>
      writeJson(
        path.join(papersDir, `${encodeSourceId(source.source_id)}.json`),
        buildPaperPageData(slug, source, bundle, domainSummary, maps)
      )
    ),
  ]);

  console.log(
    `  ${slug}: ${bundle.subgenres.length} topics, ${bundle.sources.length} papers`
  );
  return { topics: bundle.subgenres.length, papers: bundle.sources.length };
}

async function main() {
  console.log("Generating page data...");
  console.log(`  site-data: ${SITE_DATA_ROOT}`);
  console.log(`  page-data: ${PAGE_DATA_ROOT}`);

  const portalData = await readJson(path.join(SITE_DATA_ROOT, "portal-data.json"));

  // Write portal.json for home page / categories / domain list
  await writeJson(path.join(PAGE_DATA_ROOT, "portal.json"), portalData ?? {});

  // Collect domain slugs
  let slugs = portalData?.domains?.map((d) => d.slug).filter(Boolean) ?? [];
  if (slugs.length === 0) {
    // Fall back to directory scan
    const entries = await fs.readdir(SITE_DATA_ROOT, { withFileTypes: true });
    slugs = entries
      .filter(
        (e) =>
          e.isDirectory() &&
          !e.name.startsWith(".") &&
          e.name !== "domains"
      )
      .map((e) => e.name);
  }

  // Process all domains in parallel; collect counts from return values
  const results = await Promise.all(slugs.map((slug) => processDomain(slug, portalData)));
  const count = results.reduce(
    (acc, r) => ({ topics: acc.topics + (r?.topics ?? 0), papers: acc.papers + (r?.papers ?? 0) }),
    { topics: 0, papers: 0 }
  );

  // Add Jaccard similarity to relatedDomains in each domain.json
  await addDomainSimilarities(slugs);

  // Build and write search index
  await buildSearchIndex(slugs, portalData);

  console.log(
    `Done. ${slugs.length} domains, ${count.topics} topic files, ${count.papers} paper files.`
  );
}

async function addDomainSimilarities(slugs) {
  await Promise.all(
    slugs.map(async (slug) => {
      const domainPath = path.join(PAGE_DATA_ROOT, slug, "domain.json");
      const domain = await readJson(domainPath);
      if (!domain?.relatedDomains?.length) return;

      const selfFp = domainFingerprints.get(slug) ?? new Set();
      domain.relatedDomains = domain.relatedDomains
        .map((rd) => {
          const otherFp = domainFingerprints.get(rd.slug) ?? new Set();
          let intersection = 0;
          for (const key of selfFp) if (otherFp.has(key)) intersection++;
          const union = selfFp.size + otherFp.size - intersection;
          const similarity = union > 0 ? Math.round((intersection / union) * 100) : 0;
          return { ...rd, similarity };
        })
        .sort((a, b) => b.similarity - a.similarity);

      await writeJson(domainPath, domain);
    })
  );
}

async function buildSearchIndex(slugs, portalData) {
  const items = [];

  // Domain entries
  const domainMap = new Map((portalData?.domains ?? []).map((d) => [d.slug, d]));
  for (const slug of slugs) {
    const info = domainMap.get(slug);
    const title = info?.title ?? titleizeSlug(slug);
    items.push({ type: "domain", slug, title });
  }

  // Topic entries — read from already-written topics-index.json
  await Promise.all(
    slugs.map(async (slug) => {
      const info = domainMap.get(slug);
      const domainTitle = info?.title ?? titleizeSlug(slug);
      const indexPath = path.join(PAGE_DATA_ROOT, slug, "topics-index.json");
      const data = await readJson(indexPath);
      if (!data?.topics) return;
      for (const topic of data.topics) {
        items.push({
          type: "topic",
          domainSlug: slug,
          domainTitle,
          topicId: topic.subgenre_id,
          label: capitalizeFirst(topic.label),
          summary: topic.summary ? topic.summary.slice(0, 140) : "",
        });
        // Include child topics too
        for (const child of topic.children ?? []) {
          items.push({
            type: "topic",
            domainSlug: slug,
            domainTitle,
            topicId: child.subgenre_id,
            label: capitalizeFirst(child.label),
            summary: "",
          });
        }
      }
    })
  );

  await writeJson(path.join(PAGE_DATA_ROOT, "search-index.json"), items);
  console.log(`  search index: ${items.length} entries`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
