/**
 * LexiClean UI Core Control Interface.
 * Manages event lifecycle operations, network payloads, and UI updates.
 */

// Decoupled, rewritten endpoints referencing our custom API structures
const SERVICE_BASE_PATH = "http://127.0.0.1:8000/api/v1/nlp/lexical";
const SPACE_VECTOR_PATH = "http://127.0.0.1:8000/api/v1/vectors";

// Renamed UI component elements
const uiRawInput = document.getElementById("inputText");
const uiEngineStatus = document.getElementById("statusText");
const uiSpinner = document.getElementById("loadingBox");
const uiResultWindow = document.getElementById("resultPanel");
const uiHeaderTitle = document.getElementById("resultTitle");
const uiRenderArea = document.getElementById("resultContent");
const uiSubmitAllBtn = document.getElementById("analyzeBtn");
const uiLoadDemoBtn = document.getElementById("sampleBtn");
const uiExportBtn = document.getElementById("copyBtn");

const uiMetaText = document.getElementById("embeddingInfoText");
const uiVecInput = document.getElementById("embeddingText");
const uiKNeighbors = document.getElementById("embeddingTopK");
const uiProjAlgorithm = document.getElementById("embeddingMethod");
const uiGraphCap = document.getElementById("embeddingLimit");
const uiVectorSearchBtn = document.getElementById("embeddingRunBtn");
const uiRenderGraphBtn = document.getElementById("embeddingVizBtn");
const uiRandomDocBtn = document.getElementById("embeddingSampleCorpusBtn");
const uiVecStatus = document.getElementById("embeddingStatus");
const uiVectorDimensions = document.getElementById("embeddingVectorMeta");
const uiMatrixPanel = document.getElementById("embeddingVectorOutput");
const uiNeighborPanel = document.getElementById("embeddingNeighborsOutput");
const uiSvgPlotPanel = document.getElementById("embeddingPlotOutput");
const uiBadgeIndicator = document.getElementById("embeddingMethodBadge");

let activeDataPayload = null;
let corpusDocumentCache = [];

const fallbackSampleCorpus =
  "Apple is planning to open a new office in Bengaluru in 2027. " +
  "John and Priya visited New York last summer for an AI conference.";

const visualCategoryMap = {
  PERSON: "bg-rose-100 text-rose-800 border-rose-200",
  ORG: "bg-sky-100 text-sky-800 border-sky-200",
  GPE: "bg-emerald-100 text-emerald-800 border-emerald-200",
  DATE: "bg-amber-100 text-amber-900 border-amber-200",
  MONEY: "bg-lime-100 text-lime-900 border-lime-200",
};

function toggleActivityIndicator(activeState) {
  uiSpinner.classList.toggle("hidden", !activeState);
  uiSpinner.classList.toggle("flex", activeState);
}

function modifyFeedbackMessage(txt, isAlert = false) {
  uiEngineStatus.textContent = txt;
  uiEngineStatus.className = isAlert ? "text-sm text-rose-600" : "text-sm text-slate-500";
}

function processVerifiedInput() {
  const content = uiRawInput.value.trim();
  if (!content) {
    modifyFeedbackMessage("Please enter some text before running analysis.", true);
    uiRawInput.focus();
    return null;
  }
  return content;
}

async function transmitTextProcessing(targetPath, textString) {
  // Talks directly to our new remapped URL paths
  const linkTarget = `${SERVICE_BASE_PATH}/${targetPath}`;
  const response = await fetch(linkTarget, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: textString }),
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.detail || "Processing pipeline fault.");
  }
  return payload;
}

async function transmitVectorQuery(urlPath, requestConfig = {}) {
  const targetUrl = `${SPACE_VECTOR_PATH}${urlPath}`;
  const response = await fetch(targetUrl, requestConfig);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "Vector operations processing fault.");
  }
  return data;
}

function modifyVectorFeedback(txt, isAlert = false) {
  uiVecStatus.textContent = txt;
  uiVecStatus.className = isAlert ? "text-sm text-rose-600" : "text-sm text-slate-500";
}

function enforceNumericBounds(valueString, minimum, maximum, defaultReplacement) {
  const extractedInt = Number.parseInt(valueString, 10);
  if (Number.isNaN(extractedInt)) return defaultReplacement;
  return Math.max(minimum, Math.min(maximum, extractedInt));
}

function cleanHtmlEntities(rawString) {
  return rawString
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function buildArrayBadges(elements) {
  if (!elements || !elements.length) {
    return "<p class='text-slate-500'>No output returned.</p>";
  }
  const badgeHtml = elements
    .map(el => `<span class='rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700'>${cleanHtmlEntities(String(el))}</span>`)
    .join(" ");
  return `<div class='flex flex-wrap gap-2'>${badgeHtml}</div>`;
}

function buildPosMatrix(tagCollection) {
  if (!tagCollection || !tagCollection.length) {
    return "<p class='text-slate-500'>No POS tags found.</p>";
  }
  const tableRows = tagCollection
    .map(item => `
      <tr class='border-b border-slate-100'>
        <td class='px-3 py-2 font-medium text-slate-800'>${cleanHtmlEntities(item.token)}</td>
        <td class='px-3 py-2'>${cleanHtmlEntities(item.pos)}</td>
        <td class='px-3 py-2'>${cleanHtmlEntities(item.tag)}</td>
        <td class='px-3 py-2 text-slate-500'>${cleanHtmlEntities(item.description || "-")}</td>
      </tr>
    `).join("");

  return `
    <div class='overflow-x-auto'>
      <table class='w-full min-w-[600px] text-left text-xs sm:text-sm'>
        <thead>
          <tr class='bg-slate-100 text-slate-700'>
            <th class='px-3 py-2'>Token</th>
            <th class='px-3 py-2'>POS</th>
            <th class='px-3 py-2'>Tag</th>
            <th class='px-3 py-2'>Description</th>
          </tr>
        </thead>
        <tbody>${tableRows}</tbody>
      </table>
    </div>`;
}

function buildEntityBlocks(entityList) {
  if (!entityList || !entityList.length) {
    return "<p class='text-slate-500'>No named entities found.</p>";
  }
  const interfaceCards = entityList
    .map(entity => {
      const cssStyle = visualCategoryMap[entity.label] || "bg-violet-100 text-violet-800 border-violet-200";
      return `
        <div class='rounded-xl border px-3 py-2 ${cssStyle}'>
          <p class='text-sm font-semibold'>${cleanHtmlEntities(entity.text)}</p>
          <p class='text-xs'>${cleanHtmlEntities(entity.label)} - ${cleanHtmlEntities(entity.description || "-")}</p>
        </div>`;
    }).join("");
  return `<div class='grid gap-2 sm:grid-cols-2'>${interfaceCards}</div>`;
}

function resolveInterfaceView(endpointKey, jsonPayload) {
  // Maps the incoming backend keys securely to our processing render engines
  if (endpointKey === "parse-tokens")   return buildArrayBadges(jsonPayload.tokens);
  if (endpointKey === "parse-lemmas")   return buildArrayBadges(jsonPayload.lemmas);
  if (endpointKey === "parse-stems")    return buildArrayBadges(jsonPayload.stems);
  if (endpointKey === "classify-pos")   return buildPosMatrix(jsonPayload.pos_tags);
  if (endpointKey === "extract-ner")    return buildEntityBlocks(jsonPayload.entities);
  return "<p class='text-slate-500'>Unsupported operational view.</p>";
}

function buildComprehensiveView(jsonPayload) {
  return `
    <div class='space-y-6'>
      <div>
        <h3 class='mb-2 text-base font-semibold text-slate-800'>Tokens</h3>
        ${buildArrayBadges(jsonPayload.tokens)}
      </div>
      <div>
        <h3 class='mb-2 text-base font-semibold text-slate-800'>Lemmas</h3>
        ${buildArrayBadges(jsonPayload.lemmas)}
      </div>
      <div>
        <h3 class='mb-2 text-base font-semibold text-slate-800'>Stems</h3>
        ${buildArrayBadges(jsonPayload.stems)}
      </div>
      <div>
        <h3 class='mb-2 text-base font-semibold text-slate-800'>POS Tags</h3>
        ${buildPosMatrix(jsonPayload.pos_tags)}
      </div>
      <div>
        <h3 class='mb-2 text-base font-semibold text-slate-800'>Named Entities</h3>
        ${buildEntityBlocks(jsonPayload.entities)}
      </div>
    </div>`;
}

function presentDataResult(headerText, generatedHtml, structuredPayload) {
  uiHeaderTitle.textContent = headerText;
  uiRenderArea.innerHTML = generatedHtml;
  uiResultWindow.classList.remove("hidden");
  uiResultWindow.classList.add("fade-in");
  activeDataPayload = structuredPayload;
}

async function triggerSingleRoutePipeline(targetEndpoint) {
  const rawTextContent = processVerifiedInput();
  if (!rawTextContent) return;

  try {
    toggleActivityIndicator(true);
    modifyFeedbackMessage(`Running ${targetEndpoint}...`);
    const dataResponse = await transmitTextProcessing(targetEndpoint, rawTextContent);
    const layoutMarkup = resolveInterfaceView(targetEndpoint, dataResponse);
    presentDataResult(`Result: ${targetEndpoint}`, layoutMarkup, dataResponse);
    modifyFeedbackMessage(`Completed ${targetEndpoint}.`);
  } catch (error) {
    modifyFeedbackMessage(`Error: ${error.message}`, true);
  } finally {
    toggleActivityIndicator(false);
  }
}

async function triggerUnifiedPipeline() {
  const rawTextContent = processVerifiedInput();
  if (!rawTextContent) return;

  try {
    toggleActivityIndicator(true);
    modifyFeedbackMessage("Running complete analysis...");
    const dataResponse = await transmitTextProcessing("run-all", rawTextContent);
    const layoutMarkup = buildComprehensiveView(dataResponse);
    presentDataResult("Result: Analyze All", layoutMarkup, dataResponse);
    modifyFeedbackMessage("Completed full NLP analysis.");
  } catch (error) {
    modifyFeedbackMessage(`Error: ${error.message}`, true);
  } finally {
    toggleActivityIndicator(false);
  }
}

// Map the dataset attributes to matching endpoint calls
document.querySelectorAll("[data-endpoint]").forEach((btnElement) => {
  const routeNameMap = {
    "tokenize": "parse-tokens",
    "lemmatize": "parse-lemmas",
    "stem": "parse-stems",
    "pos-tag": "classify-pos",
    "ner": "extract-ner"
  };
  const activeEndpoint = routeNameMap[btnElement.dataset.endpoint] || btnElement.dataset.endpoint;
  btnElement.addEventListener("click", () => triggerSingleRoutePipeline(activeEndpoint));
});

uiSubmitAllBtn.addEventListener("click", triggerUnifiedPipeline);

uiLoadDemoBtn.addEventListener("click", () => {
  uiRawInput.value = fallbackSampleCorpus;
  modifyFeedbackMessage("Sample text loaded. Click any action button.");
});

// Embedded Vector spaces processing functions
function buildVectorPreviews(dimensionsArray) {
  if (!dimensionsArray || !dimensionsArray.length) {
    return "<p class='text-slate-500'>No vector values available.</p>";
  }
  const dynamicPreview = dimensionsArray.slice(0, 14);
  const badgeRows = dynamicPreview
    .map(val => `<span class='rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-800'>${Number(val).toFixed(4)}</span>`)
    .join(" ");

  return `
    <div class='flex flex-wrap gap-2'>${badgeRows}</div>
    <p class='mt-3 text-xs text-slate-500'>Showing first ${dynamicPreview.length} dimensions for readability.</p>`;
}

function buildNeighborBlocks(proximityCollection) {
  if (!proximityCollection || !proximityCollection.length) {
    return "<p class='text-slate-500'>No similar corpus entries were found.</p>";
  }
  return proximityCollection
    .map((docItem, index) => `
        <div class='flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2'>
          <div>
            <p class='font-medium text-slate-800'>${index + 1}. Doc ${docItem.doc_id}</p>
            <p class='text-xs text-slate-500'>${cleanHtmlEntities(docItem.text)}</p>
          </div>
          <span class='text-xs font-semibold text-slate-600'>cosine ${Number(docItem.score).toFixed(4)}</span>
        </div>
      `).join("");
}

function buildSvgGraph(coordinateSet) {
  if (!coordinateSet || !coordinateSet.length) {
    return "<p class='text-slate-500'>No projection points were returned.</p>";
  }
  const canvasWidth = 860;
  const canvasHeight = 360;
  const marginOffset = 36;

  const xCoordinates = coordinateSet.map(pt => pt.x);
  const yCoordinates = coordinateSet.map(pt => pt.y);

  const edgeMinX = Math.min(...xCoordinates);
  const edgeMaxX = Math.max(...xCoordinates);
  const edgeMinY = Math.min(...yCoordinates);
  const edgeMaxY = Math.max(...yCoordinates);

  const deltaX = edgeMaxX - edgeMinX || 1;
  const deltaY = edgeMaxY - edgeMinY || 1;

  const pointVisuals = coordinateSet
    .map((point, index) => {
      const pctX = (point.x - edgeMinX) / deltaX;
      const pctY = (point.y - edgeMinY) / deltaY;

      const plottingX = marginOffset + pctX * (canvasWidth - marginOffset * 2);
      const plottingY = canvasHeight - marginOffset - pctY * (canvasHeight - marginOffset * 2);
      const dotWeight = 3 + Math.min(3, point.importance * 35);
      const showTag = index < 24;

      return `
        <g>
          <circle cx='${plottingX.toFixed(2)}' cy='${plottingY.toFixed(2)}' r='${dotWeight.toFixed(2)}' fill='#0284c7' opacity='0.72'>
            <title>${cleanHtmlEntities(point.label)}: ${cleanHtmlEntities(point.text)}</title>
          </circle>
          ${showTag ? `<text x='${(plottingX + 5).toFixed(2)}' y='${(plottingY - 5).toFixed(2)}' class='plot-label'>${cleanHtmlEntities(point.label)}</text>` : ""}
        </g>`;
    }).join("");

  return `
    <svg viewBox='0 0 ${canvasWidth} ${canvasHeight}' class='h-[360px] w-full rounded-xl border border-slate-200 bg-white'>
      <line x1='${marginOffset}' y1='${canvasHeight - marginOffset}' x2='${canvasWidth - marginOffset}' y2='${canvasHeight - marginOffset}' stroke='#cbd5e1' />
      <line x1='${marginOffset}' y1='${marginOffset}' x2='${marginOffset}' y2='${canvasHeight - marginOffset}' stroke='#cbd5e1' />
      ${pointVisuals}
    </svg>`;
}

async function loadSpaceMetaData() {
  try {
    const responsePayload = await transmitVectorQuery("/info");
    uiMetaText.textContent = `${responsePayload.technique} | corpus docs: ${responsePayload.corpus_size} | vocabulary: ${responsePayload.vocabulary_size}`;
  } catch (err) {
    uiMetaText.textContent = "Embedding metadata could not be loaded.";
  }
}

async function fetchRemoteCorpusCache() {
  try {
    const dataResponse = await transmitVectorQuery("/corpus?limit=80");
    corpusDocumentCache = dataResponse.documents || [];
  } catch (err) {
    modifyVectorFeedback("Could not fetch corpus entries.", true);
  }
}

async function executeVectorLookupPipeline() {
  const inputString = uiVecInput.value.trim();
  if (!inputString) {
    modifyVectorFeedback("Please enter corpus-related text to retrieve embedding.", true);
    uiVecInput.focus();
    return;
  }

  const boundedKValue = enforceNumericBounds(uiKNeighbors.value, 1, 15, 5);
  uiKNeighbors.value = String(boundedKValue);

  try {
    toggleActivityIndicator(true);
    modifyVectorFeedback("Fetching corpus embedding and nearest entries...");

    const responseData = await transmitVectorQuery("/vector", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: inputString, top_k: boundedKValue }),
    });

    uiVectorDimensions.textContent = `Corpus query embedded | dimensions: ${responseData.dimension}`;
    uiMatrixPanel.innerHTML = buildVectorPreviews(responseData.vector || []);
    uiNeighborPanel.innerHTML = buildNeighborBlocks(responseData.neighbors || []);
    activeDataPayload = responseData;
    modifyVectorFeedback("Corpus embedding lookup completed.");
  } catch (error) {
    modifyVectorFeedback(`Error: ${error.message}`, true);
  } finally {
    toggleActivityIndicator(false);
  }
}

async function executeSpatialProjectionPipeline() {
  const chosenMethod = uiProjAlgorithm.value;
  const numericLimit = enforceNumericBounds(uiGraphCap.value, 10, 120, 40);
  uiGraphCap.value = String(numericLimit);

  try {
    toggleActivityIndicator(true);
    modifyVectorFeedback("Computing 2D projection...");

    const responseData = await transmitVectorQuery(`/visualize?method=${chosenMethod}&limit=${numericLimit}`);
    uiBadgeIndicator.textContent = responseData.method.toLowerCase() === "tsne" ? "t-SNE" : "PCA";
    uiSvgPlotPanel.innerHTML = buildSvgGraph(responseData.points || []);
    activeDataPayload = responseData;
    modifyVectorFeedback("Projection completed.");
  } catch (error) {
    modifyVectorFeedback(`Error: ${error.message}`, true);
  } finally {
    toggleActivityIndicator(false);
  }
}

uiVectorSearchBtn.addEventListener("click", executeVectorLookupPipeline);
uiRenderGraphBtn.addEventListener("click", executeSpatialProjectionPipeline);

uiRandomDocBtn.addEventListener("click", () => {
  if (!corpusDocumentCache.length) {
    modifyVectorFeedback("Corpus is still loading. Please try again.", true);
    return;
  }
  const selectionIndex = Math.floor(Math.random() * corpusDocumentCache.length);
  uiVecInput.value = corpusDocumentCache[selectionIndex].text;
  modifyVectorFeedback("Sample corpus text loaded. Click Get Embedding.");
});

uiExportBtn.addEventListener("click", async () => {
  if (!activeDataPayload) {
    modifyFeedbackMessage("No result available to copy.", true);
    return;
  }
  try {
    await navigator.clipboard.writeText(JSON.stringify(activeDataPayload, null, 2));
    modifyFeedbackMessage("Result copied to clipboard.");
  } catch (err) {
    modifyFeedbackMessage("Clipboard access failed in this browser context.", true);
  }
});

// Run metadata collection tasks on engine startup
loadSpaceMetaData();
fetchRemoteCorpusCache();