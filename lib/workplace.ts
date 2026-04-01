import { promises as fs } from "node:fs";
import path from "node:path";

type TopicSummaryRecord = {
  topic_label?: string;
  counts?: {
    sources?: number;
    entities?: number;
    claims?: number;
    auto_lexicon_entities?: number;
    auto_lexicon_properties?: number;
  };
  top_concepts?: Array<{ label: string; count: number }>;
  top_properties?: Array<{ label: string; count: number; units?: string[] }>;
};

export type DomainSummary = {
  slug: string;
  title: string;
  sources: number;
  entities: number;
  claims: number;
  topicCount: number;
  topConcepts: Array<{ label: string; count: number }>;
  overviewPapers: number;
  topicalPapers: number;
  facetCounts: Record<string, number>;
  hasDetail: boolean;
  abstractionLabel?: string;
};

export type DomainDetail = DomainSummary & {
  subgenres: Array<{
    subgenre_id: string;
    label: string;
    parent_id: string | null;
    level: number;
    member_terms: string[];
    paper_ids: string[];
    top_entities: string[];
    top_properties: string[];
    summary: string;
  }>;
  roleProfiles: Array<{
    label: string;
    semantic_role: string;
    topic_role: string;
    ui_role: string;
    confidence: number;
    evidence_count: number;
  }>;
  risingTopics?: Array<{
    id: string;
    label: string;
    trend: string;
    year_total?: number;
  }>;
  hierarchy?: {
    root_topics?: number;
    descendant_topics?: number;
    max_depth?: number;
    leaf_topics?: number;
  };
};

export type TopicPaper = {
  source_id: string;
  title: string;
  year: number | null;
  url: string;
  doi: string | null;
  short_summary: string;
  cited_by_count: number;
  adjusted_cited_by_count: number;
  concepts: string[];
  assignment: {
    confidence: number;
    score: number;
    matched_terms: string[];
    secondary_subgenre_ids: string[];
  } | null;
};

export type TopicDetail = {
  domain: DomainSummary;
  topic: DomainDetail["subgenres"][number];
  children: DomainDetail["subgenres"];
  papers: TopicPaper[];
};

export type PaperDetail = {
  domain: DomainSummary;
  paper: TopicPaper & {
    authors: string[];
    claims: Array<{
      property_name: string;
      value_text: string;
      unit: string;
      evidence_text: string;
      confidence: number;
      polarity: string;
      qualifiers: string[];
    }>;
    entities: Array<{
      canonical_id: string;
      canonical_name: string;
      entity_type: string;
      evidence_count: number;
    }>;
    primaryTopicId: string | null;
    secondaryTopicIds: string[];
  };
};

export type TopicAtlasItem = {
  subgenre_id: string;
  label: string;
  summary: string;
  paperCount: number;
  subtopicCount: number;
  tags: string[];
  trendScore: number;
  trendLabel: "rising" | "steady";
  children: Array<{
    subgenre_id: string;
    label: string;
    paperCount: number;
  }>;
  featuredPapers: TopicPaper[];
};

export type DomainTopicsIndex = {
  domain: DomainSummary;
  hierarchy: {
    maxDepth: number;
    rootTopics: number;
    descendantTopics: number;
    leafTopics: number;
  };
  topics: TopicAtlasItem[];
};

export type DomainPapersIndex = {
  domain: DomainSummary;
  shelves: Array<{
    topicId: string;
    topicLabel: string;
    papers: TopicPaper[];
  }>;
  archive: Array<TopicPaper & { primaryTopicId: string | null; primaryTopicLabel: string | null }>;
};

const SITE_ROOT_CANDIDATES = [
  process.env.NEXT_SITE_DATA_ROOT,
  path.join(process.cwd(), "site-data"),
  path.join(process.cwd(), "..", "site-data"),
].filter((value): value is string => Boolean(value));

type SiteDomainData = {
  slug: string;
  title: string;
  snapshot?: {
    papers?: number;
    topics?: number;
    subtopics?: number;
    entities?: number;
    claims?: number;
  };
  overview?: {
    partition_summary?: {
      overview_papers?: number;
      topical_papers?: number;
      facet_counts?: Record<string, number>;
    };
  };
  abstraction?: {
    label?: string;
  };
  hierarchy?: {
    root_topics?: number;
    descendant_topics?: number;
    max_depth?: number;
    leaf_topics?: number;
  };
  rising_topics?: Array<{
    id: string;
    label: string;
    trend: string;
    year_total?: number;
  }>;
  role_profiles?: DomainDetail["roleProfiles"];
  topic_year_counts?: Record<string, Record<string, number>>;
};

export type PortalCategory = {
  label: string;
  slug: string;
  description: string;
  count: number;
  domains: Array<{ slug: string; title: string }>;
};

export type PortalData = {
  updated_at?: string;
  total_domains?: number;
  categories?: PortalCategory[];
  domains?: Array<{
    slug: string;
    title: string;
    sources?: number;
    entities?: number;
    claims?: number;
    parent_subgenres?: number;
    overview_partition_summary?: {
      overview_papers?: number;
      topical_papers?: number;
      facet_counts?: Record<string, number>;
    };
    abstraction_label?: string;
  }>;
};

/** All workplace-shaped JSON merged for public deploy (see di_site_index._write_web_bundle). */
type WebBundle = {
  version?: number;
  subgenres: DomainDetail["subgenres"];
  sources: Array<{
    source_id: string;
    title: string;
    year?: number;
    url?: string;
    doi?: string;
    short_summary?: string;
    cited_by_count?: number;
    adjusted_cited_by_count?: number;
    concepts?: string[];
    authors?: string[];
  }>;
  paper_assignments: Array<{
    source_id: string;
    primary_subgenre_id: string;
    secondary_subgenre_ids: string[];
    confidence: number;
    score: number;
    matched_terms: string[];
  }>;
  claims: Array<{
    source_id: string;
    property_name: string;
    value_text: string;
    unit?: string;
    evidence_text?: string;
    confidence?: number;
    polarity?: string;
    qualifiers?: string[];
  }>;
  entities: Array<{
    canonical_id: string;
    canonical_name: string;
    entity_type: string;
    source_ids: string[];
    evidence_count: number;
  }>;
  topic_summary: Record<string, TopicSummaryRecord>;
  overview_partition_summary: {
    overview_papers?: number;
    topical_papers?: number;
    facet_counts?: Record<string, number>;
  };
  subgenre_hierarchy_summary: {
    max_depth?: number;
    root_topics?: number;
    descendant_topics?: number;
    leaf_topics?: number;
  };
};

async function readJson<T>(filePath: string): Promise<T | null> {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

async function readSiteDomainData(slug: string): Promise<SiteDomainData | null> {
  for (const root of SITE_ROOT_CANDIDATES) {
    const payload = await readJson<SiteDomainData>(path.join(root, slug, "site-data.json"));
    if (payload) {
      return payload;
    }
  }
  return null;
}

async function readWebBundle(slug: string): Promise<WebBundle | null> {
  for (const root of SITE_ROOT_CANDIDATES) {
    const payload = await readJson<WebBundle>(path.join(root, slug, "web-bundle.json"));
    if (payload?.subgenres?.length) {
      return payload;
    }
  }
  return null;
}

async function readPortalData(): Promise<PortalData | null> {
  for (const root of SITE_ROOT_CANDIDATES) {
    const payload = await readJson<PortalData>(path.join(root, "portal-data.json"));
    if (payload) {
      return payload;
    }
  }
  return null;
}

/** Portal index (`portal-data.json`) for category navigation and counts. */
export async function getPortalData(): Promise<PortalData | null> {
  return readPortalData();
}

export async function listPortalCategories(): Promise<PortalCategory[]> {
  const portal = await readPortalData();
  return portal?.categories ?? [];
}

export async function getCategoryBySlug(categorySlug: string): Promise<PortalCategory | null> {
  const cats = await listPortalCategories();
  return cats.find((c) => c.slug === categorySlug) ?? null;
}

export async function listCategorySlugs(): Promise<string[]> {
  const cats = await listPortalCategories();
  return cats.map((c) => c.slug).filter(Boolean).sort((a, b) => a.localeCompare(b));
}

function titleizeSlug(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function encodeSourceId(sourceId: string): string {
  return sourceId.split("/").pop() ?? sourceId;
}

function extractTopicSummary(
  slug: string,
  payload: Record<string, TopicSummaryRecord> | null
): TopicSummaryRecord | null {
  if (!payload) {
    return null;
  }

  return payload[slug] ?? Object.values(payload)[0] ?? null;
}

async function buildDomainSummary(slug: string): Promise<DomainSummary> {
  const [bundle, siteDomainData, portalData] = await Promise.all([
    readWebBundle(slug),
    readSiteDomainData(slug),
    readPortalData(),
  ]);

  const topicSummaryPayload = bundle?.topic_summary ?? null;
  const overviewPayload = bundle?.overview_partition_summary ?? null;
  const subgenresPayload = bundle?.subgenres ?? null;

  const topicSummary = extractTopicSummary(slug, topicSummaryPayload);
  const topicCount = subgenresPayload?.length ?? 0;
  const siteOverview = siteDomainData?.overview?.partition_summary;
  const siteSnapshot = siteDomainData?.snapshot;
  const portalDomain = portalData?.domains?.find((item) => item.slug === slug);
  const portalOverview = portalDomain?.overview_partition_summary;

  return {
    slug,
    title: portalDomain?.title ?? (siteDomainData?.title ? titleizeSlug(siteDomainData.title) : titleizeSlug(slug)),
    sources: portalDomain?.sources ?? siteSnapshot?.papers ?? topicSummary?.counts?.sources ?? 0,
    entities: portalDomain?.entities ?? siteSnapshot?.entities ?? topicSummary?.counts?.entities ?? 0,
    claims: portalDomain?.claims ?? siteSnapshot?.claims ?? topicSummary?.counts?.claims ?? 0,
    topicCount: portalDomain?.parent_subgenres ?? siteSnapshot?.topics ?? topicCount,
    topConcepts: topicSummary?.top_concepts?.slice(0, 5) ?? [],
    overviewPapers: portalOverview?.overview_papers ?? siteOverview?.overview_papers ?? overviewPayload?.overview_papers ?? 0,
    topicalPapers: portalOverview?.topical_papers ?? siteOverview?.topical_papers ?? overviewPayload?.topical_papers ?? topicSummary?.counts?.sources ?? 0,
    facetCounts: portalOverview?.facet_counts ?? siteOverview?.facet_counts ?? overviewPayload?.facet_counts ?? {},
    hasDetail: Boolean(topicSummaryPayload && subgenresPayload?.length),
    abstractionLabel: portalDomain?.abstraction_label ?? siteDomainData?.abstraction?.label,
  };
}

export async function listDomainSlugs(): Promise<string[]> {
  const portalData = await readPortalData();
  if (portalData?.domains?.length) {
    return portalData.domains
      .map((item) => item.slug)
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));
  }
  const slugs: string[] = [];
  for (const root of SITE_ROOT_CANDIDATES) {
    try {
      const entries = await fs.readdir(root, { withFileTypes: true });
      for (const entry of entries) {
        if (!entry.isDirectory()) {
          continue;
        }
        if (entry.name === "domains" || entry.name.startsWith(".")) {
          continue;
        }
        const bundlePath = path.join(root, entry.name, "web-bundle.json");
        try {
          await fs.access(bundlePath);
          slugs.push(entry.name);
        } catch {
          /* skip */
        }
      }
      if (slugs.length > 0) {
        return slugs.sort((a, b) => a.localeCompare(b));
      }
    } catch {
      /* try next root */
    }
  }
  return [];
}

export async function listDomains(): Promise<DomainSummary[]> {
  const portalData = await readPortalData();
  const portalDomains = portalData?.domains ?? [];
  const domains = portalDomains.length > 0
    ? await Promise.all(portalDomains.map((item) => buildDomainSummary(item.slug)))
    : await Promise.all((await listDomainSlugs()).map((slug) => buildDomainSummary(slug)));
  return domains.sort((a, b) => b.sources - a.sources || a.title.localeCompare(b.title));
}

export async function listPaperIdsForDomain(slug: string): Promise<string[]> {
  const bundle = await readWebBundle(slug);
  if (!bundle?.sources?.length) {
    return [];
  }
  return bundle.sources.map((item) => encodeSourceId(item.source_id));
}

export async function getDomainDetail(slug: string): Promise<DomainDetail | null> {
  const [summary, bundle, siteDomainData] = await Promise.all([
    buildDomainSummary(slug),
    readWebBundle(slug),
    readSiteDomainData(slug),
  ]);

  if (!bundle?.subgenres?.length) {
    return null;
  }

  return {
    ...summary,
    subgenres: bundle.subgenres,
    roleProfiles: siteDomainData?.role_profiles ?? [],
    risingTopics: siteDomainData?.rising_topics ?? [],
    hierarchy: siteDomainData?.hierarchy ?? bundle.subgenre_hierarchy_summary ?? {},
  };
}

/** Pre-render paths for `output: "export"` (topic detail pages). */
export async function listTopicStaticParams(): Promise<Array<{ slug: string; topicId: string }>> {
  const slugs = await listDomainSlugs();
  const out: Array<{ slug: string; topicId: string }> = [];
  for (const slug of slugs) {
    const detail = await getDomainDetail(slug);
    if (!detail) {
      continue;
    }
    for (const sg of detail.subgenres) {
      out.push({ slug, topicId: sg.subgenre_id });
    }
  }
  return out;
}

/** Pre-render paths for `output: "export"` (paper detail pages). */
export async function listPaperStaticParams(): Promise<Array<{ slug: string; paperId: string }>> {
  const slugs = await listDomainSlugs();
  const out: Array<{ slug: string; paperId: string }> = [];
  for (const slug of slugs) {
    const ids = await listPaperIdsForDomain(slug);
    for (const paperId of ids) {
      out.push({ slug, paperId });
    }
  }
  return out;
}

export async function getTopicDetail(
  slug: string,
  topicId: string
): Promise<TopicDetail | null> {
  const bundle = await readWebBundle(slug);
  const domain = await getDomainDetail(slug);

  if (!domain || !bundle) {
    return null;
  }

  const topic = domain.subgenres.find((item) => item.subgenre_id === topicId);

  if (!topic) {
    return null;
  }

  const assignmentsBySource = new Map(
    (bundle.paper_assignments ?? []).map((item) => [item.source_id, item] as const)
  );
  const sourceById = new Map(bundle.sources.map((item) => [item.source_id, item] as const));
  const topicPaperIds = new Set(topic.paper_ids);
  const papers = Array.from(topicPaperIds)
    .map((paperId) => {
      const source = sourceById.get(paperId);

      if (!source) {
        return null;
      }

      const assignment = assignmentsBySource.get(paperId);

      return {
        source_id: paperId,
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
    })
    .filter((paper): paper is TopicPaper => paper !== null)
    .sort((a, b) => b.adjusted_cited_by_count - a.adjusted_cited_by_count)
    .slice(0, 30);

  return {
    domain,
    topic,
    children: domain.subgenres.filter((item) => item.parent_id === topic.subgenre_id),
    papers,
  };
}

export async function getPaperDetail(
  slug: string,
  paperId: string
): Promise<PaperDetail | null> {
  const bundle = await readWebBundle(slug);
  const domain = await buildDomainSummary(slug);

  if (!bundle) {
    return null;
  }

  const sources = bundle.sources;
  const assignments = bundle.paper_assignments ?? [];
  const claims = bundle.claims ?? [];
  const entities = bundle.entities ?? [];

  const source = sources.find((item) => encodeSourceId(item.source_id) === paperId);

  if (!source) {
    return null;
  }

  const assignment = assignments.find((item) => item.source_id === source.source_id) ?? null;
  const paperClaims = claims
    .filter((item) => item.source_id === source.source_id)
    .map((item) => ({
      property_name: item.property_name,
      value_text: item.value_text,
      unit: item.unit ?? "",
      evidence_text: item.evidence_text ?? "",
      confidence: item.confidence ?? 0,
      polarity: item.polarity ?? "neutral",
      qualifiers: item.qualifiers ?? [],
    }));
  const paperEntities = entities
    .filter((item) => item.source_ids.includes(source.source_id))
    .sort((a, b) => b.evidence_count - a.evidence_count)
    .slice(0, 16)
    .map((item) => ({
      canonical_id: item.canonical_id,
      canonical_name: item.canonical_name,
      entity_type: item.entity_type,
      evidence_count: item.evidence_count,
    }));

  return {
    domain,
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
      claims: paperClaims,
      entities: paperEntities,
      primaryTopicId: assignment?.primary_subgenre_id ?? null,
      secondaryTopicIds: assignment?.secondary_subgenre_ids ?? [],
    },
  };
}

function computeTrendScore(years: Record<string, number> | undefined): number {
  if (!years) {
    return 0;
  }

  const current = (years["2026"] ?? 0) + (years["2025"] ?? 0);
  const previous = (years["2024"] ?? 0) + (years["2023"] ?? 0);

  if (previous <= 0) {
    return current > 0 ? 1 : 0;
  }

  return (current - previous) / previous;
}

async function loadDomainSourceMaps(slug: string) {
  const bundle = await readWebBundle(slug);
  if (!bundle) {
    return { sourceById: new Map(), assignmentById: new Map() };
  }
  const sources = bundle.sources;
  const assignments = bundle.paper_assignments ?? [];
  const sourceById = new Map(sources.map((item) => [item.source_id, item] as const));
  const assignmentById = new Map(assignments.map((item) => [item.source_id, item] as const));

  return { sourceById, assignmentById };
}

function mapTopicPaper(
  sourceId: string,
  sourceById: Map<string, {
    source_id: string;
    title: string;
    year?: number;
    url?: string;
    doi?: string;
    short_summary?: string;
    cited_by_count?: number;
    adjusted_cited_by_count?: number;
    concepts?: string[];
  }>,
  assignmentById: Map<string, {
    source_id: string;
    primary_subgenre_id: string;
    secondary_subgenre_ids: string[];
    confidence: number;
    score: number;
    matched_terms: string[];
  }>
): TopicPaper | null {
  const source = sourceById.get(sourceId);

  if (!source) {
    return null;
  }

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

export async function getDomainTopicsIndex(slug: string): Promise<DomainTopicsIndex | null> {
  const [domain, siteDomainData, maps] = await Promise.all([
    getDomainDetail(slug),
    readSiteDomainData(slug),
    loadDomainSourceMaps(slug),
  ]);

  if (!domain) {
    return null;
  }

  const topicYearCounts = siteDomainData?.topic_year_counts;
  const hierarchySummary = siteDomainData?.hierarchy ?? (await readWebBundle(slug))?.subgenre_hierarchy_summary;

  const rootTopics = domain.subgenres.filter((item) => item.parent_id === null);
  const topics = rootTopics
    .map((topic) => {
      const children = domain.subgenres.filter((item) => item.parent_id === topic.subgenre_id);
      const trendScore = computeTrendScore(topicYearCounts?.[topic.label]);
      const featuredPapers = topic.paper_ids
        .map((paperId) => mapTopicPaper(paperId, maps.sourceById, maps.assignmentById))
        .filter((paper): paper is TopicPaper => paper !== null)
        .sort((a, b) => b.cited_by_count - a.cited_by_count)
        .slice(0, 3);

      return {
        subgenre_id: topic.subgenre_id,
        label: topic.label,
        summary: topic.summary,
        paperCount: topic.paper_ids.length,
        subtopicCount: children.length,
        tags: topic.member_terms.slice(0, 4),
        trendScore,
        trendLabel: trendScore > -0.12 ? "rising" : "steady",
        children: children
          .map((child) => ({
            subgenre_id: child.subgenre_id,
            label: child.label,
            paperCount: child.paper_ids.length,
          }))
          .sort((a, b) => b.paperCount - a.paperCount)
          .slice(0, 6),
        featuredPapers,
      } satisfies TopicAtlasItem;
    })
    .sort((a, b) => b.trendScore - a.trendScore || b.paperCount - a.paperCount);

  return {
    domain,
    hierarchy: {
      maxDepth: hierarchySummary?.max_depth ?? 0,
      rootTopics: hierarchySummary?.root_topics ?? rootTopics.length,
      descendantTopics: hierarchySummary?.descendant_topics ?? 0,
      leafTopics: hierarchySummary?.leaf_topics ?? 0,
    },
    topics,
  };
}

export async function getDomainPapersIndex(slug: string): Promise<DomainPapersIndex | null> {
  const domain = await getDomainDetail(slug);

  if (!domain) {
    return null;
  }

  const maps = await loadDomainSourceMaps(slug);
  const topicMap = new Map(domain.subgenres.map((item) => [item.subgenre_id, item] as const));
  const rootTopics = domain.subgenres.filter((item) => item.parent_id === null);

  const shelves = rootTopics
    .map((topic) => ({
      topicId: topic.subgenre_id,
      topicLabel: topic.label,
      papers: topic.paper_ids
        .map((paperId) => mapTopicPaper(paperId, maps.sourceById, maps.assignmentById))
        .filter((paper): paper is TopicPaper => paper !== null)
        .sort((a, b) => b.cited_by_count - a.cited_by_count)
        .slice(0, 6),
    }))
    .filter((item) => item.papers.length > 0)
    .sort((a, b) => b.papers[0]!.cited_by_count - a.papers[0]!.cited_by_count);

  const archive = Array.from(maps.sourceById.values())
    .map((source) => {
      const paper = mapTopicPaper(source.source_id, maps.sourceById, maps.assignmentById);

      if (!paper) {
        return null;
      }

      const assignment = maps.assignmentById.get(source.source_id);
      const primaryTopic = assignment?.primary_subgenre_id
        ? topicMap.get(assignment.primary_subgenre_id) ?? null
        : null;

      return {
        ...paper,
        primaryTopicId: primaryTopic?.subgenre_id ?? null,
        primaryTopicLabel: primaryTopic?.label ?? null,
      };
    })
    .filter((paper): paper is DomainPapersIndex["archive"][number] => paper !== null)
    .sort((a, b) => b.cited_by_count - a.cited_by_count)
    .slice(0, 120);

  return {
    domain,
    shelves,
    archive,
  };
}
